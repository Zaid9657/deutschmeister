// Admin panel — money, reconstructed from Lemon Squeezy webhook payloads.
//
// There is no money column that survives a refund or a renewal: subscriptions
// .price_paid is one number per row, purchases.price_paid one per order, and
// the only record of every real payment is the raw provider JSON in
// webhook_logs.payload. Four traps, all present in this database
// (verified 2026-09-13 against 13 order_created + 15 subscription_payment_success rows):
//
//   1. DOUBLE COUNTING. A subscription's first payment fires BOTH order_created
//      and subscription_payment_success (billing_reason 'initial'), seconds
//      apart, for the same money. Count every order_created; from
//      subscription_payment_success count ONLY renewals.
//   2. RETRIES. Key orders by the provider order id, renewals by
//      subscription_id + day + total. First one wins.
//   3. TEST MODE / UNPAID. Skip meta.test_mode; require the PAYMENT's
//      status === 'paid' (not our processed flag).
//   4. MIXED CURRENCIES. One order is USD. Sum per currency, never into one figure.
//
// Classify by variant id, never by product name (a rename must not move money
// between buckets). Money is integer minor units throughout.

export function paymentsFromWebhookRows(rows, { courseVariantIds = new Set() } = {}) {
  const seen = new Set();
  const payments = [];
  for (const row of rows) {
    const p = row?.payload;
    const meta = p?.meta || {};
    const a = p?.data?.attributes || {};
    if (meta.test_mode === true) continue;
    if (a.status !== 'paid') continue;
    const type = row.event_type || meta.event_name;
    let key;
    let kind;
    let variantId = null;
    if (type === 'order_created') {
      key = `order:${p?.data?.id}`;
      variantId = a.first_order_item?.variant_id != null ? String(a.first_order_item.variant_id) : null;
      kind = variantId && courseVariantIds.has(variantId) ? 'course' : 'subscription_initial';
    } else if (type === 'subscription_payment_success') {
      if (a.billing_reason === 'initial') continue; // already counted as order_created
      const day = String(a.created_at || row.created_at || '').slice(0, 10);
      key = `renewal:${a.subscription_id}:${day}:${a.total}`;
      kind = 'renewal';
    } else {
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    const gross = Number(a.total ?? 0) || 0;
    const tax = Number(a.tax ?? 0) || 0;
    const refunded = Number(a.refunded_amount ?? 0) || 0;
    payments.push({
      key,
      kind,
      variantId,
      productName: a.first_order_item?.product_name || a.product_name || null,
      currency: String(a.currency || 'EUR').toUpperCase(),
      gross,
      tax,
      refunded,
      net: gross - tax - refunded,
      at: a.created_at || row.created_at,
      orderId: p?.data?.id != null ? String(p.data.id) : null,
      subscriptionId: a.subscription_id != null ? String(a.subscription_id) : null,
      userEmail: a.user_email || null,
    });
  }
  return payments;
}

/** Sum per currency for a window [from, to). Returns { EUR: { gross, tax, refunded, net, count }, … }. */
export function sumByCurrency(payments, from, to) {
  const out = {};
  for (const p of payments) {
    const t = Date.parse(p.at);
    if (!Number.isFinite(t)) continue;
    if (from && t < Date.parse(from)) continue;
    if (to && t >= Date.parse(to)) continue;
    const c = (out[p.currency] ||= { gross: 0, tax: 0, refunded: 0, net: 0, count: 0, byKind: {} });
    c.gross += p.gross;
    c.tax += p.tax;
    c.refunded += p.refunded;
    c.net += p.net;
    c.count += 1;
    c.byKind[p.kind] = (c.byKind[p.kind] || 0) + 1;
  }
  return out;
}

/** Daily series of net minor units, seeded across the whole window so a quiet day is a 0, not a gap. */
export function dailySeries(payments, from, to, currency = 'EUR') {
  const start = new Date(from);
  const end = new Date(to);
  const days = [];
  for (let d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push({ day: d.toISOString().slice(0, 10), net: 0, count: 0 });
  }
  const index = new Map(days.map((d) => [d.day, d]));
  for (const p of payments) {
    if (p.currency !== currency) continue;
    const day = String(p.at).slice(0, 10);
    const slot = index.get(day);
    if (slot) {
      slot.net += p.net;
      slot.count += 1;
    }
  }
  return days;
}

/** MRR in minor units from subscriptions rows — the weekly_truth_metrics definition, verbatim. */
export function mrrFromSubscriptions(rows, now = new Date()) {
  let mrr = 0;
  let paying = 0;
  let atRisk = 0;
  const byPlan = {};
  for (const s of rows) {
    const live = s.subscription_end && new Date(s.subscription_end) > now;
    const recurring = ['monthly', 'yearly', 'quarterly'].includes(s.plan_type);
    const price = Math.round(Number(s.price_paid || 0) * 100);
    if (!live || !recurring || price <= 0) continue;
    if (s.status === 'active') {
      paying += 1;
      const monthly = s.plan_type === 'yearly' ? price / 12 : s.plan_type === 'quarterly' ? price / 3 : price;
      mrr += monthly;
      const b = (byPlan[s.plan_type] ||= { subs: 0, mrr: 0 });
      b.subs += 1;
      b.mrr += monthly;
    } else {
      atRisk += 1;
    }
  }
  for (const b of Object.values(byPlan)) b.mrr = Math.round(b.mrr);
  return { mrr: Math.round(mrr), paying, atRisk, byPlan };
}
