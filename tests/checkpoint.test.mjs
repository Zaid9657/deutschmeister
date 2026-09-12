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
//   4. THE 70/30 DRAW — once earlier chapters exist, the pool-drawn items must
//      interleave them. Spacing is the single strongest effect in the research
//      memo (g = 0.74); a chapter-only checkpoint throws it away.
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
} from '../src/lib/checkpoint/buildCheckpoint.js';
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
  }
  assert.equal(items.filter((i) => i.answer === 'Richtig').length, 2);
  assert.equal(items.filter((i) => i.answer === 'Falsch').length, 2);
  // A "falsch" statement must not be quoting a line of its own text.
  for (const item of items.filter((i) => i.answer === 'Falsch')) {
    const quoted = item.promptDe.slice(item.promptDe.indexOf('„') + 1, item.promptDe.lastIndexOf('“'));
    assert.ok(!item.text.includes(quoted.split(': ').slice(1).join(': ')), 'a falsch statement is false by construction');
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
  assert.ok(schreiben.every((i) => i.mode === 'typed'), 'Schreiben is production, never chips');
  const poolById = new Map(POOL.items.map((p) => [p.id, p]));
  assert.ok(schreiben.every((i) => isTyped(poolById.get(i.poolItemId))), 'and typed in the pool too');
});

test('Sprechen is 2 unscored read-alouds of real dialogue lines', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'sprechen');
  assert.equal(items.length, 2);
  for (const item of items) {
    assert.equal(item.scored, false, 'self-confirm is required but never scored');
    assert.equal(item.mode, 'confirm');
    assert.ok(item.audioText);
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
    if (item.mode === 'confirm') answers[item.id] = true;
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

test('a one-letter slip on a strict grammar topic is still wrong', () => {
  const strict = { topic: 'verb-sein', mode: 'typed', accepted: ['du bist'], answer: 'du bist', scored: true };
  assert.equal(isItemCorrect(strict, 'du bist'), true);
  assert.equal(isItemCorrect(strict, 'du bistt'), false);
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
