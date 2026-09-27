import { supabase } from './supabase.mjs';
import { checkCourseAiAllowance, recordCourseAiUse } from './entitlement.mjs';

// Tiers: premium | pro | free_trial | free_expired
// premium  — unlimited sessions
// pro      — 30 sessions/month
// free_trial  — 2 sessions TOTAL (lifetime, for the duration of the trial)
// free_expired — fully blocked
const PRO_MONTHLY_LIMIT  = 30;
const TRIAL_TOTAL_LIMIT  = 2;

// Exported: evaluate-writing.mjs reuses the same tier resolution so speaking
// and writing can never disagree about who is pro/trial/expired.
export async function getTier(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, is_subscribed, trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

  // No profile row → treat as blocked (no NULL bypass)
  if (!profile) return 'free_expired';

  if (profile.subscription_tier === 'premium') return 'premium';
  if (profile.subscription_tier === 'pro' || profile.is_subscribed) return 'pro';

  // NULL trial_ends_at → trialActive is false → free_expired (no bypass)
  const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  return trialActive ? 'free_trial' : 'free_expired';
}

async function getMonthlySessionCount(userId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from('speaking_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart);

  if (error) {
    console.error('Error counting monthly sessions:', error.message);
    return 0;
  }
  return count || 0;
}

async function getTotalSessionCount(userId) {
  const { count, error } = await supabase
    .from('speaking_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error counting total sessions:', error.message);
    return 0;
  }
  return count || 0;
}

// PURCHASE-AWARE PATH (course v2, docs/course-v2/ENTITLEMENT.md). A v2 course
// speaking task — identified by its bank key, never by client task text — is
// billed against the course AI allowance of the level it belongs to (lifetime
// per slot + a daily fair-use cap), not against the tiers below: a buyer
// whose included Pro window has lapsed keeps the speaking of the course they
// bought, and a trial or Pro user does not get paid v2 speaking unless
// V2_TRIAL_PRO_OPENS_PAID says so. Calls without a courseTaskKey take the
// legacy tier path unchanged.
//
// Returns the checkUsage() shape with tier 'course' plus the allowance
// fields: { allowed, tier, reason, remaining, used, limit, dailyUsed, dailyCap, courseTaskKey }.
export async function checkCourseUsage(userId, courseTaskKey) {
  const r = await checkCourseAiAllowance(supabase, userId, courseTaskKey);
  return {
    allowed: r.allowed,
    tier: 'course',
    reason: r.reason,
    remaining: r.remaining,
    used: r.used ?? null,
    limit: r.limit ?? null,
    dailyUsed: r.dailyUsed ?? null,
    dailyCap: r.dailyCap ?? null,
    ...(r.degraded && { degraded: true }),
    courseTaskKey,
  };
}

/** Count one graded v2 course speaking attempt (once per session, after the session row exists). */
export async function incrementCourseUsage(userId, courseTaskKey) {
  return recordCourseAiUse(supabase, userId, courseTaskKey, 'speaking');
}

export async function checkUsage(userId, opts) {
  if (opts?.courseTaskKey != null) return checkCourseUsage(userId, opts.courseTaskKey);
  console.log('[checkUsage] Checking usage for user:', userId);
  const tier = await getTier(userId);
  console.log('[checkUsage] User tier:', tier);

  if (tier === 'free_expired') {
    return { allowed: false, tier, reason: 'subscription_required' };
  }

  if (tier === 'premium') {
    return { allowed: true, unlimited: true, tier };
  }

  if (tier === 'pro') {
    const used = await getMonthlySessionCount(userId);
    console.log('[checkUsage] Pro user sessions this month:', used, '/', PRO_MONTHLY_LIMIT);
    return {
      allowed: used < PRO_MONTHLY_LIMIT,
      used,
      limit: PRO_MONTHLY_LIMIT,
      tier,
      ...(used >= PRO_MONTHLY_LIMIT && { reason: 'monthly_limit_reached' }),
    };
  }

  // free_trial: 2 sessions total (lifetime)
  const used = await getTotalSessionCount(userId);
  console.log('[checkUsage] Trial user total sessions:', used, '/', TRIAL_TOTAL_LIMIT);
  return {
    allowed: used < TRIAL_TOTAL_LIMIT,
    used,
    limit: TRIAL_TOTAL_LIMIT,
    tier,
    ...(used >= TRIAL_TOTAL_LIMIT && { reason: 'trial_limit_reached' }),
  };
}

export async function incrementUsage(userId, opts) {
  if (opts?.courseTaskKey != null) return incrementCourseUsage(userId, opts.courseTaskKey);
  console.log('[incrementUsage] Recording session for user:', userId);
  const { error } = await supabase
    .from('speaking_usage')
    .insert({
      user_id: userId,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('[incrementUsage] Error:', error.message);
    throw error;
  }
  console.log('[incrementUsage] Success');
}
