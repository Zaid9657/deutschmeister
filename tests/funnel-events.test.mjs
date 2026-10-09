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
  assert.match(a, /window\.gtag\('event', event, sanitizeProps\(/);
  assert.match(read('astro-site/src/layouts/Layout.astro'), /import \{ autoTrack \} from '\.\.\/lib\/track\.js';/);
});
