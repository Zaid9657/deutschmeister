import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SQL = readFileSync(new URL('../migrations/2026-10-22-course-reminder-checkpoints.sql', import.meta.url), 'utf8')
  .replace(/--[^\n]*/g, '');

test('course reminders extract lesson numbers without casting checkpoint ids', () => {
  const extraction = SQL.match(/max\(substring\(lp\.lektion_id from '([^']+)'\)::int\)/);
  assert.ok(extraction, 'numeric extraction must return NULL for ids that are not numbered lessons');
  const pattern = new RegExp(extraction[1]);
  for (const [id, nr] of [['a1.1-l1', '1'], ['a1.1-l12', '12'], ['a1.1-cp1', null], ['a1.1-cp4', null], ['a1.1-l3-other', null]]) {
    assert.equal(pattern.exec(id)?.[1] ?? null, nr, id);
  }
  assert.doesNotMatch(SQL, /regexp_replace\(lp\.lektion_id/);
});

test('course reminders reject malformed or oversized learner-controlled lesson numbers before casting', () => {
  const extraction = SQL.match(/max\(substring\(lp\.lektion_id from '([^']+)'\)::int\)/);
  assert.ok(extraction);
  const pattern = new RegExp(extraction[1]);
  for (const id of ['a1.1-l2147483648', 'a1.1-l' + '9'.repeat(300), 'a1.1-l1234', 'a1.1-l-1', 'a1.1-l1.5', 'a1.1-l', 'a1.1-cp1']) {
    assert.equal(pattern.exec(id)?.[1] ?? null, null, id);
  }
  for (const nr of ['1', '12', '123']) assert.equal(pattern.exec(`a1.1-l${nr}`)?.[1], nr);
});

test('course reminders count only completed lessons and retain checkpoint activity', () => {
  assert.match(SQL, /count\(\*\) FILTER\s*\(\s*WHERE lp\.status IN \('complete', 'gold'\) AND lp\.lektion_id ~ '-l\[0-9\]\{1,3\}\$'\s*\)::int AS done_count/);
  const progress = SQL.slice(SQL.indexOf('WITH prog AS ('), SQL.indexOf('att AS ('));
  assert.match(progress, /max\(lp\.updated_at\) AS last_progress_at/);
  const where = progress.slice(progress.indexOf('FROM public.lesson_progress lp'));
  assert.doesNotMatch(where, /lektion_id|status/, 'checkpoint rows must remain in the activity aggregation');
  assert.match(SQL, /greatest\(p\.last_progress_at, coalesce\(a\.last_attempt_at, p\.last_progress_at\)\)/);
});

test('the checkpoint-safe reminder replacement preserves the RPC contract and service-only access', () => {
  assert.match(SQL, /CREATE OR REPLACE FUNCTION public\.course_reminder_candidates/);
  assert.match(SQL, /p_min_hours\s+int DEFAULT 20/);
  assert.match(SQL, /p_max_hours\s+int DEFAULT 44/);
  assert.match(SQL, /p_window_days\s+int DEFAULT 30/);
  assert.match(SQL, /SECURITY DEFINER\s+SET search_path = public/);
  assert.match(SQL, /REVOKE ALL ON FUNCTION public\.course_reminder_candidates\(int, int, int\) FROM PUBLIC, anon, authenticated/);
  assert.match(SQL, /GRANT EXECUTE ON FUNCTION public\.course_reminder_candidates\(int, int, int\) TO service_role/);
});
