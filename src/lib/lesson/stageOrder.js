// How far a learner got in one Lektion, as a number that only goes up.
//
// buildLesson.js emits a Lektion's stages in this order (some are optional:
// the warm-up only when review cards are due, the pretest only when the
// Lektion has one). The RANK of a stage is its place in this list, not its
// index in one run's stage list — the same stage sits at a different index in
// a run with a warm-up than in one without, so an index would let a later
// stage "lose" against an earlier one from another run.
//
// lessonService.recordFurthestStage writes the rank to
// lesson_progress.furthest_stage_rank (forward only), and the Monday mail
// (weekly_truth_metrics, 'l01_stopped_at') sorts by it.
// tests/lesson-furthest-stage.test.mjs holds every built Lektion to this list.
export const STAGE_ORDER = Object.freeze([
  'warmup', 'pretest', 'dialog', 'wortfeld', 'notice', 'phonetik',
  'practice', 'derived', 'dictation', 'speaking', 'writing', 'requeue', 'recap',
]);

/** The rank of a stage key, or -1 for a key this list does not know. */
export const stageRank = (key) => STAGE_ORDER.indexOf(String(key || ''));
