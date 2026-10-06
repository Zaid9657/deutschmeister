// The in-progress run of one Lektion, kept in sessionStorage.
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
// restores it on mount, and the recap clears it. So every full page load in
// the same tab resumes where the learner was, whichever screen caused it.
// sessionStorage, not localStorage: the snapshot belongs to this tab's run.
// A new tab or a new day starts a new run, as before — except the one hand-off
// at the end of this file, for the sign-up round trip.
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
export const RUN_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export const runKey = (level, lektionId) => `${RUN_KEY_PREFIX}${String(level || '').toLowerCase()}:${lektionId}`;

const asIndex = (n) => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};
const asList = (v) => (Array.isArray(v) ? v : []);

/** The serialisable snapshot of a run. `now` is a seam for tests. */
export function packRun({ stageKey, stageIndex = 0, itemIndex = 0, attempt = 1, attempts = [], misses = [], requeued = [], combo = 0, dueCards = [] } = {}, now = Date.now()) {
  return {
    v: RUN_VERSION,
    savedAt: now,
    stageKey: String(stageKey || ''),
    stageIndex: asIndex(stageIndex),
    itemIndex: asIndex(itemIndex),
    attempt: Math.max(1, asIndex(attempt)),
    attempts: asList(attempts),
    misses: asList(misses),
    requeued: asList(requeued),
    combo: asIndex(combo),
    dueCards: asList(dueCards),
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

export const saveRun = (level, lektionId, run) => safeSetJSON(runKey(level, lektionId), run, { session: true });

/**
 * End this Lektion's run: this tab's snapshot AND a hand-off of the same
 * Lektion (below). The recap calls it, so a run finished in this tab can never
 * be resumed — answers and all — by a tab opened later from the hand-off.
 */
export function clearRun(level, lektionId) {
  safeRemove(runKey(level, lektionId), { session: true });
  const handoff = safeGetJSON(HANDOFF_KEY, null);
  if (handoff && typeof handoff === 'object' && handoff.key === runKey(level, lektionId)) safeRemove(HANDOFF_KEY);
}

// THE ONE EXCEPTION TO "THIS TAB'S RUN": THE ACCOUNT ROUND TRIP (2026-10-06).
// The save-progress ask (src/lib/course/saveProgressAsk.js) sends a signed-out
// learner to /signup in the middle of a Lektion, and the confirmation e-mail
// opens /login in a NEW tab, whose sessionStorage is empty: the learner would
// land on the intro of the Lektion they were in the middle of. So the click
// copies this tab's run into localStorage (handOffRun), and the next tab that
// opens the same Lektion WITHOUT a run of its own takes it over, once
// (takeHandedOffRun, called by readRun). A tab that has its own run keeps it.
// The hand-off ages out like any run (RUN_MAX_AGE_MS), and clearRun (the
// recap) drops it with the run it copied.
export const HANDOFF_KEY = 'dm_lesson_run_handoff';

/** Copy this tab's run of one Lektion to localStorage for the sign-up round trip. False when there is none. */
export function handOffRun(level, lektionId, now = Date.now()) {
  const run = unpackRun(safeGetJSON(runKey(level, lektionId), null, { session: true }), now);
  if (!run) return false;
  return safeSetJSON(HANDOFF_KEY, { key: runKey(level, lektionId), run });
}

/** The run handed off to this Lektion, taken once: it moves into this tab's sessionStorage. */
export function takeHandedOffRun(level, lektionId, now = Date.now()) {
  const handoff = safeGetJSON(HANDOFF_KEY, null);
  if (!handoff || typeof handoff !== 'object' || handoff.key !== runKey(level, lektionId)) return null;
  safeRemove(HANDOFF_KEY);
  const run = unpackRun(handoff.run, now);
  if (run) saveRun(level, lektionId, run);
  return run;
}

/** This tab's run, else a run the sign-up round trip handed off to this Lektion, else null. */
export const readRun = (level, lektionId, now = Date.now()) =>
  unpackRun(safeGetJSON(runKey(level, lektionId), null, { session: true }), now) || takeHandedOffRun(level, lektionId, now);
