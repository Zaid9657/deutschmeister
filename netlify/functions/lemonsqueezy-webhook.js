const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase with service role key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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

// Helper: log to webhook_logs with error details
async function logWebhookEvent(eventType, payload, processed, errorMsg) {
  try {
    await supabase.from('webhook_logs').insert({
      event_type: eventType || 'unknown',
      payload: payload,
      processed: processed,
      error: errorMsg || null,
    });
  } catch (e) {
    console.error('Failed to write webhook_logs:', e.message);
  }
}

exports.handler = async (event) => {
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

  // Pre-flight check: is service role key configured?
  if (!supabaseKey) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!');
    await logWebhookEvent('config_error', { error: 'SUPABASE_SERVICE_ROLE_KEY is not set' }, false, 'Missing service role key');
    return { statusCode: 500, headers, body: 'Server misconfigured' };
  }

  try {
    // Verify signature
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
    } else {
      console.warn('WARNING: LEMONSQUEEZY_WEBHOOK_SECRET is not set — skipping signature verification');
    }

    // Parse payload
    const payload = JSON.parse(event.body);
    const eventType = payload.meta?.event_name;
    const data = payload.data;

    console.log('Webhook received:', eventType, 'Data ID:', data?.id);
    console.log('Meta:', JSON.stringify(payload.meta));

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
      console.error('Handler error for', eventType, ':', err.message, err.stack);
    }

    // Log result — always write a fresh row with the outcome
    await logWebhookEvent(eventType, payload, !handlerError, handlerError?.message);

    if (handlerError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: handlerError.message }) };
    }

    return { statusCode: 200, headers, body: 'OK' };

  } catch (error) {
    console.error('Webhook top-level error:', error.message, error.stack);
    await logWebhookEvent('error', { error: error.message, body: event.body?.substring(0, 5000) }, false, error.message);
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

  console.log('subscription_created — custom_data:', JSON.stringify(customData));
  console.log('subscription_created — attributes:', JSON.stringify(attributes));

  if (!userId) {
    console.error('No user_id in custom data. Full meta:', JSON.stringify(meta));
    throw new Error('No user_id in webhook custom_data. Keys present: ' + Object.keys(customData).join(', '));
  }

  // Determine plan type from variant name
  const variantName = attributes.variant_name || '';
  const planType = variantName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

  // Calculate subscription end date
  const subscriptionEnd = attributes.renews_at
    ? new Date(attributes.renews_at)
    : new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

  console.log('Upserting subscription for user:', userId, 'plan:', planType);

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
    console.error('Supabase subscriptions upsert error:', JSON.stringify(subError));
    throw new Error(`subscriptions upsert failed: ${subError.message} (code: ${subError.code}, details: ${subError.details})`);
  }

  console.log('Subscription upserted OK. Now updating profile...');

  // Update profile — use upsert so it works even if profile row doesn't exist yet
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      is_subscribed: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    console.error('Supabase profiles upsert error:', JSON.stringify(profileError));
    throw new Error(`profiles upsert failed: ${profileError.message} (code: ${profileError.code}, details: ${profileError.details})`);
  }

  console.log('SUCCESS: Subscription created for user:', userId, 'Plan:', planType);
}

async function handleSubscriptionUpdated(data, meta) {
  const attributes = data?.attributes || {};
  const subscriptionId = String(data.id);
  const customData = meta?.custom_data || {};
  const userId = customData.user_id;

  console.log('subscription_updated — subscriptionId:', subscriptionId, 'userId:', userId);

  const renewsAt = attributes.renews_at
    ? new Date(attributes.renews_at).toISOString()
    : null;

  // Try to update by lemonsqueezy_subscription_id first
  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({
      status: attributes.status || 'active',
      subscription_end: renewsAt,
      cancel_at_period_end: attributes.cancelled || false,
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .select('id');

  if (error) {
    console.error('Error updating subscription:', JSON.stringify(error));
    throw new Error(`subscription update failed: ${error.message}`);
  }

  // If no rows matched (subscription_updated arrived before subscription_created),
  // create the subscription if we have a user_id
  if (!updated || updated.length === 0) {
    console.warn('No subscription found for ID:', subscriptionId, '— attempting upsert with user_id:', userId);

    if (userId) {
      const variantName = attributes.variant_name || '';
      const planType = variantName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan_type: planType,
          status: attributes.status || 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: renewsAt,
          lemonsqueezy_subscription_id: subscriptionId,
          lemonsqueezy_customer_id: String(attributes.customer_id || ''),
          lemonsqueezy_order_id: String(attributes.order_id || ''),
          lemonsqueezy_product_id: String(attributes.product_id || ''),
          lemonsqueezy_variant_id: String(attributes.variant_id || ''),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Fallback upsert error:', JSON.stringify(upsertError));
        throw new Error(`subscription fallback upsert failed: ${upsertError.message}`);
      }

      // Also mark profile as subscribed
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          is_subscribed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      console.log('Fallback upsert OK for user:', userId);
    } else {
      console.warn('subscription_updated: no matching row and no user_id — skipping');
    }
  }

  console.log('Subscription updated:', subscriptionId);
}

async function handleSubscriptionCancelled(data, meta) {
  const subscriptionId = String(data.id);
  const attributes = data?.attributes || {};

  const { data: subscription, error: findError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .maybeSingle();

  if (findError) {
    console.error('Error finding subscription for cancellation:', JSON.stringify(findError));
    throw findError;
  }

  if (!subscription) {
    console.warn('Subscription not found for cancellation:', subscriptionId);
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
    console.error('Error cancelling subscription:', JSON.stringify(error));
    throw error;
  }

  console.log('Subscription cancelled:', subscriptionId);
}

async function handleSubscriptionExpired(data, meta) {
  const subscriptionId = String(data.id);

  const { data: subscription, error: findError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .maybeSingle();

  if (findError) {
    console.error('Error finding subscription for expiry:', JSON.stringify(findError));
    throw findError;
  }

  if (!subscription) {
    console.warn('Subscription not found for expiration:', subscriptionId);
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
    console.error('Error expiring subscription:', JSON.stringify(subError));
    throw subError;
  }

  // Mark profile as unsubscribed
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_subscribed: false, updated_at: new Date().toISOString() })
    .eq('id', subscription.user_id);

  if (profileError) {
    console.error('Error updating profile on expiry:', JSON.stringify(profileError));
  }

  console.log('Subscription expired:', subscriptionId, 'User:', subscription.user_id);
}
