import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { getAuthenticatedUserId } from './_shared/auth.mjs';
import { uaClass, cleanSource } from './_shared/xraySource.mjs';
import { reserveUsage, validAnonymousId } from './_shared/aiReservation.mjs';
import { isMissingSchema, logMigrationPending } from './_shared/migrationPending.mjs';

// Salt for the per-IP rate-limit key. Reuses an existing secret so no new env
// var is required; if none is configured the IP ceiling is skipped (the
// identity requirement below still applies).
const IP_HASH_SALT = process.env.IP_HASH_SALT || process.env.UNSUB_SECRET || process.env.CAMPAIGN_SECRET || '';

// Model for the analysis. The previous id was deprecated (retirement TBD);
// this is the current-generation equivalent at the same price tier, so the
// migration removes the deprecation risk without changing unit economics.
// Override with XRAY_MODEL to try a different tier without a deploy.
const CLAUDE_MODEL = process.env.XRAY_MODEL || 'claude-sonnet-5';

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

async function reserveLegacyUsage(args) {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const today = () => supabase.from('xray_usage')
    .select('id', { count: 'exact', head: true }).gte('used_at', dayStart.toISOString());
  const checkedCount = async (query) => {
    const { count, error } = await query;
    if (error || !Number.isSafeInteger(count) || count < 0) {
      throw new Error(error?.message || 'Usage count failed');
    }
    return count;
  };
  const used = await checkedCount(args.p_user_id
    ? today().eq('user_id', args.p_user_id)
    : today().is('user_id', null).eq('anonymous_id', args.p_anonymous_id));
  if (!args.p_user_id && args.p_ip_hash) {
    const ipUsed = await checkedCount(today().is('user_id', null).eq('ip_hash', args.p_ip_hash));
    if (ipUsed >= args.p_ip_limit) return { allowed: false, used: ipUsed };
  }
  if (used >= args.p_limit) return { allowed: false, used };

  const row = {
    user_id: args.p_user_id,
    anonymous_id: args.p_anonymous_id,
    sentence: args.p_sentence,
    ip_hash: args.p_ip_hash,
  };
  let { data, error } = await supabase.from('xray_usage')
    .insert({ ...row, source: args.p_source }).select('id').single();
  if (isMissingSchema(error)) {
    logMigrationPending('xray_usage.source');
    ({ data, error } = await supabase.from('xray_usage').insert(row).select('id').single());
  }
  if (error || !data?.id) throw new Error(error?.message || 'Usage insert failed');
  return { allowed: true, used, id: data.id };
}

// An outage is not the visitor's fault. The free tier gets ONE analysis a day,
// so charging it for a 5xx would lock them out of the product's main hook until
// tomorrow. supabase-js resolves rather than throws, so check `error` — and a
// refund that itself throws must not turn into an unhandled failure.
async function refundUsage(usageId) {
  if (!supabase || !usageId) return;
  try {
    const { error } = await supabase.from('xray_usage').delete().eq('id', usageId);
    if (error) console.error('xray_usage refund failed:', error.message);
  } catch (error) {
    console.error('xray_usage refund threw:', error.message);
  }
}

// What the results screen can render: a list of word objects, each with its
// text (SentenceXRay maps result.words). Valid JSON of any other shape is a
// failed analysis — refunded, never a 200 that crashes the page.
function validAnalysis(analysis) {
  return !!analysis && typeof analysis === 'object' && Array.isArray(analysis.words)
    && analysis.words.every((w) => !!w && typeof w === 'object' && !Array.isArray(w) && typeof w.text === 'string');
}

// SHARED ANALYSES OF FIXED SENTENCES (cross-check 2026-10-25, AI-21). Most
// X-Ray traffic is the ~900 grammar-example links (/analyze/?s=…, comment in
// the handler below): the same sentences analysed again and again, each a
// Sonnet call with thinking that takes many seconds. A validated analysis of a
// sentence that arrived from one of those links or from the page's own
// examples (`entry` 'link' | 'example' — never a learner's typed sentence) is
// kept under a hash of the normalised sentence, the model and the prompt, and
// later requests for that sentence are answered from it, instantly. Metering is
// unchanged: the visit still reserves its analysis first. The table and its
// insert-only store function come from migrations/2026-10-25-xray-cache.sql;
// until the owner applies it, lookups and stores fail open (the model answers).
const CACHED_ENTRIES = new Set(['link', 'example']);

function xrayCacheKey(sentence) {
  try {
    const normalised = sentence.trim().replace(/\s+/g, ' ').normalize('NFC');
    const prompt = createHash('sha256').update(SYSTEM_PROMPT).digest('hex');
    return createHash('sha256').update(`${normalised}|${CLAUDE_MODEL}|${prompt}`).digest('hex');
  } catch (error) {
    console.error('xray cache key failed:', error.message);
    return null; // no cache, never no analysis
  }
}

async function cachedAnalysis(key) {
  try {
    const { data, error } = await supabase
      .from('xray_cache')
      .select('analysis')
      .eq('sentence_hash', key)
      .maybeSingle();
    if (error) {
      if (isMissingSchema(error)) logMigrationPending('xray_cache');
      else console.error('xray cache read failed:', error.message);
      return null;
    }
    return validAnalysis(data?.analysis) ? data.analysis : null;
  } catch (error) {
    console.error('xray cache read threw:', error.message);
    return null;
  }
}

async function storeAnalysis(key, analysis) {
  if (!analysis.words.length) return; // nothing worth sharing
  try {
    const { error } = await supabase.rpc('store_xray_cache', {
      p_sentence_hash: key, p_model: CLAUDE_MODEL, p_analysis: analysis,
    });
    if (error) {
      if (isMissingSchema(error)) logMigrationPending('store_xray_cache');
      else console.error('xray cache store failed:', error.message);
    }
  } catch (error) {
    console.error('xray cache store threw:', error.message);
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

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  // Set once a usage row is reserved; `delivered` only as the 200 leaves. Every
  // exit in between gives the analysis back (cross-check 2026-10-25, AI-19): a
  // rejected connection, an unreadable or unusable answer, or any throw — not
  // only an upstream status — so a retry is never "limit reached" until midnight.
  let usageId = null;
  let delivered = false;
  try {
    const { sentence, anonymousId, source: rawSource } = JSON.parse(event.body || '{}');

    // Tier is derived from the verified JWT when present; without a valid
    // token the caller is anonymous (1/day) — a body-supplied userId is
    // never trusted, since anyone could claim another user's pro quota.
    const userId = await getAuthenticatedUserId(event);

    // Coarse, PII-free provenance: the SPA-reported source (re-validated) and
    // a one-word class of the user agent. Logged per analysis and stored on
    // the usage row, so a spike can be attributed rather than guessed at.
    const ua = uaClass(event.headers?.['user-agent']);
    const source = { ...(cleanSource(rawSource) || {}), ua };

    // --- Crawler gate ---
    // From 2026-09-14 a JS-rendering crawler walked the ~900 grammar-example
    // links to /analyze/?s=… and every render was a paid anonymous analysis
    // with a fresh id (98% of anonymous X-Ray volume, measured 2026-09-27).
    // A self-declared crawler never gets the model; the SPA does not
    // auto-run for one either (src/lib/xray.js).
    if (!userId && ua === 'crawler') {
      console.log('[xray] crawler refused', JSON.stringify(source));
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Automated requests cannot use Sentence X-Ray.', code: 'crawler' }),
      };
    }

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'sentence is required' }) };
    }
    if (sentence.trim().length > 500) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Sentence too long (max 500 characters)' }) };
    }

    // --- Identity gate ---
    // Anonymous callers must supply an anonymousId. Without one there is nothing
    // to meter against, and the daily limit below can never trigger.
    if (!userId && !validAnonymousId(anonymousId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'anonymousId is required for anonymous requests' }),
      };
    }

    // --- Usage gate ---
    const { tier, limit } = await getUserTier(userId || null);
    const ipKey = !userId && IP_HASH_SALT ? hashIp(clientIp(event) || 'unknown') : null;
    let reservation;
    try {
      const args = {
        p_user_id: userId || null,
        p_anonymous_id: userId ? null : anonymousId,
        p_sentence: sentence.trim(),
        p_ip_hash: ipKey,
        p_source: source,
        p_limit: limit,
        p_ip_limit: ANON_IP_DAILY_CEILING,
      };
      reservation = await reserveUsage(supabase, 'reserve_xray_usage', args, () => reserveLegacyUsage(args));
    } catch (error) {
      console.error('xray reservation failed:', error.message);
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Usage could not be reserved', code: 'usage_unavailable' }) };
    }
    const usedToday = reservation.used;
    if (!reservation.allowed) {
      return {
        statusCode: 429, headers,
        body: JSON.stringify({ error: 'limit_reached', tier, limit, usedToday, remaining: 0 }),
      };
    }
    usageId = reservation.id;

    console.log('[xray] analysis', JSON.stringify({ tier, ...source }));

    const remaining = limit === Infinity ? null : Math.max(0, limit - usedToday - 1);
    const usage = { tier, limit: limit === Infinity ? null : limit, usedToday: usedToday + 1, remaining };

    // --- Shared analysis of a fixed sentence (AI-21) ---
    const cacheKey = CACHED_ENTRIES.has(source.entry) ? xrayCacheKey(sentence) : null;
    const cached = cacheKey ? await cachedAnalysis(cacheKey) : null;
    if (cached) {
      delivered = true;
      return { statusCode: 200, headers, body: JSON.stringify({ ...cached, usage }) };
    }

    // --- Call Claude ---
    let claudeResponse;
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          // Thinking is on by default on this model, and thinking tokens count
          // against max_tokens — the old 1024 ceiling would truncate mid-answer.
          max_tokens: 16000,
          // Low effort: this is a bounded structured-extraction task, not a
          // reasoning problem. Lowering effort is the documented way to keep cost
          // and latency down; disabling thinking outright is not (it can leak
          // reasoning tags into the visible response).
          output_config: { effort: 'low' },
          system: SYSTEM_PROMPT,
          messages: [
            { role: 'user', content: `Analyze this German sentence: "${sentence.trim()}"` },
          ],
        }),
      });
    } catch (error) {
      // No answer at all (DNS, reset, timeout): ours, like any upstream failure.
      console.error('Claude API unreachable:', CLAUDE_MODEL, error.message);
      await refundUsage(usageId);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to analyze sentence', code: 'upstream_unreachable' }),
      };
    }

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      const upstream = claudeResponse.status;
      console.error('Claude API error:', upstream, CLAUDE_MODEL, errorText);

      await refundUsage(usageId);

      // Collapsing every upstream failure into one opaque 502 is what made this
      // outage undiagnosable from the outside. The cause stays server-side; the
      // response carries just enough to tell the classes apart.
      let code = 'upstream_error';
      if (upstream === 429) code = 'upstream_rate_limited';
      else if (upstream === 401 || upstream === 403) code = 'upstream_auth';
      else if (upstream === 404) code = 'upstream_model_unavailable';
      else if (upstream === 400 && /credit balance/i.test(errorText)) code = 'upstream_credit';
      else if (upstream === 400) code = 'upstream_bad_request';

      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to analyze sentence', code, upstreamStatus: upstream }),
      };
    }

    let responseText = '';
    let analysis;
    try {
      // An unreadable body (cut-off stream, not JSON) is a failed analysis too.
      const claudeData = await claudeResponse.json();
      // With thinking enabled the first content block is a thinking block, not
      // text — indexing [0] would silently yield '' and fail every parse.
      responseText = (claudeData?.content || [])
        .filter((b) => b?.type === 'text')
        .map((b) => b.text || '')
        .join('\n')
        .trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      analysis = JSON.parse(jsonMatch[0]);
      // Valid JSON is not yet an analysis (AI-20): `{"error":"…"}` or a word
      // list of strings would come back as a "result" that crashes the page.
      if (!validAnalysis(analysis)) throw new Error('Analysis has no usable word list');
    } catch (error) {
      console.error('Failed to parse Claude response:', error.message, responseText);
      await refundUsage(usageId);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to parse analysis response' }) };
    }

    if (cacheKey) await storeAnalysis(cacheKey, analysis);

    delivered = true;
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...analysis, usage }),
    };
  } catch (error) {
    console.error('analyze-sentence error:', error.message, error.stack);
    if (usageId && !delivered) await refundUsage(usageId);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
