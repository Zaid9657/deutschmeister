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

import buildLesson, {
  pickPracticeItems, planPractice, seedFor, isTypedItem, isMultipleChoice, itemLemmas, answerLemmas,
  answerKey, taskShape,
  PRACTICE_SIZE, MAX_MULTIPLE_CHOICE, PRIMARY_MIN, MAX_SAME_LEMMA, MAX_CARRIED_LEMMA, MAX_SAME_ANSWER_KEY,
  MAX_SAME_TASK_SHAPE, attemptFromCompletions, ATTEMPT_CYCLE,
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
  const failures = [];
  const rows = [];
  for (const attempt of [1, 2]) {
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

test('no lemma carries more than two items in one Lektion — the Mädchen rule', () => {
  const plan = planPractice(CURRICULUM_A11, POOL, 1);
  const lektionenPerLemma = new Map();
  for (const lektion of LEKTIONEN) {
    const count = new Map();
    for (const it of plan.get(lektion.nr)) {
      for (const lemma of itemLemmas(it)) count.set(lemma, (count.get(lemma) || 0) + 1);
    }
    for (const [lemma, n] of count) {
      assert.ok(n <= MAX_SAME_LEMMA, `L${lektion.nr} drills "${lemma}" ${n} times`);
      lektionenPerLemma.set(lemma, (lektionenPerLemma.get(lemma) || 0) + 1);
    }
  }
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
  for (const attempt of [1, 2]) {
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

test('no task shape carries more than one item in a Lektion — the Beruf-pair rule', () => {
  // The third diversity axis, walked over all twelve Lektionen and BOTH
  // attempts of the shipped pool, as a class rule and not as the one instance
  // the review caught. The cap is a hard assertion rather than "≥ 6 distinct of
  // 7" on purpose: `MAX_SAME_TASK_SHAPE` is relaxed LAST in pickPracticeItems,
  // so a Lektion exceeding it here means the topic slice could not fill seven
  // under the other caps either — a POOL finding (too few distinct exercises on
  // that slug), to be fixed with items, not by loosening this number.
  const rows = [];
  for (const attempt of [1, 2]) {
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
  for (const attempt of [1, 2]) {
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

test('THE SHAPE TABLE — real drills and distinct task shapes, twelve Lektionen, both attempts', () => {
  const lines = [];
  const failures = [];
  for (const attempt of [1, 2]) {
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
  const MAX_SHARED = 2;
  const rows = [];
  const failures = [];
  const plans = [1, 2, 3].map((a) => planPractice(CURRICULUM_A11, POOL, a));
  for (const lektion of LEKTIONEN) {
    const ids = plans.map((p) => new Set(p.get(lektion.nr).map((i) => i.id)));
    const shared = (a, b) => [...ids[a]].filter((x) => ids[b].has(x));
    rows.push(`L${String(lektion.nr).padStart(2)}  1∩2 = ${shared(0, 1).length}   2∩3 = ${shared(1, 2).length}`);
    for (const [a, b] of [[0, 1], [1, 2]]) {
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
  for (const attempt of [1, 2, 3]) {
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

  for (const attempt of [1, 2]) {
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
