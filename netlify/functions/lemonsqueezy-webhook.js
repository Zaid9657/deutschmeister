const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
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
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get signature from headers
    const signature = event.headers['x-signature'];
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    // Verify signature
    if (webhookSecret && signature) {
      const isValid = verifySignature(event.body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
      }
    }

    // Parse payload
    const payload = JSON.parse(event.body);
    const eventType = payload.meta?.event_name;
    const data = payload.data;

    console.log('Webhook received:', eventType);

    // Log webhook for debugging
    await supabase.from('webhook_logs').insert({
      event_type: eventType || 'unknown',
      payload: payload,
      processed: false
    });

    // Handle different event types
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

    // Mark as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('payload->>data->>id', data?.id);

    return { statusCode: 200, body: 'OK' };

  } catch (error) {
    console.error('Webhook error:', error);

    // Log error
    await supabase.from('webhook_logs').insert({
      event_type: 'error',
      payload: { error: error.message, body: event.body },
      processed: false,
      error: error.message
    });

    return { statusCode: 500, body: 'Internal Server Error' };
  }
};

async function handleOrderCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const userId = customData.user_id;

  console.log('Order created for user:', userId);
  // Order created - subscription_created will follow for subscriptions
}

async function handleSubscriptionCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const userId = customData.user_id;
  const attributes = data?.attributes || {};

  if (!userId) {
    console.error('No user_id in custom data');
    return;
  }

  // Determine plan type from variant name
  const variantName = attributes.variant_name || '';
  const planType = variantName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

  // Calculate subscription end date
  const subscriptionEnd = attributes.renews_at
    ? new Date(attributes.renews_at)
    : new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

  // Create or update subscription
  const { error } = await supabase
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

  if (error) {
    console.error('Error creating subscription:', error);
    return;
  }

  // Update profile
  await supabase
    .from('profiles')
    .update({
      is_subscribed: true,
      trial_ends_at: null
    })
    .eq('id', userId);

  console.log('Subscription created for user:', userId, 'Plan:', planType);
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
  }

  console.log('Subscription updated:', subscriptionId);
}

async function handleSubscriptionCancelled(data, meta) {
  const subscriptionId = String(data.id);
  const attributes = data?.attributes || {};

  // Get the user_id from the subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .single();

  if (subscription) {
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
    }
  }

  console.log('Subscription cancelled:', subscriptionId);
}

async function handleSubscriptionExpired(data, meta) {
  const subscriptionId = String(data.id);

  // Get the user_id from the subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .single();

  if (subscription) {
    await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('lemonsqueezy_subscription_id', subscriptionId);

    // Update profile
    await supabase
      .from('profiles')
      .update({ is_subscribed: false })
      .eq('id', subscription.user_id);
  }

  console.log('Subscription expired:', subscriptionId);
}
