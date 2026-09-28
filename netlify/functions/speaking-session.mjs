import { randomUUID } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { checkUsage, incrementUsage } from './_shared/speakingUsage.mjs';
import {
  CLOSEOUT_COLUMNS,
  closeOutSession,
  closeOutStaleSessions,
  creditWallet,
  usageIdForToken,
} from './_shared/speakingCloseout.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import {
  AIError,
  buildTeacherSystemPrompt,
  courseTaskColumns,
  parseCourseTask,
  teacherReply,
  synthesizeSpeech,
  parseV2CourseTaskKey,
  loadV2SpeakingTask,
  v2TaskColumns,
  buildCoursePartnerPrompt,
  partnerMaxTokens,
  speakingProfileIds,
} from './_shared/speakingAI.mjs';
import { dbLevel } from './_shared/rubrics/keys.mjs';
import { rubricProfile } from './_shared/rubrics/data.mjs';
import { unknownRuleIds } from './_shared/rubrics/rules.mjs';
import { checkCourseAi, recordCourseAi, aiUseKindFor } from './_shared/rubrics/courseAi.mjs';
import { SCORE_LABEL_DE } from './_shared/rubrics/defaults.mjs';

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
// A 'cancelled' session ended with zero learner turns and costs nothing
// (_shared/speakingCloseout.mjs), so it does not use up a free session.
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
    .neq('status', 'cancelled')
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


// ---------------------------------------------------------------------------
// COURSE v2 session start (BLUEPRINT §1.5, §4.4). The task is the server-owned
// SpeakingTask behind the bank key; the gate is the purchase-aware course AI
// allowance, not the wallet or the trial (a v2 task costs no wallet cents). The
// session row carries only the key, so speaking-turn and evaluate-speaking
// reload the same task. Planned minutes are 10 or 15 — never 5, so a course
// session is never counted as a subscriber's free 5-minute practice session.
// ---------------------------------------------------------------------------
const V2_ALLOWED_MINUTES = [10, 15];

async function startCourseV2Session({ user_id, key, parsed, minutes, headers }) {
  const loaded = loadV2SpeakingTask(key);
  if (!loaded) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'unknown task' }) };
  }
  const { level, task } = loaded;

  // Refuse up front when the task could not be graded afterwards — no allowance
  // is spent on a session whose evaluation would fail. A multi-Teil round is graded
  // part by part, so every part's profile must resolve.
  for (const profileId of speakingProfileIds(task)) {
    const profile = rubricProfile(profileId);
    if (!profile || profile.kind !== 'speaking' || unknownRuleIds(profile).length) {
      console.error('[speaking-session v2] rubric profile unavailable:', profileId, key);
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'rubric_unavailable', profile: profileId || null }) };
    }
  }

  const gate = await checkCourseAi(supabase, user_id, key, level);
  if (!gate.allowed) {
    return {
      statusCode: gate.status || 429,
      headers,
      body: JSON.stringify({ error: gate.error || 'limit_reached', reason: gate.reason || null, remaining: gate.remaining ?? 0, scope: 'course-v2', courseTaskKey: key }),
    };
  }

  const plannedMinutes = V2_ALLOWED_MINUTES.includes(Number(minutes)) ? Number(minutes) : 10;
  const sessionLevel = dbLevel(level);

  // The authored opening line is spoken verbatim; only a task without one asks the model.
  let openingText = task.openingLine;
  let openingAudio;
  try {
    if (!openingText) {
      openingText = await teacherReply({
        system: `${buildCoursePartnerPrompt({ level: sessionLevel, task })}\n\nBEGINN: Eröffne die Übung mit einem kurzen Satz in deiner Rolle.`,
        history: [],
        userText: '',
        maxTokens: partnerMaxTokens(level),
      });
    }
    if (!openingText) openingText = 'Guten Tag! Wir beginnen.';
    openingAudio = await synthesizeSpeech({ text: openingText });
  } catch (aiErr) {
    if (aiErr instanceof AIError) {
      return { statusCode: aiErr.status || 502, headers, body: JSON.stringify({ error: aiErr.message, stage: aiErr.stage }) };
    }
    throw aiErr;
  }

  // Always minted here, as for practice sessions (see the create step below).
  const sessionToken = `sp_${randomUUID()}`;
  const { error: insertError } = await supabase
    .from('speaking_sessions')
    .insert({
      user_id,
      session_token: sessionToken,
      level: sessionLevel,
      mission_id: null,
      mode: 'free',
      status: 'active',
      started_at: new Date().toISOString(),
      planned_minutes: plannedMinutes,
      cost_cents: 0,
      ...v2TaskColumns(key, task),
    });
  if (insertError) {
    console.error('[speaking-session v2] Session insert failed:', JSON.stringify(insertError));
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Sitzung konnte nicht erstellt werden' }) };
  }

  // One attempt = one session: recorded once the session exists.
  await recordCourseAi(supabase, user_id, key, aiUseKindFor(parsed));

  try {
    const { error: msgError } = await supabase
      .from('speaking_messages')
      .insert({ session_token: sessionToken, user_id, role: 'assistant', content: openingText, level: sessionLevel, created_at: new Date().toISOString() });
    if (msgError) console.error('[speaking-session v2] opening message insert failed:', JSON.stringify(msgError));
  } catch (err) {
    console.error('[speaking-session v2] opening message insert threw:', err.message);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      session_token: sessionToken,
      level: sessionLevel,
      planned_minutes: plannedMinutes,
      cost_cents: 0,
      replyText: openingText,
      replyAudioBase64: openingAudio,
      courseTaskKey: key,
      taskMode: task.mode,
      prepMinutes: task.prepMinutes,
      scoreLabelDe: SCORE_LABEL_DE,
      remaining: Number.isFinite(gate.remaining) ? Math.max(0, gate.remaining - 1) : null,
    }),
  };
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
        } else if (row && row.status === 'active') {
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

    // COURSE v2: `{ courseTaskKey }` selects a server-owned SpeakingTask from the
    // compiled bank. A malformed key is refused — never a silent free chat.
    const v2Request = isPlacement ? null : parseV2CourseTaskKey(body);
    if (v2Request?.error) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: v2Request.error }) };
    }
    if (v2Request) {
      return await startCourseV2Session({ user_id, key: v2Request.key, parsed: v2Request.parsed, minutes, headers });
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

    // Validate the level up front. The teacher reply and the TTS render below
    // both cost money and happen before the session row is written, so a level
    // the speaking_sessions check constraint would reject must be caught here —
    // otherwise every such attempt pays for an AI call and then 500s. ('placement'
    // was exactly this bug until it was added to the constraint.)
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
    // Always minted here: the uuid inside the token is also the id of the
    // trial's speaking_usage row (usageIdForToken), which is how a zero-turn
    // close-out releases exactly that row — so the client never chooses it.
    const sessionToken = `sp_${randomUUID()}`;
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
        // Course task → the two unused nullable columns (no schema change).
        ...courseTaskColumns(courseTask),
      });
    if (insertError) {
      console.error('[speaking-session] Session insert failed:', JSON.stringify(insertError));
      if (costCents > 0) {
        const refunded = await creditWallet(supabase, user_id, costCents);
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
      // Non-subscriber free session counts against the trial allowance —
      // reserved under the session's own id, released if no turn arrives.
      try { await incrementUsage(user_id, { id: usageIdForToken(sessionToken) }); } catch (err) { console.error('[speaking-session] incrementUsage failed:', err.message); }
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
