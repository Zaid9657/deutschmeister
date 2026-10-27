import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  AIError,
  HISTORY_MESSAGES,
  buildTeacherSystemPrompt,
  taskFromSession,
  transcribeAudio,
  teacherReply,
  synthesizeSpeech,
} from './_shared/speakingAI.mjs';
// One grace window for both "turns stop here" and "the session is stale".
import { SESSION_GRACE_MINUTES } from './_shared/speakingCloseout.mjs';
import { reserveTurn, settleTurn } from './_shared/speakingCloseout.mjs';

// One tap-to-speak answer, not a recording session: the ceiling score-readaloud
// applies to a clip, checked on the decoded size before the STT provider is called.
const MAX_AUDIO_BYTES = 1_500_000;

/**
 * The conversation so far, as THIS server stored it (both sides of every turn
 * go to speaking_messages below): the last HISTORY_MESSAGES rows, oldest first.
 * The request body never supplies it, so a client can neither inflate the
 * teacher's input nor put earlier instructions in the teacher's mouth. Within
 * one timestamp the learner's line comes first — a turn saves its two rows
 * together. A failed read degrades to a reply without context, never to a lost turn.
 */
async function storedHistory(sessionToken, userId) {
  try {
    const { data, error } = await supabase
      .from('speaking_messages')
      .select('role, content, created_at')
      .eq('session_token', sessionToken)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_MESSAGES);
    if (error || !Array.isArray(data)) throw new Error(error?.message || 'no rows');
    const rank = (row) => (row.role === 'user' ? 0 : 1);
    return data
      .map((row) => ({ role: row.role, content: row.content, at: Date.parse(row.created_at) || 0 }))
      .sort((a, b) => a.at - b.at || rank(a) - rank(b))
      .map(({ role, content }) => ({ role, content }));
  } catch (err) {
    console.error('[speaking-turn] history read failed:', err.message);
    return [];
  }
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

    // A `history` field in the body is ignored: the teacher reads the server's own transcript.
    const { sessionToken, audioBase64, mimeType } = JSON.parse(event.body || '{}');

    if (!sessionToken || !audioBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sessionToken und audioBase64 sind erforderlich', stage: 'input' }) };
    }

    // base64 carries 3 bytes per 4 characters.
    if (typeof audioBase64 !== 'string' || Math.floor((audioBase64.length * 3) / 4) > MAX_AUDIO_BYTES) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Audio zu groß', stage: 'input', code: 'audio_too_large' }) };
    }

    // 1. The session must exist, belong to the caller, and be active.
    const { data: session, error: sessionError } = await supabase
      .from('speaking_sessions')
      .select('level, mission_id, mode, status, started_at, planned_minutes, topic, scenario')
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
    const budgetMs = (Number(session.planned_minutes || 5) + SESSION_GRACE_MINUTES) * 60 * 1000;
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

    // No mission row, but the session was started from a course Lektion: the
    // task was persisted in `topic`/`scenario` at start, so rebuild it here and
    // every turn stays on the task the lesson promised.
    const courseTask = (!isPlacement && !mission) ? taskFromSession(session) : null;

    const turnId = randomUUID();
    const reservation = await reserveTurn(supabase, sessionToken, user_id, turnId);
    if (!reservation.ok) {
      return { statusCode: 409, headers, body: JSON.stringify({ error: 'Diese Sitzung nimmt gerade keine Aufnahme an.', stage: 'session', code: reservation.code }) };
    }

    // 3. Cascade: STT → teacher (Haiku) → TTS. Provider failures surface as
    //    structured errors, never a silent 500.
    let userTranscript = '';
    let replyText = '';
    let replyAudioBase64 = null;
    let ttsWarning = false;

    try {
      // Read the stored transcript while the audio is being transcribed.
      const historyRead = storedHistory(sessionToken, user_id);
      userTranscript = await transcribeAudio({ audioBase64, mimeType });

      const system = buildTeacherSystemPrompt({ level, mission, isPlacement, courseTask });
      // An unintelligible turn still gets a gentle nudge to repeat.
      const userText = userTranscript || '(Der Schüler hat nichts Verständliches gesagt — bitte freundlich um Wiederholung.)';
      replyText = await teacherReply({
        system,
        history: await historyRead,
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
      await settleTurn(supabase, sessionToken, user_id, turnId, false, reservation.legacy);
      if (aiErr instanceof AIError) {
        return {
          statusCode: aiErr.status || 502,
          headers,
          body: JSON.stringify({ error: aiErr.message, stage: aiErr.stage }),
        };
      }
      throw aiErr;
    }

    // With the migration, delivery is fenced before returning audio. Legacy
    // turns keep their original message-based settlement until SQL is applied.
    await settleTurn(supabase, sessionToken, user_id, turnId, true, reservation.legacy);

    // 4. Persist both sides (as the old flow did). Best-effort — a save failure
    //    must not lose the turn the user already heard — but tried twice with
    //    the same rows: these rows are what the evaluation grades, and the
    //    next turn's context.
    const rows = [];
    if (userTranscript) {
      rows.push({ session_token: sessionToken, user_id, role: 'user', content: userTranscript, level, created_at: new Date().toISOString() });
    }
    rows.push({ session_token: sessionToken, user_id, role: 'assistant', content: replyText, level, created_at: new Date().toISOString() });
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const { error: saveError } = await supabase.from('speaking_messages').insert(rows);
        if (!saveError) break;
        console.error(`[speaking-turn] Failed to save messages (attempt ${attempt}):`, JSON.stringify(saveError));
      } catch (err) {
        console.error(`[speaking-turn] message insert threw (attempt ${attempt}):`, err.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userTranscript,
        replyText,
        replyAudioBase64,
        ...(ttsWarning ? { warning: 'tts_unavailable' } : {}),
        // Audio arrived but no speech was recognised — almost always a muted or
        // wrong microphone, not the learner's German. The client says so
        // instead of letting the teacher's "bitte wiederholen" imply it.
        ...(userTranscript ? {} : { noSpeech: true }),
      }),
    };
  } catch (error) {
    console.error('speaking-turn error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unerwarteter Serverfehler', stage: 'server' }) };
  }
};
