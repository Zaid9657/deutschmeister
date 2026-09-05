#!/usr/bin/env node
// Wortliste: turn the author's addition/fix JSON into an idempotent SQL
// migration against public.words (Course Factory). The level a migration
// targets is derived from the additions file, not hardcoded — this script
// wrote the A1.1 Wortliste (Wave 2, PR B) first and the A1.2 Wortliste
// (Wave 3, PR B) second, using the same code path both times.
//
// Inputs (see tests/a1-1-wortliste.test.mjs and tests/a1-2-wortliste.test.mjs
// for the shape this script and the migrations it writes are pinned
// against):
//   --additions <file>   JSON array of {german, english, article, plural,
//                         category, example_sentence, level} — new rows, all
//                         sharing one level (e.g. all "a1.1" or all "a1.2").
//   --fixes <file>        JSON array of {id, field, old, new, reason} — one
//                         guarded UPDATE per entry against a live row by id.
//   --out <file>          where to write the .sql migration.
//   --wave-label <text>   optional; parenthesised after the migration's
//                         title line (e.g. "Course Factory Wave 3, PR B").
//                         Omit to leave that line unqualified.
//
// Usage:
//   node scripts/words-from-json.mjs --additions <additions.json> --fixes <fixes.json> --out <migration.sql> [--wave-label <text>]
//
// Re-run contract: every INSERT is guarded by
//   WHERE NOT EXISTS (SELECT 1 FROM public.words WHERE german = ... AND level = ... AND category = ...)
// (the table's live UNIQUE (german, level, category)), and every UPDATE is
// guarded by WHERE id = '<id>' AND <field> IS NOT DISTINCT FROM <old> — so a
// second run against an already-migrated database is a no-op for every
// statement. `id` uses the table's own default (gen_random_uuid()), so
// re-running this generator does NOT reproduce the same ids for additions
// (unlike scripts/grammar-topics-from-json.mjs's deterministic UUID v5) —
// that's fine here because the guard is on (german, level, category), not id.
//
// Rollback: fixes — re-run each UPDATE with SET and the guard value swapped
// (old value in SET, new value in the IS NOT DISTINCT FROM guard); additions —
// there is no id to key a rollback DELETE on before this runs, and once
// applied, words.id may already be referenced by vocab_srs_cards.word_id, so
// prefer leaving additions in place over deleting by (german, level, category).

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--additions') args.additions = argv[++i];
    else if (a === '--fixes') args.fixes = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--wave-label') args.waveLabel = argv[++i];
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!args.additions || !args.fixes || !args.out) {
    throw new Error('--additions, --fixes and --out are all required');
  }
  return args;
}

// SQL literal helper (doubled-quote escaping, same convention as
// scripts/grammar-topics-from-json.mjs).
const sqlStr = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

function additionInsertSql(row) {
  return `INSERT INTO public.words (level, german, english, article, plural, category, example_sentence)
SELECT ${sqlStr(row.level)}, ${sqlStr(row.german)}, ${sqlStr(row.english)}, ${sqlStr(row.article)}, ${sqlStr(row.plural)}, ${sqlStr(row.category)}, ${sqlStr(row.example_sentence)}
WHERE NOT EXISTS (
  SELECT 1 FROM public.words WHERE german = ${sqlStr(row.german)} AND level = ${sqlStr(row.level)} AND category = ${sqlStr(row.category)}
);`;
}

function fixUpdateSql(fix) {
  return `UPDATE public.words SET ${fix.field} = ${sqlStr(fix.new)}
WHERE id = ${sqlStr(fix.id)}::uuid AND ${fix.field} IS NOT DISTINCT FROM ${sqlStr(fix.old)};`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  const additions = JSON.parse(readFileSync(resolve(args.additions), 'utf8'));
  const fixes = JSON.parse(readFileSync(resolve(args.fixes), 'utf8'));

  if (!Array.isArray(additions)) throw new Error(`${args.additions}: expected a JSON array`);
  if (!Array.isArray(fixes)) throw new Error(`${args.fixes}: expected a JSON array`);
  if (additions.length === 0) throw new Error(`${args.additions}: expected at least one addition (to derive the level from)`);

  // The level is derived from the additions themselves (not hardcoded), so
  // this script runs unchanged for any level's Wortliste batch — but every
  // addition in one batch must agree on it.
  const level = additions[0].level;
  for (const row of additions) {
    if (row.level !== level) {
      throw new Error(`Addition "${row.german}" has level "${row.level}", expected "${level}" (from the first row)`);
    }
    if (row.plural === 'null') {
      throw new Error(`Addition "${row.german}" has plural literal string "null" — use JSON null instead`);
    }
    if (!row.german || !row.english || !row.category) {
      throw new Error(`Addition ${JSON.stringify(row)} is missing a required field (german/english/category)`);
    }
  }
  for (const fix of fixes) {
    if (!fix.id || !fix.field) {
      throw new Error(`Fix ${JSON.stringify(fix)} is missing id/field`);
    }
  }

  const levelUpper = level.toUpperCase();

  const perCategory = new Map();
  for (const row of additions) perCategory.set(row.category, (perCategory.get(row.category) || 0) + 1);

  const perFixField = new Map();
  for (const fix of fixes) perFixField.set(fix.field, (perFixField.get(fix.field) || 0) + 1);

  const generatedAt = new Date().toISOString();
  const titleSuffix = args.waveLabel ? ` (${args.waveLabel})` : '';
  const parts = [];
  parts.push(`-- ${levelUpper} Wortliste: adds ${additions.length} new vocabulary rows and fixes ${fixes.length}
-- defective live rows${titleSuffix}.
--
-- What:
--   1. ${additions.length} INSERTs into public.words at level '${level}' across
--      ${perCategory.size} categories: ${[...perCategory.entries()].map(([c, n]) => `${c} (${n})`).join(', ')}.
--      See the source additions JSON and scratchpad vocab/notes.md for the
--      per-category rationale and the pre-existing dupes deliberately
--      skipped.
--   2. ${fixes.length} guarded UPDATEs against live ${level} rows, touching
--      ${[...perFixField.entries()].map(([f, n]) => `${f} (${n})`).join(', ')}
--      — see the reason recorded against each id in the source fixes JSON
--      and (for each individual UPDATE) inline below.
--
-- Re-run contract: every INSERT is guarded by
--   WHERE NOT EXISTS (SELECT 1 FROM public.words WHERE german = ... AND level = ... AND category = ...)
-- (the table's live UNIQUE (german, level, category)); every UPDATE is
-- guarded by WHERE id = '<id>' AND <field> IS NOT DISTINCT FROM <old-value>,
-- so applying this file twice, or applying it after any of these rows were
-- already fixed by hand, is a no-op. \`id\` is left to the table's own
-- gen_random_uuid() default on every INSERT.
--
-- How to test: apply by hand in the Supabase SQL editor, then run the
-- verification SELECTs at the bottom of this file.
--
-- Rollback: fixes — re-run each UPDATE with SET and the guard value swapped
-- (old value in SET, new value in the IS NOT DISTINCT FROM guard) — the old
-- value for every fix is quoted verbatim in the source fixes JSON. Additions —
-- there is no id to key a rollback DELETE on before this runs; once applied,
-- words.id may already be referenced by vocab_srs_cards.word_id, so prefer
-- leaving additions in place over deleting by (german, level, category).
--
-- Generated by scripts/words-from-json.mjs on ${generatedAt}.

BEGIN;

-- ===========================================================================
-- Additions: ${additions.length} new ${level} words
-- ===========================================================================

${additions.map(additionInsertSql).join('\n\n')}

-- ===========================================================================
-- Fixes: ${fixes.length} guarded UPDATEs against defective live rows
-- ===========================================================================

${fixes.map((f) => `-- ${f.reason}\n${fixUpdateSql(f)}`).join('\n\n')}

COMMIT;

-- Verification (run after applying):
-- Count of new rows per category (should be >= the counts in this file's header):
${[...perCategory.entries()]
  .map(
    ([cat]) =>
      `--   SELECT count(*) FROM public.words WHERE level = '${level}' AND category = ${sqlStr(cat)}; -- expect >= ${perCategory.get(cat)}`,
  )
  .join('\n')}
-- Literal-string "null" plurals at ${level} (expect 0):
--   SELECT count(*) FROM public.words WHERE level = '${level}' AND plural = 'null';
-- Article baked into the german column at ${level} (expect 0):
--   SELECT count(*) FROM public.words WHERE level = '${level}' AND (german LIKE 'der %' OR german LIKE 'die %' OR german LIKE 'das %');
`);

  writeFileSync(resolve(args.out), parts.join('\n'));

  console.log(`Wrote ${args.out}`);
  console.log(`${additions.length} additions, ${fixes.length} fixes`);
  console.log('Per-category additions:', Object.fromEntries(perCategory));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
