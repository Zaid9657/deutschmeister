// LemonSqueezy configuration for DeutschMeister.
//
// Prices and derived figures come from src/data/pricing.js; user-facing claims
// come from src/data/marketing.js. Only the variant IDs and the checkout URL
// live here — those are checkout plumbing, not shared copy, and the Astro site
// has no use for them.
//
// No plan feature list lives here any more (2026-10-06). The two `features`
// arrays were read by nothing, and the yearly one still promised "Priority
// support" and "Early access to new content", which nothing delivers; it is
// the list /subscription's cards had been copied from. What Pro includes is
// src/lib/proPlanLines.js (tests/subscription-plan-lines.test.mjs).
import { PLANS, COURSES, LEVEL_COURSES, OFFER_PRODUCTS, CURRENCY, launchDiscountCode, isProductOnSale, LAUNCH_CODES } from '../data/pricing.js';

export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '309512',

  plans: {
    monthly: {
      name: PLANS.monthly.name,
      tier: 'pro',
      price: PLANS.monthly.price,
      currency: CURRENCY,
      interval: PLANS.monthly.interval,
      variantId: '', // Retained for existing billing display only; off sale.
    },
    yearly: {
      name: PLANS.yearly.name,
      tier: 'pro',
      price: PLANS.yearly.price,
      currency: CURRENCY,
      interval: PLANS.yearly.interval,
      variantId: '', // Existing renewals are handled by the webhook.
      savings: `${PLANS.yearly.savingPercent}%`,
    },
  },

  // One-time products. Unlike the plans there is NO hardcoded fallback id:
  // an unset variant means the product does not exist in the store yet, and
  // every purchase surface must hide rather than open a dead checkout.
  //
  // The telc product is the B1 pilot (docs/telc-pilot/README.md) and has a
  // second condition: it is on sale only while the owner has set
  // PUBLIC_TELC_B1_ON_SALE=true (builds scope, shared with the Astro page via
  // envPrefix in vite.config.js). Until then its id stays '' even when the
  // variant env var is set — the /subscription card, handleBuyCourse and the
  // ?buy= resume all read this one field, so none of them can open a checkout
  // at a price the store has not been switched to yet.
  courses: {
    telc_b1_komplett: {
      name: COURSES.telc_b1_komplett.name,
      price: COURSES.telc_b1_komplett.price,
      currency: CURRENCY,
      proMonths: COURSES.telc_b1_komplett.proMonths,
      variantId: import.meta.env.PUBLIC_TELC_B1_ON_SALE === 'true' ? (import.meta.env.VITE_LEMONSQUEEZY_TELC_B1_VARIANT_ID || '') : '',
    },
  },

  // Level courses, one per paid sub-level (2026-09-08). Same no-fallback rule:
  // an unset variant hides the buy button (a coming-soon course has none by
  // design). Vite only inlines statically-named env reads, so each one is
  // spelled out rather than looked up by key.
  offerProducts: {
    a1_exam_pack: { ...OFFER_PRODUCTS.a1_exam_pack, variantId: import.meta.env.VITE_LEMONSQUEEZY_A1_EXAM_PACK_VARIANT_ID || '' },
  },
  levelCourses: {
    course_a1_1: { ...LEVEL_COURSES.course_a1_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID || '' },
    course_a1_2: { ...LEVEL_COURSES.course_a1_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID || '' },
    course_a2_1: { ...LEVEL_COURSES.course_a2_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID || '' },
    course_a2_2: { ...LEVEL_COURSES.course_a2_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A2_2_VARIANT_ID || '' },
    course_b1_1: { ...LEVEL_COURSES.course_b1_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B1_1_VARIANT_ID || '' },
    course_b1_2: { ...LEVEL_COURSES.course_b1_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B1_2_VARIANT_ID || '' },
    course_b2_1: { ...LEVEL_COURSES.course_b2_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B2_1_VARIANT_ID || '' },
    course_b2_2: { ...LEVEL_COURSES.course_b2_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B2_2_VARIANT_ID || '' },
  },

  // Generate checkout URL with user info
  // `coupon` (optional): a code validated by coupon-validate. It rides along
  // as checkout[discount_code] (LS prefills it) AND checkout[custom][coupon]
  // (comes back on the order webhook as meta.custom_data.coupon, which is how
  // the redemption ledger attributes it — deterministically, never guessed
  // from the discount total).
  getCheckoutUrl: (variantId, userEmail, userId, coupon, productKey, now = Date.now()) => {
    if (!variantId || (productKey && !isProductOnSale(productKey))) return null;
    const baseUrl = `https://deutsch-meister.lemonsqueezy.com/checkout/buy/${variantId}`;
    const params = new URLSearchParams({
      'checkout[email]': userEmail || '',
      'checkout[custom][user_id]': userId || '',
    });
    const level = LEVEL_COURSES[productKey]?.levels[0];
    const launchCode = level ? launchDiscountCode(level, now) : null;
    const manualCode = Object.values(LAUNCH_CODES).includes(coupon?.code) ? null : coupon?.code;
    const code = launchCode || manualCode;
    if (code) {
      params.set('checkout[discount_code]', String(code));
      // Launch codes belong to the provider, not the app coupon ledger.
      if (!launchCode) params.set('checkout[custom][coupon]', String(code).trim().toUpperCase());
    }
    return `${baseUrl}?${params.toString()}`;
  },
};
