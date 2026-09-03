// Who gets in.
//
// The access path and the payment path were the two highest-consequence
// surfaces in this repo with no automated coverage at all: every one of the
// pre-existing tests guards marketing copy, brand or lifecycle wording. This
// suite pins the trial/subscription truth table; tests/webhook.test.mjs pins
// the gate on the money side.
//
// The functions under test are pure and live in src/services/accessRules.js
// precisely so this file can import them without a Supabase client.
//
// Dates are built RELATIVE to now inside each case. Never hard-code an ISO
// string here: a fixed date silently becomes "in the past" and the suite starts
// asserting the opposite of what it was written to assert.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkTrialStatus,
  checkSubscriptionStatus,
  hasAccess,
} from '../src/services/accessRules.js';

const DAY = 24 * 60 * 60 * 1000;
const iso = (msFromNow) => new Date(Date.now() + msFromNow).toISOString();

/** A profile whose trial ends `days` from now (negative = already ended). */
const profileWithTrial = (days, extra = {}) => ({
  trial_started_at: iso(-7 * DAY),
  trial_ends_at: iso(days * DAY),
  is_subscribed: false,
  ...extra,
});

/** A subscription whose paid period ends `days` from now. */
const subscriptionEnding = (days, extra = {}) => ({
  subscription_end: iso(days * DAY),
  plan_type: 'monthly',
  status: 'active',
  ...extra,
});

test('trial: a live window grants trial access, an elapsed one does not', () => {
  assert.equal(checkTrialStatus(profileWithTrial(3)).isInTrial, true, 'ends in 3 days');
  assert.equal(checkTrialStatus(profileWithTrial(-1)).isInTrial, false, 'ended yesterday');

  // The boundary is the one worth pinning: strictly-greater-than-now, so a
  // trial that ended a second ago is over and one ending in a second is not.
  assert.equal(checkTrialStatus({ ...profileWithTrial(0), trial_ends_at: iso(1000) }).isInTrial, true);
  assert.equal(checkTrialStatus({ ...profileWithTrial(0), trial_ends_at: iso(-1000) }).isInTrial, false);
});

test('trial: days remaining rounds up and never goes negative', () => {
  // Half a day left still reads as "1 day" — the banner must never say 0 while
  // access is still live, or a paying-curious user is told the trial is over.
  assert.equal(checkTrialStatus({ ...profileWithTrial(0), trial_ends_at: iso(DAY / 2) }).daysRemaining, 1);
  assert.equal(checkTrialStatus(profileWithTrial(-30)).daysRemaining, 0, 'long expired, floored at 0');
  assert.ok(checkTrialStatus(profileWithTrial(6)).daysRemaining >= 6);
});

test('trial: an absent or half-written profile is not a trial', () => {
  // Every one of these shapes is reachable: null while the profile loads, and
  // the NULL trial columns the SubscriptionContext backfill exists to repair.
  for (const [label, profile] of [
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['no trial_ends_at', { trial_started_at: iso(-DAY) }],
    ['no trial_started_at', { trial_ends_at: iso(DAY) }],
  ]) {
    const status = checkTrialStatus(profile);
    assert.equal(status.isInTrial, false, `${label} must not grant trial access`);
    assert.equal(status.hasTrialStarted, false, `${label} has not started a trial`);
    assert.equal(status.daysRemaining, 0, `${label} has no days remaining`);
  }
});

test('trial: a subscriber is never also in trial', () => {
  // Both are true on the row — a subscriber whose trial window has not elapsed.
  // They are exclusive by design: paid access is governed by the subscription.
  const status = checkTrialStatus(profileWithTrial(3, { is_subscribed: true }));
  assert.equal(status.isInTrial, false);
  assert.equal(status.hasTrialStarted, true, 'they did start a trial once');
});

test('subscription: access follows the paid period, not the status string', () => {
  // The rule the comment in accessRules.js defends. A cancelled subscription is
  // paid through its period; refusing it access bills someone for nothing.
  assert.equal(checkSubscriptionStatus(subscriptionEnding(10, { status: 'active' })).isActive, true);
  assert.equal(checkSubscriptionStatus(subscriptionEnding(10, { status: 'cancelled' })).isActive, true,
    'cancelled but paid through the period → access');
  assert.equal(checkSubscriptionStatus(subscriptionEnding(10, { status: 'past_due' })).isActive, true,
    'past_due inside the grace period → access');

  // And the converse: a live-looking status with an elapsed period is no access.
  assert.equal(checkSubscriptionStatus(subscriptionEnding(-1, { status: 'active' })).isActive, false,
    'status says active but the paid period is over → no access');
});

test('subscription: missing, malformed and unparseable rows fail closed', () => {
  for (const [label, sub] of [
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['null end', { subscription_end: null }],
    ['empty-string end', { subscription_end: '' }],
    ['garbage end', { subscription_end: 'not-a-date' }],
  ]) {
    const status = checkSubscriptionStatus(sub);
    assert.equal(status.isActive, false, `${label} must not grant access`);
    assert.equal(status.expiresAt, null, `${label} exposes no expiry`);
  }
});

test('subscription: a valid row reports its expiry and plan', () => {
  const sub = subscriptionEnding(30, { plan_type: 'yearly' });
  const status = checkSubscriptionStatus(sub);
  assert.equal(status.isActive, true);
  assert.equal(status.expiresAt, sub.subscription_end);
  assert.equal(status.planType, 'yearly');
});

test('hasAccess: the full truth table', () => {
  // Rows are (profile, subscription) → expected access. Every combination the
  // guard can actually observe, including the two that used to disagree with
  // each other and let a payer be shown the paywall.
  const cases = [
    ['no profile, no subscription',            null,                  null,                   false],
    ['loading (both null)',                    null,                  undefined,              false],
    ['live trial, no subscription',            profileWithTrial(3),   null,                   true],
    ['expired trial, no subscription',         profileWithTrial(-1),  null,                   false],
    ['expired trial, live subscription',       profileWithTrial(-1),  subscriptionEnding(30), true],
    ['expired trial, expired subscription',    profileWithTrial(-1),  subscriptionEnding(-1), false],
    ['live trial AND live subscription',       profileWithTrial(3),   subscriptionEnding(30), true],
    ['live trial, expired subscription',       profileWithTrial(3),   subscriptionEnding(-1), true],
    ['subscriber flag set, live subscription', profileWithTrial(3, { is_subscribed: true }), subscriptionEnding(30), true],
    // The regression that mattered: is_subscribed true on the profile but the
    // subscriptions row lapsed. The flag must not grant access on its own.
    ['subscriber flag set, subscription lapsed', profileWithTrial(-1, { is_subscribed: true }), subscriptionEnding(-1), false],
    ['subscriber flag set, no subscription row', profileWithTrial(-1, { is_subscribed: true }), null, false],
  ];

  for (const [label, profile, subscription, expected] of cases) {
    assert.equal(hasAccess(profile, subscription), expected, label);
  }
});

test('hasAccess: is_subscribed alone never opens a paid route', () => {
  // Stated separately from the table because it is the whole reason the
  // predicate ignores that column. If someone reintroduces a fallback to
  // profile.is_subscribed, this is the test that says no.
  const flaggedButUnpaid = { is_subscribed: true };
  assert.equal(hasAccess(flaggedButUnpaid, null), false);
  assert.equal(hasAccess(flaggedButUnpaid, { subscription_end: null }), false);
});
