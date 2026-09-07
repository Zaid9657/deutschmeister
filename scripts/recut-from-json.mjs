#!/usr/bin/env node
// Course Factory Wave 6, PR A — turn reviewed in-place patches into a guarded migration and a
// matching grammar-content-cache.json edit.
//
//   node scripts/recut-from-json.mjs --patches S/recut/patches.json [--relevel S/vocab/relevel.json]
//        --migration migrations/2026-09-07-a2-2-legacy-recut.sql --cache grammar-content-cache.json
//        [--header S/recut/header.sql]
//
// --header: a file whose text replaces the default (Wave 6, A2.2) comment block at the top of the
// migration, so a later wave's re-cut (Wave 7 PR A2 reuses this for two B1.1 exercises) documents
// its own what/why. The file is emitted verbatim, followed by BEGIN;.
//
// patches.json: [{ table: 'grammar_rules'|'grammar_examples'|'grammar_exercises', id, field, old, new, why }]
// relevel.json: [{ id, german, old_level, new_level, category, reason }]  (words rows; only `level` moves)
//
// Every UPDATE is guarded on the OLD value (`WHERE id = … AND <field> = <old>`), so a drifted live
// row is a silent no-op and a re-run is idempotent — the same contract as
// migrations/2026-09-04-a1-grammar-fixes.sql and the generator's rule_patches. Nothing is inserted
// or deleted: tests/a2-2-typed-production.test.mjs pins the per-topic counts and the contiguous
// exercise order_index, so a re-cut can only ever edit in place. The cache is patched with the
// identical values, which is what tests and the offline CI Astro build read; the live UPDATE is what
// the Netlify build reads.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const patchesPath = opt('--patches');
const relevelPath = opt('--relevel');
const migrationPath = opt('--migration');
const cachePath = opt('--cache');
const headerPath = opt('--header');
if (!patchesPath || !migrationPath || !cachePath) {
  console.error('usage: --patches <json> [--relevel <json>] --migration <sql> --cache <json>');
  process.exit(2);
}

const TABLES = { grammar_rules: 'rules', grammar_examples: 'examples', grammar_exercises: 'exercises' };
const JSONB = new Set(['content', 'common_mistakes', 'options', 'acceptable_answers', 'word_breakdown']);
const FIELDS = {
  grammar_rules: new Set(['content', 'common_mistakes', 'title_en', 'title_de', 'memory_trick_en', 'memory_trick_de', 'formal_note_en', 'formal_note_de', 'key_insight_en', 'key_insight_de']),
  grammar_examples: new Set(['sentence_de', 'sentence_en', 'grammar_highlight', 'explanation_en', 'explanation_de', 'word_breakdown']),
  grammar_exercises: new Set(['question_de', 'question_en', 'options', 'correct_answer', 'acceptable_answers', 'explanation_en', 'explanation_de', 'hint', 'why_correct_en', 'why_correct_de', 'related_rule_title']),
};
const WORD_LEVELS = new Set(['a2.2', 'b1.1', 'b1.2', 'b2.1']);

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lit = (field, v) => {
  if (v === null || v === undefined) return 'NULL';
  return JSONB.has(field) ? `${q(JSON.stringify(v))}::jsonb` : q(v);
};
const guard = (field, v) => (v === null || v === undefined ? `${field} IS NULL` : `${field} = ${lit(field, v)}`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
const patches = JSON.parse(readFileSync(patchesPath, 'utf8'));
const relevel = relevelPath ? JSON.parse(readFileSync(relevelPath, 'utf8')) : [];

const errors = [];
const seen = new Set();
const stmts = [];
let cacheEdits = 0;
for (const p of patches) {
  const arr = cache[TABLES[p.table]];
  if (!arr) { errors.push(`${p.id}: unknown table ${p.table}`); continue; }
  if (!FIELDS[p.table].has(p.field)) { errors.push(`${p.id}: field ${p.field} not patchable on ${p.table}`); continue; }
  const key = `${p.table}:${p.id}:${p.field}`;
  if (seen.has(key)) { errors.push(`${key}: duplicate patch`); continue; }
  seen.add(key);
  const row = arr.find((r) => r.id === p.id);
  if (!row) { errors.push(`${key}: id not in cache`); continue; }
  if (!same(row[p.field], p.old)) { errors.push(`${key}: old value does not match the cache`); continue; }
  if (same(p.old, p.new)) { errors.push(`${key}: old and new are identical`); continue; }
  if (p.field === 'options' && p.new !== null) {
    if (!Array.isArray(p.new) || p.new.length !== 4) errors.push(`${key}: MC options must stay 4`);
  }
  stmts.push(
    `UPDATE public.${p.table}\nSET ${p.field} = ${lit(p.field, p.new)}\nWHERE id = ${q(p.id)}::uuid\n  AND ${guard(p.field, p.old)};`
  );
  row[p.field] = p.new;
  cacheEdits++;
}
// Exercises: after all patches, an MC row must still carry its key among its options.
for (const p of patches) {
  if (p.table !== 'grammar_exercises') continue;
  const row = cache.exercises.find((r) => r.id === p.id);
  if (row && Array.isArray(row.options) && !row.options.includes(row.correct_answer)) {
    errors.push(`${p.id}: correct_answer ${JSON.stringify(row.correct_answer)} not among options after patching`);
  }
}
const wordStmts = [];
for (const r of relevel) {
  if (r.new_level === r.old_level) continue;
  if (!WORD_LEVELS.has(r.new_level)) { errors.push(`${r.id}: level ${r.new_level} not allowed`); continue; }
  if (r.old_level !== 'a2.2') { errors.push(`${r.id}: old_level must be a2.2`); continue; }
  wordStmts.push(`UPDATE public.words\nSET level = ${q(r.new_level)}\nWHERE id = ${q(r.id)}::uuid AND level = ${q(r.old_level)} AND german = ${q(r.german)};`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const header = headerPath ? readFileSync(headerPath, 'utf8').replace(/\s*$/, '\n\nBEGIN;\n\n') : `-- ============================================================================
-- A2.2 legacy re-cut — Course Factory Wave 6, PR A (docs/course-factory-tracker.md)
-- Generated by scripts/recut-from-json.mjs from the reviewed patches; do not hand-edit.
--
-- What this does and why: the live A2.2 topics subordinating-conjunctions,
-- subordinate-word-order and superlative predate the A2.2 level constraint
-- (docs/course-factory/wave5/level-a2.2.md) and taught B1 material inside a
-- paid A2.2 course — B1 subordinators (obwohl, während, bevor, nachdem, bis,
-- seit, als), the Präteritum of full verbs, a Plusquamperfekt and two Genitiv
-- forms, including an exercise whose answer key was the banned form. Every
-- offending string is replaced in place by an in-level equivalent that keeps
-- the row's teaching job; nothing is added or removed, so every count and
-- order_index pinned by tests/a2-2-typed-production.test.mjs is unchanged.
-- The words UPDATEs move B1/B2 "Prepositions" and out-of-Wortliste "Animals"
-- rows from a2.2 to the level where they belong (rows move, none is deleted).
--
-- Idempotent: every UPDATE is guarded on the OLD value and is a no-op once
-- applied or if the live row has drifted. Apply by hand (migrations/README.md).
--
-- Test (after applying): the SELECT sweep in tests/a2-2-legacy-recut.test.mjs's
-- header, and md5 over the patched rows vs grammar-content-cache.json.
-- Rollback: the inverse UPDATEs (swap SET/WHERE values) — none needed so far.
-- ============================================================================

BEGIN;

`;
writeFileSync(migrationPath, header + stmts.join('\n\n') + (wordStmts.length ? '\n\n-- Wortliste re-level\n\n' + wordStmts.join('\n\n') : '') + '\n\nCOMMIT;\n');
// Single-line, like scripts/dump-grammar-cache.mjs: grammar-topics-from-json.mjs refuses a cache that
// does not round-trip through JSON.stringify (Wave 6 wrote it pretty-printed and Wave 7 PR A hit that).
writeFileSync(cachePath, JSON.stringify(cache));
const per = {};
for (const p of patches) per[p.table] = (per[p.table] || 0) + 1;
console.log(`wrote ${migrationPath}: ${stmts.length} grammar UPDATEs ${JSON.stringify(per)}, ${wordStmts.length} words UPDATEs; cache edits ${cacheEdits}`);
