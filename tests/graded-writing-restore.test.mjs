// An assessed lesson text survives a reload or a step Back (cross-check AI-15 / X-039),
// and feedback that was not saved says so (AI-14 / X-020, client half).
//
// After the AI assessment, GradedWriting dropped the draft and kept the
// assessment in component state only; WritingStage's `graded` started false
// on every mount. A reload or Back → forward showed an empty editor with Next
// disabled, and the retyped text was counted as the task's one free improved
// version (evaluate-writing courseSubmissionAllowed).
//
// No React renderer in this repo's tests: the storage helpers, `finish`, the
// mount initialisers and the restore effect are cut out of the component and
// run against a fake storage — grade, "remount", assessment shown, Next open,
// no second request.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const GW = read('src/components/lesson/GradedWriting.jsx');
const STAGE = read('src/components/lesson/WritingStage.jsx');

function cut(source, start, end) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, `not found: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, `not found after ${start}: ${end}`);
  return source.slice(from, to);
}

/** The module-level storage helpers of GradedWriting.jsx over an in-memory store. */
function helpers() {
  const store = new Map();
  const context = {
    Date, JSON,
    safeGetJSON: (key, fallback) => (store.has(key) ? JSON.parse(store.get(key)) : fallback),
    safeSetJSON: (key, value) => { store.set(key, JSON.stringify(value)); },
    safeRemove: (key) => { store.delete(key); },
  };
  const source = cut(GW, 'const DRAFT_MAX_AGE_MS', '// The feedback reached the screen').replace('export function', 'function');
  Object.assign(context, vm.runInNewContext(`${source}\n({ draftKey, readDraft, assessedKeyOf, readAssessed, forgetAssessedWriting });`, context));
  return { store, context };
}

const scored = { scored: true, pct: 0.7, total: 14, max: 20, leitpunktCheck: [true, true, false], feedback: 'Gut.', corrections: [], usedFallback: false, limitReached: false, canRevise: true, saved: true };

/** finish(), as the component defines it, with the given props/state. */
function runFinish(h, { keepAssessed, r, key }) {
  const seen = { outcome: undefined, note: undefined, reported: [] };
  const source = cut(GW, 'const finish = (r, noteText) => {', '\n  };') + '\n  };';
  const finish = vm.runInNewContext(`${source}\nfinish;`, {
    ...h.context, key, keepAssessed, text: 'Hallo Lena! Ich komme am Montag.', fields: {},
    setOutcome: (v) => { seen.outcome = v; }, setNote: (v) => { seen.note = v; },
    onResult: (v) => seen.reported.push(v),
  });
  finish(r, null);
  return seen;
}

test('grade, remount: the assessment comes back with Next open and no second grading request', () => {
  const h = helpers();
  const key = h.context.draftKey('user-1', 'a11-l04', 'a1.1-l04');
  h.context.safeSetJSON(key, { text: 'Hallo Lena! Ich komme am Montag.', fields: {}, savedAt: Date.now() });

  // 1. The grade lands: the draft is dropped (as before), the assessed text is kept beside it.
  const first = runFinish(h, { keepAssessed: true, r: scored, key });
  assert.equal(first.outcome, scored);
  assert.equal(h.context.readDraft(key), null, 'the draft is still dropped on submit');
  const kept = h.context.readAssessed(key);
  assert.equal(kept.text, 'Hallo Lena! Ich komme am Montag.');
  assert.deepEqual(kept.outcome, scored);

  // 2. Remount (reload, or Back and forward): the initialisers read the kept record…
  const init = vm.runInNewContext(`(() => {
    const restored = keepAssessed ? readAssessed(key) : null;
    return { restored, outcome: restored?.outcome || null, note: restored?.note || null };
  })()`, { ...h.context, key, keepAssessed: true });
  assert.ok(init.outcome?.scored, 'the assessment is on screen, not an empty editor');
  assert.match(GW, /const \[restored\] = useState\(\(\) => \(keepAssessed \? readAssessed\(key\) : null\)\);/);
  assert.match(GW, /const \[outcome, setOutcome\] = useState\(\(\) => restored\?\.outcome \|\| null\);/);

  // …and the restore effect reports it upward without a request.
  const effect = cut(GW, 'useEffect(() => {\n    if (!restored) return;', '}, [restored]);');
  assert.doesNotMatch(effect, /fetch\(/);
  const reported = [];
  let shownText = '';
  vm.runInNewContext(`${effect.replace('useEffect(', '(')}})()`, {
    restored: init.restored, setText: (v) => { shownText = v; }, onResultRef: { current: (v) => reported.push(v) },
  });
  assert.equal(shownText, 'Hallo Lena! Ich komme am Montag.', 'the text is back in the locked editor');
  assert.equal(reported.length, 1);

  // 3. WritingStage turns that report into an open Next.
  let graded = false;
  const handleResult = vm.runInNewContext(`(${cut(STAGE, '(r) => {\n      setGraded(true);', '\n    },\n    [onResult')}\n    })`, {
    setGraded: (v) => { graded = v; }, onReport: () => {}, onResult: () => {}, writingSummary: () => ({}),
    schreiben: { taskKey: 'a11-l04' }, stage: { key: 'writing' }, PASS_PCT: 0.6,
  });
  handleResult(reported[0]);
  assert.equal(graded, true);
  assert.match(STAGE, /primaryDisabled=\{!graded \|\| pending\}/);
  // Only submit() talks to the grader.
  assert.equal((GW.match(/fetch\(/g) || []).length, 1);
});

test('only an AI assessment in a lesson is kept: not the form-check fallback, not a checkpoint attempt', () => {
  const h = helpers();
  const key = h.context.draftKey('user-1', 'a11-l04', 'a1.1-l04');
  runFinish(h, { keepAssessed: true, r: { ...scored, scored: false, usedFallback: true }, key });
  assert.equal(h.context.readAssessed(key), null, 'a fallback leaves the learner free to get a real assessment later');
  runFinish(h, { keepAssessed: false, r: scored, key });
  assert.equal(h.context.readAssessed(key), null, 'without keepAssessed nothing is kept');
  assert.match(STAGE, /allowRevision\s+keepAssessed/, 'the lesson stage keeps it');
  assert.doesNotMatch(read('src/pages/lesson/CheckpointPage.jsx'), /keepAssessed/, 'a checkpoint attempt is always new');
  // Expired records are ignored like drafts.
  h.context.safeSetJSON(h.context.assessedKeyOf(key), { text: 'x', outcome: scored, savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000 });
  assert.equal(h.context.readAssessed(key), null);
});

test('moving on, or opening the improved-version editor, ends the kept assessment; Back keeps it', () => {
  const h = helpers();
  const key = h.context.draftKey('user-1', 'a11-l04', 'a1.1-l04');
  runFinish(h, { keepAssessed: true, r: scored, key });
  h.context.forgetAssessedWriting('user-1', 'a11-l04', 'a1.1-l04');
  assert.equal(h.context.readAssessed(key), null);
  // WritingStage's Next forgets it before advancing; Back is untouched.
  assert.match(STAGE, /const next = useCallback\(\(\) => \{\s*forgetAssessedWriting\(user\?\.id, schreiben\.taskKey, lektionId\);\s*onDone\?\.\(\);/);
  assert.match(STAGE, /onPrimary=\{next\}/);
  assert.match(STAGE, /onBack=\{onBack\}/);
  assert.match(STAGE, /lektionId=\{lektionId\}/, 'the stage and the component name the same record');
  // The improved-version editor forgets it, so a reload mid-revision shows the draft being revised.
  assert.match(GW, /onClick=\{\(\) => \{ safeRemove\(assessedKeyOf\(key\)\); setOutcome\(null\); setNote\(null\); \}\}/);
});

test('feedback the server could not save is shown with a plain notice, in both chrome languages and in Sie', async () => {
  assert.match(GW, /saved: data\.saved !== false,/);
  assert.match(GW, /\{outcome\.saved === false && \(/);
  const block = cut(GW, 'const NOT_SAVED = {', '};');
  assert.match(block, /de: 'Ihre Bewertung konnte nicht gespeichert werden — notieren Sie sich die Korrekturen\.'/);
  assert.match(block, /en: 'Your assessment could not be saved/);
  assert.doesNotMatch(block, /\b(du|dir|dich|dein\w*)\b/i);
  const page = read('src/pages/SchreibenPage.jsx');
  assert.match(page, /\{result\.saved === false && \(/, '/schreiben says it too');
  assert.match(page, /Ihre Bewertung konnte nicht gespeichert werden — notieren Sie sich die Korrekturen\./);
});
