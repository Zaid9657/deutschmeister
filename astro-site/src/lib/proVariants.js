// Build-time checkout ids for the two Pro plans — the static twin of
// src/config/lemonsqueezy.js's MONTHLY/YEARLY ids. Until 2026-10-04 these two
// UUIDs were typed inside /pricing/'s script; a plan change in Lemon Squeezy
// would have needed a code edit there and in the SPA. Now one env pair
// (PUBLIC_LEMONSQUEEZY_MONTHLY/YEARLY_VARIANT_ID, builds scope) overrides them,
// and the fallbacks are the same ids the SPA falls back to — so an unset env
// changes nothing. Vite inlines only statically-named env reads.
export const PRO_VARIANTS = {
  monthly: import.meta.env.PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID || 'dfc81ca3-78f5-4bab-9d62-dca75b3f7e21',
  yearly: import.meta.env.PUBLIC_LEMONSQUEEZY_YEARLY_VARIANT_ID || 'd58c1838-d935-4c59-a0ac-0bfce8ec9c3b',
};
