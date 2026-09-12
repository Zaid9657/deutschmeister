// Mastery of one Lektion. No hearts, no fail state: the lesson is COMPLETE at
// any accuracy (standard §3) and GOLD at ≥ 80 % on FIRST attempt — a retry
// after seeing the answer is practice, not evidence, so only the first
// response to each item counts towards the figure.

export const GOLD_THRESHOLD = 0.8;

/**
 * firstAttemptAccuracy(attempts) → 0…1 over the first response per item.
 * `attempts` is the player's log: `{ itemId, correct }` in the order answered.
 * Warm-up and requeue replays carry ids already seen, so they are ignored here
 * by construction.
 */
export function firstAttemptAccuracy(attempts = []) {
  const seen = new Map();
  for (const a of attempts) {
    if (!a || !a.itemId) continue;
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
