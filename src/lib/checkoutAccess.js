import { PLANS, COURSES, LEVEL_COURSES, LEGACY_LEVEL_COURSES, levelsForProduct } from '../data/pricing.js';

export const isRecurringProduct = (key) => Object.hasOwn(PLANS, key || '');

export const checkoutProductKey = (key) =>
  [PLANS, COURSES, LEVEL_COURSES, LEGACY_LEVEL_COURSES].some((products) => Object.hasOwn(products, key || '')) ? key : null;

// Ownership is permanent, including retired band purchases and the all-level
// bundle. A live trial or Pro period is not ownership of a course.
export const ownsCheckoutProduct = (key, purchases = []) => {
  const active = purchases.filter((p) => !p.status || p.status === 'active');
  if (active.some((p) => p.product_key === key)) return true;
  const levels = levelsForProduct(key);
  return levels.length > 0 && levels.every((level) =>
    active.some((p) => levelsForProduct(p.product_key).includes(level))
  );
};

// Failed payments and paused plans still belong in the portal. A missing or
// stale paid-access flag must never sell a second recurring subscription.
export const hasRecurringBilling = (subscription, now = Date.now()) => {
  const id = subscription?.lemonsqueezy_subscription_id;
  if (typeof id !== 'string' || !id.trim() || subscription.plan_type === 'course' || subscription.status === 'expired') return false;
  if (subscription.status === 'cancelled' && Date.parse(subscription.subscription_end) <= now) return false;
  return true;
};

export const checkoutEntitlementConfirmed = (key, { isSubscribed, purchases = [] }) =>
  isRecurringProduct(key) ? isSubscribed === true : Boolean(key && ownsCheckoutProduct(key, purchases));
