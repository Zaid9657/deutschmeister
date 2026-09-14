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
function loadCacheFile(cachePath) {
  const raw = JSON.parse(readFileSync(cachePath, 'utf8'));
  return {
    topics:    (raw.topics    ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) })),
    rules:     raw.rules      ?? [],
    examples:  raw.examples   ?? [],
    exercises: raw.exercises  ?? [],
    dumpedAt:  raw.dumpedAt ?? null,
  };
}
function getCache() {
  if (contentCache !== undefined) return contentCache;
  const cachePath = process.env.GRAMMAR_CONTENT_CACHE;
  if (!cachePath) { contentCache = null; return contentCache; }
  try {
    contentCache = loadCacheFile(cachePath);
    console.log(`[grammar] Using content cache ${cachePath}: ${contentCache.topics.length} topics`);
  } catch (err) {
    console.error(`[grammar] Failed to load GRAMMAR_CONTENT_CACHE (${cachePath}): ${err.message}`);
    contentCache = null;
  }
  return contentCache;
}

// ---------------------------------------------------------------------------
// Network resilience (2026-09-14). Two production deploys in one day died in
// `getTopicsForLevel(a1.1): TypeError: fetch failed` — once because the Supabase
// project had been paused, once right after it was restored. The build-time
// fetch is a hard dependency the CI never exercises (CI builds from the
// committed cache), so every Supabase read below now goes through
// `withFallback`: up to three attempts with backoff, and if the network still
// fails, the committed repo-root `grammar-content-cache.json` (the same file
// CI verifies) serves the whole build, loudly. A stale cache beats no deploy;
// the warning names the dump date so the next `dump-grammar-cache` run is
// visible in the build log.
// ---------------------------------------------------------------------------
const EMERGENCY_CACHE_URL = new URL('../../../grammar-content-cache.json', import.meta.url);
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 12_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const requestTimeout = () => AbortSignal.timeout(FETCH_TIMEOUT_MS);
const withRequestTimeout = (query) => query.abortSignal(requestTimeout());

function useEmergencyCache(label, err) {
  if (contentCache) return contentCache;
  try {
    contentCache = loadCacheFile(EMERGENCY_CACHE_URL);
  } catch (cacheErr) {
    console.error(`[grammar] ${label}: network failed (${err.message}) and the emergency cache could not be read (${cacheErr.message})`);
    throw err;
  }
  console.error(
    `[grammar] ${label}: Supabase unreachable after ${FETCH_ATTEMPTS} attempts (${err.message}). ` +
    `SERVING THE WHOLE BUILD FROM grammar-content-cache.json (dumped ${contentCache.dumpedAt ?? 'unknown'}, ` +
    `${contentCache.topics.length} topics). Check the Supabase project status and re-dump the cache.`
  );
  return contentCache;
}

async function withFallback(label, fromNetwork, fromCache) {
  const cache = getCache();
  if (cache) return fromCache(cache);
  let lastErr;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      return await fromNetwork();
    } catch (err) {
      lastErr = err;
      if (attempt < FETCH_ATTEMPTS) {
        const wait = 2000 * attempt;
        console.warn(`[grammar] ${label}: attempt ${attempt} failed (${err.message}), retrying in ${wait / 1000}s…`);
        await sleep(wait);
      }
    }
  }
  return fromCache(useEmergencyCache(label, lastErr));
}

const byOrder = (key) => (a, b) => (a[key] ?? 0) - (b[key] ?? 0);

export const LEVEL_META = {
  'a1.1': { label: 'A1.1', name: 'Sunrise Warmth I' },
  'a1.2': { label: 'A1.2', name: 'Sunrise Warmth II'   },
  'a2.1': { label: 'A2.1', name: 'Forest Calm I' },
  'a2.2': { label: 'A2.2', name: 'Forest Calm II' },
  'b1.1': { label: 'B1.1', name: 'Ocean Depth I'   },
  'b1.2': { label: 'B1.2', name: 'Ocean Depth II'},
  'b2.1': { label: 'B2.1', name: 'Twilight Elegance I'},
  'b2.2': { label: 'B2.2', name: 'Twilight Elegance II'},
};

// Supabase stores sub_level as "A1.1" (uppercase). All our routing and
// LEVEL_META keys use lowercase. Normalize at the boundary so the rest
// of the code never has to worry about case.
const normalizeLevel = (level) => level?.toLowerCase() ?? level;

/** Fetch every topic (slug + level) — used in getStaticPaths */
async function fetchTopicPaths() {
  // Connectivity diagnostic — visible in Netlify build logs
  try {
    const diagBase = import.meta.env.PUBLIC_SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
    const diagUrl = `${diagBase}/rest/v1/grammar_topics?select=count&limit=1`;
    const diagKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    console.log('[grammar] Testing Supabase connectivity:', diagUrl);
    const diagResp = await fetch(diagUrl, {
      headers: { apikey: diagKey ?? '', Authorization: `Bearer ${diagKey ?? ''}` },
      signal: requestTimeout(),
    });
    console.log('[grammar] Supabase test response status:', diagResp.status);
  } catch (diagErr) {
    console.error('[grammar] Raw fetch test FAILED:', diagErr.message, diagErr.cause?.code);
  }

  const { data, error } = await withRequestTimeout(supabase
    .from('grammar_topics')
    .select('slug, sub_level')
    .order('sub_level')
    .order('topic_order'));

  if (error) throw new Error(`getAllTopicPaths: ${error.message}`);
  return (data ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
}

export async function getAllTopicPaths() {
  return withFallback('getAllTopicPaths', fetchTopicPaths, (cache) =>
    cache.topics
      .slice()
      .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || (a.topic_order ?? 0) - (b.topic_order ?? 0))
      .map((t) => ({ slug: t.slug, sub_level: t.sub_level })));
}

/** Fetch all topics for a given level — used on level index pages */
export async function getTopicsForLevel(subLevel) {
  return withFallback(`getTopicsForLevel(${subLevel})`, async () => {
    // Query using ilike so it matches regardless of case stored in DB
    const { data, error } = await withRequestTimeout(supabase
      .from('grammar_topics')
      .select('id, slug, title_en, title_de, description_en, description_de, topic_order, updated_at')
      .ilike('sub_level', subLevel)
      .order('topic_order'));

    if (error) throw new Error(`getTopicsForLevel(${subLevel}): ${error.message}`);
    return (data ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
  }, (cache) =>
    cache.topics
      .filter((t) => t.sub_level === normalizeLevel(subLevel))
      .sort(byOrder('topic_order')));
}

/** Fetch all topics for all levels — used on the /grammar index */
export async function getAllTopics() {
  return withFallback('getAllTopics', async () => {
    const { data, error } = await withRequestTimeout(supabase
      .from('grammar_topics')
      .select('id, slug, title_en, title_de, description_en, sub_level, topic_order, updated_at')
      .order('sub_level')
      .order('topic_order'));

    if (error) throw new Error(`getAllTopics: ${error.message}`);
    return (data ?? []).map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
  }, (cache) =>
    cache.topics
      .slice()
      .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || (a.topic_order ?? 0) - (b.topic_order ?? 0)));
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

function topicFullFromCache(cache, subLevel, slug) {
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

async function topicFullFromNetwork(subLevel, slug) {
  // 1. Topic — use ilike so "a1.1" matches "A1.1" in the DB
  const { data: topic, error: topicErr } = await withRequestTimeout(supabase
    .from('grammar_topics')
    .select('*')
    .ilike('sub_level', subLevel)
    .eq('slug', slug)
    .single());

  if (topicErr) throw new Error(`getTopicFull topic(${subLevel}/${slug}): ${topicErr.message}`);
  if (!topic) return null;

  // Normalize the level on the topic itself
  topic.sub_level = normalizeLevel(topic.sub_level);

  // 2. Rules, examples, exercises — parallel fetch
  const [rulesRes, examplesRes, exercisesRes] = await Promise.all([
    withRequestTimeout(supabase
      .from('grammar_rules')
      .select('*')
      .eq('topic_id', topic.id)
      .order('order_index')),
    withRequestTimeout(supabase
      .from('grammar_examples')
      .select('*')
      .eq('topic_id', topic.id)
      .order('order_index')),
    withRequestTimeout(supabase
      .from('grammar_exercises')
      .select('*')
      .eq('topic_id', topic.id)
      .order('order_index')),
  ]);

  if (rulesRes.error)     throw new Error(`rules: ${rulesRes.error.message}`);
  if (examplesRes.error)  throw new Error(`examples: ${examplesRes.error.message}`);
  if (exercisesRes.error) throw new Error(`exercises: ${exercisesRes.error.message}`);

  const exercises_normalized = normalizeExercises(exercisesRes.data);

  // 3. Adjacent topics for prev/next navigation
  const { data: siblings } = await withRequestTimeout(supabase
    .from('grammar_topics')
    .select('slug, title_en, topic_order')
    .ilike('sub_level', subLevel)
    .order('topic_order'));

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

/** Fetch full topic data including rules, examples, exercises */
export async function getTopicFull(subLevel, slug) {
  return withFallback(`getTopicFull(${subLevel}/${slug})`,
    () => topicFullFromNetwork(subLevel, slug),
    (cache) => topicFullFromCache(cache, subLevel, slug));
}

export { SUB_LEVELS };
