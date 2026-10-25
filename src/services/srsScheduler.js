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
// [1.3, 3.0] like classic SM-2. "Leicht" always lands at least one day after
// what "Gut" would give (it used to give 2 days against Gut's 3 on a 1-day
// card with a lowered ease).
//
// A due date of one day or more is a calendar day: the card is due from
// DAY_START_HOUR (local time) on that day, not at the clock time of the
// review. A word graded "Gut" at 21:00 is due the next morning, so the
// trainer's "komm morgen wieder" holds for an evening session too.
//
// The session helpers at the end decide WHICH due cards one trainer session
// shows (srsService.js fetches, SrsTrainer.jsx plays them).

export const GRADES = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 };

/** Local hour from which a card due on a later day counts as due (Anki's 04:00 day boundary). */
export const DAY_START_HOUR = 4;

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
  const goodInterval = interval < 1 ? 1 : interval < 3 ? 3 : Math.round(interval * ease);

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
      interval_days: Math.max(goodInterval + 1, interval < 1 ? 4 : Math.round(interval * ease * 1.3)),
      reps: reps + 1,
      lapses,
    };
  } else {
    // GOOD
    next = {
      ease,
      interval_days: goodInterval,
      reps: reps + 1,
      lapses,
    };
  }

  const due = new Date(now);
  if (next.interval_days === 0) {
    due.setMinutes(due.getMinutes() + 10); // "again" resurfaces within the session
  } else {
    due.setDate(due.getDate() + next.interval_days);
    due.setHours(DAY_START_HOUR, 0, 0, 0);
  }
  return { ...next, due_at: due.toISOString() };
}

// ── One trainer session ──────────────────────────────────────────────────

/** Cards one trainer session loads at most. */
export const SESSION_SIZE = 20;

/** New (never graded, reps = 0) cards one session may introduce, after every due review. */
export const NEW_CARDS_PER_SESSION = 10;

/**
 * The cards one session shows: the due reviews first (pass them oldest-due first), then new cards
 * up to the allowance, never more than `limit` in all. A new card's due_at is only the moment it
 * was added, so ordering the whole deck by due_at put every unseen word ahead of every review: a
 * learner who added a level's 339 words met 20 new words a day and no repeat for 16 days.
 */
export function sessionQueue(reviews, newCards, { limit = SESSION_SIZE, newLimit = NEW_CARDS_PER_SESSION } = {}) {
  const due = (reviews || []).slice(0, limit);
  const room = Math.max(0, Math.min(newLimit, limit - due.length));
  return [...due, ...(newCards || []).slice(0, room)];
}

/**
 * "fällig" in the trainer header and the nav badge: the due reviews plus the new cards the next
 * session would introduce — never the raw backlog of unseen words.
 */
export function dueNow(reviewsDue, newCards, newLimit = NEW_CARDS_PER_SESSION) {
  return (Number(reviewsDue) || 0) + Math.min(Number(newCards) || 0, newLimit);
}

/**
 * The session queue after the SAVED grade of its first card. The card leaves the front; "Nochmal"
 * sends it to the back carrying the state that was just saved (`next`), so its next grade starts
 * from the lapse. Re-queueing the stale object let a later "Gut" overwrite the lapse with the old
 * schedule (a 20-day card came back after 50 days, lapses 0). A queue whose front is not `card`
 * any more is returned unchanged.
 */
export function queueAfterGrade(queue, card, grade, next) {
  if (!queue?.length || !card || queue[0]?.word_id !== card.word_id) return queue || [];
  const rest = queue.slice(1);
  return grade === GRADES.AGAIN ? [...rest, { ...card, ...next }] : rest;
}
