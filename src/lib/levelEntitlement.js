// Course access is separate from AI Practice. Existing recurring subscribers
// retain their course access; new plans buy AI tools only. Missing/invalid
// dates fail closed rather than accidentally grandfathering a new plan.
import { subscriptionStatus } from './subscriptionStatus.js';
import { levelsForProduct } from '../data/pricing.js';
import { isLevelFree } from '../config/freeTier.js';

export const COURSE_SUBSCRIPTION_CUTOFF = '2026-11-10T00:00:00.000Z';
export function subscriptionOpensCourses(subscription, now = Date.now()) {
  if (!subscriptionStatus(subscription, now).isActive) return false;
  // Included course practice windows and explicit day grants keep their
  // existing access, independently of the recurring subscriber cutoff.
  if (['course', 'grant'].includes(subscription.plan_type)) return true;
  const start = Date.parse(subscription.subscription_start || subscription.created_at);
  return Number.isFinite(start) && start < Date.parse(COURSE_SUBSCRIPTION_CUTOFF);
}

export function courseAccessReason({ profile, subscription, purchases = [] } = {}, level, now = Date.now()) {
  const active = purchases.filter((p) => !p.status || p.status === 'active');
  if (active.some((p) => levelsForProduct(p.product_key).includes(String(level || '').toLowerCase()))) return 'owned';
  if (isLevelFree(level)) return 'free';
  if (profile?.subscription_tier === 'premium' || subscriptionOpensCourses(subscription, now)
    || active.some((p) => Date.parse(p.access_until) > now)) return 'pro';
  if (profile?.trial_started_at && !profile.is_subscribed && Date.parse(profile.trial_ends_at) > now) return 'trial';
  return null;
}
