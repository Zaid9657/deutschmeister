import { supabase } from '../utils/supabase.js';
import { getLessonProgress } from './lessonService.js';
import { readLocalProgress } from '../lib/course/localProgress.js';
import { pendingRuns } from '../lib/course/syncOutbox.js';

/** Existing ledgers only; failed reads leave neutral copy, never invented history. */
export async function loadDailyCourse(userId, level) {
  if (!userId) {
    const local = readLocalProgress();
    if (local.level !== level) return { rows: [], attempts: [] };
    return {
      rows: Object.entries(local.lektionen).map(([lektion_id, r]) => ({ lektion_id, completed_at: r.completedAt })),
      attempts: local.attempts.map((a) => ({ ...a, lektion_id: a.lektionId, item_id: a.itemId, created_at: local.lektionen[a.lektionId]?.runStamps?.[a.run - 1] })),
    };
  }
  const [progress, evidence] = await Promise.allSettled([
    getLessonProgress(userId, level),
    supabase.from('lesson_attempts').select('lektion_id, item_id, stage, correct, error_tag, created_at').eq('user_id', userId).eq('level', level).order('created_at', { ascending: false }).limit(2000),
  ]);
  const pending = pendingRuns(userId).filter((r) => r.level === level);
  return {
    rows: [...(progress.status === 'fulfilled' ? [...progress.value.values()] : []), ...pending.map((r) => ({ lektion_id: r.lektionId, completed_at: r.createdAt }))],
    attempts: [...(evidence.status === 'fulfilled' ? evidence.value.data || [] : []), ...pending.flatMap((r) => r.attempts.map((a) => ({ ...a, lektion_id: r.lektionId, item_id: a.itemId, created_at: r.createdAt })))],
  };
}

export async function fetchDailyWarmup(userId, curriculum, lesson, index, dueRows, run = null) {
  const { dailyWarmupRows } = await import('../lib/course/dailyWarmup.js');
  const evidence = await loadDailyCourse(userId, curriculum.level);
  return dailyWarmupRows(dueRows, index, curriculum, evidence.attempts, lesson.nr, run);
}
