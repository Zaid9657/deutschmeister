const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Verify webhook signature
const verifySignature = (payload, signature, secret) => {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature || '', 'utf8'),
      Buffer.from(digest, 'utf8')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

exports.handler = async (event) => {
  // CORS headers for preflight
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // Verify signature — reject if invalid
    const signature = event.headers['x-signature'];
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        console.error('Missing webhook signature');
        return { statusCode: 401, headers, body: 'Missing signature' };
      }
      const isValid = verifySignature(event.body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return { statusCode: 401, headers, body: 'Invalid signature' };
      }
    }

    // Parse payload
    const payload = JSON.parse(event.body);
    const eventType = payload.meta?.event_name;
    const data = payload.data;

    console.log('Webhook received:', eventType, 'Data ID:', data?.id);

    // Log webhook event
    const { data: logEntry, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: eventType || 'unknown',
        payload: payload,
        processed: false
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    const logId = logEntry?.id;

    // Handle event types
    let handlerError = null;
    try {
      switch (eventType) {
        case 'order_created':
          await handleOrderCreated(data, payload.meta);
          break;
        case 'subscription_created':
          await handleSubscriptionCreated(data, payload.meta);
          break;
        case 'subscription_updated':
          await handleSubscriptionUpdated(data, payload.meta);
          break;
        case 'subscription_cancelled':
          await handleSubscriptionCancelled(data, payload.meta);
          break;
        case 'subscription_expired':
          await handleSubscriptionExpired(data, payload.meta);
          break;
        default:
          console.log('Unhandled event type:', eventType);
      }
    } catch (err) {
      handlerError = err;
      console.error('Handler error for', eventType, ':', err.message);
    }

    // Mark log entry as processed (using the log ID, not bad JSON path)
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({
          processed: !handlerError,
          error: handlerError?.message || null
        })
        .eq('id', logId);
    }

    if (handlerError) {
      return { statusCode: 500, headers, body: 'Handler error' };
    }

    return { statusCode: 200, headers, body: 'OK' };

  } catch (error) {
    console.error('Webhook error:', error);

    // Log error
    try {
      await supabase.from('webhook_logs').insert({
        event_type: 'error',
        payload: { error: error.message, body: event.body?.substring(0, 5000) },
        processed: false,
        error: error.message
      });
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }

    return { statusCode: 500, headers, body: 'Internal Server Error' };
  }
};

async function handleOrderCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const userId = customData.user_id;
  console.log('Order created for user:', userId, 'Order ID:', data?.id);
}

async function handleSubscriptionCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const userId = customData.user_id;
  const attributes = data?.attributes || {};

  if (!userId) {
    console.error('No user_id in custom data. Meta:', JSON.stringify(meta));
    throw new Error('No user_id in webhook custom_data');
  }

  console.log('Processing subscription_created for user:', userId);

  // Determine plan type from variant name
  const variantName = attributes.variant_name || '';
  const planType = variantName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

  // Calculate subscription end date
  const subscriptionEnd = attributes.renews_at
    ? new Date(attributes.renews_at)
    : new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

  // Create or update subscription (upsert on user_id unique constraint)
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_type: planType,
      status: 'active',
      subscription_start: new Date().toISOString(),
      subscription_end: subscriptionEnd.toISOString(),
      lemonsqueezy_subscription_id: String(data.id),
      lemonsqueezy_customer_id: String(attributes.customer_id || ''),
      lemonsqueezy_order_id: String(attributes.order_id || ''),
      lemonsqueezy_product_id: String(attributes.product_id || ''),
      lemonsqueezy_variant_id: String(attributes.variant_id || ''),
      price_paid: parseFloat(attributes.first_subscription_item?.price || 0) / 100,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (subError) {
    console.error('Error creating subscription:', subError);
    throw subError;
  }

  // Update profile — mark as subscribed and clear trial
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_subscribed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    throw profileError;
  }

  console.log('Subscription created successfully for user:', userId, 'Plan:', planType);
}

async function handleSubscriptionUpdated(data, meta) {
  const attributes = data?.attributes || {};
  const subscriptionId = String(data.id);

  const renewsAt = attributes.renews_at
    ? new Date(attributes.renews_at).toISOString()
    : null;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: attributes.status || 'active',
      subscription_end: renewsAt,
      cancel_at_period_end: attributes.cancelled || false,
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log('Subscription updated:', subscriptionId);
}

async function handleSubscriptionCancelled(data, meta) {
  const subscriptionId = String(data.id);
  const attributes = data?.attributes || {};

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found for cancellation:', subscriptionId);
    return;
  }

  const endsAt = attributes.ends_at
    ? new Date(attributes.ends_at).toISOString()
    : null;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
      subscription_end: endsAt,
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', subscriptionId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  console.log('Subscription cancelled:', subscriptionId);
}

async function handleSubscriptionExpired(data, meta) {
  const subscriptionId = String(data.id);

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .single();

  if (!subscription) {
    console.error('Subscription not found for expiration:', subscriptionId);
    return;
  }

  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', subscriptionId);

  if (subError) {
    console.error('Error expiring subscription:', subError);
    throw subError;
  }

  // Mark profile as unsubscribed
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_subscribed: false })
    .eq('id', subscription.user_id);

  if (profileError) {
    console.error('Error updating profile on expiry:', profileError);
  }

  console.log('Subscription expired:', subscriptionId, 'User:', subscription.user_id);
}
