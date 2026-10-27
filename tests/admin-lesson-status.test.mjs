// Admin metrics count a finished course lesson as finished.
//
// lesson_progress.status can only be 'started' | 'complete' | 'gold' (the
// CHECK in migrations/2026-09-12-lesson-engine.sql; lessonService writes
// 'complete' and 'gold'). The cockpit tested `status === 'completed'`, a value
// the database never holds: "Kurs-Lektionen abgeschlossen" was always 0, and a
// learner whose only qualifying activity was the course was missing from
// "Aktiviert" and from the funnel's counted stage. The rule is pinned to the
// migration, so a new finished status cannot silently drop out again.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { activitySets, productGroup, lessonDone } from '../netlify/functions/_shared/adminCockpit.mjs';

const T = '2026-10-20T10:00:00Z';

/** The few supabase-js shapes activitySets/productGroup use, over in-memory tables. */
function fakeDb(tables) {
  return {
    from(name) {
      const filters = [];
      const query = {
        select() { return query; },
        eq(key, value) { filters.push((row) => row[key] === value); return query; },
        in(key, values) { filters.push((row) => values.includes(row[key])); return query; },
        is(key, value) { filters.push((row) => (value === null ? row[key] == null : row[key] === value)); return query; },
        order() { return query; },
        range(from, to) {
          const rows = (tables[name] || []).filter((row) => filters.every((f) => f(row)));
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
        },
      };
      return query;
    },
  };
}

const world = () => ({
  grammar_topics: [],
  user_grammar_progress: [],
  speaking_sessions: [],
  user_listening_progress: [],
  user_reading_progress: [],
  lesson_progress: [
    { user_id: 'gold-learner', level: 'a1.1', status: 'gold', completed_at: T, updated_at: T },
    { user_id: 'complete-learner', level: 'a1.1', status: 'complete', completed_at: T, updated_at: T },
    { user_id: 'started-learner', level: 'a1.1', status: 'started', completed_at: null, updated_at: T },
  ],
});

test('gold and complete lessons count as completed activity; started does not', async () => {
  const db = fakeDb(world());
  const sets = await activitySets(db, null);
  assert.deepEqual([...sets.started].sort(), ['complete-learner', 'gold-learner', 'started-learner']);
  assert.deepEqual([...sets.counted].sort(), ['complete-learner', 'gold-learner'],
    'a course-only learner who finished a lesson is activated');

  const w = { from: '2026-10-01T00:00:00Z', to: '2026-10-25T00:00:00Z', previousFrom: '2026-09-07T00:00:00Z', previousTo: '2026-10-01T00:00:00Z' };
  const product = await productGroup(db, w, null, sets);
  assert.equal(product.lessons.rows, 3);
  assert.equal(product.lessons.completed, 2, 'Kurs-Lektionen abgeschlossen counts gold and complete');
  assert.equal(product.lessons.users, 3);
});

test('the finished-lesson rule equals the lesson_progress CHECK: every status but started', () => {
  const sql = readFileSync(new URL('../migrations/2026-09-12-lesson-engine.sql', import.meta.url), 'utf8');
  const table = sql.slice(sql.indexOf('CREATE TABLE IF NOT EXISTS public.lesson_progress'));
  const check = table.match(/status text NOT NULL DEFAULT 'started' CHECK \(status IN \(([^)]*)\)\)/);
  assert.ok(check, 'lesson_progress status CHECK not found');
  const statuses = [...check[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(statuses, ['started', 'complete', 'gold']);
  for (const status of statuses) assert.equal(lessonDone(status), status !== 'started', status);
  assert.equal(lessonDone('completed'), false, "'completed' is not a lesson_progress status");
  const cockpit = readFileSync(new URL('../netlify/functions/_shared/adminCockpit.mjs', import.meta.url), 'utf8');
  // speaking_sessions.status 'completed' is a real value; lesson rows (l) are judged by lessonDone only.
  assert.doesNotMatch(cockpit, /\bl\.status\s*===/, 'lesson rows are judged by lessonDone, never by a literal status');
});
