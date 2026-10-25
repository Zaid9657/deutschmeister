// Guard: one recurring-billing rule for every screen and the deletion check
// (ACC-03, cross-check 2026-10-25).
//
// An older webhook's course upsert left the subscription's id on a 'course'
// row, and reconcileUserEntitlement (netlify/functions/_shared/
// subscriptionEntitlement.mjs retireLegacyCourseId) keeps that id while the
// plan may still charge. src/lib/checkoutAccess.js hasRecurringBilling already
// counted such a row as billing (it routes /pricing/ and /subscription to the
// portal), but its three twins did not:
//   - delete-account.mjs exempted every course row, so the learner could delete
//     the account while Lemon Squeezy kept billing (the yearly plan of a course
//     buyer renews long after the course window has expired);
//   - subscriptionPortalAction returned null for every course row, so
//     /subscription crashed reading billingAction.label;
//   - profilePlanAction told them there was "nothing to manage".
//
// The rule: a row with a non-empty lemonsqueezy_subscription_id is recurring
// billing until reconciliation clears it, whatever its plan_type. One fixture
// table runs through all four; the function's copy of the rule (functions
// cannot import src/) is pinned to the SPA's here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { hasChargingSubscription } from '../netlify/functions/delete-account.mjs';
import { hasRecurringBilling } from '../src/lib/checkoutAccess.js';
import { BILLING_PORTAL_URL, profilePlanAction, subscriptionPortalAction } from '../src/lib/billingPortal.js';

const FUTURE = '2100-01-01T00:00:00Z';
const PAST = '2000-01-01T00:00:00Z';

// [name, row, expected]: charging = deletion refused; billing = the portal is
// where it is managed (/pricing/, /subscription's plan buttons, /profile).
const ROWS = [
  ['monthly plan, live', { plan_type: 'monthly', status: 'active', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' }, { charging: true, billing: true }],
  ['monthly plan, payment failed', { plan_type: 'monthly', status: 'past_due', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' }, { charging: true, billing: true }],
  ['yearly plan, cancelled at period end', { plan_type: 'yearly', status: 'cancelled', subscription_end: FUTURE, cancel_at_period_end: true, lemonsqueezy_subscription_id: 'sub-2' }, { charging: false, billing: true }],
  ['monthly plan, expired', { plan_type: 'monthly', status: 'expired', subscription_end: PAST, cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-3' }, { charging: false, billing: false }],
  ['course row that kept a subscription id, window open', { plan_type: 'course', status: 'active', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-4' }, { charging: true, billing: true }],
  ['course row that kept a subscription id, window over', { plan_type: 'course', status: 'expired', subscription_end: PAST, cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-5' }, { charging: true, billing: true }],
  ['course row without a subscription id', { plan_type: 'course', status: 'active', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: null }, { charging: false, billing: false }],
  ['comped row (owner grant)', { plan_type: 'monthly', status: 'active', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: null }, { charging: false, billing: false }],
  ['comped row, empty id', { plan_type: 'yearly', status: 'active', subscription_end: FUTURE, cancel_at_period_end: false, lemonsqueezy_subscription_id: '  ' }, { charging: false, billing: false }],
];

test('the fixture table: deletion, /pricing/, /subscription and /profile agree on every row', () => {
  for (const [name, row, expected] of ROWS) {
    assert.equal(hasChargingSubscription([row]), expected.charging, `${name}: delete-account`);
    assert.equal(hasRecurringBilling(row), expected.billing, `${name}: hasRecurringBilling`);
    // Whatever refuses a deletion must also send the learner to the portal to cancel it.
    if (expected.charging) assert.equal(hasRecurringBilling(row), true, `${name}: refused deletion with no portal`);
    for (const isGerman of [false, true]) {
      // /subscription derives its plan-button action from the billing answer;
      // it must never be null when the page calls the row billing.
      const action = subscriptionPortalAction(hasRecurringBilling(row), row, isGerman);
      assert.equal(Boolean(action), expected.billing, `${name}: /subscription billing action (isGerman=${isGerman})`);
      if (action) {
        assert.equal(action.href, BILLING_PORTAL_URL);
        assert.ok(action.label && action.hint, `${name}: the action carries a label and a hint`);
      }
    }
  }
});

test('a course row with a retained id is treated exactly like the live plan it came from', () => {
  const live = ROWS[0][1];
  const legacy = { ...live, plan_type: 'course' };
  assert.equal(hasChargingSubscription([legacy]), hasChargingSubscription([live]));
  assert.equal(hasRecurringBilling(legacy), hasRecurringBilling(live));
  assert.deepEqual(subscriptionPortalAction(true, legacy, false), subscriptionPortalAction(true, live, false));
  const plan = profilePlanAction(true, legacy);
  assert.equal(plan.kind, 'portal', '/profile offers the portal, not "nothing to manage"');
  assert.equal(plan.href, BILLING_PORTAL_URL);
  assert.doesNotMatch(plan.hint || '', /nothing to manage/);
  // Only a course row without an id keeps the one-time-order line.
  const order = profilePlanAction(true, { ...legacy, lemonsqueezy_subscription_id: null });
  assert.equal(order.kind, 'support');
  assert.match(order.hint, /course purchase/);
});

test('a deletion refused for a legacy course row still has a way to the portal on every account screen', () => {
  for (const [name, row, expected] of ROWS) {
    if (!expected.charging) continue;
    // Paid access (hasActiveSubscription true): /profile's button is the portal.
    assert.equal(profilePlanAction(true, row).kind, 'portal', `${name}: /profile`);
    // /subscription's plan buttons read subscriptionPortalAction(recurringBilling, …).
    assert.ok(subscriptionPortalAction(true, row, true), `${name}: /subscription`);
  }
});

test('/subscription reads its billing action defensively and never navigates to a missing href', () => {
  const page = readFileSync(new URL('../src/pages/SubscriptionPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /const billingAction = subscriptionPortalAction\(recurringBilling, subscription, isGerman\);/);
  // The plan buttons render for every visitor, so their label read is guarded.
  assert.match(page, /\{recurringBilling\s*\?\s*billingAction\?\.label/, 'the plan buttons read billingAction?.label');
  assert.doesNotMatch(page, /recurringBilling\s*\?\s*billingAction\.label/);
  // Every other read sits behind a check of the action itself.
  for (const m of page.matchAll(/billingAction\.(?:label|href|hint)/g)) {
    const before = page.slice(Math.max(0, m.index - 600), m.index);
    assert.match(before, /\{billingAction && \(|if \(billingAction\)/, `unguarded read near: ${page.slice(m.index - 60, m.index + 20)}`);
  }
  assert.match(page, /if \(billingAction\) window\.location\.href = billingAction\.href;/);
});
