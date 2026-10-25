// The static pages' course checkout (astro-site/src/components/CourseCheckout.astro)
// and its entitlement lookup (astro-site/src/lib/levelAccess.js), run as
// shipped under node:vm against a small fake DOM. Shared by
// tests/course-door-rule.test.mjs and tests/astro-door-ownership.test.mjs.
// Not a suite itself: `npm test` runs only tests/*.test.mjs.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { levelsForProduct } from '../../astro-site/src/data/pricing.js';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

/** levelAccess.js with its imports bound to a fake Supabase client and the Astro pricing copy. */
export function loadLevelAccess(supabase = {}) {
  const source = read('astro-site/src/lib/levelAccess.js')
    .replace(/^import .*;\n/gm, '')
    .replace(/^export (const|async function|function) /gm, '$1 ');
  return vm.runInNewContext(
    `${source}\n({ GUIDED_LEVELS, levelHref, loadEntitlementSnapshot, levelOpen, ownedProductHome, getLevelAccess });`,
    { supabase, levelsForProduct, Date, Promise },
  );
}

/** A Supabase client that answers like PostgREST and counts the reads. */
export function fakeSupabase({ user = { id: 'learner' }, profile = null, purchases = [], profileError = null, purchasesError = null } = {}) {
  const reads = [];
  const chain = (table) => {
    const result = table === 'profiles'
      ? { data: profile, error: profileError }
      : { data: purchases, error: purchasesError };
    const q = {
      select: () => q, eq: () => q,
      maybeSingle: async () => result,
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return q;
  };
  return {
    reads,
    client: {
      auth: { getUser: async () => { reads.push('auth'); return { data: { user } }; } },
      from: (table) => { reads.push(table); return chain(table); },
    },
  };
}

/** A minimal element: attributes, children, listeners, innerHTML, append, closest, querySelector('[attr]'). */
export class FakeElement {
  constructor(tag, attrs = {}, children = []) {
    this.tag = tag;
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this.listeners = {};
    this.disabled = false;
    this.html = null;
    this.textContent = '';
    children.forEach((child) => this.append(child));
  }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { return Promise.all((this.listeners.click || []).map((fn) => fn())); }
  matches(selector) {
    const m = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
    if (!m) throw new Error(`unsupported selector ${selector}`);
    return Object.prototype.hasOwnProperty.call(this.attrs, m[1]) && (m[2] === undefined || this.attrs[m[1]] === m[2]);
  }
  querySelectorAll(selector) {
    const out = [];
    const walk = (el) => el.children.forEach((child) => { if (typeof child === 'object') { if (child.matches(selector)) out.push(child); walk(child); } });
    walk(this);
    return out;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    for (let el = this; el; el = el.parent) if (el.matches(selector)) return el;
    return null;
  }
  set innerHTML(html) { this.html = html; this.children = []; }
  get innerHTML() { return this.html; }
  append(...nodes) {
    for (const node of nodes) {
      if (typeof node === 'object') node.parent = this;
      this.children.push(node);
    }
  }
}

/** A Buy button as the static pages render it. */
export const buyButton = (productKey, variant = `v-${productKey}`) =>
  new FakeElement('button', { 'data-course-variant': variant, 'data-course-key': productKey, 'data-course-price': '40', 'data-track-surface': 'test' });

/** A data-course-door around its children. */
export const door = (level, children, attrs = {}) =>
  new FakeElement('div', { 'data-course-door': level, 'data-course-code': level.toUpperCase(), 'data-course-open-class': 'dm-key', ...attrs }, children);

/**
 * Run CourseCheckout's script over a page.
 * @param {object} options
 * @param {FakeElement} options.body  the page
 * @param {boolean} [options.signedIn]  a Supabase session in localStorage
 * @param {object|null|Error} [options.snapshot]  what loadEntitlementSnapshot answers (an Error rejects)
 * @param {Promise} [options.gate]  resolves before the snapshot does (to click before it lands)
 */
export function runCourseCheckout({ body, signedIn = true, snapshot = null, gate = Promise.resolve() }) {
  const script = read('astro-site/src/components/CourseCheckout.astro').match(/<script>([\s\S]*?)<\/script>/)[1];
  const real = loadLevelAccess({});
  let snapshotCalls = 0;
  const lib = {
    ...real,
    loadEntitlementSnapshot: async () => {
      snapshotCalls++;
      await gate;
      if (snapshot instanceof Error) throw snapshot;
      return snapshot;
    },
  };
  const opened = [];
  const tracked = [];
  const stored = new Map();
  const location = { href: '/start-page' };
  // Fake timers: nothing fires until the test calls runTimers().
  const timers = [];
  let ready = null;
  const head = new FakeElement('head');
  const document = {
    querySelectorAll: (selector) => body.querySelectorAll(selector),
    querySelector: (selector) => (selector.startsWith('script') ? {} : body.querySelector(selector)),
    createElement: (tag) => new FakeElement(tag),
    head,
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') ready = fn; },
  };
  const session = signedIn ? JSON.stringify({ user: { id: 'learner', email: 'learner@example.com' } }) : null;
  const localStorage = {
    get length() { return session ? 1 : 0; },
    key: () => 'sb-project-auth-token',
    getItem: () => session,
    setItem: (k, v) => stored.set(k, v),
  };
  const context = {
    document, localStorage,
    sessionStorage: { setItem: (k, v) => stored.set(`session:${k}`, v) },
    window: { location, LemonSqueezy: { Url: { Open: (url) => opened.push(url) } } },
    track: (event, props) => tracked.push({ event, props }),
    __levelAccess: () => Promise.resolve(lib),
    setTimeout: (fn, ms) => timers.push({ fn, ms, done: false }),
    clearTimeout: (id) => { if (timers[id - 1]) timers[id - 1].done = true; },
    URLSearchParams, encodeURIComponent, JSON, Number, Boolean, Promise, Error,
  };
  const source = script
    .replace(/^\s*import \{ track \} from '\.\.\/lib\/track\.js';\s*$/m, '')
    .replace("import('../lib/levelAccess.js')", '__levelAccess()');
  if (source.includes('import(')) throw new Error('CourseCheckout.astro gained an import this harness does not stub');
  vm.runInNewContext(source, context);
  ready();
  return {
    opened, tracked, stored, location,
    /** How many times the page loaded the entitlement snapshot. */
    get snapshotCalls() { return snapshotCalls; },
    /** The delays (ms) of the timers the page set and has not cleared or run. */
    pendingTimers: () => timers.filter((t) => !t.done).map((t) => t.ms),
    /** Fire every pending timer once (time passes). */
    runTimers() { for (const t of timers) if (!t.done) { t.done = true; t.fn(); } },
    /** Run every then/finally that is ready, without waiting for the lookup. */
    async flush() { for (let i = 0; i < 3; i++) await new Promise((r) => setImmediate(r)); },
    /** Let the lookup land and every then/finally after it run. */
    async settle() {
      await gate;
      await this.flush();
    },
  };
}
