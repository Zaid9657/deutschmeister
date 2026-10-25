import { test } from 'node:test';
import assert from 'node:assert/strict';
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

test('ACC-01: a new auth user object for the same account neither blanks guarded pages nor reloads', async () => {
  let reads = 0;
  const h = providerHarness({ ...OWNER, getSubscription: async (...args) => { reads++; return OWNER.getSubscription(...args); } });
  h.account('A'); h.render(); await settle();
  const loaded = h.render();
  assert.equal(loaded.loading, false);
  assert.equal(reads, 1);
  h.account('A'); // auth-js: SIGNED_IN on a tab return, TOKEN_REFRESHED about hourly
  h.render();
  const during = h.render(false);
  assert.equal(during.loading, false, 'a token refresh must not swap guarded pages for the spinner');
  assert.equal(during.subscription?.status, 'active');
  assert.equal(during.hasLevelAccess('a1.2'), true);
  await settle();
  assert.equal(reads, 1, 'the same account id must not recreate the loader');
});

test('ACC-01: a tab return revalidates in the background and keeps the data on screen', async () => {
  const refresh = deferred();
  let reads = 0;
  const h = providerHarness({ ...OWNER, getSubscription: () => (++reads === 1 ? OWNER.getSubscription() : refresh.promise) });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().loading, false);
  h.visible(); // more than 5 s since the last refresh (the first return always counts)
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
