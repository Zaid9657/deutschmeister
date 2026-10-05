// Guard suite: a resumed Buy reaches the checkout (revenue agent, 2026-10-05).
//
// The finding this closes (product p1, revenue b1): a signed-out "Buy" on
// /pricing/ or /courses/** stores dm_buy_intent and sends the visitor to
// /signup. After confirming, /login and /verify-email send them to
// postAuthPath() = /subscription?buy=<key>. That route was ProtectedRoute >
// EmailVerificationGate > OnboardingGate > SubscriptionPage, and a new account
// has onboarding_completed_at = null, so OnboardingGate rendered IntroSlides in
// place of the page. The ?buy= effect never ran, and the intro's exits (Lektion
// 1, the placement test, /dashboard) dropped the query: the checkout did not
// open. Walked in Chromium on origin/main b93fad0f with Supabase mocked: intro
// shown, no checkout, intent still pending after the intro; with the gate gone
// the overlay opens the checkout and the intent is cleared. The same gate sat on
// /subscription/success, where Lemon Squeezy returns the buyer, so it would have
// put the intro over the receipt.
//
// The rule, not a list of routes: every route a buyer arrives at on the way to
// or back from a checkout renders its page under the sign-in and verification
// gates only. Those routes are derived, not typed: every route under
// /subscription in src/App.jsx, the destination postAuthPath() resumes each
// product's intent at, the in-app offer links (checkoutHref, PRO_OFFER), and the
// success landing the shared Astro checkout redirects to. No component on such a
// route may render the onboarding intro (IntroSlides, or a redirect to
// /onboarding) in place of its children. The intro still runs on the learning
// routes, starting with the one postAuthPath() sends a user with no pending
// checkout to.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

import { PLANS, COURSES, LEVEL_COURSES, SELLABLE_LEVELS, productKeyForLevel } from '../src/data/pricing.js';
import { checkoutHref, PRO_OFFER } from '../src/lib/speakingOffer.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Comments out, so a doc comment that quotes a gate cannot satisfy or trip the rule. */
const code = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

const APP = code(read('src/App.jsx'));

/** From the '{' at i, the source up to its matching '}' (exclusive), at brace depth 0. */
const braced = (src, i) => {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(i + 1, j);
  }
  throw new Error(`unbalanced braces from ${i}`);
};

/** Every <Route> in App.jsx as { path, element }, attributes in any order. */
const ROUTES = (() => {
  const out = [];
  for (const m of APP.matchAll(/<Route\b/g)) {
    // The opening tag: forward to the first '>' outside braces.
    let depth = 0;
    let end = m.index;
    for (let j = m.index; j < APP.length; j++) {
      if (APP[j] === '{') depth++;
      else if (APP[j] === '}') depth--;
      else if (APP[j] === '>' && depth === 0) { end = j; break; }
    }
    const tag = APP.slice(m.index, end + 1);
    const path = tag.match(/\bpath="([^"]+)"/)?.[1];
    const el = tag.indexOf('element={');
    if (!path || el < 0) continue;
    out.push({ path, element: braced(tag, el + 'element='.length) });
  }
  return out;
})();

const routeFor = (pathname) => ROUTES.find((r) => r.path === pathname);

/** The file App.jsx imports a component from (static import or lazy(() => import())). */
const sourceOf = (name) => {
  const m = APP.match(new RegExp(`import\\s+${name}\\s+from\\s+'(\\./[^']+)'`))
    || APP.match(new RegExp(`const\\s+${name}\\s*=\\s*lazy\\(\\s*\\(\\)\\s*=>\\s*import\\('(\\./[^']+)'\\)`));
  if (!m) return null;
  const base = join('src', m[1]);
  return [base, `${base}.jsx`, `${base}.js`, join(base, 'index.jsx')]
    .find((p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile()) || null;
};

/** A component shows the onboarding intro instead of its children: it renders IntroSlides or redirects to /onboarding. */
const showsIntro = (file) => {
  const src = code(read(file));
  return /<IntroSlides[\s/>]/.test(src)
    || /\bto=(?:"\/onboarding"|'\/onboarding'|\{\s*['"]\/onboarding['"]\s*\})/.test(src)
    || /navigate\(\s*['"]\/onboarding['"]/.test(src);
};

/** The components a route renders, outermost first, with their files. */
const componentsOf = (route) => [...route.element.matchAll(/<([A-Z]\w*)/g)]
  .map((m) => m[1])
  .map((name) => ({ name, file: sourceOf(name) }));

const introWrappers = (route) => componentsOf(route).filter((c) => c.file && showsIntro(c.file)).map((c) => c.name);

/** src/lib/buyIntent.js as shipped, run in node:vm over an in-memory localStorage. */
const loadBuyIntent = () => {
  const store = new Map();
  const src = read('src/lib/buyIntent.js')
    .replace(/^import\s+\{[^}]*\}\s+from\s+'\.\.\/utils\/safeStorage';\s*$/m, '')
    .replace(/^export\s+const\s+/gm, 'const ');
  assert.ok(!/^\s*(import|export)\b/m.test(src), 'buyIntent.js grew an import or export this harness does not stub');
  const ctx = vm.createContext({
    safeGet: (k) => (store.has(k) ? store.get(k) : null),
    safeSet: (k, v) => { store.set(k, String(v)); return true; },
    safeRemove: (k) => { store.delete(k); },
  });
  return vm.runInContext(`${src}\n;({ setBuyIntent, peekBuyIntent, clearBuyIntent, postAuthPath });`, ctx);
};

const PRODUCT_KEYS = [...Object.keys(PLANS), ...Object.keys(COURSES), ...Object.keys(LEVEL_COURSES)];

/** Every path a buyer arrives at on the way to or back from a checkout, with where it came from. */
const purchaseArrivals = () => {
  const out = [];
  const buy = loadBuyIntent();
  for (const key of PRODUCT_KEYS) {
    buy.setBuyIntent(key);
    out.push({ from: `postAuthPath() with a pending ${key}`, href: buy.postAuthPath() });
    buy.clearBuyIntent();
  }
  for (const level of SELLABLE_LEVELS) out.push({ from: `checkoutHref(${level})`, href: checkoutHref(productKeyForLevel(level)) });
  out.push({ from: 'PRO_OFFER.href', href: PRO_OFFER.href });
  const astro = code(read('astro-site/src/components/CourseCheckout.astro'));
  for (const m of astro.matchAll(/['"`](?:https:\/\/deutsch-meister\.de)?(\/subscription[^'"`\s]*)['"`]/g)) {
    out.push({ from: 'CourseCheckout.astro', href: m[1] });
  }
  for (const r of ROUTES.filter((x) => x.path === '/subscription' || x.path.startsWith('/subscription/'))) {
    out.push({ from: 'App.jsx route', href: r.path });
  }
  return out;
};

const pathnameOf = (href) => href.split(/[?#]/)[0].replace(/(.)\/$/, '$1');

test('the route parser reads the real route table', () => {
  assert.ok(ROUTES.length > 20, `parsed only ${ROUTES.length} routes out of src/App.jsx`);
  for (const p of ['/subscription', '/subscription/success', '/dashboard', '/onboarding']) {
    assert.ok(routeFor(p), `${p} not found in the parsed route table`);
  }
  // The detector is not vacuous: the onboarding gate itself is recognised.
  assert.equal(sourceOf('OnboardingGate'), 'src/components/onboarding/OnboardingGate.jsx');
  assert.ok(showsIntro('src/components/onboarding/OnboardingGate.jsx'), 'OnboardingGate no longer detected as showing the intro');
});

test('the buy-intent harness runs the shipped postAuthPath', () => {
  const buy = loadBuyIntent();
  assert.equal(buy.postAuthPath(), '/dashboard', 'no pending checkout: the dashboard');
  buy.setBuyIntent('course_a1_2');
  assert.equal(buy.postAuthPath(), '/subscription?buy=course_a1_2');
  buy.setBuyIntent('not-a-product');
  assert.equal(buy.peekBuyIntent(), 'course_a1_2', 'an unknown key is refused, the pending one kept');
});

test('every route a buyer arrives at renders its page, never the onboarding intro', () => {
  const arrivals = purchaseArrivals();
  assert.ok(arrivals.some((a) => a.from.startsWith('postAuthPath')), 'no resume destination derived');
  assert.ok(arrivals.some((a) => a.from === 'CourseCheckout.astro'), 'no success landing found in CourseCheckout.astro');
  for (const { from, href } of arrivals) {
    const pathname = pathnameOf(href);
    const route = routeFor(pathname);
    assert.ok(route, `${from} sends a buyer to ${href}, which has no route in src/App.jsx`);
    const wrappers = introWrappers(route);
    assert.deepEqual(wrappers, [], `${pathname} (reached via ${from}) is wrapped in ${wrappers.join(', ')}, which shows the onboarding intro instead of the page`);
  }
});

test('the purchase routes still require a signed-in, verified account', () => {
  for (const r of ROUTES.filter((x) => x.path === '/subscription' || x.path.startsWith('/subscription/'))) {
    const names = componentsOf(r).map((c) => c.name);
    assert.ok(names.includes('ProtectedRoute'), `${r.path} lost its sign-in gate`);
    assert.ok(names.includes('EmailVerificationGate'), `${r.path} lost its email verification gate`);
  }
});

test('the intro still runs where a user with no pending checkout lands', () => {
  const home = pathnameOf(loadBuyIntent().postAuthPath());
  const route = routeFor(home);
  assert.ok(route, `${home} has no route`);
  assert.ok(introWrappers(route).length > 0, `${home} no longer shows the onboarding intro to a new account`);
});
