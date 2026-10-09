// The write half of src/lib/placement.js: a level-test result taken SIGNED
// OUT on this browser lands on the account at the first profile load after
// sign-in. Called by SubscriptionContext before it publishes the profile, so
// the dashboard's first-run card, the course home and the speaking offer all
// read the placed level on their first render — no second fetch, no flash of
// "take the placement test".
import { supabase } from '../utils/supabase';
import { settlePlacement, readStoredPlacement, forgetPlacement } from '../lib/placement.js';

/**
 * @param {string} userId
 * @param {object|null} profile  the profile row just loaded
 * @returns {Promise<object|null>} the profile as it now stands. Never throws:
 *   a failed write keeps the local result for the next load and returns the
 *   profile unchanged.
 */
export async function settlePendingPlacement(userId, profile) {
  try {
    const { claim, forget } = settlePlacement({
      stored: readStoredPlacement(),
      currentLevel: profile?.current_level,
    });
    if (forget) forgetPlacement();
    if (!claim || !userId || !profile) return profile;

    // Same write the signed-in level test makes (src/pages/LevelTest.jsx).
    // supabase-js resolves rather than throws, so the error is read off the
    // result.
    const { error } = await supabase
      .from('profiles')
      .update({ current_level: claim, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      console.error('[placement] save failed:', error.message);
      return profile;
    }
    forgetPlacement();
    return { ...profile, current_level: claim };
  } catch (err) {
    console.error('[placement] settle failed:', err?.message || err);
    return profile;
  }
}
