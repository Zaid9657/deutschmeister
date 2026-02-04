import { supabase } from '../utils/supabase';

// ==========================================
// Helpers
// ==========================================

const toDbLevel = (level) => level.toLowerCase();

// ==========================================
// Data Transformation
// ==========================================

function mapDbLessonToApp(dbRow) {
  return {
    id: dbRow.id,
    level: dbRow.level,
    titleDe: dbRow.title_de || '',
    titleEn: dbRow.title_en || '',
    topic: dbRow.topic || '',
    contentDe: dbRow.content_de || '',
    contentEn: dbRow.content_en || '',
    keyVocabulary: dbRow.key_vocabulary || [],
    questions: dbRow.questions || [],
    wordCount: dbRow.word_count || 0,
    difficulty: dbRow.difficulty || 1,
    estimatedReadingTime: dbRow.estimated_reading_time || 5,
    orderIndex: dbRow.order_index || 0,
  };
}

// ==========================================
// Public API
// ==========================================

/**
 * Fetch all reading lessons for a sub-level from Supabase.
 * Returns empty array if nothing found or on error.
 */
export async function getReadingLessonsByLevel(level) {
  const dbLevel = toDbLevel(level);

  const { data, error } = await supabase
    .from('reading_lessons')
    .select('*')
    .eq('level', dbLevel)
    .order('order_index');

  if (error) {
    console.error('[readingService] getReadingLessonsByLevel ERROR:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapDbLessonToApp);
}

/**
 * Fetch a single reading lesson by ID from Supabase.
 * Returns null if not found.
 */
export async function getReadingLessonById(id) {
  const { data, error } = await supabase
    .from('reading_lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[readingService] getReadingLessonById ERROR:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapDbLessonToApp(data);
}

/**
 * Track lesson completion in user_reading_progress table.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function markLessonComplete(userId, lessonId) {
  if (!userId || !lessonId) return;

  try {
    await supabase
      .from('user_reading_progress')
      .upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,lesson_id' }
      );
  } catch (err) {
    console.error('[readingService] markLessonComplete error:', err);
  }
}

/**
 * Load all completed reading lesson IDs for a user.
 * Returns a Set of lesson IDs.
 */
export async function loadUserReadingProgress(userId) {
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from('user_reading_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true);

  if (error || !data) {
    return new Set();
  }

  return new Set(data.map((row) => row.lesson_id));
}

/**
 * Get lesson counts per level (for section page stats).
 */
export async function getReadingLessonCounts() {
  const { data, error } = await supabase
    .from('reading_lessons')
    .select('level');

  if (error || !data) return {};

  const counts = {};
  data.forEach((row) => {
    const level = row.level;
    counts[level] = (counts[level] || 0) + 1;
  });
  return counts;
}
