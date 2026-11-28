// Course access is separate from AI Practice. Existing recurring subscribers
// retain their course access; new plans buy AI tools only. Missing/invalid
// dates fail closed rather than accidentally grandfathering a new plan.
import { subscriptionStatus } from './subscriptionStatus.js';
import { levelsForProduct, ownedPurchases } from '../data/pricing.js';
import { isLevelFree, freeLektionen, LEKTION_GATE_FROM, PRICING_V2_FROM } from '../config/freeTier.js';

export const COURSE_SUBSCRIPTION_CUTOFF = '2026-11-10T00:00:00.000Z';
export function subscriptionOpensCourses(subscription, now = Date.now(), pricingFrom = PRICING_V2_FROM) {
  if (!subscriptionStatus(subscription, now).isActive) return false;
  // Included course practice windows and explicit day grants keep their
  // existing access, independently of the recurring subscriber cutoff.
  if (['course', 'grant'].includes(subscription.plan_type)) return beforePricingSwitch(subscription, pricingFrom);
  const start = Date.parse(subscription.subscription_start || subscription.created_at);
  return Number.isFinite(start) && start < Date.parse(COURSE_SUBSCRIPTION_CUTOFF);
}

// Everything that opens a level except its being free: a bought course, a
// subscription or historical window that still opens courses. Trials are AI-only.
export const beforePricingSwitch = (row, pricingFrom = PRICING_V2_FROM) => {
  const start = Date.parse(row?.subscription_start || row?.created_at);
  return Number.isFinite(start) && start < Date.parse(pricingFrom);
};

function paidAccessReason({ profile, subscription, purchases = [] } = {}, level, now, pricingFrom) {
  const active = purchases.filter((p) => !p.status || p.status === 'active');
  if (active.some((p) => levelsForProduct(p.product_key).includes(String(level || '').toLowerCase()))) return 'owned';
  if (profile?.subscription_tier === 'premium' || subscriptionOpensCourses(subscription, now, pricingFrom)
    || active.some((p) => beforePricingSwitch(p, pricingFrom) && Date.parse(p.access_until) > now)) return 'pro';
  return null;
}

export function courseAccessReason(account, level, now = Date.now(), pricingFrom = PRICING_V2_FROM) {
  const paid = paidAccessReason(account, level, now, pricingFrom);
  if (paid === 'owned') return paid;
  if (isLevelFree(level)) return 'free';
  return paid;
}

/**
 * Access to a WHOLE guided course. Same answer as courseAccessReason, except
 * for a level whose course is free only up to its first Lektion(en) while the
 * Lektion gate is live (src/config/freeTier.js): there "free" is not enough.
 * Older accounts keep their full course. Existing subscriptions and purchases
 * keep their pre-switch meaning. New purchases open only their own levels;
 * their included AI window and the account trial never open another course.
 */
export function fullCourseReason(account = {}, level, now = Date.now(), gateFrom = LEKTION_GATE_FROM, pricingFrom = PRICING_V2_FROM) {
  const reason = courseAccessReason(account, level, now, pricingFrom);
  if (reason !== 'free' || !freeLektionen(level, gateFrom)) return reason;
  const { profile, subscription, purchases } = account;
  if (Date.parse(profile?.created_at) < Date.parse(gateFrom)) return 'free';
  if (subscriptionStatus(subscription, now).isActive && beforePricingSwitch(subscription, pricingFrom)) return 'pro';
  if (ownedPurchases(purchases).some((p) => beforePricingSwitch(p, pricingFrom))) return 'owned';
  // The 7-day trial does NOT open it (owner decision 2026-11-18: "No, Lektion 1 only").
  return paidAccessReason(account, level, now, pricingFrom);
}
