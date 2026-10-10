// Is this auth event's user the one already on screen? One answer, used by
// AuthContext before it stores `session.user`.
//
// WHY. supabase-js fires SIGNED_IN on every hidden→visible tab switch (its
// _recoverAndRefresh) and TOKEN_REFRESHED about once an hour, each with a NEW
// user object for the same person. AuthContext stored it every time, so every
// effect keyed on `user` re-ran: SubscriptionContext reloaded and flipped
// `loading`, and the guards (LevelSubscriptionGuard, SubscriptionGuard,
// ExamSubscriptionGuard, PurchaseGuard) swapped the page for a spinner, which
// unmounted it. A learner who looked something up in another tab came back to
// a reset exercise (docs/auth-audit-2026-10-06.md, F5).
//
// The rule: a new object only when something the app reads has changed. The
// id and email, the confirmation (isEmailVerified), updated_at (GoTrue bumps it
// on updateUser: a password change, the onboarding's starting_point) and the
// user_metadata the app reads (lib/firstRun.js) are compared; anything else
// in the object is ignored.

const fingerprint = (u) => [
  u.id,
  u.email ?? '',
  u.email_confirmed_at ?? '',
  u.updated_at ?? '',
  JSON.stringify(u.user_metadata ?? {}),
].join('|');

/**
 * @param {object|null|undefined} a  the user on screen
 * @param {object|null|undefined} b  the user an auth event carries
 * @returns {boolean} true when b may be dropped in favour of a
 */
export function sameAuthUser(a, b) {
  if (!a || !b) return !a && !b;
  return fingerprint(a) === fingerprint(b);
}
