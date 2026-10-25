// ProgressContext loads per account, never across accounts
// (src/contexts/ProgressContext.jsx).
//
// The defects this closes (cross-check 2026-10-25):
//   SHL-05  The loader was keyed on the auth `user` OBJECT, which AuthContext
//           replaces at every tab focus and token refresh: each one refetched
//           grammar, reading and listening progress. It had no cancellation
//           and no account check, so a slow response for account A replaced
//           account B's progress after a switch, and a sign-out kept A's
//           numbers unless a guest blob happened to exist.
//   SHL-06  Reading totals were fetched (eight select('*') calls, whole lesson
//           bodies) only after the first reading lesson was completed, so that
//           completion grew the denominator and the level percentage dropped.
//
// The provider runs for real: its module code and hooks, with the imports
// replaced by fakes and its JSX return swapped for the context value.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { levels } from '../src/data/content.js';
import { getTopicsForLevel } from '../src/data/grammarTopics.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

const A11_TOPICS = getTopicsForLevel('a1.1');
const READING_ROWS = [
  { id: 'r-a11-1', level: 'a1.1' }, { id: 'r-a11-2', level: 'a1.1' }, { id: 'r-a11-3', level: 'a1.1' },
  { id: 'r-a12-1', level: 'a1.2' },
];

function providerHarness({ storage = new Map() } = {}) {
  const slots = [];
  let cursor = 0;
  let rendering = false;
  let dirty = false;
  let pending = [];
  let auth = { user: null };
  const queries = [];
  const grammar = new Map(); // userId → deferred
  const reading = new Map(); // userId → Set of completed ids
  const query = (table) => {
    const chain = {
      select(columns) { queries.push([table, columns]); return chain; },
      eq() { return chain; },
      not() { return chain; },
      then(resolve) {
        if (table === 'reading_lessons') resolve({ data: READING_ROWS, error: null });
        else resolve({ data: [], error: null });
      },
    };
    return chain;
  };
  const source = read('src/contexts/ProgressContext.jsx')
    .replace(/^import[\s\S]*?;\n/gm, '')
    .replace(/^export const /gm, 'const ')
    .replace(/return \(\s*<ProgressContext\.Provider[\s\S]*?<\/ProgressContext\.Provider>\s*\);/, 'return value;');
  const provider = vm.runInNewContext(`${source}\nProgressProvider;`, {
    createContext: () => ({}),
    useContext: () => ({}),
    useAuth: () => auth,
    useState(initial) {
      const slot = slots[cursor++] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slot.value, (next) => {
        const value = typeof next === 'function' ? next(slot.value) : next;
        if (!Object.is(value, slot.value) && rendering) dirty = true;
        slot.value = value;
      }];
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) {
        const previous = slots[index];
        const slot = slots[index] = { deps, cleanup: previous?.cleanup };
        pending.push(() => { slot.cleanup?.(); slot.cleanup = callback(); });
      }
    },
    supabase: { from: query },
    safeGetJSON: (key, fallback) => (storage.has(key) ? JSON.parse(storage.get(key)) : fallback),
    safeSetJSON: (key, value) => storage.set(key, JSON.stringify(value)),
    levels,
    getTopicsForLevel,
    loadUserGrammarProgress: (userId) => {
      if (!grammar.has(userId)) grammar.set(userId, deferred());
      return grammar.get(userId).promise;
    },
    loadUserReadingProgress: async (userId) => reading.get(userId) || new Set(),
    // readingService's per-level loader, which the provider must no longer need.
    getReadingLessonsByLevel: async (level) => {
      queries.push(['reading_lessons', '*']);
      return READING_ROWS.filter((row) => row.level === level);
    },
    console: { error() {}, warn() {}, log() {} },
  });
  return {
    queries,
    signIn(id) { auth = { user: id ? { id, created_at: '2026-01-01' } : null }; },
    completeGrammar(userId, topicIds) {
      if (!grammar.has(userId)) grammar.set(userId, deferred());
      grammar.get(userId).resolve(Object.fromEntries(topicIds.map((id) => [id, { completed: true, progress: 100 }])));
    },
    readingDone(userId, ids) { reading.set(userId, new Set(ids)); },
    render() {
      let value;
      for (let pass = 0; pass < 10; pass++) {
        cursor = 0;
        dirty = false;
        rendering = true;
        value = provider({ children: null });
        rendering = false;
        if (!dirty) break; // React re-renders at once after a state change during render
      }
      const effects = pending;
      pending = [];
      effects.forEach((effect) => effect());
      return value;
    },
  };
}

test('a slow response for account A never lands under account B', async () => {
  const h = providerHarness();
  h.signIn('learner-a');
  h.render();
  h.signIn('learner-b'); // A's load is still in flight: another tab switched accounts
  h.render();
  h.completeGrammar('learner-b', []);
  await settle();
  h.completeGrammar('learner-a', [A11_TOPICS[0].id, A11_TOPICS[1].id]); // A's answer arrives late
  await settle();
  const value = h.render();
  assert.equal(value.getTotalStats().grammarTopics, 0, "A's completions must not appear under B");
  assert.equal(value.getGrammarTopicProgress('a1.1', A11_TOPICS[0].id).completed, false);
  assert.equal(value.loading, false);
});

test("signing out drops the account's progress even with no guest progress stored", async () => {
  const h = providerHarness();
  h.signIn('learner-a');
  h.render();
  h.completeGrammar('learner-a', [A11_TOPICS[0].id]);
  await settle();
  assert.equal(h.render().getTotalStats().grammarTopics, 1);
  h.signIn(null);
  const value = h.render();
  assert.equal(value.getTotalStats().total, 0, 'the next visitor of this browser sees no account numbers');
  assert.equal(value.getLevelProgress('a1.1'), 0);
});

test('a switched account shows nothing of the previous one while its own load runs', async () => {
  const h = providerHarness();
  h.signIn('learner-a');
  h.render();
  h.completeGrammar('learner-a', [A11_TOPICS[0].id]);
  await settle();
  h.signIn('learner-b');
  const value = h.render(); // B's load has not answered yet
  assert.equal(value.getTotalStats().grammarTopics, 0);
  assert.equal(value.loading, true, 'B waits for B, not for a page of A');
});

test('a new user object for the same account (tab focus, token refresh) refetches nothing', async () => {
  const h = providerHarness();
  h.signIn('learner-a');
  h.render();
  h.completeGrammar('learner-a', []);
  await settle();
  const before = h.queries.length;
  for (let i = 0; i < 3; i++) {
    h.signIn('learner-a'); // AuthContext hands out a fresh object each time
    h.render();
    await settle();
  }
  assert.equal(h.queries.length, before);
});

test('reading totals load with the first load, in one light query, before any reading is done', async () => {
  const h = providerHarness();
  h.signIn('learner-a');
  h.render();
  const topics = A11_TOPICS.slice(0, 2).map((t) => t.id);
  h.completeGrammar('learner-a', topics);
  await settle();
  const reads = h.queries.filter(([table]) => table === 'reading_lessons');
  assert.deepEqual(reads, [['reading_lessons', 'id, level']], 'one query for every level, no lesson bodies');
  const value = h.render();
  // Grammar 2 of N plus 0 of 3 reading lessons: the denominator already counts reading.
  const expected = Math.round((2 / (A11_TOPICS.length + 3)) * 100);
  assert.equal(value.getLevelProgress('a1.1'), expected);
});

test('the first completed reading lesson can only raise the level percentage', async () => {
  const percentAfter = async (readingIds) => {
    const h = providerHarness();
    h.readingDone('learner-a', readingIds);
    h.signIn('learner-a');
    h.render();
    // Most of the grammar done: the case where a late denominator showed a drop.
    h.completeGrammar('learner-a', A11_TOPICS.slice(0, 9).map((t) => t.id));
    await settle();
    return h.render().getLevelProgress('a1.1');
  };
  const before = await percentAfter([]);
  const after = await percentAfter(['r-a11-1']);
  assert.ok(after > before, `the first reading lesson moved a1.1 from ${before}% to ${after}%`);
});
