// Learner-facing: may THIS person use THIS code on THIS product, and what
// would it come to? Authenticated by the verified JWT; counts are read fresh
// on every check; the endpoint does not apply the discount — it returns the
// selected product's eligibility and code. The client builds the checkout
// from its checkout UUID and records the code in the attribution custom field.
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { normalizeCode, evaluateCoupon } from './_shared/adminCouponsLib.mjs';
import { couponProduct } from './_shared/pricing.mjs';

const ALLOWED_ORIGINS = ['https://deutsch-meister.de', 'https://www.deutsch-meister.de'];

export const handler = async (event) => {
  const origin = event.headers?.origin || '';
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!supabaseKey || !supabase) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  const userId = await getAuthenticatedUserId(event);
  if (!userId) return unauthorizedResponse(headers);
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiger Body.' }) }; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiger Body.' }) };
  const code = normalizeCode(body.code);
  if (!code) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, reason: 'not_found', message: 'Bitte einen Code eingeben.' }) };
  const product = couponProduct(body.productKey);
  if (!product) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dieses Produkt ist für die Gutscheinprüfung nicht verfügbar.' }) };

  const { data: coupon } = await supabase.from('coupons').select('*').eq('normalized_code', code).maybeSingle();
  let ctx = { nowMs: Date.now(), variantId: product.variantId, amountMinor: product.amountMinor };
  if (coupon) {
    const [{ count: total }, { count: mine }, { count: anyPrior }] = await Promise.all([
      supabase.from('coupon_redemptions').select('*', { count: 'exact', head: true }).eq('coupon_id', coupon.id),
      supabase.from('coupon_redemptions').select('*', { count: 'exact', head: true }).eq('coupon_id', coupon.id).eq('user_id', userId),
      supabase.from('coupon_redemptions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    // "new customer" = no prior recorded redemption — narrower than "never bought anything", and the admin screen says so.
    ctx = { ...ctx, redemptionCount: total ?? 0, userRedemptionCount: mine ?? 0, isNewCustomer: (anyPrior ?? 0) === 0 };
  }
  const result = evaluateCoupon(coupon, ctx);
  if (!result.ok) return { statusCode: 200, headers, body: JSON.stringify({ ok: false, reason: result.reason, message: result.message }) };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, productKey: product.productKey, code: coupon.code, label: coupon.public_label || coupon.internal_name, discountType: coupon.discount_type, discountValue: coupon.discount_value, discount: result.discount, final: result.final }),
  };
};
