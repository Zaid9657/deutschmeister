// Admin panel, phase 3 — content lifecycle, coupons, status, usage rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { LIFECYCLE_TRANSITIONS, canTransition, allowedTransitions, reviewState, safeDate, validateHierarchy, wouldCreateCycle, CONTENT_TABLE_KEYS } from '../netlify/functions/_shared/adminContentLib.mjs';
import { normalizeCode, effectiveStatus, remainingLimit, computeDiscount, evaluateCoupon, needsElevatedApproval, validateCouponInput, STATUS_TRANSITIONS, LOCKED_AFTER_REDEMPTION } from '../netlify/functions/_shared/adminCouponsLib.mjs';
import { check, notInstrumented, overallState, judge, THRESHOLDS } from '../netlify/functions/_shared/adminStatusLib.mjs';
import { classifyFailure, fingerprint, groupErrors, secondSessionWithin7Days, rollup } from '../netlify/functions/_shared/adminUsageLib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const NOW = new Date('2026-09-13T12:00:00Z');

test('lifecycle: archived → published is absent; every other transition is as declared', () => {
  assert.ok(!canTransition('archived', 'published'));
  assert.deepEqual(allowedTransitions('archived'), ['draft']);
  assert.ok(canTransition('hidden', 'published'));
  assert.ok(!canTransition('draft', 'published'), 'a draft goes through review');
  assert.equal(allowedTransitions('nope').length, 0);
  assert.equal(Object.keys(LIFECYCLE_TRANSITIONS).length, 5);
  assert.equal(CONTENT_TABLE_KEYS.length, 6);
});

test('reviewState separates never from due; safeDate never returns Invalid Date', () => {
  assert.equal(reviewState({ last_reviewed_at: null }, NOW), 'never');
  assert.equal(reviewState({ last_reviewed_at: '2026-01-01', next_review_at: null }, NOW), 'scheduled_unknown');
  assert.equal(reviewState({ last_reviewed_at: '2026-01-01', next_review_at: '2026-06-01' }, NOW), 'due');
  assert.equal(reviewState({ last_reviewed_at: '2026-01-01', next_review_at: '2027-01-01' }, NOW), 'ok');
  assert.equal(safeDate('nonsense'), null);
  assert.equal(safeDate(null), null);
  assert.equal(safeDate('2026-09-13T10:00:00Z'), '2026-09-13T10:00:00.000Z');
});

test('hierarchy: orphans, cycles (bounded), duplicate siblings, roots — each with its rows', () => {
  const rows = [
    { slug: 'a', sub_level: 'A1.1', title_de: 'Artikel', prerequisite_slugs: [] },
    { slug: 'b', sub_level: 'A1.1', title_de: 'Verben', prerequisite_slugs: ['a'] },
    { slug: 'c', sub_level: 'A1.1', title_de: 'Verben', prerequisite_slugs: ['zzz'] },
    { slug: 'd', sub_level: 'A1.2', title_de: 'X', prerequisite_slugs: ['e'] },
    { slug: 'e', sub_level: 'A1.2', title_de: 'Y', prerequisite_slugs: ['d'] },
  ];
  const v = validateHierarchy(rows);
  assert.deepEqual(v.orphans, [{ slug: 'c', missing: 'zzz' }]);
  assert.equal(v.cycles.length, 2);
  assert.equal(v.duplicateSiblings.length, 1);
  assert.equal(v.roots, 1);
  assert.equal(v.healthy, false);
  assert.ok(wouldCreateCycle(rows, 'a', 'b'));
  assert.ok(!wouldCreateCycle(rows, 'b', 'a'));
  assert.ok(wouldCreateCycle(rows, 'a', 'a'));
});

test('coupons: derived status, remaining never 0-for-unlimited, discount capped, refusals in order', () => {
  const c = { status: 'active', starts_at: '2026-01-01T00:00:00Z', ends_at: '2026-12-31T00:00:00Z', total_limit: 10, per_user_limit: 1, discount_type: 'percent', discount_value: 20, new_customer_only: true, applicable_variant_ids: ['1393033'], minimum_order_amount: 500 };
  const nowMs = NOW.getTime();
  assert.equal(normalizeCode('  willkommen20 '), 'WILLKOMMEN20');
  assert.equal(effectiveStatus(c, 0, nowMs), 'active');
  assert.equal(effectiveStatus(c, 10, nowMs), 'exhausted');
  assert.equal(effectiveStatus({ ...c, ends_at: '2026-01-02T00:00:00Z' }, 0, nowMs), 'expired');
  assert.equal(effectiveStatus({ ...c, status: 'paused' }, 0, nowMs), 'paused');
  assert.equal(remainingLimit({ total_limit: null }, 5), null);
  assert.equal(remainingLimit({ total_limit: 10 }, 12), 0);
  assert.equal(computeDiscount(c, 999), 200);
  assert.equal(computeDiscount({ discount_type: 'fixed', discount_value: 5000 }, 999), 999);
  assert.equal(evaluateCoupon(null, {}).reason, 'not_found');
  assert.equal(evaluateCoupon({ ...c, status: 'archived' }, {}).reason, 'archived');
  assert.equal(evaluateCoupon({ ...c, status: 'draft' }, {}).reason, 'draft');
  assert.equal(evaluateCoupon(c, { nowMs, redemptionCount: 10 }).reason, 'exhausted');
  assert.equal(evaluateCoupon({ ...c, starts_at: '2027-01-01T00:00:00Z' }, { nowMs }).reason, 'not_started');
  assert.equal(evaluateCoupon(c, { nowMs, userRedemptionCount: 1 }).reason, 'per_user_limit');
  assert.equal(evaluateCoupon(c, { nowMs, isNewCustomer: false }).reason, 'new_customer_only');
  assert.equal(evaluateCoupon(c, { nowMs, isNewCustomer: true, variantId: '999' }).reason, 'variant_scope');
  assert.equal(evaluateCoupon(c, { nowMs, isNewCustomer: true, variantId: '1393033', amountMinor: 100 }).reason, 'minimum_order');
  const ok = evaluateCoupon(c, { nowMs, isNewCustomer: true, variantId: '1393033', amountMinor: 999 });
  assert.deepEqual([ok.ok, ok.discount, ok.final], [true, 200, 799]);
  assert.ok(needsElevatedApproval({ discount_type: 'percent', discount_value: 50, total_limit: 5 }));
  assert.ok(needsElevatedApproval({ discount_type: 'fixed', discount_value: 10000, total_limit: 5 }));
  assert.ok(needsElevatedApproval({ discount_type: 'percent', discount_value: 5, total_limit: null }));
  assert.ok(!needsElevatedApproval({ discount_type: 'percent', discount_value: 5, total_limit: 5 }));
  assert.deepEqual(STATUS_TRANSITIONS.archived, []);
  assert.ok(LOCKED_AFTER_REDEMPTION.includes('discount_value'));
});

test('coupon input: German dates and product names are rejected or parsed, never silently accepted', () => {
  const bad = validateCouponInput({ code: 'ab', internal_name: '', discount_type: 'percent', discount_value: 150, ends_at: '31.12.2026', applicable_variant_ids: 'Pro Monthly' });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.code && bad.errors.internal_name && bad.errors.discount_value && bad.errors.ends_at && bad.errors.applicable_variant_ids);
  const good = validateCouponInput({ code: 'willkommen20', internal_name: 'Launch', discount_type: 'percent', discount_value: 20, starts_at: '2026-10-01T00:00:00Z', ends_at: '2026-12-31T00:00:00Z', total_limit: 100, applicable_variant_ids: '1393033, 2088862' });
  assert.equal(good.ok, true, JSON.stringify(good.errors));
  assert.equal(good.value.normalized_code, 'WILLKOMMEN20');
  assert.deepEqual(good.value.applicable_variant_ids, ['1393033', '2088862']);
  const inverted = validateCouponInput({ code: 'ABCD', internal_name: 'x', discount_type: 'fixed', discount_value: 500, starts_at: '2026-12-31T00:00:00Z', ends_at: '2026-01-01T00:00:00Z' });
  assert.ok(inverted.errors.ends_at, 'a period that ends before it begins is a typo');
});

test('status: judged against printed thresholds, unknown never outranks a real state', () => {
  assert.equal(judge(84, THRESHOLDS.dbLatencyMs), 'operational');
  assert.equal(judge(2500, THRESHOLDS.dbLatencyMs), 'degraded');
  assert.equal(judge(9000, THRESHOLDS.dbLatencyMs), 'critical');
  assert.equal(judge(0.9, THRESHOLDS.evalCoverage), 'operational');
  assert.equal(judge(0.4, THRESHOLDS.evalCoverage), 'degraded');
  assert.equal(judge(0.1, THRESHOLDS.evalCoverage), 'critical');
  assert.equal(judge(null, THRESHOLDS.dbLatencyMs), 'unknown');
  const c1 = check('db', 'DB', { value: 84, thresholdKey: 'dbLatencyMs' });
  assert.equal(c1.state, 'operational');
  assert.deepEqual(c1.threshold, { degraded: 2000, critical: 5000, direction: 'asc' });
  const c2 = notInstrumented('email', 'E-Mail', 'nicht erfasst', 'Webhook schreiben');
  assert.equal(c2.state, 'unknown');
  assert.equal(overallState([c1, c2]), 'operational');
  assert.equal(overallState([c2]), 'unknown');
  assert.equal(overallState([c1, check('w', 'W', { value: 5, thresholdKey: 'webhookFailures24h' }), c2]), 'critical');
});

test('usage: failure classes, fingerprints, retention excludes too-recent users, rollup needs 3 samples', () => {
  const now = NOW.getTime();
  assert.equal(classifyFailure({ status: 'cancelled' }).kind, 'cancelled');
  assert.equal(classifyFailure({ status: 'active', created_at: '2026-09-13T08:00:00Z' }, now).kind, 'abandoned');
  assert.equal(classifyFailure({ status: 'active', created_at: '2026-09-13T11:30:00Z' }, now), null);
  assert.equal(classifyFailure({ status: 'completed', user_turns: 0, mode: 'free' }, now).kind, 'no_speech');
  assert.equal(classifyFailure({ status: 'completed', user_turns: 4, evaluated: false }, now).kind, 'not_evaluated');
  assert.equal(classifyFailure({ status: 'completed', user_turns: 4, evaluated: true }, now), null);
  assert.equal(fingerprint('Order 8933424 failed for "x@y.z" 885bbcab-b586-4fb4-9811-ade4a3635a93'), 'order <n> failed for <v> <id>');
  const g = groupErrors([{ error: 'Order 1 failed', created_at: '2026-09-01' }, { error: 'Order 2 failed', created_at: '2026-09-02' }, { error: 'Order 12345 failed', created_at: '2026-09-03' }]);
  assert.equal(g.length, 3, 'small numbers stay distinct, 3+ digits normalise');
  const r = secondSessionWithin7Days([{ user_id: 'a', created_at: '2026-08-01T00:00:00Z' }, { user_id: 'a', created_at: '2026-08-03T00:00:00Z' }, { user_id: 'b', created_at: '2026-08-01T00:00:00Z' }, { user_id: 'c', created_at: '2026-09-12T00:00:00Z' }], now);
  assert.deepEqual(r, { eligible: 2, retained: 1, tooRecent: 1, rate: 0.5 });
  const ru = rollup([{ k: 'x', score: 50, completed: true }, { k: 'x', score: 70, completed: false }, { k: null, score: 1, completed: true }], (row) => row.k);
  assert.equal(ru.unattributed, 1);
  assert.equal(ru.rows[0].averageScore, null);
  assert.equal(ru.rows[0].belowMinimumSample, true);
  assert.equal(ru.rows[0].completionRate, 0.5);
});

test('phase 3 wiring: migration defaults, the webhook ledger, and no report metric outside the shared groups', () => {
  const sql = read('migrations/2026-09-13-admin-panel-product.sql');
  assert.ok(/lifecycle_status text NOT NULL DEFAULT ''published''/.test(sql), 'the lifecycle default must be published');
  assert.ok(!/last_reviewed_at\s*=\s*updated_at/.test(sql), 'never backfill last_reviewed_at');
  assert.ok(/CONSTRAINT coupon_redemptions_unique_order UNIQUE \(coupon_id, order_id\)/.test(sql));
  assert.ok(/CONSTRAINT coupons_period_valid/.test(sql) && /coupons_percent_range/.test(sql));
  assert.ok(!/CREATE POLICY/i.test(sql));
  const wh = read('netlify/functions/lemonsqueezy-webhook.mjs');
  assert.ok(wh.includes('async function recordCouponRedemption'));
  assert.ok(wh.indexOf('recordCouponRedemption(meta, orderId') < wh.indexOf('const course = courseForVariant(orderVariantId)'), 'the ledger writes before the fulfilment lanes');
  assert.ok(/error\.code === '23505'\) return \{ duplicate: true \}/.test(wh));
  const reports = read('netlify/functions/admin-reports.mjs');
  assert.ok(reports.includes("from './_shared/adminCockpit.mjs'"), 'reports compose the cockpit groups');
  assert.ok(!/\.from\('webhook_logs'\)/.test(reports), 'reports do not recompute revenue');
  assert.ok(read('migrations/README.md').includes('2026-09-13-admin-panel-product.sql'));
});
