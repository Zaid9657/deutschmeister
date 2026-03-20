import { supabase } from './supabase.mjs';

const PRO_MONTHLY_LIMIT = 5;

async function getTier(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, is_subscribed, trial_started_at, trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return 'free';

  // Explicit tier set by webhook
  if (profile.subscription_tier === 'premium') return 'premium';
  if (profile.subscription_tier === 'pro') return 'pro';

  // Fallback: check is_subscribed flag (legacy, treat as pro)
  if (profile.is_subscribed) return 'pro';

  // Check active trial
  if (profile.trial_started_at && profile.trial_ends_at) {
    const now = new Date();
    if (now < new Date(profile.trial_ends_at)) return 'trial';
  }

  return 'free';
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

async function getLastSessionTime(userId) {
  const { data, error } = await supabase
    .from('speaking_usage')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return new Date(data.created_at);
}

export async function checkUsage(userId) {
  console.log('[checkUsage] Checking usage for user:', userId);
  const tier = await getTier(userId);
  console.log('[checkUsage] User tier:', tier);

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

  if (tier === 'trial') {
    const lastSession = await getLastSessionTime(userId);
    console.log('[checkUsage] Trial user last session:', lastSession);
    if (!lastSession) {
      return { allowed: true, tier };
    }
    const hoursSince = (Date.now() - lastSession.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 24) {
      return { allowed: true, tier };
    }
    const nextAvailable = new Date(lastSession.getTime() + 24 * 60 * 60 * 1000).toISOString();
    return { allowed: false, tier, reason: 'trial_cooldown', nextAvailable };
  }

  // free tier
  return { allowed: false, tier: 'free', reason: 'subscription_required' };
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
