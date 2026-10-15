// A Lektion in three short parts (Wave 1, Codex learner-value review, 2026-10-09): meet it (dialogue,
// words, grammar, sounds), use it (practice, listening), say and write it yourself (speaking,
// writing, retries, recap). Each part ends at a saved place to stop — the run is saved on every
// stage (runState.js), so coming back resumes at the next part. Short, frequent sessions beat long
// ones for adult learners (research summarised in the Wave 1 plan).
const SESSION_OF = {
  warmup: 1, pretest: 1, dialog: 1, wortfeld: 1, notice: 1, phonetik: 1,
  practice: 2, derived: 2, dictation: 2,
  speaking: 3, writing: 3, requeue: 3, recap: 3,
};

export const SESSION_COUNT = 3;

/** The part (1–3) a stage belongs to, or null for a kind this table does not know. */
export const sessionOf = (stage) => SESSION_OF[stage?.kind] ?? null;

/** The part a move from `from` to `to` completes, or null when the move stays inside one part. */
export function sessionCompleted(from, to) {
  const a = sessionOf(from);
  const b = sessionOf(to);
  return a && b && b > a ? a : null;
}
