import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { BILLING_PORTAL_URL, SIGNED_URL_MAX_AGE_MS, pickUpdatePaymentUrl } from './_shared/dunningLink.mjs';
import { courseAccessUntil, profileIdForEmail, reconcileSubscriptionEvent, reconcileUserEntitlement } from './_shared/subscriptionEntitlement.mjs';

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

// Helper: log to webhook_logs with error details. Returns whether the row was
// written. Callers may ignore that — except for order_refunded, whose log row
// is the only record of a refund that arrived before its order was delivered
// (see the handler and handleCourseOrder).
async function logWebhookEvent(eventType, payload, processed, errorMsg) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('webhook_logs').insert({
      event_type: eventType || 'unknown',
      payload: payload,
      processed: processed,
      error: errorMsg || null,
    });
    if (error) {
      console.error('Failed to write webhook_logs:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to write webhook_logs:', e.message, e.stack);
    return false;
  }
}

// One-line alert to the owner. Fail-open: an alert that cannot be sent is
// logged, never thrown — the webhook's own outcome must not depend on mail.
async function sendOwnerAlert(subject, text) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error(`owner alert skipped (RESEND_API_KEY not set): ${subject}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'DeutschMeister Alerts <zaid@deutsch-meister.de>',
        to: ['zaid@deutsch-meister.de'],
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error(`owner alert: Resend error ${res.status}:`, (await res.text()).slice(0, 300));
    }
  } catch (e) {
    console.error('owner alert threw:', e.message);
  }
}

// Is this order the Pro subscription? Only those may legitimately leave
// order_created ungranted: their subscription_created event follows and
// carries the grant. An order payload has no subscription flag, so:
//   1. LEMONSQUEEZY_PRO_VARIANT_IDS (functions scope, comma-separated numeric
//      variant ids) is authoritative when set;
//   2. otherwise the product name must START with "Pro" — every subscription
//      order so far was "Pro Monthly" (variants 1379337, 1393033). Anchored,
//      so a one-time "B1-Prüfungsplan Pro" is not mistaken for one (Codex
//      review of #202).
function isSubscriptionOrder(attributes) {
  const item = attributes?.first_order_item || {};
  const configured = String(process.env.LEMONSQUEEZY_PRO_VARIANT_IDS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (configured.length) return configured.includes(String(item.variant_id ?? ''));
  return /^pro\b/i.test(String(item.product_name || '').trim());
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
    let handlerNote = null;
    try {
      switch (eventType) {
        case 'order_created':
          await handleOrderCreated(data, payload.meta);
          break;
        case 'order_refunded':
          await handleOrderRefunded(data, payload.meta);
          break;
        case 'subscription_created':
          handlerNote = await handleSubscriptionCreated(data, payload.meta);
          break;
        case 'subscription_updated':
          handlerNote = await handleSubscriptionUpdated(data, payload.meta);
          break;
        case 'subscription_cancelled':
          handlerNote = await handleSubscriptionCancelled(data, payload.meta);
          break;
        case 'subscription_expired':
          handlerNote = await handleSubscriptionExpired(data, payload.meta);
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

    // Log result. A note (an event with nothing to apply) rides in the payload:
    // the error column means failure to the sentinel and the truth mail.
    const logged = await logWebhookEvent(eventType, handlerNote ? { ...payload, dm_note: handlerNote } : payload, !handlerError, handlerError?.message);

    if (handlerError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: handlerError.message }) };
    }
    // Entitlement changes are acknowledged only once they are on record;
    // subscription snapshots are also the ordering evidence for later replays.
    // For an order that was
    // never delivered this log row is the ONLY trace of the refund, and it is
    // what stops a later retry of that order's order_created from granting it
    // (handleCourseOrder). A 500 makes Lemon Squeezy retry; revoking is
    // idempotent (Codex review of the telc pilot PR A).
    if ((eventType === 'order_refunded' || ['subscription_created', 'subscription_updated', 'subscription_cancelled', 'subscription_expired'].includes(eventType)) && !logged) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'entitlement processed but not recorded in webhook_logs; retry' }) };
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
//   3. the payload's user_email matched EXACTLY against auth.users (every
//      page), then profiles (profileIdForEmail — never a wildcard pattern)
// Returns null only if every strategy fails, or the e-mail is ambiguous.
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

  // (b) email → auth.users, then profiles — exact matches only
  const email = String(attributes?.user_email ?? '').trim().toLowerCase();
  if (email) {
    const authId = await authUserIdForEmail(email);
    if (authId) {
      console.log('resolveUserId: matched by user_email via auth.users:', email);
      return authId;
    }

    const profile = await profileIdForEmail(supabase, email);
    if (profile.error) {
      console.error('resolveUserId: profiles lookup error:', JSON.stringify(profile.error));
    } else if (profile.id) {
      console.log('resolveUserId: matched by user_email via profiles:', email);
      return profile.id;
    } else if (profile.ambiguous) {
      console.error('resolveUserId: more than one profile has e-mail', email, '— not guessing');
    }
  }

  return null;
}

// GoTrue lists users a page at a time (50 by default — a bare listUsers() saw
// only the first 50 of ~1,700 accounts). Read every page; stop at an empty one,
// which holds whatever page size the server actually applies.
const AUTH_USERS_PER_PAGE = 1000;
const AUTH_USERS_MAX_PAGES = 100;
async function authUserIdForEmail(email) {
  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: AUTH_USERS_PER_PAGE });
    if (error) {
      console.error('resolveUserId: auth listUsers error:', JSON.stringify(error));
      return null;
    }
    const users = data?.users || [];
    const match = users.find((u) => String(u.email ?? '').trim().toLowerCase() === email);
    if (match) return match.id;
    if (users.length === 0) return null;
  }
  return null;
}

// A custom_data user id outlives its account: delete-account removes the auth
// user (subscriptions, profiles and purchases cascade), but Lemon Squeezy keeps
// sending that id, and writing it again violates the auth.users foreign key — a
// 500 retried for ever. Only a definite "user not found" counts as deleted; any
// other lookup trouble proceeds as before, so the write itself stays the check.
async function accountDeleted(userId) {
  try {
    const { error } = await supabase.auth.admin.getUserById(userId);
    return Boolean(error) && (error.status === 404 || error.code === 'user_not_found');
  } catch (e) {
    console.error('accountDeleted: auth lookup threw (proceeding):', e.message);
    return false;
  }
}

// One-time products, keyed by Lemon Squeezy variant id. Env-configured so a
// missing variable simply means "no course routing" — subscription orders are
// untouched either way. proDays is the included Pro window ("3 Monate
// Pro-Zugang inklusive"); the course area itself never expires.
//
// Product keys must match src/data/pricing.js (COURSES + LEVEL_COURSES): the
// client resolves which levels a purchases row unlocks from that key alone.
const COURSE_VARIANT_ENV = {
  LEMONSQUEEZY_TELC_B1_VARIANT_ID: 'telc_b1_komplett',
  // One product per paid sub-level (2026-09-08). B1/B2 vars stay unset while
  // those courses are "coming soon" — an unset var is simply no route.
  LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID: 'course_a1_2',
  LEMONSQUEEZY_COURSE_A2_1_VARIANT_ID: 'course_a2_1',
  LEMONSQUEEZY_COURSE_A2_2_VARIANT_ID: 'course_a2_2',
  LEMONSQUEEZY_COURSE_B1_1_VARIANT_ID: 'course_b1_1',
  LEMONSQUEEZY_COURSE_B1_2_VARIANT_ID: 'course_b1_2',
  LEMONSQUEEZY_COURSE_B2_1_VARIANT_ID: 'course_b2_1',
  LEMONSQUEEZY_COURSE_B2_2_VARIANT_ID: 'course_b2_2',
  // Retired band products (2026-09-03 → 2026-09-08): still routed so an order
  // from a cached checkout link is delivered, never silently dropped.
  LEMONSQUEEZY_COURSE_A1_VARIANT_ID: 'course_a1',
  LEMONSQUEEZY_COURSE_A2_VARIANT_ID: 'course_a2',
  LEMONSQUEEZY_COURSE_B1_VARIANT_ID: 'course_b1',
  LEMONSQUEEZY_COURSE_B2_VARIANT_ID: 'course_b2',
  LEMONSQUEEZY_COURSE_ALLE_VARIANT_ID: 'course_alle',
};

function courseForVariant(variantId) {
  const map = {};
  for (const [envName, productKey] of Object.entries(COURSE_VARIANT_ENV)) {
    const id = process.env[envName];
    if (id) map[String(id)] = { productKey, proDays: 90 };
  }
  return variantId ? map[String(variantId)] || null : null;
}

// Coupon redemption ledger (docs/admin-panel.md, Part 3 §4.6). Called from the
// PAID branch of order_created, after the paid gate and before fulfilment.
// The code travels through checkout custom data (checkout[custom][coupon])
// and comes back on the webhook as meta.custom_data.coupon — deterministic,
// never guessed from the discount total. One row per paid order, idempotent
// under provider retries by UNIQUE (coupon_id, order_id); amounts snapshotted
// in minor units; the recorder never throws.
async function recordCouponRedemption(meta, orderId, attributes, userId) {
  try {
    const raw = meta?.custom_data?.coupon;
    if (!raw) return { skipped: 'no_code' };
    const code = String(raw).trim().toUpperCase();
    const { data: coupon } = await supabase.from('coupons').select('id, currency').eq('normalized_code', code).maybeSingle();
    if (!coupon) {
      console.warn(`order ${orderId} carried unknown coupon code ${code}`);
      return { skipped: 'unknown_code' };
    }
    const discount = Number(attributes?.discount_total ?? 0) || 0;
    // The custom field outlives the checkout's discount field, which the buyer
    // can clear and Lemon Squeezy can refuse: no discount applied, no redemption
    // (a row would burn the per-user, new-customer and total limits).
    if (discount <= 0) return { skipped: 'no_discount' };
    const total = Number(attributes?.total ?? 0) || 0;
    const { error } = await supabase.from('coupon_redemptions').insert({
      coupon_id: coupon.id,
      user_id: userId || null,
      user_email: attributes?.user_email || null,
      order_id: String(orderId),
      variant_id: attributes?.first_order_item?.variant_id != null ? String(attributes.first_order_item.variant_id) : null,
      original_amount: total + discount,
      discount_amount: discount,
      final_amount: total,
      currency: attributes?.currency || coupon.currency,
      payment_status: 'paid',
    });
    if (error) {
      if (error.code === '23505') return { duplicate: true };
      console.error('coupon ledger insert failed:', error.message);
      return { failed: error.message };
    }
    return { recorded: true, couponId: coupon.id };
  } catch (e) {
    console.error('coupon ledger threw:', e.message);
    return { failed: e.message };
  }
}

async function handleOrderCreated(data, meta) {
  const customData = meta?.custom_data || {};
  const attributes = data?.attributes || {};
  const orderId = String(data?.id || '');
  const userId = customData.user_id;

  console.log('Order created for user:', userId, 'Order ID:', orderId);

  // The coupon ledger: only for PAID, non-test orders, before any fulfilment lane.
  if (attributes.status === 'paid' && meta?.test_mode !== true) {
    const ledger = await recordCouponRedemption(meta, orderId, attributes, userId || null);
    if (ledger.recorded || ledger.duplicate) console.log('coupon ledger:', JSON.stringify(ledger));
  }

  // One-time course order? Route it to the purchases path and stop — there is
  // no subscription row to backfill for a one-time product.
  const orderVariantId = String(attributes.first_order_item?.variant_id || '');
  const course = courseForVariant(orderVariantId);
  if (course) {
    await handleCourseOrder({ course, orderId, customData, attributes, meta });
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

  // A paid order that is neither a routed course nor the Pro subscription has
  // granted nothing: the lane above only backfills price_paid. The usual cause
  // is a one-time product whose functions-scope LEMONSQUEEZY_*_VARIANT_ID is
  // unset or wrong. The owner is mailed, and the event then FAILS on purpose:
  // webhook_logs records processed=false (the Monday truth mail counts failed
  // webhooks), and the 500 makes Lemon Squeezy retry — so an alert that could
  // not be sent is not the only trace, and once the env var is fixed a retry
  // delivers the order by itself (Codex review of #202).
  if (attributes.status === 'paid' && !isSubscriptionOrder(attributes)) {
    const item = attributes.first_order_item || {};
    const testTag = meta?.test_mode === true ? '[TEST] ' : '';
    await sendOwnerAlert(
      `${testTag}Paid order NOT delivered — order ${orderId}`,
      `A customer paid, but the webhook could not route the order to a product, so nothing was granted.\n\nOrder: ${orderId}\nProduct: ${item.product_name || 'unknown'} / ${item.variant_name || 'unknown'}\nVariant id: ${orderVariantId || 'unknown'}\nCustomer: ${attributes.user_email || 'unknown'}\nUser ID: ${userId || 'unknown'}\nTotal: ${attributes.total_formatted || attributes.total}\n\nFix: set the matching LEMONSQUEEZY_<PRODUCT>_VARIANT_ID in the Netlify functions scope to ${orderVariantId || 'this variant id'}. Lemon Squeezy retries the event and delivers it once the id is set; after its retries run out, replay the order_created event from the Lemon Squeezy dashboard (Settings → Webhooks). If this order IS the Pro subscription, add ${orderVariantId || 'its variant id'} to LEMONSQUEEZY_PRO_VARIANT_IDS instead.`,
    );
    throw new Error(
      `unrouted paid order ${orderId} — variant ${orderVariantId || '?'} (${item.product_name || '?'} / ${item.variant_name || '?'}) matches no course env var and is not the Pro subscription; nothing granted`,
    );
  }
}

// Order statuses that never grant a course. Lemon Squeezy's order status is
// one of pending, failed, paid, refunded, partial_refund, fraudulent, and its
// `refunded` flag is true only for a FULL refund — a partial one is status
// partial_refund, and handleOrderRefunded revokes on either. `pending` still
// grants, as before: no later event would deliver it.
const NO_GRANT_ORDER_STATUSES = new Set(['failed', 'refunded', 'partial_refund', 'fraudulent']);

// Course purchase: record the entitlement, then grant the included Pro window
// unless a real subscription already covers the user. Idempotent on the LS
// order id, so webhook retries can never double-grant.
async function handleCourseOrder({ course, orderId, customData, attributes, meta }) {
  // A refunded order is never granted again. order_created is replayed by
  // Lemon Squeezy retries and by the owner's "resend" in the dashboard, and the
  // upsert below writes status 'active' — so a replay after a refund used to
  // hand the access straight back (found 2026-10-12, telc pilot plan). Three
  // records can say so, checked in this order: the payload (the refund was
  // known to Lemon Squeezy when it sent the event), the purchases row (our
  // refund handler ran), and the logged order_refunded event (the refund
  // arrived BEFORE the order was ever delivered, so there was no row to mark).
  if (attributes?.refunded === true || NO_GRANT_ORDER_STATUSES.has(attributes?.status)) {
    console.log(`course order ${orderId}: status ${attributes?.status}, refunded ${attributes?.refunded === true} — not granting`);
    return;
  }
  const { data: priorPurchase, error: priorError } = await supabase
    .from('purchases')
    .select('*')
    .eq('lemonsqueezy_order_id', orderId)
    .maybeSingle();
  if (priorError) {
    console.error('course order: prior purchase lookup error:', JSON.stringify(priorError));
    throw new Error(`course order prior purchase lookup failed: ${priorError.message}`);
  }
  if (priorPurchase?.status === 'refunded') {
    console.log(`course order ${orderId}: already refunded — not granting again`);
    return;
  }
  // Refund-first: order_refunded found no purchases row and returned, so only
  // webhook_logs (every event, with its payload, never pruned) remembers it.
  // Without this an automatic retry of the original paid order_created — e.g.
  // a no-account order the owner refunded, once the buyer has signed up —
  // granted a refunded order (Codex review of the telc pilot PR A).
  const { data: loggedRefunds, error: refundLogError } = await supabase
    .from('webhook_logs')
    .select('id')
    .eq('event_type', 'order_refunded')
    .eq('payload->data->>id', orderId)
    .limit(1);
  if (refundLogError) {
    console.error('course order: refund log lookup error:', JSON.stringify(refundLogError));
    throw new Error(`course order refund log lookup failed: ${refundLogError.message}`);
  }
  if (loggedRefunds?.length) {
    console.log(`course order ${orderId}: a refund for it is on record — not granting`);
    return;
  }

  let userId = await resolveUserId(customData, attributes, null);
  if (userId && userId === customData?.user_id && await accountDeleted(userId)) {
    // The buyer deleted that account. An owner resend after they signed up
    // again reaches the new account through the order's e-mail; otherwise this
    // is a paid order without an account, handled just below.
    console.log(`course order ${orderId}: account ${userId} was deleted — matching the order by e-mail`);
    userId = await resolveUserId({}, attributes, null);
  }
  if (!userId) {
    // A paying customer we cannot attach is a loud failure, not a warning:
    // throwing 500s the webhook so Lemon Squeezy retries (the buyer may be
    // mid-signup) and the failure lands in webhook_logs for follow-up. The
    // owner hears about it at once — a retry only helps if the buyer creates
    // an account with the same e-mail, and nobody tells them to.
    const testTag = meta?.test_mode === true ? '[TEST] ' : '';
    await sendOwnerAlert(
      `${testTag}Paid course order has no account — order ${orderId}`,
      `A customer paid for ${course.productKey}, but no DeutschMeister account matches the order, so nothing was granted yet.\n\nOrder: ${orderId}\nCustomer e-mail: ${attributes?.user_email || 'unknown'}\nTotal: ${attributes?.total_formatted || attributes?.total}\n\nEither ask the buyer to sign up at https://deutsch-meister.de/signup with that address and then resend this order_created event (Lemon Squeezy → Settings → Webhooks), or refund in the Lemon Squeezy dashboard. A refunded order is never delivered afterwards, even by a retry (docs/telc-pilot/README.md).`,
    );
    throw new Error(
      `course order ${orderId} (${course.productKey}) has no resolvable user — email: ${attributes?.user_email || 'none'}`
    );
  }

  const now = new Date();
  const pricePaid = attributes.total != null ? Number(attributes.total) / 100 : null;

  // Every order keeps its original included-Pro deadline, even if another
  // subscription currently covers it. Retries may finish provisioning but
  // cannot restart the window or overwrite a concurrent refund.
  const accessUntil = courseAccessUntil(priorPurchase, attributes, course.proDays, now.getTime());
  if (!priorPurchase) {
    const { error: purchaseError } = await supabase.from('purchases').upsert({
      user_id: userId,
      product_key: course.productKey,
      lemonsqueezy_order_id: orderId,
      price_paid: pricePaid,
      status: 'active',
      access_until: accessUntil,
      created_at: attributes.created_at || now.toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'lemonsqueezy_order_id', ignoreDuplicates: true });
    if (purchaseError) throw new Error(`purchases upsert failed: ${purchaseError.message}`);
  } else if (!priorPurchase.access_until) {
    // Legacy purchases made during a recurring plan had no included window
    // stored. Recover it from the original purchase date, never delivery time.
    const { error } = await supabase.from('purchases')
      .update({ access_until: accessUntil, updated_at: now.toISOString() })
      .eq('lemonsqueezy_order_id', orderId).eq('status', 'active').is('access_until', null);
    if (error) throw error;
  }
  await reconcileUserEntitlement(supabase, userId, now.getTime());

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
    // Not a course order, or a course order refunded before it was delivered.
    // Nothing to revoke either way; this event's webhook_logs row is what stops
    // a later retry of that order's order_created from granting it.
    console.log('order_refunded: no purchases row for order', orderId, '— nothing to revoke');
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

  // Included Pro is the union of the remaining purchase windows and the
  // current recurring entitlement, not whichever order last wrote the row.
  await reconcileUserEntitlement(supabase, purchase.user_id, Date.parse(nowIso));

  console.log('order_refunded: purchase', orderId, `(${purchase.product_key})`, 'revoked for user', purchase.user_id);
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
    .select('id, user_id');

  if (error) {
    console.error('subscription_payment_success: price_paid update error:', JSON.stringify(error));
    throw new Error(`subscription_payment_success price update failed: ${error.message}`);
  }

  if (!updated || updated.length === 0) {
    console.warn('subscription_payment_success: no subscription row for', subscriptionId, '— price_paid not written');
  } else {
    console.log('subscription_payment_success: price_paid', pricePaid, 'set for sub', subscriptionId);
    for (const row of updated) {
      await reconcileUserEntitlement(supabase, row.user_id);
    }
  }
}

// Returns a note for the event's log row when there was nothing to apply.
async function applySubscriptionEvent(data, meta, eventType) {
  const userId = await resolveUserId(meta?.custom_data || {}, data?.attributes || {}, data?.id);
  if (!userId) throw new Error(`${eventType}: no resolvable user for subscription ${data?.id}`);
  if (await accountDeleted(userId)) {
    // The account and its rows are gone; there is nothing to reconcile.
    console.log(`${eventType}: account ${userId} was deleted — subscription ${data?.id} not applied`);
    return `account ${userId} deleted — event not applied`;
  }
  await reconcileSubscriptionEvent(supabase, userId, data, eventType);
  return null;
}

async function handleSubscriptionCreated(data, meta) {
  return applySubscriptionEvent(data, meta, 'subscription_created');
}

async function handleSubscriptionUpdated(data, meta) {
  return applySubscriptionEvent(data, meta, 'subscription_updated');
}

async function handleSubscriptionCancelled(data, meta) {
  return applySubscriptionEvent(data, meta, 'subscription_cancelled');
}

async function handleSubscriptionExpired(data, meta) {
  return applySubscriptionEvent(data, meta, 'subscription_expired');
}

// subscription_payment_failed: data is a subscription-invoice.
// attributes.user_email is the customer. The invoice carries NO
// update_payment_method link (only invoice_url); updatePaymentLink() finds the
// signed one on a recent subscription_updated, else the Customer Portal — see
// _shared/dunningLink.mjs. Everything beyond the
// payment_failures insert is fail-open: an email error must never 500 the
// webhook (Lemon Squeezy would retry and we'd double-log).
async function handlePaymentFailed(data, meta, payload) {
  const userId = meta?.custom_data?.user_id;
  const attributes = data?.attributes || {};
  const subscriptionId = attributes.subscription_id || data?.id;
  const eventId = data?.id;

  console.log(`Payment failed — user: ${userId} sub: ${subscriptionId}`);

  // Dunning rate limit: one DELIVERED email per subscription per 7 days.
  // Lemon Squeezy retries failed renewals several times; the customer needs one
  // nudge, not one per retry. A send that failed (Resend down, a refused
  // address) must not count, so the gate reads the dunning_sent_at stamp a
  // delivered send leaves on its payment_failures row, not the row itself.
  // Rows written before that stamp existed carry no dunning_tracked flag; the
  // old rule counted any recent row as emailed, so those still count — for the
  // seven days they can stay inside the window after the deploy.
  let firstRecentFailure = false;
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recent, error: recentError } = await supabase
      .from('payment_failures')
      .select('id, sent:raw_payload->>dunning_sent_at, tracked:raw_payload->>dunning_tracked')
      .eq('lemonsqueezy_subscription_id', String(subscriptionId))
      .gte('failed_at', since)
      .limit(50);
    if (recentError) {
      console.error('payment_failed: recency check error (skipping dunning):', JSON.stringify(recentError));
    } else {
      firstRecentFailure = !(recent || []).some((row) => row.sent != null || row.tracked == null);
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
      // Tracked: a delivered mail for this row is stamped dunning_sent_at.
      raw_payload: { ...payload, dunning_tracked: true }
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
  const { url: updateUrl, source: linkSource } = await updatePaymentLink(attributes, subscriptionId);
  console.log(`payment_failed: update link for sub ${subscriptionId} from ${linkSource}`);

  // 1) Dunning email to the customer. Its outcome goes into the owner alert.
  let dunning = 'not attempted';
  if (customerEmail && customerEmail.includes('@')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Zaid from DeutschMeister <zaid@deutsch-meister.de>',
          to: [customerEmail],
          subject: 'Your DeutschMeister payment didn’t go through',
          html: DUNNING_HTML(updateUrl, BILLING_PORTAL_URL),
        }),
      });
      if (!res.ok) {
        dunning = `Resend ${res.status}`;
        console.error(`payment_failed: Resend dunning error ${res.status}:`, (await res.text()).slice(0, 300));
      } else {
        dunning = 'sent';
        console.log(`payment_failed: dunning email sent to customer for sub ${subscriptionId}`);
      }
    } catch (e) {
      dunning = 'threw';
      console.error('payment_failed: dunning email threw:', e.message);
    }
  } else {
    dunning = 'no customer email';
    console.warn(`payment_failed: no user_email in payload for sub ${subscriptionId} — customer not emailed`);
  }
  if (dunning === 'sent') await stampDunningSent(eventId, payload);

  // 2) One-line alert to the owner.
  const outcome = dunning === 'sent'
    ? 'The customer was sent a dunning email'
    : `The dunning email to the customer was NOT sent: ${dunning}. Forward the update-payment link below by hand; the next failed retry tries the mail again`;
  await sendOwnerAlert(
    `Payment failed — subscription ${subscriptionId}`,
    `Renewal payment failed.\n\nSubscription: ${subscriptionId}\nCustomer: ${customerEmail || 'unknown'}\nUser ID: ${userId || 'unknown'}\nInvoice/event: ${eventId}\n\n${outcome} (one delivered dunning email per subscription per 7 days).\nUpdate-payment link: ${updateUrl}\nLink source: ${linkSource} (subscription_updated = signed link, portal = ${BILLING_PORTAL_URL}).`,
  );
}

// Record a DELIVERED dunning mail on this event's payment_failures row — the
// stamp the 7-day gate reads. Fail-open: an unrecorded send only means a later
// retry may mail the customer again.
async function stampDunningSent(eventId, payload) {
  try {
    const { error } = await supabase.from('payment_failures')
      .update({ raw_payload: { ...payload, dunning_tracked: true, dunning_sent_at: new Date().toISOString() } })
      .eq('lemonsqueezy_event_id', String(eventId));
    if (error) console.error('payment_failed: dunning send not recorded:', JSON.stringify(error));
  } catch (e) {
    console.error('payment_failed: dunning send record threw:', e.message);
  }
}

// The signed update link for this subscription. Read-only and fail-open: any
// error falls through to the Customer Portal, never to a page that cannot
// change a card.
async function updatePaymentLink(attributes, subscriptionId) {
  let subscriptionEvents = [];
  try {
    const since = new Date(Date.now() - SIGNED_URL_MAX_AGE_MS).toISOString();
    const { data, error } = await supabase
      .from('webhook_logs')
      .select('created_at, payload')
      .eq('event_type', 'subscription_updated')
      .eq('payload->data->>id', String(subscriptionId))
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) console.error('payment_failed: update-link lookup error:', JSON.stringify(error));
    else subscriptionEvents = data || [];
  } catch (e) {
    console.error('payment_failed: update-link lookup threw:', e.message);
  }
  return pickUpdatePaymentUrl({ invoiceAttributes: attributes, subscriptionEvents, subscriptionId });
}

const DUNNING_HTML = (updateUrl, portalUrl) => `<!DOCTYPE html>
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
                Until the payment goes through, your Pro access is paused. Updating your payment details takes about a minute, and Pro switches back on as soon as the payment succeeds:
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
                Button not working any more? Open <a href="${portalUrl}" style="color:#0F766E;">${portalUrl.replace('https://', '')}</a> and sign in with the email address you subscribed with.
              </p>

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
