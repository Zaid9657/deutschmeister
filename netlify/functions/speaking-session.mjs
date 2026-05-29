import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { checkUsage, incrementUsage } from './_shared/speakingUsage.mjs';

const VOICE_MAP = {
  'a1.1': 'Zephyr', 'a1.2': 'Zephyr',
  'a2.1': 'Zephyr', 'a2.2': 'Zephyr',
  'b1.1': 'Charon', 'b1.2': 'Charon',
  'b2.1': 'Charon', 'b2.2': 'Charon',
};

const GEMINI_MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';

function buildFieldMask(setup) {
  const paths = [];
  for (const key of Object.keys(setup)) {
    const val = setup[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length > 0) {
      for (const subKey of Object.keys(val)) {
        paths.push(`${key}.${subKey}`);
      }
    } else {
      paths.push(key);
    }
  }
  return paths.join(',');
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server nicht konfiguriert (fehlender API-Schlüssel)' }) };
  }

  if (!supabaseKey || !supabase) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    const { systemPrompt, level, user_id, voice: requestedVoice } = JSON.parse(event.body || '{}');

    if (!systemPrompt || !level) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'systemPrompt and level are required' }) };
    }

    if (user_id) {
      console.log('[speaking-session] Checking usage for user:', user_id);
      const usage = await checkUsage(user_id);
      console.log('[speaking-session] Usage check result:', JSON.stringify(usage));
      if (!usage.allowed) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'Speaking limit reached',
            ...usage,
          }),
        };
      }
    }

    const normalizedLevel = level.toLowerCase();
    const voice = requestedVoice || VOICE_MAP[normalizedLevel] || 'Zephyr';

    const now = new Date();
    const expireTime = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(now.getTime() + 60 * 1000).toISOString();

    const bidiSetup = {
      model: GEMINI_MODEL,
      generationConfig: {
        responseModalities: ['AUDIO'],
        temperature: 0.7,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          languageCode: 'de-DE',
        },
      },
      systemInstruction: { parts: [{ text: systemPrompt || '' }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };

    const fieldMask = buildFieldMask(bidiSetup);

    const tokenUrl = `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${encodeURIComponent(apiKey)}`;

    const tokenBody = {
      uses: 1,
      expireTime,
      newSessionExpireTime,
      bidiGenerateContentSetup: bidiSetup,
      fieldMask,
    };

    console.log('[speaking-session] Requesting Gemini ephemeral token, fieldMask:', fieldMask);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini auth_tokens error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Sprachsitzung konnte nicht erstellt werden', details: errorText }),
      };
    }

    const data = await response.json();
    const ephemeralToken = data.name;

    if (!ephemeralToken) {
      console.error('No token name in Gemini response:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Ungültige Token-Antwort vom Server' }),
      };
    }

    if (user_id) {
      try {
        await incrementUsage(user_id);
        console.log('[speaking-session] Usage incremented for user:', user_id);
      } catch (err) {
        console.error('[speaking-session] Failed to increment usage:', err.message);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ephemeral_token: ephemeralToken,
        model: GEMINI_MODEL,
        voice,
        language_code: 'de-DE',
        expires_at: expireTime,
      }),
    };
  } catch (error) {
    console.error('speaking-session error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
