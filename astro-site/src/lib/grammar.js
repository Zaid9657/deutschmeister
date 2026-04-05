import { supabase } from './supabase.js';

const SUB_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

export const LEVEL_META = {
  'a1.1': { label: 'A1.1', name: 'Sunrise Warmth I',     color: 'from-amber-400 to-orange-400',  bg: 'bg-amber-50',   border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-800' },
  'a1.2': { label: 'A1.2', name: 'Sunrise Warmth II',    color: 'from-amber-500 to-rose-400',    bg: 'bg-rose-50',    border: 'border-rose-200',   badge: 'bg-rose-100 text-rose-800'   },
  'a2.1': { label: 'A2.1', name: 'Forest Calm I',        color: 'from-emerald-400 to-teal-400',  bg: 'bg-emerald-50', border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-800' },
  'a2.2': { label: 'A2.2', name: 'Forest Calm II',       color: 'from-emerald-500 to-green-500', bg: 'bg-green-50',   border: 'border-green-200',  badge: 'bg-green-100 text-green-800' },
  'b1.1': { label: 'B1.1', name: 'Ocean Depth I',        color: 'from-blue-400 to-indigo-400',   bg: 'bg-blue-50',    border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800'   },
  'b1.2': { label: 'B1.2', name: 'Ocean Depth II',       color: 'from-blue-500 to-indigo-600',   bg: 'bg-indigo-50',  border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800'},
  'b2.1': { label: 'B2.1', name: 'Twilight Elegance I',  color: 'from-purple-400 to-pink-400',   bg: 'bg-purple-50',  border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800'},
  'b2.2': { label: 'B2.2', name: 'Twilight Elegance II', color: 'from-purple-600 to-indigo-600', bg: 'bg-violet-50',  border: 'border-violet-200', badge: 'bg-violet-100 text-violet-800'},
};

/** Fetch every topic (slug + level) — used in getStaticPaths */
export async function getAllTopicPaths() {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('slug, sub_level')
    .order('sub_level')
    .order('topic_order');

  if (error) throw new Error(`getAllTopicPaths: ${error.message}`);
  return data ?? [];
}

/** Fetch all topics for a given level — used on level index pages */
export async function getTopicsForLevel(subLevel) {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('id, slug, title_en, title_de, description_en, description_de, topic_order')
    .eq('sub_level', subLevel)
    .order('topic_order');

  if (error) throw new Error(`getTopicsForLevel(${subLevel}): ${error.message}`);
  return data ?? [];
}

/** Fetch all topics for all levels — used on the /grammar index */
export async function getAllTopics() {
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('id, slug, title_en, title_de, description_en, sub_level, topic_order')
    .order('sub_level')
    .order('topic_order');

  if (error) throw new Error(`getAllTopics: ${error.message}`);
  return data ?? [];
}

/** Fetch full topic data including rules, examples, exercises */
export async function getTopicFull(subLevel, slug) {
  // 1. Topic
  const { data: topic, error: topicErr } = await supabase
    .from('grammar_topics')
    .select('*')
    .eq('sub_level', subLevel)
    .eq('slug', slug)
    .single();

  if (topicErr) throw new Error(`getTopicFull topic(${subLevel}/${slug}): ${topicErr.message}`);
  if (!topic) return null;

  // 2. Rules, examples, exercises — parallel fetch
  const [rulesRes, examplesRes, exercisesRes] = await Promise.all([
    supabase
      .from('grammar_rules')
      .select('*')
      .eq('topic_id', topic.id)
      .order('order_index'),
    supabase
      .from('grammar_examples')
      .select('*')
      .eq('topic_id', topic.id)
      .order('order_index'),
    supabase
      .from('grammar_exercises')
      .select('*')
      .eq('topic_id', topic.id)
      .order('order_index'),
  ]);

  if (rulesRes.error)     throw new Error(`rules: ${rulesRes.error.message}`);
  if (examplesRes.error)  throw new Error(`examples: ${examplesRes.error.message}`);
  if (exercisesRes.error) throw new Error(`exercises: ${exercisesRes.error.message}`);

  // 3. Adjacent topics for prev/next navigation
  const { data: siblings } = await supabase
    .from('grammar_topics')
    .select('slug, title_en, topic_order')
    .eq('sub_level', subLevel)
    .order('topic_order');

  const idx = (siblings ?? []).findIndex(t => t.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx !== -1 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return {
    topic,
    rules:     rulesRes.data     ?? [],
    examples:  examplesRes.data  ?? [],
    exercises: exercisesRes.data ?? [],
    prev,
    next,
  };
}

export { SUB_LEVELS };
