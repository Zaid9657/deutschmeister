// Runs src/contexts/AuthContext.jsx in Node: its real module code, hooks and
// auth-event callbacks, with only the JSX return swapped for the context value
// (the same approach as tests/subscription-account-race.test.mjs). The fake
// supabase client records every call and lets a test emit auth events; the
// import-time listener and the provider's own subscription both receive them,
// in registration order, as supabase-js delivers them.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const sameDeps = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));

/**
 * @param {object} [options]
 * @param {string} [options.hash]            window.location.hash when the module is imported
 * @param {Array<{error: unknown}>} [options.signOutResults]  what successive supabase.auth.signOut calls resolve to
 * @param {Map<string,string>} [options.storage]  window.localStorage contents
 * @param {boolean} [options.auditHangs]     logAuditEvent never settles (a dead network)
 */
export function authHarness({ hash = '', signOutResults = [], storage = new Map(), auditHangs = false } = {}) {
  const calls = [];
  const listeners = [];
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];
  const signOutQueue = [...signOutResults];

  const supabase = {
    auth: {
      onAuthStateChange(callback) {
        const entry = { callback, active: true };
        listeners.push(entry);
        return { data: { subscription: { unsubscribe() { entry.active = false; } } } };
      },
      getSession: async () => ({ data: { session: null } }),
      signOut: async (options) => {
        calls.push(['signOut', options ? { ...options } : null]); // copied into this realm for deepEqual
        return signOutQueue.shift() ?? { error: null };
      },
      signUp: async () => ({ data: null, error: null }),
      signInWithPassword: async () => ({ data: null, error: null }),
      resetPasswordForEmail: async () => ({ data: null, error: null }),
      updateUser: async (attrs) => { calls.push(['updateUser', { ...attrs }]); return { data: {}, error: null }; },
    },
  };

  const localStorage = {
    get length() { return storage.size; },
    key: (i) => [...storage.keys()][i] ?? null,
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, String(value)); },
    removeItem: (key) => { storage.delete(key); },
  };

  const source = read('src/contexts/AuthContext.jsx')
    .replace(/^import[\s\S]*?;\n/gm, '')
    .replace(/^export const /gm, 'const ')
    .replace(/return \(\s*<AuthContext\.Provider[\s\S]*?<\/AuthContext\.Provider>\s*\);/, 'return value;');

  const provider = vm.runInNewContext(`${source}\nAuthProvider;`, {
    createContext: () => ({}),
    useContext: () => ({}),
    useState(initial) {
      const slot = slots[cursor++] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slot.value, (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) {
        const previous = slots[index];
        const slot = slots[index] = { deps, cleanup: previous?.cleanup };
        pendingEffects.push(() => { slot.cleanup?.(); slot.cleanup = callback(); });
      }
    },
    supabase,
    window: { location: { hash, origin: 'https://deutsch-meister.de' }, localStorage },
    signupAttributionMetadata: () => ({}),
    identify: (...args) => calls.push(['identify', ...args]),
    resetAnalytics: () => calls.push(['resetAnalytics']),
    trackSignupCompleted: () => calls.push(['trackSignupCompleted']),
    claimSignupCompletion: () => false,
    logAuditEvent: (type) => {
      calls.push(['audit', type]);
      return auditHangs ? new Promise(() => {}) : Promise.resolve();
    },
    AUDIT_EVENTS: { LOGIN: 'auth.login', LOGOUT: 'auth.logout', SIGNUP: 'auth.signup', PASSWORD_CHANGED: 'auth.password_changed' },
    withTimeout: (promise) => promise,
    console: { error() {}, warn() {}, log() {} },
    Date,
  });

  return {
    calls,
    storage,
    /** Deliver an auth event to every live subscriber, the import-time one first. */
    emit(event, session = null) {
      for (const entry of listeners.filter((l) => l.active)) entry.callback(event, session);
    },
    /** Render the provider; effects run after the render unless told otherwise. */
    render({ runEffects = true } = {}) {
      cursor = 0;
      const value = provider({ children: null });
      if (runEffects) this.flushEffects();
      return value;
    },
    flushEffects() {
      const effects = pendingEffects;
      pendingEffects = [];
      effects.forEach((effect) => effect());
    },
    audits: () => calls.filter(([kind]) => kind === 'audit').map(([, type]) => type),
  };
}

export const session = (id, { createdAt = '2026-01-01T00:00:00Z' } = {}) => ({
  access_token: `token-${id}`,
  user: { id, email: `${id}@example.com`, created_at: createdAt },
});
