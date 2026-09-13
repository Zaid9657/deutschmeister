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
 * REVIEW #3 BLOCKER 2. The task formulas an A1.1 prompt uses. Both registers,
 * because the register normaliser in the build script turns the du-forms into
 * Sie-forms and this rule has to hold on both sides of that change.
 */
export const TASK_FORMULA_RE =
  /(bilden sie|bilde|korrigieren sie|korrigiere|schreiben sie|schreib|ergänzen sie|ergänze|wählen sie|wähle|welche[rs]?|buchstabiert|hören sie|setzen sie|setze|finden sie|finde|antworte|wie heißt|sagen sie|füllen sie|lesen sie)/i;

/** A quoted sentence the item asks the learner to work on: „…“ or "…". */
export const QUOTED_SPAN_RE = /[„"“][^„"“]+[“"]/;

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

const DEF_NOM = set('der', 'die', 'das');
const DEF_ALL = set('der', 'die', 'das', 'den', 'dem');
const INDEF = set('ein', 'eine', 'einen', 'einem', 'einer', 'kein', 'keine', 'keinen', 'keinem', 'keiner');
const PRONOUNS = set('ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr');
const SEIN = set('bin', 'bist', 'ist', 'sind', 'seid');
const HABEN = set('habe', 'hast', 'hat', 'haben', 'habt');
const PREFIXES = set('auf', 'an', 'ein', 'mit', 'um', 'ab', 'zu', 'aus', 'zurück', 'los', 'weg');
const POSSESSIVE_RE = /^(mein|dein|sein|ihr|unser|euer)(e|en|em|er|es)?$/;
const TIME_WORD_RE =
  /^(um|am|im|uhr|halb|viertel|nach|vor|morgens|mittags|nachmittags|abends|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|eins|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwanzig|dreissig|vierzig|fuenfzig)$/;
const FINITE_RE = /^[a-zäöüß]+(e|st|t|en|et)$/i;
/** The prompt's last word before the final punctuation is a separable prefix. */
const endsOnPrefix = (q) => {
  const toks = wordsFlat(String(q).replace(/\([^)]*\)\s*$/, ''));
  const tail = toks[toks.length - 1];
  return Boolean(tail) && PREFIXES.has(tail);
};

/** "(arbeiten)", "(aufstehen, nur die Vorsilbe)" — an infinitive cue in the prompt. */
const INFINITIVE_CUE_RE = /\([^)]*[a-zäöüß]{2}en\b[^)]*\)/i;

/** Predicate per slug. Each one reads what the learner produces, not the label. */
const DRILLS = {
  'nouns-gender': ({ expected, options, answer }) =>
    expected.some((a) => isOneOf(a, DEF_NOM)) ||
    /^(der|die|das)\s/i.test(answer) ||
    (options.length > 0 && options.every((o) => isOneOf(o, DEF_NOM))),

  'definite-articles': ({ expected, options, answer }) =>
    expected.some((a) => isOneOf(a, DEF_ALL)) ||
    /^(der|die|das|den|dem)\s/i.test(answer) ||
    (options.length > 0 && options.every((o) => isOneOf(o, DEF_ALL))),

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

  'possessive-articles': ({ expected, options }) =>
    expected.some((a) => POSSESSIVE_RE.test(flat(bare(a)))) ||
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

  // A yes/no question is the finite verb in first position, so an item drills it
  // when the learner writes the whole question, chooses Ja/Nein, is asked for a
  // Frage by name, or fills the verb slot AT THE FRONT of a question.
  'yes-no-questions': ({ q, expected, options }) =>
    expected.some((a) => /\?\s*$/.test(String(a).trim())) ||
    options.some((o) => isOneOf(o, set('ja', 'nein'))) ||
    /(bilden sie|bilde|schreiben sie|schreib)\s+(sie\s+)?(die\s+)?(höfliche\s+|richtige\s+)?frage/i.test(q) ||
    (/^\s*_{2,}/.test(q) && /\?/.test(q)),

  'time-and-dates': ({ expected }) =>
    expected.some((a) => /uhr/i.test(String(a)) || wordsFlat(a).some((w) => TIME_WORD_RE.test(w))),
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
  return Boolean(rule({ q: String(item.questionDe || ''), answer, expected, options }));
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
