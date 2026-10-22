import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { reserveUsage } from '../netlify/functions/_shared/aiReservation.mjs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const userId = '11111111-1111-4111-8111-111111111111';
const token = 'sp_test-session';
const quiet = { log() {}, warn() {}, error() {} };
const result = {
  scores: { pronunciation: 15, grammar: 14, vocabulary: 16, fluency: 13, comprehension: 15 },
  total_score: 73, determined_level: 'B1', determined_sublevel: 'B1.2', confidence: 'medium',
  feedback: 'Gut gemacht.', strengths: ['Wortschatz'], improvements: ['Grammatik'], recommendation: 'GLEICH',
};

function database({ used = 0, rpcError = null, countError = null, insertError = null, saveError = null,
  lookupError = null, sessions = [token], evaluations = [] } = {}) {
  const now = new Date().toISOString();
  const tables = {
    speaking_evaluations: Array.from({ length: used }, (_, i) => ({ id: `old-${i}`, user_id: userId,
      session_id: `old-session-${i}`, created_at: now })).concat(structuredClone(evaluations)),
    speaking_sessions: sessions.map((session_token) => ({ id: session_token, session_token, user_id: userId, evaluated: false })),
    speaking_messages: sessions.flatMap((session_token) => [
      { user_id: userId, session_token, role: 'assistant', content: 'Wie geht es Ihnen?' },
      { user_id: userId, session_token, role: 'user', content: 'Mir geht es gut.' },
    ]),
  };
  const state = { providerCalls: 0, events: [], tables };
  function insert(row) {
    const saved = { id: `evaluation-${tables.speaking_evaluations.length}`, created_at: now, ...row };
    tables.speaking_evaluations.push(saved);
    state.events.push('reserve');
    return saved;
  }
  class Query {
    constructor(table) { this.table = table; this.op = 'select'; this.filters = []; }
    select(_columns, options) { this.head = options?.head; return this; }
    eq(key, value) { this.filters.push((row) => row[key] === value); return this; }
    gte(key, value) { this.filters.push((row) => row[key] >= value); return this; }
    or(value) {
      if (value === 'evaluated.is.null,evaluated.eq.false') this.filters.push((row) => row.evaluated !== true);
      else {
        assert.equal(value, 'scores->>_failed.is.null,scores->>_failed.neq.true');
        this.filters.push((row) => !row.scores?._failed);
      }
      return this;
    }
    order(key, options) { this.sortKey = key; this.ascending = options.ascending; return this; }
    limit(value) { this.max = value; return this; }
    update(value) { this.op = 'update'; this.patch = value; return this; }
    insert(value) { this.op = 'insert'; this.row = value; return this; }
    maybeSingle() { this.one = true; return this; }
    single() { this.one = true; return this; }
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        state.events.push(`${this.table}:${this.op}`);
        if (this.table === 'speaking_evaluations') {
          if (this.head && countError) return { error: countError };
          if (this.op === 'select' && !this.head && lookupError) return { error: lookupError };
          if (this.op === 'insert') return insertError ? { error: insertError } : { data: insert(this.row), error: null };
          if (this.op === 'update' && saveError) return { error: saveError };
        }
        let rows = tables[this.table].filter((row) => this.filters.every((filter) => filter(row)));
        const count = rows.length;
        if (this.sortKey) rows.sort((a, b) => {
          const order = String(a[this.sortKey]).localeCompare(String(b[this.sortKey]));
          return this.ascending ? order : -order;
        });
        if (this.max) rows = rows.slice(0, this.max);
        if (this.op === 'update') rows.forEach((row) => Object.assign(row, structuredClone(this.patch)));
        return { data: this.head ? null : this.one ? structuredClone(rows[0] || null) : structuredClone(rows), count, error: null };
      }).then(resolve, reject);
    }
  }
  return {
    state, from: (table) => new Query(table),
    async rpc(name, args) {
      state.events.push('rpc');
      assert.equal(name, 'reserve_speaking_evaluation');
      if (rpcError) return { error: rpcError };
      // Model the transaction's locked check-and-insert as one synchronous step.
      const rows = tables.speaking_evaluations;
      const existing = rows.find((row) => row.user_id === args.p_user_id && row.session_id === args.p_session_token && !row.scores?._failed);
      if (existing) return { data: { allowed: true, used: 0, id: existing.id, existing: true, evaluation: structuredClone(existing) } };
      const count = rows.filter((row) => row.user_id === args.p_user_id && row.created_at.slice(0, 10) === now.slice(0, 10)).length;
      if (count >= args.p_limit) return { data: { allowed: false, used: count } };
      const session = tables.speaking_sessions.find((row) => row.user_id === args.p_user_id && row.session_token === args.p_session_token);
      if (!session || session.evaluated) return { data: { allowed: false, used: count, pending: true } };
      session.evaluated = true;
      const row = insert({ user_id: args.p_user_id, session_id: args.p_session_token,
        session_token: args.p_session_token, level: args.p_level, score: 0, total_score: null, scores: { _pending: true } });
      return { data: { allowed: true, used: count, id: row.id } };
    },
  };
}

function handler(db, { invalidProvider = false, failProvider = false } = {}) {
  const context = vm.createContext({
    createClient: () => db, reserveUsage,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'configured', ANTHROPIC_API_KEY: 'configured' } },
    getAuthenticatedUserId: async () => userId,
    unauthorizedResponse: () => ({ statusCode: 401 }), console: quiet,
    fetch: async () => {
      db.state.providerCalls++;
      db.state.events.push('provider');
      assert.ok(db.state.tables.speaking_evaluations.some((row) => row.scores?._pending), 'provider requires a committed reservation');
      if (failProvider) throw new Error('provider unavailable');
      return { ok: true, json: async () => ({ content: [{ text: invalidProvider ? 'invalid JSON' : JSON.stringify(result) }] }) };
    },
  });
  const source = read('netlify/functions/evaluate-speaking.mjs').replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');
  return vm.runInContext(`${source}\nhandler;`, context);
}
const event = (session_token = token) => ({ httpMethod: 'POST', headers: {},
  body: JSON.stringify({ session_token, mode: 'placement', messages: [{ role: 'user', content: 'untrusted client message' }] }) });

test('speaking evaluation reserves the last daily slot before concurrent provider calls', async () => {
  const sessions = ['session-a', 'session-b', 'session-c'];
  const db = database({ used: 19, sessions });
  const run = handler(db);
  const responses = await Promise.all(sessions.map((session) => run(event(session))));
  assert.deepEqual(responses.map((response) => response.statusCode).sort(), [200, 429, 429]);
  assert.equal(db.state.providerCalls, 1);
  assert.equal(db.state.tables.speaking_evaluations.length, 20);
  assert.ok(db.state.events.indexOf('reserve') < db.state.events.indexOf('provider'));
});

test('speaking evaluation returns the stored placement result on retry, even at the daily cap', async () => {
  const db = database({ used: 19 });
  const run = handler(db);
  const first = await run(event());
  const again = await run(event());
  assert.equal(first.statusCode, 200, first.body);
  assert.deepEqual(JSON.parse(again.body), JSON.parse(first.body));
  assert.equal(JSON.parse(again.body).determined_sublevel, result.determined_sublevel);
  assert.equal(db.state.providerCalls, 1);
  assert.equal(db.state.tables.speaking_evaluations.length, 20);
});

test('speaking evaluation reuses historical stored feedback without regrading the transcript', async () => {
  const db = database({ evaluations: [{ id: 'historical', user_id: userId, session_id: token,
    total_score: 0, scores: { grammar: 0 }, feedback: 'Weiter üben.', recommendation: 'WIEDERHOLEN' }] });
  const response = await handler(db)(event());
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(JSON.parse(response.body).total_score, 0);
  assert.equal(JSON.parse(response.body).evaluation_id, 'historical');
  assert.equal(db.state.providerCalls, 0);
});

test('concurrent retries of one speaking evaluation spend only one provider call', async () => {
  for (const rpcError of [null, { code: 'PGRST202', message: 'RPC missing' }]) {
    const db = database({ rpcError });
    const run = handler(db);
    const responses = await Promise.all([run(event()), run(event()), run(event())]);
    assert.equal(responses.filter((response) => response.statusCode === 200).length, 1);
    assert.equal(responses.filter((response) => response.statusCode === 409).length, 2);
    assert.equal(db.state.providerCalls, 1);
    assert.equal(db.state.tables.speaking_evaluations.length, 1);
    assert.equal((await run(event())).statusCode, 200);
    assert.equal(db.state.providerCalls, 1);
  }
});

test('missing speaking evaluation RPC reserves the existing ledger before provider work', async () => {
  for (const code of ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42P01', '42703']) {
    const db = database({ rpcError: { code } });
    const response = await handler(db)(event());
    assert.equal(response.statusCode, 200, `${code}: ${response.body}`);
    assert.equal(db.state.providerCalls, 1);
    assert.equal(db.state.tables.speaking_sessions[0].evaluated, true);
    assert.equal(db.state.tables.speaking_evaluations.length, 1);
    assert.ok(db.state.events.indexOf('reserve') < db.state.events.indexOf('provider'));
  }
});

test('missing speaking evaluation RPC still enforces the daily cap without claiming a new session', async () => {
  const db = database({ used: 20, rpcError: { code: 'PGRST202' } });
  const response = await handler(db)(event());
  assert.equal(response.statusCode, 429);
  assert.equal(db.state.providerCalls, 0);
  assert.equal(db.state.tables.speaking_evaluations.length, 20);
  assert.equal(db.state.tables.speaking_sessions[0].evaluated, false);
});

test('speaking evaluation reservation errors never call the provider', async () => {
  for (const options of [
    { rpcError: { code: '42501' } },
    { rpcError: { code: 'PGRST202' }, countError: { message: 'count failed' } },
    { rpcError: { code: 'PGRST202' }, insertError: { message: 'insert failed' } },
    { lookupError: { message: 'lookup failed' } },
  ]) {
    const db = database(options);
    const response = await handler(db)(event());
    assert.equal(response.statusCode, options.lookupError ? 500 : 503, response.body);
    assert.equal(db.state.providerCalls, 0);
    assert.equal(db.state.tables.speaking_evaluations.length, 0);
    assert.equal(db.state.tables.speaking_sessions[0].evaluated, false);
  }
});

test('speaking evaluation keeps reserved usage when saving feedback fails', async () => {
  const db = database({ saveError: { message: 'save failed' } });
  const response = await handler(db)(event());
  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).saved, false);
  assert.equal(db.state.providerCalls, 1);
  assert.equal(db.state.tables.speaking_evaluations.length, 1);
  assert.equal((await handler(db)(event())).statusCode, 409);
  assert.equal(db.state.providerCalls, 1);
});

test('unusable speaking evaluation responses remain counted while a later retry can succeed', async () => {
  for (const options of [{ invalidProvider: true }, { failProvider: true }]) {
    for (const rpcError of [null, { code: 'PGRST202' }]) {
      const db = database({ rpcError });
      const run = handler(db, options);
      const response = await run(event());
      const retry = await handler(db)(event());
      assert.equal(response.statusCode, 200);
      assert.equal(JSON.parse(response.body).evaluation_failed, true);
      assert.equal(retry.statusCode, 200, retry.body);
      assert.equal(JSON.parse(retry.body).total_score, result.total_score);
      assert.equal(db.state.providerCalls, 3, 'the failed evaluation retries its provider once, then a later request can retry');
      assert.equal(db.state.tables.speaking_evaluations.length, 2);
      assert.equal(db.state.tables.speaking_evaluations[0].scores._failed, true);
      assert.equal(db.state.tables.speaking_evaluations[0].total_score, null);
      const replay = await handler(db)(event());
      assert.deepEqual(JSON.parse(replay.body), JSON.parse(retry.body));
      assert.equal(db.state.providerCalls, 3);
    }
  }
});

test('failed speaking evaluations consume the last allowance even when the learner retries', async () => {
  const db = database({ used: 19 });
  const response = await handler(db, { invalidProvider: true })(event());
  assert.equal(JSON.parse(response.body).evaluation_failed, true);
  const retry = await handler(db)(event());
  assert.equal(retry.statusCode, 429);
  assert.equal(db.state.providerCalls, 2);
  assert.equal(db.state.tables.speaking_evaluations.length, 20);
});

test('speaking evaluation SQL locks quota checks, claims owned sessions and reuses prior evaluations', () => {
  const sql = read('migrations/2026-10-22-speaking-evaluation-reservations.sql');
  assert.ok(sql.indexOf('pg_advisory_xact_lock') < sql.indexOf('SELECT count(*)'));
  assert.ok(sql.indexOf('v_used >= p_limit') < sql.indexOf('INSERT INTO public.speaking_evaluations'));
  assert.match(sql, /WHERE user_id = p_user_id AND session_id = p_session_token/);
  assert.match(sql, /WHERE user_id = p_user_id AND session_token = p_session_token\s+AND evaluated IS NOT TRUE/);
  assert.match(sql, /'existing', true, 'evaluation', to_jsonb\(v_existing\)/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.reserve_speaking_evaluation\(uuid,text,text,integer\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.reserve_speaking_evaluation\(uuid,text,text,integer\) TO service_role/);
});
