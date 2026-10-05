// Mastery of one Lektion. No hearts, no fail state: the lesson is COMPLETE at
// any accuracy (standard §3) and GOLD at ≥ 80 % on FIRST attempt — a retry
// after seeing the answer is practice, not evidence, so only the first
// response to each item counts towards the figure.

export const GOLD_THRESHOLD = 0.8;

/**
 * firstAttemptAccuracy(attempts) → 0…1 over the first response per item.
 * `attempts` is the player's log: `{ itemId, stage, correct, support }` in the
 * order answered.
 *
 * Two kinds of response are NOT first-try evidence and are left out:
 *   - the requeue stage ("Step 7 · Try again"). Its items are DIFFERENT
 *     variants with NEW ids (requeue.js), so the old comment here — "requeue
 *     replays carry ids already seen, so they are ignored by construction" —
 *     was false: every requeue answer, and every "Show answer" reveal in it,
 *     used to count as a fresh first try and pulled the recap figure (and gold)
 *     around after the learner had already been shown the rule;
 *   - an answer given with the transcript open after the audio failed
 *     (`support: 'transcript'`, AudioTrouble.jsx): it was read, not heard, and
 *     is never counted as listening evidence.
 */
export function firstAttemptAccuracy(attempts = []) {
  const seen = new Map();
  for (const a of attempts) {
    if (!a || !a.itemId) continue;
    if (a.stage === 'requeue' || a.support === 'transcript') continue;
    if (seen.has(a.itemId)) continue;
    seen.set(a.itemId, !!a.correct);
  }
  if (!seen.size) return 0;
  let ok = 0;
  for (const correct of seen.values()) if (correct) ok += 1;
  return ok / seen.size;
}

/** The percent shown on the recap card — a whole number, never rounded up past 100. */
export const accuracyPercent = (accuracy) => Math.min(100, Math.round((Number(accuracy) || 0) * 100));

/** 'gold' at ≥ 80 % first-attempt accuracy, 'complete' at anything else. */
export function masteryStatus(accuracy) {
  return (Number(accuracy) || 0) >= GOLD_THRESHOLD ? 'gold' : 'complete';
}

/** started < complete < gold — a finished Lektion is never written back down. */
export const STATUS_RANK = { started: 0, complete: 1, gold: 2 };

/**
 * keepBest(prev, next) → { status, accuracy } for a lesson_progress write.
 * A repeat of a gold Lektion at 60 % used to overwrite the row with
 * 'complete' / 0.6 (completeLesson upserted unconditionally, and the guest
 * merge goes through the same write), so practising again LOST progress.
 * The best status and the best accuracy are kept; an unknown previous row
 * (no row, a failed read) keeps the new values.
 */
export function keepBest(prev, next) {
  const p = prev || {};
  const n = next || {};
  const rank = (s) => (Object.prototype.hasOwnProperty.call(STATUS_RANK, s) ? STATUS_RANK[s] : -1);
  const status = rank(p.status) > rank(n.status) ? p.status : n.status;
  const pa = Number(p.accuracy);
  const na = Number(n.accuracy);
  const accuracy = Number.isFinite(pa) && (!Number.isFinite(na) || pa > na) ? pa : na;
  return { status, accuracy };
}

export const MASTERY_LABELS = {
  started: 'Begonnen',
  complete: 'Geschafft',
  gold: 'Gold',
};

export const masteryLabel = (status) => MASTERY_LABELS[status] || MASTERY_LABELS.started;

/**
 * The Babbel ladder (CONTRACT.md, review_cards): 1 → 4 → 7 → 14 → 60 → 180 d.
 * The recap card names the next date; the review agent owns the scheduling
 * itself, this is only the number the learner is shown.
 */
export const REVIEW_LADDER_DAYS = [1, 4, 7, 14, 60, 180];

export function nextReviewDate(from = new Date(), step = 0) {
  const days = REVIEW_LADDER_DAYS[Math.min(step, REVIEW_LADDER_DAYS.length - 1)];
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d;
}
