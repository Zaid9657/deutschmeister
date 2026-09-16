import { supabase } from './supabase.mjs';

// Tier resolution ONLY (premium | pro | free_trial | free_expired).
//
// The session-count quota model that used to live here (30/month for pro,
// 2 lifetime for trial, the speaking_usage counter) is GONE — speaking is
// billed in seconds from the allowance ledger since 2026-09-16
// (migrations/2026-09-16-speaking-allowances.sql, speaking-session.mjs).
// getTier stays because evaluate-writing.mjs shares it, so speaking and
// writing can never disagree about who is pro/trial/expired.

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
