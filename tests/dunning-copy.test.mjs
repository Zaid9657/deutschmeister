// The payment-failed mail says what the access rule does.
//
// Failed renewals keep zero grace: subscription_end stays the last confirmed
// paid-through date (subscriptionEntitlement.mjs), so Pro stops at the failed
// renewal and the app sends the learner to /subscription. The dunning mail sent
// in the same delivery promised "your access continues without interruption".
// This suite couples the two: it measures the grace the entitlement rule gives
// a past_due subscription, and while that grace is zero the mail may not promise
// continued access and must say access is paused. If a grace period is ever
// introduced (an owner decision), this test changes together with the copy.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { subscriptionEventRow, subscriptionHasPaidAccess } from '../netlify/functions/_shared/subscriptionEntitlement.mjs';

process.env.SUPABASE_URL = 'http://supabase.dunning-copy.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';

const mails = [];
globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  if (href.startsWith('https://api.resend.com')) {
    mails.push(JSON.parse(init.body));
    return new Response('{"id":"stub"}', { status: 200, headers: { 'content-type': 'application/json' } });
  }
  assert.equal(new URL(href).host, 'supabase.dunning-copy.stub');
  return (init.method || 'GET') === 'GET'
    ? new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
    : new Response(null, { status: 201 });
};
const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

/** Milliseconds of access a past_due subscription keeps after its failed renewal. */
function pastDueGraceMs() {
  const renewal = Date.parse('2026-02-01T00:00:00Z');
  const prior = { user_id: 'u', plan_type: 'monthly', status: 'active', lemonsqueezy_subscription_id: 'sub-1', subscription_start: '2026-01-01T00:00:00Z', subscription_end: new Date(renewal).toISOString() };
  // Lemon Squeezy's past_due renews_at is the next retry, a week later.
  const data = { id: 'sub-1', attributes: { status: 'past_due', created_at: prior.subscription_start, renews_at: '2026-02-08T00:00:00Z', variant_name: 'Pro Monthly' } };
  const row = subscriptionEventRow(prior, data, 'subscription_updated', renewal - 60000);
  let t = renewal - 60000;
  while (subscriptionHasPaidAccess(row, t) && t < renewal + 30 * 86400000) t += 60000;
  return Math.max(0, t - renewal);
}

async function dunningMailText() {
  const payload = {
    meta: { event_name: 'subscription_payment_failed', custom_data: { user_id: '00000000-0000-0000-0000-000000000001' } },
    data: { id: 'inv-1', attributes: { subscription_id: 3300001, status: 'failed', billing_reason: 'renewal', user_email: 'learner@example.com' } },
  };
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  assert.equal((await handler({ httpMethod: 'POST', headers: { 'x-signature': signature }, body })).statusCode, 200);
  const mail = mails.find((m) => m.to[0] === 'learner@example.com');
  assert.ok(mail, 'the dunning mail was sent');
  return mail.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

test('while failed renewals keep zero grace, the dunning mail says access is paused and never promises it continues', async () => {
  const grace = pastDueGraceMs();
  const text = await dunningMailText();
  if (grace === 0) {
    assert.doesNotMatch(text, /without interruption|uninterrupted|access continues|keep (?:your )?access|still have access/i,
      'zero grace: the mail must not promise continued access');
    assert.match(text, /access is paused/i, 'zero grace: the mail says access is paused until the payment goes through');
  } else {
    assert.fail(`past_due now keeps ${grace} ms of access — rewrite the dunning copy for that grace and update this test with it`);
  }
});
