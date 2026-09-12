import { supabase } from '../utils/supabase';
import { setProgramItemDone } from './programProgress';

// Persistence for the lesson engine (migrations/2026-09-12-lesson-engine.sql).
// Fail-soft like programProgress.js: a logged-out learner, a blocked network or
// an unapplied migration must never stop a lesson — the screen keeps working
// and the row is simply not written. Every call here is RLS-scoped to the
// caller's own rows; nothing on this path uses the service role.

/** `a1.1` → `a11_course`, the program_key the CourseHome percent already reads. */
export const programKeyFor = (level) => `${String(level || '').toLowerCase().replace(/\./g, '')}_course`;

/** Every lesson_progress row for one level, as a Map keyed by lektion_id. */
export const getLessonProgress = async (userId, level) => {
  if (!userId) return new Map();
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lektion_id, status, accuracy, completed_at')
    .eq('user_id', userId)
    .eq('level', String(level).toLowerCase());

  if (error) {
    console.error('[lessonService] getLessonProgress:', error.message);
    return new Map();
  }
  return new Map((data || []).map((r) => [r.lektion_id, r]));
};

/** Mark a Lektion as opened. Never overwrites a finished row back to 'started'. */
export const startLesson = async (userId, level, lektionId) => {
  if (!userId || !lektionId) return false;
  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      { user_id: userId, level: String(level).toLowerCase(), lektion_id: lektionId, status: 'started', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lektion_id', ignoreDuplicates: true },
    );
  if (error) console.error('[lessonService] startLesson:', error.message);
  return !error;
};

/**
 * Finish a Lektion: the lesson_progress row AND the program_progress tick that
 * keeps the existing course percent and certificate working (CONTRACT.md,
 * "Persistence"). The course tick is deliberately last — a failed lesson row
 * must not leave the path stuck.
 */
export const completeLesson = async (userId, { level, lektionId, accuracy = 0, status = 'complete' }) => {
  if (!userId || !lektionId) return false;
  const lvl = String(level).toLowerCase();
  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        level: lvl,
        lektion_id: lektionId,
        status,
        accuracy,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lektion_id' },
    );
  if (error) console.error('[lessonService] completeLesson:', error.message);
  await setProgramItemDone(userId, programKeyFor(lvl), lektionId, true);
  return !error;
};

/**
 * One row per answered item, for the error-tag report and the review queue.
 * `attempts` = [{ itemId, stage, correct, errorTag }]. Batched in one insert.
 */
export const logAttempts = async (userId, { level, lektionId }, attempts = []) => {
  if (!userId || !attempts.length) return false;
  const rows = attempts.map((a) => ({
    user_id: userId,
    level: String(level).toLowerCase(),
    lektion_id: lektionId,
    item_id: String(a.itemId || ''),
    stage: String(a.stage || ''),
    correct: !!a.correct,
    error_tag: a.errorTag || null,
  }));
  const { error } = await supabase.from('lesson_attempts').insert(rows);
  if (error) console.error('[lessonService] logAttempts:', error.message);
  return !error;
};

/**
 * The Wortfeld's words by id — article, plural and audio_url for the cards.
 * Words whose `wordId` is null in the curriculum simply render from the
 * curriculum's own de/en/article/plural fields.
 */
export const fetchWordsByIds = async (ids = []) => {
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return new Map();
  const { data, error } = await supabase
    .from('words')
    .select('id, german, english, article, plural, audio_url, example_sentence')
    .in('id', clean);

  if (error) {
    console.error('[lessonService] fetchWordsByIds:', error.message);
    return new Map();
  }
  return new Map(
    (data || []).map((row) => [
      row.id,
      {
        id: row.id,
        german: row.german || '',
        english: row.english || '',
        article: row.article || '',
        // Some rows carry the literal string "null" (see vocabularyService).
        plural: row.plural && row.plural !== 'null' ? row.plural : '',
        audioUrl: row.audio_url || '',
        example: row.example_sentence || '',
      },
    ]),
  );
};
