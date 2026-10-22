import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flagsFromRows } from '../netlify/functions/_shared/adminEntitlement.mjs';
import { couponProduct } from '../netlify/functions/_shared/pricing.mjs';
import { evaluateCoupon } from '../netlify/functions/_shared/adminCouponsLib.mjs';
import { PLANS, LEVEL_COURSES } from '../src/data/pricing.js';

process.env.SUPABASE_URL = 'http://supabase.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID = '1393033';
process.env.LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID = '2088888';

const userId = '00000000-0000-0000-0000-000000000001';
const couponId = '00000000-0000-0000-0000-000000000002';
const future = '2999-01-01T00:00:00Z';
const past = '2020-01-01T00:00:00Z';
let tables;
let requests;
let failProfileWrites;

globalThis.fetch = async (url, init = {}) => {
  const href = new URL(String(url));
  requests.push({ href: href.href, method: init.method || 'GET' });
  if (href.pathname === '/auth/v1/user') {
    return new Response(JSON.stringify({ id: userId }), { headers: { 'content-type': 'application/json' } });
  }
  const table = href.pathname.split('/').at(-1);
  let rows = [...(tables[table] || [])];
  for (const [column, filter] of href.searchParams) {
    if (filter.startsWith('eq.')) rows = rows.filter((row) => String(row[column]) === filter.slice(3));
    if (filter.startsWith('lte.')) rows = rows.filter((row) => row[column] && Date.parse(row[column]) <= Date.parse(filter.slice(4)));
    if (filter.startsWith('lt.')) rows = rows.filter((row) => row[column] && Date.parse(row[column]) < Date.parse(filter.slice(3)));
    if (filter.startsWith('in.(')) rows = rows.filter((row) => filter.slice(4, -1).split(',').includes(String(row[column])));
  }
  const offset = Number(href.searchParams.get('offset') || 0);
  const limit = Number(href.searchParams.get('limit') || rows.length);
  rows = rows.slice(offset, offset + limit);
  if (table === 'profiles' && init.method === 'POST' && failProfileWrites) {
    return new Response(JSON.stringify({ message: 'profile write failed' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  if (init.method === 'PATCH') {
    const patch = JSON.parse(init.body);
    for (const row of rows) Object.assign(row, patch);
  } else if (init.method === 'POST') {
    const incoming = { id: 'stub-insert', ...JSON.parse(init.body) };
    const conflictColumn = href.searchParams.get('on_conflict');
    const prior = conflictColumn && (tables[table] || []).find((row) => row[conflictColumn] === incoming[conflictColumn]);
    if (prior) Object.assign(prior, incoming);
    else (tables[table] ||= []).push(incoming);
    rows = [prior || incoming];
  }
  return new Response(init.method === 'HEAD' ? null : JSON.stringify(rows), {
    headers: { 'content-type': 'application/json', 'content-range': `0-0/${rows.length}` },
  });
};

const { handler: validateCoupon } = await import('../netlify/functions/coupon-validate.mjs');
const { handler: adminCoupons } = await import('../netlify/functions/admin-coupons.mjs');
const { handler: adminActions } = await import('../netlify/functions/admin-actions.mjs');
const { expireCourseWindows } = await import('../netlify/functions/trial-lifecycle.mjs');
const { supabase } = await import('../netlify/functions/_shared/supabase.mjs');

const event = (body) => ({ httpMethod: 'POST', headers: { authorization: 'Bearer stub-jwt' }, body: JSON.stringify(body), path: '/stub' });
const coupon = (patch = {}) => ({ id: couponId, code: 'WELCOME20', normalized_code: 'WELCOME20', internal_name: 'Welcome', status: 'active', discount_type: 'percent', discount_value: 20, ...patch });

beforeEach(() => {
  requests = [];
  failProfileWrites = false;
  tables = {
    profiles: [{ id: userId, role: 'admin', email: 'learner@example.com', is_subscribed: true, subscription_tier: 'pro' }],
    subscriptions: [],
    purchases: [],
    coupons: [coupon()],
    coupon_redemptions: [],
  };
});

test('admin flag sync keeps lifetime ownership separate from expired included Pro', async () => {
  tables.purchases = [{ user_id: userId, status: 'active', product_key: 'course_a2', access_until: past }];
  tables.subscriptions = [{ user_id: userId, status: 'expired', plan_type: 'course', subscription_end: past }];
  const response = await adminActions(event({ action: 'sync_flags', userId }));
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(tables.profiles[0].is_subscribed, false);
  assert.equal(tables.profiles[0].subscription_tier, 'free');
  assert.equal(tables.purchases[0].status, 'active', 'the course remains permanently owned');
});

test('admin flags require an active purchase window or current paid-through subscription', () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  const free = { is_subscribed: false, subscription_tier: 'free' };
  for (const purchase of [
    { status: 'active', access_until: null },
    { status: 'active', access_until: past },
    { status: 'active', access_until: new Date(now).toISOString() },
    { status: 'refunded', access_until: future },
  ]) assert.deepEqual(flagsFromRows([], [purchase], now), free);
  assert.equal(flagsFromRows([], [{ status: 'active', access_until: future }], now).is_subscribed, true);
  assert.equal(flagsFromRows([{ status: 'past_due', subscription_end: future }], [], now).is_subscribed, true);
  assert.deepEqual(flagsFromRows([{ status: 'expired', subscription_end: future }], [], now), free);
});

test('manual Pro-day grants retain their paid window after status-aware flag sync', async () => {
  tables.profiles[0].is_subscribed = false;
  tables.profiles[0].subscription_tier = 'free';
  const response = await adminActions(event({ action: 'grant_pro_days', userId, reason: 'Support grant', params: { days: 1 } }));
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(tables.profiles[0].is_subscribed, true);
  assert.equal(tables.profiles[0].subscription_tier, 'pro');
});

test('coupon validation resolves the selected product scope and catalogue amount server-side', async () => {
  tables.coupons = [coupon({ applicable_variant_ids: ['2088888'] })];
  const response = await validateCoupon(event({ code: 'welcome20', productKey: 'course_a2_1' }));
  const result = JSON.parse(response.body);
  const amount = Math.round(LEVEL_COURSES.course_a2_1.price * 100);
  assert.equal(response.statusCode, 200, response.body);
  assert.equal(result.ok, true, response.body);
  assert.equal(result.productKey, 'course_a2_1');
  assert.equal(result.discount, Math.round(amount * 0.2));
  assert.equal(result.final, amount - result.discount);
  assert.equal(result.checkoutUrl, undefined, 'numeric provider IDs must never become checkout UUIDs');
});

test('coupon minimum cannot be bypassed with an omitted or forged client amount', async () => {
  const amount = Math.round(PLANS.monthly.price * 100);
  tables.coupons = [coupon({ minimum_order_amount: amount + 1 })];
  for (const extra of [{}, { amountMinor: 999999, variantId: '2088888' }]) {
    const response = await validateCoupon(event({ code: 'WELCOME20', productKey: 'monthly', ...extra }));
    assert.equal(response.statusCode, 200, response.body);
    assert.equal(JSON.parse(response.body).reason, 'minimum_order');
  }
  assert.equal(evaluateCoupon(tables.coupons[0], {}).reason, 'minimum_order');
});

test('coupon products fail closed for unknown keys or checkout UUIDs in numeric variant config', async () => {
  const uuid = 'dfc81ca3-78f5-4bab-9d62-dca75b3f7e21';
  assert.equal(couponProduct('monthly', { LEMONSQUEEZY_MONTHLY_VARIANT_ID: uuid }), null);
  assert.equal(couponProduct('monthly', { LEMONSQUEEZY_MONTHLY_VARIANT_ID: '0' }), null);
  assert.equal(couponProduct('monthly', {}), null);
  assert.equal(couponProduct('course_a2', { LEMONSQUEEZY_COURSE_A2_VARIANT_ID: '2088888' }), null);
  assert.equal(couponProduct(['monthly'], process.env), null);
  const response = await validateCoupon(event({ code: 'WELCOME20', productKey: 'unknown', variantId: '1393033', amountMinor: 999999 }));
  assert.equal(response.statusCode, 400);
  assert.ok(!requests.some((request) => request.href.includes('/rest/v1/coupons')));
});

test('admin coupons reject non-string actions before capability checks and mutations', async () => {
  tables.profiles[0].role = 'auditor';
  for (const action of [['pause'], ['archive'], ['refund_adjustment'], null, 1, true, {}]) {
    requests = [];
    const response = await adminCoupons(event({ action, id: couponId, reason: 'test' }));
    assert.equal(response.statusCode, 400, `action=${JSON.stringify(action)}: ${response.body}`);
    assert.equal(requests.length, 0, 'invalid action must fail before selecting or checking a capability');
    assert.equal(tables.coupons[0].status, 'active');
  }
  const denied = await adminCoupons(event({ action: 'pause', id: couponId, reason: 'test' }));
  assert.equal(denied.statusCode, 403, denied.body);
  assert.equal(tables.coupons[0].status, 'active');
});

test('coupon form selects the product and checkout applies a code only to its validated offer', () => {
  const page = readFileSync(new URL('../src/pages/SubscriptionPage.jsx', import.meta.url), 'utf8');
  assert.match(page, /<CouponField\b[^>]*productKey=\{couponProduct\}/);
  assert.match(page, /<select\b[^>]*value=\{couponProduct\}/);
  const checkoutBlocks = [...page.matchAll(/const checkoutUrl = LEMONSQUEEZY_CONFIG\.getCheckoutUrl\([\s\S]*?\n {4}\);/g)];
  assert.equal(checkoutBlocks.length, 2);
  const applied = { code: 'WELCOME20', productKey: 'monthly' };
  const config = { getCheckoutUrl: (...args) => args.at(-1) };
  for (const [index, block] of checkoutBlocks.entries()) {
    const keyName = index === 0 ? 'planType' : 'productKey';
    const checkoutCoupon = new Function('checkoutConfig', keyName, 'plan', 'variantId', 'user', 'coupon', `${block[0].replace('LEMONSQUEEZY_CONFIG', 'checkoutConfig')} return checkoutUrl;`);
    assert.deepEqual(checkoutCoupon(config, 'monthly', { variantId: 'uuid' }, 'uuid', null, applied), applied);
    assert.equal(checkoutCoupon(config, 'yearly', { variantId: 'uuid' }, 'uuid', null, applied), null);
  }
});

test('expiry sweep clears course-contributed Pro when a recoverable recurring row was retained', async () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  tables.purchases = [{ user_id: userId, status: 'active', access_until: new Date(now).toISOString() }];
  for (const status of ['past_due', 'unpaid', 'paused', 'cancelled']) {
    tables.profiles[0].is_subscribed = true;
    tables.profiles[0].subscription_tier = 'pro';
    tables.subscriptions = [{ user_id: userId, status, plan_type: 'monthly', lemonsqueezy_subscription_id: 'old-sub', subscription_end: past }];
    await expireCourseWindows(supabase, now);
    assert.equal(tables.profiles[0].is_subscribed, false, status);
    assert.equal(tables.profiles[0].subscription_tier, 'free', status);
    assert.equal(tables.subscriptions[0].lemonsqueezy_subscription_id, 'old-sub', 'payment recovery still has its provider row');
    assert.equal(tables.purchases[0].status, 'active', 'lifetime ownership is preserved');
  }
});

test('expiry sweep preserves another course window and a real paid period', async () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  tables.purchases = [
    { user_id: userId, status: 'active', access_until: past },
    { user_id: userId, status: 'active', access_until: future },
  ];
  tables.subscriptions = [{ user_id: userId, status: 'unpaid', plan_type: 'monthly', lemonsqueezy_subscription_id: 'sub', subscription_end: past }];
  await expireCourseWindows(supabase, now);
  assert.equal(tables.profiles[0].is_subscribed, true);
  tables.purchases.pop();
  tables.subscriptions[0].status = 'active';
  tables.subscriptions[0].subscription_end = future;
  await expireCourseWindows(supabase, now);
  assert.equal(tables.profiles[0].is_subscribed, true);
  assert.equal(tables.subscriptions[0].subscription_end, future);
});

test('expiry sweep retries profile reconciliation after the course row already expired', async () => {
  tables.subscriptions = [{ user_id: userId, status: 'active', plan_type: 'course', subscription_end: past }];
  failProfileWrites = true;
  await assert.rejects(() => expireCourseWindows(supabase), { message: 'profile write failed' });
  assert.equal(tables.subscriptions[0].status, 'expired');
  assert.equal(tables.profiles[0].is_subscribed, true);
  failProfileWrites = false;
  const result = await expireCourseWindows(supabase);
  assert.equal(result.swept, 0);
  assert.equal(result.reconciled, 1);
  assert.equal(tables.profiles[0].is_subscribed, false);
});

test('expiry sweep pages through expired lifetime purchases and reconciles each owner once', async () => {
  const otherUser = '00000000-0000-0000-0000-000000000003';
  tables.profiles.push({ id: otherUser, is_subscribed: true, subscription_tier: 'pro' });
  tables.purchases = Array.from({ length: 1001 }, (_, index) => ({
    id: index, user_id: index < 1000 ? userId : otherUser, status: 'active', access_until: past,
  }));
  const result = await expireCourseWindows(supabase);
  assert.equal(result.reconciled, 2);
  assert.ok(tables.profiles.every((profile) => profile.is_subscribed === false));
  assert.ok(requests.some((request) => new URL(request.href).searchParams.get('offset') === '1000'));
});

test('expiry sweep includes failed subscriptions whose legacy retry date is still future', async () => {
  tables.subscriptions = [{ user_id: userId, status: 'unpaid', plan_type: 'monthly', lemonsqueezy_subscription_id: 'old-sub', subscription_end: future }];
  const result = await expireCourseWindows(supabase);
  assert.equal(result.reconciled, 1);
  assert.equal(tables.profiles[0].is_subscribed, false);
});
