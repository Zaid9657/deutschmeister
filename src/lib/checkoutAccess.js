import { PLANS, COURSES, LEVEL_COURSES, LEGACY_LEVEL_COURSES, levelsForProduct } from '../data/pricing.js';

// hasOwnProperty.call, not Object.hasOwn: the SPA's build target includes
// Safari 14, which lacks Object.hasOwn, and esbuild does not polyfill it
// (tests/no-object-hasown.test.mjs). The success page calls these on its
// first render, so a missing method took the payment confirmation down.
const owns = (products, key) => Object.prototype.hasOwnProperty.call(products, key || '');

export const isRecurringProduct = (key) => owns(PLANS, key);

export const checkoutProductKey = (key) =>
  [PLANS, COURSES, LEVEL_COURSES, LEGACY_LEVEL_COURSES].some((products) => owns(products, key)) ? key : null;

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
  if (typeof id !== 'string' || !id.trim()) return false;
  // Legacy course rows describe course access, not the retained recurring plan.
  // Reconciliation clears its ID once the provider confirms it is terminal.
  if (subscription.plan_type === 'course') return true;
  if (subscription.status === 'expired') return false;
  if (subscription.status === 'cancelled' && Date.parse(subscription.subscription_end) <= now) return false;
  return true;
};

export const checkoutEntitlementConfirmed = (key, { isSubscribed, purchases = [] }) =>
  isRecurringProduct(key) ? isSubscribed === true : Boolean(key && ownsCheckoutProduct(key, purchases));

// A renewal that failed (Lemon Squeezy past_due, or unpaid once its retries
// ran out). The fix is a new card in the portal, never a new plan, so
// /subscription says so instead of "Trial expired" (lib/subscriptionHeading.js).
// Copy only: whether such a row grants access is checkSubscriptionStatus's call.
export const hasFailedPayment = (subscription, now = Date.now()) =>
  hasRecurringBilling(subscription, now) && ['past_due', 'unpaid'].includes(subscription.status);

// The level a guard just refused: LevelSubscriptionGuard and SubscriptionGuard
// redirect to /subscription with the blocked location in state.from, and
// /subscription leads with that level's course (tests/subscription-blocked-level.test.mjs).
const BLOCKED_LEVEL = /^\/(?:course|level|reading|listening)\/([ab][12]\.[12])(?=\/|$)/;
export const blockedLevelFrom = (pathname) =>
  BLOCKED_LEVEL.exec(String(pathname || '').toLowerCase())?.[1] ?? null;
