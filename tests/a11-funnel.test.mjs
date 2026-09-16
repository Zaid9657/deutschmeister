// A1.1 sales-funnel event contract — plan Task 3
// (a11-organic-commercial-launch). Narrow helpers only: every event is
// consent-aware `track`, sources are normalized to a closed set, the lesson
// number is 1–3, the amount derives from shared pricing data, and no email,
// audio, transcript or free-form text can ride along.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalizeA11Source, A11_SOURCES, a11EventProperties,
} from '../src/lib/a11Funnel.js';
import { LEVEL_COURSES } from '../src/data/pricing.js';

test('sources normalize to the closed set, unknown becomes "direct"', () => {
  assert.deepEqual([...A11_SOURCES].sort(), [
    'a11-sales', 'direct', 'email', 'locked-lesson', 'organic-search', 'organic-social', 'preview-complete',
  ]);
  assert.equal(normalizeA11Source('a11-sales'), 'a11-sales');
  assert.equal(normalizeA11Source('PREVIEW-COMPLETE'), 'preview-complete');
  assert.equal(normalizeA11Source('javascript:alert(1)'), 'direct');
  assert.equal(normalizeA11Source(undefined), 'direct');
  assert.equal(normalizeA11Source('utm_source=facebook&cb=1'), 'direct');
});

test('lesson numbers outside the preview are dropped', () => {
  assert.equal(a11EventProperties({ lesson: 2 }).lesson, 2);
  assert.equal(a11EventProperties({ lesson: 4 }).lesson, undefined, 'lesson 4 is not a preview lesson');
  assert.equal(a11EventProperties({ lesson: '3' }).lesson, 3);
  assert.equal(a11EventProperties({ lesson: 0 }).lesson, undefined);
});

test('the amount is the shared-data price, never a client number', () => {
  const props = a11EventProperties({ amount: 999, currency: 'USD', productKey: 'course_a1_1' });
  assert.equal(props.amount, LEVEL_COURSES.course_a1_1.price, 'a supplied amount is replaced by the real price');
  assert.equal(props.currency, 'EUR');
  assert.equal(props.productKey, 'course_a1_1');
  assert.equal(a11EventProperties({ productKey: 'course_b2_2' }).productKey, undefined, 'only the A1.1 product belongs in this funnel');
});

test('forbidden properties never survive', () => {
  const props = a11EventProperties({
    lesson: 1,
    email: 'learner@example.com',
    transcript: 'Ich möchte einen Kaffee',
    audioBase64: 'UklGRiQ',
    note: 'free-form text',
    userId: 'uuid-here',
  });
  assert.deepEqual(Object.keys(props).sort(), ['lesson', 'source']);
});

test('every funnel event is exported as its own narrow helper through track', () => {
  const src = readFileSync(new URL('../src/lib/funnelTracking.js', import.meta.url), 'utf8');
  for (const name of [
    'a11_sales_viewed', 'a11_preview_started', 'a11_preview_lesson_completed',
    'a11_preview_completed', 'a11_offer_viewed', 'a11_checkout_started',
    'a11_purchase_confirmed', 'a11_refund_recorded',
  ]) {
    assert.ok(src.includes(`'${name}'`), `${name} helper missing`);
  }
  const helpers = [...src.matchAll(/export const trackA11\w+ = [^;]+;/g)].map((m) => m[0]);
  assert.ok(helpers.length >= 8, `expected 8 A1.1 helpers, found ${helpers.length}`);
  for (const helper of helpers) {
    assert.match(helper, /a11EventProperties\(/, `a helper bypasses the property allowlist: ${helper}`);
  }
});

test('purchase confirmation is not wired to a button click', () => {
  const src = readFileSync(new URL('../src/lib/funnelTracking.js', import.meta.url), 'utf8');
  const at = src.indexOf('trackA11PurchaseConfirmed');
  const block = src.slice(Math.max(0, at - 400), at + 200);
  assert.match(block, /entitlement observer|entitlement/i,
    'purchase confirmation must fire from the entitlement observer, not a click');
});

test('the funnel documentation states the exact denominators', () => {
  const doc = readFileSync(new URL('../docs/analytics/a11-funnel.md', import.meta.url), 'utf8');
  for (const line of [
    'sales → preview start',
    'lesson 1 → lesson 3 completion',
    'preview completion → checkout start',
    'checkout start → confirmed purchase',
    'purchase → refund within 30 days',
  ]) {
    assert.ok(doc.includes(line), `denominator missing: ${line}`);
  }
  assert.match(doc, /100 qualified sales-page visits/);
  assert.match(doc, /20 checkout starts/);
});
