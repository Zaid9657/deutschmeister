import { createHash } from 'node:crypto';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { reserveUsage } from './_shared/aiReservation.mjs';
import { isMissingSchema, logMigrationPending } from './_shared/migrationPending.mjs';
import { ruleCard, ruleCardText } from './_shared/ruleCards.mjs';

// "Explain this to me" / „Erklär mir das" (plan P5). One missed practice item
// in, one short explanation out — the button under the feedback in
// src/components/lesson/PracticeItem.jsx used to be a placeholder.
//
// THE ANSWER IS IN THE CHROME LANGUAGE (Wave 1, 2026-09-19). The client sends
// `lang` ('en' | 'de'); English is what a day-one learner can read, German is
// Deutsch-Modus. Both variants are the same teacher with the same rule card —
// only the language of the explanation changes, never its grounding. `lang` is
// validated here like every other field and defaults to German when absent or
// unknown, so an older client keeps getting what it always got.
//
// THE ANSWER IS GROUNDED, NOT INVENTED. The system prompt carries the course's
// own rule card for the item's topic (netlify/functions/_shared/ruleCards.mjs,
// generated from grammar-content-cache.json by scripts/build-lesson-pool.mjs in
// the same run that builds the item pool). A model left to explain German on its
// own would sooner or later contradict the Grammatikkarte the learner just read.
//
// Cost control is a per-user daily cap counted from the `lesson_attempts`
// ledger. The migration makes its check and insert atomic and prevents deletion.
const EXPLAIN_DAILY_LIMIT = 40;

// Haiku is the cheap tier and this is a 60-word answer; override without a
// deploy via EXPLAIN_MODEL.
const CLAUDE_MODEL = process.env.EXPLAIN_MODEL || 'claude-haiku-4-5';

const MAX_FIELD_CHARS = 300;

const SYSTEM_RULES = {
  de: 'Du bist eine freundliche DaF-Lehrkraft. Erkläre auf A1-Deutsch in höchstens 60 Wörtern, warum die richtige Antwort richtig ist; nenne die Regel kurz; keine Einleitung.',
  en: 'You are a friendly teacher of German as a foreign language. In plain English and at most 60 words, explain why the correct answer is correct; name the rule briefly, quoting the German forms as they are; no preamble. Stay within the course rule below — do not add rules it does not state.',
};
const RULE_CARD_HEADING = {
  de: 'Grundlage — die Regel dieses Kurses:',
  en: "Ground truth — this course's own rule card (German; explain it, do not contradict it):",
};
const LANGS = new Set(['en', 'de']);

const trim = (v) => (typeof v === 'string' ? v.trim().slice(0, MAX_FIELD_CHARS) : '');

// SHARED EXPLANATIONS (cross-check 2026-10-25, AI-22). Every learner who misses
// the same item with the same answer, in the same chrome language, gets the
// same grounded explanation — written once, then read from `explain_cache`
// instead of a model call and a reservation. The key is a hash of everything
// the model sees: the item, the model, the whole system prompt (so a rebuilt
// rule card is a new key) and the user turn (question, correct answer, the
// learner's answer exactly as typed — a capitalisation slip gets its own
// explanation — and level). Only grounded explanations are shared: without a
// rule card there is nothing that keeps a wrong one from spreading. The table
// and its insert-only store function are migrations/2026-10-25-explain-cache.sql;
// until the owner applies it every lookup and store fails open and the model
// answers as before.
function explainCacheKey(parts) {
  try {
    return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
  } catch (error) {
    console.error('[explain-answer] cache key failed:', error.message);
    return null; // no cache, never no explanation
  }
}

async function cachedExplanation(key) {
  try {
    const { data, error } = await supabase
      .from('explain_cache')
      .select('explanation')
      .eq('cache_key', key)
      .maybeSingle();
    if (error) {
      if (isMissingSchema(error)) logMigrationPending('explain_cache');
      else console.error('[explain-answer] cache read failed:', error.message);
      return null;
    }
    const text = data?.explanation?.text;
    return typeof text === 'string' && text.trim() ? text : null;
  } catch (error) {
    console.error('[explain-answer] cache read threw:', error.message);
    return null;
  }
}

async function storeExplanation(key, text) {
  try {
    const { error } = await supabase.rpc('store_explain_cache', {
      p_cache_key: key, p_explanation: { text, model: CLAUDE_MODEL },
    });
    if (error) {
      if (isMissingSchema(error)) logMigrationPending('store_explain_cache');
      else console.error('[explain-answer] cache store failed:', error.message);
    }
  } catch (error) {
    console.error('[explain-answer] cache store threw:', error.message);
  }
}

// A daily slot is spent only on an explanation that reaches the learner
// (cross-check review 2026-10-25). Every failure after the reservation — an
// upstream error, an empty answer, a dropped connection, any throw — releases
// exactly the ledger row it reserved (the RPC's id or the legacy insert's id),
// as X-Ray refunds in analyze-sentence.mjs, so the retry is not refused as
// "limit". The service role is not bound by the restrictive "Keep metered
// lesson attempts" policy, which only stops learners deleting these rows.
// supabase-js resolves rather than throws, so check `error` — and a release
// that itself throws must not replace the answer the learner gets.
async function releaseReservation({ id, userId }) {
  try {
    const { error } = await supabase
      .from('lesson_attempts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('stage', 'explain');
    if (error) console.error('[explain-answer] reservation release failed:', error.message);
  } catch (error) {
    console.error('[explain-answer] reservation release threw:', error.message);
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
    console.error('[explain-answer] SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }
  // Secrets fail closed (CLAUDE.md): no key, no explanation — never a canned
  // sentence that reads like a real one.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[explain-answer] ANTHROPIC_API_KEY is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Die Erklärung ist gerade nicht verfügbar.', stage: 'config' }),
    };
  }

  // The slot this request reserved, until its explanation is handed over:
  // every exit in between releases it, once.
  let slot = null;
  let delivered = false;
  const releaseSlot = async () => {
    const held = slot;
    slot = null;
    if (held && !delivered) await releaseReservation(held);
  };

  try {
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) return unauthorizedResponse(headers);

    const body = JSON.parse(event.body || '{}');
    const itemId = trim(body.itemId);
    const topic = trim(body.topic).toLowerCase();
    const questionDe = trim(body.questionDe);
    const expected = trim(body.expected);
    const userAnswer = trim(body.userAnswer);
    const level = (trim(body.level) || 'a1.1').toLowerCase();
    const lektionId = trim(body.lektionId);
    const lang = LANGS.has(body.lang) ? body.lang : 'de';

    if (!itemId || !questionDe || !expected) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'itemId, questionDe und expected sind erforderlich', stage: 'input' }),
      };
    }

    const card = ruleCardText(topic);
    if (!card) console.warn(`[explain-answer] no rule card for topic "${topic}"`);
    const system = [SYSTEM_RULES[lang], card && `${RULE_CARD_HEADING[lang]}\n${card}`]
      .filter(Boolean)
      .join('\n\n');

    const L = lang === 'en'
      ? { task: 'Task', expected: 'Correct answer', user: "Learner's answer", level: 'Level' }
      : { task: 'Aufgabe', expected: 'Richtige Antwort', user: 'Antwort der Lernenden', level: 'Niveau' };
    const userText = [
      `${L.task}: ${questionDe}`,
      `${L.expected}: ${expected}`,
      userAnswer ? `${L.user}: ${userAnswer}` : null,
      `${L.level}: ${level}`,
    ].filter(Boolean).join('\n');

    // Already written for this exact question, answer and language: shared,
    // so no model call and nothing reserved against the daily cap.
    const cacheKey = card ? explainCacheKey([itemId, CLAUDE_MODEL, system, userText]) : null;
    const shared = cacheKey ? await cachedExplanation(cacheKey) : null;
    if (shared) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ explanation: shared, lang, used: null, limit: EXPLAIN_DAILY_LIMIT, topic: ruleCard(topic) ? topic : null, cached: true }),
      };
    }

    // Daily cap — today's explanation rows for this user, from midnight UTC.
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const { count, error: countError } = await supabase
      .from('lesson_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('stage', 'explain')
      .gte('created_at', dayStart.toISOString());

    if (countError) {
      console.error('[explain-answer] usage count failed:', JSON.stringify(countError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Nutzung konnte nicht geprüft werden', stage: 'usage' }) };
    }
    let used = count || 0;
    if (used >= EXPLAIN_DAILY_LIMIT) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'limit', limit: EXPLAIN_DAILY_LIMIT, used }) };
    }

    try {
      const reservation = await reserveUsage(supabase, 'reserve_lesson_ai_usage', {
        p_user_id: user_id, p_stage: 'explain', p_limit: EXPLAIN_DAILY_LIMIT,
        p_level: level, p_lektion_id: lektionId, p_item_id: itemId,
        p_error_tag: 'Erklärung',
      }, async () => {
        const { data, error } = await supabase.from('lesson_attempts').insert({
          user_id,
          level,
          lektion_id: lektionId,
          item_id: itemId,
          stage: 'explain',
          correct: false,
          error_tag: 'Erklärung',
        }).select('id').single();
        if (error) throw new Error(error.message || 'Usage insert failed');
        return { allowed: true, id: data?.id, used };
      });
      used = reservation.used;
      if (!reservation.allowed) {
        return { statusCode: 429, headers, body: JSON.stringify({ error: 'limit', limit: EXPLAIN_DAILY_LIMIT, used }) };
      }
      slot = { id: reservation.id, userId: user_id };
    } catch (error) {
      console.error('[explain-answer] reservation failed:', error.message);
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Nutzung konnte nicht reserviert werden', stage: 'usage' }) };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: userText }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[explain-answer] Claude API error:', response.status, CLAUDE_MODEL, errorText);
      await releaseSlot();
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Die Erklärung konnte nicht erstellt werden.', stage: 'upstream', upstreamStatus: response.status }),
      };
    }

    const data = await response.json();
    const explanation = (data.content || [])
      .filter((b) => b?.type === 'text')
      .map((b) => b.text || '')
      .join('\n')
      .trim();

    if (!explanation) {
      console.error('[explain-answer] empty explanation from', CLAUDE_MODEL);
      await releaseSlot();
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Die Erklärung war leer.', stage: 'upstream' }) };
    }

    if (cacheKey) await storeExplanation(cacheKey, explanation);

    const answer = JSON.stringify({ explanation, lang, used: used + 1, limit: EXPLAIN_DAILY_LIMIT, topic: ruleCard(topic) ? topic : null });
    delivered = true;
    return { statusCode: 200, headers, body: answer };
  } catch (error) {
    console.error('explain-answer error:', error.message, error.stack);
    await releaseSlot();
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unerwarteter Serverfehler', stage: 'server' }) };
  }
};
