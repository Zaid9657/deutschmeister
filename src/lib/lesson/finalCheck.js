// A Lektion's final check (2026-11-18): one or more turns per can-do, answered aloud or typed.
// A can-do counts as shown only when every one of its turns was shown. Nothing here locks the next
// Lektion — the founder chose a recommendation over a locked path; the check only decides which
// can-dos the end screen ticks.
import { RESULT, checkAnswer } from './check.js';
import { READALOUD_PASS_PCT } from './readaloud.js';

// German letter names, so a spelled name is never sound-only (speech.js: every sound has text too).
const LETTER = { A: 'A', B: 'Be', C: 'Ce', D: 'De', E: 'E', F: 'Ef', G: 'Ge', H: 'Ha', I: 'I', J: 'Jot', K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'O', P: 'Pe', Q: 'Ku', R: 'Er', S: 'Es', T: 'Te', U: 'U', V: 'Vau', W: 'We', X: 'Ix', Y: 'Ypsilon', Z: 'Zett', Ä: 'Ä', Ö: 'Ö', Ü: 'Ü', ß: 'Eszett' };
const lettersOf = (word) => Array.from(word.normalize('NFC')).map((c) => (c === 'ß' ? c : c.toLocaleUpperCase('de')));

/** One sitting's turns. A retake spells the next name on the list, so the spelling turn is new. */
export function checkTurns(check, retake = 0) {
  return (check?.turns || []).map((turn) => {
    if (!turn.spell) return turn;
    const name = turn.spell[retake % turn.spell.length];
    const letters = lettersOf(name);
    return { ...turn, accepted: [name], spoken: `${letters.join('-')}.`, letterNames: letters.map((c) => LETTER[c] || c).join(' – ') };
  });
}

const fold = (s) => String(s || '').normalize('NFC').trim().toLocaleLowerCase('de').replace(/ß/g, 'ss');

/** RESULT.CORRECT, TYPO or WRONG for one typed answer. An own-name turn needs an opening and a name. */
export function typedResult(turn, value) {
  if (turn.ownName) {
    const ok = turn.accepted.some((o) => new RegExp(`^${fold(o)}\\s+\\p{L}`, 'u').test(fold(value)));
    return ok ? RESULT.CORRECT : RESULT.WRONG;
  }
  return checkAnswer(value, turn.accepted, { spelling: Boolean(turn.spell) }).result;
}

/** A spoken try counts when it was measured (never "I said it") and recognised well enough. */
export const spokenShown = (result) => Boolean(result) && !result.selfConfirmed && typeof result.pct === 'number' && result.pct >= READALOUD_PASS_PCT;

/** What a spoken try is scored against: the answer itself; for a name, only its opening (speech recognition rarely gets names right). */
export const spokenTarget = (turn) => turn.accepted[0];

/** The answer to show after a miss. */
export const modelAnswer = (turn) => (turn.ownName ? `${turn.accepted[0]} …` : turn.accepted[0]);

/** Per can-do (by index): true when every turn of it was shown. */
export function canDoShown(turns, outcomes, count) {
  return Array.from({ length: count }, (_, i) => turns.every((turn, j) => turn.canDo !== i || outcomes[j] === 'shown'));
}
