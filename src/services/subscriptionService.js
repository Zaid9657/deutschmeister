import { supabase } from '../utils/supabase';

// Fetch user's active subscription
export const getSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
  return data;
};

// Fetch user profile (for trial info)
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

// Start free trial for a new user (7 days)
export const startFreeTrial = async (userId) => {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 7);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      is_subscribed: false,
      updated_at: now.toISOString(),
    });

  if (error) {
    console.error('Error starting free trial:', error);
    return null;
  }
  return data;
};

// Create a new subscription
export const createSubscription = async (userId, planType, pricePaid) => {
  const now = new Date();
  const subscriptionEnd = new Date(now);

  if (planType === 'monthly') {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
  } else if (planType === 'quarterly') {
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 3);
  }

  // Create subscription record
  const { data: subData, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_type: planType,
      status: 'active',
      subscription_start: now.toISOString(),
      subscription_end: subscriptionEnd.toISOString(),
      price_paid: pricePaid,
    })
    .select()
    .single();

  if (subError) {
    console.error('Error creating subscription:', subError);
    return null;
  }

  // Update profile to mark as subscribed
  await supabase
    .from('profiles')
    .upsert({
      id: userId,
      is_subscribed: true,
      updated_at: now.toISOString(),
    });

  return subData;
};

// Check trial status from profile data
export const checkTrialStatus = (profile) => {
  if (!profile || !profile.trial_started_at || !profile.trial_ends_at) {
    return { isInTrial: false, daysRemaining: 0, hasTrialStarted: false };
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

// Check subscription status from subscription data
export const checkSubscriptionStatus = (subscription) => {
  if (!subscription) {
    return { isActive: false, expiresAt: null };
  }

  const now = new Date();
  const endDate = new Date(subscription.subscription_end);
  const isActive = subscription.status === 'active' && endDate > now;

  return {
    isActive,
    expiresAt: subscription.subscription_end,
    planType: subscription.plan_type,
  };
};
