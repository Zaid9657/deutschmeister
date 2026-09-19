// Pure milestone-day logic for the course home (Wave 2, 2026-09-19). Plain
// .js (not .jsx) on purpose: tests/milestones.test.mjs imports this directly
// under plain node --test, which has no JSX loader — MilestoneCard.jsx itself
// cannot be imported there (see CurriculumHomePage.jsx's already-established
// pattern of a .catch(() => ({})) fallback for the same reason).

/** The three streak milestones the course home can show. Order matters for the matrix test. */
export const MILESTONES = [1, 7, 30];

/**
 * Which milestone (if any) should show for this streak, given the set of
 * milestones already seen this browser. `seenSet` holds the numbers
 * (1 | 7 | 30) already shown — never day counts — so a caller can pass either
 * a freshly-read Set or a plain array/iterable, in a test or in the browser.
 *
 * Exactly one milestone can be due at a time (the streak equals one of the
 * three numbers, or it does not), so this returns a single value, not a list.
 * Pure: no storage access, no side effects.
 */
export function milestoneFor(streak, seenSet) {
  const seen = seenSet instanceof Set ? seenSet : new Set(seenSet || []);
  if (!MILESTONES.includes(streak)) return null;
  if (seen.has(streak)) return null;
  return streak;
}
