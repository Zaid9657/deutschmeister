// Generate a reading_lessons migration from two review JSON files
// (Course Factory content pipeline; default out path below is the A1.1
// example from the wave this script was first written for — always pass
// an explicit out.sql for any other level):
//
//   1. a rewrites file: an array of objects keyed by the LIVE reading_lessons
//      row id, each carrying the new title_de/title_en/content_de/content_en/
//      key_vocabulary/questions/checks/word_count/estimated_reading_time.
//      Emitted as guarded UPDATEs (`AND checks IS NULL`), so a re-run is a
//      no-op once applied.
//   2. an exam-format file: an array of brand-new reading_lessons rows
//      (level/topic/title_de/title_en/content_de/content_en/key_vocabulary/
//      questions/checks/word_count/difficulty/order_index). Emitted as
//      `INSERT ... SELECT ... WHERE NOT EXISTS (level + title_de)`.
//
// Usage:
//   node scripts/reading-from-json.mjs <rewrites.json> <exam-format.json> [out.sql]
//
// Both inputs are read fresh each run, so re-running against an updated
// review file regenerates the migration from scratch (idempotent by
// construction — the emitted SQL is itself idempotent, guarded per statement).
import { readFileSync, writeFileSync } from 'node:fs';

const [, , rewritesPath, examPath, outPath = 'migrations/2026-09-05-a1-1-reading.sql'] = process.argv;

if (!rewritesPath || !examPath) {
  console.error('Usage: node scripts/reading-from-json.mjs <rewrites.json> <exam-format.json> [out.sql]');
  process.exit(1);
}

const rewrites = JSON.parse(readFileSync(rewritesPath, 'utf8'));
const examRows = JSON.parse(readFileSync(examPath, 'utf8'));

// ---------------------------------------------------------------------------
// SQL literal helpers
// ---------------------------------------------------------------------------

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlJson = (value) => `${sqlStr(JSON.stringify(value))}::jsonb`;
const sqlNum = (n) => (n === null || n === undefined ? 'NULL' : String(n));

const CHECK_TYPES = new Set(['rf', 'choice']);
const RF_ANSWERS = new Set(['richtig', 'falsch']);

function validateChecks(checks, label) {
  if (!Array.isArray(checks) || checks.length === 0) {
    throw new Error(`${label}: checks must be a non-empty array`);
  }
  for (const c of checks) {
    if (!CHECK_TYPES.has(c.type)) {
      throw new Error(`${label}: check has unknown type ${c.type}`);
    }
    if (c.type === 'rf' && !RF_ANSWERS.has(c.answer)) {
      throw new Error(`${label}: rf check has invalid answer ${c.answer}`);
    }
    if (c.type === 'choice' && !Array.isArray(c.options)) {
      throw new Error(`${label}: choice check missing options`);
    }
    if (c.type === 'choice' && !c.options.includes(c.answer)) {
      throw new Error(`${label}: choice check answer ${c.answer} not among options`);
    }
  }
}

// ---------------------------------------------------------------------------
// Part 1: rewrites → guarded UPDATEs by id
// ---------------------------------------------------------------------------

const REWRITE_REQUIRED = [
  'id', 'title_de', 'title_en', 'content_de', 'content_en',
  'key_vocabulary', 'questions', 'checks', 'word_count', 'estimated_reading_time',
];

const updateStatements = rewrites.map((row) => {
  for (const k of REWRITE_REQUIRED) {
    if (row[k] == null) throw new Error(`rewrite ${row.id ?? '?'}: missing ${k}`);
  }
  validateChecks(row.checks, `rewrite ${row.id}`);

  return `UPDATE public.reading_lessons SET
  title_de = ${sqlStr(row.title_de)},
  title_en = ${sqlStr(row.title_en)},
  content_de = ${sqlStr(row.content_de)},
  content_en = ${sqlStr(row.content_en)},
  key_vocabulary = ${sqlJson(row.key_vocabulary)},
  questions = ${sqlJson(row.questions)},
  checks = ${sqlJson(row.checks)},
  word_count = ${sqlNum(row.word_count)},
  estimated_reading_time = ${sqlNum(row.estimated_reading_time)}
WHERE id = ${sqlStr(row.id)}
  AND checks IS NULL; -- idempotency guard: a re-run after this migration has
                       -- already applied is a no-op`;
});

// ---------------------------------------------------------------------------
// Part 2: exam-format rows → guarded INSERTs by (level, title_de)
// ---------------------------------------------------------------------------

const INSERT_REQUIRED = [
  'level', 'topic', 'title_de', 'title_en', 'content_de', 'content_en',
  'key_vocabulary', 'questions', 'checks', 'word_count', 'difficulty',
  'estimated_reading_time', 'order_index',
];

const insertStatements = examRows.map((row) => {
  for (const k of INSERT_REQUIRED) {
    if (row[k] == null) throw new Error(`exam-format row ${row.title_de ?? '?'}: missing ${k}`);
  }
  validateChecks(row.checks, `exam-format row ${row.title_de}`);

  return `INSERT INTO public.reading_lessons
  (level, title_de, title_en, topic, content_de, content_en, key_vocabulary, questions, checks, word_count, difficulty, estimated_reading_time, order_index)
SELECT
  ${sqlStr(row.level)}, ${sqlStr(row.title_de)}, ${sqlStr(row.title_en)}, ${sqlStr(row.topic)},
  ${sqlStr(row.content_de)}, ${sqlStr(row.content_en)},
  ${sqlJson(row.key_vocabulary)}, ${sqlJson(row.questions)}, ${sqlJson(row.checks)},
  ${sqlNum(row.word_count)}, ${sqlNum(row.difficulty)}, ${sqlNum(row.estimated_reading_time)}, ${sqlNum(row.order_index)}
WHERE NOT EXISTS (
  SELECT 1 FROM public.reading_lessons WHERE level = ${sqlStr(row.level)} AND title_de = ${sqlStr(row.title_de)}
);`;
});

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

const level = examRows[0]?.level ?? 'unknown-level';
const totalRows = rewrites.length + examRows.length;
const examTitleList = examRows.map((r) => `'${r.title_de.replace(/'/g, "''")}'`).join(', ');

const sql = `-- ${level} reading: ${rewrites.length} rewritten lessons get auto-checkable
-- "checks" items (Richtig/Falsch and exam-style choice) plus ${examRows.length} brand-new
-- exam-format lessons. Course Factory content pipeline.
--
-- Generated by scripts/reading-from-json.mjs from the reviewed JSON — do not
-- hand-edit; regenerate instead. Idempotent: every UPDATE is guarded by
-- \`AND checks IS NULL\` (a no-op once applied) and every INSERT by
-- \`WHERE NOT EXISTS\` on (level, title_de).
--
-- How to test: apply by hand in the Supabase SQL editor, then:
--   SELECT id, title_de, jsonb_array_length(checks) FROM public.reading_lessons
--   WHERE level = '${level}' ORDER BY order_index;
-- should show ${totalRows} rows, all with a non-null \`checks\` array (the rewrites keep
-- their reviewed check count, the new exam-format lessons carry theirs).
-- Rollback: \`UPDATE public.reading_lessons SET checks = NULL WHERE id IN (...)\`
-- for the ${rewrites.length} ids above, and \`DELETE ... WHERE level = '${level}' AND title_de IN
-- (${examTitleList})\`
-- for the ${examRows.length} inserts. The ADD COLUMN is left in place (a null column is inert).

BEGIN;

ALTER TABLE public.reading_lessons ADD COLUMN IF NOT EXISTS checks jsonb;

-- ---------------------------------------------------------------------------
-- Rewrites (${rewrites.length} rows, guarded by id + checks IS NULL)
-- ---------------------------------------------------------------------------

${updateStatements.join('\n\n')}

-- ---------------------------------------------------------------------------
-- New exam-format lessons (${examRows.length} rows, guarded by level + title_de)
-- ---------------------------------------------------------------------------

${insertStatements.join('\n\n')}

COMMIT;
`;

writeFileSync(outPath, sql);
console.log(`wrote ${outPath}: ${updateStatements.length} UPDATEs, ${insertStatements.length} INSERTs`);
