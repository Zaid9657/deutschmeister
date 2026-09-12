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
