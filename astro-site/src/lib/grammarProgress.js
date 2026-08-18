// Browser-only helper for the static grammar pages. Reuses the shared Supabase
// client, which — because it uses the same default storageKey as the React SPA
// (`sb-<ref>-auth-token`) — automatically restores the logged-in session from
// localStorage. So a user who signed in via the SPA is already authenticated
// here, and RLS lets them read/write only their own user_grammar_progress rows.
//
// This mirrors the SPA's write shape exactly (see GrammarLessonPage.jsx):
//   { user_id, topic_id, current_stage:1, is_completed, score, last_accessed, completed_at? }
// so the dashboard's existing continue-state (which reads the same table) stays
// in sync without any extra plumbing.
import { supabase } from './supabase.js';

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
 * Record a completed practice run for a topic. Matches GrammarLessonPage's
 * upsert exactly: score is a 0–100 percentage, is_completed at ≥70%. Only the
 * columns provided are written, so an existing row's other fields are preserved.
 * Fire-and-forget — never throws into the caller.
 */
export async function recordAttempt(topicId, scorePct) {
  try {
    const user = await currentUser();
    if (!user || !topicId) return;
    const completed = scorePct >= 70;
    const row = {
      user_id: user.id,
      topic_id: topicId,
      current_stage: 1,
      is_completed: completed,
      score: scorePct,
      last_accessed: new Date().toISOString(),
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    };
    await supabase
      .from('user_grammar_progress')
      .upsert(row, { onConflict: 'user_id,topic_id' });
  } catch (err) {
    console.warn('[grammarProgress] record failed:', err?.message);
  }
}
