// Course v2 — the answer check for one Item (docs/course-v2/SCHEMA.md §3.1).
//
// A thin wrapper, never a second checker: every typed answer goes through
// checkAnswer/checkOptionsFor/tagError of src/lib/lesson/check.js, exactly as
// the live course grades it (CLAUDE.md: "the lesson checker decides every
// answer in the course"). What this file adds is only what a v2 Item carries
// and check.js does not know yet:
//
//   - `exact: 'number'` (ITM-07: digits, times, dates, prices, phone numbers) —
//     the DIGITS must match exactly; separators between digits are free
//     („0341 90 12 33" = „0341901233", „8.30" = „8:30"); a slip in the words
//     around them may still be a TYPO, a wrong digit never is. An accepted form
//     written in words („halb zehn") is matched like a name (below).
//   - `exact: 'name'` (spelled names) — no one-letter tolerance: a letter slip
//     is WRONG; a case-only miss stays the checker's own TYPO rule, and a spelled
//     answer (H-A-L-L-O) folds its separators as check.js already does.
//   - choice items (multiple_choice, richtig_falsch, ja_nein, abc, zuordnen,
//     listen_select, insert, word-bank cloze, match) answer with a key or an
//     option string: an exact key comparison, never a typo.
//
// The error tag of a miss prefers the item's own SCHEMA tag (`errorTags[0]`,
// then `errorTag`), which feeds the repair cards (BLUEPRINT §6.2); only an
// item without one falls back to check.js's descriptive tagError.
import { RESULT, checkAnswer, checkOptionsFor, tagError, normalizeSpelling } from '../lesson/check.js';

export { RESULT };

/** Item types whose answer is a key or one of the offered strings. */
export const CHOICE_TYPES = Object.freeze([
  'multiple_choice', 'richtig_falsch', 'ja_nein', 'abc', 'zuordnen', 'listen_select', 'insert', 'match',
]);

const acceptedOf = (item) => {
  const list = Array.isArray(item && item.accepted) && item.accepted.length ? item.accepted : [item && item.answer];
  return list.filter((a) => typeof a === 'string' && a.length > 0);
};

/** A cloze answers from options/choices when it has them, else it is typed. */
export function isChoiceItem(item) {
  if (!item) return false;
  if (CHOICE_TYPES.includes(item.type)) return true;
  return item.type === 'cloze' && Array.isArray(item.options) && item.options.length > 0;
}

const squash = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');

function checkChoice(item, input) {
  const accepted = acceptedOf(item);
  const user = squash(input);
  if (!user) return { result: RESULT.WRONG, expected: accepted[0] || '' };
  for (const a of accepted) if (squash(a) === user) return { result: RESULT.CORRECT, expected: a };
  for (const a of accepted) if (squash(a).toLowerCase() === user.toLowerCase()) return { result: RESULT.CORRECT, expected: a };
  return { result: RESULT.WRONG, expected: accepted[0] || '' };
}

const digitsOf = (s) => String(s ?? '').replace(/\D+/g, '');
const wordsOf = (s) => squash(String(s ?? '').replace(/[\d]+(?:[\s.,:/-]+\d+)*/g, ' ').replace(/[.,:;!?]/g, ' '));

function checkNumber(item, input) {
  const accepted = acceptedOf(item);
  const userDigits = digitsOf(input);
  if (!userDigits) {
    // A time or number written in words („halb zehn") is judged like a name:
    // exactly, with only the checker's case rule as a retry.
    const worded = accepted.filter((a) => !digitsOf(a));
    return worded.length ? checkName({ ...item, accepted: worded }, input) : { result: RESULT.WRONG, expected: accepted[0] || '' };
  }
  let typo = null;
  for (const a of accepted) {
    if (digitsOf(a) !== userDigits) continue;
    const userWords = wordsOf(input);
    const want = wordsOf(a);
    // „0341 90 12 33" for „0341 90 12 33": digits are the task; the words around
    // them may be left out, never wrong.
    if (!userWords || userWords.toLowerCase() === want.toLowerCase()) return { result: RESULT.CORRECT, expected: a };
    const words = checkAnswer(userWords, want, { caseSensitive: item.caseSensitive === true });
    if (words.result === RESULT.CORRECT) return { result: RESULT.CORRECT, expected: a };
    if (words.result === RESULT.TYPO && !typo) typo = { result: RESULT.TYPO, expected: a };
  }
  return typo || { result: RESULT.WRONG, expected: accepted[0] || '' };
}

function checkName(item, input) {
  const accepted = acceptedOf(item);
  const opts = checkOptionsFor({ ...item, accepted });
  const out = checkAnswer(input, accepted, opts);
  // A letter slip is a different name. Only the checker's case rule may still retry.
  if (out.result === RESULT.TYPO && out.reason !== 'case') return { result: RESULT.WRONG, expected: out.expected };
  if (out.result === RESULT.WRONG && opts.spelling) {
    const user = normalizeSpelling(input).toLowerCase();
    const hit = accepted.find((a) => normalizeSpelling(a).toLowerCase() === user);
    if (hit) return { result: RESULT.CORRECT, expected: hit };
  }
  return out;
}

/** The SCHEMA error tag of a miss, else check.js's descriptive tag. */
export function errorTagFor(item, input, expected) {
  if (item && Array.isArray(item.errorTags) && item.errorTags.length) return item.errorTags[0];
  if (item && item.errorTag) return item.errorTag;
  return tagError(item, input, expected);
}

/**
 * checkItem(item, input) → { result, correct, typo, expected, errorTag }
 * `result` is RESULT.CORRECT | TYPO | WRONG (a TYPO earns one retry, standard §3);
 * `errorTag` is null unless the answer is wrong.
 */
export function checkItem(item, input) {
  if (!item) return { result: RESULT.WRONG, correct: false, typo: false, expected: '', errorTag: null };
  let out;
  if (isChoiceItem(item)) out = checkChoice(item, input);
  else if (item.exact === 'number') out = checkNumber(item, input);
  else if (item.exact === 'name') out = checkName(item, input);
  else {
    const accepted = acceptedOf(item);
    out = checkAnswer(input, accepted, checkOptionsFor({ ...item, accepted }));
  }
  const correct = out.result === RESULT.CORRECT;
  const typo = out.result === RESULT.TYPO;
  return {
    result: out.result,
    correct,
    typo,
    expected: out.expected || '',
    errorTag: out.result === RESULT.WRONG ? errorTagFor(item, input, out.expected) : null,
  };
}

/**
 * The onAttempt / onResult payload of the shared contract:
 * { itemId, stepId, correct, answer, errorTag, typo }.
 */
export function attemptPayload(item, stepId, answer, checked = checkItem(item, answer)) {
  return {
    itemId: item && item.id ? String(item.id) : '',
    stepId: stepId || null,
    correct: !!checked.correct,
    answer: String(answer ?? ''),
    errorTag: checked.correct ? null : checked.errorTag || null,
    typo: !!checked.typo,
  };
}

export default checkItem;
