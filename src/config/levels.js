// The CEFR sub-level ladder, in order. Was duplicated verbatim in
// SpeakingPage, useListening and (implicitly, as ".2" string surgery) in the
// level test — which is how the level test ended up unable to demote a ".1"
// sub-level at all.
//
// Uppercase, matching the DB convention (`sub_level = 'A1.1'`) and
// `normalizePlacementLevel`. URLs use the lowercase form.
export const LEVEL_ORDER = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2'];

/**
 * One step down the ladder, floored at A1.1.
 * `stepDownSublevel('B2.1')` → `'B1.2'` — crossing the band boundary, which the
 * old `replace('.2', '.1')` could not do.
 * @param {string} sublevel e.g. 'B2.1'
 * @param {number} steps how many sub-levels to descend (default 1)
 */
export function stepDownSublevel(sublevel, steps = 1) {
  const i = LEVEL_ORDER.indexOf(sublevel);
  if (i < 0) return sublevel;
  return LEVEL_ORDER[Math.max(0, i - steps)];
}

/** The coarse band ('A1', 'B2') for a sub-level, since the two are shown together. */
export function bandOf(sublevel) {
  return typeof sublevel === 'string' ? sublevel.split('.')[0] : sublevel;
}

/**
 * Coerce whatever is sitting in `profiles.current_level` into a real sub-level.
 * The column has held 'a1' (the old default), 'B1' (a band with no sub-level)
 * and properly-cased sub-levels at various points, so every reader has to be
 * tolerant. A band without a sub-level resolves to its first half.
 * @param {unknown} raw
 * @returns {string} a member of LEVEL_ORDER, defaulting to 'A1.1'
 */
export function normalizePlacementLevel(raw) {
  if (!raw) return 'A1.1';
  const up = String(raw).toUpperCase().replace(/\s+/g, '');
  if (LEVEL_ORDER.includes(up)) return up;
  const coarse = (up.match(/^(A1|A2|B1|B2)/) || [])[1];
  return coarse ? `${coarse}.1` : 'A1.1';
}

/**
 * Position of a sub-level on the ladder, tolerant of case and of the lowercase
 * URL form. Returns 0 for anything unrecognised so callers can use it directly
 * as a start index without a guard.
 */
export function sublevelIndex(sublevel) {
  const i = LEVEL_ORDER.indexOf(normalizePlacementLevel(sublevel));
  return i < 0 ? 0 : i;
}
