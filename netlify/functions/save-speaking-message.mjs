import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
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
    // Identity comes from the verified JWT, never from the request body.
    const authUserId = await getAuthenticatedUserId(event);
    if (!authUserId) {
      return unauthorizedResponse(headers);
    }

    const { session_token, role, content, level } = JSON.parse(event.body || '{}');

    if (!session_token || !role || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'session_token, role, and content are required' }),
      };
    }

    if (!['user', 'assistant'].includes(role) || typeof content !== 'string' || content.length > 5000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid message payload' }) };
    }

    const { data, error } = await supabase
      .from('speaking_messages')
      .insert({
        session_token,
        user_id: authUserId,
        role,
        content,
        level: level || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving speaking message:', JSON.stringify(error));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to save message', details: error.message }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (error) {
    console.error('save-speaking-message error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
