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

/** The dialogue line a word was met in (article dropped; a verb also by its stem), or null. */
export function lineFor(word, lines = []) {
  const bare = String(word || '').replace(/^(der|die|das)\s+/i, '').toLowerCase();
  if (bare.length < 3) return null;
  const stem = bare.length > 5 && /en$/.test(bare) ? bare.slice(0, -2) : bare;
  return lines.find((l) => l.toLowerCase().includes(bare)) || lines.find((l) => l.toLowerCase().includes(stem)) || null;
}
