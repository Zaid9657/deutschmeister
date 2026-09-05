#!/usr/bin/env node
// Turn author-written grammar topic JSON into either:
//   (a) a brand-new topic (CREATE mode -- the original shape:
//       { topic, rules[], examples[], exercises[] }, DB row shape WITHOUT
//       id/topic_id/created_at, topic.slug is NEW), or
//   (b) an addition to an EXISTING topic (EXTEND mode -- the new shape:
//       { extend: { slug, sub_level }, topic_patch?, rules?, examples?, exercises? }
//       -- see "EXTEND mode" below).
// Either way the output is:
//   1. an idempotent SQL migration (INSERT ... SELECT ... WHERE NOT EXISTS for
//      new rows; UPDATE ... WHERE <field> IS DISTINCT FROM <new> for topic_patch
//      fields), and
//   2. a patched grammar-content-cache.json (the offline snapshot the Astro build
//      and CI use -- see scripts/dump-grammar-cache.mjs).
// A single run may mix CREATE and EXTEND documents across multiple --json files;
// a single slug may not be both created and extended in the same run.
//
// IDs are deterministic (UUID v5 over a fixed namespace + a stable name), so
// re-running this script against the SAME input JSON yields the SAME ids: the
// "WHERE NOT EXISTS (id)" migration guard makes a stale row disappear (it is
// deleted from the cache and superseded in the DB by nothing --- the *content*
// changes because the migration's INSERT is skipped only for rows whose id did
// not change; typically a fix touches wording, not shape, and either way running
// the generated migration against a fresh DB and re-running this script against
// updated JSON keeps cache and (future) DB converging on the same ids for the
// same slug).
//
// CREATE-mode id naming (unchanged from the original script):
//   topic:    uuidv5(`${slug}`)
//   rule:     uuidv5(`${slug}/rule/${order_index}`)
//   example:  uuidv5(`${slug}/example/${order_index}`)
//   exercise: uuidv5(`${slug}/exercise/${stage}/${order_index}`)
//
// EXTEND-mode id naming -- deliberately a DIFFERENT name shape (colon-joined,
// literal "extend" segment) so it can never collide with a CREATE-mode name for
// any slug, and never mints a topic id (extend mode never INSERTs grammar_topics):
//   rule:     uuidv5(`extend:${slug}:rule:${order_index}`)
//   example:  uuidv5(`extend:${slug}:example:${order_index}`)
//   exercise: uuidv5(`extend:${slug}:exercise:${stage}:${order_index}`)
// Re-running on the same EXTEND JSON yields the same ids for the same reason as
// CREATE mode: the row key (order_index, or stage:order_index) is stable input.
//
// EXTEND mode shape:
//   {
//     "extend": { "slug": "<existing topic slug>", "sub_level": "<existing topic sub_level>" },
//     "topic_patch": {            // optional, any subset of these six fields
//       "description_en": "...", "description_de": "...", "estimated_time": 25,
//       "title_en": "...", "title_de": "...", "related_slugs": ["..."]
//     },
//     "rule_patches": [           // optional, edits to an EXISTING rule's field(s)
//       { "rule_id": "<uuid of an existing public.grammar_rules row>",
//         "field": "content",     // one of RULE_PATCH_FIELDS below
//         "old": <current value of that field, exactly as it sits in the cache>,
//         "new": <replacement value> }
//     ],
//     "rules": [ /* same row shape as CREATE mode's rules[] */ ],
//     "examples": [ /* same row shape as CREATE mode's examples[] */ ],
//     "exercises": [ /* same row shape as CREATE mode's exercises[] */ ]
//   }
// rules/examples/exercises/rule_patches are each optional (default []); at
// least one of them or topic_patch must be non-empty. The existing topic is
// resolved from the --cache file by (slug, sub_level) -- the cache is the
// offline source of truth for ids, so EXTEND mode requires --cache even under
// --check once any EXTEND file is present (collision/continuation checks,
// and every rule_patches check, need the existing rows; without --cache,
// --check still runs the shape-only rules below).
//
// rule_patches: edits ONE field on an EXISTING grammar_rules row (never a row
// this same file also creates via "rules" -- rule_id must belong to the
// topic's pre-existing rules). `old` must be deep-equal (via JSON.stringify)
// to that field's CURRENT value in the --cache row, or the whole run aborts
// before anything is written -- this is the guard against patching a row that
// has already moved on (e.g. a prior, un-cache-synced edit). The emitted SQL
// is a single UPDATE guarded on both id AND the old value of the field itself
// (`WHERE id = ... AND <field> = <old>::jsonb`, or plain `= <old>` for a text
// field) rather than IS DISTINCT FROM (old) as topic_patch uses -- so if the
// live DB's value has already diverged from `old` for any reason, applying
// the migration is a silent no-op instead of overwriting an unexpected value.
// Allowed fields (RULE_PATCH_FIELDS): content, common_mistakes (jsonb),
// title_en, title_de, memory_trick_en, memory_trick_de, formal_note_en,
// formal_note_de, key_insight_en, key_insight_de (text). rule_type,
// order_index, topic_id, id and created_at can never be patched this way.
//
// order_index rules (validated in validateExtendJson, enforced again as a
// sanity check right before rows are built):
//   - rules: -1 (intro) and 99 (summary) are reserved and rejected outright;
//     any other integer is allowed as long as it does not collide with an
//     EXISTING rule's order_index on that topic (or with another new rule in
//     the same file). To insert between two existing rules, renumber them in
//     a separate migration first -- this script never renumbers existing rows.
//   - examples: must continue the topic's existing numbering contiguously,
//     i.e. start at (max existing order_index) + 1 and increment by 1.
//   - exercises: order_index is a GLOBAL counter across stages 4 and 5 (see
//     modal-verbs-intro / nouns-gender in the cache: stage 4 is 1-8, stage 5
//     continues 9-15) -- new exercises must continue that same global counter
//     contiguously from (max existing order_index across both stages) + 1,
//     and must not collide with any existing exercise's order_index.
//
// Usage:
//   node scripts/grammar-topics-from-json.mjs --check --json <file>... [--cache <cache.json>]
//   node scripts/grammar-topics-from-json.mjs --json <file>... --migration <out.sql> --cache <cache.json>
//
// --check only validates the input JSON (shape rules below) and exits non-zero
// on any violation, without touching the migration or the cache. --cache is
// optional under --check: pass it to also run the cache-dependent EXTEND
// checks (topic exists, no order_index collisions); omit it to validate shape
// only. Omit --check to run the full pipeline (validation still runs first,
// with --cache now required; a violation still aborts before anything is
// written).

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

// CREATE-mode id functions (unchanged).
const topicId = (slug) => uuidv5(slug);
const ruleId = (slug, orderIndex) => uuidv5(`${slug}/rule/${orderIndex}`);
const exampleId = (slug, orderIndex) => uuidv5(`${slug}/example/${orderIndex}`);
const exerciseId = (slug, stage, orderIndex) => uuidv5(`${slug}/exercise/${stage}/${orderIndex}`);

// EXTEND-mode id functions -- see the header comment for why these can never
// collide with a CREATE-mode name (different separator + literal "extend"
// segment, and EXTEND mode never mints a topic id at all).
const extendRuleId = (slug, orderIndex) => uuidv5(`extend:${slug}:rule:${orderIndex}`);
const extendExampleId = (slug, orderIndex) => uuidv5(`extend:${slug}:example:${orderIndex}`);
const extendExerciseId = (slug, stage, orderIndex) => uuidv5(`extend:${slug}:exercise:${stage}:${orderIndex}`);

const FIXED_TIMESTAMP = '2026-09-05T12:00:00+00:00';
const ALLOWED_EXERCISE_TYPES = new Set([
  'fill_blank', 'multiple_choice', 'matching', 'reorder', 'error_correction', 'sentence_building', 'translation',
]);
// grammar_rules_rule_type_check on the live table (read 2026-09-05). 'list'
// is NOT in it: the first live apply of the Wave 3 PR A migration rolled
// back on a verb_list rule typed 'list' -- the Wave 2 verb_list rules use
// 'tip', so that is the type the renderer already knows.
const ALLOWED_RULE_TYPES = new Set([
  'introduction', 'table', 'tip', 'pattern', 'summary', 'explanation_core', 'explanation_patterns',
  'explanation_comparison', 'explanation_exceptions', 'common_mistakes', 'dialogue', 'warning',
]);
const ALLOWED_PATCH_FIELDS = ['description_en', 'description_de', 'estimated_time', 'title_en', 'title_de', 'related_slugs'];
// grammar_rules fields rule_patches may touch -- deliberately excludes
// rule_type/order_index/topic_id/id/created_at (identity/ordering, never a
// content edit) -- see RULE_PATCH_FIELD_SQL below for the per-field SQL kind.
const RULE_PATCH_FIELDS = [
  'content', 'common_mistakes', 'title_en', 'title_de',
  'memory_trick_en', 'memory_trick_de', 'formal_note_en', 'formal_note_de',
  'key_insight_en', 'key_insight_de',
];

// ---------------------------------------------------------------------------
// Validation -- shared by --check and the full pipeline (a violation aborts
// either way; --check just stops there instead of writing anything).
// ---------------------------------------------------------------------------

// Per-row shape checks for one exercise, shared by CREATE and EXTEND mode so
// the rules never drift between the two paths.
function validateExerciseRowShape(e, tag, key) {
  const errors = [];
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
  return errors;
}

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
  for (const r of rules) {
    if (!ALLOWED_RULE_TYPES.has(r.rule_type)) {
      errors.push(`${tag}: rule order_index ${r.order_index}: rule_type "${r.rule_type}" is not one of ${[...ALLOWED_RULE_TYPES].join(', ')}`);
    }
  }

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
    errors.push(...validateExerciseRowShape(e, tag, key));
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

// EXTEND-mode validation. `cache` is the parsed grammar-content-cache.json
// (or null/undefined, e.g. under --check with no --cache given) -- when
// present, the existing-topic lookup and every collision/continuation check
// against its rows run too; when absent, only shape rules that don't need the
// existing rows run (a real --cache is required for the full pipeline, see
// parseArgs / main).
export function validateExtendJson(doc, sourceLabel, cache) {
  const errors = [];
  const ext = doc.extend;
  if (!ext || typeof ext !== 'object' || !ext.slug || !ext.sub_level) {
    return [`${sourceLabel}: "extend" must be an object with "slug" and "sub_level"`];
  }
  const tag = `${sourceLabel} [extend:${ext.slug}]`;

  const rules = doc.rules ?? [];
  const examples = doc.examples ?? [];
  const exercises = doc.exercises ?? [];
  const rulePatches = doc.rule_patches ?? [];
  if (!Array.isArray(rules)) errors.push(`${tag}: "rules" must be an array`);
  if (!Array.isArray(examples)) errors.push(`${tag}: "examples" must be an array`);
  if (!Array.isArray(exercises)) errors.push(`${tag}: "exercises" must be an array`);
  if (!Array.isArray(rulePatches)) errors.push(`${tag}: "rule_patches" must be an array`);
  if (errors.length) return errors;

  if (rules.length === 0 && examples.length === 0 && exercises.length === 0 && rulePatches.length === 0 && !doc.topic_patch) {
    errors.push(`${tag}: extend document has nothing to add (no rules/examples/exercises/rule_patches/topic_patch)`);
  }
  for (const r of rules) {
    if (!ALLOWED_RULE_TYPES.has(r.rule_type)) {
      errors.push(`${tag}: rule order_index ${r.order_index}: rule_type "${r.rule_type}" is not one of ${[...ALLOWED_RULE_TYPES].join(', ')}`);
    }
  }

  // --- topic_patch -------------------------------------------------------
  if (doc.topic_patch !== undefined) {
    if (typeof doc.topic_patch !== 'object' || doc.topic_patch === null || Array.isArray(doc.topic_patch)) {
      errors.push(`${tag}: "topic_patch" must be an object`);
    } else {
      const keys = Object.keys(doc.topic_patch);
      if (keys.length === 0) errors.push(`${tag}: "topic_patch" must not be empty if present`);
      for (const k of keys) {
        if (!ALLOWED_PATCH_FIELDS.includes(k)) {
          errors.push(`${tag}: topic_patch field "${k}" is not one of ${ALLOWED_PATCH_FIELDS.join(', ')}`);
        }
      }
    }
  }

  // --- rule_patches --------------------------------------------------------
  const patchedRuleIds = new Set();
  for (const rp of rulePatches) {
    if (!rp || typeof rp !== 'object') {
      errors.push(`${tag}: rule_patches entry must be an object`);
      continue;
    }
    const { rule_id: ruleId_, field, old: oldVal, new: newVal } = rp;
    if (typeof ruleId_ !== 'string' || !ruleId_) errors.push(`${tag}: rule_patches entry missing "rule_id"`);
    if (typeof field !== 'string' || !field) errors.push(`${tag}: rule_patches entry missing "field"`);
    else if (!RULE_PATCH_FIELDS.includes(field)) errors.push(`${tag}: rule_patches field "${field}" is not one of ${RULE_PATCH_FIELDS.join(', ')}`);
    if (oldVal === undefined) errors.push(`${tag}: rule_patches entry for rule ${ruleId_} missing "old"`);
    if (newVal === undefined) errors.push(`${tag}: rule_patches entry for rule ${ruleId_} missing "new"`);
    if (typeof ruleId_ === 'string' && ruleId_) {
      if (patchedRuleIds.has(`${ruleId_}::${field}`)) {
        errors.push(`${tag}: rule_patches patches rule ${ruleId_} field "${field}" more than once in this file`);
      }
      patchedRuleIds.add(`${ruleId_}::${field}`);
    }
  }

  // --- resolve existing topic (cache-dependent) ---------------------------
  let existingTopic = null;
  if (cache) {
    existingTopic = cache.topics.find((t) => t.slug === ext.slug && t.sub_level === ext.sub_level);
    if (!existingTopic) {
      errors.push(`${tag}: no existing topic found in cache for slug "${ext.slug}" at sub_level "${ext.sub_level}"`);
    }
  }

  // --- rule_patches (cache-dependent: rule must exist on this topic, and
  // "old" must match its CURRENT field value exactly, or the patch is
  // refused before anything is written) -------------------------------------
  if (existingTopic) {
    for (const rp of rulePatches) {
      if (!rp || typeof rp.rule_id !== 'string' || typeof rp.field !== 'string') continue; // already flagged above
      const rule = cache.rules.find((r) => r.id === rp.rule_id && r.topic_id === existingTopic.id);
      if (!rule) {
        errors.push(`${tag}: rule_patches rule_id "${rp.rule_id}" is not an existing rule on this topic`);
        continue;
      }
      if (!RULE_PATCH_FIELDS.includes(rp.field)) continue; // already flagged above
      if (JSON.stringify(rule[rp.field]) !== JSON.stringify(rp.old)) {
        errors.push(`${tag}: rule_patches "old" for rule ${rp.rule_id} field "${rp.field}" does not match the cache's current value -- refusing to patch a value that has moved`);
      }
    }
  }

  // --- rules ---------------------------------------------------------------
  const ruleOrders = rules.map((r) => r.order_index);
  const ruleOrderCounts = new Map();
  for (const o of ruleOrders) ruleOrderCounts.set(o, (ruleOrderCounts.get(o) || 0) + 1);
  for (const [o, count] of ruleOrderCounts) {
    if (count > 1) errors.push(`${tag}: rules order_index ${o} appears ${count} times in this file (must be unique)`);
  }
  for (const o of ruleOrders) {
    if (o === -1 || o === 99) {
      errors.push(`${tag}: rule order_index ${o} is reserved (intro=-1, summary=99) and cannot be used to extend a topic`);
    }
  }
  if (existingTopic) {
    const existingRuleOrders = new Set(cache.rules.filter((r) => r.topic_id === existingTopic.id).map((r) => r.order_index));
    for (const o of ruleOrders) {
      if (existingRuleOrders.has(o)) errors.push(`${tag}: rule order_index ${o} collides with an existing rule on this topic -- renumber to insert between existing rules`);
    }
  }

  // --- examples --------------------------------------------------------------
  const exampleOrders = examples.map((e) => e.order_index);
  const exampleOrderCounts = new Map();
  for (const o of exampleOrders) exampleOrderCounts.set(o, (exampleOrderCounts.get(o) || 0) + 1);
  for (const [o, count] of exampleOrderCounts) {
    if (count > 1) errors.push(`${tag}: examples order_index ${o} appears ${count} times in this file (must be unique)`);
  }
  if (existingTopic && examples.length) {
    const existingOrders = cache.examples.filter((e) => e.topic_id === existingTopic.id).map((e) => e.order_index);
    const maxExisting = existingOrders.length ? Math.max(...existingOrders) : 0;
    const sorted = exampleOrders.slice().sort((a, b) => a - b);
    let expected = maxExisting + 1;
    for (const o of sorted) {
      if (o !== expected) {
        errors.push(`${tag}: new examples must continue the topic's numbering contiguously from ${maxExisting + 1} -- expected order_index ${expected}, found ${o}`);
        break;
      }
      expected++;
    }
  }

  // --- exercises ---------------------------------------------------------------
  const stageOrderCounts = new Map();
  for (const e of exercises) {
    const key = `${e.stage}:${e.order_index}`;
    stageOrderCounts.set(key, (stageOrderCounts.get(key) || 0) + 1);
    errors.push(...validateExerciseRowShape(e, tag, key));
  }
  for (const [key, count] of stageOrderCounts) {
    if (count > 1) errors.push(`${tag}: exercise stage/order ${key} appears ${count} times in this file (must be unique per stage)`);
  }
  if (existingTopic && exercises.length) {
    const existingExercises = cache.exercises.filter((e) => e.topic_id === existingTopic.id);
    const existingOrders = new Set(existingExercises.map((e) => e.order_index));
    for (const e of exercises) {
      if (existingOrders.has(e.order_index)) {
        errors.push(`${tag}: exercise order_index ${e.order_index} (stage ${e.stage}) collides with an existing exercise on this topic (order_index is a GLOBAL counter across stages)`);
      }
    }
    const maxExisting = existingExercises.length ? Math.max(...existingExercises.map((e) => e.order_index)) : 0;
    const sortedNew = exercises.slice().sort((a, b) => a.order_index - b.order_index);
    let expected = maxExisting + 1;
    for (const e of sortedNew) {
      if (e.order_index !== expected) {
        errors.push(`${tag}: new exercises must continue the topic's GLOBAL order_index numbering contiguously from ${maxExisting + 1} -- expected ${expected}, found ${e.order_index} (stage ${e.stage})`);
        break;
      }
      expected++;
    }
  }

  return errors;
}

// Mode dispatch used by both this script's main() and check-grammar-json.mjs,
// so the two never validate a document differently.
export function validateGrammarDoc(doc, sourceLabel, cache) {
  if (doc && typeof doc === 'object' && doc.extend) {
    return validateExtendJson(doc, sourceLabel, cache);
  }
  return validateTopicJson(doc, sourceLabel);
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

// Serializer per topic_patch field, used both for the UPDATE literal and (by
// re-use) nowhere else -- the cache patch writes the raw JS value directly.
const PATCH_FIELD_SQL = {
  description_en: sqlStr,
  description_de: sqlStr,
  title_en: sqlStr,
  title_de: sqlStr,
  estimated_time: sqlNum,
  related_slugs: sqlTextArray,
};

// Serializer per rule_patches field. content/common_mistakes are jsonb on
// public.grammar_rules; the rest are plain text.
const RULE_PATCH_FIELD_SQL = {
  content: sqlJsonb,
  common_mistakes: sqlJsonb,
  title_en: sqlStr,
  title_de: sqlStr,
  memory_trick_en: sqlStr,
  memory_trick_de: sqlStr,
  formal_note_en: sqlStr,
  formal_note_de: sqlStr,
  key_insight_en: sqlStr,
  key_insight_de: sqlStr,
};

// ---------------------------------------------------------------------------
// Row builders (cache shape == migration source of truth; column order below
// mirrors the existing rows in grammar-content-cache.json exactly).
//
// Each takes an `idFn` rather than computing the id itself, so CREATE mode
// (idFn closes over the CREATE id functions above) and EXTEND mode (idFn
// closes over the EXTEND id functions) share one row-shape implementation --
// the column layout can never drift between the two modes.
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

function buildRuleRow(idFn, topicIdVal, rule) {
  return {
    id: idFn(rule.order_index),
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

function buildExampleRow(idFn, topicIdVal, example) {
  return {
    id: idFn(example.order_index),
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

function buildExerciseRow(idFn, topicIdVal, exercise) {
  return {
    id: idFn(exercise.stage, exercise.order_index),
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

function topicPatchUpdateSql(topicId_, field, value) {
  const lit = PATCH_FIELD_SQL[field](value);
  return `UPDATE public.grammar_topics SET ${field} = ${lit}, updated_at = ${sqlTimestamptz(FIXED_TIMESTAMP)}
WHERE id = ${sqlStr(topicId_)}::uuid AND ${field} IS DISTINCT FROM ${lit};`;
}

// Guarded on the OLD value (not IS DISTINCT FROM the new one, unlike
// topicPatchUpdateSql) so a rule whose live value has already drifted from
// "old" is left untouched rather than overwritten -- see the rule_patches
// section of the header comment.
function rulePatchUpdateSql(ruleIdVal, field, oldValue, newValue) {
  const oldLit = RULE_PATCH_FIELD_SQL[field](oldValue);
  const newLit = RULE_PATCH_FIELD_SQL[field](newValue);
  return `UPDATE public.grammar_rules SET ${field} = ${newLit}
WHERE id = ${sqlStr(ruleIdVal)}::uuid AND ${field} = ${oldLit};`;
}

// ---------------------------------------------------------------------------
// Cache loading
// ---------------------------------------------------------------------------

function loadCache(cachePath) {
  const resolved = resolve(cachePath);
  const cacheRaw = readFileSync(resolved, 'utf8');
  const cacheParsed = JSON.parse(cacheRaw);
  if (JSON.stringify(cacheParsed) !== cacheRaw) {
    console.error(
      `${cachePath} does not round-trip losslessly through JSON.parse/JSON.stringify -- ` +
      'refusing to read it (the file may be pretty-printed, have a different key order than ' +
      'JSON.stringify would produce, or otherwise not match the dump-grammar-cache.mjs single-line format).',
    );
    process.exit(1);
  }
  return cacheParsed;
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
    const mode = parsed && typeof parsed === 'object' && parsed.extend ? 'extend' : 'create';
    return { path, doc: parsed, mode };
  });

  // Load the cache up front (if given) so EXTEND validation can use it even
  // under --check. In the full pipeline --cache is mandatory (parseArgs), so
  // this always runs there.
  const cache = args.cache ? loadCache(args.cache) : null;

  const allErrors = [];
  for (const { path, doc, mode } of docs) {
    allErrors.push(...(mode === 'extend' ? validateExtendJson(doc, path, cache) : validateTopicJson(doc, path)));
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

  // Cross-file checks: CREATE slugs/topic_orders must not collide with each
  // other; EXTEND targets (slug+sub_level) must not repeat; and no slug may
  // be both created and extended in the same run.
  const createSlugs = new Set();
  const orders = new Set();
  const extendTargets = new Set();
  for (const { path, doc, mode } of docs) {
    if (mode === 'create') {
      if (createSlugs.has(doc.topic.slug)) {
        console.error(`Duplicate slug "${doc.topic.slug}" across input files (from ${path})`);
        process.exit(1);
      }
      createSlugs.add(doc.topic.slug);
      if (orders.has(doc.topic.topic_order)) {
        console.error(`Duplicate topic_order ${doc.topic.topic_order} across input files (from ${path})`);
        process.exit(1);
      }
      orders.add(doc.topic.topic_order);
    } else {
      const key = `${doc.extend.slug}::${doc.extend.sub_level}`;
      if (extendTargets.has(key)) {
        console.error(`Duplicate extend target "${doc.extend.slug}" (${doc.extend.sub_level}) across input files (from ${path})`);
        process.exit(1);
      }
      extendTargets.add(key);
    }
  }
  for (const { path, doc, mode } of docs) {
    if (mode === 'create' && extendTargets.has(`${doc.topic.slug}::${doc.topic.sub_level}`)) {
      console.error(`Slug "${doc.topic.slug}" is both created and extended in the same run (from ${path}) -- not allowed`);
      process.exit(1);
    }
  }

  // ---- Build rows -----------------------------------------------------
  const createTopicRows = [];
  const createRuleRows = [];
  const createExampleRows = [];
  const createExerciseRows = [];
  const createSummaries = [];

  const extendRuleRows = [];
  const extendExampleRows = [];
  const extendExerciseRows = [];
  const patchActions = []; // { topicId, slug, subLevel, fields: [{field, value}] }
  const rulePatchActions = []; // { ruleId, field, old, new }
  const extendSummaries = [];

  for (const { path, doc, mode } of docs) {
    if (mode === 'create') {
      const { topic, rules, examples, exercises } = doc;
      const tRow = buildTopicRow(topic);
      createTopicRows.push(tRow);

      const ruleRows = rules
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((r) => buildRuleRow((oi) => ruleId(topic.slug, oi), tRow.id, r));
      createRuleRows.push(...ruleRows);

      const exampleRows = examples
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((e) => buildExampleRow((oi) => exampleId(topic.slug, oi), tRow.id, e));
      createExampleRows.push(...exampleRows);

      const exerciseRows = exercises
        .slice()
        .sort((a, b) => a.stage - b.stage || a.order_index - b.order_index)
        .map((e) => buildExerciseRow((stage, oi) => exerciseId(topic.slug, stage, oi), tRow.id, e));
      createExerciseRows.push(...exerciseRows);

      createSummaries.push({
        slug: topic.slug,
        id: tRow.id,
        topic_order: topic.topic_order,
        rules: ruleRows.length,
        examples: exampleRows.length,
        exercises: exerciseRows.length,
        typed: exerciseRows.filter((e) => e.exercise_type !== 'multiple_choice').length,
      });
    } else {
      const { extend: ext, topic_patch: patch, rules = [], examples = [], exercises = [], rule_patches: rulePatches = [] } = doc;
      const existingTopic = cache.topics.find((t) => t.slug === ext.slug && t.sub_level === ext.sub_level);
      if (!existingTopic) {
        console.error(`${path}: no existing topic found in cache for slug "${ext.slug}" at sub_level "${ext.sub_level}" -- aborting`);
        process.exit(1);
      }
      const topicIdVal = existingTopic.id;

      const ruleRows = rules
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((r) => buildRuleRow((oi) => extendRuleId(ext.slug, oi), topicIdVal, r));
      extendRuleRows.push(...ruleRows);

      const exampleRows = examples
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((e) => buildExampleRow((oi) => extendExampleId(ext.slug, oi), topicIdVal, e));
      extendExampleRows.push(...exampleRows);

      const exerciseRows = exercises
        .slice()
        .sort((a, b) => a.stage - b.stage || a.order_index - b.order_index)
        .map((e) => buildExerciseRow((stage, oi) => extendExerciseId(ext.slug, stage, oi), topicIdVal, e));
      extendExerciseRows.push(...exerciseRows);

      const fields = patch ? Object.keys(patch).map((field) => ({ field, value: patch[field] })) : [];
      if (fields.length) {
        patchActions.push({ topicId: topicIdVal, slug: ext.slug, subLevel: ext.sub_level, fields });
      }

      // rule_patches: re-derive the same guard validateExtendJson already
      // ran (rule exists on this topic, "old" matches the cache exactly)
      // rather than trust the earlier pass -- cheap, and it is what actually
      // decides what SQL/cache mutation gets built below.
      for (const rp of rulePatches) {
        const rule = cache.rules.find((r) => r.id === rp.rule_id && r.topic_id === topicIdVal);
        if (!rule) {
          console.error(`${path}: rule_patches rule_id "${rp.rule_id}" is not an existing rule on topic "${ext.slug}" -- aborting`);
          process.exit(1);
        }
        if (JSON.stringify(rule[rp.field]) !== JSON.stringify(rp.old)) {
          console.error(`${path}: rule_patches "old" for rule ${rp.rule_id} field "${rp.field}" does not match the cache's current value -- aborting`);
          process.exit(1);
        }
        rulePatchActions.push({ ruleId: rp.rule_id, field: rp.field, old: rp.old, new: rp.new });
      }

      extendSummaries.push({
        slug: ext.slug,
        sub_level: ext.sub_level,
        id: topicIdVal,
        rules: ruleRows.length,
        examples: exampleRows.length,
        exercises: exerciseRows.length,
        typed: exerciseRows.filter((e) => e.exercise_type !== 'multiple_choice').length,
        patched: fields.map((f) => f.field),
        rulePatched: rulePatches.map((rp) => `${rp.rule_id}:${rp.field}`),
      });
    }
  }

  const allRuleRows = [...createRuleRows, ...extendRuleRows];
  const allExampleRows = [...createExampleRows, ...extendExampleRows];
  const allExerciseRows = [...createExerciseRows, ...extendExerciseRows];

  // topic_order CHECK widening: only in CREATE mode, and only when a created
  // topic's topic_order is above the current 1..8 range -- otherwise the
  // ALTER TABLE pair is not emitted at all (a pure EXTEND run, or a CREATE
  // run whose topic_order values all fit in the existing range, never
  // touches the constraint).
  const createTopicOrders = createTopicRows.map((t) => t.topic_order);
  const maxCreateTopicOrder = createTopicOrders.length ? Math.max(...createTopicOrders) : 0;
  const needsCheckWiden = maxCreateTopicOrder > 8;

  // ---- Migration --------------------------------------------------------
  const generatedAt = new Date().toISOString();
  const sqlParts = [];

  const headerLines = [];
  headerLines.push(`-- Grammar content migration generated by scripts/grammar-topics-from-json.mjs on ${generatedAt}.`);
  if (createSummaries.length) {
    headerLines.push('--');
    headerLines.push(`-- Creates ${createSummaries.length} new grammar topic(s):`);
    for (const s of createSummaries) {
      headerLines.push(`--   - ${s.slug} (topic_order ${s.topic_order}): ${s.rules} rule(s), ${s.examples} example(s), ${s.exercises} exercise(s)`);
    }
  }
  if (extendSummaries.length) {
    headerLines.push('--');
    headerLines.push(`-- Extends ${extendSummaries.length} existing grammar topic(s):`);
    for (const s of extendSummaries) {
      const patchNote = s.patched.length ? `, patches [${s.patched.join(', ')}]` : '';
      const rulePatchNote = s.rulePatched.length ? `, rule_patches [${s.rulePatched.join(', ')}]` : '';
      headerLines.push(`--   - ${s.slug} (${s.sub_level}): +${s.rules} rule(s), +${s.examples} example(s), +${s.exercises} exercise(s)${patchNote}${rulePatchNote}`);
    }
  }
  if (needsCheckWiden) {
    headerLines.push('--');
    headerLines.push(`-- Widens grammar_topics_topic_order_check from 1..8 to 1..${maxCreateTopicOrder}`);
    headerLines.push('-- to admit the new topic_order value(s) above; (sub_level, topic_order) stays');
    headerLines.push('-- UNIQUE and untouched, and every sub_level whose rows never exceed 8 is');
    headerLines.push('-- unaffected -- the wider CHECK is a strict relaxation for everyone else.');
  }
  headerLines.push('--');
  headerLines.push('-- All row ids are UUID v5, deterministic from the topic slug and row key (see');
  headerLines.push('-- the script header for the exact naming scheme per mode) -- re-running this');
  headerLines.push('-- generator against the SAME input JSON reproduces the SAME ids, so this');
  headerLines.push('-- migration stays a safe re-run: every INSERT is guarded by WHERE NOT EXISTS');
  headerLines.push('-- (id), and every topic_patch UPDATE by an IS DISTINCT FROM guard on the old');
  headerLines.push('-- value, so applying this file twice is a no-op the second time.');
  headerLines.push('--');
  headerLines.push('-- Fixed timestamp: every created_at/updated_at below is the literal');
  headerLines.push(`-- ${FIXED_TIMESTAMP} chosen for this batch, matching the same literal baked`);
  headerLines.push('-- into the cache rows this migration\'s counterpart patches into');
  headerLines.push('-- grammar-content-cache.json -- so cache and (once applied) DB agree exactly.');
  headerLines.push('--');
  headerLines.push('-- Idempotent: every INSERT is guarded by WHERE NOT EXISTS (id); every UPDATE');
  headerLines.push('-- by IS DISTINCT FROM (old value)' + (needsCheckWiden ? '; the ALTER TABLE pair (DROP IF EXISTS, then ADD) is itself idempotent to re-run.' : '.'));

  let beginBlock = headerLines.join('\n') + '\n\nBEGIN;\n';
  if (needsCheckWiden) {
    beginBlock +=
      `\nALTER TABLE public.grammar_topics DROP CONSTRAINT IF EXISTS grammar_topics_topic_order_check;\n` +
      `ALTER TABLE public.grammar_topics ADD CONSTRAINT grammar_topics_topic_order_check CHECK (topic_order >= 1 AND topic_order <= ${maxCreateTopicOrder});\n`;
  }
  sqlParts.push(beginBlock);

  if (createTopicRows.length) {
    sqlParts.push('-- Topics\n' + createTopicRows.map(topicInsertSql).join('\n\n'));
  }
  if (patchActions.length) {
    const patchSql = patchActions
      .flatMap((a) => a.fields.map((f) => topicPatchUpdateSql(a.topicId, f.field, f.value)))
      .join('\n\n');
    sqlParts.push('-- Topic patches (EXTEND mode)\n' + patchSql);
  }
  if (rulePatchActions.length) {
    const rulePatchSql = rulePatchActions
      .map((a) => rulePatchUpdateSql(a.ruleId, a.field, a.old, a.new))
      .join('\n\n');
    sqlParts.push('-- Rule patches (EXTEND mode)\n' + rulePatchSql);
  }
  sqlParts.push('-- Rules\n' + allRuleRows.map(ruleInsertSql).join('\n\n'));
  sqlParts.push('-- Examples\n' + allExampleRows.map(exampleInsertSql).join('\n\n'));
  sqlParts.push('-- Exercises\n' + allExerciseRows.map(exerciseInsertSql).join('\n\n'));
  sqlParts.push('\nCOMMIT;\n');

  writeFileSync(resolve(args.migration), sqlParts.join('\n\n') + '\n');

  // ---- Cache patch --------------------------------------------------------
  // cache was already loaded (and round-trip-checked) above.
  const cacheParsed = cache;

  const newIds = new Set([
    ...createTopicRows.map((r) => r.id),
    ...allRuleRows.map((r) => r.id),
    ...allExampleRows.map((r) => r.id),
    ...allExerciseRows.map((r) => r.id),
  ]);

  // New rows: appended at the end of each array, same as CREATE mode always
  // did (dump-grammar-cache.mjs re-dumps ordered by id, so this is already a
  // pre-existing divergence from a byte-identical re-dump, not one this mode
  // introduces -- see notes.md).
  cacheParsed.topics = cacheParsed.topics.filter((r) => !newIds.has(r.id)).concat(createTopicRows);
  cacheParsed.rules = cacheParsed.rules.filter((r) => !newIds.has(r.id)).concat(allRuleRows);
  cacheParsed.examples = cacheParsed.examples.filter((r) => !newIds.has(r.id)).concat(allExampleRows);
  cacheParsed.exercises = cacheParsed.exercises.filter((r) => !newIds.has(r.id)).concat(allExerciseRows);

  // topic_patch: mutate the EXISTING topic row in place (same array position)
  // -- this is not a new row, so it must not be filtered-and-appended.
  for (const action of patchActions) {
    const row = cacheParsed.topics.find((t) => t.id === action.topicId);
    for (const { field, value } of action.fields) row[field] = value;
    row.updated_at = FIXED_TIMESTAMP;
  }

  // rule_patches: mutate the EXISTING rule row in place (same array
  // position), same reasoning as topic_patch above -- not a new row.
  for (const action of rulePatchActions) {
    const row = cacheParsed.rules.find((r) => r.id === action.ruleId);
    row[action.field] = action.new;
  }
  // dumpedAt is left untouched -- it records when the cache was last pulled from
  // the live DB, and this patch is a local, pre-apply projection of a migration
  // that has not been run against that DB yet.

  writeFileSync(resolve(args.cache), JSON.stringify(cacheParsed));

  // ---- Summary --------------------------------------------------------
  console.log(`Wrote ${args.migration}`);
  console.log(`Patched ${args.cache}`);
  console.log('');
  for (const s of createSummaries) {
    console.log(
      `[create] ${s.slug} (topic_order ${s.topic_order}): id=${s.id} rules=${s.rules} examples=${s.examples} exercises=${s.exercises} (typed=${s.typed})`,
    );
  }
  for (const s of extendSummaries) {
    console.log(
      `[extend] ${s.slug} (${s.sub_level}): id=${s.id} +rules=${s.rules} +examples=${s.examples} +exercises=${s.exercises} (typed=${s.typed})` +
      (s.patched.length ? ` patched=[${s.patched.join(', ')}]` : '') +
      (s.rulePatched.length ? ` rule_patched=[${s.rulePatched.join(', ')}]` : ''),
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
