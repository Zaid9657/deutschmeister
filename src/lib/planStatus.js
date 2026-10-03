// What the status card on /subscription calls the row it shows (revenue agent,
// 2026-10-03).
//
// WHY THIS FILE EXISTS. The card titled every row with paid access "Active
// Subscription" and named the plan with a single test: plan_type 'yearly' read
// "Yearly Plan" and every other value read "Monthly Plan". A course purchase
// writes a 'course' row (lemonsqueezy-webhook.mjs handleCourseOrder): Pro
// included for a fixed window, bought once, renewed by nothing. That buyer was
// told they hold a monthly subscription. (0 'course' rows on 2026-10-03, so
// nobody has seen it yet; the first course sale would.)
//
// The rule: the card names a billing cadence only when the row carries one,
// and calls a course row what it is. Copy only. hasActiveSubscription() still
// decides whether the card shows at all; nothing here reads or changes
// entitlement. tests/plan-status.test.mjs.

/** The cadences a Lemon Squeezy plan row can carry (src/data/pricing.js PLANS). */
const CADENCE = {
  monthly: { en: 'Monthly Plan', de: 'Monatsplan' },
  yearly: { en: 'Yearly Plan', de: 'Jahresplan' },
};

/**
 * The status card's heading and plan line for a row with paid access.
 *
 * @param {{ plan_type?: string | null } | null | undefined} subscription  the row from useSubscription()
 * @param {boolean} isGerman  the page's language switch
 * @returns {{ title: string, plan: string }}
 */
export function planStatusCopy(subscription, isGerman) {
  const planType = subscription?.plan_type;
  if (planType === 'course') {
    return isGerman
      ? { title: 'Pro-Zugang', plan: 'Im Kurskauf enthalten' }
      : { title: 'Pro access', plan: 'Included with your course purchase' };
  }
  const cadence = typeof planType === 'string' && Object.hasOwn(CADENCE, planType) ? CADENCE[planType] : null;
  return {
    title: isGerman ? 'Aktives Abonnement' : 'Active Subscription',
    // A plan_type the card does not know names no cadence rather than a wrong one.
    plan: cadence ? (isGerman ? cadence.de : cadence.en) : 'Pro',
  };
}
