// The plan button on /profile, and where it sends a subscriber (product agent,
// 2026-10-02).
//
// WHY THIS FILE EXISTS. /profile showed a subscriber a "Manage plan" button that
// linked /pricing/. /pricing/ sells plans. It cannot cancel one, resume it or
// change the card, so a paying customer who pressed the button went in a
// circle. Billing lives with Lemon Squeezy, in the store's customer portal: the
// address the dunning mail and the support agent already send people to
// (netlify/functions/_shared/dunningLink.mjs BILLING_PORTAL_URL). It is copied
// here because the SPA does not import from netlify/functions.
// tests/profile-plan-button.test.mjs fails if the copies ever differ, and it
// keeps billing-management labels in this file, next to the portal link.
//
// The decision has one input: the paid-access answer /profile already had
// (hasActiveSubscription()). Nothing here reads or changes entitlement.

/** The store's customer portal. The customer signs in with the email address they paid with. */
export const BILLING_PORTAL_URL = 'https://deutsch-meister.lemonsqueezy.com/billing';

/**
 * The plan button on /profile.
 *
 * @param {boolean} isSubscribed  hasActiveSubscription() for the signed-in user
 * @returns {{ href: string, label: string, hint: string | null }}
 */
export function profilePlanAction(isSubscribed) {
  if (isSubscribed) {
    return {
      href: BILLING_PORTAL_URL,
      label: 'Manage plan',
      hint: 'Opens the Lemon Squeezy customer portal. Sign in there with the email address you paid with.',
    };
  }
  return { href: '/pricing/', label: 'Upgrade', hint: null };
}
