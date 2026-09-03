import { corsHeaders, guardMethod } from './_shared/http.mjs';
import { supabaseKey, supabase } from './_shared/supabase.mjs';
import { checkUsage } from './_shared/speakingUsage.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';

export const handler = async (event) => {
  const headers = corsHeaders(event);

  const gate = guardMethod(event, headers);
  if (gate) return gate;

  if (!supabaseKey || !supabase) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    // Identity comes from the verified JWT, never from the request body.
    const authUserId = await getAuthenticatedUserId(event);
    if (!authUserId) {
      return unauthorizedResponse(headers);
    }

    const result = await checkUsage(authUserId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('check-speaking-usage error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
