// A paid order the webhook cannot route must reach the owner, not vanish.
//
// The failure this pins (found 2026-10-11): a one-time product whose
// functions-scope LEMONSQUEEZY_*_VARIANT_ID is unset or wrong falls through
// courseForVariant() into the subscription lane, which only backfills
// price_paid — so the customer is charged, nothing is granted, and the webhook
// still answered 200. Now the owner is mailed AND the event fails (500 +
// webhook_logs processed=false), so Lemon Squeezy retries and a fixed env var
// delivers the order by itself; a mail that cannot be sent is not the only
// trace. The Codex review of #202 asked for the cases below: a one-time name
// containing "Pro", an authoritative variant-id list, a failed mail, and the
// price_paid backfill still running.
//
// Behavioural, not structural: the real handler runs against a stubbed fetch
// (Supabase REST and Resend both go through global fetch).

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';

let resendCalls = [];
let supabaseCalls = [];
let resendStatus = 200;
globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  if (href.startsWith('https://api.resend.com')) {
    resendCalls.push(JSON.parse(init.body));
    return new Response('{"id":"stub"}', { status: resendStatus, headers: { 'content-type': 'application/json' } });
  }
  supabaseCalls.push({ href, method: init.method || 'GET', body: init.body ? String(init.body) : '' });
  // Supabase PostgREST: an empty result for every read and write.
  return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

beforeEach(() => {
  resendCalls = [];
  supabaseCalls = [];
  resendStatus = 200;
  process.env.RESEND_API_KEY = 're_stub';
  delete process.env.LEMONSQUEEZY_PRO_VARIANT_IDS;
});

function signedEvent(payload) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  return { httpMethod: 'POST', headers: { 'x-signature': signature }, body };
}

function orderCreated({ productName, variantName = 'Default', variantId = 4242, testMode = false }) {
  return {
    meta: { event_name: 'order_created', test_mode: testMode, custom_data: { user_id: '00000000-0000-0000-0000-000000000001' } },
    data: {
      id: '777001',
      attributes: {
        status: 'paid',
        total: 4000,
        total_formatted: '€40.00',
        user_email: 'buyer@example.com',
        first_order_item: { variant_id: variantId, product_name: productName, variant_name: variantName },
      },
    },
  };
}

const alerts = () => resendCalls.filter((c) => /NOT delivered/.test(c.subject));
const loggedFailure = () =>
  supabaseCalls.some((c) => c.href.includes('/webhook_logs') && /"processed":false/.test(c.body) && /unrouted paid order 777001/.test(c.body));

test('an unrouted paid one-time order alerts the owner and fails the event so Lemon Squeezy retries', async () => {
  const res = await handler(signedEvent(orderCreated({ productName: 'Deutsch A1.2', variantId: 4242 })));
  assert.equal(res.statusCode, 500, 'the event must fail: a 200 would end the retries for an order that granted nothing');
  const [alert] = alerts();
  assert.ok(alert, 'no owner alert was sent for a paid order that granted nothing');
  assert.deepEqual(alert.to, ['zaid@deutsch-meister.de']);
  assert.match(alert.text, /4242/, 'the alert must name the variant id the owner has to configure');
  assert.match(alert.text, /buyer@example\.com/, 'the alert must name the customer');
  assert.ok(loggedFailure(), 'webhook_logs must record the event as processed=false with the reason');
});

test('the price_paid backfill still runs before the alert (a misclassified subscription keeps its amount)', async () => {
  await handler(signedEvent(orderCreated({ productName: 'Deutsch A1.2', variantId: 4242 })));
  assert.ok(
    supabaseCalls.some((c) => c.method === 'PATCH' && c.href.includes('/subscriptions') && c.href.includes('lemonsqueezy_order_id=eq.777001')),
    'the subscriptions price_paid backfill must not be skipped by the alert',
  );
});

test('a Pro subscription order does not alert and succeeds (its grant arrives with subscription_created)', async () => {
  const res = await handler(signedEvent(orderCreated({ productName: 'Pro Monthly', variantId: 1393033 })));
  assert.equal(res.statusCode, 200);
  assert.equal(alerts().length, 0);
});

test('a one-time product with "Pro" inside its name is not mistaken for the subscription', async () => {
  const res = await handler(signedEvent(orderCreated({ productName: 'B1-Prüfungsplan Pro', variantId: 5151 })));
  assert.equal(res.statusCode, 500);
  assert.equal(alerts().length, 1);
});

test('LEMONSQUEEZY_PRO_VARIANT_IDS is authoritative when set', async () => {
  process.env.LEMONSQUEEZY_PRO_VARIANT_IDS = '1379337, 1393033';
  const ok = await handler(signedEvent(orderCreated({ productName: 'DeutschMeister Abo', variantId: 1393033 })));
  assert.equal(ok.statusCode, 200, 'a configured subscription variant passes whatever its display name');
  assert.equal(alerts().length, 0);
  const bad = await handler(signedEvent(orderCreated({ productName: 'Pro Bundle', variantId: 999 })));
  assert.equal(bad.statusCode, 500, 'with the list set, a "Pro…" name alone does not make an order a subscription');
  assert.equal(alerts().length, 1);
});

test('a failed or impossible alert mail still leaves a durable trace (500 + processed=false)', async () => {
  resendStatus = 500;
  const viaFailedMail = await handler(signedEvent(orderCreated({ productName: 'Deutsch A2.1', variantId: 6161 })));
  assert.equal(viaFailedMail.statusCode, 500);
  assert.ok(loggedFailure());

  supabaseCalls = [];
  delete process.env.RESEND_API_KEY;
  const viaNoKey = await handler(signedEvent(orderCreated({ productName: 'Deutsch A2.1', variantId: 6161 })));
  assert.equal(viaNoKey.statusCode, 500);
  assert.ok(loggedFailure());
});

test('a test-mode unrouted order is tagged [TEST], so a dashboard test run shows the misconfiguration', async () => {
  await handler(signedEvent(orderCreated({ productName: 'B1-Prüfungsprogramm', variantId: 5151, testMode: true })));
  const [alert] = alerts();
  assert.ok(alert, 'test-mode orders must alert too — that is how the owner tests a new product');
  assert.match(alert.subject, /^\[TEST\] /);
});
