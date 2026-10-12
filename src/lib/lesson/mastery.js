// Mastery of one Lektion. No hearts, no fail state: the lesson is COMPLETE at
// any accuracy (standard §3) and GOLD at ≥ 80 % on the FIRST PASS of practice.
//
// What the figure counts (definition of 2026-10-05; lesson_progress rows written
// before that date keep the value they were written with):
// - the learner's first response to each item of the three scored practice
//   stages — controlled practice, the derived exercises (match / word order /
//   listen & select) and the dictation;
// - nothing from the retry stage (`requeue`): a retry comes after the answer was
//   shown, and requeueFor() hands out a DIFFERENT item id on purpose, so an
//   id-only de-duplication counted every retry as one more first attempt and
//   let a revealed retry move the percentage;
// - nothing from warm-up, writing or speaking — those are reported on their own
//   (skillStatus.js), never folded into this one number.
// A second response to the same (stage, item) — a reload that shows an
// answered item again — never counts twice. A dictation the learner READ instead
// of hearing (`listened: false` — the audio failed, or they asked for the text)
// is copying, not dictation: it counts neither here nor as listening.

export const GOLD_THRESHOLD = 0.8;

const FIRST_PASS_STAGES = new Set(['practice', 'derived', 'dictation']);

/**
 * Is this logged attempt part of the first pass? Attempts written before
 * stages were tagged carry no `stage` (they were practice items) and no `pass`.
 */
export function isFirstPass(a) {
  if (!a || !a.itemId) return false;
  const stage = a.stage || 'practice';
  return FIRST_PASS_STAGES.has(stage) && a.pass !== 'retry' && a.listened !== false;
}

/**
 * practiceScore(attempts) → { correct, total, accuracy } over the first-pass
 * responses (see above). `attempts` is the player's log in answer order:
 * `{ itemId, stage, pass, correct }`.
 */
export function practiceScore(attempts = []) {
  const seen = new Map();
  for (const a of attempts) {
    if (!isFirstPass(a)) continue;
    const key = `${a.stage || 'practice'}:${a.itemId}`;
    if (!seen.has(key)) seen.set(key, !!a.correct);
  }
  let correct = 0;
  for (const ok of seen.values()) if (ok) correct += 1;
  const total = seen.size;
  return { correct, total, accuracy: total ? correct / total : 0 };
}

/** firstAttemptAccuracy(attempts) → 0…1, the accuracy of practiceScore(). */
export const firstAttemptAccuracy = (attempts = []) => practiceScore(attempts).accuracy;

/** The percent shown on the recap card — a whole number, never rounded up past 100. */
export const accuracyPercent = (accuracy) => Math.min(100, Math.round((Number(accuracy) || 0) * 100));

/** 'gold' at ≥ 80 % first-pass practice accuracy, 'complete' at anything else. */
export function masteryStatus(accuracy) {
  return (Number(accuracy) || 0) >= GOLD_THRESHOLD ? 'gold' : 'complete';
}

/**
 * Of two finished runs of the same Lektion, the one to keep: the higher
 * accuracy (ties keep the stored one). A weaker repeat must not take a Gold
 * away — the earlier run still happened.
 */
export function betterRun(stored, next) {
  if (!stored) return next;
  return (Number(next.accuracy) || 0) > (Number(stored.accuracy) || 0) ? next : stored;
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
