import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { reserveUsage, validAnonymousId } from '../netlify/functions/_shared/aiReservation.mjs';
import { isMissingSchema, logMigrationPending } from '../netlify/functions/_shared/migrationPending.mjs';
import { uaClass, cleanSource } from '../netlify/functions/_shared/xraySource.mjs';

const source = readFileSync(new URL('../netlify/functions/analyze-sentence.mjs', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace('export const handler', 'const handler');
const event = { httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': '192.0.2.1' },
  body: JSON.stringify({ sentence: 'Guten Tag.', anonymousId: 'browser-anon-123' }) };
const missingCodes = ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42P01', '42703'];

function fixture({ rpcError = { code: 'PGRST202' }, insertError = null, countError = null,
  used = 0, ipUsed = 0, missingSource = false, upstreamOk = true, userId = null } = {}) {
  const state = { queries: [], writes: [], rows: [], providerCalls: 0, rpcCalls: 0 };
  const db = {
    async rpc() {
      state.rpcCalls++;
      return rpcError ? { error: rpcError } : { data: { allowed: true, used: 0, id: 'atomic-row' } };
    },
    from(table) {
      assert.ok(['xray_usage', 'profiles'].includes(table));
      const filters = [];
      let row;
      let deleting = false;
      const query = {
        select() { return query; },
        gte(key, value) { filters.push([key, value]); return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        is(key, value) { filters.push([key, value]); return query; },
        insert(value) { row = value; state.writes.push(value); return query; },
        delete() { deleting = true; return query; },
        maybeSingle: async () => ({ data: { subscription_tier: 'pro' } }),
        single: async () => {
          if (insertError) return { error: insertError };
          if (missingSource && Object.hasOwn(row, 'source')) return { error: { code: 'PGRST204', message: 'source missing' } };
          state.rows.push({ ...row, id: 'legacy-row' });
          return { data: { id: 'legacy-row' } };
        },
        then(resolve, reject) {
          state.queries.push(filters);
          if (deleting) {
            state.rows.length = 0;
            return Promise.resolve({ error: null }).then(resolve, reject);
          }
          const count = filters.some(([key]) => key === 'ip_hash') ? ipUsed : used;
          return Promise.resolve({ count, error: countError }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const context = vm.createContext({
    process: { env: { ANTHROPIC_API_KEY: 'test-key', SUPABASE_SERVICE_ROLE_KEY: 'test-key', IP_HASH_SALT: 'test-salt' } },
    createClient: () => db, createHash, reserveUsage, validAnonymousId,
    isMissingSchema, logMigrationPending, uaClass, cleanSource,
    getAuthenticatedUserId: async () => userId,
    console: { log() {}, warn() {}, error() {} },
    fetch: async () => {
      if (rpcError) assert.equal(state.rows.length, 1, 'legacy row must commit before provider');
      state.providerCalls++;
      return { ok: upstreamOk, status: 503, text: async () => 'unavailable',
        json: async () => ({ content: [{ type: 'text', text: '{"words":[],"fullTranslation":"Hello"}' }] }) };
    },
  });
  return { state, handler: vm.runInContext(`${source}\nhandler;`, context) };
}

test('X-Ray missing reservation schema uses the old identity/IP counters and commits before the provider', async () => {
  for (const code of missingCodes) {
    const { handler, state } = fixture({ rpcError: { code } });
    const response = await handler(event);
    assert.equal(response.statusCode, 200, `${code}: ${response.body}`);
    assert.equal(state.providerCalls, 1);
    assert.equal(state.rows.length, 1);
    assert.equal(state.rows[0].anonymous_id, 'browser-anon-123');
    assert.match(state.rows[0].ip_hash, /^ip_[0-9a-f]{32}$/);
    assert.ok(state.queries.some((filters) => filters.some(([key]) => key === 'anonymous_id')));
    assert.ok(state.queries.some((filters) => filters.some(([key]) => key === 'ip_hash')));
    assert.equal(JSON.parse(response.body).usage.usedToday, 1);
  }
});

test('X-Ray missing RPC still blocks the provider when the legacy usage write fails', async () => {
  for (const code of missingCodes) {
    const { handler, state } = fixture({ rpcError: { code }, insertError: { code: '42501', message: 'write denied' } });
    assert.equal((await handler(event)).statusCode, 503);
    assert.equal(state.providerCalls, 0);
    assert.equal(state.rows.length, 0);
    assert.equal(state.writes.length, 1, 'permission failures must not retry without source');
  }
});

test('X-Ray non-missing RPC errors fail closed without querying or writing legacy usage', async () => {
  for (const rpcError of [{ code: '42501' }, { code: '57014' }, { code: '23505' }, { message: 'function missing' }]) {
    const { handler, state } = fixture({ rpcError });
    assert.equal((await handler(event)).statusCode, 503);
    assert.equal(state.providerCalls, 0);
    assert.equal(state.writes.length, 0);
    assert.equal(state.queries.length, 0);
  }
});

test('X-Ray legacy fallback blocks failed counts and enforces both old limits', async () => {
  for (const options of [{ countError: { message: 'offline' } }, { used: 1 }, { ipUsed: 12 }]) {
    const { handler, state } = fixture(options);
    assert.equal((await handler(event)).statusCode, options.countError ? 503 : 429);
    assert.equal(state.providerCalls, 0);
    assert.equal(state.writes.length, 0);
  }
});

test('X-Ray legacy fallback scopes authenticated usage to the verified user', async () => {
  const { handler, state } = fixture({ userId: 'verified-user', used: 49 });
  const response = await handler(event);
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(JSON.parse(response.body).usage.remaining, 0);
  assert.equal(state.rows[0].user_id, 'verified-user');
  assert.equal(state.rows[0].anonymous_id, null);
  assert.equal(state.rows[0].ip_hash, null);
  assert.equal(state.queries.length, 1);
  assert.ok(state.queries[0].some(([key, value]) => key === 'user_id' && value === 'verified-user'));
});

test('X-Ray legacy fallback retries a missing source column and refunds upstream failures', async () => {
  const { handler, state } = fixture({ missingSource: true, upstreamOk: false });
  assert.equal((await handler(event)).statusCode, 502);
  assert.equal(state.providerCalls, 1);
  assert.equal(state.writes.length, 2);
  assert.ok(!Object.hasOwn(state.writes[1], 'source'));
  assert.equal(state.rows.length, 0);
});

test('migration fallback detection uses only missing-schema codes and logs once per cold start', async () => {
  for (const code of missingCodes) assert.equal(isMissingSchema({ code }), true);
  for (const error of [null, {}, { code: '42501' }, { message: 'function does not exist' }]) {
    assert.equal(isMissingSchema(error), false);
  }
  const warnings = [];
  const helper = readFileSync(new URL('../netlify/functions/_shared/migrationPending.mjs', import.meta.url), 'utf8')
    .replace(/export /g, '');
  const log = vm.runInNewContext(`${helper}\nlogMigrationPending;`, { console: { warn: (line) => warnings.push(line) } });
  log('reserve_xray_usage');
  log('reserve_xray_usage');
  log('reserve_writing_usage');
  assert.deepEqual(warnings, ['[migration pending] reserve_xray_usage', '[migration pending] reserve_writing_usage']);
});

test('usage fallback remains fail-closed for thrown errors, failed old writes and malformed results', async () => {
  let fallbacks = 0;
  const fallback = async () => { fallbacks++; return { allowed: true, used: 0, id: 'old-row' }; };
  const db = { rpc: async () => { throw { code: '42883' }; } };
  assert.equal((await reserveUsage(db, 'throwing_missing_rpc', {}, fallback)).id, 'old-row');
  assert.equal(fallbacks, 1);
  await assert.rejects(() => reserveUsage({ rpc: async () => { throw new Error('offline'); } }, 'test', {}, fallback));
  assert.equal(fallbacks, 1);
  await assert.rejects(() => reserveUsage(db, 'test', {}, async () => { throw new Error('write failed'); }));
  await assert.rejects(() => reserveUsage(db, 'test', {}, async () => ({ allowed: true, used: 0 })));
});
