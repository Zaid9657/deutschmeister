import { supabase } from '../utils/supabase';

// ==========================================
// Helpers
// ==========================================

/** Convert app-level (b2.2) to DB sub_level (B2.2) - database stores uppercase */
const toDbLevel = (level) => level.toUpperCase();

/** Convert DB sub_level (B2.2) to app-level (b2.2) */
const toAppLevel = (dbLevel) => dbLevel.toLowerCase();

// ==========================================
// UUID Cache - maps "level:slug" → UUID
// ==========================================
const uuidCache = new Map();

/**
 * Look up a topic's UUID from grammar_topics table.
 * Cached per session to avoid repeated queries.
 * Returns null if not found.
 */
export async function lookupTopicUUID(level, slug) {
  const cacheKey = `${level}:${slug}`;
  if (uuidCache.has(cacheKey)) {
    return uuidCache.get(cacheKey);
  }

  const dbLevel = toDbLevel(level);
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('id')
    .eq('sub_level', dbLevel)
    .eq('slug', slug)
    .single();


  if (error || !data) {
    console.warn(`[grammarService] lookupTopicUUID FAILED for ${cacheKey}:`, error);
    uuidCache.set(cacheKey, null);
    return null;
  }

  uuidCache.set(cacheKey, data.id);
  return data.id;
}

// ==========================================
// Data Transformation Helpers
// ==========================================

/** Map a grammar_topics DB row to the app's topic format */
function mapDbTopicToApp(dbRow) {
  const appLevel = toAppLevel(dbRow.sub_level);
  return {
    id: `${appLevel}-gt${dbRow.topic_order}`,
    order: dbRow.topic_order,
    slug: dbRow.slug,
    titleEn: dbRow.title_en,
    titleDe: dbRow.title_de,
    descriptionEn: dbRow.description_en || '',
    descriptionDe: dbRow.description_de || '',
    icon: dbRow.icon || 'book',
    estimatedTime: dbRow.estimated_time || 20,
    uuid: dbRow.id,
    // Introduction fields (optional, added via migration)
    introductionEn: dbRow.introduction_en || null,
    introductionDe: dbRow.introduction_de || null,
    keyPoints: dbRow.key_points || null,
  };
}

/** Transform a grammar_exercises DB row into the app exercise format */
// `[]` is truthy in JavaScript, so `acceptable_answers || [correct_answer]`
// would pass an empty array straight through and reject every typed answer.
// The correct answer is always accepted, whatever the column happens to hold.
// (The Astro island spreads onto correct_answer instead — same guarantee,
/** Transform grammar_examples rows into stage2 format */
/** Transform grammar_rules rows into stage3 format */
/** Transform grammar_exercises rows into stage4/stage5 format */
// ==========================================
// Public API — Supabase only, NO static fallback
// ==========================================

/**
 * Fetch topics for a level from Supabase only.
 * Returns empty array if nothing found.
 */
export async function fetchTopicsForLevel(level) {
  const dbLevel = toDbLevel(level);

  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('sub_level', dbLevel)
    .order('topic_order');

  if (error) {
    console.error(`[grammarService] fetchTopicsForLevel ERROR:`, error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn(`[grammarService] fetchTopicsForLevel: NO TOPICS in Supabase for level="${level}"`);
    return [];
  }

  // Cache all UUIDs
  data.forEach(row => {
    uuidCache.set(`${level}:${row.slug}`, row.id);
  });

  return data.map(mapDbTopicToApp);
}


// ==========================================
// Progress Management
// ==========================================

/**
 * Load all grammar progress for a user from user_grammar_progress table.
 * Returns a map keyed by topic legacy ID (e.g. "a1.1-gt1").
 */
export async function loadUserGrammarProgress(userId) {
  if (!userId) return {};

  const { data, error } = await supabase
    .from('user_grammar_progress')
    .select('*, grammar_topics(slug, sub_level, topic_order)')
    .eq('user_id', userId);


  if (error || !data || data.length === 0) {
    return {};
  }

  const progressMap = {};
  data.forEach(row => {
    if (row.grammar_topics) {
      const { sub_level, topic_order, slug } = row.grammar_topics;
      const appLevel = toAppLevel(sub_level);
      const legacyId = `${appLevel}-gt${topic_order}`;

      // Cache UUID while we're at it
      uuidCache.set(`${appLevel}:${slug}`, row.topic_id);

      // The column is `is_completed` (not `completed`); reading the wrong name
      // left every topic looking incomplete, which pinned the dashboard's
      // "continue where you left off" to topic 1 regardless of real progress.
      progressMap[legacyId] = {
        completed: row.is_completed,
        progress: row.is_completed ? 100 : Math.round(((row.current_stage - 1) / 5) * 100),
        currentStage: row.current_stage,
        score: row.score || 0,
        completedAt: row.completed_at,
      };
    }
  });

  return progressMap;
}

/**
 * Save grammar progress to user_grammar_progress table.
 */
export async function saveUserGrammarProgress(userId, topicUUID, progressData) {
  if (!userId || !topicUUID) return;

  try {
    const upsertData = {
      user_id: userId,
      topic_id: topicUUID,
      current_stage: progressData.currentStage || 1,
      // Column is `is_completed`; writing `completed` silently failed (no such
      // column), so this table write never persisted from this path.
      is_completed: progressData.completed || false,
      score: progressData.score || 0,
      last_accessed: new Date().toISOString(),
    };

    if (progressData.completed) {
      upsertData.completed_at = progressData.completedAt || new Date().toISOString();
    }

    await supabase
      .from('user_grammar_progress')
      .upsert(upsertData, { onConflict: 'user_id,topic_id' });
  } catch (err) {
    console.error(`[grammarService] saveUserGrammarProgress error:`, err);
  }
}
