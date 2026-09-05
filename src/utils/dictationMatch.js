import { answerMatches } from './answerMatch.js';

/**
 * Forgiving comparison for typed listening "dictation" answers — numbers,
 * times, prices, phone numbers: things a learner writes down while listening.
 *
 * Strategy: if BOTH the typed answer and a candidate carry digits, strip
 * everything that is not a digit (spaces, dots, colons/dashes/slashes, "Uhr",
 * "Euro"/"€", a trailing "h") and compare the remaining digit strings — so
 * "14:30", "14.30", "14:30 Uhr" and "0176 5432108"/"01765432108" all collapse
 * to the same value regardless of separator or currency wording. That covers
 * every acceptable_answers variant the review pass wrote EXCEPT spelled-out
 * numbers ("vierzehn Uhr dreißig"), which carry no digits at all — those fall
 * through to the general typed-answer comparator (answerMatches), which is
 * case/whitespace/umlaut-insensitive and checks the full acceptable_answers
 * list as literal text.
 */
function normalizeDigits(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/€/g, '')
    .replace(/\beuro\b/g, '')
    .replace(/\buhr\b/g, '')
    .replace(/[.,:\-/\s]/g, '')
    .replace(/h$/, '');
}

const hasDigits = (text) => /\d/.test(String(text ?? ''));

/** True when a typed dictation answer matches the correct answer or any of
 *  its accepted variants. */
export function dictationMatches(userInput, correctAnswer, acceptableAnswers) {
  const user = String(userInput ?? '').trim();
  if (!user) return false;

  const accepted =
    Array.isArray(acceptableAnswers) && acceptableAnswers.length ? acceptableAnswers : [correctAnswer];

  if (hasDigits(user)) {
    const userDigits = normalizeDigits(user);
    if (userDigits && accepted.some((a) => hasDigits(a) && normalizeDigits(a) === userDigits)) {
      return true;
    }
  }

  return answerMatches(user, accepted);
}
