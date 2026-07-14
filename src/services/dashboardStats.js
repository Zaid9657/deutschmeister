import { supabase } from '../utils/supabase';

// ──────────────────────────────────────────────────────────────
// Dashboard stats — Supabase-backed metrics for the dashboard.
// Every value here comes from a real, persisted, per-user source.
// Each query is independent and fails soft (returns a safe default)
// so one missing table never blanks the whole dashboard.
//
// Sources (verified against project omqyueddktqeyrrqvnyq):
//   - user_grammar_progress.last_accessed / completed_at  → activity dates
//   - xray_usage.used_at                                  → activity dates + X-Ray count
//   - speaking_evaluations.created_at                     → activity dates + session count
// No new tables. No writes. Streak is derived from existing timestamps.
// ──────────────────────────────────────────────────────────────

/** Local YYYY-MM-DD key for a timestamp (day-streak is per calendar day, local time). */
const dayKey = (ts) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Gather every activity timestamp for a user across the three activity tables. */
async function fetchActivityTimestamps(userId) {
  const [grammar, xray, speaking] = await Promise.all([
    supabase
      .from('user_grammar_progress')
      .select('last_accessed, completed_at')
      .eq('user_id', userId),
    supabase
      .from('xray_usage')
      .select('used_at')
      .eq('user_id', userId),
    supabase
      .from('speaking_evaluations')
      .select('created_at')
      .eq('user_id', userId),
  ]);

  const stamps = [];
  (grammar.data || []).forEach((r) => {
    if (r.last_accessed) stamps.push(r.last_accessed);
    if (r.completed_at) stamps.push(r.completed_at);
  });
  (xray.data || []).forEach((r) => r.used_at && stamps.push(r.used_at));
  (speaking.data || []).forEach((r) => r.created_at && stamps.push(r.created_at));
  return stamps;
}

/**
 * Consecutive-day streak ending today (or yesterday, so a streak isn't lost
 * before the user has acted today). Derived entirely from activity timestamps.
 */
function computeStreak(timestamps) {
  const days = new Set(timestamps.map(dayKey).filter(Boolean));
  if (days.size === 0) return 0;

  const has = (d) => days.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);

  const cursor = new Date();
  // If nothing today, allow the streak to be anchored at yesterday.
  if (!has(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!has(cursor)) return 0;
  }

  let streak = 0;
  while (has(cursor)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Count of distinct activities done TODAY — feeds the daily-goal ring (target 3). */
function computeActivitiesToday(timestamps) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let n = 0;
  timestamps.forEach((ts) => {
    if (dayKey(ts) === todayKey) n += 1;
  });
  return n;
}

const EMPTY_STATS = {
  streak: 0,
  activitiesToday: 0,
  speakingSessions: 0,
  xrayChecks: 0,
};

/**
 * Load all Supabase-backed dashboard stats for a user in one call.
 * Returns EMPTY_STATS on no user or on error (never throws).
 */
export async function loadDashboardStats(userId) {
  if (!userId) return { ...EMPTY_STATS };

  try {
    const [timestamps, speakingCount, xrayCount] = await Promise.all([
      fetchActivityTimestamps(userId),
      supabase
        .from('speaking_evaluations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('xray_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      streak: computeStreak(timestamps),
      activitiesToday: computeActivitiesToday(timestamps),
      speakingSessions: speakingCount.count || 0,
      xrayChecks: xrayCount.count || 0,
    };
  } catch (err) {
    console.error('[dashboardStats] loadDashboardStats error:', err);
    return { ...EMPTY_STATS };
  }
}

export const DAILY_GOAL_TARGET = 3;
