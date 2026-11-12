import { cleanToken } from './gloss.js';

/** Unlike a dictionary headword, a phrase may include its question mark. */
export function readLexicon(words) {
  return words.map((entry) => ({ entry, tokens: (entry.word || entry.de).split(/\s+/).map(cleanToken) }))
    .sort((a, b) => b.tokens.length - a.tokens.length);
}
