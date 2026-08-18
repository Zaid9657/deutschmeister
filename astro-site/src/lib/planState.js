// Browser-only helper for the static pricing page. Reuses the shared Supabase
// client (same storageKey as the SPA, so a session signed in there is already
// restored here) to answer one question: what plan is this visitor actually on?
//
// Loaded lazily and only when a session token is present, so the logged-out
// majority — the crawlable path that /pricing/ exists for — never fetches it.
import { supabase } from './supabase.js';

/**
 * @returns {Promise<null | {state: 'subscribed'|'trial'|'free', trialDaysLeft: number}>}
 *   null when there is no signed-in user or the profile could not be read.
 */
export async function getPlanState() {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return null;

  // supabase-js resolves rather than throws on a REST error, so check `error`
  // explicitly — a silent null here would render the page as if logged out.
  const { data, error } = await supabase
    .from('profiles')
    .select('is_subscribed, trial_ends_at')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[planState] profile read failed:', error.message);
    return null;
  }

  if (data?.is_subscribed) return { state: 'subscribed', trialDaysLeft: 0 };

  const endsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null;
  if (endsAt && endsAt.getTime() > Date.now()) {
    // Round up: with 6.2 days remaining a learner has "7 days left", not 6.
    const days = Math.ceil((endsAt.getTime() - Date.now()) / 86400000);
    return { state: 'trial', trialDaysLeft: days };
  }

  return { state: 'free', trialDaysLeft: 0 };
}
