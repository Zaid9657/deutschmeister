import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { liveBetaEnabled } from './_shared/speakingFlags.mjs';

// Short-lived OpenAI Realtime credential — plan Task 1 (speaking-live-quality).
//
// The order is the security model: authenticate → the caller's own LIVE
// session with an ACTIVE reservation must already exist (reserve BEFORE any
// provider credential; a failed secret creation refunds it) → only then mint
// the ephemeral client secret. The permanent OPENAI_API_KEY never leaves the
// server; the response carries only the short-lived secret and its expiry,
// under Cache-Control: no-store, and is never logged.
//
// Environment (all deployment configuration, no scattered literals):
//   OPENAI_REALTIME_MODEL (default gpt-realtime-2.1-mini — verify against the
//   provider account at deploy time), OPENAI_REALTIME_VOICE (default marin),
//   SPEAKING_LIVE_BETA_ENABLED (off = 503 before anything else runs).

const REALTIME_SECRETS_URL = 'https://api.openai.com/v1/realtime/client_secrets';

// Bounded German instructions for the live coach: the selected mission's
// scenario and A1 vocabulary, never client free-text.
export function buildRealtimeInstructions(mission) {
  const base = [
    'Du bist eine warme, geduldige Deutschlehrerin in einem Live-Gespräch mit einer Person auf Niveau A1.',
    'Sprich NUR Deutsch, langsam und deutlich, in kurzen Sätzen (maximal 10 Wörter).',
    'Stelle EINE Frage, dann warte. Unterbrich nicht.',
    'Bleibe bei Alltagsthemen auf A1-Niveau. Keine medizinische, rechtliche oder Einwanderungsberatung.',
    'Lehne unpassende Rollenspiele freundlich ab und biete ein Alltagsthema an.',
  ];
  if (mission?.scenario_de) {
    base.push(`SZENARIO: ${String(mission.scenario_de).slice(0, 400)}`);
  }
  if (mission?.ai_role) {
    base.push(`DEINE ROLLE: ${String(mission.ai_role).slice(0, 300)}`);
  }
  return base.join('\n');
}

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
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  if (!supabaseKey || !supabase) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };

  try {
    const userId = await getAuthenticatedUserId(event);
    if (!userId) return unauthorizedResponse(headers);

    if (!liveBetaEnabled()) {
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Live-Gespräche sind noch nicht freigeschaltet.', code: 'LIVE_BETA_OFF' }) };
    }

    const { sessionToken, missionId } = JSON.parse(event.body || '{}');
    if (!sessionToken) return { statusCode: 400, headers, body: JSON.stringify({ error: 'sessionToken is required' }) };

    // The session must be the caller's own live session…
    const { data: session } = await supabase
      .from('speaking_sessions')
      .select('user_id, mode, status')
      .eq('session_token', sessionToken)
      .maybeSingle();
    if (!session) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Session not found' }) };
    if (session.user_id !== userId) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not your session' }) };
    if (session.mode !== 'live' || session.status !== 'active') {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'Session is not an active live session', code: 'NOT_LIVE_ACTIVE' }) };
    }

    // …with an ACTIVE reservation (reserve before credential, always).
    const { data: reservations } = await supabase
      .from('speaking_session_reservations')
      .select('status')
      .eq('session_token', sessionToken)
      .eq('user_id', userId);
    const reserved = (reservations || []).some((r) => r.status === 'reserved');
    if (!reserved) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'No active reservation for this session', code: 'NOT_RESERVED' }) };
    }

    let mission = null;
    if (missionId) {
      const { data: missionRow } = await supabase
        .from('speaking_missions')
        .select('scenario_de, ai_role')
        .eq('id', missionId)
        .maybeSingle();
      mission = missionRow || null;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[realtime-client-secret] OPENAI_API_KEY is not set');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
    }

    const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-2.1-mini';
    const voice = process.env.OPENAI_REALTIME_VOICE || 'marin';
    let secretPayload = null;
    try {
      const res = await fetch(REALTIME_SECRETS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: {
            type: 'realtime',
            model,
            audio: { output: { voice } },
            instructions: buildRealtimeInstructions(mission),
          },
        }),
      });
      if (!res.ok) throw new Error(`provider status ${res.status}`);
      secretPayload = await res.json();
    } catch (providerErr) {
      // A failed credential means the session cannot begin — return the full
      // reservation before reporting the failure.
      console.warn('[realtime-client-secret] provider failed:', providerErr.message);
      const { error: refundError } = await supabase.rpc('refund_speaking_session', {
        p_user_id: userId,
        p_session_token: sessionToken,
        p_idempotency_key: `realtime-secret:${sessionToken}`,
      });
      if (refundError) console.error('[realtime-client-secret] refund after provider failure FAILED:', JSON.stringify(refundError));
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Live-Verbindung derzeit nicht möglich — deine Minuten wurden zurückgegeben.', code: 'PROVIDER_UNAVAILABLE', refunded: !refundError }) };
    }

    const clientSecret = secretPayload?.value || secretPayload?.client_secret?.value || null;
    const expiresAt = secretPayload?.expires_at || secretPayload?.client_secret?.expires_at || null;
    if (!clientSecret) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Provider returned no secret', code: 'PROVIDER_UNAVAILABLE' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ clientSecret, expiresAt, model, sessionToken }),
    };
  } catch (error) {
    console.error('realtime-client-secret error:', error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
