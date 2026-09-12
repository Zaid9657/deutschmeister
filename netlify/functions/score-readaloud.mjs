import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { AIError, transcribeAudio } from './_shared/speakingAI.mjs';
import { alignTranscript } from './_shared/readaloud.mjs';

// Scored read-aloud (plan P3). One short clip in, one word-by-word score out:
// STT only — no LLM, no TTS, so a clip costs a fraction of a speaking turn and
// A1.1 learners can have it for free.
//
// The score is WORD RECOGNITION and the UI calls it *Verständlichkeit*. It is
// not a pronunciation grade and must never be presented as one.
//
// Cost control is a per-user daily clip cap counted from the same
// `lesson_attempts` ledger the row is written to — one table, one truth, no
// second counter to drift.
const READALOUD_DAILY_LIMIT = 60;

// A dialogue line, not an essay. Both ceilings are cheap rejections that keep
// oversized payloads away from the STT provider.
const MAX_EXPECTED_CHARS = 200;
const MAX_AUDIO_BYTES = 1_500_000;

/** pct at or above this is logged as a correct attempt. */
const CORRECT_PCT = 0.8;

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
    console.error('[score-readaloud] SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }
  // Secrets fail closed (CLAUDE.md): no key, no silent degradation to a fake
  // score — the client falls back to the honest self-confirm.
  if (!process.env.OPENAI_API_KEY) {
    console.error('[score-readaloud] OPENAI_API_KEY is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Die Aussprache-Bewertung ist gerade nicht verfügbar.', stage: 'config' }),
    };
  }

  try {
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) return unauthorizedResponse(headers);

    const { audioBase64, mimeType, expected, lektionId, lineKey } = JSON.parse(event.body || '{}');

    if (!audioBase64 || typeof audioBase64 !== 'string' || !expected || typeof expected !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'audioBase64 und expected sind erforderlich', stage: 'input' }) };
    }
    if (expected.length > MAX_EXPECTED_CHARS) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Satz zu lang', stage: 'input' }) };
    }
    // base64 carries 3 bytes per 4 characters.
    if (Math.floor((audioBase64.length * 3) / 4) > MAX_AUDIO_BYTES) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Aufnahme zu lang', stage: 'input' }) };
    }

    // Daily cap — today's read-aloud rows for this user, from midnight UTC.
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from('lesson_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('stage', 'readaloud')
      .gte('created_at', dayStart.toISOString());

    if (countError) {
      console.error('[score-readaloud] usage count failed:', JSON.stringify(countError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Nutzung konnte nicht geprüft werden', stage: 'usage' }) };
    }
    const used = count || 0;
    if (used >= READALOUD_DAILY_LIMIT) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'limit', limit: READALOUD_DAILY_LIMIT, used }) };
    }

    let transcript = '';
    try {
      transcript = await transcribeAudio({ audioBase64, mimeType });
    } catch (aiErr) {
      if (aiErr instanceof AIError) {
        return { statusCode: aiErr.status || 502, headers, body: JSON.stringify({ error: aiErr.message, stage: aiErr.stage }) };
      }
      throw aiErr;
    }

    const { words, pct } = alignTranscript(expected, transcript);
    const correct = pct >= CORRECT_PCT;

    // One row per clip: it is both the attempt record the error report reads
    // and the counter the cap above is derived from.
    const level = String(lektionId || '').split('-')[0].toLowerCase();
    try {
      const { error: insertError } = await supabase.from('lesson_attempts').insert({
        user_id,
        level: level || 'a1.1',
        lektion_id: String(lektionId || ''),
        item_id: String(lineKey || ''),
        stage: 'readaloud',
        correct,
        error_tag: correct ? null : 'Aussprache',
      });
      if (insertError) console.error('[score-readaloud] attempt insert failed:', JSON.stringify(insertError));
    } catch (err) {
      console.error('[score-readaloud] attempt insert threw:', err.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ transcript, words, pct, used: used + 1, limit: READALOUD_DAILY_LIMIT }),
    };
  } catch (error) {
    console.error('score-readaloud error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unerwarteter Serverfehler', stage: 'server' }) };
  }
};
