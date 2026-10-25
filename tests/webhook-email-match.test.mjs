// An order without custom user_id reaches its buyer by an EXACT e-mail match.
//
// Orders from a direct Lemon Squeezy link (a store page, a launch-mail
// checkout, the owner's "buyer signs up, then resend order_created" flow) carry
// no custom_data.user_id, so the webhook matches the buyer's e-mail. It used to
// (1) read only GoTrue's first page of auth users (50 of ~1,700 accounts) and
// (2) fall back to profiles.ilike('email', email) unescaped — '_' and '%' are
// wildcards — so al_ce@example.com matched alice@example.com and the purchase
// went to Alice; with two look-alikes the lookup errored and the owner got a
// false "no account" alert. Now every auth page is read, the profile pattern is
// escaped and every candidate is compared literally; an ambiguous or missing
// match falls through to the loud no-account alert and a 500.
// Behavioural: the real handler, stubbed fetch with ILIKE semantics.

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'http://supabase.email.stub';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'stub-service-role-key';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'stub-webhook-secret';
process.env.RESEND_API_KEY = 're_stub';
process.env.LEMONSQUEEZY_TELC_B1_VARIANT_ID = '2077984';

const ALICE = '00000000-0000-0000-0000-0000000000a1';
const BOB = '00000000-0000-0000-0000-0000000000b1';
const BOBX = '00000000-0000-0000-0000-0000000000b2';
const LATE = '00000000-0000-0000-0000-0000000000c1';
const STAFF = '00000000-0000-0000-0000-00000000005f';
let profiles;
let authUsers;
let purchases;
let mails;
let tickets;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const escapeRe = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** PostgREST maps '*' to '%', then Postgres ILIKE: '%' any run, '_' one character, '\' escapes. */
function ilike(value, pattern) {
  const p = pattern.replaceAll('*', '%');
  let re = '';
  for (let i = 0; i < p.length; i += 1) {
    const c = p[i];
    if (c === '\\' && i + 1 < p.length) re += escapeRe(p[(i += 1)]);
    else if (c === '%') re += '[\\s\\S]*';
    else if (c === '_') re += '[\\s\\S]';
    else re += escapeRe(c);
  }
  return new RegExp(`^${re}$`, 'i').test(String(value ?? ''));
}

globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  const method = (init.method || 'GET').toUpperCase();
  if (href.startsWith('https://api.resend.com')) {
    mails.push(JSON.parse(init.body));
    return json({ id: 'stub' });
  }
  const u = new URL(href);
  assert.equal(u.host, 'supabase.email.stub', 'the harness contacts nothing else');
  if (u.pathname === '/auth/v1/admin/users') {
    // GoTrue: page from 1, per_page defaults to 50.
    const page = Number(u.searchParams.get('page') || 1);
    const perPage = Number(u.searchParams.get('per_page') || 50);
    return json({ users: authUsers.slice((page - 1) * perPage, page * perPage), aud: 'authenticated' });
  }
  if (u.pathname.startsWith('/auth/v1/admin/users/')) {
    const user = authUsers.find((x) => x.id === u.pathname.split('/').at(-1));
    return user ? json(user) : json({ code: 404, error_code: 'user_not_found', msg: 'User not found' }, 404);
  }
  if (u.pathname === '/auth/v1/user') return json({ id: STAFF, email: 'staff@deutsch-meister.de' });
  if (u.pathname === '/rest/v1/profiles' && method === 'GET') {
    if (u.searchParams.get('id') === `eq.${STAFF}`) return json([{ role: 'admin', email: 'staff@deutsch-meister.de' }]);
    const filter = u.searchParams.get('email') || '';
    const rows = filter.startsWith('ilike.') ? profiles.filter((p) => ilike(p.email, filter.slice(6))) : [];
    return json(rows.slice(0, Number(u.searchParams.get('limit') || 1e9)));
  }
  if (['/rest/v1/support_tickets', '/rest/v1/support_ticket_messages', '/rest/v1/admin_audit_log'].includes(u.pathname) && method === 'POST') {
    const row = { id: 'row-1', ...JSON.parse(init.body) };
    if (u.pathname === '/rest/v1/support_tickets') tickets.push(row);
    return json([row], 201);
  }
  if (u.pathname === '/rest/v1/purchases') {
    const orderId = (u.searchParams.get('lemonsqueezy_order_id') || '').replace(/^eq\./, '');
    if (method === 'GET') return json(orderId ? [purchases.get(orderId)].filter(Boolean) : []);
    if (method === 'POST') {
      const row = JSON.parse(init.body);
      purchases.set(String(row.lemonsqueezy_order_id), row);
      return new Response(null, { status: 201 });
    }
  }
  return method === 'GET' ? json([]) : new Response(null, { status: 201 });
};

const { handler } = await import('../netlify/functions/lemonsqueezy-webhook.mjs');
const { handler: adminSupport } = await import('../netlify/functions/admin-support.mjs');

beforeEach(() => {
  profiles = [];
  authUsers = [];
  purchases = new Map();
  mails = [];
  tickets = [];
});

function courseOrder(orderId, email) {
  const payload = {
    meta: { event_name: 'order_created', test_mode: false, custom_data: {} },
    data: { id: orderId, attributes: { status: 'paid', total: 8900, total_formatted: '€89.00', user_email: email, first_order_item: { variant_id: 2077984, product_name: 'telc-B1-Prüfungsprobe' } } },
  };
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(body).digest('hex');
  return { httpMethod: 'POST', headers: { 'x-signature': signature }, body };
}
const noAccountAlerts = () => mails.filter((m) => /has no account/.test(m.subject));

test("a look-alike address ('_' is a wildcard) never receives the purchase; the owner is alerted", async () => {
  authUsers = [{ id: ALICE, email: 'alice@example.com' }];
  profiles = [{ id: ALICE, email: 'alice@example.com' }];
  const res = await handler(courseOrder('5001', 'al_ce@example.com'));
  assert.equal(res.statusCode, 500, 'an order nobody matches exactly fails, so Lemon Squeezy retries');
  assert.equal(purchases.size, 0, 'Alice must not receive a purchase paid by al_ce@example.com');
  assert.equal(noAccountAlerts().length, 1);
  assert.match(noAccountAlerts()[0].text, /al_ce@example\.com/);
});

test('an exact profile match resolves even beside a wildcard look-alike, ignoring case and spaces', async () => {
  profiles = [{ id: BOB, email: 'bob_smith@example.com' }, { id: BOBX, email: 'bobxsmith@example.com' }];
  const res = await handler(courseOrder('5002', ' Bob_Smith@Example.com '));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(purchases.get('5002')?.user_id, BOB);
  assert.equal(noAccountAlerts().length, 0);
});

test('two profiles with the same address are ambiguous: nobody is guessed', async () => {
  profiles = [{ id: BOB, email: 'bob_smith@example.com' }, { id: BOBX, email: 'BOB_SMITH@example.com' }];
  const res = await handler(courseOrder('5003', 'bob_smith@example.com'));
  assert.equal(res.statusCode, 500);
  assert.equal(purchases.size, 0);
  assert.equal(noAccountAlerts().length, 1);
});

test('an account beyond the first page of auth users is found', async () => {
  authUsers = Array.from({ length: 1500 }, (_, i) => ({ id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`, email: `user${i}@example.com` }));
  authUsers[1200] = { id: LATE, email: 'late@example.com' };
  const res = await handler(courseOrder('5004', 'late@example.com'));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(purchases.get('5004')?.user_id, LATE);
});

test('a ticket staff open for an e-mail links only the account with exactly that address', async () => {
  profiles = [{ id: ALICE, email: 'alice@example.com' }];
  const open = (userEmail) => adminSupport({
    httpMethod: 'POST', path: '/stub', headers: { authorization: 'Bearer staff-jwt' },
    body: JSON.stringify({ action: 'create', params: { subject: 'Rechnung', body: 'Bitte prüfen Sie meine Rechnung.', userEmail } }),
  });
  const lookAlike = await open('al_ce@example.com');
  assert.equal(lookAlike.statusCode, 200, lookAlike.body);
  assert.equal(tickets[0].user_id, null, "al_ce@ must not be linked to Alice's account");
  const exact = await open('Alice@Example.com');
  assert.equal(exact.statusCode, 200, exact.body);
  assert.equal(tickets[1].user_id, ALICE);
});
