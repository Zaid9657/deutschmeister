import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  AIError,
  buildTeacherSystemPrompt,
  taskFromSession,
  transcribeAudio,
  teacherReply,
  guidedTurnFeedback,
  synthesizeSpeech,
} from './_shared/speakingAI.mjs';
import { assessPronunciation } from './_shared/azurePronunciation.mjs';
import { stateSecret, signTaskState, verifyTaskState, signMissionResult } from './_shared/speakingState.mjs';

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

    const body = JSON.parse(event.body || '{}');
    const { audioBase64, mimeType, history, referenceText, taskStateToken } = body;
    const sessionToken = body.sessionToken || body.session_token;
    // The City Map's guided flow (plan 2026-09-15 Task 3): structured turns
    // return the three-signal feedback, persist NO transcript, and carry
    // their task state as a signed token instead of trusting the browser.
    const structured = body.structured === true;

    if (!sessionToken || !audioBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sessionToken und audioBase64 sind erforderlich', stage: 'input' }) };
    }

    // ~7.5 MB of audio — far above any single tap-to-speak turn, but a hard
    // ceiling against oversized payloads being fed into the STT provider.
    if (typeof audioBase64 !== 'string' || audioBase64.length > 10_000_000) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Audio zu groß', stage: 'input' }) };
    }

    // The conversation history is client-supplied context for the teacher
    // model; truncate rather than trust it as an unbounded prompt surface.
    // Structured guided turns hold at most the last six turns (12 messages)
    // in the browser — nothing is stored server-side on that path.
    const boundedHistory = (Array.isArray(history) ? history : [])
      .slice(structured ? -12 : -40)
      .map((m) => ({
        role: m?.role === 'assistant' ? 'assistant' : 'user',
        content: String(m?.content ?? '').slice(0, structured ? 1000 : 5000),
      }));

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
        .select('ai_role, target_structures, system_prompt_extra, mission_order, pass_criteria')
        .eq('id', session.mission_id)
        .maybeSingle();
      mission = missionRow || null;
    }

    // Structured turns exist only for real guided missions, and only with the
    // signing secret present (fail closed — an unsigned task state would make
    // mission passes forgeable).
    if (structured && (!mission || session.mode !== 'mission')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'structured turns need a guided mission session', stage: 'input' }) };
    }
    const secret = stateSecret();
    if (structured && !secret) {
      console.error('[speaking-turn] SPEAKING_STATE_SECRET is not set — structured turns disabled');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured', stage: 'server' }) };
    }
    // Task state: turn 1 starts empty; later turns must present the signed
    // state this function issued (the browser cannot edit it, only lose it).
    let taskState = { completedCriteria: [], turn: 0 };
    if (structured && taskStateToken) {
      const verified = verifyTaskState(taskStateToken, { sessionToken, secret });
      if (!verified) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ungültiger Aufgabenstand — bitte Mission neu starten.', stage: 'input', code: 'bad_task_state' }) };
      }
      taskState = verified;
    }

    // No mission row, but the session was started from a course Lektion: the
    // task was persisted in `topic`/`scenario` at start, so rebuild it here and
    // every turn stays on the task the lesson promised.
    const courseTask = (!isPlacement && !mission) ? taskFromSession(session) : null;

    // 3. Cascade: STT (+ Azure acoustics in parallel for constrained steps)
    //    → teacher → TTS. Provider failures surface as structured errors,
    //    never a silent 500.
    let userTranscript = '';
    let replyText = '';
    let replyAudioBase64 = null;
    let ttsWarning = false;
    let pronunciation = null;
    let feedback = null;

    try {
      // Acoustic pronunciation runs ONLY on real audio against a reference
      // text (constrained step); an open turn without a trustworthy reference
      // honestly reports pronunciation as unavailable. Never derived from the
      // transcript. Audio is held in memory and discarded with this request.
      const wantAcoustics = structured && typeof referenceText === 'string' && referenceText.trim()
        && typeof mimeType === 'string' && mimeType.includes('wav');
      const [transcript, acoustics] = await Promise.all([
        transcribeAudio({ audioBase64, mimeType }),
        wantAcoustics
          ? assessPronunciation({
            wavBuffer: Buffer.from(audioBase64, 'base64'),
            referenceText: referenceText.trim().slice(0, 300),
            locale: 'de-DE',
          })
          : Promise.resolve(null),
      ]);
      userTranscript = transcript;
      pronunciation = acoustics; // null = honestly unavailable

      const system = buildTeacherSystemPrompt({ level, mission, isPlacement, courseTask });
      // An unintelligible turn still gets a gentle nudge to repeat.
      const userText = userTranscript || '(Der Schüler hat nichts Verständliches gesagt — bitte freundlich um Wiederholung.)';

      if (structured) {
        feedback = await guidedTurnFeedback({
          system,
          history: boundedHistory,
          userText,
          mission,
          completedCriteria: taskState.completedCriteria,
        });
      }
      if (feedback?.reply) {
        replyText = feedback.reply;
      } else {
        replyText = await teacherReply({ system, history: boundedHistory, userText, maxTokens: 120 });
      }
      if (!replyText) replyText = 'Entschuldigung, können Sie das bitte wiederholen?';

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

    // 4a. Structured guided turns: three-signal feedback + the signed task
    //     state. NOTHING is persisted — no transcript rows, no audio; the
    //     session row keeps only aggregates at end (privacy by default,
    //     spec §9.1). Pass integrity comes from the signed state chain.
    if (structured) {
      const criteria = Array.isArray(mission.pass_criteria) ? mission.pass_criteria : [];
      const completedCriteria = [...new Set([...taskState.completedCriteria, ...(feedback?.completedNow || [])])];
      const passed = criteria.length > 0 && criteria.every((c) => completedCriteria.includes(c));
      const nextState = signTaskState({
        sessionToken,
        missionOrder: mission.mission_order,
        completedCriteria,
        turn: taskState.turn + 1,
      }, secret);

      // Pass: record aggregates on the session row (flags, never words) and
      // issue the short-lived signed result the Abschlusstest handoff needs.
      let missionResultToken = null;
      if (passed) {
        missionResultToken = signMissionResult({
          userId: user_id,
          missionOrder: mission.mission_order,
          passed: true,
          sessionToken,
        }, secret);
        try {
          const { error: passError } = await supabase
            .from('speaking_sessions')
            .update({ evaluated: true, passed: true })
            .eq('session_token', sessionToken)
            .eq('user_id', user_id);
          if (passError) console.error('[speaking-turn] pass flag update failed:', JSON.stringify(passError));
        } catch (err) {
          console.error('[speaking-turn] pass flag update threw:', err.message);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          transcript: userTranscript,
          reply: { text: replyText, audioBase64: replyAudioBase64 },
          task: {
            passed,
            completedCriteria,
            nextGoal: criteria.find((c) => !completedCriteria.includes(c)) ?? null,
          },
          language: {
            bestVersion: feedback?.bestVersion ?? null,
            tip: feedback?.tip ?? null,
          },
          pronunciation,
          taskStateToken: nextState,
          ...(missionResultToken ? { missionResultToken } : {}),
          ...(ttsWarning ? { warning: 'tts_unavailable' } : {}),
        }),
      };
    }

    // 4b. Legacy paths (placement, free conversation, old mission UI) keep
    //     persisting the turn: evaluate-speaking grades ONLY the transcript
    //     stored server-side (its anti-forgery control). The guided City Map
    //     path above never writes here.
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
