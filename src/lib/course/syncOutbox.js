// The save contract of a finished Lektion for a SIGNED-IN learner (2026-10 review).
//
// The recap used to fire three writes — the attempt batch, the progress row, the review cards —
// without awaiting any of them. A failed write was a console line, a reload during the writes lost
// them, and nothing told the learner. Now:
//
//   1. LOCAL FIRST. The run is written to this outbox (localStorage) BEFORE any network call, with
//      its finish time stamped ONCE. A reload, a closed tab or a dead connection leaves the entry
//      where the next flush finds it (the recap, the `online` event, the course home).
//   2. THREE IDEMPOTENT STEPS, each marked done on success and never repeated:
//        attempts — logAttempts with the run's stamp; it skips a batch the database already holds,
//                   so a retry after a lost response does not add a second "completed run";
//        progress — completeLesson, which keeps the better run;
//        cards    — seedCardsForLektion (an upsert that ignores duplicates).
//      A partial success keeps the entry with only the missing steps left.
//   3. AN HONEST STATE for the recap: 'synced', or 'failed' with the work kept on this device and a
//      retry. The learner is never blocked: the next Lektion opens either way.
//   4. SCOPED TO ITS ACCOUNT. An entry carries the user id it was finished under and only that
//      account flushes it; entries older than OUTBOX_MAX_AGE_DAYS are dropped. An entry holds item
//      ids, stages and correctness — never text the learner typed.
//
// Signed OUT, the run goes to localProgress.js instead (the guest store), merged on sign-in.
import { safeGetJSON, safeSetJSON } from '../../utils/safeStorage.js';
import { completeLesson, logAttempts } from '../../services/lessonService.js';
import { seedCardsForLektion } from '../../services/reviewService.js';
import { curriculumFor } from '../../data/curricula/index.js';

export const OUTBOX_KEY = 'dm_lesson_outbox';
export const OUTBOX_MAX_AGE_DAYS = 30;
const STEPS = ['attempts', 'progress', 'cards'];

// When storage refuses the write (blocked, private mode, quota), the queue lives here for the rest
// of the page's life instead — the run is still sent; it just cannot survive a reload. Without this
// a refused write left an empty queue, the flush found nothing and the recap said "Saved to your
// account" for a run that was never sent (Codex review, 2026-10-07).
let memory = null;

function readAll(now = Date.now()) {
  const raw = memory || safeGetJSON(OUTBOX_KEY, []);
  const cutoff = now - OUTBOX_MAX_AGE_DAYS * 86400000;
  return (Array.isArray(raw) ? raw : [])
    .filter((e) => e && typeof e === 'object' && e.key && e.userId && e.done)
    .filter((e) => (Date.parse(e.createdAt) || 0) >= cutoff);
}

function writeAll(list) {
  const stored = safeSetJSON(OUTBOX_KEY, list);
  memory = stored ? null : list;
  return stored;
}

/** Store a finished run before anything goes over the network. A second enqueue of the same run is a no-op. */
export function enqueueRun({ userId, level, lektionId, createdAt, attempts = [], accuracy = 0, status = 'complete' }) {
  if (!userId || !lektionId || !createdAt) return null;
  const list = readAll();
  const key = `${userId}:${lektionId}:${createdAt}`;
  const existing = list.find((e) => e.key === key);
  if (existing) return existing;
  const entry = {
    key, userId, level: String(level || '').toLowerCase(), lektionId, createdAt, accuracy, status,
    attempts: attempts.map((a) => ({ itemId: a.itemId, stage: a.stage, correct: !!a.correct, errorTag: a.errorTag || null })),
    done: { attempts: false, progress: false, cards: false },
  };
  writeAll([...list, entry]);
  return entry;
}

/** False while the queue lives only in memory (storage refused it): a reload would lose it. */
export const outboxIsDurable = () => memory === null;

/** Runs this account still has to write. */
export const pendingRuns = (userId) => readAll().filter((e) => e.userId === userId);

/** The production writers; each resolves true on success. */
export const outboxDeps = {
  logAttempts: (userId, run) => logAttempts(userId, { level: run.level, lektionId: run.lektionId, createdAt: run.createdAt }, run.attempts),
  completeLesson: (userId, run) => completeLesson(userId, { level: run.level, lektionId: run.lektionId, accuracy: run.accuracy, status: run.status }),
  seedCards: async (userId, run) => {
    const lektion = (curriculumFor(run.level)?.lektionen || []).find((l) => l.id === run.lektionId);
    // A Lektion that no longer exists has no cards to seed; that is not a failure to retry for ever.
    return lektion ? (await seedCardsForLektion(userId, lektion, run.level)) > 0 : true;
  },
};

let inFlight = null;

/**
 * Write every pending run of `userId`. Returns { state: 'idle' | 'synced' | 'failed', failed: [{ key, steps }] }.
 * One flush at a time: the recap, an `online` event and the course home can all ask at once, and two
 * overlapping flushes would each run a step the other has not marked done yet. A caller that arrives
 * while a pass is running gets ANOTHER pass after it — a run enqueued meanwhile is not in the running
 * pass's snapshot, and answering with that pass's "synced" told the recap it was saved when it was not.
 */
export function flushOutbox(userId, deps = outboxDeps) {
  if (inFlight) {
    return inFlight.then((first) => flushOutbox(userId, deps).then((next) => (next.state === 'idle' ? first : next)));
  }
  inFlight = flushOnce(userId, deps).finally(() => { inFlight = null; });
  return inFlight;
}

async function flushOnce(userId, deps) {
  const mine = userId ? pendingRuns(userId) : [];
  if (!mine.length) return { state: 'idle', failed: [] };
  const failed = [];
  for (const entry of mine) {
    const run = { ...entry, done: { ...entry.done } };
    for (const step of STEPS) {
      if (run.done[step]) continue;
      const write = { attempts: run.attempts.length ? deps.logAttempts : async () => true, progress: deps.completeLesson, cards: deps.seedCards }[step];
      try {
        run.done[step] = (await write(userId, run)) === true;
      } catch {
        run.done[step] = false;
      }
    }
    // Write back THIS entry before the next one, so a reload mid-flush keeps what already landed.
    const left = STEPS.filter((s) => !run.done[s]);
    const rest = readAll().filter((e) => e.key !== run.key);
    writeAll(left.length ? [...rest, run] : rest);
    if (left.length) failed.push({ key: run.key, steps: left });
  }
  return { state: failed.length ? 'failed' : 'synced', failed };
}
