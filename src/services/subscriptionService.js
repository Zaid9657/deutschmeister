import { supabase } from '../utils/supabase';

// Fetch the user's most relevant subscription row.
// We do NOT filter by status: access is decided by the paid period
// (subscription_end), so 'cancelled' and 'past_due' rows must be visible too.
// Order by subscription_end desc so the row with the furthest-out period wins.
export const getSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('subscription_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
  return data;
};

// Fetch the user's one-time product purchases (course entitlements).
// RLS lets a user read only their own rows; writes are webhook/service-role
// only (netlify/functions/lemonsqueezy-webhook.mjs). Refunded rows are
// excluded here because a refunded course is no longer an entitlement.
export const getPurchases = async (userId) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('product_key, status, access_until, created_at')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching purchases:', error);
    return [];
  }
  return data || [];
};

// Fetch user profile (for trial info)
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getUserProfile] error:', error);
    return null;
  }
  if (!data) {
    console.warn('[getUserProfile] no profile found for user:', userId);
  }
  return data;
};

// Start free trial for a new user (7 days)
export const startFreeTrial = async (userId) => {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 7);

  // Try update first (profile usually exists from DB trigger)
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      is_subscribed: false,
      updated_at: now.toISOString(),
    })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('[startFreeTrial] update failed:', updateError);
  }

  // If update matched a row, we're done
  if (updateData && updateData.length > 0) {
    return updateData[0];
  }

  // Fallback: profile doesn't exist yet, insert it
  const { data: insertData, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      is_subscribed: false,
      updated_at: now.toISOString(),
    })
    .select();

  if (insertError) {
    console.error('[startFreeTrial] insert failed:', insertError);
    return null;
  }

  return insertData?.[0] || null;
};

// NOTE: subscriptions are created SERVER-SIDE ONLY, by the Lemon Squeezy
// webhook (netlify/functions/lemonsqueezy-webhook.mjs) using the service role.
// The former client-side createSubscription() was removed: it wrote the
// subscriptions row and profiles.is_subscribed directly from the browser,
// which RLS now blocks. Anything that needs to grant access must go through
// the webhook, or /.netlify/functions/verify-subscription to recover a missed
// one.

// Check trial status from profile data
export const checkTrialStatus = (profile) => {
  if (!profile || !profile.trial_started_at || !profile.trial_ends_at) {
    return { isInTrial: false, daysRemaining: 0, hasTrialStarted: false };
  }

  // If user is subscribed, they're no longer in trial
  if (profile.is_subscribed) {
    return { isInTrial: false, daysRemaining: 0, hasTrialStarted: true };
  }

  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);
  const diffMs = trialEnd - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isInTrial: diffMs > 0,
    daysRemaining,
    hasTrialStarted: true,
  };
};

// Single source of truth for paid access: a subscription grants access iff its
// PAID PERIOD is still live (subscription_end > now), regardless of status.
//   - 'cancelled' with a future end → renewal off but paid through period → access
//   - 'past_due'  with a future end → failed-renewal grace period → access
//   - end <= now, or missing/unparseable end, or no row → no access
export const checkSubscriptionStatus = (subscription) => {
  if (!subscription || !subscription.subscription_end) {
    return { isActive: false, expiresAt: null };
  }

  const endDate = new Date(subscription.subscription_end);
  // Guard against an unparseable date — never crash, treat as no access.
  if (Number.isNaN(endDate.getTime())) {
    return { isActive: false, expiresAt: null };
  }

  const isActive = endDate > new Date();

  return {
    isActive,
    expiresAt: subscription.subscription_end,
    planType: subscription.plan_type,
  };
};
