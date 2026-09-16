// The A1.1 sales-funnel property allowlist — plan Task 3
// (a11-organic-commercial-launch).
//
// Same doctrine as the speaking metrics allowlist: ONE place decides what an
// A1.1 funnel event may carry, so an email, a transcript or a free-form note
// cannot reach analytics from any surface. Two rules beyond the list itself:
//   * `source` is normalized to a closed set (an attacker-supplied or
//     campaign-mangled value becomes 'direct', never a new dimension);
//   * `amount` is NOT accepted from the caller — it is read from the shared
//     pricing data, so a client can never report a price we do not charge.
import { LEVEL_COURSES, CURRENCY } from '../data/pricing.js';
import { A11_PREVIEW_LESSONS, A11_PRODUCT_KEY } from './guidedCourseAccess.js';

export const A11_SOURCES = Object.freeze([
  'a11-sales', 'preview-complete', 'locked-lesson', 'email',
  'organic-social', 'organic-search', 'direct',
]);

/** Unknown/unsafe values collapse to 'direct' rather than inventing a segment. */
export function normalizeA11Source(value) {
  const v = String(value || '').trim().toLowerCase();
  return A11_SOURCES.includes(v) ? v : 'direct';
}

/**
 * a11EventProperties(input) → the only properties an A1.1 event may carry:
 * lesson (1–3), source (normalized), productKey (A1.1 only), amount +
 * currency (from shared data), experiment (anonymous version label).
 */
export function a11EventProperties(input = {}) {
  const props = { source: normalizeA11Source(input.source) };

  const lesson = Number(input.lesson);
  if (Number.isInteger(lesson) && lesson >= 1 && lesson <= A11_PREVIEW_LESSONS) props.lesson = lesson;

  if (input.productKey === A11_PRODUCT_KEY) {
    props.productKey = A11_PRODUCT_KEY;
    // Never the caller's number: the price the checkout charges.
    props.amount = LEVEL_COURSES[A11_PRODUCT_KEY].price;
    props.currency = CURRENCY;
  }

  if (typeof input.experiment === 'string' && /^[a-z0-9-]{1,24}$/.test(input.experiment)) {
    props.experiment = input.experiment;
  }

  return props;
}
