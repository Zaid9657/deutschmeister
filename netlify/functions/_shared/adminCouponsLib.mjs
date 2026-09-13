// Admin panel — coupon rules, pure. The discount itself lives in Lemon
// Squeezy; these rules govern who may use a code, when, how often, on what.
export const CODE_PATTERN = /^[A-Z0-9_-]{4,32}$/;
export const normalizeCode = (raw) => String(raw || '').trim().toUpperCase();

export const STATUS_TRANSITIONS = Object.freeze({ draft: ['active', 'archived'], active: ['paused', 'archived'], paused: ['active', 'archived'], archived: [] });

/** Fields frozen once money has changed hands. */
export const LOCKED_AFTER_REDEMPTION = Object.freeze(['code', 'normalized_code', 'discount_type', 'discount_value', 'currency', 'new_customer_only', 'minimum_order_amount', 'applicable_variant_ids']);

/** archived|draft|paused → itself; then expired; then exhausted; else active. Derived, never stored. */
export function effectiveStatus(coupon, redemptionCount, nowMs = Date.now()) {
  if (coupon.status !== 'active') return coupon.status;
  if (coupon.ends_at && Date.parse(coupon.ends_at) <= nowMs) return 'expired';
  if (coupon.total_limit != null && redemptionCount >= coupon.total_limit) return 'exhausted';
  return 'active';
}

/** null = unlimited. NEVER 0 — 0 means exhausted. */
export function remainingLimit(coupon, redemptionCount) {
  if (coupon.total_limit == null) return null;
  return Math.max(0, coupon.total_limit - redemptionCount);
}

/** Minor units; never exceeds the order total. */
export function computeDiscount(coupon, amountMinor) {
  const amount = Math.max(0, Number(amountMinor) || 0);
  const raw = coupon.discount_type === 'percent' ? Math.round((amount * coupon.discount_value) / 100) : coupon.discount_value;
  return Math.min(amount, Math.max(0, raw));
}

export const REFUSAL_MESSAGES = Object.freeze({
  not_found: 'Diesen Code gibt es nicht.',
  archived: 'Dieser Code ist nicht mehr gültig.',
  draft: 'Dieser Code ist noch nicht freigeschaltet.',
  paused: 'Dieser Code ist vorübergehend ausgesetzt.',
  expired: 'Dieser Code ist abgelaufen.',
  exhausted: 'Dieser Code wurde bereits vollständig eingelöst.',
  not_started: 'Dieser Code gilt erst ab dem Startdatum.',
  per_user_limit: 'Sie haben diesen Code bereits eingelöst.',
  new_customer_only: 'Dieser Code gilt nur für Neukunden.',
  variant_scope: 'Dieser Code gilt nicht für dieses Produkt.',
  minimum_order: 'Der Mindestbestellwert ist nicht erreicht.',
});

/**
 * Refusals in this exact order — the buyer can act on some and not on others.
 * ctx: { redemptionCount, userRedemptionCount, isNewCustomer, variantId, amountMinor, nowMs }
 */
export function evaluateCoupon(coupon, ctx = {}) {
  const nowMs = ctx.nowMs ?? Date.now();
  if (!coupon) return { ok: false, reason: 'not_found', message: REFUSAL_MESSAGES.not_found };
  const status = effectiveStatus(coupon, ctx.redemptionCount ?? 0, nowMs);
  for (const r of ['archived', 'draft', 'paused', 'expired', 'exhausted']) {
    if (status === r) return { ok: false, reason: r, message: REFUSAL_MESSAGES[r] };
  }
  if (coupon.starts_at && Date.parse(coupon.starts_at) > nowMs) return { ok: false, reason: 'not_started', message: REFUSAL_MESSAGES.not_started };
  if (coupon.per_user_limit != null && (ctx.userRedemptionCount ?? 0) >= coupon.per_user_limit) return { ok: false, reason: 'per_user_limit', message: REFUSAL_MESSAGES.per_user_limit };
  if (coupon.new_customer_only && ctx.isNewCustomer === false) return { ok: false, reason: 'new_customer_only', message: REFUSAL_MESSAGES.new_customer_only };
  const scope = Array.isArray(coupon.applicable_variant_ids) ? coupon.applicable_variant_ids : [];
  if (scope.length > 0 && (!ctx.variantId || !scope.includes(String(ctx.variantId)))) return { ok: false, reason: 'variant_scope', message: REFUSAL_MESSAGES.variant_scope };
  if (coupon.minimum_order_amount != null && ctx.amountMinor != null && ctx.amountMinor < coupon.minimum_order_amount) return { ok: false, reason: 'minimum_order', message: REFUSAL_MESSAGES.minimum_order };
  const discount = ctx.amountMinor != null ? computeDiscount(coupon, ctx.amountMinor) : null;
  return { ok: true, reason: 'ok', discount, final: ctx.amountMinor != null ? ctx.amountMinor - discount : null };
}

/** percent ≥ 50, fixed ≥ 100 €, or unlimited total usage — the three shapes that turn a typo into real money. */
export function needsElevatedApproval(coupon) {
  if (coupon.discount_type === 'percent' && coupon.discount_value >= 50) return true;
  if (coupon.discount_type === 'fixed' && coupon.discount_value >= 10000) return true;
  if (coupon.total_limit == null) return true;
  return false;
}

/** Validate a create/update payload. Returns { ok, errors: { field: message } , value }. */
export function validateCouponInput(input, { partial = false } = {}) {
  const errors = {};
  const v = {};
  if (!partial || input.code !== undefined) {
    const code = normalizeCode(input.code);
    if (!CODE_PATTERN.test(code)) errors.code = 'Code: 4–32 Zeichen, nur A–Z, 0–9, _ und -.';
    v.code = String(input.code || '').trim();
    v.normalized_code = code;
  }
  if (!partial || input.internal_name !== undefined) {
    if (!String(input.internal_name || '').trim()) errors.internal_name = 'Interner Name fehlt.';
    v.internal_name = String(input.internal_name || '').trim();
  }
  if (input.public_label !== undefined) v.public_label = input.public_label ? String(input.public_label).trim() : null;
  if (!partial || input.discount_type !== undefined) {
    if (!['percent', 'fixed'].includes(input.discount_type)) errors.discount_type = 'Rabattart: percent oder fixed.';
    v.discount_type = input.discount_type;
  }
  if (!partial || input.discount_value !== undefined) {
    const n = Number(input.discount_value);
    if (!Number.isInteger(n) || n <= 0) errors.discount_value = 'Rabattwert muss eine positive ganze Zahl sein (Prozent oder Cent).';
    else if ((v.discount_type || input.discount_type) === 'percent' && n > 100) errors.discount_value = 'Prozent darf 100 nicht überschreiten.';
    v.discount_value = n;
  }
  if (input.currency !== undefined) v.currency = String(input.currency || 'EUR').toUpperCase();
  for (const k of ['starts_at', 'ends_at']) {
    if (input[k] !== undefined) {
      if (input[k] === null || input[k] === '') { v[k] = k === 'starts_at' ? new Date().toISOString() : null; continue; }
      const t = Date.parse(input[k]);
      if (!Number.isFinite(t)) errors[k] = 'Datum nicht lesbar (ISO oder TT.MM.JJJJ).';
      else v[k] = new Date(t).toISOString();
    }
  }
  if (v.starts_at && v.ends_at && Date.parse(v.ends_at) <= Date.parse(v.starts_at)) errors.ends_at = 'Ende muss nach dem Start liegen.';
  for (const k of ['total_limit', 'per_user_limit', 'minimum_order_amount']) {
    if (input[k] !== undefined) {
      if (input[k] === null || input[k] === '') { v[k] = null; continue; }
      const n = Number(input[k]);
      if (!Number.isInteger(n) || n < (k === 'minimum_order_amount' ? 0 : 1)) errors[k] = `${k}: ganze Zahl erwartet.`;
      else v[k] = n;
    }
  }
  for (const k of ['stackable', 'new_customer_only']) if (input[k] !== undefined) v[k] = Boolean(input[k]);
  if (input.applicable_variant_ids !== undefined) {
    const ids = Array.isArray(input.applicable_variant_ids) ? input.applicable_variant_ids : String(input.applicable_variant_ids || '').split(/[,\s]+/);
    const clean = ids.map((x) => String(x).trim()).filter(Boolean);
    if (clean.some((x) => !/^\d{4,12}$/.test(x))) errors.applicable_variant_ids = 'Nur numerische Lemon-Squeezy-Varianten-IDs (keine Produktnamen).';
    v.applicable_variant_ids = clean;
  }
  return { ok: Object.keys(errors).length === 0, errors, value: v };
}
