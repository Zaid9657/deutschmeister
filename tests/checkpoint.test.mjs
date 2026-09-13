// Guard suite for the checkpoint builder and the spaced-review ladder
// (docs/course-standard-2026-09-12.md §3; docs/course-factory/a11-rebuild/CONTRACT.md).
//
// What each pin defends:
//
//   1. THE SHAPE OF A CHECKPOINT — 20 items in exactly 5/4/6/3/2. The standard
//      mirrors the Goethe/telc section split; a checkpoint that quietly drifts
//      to "whatever the pool had" is no longer an exam rehearsal, which is the
//      only reason it exists.
//   2. DETERMINISM — the same seed must build the same test, in every runtime.
//      Without it "Nochmal" could hand a learner an easier paper, and no test
//      here could pin anything.
//   3. THE PASS RULE — 60 % overall AND no scored section below 40 %. Both
//      halves matter: a learner who aces Sprachbausteine and hears nothing has
//      not passed, and that is the whole point of the second clause.
//   3b. SPRECHEN IS SCORED BY THE RUN, NOT THE BUILD (plan P3). Every read-aloud
//      CAN be scored (score-readaloud aligns the transcript word by word), so
//      the section enters the overall and the 40 % rule — but only when every
//      item of it actually came back from a microphone. One self-confirm and the
//      whole section drops out again, because half a Sprechen score is not a
//      Sprechen score, and a number we cannot defend is worse than none.
//   3c. AUDIO ITEMS SAY WHERE THEIR SOUND COMES FROM. Hören and Sprechen items
//      carry lektionId + lineKey so playLine() can use the recording from the
//      audio manifest and fall back to the synthesiser only where there is
//      none. Without those fields every checkpoint is the robot voice forever.
//   4. THE 70/30 DRAW — once earlier chapters exist, the pool-drawn items must
//      interleave them. Spacing is the single strongest effect in the research
//      memo (g = 0.74); a chapter-only checkpoint throws it away.
//   4b. THE LESEN SECTION TESTS READING (DaF review #5). Two things are pinned:
//      the truth values are DRAWN, so the four checkpoints do not all answer
//      R–F–R–F (a learner who saw checkpoint 1 scored 4/4 in 2–4 blind), and a
//      "falsch" statement is the SAME text with one detail changed, not a line
//      quoted from another Lektion — string recognition was all the old
//      generator asked for.
//   4c. THE SCHREIBEN SECTION IS THE COURSE'S OWN WRITING (DaF review #5): the
//      chapter's real, AI-graded task plus two drills from DIFFERENT Lektionen,
//      and no invented `register` label on a sentence-building item.
//   5. REMEDIATION TARGETING — the set after a failure must be about the topics
//      that were actually missed, and must never repeat an item just seen.
//   6. THE LADDER — 1/4/7/14/60/180 with lapse → step 0. These are the numbers
//      the schedule is made of; ladder.js is the only place they are computed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildCheckpoint,
  scoreCheckpoint,
  remediationSet,
  isItemCorrect,
  SECTION_COUNTS,
  SECTION_ORDER,
  CHECKPOINT_ITEM_COUNT,
  POOL_ITEMS_TOTAL,
  POOL_ITEMS_EARLIER,
  isTyped,
  topicsOf,
  chapterLektionen,
  earlierLektionen,
  itemIsScored,
  isMicResult,
  isWritingResult,
  SPRECHEN_PASS_PCT,
  WRITING_PASS_PCT,
  chapterWritingTask,
} from '../src/lib/checkpoint/buildCheckpoint.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { courseWritingTasks } from '../src/data/writingTasks.js';
import { nextDue, LADDER_DAYS, MAX_STEP, wordCardKey, patternCardKey, sentenceCardKey, parseCardKey } from '../src/lib/review/ladder.js';
import { CURRICULUM_FIXTURE, CURRICULUM_FIXTURE_6 } from './fixtures/curriculum-fixture.js';

const POOL = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));

const cp1 = CURRICULUM_FIXTURE.checkpoints[0];
const cp2of6 = CURRICULUM_FIXTURE_6.checkpoints[1];

const build = (curriculum, checkpoint, seed) =>
  buildCheckpoint({ curriculum, checkpoint, pool: POOL, seed });

// ── 1. shape ────────────────────────────────────────────────────────────────

test('a checkpoint is 20 items in the 5/4/6/3/2 section split', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  assert.equal(items.length, CHECKPOINT_ITEM_COUNT);
  for (const section of SECTION_ORDER) {
    assert.equal(
      items.filter((i) => i.section === section).length,
      SECTION_COUNTS[section],
      `${section} must hold exactly ${SECTION_COUNTS[section]} items`,
    );
  }
  assert.equal(Object.values(SECTION_COUNTS).reduce((a, b) => a + b, 0), CHECKPOINT_ITEM_COUNT);
});

test('Hören is 3 dictations of dialogue lines plus 2 word-choice items with 3 distractors', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'hoeren');
  const dictations = items.filter((i) => i.kind === 'dictation');
  const choices = items.filter((i) => i.kind === 'wordChoice');
  assert.equal(dictations.length, 3);
  assert.equal(choices.length, 2);

  const lines = new Set(
    chapterLektionen(CURRICULUM_FIXTURE, cp1).flatMap((l) => l.dialog.lines.map((line) => line.de)),
  );
  for (const d of dictations) {
    assert.ok(lines.has(d.answer), 'a dictation must be an actual dialogue line of the chapter');
    assert.equal(d.mode, 'typed');
    assert.equal(d.audioText, d.answer);
  }
  const wortfeld = new Set(chapterLektionen(CURRICULUM_FIXTURE, cp1).flatMap((l) => l.wortfeld.map((w) => w.de)));
  for (const c of choices) {
    assert.equal(c.options.length, 4, 'correct word + 3 distractors');
    assert.ok(c.options.includes(c.answer));
    for (const option of c.options) assert.ok(wortfeld.has(option), 'distractors come from the Wortfeld');
  }
});

test('Lesen items carry a 2–3 line text and a richtig/falsch statement, two of each', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'lesen');
  assert.equal(items.length, 4);
  for (const item of items) {
    assert.deepEqual(item.options, ['Richtig', 'Falsch']);
    assert.ok(item.text && item.text.split(' ').length > 3, 'a Lesen item shows a text');
    assert.ok(['Richtig', 'Falsch'].includes(item.answer));
    assert.equal(item.hint, null, 'the hint named the Lektion, which is half the answer');
  }
  assert.equal(items.filter((i) => i.answer === 'Richtig').length, 2);
  assert.equal(items.filter((i) => i.answer === 'Falsch').length, 2);
  // A "falsch" statement must not be quoting a line of its own text.
  for (const item of items.filter((i) => i.answer === 'Falsch')) {
    const quoted = item.promptDe.slice(item.promptDe.indexOf('„') + 1, item.promptDe.lastIndexOf('“'));
    assert.ok(!item.text.includes(quoted.split(': ').slice(1).join(': ')), 'a falsch statement is false by construction');
  }
});

const quotedStatement = (item) =>
  item.promptDe.slice(item.promptDe.indexOf('„') + 1, item.promptDe.lastIndexOf('“')).split(': ').slice(1).join(': ');

test('the Lesen answer key is drawn, not the same R–F–R–F in every checkpoint', () => {
  // The real curriculum, because this is a claim about the four checkpoints a
  // learner actually sits — the fixture has one.
  const orders = CURRICULUM_A11.checkpoints.map((cp) =>
    buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .filter((i) => i.section === 'lesen')
      .map((i) => i.answer)
      .join('-'),
  );
  assert.equal(orders.length, 4);
  for (const order of orders) {
    assert.equal(order.split('-').filter((a) => a === 'Richtig').length, 2, 'still two richtig');
    assert.equal(order.split('-').filter((a) => a === 'Falsch').length, 2, 'and two falsch');
  }
  assert.ok(new Set(orders).size >= 2, `all four checkpoints share one answer key: ${orders.join(' | ')}`);
});

test('a falsch statement is this text with ONE detail changed, not another Lektion', () => {
  for (const cp of CURRICULUM_A11.checkpoints) {
    const chapterLines = new Set(
      chapterLektionen(CURRICULUM_A11, cp).flatMap((l) => l.dialog.lines.map((line) => line.de)),
    );
    const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .filter((i) => i.section === 'lesen');
    for (const item of items.filter((i) => i.answer === 'Falsch')) {
      const statement = quotedStatement(item);
      assert.ok(!chapterLines.has(statement), 'a falsch statement is not a real line of any Lektion');
      // It derives from a line of ITS OWN text, with exactly ONE word changed —
      // the explanation names the line, and the line is in the text.
      assert.match(item.explanationDe, /Im Text steht/, 'the explanation shows what the text really says');
      const source = item.explanationDe.slice(item.explanationDe.indexOf('„') + 1, item.explanationDe.indexOf('“'));
      assert.ok(item.text.includes(source), `${cp.id}: the falsified line must be IN this text`);
      const words = statement.split(' ');
      const other = source.split(' ');
      assert.equal(other.length, words.length, `${cp.id}: one detail changed, not the sentence`);
      assert.equal(
        words.filter((w, i) => w !== other[i]).length,
        1,
        `${cp.id}: exactly one word differs — ${statement} vs ${source}`,
      );
    }
  }
});

test('Sprachbausteine is 6 pool items with at least 4 typed; Schreiben is 3 production items', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const bausteine = items.filter((i) => i.section === 'bausteine');
  assert.equal(bausteine.length, 6);
  assert.ok(bausteine.every((i) => i.poolItemId), 'Sprachbausteine come from the pool');
  assert.ok(bausteine.filter((i) => i.mode === 'typed').length >= 4, 'at least 4 typed');

  const schreiben = items.filter((i) => i.section === 'schreiben');
  assert.equal(schreiben.length, 3);
  // The fixture curriculum carries no schreiben.taskKey, so there is no graded
  // task to mount and the section is three drills — the fallback path.
  assert.ok(schreiben.every((i) => i.mode === 'typed'), 'Schreiben is production, never chips');
  const poolById = new Map(POOL.items.map((p) => [p.id, p]));
  assert.ok(schreiben.every((i) => isTyped(poolById.get(i.poolItemId))), 'and typed in the pool too');
  assert.ok(schreiben.every((i) => i.register === null), 'a drill has no Textsorte — the label was invented');
});

test('Schreiben drills come from different Lektionen of the chapter, never one topic three times', () => {
  for (const [curriculum, checkpoint] of [[CURRICULUM_FIXTURE, cp1], [CURRICULUM_FIXTURE_6, cp2of6]]) {
    const schreiben = build(curriculum, checkpoint).filter((i) => i.section === 'schreiben');
    const topics = new Set(schreiben.map((i) => i.topic));
    assert.ok(topics.size >= 3, `Schreiben must span at least 3 topics, got ${[...topics].join(', ')}`);
  }
  for (const cp of CURRICULUM_A11.checkpoints) {
    const schreiben = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .filter((i) => i.section === 'schreiben');
    assert.equal(schreiben.length, SECTION_COUNTS.schreiben);
    const topics = new Set(schreiben.map((i) => i.topic));
    assert.ok(topics.size >= 3, `${cp.id}: Schreiben must span at least 3 topics, got ${[...topics].join(', ')}`);
    const slugs = new Set(chapterLektionen(CURRICULUM_A11, cp).map((l) => l.primarySlug));
    for (const drill of schreiben.filter((i) => i.kind !== 'gradedWriting')) {
      assert.equal(drill.register, null, 'no invented Textsorte on a drill item');
      assert.ok(slugs.has(drill.topic), `${drill.topic} is not a primarySlug of the chapter`);
    }
  }
});

test('every checkpoint carries the chapter\'s real writing task, AI-graded and optional', () => {
  const bankKeys = new Set(courseWritingTasks(CURRICULUM_A11.level).map((t) => t.taskKey));
  for (const cp of CURRICULUM_A11.checkpoints) {
    const chapter = chapterLektionen(CURRICULUM_A11, cp);
    const expected = [...chapter].reverse().find((l) => l?.schreiben?.taskKey).schreiben.taskKey;
    const item = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .find((i) => i.kind === 'gradedWriting');
    assert.ok(item, `${cp.id} must mount a real writing task`);
    assert.equal(item.section, 'schreiben');
    assert.equal(item.task.taskKey, expected, 'the task is the chapter\'s LAST Lektion');
    assert.ok(bankKeys.has(item.task.taskKey), 'and evaluate-writing must know the key');
    assert.equal(item.task.examKey, 'goethe_a1');
    assert.ok(item.promptDe && item.promptDe.length > 20, 'the prompt is the bank prompt');
    assert.equal(item.register, chapterWritingTask(chapter, CURRICULUM_A11.level).schreiben.kind, 'a REAL register');
    assert.equal(item.scored, false);
    assert.equal(item.scorable, true);
    assert.equal(item.optional, true, 'no grader verdict = not attempted, never a failed section');
  }
});

test('the writing task scores as one Schreiben item, and leaves the section when it was not graded', () => {
  const cp = CURRICULUM_A11.checkpoints[0];
  const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL });
  const writing = items.find((i) => i.kind === 'gradedWriting');
  const base = answerAll(items, { correctFor: () => true });

  // Graded and passed: three Schreiben items, all correct.
  const passed = scoreCheckpoint(items, { ...base, [writing.id]: { graded: true, pct: 0.8 } });
  assert.equal(passed.sections.schreiben.total, 3);
  assert.equal(passed.sections.schreiben.correct, 3);

  // Graded and failed: still three, one wrong, and tagged as a writing miss.
  const failed = scoreCheckpoint(items, { ...base, [writing.id]: { graded: true, pct: 0.2 } });
  assert.equal(failed.sections.schreiben.total, 3);
  assert.equal(failed.sections.schreiben.correct, 2);
  assert.equal(failed.errorTags.Schreiben, 1);

  // Signed out / over the allowance / offline: GradedWriting falls back to its
  // form check and the page sends no verdict. The task is NOT attempted — the
  // section scores over its two drills instead of failing on an item the
  // learner could not have passed.
  const ungraded = scoreCheckpoint(items, { ...base, [writing.id]: null });
  assert.equal(ungraded.sections.schreiben.total, 2);
  assert.equal(ungraded.sections.schreiben.scored, true);
  assert.equal(ungraded.sections.schreiben.pct, 100);
  assert.equal(ungraded.passed, true);

  assert.equal(WRITING_PASS_PCT, 0.6);
  assert.equal(isItemCorrect(writing, { graded: true, pct: 0.6 }), true);
  assert.equal(isItemCorrect(writing, { graded: true, pct: 0.59 }), false);
  assert.equal(isWritingResult({ graded: true, pct: 0.5 }), true);
  assert.equal(isWritingResult({ pct: 0.5 }), false);
  assert.equal(isWritingResult(true), false);
});

test('Sprechen is 2 read-alouds of real dialogue lines, scorable but not yet scored', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'sprechen');
  assert.equal(items.length, 2);
  for (const item of items) {
    assert.equal(item.scored, false, 'nothing is scored until a mic result arrives');
    assert.equal(item.scorable, true, 'but the microphone CAN score it');
    assert.equal(item.mode, 'confirm');
    assert.ok(item.audioText);
    assert.ok(item.lektionId, 'playLine needs the Lektion the line belongs to');
    assert.match(item.lineKey, /^line-\d+$/, 'and the manifest key of the line');
  }
});

test('Hören items carry the audio manifest keys playLine needs', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'hoeren');
  for (const item of items.filter((i) => i.kind === 'dictation')) {
    assert.ok(item.lektionId, 'a dictation names its Lektion');
    assert.match(item.lineKey, /^line-\d+$/);
  }
  for (const item of items.filter((i) => i.kind === 'wordChoice')) {
    assert.ok(item.lektionId);
    assert.equal(item.lineKey, null, 'a single word has no line recording — it synthesises');
  }
});

test('no pool item appears twice in one checkpoint', () => {
  const drawn = build(CURRICULUM_FIXTURE, cp1).map((i) => i.poolItemId).filter(Boolean);
  assert.equal(new Set(drawn).size, drawn.length);
});

// ── 2. determinism ──────────────────────────────────────────────────────────

test('the same seed builds the same checkpoint; a different seed does not', () => {
  const a = build(CURRICULUM_FIXTURE, cp1, 'seed-a');
  const b = build(CURRICULUM_FIXTURE, cp1, 'seed-a');
  assert.deepEqual(a, b);
  const c = build(CURRICULUM_FIXTURE, cp1, 'seed-b');
  assert.notDeepEqual(a.map((i) => i.answer), c.map((i) => i.answer));
});

test('the default seed is the checkpoint id, so a reload rebuilds the same test', () => {
  assert.deepEqual(build(CURRICULUM_FIXTURE, cp1), build(CURRICULUM_FIXTURE, cp1, cp1.id));
});

// ── 3. the pass rule ────────────────────────────────────────────────────────

const answerAll = (items, { correctFor }) => {
  const answers = {};
  for (const item of items) {
    // The writing task answers with a grader verdict (that is the only thing
    // that counts as an answer there); everything else confirm-mode taps "done".
    if (item.kind === 'gradedWriting') answers[item.id] = { graded: true, pct: correctFor(item) ? 1 : 0 };
    else if (item.mode === 'confirm') answers[item.id] = true;
    else answers[item.id] = correctFor(item) ? item.answer : 'völlig falsch';
  }
  return answers;
};

test('everything right passes; everything wrong fails', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const perfect = scoreCheckpoint(items, answerAll(items, { correctFor: () => true }));
  assert.equal(perfect.overall, 100);
  assert.equal(perfect.passed, true);
  assert.equal(perfect.total, 18, 'the 2 Sprechen items are outside the scored total');

  const nothing = scoreCheckpoint(items, answerAll(items, { correctFor: () => false }));
  assert.equal(nothing.overall, 0);
  assert.equal(nothing.passed, false);
  assert.ok(Object.values(nothing.errorTags).reduce((a, b) => a + b, 0) > 0, 'misses are tagged');
});

test('60 % overall is not enough when one scored section is below 40 %', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  // Every section right except Hören (0/5) → 13/18 = 72 % overall, Hören 0 %.
  const answers = answerAll(items, { correctFor: (item) => item.section !== 'hoeren' });
  const result = scoreCheckpoint(items, answers);
  assert.ok(result.overall >= 60, 'the overall bar is cleared');
  assert.equal(result.sections.hoeren.pct, 0);
  assert.equal(result.passed, false, 'and it still fails — the 40 % clause is what does it');
});

test('a section at exactly 40 % and an overall at exactly 60 % pass', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  // Hören 2/5 = 40 %, everything else right → 15/18 = 83 %.
  let hoeren = 0;
  const answers = answerAll(items, {
    correctFor: (item) => (item.section === 'hoeren' ? (hoeren += 1) <= 2 : true),
  });
  const result = scoreCheckpoint(items, answers);
  assert.equal(result.sections.hoeren.pct, 40);
  assert.equal(result.passed, true);
});

test('Sprechen is required but never decides the result', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const answers = answerAll(items, { correctFor: () => true });
  for (const item of items.filter((i) => i.section === 'sprechen')) delete answers[item.id];
  const result = scoreCheckpoint(items, answers);
  assert.equal(result.sections.sprechen.correct, 0);
  assert.equal(result.sections.sprechen.scored, false);
  assert.equal(result.overall, 100);
  assert.equal(result.passed, true);
});

test('a mic-scored Sprechen section counts — into the overall AND the 40 % rule', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const sprechen = items.filter((i) => i.section === 'sprechen');

  // Everything right, both read-alouds recorded and understood.
  const good = answerAll(items, { correctFor: () => true });
  for (const item of sprechen) good[item.id] = { usedMic: true, pct: 0.9 };
  const passed = scoreCheckpoint(items, good);
  assert.equal(passed.sections.sprechen.scored, true, 'a mic result promotes the section');
  assert.equal(passed.total, 20, 'and all 20 items are now scored');
  assert.equal(passed.sections.sprechen.pct, 100);
  assert.equal(passed.passed, true);

  // Understood too little: below the threshold the item is simply wrong.
  const weak = answerAll(items, { correctFor: () => true });
  for (const item of sprechen) weak[item.id] = { usedMic: true, pct: 0.2 };
  const weakResult = scoreCheckpoint(items, weak);
  assert.equal(weakResult.sections.sprechen.scored, true);
  assert.equal(weakResult.sections.sprechen.correct, 0);
  assert.equal(weakResult.passed, false, 'Sprechen at 0 % trips the 40 % clause');
  assert.equal(weakResult.errorTags.Aussprache, 2, 'and the misses are tagged as the function tags them');
});

test('the Sprechen threshold is 60 % word recognition, and it is a boundary', () => {
  const item = build(CURRICULUM_FIXTURE, cp1).find((i) => i.section === 'sprechen');
  assert.equal(SPRECHEN_PASS_PCT, 0.6);
  assert.equal(isItemCorrect(item, { usedMic: true, pct: 0.6 }), true);
  assert.equal(isItemCorrect(item, { usedMic: true, pct: 0.59 }), false);
});

test('one self-confirm anywhere in Sprechen keeps the whole section out of the score', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const sprechen = items.filter((i) => i.section === 'sprechen');
  const answers = answerAll(items, { correctFor: () => true });
  answers[sprechen[0].id] = { usedMic: true, pct: 0.95 };
  answers[sprechen[1].id] = true; // no microphone — the honest fallback
  const result = scoreCheckpoint(items, answers);
  assert.equal(result.sections.sprechen.scored, false);
  assert.equal(result.total, 18, 'half a Sprechen score is not a Sprechen score');
  assert.equal(result.sections.sprechen.correct, 2, 'both are still reported as done');
  assert.equal(result.passed, true);
});

test('a mic result is recognised only with the flag AND a numeric percentage', () => {
  assert.equal(isMicResult({ usedMic: true, pct: 0.5 }), true);
  assert.equal(isMicResult({ usedMic: false, pct: 0.5 }), false);
  assert.equal(isMicResult({ usedMic: true }), false);
  assert.equal(isMicResult(true), false);
  assert.equal(isMicResult(null), false);

  const built = build(CURRICULUM_FIXTURE, cp1);
  const sprechenItem = built.find((i) => i.section === 'sprechen');
  const typedItem = built.find((i) => i.section === 'bausteine');
  assert.equal(itemIsScored(sprechenItem, true), false);
  assert.equal(itemIsScored(sprechenItem, { usedMic: true, pct: 0 }), true);
  assert.equal(itemIsScored(typedItem, undefined), true, 'a typed item is scored regardless');
});

test('a one-letter slip on a strict grammar topic is still wrong', () => {
  // STRICT_TOPIC is the topics where the ending IS the answer — articles,
  // possessives, pronouns, plural (narrowed by REVIEW #2 §E, which found the old
  // pattern disabling the typo allowance for whole typed sentences on nine of the
  // twelve Lektionen). A verb topic now gets the Levenshtein allowance back.
  const strict = { topic: 'definite-articles', mode: 'typed', accepted: ['die Tür'], answer: 'die Tür', scored: true };
  assert.equal(isItemCorrect(strict, 'die Tür'), true);
  assert.equal(isItemCorrect(strict, 'die Türr'), false);
  const loose = { topic: 'verb-sein', mode: 'typed', accepted: ['du bist'], answer: 'du bist', scored: true };
  assert.equal(isItemCorrect(loose, 'du bistt'), true, 'one slip in a verb form is spelling');
});

// ── 3d. grading parity with the lesson (REVIEW #4 BLOCKER 3 + spelled-out) ──
//
// isItemCorrect (checkpoint) and gradeTypedReview (review) must grade exactly
// like PracticeItem.jsx: caseSensitive: isCaseTask(item), so the polite `Ihr`
// answered lowercase is wrong everywhere, and a spelled-out answer is correct
// however its letters are separated, everywhere.

test('the polite Ihr answered lowercase is wrong in the checkpoint, not a forgiven typo', () => {
  // check.js: isCaseTask(item) is the item's OWN `caseSensitive === true` and
  // nothing else — the polite-possessive regex that used to infer it was removed
  // because it hit items whose explanation taught the lowercase answer. The
  // checkpoint must carry the pool item's flag through fromPoolItem, which is
  // what this pins.
  const politeItem = {
    topic: 'possessive-articles',
    mode: 'typed',
    answer: 'Ihr',
    accepted: ['Ihr'],
    caseSensitive: true,
    scored: true,
  };
  assert.equal(isItemCorrect(politeItem, 'ihr'), false, 'caseSensitive must come from isCaseTask, not just STRICT_TOPIC');
  assert.equal(isItemCorrect(politeItem, 'Ihr'), true);

  // An explicit caseSensitive:true pool item (independent of the topic regex)
  // must behave the same way once it reaches a checkpoint item.
  const flagged = {
    topic: 'some-other-topic',
    mode: 'typed',
    answer: 'Berlin',
    accepted: ['Berlin'],
    caseSensitive: true,
    scored: true,
  };
  assert.equal(isItemCorrect(flagged, 'berlin'), false);
});

test('a spelled-out answer is correct in the checkpoint however the letters are separated', () => {
  const spelled = {
    topic: 'spelling',
    mode: 'typed',
    answer: 'H-A-L-L-O',
    accepted: ['H-A-L-L-O'],
    scored: true,
  };
  assert.equal(isItemCorrect(spelled, 'HALLO'), true);
  assert.equal(isItemCorrect(spelled, 'H A L L O'), true);
});

test('gradeTypedReview (the review page grading helper) matches the checkpoint on the same two cases', async () => {
  const { gradeTypedReview } = await import('../src/lib/checkpoint/reviewGrading.js');

  // A possessive-articles review card whose accepted answer is the polite Ihr.
  // The card carries the flag (reviewService.buildCardIndex copies it off the
  // curriculum entry and ReviewPage passes it), exactly as a lesson item does.
  const ihrCard = gradeTypedReview('pattern:possessive-articles', ['Ihr'], 'ihr', { caseSensitive: true });
  assert.equal(ihrCard.ok, false, 'lowercase ihr must not be counted correct in the review helper either');
  assert.equal(gradeTypedReview('pattern:possessive-articles', ['Ihr'], 'Ihr', { caseSensitive: true }).ok, true);

  // A spelled-out sentence/word card.
  assert.equal(gradeTypedReview('sentence:l1:0', ['H-A-L-L-O'], 'HALLO').ok, true);
  assert.equal(gradeTypedReview('sentence:l1:0', ['H-A-L-L-O'], 'H A L L O').ok, true);
});

// ── 4. the 70/30 draw ───────────────────────────────────────────────────────

test('checkpoint 1 has no earlier chapter, so every pool item is from this chapter', () => {
  const drawn = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.poolItemId);
  assert.equal(drawn.length, POOL_ITEMS_TOTAL);
  assert.ok(drawn.every((i) => i.source === 'chapter'));
});

test('checkpoint 2 draws 70 % from its own chapter and 30 % from earlier ones', () => {
  const items = build(CURRICULUM_FIXTURE_6, cp2of6);
  const drawn = items.filter((i) => i.poolItemId);
  assert.equal(drawn.length, POOL_ITEMS_TOTAL);
  assert.equal(drawn.filter((i) => i.source === 'earlier').length, POOL_ITEMS_EARLIER);
  assert.equal(drawn.filter((i) => i.source === 'chapter').length, POOL_ITEMS_TOTAL - POOL_ITEMS_EARLIER);
  assert.ok(drawn.filter((i) => i.source === 'chapter').length / drawn.length >= 0.7);

  const chapterTopics = topicsOf(chapterLektionen(CURRICULUM_FIXTURE_6, cp2of6));
  const earlierTopics = topicsOf(earlierLektionen(CURRICULUM_FIXTURE_6, cp2of6));
  for (const item of drawn) {
    const expected = item.source === 'earlier' ? earlierTopics : chapterTopics;
    assert.ok(expected.includes(item.topic), `${item.topic} must come from the ${item.source} topics`);
  }
});

test('a checkpoint only ever uses its own chapter for Hören, Lesen and Sprechen', () => {
  const chapterLines = new Set(
    chapterLektionen(CURRICULUM_FIXTURE_6, cp2of6).flatMap((l) => l.dialog.lines.map((line) => line.de)),
  );
  const generated = build(CURRICULUM_FIXTURE_6, cp2of6).filter((i) => ['hoeren', 'sprechen'].includes(i.section) && i.kind !== 'wordChoice');
  for (const item of generated) assert.ok(chapterLines.has(item.audioText), 'spoken/heard material is this chapter only');
});

// ── 5. remediation ──────────────────────────────────────────────────────────

test('remediation is 10 fresh items aimed at the topics that were missed', () => {
  const items = build(CURRICULUM_FIXTURE_6, cp2of6);
  // Miss only the Sprachbausteine; get everything else right.
  const answers = answerAll(items, { correctFor: (item) => item.section !== 'bausteine' });
  const set = remediationSet(items, answers, POOL);
  assert.equal(set.length, 10);

  const seen = new Set(items.map((i) => i.poolItemId).filter(Boolean));
  for (const item of set) assert.ok(!seen.has(item.poolItemId), 'a miss returns as a DIFFERENT item');

  const missedTopics = new Set(items.filter((i) => i.section === 'bausteine').map((i) => i.topic));
  const targeted = set.filter((i) => missedTopics.has(i.topic));
  assert.ok(targeted.length >= 6, 'the set is about what went wrong, not a random refill');
  assert.equal(set.every((i) => i.section === 'remediation'), true);
  assert.ok(set[0].errorTags && Object.keys(set[0].errorTags).length > 0, 'it carries the error tags it answers');
});

test('remediation is deterministic and ignores topics the pool cannot serve', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const answers = answerAll(items, { correctFor: () => false });
  const a = remediationSet(items, answers, POOL);
  const b = remediationSet(items, answers, POOL);
  assert.deepEqual(a.map((i) => i.poolItemId), b.map((i) => i.poolItemId));
  const poolTopics = new Set(POOL.items.map((i) => i.topic));
  for (const item of a) assert.ok(poolTopics.has(item.topic));
});

// ── 6. the review ladder ────────────────────────────────────────────────────

test('the ladder walks 1, 4, 7, 14, 60, 180 days and then stays at 180', () => {
  assert.deepEqual(LADDER_DAYS, [1, 4, 7, 14, 60, 180]);
  let step = 0;
  const walked = [];
  for (let i = 0; i < 8; i += 1) {
    const next = nextDue(step, true);
    walked.push(next.dueInDays);
    step = next.step;
  }
  assert.deepEqual(walked, [1, 4, 7, 14, 60, 180, 180, 180]);
  assert.equal(step, MAX_STEP);
});

test('a lapse drops the card to step 0 and back to tomorrow', () => {
  const lapse = nextDue(4, false);
  assert.equal(lapse.step, 0);
  assert.equal(lapse.dueInDays, 1);
  assert.equal(lapse.lapsed, true);
  // …and the next correct answer starts the ladder again, not where it was.
  assert.equal(nextDue(lapse.step, true).dueInDays, 1);
});

test('dueAt is the interval measured from now', () => {
  const now = new Date('2026-09-12T09:00:00.000Z');
  assert.equal(nextDue(1, true, now).dueAt.toISOString(), '2026-09-16T09:00:00.000Z');
});

test('card keys round-trip and name their kind', () => {
  assert.equal(wordCardKey({ wordId: 'abc', de: 'der Name' }), 'word:abc');
  assert.equal(wordCardKey({ de: 'der Name' }), 'word:der Name');
  assert.equal(patternCardKey('verb-sein'), 'pattern:verb-sein');
  assert.equal(sentenceCardKey('a1.1-l01', 3), 'sentence:a1.1-l01:3');
  assert.deepEqual(parseCardKey('sentence:a1.1-l01:3'), { kind: 'sentence', lektionId: 'a1.1-l01', lineIdx: 3, ref: 'a1.1-l01:3' });
  assert.equal(parseCardKey('nonsense:x'), null);
});

// ── persistence wiring ──────────────────────────────────────────────────────

// checkpointService.js imports the browser Supabase client, so it cannot be
// imported here; its wiring is pinned by reading it, the way claims.test.mjs
// pins the Netlify functions. Three facts must hold or the course home's
// percentage, the attempt limit and the ledger all silently stop working.
test('checkpointService writes the three ledgers the contract names', () => {
  const src = readFileSync(new URL('../src/services/checkpointService.js', import.meta.url), 'utf8');
  assert.match(src, /_course`/, 'program_progress key is derived from the level');
  assert.match(src, /\.replace\(\/\\\.\/g, ''\)/, 'a1.1 → a11, every dot removed');
  assert.match(src, /from\('lesson_attempts'\)/);
  assert.match(src, /from\('lesson_progress'\)/);
  assert.match(src, /stage: 'checkpoint'/);
  assert.match(src, /ATTEMPT_LIMIT = 3/);
  assert.match(src, /ATTEMPT_WINDOW_HOURS = 8/);
});

test('reviewService seeds and grades through the ladder, fail-soft', () => {
  const src = readFileSync(new URL('../src/services/reviewService.js', import.meta.url), 'utf8');
  assert.match(src, /export async function seedCardsForLektion/, 'the integration hook the lesson engine calls');
  assert.match(src, /from\('review_cards'\)|const TABLE = 'review_cards'/);
  assert.match(src, /ignoreDuplicates: true/, 'seeding never resets a card that has earned its interval');
  assert.ok(!/throw /.test(src), 'review writes never throw into a lesson');
});

test('the review_cards migration carries own-row RLS and the checkpoint marker', () => {
  const sql = readFileSync(new URL('../migrations/2026-09-12-lesson-engine.sql', import.meta.url), 'utf8');
  assert.match(sql, /checkpoint agent section/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.review_cards/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  for (const verb of ['select', 'insert', 'update', 'delete']) {
    assert.match(sql, new RegExp(`review_cards_${verb}_own`), `own-row ${verb} policy`);
  }
  assert.match(sql, /CHECK \(kind IN \('word', 'pattern', 'sentence'\)\)/);
});

// ── register (DaF review #5, MAJOR "CheckpointPage.jsx:169/429 …") ───────────
//
// The lesson chrome sieze; the two screens beside it duzed. tests/course-player.test.mjs
// greps every src/pages/lesson/*.jsx for du-forms — this is the same guard kept
// next to the builder, because the checkpoint's own generated prompts
// ("Hören Sie zu und schreiben Sie den Satz.") are written HERE, not in the page,
// and a du-form reintroduced in either place puts two Anreden on one screen.
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

test('the checkpoint and review screens (and the prompts the builder writes) sieze', () => {
  const offenders = [];
  for (const file of [
    'src/pages/lesson/CheckpointPage.jsx',
    'src/pages/lesson/ReviewPage.jsx',
    'src/lib/checkpoint/buildCheckpoint.js',
    'src/lib/checkpoint/reviewGrading.js',
  ]) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    src.split('\n').forEach((line, i) => {
      if (DU_TOKENS.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `du-register on the checkpoint/review screens:\n${offenders.join('\n')}`);
});

test('the four strings DaF review #5 named now address the learner as Sie', () => {
  const checkpoint = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  const review = readFileSync(new URL('../src/pages/lesson/ReviewPage.jsx', import.meta.url), 'utf8');
  assert.ok(checkpoint.includes('Bewertet — Verständlichkeit zählt in Ihr Sprechen-Ergebnis.'));
  assert.ok(checkpoint.includes('im Format Ihrer Prüfung'));
  assert.ok(review.includes('Melden Sie sich an, damit Ihre Wiederholungen gespeichert werden.'));
  assert.ok(review.includes('Neue Karten kommen, sobald Sie eine Lektion abschließen.'));
});
