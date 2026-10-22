import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { reconcileCoverage } from '../netlify/functions/_shared/adminFunnelLib.mjs';

const readers = [
  'netlify/functions/admin-user360.mjs',
  'netlify/functions/admin-usage.mjs',
  'netlify/functions/_shared/adminCockpit.mjs',
  'netlify/functions/admin-status.mjs',
  'netlify/functions/sentinel.mjs',
];

function loadEvaluations(file, rows, sessions) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const line = source.split('\n').find((entry) => entry.includes(".from('speaking_evaluations')"));
  const expression = line?.match(/fetchAll\(\(\) => (.+)\)(?:\s*:\s*\[\])?;?$/)?.[1];
  assert.ok(expression, `${file} must load evaluations through its paged query`);
  const filters = [];
  let columns;
  const query = {
    select(value) { columns = value.split(',').map((column) => column.trim()); return this; },
    in(key, values) { filters.push((row) => values.includes(row[key])); return this; },
    is(key, value) {
      filters.push((row) => {
        const actual = key.split('->>').reduce((part, field) => part?.[field], row);
        return value === null ? actual == null : actual === value;
      });
      return this;
    },
    order() { return this; },
  };
  const db = { from(table) { assert.equal(table, 'speaking_evaluations'); return query; } };
  vm.runInNewContext(expression, { supabase: db, db, tokens: sessions.map((row) => row.session_token), speaking: sessions });
  assert.ok(!columns.includes('scores'), 'reservation metadata and stored provider output must not reach admin payloads');
  return rows.filter((row) => filters.every((filter) => filter(row)))
    .map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
}

for (const file of readers) {
  test(`${file} excludes pending and failed speaking reservations from history and coverage`, () => {
    const sessions = ['retried', 'pending', 'failed', 'zero', 'legacy-null', 'legacy-missing']
      .map((session_token) => ({ session_token, status: 'completed' }));
    const rows = [
      { session_token: 'retried', score: 0, total_score: null, scores: { _failed: true } },
      { session_token: 'retried', score: 73, total_score: 73, scores: { grammar: 14, _evaluation: { feedback: 'private' } } },
      { session_token: 'pending', score: 0, total_score: null, scores: { _pending: true } },
      { session_token: 'failed', score: 0, total_score: null, scores: { _failed: true } },
      { session_token: 'zero', score: 0, total_score: 0, scores: { grammar: 0 } },
      { session_token: 'legacy-null', score: 60, scores: null },
      { session_token: 'legacy-missing', score: 80 },
    ];
    const evaluations = loadEvaluations(file, rows, sessions);
    assert.deepEqual(evaluations.map((row) => row.session_token), ['retried', 'zero', 'legacy-null', 'legacy-missing']);
    assert.equal(evaluations[0].score, 73, 'a failed attempt cannot mask a later successful retry');
    assert.equal(evaluations[1].total_score, 0, 'a genuine zero remains a completed evaluation');
    const coverage = reconcileCoverage(sessions, evaluations);
    assert.equal(coverage.evaluatedSessions, 4);
    assert.equal(coverage.missingEvaluation, 2);
    assert.equal(coverage.duplicateRows, 0);
  });
}
