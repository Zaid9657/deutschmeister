import { supabase } from './supabase.mjs';

/**
 * Verifies the Supabase JWT from the Authorization header and returns the
 * authenticated user's id, or null if the token is missing/invalid.
 *
 * Endpoints must derive the acting user from this — never from a client-supplied
 * user_id in the request body, which any caller can forge.
 */
export async function getAuthenticatedUserId(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token || !supabase) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch (e) {
    console.error('JWT verification failed:', e.message);
    return null;
  }
}

export function unauthorizedResponse(headers) {
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Nicht autorisiert — bitte erneut anmelden.' }),
  };
}
