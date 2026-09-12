import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { ruleCard, ruleCardText } from './_shared/ruleCards.mjs';

// "Erklär mir das" (plan P5). One missed practice item in, one short German
// explanation out — the button under the feedback in
// src/components/lesson/PracticeItem.jsx used to be a placeholder.
//
// THE ANSWER IS GROUNDED, NOT INVENTED. The system prompt carries the course's
// own rule card for the item's topic (netlify/functions/_shared/ruleCards.mjs,
// generated from grammar-content-cache.json by scripts/build-lesson-pool.mjs in
// the same run that builds the item pool). A model left to explain German on its
// own would sooner or later contradict the Grammatikkarte the learner just read.
//
// Cost control is a per-user daily cap counted from the `lesson_attempts`
// ledger the row is written to — one table, one truth, like score-readaloud.mjs.
const EXPLAIN_DAILY_LIMIT = 40;

// Haiku is the cheap tier and this is a 60-word answer; override without a
// deploy via EXPLAIN_MODEL.
const CLAUDE_MODEL = process.env.EXPLAIN_MODEL || 'claude-haiku-4-5';

const MAX_FIELD_CHARS = 300;

const SYSTEM_RULES = 'Du bist eine freundliche DaF-Lehrkraft. Erkläre auf A1-Deutsch in höchstens 60 Wörtern, warum die richtige Antwort richtig ist; nenne die Regel kurz; keine Einleitung.';

const trim = (v) => (typeof v === 'string' ? v.trim().slice(0, MAX_FIELD_CHARS) : '');

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

    if (!itemId || !questionDe || !expected) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'itemId, questionDe und expected sind erforderlich', stage: 'input' }),
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
    const used = count || 0;
    if (used >= EXPLAIN_DAILY_LIMIT) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'limit', limit: EXPLAIN_DAILY_LIMIT, used }) };
    }

    // One row per call: the ledger the cap above is derived from, written BEFORE
    // the model call so concurrent requests stay metered. `correct` is NOT NULL
    // in the schema, so an explanation is logged as false with its own tag —
    // 'Erklärung' is not one of the ERROR_TAGS a wrong answer uses, so the error
    // report can tell the two apart.
    const { error: insertError } = await supabase.from('lesson_attempts').insert({
      user_id,
      level,
      lektion_id: lektionId,
      item_id: itemId,
      stage: 'explain',
      correct: false,
      error_tag: 'Erklärung',
    });
    if (insertError) console.error('[explain-answer] attempt insert failed:', JSON.stringify(insertError));

    const card = ruleCardText(topic);
    if (!card) console.warn(`[explain-answer] no rule card for topic "${topic}"`);
    const system = [SYSTEM_RULES, card && `Grundlage — die Regel dieses Kurses:\n${card}`]
      .filter(Boolean)
      .join('\n\n');

    const userText = [
      `Aufgabe: ${questionDe}`,
      `Richtige Antwort: ${expected}`,
      userAnswer ? `Antwort der Lernenden: ${userAnswer}` : null,
      `Niveau: ${level}`,
    ].filter(Boolean).join('\n');

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
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Die Erklärung war leer.', stage: 'upstream' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ explanation, used: used + 1, limit: EXPLAIN_DAILY_LIMIT, topic: ruleCard(topic) ? topic : null }),
    };
  } catch (error) {
    console.error('explain-answer error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unerwarteter Serverfehler', stage: 'server' }) };
  }
};
