import { supabase, supabaseKey } from './_shared/supabase.mjs';
import { checkUsage, incrementUsage } from './_shared/speakingUsage.mjs';

const VOICE_MAP = {
  'a1.1': 'coral', 'a1.2': 'coral',
  'a2.1': 'shimmer', 'a2.2': 'shimmer',
  'b1.1': 'echo', 'b1.2': 'echo',
  'b2.1': 'alloy', 'b2.2': 'alloy',
};

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
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

    // Check usage limits if user_id is provided
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
    // Use requested voice if provided, otherwise look up from level map
    const voice = requestedVoice || VOICE_MAP[normalizedLevel] || 'coral';

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
          instructions: systemPrompt,
          modalities: ['audio', 'text'],
          max_response_output_tokens: 300,
          input_audio_transcription: { model: 'whisper-1' },
          audio: {
            input: {
              turn_detection: {
                type: 'semantic_vad',
                eagerness: 'low',
                create_response: true,
                interrupt_response: true,
              },
            },
            output: {
              voice,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime API error:', response.status, errorText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to create realtime session', details: errorText }),
      };
    }

    const data = await response.json();
    console.log('[speaking-session] GA client_secrets response shape:', JSON.stringify(data));

    // Increment usage after successful session creation
    if (user_id) {
      try {
        await incrementUsage(user_id);
        console.log('[speaking-session] Usage incremented for user:', user_id);
      } catch (err) {
        console.error('[speaking-session] Failed to increment usage:', err.message);
      }
    }

    // GA response: { value: "ek_...", expires_at: ... } at top level
    // Fall back to legacy nested shape just in case
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        client_secret: data.value || data.client_secret?.value || data.client_secret,
        expires_at: data.expires_at || data.client_secret?.expires_at,
      }),
    };
  } catch (error) {
    console.error('speaking-session error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
