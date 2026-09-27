// Answer checking for the lesson engine (docs/course-standard-2026-09-12.md §3).
// Rules: normalise like the rest of the site (src/utils/answerMatch.js), allow
// ONE typo-class slip (Levenshtein ≤ 1 on a word of ≥ 5 letters, diacritics,
// capitalisation) and count it as correct-with-warning — but an article or an
// ending is never a typo: if the expected answer is a short function word
// (≤ 4 letters: der/die/das/ein/eine/dem/den…) or the user's slip changes the
// final letter of a word (an ending), it is wrong.
//
// Three things are decided by the ITEM rather than by the call site or the
// answer string: `isCaseTask(item)` is `item.caseSensitive === true` and
// nothing else (REVIEW #5 BLOCKER 3); `isDictationTask(item)` reads
// kind/type/stage so every grading site agrees on whether a dictation's
// dashes and digit grouping are folded (REVIEW #6 BLOCKER 3); and
// `checkOptionsFor(item)` bundles both of those plus `strict`/`spelling` into
// the one options object every call site should pass to `checkAnswer`.
// `tagError` reads WHERE a sentence differs instead of booking every
// sentence_building miss as 'Verbstellung' (REVIEW #5 MAJOR 14), and a number
// word never reads as a conjugation slip just because the item's topic is a
// verb topic (REVIEW #6 MAJOR 9) — see the decision table above
// tagSentenceError.
import { normalizeAnswer } from '../../utils/answerMatch.js';

export const RESULT = { CORRECT: 'correct', TYPO: 'typo', WRONG: 'wrong' };

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length; const n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** An ellipsis, typographic (U+2026) or typed as three or more dots: a pause, never a word. */
const ELLIPSIS_RE = /…|\.{3,}/g;

/**
 * Punctuation folding for every check. An ellipsis becomes a space first
 * (course-v2 review a2.2-u04 r3 F02, a plain bug fix: „…" survived this fold, so
 * the key „Mir wird schlecht… und ein bisschen kalt." rejected every typed
 * transcription — the pause is heard, the character is not; „...", typed, lost
 * its dots here but glued the neighbouring words together).
 */
export const stripPunct = (s) =>
  String(s ?? '').replace(ELLIPSIS_RE, ' ')
    .replace(/[“”„‟«»‹›]/g, '"').replace(/[‘’‚‛ʼ´`]/g, "'")
    .replace(/[.,!?;:"']/g, '').replace(/\s+/g, ' ').trim();

/**
 * Dictation normalisation (REVIEW #2 fix 5). Lektion 6 dictates a phone number,
 * and "0176 234567" is the same answer as "0176-2345 67": the grouping is a
 * choice of the writer, not of the speaker, and a dash is unhearable. So for a
 * dictation — and only there — every dash form becomes a space, the separators
 * inside a run of digits are removed, and the run is compared as one number.
 * An ellipsis is a pause and becomes a space like a dash (course-v2 a2.2-u04 r3
 * F02). Typographic quotes are folded by stripPunct above, for every check.
 */
export function normalizeDictation(text) {
  return String(text ?? '')
    .replace(ELLIPSIS_RE, ' ')
    .replace(/[‐-―−－-]/g, ' ')
    .replace(/(\d)[\s./]+(?=\d)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The characters of `text` that no dictation fold removes and that are neither a
 * letter, a digit nor whitespace — „(", „)", „/" between words, „%", „€", „&" …
 * A dictation key containing one can never be typed from what is heard
 * (course-v2 rule ITM-13, review a2.2-u04 r3 F02). De-duplicated, in order.
 */
export function unfoldedDictationChars(text) {
  const rest = stripPunct(normalizeDictation(text)).replace(/[\p{L}\p{M}\p{N}\s]/gu, '');
  return [...new Set(rest)];
}

// ── number words ↔ digits (dictation) ──────────────────────────────────────────
//
// A dictation hears „fünfzehn Euro"; „15 Euro" is the same transcription. The
// course-v2 reviews found the class three times (a2.2-u04 r2 F07, b1.1-u04 r2
// F05, a1.1-u04 r2 F01), and the live A1.1 course dictates „Der Tisch kostet
// fünfzehn Euro." and „Die Pause ist um eins." as well. foldNumberWords turns
// every cardinal (null … 9999) and ordinal word (erste … neunundneunzigste) into
// digits, so both spellings compare equal. „ein/eine/einen" are articles and
// never fold; only the counting form „eins" is a number.

const UNITS = { null: 0, eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
const TEENS = { zehn: 10, elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
const TENS = { zwanzig: 20, dreißig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
/** The first element of „einundzwanzig", „einhundert", „eintausend". */
const UNIT_PREFIX = { ein: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
const TENS_ALT = Object.keys(TENS).join('|');

/** 1–99: „drei", „dreizehn", „dreiundzwanzig", „dreißig". */
function below100(w) {
  if (!w) return null;
  if (w in TEENS) return TEENS[w];
  if (w in TENS) return TENS[w];
  if (w !== 'null' && w in UNITS) return UNITS[w];
  const m = new RegExp(`^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(${TENS_ALT})$`).exec(w);
  return m ? UNIT_PREFIX[m[1]] + TENS[m[2]] : null;
}

/** 1–999: „hundert", „zweihundertfünf", „hundertelf". */
function below1000(w) {
  const i = w.indexOf('hundert');
  if (i < 0) return below100(w);
  const head = w.slice(0, i);
  const tail = w.slice(i + 'hundert'.length);
  const h = head === '' ? 1 : UNIT_PREFIX[head];
  if (!h) return null;
  if (!tail) return h * 100;
  const t = below100(tail);
  return t === null ? null : h * 100 + t;
}

/** Spelling variants a learner types without German letters: ss → ß, ue/oe → ü/ö. */
const germanLetters = (word) => String(word ?? '').toLowerCase()
  .replace(/ss/g, 'ß').replace(/ue/g, 'ü').replace(/oe/g, 'ö');

/** A cardinal word (0–9999) as a number, or null: „zweitausendvierundzwanzig" → 2024. */
export function cardinalValue(word) {
  const w = germanLetters(word);
  if (!w) return null;
  if (w === 'null') return 0;
  const i = w.indexOf('tausend');
  if (i < 0) return below1000(w);
  const head = w.slice(0, i);
  const tail = w.slice(i + 'tausend'.length);
  const k = head === '' ? 1 : UNIT_PREFIX[head];
  if (!k) return null;
  if (!tail) return k * 1000;
  const r = below1000(tail);
  return r === null ? null : k * 1000 + r;
}

const ORDINAL_SPECIAL = { erst: 1, dritt: 3, siebt: 7, siebent: 7, acht: 8 };

/** An ordinal word as a number, or null: „dritten" → 3, „zwanzigste" → 20. */
export function ordinalValue(word) {
  const m = /^(\p{L}+?)(e|en|er|es|em)$/u.exec(germanLetters(word));
  if (!m) return null;
  const stem = m[1];
  if (stem in ORDINAL_SPECIAL) return ORDINAL_SPECIAL[stem];
  if (stem.endsWith('st')) {
    const v = cardinalValue(stem.slice(0, -2));
    if (v !== null && v >= 20) return v;
  }
  if (stem.endsWith('t')) {
    const v = cardinalValue(stem.slice(0, -1));
    if (v !== null && v >= 2 && v < 20) return v;
  }
  return null;
}

/** Every cardinal and ordinal word of `text` as digits („am dritten Juni" → „am 3. Juni"). */
export function foldNumberWords(text) {
  return String(text ?? '').replace(/\p{L}+/gu, (word) => {
    const c = cardinalValue(word);
    if (c !== null) return String(c);
    const o = ordinalValue(word);
    return o !== null ? `${o}.` : word;
  });
}

/** True when `text` holds a digit or a number word (ITM-07's test on a dictation). */
export const hasNumber = (text) => /\d/.test(foldNumberWords(text));

/**
 * Spelled-out-word normalisation (REVIEW #4 BLOCKER 1). "Buchstabieren Sie den
 * Gruß: Hallo → ___" with `answer: 'H-A-L-L-O'` used to reject `HALLO` and
 * `H A L L O`: stripPunct never removed dashes, so the task writer's choice of
 * separator became the exam question. Every dash variant becomes a space and the
 * whitespace BETWEEN single letters is then removed, so the letter sequence is
 * compared as one word however the learner separated it.
 */
export function normalizeSpelling(text) {
  return String(text ?? '')
    .replace(/[\u2010-\u2015\u2212\uFF0D-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(?<=(^|\s)\p{L})\s+(?=\p{L}(\s|$))/gu, '')
    .trim();
}

/** An expected answer that is a spelled-out word: "H-A-L-L-O", "T S C H Ü S S". */
export const SPELLED_OUT_RE = /^\p{L}([-\s]\p{L})+$/u;

/** True when any accepted answer is a spelled-out letter sequence. */
export function spellingApplies(expected) {
  const list = Array.isArray(expected) ? expected : [expected];
  return list.some((a) => SPELLED_OUT_RE.test(String(a ?? '').trim()));
}

function endingDiffers(user, expected) {
  const u = user.split(' '); const e = expected.split(' ');
  if (u.length !== e.length) return true;
  return u.some((w, i) => w !== e[i] && w.slice(-1) !== e[i].slice(-1));
}

/**
 * Topics where a one-letter slip IS the answer — an article, a possessive, a
 * pronoun or a plural is nothing but its ending, so there is no typo to forgive.
 *
 * NARROWED by REVIEW #2 §E: the old pattern also matched every verb topic, i.e.
 * nine of the twelve Lektionen, and the engine checks WHOLE TYPED SENTENCES on
 * those ("Ich brauche ein Handy."). A missing umlaut on a foreign keyboard then
 * came back as a grammar error with a tagError and a requeue. Verb topics get
 * the Levenshtein allowance again; the ending topics do not.
 */
export const STRICT_TOPIC = /article|possessive|pronoun|plural|kasus|case/i;

/**
 * Strictness is also bounded by the SHAPE of the expected answer: at most one
 * space. "Der" and "Viertel vor" are an ending and a chunk, and a slip in them
 * is the mistake the item is about; a full sentence is mostly spelling, and is
 * always allowed its one typo (REVIEW #2 §E).
 */
export const STRICT_MAX_SPACES = 1;

/** True when `expected` is short enough for strict mode to apply to it. */
export function strictApplies(expected) {
  const norm = stripPunct(normalizeAnswer(expected));
  return (norm.match(/ /g) || []).length <= STRICT_MAX_SPACES;
}

/**
 * A case-only difference: the two strings are the same answer once case is
 * folded, but not with the case the learner typed. Umlaut respellings
 * (waere/wäre) are NOT case-only — they stay the forgiven spelling they were.
 */
function caseOnlyDiff(rawUser, rawAccepted) {
  return rawUser !== rawAccepted && rawUser.toLowerCase() === rawAccepted.toLowerCase();
}

/**
 * checkAnswer(userInput, expected: string | string[],
 *   { strict, dictation, caseSensitive, spelling }) → { result, expected, reason? }.
 *
 * result ∈ RESULT, `expected` echoes the best matching accepted answer, and
 * `reason: 'case'` marks a miss that is nothing but Groß-/Kleinschreibung so the
 * UI can say so.
 *
 * strict = true disables the typo allowance for single-token answers (pass
 * STRICT_TOPIC.test(item.topic)); dictation = true additionally folds dashes and
 * digit grouping (see normalizeDictation); spelling = true folds the separators
 * of a spelled-out word (see normalizeSpelling) and is turned on automatically
 * when an accepted answer looks like one (REVIEW #4 BLOCKER 1).
 *
 * caseSensitive = true makes capitalisation part of the answer (REVIEW #4
 * BLOCKER 3: the polite `Ihr`, whose whole point is the capital I) — a case-only
 * miss is then RESULT.WRONG and tagError calls it 'Rechtschreibung'. With
 * caseSensitive off a case-only miss is RESULT.TYPO, i.e. one retry, which is
 * what the standard §3 says capitalisation is worth; it is NOT silently correct
 * any more. Spelled-out words have no meaningful case and are exempt.
 */
export function checkAnswer(userInput, expected, {
  strict = false, dictation = false, caseSensitive = false, spelling = false,
} = {}) {
  const accepted = (Array.isArray(expected) ? expected : [expected]).filter(Boolean);
  const spellingMode = spelling || spellingApplies(accepted);
  const fold = (s) => {
    let t = String(s ?? '');
    if (dictation) t = normalizeDictation(t);
    if (spellingMode) t = normalizeSpelling(t);
    return t;
  };
  // Raw = trimmed, whitespace-collapsed, punctuation-folded — but case and
  // umlauts preserved, so it can answer the capitalisation question.
  const raw = (s) => stripPunct(fold(s));
  const prepare = (s) => stripPunct(normalizeAnswer(fold(s)));
  const user = prepare(userInput);
  const rawUser = raw(userInput);
  if (!user) return { result: RESULT.WRONG, expected: accepted[0] || '' };

  for (const a of accepted) {
    if (raw(a) === rawUser) return { result: RESULT.CORRECT, expected: a };
  }
  for (const a of accepted) {
    if (prepare(a) !== user) continue;
    if (spellingMode || !caseOnlyDiff(rawUser, raw(a))) return { result: RESULT.CORRECT, expected: a };
    return caseSensitive
      ? { result: RESULT.WRONG, expected: a, reason: 'case' }
      : { result: RESULT.TYPO, expected: a, reason: 'case' };
  }
  for (const a of accepted) {
    if (strict && strictApplies(a)) continue;
    const norm = prepare(a);
    const shortFunctionWord = norm.length <= 4 && !norm.includes(' ');
    if (shortFunctionWord) continue;
    if (norm.length >= 5 && levenshtein(user, norm) === 1 && !endingDiffers(user, norm)) {
      return { result: RESULT.TYPO, expected: a };
    }
  }
  return { result: RESULT.WRONG, expected: accepted[0] || '' };
}

/**
 * True when capitalisation IS the task — decided by the TASK, not by the shape
 * of the answer: `item.caseSensitive === true` and nothing else (REVIEW #5
 * BLOCKER 3).
 *
 * The previous version tested the accepted answers against
 * `/^Ihr(e|en)?$/` on possessive-article items, and a regex on the answer form
 * cannot tell a polite `Ihr` from a capitalised sentence opener: it fired on
 * `extra-a11-l12-10` ("___ Geschenke sind hier. (sie, Plural)", accepted
 * `Ihre`), where the item's own explanation says the answer is *ihre* — the
 * learner typed what the explanation taught and got a red X — and it missed
 * `extra-a11-l03-08` ("sprechen ___ Englisch?" → `Sie`) and
 * `extra-a11-l01-06` ("Wie geht es ___?" → `Ihnen`), the two places where the
 * polite capital IS the point, because neither is a possessive-article item.
 * The flag is now carried by the item itself (the items own it, the checker
 * only reads it), so `Sie/Ihnen/Ihr/Ihre` politeness items opt in wherever they
 * live and a plain sentence-initial capital never does. Pass the result as
 * `checkAnswer(..., { caseSensitive: isCaseTask(item) })`.
 */
export function isCaseTask(item) {
  return item?.caseSensitive === true;
}

/**
 * True when the item is a dictation (heard, not read) — decided by the ITEM,
 * not by the call site (REVIEW #6 BLOCKER 3, the second half). Round 5 made
 * `caseSensitive` an item flag but left `dictation` to whoever calls
 * `checkAnswer`, and `buildCheckpoint.js`'s `isItemCorrect()` was one of the
 * call sites that never passed it: the one dictation with a separator
 * (`a1.1-cp2-hoeren-1`, a phone number) graded `correct` in the lesson and
 * `wrong` in the checkpoint for the exact same typed answer. `kind: 'dictation'`
 * and `type: 'dictation'` cover how the pool marks a dictation item today;
 * `stage === 'listening'` covers the checkpoint's own listening section, which
 * carries dictation-shaped answers without either field.
 */
export const isDictationTask = (item) =>
  item?.kind === 'dictation' || item?.type === 'dictation' || item?.stage === 'listening';

/**
 * Derive every checkAnswer() option from the ITEM alone, so every grading site
 * (PracticeItem, DictationItem, buildCheckpoint.isItemCorrect, reviewGrading)
 * calls the same `checkAnswer(user, expected, checkOptionsFor(item))` and an
 * answer is graded the same way wherever it is graded (REVIEW #6 BLOCKER 3):
 * which check rules apply to an answer is a decision the item carries, never
 * one the call site makes up on its own.
 */
export function checkOptionsFor(item) {
  const accepted = item?.accepted && item.accepted.length ? item.accepted : [item?.answer];
  return {
    strict: STRICT_TOPIC.test(item?.topic || ''),
    caseSensitive: isCaseTask(item),
    dictation: isDictationTask(item),
    spelling: spellingApplies(accepted),
  };
}

// Error tags (standard §3): what a miss is about, for remediation and review.
export const ERROR_TAGS = ['Artikel', 'Kasus', 'Verbstellung', 'Konjugation', 'Plural', 'Rechtschreibung', 'Hören', 'Wortschatz'];

const ARTICLES = new Set(['der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer', 'dem', 'den', 'des', 'kein', 'keine', 'keinen', 'mein', 'meine', 'dein', 'deine', 'sein', 'seine', 'ihr', 'ihre', 'unser', 'unsere', 'euer', 'eure']);

/** A possessive/indefinite determiner: the ones whose ENDING carries the case. */
const POSSESSIVE_RE = /^(ein|kein|mein|dein|sein|ihr|unser|euer)/;

/** Article vs Kasus, as the single-word branch has always decided it. */
const articleTag = (usr, exp) => (POSSESSIVE_RE.test(exp) && ARTICLES.has(usr) ? 'Kasus' : 'Artikel');

/** Personal endings of a finite German verb (plus the weak preterite set). */
const VERB_ENDING_RE = /(e|st|t|en|et|te|ten|tet|test)$/;

/**
 * Number words (null…zwölf, zwanzig…hundert), normalised the same way `tagError`
 * normalises the expected answer (normalizeAnswer folds ö→oe, ß→ss, lowercases).
 * REVIEW #6 MAJOR 9: four L2 items teach a telephone number / letter count
 * under `topic: 'verb-sein'` (the lesson has no topic of its own for numbers),
 * so a misspelt number word fell into the topic-based Konjugation clause below
 * and a learner who wrote "sieber" for "sieben" was told the mistake was verb
 * conjugation. A number-word miss is a spelling/vocabulary miss whatever the
 * item's topic says, so it is checked and tagged before the topic is ever read.
 */
const NUMBER_WORDS = new Set([
  'null', 'eins', 'ein', 'zwei', 'drei', 'vier', 'fuenf', 'sechs', 'sieben', 'acht', 'neun',
  'zehn', 'elf', 'zwoelf',
  'zwanzig', 'dreissig', 'vierzig', 'fuenfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig',
  'hundert',
]);

/** True when the expected answer IS a number word or a bare digit string. */
const isNumberAnswer = (exp) => NUMBER_WORDS.has(exp) || /^\d+$/.test(exp);

/** Longest common prefix length — a cheap stand-in for "same stem". */
function commonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
}

/**
 * Two finite forms of the same verb: both end in a personal ending and they
 * share a stem of at least three characters (spreche/spricht → `spr`). Deliberately
 * loose — it only has to separate a conjugation slip from a different word.
 */
function sameLemmaVerb(usr, exp) {
  if (!usr || !exp || usr === exp) return false;
  if (!VERB_ENDING_RE.test(usr) || !VERB_ENDING_RE.test(exp)) return false;
  return commonPrefix(usr, exp) >= 3;
}

const words = (s) => (s ? s.split(' ').filter(Boolean) : []);

/** Which words are in `exp` but not in `usr`, and vice versa (multiset diff). */
function bagDiff(usrWords, expWords) {
  const onlyUser = [...usrWords];
  const onlyExp = [];
  for (const w of expWords) {
    const i = onlyUser.indexOf(w);
    if (i >= 0) onlyUser.splice(i, 1);
    else onlyExp.push(w);
  }
  return { onlyUser, onlyExp };
}

/**
 * Tag a miss on a SENTENCE answer by reading WHERE the sentence differs
 * (REVIEW #5 MAJOR 14). The old rule booked every `sentence_building` miss as
 * 'Verbstellung' — a missing article, a misspelt number and a wrong separable
 * prefix all came back as a word-order problem, and those tags are what the
 * checkpoint shows the learner and what the remediation set is drawn from.
 *
 * Decision order (first match wins), returning null when the sentence differs
 * in more than one place and the caller's topic rules should decide:
 *   1. same words, different order                     → 'Verbstellung'
 *   2. yes-no question: '?' missing, or the expected
 *      first word (the finite verb) is not first       → 'Verbstellung'
 *   3. one word too many, none missing: article → 'Artikel', else 'Wortschatz'
 *   4. exactly one word differs (or is missing):
 *      a. the expected word is an article/possessive    → 'Artikel' ('Kasus'
 *         when a possessive was swapped for another determiner)
 *      b. same verb lemma, other finite form            → 'Konjugation'
 *      c. expected word ≥ 5 letters, Levenshtein ≤ 2    → 'Rechtschreibung'
 *      d. anything else (incl. a short wrong word such
 *         as a separable prefix: ab ↔ an)               → 'Wortschatz'
 * A miss that is nothing but Groß-/Kleinschreibung never reaches here: the
 * case-only check above tags it 'Rechtschreibung' first.
 */
function tagSentenceError(item, userInput, expected, usr, exp) {
  const usrWords = words(usr);
  const expWords = words(exp);
  const { onlyUser, onlyExp } = bagDiff(usrWords, expWords);

  if (!onlyUser.length && !onlyExp.length) {
    return usr === exp ? null : 'Verbstellung';
  }

  if (item?.topic === 'yes-no-questions') {
    if (String(expected ?? '').includes('?') && !String(userInput ?? '').includes('?')) return 'Verbstellung';
    if (expWords.length && usrWords.includes(expWords[0]) && usrWords[0] !== expWords[0]) return 'Verbstellung';
  }

  // One word too many and nothing missing: the same reading, from the other side.
  if (!onlyExp.length && onlyUser.length === 1) {
    return ARTICLES.has(onlyUser[0]) ? 'Artikel' : 'Wortschatz';
  }

  if (onlyExp.length === 1 && onlyUser.length <= 1) {
    const e = onlyExp[0];
    const u = onlyUser[0] || '';
    if (ARTICLES.has(e)) return articleTag(u, e);
    if (sameLemmaVerb(u, e)) return 'Konjugation';
    if (u && e.length >= 5 && levenshtein(u, e) <= 2) return 'Rechtschreibung';
    return 'Wortschatz';
  }
  return null;
}

/**
 * Best-effort tag for a wrong answer, from the item and the two strings.
 * Order: Hören → case-only → Plural → a single-word article answer → the
 * sentence analysis above → the item's topic → a near-miss spelling → Wortschatz.
 */
export function tagError(item, userInput, expected) {
  const exp = stripPunct(normalizeAnswer(expected)); const usr = stripPunct(normalizeAnswer(userInput));
  // 'listen_select' is a derived exercise (buildLesson.js `derivedItems`): the
  // learner picks the dialogue line they heard, so a miss is a hearing miss
  // whatever the item's stage says (the player stamps every derived item with
  // `stage: 'derived'`, never `'listening'`).
  if (item?.stage === 'listening' || item?.kind === 'dictation' || item?.type === 'listen_select') return 'Hören';
  // A miss that is only Groß-/Kleinschreibung is spelling, whatever the word is.
  if (exp && usr && exp === usr && stripPunct(String(expected ?? '')) !== stripPunct(String(userInput ?? ''))) return 'Rechtschreibung';
  if (item?.topic && /plural/i.test(item.topic)) return 'Plural';
  if (ARTICLES.has(exp)) return articleTag(usr, exp);
  const isSentence = item?.type === 'sentence_building' || item?.topic === 'yes-no-questions' || exp.includes(' ');
  if (isSentence && exp && usr) {
    const tag = tagSentenceError(item, userInput, expected, usr, exp);
    if (tag) return tag;
  }
  if (item?.type === 'sentence_building' || item?.topic === 'yes-no-questions') return 'Verbstellung';
  if (isNumberAnswer(exp)) return 'Wortschatz';
  if (item?.topic && /verb|sein|haben|present|separable|conjug/i.test(item.topic)) return 'Konjugation';
  if (exp && usr && levenshtein(usr, exp) <= 2) return 'Rechtschreibung';
  return 'Wortschatz';
}
