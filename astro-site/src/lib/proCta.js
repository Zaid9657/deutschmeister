// The /pricing/ Pro button: its label names what the click does
// (conversion agent, 2026-09-30).
//
// WHY THIS FILE EXISTS. From 2026-09-14 the button read "Start 7-day Pro trial"
// for every visitor, and no click on it started a trial:
//   - signed in, it opened the Lemon Squeezy Pro checkout. That checkout charges
//     at once: all 12 `subscription_created` webhooks on record (2026-03-10 to
//     2026-08-27) arrived with status "active" and no trial_ends_at;
//   - signed out, it stored a `monthly` buy intent and sent the visitor to
//     /signup. Signup creates the real trial (7 days, no card), and then
//     /subscription?buy=monthly opened that same paid checkout on arrival.
// So a visitor who asked for a free trial got a charge screen. That is the
// misleading kind of CTA (UWG §5), and it sits on the page where intent is
// highest.
//
// THE RULE:
//   signed out -> "Start 7-day Pro trial" -> /signup, with NO buy intent. The
//                 account trial is the trial, and nothing is charged.
//   signed in  -> "Go Pro — €9.99/month" (or the yearly price) -> the checkout.
// Figures derive from pricing.js and marketing.js, never retyped
// (tests/claims.test.mjs). Pure, so tests/pro-cta.test.mjs pins it under
// node --test; the page renders it at build time and its script re-renders it
// once it knows whether a session exists.
import { PLANS, eur } from '../data/pricing.js';
import { TRIAL_DAYS } from '../data/marketing.js';

/** Absolute, because /signup is an SPA route: a full page load, never the Astro router. */
export const SIGNUP_URL = 'https://deutsch-meister.de/signup';

/**
 * What the Pro button says and does.
 * @param {{ signedIn?: boolean, cycle?: 'monthly'|'yearly' }} [p]
 * @returns {{ action: 'signup'|'checkout', label: string, note: string, href: string|null, plan: string|null }}
 */
export function proCta({ signedIn = false, cycle = 'monthly' } = {}) {
  if (!signedIn) {
    return {
      action: 'signup',
      label: `Start ${TRIAL_DAYS}-day Pro trial`,
      note: 'No card · no automatic charge',
      href: SIGNUP_URL,
      plan: null,
    };
  }
  const plan = PLANS[cycle] || PLANS.monthly;
  return {
    action: 'checkout',
    label: `Go Pro — ${eur(plan.price)}/${plan.interval}`,
    note: plan.key === 'yearly'
      ? `${eur(plan.asMonthly)} a month, billed yearly · cancel anytime`
      : `${eur(plan.perDay)} a day · cancel anytime`,
    href: null,
    plan: plan.key,
  };
}
