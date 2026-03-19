import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

const PREMIUM_VARIANT_IDS = [
  '35d5a630-5fd2-417b-9100-fab542fd9dfc',
  'f189cf9e-feed-477e-9dd3-fad5c3c22c3c',
];

const PRO_MONTHLY_LIMIT = 5;

async function getTier(userId) {
  // Check profile for subscription_tier first
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
  const tier = await getTier(userId);

  if (tier === 'premium') {
    return { allowed: true, unlimited: true, tier };
  }

  if (tier === 'pro') {
    const used = await getMonthlySessionCount(userId);
    return {
      allowed: used < PRO_MONTHLY_LIMIT,
      used,
      limit: PRO_MONTHLY_LIMIT,
      tier,
      ...( used >= PRO_MONTHLY_LIMIT && { reason: 'monthly_limit_reached' }),
    };
  }

  if (tier === 'trial') {
    const lastSession = await getLastSessionTime(userId);
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

export const handler = async (event) => {
  const allowedOrigins = [
    'https://deutsch-meister.de',
    'https://www.deutsch-meister.de',
  ];
  const origin = event.headers?.origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!supabaseKey || !supabase) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    const { user_id } = JSON.parse(event.body || '{}');
    if (!user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id is required' }) };
    }

    const result = await checkUsage(user_id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('check-speaking-usage error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
