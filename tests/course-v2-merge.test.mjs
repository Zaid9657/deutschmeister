// Course v2 — a signed-out learner's progress follows them into their new account
// (owner decision 2026-10-01, audit CT-02), and the sign-up round trip returns to the step
// they left. src/lib/course-v2/mergeLocal.js, src/lib/course-v2/localState.js,
// src/lib/returnPath.js. The rules pinned here are the four in mergeLocal.js's header.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planV2Merge, mergeLocalV2, answerStage, unitNrOf, hasLocalV2Progress } from '../src/lib/course-v2/mergeLocal.js';
import { LOCAL_KEY, readLocal, removeLocalUnit, localStepDone, localUnitStatus, localTestOut, localAnswers } from '../src/lib/course-v2/localState.js';
import { STEP_MARKER_STAGE, TESTOUT_MARKER_STAGE, foldMarkers } from '../src/lib/course-v2/progress.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function memoryStore(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    has: (k) => m.has(k),
  };
}

// A learner who played unit 1 twice through step 1, finished it, tested out of unit 2 and
// answered two Plateau items — all signed out, in this browser.
function guestStore() {
  const s = memoryStore();
  localStepDone('a1.1-u01', 'a1.1', 'a1.1-u01-ls1', s);
  localStepDone('a1.1-u01', 'a1.1', 'a1.1-u01-ls1', s);
  localStepDone('a1.1-u01', 'a1.1', 'a1.1-u01-ls2', s);
  localUnitStatus('a1.1-u01', 'a1.1', 'complete', s);
  localTestOut('a1.1-u02', 'a1.1', ['a1.1-u02-ls1', 'a1.1-u02-ls2'], s);
  localStepDone('a1.1-p1', 'a1.1', 'a1.1-p1-s1', s);
  localAnswers('a1.1-p1', 'a1.1', { 'a1.1-p1-i1': true, 'a1.1-p1-i2': false }, s);
  return s;
}

test('the plan: run counts survive as markers, a test-out as test-out markers, Plateau answers under their stage', () => {
  const plans = planV2Merge(readLocal(guestStore()));
  const by = Object.fromEntries(plans.map((p) => [p.unitId, p]));
  assert.deepEqual(Object.keys(by).sort(), ['a1.1-p1', 'a1.1-u01', 'a1.1-u02']);

  const u1 = by['a1.1-u01'];
  assert.deepEqual(u1.status, { kind: 'save', status: 'complete' });
  assert.equal(u1.seedCards, true);
  const rows = u1.markers.map((m) => ({ lektion_id: 'a1.1-u01', item_id: m.itemId, stage: m.stage }));
  const folded = foldMarkers(rows);
  assert.equal(folded.stepRuns.get('a1.1-u01-ls1'), 2, 'two local runs stay two runs (the next draw\'s attempt number)');
  assert.equal(folded.stepRuns.get('a1.1-u01-ls2'), 1);
  assert.deepEqual([...folded.finishedSteps.get('a1.1-u01')].sort(), ['a1.1-u01-ls1', 'a1.1-u01-ls2']);

  const u2 = by['a1.1-u02'];
  assert.deepEqual(u2.status, { kind: 'start' }, 'a test-out keeps started in lesson_progress (pre-migration safe)');
  assert.ok(u2.markers.every((m) => m.stage === TESTOUT_MARKER_STAGE));
  assert.equal(u2.markers.length, 2);
  assert.deepEqual(u2.answers, []);

  const p1 = by['a1.1-p1'];
  assert.deepEqual(p1.answers.map((a) => [a.itemId, a.stage, a.correct]), [['a1.1-p1-i1', 'plateau', true], ['a1.1-p1-i2', 'plateau', false]]);
  assert.ok(p1.markers.every((m) => m.stage === STEP_MARKER_STAGE));
});

test('the plan never downgrades the account: status only when it ranks higher, start only when no row exists', () => {
  const store = readLocal(guestStore());
  const server = new Map([['a1.1-u01', 'gold'], ['a1.1-u02', 'started'], ['a1.1-p1', 'started']]);
  const by = Object.fromEntries(planV2Merge(store, server).map((p) => [p.unitId, p]));
  assert.equal(by['a1.1-u01'].status, null, 'local complete never overwrites the account\'s gold');
  assert.equal(by['a1.1-u02'].status, null, 'an existing row is never re-opened');
  assert.equal(by['a1.1-p1'].status, null);
  const up = Object.fromEntries(planV2Merge(store, new Map([['a1.1-u01', 'started']])).map((p) => [p.unitId, p]));
  assert.deepEqual(up['a1.1-u01'].status, { kind: 'save', status: 'complete' }, 'started → complete is an upgrade');
});

test('answer stages and unit numbers come from the ids', () => {
  assert.equal(answerStage('a1.1-p2'), 'plateau');
  assert.equal(answerStage('a1.1-ht-sd1'), 'abschluss');
  assert.equal(answerStage('a1.1-u07'), null);
  assert.equal(unitNrOf('a1.1-u07'), 7);
  assert.equal(unitNrOf('a1.1-p2'), null);
});

function fakeDeps(store, { failMarkersFor = null, serverRows = [], readError = null } = {}) {
  const calls = [];
  const client = {
    from: (table) => ({
      select: () => ({ eq: () => ({ in: async () => (readError ? { data: null, error: { message: readError } } : { data: serverRows, error: null }) }) }),
      table,
    }),
  };
  return {
    calls,
    deps: {
      client,
      readLocal: () => readLocal(store),
      removeLocalUnit: (id) => removeLocalUnit(id, store),
      saveUnitStatus: async (uid, w) => { calls.push(['save', w.unitId, w.status]); return true; },
      startUnit: async (uid, level, unitId) => { calls.push(['start', unitId]); return true; },
      logAttempts: async (uid, w, rows) => {
        const kind = rows.some((r) => r.stage === STEP_MARKER_STAGE || r.stage === TESTOUT_MARKER_STAGE) ? 'markers' : 'answers';
        calls.push([kind, w.lektionId, rows.length]);
        return !(kind === 'markers' && w.lektionId === failMarkersFor);
      },
      seedUnitCards: async (uid, unit) => { calls.push(['seed', unit.id]); return true; },
      loadUnit: async (level, nr) => ({ id: `${level}-u${String(nr).padStart(2, '0')}` }),
    },
  };
}

test('the merge writes unit by unit — status, answers, then ONE marker batch — and clears each unit only when it landed', async () => {
  const store = guestStore();
  const { calls, deps } = fakeDeps(store);
  const merged = await mergeLocalV2('user-1', deps);
  assert.equal(merged, 3);
  assert.equal(store.has(LOCAL_KEY), false, 'the store is gone once every unit is in the account');
  const u1 = calls.filter((c) => c[1] === 'a1.1-u01');
  assert.deepEqual(u1.map((c) => c[0]), ['save', 'markers', 'seed']);
  assert.deepEqual(calls.find((c) => c[0] === 'markers' && c[1] === 'a1.1-u01'), ['markers', 'a1.1-u01', 3]);
  const p1 = calls.filter((c) => c[1] === 'a1.1-p1').map((c) => c[0]);
  assert.deepEqual(p1, ['start', 'answers', 'markers'], 'answers before markers: a failed batch can never double a run');
  assert.equal(hasLocalV2Progress(readLocal(store)), false);
});

test('a failed write keeps that unit for the next load and does not touch the others', async () => {
  const store = guestStore();
  const { deps } = fakeDeps(store, { failMarkersFor: 'a1.1-u02' });
  const merged = await mergeLocalV2('user-1', deps);
  assert.equal(merged, 2);
  assert.deepEqual(Object.keys(readLocal(store).units), ['a1.1-u02'], 'only the failed unit stays local');
});

test('an unreadable account stops the merge before any write (no blind status write)', async () => {
  const store = guestStore();
  const { calls, deps } = fakeDeps(store, { readError: 'offline' });
  assert.equal(await mergeLocalV2('user-1', deps), 0);
  assert.deepEqual(calls, []);
  assert.equal(Object.keys(readLocal(store).units).length, 3);
});

test('two pages merging at once share one run; no user or no store is a no-op', async () => {
  const store = guestStore();
  const { calls, deps } = fakeDeps(store);
  const [a, b] = await Promise.all([mergeLocalV2('user-1', deps), mergeLocalV2('user-1', deps)]);
  assert.equal(a, 3);
  assert.equal(b, 3, 'the second caller awaits the same merge');
  assert.equal(calls.filter((c) => c[0] === 'markers').length, 3, 'markers written once per unit, not twice');
  assert.equal(await mergeLocalV2(null, deps), 0);
  assert.equal(await mergeLocalV2('user-1', deps), 0, 'nothing left to merge');
});

test('every signed-in course page merges before it reads the account, and ends the return trip', () => {
  for (const f of ['src/pages/course-v2/CourseHomeV2Page.jsx', 'src/pages/course-v2/UnitPlayerPage.jsx', 'src/pages/course-v2/AssessmentPlayer.jsx']) {
    const src = read(f);
    assert.match(src, /import \{ mergeLocalV2 \} from '\.\.\/\.\.\/lib\/course-v2\/mergeLocal\.js'/, f);
    assert.match(src, /mergeLocalV2\(user\.id\)\.then\(/, `${f}: the account is read after the merge`);
    assert.match(src, /clearReturnPath\(\)/, f);
  }
});

test('the sign-in door remembers the step, and postAuthPath returns to it after a pending checkout', async () => {
  const store = memoryStore();
  globalThis.window = { localStorage: store, sessionStorage: memoryStore() };
  try {
    const { setReturnPath, peekReturnPath, clearReturnPath, isCourseReturnPath } = await import('../src/lib/returnPath.js');
    for (const ok of ['/course/a1.1/u/1?s=5', '/course/a1.1/v2', '/course/a1.1/p/2', '/course/a1.1/abschluss']) assert.ok(isCourseReturnPath(ok), ok);
    for (const bad of ['//evil.com', 'https://evil.com/course/a1.1/v2', '/dashboard', '/course/a1.1/u/1?s=5&x=//e', '/course/../admin']) assert.ok(!isCourseReturnPath(bad), bad);
    const t0 = Date.parse('2026-10-01T12:00:00Z');
    setReturnPath('/course/a1.1/u/1?s=5', t0);
    assert.equal(peekReturnPath(t0 + 60_000), '/course/a1.1/u/1?s=5');
    assert.equal(peekReturnPath(t0 + 4 * 24 * 3600_000), null, 'older than three days → forgotten');
    setReturnPath('/dashboard', t0);
    assert.equal(peekReturnPath(t0), '/course/a1.1/u/1?s=5', 'a non-course path is never stored');
    clearReturnPath();
    assert.equal(peekReturnPath(t0), null);
  } finally {
    delete globalThis.window;
  }
  const buy = read('src/lib/buyIntent.js');
  assert.match(buy, /if \(key\) return `\/subscription\?buy=\$\{encodeURIComponent\(key\)\}`;\n\s*return peekReturnPath\(\) \|\| '\/dashboard';/, 'checkout first, then the course step, then the dashboard');
  const prompt = read('src/components/course-v2/SignInPrompt.jsx');
  assert.match(prompt, /onClick: \(\) => setReturnPath\(here\)/);
  assert.match(prompt, /onClick=\{link\.onClick\}/);
});

test('removeLocalUnit drops one unit and the key when the store is empty', () => {
  const s = memoryStore();
  localStepDone('a1.1-u01', 'a1.1', 'a1.1-u01-ls1', s);
  localStepDone('a1.1-u02', 'a1.1', 'a1.1-u02-ls1', s);
  removeLocalUnit('a1.1-u01', s);
  assert.deepEqual(Object.keys(readLocal(s).units), ['a1.1-u02']);
  removeLocalUnit('a1.1-u02', s);
  assert.equal(s.has(LOCAL_KEY), false);
});

test('the chapter recap offers a signed-out learner to keep the progress — after finishing, never as a wall', () => {
  const player = read('src/pages/course-v2/UnitPlayerPage.jsx');
  assert.match(player, /\{!user && complete && \(\s*\/\/[^\n]*\n\s*<SaveProgressPrompt className="mt-6" \/>/);
  const strings = read('src/components/course-v2/strings.js');
  const de = strings.slice(strings.indexOf('const DE = {'), strings.indexOf('export const V2_STRINGS'));
  const lead = de.split('\n').find((l) => l.includes("'save.lead':")) || '';
  assert.match(lead, /in diesem Browser/, 'says where the progress is today');
  assert.doesNotMatch(lead, /\b(?:du|dich|dir|dein\w*)\b|Serie|XP/i, 'Sie, and no promise about streak or XP');
});
