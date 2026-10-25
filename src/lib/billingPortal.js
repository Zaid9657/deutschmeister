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
// The decision has two inputs, both of which /profile already had: the
// paid-access answer (hasActiveSubscription()) and the subscription row
// SubscriptionContext loaded. Nothing here reads or changes entitlement.
// subscriptionPortalAction (below) is the same portal link on /subscription
// (tests/subscription-portal-link.test.mjs).

import { SUPPORT_LINK } from '../data/navigation.js';
import { hasRecurringBilling } from './checkoutAccess.js';

/** The store's customer portal. The customer signs in with the email address they paid with. */
export const BILLING_PORTAL_URL = 'https://deutsch-meister.lemonsqueezy.com/billing';

/**
 * The plan control on /profile. Three answers:
 *   - 'portal': recurring billing, by the one rule of /pricing/, the
 *     /subscription plan buttons and the deletion check
 *     (lib/checkoutAccess.js hasRecurringBilling): a row that still carries a
 *     Lemon Squeezy subscription id until reconciliation clears it, with or
 *     without paid access right now. A failed renewal past its paid period, a
 *     paused plan or a legacy course row whose included Pro expired can still
 *     charge; "Upgrade" would sell them a second plan. "Manage plan" opens the
 *     portal.
 *   - 'upgrade': no paid access and no recurring billing (a trial, an ended
 *     plan, none): "Upgrade" on /pricing/.
 *   - 'support': paid access with no Lemon Squeezy subscription. The portal's
 *     sign-in finds no account for a comped row (an owner grant: no Lemon
 *     Squeezy ids; 2 of 9 live paid periods on 2026-10-02), and a course row
 *     without a subscription id holds a one-time order, not a plan.
 *     /pricing/ would sell them what they already have. They get a plain line
 *     and a link to /support with the payment category preselected, never a
 *     button. A course row that still carries a subscription id is billing
 *     (see subscriptionPortalAction) and gets the portal.
 *
 * @param {boolean} isSubscribed  hasActiveSubscription() for the signed-in user
 * @param {{ plan_type?: string | null, lemonsqueezy_subscription_id?: string | null } | null | undefined} subscription  the row from useSubscription()
 * @returns {{ kind: 'portal' | 'upgrade' | 'support', href: string, label: string, hint: string | null }}
 */
export function profilePlanAction(isSubscribed, subscription) {
  // The /subscription plan buttons' decision, subscriptionPortalAction(recurringBilling, …).
  if (subscriptionPortalAction(hasRecurringBilling(subscription), subscription, false)) {
    return {
      kind: 'portal',
      href: BILLING_PORTAL_URL,
      label: 'Manage plan',
      hint: 'Opens the Lemon Squeezy customer portal. Sign in there with the email address you paid with.',
    };
  }
  if (!isSubscribed) return { kind: 'upgrade', href: '/pricing/', label: 'Upgrade', hint: null };
  const support = { kind: 'support', href: `${SUPPORT_LINK.href}?topic=payment`, label: 'Contact support' };
  if (subscription?.plan_type === 'course') {
    return { ...support, hint: 'Your Pro access comes with your course purchase and does not renew, so there is nothing to manage.' };
  }
  return { ...support, hint: 'Your plan is managed by our team.' };
}

/**
 * The billing link on /subscription (revenue agent, 2026-10-02).
 *
 * /subscription showed a subscriber the plan and its end date and no way to
 * change the card, see an invoice or cancel, so a customer whose renewal failed
 * could not get from the account screen to the portal that fixes it.
 *
 * Shown only for a live Lemon Squeezy subscription: the paid-access answer the
 * page already has AND a lemonsqueezy_subscription_id on the row it already
 * loaded (subscriptionService.getSubscription selects every column). A trial
 * has no row; a comped row has no Lemon Squeezy ids; a course row without a
 * subscription id holds an order, not a subscription. The portal has nothing
 * of theirs to manage, so they get no link. Nothing here reads or changes
 * entitlement.
 *
 * One rule with lib/checkoutAccess.js hasRecurringBilling and the deletion
 * check (netlify/functions/delete-account.mjs hasChargingSubscription): a row
 * that still carries a lemonsqueezy_subscription_id is recurring billing until
 * reconciliation clears it, whatever its plan_type. An older webhook's course
 * upsert left the subscription's id on the course row, and reconciliation
 * keeps it while that plan may still charge (the yearly plan of a course buyer
 * renews long after the course window). /subscription called that row billing
 * and then crashed on a null action; /profile said "nothing to manage".
 * tests/legacy-course-billing.test.mjs.
 *
 * @param {boolean} isSubscribed  hasActiveSubscription() for the signed-in user
 * @param {{ lemonsqueezy_subscription_id?: string | null } | null | undefined} subscription  the row from useSubscription()
 * @param {boolean} isGerman  the page's language switch
 * @returns {{ href: string, label: string, hint: string } | null}
 */
export function subscriptionPortalAction(isSubscribed, subscription, isGerman) {
  const lsSubscriptionId = subscription?.lemonsqueezy_subscription_id;
  if (isSubscribed !== true || typeof lsSubscriptionId !== 'string' || lsSubscriptionId.trim() === '') return null;
  if (isGerman) {
    return {
      href: BILLING_PORTAL_URL,
      label: 'Abonnement verwalten',
      hint: 'Karte ändern, Rechnungen ansehen oder kündigen: im Kundenportal von Lemon Squeezy. Melden Sie sich dort mit der E-Mail-Adresse an, mit der Sie bezahlt haben.',
    };
  }
  return {
    href: BILLING_PORTAL_URL,
    label: 'Manage billing',
    hint: 'Change your card, see invoices or cancel in the Lemon Squeezy customer portal. Sign in there with the email address you paid with.',
  };
}
