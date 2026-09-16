// Guided-course preview policy for DeutschStart A1.1 (the €39 one-time
// course). Pure and framework-free so tests/guided-course-access.test.mjs can
// pin it without React.
//
// Scope: ONLY the guided course surfaces under /course/a1.1/*. The public
// A1.1 library (grammar, reading, listening, vocabulary) stays free via
// FREE_LEVELS and is not consulted here. Other levels return true — their
// gating lives in LevelSubscriptionGuard, not in this policy.
export const A11_PRODUCT_KEY = 'course_a1_1';
export const A11_PREVIEW_LESSONS = 3;

export function canOpenGuidedCourseItem({ level, kind, nr, ownsCourse, hasSubscription }) {
  const normalized = String(level || '').toLowerCase();
  if (normalized !== 'a1.1') return true;
  if (ownsCourse || hasSubscription) return true;
  if (kind === 'home') return true;
  return kind === 'lesson' && Number.isInteger(Number(nr)) && Number(nr) >= 1 && Number(nr) <= A11_PREVIEW_LESSONS;
}
