// Guard suite for the billing link on /subscription (revenue agent, 2026-10-02).
//
// The finding this closes (conversion handoff, 2026-10-02): /subscription shows
// a subscriber the plan and its end date, and nothing else. No control there
// changes the card, shows an invoice or cancels, so a paying customer whose
// renewal failed (2 rows were past_due on 2026-10-02) had no way from the
// account screen to the one place that can fix it: the store's Lemon Squeezy
// customer portal, the address the dunning mail, the support agent, /pricing/
// and /profile already use.
//
// The rule, not a list of screens:
//   1. One decision, in src/lib/billingPortal.js next to the portal address,
//      says whether /subscription shows the link. It shows only for a live
//      Lemon Squeezy subscription: the paid-access answer the page already had
//      (hasActiveSubscription()) AND a lemonsqueezy_subscription_id on the row
//      the page already loaded. Trial users, comped rows (no Lemon Squeezy ids;
//      2 of the 9 rows with a future end date on 2026-10-02) and course rows
//      (an order, no subscription) get no link, because the portal has nothing
//      of theirs to manage.
//   2. The page renders that decision and types neither the address nor a
//      billing-management label itself (tests/profile-plan-button.test.mjs
//      holds the label rule for every SPA file).
//   3. Link and copy only: no new query, no new access switch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { BILLING_PORTAL_URL as MAILED_PORTAL_URL } from '../netlify/functions/_shared/dunningLink.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const LIB = 'src/lib/billingPortal.js';
const PAGE = 'src/pages/SubscriptionPage.jsx';

const loadLib = async () => {
  assert.ok(existsSync(join(ROOT, LIB)), `${LIB} holds the billing-link decision`);
  return import('../src/lib/billingPortal.js');
};

/** Comments out, so the rules see what ships (same idea as profile-plan-button.test.mjs). */
const code = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

/** Same label rule as tests/profile-plan-button.test.mjs. */
const MANAGE_LABEL = /\bManage (?:plan|subscription|billing)\b|\b(?:Abo|Abonnement|Plan|Zahlung\w*) verwalten\b/i;

// Row shapes as lemonsqueezy-webhook.mjs writes them (subscription_created and
// the course order), and as an owner grant leaves them (no Lemon Squeezy ids).
const LS_SUB = { plan_type: 'monthly', status: 'active', lemonsqueezy_subscription_id: '2468531', lemonsqueezy_customer_id: '7001' };
const PAST_DUE = { ...LS_SUB, status: 'past_due' };
const COMPED = { plan_type: 'yearly', status: 'active', lemonsqueezy_subscription_id: null, lemonsqueezy_customer_id: null };
const COMPED_EMPTY = { plan_type: 'yearly', status: 'active', lemonsqueezy_subscription_id: '', lemonsqueezy_customer_id: '' };
const COURSE_ROW = { plan_type: 'course', status: 'active', lemonsqueezy_order_id: '9001', lemonsqueezy_customer_id: '7002' };

test('the decision exists and links the portal the dunning mail uses', async () => {
  const lib = await loadLib();
  assert.equal(typeof lib.subscriptionPortalAction, 'function', `${LIB} exports subscriptionPortalAction`);
  assert.equal(lib.BILLING_PORTAL_URL, MAILED_PORTAL_URL);

  for (const isGerman of [false, true]) {
    const action = lib.subscriptionPortalAction(true, LS_SUB, isGerman);
    assert.ok(action, `a Lemon Squeezy subscriber gets the link (isGerman=${isGerman})`);
    assert.equal(action.href, lib.BILLING_PORTAL_URL);
    assert.match(action.label, MANAGE_LABEL, 'the label says it manages billing');
  }
});

test('only a live Lemon Squeezy subscription gets the link', async () => {
  const { subscriptionPortalAction, BILLING_PORTAL_URL } = await loadLib();

  // A renewal that failed is exactly who needs it: the row keeps its end date
  // and its Lemon Squeezy id, so the page still says "Active Subscription".
  assert.equal(subscriptionPortalAction(true, PAST_DUE, false)?.href, BILLING_PORTAL_URL);

  const none = [
    ['trial user, no row', false, null],
    ['trial user, undefined row', false, undefined],
    ['ended subscription', false, LS_SUB],
    ['unknown access answer', undefined, LS_SUB],
    ['comped row, null ids', true, COMPED],
    ['comped row, empty ids', true, COMPED_EMPTY],
    ['course row: an order, no subscription', true, COURSE_ROW],
    ['course row that kept an old subscription id', true, { ...COURSE_ROW, lemonsqueezy_subscription_id: '2468531' }],
    ['no row at all', true, null],
  ];
  for (const [why, isSubscribed, row] of none) {
    for (const isGerman of [false, true]) {
      assert.equal(subscriptionPortalAction(isSubscribed, row, isGerman), null, `${why} (isGerman=${isGerman}) gets no link`);
    }
  }
});

test('the hint says where to sign in, in English and in German with Sie', async () => {
  const { subscriptionPortalAction } = await loadLib();

  const en = subscriptionPortalAction(true, LS_SUB, false);
  assert.match(en.hint, /Lemon Squeezy customer portal/);
  assert.match(en.hint, /email address you paid with/);
  assert.match(en.hint, /card/);
  assert.match(en.hint, /invoices/);
  assert.match(en.hint, /cancel/);

  const de = subscriptionPortalAction(true, LS_SUB, true);
  assert.match(de.label, /verwalten/);
  assert.match(de.hint, /Kundenportal von Lemon Squeezy/);
  assert.match(de.hint, /E-Mail-Adresse/);
  assert.match(de.hint, /mit der Sie bezahlt haben/);
  assert.match(de.hint, /Karte/);
  assert.match(de.hint, /Rechnungen/);
  assert.match(de.hint, /kündigen/);
  // The course speaks Sie; a du-form here would be the page's old mix.
  assert.doesNotMatch(`${de.label} ${de.hint}`, /\b(?:du|dich|dir|dein\w*)\b/i);
});

test('/subscription renders that decision and types neither the address nor the label', () => {
  const src = read(PAGE);
  const page = code(src);

  assert.match(src, /import \{ subscriptionPortalAction \} from '\.\.\/lib\/billingPortal\.js';/, '/subscription imports the decision');
  assert.match(page, /subscriptionPortalAction\(isSubscribed, subscription, isGerman\)/, 'the link is decided by subscriptionPortalAction');
  assert.match(page, /href=\{portal\.href\}/, 'the link goes where the decision says');
  assert.match(page, /\{portal\.label\}/, 'the link says what the decision says');
  assert.match(page, /\{portal\.hint\}/, 'the hint is shown');
  // Rendered only when the decision returned one.
  assert.match(page, /\{portal && \(/);

  assert.doesNotMatch(page, /lemonsqueezy\.com\/billing/, '/subscription types the portal address');
  assert.doesNotMatch(page, /BILLING_PORTAL_URL/, '/subscription reads the address directly instead of the decision');
  assert.doesNotMatch(page, MANAGE_LABEL, '/subscription types a billing-management label of its own');
});

test('link and copy only: the switch is the paid-access answer the page already had, and no new query', () => {
  const page = code(read(PAGE));

  assert.match(page, /const isSubscribed = hasActiveSubscription\(\);/);
  // The row comes from SubscriptionContext (subscriptionService.getSubscription
  // selects every column); the page reads it and queries nothing itself.
  assert.match(page, /\bsubscription,\n/, 'the page reads the subscription row from useSubscription()');
  assert.doesNotMatch(page, /from '\.\.\/utils\/supabase'|supabase\.from\(|\.from\('subscriptions'\)/, '/subscription queries the database itself');
  assert.doesNotMatch(page, /getSubscription\(/, '/subscription loads the row a second time');
});
