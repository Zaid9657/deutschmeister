import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function dashboard(evaluations) {
  const calls = [];
  const supabase = { from(table) {
    const filters = [];
    const query = {
      select(_columns, options) { this.head = options?.head; return this; },
      eq(key, value) { filters.push(row => row[key] === value); return this; },
      not() { return this; },
      is(key, value) {
        calls.push([key, value]);
        const [column, property] = key.split('->>');
        filters.push(row => (row[column]?.[property] ?? null) === value);
        return this;
      },
      then(resolve) {
        const rows = (table === 'speaking_evaluations' ? evaluations : []).filter(row => filters.every(filter => filter(row)));
        return Promise.resolve({ data: this.head ? null : rows, count: rows.length }).then(resolve);
      },
    };
    return query;
  } };
  const source = readFileSync(new URL('../src/services/dashboardStats.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  const context = vm.createContext({ supabase, console, Date });
  const load = vm.runInContext(`${source}\nloadDashboardStats;`, context);
  return { load, calls };
}

test('speaking reservations and failed evaluations never count as dashboard practice or completed sessions', async () => {
  const created_at = new Date().toISOString();
  const incomplete = [
    { user_id: 'learner', created_at, score: 0, total_score: null, scores: { _pending: true } },
    { user_id: 'learner', created_at, score: 0, total_score: null, scores: { _failed: true } },
  ];
  const { load, calls } = dashboard(incomplete);
  const stats = await load('learner');
  assert.equal(stats.speakingSessions, 0);
  assert.equal(stats.activitiesToday, 0);
  assert.equal(stats.streak, 0);
  assert.deepEqual(calls, [
    ['scores->>_pending', null], ['scores->>_failed', null],
    ['scores->>_pending', null], ['scores->>_failed', null],
  ], 'both the activity read and server-side count exclude unfinished evaluations');
});

test('dashboard speaking stats retain completed zero scores and legacy evaluations after a failed retry', async () => {
  const created_at = new Date().toISOString();
  const evaluations = [
    { user_id: 'learner', created_at, scores: { _failed: true } },
    { user_id: 'learner', created_at, total_score: 0, scores: { grammar: 0, _evaluation: { total_score: 0 } } },
    { user_id: 'learner', created_at, score: 70, scores: null },
    { user_id: 'learner', created_at, score: 60 },
    { user_id: 'other', created_at, score: 90 },
  ];
  const { load } = dashboard(evaluations);
  const stats = await load('learner');
  assert.equal(stats.speakingSessions, 3);
  assert.equal(stats.activitiesToday, 3);
  assert.equal(stats.streak, 1);
});
