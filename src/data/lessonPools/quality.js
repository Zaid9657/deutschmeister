// Pool quality rules — the single place that decides whether an exercise from
// the grammar bank is fit to appear in a Lektion's controlled practice.
//
// WHY THIS FILE EXISTS. The A1.1 exercise pool was written for the standalone
// grammar trainer, years before the situational curriculum, and the DaF review
// of 2026-09-12 (docs/course-factory/a11-rebuild/REVIEW-daf-2026-09-12.md)
// measured what that legacy bank actually put in front of a learner: five of
// the seven items in the FREE first Lektion were English respellings
// ("Es klingt wie HOY-tuh"), several multiple-choice items expected an English
// meta-answer ("The -chen ending overrides meaning"), and five fill-in items
// expected `kein/keine` from a prompt that contains no negation cue at all —
// so a learner who writes the grammatically correct `eine` is marked wrong.
//
// These rules are data, not opinion: each one names the finding it closes.
// `scripts/build-lesson-pool.mjs` applies them at build time (so the shipped
// a11.json is already clean) and `src/lib/lesson/*` applies them again at draw
// time, so a hand-edited or older pool file cannot leak an item back in.
//
// SECOND REVIEW (docs/course-factory/a11-rebuild/REVIEW-daf-2-2026-09-12.md)
// added four more classes, all measured on the drawn seven of a Lektion:
// Lektion 8 drew two ORDINAL items ("Heute ist der ___ Juni. (20.)" → zwanzigste)
// whose formation no notice and no rule card of this level teaches and which the
// curriculum defers to A1.2 in writing, plus a third item teaching the `in der
// Nacht` exception; Lektion 11 drew an item whose answer stands verbatim in its
// own prompt ("Das Kind ___ Deutsch. Es lernt schnell." → lernt); and Lektion 9
// drew a prompt with no content at all ("Wie sagt man das?" — the sentence to
// produce lives only in the English gloss). The rule behind all four is the one
// the review asked for: THE ANSWER MUST FOLLOW FROM THE GERMAN PROMPT.
//
// THIRD REVIEW (docs/course-factory/a11-rebuild/REVIEW-daf-3-2026-09-12.md)
// found the same lesson unlearned a second time and named two more classes,
// both of them "the German prompt does not carry the task":
//
//   * BLOCKER 1 — THE VERB LIVES ONLY IN THE ENGLISH GLOSS. 58 typed items read
//     "Ich ___ viel." with `questionEn: 'I ___ a lot. (verb: arbeiten, ich)'`
//     and accept `arbeite` alone, so a learner who writes `lerne` — correct
//     German from the same Lektion's own Wortfeld — is marked wrong AND gets a
//     Konjugation tag written into an error profile for a mistake never made.
//     Round 2 closed three ids by hand and left the class alive; this is the
//     rule. `scripts/build-lesson-pool.mjs` REPAIRS the class first (it pulls
//     the cue into the German prompt: "Ich ___ viel. (arbeiten)"), because two
//     of the affected topics would otherwise fall under a Lektion's worth of
//     items; whatever still fails afterwards is dropped here.
//   * BLOCKER 2 — A STATEMENT THAT ASKS NOTHING. "Anna ist deine Freundin." with
//     the chips Sie/ihr/du: the whole task ("Which pronoun do you use to talk to
//     her?") stands in the English gloss. `META_PROMPT_RE` covered only the fixed
//     "Wie sagt man das?"; the rule below covers the shape — no gap, no question
//     mark, no cue list, no task formula and no quoted span to work on.
//
// FOURTH REVIEW (docs/course-factory/a11-rebuild/REVIEW-daf-4-2026-09-12.md)
// found the same shape a third time, one part of speech further on:
//
//   * BLOCKER 2 — THE ARTICLE LIVES ONLY IN THE ENGLISH GLOSS. 42 typed items
//     read "___ Tafel ist grün." with `questionEn: 'The blackboard is green.'`
//     and accept `Die` alone — but "Eine Tafel ist grün." is faultless German
//     out of the same Lektion's own Wortfeld, and `tagError` writes an Artikel
//     (or, for the ein/eine items, a Kasus) tag into the learner's profile for
//     a mistake never made. 30 of them want a definite article, 12 an
//     indefinite one, and they sit in Lektionen 4, 5 and 6 — three consecutive
//     PRIMARY series. `VERB_CUE_RE` cannot see them: it listens for `verb:`.
//     Same treatment as BLOCKER 1 of review #3: `scripts/build-lesson-pool.mjs`
//     REPAIRS the class first by appending the task formula to the German
//     prompt — "___ Tafel ist grün. (bestimmter Artikel)" — and never touches
//     `answer` or `accepted`; whatever still fails afterwards is dropped here.
//
// FIFTH REVIEW (docs/course-factory/a11-rebuild/REVIEW-daf-5-2026-09-12.md)
// found the SAME class a fourth time and named the reason it keeps coming back:
// "eine Regel muss an der Frage hängen, die sie beantwortet, nicht am Feld, in
// dem die letzte Instanz gefunden wurde." Round 4's article rule asked
// `type === 'fill_blank'`, i.e. the build shape of the instance round 4 had
// found, so three items of another shape walked straight through it:
//
//   * BLOCKER 1 — THE ARTICLE LIVES ONLY IN THE ENGLISH GLOSS, IN A CUE LIST.
//     "Schreiben Sie den Satz: [Honig / ist / gut]" accepts only "Der Honig ist
//     gut." while "Honig ist gut." is faultless (idiomatic, even — a mass noun
//     without an article), and `tagError` books the miss as VERBSTELLUNG, a
//     mistake the learner cannot have made in a sentence he wrote in the given
//     order. The twins `[Blume / ist / schön]` and `[Schrank / ist / neu]` are
//     two of the three Schreiben tasks of the GRADED Checkpoint 2. So the rule
//     below asks the question instead of the type: THE ARTICLE THE ANSWER
//     REQUIRES MUST BE AVAILABLE IN THE GERMAN PROMPT — either as a cue word in
//     the list, or as a task formula. The repair appends the formula
//     ("… [Honig / ist / gut] (mit bestimmtem Artikel)") and never touches
//     `answer`/`accepted`: the cue now demands what the answer key always
//     wanted, which is the honest direction to close the gap in.
//   * BLOCKER 2 — THE TASK FORMULA AND THE ANSWER KEY DISAGREE.
//     `extra-a11-l05-08` reads "Ist das ein Heft? — Ja, und ___ ist grün.
//     (bestimmter Artikel)" and accepts only `das Heft`, so the learner who
//     obeys the formula and writes `das` — a correct German sentence, the
//     demonstrative picking the Heft up — is marked WRONG and gets a Wortschatz
//     tag. That item was itself written as the repair for round 4's finding,
//     which is why this one is a RULE and not a widened list: `cueAnswerMismatch`
//     below. It is deliberately NOT repaired. A repair would have to guess which
//     half is right — the formula or the key — and guessing at the answer key is
//     exactly what a course may not do; the item's author decides. A hand-written
//     extra that fails it stops the build, which is the whole point of running
//     the extras through the same gate.
//   * MAJOR 7 — A PROMPT THAT ASKS ABOUT THE LANGUAGE INSTEAD OF USING IT.
//     "Welche Endung ist IMMER feminin?" with the chips -er/-um/-chen/-ung,
//     answered "-ung ist 100% feminin ohne Ausnahmen." — which is false for
//     words ENDING in -ung (der Ursprung, der Sprung, der Dung), demands
//     grammar terminology in a Lektion whose Handlungsfeld is "Einkaufen", and
//     carries a percentage claim that `tests/rule-card-overrides.test.mjs`
//     already forbids on every rule card. `metalinguisticPrompt` drops it.
//
// Also from review #3, but NOT a filter rule: `drillsSlug(item, slug)` below.
// The review's systemic finding is that the `topic` marks in the pool are
// ROUTING LABELS, not content descriptions — "≥ 4 of 7 items on the Lektion's
// own grammar point" was nominally true in L3, L4 and L11 while really 3 of 7,
// because the test read the same label the item carries. `drillsSlug` reads the
// item instead. It is a measurement, not a gate: an item that drills something
// else is mis-tagged, not unusable.
//
// Reasons are stable strings: the build script prints counts per reason and
// tests/lesson-engine.test.mjs and tests/lesson-pool-rules.test.mjs pin them.
//
// THE READING RULE (review #13, both BLOCKERs). AN EXERCISE WHOSE GERMAN
// INSTRUCTION DOES NOT MAKE ITS SOLUTION UNIQUE DOES NOT BELONG IN THE POOL —
// and "unique" means: no word of the level's OWN Wortfeld, and no word order the
// level's own rule cards teach, produces a second correct answer. Both halves
// have a rule below (`genderPairAmbiguity`, `frontableOrders`), and both read
// the curriculum and the item's own word bag rather than a list of shapes: a
// guard whose heart is a hand-written list closes the instances it has seen and
// never their class, which is what reviews #9 to #13 kept measuring.
//
// LEVEL SCOPE. Three of the rules are about what A1.1 has taught by Lektion 12,
// not about German: an ordinal or a month name is perfectly fine at A2. They
// apply unless the caller names a level other than a1.1 — the default is the
// strict one, so an engine-side call (`isUsableItem(item)`, which has no level
// to hand) can never be the loophole that lets one back in.

import { anyCurriculumFor } from '../curricula/index.js';

export const REASON = Object.freeze({
  HAND_FLAGGED: 'hand-flagged',
  ENGLISH_RESPELLING: 'english-respelling',
  ENGLISH_PROMPT: 'english-prompt',
  ENGLISH_ANSWER: 'english-answer',
  NEGATION_WITHOUT_CUE: 'negation-without-cue',
  // REVIEW #2 — the answer does not follow from the German prompt
  ORDINAL_NUMBER: 'ordinal-number',
  MONTH_NAME: 'month-name',
  UNTAUGHT_TIME_EXCEPTION: 'untaught-time-exception',
  ANSWER_IN_PROMPT: 'answer-in-prompt',
  META_PROMPT: 'meta-prompt',
  // REVIEW #3 — the task itself is missing from the German prompt
  VERB_CUE_ONLY_IN_GLOSS: 'verb-cue-only-in-gloss',
  STATEMENT_NO_TASK: 'statement-no-task',
  // REVIEW #4 — the article the item wants is named only in the English gloss
  ARTICLE_CUE_ONLY_IN_GLOSS: 'article-cue-only-in-gloss',
  // REVIEW #5 — the task formula and the answer key ask for different things,
  // and the prompt asks ABOUT German rather than asking for German
  CUE_ANSWER_MISMATCH: 'cue-answer-mismatch',
  METALINGUISTIC_PROMPT: 'metalinguistic-prompt',
  // REVIEW #6 — the model answer of an error correction changes more than the
  // German prompt asks for, so the minimal correction is marked wrong
  AMBIGUOUS_CORRECTION: 'ambiguous-correction',
  // REVIEW #7 — the item demands a form no notice and no rule card of the
  // level introduces (level-scoped, like the ordinal and the month name)
  UNTAUGHT_FORM: 'untaught-form',
  // REVIEW #11 — the explanation states a rule without the condition under
  // which it holds („Nach brauchen wird ein zu einen.")
  UNCONDITIONED_RULE: 'unconditioned-rule',
  // REVIEW #12 — the correction has a second, equally minimal repair on the
  // other side of the agreement („Du habt Durst." → „Du hast" OR „Ihr habt")
  // and the German prompt names neither side
  AMBIGUOUS_AGREEMENT: 'ambiguous-agreement',
  // REVIEW #13 — the correction changes an ARTICLE and the quoted noun has a
  // taught gender partner, so swapping the noun repairs the sentence with the
  // same one token („Das ist ein Chefin." → „eine Chefin" OR „ein Chef")
  AMBIGUOUS_GENDER_PAIR: 'ambiguous-gender-pair',
});

/** The level whose taught-by-now rules below apply. */
export const SCOPED_LEVEL = 'a1.1';

/** Reasons that are about the level's syllabus rather than about German. */
export const LEVEL_SCOPED_REASONS = Object.freeze([
  REASON.ORDINAL_NUMBER, REASON.MONTH_NAME, REASON.UNTAUGHT_TIME_EXCEPTION,
  REASON.UNTAUGHT_FORM,
]);

export const REASONS = Object.freeze(Object.values(REASON));

/**
 * Hand-flagged items, id → why. Keep this list SHORT: a pattern that shows up
 * twice belongs in a rule below, not here. Every entry cites the review.
 */
export const EXCLUDE_IDS = Object.freeze({
  // REVIEW §L9, BLOCKER: "Das ist ___ Uhr." expects `keine`, but nothing in the
  // prompt asks for a negation — the correct answer `eine` is marked wrong.
  'bb0ead84-4c69-547b-b8aa-b791b1c0e375': 'expects keine with no negation cue (REVIEW L9 BLOCKER)',
  // REVIEW #2 §L9 MAJOR: "Sie ___ drei Kinder." offers `hat` among its options
  // and marks it wrong. Only the English gloss says "(they)" — `Sie hat drei
  // Kinder.` is correct German. No pattern can read that ambiguity, so the id.
  '75a1cec4-0090-4675-852f-abb4d51dabb1': 'ambiguous Sie: hat is correct too (REVIEW #2 L9)',
  // REVIEW #2 §L7: "Du sprichst mit deinem Lehrer." → `Sie`, accepted []. The
  // prompt is a statement, not a task: nothing in it asks for a pronoun.
  '160867f8-dbb5-41ec-87ba-d9408124308b': 'statement, not a task; answer unguessable (REVIEW #2 L7)',
});

/**
 * English tokens that have no business inside a German prompt, option or
 * answer. Deliberately excludes every string that is ALSO a German word
 * (am, was, in, an, die, das, man, so, hat, war, wie, wo, plural, formal,
 * Infinitiv, Alphabet …) — the list may only contain tokens that cannot
 * occur in correct German.
 */
export const ENGLISH_MARKERS = Object.freeze([
  // pronouns and determiners ("i" and "a" are absent on purpose: single letters
  // are never matched, because a spelled-out word is a row of single letters)
  'me', 'my', 'mine', 'you', 'your', 'yours', 'he', 'she', 'they', 'them',
  'we', 'us', 'it', 'its', 'the',
  // verbs and function words
  'is', 'are', 'do', 'does', 'did', 'have', 'has', 'had', 'of', 'to', 'and',
  'not', 'no', 'always', 'only', 'like', 'add', 'remove', 'depends', 'forgot',
  'means', 'meaning', 'overrides',
  // the glosses and meta-vocabulary this pool actually uses
  'already', 'safe', 'beautiful', 'hungry', 'key', 'question', 'sound',
  'difference', 'ending', 'stem', 'infinitive', 'neuter', 'nouns', 'girls',
  'young', 'exception', 'colors', 'languages', 'letters', 'days', 'months',
  'english',
]);

const MARKERS = new Set(ENGLISH_MARKERS);

/** A pseudo-phonetic respelling: HOY-tuh, SHTRAH-suh, TSvahn-tsig, SHoo-leh. */
export const RESPELLING_RE = /\b[A-Z]{2,}[a-z]*-[A-Za-z]+\b/;

/** "Es klingt wie …" / "Wie klingt …" — a sound question a typed exercise cannot ask. */
export const SOUNDS_LIKE_RE = /klingt\s+wie|wie\s+klingt|welchen\s+laut/i;

/** A cue that tells the learner a negation is wanted. Without one, kein/nicht is a trap. */
export const NEGATION_CUE_RE = /nicht|kein|verneinung|verneint|nein|negativ/i;

/** A negation the item EXPECTS as the answer. */
export const NEGATION_ANSWER_RE = /(^|[^a-zäöüß])(kein|keine|keinen|keinem|keiner|keines|nicht)([^a-zäöüß]|$)/i;

/**
 * An ordinal cue in the prompt: "(20.)", "(3.)" — the bracketed date figure the
 * legacy time items use. Written as a bracketed group so "Es ist 8.30" and the
 * "z. B." of an explanation cannot trip it.
 */
export const ORDINAL_CUE_RE = /\(\s*\d{1,2}\s*\.\s*\)/;

/** An ordinal NUMBER WORD as the expected answer: dritte, ersten, zwanzigste … */
export const ORDINAL_WORD_RE =
  /^(?:erste|zweite|dritte|vierte|fünfte|sechste|sieb(?:en)?te|achte|neunte|zehnte|elfte|zwölfte|(?:drei|vier|fünf|sech|sieb|acht|neun)zehnte|(?:zwanzig|dreißig)ste|(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(?:zwanzig|dreißig)ste)n?$/i;

/** The twelve month names. A1.1 introduces them in Lektion 12, Lektion 8 draws time. */
export const MONTH_NAMES = Object.freeze([
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]);

const MONTH_RE = new RegExp(`(^|[^a-zäöüß])(${MONTH_NAMES.join('|')})([^a-zäöüß]|$)`, 'i');

/**
 * Topics where a month name is out of place: the time topic is what Lektion 8
 * draws, four Lektionen before the months are taught. Lektion 12 teaches them
 * and its own topic (possessive-articles) may name one — "Im Januar ist ___
 * Geburtstag." is the fix the review asked for, not a finding.
 */
export const MONTH_SCOPED_TOPIC_RE = /time|date|clock|uhrzeit/i;

/**
 * `in der Nacht` — a Dativ exception to the am-pattern that no A1.1 notice and no
 * rule card teaches, on a noun (`die Nacht`) that stands in no Wortfeld. Matched
 * on `der Nacht` because the item blanks the preposition out: the prompt reads
 * "___ der Nacht bin ich zu Hause. (Ausnahme: nicht am)".
 */
export const UNTAUGHT_TIME_RE = /(^|[^a-zäöüß])der\s+nacht([^a-zäöüß]|$)/i;

/**
 * REVIEW #7 BLOCKER 3. The inverse of RULE 6b: no drawn and no CHECKPOINT item
 * may demand a form that no notice and no rule card of the level introduces.
 *
 * Measured on `03bd1113` — shipped as `a1.1-cp4-bausteine-4`, one of SIX
 * Sprachbausteine of the GRADED final checkpoint, in a section whose pass mark
 * is 40 %: „Hast du ___ Schlüssel? (du — Vorschau Akkusativ)" → `deinen`,
 * explained as „Vorschau auf den Akkusativ (A1.2)". Its topic falls under
 * `STRICT_TOPIC`, so there is no typo tolerance: `dein` — exactly what L12's
 * notice and the `possessive-articles` rule card teach for a masculine noun —
 * comes back red in the final test. The twin `64680d9b` („Ich habe ___ Bruder
 * gern.") sat in the pool and was drawable from L12's `practiceRule.topics`, so
 * this is a CLASS, not an instance.
 *
 * Two predicates, because an item can announce the Vorgriff or merely make it:
 *
 *   * NEXT_LEVEL_RE — the item says so itself, in the prompt, the hint or the
 *     explanation the learner reads AFTER answering („Vorschau", „A1.2",
 *     „kommt in A1.2", and at A1.1 the case names themselves, which no A1.1
 *     notice uses). An item that calls itself a preview does not belong in the
 *     pool that is drawn from and graded.
 *   * UNTAUGHT_ANSWER_FORM_RE — the ANSWER is the untaught form, whether or not
 *     the item admits it. At A1.1 that is the possessive paradigm beyond
 *     `mein/meine`: the accusative `-en` and the dative `-em` of every owner.
 *     A1.1's twelve notices name six possessives and ONE ending rule („vor
 *     femininen Nomen und im Plural kommt -e dazu"); no notice, and no A1.1
 *     rule card, contains any of the forms below — `tests/lesson-pool-rules.test.mjs`
 *     measures that against the curriculum rather than asserting it here.
 *
 * WHAT IS DELIBERATELY NOT ON THE LIST: `einen` and `keinen`. The rule is
 * "introduced by a notice", not "belongs to a later case", and L6's notice
 * introduces exactly this form with an example — „Nach Verben wie brauchen,
 * haben, kaufen wird maskulin ein → einen: Ich brauche einen Computer" — so
 * `extra-a11-l06-04` („Der Chef braucht ___ Computer.") asks for a form the
 * course has shown, and banning it would fail the level's own material. The
 * same notice's sentence „die Regel kommt in A1.2" is about the RULE, and it
 * lives in the curriculum, not in an item.
 *
 * LEVEL-SCOPED, like ORDINAL_NUMBER: `meinen` is ordinary German at A1.2, and
 * the default is the strict reading, so an engine-side call with no level to
 * hand can never be the loophole.
 */
export const NEXT_LEVEL_RE = /Vorschau|A1\.2|kommt in A1|Akkusativ|Dativ|Genitiv/i;

/** The A1.1 off-limits answer forms: the possessive paradigm beyond -e. */
export const UNTAUGHT_ANSWER_FORMS = Object.freeze([
  'meinen', 'meinem', 'meiner', 'meines',
  'deinen', 'deinem', 'deiner', 'deines',
  'seinen', 'seinem', 'seiner', 'seines',
  'ihren', 'ihrem', 'ihrer', 'ihres',
  'unseren', 'unserem', 'unserer', 'unseres',
  'euren', 'eurem', 'eurer', 'eures',
]);

export const UNTAUGHT_ANSWER_FORM_RE = new RegExp(`^(?:${UNTAUGHT_ANSWER_FORMS.join('|')})$`, 'i');

/** True when the item demands a form the level has not introduced. */
export function untaughtForm(item) {
  const text = [item?.questionDe, item?.questionEn, item?.explanationDe, item?.hint]
    .map((t) => String(t ?? '')).join(' ');
  if (NEXT_LEVEL_RE.test(text)) return true;
  const expected = [item?.answer, ...(item?.accepted || [])].map((a) => String(a ?? '').trim()).filter(Boolean);
  return expected.some((a) => a.split(/\s+/).some((w) => UNTAUGHT_ANSWER_FORM_RE.test(w.replace(/[.,!?;:]/g, ''))));
}

/** A sentence-building cue list: "Bilde den Satz: [wir / kommen / aus Marokko]". */
export const BRACKET_LIST_RE = /\[([^\]]*)\]/;

/**
 * How many cue words a bracket list needs before the sentence it asks for is
 * determined. Two ("[spielen / Fußball]") are not enough: the subject is
 * missing and only the English gloss says it is `wir`, so "Ich spiele Fußball."
 * — correct German — is marked wrong.
 */
export const MIN_BRACKET_CUES = 3;

/** A prompt that asks nothing: the sentence to produce is in the gloss only. */
export const META_PROMPT_RE = /^\s*wie sagt man (?:das|es)\s*\??\s*$/i;

/**
 * REVIEW #3 BLOCKER 1. The cue the bank writes into `questionEn` and nowhere
 * else: "(verb: arbeiten, ich)", "(verb: haben, person: du)", "(question, verb:
 * aufstehen, du)", "(prefix only, verb: abholen, wir)", "(formal question, verb:
 * sein)". Always the LAST parenthesis of the gloss, so an ordinary lexical gloss
 * — "The ___ (car) is old." — cannot trip it: it carries no `verb:`.
 */
export const VERB_CUE_RE =
  /\(\s*(?:(question|prefix only|formal question)\s*,\s*)?verb:\s*([A-Za-zÄÖÜäöüß]+)\s*(?:,\s*(?:person:\s*)?([^)]*?))?\s*\)/i;

/**
 * parseVerbCue(questionEn) → { infinitive, person, flag } or null.
 * `person` and `flag` are '' when the gloss omits them ("(formal question, verb:
 * sein)" has no person token; the German prompt's own `Sie` supplies it).
 */
export function parseVerbCue(questionEn) {
  const m = VERB_CUE_RE.exec(String(questionEn || ''));
  if (!m) return null;
  return {
    infinitive: (m[2] || '').trim(),
    person: (m[3] || '').trim(),
    flag: (m[1] || '').trim().toLowerCase(),
  };
}

/**
 * The item types where the learner PRODUCES the answer rather than choosing it.
 * A multiple-choice item whose verb is only in the gloss is not the same trap:
 * the options themselves name the verb.
 */
const TYPED_TYPES = new Set(['sentence_building', 'error_correction']);
const isTyped = (item) =>
  TYPED_TYPES.has(String(item?.type || '')) ||
  (String(item?.type || '') === 'fill_blank' && !(Array.isArray(item?.options) && item.options.length));

/**
 * REVIEW #4 BLOCKER 2. The two article sets a bare-article gap can want, and the
 * task formula that has to stand in the German prompt for the gap to be
 * answerable. Written as flat (ä/ae-blind, lowercase) strings because that is
 * how the engine compares an answer.
 */
export const DEFINITE_ARTICLE_ANSWERS = Object.freeze(['der', 'die', 'das', 'den', 'dem']);
export const INDEFINITE_ARTICLE_ANSWERS = Object.freeze(['ein', 'eine', 'einen']);

/** The cue the repair appends, and the one shape that makes it idempotent. */
export const ARTICLE_CUE = Object.freeze({
  definite: '(bestimmter Artikel)',
  indefinite: '(unbestimmter Artikel)',
});

/**
 * REVIEW #5 BLOCKER 1. The same cue for a sentence-building item, where the gap
 * is the whole sentence and the article has to be INVENTED from a cue list that
 * does not contain it. Written in the Dativ ("mit bestimmtem Artikel") both
 * because that is the German and because it keeps the two cues apart for
 * `ARTICLE_TASK_CUE_RE` below: a sentence-building prompt asks for a SENTENCE,
 * so it must never be read as a prompt that wants a bare article back.
 */
export const SENTENCE_ARTICLE_CUE = Object.freeze({
  definite: '(mit bestimmtem Artikel)',
  indefinite: '(mit unbestimmtem Artikel)',
});

const SENTENCE_ARTICLE_CUE_RE = Object.freeze({
  definite: /\(\s*mit\s+bestimmtem\s+artikel\s*\)/i,
  indefinite: /\(\s*mit\s+unbestimmtem\s+artikel\s*\)/i,
});

/**
 * REVIEW #5 BLOCKER 2. The task formulas that tell the learner to write a BARE
 * ARTICLE and nothing else — the two the round-4 repair appends, plus the
 * hand-written "(der, die oder das?)". `(mit bestimmtem Artikel)` is
 * deliberately NOT in here: it asks for a whole sentence containing one.
 */
export const ARTICLE_TASK_CUE_RE =
  /\(\s*(?:un)?bestimmter\s+artikel\s*\)|\(\s*der,\s*die\s+oder\s+das\s*\?\s*\)/i;

/**
 * "(arbeiten)", "(einkaufen, nur die Vorsilbe)" — an infinitive cue in the
 * prompt, i.e. a task formula naming a VERB. Used by `cueAnswerMismatch` (a
 * verb task whose answer key is a bare article) and by `drillsSlug` below.
 */
export const INFINITIVE_CUE_RE = /\([^)]*[a-zäöüß]{2}en\b[^)]*\)/i;

/**
 * Separable prefixes that are spelled like an article. Exactly one: `ein`. It is
 * why `cueAnswerMismatch`'s reverse direction carries an exception rather than
 * reading the answer form alone — "Wir kaufen heute ___. (einkaufen, nur die
 * Vorsilbe)" → `ein` is a verb task with an article-shaped answer and is
 * perfectly sound. Measured on the 2026-09-12 pool: the exception is what takes
 * the reverse direction from two false positives to none.
 */
const ARTICLE_SHAPED_PREFIXES = Object.freeze(['ein']);

/**
 * REVIEW #3 BLOCKER 2. The task formulas an A1.1 prompt uses. Both registers,
 * because the register normaliser in the build script turns the du-forms into
 * Sie-forms and this rule has to hold on both sides of that change.
 */
export const TASK_FORMULA_RE =
  /(bilden sie|bilde|korrigieren sie|korrigiere|schreiben sie|schreib|ergänzen sie|ergänze|wählen sie|wähle|welche[rs]?|buchstabiert|hören sie|setzen sie|setze|finden sie|finde|antworte|wie heißt|sagen sie|füllen sie|lesen sie)/i;

/**
 * A quoted sentence the item asks the learner to work on: „…“ or "…".
 * The inner text is CAPTURED (group 1) because `ambiguousCorrection` below has
 * to compare the quote with the model answer word by word; every other caller
 * only ever `.test()`s it, so the group costs nothing.
 */
export const QUOTED_SPAN_RE = /[„"“]([^„"“]+)[“"]/;

/** ä/ae-blind lowercase, the way src/utils/answerMatch.js compares answers. */
const flat = (text) =>
  String(text || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

const bare = (text) => String(text || '').replace(/[.,!?;:"“”„'’]/g, '').trim();

/**
 * True when the expected answer already stands in the German prompt, so the
 * item gives itself away ("Das Kind ___ Deutsch. Es lernt schnell." → lernt).
 *
 * Three narrowings, each measured against the pool rather than guessed:
 * bracketed cues are removed first, because `(haben)` and `[wir / kommen]` are
 * hints the item is built on — and for the Sie-form the infinitive hint IS the
 * answer ("___ Sie Kuchen? (haben)" → Haben); a one-word answer must match a
 * whole word, so `(lernen)` never stands in for `lernst`; a multi-word answer
 * must appear as one contiguous string, so an error-correction item may quote
 * the sentence it asks about. Answers under three letters are skipped — `am`,
 * `im`, `um` recur in a prompt for reasons of their own.
 */
export function answerInPrompt(item) {
  const answer = bare(item?.answer);
  if (answer.length < 3) return false;
  const q = flat(String(item?.questionDe || '').replace(/\([^)]*\)|\[[^\]]*\]/g, ' '));
  if (answer.includes(' ')) return q.includes(flat(answer));
  return q.split(/[^a-z]+/).includes(flat(answer));
}

/**
 * True when the German prompt carries no task: the fixed meta question, or a
 * cue list too thin to determine the sentence.
 */
export function isMetaPrompt(item) {
  const q = String(item?.questionDe || '');
  if (META_PROMPT_RE.test(q)) return true;
  const list = BRACKET_LIST_RE.exec(q);
  if (!list) return false;
  return flat(list[1]).split(/[^a-z]+/).filter(Boolean).length < MIN_BRACKET_CUES;
}

/**
 * REVIEW #3 BLOCKER 1: a typed item with a gap whose verb is named ONLY in the
 * English gloss. "Ich ___ viel." + "(verb: arbeiten, ich)" accepts `arbeite`
 * and marks `lerne` wrong — a correct German sentence from the same Wortfeld.
 * A German prompt that carries its own bracket — "Ich ___ viel. (arbeiten)" —
 * or a cue list is fine, which is exactly what the build script's repair pass
 * produces.
 */
export function verbCueOnlyInGloss(item) {
  if (!item || !isTyped(item)) return false;
  const q = String(item.questionDe || '');
  if (!q.includes('___')) return false;
  if (/\([^)]*\)/.test(q) || BRACKET_LIST_RE.test(q)) return false;
  return VERB_CUE_RE.test(String(item.questionEn || ''));
}

/**
 * REVIEW #4 BLOCKER 2: which article family the item wants, read off the
 * expected answers — 'definite', 'indefinite', or null when the answers are not
 * a uniform set of bare articles. Uniform is the point: an item that accepts
 * `Die` AND `Eine` is not asking which family, so nothing needs appending.
 */
export function articleAnswerKind(item) {
  const expected = [item?.answer, ...(item?.accepted || [])]
    .map((a) => flat(bare(a)))
    .filter(Boolean);
  if (!expected.length) return null;
  if (expected.every((a) => DEFINITE_ARTICLE_ANSWERS.includes(a))) return 'definite';
  if (expected.every((a) => INDEFINITE_ARTICLE_ANSWERS.includes(a))) return 'indefinite';
  return null;
}

/**
 * REVIEW #4 BLOCKER 2: a typed fill-in whose gap wants a bare article, where the
 * German prompt says nothing about which family is meant. "___ Tafel ist grün."
 * accepts `Die` alone while "Eine Tafel ist grün." is faultless German, so the
 * learner is marked wrong — and `tagError` books it as an Artikel (or, for the
 * ein/eine items, a Kasus) mistake that never happened. Only the whole task
 * stands in `questionEn` ("The blackboard is green."), which is exactly the
 * excuse round 3 refused to take for the verb.
 *
 * Narrow on purpose. A multiple-choice item is not the same trap: its chips name
 * the family. A prompt that already carries ANY bracket — the cue the build
 * script appends, an `(bestimmter Artikel)` a hand-written item brought along,
 * or a lexical hint — is left alone, which is what makes the repair idempotent.
 */
export function articleCueOnlyInGloss(item) {
  if (!item) return false;
  if (String(item.type || '') === 'sentence_building') return missingSentenceArticle(item) !== null;
  if (String(item.type || '') !== 'fill_blank') return false;
  if (Array.isArray(item.options) && item.options.length) return false;
  const q = String(item.questionDe || '');
  if (!q.includes('___')) return false;
  if (/\([^)]*\)/.test(q) || BRACKET_LIST_RE.test(q)) return false;
  return articleAnswerKind(item) !== null;
}

/**
 * REVIEW #5 BLOCKER 1, asked as a QUESTION rather than as a type: does the
 * German prompt give the learner the article his answer is required to carry?
 * `missingSentenceArticle(item)` → 'definite' | 'indefinite' | null.
 *
 * An article counts as REQUIRED when it stands in front of a noun in the
 * expected sentence — a capitalised next word, which is what a German noun is.
 * That is the whole narrowing, and it is a measured one: without it
 * "Schreiben Sie den Satz: [wir / einkaufen / heute]" → "Wir kaufen heute ein."
 * reads as a missing `ein`, when the `ein` is the separable prefix of the verb
 * the cue list already names. It counts as AVAILABLE when the cue list carries
 * the same word — "[der Stuhl / kosten / zwölf Euro]" — or when the prompt
 * carries the task formula the repair appends, which is what makes the repair
 * idempotent.
 *
 * Measured over the 347-item pool + the 119 hand-written extras: three hits,
 * exactly the three the review names (`dd86dc8a`, `670eaadb`, `cd6d471e`), and
 * no false positive among the other 36 sentence-building items.
 */
export function missingSentenceArticle(item) {
  if (!item || String(item.type || '') !== 'sentence_building') return null;
  const q = String(item.questionDe || '');
  const list = BRACKET_LIST_RE.exec(q);
  if (!list) return null;
  const cues = new Set(flat(list[1]).split(/[^a-z0-9]+/).filter(Boolean));
  const tokens = bare(item.answer).split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i += 1) {
    const word = flat(tokens[i]);
    const definite = DEFINITE_ARTICLE_ANSWERS.includes(word);
    if (!definite && !INDEFINITE_ARTICLE_ANSWERS.includes(word)) continue;
    const next = tokens[i + 1];
    if (!next || !/^[A-ZÄÖÜ]/.test(next)) continue;
    if (cues.has(word)) continue;
    const kind = definite ? 'definite' : 'indefinite';
    if (SENTENCE_ARTICLE_CUE_RE[kind].test(q)) continue;
    return kind;
  }
  return null;
}

/**
 * REVIEW #5 BLOCKER 2: the task formula in the German prompt and the answer key
 * ask for different things, so obeying the formula is marked wrong.
 *
 * Forward: the prompt says "(bestimmter Artikel)" / "(unbestimmter Artikel)" /
 * "(der, die oder das?)" — a formula that asks for ONE WORD — and not one
 * accepted answer is a bare article. `extra-a11-l05-08` ("… Ja, und ___ ist
 * grün. (bestimmter Artikel)" → `das Heft`) is the measured instance and the
 * reason this is a rule: it was itself written to repair the round-4 finding.
 *
 * Reverse: the answer key is nothing but bare articles while the prompt's
 * formula names a verb. Measured hits on the current pool: none — the two items
 * the shape catches ("Wir kaufen heute ___. (einkaufen, nur die Vorsilbe)" →
 * `ein`) are the separable prefix, which `ARTICLE_SHAPED_PREFIXES` excepts. It
 * is kept because the direction is the same finding and costs one clause; a
 * rule with no instance today is not the same thing as a rule with false ones.
 *
 * NOT REPAIRABLE, on purpose. Both halves of a mismatch are plausible, and
 * choosing between them means rewriting either the task or the answer key —
 * which is authorship, not a build step. The item is excluded; a hand-written
 * extra that trips it stops the build.
 */
export function cueAnswerMismatch(item) {
  if (!item) return false;
  const q = String(item.questionDe || '');
  const expected = [item.answer, ...(item.accepted || [])].map((a) => flat(bare(a))).filter(Boolean);
  if (!expected.length) return false;
  const isBareArticle = (a) =>
    DEFINITE_ARTICLE_ANSWERS.includes(a) || INDEFINITE_ARTICLE_ANSWERS.includes(a);
  if (ARTICLE_TASK_CUE_RE.test(q)) return !expected.some(isBareArticle);
  if (expected.every(isBareArticle) && !expected.some((a) => ARTICLE_SHAPED_PREFIXES.includes(a))) {
    return INFINITIVE_CUE_RE.test(q);
  }
  return false;
}

/**
 * REVIEW #7 BLOCKER 1. The polite capital as a TASK, not as an answer FORM.
 *
 * Round 6 closed review #6's finding as a predicate — and round 7 measured that
 * the predicate was the very answer-form regex round 5 had removed from
 * `isCaseTask` in src/lib/lesson/check.js, moved one layer up. `check.js`
 * writes down why that cannot work: "ein Regex auf die Antwortform kann ein
 * höfliches `Ihr` nicht von einem großgeschriebenen Satzanfang unterscheiden."
 * Both error directions were measured:
 *
 *   * FALSE POSITIVE — `dd1c3d60` („___ ist meine Mutter.", `Sie`, explanation
 *     „Mutter = weiblich → sie."), `b19be5e4` („Die Tasche ist teuer. ___ ist
 *     schön.", explanation „deshalb wird sie zu sie.") and `4299d5ca` („___
 *     seid meine Freunde.", `Ihr`, explanation „Ihr spricht mehrere Personen
 *     INFORMELL an") all carried `caseSensitive: true`. Three items whose own
 *     text says that nothing polite is being taught here.
 *   * FALSE NEGATIVE — the sentence clause was narrowed to `Ihr…`, so it never
 *     reached `Sie` or `Ihnen` INSIDE a sentence: „Gut. Wie geht es Ihnen?"
 *     forgave `ihnen` while `extra-a11-l01-06`, the same form, graded it wrong.
 *
 * So the question the predicate asks is the one the rule is about: *is the
 * capital the TASK here?* — and the item's own text is what answers it:
 *
 *   1. AN ITEM THAT ACCEPTS BOTH SPELLINGS is not teaching the capital
 *      (`extra-a11-l12-10` `['Ihre','ihre']`, `extra-a11-l03-02` `['Sie','sie']`).
 *   2. AN ITEM THAT CALLS ITSELF INFORMAL VETOES, whatever its answer looks
 *      like (`4299d5ca`) — and so does an item that NAMES the lowercase
 *      counterpart as the form it wants (`dd1c3d60`, `b19be5e4`, `210e89f8`).
 *      A veto beats every signal below: the text is the author speaking.
 *   3. ONE-WORD answers are a case task when the text names the formal
 *      counterpart (`Frau/Herr <Name>`, `Sie-Form`, `höflich`, `formell`,
 *      `großes I`) or when the answer is the unambiguous polite `Ihnen`, which
 *      has no lowercase reading in German outside a sentence start.
 *      A card carries NO text at all (`buildCardIndex` passes `accepted` and
 *      nothing else, and a Wortfeld entry for `Sie` is exactly that) — there
 *      the answer key is all there is, so the form alone decides.
 *   4. SENTENCE answers are read as SENTENCES: a polite form counts only where
 *      the capital is a decision, i.e. NOT as the first word of its own
 *      sentence. `Ihnen` and a non-initial possessive `Ihr…` count on their
 *      own; `Sie` counts only where the sentence also addresses a `Frau`/`Herr`.
 *
 * REVIEW #9 MAJOR 4. Clause 3 read the item's SELF-DECLARATION — `POLITE_CUE_RE`
 * over prompt, hint and explanation — for one-word answers only, so a SENTENCE
 * answer was judged by the position of the form alone. Measured: three items
 * whose own German prompt says „Schreiben Sie die **höfliche** Frage" (`78abfd45`,
 * `6f0fbd89`, `extra-a11-l10-08`) forgave a lowercase `sie` as a typo, while
 * `83bab298` („das / ist / Ihre Adresse") graded it wrong — the same task, split
 * by the shape of the word rather than by the task.
 *
 * So the declaration is read for EVERY answer shape: an item whose own text names
 * the register (`POLITE_CUE_RE`, no `INFORMAL_VETO_RE`) and whose answer carries a
 * polite form at all is a case task, wherever that form stands. The two vetoes
 * above still beat it. Nothing gets stricter that does NOT name its own register:
 * a bare mid-sentence `Sie` with no cue stays lenient — the graded dictation
 * `a1.1-cp1-hoeren-3` („Bitte füllen Sie das Formular aus.") is the case the
 * review names, and a learner copying a heard line cannot HEAR the capital.
 */
export const POLITE_FORM_RE = /^(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)$/;

/** The one polite form with no lowercase reading of its own: `ihnen` is not a word. */
export const UNAMBIGUOUS_POLITE_RE = /^Ihnen$/;

/** The text names the FORMAL counterpart — the signal that the capital is the task. */
export const POLITE_CUE_RE =
  /Höflichkeitsform|höflich|formell|formal address|Sie-Form|mit großem|großes I|\bFrau [A-ZÄÖÜ]|\bHerrn? [A-ZÄÖÜ]/i;

/** The text says the opposite. A veto beats every signal: the author is speaking. */
export const INFORMAL_VETO_RE = /informell|informal|\bduzen\b|\bduzt\b|du-Form/i;

/** Everything the ITEM says about its own task. A review card says nothing at all. */
const politeText = (item) =>
  [item?.questionDe, item?.questionEn, item?.explanationDe, item?.hint].map((t) => String(t ?? '')).join(' ').trim();

const WORD_EDGE = '[^0-9A-Za-zÄÖÜäöüß]';

/** Does the text name `word` in LOWERCASE, as a word of its own? Then that is the form it wants. */
const namesLowercase = (text, word) =>
  new RegExp(`(^|${WORD_EDGE})${word.toLowerCase()}(${WORD_EDGE}|$)`).test(text);

/** „…, Frau Kaya?“ — the address that makes a `Sie` in the same sentence the polite one. */
const addressesPerson = (sentence) => /\b(Frau|Herrn?)\s+[A-ZÄÖÜ]/.test(sentence);

/** Does this answer carry a polite form at all — anywhere, position ignored? */
export const carriesPoliteForm = (line) =>
  String(line || '')
    .split(/\s+/)
    .some((w) => POLITE_FORM_RE.test(w.replace(/[.,!?:;\u201e\u201c"\u00bb\u00ab]/g, '')));

/**
 * A polite form standing where its capital is a DECISION — never as the first
 * word of its own sentence, which says nothing about register.
 */
export function politeSentenceAnswer(line) {
  return String(line || '')
    .split(/(?<=[.!?])\s+/)
    .some((sentence) => {
      const words = sentence.trim().split(/\s+/).slice(1).map((w) => w.replace(/[.,!?:;„“"»«]/g, ''));
      if (words.some((w) => UNAMBIGUOUS_POLITE_RE.test(w))) return true;
      if (words.some((w) => /^Ihr(e|en|em|er|es)?$/.test(w))) return true;
      return addressesPerson(sentence) && words.some((w) => POLITE_FORM_RE.test(w));
    });
}

export function politeCaseItem(item) {
  const acc = [item?.answer, ...(item?.accepted || [])].map((a) => String(a ?? '').trim()).filter(Boolean);
  if (!acc.length) return false;
  // 1. An item that accepts both spellings is not teaching the capital.
  if (acc.some((a) => acc.some((b) => a !== b && a.toLowerCase() === b.toLowerCase()))) return false;
  const text = politeText(item);
  // 2. An item that calls itself informal is not a polite-form item, whatever its answer looks like.
  if (INFORMAL_VETO_RE.test(text)) return false;
  // 3. The SELF-DECLARATION, read for every answer shape: the task names the register.
  const declaresPolite = POLITE_CUE_RE.test(text) && !INFORMAL_VETO_RE.test(text);
  if (acc.every((a) => !a.includes(' '))) {
    if (!acc.every((a) => POLITE_FORM_RE.test(a))) return false;
    // …nor is one that names the lowercase counterpart as the form it wants.
    if (acc.some((a) => namesLowercase(text, a))) return false;
    // 4. A card carries no prompt and no explanation: there the answer key is all there is.
    if (!text) return true;
    return declaresPolite || acc.every((a) => UNAMBIGUOUS_POLITE_RE.test(a));
  }
  // 5. Sentences: the declared register first, the position of the form second.
  if (declaresPolite && acc.every(carriesPoliteForm)) return true;
  return acc.every(politeSentenceAnswer);
}

/** The name the build script and the tests import it under. Same function. */
export const isPoliteFormItem = politeCaseItem;

/**
 * REVIEW #6 BLOCKER 2. An error correction whose model answer differs from the
 * quoted sentence in MORE than the way the German prompt names.
 *
 * The measured item is `extra-a11-l05-09`: „Ein Schere ist hier." → `Die Schere
 * ist hier.`, with `questionEn: 'Fix the article.'` and the intent ("bekannt,
 * also bestimmt") written only in the explanation the learner sees AFTER he has
 * answered. The quoted sentence carries exactly ONE error — the genus of the
 * indefinite article — so `Eine Schere ist hier.` is the minimal and complete
 * correction, faultless German, and it came back `wrong` with an Artikel tag.
 *
 * The rule is the question, not the field: does the answer change the article
 * FAMILY (definite ↔ indefinite) without the German prompt saying so? Nothing
 * else is touched — a genus fix, a conjugation fix or a preposition fix inside
 * one family has exactly one solution and passes.
 *
 * `articleFamilySwap` is the review's predicate for ONE candidate answer. The
 * exported rule then asks it of the whole answer key rather than of `answer`
 * alone, which is what makes the repair provable: the build widens `accepted`
 * with the minimal same-family correction, and an item that accepts BOTH
 * readings is no longer ambiguous — the learner who writes either is right.
 */
const ARTICLE_FAMILY = (word) =>
  (DEFINITE_ARTICLE_ANSWERS.includes(flat(word)) ? 'definite'
    : INDEFINITE_ARTICLE_ANSWERS.includes(flat(word)) ? 'indefinite' : null);

/**
 * The same article one family over, for the two directions A1.1 can produce.
 * `ein` has no entry going the other way on purpose: it is `der` OR `das`, and
 * a build step may not pick a gender — such an item is dropped, not repaired.
 */
export const ARTICLE_FAMILY_COUNTERPART = Object.freeze({
  definite: { der: 'ein', die: 'eine', das: 'ein', den: 'einen', dem: 'einem' },
  indefinite: { eine: 'die', einen: 'den', einem: 'dem' },
});

/**
 * articleFamilySwap(quoted, answer) → [from, to] when the answer corrects the
 * quote in exactly one word and that word crosses the article family, else null.
 */
export function articleFamilySwap(quoted, answer) {
  const src = bare(quoted).split(/\s+/).filter(Boolean);
  const tgt = bare(answer).split(/\s+/).filter(Boolean);
  if (!src.length || src.length !== tgt.length) return null;
  const diff = src.map((w, i) => [w, tgt[i]]).filter(([a, b]) => flat(a) !== flat(b));
  if (diff.length !== 1) return null;
  const [from, to] = diff[0];
  const fromFam = ARTICLE_FAMILY(from);
  const toFam = ARTICLE_FAMILY(to);
  if (!fromFam || !toFam || fromFam === toFam) return null;
  return [from, to];
}

export function ambiguousCorrection(item) {
  if (String(item?.type) !== 'error_correction') return false;
  const q = String(item.questionDe || '');
  if (ARTICLE_TASK_CUE_RE.test(q) || SENTENCE_ARTICLE_CUE_RE.definite.test(q) ||
      SENTENCE_ARTICLE_CUE_RE.indefinite.test(q)) return false;
  const quote = QUOTED_SPAN_RE.exec(q);
  if (!quote) return false;
  const answers = [item.answer, ...(item.accepted || [])]
    .map((a) => String(a ?? '').trim()).filter(Boolean);
  if (!answers.length) return false;
  return answers.every((a) => articleFamilySwap(quote[1], a) !== null);
}

/**
 * The minimal correction the item never accepted: the quoted sentence with its
 * one wrong article replaced by the SAME-FAMILY form of the article the model
 * answer chose. „Ein Schere ist hier." + `Die Schere ist hier.` → `Eine Schere
 * ist hier.` Returns null when the counterpart is not computable (`ein` is der
 * or das and a build step may not choose), and the build drops the item then.
 */
export function minimalArticleCorrection(item) {
  const q = String(item?.questionDe || '');
  const quote = QUOTED_SPAN_RE.exec(q);
  if (!quote) return null;
  const swap = articleFamilySwap(quote[1], item?.answer);
  if (!swap) return null;
  const [from, to] = swap;
  const counterpart = ARTICLE_FAMILY_COUNTERPART[ARTICLE_FAMILY(to)][flat(to)];
  if (!counterpart) return null;
  // The written form follows the article the item's own answer uses: a
  // sentence-initial article is capitalised, one mid-sentence is not.
  const written = /^[A-ZÄÖÜ]/.test(from) ? counterpart.charAt(0).toUpperCase() + counterpart.slice(1) : counterpart;
  const words = String(item.answer).split(/\s+/);
  const at = words.findIndex((w) => flat(bare(w)) === flat(to));
  if (at < 0) return null;
  words[at] = written;
  return words.join(' ');
}

// ── REVIEW #12 BLOCKER 1: the second word order a Wortsalat also produces ───
//
// „Bilden Sie den Satz: [ich / haben / gestern / gearbeitet]" accepted exactly
// one string, „Ich habe gestern gearbeitet." — and marked „Gestern habe ich
// gearbeitet." WRONG, in four drawn items of which three are GRADED checkpoint
// tasks. The rejected order is the one the course itself teaches (the L11 rule
// card: „Das Verb steht auf Position 2"), the one its own L11 pretest accepts
// (`accepted: ['Ich habe', 'Gestern habe ich']`) and the one three cache items
// of the same shape already carry. The prompt says „Bilden Sie den Satz", never
// „beginnen Sie mit dem Subjekt", so both orders answer it.
//
// The rule, not the list: `frontableOrders(item)` derives the V2 permutations
// from the canonical answer, and the build widens `accepted` with them. Three
// narrowings, each measured against the built pool rather than guessed:
//   * only a STATEMENT — a prompt asking for a Frage, or an answer carrying a
//     question mark, is an inversion question whose order is the task;
//   * only a bracket chunk that IS a time or place expression (the regex
//     below), so „[wir / tanzen / zusammen]" gains nothing: a modal adverb is
//     not a fronting-capable Angabe at A1.1;
//   * only a canonical of the shape [subject] [finite verb] [rest], with the
//     adverbial INSIDE the rest. An answer that already starts with its Angabe
//     is left alone: the words after the verb are subject plus tail and no
//     build step can say where one ends — measured on the 2026-09-12 pool,
//     0 items have that shape, so nothing is lost.
// Everything after the fronted Angabe keeps its order, which is what keeps a
// separable prefix and a participle at the end („Gestern habe ich gearbeitet.",
// „Um 7 Uhr stehe ich auf.").

/**
 * REVIEW #13 BLOCKER 1. Frontability is DERIVED, not listed.
 *
 * Round 12 shipped `FRONTABLE_ADVERBIAL_RE`, a hand-written list of A1.1 Angabe
 * shapes, and wrote down that it was deliberately closed. Round 13 measured what
 * a closed list always measures: `von` was not on it, so `extra-a11-l02-07` —
 * built as the GRADED `a1.1-cp1-bausteine-2` — marked „Von Beruf bin ich
 * Lehrer." wrong while the same Lektion's own pretest lists „Von Beruf bin ich"
 * in `accepted`. The list closed the instances it had seen and not their class.
 *
 * The rule underneath, which needs no shape list at all: in the canonical
 * [Subjekt] [finites Verb] [Rest], every chunk of the task's own word bag is
 * frontable EXCEPT
 *   * the subject (everything before the finite verb),
 *   * the finite verb itself,
 *   * a chunk that is neither a prepositional phrase nor a time/place adverb —
 *     i.e. a bare noun standing after the verb, which is an object or a
 *     predicate nominal („Lehrer", „das Brot") and does not front at A1.1,
 *   * and therefore, with no clause of its own, a sentence-final separable
 *     prefix, participle or infinitive: „auf", „gearbeitet" and „einkaufen" are
 *     single tokens that are neither a preposition WITH a complement nor an
 *     adverb, so they fall out of the two positive clauses by construction.
 *
 * The two positive clauses are closed classes OF THE LANGUAGE — the German
 * prepositions and the deictic time/place adverbs — not a list of item shapes,
 * which is the difference the review asked for. Every order the rule derives is
 * printed by `scripts/build-lesson-pool.mjs` and read before it ships.
 */

/** A preposition that can open an Angabe, with the contractions A1.1 teaches. */
const PREPOSITION_RE =
  /^(?:an|am|ans|auf|aufs|aus|bei|beim|bis|durch|für|gegen|hinter|in|im|ins|mit|nach|neben|ohne|seit|über|um|unter|von|vom|vor|zu|zum|zur|zwischen)$/i;

/** The deictic time and place adverbs. A frequency or modal adverb is NOT in
 * here: „Zusammen tanzen wir." and „Gern trinke ich Kaffee." are marked orders,
 * and a build step may not put a marked sentence into a graded answer key. */
const ADVERBIAL_ADVERB_RE =
  /^(?:gestern|vorgestern|heute|morgen|übermorgen|jetzt|dann|danach|hier|dort|da)$/i;

/** The determiners that open a bare accusative time phrase („jeden Tag",
 * „nächste Woche") — an Angabe without a preposition. */
const TIME_DETERMINER_RE =
  /^(?:jeden|jede|jedes|nächsten|nächste|nächstes|letzten|letzte|letztes|diesen|diese|dieses)$/i;

/** The retired round-12 list, kept as a POSITIVE FIXTURE so the derivation can
 * be measured against what it replaced: every shape here must still front.
 * Nothing reads it at build or draw time. */
export const FRONTABLE_ADVERBIAL_RE =
  /^(?:gestern|heute|morgen|übermorgen|vorgestern|jetzt|hier|dort|dann|danach|am\s+\S+|um\s+.+|im\s+\S+|in\s+.+|aus\s+.+|nach\s+\S+|bei\s+\S+|jeden\s+tag|jede\s+woche|nächste\s+woche|letzte\s+woche)$/i;

/** The subject openers a fronted order may lowercase. A name and the polite
 * `Sie` are NOT in it: their capital is not a sentence opener. */
const LOWERCASABLE_SUBJECT_RE =
  /^(?:der|die|das|den|dem|ein|eine|einen|einem|einer|kein|keine|mein|meine|dein|deine|sein|seine|ihre|unser|unsere|euer|eure|ich|du|er|es|wir)$/i;

/** A finite-verb shape: a personal ending on a lower-case word, plus the forms
 * of the two irregular verbs A1.1 teaches that carry no personal ending at all
 * (`bin`, `sind`) and the modals it meets. Without them „Ich bin Lehrer von
 * Beruf." has no readable verb and the whole item falls out of the rule. */
const FRONTABLE_FINITE_RE =
  /^(?:[a-zäöüß]{2,}(?:e|st|t|en|et)|bin|sind|kann|will|muss|mag|darf|soll|weiß)$/i;

/** Words of that shape that are not verbs — the A1.1 adverbs and particles that
 * happen to end in a personal ending. Measured against the built pool. */
const NOT_A_VERB_RE = /^(?:heute|morgen|gestern|dann|danach|jetzt|dort|nicht|oft|gut|gern|immer|zusammen|zuerst|spaet|spät|bitte|sehr|schon)$/i;

/** A word that could be the subject of the clause: a nominative pronoun or a
 * determiner opening a noun phrase. Used to refuse an already-inverted
 * canonical, where the build cannot tell subject from fronted object. */
const SUBJECT_SHAPED_RE =
  /^(?:ich|du|er|sie|es|wir|ihr|der|die|das|ein|eine|kein|keine|mein|meine|dein|deine|unser|unsere)$/i;

const capitalise = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const lowerSubject = (word) => (LOWERCASABLE_SUBJECT_RE.test(word) ? word.charAt(0).toLowerCase() + word.slice(1) : word);

/** The spans of `words` that spell `chunk`, ä/ae-blind and case-blind. */
function chunkSpan(words, chunk) {
  const needle = bare(chunk).split(/\s+/).filter(Boolean).map(flat);
  if (!needle.length) return null;
  for (let i = 0; i + needle.length <= words.length; i += 1) {
    if (needle.every((w, k) => flat(bare(words[i + k])) === w)) return [i, i + needle.length];
  }
  return null;
}

/**
 * frontableOrders(item) → the V2 orders the item's own answer also has, as
 * written strings (without the closing punctuation the caller re-adds), or [].
 *
 * „Der Termin ist am Dienstag um acht Uhr." has three: each Angabe fronted on
 * its own, and — because the two are adjacent and the review measured exactly
 * that string — the whole run fronted together.
 */
export function frontableOrders(item) {
  if (String(item?.type) !== 'sentence_building') return [];
  const q = String(item.questionDe || '');
  if (/\bfrage\b/i.test(q)) return [];
  const bracket = BRACKET_LIST_RE.exec(q);
  if (!bracket) return [];
  const chunks = bracket[1].split('/').map((c) => c.trim()).filter(Boolean);
  const answer = String(item.answer || '').trim();
  if (!answer || answer.includes('?')) return [];
  const words = answer.replace(/[.!?]+$/, '').split(/\s+/).filter(Boolean);
  if (words.length < 3) return [];

  // The finite verb FIRST, because frontability is a question about position
  // and the position that matters is „after the finite verb". German spells
  // every noun with a capital and no personal pronoun carries a personal
  // ending, so the subject cannot be mistaken for the verb.
  const verbAt = words.findIndex((w, i) => i >= 1 &&
    /^[a-zäöüß]/.test(w) && FRONTABLE_FINITE_RE.test(bare(w)) && !NOT_A_VERB_RE.test(bare(w)));
  if (verbAt < 1) return [];

  // A chunk of the task's own word bag is frontable when it stands AFTER the
  // finite verb (so it is neither the subject nor the verb) and is an Angabe by
  // form: a preposition with a complement, a deictic time/place adverb, or a
  // bare accusative time phrase. A bare noun after the verb is an object or a
  // predicate nominal and stays put; a lone prefix, participle or infinitive at
  // the end matches none of the three clauses and stays put with it.
  const frontable = (chunk, [from]) => {
    if (from <= verbAt) return false;
    const toks = bare(chunk).split(/\s+/).filter(Boolean);
    if (!toks.length) return false;
    if (PREPOSITION_RE.test(toks[0])) return toks.length >= 2;
    if (TIME_DETERMINER_RE.test(toks[0])) return toks.length >= 2;
    return toks.length === 1 && ADVERBIAL_ADVERB_RE.test(toks[0]);
  };

  const spans = chunks
    .map((c) => [c, chunkSpan(words, c)])
    .filter(([, span]) => span)
    .filter(([c, span]) => frontable(c, span))
    .map(([, span]) => span)
    .sort((a, b) => a[0] - b[0]);
  if (!spans.length) return [];
  const first = spans[0][0];
  const verb = words[verbAt];
  const subject = words.slice(0, verbAt);
  const tail = words.slice(verbAt + 1);
  // The canonical must put the SUBJECT first, not an object: „Fußball spielen
  // wir am Wochenende." (measured in the A1.2 cache) is already inverted, and
  // reading its first constituent as the subject produces „Am Wochenende
  // spielen Fußball wir." So anything between the finite verb and the first
  // Angabe that could itself be the subject — a nominative pronoun or a
  // determiner — takes the item out of the rule. An accusative pronoun does
  // not: „Er holt dich um 8 Uhr ab." is subject-first and keeps its second order.
  if (words.slice(verbAt + 1, first).some((w) => SUBJECT_SHAPED_RE.test(bare(w)))) return [];

  /** [Angabe] [Verb] [Subjekt] [alles andere in seiner Reihenfolge]. */
  const front = ([from, to]) => {
    const angabe = words.slice(from, to);
    const rest = tail.filter((_, i) => {
      const at = verbAt + 1 + i;
      return at < from || at >= to;
    });
    return [capitalise(angabe[0]), ...angabe.slice(1), verb,
      lowerSubject(subject[0]), ...subject.slice(1), ...rest].join(' ');
  };

  const orders = spans.map(front);
  // The maximal run of adjacent Angaben that opens the rest, fronted as one —
  // „Am Dienstag um acht Uhr ist der Termin."
  let end = spans[0][1];
  let n = 1;
  while (n < spans.length && spans[n][0] === end) { end = spans[n][1]; n += 1; }
  if (n > 1) orders.push(front([first, end]));
  return [...new Set(orders)].filter((o) => flat(o) !== flat(words.join(' ')));
}

/**
 * The strings `frontableOrders` asks `accepted` to carry, in both spellings the
 * pool uses (with and without the closing period), so the guard below and the
 * build repair ask for exactly the same thing.
 */
export function frontedAcceptedForms(item) {
  const punct = (String(item?.answer || '').trim().match(/[.!]+$/) || ['.'])[0];
  return frontableOrders(item).flatMap((o) => [`${o}${punct}`, o]);
}

/**
 * REVIEW #12 BLOCKER 1, the guard side: true when the item HAS a second order
 * and its answer key does not carry it. The build repair takes every such item
 * to false; `tests/lesson-extra-items.test.mjs` runs it over the built pool and
 * over every checkpoint item, because a graded item is the costliest surface.
 */
export function missingFrontedOrder(item) {
  const wanted = frontableOrders(item);
  if (!wanted.length) return null;
  const have = new Set([item.answer, ...(item.accepted || [])].map((a) => flat(bare(a))));
  const missing = wanted.filter((o) => !have.has(flat(bare(o))));
  return missing.length ? missing : null;
}

// ── REVIEW #12 BLOCKER 2: the SECOND minimal repair of a correction ─────────
//
// „Korrigieren Sie: „Du habt Durst."" accepts „Du hast Durst." and marks „Ihr
// habt Durst." wrong — both repair the sentence with ONE token, both are
// correct German, and the German prompt names neither side. Round 7 wrote
// `ambiguousCorrection` for exactly this class and gave it one axis, the
// article family; agreement was the axis it could not see, and three items of
// the round-12 batch walked straight through it („Sind die Abfahrt …?" is also
// repairable as „Sind die Abfahrten …?", „Haben der Fahrer …?" as „Haben die
// Fahrer …?").
//
// The rule: a correction whose model answer changes the FINITE VERB is
// ambiguous when the SUBJECT could have been changed instead with one token —
// unless the German prompt names the element that changes („Korrigieren Sie
// das Verb: …"), which is the same cue the course already carries on every one
// of its fifteen article corrections („(mit bestimmtem Artikel)").

/** Person keys, in the order the tables below are written. */
const AGREEMENT_PERSONS = Object.freeze(['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']);

/** The two irregular verbs A1.1 teaches, flat-spelled like every comparison. */
const AGREEMENT_TABLES = Object.freeze({
  sein: { '1sg': 'bin', '2sg': 'bist', '3sg': 'ist', '1pl': 'sind', '2pl': 'seid', '3pl': 'sind' },
  haben: { '1sg': 'habe', '2sg': 'hast', '3sg': 'hat', '1pl': 'haben', '2pl': 'habt', '3pl': 'haben' },
});

/** ich/du/er/wir/ihr/sie → person. `sie` is 3sg and 3pl at once, so it is left
 * out: an item whose subject is `sie` is ambiguous for a reason this axis may
 * not decide, and `EXCLUDE_IDS` already carries the one the reviews found. */
const PRONOUN_PERSON = Object.freeze({
  ich: '1sg', du: '2sg', er: '3sg', es: '3sg', wir: '1pl', ihr: '2pl',
});

/** person → the pronoun a repair would write. */
const PERSON_PRONOUN = Object.freeze({
  '1sg': 'ich', '2sg': 'du', '3sg': 'er', '1pl': 'wir', '2pl': 'ihr', '3pl': 'sie',
});

/** The finite form `lemma` takes for `person`, for a regular -en verb too. */
function finiteForm(lemma, person) {
  const table = AGREEMENT_TABLES[lemma];
  if (table) return table[person];
  if (!/en$/.test(lemma)) return null;
  const stem = lemma.replace(/e?n$/, '');
  return { '1sg': `${stem}e`, '2sg': `${stem}st`, '3sg': `${stem}t`, '1pl': `${stem}en`, '2pl': `${stem}t`, '3pl': `${stem}en` }[person];
}

/** The lemma a finite form belongs to, or null when it is not a finite form of
 * anything the level teaches. Regular verbs are recognised by their own two
 * forms appearing in the same diff, so the lemma is derived from the PAIR. */
function sharedLemma(a, b) {
  const x = flat(bare(a));
  const y = flat(bare(b));
  for (const [lemma, table] of Object.entries(AGREEMENT_TABLES)) {
    const forms = new Set(Object.values(table));
    if (forms.has(x) && forms.has(y)) return lemma;
  }
  // A regular verb: both forms share a stem and differ only in the personal
  // ending (spielen → spiele/spielst/spielt/spielen).
  const ending = /^(.*?)(e|st|t|en|et)$/;
  const mx = ending.exec(x);
  const my = ending.exec(y);
  if (mx && my && mx[1] && mx[1] === my[1]) return `${mx[1]}en`;
  return null;
}

/**
 * Determiners, which `sharedLemma`'s regular-verb clause would otherwise read as
 * a conjugation pair: `eine`/`einen` share the stem `ein` and the endings `e`
 * and `en`. Measured on the built pool: without this clause the rule reports two
 * ARTICLE corrections („Ich brauche einen Pause.") as agreement-ambiguous, which
 * is the neighbouring rule's business and a false finding here.
 */
const DETERMINER_FORM_RE =
  /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|keinen|keinem|keiner|mein|meine|meinen|meinem|meiner|dein|deine|deinen|ihr|ihre|ihren|unser|unsere|euer|eure)$/i;

/** Nouns whose plural is the bare singular (der Fahrer → die Fahrer). */
const ZERO_PLURAL_RE = /(er|el|en|chen|lein)$/i;

/** The definite articles a subject can open with. Spelled out here rather than
 * reused from the article-family block below, which is declared after this one. */
const SUBJECT_DET_RE = /^(?:der|die|das|den|dem)$/i;

/**
 * agreementAmbiguity(item) → { verb: [from, to], subject } when the correction
 * repairs the verb and the subject could have been repaired instead, else null.
 * `subject` is the one-token rewrite that also repairs the sentence — it is
 * what the test prints, so the next author sees the answer he is rejecting.
 */
export function agreementAmbiguity(item) {
  if (String(item?.type) !== 'error_correction') return null;
  const q = String(item.questionDe || '');
  // The prompt names the element that changes — the cue the course already
  // carries — so the learner knows which side to repair.
  if (CORRECTION_CUE_RE.test(q)) return null;
  const quote = QUOTED_SPAN_RE.exec(q);
  if (!quote) return null;
  const src = bare(quote[1]).split(/\s+/).filter(Boolean);
  const tgt = bare(item.answer).split(/\s+/).filter(Boolean);
  if (!src.length || src.length !== tgt.length) return null;
  const diff = src.map((w, i) => [w, tgt[i], i]).filter(([a, b]) => flat(a) !== flat(b));
  if (diff.length !== 1) return null;
  const [from, to, at] = diff[0];
  if (DETERMINER_FORM_RE.test(bare(from)) || DETERMINER_FORM_RE.test(bare(to))) return null;
  const lemma = sharedLemma(from, to);
  if (!lemma) return null;

  // (a) a pronoun subject: another pronoun of the same sentence position agrees
  //     with the verb form the quote already carries („Du habt" → „Ihr habt").
  const subjectAt = src.findIndex((w, i) => i !== at && Object.prototype.hasOwnProperty.call(PRONOUN_PERSON, flat(bare(w))));
  if (subjectAt >= 0) {
    const person = PRONOUN_PERSON[flat(bare(src[subjectAt]))];
    const other = AGREEMENT_PERSONS.find((p) => p !== person && flat(finiteForm(lemma, p) || '') === flat(from));
    if (!other) return null;
    const written = subjectAt === 0 ? capitalise(PERSON_PRONOUN[other]) : PERSON_PRONOUN[other];
    const words = [...src];
    words[subjectAt] = written;
    return { verb: [from, to], subject: words.join(' ') };
  }

  // (b) a determiner + noun subject and a PLURAL verb form: the noun could have
  //     been pluralised instead („die Abfahrt" → „die Abfahrten", „der Fahrer"
  //     → „die Fahrer"), which is the plural L4 teaches („Im Plural haben alle
  //     Nomen die"). Only where the plural costs ONE token.
  const plural = flat(finiteForm(lemma, '3pl') || '');
  if (!plural || flat(from) !== plural) return null;
  const detAt = src.findIndex((w, i) => i !== at && SUBJECT_DET_RE.test(bare(w)));
  if (detAt < 0 || detAt + 1 >= src.length || detAt + 1 === at) return null;
  const noun = src[detAt + 1];
  if (!/^[A-ZÄÖÜ]/.test(noun)) return null;
  const words = [...src];
  if (ZERO_PLURAL_RE.test(noun)) {
    // article only: der Fahrer → die Fahrer
    words[detAt] = detAt === 0 ? 'Die' : 'die';
  } else if (flat(bare(src[detAt])) === 'die') {
    // noun only: die Abfahrt → die Abfahrten
    words[detAt + 1] = `${noun}${/e$/.test(noun) ? 'n' : 'en'}`;
  } else {
    return null;
  }
  return { verb: [from, to], subject: words.join(' ') };
}

// ── REVIEW #13 BLOCKER 2: the SECOND minimal repair, on the GENDER axis ─────
//
// „Korrigieren Sie: „Das ist ein Chefin."" accepted „Das ist eine Chefin." and
// marked „Das ist ein Chef." wrong. Both repair the sentence with ONE token,
// both are correct German, and the course itself teaches the two nouns as a
// PAIR in one Wortfeld line („der Chef" / „die Chefin", glossed „boss (m)" /
// „boss (f)"). Three drawn L6 items sat in the hole between the two rules that
// were supposed to catch this: `ambiguousCorrection` (round 7) only sees a
// change of article FAMILY, and `ein → eine` stays inside `indefinite`;
// `agreementAmbiguity` (round 13) hands every determiner change to it by name.
//
// THE READING RULE THIS FILE NOW CARRIES, and it is the general form of both
// BLOCKERs of review #13: AN EXERCISE WHOSE GERMAN INSTRUCTION DOES NOT MAKE
// ITS SOLUTION UNIQUE DOES NOT BELONG IN THE POOL — and „unique" means: no word
// of the level's OWN Wortfeld produces a second correct answer. The partner
// table below is therefore READ from the Wortfeld, never typed.

/** The cue words the course uses to name the element a correction changes
 * („Korrigieren Sie das Verb: …", „Korrigieren Sie den Artikel: …",
 * „Korrigieren Sie den Possessivartikel: …"). Shared by both ambiguity axes AND
 * by the determiner-cue convention below, because the cue is one convention and
 * not three. `possessiv`/`possessivartikel`/`endung` joined the list in review
 * #14: Lektion 12 is the possessive Lektion and its corrections change an
 * ENDING, which „Artikel" alone does not name. */
export const CORRECTION_CUE_RE =
  /\b(verb|verbform|subjekt|artikel|possessivartikel|possessiv|nomen|endung)\b/i;

/** ä/ö/ü folded away entirely, so „Ärztin" and „Arzt" can be compared as a
 * derivation rather than as two unrelated strings. */
const deumlaut = (text) => flat(text).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');

/** True when `fem` is the feminine derivation of `masc`: the -in suffix (with
 * or without a dropped final -e, with or without umlaut) or -mann → -frau. */
function isGenderDerivation(masc, fem) {
  const m = deumlaut(masc);
  const f = deumlaut(fem);
  if (!m || !f || m === f) return false;
  if (f === `${m}in`) return true;
  if (f === `${m.replace(/e$/, '')}in`) return true;
  if (/mann$/.test(m) && f === m.replace(/mann$/, 'frau')) return true;
  return false;
}

/**
 * genderPartners(curriculum) → Map flat(noun) → { word, article }, both ways,
 * for every pair of Wortfeld nouns of the LEVEL where one is the feminine
 * derivation of the other. Read from the data; nothing here is typed.
 */
const PARTNER_CACHE = new Map();
export function genderPartners(curriculum) {
  if (!curriculum) return new Map();
  if (PARTNER_CACHE.has(curriculum)) return PARTNER_CACHE.get(curriculum);
  const nouns = [];
  for (const lektion of curriculum.lektionen || []) {
    for (const w of lektion.wortfeld || []) {
      const word = String(w.word || '').trim();
      const article = String(w.article || '').trim().toLowerCase();
      if (word && /^(?:der|die|das)$/.test(article)) nouns.push({ word, article });
    }
  }
  const map = new Map();
  for (const a of nouns) {
    for (const b of nouns) {
      if (a === b || a.article === b.article) continue;
      const masc = a.article === 'die' ? b : a;
      const fem = a.article === 'die' ? a : b;
      if (fem.article !== 'die' || masc.article === 'die') continue;
      if (!isGenderDerivation(masc.word, fem.word)) continue;
      map.set(flat(masc.word), fem);
      map.set(flat(fem.word), masc);
    }
  }
  PARTNER_CACHE.set(curriculum, map);
  return map;
}

/** The nominative article `noun` takes in the family the quote uses. */
const NOMINATIVE_ARTICLE = Object.freeze({
  definite: { der: 'der', die: 'die', das: 'das' },
  indefinite: { der: 'ein', die: 'eine', das: 'ein' },
});

/**
 * REVIEW #14 MAJOR 2. The possessive family, which `ARTICLE_FAMILY` does not
 * know and cannot be taught without changing what `ambiguousCorrection` means:
 * `mein → meine` is not a family swap, it is an ENDING. So the possessives get
 * their own predicate and both rules below read `DETERMINER_FAMILY`, which is
 * `ARTICLE_FAMILY` plus one family — the article rules keep the meaning they
 * were pinned with, and Lektion 12, the possessive Lektion, stops being
 * invisible to every ambiguity axis at once.
 */
const POSSESSIVE_FORM_RE = /^(?:mein|dein|sein|unser|euer|eur|ihr)(?:e|en|em|er|es)?$/i;

/** The stem a possessive form is built on, normalised (`eur` → `euer`). */
function possessiveStem(word) {
  const m = /^(mein|dein|sein|unser|euer|eur|ihr)(?:e|en|em|er|es)?$/.exec(flat(bare(word)));
  if (!m) return null;
  return m[1] === 'eur' ? 'euer' : m[1];
}

/** The nominative possessive of `form`'s stem for a noun of `article`'s gender. */
function possessiveNominative(form, article) {
  const stem = possessiveStem(form);
  if (!stem) return null;
  if (article === 'die') return stem === 'euer' ? 'eure' : `${stem}e`;
  return stem;
}

/** `definite` · `indefinite` · `possessive` — the three determiner families of
 * A1.1, as one question. */
const DETERMINER_FAMILY = (word) =>
  ARTICLE_FAMILY(word) || (POSSESSIVE_FORM_RE.test(bare(word)) ? 'possessive' : null);

/**
 * genderPairAmbiguity(item, { level }) → { article: [from, to], noun } when the
 * model answer repairs an ARTICLE and swapping the quoted noun for its taught
 * gender partner repairs the same sentence with the same one token, else null.
 * `noun` is the rewrite the item rejects — the test prints it, so the next
 * author reads the answer he is marking wrong.
 */
export function genderPairAmbiguity(item, { level } = {}) {
  if (String(item?.type) !== 'error_correction') return null;
  const q = String(item.questionDe || '');
  if (CORRECTION_CUE_RE.test(q) || ARTICLE_TASK_CUE_RE.test(q)) return null;
  const quote = QUOTED_SPAN_RE.exec(q);
  if (!quote) return null;
  const src = bare(quote[1]).split(/\s+/).filter(Boolean);
  const tgt = bare(item.answer).split(/\s+/).filter(Boolean);
  if (!src.length || src.length !== tgt.length) return null;
  const diff = src.map((w, i) => [w, tgt[i], i]).filter(([a, b]) => flat(a) !== flat(b));
  if (diff.length !== 1) return null;
  const [from, to, at] = diff[0];
  // The repair has to be a DETERMINER repair: both sides a determiner, and the
  // family unchanged (a family swap is `ambiguousCorrection`'s finding and keeps
  // the reason it was pinned with). Review #14 added `possessive` to the
  // families read here — the rule used to give up on `mein → meine` before the
  // partner table was ever asked.
  const fromFamily = DETERMINER_FAMILY(from);
  const toFamily = DETERMINER_FAMILY(to);
  if (!fromFamily || !toFamily || fromFamily !== toFamily) return null;
  // The noun the article belongs to: the next capitalised word.
  const nounAt = src.findIndex((w, i) => i > at && /^[A-ZÄÖÜ]/.test(w));
  if (nounAt < 0) return null;
  const partner = genderPartners(anyCurriculumFor(level || SCOPED_LEVEL)).get(flat(src[nounAt]));
  if (!partner) return null;
  // …and the swap has to be MINIMAL: the article the quote already carries must
  // be the right one for the partner, or repairing the noun costs two tokens
  // and the item is unambiguous after all.
  const wanted = fromFamily === 'possessive'
    ? possessiveNominative(from, partner.article)
    : NOMINATIVE_ARTICLE[fromFamily][partner.article];
  if (!wanted || flat(wanted) !== flat(from)) return null;
  const words = [...src];
  words[nounAt] = partner.word;
  return { article: [from, to], noun: words.join(' ') };
}

// ── REVIEW #14 MAJOR 2: the cue, not the proof ──────────────────────────────
//
// „Korrigieren Sie: „Ihre Papa kommt auch."" accepted „Ihr Papa kommt auch."
// and marked „Ihre Mama kommt auch." wrong; „Korrigieren Sie: „Das ist mein
// Party."" marked „Das ist mein Fest." wrong. Both rejected answers are correct
// German, both repair the quote with ONE token, and both nouns stand as
// NEIGHBOURING Wortfeld lines of the very Lektion that serves the item („die
// Mama" · „der Papa"; „das Fest" · „die Party"). `genderPairAmbiguity` could not
// see either: `Mama`/`Papa` is suppletive, so no derivation table reaches it,
// and `Fest`/`Party` are not a pair in any morphological sense at all.
//
// THE READING RULE THIS FILE NOW CARRIES, and it replaces the sentence review
// #13 left here: A CORRECTION TASK DOES NOT PROVE ITS UNIQUENESS — IT NAMES THE
// ELEMENT IT WANTS CHANGED. WHOEVER PICKS THE PROOF BUILDS THE NEXT LIST. For
// any article repair, a noun of another gender that fits the slot is a second
// minimal repair, and no table over all Wortfelder can enumerate those; the cue
// („Korrigieren Sie den Artikel: …", „… den Possessivartikel: …") costs one
// line, holds for every noun the course will ever add, and is task wording
// rather than answer widening — the key never changes.
//
// `genderPairAmbiguity` stays as the DETECTOR the tests read (it is what proves
// the cue is load-bearing on the three L6 items); the convention below is what
// the pool is held to.

/** The cue words that NAME a determiner as the element to repair. Narrower than
 * `CORRECTION_CUE_RE` on purpose: „Korrigieren Sie das Verb" is a cue, but it
 * is not a cue for an article. */
export const DETERMINER_CUE_RE = /\b(artikel|possessivartikel|possessiv|endung)\b/i;

/** kind → the accusative noun phrase the task formula takes. */
export const DETERMINER_CUE = Object.freeze({
  artikel: 'den Artikel',
  possessivartikel: 'den Possessivartikel',
});

/**
 * determinerRepair(item) → { from, to, kind } when the model repair of an
 * `error_correction` changes exactly one token and that token is a DETERMINER on
 * both sides (article ↔ article, possessive ↔ possessive, article ↔ possessive),
 * else null. `kind` is `possessivartikel` as soon as either side is a possessive,
 * because that is the element the learner has to be told about.
 */
export function determinerRepair(item) {
  if (String(item?.type) !== 'error_correction') return null;
  const quote = QUOTED_SPAN_RE.exec(String(item.questionDe || ''));
  if (!quote) return null;
  const src = bare(quote[1]).split(/\s+/).filter(Boolean);
  const tgt = bare(item.answer).split(/\s+/).filter(Boolean);
  if (!src.length || src.length !== tgt.length) return null;
  const diff = src.map((w, i) => [w, tgt[i]]).filter(([a, b]) => flat(a) !== flat(b));
  if (diff.length !== 1) return null;
  const [from, to] = diff[0];
  const fromFamily = DETERMINER_FAMILY(from);
  const toFamily = DETERMINER_FAMILY(to);
  if (!fromFamily || !toFamily) return null;
  const kind = fromFamily === 'possessive' || toFamily === 'possessive'
    ? 'possessivartikel' : 'artikel';
  return { from, to, kind };
}

/**
 * missingDeterminerCue(item) → the same object when the German prompt does NOT
 * name the element, else null. This is the rule the pool is measured against —
 * always, not only where a partner noun happens to be findable.
 */
export function missingDeterminerCue(item) {
  const repair = determinerRepair(item);
  if (!repair) return null;
  if (DETERMINER_CUE_RE.test(String(item.questionDe || ''))) return null;
  return repair;
}

/**
 * withDeterminerCue(questionDe, kind) → the same prompt with the element named.
 * Task wording, never the answer key: the learner is told WHICH token to repair,
 * and everything the item accepted before it is still accepted. Idempotent — a
 * prompt that already names a determiner is returned unchanged.
 */
export function withDeterminerCue(questionDe, kind) {
  const text = String(questionDe || '').trim();
  if (!text || DETERMINER_CUE_RE.test(text)) return text;
  const cue = DETERMINER_CUE[kind] || DETERMINER_CUE.artikel;
  const formula = /(korrigieren sie|korrigiere)(\s+den satz)?(?=\s*:)/i;
  if (formula.test(text)) return text.replace(formula, (_m, verb) => `${verb} ${cue}`);
  const noun = cue.replace(/^den\s+/, '');
  return `${text} (${noun})`;
}

/**
 * REVIEW #5 MAJOR 7: the prompt asks ABOUT German instead of asking FOR German.
 * "Welche Endung ist IMMER feminin?" needs the words *Endung* and *feminin*
 * before it can be read at all, in a Lektion whose Wortfeld is Tisch, Stuhl,
 * Lampe, Uhr — and the course's own notice says the opposite ("Das Genus ist
 * Teil des Wortes"), i.e. it teaches gender as lexis, not as a suffix table.
 *
 * Two clauses, both measured against the pool before they were written:
 *   * `^Welche Endung` — 1 hit, the item the review names, 0 false positives.
 *   * `^Welches Genus` — 0 hits. Kept: the shape is metalinguistic by
 *     construction and the pattern cannot reach anything else.
 *   * options that are nothing but bare endings (`-er`, `-um`, `-chen`) — 1
 *     hit, the same item. A chip set of suffixes cannot be a use exercise.
 * Rejected after measuring: `^Welcher Artikel ist richtig für` and
 * `^Welcher Artikel passt zu der Endung`. Both score 0 — but the pool holds
 * four LEGITIMATE items one word away from them ("Welcher Artikel passt? ___
 * Wohnung"), which use the article rather than talk about it, and a pattern
 * that close to a good family is a trap waiting for the next author.
 */
export const METALINGUISTIC_PROMPT_RE = /^\s*(?:welche\s+endung|welches\s+genus)\b/i;

export function metalinguisticPrompt(item) {
  if (!item) return false;
  if (METALINGUISTIC_PROMPT_RE.test(String(item.questionDe || ''))) return true;
  const options = (item.options || []).filter((o) => String(o).trim());
  return options.length > 0 && options.every((o) => /^-\s*[a-zäöüß]/i.test(String(o).trim()));
}

/**
 * REVIEW #3 BLOCKER 2: the German prompt is a statement and asks nothing — no
 * gap, no question mark, no cue list, no task formula, no quoted span. The one
 * item in the pool is "Anna ist deine Freundin." with the chips Sie/ihr/du,
 * whose task ("Which pronoun do you use to talk to her?") is English-only.
 * The error-correction items are safe by construction: they carry both a task
 * verb and the sentence they quote.
 */
export function statementNoTask(item) {
  const q = String(item?.questionDe || '');
  if (!q.trim()) return false;
  if (q.includes('___') || q.includes('?')) return false;
  if (BRACKET_LIST_RE.test(q)) return false;
  if (TASK_FORMULA_RE.test(q) || QUOTED_SPAN_RE.test(q)) return false;
  return true;
}

const words = (text) =>
  String(text || '')
    .toLowerCase()
    .split(/[^a-zäöüß]+/)
    // Single letters are dropped: "Buchstabiert: B-I-T-T-E" is German, and its
    // letters would otherwise read as the English "I" and "a".
    .filter((w) => w.length > 1);

/** True when `text` carries an English token that cannot be German. */
export function hasEnglish(text) {
  return words(text).some((w) => MARKERS.has(w));
}

const fields = (item) => [item.answer, ...(item.accepted || []), ...(item.options || [])];

// ── drillsSlug: does the item really drill the grammar point it is filed under?
//
// REVIEW #3's systemic finding. `topic` routes an item into a Lektion; it does
// not describe what the item makes the learner produce. Two of the L2 items
// carry `topic: 'verb-sein'` in order to be drawn there and ask for a number
// word; three of the eight hand-written L11 items carry
// `separable-verbs-intro` and conjugate a verb that does not separate. This is
// a CONTENT predicate: it looks at the answer, the options and the prompt, and
// it is used by tests/lesson-engine.test.mjs to measure the real
// primary-slug count. It is deliberately not a build gate — a mis-tagged item
// is a routing bug, not an unusable exercise.

const wordsFlat = (text) => flat(text).split(/[^a-z0-9]+/).filter(Boolean);
const set = (...list) => new Set(list.map((w) => flat(w)));
/** The whole string is one of these words (punctuation and case ignored). */
const isOneOf = (text, allowed) => allowed.has(flat(bare(text)));
/** One of these words stands in the string. */
const containsOneOf = (text, allowed) => wordsFlat(text).some((w) => allowed.has(w));

/**
 * REVIEW #4 MAJOR. A definite-article CUE or a definiteness CONTRAST in the
 * prompt: the formula the build script appends, an explicit "welcher Artikel",
 * or the "Ist das ein Heft? — Ja, und ___ Heft ist grün." shape the Lektion-5
 * notice actually teaches (indefinite first mention, definite second).
 */
const DEF_ARTICLE_CUE_RE = /bestimmter artikel|welche[rs]?\s+artikel|ist das (?:ein|eine)\b/i;

const DEF_NOM = set('der', 'die', 'das');
const DEF_ALL = set('der', 'die', 'das', 'den', 'dem');
const INDEF = set('ein', 'eine', 'einen', 'einem', 'einer', 'kein', 'keine', 'keinen', 'keinem', 'keiner');
const PRONOUNS = set('ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr');
const SEIN = set('bin', 'bist', 'ist', 'sind', 'seid');
const HABEN = set('habe', 'hast', 'hat', 'haben', 'habt');
const PREFIXES = set('auf', 'an', 'ein', 'mit', 'um', 'ab', 'zu', 'aus', 'zurück', 'los', 'weg');
const POSSESSIVE_RE = /^(mein|dein|sein|ihr|unser|euer)(e|en|em|er|es)?$/;
/** One word of the string is a possessive form — for whole-sentence answers. */
const containsPossessive = (text) => wordsFlat(text).some((w) => POSSESSIVE_RE.test(w));
const TIME_WORD_RE =
  /^(um|am|im|uhr|halb|viertel|nach|vor|morgens|mittags|nachmittags|abends|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|eins|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwanzig|dreissig|vierzig|fuenfzig)$/;
/**
 * REVIEW #6 MAJOR 9: the number words A1.1 teaches, in the ä/ae-blind lowercase
 * form `flat()` produces — the spellings a learner types for a Telefonnummer,
 * a Hausnummer or a letter count. Zero to twenty plus the tens and `hundert`
 * is the whole of what Lektion 2 and the Hören-Teil-1 items ask for.
 */
export const NUMBER_WORDS = Object.freeze([
  'null', 'eins', 'ein', 'eine', 'zwei', 'drei', 'vier', 'fuenf', 'sechs', 'sieben', 'acht',
  'neun', 'zehn', 'elf', 'zwoelf', 'dreizehn', 'vierzehn', 'fuenfzehn', 'sechzehn',
  'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig', 'dreissig', 'vierzig', 'fuenfzig',
  'sechzig', 'siebzig', 'achtzig', 'neunzig', 'hundert',
]);

/** The units and the tens a German compound number is built from. */
const NUMBER_UNITS = 'ein|zwei|drei|vier|fuenf|sechs|sieben|acht|neun';
const NUMBER_TENS = 'zwanzig|dreissig|vierzig|fuenfzig|sechzig|siebzig|achtzig|neunzig';

/**
 * A compound written as one word, which is how German writes every number under
 * a million: `einundzwanzig`, `siebenundsechzig`, `hundertzwanzig`,
 * `einhundertdrei`. Listing them is not on — 0–100 alone is 101 strings — so
 * the tens/units shape is a pattern and the list above stays the atoms.
 */
const NUMBER_COMPOUND_RE = new RegExp(
  `^(?:(?:${NUMBER_UNITS})und(?:${NUMBER_TENS})` +
  `|(?:${NUMBER_UNITS})?hundert(?:(?:${NUMBER_UNITS})und(?:${NUMBER_TENS})|${NUMBER_TENS}|` +
  `null|eins|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf|dreizehn|vierzehn|` +
  `fuenfzehn|sechzehn|siebzehn|achtzehn|neunzehn)?)$`,
);

/**
 * isNumberWord(text) → the string IS a number: one of the atoms above, a
 * compound, or a bare digit string (a Hausnummer or a Telefonnummer segment an
 * item may legitimately ask back as digits).
 */
export function isNumberWord(text) {
  const word = flat(bare(text));
  if (!word) return false;
  if (/^\d+$/.test(word)) return true;
  return NUMBER_WORDS.includes(word) || NUMBER_COMPOUND_RE.test(word);
}

const FINITE_RE = /^[a-zäöüß]+(e|st|t|en|et)$/i;
/** The prompt's last word before the final punctuation is a separable prefix. */
const endsOnPrefix = (q) => {
  const toks = wordsFlat(String(q).replace(/\([^)]*\)\s*$/, ''));
  const tail = toks[toks.length - 1];
  return Boolean(tail) && PREFIXES.has(tail);
};

/**
 * The two item types where the learner TYPES the whole sentence, and so decides
 * its word order himself. A fill-in cannot: its frame is printed around the gap.
 */
const INVERSION_TYPES = new Set(['sentence_building', 'error_correction']);

/** Predicate per slug. Each one reads what the learner produces, not the label. */
const DRILLS = {
  // REVIEW #4 MAJOR: only what SHOWS the gender — a bare nominative article the
  // learner produces, or chips that are nothing but der/die/das. The old
  // `/^(der|die|das)\s/` clause read the FIRST WORD of any answer, so every
  // error-correction item whose corrected sentence opens with "Das" counted:
  // "Korrigieren Sie: „Das ist eine Tisch.“" → "Das ist ein Tisch." drills
  // ein/eine — the slug of Lektion 6 — and was lifting Lektion 4 over the floor.
  'nouns-gender': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, DEF_NOM)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, DEF_NOM))),

  // The same bare-article FORM counts here, deliberately: der/die/das is what a
  // definite-article exercise produces too, and no predicate can tell "which
  // gender" from "which article" by looking at the string. The honest split is
  // the routing one — `practiceRule.topics` — not a cleverer regex. What this
  // adds over nouns-gender is the Dativ/Akkusativ forms and the contrast shape,
  // where the answer is a whole sentence; the answer-prefix clause is gone for
  // the same reason as above.
  'definite-articles': ({ q, expected, options }) =>
    expected.some((a) => isOneOf(a, DEF_ALL)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, DEF_ALL))) ||
    (DEF_ARTICLE_CUE_RE.test(q) && expected.some((a) => containsOneOf(a, DEF_ALL))),

  // Also true for an error-correction item whose corrected sentence carries the
  // article: "Korrigieren Sie: „Das ist ein Schere.“" → "Das ist eine Schere."
  'indefinite-articles': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, INDEF) || containsOneOf(a, INDEF)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, INDEF))),

  'personal-pronouns': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, PRONOUNS)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, PRONOUNS))),

  'verb-sein': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, SEIN) || containsOneOf(a, SEIN)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, SEIN))),

  'verb-haben': ({ expected, options }) =>
    expected.some((a) => isOneOf(a, HABEN) || containsOneOf(a, HABEN)) ||
    (options.length > 0 && options.every((o) => isOneOf(o, HABEN))),

  // The spelling skill of Lektion 1: a dictated word, a letter name, an
  // orthography choice — all of them say so in the German prompt.
  'alphabet-pronunciation': ({ q }) => /Buchstab|Schreibweise/i.test(q),

  'present-tense-regular': ({ q, answer, options }) =>
    (!/\s/.test(bare(answer)) && FINITE_RE.test(bare(answer)) && INFINITIVE_CUE_RE.test(q)) ||
    (options.length >= 2 && options.every((o) => FINITE_RE.test(bare(o)))),

  // REVIEW #4 MAJOR, the other direction: POSSESSIVE_RE anchors on the whole
  // string, so "Wir feiern unser Fest." — a possessive item by any reading —
  // did not count. A multi-word answer counts when one of its words is a
  // possessive form; a one-word answer still has to BE one, or "unser" inside
  // a quoted prompt would carry an item that drills something else.
  'possessive-articles': ({ expected, options }) =>
    expected.some((a) => POSSESSIVE_RE.test(flat(bare(a)))) ||
    expected.some((a) => /\s/.test(bare(a)) && containsPossessive(a)) ||
    (options.length > 0 && options.every((o) => POSSESSIVE_RE.test(flat(bare(o))))),

  // The Satzklammer, from either end: the learner produces the prefix ("Er macht
  // die Tür ___." → zu), or produces the finite verb while the prefix stands at
  // the end of the prompt ("Wir ___ heute ein. (einkaufen)" → kaufen), or writes
  // the whole sentence with the prefix last. A non-separable verb in a
  // separable-verb prompt — "Ich ___ um sieben. (frühstücken)", the review's
  // finding — has no prefix anywhere and fails all three.
  'separable-verbs-intro': ({ q, expected }) =>
    expected.some((a) => {
      const plain = bare(a);
      if (isOneOf(plain, PREFIXES)) return true;
      const tail = wordsFlat(plain).slice(-1)[0];
      return Boolean(tail) && /\s/.test(plain) && PREFIXES.has(tail);
    }) ||
    endsOnPrefix(q),

  // A yes/no question is the finite verb in FIRST POSITION. An item drills that
  // only when the learner PUTS it there: he writes the whole question out of a
  // cue list or out of a statement, or he chooses Ja/Nein.
  //
  // REVIEW #4 MAJOR removed the gap-at-position-1 clause. REVIEW #5 MAJOR 1
  // removed the other two, and for the same reason — they counted items where
  // the question form is GIVEN:
  //   * "answer ends in ?" alone counted `extra-a11-l10-10/11`
  //     ("Korrigieren Sie: „Sind der Bahnhof weit?“" → "Ist der Bahnhof weit?"),
  //     which is subject-verb agreement inside a question that already stands in
  //     the prompt. The question mark now has to be the LEARNER's: the answer
  //     ends in one and the prompt contains none.
  //   * "asked for a Frage by name" counted any prompt that says the word, which
  //     is every prompt of the Lektion including the fill-in ones. Gone; the
  //     first clause already covers the "Bilden Sie die Frage: [...]" items,
  //     which is where the formula actually means something.
  // Measured after the change, both attempts: Lektion 10 drills its own slug in
  // 2 of 7 items, not 4. That is the honest figure and it is BELOW PRIMARY_MIN —
  // the gap is two missing producer items, not a predicate to loosen.
  'yes-no-questions': ({ q, type, expected, options }) =>
    (INVERSION_TYPES.has(type) &&
      !/\?/.test(q) &&
      expected.some((a) => /\?\s*$/.test(String(a).trim()))) ||
    options.some((o) => isOneOf(o, set('ja', 'nein'))),

  'time-and-dates': ({ expected }) =>
    expected.some((a) => /uhr/i.test(String(a)) || wordsFlat(a).some((w) => TIME_WORD_RE.test(w))),

  // REVIEW #6 MAJOR 9. The number words, which Hören Teil 1 of Start Deutsch 1
  // is nearly made of (Zahlen, Uhrzeiten, Telefonnummern) and which the pool
  // filed under `verb-sein` because that was the topic Lektion 2 routes on. The
  // consequence was not cosmetic: `tagError` falls through to the verb clause
  // on a `verb-sein` topic, so `sieber` for `sieben` was diagnosed as a
  // Konjugation mistake and `remediationSet` served more verb items for it.
  // The predicate reads what the learner PRODUCES, like every other one here:
  // the expected answer is a number word.
  numbers: ({ expected }) => expected.some(isNumberWord),
};

/**
 * drillsSlug(item, slug) → true when the item really practises `slug`.
 * An unknown slug answers `true`: the predicate may not silently condemn a
 * grammar point nobody has written a rule for.
 */
export function drillsSlug(item, slug) {
  const rule = DRILLS[String(slug || '')];
  if (!rule) return true;
  if (!item) return false;
  const answer = String(item.answer || '');
  const expected = [answer, ...(item.accepted || [])].filter((a) => String(a).trim());
  const options = (item.options || []).filter((o) => String(o).trim());
  return Boolean(rule({
    q: String(item.questionDe || ''), type: String(item.type || ''), answer, expected, options,
  }));
}

// ── REVIEW #11 BLOCKER: a rule stated without the condition it holds under ──
//
// `extra-a11-l06-14` explained „Nach brauchen wird ein zu einen: einen
// Computer." — and that is not an imprecise rule, it is a false one: after
// `brauchen` only the MASCULINE `ein` becomes `einen`, feminine `eine` and
// neuter `ein` stay. The course knows this and writes it correctly three times
// („Nach brauchen wird MASKULIN ein zu einen." in `extra-a11-l06-04`, the same
// sentence for `haben` in `extra-a11-l09-07`, and the L6 notice) — and the
// same drawn seven of L6 contains the two error corrections („Ich brauche einen
// Pause." → `eine Pause`, „Ich brauche einen Telefon." → `ein Telefon`) that
// mark wrong exactly what the broken explanation tells the learner to write.
//
// The class is not that line. It is „an explanation asserts a transformation or
// a fixed pairing and does not name the condition under which it holds", and
// the review measured it four more times:
//   * `4aae7de0` „Handy ist neutral, deshalb ein, WIE BEI MASKULINEN NOMEN." —
//     the same error from the other side: after `haben` a masculine noun takes
//     `einen`, so the neuter `ein` is justified with the one gender it differs
//     from.
//   * `fb88c1bb` „Wir steht immer mit haben.", `3c9fff52` „Du steht immer mit
//     hast." — true only WITHIN the verb `haben`, and `885e0528` „Wir steht
//     immer mit sind." contradicts the first verbatim. Eight more items of
//     `verb-haben`/`verb-sein` carry the identical shape.
//
// THE CONDITION, NOT THE LIST. Three clauses, each measured over the whole A1.1
// cache + the hand-written extras (481 explanations) before it was written:
//
//   (A) TRANSFORMATION — „nach <verb> wird …" or „… wird … zu <Artikel>".
//       3 hits, all three in the extras: the two correct ones carry `maskulin`,
//       `extra-a11-l06-14` does not. The second alternative deliberately asks
//       that the TARGET be an article form, because the pronoun substitutions
//       („der Bruder wird zu er.", „Der Stuhl ist maskulin, deshalb wird er zu
//       er.") are correct and name their condition in the noun itself.
//   (B) ABSOLUTE QUANTIFIER — immer/nie/alle/jede(r/s)/ausnahmslos. 29 hits.
//       17 of them name a genus („Endung -ung ist immer feminin.", „Im Plural
//       haben alle Nomen die." — the sentence the review explicitly keeps
//       legal), one names a scope („… auch BEI einer vollen Stunde"), one a
//       named form („Die HÖFLICHKEITSFORM benutzt Sie/Ihr (immer
//       großgeschrieben)"), and the remaining ten are the pronoun/verb pairings
//       above. A person IS a condition — the review lists it next to the genus
//       and the case — EXCEPT in a pairing („X steht immer mit Y"), where the
//       person is the thing being quantified over and the scope that is missing
//       is the verb. The A1.2 draft measures that carve-out from the other side:
//       „wir wechselt den Vokal nie: sprechen bleibt regelmäßig." is scoped by
//       its person and correct, and it must not be caught.
//   (C) CROSS-GENDER EQUATION — „… wie bei <Genus> …" in a sentence that has
//       already named a DIFFERENT genus. 1 hit, `4aae7de0`, 0 false positives.
//   (D) an ELLIPTICAL „deshalb <Artikel>" — the conclusion of a genus argument
//       with the genus left out („… deshalb das.", „… deshalb der Artikel der.").
//       0 hits in A1.1, where every such sentence names its genus, and it is
//       kept because it is the shape the review names and the next author's most
//       likely way back in. It must stay elliptical (at most two words before
//       the article, then the clause ends): measured against the A1.2 draft
//       pool, `/deshalb …/` with a wider window reads nine correct explanations
//       („Die Antwort nennt einen Ort, deshalb braucht die Frage wo.") as
//       conclusions about an article, which they are not.
//
// CARVED OUT AFTER MEASURING, and why: „-Form" words (Höflichkeitsform, du-Form,
// Ihr-Form) count as a condition — a named form IS the scope — and so does a
// following „bei …"/„nur …"/„Endung …". Without that carve-out clause (B) would
// reject `025bbe17`, whose „immer großgeschrieben" is both true and scoped.
//
// NOT REPAIRABLE. The missing word is a fact about German that only the item's
// author knows („maskulin"? „bei haben"?), and a build step that guesses it
// would write the next false rule. So the item is EXCLUDED — and a hand-written
// extra that trips the rule stops the build with its id, which is why
// `extra-a11-l06-14` is repaired in `a11.extra.json` rather than dropped.

/** maskulin / feminin / neutral / Plural … — the genus a rule may be scoped to. */
export const GENDER_WORD_RE = /\b(maskulin\p{L}*|feminin\p{L}*|neutral\p{L}*|sächlich\p{L}*|plural\p{L}*|singular\p{L}*|genus)\b/iu;

/** The case a rule may be scoped to. (At a1.1 these also trip `untaughtForm`.) */
export const CASE_WORD_RE = /\b(nominativ|akkusativ|dativ|genitiv)\b/i;

/** „bei …", „nur …", „Endung …", „die du-Form" — an explicit scope. */
export const SCOPE_WORD_RE = /\bbei\b|\bnur\b|\bendung\b|\b\p{L}+-?form\b/iu;

/**
 * The person a rule may be scoped to — the review's third condition next to the
 * genus and the case. „wir wechselt den Vokal nie: sprechen bleibt regelmäßig."
 * (the A1.2 draft) is a correctly scoped rule: the domain is named (the stem
 * vowel) and `wir` is the condition under which nothing happens.
 */
export const PERSON_WORD_RE = /\b(ich|du|er|sie|es|wir|ihr|man)\b/iu;

/**
 * …EXCEPT in a pairing, where the person is what is being quantified and the
 * missing condition is the VERB: „Wir steht immer mit haben." is false as
 * written (wir steht auch mit sind — the pool says so ten lines further down),
 * and the review names exactly this shape as the one a person does not rescue.
 */
export const PAIRING_RE = /\b(?:steht|stehen)\b[^.!?]{0,20}\bmit\b/iu;

/** True when the sentence names the condition its claim is scoped to. */
export const namesCondition = (sentence) =>
  GENDER_WORD_RE.test(sentence) || CASE_WORD_RE.test(sentence) || SCOPE_WORD_RE.test(sentence) ||
  (PERSON_WORD_RE.test(sentence) && !PAIRING_RE.test(sentence));

/** (A) „Nach brauchen wird ein zu einen." / „… wird ein zu einen." */
export const TRANSFORMATION_RE =
  /\bnach\s+\p{L}+\s+wird\b|\bwird\b[^.;:!?]{0,30}\bzu\s+(?:ein|eine|einen|einem|einer|der|die|das|den|dem)\b/iu;

/** (B) immer / nie / alle / jede(r/s) / ausnahmslos. */
export const ABSOLUTE_QUANTIFIER_RE = /\b(immer|nie|niemals|ausnahmslos|alle|alles|jede|jeder|jedes)\b/iu;

/** (C) „… wie bei maskulinen Nomen" — the genus the claim is compared to. */
export const CROSS_GENDER_RE = /\bwie\s+(?:bei\s+)?\p{L}*(maskulin|feminin|neutral|sächlich|plural)\p{L}*/iu;

/** (D) „deshalb das", „deshalb die Verneinung kein" — a concluded article. */
export const CONCLUDED_ARTICLE_RE =
  /\bdeshalb\s+(?:\p{L}+\s+){0,2}(?:der|die|das|den|dem|ein|eine|einen|kein|keine|keinen)\s*(?:[,.!?]|$)/iu;

/** The genus a sentence names, lower-cased and stemmed to the bare word. */
const genusOf = (text) => {
  const m = GENDER_WORD_RE.exec(String(text || ''));
  if (!m) return null;
  return m[1].toLowerCase().replace(/^(maskulin|feminin|neutral|sächlich|plural|singular).*$/, '$1');
};

/** An explanation split into the sentences a claim can live in. */
const claimSentences = (text) =>
  String(text || '').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

/**
 * unconditionedRuleSentence(item) → { clause, sentence } for the first sentence
 * of `explanationDe`/`hint` that states a rule without its condition, else null.
 */
export function unconditionedRuleSentence(item) {
  if (!item) return null;
  const sentences = [
    ...claimSentences(item.explanationDe),
    ...claimSentences(item.hint),
  ];
  for (const sentence of sentences) {
    if (TRANSFORMATION_RE.test(sentence) && !namesCondition(sentence)) {
      return { clause: 'transformation', sentence };
    }
    if (ABSOLUTE_QUANTIFIER_RE.test(sentence) && !namesCondition(sentence)) {
      return { clause: 'absolute-quantifier', sentence };
    }
    const cross = CROSS_GENDER_RE.exec(sentence);
    if (cross) {
      const compared = cross[1].toLowerCase();
      const asserted = genusOf(sentence.slice(0, cross.index));
      if (asserted && asserted !== compared) return { clause: 'cross-gender', sentence };
    }
    if (CONCLUDED_ARTICLE_RE.test(sentence) && !namesCondition(sentence)) {
      return { clause: 'concluded-article', sentence };
    }
  }
  return null;
}

/** True when an explanation of the item states a rule without its condition. */
export function unconditionedRule(item) {
  return unconditionedRuleSentence(item) !== null;
}

// ── REVIEW #23 Minor 4: the same lint over the HAND-AUTHORED PROSE ───────────
//
// Round 12 closed UNCONDITIONED_RULE over the pool items and wrote down the
// rest: „der Lint läuft über Poolitems, nicht über Karten und notices … die
// Ausweitung braucht erst ein Carve-out“ — because two TRUE card sentences trip
// the item predicate. Both carve-outs are conditions the item clauses simply
// never needed, measured on the 24 shipped cards and the 24 notices:
//
//   * A POSITION CLAIM. „Der Artikel steht immer vor dem Nomen.“ quantifies
//     over WORD ORDER, not over a form choice — the claim carries its whole
//     scope in the place it names (vor dem Nomen, am Ende, auf Position 2).
//     An item explanation never states one (its rules are form rules), which
//     is why `namesCondition` did not need the clause.
//   * A REGISTER WORD. „Die höfliche Form ist Ihr und steht immer mit großem
//     I.“ is scoped by its register — höflich IS the condition, exactly as a
//     genus or a person is. The item-side SCOPE_WORD_RE reaches most of these
//     through „…-Form“; the card sentence writes „die höfliche Form“ as two
//     words, which that regex cannot see.
//
// Everything else is the SAME four clauses as the item lint, one source: a
// false rule is false wherever it is printed, and the card is what
// explain-answer.mjs grounds the model in when a learner is already stuck.
// tests/lesson-pool-rules.test.mjs runs this over every override card and
// every curriculum notice, with the two true sentences and the measured false
// shapes as fixtures.

/** A claim about WHERE something stands — order, not form. */
export const POSITION_CLAIM_RE =
  /\b(?:steht|stehen|kommt|kommen)\b[^.!?]*\b(?:vor\s|nach\s|hinter\s|dahinter|vorn|zuerst|am\s+(?:satz)?ende|am\s+anfang|auf\s+position|an\s+\p{L}+\s+stelle)/iu;

/** The register a rule may be scoped to — höflich is a condition like a genus. */
export const REGISTER_WORD_RE = /\b(?:höflich\p{L}*|informell\p{L}*|formell\p{L}*|Höflichkeitsform)\b/iu;

/**
 * A NAMED GRAMMAR CATEGORY as the domain of the claim. „nicht verneint alles
 * andere: ein Verb, ein Adjektiv oder ein Nomen mit bestimmtem Artikel“ and
 * „Das Perfekt steht in diesem Kurs immer mit haben“ quantify over a word
 * class or a form they NAME — the condition is the category. An item
 * explanation states its rules on words, not on categories (the pool's
 * measured false sentences contain none of these), so the item clauses never
 * needed it. Closed: word classes plus the tense/form names a card may state
 * a rule about. The cases and genus words already live in `namesCondition`.
 */
export const GRAMMAR_CATEGORY_RE =
  /\b(?:Artikel\p{L}*|Nomen|Verb(?:en|s)?|Adjektiv\p{L}*|Pronomen|Präposition\p{L}*|Modalverb\p{L}*|Possessivartikel\p{L}*|Perfekt|Präsens|Partizip\p{L}*|Imperativ\p{L}*|Infinitiv\p{L}*|Fragewort\p{L}*)\b/u;

/**
 * A CONTRACTION as the result of a transformation: „zu dem wird zum, zu der
 * wird zur“ carries no free variable — both sides of the mapping are spelled
 * out, so no condition is missing. Closed: the German preposition-article
 * contractions.
 */
export const CONTRACTION_RESULT_RE = /\bwird\s+(?:zum|zur|am|im|ans|ins|beim|vom)\b/i;

/**
 * unconditionedProseSentence(text) → { clause, sentence } for the first
 * sentence of a card or notice that states a rule without its condition.
 */
export function unconditionedProseSentence(text) {
  for (const sentence of claimSentences(text)) {
    const scoped = namesCondition(sentence) || REGISTER_WORD_RE.test(sentence)
      || GRAMMAR_CATEGORY_RE.test(sentence);
    if (TRANSFORMATION_RE.test(sentence) && !scoped && !CONTRACTION_RESULT_RE.test(sentence)) {
      return { clause: 'transformation', sentence };
    }
    if (ABSOLUTE_QUANTIFIER_RE.test(sentence) && !scoped && !POSITION_CLAIM_RE.test(sentence)) {
      return { clause: 'absolute-quantifier', sentence };
    }
    const cross = CROSS_GENDER_RE.exec(sentence);
    if (cross) {
      const compared = cross[1].toLowerCase();
      const asserted = genusOf(sentence.slice(0, cross.index));
      if (asserted && asserted !== compared) return { clause: 'cross-gender', sentence };
    }
    if (CONCLUDED_ARTICLE_RE.test(sentence) && !scoped) {
      return { clause: 'concluded-article', sentence };
    }
  }
  return null;
}

/**
 * exclusionReason(item) → one of REASON, or null when the item may be drawn.
 * Order matters: the most specific finding wins, so the printed counts read as
 * a diagnosis rather than a pile.
 */
export function exclusionReason(item, { level } = {}) {
  if (!item) return REASON.HAND_FLAGGED;
  if (Object.prototype.hasOwnProperty.call(EXCLUDE_IDS, item.id)) return REASON.HAND_FLAGGED;

  const q = String(item.questionDe || '');
  const all = [q, ...fields(item)].join(' · ');
  if (SOUNDS_LIKE_RE.test(q) || RESPELLING_RE.test(all)) return REASON.ENGLISH_RESPELLING;
  if (hasEnglish(q)) return REASON.ENGLISH_PROMPT;
  if (fields(item).some(hasEnglish)) return REASON.ENGLISH_ANSWER;

  const expects = [item.answer, ...(item.accepted || [])].join(' ');
  if (NEGATION_ANSWER_RE.test(expects) && !NEGATION_CUE_RE.test(q)) return REASON.NEGATION_WITHOUT_CUE;

  // The level's syllabus, not German — see LEVEL SCOPE in the header.
  if (!level || String(level).toLowerCase() === SCOPED_LEVEL) {
    const expected = [item.answer, ...(item.accepted || [])].map((a) => bare(a));
    if (ORDINAL_CUE_RE.test(q) || expected.some((a) => ORDINAL_WORD_RE.test(a))) return REASON.ORDINAL_NUMBER;
    if (MONTH_SCOPED_TOPIC_RE.test(String(item.topic || '')) && (MONTH_RE.test(q) || MONTH_RE.test(expects))) {
      return REASON.MONTH_NAME;
    }
    if (UNTAUGHT_TIME_RE.test(q)) return REASON.UNTAUGHT_TIME_EXCEPTION;
    // REVIEW #7 BLOCKER 3, last of the level-scoped rules so that every id an
    // older reason already names keeps the reason it was pinned with.
    if (untaughtForm(item)) return REASON.UNTAUGHT_FORM;
  }

  if (answerInPrompt(item)) return REASON.ANSWER_IN_PROMPT;
  if (isMetaPrompt(item)) return REASON.META_PROMPT;

  // REVIEW #3. Both rules sit AFTER the older ones on purpose: the ids the test
  // suites pin to a reason keep the reason they were pinned with.
  if (verbCueOnlyInGloss(item)) return REASON.VERB_CUE_ONLY_IN_GLOSS;
  if (statementNoTask(item)) return REASON.STATEMENT_NO_TASK;

  // REVIEW #4, last for the same reason: an id already pinned to an older
  // reason keeps it.
  if (articleCueOnlyInGloss(item)) return REASON.ARTICLE_CUE_ONLY_IN_GLOSS;

  // REVIEW #5, last for the same reason again. Note the ORDER between these two
  // and the article rule above is load-bearing in one direction only: a
  // sentence-building item whose article is missing is REPAIRABLE, so it must
  // report the repairable reason; a cue/answer mismatch is not, and must never
  // be mistaken for one.
  if (cueAnswerMismatch(item)) return REASON.CUE_ANSWER_MISMATCH;
  if (metalinguisticPrompt(item)) return REASON.METALINGUISTIC_PROMPT;

  // REVIEW #6, last for the same reason once more: every id the suites pin to
  // an older reason keeps it. Repairable (the build widens `accepted` with the
  // minimal same-family correction), so it must report its own reason rather
  // than share one — an unrepairable instance is what the count is for.
  if (ambiguousCorrection(item)) return REASON.AMBIGUOUS_CORRECTION;

  // REVIEW #11, last for the same reason once more: an id a suite pins to an
  // older reason keeps it. NOT level-scoped — a false rule is false at every
  // level — and not repairable: the missing condition is authorship.
  if (unconditionedRule(item)) return REASON.UNCONDITIONED_RULE;

  // REVIEW #12 BLOCKER 2, last for the same reason once more. NOT repairable by
  // a build step: naming the element that changes is authorship, so a cache
  // item is dropped and a hand item has to carry the cue („Korrigieren Sie das
  // Verb: …") before it may ship.
  if (agreementAmbiguity(item)) return REASON.AMBIGUOUS_AGREEMENT;

  // REVIEW #13 BLOCKER 2, last for the same reason once more. Not repairable by
  // a build step either: the fix is the cue the course already writes
  // („Korrigieren Sie den Artikel: …"), and writing it is authorship.
  if (genderPairAmbiguity(item, { level })) return REASON.AMBIGUOUS_GENDER_PAIR;

  return null;
}

/** True when the item is fit for controlled practice. */
export const isUsableItem = (item, options) => exclusionReason(item, options) === null;

/**
 * filterPool(items) → { kept, excluded, counts }
 * `excluded` is [{ id, topic, reason, questionDe }] so the build script can
 * print what it threw away and why.
 */
export function filterPool(items = [], options) {
  const kept = [];
  const excluded = [];
  const counts = Object.fromEntries(REASONS.map((r) => [r, 0]));
  for (const item of items) {
    const reason = exclusionReason(item, options);
    if (!reason) {
      kept.push(item);
      continue;
    }
    counts[reason] += 1;
    excluded.push({
      id: item.id, topic: item.topic, reason, questionDe: item.questionDe, answer: item.answer,
      note: EXCLUDE_IDS[item.id] || null,
    });
  }
  return { kept, excluded, counts };
}

export default filterPool;
