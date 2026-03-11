import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
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
    const { user_id } = JSON.parse(event.body || '{}');

    if (!user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id required' }) };
    }

    console.log('verify-subscription called for user:', user_id);

    // Step 1: Check if user already has an active subscription
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSub) {
      console.log('User already has active subscription:', existingSub.id);
      // Ensure profile is also marked
      await supabase
        .from('profiles')
        .upsert({ id: user_id, is_subscribed: true, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'active', source: 'existing' }) };
    }

    // Step 2: Search webhook_logs for unprocessed subscription events for this user
    const { data: logs, error: logsError } = await supabase
      .from('webhook_logs')
      .select('id, event_type, payload')
      .in('event_type', ['subscription_created', 'subscription_updated'])
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('Error reading webhook_logs:', JSON.stringify(logsError));
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to read webhook logs' }) };
    }

    console.log('Found', logs?.length || 0, 'unprocessed webhook logs');

    // Step 3: Find logs matching this user_id
    let activated = false;

    for (const log of (logs || [])) {
      const payload = log.payload;
      const meta = payload?.meta || {};
      const data = payload?.data || {};
      const customData = meta.custom_data || {};
      const attributes = data.attributes || {};

      if (customData.user_id !== user_id) continue;

      console.log('Found matching webhook log:', log.id, 'event:', log.event_type);

      // Determine plan type
      const productName = attributes.product_name || attributes.variant_name || '';
      const planType = productName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

      // Calculate subscription end
      const subscriptionEnd = attributes.renews_at
        ? new Date(attributes.renews_at).toISOString()
        : new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

      // Upsert subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user_id,
          plan_type: planType,
          status: 'active',
          subscription_start: attributes.created_at || new Date().toISOString(),
          subscription_end: subscriptionEnd,
          lemonsqueezy_subscription_id: String(data.id || ''),
          lemonsqueezy_customer_id: String(attributes.customer_id || ''),
          lemonsqueezy_order_id: String(attributes.order_id || ''),
          lemonsqueezy_product_id: String(attributes.product_id || ''),
          lemonsqueezy_variant_id: String(attributes.variant_id || ''),
          price_paid: parseFloat(attributes.first_subscription_item?.price || 0) / 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Subscription upsert error:', JSON.stringify(subError));
        continue;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user_id,
          is_subscribed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error:', JSON.stringify(profileError));
        continue;
      }

      // Mark webhook log as processed
      await supabase
        .from('webhook_logs')
        .update({ processed: true, error: 'Recovered via verify-subscription' })
        .eq('id', log.id);

      activated = true;
      console.log('SUCCESS: Activated subscription for user:', user_id, 'plan:', planType);
      break;
    }

    if (activated) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'active', source: 'recovered' }) };
    }

    console.log('No matching unprocessed webhook found for user:', user_id);
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'not_found' }) };

  } catch (error) {
    console.error('verify-subscription error:', error.message, error.stack);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
