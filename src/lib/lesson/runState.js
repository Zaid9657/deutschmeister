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

// One key per OWNER (2026-10-07, Codex review): a signed-in learner's run lives under their user id,
// so on a shared browser the next account never resumes — and submits — someone else's answers. A
// guest's run keeps the plain key; a learner who signs in mid-Lektion continues it (readRun also reads
// the guest key for a signed-in owner and takes the NEWER of the two snapshots, 2026-10-25), and the
// guest copy is cleared with the owner's.
export const runKey = (level, lektionId, owner = null) =>
  `${RUN_KEY_PREFIX}${String(level || '').toLowerCase()}:${lektionId}${owner ? `:${owner}` : ''}`;

const asIndex = (n) => {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 0 ? v : 0;
};
const asList = (v) => (Array.isArray(v) ? v : []);

/**
 * The read-aloud lines' results, by line index — what ReadAloudLine measured, as numbers and
 * flags (the word recognition `pct`, the attempts, mic or self-confirm). Never a transcript.
 */
function asReadAloud(v) {
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [index, r] of Object.entries(v)) {
    if (!/^\d+$/.test(index) || !r || typeof r !== 'object') continue;
    out[index] = {
      pct: typeof r.pct === 'number' && Number.isFinite(r.pct) ? r.pct : null,
      attempts: asIndex(r.attempts),
      usedMic: r.usedMic === true,
      ...(r.selfConfirmed === true ? { selfConfirmed: true } : {}),
    };
  }
  return out;
}

/** The serialisable snapshot of a run. `now` is a seam for tests. */
export function packRun({ runId = '', stageKey, stageIndex = 0, itemIndex = 0, attempt = 1, attempts = [], misses = [], requeued = [], combo = 0, dueCards = [], skills = {}, readAloud = {} } = {}, now = Date.now()) {
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
    // The read-aloud results as they were recorded (2026-10-25): the Sprechen stage's hand-off to
    // the coach is a full page load, and a line measured before it is not idle when it resumes.
    readAloud: asReadAloud(readAloud),
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

export const saveRun = (level, lektionId, run, owner = null) => safeSetJSON(runKey(level, lektionId, owner), run);

/**
 * The run to resume. A guest reads the guest key. A signed-in owner reads BOTH keys and gets the
 * snapshot saved LAST (a tie goes to the owner's): the owner key used to win outright, so a learner
 * who had stopped at the dialogue while signed in, later reached practice as a guest and then signed
 * in through the save-progress ask was put back on the dialogue — the newer guest answers dropped.
 * The next saveRun writes the winner under the owner key; clearRun removes both.
 */
export const readRun = (level, lektionId, now = Date.now(), owner = null) =>
  newerRun(owner, () => unpackRun(safeGetJSON(runKey(level, lektionId, owner), null), now), () => unpackRun(safeGetJSON(runKey(level, lektionId), null), now));

/** A guest reads the guest snapshot; an owner gets whichever of theirs and the guest's was saved last. */
function newerRun(owner, readOwn, readGuest) {
  const guest = readGuest();
  if (!owner) return guest;
  const own = readOwn();
  if (!own || !guest) return own || guest;
  return guest.savedAt > own.savedAt ? guest : own;
}
export const clearRun = (level, lektionId, owner = null) => {
  if (owner) safeRemove(runKey(level, lektionId, owner));
  return safeRemove(runKey(level, lektionId));
};

/** The most recently saved unfinished run among `lektionIds` — what the course home offers to continue. */
export function latestRun(level, lektionIds = [], now = Date.now(), owner = null) {
  let best = null;
  for (const lektionId of lektionIds) {
    const run = readRun(level, lektionId, now, owner);
    if (run && (!best || run.savedAt > best.savedAt)) best = { lektionId, ...run };
  }
  return best;
}

// ── Checkpoint runs (2026-10-25) ───────────────────────────────────────────────────────────────
// A checkpoint is twenty items, and its phase, position and answers lived in React state only: a
// reload, an iOS tab discard while the learner checked a message, the idle sign-out or a guard
// remount sent them back to the intro of the paper. Its run is kept like a Lektion's — the same
// 7-day age, one key per owner, the newer of the owner's and the guest's snapshot — and the result
// clears it. Unlike a Lektion snapshot it holds the answers themselves, because the score is
// computed from them (GradedWriting keeps a writing draft the same way, per learner, 7 days).
// The paper is not stored: buildCheckpoint rebuilds it from the `round` (paperSeed), and
// checkpointRunFits refuses a snapshot whose paper has changed (its fingerprint) or been superseded.

export const CHECKPOINT_RUN_PREFIX = 'dm_checkpoint_run:';
const CHECKPOINT_PHASES = new Set(['run', 'sectionFeedback']);

export const checkpointRunKey = (level, checkpointId, owner = null) =>
  `${CHECKPOINT_RUN_PREFIX}${String(level || '').toLowerCase()}:${checkpointId}${owner ? `:${owner}` : ''}`;

/**
 * A short fingerprint of a paper's content (FNV-1a over each item's id, pool item, answer and
 * prompt). Item ids are positions (`a1.1-cp1-hoeren-1` on every paper), so they cannot tell two
 * papers apart; a new pool after a deploy, or another round, changes the fingerprint.
 */
export function paperFingerprint(items) {
  const text = JSON.stringify(asList(items).map((i) => (i ? [i.id, i.poolItemId ?? null, i.answer ?? null, i.promptDe ?? null] : null)));
  let hash = 0x811c9dc5;
  for (let k = 0; k < text.length; k += 1) {
    hash ^= text.charCodeAt(k);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** The serialisable snapshot of a checkpoint run. `now` is a seam for tests. */
export function packCheckpointRun({ paper = '', round = 0, index = 0, answers = {}, notHeard = [], phase = 'run' } = {}, now = Date.now()) {
  return {
    v: RUN_VERSION,
    savedAt: now,
    paper: typeof paper === 'string' ? paper.slice(0, 16) : '',
    round: asIndex(round),
    index: asIndex(index),
    answers: answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {},
    notHeard: asList(notHeard).filter((id) => typeof id === 'string'),
    phase: CHECKPOINT_PHASES.has(phase) ? phase : 'run',
  };
}

/** A stored checkpoint snapshot, shape-checked and aged; null when it should not be resumed. */
export function unpackCheckpointRun(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || raw.v !== RUN_VERSION || !CHECKPOINT_PHASES.has(raw.phase)) return null;
  const savedAt = Number(raw.savedAt);
  if (!Number.isFinite(savedAt) || now - savedAt > RUN_MAX_AGE_MS || savedAt - now > 60 * 1000) return null;
  return packCheckpointRun(raw, savedAt);
}

/**
 * Is `run` still the paper `items` (the one its round rebuilds today), and still the current one?
 * A round below this window's attempt count is a paper from before a finished attempt, and a
 * fingerprint or an answered item the rebuilt paper does not match means the paper changed (a new
 * pool) — either way the snapshot is dropped and the checkpoint starts at its intro.
 */
export function checkpointRunFits(run, items, attemptsUsed = 0) {
  if (!run || !Array.isArray(items) || !items.length) return false;
  if (run.round < asIndex(attemptsUsed) || run.index >= items.length) return false;
  if (!run.paper || run.paper !== paperFingerprint(items)) return false;
  const ids = new Set(items.map((item) => item.id));
  return Object.keys(run.answers).every((id) => ids.has(id)) && run.notHeard.every((id) => ids.has(id));
}

export const saveCheckpointRun = (level, checkpointId, run, owner = null) => safeSetJSON(checkpointRunKey(level, checkpointId, owner), run);
export const readCheckpointRun = (level, checkpointId, now = Date.now(), owner = null) =>
  newerRun(
    owner,
    () => unpackCheckpointRun(safeGetJSON(checkpointRunKey(level, checkpointId, owner), null), now),
    () => unpackCheckpointRun(safeGetJSON(checkpointRunKey(level, checkpointId), null), now),
  );
export const clearCheckpointRun = (level, checkpointId, owner = null) => {
  if (owner) safeRemove(checkpointRunKey(level, checkpointId, owner));
  return safeRemove(checkpointRunKey(level, checkpointId));
};
