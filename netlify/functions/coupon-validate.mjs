// Learner-facing: may THIS person use THIS code on THIS product, and what
// would it come to? Authenticated by the verified JWT; counts are read fresh
// on every check; the endpoint does not apply the discount — it returns the
// checkout URL with the code prefilled and the attribution custom field, so
// the order webhook can record the redemption deterministically.
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { normalizeCode, evaluateCoupon } from './_shared/adminCouponsLib.mjs';

const ALLOWED_ORIGINS = ['https://deutsch-meister.de', 'https://www.deutsch-meister.de'];
const STORE = 'https://deutsch-meister.lemonsqueezy.com/checkout/buy/';

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
  const code = normalizeCode(body.code);
  const variantId = body.variantId ? String(body.variantId) : null;
  const amountMinor = Number.isInteger(Number(body.amountMinor)) ? Number(body.amountMinor) : null;
  if (!code) return { statusCode: 400, headers, body: JSON.stringify({ ok: false, reason: 'not_found', message: 'Bitte einen Code eingeben.' }) };

  const { data: coupon } = await supabase.from('coupons').select('*').eq('normalized_code', code).maybeSingle();
  let ctx = { nowMs: Date.now(), variantId, amountMinor };
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

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle();
  const params = new URLSearchParams({ 'checkout[email]': profile?.email || '', 'checkout[custom][user_id]': userId, 'checkout[discount_code]': coupon.code, 'checkout[custom][coupon]': coupon.normalized_code });
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, code: coupon.code, label: coupon.public_label || coupon.internal_name, discountType: coupon.discount_type, discountValue: coupon.discount_value, discount: result.discount, final: result.final, checkoutUrl: variantId ? `${STORE}${variantId}?${params.toString()}` : null }),
  };
};
