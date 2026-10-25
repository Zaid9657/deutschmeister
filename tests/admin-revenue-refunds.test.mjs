// A refund lowers net revenue on the admin dashboard and in the founder report.
//
// The original payment payload is logged when the money arrives, so its
// refunded_amount is 0; the refund arrives later as its own webhook event —
// order_refunded (data.id = the order id) or subscription_payment_refunded
// (data.id = the subscription-invoice id). revenueGroup read only the payment
// events, so "Umsatz (netto) — abzüglich Steuer und Erstattungen" never dropped:
// a €49 course with VAT, fully refunded, still counted its whole net. The
// refund is now joined to its payment: refunded = min(gross, largest refund
// seen), the refunded share of the VAT is given back, and a full refund nets 0.

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID = '2088862';

const { paymentsFromWebhookRows, sumByCurrency } = await import('../netlify/functions/_shared/adminRevenueLib.mjs');
const { revenueGroup } = await import('../netlify/functions/_shared/adminCockpit.mjs');

const COURSE = new Set(['2088862']);
const wh = (event_type, id, attributes, meta = {}) => ({
  event_type, created_at: attributes.updated_at || attributes.created_at,
  payload: { meta: { test_mode: false, ...meta }, data: { id, attributes } },
});
// €49.00 including 19 % VAT.
const sale = { status: 'paid', total: 4900, subtotal: 4118, tax: 782, refunded_amount: 0, currency: 'EUR', created_at: '2026-10-02T09:00:00Z', first_order_item: { variant_id: 2088862, product_name: 'Deutsch A2.1' } };
const refundOf = (amount, at = '2026-10-05T12:00:00Z') => ({ ...sale, status: amount >= sale.total ? 'refunded' : 'partial_refund', refunded: amount >= sale.total, refunded_amount: amount, updated_at: at });

test('a fully refunded sale nets 0 and reports the refund', () => {
  const payments = paymentsFromWebhookRows([wh('order_created', 9001, sale), wh('order_refunded', 9001, refundOf(4900))], { courseVariantIds: COURSE });
  assert.equal(payments.length, 1, 'the refund event is not a payment');
  const [p] = payments;
  assert.equal(p.refunded, 4900);
  assert.equal(p.net, 0);
  const eur = sumByCurrency(payments).EUR;
  assert.equal(eur.net, 0);
  assert.equal(eur.refunded, 4900);
  assert.equal(eur.gross, 4900);
});

test('a partial refund is proportional (its VAT share is given back), and repeated refunds take the largest total', () => {
  const rows = [wh('order_created', 9001, sale), wh('order_refunded', 9001, refundOf(1000, '2026-10-04T00:00:00Z')), wh('order_refunded', 9001, refundOf(2450))];
  const [p] = paymentsFromWebhookRows(rows, { courseVariantIds: COURSE });
  assert.equal(p.refunded, 2450);
  assert.equal(p.net, (4900 - 782) / 2, 'half the money back is half the net revenue');
  // A refund never takes more than the payment.
  const [capped] = paymentsFromWebhookRows([wh('order_created', 9001, sale), wh('order_refunded', 9001, refundOf(99999))], { courseVariantIds: COURSE });
  assert.equal(capped.refunded, 4900);
  assert.equal(capped.net, 0);
});

test('a refunded renewal joins its invoice; another order or invoice id is untouched; test-mode refunds are ignored', () => {
  const renewal = { status: 'paid', total: 1189, tax: 190, currency: 'EUR', billing_reason: 'renewal', subscription_id: 2177689, created_at: '2026-10-03T00:00:00Z' };
  const rows = [
    wh('subscription_payment_success', 555, renewal),
    wh('subscription_payment_refunded', 555, { ...renewal, status: 'refunded', refunded: true, refunded_amount: 1189, updated_at: '2026-10-06T00:00:00Z' }),
    wh('order_created', 9002, { ...sale, created_at: '2026-10-07T00:00:00Z' }),
    wh('order_refunded', 9002, refundOf(4900, '2026-10-08T00:00:00Z'), { test_mode: true }),
    // An order refund never reaches a renewal invoice that happens to share the number.
    wh('order_refunded', 555, refundOf(4900, '2026-10-09T00:00:00Z')),
  ];
  const payments = paymentsFromWebhookRows(rows, { courseVariantIds: COURSE });
  assert.deepEqual(payments.map((p) => [p.kind, p.refunded, p.net]), [['renewal', 1189, 0], ['course', 0, 4900 - 782]]);
});

test('revenueGroup loads the refund events, so the dashboard and founder report net out refunds', async () => {
  const logged = [
    wh('order_created', 9001, sale),
    wh('order_refunded', 9001, refundOf(4900)),
  ];
  const db = {
    from(table) {
      assert.equal(table, 'webhook_logs');
      let types = null;
      const query = {
        select() { return query; },
        in(key, values) { assert.equal(key, 'event_type'); types = values; return query; },
        order() { return query; },
        range(from, to) {
          const rows = logged.filter((row) => !types || types.includes(row.event_type));
          return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
        },
      };
      return query;
    },
  };
  const w = { from: '2026-10-01T00:00:00Z', to: '2026-10-25T00:00:00Z', previousFrom: '2026-09-07T00:00:00Z', previousTo: '2026-10-01T00:00:00Z' };
  const r = await revenueGroup(db, w);
  assert.equal(r.current.EUR.net, 0, 'Umsatz netto after a full refund');
  assert.equal(r.current.EUR.refunded, 4900);
  assert.equal(r.allTime.EUR.net, 0);
  assert.equal(r.paymentsCounted, 1);
  assert.equal(r.series.find((d) => d.day === '2026-10-02').net, 0);
});
