// "Pro-Tage gutschreiben" (admin grant_pro_days) works for people who already
// have their one subscriptions row.
//
// subscriptions has UNIQUE(user_id) — every webhook upsert relies on it
// (onConflict: 'user_id'). The action reused only a manual row (no provider id,
// price 0, not a course) and otherwise INSERTED a second row, which the
// constraint rejects: a churned subscriber or a former course buyer got a 500
// and nothing. Now a row that grants and keeps nothing (an expired Lemon
// Squeezy row, or one cancelled past its end, with no live course window) is
// converted in place into the manual grant — its provider ids go into the audit
// entry — and a row with live or recoverable billing, or a live course window,
// is refused with a 409 and a reason, never a second row.
// Behavioural: the real admin handler over a PostgREST stub that enforces the constraint.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'http://supabase.grant.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';

const ADMIN = '00000000-0000-0000-0000-0000000000ad';
const USER = '00000000-0000-0000-0000-000000000001';
const DAY = 86400000;
const past = '2025-01-01T00:00:00Z';
const future = '2999-01-01T00:00:00Z';
let tables;
let seq;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function matches(row, params) {
  return [...params].every(([key, value]) => {
    if (['select', 'order', 'limit', 'on_conflict'].includes(key)) return true;
    if (key === 'or' && value === '(subscription_tier.is.null,subscription_tier.neq.premium)') return row.subscription_tier !== 'premium';
    if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
    if (value === 'is.null') return row[key] == null;
    if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(row[key]));
    throw new Error(`unhandled filter ${key}=${value}`);
  });
}

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.pathname === '/auth/v1/user') return json({ id: ADMIN });
  assert.equal(u.host, 'supabase.grant.stub', 'the harness contacts nothing else');
  const table = u.pathname.split('/').at(-1);
  const method = (init.method || 'GET').toUpperCase();
  const rows = (tables[table] ||= []);
  const representation = new Headers(init.headers).get('prefer')?.includes('return=representation');
  if (method === 'GET') return json(rows.filter((row) => matches(row, u.searchParams)));
  const body = JSON.parse(init.body);
  if (method === 'POST') {
    // subscriptions_user_id_key UNIQUE (user_id)
    if (table === 'subscriptions' && rows.some((row) => row.user_id === body.user_id)) {
      return json({ code: '23505', message: 'duplicate key value violates unique constraint "subscriptions_user_id_key"' }, 409);
    }
    const row = { id: `${table}-${++seq}`, ...body };
    rows.push(row);
    return representation ? json([row], 201) : new Response(null, { status: 201 });
  }
  if (method === 'PATCH') {
    const changed = rows.filter((row) => matches(row, u.searchParams));
    changed.forEach((row) => Object.assign(row, body));
    return representation ? json(changed) : new Response(null, { status: 204 });
  }
  throw new Error(`unhandled ${method}`);
};

const { handler } = await import('../netlify/functions/admin-actions.mjs');

beforeEach(() => {
  seq = 0;
  tables = {
    profiles: [
      { id: ADMIN, role: 'admin', email: 'staff@deutsch-meister.de' },
      { id: USER, email: 'learner@example.com', is_subscribed: false, subscription_tier: 'free' },
    ],
    subscriptions: [],
    purchases: [],
    admin_audit_log: [],
  };
});

const grant = (days = 7) => handler({
  httpMethod: 'POST', path: '/stub', headers: { authorization: 'Bearer staff-jwt' },
  body: JSON.stringify({ action: 'grant_pro_days', userId: USER, reason: 'Kulanz nach Ausfall', params: { days } }),
});
const learner = () => tables.profiles.find((p) => p.id === USER);
const lsRow = (patch) => ({
  id: 'row-ls', user_id: USER, plan_type: 'monthly', status: 'expired', price_paid: 9.99,
  lemonsqueezy_subscription_id: '2177689', lemonsqueezy_customer_id: '55', lemonsqueezy_order_id: '8409879',
  lemonsqueezy_product_id: '1', lemonsqueezy_variant_id: '1393033',
  subscription_start: '2024-12-01T00:00:00Z', subscription_end: past, ...patch,
});

test('an expired Lemon Squeezy row becomes the manual grant in place — no second row, provider ids in the audit', async () => {
  tables.subscriptions = [lsRow()];
  const before = Date.now();
  const res = await grant(7);
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(tables.subscriptions.length, 1, 'the one-row slot is reused');
  const [row] = tables.subscriptions;
  assert.equal(row.id, 'row-ls');
  assert.equal(row.lemonsqueezy_subscription_id, null, 'a manual grant carries no provider id (the expiry sweep selects those)');
  assert.equal(row.lemonsqueezy_order_id, null);
  assert.equal(row.price_paid, 0);
  assert.equal(row.status, 'active');
  assert.ok(Math.abs(Date.parse(row.subscription_end) - (before + 7 * DAY)) < 60000, 'seven days from now, not from the old row');
  assert.equal(learner().is_subscribed, true);
  assert.equal(learner().subscription_tier, 'pro');
  const audit = tables.admin_audit_log.find((a) => a.action === 'actions.grant_pro_days' && a.outcome === 'success');
  assert.equal(audit.before_state.supersededRow.lemonsqueezy_subscription_id, '2177689', 'the superseded provider id is on record');
});

test('a row cancelled past its end is taken over the same way', async () => {
  tables.subscriptions = [lsRow({ status: 'cancelled', cancel_at_period_end: true, cancelled_at: past })];
  const res = await grant(3);
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(tables.subscriptions.length, 1);
  assert.equal(tables.subscriptions[0].lemonsqueezy_subscription_id, null);
  assert.equal(tables.subscriptions[0].cancel_at_period_end, false);
});

test('live or recoverable Lemon Squeezy billing is refused with 409 and left untouched', async () => {
  for (const patch of [
    { status: 'active', subscription_end: future },
    { status: 'cancelled', subscription_end: future },
    { status: 'past_due', subscription_end: past },
    { status: 'unpaid', subscription_end: past },
    { status: 'paused', subscription_end: past },
  ]) {
    tables.subscriptions = [lsRow(patch)];
    const snapshot = JSON.stringify(tables.subscriptions);
    const res = await grant(7);
    assert.equal(res.statusCode, 409, `${patch.status}: ${res.body}`);
    assert.match(JSON.parse(res.body).error, /Lemon[- ]Squeezy/);
    assert.equal(JSON.stringify(tables.subscriptions), snapshot, `${patch.status}: the row is unchanged`);
  }
  assert.equal(learner().is_subscribed, false);
});

test('a live course window is refused with 409 (the course row is the one slot)', async () => {
  tables.purchases = [{ id: 'p1', user_id: USER, product_key: 'course_a2_1', status: 'active', lemonsqueezy_order_id: '777', access_until: future }];
  tables.subscriptions = [{ id: 'row-course', user_id: USER, plan_type: 'course', status: 'active', price_paid: 40, lemonsqueezy_subscription_id: null,
    lemonsqueezy_order_id: '777', subscription_start: past, subscription_end: future }];
  const res = await grant(7);
  assert.equal(res.statusCode, 409, res.body);
  assert.match(JSON.parse(res.body).error, /Kurs/);
  assert.equal(tables.subscriptions[0].plan_type, 'course');
});

test('without any row the grant is inserted as before; a manual row is extended in place', async () => {
  const first = await grant(2);
  assert.equal(first.statusCode, 200, first.body);
  assert.equal(tables.subscriptions.length, 1);
  const end = Date.parse(tables.subscriptions[0].subscription_end);
  const again = await grant(3);
  assert.equal(again.statusCode, 200, again.body);
  assert.equal(tables.subscriptions.length, 1);
  assert.equal(Date.parse(tables.subscriptions[0].subscription_end), end + 3 * DAY, 'a running manual grant is extended from its end');
});
