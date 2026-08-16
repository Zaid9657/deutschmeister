import { readFileSync } from 'node:fs';
import { supabase } from './supabase.js';

const SUB_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

// ---------------------------------------------------------------------------
// Optional offline content cache.
//
// When GRAMMAR_CONTENT_CACHE points at a JSON file of shape
//   { topics: [...], rules: [...], examples: [...], exercises: [...] }
// (full rows, same columns as the Supabase tables — see
// scripts/dump-grammar-cache.mjs), every function below serves from it and no
// Supabase request is made. This lets the Astro site build in environments
// without Supabase egress (CI, sandboxes) and can act as an outage fallback.
// Without the env var, behavior is exactly as before.
// ---------------------------------------------------------------------------
let contentCache;
function getCache() {
  if (contentCache !== undefined) return contentCache;
  const cachePath = process.env.GRAMMAR_CONTENT_CACHE;
  if (!cachePath) { contentCache = null; return contentCache; }
  try {
    const raw = JSON.parse(readFileSync(cachePath, 'utf8'));
    contentCache = {
      topics:    (raw.topics    ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) })),
      rules:     raw.rules      ?? [],
      examples:  raw.examples   ?? [],
      exercises: raw.exercises  ?? [],
    };
    console.log(`[grammar] Using content cache ${cachePath}: ${contentCache.topics.length} topics`);
  } catch (err) {
    console.error(`[grammar] Failed to load GRAMMAR_CONTENT_CACHE (${cachePath}): ${err.message}`);
    contentCache = null;
  }
  return contentCache;
}

const byOrder = (key) => (a, b) => (a[key] ?? 0) - (b[key] ?? 0);

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

// Supabase stores sub_level as "A1.1" (uppercase). All our routing and
// LEVEL_META keys use lowercase. Normalize at the boundary so the rest
// of the code never has to worry about case.
const normalizeLevel = (level) => level?.toLowerCase() ?? level;

/** Fetch every topic (slug + level) — used in getStaticPaths */
async function fetchTopicPaths() {
  // Connectivity diagnostic — visible in Netlify build logs
  try {
    const diagUrl = `https://omqyueddktqeyrrqvnyq.supabase.co/rest/v1/grammar_topics?select=count&limit=1`;
    const diagKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    console.log('[grammar] Testing Supabase connectivity:', diagUrl);
    const diagResp = await fetch(diagUrl, {
      headers: { apikey: diagKey ?? '', Authorization: `Bearer ${diagKey ?? ''}` },
    });
    console.log('[grammar] Supabase test response status:', diagResp.status);
  } catch (diagErr) {
    console.error('[grammar] Raw fetch test FAILED:', diagErr.message, diagErr.cause?.code);
  }

  const { data, error } = await supabase
    .from('grammar_topics')
    .select('slug, sub_level')
    .order('sub_level')
    .order('topic_order');

  if (error) throw new Error(`getAllTopicPaths: ${error.message}`);
  return (data ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
}

export async function getAllTopicPaths() {
  const cache = getCache();
  if (cache) {
    return cache.topics
      .slice()
      .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || (a.topic_order ?? 0) - (b.topic_order ?? 0))
      .map((t) => ({ slug: t.slug, sub_level: t.sub_level }));
  }
  try {
    return await fetchTopicPaths();
  } catch (err) {
    if (err.message?.includes('fetch failed') || err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.warn('getAllTopicPaths: fetch failed, retrying in 3s…', err.message);
      await new Promise((r) => setTimeout(r, 3000));
      return await fetchTopicPaths();
    }
    throw err;
  }
}

/** Fetch all topics for a given level — used on level index pages */
export async function getTopicsForLevel(subLevel) {
  const cache = getCache();
  if (cache) {
    return cache.topics
      .filter((t) => t.sub_level === normalizeLevel(subLevel))
      .sort(byOrder('topic_order'));
  }
  // Query using ilike so it matches regardless of case stored in DB
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('id, slug, title_en, title_de, description_en, description_de, topic_order')
    .ilike('sub_level', subLevel)
    .order('topic_order');

  if (error) throw new Error(`getTopicsForLevel(${subLevel}): ${error.message}`);
  return (data ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
}

/** Fetch all topics for all levels — used on the /grammar index */
export async function getAllTopics() {
  const cache = getCache();
  if (cache) {
    return cache.topics
      .slice()
      .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || (a.topic_order ?? 0) - (b.topic_order ?? 0));
  }
  const { data, error } = await supabase
    .from('grammar_topics')
    .select('id, slug, title_en, title_de, description_en, sub_level, topic_order')
    .order('sub_level')
    .order('topic_order');

  if (error) throw new Error(`getAllTopics: ${error.message}`);
  return (data ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
}

// Options/correct_answer may arrive as JSON strings or {label,value} objects;
// flatten to plain string arrays (shared by the network and cache paths).
function normalizeExercises(list) {
  return (list ?? []).map((ex) => {
    let options = ex.options;
    if (typeof options === 'string') {
      try { options = JSON.parse(options); } catch { options = []; }
    }
    if (!Array.isArray(options)) options = [];
    options = options.map((o) => (typeof o === 'string' ? o : (o?.label ?? o?.value ?? String(o))));
    return { ...ex, options, correct_answer: ex.correct_answer ?? '' };
  });
}

/** Fetch full topic data including rules, examples, exercises */
export async function getTopicFull(subLevel, slug) {
  const cache = getCache();
  if (cache) {
    const level = normalizeLevel(subLevel);
    const topic = cache.topics.find((t) => t.sub_level === level && t.slug === slug);
    if (!topic) return null;

    const siblings = cache.topics
      .filter((t) => t.sub_level === level)
      .sort(byOrder('topic_order'));
    const idx = siblings.findIndex((t) => t.slug === slug);

    return {
      topic,
      rules:     cache.rules.filter((r) => r.topic_id === topic.id).sort(byOrder('order_index')),
      examples:  cache.examples.filter((e) => e.topic_id === topic.id).sort(byOrder('order_index')),
      exercises: normalizeExercises(cache.exercises.filter((e) => e.topic_id === topic.id).sort(byOrder('order_index'))),
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx !== -1 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
    };
  }
  // 1. Topic — use ilike so "a1.1" matches "A1.1" in the DB
  const { data: topic, error: topicErr } = await supabase
    .from('grammar_topics')
    .select('*')
    .ilike('sub_level', subLevel)
    .eq('slug', slug)
    .single();

  if (topicErr) throw new Error(`getTopicFull topic(${subLevel}/${slug}): ${topicErr.message}`);
  if (!topic) return null;

  // Normalize the level on the topic itself
  topic.sub_level = normalizeLevel(topic.sub_level);

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

  const exercises_normalized = normalizeExercises(exercisesRes.data);

  // 3. Adjacent topics for prev/next navigation
  const { data: siblings } = await supabase
    .from('grammar_topics')
    .select('slug, title_en, topic_order')
    .ilike('sub_level', subLevel)
    .order('topic_order');

  const idx = (siblings ?? []).findIndex(t => t.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx !== -1 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return {
    topic,
    rules:     rulesRes.data       ?? [],
    examples:  examplesRes.data    ?? [],
    exercises: exercises_normalized,
    prev,
    next,
  };
}

export { SUB_LEVELS };
