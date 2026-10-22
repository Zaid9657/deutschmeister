import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUserId, unauthorizedResponse } from './_shared/auth.mjs';
import { reconcileSubscriptionEvent, reconcileUserEntitlement } from './_shared/subscriptionEntitlement.mjs';

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
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  if (!supabaseKey || !supabase) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    // Identity comes from the verified JWT — this endpoint reads subscription
    // state and can activate recovered subscriptions, so it must never act on
    // a client-supplied user_id.
    const user_id = await getAuthenticatedUserId(event);
    if (!user_id) {
      return unauthorizedResponse(headers);
    }

    console.log('verify-subscription called for user:', user_id);

    const existing = await reconcileUserEntitlement(supabase, user_id);
    if (existing.isSubscribed) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'active', source: 'existing' }) };
    }

    // Search the latest subscription snapshot for THIS user. A processed
    // terminal snapshot must also block recovery of older failed deliveries.
    // The user filter has to be in the query, not applied afterwards: this used
    // to take the 10 newest unprocessed events globally and then discard the ones
    // belonging to other customers, so a paying user's recovery silently failed
    // whenever 10+ other events sat ahead of theirs — precisely the backlog
    // condition this recovery path exists for.
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('id, event_type, payload, processed')
      .in('event_type', ['subscription_created', 'subscription_updated', 'subscription_cancelled', 'subscription_expired'])
      .filter('payload->meta->custom_data->>user_id', 'eq', user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (logsError) {
      console.error('Error reading webhook_logs:', JSON.stringify(logsError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to read webhook logs' }) };
    }

    console.log('Found', logs?.length || 0, 'subscription snapshots');

    // Recover only the newest snapshot. Replaying an older active snapshot
    // after a terminal event would undo that event; delivery order is not a
    // paid period. Normal webhooks and recovery use the same status rules.
    const log = (logs || []).find((row) => !row.processed && row.payload?.meta?.custom_data?.user_id === user_id);
    if (log) {
      const recovered = await reconcileSubscriptionEvent(supabase, user_id, log.payload.data, log.event_type);
      const { error } = await supabase.from('webhook_logs')
        .update({ processed: true, error: 'Recovered via verify-subscription' }).eq('id', log.id);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({
        status: recovered.isSubscribed ? 'active' : 'not_found', source: 'recovered',
      }) };
    }

    console.log('No matching unprocessed webhook found for user:', user_id);
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'not_found' }) };

  } catch (error) {
    console.error('verify-subscription error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
