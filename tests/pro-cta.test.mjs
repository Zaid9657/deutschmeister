// Guard suite for the /pricing/ Pro button (astro-site/src/lib/proCta.js,
// conversion agent 2026-09-30).
//
// The finding this closes: from 2026-09-14 the button read "Start 7-day Pro
// trial" for everyone, but a signed-in click opened the paid Lemon Squeezy
// checkout, and a signed-out click stored a `monthly` buy intent, so the
// account that signup created was met by that paid checkout. The rule, not a
// list of strings: the label names what the click does.
//   1. Signed out, the button promises the trial and goes to /signup only.
//      It never leaves a buy intent behind.
//   2. Signed in, the button names Pro and its price, derived from pricing.js,
//      and never mentions a trial the checkout does not give.
//   3. The page renders the label and note from proCta() (at build time and in
//      its script), and the Pro click reads proCta() before it opens anything.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { proCta, SIGNUP_URL } from '../astro-site/src/lib/proCta.js';
import { PLANS, eur } from '../astro-site/src/data/pricing.js';
import { TRIAL_DAYS } from '../astro-site/src/data/marketing.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pricing = read('astro-site/src/pages/pricing.astro');
const script = pricing.slice(pricing.indexOf('<script>'));

test('signed out, the Pro button starts the account trial and nothing else', () => {
  for (const cycle of ['monthly', 'yearly', undefined]) {
    const cta = proCta({ signedIn: false, cycle });
    assert.equal(cta.action, 'signup');
    assert.equal(cta.label, `Start ${TRIAL_DAYS}-day Pro trial`);
    assert.equal(cta.href, SIGNUP_URL);
    assert.equal(cta.plan, null);
    assert.match(cta.note, /no card/i);
    // No price on a trial button: nothing is charged by this click.
    assert.ok(!cta.label.includes('€') && !cta.note.includes('€'), `${cycle}: a trial CTA quoted a price`);
  }
  // /signup is a rewrite-served SPA route: no trailing slash, absolute (a full load).
  assert.equal(SIGNUP_URL, 'https://deutsch-meister.de/signup');
  // The default (build-time render, no session known) is the signed-out one.
  assert.deepEqual(proCta(), proCta({ signedIn: false }));
});

test('signed in, the Pro button names Pro and the price it charges, never a trial', () => {
  for (const cycle of ['monthly', 'yearly']) {
    const plan = PLANS[cycle];
    const cta = proCta({ signedIn: true, cycle });
    assert.equal(cta.action, 'checkout');
    assert.equal(cta.plan, plan.key);
    assert.equal(cta.label, `Go Pro — ${eur(plan.price)}/${plan.interval}`);
    assert.doesNotMatch(cta.label, /trial/i);
    assert.doesNotMatch(cta.note, /trial/i);
    assert.match(cta.note, /cancel anytime/);
  }
  assert.equal(proCta({ signedIn: true, cycle: 'yearly' }).note, `${eur(PLANS.yearly.asMonthly)} a month, billed yearly · cancel anytime`);
  assert.equal(proCta({ signedIn: true, cycle: 'monthly' }).note, `${eur(PLANS.monthly.perDay)} a day · cancel anytime`);
  // An unknown cycle falls back to monthly rather than rendering "undefined".
  assert.equal(proCta({ signedIn: true, cycle: 'weekly' }).label, proCta({ signedIn: true }).label);
});

test('the page renders the Pro label and note from proCta, never a retyped trial promise', () => {
  // Build-time render: the signed-out default.
  assert.match(pricing, /<span id="pro-btn-label"[^>]*>\{proCta\(\)\.label\}<\/span>/);
  assert.match(pricing, /\{proCta\(\)\.note\}/);
  // The script re-renders both from the same function once it knows the session.
  assert.match(script, /import \{ proCta \} from '\.\.\/lib\/proCta\.js';/);
  assert.match(script, /\$\('pro-btn-label'\)\.textContent = cta\.label;/);
  assert.match(script, /\$\('plan-note'\)\.textContent = cta\.note;/);
  // No hand-typed trial promise left on the page's Pro column.
  assert.doesNotMatch(pricing, /-day free trial · cancel anytime/);
});

test('the Pro click asks proCta first and leaves no buy intent when signed out', () => {
  const start = script.indexOf("$('pro-btn').addEventListener('click'");
  assert.ok(start > -1, 'Pro button handler not found');
  // The handler ends at the listener's own closing line (4-space indent), not
  // at the first "});", which is the proCta({ … }) call inside it.
  const end = script.indexOf('\n    });', start);
  assert.ok(end > start, 'Pro button handler end not found');
  const handler = script.slice(start, end);
  assert.match(handler, /proCta\(\{ signedIn: Boolean\(currentUser\(\)\), cycle \}\)/);
  assert.match(handler, /if \(cta\.action === 'signup'\) \{\s*window\.location\.href = cta\.href;\s*return;/);
  // The signup branch returns before open(), the only place that writes dm_buy_intent.
  const signupBranch = handler.slice(handler.indexOf("if (cta.action === 'signup')"), handler.indexOf('return;') + 7);
  assert.doesNotMatch(signupBranch, /dm_buy_intent|open\(/);
  // Course buttons still carry their intent through signup: they say "Buy".
  assert.match(script, /localStorage\.setItem\('dm_buy_intent', intentKey\)/);
  assert.match(pricing, /Buy \{c\.code\}/);
});
