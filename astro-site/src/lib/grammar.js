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
// Without the env var, acquire one complete live snapshot before any route is
// generated. All later reads use that snapshot, even if Supabase goes offline.
// ---------------------------------------------------------------------------
let contentCache;
let contentSnapshot;
function normalizeSnapshot(raw) {
  const topics = (raw.topics ?? [])
    .filter((t) => t.is_published === true)
    .map((t) => ({ ...t, sub_level: normalizeLevel(t.sub_level) }));
  const topicIds = new Set(topics.map((t) => t.id));
  return {
    topics,
    rules:     (raw.rules ?? []).filter((r) => topicIds.has(r.topic_id)),
    examples:  (raw.examples ?? []).filter((e) => topicIds.has(e.topic_id)),
    exercises: (raw.exercises ?? []).filter((e) => topicIds.has(e.topic_id)),
    dumpedAt:  raw.dumpedAt ?? null,
  };
}
function loadCacheFile(cachePath) {
  return normalizeSnapshot(JSON.parse(readFileSync(cachePath, 'utf8')));
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
// committed cache), so snapshot acquisition goes through `withFallback`:
// up to three attempts with backoff, and if the network still
// fails, the committed repo-root `grammar-content-cache.json` (the same file
// CI verifies) serves the whole build, loudly. A stale cache beats no deploy;
// the warning names the dump date so the next `dump-grammar-cache` run is
// visible in the build log.
// ---------------------------------------------------------------------------
const EMERGENCY_CACHE_URL = new URL('../../../grammar-content-cache.json', import.meta.url);
const FETCH_ATTEMPTS = 3;
const FETCH_PAGE_SIZE = 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function fetchSnapshotTable(table, topicIds) {
  const rows = [];
  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    let query = supabase.from(table).select('*').order('id')
      .range(from, from + FETCH_PAGE_SIZE - 1);
    query = table === 'grammar_topics'
      ? query.eq('is_published', true)
      : query.in('topic_id', topicIds);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) return rows;
  }
}

async function snapshotFromNetwork() {
  const topics = (await fetchSnapshotTable('grammar_topics'))
    .filter((t) => t.is_published === true);
  const topicIds = topics.map((t) => t.id);
  if (!topicIds.length) return normalizeSnapshot({ topics });
  const [rules, examples, exercises] = await Promise.all([
    fetchSnapshotTable('grammar_rules', topicIds),
    fetchSnapshotTable('grammar_examples', topicIds),
    fetchSnapshotTable('grammar_exercises', topicIds),
  ]);
  return normalizeSnapshot({ topics, rules, examples, exercises });
}

function getSnapshot() {
  contentSnapshot ??= withFallback('grammar snapshot', snapshotFromNetwork, (cache) => cache);
  return contentSnapshot;
}

/** Fetch every topic (slug + level) — used in getStaticPaths */
export async function getAllTopicPaths() {
  return (await getAllTopics()).map((t) => ({ slug: t.slug, sub_level: t.sub_level }));
}

/** Fetch all topics for a given level — used on level index pages */
export async function getTopicsForLevel(subLevel) {
  const snapshot = await getSnapshot();
  return snapshot.topics
    .filter((t) => t.sub_level === normalizeLevel(subLevel))
    .sort(byOrder('topic_order'));
}

/** Fetch all topics for all levels — used on the /grammar index */
export async function getAllTopics() {
  const snapshot = await getSnapshot();
  return snapshot.topics
    .slice()
    .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || (a.topic_order ?? 0) - (b.topic_order ?? 0));
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

function topicFullFromSnapshot(snapshot, subLevel, slug) {
    const level = normalizeLevel(subLevel);
    const topic = snapshot.topics.find((t) => t.sub_level === level && t.slug === slug);
    if (!topic) return null;

    const siblings = snapshot.topics
      .filter((t) => t.sub_level === level)
      .sort(byOrder('topic_order'));
    const idx = siblings.findIndex((t) => t.slug === slug);

    return {
      topic,
      rules:     snapshot.rules.filter((r) => r.topic_id === topic.id).sort(byOrder('order_index')),
      examples:  snapshot.examples.filter((e) => e.topic_id === topic.id).sort(byOrder('order_index')),
      exercises: normalizeExercises(snapshot.exercises.filter((e) => e.topic_id === topic.id).sort(byOrder('order_index'))),
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx !== -1 && idx < siblings.length - 1 ? siblings[idx + 1] : null,
    };
}

/** Fetch full topic data including rules, examples, exercises */
export async function getTopicFull(subLevel, slug) {
  return topicFullFromSnapshot(await getSnapshot(), subLevel, slug);
}

export { SUB_LEVELS };
