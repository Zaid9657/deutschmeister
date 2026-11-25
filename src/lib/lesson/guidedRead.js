import { cleanToken } from './gloss.js';

/** Unlike a dictionary headword, a phrase may include its question mark. */
export function readLexicon(words) {
  return words.map((entry) => ({ entry, tokens: (entry.word || entry.de).split(/\s+/).map(cleanToken) }))
    .sort((a, b) => b.tokens.length - a.tokens.length);
}

/** A closed series as it is read out: „null, eins, zwei …“. */
export const seriesText = (series) => `${(series?.items || []).map((x) => x.de).join(', ')}.`;

/** The names of the letters, as one spells with them. */
export const LETTER = { A: 'A', B: 'Be', C: 'Ce', D: 'De', E: 'E', F: 'Ef', G: 'Ge', H: 'Ha', I: 'I', J: 'Jot', K: 'Ka', L: 'El', M: 'Em', N: 'En', O: 'O', P: 'Pe', Q: 'Ku', R: 'Er', S: 'Es', T: 'Te', U: 'U', V: 'Vau', W: 'We', X: 'Ix', Y: 'Ypsilon', Z: 'Zett', Ä: 'Ä', Ö: 'Ö', Ü: 'Ü', ß: 'Eszett' };
