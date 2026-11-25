// How the Wortfeld stage paces a Lektion's words (2026-10 pacing review): balanced groups of at
// most six, each word shown with the dialogue line it was met in. Pure, so it is unit-tested.

/** Words per screen: a beginner meets at most six new words at once (2026-10 pacing review). */
export const GROUP_MAX = 6;

/** Balanced groups of ≤ GROUP_MAX, sizes differing by at most one: 20 → 5·5·5·5, 21 → 6·5·5·5. */
export function groupWords(list) {
  const count = Math.ceil(list.length / GROUP_MAX);
  const base = Math.floor(list.length / Math.max(count, 1));
  const out = [];
  for (let g = 0, at = 0; g < count; g += 1) {
    const size = base + (g < list.length % count ? 1 : 0);
    out.push(list.slice(at, at + size));
    at += size;
  }
  return out;
}

const bareOf = (word) => String(word || '').replace(/^(der|die|das)\s+/i, '').toLowerCase();
const stemOf = (bare) => (bare.length > 5 && /en$/.test(bare) ? bare.slice(0, -2) : bare);

/** Is the word in the scene, as itself or inside another word („Wörterbuch")? Decides where it is taught. */
export function metIn(word, lines = []) {
  const bare = bareOf(word);
  if (bare.length < 3) return false;
  return lines.some((l) => l.toLowerCase().includes(bare) || l.toLowerCase().includes(stemOf(bare)));
}

/** The endings a word may take in a sentence: a verb's, a noun's plural, an adjective's. */
const ENDING = /^(?:e|en|er|es|em|n|s|st|t|est|et|te)?$/;

/**
 * The dialogue line shown as a word's example (article dropped; a verb also by its stem), or null. The
 * line must hold the word itself, alone or with an ending: „Wochenende" is no example of „Woche".
 */
export function lineFor(word, lines = []) {
  const bare = bareOf(word);
  if (bare.length < 3) return null;
  const holds = (line, base) => line.toLowerCase().split(/[^\p{L}\p{N}-]+/u).some((token) => token.startsWith(base) && ENDING.test(token.slice(base.length)));
  if (/\s/.test(bare)) return lines.find((l) => l.toLowerCase().includes(bare)) || null; // a phrase
  return lines.find((l) => holds(l, bare)) || lines.find((l) => holds(l, stemOf(bare))) || null;
}
