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
//
// Two follow-ups from the #179 review (2026-10-03):
//   * A refusal that names no wait is not the 60-second window: the hourly
//     cap on auth mail answers 429 without a number. The panel used to restart
//     its 60 s countdown on every such answer, forever and without a word.
//     After the second one in a row it now says the limit is reached and to
//     try again later. (Every refusal logged so far named its wait: 255 of 255
//     rate-limit rows in signup_attempts and 2 of 2 in the auth logs of
//     10-02/03, measured 2026-10-03. The cap is the case the reviewer named,
//     not one we have seen.)
//   * A learner who confirms in another tab is signed in there, and supabase-js
//     tells this tab (SIGNED_IN over its BroadcastChannel). The panel moves on
//     to where a login would have gone, but only for a session of the address
//     the link went to: an account already signed in on this browser is not the
//     one that was just created.

/** Supabase lets one address receive one auth mail per this many seconds. */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Refusals in a row without a named wait before the panel calls it the cap. */
export const UNTIMED_REFUSALS_BEFORE_LIMIT_NOTICE = 2;

const isSendRateLimit = (error) => error?.code === 'over_email_send_rate_limit' || error?.status === 429;

/**
 * The wait a refusal names ("... after 36 seconds"), or null when it names
 * none. 0 is a named wait: signup_attempts holds 10 "after 0 seconds".
 */
const namedWaitSeconds = (error) => {
  const m = /after (\d+) seconds?/i.exec(error?.message || '');
  return m ? Number(m[1]) : null;
};

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
  if (!isSendRateLimit(error)) return null;
  const s = namedWaitSeconds(error);
  return s > 0 ? s : RESEND_COOLDOWN_SECONDS;
}

/**
 * The resend button after a refused resend; null when the refusal is not the
 * send-rate limit (the page shows the message instead).
 * @param {{ code?: string, status?: number, message?: string }|null|undefined} error
 * @param {number} untimedSoFar  refusals in a row so far that named no wait
 * @returns {{ wait: number, untimed: number, limitReached: boolean }|null}
 */
export function resendRefusal(error, untimedSoFar = 0) {
  const wait = resendWaitSeconds(error);
  if (!wait) return null;
  const untimed = namedWaitSeconds(error) === null ? untimedSoFar + 1 : 0;
  return { wait, untimed, limitReached: untimed >= UNTIMED_REFUSALS_BEFORE_LIMIT_NOTICE };
}

/**
 * Whether an auth event's session belongs to the address the link went to,
 * i.e. the learner confirmed (in this tab or another) and is now signed in.
 * @param {{ user?: { email?: string } }|null|undefined} session
 * @param {string} sentTo
 */
export function signedInAs(session, sentTo) {
  const email = session?.user?.email;
  return Boolean(email && sentTo) && email.trim().toLowerCase() === sentTo.trim().toLowerCase();
}
