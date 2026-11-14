import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { ALPHABET, DIGITS, PRICES, FULL_HOUR, PRICE_FOUNDATIONS, PRICE_COMPOUNDS } from '../src/data/curricula/a11.sets.js';
import { buildSetStage, setStageEstimate, spellingMembers, referenceKinds, spellWithSet } from '../src/lib/lesson/taughtSet.js';
import { validateCurriculum } from '../scripts/validate-curriculum.mjs';
import { guidedDraftFindings } from '../scripts/check-guided-draft.mjs';
import { setTimeFindings, taughtOrderFindings, prerequisiteForms } from '../scripts/lib/taught-order.mjs';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { packRun, unpackRun, resumeStageIndex, resumeItemIndex } from '../src/lib/lesson/runState.js';
import { stageSteps } from '../src/lib/lesson/stageReach.js';
import { stageLastItem } from '../src/lib/lesson/buildGuided.js';
import { prevStageIndex } from '../src/lib/lesson/requeue.js';
import { proofTasks, packProof } from '../src/lib/lesson/proof.js';
import { loadJsxModule } from './helpers/renderJsx.mjs';
import * as checker from '../src/lib/lesson/check.js';
import { STRINGS } from '../src/lib/lesson/strings.js';
const pool = JSON.parse(readFileSync('src/data/lessonPools/a11.json'));
const build = (lesson, attempt = 1) => buildLesson({ curriculum: c, lektion: lesson, pool, attempt });
const nodes = (n) => Array.isArray(n) ? n.flatMap(nodes) : !n || typeof n !== 'object' ? [] : [n, ...nodes(n.props?.children)];
const elements = (n, type) => nodes(n).filter((n) => n.type === type);
const strings = { useLessonLang: () => ['en'], t: (k) => k };
function hooks() {
  let values = [], cursor = 0;
  return { react: { useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (v) => { values[i] = v; }]; } }, render(Screen, props) { cursor = 0; return Screen(props); }, clear() { values = []; } };
}

test('one board renders every member with canonical readable names and individually playable voice aids', async () => {
  const { default: Board } = await loadJsxModule('src/components/lesson/SetBoard.jsx', { './PlayButton.jsx': { default: 'PlayButton' } });
  const members = ALPHABET.members.slice(0, 5);
  const tree = Board({ members, lektionId: c.lektionen[0].id, boardKey: 'group1' });
  assert.equal(elements(tree, 'li').length, members.length);
  const plays = elements(tree, 'PlayButton');
  assert.deepEqual(plays.map((p) => p.props.text), members.map((m) => m.audio));
  assert.deepEqual(plays.map((p) => p.props.label), members.map((m) => `${m.written} · ${m.said}`));
  assert.ok(plays.every((p) => p.props.compact));
});

test('one group utterance unlocks its checks; own-name card derives all mappings and saves no name', async () => {
  const h = hooks();
  const { default: Screen } = await loadJsxModule('src/components/lesson/TaughtSetStage.jsx', {
    react: h.react, './SetBoard.jsx': { default: 'SetBoard' }, './StageShell.jsx': { default: 'StageShell' },
    '../ui/Button.jsx': { default: 'Button' }, './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
    '../../lib/lesson/taughtSet.js': await import('../src/lib/lesson/taughtSet.js'), '../../lib/lesson/check.js': checker, '../../lib/lesson/strings.js': strings,
  });
  const stage = buildSetStage(ALPHABET), names = { full: 'Sam Weiß' }, results = {};
  const props = { stage, itemIndex: 0, names, onNamesChange(n) { props.names = n; }, onSayResult(i, r) { results[i] = r; }, onItemChange(i) { props.itemIndex = i; h.clear(); } };
  const render = () => h.render(Screen, props);
  assert.equal(elements(render(), 'SetBoard')[0].props.members.length, 5);
  assert.equal(elements(render(), 'ReadAloudLine').length, 0);
  elements(render(), 'PlayButton')[0].props.onPlayed();
  assert.equal(elements(render(), 'ReadAloudLine').length, 1);
  assert.equal(elements(render(), 'ReadAloudLine')[0].props.hideModel, true, 'voice aids never become displayed letter names');
  assert.equal(elements(render(), 'ReadAloudLine')[0].props.text, stage.steps[0].members.map((m) => m.audio).join('. '));
  elements(render(), 'ReadAloudLine')[0].props.onResult({ usedMic: false, selfConfirmed: true });
  assert.equal(elements(render(), 'StageShell')[0].props.primaryDisabled, false);
  elements(render(), 'StageShell')[0].props.onPrimary();
  assert.equal(stage.steps[props.itemIndex].kind, 'check');
  props.itemIndex = stage.steps.findIndex((s) => s.kind === 'own-name'); h.clear();
  assert.equal(elements(render(), 'input')[0].props.value, 'Weiß');
  const board = elements(render(), 'SetBoard')[0];
  assert.deepEqual(board.props.members.map((m) => m.said), ['We', 'E', 'I', 'Eszett']);
  assert.equal(elements(render(), 'PlayButton')[0].props.text, spellWithSet('Weiß', ALPHABET));
  elements(render(), 'PlayButton')[0].props.onPlayed();
  elements(render(), 'ReadAloudLine')[0].props.onResult({ usedMic: true, pct: 1, transcript: 'private' });
  assert.equal(props.names.surname, 'Weiß');
  const saved = packRun({ stageKey: stage.key, taughtSetReadAloud: { alphabet: results }, names: props.names });
  assert.doesNotMatch(JSON.stringify(saved), /Weiß|private|surname|transcript|names/);
  elements(render(), 'input')[0].props.onChange({ target: { value: 'Noor' } });
  assert.equal(elements(render(), 'StageShell')[0].props.primaryDisabled, true);
  assert.ok(spellingMembers('Noor', ALPHABET).every((m) => m.supported));
});

test('RULE 37 counts real screens, catches added members and summed pre-scene teaching at all draws', () => {
  assert.deepEqual(setTimeFindings(c, pool), []);
  for (const lesson of c.lektionen) for (const stage of build(lesson).stages.filter((s) => s.kind === 'taught-set')) {
    const e = setStageEstimate(stage);
    assert.ok(e.hi <= 360);
    assert.equal(e.boards, stage.steps.filter((s) => s.kind === 'board').length);
    assert.equal(e.checks, stage.steps.filter((s) => s.kind === 'check').length);
  }
  const added = structuredClone(c);
  added.lektionen[0].guided.sets[0].members.push({ written: 'É', said: 'E', audio: 'Eh' });
  const findings = setTimeFindings(added, pool);
  assert.ok(validateCurriculum(added, undefined, pool.items || pool).some((f) => f.startsWith('RULE 37: L1:')));
  const draft = JSON.parse(readFileSync('docs/course-factory/a11-guided/content/l01.json'));
  draft.guided.sets = added.lektionen[0].guided.sets;
  assert.ok(guidedDraftFindings(1, draft).some((f) => f.includes('set:alphabet upper estimate')));
  for (const attempt of [1, 2, 3]) assert.ok(findings.some((f) => f.includes(`draw ${attempt}: set:alphabet`)));
  const summed = structuredClone(c);
  summed.lektionen[1].guided.sets = Array.from({ length: 4 }, (_, i) => ({ ...DIGITS, id: i === 0 ? DIGITS.id : `digits-${i}` }));
  const errors = setTimeFindings(summed, pool);
  assert.ok(errors.some((f) => f.includes('sets before first scene')));
  assert.ok(!errors.some((f) => /set:digits/.test(f)), 'each individual stage still fits');
});

test('L1 splits after greeting; all draws resume and navigate Back through the real boundaries with global funnel labels', () => {
  for (const attempt of [1, 2, 3]) {
    const { stages } = build(c.lektionen[0], attempt);
    assert.deepEqual(stages.slice(0, 4).map((s) => s.key), ['pretest', 'scene', 'set:alphabet', 'scene:2']);
    assert.equal(stages[1].chunks.length, 1); assert.equal(stages[3].chunks.length, 3);
    assert.equal(stages[1].chunks[0].say.ownName, 'full'); assert.equal(stages[3].chunks[0].say.ownName, 'surname');
    for (const index of [1, 2, 3]) {
      const itemIndex = stageLastItem(stages[index]);
      const run = unpackRun(packRun({ flow: 'guided', stageKey: stages[index].key, stageIndex: index, itemIndex, sceneReadAloud: { 0: { usedMic: true }, 1: { usedMic: true } } }));
      assert.equal(resumeStageIndex(stages, run), index); assert.equal(resumeItemIndex(stages, run), itemIndex);
      const back = prevStageIndex(stages, index, 0);
      assert.equal(back, index - 1);
      assert.equal(stageLastItem(stages[back]), back === 1 ? 2 : back === 2 ? stages[2].steps.length - 1 : 0);
    }
    const old = unpackRun(packRun({ flow: 'guided', stageKey: 'scene', itemIndex: 5, setBoardVersion: 1 }));
    assert.equal(resumeStageIndex(stages, old), 3); assert.equal(resumeItemIndex(stages, old), 2);
    assert.equal(resumeItemIndex(stages, { ...old, stageKey: 'set:alphabet', itemIndex: 30 }), 0);
    const steps = stageSteps(stages);
    assert.equal(new Set(steps).size, steps.length);
    assert.ok(steps.indexOf('scene:1:say') < steps.indexOf('set:alphabet'));
    assert.ok(steps.indexOf('set:alphabet') < steps.indexOf('scene:2:hear'));
  }
  assert.deepEqual(taughtOrderFindings(c, pool), []);
});

test('L4 preserves every old check and both contrast directions across two placements; no drawn non-set task needs compounds', () => {
  assert.deepEqual(buildSetStage(PRICE_FOUNDATIONS).steps.filter((s) => s.item).map((s) => s.item.answer).concat(buildSetStage(PRICE_COMPOUNDS).steps.filter((s) => s.item).map((s) => s.item.answer)), buildSetStage(PRICES).steps.filter((s) => s.item).map((s) => s.item.answer));
  for (const attempt of [1, 2, 3]) {
    const { stages } = build(c.lektionen[3], attempt);
    const foundation = stages.findIndex((s) => s.key === 'set:numbers-11-100'), compound = stages.findIndex((s) => s.key === 'set:numbers-21-99');
    assert.ok(foundation < stages.findIndex((s) => s.kind === 'scene'));
    assert.equal(stages[foundation].part, 1); assert.equal(stages[compound].part, 2);
    assert.equal(stages[compound + 1].kind, 'practice');
    for (const stage of stages.filter((s) => ['practice', 'derived', 'dictation'].includes(s.kind))) for (const item of stage.items || stage.lines || []) {
      assert.equal(prerequisiteForms([item.de, item.questionDe, item.promptDe, item.answer, item.audioText, ...(item.accepted || []), ...(item.options || [])].filter(Boolean).join(' ')).has('number:compounds'), false);
    }
  }
});

test('readable letter names agree with both notice languages while speech uses the separate aids', () => {
  for (const lang of ['De', 'En']) for (const written of ['J', 'V', 'W', 'Y', 'Z', 'ß']) {
    const name = ALPHABET.members.find((m) => m.written === written).said;
    assert.ok(c.lektionen[0].notice[`body${lang}`].includes(name));
  }
  assert.equal(ALPHABET.members.find((m) => m.written === 'W').said, 'We');
  assert.equal(ALPHABET.members.find((m) => m.written === 'W').audio, 'Weh');
  const wCheck = buildSetStage(ALPHABET).steps.find((s) => s.item?.answer === 'W').item;
  assert.equal(wCheck.audioDisplayText, 'We'); assert.equal(wCheck.audioText, 'Weh');
  assert.doesNotMatch(c.lektionen[0].notice.bodyDe + c.lektionen[0].notice.bodyEn, /Weh/);
  for (const key of ['set.ownName', 'set.nameLetters', 'set.reference']) for (const lang of ['de', 'en']) assert.equal(typeof STRINGS[lang][key], 'string');
});

test('task reference derives spelling/numbers from the task, renders playable boards and stays absent during proof retrieval', async () => {
  const sets = [ALPHABET, DIGITS, PRICES, FULL_HOUR];
  for (const item of [{ ownName: 'surname' }, { questionDe: 'Buchstabieren Sie Ihren Namen.' }, { de: 'A-N-A.' }]) assert.ok(referenceKinds(item, sets).includes('letters'));
  for (const item of [{ de: 'Das kostet fünfzehn Euro.' }, { answer: '34' }, { de: 'vierunddreißig' }, { promptDe: 'Nennen Sie die Telefonnummer.' }]) assert.ok(referenceKinds(item, sets).includes('numbers'));
  assert.deepEqual(referenceKinds({ de: 'Guten Tag.' }, sets), []);
  const { default: Reference } = await loadJsxModule('src/components/lesson/SetReference.jsx', {
    '../../data/curricula/a11.sets.js': await import('../src/data/curricula/a11.sets.js'), '../../lib/lesson/taughtSet.js': await import('../src/lib/lesson/taughtSet.js'),
    '../../lib/lesson/strings.js': strings, './SetBoard.jsx': { default: 'SetBoard' },
  });
  const ref = Reference({ item: { de: 'fünfzehn Euro' }, lektionId: c.lektionen[3].id });
  assert.equal(ref.type, 'details'); assert.equal(elements(ref, 'summary').length, 1);
  assert.equal(elements(ref, 'SetBoard').length, 3);
  assert.equal(Reference({ item: { de: 'fünfzehn Euro' }, lektionId: 'a1.2-l01' }), null);
  const h = hooks();
  const { default: Proof } = await loadJsxModule('src/components/lesson/ProofStage.jsx', {
    react: h.react, './SetReference.jsx': { default: 'SetReference' }, '../../contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '../../lib/course/canDo.js': { canDoLines: (l) => l.canDo }, '../../lib/lesson/proof.js': await import('../src/lib/lesson/proof.js'), '../../lib/lesson/strings.js': strings,
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' }, './LangToggle.jsx': { default: 'LangToggle' }, './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
  });
  const task = proofTasks(c.lektionen[0]).find((t) => t.listenSpelling), stage = { tasks: [task] };
  const props = { stage, lesson: c.lektionen[0], state: packProof(), names: {} };
  assert.equal(elements(h.render(Proof, props), 'SetReference').length, 0);
  assert.equal(elements(h.render(Proof, { ...props, state: { ...props.state, phase: 'hint' } }), 'SetReference').length, 0);
  assert.equal(elements(h.render(Proof, { ...props, state: { ...props.state, phase: 'reteach' } }), 'SetReference').length, 1);
  assert.match(readFileSync('src/pages/lesson/LessonPlayerPage.jsx', 'utf8'), /if \(referenceItem\) body = <><SetReference item=\{referenceItem\}/);
  for (const filename of ['SceneStage', 'PracticeItem', 'DictationItem', 'FluencyStage']) assert.match(readFileSync(`src/components/lesson/${filename}.jsx`, 'utf8'), /<SetReference item=/);
});
