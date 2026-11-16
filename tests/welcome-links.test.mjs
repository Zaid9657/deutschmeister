// Guard suite for the site links in the welcome mail and the confirmation nudge.
// Run with `npm test`.
//
// The welcome mail (send-welcome-email, fired on every signup) linked to
// /analyze/ and the homepage untagged, and so did the nudge's footer. A click
// reached the site as "no referrer" or as a webmail host. Since 2026-10-06 both
// tag their site links the way tests/lifecycle-links.test.mjs pins for the
// trial and activation mails. These tests pin:
//   1. every site link carries utm_source=email, utm_medium=lifecycle, the
//      mail's campaign and its own utm_content;
//   2. the welcome button opens Lektion 1 of the free course (since 2026-10-25,
//      an SPA route without a trailing slash, pinned to the SPA's own
//      FIRST_LESSON_HREF), Sentence X-Ray stays a text link to /analyze/
//      (trailing slash, CLAUDE.md case 2), and the footer opens the homepage;
//   3. the nudge's button, a function URL with a signed token, is passed
//      through byte for byte and never tagged;
//   4. the labels are fixed strings (no id, address or date), so the recipient
//      never leaks into a link and the same mail renders the same bytes;
//   5. public/attribution.js (run as-is under node:vm) reads the tags back.
//
// Addresses and ids here are synthetic; no real recipient appears.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

process.env.UNSUB_SECRET = process.env.UNSUB_SECRET || 'test-only-unsub-secret';
delete process.env.SUPABASE_SERVICE_ROLE_KEY; // no live client in tests
const welcome = await import('../netlify/functions/send-welcome-email.mjs');
const nudge = await import('../netlify/functions/confirmation-nudge.mjs');
const { EMAIL_LABEL } = await import('../netlify/functions/_shared/emailLinks.mjs');
const { isSocialHref } = await import('../netlify/functions/_shared/socialLinks.mjs');
const { FIRST_LESSON_HREF } = await import('../src/lib/firstRun.js');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SITE = 'https://deutsch-meister.de';
const USER_ID = '00000000-0000-4000-8000-000000000001';
const ADDRESS = 'learner@example.com';
const CONTINUE = `${SITE}/.netlify/functions/confirm-continue?uid=${USER_ID}&exp=1790000000&token=abc123`;

// Social-channel links leave the site, so they carry no utm_* tags; they are
// pinned separately in tests/email-social.test.mjs and skipped here.
const hrefs = (html) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]).filter((h) => !isSocialHref(h));
const isFunction = (href) => new URL(href).pathname.startsWith('/.netlify/functions/');

// The expected links per mail, written out rather than derived, so a renamed
// campaign or a moved CTA fails here instead of passing silently.
const MAILS = {
  welcome: { html: () => welcome.welcomeHtml(ADDRESS), campaign: 'welcome', links: { cta: '/course/a1.1/l/1', xray: '/analyze/', footer: '/' } },
  'confirm-nudge': { html: () => nudge.bodyHtml(CONTINUE), campaign: 'confirm-nudge', links: { footer: '/' } },
};

test('the welcome button opens Lektion 1 where the SPA first run does, and asks for the confirmation (review 2026-10-25)', () => {
  assert.equal(MAILS.welcome.links.cta, FIRST_LESSON_HREF);
  assert.equal(new URL(welcome.WELCOME_CTA_HREF).pathname, FIRST_LESSON_HREF);
  const html = welcome.welcomeHtml(ADDRESS);
  assert.match(html, /Start Lektion 1 →/);
  assert.doesNotMatch(html, /Try Sentence X-Ray/, 'X-Ray is a text link now, not the button');
  // The mail arrives with the confirmation mail; progress is saved to a confirmed account.
  assert.match(html, /Confirm your address with the other email to save progress\./);
});

function attribution() {
  const window = { localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { search: '', pathname: '/' } };
  const ctx = { window, document: { referrer: '' }, URL, URLSearchParams, Date, JSON };
  vm.createContext(ctx);
  vm.runInContext(read('public/attribution.js'), ctx);
  return window.dmAttribution;
}

test('every site link carries the lifecycle tags, one utm_content per link, on the page it opened before', () => {
  for (const [name, { html, campaign, links }] of Object.entries(MAILS)) {
    const site = hrefs(html()).filter((h) => !isFunction(h));
    assert.equal(site.length, Object.keys(links).length, `${name}: site links`);
    const byContent = {};
    for (const href of site) {
      const url = new URL(href);
      assert.equal(url.origin, SITE, `${name}: ${href}`);
      assert.equal(url.hash, '', `${name}: ${href}`);
      assert.equal(url.searchParams.get('utm_source'), 'email', href);
      assert.equal(url.searchParams.get('utm_medium'), 'lifecycle', href);
      assert.equal(url.searchParams.get('utm_campaign'), campaign, href);
      byContent[url.searchParams.get('utm_content')] = url.pathname;
    }
    assert.deepEqual(byContent, links, `${name}: each link names itself and keeps its page`);
  }
});

test('the nudge button (a signed function URL) is passed through byte for byte and never tagged', () => {
  const fn = hrefs(nudge.bodyHtml(CONTINUE)).filter(isFunction);
  assert.deepEqual(fn, [CONTINUE]);
  assert.ok(!fn[0].includes('utm_'));
  // The welcome mail has no function link at all (no unsubscribe, no token).
  assert.deepEqual(hrefs(welcome.welcomeHtml(ADDRESS)).filter(isFunction), []);
});

test('labels are fixed strings: no id, address or date, and the recipient never reaches a link', () => {
  for (const [name, { html }] of Object.entries(MAILS)) {
    const out = html();
    assert.equal(out, html(), `${name}: deterministic`);
    for (const href of hrefs(out).filter((h) => !isFunction(h))) {
      for (const [key, value] of new URL(href).searchParams) {
        assert.ok(key.startsWith('utm_'), `${name}: only utm_ keys on a site link (${key})`);
        assert.match(value, EMAIL_LABEL, `${name}: ${key}=${value}`);
        assert.ok(!/\d{4}-\d{2}-\d{2}/.test(value), `${name}: no date in ${key}`);
        assert.ok(!value.includes(USER_ID) && !value.includes('@'), `${name}: no id or address in ${key}`);
      }
    }
  }
  // The welcome template takes the address but must not print it anywhere.
  assert.ok(!welcome.welcomeHtml(ADDRESS).includes(ADDRESS));
  assert.equal(welcome.welcomeHtml(ADDRESS), welcome.welcomeHtml('someone-else@example.org'));
});

test('the classifier reads the tags back without losing a label', () => {
  const { parse } = attribution();
  for (const [name, { html, campaign }] of Object.entries(MAILS)) {
    for (const href of hrefs(html()).filter((h) => !isFunction(h))) {
      const url = new URL(href);
      const touch = parse(url.search, '', url.pathname, Date.UTC(2026, 9, 6));
      assert.equal(touch.source, 'email', `${name}: ${href}`);
      assert.equal(touch.medium, 'lifecycle', `${name}: ${href}`);
      assert.equal(touch.campaign, campaign, `${name}: ${href}`);
      assert.equal(touch.content, url.searchParams.get('utm_content'), `${name}: ${href}`);
    }
  }
});

// ---------------------------------------------------------------------------
// The welcome after confirmation (2026-11-15, plan "Stop the leaks", step 2)
// ---------------------------------------------------------------------------
//
// The database trigger calls send-welcome-email at account creation, so the
// welcome raced the confirmation mail and its button (a page that needs no
// account) was clicked instead of the confirmation link. Pinned here: the
// webhook skips an unconfirmed account; a confirmed one (a Google sign-up) is
// claimed, then sent; the hourly confirmation-nudge job welcomes the rest after
// they confirm, with the same claim, so one account gets one welcome.

process.env.WEBHOOK_SECRET = 'test-only-webhook-secret';
process.env.RESEND_API_KEY = 'test-only-resend-key';

/** auth.admin.getUserById plus the lifecycle_emails claim, recording every call. */
function welcomeDb({ user = { id: USER_ID, email: ADDRESS, email_confirmed_at: '2026-11-15T09:00:00Z' }, lookupError = null, claimed = [], claimError = null } = {}) {
  const calls = [];
  const ledger = new Set(claimed);
  return {
    calls,
    auth: { admin: { getUserById: async (id) => { calls.push(['lookup', id]); return lookupError ? { data: null, error: lookupError } : { data: { user }, error: null }; } } },
    from(table) {
      return {
        upsert(rows, options) {
          calls.push(['claim', table, rows, options]);
          return {
            select: async () => {
              if (claimError) return { data: null, error: claimError };
              return { data: rows.filter((r) => !ledger.has(r.user_id) && ledger.add(r.user_id)), error: null };
            },
          };
        },
      };
    },
  };
}

const webhook = (body = { type: 'INSERT', table: 'users', record: { id: USER_ID, email: ADDRESS } }) => ({
  httpMethod: 'POST',
  headers: { authorization: `Bearer ${process.env.WEBHOOK_SECRET}` },
  body: JSON.stringify(body),
});

function resend() {
  const sent = [];
  const fetchImpl = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return { ok: true, json: async () => ({ id: 'resend-1' }) }; };
  return { sent, fetchImpl };
}

test('the webhook skips an unconfirmed account: no claim, no mail', async () => {
  const db = welcomeDb({ user: { id: USER_ID, email: ADDRESS, email_confirmed_at: null } });
  const r = resend();
  const res = await welcome.welcomeHandler(webhook(), { client: db, fetchImpl: r.fetchImpl });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { skipped: 'unconfirmed' });
  assert.deepEqual(db.calls, [['lookup', USER_ID]]);
  assert.equal(r.sent.length, 0);
});

test('the webhook claims, then sends, a confirmed account’s welcome (a Google sign-up), once', async () => {
  const db = welcomeDb();
  const r = resend();
  const res = await welcome.welcomeHandler(webhook(), { client: db, fetchImpl: r.fetchImpl });
  assert.equal(res.statusCode, 200);
  const claim = db.calls.find((c) => c[0] === 'claim');
  assert.deepEqual(claim.slice(1), ['lifecycle_emails', [{ user_id: USER_ID, kind: 'welcome' }], { onConflict: 'user_id,kind', ignoreDuplicates: true }]);
  assert.deepEqual(r.sent.map((m) => m.body), [welcome.welcomeItem(ADDRESS)]);
  // A second call (the trigger fired twice, or the hourly job got there first) sends nothing.
  const again = await welcome.welcomeHandler(webhook(), { client: db, fetchImpl: r.fetchImpl });
  assert.deepEqual(JSON.parse(again.body), { skipped: 'already_sent' });
  assert.equal(r.sent.length, 1);
});

test('the webhook before the migration sends unclaimed, as before; any other failure sends nothing', async () => {
  // check_violation: the ledger's CHECK does not admit 'welcome' yet.
  const pre = resend();
  const res = await welcome.welcomeHandler(webhook(), { client: welcomeDb({ claimError: { code: '23514', message: 'violates check constraint' } }), fetchImpl: pre.fetchImpl });
  assert.equal(res.statusCode, 200);
  assert.equal(pre.sent.length, 1);
  for (const [name, db, status] of [
    ['claim error', welcomeDb({ claimError: { code: '08006', message: 'connection failure' } }), 500],
    ['lookup error', welcomeDb({ lookupError: { message: 'auth down' } }), 502],
  ]) {
    const r = resend();
    assert.equal((await welcome.welcomeHandler(webhook(), { client: db, fetchImpl: r.fetchImpl })).statusCode, status, name);
    assert.equal(r.sent.length, 0, `${name}: the hourly job sends it once the address is confirmed`);
  }
  const r = resend();
  assert.equal((await welcome.welcomeHandler(webhook(), { client: null, fetchImpl: r.fetchImpl })).statusCode, 500, 'no database: fail closed');
  assert.equal(r.sent.length, 0);
  // The shared secret still guards the endpoint.
  assert.equal((await welcome.welcomeHandler({ ...webhook(), headers: {} }, { client: welcomeDb(), fetchImpl: r.fetchImpl })).statusCode, 401);
});

/** auth users, lifecycle_emails and profiles, behind the reads selectWelcomeRecipients makes. */
function sweepDb({ users, claimed = [], optedOut = [], failLedger = false }) {
  class Q {
    constructor(name) {
      this.name = name;
      this.rows = name === 'lifecycle_emails' ? claimed.map((id) => ({ user_id: id, kind: 'welcome' }))
        : name === 'profiles' ? users.map((u) => ({ id: u.id, email_daily_sentence: !optedOut.includes(u.id) })) : [];
      this.lo = 0; this.hi = Infinity;
    }
    select() { return this; }
    eq(k, v) { this.rows = this.rows.filter((r) => r[k] === v); return this; }
    in(k, vs) { this.rows = this.rows.filter((r) => vs.includes(r[k])); return this; }
    order() { return this; }
    range(a, b) { this.lo = a; this.hi = b; return this; }
    then(res, rej) {
      const out = failLedger && this.name === 'lifecycle_emails' ? { data: null, error: { message: 'down' } } : { data: this.rows.slice(this.lo, this.hi + 1), error: null };
      return Promise.resolve(out).then(res, rej);
    }
  }
  return { from: (n) => new Q(n), auth: { admin: { listUsers: async ({ page = 1 } = {}) => ({ data: { users: page === 1 ? users : [] }, error: null }) } } };
}

test('the hourly job welcomes addresses confirmed in the last 72 hours, once, and nobody created before the change', async () => {
  const now = Date.parse('2026-11-20T12:20:00Z');
  const H = 3600000;
  const iso = (t) => new Date(t).toISOString();
  const user = (id, { created = now - 5 * H, confirmed = now - 2 * H, email = `${id}@example.test` } = {}) => ({ id, email, created_at: iso(created), email_confirmed_at: confirmed === null ? null : iso(confirmed) });
  const users = [
    user('fresh'), // confirmed two hours ago
    user('earlier', { confirmed: now - 50 * H, created: now - 60 * H }),
    user('unconfirmed', { confirmed: null }),
    user('stale', { confirmed: now - 73 * H, created: now - 80 * H }), // past the window
    user('old-account', { created: Date.parse(nudge.WELCOME_SINCE) - H, confirmed: now - 2 * H }), // welcomed at creation by the old webhook
    user('welcomed'), // the webhook (or an earlier run) claimed it
    user('opted-out'),
    user('throwaway', { email: 'x@mailinator.com' }),
  ];
  const db = sweepDb({ users, claimed: ['welcomed'], optedOut: ['opted-out'] });
  const picked = await nudge.selectWelcomeRecipients(db, { now });
  assert.deepEqual(picked.map((r) => r.id), ['earlier', 'fresh'], 'earliest confirmation first');
  assert.equal(nudge.WELCOME_WINDOW_HOURS, 72);
  assert.deepEqual((await nudge.selectWelcomeRecipients(db, { now, limit: 1 })).map((r) => r.id), ['earlier']);
  await assert.rejects(nudge.selectWelcomeRecipients(sweepDb({ users, failLedger: true }), { now }), /welcome ledger read failed/, 'a failed ledger read would welcome twice');
});

test('the hourly job claims before it sends, and its welcome is the webhook’s bytes', () => {
  const src = read('netlify/functions/confirmation-nudge.mjs');
  const fn = src.slice(src.indexOf('async function sendWelcomes('), src.indexOf('function continueUrl('));
  assert.ok(fn.indexOf('.upsert(') !== -1 && fn.indexOf('.upsert(') < fn.indexOf('await sendBatch('), 'claim BEFORE send');
  assert.match(fn, /kind: WELCOME_KIND/);
  assert.match(fn, /welcomeItem\(r\.email\)/);
  // It runs whatever CONFIRM_NUDGE_ENABLED says: it replaces a mail that always went out.
  const handler = src.slice(src.indexOf('const innerHandler'));
  assert.ok(handler.indexOf('sendWelcomes(') < handler.indexOf(`process.env.CONFIRM_NUDGE_ENABLED !== 'true'`));
});
