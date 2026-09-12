#!/usr/bin/env node
// Builds src/data/lessonPools/<level>.json from grammar-content-cache.json:
// the level's grammar exercises, keyed by topic slug, trimmed to what the
// lesson engine needs. Re-run after refreshing the cache. Usage:
//   node scripts/build-lesson-pool.mjs a1.1
import { readFileSync, writeFileSync } from 'node:fs';

const level = (process.argv[2] || 'a1.1').toLowerCase();
const cache = JSON.parse(readFileSync(new URL('../grammar-content-cache.json', import.meta.url), 'utf8'));
const topics = cache.topics.filter((t) => t.sub_level === level.toUpperCase());
const byId = new Map(topics.map((t) => [t.id, t]));
const items = cache.exercises
  .filter((e) => byId.has(e.topic_id))
  .map((e) => ({
    id: e.id,
    topic: byId.get(e.topic_id).slug,
    type: e.exercise_type,
    stage: e.stage,
    difficulty: e.difficulty ?? 1,
    order: e.order_index ?? 0,
    questionDe: e.question_de,
    questionEn: e.question_en,
    options: Array.isArray(e.options) && e.options.length ? e.options : null,
    answer: e.correct_answer,
    accepted: Array.isArray(e.acceptable_answers) ? e.acceptable_answers : [],
    explanationDe: e.explanation_de || e.why_correct_de || '',
    hint: e.hint || null,
  }))
  .sort((a, b) => a.topic.localeCompare(b.topic) || a.stage - b.stage || a.order - b.order);
const out = { level, builtFrom: cache.dumpedAt, count: items.length, items };
const target = new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url);
writeFileSync(target, JSON.stringify(out, null, 1) + '\n');
console.log(`${level}: ${items.length} exercises → ${target.pathname}`);
