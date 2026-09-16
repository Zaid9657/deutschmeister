import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  GUIDED_MISSION_SECONDS,
  INSUFFICIENT_ALLOWANCE,
  deniedFromReserveError,
  resolveEntitlement,
  restoreMissionAttempt,
  clampUsedSeconds,
} from './_shared/speakingEntitlements.mjs';
import {
  AIError,
  buildTeacherSystemPrompt,
  courseTaskColumns,
  parseCourseTask,
  teacherReply,
  synthesizeSpeech,
} from './_shared/speakingAI.mjs';

// Speaking sessions charge SECONDS from the allowance ledger
// (migrations/2026-09-16-speaking-allowances.sql) — reserve on start,
// finalize actual usage on end, refund technical failures. The old model
// (cents wallet, per-day free sessions, monthly session counts) is gone:
// entitlement, price and duration are decided here and in Postgres, never in
// the browser. tests/speaking-session-contract.test.mjs pins all of this.
//
// Start:  { action: 'start', mode, level, missionId, durationSeconds, idempotencyKey }
// End:    { action: 'end', sessionToken, usedSeconds, outcome, idempotencyKey }
//   outcome: 'completed' | 'cancelled'  → finalize clamped elapsed usage
//            'failed'                   → refund the whole reservation
//
// Placement stays quota-exempt: it is the free speaking demo of the preview
// funnel and reserves nothing.

// Live sessions come in exactly these durations (seconds).
const LIVE_DURATIONS = [300, 600, 900];

const ALLOWED_LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2', 'placement'];
const END_OUTCOMES = ['completed', 'cancelled', 'failed'];

const bad = (headers, status, error, extra = {}) => ({
  statusCode: status,
  headers,
  body: JSON.stringify({ error, ...extra }),
});

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
    return bad(headers, 405, 'Method Not Allowed');
  }
  if (!supabaseKey || !supabase) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    return bad(headers, 500, 'Server misconfigured');
  }

  try {
    // Identity comes from the verified JWT — never from a client-supplied id.
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    const body = JSON.parse(event.body || '{}');
    const { action, level, missionId, mode, idempotencyKey } = body;

    // -----------------------------------------------------------------------
    // action 'end' — clamp reported usage to server truth and settle through
    // the ledger: finalize for completed/cancelled, refund for failed.
    // -----------------------------------------------------------------------
    if (action === 'end') {
      const sessionToken = body.sessionToken || body.session_token;
      const outcome = body.outcome || 'completed';
      if (!sessionToken) return bad(headers, 400, 'sessionToken is required to end a session');
      if (!idempotencyKey || typeof idempotencyKey !== 'string') return bad(headers, 400, 'idempotencyKey is required');
      if (!END_OUTCOMES.includes(outcome)) return bad(headers, 400, `outcome must be one of ${END_OUTCOMES.join(', ')}`);

      const { data: sessionRow } = await supabase
        .from('speaking_sessions')
        .select('user_id, started_at, mode, status')
        .eq('session_token', sessionToken)
        .maybeSingle();
      if (sessionRow && sessionRow.user_id !== user_id) {
        return bad(headers, 409, 'Session belongs to another user');
      }

      // Reserved seconds for the cap: sum of this session's reservations.
      const { data: reservations } = await supabase
        .from('speaking_session_reservations')
        .select('reserved_seconds')
        .eq('session_token', sessionToken)
        .eq('user_id', user_id);
      const reservedSeconds = (reservations || []).reduce((s, r) => s + r.reserved_seconds, 0);

      let settlement = null;
      if (reservedSeconds > 0) {
        if (outcome === 'failed') {
          const { data, error } = await supabase.rpc('refund_speaking_session', {
            p_user_id: user_id,
            p_session_token: sessionToken,
            p_idempotency_key: `end:${idempotencyKey}`,
          });
          if (error) {
            console.error('[speaking-session] refund RPC error:', JSON.stringify(error));
            return bad(headers, 500, 'Settlement failed');
          }
          settlement = data;
        } else {
          const used = clampUsedSeconds({
            usedSeconds: body.usedSeconds ?? body.duration_seconds,
            startedAt: sessionRow?.started_at,
            reservedSeconds,
          });
          const { data, error } = await supabase.rpc('finalize_speaking_session', {
            p_user_id: user_id,
            p_session_token: sessionToken,
            p_used_seconds: used,
            p_idempotency_key: `end:${idempotencyKey}`,
          });
          if (error) {
            console.error('[speaking-session] finalize RPC error:', JSON.stringify(error));
            return bad(headers, 500, 'Settlement failed');
          }
          settlement = data;
        }
      }

      // Close the session row (metrics only; the ledger is the money record).
      const userTurns = Number.isFinite(body.user_turns) ? body.user_turns : Number(body.userTurns) || 0;
      try {
        const { error: endError } = await supabase
          .from('speaking_sessions')
          .update({
            duration_seconds: settlement?.consumedSeconds ?? clampUsedSeconds({
              usedSeconds: body.usedSeconds ?? body.duration_seconds,
              startedAt: sessionRow?.started_at,
              reservedSeconds: Number.MAX_SAFE_INTEGER,
            }),
            user_turns: userTurns,
            completed_at: new Date().toISOString(),
            status: outcome === 'failed' ? 'failed' : 'completed',
          })
          .eq('session_token', sessionToken)
          .eq('user_id', user_id);
        if (endError) console.error('[speaking-session] Failed to log session end:', JSON.stringify(endError));
      } catch (err) {
        console.error('[speaking-session] Session end update threw:', err.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          consumedSeconds: settlement?.consumedSeconds ?? 0,
          refundedSeconds: settlement?.refundedSeconds ?? 0,
          balance: settlement?.balance ?? null,
        }),
      };
    }

    // -----------------------------------------------------------------------
    // action 'start' — resolve entitlement, reserve, create the session.
    // -----------------------------------------------------------------------
    const isPlacement = mode === 'placement';
    const isLive = mode === 'live';

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return bad(headers, 400, 'idempotencyKey is required');
    }

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
        return bad(headers, 404, 'Mission not found');
      }
      mission = missionRow;
    }
    const isMission = !!mission;

    // A course Lektion's Sprechen task (validated, bounded client text).
    const courseTask = isPlacement ? null : parseCourseTask(body);

    const effectiveLevel = isPlacement ? 'placement' : (level || mission?.level);
    if (!effectiveLevel) return bad(headers, 400, 'level is required');
    if (!ALLOWED_LEVELS.includes(effectiveLevel)) {
      console.warn(`[speaking-session] rejected unsupported level: ${effectiveLevel}`);
      return bad(headers, 400, 'Unsupported level');
    }

    // Duration: live picks one of the fixed durations; guided is capped
    // server-side; placement is a short, unreserved demo.
    let requestedSeconds = null;
    if (isLive) {
      requestedSeconds = Number(body.durationSeconds);
      if (!LIVE_DURATIONS.includes(requestedSeconds)) {
        return bad(headers, 400, 'durationSeconds must be 300, 600 or 900');
      }
    }

    // -------- Opening line + audio (before any charge — a provider failure
    //          here costs the learner nothing). --------
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
      if (aiErr instanceof AIError) {
        return bad(headers, aiErr.status || 502, aiErr.message, { stage: aiErr.stage });
      }
      throw aiErr;
    }

    // -------- Entitlement + reservation (skipped for placement). --------
    const sessionToken = randomUUID();
    let entitlement = { kind: 'placement' };
    let reservedSeconds = 0;
    let balance = null;
    let includedMissionAttempt = false;

    if (!isPlacement) {
      entitlement = await resolveEntitlement({
        supabase,
        userId: user_id,
        mode: isLive ? 'live' : 'guided',
        mission,
        requestedSeconds,
      });
      if (entitlement.kind === 'denied') {
        return bad(headers, 400, 'Invalid session request', { code: entitlement.code });
      }

      if (entitlement.kind === 'included-mission') {
        includedMissionAttempt = true;
        reservedSeconds = entitlement.maxSeconds;
      } else {
        const { data, error } = await supabase.rpc('reserve_speaking_seconds', {
          p_user_id: user_id,
          p_session_token: sessionToken,
          p_requested_seconds: entitlement.requestedSeconds,
          p_idempotency_key: `start:${idempotencyKey}`,
        });
        if (error) {
          const denied = deniedFromReserveError(error.message);
          if (denied?.code === INSUFFICIENT_ALLOWANCE) {
            return { statusCode: 402, headers, body: JSON.stringify({ error: 'Nicht genügend Sprechzeit.', code: denied.code }) };
          }
          if (denied?.code === 'DUPLICATE_SESSION') {
            return { statusCode: 409, headers, body: JSON.stringify({ error: 'Session token already in use', code: denied.code }) };
          }
          console.error('[speaking-session] reserve RPC error:', JSON.stringify(error));
          return bad(headers, 500, 'Reservierung fehlgeschlagen');
        }
        reservedSeconds = data?.reservedSeconds ?? entitlement.requestedSeconds;
        balance = data?.balance ?? null;
      }
    }

    // -------- Create the session row. --------
    const plannedSeconds = isPlacement ? GUIDED_MISSION_SECONDS : reservedSeconds;
    const { error: insertError } = await supabase
      .from('speaking_sessions')
      .insert({
        user_id,
        session_token: sessionToken,
        level: effectiveLevel,
        mission_id: isMission ? missionId : null,
        mode: isPlacement ? 'placement' : (isLive ? 'live' : (isMission ? 'mission' : 'free')),
        status: 'active',
        started_at: new Date().toISOString(),
        planned_minutes: Math.max(1, Math.round(plannedSeconds / 60)),
        ...courseTaskColumns(courseTask),
      });
    if (insertError) {
      console.error('[speaking-session] Session insert failed:', JSON.stringify(insertError));
      // Undo whatever the start consumed — the learner pays nothing for our
      // insert failure.
      if (includedMissionAttempt) {
        const restored = await restoreMissionAttempt({ supabase, userId: user_id, missionKey: entitlement.missionKey });
        if (!restored) console.error('[speaking-session] attempt restore after failed insert FAILED');
      } else if (reservedSeconds > 0) {
        const { error: refundError } = await supabase.rpc('refund_speaking_session', {
          p_user_id: user_id,
          p_session_token: sessionToken,
          p_idempotency_key: `start-insert-failed:${idempotencyKey}`,
        });
        if (refundError) console.error('[speaking-session] refund after failed insert FAILED:', JSON.stringify(refundError));
      }
      return bad(headers, 500, 'Sitzung konnte nicht erstellt werden');
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
        sessionToken,
        level: effectiveLevel,
        reservedSeconds,
        balance,
        includedMissionAttempt,
        replyText: openingText,
        replyAudioBase64: openingAudio,
      }),
    };
  } catch (error) {
    console.error('speaking-session error:', error.message, error.stack);
    return bad(headers, 500, 'Internal error');
  }
};
