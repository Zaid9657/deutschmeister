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

// ─── The catalogue, for the support agent ────────────────────────────────────
// support-agent.mjs may quote a price only if it is one of these, and its
// reply validator rejects any euro amount that is not (CATALOGUE_EURO_AMOUNTS).
// Same synced-copy doctrine as above: tests/claims.test.mjs compares every
// value here against src/data/pricing.js.

export const YEARLY_PRICE_EUR = 79.99;
export const COURSE_TELC_B1_PRICE_EUR = 89;
export const COURSE_PRO_DAYS = 90;

/** Gross one-time price in EUR per sub-level. A1.1 is free and has no product. */
export const SUBLEVEL_PRICES_EUR = Object.freeze({
  'a1.2': 40,
  'a2.1': 50,
  'a2.2': 50,
  'b1.1': 60,
  'b1.2': 60,
  'b2.1': 65,
  'b2.2': 65,
});

/** Listed, priced, not yet buyable ("Coming soon", no checkout). */
export const COMING_SOON_LEVELS = Object.freeze(['b1.1', 'b1.2', 'b2.1', 'b2.2']);

export const ALL_LEVELS = Object.freeze(['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']);

const cents = (n) => Math.round(n * 100) / 100;

/** Derived exactly as pricing.js derives them — never typed. */
export const YEARLY_AS_MONTHLY_EUR = cents(YEARLY_PRICE_EUR / 12);
export const MONTHLY_PER_DAY_EUR = cents(MONTHLY_PRICE_EUR / 30);
export const YEARLY_PER_DAY_EUR = cents(YEARLY_PRICE_EUR / 365);

/** German price convention: 9,99 € (mirrors pricing.js `deEur`). */
export const deEur = (v) => `${cents(v).toFixed(2).replace('.', ',')} €`;

/** 'a1.2' → 'course_a1_2' (mirrors pricing.js productKeyForLevel). */
export const productKeyForLevel = (level) => `course_${String(level).toLowerCase().replace('.', '_')}`;

// The retired band keys an old purchase can still carry (pricing.js
// LEGACY_LEVEL_COURSES): not for sale, but a purchases row with one of them
// still unlocks these levels.
const LEGACY_PRODUCTS = Object.freeze({
  course_a1: { name: 'Deutsch A1 Kurs', levels: ['a1.1', 'a1.2'] },
  course_a2: { name: 'Deutsch A2 Kurs', levels: ['a2.1', 'a2.2'] },
  course_b1: { name: 'Deutsch B1 Kurs', levels: ['b1.1', 'b1.2'] },
  course_b2: { name: 'Deutsch B2 Kurs', levels: ['b2.1', 'b2.2'] },
  course_alle: { name: 'Deutsch Komplettkurs (A1–B2)', levels: ALL_LEVELS },
});

/**
 * What a purchases.product_key is called and unlocks (mirrors pricing.js
 * courseForProduct + levelsForProduct). The telc course unlocks no level;
 * an unknown key is null.
 */
export function productInfo(productKey) {
  const key = String(productKey || '');
  if (key === 'telc_b1_komplett') return { key, name: 'telc B1 Komplettvorbereitung', levels: [] };
  const level = Object.keys(SUBLEVEL_PRICES_EUR).find((l) => productKeyForLevel(l) === key);
  if (level) return { key, name: `Deutsch ${level.toUpperCase()} Kurs`, levels: [level] };
  const legacy = LEGACY_PRODUCTS[key];
  return legacy ? { key, name: legacy.name, levels: [...legacy.levels] } : null;
}

/** Every euro figure the product states — the only amounts a support reply may contain. */
export const CATALOGUE_EURO_AMOUNTS = Object.freeze([
  MONTHLY_PRICE_EUR,
  YEARLY_PRICE_EUR,
  YEARLY_AS_MONTHLY_EUR,
  MONTHLY_PER_DAY_EUR,
  YEARLY_PER_DAY_EUR,
  COURSE_TELC_B1_PRICE_EUR,
  ...Object.values(SUBLEVEL_PRICES_EUR),
]);
