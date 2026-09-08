// LemonSqueezy configuration for DeutschMeister.
//
// Prices and derived figures come from src/data/pricing.js; user-facing claims
// come from src/data/marketing.js. Only the variant IDs and the checkout URL
// live here — those are checkout plumbing, not shared copy, and the Astro site
// has no use for them.
import { PLANS, COURSES, LEVEL_COURSES, CURRENCY } from '../data/pricing.js';
import { LEVEL_COUNT, SPEAKING_LINE, XRAY_LINE } from '../data/marketing.js';

export const LEMONSQUEEZY_CONFIG = {
  storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID || '309512',

  plans: {
    monthly: {
      name: PLANS.monthly.name,
      tier: 'pro',
      price: PLANS.monthly.price,
      currency: CURRENCY,
      interval: PLANS.monthly.interval,
      variantId: import.meta.env.VITE_LEMONSQUEEZY_MONTHLY_VARIANT_ID || 'dfc81ca3-78f5-4bab-9d62-dca75b3f7e21',
      features: [
        `Full access to all ${LEVEL_COUNT} levels (A1.1–B2.2)`,
        'All grammar lessons with exercises',
        'Listening comprehension exercises',
        'Podcasts & video content',
        'Progress tracking',
        // Was hardcoded "5 speaking sessions per month" — the server has
        // enforced 30 since launch (speakingUsage.mjs PRO_MONTHLY_LIMIT), so
        // this understated the product six-fold on the checkout config.
        SPEAKING_LINE,
        XRAY_LINE,
        'Cancel anytime',
      ],
    },
    yearly: {
      name: PLANS.yearly.name,
      tier: 'pro',
      price: PLANS.yearly.price,
      currency: CURRENCY,
      interval: PLANS.yearly.interval,
      variantId: import.meta.env.VITE_LEMONSQUEEZY_YEARLY_VARIANT_ID || 'd58c1838-d935-4c59-a0ac-0bfce8ec9c3b',
      features: [
        'Everything in Pro Monthly',
        `Save ${PLANS.yearly.savingPercent}% compared to monthly`,
        'Priority support',
        'Early access to new content',
      ],
      savings: `${PLANS.yearly.savingPercent}%`,
    },
  },

  // One-time products. Unlike the plans there is NO hardcoded fallback id:
  // an unset variant means the product does not exist in the store yet, and
  // every purchase surface must hide rather than open a dead checkout.
  courses: {
    telc_b1_komplett: {
      name: COURSES.telc_b1_komplett.name,
      price: COURSES.telc_b1_komplett.price,
      currency: CURRENCY,
      proMonths: COURSES.telc_b1_komplett.proMonths,
      variantId: import.meta.env.VITE_LEMONSQUEEZY_TELC_B1_VARIANT_ID || '',
    },
  },

  // Level courses, one per paid sub-level (2026-09-08). Same no-fallback rule:
  // an unset variant hides the buy button (a coming-soon course has none by
  // design). Vite only inlines statically-named env reads, so each one is
  // spelled out rather than looked up by key.
  levelCourses: {
    course_a1_2: { ...LEVEL_COURSES.course_a1_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID || '' },
    course_a2_1: { ...LEVEL_COURSES.course_a2_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID || '' },
    course_a2_2: { ...LEVEL_COURSES.course_a2_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A2_2_VARIANT_ID || '' },
    course_b1_1: { ...LEVEL_COURSES.course_b1_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B1_1_VARIANT_ID || '' },
    course_b1_2: { ...LEVEL_COURSES.course_b1_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B1_2_VARIANT_ID || '' },
    course_b2_1: { ...LEVEL_COURSES.course_b2_1, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B2_1_VARIANT_ID || '' },
    course_b2_2: { ...LEVEL_COURSES.course_b2_2, currency: CURRENCY, variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_B2_2_VARIANT_ID || '' },
  },

  // Generate checkout URL with user info
  getCheckoutUrl: (variantId, userEmail, userId) => {
    const baseUrl = `https://deutsch-meister.lemonsqueezy.com/checkout/buy/${variantId}`;
    const params = new URLSearchParams({
      'checkout[email]': userEmail || '',
      'checkout[custom][user_id]': userId || '',
    });
    return `${baseUrl}?${params.toString()}`;
  },
};
