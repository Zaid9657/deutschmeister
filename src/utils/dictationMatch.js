import { answerMatches } from './answerMatch.js';

/**
 * Forgiving comparison for typed listening "dictation" answers — numbers,
 * times, prices, phone numbers: things a learner writes down while listening.
 *
 * Strategy: if BOTH the typed answer and a candidate carry digits, compare what
 * they MEAN, read the way the row's own answer is read: a clock on a time row
 * (`clock`: "14:30", "14.30", "14 Uhr 30" and "um 14:30" are one time), a digit
 * sequence on a telephone or other number row read digit by digit
 * (`digitSequence`: "0176 543 21 08" and "0176 543.21.08" are one number), and a
 * value everywhere else (`canonical`: "3,98 EUR" and "3,98 €" are one price).
 * Spelled-out numbers ("vierzehn Uhr dreißig") carry no digits at all — those fall
 * through to the general typed-answer comparator (answerMatches), which is
 * case/whitespace/umlaut-insensitive and checks the full acceptable_answers list
 * as literal text.
 *
 * A VALUE, NOT A DIGIT STRING (2026-10-25 review, C-172/C-173). The comparison used
 * to delete every separator and compare what was left, so "2,50 €" matched the
 * listed 250 and "1.000.000 €" the listed "10.000,00" — prices 10 to 100 times off
 * got a green tick and hid the correction — while "20:00" (→ 2000) failed the
 * listed 20 and "Um 10 Uhr" (→ um10) failed the listed 10. The course checker
 * settled the same question long ago: a decimal comma is a value, not punctuation
 * (src/lib/lesson/check.js normalizeDictation). A clock and a phone number are not
 * values, though (batch B4 review): read as a value, „19 Uhr 3" (19:03) became the
 * 19:30 of the Elternabend row, and the two-digit groups of „0176 543.21.08"
 * became decimal places — hence the three readings.
 */

/**
 * The value a dictation answer writes down, as one comparable string. In order:
 *  - lower case; a closing full stop is no part of it („15." is 15);
 *  - a leading um / ca. / etwa / gegen is the sentence around the number;
 *  - EUR is €, and the unit abbreviations are the units the lists spell out (min → minuten,
 *    Std. → stunden, qm/m2 → m², °/°C → grad, km → kilometer, 50 l → liter, 200 m → meter);
 *  - €/Euro BETWEEN two numbers is the decimal mark („2 Euro 50" = 2,50), and anywhere else it
 *    is dropped, as a stray „Uhr" is (a time row is read by `clock`, never here);
 *  - a dot or comma before three or more digits groups thousands (10.000 = 10000), every other
 *    . , : between digits is the one mark „|";
 *  - a leading zero before the mark goes (05,49 = 5,49), and so do the trailing zeros of a
 *    fraction (4,00 = 4, 3,50 = 3,5);
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
    .replace(/(\d)\s*(?:€|(?<!\p{L})euro(?!\p{L}))\s*(?=\d)/gu, '$1,')
    .replace(/€|(?<!\p{L})(?:euro|uhr)(?!\p{L})/gu, '')
    .replace(/(\d)[.,](?=\d{3})/g, '$1')
    .replace(/(\d)[.,:](?=\d)/g, '$1|')
    .replace(/(^|[^\d|])0+(\d)(?=\|)/g, '$1$2')
    .replace(/\|(\d*?)0+(?!\d)/g, (m, d) => (d ? `|${d}` : ''))
    .replace(/[\s\-–/]+/g, '')
    .replace(/(\d)h$/, '$1');
}

/**
 * A clock time as „H:MM", or null when the text is none. The minutes are digits of their own, never
 * a fraction: 19:30 = 19.30 = 19 Uhr 30 = 1930 = um 19:30 Uhr, while „19 Uhr 3" is 19:03 — and a bare
 * hour is the full hour (20 = 20 Uhr = 20:00). Hours above 24 and minutes above 59 are no time.
 */
export function clock(text) {
  const s = String(text ?? '').normalize('NFC').trim().toLowerCase()
    .replace(/[.!?]+$/, '')
    .replace(/^(?:um|ca\.?|etwa|gegen)\s+/, '')
    .replace(/\s*(?:uhr|h)$/, '')
    .trim();
  const m = s.match(/^(\d{1,2})(?:(?:\s*[:.,]\s*|\s+)(\d{2})|\s*uhr\s*(\d{1,2}))?$/) || s.match(/^(\d{1,2})(\d{2})$/);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2] ?? m[3] ?? 0);
  return hour <= 24 && minute <= 59 ? `${hour}:${String(minute).padStart(2, '0')}` : null;
}

/** A number read digit by digit — a telephone number, an order number: its digits with the grouping
 *  (spaces, dots, dashes, slashes) taken out, so „0176 543.21.08" is „0176 5432108". */
export const digitSequence = (text) => String(text ?? '').normalize('NFC').trim().toLowerCase()
  .replace(/[.!?]+$/, '').replace(/[\s.\-–/]+/g, '');

/** A row whose answer is such a number: a leading 0 (a telephone number) or five digits and more —
 *  longer than any quantity the exercises dictate (the 10.000 of an inheritance carries its dot). */
const isDigitSequenceRow = (correctAnswer) => /^(?:0\d{3,}|\d{5,})$/.test(String(correctAnswer ?? '').trim().replace(/[\s\-–/]+/g, ''));

/** A time row: a ':' or „Uhr" in the key or a variant. */
const isTimeRow = (answers) => answers.some((a) => /:|(?<!\p{L})uhr(?!\p{L})/iu.test(String(a ?? '')));

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
    // The row decides how its numbers are read — see the header.
    const read = isTimeRow([correctAnswer, ...accepted]) ? clock
      : isDigitSequenceRow(correctAnswer) ? digitSequence
        : canonical;
    const mine = read(user);
    if (mine && accepted.some((a) => hasDigits(a) && read(a) === mine)) return true;
  }

  // The closing mark goes on both sides (C-175) — here, not in answerMatches, which the Astro
  // grammar island mirrors.
  return answerMatches(withoutClosingMark(user), accepted.map(withoutClosingMark));
}
