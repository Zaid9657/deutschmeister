// Guard suite for the weekly measurement loop.
//
//   1. The schedule is declared in both places and they agree.
//   2. The history table is service-role only (RLS on, no policies) and the
//      metrics function cannot be called by clients.
//   3. The function STORES before it EMAILS, and never emails without a key.
//   4. renderSummary flags failed webhooks at the top and survives a null
//      previous row (the first run ever has none).

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
  const store = fn.indexOf(".from('weekly_metrics')\n    .insert(");
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
