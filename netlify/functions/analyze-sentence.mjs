import { createClient } from '@supabase/supabase-js';

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
    return 0;
  }

  const { count } = await query;
  return count ?? 0;
}

async function recordUsage(userId, anonymousId, sentence) {
  if (!supabase) return;
  await supabase.from('xray_usage').insert({
    user_id:      userId || null,
    anonymous_id: userId ? null : (anonymousId || null),
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
    const { sentence, userId, anonymousId } = JSON.parse(event.body || '{}');

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sentence is required' }) };
    }
    if (sentence.trim().length > 500) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sentence too long (max 500 characters)' }) };
    }

    // --- Usage gate ---
    const { tier, limit } = await getUserTier(userId || null);
    const usedToday = await countTodayUsage(userId || null, anonymousId || null);

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
    await recordUsage(userId || null, anonymousId || null, sentence.trim());

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
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
