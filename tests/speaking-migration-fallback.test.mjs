import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { isMissingSchema, logMigrationPending } from '../netlify/functions/_shared/migrationPending.mjs';
import { closeOutSession, creditWallet, reserveTurn, settleTurn, usageIdForToken } from '../netlify/functions/_shared/speakingCloseout.mjs';
import { SPEAKING_LEVELS, HISTORY_MESSAGES } from '../netlify/functions/_shared/speakingAI.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const stripImports = (source) => source.replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm, '');
const missingCodes = ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42P01', '42703'];
const userId = '11111111-1111-4111-8111-111111111111';
const token = 'sp_aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const headers = { authorization: 'Bearer verified' };
const currentSession = (extra = {}) => ({
  user_id: userId, session_token: token, level: 'A1.1', mode: 'free', status: 'active',
  started_at: new Date().toISOString(), planned_minutes: 5, cost_cents: 0, ...extra,
});

function fakeDb({ code = 'PGRST202', rpcErrors = {}, failures = {}, seed = {} } = {}) {
  const tables = {
    profiles: [{ id: userId, subscription_tier: 'pro' }],
    speaking_usage: [], speaking_sessions: [], speaking_messages: [],
    speaking_wallet: [{ user_id: userId, balance_cents: 500 }], speaking_wallet_transactions: [],
    ...structuredClone(seed),
  };
  const calls = [];
  class Query {
    constructor(table) { this.table = table; this.op = 'select'; this.filters = []; }
    select(_columns, options = {}) { this.head = options.head; return this; }
    order() { return this; }
    limit() { return this; }
    range(start, end) { this.rangeStart = start; this.rangeEnd = end; return this; }
    eq(key, value) { this.filters.push((row) => row[key] === value); return this; }
    neq(key, value) { this.filters.push((row) => row[key] !== value); return this; }
    gte(key, value) { this.filters.push((row) => row[key] >= value); return this; }
    update(patch) { this.op = 'update'; this.patch = patch; return this; }
    insert(rows) { this.op = 'insert'; this.rows = [].concat(rows); return this; }
    delete() { this.op = 'delete'; return this; }
    maybeSingle() { this.single = true; return this; }
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        calls.push(`${this.table}:${this.op}`);
        const failure = failures[`${this.table}:${this.op}`];
        if (failure === 'throw') throw new Error('legacy operation threw');
        if (failure) return { error: { code: '42501', message: 'legacy operation failed' } };
        const rows = tables[this.table];
        const matches = (row) => this.filters.every((filter) => filter(row));
        if (this.op === 'insert') { rows.push(...this.rows.map((row) => ({ ...row }))); return { error: null }; }
        if (this.op === 'delete') { tables[this.table] = rows.filter((row) => !matches(row)); return { error: null }; }
        let selected = rows.filter(matches);
        const count = selected.length;
        if (this.rangeStart !== undefined) selected = selected.slice(this.rangeStart, this.rangeEnd + 1);
        if (this.op === 'update') selected.forEach((row) => Object.assign(row, this.patch));
        return { data: this.head ? null : this.single ? (selected[0] || null) : selected.map((row) => ({ ...row })), error: null, count };
      }).then(resolve, reject);
    }
  }
  return {
    from: (table) => new Query(table), calls, tables,
    rpc: async (name, args) => {
      calls.push(name);
      if (rpcErrors[name]) return { error: rpcErrors[name] };
      if (name === 'debit_speaking_wallet') {
        const wallet = tables.speaking_wallet.find((row) => row.user_id === args.p_user_id);
        if (!wallet || wallet.balance_cents < args.p_cost) return { data: -1 };
        wallet.balance_cents -= args.p_cost;
        return { data: wallet.balance_cents };
      }
      return { error: { code, message: 'migration not applied' } };
    },
  };
}

function loadUsage(db) {
  const mocks = { supabase: db, closeOutSession, creditWallet, usageIdForToken, isMissingSchema, logMigrationPending };
  const source = stripImports(read('netlify/functions/_shared/speakingUsage.mjs')).replaceAll('export async function', 'async function');
  return new Function(...Object.keys(mocks), `${source}; return { checkUsage, reserveSession };`)(...Object.values(mocks));
}
class AIError extends Error {}
function loadHandler(path, db, overrides = {}) {
  const usage = loadUsage(db);
  const mocks = {
    randomUUID, supabase: db, supabaseKey: 'configured', ...usage,
    CLOSEOUT_COLUMNS: '', closeOutSession, closeOutStaleSessions: async () => ({}),
    SESSION_GRACE_MINUTES: 2, reserveTurn, settleTurn,
    getAuthenticatedUserId: async () => userId, unauthorizedResponse: () => ({ statusCode: 401 }),
    AIError, SPEAKING_LEVELS, HISTORY_MESSAGES, buildTeacherSystemPrompt: () => 'system', courseTaskColumns: () => ({}),
    parseCourseTask: () => null, taskFromSession: () => null,
    teacherReply: async () => { db.calls.push('teacher'); return 'Hallo!'; },
    synthesizeSpeech: async () => { db.calls.push('tts'); return 'audio'; },
    synthesizeFixedLine: async () => { db.calls.push('tts'); return 'audio'; },
    transcribeAudio: async () => { db.calls.push('stt'); return 'Guten Tag'; },
    ...overrides,
  };
  const source = stripImports(read(path)).replace('export const handler', 'const handler');
  return new Function(...Object.keys(mocks), `${source}; return handler;`)(...Object.values(mocks));
}
const startEvent = (minutes = 5) => ({ httpMethod: 'POST', headers, body: JSON.stringify({ action: 'start', level: 'A1.1', minutes }) });
const turnEvent = () => ({ httpMethod: 'POST', headers, body: JSON.stringify({ sessionToken: token, audioBase64: 'audio' }) });
const providers = (db) => db.calls.filter((call) => ['stt', 'teacher', 'tts'].includes(call));

test('missing speaking usage RPC counts old rows, enforces Pro 30/month and avoids double counting linked sessions', async () => {
  for (const code of missingCodes) {
    const rows = Array.from({ length: 29 }, (_, id) => ({ id: String(id), user_id: userId, created_at: new Date().toISOString() }));
    const db = fakeDb({ code, seed: { speaking_usage: rows, speaking_sessions: [currentSession()] } });
    const usage = await loadUsage(db).checkUsage(userId);
    assert.equal(usage.allowed, false, code);
    assert.equal(usage.used, 30, code);
    assert.equal(usage.limit, 30);
    assert.equal(usage.reason, 'monthly_limit_reached');
    db.tables.speaking_usage[0].id = usageIdForToken(token);
    assert.equal((await loadUsage(db).checkUsage(userId)).used, 29, 'one session appears in both old tables');
    db.tables.speaking_sessions[0].status = 'cancelled';
    assert.equal((await loadUsage(db).checkUsage(userId)).used, 29, 'cancelled sessions release their allowance');
  }
  const db = fakeDb({ seed: { profiles: [{ id: userId, trial_ends_at: '2099-01-01' }], speaking_usage: [{ id: 'old', user_id: userId, created_at: '2020-01-01' }] } });
  assert.deepEqual(await loadUsage(db).checkUsage(userId), { allowed: true, used: 1, limit: 2, tier: 'free_trial' });
});

test('speaking usage non-missing RPC errors and failed legacy counts fail closed', async () => {
  const db = fakeDb({ code: '42501' });
  await assert.rejects(loadUsage(db).checkUsage(userId), /allowance could not be checked/);
  assert.deepEqual(db.calls, ['profiles:select', 'speaking_usage_status']);
  for (const table of ['speaking_usage', 'speaking_sessions']) {
    const failed = fakeDb({ failures: { [`${table}:select`]: true } });
    await assert.rejects(loadUsage(failed).checkUsage(userId), /allowance could not be checked/);
  }
});

test('missing speaking start RPC reserves old session and usage rows before opening providers', async () => {
  for (const code of missingCodes) {
    const db = fakeDb({ code });
    const handler = loadHandler('netlify/functions/speaking-session.mjs', db);
    assert.equal((await handler(startEvent())).statusCode, 200, code);
    assert.equal(db.tables.speaking_usage.length, 1);
    assert.equal(db.tables.speaking_usage[0].id, usageIdForToken(db.tables.speaking_sessions[0].session_token));
    assert.ok(db.calls.indexOf('speaking_sessions:insert') < db.calls.indexOf('teacher'));
    assert.ok(db.calls.indexOf('speaking_usage:insert') < db.calls.indexOf('teacher'));
    assert.deepEqual(providers(db), ['teacher', 'tts']);
  }
});

test('missing speaking start RPC still blocks providers when any legacy reservation write fails', async () => {
  for (const code of missingCodes) {
    const db = fakeDb({ code, failures: { 'speaking_usage:insert': true } });
    const response = await loadHandler('netlify/functions/speaking-session.mjs', db)(startEvent());
    assert.equal(response.statusCode, 500, code);
    assert.deepEqual(providers(db), []);
    assert.equal(db.tables.speaking_sessions[0].status, 'cancelled');
  }
  const db = fakeDb({ failures: { 'speaking_sessions:insert': true } });
  assert.equal((await loadHandler('netlify/functions/speaking-session.mjs', db)(startEvent())).statusCode, 500);
  assert.deepEqual(providers(db), []);
});

test('missing speaking start RPC debits and records old wallet before providers, with failed debits or ledger writes blocked', async () => {
  const db = fakeDb();
  const response = await loadHandler('netlify/functions/speaking-session.mjs', db)(startEvent(10));
  assert.equal(response.statusCode, 200);
  assert.equal(db.tables.speaking_wallet[0].balance_cents, 300);
  assert.equal(db.tables.speaking_wallet_transactions[0].amount_cents, -200);
  assert.ok(db.calls.indexOf('debit_speaking_wallet') < db.calls.indexOf('teacher'));
  assert.ok(db.calls.indexOf('speaking_wallet_transactions:insert') < db.calls.indexOf('teacher'));
  for (const options of [
    { rpcErrors: { debit_speaking_wallet: { code: '42501' } } },
    { failures: { 'speaking_wallet_transactions:insert': true } },
    { seed: { speaking_wallet: [{ user_id: userId, balance_cents: 0 }] } },
  ]) {
    const failed = fakeDb(options);
    const outcome = await loadHandler('netlify/functions/speaking-session.mjs', failed)(startEvent(10));
    assert.ok([402, 500].includes(outcome.statusCode));
    assert.deepEqual(providers(failed), []);
  }
});

test('non-missing speaking start RPC error fails closed without trying old writes or providers', async () => {
  const db = fakeDb({ rpcErrors: { reserve_speaking_session: { code: '42501' } } });
  const response = await loadHandler('netlify/functions/speaking-session.mjs', db)(startEvent());
  assert.equal(response.statusCode, 500);
  assert.deepEqual(providers(db), []);
  assert.ok(!db.calls.includes('speaking_sessions:insert'));
});

test('missing speaking turn RPC uses an owned active old session write before all providers', async () => {
  for (const code of missingCodes) {
    const db = fakeDb({ code, seed: { speaking_sessions: [currentSession()] } });
    const response = await loadHandler('netlify/functions/speaking-turn.mjs', db)(turnEvent());
    assert.equal(response.statusCode, 200, code);
    assert.ok(db.calls.indexOf('speaking_sessions:update') < db.calls.indexOf('stt'));
    assert.deepEqual(providers(db), ['stt', 'teacher', 'tts']);
    assert.equal(db.tables.speaking_messages.filter((row) => row.role === 'user').length, 1);
    assert.ok(!db.calls.includes('settle_speaking_turn'), 'legacy turns do not switch to the new ledger during a migration');
  }
});

test('missing speaking turn RPC blocks providers on a failed old write, closed or expired session', async () => {
  for (const code of missingCodes) {
    const db = fakeDb({ code, failures: { 'speaking_sessions:update': true }, seed: { speaking_sessions: [currentSession()] } });
    assert.equal((await loadHandler('netlify/functions/speaking-turn.mjs', db)(turnEvent())).statusCode, 500, code);
    assert.deepEqual(providers(db), []);
  }
  for (const extra of [{ status: 'cancelled' }, { user_id: 'another-user' }, { started_at: '2020-01-01T00:00:00Z' }]) {
    const db = fakeDb({ seed: { speaking_sessions: [currentSession(extra)] } });
    assert.equal((await reserveTurn(db, token, userId, randomUUID())).ok, false);
    assert.deepEqual(providers(db), []);
  }
});

test('non-missing speaking turn reservation and settlement RPC errors fail closed', async () => {
  const db = fakeDb({ rpcErrors: { reserve_speaking_turn: { code: '42501' } }, seed: { speaking_sessions: [currentSession()] } });
  assert.equal((await loadHandler('netlify/functions/speaking-turn.mjs', db)(turnEvent())).statusCode, 500);
  assert.deepEqual(providers(db), []);
  assert.ok(!db.calls.includes('speaking_sessions:update'));
  await assert.rejects(settleTurn(fakeDb({ code: '42501' }), token, userId, randomUUID(), true));
});

test('missing speaking settlement RPC closes from old server messages and releases only linked allowance', async () => {
  for (const code of missingCodes) {
    const row = currentSession();
    const db = fakeDb({ code, seed: { speaking_sessions: [row], speaking_usage: [
      { id: usageIdForToken(token), user_id: userId }, { id: 'another-session', user_id: userId },
    ] } });
    const result = await closeOutSession(db, row);
    assert.equal(result.closed, true, code);
    assert.equal(result.status, 'cancelled');
    assert.equal(result.released, true);
    assert.deepEqual(db.tables.speaking_usage.map((entry) => entry.id), ['another-session']);
    assert.equal((await closeOutSession(db, row)).closed, false, 'only one active status update can release usage');
    await settleTurn(db, token, userId, randomUUID(), false);
  }
  const row = currentSession({ cost_cents: 200 });
  const db = fakeDb({ seed: { speaking_sessions: [row], speaking_messages: [{ session_token: token, role: 'user', created_at: new Date().toISOString() }] } });
  const result = await closeOutSession(db, row);
  assert.equal(result.status, 'completed');
  assert.equal(result.userTurns, 1);
  assert.equal(db.tables.speaking_wallet[0].balance_cents, 500);
});

test('missing speaking settlement RPC restores old paid refunds exactly once, and failed counts or updates stop closeout', async () => {
  const row = currentSession({ cost_cents: 200 });
  const db = fakeDb({ seed: { speaking_sessions: [row] } });
  assert.equal((await closeOutSession(db, row)).refundCents, 200);
  assert.equal(db.tables.speaking_wallet[0].balance_cents, 700);
  assert.equal((await closeOutSession(db, row)).closed, false);
  assert.equal(db.tables.speaking_wallet[0].balance_cents, 700);
  for (const failure of ['speaking_messages:select', 'speaking_sessions:update']) {
    const failed = fakeDb({ failures: { [failure]: true }, seed: { speaking_sessions: [row] } });
    assert.equal((await closeOutSession(failed, row)).closed, false);
    assert.equal(failed.tables.speaking_sessions[0].status, 'active');
    assert.equal(failed.tables.speaking_wallet[0].balance_cents, 500);
  }
  const denied = fakeDb({ code: '42501', seed: { speaking_sessions: [row] } });
  assert.deepEqual(await closeOutSession(denied, row), { closed: false, error: 'settlement_failed' });
  assert.deepEqual(denied.calls, ['settle_speaking_session']);
});


test('speaking usage fallback uses an exact lifetime count and pages current usage beyond the REST row limit', async () => {
  const rows = Array.from({ length: 1105 }, (_, id) => ({ id: String(id), user_id: userId, created_at: '2020-01-01T00:00:00Z' }));
  const db = fakeDb({ seed: { speaking_usage: rows } });
  assert.equal((await loadUsage(db).checkUsage(userId)).used, 0, 'old rows do not hide current monthly usage');
  db.tables.profiles[0] = { id: userId, trial_ends_at: '2099-01-01' };
  assert.equal((await loadUsage(db).checkUsage(userId)).used, 1105, 'lifetime trial count is exact');
  db.tables.profiles[0] = { id: userId, subscription_tier: 'pro' };
  db.tables.speaking_usage.forEach((row) => { row.created_at = new Date().toISOString(); });
  assert.equal((await loadUsage(db).checkUsage(userId)).used, 1105, 'all monthly REST pages are counted');
});

test('a legacy speaking turn keeps its reply when the migration is applied during provider work', async () => {
  const db = fakeDb({ seed: { speaking_sessions: [currentSession()] } });
  const originalRpc = db.rpc;
  let applied = false;
  db.rpc = async (name, args) => {
    if (applied && name === 'settle_speaking_turn') return { data: false };
    return originalRpc(name, args);
  };
  const handler = loadHandler('netlify/functions/speaking-turn.mjs', db, {
    transcribeAudio: async () => { applied = true; db.calls.push('stt'); return 'Guten Tag'; },
  });
  const response = await handler(turnEvent());
  assert.equal(response.statusCode, 200);
  assert.deepEqual(providers(db), ['stt', 'teacher', 'tts']);
  assert.equal(db.tables.speaking_messages.length, 2);
});


test('failed and thrown legacy session inserts refund a wallet debit before any provider call', async () => {
  for (const failure of [true, 'throw']) {
    const db = fakeDb({ failures: { 'speaking_sessions:insert': failure } });
    assert.equal((await loadHandler('netlify/functions/speaking-session.mjs', db)(startEvent(10))).statusCode, 500);
    assert.deepEqual(providers(db), []);
    assert.equal(db.tables.speaking_wallet[0].balance_cents, 500, String(failure));
    assert.equal(db.tables.speaking_sessions.length, 0);
  }
});

test('legacy speaking opening failures release the linked allowance or refund the prior debit', async () => {
  for (const minutes of [5, 10]) {
    const db = fakeDb();
    const handler = loadHandler('netlify/functions/speaking-session.mjs', db, {
      teacherReply: async () => { throw new AIError('opening unavailable'); },
    });
    assert.equal((await handler(startEvent(minutes))).statusCode, 502);
    assert.equal(db.tables.speaking_sessions[0].status, 'cancelled');
    assert.equal(db.tables.speaking_wallet[0].balance_cents, 500);
    assert.equal(db.tables.speaking_usage.length, 0);
    assert.deepEqual(providers(db), []);
  }
});
