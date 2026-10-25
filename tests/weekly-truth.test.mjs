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

test('the course funnel line leads with the L1→L2 cohort, labels the SQL ratio, and is null-safe', async () => {
  const { renderCourseLine, renderSummary } = await import('../netlify/functions/weekly-truth.mjs');
  const course = {
    level: 'a1.1', window_days: 14,
    l01_started: 40, l01_finished: 25, l02_started: 10, l03_finished: 4, l12_finished: 1,
    checkpoint1_passed: 2, one_and_done_14d: 12, l1_to_l2_pct: 40, active_learners_7d: 9,
    l1_cohort: 25, l1_cohort_to_l2: 8, l1_to_l2_cohort_pct: 32,
  };
  const line = renderCourseLine(course);
  assert.equal(
    line,
    'Kurs A1.1: L1→L2-Kohorte 32 % (8 von 25) · L1 gestartet 40 · beendet 25 · L2 gestartet 10 (Zeilenquote 40 %) · one-and-done 12'
      + ' · L3 beendet 4 · L12 beendet 1 · CP1 bestanden 2 · aktiv (7d) 9',
  );
  // Nobody finished L1: the SQL yields null (nullif), never 0 %; so does the cohort.
  const empty = renderCourseLine({ ...course, l01_finished: 0, l02_started: 0, l1_to_l2_pct: null, l1_cohort: 0, l1_cohort_to_l2: 0, l1_to_l2_cohort_pct: null });
  assert.ok(empty.includes('L2 gestartet 0 (Zeilenquote n/a)'), empty);
  assert.ok(empty.includes('L1→L2-Kohorte n/a'), empty);
  // Older payload without the SQL ratio but with counts: derived client-side.
  const derived = renderCourseLine({ ...course, l1_to_l2_pct: undefined });
  assert.ok(derived.includes('(Zeilenquote 40 %)'), derived);
  // A row stored before the cohort existed (or a failed cohort read) says n/a, never undefined.
  const { l1_cohort: _a, l1_cohort_to_l2: _b, l1_to_l2_cohort_pct: _c, ...old } = course;
  assert.ok(renderCourseLine(old).startsWith('Kurs A1.1: L1→L2-Kohorte n/a · '), renderCourseLine(old));
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

// ---------------------------------------------------------------------------
// The L1 → L2 cohort (review 2026-10-25, X-029)
// ---------------------------------------------------------------------------
// The SQL's l1_to_l2_pct divides two independent 14-day row counts, so one
// recent L1 finisher plus two returning L2 learners read as 200 %. The cohort
// counts, of the learners who finished L1 in the window, those with any L2 row.

/** lesson_progress behind the two reads courseCohort makes. */
function progressDb(rows) {
  class Q {
    constructor() { Object.assign(this, { rows: [...rows], lo: 0, hi: Infinity }); }
    select() { return this; }
    eq(k, v) { this.rows = this.rows.filter((r) => r[k] === v); return this; }
    in(k, vs) { this.rows = this.rows.filter((r) => vs.includes(r[k])); return this; }
    gt(k, v) { this.rows = this.rows.filter((r) => r[k] != null && r[k] > v); return this; }
    order() { return this; }
    range(a, b) { this.lo = a; this.hi = b; return this; }
    then(res, rej) { return Promise.resolve({ data: this.rows.slice(this.lo, this.hi + 1), error: null }).then(res, rej); }
  }
  return { from: (table) => { assert.equal(table, 'lesson_progress'); return new Q(); } };
}

test('the L1→L2 cohort is a share of people who finished L1, so it never passes 100 %', async () => {
  const { courseCohort, renderCourseLine } = await import('../netlify/functions/weekly-truth.mjs');
  const now = Date.parse('2026-10-26T06:00:00Z');
  const daysAgo = (d) => new Date(now - d * 86400000).toISOString();
  const l1 = (user, d, status = 'complete') => ({ user_id: user, lektion_id: 'a1.1-l01', status, completed_at: d == null ? null : daysAgo(d) });
  const l2 = (user) => ({ user_id: user, lektion_id: 'a1.1-l02', status: 'started', completed_at: null });
  // X-029's case: one recent L1 finisher who has not continued, two returning learners on L2.
  const rows = [
    l1('new', 2), // finished L1 this window, no L2 yet
    l1('old1', 40), l2('old1'), // finished L1 long ago, on L2 now: not in the cohort
    l1('old2', 30), l2('old2'),
  ];
  const sqlStyle = Math.round((100 * 2) / 1); // the row ratio the SQL reports here: 200 %
  assert.equal(sqlStyle, 200);
  assert.deepEqual(await courseCohort(progressDb(rows), { now, windowDays: 14 }), { l1_cohort: 1, l1_cohort_to_l2: 0, l1_to_l2_cohort_pct: 0 });

  const mixed = [
    l1('a', 1), l2('a'),
    l1('b', 3, 'gold'), l2('b'),
    l1('c', 5),
    l1('d', 13),
    l1('e', 6, 'started'), l2('e'), // not finished: not in the cohort
    l1('f', null), // complete without a date: not in the window
    l2('g'), // never finished L1
  ];
  const cohort = await courseCohort(progressDb(mixed), { now, windowDays: 14 });
  assert.deepEqual(cohort, { l1_cohort: 4, l1_cohort_to_l2: 2, l1_to_l2_cohort_pct: 50 });
  assert.ok(renderCourseLine({ level: 'a1.1', ...cohort }).includes('L1→L2-Kohorte 50 % (2 von 4)'));

  // Nobody finished L1: no percentage at all, never 0 % or NaN.
  assert.deepEqual(await courseCohort(progressDb([l2('x')]), { now }), { l1_cohort: 0, l1_cohort_to_l2: 0, l1_to_l2_cohort_pct: null });

  // Property: whatever the rows, the cohort share stays within 0..100.
  for (let seed = 1; seed <= 25; seed += 1) {
    const random = (n) => { seed = (seed * 16807) % 2147483647; return seed % n; };
    const many = [];
    for (let u = 0; u < 60; u += 1) {
      if (random(2)) many.push(l1(`u${u}`, random(30), random(4) ? 'complete' : 'started'));
      if (random(2)) many.push(l2(`u${u}`));
    }
    const { l1_to_l2_cohort_pct: p } = await courseCohort(progressDb(many), { now });
    assert.ok(p === null || (p >= 0 && p <= 100), `cohort share ${p} %`);
  }
});

test('the weekly run adds the cohort to the stored course block, and a failed read leaves only the ratio', () => {
  const fn = read('netlify/functions/weekly-truth.mjs');
  const rpc = fn.indexOf("rpc('weekly_truth_metrics')");
  const cohort = fn.indexOf('await courseCohort(supabase');
  const store = fn.search(/\.from\('weekly_metrics'\)\r?\n\s+\.insert\(/);
  assert.ok(rpc > 0 && cohort > rpc && store > cohort, 'computed after the SQL and before the row is stored');
  assert.match(fn.slice(cohort - 200, cohort + 400), /catch \(e\)/, 'a failed cohort read must not lose the week\'s row');
});
