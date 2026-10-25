import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { COURSE_PRO_DAYS, LEVEL_COURSES, MONTHLY_PRICE_EUR } from '../src/data/pricing.js';
import { hasRecurringBilling } from '../src/lib/checkoutAccess.js';
import { courseAccessUntil, subscriptionEventRow, subscriptionHasPaidAccess } from '../netlify/functions/_shared/subscriptionEntitlement.mjs';

process.env.SUPABASE_URL = 'http://supabase.entitlement.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID = '901';
process.env.LEMONSQUEEZY_COURSE_A2_2_VARIANT_ID = '902';
delete process.env.RESEND_API_KEY;

const USER = '00000000-0000-0000-0000-000000000001';
const RealDate = Date;
let now = RealDate.parse('2026-01-01T00:00:00Z');
class FixedDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
globalThis.Date = FixedDate;

let tables;
let failProfile;
let failLogWrites;
let grantPremiumBeforeProfileWrite;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.pathname === '/auth/v1/user') return json({ id: USER, email: 'learner@example.com' });
  assert.equal(u.host, 'supabase.entitlement.stub', 'the regression harness must never send email or contact a provider');
  const table = u.pathname.split('/').at(-1);
  const method = (init.method || 'GET').toUpperCase();
  const values = tables[table] || (tables[table] = []);
  const field = (row, name) => name.includes('->')
    ? name.split(/->>?/).reduce((value, key) => value?.[key], row) : row[name];
  const matches = (row) => [...u.searchParams].every(([key, value]) => {
    if (['select', 'order', 'limit', 'on_conflict'].includes(key)) return true;
    if (key === 'or') {
      assert.equal(value, '(subscription_tier.is.null,subscription_tier.neq.premium)');
      return row.subscription_tier == null || row.subscription_tier !== 'premium';
    }
    const actual = field(row, key);
    if (value.startsWith('eq.')) return String(actual) === value.slice(3);
    if (value.startsWith('neq.')) return String(actual) !== value.slice(4);
    if (value.startsWith('is.')) return value === 'is.null' && actual == null;
    if (value.startsWith('in.')) return value.slice(4, -1).split(',').includes(String(actual));
    throw new Error(`Unhandled filter ${key}=${value}`);
  });
  if (method === 'GET') {
    let rows = values.filter(matches);
    const order = u.searchParams.get('order');
    if (order) {
      rows = [...rows].sort((a, b) => {
        for (const part of order.split(',')) {
          const [key, direction] = part.split('.');
          const difference = String(field(a, key) || '').localeCompare(String(field(b, key) || '')) * (direction === 'desc' ? -1 : 1);
          if (difference) return difference;
        }
        return 0;
      });
    }
    if (u.searchParams.has('limit')) rows = rows.slice(0, Number(u.searchParams.get('limit')));
    return json(rows);
  }
  if (table === 'profiles' && failProfile) return json({ message: 'profile unavailable', code: 'XX000' }, 500);
  if (table === 'profiles' && grantPremiumBeforeProfileWrite) {
    Object.assign(values.find((row) => row.id === USER), { subscription_tier: 'premium', is_subscribed: true });
    grantPremiumBeforeProfileWrite = false;
  }
  if (table === 'webhook_logs' && failLogWrites) return json({ message: 'webhook log unavailable', code: 'XX000' }, 500);
  const body = JSON.parse(init.body);
  let changed = [];
  if (method === 'POST') {
    const conflict = u.searchParams.get('on_conflict');
    const previous = conflict ? values.find((row) => row[conflict] === body[conflict]) : null;
    const ignore = new Headers(init.headers).get('prefer')?.includes('resolution=ignore-duplicates');
    if (previous && !ignore) Object.assign(previous, body);
    if (!previous) values.push({ id: `${table}-${values.length + 1}`, created_at: new Date().toISOString(), ...body });
    changed = previous ? [previous] : [values.at(-1)];
  } else if (method === 'PATCH') {
    changed = values.filter(matches);
    changed.forEach((row) => Object.assign(row, body));
  } else {
    throw new Error(`Unhandled method ${method}`);
  }
  return new Headers(init.headers).get('prefer')?.includes('return=representation')
    ? json(changed) : new Response(null, { status: method === 'POST' ? 201 : 204 });
};

const { handler: webhook } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');
const { handler: verify } = await import('../netlify/functions/verify-subscription.mjs');
const { hasChargingSubscription } = await import('../netlify/functions/delete-account.mjs');
beforeEach(() => {
  now = RealDate.parse('2026-01-01T00:00:00Z');
  tables = { subscriptions: [], purchases: [], profiles: [], webhook_logs: [] };
  failProfile = false;
  failLogWrites = false;
  grantPremiumBeforeProfileWrite = false;
});
after(() => { globalThis.Date = RealDate; globalThis.fetch = originalFetch; });

function event(eventName, id, attributes) {
  return { meta: { event_name: eventName, custom_data: { user_id: USER } }, data: { id, attributes } };
}
function subscriptionEvent(eventName, overrides = {}, id = 'sub-1') {
  return event(eventName, id, {
    status: 'active', created_at: '2025-12-01T00:00:00Z', renews_at: '2026-02-01T00:00:00Z', variant_name: 'Pro Monthly', ...overrides,
  });
}
function orderEvent(eventName, id, createdAt, variantId = 901) {
  const product = LEVEL_COURSES[variantId === 901 ? 'course_a2_1' : 'course_a2_2'];
  return event(eventName, id, {
    status: eventName === 'order_refunded' ? 'refunded' : 'paid',
    created_at: createdAt,
    total: Math.round(product.price * 100),
    first_order_item: { variant_id: variantId, product_name: product.name },
  });
}
async function deliver(payload, expected = 200) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  const response = await webhook({ httpMethod: 'POST', headers: { 'x-signature': signature }, body });
  assert.equal(response.statusCode, expected, response.body);
  return response;
}
async function recover() {
  const response = await verify({ httpMethod: 'POST', headers: { authorization: 'Bearer stub-token' }, body: '{}' });
  assert.equal(response.statusCode, 200, response.body);
  return JSON.parse(response.body);
}
const profile = () => tables.profiles.find((row) => row.id === USER);
const subscription = () => tables.subscriptions.find((row) => row.user_id === USER);
const advance = (days) => { now += days * 24 * 60 * 60 * 1000; };

test('expired and unpaid fallback events never grant Pro, even with a future retry date', async () => {
  for (const status of ['expired', 'unpaid', 'past_due']) {
    tables.subscriptions = [];
    await deliver(subscriptionEvent('subscription_updated', { status }));
    assert.equal(profile().is_subscribed, false, status);
    assert.equal(profile().subscription_tier, 'free', status);
    assert.equal(subscription().subscription_end, null, 'no prior confirmed period exists');
  }
});

test('verification never manufactures a period from an expired or undated failed delivery', async () => {
  for (const status of ['expired', 'active']) {
    tables.subscriptions = [];
    tables.webhook_logs = [{ id: `log-${status}`, event_type: 'subscription_updated', processed: false,
      created_at: new Date().toISOString(), payload: subscriptionEvent('subscription_updated', { status, renews_at: null }) }];
    assert.equal((await recover()).status, 'not_found');
    assert.equal(profile().is_subscribed, false, status);
    assert.equal(subscription().subscription_end, null);
  }
});

test('verification does not mark an expired active row as subscribed', async () => {
  tables.subscriptions.push({ id: 'row-1', user_id: USER, status: 'active', plan_type: 'course', subscription_end: '2025-12-31T00:00:00Z' });
  assert.equal((await recover()).status, 'not_found');
  assert.equal(profile().is_subscribed, false);
});

test('verification cannot revive an older failed active snapshot after a processed expiry', async () => {
  tables.webhook_logs.push(
    { id: 'older', processed: false, event_type: 'subscription_created', created_at: '2025-12-01T00:00:00Z', payload: subscriptionEvent('subscription_created') },
    { id: 'latest', processed: true, event_type: 'subscription_expired', created_at: '2025-12-31T00:00:00Z', payload: subscriptionEvent('subscription_expired', { status: 'expired' }) },
  );
  assert.equal((await recover()).status, 'not_found');
  assert.equal(profile().is_subscribed, false);
});

test('provider timestamps prevent a late active replay from undoing a newer expiry', async () => {
  const initial = subscriptionEvent('subscription_created', { updated_at: '2025-12-01T00:00:00Z' });
  await deliver(initial);
  advance(10);
  await deliver(subscriptionEvent('subscription_expired', { status: 'expired', updated_at: '2026-01-11T00:00:00Z' }));
  advance(1);
  await deliver(initial);
  assert.equal(subscription().status, 'expired');
  assert.equal(profile().is_subscribed, false);
  tables.webhook_logs.at(-1).processed = false;
  assert.equal((await recover()).status, 'not_found');
  assert.equal(subscription().status, 'expired');
});

test('a subscription snapshot is retried when its durable webhook log cannot be written', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  failLogWrites = true;
  const expiry = subscriptionEvent('subscription_expired', { status: 'expired', updated_at: '2026-01-01T01:00:00Z' });
  await deliver(expiry, 500);
  assert.equal(profile().is_subscribed, false);
  failLogWrites = false;
  await deliver(expiry);
  assert.equal(tables.webhook_logs.at(-1).processed, true);
  assert.equal(subscription().status, 'expired');
});

test('verification repairs a legacy retry deadline using the last confirmed provider period', async () => {
  const initial = subscriptionEvent('subscription_created', { updated_at: '2025-12-01T00:00:00Z' });
  await deliver(initial);
  advance(35);
  subscription().status = 'past_due';
  subscription().subscription_end = '2026-02-15T00:00:00Z';
  profile().is_subscribed = true;
  assert.equal((await recover()).status, 'not_found');
  assert.equal(Date.parse(subscription().subscription_end), Date.parse(initial.data.attributes.renews_at));
  assert.equal(profile().is_subscribed, false);
});

test('an unconfirmed legacy past_due deadline cannot grant paid access', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'past_due',
    lemonsqueezy_subscription_id: 'sub-1', subscription_end: '2026-02-15T00:00:00Z' });
  assert.equal((await recover()).status, 'not_found');
  assert.equal(subscription().subscription_end, null);
  assert.equal(profile().is_subscribed, false);
});

test('failed renewals retain only the confirmed paid-through date across repeated retries', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  const paidThrough = subscription().subscription_end;
  advance(31);
  await deliver(subscriptionEvent('subscription_updated', { status: 'past_due', renews_at: '2026-02-08T00:00:00Z' }));
  assert.equal(subscription().subscription_end, paidThrough);
  assert.equal(profile().is_subscribed, false);
  advance(7);
  await deliver(subscriptionEvent('subscription_updated', { status: 'past_due', renews_at: '2026-02-15T00:00:00Z' }));
  assert.equal(subscription().subscription_end, paidThrough);
  assert.equal(profile().is_subscribed, false);
});

test('failed-payment grace never exceeds the last paid-through date', () => {
  const prior = { user_id: USER, plan_type: 'monthly', status: 'active', lemonsqueezy_subscription_id: 'sub-1', subscription_end: '2026-02-01T00:00:00Z' };
  for (const status of ['past_due', 'paused']) {
    const row = subscriptionEventRow(prior, subscriptionEvent('subscription_updated', { status, renews_at: '2026-03-01T00:00:00Z' }).data, 'subscription_updated', now);
    assert.equal(Date.parse(row.subscription_end), Date.parse(prior.subscription_end));
    assert.equal(subscriptionHasPaidAccess(row, now), true);
    assert.equal(subscriptionHasPaidAccess(row, Date.parse(prior.subscription_end)), false);
  }
});

test('successful active recovery restores profile flags and retries profile synchronization failures', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  advance(31);
  await deliver(subscriptionEvent('subscription_updated', { status: 'past_due', renews_at: '2026-02-08T00:00:00Z' }));
  assert.equal(profile().is_subscribed, false);
  failProfile = true;
  const recovery = subscriptionEvent('subscription_updated', { status: 'active', renews_at: '2026-03-01T00:00:00Z' });
  await deliver(recovery, 500);
  assert.equal(tables.webhook_logs.at(-1).processed, false);
  failProfile = false;
  await deliver(recovery);
  assert.equal(profile().is_subscribed, true);
  assert.equal(profile().subscription_tier, 'pro');
});

test('successful invoice delivery reconciles a live subscription without inventing a new period', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  profile().is_subscribed = false;
  profile().subscription_tier = 'free';
  const paidThrough = subscription().subscription_end;
  await deliver(event('subscription_payment_success', 'invoice-1', { subscription_id: 'sub-1', status: 'paid', total: Math.round(MONTHLY_PRICE_EUR * 100) }));
  assert.equal(profile().is_subscribed, true);
  assert.equal(profile().subscription_tier, 'pro');
  assert.equal(subscription().subscription_end, paidThrough);
});

test('invoice and expiry reconciliation preserve an explicit admin premium grant', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  profile().subscription_tier = 'premium';
  profile().is_subscribed = false;
  await deliver(event('subscription_payment_success', 'invoice-1', { subscription_id: 'sub-1', status: 'paid', total: Math.round(MONTHLY_PRICE_EUR * 100) }));
  assert.equal(profile().subscription_tier, 'premium');
  assert.equal(profile().is_subscribed, true);
  advance(32);
  await deliver(subscriptionEvent('subscription_expired', { status: 'expired', updated_at: new Date().toISOString() }));
  assert.equal(profile().subscription_tier, 'premium');
  assert.equal(profile().is_subscribed, true);
});

test('reconciliation updates a legacy profile with a null subscription tier', async () => {
  tables.profiles.push({ id: USER, subscription_tier: null, is_subscribed: false });
  await deliver(subscriptionEvent('subscription_created'));
  assert.equal(profile().subscription_tier, 'pro');
  assert.equal(profile().is_subscribed, true);
});

test('reconciliation cannot overwrite a premium grant made after its profile read', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  grantPremiumBeforeProfileWrite = true;
  await deliver(event('subscription_payment_success', 'invoice-1', { subscription_id: 'sub-1', status: 'paid', total: Math.round(MONTHLY_PRICE_EUR * 100) }));
  assert.equal(profile().subscription_tier, 'premium');
  assert.equal(profile().is_subscribed, true);
});

test('legacy course reconciliation preserves an overdue recurring identity and derives Pro from the purchase', async () => {
  tables.purchases.push({ user_id: USER, status: 'active', product_key: 'course_a2_1', lemonsqueezy_order_id: 'course-1',
    access_until: '2026-04-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' });
  tables.subscriptions.push({ user_id: USER, plan_type: 'course', status: 'active',
    lemonsqueezy_subscription_id: 'sub-1', lemonsqueezy_order_id: 'course-1',
    subscription_start: '2026-01-01T00:00:00Z', subscription_end: '2026-04-01T00:00:00Z' });
  tables.webhook_logs.push({ id: 'past-due', processed: true, event_type: 'subscription_updated',
    created_at: '2025-12-31T00:00:00Z', payload: subscriptionEvent('subscription_updated', {
      status: 'past_due', updated_at: '2025-12-31T00:00:00Z', renews_at: '2026-01-08T00:00:00Z',
    }) });
  assert.equal((await recover()).status, 'active');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().subscription_end, null, 'the course deadline is not a recurring paid period');
  assert.equal(profile().is_subscribed, true, 'the independent purchase window grants included Pro');
  advance(91);
  assert.equal((await recover()).status, 'not_found');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(profile().is_subscribed, false);
  await deliver(subscriptionEvent('subscription_updated', {
    updated_at: new Date().toISOString(), renews_at: '2026-05-01T00:00:00Z',
  }));
  assert.equal(subscription().status, 'active');
  assert.equal(profile().is_subscribed, true);
});

test('a recovery newer than course installation wins even for a previously superseded recurring id', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'expired',
    lemonsqueezy_subscription_id: 'sub-1', subscription_start: '2025-12-01T00:00:00Z', subscription_end: '2025-12-31T00:00:00Z' });
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  advance(1);
  await deliver(subscriptionEvent('subscription_updated', {
    updated_at: new Date().toISOString(), renews_at: '2026-06-01T00:00:00Z',
  }));
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  advance(COURSE_PRO_DAYS + 1);
  assert.equal((await recover()).status, 'active');
  assert.equal(profile().is_subscribed, true);
});

test('a legacy retirement marker cannot hide a recovery newer than the installed course window', async () => {
  tables.purchases.push({ user_id: USER, status: 'active', product_key: 'course_a2_1', lemonsqueezy_order_id: 'course-1',
    access_until: '2026-04-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' });
  tables.subscriptions.push({ user_id: USER, plan_type: 'course', status: 'active',
    lemonsqueezy_subscription_id: null, subscription_start: '2026-01-01T00:00:00Z', subscription_end: '2026-04-01T00:00:00Z' });
  tables.webhook_logs.push({ id: 'legacy-marker', processed: true, event_type: 'subscription_superseded',
    created_at: '2026-01-10T00:00:00Z', payload: { data: { id: 'sub-1' } } });
  advance(20);
  await deliver(subscriptionEvent('subscription_updated', {
    updated_at: '2026-01-02T00:00:00Z', renews_at: '2026-06-01T00:00:00Z',
  }));
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  advance(COURSE_PRO_DAYS);
  assert.equal((await recover()).status, 'active');
});

test('a legacy course without provider snapshots accepts a newer active recovery after course expiry', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'course', status: 'active',
    lemonsqueezy_subscription_id: 'sub-1', subscription_start: '2025-01-01T00:00:00Z', subscription_end: '2025-04-01T00:00:00Z' });
  await deliver(subscriptionEvent('subscription_updated', { updated_at: new Date().toISOString() }));
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(profile().is_subscribed, true);
});

test('legacy course rows retain an unknown recurring identity without granting it an unconfirmed period', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'course', status: 'active',
    lemonsqueezy_subscription_id: 'sub-1', subscription_start: '2025-01-01T00:00:00Z', subscription_end: '2025-04-01T00:00:00Z' });
  assert.equal((await recover()).status, 'not_found');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(profile().is_subscribed, false);
  await deliver(subscriptionEvent('subscription_updated', { updated_at: '2024-12-31T00:00:00Z' }));
  assert.equal((await recover()).status, 'not_found', 'a logged stale active replay must also remain ignored');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(profile().is_subscribed, false);
});

test('an old recurring expiry or update cannot modify a newer course window', async () => {
  await deliver(subscriptionEvent('subscription_created', { status: 'expired', renews_at: null }));
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  const end = subscription().subscription_end;
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
  for (const eventName of ['subscription_expired', 'subscription_updated', 'subscription_created']) {
    await deliver(subscriptionEvent(eventName, { status: 'expired', renews_at: null }));
    assert.equal(subscription().plan_type, 'course');
    assert.equal(subscription().subscription_end, end);
    assert.equal(profile().is_subscribed, true);
  }
});

test('an older recurring replay stays retired even if its terminal delivery log was absent', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'expired',
    lemonsqueezy_subscription_id: 'sub-1', subscription_start: '2025-12-01T00:00:00Z', subscription_end: '2025-12-31T00:00:00Z' });
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  assert.ok(tables.webhook_logs.some((row) => row.event_type === 'subscription_superseded' && row.payload.data.id === 'sub-1'));
  const end = subscription().subscription_end;
  advance(1);
  await deliver(subscriptionEvent('subscription_updated', { updated_at: '2025-12-31T00:00:00Z' }));
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().subscription_end, end);
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
  assert.equal(profile().is_subscribed, true);
});

test('legacy course rows retire their obsolete recurring id before an active replay can replace them', async () => {
  tables.purchases.push({ user_id: USER, status: 'active', product_key: 'course_a2_1', lemonsqueezy_order_id: 'course-1',
    access_until: '2026-04-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' });
  tables.subscriptions.push({ user_id: USER, plan_type: 'course', status: 'active',
    lemonsqueezy_subscription_id: 'sub-1', lemonsqueezy_order_id: 'course-1',
    subscription_start: '2026-01-01T00:00:00Z', subscription_end: '2026-04-01T00:00:00Z' });
  tables.webhook_logs.push({ id: 'terminal', processed: true, event_type: 'subscription_expired', created_at: '2025-12-31T00:00:00Z',
    payload: subscriptionEvent('subscription_expired', { status: 'expired', updated_at: '2025-12-31T00:00:00Z' }) });
  await deliver(subscriptionEvent('subscription_created', { renews_at: '2026-12-01T00:00:00Z' }));
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
  assert.equal(Date.parse(subscription().subscription_end), Date.parse(tables.purchases[0].access_until));
  assert.ok(tables.webhook_logs.some((row) => row.event_type === 'subscription_superseded'));
  assert.equal(profile().is_subscribed, true);
});

test('an expired legacy course row retires its obsolete recurring id without a remaining purchase window', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'course', status: 'expired',
    lemonsqueezy_subscription_id: 'sub-1', subscription_start: '2025-01-01T00:00:00Z', subscription_end: '2025-04-01T00:00:00Z' });
  tables.webhook_logs.push({ id: 'terminal', processed: true, event_type: 'subscription_expired', created_at: '2024-12-31T00:00:00Z',
    payload: subscriptionEvent('subscription_expired', { status: 'expired', updated_at: '2024-12-31T00:00:00Z' }) });
  await deliver(subscriptionEvent('subscription_updated', { updated_at: '2024-12-31T00:00:00Z' }));
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
  assert.equal(subscription().status, 'expired');
  assert.equal(profile().is_subscribed, false);
});

test('a course predating a recurring plan is preserved after that plan expires and replays', async () => {
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  advance(10);
  const recurring = subscriptionEvent('subscription_created', {
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), renews_at: '2026-02-11T00:00:00Z',
  });
  await deliver(recurring);
  assert.equal(subscription().plan_type, 'monthly');
  advance(10);
  await deliver(subscriptionEvent('subscription_expired', {
    status: 'expired', created_at: recurring.data.attributes.created_at, updated_at: new Date().toISOString(),
  }));
  const courseStart = subscription().subscription_start;
  const courseEnd = subscription().subscription_end;
  assert.equal(subscription().plan_type, 'course');
  assert.equal(courseStart, tables.purchases[0].created_at, 'the source purchase keeps its original start');
  advance(1);
  await deliver(recurring);
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().subscription_start, courseStart);
  assert.equal(subscription().subscription_end, courseEnd);
  assert.equal(profile().is_subscribed, true);
});

test('reconciling a course does not move its start past a legitimate new recurring checkout', async () => {
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  advance(1);
  const createdAt = new Date().toISOString();
  advance(1);
  assert.equal((await recover()).status, 'active');
  await deliver(subscriptionEvent('subscription_created', { created_at: createdAt, updated_at: createdAt }));
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
});

test('a delayed new active subscription is accepted after a course refund selects an older purchase', async () => {
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  advance(20);
  const createdAt = new Date().toISOString();
  advance(10);
  await deliver(orderEvent('order_created', 'course-2', new Date().toISOString(), 902));
  advance(15);
  await deliver(orderEvent('order_refunded', 'course-2', '2026-01-31T00:00:00Z', 902));
  assert.equal(subscription().lemonsqueezy_order_id, 'course-1');
  await deliver(subscriptionEvent('subscription_updated', {
    created_at: createdAt, updated_at: createdAt, renews_at: '2026-03-01T00:00:00Z',
  }, 'new-sub'));
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'new-sub');
  assert.equal(profile().is_subscribed, true);
});

test('refunding the newest course preserves another unrefunded course window', async () => {
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  const firstEnd = subscription().subscription_end;
  advance(30);
  await deliver(orderEvent('order_created', 'course-2', new Date().toISOString(), 902));
  assert.ok(Date.parse(subscription().subscription_end) > Date.parse(firstEnd));
  advance(15);
  await deliver(orderEvent('order_refunded', 'course-2', '2026-01-31T00:00:00Z', 902));
  assert.equal(subscription().subscription_end, firstEnd);
  assert.equal(subscription().lemonsqueezy_order_id, 'course-1');
  assert.equal(profile().is_subscribed, true);
  assert.equal(tables.purchases.find((row) => row.lemonsqueezy_order_id === 'course-2').status, 'refunded');
});

test('a course refund preserves current recurring access', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  assert.equal(subscription().plan_type, 'monthly');
  await deliver(orderEvent('order_refunded', 'course-1', new Date().toISOString()));
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(profile().is_subscribed, true);
});

test('replaying a fulfilled course order keeps its original window and cannot reactivate expired Pro', async () => {
  const order = orderEvent('order_created', 'course-1', new Date().toISOString());
  await deliver(order);
  const original = tables.purchases[0].access_until;
  advance(COURSE_PRO_DAYS + 1);
  await deliver(order);
  assert.equal(tables.purchases.length, 1);
  assert.equal(tables.purchases[0].access_until, original);
  assert.equal(subscription().subscription_end, original);
  assert.equal(profile().is_subscribed, false);
});

test('a replay completes failed provisioning without extending the first purchase window', async () => {
  const order = orderEvent('order_created', 'course-1', new Date().toISOString());
  failProfile = true;
  await deliver(order, 500);
  const original = tables.purchases[0].access_until;
  advance(10);
  failProfile = false;
  await deliver(order);
  assert.equal(tables.purchases[0].access_until, original);
  assert.equal(subscription().subscription_end, original);
  assert.equal(profile().is_subscribed, true);
});

test('a purchase during past_due retains the recoverable recurring id and its independent course deadline', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  advance(31);
  await deliver(subscriptionEvent('subscription_updated', { status: 'past_due', renews_at: '2026-02-08T00:00:00Z' }));
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  assert.equal(profile().is_subscribed, true);
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.ok(tables.purchases[0].access_until);
  await deliver(subscriptionEvent('subscription_updated', { status: 'active', renews_at: '2026-03-01T00:00:00Z' }));
  assert.equal(subscription().status, 'active');
  assert.equal(profile().subscription_tier, 'pro');
});

test('legacy null course deadlines are recovered from the original purchase date', () => {
  const purchase = { created_at: '2025-01-01T00:00:00Z', access_until: null };
  const end = courseAccessUntil(purchase, { created_at: '2026-01-01T00:00:00Z' }, COURSE_PRO_DAYS, now);
  assert.equal(end, new Date(Date.parse(purchase.created_at) + COURSE_PRO_DAYS * 24 * 60 * 60 * 1000).toISOString());
  assert.ok(Date.parse(end) < now);
});

// X-002: a cancellation delivered before its subscription_created.
test('a cancellation that arrives before its creation still installs the newly paid subscription until ends_at', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'expired', lemonsqueezy_subscription_id: 'sub-old',
    subscription_start: '2025-06-01T00:00:00Z', subscription_end: '2025-07-01T00:00:00Z' });
  const created = { created_at: '2025-12-31T00:00:00Z', updated_at: '2025-12-31T00:00:00Z', renews_at: '2026-01-31T00:00:00Z' };
  const cancelled = { ...created, status: 'cancelled', cancelled: true, ends_at: '2026-01-31T00:00:00Z', updated_at: '2025-12-31T12:00:00Z' };
  await deliver(subscriptionEvent('subscription_cancelled', cancelled, 'sub-new'));
  await deliver(subscriptionEvent('subscription_updated', cancelled, 'sub-new'));
  await deliver(subscriptionEvent('subscription_created', created, 'sub-new'));
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-new');
  assert.equal(subscription().status, 'cancelled');
  assert.equal(Date.parse(subscription().subscription_end), Date.parse(cancelled.ends_at));
  assert.equal(profile().is_subscribed, true, 'a cancelled subscription is paid through ends_at');
});

test('a cancelled newer subscription whose paid period is over never replaces a live one', async () => {
  await deliver(subscriptionEvent('subscription_created'));
  await deliver(subscriptionEvent('subscription_cancelled', {
    status: 'cancelled', created_at: '2025-12-15T00:00:00Z', updated_at: '2025-12-20T00:00:00Z', ends_at: '2025-12-31T00:00:00Z',
  }, 'sub-2'));
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-1');
  assert.equal(subscription().status, 'active');
  assert.equal(profile().is_subscribed, true);
});

// C-019: a subscription bought before a course purchase whose creation event arrives late.
test('a delayed subscription_created for a subscription bought before a course purchase still installs it', async () => {
  // 00:00 — S2 is bought; its subscription_created delivery fails before anything is written.
  const s2 = subscriptionEvent('subscription_created', {
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', renews_at: '2026-02-01T00:00:00Z',
  }, 'sub-2');
  tables.webhook_logs.push({ id: 'failed-s2', event_type: 'subscription_created', processed: false, error: 'transient',
    created_at: '2026-01-01T00:00:05Z', payload: s2 });
  // 01:00 — a course order installs the course row.
  now = RealDate.parse('2026-01-01T01:00:00Z');
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  assert.equal(subscription().plan_type, 'course');
  // 03:00 — Lemon Squeezy retries S2's creation.
  now = RealDate.parse('2026-01-01T03:00:00Z');
  await deliver(s2);
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-2', 'the billing subscription is on record');
  assert.equal(subscription().plan_type, 'monthly');
  assert.equal(hasRecurringBilling(subscription(), now), true, 'the portal, not a second checkout');
  assert.equal(profile().is_subscribed, true);
  // The course window is independent: when S2 ends, the course row returns until its own deadline.
  now = RealDate.parse('2026-02-02T00:00:00Z');
  await deliver(subscriptionEvent('subscription_expired', { status: 'expired', created_at: '2026-01-01T00:00:00Z', updated_at: new Date().toISOString() }, 'sub-2'));
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().subscription_end, tables.purchases[0].access_until);
  assert.equal(profile().is_subscribed, true);
});

test('a recorded superseded subscription stays retired behind the course row (the timestamp guard is kept for it)', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'expired', lemonsqueezy_subscription_id: 'sub-1',
    subscription_start: '2025-12-01T00:00:00Z', subscription_end: '2025-12-31T00:00:00Z' });
  await deliver(orderEvent('order_created', 'course-1', new Date().toISOString()));
  advance(1);
  await deliver(subscriptionEvent('subscription_updated', { updated_at: '2025-12-20T00:00:00Z', renews_at: '2026-06-01T00:00:00Z' }));
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
});

// X-005: purchases stored with access_until = null before 2026-10-22.
test('a legacy provider purchase without a stored deadline keeps its included Pro when the subscription ends', async () => {
  tables.purchases.push({ id: 'p-legacy', user_id: USER, status: 'active', product_key: 'course_a2_1', lemonsqueezy_order_id: 'legacy-order',
    access_until: null, created_at: '2025-12-15T00:00:00Z' });
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'active', lemonsqueezy_subscription_id: 'sub-1',
    subscription_start: '2025-12-01T00:00:00Z', subscription_end: '2026-01-01T00:00:00Z' });
  await deliver(subscriptionEvent('subscription_expired', { status: 'expired', updated_at: new Date().toISOString() }));
  const deadline = new Date(RealDate.parse('2025-12-15T00:00:00Z') + COURSE_PRO_DAYS * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(deadline, '2026-03-15T00:00:00.000Z');
  assert.equal(tables.purchases[0].access_until, deadline, 'the deadline is stored from the purchase date, never from now');
  assert.equal(subscription().plan_type, 'course');
  assert.equal(subscription().subscription_end, deadline);
  assert.equal(profile().is_subscribed, true);
});

// Round-2 review (HIGH): a complimentary grant never hides a still-billing subscription.
const manualGrant = (start, days) => ({ user_id: USER, plan_type: 'monthly', status: 'active', price_paid: 0, lemonsqueezy_subscription_id: null,
  subscription_start: start, subscription_end: new Date(RealDate.parse(start) + days * 24 * 60 * 60 * 1000).toISOString() });
function paidSubscriptionWhoseCreationFailed() {
  const created = subscriptionEvent('subscription_created', {
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', renews_at: '2026-02-01T00:00:00Z',
  }, 'sub-paid');
  tables.webhook_logs.push({ id: 'failed-created', event_type: 'subscription_created', processed: false, error: 'transient',
    created_at: '2026-01-01T00:00:05Z', payload: created });
  return created;
}

test('a paid subscription retried after support granted Pro days is recorded: billing visible, deletion blocked', async () => {
  const created = paidSubscriptionWhoseCreationFailed();
  // 02:00 — "I paid but have no access": support grants seven Pro days.
  now = RealDate.parse('2026-01-01T02:00:00Z');
  tables.subscriptions.push(manualGrant(new Date().toISOString(), 7));
  tables.profiles.push({ id: USER, subscription_tier: 'pro', is_subscribed: true });
  // 03:00 — Lemon Squeezy retries the creation, which predates the grant.
  now = RealDate.parse('2026-01-01T03:00:00Z');
  await deliver(created);
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-paid', 'the billing subscription is on record');
  assert.equal(subscription().status, 'active');
  assert.equal(Date.parse(subscription().subscription_end), RealDate.parse('2026-02-01T00:00:00Z'));
  assert.equal(hasRecurringBilling(subscription(), now), true, 'billing management sees it — never a second checkout');
  assert.equal(hasChargingSubscription([subscription()]), true, 'delete-account answers 409 while it can charge');
  assert.equal(profile().is_subscribed, true);
  assert.deepEqual(tables.purchases, [], 'the paid period covers the whole grant: nothing to keep apart');
});

test('a grant that outlasts the paid period keeps its remainder as a window, which survives the plan ending early', async () => {
  const created = paidSubscriptionWhoseCreationFailed();
  now = RealDate.parse('2026-01-01T02:00:00Z');
  const grant = manualGrant(new Date().toISOString(), 60);
  const grantEnd = grant.subscription_end; // the harness upserts rows in place
  tables.subscriptions.push(grant);
  now = RealDate.parse('2026-01-01T03:00:00Z');
  await deliver(created);
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-paid');
  const [kept] = tables.purchases;
  assert.equal(kept.access_until, grantEnd, 'the complimentary remainder is kept');
  assert.equal(kept.status, 'active');
  assert.equal(kept.price_paid, 0);
  assert.match(kept.lemonsqueezy_order_id, /^manual-/);
  assert.deepEqual(LEVEL_COURSES[kept.product_key], undefined, 'the kept window is no course: it opens no level');
  // The plan ends early (a refund): the complimentary days still hold.
  now = RealDate.parse('2026-01-10T00:00:00Z');
  await deliver(subscriptionEvent('subscription_expired', { status: 'expired', created_at: '2026-01-01T00:00:00Z', updated_at: new Date().toISOString() }, 'sub-paid'));
  assert.equal(profile().is_subscribed, true);
  assert.equal(Date.parse(subscription().subscription_end), Date.parse(grantEnd));
});

test('a provider event with nothing to track (an old expired subscription) leaves a live grant alone', async () => {
  tables.subscriptions.push(manualGrant('2025-12-31T00:00:00Z', 30));
  await deliver(subscriptionEvent('subscription_expired', { status: 'expired', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-12-31T12:00:00Z' }, 'sub-old'));
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
  assert.equal(subscription().status, 'active');
  assert.equal(profile().is_subscribed, true);
  assert.deepEqual(tables.purchases, []);
});

test('a manual course grant without a deadline stays deadline-free and grants no Pro', async () => {
  tables.purchases.push({ id: 'p-manual', user_id: USER, status: 'active', product_key: 'course_a2_1', lemonsqueezy_order_id: 'manual-1760000000000-course_a2_1',
    access_until: null, created_at: '2025-12-15T00:00:00Z' });
  assert.equal((await recover()).status, 'not_found');
  assert.equal(tables.purchases[0].access_until, null);
  assert.equal(profile().is_subscribed, false);
});
