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
