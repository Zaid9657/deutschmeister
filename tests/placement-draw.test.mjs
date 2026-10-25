// The placement test's draw (src/components/LevelTest/drawQuestions.js) and how
// src/pages/LevelTest.jsx uses it.
//
//   1. The key a learner sees is shuffled per draw (C-163). The stored keys sat
//      at A/B/C/D 20/39/18/3 and the options rendered in stored order, so a
//      tester who always clicked B scored 6/10 on B2, the pass mark, in 67% of
//      draws. Now a learner who always clicks the same letter (each of A–D) is
//      placed at A1.1 in at least 97% of seeded runs with the real bank.
//   2. "Retake Test" draws a new set (C-166): the draw was a memo that never
//      re-ran, so a retake served the same 40 questions in the same order.
//   3. A run in progress survives a reload or back-swipe (C-085/X-086): a
//      snapshot of ids, option orders, answers and step is kept in this tab's
//      sessionStorage, rebuilt only when it can be rebuilt exactly, and cleared
//      on results and on a new run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  drawQuestions, withOptionOrder, answerFor, shuffle,
  placementSnapshot, restorePlacement,
  PLACEMENT_BANDS, QUESTIONS_PER_BAND, PLACEMENT_PROGRESS_KEY, PLACEMENT_PROGRESS_VERSION, RESUMABLE_STEPS,
} from '../src/components/LevelTest/drawQuestions.js';
import { calculatePlacement } from '../src/components/LevelTest/placementResult.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const BANK = JSON.parse(read('src/data/levelTestQuestions.json')).questions;

/** mulberry32: a small seeded generator, so every run of this suite sees the same draws. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stored = new Map(BANK.map((q) => [q.id, q]));

// ── 1. the key a learner sees ───────────────────────────────────────────────

test('a draw asks ten distinct questions per band, in ladder order, each keyed to the same answer text', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const draw = drawQuestions(BANK, { random: seeded(seed) });
    assert.equal(draw.length, PLACEMENT_BANDS.length * QUESTIONS_PER_BAND);
    assert.equal(new Set(draw.map((q) => q.id)).size, draw.length);
    assert.deepEqual(draw.map((q) => q.level), PLACEMENT_BANDS.flatMap((b) => Array(QUESTIONS_PER_BAND).fill(b)));
    for (const q of draw) {
      const original = stored.get(q.id);
      assert.deepEqual([...q.options].sort(), [...original.options].sort(), `${q.id}: same options`);
      assert.equal(q.options[q.correctIndex], original.options[original.correctIndex], `${q.id}: the key follows its option`);
      assert.deepEqual(q.optionOrder.map((i) => original.options[i]), q.options);
    }
  }
});

test('every position carries the key about a quarter of the time, whatever the stored order', () => {
  const shown = [0, 0, 0, 0];
  const RUNS = 1000;
  for (let seed = 1; seed <= RUNS; seed++) {
    for (const q of drawQuestions(BANK, { random: seeded(seed) })) shown[q.correctIndex] += 1;
  }
  const total = shown.reduce((a, b) => a + b, 0);
  for (const [i, n] of shown.entries()) {
    const share = n / total;
    assert.ok(share > 0.23 && share < 0.27, `position ${'ABCD'[i]} holds ${(share * 100).toFixed(1)}% of the keys`);
  }
  // One item on its own, too: its key is not pinned to where the author typed it.
  const one = BANK.find((q) => q.id === 'B2-001');
  const seen = new Set();
  for (let seed = 1; seed <= 200; seed++) seen.add(withOptionOrder(one, shuffle([0, 1, 2, 3], seeded(seed))).correctIndex);
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
});

test('a learner who always clicks the same letter is placed at A1.1 in at least 97% of runs', () => {
  const RUNS = 2000;
  for (const letter of [0, 1, 2, 3]) {
    let atStart = 0;
    for (let seed = 1; seed <= RUNS; seed++) {
      const questions = drawQuestions(BANK, { random: seeded(seed * 7 + letter) });
      const answers = questions.map((q) => answerFor(q, letter));
      if (calculatePlacement({ answers, questions }).sublevel === 'A1.1') atStart += 1;
    }
    assert.ok(atStart / RUNS >= 0.97, `always ${'ABCD'[letter]}: A1.1 in ${(100 * atStart / RUNS).toFixed(1)}% of runs`);
  }
});

test('an honest learner still lands where their answers say', () => {
  // Knows A1–B1 (answers right), guesses B2 by always clicking A.
  let atB1 = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const questions = drawQuestions(BANK, { random: seeded(seed) });
    const answers = questions.map((q) => answerFor(q, q.level === 'B2' ? 0 : q.correctIndex));
    if (calculatePlacement({ answers, questions }).sublevel.startsWith('B1')) atB1 += 1;
  }
  assert.ok(atB1 / 300 >= 0.95, `B1 knowledge lands at B1.x in ${(100 * atB1 / 300).toFixed(1)}% of runs`);
});

test('LevelTest scores the shown order and keeps the draw in state', () => {
  const page = read('src/pages/LevelTest.jsx');
  assert.match(page, /const newDraw = \(\) => drawQuestions\(BANK\);/);
  assert.match(page, /const \[questions, setQuestions\] = useState\(newDraw\);/);
  assert.doesNotMatch(page, /const questions = useMemo/, 'a memo with no deps never re-draws');
  assert.match(page, /answerFor\(currentQuestion, selectedIndex\)/, 'scored against the remapped key');
  const question = read('src/components/LevelTest/LevelTestQuestion.jsx');
  assert.match(question, /question\.options\.map\(\(option, index\)/, 'the card renders the drawn order');
});

// ── 2. a retake draws a new set ─────────────────────────────────────────────

test('"Retake Test" starts a new run with a new draw and no old snapshot', () => {
  const page = read('src/pages/LevelTest.jsx');
  assert.match(page, /onRetake=\{startTest\}/);
  const body = page.match(/ {2}const startTest = \(\) => \{([\s\S]*?)\n {2}\};/)[1];
  const calls = [];
  const draws = [];
  const set = (name) => (value) => calls.push([name, value]);
  let seed = 0;
  const run = new Function(
    'safeRemove', 'PLACEMENT_PROGRESS_KEY', 'SESSION', 'newDraw', 'setStoredRun', 'setRunOwner', 'authLoading', 'userId',
    'setQuestions', 'setTestState', 'setCurrentQuestionIndex', 'setAnswers', 'setListeningScore', 'setListeningAnswers', 'setSpeakingScore',
    body,
  );
  const args = [
    (key, opts) => calls.push(['remove', key, opts]), PLACEMENT_PROGRESS_KEY, { session: true },
    () => { const d = drawQuestions(BANK, { random: seeded(++seed) }); draws.push(d); return d; },
    set('storedRun'), set('owner'), false, 'learner-a',
    set('questions'), set('state'), set('index'), set('answers'), set('listening'), set('listeningAnswers'), set('speaking'),
  ];
  run(...args);
  run(...args);
  assert.deepEqual(calls.filter(([n]) => n === 'owner').map(([, v]) => v), ['learner-a', 'learner-a'], 'each run belongs to whoever is signed in when it starts');
  const given = calls.filter(([n]) => n === 'questions').map(([, v]) => v);
  assert.equal(given.length, 2);
  assert.equal(given[0], draws[0]);
  assert.equal(given[1], draws[1]);
  assert.notDeepEqual(given[0].map((q) => q.id), given[1].map((q) => q.id), 'the retake asks other questions');
  assert.deepEqual(calls.filter(([n]) => n === 'remove'), [['remove', PLACEMENT_PROGRESS_KEY, { session: true }], ['remove', PLACEMENT_PROGRESS_KEY, { session: true }]]);
  assert.deepEqual(calls.filter(([n]) => n === 'state').map(([, v]) => v), ['testing', 'testing']);
  assert.deepEqual(calls.filter(([n]) => n === 'answers').map(([, v]) => v), [[], []]);
});

// ── 3. the run in progress ──────────────────────────────────────────────────

const midRun = (seed = 3, owner = 'learner-a') => {
  const questions = drawQuestions(BANK, { random: seeded(seed) });
  const answers = questions.slice(0, 12).map((q, i) => answerFor(q, i % 4));
  return { questions, answers, currentQuestionIndex: 12, testState: 'testing', listeningScore: null, owner };
};

test('a snapshot rebuilds the same run: questions, option orders, answers re-scored, position, owner', () => {
  const state = midRun();
  const snapshot = JSON.parse(JSON.stringify(placementSnapshot(state)));
  assert.equal(snapshot.v, PLACEMENT_PROGRESS_VERSION);
  assert.deepEqual(Object.keys(snapshot.answers[0]).sort(), ['questionId', 'selectedIndex'], 'only what the learner chose is kept');
  const back = restorePlacement(BANK, snapshot);
  assert.deepEqual(back.questions.map((q) => [q.id, q.options, q.correctIndex]), state.questions.map((q) => [q.id, q.options, q.correctIndex]));
  assert.deepEqual(back.answers, state.answers);
  assert.equal(back.currentQuestionIndex, 12);
  assert.equal(back.testState, 'testing');
  assert.equal(back.owner, 'learner-a');
  assert.equal(restorePlacement(BANK, JSON.parse(JSON.stringify(placementSnapshot(midRun(3, null))))).owner, null, 'a guest run');
  assert.deepEqual(calculatePlacement(back), calculatePlacement(state));

  for (const step of ['listening', 'speaking']) {
    const later = restorePlacement(BANK, { ...snapshot, testState: step, currentQuestionIndex: 39, listeningScore: step === 'speaking' ? 64 : null });
    assert.equal(later.testState, step, `${step} resumes (at its intro screen)`);
    assert.equal(later.listeningScore, step === 'speaking' ? 64 : null);
  }
  assert.deepEqual(RESUMABLE_STEPS, ['testing', 'listening', 'speaking']);
});

test('a snapshot that cannot be rebuilt exactly is not offered', () => {
  const snapshot = placementSnapshot(midRun());
  const broken = [
    null, 'x', {}, { ...snapshot, v: 0 },
    { ...snapshot, owner: undefined }, { ...snapshot, owner: '' }, { ...snapshot, owner: 42 },
    { ...snapshot, testState: 'results' }, { ...snapshot, testState: 'landing' },
    { ...snapshot, questionIds: snapshot.questionIds.map((id, i) => (i === 5 ? 'A1-999' : id)) },
    { ...snapshot, questionIds: [...snapshot.questionIds.slice(0, 39), snapshot.questionIds[0]] },
    { ...snapshot, optionOrders: snapshot.optionOrders.map((o, i) => (i === 2 ? [0, 0, 1, 2] : o)) },
    { ...snapshot, optionOrders: snapshot.optionOrders.slice(1) },
    { ...snapshot, currentQuestionIndex: 40 },
    { ...snapshot, answers: [{ questionId: 'not-asked', selectedIndex: 0 }] },
    { ...snapshot, answers: [{ questionId: snapshot.questionIds[0], selectedIndex: 4 }] },
  ];
  for (const s of broken) assert.equal(restorePlacement(BANK, s), null, JSON.stringify(s)?.slice(0, 80));
  // A content fix after the snapshot re-scores against the bank as it is now.
  const bank = BANK.map((q) => (q.id === snapshot.questionIds[0] ? { ...q, correctIndex: (q.correctIndex + 1) % 4 } : q));
  const back = restorePlacement(bank, snapshot);
  const first = back.questions[0];
  assert.equal(back.answers[0].isCorrect, back.answers[0].selectedIndex === first.correctIndex);
});

test('LevelTest keeps the snapshot in this tab on every step and clears it on results and on a new run', () => {
  const page = read('src/pages/LevelTest.jsx');
  assert.match(page, /const SESSION = \{ session: true \};/, 'sessionStorage: this tab only');
  assert.match(page, /useState\(\(\) => restorePlacement\(BANK, safeGetJSON\(PLACEMENT_PROGRESS_KEY, null, SESSION\)\)\)/);
  const effect = page.match(/ {2}useEffect\(\(\) => \{\n( {4}if \(runOwner === undefined \|\| accountChanged\) return;\n[\s\S]*?)\n {2}\}, \[questions, answers, currentQuestionIndex, testState, listeningScore, runOwner, accountChanged\]\);/);
  assert.ok(effect, 'the snapshot effect');
  const store = new Map();
  const run = (testState, opts = {}) => {
    const { state = midRun(), accountChanged = false } = opts;
    const runOwner = 'runOwner' in opts ? opts.runOwner : 'learner-a'; // an explicit undefined is "no owner yet"
    return runEffect(testState, state, runOwner, accountChanged);
  };
  const runEffect = (testState, state, runOwner, accountChanged) => new Function(
    'RESUMABLE_STEPS', 'safeSetJSON', 'safeRemove', 'placementSnapshot', 'PLACEMENT_PROGRESS_KEY', 'SESSION',
    'questions', 'answers', 'currentQuestionIndex', 'testState', 'listeningScore', 'runOwner', 'accountChanged',
    effect[1],
  )(
    RESUMABLE_STEPS, (k, v, o) => { assert.deepEqual(o, { session: true }); store.set(k, JSON.parse(JSON.stringify(v))); return true; },
    (k, o) => { assert.deepEqual(o, { session: true }); store.delete(k); return true; }, placementSnapshot, PLACEMENT_PROGRESS_KEY, { session: true },
    state.questions, state.answers, state.currentQuestionIndex, testState, state.listeningScore, runOwner, accountChanged,
  );
  run('landing');
  assert.equal(store.size, 0, 'the landing page writes nothing (an old run stays offerable)');
  run('testing', { runOwner: undefined });
  assert.equal(store.size, 0, 'no snapshot before the run has an owner');
  run('testing');
  assert.ok(restorePlacement(BANK, store.get(PLACEMENT_PROGRESS_KEY)), 'a step writes a snapshot that rebuilds');
  assert.equal(store.get(PLACEMENT_PROGRESS_KEY).owner, 'learner-a', 'under its owner');
  run('speaking');
  assert.equal(store.get(PLACEMENT_PROGRESS_KEY).testState, 'speaking');
  run('listening', { runOwner: 'learner-a', accountChanged: true });
  assert.equal(store.get(PLACEMENT_PROGRESS_KEY).testState, 'speaking', 'nothing is written once the account changed');
  run('results');
  assert.equal(store.has(PLACEMENT_PROGRESS_KEY), false, 'results clear it');

  assert.match(page, /<LevelTestLanding onStart=\{startTest\} resumeAt=\{resumeAt\} onResume=\{resumeTest\} \/>/);
  const landing = read('src/components/LevelTest/LevelTestLanding.jsx');
  assert.match(landing, /Continue your test/);
  assert.match(landing, /\{resumeAt \? \(\s*<Button size="lg" variant="secondary" onClick=\{onStart\}>/, 'one primary action: a fresh start turns secondary');
});
