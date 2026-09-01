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
// Provenance: prices verified against src/config/lemonsqueezy.js and the
// Lemon Squeezy store (309512) checkout, 2026-08-22.

/** Gross price in EUR, billed monthly. */
export const MONTHLY_PRICE_EUR = 9.99;

/** Gross price in EUR, billed once per year. */
export const YEARLY_PRICE_EUR = 79.99;

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
