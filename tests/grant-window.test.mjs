// A kept Pro-day grant window ('pro_days' purchases row) is a time-limited
// grant: staff can end it, and it never acts as a bought course.
//
// When a paid subscription takes the one subscriptions row from an admin
// Pro-day grant, the rest of the grant is kept as a purchases window
// (subscriptionEntitlement keepGrantWindow). Round-2 re-check found two holes:
//   1. "Manuellen Zugang beenden" (revoke_manual_access) only saw manual
//      subscriptions rows, so a kept window could not be ended (409).
//   2. Account entry and the Astro Upgrade chip read "any active purchase" as
//      owning a course, so an expired window opened the account screens and
//      hid Upgrade for ever.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { GRANT_WINDOW_PRODUCT as CLIENT_PRODUCT, ownedPurchases } from '../src/data/pricing.js';
import { canEnterAccount } from '../src/lib/accountAccess.js';

process.env.SUPABASE_URL = 'http://supabase.grant-window.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';

const ADMIN = '00000000-0000-0000-0000-0000000000ad';
const USER = '00000000-0000-0000-0000-000000000001';
const future = '2999-01-01T00:00:00Z';
const past = '2025-01-01T00:00:00Z';
let tables;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function matches(row, params) {
  return [...params].every(([key, value]) => {
    if (['select', 'order', 'limit', 'on_conflict'].includes(key)) return true;
    if (key === 'or') return row.subscription_tier == null || row.subscription_tier !== 'premium';
    if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
    if (value === 'is.null') return row[key] == null;
    if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(row[key]));
    throw new Error(`unhandled filter ${key}=${value}`);
  });
}
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.pathname === '/auth/v1/user') return json({ id: ADMIN });
  assert.equal(u.host, 'supabase.grant-window.stub', 'the harness contacts nothing else');
  const table = u.pathname.split('/').at(-1);
  const method = (init.method || 'GET').toUpperCase();
  const rows = (tables[table] ||= []);
  const representation = new Headers(init.headers).get('prefer')?.includes('return=representation');
  if (method === 'GET') return json(rows.filter((row) => matches(row, u.searchParams)));
  const body = JSON.parse(init.body);
  if (method === 'POST') {
    const conflict = u.searchParams.get('on_conflict');
    const prior = conflict && rows.find((row) => row[conflict] === body[conflict]);
    if (prior) Object.assign(prior, body); else rows.push({ id: `${table}-${rows.length + 1}`, ...body });
    return representation ? json([prior || rows.at(-1)], 201) : new Response(null, { status: 201 });
  }
  if (method === 'PATCH') {
    const changed = rows.filter((row) => matches(row, u.searchParams));
    changed.forEach((row) => Object.assign(row, body));
    return representation ? json(changed) : new Response(null, { status: 204 });
  }
  throw new Error(`unhandled ${method}`);
};

const { handler } = await import('../netlify/functions/admin-actions.mjs');
const { GRANT_WINDOW_PRODUCT: SERVER_PRODUCT } = await import('../netlify/functions/_shared/subscriptionEntitlement.mjs');

const grantWindow = (patch = {}) => ({ id: 'p-grant', user_id: USER, product_key: 'pro_days', lemonsqueezy_order_id: `manual-grant-${USER}-1767232800000`,
  price_paid: 0, status: 'active', access_until: future, created_at: '2026-01-01T02:00:00Z', ...patch });
const paidSubscription = { id: 'row', user_id: USER, plan_type: 'monthly', status: 'active', price_paid: 9.99, lemonsqueezy_subscription_id: 'sub-paid',
  subscription_start: '2026-01-01T00:00:00Z', subscription_end: future };

beforeEach(() => {
  tables = {
    profiles: [{ id: ADMIN, role: 'admin', email: 'staff@deutsch-meister.de' }, { id: USER, email: 'learner@example.com', is_subscribed: true, subscription_tier: 'pro' }],
    subscriptions: [],
    purchases: [],
    admin_audit_log: [],
    webhook_logs: [],
  };
});
const revoke = () => handler({ httpMethod: 'POST', path: '/stub', headers: { authorization: 'Bearer staff-jwt' },
  body: JSON.stringify({ action: 'revoke_manual_access', userId: USER, reason: 'Kulanz beendet' }) });
const learner = () => tables.profiles.find((p) => p.id === USER);

test('ending manual access ends a kept Pro-day window and the course row derived from it', async () => {
  tables.purchases = [grantWindow()];
  // The paid plan ended first: reconciliation shows the window as a course row.
  tables.subscriptions = [{ id: 'row', user_id: USER, plan_type: 'course', status: 'active', price_paid: 0, lemonsqueezy_subscription_id: null,
    lemonsqueezy_order_id: grantWindow().lemonsqueezy_order_id, subscription_start: '2026-01-01T02:00:00Z', subscription_end: future }];
  const res = await revoke();
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(tables.purchases[0].status, 'refunded');
  assert.equal(tables.subscriptions[0].status, 'expired', 'the derived row is retired by reconciliation');
  assert.equal(learner().is_subscribed, false);
  assert.equal(learner().subscription_tier, 'free');
});

test('ending manual access never touches a live paid subscription or a bought course', async () => {
  const course = { id: 'p-course', user_id: USER, product_key: 'course_a2_1', lemonsqueezy_order_id: '880001', price_paid: 40, status: 'active', access_until: future, created_at: past };
  tables.purchases = [grantWindow(), course];
  tables.subscriptions = [{ ...paidSubscription }];
  const res = await revoke();
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(tables.purchases.find((p) => p.id === 'p-grant').status, 'refunded');
  assert.equal(tables.purchases.find((p) => p.id === 'p-course').status, 'active');
  assert.deepEqual(tables.subscriptions[0], paidSubscription, 'the provider billing row is unchanged');
  assert.equal(learner().is_subscribed, true, 'the paid plan still gives Pro');
});

test('with neither a manual row nor a live kept window there is nothing to end (409)', async () => {
  tables.purchases = [grantWindow({ access_until: past })];
  assert.equal((await revoke()).statusCode, 409);
});

test('a kept grant window is no bought product: account entry and Upgrade follow its access_until only', () => {
  assert.equal(CLIENT_PRODUCT, SERVER_PRODUCT, 'server and client name the kept window the same');
  const expired = [{ product_key: 'pro_days', status: 'active', access_until: past }];
  assert.deepEqual(ownedPurchases(expired), []);
  assert.equal(canEnterAccount({ hasAccess: false, purchases: expired }), false, 'an expired window opens no account screen');
  assert.equal(canEnterAccount({ hasAccess: true, purchases: expired }), true, 'a live window opens it through hasAccess');
  assert.equal(canEnterAccount({ hasAccess: false, purchases: [{ product_key: 'course_a2_1', status: 'active' }] }), true, 'a bought course still does');
  // Astro: the Upgrade chip and the course home read owned purchases; Pro reads every live window.
  const layout = readFileSync(new URL('../astro-site/src/layouts/Layout.astro', import.meta.url), 'utf8');
  const owned = layout.match(/const activePurchases = purchases\.filter\(\(purchase\) => purchase\.status === 'active' && purchase\.product_key !== '([a-z_]+)'\);/);
  assert.ok(owned, 'the Upgrade chip and course home read owned purchases only');
  assert.equal(owned[1], CLIENT_PRODUCT, 'the Astro literal is the shared grant-window product');
  assert.match(layout, /purchases\.some\(\(purchase\) => purchase\.status === 'active' && Date\.parse\(purchase\.access_until\) > now\)/);
  assert.match(readFileSync(new URL('../src/pages/SubscriptionSuccessPage.jsx', import.meta.url), 'utf8'), /ownedPurchases\(purchases\)/, 'a kept window is never "just bought"');
});
