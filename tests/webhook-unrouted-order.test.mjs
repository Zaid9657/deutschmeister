// A paid order the webhook cannot route must reach the owner, not vanish.
//
// The failure this pins (found 2026-10-11): a one-time product whose
// functions-scope LEMONSQUEEZY_*_VARIANT_ID is unset or wrong falls through
// courseForVariant() into the subscription lane, which only backfills
// price_paid — so the customer is charged, nothing is granted, and the webhook
// still answers 200. The fix alerts the owner for every paid order that is
// neither a routed course nor the Pro subscription.
//
// Behavioural, not structural: the real handler runs against a stubbed fetch
// (Supabase REST and Resend both go through global fetch).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';

const resendCalls = [];
globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  if (href.startsWith('https://api.resend.com')) {
    resendCalls.push(JSON.parse(init.body));
    return new Response('{"id":"stub"}', { status: 200, headers: { 'content-type': 'application/json' } });
  }
  // Supabase PostgREST: an empty result for every read and write.
  return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

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

test('an unrouted paid one-time order alerts the owner with the variant id to configure', async () => {
  resendCalls.length = 0;
  const res = await handler(signedEvent(orderCreated({ productName: 'Deutsch A1.2', variantId: 4242 })));
  assert.equal(res.statusCode, 200);
  const alert = resendCalls.find((c) => /NOT delivered/.test(c.subject));
  assert.ok(alert, 'no owner alert was sent for a paid order that granted nothing');
  assert.deepEqual(alert.to, ['zaid@deutsch-meister.de']);
  assert.match(alert.text, /4242/, 'the alert must name the variant id the owner has to configure');
  assert.match(alert.text, /buyer@example\.com/, 'the alert must name the customer');
});

test('a Pro subscription order does not alert (its grant arrives with subscription_created)', async () => {
  resendCalls.length = 0;
  const res = await handler(signedEvent(orderCreated({ productName: 'Pro Monthly', variantId: 1393033 })));
  assert.equal(res.statusCode, 200);
  assert.equal(resendCalls.filter((c) => /NOT delivered/.test(c.subject)).length, 0);
});

test('a test-mode unrouted order is tagged [TEST], so a dashboard test run shows the misconfiguration', async () => {
  resendCalls.length = 0;
  await handler(signedEvent(orderCreated({ productName: 'B1-Prüfungsprogramm', variantId: 5151, testMode: true })));
  const alert = resendCalls.find((c) => /NOT delivered/.test(c.subject));
  assert.ok(alert, 'test-mode orders must alert too — that is how the owner tests a new product');
  assert.match(alert.subject, /^\[TEST\] /);
});
