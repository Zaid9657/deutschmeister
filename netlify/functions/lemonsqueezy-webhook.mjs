import { corsHeaders, guardMethod } from './_shared/http.mjs';
import { supabase, supabaseKey } from './_shared/supabase.mjs';
import crypto from 'crypto';

// Initialize Supabase with service role key (bypasses RLS)

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
  const headers = corsHeaders(event, { allowHeaders: 'Content-Type, X-Signature' });

  const gate = guardMethod(event, headers);
  if (gate) return gate;

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
        case 'order_refunded':
          await handleOrderRefunded(data, payload.meta);
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

// One-time products, keyed by Lemon Squeezy variant id. Env-configured so a
// missing variable simply means "no course routing" — subscription orders are
// untouched either way. proDays is the included Pro window ("3 Monate
// Pro-Zugang inklusive"); the course area itself never expires.
function courseForVariant(variantId) {
  const map = {};
  if (process.env.LEMONSQUEEZY_TELC_B1_VARIANT_ID) {
    map[String(process.env.LEMONSQUEEZY_TELC_B1_VARIANT_ID)] = {
      productKey: 'telc_b1_komplett',
      proDays: 90,
    };
  }
  return variantId ? map[String(variantId)] || null : null;
}

async function handleOrderCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const attributes = data?.attributes || {};
  const orderId = String(data?.id || '');
  const userId = customData.user_id;

  console.log('Order created for user:', userId, 'Order ID:', orderId);

  // One-time course order? Route it to the purchases path and stop — there is
  // no subscription row to backfill for a one-time product.
  const orderVariantId = String(attributes.first_order_item?.variant_id || '');
  const course = courseForVariant(orderVariantId);
  if (course) {
    await handleCourseOrder({ course, orderId, customData, attributes });
    return;
  }

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

// Course purchase: record the entitlement, then grant the included Pro window
// unless a real subscription already covers the user. Idempotent on the LS
// order id, so webhook retries can never double-grant.
async function handleCourseOrder({ course, orderId, customData, attributes }) {
  const userId = await resolveUserId(customData, attributes, null);
  if (!userId) {
    // A paying customer we cannot attach is a loud failure, not a warning:
    // throwing 500s the webhook so Lemon Squeezy retries (the buyer may be
    // mid-signup) and the failure lands in webhook_logs for follow-up.
    throw new Error(
      `course order ${orderId} (${course.productKey}) has no resolvable user — email: ${attributes?.user_email || 'none'}`
    );
  }

  const now = new Date();
  const pricePaid = attributes.total != null ? Number(attributes.total) / 100 : null;

  // Does a live subscription already cover the Pro window?
  const { data: existingSub, error: subLookupError } = await supabase
    .from('subscriptions')
    .select('plan_type, subscription_end')
    .eq('user_id', userId)
    .maybeSingle();
  if (subLookupError) {
    console.error('course order: subscription lookup error:', JSON.stringify(subLookupError));
    throw new Error(`course order subscription lookup failed: ${subLookupError.message}`);
  }
  const hasLiveRealSub =
    existingSub &&
    existingSub.plan_type !== 'course' &&
    existingSub.subscription_end &&
    new Date(existingSub.subscription_end) > now;

  const accessUntil = hasLiveRealSub
    ? null // course content is lifetime; Pro is already covered by the real sub
    : new Date(now.getTime() + course.proDays * 24 * 60 * 60 * 1000).toISOString();

  const { error: purchaseError } = await supabase
    .from('purchases')
    .upsert(
      {
        user_id: userId,
        product_key: course.productKey,
        lemonsqueezy_order_id: orderId,
        price_paid: pricePaid,
        status: 'active',
        access_until: accessUntil,
        updated_at: now.toISOString(),
      },
      { onConflict: 'lemonsqueezy_order_id' }
    );
  if (purchaseError) {
    console.error('course order: purchases upsert error:', JSON.stringify(purchaseError));
    throw new Error(`purchases upsert failed: ${purchaseError.message} (code: ${purchaseError.code})`);
  }

  if (!hasLiveRealSub) {
    // Included Pro window: the user's one subscriptions row becomes a 'course'
    // row. A later real subscription_created upserts over it (real sub wins);
    // expiry of course rows is swept by the daily trial-lifecycle run.
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan_type: 'course',
          status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: accessUntil,
          lemonsqueezy_order_id: orderId,
          lemonsqueezy_customer_id: String(attributes.customer_id || ''),
          lemonsqueezy_product_id: String(attributes.first_order_item?.product_id || ''),
          lemonsqueezy_variant_id: String(attributes.first_order_item?.variant_id || ''),
          price_paid: pricePaid,
          updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (subError) {
      console.error('course order: subscriptions upsert error:', JSON.stringify(subError));
      throw new Error(`course subscriptions upsert failed: ${subError.message} (code: ${subError.code})`);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, is_subscribed: true, subscription_tier: 'pro', updated_at: now.toISOString() },
        { onConflict: 'id' }
      );
    if (profileError) {
      console.error('course order: profiles upsert error:', JSON.stringify(profileError));
      throw new Error(`course profiles upsert failed: ${profileError.message} (code: ${profileError.code})`);
    }
  }

  console.log(
    'SUCCESS: course purchase recorded:', course.productKey, 'user:', userId,
    'order:', orderId, 'included Pro until:', accessUntil || 'n/a (real sub live)'
  );
}

// order_refunded: revoke the purchase, and the included Pro window with it if
// that is where the user's access came from. A refund of a subscription order
// is not handled here — Lemon Squeezy follows those with subscription_* events.
async function handleOrderRefunded(data, _meta) {
  const orderId = String(data?.id || '');
  if (!orderId) return;

  const { data: purchase, error: findError } = await supabase
    .from('purchases')
    .select('user_id, product_key')
    .eq('lemonsqueezy_order_id', orderId)
    .maybeSingle();
  if (findError) {
    console.error('order_refunded: purchases lookup error:', JSON.stringify(findError));
    throw findError;
  }
  if (!purchase) {
    console.log('order_refunded: no purchases row for order', orderId, '— not a course order, ignoring');
    return;
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('purchases')
    .update({ status: 'refunded', access_until: nowIso, updated_at: nowIso })
    .eq('lemonsqueezy_order_id', orderId);
  if (updateError) {
    console.error('order_refunded: purchases update error:', JSON.stringify(updateError));
    throw updateError;
  }

  // Revoke the included Pro window only if it came from THIS order — a real
  // subscription row (different plan_type or order id) is left alone.
  const { data: courseSub, error: subFindError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', purchase.user_id)
    .eq('plan_type', 'course')
    .eq('lemonsqueezy_order_id', orderId)
    .maybeSingle();
  if (subFindError) {
    console.error('order_refunded: subscriptions lookup error:', JSON.stringify(subFindError));
    throw subFindError;
  }
  if (courseSub) {
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({ status: 'expired', subscription_end: nowIso, updated_at: nowIso })
      .eq('id', courseSub.id);
    if (subError) {
      console.error('order_refunded: subscriptions update error:', JSON.stringify(subError));
      throw subError;
    }
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_subscribed: false, subscription_tier: 'free', updated_at: nowIso })
      .eq('id', purchase.user_id);
    if (profileError) {
      console.error('order_refunded: profile update error:', JSON.stringify(profileError));
      throw profileError;
    }
  }

  console.log('order_refunded: purchase', orderId, `(${purchase.product_key})`, 'revoked for user', purchase.user_id);
}

function getSubscriptionTier(_variantId) {
  return 'pro';
}

// subscription_payment_success: data is a subscription-invoice, so data.id is the
// invoice id — the subscription row is keyed by attributes.subscription_id.
// total is integer cents.
async function handleSubscriptionPaymentSuccess(data, _meta) {
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

  // Entitlement follows status. Only the subscription_expired handler used to
  // clear profiles.is_subscribed, so an account that went past_due/unpaid — or
  // whose status moved to expired via this event rather than its own — kept full
  // Pro access indefinitely. 'cancelled' deliberately keeps access: the customer
  // has paid through the end of the period and expiry revokes it later.
  const revokedStatuses = ['expired', 'unpaid', 'past_due'];
  if (updated && updated.length > 0 && revokedStatuses.includes(attributes.status)) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('lemonsqueezy_subscription_id', subscriptionId)
      .maybeSingle();
    if (sub?.user_id) {
      const { error: revokeError } = await supabase
        .from('profiles')
        .update({ is_subscribed: false, subscription_tier: 'free', updated_at: new Date().toISOString() })
        .eq('id', sub.user_id);
      if (revokeError) {
        console.error('subscription_updated: failed to revoke entitlement:', JSON.stringify(revokeError));
      } else {
        console.log(`subscription_updated: entitlement revoked for ${sub.user_id} (status ${attributes.status})`);
      }
    }
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

async function handleSubscriptionCancelled(data, _meta) {
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

async function handleSubscriptionExpired(data, _meta) {
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

// subscription_payment_failed: data is a subscription-invoice.
// attributes.user_email is the customer, attributes.urls.update_payment_method
// is a signed Lemon Squeezy link to fix the card. Everything beyond the
// payment_failures insert is fail-open: an email error must never 500 the
// webhook (Lemon Squeezy would retry and we'd double-log).
async function handlePaymentFailed(data, meta, payload) {
  const userId = meta?.custom_data?.user_id;
  const attributes = data?.attributes || {};
  const subscriptionId = attributes.subscription_id || data?.id;
  const eventId = data?.id;

  console.log(`Payment failed — user: ${userId} sub: ${subscriptionId}`);

  // Dunning rate limit: only email on the FIRST failure per subscription per
  // 7 days. Lemon Squeezy retries failed renewals several times; the customer
  // needs one nudge, not one per retry. Checked BEFORE inserting this event.
  let firstRecentFailure = false;
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent, error: recentError } = await supabase
      .from('payment_failures')
      .select('id')
      .eq('lemonsqueezy_subscription_id', String(subscriptionId))
      .gte('failed_at', since)
      .limit(1);
    if (recentError) {
      console.error('payment_failed: recency check error (skipping dunning):', JSON.stringify(recentError));
    } else {
      firstRecentFailure = !recent || recent.length === 0;
    }
  } catch (e) {
    console.error('payment_failed: recency check threw (skipping dunning):', e.message);
  }

  // lemonsqueezy_event_id is unique — a retried delivery of the same event must
  // not create a second row (retries previously duplicated events up to 5x).
  const { error } = await supabase.from('payment_failures').upsert(
    {
      user_id: userId,
      lemonsqueezy_subscription_id: String(subscriptionId),
      lemonsqueezy_event_id: String(eventId),
      raw_payload: payload
    },
    { onConflict: 'lemonsqueezy_event_id', ignoreDuplicates: true }
  );

  if (error) {
    console.error('Failed to log payment failure:', error);
  }

  if (!firstRecentFailure) {
    console.log(`payment_failed: sub ${subscriptionId} already emailed within 7 days — not re-sending`);
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('payment_failed: RESEND_API_KEY not set — dunning email skipped');
    return;
  }

  const customerEmail = attributes.user_email;
  const updateUrl = attributes.urls?.update_payment_method || 'https://deutsch-meister.de/dashboard';

  // 1) Dunning email to the customer.
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Zaid from DeutschMeister <zaid@deutsch-meister.de>',
          to: [customerEmail],
          subject: 'Your DeutschMeister payment didn’t go through',
          html: DUNNING_HTML(updateUrl),
        }),
      });
      if (!res.ok) {
        console.error(`payment_failed: Resend dunning error ${res.status}:`, (await res.text()).slice(0, 300));
      } else {
        console.log(`payment_failed: dunning email sent to customer for sub ${subscriptionId}`);
      }
    } catch (e) {
      console.error('payment_failed: dunning email threw:', e.message);
    }
  } else {
    console.warn(`payment_failed: no user_email in payload for sub ${subscriptionId} — customer not emailed`);
  }

  // 2) One-line alert to the owner.
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'DeutschMeister Alerts <zaid@deutsch-meister.de>',
        to: ['zaid@deutsch-meister.de'],
        subject: `Payment failed — subscription ${subscriptionId}`,
        text: `Renewal payment failed.\n\nSubscription: ${subscriptionId}\nCustomer: ${customerEmail || 'unknown'}\nUser ID: ${userId || 'unknown'}\nInvoice/event: ${eventId}\n\nThe customer ${customerEmail ? 'was' : 'could NOT be'} sent a dunning email (rate-limited to one per subscription per 7 days).`,
      }),
    });
    if (!res.ok) {
      console.error(`payment_failed: Resend owner alert error ${res.status}:`, (await res.text()).slice(0, 300));
    }
  } catch (e) {
    console.error('payment_failed: owner alert threw:', e.message);
  }
}

const DUNNING_HTML = (updateUrl) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment failed</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

          <tr>
            <td style="background:#0F766E;padding:32px;text-align:center;">
              <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:14px;background:rgba(255,255,255,0.2);margin-bottom:12px;">
                <span style="color:#ffffff;font-size:28px;font-weight:700;font-family:Georgia,'Times New Roman',serif;">M</span>
              </div>
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">DeutschMeister</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.6;">Hey!</p>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                Quick heads-up: the renewal payment for your DeutschMeister Pro subscription didn’t go through. This usually just means a card expired or the bank declined the charge.
              </p>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                Updating your payment details takes about a minute, and your access continues without interruption:
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="border-radius:10px;background:#0F766E;">
                    <a href="${updateUrl}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                      Update payment method →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:16px;color:#475569;line-height:1.6;">
                We’ll automatically retry the payment over the next few days. If nothing changes, the subscription will lapse on its own — no action needed if you meant to cancel.
              </p>

              <p style="margin:0;font-size:16px;color:#1e293b;line-height:1.6;">
                — Zaid
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                DeutschMeister · <a href="https://deutsch-meister.de" style="color:#94a3b8;">deutsch-meister.de</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
