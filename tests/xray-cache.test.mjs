// Shared X-Ray analyses of the fixed sentences (cross-check 2026-10-25, AI-21 /
// C-036, C-047).
//
// Most X-Ray traffic is the grammar-example links (/analyze/?s=…) and the
// page's own examples: the same sentences, each a slow Sonnet call. A validated
// analysis of such a sentence is stored under a hash of the normalised
// sentence, the model and the system prompt, and later visits are answered from
// it. Metering is unchanged, typed sentences are never stored, and before the
// owner applies migrations/2026-10-25-xray-cache.sql every lookup and store
// fails open. These run the real handler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { reserveUsage, validAnonymousId } from '../netlify/functions/_shared/aiReservation.mjs';
import { isMissingSchema, logMigrationPending } from '../netlify/functions/_shared/migrationPending.mjs';
import { uaClass, cleanSource } from '../netlify/functions/_shared/xraySource.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const ANALYSIS = {
  words: [{ text: 'Ich', role: 'subject', case: 'nominative', translation: 'I', explanation: 'Subject.', grammarTopic: 'nominative-case' }],
  insight: { title: 'Verb second', explanation: 'The verb is in position two.' },
  fullTranslation: 'I help the colleague.',
};

/**
 * The real handler with a usage ledger, the xray_cache table and its store RPC.
 *   lookup: 'ok' | 'missing' (migration pending) | 'throws'
 *   store:  'ok' | 'missing' (migration pending) | 'error'
 */
function harness({ lookup = 'ok', store = 'ok', provider = ANALYSIS } = {}) {
  const cache = new Map();
  const state = { reserved: [], refunds: [], lookups: [], stores: [], providerCalls: 0 };
  const db = {
    async rpc(name, args) {
      if (name === 'reserve_xray_usage') {
        const used = state.reserved.filter((r) => r.visitor === args.p_anonymous_id).length;
        if (used >= args.p_limit) return { data: { allowed: false, used } };
        const id = `usage-${state.reserved.length + 1}`;
        state.reserved.push({ id, visitor: args.p_anonymous_id });
        return { data: { allowed: true, id, used } };
      }
      assert.equal(name, 'store_xray_cache');
      state.stores.push(args);
      if (store === 'missing') return { error: { code: 'PGRST202', message: 'function not found' } };
      if (store === 'error') return { error: { code: '57014', message: 'statement timeout' } };
      if (!cache.has(args.p_sentence_hash)) cache.set(args.p_sentence_hash, args.p_analysis);
      return { data: null, error: null };
    },
    from(table) {
      if (table === 'xray_usage') {
        return { delete: () => ({ eq: async (_column, id) => { state.refunds.push(id); return { error: null }; } }) };
      }
      assert.equal(table, 'xray_cache');
      if (lookup === 'throws') throw new Error('connection reset');
      let key;
      const query = {
        select(columns) { assert.equal(columns, 'analysis'); return query; },
        eq(column, value) { assert.equal(column, 'sentence_hash'); key = value; state.lookups.push(value); return query; },
        async maybeSingle() {
          if (lookup === 'missing') return { data: null, error: { code: 'PGRST205', message: 'relation not found' } };
          return { data: cache.has(key) ? { analysis: cache.get(key) } : null, error: null };
        },
      };
      return query;
    },
  };
  const context = vm.createContext({
    process: { env: { ANTHROPIC_API_KEY: 'test-key', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' } },
    createClient: () => db, createHash, reserveUsage, validAnonymousId, uaClass, cleanSource,
    isMissingSchema, logMigrationPending,
    getAuthenticatedUserId: async () => null,
    console: { log() {}, warn() {}, error() {} },
    fetch: async () => {
      state.providerCalls++;
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: JSON.stringify(provider) }] }) };
    },
  });
  const source = read('netlify/functions/analyze-sentence.mjs').replace(/^import .*;\n/gm, '').replace('export const handler', 'const handler');
  const { handler, SYSTEM_PROMPT, CLAUDE_MODEL } = vm.runInContext(`${source}\n({ handler, SYSTEM_PROMPT, CLAUDE_MODEL });`, context);
  // A fresh anonymous visitor per call, as the grammar-example traffic is.
  const analyze = (sentence, entry) => handler({
    httpMethod: 'POST',
    headers: { origin: 'https://deutsch-meister.de', 'user-agent': CHROME },
    body: JSON.stringify({ sentence, anonymousId: `visitor-${state.reserved.length + 1}-anon`, source: { ref: 'site:/grammar', entry } }),
  });
  return { analyze, state, cache, SYSTEM_PROMPT, CLAUDE_MODEL };
}

/** The key the handler must use, computed independently of it. */
const expectedKey = (sentence, model, prompt) => {
  const normalised = sentence.trim().replace(/\s+/g, ' ').normalize('NFC');
  const promptHash = createHash('sha256').update(prompt).digest('hex');
  return createHash('sha256').update(`${normalised}|${model}|${promptHash}`).digest('hex');
};

test('a grammar-example sentence is analysed once, then answered from the shared cache — still metered', async () => {
  const h = harness();
  const first = await h.analyze('Ich helfe dem Kollegen.', 'link');
  assert.equal(first.statusCode, 200);
  assert.equal(h.state.providerCalls, 1);
  assert.equal(h.state.stores.length, 1, 'the validated analysis was not stored');
  const key = expectedKey('Ich helfe dem Kollegen.', h.CLAUDE_MODEL, h.SYSTEM_PROMPT);
  assert.equal(h.state.stores[0].p_sentence_hash, key);
  assert.equal(h.state.stores[0].p_model, h.CLAUDE_MODEL);
  assert.deepEqual(plain(h.state.stores[0].p_analysis), ANALYSIS);

  // The same sentence from the page's own example list, differently spaced.
  const second = await h.analyze('  Ich  helfe dem\tKollegen. ', 'example');
  assert.equal(second.statusCode, 200);
  assert.equal(h.state.providerCalls, 1, 'a cache hit called the model');
  assert.deepEqual(h.state.lookups, [key, key]);
  const body = JSON.parse(second.body);
  assert.deepEqual(body.words, ANALYSIS.words);
  assert.equal(body.fullTranslation, ANALYSIS.fullTranslation);
  assert.deepEqual(body.usage, { tier: 'anonymous', limit: 1, usedToday: 1, remaining: 0 });
  assert.equal(h.state.reserved.length, 2, 'metering is unchanged: the hit reserved its analysis');
  assert.deepEqual(h.state.refunds, [], 'a delivered hit is not refunded');
  assert.equal(h.state.stores.length, 1, 'a hit is not stored again');
});

test('the key changes with the sentence, the model and the prompt', () => {
  const h = harness();
  const base = expectedKey('Ich helfe dem Kollegen.', h.CLAUDE_MODEL, h.SYSTEM_PROMPT);
  assert.notEqual(expectedKey('Ich helfe der Kollegin.', h.CLAUDE_MODEL, h.SYSTEM_PROMPT), base);
  assert.notEqual(expectedKey('Ich helfe dem Kollegen.', 'another-model', h.SYSTEM_PROMPT), base);
  assert.notEqual(expectedKey('Ich helfe dem Kollegen.', h.CLAUDE_MODEL, `${h.SYSTEM_PROMPT} `), base);
  assert.match(base, /^[0-9a-f]{64}$/, 'the store function only accepts a sha256 hex key');
});

test('a typed sentence never reads or writes the shared cache', async () => {
  for (const entry of ['typed', undefined]) {
    const h = harness();
    assert.equal((await h.analyze('Mein Name ist Anna Keller und ich wohne in Köln.', entry)).statusCode, 200);
    assert.equal(h.state.providerCalls, 1);
    assert.deepEqual(h.state.lookups, [], `${String(entry)}: a learner's sentence was looked up`);
    assert.deepEqual(h.state.stores, [], `${String(entry)}: a learner's sentence was stored`);
  }
});

test('before the migration is applied, or when the cache fails, the model answers as before', async () => {
  for (const options of [
    { lookup: 'missing', store: 'missing' },
    { lookup: 'throws' },
    { store: 'error' },
  ]) {
    const h = harness(options);
    const res = await h.analyze('Ich helfe dem Kollegen.', 'link');
    assert.equal(res.statusCode, 200, `${JSON.stringify(options)}: ${res.body}`);
    assert.equal(h.state.providerCalls, 1);
    assert.deepEqual(JSON.parse(res.body).words, ANALYSIS.words);
    assert.deepEqual(h.state.refunds, [], `${JSON.stringify(options)}: a cache failure cost the learner the analysis`);
  }
});

test('only an analysis the page can render is stored, only one with words, and a corrupt row is not served', async () => {
  const empty = harness({ provider: { words: [], insight: null, fullTranslation: 'x' } });
  assert.equal((await empty.analyze('Ja.', 'link')).statusCode, 200);
  assert.deepEqual(empty.state.stores, [], 'an empty word list is not worth sharing');

  const broken = harness({ provider: { error: 'x' } });
  assert.equal((await broken.analyze('Ich helfe dem Kollegen.', 'link')).statusCode, 500);
  assert.deepEqual(broken.state.stores, []);

  const h = harness();
  h.cache.set(expectedKey('Ich helfe dem Kollegen.', h.CLAUDE_MODEL, h.SYSTEM_PROMPT), { words: 'corrupt' });
  const res = await h.analyze('Ich helfe dem Kollegen.', 'link');
  assert.equal(res.statusCode, 200);
  assert.equal(h.state.providerCalls, 1, 'an unusable stored analysis was served');
  assert.deepEqual(JSON.parse(res.body).words, ANALYSIS.words);
});

test('the migration: service-role table, insert-only validated store, ledger row and pending fixture', () => {
  const sql = read('migrations/2026-10-25-xray-cache.sql').replace(/--[^\n]*/g, ' ');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.xray_cache \(/);
  assert.match(sql, /ALTER TABLE public\.xray_cache ENABLE ROW LEVEL SECURITY;/);
  assert.doesNotMatch(sql, /CREATE POLICY/, 'no client may read or write the shared cache');
  assert.match(sql, /REVOKE ALL ON TABLE public\.xray_cache FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /SECURITY INVOKER SET search_path = public, pg_temp/);
  assert.match(sql, /p_sentence_hash !~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(sql, /jsonb_typeof\(p_analysis -> 'words'\) IS DISTINCT FROM 'array'/);
  assert.match(sql, /ON CONFLICT \(sentence_hash\) DO NOTHING;/, 'a stored analysis is never overwritten');
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.store_xray_cache\(text,text,jsonb\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.store_xray_cache\(text,text,jsonb\) TO service_role;/);
  const row = read('migrations/README.md').split('\n').find((l) => l.includes('`2026-10-25-xray-cache.sql`'));
  assert.match(row, /not yet applied/i);
  const fixture = JSON.parse(read('tests/fixtures/db-schema.json'));
  assert.equal(fixture.pendingApply.tables.xray_cache.migration, '2026-10-25-xray-cache.sql');
  // The handler names only what the migration creates, for link/example entries only.
  const fn = read('netlify/functions/analyze-sentence.mjs');
  assert.match(fn, /\.from\('xray_cache'\)\s*\.select\('analysis'\)\s*\.eq\('sentence_hash', key\)/);
  assert.match(fn, /supabase\.rpc\('store_xray_cache', \{\s*p_sentence_hash: key, p_model: CLAUDE_MODEL, p_analysis: analysis,/);
  assert.match(fn, /const CACHED_ENTRIES = new Set\(\['link', 'example'\]\);/);
});
