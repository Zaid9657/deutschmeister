import { subscriptionHasPaidAccess, latestCourseWindow } from './subscriptionEntitlement.mjs';

// Lifetime course ownership and its included Pro window are separate grants.
export function flagsFromRows(subs, purchases, now) {
  const paid = subs.some((s) => subscriptionHasPaidAccess(s, now)) || Boolean(latestCourseWindow(purchases, now));
  return { is_subscribed: paid, subscription_tier: paid ? 'pro' : 'free' };
}
