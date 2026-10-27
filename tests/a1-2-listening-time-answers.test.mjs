// A1.2 listening Übung 4: a time is corrected as a time (cross-check 2026-10-25,
// AI-24 / C-178).
//
// The three dictation items ask "Schreiben Sie die Uhrzeit", but their
// correct_answer was a bare number, which QuestionCard prints as "Richtig: 20".
// migrations/2026-10-25-a1-2-listening-time-answers.sql sets "10 Uhr", "20 Uhr"
// and "18 Uhr" — guarded on the old value, and without changing what is
// accepted: each new value is already in the row's acceptable_answers, which is
// what dictationMatches() grades against.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dictationMatches } from '../src/utils/dictationMatch.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const EXERCISE = 'ed793dfa-d834-4207-a940-1fe70968dd61';
const original = read('migrations/2026-09-05-a1-2-listening.sql');
const fix = read('migrations/2026-10-25-a1-2-listening-time-answers.sql');

/** The 2026-09-05 row for one question: its stored correct and accepted answers. */
function originalRow(questionNumber) {
  const re = new RegExp(`'${EXERCISE}', \\d+, ${questionNumber}, 'dictation',\\n\\s+'([^']+)', NULL, '([^']+)',\\n\\s+'(\\[[^']+\\])'::jsonb`);
  const m = re.exec(original);
  assert.ok(m, `question ${questionNumber} not found in the 2026-09-05 migration`);
  return { question: m[1], correct: m[2], accepted: JSON.parse(m[3]) };
}

const UPDATES = [...fix.matchAll(/UPDATE public\.listening_questions SET correct_answer = '([^']+)'\nWHERE exercise_id = '([^']+)' AND question_number = (\d+)\n\s+AND correct_answer = '([^']+)';/g)]
  .map(([, next, exercise, number, old]) => ({ next, exercise, number: Number(number), old }));

test('the three Uhrzeit dictations get a time with its unit, each guarded on the old bare number', () => {
  assert.deepEqual(UPDATES.map((u) => u.number), [21, 22, 23]);
  for (const u of UPDATES) {
    const row = originalRow(u.number);
    assert.equal(u.exercise, EXERCISE);
    assert.match(row.question, /Schreiben Sie die Uhrzeit\./);
    assert.equal(u.old, row.correct, `question ${u.number}: the guard must name the value the row holds`);
    assert.equal(u.next, `${row.correct} Uhr`);
    assert.ok(row.accepted.includes(u.next), `question ${u.number}: "${u.next}" must already be accepted`);
  }
  assert.equal((fix.match(/^UPDATE /gm) || []).length, 3, 'data only: nothing else changes');
  assert.match(fix, /^BEGIN;$/m);
  assert.match(fix, /^COMMIT;$/m);
});

test('grading is unchanged: every answer the old row accepted or refused, the new row does too', () => {
  for (const u of UPDATES) {
    const row = originalRow(u.number);
    const tries = [...row.accepted, `${row.correct}:00`, `${row.correct}.00 Uhr`, 'um zehn', String(Number(row.correct) + 1), ''];
    for (const answer of tries) {
      assert.equal(
        dictationMatches(answer, u.next, row.accepted),
        dictationMatches(answer, row.correct, row.accepted),
        `question ${u.number}: "${answer}"`,
      );
    }
  }
});

test('the ledger records the data migration as applied', () => {
  const row = read('migrations/README.md').split('\n').find((l) => l.includes('`2026-10-25-a1-2-listening-time-answers.sql`'));
  assert.ok(row);
  assert.match(row, /applied 2026-10-25/i);
});
