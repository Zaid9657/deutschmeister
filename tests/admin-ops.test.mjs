// Admin panel, phase 2 — the pure operations, revenue, funnel and support rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { isFailedPayment, classifyAccess, findDiscrepancies, gateReads, PRODUCT_KEYS, ACTIVE_SUB_STATUSES } from '../netlify/functions/_shared/adminOpsLib.mjs';
import { paymentsFromWebhookRows, sumByCurrency, mrrFromSubscriptions, dailySeries } from '../netlify/functions/_shared/adminRevenueLib.mjs';
import { buildFunnelStages, reconcileCoverage, percentile, durationStats, seriesFor, windowFor, retentionCohorts, weekKey } from '../netlify/functions/_shared/adminFunnelLib.mjs';
import { slaState, slaDueAt, ticketReference, SLA_HOURS, CLOSURE_REASONS, RESOLUTION_CATEGORIES } from '../netlify/functions/_shared/adminSupportLib.mjs';
import { METRICS as SERVER_METRICS } from '../netlify/functions/_shared/adminMetricNames.mjs';
import { METRICS as CLIENT_METRICS } from '../src/data/adminMetrics.js';
import { COURSES, LEVEL_COURSES } from '../src/data/pricing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const NOW = new Date('2026-09-13T12:00:00Z');
const later = '2026-12-31T00:00:00Z';
const earlier = '2026-01-01T00:00:00Z';

test('isFailedPayment is the one definition and past_due sits inside the active set', () => {
  assert.equal(isFailedPayment({ status: 'past_due' }), true);
  assert.equal(isFailedPayment({ status: 'unpaid' }), true);
  assert.equal(isFailedPayment({ status: 'expired' }), false);
  assert.equal(isFailedPayment({ status: 'cancelled' }), false);
  assert.equal(isFailedPayment(null), false);
  assert.ok(ACTIVE_SUB_STATUSES.includes('past_due'));
  // the cockpit, the session badge and the ops queue all import THIS function
  for (const f of ['netlify/functions/_shared/adminCockpit.mjs', 'netlify/functions/admin-session.mjs', 'netlify/functions/admin-ops.mjs']) {
    assert.ok(read(f).includes('isFailedPayment'), `${f} must use isFailedPayment`);
    assert.ok(!/status\s*===\s*'past_due'/.test(read(f)), `${f} must not re-derive failed payment`);
  }
});

test('classifyAccess answers HOW, over all five shapes', () => {
  const profile = { is_subscribed: false, subscription_tier: 'free', trial_ends_at: null };
  assert.equal(classifyAccess({ profile, now: NOW }).kind, 'free');
  assert.equal(classifyAccess({ profile: { ...profile, trial_ends_at: later }, now: NOW }).kind, 'trial');
  assert.equal(classifyAccess({ profile, subscriptions: [{ plan_type: 'monthly', subscription_end: later }], now: NOW }).kind, 'subscription');
  assert.equal(classifyAccess({ profile, subscriptions: [{ plan_type: 'monthly', subscription_end: later }, { plan_type: 'yearly', subscription_end: later }], now: NOW }).label, '2 aktive Abonnements');
  assert.equal(classifyAccess({ profile, purchases: [{ status: 'active' }], now: NOW }).kind, 'course');
  assert.equal(classifyAccess({ profile: { ...profile, is_subscribed: true }, subscriptions: [{ plan_type: 'monthly', subscription_end: earlier }], now: NOW }).kind, 'unbekannt');
});

test('findDiscrepancies produces each rule and no others', () => {
  const base = { is_subscribed: false, subscription_tier: 'free' };
  assert.deepEqual(findDiscrepancies({ profile: base, now: NOW }), []);
  const kinds = (x) => findDiscrepancies({ now: NOW, ...x }).map((d) => d.kind);
  assert.deepEqual(kinds({ profile: { ...base, is_subscribed: true } }), ['status_without_subscription']);
  assert.deepEqual(kinds({ profile: { ...base, is_subscribed: true }, subscriptions: [{ plan_type: 'monthly', status: 'active', subscription_end: later }, { plan_type: 'yearly', status: 'active', subscription_end: later }] }), ['duplicate_subscription']);
  assert.deepEqual(kinds({ profile: base, subscriptions: [{ plan_type: 'monthly', status: 'active', subscription_end: later }] }), ['subscription_without_flag']);
  assert.deepEqual(kinds({ profile: { ...base, is_subscribed: true }, subscriptions: [{ plan_type: 'monthly', status: 'unpaid', subscription_end: later }] }), ['payment_failed']);
  const d = findDiscrepancies({ profile: { ...base, is_subscribed: true }, now: NOW })[0];
  assert.ok(d.evidence && d.recommendation && d.severity, 'each discrepancy carries evidence, a recommendation and a severity');
  assert.ok(!/automatisch (kündigen|korrigieren)/.test(d.recommendation) || /niemals/.test(d.recommendation));
});

test('gateReads names the field the access gate actually reads', () => {
  assert.match(gateReads({ latestSubscriptionEnd: later, now: NOW }).contentAccess, /subscription_end/);
  assert.match(gateReads({ latestSubscriptionEnd: earlier, hasPurchases: true, now: NOW }).contentAccess, /purchases/);
  assert.match(gateReads({ trialEndsAt: later, now: NOW }).contentAccess, /trial_ends_at/);
  assert.match(gateReads({ now: NOW }).contentAccess, /Gratis/);
});

test('PRODUCT_KEYS equals the keys the webhook can deliver and pricing.js declares', () => {
  const src = read('netlify/functions/lemonsqueezy-webhook.mjs');
  const fromWebhook = [...src.matchAll(/LEMONSQUEEZY_[A-Z0-9_]+_VARIANT_ID:\s*'([a-z0-9_]+)'/g)].map((m) => m[1]);
  assert.deepEqual([...PRODUCT_KEYS].sort(), [...new Set(fromWebhook)].sort());
  const fromPricing = [...Object.keys(COURSES), ...Object.keys(LEVEL_COURSES)];
  for (const k of fromPricing) assert.ok(PRODUCT_KEYS.includes(k), `${k} from pricing.js missing`);
});

test('the metric-name module and its client copy do not drift', () => {
  assert.deepEqual(CLIENT_METRICS, SERVER_METRICS);
  for (const [key, m] of Object.entries(SERVER_METRICS)) {
    assert.ok(m.label && m.definition && m.source && m.timeClass, `${key} must carry label, definition, source and timeClass`);
  }
});

// --- revenue ------------------------------------------------------------------
const wh = (event_type, attrs, meta = {}, id = Math.floor(Math.random() * 1e6)) => ({ event_type, created_at: attrs.created_at, payload: { meta: { test_mode: false, ...meta }, data: { id, attributes: attrs } } });

test('revenue: the first subscription payment is counted once, renewals once, test mode and unpaid never, per currency', () => {
  const rows = [
    wh('order_created', { status: 'paid', total: 1119, subtotal: 999, tax: 120, refunded_amount: 0, currency: 'EUR', created_at: '2026-05-21T23:10:58Z', first_order_item: { variant_id: 1393033, product_name: 'Pro Monthly' } }, {}, 8409879),
    wh('subscription_payment_success', { status: 'paid', total: 1119, tax: 120, currency: 'EUR', billing_reason: 'initial', subscription_id: 2177689, created_at: '2026-05-21T23:11:23Z' }),
    wh('subscription_payment_success', { status: 'paid', total: 1119, tax: 120, currency: 'EUR', billing_reason: 'renewal', subscription_id: 2177689, created_at: '2026-06-21T23:16:58Z' }),
    wh('subscription_payment_success', { status: 'paid', total: 1119, tax: 120, currency: 'EUR', billing_reason: 'renewal', subscription_id: 2177689, created_at: '2026-06-21T23:16:58Z' }), // webhook retry
    wh('order_created', { status: 'paid', total: 999, tax: 0, currency: 'EUR', created_at: '2026-03-10T17:30:58Z', first_order_item: { variant_id: 1379337 } }, { test_mode: true }, 7749438),
    wh('subscription_payment_success', { status: 'paid', total: 1379, tax: 0, currency: 'USD', billing_reason: 'renewal', subscription_id: 2181745, created_at: '2026-06-23T11:29:16Z' }),
    wh('subscription_payment_success', { status: 'pending', total: 1119, tax: 120, currency: 'EUR', billing_reason: 'renewal', subscription_id: 9, created_at: '2026-07-01T00:00:00Z' }),
    wh('order_created', { status: 'paid', total: 0, subtotal: 4900, discount_total: 4900, tax: 0, currency: 'EUR', created_at: '2026-09-03T20:02:08Z', first_order_item: { variant_id: 2088862, product_name: 'Course' } }, {}, 9377799),
  ];
  const payments = paymentsFromWebhookRows(rows, { courseVariantIds: new Set(['2088862']) });
  assert.deepEqual(payments.map((p) => p.kind), ['subscription_initial', 'renewal', 'renewal', 'course']);
  const sums = sumByCurrency(payments);
  assert.equal(sums.EUR.net, 999 + 999 + 0);
  assert.equal(sums.EUR.count, 3);
  assert.equal(sums.USD.net, 1379);
  assert.equal(sumByCurrency(payments, '2026-06-01T00:00:00Z', '2026-07-01T00:00:00Z').EUR.net, 999);
  const series = dailySeries(payments, '2026-06-20T00:00:00Z', '2026-06-23T00:00:00Z');
  assert.deepEqual(series.map((d) => d.net), [0, 999, 0]);
});

test('MRR follows the weekly_truth definition: active, paid, live, yearly/12; manual rows excluded', () => {
  const rows = [
    { plan_type: 'monthly', status: 'active', price_paid: 11.19, subscription_end: later },
    { plan_type: 'yearly', status: 'active', price_paid: 79.99, subscription_end: later },
    { plan_type: 'monthly', status: 'unpaid', price_paid: 9.99, subscription_end: later },
    { plan_type: 'monthly', status: 'active', price_paid: 0, subscription_end: later }, // manual grant
    { plan_type: 'monthly', status: 'active', price_paid: 9.99, subscription_end: earlier },
  ];
  const r = mrrFromSubscriptions(rows, NOW);
  assert.equal(r.paying, 2);
  assert.equal(r.atRisk, 1);
  assert.equal(r.mrr, 1119 + Math.round(7999 / 12));
});

// --- funnel & coverage ------------------------------------------------------------
test('funnel stages are strict subsets and violations are published, not clamped', () => {
  const f = buildFunnelStages({ cohortIds: ['a', 'b', 'c', 'd'], trackChosenIds: new Set(['a', 'b', 'c']), onboardedIds: new Set(['a', 'b']), startedIds: new Set(['a', 'c', 'zz']), countedIds: new Set(['a', 'c']) });
  assert.deepEqual(f.steps.slice(0, 5).map((s) => s.count), [4, 3, 2, 1, 1]);
  assert.equal(f.steps[5].available, false);
  assert.equal(f.steps[5].count, null);
  assert.deepEqual(f.orderViolations, { nutzungOhneOnboarding: 1, gezaehltOhneStart: 0 });
});

test('coverage: only completed sessions are eligible, duplicates dropped, unusable rows excluded, null over empty', () => {
  const sessions = [{ session_token: 's1', status: 'completed' }, { session_token: 's2', status: 'completed' }, { session_token: 's3', status: 'active' }];
  const evals = [{ session_token: 's1', total_score: 80 }, { session_token: 's1', total_score: 20 }, { session_token: 's2', total_score: null }, { session_token: 's9', total_score: 50 }];
  const c = reconcileCoverage(sessions, evals);
  assert.equal(c.total, 3);
  assert.equal(c.eligible, 2);
  assert.equal(c.notEligible, 1);
  assert.equal(c.evaluatedSessions, 2);
  assert.equal(c.duplicateRows, 1);
  assert.equal(c.unusableRows, 1);
  assert.equal(c.coverage, 1);
  assert.equal(c.avgScore, 0.8);
  assert.equal(c.scoreSample, 1);
  assert.equal(reconcileCoverage([], []).coverage, null);
  assert.equal(c.eligible + c.notEligible, c.total);
  assert.equal(c.evaluatedSessions + c.missingEvaluation, c.eligible);
});

test('percentile is nearest-rank, durationStats separates running, series are seeded, windows are like-for-like', () => {
  assert.equal(percentile([], 50), null);
  assert.equal(percentile([10, 20, 30, 40], 50), 20); // lower middle, documented
  assert.equal(percentile([5], 90), 5);
  const d = durationStats([{ duration_seconds: 60 }, { duration_seconds: 120 }, { started_at: '2026-01-01T00:00:00Z' }]);
  assert.equal(d.sample, 2);
  assert.equal(d.running, 1);
  assert.equal(d.median, 60);
  const s = seriesFor([{ created_at: '2026-09-02T10:00:00Z' }], '2026-09-01T00:00:00Z', '2026-09-04T00:00:00Z');
  assert.deepEqual(s.map((x) => x.count), [0, 1, 0]);
  const w = windowFor('7d', NOW);
  assert.equal(w.days, 7);
  assert.equal(Date.parse(w.to) - Date.parse(w.from), 7 * 86400000);
  assert.equal(w.previousTo, w.from);
  assert.equal(weekKey('2026-09-13T10:00:00Z'), '2026-09-07');
  const cohorts = retentionCohorts({ users: [{ id: 'u', created_at: '2026-08-31T00:00:00Z' }], activityByUser: new Map([['u', [Date.parse('2026-09-02T00:00:00Z')]]]), now: NOW.getTime() });
  assert.equal(cohorts[0].active[0], 1);
  assert.equal(cohorts[0].active[3], 0); // week 4 has not elapsed → not counted as a failure either
});

// --- support ----------------------------------------------------------------------
test('slaState: unknown for an answered ticket with no first-response timestamp, never met', () => {
  const created = '2026-09-13T00:00:00Z';
  const due = slaDueAt(created, 'normal');
  assert.equal(due, '2026-09-15T00:00:00.000Z');
  assert.equal(slaState({ status: 'resolved', sla_due_at: due, first_response_at: null }, NOW), 'unknown');
  assert.equal(slaState({ status: 'open', sla_due_at: due, first_response_at: '2026-09-13T10:00:00Z' }, NOW), 'met');
  assert.equal(slaState({ status: 'open', sla_due_at: due, first_response_at: '2026-09-16T10:00:00Z' }, NOW), 'breached');
  assert.equal(slaState({ status: 'new', sla_due_at: due }, NOW), 'on_track');
  assert.equal(slaState({ status: 'new', sla_due_at: '2026-09-13T13:00:00Z' }, NOW), 'due_soon');
  assert.equal(slaState({ status: 'new', sla_due_at: '2026-09-13T11:00:00Z' }, NOW), 'breached');
  assert.equal(slaState({ status: 'new' }, NOW), 'unknown');
  assert.deepEqual(SLA_HOURS, { urgent: 4, high: 12, normal: 48, low: 120 });
  assert.match(ticketReference('885bbcab-b586-4fb4-9811-ade4a3635a93'), /^DM-885BBCAB$/);
  assert.equal(CLOSURE_REASONS.length, 7);
  assert.equal(RESOLUTION_CATEGORIES.length, 8);
});

test('the phase 2 migration keeps internal notes on their own row and the tables policy-free', () => {
  const sql = read('migrations/2026-09-13-admin-panel-operations.sql');
  assert.ok(/visibility text NOT NULL DEFAULT 'public' CHECK \(visibility IN \('public', 'internal'\)\)/.test(sql));
  assert.ok(!/CREATE POLICY/i.test(sql));
  assert.ok(/ALTER TABLE public\.support_ticket_messages ENABLE ROW LEVEL SECURITY/.test(sql));
  const learner = read('netlify/functions/support-ticket-create.mjs');
  assert.ok(learner.includes(".eq('visibility', 'public')"), 'the learner thread must filter visibility = public');
  assert.ok(read('migrations/README.md').includes('2026-09-13-admin-panel-operations.sql'));
});
