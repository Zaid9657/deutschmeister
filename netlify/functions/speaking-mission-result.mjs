import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { stateSecret, verifyMissionResult } from './_shared/speakingState.mjs';

// Verify a signed mission-result token — plan Task 5 (speaking-guided-city-map)
// Step 3: when the Abschlusstest hands off to mission 12 and gets a result
// token back, the runner records the speaking floor ONLY after this endpoint
// confirms the token (signature + user + the session row's own passed flag).
// A query parameter or client-stored flag alone never completes the section.
export const handler = async (event) => {
  const allowedOrigins = [
    'https://deutsch-meister.de',
    'https://www.deutsch-meister.de',
  ];
  const origin = event.headers?.origin || '';
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!supabaseKey || !supabase) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };

  try {
    const userId = await getAuthenticatedUserId(event);
    if (!userId) return unauthorizedResponse(headers);

    const secret = stateSecret();
    if (!secret) {
      console.error('[speaking-mission-result] SPEAKING_STATE_SECRET is not set');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    const { token } = JSON.parse(event.body || '{}');
    const result = verifyMissionResult(token, { userId, secret });
    if (!result || result.passed !== true) {
      return { statusCode: 400, headers, body: JSON.stringify({ verified: false }) };
    }

    // Belt and braces: the session the token names must exist, belong to the
    // caller, and carry the pass flag the turn function wrote.
    const { data: session } = await supabase
      .from('speaking_sessions')
      .select('passed, mode')
      .eq('session_token', result.sessionToken)
      .eq('user_id', userId)
      .maybeSingle();
    if (!session || session.passed !== true || session.mode !== 'mission') {
      return { statusCode: 400, headers, body: JSON.stringify({ verified: false }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ verified: true, missionOrder: result.missionOrder, passed: true, sessionToken: result.sessionToken }),
    };
  } catch (error) {
    console.error('speaking-mission-result error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
