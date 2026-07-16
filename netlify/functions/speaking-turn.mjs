import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  AIError,
  buildTeacherSystemPrompt,
  transcribeAudio,
  teacherReply,
  synthesizeSpeech,
} from './_shared/speakingAI.mjs';

const GRACE_MINUTES = 2;

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
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    const { sessionToken, audioBase64, mimeType, history } = JSON.parse(event.body || '{}');

    if (!sessionToken || !audioBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sessionToken und audioBase64 sind erforderlich', stage: 'input' }) };
    }

    // 1. The session must exist, belong to the caller, and be active.
    const { data: session, error: sessionError } = await supabase
      .from('speaking_sessions')
      .select('level, mission_id, mode, status, started_at, planned_minutes')
      .eq('session_token', sessionToken)
      .eq('user_id', user_id)
      .maybeSingle();

    if (sessionError) {
      console.error('[speaking-turn] session lookup error:', JSON.stringify(sessionError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Sitzung konnte nicht geladen werden', stage: 'session' }) };
    }
    if (!session) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sitzung nicht gefunden', stage: 'session' }) };
    }
    if (session.status !== 'active') {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'Diese Sitzung ist bereits beendet.', stage: 'session', code: 'session_closed' }) };
    }

    // 2. Time budget: started_at + planned_minutes (+ grace) must not be exceeded.
    const startedMs = session.started_at ? new Date(session.started_at).getTime() : 0;
    const budgetMs = (Number(session.planned_minutes || 5) + GRACE_MINUTES) * 60 * 1000;
    if (startedMs && Date.now() > startedMs + budgetMs) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Die Zeit für diese Sitzung ist abgelaufen.', stage: 'session', code: 'session_expired' }) };
    }

    const isPlacement = session.mode === 'placement';
    const level = session.level;

    // Mission fields feed the teacher system prompt when the session has one.
    let mission = null;
    if (!isPlacement && session.mission_id) {
      const { data: missionRow } = await supabase
        .from('speaking_missions')
        .select('ai_role, target_structures, system_prompt_extra')
        .eq('id', session.mission_id)
        .maybeSingle();
      mission = missionRow || null;
    }

    // 3. Cascade: STT → teacher (Haiku) → TTS. Provider failures surface as
    //    structured errors, never a silent 500.
    let userTranscript = '';
    let replyText = '';
    let replyAudioBase64 = null;
    let ttsWarning = false;

    try {
      userTranscript = await transcribeAudio({ audioBase64, mimeType });

      const system = buildTeacherSystemPrompt({ level, mission, isPlacement });
      // An unintelligible turn still gets a gentle nudge to repeat.
      const userText = userTranscript || '(Der Schüler hat nichts Verständliches gesagt — bitte freundlich um Wiederholung.)';
      replyText = await teacherReply({
        system,
        history: Array.isArray(history) ? history : [],
        userText,
        maxTokens: 120,
      });
      if (!replyText) replyText = 'Entschuldigung, kannst du das bitte wiederholen?';

      try {
        replyAudioBase64 = await synthesizeSpeech({ text: replyText });
      } catch (ttsErr) {
        // TTS is the least critical hop — keep the text reply rather than losing
        // the turn. The UI can show text and skip playback.
        if (ttsErr instanceof AIError) {
          console.warn('[speaking-turn] TTS degraded to text-only:', ttsErr.message, ttsErr.detail || '');
          ttsWarning = true;
        } else {
          throw ttsErr;
        }
      }
    } catch (aiErr) {
      if (aiErr instanceof AIError) {
        return {
          statusCode: aiErr.status || 502,
          headers,
          body: JSON.stringify({ error: aiErr.message, stage: aiErr.stage }),
        };
      }
      throw aiErr;
    }

    // 4. Persist both sides (as the old flow did). Best-effort — a save failure
    //    must not lose the turn the user already heard.
    const rows = [];
    if (userTranscript) {
      rows.push({ session_token: sessionToken, user_id, role: 'user', content: userTranscript, level, created_at: new Date().toISOString() });
    }
    rows.push({ session_token: sessionToken, user_id, role: 'assistant', content: replyText, level, created_at: new Date().toISOString() });
    try {
      const { error: saveError } = await supabase.from('speaking_messages').insert(rows);
      if (saveError) console.error('[speaking-turn] Failed to save messages:', JSON.stringify(saveError));
    } catch (err) {
      console.error('[speaking-turn] message insert threw:', err.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userTranscript,
        replyText,
        replyAudioBase64,
        ...(ttsWarning ? { warning: 'tts_unavailable' } : {}),
      }),
    };
  } catch (error) {
    console.error('speaking-turn error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unerwarteter Serverfehler', stage: 'server' }) };
  }
};
