// Guard suite for where the copy says a subscriber cancels (conversion agent,
// 2026-10-02).
//
// The finding this closes: the /pricing/ FAQ answered "Can I cancel anytime?"
// with "Yes, from your account page." The product has no cancel control.
// /subscription shows the plan and its end date, /profile's "Manage plan"
// button links back to /pricing/, and no file under src/ links the Lemon
// Squeezy portal or calls a cancel action. All 10 subscription_cancelled
// webhooks on record came through Lemon Squeezy. The rule, not a list of
// strings:
//   1. The /pricing/ answer points at the store's customer portal, with the
//      address taken from astro-site/src/lib/billingPortal.js. That copy equals
//      the one the dunning mail and the support agent use.
//   2. No copy anywhere says you cancel on the account or profile page while
//      neither account screen links the portal. When one does, the claim
//      becomes true and this rule lets it through.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { BILLING_PORTAL_URL, BILLING_PORTAL_LABEL } from '../astro-site/src/lib/billingPortal.js';
import { BILLING_PORTAL_URL as MAILED_PORTAL_URL } from '../netlify/functions/_shared/dunningLink.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Comments and imports out, so the rules see what ships (same idea as claims.test.mjs rendered()). */
const rendered = (src) =>
  src
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|import\s|export\s+\{)/.test(line))
    .join('\n');

const CANCEL = String.raw`(?:cancel\w*|kündig\w*|kuendig\w*)`;
const ACCOUNT_PLACE = String.raw`(?:account page|account settings|profile page|Kontoseite|Kontoeinstellungen|Profilseite|(?:in|im|über|auf) (?:Ihrem |dem |der )?(?:Konto|Profil)\b)`;
/** A sentence that sends the reader to the account or profile screen to cancel. */
const CANCEL_VIA_ACCOUNT = new RegExp(`${CANCEL}[^.\\n]{0,80}${ACCOUNT_PLACE}|${ACCOUNT_PLACE}[^.\\n]{0,80}${CANCEL}`, 'i');

const ACCOUNT_SCREENS = ['src/pages/SubscriptionPage.jsx', 'src/pages/ProfilePage.jsx'];
const PORTAL_REFERENCE = /lemonsqueezy\.com\/billing|BILLING_PORTAL_URL|customer_portal/;

const COPY_ROOTS = ['src', 'astro-site/src', 'netlify/functions'];
const copyFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (/\.(jsx?|mjs|astro|json)$/.test(entry.name)) out.push(rel);
    }
  };
  COPY_ROOTS.forEach(walk);
  return out;
};

test('the /pricing/ portal address is the one the dunning mail and the support agent use', () => {
  assert.equal(BILLING_PORTAL_URL, MAILED_PORTAL_URL);
  assert.equal(BILLING_PORTAL_LABEL, MAILED_PORTAL_URL.replace(/^https:\/\//, ''));
  assert.match(BILLING_PORTAL_URL, /^https:\/\/[a-z0-9-]+\.lemonsqueezy\.com\/billing$/);
});

test('the /pricing/ cancel answer sends people to the portal, derived and not typed', () => {
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.match(pricing, /from '\.\.\/lib\/billingPortal\.js'/);

  const page = rendered(pricing);
  const entry = page.match(/q: 'Can I cancel anytime\?'[\s\S]*?\n\s*\},/);
  assert.ok(entry, 'the cancel question is still on /pricing/');
  assert.match(entry[0], /\$\{BILLING_PORTAL_LABEL\}/, 'the answer names the portal address');
  assert.match(entry[0], /href: BILLING_PORTAL_URL/, 'the answer links the portal');
  assert.doesNotMatch(entry[0], CANCEL_VIA_ACCOUNT);

  // The address is typed once, in lib/billingPortal.js, never on the page.
  assert.doesNotMatch(page, /lemonsqueezy\.com\/billing/);
  // The FAQ list renders the link, so the answer is one click from the portal.
  assert.match(page, /\{item\.link && \(/);
  assert.match(page, /href=\{item\.link\.href\}/);
});

test('the rule recognises the claim it was written for (the scan is not vacuous)', () => {
  assert.match("{ q: 'Can I cancel anytime?', a: 'Yes, from your account page.", CANCEL_VIA_ACCOUNT);
  assert.match('Sie können Ihr Abo jederzeit auf der Kontoseite kündigen.', CANCEL_VIA_ACCOUNT);
  assert.match('Kündigen Sie jederzeit in Ihrem Konto.', CANCEL_VIA_ACCOUNT);
  assert.doesNotMatch('A1.1 free, no account · 7-day Pro trial · cancel anytime', CANCEL_VIA_ACCOUNT);
  assert.doesNotMatch('Yes. You cancel in the Lemon Squeezy customer portal.', CANCEL_VIA_ACCOUNT);
});

test('no copy sends a subscriber to the account page to cancel while no account screen can', () => {
  const accountCanCancel = ACCOUNT_SCREENS.some((p) => PORTAL_REFERENCE.test(rendered(read(p))));
  const offenders = [];
  for (const file of copyFiles()) {
    const lines = rendered(read(file)).split('\n');
    lines.forEach((line) => {
      if (CANCEL_VIA_ACCOUNT.test(line)) offenders.push(`${file}: ${line.trim().slice(0, 140)}`);
    });
  }
  assert.ok(
    accountCanCancel || offenders.length === 0,
    `These lines say the account page cancels, but neither ${ACCOUNT_SCREENS.join(' nor ')} links the portal:\n${offenders.join('\n')}`,
  );
});
