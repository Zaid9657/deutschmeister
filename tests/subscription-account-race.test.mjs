import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deferred, providerHarness, settle, statusChecks } from './helpers/subscriptionProvider.mjs';

// The provider runs as shipped (tests/helpers/subscriptionProvider.mjs): its
// real hooks and async callbacks, only the JSX return replaced.

test('late account A responses cannot overwrite account B or clear its loading state', async () => {
  const accountA = deferred();
  const accountB = deferred();
  const h = providerHarness({ getSubscription: (id) => id === 'A' ? accountA.promise : accountB.promise });
  h.account('A'); h.render();
  h.account(null); h.render();
  h.account('B'); h.render();
  accountA.resolve({ status: 'active', subscription_end: '2100-01-01' });
  await settle();
  let value = h.render();
  assert.equal(value.loading, true, 'A finally must not finish B loading');
  assert.equal(value.subscription, null);
  assert.equal(value.profile, null);
  accountB.resolve(null);
  await settle();
  value = h.render();
  assert.equal(value.loading, false);
  assert.equal(value.profile.id, 'B');
  assert.equal(value.hasLevelAccess('b2.2'), false);
});

test('an account switch masks loaded purchases before effects run', async () => {
  const h = providerHarness({ getPurchases: async () => [{ product_key: 'course_a2', status: 'active' }] });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasLevelAccess('a2.1'), true);
  h.account('B');
  const value = h.render(false);
  assert.equal(value.loading, true);
  assert.equal(value.profile, null);
  assert.equal(value.purchases.length, 0);
  assert.equal(value.hasLevelAccess('a2.1'), false);
});

test('an older refresh for the same account cannot replace a newer result', async () => {
  const older = deferred();
  let calls = 0;
  const h = providerHarness({ getSubscription: () => ++calls === 1 ? older.promise : Promise.resolve(null) });
  h.account('A');
  const initial = h.render();
  await initial.refreshSubscription();
  older.resolve({ status: 'active', subscription_end: '2100-01-01' });
  await settle();
  assert.equal(h.render().subscription, null);
});

test('a profile lookup completing after signout cannot backfill trials or placement', async () => {
  const profile = deferred();
  let writes = 0;
  const h = providerHarness({
    getUserProfile: () => profile.promise,
    startFreeTrial: async () => { writes++; },
    settlePendingPlacement: async () => { writes++; },
  });
  h.account('A'); h.render();
  h.account(null); h.render();
  profile.resolve({ id: 'A', trial_started_at: null });
  await settle();
  assert.equal(writes, 0);
  assert.equal(h.render().profile, null);
});

test('included course Pro remains available beside a failed recurring subscription', async () => {
  const h = providerHarness({
    getSubscription: async () => ({ status: 'past_due', subscription_end: '2000-01-01' }),
    getPurchases: async () => [{ product_key: 'course_a2', status: 'active', access_until: '2100-01-01' }],
  });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasActiveSubscription(), true);
});

test('terminal and unknown statuses never grant paid access from a future date', () => {
  for (const status of ['expired', 'unpaid', 'unknown', undefined]) {
    assert.equal(statusChecks.checkSubscriptionStatus({ status, subscription_end: '2100-01-01' }).isActive, false, status);
  }
  for (const status of ['active', 'on_trial', 'cancelled', 'past_due', 'paused']) {
    assert.equal(statusChecks.checkSubscriptionStatus({ status, subscription_end: '2100-01-01' }).isActive, true, status);
    assert.equal(statusChecks.checkSubscriptionStatus({ status, subscription_end: '2000-01-01' }).isActive, false, status);
  }
});

// ACC-01 (cross-check 2026-10-25): a refresh of the account on screen is a
// background revalidation. Every guard (LevelSubscriptionGuard,
// SubscriptionGuard, ExamSubscriptionGuard, PurchaseGuard) swaps its page for a
// spinner while `loading` is true, and an unmounted page loses its work: an
// A1.2 checkpoint restarted at its intro with no answers, a Modelltest Hören
// clip stopped after its play was counted, /profile blanked on every goal chip.
// The refresh came from a tab return, from auth-js's SIGNED_IN /
// TOKEN_REFRESHED (a new user object for the same id, about hourly) and from
// refreshSubscription().
const OWNER = {
  getSubscription: async () => ({ status: 'active', plan_type: 'monthly', subscription_end: '2100-01-01', lemonsqueezy_subscription_id: 'sub-1' }),
  getPurchases: async () => [{ product_key: 'course_a1_2', status: 'active', access_until: '2000-01-01' }],
};

/** A clock the provider reads (Date.now) that a test moves by hand; Date.parse stays real. */
const clockAt = (start = Date.now()) => {
  const clock = { now: start, Date: { now: () => clock.now, parse: (value) => Date.parse(value) } };
  return clock;
};

test('ACC-01: a new auth user object for the same account neither blanks guarded pages nor reloads it within the throttle', async () => {
  let reads = 0;
  const h = providerHarness({ ...OWNER, getSubscription: async (...args) => { reads++; return OWNER.getSubscription(...args); } });
  h.account('A'); h.render(); await settle();
  const loaded = h.render();
  assert.equal(loaded.loading, false);
  assert.equal(reads, 1);
  h.account('A'); // auth-js: INITIAL_SESSION / SIGNED_IN right after the first load
  h.render();
  const during = h.render(false);
  assert.equal(during.loading, false, 'a token refresh must not swap guarded pages for the spinner');
  assert.equal(during.subscription?.status, 'active');
  assert.equal(during.hasLevelAccess('a1.2'), true);
  await settle();
  assert.equal(reads, 1, 'the same account id neither recreates the loader nor re-reads within seconds of a load');
});

test('ACC-01: a tab return revalidates in the background and keeps the data on screen', async () => {
  const refresh = deferred();
  const clock = clockAt();
  let reads = 0;
  const h = providerHarness({ ...OWNER, Date: clock.Date, getSubscription: () => (++reads === 1 ? OWNER.getSubscription() : refresh.promise) });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().loading, false);
  h.visible();
  assert.equal(reads, 1, 'a tab return within seconds of the load is the same read');
  clock.now += 6000; // past the throttle
  h.visible();
  assert.equal(reads, 2, 'the tab return still refreshes');
  const during = h.render(false);
  assert.equal(during.loading, false, 'a background refresh must not unmount the page');
  assert.equal(during.subscription?.status, 'active', 'the subscription stays while the refresh is in flight');
  assert.equal(during.purchases.length, 1);
  assert.equal(during.profile?.id, 'A');
  assert.equal(during.hasLevelAccess('a1.2'), true);
  refresh.resolve({ status: 'cancelled', plan_type: 'monthly', subscription_end: '2100-01-01', lemonsqueezy_subscription_id: 'sub-1' });
  await settle();
  const after = h.render();
  assert.equal(after.loading, false);
  assert.equal(after.subscription.status, 'cancelled', 'the refreshed row lands');
});

test('ACC-01: refreshSubscription() (a settings save) keeps loading false', async () => {
  const h = providerHarness(OWNER);
  h.account('A'); h.render(); await settle();
  const pending = h.render().refreshSubscription();
  assert.equal(h.render(false).loading, false);
  await pending;
  assert.equal(h.render().loading, false);
});

test('ACC-01: an identity change still loads from nothing and never shows the previous account', async () => {
  const h = providerHarness(OWNER);
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasLevelAccess('a1.2'), true);
  h.account('B');
  h.render(); // effects run: B's first load starts
  const switching = h.render(false);
  assert.equal(switching.loading, true, 'a different account is a first load');
  assert.equal(switching.subscription, null);
  assert.equal(switching.purchases.length, 0);
  assert.equal(switching.profile, null);
  await settle();
  const loaded = h.render();
  assert.equal(loaded.loading, false);
  assert.equal(loaded.profile.id, 'B');
});

// Integration review (2026-10-25): keying the loader on the account id (ACC-01)
// meant the same-account TOKEN_REFRESHED events (about hourly) no longer re-read
// entitlements at all. A session that stayed visible across a successful
// renewal kept the old paid-through date and lost paid access until a tab
// return. Same-account auth events now re-read in the background (throttled),
// and the provider re-reads shortly after the nearest entitlement deadline.
const endingSoon = (renewed) => ({
  status: 'active', plan_type: 'monthly', lemonsqueezy_subscription_id: 'sub-1',
  subscription_end: renewed.value ? '2100-01-01T00:00:00Z' : renewed.end,
});
const passRealTime = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('a same-account token refresh past the throttle re-reads in the background', async () => {
  const clock = clockAt();
  const refresh = deferred();
  let reads = 0;
  const h = providerHarness({ ...OWNER, Date: clock.Date, getSubscription: () => (++reads === 1 ? OWNER.getSubscription() : refresh.promise) });
  h.account('A'); h.render(); await settle();
  clock.now += 55 * 60 * 1000; // about an hour later
  h.account('A'); // TOKEN_REFRESHED: a new user object, same id
  h.render();
  assert.equal(reads, 2, 'the token refresh re-reads');
  const during = h.render(false);
  assert.equal(during.loading, false, 'in the background: no spinner, the page stays');
  assert.equal(during.subscription?.status, 'active');
  refresh.resolve({ status: 'active', plan_type: 'monthly', subscription_end: '2101-01-01', lemonsqueezy_subscription_id: 'sub-1' });
  await settle();
  assert.equal(h.render().subscription.subscription_end, '2101-01-01', 'the renewed row lands');
});

test('a renewal recorded while the tab stays open restores access at the next token refresh, without a tab return', async () => {
  const clock = clockAt();
  const renewed = { value: false, end: new Date(Date.now() + 150).toISOString() };
  const h = providerHarness({ Date: clock.Date, getSubscription: async () => endingSoon(renewed) });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasAccess, true);
  renewed.value = true; // the renewal is charged and the webhook records it
  await passRealTime(200); // the old paid-through date passes while the tab stays open
  clock.now += 60 * 60 * 1000;
  assert.equal(h.render().hasAccess, false, 'the cached row has lapsed');
  h.account('A'); // TOKEN_REFRESHED
  h.render();
  await settle();
  const after = h.render();
  assert.equal(after.hasAccess, true, 'the renewed row restores access');
  assert.equal(after.loading, false);
});

test('the provider re-reads shortly after the paid-through date: a renewal restores access with no tab return or token refresh', async () => {
  const timers = [];
  const renewed = { value: false, end: new Date(Date.now() + 150).toISOString() };
  const h = providerHarness({
    getSubscription: async () => endingSoon(renewed),
    setTimeout: (fn, ms) => timers.push({ fn, ms, cleared: false }),
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].cleared = true; },
  });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasAccess, true);
  const armed = timers.filter((t) => !t.cleared);
  assert.equal(armed.length, 1, 'one re-read is armed, for the nearest deadline');
  assert.ok(armed[0].ms >= 60 * 1000 && armed[0].ms <= 61 * 1000, `shortly after the deadline, not ${armed[0].ms} ms`);
  renewed.value = true; // the renewal is charged and the webhook records it
  await passRealTime(200); // the old paid-through date passes; nothing else happens
  assert.equal(h.render().hasAccess, false, 'the cached row has lapsed');
  armed[0].fn(); // the armed re-read
  await settle();
  const after = h.render();
  assert.equal(after.hasAccess, true, 'the renewed row restores access');
  assert.equal(after.loading, false, 'in the background');
  const next = timers.filter((t) => !t.cleared && t !== armed[0]);
  assert.equal(next.length, 1, 're-armed for the renewed paid-through date');
  assert.ok(next[0].ms > 0 && next[0].ms < 2 ** 31, 'a deadline decades ahead stays inside setTimeout\'s range');
});

test('the deadline re-read covers the trial end and a course\'s included-Pro end, and arms nothing without a deadline', async () => {
  const armedFor = async (services) => {
    const timers = [];
    const h = providerHarness({
      ...services,
      setTimeout: (fn, ms) => timers.push({ fn, ms, cleared: false }),
      clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].cleared = true; },
    });
    h.account('A'); h.render(); await settle();
    h.render();
    return timers.filter((t) => !t.cleared).map((t) => t.ms);
  };
  const inAnHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const trial = await armedFor({ getUserProfile: async (id) => ({ id, trial_started_at: '2026-10-20', trial_ends_at: inAnHour }) });
  assert.equal(trial.length, 1);
  assert.ok(Math.abs(trial[0] - 61 * 60 * 1000) < 2000, `the trial end: ${trial[0]} ms`);
  const course = await armedFor({ getPurchases: async () => [{ product_key: 'course_a1_2', status: 'active', access_until: inAnHour }] });
  assert.equal(course.length, 1);
  assert.ok(Math.abs(course[0] - 61 * 60 * 1000) < 2000, `the course window: ${course[0]} ms`);
  assert.deepEqual(await armedFor({}), [], 'an expired trial and no plan: nothing to wait for');
});

// Integration review (2026-10-25): the owner's explicit premium grant
// (profiles.subscription_tier 'premium', the admin set_tier action) opened
// nothing in the app when the account had no subscription or purchase row,
// although server reconciliation preserves the grant, the server tools count
// it as paid and the static grammar exercises open for it.
const profileWith = (flags) => async (id) => ({ id, trial_started_at: '2000-01-01', trial_ends_at: '2000-01-08', ...flags });

test('an explicit premium grant opens paid access, the account screens and every level, with no subscription or purchase', async () => {
  const h = providerHarness({ getUserProfile: profileWith({ subscription_tier: 'premium', is_subscribed: true }) });
  h.account('A'); h.render(); await settle();
  const value = h.render();
  assert.equal(value.hasActiveSubscription(), true, 'the paid-access answer (plan card, /subscription status)');
  assert.equal(value.hasAccess, true, 'the account screens and level guards');
  for (const level of ['a1.2', 'a2.1', 'b1.1', 'b2.2']) assert.equal(value.hasLevelAccess(level), true, level);
  assert.equal(value.isInFreeTrial(), false, 'a grant is not a trial');
  assert.equal(value.hasProduct('course_a1_2'), false, 'a grant is not a purchase: lifetime ownership stays with purchases');
  assert.equal(value.hasProduct('telc_b1_komplett'), false);
});

test('only premium is a grant: a derived pro tier or a stale is_subscribed flag alone opens nothing', async () => {
  for (const flags of [
    { subscription_tier: 'pro', is_subscribed: true },
    { subscription_tier: 'free', is_subscribed: true },
    { subscription_tier: null, is_subscribed: true },
    { subscription_tier: 'Premium', is_subscribed: false },
  ]) {
    const h = providerHarness({ getUserProfile: profileWith(flags) });
    h.account('A'); h.render(); await settle();
    const value = h.render();
    assert.equal(value.hasAccess, false, JSON.stringify(flags));
    assert.equal(value.hasLevelAccess('a2.1'), false, JSON.stringify(flags));
    assert.equal(value.hasLevelAccess('a1.1'), true, 'the free level stays free');
  }
});

test('the app and the static pages read the premium grant by the same rule', () => {
  // The static pages' rule is held by tests/b4-privacy-navigation.test.mjs; this
  // only checks that both sides still test the same field the same way.
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const rule = /const premiumGrant = profile\?\.subscription_tier === 'premium';/;
  assert.match(read('src/contexts/SubscriptionContext.jsx'), rule);
  assert.match(read('astro-site/src/layouts/Layout.astro'), rule);
  assert.match(read('src/contexts/SubscriptionContext.jsx'), /const hasActiveSubscription = \(\) => premiumGrant \|\| checkSubscriptionStatus\(subscription\)\.isActive \|\|/);
});

test('a premium grant is never shown to another account', async () => {
  const h = providerHarness({ getUserProfile: async (id) => (id === 'A' ? profileWith({ subscription_tier: 'premium', is_subscribed: true })(id) : profileWith({})(id)) });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasAccess, true);
  h.account('B');
  assert.equal(h.render(false).hasAccess, false, 'masked during the identity change');
  h.render(); await settle();
  assert.equal(h.render().hasAccess, false, 'B has no grant');
});
