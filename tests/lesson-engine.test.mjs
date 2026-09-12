// Guard suite for the lesson engine (docs/course-standard-2026-09-12.md §3,
// docs/course-factory/a11-rebuild/CONTRACT.md "Engine rules"). Pins the stage
// order, the shape of the controlled-practice draw, its determinism, the
// requeue rule, the mastery thresholds and the checkAnswer integration —
// the six things a later edit is most likely to break quietly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import buildLesson, { pickPracticeItems, seedFor, isTypedItem, isMultipleChoice, PRACTICE_SIZE, MAX_MULTIPLE_CHOICE } from '../src/lib/lesson/buildLesson.js';
import { requeueFor, REQUEUE_CAP } from '../src/lib/lesson/requeue.js';
import { firstAttemptAccuracy, masteryStatus, masteryLabel, accuracyPercent, GOLD_THRESHOLD, nextReviewDate } from '../src/lib/lesson/mastery.js';
import { checkAnswer, RESULT, STRICT_TOPIC, tagError } from '../src/lib/lesson/check.js';
import { scoreWriting, leitpunktKeyword } from '../src/lib/lesson/writing.js';
import { FIXTURE_LEKTION, FIXTURE_CURRICULUM } from './fixtures/lektion-fixture.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const POOL = JSON.parse(read('src/data/lessonPools/a11.json'));

const build = (over = {}) =>
  buildLesson({ curriculum: FIXTURE_CURRICULUM, lektion: FIXTURE_LEKTION, pool: POOL, ...over });

// --- stage order -----------------------------------------------------------

test('the stages come out in the order of the standard, and the warm-up is skipped when nothing is due', () => {
  const { stages } = build();
  assert.deepEqual(
    stages.map((s) => s.key),
    ['pretest', 'dialog', 'wortfeld', 'notice', 'practice', 'dictation', 'speaking', 'writing', 'requeue', 'recap'],
  );
  // The stage NUMBERS of the standard never decrease along the list.
  const nrs = stages.map((s) => s.nr);
  assert.deepEqual(nrs, [...nrs].sort((a, b) => a - b));
  assert.deepEqual([...new Set(nrs)], [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('due cards open the lesson as stage 0', () => {
  const { stages } = build({ dueCards: [{ cardKey: 'w:name', front: 'der Name', back: 'name' }] });
  assert.equal(stages[0].key, 'warmup');
  assert.equal(stages[0].nr, 0);
  assert.equal(stages[0].cards.length, 1);
});

test('the dictation and read-aloud stages resolve their dialogue line indexes', () => {
  const { stages } = build();
  const dictation = stages.find((s) => s.key === 'dictation');
  assert.deepEqual(dictation.lines.map((l) => l.index), FIXTURE_LEKTION.hoeren.lines);
  assert.equal(dictation.lines[0].de, FIXTURE_LEKTION.dialog.lines[0].de);
  const speaking = stages.find((s) => s.key === 'speaking');
  assert.deepEqual(speaking.readAloud.map((l) => l.index), FIXTURE_LEKTION.sprechen.readAloud);
  assert.equal(speaking.open.missionOrder, 1);
});

// --- controlled practice ---------------------------------------------------

test('controlled practice is 7 items, at least typedMin typed, at most 2 multiple choice, all on-topic', () => {
  const { stages } = build();
  const items = stages.find((s) => s.key === 'practice').items;
  assert.equal(items.length, PRACTICE_SIZE);
  assert.ok(items.filter(isTypedItem).length >= FIXTURE_LEKTION.practiceRule.typedMin);
  assert.ok(items.filter(isMultipleChoice).length <= MAX_MULTIPLE_CHOICE);
  for (const it of items) assert.ok(FIXTURE_LEKTION.practiceRule.topics.includes(it.topic), `${it.topic} is off-topic`);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length, 'no item appears twice');
});

test('a big typedMin still holds, and an MC-only topic slice never breaks the ceiling', () => {
  const typed = pickPracticeItems(POOL, { topics: ['separable-verbs-intro'], typedMin: 6 }, seedFor('a1.1', 10, 1));
  assert.equal(typed.length, PRACTICE_SIZE);
  assert.ok(typed.filter(isTypedItem).length >= 6);
  const narrow = pickPracticeItems(POOL, { topics: ['alphabet-pronunciation'], typedMin: 3 }, seedFor('a1.1', 1, 1));
  assert.ok(narrow.filter(isMultipleChoice).length <= MAX_MULTIPLE_CHOICE);
});

test('an empty or unknown topic list yields nothing rather than off-topic filler', () => {
  assert.deepEqual(pickPracticeItems(POOL, { topics: [], typedMin: 3 }, 1), []);
  assert.deepEqual(pickPracticeItems(POOL, { topics: ['no-such-topic'], typedMin: 3 }, 1), []);
});

test('the draw is deterministic per (level, nr, attempt) and a retry gives a different seven', () => {
  const rule = FIXTURE_LEKTION.practiceRule;
  const a = pickPracticeItems(POOL, rule, seedFor('a1.1', 1, 1)).map((i) => i.id);
  const again = pickPracticeItems(POOL, rule, seedFor('a1.1', 1, 1)).map((i) => i.id);
  assert.deepEqual(a, again, 'same seed must give the same items in the same order');

  const attempt2 = pickPracticeItems(POOL, rule, seedFor('a1.1', 1, 2)).map((i) => i.id);
  assert.notDeepEqual(a, attempt2, 'attempt 2 must not repeat attempt 1');

  const otherLektion = pickPracticeItems(POOL, rule, seedFor('a1.1', 2, 1)).map((i) => i.id);
  assert.notDeepEqual(a, otherLektion, 'a different Lektion must not get the same seven');

  // and the whole lesson build agrees with the standalone picker
  const built = build().stages.find((s) => s.key === 'practice').items.map((i) => i.id);
  assert.deepEqual(built, a);
});

// --- requeue ---------------------------------------------------------------

test('a miss returns as a DIFFERENT item of the same topic, never one already seen', () => {
  const seinItems = POOL.items.filter((i) => i.topic === 'verb-sein');
  const missed = [seinItems[0]];
  const out = requeueFor(missed, POOL, [seinItems[0].id]);
  assert.equal(out.length, 1);
  assert.equal(out[0].topic, 'verb-sein');
  assert.notEqual(out[0].id, seinItems[0].id);
});

test('the requeue is capped at four and never repeats itself', () => {
  const missed = POOL.items.filter((i) => i.topic === 'time-and-dates').slice(0, 6);
  const out = requeueFor(missed, POOL, missed.map((m) => m.id));
  assert.equal(out.length, REQUEUE_CAP);
  assert.equal(new Set(out.map((o) => o.id)).size, REQUEUE_CAP);
  for (const o of out) assert.equal(o.topic, 'time-and-dates');
});

test('when the topic slice is exhausted the same item comes back rather than nothing', () => {
  const sein = POOL.items.filter((i) => i.topic === 'verb-sein');
  const missed = [sein[0]];
  const out = requeueFor(missed, POOL, sein.map((s) => s.id));
  assert.equal(out.length, 1);
  assert.equal(out[0].id, sein[0].id);
});

test('no misses means no requeue stage content', () => {
  assert.deepEqual(requeueFor([], POOL, []), []);
});

// --- mastery ---------------------------------------------------------------

test('accuracy counts the FIRST response per item only', () => {
  const attempts = [
    { itemId: 'a', correct: false },
    { itemId: 'a', correct: true }, // the requeue replay — must not rescue the figure
    { itemId: 'b', correct: true },
    { itemId: 'c', correct: true },
    { itemId: 'd', correct: true },
  ];
  assert.equal(firstAttemptAccuracy(attempts), 0.75);
  assert.equal(accuracyPercent(0.75), 75);
  assert.equal(firstAttemptAccuracy([]), 0);
});

test('gold at >= 80 % first attempt, complete at anything else — there is no fail state', () => {
  assert.equal(GOLD_THRESHOLD, 0.8);
  assert.equal(masteryStatus(0.8), 'gold');
  assert.equal(masteryStatus(0.7999), 'complete');
  assert.equal(masteryStatus(1), 'gold');
  assert.equal(masteryStatus(0), 'complete');
  assert.equal(masteryLabel('gold'), 'Gold');
  assert.equal(masteryLabel('complete'), 'Geschafft');
  assert.equal(masteryLabel('started'), 'Begonnen');
  assert.equal(masteryLabel(undefined), 'Begonnen');
});

test('the first review lands one day out (the Babbel ladder starts at 1)', () => {
  const from = new Date('2026-09-12T10:00:00Z');
  assert.equal(nextReviewDate(from, 0).toISOString().slice(0, 10), '2026-09-13');
  assert.equal(nextReviewDate(from, 3).toISOString().slice(0, 10), '2026-09-26');
});

// --- checkAnswer integration ----------------------------------------------

test('a typo is forgiven on a vocabulary topic and never on a conjugation topic', () => {
  assert.equal(STRICT_TOPIC.test('verb-sein'), true);
  assert.equal(STRICT_TOPIC.test('time-and-dates'), false);

  const loose = checkAnswer('Wasserr', ['Wasser'], { strict: STRICT_TOPIC.test('alphabet-pronunciation') });
  assert.equal(loose.result, RESULT.TYPO);

  const strict = checkAnswer('bini', ['bin'], { strict: STRICT_TOPIC.test('verb-sein') });
  assert.equal(strict.result, RESULT.WRONG, 'on verb-sein a slip IS the grammar');

  assert.equal(checkAnswer('bin', ['bin'], { strict: true }).result, RESULT.CORRECT);
  assert.equal(checkAnswer('waere', ['wäre'], { strict: false }).result, RESULT.CORRECT, 'ae/ä are the same answer');
  assert.equal(checkAnswer('', ['bin'], {}).result, RESULT.WRONG);
});

test('every pool item this engine can draw is answerable through checkAnswer', () => {
  const rule = FIXTURE_LEKTION.practiceRule;
  for (const item of pickPracticeItems(POOL, rule, seedFor('a1.1', 1, 1))) {
    const accepted = item.accepted && item.accepted.length ? item.accepted : [item.answer];
    const { result } = checkAnswer(item.answer, accepted, { strict: STRICT_TOPIC.test(item.topic) });
    assert.equal(result, RESULT.CORRECT, `${item.id} does not accept its own answer`);
    assert.ok(item.explanationDe, `${item.id} has no explanationDe to show on a miss`);
  }
});

test('a miss is tagged, and the tag is one of the standard s tags', () => {
  const tags = new Set(['Artikel', 'Kasus', 'Verbstellung', 'Konjugation', 'Plural', 'Rechtschreibung', 'Hören', 'Wortschatz']);
  assert.ok(tags.has(tagError({ topic: 'verb-sein', type: 'fill_blank' }, 'bist', 'bin')));
  assert.equal(tagError({ kind: 'dictation' }, 'x', 'y'), 'Hören');
  assert.equal(tagError({ topic: 'definite-articles', type: 'fill_blank' }, 'die', 'der'), 'Artikel');
});

// --- writing (v1 client-side checklist) ------------------------------------

test('the writing checklist reads word count, Anrede, Gruß and one keyword per Leitpunkt', () => {
  const { schreiben } = FIXTURE_LEKTION;
  assert.equal(leitpunktKeyword('Name sagen'), 'Name');
  const good = scoreWriting(schreiben, FIXTURE_LEKTION.schreiben.sample);
  assert.equal(good.ok, true, JSON.stringify(good.checks));
  const bad = scoreWriting(schreiben, 'Ana');
  assert.equal(bad.ok, false);
  assert.equal(bad.count, 1);
});

test('a Formular is scored on its fields being filled', () => {
  const formular = { kind: 'formular', fields: ['Name', 'Land'] };
  assert.equal(scoreWriting(formular, { Name: 'Ana', Land: 'Spanien' }).ok, true);
  assert.equal(scoreWriting(formular, { Name: 'Ana', Land: '  ' }).ok, false);
});

// --- wiring ----------------------------------------------------------------

test('the migration creates both tables with own-rows RLS and leaves the review_cards marker', () => {
  const sql = readFileSync(join(ROOT, 'migrations/2026-09-12-lesson-engine.sql'), 'utf8');
  for (const t of ['lesson_progress', 'lesson_attempts']) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t}`), `${t} is not created idempotently`);
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`), `${t} has no RLS`);
  }
  assert.match(sql, /status text NOT NULL DEFAULT 'started' CHECK \(status IN \('started', 'complete', 'gold'\)\)/);
  assert.match(sql, /review_cards: appended by the checkpoint\/review agent/);
});

test('the lesson service writes the program_progress key the course percent already reads', () => {
  // Read rather than import: the service pulls in the Supabase client, which
  // needs the Vite env this runner does not have.
  const src = read('src/services/lessonService.js');
  assert.match(src, /programKeyFor = \(level\) =>/);
  assert.match(src, /replace\(\/\\\.\/g, ''\)\}_course/, 'the program_key must stay <level without dot>_course');
  assert.match(src, /setProgramItemDone\(userId, programKeyFor\(lvl\), lektionId, true\)/, 'completion must still tick program_progress');
  assert.match(src, /from\('lesson_progress'\)/);
  assert.match(src, /from\('lesson_attempts'\)/);
  assert.match(src, /from\('words'\)/);
});

test('the fixture matches the contract shape the curriculum author is writing to', () => {
  assert.ok(FIXTURE_LEKTION.wortfeld.length >= 15 && FIXTURE_LEKTION.wortfeld.length <= 25);
  assert.ok(FIXTURE_LEKTION.dialog.lines.length >= 6 && FIXTURE_LEKTION.dialog.lines.length <= 10);
  for (const l of FIXTURE_LEKTION.dialog.lines) {
    assert.ok(l.de.split(/\s+/).length <= 12, `dialogue line too long: ${l.de}`);
    assert.ok(l.speaker && l.en);
  }
  assert.equal(FIXTURE_LEKTION.notice.bodyDe.split(/\s+/).length <= 60, true);
  assert.equal(FIXTURE_LEKTION.notice.examples.length, 2);
  for (const ex of FIXTURE_LEKTION.notice.examples) {
    const needle = ex.replace(/[.?!]$/, '').toLowerCase();
    assert.ok(FIXTURE_LEKTION.dialog.lines.some((l) => l.de.toLowerCase().includes(needle)), `${ex} is not in the dialogue`);
  }
});
