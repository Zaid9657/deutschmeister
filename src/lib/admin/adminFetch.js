// The wired transport (see adminFetchCore.js for the rules). This file is the
// ONLY module under src/ that may pass a token to an admin-* function;
// tests/admin-fetch.test.mjs scans src/pages/admin and src/components/admin
// for any other Authorization header or admin-* fetch.
import { supabase } from '../../utils/supabase';
import { createAdminFetch } from './adminFetchCore.js';

export { AdminSessionExpired, describeAdminError } from './adminFetchCore.js';

const transport = createAdminFetch({
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  },
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return null;
    return data?.session?.access_token ?? null;
  },
  fetchImpl: (...args) => fetch(...args),
});

export const { adminFetch, adminCall, onAdminSessionChange, clearAdminSessionExpired } = transport;

/**
 * The expiry banner's button: sign out LOCALLY only (the server session is
 * already gone; leaving the dead token in storage makes the login screen
 * believe it is signed in), then route to login.
 */
export async function signOutLocally() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    /* the token may already be gone */
  }
  clearAdminSessionExpired();
}
