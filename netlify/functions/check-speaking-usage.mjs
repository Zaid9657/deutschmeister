import { supabaseKey, supabase } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { summarizeBalance, bucketFromRow } from './_shared/speakingAllowance.mjs';

// Balance read-model for the speaking surfaces (2026-09-15 rebuild plan).
// Reports SECONDS from the allowance ledger — monthlySeconds (expiring
// subscription allowance) and permanentSeconds (course + top-ups) — plus the
// learner's remaining included mission attempts. The old response (session
// counts, daily-free flags) is gone with the model that produced it. The
// client may display this; it is never authoritative for a charge.

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

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  if (!supabaseKey || !supabase) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    // Identity comes from the verified JWT, never from the request body.
    const authUserId = await getAuthenticatedUserId(event);
    if (!authUserId) {
      return unauthorizedResponse(headers);
    }

    const [{ data: buckets, error: bucketsError }, { data: attempts, error: attemptsError }] = await Promise.all([
      supabase
        .from('speaking_credit_buckets')
        .select('id, remaining_seconds, expires_at, created_at')
        .eq('user_id', authUserId),
      supabase
        .from('speaking_mission_entitlements')
        .select('mission_key, attempts_remaining')
        .eq('user_id', authUserId)
        .gt('attempts_remaining', 0),
    ]);
    if (bucketsError) console.error('[check-speaking-usage] buckets read error:', JSON.stringify(bucketsError));
    if (attemptsError) console.error('[check-speaking-usage] attempts read error:', JSON.stringify(attemptsError));

    const balance = summarizeBalance((buckets || []).map(bucketFromRow), new Date());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...balance,
        includedMissionAttempts: (attempts || []).map((a) => a.mission_key),
      }),
    };
  } catch (error) {
    console.error('check-speaking-usage error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
