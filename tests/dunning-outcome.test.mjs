// The payment-failed (dunning) mail: the owner alert tells the truth about the
// send, and only a DELIVERED mail starts the 7-day quiet period.
//
// The failure this pins (C-202): the payment_failures row was written before
// the mail, and the 7-day rate limit counted any such row. When Resend answered
// 5xx/429/403 or fetch threw, every Lemon Squeezy retry in the next 7 days hit
// "already emailed" — the customer never heard, while the owner alert still said
// "The customer was sent a dunning email", because it only tested that an
// address existed. Now the alert carries the outcome (and the update link, to
// forward by hand), and a delivered send stamps dunning_sent_at on its row —
// the only thing the gate reads. Behavioural: the real handler, stubbed fetch.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { BILLING_PORTAL_URL } from '../netlify/functions/_shared/dunningLink.mjs';

process.env.SUPABASE_URL = 'http://supabase.dunning.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';

const OWNER = 'zaid@deutsch-meister.de';
const SUB = '3300001';
let failures;
let mails;
let customerStatus;
let customerThrows;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const field = (row, path) => path.split(/->>?/).reduce((value, key) => value?.[key], row);
/** PostgREST select: plain columns and aliased JSON paths (alias:col->>key). */
function project(row, select) {
  if (!select || select === '*') return row;
  return Object.fromEntries(select.split(',').map((item) => {
    const [alias, path] = item.includes(':') ? item.split(':') : [item, item];
    return [alias, field(row, path)];
  }));
}
function matches(row, params) {
  return [...params].every(([key, value]) => {
    if (['select', 'limit', 'order', 'on_conflict'].includes(key)) return true;
    const actual = field(row, key);
    if (value === 'not.is.null') return actual != null;
    if (value === 'is.null') return actual == null;
    if (value.startsWith('eq.')) return String(actual) === value.slice(3);
    if (value.startsWith('gte.')) return Date.parse(actual) >= Date.parse(value.slice(4));
    throw new Error(`unhandled filter ${key}=${value}`);
  });
}

globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  const method = (init.method || 'GET').toUpperCase();
  if (href.startsWith('https://api.resend.com')) {
    const mail = JSON.parse(init.body);
    mails.push(mail);
    if (mail.to[0] === OWNER) return json({ id: 'owner' });
    if (customerThrows) throw new Error('socket hang up');
    return json(customerStatus === 200 ? { id: 'customer' } : { message: 'unavailable' }, customerStatus);
  }
  const u = new URL(href);
  assert.equal(u.host, 'supabase.dunning.stub', 'the harness contacts nothing else');
  if (u.pathname === '/rest/v1/payment_failures') {
    if (method === 'GET') {
      const rows = failures.filter((row) => matches(row, u.searchParams)).slice(0, Number(u.searchParams.get('limit') || 1e9));
      return json(rows.map((row) => project(row, u.searchParams.get('select'))));
    }
    if (method === 'POST') {
      const row = JSON.parse(init.body);
      if (!failures.some((r) => r.lemonsqueezy_event_id === row.lemonsqueezy_event_id)) failures.push({ id: `pf-${failures.length + 1}`, failed_at: new Date().toISOString(), ...row });
      return new Response(null, { status: 201 });
    }
    if (method === 'PATCH') {
      const patch = JSON.parse(init.body);
      for (const row of failures.filter((r) => matches(r, u.searchParams))) Object.assign(row, patch);
      return new Response(null, { status: 204 });
    }
  }
  return method === 'GET' ? json([]) : new Response(null, { status: 201 });
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

beforeEach(() => {
  failures = [];
  mails = [];
  customerStatus = 200;
  customerThrows = false;
});

function paymentFailed(invoiceId, { email = 'learner@example.com' } = {}) {
  const payload = {
    meta: { event_name: 'subscription_payment_failed', custom_data: { user_id: '00000000-0000-0000-0000-000000000001' } },
    data: { id: invoiceId, attributes: { subscription_id: Number(SUB), status: 'failed', billing_reason: 'renewal', user_email: email, urls: { invoice_url: 'https://example.invalid/invoice' } } },
  };
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  return { httpMethod: 'POST', headers: { 'x-signature': signature }, body };
}
const customerMails = () => mails.filter((m) => m.to[0] !== OWNER);
const ownerAlerts = () => mails.filter((m) => m.to[0] === OWNER);

test('a refused send is reported as NOT sent, with the link to forward, and the next retry mails again', async () => {
  customerStatus = 503;
  assert.equal((await handler(paymentFailed('inv-1'))).statusCode, 200, 'mail trouble never fails the webhook');
  assert.equal(customerMails().length, 1);
  const [first] = ownerAlerts();
  assert.ok(first, 'the owner is told');
  assert.match(first.text, /NOT sent/);
  assert.match(first.text, /Resend 503/);
  assert.doesNotMatch(first.text, /customer was sent/);
  assert.ok(first.text.includes(BILLING_PORTAL_URL), 'the update link is in the alert, to forward by hand');
  assert.equal(failures[0].raw_payload.dunning_sent_at, undefined, 'a refused send is not recorded as sent');

  // Lemon Squeezy's next failed retry of the same subscription: the mail goes out now.
  customerStatus = 200;
  await handler(paymentFailed('inv-2'));
  assert.equal(customerMails().length, 2, 'the retry was suppressed by the failed send');
  assert.match(ownerAlerts()[1].text, /customer was sent a dunning email/);
  assert.ok(failures.find((r) => r.lemonsqueezy_event_id === 'inv-2').raw_payload.dunning_sent_at, 'the delivered send is stamped');
});

test('a delivered send keeps the next retries quiet (one mail per subscription per 7 days)', async () => {
  await handler(paymentFailed('inv-1'));
  assert.equal(customerMails().length, 1);
  assert.equal(ownerAlerts().length, 1);
  await handler(paymentFailed('inv-2'));
  await handler(paymentFailed('inv-3'));
  assert.equal(customerMails().length, 1, 'no second customer mail within 7 days of a delivered one');
  assert.equal(ownerAlerts().length, 1);
  assert.equal(failures.length, 3, 'every failure is still logged');
});

test('a row from before delivered sends were stamped still keeps its 7-day quiet period (deploy transition)', async () => {
  // The previous code wrote rows with neither marker and counted any recent row
  // as emailed. A customer it mailed 24 hours ago must not get a second mail
  // just because this code was deployed in between.
  const legacy = { id: 'pf-legacy', lemonsqueezy_subscription_id: SUB, lemonsqueezy_event_id: 'inv-old',
    failed_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    raw_payload: { meta: { event_name: 'subscription_payment_failed' }, data: { id: 'inv-old' } } };
  failures.push(legacy);
  assert.equal((await handler(paymentFailed('inv-1'))).statusCode, 200);
  assert.equal(customerMails().length, 0, 'mailed by the previous code within 7 days: no second mail');
  assert.equal(ownerAlerts().length, 0, 'and no second owner alert, as before the deploy');
  assert.equal(failures.length, 2, 'the failure is still logged');

  // Once the legacy row is outside the old window it no longer counts, and the
  // unmailed row this code wrote does not suppress either.
  legacy.failed_at = new Date(Date.now() - 8 * 86400000).toISOString();
  await handler(paymentFailed('inv-2'));
  assert.equal(customerMails().length, 1);
  assert.match(ownerAlerts()[0].text, /customer was sent a dunning email/);
});

test('a throwing send or a missing address is reported as NOT sent, never as sent', async () => {
  customerThrows = true;
  await handler(paymentFailed('inv-1'));
  assert.match(ownerAlerts()[0].text, /NOT sent: threw/);
  customerThrows = false;
  await handler(paymentFailed('inv-2', { email: '' }));
  assert.match(ownerAlerts()[1].text, /NOT sent: no customer email/);
  assert.equal(customerMails().length, 1, 'no mail can be sent without an address');
});
