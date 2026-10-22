import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { checkUsage, reserveSession } from './_shared/speakingUsage.mjs';
import {
  CLOSEOUT_COLUMNS,
  closeOutSession,
  closeOutStaleSessions,
} from './_shared/speakingCloseout.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  AIError,
  buildTeacherSystemPrompt,
  courseTaskColumns,
  parseCourseTask,
  teacherReply,
  synthesizeSpeech,
} from './_shared/speakingAI.mjs';

// Session pricing (cents). 10/15-min always cost; 5-min may be free (see below).
const PRICE_CENTS = { 5: 100, 10: 200, 15: 300 };
const ALLOWED_MINUTES = [5, 10, 15];
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
    // Identity comes from the verified JWT — never from a client-supplied id.
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    const body = JSON.parse(event.body || '{}');
    const {
      action,
      level,
      minutes,
      missionId,
      mode,
      session_token: providedToken,
      duration_seconds,
    } = body;

    // -----------------------------------------------------------------------
    // action 'end' — Finish, the timer, or Cancel. The server closes the
    // session on the learner turns IT counted (never a client-reported count
    // or status): any turn → 'completed'; zero → 'cancelled' and the
    // reservation made at start is released. See _shared/speakingCloseout.mjs.
    // Evaluation still runs via evaluate-speaking.mjs.
    // -----------------------------------------------------------------------
    if (action === 'end') {
      if (!providedToken) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'session_token is required to end a session' }) };
      }
      let outcome = null;
      try {
        const { data: row, error: rowError } = await supabase
          .from('speaking_sessions')
          .select(CLOSEOUT_COLUMNS)
          .eq('session_token', providedToken)
          .eq('user_id', user_id)
          .maybeSingle();
        if (rowError) {
          console.error('[speaking-session] end lookup failed:', JSON.stringify(rowError));
        } else if (row) {
          outcome = await closeOutSession(supabase, row, {
            durationSeconds: Number.isFinite(duration_seconds) ? duration_seconds : 0,
          });
        }
      } catch (err) {
        console.error('[speaking-session] Session end threw:', err.message);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          ...(outcome?.closed ? { status: outcome.status, user_turns: outcome.userTurns, released: outcome.released } : {}),
        }),
      };
    }

    // -----------------------------------------------------------------------
    // action 'start' — price, debit, create the session, speak first.
    // -----------------------------------------------------------------------
    const isPlacement = mode === 'placement';

    // Mission lookup (server-owned prompt fields + opening line).
    let mission = null;
    if (!isPlacement && missionId) {
      const { data: missionRow, error: missionError } = await supabase
        .from('speaking_missions')
        .select('*')
        .eq('id', missionId)
        .single();
      if (missionError || !missionRow) {
        console.error('[speaking-session] Mission not found:', missionId, missionError && JSON.stringify(missionError));
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Mission not found' }) };
      }
      mission = missionRow;
    }
    const isMission = !!mission;

    // A course Lektion's Sprechen task (validated, bounded client text). Only
    // when there is no mission and this is not the placement test — a mission's
    // server-owned prompt always wins.
    const courseTask = isPlacement ? null : parseCourseTask(body);

    const effectiveLevel = isPlacement ? 'placement' : (level || mission?.level);
    if (!effectiveLevel) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'level is required' }) };
    }

    // Reject unsupported levels before reserving a session or calling AI.
    const ALLOWED_LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'placement'];
    if (!ALLOWED_LEVELS.includes(effectiveLevel)) {
      console.warn(`[speaking-session] rejected unsupported level: ${effectiveLevel}`);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unsupported level' }) };
    }

    // Planned minutes: placement is a short quota-exempt test; practice sessions
    // must pick one of the allowed durations.
    let plannedMinutes;
    if (isPlacement) {
      plannedMinutes = ALLOWED_MINUTES.includes(Number(minutes)) ? Number(minutes) : 5;
    } else {
      plannedMinutes = Number(minutes);
      if (!ALLOWED_MINUTES.includes(plannedMinutes)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'minutes must be 5, 10 or 15' }) };
      }
    }

    // Settle the caller's own abandoned sessions first (tab closed, phone
    // locked): a stale session with zero learner turns gives its allowance
    // back BEFORE the allowance is checked below. Never blocks a start.
    try {
      await closeOutStaleSessions(supabase, { userId: user_id });
    } catch (err) {
      console.error('[speaking-session] stale close-out threw:', err.message);
    }

    const usage = await checkUsage(user_id);
    const costCents = isPlacement || (plannedMinutes === 5 && usage.allowed) ? 0 : PRICE_CENTS[plannedMinutes];
    const sessionToken = `sp_${randomUUID()}`;
    const reservation = await reserveSession(supabase, {
      user_id, session_token: sessionToken, level: effectiveLevel,
      mission_id: isMission ? missionId : null,
      mode: isPlacement ? 'placement' : (isMission ? 'mission' : 'free'),
      planned_minutes: plannedMinutes, cost_cents: costCents,
      ...courseTaskColumns(courseTask),
    }, usage.tier);
    if (!reservation.ok) {
      return {
        statusCode: reservation.code === 'insufficient_funds' ? 402 : 409, headers,
        body: JSON.stringify({ error: reservation.code === 'insufficient_funds' ? 'Nicht genügend Guthaben.' : 'Das Freikontingent hat sich geändert. Bitte erneut versuchen.', ...reservation }),
      };
    }
    const balanceCents = reservation.balance_cents;

    // The reservation exists before either provider can be called.
    let openingText;
    let openingAudio;
    try {
      if (isMission && mission.ai_opening_line) {
        openingText = mission.ai_opening_line;
      } else {
        const baseSystem = buildTeacherSystemPrompt({
          level: effectiveLevel,
          mission: isMission ? mission : null,
          isPlacement,
          courseTask,
        });
        let system = baseSystem;
        if (courseTask) {
          system = `${baseSystem}\n\nBEGINN: Begrüße dein Gegenüber kurz auf Deutsch, nenne die Aufgabe in eigenen Worten und stelle EINE erste Frage dazu. Nur die Begrüßung und die Frage.`;
        } else if (!isPlacement) {
          system = `${baseSystem}\n\nBEGINN: Begrüße den Schüler herzlich auf Deutsch und stelle EINE einfache, niveaugerechte Frage. Nur die Begrüßung und die Frage.`;
        }
        openingText = await teacherReply({ system, history: [], userText: '', maxTokens: 120 });
      }
      if (!openingText) openingText = 'Hallo! Schön, dass du da bist. Erzähl mir ein bisschen von dir.';
      openingAudio = await synthesizeSpeech({ text: openingText });
    } catch (aiErr) {
      // Transactional close-out keeps the reservation retryable if refunding
      // fails. The stale sweep will retry without losing the wallet debit.
      await closeOutSession(supabase, { session_token: sessionToken, user_id });
      if (aiErr instanceof AIError) {
        return { statusCode: aiErr.status || 502, headers, body: JSON.stringify({ error: aiErr.message, stage: aiErr.stage }) };
      }
      throw aiErr;
    }

    // -------- Persist the opening line so the record starts with the teacher. --
    try {
      const { error: msgError } = await supabase
        .from('speaking_messages')
        .insert({ session_token: sessionToken, user_id, role: 'assistant', content: openingText, level: effectiveLevel, created_at: new Date().toISOString() });
      if (msgError) console.error('[speaking-session] opening message insert failed:', JSON.stringify(msgError));
    } catch (err) {
      console.error('[speaking-session] opening message insert threw:', err.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        session_token: sessionToken,
        level: effectiveLevel,
        planned_minutes: plannedMinutes,
        cost_cents: costCents,
        ...(balanceCents !== undefined ? { balance_cents: balanceCents } : {}),
        replyText: openingText,
        replyAudioBase64: openingAudio,
      }),
    };
  } catch (error) {
    console.error('speaking-session error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
