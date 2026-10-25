// An explicit premium grant survives every admin action that recomputes the
// profile flags; only "Tier setzen" (set_tier) changes it.
//
// The failure this pins (round-2 review, MEDIUM): grant_course, sync_flags and
// the other flag-recomputing actions wrote flagsFromRows() straight into the
// profile. flagsFromRows knows subscriptions and purchase windows only, so a
// premium customer without a paid subscription row went from premium/true to
// free/false when staff merely unlocked a course or synced the flags. The
// writes are now conditional on the tier, like reconcileUserEntitlement's: a
// premium profile keeps its tier, and a premium grant made while an action runs
// is never overwritten. Behavioural: the real admin handler over a PostgREST stub.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'http://supabase.premium.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID = '2088888';

const ADMIN = '00000000-0000-0000-0000-0000000000ad';
const USER = '00000000-0000-0000-0000-000000000001';
let tables;
let seq;
let grantPremiumMeanwhile;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function matches(row, params) {
  return [...params].every(([key, value]) => {
    if (['select', 'order', 'limit', 'on_conflict'].includes(key)) return true;
    if (key === 'or') {
      assert.equal(value, '(subscription_tier.is.null,subscription_tier.neq.premium)');
      return row.subscription_tier == null || row.subscription_tier !== 'premium';
    }
    if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
    if (value === 'is.null') return row[key] == null;
    if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(row[key]));
    throw new Error(`unhandled filter ${key}=${value}`);
  });
}

globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  if (u.pathname === '/auth/v1/user') return json({ id: ADMIN });
  assert.equal(u.host, 'supabase.premium.stub', 'the harness contacts nothing else');
  const table = u.pathname.split('/').at(-1);
  const method = (init.method || 'GET').toUpperCase();
  const rows = (tables[table] ||= []);
  const representation = new Headers(init.headers).get('prefer')?.includes('return=representation');
  if (method === 'GET') return json(rows.filter((row) => matches(row, u.searchParams)));
  const body = JSON.parse(init.body);
  if (method === 'POST') {
    const row = { id: `${table}-${++seq}`, ...body };
    rows.push(row);
    return representation ? json([row], 201) : new Response(null, { status: 201 });
  }
  if (method === 'PATCH') {
    if (table === 'profiles' && grantPremiumMeanwhile) {
      // Another admin's set_tier premium lands between this action's read and its write.
      Object.assign(rows.find((p) => p.id === USER), { subscription_tier: 'premium', is_subscribed: true });
      grantPremiumMeanwhile = false;
    }
    const changed = rows.filter((row) => matches(row, u.searchParams));
    changed.forEach((row) => Object.assign(row, body));
    return representation ? json(changed) : new Response(null, { status: 204 });
  }
  throw new Error(`unhandled ${method}`);
};

const { handler } = await import('../netlify/functions/admin-actions.mjs');

beforeEach(() => {
  seq = 0;
  grantPremiumMeanwhile = false;
  tables = {
    profiles: [
      { id: ADMIN, role: 'admin', email: 'staff@deutsch-meister.de' },
      { id: USER, email: 'learner@example.com', is_subscribed: true, subscription_tier: 'premium' },
    ],
    subscriptions: [],
    purchases: [],
    admin_audit_log: [],
  };
});

const act = (action, params = {}) => handler({
  httpMethod: 'POST', path: '/stub', headers: { authorization: 'Bearer staff-jwt' },
  body: JSON.stringify({ action, userId: USER, reason: 'Kulanz', params }),
});
const learner = () => tables.profiles.find((p) => p.id === USER);

test('unlocking a course for a premium customer without paid rows keeps premium', async () => {
  const res = await act('grant_course', { productKey: 'course_a2_1' });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(tables.purchases.length, 1, 'the course is unlocked');
  assert.equal(learner().subscription_tier, 'premium');
  assert.equal(learner().is_subscribed, true);
  assert.deepEqual(JSON.parse(res.body).after.profile, { is_subscribed: true, subscription_tier: 'premium' });
});

test('syncing the flags of a premium customer keeps premium', async () => {
  tables.subscriptions = [{ id: 'old', user_id: USER, plan_type: 'monthly', status: 'expired', lemonsqueezy_subscription_id: '42', subscription_end: '2025-01-01T00:00:00Z' }];
  const res = await act('sync_flags');
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(learner().subscription_tier, 'premium');
  assert.equal(learner().is_subscribed, true);
});

test('Pro days, revoking manual access and revoking a manual course never demote premium either', async () => {
  assert.equal((await act('grant_pro_days', { days: 3 })).statusCode, 200);
  assert.equal(learner().subscription_tier, 'premium');
  assert.equal((await act('revoke_manual_access')).statusCode, 200);
  assert.equal(learner().subscription_tier, 'premium');
  assert.equal((await act('grant_course', { productKey: 'course_a2_1' })).statusCode, 200);
  assert.equal((await act('revoke_course', { productKey: 'course_a2_1' })).statusCode, 200);
  assert.equal(learner().subscription_tier, 'premium');
  assert.equal(learner().is_subscribed, true);
});

test('only an explicit tier change revokes premium', async () => {
  assert.equal((await act('set_tier', { tier: 'free' })).statusCode, 200);
  assert.equal(learner().subscription_tier, 'free');
  assert.equal(learner().is_subscribed, false);
});

test('a premium grant made while a recomputation runs is not overwritten', async () => {
  Object.assign(learner(), { subscription_tier: 'free', is_subscribed: false });
  grantPremiumMeanwhile = true;
  const res = await act('sync_flags');
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(learner().subscription_tier, 'premium', 'the concurrent premium grant stands');
  assert.equal(learner().is_subscribed, true);
});

test('a non-premium profile is still recomputed from its rows', async () => {
  Object.assign(learner(), { subscription_tier: 'pro', is_subscribed: true });
  const res = await act('sync_flags');
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(learner().subscription_tier, 'free');
  assert.equal(learner().is_subscribed, false);
});
