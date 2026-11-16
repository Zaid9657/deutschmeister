// Guard suite for the funnel event registry (src/data/events.js) and the two
// places that send it: the static site (astro-site/src/lib/track.js → GA4) and
// the app (src/lib/analytics.js → PostHog, mirrored to GA4).
//
//   1. The registry is well-formed, and every event name the code fires or
//      declares in markup is in it — a typo cannot open a second, silent funnel.
//   2. sanitizeProps keeps only allowed keys and never forwards an email
//      address or free text (rule 2 of the registry).
//   3. track() sends nothing before consent, dedupes once-events per page view,
//      and stamps attribution + entry page.
//   4. signup_completed follows the confirmation-aware rule, once per browser.
//   5. A checkout opened on a static page arms the same flag the app consumes on
//      /subscription/success, so its completion is observable.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const { EVENTS, ALLOWED_PROPS, sanitizeProps, isFunnelEvent, onceKey } = await import(
  pathToFileURL(join(ROOT, 'src/data/events.js')).href
);

const walk = (dir, out = []) => {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
};

test('registry: every event has a plain-language trigger and a once flag', () => {
  for (const [name, def] of Object.entries(EVENTS)) {
    assert.match(name, /^[a-z]+(_[a-z]+)*$/, `${name} is snake_case`);
    assert.equal(typeof def.when, 'string');
    assert.ok(def.when.length > 20, `${name} explains when it fires`);
    assert.equal(typeof def.once, 'boolean');
  }
  assert.ok(isFunnelEvent('checkout_opened'));
  assert.ok(!isFunnelEvent('toString'), 'prototype keys are not events');
});

test('registry: every data-track event in the static site is a registered event', () => {
  const files = walk('astro-site/src').filter((f) => /\.(astro|js|jsx)$/.test(f));
  const used = new Set();
  for (const f of files) {
    for (const m of read(f).matchAll(/data-track="([a-z_]+)"/g)) used.add(m[1]);
    for (const m of read(f).matchAll(/\btrack\('([a-z_]+)'/g)) used.add(m[1]);
  }
  for (const name of used) assert.ok(isFunnelEvent(name), `${name} is in src/data/events.js`);
  assert.ok(used.has('checkout_intent') && used.has('checkout_opened'), 'the checkout component fires its two events');
});

test('registry: the app fires the registered names for the money path', () => {
  const ft = read('src/lib/funnelTracking.js');
  for (const name of ['signup_started', 'signup_completed', 'checkout_started', 'checkout_completed', 'lesson_started', 'lesson_completed', 'paywall_shown']) {
    assert.ok(ft.includes(`'${name}'`), `funnelTracking fires ${name}`);
    assert.ok(isFunnelEvent(name), `${name} is registered`);
  }
});

// C-138/C-153/X-100: signup_started fired on every /signup view and again on the
// homepage click, while the registry says "the signup form is submitted".
test('signup_started has one emitter: the signup form, once per submit that passed its checks', async () => {
  const src = read('src/pages/SignupPage.jsx');
  assert.doesNotMatch(src, /useEffect\(\(\) => \{\s*trackSignupStarted\(\);?\s*\}/, 'not on page view');
  assert.equal((src.match(/trackSignupStarted\(\)/g) || []).length, 1, 'exactly one call');
  const body = src.match(/ {2}const handleSubmit = async \(e\) => \{([\s\S]*?)\n {2}\};/)[1];
  const run = async (password) => {
    const log = [];
    const set = () => () => {};
    const handleSubmit = new Function(
      'trackSignupStarted', 'signUp', 'password', 'email', 'setError', 'setKnownAddress', 'setLoading', 'signupOutcome', 'existingAccount',
      'navigate', 'trackVerificationPageViewed', 'setSentTo', 'setPassword', 'setResendState', 'setCooldown', 'RESEND_COOLDOWN_SECONDS', 'logFailedSignup',
      `return async (e) => {${body}\n};`,
    )(
      () => log.push('signup_started'), async () => { log.push('signUp'); return { data: { user: { identities: [{}] } }, error: null }; }, password, 'learner@example.test',
      set(), set(), set(), () => 'check-email', () => false, () => {}, () => {}, set(), set(), set(), set(), 60, () => {},
    );
    await handleSubmit({ preventDefault: () => {} });
    return log;
  };
  assert.deepEqual(await run('12345'), [], 'a password the form refuses is not a submitted signup');
  assert.deepEqual(await run('123456'), ['signup_started', 'signUp'], 'fired once, before the account request');
});

test('the static site never fires signup_started: it sees a click, never a submitted form', () => {
  const files = walk('astro-site/src').filter((f) => /\.(astro|js|jsx)$/.test(f));
  const offenders = files.filter((f) => /data-track="signup_started"|track\('signup_started'/.test(read(f)));
  assert.deepEqual(offenders, []);
  // The homepage account door stays attributed by its tagged href instead.
  assert.match(read('astro-site/src/pages/index.astro'), /<a href=\{HOME_SIGNUP_HREF\} class="c4-text-link" data-anon-only>Create a free account →<\/a>/);
});

test('the GA mirror keeps the fixed-value props the app sends with registered events', () => {
  for (const key of ['exit_path', 'slide', 'hit', 'offer', 'reason', 'moment']) assert.ok(ALLOWED_PROPS.includes(key), key);
  assert.deepEqual(sanitizeProps({ exit_path: 'first-lesson' }), { exit_path: 'first-lesson' });
  assert.deepEqual(sanitizeProps({ topic: 'a1-1-l1', hit: true }), { topic: 'a1-1-l1', hit: true });
  const paywall = { feature: 'speaking_limit', offer: 'course', reason: 'buyable', level: 'a1.2', moment: 'sessions_used' };
  assert.deepEqual(sanitizeProps(paywall), paywall);
  const ft = read('src/lib/funnelTracking.js');
  assert.match(ft, /track\('onboarding_completed', \{ exit_path: exitPath \}\)/);
  assert.match(ft, /track\('lesson_first_sentence', \{ topic, hit \}\)/);
  assert.match(read('src/components/speaking/SpeakingLimitOffer.jsx'), /trackPaywallShown\('speaking_limit', \{ offer: kind, reason, level, moment \}\)/);
});

test('sanitizeProps keeps allowed scalars and drops everything personal or unknown', () => {
  const out = sanitizeProps({
    product: 'course_a1_2',
    level: 'a1.2',
    amount: 40,
    signed_in: false,
    email: 'learner@example.com',
    surface: 'someone@example.com',
    choice: 'I live in Berlin and need it for work',
    topic: 'x'.repeat(65),
    user_id: 'abc',
    step: NaN,
  });
  assert.deepEqual(out, { product: 'course_a1_2', level: 'a1.2', amount: 40, signed_in: false });
  assert.ok(!ALLOWED_PROPS.includes('email') && !ALLOWED_PROPS.includes('user_id'));
  assert.deepEqual(sanitizeProps(null), {});
});

/** Load astro-site/src/lib/track.js fresh against a fake window. */
async function loadTrack({ consent = 'accepted', gtag = true, attribution = null, session = false } = {}) {
  const store = new Map();
  if (consent) store.set('dm_cookie_consent', consent);
  if (attribution) store.set('dm_attribution', JSON.stringify(attribution));
  if (session) store.set('sb-x-auth-token', '{}');
  const calls = [];
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      key: (i) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    },
    location: { pathname: '/pricing/' },
    gtag: gtag ? (...args) => calls.push(args) : undefined,
  };
  const mod = await import(`${pathToFileURL(join(ROOT, 'astro-site/src/lib/track.js')).href}?v=${Math.random()}`);
  return { ...mod, calls };
}

test('track(): nothing leaves before consent, or without GA', async () => {
  for (const consent of [null, 'declined']) {
    const { track, calls } = await loadTrack({ consent });
    assert.equal(track('checkout_intent', { product: 'course_a2_1' }), false);
    assert.equal(calls.length, 0);
  }
  const noGa = await loadTrack({ gtag: false });
  assert.equal(noGa.track('checkout_intent', { product: 'course_a2_1' }), false);
});

test('track(): unknown events are refused; once-events fire once per surface', async () => {
  const { track, calls } = await loadTrack({ attribution: { first: { source: 'google', medium: 'organic' } }, session: true });
  assert.equal(track('made_up_event'), false);
  assert.equal(track('offer_viewed', { surface: 'line' }), true);
  assert.equal(track('offer_viewed', { surface: 'line' }), false, 'second view of the same surface is dropped');
  assert.equal(track('offer_viewed', { surface: 'ticket' }), true, 'another surface still counts');
  assert.equal(track('checkout_intent', { product: 'course_a1_2' }), true);
  assert.equal(track('checkout_intent', { product: 'course_a1_2' }), true, 'clicks are not deduped');
  assert.equal(calls.length, 4);
  const [kind, name, payload] = calls[0];
  assert.equal(kind, 'event');
  assert.equal(name, 'offer_viewed');
  assert.deepEqual(payload, { surface: 'line', signed_in: true, entry_page: '/pricing/', dm_source: 'google', dm_medium: 'organic' });
  assert.equal(onceKey('offer_viewed', { surface: 'line' }), 'offer_viewed:line:');
});

test('signup_completed: confirmation-aware, once per browser', async () => {
  const { isFreshSignup, claimSignupCompletion, SIGNUP_DONE_KEY } = await import(
    pathToFileURL(join(ROOT, 'src/lib/signupCompletion.js')).href
  );
  const now = Date.parse('2026-10-04T12:00:00Z');
  const iso = (msAgo) => new Date(now - msAgo).toISOString();
  const MIN = 60_000;
  // The case the old 60 s rule missed: created 3 h ago, confirmed 2 min ago.
  assert.equal(isFreshSignup({ created_at: iso(180 * MIN), email_confirmed_at: iso(2 * MIN) }, now), true);
  // Instant signup without confirmation.
  assert.equal(isFreshSignup({ created_at: iso(20_000) }, now), true);
  // An old account logging in again is not a signup.
  assert.equal(isFreshSignup({ created_at: iso(30 * 24 * 60 * MIN), email_confirmed_at: iso(29 * 24 * 60 * MIN) }, now), false);
  // Confirmed long ago, signing in today: not a signup.
  assert.equal(isFreshSignup({ created_at: iso(3 * 24 * 60 * MIN), email_confirmed_at: iso(2 * 24 * 60 * MIN) }, now), false);
  assert.equal(isFreshSignup(null, now), false);

  const store = new Map();
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const user = { id: 'u1', created_at: iso(10 * MIN), email_confirmed_at: iso(MIN) };
  assert.equal(claimSignupCompletion(user, now, storage), true);
  assert.equal(claimSignupCompletion(user, now, storage), false, 'a reload or second tab does not count twice');
  assert.equal(store.get(SIGNUP_DONE_KEY), 'u1');
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => {} };
  assert.equal(claimSignupCompletion({ ...user, id: 'u2' }, now, blocked), false, 'blocked storage fails closed');

  const auth = read('src/contexts/AuthContext.jsx');
  assert.match(auth, /claimSignupCompletion\(session\.user\)\) trackSignupCompleted\(\)/);
});

test('a checkout opened on a static page is observable when it finishes in the app', () => {
  const checkout = read('astro-site/src/components/CourseCheckout.astro');
  const ft = read('src/lib/funnelTracking.js');
  const flag = ft.match(/const CHECKOUT_FLAG = '([a-z_]+)'/)[1];
  assert.ok(checkout.includes(`sessionStorage.setItem('${flag}'`), 'CourseCheckout arms the app flag');
  assert.match(ft, /safeSetJSON\(CHECKOUT_FLAG, \{ plan, amount \}, \{ session: true \}\)/, 'same storage (session) and shape');
  assert.match(read('src/pages/SubscriptionSuccessPage.jsx'), /consumeCheckoutSuccess\(\)/, 'the success page consumes it');
});

test('the app mirrors only registered, sanitised, consented events to GA4', () => {
  const a = read('src/lib/analytics.js');
  assert.match(a, /if \(!hasConsent\(\) \|\| !isFunnelEvent\(event\)\) return;/);
  assert.match(a, /const payload = sanitizeProps\(/);
  assert.match(a, /window\.gtag\('event', event, payload\);/);
  assert.match(read('astro-site/src/layouts/Layout.astro'), /import \{ autoTrack \} from '\.\.\/lib\/track\.js';/);
});

test('guided scene telemetry carries only fixed item labels and the run id', async () => {
  const { sanitizeProps, EVENTS } = await import('../src/data/events.js');
  const { sceneStep } = await import('../src/lib/lesson/buildGuided.js');
  for (let i = 0; i < 12; i++) {
    const step = sceneStep(i);
    assert.deepEqual(sanitizeProps({ step, run_id: 'run123', name: 'A learner', transcript: 'Ich heiße …' }), { step, run_id: 'run123' });
  }
  assert.match(EVENTS.lesson_started.when, /Start is pressed/);
  assert.match(EVENTS.lesson_stage_viewed.when, /scene:<chunk>/);
});

// --- GA4 conversions (stop-the-leaks step 7, 2026-11-15) ----------------------
// GA4 showed 0 key events and €0 revenue: it counts them only under its standard
// names, and value/currency were stripped by sanitizeProps.

const { GA4_STANDARD_EVENTS } = await import(pathToFileURL(join(ROOT, 'src/data/events.js')).href);

/** Run src/lib/analytics.js (the SPA sender) against a fake window with the real registry. */
function loadAppAnalytics({ consent = 'accepted' } = {}) {
  const store = new Map(consent ? [['dm_cookie_consent', consent]] : []);
  const calls = [];
  const source = read('src/lib/analytics.js')
    .replace(/^import .*;\r?\n/gm, '')
    .replaceAll('import.meta.env.VITE_POSTHOG_KEY', "'test-key'")
    .replaceAll('import.meta.env.VITE_POSTHOG_HOST', "'test-host'")
    .replace("import('posthog-js')", 'Promise.reject(new Error("no posthog in tests"))')
    .replace(/^export /gm, '');
  const context = vm.createContext({
    window: {
      localStorage: { getItem: (k) => store.get(k) ?? null },
      location: { pathname: '/subscription/success' },
      gtag: (...args) => calls.push(args),
    },
    getAttribution: () => null,
    isFunnelEvent,
    sanitizeProps,
    GA4_STANDARD_EVENTS,
    console,
  });
  vm.runInContext(source, context);
  return { track: context.track, calls };
}

test('GA4 standard twins: one table in the registry, for registered events only', () => {
  assert.deepEqual(GA4_STANDARD_EVENTS, {
    signup_completed: 'sign_up',
    checkout_opened: 'begin_checkout',
    checkout_started: 'begin_checkout',
    checkout_completed: 'purchase',
  });
  for (const name of Object.keys(GA4_STANDARD_EVENTS)) assert.ok(isFunnelEvent(name), name);
  // Both senders read the table from the registry; neither keeps its own copy.
  for (const file of ['src/lib/analytics.js', 'astro-site/src/lib/track.js']) {
    const src = read(file);
    assert.match(src, /import \{[^}]*GA4_STANDARD_EVENTS[^}]*\} from '\.\.\/data\/events(\.js)?';/, file);
    assert.doesNotMatch(src, /'(sign_up|begin_checkout|purchase)'/, `${file} retypes a standard name`);
  }
});

test('GA4 purchase props survive the filter; nothing else new does', () => {
  for (const key of ['value', 'currency', 'transaction_id']) assert.ok(ALLOWED_PROPS.includes(key), key);
  const props = { plan: 'course_a1_2', amount: 40, value: 40, currency: 'EUR', transaction_id: '4711001' };
  assert.deepEqual(sanitizeProps({ ...props, items: [{ id: 'x' }], email: 'a@b.de' }), props);
});

test('the app sends the GA4 twin with the same props, only after consent', () => {
  const { track, calls } = loadAppAnalytics();
  const props = { plan: 'yearly', amount: 79.99, value: 79.99, currency: 'EUR', transaction_id: '4711001' };
  track('checkout_completed', props);
  const payload = { entry_page: '/subscription/success', ...props };
  assert.deepEqual(calls, [['event', 'checkout_completed', payload], ['event', 'purchase', payload]]);
  calls.length = 0;
  track('signup_completed');
  track('checkout_started');
  track('lesson_completed', { level: 'a1.1' });
  assert.deepEqual(calls.map((c) => c[1]), ['signup_completed', 'sign_up', 'checkout_started', 'begin_checkout', 'lesson_completed']);

  for (const consent of [null, 'declined']) {
    const gated = loadAppAnalytics({ consent });
    for (const name of Object.keys(GA4_STANDARD_EVENTS)) gated.track(name, props);
    assert.deepEqual(gated.calls, [], `nothing leaves with consent=${consent}`);
  }
});

test('the static site sends begin_checkout beside checkout_opened, only after consent', async () => {
  const { track, calls } = await loadTrack();
  assert.equal(track('checkout_opened', { product: 'course_a1_2', surface: 'pricing_level', amount: 40 }), true);
  assert.deepEqual(calls.map((c) => c[1]), ['checkout_opened', 'begin_checkout']);
  assert.deepEqual(calls[1][2], calls[0][2], 'same sanitised payload');
  track('checkout_intent', { product: 'course_a1_2' });
  assert.equal(calls.length, 3, 'events without a standard twin are sent once');
  for (const consent of [null, 'declined']) {
    const gated = await loadTrack({ consent });
    assert.equal(gated.track('checkout_opened', { product: 'course_a1_2' }), false);
    assert.deepEqual(gated.calls, []);
  }
});

test('checkout_completed carries the pricing.js list price in EUR, never a retyped one', async () => {
  const { checkoutPrice } = await import(pathToFileURL(join(ROOT, 'src/lib/checkoutAccess.js')).href);
  const pricing = await import(pathToFileURL(join(ROOT, 'src/data/pricing.js')).href);
  assert.equal(checkoutPrice('monthly'), pricing.MONTHLY_PRICE_EUR);
  assert.equal(checkoutPrice('yearly'), pricing.YEARLY_PRICE_EUR);
  assert.equal(checkoutPrice('telc_b1_komplett'), pricing.COURSE_TELC_B1_PRICE_EUR);
  assert.equal(checkoutPrice('course_a1_2'), pricing.SUBLEVEL_PRICES_EUR['a1.2']);
  assert.equal(checkoutPrice('all_access'), pricing.OFFER_PRODUCTS.all_access.price);
  for (const key of ['not-a-product', 'constructor', undefined, null]) assert.equal(checkoutPrice(key), null, String(key));
  assert.equal(pricing.CURRENCY, 'EUR');
  const ft = read('src/lib/funnelTracking.js');
  assert.match(ft, /const value = checkoutPrice\(plan\);/);
  // The whole call is pinned: no transaction_id, the browser never learns the order id.
  assert.match(ft, /value === null \? \{ plan, amount \} : \{ plan, amount, value, currency: CURRENCY \}\);/);
});
