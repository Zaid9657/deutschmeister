// Guard suite for the A1.1 listening additions (Course Factory Wave 2, PR C):
// migrations/2026-09-05-a1-1-listening.sql, plus unit tests for the new
// dictation comparator (src/utils/dictationMatch.js).
//
// What each pin defends:
//
//   1. THE SCHEMA CHANGES — listening_questions has no `acceptable_answers`
//      column live, and its question_type CHECK does not admit 'dictation'
//      yet; both must land before any dictation row can be written.
//   2. VOLUME — 78 new questions, 13 per exercise across the 6 A1.1
//      exercises (10 existing + 13 new = 23 per exercise).
//   3. SHAPE BY TYPE — dictation rows carry options: null and a non-empty
//      acceptable_answers array; multiple_choice/richtig_falsch rows carry
//      the reverse (acceptable_answers: null) and the option-string
//      conventions ExercisePlayer/QuestionCard rely on ("a) …" / Richtig,
//      Falsch).
//   4. THE DICTATION COMPARATOR — number/time/price/phone normalisation
//      independent of separator or currency wording, plus the spelled-out-
//      number fallback via acceptable_answers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dictationMatches } from '../src/utils/dictationMatch.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(ROOT, 'migrations', '2026-09-05-a1-1-listening.sql'), 'utf8');
const sqlNoComments = sql
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n');

// Question text/explanations can themselves contain a literal ';' (German
// sentences do), so — as in tests/a1-1-reading.test.mjs — statements are cut
// at the NEXT statement's start line, never at the first ';' found.
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
  assert.equal(Object.keys(perExercise).length, 6, 'expected 6 distinct A1.1 exercises');
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
// dictationMatch unit tests
// ---------------------------------------------------------------------------

test('dictationMatches: times with different separators/wording are equivalent', () => {
  const acceptable = ['14:30', '14.30', '14:30 Uhr', 'vierzehn Uhr dreißig'];
  assert.ok(dictationMatches('14:30', '14:30', acceptable));
  assert.ok(dictationMatches('14.30', '14:30', acceptable));
  assert.ok(dictationMatches('14:30 Uhr', '14:30', acceptable));
  assert.ok(dictationMatches('vierzehn Uhr dreißig', '14:30', acceptable));
  assert.ok(!dictationMatches('15:30', '14:30', acceptable));
});

test('dictationMatches: phone numbers ignore spacing/punctuation', () => {
  const acceptable = ['0176 5432108', '01765432108', '0176-5432108', '0176/5432108'];
  assert.ok(dictationMatches('0176 5432108', '0176 5432108', acceptable));
  assert.ok(dictationMatches('01765432108', '0176 5432108', acceptable));
  assert.ok(!dictationMatches('0176 5432199', '0176 5432108', acceptable));
});

test('dictationMatches: prices ignore comma/dot and currency wording', () => {
  const acceptable = ['2,50', '2,50 €', '2,50 Euro', '2.50 €', '2.50'];
  assert.ok(dictationMatches('2,50', '2,50', acceptable));
  assert.ok(dictationMatches('2.50', '2,50', acceptable));
  assert.ok(dictationMatches('2,50 Euro', '2,50', acceptable));
  assert.ok(!dictationMatches('3,50', '2,50', acceptable));
});

test('dictationMatches: blank input never matches', () => {
  assert.ok(!dictationMatches('', '8,75', ['8,75']));
  assert.ok(!dictationMatches('   ', '8,75', ['8,75']));
});

test('dictationMatches: falls back to correct_answer when acceptable_answers is absent', () => {
  assert.ok(dictationMatches('42', '42', null));
  assert.ok(dictationMatches('42', '42', []));
  assert.ok(!dictationMatches('43', '42', null));
});
