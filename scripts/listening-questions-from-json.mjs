// Generate a listening_questions migration from the review JSON
// (Course Factory content pipeline; default out path below is the A1.1
// example from the wave this script was first written for — always pass
// an explicit out.sql for any other level):
//
//   1. an additions file: an array of 78 new listening_questions rows
//      (exercise_id, exercise_number, dialogue_number, question_number,
//      question_text, question_type, options, correct_answer,
//      acceptable_answers, explanation) — question_number 11-23 on each of
//      the 6 A1.1 exercises, three of them 'dictation'.
//   2. an OPTIONAL existing-row-edits file: an array of
//      {id, field: 'options', old, new} patches to two already-live rows
//      (the author's last-round fixes). Emitted as guarded UPDATEs keyed on
//      the OLD value, so a re-run after the fix has landed is a no-op. Pass
//      "" (empty string) or omit the file to skip this section.
//
// Usage:
//   node scripts/listening-questions-from-json.mjs <additions.json> [edits.json] [out.sql]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const [, , additionsPath, editsArg, outArg] = process.argv;

if (!additionsPath) {
  console.error('Usage: node scripts/listening-questions-from-json.mjs <additions.json> [edits.json] [out.sql]');
  process.exit(1);
}

// The edits file is optional; if the second arg looks like an output path
// (ends in .sql) treat it as such and skip edits.
let editsPath = null;
let outPath = 'migrations/2026-09-05-a1-1-listening.sql';
if (editsArg && editsArg.endsWith('.sql')) {
  outPath = editsArg;
} else {
  editsPath = editsArg || null;
  if (outArg) outPath = outArg;
}

const additions = JSON.parse(readFileSync(additionsPath, 'utf8'));
const edits = editsPath && existsSync(editsPath) ? JSON.parse(readFileSync(editsPath, 'utf8')) : [];

// ---------------------------------------------------------------------------
// SQL literal helpers
// ---------------------------------------------------------------------------

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlJson = (value) => (value == null ? 'NULL' : `${sqlStr(JSON.stringify(value))}::jsonb`);
const sqlNullableStr = (s) => (s == null ? 'NULL' : sqlStr(s));

const VALID_TYPES = new Set(['multiple_choice', 'richtig_falsch', 'ja_nein', 'zuordnung', 'dictation']);

const REQUIRED = [
  'exercise_id', 'exercise_number', 'dialogue_number', 'question_number',
  'question_text', 'question_type', 'correct_answer',
];

for (const row of additions) {
  for (const k of REQUIRED) {
    if (row[k] == null) throw new Error(`question ${row.question_number ?? '?'} (exercise ${row.exercise_number ?? '?'}): missing ${k}`);
  }
  if (!VALID_TYPES.has(row.question_type)) {
    throw new Error(`question ${row.question_number}: unknown question_type ${row.question_type}`);
  }
  if (row.question_type === 'dictation') {
    if (row.options != null) throw new Error(`dictation question ${row.question_number}: options must be null`);
    if (!Array.isArray(row.acceptable_answers) || row.acceptable_answers.length === 0) {
      throw new Error(`dictation question ${row.question_number}: acceptable_answers must be a non-empty array`);
    }
  } else if (!Array.isArray(row.options) || row.options.length === 0) {
    throw new Error(`${row.question_type} question ${row.question_number}: options must be a non-empty array`);
  }
}

// ---------------------------------------------------------------------------
// Part 1: existing-row option edits (optional, guarded on the OLD value)
// ---------------------------------------------------------------------------

const editStatements = edits.map((e) => {
  if (e.field !== 'options') throw new Error(`existing-row edit ${e.id}: only the 'options' field is supported`);
  return `UPDATE public.listening_questions SET options = ${sqlJson(e.new)}
WHERE id = ${sqlStr(e.id)} AND options = ${sqlJson(e.old)};`;
});

// ---------------------------------------------------------------------------
// Part 2: 78 new rows, guarded by (exercise_id, question_number)
// ---------------------------------------------------------------------------

const insertStatements = additions.map((row) => {
  return `INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT
  ${sqlStr(row.exercise_id)}, ${row.dialogue_number}, ${row.question_number}, ${sqlStr(row.question_type)},
  ${sqlStr(row.question_text)}, ${sqlJson(row.options)}, ${sqlStr(row.correct_answer)},
  ${sqlJson(row.acceptable_answers)}, ${sqlNullableStr(row.explanation)}
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_questions
  WHERE exercise_id = ${sqlStr(row.exercise_id)} AND question_number = ${row.question_number}
);`;
});

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------

const constraintName = 'listening_questions_question_type_check';

const exerciseIds = [...new Set(additions.map((r) => r.exercise_id))];
const questionNumbers = additions.map((r) => r.question_number);
const minQ = Math.min(...questionNumbers);
const maxQ = Math.max(...questionNumbers);
const perExercise = exerciseIds.length ? Math.round(additions.length / exerciseIds.length) : additions.length;

const sql = `-- Listening: ${additions.length} new questions (${perExercise} per exercise, across
-- ${exerciseIds.length} exercises) including number/time/price dictation items, plus the
-- schema to support them. Course Factory content pipeline.
--
-- Generated by scripts/listening-questions-from-json.mjs from the reviewed
-- JSON — do not hand-edit; regenerate instead. Idempotent: the ALTERs use
-- IF NOT EXISTS / DROP+ADD CONSTRAINT (safe to re-run), the existing-row
-- edits are guarded on the OLD value, and every INSERT is guarded by
-- \`WHERE NOT EXISTS\` on (exercise_id, question_number).
--
-- How to test: apply by hand in the Supabase SQL editor, then:
--   SELECT exercise_id, count(*) FROM public.listening_questions
--   WHERE question_number BETWEEN ${minQ} AND ${maxQ} GROUP BY exercise_id;
-- should show ${exerciseIds.length} rows of ${perExercise} each (${additions.length} total).
-- Rollback: \`DELETE FROM public.listening_questions WHERE question_number
-- BETWEEN ${minQ} AND ${maxQ}\`; re-narrow the CHECK by dropping 'dictation' from the
-- VALUES list below and re-running the ALTER (only if no other level's rows
-- depend on it); the ADD COLUMN is left in place (a null column is inert).

BEGIN;

ALTER TABLE public.listening_questions ADD COLUMN IF NOT EXISTS acceptable_answers jsonb;

-- Widen the question_type CHECK to admit 'dictation'.
ALTER TABLE public.listening_questions DROP CONSTRAINT IF EXISTS ${constraintName};
ALTER TABLE public.listening_questions ADD CONSTRAINT ${constraintName}
  CHECK (question_type IN ('multiple_choice', 'richtig_falsch', 'ja_nein', 'zuordnung', 'dictation'));

-- ---------------------------------------------------------------------------
-- Existing-row option fixes (author's last-round review pass)
-- ---------------------------------------------------------------------------
${editStatements.length ? `\n${editStatements.join('\n\n')}\n` : '\n-- (none supplied at generation time)\n'}
-- ---------------------------------------------------------------------------
-- ${additions.length} new questions (${perExercise} per exercise: earlier question numbers
-- stay untouched; this adds question_number ${minQ}-${maxQ} per exercise, per the
-- reviewed set)
-- ---------------------------------------------------------------------------

${insertStatements.join('\n\n')}

COMMIT;
`;

writeFileSync(outPath, sql);
console.log(`wrote ${outPath}: ${editStatements.length} existing-row UPDATEs, ${insertStatements.length} INSERTs`);
