// Guard suite for the lesson engine (docs/course-standard-2026-09-12.md §3,
// docs/course-factory/a11-rebuild/CONTRACT.md "Engine rules"). Pins the stage
// order, the shape of the controlled-practice draw, its determinism, the
// requeue rule, the mastery thresholds and the checkAnswer integration —
// the six things a later edit is most likely to break quietly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import buildLesson, {
  pickPracticeItems, planPractice, practiceReport, seedFor, isTypedItem, isMultipleChoice, itemLemmas, answerLemmas,
  answerKey, taskShape, answerWords, promptWords, leaksAnswer,
  PRACTICE_SIZE, MAX_MULTIPLE_CHOICE, PRIMARY_MIN, MAX_SAME_LEMMA, MAX_CARRIED_LEMMA, MAX_SAME_ANSWER_KEY,
  MAX_SAME_TASK_SHAPE, attemptFromCompletions, ATTEMPT_CYCLE, SITUATION_MIN, wortfeldTerms, relevanceScore,
} from '../src/lib/lesson/buildLesson.js';
import { exclusionReason, isUsableItem, filterPool, EXCLUDE_IDS, REASON, drillsSlug } from '../src/data/lessonPools/quality.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { requeueFor, REQUEUE_CAP } from '../src/lib/lesson/requeue.js';
import { firstAttemptAccuracy, masteryStatus, masteryLabel, accuracyPercent, GOLD_THRESHOLD, nextReviewDate } from '../src/lib/lesson/mastery.js';
import { checkAnswer, RESULT, STRICT_TOPIC, STRICT_MAX_SPACES, strictApplies, normalizeDictation, tagError } from '../src/lib/lesson/check.js';
import { scoreWriting, leitpunktKeyword } from '../src/lib/lesson/writing.js';
import { FIXTURE_LEKTION, FIXTURE_CURRICULUM } from './fixtures/lektion-fixture.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const POOL = JSON.parse(read('src/data/lessonPools/a11.json'));
/** A second parse: a distinct object, so the plan cache cannot fake determinism. */
const POOL_COPY = JSON.parse(read('src/data/lessonPools/a11.json'));
/** The A1.2 pool, built by `node scripts/build-lesson-pool.mjs a1.2` from the same rules. */
const POOL_A12 = JSON.parse(read('src/data/lessonPools/a12.json'));
const LEKTIONEN = CURRICULUM_A11.lektionen;

/**
 * EVERY attempt of the cycle, derived from `ATTEMPT_CYCLE` and never written out.
 *
 * DaF review #10 MAJOR 2: round 10 lengthened the cycle to three draws and left the guards on
 * `[1, 2]`. What attempt 3 then delivered, unwatched: L6 gave seven of seven seats to one article
 * template with `eine` three times, L4 said `kostet` five times, four Lektionen broke the
 * Mädchen rule, and the overlap test never looked at the pair 3→1 — which is as consecutive in
 * 1 → 2 → 3 → 1 as the two pairs it did check, and where L8 shared five of seven. A literal
 * attempt list is the bug; `ATTEMPTS` is the fix, and the source test below forbids the literal
 * coming back.
 */
const ATTEMPTS = Array.from({ length: ATTEMPT_CYCLE }, (_, i) => i + 1);
/** The consecutive pairs of the CYCLE, wrap included: 1→2, 2→3 and 3→1. */
const ATTEMPT_PAIRS = ATTEMPTS.map((_, i) => [i, (i + 1) % ATTEMPTS.length]);

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

  // and the whole lesson build agrees with the plan, which is what it now reads
  const built = build().stages.find((s) => s.key === 'practice').items.map((i) => i.id);
  const planned = planPractice(FIXTURE_CURRICULUM, POOL, 1).get(FIXTURE_LEKTION.nr).map((i) => i.id);
  assert.deepEqual(built, planned);
});

// --- pool quality: what a learner may never be shown ----------------------

test('the shipped pool is clean: nothing in it trips a quality rule', () => {
  const { excluded } = filterPool(POOL.items);
  assert.deepEqual(excluded, [], `a11.json still carries ${excluded.length} excluded items — re-run scripts/build-lesson-pool.mjs`);
});

test('the shipped A1.2 pool is clean, measured at its own level', () => {
  // At level a1.2, because three of quality.js's reasons are level-scoped
  // (ORDINAL_NUMBER, MONTH_NAME, UNTAUGHT_TIME_EXCEPTION apply to a1.1's
  // syllabus only) — calling filterPool without the level would drop A1.2 items
  // for teaching exactly what A1.2 is there to teach.
  const { excluded } = filterPool(POOL_A12.items, { level: 'a1.2' });
  assert.deepEqual(excluded, [], `a12.json still carries ${excluded.length} excluded items — re-run scripts/build-lesson-pool.mjs a1.2`);
});

test('the English respellings and English meta items are gone for good', () => {
  for (const item of POOL.items) {
    assert.doesNotMatch(item.questionDe, /klingt wie/i, `${item.id} is an English respelling`);
    assert.doesNotMatch(item.questionDe, /\b[A-Z]{2,}[a-z]*-[A-Za-z]+\b/, `${item.id} spells German in English syllables`);
    const english = [item.answer, ...(item.options || [])].join(' ');
    assert.doesNotMatch(english, /\bLike English\b|\bending overrides\b|\balways safe\b/i, `${item.id} answers in English`);
  }
  // the five items the review names by quotation
  const stems = POOL.items.map((i) => i.questionDe);
  for (const gone of ['HOY-tuh', 'SHoo-leh', 'Es klingt wie', 'I am hungry', 'my key']) {
    assert.ok(!stems.some((q) => q.includes(gone)), `"${gone}" is still in the pool`);
  }
});

test('an item that expects kein/keine without a negation cue is excluded — the L9 BLOCKER', () => {
  const trap = { id: 'x', questionDe: 'Das ist ___ Uhr.', answer: 'keine', options: null };
  assert.equal(exclusionReason(trap), REASON.NEGATION_WITHOUT_CUE);
  // with a cue in the prompt the very same answer is a fair item again
  assert.equal(exclusionReason({ ...trap, questionDe: 'Verneine: Das ist ___ Uhr.' }), null);
  // and the hand-flagged id can never come back, whatever the rules do
  for (const id of Object.keys(EXCLUDE_IDS)) {
    assert.equal(exclusionReason({ id, questionDe: 'harmlos', answer: 'gut' }), REASON.HAND_FLAGGED);
    assert.ok(!POOL.items.some((i) => i.id === id), `${id} is still shipped`);
  }
});

test('the English rules read words, not letters — a spelled-out German word stays in', () => {
  assert.equal(exclusionReason({ id: 'a', questionDe: 'Buchstabiert: B-I-T-T-E. Schreib das Wort: ___', answer: 'Bitte' }), null);
  assert.equal(exclusionReason({ id: 'b', questionDe: 'Wie klingt "ie" in "die"?', answer: 'Like EE' }), REASON.ENGLISH_RESPELLING);
  assert.equal(exclusionReason({ id: 'c', questionDe: "Wie sagt man 'my key' auf Deutsch?", answer: 'mein Schlüssel' }), REASON.ENGLISH_PROMPT);
  assert.equal(exclusionReason({ id: 'd', questionDe: 'Warum kein Artikel?', options: ['You forgot it'], answer: 'You forgot it' }), REASON.ENGLISH_ANSWER);
});

test('Lektion 1 — the free lesson — is seven German items, mostly buchstabieren', () => {
  const items = planPractice(CURRICULUM_A11, POOL, 1).get(1);
  assert.equal(items.length, PRACTICE_SIZE);
  for (const it of items) {
    assert.equal(it.topic, 'alphabet-pronunciation');
    assert.ok(isUsableItem(it));
    // German prompt, German answer — the point of the round-1 blocker fix. The
    // hand-authored L1 items also drill the greetings of the Lektion, so the
    // floor is a majority of spelling items rather than all seven.
    assert.doesNotMatch(`${it.questionDe} ${it.answer}`, /\b(the|you|your|is|are|sound|like)\b/i, `${it.id} has English in a German field`);
  }
  const spelling = items.filter((it) => /Buchstab|Schreibweise/.test(it.questionDe));
  assert.ok(spelling.length >= 4, `only ${spelling.length} of 7 L1 items are about spelling`);
});

// --- the plan across all twelve Lektionen ---------------------------------

test('every Lektion gets seven items and at least four of them from its own grammar point', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  for (const lektion of LEKTIONEN) {
    const items = plan.get(lektion.nr);
    assert.equal(items.length, PRACTICE_SIZE, `L${lektion.nr} drew ${items.length}`);
    const primary = items.filter((i) => i.topic === lektion.primarySlug).length;
    assert.ok(primary >= PRIMARY_MIN, `L${lektion.nr} (${lektion.primarySlug}) drew only ${primary} on its own slug`);
    assert.ok(items.filter(isTypedItem).length >= lektion.practiceRule.typedMin, `L${lektion.nr} is below typedMin`);
    assert.ok(items.filter(isMultipleChoice).length <= MAX_MULTIPLE_CHOICE, `L${lektion.nr} has too many MC`);
    for (const it of items) assert.ok(lektion.practiceRule.topics.includes(it.topic), `L${lektion.nr}: ${it.topic} is off-topic`);
  }
});

test('every Lektion really drills its own grammar point — content, not label', () => {
  // REVIEW #3's systemic finding: `topic` is a ROUTING label. The test above
  // counts the label the item carries, so "≥ 4 of 7 on the Lektion's own
  // grammar point" was nominally true in L3, L4 and L11 while really 3 of 7 —
  // two of those three items conjugated a verb on a pronoun Lektion, three more
  // put a non-separable verb in the Satzklammer Lektion. `drillsSlug` reads what
  // the item makes the learner produce instead, and the table below is the real
  // figure. A Lektion under PRIMARY_MIN here is a MIS-TAGGING bug: the items are
  // fine, they are filed in the wrong topic and drawn into the wrong Lektion.
  //
  // REVIEW #4 MAJOR tightened three of the predicates, because the instrument
  // itself was lifting two Lektionen over the floor it was built to expose:
  //   * `nouns-gender` no longer counts an answer that merely STARTS with
  //     der/die/das, so "Korrigieren Sie: „Das ist eine Tisch.“" → "Das ist ein
  //     Tisch." stops counting as a gender drill (it drills ein/eine, the slug
  //     of Lektion 6). Without it Lektion 4 stood at 4 of 7; with it, at 3.
  //   * `yes-no-questions` no longer counts a gap at position 1 in front of a
  //     question mark. "___ du eine Fahrkarte für morgen? (haben)" → Hast GIVES
  //     the inversion and asks for a verb form; five of Lektion 10's drawn seven
  //     were that shape, so the slug measured 7 of 7 while the learner produced
  //     the word order at most twice.
  //   * `possessive-articles` now counts a multi-word answer containing a
  //     possessive ("Wir feiern unser Fest."), which the whole-string regex
  //     missed — the instrument was wrong in both directions.
  // REVIEW #5 MAJOR 1 tightened `yes-no-questions` for the third time, and this
  // is the one that bites: the two surviving clauses counted items where the
  // QUESTION FORM IS GIVEN. "Korrigieren Sie: „Sind der Bahnhof weit?“" → "Ist
  // der Bahnhof weit?" is subject-verb agreement inside a question the prompt
  // already prints, and "asked for a Frage by name" matched every prompt of the
  // Lektion. An item now counts only when the learner PUTS the finite verb in
  // first position — he types the whole question from a cue list or a statement
  // (so the answer ends in `?` and the prompt contains none), or he picks
  // Ja/Nein. Measured afterwards, both attempts: Lektion 10 is 2 of 7, not 4.
  //
  // The floor is unchanged and deliberately so: this test is the honest number,
  // and a Lektion below it is a finding, not a reason to loosen the predicate.
  // A failure here names the drawn items that do NOT produce the grammar point,
  // because that list is the work order for the item author: two producers.
  //
  // ROUND 10 extended the loop from two attempts to all three. The cycle is
  // `ATTEMPT_CYCLE` long (1 → 2 → 3 → 1), attempt n may not repeat what n−1 and
  // n−2 drew, and the third draw is therefore the one the pool has to be DEEP
  // enough for: measured on the round-9 pool, L3 drilled its own slug 0 of 7
  // times on attempt 3, L10 2, L2 and L9 3 — none of it visible while the test
  // stopped at attempt 2. Three attempts need twelve fresh real producers per
  // Lektion; the repair is items (a11.extra.json), never a lower floor.
  const failures = [];
  const rows = [];
  for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      const items = plan.get(lektion.nr);
      const real = items.filter((i) => drillsSlug(i, lektion.primarySlug));
      rows.push(
        `attempt ${attempt}  L${String(lektion.nr).padStart(2)} ${lektion.primarySlug.padEnd(24)}` +
        ` ${real.length}/7 real · ${items.filter((i) => i.topic === lektion.primarySlug).length}/7 by label`,
      );
      for (const it of items.filter((i) => i.topic === lektion.primarySlug && !drillsSlug(i, lektion.primarySlug))) {
        rows.push(`             ✗ ${it.id.slice(0, 8)} ${it.questionDe.replace(/\s+/g, ' ').slice(0, 62)} → ${it.answer}`);
      }
      if (real.length < PRIMARY_MIN) {
        const misses = items
          .filter((i) => !drillsSlug(i, lektion.primarySlug))
          .map((i) => `        ✗ ${i.id} [${i.type}] ${i.questionDe.replace(/\s+/g, ' ').slice(0, 60)} → ${i.answer}`);
        failures.push(
          `L${lektion.nr} (${lektion.primarySlug}) attempt ${attempt}: only ${real.length} of 7 really drill it` +
          ` — ${PRIMARY_MIN - real.length} producer item(s) missing:\n${misses.join('\n')}`,
        );
      }
    }
  }
  console.log(`\n${rows.join('\n')}\n`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('no item is drawn twice in the whole level — the eight verbatim repeats are gone', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  const seen = new Map();
  for (const lektion of LEKTIONEN) {
    for (const it of plan.get(lektion.nr)) {
      assert.ok(!seen.has(it.id), `${it.id} is drawn by L${seen.get(it.id)} AND L${lektion.nr}`);
      seen.set(it.id, lektion.nr);
    }
  }
});

/**
 * How many BLOCKS — Lektion × attempt, all 36 of them since DaF review #10 MAJOR 2 — may draw a
 * seven the caps could not fully honour — i.e. whose
 * report says the ladder had to relax (`relaxUsed` ≥ 2). It is a CONTENT number, not an engine
 * one: at that stage the engine has already tried `PICK_RETRIES` seeded orders and the eligible
 * slice holds no legal seven at all.
 *
 * 0 → 1 in round 10, when the `minLektion` filter took L4's two price items out of reach (`Kaffee`
 * and `kocht` are L9 Wortfeld, `Wein` is never taught before L4 either). What was left was 18 items
 * of which nine say `kostet` and nine say `Euro`, and an exhaustive search over that slice showed no
 * seven exists that keeps `kostet` under `MAX_SAME_LEMMA` AND every task shape distinct — so the
 * draw took a third `kostet` rather than a repeated task shape.
 *
 * BACK TO 0 later in round 10, by content and not by a looser cap: `extra-a11-l04-19/20/21` make
 * the learner produce an article with a noun and NO price („Hier ist ___ Tisch.“, „___ Rucksack ist
 * gut.“, „___ Tische sind alt.“), each in a task shape L4 did not already use, and L4 now fills
 * seven with every cap honoured (`relaxUsed` 0). It may never be raised.
 *
 * ROUND 11 re-measured it over ALL THREE attempts and against the task-shape key of MAJOR 1, which
 * is coarser than the one round 10 measured with. The two together took five blocks below the caps
 * (L1 attempt 3, L4 attempts 2 and 3, L6 attempts 2 and 3, L8 attempts 2 and 3 — `relaxUsed` 2 or
 * 3, `kostet` ×3, `artikel` ×4, the answer key `die` ×3). It is 0 again, and again by content: 54
 * hand items in task shapes their Lektion did not already own. The number is only ever to be
 * lowered by items, never raised by a softer cap — and it now covers every draw a learner gets,
 * not only the first of them.
 */
const MAX_CAP_STARVED_LEKTIONEN = 0;

test('no lemma carries more than two items in one Lektion — the Mädchen rule, every attempt', () => {
  // DaF review #10 MAJOR 2(a): the rule used to be checked on `planPractice(…, 1)` alone, and only
  // there was it true — attempt 3 broke it in four Lektionen (L1 `lesen`/`buchstaben` ×5, L4
  // `kostet` ×5, L6 `artikel` ×7, L8) while the ratchet meant to report it read the same plan 1.
  // It walks the whole cycle now, so a block is a block whichever draw a learner is on.
  const lektionenPerLemma = new Map();
  const starved = [];
  for (const attempt of ATTEMPTS) {
  const plan = planPractice(CURRICULUM_A11, POOL, attempt);
  const report = practiceReport(plan);
  for (const lektion of LEKTIONEN) {
    const count = new Map();
    for (const it of plan.get(lektion.nr)) {
      for (const lemma of itemLemmas(it)) count.set(lemma, (count.get(lemma) || 0) + 1);
    }
    // A Lektion whose slice cannot honour every cap at once is a CONTENT shortage and is counted,
    // by name, under its own ratchet below — never quietly excused item by item. Every other
    // Lektion must obey the cap, which is where an engine bug would show.
    const relaxed = (report.get(lektion.nr) || {}).relaxUsed >= 2;
    const over = [...count].filter(([, n]) => n > MAX_SAME_LEMMA);
    if (over.length && relaxed) {
      starved.push(`attempt ${attempt} L${lektion.nr} (${lektion.primarySlug}): ` +
        `${over.map(([l, n]) => `"${l}" ×${n}`).join(', ')}` +
        ` — only ${(report.get(lektion.nr) || {}).eligible} eligible items`);
    }
    for (const [lemma, n] of count) {
      assert.ok(n <= MAX_SAME_LEMMA || relaxed, `L${lektion.nr} attempt ${attempt} drills "${lemma}" ${n} times`);
      if (attempt === 1) lektionenPerLemma.set(lemma, (lektionenPerLemma.get(lemma) || 0) + 1);
    }
  }
  }
  assert.ok(
    starved.length <= MAX_CAP_STARVED_LEKTIONEN,
    `${starved.length} Lektionen cannot fill seven under the caps (ratchet ${MAX_CAP_STARVED_LEKTIONEN}):\n  - ${starved.join('\n  - ')}`,
  );
  assert.ok((lektionenPerLemma.get('mädchen') || 0) <= 2, 'das Mädchen is back in more than two Lektionen');
});

test('no answer key carries more than two items in one Lektion — the "mein" rule', () => {
  // The second diversity axis (DaF review #6 MAJOR 6). `MAX_SAME_LEMMA` reads
  // `itemLemmas`, which drops every article and possessive through
  // `LEMMA_STOPWORDS` — so in the three Lektionen whose grammar IS the
  // determiner it capped nothing at all: L12 gave five of seven items to `mein`
  // in BOTH attempts. `answerKey` counts what the learner PRODUCES instead, and
  // this walks all twelve Lektionen on both attempts of the shipped pool.
  const rows = [];
  for (const attempt of ATTEMPTS) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      const count = new Map();
      for (const it of plan.get(lektion.nr)) {
        const key = answerKey(it);
        if (key) count.set(key, (count.get(key) || 0) + 1);
      }
      for (const [key, n] of count) {
        if (n > MAX_SAME_ANSWER_KEY) {
          const ids = plan.get(lektion.nr).filter((it) => answerKey(it) === key).map((it) => `${it.id} → ${it.answer}`);
          rows.push(`attempt ${attempt} L${lektion.nr} makes the learner produce "${key}" ${n} times:\n    ${ids.join('\n    ')}`);
        }
      }
    }
  }
  assert.deepEqual(rows, [], rows.join('\n'));
});

test('taskShape reads the task, not the wording — the same exercise under two formulas is one key', () => {
  // The unit behind the cap below (DaF review #7 MAJOR 5). Two error corrections
  // that differ only in the profession are ONE task: same skeleton, same rule,
  // an answer that removes the same article. `answerKey` cannot see it, because
  // it compares the content lemmas of the answer and `lehrerin` ≠ `verkäuferin`.
  // The pair is an inline fixture: the shipped Verkäuferin twin (extra-a11-l06-09)
  // was rewritten into a fill-blank in round 8 precisely so the pool no longer
  // carries the duplicate — the pool test further down pins THAT; this one pins
  // the axis that would catch the next such pair.
  const lehrerin = POOL.items.find((it) => it.id === '1ed2c78f-8f65-52e3-9e63-97f2a5b0663b');
  assert.ok(lehrerin, 'the Lehrerin correction the review measured is no longer in the pool');
  const verkaeuferin = {
    ...lehrerin,
    id: 'fixture-verkaeuferin',
    questionDe: 'Korrigieren Sie den Fehler: "Ich bin eine Verkäuferin."',
    answer: 'Ich bin Verkäuferin.',
    accepted: ['Ich bin Verkäuferin.'],
  };
  assert.notEqual(answerKey(lehrerin), answerKey(verkaeuferin), 'answerKey is supposed to miss this pair');
  assert.equal(
    taskShape(lehrerin), taskShape(verkaeuferin),
    'the two Beruf corrections must collapse to one shape — the task formula around them differs, the task does not',
  );

  // and it stays coarse without becoming blind: a different skeleton, a
  // different gap position or a different item type are different shapes.
  const shape = (q, type = 'fill_blank') => taskShape({ type, questionDe: q });
  assert.notEqual(shape('Das ist ___ Stuhl.'), shape('Ich brauche ___ Handy.'));
  assert.notEqual(shape('___ Frau arbeitet hier.'), shape('Die Frau arbeitet ___.'));
  assert.notEqual(shape('Das ist ___ Stuhl.'), shape('Das ist ___ Stuhl.', 'multiple_choice'));
  // the same skeleton with another CONTENT word is the same shape — the point,
  // and the whole of DaF review #9 MAJOR 2. The mask used to be bound to word
  // LENGTH (six letters), so `uhr`, `stuhl`, `regal`, `preis`, `buch` stayed in
  // the key: "___ Uhr ist alt. (der, die oder das?)" and "___ Stuhl ist alt.
  // (der, die oder das?)" counted as two different task shapes, the cap bound in
  // NONE of the 24 blocks, and L4 drew four items of one frame in both attempts
  // while the guard reported seven distinct shapes. The mask is bound to word
  // CLASS now: the gap, the function words and the bracketed instruction are the
  // skeleton, every content word is a `·`.
  assert.equal(shape('Das ist ___ Computer.'), shape('Das ist ___ Fahrkarte.'));
  assert.equal(
    shape('___ Uhr ist alt. (der, die oder das?)'),
    shape('___ Stuhl ist alt. (der, die oder das?)'),
    'a short noun must not make two items of one frame look like two tasks',
  );
  assert.equal(shape('___ Regal ist alt. (der, die oder das?)'), shape('___ Uhr ist alt. (der, die oder das?)'));
  // …and the instruction in the brackets still separates two questions about
  // the same frame, because those really are two tasks.
  assert.notEqual(
    shape('___ Uhr ist alt. (der, die oder das?)'),
    shape('___ Uhr ist alt. (bestimmter Artikel)'),
  );
});

/**
 * The five L1 items DaF review #10 MAJOR 1(a) drew in ONE seven, verbatim from the shipped pool of
 * round 10. `bare()` cut at the first task formula, the spelled word was left behind, every letter
 * became its own `·` — so the LENGTH of the answer word decided whether two letter-for-letter
 * identical prompts were one task, and the cap reported 7/7 distinct while the learner filled the
 * same sentence five times in a row.
 */
const SPELLED_PROBES = [
  'Lesen Sie die Buchstaben: T-S-C-H-Ü-S-S. Schreiben Sie das Wort: ___',
  'Lesen Sie die Buchstaben: B-U-C-H-S-T-A-B-I-E-R-E-N. Schreiben Sie das Wort: ___',
  'Lesen Sie die Buchstaben: B-U-C-H-S-T-A-B-E. Schreiben Sie das Wort: ___',
  'Lesen Sie die Buchstaben: G-R-U-ß. Schreiben Sie das Wort: ___',
  'Lesen Sie die Buchstaben: D-A-N-K-E. Schreiben Sie das Wort: ___',
];
/**
 * The six L10 items of round 10 (`extra-a11-l10-17` … `-22`), verbatim as they were written. They
 * are ONE task — a bag of words turned into a yes/no question — and differed in nothing but the
 * wording of the bracket, which `TASK_WORDS` and `LEMMA_STOPWORDS` left standing in the key. L10
 * drew five of the six into one seven, twice. They have since been rewritten into two other tasks,
 * so they are kept HERE as the counter-probe: a guard that does not pass its own counter-probe is
 * not a rule, and this one is measured, not invented.
 */
const BRACKET_PROBES = [
  '[essen / ihr / im Zug] (Das Verb steht zuerst.)',
  '[haben / Sie / eine Fahrkarte] (höflich mit Sie)',
  '[kommen / der Fahrer / morgen] (Beginnen Sie mit dem Verb.)',
  '[fahren / der Bus / nach Deutschland] (Die Stimme steigt am Ende.)',
  '[sein / das Auto / neu] (Zuerst das Verb, dann das Subjekt.)',
  '[haben / ihr / morgen / Zeit] (Das Verb steht vorn.)',
];

test('taskShape counts the TASK, not the letters, the wording or the word count — the three probes', () => {
  const shape = (q, type = 'fill_blank') => taskShape({ type, questionDe: q });

  // (a) a spelled-letter sequence is ONE token. Five identical sentences, one key.
  const spelled = new Set(SPELLED_PROBES.map((q) => shape(q)));
  assert.equal(spelled.size, 1,
    `the five spelled-word items are five task shapes again:\n  ${[...spelled].join('\n  ')}`);

  // (b) the bracket is its CATEGORY, not its wording. Five of the six are the same instruction
  //     (verb first / rising intonation / begin with the verb) on a three-word bag; the sixth
  //     differs only in the bag's length, and a register cue is a different question about the
  //     same frame, which is why `(höflich mit Sie)` is allowed to stay its own shape.
  const bracket = BRACKET_PROBES.map((q) => shape(q, 'sentence_building'));
  assert.equal(new Set(bracket.slice(0, 5).filter((_, i) => i !== 1)).size, 1,
    `the four reworded verb-first items are still more than one shape:\n  ${bracket.join('\n  ')}`);
  assert.equal(shape('[x / y / z] (Das Verb steht zuerst.)'), shape('[a / b / c] (Die Stimme steigt am Ende.)'),
    'a rewording of the same instruction must not buy a second seat');
  assert.notEqual(shape('[x / y / z] (Das Verb steht zuerst.)'), shape('[x / y / z] (höflich mit Sie)'));
  // an unclassified bracket is the GENERIC mark — one for all of them, never a wording
  assert.equal(shape('Das ist ___. (Adjektiv)'), shape('Das ist ___. (etwas ganz anderes)'));

  // (c) a scrambled word list is its LENGTH CLASS, not its words — and not its exact length.
  assert.equal(shape('Bilden Sie den Satz: [der Bus / fahren / heute]', 'sentence_building'),
    shape('Bilden Sie den Satz: [die Uhr / kosten / zwölf Euro]', 'sentence_building'));
  assert.notEqual(shape('Bilden Sie den Satz: [a / b / c]', 'sentence_building'),
    shape('Bilden Sie den Satz: [a / b / c / d / e]', 'sentence_building'));

  // and the adjective is CONTENT even though the lemma stoplist holds it (MAJOR 1(c)):
  // „___ Uhr ist alt.“ and „___ Rucksack ist teuer.“ are one frame, not two.
  assert.equal(shape('___ Uhr ist alt. (der, die oder das?)'), shape('___ Rucksack ist teuer. (der, die oder das?)'));
  assert.equal(shape('___ Rucksack ist gut. (der, die oder das?)'), shape('___ Regal ist neu. (der, die oder das?)'));
});

test('the guards walk EVERY attempt of the cycle — the literal [1, 2] may not come back', () => {
  // DaF review #10 MAJOR 2. Round 10 lengthened `ATTEMPT_CYCLE` to 3 and left five guards looping
  // over a hard-written two-element attempt list; everything the third draw did — seven seats to one
  // article template in L6, `kostet` five times in L4, five of seven repeated across the wrap pair
  // in L8 — happened where no test looked. The literal list IS the bug, so it is banned in the
  // source rather than corrected once.
  const src = read('tests/lesson-engine.test.mjs');
  assert.doesNotMatch(src, /of \[1, ?2\]\)/, 'a guard walks only attempts 1 and 2 again — use ATTEMPTS');
  assert.doesNotMatch(src, /\[\[0, ?1\], ?\[1, ?2\]\]/, 'the overlap test skips the wrap pair again — use ATTEMPT_PAIRS');
  assert.deepEqual(ATTEMPTS, [1, 2, 3]);
  assert.deepEqual(ATTEMPT_PAIRS, [[0, 1], [1, 2], [2, 0]], 'the cycle wraps, so 3→1 is a consecutive pair');
});

/**
 * The four pairs DaF review #11 MAJOR 2 measured word for word, kept as the counter-probe of the
 * leak rule. Three of them are gone from the shipped draw since the sixth axis went into `fits()`;
 * they stay HERE because a guard that does not catch the finding it was written for is not a rule.
 * Every pair must be reported in the direction the review printed it — and the L1 pair in BOTH.
 */
const ANSWER_LEAK_PROBES = [
  {
    why: 'L11 attempt 1: the gap and the word bag whose solution is that very sentence',
    solved: { answer: 'Kommst du am Freitag mit?' },
    prints: { questionDe: 'Kommst du am Freitag ___? (mitkommen)' },
  },
  {
    why: 'L1 attempt 2, forwards: the spelled letters print the word the learner must write',
    solved: { answer: 'Willkommen' },
    prints: { questionDe: 'Wie buchstabiert man Willkommen? ___' },
  },
  {
    why: 'L1 attempt 2, backwards: the mutual pair is a leak whichever item comes first',
    solved: { answer: 'W-I-L-L-K-O-M-M-E-N' },
    prints: { questionDe: 'Lesen Sie die Buchstaben: W-I-L-L-K-O-M-M-E-N. Schreiben Sie das Wort: ___' },
  },
  {
    why: 'L11 attempt 3: the participle stands in the word bag next to the gap that asks for it',
    solved: { answer: 'gearbeitet' },
    prints: { questionDe: 'Bilden Sie den Satz: [ich / haben / gestern / gearbeitet]' },
  },
  {
    why: 'L6 attempt 3: the article the gap asks for is printed in the sentence to correct',
    solved: { answer: 'einen' },
    prints: { questionDe: 'Korrigieren Sie: „Ich brauche einen Pause.“' },
  },
];

/** Every pair of one block in which one item's whole production is printed by another's prompt. */
const leaksIn = (items) => {
  const out = [];
  for (const solved of items) {
    for (const prints of items) {
      if (solved.id === prints.id) continue;
      if (leaksAnswer(solved, prints)) {
        out.push(`${solved.id} (→ ${solved.answer}) is printed by ${prints.id} („${String(prints.questionDe).replace(/\s+/g, ' ')}“)`);
      }
    }
  }
  return out;
};

test('the leak rule catches every pair the review measured — and lets a partial overlap through', () => {
  // DaF review #11 MAJOR 2. The four measured pairs, plus the L6 one, must all be reported.
  const missed = ANSWER_LEAK_PROBES.filter((p) => !leaksAnswer(p.solved, p.prints)).map((p) => p.why);
  assert.deepEqual(missed, [], `the leak rule no longer sees:\n  - ${missed.join('\n  - ')}`);

  // …and it is not a blanket ban on a shared word. The review names the case that must stay legal:
  // an item that produces a whole sentence containing `Donnerstag` does not solve „Nach Donnerstag
  // kommt ___.“, because only PART of its production is printed.
  assert.equal(
    leaksAnswer({ answer: 'Der Kurs ist am Donnerstag.' }, { questionDe: 'Nach Donnerstag kommt ___.' }),
    false,
    'a single shared word is not a leak',
  );
  // the bracketed cue names the task and never gives the sentence away
  assert.equal(leaksAnswer({ answer: 'mitkommen' }, { questionDe: 'Kommst du am Freitag ___? (mitkommen)' }), false);
  // a different FORM of the word is still work: the participle does not print the present tense
  assert.equal(leaksAnswer({ answer: 'arbeite' }, { questionDe: 'Bilden Sie den Satz: [ich / haben / gestern / gearbeitet]' }), false);
  // an inflection of the word IS printed: „brauchen“ in a word bag prints „brauche“
  assert.equal(
    leaksAnswer({ answer: 'Ich brauche ein Telefon.' }, { questionDe: 'Bilden Sie den Satz: [der Chef / brauchen / ein / Telefon]' }),
    true,
  );
  // the accepted variants count too — any form the checker would take is an answer
  assert.equal(
    leaksAnswer({ answer: 'Die Uhr ist alt.', accepted: ['Die Uhr ist alt.', 'Das Regal ist alt.'] }, { questionDe: 'Das Regal ist alt. Und die Uhr?' }),
    true,
  );
  // the units underneath, so a failure says which half moved
  assert.deepEqual([...answerWords({ answer: 'Ich bin Lehrer.' })], ['lehrer']);
  assert.ok(promptWords({ questionDe: 'Hier ist ___ Schere. (bestimmter Artikel)' }).has('schere'));
  assert.ok(!promptWords({ questionDe: 'Hier ist ___ Schere. (bestimmter Artikel)' }).has('bestimmter'));
});

test('NO BLOCK PRINTS ITS OWN ANSWERS — the leak rule over all 36 blocks', () => {
  // DaF review #11 MAJOR 2 measured 17 pairs in 11 of the 36 blocks: the learner read the solution
  // of one task in the prompt of another of the same seven — a mutual inverse pair in L1 attempt 2,
  // the „Kommst du am Freitag mit?“ pair in L11 attempt 1. The engine had five diversity axes and
  // none that asked whether the answer had already been printed. It is the sixth, in `fits()`, and
  // it is relaxed LAST of all (after the task-shape cap), so a leak here is not an unlucky order:
  // it means the eligible slice holds no legal seven at all, which is a POOL finding — add items,
  // never loosen this.
  const rows = [];
  for (const attempt of ATTEMPTS) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      for (const leak of leaksIn(plan.get(lektion.nr))) {
        rows.push(`attempt ${attempt} L${lektion.nr}: ${leak}`);
      }
    }
  }
  assert.deepEqual(rows, [], `${rows.length} answer(s) printed in a sibling prompt:\n  - ${rows.join('\n  - ')}`);
});

/**
 * How many of the 36 blocks may report `practiceReport().complete === false` — i.e. fill seven but
 * NOT reach `PRIMARY_MIN` items labelled with the Lektion's own slug.
 *
 * DaF review #11 MAJOR 1(b): the engine has written this flag since round 9 and nobody read it. A
 * `grep` over `tests/` and `scripts/` found zero readers — every guard watched `relaxUsed`, which
 * is 0 in exactly these blocks, because the block DOES fill seven; it fills it with the neighbour
 * Lektion's material. L5 („Im Klassenzimmer“) reported `complete: false` on attempts 2 and 3 and
 * served the flea market of L4 while `MAX_CAP_STARVED_LEKTIONEN = 0` stood green.
 *
 * 2 → 1 with the bracket fix of MAJOR 1(a): attempts 1 and 2 of L5 are complete again, and the
 * review's own counterfactual is reproduced. The ONE that remained was attempt 3 of L5 and it was a
 * measured CONTENT shortage the review predicted in the same paragraph („Versuch 3 bleibt auch dann
 * dünn — das ist dann ein echter Inhaltsmangel und keine Kappe“): of the 17 `definite-articles`
 * items L5 could serve, attempts 1 and 2 used eleven, and the six left over were ALL the one frame
 * „___ Nomen ist Adjektiv. (bestimmter Artikel)“ (`extra-a11-l05-01/-04/-05/-07/-13/-16`), so
 * `MAX_SAME_TASK_SHAPE` seated exactly one of them. No draw could repair that.
 *
 * 1 → 0 (round 12) by the review's fourth point, i.e. by SUPPLY: `extra-a11-l05-17`…`-24` are eight
 * `definite-articles` items out of L5's own Kursraum-Wortfeld in eight task shapes L5 did not own
 * (the indefinite→definite pair, „Wie ist ___ Tür?“, „Ist ___ Lineal hier?“, two article
 * corrections whose answer is a whole sentence, a two-noun frame, a quoted question and a Zimmer
 * frame). Attempt 3 now seats five items on its own slug instead of one, and its Wortfeld share
 * rose 2/7 → 5/7. This number only ever goes down by items, never by a softer rule.
 *
 * ANY block that turns up here now is a fresh finding and is meant to fail this test: it says the
 * seven was filled with a neighbour Lektion's material, which no `relaxUsed` and no cap reports.
 */
const MAX_OFF_PRIMARY_BLOCKS = 0;

test('EVERY BLOCK FILLS SEVEN WITH ITS OWN GRAMMAR — practiceReport is read, all 36 blocks', () => {
  const relaxed = [];
  const offPrimary = [];
  for (const attempt of ATTEMPTS) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    const report = practiceReport(plan);
    for (const lektion of LEKTIONEN) {
      const r = report.get(lektion.nr) || {};
      const items = plan.get(lektion.nr);
      const byLabel = items.filter((it) => it.topic === lektion.primarySlug).length;
      if (r.relaxUsed > 0) {
        relaxed.push(`attempt ${attempt} L${lektion.nr} (${lektion.primarySlug}): relaxUsed ${r.relaxUsed}, ${r.eligible} eligible items`);
      }
      if (r.complete === false) {
        offPrimary.push(
          `attempt ${attempt} L${lektion.nr} (${lektion.primarySlug}): only ${byLabel} of ${PRACTICE_SIZE} items` +
          ` carry its own slug (PRIMARY_MIN ${PRIMARY_MIN}), ${r.eligible} eligible:\n    ` +
          items.map((it) => `[${it.topic}] ${it.id} · ${String(it.questionDe).replace(/\s+/g, ' ')} → ${it.answer}`).join('\n    '),
        );
      }
    }
  }
  // A cap that had to be given up is an engine finding and is never tolerated.
  assert.deepEqual(relaxed, [], `${relaxed.length} block(s) could not honour their caps:\n  - ${relaxed.join('\n  - ')}`);
  assert.ok(
    offPrimary.length <= MAX_OFF_PRIMARY_BLOCKS,
    `${offPrimary.length} block(s) report complete:false (ratchet ${MAX_OFF_PRIMARY_BLOCKS}):\n  - ${offPrimary.join('\n  - ')}`,
  );
});

/**
 * THE SITUATION FLOOR, the half of round 11's MAJOR 1 that was never written (DaF review #12
 * MAJOR 4). `relevanceScore` has SORTED the draw by the Lektion's own Wortfeld since round 9 and
 * nothing ever asked for a minimum — so L7 („Freizeit und Hobbys“) served attempt 3 with two of
 * seven items carrying one of its own words (Tschüss, Berlin, a baby, a brother) while every cap
 * was green, `relaxUsed` was 0 and `MAX_OFF_PRIMARY_BLOCKS = 0` stood true: the block WAS filled
 * with its own grammar, just not with its own situation. The two ratchets are the pair the
 * standard's promise of twelve SITUATIONAL Lektionen needs — one for the grammar share, one for
 * the scene.
 *
 * „Situational“ is measured exactly as `pickPracticeItems` measures it: at least one word of THIS
 * Lektion's Wortfeld in the prompt or the answer (`relevanceScore(it, ownTerms, new Set()) > 0` —
 * an earlier Lektion's vocabulary is revision and does not count).
 *
 * 0 as of round 13 and by the engine, not by items: the fill pass seats situational items before
 * the general fill, under the same caps, without ever taking a seat `PRIMARY_MIN` still needs.
 * Measured on the pool `node scripts/build-lesson-pool.mjs a1.1` produces on 2026-09-13: every one
 * of the 36 blocks reaches four or more, `relaxUsed` stays 0 everywhere, all seven task shapes stay
 * distinct, and L7 attempt 3 goes 2 → 4 (and 5 → 6 on its own slug). A block that turns up here is
 * a CONTENT finding — its Wortfeld has too few items in the pool — and the failure prints the whole
 * 12 × 3 table so the next round can see which Lektion it has to pay for. Lower it with items,
 * never with a smaller floor.
 */
const MAX_OFF_SITUATION_BLOCKS = 0;

/** How many of a block's seven carry a word of the Lektion's OWN Wortfeld. */
const situationalIn = (items, lektion) => {
  const own = wortfeldTerms(lektion);
  return (items || []).filter((it) => relevanceScore(it, own, new Set()) > 0).length;
};

/** The 12 × 3 table the review asked to see in the failure: real/7, situational/7, shapes, relax. */
function practiceTable(planFor) {
  const rows = ['  L  att  own-slug  Wortfeld  shapes  relax'];
  for (const lektion of LEKTIONEN) {
    for (const attempt of ATTEMPTS) {
      const { plan, report } = planFor(attempt);
      const items = plan.get(lektion.nr) || [];
      const own = items.filter((it) => it.topic === lektion.primarySlug).length;
      const shapes = new Set(items.map(taskShape)).size;
      const r = report.get(lektion.nr) || {};
      rows.push(
        `  ${String(lektion.nr).padStart(2)}   ${attempt}     ${own}/${items.length}       ` +
        `${situationalIn(items, lektion)}/${items.length}       ${shapes}       ${r.relaxUsed}`,
      );
    }
  }
  return rows.join('\n');
}

test('EVERY BLOCK IS ABOUT ITS OWN SITUATION — SITUATION_MIN, all 36 blocks', () => {
  const plans = new Map(ATTEMPTS.map((attempt) => {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    return [attempt, { plan, report: practiceReport(plan) }];
  }));
  const thin = [];
  for (const attempt of ATTEMPTS) {
    const { plan, report } = plans.get(attempt);
    for (const lektion of LEKTIONEN) {
      const items = plan.get(lektion.nr);
      const counted = situationalIn(items, lektion);
      const r = report.get(lektion.nr) || {};
      // The engine must REPORT the number it enforced — a guard that recounts a figure the engine
      // does not publish is the failure mode of round 12 (the flag nobody read).
      assert.equal(r.situationCount, counted,
        `attempt ${attempt} L${lektion.nr}: practiceReport says ${r.situationCount}, the draw holds ${counted}`);
      if (counted < SITUATION_MIN) {
        thin.push(
          `attempt ${attempt} L${lektion.nr} (${lektion.thema || lektion.primarySlug}): only ${counted} of ` +
          `${items.length} items carry a word of its own Wortfeld (SITUATION_MIN ${SITUATION_MIN}); ` +
          `the pool offers ${r.situationTarget} situational item(s) to this block — it needs ` +
          `${SITUATION_MIN - counted} more, from ${[...wortfeldTerms(lektion)].slice(0, 8).join(', ')}:\n    ` +
          items.map((it) => `[${it.topic}] ${it.id} · ${String(it.questionDe).replace(/\s+/g, ' ')} → ${it.answer}`).join('\n    '),
        );
      }
    }
  }
  assert.ok(
    thin.length <= MAX_OFF_SITUATION_BLOCKS,
    `${thin.length} block(s) below SITUATION_MIN (ratchet ${MAX_OFF_SITUATION_BLOCKS}):\n  - ${thin.join('\n  - ')}\n\n` +
    `${practiceTable((attempt) => plans.get(attempt))}`,
  );
});

test('the situation fill pass bites — remove it and a block drops below the floor', async () => {
  // A ratchet at 0 proves nothing on its own: it would also be 0 if the pool happened to be
  // situational enough by itself, and round 12 shipped exactly that kind of green (`MAX_OFF_PRIMARY
  // _BLOCKS = 0` while L7 served two of seven from its own Wortfeld). So the engine is loaded a
  // second time with the fill pass CUT OUT of its source, and the same measurement must find the
  // block the review named. The mutation is asserted to apply, or the test would pass on a stale
  // anchor rather than on a working guard.
  const SRC = join(ROOT, 'src/lib/lesson/buildLesson.js');
  const FILL_PASS = `      const stopSituation = () =>
        !seatSituation
        || situationCount() >= situationTarget
        || chosen.size >= PRACTICE_SIZE - primaryReserve();
      const situational = ranked.filter(isSituational);
      fill(situational.filter((it) => it.topic === primarySlug), relax, stopSituation, stage);
      fill(situational, relax, stopSituation, stage);
`;
  const source = readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
  assert.ok(source.includes(FILL_PASS), 'the situation fill pass moved — update this mutation');
  // Relative imports have to survive the move out of the source tree.
  const mutated = source
    .replace(FILL_PASS, '')
    .replace(/from '(\.[^']*)'/g, (_, spec) => `from '${pathToFileURL(resolve(dirname(SRC), spec)).href}'`);
  const file = join(mkdtempSync(join(tmpdir(), 'dm-engine-')), 'buildLesson.mutated.mjs');
  writeFileSync(file, mutated);
  const withoutFloor = await import(pathToFileURL(file).href);

  const dropped = [];
  for (const attempt of ATTEMPTS) {
    const plan = withoutFloor.planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      const counted = situationalIn(plan.get(lektion.nr), lektion);
      if (counted < SITUATION_MIN) dropped.push(`attempt ${attempt} L${lektion.nr}: ${counted}`);
    }
  }
  assert.ok(
    dropped.length > 0,
    'the fill pass changes nothing: every block reaches SITUATION_MIN without it, so this guard is decoration',
  );
});

test('the lemma cap ignores the bracketed instruction — it is the task, not the content', () => {
  // DaF review #11 MAJOR 1(a). `bestimmter` and `artikel` are the cue „(bestimmter Artikel)“, and
  // `MAX_SAME_LEMMA = 2` therefore let a Lektion have two of them: thirteen of the seventeen
  // `definite-articles` items L5 may serve carry exactly that bracket, so from the third one on the
  // Lektion's own grammar was locked out and the block filled up from L4's flea market. The two
  // guards must read the bracket the same way — `taskShape` has collapsed it to its category since
  // round 10 — so the lemma cap does not see it at all. A stoplist of bracket WORDS would have to
  // be extended for every new cue; stripping the bracket is the rule.
  const l5 = { questionDe: '___ Fenster ist hier. (bestimmter Artikel)', answer: 'Das' };
  const lemmas = itemLemmas(l5);
  assert.ok(!lemmas.has('bestimmter'), 'the instruction word is counted as content again');
  assert.ok(!lemmas.has('artikel'), 'the instruction word is counted as content again');
  assert.ok(lemmas.has('fenster'), 'the content of the prompt must still be counted');
  for (const bracket of ['(unbestimmter Artikel)', '(der, die oder das?)', '(höflich mit Sie)', '(sie, Plural)']) {
    assert.equal(itemLemmas({ questionDe: `___ Tisch ist neu. ${bracket}`, answer: 'Der' }).size, 1,
      `„${bracket}“ still leaks words into the lemma count`);
  }
  // and the answer is read as it always was
  assert.ok(itemLemmas({ questionDe: 'Ergänzen Sie: ___ (Artikel)', answer: 'die Schere' }).has('schere'));
});

test('L5 drills the article in every attempt — the Lektion whose grammar IS the bracket', () => {
  // The Lektion the MAJOR was measured on: with the bracket counted as lexis, attempts 2 and 3
  // drew 2 of 7 on `definite-articles` and five items from L4's flea market. Measured on real
  // production (`drillsSlug`), not on the routing label, in every attempt of the cycle.
  for (const attempt of ATTEMPTS) {
    const items = planPractice(CURRICULUM_A11, POOL, attempt).get(5);
    const real = items.filter((it) => drillsSlug(it, 'definite-articles')).length;
    assert.ok(
      real >= PRIMARY_MIN,
      `L5 attempt ${attempt} makes the learner produce a definite article only ${real}/7 times:\n  ` +
      items.map((it) => `[${it.topic}] ${it.id} · ${String(it.questionDe).replace(/\s+/g, ' ')} → ${it.answer}`).join('\n  '),
    );
  }
});

test('no task shape carries more than one item in a Lektion — the Beruf-pair rule', () => {
  // The third diversity axis, walked over all twelve Lektionen and BOTH
  // attempts of the shipped pool, as a class rule and not as the one instance
  // the review caught. The cap is a hard assertion rather than "≥ 6 distinct of
  // 7" on purpose: `MAX_SAME_TASK_SHAPE` is relaxed LAST in pickPracticeItems,
  // so a Lektion exceeding it here means the topic slice could not fill seven
  // under the other caps either — a POOL finding (too few distinct exercises on
  // that slug), to be fixed with items, not by loosening this number.
  const rows = [];
  for (const attempt of ATTEMPTS) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      const items = plan.get(lektion.nr);
      const count = new Map();
      for (const it of items) count.set(taskShape(it), (count.get(taskShape(it)) || 0) + 1);
      for (const [shape, n] of count) {
        if (n <= MAX_SAME_TASK_SHAPE) continue;
        const ids = items.filter((it) => taskShape(it) === shape)
          .map((it) => `${it.id} · ${it.questionDe.replace(/\s+/g, ' ')} → ${it.answer}`);
        rows.push(`attempt ${attempt} L${lektion.nr} draws ${n} items of one shape "${shape}":\n    ${ids.join('\n    ')}`);
      }
    }
  }
  assert.deepEqual(rows, [], rows.join('\n'));
});

test('L6 draws at most one Beruf correction per block — and stays above the floor', () => {
  // The instance: "Ich bin eine Lehrerin." and "Ich bin eine Verkäuferin." were
  // two of L6's seven in BOTH attempts, and neither makes the learner produce
  // an indefinite article (the right answer deletes it), which is why the
  // Lektion that introduces ein/eine sat exactly on PRIMARY_MIN with 4 of 7.
  // Round 8 rewrote the Verkäuferin twin into a fill-blank that PRODUCES „eine“;
  // the class rule is: at most one article-deleting Beruf correction per draw.
  const isBerufCorrection = (it) => it.type === 'error_correction' && /\bbin eine? [A-ZÄÖÜ]\w+in?\b/.test(it.questionDe || '');
  const verkaeuferin = POOL.items.find((it) => it.id === 'extra-a11-l06-09');
  assert.ok(verkaeuferin && verkaeuferin.type === 'fill_blank' && verkaeuferin.answer === 'eine',
    'extra-a11-l06-09 must stay a fill-blank that produces „eine“, not a second Beruf correction');
  for (const attempt of ATTEMPTS) {
    const items = planPractice(CURRICULUM_A11, POOL, attempt).get(6);
    const drawn = items.filter(isBerufCorrection);
    assert.ok(
      drawn.length <= 1,
      `L6 attempt ${attempt} still draws two Beruf corrections:\n  ` + drawn.map((it) => `${it.id} → ${it.answer}`).join('\n  '),
    );
    const real = items.filter((it) => drillsSlug(it, 'indefinite-articles')).length;
    assert.ok(real >= PRIMARY_MIN, `L6 attempt ${attempt} drills its own slug only ${real}/7 times`);
  }
});

test('THE SHAPE TABLE — real drills and distinct task shapes, twelve Lektionen, three attempts', () => {
  const lines = [];
  const failures = [];
  for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      const items = plan.get(lektion.nr);
      const real = items.filter((it) => drillsSlug(it, lektion.primarySlug)).length;
      const shapes = new Set(items.map(taskShape));
      lines.push(
        `attempt ${attempt}  L${String(lektion.nr).padStart(2)} ${lektion.primarySlug.padEnd(24)}` +
        ` ${real}/7 real · ${shapes.size}/7 distinct task shapes`,
      );
      if (real < PRIMARY_MIN) failures.push(`L${lektion.nr} attempt ${attempt}: ${real}/7 real, below PRIMARY_MIN`);
      if (shapes.size < PRACTICE_SIZE - MAX_SAME_TASK_SHAPE) {
        failures.push(`L${lektion.nr} attempt ${attempt}: only ${shapes.size} distinct shapes in seven items`);
      }
    }
  }
  console.log(`\n${lines.join('\n')}\n`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('THE SECOND DRAW IS A SECOND DRAW — consecutive attempts share at most two of seven', () => {
  // DaF review #9 MAJOR 1, as a class over all twelve Lektionen and both
  // consecutive attempt pairs, on SETS and not on ordered arrays — the old pin
  // used `notDeepEqual` on an array, so a reshuffle of the identical seven
  // passed it, which is exactly what L2 and L8 delivered (62 of 84 items
  // repeated between attempt 1 and 2, all seven in two Lektionen).
  //
  // The cap is MEASURED, not guessed: with the prior-attempt filter of rule 7
  // the shipped pool gives 0 shared items in ten of twelve Lektionen, and 2 in
  // L8 — whose two shared items are its `mustCover` keys (`halb`, the official
  // time), i.e. the two forms the Lektion is REQUIRED to rehearse every time.
  //
  // DaF review #10 MAJOR 2(d): the cycle WRAPS, 1 → 2 → 3 → 1, so the pair 3→1 is as consecutive as
  // the two pairs this test used to walk — and it was where L8 repeated FIVE of seven, unwatched.
  // `ATTEMPT_PAIRS` is derived from `ATTEMPT_CYCLE`, so a fourth draw would be walked the day it
  // exists. Measured on the round-11 pool: 0 shared in eleven of twelve Lektionen on all three
  // pairs, and 2 in L8 on each — its two `mustCover` items, the documented exception.
  const MAX_SHARED = 2;
  const rows = [];
  const failures = [];
  const plans = ATTEMPTS.map((a) => planPractice(CURRICULUM_A11, POOL, a));
  for (const lektion of LEKTIONEN) {
    const ids = plans.map((p) => new Set(p.get(lektion.nr).map((i) => i.id)));
    const shared = (a, b) => [...ids[a]].filter((x) => ids[b].has(x));
    rows.push(`L${String(lektion.nr).padStart(2)}  ` +
      ATTEMPT_PAIRS.map(([a, b]) => `${a + 1}∩${b + 1} = ${shared(a, b).length}`).join('   '));
    for (const [a, b] of ATTEMPT_PAIRS) {
      const overlap = shared(a, b);
      if (overlap.length > MAX_SHARED) {
        failures.push(
          `L${lektion.nr} attempts ${a + 1}→${b + 1} repeat ${overlap.length} of ${PRACTICE_SIZE} items:\n    ` +
          overlap.join('\n    '),
        );
      }
      // and every draw is still a full, legal draw
      for (const plan of [plans[a], plans[b]]) {
        const items = plan.get(lektion.nr);
        assert.equal(items.length, PRACTICE_SIZE, `L${lektion.nr} drew ${items.length}`);
        assert.equal(new Set(items.map(taskShape)).size, PRACTICE_SIZE, `L${lektion.nr} repeats a task shape`);
      }
    }
  }
  console.log(`\n${rows.join('\n')}\n`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('NO LEKTION IS SERVED A WORD IT HAS NOT TAUGHT — minLektion, 12 Lektionen × 3 attempts', () => {
  // RULE 11b AS A FILTER (round 10). The validator measured this as a ratchet and a repair round
  // chased the offenders item by item; commit 217c958 made the draw fresh per attempt and the list
  // came straight back (13 pairs, nine cache items drawn up to five Lektionen too early — „Welche
  // Schreibweise ist richtig?“ in L1, `Kaffee`/`kocht` in L4). The items were never the problem:
  // the LEKTION was wrong, and any change to the draw re-rolls which items land where. So the pool
  // carries `minLektion` — the first Lektion by which every word of the item is taught — and
  // `pickPracticeItems` filters on it BEFORE the caps and never relaxes it.
  //
  // A CLASS RULE OVER ALL 36 BLOCKS, not a list of ids: the cycle is three attempts
  // (`ATTEMPT_CYCLE`), so these are every practice block a learner of A1.1 can be served.
  const offenders = [];
  for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const lektion of LEKTIONEN) {
      for (const it of plan.get(lektion.nr)) {
        if (!Number.isInteger(it.minLektion) || it.minLektion > lektion.nr) {
          offenders.push(`L${lektion.nr} attempt ${attempt}: ${it.id} (minLektion ${it.minLektion}) — ${it.questionDe}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], `${offenders.length} item(s) served before their vocabulary is taught:\n  - ${offenders.join('\n  - ')}`);

  // The filter must be doing work, or this test would pass on an empty stamp: the pool holds items
  // whose minLektion is above an early Lektion that practises their topic, and they must be absent
  // from that Lektion's draw in every attempt while being present in the pool.
  const late = POOL.items.filter((it) => Number.isInteger(it.minLektion) && it.minLektion > 1);
  assert.ok(late.length > 100, `only ${late.length} items are stamped above L1 — the stamp is degenerate`);

  // And it is a HARD filter, not a preference: a pool item stamped above the Lektion cannot be
  // drawn even when it is the only item left on the topic.
  const lektion = LEKTIONEN[0];
  const one = POOL.items.find((it) => (lektion.practiceRule.topics || []).includes(it.topic) && isUsableItem(it));
  assert.ok(one, 'no usable item on L1 topics — fixture broken');
  const blocked = pickPracticeItems(
    { items: [{ ...one, minLektion: lektion.nr + 1 }] },
    lektion.practiceRule,
    seedFor('a1.1', lektion.nr, 1),
    { lektionNr: lektion.nr },
  );
  assert.deepEqual(blocked, [], 'an item stamped above the Lektion was still drawn');
});

test('the attempt number is DERIVED from progress — 0,1,2,9 completions map to 1,2,3,1', () => {
  // The other half of MAJOR 1: the engine had a second draw the application
  // could not reach, because `LessonPlayerPage` held `const [attempt] =
  // useState(1)` with no setter. The number is derived now, and this is the
  // derivation on progress fixtures — no schema column, just the count of runs
  // `lesson_attempts` / the local store already carry.
  assert.equal(attemptFromCompletions(0), 1, 'a first visit is attempt 1');
  assert.equal(attemptFromCompletions(1), 2, 'a repeat must draw attempt 2');
  assert.equal(attemptFromCompletions(2), 3);
  assert.equal(attemptFromCompletions(9), 1, 'the cycle wraps at the number of distinct draws the pool supports');
  assert.equal(ATTEMPT_CYCLE, 3);
  // junk in, attempt 1 out: a failed count must never cost a learner a lesson
  for (const junk of [null, undefined, -1, NaN, 'x']) assert.equal(attemptFromCompletions(junk), 1);

  // and the player passes a NON-CONSTANT attempt. Read as source because the
  // regression was a single missing setter, and that is what the source shows.
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.doesNotMatch(player, /const \[attempt\]\s*=\s*useState/, 'the attempt is hard-wired again');
  assert.match(player, /attemptFromCompletions\(/, 'the player must derive the attempt, not set it');
  assert.match(player, /setAttempt\(/);
});

test('L8 makes the learner produce „halb" and the official time — in every attempt', () => {
  // The concrete of MAJOR 1: the notice bolds „halb neun (= 8.30!)" and the
  // Lektion promises the clock of Hören Teil 1/2, the pool holds items for both,
  // and over twelve Lektionen à seven plus four checkpoints the learner produced
  // NEITHER. A ceiling on repetition cannot reserve a seat — `mustCover` does.
  const l8 = LEKTIONEN.find((l) => l.nr === 8);
  assert.deepEqual(l8.practiceRule.mustCover, ['halb', 'vierzehn Uhr dreißig'], 'L8 lost its mustCover keys');
  for (const attempt of ATTEMPTS) {
    const items = planPractice(CURRICULUM_A11, POOL, attempt).get(8);
    const answers = items.map((it) => String(it.answer || '').toLowerCase());
    assert.ok(
      answers.some((a) => a === 'halb'),
      `L8 attempt ${attempt} never makes the learner produce „halb“:\n  ` + items.map((it) => `${it.id} → ${it.answer}`).join('\n  '),
    );
    assert.ok(
      answers.some((a) => /\buhr\b/.test(a) && /drei(ß|ss)ig|fünfzehn|vierzig/.test(a)),
      `L8 attempt ${attempt} never makes the learner produce the official time:\n  ` + items.map((it) => `${it.id} → ${it.answer}`).join('\n  '),
    );
  }
});

test('L12 spreads its possessives, and every attempt drills the polite Ihr', () => {
  // The Lektion this MAJOR was measured on. Two things are pinned, per attempt.
  //
  // 1. The owner varies. `Besitzer` is the first word of the answer (`Mein`,
  //    `Deine`, `Unser`, `Ihr`, and `Wir …` for the sentence items), which is
  //    what the review counted; four distinct owners is its floor. Before the
  //    answer-key cap, five of seven items on both attempts said `mein`.
  // 2. The polite `Ihr` — `extra-a11-l12-08/09/16`, the only three items in the
  //    course that drill the Höflichkeitsform and the only three carrying
  //    `caseSensitive: true` — is actually drawn. It takes BOTH halves of the
  //    fix: the cap stops `mein` eating the block, and `mustCover: ['Ihr']` on
  //    L12's practiceRule reserves the seat, because a ceiling on repetition
  //    cannot make a specific form appear. With the cap alone, attempt 1 drew
  //    none of the three. If this fails after a pool rebuild, check that L12
  //    still HAS a usable `Ihr` item before touching the engine — the cover pass
  //    is a no-op on a key the pool cannot supply, by design.
  const POLITE = ['extra-a11-l12-08', 'extra-a11-l12-09', 'extra-a11-l12-16'];
  const inPool = POLITE.filter((id) => POOL.items.some((it) => it.id === id));
  assert.deepEqual(inPool, POLITE, 'the three polite Ihr items are no longer in the shipped pool');
  assert.deepEqual(LEKTIONEN.find((l) => l.nr === 12).practiceRule.mustCover, ['Ihr'], 'L12 lost its mustCover key');

  for (const attempt of ATTEMPTS) {
    const items = planPractice(CURRICULUM_A11, POOL, attempt).get(12);
    const owners = new Set(items.map((it) => String(it.answer || '').toLowerCase().split(/[^a-zäöüß]+/)[0]).filter(Boolean));
    assert.ok(owners.size >= 4, `L12 attempt ${attempt} draws only ${owners.size} distinct owners: ${[...owners].join(', ')}`);
    const polite = items.filter((it) => POLITE.includes(it.id));
    assert.ok(
      polite.length >= 1,
      `L12 attempt ${attempt} never drills the polite Ihr — the exam form of the last Lektion:\n  ` +
      items.map((it) => `${it.id} → ${it.answer}`).join('\n  '),
    );
    for (const it of polite) {
      assert.equal(it.caseSensitive, true, `${it.id} must stay caseSensitive — Ihr is a capital-letter distinction`);
    }
  }
});

test('a Lektion carries at most one answer lemma over from the Lektion before it', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  let previous = new Set();
  for (const lektion of LEKTIONEN) {
    const items = plan.get(lektion.nr);
    const carried = items.filter((it) => [...answerLemmas(it)].some((l) => previous.has(l))).length;
    assert.ok(carried <= MAX_CARRIED_LEMMA, `L${lektion.nr} repeats ${carried} answer lemmas from L${lektion.nr - 1}`);
    previous = new Set(items.flatMap((it) => [...answerLemmas(it)]));
  }
});

test('the plan is deterministic, and attempt 2 is a different plan', () => {
  const a = planPractice(CURRICULUM_A11, POOL, 1);
  const b = planPractice(CURRICULUM_A11, POOL_COPY, 1); // a different pool OBJECT: no cache hit
  for (const lektion of LEKTIONEN) {
    assert.deepEqual(a.get(lektion.nr).map((i) => i.id), b.get(lektion.nr).map((i) => i.id), `L${lektion.nr} is not reproducible`);
  }
  const second = planPractice(CURRICULUM_A11, POOL, 2);
  const same = LEKTIONEN.filter((l) => {
    const x = a.get(l.nr).map((i) => i.id).join();
    return x === second.get(l.nr).map((i) => i.id).join();
  });
  assert.deepEqual(same, [], 'a retry must not replay the same seven');
});

test('THE TABLE — every Lektion and the seven stems a learner actually sees', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  const lines = [];
  for (const lektion of LEKTIONEN) {
    const items = plan.get(lektion.nr);
    const primary = items.filter((i) => i.topic === lektion.primarySlug).length;
    lines.push(`L${String(lektion.nr).padStart(2)} ${lektion.primarySlug} — ${primary}/7 primary, ${items.filter(isTypedItem).length} typed, ${items.filter(isMultipleChoice).length} MC`);
    for (const it of items) lines.push(`      ${it.questionDe.replace(/\s+/g, ' ').slice(0, 78)}`);
  }
  console.log(`\n${lines.join('\n')}\n`);
  assert.equal(lines.filter((l) => l.startsWith('L')).length, LEKTIONEN.length);
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

test('a requeued item is never one the quality filter rejects', () => {
  for (const topic of [...new Set(POOL.items.map((i) => i.topic))]) {
    const items = POOL.items.filter((i) => i.topic === topic);
    const out = requeueFor([items[0]], POOL, [items[0].id]);
    for (const it of out) assert.ok(isUsableItem(it), `${it.id} should never be requeued`);
  }
  // an excluded item handed in as a miss cannot pull its own kind back in
  const trap = { id: 'trap', topic: 'verb-sein', questionDe: 'Es klingt wie "HOY-tuh"', answer: 'heute' };
  const [replacement] = requeueFor([trap], POOL, []);
  assert.ok(isUsableItem(replacement));
  assert.notEqual(replacement.id, 'trap');
});

test('an item planned for another Lektion is only requeued when the topic has nothing else', () => {
  const sein = POOL.items.filter((i) => i.topic === 'verb-sein');
  const avoid = new Set(sein.slice(1, 3).map((i) => i.id));
  const [pick] = requeueFor([sein[0]], POOL, [sein[0].id], { avoidIds: avoid });
  assert.ok(!avoid.has(pick.id), 'a free item was available and should have been preferred');
  const allButOne = new Set(sein.slice(1).map((i) => i.id));
  const [forced] = requeueFor([sein[0]], POOL, [sein[0].id], { avoidIds: allButOne });
  assert.ok(allButOne.has(forced.id), 'with nothing free, an avoided item still beats a short requeue');
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

test('a typo is forgiven on a vocabulary topic and never where the ending IS the answer', () => {
  // REVIEW #2 §E: STRICT_TOPIC is the ending topics only. A verb topic asks for a
  // whole typed sentence ("Ich brauche ein Handy."), and there a slip is spelling.
  for (const strictTopic of ['definite-articles', 'indefinite-articles', 'possessive-articles', 'personal-pronouns', 'plural-forms']) {
    assert.equal(STRICT_TOPIC.test(strictTopic), true, `${strictTopic} should be strict`);
  }
  for (const loose of ['verb-sein', 'verb-haben', 'present-tense-regular', 'separable-verbs-intro', 'time-and-dates', 'alphabet-pronunciation']) {
    assert.equal(STRICT_TOPIC.test(loose), false, `${loose} should not be strict`);
  }

  const loose = checkAnswer('Wasserr', ['Wasser'], { strict: STRICT_TOPIC.test('alphabet-pronunciation') });
  assert.equal(loose.result, RESULT.TYPO);

  assert.equal(checkAnswer('Dere', ['Der'], { strict: true }).result, RESULT.WRONG, 'an article ending is not a typo');
  assert.equal(checkAnswer('bin', ['bin'], { strict: true }).result, RESULT.CORRECT);
  assert.equal(checkAnswer('waere', ['wäre'], { strict: false }).result, RESULT.CORRECT, 'ae/ä are the same answer');
  assert.equal(checkAnswer('', ['bin'], {}).result, RESULT.WRONG);
});

test('strict mode stops at the sentence boundary — a full answer always gets its one typo', () => {
  assert.equal(STRICT_MAX_SPACES, 1);
  assert.equal(strictApplies('Der'), true);
  assert.equal(strictApplies('Viertel vor'), true, 'a two-word chunk is still the answer itself');
  assert.equal(strictApplies('Ich brauche ein Handy.'), false);
  // The §E case, on a topic that IS strict: the sentence is checked leniently …
  assert.equal(
    checkAnswer('Meine Karte ist schoen', ['Meine Karte ist schön'], { strict: true }).result,
    RESULT.CORRECT,
  );
  assert.equal(
    checkAnswer('Das ist mene Party.', ['Das ist meine Party.'], { strict: true }).result,
    RESULT.TYPO,
    'a middle-letter slip in a whole sentence is spelling, not grammar',
  );
  // … while the one-word answer of the same topic stays strict.
  assert.equal(checkAnswer('meinee', ['meine'], { strict: true }).result, RESULT.WRONG);
});

test('a dictation ignores dashes and digit grouping — REVIEW #2 fix 5', () => {
  assert.equal(normalizeDictation('0176-2345 67'), '0176234567');
  assert.equal(normalizeDictation('Tel.: 0176-23 45 67'), 'Tel.: 0176234567');
  const same = (a, b) => checkAnswer(a, [b], { strict: false, dictation: true }).result;
  assert.equal(same('0176 234567', '0176-2345 67'), RESULT.CORRECT);
  assert.equal(same('Meine Nummer ist 0176-23 45 67.', 'Meine Nummer ist 0176 234567.'), RESULT.CORRECT);
  assert.equal(same('Null eins sieben sechs - drei', 'Null eins sieben sechs – drei'), RESULT.CORRECT);
  assert.equal(same('Er sagt "Hallo".', 'Er sagt „Hallo“.'), RESULT.CORRECT);
  // Typographic quotes fold for every check, not only for a dictation.
  assert.equal(checkAnswer('Er sagt "Hallo".', ['Er sagt „Hallo“.']).result, RESULT.CORRECT);
  // and a genuinely different number is still wrong
  assert.equal(same('0176 234568', '0176 234567'), RESULT.WRONG);
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

test('a separable prefix the cue names is content, not a function word — REVIEW #23 Minor 5', () => {
  // L11 attempt 3 served `extra-a11-l11-04` („Kaufst du heute ___? (einkaufen)" → `ein`)
  // beside `8a2be339` („___ ihr heute ein? (einkaufen)") — the printed `ein` IS the whole
  // production of the first item, and the documented four-letter floor exempted it as a
  // function word. The class rule: an answer that is the separable prefix of the infinitive
  // the item's OWN bracket names is content — read off the cue, never off a prefix list.
  const solved = { answer: 'ein', questionDe: 'Kaufst du heute ___? (einkaufen)' };
  assert.equal(
    leaksAnswer(solved, { questionDe: '___ ihr heute ein? (einkaufen)' }),
    true,
    'the printed prefix no longer counts as a leak',
  );
  // …and the exemption the floor exists for is untouched: the ARTICLE `ein` in an article
  // item stays exempt, or the three Artikel-Lektionen would go short.
  assert.equal(
    leaksAnswer(
      { answer: 'ein', questionDe: 'Das ist ___ Bild. (unbestimmter Artikel)' },
      { questionDe: 'Korrigieren Sie den Artikel: „Das ist ein Pause.“' },
    ),
    false,
    'the article ein must keep its function-word exemption',
  );
  // The measured pair never sits one seven again, on any attempt of the cycle.
  for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
    const plan = planPractice(CURRICULUM_A11, POOL, attempt);
    for (const [nr, items] of plan) {
      const ids = new Set(items.map((i) => i.id));
      assert.ok(
        !(ids.has('extra-a11-l11-04') && ids.has('8a2be339-3196-5a98-a5e6-e41f4351e703')),
        `L${nr} attempt ${attempt}: the einkaufen pair is served together again`,
      );
    }
  }
});
