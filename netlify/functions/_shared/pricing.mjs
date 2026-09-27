// Price values for email and any other function surface that cannot import the
// pricing data layer.
//
// THIS IS A SYNCED COPY of src/data/pricing.js, not a second opinion.
// netlify/functions/ has its own dependency tree and is bundled by esbuild, so
// a relative import reaching back into src/ is fragile (same reasoning as
// _shared/brand.mjs). tests/claims.test.mjs compares every value below against
// the data layer and fails if they drift — which is the only thing keeping a
// synced copy honest. If a price changes, change src/data/pricing.js first and
// let the failing test point here.

export const MONTHLY_PRICE_EUR = 9.99;

/** English price convention: €9.99 (mirrors pricing.js `eur`). */
export const eur = (v) => `€${v.toFixed(2)}`;

// ─── one-time level courses (mirrors pricing.js, same names) ────────────────
// The trial-end emails offer the course for the learner's level
// (netlify/functions/trial-lifecycle.mjs). Only the values that offer needs are
// copied; SELLABLE_LEVELS is DERIVED here exactly as it is in the data layer,
// so a level moving out of COMING_SOON_LEVELS there fails the test until it
// moves here too.

export const ALL_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

/** Gross one-time price in EUR per sub-level. A1.1 is free and has no product. */
export const SUBLEVEL_PRICES_EUR = {
  'a1.2': 40,
  'a2.1': 50,
  'a2.2': 50,
  'b1.1': 60,
  'b1.2': 60,
  'b2.1': 65,
  'b2.2': 65,
};

/** Listed, priced, not yet buyable. */
export const COMING_SOON_LEVELS = ['b1.1', 'b1.2', 'b2.1', 'b2.2'];

/** Sub-levels a visitor can buy today (priced and not coming soon). */
export const SELLABLE_LEVELS = Object.keys(SUBLEVEL_PRICES_EUR).filter((l) => !COMING_SOON_LEVELS.includes(l));

/** The included Pro window a course purchase grants (the webhook's proDays). */
export const COURSE_PRO_DAYS = 90;
export const COURSE_PRO_MONTHS = Math.floor(COURSE_PRO_DAYS / 30);

/** Product key for a sub-level: 'a1.2' → 'course_a1_2' (env vars are COURSE_A1_2). */
export const productKeyForLevel = (level) => `course_${String(level).toLowerCase().replace('.', '_')}`;
