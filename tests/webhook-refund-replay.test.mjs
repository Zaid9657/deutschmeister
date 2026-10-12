// A refunded course order is never granted again, and a paid one nobody can
// be matched to reaches the owner.
//
// The failure this pins (telc pilot plan, 2026-10-12): handleCourseOrder
// upserts the purchases row with status 'active' on every order_created. Lemon
// Squeezy re-sends that event — its own retries, and the owner's "resend" in
// the dashboard — so a resend after a refund handed the access straight back,
// with the money already returned. Now the payload's status (refunded,
// partial_refund, failed, fraudulent — `refunded` is true only for a FULL
// refund) and then the purchases row's status are checked before anything is
// written. The second half: a paid course order with no matchable account used
// to fail silently into webhook_logs; the owner is now mailed at once.
//
// Behavioural, not structural: the real handler runs against a stubbed fetch
// (Supabase REST and Resend both go through global fetch). The purchases table
// is kept in memory, so the delivered → refunded → replayed cycle runs through
// the real order_refunded handler too. Same harness as
// tests/webhook-unrouted-order.test.mjs.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';
process.env.LEMONSQUEEZY_TELC_B1_VARIANT_ID = '2077984';

const USER = '00000000-0000-0000-0000-000000000001';
const ORDER = '888001';

let mails = [];
let calls = [];
let purchases = new Map(); // lemonsqueezy_order_id → row
let failPurchaseLookup = false;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  const method = (init.method || 'GET').toUpperCase();
  if (href.startsWith('https://api.resend.com')) {
    mails.push(JSON.parse(init.body));
    return json({ id: 'stub' });
  }
  calls.push({ href, method, body: init.body ? String(init.body) : '' });
  const u = new URL(href);
  if (u.pathname === '/rest/v1/purchases') {
    const orderId = (u.searchParams.get('lemonsqueezy_order_id') || '').replace(/^eq\./, '');
    if (method === 'GET') {
      if (failPurchaseLookup) return json({ message: 'stub lookup failure', code: 'XX000' }, 500);
      const row = purchases.get(orderId);
      return json(row ? [row] : []);
    }
    if (method === 'POST') {
      const row = JSON.parse(init.body);
      const key = String(row.lemonsqueezy_order_id);
      purchases.set(key, { ...(purchases.get(key) || {}), ...row });
      return new Response(null, { status: 201 });
    }
    if (method === 'PATCH') {
      const row = purchases.get(orderId);
      if (row) purchases.set(orderId, { ...row, ...JSON.parse(init.body) });
      return new Response(null, { status: 204 });
    }
  }
  // Every other read (subscriptions, profiles, auth users) finds nothing, and
  // every other write succeeds.
  return json([]);
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

beforeEach(() => {
  mails = [];
  calls = [];
  purchases = new Map();
  failPurchaseLookup = false;
});

function signed(payload) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  return { httpMethod: 'POST', headers: { 'x-signature': signature }, body };
}

function orderEvent(eventName, { status = 'paid', refunded = false, userId = USER, testMode = false } = {}) {
  return {
    meta: { event_name: eventName, test_mode: testMode, custom_data: userId ? { user_id: userId } : {} },
    data: {
      id: ORDER,
      attributes: {
        status,
        refunded,
        total: 14900,
        total_formatted: '€149.00',
        user_email: 'buyer@example.com',
        customer_id: 5551,
        first_order_item: { variant_id: 2077984, product_id: 1329566, product_name: 'telc-B1-Prüfungsprobe', variant_name: 'Default' },
      },
    },
  };
}

// A grant is any write to the three tables a delivery touches.
const GRANT_TABLES = ['/rest/v1/purchases', '/rest/v1/subscriptions', '/rest/v1/profiles'];
const grantWrites = () =>
  calls.filter((c) => c.method !== 'GET' && GRANT_TABLES.some((t) => new URL(c.href).pathname === t));

test('control: a paid order with an account is delivered (purchases active, Pro window, profile)', async () => {
  const res = await handler(signed(orderEvent('order_created')));
  assert.equal(res.statusCode, 200);
  const row = purchases.get(ORDER);
  assert.ok(row, 'no purchases row was written');
  assert.equal(row.status, 'active');
  assert.equal(row.product_key, 'telc_b1_komplett');
  assert.equal(row.user_id, USER);
  const tables = grantWrites().map((c) => new URL(c.href).pathname);
  assert.deepEqual(tables, ['/rest/v1/purchases', '/rest/v1/subscriptions', '/rest/v1/profiles']);
  assert.equal(mails.length, 0);
});

test('a resend for an order whose purchases row is refunded grants nothing and answers 200', async () => {
  purchases.set(ORDER, { user_id: USER, product_key: 'telc_b1_komplett', lemonsqueezy_order_id: ORDER, status: 'refunded' });
  const res = await handler(signed(orderEvent('order_created')));
  assert.equal(res.statusCode, 200, 'a 500 would make Lemon Squeezy retry an order that must stay refunded');
  assert.deepEqual(grantWrites(), [], 'nothing may be written for a refunded order');
  assert.equal(purchases.get(ORDER).status, 'refunded');
});

test('a payload Lemon Squeezy already marks refunded, partially refunded, failed or fraudulent grants nothing', async () => {
  for (const [status, refunded] of [['refunded', true], ['partial_refund', false], ['failed', false], ['fraudulent', false], ['paid', true]]) {
    calls = [];
    const res = await handler(signed(orderEvent('order_created', { status, refunded })));
    assert.equal(res.statusCode, 200, `${status}/${refunded}`);
    assert.deepEqual(grantWrites(), [], `${status} (refunded=${refunded}) was granted`);
    assert.equal(purchases.size, 0);
  }
});

test('the full cycle: delivered, refunded, then resent — the resend gives nothing back', async () => {
  assert.equal((await handler(signed(orderEvent('order_created')))).statusCode, 200);
  assert.equal(purchases.get(ORDER).status, 'active');

  assert.equal((await handler(signed(orderEvent('order_refunded', { status: 'refunded', refunded: true })))).statusCode, 200);
  assert.equal(purchases.get(ORDER).status, 'refunded', 'order_refunded must revoke the purchase');

  // The resend carries the ORIGINAL paid payload — only the row knows better.
  calls = [];
  assert.equal((await handler(signed(orderEvent('order_created')))).statusCode, 200);
  assert.deepEqual(grantWrites(), [], 'the resend wrote a grant');
  assert.equal(purchases.get(ORDER).status, 'refunded', 'the resend re-activated a refunded purchase');
});

test('a retry of a live, unrefunded order is still delivered (the guard is not a duplicate check)', async () => {
  await handler(signed(orderEvent('order_created')));
  calls = [];
  const res = await handler(signed(orderEvent('order_created')));
  assert.equal(res.statusCode, 200);
  assert.ok(grantWrites().length >= 1, 'a retry of an active order must upsert again, idempotently');
  assert.equal(purchases.get(ORDER).status, 'active');
});

test('a failed purchases lookup fails the event and grants nothing (Lemon Squeezy retries)', async () => {
  failPurchaseLookup = true;
  const res = await handler(signed(orderEvent('order_created')));
  assert.equal(res.statusCode, 500);
  assert.deepEqual(grantWrites(), []);
});

test('a paid course order with no matchable account mails the owner and fails the event', async () => {
  const res = await handler(signed(orderEvent('order_created', { userId: null })));
  assert.equal(res.statusCode, 500, 'the event must fail so Lemon Squeezy retries once the buyer has an account');
  assert.deepEqual(grantWrites(), []);
  const alerts = mails.filter((m) => /has no account/.test(m.subject));
  assert.equal(alerts.length, 1, 'exactly one owner mail');
  assert.deepEqual(alerts[0].to, ['zaid@deutsch-meister.de']);
  assert.match(alerts[0].subject, new RegExp(ORDER));
  assert.match(alerts[0].text, /buyer@example\.com/, 'the mail must name the customer');
  assert.match(alerts[0].text, /telc_b1_komplett/, 'the mail must name the product');
  assert.ok(
    calls.some((c) => c.href.includes('/webhook_logs') && /"processed":false/.test(c.body) && /no resolvable user/.test(c.body)),
    'webhook_logs must record the failure',
  );
});

test('a test-mode order with no account is tagged [TEST]', async () => {
  await handler(signed(orderEvent('order_created', { userId: null, testMode: true })));
  const [alert] = mails.filter((m) => /has no account/.test(m.subject));
  assert.ok(alert);
  assert.match(alert.subject, /^\[TEST\] /);
});
