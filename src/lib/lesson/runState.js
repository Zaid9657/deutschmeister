// The in-progress run of one Lektion, kept in localStorage.
//
// WHY. The player held the whole run (stage, item, every answer) in React state
// and wrote nothing until the recap. Any full page load in between threw the
// run away and started the Lektion again at the intro. One of those page loads
// is built into the Lektion itself: the Sprechen stage's "speak freely" button
// leaves for the speaking coach with `window.location.assign`, and the coach's
// "Zurück zur Lektion" bar links back to /course/<level>/l/<nr>. The learner
// who did what the stage asked came back to the intro, with the pretest,
// dialogue, Wortfeld, practice and dictation to do again before the writing
// task and the recap. A reload, a mobile tab the browser evicted, or the
// header's "back to course" link did the same. On 2026-10-01 no A1.1 Lektion
// had ever been finished (6 starts, 0 completions).
//
// THE RULE. The player saves its run here on every stage or item change and
// restores it on mount, and the recap clears it. So every full page load
// resumes where the learner was, whichever screen caused it.
// localStorage since 2026-10 (it was sessionStorage): a learner who stops on
// the bus and opens the Lektion at home that evening resumes it too, and the
// course home offers "Continue Lektion N" (latestRun). A snapshot older than
// RUN_MAX_AGE_MS starts fresh. It holds item ids, correctness and the skill
// summaries — never text the learner typed.
// ponytail: two tabs on the same Lektion overwrite each other's snapshot (last
// write wins); scope it per tab if that ever shows up in support.
//
// WHAT A RESUMED RUN NEEDS TO BE THE SAME RUN. buildLesson is deterministic in
// (curriculum, lektion, pool, dueCards, attempt). The snapshot therefore keeps
// the two inputs that are fetched at runtime, `attempt` and the warm-up
// `dueCards`, and the player rebuilds the identical stage list from them. The
// stage is found by its key, so a stage list that did shift still lands on
// the right screen. Fail-soft like the rest of the engine: storage that throws
// or a malformed snapshot means a fresh run, never a broken screen.
import { safeGetJSON, safeRemove, safeSetJSON } from '../../utils/safeStorage.js';

export const RUN_KEY_PREFIX = 'dm_lesson_run:';
export const RUN_VERSION = 1;
/** Older than this, a snapshot is a different sitting: start the Lektion fresh. */
export const RUN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const runKey = (level, lektionId) => `${RUN_KEY_PREFIX}${String(level || '').toLowerCase()}:${lektionId}`;

const asIndex = (n) => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};
const asList = (v) => (Array.isArray(v) ? v : []);

/** The serialisable snapshot of a run. `now` is a seam for tests. */
export function packRun({ runId = '', stageKey, stageIndex = 0, itemIndex = 0, attempt = 1, attempts = [], misses = [], requeued = [], combo = 0, dueCards = [], skills = {} } = {}, now = Date.now()) {
  return {
    v: RUN_VERSION,
    savedAt: now,
    // Joins lesson_started → lesson_stage_viewed → lesson_completed of one run in analytics.
    runId: typeof runId === 'string' ? runId.slice(0, 40) : '',
    stageKey: String(stageKey || ''),
    stageIndex: asIndex(stageIndex),
    itemIndex: asIndex(itemIndex),
    attempt: Math.max(1, asIndex(attempt)),
    attempts: asList(attempts),
    misses: asList(misses),
    requeued: asList(requeued),
    combo: asIndex(combo),
    dueCards: asList(dueCards),
    // What speaking and writing reported (skillStatus.js). Absent from older
    // snapshots, which resume with nothing reported.
    skills: skills && typeof skills === 'object' && !Array.isArray(skills) ? skills : {},
  };
}

/** A stored snapshot, shape-checked and aged; null when it should not be resumed. */
export function unpackRun(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || raw.v !== RUN_VERSION) return null;
  if (typeof raw.stageKey !== 'string' || !raw.stageKey || raw.stageKey === 'recap') return null;
  const savedAt = Number(raw.savedAt);
  if (!Number.isFinite(savedAt) || now - savedAt > RUN_MAX_AGE_MS || savedAt - now > 60 * 1000) return null;
  return packRun(raw, savedAt);
}

/**
 * Where a resumed run re-enters the rebuilt stage list: the saved index when
 * the stage there still has the saved key, else the first stage with that
 * key, else the start. Never the recap: completion is written when the recap
 * comes into view, and a resume must not be what writes it.
 */
export function resumeStageIndex(stages, run) {
  const list = asList(stages);
  if (!run || !run.stageKey || run.stageKey === 'recap') return 0;
  const at = list[run.stageIndex];
  if (at && at.key === run.stageKey) return run.stageIndex;
  const found = list.findIndex((s) => s && s.key === run.stageKey);
  return found > 0 ? found : 0;
}

export const saveRun = (level, lektionId, run) => safeSetJSON(runKey(level, lektionId), run);
export const readRun = (level, lektionId, now = Date.now()) => unpackRun(safeGetJSON(runKey(level, lektionId), null), now);
export const clearRun = (level, lektionId) => safeRemove(runKey(level, lektionId));

/** The most recently saved unfinished run among `lektionIds` — what the course home offers to continue. */
export function latestRun(level, lektionIds = [], now = Date.now()) {
  let best = null;
  for (const lektionId of lektionIds) {
    const run = readRun(level, lektionId, now);
    if (run && (!best || run.savedAt > best.savedAt)) best = { lektionId, ...run };
  }
  return best;
}
