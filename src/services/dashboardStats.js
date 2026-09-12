// Explicit .js extension so node --test can import this module's pure
// functions (grammarRowStamps, computeStreak, computeStreakForgiving,
// computeActivitiesToday).
import { supabase } from '../utils/supabase.js';

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
export const dayKey = (ts) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Activity stamps for one user_grammar_progress row. Completing a lesson also
 * touches last_accessed, and pushing both stamps made a single lesson fill 2
 * of the 3 daily-goal slots. Same-day stamps collapse to one; a completion and
 * a later re-visit on different days are both real activity days and both count.
 */
export function grammarRowStamps(row) {
  const stamps = [];
  if (row.completed_at) stamps.push(row.completed_at);
  if (row.last_accessed && dayKey(row.last_accessed) !== dayKey(row.completed_at)) {
    stamps.push(row.last_accessed);
  }
  return stamps;
}

/** Gather every activity timestamp for a user across the activity tables. */
async function fetchActivityTimestamps(userId) {
  const [grammar, xray, speaking, reading, listening, srs, writing, exams, lessonItems, lessons] = await Promise.all([
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
    // Reading and listening both counted for nothing before this: a learner
    // could finish a lesson or a dialogue every day and still show a 0-day
    // streak. (user_listening_progress did not even exist, so the SPA's writes
    // to it were being discarded silently.)
    supabase
      .from('user_reading_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true),
    supabase
      .from('user_listening_progress')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('completed', true),
    // Renovation Phase 6: SRS reviews, writing evaluations and completed
    // practice exams are real daily work and feed the streak + goal too.
    supabase
      .from('vocab_srs_cards')
      .select('last_reviewed_at')
      .eq('user_id', userId)
      .not('last_reviewed_at', 'is', null),
    supabase
      .from('writing_submissions')
      .select('created_at')
      .eq('user_id', userId),
    supabase
      .from('exam_attempts')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'completed'),
    // P4: the rebuilt course engine. Before this, a learner could do a whole
    // Lektion a day and still see a 0-day streak — the Flame on the course
    // home was measuring everything EXCEPT the course. lesson_attempts is one
    // row per answered item (the work), lesson_progress one row per Lektion
    // (the finish); both fail soft like every source above.
    supabase
      .from('lesson_attempts')
      .select('created_at')
      .eq('user_id', userId),
    supabase
      .from('lesson_progress')
      .select('updated_at')
      .eq('user_id', userId),
  ]);

  const stamps = [];
  (grammar.data || []).forEach((r) => stamps.push(...grammarRowStamps(r)));
  (xray.data || []).forEach((r) => r.used_at && stamps.push(r.used_at));
  (speaking.data || []).forEach((r) => r.created_at && stamps.push(r.created_at));
  (reading.data || []).forEach((r) => r.completed_at && stamps.push(r.completed_at));
  (listening.data || []).forEach((r) => r.completed_at && stamps.push(r.completed_at));
  (srs.data || []).forEach((r) => r.last_reviewed_at && stamps.push(r.last_reviewed_at));
  (writing.data || []).forEach((r) => r.created_at && stamps.push(r.created_at));
  (exams.data || []).forEach((r) => r.completed_at && stamps.push(r.completed_at));
  (lessonItems.data || []).forEach((r) => r.created_at && stamps.push(r.created_at));
  (lessons.data || []).forEach((r) => r.updated_at && stamps.push(r.updated_at));
  return stamps;
}

/**
 * Consecutive-day streak ending today (or yesterday, so a streak isn't lost
 * before the user has acted today). Derived entirely from activity timestamps.
 */
export function computeStreak(timestamps) {
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

/**
 * The forgiving streak (P4, "completion levers").
 *
 * `computeStreak` above is strict: one missed calendar day and the count is
 * back to zero. That is the rule research flags as the single biggest reason
 * adult learners abandon a course after a normal bad week — and it is not a
 * rule about learning, only about bookkeeping. This variant forgives
 * `graceDaysPer7` missed days in any rolling seven-day window and keeps
 * counting; the second miss inside the same window still ends the streak, so
 * the number never becomes a lie.
 *
 * Both live side by side on purpose: `streak` keeps its meaning for the
 * dashboard (and for tests/progress.test.mjs, which pins strict behaviour),
 * `streakForgiving` is what the rebuilt course home shows on its Flame.
 *
 * Pure. `days` is any iterable of dayKey() strings (a Set is fine).
 * A missed TODAY is free and never spends grace — the learner may still act
 * later today, exactly as the strict version anchors on yesterday.
 *
 * @param {Iterable<string>} days
 * @param {{graceDaysPer7?: number}} [options]
 * @returns {number} days of activity in the surviving streak (missed days are
 *          forgiven, never counted — the number is days worked, not elapsed)
 */
export function computeStreakForgiving(days, { graceDaysPer7 = 1 } = {}) {
  const set = days instanceof Set ? days : new Set(days || []);
  if (set.size === 0) return 0;

  const keyFor = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  };

  let streak = 0;
  let seen = 0;
  const missOffsets = [];

  for (let offset = 0; seen < set.size && offset < 3650; offset += 1) {
    if (set.has(keyFor(offset))) {
      streak += 1;
      seen += 1;
      continue;
    }
    // Nothing yet today: not a miss, the day is not over.
    if (offset === 0) continue;
    missOffsets.push(offset);
    // Misses inside the seven-day window ENDING at this day (offsets are
    // counted backwards, so the window is (offset-7, offset]).
    const inWindow = missOffsets.filter((o) => o > offset - 7).length;
    if (inWindow > graceDaysPer7) break;
  }

  return streak;
}

/** Count of distinct activities done TODAY — feeds the daily-goal ring (target 3). */
export function computeActivitiesToday(timestamps) {
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
  streakForgiving: 0,
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

    const dayKeys = new Set(timestamps.map(dayKey).filter(Boolean));
    return {
      streak: computeStreak(timestamps),
      streakForgiving: computeStreakForgiving(dayKeys),
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
