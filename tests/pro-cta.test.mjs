import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { proCta, SIGNUP_URL } from '../astro-site/src/lib/proCta.js';
import { TRIAL_DAYS } from '../src/data/marketing.js';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
test('signed-out AI trial door starts the account trial and no paid checkout', () => {
  const cta = proCta();
  assert.equal(cta.action, 'signup'); assert.equal(cta.href, SIGNUP_URL);
  assert.ok(cta.label.includes(String(TRIAL_DAYS))); assert.equal(cta.plan, null);
});
test('new buyers are sent to courses, never a retired recurring checkout', () => {
  for (const cycle of ['monthly', 'yearly', 'weekly']) {
    const cta = proCta({ signedIn: true, cycle });
    assert.equal(cta.action, 'courses'); assert.equal(cta.href, '/courses/'); assert.equal(cta.plan, null);
  }
});
test('existing recurring customers retain their billing portal for every provider status', () => {
  for (const status of ['active', 'on_trial', 'past_due', 'unpaid', 'paused', 'cancelled']) {
    const cta = proCta({ signedIn: true, subscription: { status, plan_type: 'monthly', lemonsqueezy_subscription_id: 'sub-old', subscription_end: '2999-01-01' } });
    assert.equal(cta.action, 'portal'); assert.match(cta.href, /lemonsqueezy.com\/billing/); assert.equal(cta.plan, null);
  }
});
test('pricing mounts course checkout with intent continuity and no recurring purchase handler', () => {
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.match(pricing, /<CourseCheckout/); assert.doesNotMatch(pricing, /pro-btn|proVariants|PLANS/);
  assert.match(read('astro-site/src/components/CourseCheckout.astro'), /localStorage.setItem\('dm_buy_intent', intentKey\)/);
  assert.match(read('astro-site/src/components/concept/PurchaseDoor.astro'), /data-course-variant=\{course.variantId\}/);
});
