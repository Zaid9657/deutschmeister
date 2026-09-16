// Reconcile abandoned speaking reservations + release monthly allowances —
// plan Task 5 (speaking-entitlements-ledger).
//
// Two passes, every 15 minutes:
//
// 1. ABANDONED RESERVATIONS. A reservation still 'reserved' after its
//    planned duration plus 10 minutes lost its end call (tab closed, network
//    died). If the session visibly began (a speaking_sessions row with
//    started_at), finalize to the SERVER-observed elapsed time capped at the
//    reservation; otherwise refund it whole. Idempotency key
//    `reconcile:{sessionToken}` — a rerun replays onto the same settlement.
//
// 2. MONTHLY RELEASE. Annual AI Coach terms (and grandfathered annual Pro)
//    pay one invoice a year but release 7,200 seconds each month
//    (spec §7.1). The webhook grants on every invoice; this pass grants the
//    CURRENT month for every live subscription that has no bucket for it
//    yet, with the same source_ref shape (subscription:{id}:period:{YYYY-MM})
//    so the two writers can never double-grant.
//
// Logs counts only — never transcript text, never learner audio.
import { schedule } from '@netlify/functions';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { grantSubscriptionSpeaking } from './_shared/speakingGrants.mjs';
import { clampUsedSeconds } from './_shared/speakingEntitlements.mjs';

const ABANDON_GRACE_MS = 10 * 60 * 1000;

export async function reconcileAbandonedReservations(now = new Date()) {
  const { data: stale, error } = await supabase
    .from('speaking_session_reservations')
    .select('session_token, user_id, reserved_seconds, created_at')
    .eq('status', 'reserved');
  if (error) throw new Error(`stale reservation read failed: ${error.message}`);

  // Group by session (a session may hold several bucket reservations).
  const sessions = new Map();
  for (const row of stale || []) {
    const s = sessions.get(row.session_token) || { userId: row.user_id, reservedSeconds: 0, createdAt: row.created_at };
    s.reservedSeconds += row.reserved_seconds;
    if (row.created_at < s.createdAt) s.createdAt = row.created_at;
    sessions.set(row.session_token, s);
  }

  let finalized = 0;
  let refunded = 0;
  for (const [token, s] of sessions) {
    const deadline = new Date(s.createdAt).getTime() + s.reservedSeconds * 1000 + ABANDON_GRACE_MS;
    if (now.getTime() < deadline) continue;

    const { data: sessionRow } = await supabase
      .from('speaking_sessions')
      .select('started_at, duration_seconds, user_turns')
      .eq('session_token', token)
      .maybeSingle();

    const began = !!sessionRow?.started_at && (sessionRow.user_turns ?? 0) > 0;
    if (began) {
      // Server-observed elapsed: what the session row recorded, else the full
      // window that has certainly passed — clamped to the reservation.
      const used = clampUsedSeconds({
        usedSeconds: sessionRow.duration_seconds || s.reservedSeconds,
        startedAt: sessionRow.started_at,
        reservedSeconds: s.reservedSeconds,
        now: now.getTime(),
      });
      const { error: finError } = await supabase.rpc('finalize_speaking_session', {
        p_user_id: s.userId,
        p_session_token: token,
        p_used_seconds: used,
        p_idempotency_key: `reconcile:${token}`,
      });
      if (finError) console.error('[reconcile] finalize failed for a session:', finError.message);
      else finalized += 1;
    } else {
      const { error: refError } = await supabase.rpc('refund_speaking_session', {
        p_user_id: s.userId,
        p_session_token: token,
        p_idempotency_key: `reconcile:${token}`,
      });
      if (refError) console.error('[reconcile] refund failed for a session:', refError.message);
      else refunded += 1;
    }
  }
  return { staleSessions: sessions.size, finalized, refunded };
}

export async function releaseMonthlyAllowances(now = new Date()) {
  const nowIso = now.toISOString();
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('user_id, lemonsqueezy_subscription_id, subscription_end, plan_type, status')
    .eq('status', 'active')
    .gt('subscription_end', nowIso)
    .not('lemonsqueezy_subscription_id', 'is', null);
  if (error) throw new Error(`subscription read failed: ${error.message}`);

  let granted = 0;
  for (const sub of subs || []) {
    // The included-Pro window of a course purchase is not a speaking
    // subscription — course seconds were granted with the order.
    if (sub.plan_type === 'course') continue;
    if (!sub.lemonsqueezy_subscription_id) continue;
    const periodStart = `${nowIso.slice(0, 7)}-01T00:00:00Z`;
    const expiresAt = new Date(new Date(periodStart).getTime() + (31 + 3) * 24 * 60 * 60 * 1000).toISOString();
    try {
      const result = await grantSubscriptionSpeaking(supabase, {
        userId: sub.user_id,
        subscriptionId: sub.lemonsqueezy_subscription_id,
        periodStart,
        expiresAt,
      });
      if (!result.replayed) granted += 1;
    } catch (grantError) {
      console.error('[reconcile] monthly release failed for a subscription:', grantError.message);
    }
  }
  return { activeSubscriptions: (subs || []).length, granted };
}

const run = async () => {
  if (!supabaseKey || !supabase) {
    console.error('[reconcile] SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500 };
  }
  try {
    const abandoned = await reconcileAbandonedReservations();
    const released = await releaseMonthlyAllowances();
    console.log('[reconcile] done:', JSON.stringify({ ...abandoned, ...released }));
    return { statusCode: 200 };
  } catch (error) {
    console.error('[reconcile] failed:', error.message);
    return { statusCode: 500 };
  }
};

export const handler = schedule('*/15 * * * *', run);
