import { supabase } from '../utils/supabase';
import { getTopicContent as getStaticContent } from '../data/grammarContent';

// ==========================================
// Helpers
// ==========================================

/** Convert app-level (a1.1) to DB sub_level (A1.1) */
const toDbLevel = (level) => level.toUpperCase();

/** Convert DB sub_level (A1.1) to app-level (a1.1) */
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
    console.log(`[grammarService] lookupTopicUUID cache hit: ${cacheKey} →`, uuidCache.get(cacheKey));
    return uuidCache.get(cacheKey);
  }

  const dbLevel = toDbLevel(level);
  console.log(`[grammarService] lookupTopicUUID querying: sub_level="${dbLevel}", slug="${slug}"`);
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('id')
    .eq('sub_level', dbLevel)
    .eq('slug', slug)
    .single();

  console.log(`[grammarService] lookupTopicUUID result:`, { data, error });

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
    // correct_answer may be a numeric index OR the text of the correct option
    const parsed = parseInt(dbRow.correct_answer, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < exercise.options.length) {
      exercise.correct = parsed;
    } else {
      // Match the text against options (case-insensitive, trimmed)
      const needle = String(dbRow.correct_answer).trim().toLowerCase();
      const idx = exercise.options.findIndex(
        opt => String(opt).trim().toLowerCase() === needle
      );
      exercise.correct = idx >= 0 ? idx : 0;
      console.log(`[grammarService] MC correct_answer="${dbRow.correct_answer}" → matched option index ${idx}`);
    }
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

  console.log(`[grammarService] buildStage2: ${examples.length} examples, sample:`, examples[0]);

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

  console.log(`[grammarService] buildStage3: ${rules.length} rules`);

  const tables = [];
  const tips = [];
  const warnings = [];

  rules.forEach((rule, i) => {
    const content = rule.content || {};
    console.log(`[grammarService] rule[${i}]: type="${rule.rule_type}", title="${rule.title_en}", content=`, content);

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
      tips.push({ en: content.text_en || content.en || rule.title_en || '', de: content.text_de || content.de || rule.title_de || '' });
    } else if (rule.rule_type === 'warning') {
      warnings.push({ en: content.text_en || content.en || rule.title_en || '', de: content.text_de || content.de || rule.title_de || '' });
    } else {
      console.warn(`[grammarService] UNKNOWN rule_type: "${rule.rule_type}"`);
    }
  });

  console.log(`[grammarService] buildStage3 output: ${tables.length} tables, ${tips.length} tips, ${warnings.length} warnings`);

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

  console.log(`[grammarService] buildExerciseStages: ${(exercises || []).length} exercises`);

  (exercises || []).forEach((ex, i) => {
    console.log(`[grammarService] exercise[${i}]: stage=${ex.stage} (${typeof ex.stage}), type="${ex.exercise_type}"`);
    const mapped = mapDbExerciseToApp(ex);
    if (ex.stage === 4) {
      stage4Exercises.push(mapped);
    } else if (ex.stage === 5) {
      stage5Exercises.push(mapped);
    } else {
      console.warn(`[grammarService] exercise[${i}] UNEXPECTED stage: ${ex.stage} (type: ${typeof ex.stage})`);
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
// Public API — Supabase only, NO static fallback
// ==========================================

/**
 * Fetch topics for a level from Supabase only.
 * Returns empty array if nothing found.
 */
export async function fetchTopicsForLevel(level) {
  const dbLevel = toDbLevel(level);
  console.log(`[grammarService] fetchTopicsForLevel: level="${level}" → DB sub_level="${dbLevel}"`);

  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('sub_level', dbLevel)
    .order('topic_order');

  console.log(`[grammarService] fetchTopicsForLevel result:`, {
    rowCount: data?.length ?? 0,
    error,
    firstRow: data?.[0] ?? null,
  });

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

/**
 * Fetch a single topic by slug from Supabase only.
 * Returns null if not found.
 */
export async function fetchTopicBySlug(level, slug) {
  const dbLevel = toDbLevel(level);
  console.log(`[grammarService] fetchTopicBySlug: level="${level}" → DB sub_level="${dbLevel}", slug="${slug}"`);

  const { data, error } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('sub_level', dbLevel)
    .eq('slug', slug)
    .single();

  console.log(`[grammarService] fetchTopicBySlug result:`, { data, error });

  if (error) {
    console.error(`[grammarService] fetchTopicBySlug ERROR:`, error);
    return null;
  }

  if (!data) {
    console.warn(`[grammarService] fetchTopicBySlug: NOT FOUND in Supabase`);
    return null;
  }

  uuidCache.set(`${level}:${slug}`, data.id);
  return mapDbTopicToApp(data);
}

/**
 * Fetch full content for a topic (all 5 stages) from Supabase only.
 * Returns null if topic not found or content tables empty.
 */
export async function fetchTopicContent(level, slug) {
  console.log(`[grammarService] fetchTopicContent: level="${level}", slug="${slug}"`);

  // Step 1: Get topic UUID
  const topicUUID = await lookupTopicUUID(level, slug);
  if (!topicUUID) {
    console.error(`[grammarService] fetchTopicContent: NO UUID for "${level}/${slug}" — topic not in grammar_topics table`);
    return null;
  }

  console.log(`[grammarService] fetchTopicContent: UUID="${topicUUID}", fetching content tables...`);

  // Step 2: Parallel fetch from all content tables
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

  console.log(`[grammarService] fetchTopicContent RAW RESPONSES:`, {
    examples: { count: examplesRes.data?.length ?? 0, error: examplesRes.error },
    rules: { count: rulesRes.data?.length ?? 0, error: rulesRes.error },
    exercises: { count: exercisesRes.data?.length ?? 0, error: exercisesRes.error },
  });

  // Log errors explicitly
  if (examplesRes.error) console.error(`[grammarService] grammar_examples ERROR:`, examplesRes.error);
  if (rulesRes.error) console.error(`[grammarService] grammar_rules ERROR:`, rulesRes.error);
  if (exercisesRes.error) console.error(`[grammarService] grammar_exercises ERROR:`, exercisesRes.error);

  const examples = examplesRes.data || [];
  const rules = rulesRes.data || [];
  const exercises = exercisesRes.data || [];

  console.log(`[grammarService] fetchTopicContent counts: examples=${examples.length}, rules=${rules.length}, exercises=${exercises.length}`);

  if (examples.length === 0 && rules.length === 0 && exercises.length === 0) {
    console.warn(`[grammarService] fetchTopicContent: ALL content tables returned 0 rows for UUID="${topicUUID}". Possible RLS issue or no content.`);
    return null;
  }

  // Step 3: Transform
  const dbStage2 = buildStage2(examples);
  const dbStage3 = buildStage3(rules);
  const { stage4: dbStage4, stage5: dbStage5 } = buildExerciseStages(exercises);

  // Stage 1 (Introduction) has no DB table — use static data
  const staticContent = getStaticContent(level, slug);

  const result = {
    stage1: staticContent?.stage1 || null,
    stage2: dbStage2,
    stage3: dbStage3,
    stage4: dbStage4,
    stage5: dbStage5,
  };

  console.log(`[grammarService] fetchTopicContent FINAL:`, {
    stage1: result.stage1 ? 'from static' : 'null (no static data either)',
    stage2: dbStage2 ? `${dbStage2.examples.length} examples` : 'null',
    stage3: dbStage3 ? `${dbStage3.tables.length}t/${dbStage3.tips.length}tip/${dbStage3.warnings.length}w` : 'null',
    stage4: dbStage4 ? `${dbStage4.exercises.length} exercises` : 'null',
    stage5: dbStage5 ? `${dbStage5.exercises.length} exercises` : 'null',
  });

  return result;
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

  console.log(`[grammarService] loadUserGrammarProgress: userId="${userId}"`);
  const { data, error } = await supabase
    .from('user_grammar_progress')
    .select('*, grammar_topics(slug, sub_level, topic_order)')
    .eq('user_id', userId);

  console.log(`[grammarService] loadUserGrammarProgress result:`, { count: data?.length, error });

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
  } catch (err) {
    console.error(`[grammarService] saveUserGrammarProgress error:`, err);
  }
}
