import { supabase } from '../utils/supabase';
import { getTopicContent as getStaticContent } from '../data/grammarContent';

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
    // Introduction fields (optional, added via migration)
    introductionEn: dbRow.introduction_en || null,
    introductionDe: dbRow.introduction_de || null,
    keyPoints: dbRow.key_points || null,
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

  // NEW FIELD: Detailed explanation of why the answer is correct
  if (dbRow.why_correct_en) {
    exercise.whyCorrect = {
      en: dbRow.why_correct_en,
      de: dbRow.why_correct_de || dbRow.why_correct_en,
    };
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
      // NEW FIELDS for rich format
      explanation: ex.explanation_en ? {
        en: ex.explanation_en,
        de: ex.explanation_de || ex.explanation_en,
      } : null,
      wordBreakdown: ex.word_breakdown || null,  // JSONB array
      difficulty: ex.difficulty || 1,  // 1=easy, 2=medium, 3=hard
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
        // NEW FIELDS
        keyInsight: rule.key_insight_en ? {
          en: rule.key_insight_en,
          de: rule.key_insight_de || rule.key_insight_en,
        } : null,
        commonMistakes: rule.common_mistakes || null,  // JSONB array
        memoryTrick: rule.memory_trick_en ? {
          en: rule.memory_trick_en,
          de: rule.memory_trick_de || rule.memory_trick_en,
        } : null,
        formalNote: rule.formal_note_en ? {
          en: rule.formal_note_en,
          de: rule.formal_note_de || rule.formal_note_en,
        } : null,
      });
    } else if (rule.rule_type === 'tip' || rule.rule_type === 'note') {
      tips.push({
        en: content.text_en || content.en || rule.title_en || '',
        de: content.text_de || content.de || rule.title_de || '',
        memoryTrick: rule.memory_trick_en ? {
          en: rule.memory_trick_en,
          de: rule.memory_trick_de || rule.memory_trick_en,
        } : null,
      });
    } else if (rule.rule_type === 'warning') {
      warnings.push({
        en: content.text_en || content.en || rule.title_en || '',
        de: content.text_de || content.de || rule.title_de || '',
      });
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

  // Step 1: Get topic data (including UUID)
  const topicData = await fetchTopicBySlug(level, slug);
  if (!topicData || !topicData.uuid) {
    console.error(`[grammarService] fetchTopicContent: NO topic found for "${level}/${slug}"`);
    return null;
  }

  const topicUUID = topicData.uuid;
  console.log(`[grammarService] fetchTopicContent: UUID="${topicUUID}", fetching content tables...`);

  // Step 2: Parallel fetch from all content tables (including new grammar_introductions)
  const [introRes, examplesRes, rulesRes, exercisesRes] = await Promise.all([
    supabase
      .from('grammar_introductions')
      .select('*')
      .eq('topic_id', topicUUID)
      .single(),
    supabase
      .from('grammar_examples')
      .select('*')
      .eq('topic_id', topicUUID)
      .order('difficulty', { ascending: true })  // Order by difficulty (1=easy, 3=hard)
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
    introduction: { found: !!introRes.data, error: introRes.error },
    examples: { count: examplesRes.data?.length ?? 0, error: examplesRes.error },
    rules: { count: rulesRes.data?.length ?? 0, error: rulesRes.error },
    exercises: { count: exercisesRes.data?.length ?? 0, error: exercisesRes.error },
  });

  // Log errors explicitly
  if (introRes.error && introRes.error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine (old format topics)
    console.error(`[grammarService] grammar_introductions ERROR:`, introRes.error);
  }
  if (examplesRes.error) console.error(`[grammarService] grammar_examples ERROR:`, examplesRes.error);
  if (rulesRes.error) console.error(`[grammarService] grammar_rules ERROR:`, rulesRes.error);
  if (exercisesRes.error) console.error(`[grammarService] grammar_exercises ERROR:`, exercisesRes.error);

  const examples = examplesRes.data || [];
  const rules = rulesRes.data || [];
  const exercises = exercisesRes.data || [];

  console.log(`[grammarService] fetchTopicContent counts: examples=${examples.length}, rules=${rules.length}, exercises=${exercises.length}`);

  if (examples.length === 0 && rules.length === 0 && exercises.length === 0) {
    console.warn(`[grammarService] fetchTopicContent: ALL content tables returned 0 rows for UUID="${topicUUID}". Will show introduction only. Check RLS policies or add content.`);
    // Continue anyway - we'll show at least the introduction stage
  }

  // Step 3: Transform
  const dbStage2 = buildStage2(examples);
  const dbStage3 = buildStage3(rules);
  const { stage4: dbStage4, stage5: dbStage5 } = buildExerciseStages(exercises);

  // Stage 1 (Introduction) - priority: grammar_introductions table > grammar_topics fields > static file > generated defaults
  const staticContent = getStaticContent(level, slug);
  const introData = introRes.data;
  let stage1Content = null;

  // DEBUG: Log what we received from grammar_introductions
  console.log(`[grammarService] DEBUG introData for ${slug}:`, {
    exists: !!introData,
    hasHookEn: !!introData?.hook_en,
    fullData: introData,
  });

  // Priority 1: Check if topic has rich introduction in grammar_introductions table (NEW FORMAT)
  if (introData && introData.hook_en) {
    console.log(`[grammarService] Using NEW FORMAT grammar_introductions for ${slug}`);
    stage1Content = {
      title: {
        en: topicData.titleEn,
        de: topicData.titleDe,
      },
      // New rich format
      hook: {
        en: introData.hook_en,
        de: introData.hook_de || introData.hook_en,
      },
      englishComparison: {
        en: introData.english_comparison_en,
        de: introData.english_comparison_de || introData.english_comparison_en,
      },
      germanDifference: {
        en: introData.german_difference_en,
        de: introData.german_difference_de || introData.german_difference_en,
      },
      previewExample: introData.preview_example_de ? {
        german: introData.preview_example_de,
        english: introData.preview_example_en,
        highlight: introData.preview_highlight,
      } : null,
      scenario: {
        en: introData.scenario_en,
        de: introData.scenario_de || introData.scenario_en,
      },
      whyItMatters: {
        en: introData.why_it_matters_en,
        de: introData.why_it_matters_de || introData.why_it_matters_en,
      },
    };
  }
  // Priority 2: Check if topic has introduction in grammar_topics table (OLD ENRICHED FORMAT)
  else if (topicData.introductionEn || topicData.introductionDe) {
    console.log(`[grammarService] Using grammar_topics introduction fields for ${slug}`, {
      hasIntroEn: !!topicData.introductionEn,
      hasIntroDe: !!topicData.introductionDe,
    });
    stage1Content = {
      title: {
        en: topicData.titleEn,
        de: topicData.titleDe,
      },
      introduction: {
        en: topicData.introductionEn || topicData.descriptionEn || `Learn about ${topicData.titleEn}.`,
        de: topicData.introductionDe || topicData.descriptionDe || `Lerne über ${topicData.titleDe}.`,
      },
      keyPoints: topicData.keyPoints || [],
    };
  }
  // Priority 3: Use static content if available
  else if (staticContent?.stage1) {
    console.log(`[grammarService] Using static grammarContent.js for ${slug}`);
    stage1Content = staticContent.stage1;
  }
  // Priority 4: Generate default from basic topic data
  else {
    console.log(`[grammarService] Generating fallback introduction for ${slug}`);
    stage1Content = {
      title: {
        en: topicData.titleEn,
        de: topicData.titleDe,
      },
      introduction: {
        en: topicData.descriptionEn || `Learn about ${topicData.titleEn} in German grammar.`,
        de: topicData.descriptionDe || `Lerne über ${topicData.titleDe} in der deutschen Grammatik.`,
      },
      keyPoints: [
        {
          en: `Understand the concept of ${topicData.titleEn}`,
          de: `Verstehe das Konzept von ${topicData.titleDe}`,
        },
        {
          en: 'Learn when and how to use it correctly',
          de: 'Lerne, wann und wie man es richtig verwendet',
        },
        {
          en: 'Practice with real examples',
          de: 'Übe mit echten Beispielen',
        },
      ],
    };
  }

  const result = {
    stage1: stage1Content,
    stage2: dbStage2,
    stage3: dbStage3,
    stage4: dbStage4,
    stage5: dbStage5,
  };

  console.log(`[grammarService] fetchTopicContent FINAL:`, {
    stage1: result.stage1 ? (staticContent?.stage1 ? 'from static' : 'default from topic data') : 'null',
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
