// "Continue with Google" (plan "Stop the leaks", step 1, 2026-11-15).
//
// WHY. Measured 2026-11-15: 25–29% of new signups never confirm their email,
// and 93% of all addresses are gmail.com. A Google sign-in needs no inbox step:
// Google has already verified the address, so the account is usable at once.
//
// OWNER ONLY: set VITE_GOOGLE_SIGNIN_ENABLED=true only after the Google
// provider is switched on in Supabase Auth (client id + secret) and
// https://deutsch-meister.de/login is on its redirect allow-list. Default OFF,
// so this code can ship before the provider exists: no button is rendered.
export const GOOGLE_SIGNIN_ENABLED = import.meta.env?.VITE_GOOGLE_SIGNIN_ENABLED === 'true';

/** The same landing as the email confirmation link: /login forwards a signed-in visitor to postAuthPath(). */
export const googleRedirectTo = (origin) => `${origin}/login`;

/**
 * What to tell a visitor whose sign-in came back with an error, or null.
 *
 * WHY. Reproduced 2026-11-17: the sign-in service allows five minutes between
 * pressing "Continue with Google" and coming back. A slower visitor is returned
 * with `error_code=bad_oauth_state` — and because the expired state carried the
 * landing address, they arrive on the site root, where nothing said a word. The
 * homepage now forwards such a return to /login and this is the sentence shown.
 */
export function signInReturnNotice(search = '', hash = '') {
  const params = new URLSearchParams(`${String(search).replace(/^\?/, '')}&${String(hash).replace(/^#/, '')}`);
  const code = params.get('error_code') || params.get('error');
  if (!code) return null;
  if (code === 'bad_oauth_state') return 'Signing in took too long, so it was stopped. Please try again.';
  if (code === 'otp_expired') return 'That link has expired or was already used. Please log in below.';
  if (code === 'access_denied') return 'Sign-in was cancelled. You can try again, or use your email.';
  return 'Sign-in did not complete. Please try again.';
}

/**
 * The profiles.acquisition_* values to write after a Google sign-up, or null.
 * An OAuth sign-up cannot carry auth.signUp metadata, so handle_new_user() sees
 * no attribution; the client writes it once instead, guarded server-side by
 * `acquisition_source IS NULL` (first touch is never overwritten).
 */
export function attributionBackfill(user, metadata) {
  if (user?.app_metadata?.provider !== 'google') return null;
  if (!metadata || !metadata.acquisition_source) return null;
  return metadata;
}
