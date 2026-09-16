// Grant orchestration for speaking allowances — plan Task 4
// (speaking-entitlements-ledger). Called by lemonsqueezy-webhook.mjs (orders,
// invoices, refunds) and by the reconcile job (monthly release for annual
// terms). Every function takes the supabase client as its first argument so
// tests/speaking-grants.test.mjs can replay events against a fake adapter;
// real idempotency lives in the grant RPC's (user, source, source_ref)
// uniqueness, proven live in tests/speaking-ledger-concurrency.test.mjs.
//
// THE QUANTITIES ARE THE PRODUCT (approved spec §7.1) and marketing derives
// from these constants (tests/claims.test.mjs):
//   course_a1_1        → 3,600 permanent seconds + 12 included first attempts
//   speaking_topup_60  → 3,600 permanent seconds
//   AI Coach period    → 7,200 seconds expiring at period end — the SAME for
//                        grandfathered €9.99/€79.99 subscribers; price is
//                        never an input to a grant.
import { courseMissionKeys } from './speakingEntitlements.mjs';

export const COURSE_SPEAKING_SECONDS = 3600;
export const TOPUP_SECONDS = 3600;
export const AI_COACH_MONTHLY_SECONDS = 7200;

const courseOrderRef = (orderId) => `order:${orderId}:course-a11`;
const topupOrderRef = (orderId) => `order:${orderId}:topup-60`;

/** Period ref uses the payload's billing date (YYYY-MM), never a local clock month. */
export const subscriptionPeriodRef = (subscriptionId, periodStart) =>
  `subscription:${subscriptionId}:period:${String(periodStart).slice(0, 7)}`;

export async function grantCourseSpeaking(supabase, { userId, orderId }) {
  const sourceRef = courseOrderRef(orderId);
  const { data, error } = await supabase.rpc('grant_speaking_seconds', {
    p_user_id: userId,
    p_source: 'course',
    p_source_ref: sourceRef,
    p_seconds: COURSE_SPEAKING_SECONDS,
    p_idempotency_key: `grant:${sourceRef}`,
  });
  if (error) throw new Error(`course speaking grant failed: ${error.message}`);

  const { data: created, error: missionError } = await supabase.rpc('grant_mission_attempts', {
    p_user_id: userId,
    p_source_ref: sourceRef,
    p_mission_keys: courseMissionKeys('A1.1'),
  });
  if (missionError) throw new Error(`mission attempt grant failed: ${missionError.message}`);

  return { replayed: !!data?.replayed, missionAttemptsCreated: created ?? 0 };
}

export async function grantTopupSpeaking(supabase, { userId, orderId }) {
  const sourceRef = topupOrderRef(orderId);
  const { data, error } = await supabase.rpc('grant_speaking_seconds', {
    p_user_id: userId,
    p_source: 'topup',
    p_source_ref: sourceRef,
    p_seconds: TOPUP_SECONDS,
    p_idempotency_key: `grant:${sourceRef}`,
  });
  if (error) throw new Error(`top-up speaking grant failed: ${error.message}`);
  return { replayed: !!data?.replayed };
}

export async function grantSubscriptionSpeaking(supabase, { userId, subscriptionId, periodStart, expiresAt }) {
  const sourceRef = subscriptionPeriodRef(subscriptionId, periodStart);
  const { data, error } = await supabase.rpc('grant_speaking_seconds', {
    p_user_id: userId,
    p_source: 'subscription',
    p_source_ref: sourceRef,
    p_seconds: AI_COACH_MONTHLY_SECONDS,
    p_idempotency_key: `grant:${sourceRef}`,
    p_period_start: periodStart,
    p_expires_at: expiresAt,
  });
  if (error) throw new Error(`subscription speaking grant failed: ${error.message}`);
  return { replayed: !!data?.replayed };
}

/**
 * Refund semantics: zero the order's unspent seconds (and its unused mission
 * attempts, inside the RPC) without rewriting consumed history. Safe on
 * orders that never granted anything.
 */
export async function revokeSpeakingForOrder(supabase, { userId, orderId, productKey }) {
  const bySource = productKey === 'course_a1_1'
    ? { source: 'course', ref: courseOrderRef(orderId) }
    : productKey === 'speaking_topup_60'
      ? { source: 'topup', ref: topupOrderRef(orderId) }
      : null;
  if (!bySource) return { revoked: false };
  const { error } = await supabase.rpc('revoke_speaking_grant', {
    p_user_id: userId,
    p_source: bySource.source,
    p_source_ref: bySource.ref,
    p_idempotency_key: `revoke:${bySource.ref}`,
  });
  if (error) throw new Error(`speaking revoke failed: ${error.message}`);
  return { revoked: true };
}
