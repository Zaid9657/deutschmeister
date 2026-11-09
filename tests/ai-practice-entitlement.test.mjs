import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courseAccessReason, subscriptionOpensCourses, COURSE_SUBSCRIPTION_CUTOFF } from '../src/lib/levelEntitlement.js';
import { subscriptionStatus } from '../src/lib/subscriptionStatus.js';
import { loadLevelAccess, fakeSupabase } from './helpers/courseCheckoutHarness.mjs';
const now = Date.parse('2026-11-15T12:00:00Z');
const row = (start, extra = {}) => ({ status: 'active', plan_type: 'monthly', subscription_start: start, subscription_end: '2026-12-01T00:00:00Z', ...extra });
const old = row('2026-11-09T23:59:59.999Z'); const fresh = row(COURSE_SUBSCRIPTION_CUTOFF);
const snapshot = (subscription, extra = {}) => ({ signedIn: true, profile: { is_subscribed: true }, subscription, purchases: [], ...extra });
const lib = loadLevelAccess({});
test('the cutoff preserves old recurring subscriptions and makes new AI Practice subscriptions tools-only', () => {
  for (const plan_type of ['monthly', 'yearly']) {
    assert.equal(subscriptionOpensCourses({ ...old, plan_type }, now), true);
    assert.equal(subscriptionOpensCourses({ ...fresh, plan_type }, now), false);
    for (const level of ['a1.2', 'a2.1', 'b2.2']) {
      assert.equal(courseAccessReason(snapshot({ ...old, plan_type }), level, now), 'pro');
      assert.equal(courseAccessReason(snapshot({ ...fresh, plan_type }), level, now), null);
      assert.equal(lib.levelOpen(snapshot({ ...fresh, plan_type }), level, now).open, false);
      assert.equal(lib.levelOpen(snapshot({ ...old, plan_type }), level, now).open, true);
    }
    assert.equal(subscriptionStatus({ ...fresh, plan_type }, now).isActive, true, 'new subscribers retain AI-tool access');
  }
});
test('created_at is the fallback; unknown/invalid start dates and expired/terminal plans never grandfather', () => {
  assert.equal(subscriptionOpensCourses({ ...old, subscription_start: null, created_at: old.subscription_start }, now), true);
  for (const start of [undefined, null, '', 'invalid', COURSE_SUBSCRIPTION_CUTOFF, '2026-11-11T00:00:00Z']) assert.equal(subscriptionOpensCourses(row(start), now), false);
  for (const status of ['expired', 'unpaid', 'refunded', 'unknown']) assert.equal(subscriptionOpensCourses({ ...old, status }, now), false);
  assert.equal(subscriptionOpensCourses({ ...old, subscription_end: '2026-11-15T12:00:00Z' }, now), false);
  assert.equal(subscriptionOpensCourses({ ...old, subscription_start: COURSE_SUBSCRIPTION_CUTOFF, created_at: '2026-01-01T00:00:00Z' }, now), false, 'start wins over row creation');
});
test('cancelled, paused and past-due grandfathered plans keep only their confirmed paid-through period', () => {
  for (const status of ['cancelled', 'paused', 'past_due']) {
    assert.equal(subscriptionOpensCourses({ ...old, status }, now), true);
    assert.equal(subscriptionOpensCourses({ ...old, status, subscription_end: '2026-11-01' }, now), false);
    assert.equal(subscriptionOpensCourses({ ...fresh, status }, now), false);
  }
});
test('free entry, course ownership, legacy purchases, included windows, premium grants and trials remain available', () => {
  assert.equal(courseAccessReason({}, 'a1.1', now), 'free');
  const purchase = { product_key: 'course_a1_2', status: 'active', access_until: '2026-11-01' };
  assert.equal(courseAccessReason(snapshot(fresh, { purchases: [purchase] }), 'a1.2', now), 'owned');
  assert.equal(courseAccessReason(snapshot(fresh, { purchases: [{ ...purchase, status: 'refunded' }] }), 'a1.2', now), null);
  assert.equal(courseAccessReason({ purchases: [{ product_key: 'course_alle', status: 'active' }] }, 'b2.2', now), 'owned');
  const window = { ...purchase, access_until: '2026-12-01' };
  assert.equal(courseAccessReason({ purchases: [window] }, 'b2.2', now), 'pro');
  assert.equal(courseAccessReason({ subscription: row(COURSE_SUBSCRIPTION_CUTOFF, { plan_type: 'course' }) }, 'a2.1', now), 'pro');
  assert.equal(courseAccessReason({ profile: { subscription_tier: 'premium' } }, 'b2.2', now), 'pro');
  const trial = { trial_started_at: '2026-11-12', trial_ends_at: '2026-11-19', is_subscribed: false };
  assert.equal(courseAccessReason({ profile: trial }, 'a1.2', now), 'trial');
  assert.equal(courseAccessReason({ profile: { ...trial, trial_ends_at: '2026-11-15T12:00:00Z' } }, 'a1.2', now), null);
  assert.equal(courseAccessReason({ profile: { is_subscribed: true } }, 'a1.2', now), null, 'a stale flag grants nothing');
});
test('static snapshots fetch the subscription dates, and failed billing reads remain unverified', async () => {
  const fake = fakeSupabase({ subscription: fresh }); const access = loadLevelAccess(fake.client);
  const snapshot = await access.loadEntitlementSnapshot();
  assert.equal(snapshot.subscription.subscription_start, COURSE_SUBSCRIPTION_CUTOFF);
  assert.deepEqual(fake.reads, ['auth', 'profiles', 'purchases', 'subscriptions']);
  const failed = fakeSupabase({ subscriptionError: new Error('offline') });
  assert.equal((await loadLevelAccess(failed.client).loadEntitlementSnapshot()).verified, false);
});
test('SPA gates and static continuation use the same course policy instead of AI access', () => {
  const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  assert.match(read('src/contexts/SubscriptionContext.jsx'), /const hasLevelAccess = \(level\) => Boolean\(courseAccessReason\(\{ profile, subscription, purchases \}, level\)\)/);
  assert.match(read('astro-site/src/layouts/Layout.astro'), /hasLevelAccess: \(level\) => Boolean\(courseAccessReason\(account, level, now\)\)/);
});

test('a new AI subscription cannot bypass the course-level gate for final tests', () => {
  const source = readFileSync(new URL('../src/components/ExamSubscriptionGuard.jsx', import.meta.url), 'utf8');
  assert.match(source, /const examAccess = resolved\?\.gateLevel \? hasLevelAccess\(resolved.gateLevel\) : hasAccess;/);
  const expression = source.match(/const examAccess = ([^;]+);/)[1];
  const evaluate = new Function('resolved', 'hasLevelAccess', 'hasAccess', `return (${expression});`);
  for (const subscription of [old, fresh]) {
    const access = (level) => Boolean(courseAccessReason(snapshot(subscription), level, now));
    assert.equal(evaluate({ gateLevel: 'a1.2' }, access, true), subscription === old);
    assert.equal(evaluate({ gateLevel: 'a1.1' }, access, true), true);
  }
});
