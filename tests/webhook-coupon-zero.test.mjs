// A coupon is redeemed only when Lemon Squeezy actually applied a discount.
//
// The checkout carries the code twice: checkout[discount_code] pre-fills a field
// the buyer can still edit or clear, and checkout[custom][coupon] comes back on
// the webhook as meta.custom_data.coupon. The ledger trusted the custom field
// alone, so an order paid at full price (code removed at checkout, or refused
// by Lemon Squeezy) still wrote a 'paid' coupon_redemptions row with
// discount_amount 0 — coupon-validate then refused the learner's next attempt
// ("bereits eingelöst"), new-customer codes refused them, and the row counted
// against the code's total limit. Behavioural: the real handler, stubbed fetch.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.coupon.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
delete process.env.RESEND_API_KEY;
delete process.env.LEMONSQUEEZY_PRO_VARIANT_IDS;

const COUPON = { id: '00000000-0000-0000-0000-0000000000c1', currency: 'EUR' };
let redemptions = [];

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(String(url));
  assert.equal(u.host, 'supabase.coupon.stub', 'the harness never contacts Resend or Lemon Squeezy');
  const method = (init.method || 'GET').toUpperCase();
  if (u.pathname === '/rest/v1/coupons') {
    return json(u.searchParams.get('normalized_code') === 'eq.WELCOME20' ? [COUPON] : []);
  }
  if (u.pathname === '/rest/v1/coupon_redemptions' && method === 'POST') {
    redemptions.push(JSON.parse(init.body));
    return new Response(null, { status: 201 });
  }
  return method === 'GET' ? json([]) : new Response(null, { status: 204 });
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');
beforeEach(() => { redemptions = []; });

function signed(payload) {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  return { httpMethod: 'POST', headers: { 'x-signature': signature }, body };
}

// A Pro subscription order: its grant arrives with subscription_created, so the
// order event itself only runs the ledger and the price backfill.
const order = (id, { discount, total }) => ({
  meta: { event_name: 'order_created', test_mode: false, custom_data: { user_id: '00000000-0000-0000-0000-000000000001', coupon: 'welcome20' } },
  data: {
    id,
    attributes: {
      status: 'paid', total, discount_total: discount, currency: 'EUR', user_email: 'buyer@example.com',
      first_order_item: { variant_id: 1393033, product_name: 'Pro Monthly', variant_name: 'Monthly' },
    },
  },
});

test('a full-price order that carried a coupon code records no redemption', async () => {
  const res = await handler(signed(order('701', { discount: 0, total: 999 })));
  assert.equal(res.statusCode, 200, res.body);
  assert.deepEqual(redemptions, [], 'no discount applied → the code stays unused');
});

test('a discounted order still records exactly one redemption with its amounts', async () => {
  const res = await handler(signed(order('702', { discount: 200, total: 799 })));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(redemptions.length, 1);
  assert.equal(redemptions[0].coupon_id, COUPON.id);
  assert.equal(redemptions[0].order_id, '702');
  assert.equal(redemptions[0].discount_amount, 200);
  assert.equal(redemptions[0].final_amount, 799);
  assert.equal(redemptions[0].original_amount, 999);
});
