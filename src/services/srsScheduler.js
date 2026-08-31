// SM-2-lite spaced-repetition scheduler — pure functions, unit-tested in
// tests/progress.test.mjs. No React, no Supabase.
//
// Grades (the four review buttons):
//   0 = Nochmal   (forgot — lapse, back to the start)
//   1 = Schwer    (barely — shortest step, ease drops)
//   2 = Gut       (recalled — normal step)
//   3 = Leicht    (instant — longer step, ease grows)
//
// Intervals are whole days; a brand-new card graded "Gut" comes back
// tomorrow, then ~3 days, then interval × ease. Ease is clamped to
// [1.3, 3.0] like classic SM-2.

export const GRADES = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 };

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

const clampEase = (e) => Math.min(MAX_EASE, Math.max(MIN_EASE, e));

/**
 * @param {{ease:number, interval_days:number, reps:number, lapses:number}} card
 * @param {0|1|2|3} grade
 * @param {Date} [now]
 * @returns next card fields {ease, interval_days, due_at, reps, lapses}
 */
export function review(card, grade, now = new Date()) {
  const ease = Number(card.ease) || 2.5;
  const interval = Number(card.interval_days) || 0;
  const reps = Number(card.reps) || 0;
  const lapses = Number(card.lapses) || 0;

  let next;
  if (grade === GRADES.AGAIN) {
    next = {
      ease: clampEase(ease - 0.2),
      interval_days: 0, // due again this session/day
      reps: reps + 1,
      lapses: lapses + 1,
    };
  } else if (grade === GRADES.HARD) {
    next = {
      ease: clampEase(ease - 0.15),
      interval_days: Math.max(1, Math.round(interval * 1.2)) || 1,
      reps: reps + 1,
      lapses,
    };
  } else if (grade === GRADES.EASY) {
    next = {
      ease: clampEase(ease + 0.15),
      interval_days: interval < 1 ? 4 : Math.round(interval * ease * 1.3),
      reps: reps + 1,
      lapses,
    };
  } else {
    // GOOD
    next = {
      ease,
      interval_days: interval < 1 ? 1 : interval < 3 ? 3 : Math.round(interval * ease),
      reps: reps + 1,
      lapses,
    };
  }

  const due = new Date(now);
  if (next.interval_days === 0) {
    due.setMinutes(due.getMinutes() + 10); // "again" resurfaces within the session
  } else {
    due.setDate(due.getDate() + next.interval_days);
  }
  return { ...next, due_at: due.toISOString() };
}
