#!/usr/bin/env node
// Turn author-written grammar topic JSON (topic + rules[] + examples[] + exercises[],
// DB row shape WITHOUT id/topic_id/created_at) into:
//   1. an idempotent SQL migration (INSERT ... SELECT ... WHERE NOT EXISTS, by id), and
//   2. a patched grammar-content-cache.json (the offline snapshot the Astro build and
//      CI use — see scripts/dump-grammar-cache.mjs).
//
// IDs are deterministic (UUID v5 over a fixed namespace + a stable name built from the
// topic slug), so re-running this script after a content-review fix on the SAME slug
// yields the SAME ids: the "WHERE NOT EXISTS (id)" migration guard makes a stale row
// disappear (it is deleted from the cache and superseded in the DB by nothing --- the
// *content* changes because the migration's INSERT is skipped only for rows whose id
// did not change; typically a fix touches wording, not shape, and either way running the
// generated migration against a fresh DB and re-running this script against updated JSON
// keeps cache and (future) DB converging on the same ids for the same slug).
//
// Usage:
//   node scripts/grammar-topics-from-json.mjs --check --json <file>...
//   node scripts/grammar-topics-from-json.mjs --json <file>... --migration <out.sql> --cache <cache.json>
//
// --check only validates the input JSON (shape rules below) and exits non-zero on any
// violation, without touching the migration or the cache. Omit --check to run the full
// pipeline (validation still runs first; a violation still aborts before anything is written).

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { json: [], check: false, migration: null, cache: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--json') {
      // Consume all following non-flag tokens as json files.
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        args.json.push(argv[++i]);
      }
    } else if (a === '--migration') args.migration = argv[++i];
    else if (a === '--cache') args.cache = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (args.json.length === 0) throw new Error('At least one --json <file> is required');
  if (!args.check && (!args.migration || !args.cache)) {
    throw new Error('--migration and --cache are required unless --check is passed');
  }
  return args;
}

// ---------------------------------------------------------------------------
// Deterministic UUID v5 (RFC 4122) -- no external dependency.
//
// NAMESPACE is fixed forever for this project's generated grammar content ids.
// Do not change it: doing so would re-mint every id already emitted by this
// script and break the "same slug -> same id" re-run contract.
// ---------------------------------------------------------------------------

const NAMESPACE = '7c9e2f3a-4b1d-5e6f-8a2c-1d9b3e7f4a60';

function uuidv5(name, namespaceHex = NAMESPACE) {
  const namespaceBytes = Buffer.from(namespaceHex.replace(/-/g, ''), 'hex');
  const nameBytes = Buffer.from(name, 'utf8');
  const hash = createHash('sha1').update(Buffer.concat([namespaceBytes, nameBytes])).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const topicId = (slug) => uuidv5(slug);
const ruleId = (slug, orderIndex) => uuidv5(`${slug}/rule/${orderIndex}`);
const exampleId = (slug, orderIndex) => uuidv5(`${slug}/example/${orderIndex}`);
const exerciseId = (slug, stage, orderIndex) => uuidv5(`${slug}/exercise/${stage}/${orderIndex}`);

const FIXED_TIMESTAMP = '2026-09-05T12:00:00+00:00';
const ALLOWED_EXERCISE_TYPES = new Set([
  'fill_blank', 'multiple_choice', 'matching', 'reorder', 'error_correction', 'sentence_building', 'translation',
]);

// ---------------------------------------------------------------------------
// Validation -- shared by --check and the full pipeline (a violation aborts
// either way; --check just stops there instead of writing anything).
// ---------------------------------------------------------------------------

export function validateTopicJson(doc, sourceLabel) {
  const errors = [];
  const { topic, rules, examples, exercises } = doc;

  if (!topic || typeof topic !== 'object') {
    return [`${sourceLabel}: missing "topic" object`];
  }
  if (!Array.isArray(rules)) errors.push(`${sourceLabel}: "rules" must be an array`);
  if (!Array.isArray(examples)) errors.push(`${sourceLabel}: "examples" must be an array`);
  if (!Array.isArray(exercises)) errors.push(`${sourceLabel}: "exercises" must be an array`);
  if (errors.length) return errors;

  const slug = topic.slug || '(no slug)';
  const tag = `${sourceLabel} [${slug}]`;

  // --- rules -----------------------------------------------------------
  const ruleOrders = rules.map((r) => r.order_index);
  const ruleOrderCounts = new Map();
  for (const o of ruleOrders) ruleOrderCounts.set(o, (ruleOrderCounts.get(o) || 0) + 1);
  for (const [o, count] of ruleOrderCounts) {
    if (count > 1) errors.push(`${tag}: rules order_index ${o} appears ${count} times (must be unique)`);
  }
  const introCount = ruleOrders.filter((o) => o === -1).length;
  if (introCount !== 1) errors.push(`${tag}: expected exactly one introduction rule at order_index -1, found ${introCount}`);
  const summaryCount = ruleOrders.filter((o) => o === 99).length;
  if (summaryCount !== 1) errors.push(`${tag}: expected exactly one summary rule at order_index 99, found ${summaryCount}`);

  // --- examples ----------------------------------------------------------
  if (examples.length < 8 || examples.length > 10) {
    errors.push(`${tag}: expected 8-10 examples, found ${examples.length}`);
  }
  const exampleOrderCounts = new Map();
  for (const e of examples) exampleOrderCounts.set(e.order_index, (exampleOrderCounts.get(e.order_index) || 0) + 1);
  for (const [o, count] of exampleOrderCounts) {
    if (count > 1) errors.push(`${tag}: examples order_index ${o} appears ${count} times (must be unique)`);
  }

  // --- exercises -----------------------------------------------------------
  if (exercises.length < 26) {
    errors.push(`${tag}: expected >=26 exercises, found ${exercises.length}`);
  }
  const typed = exercises.filter((e) => e.exercise_type !== 'multiple_choice');
  if (typed.length < 16) {
    errors.push(`${tag}: expected >=16 typed (non-multiple_choice) exercises, found ${typed.length}`);
  }

  const stageOrderCounts = new Map();
  for (const e of exercises) {
    const key = `${e.stage}:${e.order_index}`;
    stageOrderCounts.set(key, (stageOrderCounts.get(key) || 0) + 1);

    if (![4, 5].includes(e.stage)) {
      errors.push(`${tag}: exercise stage/order ${key}: stage must be 4 or 5, got ${e.stage}`);
    }
    if (![1, 2, 3].includes(e.difficulty)) {
      errors.push(`${tag}: exercise stage/order ${key}: difficulty must be 1-3, got ${e.difficulty}`);
    }
    if (!ALLOWED_EXERCISE_TYPES.has(e.exercise_type)) {
      errors.push(`${tag}: exercise stage/order ${key}: exercise_type "${e.exercise_type}" is not one of ${[...ALLOWED_EXERCISE_TYPES].join(', ')}`);
    }

    if (e.exercise_type === 'multiple_choice') {
      if (!Array.isArray(e.options) || e.options.length !== 4) {
        errors.push(`${tag}: exercise stage/order ${key}: multiple_choice must have exactly 4 options`);
      } else if (!e.options.includes(e.correct_answer)) {
        errors.push(`${tag}: exercise stage/order ${key}: correct_answer "${e.correct_answer}" is not verbatim among options`);
      }
    } else {
      if (e.options !== null) {
        errors.push(`${tag}: exercise stage/order ${key}: typed exercise_type "${e.exercise_type}" must have options: null`);
      }
      if (e.exercise_type === 'fill_blank') {
        const blanks = (e.question_de.match(/___/g) || []).length;
        if (blanks !== 1) {
          errors.push(`${tag}: exercise stage/order ${key}: fill_blank question_de must contain exactly one "___", found ${blanks}`);
        }
      }
    }
  }
  for (const [key, count] of stageOrderCounts) {
    if (count > 1) errors.push(`${tag}: exercise stage/order ${key} appears ${count} times (must be unique per stage)`);
  }
  for (const stage of [4, 5]) {
    const orders = exercises.filter((e) => e.stage === stage).map((e) => e.order_index).sort((a, b) => a - b);
    if (orders.length && orders[0] !== 1) {
      errors.push(`${tag}: stage ${stage} order_index must start at 1, starts at ${orders[0]}`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// SQL literal helpers
// ---------------------------------------------------------------------------

const sqlStr = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const sqlNum = (v) => (v === null || v === undefined ? 'NULL' : String(v));
const sqlBool = (v) => (v === null || v === undefined ? 'NULL' : v ? 'TRUE' : 'FALSE');
const sqlTimestamptz = (v) => `'${v}'::timestamptz`;
const sqlJsonb = (v) => (v === null || v === undefined ? 'NULL' : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`);
const sqlTextArray = (v) =>
  v === null || v === undefined ? 'NULL' : `ARRAY[${v.map((s) => sqlStr(s)).join(',')}]::text[]`;

// ---------------------------------------------------------------------------
// Row builders (cache shape == migration source of truth; column order below
// mirrors the existing rows in grammar-content-cache.json exactly).
// ---------------------------------------------------------------------------

function buildTopicRow(topic) {
  const id = topicId(topic.slug);
  return {
    id,
    sub_level: topic.sub_level,
    topic_order: topic.topic_order,
    title_en: topic.title_en,
    title_de: topic.title_de,
    slug: topic.slug,
    description_en: topic.description_en,
    description_de: topic.description_de,
    estimated_time: topic.estimated_time,
    icon: topic.icon,
    is_published: topic.is_published,
    created_at: FIXED_TIMESTAMP,
    updated_at: FIXED_TIMESTAMP,
    prerequisite_slugs: topic.prerequisite_slugs ?? null,
    related_slugs: topic.related_slugs ?? null,
  };
}

function buildRuleRow(slug, topicIdVal, rule) {
  return {
    id: ruleId(slug, rule.order_index),
    topic_id: topicIdVal,
    rule_type: rule.rule_type,
    title_en: rule.title_en ?? null,
    title_de: rule.title_de ?? null,
    content: rule.content ?? null,
    order_index: rule.order_index,
    created_at: FIXED_TIMESTAMP,
    common_mistakes: rule.common_mistakes ?? null,
    memory_trick_en: rule.memory_trick_en ?? null,
    memory_trick_de: rule.memory_trick_de ?? null,
    formal_note_en: rule.formal_note_en ?? null,
    formal_note_de: rule.formal_note_de ?? null,
    key_insight_en: rule.key_insight_en ?? null,
    key_insight_de: rule.key_insight_de ?? null,
  };
}

function buildExampleRow(slug, topicIdVal, example) {
  return {
    id: exampleId(slug, example.order_index),
    topic_id: topicIdVal,
    sentence_de: example.sentence_de,
    sentence_en: example.sentence_en,
    grammar_highlight: example.grammar_highlight ?? null,
    audio_url: null,
    order_index: example.order_index,
    created_at: FIXED_TIMESTAMP,
    explanation_en: example.explanation_en ?? null,
    explanation_de: example.explanation_de ?? null,
    word_breakdown: example.word_breakdown ?? null,
    difficulty: example.difficulty,
    category: example.category ?? null,
  };
}

function buildExerciseRow(slug, topicIdVal, exercise) {
  return {
    id: exerciseId(slug, exercise.stage, exercise.order_index),
    topic_id: topicIdVal,
    stage: exercise.stage,
    exercise_type: exercise.exercise_type,
    question_de: exercise.question_de,
    question_en: exercise.question_en,
    options: exercise.options ?? null,
    correct_answer: exercise.correct_answer,
    acceptable_answers: exercise.acceptable_answers ?? null,
    explanation_en: exercise.explanation_en ?? null,
    explanation_de: exercise.explanation_de ?? null,
    hint: exercise.hint ?? null,
    order_index: exercise.order_index,
    difficulty: exercise.difficulty,
    created_at: FIXED_TIMESTAMP,
    why_correct_en: exercise.why_correct_en ?? null,
    why_correct_de: exercise.why_correct_de ?? null,
    related_rule_title: exercise.related_rule_title ?? null,
  };
}

// ---------------------------------------------------------------------------
// SQL generation
// ---------------------------------------------------------------------------

function topicInsertSql(row) {
  return `INSERT INTO public.grammar_topics (id, sub_level, topic_order, title_en, title_de, slug, description_en, description_de, estimated_time, icon, is_published, created_at, updated_at, prerequisite_slugs, related_slugs)
SELECT ${sqlStr(row.id)}::uuid, ${sqlStr(row.sub_level)}, ${sqlNum(row.topic_order)}, ${sqlStr(row.title_en)}, ${sqlStr(row.title_de)}, ${sqlStr(row.slug)}, ${sqlStr(row.description_en)}, ${sqlStr(row.description_de)}, ${sqlNum(row.estimated_time)}, ${sqlStr(row.icon)}, ${sqlBool(row.is_published)}, ${sqlTimestamptz(row.created_at)}, ${sqlTimestamptz(row.updated_at)}, ${sqlTextArray(row.prerequisite_slugs)}, ${sqlTextArray(row.related_slugs)}
WHERE NOT EXISTS (SELECT 1 FROM public.grammar_topics WHERE id = ${sqlStr(row.id)}::uuid);`;
}

function ruleInsertSql(row) {
  return `INSERT INTO public.grammar_rules (id, topic_id, rule_type, title_en, title_de, content, order_index, created_at, common_mistakes, memory_trick_en, memory_trick_de, formal_note_en, formal_note_de, key_insight_en, key_insight_de)
SELECT ${sqlStr(row.id)}::uuid, ${sqlStr(row.topic_id)}::uuid, ${sqlStr(row.rule_type)}, ${sqlStr(row.title_en)}, ${sqlStr(row.title_de)}, ${sqlJsonb(row.content)}, ${sqlNum(row.order_index)}, ${sqlTimestamptz(row.created_at)}, ${sqlJsonb(row.common_mistakes)}, ${sqlStr(row.memory_trick_en)}, ${sqlStr(row.memory_trick_de)}, ${sqlStr(row.formal_note_en)}, ${sqlStr(row.formal_note_de)}, ${sqlStr(row.key_insight_en)}, ${sqlStr(row.key_insight_de)}
WHERE NOT EXISTS (SELECT 1 FROM public.grammar_rules WHERE id = ${sqlStr(row.id)}::uuid);`;
}

function exampleInsertSql(row) {
  return `INSERT INTO public.grammar_examples (id, topic_id, sentence_de, sentence_en, grammar_highlight, audio_url, order_index, created_at, explanation_en, explanation_de, word_breakdown, difficulty, category)
SELECT ${sqlStr(row.id)}::uuid, ${sqlStr(row.topic_id)}::uuid, ${sqlStr(row.sentence_de)}, ${sqlStr(row.sentence_en)}, ${sqlStr(row.grammar_highlight)}, ${sqlStr(row.audio_url)}, ${sqlNum(row.order_index)}, ${sqlTimestamptz(row.created_at)}, ${sqlStr(row.explanation_en)}, ${sqlStr(row.explanation_de)}, ${sqlJsonb(row.word_breakdown)}, ${sqlNum(row.difficulty)}, ${sqlStr(row.category)}
WHERE NOT EXISTS (SELECT 1 FROM public.grammar_examples WHERE id = ${sqlStr(row.id)}::uuid);`;
}

function exerciseInsertSql(row) {
  return `INSERT INTO public.grammar_exercises (id, topic_id, stage, exercise_type, question_de, question_en, options, correct_answer, acceptable_answers, explanation_en, explanation_de, hint, order_index, difficulty, created_at, why_correct_en, why_correct_de, related_rule_title)
SELECT ${sqlStr(row.id)}::uuid, ${sqlStr(row.topic_id)}::uuid, ${sqlNum(row.stage)}, ${sqlStr(row.exercise_type)}, ${sqlStr(row.question_de)}, ${sqlStr(row.question_en)}, ${sqlJsonb(row.options)}, ${sqlStr(row.correct_answer)}, ${sqlJsonb(row.acceptable_answers)}, ${sqlStr(row.explanation_en)}, ${sqlStr(row.explanation_de)}, ${sqlStr(row.hint)}, ${sqlNum(row.order_index)}, ${sqlNum(row.difficulty)}, ${sqlTimestamptz(row.created_at)}, ${sqlStr(row.why_correct_en)}, ${sqlStr(row.why_correct_de)}, ${sqlStr(row.related_rule_title)}
WHERE NOT EXISTS (SELECT 1 FROM public.grammar_exercises WHERE id = ${sqlStr(row.id)}::uuid);`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));

  const docs = args.json.map((path) => {
    const raw = readFileSync(resolve(path), 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error(`Failed to parse ${path}: ${err.message}`);
      process.exit(1);
    }
    return { path, doc: parsed };
  });

  const allErrors = [];
  for (const { path, doc } of docs) {
    allErrors.push(...validateTopicJson(doc, path));
  }
  if (allErrors.length) {
    console.error(`grammar-topics-from-json: ${allErrors.length} validation error(s):`);
    for (const e of allErrors) console.error(`  - ${e}`);
    process.exit(1);
  }

  if (args.check) {
    console.log(`OK: ${docs.length} file(s) validated, no violations.`);
    return;
  }

  // Cross-file checks: topic_order and slug must not collide with each other.
  const slugs = new Set();
  const orders = new Set();
  for (const { path, doc } of docs) {
    if (slugs.has(doc.topic.slug)) {
      console.error(`Duplicate slug "${doc.topic.slug}" across input files (from ${path})`);
      process.exit(1);
    }
    slugs.add(doc.topic.slug);
    if (orders.has(doc.topic.topic_order)) {
      console.error(`Duplicate topic_order ${doc.topic.topic_order} across input files (from ${path})`);
      process.exit(1);
    }
    orders.add(doc.topic.topic_order);
  }

  // ---- Build rows -----------------------------------------------------
  const allTopicRows = [];
  const allRuleRows = [];
  const allExampleRows = [];
  const allExerciseRows = [];
  const summaries = [];

  for (const { doc } of docs) {
    const { topic, rules, examples, exercises } = doc;
    const tRow = buildTopicRow(topic);
    allTopicRows.push(tRow);

    const ruleRows = rules
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((r) => buildRuleRow(topic.slug, tRow.id, r));
    allRuleRows.push(...ruleRows);

    const exampleRows = examples
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((e) => buildExampleRow(topic.slug, tRow.id, e));
    allExampleRows.push(...exampleRows);

    const exerciseRows = exercises
      .slice()
      .sort((a, b) => a.stage - b.stage || a.order_index - b.order_index)
      .map((e) => buildExerciseRow(topic.slug, tRow.id, e));
    allExerciseRows.push(...exerciseRows);

    summaries.push({
      slug: topic.slug,
      id: tRow.id,
      topic_order: topic.topic_order,
      rules: ruleRows.length,
      examples: exampleRows.length,
      exercises: exerciseRows.length,
      typed: exerciseRows.filter((e) => e.exercise_type !== 'multiple_choice').length,
    });
  }

  // ---- Migration --------------------------------------------------------
  const generatedAt = new Date().toISOString();
  const sqlParts = [];
  sqlParts.push(`-- New A1.1 grammar topics 9-12 (Course Factory Wave 2, PR A).
--
-- What: adds four A1.1 grammar topics -- ${allTopicRows.map((t) => t.slug).join(', ')} --
-- at topic_order 9-12, and widens grammar_topics_topic_order_check from 1..8
-- to 1..12 to admit them (sub_level, topic_order) stays UNIQUE and untouched.
-- Why: A1.1 grows from 8 to 12 topics; every level keeps its own slot in the
-- widened range, and A1.2-B2.2 remain unaffected (their sub_level rows never
-- exceed 8, so the wider CHECK is a strict relaxation for everyone).
--
-- Generated by scripts/grammar-topics-from-json.mjs on ${generatedAt}.
-- All row ids are UUID v5, deterministic from the topic slug (see the script
-- header) -- re-running this generator against a content-review fix on the
-- SAME slug reproduces the SAME ids, so this migration stays a safe re-run:
-- every INSERT is guarded by WHERE NOT EXISTS (id), so applying it twice, or
-- applying an updated version after ids were already inserted with the same
-- content shape, is a no-op for unchanged rows.
--
-- Fixed timestamp: every created_at/updated_at below is the literal
-- ${FIXED_TIMESTAMP} chosen for this batch, matching the same literal baked
-- into the cache rows this migration's counterpart patches into
-- grammar-content-cache.json -- so cache and (once applied) DB agree exactly.
--
-- How to test: apply by hand in the Supabase SQL editor, then:
--   SELECT slug, topic_order FROM public.grammar_topics WHERE sub_level = 'A1.1' ORDER BY topic_order;
--   -- expect 12 rows, 1..12, the four new slugs at 9-12.
-- Rollback: DELETE FROM public.grammar_exercises/grammar_examples/grammar_rules
-- WHERE topic_id IN (SELECT id FROM public.grammar_topics WHERE slug IN (${allTopicRows.map((t) => `'${t.slug}'`).join(', ')}));
-- then DELETE FROM public.grammar_topics WHERE slug IN (...); then restore the
-- CHECK to 1..8 IF no other row above 8 exists for any sub_level.
-- Idempotent: every INSERT is guarded by WHERE NOT EXISTS (id); the ALTER
-- TABLE pair (DROP IF EXISTS, then ADD) is itself idempotent to re-run.

BEGIN;

ALTER TABLE public.grammar_topics DROP CONSTRAINT IF EXISTS grammar_topics_topic_order_check;
ALTER TABLE public.grammar_topics ADD CONSTRAINT grammar_topics_topic_order_check CHECK (topic_order >= 1 AND topic_order <= 12);
`);

  sqlParts.push('-- Topics\n' + allTopicRows.map(topicInsertSql).join('\n\n'));
  sqlParts.push('-- Rules\n' + allRuleRows.map(ruleInsertSql).join('\n\n'));
  sqlParts.push('-- Examples\n' + allExampleRows.map(exampleInsertSql).join('\n\n'));
  sqlParts.push('-- Exercises\n' + allExerciseRows.map(exerciseInsertSql).join('\n\n'));
  sqlParts.push('\nCOMMIT;\n');

  writeFileSync(resolve(args.migration), sqlParts.join('\n\n') + '\n');

  // ---- Cache patch --------------------------------------------------------
  const cachePath = resolve(args.cache);
  const cacheRaw = readFileSync(cachePath, 'utf8');
  const cacheParsed = JSON.parse(cacheRaw);
  if (JSON.stringify(cacheParsed) !== cacheRaw) {
    console.error(
      `${args.cache} does not round-trip losslessly through JSON.parse/JSON.stringify -- ` +
      'refusing to patch it (the file may be pretty-printed, have a different key order than ' +
      'JSON.stringify would produce, or otherwise not match the dump-grammar-cache.mjs single-line format).',
    );
    process.exit(1);
  }

  const newIds = new Set([
    ...allTopicRows.map((r) => r.id),
    ...allRuleRows.map((r) => r.id),
    ...allExampleRows.map((r) => r.id),
    ...allExerciseRows.map((r) => r.id),
  ]);

  cacheParsed.topics = cacheParsed.topics.filter((r) => !newIds.has(r.id)).concat(allTopicRows);
  cacheParsed.rules = cacheParsed.rules.filter((r) => !newIds.has(r.id)).concat(allRuleRows);
  cacheParsed.examples = cacheParsed.examples.filter((r) => !newIds.has(r.id)).concat(allExampleRows);
  cacheParsed.exercises = cacheParsed.exercises.filter((r) => !newIds.has(r.id)).concat(allExerciseRows);
  // dumpedAt is left untouched -- it records when the cache was last pulled from
  // the live DB, and this patch is a local, pre-apply projection of a migration
  // that has not been run against that DB yet.

  writeFileSync(cachePath, JSON.stringify(cacheParsed));

  // ---- Summary --------------------------------------------------------
  console.log(`Wrote ${args.migration}`);
  console.log(`Patched ${args.cache}`);
  console.log('');
  for (const s of summaries) {
    console.log(
      `${s.slug} (topic_order ${s.topic_order}): id=${s.id} rules=${s.rules} examples=${s.examples} exercises=${s.exercises} (typed=${s.typed})`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
