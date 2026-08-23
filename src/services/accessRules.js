// The two predicates that decide whether a user may enter a paid route.
//
// They live in their own module, with NO imports, for one reason: they are the
// highest-consequence pure functions in the app and they must be testable
// without a database client. subscriptionService.js imports the Supabase client
// at module load, so anything defined there can only be exercised in a browser.
// tests/access.test.mjs imports this file directly.
//
// subscriptionService.js re-exports both names, so every existing call site
// (SubscriptionContext) keeps its import path unchanged.

/**
 * Trial state from a profile row.
 *
 * A subscribed user is never "in trial" — the two are exclusive, and the paid
 * subscription is what governs their access (see checkSubscriptionStatus).
 *
 * @param {object|null} profile a `profiles` row, or null while it loads
 * @returns {{isInTrial: boolean, daysRemaining: number, hasTrialStarted: boolean}}
 */
export const checkTrialStatus = (profile) => {
  if (!profile || !profile.trial_started_at || !profile.trial_ends_at) {
    return { isInTrial: false, daysRemaining: 0, hasTrialStarted: false };
  }

  // If user is subscribed, they're no longer in trial
  if (profile.is_subscribed) {
    return { isInTrial: false, daysRemaining: 0, hasTrialStarted: true };
  }

  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);
  const diffMs = trialEnd - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isInTrial: diffMs > 0,
    daysRemaining,
    hasTrialStarted: true,
  };
};

/**
 * Single source of truth for paid access: a subscription grants access iff its
 * PAID PERIOD is still live (subscription_end > now), regardless of status.
 *   - 'cancelled' with a future end → renewal off but paid through period → access
 *   - 'past_due'  with a future end → failed-renewal grace period → access
 *   - end <= now, or missing/unparseable end, or no row → no access
 *
 * @param {object|null} subscription a `subscriptions` row, or null
 * @returns {{isActive: boolean, expiresAt: string|null, planType?: string}}
 */
export const checkSubscriptionStatus = (subscription) => {
  if (!subscription || !subscription.subscription_end) {
    return { isActive: false, expiresAt: null };
  }

  const endDate = new Date(subscription.subscription_end);
  // Guard against an unparseable date — never crash, treat as no access.
  if (Number.isNaN(endDate.getTime())) {
    return { isActive: false, expiresAt: null };
  }

  const isActive = endDate > new Date();

  return {
    isActive,
    expiresAt: subscription.subscription_end,
    planType: subscription.plan_type,
  };
};

/**
 * What SubscriptionContext computes as `hasAccess`, in one place so a test can
 * pin the whole truth table rather than the two halves separately.
 *
 * Deliberately does NOT consult profile.is_subscribed: that flag and the
 * subscriptions row used to disagree, which blocked payers and showed the wrong
 * page. Paid access comes from the subscription's period, trial access from the
 * profile's trial window, and nothing else grants either.
 */
export const hasAccess = (profile, subscription) =>
  checkTrialStatus(profile).isInTrial || checkSubscriptionStatus(subscription).isActive;
