// A2 bank supply, measured on the committed cache (A2 scout, 2026-10-17). READ-ONLY.
//
// Usage: node bank.mjs <grammar-content-cache.json> <quality.js> [out.json]
//
// - Level of an exercise = the `sub_level` of its topic (exercises carry only `topic_id`).
// - Rows are mapped to pool items EXACTLY like scripts/build-lesson-pool.mjs (A1.2 HEAD 662ffa2,
//   lines 144-166), then run through quality.js `filterPool(items, { level })` with the topic's own
//   level lower-cased (a2.1 / a2.2). This is the RAW gate: the builder's repairs (verb cue, article
//   cue, ambiguous correction, determiner cue, and the A1.2-only determinacy repairs) run before the
//   gate and can rescue some items; build-sandbox.mjs measures the repaired figure.
// - "typed" = buildLesson.js isTypedItem: sentence_building, error_correction, or a fill_blank
//   without options.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const [cachePath, qualityPath, outPath] = process.argv.slice(2);
if (!cachePath || !qualityPath) {
  console.error('usage: node bank.mjs <cache.json> <quality.js> [out.json]');
  process.exit(2);
}
const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
const quality = await import(pathToFileURL(qualityPath).href);

const isTypedItem = (it) =>
  it.type === 'sentence_building' ||
  it.type === 'error_correction' ||
  (it.type === 'fill_blank' && !(it.options && it.options.length));
const shapeOf = (it) => (it.type === 'fill_blank' ? (it.options && it.options.length ? 'fill_blank+options' : 'fill_blank typed') : it.type);

// ── Part A: the landscape, every sub_level ────────────────────────────────
const topicById = new Map(cache.topics.map((t) => [t.id, t]));
const landscape = {};
const bump = (lvl, key) => {
  landscape[lvl] ??= { topics: 0, published: 0, exercises: 0, rules: 0, examples: 0 };
  landscape[lvl][key] += 1;
};
for (const t of cache.topics) { bump(t.sub_level, 'topics'); if (t.is_published) bump(t.sub_level, 'published'); }
let orphans = 0;
for (const e of cache.exercises) { const t = topicById.get(e.topic_id); if (!t) { orphans += 1; continue; } bump(t.sub_level, 'exercises'); }
for (const r of cache.rules) { const t = topicById.get(r.topic_id); if (t) bump(t.sub_level, 'rules'); }
for (const x of cache.examples) { const t = topicById.get(x.topic_id); if (t) bump(t.sub_level, 'examples'); }

// ── Part B + C: A2 topics, mapped like the builder, gated like the builder ───
const A2 = /^A2/i;
const a2Topics = cache.topics.filter((t) => A2.test(t.sub_level))
  .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || (a.topic_order ?? 0) - (b.topic_order ?? 0));
const toItem = (e, t) => ({
  id: e.id,
  topic: t.slug,
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
  explanationEn: e.explanation_en || e.why_correct_en || '',
  hint: e.hint || null,
});

const rows = [];
const levelTotals = {};
const reasonTotals = {};
for (const t of a2Topics) {
  const level = t.sub_level.toLowerCase();
  const items = cache.exercises.filter((e) => e.topic_id === t.id).map((e) => toItem(e, t));
  const { kept, counts } = quality.filterPool(items, { level });
  const shapes = {};
  for (const it of items) shapes[shapeOf(it)] = (shapes[shapeOf(it)] || 0) + 1;
  const stages = {};
  for (const it of items) stages[it.stage] = (stages[it.stage] || 0) + 1;
  const reasons = Object.fromEntries(Object.entries(counts).filter(([, n]) => n));
  for (const [r, n] of Object.entries(reasons)) {
    reasonTotals[level] ??= {};
    reasonTotals[level][r] = (reasonTotals[level][r] || 0) + n;
  }
  const typedRaw = items.filter(isTypedItem).length;
  const typedKept = kept.filter(isTypedItem).length;
  const mcKept = kept.filter((it) => it.type === 'multiple_choice').length;
  const dupPrompts = items.length - new Set(items.map((it) => `${it.questionDe}|${it.answer}`)).size;
  const row = {
    level: t.sub_level, order: t.topic_order, slug: t.slug, titleEn: t.title_en, titleDe: t.title_de,
    published: t.is_published, prerequisites: t.prerequisite_slugs || [],
    rules: cache.rules.filter((r) => r.topic_id === t.id).length,
    examples: cache.examples.filter((x) => x.topic_id === t.id).length,
    raw: items.length, typedRaw, usable: kept.length, typedUsable: typedKept, mcUsable: mcKept,
    shapes, stages, reasons, dupPrompts,
  };
  rows.push(row);
  levelTotals[t.sub_level] ??= { topics: 0, raw: 0, typedRaw: 0, usable: 0, typedUsable: 0, mcUsable: 0, shapes: {} };
  const lt = levelTotals[t.sub_level];
  lt.topics += 1; lt.raw += row.raw; lt.typedRaw += typedRaw; lt.usable += row.usable; lt.typedUsable += typedKept; lt.mcUsable += mcKept;
  for (const [s, n] of Object.entries(shapes)) lt.shapes[s] = (lt.shapes[s] || 0) + n;
}

// Two attempts of 7 with PRIMARY_MIN 4 on the primary slug and no repeat across attempts:
//   ≥14 usable → the topic alone fills both sittings; 8–13 → carries PRIMARY_MIN in both;
//   4–7 → PRIMARY_MIN in attempt 1 only; 1–3 → below PRIMARY_MIN; 0 → none.
const verdict = (n) => (n >= 14 ? 'fills both' : n >= 8 ? 'primary both' : n >= 4 ? 'thin' : n > 0 ? 'critical' : 'none');
for (const r of rows) r.verdict = verdict(r.usable);

console.log(`cache dumpedAt ${cache.dumpedAt}; quality.js = ${qualityPath}`);
console.log(`orphan exercises (topic_id not in topics): ${orphans}`);
console.log('\nLANDSCAPE (topics / published / exercises / rules / examples per sub_level):');
for (const [lvl, v] of Object.entries(landscape).sort()) console.log(`  ${lvl.padEnd(6)} ${String(v.topics).padStart(3)} / ${String(v.published).padStart(3)} / ${String(v.exercises).padStart(4)} / ${String(v.rules).padStart(3)} / ${String(v.examples).padStart(3)}`);
console.log('\nA2 LEVEL TOTALS:');
for (const [lvl, v] of Object.entries(levelTotals)) console.log(`  ${lvl}: ${v.topics} topics, raw ${v.raw} (typed ${v.typedRaw}), usable ${v.usable} (typed ${v.typedUsable}, mc ${v.mcUsable}); shapes ${JSON.stringify(v.shapes)}`);
console.log('\nREASONS per level:', JSON.stringify(reasonTotals));
console.log('\nPER TOPIC: level ord slug | pub | rules ex | raw typedRaw | usable typedU mcU | verdict | reasons');
for (const r of rows) {
  console.log(`  ${r.level} ${String(r.order).padStart(2)} ${r.slug.padEnd(34)} | ${r.published ? 'y' : 'n'} | ${String(r.rules).padStart(2)} ${String(r.examples).padStart(2)} | ${String(r.raw).padStart(3)} ${String(r.typedRaw).padStart(3)} | ${String(r.usable).padStart(3)} ${String(r.typedUsable).padStart(3)} ${String(r.mcUsable).padStart(3)} | ${r.verdict.padEnd(12)} | ${JSON.stringify(r.reasons)}${r.dupPrompts ? ` dup:${r.dupPrompts}` : ''}`);
}
if (outPath) {
  writeFileSync(outPath, JSON.stringify({ dumpedAt: cache.dumpedAt, qualityPath, landscape, orphans, levelTotals, reasonTotals, rows }, null, 1));
  console.log(`\n→ ${outPath}`);
}
