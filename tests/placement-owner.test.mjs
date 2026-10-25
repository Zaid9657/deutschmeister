// A placement run, its snapshot and its result belong to the account that took
// it (src/pages/LevelTest.jsx).
//
// The finding (review of the integrated round-2 branch): leave A's results page
// open, sign A out and B in through another tab. The page kept A's result, and
// its userId-dependent effect wrote that result to B's profile without B taking
// a test — B's level went from A1.2 to A's B2.2. The results screen also kept
// an account's result on the browser once its account had signed out, where
// the guest path hands it to the next account that signs in.
//
// The rules, run from the page's own code:
//   1. The result is written only for the account that took the run, while it
//      is still the one signed in.
//   2. When that account is replaced on the tab (sign-out, or another account
//      from another tab), the run is hidden in the same render and dropped:
//      state, snapshot, everything.
//   3. Only a guest's run is kept on the browser. The deliberate guest-result
//      adoption (src/lib/placement.js: a signed-out result saved to the account
//      that signs up, filling an empty placement only) still works, as its own
//      explicit path — also when the guest signs in during the test.
//   4. A snapshot is offered back to its owner only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  rememberPlacement, readStoredPlacement, settlePlacement, pendingPlacement, PLACEMENT_KEY,
} from '../src/lib/placement.js';
import { PLACEMENT_PROGRESS_KEY } from '../src/components/LevelTest/drawQuestions.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const PAGE = read('src/pages/LevelTest.jsx');
const RESULTS = read('src/components/LevelTest/LevelTestResults.jsx');

const pick = (src, re, what) => {
  const m = src.match(re);
  assert.ok(m, `${what} is not where the suite looks for it`);
  return m;
};

/** The page's results effect (persist the placement), run once for the given render. */
async function resultsEffect({ testState = 'results', userId, runOwner, finalSublevel = 'B2.2' }) {
  const region = PAGE.slice(PAGE.indexOf('  // Persist the placement result.'), PAGE.indexOf('\n  return ('));
  const writes = [];
  const refreshes = [];
  const supabase = { from: (table) => ({ update: (payload) => ({ eq: async (column, id) => {
    writes.push({ table, level: payload.current_level, column, id });
    return { error: null };
  } }) }) };
  new Function('useEffect', 'testState', 'userId', 'runOwner', 'finalSublevel', 'supabase', 'refreshSubscriptionRef', region)(
    (callback) => callback(), testState, userId, runOwner, finalSublevel, supabase, { current: async () => { refreshes.push(userId); } },
  );
  await new Promise((resolve) => setImmediate(resolve));
  return { writes, refreshes };
}

/** What the page derives for a render: is the run's account gone, and what does the screen show. */
function derive({ runOwner, userId, authLoading = false, testState = 'results' }) {
  const changed = pick(PAGE, /const accountChanged = [^;]+;/, 'accountChanged')[0];
  const view = pick(PAGE, /const view = [^;]+;/, 'view')[0];
  return new Function('runOwner', 'userId', 'authLoading', 'testState', `${changed}\n${view}\nreturn { accountChanged, view };`)(
    runOwner, userId, authLoading, testState);
}

/** A browser store for src/lib/placement.js (through safeStorage). */
function withStorage(fn) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const prev = globalThis.window;
  const store = new Map();
  globalThis.window = { localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  } };
  try {
    return fn(store);
  } finally {
    if (had) globalThis.window = prev; else delete globalThis.window;
  }
}

/** The results screen's remember effect, run for one render. */
function rememberEffect({ guestRun, user, finalSublevel }) {
  const body = pick(RESULTS, /useEffect\(\(\) => \{\n\s*(if \(guestRun\) rememberPlacement\(finalSublevel\);)\n\s*\}, \[guestRun, finalSublevel\]\);/, 'the remember effect')[1];
  new Function('guestRun', 'user', 'finalSublevel', 'rememberPlacement', body)(guestRun, user, finalSublevel, rememberPlacement);
}

// ── 1. the A → B sequence ───────────────────────────────────────────────────

test("an open results page never writes its result to the next account signed in on the tab", async () => {
  // A took the test and sees B2.2: written to A, once.
  const a = await resultsEffect({ userId: 'learner-a', runOwner: 'learner-a' });
  assert.deepEqual(a.writes, [{ table: 'profiles', level: 'B2.2', column: 'id', id: 'learner-a' }]);
  assert.deepEqual(a.refreshes, ['learner-a']);

  // Another tab signs A out and B in. The effect re-runs for the new account
  // in the same commit, before the page's reset lands: nothing for B.
  const b = await resultsEffect({ userId: 'learner-b', runOwner: 'learner-a' });
  assert.deepEqual(b.writes, [], "B's profile is not touched (the bug: B's A1.2 became A's B2.2)");
  assert.deepEqual(b.refreshes, []);

  // Signed out in between: nothing either.
  assert.deepEqual((await resultsEffect({ userId: null, runOwner: 'learner-a' })).writes, []);
});

// ── 2. the run is hidden and dropped when its account is replaced ───────────

test("a run whose account is replaced is hidden in the same render, then dropped with its snapshot", () => {
  assert.deepEqual(derive({ runOwner: 'learner-a', userId: 'learner-a' }), { accountChanged: false, view: 'results' });
  assert.deepEqual(derive({ runOwner: 'learner-a', userId: 'learner-b' }), { accountChanged: true, view: 'landing' }, 'another account signed in');
  assert.deepEqual(derive({ runOwner: 'learner-a', userId: null }), { accountChanged: true, view: 'landing' }, 'signed out');
  assert.deepEqual(derive({ runOwner: 'learner-a', userId: null, authLoading: true }), { accountChanged: false, view: 'results' }, 'auth has not answered yet');
  assert.deepEqual(derive({ runOwner: null, userId: 'learner-b', testState: 'testing' }), { accountChanged: false, view: 'testing' }, "a guest's run survives a sign-in");
  assert.deepEqual(derive({ runOwner: undefined, userId: 'learner-b', testState: 'landing' }), { accountChanged: false, view: 'landing' });

  const reset = pick(PAGE, / {2}useEffect\(\(\) => \{\n {4}if \(!accountChanged\) return;\n([\s\S]*?)\n {2}\}, \[accountChanged\]\);/, 'the reset effect')[1];
  const run = (accountChanged) => {
    const calls = [];
    const set = (name) => (value) => calls.push([name, value]);
    new Function('accountChanged', 'safeRemove', 'PLACEMENT_PROGRESS_KEY', 'SESSION', 'newDraw', 'setStoredRun', 'setRunOwner', 'setQuestions',
      'setTestState', 'setCurrentQuestionIndex', 'setAnswers', 'setListeningScore', 'setListeningAnswers', 'setSpeakingScore',
      `if (!accountChanged) return;\n${reset}`)(
      accountChanged, (key, opts) => calls.push(['remove', key, opts]), PLACEMENT_PROGRESS_KEY, { session: true }, () => 'fresh draw',
      set('storedRun'), set('runOwner'), set('questions'), set('testState'), set('index'), set('answers'), set('listening'), set('listeningAnswers'), set('speaking'));
    return calls;
  };
  assert.deepEqual(run(false), []);
  const calls = new Map(run(true).map(([name, ...rest]) => [name, rest]));
  assert.deepEqual(calls.get('remove'), [PLACEMENT_PROGRESS_KEY, { session: true }], 'its snapshot goes too');
  assert.deepEqual(calls.get('testState'), ['landing']);
  assert.deepEqual(calls.get('runOwner'), [undefined]);
  assert.deepEqual(calls.get('answers'), [[]]);
  assert.deepEqual(calls.get('storedRun'), [null]);
  assert.deepEqual(calls.get('questions'), ['fresh draw']);

  // Every step renders from `view`, never from the raw state.
  const jsx = PAGE.slice(PAGE.indexOf('\n  return ('));
  for (const step of ['landing', 'testing', 'listening', 'speaking', 'results']) assert.match(jsx, new RegExp(`\\{view === '${step}' &&`), step);
  assert.doesNotMatch(jsx, /testState === '/);
});

test('a run started before auth answered belongs to whoever auth then names', () => {
  const body = pick(PAGE, / {2}useEffect\(\(\) => \{\n {4}(if \(testState !== 'landing' && runOwner === undefined && !authLoading\) setRunOwner\(userId\);)\n {2}\}, \[testState, runOwner, authLoading, userId\]\);/, 'the binding effect')[1];
  const bind = (args) => {
    let bound = 'unset';
    new Function('testState', 'runOwner', 'authLoading', 'userId', 'setRunOwner', body)(args.testState, args.runOwner, args.authLoading, args.userId, (v) => { bound = v; });
    return bound;
  };
  assert.equal(bind({ testState: 'testing', runOwner: undefined, authLoading: false, userId: 'learner-a' }), 'learner-a');
  assert.equal(bind({ testState: 'testing', runOwner: undefined, authLoading: false, userId: null }), null, 'a guest');
  assert.equal(bind({ testState: 'testing', runOwner: undefined, authLoading: true, userId: null }), 'unset', 'not before auth answers');
  assert.equal(bind({ testState: 'testing', runOwner: 'learner-a', authLoading: false, userId: 'learner-b' }), 'unset', 'a bound run is never re-bound');
  assert.equal(bind({ testState: 'landing', runOwner: undefined, authLoading: false, userId: 'learner-a' }), 'unset');
  assert.match(PAGE, /setRunOwner\(authLoading \? undefined : userId\);/, 'a new run is bound to whoever is signed in when it starts');
  assert.match(PAGE, /setRunOwner\(resumable\.owner\);/);
});

// ── 3. only a guest's result is kept on the browser ─────────────────────────

test("an account's result is never kept on the browser after a sign-out, so the next account cannot claim it", () => {
  withStorage((store) => {
    // A's results screen is open; A signs out on another tab (user is null now).
    rememberEffect({ guestRun: false, user: null, finalSublevel: 'B2.2' });
    assert.equal(store.has(PLACEMENT_KEY), false, "A's result is not handed to the guest path");
    // B signs in: nothing to claim, B keeps its own level.
    assert.deepEqual(settlePlacement({ stored: readStoredPlacement(), currentLevel: 'A1.2' }), { claim: null, forget: false });
    assert.deepEqual(settlePlacement({ stored: readStoredPlacement(), currentLevel: 'a1' }), { claim: null, forget: false });
  });
  assert.match(PAGE, /guestRun=\{runOwner === null\}/);
});

// ── 3b. the deliberate guest adoption still works ───────────────────────────

test('guest adoption: a signed-out result is saved to the account that signs up, and only into an empty placement', async () => {
  await withStorage(async () => {
    // A guest finishes signed out: the results screen keeps the shown level.
    rememberEffect({ guestRun: true, user: null, finalSublevel: 'B1.2' });
    assert.equal(pendingPlacement(), 'B1.2');
    // The guest signs up: the first profile load claims it for the new account…
    assert.deepEqual(settlePlacement({ stored: readStoredPlacement(), currentLevel: 'a1' }), { claim: 'B1.2', forget: false });
    // …and never overwrites an account that already has a placement.
    assert.deepEqual(settlePlacement({ stored: readStoredPlacement(), currentLevel: 'A2.1' }), { claim: null, forget: true });

    // The page itself never writes a guest's run to an account directly, even
    // when the guest signed in during the test; it reloads the profile so the
    // explicit path (settlePendingPlacement) claims the kept result now.
    rememberEffect({ guestRun: true, user: { id: 'learner-b' }, finalSublevel: 'A2.2' });
    assert.equal(pendingPlacement(), 'A2.2', 'kept for the explicit path, also when signed in by now');
    const guest = await resultsEffect({ userId: 'learner-b', runOwner: null, finalSublevel: 'A2.2' });
    assert.deepEqual(guest.writes, []);
    assert.deepEqual(guest.refreshes, ['learner-b']);
    assert.deepEqual((await resultsEffect({ userId: null, runOwner: null })).refreshes, [], 'signed out: nothing to reload');
  });
  // The explicit path is the profile load's settle step, filling an empty placement only.
  const ctx = read('src/contexts/SubscriptionContext.jsx');
  assert.match(ctx, /currentProfile = await settlePendingPlacement\(user\.id, currentProfile\);/);
  assert.match(read('src/services/placementService.js'), /settlePlacement\(/);
  // The "save my results" door still shows to the signed-out guest.
  assert.match(RESULTS, /\{!user && \(/);
  assert.match(RESULTS, /href=\{placementSignupHref\(finalSublevel\)\}/);
});

// ── 4. a snapshot goes back to its owner only ───────────────────────────────

test('an unfinished run is offered back to its owner only, once auth has answered', () => {
  const line = pick(PAGE, /const resumable = [^;]+;/, 'resumable')[0];
  const offer = (storedRun, userId, authLoading = false) =>
    new Function('storedRun', 'userId', 'authLoading', `${line}\nreturn resumable;`)(storedRun, userId, authLoading);
  const runOfA = { owner: 'learner-a', testState: 'testing' };
  const guestRun = { owner: null, testState: 'listening' };
  assert.equal(offer(runOfA, 'learner-a'), runOfA);
  assert.equal(offer(runOfA, 'learner-b'), null, "B is never offered A's run");
  assert.equal(offer(runOfA, null), null);
  assert.equal(offer(runOfA, 'learner-a', true), null, 'not before auth answers');
  assert.equal(offer(guestRun, null), guestRun);
  assert.equal(offer(guestRun, 'learner-b'), null);
  assert.equal(offer(null, 'learner-a'), null);
});
