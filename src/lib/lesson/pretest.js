import { normalizeAnswer } from '../../utils/answerMatch.js';

/**
 * Did the learner introduce themselves? One of the name openings („Ich heiße", „Ich bin",
 * „Mein Name ist") followed by at least one more word — their name. A greeting alone, or the
 * opening alone, is not yet an introduction. Spelling is folded like every other answer.
 */
export function introductionHit(value, openings = []) {
  const said = ` ${normalizeAnswer(value)} `;
  return openings.some((opening) => {
    const at = said.indexOf(` ${normalizeAnswer(opening)} `);
    return at >= 0 && said.slice(at + normalizeAnswer(opening).length + 2).trim().length > 0;
  });
}
