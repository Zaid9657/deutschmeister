// Applies a placement result taken before signup, once the learner arrives
// with a real account. Runs on the dashboard — the destination every verified
// signup lands on — so the first authenticated screen already reflects the
// level the test gave them.
import { useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import {
  readPendingPlacement,
  clearPendingPlacement,
  isUnplaced,
} from '../utils/pendingPlacement';

/**
 * @param {object|null} user     the authenticated user, or null
 * @param {object|null} profile  the loaded profiles row, or null while loading
 * @param {() => void} [onApplied] called after a successful write, to re-read
 *   the profile so the UI picks the new level up without a reload
 */
export function useApplyPendingPlacement(user, profile, onApplied) {
  // One attempt per mount: a failed write shouldn't retry on every profile
  // change, and a successful one has already cleared the stored value.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !user || !profile) return;
    if (!isUnplaced(profile)) {
      // Already placed — the stored value is stale and would overwrite a newer
      // result, so drop it rather than leaving it to fire later.
      clearPendingPlacement();
      return;
    }

    const pending = readPendingPlacement();
    if (!pending) return;
    attempted.current = true;

    let cancelled = false;
    (async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ current_level: pending, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (cancelled) return;
      if (error) {
        // Keep the stored value: the next visit gets another chance.
        console.error('Failed to apply pending placement:', error.message);
        return;
      }
      clearPendingPlacement();
      onApplied?.();
    })();
    return () => { cancelled = true; };
  }, [user, profile, onApplied]);
}
