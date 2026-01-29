import { supabase } from '../utils/supabase';
import { getTopicsForLevel, getTopicBySlug } from '../data/grammarTopics';
import { getTopicContent } from '../data/grammarContent';

// ==========================================
// UUID Cache - maps "level:slug" → UUID
// ==========================================
const uuidCache = new Map();

/**
 * Look up a topic's UUID from grammar_topics table.
 * Cached per session to avoid repeated queries.
 * Returns null if the table is empty or topic not found.
 */
export async function lookupTopicUUID(level, slug) {
  const cacheKey = `${level}:${slug}`;
  if (uuidCache.has(cacheKey)) {
    return uuidCache.get(cacheKey);
  }

  try {
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('id')
      .eq('sub_level', level)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      uuidCache.set(cacheKey, null);
      return null;
    }

    uuidCache.set(cacheKey, data.id);
    return data.id;
  } catch {
    uuidCache.set(cacheKey, null);
    return null;
  }
}

// ==========================================
// Data Transformation Helpers
// ==========================================

/** Map a grammar_topics DB row to the app's topic format */
function mapDbTopicToApp(dbRow) {
  return {
    id: `${dbRow.sub_level}-gt${dbRow.topic_order}`,
    order: dbRow.topic_order,
    slug: dbRow.slug,
    titleEn: dbRow.title_en,
    titleDe: dbRow.title_de,
    descriptionEn: dbRow.description_en || '',
    descriptionDe: dbRow.description_de || '',
    icon: dbRow.icon || 'book',
    estimatedTime: dbRow.estimated_time || 20,
    uuid: dbRow.id,
  };
}

/** Map exercise_type from DB snake_case to app kebab-case */
function mapExerciseType(dbType) {
  const typeMap = {
    'fill_blank': 'fill-blank',
    'multiple_choice': 'multiple-choice',
    'matching': 'matching',
    'reorder': 'word-order',
    'error_correction': 'error-correction',
    'sentence_building': 'word-order',
    'translation': 'translation',
  };
  return typeMap[dbType] || dbType;
}

/** Transform a grammar_exercises DB row into the app exercise format */
function mapDbExerciseToApp(dbRow) {
  const exercise = {
    type: mapExerciseType(dbRow.exercise_type),
    question: {
      en: dbRow.question_en || dbRow.question_de,
      de: dbRow.question_de,
    },
    explanation: {
      en: dbRow.explanation_en || '',
      de: dbRow.explanation_de || '',
    },
  };

  if (dbRow.exercise_type === 'multiple_choice') {
    exercise.options = dbRow.options || [];
    // correct_answer for MC is the index
    exercise.correct = parseInt(dbRow.correct_answer, 10);
  } else if (dbRow.exercise_type === 'fill_blank' || dbRow.exercise_type === 'translation') {
    exercise.answer = dbRow.correct_answer;
    exercise.acceptableAnswers = dbRow.acceptable_answers || [dbRow.correct_answer];
  } else if (dbRow.exercise_type === 'reorder' || dbRow.exercise_type === 'sentence_building') {
    exercise.words = dbRow.options || [];
    exercise.correctOrder = dbRow.acceptable_answers || [];
  } else if (dbRow.exercise_type === 'matching') {
    exercise.options = dbRow.options || [];
    exercise.answer = dbRow.correct_answer;
    exercise.acceptableAnswers = dbRow.acceptable_answers || [dbRow.correct_answer];
  } else {
    exercise.answer = dbRow.correct_answer;
    exercise.acceptableAnswers = dbRow.acceptable_answers || [dbRow.correct_answer];
  }

  if (dbRow.hint) {
    exercise.hint = dbRow.hint;
  }

  return exercise;
}

/** Transform grammar_examples rows into stage2 format */
function buildStage2(examples) {
  if (!examples || examples.length === 0) return null;

  return {
    title: { en: 'Examples', de: 'Beispiele' },
    examples: examples.map(ex => ({
      german: ex.sentence_de,
      translation: ex.sentence_en,
      pronunciation: '',
      audioHint: ex.grammar_highlight || '',
      audioUrl: ex.audio_url || null,
    })),
  };
}

/** Transform grammar_rules rows into stage3 format */
function buildStage3(rules) {
  if (!rules || rules.length === 0) return null;

  const tables = [];
  const tips = [];
  const warnings = [];

  rules.forEach(rule => {
    const content = rule.content || {};

    if (rule.rule_type === 'table' || rule.rule_type === 'pattern') {
      tables.push({
        title: {
          en: rule.title_en || '',
          de: rule.title_de || '',
        },
        headers: content.headers || [],
        rows: content.rows || [],
      });
    } else if (rule.rule_type === 'tip' || rule.rule_type === 'note') {
      tips.push(content.en ? content : { en: rule.title_en || '', de: rule.title_de || '' });
    } else if (rule.rule_type === 'warning') {
      warnings.push(content.en ? content : { en: rule.title_en || '', de: rule.title_de || '' });
    }
  });

  return {
    title: { en: 'Rules & Patterns', de: 'Regeln und Muster' },
    tables,
    tips,
    warnings,
  };
}

/** Transform grammar_exercises rows into stage4/stage5 format */
function buildExerciseStages(exercises) {
  const stage4Exercises = [];
  const stage5Exercises = [];

  (exercises || []).forEach(ex => {
    const mapped = mapDbExerciseToApp(ex);
    if (ex.stage === 4) {
      stage4Exercises.push(mapped);
    } else if (ex.stage === 5) {
      stage5Exercises.push(mapped);
    }
  });

  const stage4 = stage4Exercises.length > 0 ? {
    title: { en: 'Guided Practice', de: 'Geführte Übung' },
    instructions: {
      en: 'Test your knowledge with these practice exercises.',
      de: 'Teste dein Wissen mit diesen Übungen.',
    },
    exercises: stage4Exercises,
  } : null;

  const stage5 = stage5Exercises.length > 0 ? {
    title: { en: 'Mastery Challenge', de: 'Meisterschaftsprüfung' },
    instructions: {
      en: 'Complete these advanced exercises to demonstrate mastery.',
      de: 'Schließe diese fortgeschrittenen Übungen ab, um Meisterschaft zu demonstrieren.',
    },
    exercises: stage5Exercises,
  } : null;

  return { stage4, stage5 };
}

// ==========================================
// Public API
// ==========================================

/**
 * Fetch topics for a level. Tries Supabase first, falls back to static data.
 */
export async function fetchTopicsForLevel(level) {
  try {
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('*')
      .eq('sub_level', level)
      .order('topic_order');

    if (!error && data && data.length > 0) {
      // Cache all UUIDs
      data.forEach(row => {
        uuidCache.set(`${level}:${row.slug}`, row.id);
      });
      return data.map(mapDbTopicToApp);
    }
  } catch {
    // Fall through to static data
  }

  // Fallback to static data
  return getTopicsForLevel(level);
}

/**
 * Fetch a single topic by slug. Tries Supabase first, falls back to static data.
 */
export async function fetchTopicBySlug(level, slug) {
  try {
    const { data, error } = await supabase
      .from('grammar_topics')
      .select('*')
      .eq('sub_level', level)
      .eq('slug', slug)
      .single();

    if (!error && data) {
      uuidCache.set(`${level}:${slug}`, data.id);
      return mapDbTopicToApp(data);
    }
  } catch {
    // Fall through to static data
  }

  return getTopicBySlug(level, slug);
}

/**
 * Fetch full content for a topic (all 5 stages).
 * Tries Supabase for stages 2-5, uses static data for stage 1 and as fallback.
 */
export async function fetchTopicContent(level, slug) {
  // Always get static content as baseline (especially for stage 1)
  const staticContent = getTopicContent(level, slug);

  // Try to get the topic UUID
  const topicUUID = await lookupTopicUUID(level, slug);
  if (!topicUUID) {
    return staticContent;
  }

  try {
    // Parallel fetch from all content tables
    const [examplesRes, rulesRes, exercisesRes] = await Promise.all([
      supabase
        .from('grammar_examples')
        .select('*')
        .eq('topic_id', topicUUID)
        .order('order_index'),
      supabase
        .from('grammar_rules')
        .select('*')
        .eq('topic_id', topicUUID)
        .order('order_index'),
      supabase
        .from('grammar_exercises')
        .select('*')
        .eq('topic_id', topicUUID)
        .order('order_index'),
    ]);

    const examples = examplesRes.data || [];
    const rules = rulesRes.data || [];
    const exercises = exercisesRes.data || [];

    // If all tables are empty, use static content entirely
    if (examples.length === 0 && rules.length === 0 && exercises.length === 0) {
      return staticContent;
    }

    // Build content, merging DB data with static fallbacks
    const dbStage2 = buildStage2(examples);
    const dbStage3 = buildStage3(rules);
    const { stage4: dbStage4, stage5: dbStage5 } = buildExerciseStages(exercises);

    return {
      // Stage 1 always from static (no DB table for introduction)
      stage1: staticContent?.stage1 || null,
      // Prefer DB data, fall back to static
      stage2: dbStage2 || staticContent?.stage2 || null,
      stage3: dbStage3 || staticContent?.stage3 || null,
      stage4: dbStage4 || staticContent?.stage4 || null,
      stage5: dbStage5 || staticContent?.stage5 || null,
    };
  } catch {
    return staticContent;
  }
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

  try {
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
        const legacyId = `${sub_level}-gt${topic_order}`;

        // Cache UUID while we're at it
        uuidCache.set(`${sub_level}:${slug}`, row.topic_id);

        progressMap[legacyId] = {
          completed: row.completed,
          progress: row.completed ? 100 : Math.round(((row.current_stage - 1) / 5) * 100),
          currentStage: row.current_stage,
          score: row.score || 0,
          completedAt: row.completed_at,
        };
      }
    });

    return progressMap;
  } catch {
    return {};
  }
}

/**
 * Save grammar progress to user_grammar_progress table.
 * Only works if the topic exists in grammar_topics (has a UUID).
 */
export async function saveUserGrammarProgress(userId, topicUUID, progressData) {
  if (!userId || !topicUUID) return;

  try {
    const upsertData = {
      user_id: userId,
      topic_id: topicUUID,
      current_stage: progressData.currentStage || 1,
      completed: progressData.completed || false,
      score: progressData.score || 0,
      last_accessed: new Date().toISOString(),
    };

    if (progressData.completed) {
      upsertData.completed_at = progressData.completedAt || new Date().toISOString();
    }

    await supabase
      .from('user_grammar_progress')
      .upsert(upsertData, { onConflict: 'user_id,topic_id' });
  } catch {
    // Silently fail - JSON blob is the primary store
  }
}
