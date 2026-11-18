// Course access is separate from AI Practice. Existing recurring subscribers
// retain their course access; new plans buy AI tools only. Missing/invalid
// dates fail closed rather than accidentally grandfathering a new plan.
import { subscriptionStatus } from './subscriptionStatus.js';
import { levelsForProduct, ownedPurchases } from '../data/pricing.js';
import { isLevelFree, freeLektionen, LEKTION_GATE_FROM } from '../config/freeTier.js';

export const COURSE_SUBSCRIPTION_CUTOFF = '2026-11-10T00:00:00.000Z';
export function subscriptionOpensCourses(subscription, now = Date.now()) {
  if (!subscriptionStatus(subscription, now).isActive) return false;
  // Included course practice windows and explicit day grants keep their
  // existing access, independently of the recurring subscriber cutoff.
  if (['course', 'grant'].includes(subscription.plan_type)) return true;
  const start = Date.parse(subscription.subscription_start || subscription.created_at);
  return Number.isFinite(start) && start < Date.parse(COURSE_SUBSCRIPTION_CUTOFF);
}

// Everything that opens a level except its being free: a bought course, a
// subscription or window that still opens courses, a live trial.
function paidAccessReason({ profile, subscription, purchases = [] } = {}, level, now) {
  const active = purchases.filter((p) => !p.status || p.status === 'active');
  if (active.some((p) => levelsForProduct(p.product_key).includes(String(level || '').toLowerCase()))) return 'owned';
  if (profile?.subscription_tier === 'premium' || subscriptionOpensCourses(subscription, now)
    || active.some((p) => Date.parse(p.access_until) > now)) return 'pro';
  if (profile?.trial_started_at && !profile.is_subscribed && Date.parse(profile.trial_ends_at) > now) return 'trial';
  return null;
}

export function courseAccessReason(account, level, now = Date.now()) {
  const paid = paidAccessReason(account, level, now);
  if (paid === 'owned') return paid;
  if (isLevelFree(level)) return 'free';
  return paid;
}

/**
 * Access to a WHOLE guided course. Same answer as courseAccessReason, except
 * for a level whose course is free only up to its first Lektion(en) while the
 * Lektion gate is live (src/config/freeTier.js): there "free" is not enough.
 * The rest opens for an account older than the gate, for any live subscription
 * (owner decision 2026-11-18 — also one started after COURSE_SUBSCRIPTION_CUTOFF),
 * for anyone who bought anything, and for a live window or trial.
 */
export function fullCourseReason(account = {}, level, now = Date.now(), gateFrom = LEKTION_GATE_FROM) {
  const reason = courseAccessReason(account, level, now);
  if (reason !== 'free' || !freeLektionen(level, gateFrom)) return reason;
  const { profile, subscription, purchases } = account;
  if (Date.parse(profile?.created_at) < Date.parse(gateFrom)) return 'free';
  if (subscriptionStatus(subscription, now).isActive) return 'pro';
  if (ownedPurchases(purchases).length > 0) return 'owned';
  return paidAccessReason(account, level, now);
}
