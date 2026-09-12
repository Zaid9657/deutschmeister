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
// Reasons are stable strings: the build script prints counts per reason and
// tests/lesson-engine.test.mjs pins them.

export const REASON = Object.freeze({
  HAND_FLAGGED: 'hand-flagged',
  ENGLISH_RESPELLING: 'english-respelling',
  ENGLISH_PROMPT: 'english-prompt',
  ENGLISH_ANSWER: 'english-answer',
  NEGATION_WITHOUT_CUE: 'negation-without-cue',
});

export const REASONS = Object.freeze(Object.values(REASON));

/**
 * Hand-flagged items, id → why. Keep this list SHORT: a pattern that shows up
 * twice belongs in a rule below, not here. Every entry cites the review.
 */
export const EXCLUDE_IDS = Object.freeze({
  // REVIEW §L9, BLOCKER: "Das ist ___ Uhr." expects `keine`, but nothing in the
  // prompt asks for a negation — the correct answer `eine` is marked wrong.
  'bb0ead84-4c69-547b-b8aa-b791b1c0e375': 'expects keine with no negation cue (REVIEW L9 BLOCKER)',
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
export function exclusionReason(item) {
  if (!item) return REASON.HAND_FLAGGED;
  if (Object.prototype.hasOwnProperty.call(EXCLUDE_IDS, item.id)) return REASON.HAND_FLAGGED;

  const q = String(item.questionDe || '');
  const all = [q, ...fields(item)].join(' · ');
  if (SOUNDS_LIKE_RE.test(q) || RESPELLING_RE.test(all)) return REASON.ENGLISH_RESPELLING;
  if (hasEnglish(q)) return REASON.ENGLISH_PROMPT;
  if (fields(item).some(hasEnglish)) return REASON.ENGLISH_ANSWER;

  const expects = [item.answer, ...(item.accepted || [])].join(' ');
  if (NEGATION_ANSWER_RE.test(expects) && !NEGATION_CUE_RE.test(q)) return REASON.NEGATION_WITHOUT_CUE;

  return null;
}

/** True when the item is fit for controlled practice. */
export const isUsableItem = (item) => exclusionReason(item) === null;

/**
 * filterPool(items) → { kept, excluded, counts }
 * `excluded` is [{ id, topic, reason, questionDe }] so the build script can
 * print what it threw away and why.
 */
export function filterPool(items = []) {
  const kept = [];
  const excluded = [];
  const counts = Object.fromEntries(REASONS.map((r) => [r, 0]));
  for (const item of items) {
    const reason = exclusionReason(item);
    if (!reason) {
      kept.push(item);
      continue;
    }
    counts[reason] += 1;
    excluded.push({ id: item.id, topic: item.topic, reason, questionDe: item.questionDe });
  }
  return { kept, excluded, counts };
}

export default filterPool;
