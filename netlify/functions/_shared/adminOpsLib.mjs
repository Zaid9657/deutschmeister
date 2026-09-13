// Admin panel — pure operations rules shared by the cockpit, the ops queue
// and the session badges. ONE definition each, so an alert can never count
// one thing and lead to another.

/** The subscription statuses that still mean "this person has access or is in a grace period". */
export const ACTIVE_SUB_STATUSES = Object.freeze(['active', 'on_trial', 'past_due']);

/**
 * Failed payment = Lemon Squeezy has told us the last charge did not go
 * through and the subscription is still live (status past_due or unpaid —
 * LS moves a subscription to `unpaid` after its dunning retries fail, see
 * the subscription_payment_failed rows in webhook_logs). An `expired` or
 * `cancelled` row is not a failed payment, it is a churned one.
 */
export const isFailedPayment = (sub) => sub?.status === 'past_due' || sub?.status === 'unpaid';

/**
 * The access gate this product actually reads (src/contexts/SubscriptionContext.jsx
 * hasLevelAccess + netlify/functions/_shared/speakingUsage.mjs getTier):
 *   - level/content access → the LATEST subscriptions.subscription_end > now,
 *     OR a purchases row covering the level, OR profiles.trial_ends_at > now,
 *     OR the level is free.
 *   - speaking/writing quota tier → profiles.subscription_tier / is_subscribed
 *     / trial_ends_at.
 * A manual grant must write the field the gate reads for THAT question, or it
 * silently does nothing.
 */
export function gateReads({ latestSubscriptionEnd, hasPurchases, trialEndsAt, now = new Date() }) {
  const subLive = latestSubscriptionEnd ? new Date(latestSubscriptionEnd) > now : false;
  const trialLive = trialEndsAt ? new Date(trialEndsAt) > now : false;
  return {
    contentAccess: subLive
      ? 'subscriptions.subscription_end (neueste Zeile)'
      : hasPurchases
        ? 'purchases.product_key (Kurskauf, unbefristet)'
        : trialLive
          ? 'profiles.trial_ends_at (Testphase)'
          : 'kein Zugang außer Gratis-Stufe (a1.1)',
    quotaTier: 'profiles.subscription_tier / is_subscribed / trial_ends_at (speakingUsage.getTier)',
  };
}

/**
 * HOW does this user have what they have? A tier column says WHAT, never HOW.
 *   course        → ≥ 1 active purchases row
 *   subscription  → ≥ 1 subscriptions row with a live paid period (subscription_end > now)
 *   unbekannt     → profile says subscribed/pro but no live row and no purchase
 *   trial         → trial_ends_at in the future
 *   free          → otherwise
 */
export function classifyAccess({ profile, subscriptions = [], purchases = [], now = new Date() }) {
  const liveSubs = subscriptions.filter((s) => s.subscription_end && new Date(s.subscription_end) > now);
  const activePurchases = purchases.filter((p) => p.status === 'active');
  if (activePurchases.length > 0 && liveSubs.every((s) => s.plan_type === 'course')) {
    return { kind: 'course', label: activePurchases.length === 1 ? 'Kurskauf' : `${activePurchases.length} Kurskäufe`, count: activePurchases.length };
  }
  if (liveSubs.length > 0) {
    return { kind: 'subscription', label: liveSubs.length === 1 ? 'Abonnement' : `${liveSubs.length} aktive Abonnements`, count: liveSubs.length };
  }
  const paidFlag = profile?.is_subscribed === true || (profile?.subscription_tier && profile.subscription_tier !== 'free');
  if (paidFlag) return { kind: 'unbekannt', label: 'Unbekannt (Status ohne Abo)', count: 0 };
  if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > now) return { kind: 'trial', label: 'Testphase', count: 0 };
  return { kind: 'free', label: 'Kostenlos', count: 0 };
}

/**
 * Discrepancy rules — evidence and a recommendation, never a fix.
 * Returns [] when everything is consistent.
 */
export function findDiscrepancies({ profile, subscriptions = [], purchases = [], now = new Date() }) {
  const out = [];
  const liveSubs = subscriptions.filter((s) => s.subscription_end && new Date(s.subscription_end) > now);
  const livePaid = liveSubs.filter((s) => s.plan_type !== 'course');
  const activePurchases = purchases.filter((p) => p.status === 'active');
  const flagSubscribed = profile?.is_subscribed === true;
  const tierPaid = Boolean(profile?.subscription_tier) && profile.subscription_tier !== 'free';

  if ((flagSubscribed || tierPaid) && liveSubs.length === 0 && activePurchases.length === 0) {
    out.push({
      kind: 'status_without_subscription',
      severity: 'warn',
      evidence: `profiles.is_subscribed=${flagSubscribed}, subscription_tier=${profile?.subscription_tier ?? 'null'}, ${subscriptions.length} Abo-Zeilen, 0 mit laufender Periode, ${activePurchases.length} Kurskäufe`,
      recommendation: 'Prüfen, ob Einmalkauf, manuelle Freischaltung oder Altbestand. Kein automatischer Eingriff.',
    });
  }
  if (livePaid.length > 1) {
    out.push({
      kind: 'duplicate_subscription',
      severity: 'error',
      evidence: livePaid.map((s) => `${s.plan_type} (${s.lemonsqueezy_subscription_id ? '••••' + String(s.lemonsqueezy_subscription_id).slice(-4) : 'manuell'}, ${s.status}, bis ${String(s.subscription_end).slice(0, 10)})`).join(' · '),
      recommendation: 'Mögliche Doppelabrechnung. In Lemon Squeezy entscheiden, welches Abo bleibt — niemals automatisch kündigen.',
    });
  }
  if (livePaid.length > 0 && !flagSubscribed) {
    out.push({
      kind: 'subscription_without_flag',
      severity: 'error',
      evidence: `laufendes Abo (${livePaid[0].plan_type}, bis ${String(livePaid[0].subscription_end).slice(0, 10)}), profiles.is_subscribed=false, subscription_tier=${profile?.subscription_tier ?? 'null'}`,
      recommendation: 'Der Nutzer zahlt; Sprech-/Schreibkontingent liest is_subscribed und kann ihn als Testnutzer behandeln. Flag korrigieren (Aktion „Tier setzen“).',
    });
  }
  const failed = subscriptions.filter(isFailedPayment);
  if (failed.length > 0) {
    out.push({
      kind: 'payment_failed',
      severity: 'warn',
      evidence: failed.map((s) => `${s.plan_type} · ${s.status} · Periode bis ${String(s.subscription_end ?? '').slice(0, 10) || '—'}`).join(' · '),
      recommendation: 'Zahlungsmethode beim Kunden nachfassen; LS wiederholt die Abbuchung selbst.',
    });
  }
  return out;
}

/**
 * Product keys a manual course grant may use — exactly the keys the Lemon
 * Squeezy webhook can deliver (COURSE_VARIANT_ENV in lemonsqueezy-webhook.mjs)
 * and src/data/pricing.js declares. tests/admin-ops.test.mjs pins the set
 * against both sources.
 */
export const PRODUCT_KEYS = Object.freeze([
  'telc_b1_komplett',
  'course_a1_2', 'course_a2_1', 'course_a2_2', 'course_b1_1', 'course_b1_2', 'course_b2_1', 'course_b2_2',
  'course_a1', 'course_a2', 'course_b1', 'course_b2', 'course_alle',
]);
