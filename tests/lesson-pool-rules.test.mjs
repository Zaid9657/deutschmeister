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
  ambiguousCorrection, minimalArticleCorrection, isPoliteFormItem, drillsSlug, isNumberWord,
  politeCaseItem, POLITE_CUE_RE, INFORMAL_VETO_RE, carriesPoliteForm, NEXT_LEVEL_RE, UNTAUGHT_ANSWER_FORMS, UNTAUGHT_ANSWER_FORM_RE, untaughtForm,
  unconditionedRule, unconditionedRuleSentence, namesCondition,
  frontableOrders, frontedAcceptedForms, missingFrontedOrder, agreementAmbiguity,
  FRONTABLE_ADVERBIAL_RE, genderPairAmbiguity, genderPartners,
} from '../src/data/lessonPools/quality.js';
import { levelLexicon, untaughtTokens, levelSpec, minLektionIndex } from '../scripts/validate-curriculum.mjs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

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

test('an item that NAMES its register is case-strict, whatever shape its answer has — REVIEW #9 MAJOR 4', () => {
  // The predicate used to read the item's self-declaration (`POLITE_CUE_RE` over
  // prompt, hint and explanation) only for ONE-WORD answers; a sentence answer
  // was judged by the POSITION of the polite form alone. Measured in round 9:
  // three items whose own German prompt says „Schreiben Sie die höfliche Frage"
  // forgave a lowercase `sie` as a TYPO, while `83bab298` („Das ist Ihre
  // Adresse.") graded the same miss wrong. The task decides, not the word shape.
  //
  // As a CLASS over both built pools, with no id list: name the register in your
  // own text and carry a polite form in your answer key, and the flag is on.
  const declared = [];
  for (const item of [...POOL.items, ...POOL_A12.items]) {
    const text = [item.questionDe, item.questionEn, item.explanationDe, item.hint]
      .map((t) => String(t ?? '')).join(' ');
    if (!POLITE_CUE_RE.test(text) || INFORMAL_VETO_RE.test(text)) continue;
    const acc = [item.answer, ...(item.accepted || [])].map((a) => String(a ?? '').trim()).filter(Boolean);
    if (!acc.length || !acc.every(carriesPoliteForm)) continue;
    // …unless the item accepts both spellings, which is the author saying the
    // capital is not the task (clause 1 of the predicate).
    if (acc.some((a) => acc.some((b) => a !== b && a.toLowerCase() === b.toLowerCase()))) continue;
    declared.push(item);
    assert.equal(
      item.caseSensitive, true,
      `the prompt names the register but the capital is forgiven: ${label(item)} — ${item.questionDe}`,
    );
  }
  assert.ok(declared.length >= 3, 'the class must not be empty — the regexes drifted');

  // the predicate itself, both directions
  assert.equal(
    politeCaseItem({
      questionDe: 'Schreiben Sie die höfliche Frage: [Sie / in Berlin / wohnen]',
      answer: 'Wohnen Sie in Berlin?', accepted: ['Wohnen Sie in Berlin'],
    }),
    true,
    'a declared register is a case task even at position 2 of a sentence',
  );
  // THE INVERSE, and it is the half that matters: a bare mid-sentence `Sie` with
  // NO declaration stays lenient. `a1.1-cp1-hoeren-3` is a graded dictation — a
  // learner copying a heard line cannot hear the capital.
  assert.equal(
    politeCaseItem({
      questionDe: 'Hören Sie zu und schreiben Sie den Satz.',
      answer: 'Bitte füllen Sie das Formular aus.', accepted: ['Bitte füllen Sie das Formular aus'],
    }),
    false,
    'no cue, no address, sentence-internal Sie: still a typo, not a wrong answer',
  );
  // and the veto still beats the declaration
  assert.equal(
    politeCaseItem({
      questionDe: 'Schreiben Sie die höfliche Frage: [Sie / Kinder / haben]',
      explanationDe: 'Hier duzen wir, die Frage ist informell.',
      answer: 'Haben Sie Kinder?', accepted: ['Haben Sie Kinder'],
    }),
    false,
  );
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
  // the compounds, which is every German number above twenty and which no list
  // could carry (0–100 alone is 101 strings), and the digit form an item may
  // legitimately ask back (a Hausnummer, a segment of a Telefonnummer)
  for (const w of ['einundzwanzig', 'siebenundsechzig', 'hundertzwanzig', 'einhundertdrei', 'dreißig', '42']) {
    assert.equal(isNumberWord(w), true, w);
  }
  for (const w of ['bin', 'Bahnhof', 'sieber', '']) assert.equal(isNumberWord(w), false, w);
  assert.equal(drillsSlug({ ...item, answer: 'einundzwanzig', accepted: ['einundzwanzig'] }, 'numbers'), true);
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

// --- REVIEW #6 MAJOR 4 -----------------------------------------------------

/**
 * THE LEGACY HALF of each built pool: the items whose id is an exercise id of
 * `grammar-content-cache.json`. That is the build's own definition of "legacy"
 * — the hand-written extras carry an `extra-<level>-lNN-` id and the generated
 * buchstabieren supplement carries a hash-derived one, and neither is in the
 * cache — so the test and `scripts/build-lesson-pool.mjs` partition the shipped
 * pool the same way rather than by two guesses at a naming convention.
 */
const CACHE_IDS = new Set(read('grammar-content-cache.json').exercises.map((e) => e.id));
const legacyOf = (pool) => pool.items.filter((i) => CACHE_IDS.has(i.id));

test('no shipped legacy item carries a word the course never teaches — REVIEW #6 MAJOR 4', () => {
  // THE CLASS UNDER RULE 11. RULE 11/11b measure a VORGRIFF — a word the course
  // teaches LATER than the Lektion the item is met in — and a Vorgriff is
  // repairable by moving the item. Five review rounds kept re-finding a
  // different class underneath, one id at a time: legacy bank items built on
  // words the course teaches NOWHERE, at any Lektion (`Honig`, `König`,
  // `Instrument`, `Freiheit`, `Zeitung`, and the cast names `Tom` and `Anna`,
  // who appear in no A1.1 dialogue). The build drops them before the merge; this
  // is what makes the drop provable in the artefact a learner is served.
  //
  // HAND-WRITTEN EXTRAS AND THE GENERATED SUPPLEMENT ARE NOT IN SCOPE, on
  // purpose: they are authored from the curriculum and are RULE 11's business,
  // where a Vorgriff is a work order rather than a build-time deletion. Deleting
  // authored work silently is the failure mode this scoping avoids.
  // A1.2 IS PAUSED, and its pool is a DRAFT nobody may rebuild (owner decision, 2026-09-13). Round
  // 11 narrowed the lexicon — a function word is taught from the Lektion that first SAYS it, not
  // from a 159-word list seeded at Lektion 1 (DaF review #10, MAJOR 3) — and ten legacy A1.2 items
  // use a function word of A1.2's own list that no A1.2 input ever says: the modal paradigm above
  // all. At A1.1 the build DROPS such items, which is what this test proves; at A1.2 the build
  // cannot be run, so the ten are listed and pinned by id. Whoever resumes A1.2 runs
  // `node scripts/build-lesson-pool.mjs a1.2` and this list goes to empty with the rebuild.
  const A12_PAUSED_LEGACY = [
    '8a22bb70 dative-prepositions-intro: meinem', '969b1a66 dative-prepositions-intro: einem',
    '76e16958 modal-verbs-intro: kann', '6d645a9c modal-verbs-intro: Kannst',
    '07cfcdf8 modal-verbs-intro: kann', 'a00fa718 modal-verbs-intro: musst',
    '8b24d4df modal-verbs-intro: Kannst', '92d30d06 modal-verbs-intro: wollt',
    'ffec17c9 modal-verbs-intro: willst', 'b2e95a73 perfekt-intro: hatten',
  ];
  for (const [level, pool] of [['a1.1', POOL], ['a1.2', POOL_A12]]) {
    const spec = levelSpec(level);
    const lexicon = levelLexicon(level);
    const offenders = legacyOf(pool)
      .map((item) => ({ item, tokens: untaughtTokens(item, lexicon, spec) }))
      .filter((o) => o.tokens.length);
    assert.deepEqual(
      offenders.map((o) => `${o.item.id.slice(0, 8)} ${o.item.topic}: ${o.tokens.join(', ')}`)
        .filter((line) => level === 'a1.1' || !A12_PAUSED_LEGACY.includes(line)),
      [],
      `${level}: ${offenders.length} legacy item(s) use words ${level} never teaches — rebuild the pool`,
    );
    // and the partition is real: a level whose legacy half is empty would pass
    // the assertion above without measuring anything.
    assert.ok(legacyOf(pool).length > 50, `${level}: only ${legacyOf(pool).length} legacy items found — the id partition broke`);
  }
});

/**
 * THE FUNCTION WORDS ARE BOUND TO THE LEKTION THAT SAYS THEM (DaF review #10, MAJOR 3).
 *
 * The lexicon behind `minLektion` used to seed all 159 FUNCTION_WORDS at Lektion 1, so every
 * case-inflected determiner was „taught“ before the course had said a word and the stamp could not
 * see a deferral made of them. It now binds each of them to the first Lektion whose dialogue or
 * Notice card uses it. These probes are the measurement, in both directions.
 *
 * THE REVIEW'S OWN CASE, MEASURED RATHER THAN ASSUMED. It reports `extra-a11-l03-12` („Der Mann
 * **von meiner** Schwester …“) as a Lektion 3 item carrying a dative possessive the course never
 * teaches, and asks for it to stamp on 12. It stamps on 3 — and that is right, because Lektion 3's
 * own dialogue says the sentence: line 10, Ana: „Ja, ein Baby. Der Mann von meiner Schwester kommt
 * auch aus Marokko.“ The item is verbatim from the input of its own Lektion, which is the rule the
 * course is built on. The assertion below pins BOTH halves — the stamp and the line it rests on —
 * so the day that dialogue line changes, the stamp is re-measured with it.
 */
test('a function word is taught from the Lektion that first says it — round 11', () => {
  const l3 = CURRICULUM_A11.lektionen.find((l) => l.nr === 3);
  const line = (l3.dialog.lines || []).map((x) => x.de).find((de) => de.includes('von meiner Schwester'));
  assert.ok(line, 'Lektion 3 must still be the Lektion that says „von meiner Schwester“ — re-measure the stamp if it is not');

  const minLektionOf = minLektionIndex('a1.1');
  const at = (questionDe) => minLektionOf({ questionDe, answer: '' });
  const probes = [
    ['Der Mann von meiner Schwester kommt aus Marokko.', 3, 'the L3 dialogue says it verbatim'],
    ['Ich brauche einen Computer.', 6, '`einen` and `Computer` are both Lektion 6'],
    ['Fährst du morgen mit dem Bus?', 10, '`Bus` is Lektion 10'],
    ['Das ist in einem Haus.', null, '`einem` occurs in no dialogue and in no notice of the level'],
  ];
  assert.deepEqual(
    probes.map(([q]) => `${q} → ${at(q)}`),
    probes.map(([q, want]) => `${q} → ${want}`),
    'the minLektion stamp no longer reflects where the course says its function words',
  );
});

test('every pool item carries the minLektion the validator recomputes — round 10', () => {
  // THE STAMP THE DRAW FILTERS ON. `scripts/build-lesson-pool.mjs` writes `minLektion` onto every
  // item: the first Lektion by which the course has taught every German word of the item, measured
  // with the validator's own per-Lektion lexicon. `pickPracticeItems` then refuses to serve an item
  // above the Lektion it draws for, which is what makes RULE 11b 0 BY CONSTRUCTION rather than a
  // ratchet a repair round chases after every change to the draw (commit 217c958 made the draw
  // fresh per attempt and the old ratchet of 4 immediately measured 13).
  //
  // A STAMP THAT DRIFTS FROM THE LEXICON IS WORSE THAN NO STAMP, because the filter would then be
  // enforcing yesterday's vocabulary silently. So this does not spot-check ids: it recomputes the
  // whole column from `minLektionIndex` and compares item by item. It fails the moment the pool is
  // stale against the curriculum — the remedy is `node scripts/build-lesson-pool.mjs a1.1`.
  const minLektionOf = minLektionIndex('a1.1');
  const wrong = [];
  const missing = [];
  for (const item of POOL.items) {
    if (!Object.prototype.hasOwnProperty.call(item, 'minLektion')) { missing.push(item.id); continue; }
    const expected = minLektionOf(item);
    if (item.minLektion !== expected) wrong.push(`${item.id} stamped ${item.minLektion}, lexicon says ${expected}`);
  }
  assert.deepEqual(missing, [], `${missing.length} pool item(s) carry no minLektion — rebuild the pool`);
  assert.deepEqual(wrong, [], `${wrong.length} stale minLektion stamp(s) — rebuild the pool:\n  - ${wrong.join('\n  - ')}`);

  // The column is a measurement, not a constant: every Lektion must be reachable by some item, or
  // a filter bug that stamped everything L1 (or everything L12) would pass the equality above.
  const stamped = POOL.items.filter((it) => Number.isInteger(it.minLektion));
  assert.ok(stamped.length > 250, `only ${stamped.length} items carry a numeric minLektion`);
  const byNr = new Set(stamped.map((it) => it.minLektion));
  for (const l of CURRICULUM_A11.lektionen) {
    assert.ok(byNr.has(l.nr), `no item in the pool becomes servable at L${l.nr} — the stamp is degenerate`);
  }
  // `null` is legal and means „the course never teaches all of this item's words“, so no Lektion
  // may serve it. Those items are RULE 11's work order; the draw simply never reaches them.
  for (const it of POOL.items) {
    assert.ok(it.minLektion === null || Number.isInteger(it.minLektion), `${it.id}: minLektion is ${it.minLektion}`);
  }
});

test('the per-topic floor still holds after the untaught-lexis drop', () => {
  // Unchanged in substance from the floor test above — seven is one Lektion's
  // practice set — but stated over the BUILT pools of both levels, because the
  // untaught-lexis gate removes legacy items and a topic can only thin out
  // here. If this fails, the remedy is hand-written extras on the named topic;
  // lowering the floor would hide a Lektion drawing the same item twice.
  const thin = [];
  for (const [level, pool] of [['a1.1', POOL], ['a1.2', POOL_A12]]) {
    const perTopic = new Map();
    for (const it of pool.items) perTopic.set(it.topic, (perTopic.get(it.topic) || 0) + 1);
    for (const [topic, n] of perTopic) if (n < 7) thin.push(`${level} ${topic}: ${n}`);
  }
  // `numbers` (a1.1) is a PRACTICE-ONLY topic supplied entirely by the
  // hand-written extras and has stood at 4 since it was introduced — it is not
  // a casualty of the lexis gate (the gate dropped 0 items from it). It is named
  // here rather than filtered out, so the day it is filled the list gets shorter.
  assert.deepEqual(thin, ['a1.1 numbers: 4'], `topics under the 7-item floor — hand-written extras needed:\n  ${thin.join('\n  ')}`);
});


// --- REVIEW #7 ------------------------------------------------------------

/**
 * BLOCKER 3. The graded final checkpoint asked for a form the course files
 * under the NEXT level and marked the form its own rule card teaches wrong:
 * `03bd1113` shipped as `a1.1-cp4-bausteine-4` („Hast du ___ Schlüssel? (du —
 * Vorschau Akkusativ)" → `deinen`), one of six Sprachbausteine in a section
 * that passes at 40 %, on a `STRICT_TOPIC` with no typo tolerance — so `dein`,
 * which L12's notice and the `possessive-articles` card teach for a masculine
 * noun, came back red. Its twin `64680d9b` sat in the pool, drawable from the
 * same `practiceRule.topics`, which is what makes it a CLASS.
 *
 * The rule is the inverse of RULE 6b and it is stated over the WHOLE pool: no
 * item a learner can be drawn or tested on may demand a form that no notice and
 * no rule card of the level introduces.
 */
test('no item of the built pool announces a form of the next level — REVIEW #7 BLOCKER 3', () => {
  const offenders = POOL.items.filter((it) =>
    NEXT_LEVEL_RE.test([it.questionDe, it.questionEn, it.explanationDe, it.hint].map((t) => String(t ?? '')).join(' ')));
  assert.deepEqual(offenders.map(label), [], 'the pool a learner is drawn and tested from carries a Vorgriff');
  // …and the shape itself, so the rule outlives the two ids it was found on.
  assert.equal(
    exclusionReason({
      id: 'nl', topic: 'possessive-articles', questionDe: 'Hast du ___ Schlüssel? (du — Vorschau Akkusativ)',
      answer: 'deinen', explanationDe: 'Vorschau auf den Akkusativ (A1.2): nach haben bekommt maskulin die Endung -en.',
    }),
    REASON.UNTAUGHT_FORM,
  );
});

test('no item of the built pool demands an untaught answer form — REVIEW #7 BLOCKER 3', () => {
  for (const item of POOL.items) {
    for (const a of [item.answer, ...(item.accepted || [])]) {
      for (const w of String(a ?? '').split(/\s+/)) {
        assert.doesNotMatch(w.replace(/[.,!?;:]/g, ''), UNTAUGHT_ANSWER_FORM_RE, `untaught answer form: ${label(item)}`);
      }
    }
  }
  // The class, not the instance: the same demand without the confession.
  assert.equal(
    exclusionReason({ id: 'uf', topic: 'possessive-articles', questionDe: 'Ich sehe ___ Bruder. (ich)', answer: 'meinen' }),
    REASON.UNTAUGHT_FORM,
  );
  assert.equal(
    exclusionReason({ id: 'uf2', topic: 'possessive-articles', questionDe: 'Wie heißt ___ Bruder? (du)', answer: 'dein' }),
    null,
    'the form L12 teaches is not a Vorgriff',
  );
});

test('the twins the review names are out, and Checkpoint 4 fills the seat from the same topic', () => {
  for (const id of ['03bd1113-6ab0-589d-b0d6-12f03d5c1952', '64680d9b-3681-560d-ada9-a64d0aa329aa']) {
    assert.ok(!POOL.items.some((i) => i.id === id), `${id} is still in the built pool`);
    const item = ALL.find((i) => i.id === id);
    if (item) assert.equal(exclusionReason(item, { level: 'a1.1' }), REASON.UNTAUGHT_FORM, id);
  }
  // The topic the graded checkpoint draws them from is still above a Lektion's
  // worth of items, so the seat is filled rather than left empty.
  const n = POOL.items.filter((i) => i.topic === 'possessive-articles').length;
  assert.ok(n >= 7, `only ${n} possessive-articles items left for Checkpoint 4 to draw from`);
});

test('untaught-form is level-scoped, like the ordinal: meinen is ordinary German at A1.2', () => {
  const item = { id: 'uf3', topic: 'possessive-articles', questionDe: 'Ich sehe ___ Bruder. (ich)', answer: 'meinen' };
  assert.equal(exclusionReason(item), REASON.UNTAUGHT_FORM, 'no level named → the strict default');
  assert.equal(exclusionReason(item, { level: 'a1.1' }), REASON.UNTAUGHT_FORM);
  assert.equal(exclusionReason(item, { level: 'a1.2' }), null);
  assert.equal(exclusionReason(item, { level: 'a2.1' }), null);
});

test('the off-limits list is MEASURED against the course, not asserted — REVIEW #7 BLOCKER 3', async () => {
  // The rule says "a form no notice and no rule card of the level introduces".
  // A hand-kept list can drift into banning a form the course DOES teach, which
  // would fail the learner on the level's own material — so the list is checked
  // against the material.
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { RULE_CARDS } = await import('../netlify/functions/_shared/ruleCards.mjs');
  const A11_TOPICS = new Set(POOL.items.map((i) => i.topic));
  const taught = [
    ...CURRICULUM_A11.lektionen.flatMap((l) => [l.notice?.title, l.notice?.bodyDe, ...(l.notice?.examples || [])]),
    ...Object.entries(RULE_CARDS).filter(([slug]) => A11_TOPICS.has(slug)).map(([, card]) => JSON.stringify(card)),
  ].join(' ').split(/[^0-9A-Za-zÄÖÜäöüß]+/);
  const introduced = UNTAUGHT_ANSWER_FORMS.filter((f) => taught.some((w) => w.toLowerCase() === f.toLowerCase()));
  assert.deepEqual(introduced, [], 'the list bans a form an A1.1 notice or rule card introduces');
  // The counter-check, and the reason `einen`/`keinen` are deliberately NOT on
  // the list: L6's notice introduces exactly that form, with an example, so an
  // item asking for it asks for something the course has shown.
  assert.ok(taught.some((w) => w === 'einen'), 'L6 no longer introduces ein → einen — re-measure the off-limits list');
  assert.equal(untaughtForm({ id: 'e', questionDe: 'Der Chef braucht ___ Computer. (unbestimmter Artikel)', answer: 'einen' }), false);
});

/**
 * BLOCKER 1. Round 6 closed review #6's polite-capital finding with the very
 * answer-FORM regex round 5 had removed from `isCaseTask`, one layer up — and
 * both error directions were measured: three items whose own text says nothing
 * polite is taught here carried `caseSensitive: true`, while the sentence
 * clause, narrowed to `Ihr…`, never reached `Sie` or `Ihnen` inside a sentence.
 * The predicate now asks whether the capital is the TASK.
 */
test('the polite capital is a task signal, not an answer form — REVIEW #7 BLOCKER 1', () => {
  const t = (o) => politeCaseItem(o);
  // The three FALSE POSITIVES the review measured, verbatim.
  assert.equal(t({ questionDe: '___ ist meine Mutter.', answer: 'Sie', accepted: ['Sie'], explanationDe: 'Mutter = weiblich → sie.' }), false);
  assert.equal(t({
    questionDe: 'Die Tasche ist teuer. ___ ist schön.', answer: 'Sie', accepted: ['Sie'],
    explanationDe: 'Die Tasche ist feminin, deshalb wird sie zu sie.',
  }), false);
  assert.equal(t({
    questionDe: '___ seid meine Freunde.', questionEn: '___ are my friends. (= you all, informal plural)',
    answer: 'Ihr', accepted: ['Ihr'], explanationDe: 'Ihr spricht mehrere Personen informell an.',
  }), false, 'an item that calls itself informell is not a polite-form item');
  // The TASK, in each of its three shapes.
  assert.equal(t({
    questionDe: 'Ist das ___ Geschenk, Frau Kaya? (Sie)', answer: 'Ihr', accepted: ['Ihr'],
    explanationDe: 'Höflich zu Frau Kaya: Ihr mit großem I.',
  }), true, 'the prompt names the formal counterpart');
  assert.equal(t({
    questionDe: 'Guten Tag! Wie geht es ___?', answer: 'Ihnen', accepted: ['Ihnen'], explanationDe: 'Mit großem I.',
  }), true, 'Ihnen has no lowercase reading of its own');
  assert.equal(t({ accepted: ['Gut. Wie geht es Ihnen?'] }), true, 'the FALSE NEGATIVE: Ihnen inside a sentence');
  assert.equal(t({ accepted: ['Das ist Ihr Name.', 'Hier ist Ihre Adresse.'] }), true, 'a non-initial possessive Ihr');
  assert.equal(t({ accepted: ['Sie', 'Sie'] }), true, 'a review card carries no prompt: the answer key is all there is');
  // …and the three shapes it must NOT reach.
  assert.equal(t({ questionDe: '___ Geschenke sind hier. (sie, Plural)', answer: 'Ihre', accepted: ['Ihre', 'ihre'] }), false,
    'an item that accepts both spellings is not teaching the capital');
  // REVIEW #9 MAJOR 4 REVERSED THIS PIN, and the reason is in the item's own
  // prompt: „Bilden Sie die HÖFLICHE Frage" — the task names the register, twice,
  // so the capital IS what is being asked. Round 7 read it as a pure word-order
  // item and forgave the miss; a learner who writes „Fahren sie …?" has written
  // „do THEY drive", which is not the task. What stays lenient is the shape below
  // and `a1.1-cp1-hoeren-3`: a sentence-internal `Sie` whose text names nothing.
  assert.equal(t({
    questionDe: 'Bilden Sie die höfliche Frage: [fahren / Sie / morgen / nach Deutschland]',
    answer: 'Fahren Sie morgen nach Deutschland?', accepted: ['Fahren Sie morgen nach Deutschland?'],
    explanationDe: 'Höfliche Frage mit Sie: Verb zuerst, dann Sie.',
  }), true, 'the task names the register, so the capital is the task');
  assert.equal(t({
    questionDe: 'Ordnen Sie: [morgen / fahren / Sie / nach Deutschland]',
    answer: 'Fahren Sie morgen nach Deutschland?', accepted: ['Fahren Sie morgen nach Deutschland?'],
  }), false, 'the same word order with NO declared register stays lenient');
  assert.equal(t({ accepted: ['Sie kostet acht Euro.'] }), false, 'a sentence-initial capital says nothing about register');
});

test('every polite-form item of the built pool is case-strict, and no informal item is', () => {
  for (const item of POOL.items) {
    if (politeCaseItem(item)) {
      assert.equal(item.caseSensitive, true, `derived polite item is not case-strict: ${label(item)}`);
    }
    const text = [item.questionDe, item.questionEn, item.explanationDe].map((x) => String(x ?? '')).join(' ');
    if (/informell|informal/i.test(text)) {
      assert.notEqual(item.caseSensitive, true, `an item that calls itself informell is case-strict: ${label(item)}`);
    }
  }
  // The predicate the build stamps with and the one the review cards derive from
  // are ONE function — the alias is what both sides import.
  assert.equal(isPoliteFormItem, politeCaseItem);
});


// --- REVIEW #11 -----------------------------------------------------------

/**
 * BLOCKER. `extra-a11-l06-14` explained „Nach brauchen wird ein zu einen: einen
 * Computer." — a rule stated without the condition it holds under, and therefore
 * false: after `brauchen` only MASKULIN `ein` becomes `einen`. The learner who
 * applies it writes „Ich brauche einen Pause", which is the error sentence of
 * `extra-a11-l06-12` in the very same drawn seven.
 *
 * THE GUARD MUST PASS ITS OWN COUNTER-SAMPLE. The five sentences the review
 * measured are the fixture; a rule that does not catch them is not a rule.
 */
const FALSE_RULE_PROBES = [
  ['extra-a11-l06-14', 'Nach brauchen wird ein zu einen: einen Computer.', 'transformation'],
  ['4aae7de0', 'Handy ist neutral, deshalb ein, wie bei maskulinen Nomen.', 'cross-gender'],
  ['fb88c1bb', 'Wir steht immer mit haben.', 'absolute-quantifier'],
  ['3c9fff52', 'Du steht immer mit hast.', 'absolute-quantifier'],
  ['885e0528', 'Wir steht immer mit sind.', 'absolute-quantifier'],
];

/**
 * The correct, CONDITIONED explanations the same pool carries — including the
 * three the course already writes for exactly the rule the blocker got wrong,
 * and the two sentences the review names as „must stay legal". A predicate that
 * rejects one of these has stopped measuring the condition and started
 * measuring the vocabulary.
 */
const CONDITIONED_PROBES = [
  'Nach brauchen wird maskulin ein zu einen.',
  'Nach haben wird maskulin ein zu einen.',
  'Computer ist maskulin: Nach brauchen wird maskulin ein zu einen.',
  'Im Plural haben alle Nomen die: die Lampen.',
  'Alle Pluralnomen nehmen die, egal welches Genus im Singular.',
  'Endung -ung ist immer feminin.',
  'Die Höflichkeitsform benutzt Sie/Ihr (immer großgeschrieben).',
  'Offizielle Zeit enthält immer Uhr, auch bei einer vollen Stunde.',
  'Auto ist neutral, deshalb das.',
  'Lehrer ist maskulin, deshalb die Verneinung kein.',
  'Der Stuhl ist maskulin, deshalb wird er zu er.',
  'der Bruder wird zu er.',
  'Bei er wird das e zu i: er spricht.',
  'Der Stamm von arbeiten endet auf -t, deshalb -e- einfügen: arbeitest.',
  // …and the A1.2 draft pool, which is where clause (D) and clause (B) were
  // measured from the other side (see the header of `unconditionedRule`).
  'Die Antwort nennt einen Ort, deshalb braucht die Frage wo.',
  'Lehrer bleibt auch nach der Inversion das Subjekt, deshalb bleibt der Artikel der, nicht den.',
  'wir wechselt den Vokal nie: sprechen bleibt regelmäßig.',
];

test('the unconditioned-rule guard catches every sentence the review measured — REVIEW #11 BLOCKER', () => {
  for (const [id, sentence, clause] of FALSE_RULE_PROBES) {
    const hit = unconditionedRuleSentence({ id, explanationDe: sentence });
    assert.ok(hit, `${id}: the guard does not catch „${sentence}“`);
    assert.equal(hit.clause, clause, `${id}: caught by the wrong clause`);
    assert.equal(
      exclusionReason({ id, topic: 'indefinite-articles', questionDe: 'Er ___ Hunger. (haben)', answer: 'hat', explanationDe: sentence }),
      REASON.UNCONDITIONED_RULE,
    );
  }
  // The hint carries an explanation too, and the review's shape fits in one.
  assert.equal(unconditionedRule({ id: 'h', explanationDe: '', hint: 'Wir steht immer mit haben.' }), true);
});

test('the unconditioned-rule guard leaves every conditioned explanation alone — REVIEW #11 BLOCKER', () => {
  for (const sentence of CONDITIONED_PROBES) {
    const hit = unconditionedRuleSentence({ id: 'c', explanationDe: sentence });
    assert.equal(hit, null, `false positive on „${sentence}“ (${hit && hit.clause})`);
  }
  // The three conditions, each on its own: a genus, a case, an explicit scope.
  assert.equal(namesCondition('maskulin'), true);
  assert.equal(namesCondition('im Akkusativ'), true);
  assert.equal(namesCondition('nur bei haben'), true);
  // A person counts — but not in a pairing, where the person is the thing being
  // quantified and the verb is the condition that is missing.
  assert.equal(namesCondition('wir wechselt den Vokal nie'), true, 'a person is a condition');
  assert.equal(namesCondition('Wir steht immer mit haben.'), false, 'in a pairing the person is not the condition');
});

test('no item a learner can be shown states a rule without its condition — REVIEW #11 BLOCKER', () => {
  for (const item of USABLE) {
    const hit = unconditionedRuleSentence(item);
    assert.equal(hit, null, `${label(item)} — ${hit && hit.clause}: „${hit && hit.sentence}“`);
  }
  // And the artefact itself, so a stale a11.json cannot ship the class either.
  for (const item of POOL.items) {
    assert.equal(unconditionedRule(item), false, `built pool: ${label(item)}`);
  }
});

test('the eleven measured items are out of the built pool, with their own reason — REVIEW #11', () => {
  const MEASURED = [
    '4aae7de0', 'fb88c1bb', 'f8f43902', '29557669', '3c9fff52', '7f2c06ad',
    '408d681a', '8d89816d', '338b13a7', '885e0528', '299cba23',
  ];
  for (const prefix of MEASURED) {
    assert.ok(!POOL.items.some((i) => String(i.id).startsWith(prefix)), `${prefix} is still in the built pool`);
  }
  // The topics they came out of still carry a Lektion's worth of items, so the
  // exclusion costs depth, not a draw.
  for (const topic of ['verb-haben', 'verb-sein', 'indefinite-articles']) {
    const n = POOL.items.filter((i) => i.topic === topic).length;
    assert.ok(n >= 7, `only ${n} ${topic} items left`);
  }
  // The hand-written extra of the same class was REPAIRED rather than dropped —
  // a build step may not guess the missing condition, an author may write it.
  const repaired = EXTRA.find((i) => i.id === 'extra-a11-l06-14');
  assert.ok(repaired, 'extra-a11-l06-14 is gone');
  assert.match(repaired.explanationDe, /maskulin/, 'the repaired explanation must name the condition');
  assert.equal(exclusionReason(repaired, { level: 'a1.1' }), null);
});

// --- the contradiction guard (REVIEW #11 BLOCKER, fourth clause) -----------
//
// The class has a second, measurable symptom: two items of the same topic state
// OPPOSITE rules for the same trigger. `fb88c1bb` („Wir steht immer mit haben.")
// and `885e0528` („Wir steht immer mit sind.") are the pair the review names,
// and they were drawn in the same Lektion. The extractor below reads the three
// statement shapes the pool actually writes — a pronoun/verb pairing, a
// „nach <Verb> wird … zu <Artikel>" transformation and a „<Nomen> ist <Genus>,
// deshalb <Artikel>" conclusion — and maps trigger → form. A trigger may map to
// two forms only when a GENUS distinguishes them (maskulin einen vs. feminin
// eine) or when the forms belong to different article families (der Computer,
// ein Computer).

const ARTICLE_FAMILY_OF = (form) => {
  const w = String(form || '').toLowerCase();
  if (['der', 'die', 'das', 'den', 'dem'].includes(w)) return 'bestimmt';
  if (['ein', 'eine', 'einen', 'einem', 'einer'].includes(w)) return 'unbestimmt';
  if (['kein', 'keine', 'keinen'].includes(w)) return 'verneint';
  return 'sonstige';
};

const GENUS_RE = /\b(maskulin|feminin|neutral|sächlich|plural|singular)\p{L}*/iu;

/** [{ family, trigger, genus, form }] — the rule statements a sentence makes. */
function ruleStatements(sentence) {
  const out = [];
  const genus = (GENUS_RE.exec(sentence) || [])[1]?.toLowerCase() || '';
  // Only an ABSOLUTE pairing is a rule that can contradict another: „Wir steht
  // IMMER mit haben." excludes „Wir steht immer mit sind.", while the pool's
  // „Singular-sie (she) steht mit hat, wie er und es." and „… steht mit ist …"
  // are two compatible facts about two different verbs, each scoped by its own
  // item — measured on the built pool, which carries exactly that pair.
  const absolute = /\b(immer|nie|niemals|ausnahmslos|alle|jede|jeder|jedes)\b/iu.test(sentence);
  const pairing = absolute
    ? /\b(ich|du|er|sie|es|wir|ihr)\b[^.!?]{0,20}\b(?:steht|stehen)\b[^.!?]{0,20}\bmit\s+(\p{L}+)/iu.exec(sentence)
    : null;
  if (pairing) out.push({ family: 'verbform', trigger: pairing[1].toLowerCase(), genus, form: pairing[2].toLowerCase() });
  const transform = /\bnach\s+(\p{L}+)\s+wird\b[^.!?]{0,30}\bzu\s+(\p{L}+)/iu.exec(sentence);
  if (transform) {
    out.push({
      family: `transform:${ARTICLE_FAMILY_OF(transform[2])}`,
      trigger: transform[1].toLowerCase(), genus, form: transform[2].toLowerCase(),
    });
  }
  const conclusion = /(\p{Lu}\p{L}+)\s+ist\s+\p{L}*(?:maskulin|feminin|neutral)\p{L}*[^.!?]{0,30}\bdeshalb\b[^.!?]{0,25}\b(der|die|das|den|dem|ein|eine|einen|kein|keine|keinen)\b/u.exec(sentence);
  if (conclusion) {
    out.push({
      family: `artikel:${ARTICLE_FAMILY_OF(conclusion[2])}`,
      trigger: conclusion[1].toLowerCase(), genus, form: conclusion[2].toLowerCase(),
    });
  }
  return out;
}

/** trigger → the forms the pool's explanations give it, keyed by family+genus. */
function contradictions(items) {
  const seen = new Map();
  for (const item of items) {
    for (const text of [item.explanationDe, item.hint]) {
      for (const sentence of String(text || '').split(/(?<=[.!?])\s+/)) {
        for (const st of ruleStatements(sentence.trim())) {
          const key = `${st.family}|${st.trigger}|${st.genus}`;
          const entry = seen.get(key) || new Map();
          if (!entry.has(st.form)) entry.set(st.form, `${item.id}: „${sentence.trim()}“`);
          seen.set(key, entry);
        }
      }
    }
  }
  return [...seen].filter(([, forms]) => forms.size > 1)
    .map(([key, forms]) => `${key} → ${[...forms.values()].join('  ⟂  ')}`);
}

test('the contradiction extractor sees the pair the review names — REVIEW #11 BLOCKER', () => {
  const clash = contradictions([
    { id: 'fb88c1bb', explanationDe: 'Wir steht immer mit haben.' },
    { id: '885e0528', explanationDe: 'Wir steht immer mit sind.' },
  ]);
  assert.equal(clash.length, 1, 'the guard does not see its own counter-sample');
  assert.match(clash[0], /verbform\|wir/);
  // …and the same trigger with two forms the GENUS distinguishes is not one.
  assert.deepEqual(contradictions([
    { id: 'a', explanationDe: 'Nach brauchen wird maskulin ein zu einen.' },
    { id: 'b', explanationDe: 'Nach brauchen bleibt feminin eine zu eine.' },
  ]), []);
  // Nor is der Computer / ein Computer: two article families, one noun.
  assert.deepEqual(contradictions([
    { id: 'c', explanationDe: 'Computer ist maskulin, deshalb der.' },
    { id: 'd', explanationDe: 'Computer ist maskulin, deshalb ein.' },
  ]), []);
});

test('no trigger of the built pool maps to two rules — REVIEW #11 BLOCKER', () => {
  assert.deepEqual(contradictions([...POOL.items, ...EXTRA]), []);
});

// ── REVIEW #12 ──────────────────────────────────────────────────────────────

test('a Wortsalat with a time or place Angabe has two word orders, and both are right — REVIEW #12 BLOCKER 1', () => {
  // The item the review measured, as round 12 shipped it: one accepted string,
  // and the order the course's own rule card teaches marked wrong.
  const trap = {
    id: 'fo1', topic: 'separable-verbs-intro', type: 'sentence_building',
    questionDe: 'Bilden Sie den Satz: [ich / haben / gestern / gearbeitet]',
    answer: 'Ich habe gestern gearbeitet.',
    accepted: ['Ich habe gestern gearbeitet.', 'Ich habe gestern gearbeitet'],
  };
  assert.deepEqual(frontableOrders(trap), ['Gestern habe ich gearbeitet']);
  assert.deepEqual(missingFrontedOrder(trap), ['Gestern habe ich gearbeitet']);
  // The build's repair closes it, in both spellings the pool uses.
  assert.deepEqual(frontedAcceptedForms(trap),
    ['Gestern habe ich gearbeitet.', 'Gestern habe ich gearbeitet']);
  assert.equal(missingFrontedOrder({ ...trap, accepted: [...trap.accepted, ...frontedAcceptedForms(trap)] }), null);

  // A separable prefix and a participle stay at the end, and a second Angabe
  // fronts on its own as well as together with the first.
  assert.deepEqual(frontableOrders({
    id: 'fo2', type: 'sentence_building',
    questionDe: 'Schreiben Sie den Satz: [er / abholen / dich / um 8 Uhr]',
    answer: 'Er holt dich um 8 Uhr ab.',
  }), ['Um 8 Uhr holt er dich ab']);
  assert.deepEqual(frontableOrders({
    id: 'fo3', type: 'sentence_building',
    questionDe: 'Bilden Sie den Satz: [der Termin / sein / am Dienstag / um acht Uhr]',
    answer: 'Der Termin ist am Dienstag um acht Uhr.',
  }), [
    'Am Dienstag ist der Termin um acht Uhr',
    'Um acht Uhr ist der Termin am Dienstag',
    'Am Dienstag um acht Uhr ist der Termin',
  ]);

  // The three shapes the rule may not touch: a question (its order IS the
  // task), a sentence with nothing to front, and an already-inverted canonical
  // whose first constituent is an OBJECT — there no build step can tell the
  // subject from the fronted part („Fußball spielen wir am Wochenende.").
  for (const item of [
    { id: 'fn1', type: 'sentence_building', questionDe: 'Bilden Sie die Frage: [mitkommen / du / am Freitag]', answer: 'Kommst du am Freitag mit?' },
    { id: 'fn2', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [wir / tanzen / zusammen]', answer: 'Wir tanzen zusammen.' },
    { id: 'fn3', type: 'sentence_building', questionDe: 'Schreiben Sie den Satz: [Fußball / wir / am Wochenende / spielen]', answer: 'Fußball spielen wir am Wochenende.' },
    { id: 'fn4', type: 'fill_blank', questionDe: 'Bilden Sie den Satz: [ich / haben / gestern / gearbeitet]', answer: 'Ich habe gestern gearbeitet.' },
  ]) {
    assert.deepEqual(frontableOrders(item), [], `${item.id}: the rule invented an order`);
    assert.equal(missingFrontedOrder(item), null, item.id);
  }

  // The class over the built A1.1 pool. A1.2 is paused by owner decision and its
  // pool is not rebuilt in this round, so it is measured by its own build when
  // it reopens — the rule is level-blind, the ARTEFACT is not.
  for (const item of POOL.items) {
    assert.equal(missingFrontedOrder(item), null,
      `${label(item)} refuses ${JSON.stringify(missingFrontedOrder(item))} — run \`node scripts/build-lesson-pool.mjs a1.1\``);
  }
});

test('an error correction has exactly one minimal repair — REVIEW #12 BLOCKER 2', () => {
  // The round-12 item, as it shipped: „Du habt Durst." repairs at the verb
  // („Du hast") and at the subject („Ihr habt"), and the prompt names neither.
  const trap = {
    id: 'ag1', topic: 'verb-haben', type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Du habt Durst.“',
    answer: 'Du hast Durst.',
    accepted: ['Du hast Durst.', 'Du hast Durst'],
  };
  assert.deepEqual(agreementAmbiguity(trap), { verb: ['habt', 'hast'], subject: 'Ihr habt Durst' });
  assert.equal(exclusionReason(trap), REASON.AMBIGUOUS_AGREEMENT);
  // The repair is the cue the course already carries fifteen times, and it is
  // authorship, not a build step: the prompt names the element that changes.
  const pinned = { ...trap, questionDe: 'Korrigieren Sie das Verb: „Du habt Durst.“' };
  assert.equal(agreementAmbiguity(pinned), null);
  assert.equal(exclusionReason(pinned), null);

  // The other axis of the same class: a singular subject under a plural verb is
  // repairable by pluralising the noun („die Abfahrt" → „die Abfahrten") or the
  // article alone where the plural is the bare singular („der Fahrer" → „die
  // Fahrer") — the plural L4 teaches.
  assert.equal(agreementAmbiguity({
    id: 'ag2', type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Sind die Abfahrt um neun Uhr?“',
    answer: 'Ist die Abfahrt um neun Uhr?',
  }).subject, 'Sind die Abfahrten um neun Uhr');
  assert.equal(agreementAmbiguity({
    id: 'ag3', type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Haben der Fahrer Verspätung?“',
    answer: 'Hat der Fahrer Verspätung?',
  }).subject, 'Haben die Fahrer Verspätung');

  // What the rule may NOT reach. A proper name has no second person and no
  // plural, so the verb is the only repair and the prompt owes no cue; and an
  // ARTICLE correction is the neighbouring rule's business — `eine`/`einen`
  // share a stem and must never read as a conjugation pair.
  for (const item of [
    { id: 'an1', type: 'error_correction', questionDe: 'Korrigieren Sie: „Lena spielen am Wochenende Fußball.“', answer: 'Lena spielt am Wochenende Fußball.' },
    { id: 'an2', type: 'error_correction', questionDe: 'Korrigieren Sie: „Ich brauche einen Pause.“', answer: 'Ich brauche eine Pause.' },
    { id: 'an3', type: 'error_correction', questionDe: 'Korrigieren Sie: „Das ist eine Tisch.“', answer: 'Das ist ein Tisch.' },
  ]) {
    assert.equal(agreementAmbiguity(item), null, `${item.id}: one repair, no cue owed`);
  }

  // The class, over both pools: the rule is about German, not about a syllabus.
  for (const item of [...ALL, ...POOL_A12.items]) {
    const hit = agreementAmbiguity(item);
    assert.equal(hit, null, `${label(item)} — also repairs as „${hit && hit.subject}“`);
  }
});

// ── REVIEW #13 ──────────────────────────────────────────────────────────────

test('frontability is derived from the item, not from a list of shapes — REVIEW #13 BLOCKER 1', () => {
  // The item the review measured. `von Beruf` was not on the round-12 list, so
  // the GRADED `a1.1-cp1-bausteine-2` marked „Von Beruf bin ich Lehrer." wrong
  // while the same Lektion's own pretest lists „Von Beruf bin ich" in accepted.
  const trap = {
    id: 'gp0', topic: 'verb-sein', type: 'sentence_building',
    questionDe: 'Bilden Sie den Satz: [ich / sein / Lehrer / von Beruf]',
    answer: 'Ich bin Lehrer von Beruf.',
    accepted: ['Ich bin Lehrer von Beruf.', 'Ich bin von Beruf Lehrer.'],
  };
  assert.deepEqual(frontableOrders(trap), ['Von Beruf bin ich Lehrer']);
  assert.deepEqual(missingFrontedOrder(trap), ['Von Beruf bin ich Lehrer']);
  assert.equal(missingFrontedOrder({ ...trap, accepted: [...trap.accepted, ...frontedAcceptedForms(trap)] }), null);

  // The retired list is kept as a POSITIVE FIXTURE: every shape it held must
  // still front under the derivation, or the generalisation lost something.
  const shapes = [
    ['gestern', 'Ich habe gestern gearbeitet.', 'Gestern habe ich gearbeitet'],
    ['heute', 'Wir kaufen heute ein.', 'Heute kaufen wir ein'],
    ['hier', 'Der Stuhl ist hier.', 'Hier ist der Stuhl'],
    ['am Dienstag', 'Der Termin ist am Dienstag.', 'Am Dienstag ist der Termin'],
    ['um 7 Uhr', 'Ich stehe um 7 Uhr auf.', 'Um 7 Uhr stehe ich auf'],
    ['im Mai', 'Mein Geburtstag ist im Mai.', 'Im Mai ist mein Geburtstag'],
    ['aus Marokko', 'Wir kommen aus Marokko.', 'Aus Marokko kommen wir'],
    ['nach Berlin', 'Der Zug fährt nach Berlin.', 'Nach Berlin fährt der Zug'],
    ['bei Anna', 'Das Fest ist bei Anna.', 'Bei Anna ist das Fest'],
    ['jeden Tag', 'Ich arbeite jeden Tag.', 'Jeden Tag arbeite ich'],
    ['nächste Woche', 'Der Kurs ist nächste Woche.', 'Nächste Woche ist der Kurs'],
    // …and the shapes the list did NOT hold, which is what the BLOCKER was about.
    ['von Beruf', 'Ich bin Lehrer von Beruf.', 'Von Beruf bin ich Lehrer'],
    ['mit dem Bus', 'Ich fahre mit dem Bus.', 'Mit dem Bus fahre ich'],
  ];
  for (const [chunk, answer, want] of shapes) {
    const item = {
      id: `fd-${chunk}`, type: 'sentence_building',
      questionDe: `Bilden Sie den Satz: [x / y / ${chunk}]`, answer,
    };
    assert.deepEqual(frontableOrders(item), [want], `„${chunk}“ no longer fronts`);
  }
  // Everything the old list held is still reached — read the other way round.
  for (const [chunk] of shapes) {
    if (!FRONTABLE_ADVERBIAL_RE.test(chunk)) continue;
    assert.ok(shapes.find(([c]) => c === chunk), chunk);
  }

  // The negatives the derivation owes, and they are the reason it is not „any
  // bracket chunk": a predicate nominal and an object are bare nouns AFTER the
  // verb and stay put; a separable prefix, a participle and an infinitive are
  // single tokens that are neither a preposition with a complement nor a
  // deictic adverb; a modal adverb is not an Angabe at A1.1.
  for (const item of [
    { id: 'fd-n1', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / sein / Lehrer]', answer: 'Ich bin Lehrer.' },
    { id: 'fd-n2', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / kaufen / das Brot]', answer: 'Ich kaufe das Brot.' },
    { id: 'fd-n3', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [wir / einkaufen / ein]', answer: 'Wir kaufen ein.' },
    { id: 'fd-n4', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / haben / gearbeitet]', answer: 'Ich habe gearbeitet.' },
    { id: 'fd-n5', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [wir / tanzen / zusammen]', answer: 'Wir tanzen zusammen.' },
    { id: 'fd-n6', type: 'sentence_building', questionDe: 'Bilden Sie den Satz: [ich / trinken / gern / Kaffee]', answer: 'Ich trinke gern Kaffee.' },
  ]) {
    assert.deepEqual(frontableOrders(item), [], `${item.id}: the rule invented an order`);
  }
});

test('the gender pair of the Wortfeld is a second minimal repair — REVIEW #13 BLOCKER 2', () => {
  // The partner table is READ from the curriculum, never typed: the L6 Wortfeld
  // teaches „der Chef" and „die Chefin" as one pair with the glosses „boss (m)"
  // and „boss (f)", so the course itself says both nouns exist.
  const pairs = genderPartners(CURRICULUM_A11);
  assert.equal(pairs.get('chefin').word, 'Chef');
  assert.equal(pairs.get('kollegin').word, 'Kollege');
  assert.equal(pairs.get('verkaeuferin').word, 'Verkäufer');
  assert.equal(pairs.get('firma'), undefined, 'die Firma has no taught gender partner');

  // The three items the review measured, before the cue.
  const before = [
    ['Korrigieren Sie: „Das ist ein Chefin.“', 'Das ist eine Chefin.', 'Das ist ein Chef'],
    ['Korrigieren Sie: „Das ist ein Verkäuferin.“', 'Das ist eine Verkäuferin.', 'Das ist ein Verkäufer'],
    ['Korrigieren Sie: „Das ist ein Kollegin im Büro.“', 'Das ist eine Kollegin im Büro.', 'Das ist ein Kollege im Büro'],
  ];
  for (const [questionDe, answer, also] of before) {
    const item = { id: 'gpa', topic: 'indefinite-articles', type: 'error_correction', questionDe, answer, accepted: [answer] };
    assert.deepEqual(genderPairAmbiguity(item, { level: 'a1.1' }), { article: ['ein', 'eine'], noun: also });
    assert.equal(exclusionReason(item), REASON.AMBIGUOUS_GENDER_PAIR);
    // …and after: the cue the course already writes names the element that changes.
    const pinned = { ...item, questionDe: questionDe.replace('Korrigieren Sie:', 'Korrigieren Sie den Artikel:') };
    assert.equal(genderPairAmbiguity(pinned, { level: 'a1.1' }), null);
    assert.equal(exclusionReason(pinned), null);
  }

  // The axis is symmetric, which is the point of reading the pair rather than
  // the suffix: „Das ist eine Chef." repairs at the article („ein Chef") and at
  // the noun („eine Chefin") just as well, and the rule says so.
  assert.deepEqual(genderPairAmbiguity({
    id: 'gs1', type: 'error_correction',
    questionDe: 'Korrigieren Sie: „Das ist eine Chef.“', answer: 'Das ist ein Chef.',
  }, { level: 'a1.1' }), { article: ['eine', 'ein'], noun: 'Das ist eine Chefin' });

  // The controls. „die Firma" has no partner in the Wortfeld, so the article is
  // the only repair; „Lena spielen …" repairs at the verb and is the
  // neighbouring axis; a family swap stays `ambiguousCorrection`'s finding; and
  // a prompt that names the element owes nothing, whichever element it names.
  for (const item of [
    { id: 'gn1', type: 'error_correction', questionDe: 'Korrigieren Sie: „Das ist ein Firma in Berlin.“', answer: 'Das ist eine Firma in Berlin.' },
    { id: 'gn2', type: 'error_correction', questionDe: 'Korrigieren Sie: „Lena spielen am Wochenende Fußball.“', answer: 'Lena spielt am Wochenende Fußball.' },
    { id: 'gn3', type: 'error_correction', questionDe: 'Korrigieren Sie: „Ein Schere ist hier.“', answer: 'Die Schere ist hier.' },
    { id: 'gn4', type: 'error_correction', questionDe: 'Korrigieren Sie das Nomen: „Das ist eine Chef.“', answer: 'Das ist eine Chefin.' },
  ]) {
    const hit = genderPairAmbiguity(item, { level: 'a1.1' });
    assert.equal(hit, null, `${item.id}: no second repair is owed, the rule claims „${hit && hit.noun}“`);
  }

  // The class, over the built A1.1 pool and the hand file.
  for (const item of ALL) {
    const hit = genderPairAmbiguity(item, { level: 'a1.1' });
    assert.equal(hit, null, `${label(item)} — also repairs as „${hit && hit.noun}.“`);
  }
});
