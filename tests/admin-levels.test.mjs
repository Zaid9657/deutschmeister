// The casing map: one function maps (table, uiValue) → stored value(s), and
// this test pins each table's spelling as measured on 2026-09-13. Add a table
// to LEVEL_COLUMNS with its measured casing before filtering it anywhere.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, LEVEL_COLUMNS, levelValuesFor, normalizeLevel, applyLevelFilter } from '../netlify/functions/_shared/adminLevels.mjs';

test('eight sub-levels, lowercase in code', () => {
  assert.deepEqual([...LEVELS], ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']);
  assert.equal(normalizeLevel('A2.1'), 'a2.1');
  assert.equal(normalizeLevel('c1'), null);
});

test('per-table casing as measured', () => {
  const upper = ['grammar_topics', 'listening_exercises', 'speaking_sessions', 'speaking_evaluations', 'speaking_missions', 'podcasts'];
  const lower = ['lesson_progress', 'lesson_attempts', 'reading_lessons', 'words', 'sentences', 'paragraphs'];
  for (const t of upper) assert.deepEqual(levelValuesFor(t, 'a1.1'), ['A1.1'], t);
  for (const t of lower) assert.deepEqual(levelValuesFor(t, 'A1.1'), ['a1.1'], t);
  assert.deepEqual(levelValuesFor('user_progress', 'b2.2'), ['b2']);
  assert.deepEqual(levelValuesFor('profiles', 'a1.1'), ['A1.1', 'a1.1', 'a1']);
  assert.equal(levelValuesFor('profiles', 'all'), null);
  assert.throws(() => levelValuesFor('not_a_table', 'a1.1'), /not in LEVEL_COLUMNS/);
  assert.ok(Object.values(LEVEL_COLUMNS).every((v) => v.column && v.casing));
});

test('applyLevelFilter uses eq for one spelling and in for several', () => {
  const log = [];
  const q = { eq: (c, v) => { log.push(['eq', c, v]); return q; }, in: (c, v) => { log.push(['in', c, v]); return q; } };
  applyLevelFilter(q, 'grammar_topics', 'b1.1');
  applyLevelFilter(q, 'profiles', 'b1.1');
  applyLevelFilter(q, 'profiles', 'all');
  assert.deepEqual(log, [['eq', 'sub_level', 'B1.1'], ['in', 'current_level', ['B1.1', 'b1.1', 'b1']]]);
});
