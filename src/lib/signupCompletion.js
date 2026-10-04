// When does a signup count as "completed"? One definition, used by AuthContext.
//
// The old rule fired signup_completed on a SIGNED_IN event less than 60 s after
// the account was created. With email confirmation on, the first sign-in
// happens when the learner clicks the link in their inbox — minutes or hours
// later — so the event almost never fired and the funnel showed signups
// starting but never finishing (docs/redesign-2026-10/baseline.md).
//
// The rule now: a SIGNED_IN for an account that was created in the last 14
// days AND whose email was confirmed in the last 30 minutes is the moment the
// account came alive. The 60-second path stays for accounts that never need a
// confirmation. A per-browser marker (dm_signup_done = user id) stops a reload,
// a second tab or a token refresh from counting the same person twice.

export const SIGNUP_CONFIRM_WINDOW_MS = 30 * 60 * 1000;
export const SIGNUP_INSTANT_WINDOW_MS = 60 * 1000;
export const SIGNUP_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
export const SIGNUP_DONE_KEY = 'dm_signup_done';

const time = (v) => {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? t : null;
};

/** True when this signed-in user has just finished signing up (pure; no storage). */
export function isFreshSignup(user, now = Date.now()) {
  const created = time(user?.created_at);
  if (created === null || now - created > SIGNUP_MAX_AGE_MS) return false;
  if (now - created < SIGNUP_INSTANT_WINDOW_MS) return true;
  const confirmed = time(user?.email_confirmed_at || user?.confirmed_at);
  return confirmed !== null && confirmed >= created && now - confirmed < SIGNUP_CONFIRM_WINDOW_MS;
}

/**
 * isFreshSignup plus the once-per-browser marker. `storage` is injectable for
 * tests; it defaults to localStorage and fails closed (no event) when blocked.
 */
export function claimSignupCompletion(user, now = Date.now(), storage = undefined) {
  if (!user?.id || !isFreshSignup(user, now)) return false;
  let store = storage;
  try {
    if (store === undefined) store = window.localStorage;
    if (store.getItem(SIGNUP_DONE_KEY) === user.id) return false;
    store.setItem(SIGNUP_DONE_KEY, user.id);
    return true;
  } catch {
    return false;
  }
}
