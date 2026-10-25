// Guard suite for /subscription/success (ACC-08, ACC-10, ACC-11, cross-check
// 2026-10-25).
//
// ACC-08: the course ticket chose its Pro line from `access_until` being null.
// Every course order now stores its included-Pro deadline (lemonsqueezy-
// webhook.mjs handleCourseOrder), so a live monthly subscriber who bought A1.2
// read "…open until <date>. After that the AI tools return to the free
// allowance — you are never charged again" while the plan kept renewing. The
// line now follows the account's live recurring plan (proLineFor), and "never
// charged again" is said only to a buyer with no recurring billing at all.
//
// ACC-10: the page polled Supabase five times and then said "Activation is
// taking longer… email us", and "Check again" only polled again, although
// verify-subscription recovers a failed subscription webhook. Both now try it
// for a recurring (or unknown) checkout; a course order keeps the plain
// refresh, since verify-subscription only replays subscription events.
//
// ACC-11: the loop kept refreshing three tables after access had landed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { hasRecurringBilling } from '../src/lib/checkoutAccess.js';

const page = readFileSync(new URL('../src/pages/SubscriptionSuccessPage.jsx', import.meta.url), 'utf8');

/** A module-level `export const <name> = …;` of the page, as shipped. */
const pageExport = (name, context) => {
  const start = page.indexOf(`export const ${name} = `);
  assert.ok(start >= 0, `${name} is not exported by the success page`);
  // The declaration ends at the first unindented `};` or `);` line after it.
  const ends = ['\n};\n', '\n);\n'].map((close) => page.indexOf(close, start)).filter((i) => i > 0);
  assert.ok(ends.length, `${name}: no closing line found`);
  const end = Math.min(...ends) + 3;
  return vm.runInNewContext(`${page.slice(start, end).replace(`export const ${name}`, `const ${name}`)}\n${name};`, context);
};

const renewingPlan = pageExport('renewingPlan', { hasRecurringBilling, Date, Boolean });
const proLineFor = pageExport('proLineFor', {});

const FUTURE = '2100-01-01T00:00:00Z';
const LIVE = { plan_type: 'monthly', status: 'active', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' };

test('ACC-08: only a plan that renews by itself counts as "already covered"', () => {
  assert.equal(renewingPlan(LIVE), true);
  assert.equal(renewingPlan({ ...LIVE, status: 'on_trial' }), true);
  for (const [why, row] of [
    ['no row', null],
    ['cancelled at period end', { ...LIVE, status: 'cancelled', cancel_at_period_end: true }],
    ['set to cancel', { ...LIVE, cancel_at_period_end: true }],
    ['payment failed', { ...LIVE, status: 'past_due' }],
    ['paused', { ...LIVE, status: 'paused' }],
    ['period over', { ...LIVE, subscription_end: '2000-01-01T00:00:00Z' }],
    ['a course row (its Pro is the included window)', { plan_type: 'course', status: 'active', subscription_end: FUTURE, lemonsqueezy_subscription_id: null }],
    ['a legacy course row that kept an id', { plan_type: 'course', status: 'active', subscription_end: FUTURE, lemonsqueezy_subscription_id: 'sub-9' }],
    ['a comped row', { ...LIVE, lemonsqueezy_subscription_id: null }],
  ]) assert.equal(renewingPlan(row), false, why);
});

test('ACC-08: a live subscriber who buys a course is never told "never charged again"', () => {
  const line = proLineFor({ proUntil: '20 January 2027', renewing: true, recurringBilling: true });
  assert.match(line, /Pro subscription already covers the AI tools/);
  assert.doesNotMatch(line, /never charged again|free allowance/);
});

test('ACC-08: a course-only buyer reads the window, the free allowance after it and "never charged again"', () => {
  const line = proLineFor({ proUntil: '20 January 2027', renewing: false, recurringBilling: false });
  assert.match(line, /open until 20 January 2027\./);
  assert.match(line, /return to the free allowance — you are never charged again\./);
});

test('ACC-08: a buyer whose plan can still charge (failed, paused, cancelling) gets no "never charged" promise', () => {
  const line = proLineFor({ proUntil: '20 January 2027', renewing: false, recurringBilling: true });
  assert.match(line, /open until 20 January 2027\./);
  assert.match(line, /The course itself never renews\./);
  assert.doesNotMatch(line, /never charged again/);
});

test('ACC-08: a legacy purchase without a stored deadline invents no date', () => {
  for (const recurringBilling of [false, true]) {
    const line = proLineFor({ proUntil: null, renewing: false, recurringBilling });
    assert.doesNotMatch(line, /until|null|undefined/);
    assert.match(line, /included Pro months/);
  }
  assert.match(proLineFor({ proUntil: null, renewing: true, recurringBilling: true }), /already covers/);
});

test('ACC-08: the ticket renders proLineFor from the live subscription row', () => {
  assert.match(page, /const proLine = proLineFor\(\{ proUntil, renewing: renewingPlan\(subscription\), recurringBilling: hasRecurringBilling\(subscription\) \}\);/);
  assert.match(page, /<span className="block text-graphite">\{proLine\}<\/span>/);
  assert.doesNotMatch(page, /NULL there\s+means the buyer already had a live paid subscription/, 'the stale comment is gone');
});

/** The polling effect as shipped, run to completion over stubs. */
async function runPolling({ pendingRecurring, verifiedAfter = Infinity }) {
  const start = page.indexOf('    const confirmPurchase = async () => {');
  const end = page.indexOf('\n    confirmPurchase();', start);
  assert.ok(start >= 0 && end > start, 'the polling effect moved');
  const calls = [];
  const verifiedRef = { current: false };
  const context = {
    verifiedRef,
    canRecover: pendingRecurring,
    refreshSubscription: async () => {
      calls.push('refresh');
      if (calls.filter((c) => c === 'refresh').length >= verifiedAfter) verifiedRef.current = true;
    },
    verifySubscription: async () => { calls.push('verify'); return false; },
    setPolling: (value) => calls.push(`polling:${value}`),
    setTimeout: (fn) => { fn(); return 0; },
    Promise,
  };
  await vm.runInNewContext(`(async () => {\n    let cancelled = false;\n${page.slice(start, end)}\n    return confirmPurchase();\n})()`, context);
  return calls;
}

test('ACC-10: after five refreshes, a recurring checkout tries the webhook recovery before the delay card', async () => {
  const calls = await runPolling({ pendingRecurring: true });
  assert.deepEqual(calls, ['refresh', 'refresh', 'refresh', 'refresh', 'refresh', 'verify', 'polling:false']);
});

test('ACC-10: a course order keeps the plain refresh (verify-subscription cannot replay an order)', async () => {
  const calls = await runPolling({ pendingRecurring: false });
  assert.deepEqual(calls, ['refresh', 'refresh', 'refresh', 'refresh', 'refresh', 'polling:false']);
  assert.match(page, /const canRecover = !pendingProduct \|\| isRecurringProduct\(pendingProduct\);/);
});

test('ACC-11: the loop stops as soon as access lands', async () => {
  const calls = await runPolling({ pendingRecurring: true, verifiedAfter: 2 });
  assert.deepEqual(calls, ['refresh', 'refresh'], 'no further reads, no recovery, no trailing state change');
  assert.match(page, /verifiedRef\.current = verified;/);
});

test('ACC-10: "Check again" tries the recovery first for a recurring checkout, then reads again', async () => {
  const start = page.indexOf('  const checkAgain = async () => {');
  const end = page.indexOf('\n  };\n', start);
  assert.ok(start >= 0 && end > start);
  for (const canRecover of [true, false]) {
    const calls = [];
    const checkAgain = vm.runInNewContext(`(() => {\n${page.slice(start, end)}\n  };\n  return checkAgain;\n})()`, {
      canRecover,
      setPolling: (value) => calls.push(`polling:${value}`),
      verifySubscription: async () => { calls.push('verify'); return false; },
      refreshSubscription: async () => { calls.push('refresh'); },
    });
    await checkAgain();
    assert.deepEqual(calls, canRecover
      ? ['polling:true', 'verify', 'refresh', 'polling:false']
      : ['polling:true', 'refresh', 'polling:false']);
  }
  assert.match(page, /onClick=\{checkAgain\}/);
});
