import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { levelsForProduct } from '../src/data/pricing.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { subscriptionStatus } from '../src/lib/subscriptionStatus.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const withoutImports = (source) => source.replace(/^import[\s\S]*?;\n/gm, '');
const statusChecks = vm.runInNewContext(
  withoutImports(read('../src/services/subscriptionService.js')).replace(/export const /g, 'const ') +
  '\n({ checkTrialStatus, checkSubscriptionStatus });', { supabase: {}, console, Date, subscriptionStatus },
);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

// Execute the provider's real hooks and async callbacks; only its JSX return
// is replaced so Node can observe the context value without a browser.
function providerHarness(services = {}) {
  const slots = [];
  let cursor = 0;
  let auth = { user: null, loading: false };
  let pendingEffects = [];
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => value === b[i]);
  const source = withoutImports(read('../src/contexts/SubscriptionContext.jsx'))
    .replace(/export const /g, 'const ')
    .replace(/return \(\s*<SubscriptionContext\.Provider[\s\S]*?<\/SubscriptionContext\.Provider>\s*\);/, 'return value;');
  const provider = vm.runInNewContext(source + '\nSubscriptionProvider;', {
    createContext: () => ({}), useContext: () => ({}),
    useAuth: () => auth,
    useState(initial) {
      const slot = slots[cursor++] ??= { value: initial };
      return [slot.value, (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { callback, deps };
      return slots[index].callback;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) {
        const previous = slots[index];
        const slot = slots[index] = { deps, cleanup: previous?.cleanup };
        pendingEffects.push(() => { slot.cleanup?.(); slot.cleanup = callback(); });
      }
    },
    document: { addEventListener() {}, removeEventListener() {} },
    withTimeout: (promise) => promise,
    getSubscription: async () => null,
    getUserProfile: async (id) => ({ id, trial_started_at: '2000-01-01', trial_ends_at: '2000-01-08' }),
    getPurchases: async () => [],
    startFreeTrial: async () => {},
    settlePendingPlacement: async (_id, profile) => profile,
    getAuthHeaders: async () => ({}),
    fetch: async () => ({ json: async () => ({ status: 'none' }) }),
    isLevelFree, levelsForProduct, ...statusChecks, ...services,
    setTimeout, console, Date,
  });
  return {
    account(id) { auth = { user: id ? { id } : null, loading: false }; },
    render(runEffects = true) {
      cursor = 0;
      const value = provider({ children: null });
      if (runEffects) {
        const effects = pendingEffects;
        pendingEffects = [];
        effects.forEach((effect) => effect());
      }
      return value;
    },
  };
}

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
