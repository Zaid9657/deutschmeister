// Shared "Erklär mir das" explanations (cross-check 2026-10-25, AI-22 / C-048).
//
// Learners miss the same course item with the same answer, and every tap waited
// on a model round-trip and took one of 40 daily slots. A rule-card-grounded
// explanation is now written once per exact input — item, model, the whole
// system prompt (language and rule card included) and the user turn (question,
// correct answer, the learner's answer as typed, level) — and shared: a hit
// makes no model call and reserves nothing. Before the owner applies
// migrations/2026-10-25-explain-cache.sql every lookup and store fails open.
// These run the real handler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { reserveUsage } from '../netlify/functions/_shared/aiReservation.mjs';
import { isMissingSchema, logMigrationPending } from '../netlify/functions/_shared/migrationPending.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const LEARNER = '12345678-1234-1234-1234-123456789abc';
const OTHER = '22345678-1234-1234-1234-123456789abc';
const ITEM = {
  itemId: 'a1.1-l03-p07', topic: 'articles', questionDe: 'Das ist ___ Haus.', expected: 'ein',
  userAnswer: 'eine', level: 'a1.1', lektionId: 'a1.1-l03', lang: 'en',
};

/**
 * explain-answer with one shared explain_cache and a per-learner ledger.
 *   lookup: 'ok' | 'missing' (migration pending) | 'throws'
 *   store:  'ok' | 'missing' (migration pending)
 */
function harness({ lookup = 'ok', store = 'ok', card = 'Artikel: ein Haus (neutrum), eine Frau (feminin).', used = 0 } = {}) {
  const cache = new Map();
  const state = { counts: 0, reservations: 0, lookups: [], stores: [], providerCalls: 0, systems: [] };
  const db = {
    async rpc(name, args) {
      if (name === 'reserve_lesson_ai_usage') {
        state.reservations++;
        return used >= args.p_limit ? { data: { allowed: false, used } } : { data: { allowed: true, used, id: `attempt-${state.reservations}` } };
      }
      assert.equal(name, 'store_explain_cache');
      state.stores.push(args);
      if (store === 'missing') return { error: { code: 'PGRST202', message: 'function not found' } };
      if (!cache.has(args.p_cache_key)) cache.set(args.p_cache_key, args.p_explanation);
      return { data: null, error: null };
    },
    from(table) {
      if (table === 'lesson_attempts') {
        const query = {
          select() { return query; }, eq() { return query; }, gte() { return query; },
          then(resolve, reject) { state.counts++; return Promise.resolve({ count: used, error: null }).then(resolve, reject); },
        };
        return query;
      }
      assert.equal(table, 'explain_cache');
      if (lookup === 'throws') throw new Error('connection reset');
      let key;
      const query = {
        select(columns) { assert.equal(columns, 'explanation'); return query; },
        eq(column, value) { assert.equal(column, 'cache_key'); key = value; state.lookups.push(value); return query; },
        async maybeSingle() {
          if (lookup === 'missing') return { data: null, error: { code: 'PGRST205', message: 'relation not found' } };
          return { data: cache.has(key) ? { explanation: cache.get(key) } : null, error: null };
        },
      };
      return query;
    },
  };
  let userId = LEARNER;
  const context = vm.createContext({
    supabase: db, supabaseKey: 'test-service-key',
    process: { env: { ANTHROPIC_API_KEY: 'test-key' } },
    console: { log() {}, warn() {}, error() {} },
    createHash, reserveUsage, isMissingSchema, logMigrationPending,
    getAuthenticatedUserId: async () => userId,
    unauthorizedResponse: () => ({ statusCode: 401 }),
    ruleCard: (topic) => (card && topic === 'articles' ? { topic } : null),
    ruleCardText: (topic) => (topic === 'articles' ? card : null),
    fetch: async (_url, init) => {
      state.providerCalls++;
      state.systems.push(JSON.parse(init.body).system);
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: '„Haus“ is neuter, so the article is „ein“.' }] }) };
    },
  });
  const source = read('netlify/functions/explain-answer.mjs').replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');
  const handler = vm.runInContext(`${source}\nhandler;`, context);
  const explain = (body = {}, as = LEARNER) => {
    userId = as;
    return handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ ...ITEM, ...body }) });
  };
  return { explain, state, cache };
}

test('the second learner with the same miss gets the shared explanation: no model call, nothing reserved', async () => {
  const h = harness();
  const first = await h.explain();
  assert.equal(first.statusCode, 200);
  assert.equal(h.state.providerCalls, 1);
  assert.equal(h.state.reservations, 1);
  assert.equal(h.state.stores.length, 1, 'the grounded explanation was not stored');
  assert.match(h.state.stores[0].p_cache_key, /^[0-9a-f]{64}$/);
  assert.equal(h.state.stores[0].p_explanation.text, JSON.parse(first.body).explanation);

  const second = await h.explain({}, OTHER);
  assert.equal(second.statusCode, 200);
  const body = JSON.parse(second.body);
  assert.equal(body.explanation, '„Haus“ is neuter, so the article is „ein“.');
  assert.equal(body.cached, true);
  assert.equal(body.used, null, 'a shared explanation is not counted');
  assert.equal(body.limit, 40);
  assert.equal(body.topic, 'articles');
  assert.equal(body.lang, 'en');
  assert.equal(h.state.providerCalls, 1, 'the hit called the model');
  assert.equal(h.state.reservations, 1, 'the hit reserved a daily slot');
  assert.equal(h.state.counts, 1, 'the hit counted the daily cap');
  assert.equal(h.state.stores.length, 1);
});

test('the key changes with the rule card, the language, the item, the answer as typed and the correct answer', async () => {
  const keyFor = async (options, body) => {
    const h = harness(options);
    await h.explain(body);
    return h.state.lookups[0];
  };
  const base = await keyFor({}, {});
  assert.match(base, /^[0-9a-f]{64}$/);
  assert.equal(await keyFor({}, {}), base, 'the same input is the same key');
  const variants = {
    'rebuilt rule card': await keyFor({ card: 'Artikel: ein Haus, eine Frau, ein Kind.' }, {}),
    'German chrome': await keyFor({}, { lang: 'de' }),
    'another item': await keyFor({}, { itemId: 'a1.1-l03-p08' }),
    'a capitalisation slip': await keyFor({}, { userAnswer: 'Eine' }),
    'another wrong answer': await keyFor({}, { userAnswer: 'einen' }),
    'no answer typed': await keyFor({}, { userAnswer: '' }),
    'another correct answer': await keyFor({}, { expected: 'das' }),
    'another level': await keyFor({}, { level: 'a1.2' }),
  };
  for (const [name, key] of Object.entries(variants)) assert.notEqual(key, base, `${name} reused the key`);
  assert.equal(new Set(Object.values(variants)).size, Object.keys(variants).length);
});

test('an explanation without a rule card is never shared', async () => {
  const h = harness({ card: null });
  assert.equal((await h.explain({ topic: 'no-such-topic' })).statusCode, 200);
  assert.equal(h.state.providerCalls, 1);
  assert.deepEqual(h.state.lookups, []);
  assert.deepEqual(h.state.stores, []);
});

test('before the migration is applied, or when the cache fails, every request is reserved and answered as before', async () => {
  for (const options of [{ lookup: 'missing', store: 'missing' }, { lookup: 'throws' }]) {
    const h = harness(options);
    for (const as of [LEARNER, OTHER]) {
      const res = await h.explain({}, as);
      assert.equal(res.statusCode, 200, `${JSON.stringify(options)}: ${res.body}`);
      assert.equal(JSON.parse(res.body).cached, undefined);
    }
    assert.equal(h.state.providerCalls, 2);
    assert.equal(h.state.reservations, 2);
  }
});

test('an empty stored text is ignored; a miss at the cap is still refused', async () => {
  const h = harness();
  await h.explain();
  const [key] = h.cache.keys();
  h.cache.set(key, { text: '   ' });
  const res = await h.explain({}, OTHER);
  assert.equal(res.statusCode, 200);
  assert.equal(h.state.providerCalls, 2, 'a blank stored explanation was served');

  const capped = harness({ used: 40 });
  const refused = await capped.explain();
  assert.equal(refused.statusCode, 429);
  assert.equal(capped.state.providerCalls, 0);
});

test('the migration: service-role table, insert-only validated store, ledger row and pending fixture', () => {
  const sql = read('migrations/2026-10-25-explain-cache.sql').replace(/--[^\n]*/g, ' ');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.explain_cache \(/);
  assert.match(sql, /ALTER TABLE public\.explain_cache ENABLE ROW LEVEL SECURITY;/);
  assert.doesNotMatch(sql, /CREATE POLICY/);
  assert.doesNotMatch(sql, /user_id/, 'shared rows carry no user id');
  assert.match(sql, /REVOKE ALL ON TABLE public\.explain_cache FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /p_cache_key !~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(sql, /ON CONFLICT \(cache_key\) DO NOTHING;/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.store_explain_cache\(text,jsonb\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.store_explain_cache\(text,jsonb\) TO service_role;/);
  const row = read('migrations/README.md').split('\n').find((l) => l.includes('`2026-10-25-explain-cache.sql`'));
  assert.match(row, /applied 2026-10-25/i);
  assert.deepEqual(JSON.parse(read('tests/fixtures/db-schema.json')).tables.explain_cache, ['cache_key', 'created_at', 'explanation']);
  const fn = read('netlify/functions/explain-answer.mjs');
  assert.match(fn, /const cacheKey = card \? explainCacheKey\(\[itemId, CLAUDE_MODEL, system, userText\]\) : null;/);
  // The lookup comes before the daily-cap count and the reservation.
  const lookupAt = fn.indexOf('await cachedExplanation(cacheKey)');
  const countAt = fn.indexOf('const { count, error: countError } = await supabase');
  assert.ok(lookupAt > 0 && countAt > 0);
  assert.ok(lookupAt < countAt);
  assert.ok(lookupAt < fn.indexOf("reserveUsage(supabase, 'reserve_lesson_ai_usage'"));
});
