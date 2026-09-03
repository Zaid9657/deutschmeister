// Browser-only entitlement check for the static grammar pages.
//
// Mirrors SubscriptionContext.hasLevelAccess in the SPA, with the same three
// doors: the level is free, the account has a live trial or Pro
// (profiles.is_subscribed / trial_ends_at — the included Pro window of a course
// purchase sets is_subscribed too), or a bought level course covers the level
// (purchases → levelsForProduct). Loaded lazily and only when a session exists,
// so the logged-out majority never fetches the Supabase chunk.
import { supabase } from './supabase.js';
import { levelsForProduct } from '../data/pricing.js';

/**
 * @param {string} level lowercase sub-level, e.g. 'b1.1'
 * @returns {Promise<{ signedIn: boolean, open: boolean }>}
 */
export async function getLevelAccess(level) {
  const l = (level || '').toLowerCase();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, open: false };

  const [{ data: profile }, { data: purchases }] = await Promise.all([
    supabase.from('profiles').select('is_subscribed, trial_ends_at').eq('id', user.id).maybeSingle(),
    supabase.from('purchases').select('product_key').eq('user_id', user.id).eq('status', 'active'),
  ]);

  if (profile?.is_subscribed) return { signedIn: true, open: true };
  const endsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  if (endsAt && endsAt.getTime() > Date.now()) return { signedIn: true, open: true };
  const owned = (purchases || []).some((p) => levelsForProduct(p.product_key).includes(l));
  return { signedIn: true, open: owned };
}
