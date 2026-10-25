// Guard suite: an admin Pro-day grant ends on its subscription_end, server-side
// too. Run with `npm test`.
//
// Why (review 2026-10-25: C-003, C-017, X-007, X-021): grant_pro_days writes a
// 'monthly' subscriptions row with no Lemon Squeezy id and sets
// profiles.is_subscribed / subscription_tier 'pro'. No provider event ever ends
// such a row, and the daily sweep (trial-lifecycle.mjs expireCourseWindows)
// revisited only course windows, purchase windows and past_due/paused/unpaid
// rows. After the grant's end the SPA locked again (it reads the row's date),
// but getTier() kept answering 'pro' from the flags: 30 speaking sessions a
// month, the Pro writing allowance, the Pro X-Ray limit, and Astro opening every
// level, until someone pressed Verify.
//
// The sweep now reconciles every lapsed manual grant and marks it 'expired'
// once its owner is reconciled. These tests run the real sweep, the real
// reconcileUserEntitlement and the real supabase-js client against a fake
// PostgREST that implements the filters the sweep uses (eq, neq, lt, lte, is,
// in, or) with SQL's NULL semantics. Synthetic ids only.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'http://supabase.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';

const U = '00000000-0000-0000-0000-00000000c0a1';
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-25T08:00:00Z');
const iso = (t) => new Date(t).toISOString();

let tables;
let failProfileWrites;

/** One PostgREST filter value against one cell, with SQL NULL semantics (NULL matches only `is.null`). */
function matches(cell, filter) {
  const dot = filter.indexOf('.');
  const op = filter.slice(0, dot);
  const value = filter.slice(dot + 1);
  if (op === 'is') return value === 'null' ? cell == null : String(cell) === value;
  if (cell == null) return false;
  const num = (v) => (Number.isFinite(Date.parse(v)) && /\d{4}-\d{2}-\d{2}/.test(v) ? Date.parse(v) : Number(v));
  switch (op) {
    case 'eq': return String(cell) === value;
    case 'neq': return String(cell) !== value;
    case 'lt': return num(String(cell)) < num(value);
    case 'lte': return num(String(cell)) <= num(value);
    case 'gt': return num(String(cell)) > num(value);
    case 'gte': return num(String(cell)) >= num(value);
    case 'in': return value.slice(1, -1).split(',').includes(String(cell));
    default: throw new Error(`fake PostgREST: unsupported operator ${op}`);
  }
}

/** `or=(a.op.v,b.op.v)`: any clause matches. */
function matchesOr(row, expr) {
  return expr.slice(1, -1).split(',').some((clause) => {
    const dot = clause.indexOf('.');
    return matches(row[clause.slice(0, dot)], clause.slice(dot + 1));
  });
}

const RESERVED = new Set(['select', 'order', 'offset', 'limit', 'on_conflict', 'columns']);

globalThis.fetch = async (url, init = {}) => {
  const href = new URL(String(url));
  const table = href.pathname.split('/').at(-1);
  const method = init.method || 'GET';
  let rows = (tables[table] ||= []).filter((row) => {
    for (const [key, filter] of href.searchParams) {
      if (RESERVED.has(key)) continue;
      if (key === 'or' ? !matchesOr(row, filter) : !matches(row[key], filter)) return false;
    }
    return true;
  });
  if (table === 'profiles' && ['PATCH', 'POST'].includes(method) && failProfileWrites) {
    return new Response(JSON.stringify({ message: 'profile write failed' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  if (method === 'PATCH') {
    const patch = JSON.parse(init.body);
    for (const row of rows) Object.assign(row, patch);
  } else if (method === 'POST') {
    const conflict = href.searchParams.get('on_conflict');
    const out = [];
    for (const incoming of [].concat(JSON.parse(init.body))) {
      const prior = conflict && tables[table].find((row) => row[conflict] === incoming[conflict]);
      if (prior) Object.assign(prior, incoming);
      else tables[table].push({ id: `stub-${tables[table].length + 1}`, ...incoming });
      out.push(prior || tables[table].at(-1));
    }
    rows = out;
  } else {
    const offset = Number(href.searchParams.get('offset') || 0);
    const limit = Number(href.searchParams.get('limit') || rows.length);
    rows = rows.slice(offset, offset + limit);
  }
  return new Response(method === 'HEAD' ? null : JSON.stringify(rows), {
    headers: { 'content-type': 'application/json', 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` },
  });
};

const { expireCourseWindows } = await import('../netlify/functions/trial-lifecycle.mjs');
const { supabase } = await import('../netlify/functions/_shared/supabase.mjs');

const grant = (patch = {}) => ({
  id: 'grant-1', user_id: U, plan_type: 'monthly', status: 'active', price_paid: 0,
  lemonsqueezy_subscription_id: null, subscription_start: iso(NOW - 31 * DAY), subscription_end: iso(NOW - DAY), ...patch,
});
const profile = () => tables.profiles.find((p) => p.id === U);

beforeEach(() => {
  failProfileWrites = false;
  tables = {
    profiles: [{ id: U, is_subscribed: true, subscription_tier: 'pro' }],
    subscriptions: [],
    purchases: [],
    webhook_logs: [],
  };
});

test('a manual grant past its end is reconciled to free in one sweep and marked expired', async () => {
  tables.subscriptions = [grant()];
  const result = await expireCourseWindows(supabase, NOW);
  assert.equal(profile().is_subscribed, false, 'the flag getTier() reads must clear');
  assert.equal(profile().subscription_tier, 'free');
  assert.equal(tables.subscriptions[0].status, 'expired');
  assert.equal(result.grantsExpired, 1);
  assert.equal(result.reconciled, 1);
  // The next run finds nothing left to expire and changes nothing.
  const again = await expireCourseWindows(supabase, NOW + DAY);
  assert.equal(again.grantsExpired, 0);
  assert.equal(profile().is_subscribed, false);
});

test('a live grant, a Lemon Squeezy row and a course window are not this rule\'s to end', async () => {
  tables.subscriptions = [grant({ subscription_end: iso(NOW + 5 * DAY) })];
  await expireCourseWindows(supabase, NOW);
  assert.equal(tables.subscriptions[0].status, 'active', 'a grant still running stays running');
  assert.equal(profile().is_subscribed, true);

  // A provider row whose renewal webhook is late belongs to the webhook.
  tables.subscriptions = [grant({ lemonsqueezy_subscription_id: 'ls-123', price_paid: 9.99 })];
  const result = await expireCourseWindows(supabase, NOW);
  assert.equal(tables.subscriptions[0].status, 'active');
  assert.equal(result.grantsExpired, 0);
  assert.equal(profile().is_subscribed, true, 'not reconciled by the grant rule');
});

test('premium survives, and a running course window takes over the row', async () => {
  tables.profiles[0].subscription_tier = 'premium';
  tables.subscriptions = [grant()];
  await expireCourseWindows(supabase, NOW);
  assert.equal(profile().subscription_tier, 'premium');
  assert.equal(profile().is_subscribed, true);
  assert.equal(tables.subscriptions[0].status, 'expired');

  tables.profiles[0].subscription_tier = 'pro';
  tables.subscriptions = [grant()];
  tables.purchases = [{ id: 'p1', user_id: U, product_key: 'course_a1_2', status: 'active', created_at: iso(NOW - 10 * DAY), access_until: iso(NOW + 80 * DAY), lemonsqueezy_order_id: 'o1', price_paid: 40 }];
  await expireCourseWindows(supabase, NOW);
  assert.equal(profile().is_subscribed, true, 'the included Pro window still runs');
  assert.equal(tables.subscriptions[0].plan_type, 'course', 'reconcile put the course window in the slot');
  assert.equal(tables.subscriptions[0].status, 'active', 'and the grant rule does not touch it');
});

test('a failed profile write leaves the grant active, so the next run finds it again', async () => {
  tables.subscriptions = [grant()];
  failProfileWrites = true;
  await assert.rejects(() => expireCourseWindows(supabase, NOW), { message: 'profile write failed' });
  assert.equal(tables.subscriptions[0].status, 'active', 'not marked expired before its owner was reconciled');
  assert.equal(profile().is_subscribed, true);
  failProfileWrites = false;
  const result = await expireCourseWindows(supabase, NOW + DAY);
  assert.equal(result.grantsExpired, 1);
  assert.equal(profile().is_subscribed, false);
  assert.equal(tables.subscriptions[0].status, 'expired');
});

test('end to end: grant_pro_days for one day, then the daily sweep three days later', async () => {
  tables.profiles[0] = { id: U, role: 'admin', is_subscribed: false, subscription_tier: 'free' };
  globalThis.fetch = ((inner) => async (url, init) => (new URL(String(url)).pathname === '/auth/v1/user'
    ? new Response(JSON.stringify({ id: U }), { headers: { 'content-type': 'application/json' } })
    : inner(url, init)))(globalThis.fetch);
  const { handler: adminActions } = await import('../netlify/functions/admin-actions.mjs');
  const res = await adminActions({ httpMethod: 'POST', headers: { authorization: 'Bearer stub-jwt' }, path: '/stub', body: JSON.stringify({ action: 'grant_pro_days', userId: U, reason: 'support grant', params: { days: 1 } }) });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(profile().is_subscribed, true);
  assert.equal(profile().subscription_tier, 'pro');
  const row = tables.subscriptions.find((s) => s.user_id === U);
  assert.equal(row.lemonsqueezy_subscription_id ?? null, null, 'a manual row has no provider id');
  await expireCourseWindows(supabase, Date.now() + 3 * DAY);
  assert.equal(profile().is_subscribed, false, 'before 2026-10-25 this stayed true forever');
  assert.equal(profile().subscription_tier, 'free');
  assert.equal(row.status, 'expired');
});
