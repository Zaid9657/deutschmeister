// Guard suite for the pool rules the SECOND DaF review asked for
// (docs/course-factory/a11-rebuild/REVIEW-daf-2-2026-09-12.md, fixes 1–3).
//
// WHY IT EXISTS. The first review's worst finding was an item that marks a
// correct German answer wrong; the second review measured the drawn seven again
// and found the class alive in four more shapes, three of them in the Lektion
// the course sells as `Hören Teil 1`:
//
//   * ORDINALS — "Heute ist der ___ Juni. (20.)" → `zwanzigste`, with `accepted`
//     holding exactly one string. No notice and no rule card of this level
//     teaches the formation, and the curriculum defers it to A1.2 in writing.
//     Two of Lektion 8's seven items were guaranteed errors WITH a requeue that
//     served the other one. That was the whole blocker of the second round.
//   * MONTH NAMES on the time topic — introduced in Lektion 12, drawn in 8.
//   * `in der Nacht` — a Dativ exception on a noun in no Wortfeld.
//   * THE ANSWER IN ITS OWN PROMPT — "Das Kind ___ Deutsch. Es lernt schnell."
//   * A PROMPT WITH NO TASK — "Wie sagt man das?", where the sentence to produce
//     exists only in the English gloss, and "Schreib den Satz: [spielen /
//     Fußball]", where the subject does (so `Ich spiele Fußball.` is marked
//     wrong). A course for Integrationskurs learners may not put its content in
//     an English field.
//
// THIRD REVIEW (REVIEW-daf-3-2026-09-12.md) added the two classes that made the
// same mistake a second time — a correction by id where a rule was needed:
//
//   * THE VERB ONLY IN THE ENGLISH GLOSS — "Ich ___ viel." accepting `arbeite`
//     alone, because `(verb: arbeiten, ich)` stands in `questionEn`. 58 items,
//     two of them in the drawn seven. The build script REPAIRS them (the cue
//     moves into the German prompt) rather than dropping them; the rule is what
//     makes a repaired pool provable and an unrepaired one fail.
//   * A STATEMENT THAT ASKS NOTHING — "Anna ist deine Freundin." with the chips
//     Sie/ihr/du, the task English-only. Exactly one item in the pool, the twin
//     of one that was hand-flagged in round 2 with the rule left unwritten.
//
// FOURTH REVIEW (REVIEW-daf-4-2026-09-12.md) found the class a third time, one
// part of speech on:
//
//   * THE ARTICLE ONLY IN THE ENGLISH GLOSS — "___ Tafel ist grün." accepting
//     `Die` alone, because only `questionEn` ("The blackboard is green.") says
//     which article is meant. 42 typed items, 30 definite and 12 indefinite,
//     spread over Lektionen 4, 5 and 6 — three consecutive PRIMARY series. Same
//     treatment as the verb: the build script appends "(bestimmter Artikel)" or
//     "(unbestimmter Artikel)" to the German prompt and never touches the answer
//     key; the rule here is what makes a repaired pool provable.
//   * "Buchstabiert:" — 17 items of the shipped pool claimed a listening act the
//     player never performs (PracticeItem.jsx renders text), in the same line as
//     "Schreiben Sie das Wort" and next to the letters themselves. Rewritten to
//     "Lesen Sie die Buchstaben:", which is true and keeps the `/Buchstab/` mark
//     the Lektion-1 spelling items are identified by.
//
// FIFTH REVIEW (REVIEW-daf-5-2026-09-12.md) found the class a FOURTH time, and
// this time the reason was the rule's own shape rather than a new part of
// speech: round 4's article rule asked `type === 'fill_blank'`, so three
// sentence-building items kept inventing an article the German cue list never
// names ("[Honig / ist / gut]" → only "Der Honig ist gut."), two of them inside
// the graded Checkpoint 2. Three rules close it, all three phrased as the
// question they answer rather than as the field the last instance was found in:
//
//   * THE ARTICLE THE ANSWER NEEDS MUST BE IN THE GERMAN PROMPT — as a cue word
//     or as a task formula. Repaired in the build ("(mit bestimmtem Artikel)");
//     writing the article into the cue list would give the gender away.
//   * THE TASK FORMULA AND THE ANSWER KEY MUST ASK FOR THE SAME THING.
//     "(bestimmter Artikel)" + `accepted: ['das Heft']` marks the learner who
//     obeys the formula wrong. NOT repaired: choosing which half is right is
//     authorship, so the item is excluded and a failing extra stops the build.
//   * A PROMPT ASKS FOR GERMAN, NOT ABOUT IT. "Welche Endung ist IMMER
//     feminin?" — plus the percentage claim in its explanation, which the rule
//     cards have been forbidden from making since round 2.
//
// And the register: the shipped pool had 39 du-imperatives against 30 Sie-forms,
// three of them in the drawn seven of the FREE Lektion. The normaliser lives in
// the build script, the proof lives here.
//
// The point of this file is that the rules are checked, not the artefact: the
// tests apply `exclusionReason` to a11.json + a11.extra.json themselves, so they
// still hold between a rule change and the next `node scripts/build-lesson-pool.mjs
// a1.1`. The one test that IS about the artefact says so in its message.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  exclusionReason, isUsableItem, filterPool, REASON, REASONS, EXCLUDE_IDS,
  MONTH_NAMES, ORDINAL_CUE_RE, ORDINAL_WORD_RE, MIN_BRACKET_CUES,
  answerInPrompt, isMetaPrompt, verbCueOnlyInGloss, statementNoTask, parseVerbCue,
  articleCueOnlyInGloss, articleAnswerKind, ARTICLE_CUE,
  missingSentenceArticle, cueAnswerMismatch, metalinguisticPrompt, SENTENCE_ARTICLE_CUE,
  ambiguousCorrection, minimalArticleCorrection, isPoliteFormItem, drillsSlug,
} from '../src/data/lessonPools/quality.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const POOL = read('src/data/lessonPools/a11.json');
const EXTRA = read('src/data/lessonPools/a11.extra.json').items;

/** Everything that can reach a Lektion of A1.1, whether the pool is fresh or not. */
const ALL = [...POOL.items, ...EXTRA.filter((e) => !POOL.items.some((p) => p.id === e.id))];
/** What survives the rules — the set a learner can actually be shown. */
const USABLE = ALL.filter((item) => isUsableItem(item));

const POOL_A12 = read('src/data/lessonPools/a12.json');

const MONTH_RE = new RegExp(`(^|[^a-zäöüß])(${MONTH_NAMES.join('|')})([^a-zäöüß]|$)`, 'i');
const label = (item) => `${item.id} (${item.topic}) — ${item.questionDe} → ${item.answer}`;

test('whatever the rules drop carries a stable reason, and they are not broad', () => {
  // a11.json is generated: right after a build nothing here is dropped, and
  // before one the 17 items of the second review are. Both are fine — what may
  // never happen is an unnamed reason, or a filter wide enough to thin a Lektion.
  const { excluded, counts } = filterPool(ALL, { level: 'a1.1' });
  for (const ex of excluded) {
    assert.ok(REASONS.includes(ex.reason), `${ex.id}: ${ex.reason}`);
    assert.ok(ex.id && 'questionDe' in ex, `${ex.id}: the drop list must be printable`);
  }
  assert.ok(excluded.length < ALL.length * 0.25, `${excluded.length} of ${ALL.length} dropped — too broad`);
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), excluded.length);
});

test('no item a learner can be shown asks for an ordinal number', () => {
  for (const item of USABLE) {
    assert.doesNotMatch(item.questionDe, ORDINAL_CUE_RE, `ordinal cue: ${label(item)}`);
    for (const a of [item.answer, ...(item.accepted || [])]) {
      assert.doesNotMatch(String(a).trim(), ORDINAL_WORD_RE, `ordinal answer: ${label(item)}`);
    }
  }
  // and the two items the review names by quotation are gone
  for (const gone of ['Heute ist der ___ Juni. (20.)', 'Heute ist der ___ August. (8.)']) {
    assert.ok(!USABLE.some((i) => i.questionDe === gone), `"${gone}" survives the filter`);
  }
});

test('no time item names a month — the months are Lektion 12, the time topic is Lektion 8', () => {
  for (const item of USABLE.filter((i) => /time|date/i.test(i.topic))) {
    const all = [item.questionDe, item.answer, ...(item.accepted || [])].join(' · ');
    assert.doesNotMatch(all, MONTH_RE, `month on a time item: ${label(item)}`);
  }
  // Lektion 12 teaches them, so its own topic may say "Im Januar" — the rule is
  // scoped, not blanket, or fix 6 of the review could not be written.
  assert.equal(
    exclusionReason({ id: 'x', topic: 'possessive-articles', questionDe: 'Im Januar ist ___ Geburtstag. (er)', answer: 'sein' }),
    null,
  );
});

test('no item gives its own answer away in the German prompt', () => {
  for (const item of USABLE) assert.equal(answerInPrompt(item), false, `answer in prompt: ${label(item)}`);
  // the L11 item the review names, and the shape the rule must NOT touch
  assert.equal(
    exclusionReason({ id: 'x', topic: 'present-tense-regular', questionDe: 'Das Kind ___ Deutsch. Es lernt schnell.', answer: 'lernt' }),
    REASON.ANSWER_IN_PROMPT,
  );
  assert.equal(
    exclusionReason({ id: 'y', topic: 'present-tense-regular', questionDe: 'Du ___ Deutsch. (lernen)', answer: 'lernst' }),
    null,
    'an infinitive hint is not the answer',
  );
  assert.equal(
    exclusionReason({ id: 'z', topic: 'definite-articles', questionDe: 'Korrigiere: „Das Schere ist hier.“', answer: 'Die Schere ist hier.' }),
    null,
    'an error-correction item quotes the sentence on purpose',
  );
});

test('no prompt is a bare meta question or a cue list too thin to determine the sentence', () => {
  for (const item of USABLE) assert.equal(isMetaPrompt(item), false, `meta prompt: ${label(item)}`);
  assert.equal(MIN_BRACKET_CUES, 3);
  assert.equal(
    exclusionReason({ id: 'a', topic: 'indefinite-articles', questionDe: 'Wie sagt man das?', answer: 'Ich bin Lehrer.' }),
    REASON.META_PROMPT,
  );
  assert.equal(
    exclusionReason({ id: 'b', topic: 'personal-pronouns', questionDe: 'Schreib den Satz: [spielen / Fußball]', answer: 'Wir spielen Fußball.' }),
    REASON.META_PROMPT,
    'the subject lives only in the English gloss',
  );
  assert.equal(
    exclusionReason({ id: 'c', topic: 'personal-pronouns', questionDe: 'Schreib den Satz: [wir / kommen / aus Marokko]', answer: 'Wir kommen aus Marokko.' }),
    null,
    'three cues determine the sentence',
  );
});

test('the items the review names by id are excluded, whatever the rules do next', () => {
  const named = {
    '75a1cec4-0090-4675-852f-abb4d51dabb1': 'Sie ___ drei Kinder (ambiguous Sie, L9)',
    '160867f8-dbb5-41ec-87ba-d9408124308b': 'Du sprichst mit deinem Lehrer (meta, L7)',
    'bb0ead84-4c69-547b-b8aa-b791b1c0e375': 'Das ist ___ Uhr → keine (round 1 blocker)',
  };
  for (const [id, why] of Object.entries(named)) {
    assert.ok(Object.prototype.hasOwnProperty.call(EXCLUDE_IDS, id), `${id} is not hand-flagged: ${why}`);
    assert.equal(exclusionReason({ id, questionDe: 'harmlos', answer: 'gut' }), REASON.HAND_FLAGGED, why);
    assert.ok(!USABLE.some((i) => i.id === id), `${id} survives the filter: ${why}`);
  }
  // The five the RULES catch: named here so a weakened rule fails loudly.
  const byRule = {
    'bb176cf1-73d2-5960-8b19-737bd928712b': REASON.ANSWER_IN_PROMPT,
    'ee6118f0-a72e-4434-9d28-4f30ffdc242b': REASON.META_PROMPT,
    '758c6589-bbd9-5fdd-8ce0-7d738039033c': REASON.META_PROMPT,
    '2f9bf1dc-0221-5f9e-bfdc-17037f97d80a': REASON.ORDINAL_NUMBER,
    'f0532751-96db-5cb5-bde4-198903f34ed1': REASON.ORDINAL_NUMBER,
    'ba0f5667-a00d-57a4-9a76-5571224696a4': REASON.UNTAUGHT_TIME_EXCEPTION,
  };
  for (const [id, reason] of Object.entries(byRule)) {
    const item = ALL.find((i) => i.id === id);
    if (!item) continue; // already gone from the artefact — the rule still stands
    assert.equal(exclusionReason(item), reason, `${id} should be dropped as ${reason}`);
  }
});

test('the level-scoped rules are scoped: an ordinal or a month is fine above A1.1', () => {
  const ordinal = { id: 'o', topic: 'time-and-dates', questionDe: 'Heute ist der ___ Mai. (3.)', answer: 'dritte' };
  assert.equal(exclusionReason(ordinal), REASON.ORDINAL_NUMBER, 'no level named → the strict default');
  assert.equal(exclusionReason(ordinal, { level: 'a1.1' }), REASON.ORDINAL_NUMBER);
  assert.equal(exclusionReason(ordinal, { level: 'a1.2' }), null);
  assert.equal(exclusionReason(ordinal, { level: 'a2.1' }), null);
});

test('enough survives for every topic Lektion 8 and Lektion 11 draw', () => {
  // The review's instruction was to filter, "es bleiben genug (26 Items im Topic)".
  // Seven is a Lektion; a topic under that would thin a Lektion out silently.
  for (const topic of ['time-and-dates', 'separable-verbs-intro', 'present-tense-regular', 'verb-haben']) {
    const n = USABLE.filter((i) => i.topic === topic).length;
    assert.ok(n >= 7, `only ${n} usable items left on ${topic}`);
  }
});

// --- REVIEW #3 ------------------------------------------------------------

test('no usable typed item hides its verb in the English gloss — REVIEW #3 BLOCKER 1', () => {
  for (const item of USABLE) {
    assert.equal(verbCueOnlyInGloss(item), false, `verb cue only in the gloss: ${label(item)}`);
  }
  // the shape itself, and the two shapes the rule must NOT touch
  const trap = {
    id: 'v1', topic: 'present-tense-regular', type: 'fill_blank',
    questionDe: 'Ich ___ viel.', questionEn: 'I ___ a lot. (verb: arbeiten, ich)', answer: 'arbeite',
  };
  assert.equal(exclusionReason(trap), REASON.VERB_CUE_ONLY_IN_GLOSS);
  assert.equal(
    exclusionReason({ ...trap, questionDe: 'Ich ___ viel. (arbeiten)' }),
    null,
    'the cue in the German prompt is the repair, and it must satisfy the rule',
  );
  // An ordinary lexical gloss carries no verb cue. (The same item DOES trip the
  // REVIEW #4 article rule — "Eine Auto ist alt." is wrong German but "Ein Auto
  // ist alt." is not — which is that rule's business, not this one's.)
  assert.equal(
    verbCueOnlyInGloss({
      id: 'v2', topic: 'nouns-gender', type: 'fill_blank',
      questionDe: '___ Auto ist alt.', questionEn: 'The ___ (car) is old.', answer: 'Das',
    }),
    false,
    'an ordinary lexical gloss carries no verb cue',
  );
  // the parser the repair is built on
  assert.deepEqual(parseVerbCue('They ___ together. (verb: arbeiten, sie = they)'),
    { infinitive: 'arbeiten', person: 'sie = they', flag: '' });
  assert.deepEqual(parseVerbCue('___ up at 7? (prefix only, verb: abholen, ich)'),
    { infinitive: 'abholen', person: 'ich', flag: 'prefix only' });
  assert.equal(parseVerbCue('The ___ (car) is old.'), null);
});

test('no usable item is a statement that asks nothing — REVIEW #3 BLOCKER 2', () => {
  for (const item of USABLE) {
    assert.equal(statementNoTask(item), false, `statement, no task: ${label(item)}`);
  }
  assert.ok(
    !USABLE.some((i) => i.id === 'd44e8128-05d8-4556-b7b2-2eaa8cc2da97'),
    '"Anna ist deine Freundin." survives the filter',
  );
  assert.equal(
    exclusionReason({
      id: 's1', topic: 'personal-pronouns', type: 'multiple_choice',
      questionDe: 'Anna ist deine Freundin.', options: ['Sie', 'ihr', 'du'], answer: 'du',
    }),
    REASON.STATEMENT_NO_TASK,
  );
  assert.equal(
    exclusionReason({
      id: 's2', topic: 'definite-articles', type: 'error_correction',
      questionDe: 'Korrigieren Sie: „Das Schere ist hier.“', answer: 'Die Schere ist hier.',
    }),
    null,
    'an error-correction item carries a task verb and the sentence it quotes',
  );
  assert.equal(
    exclusionReason({
      id: 's3', topic: 'yes-no-questions', type: 'multiple_choice',
      questionDe: 'Wähle die richtige Ja/Nein-Frage zu: Du kommst aus Spanien.',
      options: ['Kommst du aus Spanien?', 'Du kommst aus Spanien?'], answer: 'Kommst du aus Spanien?',
    }),
    null,
    'a task formula is a task, whatever follows it',
  );
});

test('the shipped pool addresses an adult learner in the Sie-register — REVIEW #3 MAJOR', () => {
  const DU_IMPERATIVE = /\b(Schreib|Schreibe|Bilde|Ergänze|Korrigiere|Setze|Wähle|Finde|Antworte)\b/;
  for (const item of POOL.items) {
    assert.doesNotMatch(item.questionDe, DU_IMPERATIVE, `du-imperative: ${label(item)}`);
  }
});

// --- REVIEW #4 ------------------------------------------------------------

test('no prompt claims a listening act the player never performs — REVIEW #4 MAJOR', () => {
  // The same shape as the du-imperative test above, on the artefact: nothing in
  // the SHIPPED pool may open with "Buchstabiert:". The player renders text, so
  // the learner reads the letters that already stand in the prompt.
  for (const item of POOL.items) {
    assert.doesNotMatch(item.questionDe, /^Buchstabiert:/, `Buchstabiert: ${label(item)}`);
  }
  const spelling = POOL.items.filter((i) => /^Lesen Sie die Buchstaben:/.test(i.questionDe));
  assert.ok(spelling.length >= 12, `only ${spelling.length} spell-out items carry the new label`);
  // and the mark the Lektion-1 items are identified by survives the rewrite —
  // "Buchstaben" matches /Buchstab/, which is what drillsSlug and
  // tests/lesson-engine.test.mjs read.
  for (const item of spelling) assert.match(item.questionDe, /Buchstab/);
});

test('no usable item names its article only in the English gloss — REVIEW #4 BLOCKER 2', () => {
  for (const item of USABLE) {
    assert.equal(articleCueOnlyInGloss(item), false, `article cue only in the gloss: ${label(item)}`);
  }
  // the shape the review quotes, and the repair that has to satisfy the rule
  const trap = {
    id: 'a1', topic: 'definite-articles', type: 'fill_blank',
    questionDe: '___ Tafel ist grün.', questionEn: 'The blackboard is green.',
    answer: 'Die', accepted: ['Die', 'die'],
  };
  assert.equal(exclusionReason(trap), REASON.ARTICLE_CUE_ONLY_IN_GLOSS);
  assert.equal(
    exclusionReason({ ...trap, questionDe: `___ Tafel ist grün. ${ARTICLE_CUE.definite}` }),
    null,
    'the cue in the German prompt is the repair, and it must satisfy the rule',
  );
  // the indefinite half of the class
  assert.equal(
    exclusionReason({
      id: 'a2', topic: 'indefinite-articles', type: 'fill_blank',
      questionDe: 'Das ist ___ Büro.', questionEn: 'That is an office.', answer: 'ein', accepted: ['ein'],
    }),
    REASON.ARTICLE_CUE_ONLY_IN_GLOSS,
  );
  // and the three shapes the rule must NOT touch
  assert.equal(
    exclusionReason({
      id: 'a3', topic: 'nouns-gender', type: 'multiple_choice',
      questionDe: '___ Tafel ist grün.', options: ['Die', 'Der', 'Das'], answer: 'Die',
    }),
    null,
    'chips name the article family, so the German prompt carries the task',
  );
  assert.equal(
    exclusionReason({
      id: 'a4', topic: 'definite-articles', type: 'error_correction',
      questionDe: 'Korrigieren Sie: „Das Schere ist hier.“', answer: 'Die Schere ist hier.',
    }),
    null,
    'a whole-sentence answer is not a bare article gap',
  );
  // A contrast prompt is not exempt either: "Ist das ein Heft? — Ja, und ___
  // Heft ist grün." still has to say which form it wants, and the repair appends
  // it. (`exclusionReason` reports ANSWER_IN_PROMPT for this one, because `das`
  // stands in the prompt's own first clause — an older rule, and the right one.)
  assert.equal(
    articleCueOnlyInGloss({
      id: 'a5', topic: 'definite-articles', type: 'fill_blank',
      questionDe: 'Ist das ein Heft? — Ja, und ___ Heft ist grün.', answer: 'das', accepted: ['das'],
    }),
    true,
  );
  // the family reader the repair is built on
  assert.equal(articleAnswerKind({ answer: 'Die', accepted: ['Die', 'die'] }), 'definite');
  assert.equal(articleAnswerKind({ answer: 'einen', accepted: [] }), 'indefinite');
  assert.equal(articleAnswerKind({ answer: 'Die', accepted: ['Die', 'Eine'] }), null,
    'an item that takes both families is not asking which one');
  assert.equal(articleAnswerKind({ answer: 'Die Schere ist hier.' }), null);
});

test('the two items the review quotes now carry their verb in the German prompt', () => {
  const byPrefix = (p) => POOL.items.find((i) => i.id.startsWith(p));
  const l7 = byPrefix('898a0861');
  const l11 = byPrefix('d8082071');
  assert.ok(l7, '898a0861 (L7 "Ich ___ viel.") is gone from the pool');
  assert.ok(l11, 'd8082071 (L11 "Sie ___ zusammen.") is gone from the pool');
  assert.match(l7.questionDe, /\(arbeiten/, l7.questionDe);
  assert.match(l11.questionDe, /\(arbeiten, Plural\)/, l11.questionDe);
});

// --- REVIEW #5 ------------------------------------------------------------
//
// The fifth review's one sentence: "eine Regel muss an der Frage hängen, die
// sie beantwortet, nicht am Feld, in dem die letzte Instanz gefunden wurde."
// Round 4's article rule asked `type === 'fill_blank'` and three items of
// another build shape walked through it — two of them into the GRADED
// Checkpoint 2. The three tests below are written as the question, not as the
// shape: is the article in the German prompt at all; do the task formula and
// the answer key ask for the same thing; does the prompt ask FOR German or
// ABOUT it.

test('no usable sentence-building item invents an article the cue list never names — REVIEW #5 BLOCKER 1', () => {
  for (const item of USABLE) {
    assert.equal(missingSentenceArticle(item), null, `article missing from the cue list: ${label(item)}`);
    assert.equal(articleCueOnlyInGloss(item), false, `article cue only in the gloss: ${label(item)}`);
  }
  // the three the review names by id, whichever file they live in
  for (const id of [
    'dd86dc8a-49b8-5d48-8a6a-2606fd90b0fd',
    '670eaadb-ca17-52d3-a62b-220ef80b8828',
    'cd6d471e-cd91-5863-b5db-eeb2cbce2f2e',
  ]) {
    const item = ALL.find((i) => i.id === id);
    if (!item) continue; // replaced by the item author — the rule still stands
    assert.equal(missingSentenceArticle(item), null, `${id} still hides its article: ${item.questionDe}`);
  }
  // the shape itself, and the repair that has to satisfy the rule
  const trap = {
    id: 'sb1', topic: 'nouns-gender', type: 'sentence_building',
    questionDe: 'Schreiben Sie den Satz: [Honig / ist / gut]',
    questionEn: 'Write the sentence: [honey / is / good] — add the right definite article.',
    answer: 'Der Honig ist gut.',
  };
  assert.equal(exclusionReason(trap), REASON.ARTICLE_CUE_ONLY_IN_GLOSS);
  assert.equal(missingSentenceArticle(trap), 'definite');
  assert.equal(
    exclusionReason({ ...trap, questionDe: `${trap.questionDe} ${SENTENCE_ARTICLE_CUE.definite}` }),
    null,
    'the task formula in the German prompt is the repair, and it must satisfy the rule',
  );
  // the indefinite half
  assert.equal(
    missingSentenceArticle({
      id: 'sb2', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [Blume / sein / schön]',
      answer: 'Eine Blume ist schön.',
    }),
    'indefinite',
  );
  // and the four shapes the rule must NOT touch
  assert.equal(
    missingSentenceArticle({
      id: 'sb3', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [der Stuhl / kosten / zwölf Euro]',
      answer: 'Der Stuhl kostet zwölf Euro.',
    }),
    null,
    'the cue list carries the article',
  );
  assert.equal(
    missingSentenceArticle({
      id: 'sb4', type: 'sentence_building', questionDe: 'Schreiben Sie den Satz: [wir / einkaufen / heute]',
      answer: 'Wir kaufen heute ein.',
    }),
    null,
    'the `ein` is the separable prefix of the verb the cue list names, not an article',
  );
  assert.equal(
    missingSentenceArticle({
      id: 'sb5', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / brauchen / ein / Handy]',
      answer: 'Ich brauche ein Handy.',
    }),
    null,
    'the article stands in the cue list as its own chip',
  );
  assert.equal(
    missingSentenceArticle({
      id: 'sb6', type: 'fill_blank', questionDe: '___ Tafel ist grün. (bestimmter Artikel)',
      answer: 'Die', accepted: ['Die', 'die'],
    }),
    null,
    'a fill-in gap is the other half of the rule, not this one',
  );
});

test('no usable item asks for one form and accepts another — REVIEW #5 BLOCKER 2', () => {
  for (const item of USABLE) {
    assert.equal(cueAnswerMismatch(item), false, `cue and answer disagree: ${label(item)}`);
  }
  // the item the review measures: the formula says ONE WORD, the key wants two
  const trap = {
    id: 'cm1', topic: 'definite-articles', type: 'fill_blank',
    questionDe: 'Ist das ein Heft? — Ja, und ___ ist grün. (bestimmter Artikel)',
    answer: 'das Heft', accepted: ['das Heft', 'Das Heft'],
  };
  assert.equal(exclusionReason(trap), REASON.CUE_ANSWER_MISMATCH);
  // The fixed item, as its author rewrote it: the formula and a bare article
  // agree. (The prompt loses its own `das` in the same edit — otherwise the
  // older ANSWER_IN_PROMPT rule catches it, which is that rule's business.)
  assert.equal(
    exclusionReason({
      ...trap,
      questionDe: 'Ist hier ein Heft? — Ja, und ___ Heft ist grün. (bestimmter Artikel)',
      answer: 'das', accepted: ['das', 'Das'],
    }),
    null,
    'the formula and a bare article agree — that is the fixed item',
  );
  assert.equal(cueAnswerMismatch({ ...trap, answer: 'das', accepted: ['das', 'Das'] }), false);
  assert.equal(
    cueAnswerMismatch({
      id: 'cm2', topic: 'nouns-gender', type: 'fill_blank',
      questionDe: '___ Rucksack ist teuer. (der, die oder das?)', answer: 'Der', accepted: ['Der', 'der'],
    }),
    false,
    'the hand-written article formula counts as one',
  );
  // the reverse: a verb task whose key is nothing but bare articles
  assert.equal(
    cueAnswerMismatch({
      id: 'cm3', topic: 'present-tense-regular', type: 'fill_blank',
      questionDe: 'Wir ___ heute. (kaufen)', answer: 'die', accepted: ['die'],
    }),
    true,
  );
  // …and the one exception that keeps the reverse honest: `ein` is also the
  // separable prefix, so the two real items of that shape are NOT mismatches.
  assert.equal(
    cueAnswerMismatch({
      id: 'cm4', topic: 'separable-verbs-intro', type: 'fill_blank',
      questionDe: 'Wir kaufen heute ___. (einkaufen, nur die Vorsilbe)', answer: 'ein', accepted: ['ein'],
    }),
    false,
    'the separable prefix is spelled like an article and is not one',
  );
  // a sentence-building repair asks for a SENTENCE containing an article, and
  // must never be read as a prompt that wants a bare one back
  assert.equal(
    cueAnswerMismatch({
      id: 'cm5', topic: 'nouns-gender', type: 'sentence_building',
      questionDe: `Schreiben Sie den Satz: [Honig / ist / gut] ${SENTENCE_ARTICLE_CUE.definite}`,
      answer: 'Der Honig ist gut.',
    }),
    false,
  );
});

test('no usable prompt asks ABOUT German instead of asking FOR it — REVIEW #5 MAJOR 7', () => {
  for (const item of USABLE) {
    assert.equal(metalinguisticPrompt(item), false, `metalinguistic prompt: ${label(item)}`);
  }
  const trap = {
    id: 'mp1', topic: 'nouns-gender', type: 'multiple_choice',
    questionDe: 'Welche Endung ist IMMER feminin?', options: ['-er', '-um', '-chen', '-ung'],
    answer: '-ung', explanationDe: '-ung ist 100% feminin ohne Ausnahmen.',
  };
  assert.equal(exclusionReason(trap), REASON.METALINGUISTIC_PROMPT);
  // either clause alone is enough: the prompt, or a chip set of bare endings
  assert.equal(metalinguisticPrompt({ ...trap, options: null }), true);
  assert.equal(metalinguisticPrompt({ ...trap, questionDe: 'Was passt?' }), true);
  // and the family one word away that the rule may NOT touch: these USE the
  // article instead of talking about it, and four of them are in the pool.
  for (const q of ['Welcher Artikel passt? ___ Wohnung', 'Welches Wort verwendet "das"?', 'Welche Schreibweise ist richtig?']) {
    assert.equal(
      metalinguisticPrompt({ id: 'mp2', type: 'multiple_choice', questionDe: q, options: ['der', 'die', 'das'], answer: 'die' }),
      false,
      q,
    );
  }
});

test('no explanation a learner is shown claims a percentage — REVIEW #5 MAJOR 7', () => {
  // The same rule `tests/rule-card-overrides.test.mjs` holds for every rule card
  // ("a percentage has no source on an A1 rule card"), applied to the pool: the
  // review found the card rule and the item rule pulling in opposite directions
  // on the SAME fact. "-ung ist 100% feminin ohne Ausnahmen." is false for words
  // ending in -ung (der Ursprung, der Sprung, der Dung) and an A1.1 learner
  // cannot make the suffix/ending distinction that would rescue it.
  //
  // WHY THERE IS NO EXPLANATION OVERRIDE IN THE BUILD SCRIPT. The one item in
  // the pool that trips this is `89f19829`, and `METALINGUISTIC_PROMPT` already
  // drops it for a second, independent reason — so an id-keyed
  // EXPLANATION_OVERRIDES map would have exactly one entry that never runs,
  // which is the "correction by id where a rule was needed" this review series
  // has flagged four times. The test below is the rule, and it holds whichever
  // rule does the dropping: loosen `METALINGUISTIC_PROMPT` and this goes red.
  for (const item of USABLE) {
    assert.ok(
      !String(item.explanationDe || '').includes('%'),
      `percentage claim in an explanation: ${label(item)} — ${item.explanationDe}`,
    );
  }
});

// ── REVIEW #6 ───────────────────────────────────────────────────────────────

test('no error correction asks for more than the German prompt names — REVIEW #6 BLOCKER 2', () => {
  // The whole pool, both levels: the rule is about German, not about a syllabus.
  for (const item of [...ALL, ...POOL_A12.items]) {
    assert.equal(ambiguousCorrection(item), false, `ambiguous correction: ${label(item)}`);
  }
  // `extra-a11-l05-09` as round 5 wrote it: „Ein Schere ist hier." carries ONE
  // error (the genus of the indefinite article), so `Eine Schere ist hier.` is
  // the minimal and complete correction — and the key accepted only an answer
  // that ALSO swaps the article family, which no German prompt field asks for.
  const trap = {
    id: 'ac1', topic: 'definite-articles', type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Ein Schere ist hier.“',
    questionEn: 'Fix the article.',
    answer: 'Die Schere ist hier.',
    accepted: ['Die Schere ist hier.', 'Die Schere ist hier'],
  };
  assert.equal(exclusionReason(trap), REASON.AMBIGUOUS_CORRECTION);
  // The build's repair: the minimal correction is computed and accepted, and
  // the item then passes — both readings are right, which is what makes the
  // prompt honest without anyone guessing at the author's intent.
  assert.equal(minimalArticleCorrection(trap), 'Eine Schere ist hier.');
  assert.equal(
    exclusionReason({ ...trap, accepted: [...trap.accepted, 'Eine Schere ist hier.', 'Eine Schere ist hier'] }),
    null,
    'accepting the minimal correction is what closes the finding',
  );
  // The author's own repair closes it too, from the other side: a prompt that
  // NAMES the family it wants is not ambiguous — that is the shipped item.
  assert.equal(
    ambiguousCorrection({ ...trap, questionDe: 'Korrigieren Sie: „Ein Schere ist hier.“ (mit bestimmtem Artikel)' }),
    false,
    'the German prompt names the definite article, so the swap is the task',
  );
  assert.equal(
    ambiguousCorrection({ ...trap, questionDe: 'Korrigieren Sie: „Ein Schere ist hier.“ (bestimmter Artikel)' }),
    false,
  );
  // …and the corrections that are NOT ambiguous: one family, one solution.
  for (const [questionDe, answer] of [
    ['Korrigieren Sie: „Das ist eine Tisch.“', 'Das ist ein Tisch.'],
    ['Korrigieren Sie: „Der Sonne ist warm.“', 'Die Sonne ist warm.'],
    ['Korrigieren Sie: „Du bist müde?“', 'Bist du müde?'],
    ['Korrigieren Sie: „Ich fahre nach der Bahnhof.“', 'Ich fahre zum Bahnhof.'],
  ]) {
    assert.equal(
      ambiguousCorrection({ id: 'ac2', type: 'error_correction', questionDe, answer, accepted: [answer] }),
      false,
      questionDe,
    );
  }
  // The half the build may NOT repair: `ein` is `der` or `das`, and picking a
  // gender is authorship. Nothing is computed, so the gate drops the item.
  const ungendered = {
    id: 'ac3', type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Die Heft ist neu.“', answer: 'Ein Heft ist neu.',
    accepted: ['Ein Heft ist neu.'],
  };
  assert.equal(ambiguousCorrection(ungendered), true);
  assert.equal(minimalArticleCorrection(ungendered), null, 'der or das — a build step may not choose');
});

test('every polite-form item of the BUILT pool is case-strict — REVIEW #6 BLOCKER 1', () => {
  // THIS ONE IS ABOUT THE ARTEFACT: the flag is written by
  // `scripts/build-lesson-pool.mjs`, so it can only be proven on a11.json /
  // a12.json. Round 5 closed the same finding as a list of three ids and round
  // 6 measured two more items of the same shape without the flag — one of them
  // in the graded Checkpoint 4 — which is why the flag is derived now.
  for (const item of [...POOL.items, ...POOL_A12.items]) {
    if (!isPoliteFormItem(item)) continue;
    assert.equal(item.caseSensitive, true, `polite form without caseSensitive: ${label(item)}`);
  }
  // the two items the review names, and what makes them different
  assert.equal(isPoliteFormItem({ answer: 'Sie', accepted: ['Sie'] }), true);
  assert.equal(isPoliteFormItem({ answer: 'Ihnen', accepted: ['Ihnen'] }), true);
  assert.equal(isPoliteFormItem({ answer: 'Das ist Ihre Adresse.', accepted: ['Das ist Ihre Adresse'] }), true);
  // an item that accepts the lowercase spelling is not teaching the capital —
  // `extra-a11-l12-10` („sie, Plural" → ihre) and `extra-a11-l03-02` (the
  // sister, → sie) both accept both, and marking them case-strict is the
  // mistake round 5 made in the other direction.
  assert.equal(isPoliteFormItem({ answer: 'Ihre', accepted: ['Ihre', 'ihre'] }), false);
  assert.equal(isPoliteFormItem({ answer: 'Sie', accepted: ['Sie', 'sie'] }), false);
  // a sentence answer counts only for the POSSESSIVE, and only away from
  // position 1: a word-order item may not become wholly wrong over a capital.
  assert.equal(
    isPoliteFormItem({ answer: 'Fahren Sie morgen nach Deutschland?', accepted: ['Fahren Sie morgen nach Deutschland'] }),
    false,
  );
  assert.equal(isPoliteFormItem({ answer: '', accepted: [] }), false);
});

test('no item accepts a verb its own frame rules out — REVIEW #6 MAJOR 10', () => {
  // "Gehst du morgen mit dem Bus?" is not German: one fährt or kommt mit dem
  // Bus. The equivalence table is per LEMMA, the language is per FRAME, so the
  // build no longer widens an answer key on the guess that an item which
  // already allows two lemmas meant its frame to be open.
  const WITH_VEHICLE = /\bmit (dem|der) \w+/i;
  const GEHEN_FORM_RE = /^(gehe|gehst|geht|gehen)$/i;
  for (const item of [...POOL.items, ...POOL_A12.items]) {
    if (!WITH_VEHICLE.test(String(item.questionDe || ''))) continue;
    for (const a of [item.answer, ...(item.accepted || [])]) {
      assert.ok(
        !GEHEN_FORM_RE.test(String(a || '').trim()),
        `a form of gehen with a vehicle: ${label(item)} — accepted ${a}`,
      );
    }
  }
});

test('a number item drills numbers, not the verb it is filed under — REVIEW #6 MAJOR 9', () => {
  // The four L2 items ("… ist null eins ___ sechs. (7)" → sieben) sat under
  // `topic: 'verb-sein'` because that is what Lektion 2 routes on, and every
  // miss was diagnosed as Konjugation. `drillsSlug` reads what the learner
  // PRODUCES, so the number topic has a predicate of its own.
  const item = {
    id: 'n1', topic: 'numbers', type: 'fill_blank',
    questionDe: 'Ergänzen Sie: Meine Telefonnummer ist null eins ___ sechs. (7)',
    answer: 'sieben', accepted: ['sieben'],
  };
  assert.equal(drillsSlug(item, 'numbers'), true);
  assert.equal(drillsSlug({ ...item, answer: 'zwölf', accepted: ['zwölf'] }, 'numbers'), true);
  assert.equal(drillsSlug({ ...item, answer: 'dreißig', accepted: ['dreißig'] }, 'numbers'), true);
  // and what it may not count: the verb item next to it in the same Lektion
  assert.equal(
    drillsSlug({ id: 'n2', topic: 'numbers', type: 'fill_blank', questionDe: 'Ich ___ Anna.', answer: 'bin', accepted: ['bin'] }, 'numbers'),
    false,
  );
  // every item the pool files under the topic really drills it
  for (const it of [...POOL.items, ...POOL_A12.items].filter((i) => i.topic === 'numbers')) {
    assert.equal(drillsSlug(it, 'numbers'), true, `filed under numbers but drills something else: ${label(it)}`);
  }
});
