import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grammarTopicLink } from '../src/lib/xrayTopics.js';

const page = readFileSync(new URL('../src/pages/SentenceXRay.jsx', import.meta.url), 'utf8');
const { topics } = JSON.parse(readFileSync(new URL('../grammar-content-cache.json', import.meta.url), 'utf8'));

function analysisHarness() {
  const result = [];
  const errors = [];
  const pending = [];
  const calls = [];
  const source = page.slice(page.indexOf('  const analyze = async'), page.indexOf('  const handleKeyDown ='));
  assert.ok(source, 'the page analysis handler was not found');
  const bindings = {
    sentence: 'Die Mutter gibt dem Kind einen Apfel.',
    analysisInFlight: { current: false },
    setLoading: () => {}, setError: (value) => errors.push(value), setResult: (value) => result.push(value),
    setLimitReached: () => {}, setSelectedWord: () => {}, setSentence: () => {}, setUsage: () => {},
    getAuthHeaders: async () => ({}), user: null, anonId: 'anon-test', document: { referrer: '' },
    xraySource: () => ({}), getAttribution: () => null, withTimeout: (promise) => promise,
    failureMessage: () => 'Failed',
    fetch: async (...args) => {
      calls.push(args);
      return new Promise((resolve, reject) => pending.push({ resolve, reject }));
    },
  };
  const analyze = new Function(...Object.keys(bindings), `${source}\nreturn analyze;`)(...Object.values(bindings));
  return { analyze, calls, pending, result, errors };
}

test('X-Ray treats a 200 without a word list as a failed analysis, never a result (AI-20)', async () => {
  for (const body of [{ error: 'x' }, { words: 'Ich helfe' }, {}]) {
    const h = analysisHarness();
    const run = h.analyze();
    await Promise.resolve();
    h.pending[0].resolve({ status: 200, ok: true, json: async () => body });
    await run;
    assert.deepEqual(h.result.filter(Boolean), [], `${JSON.stringify(body)} reached result.words.map`);
    assert.equal(h.errors.at(-1), 'Analysis failed. Please try again.', 'the learner is told to retry');
  }
});

test('X-Ray repeated Enter submissions reserve only one request before React renders', async () => {
  assert.match(page, /const analysisInFlight = useRef\(false\)/);
  const h = analysisHarness();
  const first = h.analyze();
  const repeated = [h.analyze(), h.analyze(), h.analyze()];
  await Promise.resolve();
  assert.equal(h.calls.length, 1, 'Enter repetition issued another paid analysis');
  const response = { words: [], fullTranslation: 'A mother gives a child an apple.' };
  h.pending[0].resolve({ status: 200, ok: true, json: async () => response });
  await Promise.all([first, ...repeated]);
  assert.equal(h.result.at(-1), response);
  assert.equal(h.result.filter(Boolean).length, 1);
});

test('X-Ray releases the submission guard after errors and limit responses', async () => {
  const h = analysisHarness();
  const first = h.analyze();
  await Promise.resolve();
  h.pending[0].reject(new Error('network down'));
  await first;
  const second = h.analyze();
  await Promise.resolve();
  assert.equal(h.calls.length, 2, 'a failed analysis blocked a retry');
  h.pending[1].resolve({ status: 429, ok: false, json: async () => ({ tier: 'anonymous', limit: 1 }) });
  await second;
  const third = h.analyze();
  await Promise.resolve();
  assert.equal(h.calls.length, 3, 'a limit response left the synchronous guard locked');
  h.pending[2].resolve({ status: 200, ok: true, json: async () => ({ words: [] }) });
  await third;
});

test('X-Ray Learn more resolves the real level and slug from the published grammar cache', () => {
  const topic = grammarTopicLink('dative-case', topics);
  assert.equal(topic.level, 'a2.1');
  assert.equal(topic.href, '/grammar/a2.1/dative-case/');
  for (const row of topics.filter((row) => row.is_published === true)) {
    const link = grammarTopicLink(row.slug, topics);
    assert.equal(link.href, `/grammar/${row.sub_level.toLowerCase()}/${row.slug}/`);
  }
  assert.match(page, /import \{ topics as grammarTopics \} from '\.\.\/\.\.\/grammar-content-cache\.json'/);
  assert.match(page, /grammarTopicLink\(word\.grammarTopic, grammarTopics\)/);
  assert.match(page, /\{topic && \(/);
  assert.match(page, /href=\{topic\.href\}/);
});

test('X-Ray omits nonexistent, unpublished and non-string grammar suggestions', () => {
  for (const suggestion of ['articles', 'does-not-exist', null, ['dative-case'], {}]) {
    assert.equal(grammarTopicLink(suggestion, topics), null);
  }
  assert.equal(grammarTopicLink('hidden-topic', [{ slug: 'hidden-topic', sub_level: 'A1.1', is_published: false }]), null);
});
