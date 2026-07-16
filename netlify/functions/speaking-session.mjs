import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { checkUsage, incrementUsage } from './_shared/speakingUsage.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  AIError,
  buildTeacherSystemPrompt,
  teacherReply,
  synthesizeSpeech,
} from './_shared/speakingAI.mjs';

// Session pricing (cents). 10/15-min always cost; 5-min may be free (see below).
const PRICE_CENTS = { 5: 100, 10: 200, 15: 300 };
const ALLOWED_MINUTES = [5, 10, 15];
// Subscribers get this many free 5-min sessions per day.
const SUBSCRIBER_FREE_5MIN_PER_DAY = 2;

// --- subscription_end check (mirrors the frontend's single source of truth) ---
async function isActiveSubscriber(userId) {
  const { data } = await supabase
    .from('subscriptions')
    .select('subscription_end')
    .eq('user_id', userId)
    .order('subscription_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!data?.subscription_end) return false;
  const end = new Date(data.subscription_end);
  return !Number.isNaN(end.getTime()) && end > new Date();
}

// Count today's (UTC day) free 5-minute practice sessions for a subscriber.
async function freeFiveMinuteSessionsToday(userId) {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const { count, error } = await supabase
    .from('speaking_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('planned_minutes', 5)
    .eq('cost_cents', 0)
    .neq('mode', 'placement')
    .gte('started_at', dayStart);
  if (error) {
    console.error('[speaking-session] free-session count error:', JSON.stringify(error));
    return SUBSCRIBER_FREE_5MIN_PER_DAY; // fail closed → treat as no free session left
  }
  return count || 0;
}

// Read the current wallet balance (0 when the user has no wallet row yet).
async function walletBalance(userId) {
  const { data } = await supabase
    .from('speaking_wallet')
    .select('balance_cents')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.balance_cents ?? 0;
}

// Best-effort refund if the session couldn't be created after a debit.
async function creditWallet(userId, amount) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row } = await supabase
      .from('speaking_wallet')
      .select('balance_cents')
      .eq('user_id', userId)
      .maybeSingle();
    const balance = row?.balance_cents ?? 0;
    const { data: updated } = await supabase
      .from('speaking_wallet')
      .update({ balance_cents: balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('balance_cents', balance)
      .select('balance_cents')
      .maybeSingle();
    if (updated) return true;
  }
  return false;
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
    // Identity comes from the verified JWT — never from a client-supplied id.
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    const {
      action,
      level,
      minutes,
      missionId,
      mode,
      session_token: providedToken,
      duration_seconds,
      user_turns,
      status: endStatus,
    } = JSON.parse(event.body || '{}');

    // -----------------------------------------------------------------------
    // action 'end' — unchanged. The client reports final metrics; evaluation
    // still runs via evaluate-speaking.mjs.
    // -----------------------------------------------------------------------
    if (action === 'end') {
      if (!providedToken) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'session_token is required to end a session' }) };
      }
      try {
        const { error: endError } = await supabase
          .from('speaking_sessions')
          .update({
            duration_seconds: Number.isFinite(duration_seconds) ? duration_seconds : 0,
            user_turns: Number.isFinite(user_turns) ? user_turns : 0,
            completed_at: new Date().toISOString(),
            status: endStatus || 'completed',
          })
          .eq('session_token', providedToken)
          .eq('user_id', user_id);
        if (endError) {
          console.error('[speaking-session] Failed to log session end:', JSON.stringify(endError));
        }
      } catch (err) {
        console.error('[speaking-session] Session end update threw:', err.message);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
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

    const effectiveLevel = isPlacement ? 'placement' : (level || mission?.level);
    if (!effectiveLevel) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'level is required' }) };
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

    // -------- Pricing decision (skipped entirely for placement) --------
    let costCents = 0;
    let freeTrialConsumed = false; // non-subscriber free path → consume a trial session
    if (!isPlacement) {
      if (plannedMinutes === 5) {
        const subscriber = await isActiveSubscriber(user_id);
        if (subscriber) {
          const usedToday = await freeFiveMinuteSessionsToday(user_id);
          costCents = usedToday < SUBSCRIBER_FREE_5MIN_PER_DAY ? 0 : PRICE_CENTS[5];
        } else {
          // Non-subscriber: existing trial rules grant the free 5-min session.
          const usage = await checkUsage(user_id);
          if (usage.allowed) {
            costCents = 0;
            freeTrialConsumed = true;
          } else {
            costCents = PRICE_CENTS[5]; // wallet payment allowed for any signed-in user
          }
        }
      } else {
        costCents = PRICE_CENTS[plannedMinutes]; // 10 → 200, 15 → 300 always
      }
    }

    // -------- Opening line + audio (before charging — a provider failure here
    //          costs the user nothing). --------
    let openingText;
    let openingAudio;
    try {
      if (isMission && mission.ai_opening_line) {
        openingText = mission.ai_opening_line;
      } else {
        const baseSystem = buildTeacherSystemPrompt({ level: effectiveLevel, mission: isMission ? mission : null, isPlacement });
        const system = isPlacement
          ? baseSystem
          : `${baseSystem}\n\nBEGINN: Begrüße den Schüler herzlich auf Deutsch und stelle EINE einfache, niveaugerechte Frage. Nur die Begrüßung und die Frage.`;
        openingText = await teacherReply({ system, history: [], userText: '', maxTokens: 120 });
      }
      if (!openingText) openingText = 'Hallo! Schön, dass du da bist. Erzähl mir ein bisschen von dir.';
      openingAudio = await synthesizeSpeech({ text: openingText });
    } catch (aiErr) {
      if (aiErr instanceof AIError) {
        return { statusCode: aiErr.status || 502, headers, body: JSON.stringify({ error: aiErr.message, stage: aiErr.stage }) };
      }
      throw aiErr;
    }

    // -------- Charge the wallet if the session costs anything. --------
    // Atomic debit via Postgres RPC (service role): returns the new balance, or
    // -1 when the balance can't cover the cost.
    let balanceCents;
    if (costCents > 0) {
      const { data: newBalance, error: debitError } = await supabase
        .rpc('debit_speaking_wallet', { p_user_id: user_id, p_cost: costCents });
      if (debitError) {
        console.error('[speaking-session] wallet debit RPC error:', JSON.stringify(debitError));
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Guthaben konnte nicht belastet werden.' }) };
      }
      if (newBalance === -1) {
        return {
          statusCode: 402,
          headers,
          body: JSON.stringify({ error: 'Nicht genügend Guthaben.', code: 'insufficient_funds', balance_cents: await walletBalance(user_id), cost_cents: costCents }),
        };
      }
      balanceCents = newBalance;
    }

    // -------- Create the session row. --------
    const sessionToken = providedToken || `sp_${randomUUID()}`;
    const { error: insertError } = await supabase
      .from('speaking_sessions')
      .insert({
        user_id,
        session_token: sessionToken,
        level: effectiveLevel,
        mission_id: isMission ? missionId : null,
        mode: isPlacement ? 'placement' : (isMission ? 'mission' : 'free'),
        status: 'active',
        started_at: new Date().toISOString(),
        planned_minutes: plannedMinutes,
        cost_cents: costCents,
      });
    if (insertError) {
      console.error('[speaking-session] Session insert failed:', JSON.stringify(insertError));
      if (costCents > 0) {
        const refunded = await creditWallet(user_id, costCents);
        console.error('[speaking-session] refund after failed insert:', refunded ? 'ok' : 'FAILED');
      }
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Sitzung konnte nicht erstellt werden' }) };
    }

    // -------- Record the debit transaction (after the session exists). --------
    if (costCents > 0) {
      const { error: txError } = await supabase
        .from('speaking_wallet_transactions')
        .insert({
          user_id,
          amount_cents: -costCents,
          reason: `session_${plannedMinutes}min`,
          session_token: sessionToken,
        });
      if (txError) console.error('[speaking-session] wallet transaction insert failed:', JSON.stringify(txError));
    } else if (freeTrialConsumed) {
      // Non-subscriber free session counts against the trial allowance.
      try { await incrementUsage(user_id); } catch (err) { console.error('[speaking-session] incrementUsage failed:', err.message); }
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
