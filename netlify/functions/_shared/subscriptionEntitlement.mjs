import { COURSE_PRO_DAYS } from './pricing.mjs';

const ACCESS_STATUSES = new Set(['active', 'on_trial', 'cancelled', 'past_due', 'paused']);
const SUBSCRIPTION_EVENTS = ['subscription_created', 'subscription_updated', 'subscription_cancelled', 'subscription_expired'];

function isoDate(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function subscriptionHasPaidAccess(row, now = Date.now()) {
  return !!row && ACCESS_STATUSES.has(row.status) && Date.parse(row.subscription_end) > Number(now);
}

export function latestCourseWindow(purchases, now = Date.now()) {
  return (purchases || []).reduce((latest, purchase) => {
    if (purchase.status !== 'active' || !(Date.parse(purchase.access_until) > Number(now))) return latest;
    return !latest || Date.parse(purchase.access_until) > Date.parse(latest.access_until) ? purchase : latest;
  }, null);
}

export function courseAccessUntil(priorPurchase, attributes, proDays, now = Date.now()) {
  if (priorPurchase?.access_until) return isoDate(priorPurchase.access_until);
  const start = isoDate(priorPurchase?.created_at) || isoDate(attributes.created_at) || new Date(now).toISOString();
  return new Date(Date.parse(start) + proDays * 24 * 60 * 60 * 1000).toISOString();
}

// `superseded`: a course row replaced this subscription id for the user — it is
// recorded as superseded (a subscription_superseded log) or a legacy course row
// still carries it.
export function subscriptionEventRow(existing, data, eventType, now = Date.now(), { superseded = true } = {}) {
  const attributes = data?.attributes || {};
  const subscriptionId = String(data?.id || '');
  if (!subscriptionId) throw new Error('Subscription event has no subscription id');
  const sameSubscription = existing?.plan_type !== 'course' && existing?.lemonsqueezy_subscription_id === subscriptionId;
  const createdAt = isoDate(attributes.created_at);
  if (existing && !sameSubscription) {
    // A different/old subscription must not overwrite a newer purchase or
    // recurring subscription. New checkouts carry the provider creation date.
    if (!createdAt) return null;
    if (existing.plan_type !== 'course' && !(Date.parse(createdAt) > Date.parse(existing.subscription_start))) return null;
    // Only a superseded id has to be newer than the course row. A never-seen
    // one — a delayed creation for a subscription bought before the course —
    // replaces it whatever its timestamps: the purchase keeps its own window.
    if (existing.plan_type === 'course' && superseded
      && Date.parse(attributes.updated_at || createdAt) < Date.parse(existing.subscription_start)) return null;
    // A replacement must be paid for now: active, on trial, or cancelled but
    // paid through ends_at (a cancellation can arrive before its creation).
    if (!['active', 'on_trial', 'cancelled'].includes(attributes.status)) return null;
    const paidUntil = attributes.status === 'on_trial' ? attributes.trial_ends_at
      : attributes.status === 'cancelled' ? attributes.ends_at : attributes.renews_at;
    if ((existing.plan_type === 'course' || attributes.status === 'cancelled') && !(Date.parse(paidUntil) > Number(now))) return null;
  }

  const previous = sameSubscription ? existing : null;
  const status = eventType === 'subscription_expired' ? 'expired'
    : eventType === 'subscription_cancelled' ? 'cancelled'
      : attributes.status || previous?.status || 'expired';
  let paidThrough = isoDate(previous?.subscription_end);
  if (status === 'active') paidThrough = isoDate(attributes.renews_at) || paidThrough;
  if (status === 'on_trial') paidThrough = isoDate(attributes.trial_ends_at) || paidThrough;
  if (status === 'cancelled') paidThrough = isoDate(attributes.ends_at) || paidThrough;
  // LS documents past_due.renews_at as the next retry, not a paid period:
  // https://docs.lemonsqueezy.com/api/subscriptions/the-subscription-object
  // Grace is only the last confirmed paid-through date (zero extra days).
  // Pausing collection likewise cannot manufacture another paid period.
  const planName = attributes.variant_name || attributes.product_name || '';
  return {
    user_id: existing?.user_id,
    plan_type: planName ? (planName.toLowerCase().includes('yearly') ? 'yearly' : 'monthly') : previous?.plan_type || 'monthly',
    status,
    subscription_start: createdAt || previous?.subscription_start || new Date(now).toISOString(),
    subscription_end: paidThrough,
    lemonsqueezy_subscription_id: subscriptionId,
    lemonsqueezy_customer_id: String(attributes.customer_id ?? previous?.lemonsqueezy_customer_id ?? ''),
    lemonsqueezy_order_id: String(attributes.order_id ?? previous?.lemonsqueezy_order_id ?? ''),
    lemonsqueezy_product_id: String(attributes.product_id ?? previous?.lemonsqueezy_product_id ?? ''),
    lemonsqueezy_variant_id: String(attributes.variant_id ?? previous?.lemonsqueezy_variant_id ?? ''),
    price_paid: attributes.first_subscription_item?.price != null ? Number(attributes.first_subscription_item.price) / 100 : previous?.price_paid ?? null,
    cancel_at_period_end: status === 'cancelled' || attributes.cancelled === true,
    cancelled_at: status === 'cancelled' ? previous?.cancelled_at || isoDate(attributes.updated_at) || new Date(now).toISOString() : null,
    updated_at: new Date(now).toISOString(),
  };
}

async function confirmedSubscriptionEnd(supabase, subscriptionId) {
  const { data: snapshots, error } = await supabase.from('webhook_logs')
    .select('payload')
    .in('event_type', SUBSCRIPTION_EVENTS)
    .eq('payload->data->>id', subscriptionId)
    .in('payload->data->attributes->>status', ['active', 'on_trial', 'cancelled'])
    .order('payload->data->attributes->>updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const attributes = snapshots?.[0]?.payload?.data?.attributes || {};
  return isoDate(attributes.status === 'on_trial' ? attributes.trial_ends_at
    : attributes.status === 'cancelled' ? attributes.ends_at : attributes.renews_at);
}

async function latestSubscriptionSnapshot(supabase, subscriptionId) {
  const { data: snapshots, error } = await supabase.from('webhook_logs')
    .select('event_type, payload')
    .in('event_type', SUBSCRIPTION_EVENTS)
    .eq('payload->data->>id', subscriptionId)
    .order('payload->data->attributes->>updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return snapshots?.[0];
}

async function recordSupersededId(supabase, userId, subscriptionId, supersededAt) {
  const { error } = await supabase.from('webhook_logs').insert({
    event_type: 'subscription_superseded',
    payload: { meta: { custom_data: { user_id: userId }, superseded_at: supersededAt }, data: { id: subscriptionId } },
    processed: true,
    error: null,
  });
  if (error) throw error;
}

async function retireLegacyCourseId(supabase, subscription, userId, now) {
  if (subscription?.plan_type !== 'course' || !subscription.lemonsqueezy_subscription_id) return subscription;
  const snapshot = await latestSubscriptionSnapshot(supabase, subscription.lemonsqueezy_subscription_id);
  if (!snapshot) return subscription;
  const status = snapshot?.payload?.data?.attributes?.status;
  if ((ACCESS_STATUSES.has(status) || status === 'unpaid') && snapshot.event_type !== 'subscription_expired') {
    const attributes = snapshot.payload.data.attributes;
    if (['active', 'on_trial', 'cancelled'].includes(status)
      && Date.parse(attributes.updated_at || attributes.created_at) < Date.parse(subscription.subscription_start)) return subscription;
    // The old course upsert could leave an overdue recurring identity here.
    // Restore its provider state; purchases independently grant included Pro.
    const recurring = { ...subscriptionEventRow(null, snapshot.payload.data, snapshot.event_type, now), user_id: userId };
    const { error } = await supabase.from('subscriptions').upsert(recurring, { onConflict: 'user_id' });
    if (error) throw error;
    return recurring;
  }
  await recordSupersededId(supabase, userId, subscription.lemonsqueezy_subscription_id, subscription.subscription_start);
  const { error } = await supabase.from('subscriptions').update({
    lemonsqueezy_subscription_id: null, cancel_at_period_end: false, cancelled_at: null, updated_at: new Date(now).toISOString(),
  }).eq('user_id', userId).eq('plan_type', 'course').eq('lemonsqueezy_subscription_id', subscription.lemonsqueezy_subscription_id);
  if (error) throw error;
  return { ...subscription, lemonsqueezy_subscription_id: null, cancel_at_period_end: false, cancelled_at: null };
}

// Course orders taken during a live recurring plan before 2026-10-22 were
// stored with access_until = null, which latestCourseWindow ignores — so their
// included Pro vanished when the plan ended. Recover the deadline from the
// original purchase date (never from now) and store it once, conditionally.
// Manual grants ('manual-…') are deadline-free on purpose and stay untouched.
async function recoverLegacyCourseDeadlines(supabase, purchases, now) {
  const recovered = [];
  for (const purchase of purchases) {
    const orderId = String(purchase.lemonsqueezy_order_id || '');
    if (purchase.access_until != null || !orderId || orderId.startsWith('manual-') || !isoDate(purchase.created_at)) {
      recovered.push(purchase);
      continue;
    }
    const accessUntil = courseAccessUntil(purchase, {}, COURSE_PRO_DAYS, now);
    const { error } = await supabase.from('purchases')
      .update({ access_until: accessUntil, updated_at: new Date(now).toISOString() })
      .eq('lemonsqueezy_order_id', orderId).eq('status', 'active').is('access_until', null);
    if (error) throw error;
    recovered.push({ ...purchase, access_until: accessUntil });
  }
  return recovered;
}

export async function reconcileUserEntitlement(supabase, userId, now = Date.now()) {
  const [subscriptionResult, purchasesResult, profileResult] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('purchases').select('*').eq('user_id', userId).eq('status', 'active'),
    supabase.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle(),
  ]);
  if (subscriptionResult.error) throw subscriptionResult.error;
  if (purchasesResult.error) throw purchasesResult.error;
  if (profileResult.error) throw profileResult.error;
  let subscription = await retireLegacyCourseId(supabase, subscriptionResult.data, userId, now);
  if (subscription?.lemonsqueezy_subscription_id && ['past_due', 'paused'].includes(subscription.status)) {
    // Older handlers copied retry dates into this column. Repair them from
    // confirmed provider snapshots; an unverifiable period grants no access.
    const paidThrough = await confirmedSubscriptionEnd(supabase, subscription.lemonsqueezy_subscription_id);
    if (paidThrough !== isoDate(subscription.subscription_end)) {
      const { error } = await supabase.from('subscriptions')
        .update({ subscription_end: paidThrough, updated_at: new Date(now).toISOString() })
        .eq('user_id', userId).eq('lemonsqueezy_subscription_id', subscription.lemonsqueezy_subscription_id)
        .eq('status', subscription.status);
      if (error) throw error;
      subscription = { ...subscription, subscription_end: paidThrough };
    }
  }
  const purchases = await recoverLegacyCourseDeadlines(supabase, purchasesResult.data || [], now);
  const course = latestCourseWindow(purchases, now);
  const liveRecurring = subscription?.plan_type !== 'course' && subscriptionHasPaidAccess(subscription, now);
  // Keep a recoverable recurring row so a later successful retry can find it.
  const recoverableRecurring = subscription?.lemonsqueezy_subscription_id
    && (subscription.plan_type === 'course' || ACCESS_STATUSES.has(subscription.status) || subscription.status === 'unpaid');
  const nowIso = new Date(now).toISOString();
  if (!liveRecurring && !recoverableRecurring && course) {
    if (subscription?.lemonsqueezy_subscription_id) {
      // Preserve retired identities before clearing the one-row subscription
      // slot. An old expiry/replay can then never take over a course window.
      await recordSupersededId(supabase, userId, subscription.lemonsqueezy_subscription_id, nowIso);
    }
    const courseRow = {
      user_id: userId,
      plan_type: 'course',
      status: 'active',
      subscription_start: course.created_at,
      subscription_end: course.access_until,
      lemonsqueezy_subscription_id: null,
      lemonsqueezy_order_id: course.lemonsqueezy_order_id,
      lemonsqueezy_customer_id: null,
      lemonsqueezy_product_id: null,
      lemonsqueezy_variant_id: null,
      cancel_at_period_end: false,
      cancelled_at: null,
      price_paid: course.price_paid,
      updated_at: nowIso,
    };
    const { error } = await supabase.from('subscriptions').upsert(courseRow, { onConflict: 'user_id' });
    if (error) throw error;
    subscription = courseRow;
  } else if (!course && subscription?.plan_type === 'course') {
    const { error } = await supabase.from('subscriptions')
      .update({ status: 'expired', updated_at: nowIso }).eq('user_id', userId);
    if (error) throw error;
    subscription = { ...subscription, status: 'expired' };
  }
  const premium = profileResult.data?.subscription_tier === 'premium';
  const isSubscribed = !!(premium || liveRecurring || course);
  const profilePatch = {
    id: userId,
    is_subscribed: isSubscribed,
    subscription_tier: premium ? 'premium' : isSubscribed ? 'pro' : 'free',
    updated_at: nowIso,
  };
  // The conditional write also protects a grant made after the profile read.
  const { error } = await (profileResult.data
    ? premium
      ? supabase.from('profiles').update({ is_subscribed: true, updated_at: nowIso }).eq('id', userId).eq('subscription_tier', 'premium')
      : supabase.from('profiles').update(profilePatch).eq('id', userId).or('subscription_tier.is.null,subscription_tier.neq.premium')
    : supabase.from('profiles').upsert(profilePatch, { onConflict: 'id', ignoreDuplicates: true }));
  if (error) throw error;
  return { subscription, purchases, isSubscribed };
}

export async function reconcileSubscriptionEvent(supabase, userId, data, eventType, now = Date.now()) {
  const { data: current, error: lookupError } = await supabase.from('subscriptions')
    .select('*').eq('user_id', userId).maybeSingle();
  if (lookupError) throw lookupError;
  const existing = await retireLegacyCourseId(supabase, current, userId, now);
  const { data: retired, error: retiredError } = await supabase.from('webhook_logs').select('created_at, payload')
    .eq('event_type', 'subscription_superseded').eq('payload->data->>id', String(data?.id || ''))
    .order('created_at', { ascending: false }).limit(1);
  if (retiredError) throw retiredError;
  // Compare provider timestamps in stored snapshots, never the row's local
  // updated_at (price writes and administrative changes also update it).
  const latest = await latestSubscriptionSnapshot(supabase, String(data?.id || ''));
  const incomingTime = Date.parse(data?.attributes?.updated_at);
  const latestTime = Date.parse(latest?.payload?.data?.attributes?.updated_at);
  if (Number.isFinite(latestTime) && (!Number.isFinite(incomingTime) || latestTime > incomingTime)) {
    data = latest.payload.data;
    eventType = latest.event_type;
  }
  const eventTime = Date.parse(data?.attributes?.updated_at || data?.attributes?.created_at);
  // The course row's start stands in for a missing superseded_at only for an
  // id the course actually superseded: one recorded as superseded, or the id a
  // legacy course row still carries. A never-seen subscription id is not
  // dropped for being older than a course bought while its event was delayed.
  const superseded = Boolean(retired?.length)
    || (existing?.plan_type === 'course' && existing.lemonsqueezy_subscription_id === String(data?.id || ''));
  const supersededTime = superseded
    ? Date.parse(retired?.[0]?.payload?.meta?.superseded_at
      || (existing?.plan_type === 'course' ? existing.subscription_start : null) || retired?.[0]?.created_at)
    : NaN;
  if (Number.isFinite(supersededTime) && (!Number.isFinite(eventTime) || eventTime < supersededTime)) {
    return reconcileUserEntitlement(supabase, userId, now);
  }
  const row = subscriptionEventRow(existing, data, eventType, now, { superseded });
  if (row) {
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan_type: row.plan_type,
      status: row.status,
      subscription_start: row.subscription_start,
      subscription_end: row.subscription_end,
      lemonsqueezy_subscription_id: row.lemonsqueezy_subscription_id,
      lemonsqueezy_customer_id: row.lemonsqueezy_customer_id,
      lemonsqueezy_order_id: row.lemonsqueezy_order_id,
      lemonsqueezy_product_id: row.lemonsqueezy_product_id,
      lemonsqueezy_variant_id: row.lemonsqueezy_variant_id,
      price_paid: row.price_paid,
      cancel_at_period_end: row.cancel_at_period_end,
      cancelled_at: row.cancelled_at,
      updated_at: row.updated_at,
    }, { onConflict: 'user_id' });
    if (error) throw error;
  }
  return reconcileUserEntitlement(supabase, userId, now);
}

// E-mail → profile id, matched EXACTLY (case- and whitespace-insensitive),
// never as a pattern. ILIKE treats '_' and '%' as wildcards, so an unescaped
// 'al_ce@…' matched 'alice@…' and a purchase went to the wrong account. The
// pattern is escaped to narrow the candidates ('*' cannot be escaped — PostgREST
// turns every '*' into '%' — so it only widens them) and each candidate is then
// compared literally; more than one literal match is ambiguous and resolves to
// nobody. Used by the webhook's order-to-account fallback and the admin support
// intake.
export async function profileIdForEmail(supabase, email) {
  const wanted = String(email ?? '').trim().toLowerCase();
  if (!wanted) return { id: null, ambiguous: false, error: null };
  const { data, error } = await supabase.from('profiles').select('id, email')
    .ilike('email', wanted.replace(/[\\%_]/g, '\\$&'))
    .limit(10);
  if (error) return { id: null, ambiguous: false, error };
  const exact = (data || []).filter((row) => String(row.email ?? '').trim().toLowerCase() === wanted);
  return { id: exact.length === 1 ? exact[0].id : null, ambiguous: exact.length > 1, error: null };
}
