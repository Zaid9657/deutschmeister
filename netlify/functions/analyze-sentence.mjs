import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { getAuthenticatedUserId } from './_shared/auth.mjs';

// Salt for the per-IP rate-limit key. Reuses an existing secret so no new env
// var is required; if none is configured the IP ceiling is skipped (the
// identity requirement below still applies).
const IP_HASH_SALT = process.env.IP_HASH_SALT || process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET || '';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

// Tiers: anonymous | free_expired | free_trial | pro
const DAILY_LIMITS = {
  anonymous:    1,
  free_expired: 1,
  free_trial:   10,
  pro:          50,
};

const SYSTEM_PROMPT = `You are a German grammar analyzer. Given a German sentence, break it down into its grammatical components.

For each meaningful unit (words that belong together like "dem Kind", "die Mutter"):
- Identify its grammatical role (subject, direct_object, indirect_object, verb, adverb, adjective, preposition_phrase, conjunction, particle, or other)
- Identify its case if applicable (nominative, accusative, dative, genitive, or null)
- Provide a brief English translation
- Explain WHY it has that role/case in 1-2 sentences
- Suggest a relevant grammar topic slug from this list: [nominative-case, accusative-case, dative-case, genitive-case, word-order, articles, verb-conjugation, prepositions-accusative, prepositions-dative, two-way-prepositions, modal-verbs, separable-verbs, negation, adjective-endings]

Also provide:
- One key insight about the sentence (something interesting about word order, emphasis, or grammar)
- A natural English translation of the full sentence

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON.

JSON format:
{
  "words": [
    {
      "text": "string — the word or phrase",
      "role": "string — grammatical role",
      "case": "string or null",
      "translation": "string — English translation of this unit",
      "explanation": "string — why this role/case",
      "grammarTopic": "string — slug from the list above"
    }
  ],
  "insight": {
    "title": "string — short title for the insight",
    "explanation": "string — 2-3 sentence explanation"
  },
  "fullTranslation": "string — natural English translation of the whole sentence"
}`;

// Returns { tier, limit } for a user_id.
async function getUserTier(userId) {
  if (!supabase || !userId) return { tier: 'anonymous', limit: DAILY_LIMITS.anonymous };

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, is_subscribed, trial_ends_at')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return { tier: 'free_expired', limit: DAILY_LIMITS.free_expired };

  if (profile.subscription_tier === 'pro' || profile.is_subscribed) {
    return { tier: 'pro', limit: DAILY_LIMITS.pro };
  }

  // Distinguish active trial from expired trial
  const trialActive = profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
  const tier = trialActive ? 'free_trial' : 'free_expired';
  return { tier, limit: DAILY_LIMITS[tier] };
}

// Returns how many times this user/anon has analyzed today (UTC day).
// Callers must pass an identity: a verified user id, or an anonymous key. An
// absent key used to return 0, which made the gate unreachable — omitting
// anonymousId turned this into an unauthenticated, unmetered Claude endpoint.
async function countTodayUsage(userId, anonymousId) {
  if (!supabase) return 0;

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  let query = supabase
    .from('xray_usage')
    .select('id', { count: 'exact', head: true })
    .gte('used_at', startOfDay.toISOString());

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonymousId) {
    query = query.eq('anonymous_id', anonymousId).is('user_id', null);
  } else {
    // No identity at all — treat as over quota rather than under it.
    return Number.MAX_SAFE_INTEGER;
  }

  const { count } = await query;
  return count ?? 0;
}

// Per-IP ceiling, independent of the client-supplied anonymous id (which the
// caller can regenerate at will). Anonymous traffic from one address cannot
// exceed this many analyses per UTC day regardless of how many ids it invents.
const ANON_IP_DAILY_CEILING = 12;

function clientIp(event) {
  const raw =
    event.headers?.['x-nf-client-connection-ip'] ||
    event.headers?.['client-ip'] ||
    (event.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return raw || null;
}

// The IP is hashed before storage so the usage table never holds a raw address.
function hashIp(ip) {
  return 'ip_' + createHash('sha256').update(`${ip}|${IP_HASH_SALT}`).digest('hex').slice(0, 32);
}

async function countTodayUsageByIp(ipKey) {
  if (!supabase || !ipKey) return 0;
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('xray_usage')
    .select('id', { count: 'exact', head: true })
    .gte('used_at', startOfDay.toISOString())
    .is('user_id', null)
    .eq('ip_hash', ipKey);
  return count ?? 0;
}

async function recordUsage(userId, anonymousId, sentence, ipKey) {
  if (!supabase) return;
  await supabase.from('xray_usage').insert({
    user_id:      userId || null,
    anonymous_id: userId ? null : (anonymousId || null),
    ip_hash:      userId ? null : (ipKey || null),
    sentence:     sentence?.slice(0, 500) || null,
  });
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    const { sentence, anonymousId } = JSON.parse(event.body || '{}');

    // Tier is derived from the verified JWT when present; without a valid
    // token the caller is anonymous (1/day) — a body-supplied userId is
    // never trusted, since anyone could claim another user's pro quota.
    const userId = await getAuthenticatedUserId(event);

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sentence is required' }) };
    }
    if (sentence.trim().length > 500) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sentence too long (max 500 characters)' }) };
    }

    // --- Identity gate ---
    // Anonymous callers must supply an anonymousId. Without one there is nothing
    // to meter against, and the daily limit below can never trigger.
    if (!userId && (typeof anonymousId !== 'string' || anonymousId.trim().length < 8)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'anonymousId is required for anonymous requests' }),
      };
    }

    // --- Usage gate ---
    const { tier, limit } = await getUserTier(userId || null);
    const usedToday = await countTodayUsage(userId || null, anonymousId || null);

    // Per-IP ceiling for anonymous traffic — the anonymousId is client-generated
    // and can be regenerated, so it cannot be the only thing standing between an
    // attacker and an unmetered paid model.
    const ipKey = !userId && IP_HASH_SALT ? hashIp(clientIp(event) || 'unknown') : null;
    if (ipKey) {
      const ipUsedToday = await countTodayUsageByIp(ipKey);
      if (ipUsedToday >= ANON_IP_DAILY_CEILING) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: 'limit_reached', tier, limit, usedToday: ipUsedToday, remaining: 0 }),
        };
      }
    }

    if (limit !== Infinity && usedToday >= limit) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'limit_reached',
          tier,
          limit,
          usedToday,
          remaining: 0,
        }),
      };
    }

    // --- Record usage before calling Claude (counts even on API error) ---
    await recordUsage(userId || null, anonymousId || null, sentence.trim(), ipKey);

    // --- Call Claude ---
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Analyze this German sentence: "${sentence.trim()}"` },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to analyze sentence' }) };
    }

    const claudeData = await claudeResponse.json();
    const responseText = claudeData.content?.[0]?.text || '';

    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse Claude response:', responseText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to parse analysis response' }) };
    }

    const remaining = limit === Infinity ? null : Math.max(0, limit - usedToday - 1);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...analysis, usage: { tier, limit: limit === Infinity ? null : limit, usedToday: usedToday + 1, remaining } }),
    };
  } catch (error) {
    console.error('analyze-sentence error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
