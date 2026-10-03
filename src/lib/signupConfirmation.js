// What /signup does once supabase.auth.signUp has answered.
//
// WHY. "Confirm email" is on for this project, so a successful signUp returns
// a user but NO session: nobody is signed in until the learner clicks the link
// in the "Confirm your DeutschMeister account" mail. SignupPage navigated to
// /verify-email anyway, and that page needs a session (it redirects a visitor
// without one to /login). So every new learner landed on "Welcome Back" and a
// password form, with nothing telling them a mail was waiting. Auth logs,
// 2026-10-01 06:40 to 2026-10-03 06:41 UTC: each of the 4 new accounts tried
// a password login 6 to 14 s after signing up and was refused with
// "Email not confirmed"; 2 of them asked for a fresh mail within the first
// minute and hit Supabase's 60-second resend limit (HTTP 429, "you can only
// request this after N seconds"); 1 never confirmed.
//
// What the page does now:
//   * 'signed-in'   (a session came back, i.e. confirmation is off): go to
//                   /verify-email as before; with a session that page works.
//   * 'check-email' (no session): stay on /signup and show the address the
//                   link went to, with a resend that waits out the limit.
//   * 'error':      show the message, as before.

/** Supabase lets one address receive one auth mail per this many seconds. */
export const RESEND_COOLDOWN_SECONDS = 60;

/**
 * @param {{ data?: { session?: object|null }|null, error?: object|null }} result  what signUp returned
 * @returns {'error'|'signed-in'|'check-email'}
 */
export function signupOutcome(result) {
  if (result?.error) return 'error';
  return result?.data?.session ? 'signed-in' : 'check-email';
}

/**
 * How long Supabase asks us to wait before the next mail, from a refused
 * resend; null when the error is not the send-rate limit.
 * @param {{ code?: string, status?: number, message?: string }|null|undefined} error
 * @returns {number|null}
 */
export function resendWaitSeconds(error) {
  if (!error) return null;
  if (error.code !== 'over_email_send_rate_limit' && error.status !== 429) return null;
  const m = /after (\d+) seconds?/i.exec(error.message || '');
  const s = m ? Number(m[1]) : 0;
  return s > 0 ? s : RESEND_COOLDOWN_SECONDS;
}
