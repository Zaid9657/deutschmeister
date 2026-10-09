// The dunning mail's "Update payment method" button must lead to a page that can
// change a card. Until 2026-09-30 it pointed at /dashboard for every failure
// (2 of 2 mails sent, measured in the Resend logs): the subscription-invoice that
// subscription_payment_failed delivers carries only urls.invoice_url, and the
// fallback was our own dashboard. The fixtures below mirror the url keys
// measured on the production payloads; the URLs themselves are placeholders.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BILLING_PORTAL_URL,
  SIGNED_URL_MAX_AGE_MS,
  isLemonSqueezyUrl,
  pickUpdatePaymentUrl,
} from '../netlify/functions/_shared/dunningLink.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const SUB = '2468000';
const SIGNED = 'https://deutsch-meister.lemonsqueezy.com/subscription/2468000/payment-details?expires=1&signature=test';
const invoice = { status: 'pending', subscription_id: Number(SUB), urls: { invoice_url: 'https://app.lemonsqueezy.com/my-orders/x/subscription-invoice/y' } };
const subscriptionUpdated = (createdAt, { id = SUB, url = SIGNED, status = 'past_due' } = {}) => ({
  created_at: createdAt,
  payload: {
    meta: { event_name: 'subscription_updated' },
    data: {
      id,
      attributes: {
        status,
        urls: { customer_portal: 'https://deutsch-meister.lemonsqueezy.com/billing?expires=1&signature=p', update_payment_method: url, customer_portal_update_subscription: 'https://x.lemonsqueezy.com/u' },
      },
    },
  },
});
const at = (iso) => Date.parse(iso);

test('the portal fallback is a stable Lemon Squeezy page, never our dashboard', () => {
  assert.equal(BILLING_PORTAL_URL, 'https://deutsch-meister.lemonsqueezy.com/billing');
  assert.ok(isLemonSqueezyUrl(BILLING_PORTAL_URL));
  assert.ok(!isLemonSqueezyUrl('https://deutsch-meister.de/dashboard'));
  assert.ok(!isLemonSqueezyUrl('http://deutsch-meister.lemonsqueezy.com/billing'), 'plain http is refused');
  assert.ok(!isLemonSqueezyUrl('https://lemonsqueezy.com.evil.example/billing'), 'lookalike hosts are refused');
  assert.ok(!isLemonSqueezyUrl(undefined));
});

test('an invoice alone (the production shape) yields the portal, not a dead link', () => {
  const r = pickUpdatePaymentUrl({ invoiceAttributes: invoice, subscriptionEvents: [], subscriptionId: SUB });
  assert.deepEqual(r, { url: BILLING_PORTAL_URL, source: 'portal' });
});

test('replay 2026-09-26: past_due update logged 0.6 s before the failure → signed link', () => {
  const now = at('2026-09-26T13:56:41.091Z');
  const events = [
    subscriptionUpdated('2026-09-26T12:56:11.755Z', { status: 'active', url: `${SIGNED}&renewal` }),
    subscriptionUpdated('2026-09-26T13:56:40.520Z'),
  ];
  const r = pickUpdatePaymentUrl({ invoiceAttributes: invoice, subscriptionEvents: events, subscriptionId: SUB, now });
  assert.deepEqual(r, { url: SIGNED, source: 'subscription_updated' }, 'the newest fresh link wins');
});

test('replay 2026-09-27: the failure arrives before its past_due update → the renewal-attempt link an hour earlier', () => {
  const now = at('2026-09-27T08:55:18.571Z');
  const events = [subscriptionUpdated('2026-09-27T07:54:59.019Z', { status: 'active' })];
  const r = pickUpdatePaymentUrl({ invoiceAttributes: invoice, subscriptionEvents: events, subscriptionId: SUB, now });
  assert.equal(r.source, 'subscription_updated');
  assert.equal(r.url, SIGNED);
});

test('a signed link older than the window is not mailed; the portal is', () => {
  const now = at('2026-09-29T02:55:20.964Z');
  const stale = new Date(now - SIGNED_URL_MAX_AGE_MS - 1000).toISOString();
  const r = pickUpdatePaymentUrl({ invoiceAttributes: invoice, subscriptionEvents: [subscriptionUpdated(stale)], subscriptionId: SUB, now });
  assert.equal(r.source, 'portal');
  assert.ok(SIGNED_URL_MAX_AGE_MS < 24 * 60 * 60 * 1000, 'the window stays inside the 24 h signature');
});

test('another subscription\'s link, or a non-Lemon-Squeezy URL, is never used', () => {
  const now = at('2026-09-27T08:55:18.571Z');
  const events = [
    subscriptionUpdated('2026-09-27T08:55:10.000Z', { id: '9999999' }),
    subscriptionUpdated('2026-09-27T08:55:11.000Z', { url: 'https://deutsch-meister.de/dashboard' }),
  ];
  const r = pickUpdatePaymentUrl({ invoiceAttributes: invoice, subscriptionEvents: events, subscriptionId: SUB, now });
  assert.equal(r.source, 'portal');
});

test('an invoice that does carry the link uses it directly', () => {
  const r = pickUpdatePaymentUrl({ invoiceAttributes: { ...invoice, urls: { invoice_url: 'x', update_payment_method: SIGNED } }, subscriptionId: SUB });
  assert.deepEqual(r, { url: SIGNED, source: 'invoice' });
});

test('the webhook resolves the link through the helper and never falls back to /dashboard', () => {
  const src = read('netlify/functions/lemonsqueezy-webhook.mjs');
  assert.ok(src.includes("from './_shared/dunningLink.mjs'"), 'the webhook must use the shared resolver');
  assert.ok(!/update_payment_method\s*\|\|\s*'https:\/\/deutsch-meister\.de/.test(src), 'no fallback to our own site');
  assert.ok(!src.includes("'https://deutsch-meister.de/dashboard'"), 'the dashboard cannot change a card; it is never the dunning link');
  // The lookup reads only this subscription's subscription_updated rows inside the signature window.
  assert.ok(/\.eq\('event_type', 'subscription_updated'\)/.test(src));
  assert.ok(/\.eq\('payload->data->>id', String\(subscriptionId\)\)/.test(src));
  assert.ok(/SIGNED_URL_MAX_AGE_MS/.test(src));
  // The mail carries both the button and the stable portal line.
  assert.ok(src.includes('DUNNING_HTML(updateUrl, BILLING_PORTAL_URL)'));
  assert.ok(/const DUNNING_HTML = \(updateUrl, portalUrl\)/.test(src));
  const html = src.slice(src.indexOf('const DUNNING_HTML'));
  assert.ok(html.includes('href="${updateUrl}"') && html.includes('href="${portalUrl}"'));
  // The link is resolved before the customer send, after the 7-day rate limit.
  assert.ok(src.indexOf('await updatePaymentLink(') > src.indexOf('already emailed within 7 days'));
  assert.ok(src.indexOf('await updatePaymentLink(') < src.indexOf("subject: 'Your DeutschMeister payment didn’t go through'"));
});
