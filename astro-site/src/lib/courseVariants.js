// Build-time checkout ids for the level courses, one PUBLIC_ var per product
// key (Vite only inlines statically-named env reads, so no lookup by key).
// A coming-soon course is never given an id, whatever the env says — the
// "never open a dead checkout" rule from src/config/lemonsqueezy.js.
import { LEVEL_COURSES } from '../data/pricing.js';

const VARIANTS = {
  course_a1_2: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID || '',
  course_a2_1: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID || '',
  course_a2_2: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_A2_2_VARIANT_ID || '',
  course_b1_1: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_B1_1_VARIANT_ID || '',
  course_b1_2: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_B1_2_VARIANT_ID || '',
  course_b2_1: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_B2_1_VARIANT_ID || '',
  course_b2_2: import.meta.env.PUBLIC_LEMONSQUEEZY_COURSE_B2_2_VARIANT_ID || '',
};

/** The catalogue with its checkout id attached ('' when not buyable). */
export const levelCoursesWithVariants = () =>
  Object.values(LEVEL_COURSES).map((c) => ({ ...c, variantId: c.comingSoon ? '' : (VARIANTS[c.key] || '') }));

/**
 * The telc B1 pilot's checkout id, '' while it is not on sale. Two conditions,
 * the same two as the SPA's src/config/lemonsqueezy.js: the owner has switched
 * the sale on (PUBLIC_TELC_B1_ON_SALE=true, builds scope) AND the product has a
 * checkout id. The switch exists so a Lemon Squeezy reprice and a test purchase
 * happen BEFORE the first Buy button renders (docs/telc-pilot/README.md).
 */
export const telcPilotVariant = () =>
  import.meta.env.PUBLIC_TELC_B1_ON_SALE === 'true' ? (import.meta.env.PUBLIC_LEMONSQUEEZY_TELC_B1_VARIANT_ID || '') : '';
