// Browser-only helper for the static grammar pages. Reuses the shared Supabase
// client, which — because it uses the same default storageKey as the React SPA
// (`sb-<ref>-auth-token`) — automatically restores the logged-in session from
// localStorage. So a user who signed in via the SPA is already authenticated
// here, and RLS lets them read/write only their own user_grammar_progress rows.
//
// It writes the row shape the SPA reads (src/services/grammarService.js):
//   { user_id, topic_id, current_stage:1, is_completed, score, last_accessed, completed_at? }
// so the dashboard's continue-state (which reads the same table) stays in sync
// without any extra plumbing.
import { supabase } from './supabase.js';

/** A practice run at or above this percentage completes the topic. */
const PASS_PCT = 70;

/** Cheap synchronous check — is there any Supabase auth token in localStorage?
 *  Lets callers skip loading this module's async work (and the network) for the
 *  logged-out majority (SEO visitors), keeping those page loads JS-light. */
export function hasStoredSession() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^sb-.*-auth-token$/.test(k)) return true;
    }
  } catch { /* localStorage blocked */ }
  return false;
}

/** Resolve the current user from the stored session (no network round-trip). */
async function currentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the user's grammar progress, keyed by topic_id (UUID).
 * Returns { user, byTopic } where byTopic[topic_id] = { is_completed, score,
 * last_accessed, completed_at }. If logged out, user is null and byTopic empty.
 */
export async function getProgress() {
  const user = await currentUser();
  if (!user) return { user: null, byTopic: {} };

  const { data, error } = await supabase
    .from('user_grammar_progress')
    .select('topic_id, is_completed, score, last_accessed, completed_at')
    .eq('user_id', user.id);

  if (error) {
    console.warn('[grammarProgress] load failed:', error.message);
    return { user, byTopic: {} };
  }

  const byTopic = {};
  (data ?? []).forEach((r) => { byTopic[r.topic_id] = r; });
  return { user, byTopic };
}

/**
 * One practice run merged into the stored row, so a better run always survives
 * a weaker repeat (CLAUDE.md; src/lib/course/localProgress.js rule 2, "never
 * overwrites server truth downwards"):
 *   is_completed  — once passed, stays passed;
 *   score         — the best run (0–100);
 *   completed_at  — the FIRST pass (streak stamps read it), now when this run is it;
 *   last_accessed — now.
 * `prev` is the stored { is_completed, score, completed_at }, or null for none.
 * Pure: tests/grammar-attempt-merge.test.mjs pins it.
 */
export function mergeGrammarAttempt(prev, scorePct, now = new Date().toISOString()) {
  const passed = scorePct >= PASS_PCT;
  const best = Number.isFinite(prev?.score) ? Math.max(prev.score, scorePct) : scorePct;
  const completedAt = prev?.completed_at || (passed ? now : null);
  return {
    is_completed: prev?.is_completed === true || passed,
    score: best,
    last_accessed: now,
    ...(completedAt ? { completed_at: completedAt } : {}),
  };
}

/**
 * Record a finished practice run for a topic (score: a 0–100 percentage).
 * The upsert replaces every column it names, so the run is merged into the
 * stored row first: writing this run's values alone let one 50% re-run mark a
 * topic passed at 85% not completed, lower its score and move the learner's
 * dashboard path back. When that read fails the write is insert-only: a first
 * run is kept, an existing row is never overwritten unread.
 * Fire-and-forget — never throws into the caller.
 */
export async function recordAttempt(topicId, scorePct) {
  try {
    const user = await currentUser();
    if (!user || !topicId) return;
    const { data: prev, error: readError } = await supabase
      .from('user_grammar_progress')
      .select('is_completed, score, completed_at')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .maybeSingle();
    if (readError) console.warn('[grammarProgress] read before record failed:', readError.message);
    const row = {
      user_id: user.id,
      topic_id: topicId,
      current_stage: 1,
      ...mergeGrammarAttempt(readError ? null : prev, scorePct),
    };
    await supabase
      .from('user_grammar_progress')
      .upsert(row, { onConflict: 'user_id,topic_id', ...(readError ? { ignoreDuplicates: true } : {}) });
  } catch (err) {
    console.warn('[grammarProgress] record failed:', err?.message);
  }
}
