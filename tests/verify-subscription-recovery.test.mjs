// "Verify my subscription" recovers the newest subscription that still has a
// failed (unprocessed) delivery, not just the user's single newest event.
//
// The failure this pins (X-006): subscription B's subscription_created failed to
// save (logged processed=false). Afterwards a late expiry of the user's OLD
// subscription A was processed. verify-subscription read only the newest
// snapshot across all of the user's subscriptions (.limit(1)) — A's processed
// expiry — and answered not_found, although B's paid creation was recoverable.
// Now the newest row PER subscription id decides; an older failed snapshot of
// the same subscription behind a processed terminal event still stays retired.
// Behavioural: the real verify handler over an in-memory PostgREST stub.

import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'http://supabase.verify.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';

const USER = '00000000-0000-0000-0000-000000000001';
const RealDate = Date;
const now = RealDate.parse('2026-01-01T01:00:00Z');
class FixedDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
}
globalThis.Date = FixedDate;

let tables;
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const field = (row, name) => (name.includes('->') ? name.split(/->>?/).reduce((value, key) => value?.[key], row) : row[name]);
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.pathname === '/auth/v1/user') return json({ id: USER, email: 'learner@example.com' });
  assert.equal(u.host, 'supabase.verify.stub', 'the harness contacts nothing else');
  const table = u.pathname.split('/').at(-1);
  const method = (init.method || 'GET').toUpperCase();
  const values = tables[table] || (tables[table] = []);
  const matches = (row) => [...u.searchParams].every(([key, value]) => {
    if (['select', 'order', 'limit', 'on_conflict'].includes(key)) return true;
    if (key === 'or') return row.subscription_tier == null || row.subscription_tier !== 'premium';
    const actual = field(row, key);
    if (value.startsWith('eq.')) return String(actual) === value.slice(3);
    if (value.startsWith('neq.')) return String(actual) !== value.slice(4);
    if (value === 'is.null') return actual == null;
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
  const body = JSON.parse(init.body);
  let changed = [];
  if (method === 'POST') {
    const conflict = u.searchParams.get('on_conflict');
    const previous = conflict ? values.find((row) => row[conflict] === body[conflict]) : null;
    if (previous && !new Headers(init.headers).get('prefer')?.includes('resolution=ignore-duplicates')) Object.assign(previous, body);
    if (!previous) values.push({ id: `${table}-${values.length + 1}`, created_at: new Date().toISOString(), ...body });
    changed = previous ? [previous] : [values.at(-1)];
  } else if (method === 'PATCH') {
    changed = values.filter(matches);
    changed.forEach((row) => Object.assign(row, body));
  }
  return new Headers(init.headers).get('prefer')?.includes('return=representation')
    ? json(changed) : new Response(null, { status: method === 'POST' ? 201 : 204 });
};

const { handler: verify } = await import('../netlify/functions/verify-subscription.mjs');
const { hasChargingSubscription } = await import('../netlify/functions/delete-account.mjs');
beforeEach(() => { tables = { subscriptions: [], purchases: [], profiles: [], webhook_logs: [] }; });
after(() => { globalThis.Date = RealDate; globalThis.fetch = originalFetch; });

const snapshot = (eventName, id, attributes) => ({ meta: { event_name: eventName, custom_data: { user_id: USER } }, data: { id, attributes: { variant_name: 'Pro Monthly', ...attributes } } });
const log = (id, processed, createdAt, eventName, subscriptionId, attributes) =>
  ({ id, event_type: eventName, processed, error: processed ? null : 'transient', created_at: createdAt, payload: snapshot(eventName, subscriptionId, attributes) });
async function recover() {
  const response = await verify({ httpMethod: 'POST', headers: { authorization: 'Bearer stub-token' }, body: '{}' });
  assert.equal(response.statusCode, 200, response.body);
  return JSON.parse(response.body);
}
const subscription = () => tables.subscriptions.find((row) => row.user_id === USER);
const profile = () => tables.profiles.find((row) => row.id === USER);

test("an old subscription's processed expiry does not hide the failed creation of a new paid one", async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'expired', lemonsqueezy_subscription_id: 'sub-A',
    subscription_start: '2025-11-01T00:00:00Z', subscription_end: '2025-12-01T00:00:00Z' });
  tables.webhook_logs.push(
    log('b-created', false, '2026-01-01T00:00:00Z', 'subscription_created', 'sub-B',
      { status: 'active', created_at: '2025-12-31T23:00:00Z', updated_at: '2025-12-31T23:00:00Z', renews_at: '2026-01-31T00:00:00Z' }),
    log('a-expired', true, '2026-01-01T00:05:00Z', 'subscription_expired', 'sub-A',
      { status: 'expired', created_at: '2025-11-01T00:00:00Z', updated_at: '2026-01-01T00:04:00Z' }),
  );
  const result = await recover();
  assert.deepEqual(result, { status: 'active', source: 'recovered' });
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-B');
  assert.equal(subscription().status, 'active');
  assert.equal(profile().is_subscribed, true);
  assert.equal(tables.webhook_logs.find((row) => row.id === 'b-created').processed, true, 'the recovered delivery is marked processed');
  assert.equal(tables.webhook_logs.find((row) => row.id === 'a-expired').error, null, 'the other subscription is untouched');
});

test('an account a grant already opened still gets its pending paid subscription recorded', async () => {
  // Round-2 review (HIGH): verify used to answer "active" from the grant and
  // never looked at the failed creation, so the billing id stayed absent.
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'active', price_paid: 0, lemonsqueezy_subscription_id: null,
    subscription_start: '2026-01-01T00:30:00Z', subscription_end: '2026-01-08T00:30:00Z' });
  tables.profiles.push({ id: USER, subscription_tier: 'pro', is_subscribed: true });
  tables.webhook_logs.push(log('s-created', false, '2026-01-01T00:00:00Z', 'subscription_created', 'sub-S',
    { status: 'active', created_at: '2025-12-31T23:00:00Z', updated_at: '2025-12-31T23:00:00Z', renews_at: '2026-01-31T00:00:00Z' }));
  const result = await recover();
  assert.deepEqual(result, { status: 'active', source: 'recovered' });
  assert.equal(subscription().lemonsqueezy_subscription_id, 'sub-S', 'the billing subscription is on record');
  assert.equal(hasChargingSubscription([subscription()]), true, 'delete-account answers 409 on the recovered row');
  assert.equal(tables.webhook_logs.find((row) => row.id === 's-created').processed, true);
  assert.equal(profile().is_subscribed, true);
});

test('an account with access and nothing pending is still answered from what it has', async () => {
  tables.subscriptions.push({ user_id: USER, plan_type: 'monthly', status: 'active', price_paid: 0, lemonsqueezy_subscription_id: null,
    subscription_start: '2026-01-01T00:30:00Z', subscription_end: '2026-01-08T00:30:00Z' });
  tables.profiles.push({ id: USER, subscription_tier: 'pro', is_subscribed: true });
  assert.deepEqual(await recover(), { status: 'active', source: 'existing' });
  assert.equal(subscription().lemonsqueezy_subscription_id, null);
});

test('an older failed snapshot behind a processed terminal event of the SAME subscription stays retired', async () => {
  tables.webhook_logs.push(
    log('b-created', false, '2025-12-31T00:00:00Z', 'subscription_created', 'sub-B',
      { status: 'active', created_at: '2025-12-30T00:00:00Z', updated_at: '2025-12-30T00:00:00Z', renews_at: '2026-01-30T00:00:00Z' }),
    log('b-expired', true, '2026-01-01T00:00:00Z', 'subscription_expired', 'sub-B',
      { status: 'expired', created_at: '2025-12-30T00:00:00Z', updated_at: '2025-12-31T12:00:00Z' }),
    log('a-old', false, '2025-11-01T00:00:00Z', 'subscription_updated', 'sub-A',
      { status: 'active', created_at: '2025-10-01T00:00:00Z', updated_at: '2025-11-01T00:00:00Z', renews_at: '2025-12-01T00:00:00Z' }),
  );
  const result = await recover();
  assert.equal(result.status, 'not_found');
  assert.equal(profile().is_subscribed, false);
  assert.equal(tables.webhook_logs.find((row) => row.id === 'b-created').processed, false, "B's newest row is its processed expiry");
});
