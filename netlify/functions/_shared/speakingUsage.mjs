import { supabase } from './supabase.mjs';

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
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_tier, is_subscribed, trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error('Speaking entitlement could not be checked');

  // No profile row → treat as blocked (no NULL bypass)
  if (!profile) return 'free_expired';

  if (profile.subscription_tier === 'premium') return 'premium';
  if (profile.subscription_tier === 'pro' || profile.is_subscribed) return 'pro';

  // NULL trial_ends_at → trialActive is false → free_expired (no bypass)
  const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  return trialActive ? 'free_trial' : 'free_expired';
}

export async function checkUsage(userId) {
  const tier = await getTier(userId);
  const { data, error } = await supabase.rpc('speaking_usage_status', { p_user_id: userId });
  if (error || !data || !Number.isInteger(data.monthly) || !Number.isInteger(data.total)) {
    throw new Error('Speaking allowance could not be checked');
  }
  if (tier === 'free_expired') return { allowed: false, tier, reason: 'subscription_required' };
  if (tier === 'premium') return { allowed: true, unlimited: true, tier };
  const used = tier === 'pro' ? data.monthly : data.total;
  const limit = tier === 'pro' ? PRO_MONTHLY_LIMIT : TRIAL_TOTAL_LIMIT;
  const usage = { allowed: used < limit, used, limit, tier };
  if (used < limit) return usage;
  return tier === 'pro'
    ? { ...usage, reason: 'monthly_limit_reached' }
    : { ...usage, reason: 'trial_limit_reached' };
}

// The database repeats the allowance check under the same user lock as the
// usage insert, wallet debit and session insert. Missing RPC = no provider call.
export async function reserveSession(client, session, tier) {
  const { data, error } = await client.rpc('reserve_speaking_session', {
    p_session: session, p_tier: tier,
    p_pro_limit: PRO_MONTHLY_LIMIT, p_trial_limit: TRIAL_TOTAL_LIMIT,
  });
  if (error || !data || typeof data.ok !== 'boolean') {
    throw new Error('Speaking reservation could not be created');
  }
  return data;
}
