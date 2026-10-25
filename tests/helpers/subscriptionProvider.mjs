// The real SubscriptionProvider (src/contexts/SubscriptionContext.jsx) under
// node:vm. Its hooks and async callbacks run as shipped; only its JSX return is
// replaced, so a test can read the context value without a browser.
//
// Shared by tests/subscription-account-race.test.mjs (identity, refresh and
// background revalidation) and tests/checkout-access.test.mjs (failed reads).
// Not a suite itself: `npm test` runs only tests/*.test.mjs.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { levelsForProduct } from '../../src/data/pricing.js';
import { isLevelFree } from '../../src/config/freeTier.js';
import { subscriptionStatus } from '../../src/lib/subscriptionStatus.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
export const withoutImports = (source) => source.replace(/^import[\s\S]*?;\n/gm, '');

/** checkTrialStatus / checkSubscriptionStatus from src/services/subscriptionService.js, as shipped. */
export const statusChecks = vm.runInNewContext(
  withoutImports(read('../../src/services/subscriptionService.js')).replace(/export const /g, 'const ') +
  '\n({ checkTrialStatus, checkSubscriptionStatus });', { supabase: {}, console, Date, subscriptionStatus },
);

export const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};

export const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

/**
 * @param {object} services  replacements for the provider's imports (getSubscription, getPurchases, …)
 *   and globals (setTimeout, clearTimeout, Date). The default timers are unref'd,
 *   so a deadline timer weeks ahead never keeps the test process alive.
 * @returns {{ account(id: string|null): void, render(runEffects?: boolean): object, visible(): void }}
 *   account() always installs a NEW user object, as auth-js does on every
 *   SIGNED_IN / TOKEN_REFRESHED event, even for the same id.
 */
export function providerHarness(services = {}) {
  const slots = [];
  let cursor = 0;
  let auth = { user: null, loading: false };
  let pendingEffects = [];
  const listeners = new Map();
  const document = {
    visibilityState: 'visible',
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
  };
  const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => value === b[i]);
  const source = withoutImports(read('../../src/contexts/SubscriptionContext.jsx'))
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
    document,
    withTimeout: (promise) => promise,
    getSubscription: async () => null,
    getUserProfile: async (id) => ({ id, trial_started_at: '2000-01-01', trial_ends_at: '2000-01-08' }),
    getPurchases: async () => [],
    startFreeTrial: async () => {},
    settlePendingPlacement: async (_id, profile) => profile,
    getAuthHeaders: async () => ({}),
    fetch: async () => ({ json: async () => ({ status: 'none' }) }),
    isLevelFree, levelsForProduct, ...statusChecks,
    setTimeout: (fn, ms) => { const timer = setTimeout(fn, ms); timer.unref?.(); return timer; },
    clearTimeout,
    console: { error() {}, warn() {}, log() {} }, Date, Promise,
    ...services,
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
    /** The tab comes back into view (the provider's visibilitychange listener). */
    visible() {
      document.visibilityState = 'visible';
      for (const fn of listeners.get('visibilitychange') || []) fn();
    },
  };
}
