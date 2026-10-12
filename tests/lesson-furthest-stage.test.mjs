// Guard suite for "where a learner stops in a Lektion" (2026-10-12).
//
// Until then the database knew that a learner OPENED Lektion 1 (the
// lesson_progress row is written on page load) and whether they finished it,
// and nothing in between: 11 signed-in learners opened A1.1 Lektion 1 from
// 09-12 to 10-12, 0 finished, 9 left no trace. Pinned here:
//   1. Every stage buildLesson emits, for every Lektion, attempt and warm-up
//      case, is in STAGE_ORDER, in increasing rank — so the furthest stage is
//      comparable across runs.
//   2.–3. (the player's write: added with the client half, once the columns
//      exist in production — tests/db-columns.test.mjs requires that order)
//   4. The migration adds bounded columns and re-declares
//      weekly_truth_metrics() with the same security, every earlier key, and a
//      stop-point funnel over exactly the rows l01_started counts.
//   5. The Monday mail renders the funnel, and says when it is not measured.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import buildLesson, { ATTEMPT_CYCLE } from '../src/lib/lesson/buildLesson.js';
import { ALL_CURRICULA } from '../src/data/curricula/index.js';
import { STAGE_ORDER, stageRank } from '../src/lib/lesson/stageOrder.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const POOLS = {
  'a1.1': JSON.parse(read('src/data/lessonPools/a11.json')),
  'a1.2': JSON.parse(read('src/data/lessonPools/a12.json')),
};
const MIGRATION = 'migrations/2026-10-12-lesson-furthest-stage.sql';

// --- 1. the rank ------------------------------------------------------------

test('every built Lektion emits its stages in STAGE_ORDER, with and without a warm-up, on every attempt', () => {
  const due = [{ cardKey: 'w:name', front: 'der Name', back: 'name' }];
  let lessons = 0;
  for (const [level, curriculum] of Object.entries(ALL_CURRICULA)) {
    for (const lektion of curriculum.lektionen) {
      for (let attempt = 1; attempt <= ATTEMPT_CYCLE; attempt += 1) {
        for (const dueCards of [[], due]) {
          const { stages } = buildLesson({ curriculum, lektion, pool: POOLS[level], dueCards, attempt });
          const ranks = stages.map((s) => stageRank(s.key));
          assert.ok(ranks.every((r) => r >= 0), `${lektion.id}: a stage outside STAGE_ORDER: ${stages.map((s) => s.key)}`);
          assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `${lektion.id}: stages out of rank order`);
          assert.equal(new Set(ranks).size, ranks.length, `${lektion.id}: a stage key twice`);
          lessons += 1;
        }
      }
    }
  }
  assert.ok(lessons >= 12 * ATTEMPT_CYCLE * 2, `only ${lessons} lessons built`);
});

test('the rank is a position in a fixed list, and an unknown key has none', () => {
  assert.equal(stageRank('warmup'), 0);
  assert.equal(stageRank('recap'), STAGE_ORDER.length - 1);
  for (const bad of ['intro', '', null, undefined, 'Recap', 'recap ']) assert.equal(stageRank(bad), -1, String(bad));
  assert.ok(Object.isFrozen(STAGE_ORDER));
});

// --- 4. the migration -------------------------------------------------------

const sql = read(MIGRATION);
const fnBody = (text) => {
  const start = text.indexOf('CREATE OR REPLACE FUNCTION public.weekly_truth_metrics()');
  const a = text.indexOf('$function$', start) + '$function$'.length;
  return text.slice(a, text.indexOf('$function$', a));
};

test('the migration adds three bounded, nullable columns and no table or policy', () => {
  for (const col of ['furthest_stage      text', 'furthest_stage_rank smallint', 'furthest_stage_at   timestamptz']) {
    assert.ok(sql.includes(`ADD COLUMN IF NOT EXISTS ${col}`), col);
  }
  assert.ok(!/NOT NULL/i.test(sql.slice(0, sql.indexOf('CREATE OR REPLACE FUNCTION'))), 'the new columns stay nullable');
  assert.match(sql, /DROP CONSTRAINT IF EXISTS lesson_progress_furthest_stage_check;\s*ALTER TABLE public\.lesson_progress ADD CONSTRAINT lesson_progress_furthest_stage_check CHECK/);
  // The CHECK's bounds admit every key and rank the player can write.
  const key = /furthest_stage ~ '([^']+)'/.exec(sql)[1];
  for (const k of STAGE_ORDER) assert.match(k, new RegExp(key), k);
  const max = Number(/furthest_stage_rank BETWEEN 0 AND (\d+)/.exec(sql)[1]);
  assert.ok(STAGE_ORDER.length - 1 <= max);
  assert.ok(!/CREATE (TABLE|POLICY)/i.test(sql));
  assert.match(sql, /^BEGIN;$/m);
  assert.match(sql, /^COMMIT;$/m);
});

test('weekly_truth_metrics() keeps its security, every earlier key, and adds the stop funnel', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.weekly_truth_metrics\(\)\nRETURNS jsonb\nLANGUAGE sql\nSECURITY DEFINER\nSET search_path = public, auth\n/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.weekly_truth_metrics\(\) FROM PUBLIC;/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.weekly_truth_metrics\(\) FROM anon, authenticated;/);
  assert.ok(!/GRANT\s+EXECUTE/i.test(sql), 'no client GRANT');
  // Every key the live function returns (the 2026-09-20 body) is still returned.
  const before = fnBody(read('migrations/2026-09-20-acquisition-attribution.sql'));
  const after = fnBody(sql);
  const keys = (body) => [...body.matchAll(/'([a-z_0-9]+)', /g)].map((m) => m[1]);
  for (const k of new Set(keys(before))) assert.ok(keys(after).includes(k), `key ${k} dropped`);
  assert.ok(after.includes("'l01_stopped_at', (SELECT j FROM l1s)"));
  // Apart from the funnel, the body is the one that runs today: drop the three edits and compare.
  const undo = after
    .replace(',\n           furthest_stage, furthest_stage_rank\n', '\n')
    .replace(/ {2}-- Lektion 1, where each learner[\s\S]*?\n {2}\),\n/, '')
    .replace(",\n      'l01_stopped_at', (SELECT j FROM l1s)) FROM cf),", ') FROM cf),');
  assert.equal(undo, before, 'the function differs from the live body by more than the funnel');
});

test('the stop funnel counts exactly the rows l01_started counts, so the buckets sum to it', () => {
  const body = fnBody(sql);
  const started = /count\(\*\) FILTER \(WHERE (lektion_id = 'a1\.1-l01' AND updated_at > now\(\) - interval '14 days')\) AS l01_started/.exec(body);
  assert.ok(started, 'l01_started filter found');
  const l1s = body.slice(body.indexOf('l1s AS ('), body.indexOf('-- Acquisition:'));
  assert.ok(l1s.includes(`WHERE ${started[1]}`), 'l1s must filter the rows l01_started counts');
  assert.ok(l1s.includes('FROM cp'), 'same source CTE (lower(level) = a1.1)');
  assert.match(l1s, /ORDER BY stage_rank/);
});

// --- 5. the mail ------------------------------------------------------------

test('the Monday mail renders where L1 learners stopped, after the course line', async () => {
  const { renderStopLine, renderSummary } = await import('../netlify/functions/weekly-truth.mjs');
  const course = {
    level: 'a1.1', window_days: 14, l01_started: 7, l01_finished: 0, l02_started: 0,
    l01_stopped_at: [{ stage: 'intro', n: 5 }, { stage: 'dialog', n: 1 }, { stage: 'speaking', n: 1 }],
  };
  assert.equal(renderStopLine(course), 'Kurs A1.1, L1 weitester Schritt (14d): nur geöffnet 5 · dialog 1 · speaking 1');
  assert.equal(renderStopLine({ ...course, l01_stopped_at: [] }), 'Kurs A1.1, L1 weitester Schritt (14d): niemand');
  const unmigrated = renderStopLine({ ...course, l01_stopped_at: undefined });
  assert.ok(unmigrated.includes('nicht gemessen') && unmigrated.includes(MIGRATION.replace('migrations/', '')), unmigrated);
  assert.equal(renderStopLine(undefined), null, 'no course block: the course line already says so');
  const text = renderSummary({ measured_at: '2026-10-19T06:00:00Z', course }, null);
  const kurs = text.indexOf('Kurs A1.1: L1 gestartet');
  const stop = text.indexOf('Kurs A1.1, L1 weitester Schritt');
  const ai = text.indexOf('AI this week:');
  assert.ok(kurs < stop && stop < ai, 'the stop line sits under the course line');
});
