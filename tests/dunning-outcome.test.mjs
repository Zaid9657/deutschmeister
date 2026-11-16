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
let claims;
let providerKeys;
let failReceipt;
let subscriptions;
let logs;

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
    if (value.startsWith('lte.')) return Date.parse(actual) <= Date.parse(value.slice(4));
    if (value.startsWith('gt.')) return Date.parse(actual) > Date.parse(value.slice(3));
    if (value.startsWith('in.(')) return value.slice(4, -1).split(',').includes(String(actual));
    throw new Error(`unhandled filter ${key}=${value}`);
  });
}

globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  const method = (init.method || 'GET').toUpperCase();
  if (href.startsWith('https://api.resend.com')) {
    const mail = JSON.parse(init.body);
    const key = new Headers(init.headers).get('Idempotency-Key');
    if (!key || !providerKeys.has(key)) mails.push(mail);
    if (key && customerStatus === 200 && !customerThrows) providerKeys.add(key);
    if (mail.to[0] === OWNER) return json({ id: 'owner' });
    if (customerThrows) throw new Error('socket hang up');
    return json(customerStatus === 200 ? { id: 'customer' } : { message: 'unavailable' }, customerStatus);
  }
  const u = new URL(href);
  assert.equal(u.host, 'supabase.dunning.stub', 'the harness contacts nothing else');
  if (u.pathname === '/rest/v1/rpc/claim_retryable_mail') {
    const p = JSON.parse(init.body);
    let row = claims.find((r) => r.message_key === p.p_key);
    if (!row) row = claims.find((r) => r.scope_key === p.p_scope && !r.accepted_at);
    if (!row && claims.some((r) => r.scope_key === p.p_scope && r.accepted_at)) return json([]);
    if (!row) {
      row = { message_key: p.p_key, scope_key: p.p_scope, message: p.p_message, first_attempt_at: new Date().toISOString() };
      claims.push(row);
    }
    return json([row]);
  }
  if (u.pathname === '/rest/v1/mail_delivery_claims' && method === 'PATCH') {
    const patch = JSON.parse(init.body);
    if (failReceipt && patch.accepted_at) return json({ message: 'receipt unavailable' }, 500);
    for (const row of claims.filter((r) => matches(r, u.searchParams))) Object.assign(row, patch);
    return new Response(null, { status: 204 });
  }
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
  const table = { '/rest/v1/subscriptions': subscriptions, '/rest/v1/webhook_logs': logs }[u.pathname];
  if (table && method === 'GET') {
    return json(table.filter((row) => matches(row, u.searchParams)).slice(0, Number(u.searchParams.get('limit') || 1e9)).map((row) => project(row, u.searchParams.get('select'))));
  }
  return method === 'GET' ? json([]) : new Response(null, { status: 201 });
};

const { handler, sendDunningFollowups } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');

beforeEach(() => {
  delete process.env.PAYMENT_RECOVERY_RETRY_ENABLED;
  claims = []; providerKeys = new Set(); failReceipt = false;
  failures = [];
  mails = [];
  customerStatus = 200;
  customerThrows = false;
  subscriptions = [{ lemonsqueezy_subscription_id: SUB, status: 'past_due' }];
  logs = [];
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


test('owner-gated retry: failed acceptance keeps one claim across invoice retries and concurrent events', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  customerStatus = 503;
  await handler(paymentFailed('inv-1'));
  assert.equal(claims.length, 1);
  assert.equal(claims[0].accepted_at, undefined);
  customerStatus = 200;
  await Promise.all([handler(paymentFailed('inv-2')), handler(paymentFailed('inv-3'))]);
  assert.equal(claims.length, 1, 'next invoices retry the original pending message');
  assert.equal(providerKeys.size, 1, 'one provider message for the subscription');
  assert.ok(claims[0].accepted_at);
  assert.match(ownerAlerts().at(-1).text, /accepted.*delivery is not yet verified/);
  await handler(paymentFailed('inv-4'));
  assert.equal(providerKeys.size, 1);
});

test('owner-gated retry: acceptance followed by a lost ledger stamp reuses the provider key', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  failReceipt = true;
  await handler(paymentFailed('inv-1'));
  assert.equal(providerKeys.size, 1);
  assert.equal(claims[0].accepted_at, undefined);
  assert.match(ownerAlerts()[0].text, /requires reconciliation/);
  assert.doesNotMatch(ownerAlerts()[0].text, /NOT sent|Forward.*by hand/);
  failReceipt = false;
  await handler(paymentFailed('inv-1'));
  assert.equal(providerKeys.size, 1);
  assert.equal(customerMails().length, 1);
  assert.ok(claims[0].accepted_at);
});

// ─── The 3-day follow-up (plan "Stop the leaks", step 6) ─────────────────────
// Until now a failed renewal got one dunning mail and nothing more unless Lemon
// Squeezy fired another failure over 7 days later. sendDunningFollowups (run by
// the hourly sentinel tick) sends the SAME mail once more when the failure is 3
// days old and the subscription is still past_due. Owner-gated by
// PAYMENT_RECOVERY_RETRY_ENABLED; claimed in the retry ledger before the send.

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const age = (invoiceId, ms) => { failures.find((r) => r.lemonsqueezy_event_id === invoiceId).failed_at = new Date(Date.now() - ms).toISOString(); };
const followups = () => claims.filter((c) => c.message_key.startsWith('dunning_followup:'));

test('follow-up ships off: without PAYMENT_RECOVERY_RETRY_ENABLED nothing is read, claimed or sent', async () => {
  await handler(paymentFailed('inv-1'));
  age('inv-1', 3 * DAY + HOUR);
  mails = [];
  assert.deepEqual(await sendDunningFollowups(), { enabled: false });
  assert.equal(mails.length, 0);
  assert.equal(claims.length, 0);
});

test('one follow-up 3 days after an unrecovered failure: the same dunning mail, claimed first, never twice', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  await handler(paymentFailed('inv-1'));
  const [first] = customerMails();
  assert.ok(first, 'the first dunning mail went out');

  age('inv-1', 2 * DAY);
  await sendDunningFollowups();
  assert.equal(customerMails().length, 1, 'not before 3 days');

  age('inv-1', 3 * DAY + HOUR);
  const out = await sendDunningFollowups();
  assert.equal(out.sent, 1);
  const second = customerMails()[1];
  assert.ok(second, 'the follow-up went out');
  for (const k of ['from', 'to', 'subject', 'html']) assert.deepEqual(second[k], first[k], `the follow-up reuses the dunning ${k}`);
  assert.deepEqual(followups().map((c) => [c.message_key, c.scope_key]), [['dunning_followup:inv-1', `dunning_followup:${SUB}`]]);
  assert.ok(followups()[0].accepted_at, 'claimed in the ledger and stamped on acceptance');

  await sendDunningFollowups();
  await Promise.all([sendDunningFollowups(), sendDunningFollowups()]);
  assert.equal(customerMails().length, 2, 'repeated and concurrent ticks never send it again');
  assert.equal(ownerAlerts().length, 1, 'the follow-up adds no owner mail');
});

test('a failure older than 7 days gets no follow-up (a new failure opens a new round)', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  await handler(paymentFailed('inv-1'));
  age('inv-1', 8 * DAY);
  mails = [];
  await sendDunningFollowups();
  assert.equal(mails.length, 0);
  assert.equal(followups().length, 0);
});

test('no follow-up once the subscription recovered, was cancelled, expired, or its state is unknown', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  await handler(paymentFailed('inv-1'));
  age('inv-1', 3 * DAY + HOUR);
  const failedAt = failures[0].failed_at;
  mails = [];
  for (const status of ['active', 'cancelled', 'expired', 'unpaid', 'paused', null]) {
    subscriptions = status ? [{ lemonsqueezy_subscription_id: SUB, status }] : [];
    await sendDunningFollowups();
    assert.equal(mails.length, 0, `no mail for status ${status}`);
  }
  // Still past_due on our side, but a payment arrived after the failure.
  subscriptions = [{ lemonsqueezy_subscription_id: SUB, status: 'past_due' }];
  for (const event_type of ['subscription_payment_success', 'subscription_payment_recovered']) {
    logs = [{ id: 1, event_type, created_at: new Date(Date.parse(failedAt) + HOUR).toISOString(), payload: { data: { attributes: { subscription_id: Number(SUB) } } } }];
    await sendDunningFollowups();
    assert.equal(mails.length, 0, `no mail after ${event_type}`);
  }
  assert.equal(followups().length, 0, 'nothing is claimed for a subscription that is not owed a reminder');
  // Positive control: an older payment (before this failure) does not stop it.
  logs = [{ id: 2, event_type: 'subscription_payment_success', created_at: new Date(Date.parse(failedAt) - DAY).toISOString(), payload: { data: { attributes: { subscription_id: Number(SUB) } } } }];
  await sendDunningFollowups();
  assert.equal(customerMails().length, 1);
});

test('a refused follow-up keeps its claim; the next tick retries the same message and key, once', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  await handler(paymentFailed('inv-1'));
  age('inv-1', 3 * DAY + HOUR);
  customerStatus = 503;
  const held = await sendDunningFollowups();
  assert.equal(held.sent, 0);
  assert.equal(held.held.length, 1, 'the refused send is reported for reconciliation');
  assert.equal(followups()[0].accepted_at, undefined, 'not stamped as accepted');
  customerStatus = 200;
  assert.equal((await sendDunningFollowups()).sent, 1);
  assert.ok(providerKeys.has('dunning_followup:inv-1'), 'the stored idempotency key was reused');
  assert.equal(followups().length, 1, 'one claim, never a second one');
  const before = mails.length;
  await sendDunningFollowups();
  assert.equal(mails.length, before);
});

test('the hourly sentinel tick runs the follow-up for scheduler calls only', async () => {
  process.env.PAYMENT_RECOVERY_RETRY_ENABLED = 'true';
  delete process.env.SENTINEL_ENABLED;
  await handler(paymentFailed('inv-1'));
  age('inv-1', 3 * DAY + HOUR);
  mails = [];
  const { handler: sentinel } = await import('../netlify/functions/sentinel.mjs');
  await sentinel({ httpMethod: 'POST', headers: {}, queryStringParameters: {}, body: '' });
  assert.equal(mails.length, 0, 'a manual or unauthenticated call sends nothing');
  const res = await sentinel({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ next_run: new Date().toISOString() }) });
  assert.equal(res.statusCode, 200, 'the sentinel result is returned unchanged');
  assert.equal(customerMails().length, 1, 'the scheduler tick sends the follow-up even with SENTINEL_ENABLED off');
});
