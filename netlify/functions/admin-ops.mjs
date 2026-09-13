// Admin panel — subscriptions and finance queues. Three views over one
// fetch: the subscription table, the discrepancy queue (evidence and a
// recommendation, never a fix — auto-repair is deliberately absent), and the
// failed-payment queue, which uses the SAME isFailedPayment as the cockpit.
import { adminEndpoint, fetchAll } from './_shared/adminHttp.mjs';
import { maskRef } from './_shared/adminRbacLib.mjs';
import { classifyAccess, findDiscrepancies, isFailedPayment } from './_shared/adminOpsLib.mjs';
import { mrrFromSubscriptions } from './_shared/adminRevenueLib.mjs';

export const handler = adminEndpoint({ capability: 'finance.read' }, async ({ supabase }) => {
  const now = new Date();
  const [subs, purchases, flagged, failures, failedWebhooks] = await Promise.all([
    fetchAll(() => supabase.from('subscriptions').select('*').order('subscription_end', { ascending: false })),
    fetchAll(() => supabase.from('purchases').select('*')),
    fetchAll(() => supabase.from('profiles').select('id, email, is_subscribed, subscription_tier, trial_ends_at').or('is_subscribed.eq.true,subscription_tier.in.(pro,premium,trial)')),
    fetchAll(() => supabase.from('payment_failures').select('id, user_id, lemonsqueezy_subscription_id, failed_at').order('failed_at', { ascending: false })),
    fetchAll(() => supabase.from('webhook_logs').select('id, event_type, error, created_at').eq('processed', false).order('created_at', { ascending: false }).limit(50)),
  ]);

  const userIds = [...new Set([...subs.map((s) => s.user_id), ...purchases.map((p) => p.user_id), ...flagged.map((p) => p.id), ...failures.map((f) => f.user_id)].filter(Boolean))];
  const profiles = userIds.length ? await fetchAll(() => supabase.from('profiles').select('id, email, is_subscribed, subscription_tier, trial_ends_at').in('id', userIds)) : [];
  const profileOf = new Map(profiles.map((p) => [p.id, p]));
  const subsOf = new Map();
  for (const s of subs) (subsOf.get(s.user_id) || subsOf.set(s.user_id, []).get(s.user_id)).push(s);
  const purchasesOf = new Map();
  for (const p of purchases) (purchasesOf.get(p.user_id) || purchasesOf.set(p.user_id, []).get(p.user_id)).push(p);

  const table = subs.map((s) => ({
    id: s.id,
    userId: s.user_id,
    email: profileOf.get(s.user_id)?.email ?? null,
    planType: s.plan_type,
    status: s.status,
    pricePaid: s.price_paid,
    subscriptionStart: s.subscription_start,
    subscriptionEnd: s.subscription_end,
    live: s.subscription_end ? new Date(s.subscription_end) > now : false,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    lsSubscription: maskRef(s.lemonsqueezy_subscription_id),
    manual: !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0,
    failedPayment: isFailedPayment(s),
    access: classifyAccess({ profile: profileOf.get(s.user_id), subscriptions: subsOf.get(s.user_id) || [], purchases: purchasesOf.get(s.user_id) || [], now }).kind,
  }));

  const discrepancies = [];
  for (const uid of userIds) {
    const profile = profileOf.get(uid);
    if (!profile) continue;
    for (const d of findDiscrepancies({ profile, subscriptions: subsOf.get(uid) || [], purchases: purchasesOf.get(uid) || [], now })) {
      discrepancies.push({ userId: uid, email: profile.email, ...d });
    }
  }
  const sev = { error: 0, warn: 1, info: 2 };
  discrepancies.sort((a, b) => (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9));

  const failedPayments = table.filter((r) => r.failedPayment);
  const live = table.filter((r) => r.live);
  const mrr = mrrFromSubscriptions(subs, now);

  return {
    summary: {
      total: table.length,
      live: live.length,
      paying: mrr.paying,
      atRisk: mrr.atRisk,
      mrr: mrr.mrr,
      trial: profiles.filter((p) => p.trial_ends_at && new Date(p.trial_ends_at) > now && !(subsOf.get(p.id) || []).some((s) => s.subscription_end && new Date(s.subscription_end) > now)).length,
      failedPayments: failedPayments.length,
      cancelAtPeriodEnd: live.filter((r) => r.cancelAtPeriodEnd).length,
      manual: live.filter((r) => r.manual).length,
      discrepancies: discrepancies.length,
      courses: purchases.filter((p) => p.status === 'active').length,
    },
    table,
    discrepancies,
    failedPayments: failedPayments.map((r) => ({ ...r, failures: failures.filter((f) => f.user_id === r.userId).map((f) => f.failed_at) })),
    paymentFailures: failures.slice(0, 50).map((f) => ({ id: f.id, userId: f.user_id, email: profileOf.get(f.user_id)?.email ?? null, subscription: maskRef(f.lemonsqueezy_subscription_id), failedAt: f.failed_at })),
    failedWebhooks: failedWebhooks.map((w) => ({ id: w.id, eventType: w.event_type, error: w.error, createdAt: w.created_at })),
    purchases: purchases.map((p) => ({ id: p.id, userId: p.user_id, email: profileOf.get(p.user_id)?.email ?? null, productKey: p.product_key, status: p.status, pricePaid: p.price_paid, createdAt: p.created_at, manual: String(p.lemonsqueezy_order_id || '').startsWith('manual-') })),
    definitions: {
      failedPayment: "subscriptions.status IN ('past_due', 'unpaid') — dieselbe Funktion wie das Cockpit und das Sidebar-Badge.",
      live: 'subscription_end > jetzt — das Feld, das der Zugangs-Gate liest.',
      mrr: 'Laufende, bezahlte, verlängernde Abos (status active, price_paid > 0); jährlich/12. Manuelle Zeilen (price_paid 0) zählen nicht.',
      discrepancies: 'Regeln in netlify/functions/_shared/adminOpsLib.mjs findDiscrepancies — Beleg und Empfehlung, kein automatischer Eingriff.',
    },
    generatedAt: now.toISOString(),
  };
});
