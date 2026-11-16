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
