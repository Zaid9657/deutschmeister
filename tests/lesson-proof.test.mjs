import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { answerProof, hideProofModel, packProof, proofAttempts, proofItem, proofPassed, proofPosition, proofResumeIndex, proofTasks, canCompleteProofLesson } from '../src/lib/lesson/proof.js';
import { packRun, unpackRun } from '../src/lib/lesson/runState.js';
import { practiceScore } from '../src/lib/lesson/mastery.js';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const lesson = CURRICULUM_A11.lektionen[0];
const tasks = proofTasks(lesson);
const names = { surname: 'Noor', full: 'Sam Noor' };
const solutions = ['Guten Tag. Auf Wiedersehen.', 'Ich heiße Sam Noor.', 'N O O R', 'Wie geht es Ihnen? Mir geht es gut, danke.'];
const answer = (state, value) => answerProof(tasks, state, { kind: 'typed', value }, names);

test('proof is optional, ordered in part 3, and preserves legacy and later lessons', () => {
  for (const c of [CURRICULUM_A11, CURRICULUM_A12]) {
    const pool = JSON.parse(read(`src/data/lessonPools/${c.level === 'a1.1' ? 'a11' : 'a12'}.json`));
    for (const l of c.lektionen) {
      const stages = buildLesson({ curriculum: c, lektion: l, pool }).stages;
      assert.equal(stages.some((s) => s.kind === 'proof'), !!l.proof);
      assert.deepEqual(stages.slice(- (l.proof ? 5 : 4)).map((s) => s.kind), l.proof ? ['speaking', 'writing', 'proof', 'requeue', 'recap'] : ['speaking', 'writing', 'requeue', 'recap']);
      if (l.proof) assert.equal(stages.find((s) => s.kind === 'proof').part, 3);
      else assert.equal(canCompleteProofLesson(l, {}), true);
    }
  }
});

test('a wrong response never passes; hint, second try, reteach and hidden retry repeat without limit', () => {
  let state = packProof();
  for (let cycle = 0; cycle < 10; cycle++) {
    state = answer(state, 'Nein');
    assert.equal(state.phase, 'hint');
    assert.equal(proofPosition(tasks, state), 0);
    state = answer(state, 'Nein');
    assert.equal(state.phase, 'reteach');
    assert.equal(proofPassed(tasks, state), false);
    assert.deepEqual(answer(state, solutions[0]), state, 'cannot answer while the model is visible');
    state = hideProofModel(state);
    assert.equal(state.phase, 'ask');
  }
  for (const solution of solutions) state = answer(state, solution);
  assert.equal(proofPassed(tasks, state), true);
  assert.deepEqual(state.goals.map((g) => g.firstTry), [false, true, true, true]);
  const rows = proofAttempts(tasks, state);
  assert.deepEqual(rows.map((r) => r.correct), [false, true, true, true]);
  assert.equal(practiceScore([...rows, { stage: 'practice', itemId: 'p', correct: false }]).accuracy, 0);
  assert.deepEqual(answer(state, 'Nein'), state, 'Back to a passed proof cannot un-pass it');
});

test('microphone pass uses the shared threshold; self-confirmation and unsure results never pass', () => {
  const start = packProof();
  for (const result of [{ selfConfirmed: true, pct: 1, usedMic: true }, { usedMic: false, pct: 1 }, { usedMic: true, pct: null }]) {
    assert.deepEqual(answerProof(tasks, start, { kind: 'mic', result }, names), start);
  }
  assert.equal(answerProof(tasks, start, { kind: 'self-confirm' }, names).goals.length, 0);
  assert.equal(answerProof(tasks, start, { kind: 'mic', result: { pct: 0.79, usedMic: true } }, names).phase, 'hint');
  assert.equal(answerProof(tasks, start, { kind: 'mic', result: { pct: 0.8, usedMic: true } }, names).goals[0].passed, true);
  const ui = read('src/components/lesson/ReadAloudLine.jsx');
  assert.match(ui, /!proof && canSelfConfirmReadAloud/);
  assert.match(ui, /proof && \(!Number.isFinite\(data.pct\)/);
});

test('own-name answers reuse introduction and scene adapters and the common checker', () => {
  assert.equal(proofItem(tasks[1], names, 'Hallo').answer, null);
  assert.equal(proofItem(tasks[1], names, 'Ich heiße Jo Lee.').answer, 'Ich heiße Jo Lee.');
  assert.equal(proofItem(tasks[2], names).answer, 'N-O-O-R.');
  let state = answer(packProof(), solutions[0]);
  assert.equal(answer(state, 'Ich heiße').goals[1].passed, false);
  state = answer(state, solutions[1]);
  assert.equal(state.goals[1].passed, true);
  assert.equal(answer(state, 'N O R').goals[2].passed, false);
});

test('reload and resume preserve help and results, never trust an item/stage index as a pass', () => {
  let state = answer(packProof(), 'Nein');
  const run = unpackRun(packRun({ stageKey: 'proof', stageIndex: 2, itemIndex: 999, proof: { ...state, text: 'private name' } }));
  assert.deepEqual(run.proof, state);
  assert.doesNotMatch(JSON.stringify(run), /private name/);
  const stages = [{ kind: 'writing' }, { kind: 'proof', tasks }, { kind: 'requeue' }, { kind: 'recap' }];
  for (const i of [2, 3]) assert.equal(proofResumeIndex(stages, i, run.proof), 1);
  assert.equal(canCompleteProofLesson(lesson, run.proof), false);
  assert.equal(proofPassed(tasks, { goals: tasks.map(() => ({ passed: true })) }), false);
  assert.equal(answer(run.proof, 'Nein').phase, 'reteach');
  state = hideProofModel(answer(run.proof, 'Nein'));
  for (const solution of solutions) state = answer(state, solution);
  assert.equal(canCompleteProofLesson(lesson, state), true);
  assert.equal(proofResumeIndex(stages, 3, state), 3);
});

test('rendered proof loop hides solutions, restores reteach, and enables completion only after every checked response', async () => {
  const { loadJsxModule } = await import('./helpers/renderJsx.mjs');
  let state = packProof(), cursor = 0, ended = 0;
  const values = [];
  const { default: ProofStage } = await loadJsxModule('src/components/lesson/ProofStage.jsx', {
    react: { useState: (initial) => { const at = cursor++; if (!(at in values)) values[at] = initial; return [values[at], (v) => { values[at] = v; }]; } },
    '../../contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '../../lib/course/canDo.js': { canDoLines: () => lesson.canDo },
    '../../lib/lesson/guidedFeedback.js': await import('../src/lib/lesson/guidedFeedback.js'),
    '../../lib/lesson/proof.js': await import('../src/lib/lesson/proof.js'),
    '../../lib/lesson/strings.js': { useLessonLang: () => ['de'], t: (key) => key },
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    './LangToggle.jsx': { default: 'LangToggle' }, './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
  });
  const nodes = (n) => !n || typeof n !== 'object' ? [] : [n, ...(n.props?.children || []).flat(Infinity).flatMap(nodes)];
  const render = () => { cursor = 0; return ProofStage({ stage: { tasks }, lesson, state, names, onNamesChange: () => {}, onAnswer: (r) => { state = answerProof(tasks, state, r, names); }, onHideModel: () => { state = hideProofModel(state); }, onDone: () => { ended++; } }); };
  const button = () => nodes(render()).find((n) => n.type === 'Button');
  const enter = (value) => { nodes(render()).find((n) => n.type === 'textarea').props.onChange({ target: { value } }); button().props.onClick(); };
  assert.equal(button().props.disabled, true);
  assert.doesNotMatch(JSON.stringify(render()), /Guten Tag|Auf Wiedersehen/);
  enter('Nein'); assert.equal(state.phase, 'hint'); assert.equal(ended, 0);
  assert.doesNotMatch(JSON.stringify(render()), /Guten Tag|Auf Wiedersehen/);
  enter('Nein'); assert.equal(state.phase, 'reteach');
  assert.match(JSON.stringify(render()), /Auf Wiedersehen/);
  assert.ok(nodes(render()).some((n) => n.type === 'PlayButton'));
  state = unpackRun(packRun({ stageKey: 'proof', proof: state })).proof;
  assert.match(JSON.stringify(render()), /Auf Wiedersehen/, 'reload restores the taught model, not a pass');
  button().props.onClick();
  assert.equal(state.phase, 'ask');
  assert.doesNotMatch(JSON.stringify(render()), /Guten Tag|Auf Wiedersehen/);
  for (const solution of solutions) enter(solution);
  assert.equal(proofPassed(tasks, state), true);
  assert.equal(ended, 0);
  button().props.onClick(); assert.equal(ended, 1);
});
