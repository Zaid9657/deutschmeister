// Guard suite for the weekly measurement loop.
//
//   1. The schedule is declared in both places and they agree.
//   2. The history table is service-role only (RLS on, no policies) and the
//      metrics function cannot be called by clients.
//   3. The function STORES before it EMAILS, and never emails without a key.
//   4. renderSummary flags failed webhooks at the top and survives a null
//      previous row (the first run ever has none).
//   5. The A1.1 course funnel (2026-09-19) is rendered, its L1→L2 ratio is
//      null-safe, an older function without the block is tolerated, and the
//      re-declaring migration keeps the security lines and every old key.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the weekly schedule is declared identically in the function and netlify.toml', () => {
  const fn = read('netlify/functions/weekly-truth.mjs');
  const m = fn.match(/schedule\('([^']+)'/);
  assert.ok(m, 'schedule() wrapper missing');
  const toml = read('netlify.toml');
  const t = toml.match(/\[functions\."weekly-truth"\]\s*\n\s*schedule = "([^"]+)"/);
  assert.ok(t, 'netlify.toml has no weekly-truth schedule');
  assert.equal(m[1], t[1], 'the two schedule declarations disagree');
});

test('weekly_metrics is service-role only and the metrics function is not client-callable', () => {
  const sql = read('migrations/2026-09-03-weekly-metrics.sql');
  assert.ok(/ALTER TABLE public\.weekly_metrics ENABLE ROW LEVEL SECURITY/.test(sql));
  assert.ok(!/CREATE POLICY[^;]*weekly_metrics/i.test(sql), 'no client policy may exist on weekly_metrics');
  assert.ok(/SECURITY DEFINER/.test(sql), 'the function reads auth.users and must be SECURITY DEFINER');
  assert.ok(/REVOKE ALL ON FUNCTION public\.weekly_truth_metrics\(\) FROM anon, authenticated/.test(sql));
});

test('the function stores before it emails and fails closed without keys', () => {
  const fn = read('netlify/functions/weekly-truth.mjs');
  const store = fn.search(/\.from\('weekly_metrics'\)\r?\n\s+\.insert\(/);
  const mail = fn.indexOf('https://api.resend.com/emails');
  assert.ok(store > 0 && mail > 0 && store < mail, 'the insert must precede the Resend call');
  assert.ok(fn.includes('if (!resendKey)'), 'a missing Resend key must be handled, never a crash after storing');
  assert.ok(fn.includes('return { statusCode: 401'), 'unauthenticated manual calls must be rejected');
});

test('renderSummary flags failed webhooks first and tolerates no previous row', async () => {
  const { renderSummary } = await import('../netlify/functions/weekly-truth.mjs');
  const m = {
    measured_at: '2026-09-07T06:00:00Z',
    users: { total: 1600, confirmed: 1100, signups_7d: 40, signups_30d: 170 },
    subscriptions: { paying: 4, live_any: 6, course_pro_windows: 0, mrr: 45.2 },
    purchases: { sales_7d: 2, revenue_7d: 98, sales_all: 3, revenue_all: 98, by_product_7d: { course_a1: 2 } },
    grammar: { active_users_7d: 20, new_cohort_14d: 30, one_and_done_14d: 15 },
    lifecycle_emails_7d: { trial_d3: 5 },
    webhooks_7d: { total_7d: 3, failed_7d: 1 },
    ai_7d: { speaking_7d: 1, writing_7d: 0, exams_7d: 0, xray_7d: 50 },
  };
  const text = renderSummary(m, null);
  assert.ok(text.startsWith('!! 1 webhook event(s) FAILED'), 'failed webhooks must be the first line');
  assert.ok(text.includes('MRR €45.20 (no previous)'));
  assert.ok(text.includes('one-and-done 15 (50%)'));
  const text2 = renderSummary(
    { ...m, webhooks_7d: { total_7d: 3, failed_7d: 0 } },
    { subscriptions: { mrr: 40 }, users: { total: 1500 } },
  );
  assert.ok(text2.startsWith('DeutschMeister weekly truth'));
  assert.ok(text2.includes('MRR €45.20 (prev €40.00, +€5.20)'));
});

test('the course funnel line renders every key and is null-safe on the L1→L2 ratio', async () => {
  const { renderCourseLine, renderSummary } = await import('../netlify/functions/weekly-truth.mjs');
  const course = {
    level: 'a1.1', window_days: 14,
    l01_started: 40, l01_finished: 25, l02_started: 10, l03_finished: 4, l12_finished: 1,
    checkpoint1_passed: 2, one_and_done_14d: 12, l1_to_l2_pct: 40, active_learners_7d: 9,
  };
  const line = renderCourseLine(course);
  assert.equal(
    line,
    'Kurs A1.1: L1 gestartet 40 · beendet 25 · L2 gestartet 10 (40 %) · one-and-done 12'
      + ' · L3 beendet 4 · L12 beendet 1 · CP1 bestanden 2 · aktiv (7d) 9',
  );
  // Nobody finished L1: the SQL yields null (nullif), never 0 %.
  const empty = renderCourseLine({ ...course, l01_finished: 0, l02_started: 0, l1_to_l2_pct: null });
  assert.ok(empty.includes('L2 gestartet 0 (n/a)'), empty);
  // Older payload without the SQL ratio but with counts: derived client-side.
  const derived = renderCourseLine({ ...course, l1_to_l2_pct: undefined });
  assert.ok(derived.includes('(40 %)'), derived);
  // The line sits in the email between Learning and AI.
  const text = renderSummary({ measured_at: '2026-09-21T06:00:00Z', course }, null);
  const learning = text.indexOf('Learning:');
  const kurs = text.indexOf('Kurs A1.1:');
  const ai = text.indexOf('AI this week:');
  assert.ok(learning < kurs && kurs < ai, 'course line must follow Learning and precede AI');
});

test('a metrics payload without the course block (function not yet migrated) is tolerated', async () => {
  const { renderCourseLine, renderSummary } = await import('../netlify/functions/weekly-truth.mjs');
  for (const missing of [undefined, null, 'x']) {
    const line = renderCourseLine(missing);
    assert.ok(line.startsWith('Kurs A1.1: nicht gemessen'), line);
    assert.ok(line.includes('2026-09-19-course-funnel.sql'), 'must name the migration to apply');
  }
  const text = renderSummary({ measured_at: '2026-09-21T06:00:00Z', webhooks_7d: { failed_7d: 0 } }, null);
  assert.ok(text.includes('Kurs A1.1: nicht gemessen'));
  assert.ok(!text.includes('Kurs A1.1: L1 gestartet undefined'));
});

test('the course-funnel migration re-declares the function with the same security and every old key', () => {
  const sql = read('migrations/2026-09-19-course-funnel.sql');
  assert.ok(/CREATE OR REPLACE FUNCTION public\.weekly_truth_metrics\(\)/.test(sql));
  assert.ok(/SECURITY DEFINER/.test(sql), 'the function reads auth.users and must stay SECURITY DEFINER');
  assert.ok(/SET search_path = public, auth/.test(sql));
  assert.ok(/REVOKE ALL ON FUNCTION public\.weekly_truth_metrics\(\) FROM PUBLIC/.test(sql));
  assert.ok(/REVOKE ALL ON FUNCTION public\.weekly_truth_metrics\(\) FROM anon, authenticated/.test(sql));
  assert.ok(!/GRANT\s+EXECUTE/i.test(sql), 'no client GRANT may appear');
  // Every top-level key of the 2026-09-03 body survives, plus the new block.
  const old = read('migrations/2026-09-03-weekly-metrics.sql');
  const keys = [...old.matchAll(/^\s{4}'([a-z_0-9]+)', /gm)].map((m) => m[1]);
  assert.ok(keys.includes('grammar') && keys.includes('ai_7d'), 'key extraction sanity');
  for (const k of keys) assert.ok(sql.includes(`'${k}', `), `old key ${k} dropped`);
  for (const k of ['l01_started', 'l01_finished', 'l02_started', 'l03_finished', 'l12_finished',
    'checkpoint1_passed', 'one_and_done_14d', 'l1_to_l2_pct', 'active_learners_7d']) {
    assert.ok(sql.includes(`'${k}'`), `course key ${k} missing`);
  }
  assert.ok(/lower\(level\) = 'a1\.1'/.test(sql), 'level must be normalised with lower()');
  assert.ok(/nullif\(l01_finished, 0\)/.test(sql), 'the ratio must be null-safe');
});
