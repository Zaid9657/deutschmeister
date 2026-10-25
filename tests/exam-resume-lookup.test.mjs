// "Test starten" before the resume lookup has answered (X-079).
//
// The mock-exam overview started with `resumable = null` while the lookup ran,
// so a returning learner on a slow connection saw an enabled "Test starten" and
// could insert a NEW attempt; only the newest in-progress attempt is resumable,
// so the unfinished test disappeared behind it. A FAILED lookup also returned
// null, which is exactly what "no attempt" looks like.
//
// The rule: findResumableAttempt tells the three answers apart (row / null /
// undefined on a failed read); the overview tracks the lookup as pending /
// none / found / error, enables Start only for "none", and offers a retry —
// never Start — when the lookup failed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const settle = () => new Promise((resolve) => setImmediate(resolve));

// examService loaded the way tests/exam-autosave-order.test.mjs loads it.
function serviceWith(result) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve(result),
  };
  const supabase = { from: () => chain };
  const source = read('src/services/examService.js')
    .replace(/^import .*;\n/m, '')
    .replaceAll('export async function ', 'async function ');
  return new Function('supabase', `${source}\nreturn { findResumableAttempt };`)(supabase);
}

test('findResumableAttempt tells "no attempt" (null) apart from a failed lookup (undefined)', async () => {
  const original = console.error;
  console.error = () => {};
  try {
    assert.equal(await serviceWith({ data: null, error: null }).findResumableAttempt('u1', 'telc_b1'), null);
    assert.equal(await serviceWith({ data: null, error: { message: 'Failed to fetch' } }).findResumableAttempt('u1', 'telc_b1'), undefined);
    const row = { id: 'a1', status: 'in_progress' };
    assert.equal(await serviceWith({ data: row, error: null }).findResumableAttempt('u1', 'telc_b1'), row);
  } finally {
    console.error = original;
  }
});

const overview = read('src/pages/Modelltest/ModelltestOverview.jsx');

/** The overview's hooks-and-handlers section (everything before its first early return) in a VM. */
function overviewHarness({ lookup }) {
  const open = 'const ModelltestOverview = () => {';
  const body = overview.slice(overview.indexOf(open) + open.length, overview.indexOf('  if (!resolved) {'));
  const states = [];
  let cursor = 0;
  let effect = null;
  const created = [];
  const navigated = [];
  const context = {
    useParams: () => ({ examSlug: 'telc-b1' }),
    useNavigate: () => (to, opts) => navigated.push([to, opts]),
    useAuth: () => ({ user: { id: 'u1' } }),
    resolveModelltest: () => ({ key: 'telc_b1', mock: { sections: [{ minutes: 30 }] } }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useEffect: (fn) => { effect = fn; },
    findResumableAttempt: lookup,
    listAttempts: async () => [],
    createAttempt: async (userId, key) => { created.push([userId, key]); return { id: 'new-attempt' }; },
  };
  const render = runInNewContext(`(function render() { ${body} return { lookup, canStart, handleStart, resumable, setLookupRun }; })`, context);
  return {
    created,
    navigated,
    render() { cursor = 0; return render(); },
    runEffect() { return effect(); },
  };
}

test('while the lookup is pending, Start is not offered and cannot insert an attempt', async () => {
  const h = overviewHarness({ lookup: () => new Promise(() => {}) }); // a slow connection
  h.render();
  h.runEffect();
  await settle();
  const view = h.render();
  assert.equal(view.lookup, 'pending');
  assert.equal(view.canStart, false);
  await view.handleStart();
  assert.deepEqual(h.created, [], 'no new attempt can hide the unfinished one');
});

test('a failed lookup offers a retry, never Start', async () => {
  let answer = undefined;
  const h = overviewHarness({ lookup: async () => answer });
  h.render();
  h.runEffect();
  await settle();
  let view = h.render();
  assert.equal(view.lookup, 'error');
  assert.equal(view.canStart, false);
  await view.handleStart();
  assert.deepEqual(h.created, []);
  // The retry runs the lookup again (the effect is keyed on lookupRun) and can then find the attempt.
  answer = { id: 'old-attempt', status: 'in_progress' };
  view.setLookupRun((n) => n + 1);
  h.render();
  h.runEffect();
  await settle();
  view = h.render();
  assert.equal(view.lookup, 'found');
  assert.equal(view.resumable.id, 'old-attempt');
  assert.equal(view.canStart, false);
});

test('only a confirmed "no attempt" enables Start', async () => {
  const h = overviewHarness({ lookup: async () => null });
  h.render();
  h.runEffect();
  await settle();
  const view = h.render();
  assert.equal(view.lookup, 'none');
  assert.equal(view.canStart, true);
  await view.handleStart();
  assert.deepEqual(h.created, [['u1', 'telc_b1']]);
  assert.equal(h.navigated[0][0], '/modelltest/telc-b1/run');
});

test('the overview renders resume, retry or a guarded Start from the lookup state', () => {
  assert.match(overview, /\}, \[userId, resolved\?\.key, lookupRun\]\);/, 'the lookup re-runs on retry, not on every auth object refresh');
  const doors = overview.slice(overview.indexOf("{lookup === 'found' && resumable ? ("), overview.indexOf('</Reveal>', overview.indexOf("{lookup === 'found'")));
  const retry = doors.slice(doors.indexOf(") : lookup === 'error' ? ("), doors.lastIndexOf(') : ('));
  assert.match(retry, /onClick=\{\(\) => setLookupRun\(\(n\) => n \+ 1\)\}/);
  assert.doesNotMatch(retry, /handleStart|Test starten/, 'no Start in the error state');
  assert.match(doors, /onClick=\{handleStart\} disabled=\{!canStart\}/);
  assert.match(doors, /lookup === 'pending' \? 'Wird geladen…'/);
});
