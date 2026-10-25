import test from 'node:test';
import assert from 'node:assert/strict';
import { examFormat, lessonWritingFormat, writingSequenceErrors } from '../src/data/curricula/examFormats.js';
import { examUnitErrors, examUnitsErrors, examSurfaceErrors, buildExamBank, speakingFormatErrors } from '../src/lib/lesson/exam.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { buildLesson, derivedItems, derivedWordOrderMaxTokens } from '../src/lib/lesson/buildLesson.js';
import { buildCheckpoint, isItemCorrect, paperSeed, PASS_OVERALL_PCT, PASS_SECTION_PCT } from '../src/lib/checkpoint/buildCheckpoint.js';
import { checkpointFeedback, sectionComplete, sectionFeedbackReady } from '../src/lib/checkpoint/feedback.js';
import { practiceScore } from '../src/lib/lesson/mastery.js';
import { requeueFor } from '../src/lib/lesson/requeue.js';
import { listeningSummary } from '../src/lib/lesson/skillStatus.js';
import { validateCurriculum, validateExamSurfaces, examTeileBacked } from '../scripts/validate-curriculum.mjs';
import { a2EngineCourse, unitFor } from './fixtures/a2-engine-course.mjs';
import { alternatives, a2ClauseOrders, choiceDeterminacyErrors, servedItems, rejectedAlternatives } from '../scripts/a12-determinacy.mjs';

test('exam contracts preserve A1 alternation and add declared A2 SMS/email with full type coverage', () => {
  assert.deepEqual(examFormat('goethe_a1').writing.map((w) => [w.kind, w.range]), [['formular', [5, 40]], ['mitteilung', [25, 45]]]);
  assert.equal(examFormat('goethe_a1').teile.length, 11);
  for (let nr = 1; nr <= 12; nr += 1) assert.equal(lessonWritingFormat('goethe_a1', { nr }).kind, nr % 2 ? 'formular' : 'mitteilung');
  const a2 = examFormat('goethe_a2');
  assert.ok(a2.teile.includes('Hören Teil 4'));
  assert.ok(a2.teile.includes('Lesen Teil 4'));
  assert.deepEqual(a2.writing.map((w) => [w.kind, w.textsorte, w.range]), [['mitteilung', 'sms', [20, 30]], ['mitteilung', 'email', [30, 40]]]);
  const c = a2EngineCourse();
  c.lektionen[2].schreiben.textsorte = 'email'; // consecutive email is valid
  assert.deepEqual(writingSequenceErrors(c), []);
  c.lektionen[0].schreiben.textsorte = 'email';
  assert.match(writingSequenceErrors(c).join(' '), /sms is never rehearsed/);
  c.lektionen[0].schreiben.textsorte = 'formular';
  assert.match(writingSequenceErrors(c).join(' '), /must be one of/);
  assert.equal(PASS_OVERALL_PCT, 60); assert.equal(PASS_SECTION_PCT, 40);
});

for (const kind of ['mc3', 'match']) test(`${kind}: one scored choice, no typo/dictation folding, lesson and checkpoint agree`, () => {
  const unit = unitFor(kind === 'mc3' ? 'Hören Teil 1' : 'Lesen Teil 4');
  const item = { ...unit, accepted: [unit.answer], stage: 'listening', mode: 'options' };
  assert.deepEqual(examUnitErrors(unit, { examKey: 'goethe_a2', section: kind === 'mc3' ? 'hoeren' : 'lesen' }), []);
  assert.equal(checkOptionsFor(item).choice, true);
  assert.equal(checkOptionsFor(item).dictation, false);
  for (const option of item.options) {
    assert.equal(checkAnswer(option, item.accepted, checkOptionsFor(item)).result, option === item.answer ? RESULT.CORRECT : RESULT.WRONG);
    assert.equal(isItemCorrect(item, option), option === item.answer);
  }
  assert.equal(checkAnswer(item.answer + 'x', item.accepted, checkOptionsFor(item)).result, RESULT.WRONG);
  assert.deepEqual(practiceScore([{ itemId: item.id, stage: 'exam', correct: true }, { itemId: 'read', stage: 'exam', correct: true, listened: false }]), { correct: 1, total: 1, accuracy: 1 });
  assert.deepEqual(requeueFor([{ ...item, type: kind }], [])[0], { ...item, type: kind, id: `${item.id}~retry` });
  assert.deepEqual(listeningSummary([{ stage: 'exam', section: 'hoeren', listened: false }]), { state: 'partly-read', heard: 0, read: 1 });
});

test('synthetic A2 course: validator accepts engine surfaces, builders serve every Teil by round', () => {
  const c = a2EngineCourse();
  assert.deepEqual(validateExamSurfaces(c), []);
  assert.deepEqual(examSurfaceErrors(c), []);
  for (const l of c.lektionen) {
    const stages = buildLesson({ curriculum: c, lektion: l, pool: [] }).stages;
    assert.deepEqual(stages.filter((s) => s.kind === 'exam').map((s) => s.items.length), [3, 3]);
    l.examTeile = [l.lesen.teil, l.hoeren.teil, l.sprechen.open.teil];
  }
  assert.deepEqual(examTeileBacked(c), []);
  for (const cp of c.checkpoints) for (const section of ['lesen', 'hoeren']) {
    const options = { curriculum: c, checkpoint: cp, section };
    const first = buildExamBank(cp[section], { ...options, round: 0 });
    const second = buildExamBank(cp[section], { ...options, round: 1 });
    assert.equal(first.length, section === 'lesen' ? 4 : 5);
    assert.notDeepEqual(first, second);
    assert.deepEqual(first, buildExamBank(cp[section], { ...options, round: 2 }));
    const full = buildCheckpoint({ curriculum: c, checkpoint: cp, pool: [], seed: paperSeed(cp, 0) });
    assert.deepEqual(full.filter((i) => i.section === section), first);
  }
});

test('malformed A2 banks and lesson surfaces fail closed in validator and builders', () => {
  const mutations = [
    (c) => { delete c.checkpoints[0].lesen; },
    (c) => { c.checkpoints[0].lesen.papers[0].pop(); },
    (c) => { c.checkpoints[0].lesen.papers[1][0].options.pop(); },
    (c) => { c.checkpoints[0].lesen.papers[0][0].answer = 'not an option'; },
    (c) => { c.checkpoints[0].lesen.papers[0][0].teil = 'Lesen Teil 4'; },
    (c) => { delete c.checkpoints[0].hoeren.papers[0][0].audioText; },
    (c) => { c.checkpoints[0].hoeren.papers[0][0].text = 'transcript leaked'; },
  ];
  for (const mutate of mutations) {
    const c = a2EngineCourse(); mutate(c);
    assert.ok(examSurfaceErrors(c).length);
    assert.ok(validateCurriculum(c, [], []).length);
    assert.throws(() => buildCheckpoint({ curriculum: c, checkpoint: c.checkpoints[0], pool: [] }), /authored exam/);
  }
  for (const section of ['lesen', 'hoeren']) {
    const c = a2EngineCourse(); c.lektionen[0][section].units[0].answer = 'invalid';
    assert.ok(examSurfaceErrors(c).length);
    assert.ok(validateCurriculum(c, [], []).length);
    assert.throws(() => buildLesson({ curriculum: c, lektion: c.lektionen[0], pool: [] }), /answer must/);
    assert.ok(examTeileBacked({ ...c, lektionen: [{ ...c.lektionen[0], examTeile: [c.lektionen[0][section].teil] }] }).length);
  }
});

test('A2 picture MC, assignment groups and speaking materials have enforced shapes', () => {
  const picture = unitFor('Hören Teil 3');
  assert.deepEqual(examUnitErrors(picture, { examKey: 'goethe_a2', section: 'hoeren' }), []);
  picture.pictures[0].alt = '';
  assert.match(examUnitErrors(picture, { examKey: 'goethe_a2', section: 'hoeren' }).join(' '), /pictures/);
  const units = a2EngineCourse().lektionen[0].lesen.units;
  delete units[0].groupId;
  assert.match(examUnitsErrors(units, { examKey: 'goethe_a2', section: 'lesen' }).join(' '), /groupId/);
  const course = a2EngineCourse();
  for (const l of course.lektionen) {
    const open = l.sprechen.open;
    assert.deepEqual(speakingFormatErrors(open, 'goethe_a2'), []);
    delete open.cards; delete open.prompts; delete open.calendar;
    assert.ok(speakingFormatErrors(open, 'goethe_a2').length);
    assert.ok(examSurfaceErrors(course).length);
    assert.ok(validateCurriculum(course, [], []).length);
    assert.throws(() => buildLesson({ curriculum: course, lektion: l, pool: [] }), /Sprechen:/);
  }
});

test('new Lesen and all Hören items defer all answer evidence until completion', () => {
  for (const [kind, section] of [['mc3', 'lesen'], ['match', 'lesen'], ['match', 'hoeren'], ['mc3', 'hoeren']]) {
    const item = { id: kind, kind, section, groupId: 'shared', answer: 'A', accepted: ['A'], options: ['A', 'B', 'C'], explanationDe: 'secret' };
    assert.deepEqual(checkpointFeedback(item, 'B', { graded: true }), { answer: 'B' });
    assert.equal(sectionFeedbackReady([item], {}, section), false);
    assert.equal(sectionFeedbackReady([item], { [item.id]: 'B' }, section), true);
    const complete = sectionComplete([item], { [item.id]: 'B' }, section);
    assert.equal(checkpointFeedback(item, 'B', { graded: true, complete }).key, 'A');
    assert.equal(checkpointFeedback(item, 'B', { graded: false }).correct, false);
  }
  const independent = { id: 'single', section: 'hoeren' };
  assert.equal(sectionFeedbackReady([independent], { single: 'answer' }, 'hoeren'), true);
  assert.deepEqual(checkpointFeedback(independent, 'answer', { graded: true }), { answer: 'answer' });
});

test('derived word order allows eleven A2 tokens while A1 stays at eight', () => {
  const l = { id: 'a2.1-l06', dialog: { lines: [{ de: 'Ich komme heute leider nicht zu Ihnen, weil ich krank bin.' }] } };
  assert.equal(l.dialog.lines[0].de.split(/\s+/).length, 11);
  assert.equal(derivedWordOrderMaxTokens('a1.1'), 8);
  assert.equal(derivedWordOrderMaxTokens('a1.2'), 8);
  assert.equal(derivedWordOrderMaxTokens('a2.1'), 11);
  // The token ceiling survives, but the live tile rule rejects unsupported
  // grammar at every level; a long subordinate clause is not a licensed frame.
  assert.ok(l.dialog.lines[0].de.split(/\s+/).length <= derivedWordOrderMaxTokens('a2.1'));
  assert.ok(!(l.dialog.lines[0].de.split(/\s+/).length <= derivedWordOrderMaxTokens('a1.2')));
  assert.ok(!derivedItems(l).some((i) => i.type === 'word_order'));
  l.dialog.lines[0].de += ' heute';
  assert.ok(!(l.dialog.lines[0].de.split(/\s+/).length <= derivedWordOrderMaxTokens('a2.1')));
  assert.ok(!derivedItems(l).some((i) => i.type === 'word_order'));
  l.dialog.lines[0].de = 'Ich bin Studentin.';
  const tile = derivedItems(l).find((i) => i.type === 'word_order');
  assert.ok(tile);
  assert.ok(tile.accepted.includes('Studentin bin ich.'));
});

test('G7 probes mc3/match and A2 object and subordinate-clause alternatives', () => {
  const c = a2EngineCourse();
  const fixture = { curriculum: c, pool: [] };
  const items = servedItems('a2.1', undefined, fixture).items;
  assert.ok(items.some((i) => i.kind === 'mc3'));
  assert.ok(items.some((i) => i.kind === 'match'));
  assert.deepEqual(rejectedAlternatives('a2.1', undefined, fixture), []);
  const item = unitFor('Lesen Teil 1');
  item.options[0] = `${item.answer}.`;
  assert.ok(choiceDeterminacyErrors(item).length);
  assert.ok(examUnitErrors(item, { examKey: 'goethe_a2', section: 'lesen' }).length);
  const key = 'Ich bleibe zu Hause, weil ich krank bin.';
  assert.ok(a2ClauseOrders(key).includes('Weil ich krank bin, bleibe ich zu Hause.'));
  const order = { type: 'sentence_building', answer: key, questionDe: 'Bilden Sie einen Satz.' };
  assert.ok(alternatives(order, { wide: true, a2: true }).some((a) => a.text.startsWith('Weil')));
  order.questionDe += ' (Beginnen Sie mit „Ich“)';
  assert.ok(!alternatives(order, { wide: true, a2: true }).some((a) => a.text.startsWith('Weil')));
  assert.ok(alternatives({ type: 'sentence_building', answer: 'Ich gebe dem Mann das Buch.', questionDe: '(Beginnen Sie mit „Ich“)' }, { wide: true, a2: true }).some((a) => a.text === 'Ich gebe das Buch dem Mann.'));
  assert.equal(checkAnswer(key.replace(',', ''), key).result, RESULT.CORRECT);
});
