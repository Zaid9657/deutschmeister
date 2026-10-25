// Lemon Squeezy events for a deleted account are acknowledged, not retried for ever.
//
// delete-account removes the auth user (subscriptions, profiles and purchases
// cascade), but Lemon Squeezy keeps the old custom_data.user_id: at period end
// it sends subscription_expired for it, and an owner "resend" of an old
// order_created carries it too. Writing that id again violates the auth.users
// foreign key, the webhook answers 500, Lemon Squeezy retries, and every attempt
// is logged processed=false — counted as a failed webhook in the Monday truth
// mail and by the sentinel. Now a definite "user not found" from GoTrue means
// the account is gone: a subscription event is logged as processed with a note
// and answered 200 without writing, and a course order falls back to the
// order's e-mail (the buyer may have signed up again). Any other auth trouble
// proceeds exactly as before. Behavioural: the real handler, stubbed fetch with
// the foreign key enforced.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.deleted.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';
process.env.LEMONSQUEEZY_TELC_B1_VARIANT_ID = '2077984';

const GONE = '00000000-0000-0000-0000-0000000000dd';
const AGAIN = '00000000-0000-0000-0000-0000000000ee';
let authUsers;
let authDown;
let writes;
let logs;
let purchases;
let mails;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const fkViolation = () => json({ code: '23503', message: 'insert or update violates foreign key constraint "user_id_fkey"' }, 409);
const userExists = (id) => authUsers.some((u) => u.id === id);

globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  const method = (init.method || 'GET').toUpperCase();
  if (href.startsWith('https://api.resend.com')) {
    mails.push(JSON.parse(init.body));
    return json({ id: 'stub' });
  }
  const u = new URL(href);
  assert.equal(u.host, 'supabase.deleted.stub', 'the harness contacts nothing else');
  if (u.pathname === '/auth/v1/admin/users') return json({ users: authUsers, aud: 'authenticated' });
  if (u.pathname.startsWith('/auth/v1/admin/users/')) {
    if (authDown) return json({ msg: 'upstream unavailable' }, 503);
    const user = authUsers.find((x) => x.id === u.pathname.split('/').at(-1));
    return user ? json(user) : json({ code: 404, error_code: 'user_not_found', msg: 'User not found' }, 404);
  }
  if (u.pathname === '/rest/v1/webhook_logs') {
    if (method === 'POST') { logs.push(JSON.parse(init.body)); return new Response(null, { status: 201 }); }
    return json([]);
  }
  if (u.pathname === '/rest/v1/profiles' && method === 'GET') {
    const filter = (u.searchParams.get('email') || '').replace(/^ilike\./, '').replace(/\\(.)/g, '$1');
    return json(filter ? authUsers.filter((x) => x.email.toLowerCase() === filter.toLowerCase()) : []);
  }
  if (u.pathname === '/rest/v1/purchases') {
    const orderId = (u.searchParams.get('lemonsqueezy_order_id') || '').replace(/^eq\./, '');
    if (method === 'GET') return json(orderId ? [purchases.get(orderId)].filter(Boolean) : []);
  }
  if (method !== 'GET') {
    const table = u.pathname.split('/').at(-1);
    const body = init.body ? JSON.parse(init.body) : {};
    const owner = body.user_id ?? body.id;
    // user_id / profiles.id REFERENCES auth.users(id): a deleted account cannot be written again.
    if (['subscriptions', 'profiles', 'purchases'].includes(table) && owner && !userExists(owner)) return fkViolation();
    writes.push({ table, method, body });
    if (table === 'purchases' && method === 'POST') purchases.set(String(body.lemonsqueezy_order_id), body);
    return new Response(null, { status: 201 });
  }
  return json([]);
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

beforeEach(() => {
  authUsers = [{ id: AGAIN, email: 'buyer@example.com' }];
  authDown = false;
  writes = [];
  logs = [];
  purchases = new Map();
  mails = [];
});

function signed(payload) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  return { httpMethod: 'POST', headers: { 'x-signature': signature }, body };
}
const subscriptionEvent = (eventName, userId, status = 'expired') => ({
  meta: { event_name: eventName, custom_data: { user_id: userId } },
  data: { id: 'sub-9', attributes: { status, created_at: '2025-12-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', renews_at: '2026-01-01T00:00:00Z', ends_at: '2026-01-01T00:00:00Z', user_email: 'buyer@example.com', variant_name: 'Pro Monthly' } },
});
const courseOrder = (userId) => ({
  meta: { event_name: 'order_created', test_mode: false, custom_data: { user_id: userId } },
  data: { id: '6001', attributes: { status: 'paid', total: 8900, total_formatted: '€89.00', user_email: 'buyer@example.com', created_at: '2026-01-01T00:00:00Z', first_order_item: { variant_id: 2077984, product_name: 'telc-B1-Prüfungsprobe' } } },
});
const entitlementWrites = () => writes.filter((w) => ['subscriptions', 'profiles'].includes(w.table));

test('a subscription event for a deleted account is logged processed with a note and answered 200, writing nothing', async () => {
  const res = await handler(signed(subscriptionEvent('subscription_expired', GONE)));
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(entitlementWrites(), [], 'nothing is written for an account that no longer exists');
  const [log] = logs;
  assert.equal(log.event_type, 'subscription_expired');
  assert.equal(log.processed, true, 'not a failed webhook');
  assert.equal(log.error, null, 'the sentinel treats any error text as a failure');
  assert.match(log.payload.dm_note, /deleted/);
  assert.equal(log.payload.data.id, 'sub-9', 'the provider payload itself is kept');
});

test('a resent course order for a deleted account goes to the account that now holds its e-mail', async () => {
  const res = await handler(signed(courseOrder(GONE)));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(purchases.get('6001')?.user_id, AGAIN);
});

test('a course order for a deleted account with no account under its e-mail alerts the owner and fails', async () => {
  authUsers = [];
  const res = await handler(signed(courseOrder(GONE)));
  assert.equal(res.statusCode, 500);
  assert.equal(purchases.size, 0);
  assert.equal(mails.filter((m) => /has no account/.test(m.subject)).length, 1);
});

test('only a definite "user not found" counts: an auth outage proceeds as before and is retried', async () => {
  authDown = true;
  const res = await handler(signed(subscriptionEvent('subscription_expired', GONE)));
  assert.equal(res.statusCode, 500, 'without proof of deletion the event is not acknowledged');
  assert.equal(logs.at(-1).processed, false);
});

test('a live account is unaffected', async () => {
  const res = await handler(signed(subscriptionEvent('subscription_created', AGAIN, 'active')));
  assert.equal(res.statusCode, 200, res.body);
  assert.ok(writes.some((w) => w.table === 'subscriptions' && w.body.user_id === AGAIN));
  assert.equal(logs.at(-1).payload.dm_note, undefined);
});
