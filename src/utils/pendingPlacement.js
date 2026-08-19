// Carries a guest's placement result across signup.
//
// The results screen tells a logged-out learner "Save your results and start
// practicing at B1.2" and links to `/signup?level=B1.2` — but SignupPage never
// read that parameter, and a guest has no profile row to write to, so the
// result was discarded at the exact moment the site promised to keep it. The
// new account then started at A1.1, which is the same "we ignored your test"
// failure the dashboard had.
//
// The value is parked in localStorage and applied the first time the learner
// shows up signed in with an unplaced profile.
import { LEVEL_ORDER, normalizePlacementLevel } from '../config/levels';

const KEY = 'dm_pending_placement';

/** Park a placement result for a learner who has no account yet. */
export function rememberPendingPlacement(sublevel) {
  if (!sublevel) return;
  try {
    localStorage.setItem(KEY, normalizePlacementLevel(sublevel));
  } catch {
    // Private mode or a full quota: the placement simply isn't carried over.
  }
}

/** The parked placement, or null. Anything unrecognised is treated as absent. */
export function readPendingPlacement() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw && LEVEL_ORDER.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function clearPendingPlacement() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — a stale key only costs one no-op write attempt later.
  }
}

/**
 * Has this profile ever been placed?
 *
 * `profiles.current_level` ships with the default `'a1'` — a band, not a
 * sub-level — so a real placement is exactly a member of LEVEL_ORDER. Testing
 * the raw value rather than the normalised one is what keeps the default
 * distinguishable from a genuine A1.1 result.
 */
export function isUnplaced(profile) {
  return !LEVEL_ORDER.includes(String(profile?.current_level || ''));
}
