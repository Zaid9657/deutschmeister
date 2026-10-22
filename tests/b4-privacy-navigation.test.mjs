import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { courseHomeFor } from '../src/lib/courseEntry.js';
import { subscriptionStatus } from '../src/lib/subscriptionStatus.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { LEVEL_COURSES, levelsForProduct } from '../src/data/pricing.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function analyticsHarness() {
  const store = new Map([['dm_cookie_consent', 'accepted']]);
  const calls = [];
  let resolveImport;
  const loading = new Promise((resolve) => { resolveImport = resolve; });
  const posthog = Object.fromEntries(['init', 'register', 'identify', 'capture', 'reset', 'opt_in_capturing', 'opt_out_capturing'].map((method) => [method, (...args) => calls.push([method, ...args])]));
  const source = read('src/lib/analytics.js')
    .replace(/^import .*;\n/gm, '')
    .replaceAll('import.meta.env.VITE_POSTHOG_KEY', "'test-key'")
    .replaceAll('import.meta.env.VITE_POSTHOG_HOST', "'test-host'")
    .replace("import('posthog-js')", 'loadPosthog()')
    .replace(/^export /gm, '');
  const context = vm.createContext({
    window: { localStorage: { getItem: (key) => store.get(key) ?? null }, location: { pathname: '/speaking/' } },
    getAttribution: () => null,
    isFunnelEvent: () => false,
    sanitizeProps: (props) => props,
    loadPosthog: () => loading,
    console,
  });
  vm.runInContext(source, context);
  return { api: context, store, calls, finishImport: () => resolveImport({ default: posthog }) };
}

test('consent withdrawal while PostHog downloads prevents initialization and later capture', async () => {
  const { api, store, calls, finishImport } = analyticsHarness();
  const loading = api.initAnalytics();
  store.set('dm_cookie_consent', 'declined');
  api.withdrawAnalytics();
  finishImport();
  await loading;
  api.track('lesson_started', {});
  api.identify('learner', {});
  assert.deepEqual(calls, []);

  store.set('dm_cookie_consent', 'accepted');
  await api.initAnalytics();
  assert.equal(calls.filter(([method]) => method === 'init').length, 1, 'accepting later can initialize the downloaded module');
});

test('PostHog capture and identify require the current shared consent choice', async () => {
  const { api, store, calls, finishImport } = analyticsHarness();
  const loading = api.initAnalytics();
  finishImport();
  await loading;
  calls.length = 0;
  store.set('dm_cookie_consent', 'declined');
  api.track('lesson_started', {});
  api.identify('learner', {});
  await api.initAnalytics();
  assert.deepEqual(calls, [], 'a storage change blocks wrappers before its storage event is processed');

  api.withdrawAnalytics();
  assert.deepEqual(calls.map(([method]) => method), ['reset', 'opt_out_capturing']);
});

function consentHarness(choice = 'accepted') {
  const store = new Map([['dm_cookie_consent', choice]]);
  const listeners = new Map();
  const events = [];
  const ga = [];
  const nodes = new Map();
  function element() {
    return {
      style: {}, children: [], offsetHeight: 70,
      setAttribute() {}, addEventListener() {},
      appendChild(child) { this.children.push(child); child.parentNode = this; if (child.id) nodes.set(child.id, child); },
      removeChild(child) { child.parentNode = null; nodes.delete(child.id); },
    };
  }
  const document = {
    readyState: 'complete', createElement: element,
    getElementById: (id) => nodes.get(id) || null,
    head: element(), body: element(),
    documentElement: { style: { setProperty() {} } },
  };
  const window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
    },
    addEventListener: (name, fn) => listeners.set(name, fn),
    dispatchEvent: (event) => events.push(event.type),
  };
  const context = vm.createContext({ window, document, CustomEvent: class { constructor(type) { this.type = type; } } });
  vm.runInContext(read('public/consent.js'), context);
  window.gtag = (...args) => ga.push(args);
  events.length = 0;
  return { window, store, events, ga, nodes, storage: (key) => listeners.get('storage')?.({ key }) };
}

test('consent storage events withdraw GA and notify PostHog in every open tab', () => {
  const { window, store, events, ga, storage, nodes } = consentHarness();
  store.set('dm_cookie_consent', 'declined');
  storage('dm_cookie_consent');
  assert.equal(window['ga-disable-G-RXNM5897FC'], true);
  assert.deepEqual(events, ['dm-consent-declined']);
  assert.equal(ga[0][2].analytics_storage, 'denied');

  store.set('dm_cookie_consent', 'accepted');
  storage('dm_cookie_consent');
  assert.equal(window['ga-disable-G-RXNM5897FC'], false);
  assert.equal(events.at(-1), 'dm-consent-accepted');
  assert.equal(ga.at(-1)[2].analytics_storage, 'granted');

  store.clear();
  storage(null);
  assert.equal(window['ga-disable-G-RXNM5897FC'], true, 'clearing storage revokes the previous choice');
  assert.equal(events.at(-1), 'dm-consent-declined');
  assert.ok(nodes.has('dm-cookie-banner'));
});

test('resetting cookie choice revokes analytics while the banner is open', () => {
  const { window, events, store, nodes } = consentHarness();
  window.dmCookieConsent.reset();
  assert.equal(store.has('dm_cookie_consent'), false);
  assert.equal(window['ga-disable-G-RXNM5897FC'], true);
  assert.equal(events.at(-1), 'dm-consent-declined');
  assert.ok(nodes.has('dm-cookie-banner'));
});

test('logout waits for sign-out and fully loads the Astro homepage', async () => {
  const source = read('src/components/Navbar.jsx');
  const body = source.match(/const handleSignOut = async \(\) => \{([\s\S]*?)\n {2}\};/)[1];
  const calls = [];
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const context = vm.createContext({
    setUserMenuOpen() {}, setIsOpen() {},
    signOut: async () => { calls.push('signOut'); await pending; },
    navigate: (href) => calls.push(`client:${href}`),
    window: { location: { assign: (href) => calls.push(`load:${href}`) } },
  });
  const done = vm.runInContext(`(async () => {${body}\n})()`, context);
  assert.deepEqual(calls, ['signOut']);
  finish();
  await done;
  assert.deepEqual(calls, ['signOut', 'load:/']);
});

test('legacy course All courses link requests the Astro catalogue', () => {
  const source = read('src/pages/CourseHomePage.jsx');
  assert.match(source, /<a href="\/courses\/"[^>]*>All courses<\/a>/);
  assert.doesNotMatch(source, /<Link to="\/courses\/"/);
});

test('course return controls follow the measured bottom navigation and reserve their own height', () => {
  const bottom = read('src/components/BottomNav.jsx');
  const bar = read('src/components/CourseReturnBar.jsx');
  const effect = bottom.match(/useEffect\(\(\) => \{\n {4}const nav = navRef.current;([\s\S]*?)\n {2}\}, \[user\]\);/);
  assert.ok(effect, 'measure the visible bottom navigation, including its safe-area padding');
  let height = 86;
  let resize;
  const style = new Map();
  const cleanup = vm.runInNewContext(`(() => { const nav = navRef.current; ${effect[1]} })()`, {
    navRef: { current: { getBoundingClientRect: () => ({ height }) } },
    document: { documentElement: { style: { setProperty: (key, value) => style.set(key, value), removeProperty: (key) => style.delete(key) } } },
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} disconnect() {} },
  });
  assert.equal(style.get('--dm-bottom-nav-h'), '86px');
  height = 0;
  resize();
  assert.equal(style.get('--dm-bottom-nav-h'), '0px', 'desktop navigation leaves no mobile offset');
  cleanup();
  assert.equal(style.has('--dm-bottom-nav-h'), false, 'signed-out pages leave no stale offset');
  assert.match(bottom, /<nav\s+ref=\{navRef\}/);
  assert.match(bar, /bottom-\[var\(--dm-bottom-nav-h,0px\)\]/);
  assert.match(bar, /setHeight\(bar.getBoundingClientRect\(\).height\)/);
  assert.match(bar, /<div style=\{\{ height \}\} aria-hidden="true"/);
});

function astroContinuation() {
  const source = read('astro-site/src/layouts/Layout.astro');
  const helper = source.match(/ {6}function continueCourseHref\([\s\S]*?\n {6}\}/);
  assert.ok(helper, 'the Astro continuation must resolve a course rather than /dashboard');
  const context = vm.createContext({ courseHomeFor, subscriptionStatus, isLevelFree, levelsForProduct });
  vm.runInContext(helper[0], context);
  return { source, href: context.continueCourseHref };
}

test('Astro continue links use the SPA course-entry rule and free fallback', () => {
  const { source, href } = astroContinuation();
  const home = read('astro-site/src/pages/index.astro');
  const now = Date.parse('2026-10-22T12:00:00Z');
  const expired = { current_level: 'A2.1', trial_started_at: '2026-01-01', trial_ends_at: '2026-01-08' };
  assert.equal(href({ profile: expired }, now), '/course/a1.1');
  assert.equal(href({ profile: { ...expired, trial_ends_at: '2026-10-23' } }, now), '/course/a2.1');
  assert.equal(href({ profile: expired, subscription: { status: 'active', subscription_end: '2026-10-23' } }, now), '/course/a2.1');
  const product = Object.values(LEVEL_COURSES).find((course) => levelsForProduct(course.key).includes('a2.1'));
  assert.ok(product, 'select the product from the canonical pricing data');
  assert.equal(href({ profile: expired, purchases: [{ product_key: product.key, status: 'active' }] }, now), '/course/a2.1');
  assert.equal(href({ profile: { ...expired, current_level: 'B1.1' }, purchases: [{ product_key: product.key, status: 'active' }] }, now), '/course/a1.1');
  assert.equal(href({ profile: { ...expired, is_subscribed: true } }, now), '/course/a1.1', 'an old profile flag is not a live paid period');
  for (const path of [source, home]) {
    const links = path.match(/<a\s[^>]*data-continue-course[^>]*>/g) || [];
    assert.equal(links.length, 2, 'desktop/mobile nav and both homepage continuation doors are marked');
    links.forEach((link) => assert.match(link, /href=\{FREE_COURSE_HREF\}/));
    assert.doesNotMatch(path, /href="\/dashboard"[^>]*data-auth-only/);
  }
  assert.match(source, /import \{ courseHomeFor \} from '\.\.\/\.\.\/\.\.\/src\/lib\/courseEntry\.js'/);
});

test('Astro continuation rejects inactive future periods and includes active course Pro windows', () => {
  const { source, href } = astroContinuation();
  const now = Date.parse('2026-10-22T12:00:00Z');
  const profile = { current_level: 'A2.2' };
  for (const status of ['expired', 'unpaid', 'subscription_superseded', undefined]) {
    assert.equal(href({ profile, subscription: { status, subscription_end: '2026-11-01' } }, now), '/course/a1.1', String(status));
  }
  for (const status of ['active', 'on_trial', 'cancelled', 'past_due', 'paused']) {
    assert.equal(href({ profile, subscription: { status, subscription_end: '2026-11-01' } }, now), '/course/a2.2', status);
    assert.equal(href({ profile, subscription: { status, subscription_end: '2026-10-21' } }, now), '/course/a1.1', status);
  }
  const product = Object.values(LEVEL_COURSES).find((course) => levelsForProduct(course.key).includes('a2.1'));
  const purchase = { product_key: product.key, status: 'active', access_until: '2026-11-01' };
  assert.equal(href({ profile, purchases: [purchase] }, now), '/course/a2.2', 'included Pro also opens a placed level outside the bought course');
  assert.equal(href({ profile, purchases: [{ ...purchase, access_until: '2026-10-21' }] }, now), '/course/a1.1');
  assert.equal(href({ profile, purchases: [{ ...purchase, status: 'refunded' }] }, now), '/course/a1.1');
  assert.match(source, /select\('status, subscription_end'\)/);
  assert.match(source, /select\('product_key, status, access_until'\)/);
});

test('Astro continuation reads only the verified account and keeps free links on query errors', async () => {
  const { source, href } = astroContinuation();
  const updater = source.match(/ {6}async function updateContinueLinks\(\) \{[\s\S]*?\n {6}\}/)[0].replace("import('../lib/supabase.js')", 'loadSupabase()');
  const links = [{ href: '/course/a1.1' }, { href: '/course/a1.1' }];
  const filters = [];
  let failed = true;
  const rows = { profiles: { current_level: 'A2.1' }, subscriptions: { status: 'active', subscription_end: '2099-01-01' }, purchases: [] };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: 'verified-user' } } }) },
    from(table) {
      const query = {
        select() { return this; },
        eq(key, value) { filters.push([table, key, value]); return this; },
        order() { return this; }, limit() { return this; }, maybeSingle() { return this; },
        then(resolve) { resolve({ data: failed ? null : rows[table], error: failed ? new Error('unavailable') : null }); },
      };
      return query;
    },
  };
  const context = vm.createContext({
    document: { querySelectorAll: () => links },
    localStorage: { length: 1, key: () => 'sb-project-auth-token' },
    loadSupabase: async () => ({ supabase }),
    continueCourseHref: href,
  });
  vm.runInContext(updater, context);
  await context.updateContinueLinks();
  assert.deepEqual(links.map((link) => link.href), ['/course/a1.1', '/course/a1.1']);
  assert.deepEqual(filters.filter(([, key]) => key === 'id' || key === 'user_id'), [
    ['profiles', 'id', 'verified-user'], ['subscriptions', 'user_id', 'verified-user'], ['purchases', 'user_id', 'verified-user'],
  ]);
  assert.ok(filters.some(([table, key, value]) => table === 'purchases' && key === 'status' && value === 'active'));
  failed = false;
  await context.updateContinueLinks();
  assert.deepEqual(links.map((link) => link.href), ['/course/a2.1', '/course/a2.1'], 'resolved account access updates every continuation door');
});
