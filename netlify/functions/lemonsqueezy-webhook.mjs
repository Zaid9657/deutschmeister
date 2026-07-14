import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase with service role key (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL || 'https://omqyueddktqeyrrqvnyq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
try {
  supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
} catch (e) {
  console.error('Failed to initialize Supabase client:', e.message);
}

// Verify webhook signature
function verifySignature(payload, signature, secret) {
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
}

// Helper: log to webhook_logs with error details.
// NOTE: If the webhook_logs table doesn't exist in Supabase, all logging fails silently.
async function logWebhookEvent(eventType, payload, processed, errorMsg) {
  if (!supabase) return;
  try {
    await supabase.from('webhook_logs').insert({
      event_type: eventType || 'unknown',
      payload: payload,
      processed: processed,
      error: errorMsg || null,
    });
  } catch (e) {
    console.error('Failed to write webhook_logs:', e.message, e.stack);
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
  if (!supabaseKey || !supabase) {
    console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!');
    await logWebhookEvent('config_error', { error: 'SUPABASE_SERVICE_ROLE_KEY is not set' }, false, 'Missing service role key');
    return { statusCode: 500, headers, body: 'Server misconfigured' };
  }

  try {
    // Verify signature
    const signature = event.headers['x-signature'];
    const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    // Signature verification is mandatory — without it, anyone can POST a
    // forged payload and grant themselves a subscription. A missing secret is
    // a deployment error, never a reason to skip verification.
    if (!webhookSecret) {
      console.error('CRITICAL: LEMONSQUEEZY_WEBHOOK_SECRET is not set — rejecting webhook');
      await logWebhookEvent('config_error', { error: 'LEMONSQUEEZY_WEBHOOK_SECRET is not set' }, false, 'Missing webhook secret');
      return { statusCode: 500, headers, body: 'Server misconfigured' };
    }
    if (!signature) {
      console.error('Missing webhook signature');
      return { statusCode: 401, headers, body: 'Missing signature' };
    }
    const isValid = verifySignature(event.body, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return { statusCode: 401, headers, body: 'Invalid signature' };
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
        case 'subscription_payment_success':
          await handleSubscriptionPaymentSuccess(data, payload.meta);
          break;
        case 'subscription_payment_failed':
          await handlePaymentFailed(data, payload.meta, payload);
          break;
        default:
          console.log('Unhandled event type:', eventType);
      }
    } catch (err) {
      handlerError = err;
      console.error('Handler error for', eventType, ':', err.message, err.stack);
    }

    // Log result
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

// Resolve the app user_id when custom_data.user_id is absent.
// Order of precedence:
//   1. custom_data.user_id (the happy path)
//   2. an existing subscriptions row matching lemonsqueezy_subscription_id
//   3. the payload's user_email matched against auth.users, then profiles
// Returns null only if every strategy fails.
async function resolveUserId(customData, attributes, lemonsqueezySubscriptionId) {
  if (customData?.user_id) return customData.user_id;

  // (a) existing subscription row for this LS subscription id
  if (lemonsqueezySubscriptionId) {
    const { data: existing, error } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('lemonsqueezy_subscription_id', String(lemonsqueezySubscriptionId))
      .maybeSingle();
    if (error) {
      console.error('resolveUserId: subscriptions lookup error:', JSON.stringify(error));
    } else if (existing?.user_id) {
      console.log('resolveUserId: matched by lemonsqueezy_subscription_id:', lemonsqueezySubscriptionId);
      return existing.user_id;
    }
  }

  // (b) email → auth.users, then profiles
  const email = attributes?.user_email;
  if (email) {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('resolveUserId: auth listUsers error:', JSON.stringify(authError));
    } else {
      const match = authUsers?.users?.find(
        (u) => (u.email || '').toLowerCase() === email.toLowerCase()
      );
      if (match) {
        console.log('resolveUserId: matched by user_email via auth.users:', email);
        return match.id;
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();
    if (profileError) {
      console.error('resolveUserId: profiles lookup error:', JSON.stringify(profileError));
    } else if (profile?.id) {
      console.log('resolveUserId: matched by user_email via profiles:', email);
      return profile.id;
    }
  }

  return null;
}

async function handleOrderCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const attributes = data?.attributes || {};
  const orderId = String(data?.id || '');
  const userId = customData.user_id;

  console.log('Order created for user:', userId, 'Order ID:', orderId);

  // total is integer cents; write the real amount to the matching subscription row.
  if (attributes.total != null && orderId) {
    const pricePaid = Number(attributes.total) / 100;
    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({ price_paid: pricePaid, updated_at: new Date().toISOString() })
      .eq('lemonsqueezy_order_id', orderId)
      .select('id');

    if (error) {
      console.error('order_created: price_paid update error:', JSON.stringify(error));
    } else if (!updated || updated.length === 0) {
      // The paired subscription_created may not have landed yet; not fatal.
      console.warn('order_created: no subscription row for order', orderId, '— price_paid deferred');
    } else {
      console.log('order_created: price_paid', pricePaid, 'set for order', orderId);
    }
  }
}

function getSubscriptionTier(_variantId) {
  return 'pro';
}

// subscription_payment_success: data is a subscription-invoice, so data.id is the
// invoice id — the subscription row is keyed by attributes.subscription_id.
// total is integer cents.
async function handleSubscriptionPaymentSuccess(data, meta) {
  const attributes = data?.attributes || {};
  const subscriptionId = String(attributes.subscription_id || '');

  console.log('subscription_payment_success — invoice:', data?.id, 'sub:', subscriptionId);

  if (attributes.total == null || !subscriptionId) {
    console.warn('subscription_payment_success: missing total or subscription_id — skipping price update');
    return;
  }

  const pricePaid = Number(attributes.total) / 100;
  const { data: updated, error } = await supabase
    .from('subscriptions')
    .update({ price_paid: pricePaid, updated_at: new Date().toISOString() })
    .eq('lemonsqueezy_subscription_id', subscriptionId)
    .select('id');

  if (error) {
    console.error('subscription_payment_success: price_paid update error:', JSON.stringify(error));
    throw new Error(`subscription_payment_success price update failed: ${error.message}`);
  }

  if (!updated || updated.length === 0) {
    console.warn('subscription_payment_success: no subscription row for', subscriptionId, '— price_paid not written');
  } else {
    console.log('subscription_payment_success: price_paid', pricePaid, 'set for sub', subscriptionId);
  }
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
  const variantId = String(attributes.variant_id || '');
  const tier = getSubscriptionTier(variantId);

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
      subscription_tier: tier,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    console.error('Supabase profiles upsert error:', JSON.stringify(profileError));
    throw new Error(`profiles upsert failed: ${profileError.message} (code: ${profileError.code}, details: ${profileError.details})`);
  }

  console.log('SUCCESS: Subscription created for user:', userId, 'Plan:', planType, 'Tier:', tier);
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
  // create the subscription if we can resolve a user. custom_data.user_id may be
  // absent, so fall back to matching on lemonsqueezy_subscription_id / user_email.
  if (!updated || updated.length === 0) {
    const resolvedUserId = await resolveUserId(customData, attributes, subscriptionId);
    console.warn('No subscription found for ID:', subscriptionId, '— attempting upsert with user_id:', resolvedUserId);

    if (resolvedUserId) {
      const variantName = attributes.variant_name || '';
      const planType = variantName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';
      const variantId = String(attributes.variant_id || '');
      const tier = getSubscriptionTier(variantId);

      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: resolvedUserId,
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

      // Also mark profile as subscribed with tier
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: resolvedUserId,
          is_subscribed: true,
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Fallback profile upsert error:', JSON.stringify(profileError));
        throw new Error(`profiles upsert failed: ${profileError.message} (code: ${profileError.code}, details: ${profileError.details})`);
      }

      console.log('Fallback upsert OK for user:', resolvedUserId, 'Tier:', tier);
    } else {
      console.error('subscription_updated: no matching row and could not resolve user by id, subscription_id, or email — cannot process');
      throw new Error(`subscription_updated: no subscription found for ID ${subscriptionId} and could not resolve user_id (no custom_data.user_id, no match on lemonsqueezy_subscription_id, no user_email match) — retry needed`);
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

  // Mark profile as unsubscribed and reset tier
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_subscribed: false, subscription_tier: 'free', updated_at: new Date().toISOString() })
    .eq('id', subscription.user_id);

  if (profileError) {
    console.error('Error updating profile on expiry:', JSON.stringify(profileError));
    throw new Error(`profile update on expiry failed: ${profileError.message} (code: ${profileError.code}, details: ${profileError.details})`);
  }

  console.log('Subscription expired:', subscriptionId, 'User:', subscription.user_id);
}

async function handlePaymentFailed(data, meta, payload) {
  const userId = meta?.custom_data?.user_id;
  const subscriptionId = data?.attributes?.subscription_id || data?.id;
  const eventId = data?.id;

  console.log(`Payment failed — user: ${userId} sub: ${subscriptionId}`);

  const { error } = await supabase.from('payment_failures').insert({
    user_id: userId,
    lemonsqueezy_subscription_id: String(subscriptionId),
    lemonsqueezy_event_id: String(eventId),
    raw_payload: payload
  });

  if (error) {
    console.error('Failed to log payment failure:', error);
  }
}
