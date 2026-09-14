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
//   4. THE NUMBER OF COMPLETED RUNS SURVIVES THE MERGE. The attempt a repeat
//      draws is derived from how often the Lektion was finished
//      (buildLesson.attemptFromCompletions), and signed in that count is the
//      number of attempt BATCHES in lesson_attempts. So the merge writes one
//      batch per local run — never one batch for all of them, which reset a
//      guest's three runs to one and handed the learner the seven items they
//      had just done, at the exact moment the course asks them to sign up
//      (DaF review #10 MAJOR 4).
import { safeSetJSON, safeRemove } from '../../utils/safeStorage.js';
import { completeLesson, logAttempts, runMarkerAttempt } from '../../services/lessonService.js';
import {
  LOCAL_KEY,
  emptyLocalProgress,
  readLocalProgress,
} from './localProgressRead.js';

export { LOCAL_KEY, hasLocalProgress, localDoneIds, readLocalProgress } from './localProgressRead.js';

/**
 * Attempts are the bulky part. The cap is counted PER LEKTION and drops whole
 * runs, oldest first — a global cap let a long guest visit evict every answer
 * of the early Lektionen, and a half-kept run is worse than no run at all
 * (review #10 MAJOR 4, second measurement). A run whose answers are trimmed
 * still merges: its batch carries the run marker, so the COUNT never depends
 * on the answers being kept.
 */
export const MAX_ATTEMPTS_PER_LEKTION = 200;

/** The run an attempt belongs to; a store written before runs were tagged is run 1. */
const runOf = (a) => {
  const n = Math.floor(Number(a && a.run));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

/** Drop whole runs (oldest first, never the newest) until a Lektion is under the cap. */
function trimAttempts(list) {
  const byLektion = new Map();
  for (const a of list) {
    if (!byLektion.has(a.lektionId)) byLektion.set(a.lektionId, []);
    byLektion.get(a.lektionId).push(a);
  }
  const dropped = new Set();
  for (const [lektionId, rows] of byLektion) {
    let count = rows.length;
    if (count <= MAX_ATTEMPTS_PER_LEKTION) continue;
    const runs = [...new Set(rows.map(runOf))].sort((x, y) => x - y);
    for (const run of runs.slice(0, -1)) {
      if (count <= MAX_ATTEMPTS_PER_LEKTION) break;
      count -= rows.filter((r) => runOf(r) === run).length;
      dropped.add(`${lektionId}#${run}`);
    }
  }
  if (!dropped.size) return list;
  return list.filter((a) => !dropped.has(`${a.lektionId}#${runOf(a)}`));
}

export function clearLocalProgress() {
  safeRemove(LOCAL_KEY);
}

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
  const store = prev.level === lvl ? prev : emptyLocalProgress(lvl);
  store.level = lvl;
  // `runs` is what the lesson engine derives the attempt number from for a
  // signed-out learner (buildLesson.attemptFromCompletions): a repeat has to
  // draw a different seven, and the only record of "how often" on this side is
  // this counter. A store written before it existed has no runs — a finished
  // Lektion then counts as one, which is what `localRunCount` returns.
  const previous = store.lektionen[lektionId] || null;
  const runs = Math.max(0, Number(previous && previous.runs) || (previous && previous.status ? 1 : 0)) + 1;
  const completedAt = new Date().toISOString();
  // One stamp per completed run: the merge replays the runs with these as the
  // batches' created_at, so the finished-at moments stay the learner's own.
  const priorStamps = Array.isArray(previous && previous.runStamps) ? previous.runStamps.filter((x) => typeof x === 'string') : [];
  const runStamps = [...priorStamps, completedAt].slice(-runs);
  store.lektionen = {
    ...store.lektionen,
    [lektionId]: { status, accuracy, runs, runStamps, completedAt },
  };
  store.attempts = trimAttempts([
    ...store.attempts,
    ...attempts.map((a) => ({
      lektionId,
      run: runs,
      itemId: String(a.itemId || ''),
      stage: String(a.stage || ''),
      correct: !!a.correct,
      errorTag: a.errorTag || null,
    })),
  ]);
  return safeSetJSON(LOCAL_KEY, store);
}

let merging = false;

/**
 * `runs` stamps, strictly ascending and all DISTINCT: the stored ones when
 * present, else spaced back from the finish.
 *
 * Distinctness is the load-bearing half. `countCompletedRuns` counts distinct
 * `created_at` values, so two runs finished inside the same millisecond — a
 * guest replaying a short Lektion — would merge as ONE run and hand the
 * learner the draw they just did. A tie is nudged a millisecond forward, never
 * dropped.
 */
function runStampsFor(row, runs) {
  const stored = Array.isArray(row && row.runStamps) ? row.runStamps.filter((x) => typeof x === 'string') : [];
  const tail = stored.slice(-runs);
  const base = Date.parse((row && row.completedAt) || '') || Date.now();
  const derived = [];
  for (let i = 0; i < runs - tail.length; i += 1) {
    derived.push(new Date(base - (runs - tail.length - i) * 60000).toISOString());
  }
  let previous = -Infinity;
  return [...derived, ...tail].map((iso) => {
    const ms = Date.parse(iso);
    let value = Number.isFinite(ms) && ms > previous ? ms : previous + 1;
    // A hand-edited store can hold junk where a stamp belongs; never throw.
    if (!Number.isFinite(value)) value = Date.now();
    previous = value;
    return new Date(value).toISOString();
  });
}

/**
 * What the merge will write, as data — pure, so the rule can be tested without
 * a network, a client or a browser.
 *
 * One entry per finished Lektion, each with EXACTLY `runs` batches: the run's
 * own answers, or the run marker when they are gone. `countCompletedRuns` then
 * reads back the same number the guest's store held, so
 * `attemptFromCompletions` returns the same attempt before and after signing
 * in — the property review #10 MAJOR 4 found false.
 */
export function planLocalMerge(store) {
  const level = store && typeof store.level === 'string' ? store.level : null;
  if (!level) return [];
  const ids = Object.keys(store.lektionen || {}).filter((id) => store.lektionen[id] && store.lektionen[id].status);
  return ids.map((lektionId) => {
    const row = store.lektionen[lektionId] || {};
    const runs = Math.max(1, Math.floor(Number(row.runs)) || 1);
    const stamps = runStampsFor(row, runs);
    const groups = new Map();
    for (const a of store.attempts || []) {
      if (a.lektionId !== lektionId) continue;
      const run = Math.min(runs, runOf(a));
      if (!groups.has(run)) groups.set(run, []);
      groups.get(run).push({ itemId: a.itemId, stage: a.stage, correct: !!a.correct, errorTag: a.errorTag || null });
    }
    const batches = [];
    for (let run = 1; run <= runs; run += 1) {
      const rows = groups.get(run) || [];
      batches.push({ run, createdAt: stamps[run - 1], attempts: rows.length ? rows : [runMarkerAttempt()] });
    }
    return {
      lektionId,
      level,
      runs,
      accuracy: Number(row.accuracy) || 0,
      status: row.status === 'gold' ? 'gold' : 'complete',
      batches,
    };
  });
}

/**
 * Merge whatever a signed-out visitor did into the account that just signed
 * in. Idempotent by construction: the store is cleared at the end, and the
 * writes underneath are upserts keyed on (user_id, lektion_id).
 *
 * The batches are written SEQUENTIALLY and awaited: one INSERT per completed
 * run is the whole point, and separate statements also keep their `created_at`
 * distinct even if the explicit stamp is ever refused.
 *
 * `deps` is a seam for tests only.
 *
 * @returns {Promise<number>} Lektionen merged (0 when there was nothing).
 */
export async function mergeLocalProgress(userId, deps = {}) {
  if (!userId || merging) return 0;
  const complete = deps.completeLesson || completeLesson;
  const log = deps.logAttempts || logAttempts;
  const store = readLocalProgress();
  const plans = planLocalMerge(store);
  if (!plans.length) return 0;

  merging = true;
  try {
    for (const plan of plans) {
      await complete(userId, {
        level: plan.level,
        lektionId: plan.lektionId,
        accuracy: plan.accuracy,
        status: plan.status,
      });
      for (const batch of plan.batches) {
        await log(userId, { level: plan.level, lektionId: plan.lektionId, createdAt: batch.createdAt }, batch.attempts);
      }
    }
    clearLocalProgress();
    return plans.length;
  } catch (err) {
    // A failed merge keeps the store: the next render tries again.
    console.error('[localProgress] merge failed:', err.message);
    return 0;
  } finally {
    merging = false;
  }
}
