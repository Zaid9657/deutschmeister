// Guard suite for the A1.2 listening additions (Course Factory Wave 3, PR C):
// migrations/2026-09-05-a1-2-listening.sql.
//
// dictationMatches unit tests live in tests/a1-1-listening.test.mjs — the
// comparator is level-agnostic, so they are not duplicated here.
//
// What each pin defends:
//
//   1. THE SCHEMA CHANGES — the acceptable_answers column and the widened
//      question_type CHECK must be (re-)applied, idempotently, before any
//      dictation row can be written; re-running after the A1.1 migration has
//      already applied both is a safe no-op (IF NOT EXISTS / DROP+ADD).
//   2. VOLUME — 78 new questions, 13 per exercise across the 6 A1.2
//      exercises (10 existing + 13 new = 23 per exercise).
//   3. SHAPE BY TYPE — dictation rows carry options: null and a non-empty
//      acceptable_answers array; multiple_choice/richtig_falsch rows carry
//      the reverse.
//   4. THE GRID — richtig_falsch questions sit at question_number
//      12/14/16/18/20 and, summed across the six exercises, each of those
//      five positions is exactly 3 Richtig / 3 Falsch (never all-one-answer
//      at a fixed slot); multiple_choice questions sit at 11/13/15/17/19 and
//      every exercise's five MC answers use all three keys a/b/c at least
//      once.
//   5. THE TWO EXISTING-ROW EDITS — guarded UPDATEs keyed on the OLD options
//      value, so a re-run after the fix has landed is a no-op.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-2-listening.sql'), 'utf8');
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// Question text/explanations can themselves contain a literal ';' (German
// sentences do), so statements are cut at the NEXT statement's start line,
// never at the first ';' found.
function statementsStartingWith(pattern, text) {
  const allStarts = [
    ...text.matchAll(/^(?:UPDATE public\.listening_questions SET|INSERT INTO public\.listening_questions$)/gm),
  ].map((m) => m.index);
  const commitAt = text.indexOf('\nCOMMIT;');
  const boundaries = [...allStarts, commitAt === -1 ? text.length : commitAt];
  const mine = [...text.matchAll(pattern)].map((m) => m.index);
  return mine.map((start) => {
    const next = boundaries.find((b) => b > start);
    return text.slice(start, next);
  });
}

const inserts = statementsStartingWith(/^INSERT INTO public\.listening_questions$/gm, sqlNoComments);
const editUpdates = statementsStartingWith(/^UPDATE public\.listening_questions SET/gm, sqlNoComments);

test('the migration adds acceptable_answers and widens question_type before writing', () => {
  assert.match(sqlNoComments, /ALTER TABLE public\.listening_questions ADD COLUMN IF NOT EXISTS acceptable_answers jsonb;/);
  assert.match(sqlNoComments, /DROP CONSTRAINT IF EXISTS listening_questions_question_type_check/);
  assert.match(
    sqlNoComments,
    /ADD CONSTRAINT listening_questions_question_type_check\s*\n\s*CHECK \(question_type IN \('multiple_choice', 'richtig_falsch', 'ja_nein', 'zuordnung', 'dictation'\)\);/,
  );

  const addColumnAt = sqlNoComments.indexOf('ADD COLUMN IF NOT EXISTS acceptable_answers');
  const checkWidenAt = sqlNoComments.indexOf('ADD CONSTRAINT listening_questions_question_type_check');
  const firstInsertAt = sqlNoComments.indexOf('INSERT INTO public.listening_questions');
  assert.ok(addColumnAt < firstInsertAt && checkWidenAt < firstInsertAt, 'schema changes must precede the inserts');
});

test('78 new questions, exactly 13 per exercise', () => {
  assert.equal(inserts.length, 78, `expected 78 INSERTs, found ${inserts.length}`);

  const perExercise = {};
  for (const stmt of inserts) {
    const m = stmt.match(/SELECT\s*\n\s*'([0-9a-f-]{36})',/);
    assert.ok(m, 'insert is missing its exercise_id');
    perExercise[m[1]] = (perExercise[m[1]] || 0) + 1;
  }
  const counts = Object.values(perExercise);
  assert.equal(Object.keys(perExercise).length, 6, 'expected 6 distinct A1.2 exercises');
  for (const [exerciseId, count] of Object.entries(perExercise)) {
    assert.equal(count, 13, `exercise ${exerciseId} has ${count} new questions, expected 13`);
  }
  assert.equal(counts.reduce((a, b) => a + b, 0), 78);
});

test('every insert is guarded WHERE NOT EXISTS on (exercise_id, question_number)', () => {
  for (const stmt of inserts) {
    assert.match(
      stmt,
      /WHERE NOT EXISTS \(\s*SELECT 1 FROM public\.listening_questions\s*\n\s*WHERE exercise_id = '[0-9a-f-]{36}' AND question_number = \d+\s*\n\);/,
    );
  }
});

test('dictation rows carry acceptable_answers and null options; MC/RF rows carry the reverse', () => {
  for (const stmt of inserts) {
    const typeMatch = stmt.match(/'([a-z_]+)',\s*\n\s*'((?:[^']|'')*)',/);
    assert.ok(typeMatch, 'insert is missing its question_type');
    const questionType = typeMatch[1];

    const isDictation = questionType === 'dictation';
    if (isDictation) {
      assert.match(stmt, /,\s*NULL,\s*'[^']+',\s*\n\s*'((?:[^']|'')*)'::jsonb,/, 'dictation row must have options NULL and a jsonb acceptable_answers');
      const aaMatch = stmt.match(/,\s*NULL,\s*'[^']+',\s*\n\s*'((?:[^']|'')*)'::jsonb,/);
      const acceptable = JSON.parse(aaMatch[1].replace(/''/g, "'"));
      assert.ok(Array.isArray(acceptable) && acceptable.length > 0, 'dictation acceptable_answers must be a non-empty array');
    } else {
      assert.match(stmt, /'\[.*\]'::jsonb,\s*'[^']+',\s*\n\s*NULL,/, `${questionType} row must have jsonb options and acceptable_answers NULL`);
      if (questionType === 'richtig_falsch') {
        assert.match(stmt, /'\["Richtig","Falsch"\]'::jsonb/, 'richtig_falsch options must be exactly ["Richtig","Falsch"]');
      }
      if (questionType === 'multiple_choice') {
        assert.match(stmt, /'\["a\) /, 'multiple_choice options must start with "a) "');
      }
    }
  }
});

// ---------------------------------------------------------------------------
// The RF grid and MC key spread — parse exercise_id/question_number/
// question_type/correct_answer back out of each insert.
// ---------------------------------------------------------------------------

function parseInsert(stmt) {
  const m = stmt.match(
    /SELECT\s*\n\s*'([0-9a-f-]{36})', (\d+), (\d+), '([a-z_]+)',\s*\n\s*'(?:[^']|'')*', (?:'\[.*\]'::jsonb|NULL), '([^']+)',/,
  );
  assert.ok(m, `could not parse insert:\n${stmt.slice(0, 200)}`);
  return {
    exerciseId: m[1],
    dialogueNumber: Number(m[2]),
    questionNumber: Number(m[3]),
    questionType: m[4],
    correctAnswer: m[5],
  };
}

const parsed = inserts.map(parseInsert);

test('richtig_falsch questions sit at 12/14/16/18/20 and are 3 Richtig / 3 Falsch at every position across the six exercises', () => {
  const rf = parsed.filter((q) => q.questionType === 'richtig_falsch');
  assert.equal(rf.length, 30, 'expected 5 richtig_falsch questions per exercise across 6 exercises');
  assert.deepEqual([...new Set(rf.map((q) => q.questionNumber))].sort((a, b) => a - b), [12, 14, 16, 18, 20]);

  for (const position of [12, 14, 16, 18, 20]) {
    const atPosition = rf.filter((q) => q.questionNumber === position);
    assert.equal(atPosition.length, 6, `expected 6 exercises to carry a richtig_falsch question at ${position}`);
    const richtig = atPosition.filter((q) => q.correctAnswer === 'Richtig').length;
    const falsch = atPosition.filter((q) => q.correctAnswer === 'Falsch').length;
    assert.equal(richtig, 3, `position ${position} should split 3 Richtig across the six exercises`);
    assert.equal(falsch, 3, `position ${position} should split 3 Falsch across the six exercises`);
  }
});

test('multiple_choice questions sit at 11/13/15/17/19 and every exercise uses keys a, b and c', () => {
  const mc = parsed.filter((q) => q.questionType === 'multiple_choice');
  assert.equal(mc.length, 30, 'expected 5 multiple_choice questions per exercise across 6 exercises');
  assert.deepEqual([...new Set(mc.map((q) => q.questionNumber))].sort((a, b) => a - b), [11, 13, 15, 17, 19]);

  const byExercise = new Map();
  for (const q of mc) {
    if (!byExercise.has(q.exerciseId)) byExercise.set(q.exerciseId, []);
    byExercise.get(q.exerciseId).push(q.correctAnswer);
  }
  assert.equal(byExercise.size, 6);
  for (const [exerciseId, answers] of byExercise) {
    assert.equal(answers.length, 5);
    for (const key of ['a', 'b', 'c']) {
      assert.ok(answers.includes(key), `exercise ${exerciseId} is missing MC key ${key}`);
    }
  }
});

test('the 2 existing-row edits are guarded UPDATEs keyed on the OLD options value', () => {
  assert.equal(editUpdates.length, 2, `expected 2 existing-row UPDATEs, found ${editUpdates.length}`);
  for (const stmt of editUpdates) {
    assert.match(stmt, /^UPDATE public\.listening_questions SET options = '\[.*\]'::jsonb\s*\nWHERE id = '[0-9a-f-]{36}' AND options = '\[.*\]'::jsonb;/);
  }
});
