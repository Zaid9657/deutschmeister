// Where a subscriber cancels: the store's Lemon Squeezy customer portal
// (conversion agent, 2026-10-02).
//
// WHY THIS FILE EXISTS. The /pricing/ FAQ answered "Can I cancel anytime?" with
// "Yes, from your account page." No account page can cancel: /subscription
// shows the plan and its end date, and the app holds no cancel action. All 10
// subscription_cancelled webhooks on record came through Lemon Squeezy. So the
// answer sent a paying customer to a page that cannot do what it promised.
// (/profile's "Manage plan" now opens the same portal: src/lib/billingPortal.js.)
//
// The URL is the one the dunning mail and the support agent already use
// (netlify/functions/_shared/dunningLink.mjs BILLING_PORTAL_URL). It is copied
// here because the Astro package does not import from netlify/functions.
// tests/cancel-path.test.mjs fails if the two copies ever differ.

/** The store's customer portal. The customer signs in with the email address they subscribed with. */
export const BILLING_PORTAL_URL = 'https://deutsch-meister.lemonsqueezy.com/billing';

/** The same address without the scheme, for copy (the FAQ answer and its FAQPage JSON-LD text). */
export const BILLING_PORTAL_LABEL = BILLING_PORTAL_URL.replace(/^https:\/\//, '');
