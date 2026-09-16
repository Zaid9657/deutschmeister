// What the checkout actually charges — the commerce layer.
//
// DUPLICATED between the SPA and the Astro site (byte-identical, enforced by
// scripts/check-duplicates.mjs). A cross-package import is fragile with two
// separate node_modules trees, which is the same reason competitorComparisons.js
// is duplicated. Change one copy, run `npm run check:duplicates`.
//
// Companion file: ./marketing.js — what the copy CLAIMS. Keep the split:
//   pricing.js  = what the buyer is charged and what they get (must match the
//                 Lemon Squeezy dashboard)
//   marketing.js = what we say about it (must match this file and the servers)
//
// THE RULE THIS FILE EXISTS TO ENFORCE: derive, never retype. Before this file,
// "€0.33/day", "€0.22/day", "€6.67/month" and "Save 33%" were typed by hand in
// four files. All four happened to be arithmetically correct, but a single price
// change would have made every one of them false at once, silently — and a
// price claim that disagrees with the checkout is irreführende Werbung under
// UWG §5, not a typo. The helpers below recompute on every build instead.
//
// Provenance: subscription prices re-cut 2026-09-15 (approved rebuild spec,
// docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md
// §7): the PUBLIC subscription is the AI Coach at €12.99/€129. The Lemon
// Squeezy variants for these prices DO NOT EXIST YET — the owner creates them
// (dashboard-only) and sets the AI_COACH variant env vars; until then every
// subscription checkout surface hides (no-fallback rule below). Existing
// subscribers are GRANDFATHERED on €9.99/€79.99 while continuously
// subscribed: their remote LS subscriptions keep billing the old variants,
// which this file no longer offers to anyone new.

/** Gross price in EUR, billed monthly. */
export const MONTHLY_PRICE_EUR = 12.99;

/** Gross price in EUR, billed once per year. */
export const YEARLY_PRICE_EUR = 129;

/**
 * What existing subscribers keep paying while continuously subscribed
 * (spec §7.3). Display-only — no checkout may ever open at these prices.
 */
export const GRANDFATHERED_MONTHLY_PRICE_EUR = 9.99;
export const GRANDFATHERED_YEARLY_PRICE_EUR = 79.99;

/**
 * One-time speaking top-up: 60 permanent minutes (3,600 seconds — the grant
 * lives in netlify/functions/_shared/speakingGrants.mjs TOPUP_SECONDS and
 * tests/claims.test.mjs compares). Same no-fallback rule as the courses: an
 * unset variant id hides the buy surface.
 */
export const SPEAKING_TOPUP = {
  key: 'speaking_topup_60',
  name: '60 speaking minutes',
  nameDe: '60 Sprechminuten',
  price: 6.99,
  minutes: 60,
};

export const CURRENCY = 'EUR';

/**
 * Days used to derive the monthly plan's per-day rate. A month, not 30.44 —
 * the claim is "less than X a day" about a monthly subscription, and 30 is the
 * number a reader checks it against.
 */
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;

/** Round half-up to cents. Number.toFixed rounds half-to-even in some engines. */
const cents = (n) => Math.round(n * 100) / 100;

/** 9.99 -> "9.99". English/schema.org form: point decimal, no symbol. */
export const num = (n) => cents(n).toFixed(2);

/** 9.99 -> "9,99". German form: comma decimal, no symbol. */
export const deNum = (n) => num(n).replace('.', ',');

/** 9.99 -> "€9.99". English form: symbol first, no space. */
export const eur = (n) => `€${num(n)}`;

/** 9.99 -> "9,99 €". German form: symbol last, regular space (not U+00A0). */
export const deEur = (n) => `${deNum(n)} €`;

/** What the yearly plan works out to per month — "€6.67/month" territory. */
export const YEARLY_AS_MONTHLY_EUR = cents(YEARLY_PRICE_EUR / MONTHS_PER_YEAR);

/** Per-day rate of the monthly plan. */
export const MONTHLY_PER_DAY_EUR = cents(MONTHLY_PRICE_EUR / DAYS_PER_MONTH);

/** Per-day rate of the yearly plan. */
export const YEARLY_PER_DAY_EUR = cents(YEARLY_PRICE_EUR / DAYS_PER_YEAR);

/**
 * Whole-percent saving of paying yearly instead of twelve monthly charges.
 * Floored, never rounded up: overstating a discount is the direction that
 * misleads.
 */
export const YEARLY_SAVING_PERCENT = Math.floor(
  ((MONTHLY_PRICE_EUR * MONTHS_PER_YEAR - YEARLY_PRICE_EUR) / (MONTHLY_PRICE_EUR * MONTHS_PER_YEAR)) * 100,
);

/**
 * One-time exam-prep courses. Same discipline as the subscription prices:
 * these are what the Lemon Squeezy checkout charges (store 309512), every
 * user-facing figure derives, and tests/claims.test.mjs bans the literals
 * from page sources. `proDays` mirrors the included Pro window the webhook
 * grants (netlify/functions/lemonsqueezy-webhook.mjs courseForVariant) —
 * change both together or the copy claims a window the server doesn't grant.
 */
export const COURSE_TELC_B1_PRICE_EUR = 89;
export const COURSE_PRO_DAYS = 90;

/** The included-Pro-window claim in months — "3 Monate Pro-Zugang inklusive". */
export const COURSE_PRO_MONTHS = Math.floor(COURSE_PRO_DAYS / DAYS_PER_MONTH);

export const COURSES = {
  telc_b1_komplett: {
    key: 'telc_b1_komplett',
    name: 'telc B1 Komplettvorbereitung',
    price: COURSE_TELC_B1_PRICE_EUR,
    proDays: COURSE_PRO_DAYS,
    proMonths: COURSE_PRO_MONTHS,
  },
};

/**
 * Level courses — the product, decided 2026-09-03 (docs/monetization-2026-09-03.md),
 * re-cut per SUB-LEVEL on 2026-09-08 (owner decision, see the addendum there),
 * and extended 2026-09-15 (approved rebuild spec,
 * docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md):
 * A1.1's PUBLIC LIBRARY stays free (FREE_LEVELS is untouched), but its GUIDED
 * COURSE is now the €39 one-time product "DeutschStart A1.1" with a
 * three-lesson signed-in preview (`previewLessons`). Every other sub-level is
 * its own one-time, lifetime product with its own price, plus the same
 * included Pro window as the telc course.
 * B1 and B2 are listed but not yet buyable — they render as "Coming soon"
 * until the Course Factory has rebuilt them (Wave 7 B–D and Waves 8–10); a
 * coming-soon course has no checkout id and never opens one. The A1–B2 bundle
 * is parked for the same reason (half of it is coming soon); its legacy key
 * stays resolvable below so an existing purchase keeps its access.
 *
 * `levels` is what the entitlement unlocks (src/contexts/SubscriptionContext.jsx
 * hasLevelAccess) — lowercase URL form, same as FREE_LEVELS.
 */
export const ALL_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

/** Gross one-time price in EUR per sub-level. A1.1 prices the guided course only. */
export const SUBLEVEL_PRICES_EUR = {
  'a1.1': 39,
  'a1.2': 40,
  'a2.1': 50,
  'a2.2': 50,
  'b1.1': 60,
  'b1.2': 60,
  'b2.1': 65,
  'b2.2': 65,
};

/** Listed, priced, not yet buyable — rendered as "Coming soon" with no checkout. */
export const COMING_SOON_LEVELS = ['b1.1', 'b1.2', 'b2.1', 'b2.2'];

/** Sub-levels a visitor can buy today (priced and not coming soon). */
export const SELLABLE_LEVELS = Object.keys(SUBLEVEL_PRICES_EUR).filter((l) => !COMING_SOON_LEVELS.includes(l));

/** The cheapest buyable course — the "from €…" figure on the pricing page. */
export const COURSE_FROM_PRICE_EUR = Math.min(...SELLABLE_LEVELS.map((l) => SUBLEVEL_PRICES_EUR[l]));

/** Product key for a sub-level: 'a1.2' → 'course_a1_2' (env vars are COURSE_A1_2). */
export const productKeyForLevel = (level) => `course_${String(level).toLowerCase().replace('.', '_')}`;

const sublevel = (level) => {
  const code = level.toUpperCase();
  // A1.1 sells under its own product name and keeps lessons 1–3 as the
  // signed-in preview; the other courses have no preview window (0).
  const a11 = level === 'a1.1';
  return {
    key: productKeyForLevel(level),
    code,
    name: a11 ? 'DeutschStart A1.1' : `German ${code} Course`,
    nameDe: a11 ? 'DeutschStart A1.1' : `Deutsch ${code} Kurs`,
    price: SUBLEVEL_PRICES_EUR[level],
    proDays: COURSE_PRO_DAYS,
    proMonths: COURSE_PRO_MONTHS,
    levels: [level],
    previewLessons: a11 ? 3 : 0,
    comingSoon: COMING_SOON_LEVELS.includes(level),
  };
};

/** The catalogue: one product per paid sub-level, in ladder order. */
export const LEVEL_COURSES = Object.fromEntries(
  Object.keys(SUBLEVEL_PRICES_EUR).map((level) => [productKeyForLevel(level), sublevel(level)]),
);

/**
 * Retired products (sold 2026-09-03 → 2026-09-08 as whole bands at €49 and the
 * A1–B2 bundle at €129). Not on sale and rendered nowhere as an offer; kept so
 * that levelsForProduct() still honours a purchases row carrying one of these
 * keys, and so the dashboard can still name what the buyer owns.
 */
const LEGACY_BAND_PRICE_EUR = 49;
const LEGACY_BUNDLE_PRICE_EUR = 129;
const legacyBand = (key, code, name, nameDe, levels, price = LEGACY_BAND_PRICE_EUR) => ({
  key, code, name, nameDe, price, proDays: COURSE_PRO_DAYS, proMonths: COURSE_PRO_MONTHS, levels, legacy: true,
});
export const LEGACY_LEVEL_COURSES = {
  course_a1: legacyBand('course_a1', 'A1', 'German A1 Course', 'Deutsch A1 Kurs', ['a1.1', 'a1.2']),
  course_a2: legacyBand('course_a2', 'A2', 'German A2 Course', 'Deutsch A2 Kurs', ['a2.1', 'a2.2']),
  course_b1: legacyBand('course_b1', 'B1', 'German B1 Course', 'Deutsch B1 Kurs', ['b1.1', 'b1.2']),
  course_b2: legacyBand('course_b2', 'B2', 'German B2 Course', 'Deutsch B2 Kurs', ['b2.1', 'b2.2']),
  course_alle: legacyBand('course_alle', 'A1–B2', 'German Complete Course (A1–B2)', 'Deutsch Komplettkurs (A1–B2)', ALL_LEVELS, LEGACY_BUNDLE_PRICE_EUR),
};

/** A course (current or legacy) by product key, or null — what a purchases row means. */
export const courseForProduct = (productKey) => LEVEL_COURSES[productKey] || LEGACY_LEVEL_COURSES[productKey] || null;

/** Levels a product key unlocks — [] for unknown keys and for the telc course. */
export const levelsForProduct = (productKey) => courseForProduct(productKey)?.levels || [];

/** The buyable-or-coming course for a level (lowercase), or null for the free level. */
export const courseForLevel = (level) => LEVEL_COURSES[productKeyForLevel(level || '')] || null;

/** @deprecated name from the band era — now resolves to the sub-level course. */
export const bandCourseForLevel = courseForLevel;

export const PLANS = {
  monthly: {
    key: 'monthly',
    name: 'Pro Monthly',
    nameDe: 'Pro Monatlich',
    price: MONTHLY_PRICE_EUR,
    interval: 'month',
    intervalDe: 'Monat',
    perDay: MONTHLY_PER_DAY_EUR,
  },
  yearly: {
    key: 'yearly',
    name: 'Pro Yearly',
    nameDe: 'Pro Jährlich',
    price: YEARLY_PRICE_EUR,
    interval: 'year',
    intervalDe: 'Jahr',
    perDay: YEARLY_PER_DAY_EUR,
    asMonthly: YEARLY_AS_MONTHLY_EUR,
    savingPercent: YEARLY_SAVING_PERCENT,
  },
};
