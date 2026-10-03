// Guard suite for the status card on /subscription (revenue agent, 2026-10-03).
//
// The finding this closes (revenue 10-02, supervisor queue 10-03): the card
// titled every row with paid access "Active Subscription" and named the plan
// with one test, plan_type 'yearly' or else "Monthly Plan". A course purchase
// writes a plan_type 'course' row (lemonsqueezy-webhook.mjs handleCourseOrder):
// Pro included for a fixed window, bought once, never renewed. The card told
// that buyer they held a monthly subscription.
//
// The rule, not a list of rows:
//   1. One decision, src/lib/planStatus.js planStatusCopy(), names the row.
//      It names a billing cadence only for a row that carries one (monthly,
//      yearly: the PLANS in src/data/pricing.js), calls a course row Pro
//      included with the course, and names no cadence for a value it does not
//      know.
//   2. The page renders that decision and types no plan label of its own.
//   3. Copy only: hasActiveSubscription() still decides whether the card shows.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PLANS } from '../src/data/pricing.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const LIB = 'src/lib/planStatus.js';
const PAGE = 'src/pages/SubscriptionPage.jsx';

const loadLib = async () => {
  assert.ok(existsSync(join(ROOT, LIB)), `${LIB} holds the plan-label decision`);
  return import('../src/lib/planStatus.js');
};

/** Comments out, so the rules see what ships (same idea as subscription-portal-link.test.mjs). */
const code = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

// A label that names a renewal cadence, in either language.
const CADENCE_WORD = /\b(?:month(?:ly)?|year(?:ly)?|annual|monat\w*|jahr\w*|jährlich)\b/i;
const SUBSCRIPTION_WORD = /\b(?:subscription|abonnement|abo)\b/i;

// Row shapes as lemonsqueezy-webhook.mjs writes them (subscription_created and
// the course order) and as an owner grant leaves them.
const MONTHLY = { plan_type: 'monthly', status: 'active', lemonsqueezy_subscription_id: '2468531' };
const YEARLY = { plan_type: 'yearly', status: 'active', lemonsqueezy_subscription_id: '2468532' };
const COURSE_ROW = { plan_type: 'course', status: 'active', lemonsqueezy_order_id: '9001' };

test('a course row is called Pro included with the course, never a subscription or a cadence', async () => {
  const { planStatusCopy } = await loadLib();
  for (const isGerman of [false, true]) {
    const { title, plan } = planStatusCopy(COURSE_ROW, isGerman);
    const text = `${title} ${plan}`;
    assert.doesNotMatch(text, CADENCE_WORD, `course row names a cadence (isGerman=${isGerman}): ${text}`);
    assert.doesNotMatch(text, SUBSCRIPTION_WORD, `course row is called a subscription (isGerman=${isGerman}): ${text}`);
    assert.match(title, /\bPro\b/, 'the title says what the row grants');
    assert.match(plan, isGerman ? /Kurs/ : /course/, 'the plan line says where it came from');
  }
});

test('a plan row names its own cadence, in English and German', async () => {
  const { planStatusCopy } = await loadLib();
  assert.deepEqual(planStatusCopy(MONTHLY, false), { title: 'Active Subscription', plan: 'Monthly Plan' });
  assert.deepEqual(planStatusCopy(MONTHLY, true), { title: 'Aktives Abonnement', plan: 'Monatsplan' });
  assert.deepEqual(planStatusCopy(YEARLY, false), { title: 'Active Subscription', plan: 'Yearly Plan' });
  assert.deepEqual(planStatusCopy(YEARLY, true), { title: 'Aktives Abonnement', plan: 'Jahresplan' });
});

test('every plan the checkout sells has a cadence label, and nothing else gets one', async () => {
  const { planStatusCopy } = await loadLib();
  // The plans the checkout sells: a new one fails here until the card can name it.
  for (const key of Object.keys(PLANS)) {
    for (const isGerman of [false, true]) {
      assert.match(planStatusCopy({ plan_type: key }, isGerman).plan, CADENCE_WORD, `plan '${key}' (isGerman=${isGerman}) has a cadence label`);
    }
  }
  // A value the card does not know (a legacy or hand-written row) gets no
  // cadence rather than the old fallback "Monthly Plan".
  for (const plan_type of [null, undefined, '', 'quarterly', 'lifetime', 'Monthly', 'constructor', 'toString']) {
    for (const isGerman of [false, true]) {
      const { plan } = planStatusCopy({ plan_type }, isGerman);
      assert.doesNotMatch(plan, CADENCE_WORD, `plan_type ${JSON.stringify(plan_type)} (isGerman=${isGerman}) names a cadence: ${plan}`);
    }
  }
  for (const row of [null, undefined]) {
    assert.doesNotMatch(planStatusCopy(row, false).plan, CADENCE_WORD, 'no row names no cadence');
  }
});

test('the German copy speaks Sie', async () => {
  const { planStatusCopy } = await loadLib();
  for (const row of [MONTHLY, YEARLY, COURSE_ROW, { plan_type: 'unknown' }]) {
    const { title, plan } = planStatusCopy(row, true);
    assert.doesNotMatch(`${title} ${plan}`, /\b(?:du|dich|dir|dein\w*)\b/i);
  }
});

test('/subscription renders that decision and types no plan label of its own', () => {
  const src = read(PAGE);
  const page = code(src);

  assert.match(src, /import \{ planStatusCopy \} from '\.\.\/lib\/planStatus\.js';/, '/subscription imports the decision');
  assert.match(page, /planStatusCopy\(subscription, isGerman\)/, 'the card is named by planStatusCopy');
  assert.match(page, /\{planStatus\.title\}/, 'the card title is the decision');
  assert.match(page, /\{planStatus\.plan\}/, 'the plan line is the decision');

  // The old inline test and its labels are gone from the page.
  assert.doesNotMatch(page, /plan_type === 'yearly'/, '/subscription decides the plan label inline');
  assert.doesNotMatch(page, /'(?:Monthly Plan|Yearly Plan|Monatsplan|Jahresplan|Active Subscription|Aktives Abonnement)'/, '/subscription types a plan label of its own');
});

test('copy only: the card still shows on the paid-access answer the page already had', () => {
  const page = code(read(PAGE));
  assert.match(page, /const isSubscribed = hasActiveSubscription\(\);/);
  assert.match(page, /\{\(inTrial \|\| isSubscribed\) && \(/, 'the status card shows for a trial or paid access, as before');
});
