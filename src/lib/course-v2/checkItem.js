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
//     („0341 90 12 33" = „0341901233", „8.30" = „8:30", „0341/225890" =
//     „(0341) 225890"); a slip in the words around them may still be a TYPO, a
//     wrong digit never is. An accepted form written in words („halb zehn") is
//     matched like a name (below); a number written as a word where digits are
//     accepted („zweihundert" for 200, review b2.2-u04 r1 F16) counts as its
//     digits, and a digit answer to a purely worded key („200" for
//     „zweihundert") counts too.
//   - `exact: 'number'` on a DICTATION (review a2.2-u04 r3 F04) compares the
//     WHOLE sentence: the words keep the dictation typo rule, the digits must
//     match exactly, and a number word counts as its digits („zehn" = „10").
//     The digits-only reading above never applies to a dictation — „10" alone
//     is not a transcription of „Wir sind zehn Minuten von der Brücke.".
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
import {
  RESULT, checkAnswer, checkOptionsFor, tagError, normalizeSpelling, normalizeDictation, foldNumberWords, isDictationTask,
} from '../lesson/check.js';

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
/** A form that is nothing but a number once its number words are read as digits („zweihundert"). */
const pureNumber = (s) => {
  const f = foldNumberWords(s);
  return /\d/.test(f) && !/\p{L}/u.test(f) ? digitsOf(f) : '';
};
const RANK = { [RESULT.CORRECT]: 2, [RESULT.TYPO]: 1, [RESULT.WRONG]: 0 };

function checkNumber(item, input) {
  const accepted = acceptedOf(item);
  const rawDigits = digitsOf(input);
  let worded = null;
  if (!rawDigits) {
    // A time or number written in words („halb zehn") is judged like a name:
    // exactly, with only the checker's case rule as a retry.
    const wordedForms = accepted.filter((a) => !digitsOf(a));
    worded = wordedForms.length ? checkName({ ...item, accepted: wordedForms }, input) : null;
    if (worded && worded.result !== RESULT.WRONG) return worded;
  }
  // „zweihundert" typed where „200" is accepted: the number word counts as its digits
  const userInput = rawDigits ? input : foldNumberWords(input);
  const userDigits = digitsOf(userInput);
  if (!userDigits) return worded || { result: RESULT.WRONG, expected: accepted[0] || '' };
  let typo = null;
  for (const a of accepted) {
    // a purely worded key („zweihundert") is answered by its digits too; „halb zehn" is not
    // a pure number and keeps its name-like comparison above
    if ((digitsOf(a) || pureNumber(a)) !== userDigits) continue;
    const userWords = wordsOf(userInput);
    const want = digitsOf(a) ? wordsOf(a) : '';
    // „0341 90 12 33" for „0341 90 12 33": digits are the task; the words around
    // them may be left out, never wrong.
    if (!userWords || userWords.toLowerCase() === want.toLowerCase()) return { result: RESULT.CORRECT, expected: a };
    const words = checkAnswer(userWords, want, { caseSensitive: item.caseSensitive === true });
    if (words.result === RESULT.CORRECT) return { result: RESULT.CORRECT, expected: a };
    if (words.result === RESULT.TYPO && !typo) typo = { result: RESULT.TYPO, expected: a };
  }
  return typo || worded || { result: RESULT.WRONG, expected: accepted[0] || '' };
}

/** A run of digits with its separators („8.30", „0341/22 58 90" after the dictation fold). */
const DIGIT_RUN_RE = /\d+(?:[.,:/]\d+)*/g;

/** The dictation fold with every number word read as digits: „zehn Minuten" → „10 Minuten". */
const foldDictationNumbers = (s) => normalizeDictation(foldNumberWords(normalizeDictation(s)));

/**
 * `exact: 'number'` on a dictation: the whole sentence, the digits exact (a2.2-u04 r3 F04).
 * Each accepted form: the digit runs of both sides must be the same numbers in the same order,
 * else the form does not match; the sentence with every run masked is then graded by the
 * dictation check (one typo-class slip in a word stays a TYPO). There is no words-may-be-left-out
 * shortcut: „10" alone answers nothing.
 */
function checkDictationNumber(item, input) {
  const accepted = acceptedOf(item);
  const user = foldDictationNumbers(input);
  const runs = (s) => (s.match(DIGIT_RUN_RE) || []).map(digitsOf).join('|');
  const mask = (s) => s.replace(DIGIT_RUN_RE, ' # ');
  let best = { result: RESULT.WRONG, expected: accepted[0] || '' };
  if (!squash(input)) return best;
  for (const a of accepted) {
    const want = foldDictationNumbers(a);
    if (runs(want) !== runs(user)) continue;
    const out = checkAnswer(mask(user), [mask(want)], { dictation: true, caseSensitive: item.caseSensitive === true });
    if (RANK[out.result] > RANK[best.result]) best = { result: out.result, expected: a, ...(out.reason ? { reason: out.reason } : {}) };
    if (best.result === RESULT.CORRECT) break;
  }
  return best;
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
  else if (item.exact === 'number') out = isDictationTask(item) ? checkDictationNumber(item, input) : checkNumber(item, input);
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
