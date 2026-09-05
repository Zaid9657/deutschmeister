// Guard suite for the "Du bist bereit" readiness check (src/services/readiness.js).
//
// What each pin defends: readiness is a trend line over the last TWO
// completed attempts, never a single good result, and never a promise —
// ModelltestResult.jsx and DashboardPage.jsx both read this one function so
// "ready" cannot mean two different things on two screens.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readinessFromAttempts } from '../src/services/readiness.js';
import { COURSE_TESTS } from '../src/data/courseTests/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const attempt = (score, maxScore, completedAt, status = 'completed') => ({
  status,
  score,
  max_score: maxScore,
  started_at: completedAt,
  completed_at: completedAt,
});

test('ready with the last two completed attempts both at or above 70%', () => {
  const result = readinessFromAttempts([
    attempt(75, 100, '2026-09-01'),
    attempt(72, 100, '2026-09-03'),
  ]);
  assert.equal(result.ready, true);
  assert.equal(result.lastTwo.length, 2);
  assert.equal(result.lastTwo[0].pct, 72); // most recent first
  assert.equal(result.lastTwo[1].pct, 75);
});

test('not ready with only one completed attempt', () => {
  const result = readinessFromAttempts([attempt(90, 100, '2026-09-01')]);
  assert.equal(result.ready, false);
  assert.equal(result.lastTwo.length, 1);
  assert.equal(result.trend, null);
});

test('not ready with zero completed attempts', () => {
  const result = readinessFromAttempts([]);
  assert.equal(result.ready, false);
  assert.deepEqual(result.lastTwo, []);
  assert.equal(result.trend, null);
});

test('not ready when one of the last two is below 70% (72/65)', () => {
  const result = readinessFromAttempts([
    attempt(72, 100, '2026-09-01'),
    attempt(65, 100, '2026-09-03'),
  ]);
  assert.equal(result.ready, false, '65% is below the 70% threshold, so the pair is not ready');
});

test('trend is up, down or flat based on the two most recent attempts', () => {
  const up = readinessFromAttempts([attempt(70, 100, '2026-09-01'), attempt(80, 100, '2026-09-03')]);
  assert.equal(up.trend, 'up');

  const down = readinessFromAttempts([attempt(90, 100, '2026-09-01'), attempt(75, 100, '2026-09-03')]);
  assert.equal(down.trend, 'down');

  const flat = readinessFromAttempts([attempt(80, 100, '2026-09-01'), attempt(80, 100, '2026-09-03')]);
  assert.equal(flat.trend, 'flat');
});

test('only completed attempts count; in-progress attempts are ignored', () => {
  const result = readinessFromAttempts([
    attempt(80, 100, '2026-09-01'),
    attempt(90, 100, '2026-09-03'),
    { status: 'in_progress', score: null, max_score: null, started_at: '2026-09-05' },
  ]);
  assert.equal(result.ready, true);
  assert.equal(result.lastTwo.length, 2);
});

test('a custom threshold is respected', () => {
  const result = readinessFromAttempts(
    [attempt(50, 100, '2026-09-01'), attempt(55, 100, '2026-09-03')],
    0.5
  );
  assert.equal(result.ready, true);
});

test('readiness is per exam key — an A1.2 Abschlusstest history is judged on its own rows', () => {
  // listAttempts(user, key) hands the function ONE key's rows; the same rule
  // applies unchanged to 'a1_2_abschluss' (Wave 3 PR D) — nothing in the
  // verdict is keyed on the level, so a1.2 cannot drift from a1.1.
  const a12 = [
    { ...attempt(13, 18, '2026-09-10'), exam_key: 'a1_2_abschluss' }, // 72 %
    { ...attempt(14, 18, '2026-09-12'), exam_key: 'a1_2_abschluss' }, // 78 %
  ];
  const result = readinessFromAttempts(a12);
  assert.equal(result.ready, true);
  assert.deepEqual(result.lastTwo.map((a) => a.pct), [78, 72]);
  assert.equal(result.trend, 'up');
});

test('the result screen names a next step for every course-test level', () => {
  // ModelltestResult keys "what comes after" on resolved.gateLevel; a course
  // test whose level is missing there would fall back to the generic hub
  // button, which is never what the earned "Du bist bereit" moment should show.
  const resultSrc = readFileSync(join(root, 'src/pages/Modelltest/ModelltestResult.jsx'), 'utf8');
  const block = resultSrc.slice(resultSrc.indexOf('const COURSE_NEXT = {'), resultSrc.indexOf('const courseNext'));
  for (const ct of COURSE_TESTS) {
    assert.ok(block.includes(`'${ct.level}': {`), `COURSE_NEXT has no entry for ${ct.level} (${ct.key})`);
  }
  assert.match(block, /'a1\.1': \{[^}]*primary: \{ to: '\/a1-2-phase'/s, 'after A1.1 the next step is the A1.2 plan');
  assert.match(block, /'a1\.2': \{[^}]*primary: \{ to: '\/modelltest\/start-deutsch-1'/s, 'after A1.2 the next step is the full SD1 mock');
});
