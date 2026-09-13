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
// LEVEL SCOPE. Three of the rules are about what A1.1 has taught by Lektion 12,
// not about German: an ordinal or a month name is perfectly fine at A2. They
// apply unless the caller names a level other than a1.1 — the default is the
// strict one, so an engine-side call (`isUsableItem(item)`, which has no level
// to hand) can never be the loophole that lets one back in.

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
});

/** The level whose taught-by-now rules below apply. */
export const SCOPED_LEVEL = 'a1.1';

/** Reasons that are about the level's syllabus rather than about German. */
export const LEVEL_SCOPED_REASONS = Object.freeze([
  REASON.ORDINAL_NUMBER, REASON.MONTH_NAME, REASON.UNTAUGHT_TIME_EXCEPTION,
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
 * REVIEW #6 BLOCKER 1. The polite (Höflichkeitsform) capitals, as a CLASS.
 *
 * Round 5 closed the same finding as a LIST — three ids got `caseSensitive:
 * true` by hand — and round 6 measured the list from both ends: two more items
 * of exactly the same shape never got the flag (`Frau Müller, ___ sind sehr
 * freundlich.` marks `sie` as a typo, i.e. as CORRECT, while the identical
 * `Frau Kaya, sprechen ___ Englisch?` marks it wrong), and the repetition cards
 * built by `reviewService.buildCardIndex` carry no such field at all, so every
 * review card was case-blind. The fix is to DERIVE the flag from the answer key
 * and keep the hand entry as an override — `item.caseSensitive === true ||
 * politeCaseItem(item)` in `scripts/build-lesson-pool.mjs`.
 *
 * The predicate is the review's, verbatim, and both of its clauses are narrow
 * on purpose:
 *   * ONE-WORD answers only count when NO lowercase variant is accepted. That
 *     is what keeps `extra-a11-l12-10` (`['Ihre','ihre']` — their presents, 3rd
 *     person plural) and `extra-a11-l03-02` (`['Sie','sie']` — she, the sister)
 *     out: an item that accepts both spellings is not teaching the capital.
 *   * SENTENCE answers are narrowed to the POSSESSIVE, and to a possessive that
 *     is not the first word — a sentence-initial capital says nothing, and a
 *     word-order item like `extra-a11-l10-08` must not become wholly wrong over
 *     one letter.
 */
export const POLITE_FORM_RE = /^(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)$/;

export function politeCaseItem(item) {
  const acc = [item?.answer, ...(item?.accepted || [])].map((a) => String(a ?? '').trim()).filter(Boolean);
  if (!acc.length) return false;
  if (acc.every((a) => !a.includes(' '))) return acc.every((a) => POLITE_FORM_RE.test(a));
  return acc.every((a) => a.split(/\s+/).slice(1).some((w) => /^Ihr(e|en|em|er|es)?$/.test(w.replace(/[.,!?]/g, ''))));
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
