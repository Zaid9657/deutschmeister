// Guard suite for the plan button on /profile (product agent, 2026-10-02).
//
// The finding this closes: /profile showed a subscriber a "Manage plan" button
// that linked /pricing/. /pricing/ sells plans. It cannot cancel one, resume it
// or change the card, so a paying customer who pressed the button went in a
// circle. Billing lives with Lemon Squeezy, in the store's customer portal: the
// address the dunning mail and the support agent already send people to
// (netlify/functions/_shared/dunningLink.mjs BILLING_PORTAL_URL).
//
// The follow-up (orchestrator review of 67848a1, 2026-10-02): "Manage plan"
// opened the portal for every row with paid access, including the 2 comped
// rows (an owner grant: no Lemon Squeezy ids) whose portal sign-in finds no
// account, and course rows, which hold an order and no plan.
//
// The rule, not a list of screens:
//   1. The SPA's portal address equals the mailed one.
//   2. One decision picks the control, from the paid-access answer and the
//      subscription row the page already has. A live Lemon Squeezy
//      subscription gets "Manage plan" and the portal, by the same rule as
//      /subscription (subscriptionPortalAction). No paid access gets "Upgrade"
//      and /pricing/. Paid access without one (comped, course) gets neither:
//      a plain line and a support link. The label never travels without the
//      portal link.
//   3. /profile renders that decision and types neither the label nor a
//      /pricing/ link itself. The switch stays the paid-access answer it
//      already had (hasActiveSubscription()) and the row is the one
//      SubscriptionContext already loaded: link and copy only, no new query,
//      nothing here touches entitlement.
//   4. No other SPA file types a billing-management label, so no screen can
//      offer "Manage plan" with a link that cannot manage it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { BILLING_PORTAL_URL as MAILED_PORTAL_URL } from '../netlify/functions/_shared/dunningLink.mjs';
import { SUPPORT_LINK } from '../src/data/navigation.js';
import { categoryForTopic } from '../src/lib/supportTicket.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const LIB = 'src/lib/billingPortal.js';
const PROFILE = 'src/pages/ProfilePage.jsx';

/** The decision module. Loaded lazily so the source rules below still report when it is missing. */
const loadLib = async () => {
  assert.ok(existsSync(join(ROOT, LIB)), `${LIB} holds the plan-button decision`);
  return import('../src/lib/billingPortal.js');
};

/** Comments out, so the rules see what ships (same idea as claims.test.mjs). */
const code = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

/** A control label that offers to manage billing, in English or German. */
const MANAGE_LABEL = /\bManage (?:plan|subscription|billing)\b|\b(?:Abo|Abonnement|Plan|Zahlung\w*) verwalten\b/i;

// Row shapes as lemonsqueezy-webhook.mjs and admin-actions.mjs write them
// (the first five as in tests/subscription-portal-link.test.mjs).
const LS_SUB = { plan_type: 'monthly', status: 'active', lemonsqueezy_subscription_id: '2468531', lemonsqueezy_customer_id: '7001' };
const PAST_DUE = { ...LS_SUB, status: 'past_due' };
const COMPED = { plan_type: 'yearly', status: 'active', lemonsqueezy_subscription_id: null, lemonsqueezy_customer_id: null };
const COMPED_EMPTY = { plan_type: 'yearly', status: 'active', lemonsqueezy_subscription_id: '', lemonsqueezy_customer_id: '' };
const COURSE_ROW = { plan_type: 'course', status: 'active', lemonsqueezy_order_id: '9001', lemonsqueezy_customer_id: '7002' };
const COURSE_STALE = { ...COURSE_ROW, lemonsqueezy_subscription_id: '2468531' };
// admin-actions.mjs grant_pro_days inserts this when the user has no manual row.
const GRANT = { plan_type: 'monthly', status: 'active', price_paid: 0 };
const ROWS = [null, undefined, LS_SUB, PAST_DUE, COMPED, COMPED_EMPTY, GRANT, COURSE_ROW, COURSE_STALE];

/** Where paid access without a Lemon Squeezy subscription is sent: /support, payment preselected. */
const SUPPORT_HREF = `${SUPPORT_LINK.href}?topic=payment`;

test('the SPA portal address is the one the dunning mail and the support agent use', async () => {
  const { BILLING_PORTAL_URL } = await loadLib();
  assert.equal(BILLING_PORTAL_URL, MAILED_PORTAL_URL);
  assert.match(BILLING_PORTAL_URL, /^https:\/\/[a-z0-9-]+\.lemonsqueezy\.com\/billing$/);
});

test('a Lemon Squeezy subscriber manages the plan in the portal; no paid access upgrades on /pricing/', async () => {
  const { BILLING_PORTAL_URL, profilePlanAction } = await loadLib();

  // A failed renewal keeps its id and end date: exactly who needs the portal.
  for (const row of [LS_SUB, PAST_DUE]) {
    const sub = profilePlanAction(true, row);
    assert.equal(sub.kind, 'portal', `${row.status}: a Lemon Squeezy subscriber gets the portal`);
    assert.equal(sub.href, BILLING_PORTAL_URL);
    assert.equal(sub.label, 'Manage plan');
    assert.match(sub.hint, /Lemon Squeezy customer portal/);
    assert.match(sub.hint, /email address you paid with/);
  }

  for (const notSubscribed of [false, undefined, null]) {
    for (const row of ROWS) {
      const plan = profilePlanAction(notSubscribed, row);
      assert.equal(plan.kind, 'upgrade', `${notSubscribed}, ${JSON.stringify(row)}: no paid access upgrades`);
      assert.equal(plan.href, '/pricing/', `${notSubscribed}: a non-subscriber upgrades on /pricing/`);
      assert.equal(plan.label, 'Upgrade');
      assert.equal(plan.hint, null);
    }
  }

  // The label never travels without the portal link, whatever the input.
  for (const input of [true, false, undefined, null]) {
    for (const row of ROWS) {
      const plan = profilePlanAction(input, row);
      if (MANAGE_LABEL.test(plan.label)) assert.equal(plan.href, BILLING_PORTAL_URL);
      if (plan.href === '/pricing/') assert.doesNotMatch(plan.label, MANAGE_LABEL);
    }
  }
});

test('paid access without a Lemon Squeezy subscription gets neither the portal nor /pricing/, but a line and a support link', async () => {
  const { BILLING_PORTAL_URL, profilePlanAction } = await loadLib();

  const cases = [
    ['comped row, null ids', COMPED, /managed by our team/],
    ['comped row, empty ids', COMPED_EMPTY, /managed by our team/],
    ['an admin grant (grant_pro_days)', GRANT, /managed by our team/],
    ['no row the page can see', null, /managed by our team/],
    ['course row: an order, no subscription', COURSE_ROW, /course purchase/],
    ['course row that kept an old subscription id', COURSE_STALE, /course purchase/],
  ];
  for (const [why, row, copy] of cases) {
    const plan = profilePlanAction(true, row);
    assert.equal(plan.kind, 'support', `${why}: a line and a support link, not a button`);
    assert.notEqual(plan.href, BILLING_PORTAL_URL, `${why}: the portal cannot find this account`);
    assert.notEqual(plan.href, '/pricing/', `${why}: /pricing/ sells a plan they already have`);
    assert.equal(plan.href, SUPPORT_HREF, `${why}: support, with the payment category preselected`);
    assert.doesNotMatch(plan.label, MANAGE_LABEL, `${why}: no billing-management label without the portal`);
    assert.doesNotMatch(plan.label, /upgrade/i);
    assert.match(plan.label, /support/i);
    assert.match(plan.hint, copy, `${why}: the line says why there is nothing to manage`);
    // The portal has nothing of theirs, so the line promises nothing from it.
    assert.doesNotMatch(plan.hint, /portal|Lemon Squeezy|paid with/i, `${why}: the line points at the portal`);
    assert.doesNotMatch(plan.hint, MANAGE_LABEL);
  }

  // The link is a client-side route, and its topic is a real category, not
  // the 'technical' fallback.
  assert.equal(SUPPORT_LINK.kind, 'spa');
  const topic = new URLSearchParams(SUPPORT_HREF.split('?')[1]).get('topic');
  assert.equal(topic, 'payment');
  assert.equal(categoryForTopic(topic), topic);
});

test('the portal decision on /profile is the /subscription rule (one rule, two screens)', async () => {
  const { profilePlanAction, subscriptionPortalAction } = await loadLib();
  for (const isSubscribed of [true, false, undefined, null]) {
    for (const row of ROWS) {
      const onProfile = profilePlanAction(isSubscribed, row).kind === 'portal';
      const onSubscription = subscriptionPortalAction(isSubscribed, row, false) !== null;
      assert.equal(onProfile, onSubscription, `${isSubscribed}, ${JSON.stringify(row)}: /profile and /subscription disagree`);
    }
  }
});

test('/profile renders the plan button from that decision and types neither the label nor the link', () => {
  const src = read(PROFILE);
  const page = code(src);

  assert.match(src, /import \{ profilePlanAction \} from '\.\.\/lib\/billingPortal\.js';/, '/profile imports the decision');
  assert.match(page, /profilePlanAction\(isSubscribed, subscription\)/, 'the control is decided by profilePlanAction, from the row the page has');
  assert.match(page, /<Button href=\{plan\.href\}/, 'the button links what the decision says');
  assert.match(page, /\{plan\.label\}/, 'the button says what the decision says');

  // The support answer is a plain line with a link in it, never the button.
  assert.match(page, /\{plan\.kind === 'support' \? \(/, 'the support answer renders as a line');
  assert.match(page, /<Link to=\{plan\.href\}[^>]*>\{plan\.label\}<\/Link>/, 'the line links where the decision says');
  assert.match(page, /\{plan\.kind !== 'support' && \(\s*<Button href=\{plan\.href\}/, 'no button for the support answer');

  assert.doesNotMatch(page, /href="\/pricing\/?"/, '/profile types a /pricing/ link of its own');
  assert.doesNotMatch(page, MANAGE_LABEL, '/profile types a billing-management label of its own');

  // The switch is the paid-access answer /profile already had. This change
  // decides a link, never access.
  assert.match(page, /const isSubscribed = user \? hasActiveSubscription\(\) : false;/);
});

test('link and copy only: /profile reads the row SubscriptionContext already loaded and queries no subscription', () => {
  const page = code(read(PROFILE));
  // subscriptionService.getSubscription selects every column, so the row
  // already carries plan_type and lemonsqueezy_subscription_id.
  assert.match(page, /const \{[^}]*\bsubscription\b[^}]*\} = useSubscription\(\);/, '/profile reads the row from useSubscription()');
  assert.doesNotMatch(page, /\.from\('subscriptions'\)/, '/profile queries subscriptions itself');
  assert.doesNotMatch(page, /getSubscription\(|subscriptionService/, '/profile loads the row a second time');
});

test('no SPA file types a billing-management label outside the decision module', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|json)$/.test(entry.name) && rel !== LIB) {
        code(read(rel))
          .split('\n')
          .forEach((line) => {
            if (MANAGE_LABEL.test(line)) offenders.push(`${rel}: ${line.trim().slice(0, 140)}`);
          });
      }
    }
  };
  walk('src');
  assert.deepEqual(offenders, [], `Billing-management labels belong in ${LIB}, next to the portal link:\n${offenders.join('\n')}`);
});

test('the label rule recognises what it was written for (the scan is not vacuous)', () => {
  assert.match("{isSubscribed ? 'Manage plan' : 'Upgrade'}", MANAGE_LABEL);
  assert.match('Manage subscription', MANAGE_LABEL);
  assert.match('Abo verwalten', MANAGE_LABEL);
  assert.match('Zahlungsdaten verwalten', MANAGE_LABEL);
  // A page description is not a control.
  assert.doesNotMatch('Manage your DeutschMeister subscription.', MANAGE_LABEL);
  assert.doesNotMatch('Manage your DeutschMeister profile and learning preferences.', MANAGE_LABEL);
});
