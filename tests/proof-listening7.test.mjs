import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { answerProof, proofTaskFor, packProof, proofPassed, hideProofModel } from '../src/lib/lesson/proof.js';
import { proofFindings } from '../scripts/validate-curriculum.mjs';
const task = { type: 'listening', mode: 'choice', instances: [
  { audioText: 'fünfunddreißig', answer: '35', accepted: ['35'], options: ['35', '53', '30'] },
  { audioText: 'sechsundvierzig', answer: '46', accepted: ['46'], options: ['64', '46', '40'] },
] };
test('listening requires heard evidence on every attempt and resume, rejects speech and self-confirmation', () => {
  const initial = packProof();
  for (const response of [{ kind: 'typed', value: '35' }, { kind: 'mic', result: { usedMic: true, pct: 1 } }, { kind: 'self-confirm' }]) assert.deepEqual(answerProof([task], initial, response), initial);
  assert.equal(proofPassed([task], { goals: [{ tries: 1, passed: true }] }), false);
  const right = answerProof([task], initial, { kind: 'typed', value: '35', listened: true });
  assert.equal(proofPassed([task], right), true);
  assert.equal(packProof(right).goals[0].evidence, 'heard-listening');
  assert.doesNotMatch(JSON.stringify(right), /fünf|35|audioText|transcript/);
});
test('choice mistakes cannot earn typo credit; reteach changes instance and option order', () => {
  let state = packProof();
  state = answerProof([task], state, { kind: 'typed', value: '53', listened: true });
  assert.equal(state.goals[0].passed, false);
  assert.notDeepEqual(proofTaskFor(task, state.goals[0]).options, proofTaskFor(task).options);
  state = answerProof([task], state, { kind: 'typed', value: '30', listened: true });
  assert.equal(state.phase, 'reteach');
  state = hideProofModel(state);
  assert.equal(proofTaskFor(task, state.goals[0]).answer, '46');
  state = answerProof([task], state, { kind: 'typed', value: '35', listened: true });
  assert.equal(state.goals[0].passed, false);
  state = answerProof([task], state, { kind: 'typed', value: '46', listened: true });
  assert.equal(proofPassed([task], state), true);
});
test('instruction metalanguage is prompt-only and taught compound numbers start at their delivered set', () => {
  for (const [nr, text, allowed] of [[2, 'Antworten Sie mit einem Satz.', true], [2, 'Fragen Sie nach dem Preis.', true], [2, 'Quantencomputer', false]]) {
    const cc = structuredClone(c); cc.lektionen[0].proof.tasks[0].promptDe = text;
    const findings = proofFindings(cc).filter((f) => f.includes('untaught word'));
    assert.equal(findings.length === 0, allowed, `${nr}: ${text}`);
  }
  const cc = structuredClone(c);
  cc.lektionen[0].proof.tasks[0].parts[0].forms.push('Antworten Sie mit einem Satz.');
  assert.ok(proofFindings(cc).some((f) => /untaught word/.test(f)));
  for (const [nr, allowed] of [[2, false], [4, true]]) {
    const cc = structuredClone(c), l = cc.lektionen[nr - 1];
    l.proof = { tasks: [{ ...task, canDo: 0, promptDe: 'Wählen Sie.', promptEn: 'Choose.', answer: '35', reteach: { kind: 'wortfeld', index: 0 } }] };
    assert.equal(proofFindings(cc).some((f) => /untaught word "fünfunddreißig"/.test(f)), !allowed);
  }
});
test('rendered listening cannot submit without playback and prints the stimulus only after a failed playback offers reading', async () => {
  const { loadJsxModule } = await import('./helpers/renderJsx.mjs');
  const proof = await import('../src/lib/lesson/proof.js');
  const l = c.lektionen[3], tasks = proof.proofTasks(l);
  let state = { goals: [{ tries: 1, passed: true }, { tries: 1, passed: true }], phase: 'ask' };
  let cursor = 0;
  const values = [];
  const { default: Stage } = await loadJsxModule('src/components/lesson/ProofStage.jsx', {
    './SetReference.jsx': { default: 'SetReference' },
    react: { useState: (initial) => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (v) => { values[i] = v; }]; } },
    '../../contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '../../lib/course/canDo.js': { canDoLines: () => l.canDo },
    '../../lib/lesson/proof.js': proof,
    '../../lib/lesson/strings.js': { useLessonLang: () => ['de'], t: (key) => key },
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    './LangToggle.jsx': { default: 'LangToggle' }, './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
  });
  const nodes = (n) => !n || typeof n !== 'object' ? [] : [n, ...(n.props?.children || []).flat(Infinity).flatMap(nodes)];
  const content = (n) => typeof n === 'string' ? n : !n || typeof n !== 'object' ? '' : (n.props?.children || []).flat(Infinity).map(content).join(' ');
  const render = () => { cursor = 0; return Stage({ stage: { tasks }, lesson: l, state, names: {}, onAnswer: (r) => { state = proof.answerProof(tasks, state, r); }, onHideModel: () => {}, onDone: () => {} }); };
  const root = render(), audio = nodes(root).find((n) => n.type === 'PlayButton');
  // PlayButton shows its fallback control only in its failure state (no German voice on the device).
  assert.equal(typeof audio.props.onFallback, 'function');
  assert.equal(audio.props.text, tasks[2].instances[0].audioText);
  assert.equal(content(root).includes(audio.props.text), false);
  nodes(root).find((n) => n.type === 'select').props.onChange({ target: { value: tasks[2].answer } });
  assert.equal(nodes(render()).find((n) => n.type === 'Button').props.disabled, true);
  audio.props.onPlayed();
  const submit = nodes(render()).find((n) => n.type === 'Button');
  assert.equal(submit.props.disabled, false);
  submit.props.onClick();
  assert.equal(state.goals[2].passed, true);
  assert.equal(state.goals[2].evidence, 'heard-listening');
});

test('a device that cannot play German reads the listening goal instead: it passes, marked as read, and never locks the path', async () => {
  const { loadJsxModule } = await import('./helpers/renderJsx.mjs');
  const proof = await import('../src/lib/lesson/proof.js');
  const l = c.lektionen[3], tasks = proof.proofTasks(l);
  let state = { goals: [{ tries: 1, passed: true }, { tries: 1, passed: true }], phase: 'ask' };
  let cursor = 0;
  const values = [];
  const { default: Stage } = await loadJsxModule('src/components/lesson/ProofStage.jsx', {
    './SetReference.jsx': { default: 'SetReference' },
    react: { useState: (initial) => { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (v) => { values[i] = v; }]; } },
    '../../contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '../../lib/course/canDo.js': { canDoLines: () => l.canDo },
    '../../lib/lesson/proof.js': proof,
    '../../lib/lesson/strings.js': { useLessonLang: () => ['de'], t: (key) => key },
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    './LangToggle.jsx': { default: 'LangToggle' }, './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
  });
  const nodes = (n) => !n || typeof n !== 'object' ? [] : [n, ...(n.props?.children || []).flat(Infinity).flatMap(nodes)];
  const content = (n) => typeof n === 'string' ? n : !n || typeof n !== 'object' ? '' : (n.props?.children || []).flat(Infinity).map(content).join(' ');
  const render = () => { cursor = 0; return Stage({ stage: { tasks }, lesson: l, state, names: {}, onAnswer: (r) => { state = proof.answerProof(tasks, state, r); }, onHideModel: () => {}, onDone: () => {} }); };
  let root = render();
  const audio = nodes(root).find((n) => n.type === 'PlayButton');
  assert.equal(content(root).includes(audio.props.text), false, 'the stimulus is not printed before the fallback is taken');
  audio.props.onFallback();
  root = render();
  assert.equal(content(root).includes(audio.props.text), true, 'after a failed playback the learner can read the stimulus');
  assert.match(content(root), /proof\.readNote/);
  nodes(root).find((n) => n.type === 'select').props.onChange({ target: { value: tasks[2].answer } });
  const submit = nodes(render()).find((n) => n.type === 'Button');
  assert.equal(submit.props.disabled, false);
  submit.props.onClick();
  assert.equal(state.goals[2].passed, true);
  assert.equal(state.goals[2].evidence, 'read-listening');
  assert.equal(proof.packProof(state).goals[2].evidence, 'read-listening', 'the flag survives packing');
  // The reducer: neither heard nor read is not an answer; read passes a spelling goal too, marked as read.
  const before = { goals: [], phase: 'ask' };
  const l1 = c.lektionen[0], t1 = proof.proofTasks(l1);
  const upTo2 = { goals: [{ tries: 1, passed: true }, { tries: 1, passed: true }], phase: 'ask' };
  assert.deepEqual(proof.answerProof(t1, upTo2, { kind: 'typed', value: 'Chakiri' }), proof.packProof(upTo2));
  const read = proof.answerProof(t1, upTo2, { kind: 'typed', value: 'Chakiri', readInstead: true });
  assert.equal(read.goals[2].passed, true);
  assert.equal(read.goals[2].evidence, 'read-spelling');
  assert.equal(proof.proofPosition(t1, read), 3, 'the path moves on to the next goal');
  assert.ok(before);
});
