import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { checkoutEntitlementConfirmed, hasRecurringBilling, ownsCheckoutProduct } from '../src/lib/checkoutAccess.js';
import { proCta } from '../astro-site/src/lib/proCta.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const page = read('src/pages/SubscriptionPage.jsx');
const active = (product_key) => ({ product_key, status: 'active' });

// Execute the actual resumption callback, with a Pro member and a returning
// course owner. The callback must use the same ownership rule as the cards.
const resume = (key, purchases) => {
  const start = page.indexOf("    const key = searchParams.get('buy');");
  const end = page.indexOf('    // eslint-disable-next-line react-hooks/exhaustive-deps', start);
  assert.ok(start >= 0 && end > start);
  const calls = [];
  const context = {
    searchParams: new URLSearchParams({ buy: key }), autoBuyRef: { current: false },
    subLoading: false, user: { id: 'learner' }, isSubscribed: true, recurringBilling: false,
    clearBuyIntent() {}, setSearchParams() {},
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
