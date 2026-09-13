// First lesson before sign-up — the local half of it.
//
// A signed-out visitor already gets into free a1.1 (`src/config/freeTier.js`,
// LevelSubscriptionGuard): the lesson player runs end to end and simply wrote
// nothing. That is the leak this module closes. The recap now writes the
// Lektion into localStorage, the recap card offers "Fortschritt speichern",
// and the first render with a user present merges the local rows into
// `lesson_progress` / `program_progress` / `lesson_attempts` and clears them.
//
// Three rules it keeps:
//   1. NEVER THROWS. Every access goes through safeStorage (cookies blocked,
//      private windows, webviews). A learner without storage still finishes
//      the lesson; only the saving is lost.
//   2. NEVER OVERWRITES SERVER TRUTH DOWNWARDS. The merge upserts through
//      `completeLesson`, which is already the "finished" write; a Lektion the
//      account finished earlier is re-marked finished, never un-finished.
//   3. MERGES ONCE. The store is cleared as the last step, and an in-flight
//      flag stops a second React render from racing the first.
import { safeGetJSON, safeSetJSON, safeRemove } from '../../utils/safeStorage.js';
import { completeLesson, logAttempts } from '../../services/lessonService.js';

export const LOCAL_KEY = 'dm_course_local';

/** Attempts are the bulky part; a signed-out visitor never needs more than a lesson or two. */
const MAX_ATTEMPTS = 400;

const emptyStore = (level = null) => ({ level, lektionen: {}, attempts: [] });

/** The store as written, or an empty one. Shape-checked: a hand-edited blob must not crash a render. */
export function readLocalProgress() {
  const raw = safeGetJSON(LOCAL_KEY, null);
  if (!raw || typeof raw !== 'object') return emptyStore();
  return {
    level: typeof raw.level === 'string' ? raw.level : null,
    lektionen: raw.lektionen && typeof raw.lektionen === 'object' ? raw.lektionen : {},
    attempts: Array.isArray(raw.attempts) ? raw.attempts : [],
  };
}

export function clearLocalProgress() {
  safeRemove(LOCAL_KEY);
}

/** Lektion ids finished locally for `level` — what the course home renders as done for a visitor. */
export function localDoneIds(level) {
  const store = readLocalProgress();
  const lvl = String(level || '').toLowerCase();
  if (!store.level || store.level !== lvl) return new Set();
  return new Set(Object.keys(store.lektionen).filter((id) => store.lektionen[id]?.status));
}

export const hasLocalProgress = (level) => localDoneIds(level).size > 0;

/** How often a signed-out learner finished one Lektion — 0 when never. */
export function localRunCount(level, lektionId) {
  const store = readLocalProgress();
  const lvl = String(level || '').toLowerCase();
  if (!store.level || store.level !== lvl) return 0;
  const row = store.lektionen[lektionId];
  if (!row || !row.status) return 0;
  return Math.max(1, Number(row.runs) || 1);
}

/**
 * Record a finished Lektion locally. Switching level throws the old store
 * away — only one free level exists, and a half-merged mix of two would be
 * worse than losing a lesson nobody signed up to keep.
 */
export function recordLocalLesson({ level, lektionId, status = 'complete', accuracy = 0, attempts = [] }) {
  if (!level || !lektionId) return false;
  const lvl = String(level).toLowerCase();
  const prev = readLocalProgress();
  const store = prev.level === lvl ? prev : emptyStore(lvl);
  store.level = lvl;
  // `runs` is what the lesson engine derives the attempt number from for a
  // signed-out learner (buildLesson.attemptFromCompletions): a repeat has to
  // draw a different seven, and the only record of "how often" on this side is
  // this counter. A store written before it existed has no runs — a finished
  // Lektion then counts as one, which is what `localRunCount` returns.
  const previous = store.lektionen[lektionId] || null;
  const runs = Math.max(0, Number(previous && previous.runs) || (previous && previous.status ? 1 : 0)) + 1;
  store.lektionen = {
    ...store.lektionen,
    [lektionId]: { status, accuracy, runs, completedAt: new Date().toISOString() },
  };
  store.attempts = [
    ...store.attempts,
    ...attempts.map((a) => ({
      lektionId,
      itemId: String(a.itemId || ''),
      stage: String(a.stage || ''),
      correct: !!a.correct,
      errorTag: a.errorTag || null,
    })),
  ].slice(-MAX_ATTEMPTS);
  return safeSetJSON(LOCAL_KEY, store);
}

let merging = false;

/**
 * Merge whatever a signed-out visitor did into the account that just signed
 * in. Idempotent by construction: the store is cleared at the end, and the
 * writes underneath are upserts keyed on (user_id, lektion_id).
 *
 * @returns {Promise<number>} Lektionen merged (0 when there was nothing).
 */
export async function mergeLocalProgress(userId) {
  if (!userId || merging) return 0;
  const store = readLocalProgress();
  const ids = Object.keys(store.lektionen || {});
  if (!store.level || ids.length === 0) return 0;

  merging = true;
  try {
    for (const lektionId of ids) {
      const row = store.lektionen[lektionId] || {};
      await completeLesson(userId, {
        level: store.level,
        lektionId,
        accuracy: Number(row.accuracy) || 0,
        status: row.status === 'gold' ? 'gold' : 'complete',
      });
      const attempts = (store.attempts || []).filter((a) => a.lektionId === lektionId);
      if (attempts.length) await logAttempts(userId, { level: store.level, lektionId }, attempts);
    }
    clearLocalProgress();
    return ids.length;
  } catch (err) {
    // A failed merge keeps the store: the next render tries again.
    console.error('[localProgress] merge failed:', err.message);
    return 0;
  } finally {
    merging = false;
  }
}
