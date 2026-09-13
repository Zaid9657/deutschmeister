// Answer checking for the lesson engine (docs/course-standard-2026-09-12.md §3).
// Rules: normalise like the rest of the site (src/utils/answerMatch.js), allow
// ONE typo-class slip (Levenshtein ≤ 1 on a word of ≥ 5 letters, diacritics,
// capitalisation) and count it as correct-with-warning — but an article or an
// ending is never a typo: if the expected answer is a short function word
// (≤ 4 letters: der/die/das/ein/eine/dem/den…) or the user's slip changes the
// final letter of a word (an ending), it is wrong.
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

const stripPunct = (s) =>
  s.replace(/[“”„‟«»‹›]/g, '"').replace(/[‘’‚‛ʼ´`]/g, "'")
    .replace(/[.,!?;:"']/g, '').replace(/\s+/g, ' ').trim();

/**
 * Dictation normalisation (REVIEW #2 fix 5). Lektion 6 dictates a phone number,
 * and "0176 234567" is the same answer as "0176-2345 67": the grouping is a
 * choice of the writer, not of the speaker, and a dash is unhearable. So for a
 * dictation — and only there — every dash form becomes a space, the separators
 * inside a run of digits are removed, and the run is compared as one number.
 * Typographic quotes are folded by stripPunct above, for every check.
 */
export function normalizeDictation(text) {
  return String(text ?? '')
    .replace(/[\u2010-\u2015\u2212\uFF0D-]/g, ' ')
    .replace(/(\d)[\s./]+(?=\d)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

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
 * True when capitalisation IS the task: the item says so (`caseSensitive: true`),
 * or it is a possessive-article item whose answer is the polite `Ihr/Ihre/Ihren`
 * — the form the L12 notice teaches as "immer groß". Pass the result as
 * `checkAnswer(..., { caseSensitive: isCaseTask(item) })`.
 */
export const POLITE_POSSESSIVE_RE = /^Ihr(e|en)?$/;

export function isCaseTask(item) {
  if (!item) return false;
  if (item.caseSensitive === true) return true;
  if (!/possessive-articles/i.test(String(item.topic || ''))) return false;
  const answers = [item.answer, ...(Array.isArray(item.accepted) ? item.accepted : [])];
  return answers.some((a) => POLITE_POSSESSIVE_RE.test(String(a ?? '').trim()));
}

// Error tags (standard §3): what a miss is about, for remediation and review.
export const ERROR_TAGS = ['Artikel', 'Kasus', 'Verbstellung', 'Konjugation', 'Plural', 'Rechtschreibung', 'Hören', 'Wortschatz'];

const ARTICLES = new Set(['der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer', 'dem', 'den', 'des', 'kein', 'keine', 'keinen', 'mein', 'meine', 'dein', 'deine', 'sein', 'seine', 'ihr', 'ihre', 'unser', 'unsere', 'euer', 'eure']);

/** Best-effort tag for a wrong answer, from the item and the two strings. */
export function tagError(item, userInput, expected) {
  const exp = stripPunct(normalizeAnswer(expected)); const usr = stripPunct(normalizeAnswer(userInput));
  if (item?.stage === 'listening' || item?.kind === 'dictation') return 'Hören';
  // A miss that is only Groß-/Kleinschreibung is spelling, whatever the word is.
  if (exp && usr && exp === usr && stripPunct(String(expected ?? '')) !== stripPunct(String(userInput ?? ''))) return 'Rechtschreibung';
  if (item?.topic && /plural/i.test(item.topic)) return 'Plural';
  if (ARTICLES.has(exp)) return /^(ein|kein|mein|dein|sein|ihr|unser|euer)/.test(exp) && ARTICLES.has(usr) ? 'Kasus' : 'Artikel';
  if (item?.type === 'sentence_building' || item?.topic === 'yes-no-questions') return 'Verbstellung';
  if (item?.topic && /verb|sein|haben|present|separable|conjug/i.test(item.topic)) return 'Konjugation';
  if (exp && usr && levenshtein(usr, exp) <= 2) return 'Rechtschreibung';
  return 'Wortschatz';
}
