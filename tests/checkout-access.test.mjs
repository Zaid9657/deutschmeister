import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { checkoutEntitlementConfirmed, hasRecurringBilling, ownsCheckoutProduct } from '../src/lib/checkoutAccess.js';
import { proCta } from '../astro-site/src/lib/proCta.js';
import { deEur, eur } from '../src/data/pricing.js';
import { providerHarness, settle, withoutImports } from './helpers/subscriptionProvider.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const page = read('src/pages/SubscriptionPage.jsx');
const active = (product_key) => ({ product_key, status: 'active' });

// Execute the actual resumption callback, with a Pro member and a returning
// course owner. The callback must use the same ownership rule as the cards.
const resume = (key, purchases, { billingVerified = true, cleared = [] } = {}) => {
  const start = page.indexOf("    const key = searchParams.get('buy');");
  const end = page.indexOf('    // eslint-disable-next-line react-hooks/exhaustive-deps', start);
  assert.ok(start >= 0 && end > start);
  const calls = [];
  const context = {
    searchParams: new URLSearchParams({ buy: key }), autoBuyRef: { current: false },
    subLoading: false, billingVerified, user: { id: 'learner' }, isSubscribed: true, recurringBilling: false,
    clearBuyIntent() { cleared.push(key); }, setSearchParams() {},
    course: { key: 'telc_b1_komplett', variantId: 'telc-checkout' },
    LEMONSQUEEZY_CONFIG: { levelCourses: {
      course_a2_1: { key: 'course_a2_1', levels: ['a2.1'], variantId: 'checkout-a21' },
      course_a2_2: { key: 'course_a2_2', levels: ['a2.2'], variantId: 'checkout-a22' },
    } },
    hasProduct: (product) => purchases.some((p) => p.product_key === product),
    ownsCheckoutProduct, purchases,
    startPurchase: (...args) => calls.push(args), handleSubscribe: (...args) => calls.push(args),
  };
  vm.runInNewContext(`(() => {\n${page.slice(start, end)}\n})()`, context);
  return calls;
};

test('B1 #12: resumed checkout respects retired bands, bundles and exact course ownership', () => {
  for (const key of ['course_a2_1', 'course_a2_2']) {
    for (const purchase of ['course_a2', 'course_alle', key]) {
      assert.equal(resume(key, [active(purchase)]).length, 0, `${purchase} already owns ${key}`);
    }
    assert.equal(resume(key, [active('course_a1_2')]).length, 1, 'unrelated ownership must not block a course');
    assert.equal(resume(key, []).length, 1, 'Pro alone does not own a lifetime course');
  }
  assert.equal(ownsCheckoutProduct('course_a2_1', [{ product_key: 'course_a2', status: 'refunded' }]), false);
  assert.match(page, /const owned = ownsCheckoutProduct\(c\.key, purchases\)/, 'cards and resumption share the predicate');
});

test('B1 #1: existing recurring customers manage billing, including failed and paused plans', () => {
  for (const status of ['active', 'on_trial', 'past_due', 'unpaid', 'paused', 'cancelled']) {
    const subscription = {
      plan_type: 'monthly', status, lemonsqueezy_subscription_id: 'ls-123',
      subscription_end: '2099-01-01T00:00:00Z',
    };
    assert.equal(hasRecurringBilling(subscription), true, status);
    const cta = proCta({ signedIn: true, subscription });
    assert.equal(cta.action, 'portal', status);
    assert.equal(cta.href, 'https://deutsch-meister.lemonsqueezy.com/billing');
  }
  for (const subscription of [null,
    { plan_type: 'course', status: 'active', lemonsqueezy_subscription_id: null },
    { plan_type: 'monthly', status: 'expired', lemonsqueezy_subscription_id: 'ended' },
    { plan_type: 'monthly', status: 'cancelled', subscription_end: '2020-01-01', lemonsqueezy_subscription_id: 'ended' },
  ]) assert.equal(proCta({ signedIn: true, subscription }).action, 'checkout');
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.match(pricing, /billing = await loadBilling\(\);[\s\S]*checked\.action === 'portal'[\s\S]*open\(VARIANTS\[cycle\], cycle\)/);
  assert.match(pricing, /if \(error\) throw error;/, 'a failed billing lookup cannot open a checkout');
  const subscribe = page.slice(page.indexOf('  const handleSubscribe ='), page.indexOf('  // One-time course'));
  assert.ok(subscribe.indexOf('if (recurringBilling)') < subscribe.indexOf('openCheckout(checkoutUrl)'));
});

test('R3 #2: a retained recurring provider ID on a course routes pricing to billing until reconciliation clears it', async () => {
  const pricing = read('astro-site/src/pages/pricing.astro');
  const start = pricing.indexOf("    $('pro-btn').addEventListener('click', async () => {");
  const end = pricing.indexOf('\n    });', start) + '\n    });'.length;
  assert.ok(start >= 0 && end > start);
  const click = async (subscription) => {
    const opened = [];
    let onClick;
    const button = { addEventListener: (_type, callback) => { onClick = callback; } };
    const location = { href: '' };
    vm.runInNewContext(pricing.slice(start, end), {
      $: () => button, proCta, currentUser: () => ({ id: 'learner' }), cycle: 'monthly',
      track() {}, billing: null, loadBilling: async () => ({ userId: 'learner', subscription }),
      window: { location }, VARIANTS: { monthly: 'monthly-checkout' },
      open: (...args) => opened.push(args), applyCycle() {},
    });
    await onClick();
    return { opened, href: location.href };
  };
  for (const status of ['active', 'paused', 'expired', 'cancelled']) {
    const legacyCourse = {
      plan_type: 'course', status, subscription_end: '2020-01-01T00:00:00Z',
      lemonsqueezy_subscription_id: 'recoverable-recurring',
    };
    assert.equal(hasRecurringBilling(legacyCourse), true, status);
    const routed = await click(legacyCourse);
    assert.equal(routed.href, 'https://deutsch-meister.lemonsqueezy.com/billing', status);
    assert.deepEqual(routed.opened, [], status);
    const reconciled = { ...legacyCourse, lemonsqueezy_subscription_id: null };
    assert.equal(hasRecurringBilling(reconciled), false, status);
    assert.deepEqual((await click(reconciled)).opened, [['monthly-checkout', 'monthly']], status);
  }
});

test('B1 #13: pre-existing Pro cannot confirm a pending course before purchases refresh', () => {
  const state = { isSubscribed: true, purchases: [active('course_a1_2')] };
  assert.equal(checkoutEntitlementConfirmed('course_a2_1', state), false);
  assert.equal(checkoutEntitlementConfirmed('telc_b1_komplett', state), false);
  assert.equal(checkoutEntitlementConfirmed('monthly', state), true);
  assert.equal(checkoutEntitlementConfirmed('course_a2_1', { ...state, purchases: [active('course_a2_1')] }), true);
  const start = page.indexOf('  useEffect(() => {');
  const end = page.indexOf('\n  }, [', start);
  const stopped = [];
  const context = {
    useEffect: (effect) => effect(), ...state, pendingProduct: 'course_a2_1', verifying: true,
    checkoutEntitlementConfirmed, pollRef: { current: 123 },
    setVerifying: (value) => stopped.push(value), setPendingProduct() {}, setVerifyMessage() {},
    clearInterval() {}, consumeCheckoutSuccess: () => stopped.push('completed'),
  };
  vm.runInNewContext(`${page.slice(start, end)}\n  });`, context);
  assert.deepEqual(stopped, [], 'pre-existing Pro must leave course polling running');
  context.purchases = [active('course_a2_1')];
  vm.runInNewContext(`${page.slice(start, end)}\n  });`, context);
  assert.deepEqual(stopped, [false, 'completed'], 'the purchased course completes verification');
  assert.match(page, /if \(verifying && checkoutEntitlementConfirmed\(pendingProduct, \{ isSubscribed, purchases \}\)\)/);
  assert.match(page, /setPendingProduct\(productKey\);\s*setVerifying\(true\)/);
  const provider = read('src/components/LemonSqueezyProvider.jsx');
  assert.match(provider, /evt\?\.event === 'Checkout.Success'[\s\S]*refreshRef\.current\(\);[\s\S]*navigate\('\/subscription\/success'\)/);
  const success = read('src/pages/SubscriptionSuccessPage.jsx');
  assert.match(success, /const verified = pendingProduct\s*\? checkoutEntitlementConfirmed/);
  assert.match(success, /safeGetJSON\('dm_checkout_pending'/, 'success retains which product needs confirmation');
});

// ACC-02 (cross-check 2026-10-25): a failed or timed-out entitlement read is a
// failure, never "no subscription / no purchases". postgrest-js resolves a
// network or 5xx failure as { error }; the services turned that into null / []
// and the provider stored it: a background refresh sent paying learners to the
// paywall, and /subscription opened a second recurring (or owned-course)
// checkout. Now the reads throw, the provider keeps what the account had and
// exposes billingVerified, and the page sells nothing until billing is read.
const LIVE_PLAN = { status: 'active', plan_type: 'monthly', subscription_end: '2100-01-01', lemonsqueezy_subscription_id: 'sub-1' };
const OWNED_A12 = [{ product_key: 'course_a1_2', status: 'active', access_until: '2000-01-01' }];
const failingAfterFirst = (value) => {
  let calls = 0;
  return async () => {
    calls++;
    if (calls === 1) return value;
    throw new Error('FetchError: network request failed');
  };
};

test('ACC-02: the subscription service reports a failed read instead of answering "none"', async () => {
  const builder = (result) => {
    const chain = {};
    for (const name of ['select', 'eq', 'order', 'limit']) chain[name] = () => chain;
    chain.maybeSingle = async () => result;
    chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
    return chain;
  };
  const load = (result) => vm.runInNewContext(
    `${withoutImports(read('src/services/subscriptionService.js')).replace(/export const /g, 'const ')}\n({ getSubscription, getPurchases, getUserProfile });`,
    { supabase: { from: () => builder(result) }, console: { error() {}, warn() {} }, subscriptionStatus: () => ({}), Date },
  );
  const failed = load({ data: null, error: { message: 'FetchError: Failed to fetch', code: '' } });
  for (const name of ['getSubscription', 'getPurchases', 'getUserProfile']) {
    await assert.rejects(failed[name]('learner'), (error) => /Failed to fetch/.test(error.message), `${name} must throw on a failed read`);
  }
  const empty = load({ data: null, error: null });
  assert.equal(await empty.getSubscription('learner'), null, 'no row is still null');
  assert.equal((await empty.getPurchases('learner')).length, 0, 'no purchases is still an empty list');
  assert.equal(await empty.getUserProfile('learner'), null, 'a missing profile is null, not an error');
});

test('ACC-02: a refresh whose subscription read fails keeps the plan and marks billing unverified', async () => {
  const h = providerHarness({ getSubscription: failingAfterFirst(LIVE_PLAN), getPurchases: async () => OWNED_A12 });
  h.account('A'); h.render(); await settle();
  const first = h.render();
  assert.equal(first.billingVerified, true, 'both billing reads succeeded');
  assert.equal(first.hasAccess, true);
  await first.refreshSubscription();
  const after = h.render();
  assert.equal(after.billingVerified, false, 'an unread subscription is not verified billing');
  assert.equal(after.subscription?.lemonsqueezy_subscription_id, 'sub-1', 'the plan the account had is kept');
  assert.equal(after.hasAccess, true, 'a failed read must not cost a subscriber their access');
  assert.equal(after.hasLevelAccess('a1.2'), true);
  assert.equal(after.loading, false);
});

test('ACC-02: a refresh whose purchases read fails keeps every owned level', async () => {
  const h = providerHarness({ getPurchases: failingAfterFirst(OWNED_A12) });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().hasLevelAccess('a1.2'), true);
  await h.render().refreshSubscription();
  const after = h.render();
  assert.equal(after.billingVerified, false);
  assert.equal(after.purchases.length, 1, 'purchases are kept, not replaced by []');
  assert.equal(after.hasLevelAccess('a1.2'), true, 'an owned level stays open after a failed refresh');
  assert.equal(after.hasProduct('course_a1_2'), true);
});

test('ACC-02: a timed-out load keeps the data and never counts as verified billing', async () => {
  let loads = 0;
  const h = providerHarness({
    getSubscription: async () => LIVE_PLAN,
    getPurchases: async () => OWNED_A12,
    withTimeout: (promise) => (loads++ === 0 ? promise : Promise.reject(new Error('Request timed out'))),
  });
  h.account('A'); h.render(); await settle();
  assert.equal(h.render().billingVerified, true);
  await h.render().refreshSubscription();
  const after = h.render();
  assert.equal(after.billingVerified, false);
  assert.equal(after.subscription?.status, 'active');
  assert.equal(after.hasLevelAccess('a1.2'), true);
  assert.equal(after.loading, false);
});

test('ACC-02: an unreadable profile is never "missing": no trial backfill, the profile is kept', async () => {
  let writes = 0;
  let reads = 0;
  const h = providerHarness({
    getUserProfile: async (id) => {
      reads++;
      if (reads === 1) return { id, trial_started_at: '2000-01-01', trial_ends_at: '2000-01-08', current_level: 'A2.1' };
      throw new Error('FetchError: network request failed');
    },
    startFreeTrial: async () => { writes++; },
  });
  h.account('A'); h.render(); await settle();
  await h.render().refreshSubscription();
  await settle();
  const after = h.render();
  assert.equal(writes, 0, 'a failed profile read must not restart the trial');
  assert.equal(after.profile?.current_level, 'A2.1', 'the profile the account had is kept');
  assert.equal(after.billingVerified, true, 'billing itself was read');
});

/** A handler of SubscriptionPage as shipped: `  const <name> = …` to its closing `  };`. */
const pageHandler = (name, context) => {
  const start = page.indexOf(`  const ${name} = `);
  const end = page.indexOf('\n  };\n', start);
  assert.ok(start >= 0 && end > start, `${name} not found in SubscriptionPage.jsx`);
  return vm.runInNewContext(`(() => {\n${page.slice(start, end)}\n  };\n  return ${name};\n})()`, context);
};

const checkoutContext = (overrides = {}) => {
  const opened = [];
  const context = {
    subLoading: false, verifying: false, billingVerified: true, recurringBilling: false, billingAction: null,
    purchases: [], user: { id: 'learner', email: 'learner@example.com' }, coupon: null,
    window: { location: { href: '/subscription' } },
    LEMONSQUEEZY_CONFIG: { plans: { monthly: { variantId: 'monthly-checkout' } }, getCheckoutUrl: (variant) => `https://checkout/${variant}` },
    PLANS: { monthly: { price: 9.99 } }, ownsCheckoutProduct,
    markCheckoutStarted() {}, openCheckout: (url) => opened.push(url),
    setPendingProduct() {}, setVerifying() {}, setVerifyMessage() {},
    pollRef: { current: null }, setInterval: () => 1, clearInterval() {},
    refreshSubscription: async () => {}, verifySubscription: async () => false,
    ...overrides,
  };
  return { context, opened };
};

test('ACC-02: /subscription opens no checkout while billing is unverified', () => {
  for (const billingVerified of [true, false]) {
    const subscribe = checkoutContext({ billingVerified });
    pageHandler('handleSubscribe', subscribe.context)('monthly');
    assert.equal(subscribe.opened.length, billingVerified ? 1 : 0, `handleSubscribe, billingVerified=${billingVerified}`);
    const purchase = checkoutContext({ billingVerified });
    pageHandler('startPurchase', purchase.context)('course_a2_1', 'checkout-a21', 50);
    assert.equal(purchase.opened.length, billingVerified ? 1 : 0, `startPurchase, billingVerified=${billingVerified}`);
  }
  // A recurring customer goes to the portal, and only when the action exists.
  const portal = checkoutContext({ recurringBilling: true, billingAction: { href: 'https://portal' } });
  pageHandler('handleSubscribe', portal.context)('monthly');
  assert.equal(portal.context.window.location.href, 'https://portal');
  assert.equal(portal.opened.length, 0);
  const missing = checkoutContext({ recurringBilling: true, billingAction: null });
  pageHandler('handleSubscribe', missing.context)('monthly');
  assert.equal(missing.context.window.location.href, '/subscription', 'no action: no navigation to "undefined"');
  assert.equal(missing.opened.length, 0, 'and still no second recurring checkout');
});

test('ACC-02: a resumed ?buy= waits for verified billing and keeps the intent until then', () => {
  for (const key of ['course_a2_1', 'monthly']) {
    const cleared = [];
    assert.equal(resume(key, [], { billingVerified: false, cleared }).length, 0, `${key}: no checkout from unread billing`);
    assert.deepEqual(cleared, [], `${key}: the intent survives until billing is read`);
  }
  assert.equal(resume('course_a2_1', []).length, 1, 'verified billing resumes the checkout');
  assert.match(page, /\}, \[searchParams, subLoading, billingVerified, user\]\);/, 'the resume re-runs when billing becomes verified');
});

test('ACC-02: the Buy and Subscribe controls are disabled until billing is read, with a notice and a retry', () => {
  assert.match(page, /disabled=\{subLoading \|\| verifying \|\| !billingVerified \|\| \(isSubscribed && !recurringBilling\)\}/);
  assert.equal((page.match(/disabled=\{verifying \|\| !billingVerified\}/g) || []).length, 2, 'level-course and telc Buy');
  assert.match(page, /\{!subLoading && !billingVerified && \(/, 'the notice shows once loading is over');
  assert.match(page, /Ihr Abo-Status konnte gerade nicht geladen werden\. Bitte versuchen Sie es gleich noch einmal\./);
  assert.match(page, /onClick=\{reloadBilling\}/);
  assert.match(page, /await refreshSubscription\(\);/);
  // "Trial expired" is a claim about verified billing only.
  assert.match(page, /\{!inTrial && !isSubscribed && billingVerified && !paymentFailed && \(/);
});

test('ACC-12: lemon.js loads only where a checkout can open (/subscription), not on /dashboard or /profile', () => {
  const provider = read('src/components/LemonSqueezyProvider.jsx');
  const routes = provider.match(/const COMMERCE_ROUTES = (\[[^\]]*\]);/);
  assert.ok(routes, 'COMMERCE_ROUTES moved');
  const COMMERCE_ROUTES = vm.runInNewContext(routes[1]);
  const needed = (pathname) => vm.runInNewContext(
    provider.match(/const needed = ([^;]+);/)[1], { COMMERCE_ROUTES, pathname },
  );
  for (const pathname of ['/subscription', '/subscription/success']) assert.equal(needed(pathname), true, pathname);
  for (const pathname of ['/dashboard', '/profile', '/course/a1.2', '/pricing', '/payment']) assert.equal(needed(pathname), false, pathname);
  // Every SPA file that opens a checkout lives on a commerce route.
  assert.match(page, /openCheckout\(checkoutUrl\)/);
  assert.doesNotMatch(read('src/pages/DashboardPage.jsx'), /openCheckout|getCheckoutUrl/);
  assert.doesNotMatch(read('src/pages/ProfilePage.jsx'), /openCheckout|getCheckoutUrl/);
});

test('ACC-15: an accepted coupon shows the server\'s saving and price at checkout, formatted by pricing.js', () => {
  const field = read('src/components/CouponField.jsx');
  const start = field.indexOf('export const couponAppliedLine = ');
  const end = field.indexOf('\n};\n', start);
  assert.ok(start >= 0 && end > start, 'couponAppliedLine moved');
  const couponAppliedLine = vm.runInNewContext(
    `${field.slice(start, end).replace('export const', 'const')}\n};\ncouponAppliedLine;`, { eur, deEur, Number },
  );
  // coupon-validate's answer: minor units (netlify/functions/coupon-validate.mjs).
  const ok = { ok: true, code: 'WELCOME20', label: 'Welcome 20 %', discount: 200, final: 799 };
  assert.equal(couponAppliedLine(ok, false), `✓ Welcome 20 %: you save ${eur(2)}, price at checkout ${eur(7.99)}`);
  assert.equal(couponAppliedLine(ok, true), `✓ Welcome 20 %: Sie sparen ${deEur(2)}, Preis im Checkout ${deEur(7.99)}`);
  // Without amounts (an offer the server could not price) it only says the code applies.
  for (const partial of [{ ...ok, discount: null, final: null }, { ...ok, final: undefined }, { ...ok, discount: 0, final: 999 }]) {
    assert.equal(couponAppliedLine(partial, false), '✓ Welcome 20 % applies at checkout');
    assert.equal(couponAppliedLine(partial, true), '✓ Welcome 20 % wird im Checkout angewendet');
  }
  assert.equal(couponAppliedLine({ ok: true, code: 'X1', discount: 100, final: 899 }, false), `✓ X1: you save ${eur(1)}, price at checkout ${eur(8.99)}`);
  assert.match(field, /import \{ deEur, eur \} from '\.\.\/data\/pricing\.js';/);
  assert.doesNotMatch(field.replace(/\/\/.*$/gm, ''), /€\s?\d|\d[.,]\d\d\s?€/, 'no price typed in the field');
});

test('ACC-02: a first load that cannot read billing is unverified, and a later good read verifies it', async () => {
  let fail = true;
  const h = providerHarness({ getSubscription: async () => { if (fail) throw new Error('503'); return null; } });
  h.account('A'); h.render(); await settle();
  const first = h.render();
  assert.equal(first.loading, false);
  assert.equal(first.billingVerified, false);
  fail = false;
  await first.refreshSubscription();
  assert.equal(h.render().billingVerified, true);
});
