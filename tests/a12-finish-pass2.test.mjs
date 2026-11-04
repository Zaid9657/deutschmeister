import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A12 as curriculum } from '../src/data/curricula/a12.js';
import { ASSESSMENT_A12 } from '../src/data/lessonPools/a12.assessment.js';
import { abschlusstestA12 as finalTest } from '../src/data/courseTests/abschlusstestA12.js';
import { buildLesson, planPractice } from '../src/lib/lesson/buildLesson.js';
import { requeueFor, unservableIds } from '../src/lib/lesson/requeue.js';
import * as checkpoint from '../src/lib/checkpoint/buildCheckpoint.js';
import * as feedback from '../src/lib/checkpoint/feedback.js';
import { checkAnswer, checkOptionsFor, numberWordsToDigits, RESULT } from '../src/lib/lesson/check.js';
import { cueAnswerMismatch } from '../src/data/lessonPools/quality.js';
import { a12ReadingFindings, a12FinalTestFindings, levelSpec, taughtUpTo, untaughtTokens } from '../scripts/validate-curriculum.mjs';
import { reservedAssessmentFindings } from '../scripts/lib/assessment-content.mjs';
import { scoreObjectiveSections, scoreListeningAnswers, mergeListeningResult } from '../src/services/examScoring.js';
import { loadJsxModule } from './helpers/renderJsx.mjs';
import { t } from '../src/lib/lesson/strings.js';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a12.json'));
const papers = curriculum.checkpoints.flatMap((cp) => Array.from({ length: 4 }, (_, round) => ({ cp, round,
  items: checkpoint.buildCheckpoint({ curriculum, checkpoint: cp, pool, seed: checkpoint.paperSeed(cp, round) }),
})));

test('reading tasks have independent short answers; old option/pair cues and invalid evidence fail the rule', () => {
  assert.deepEqual(a12ReadingFindings(curriculum), []);
  for (const mutate of [
    (u) => { u.options = ['Ana', 'Tim']; },
    (u) => { u.pair = 1; },
    (u) => { u.evidence = 'This does not occur in the text.'; },
    (u) => { u.question += ` ${u.answer}`; },
    (u) => { u.answer = 'Unbekannt'; },
    (u) => { u.rejected = [u.answer]; },
    (u) => { u.text += ' Der Kühlschrank ist leer.'; },
    (u) => { u.question = u.question.replace('___', ''); },
  ]) {
    const broken = structuredClone(curriculum);
    mutate(broken.checkpoints[0].lesen.papers[0][0]);
    assert.ok(a12ReadingFindings(broken).length, String(mutate));
  }
  const duplicate = structuredClone(curriculum);
  duplicate.checkpoints[0].lesen.papers[1][0] = duplicate.checkpoints[0].lesen.papers[0][0];
  assert.ok(a12ReadingFindings(duplicate).some((f) => /repeat|duplicate/.test(f)));
});

test('all 64 delivered reading gaps accept their fact, reject competing details, and expose zero A/B choices', () => {
  let count = 0;
  for (const { cp, round, items } of papers) {
    const reading = items.filter((i) => i.section === 'lesen');
    assert.equal(reading.length, 4);
    const source = cp.lesen.papers[round];
    for (const [index, item] of reading.entries()) {
      count++;
      assert.equal(item.mode, 'typed'); assert.equal(item.options, null);
      assert.equal(item.readingAnswer, true);
      assert.equal(item.promptDe, source[index].question);
      assert.equal(checkpoint.isItemCorrect(item, item.answer), true);
      assert.equal(checkpoint.isItemCorrect(item, `${item.answer.toLowerCase()}.`), true);
      assert.equal(checkpoint.isItemCorrect(item, numberWordsToDigits(item.answer)), true);
      for (const wrong of [...source[index].rejected, 'A', 'B', '', 'Richtig', 'Falsch']) assert.equal(checkpoint.isItemCorrect(item, wrong), false, `${item.unitId}: ${wrong}`);
      assert.deepEqual(feedback.checkpointFeedback(item, item.answer, { graded: true }), { answer: item.answer });
      assert.equal(feedback.checkpointFeedback(item, item.answer, { graded: true, complete: true }).correct, true);
    }
    // An old fixed-letter, type-rank, alphabet or length rule has no answer buttons to choose.
    const blind = Object.fromEntries(reading.map((i) => [i.id, i.options?.[0] || 'A']));
    assert.equal(checkpoint.scoreCheckpoint(items, blind).sections.lesen.correct, 0);
  }
  assert.equal(count, 64);
  const item = { readingAnswer: true, answer: 'zehn', accepted: ['zehn'] };
  assert.equal(checkAnswer('10', item.accepted, checkOptionsFor(item)).result, RESULT.CORRECT);
  assert.equal(checkAnswer('11', item.accepted, checkOptionsFor(item)).result, RESULT.WRONG);
  assert.equal(checkAnswer('4 50', ['450'], { readingAnswer: true }).result, RESULT.WRONG);
  assert.equal(checkAnswer('10', ['zehn']).result, RESULT.WRONG, 'ordinary spelling tasks still test spelling');
});

test('reserved assessment is complete, taught, and absent from every practice and remediation draw', () => {
  assert.equal(ASSESSMENT_A12.length, 128);
  assert.deepEqual(reservedAssessmentFindings(curriculum, pool.items), []);
  const reserved = new Set(pool.items.filter((i) => i.assessment).map((i) => i.id));
  assert.equal(reserved.size, 128);
  for (let attempt = 1; attempt <= 12; attempt++) {
    for (const [nr, items] of planPractice(curriculum, pool, attempt)) {
      for (const i of items) assert.equal(reserved.has(i.id), false, i.id);
      for (const i of requeueFor(items, pool, [...items.map((it) => it.id), ...unservableIds(pool, nr)], { level: 'a1.2' })) assert.equal(reserved.has(i.id), false, `retry: ${i.id}`);
    }
    for (const lesson of curriculum.lektionen) {
      for (const stage of buildLesson({ curriculum, lektion: lesson, pool, attempt }).stages) {
        for (const i of stage.items || []) assert.equal(reserved.has(i.id), false, `${stage.kind}: ${i.id}`);
      }
    }
  }
  const used = new Set();
  const known = taughtUpTo(curriculum, levelSpec('a1.2'));
  for (const { cp, items } of papers) {
    const rows = items.filter((i) => i.poolItemId);
    assert.equal(rows.length, 8);
    assert.equal(rows.filter((i) => i.source === 'earlier').length, cp.nr === 1 ? 0 : 2);
    for (const i of rows) {
      assert.ok(reserved.has(i.poolItemId)); assert.equal(used.has(i.poolItemId), false, i.poolItemId); used.add(i.poolItemId);
      assert.equal(feedback.checkpointFeedback(i, i.answer).explanationEn, pool.items.find((row) => row.id === i.poolItemId).explanationEn, 'pool English feedback must survive the checkpoint adapter');
      assert.deepEqual(untaughtTokens({ questionDe: i.promptDe, answer: i.answer, accepted: i.accepted }, known.get(cp.afterLektion), levelSpec('a1.2')), [], i.poolItemId);
    }
    for (const i of checkpoint.remediationSet(items, {}, pool, { afterLektion: cp.afterLektion })) assert.equal(reserved.has(i.poolItemId), false);
  }
  assert.equal(used.size, 128, 'all four retakes of all four checkpoints are disjoint');
  const missed = { id: 'practice', topic: ASSESSMENT_A12[0].topic, answer: 'hier', type: 'fill_blank', questionDe: 'Ich bin ___.', minLektion: 1 };
  const isolated = [missed, { ...pool.items.find((i) => i.assessment), topic: missed.topic }];
  assert.deepEqual(requeueFor([missed], isolated, [missed.id], { level: 'a1.2' }), [missed], 'a reserved row cannot escape through an unbounded retry');
  for (const mutate of [
    (p) => p.splice(p.findIndex((i) => i.assessment), 1),
    (p) => { p.find((i) => i.assessment).minLektion = null; },
    (p) => { p.find((i) => i.assessment).assessment.source = 'earlier'; },
    (p) => { p.find((i) => i.assessment).questionDe = p.find((i) => !i.assessment).questionDe; },
    (p) => { const i = p.find((i) => i.assessment && i.questionDe.includes('Schreiben Sie die Zahl in Worten')); i.questionDe = i.questionDe.replace('; Schreiben Sie die Zahl in Worten', ''); },
    (p) => { const i = p.find((i) => i.assessment && i.questionDe.includes('Ergänzen Sie mit einem Wort')); i.questionDe = i.questionDe.replace(' (Ergänzen Sie mit einem Wort)', ''); },
  ]) {
    const broken = structuredClone(pool.items); mutate(broken);
    assert.ok(reservedAssessmentFindings(curriculum, broken).length);
  }
  const missing = { ...pool, items: pool.items.filter((i) => !i.assessment) };
  assert.throws(() => checkpoint.buildCheckpoint({ curriculum, checkpoint: curriculum.checkpoints[0], pool: missing }), /reserved/);
});

test('every checkpoint remains 20 items, leak-free, passable, and honours real writing and speaking evidence', () => {
  for (const { cp, round, items } of papers) {
    assert.equal(items.length, 20);
    assert.deepEqual(checkpoint.SECTION_ORDER.map((s) => items.filter((i) => i.section === s).length), [5, 4, 6, 3, 2]);
    assert.deepEqual(checkpoint.checkpointLeaks(items), [], `${cp.id}/${round}`);
    assert.deepEqual(checkpoint.checkpointReport(items).leakFallbacks, [], `${cp.id}/${round}`);
    const allRight = Object.fromEntries(items.map((i) => [i.id, i.kind === 'gradedWriting' ? { graded: true, pct: 1 }
      : i.kind === 'readAloud' ? { usedMic: true, pct: 1 } : i.answer]));
    assert.equal(checkpoint.scoreCheckpoint(items, allRight).passed, true);
    const writing = items.find((i) => i.kind === 'gradedWriting');
    assert.equal(checkpoint.scoreCheckpoint(items, { ...allRight, [writing.id]: { graded: true, pct: 0 } }).passed, false);
    const empty = Object.fromEntries(items.map((i) => [i.id, '']));
    assert.equal(checkpoint.scoreCheckpoint(items, empty).passed, false);
  }
});

test('whole-sentence article gaps still enforce the article cue within the unchanged sentence frame', () => {
  const item = { type: 'fill_blank', questionDe: 'Schreiben Sie den ganzen Satz: Ich brauche ___ Tisch. (bestimmter Artikel)', answer: 'Ich brauche den Tisch.' };
  assert.equal(cueAnswerMismatch(item), false);
  for (const answer of ['Ich brauche einen Tisch.', 'Ich brauche Tisch.', 'Der Tisch ist schön.', 'den', 'Ich kaufe den Tisch.']) assert.equal(cueAnswerMismatch({ ...item, answer }), true, answer);
  assert.equal(cueAnswerMismatch({ ...item, questionDe: 'Ich brauche ___ Tisch. (bestimmter Artikel)' }), true, 'without the whole-sentence instruction the key must be the article');
  const indefinite = { ...item, questionDe: item.questionDe.replace('bestimmter Artikel', 'ein, eine oder einen?'), answer: 'Ich brauche einen Tisch.' };
  assert.equal(cueAnswerMismatch(indefinite), false);
  assert.equal(cueAnswerMismatch({ ...indefinite, answer: 'Ich brauche den Tisch.' }), true);
  for (const i of pool.items.filter((i) => i.assessment && i.type === 'fill_blank')) {
    assert.match(i.questionDe, /^Schreiben Sie den ganzen Satz:/);
    assert.match(i.questionEn, /complete sentence/);
    assert.equal(cueAnswerMismatch(i), false, i.id);
  }
});

test('final test stays in taught language and formal address; missing evidence and old promises are rejected', () => {
  assert.deepEqual(a12FinalTestFindings(), []);
  for (const mutate of [
    (m) => { m.intro += ' Du bist fertig.'; },
    (m) => { m.intro += ' Danach kommt die vollständige Übungsprüfung.'; },
    (m) => { m.sections[1].parts[0].text += ' Die Heizung ist defekt.'; },
    (m) => { m.sections[1].parts[0].items[0].evidence = 'absent'; },
    (m) => { delete m.verdictCopyDe; },
    (m) => { m.sections[2].instructions = 'Schreiben Sie hier.'; },
  ]) {
    const broken = structuredClone(finalTest); mutate(broken);
    assert.ok(a12FinalTestFindings(broken).length, String(mutate));
  }
});

test('final reading has eight independently solved keys; constant choices fail and writing stays outside the score', () => {
  // Semantic review of the displayed statements: paid already; balcony wanted; broken lamp;
  // Saturday pickup; size 40; platform 6; 13:00 is after closing; wait indoors in the rain.
  const solved = { 'l1-1': 'f', 'l1-2': 'r', 'l1-3': 'r', 'l2a-1': 'b', 'l2b-1': 'a', 'l3-1': 'r', 'l3-2': 'f', 'l3-3': 'f' };
  const items = finalTest.sections.find((s) => s.key === 'lesen').parts.flatMap((p) => p.items);
  assert.deepEqual(Object.fromEntries(items.map((i) => [i.id, i.answer])), solved);
  const score = scoreObjectiveSections(finalTest, solved);
  assert.deepEqual(score, { score: 8, maxScore: 8, sectionScores: { lesen: { score: 8, max: 8 } } });
  for (const position of [0, 1]) assert.equal(scoreObjectiveSections(finalTest, Object.fromEntries(items.map((i) => [i.id, i.options[position].key]))).score, 4);
  const part = finalTest.sections[0].parts[0];
  assert.deepEqual([part.level, part.exerciseNumber, part.questionMax], ['A1.2', 4, 10]);
  assert.equal(scoreListeningAnswers(finalTest).complete, false, 'missing live keys must not become a reading-only pass');
  assert.equal(mergeListeningResult(score, { score: 10, max: 10 }).maxScore, 18, 'simulated audio keys only; not live audio verification');
  assert.deepEqual(scoreObjectiveSections(finalTest, { ...solved, 'schreiben-1': 'Ein Text.' }), score);
  assert.equal(finalTest.passPercent, 60);
  assert.match(finalTest.intro, /A2\.1/);
});

const elements = (tree, predicate) => Array.isArray(tree) ? tree.flatMap((x) => elements(x, predicate))
  : tree && typeof tree === 'object' ? [...(predicate(tree) ? [tree] : []), ...elements(tree.props?.children, predicate)] : [];
const content = (tree) => Array.isArray(tree) ? tree.map(content).join(' ') : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : content(tree?.props?.children || []);
function hooks() {
  const slots = []; let cursor = 0;
  return { react: { useState: (initial) => { const n = cursor++; if (!(n in slots)) slots[n] = typeof initial === 'function' ? initial() : initial; return [slots[n], (v) => { slots[n] = typeof v === 'function' ? v(slots[n]) : v; }]; }, useRef: (current) => ({ current }), useEffect: () => {}, useMemo: (fn) => fn() },
    render: (Component, props) => { cursor = 0; return Component(props); } };
}

test('real checkpoint JSX renders a text field and records a reading answer without revealing its key', async () => {
  const path = 'src/pages/lesson/CheckpointPage.jsx';
  for (const lang of ['de', 'en']) {
    const state = hooks(), stubs = {};
    for (const m of read(path).matchAll(/import\s+([\s\S]*?)\s+from\s+'([^']+)'/g)) {
      const values = {}, named = m[1].match(/\{([^}]+)\}/)?.[1];
      if (named) for (const name of named.split(',').map((s) => s.trim()).filter(Boolean)) values[name] = name;
      else values.default = m[1].trim();
      stubs[m[2]] = values;
    }
    stubs.react = state.react;
    stubs['../../lib/lesson/strings.js'] = { useLessonLang: () => [lang], t };
    stubs['../../lib/checkpoint/feedback.js'] = feedback;
    stubs['../../lib/checkpoint/buildCheckpoint.js'] = checkpoint;
    const { PracticeItem } = await loadJsxModule(path, stubs);
    const item = papers[0].items.find((i) => i.section === 'lesen');
    const submitted = [], props = { item, graded: true, onAnswer: (i, answer) => submitted.push([i.id, answer]) };
    let tree = state.render(PracticeItem, props);
    assert.ok(content(tree).includes(item.text));
    assert.equal(content(tree).includes(item.promptEn), lang === 'en');
    assert.equal(elements(tree, (el) => el.type === 'input').length, 1);
    assert.equal(elements(tree, (el) => el.props?.onClick && el.type === 'Chip').length, 0);
    elements(tree, (el) => el.type === 'input')[0].props.onChange({ target: { value: item.answer } });
    tree = state.render(PracticeItem, props);
    elements(tree, (el) => el.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    tree = state.render(PracticeItem, props);
    assert.ok(content(tree).includes(t('checkpoint.answerRecorded', lang)));
    assert.equal(content(tree).includes(item.explanationDe), false);
    const next = elements(tree, (el) => el.type === 'Button' && el.props?.onClick).at(-1);
    next.props.onClick();
    assert.deepEqual(submitted, [[item.id, item.answer]]);
  }
});
