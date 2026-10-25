// A failed "Erklär mir das" gives its daily slot back (cross-check review
// 2026-10-25, LOW in AI-22's area).
//
// explain-answer reserved one of the learner's 40 daily explanations and then
// threw the reservation id away: an upstream error, an empty answer, a dropped
// connection or any throw kept the slot. Reproduced at 39 used: a provider 503
// gave a 502, and the retry was refused with 429 — usage 40, no explanation
// ever delivered. Every failure after the reservation now releases exactly the
// ledger row it reserved, on the atomic RPC path and on the legacy fallback
// alike, as X-Ray refunds (analyze-sentence.mjs). A shared (cached)
// explanation stays reservation-free. These run the real handler against an
// in-memory lesson_attempts ledger that behaves like reserve_lesson_ai_usage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { reserveUsage } from '../netlify/functions/_shared/aiReservation.mjs';
import { isMissingSchema } from '../netlify/functions/_shared/migrationPending.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const LEARNER = '12345678-1234-1234-1234-123456789abc';
const OTHER = '22345678-1234-1234-1234-123456789abc';
const LIMIT = 40;
const BODY = {
  itemId: 'a1.1-l03-p07', topic: 'articles', questionDe: 'Das ist ___ Haus.', expected: 'ein',
  userAnswer: 'eine', level: 'a1.1', lektionId: 'a1.1-l03', lang: 'en',
};
const TEXT = '„Haus“ is neuter, so the article is „ein“.';

const answer = (text) => async () => ({ ok: true, json: async () => ({ content: [{ type: 'text', text }] }) });
const PROVIDERS = {
  ok: answer(TEXT),
  unavailable: async () => ({ ok: false, status: 503, text: async () => 'overloaded' }),
  unreachable: async () => { throw new TypeError('fetch failed'); },
  unreadable: async () => ({ ok: true, json: async () => { throw new SyntaxError('Unexpected end of JSON input'); } }),
  empty: answer('   '),
  errorBodyLost: async () => ({ ok: false, status: 500, text: async () => { throw new Error('socket hang up'); } }),
};

/**
 * explain-answer against a ledger of today's lesson_attempts rows.
 *   used:      the learner's explanation rows already reserved today
 *   rpc:       'applied' (reserve_lesson_ai_usage) | 'missing' (legacy fallback)
 *   release:   'ok' | 'error' | 'throws' — how the service-role DELETE behaves
 *   providers: the model's answers, in call order (the last one repeats)
 */
function harness({ used = 39, rpc = 'applied', release = 'ok', providers = ['ok'], cached = null } = {}) {
  let nextId = 1000;
  const rows = [
    ...Array.from({ length: used }, (_, i) => ({ id: i + 1, user_id: LEARNER, stage: 'explain' })),
    { id: 500, user_id: LEARNER, stage: 'practice' },
    { id: 501, user_id: OTHER, stage: 'explain' },
  ];
  const state = { rows, reservations: 0, deletes: [], providerCalls: 0, cacheLookups: 0 };
  const matches = (filters) => (row) => filters.every(([column, value]) => row[column] === value);
  const db = {
    async rpc(name, args) {
      if (name === 'store_explain_cache') return { data: null, error: null };
      assert.equal(name, 'reserve_lesson_ai_usage');
      state.reservations++;
      if (rpc === 'missing') return { error: { code: 'PGRST202', message: 'function not found' } };
      const count = rows.filter(matches([['user_id', args.p_user_id], ['stage', args.p_stage]])).length;
      if (count >= args.p_limit) return { data: { allowed: false, used: count } };
      const id = ++nextId;
      rows.push({ id, user_id: args.p_user_id, stage: args.p_stage });
      return { data: { allowed: true, used: count, id } };
    },
    from(table) {
      if (table === 'explain_cache') {
        state.cacheLookups++;
        const query = {
          select() { return query; }, eq() { return query; },
          maybeSingle: async () => ({ data: cached ? { explanation: { text: cached } } : null, error: null }),
        };
        return query;
      }
      assert.equal(table, 'lesson_attempts');
      const filters = [];
      let mode = 'count';
      let inserted = null;
      const query = {
        select() { return query; },
        eq(column, value) { filters.push([column, value]); return query; },
        gte() { return query; },
        insert(row) { mode = 'insert'; inserted = row; return query; },
        delete() { mode = 'delete'; return query; },
        async single() {
          assert.equal(mode, 'insert');
          const id = ++nextId;
          rows.push({ ...inserted, id });
          return { data: { id }, error: null };
        },
        then(resolve, reject) {
          if (mode === 'delete') {
            state.deletes.push(filters.slice());
            if (release === 'throws') return Promise.reject(new Error('connection reset')).then(resolve, reject);
            if (release === 'error') return Promise.resolve({ error: { message: 'permission denied' } }).then(resolve, reject);
            for (let i = rows.length - 1; i >= 0; i--) if (matches(filters)(rows[i])) rows.splice(i, 1);
            return Promise.resolve({ error: null }).then(resolve, reject);
          }
          return Promise.resolve({ count: rows.filter(matches(filters)).length, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const context = vm.createContext({
    supabase: db, supabaseKey: 'test-service-key',
    process: { env: { ANTHROPIC_API_KEY: 'test-key' } },
    console: { log() {}, warn() {}, error() {} },
    createHash, reserveUsage, isMissingSchema, logMigrationPending: () => {},
    getAuthenticatedUserId: async () => LEARNER,
    unauthorizedResponse: () => ({ statusCode: 401 }),
    ruleCard: (topic) => (topic === 'articles' ? { topic } : null),
    ruleCardText: (topic) => (topic === 'articles' ? 'Artikel: ein Haus (neutrum), eine Frau (feminin).' : null),
    fetch: async () => {
      const provider = PROVIDERS[providers[Math.min(state.providerCalls, providers.length - 1)]];
      state.providerCalls++;
      return provider();
    },
  });
  const source = read('netlify/functions/explain-answer.mjs').replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');
  const handler = vm.runInContext(`${source}\nhandler;`, context);
  const explain = () => handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(BODY) });
  const usedToday = () => rows.filter((r) => r.user_id === LEARNER && r.stage === 'explain').length;
  return { explain, state, usedToday };
}

test('at 39 used, a provider 503 gives a 502 and the retry is still allowed', async () => {
  const h = harness({ providers: ['unavailable', 'ok'] });
  const failed = await h.explain();
  assert.equal(failed.statusCode, 502);
  assert.equal(JSON.parse(failed.body).stage, 'upstream');
  const afterFailure = h.usedToday();

  const retry = await h.explain();
  assert.equal(retry.statusCode, 200, `the retry was refused: ${retry.body}`);
  assert.equal(afterFailure, 39, 'the failed explanation still held a daily slot');
  assert.deepEqual(JSON.parse(retry.body), { explanation: TEXT, lang: 'en', used: 40, limit: LIMIT, topic: 'articles' });
  assert.equal(h.usedToday(), 40, 'the delivered explanation keeps its slot');

  const over = await h.explain();
  assert.equal(over.statusCode, 429, 'the cap itself still holds');
  assert.equal(h.state.providerCalls, 2);
});

test('every failure before delivery releases the slot: unreachable, unreadable, empty, a lost error body', async () => {
  for (const [failure, status] of [['unreachable', 500], ['unreadable', 500], ['empty', 502], ['errorBodyLost', 500]]) {
    const h = harness({ providers: [failure, 'ok'] });
    assert.equal((await h.explain()).statusCode, status, failure);
    assert.equal(h.usedToday(), 39, `${failure}: the slot was kept`);
    assert.equal(h.state.deletes.length, 1, `${failure}: released once`);
    assert.equal((await h.explain()).statusCode, 200, `${failure}: the retry was refused`);
  }
});

test('the legacy fallback releases the row it inserted, too', async () => {
  const h = harness({ rpc: 'missing', providers: ['unavailable', 'ok'] });
  assert.equal((await h.explain()).statusCode, 502);
  assert.equal(h.usedToday(), 39, 'the legacy reservation row was kept');
  const retry = await h.explain();
  assert.equal(retry.statusCode, 200, retry.body);
  assert.equal(JSON.parse(retry.body).used, 40);
});

test('exactly that reservation is released: by its id, for this learner, at the explain stage', async () => {
  const h = harness({ providers: ['unavailable'] });
  const before = h.state.rows.map((r) => r.id);
  await h.explain();
  assert.equal(h.state.deletes.length, 1);
  const filters = Object.fromEntries(h.state.deletes[0]);
  assert.deepEqual(Object.keys(filters).sort(), ['id', 'stage', 'user_id']);
  assert.equal(filters.user_id, LEARNER);
  assert.equal(filters.stage, 'explain');
  assert.ok(filters.id > 1000, 'the id the reservation returned, not an earlier row');
  assert.deepEqual(h.state.rows.map((r) => r.id), before, 'earlier rows, other stages and other learners stay');
});

test('a release that fails or throws still answers with the upstream error', async () => {
  for (const release of ['error', 'throws']) {
    const h = harness({ release, providers: ['unavailable'] });
    const res = await h.explain();
    assert.equal(res.statusCode, 502, release);
    assert.equal(JSON.parse(res.body).stage, 'upstream');
    assert.equal(h.state.deletes.length, 1);
  }
});

test('a delivered explanation keeps its slot; a shared one never reserves or releases', async () => {
  const h = harness({ used: 0 });
  assert.equal((await h.explain()).statusCode, 200);
  assert.equal(h.usedToday(), 1);
  assert.deepEqual(h.state.deletes, []);

  const shared = harness({ used: LIMIT, cached: TEXT });
  const res = await shared.explain();
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).cached, true);
  assert.equal(shared.state.reservations, 0);
  assert.deepEqual(shared.state.deletes, []);
  assert.equal(shared.usedToday(), LIMIT);
  assert.equal(shared.state.providerCalls, 0);
});
