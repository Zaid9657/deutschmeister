import { supabase } from './supabase.mjs';

// Sessions per month for Pro; sessions per day for trial
const PRO_MONTHLY_LIMIT   = 30;
const TRIAL_DAILY_LIMIT   = 5;

// Tiers: pro | free_trial | free_expired
async function getTier(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, is_subscribed, trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return 'free_expired';

  if (profile.subscription_tier === 'pro' || profile.is_subscribed) return 'pro';

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

async function getDailySessionCount(userId) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('speaking_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString());

  if (error) {
    console.error('Error counting daily sessions:', error.message);
    return 0;
  }
  return count || 0;
}

export async function checkUsage(userId) {
  console.log('[checkUsage] Checking usage for user:', userId);
  const tier = await getTier(userId);
  console.log('[checkUsage] User tier:', tier);

  if (tier === 'free_expired') {
    return { allowed: false, tier, reason: 'subscription_required' };
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

  // free_trial: 5 sessions/day
  const used = await getDailySessionCount(userId);
  console.log('[checkUsage] Trial user sessions today:', used, '/', TRIAL_DAILY_LIMIT);
  return {
    allowed: used < TRIAL_DAILY_LIMIT,
    used,
    limit: TRIAL_DAILY_LIMIT,
    tier,
    ...(used >= TRIAL_DAILY_LIMIT && { reason: 'daily_limit_reached' }),
  };
}

export async function incrementUsage(userId) {
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
