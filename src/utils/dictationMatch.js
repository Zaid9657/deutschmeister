import { answerMatches } from './answerMatch.js';

/**
 * Forgiving comparison for typed listening "dictation" answers — numbers,
 * times, prices, phone numbers: things a learner writes down while listening.
 *
 * Strategy: if BOTH the typed answer and a candidate carry digits, compare their
 * VALUES (`canonical` below): "14:30", "14.30", "14:30 Uhr" and "um 14:30" are one
 * time, "0176 5432108" and "0176-5432108" one phone number, "3,98 EUR" and "3,98 €"
 * one price. Spelled-out numbers ("vierzehn Uhr dreißig") carry no digits at all —
 * those fall through to the general typed-answer comparator (answerMatches), which
 * is case/whitespace/umlaut-insensitive and checks the full acceptable_answers list
 * as literal text.
 *
 * A VALUE, NOT A DIGIT STRING (2026-10-25 review, C-172/C-173). The comparison used
 * to delete every separator and compare what was left, so "2,50 €" matched the
 * listed 250 and "1.000.000 €" the listed "10.000,00" — prices 10 to 100 times off
 * got a green tick and hid the correction — while "20:00" (→ 2000) failed the
 * listed 20 and "Um 10 Uhr" (→ um10) failed the listed 10. The course checker
 * settled the same question long ago: a decimal comma is a value, not punctuation
 * (src/lib/lesson/check.js normalizeDictation).
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

/**
 * The value a dictation answer writes down, as one comparable string. In order:
 *  - lower case; a closing full stop is no part of it („15." is 15);
 *  - a leading um / ca. / etwa / gegen is the sentence around the number;
 *  - EUR is €, and the unit abbreviations are the units the lists spell out (min → minuten,
 *    Std. → stunden, qm/m2 → m², °/°C → grad, km → kilometer, 50 l → liter, 200 m → meter);
 *  - €/Euro/Uhr BETWEEN two numbers is the decimal mark („2 Euro 50" = 2,50, „5 Uhr 53" = 5:53),
 *    and anywhere else it is dropped;
 *  - a dot or comma before three or more digits groups thousands (10.000 = 10000), every other
 *    . , : between digits is the one mark „|";
 *  - the leading zero of an hour before its mark goes (05:53 = 5:53), and so do the trailing zeros
 *    of a fraction (4,00 = 4, 3,50 = 3,5, 20:00 = 20);
 *  - spaces, dashes and slashes go last, and an h right after the number („24h").
 * Letters that are none of these stay: „B1" is not „A1", „1 Tag" is not „1 Woche".
 */
export function canonical(text) {
  return String(text ?? '').normalize('NFC').trim().toLowerCase()
    .replace(/[.!?]+$/, '')
    .replace(/^(?:um|ca\.?|etwa|gegen)\s+/, '')
    .replace(/(?<!\p{L})eur(?!\p{L})/gu, '€')
    .replace(/(\d)\s*(?:qm|m2)(?![\p{L}\d])/gu, '$1 m²')
    .replace(/(\d)\s*°\s*c?(?!\p{L})/gu, '$1 grad')
    .replace(/(\d)\s*min(?!\p{L})\.?/gu, '$1 minuten')
    .replace(/(\d)\s*std(?!\p{L})\.?/gu, '$1 stunden')
    .replace(/(\d)\s*km(?!\p{L})/gu, '$1 kilometer')
    .replace(/(\d)\s*l(?!\p{L})/gu, '$1 liter')
    .replace(/(\d)\s*m(?![\p{L}\d²])/gu, '$1 meter')
    .replace(/(\d)\s*(?:€|(?<!\p{L})(?:euro|uhr)(?!\p{L}))\s*(?=\d)/gu, '$1,')
    .replace(/€|(?<!\p{L})(?:euro|uhr)(?!\p{L})/gu, '')
    .replace(/(\d)[.,](?=\d{3})/g, '$1')
    .replace(/(\d)[.,:](?=\d)/g, '$1|')
    .replace(/(^|[^\d|])0+(\d)(?=\|)/g, '$1$2')
    .replace(/\|(\d*?)0+(?!\d)/g, (m, d) => (d ? `|${d}` : ''))
    .replace(/[\s\-–/]+/g, '')
    .replace(/(\d)h$/, '$1');
}

const hasDigits = (text) => /\d/.test(String(text ?? ''));

/** A closing full stop, question or exclamation mark is no part of a written answer („Rathaus."). */
const withoutClosingMark = (text) => String(text ?? '').trim().replace(/[.!?]+$/, '');

/** True when a typed dictation answer matches the correct answer or any of
 *  its accepted variants. */
export function dictationMatches(userInput, correctAnswer, acceptableAnswers) {
  const user = String(userInput ?? '').trim();
  if (!user) return false;

  const accepted =
    Array.isArray(acceptableAnswers) && acceptableAnswers.length ? acceptableAnswers : [correctAnswer];

  if (hasDigits(user)) {
    const value = canonical(user);
    if (value && accepted.some((a) => hasDigits(a) && canonical(a) === value)) return true;
    // A time has no magnitude to lose, so on a time row (a ':' or „Uhr" in the key or a variant)
    // the old separator-free comparison stays an extra way in: "1930" is "19:30".
    const timeRow = [correctAnswer, ...accepted].some((a) => /:|(?<!\p{L})uhr(?!\p{L})/iu.test(String(a ?? '')));
    if (timeRow) {
      const digits = normalizeDigits(user);
      if (digits && accepted.some((a) => hasDigits(a) && normalizeDigits(a) === digits)) return true;
    }
  }

  // The closing mark goes on both sides (C-175) — here, not in answerMatches, which the Astro
  // grammar island mirrors.
  return answerMatches(withoutClosingMark(user), accepted.map(withoutClosingMark));
}
