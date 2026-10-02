// Guard suite for the plan button on /profile (product agent, 2026-10-02).
//
// The finding this closes: /profile showed a subscriber a "Manage plan" button
// that linked /pricing/. /pricing/ sells plans. It cannot cancel one, resume it
// or change the card, so a paying customer who pressed the button went in a
// circle. Billing lives with Lemon Squeezy, in the store's customer portal: the
// address the dunning mail and the support agent already send people to
// (netlify/functions/_shared/dunningLink.mjs BILLING_PORTAL_URL).
//
// The rule, not a list of screens:
//   1. The SPA's portal address equals the mailed one.
//   2. One decision picks the button: a subscriber gets "Manage plan" and the
//      portal, everyone else gets "Upgrade" and /pricing/. The label never
//      travels without the portal link.
//   3. /profile renders that decision and types neither the label nor a
//      /pricing/ link itself. The switch stays the paid-access answer it
//      already had (hasActiveSubscription()); nothing here touches entitlement.
//   4. No other SPA file types a billing-management label, so no screen can
//      offer "Manage plan" with a link that cannot manage it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { BILLING_PORTAL_URL as MAILED_PORTAL_URL } from '../netlify/functions/_shared/dunningLink.mjs';

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

test('the SPA portal address is the one the dunning mail and the support agent use', async () => {
  const { BILLING_PORTAL_URL } = await loadLib();
  assert.equal(BILLING_PORTAL_URL, MAILED_PORTAL_URL);
  assert.match(BILLING_PORTAL_URL, /^https:\/\/[a-z0-9-]+\.lemonsqueezy\.com\/billing$/);
});

test('a subscriber manages the plan in the portal; everyone else upgrades on /pricing/', async () => {
  const { BILLING_PORTAL_URL, profilePlanAction } = await loadLib();

  const sub = profilePlanAction(true);
  assert.equal(sub.href, BILLING_PORTAL_URL);
  assert.equal(sub.label, 'Manage plan');
  assert.match(sub.hint, /Lemon Squeezy customer portal/);
  assert.match(sub.hint, /email address you paid with/);

  for (const notSubscribed of [false, undefined, null]) {
    const plan = profilePlanAction(notSubscribed);
    assert.equal(plan.href, '/pricing/', `${notSubscribed}: a non-subscriber upgrades on /pricing/`);
    assert.equal(plan.label, 'Upgrade');
    assert.equal(plan.hint, null);
  }

  // The label never travels without the portal link, whatever the input.
  for (const input of [true, false, undefined, null]) {
    const plan = profilePlanAction(input);
    if (MANAGE_LABEL.test(plan.label)) assert.equal(plan.href, BILLING_PORTAL_URL);
    if (plan.href === '/pricing/') assert.doesNotMatch(plan.label, MANAGE_LABEL);
  }
});

test('/profile renders the plan button from that decision and types neither the label nor the link', () => {
  const src = read(PROFILE);
  const page = code(src);

  assert.match(src, /import \{ profilePlanAction \} from '\.\.\/lib\/billingPortal\.js';/, '/profile imports the decision');
  assert.match(page, /profilePlanAction\(isSubscribed\)/, 'the button is decided by profilePlanAction');
  assert.match(page, /<Button href=\{plan\.href\}/, 'the button links what the decision says');
  assert.match(page, /\{plan\.label\}/, 'the button says what the decision says');

  assert.doesNotMatch(page, /href="\/pricing\/?"/, '/profile types a /pricing/ link of its own');
  assert.doesNotMatch(page, MANAGE_LABEL, '/profile types a billing-management label of its own');

  // The switch is the paid-access answer /profile already had. This change
  // decides a link, never access.
  assert.match(page, /const isSubscribed = user \? hasActiveSubscription\(\) : false;/);
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
