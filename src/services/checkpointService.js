import { supabase } from '../utils/supabase.js';
import { setProgramItemDone } from './programProgress.js';
import { isItemCorrect } from '../lib/checkpoint/buildCheckpoint.js';
import { tagError } from '../lib/lesson/check.js';

// Checkpoint persistence (CONTRACT.md "Persistence"; standard §3).
//
// Three ledgers, one write path:
//   - `lesson_attempts` — one row per ITEM (stage 'checkpoint', item_id = the
//     checkpoint item id) plus ONE summary row per attempt whose item_id is the
//     checkpoint id itself. The summary row is what the 3-attempts-per-8-h rule
//     counts: counting item rows would make a partially answered run look like
//     twenty attempts, and counting nothing would make the limit unenforceable
//     without a server round trip per item.
//   - `lesson_progress` — status 'complete' for the checkpoint once it passes.
//   - `program_progress` — the same id under `<level>_course`, so the existing
//     CourseHome percentage and the certificate keep working unchanged.
//
// Fail-soft everywhere (programProgress posture): a signed-out learner may take
// the checkpoint, the attempt is counted in localStorage only, and nothing
// throws into the middle of a test.

export const ATTEMPT_LIMIT = 3;
export const ATTEMPT_WINDOW_HOURS = 8;
const WINDOW_MS = ATTEMPT_WINDOW_HOURS * 60 * 60 * 1000;
const LOCAL_KEY = 'dm_checkpoint_attempts';

/** `a1.1` → `a11_course` — the program key the course home already reads. */
export const programKeyFor = (level) => `${String(level || '').toLowerCase().replace(/\./g, '')}_course`;

// ── local mirror (signed out, or Supabase unreachable) ──────────────────────

const readLocal = () => {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeLocal = (value) => {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
  } catch {
    /* private mode / blocked storage — the limit is advisory, never a blocker */
  }
};

function pushLocalAttempt(checkpointId) {
  const all = readLocal();
  const now = Date.now();
  const kept = (all[checkpointId] || []).filter((t) => now - t < WINDOW_MS);
  kept.push(now);
  all[checkpointId] = kept;
  writeLocal(all);
  return kept;
}

function localAttempts(checkpointId) {
  const now = Date.now();
  return (readLocal()[checkpointId] || []).filter((t) => now - t < WINDOW_MS);
}

/** used / remaining / when the oldest attempt in the window falls out. */
function attemptState(timestamps) {
  const used = timestamps.length;
  const oldest = timestamps.length ? Math.min(...timestamps) : null;
  return {
    used,
    remaining: Math.max(0, ATTEMPT_LIMIT - used),
    blocked: used >= ATTEMPT_LIMIT,
    nextAllowedAt: used >= ATTEMPT_LIMIT && oldest ? new Date(oldest + WINDOW_MS) : null,
  };
}

// ── reads ───────────────────────────────────────────────────────────────────

/** How many attempts are left in the current 8-hour window? */
export async function fetchAttemptState(userId, checkpointId) {
  if (!userId) return attemptState(localAttempts(checkpointId));
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('lesson_attempts')
    .select('created_at')
    .eq('user_id', userId)
    .eq('lektion_id', checkpointId)
    .eq('item_id', checkpointId)
    .eq('stage', 'checkpoint')
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[checkpointService] fetchAttemptState:', error.message);
    return attemptState(localAttempts(checkpointId));
  }
  return attemptState((data || []).map((r) => new Date(r.created_at).getTime()));
}

/** Has this checkpoint already been passed? */
export async function fetchCheckpointStatus(userId, checkpointId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('status, accuracy, completed_at')
    .eq('user_id', userId)
    .eq('lektion_id', checkpointId)
    .maybeSingle();
  if (error) {
    console.error('[checkpointService] fetchCheckpointStatus:', error.message);
    return null;
  }
  return data || null;
}

// ── writes ──────────────────────────────────────────────────────────────────

/**
 * Record one finished attempt: the per-item rows, the summary row the attempt
 * limit counts, and — when it passed — completion in lesson_progress and
 * program_progress. Returns true when the remote write succeeded.
 */
export async function recordAttempt(userId, { level, checkpointId, items, answers = {}, result, stamp = null, retry = false }, client = supabase, complete = completeCheckpoint) {
  if (!retry) pushLocalAttempt(checkpointId);
  if (!userId) return false;

  const lvl = String(level || '').toLowerCase();
  // One stamp per finished paper (the page keeps it), so a retry finds the attempt it already
  // wrote instead of counting a second one (Codex score review, 2026-10-08).
  const nowIso = stamp || new Date().toISOString();
  const landed = async () => {
    if (!stamp) return false;
    const { data, error } = await client.from('lesson_attempts').select('created_at')
      .eq('user_id', userId).eq('lektion_id', checkpointId).eq('item_id', checkpointId).eq('created_at', nowIso);
    return !error && Array.isArray(data) && data.length > 0;
  };
  const rows = (items || [])
    .filter((item) => item.scored)
    .map((item) => {
      const answer = answers[item.id];
      const correct = isItemCorrect(item, answer);
      return {
        user_id: userId,
        level: lvl,
        lektion_id: checkpointId,
        item_id: item.id,
        stage: 'checkpoint',
        correct,
        error_tag: correct
          ? null
          : tagError(
              { stage: item.section === 'hoeren' ? 'listening' : 'checkpoint', kind: item.kind, topic: item.topic, type: item.type },
              answer == null ? '' : String(answer),
              item.answer,
            ),
        created_at: nowIso,
      };
    });
  rows.push({
    user_id: userId,
    level: lvl,
    lektion_id: checkpointId,
    item_id: checkpointId, // the summary row — see the header
    stage: 'checkpoint',
    correct: Boolean(result?.passed),
    error_tag: null,
    created_at: nowIso,
  });

  if (!(await landed())) {
    const { error } = await client.from('lesson_attempts').insert(rows);
    if (error && !(await landed())) {
      console.error('[checkpointService] recordAttempt:', error.message);
      return false;
    }
  }
  // lesson_progress.accuracy is 0…1 (migrations/2026-09-12-lesson-engine.sql);
  // scoreCheckpoint's `overall` is a percent. Rows written before 2026-10-05
  // hold the percent and are left as written. A pass is saved only when its completion landed —
  // `true` used to come back with both writes failed.
  if (result?.passed) return (await complete(userId, { level: lvl, checkpointId, accuracy: result.overall / 100 })) === true;
  return true;
}

/**
 * A pass whose completion never landed (the result screen closed, the network dropped): its
 * summary row is in lesson_attempts, so the course home completes the node from it — the same
 * repair levelTestReconcile.js does for the final test. Resolves the ids it completed.
 */
export async function reconcileCheckpoints(userId, curriculum, done, { client = supabase, complete = completeCheckpoint } = {}) {
  const open = (curriculum?.checkpoints || []).map((c) => c.id).filter((id) => !done.has(id));
  if (!userId || !open.length) return [];
  const { data, error } = await client.from('lesson_attempts').select('lektion_id, item_id')
    .eq('user_id', userId).eq('stage', 'checkpoint').eq('correct', true).in('item_id', open);
  if (error || !Array.isArray(data)) return [];
  const passed = [...new Set(data.filter((r) => r.item_id === r.lektion_id).map((r) => r.lektion_id))];
  const out = [];
  for (const checkpointId of passed) {
    if ((await complete(userId, { level: curriculum.level, checkpointId })) === true) out.push(checkpointId);
  }
  return out;
}

/** Mark the checkpoint complete in both ledgers (idempotent). */
export async function completeCheckpoint(userId, { level, checkpointId, accuracy }) {
  if (!userId) return false;
  const lvl = String(level || '').toLowerCase();
  const { error } = await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      level: lvl,
      lektion_id: checkpointId,
      status: 'complete',
      // A reconciled pass knows no accuracy: leave the stored one alone rather than null it.
      ...(typeof accuracy === 'number' ? { accuracy } : {}),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lektion_id' },
  );
  if (error) console.error('[checkpointService] completeCheckpoint:', error.message);
  const programOk = await setProgramItemDone(userId, programKeyFor(lvl), checkpointId, true);
  return !error && programOk;
}
