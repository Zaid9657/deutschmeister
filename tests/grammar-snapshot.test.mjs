import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const grammarUrl = new URL('../astro-site/src/lib/grammar.js', import.meta.url);
const source = readFileSync(grammarUrl, 'utf8');
const committedCache = JSON.parse(readFileSync(new URL('../grammar-content-cache.json', import.meta.url), 'utf8'));
const plain = (value) => JSON.parse(JSON.stringify(value));
const topic = (id, order, extra = {}) => ({
  id, slug: id, sub_level: 'A1.1', topic_order: order, title_en: id, is_published: true, ...extra,
});
const fixture = (topics) => ({
  topics,
  rules: topics.map((t) => ({ id: `rule-${t.id}`, topic_id: t.id, order_index: 1 })),
  examples: topics.map((t) => ({ id: `example-${t.id}`, topic_id: t.id, order_index: 1 })),
  exercises: topics.map((t) => ({ id: `exercise-${t.id}`, topic_id: t.id, order_index: 1, options: '[{"label":"yes"}]' })),
});

function fakeSupabase(content, onQuery) {
  const calls = [];
  return {
    calls,
    from(table) {
      const request = { table, columns: '*', filters: [], orders: [], range: [0, 999], single: false };
      const query = {
        select(columns) { request.columns = columns; return query; },
        eq(key, value) { request.filters.push((row) => row[key] === value); return query; },
        ilike(key, value) { request.filters.push((row) => row[key]?.toLowerCase() === value.toLowerCase()); return query; },
        in(key, values) { request.filters.push((row) => values.includes(row[key])); return query; },
        order(key) { request.orders.push(key); return query; },
        range(from, to) { request.range = [from, to]; return query; },
        single() { request.single = true; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            calls.push(request);
            const override = onQuery?.(request);
            if (override) return override;
            const key = { grammar_topics: 'topics', grammar_rules: 'rules', grammar_examples: 'examples', grammar_exercises: 'exercises' }[table];
            let rows = (content[key] ?? []).filter((row) => request.filters.every((filter) => filter(row)));
            rows = rows.slice().sort((a, b) => {
              for (const field of request.orders) {
                if (a[field] < b[field]) return -1;
                if (a[field] > b[field]) return 1;
              }
              return 0;
            }).slice(request.range[0], request.range[1] + 1);
            rows = rows.map((row) => request.columns === '*' ? { ...row } :
              Object.fromEntries(request.columns.split(',').map((field) => [field.trim(), row[field.trim()]])));
            return { data: request.single ? rows[0] ?? null : rows, error: null };
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

// Exercise the shipped loaders with only their filesystem/network boundaries
// replaced; no Astro build or Supabase service is needed.
function loadGrammar({ cache = committedCache, live = fixture([]), offline = false, onQuery } = {}) {
  const supabase = fakeSupabase(live, onQuery);
  const warnings = [];
  const script = source
    .replace(/^import .*;\n/gm, '')
    .replace(/import\.meta\.url/g, JSON.stringify(grammarUrl.href))
    .replace(/import\.meta\.env/g, 'process.env')
    .replace(/^export \{[^}]+\};?\n?/gm, '')
    .replace(/^export /gm, '');
  const api = vm.runInNewContext(`${script}\n({ getAllTopicPaths, getTopicsForLevel, getAllTopics, getTopicFull });`, {
    supabase,
    readFileSync: () => JSON.stringify(cache),
    process: { env: offline ? { GRAMMAR_CONTENT_CACHE: 'fixture.json' } : {} },
    URL,
    console: { log() {}, warn: (message) => warnings.push(message), error: (message) => warnings.push(message) },
    setTimeout: (callback) => { callback(); return 1; },
    fetch: async () => ({ status: 200 }),
  });
  return { ...api, calls: supabase.calls, warnings };
}

async function assertPublishedReaders(api) {
  assert.deepEqual(plain(await api.getAllTopicPaths()), [
    { slug: 'first', sub_level: 'a1.1' }, { slug: 'last', sub_level: 'a1.1' },
  ]);
  assert.deepEqual(plain((await api.getAllTopics()).map((t) => t.slug)), ['first', 'last']);
  assert.deepEqual(plain((await api.getTopicsForLevel('A1.1')).map((t) => t.slug)), ['first', 'last']);
  assert.equal(await api.getTopicFull('a1.1', 'hidden'), null);
  assert.equal(await api.getTopicFull('a1.1', 'unverified'), null);
  const first = await api.getTopicFull('A1.1', 'first');
  assert.equal(first.prev, null);
  assert.equal(first.next.slug, 'last');
  assert.deepEqual(plain(first.rules.map((r) => r.topic_id)), ['first']);
  assert.deepEqual(plain(first.exercises[0].options), ['yes']);
  assert.equal((await api.getTopicFull('a1.1', 'last')).prev.slug, 'first');
}

const mixedPublication = () => fixture([
  topic('first', 1), topic('hidden', 2, { is_published: false }),
  topic('unverified', 3, { is_published: undefined }), topic('last', 4),
]);

test('offline grammar readers exclude unpublished and unverified topics from paths, hubs, detail and siblings', async () => {
  const api = loadGrammar({ cache: mixedPublication(), offline: true });
  await assertPublishedReaders(api);
  assert.equal(api.calls.length, 0);
});

test('live grammar readers exclude unpublished topics before generating any routes', async () => {
  const api = loadGrammar({ live: mixedPublication() });
  await assertPublishedReaders(api);
  assert.equal(api.calls.filter((call) => call.table === 'grammar_topics').length, 1);
});

test('live paths and content stay on one complete snapshot when Supabase fails afterward', async () => {
  let outage = false;
  const api = loadGrammar({
    cache: fixture([topic('cached-only', 1)]),
    live: fixture([topic('live-only', 1), topic('live-next', 2)]),
    onQuery: () => outage ? { data: null, error: { message: 'fetch failed' } } : null,
  });
  const paths = await api.getAllTopicPaths();
  const acquiredCalls = api.calls.length;
  outage = true;
  assert.equal(paths[0].slug, 'live-only');
  const detail = await api.getTopicFull('a1.1', paths[0].slug);
  assert.ok(detail, 'a successfully enumerated live topic must retain its content');
  assert.equal(detail.rules[0].topic_id, 'live-only');
  assert.equal(detail.next.slug, 'live-next');
  assert.deepEqual(plain((await api.getAllTopics()).map((t) => t.slug)), ['live-only', 'live-next']);
  assert.equal(api.calls.length, acquiredCalls, 'rendering does not reopen the network after route generation');
});

test('incomplete live acquisition retries and selects cached routes before route generation', async () => {
  const api = loadGrammar({
    cache: fixture([topic('cached-only', 1)]),
    live: fixture([topic('live-only', 1)]),
    onQuery: ({ table }) => table === 'grammar_examples' ? { data: null, error: { message: 'examples unavailable' } } : null,
  });
  assert.deepEqual(plain(await api.getAllTopicPaths()), [{ slug: 'cached-only', sub_level: 'a1.1' }]);
  assert.equal((await api.getTopicFull('a1.1', 'cached-only')).rules[0].topic_id, 'cached-only');
  assert.equal(await api.getTopicFull('a1.1', 'live-only'), null);
  assert.equal(api.calls.filter((call) => call.table === 'grammar_examples').length, 3);
  assert.ok(api.warnings.some((message) => message.includes('SERVING THE WHOLE BUILD')));
});

test('failed sibling-list acquisition retries and falls back with previous and next navigation intact', async () => {
  const content = fixture([topic('previous', 1), topic('current', 2), topic('next', 3)]);
  const api = loadGrammar({
    cache: content,
    live: content,
    onQuery: ({ table, single }) => table === 'grammar_topics' && !single ?
      { data: null, error: { message: 'sibling list unavailable' } } : null,
  });
  const detail = await api.getTopicFull('a1.1', 'current');
  assert.equal(detail.prev?.slug, 'previous');
  assert.equal(detail.next?.slug, 'next');
  assert.equal(api.calls.filter((call) => call.table === 'grammar_topics' && !call.single).length, 3);
});

test('complete live snapshots paginate child tables beyond the Supabase row limit', async () => {
  const live = fixture([topic('first', 1)]);
  live.exercises = Array.from({ length: 1001 }, (_, index) => ({
    id: `exercise-${String(index).padStart(4, '0')}`, topic_id: 'first', order_index: index,
  }));
  const api = loadGrammar({ live });
  await api.getAllTopicPaths();
  const detail = await api.getTopicFull('a1.1', 'first');
  assert.equal(detail.exercises.length, 1001);
  assert.equal(detail.exercises.at(-1).order_index, 1000);
  assert.equal(api.calls.filter((call) => call.table === 'grammar_exercises').length, 2);
});

test('concurrent route and detail readers share snapshot acquisition', async () => {
  const api = loadGrammar({ live: fixture([topic('first', 1)]) });
  const [paths, detail] = await Promise.all([api.getAllTopicPaths(), api.getTopicFull('a1.1', 'first')]);
  assert.equal(paths[0].slug, detail.topic.slug);
  assert.equal(api.calls.filter((call) => call.table === 'grammar_topics').length, 1);
});

test('the committed grammar cache remains a complete offline source with publication flags', async () => {
  assert.ok(committedCache.topics.length > 0);
  assert.ok(committedCache.topics.every((t) => typeof t.is_published === 'boolean'));
  const api = loadGrammar({ offline: true });
  const paths = await api.getAllTopicPaths();
  assert.equal(paths.length, committedCache.topics.filter((t) => t.is_published).length);
  for (const path of paths) {
    const detail = await api.getTopicFull(path.sub_level, path.slug);
    assert.ok(detail, `${path.sub_level}/${path.slug} resolves offline`);
    assert.equal(detail.rules.length, committedCache.rules.filter((r) => r.topic_id === detail.topic.id).length);
    assert.equal(detail.exercises.length, committedCache.exercises.filter((e) => e.topic_id === detail.topic.id).length);
  }
  assert.equal(api.calls.length, 0);
});

test('grammar cache dumps retain publication flags and omit unpublished topics and their content', async () => {
  const content = mixedPublication();
  let output;
  const dump = readFileSync(new URL('../scripts/dump-grammar-cache.mjs', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '');
  await vm.runInNewContext(`(async () => { ${dump} })()`, {
    process: { env: { SUPABASE_URL: 'https://example.invalid', SUPABASE_ANON_KEY: 'test' }, argv: ['node', 'dump', 'fixture.json'] },
    fetch: async (url) => {
      const request = new URL(url);
      assert.equal(request.searchParams.get('select'), '*', 'full rows retain is_published');
      const table = request.pathname.split('/').at(-1);
      const key = { grammar_topics: 'topics', grammar_rules: 'rules', grammar_examples: 'examples', grammar_exercises: 'exercises' }[table];
      return { ok: true, json: async () => content[key] };
    },
    writeFileSync: (_path, data) => { output = JSON.parse(data); },
    console: { log() {} },
  });
  assert.deepEqual(output.topics.map((t) => t.slug), ['first', 'last']);
  assert.ok(output.topics.every((t) => t.is_published === true));
  for (const table of ['rules', 'examples', 'exercises']) {
    assert.deepEqual(output[table].map((row) => row.topic_id), ['first', 'last']);
  }
});
