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

export function subscriptionEventRow(existing, data, eventType, now = Date.now()) {
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
    if (!['active', 'on_trial'].includes(attributes.status)) return null;
    if (existing.plan_type === 'course' && !(Date.parse(attributes.status === 'on_trial' ? attributes.trial_ends_at : attributes.renews_at) > Number(now))) return null;
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

async function recordSupersededId(supabase, userId, subscriptionId) {
  const { error } = await supabase.from('webhook_logs').insert({
    event_type: 'subscription_superseded',
    payload: { meta: { custom_data: { user_id: userId } }, data: { id: subscriptionId } },
    processed: true,
    error: null,
  });
  if (error) throw error;
}

async function retireLegacyCourseId(supabase, subscription, userId, now) {
  if (subscription?.plan_type !== 'course' || !subscription.lemonsqueezy_subscription_id) return subscription;
  await recordSupersededId(supabase, userId, subscription.lemonsqueezy_subscription_id);
  const { error } = await supabase.from('subscriptions').update({
    lemonsqueezy_subscription_id: null, cancel_at_period_end: false, cancelled_at: null, updated_at: new Date(now).toISOString(),
  }).eq('user_id', userId).eq('plan_type', 'course').eq('lemonsqueezy_subscription_id', subscription.lemonsqueezy_subscription_id);
  if (error) throw error;
  return { ...subscription, lemonsqueezy_subscription_id: null, cancel_at_period_end: false, cancelled_at: null };
}

export async function reconcileUserEntitlement(supabase, userId, now = Date.now()) {
  const [subscriptionResult, purchasesResult] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('purchases').select('*').eq('user_id', userId).eq('status', 'active'),
  ]);
  if (subscriptionResult.error) throw subscriptionResult.error;
  if (purchasesResult.error) throw purchasesResult.error;
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
  const purchases = purchasesResult.data || [];
  const course = latestCourseWindow(purchases, now);
  const liveRecurring = subscription?.plan_type !== 'course' && subscriptionHasPaidAccess(subscription, now);
  // Keep a recoverable recurring row so a later successful retry can find it.
  const recoverableRecurring = subscription?.lemonsqueezy_subscription_id && subscription?.plan_type !== 'course'
    && (ACCESS_STATUSES.has(subscription.status) || subscription.status === 'unpaid');
  const nowIso = new Date(now).toISOString();
  if (!liveRecurring && !recoverableRecurring && course) {
    if (subscription?.lemonsqueezy_subscription_id) {
      // Preserve retired identities before clearing the one-row subscription
      // slot. An old expiry/replay can then never take over a course window.
      await recordSupersededId(supabase, userId, subscription.lemonsqueezy_subscription_id);
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
      .update({ status: 'expired', lemonsqueezy_subscription_id: null, updated_at: nowIso }).eq('user_id', userId);
    if (error) throw error;
    subscription = { ...subscription, status: 'expired', lemonsqueezy_subscription_id: null };
  }
  const isSubscribed = !!(liveRecurring || course);
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    is_subscribed: isSubscribed,
    subscription_tier: isSubscribed ? 'pro' : 'free',
    updated_at: nowIso,
  }, { onConflict: 'id' });
  if (error) throw error;
  return { subscription, purchases, isSubscribed };
}

export async function reconcileSubscriptionEvent(supabase, userId, data, eventType, now = Date.now()) {
  const { data: current, error: lookupError } = await supabase.from('subscriptions')
    .select('*').eq('user_id', userId).maybeSingle();
  if (lookupError) throw lookupError;
  const existing = await retireLegacyCourseId(supabase, current, userId, now);
  const { data: retired, error: retiredError } = await supabase.from('webhook_logs').select('id')
    .eq('event_type', 'subscription_superseded').eq('payload->data->>id', String(data?.id || '')).limit(1);
  if (retiredError) throw retiredError;
  if (retired?.length) return reconcileUserEntitlement(supabase, userId, now);
  // Compare provider timestamps in stored snapshots, never the row's local
  // updated_at (price writes and administrative changes also update it).
  const { data: snapshots, error: snapshotError } = await supabase.from('webhook_logs')
    .select('event_type, payload')
    .in('event_type', SUBSCRIPTION_EVENTS)
    .eq('payload->data->>id', String(data?.id || ''))
    .order('payload->data->attributes->>updated_at', { ascending: false, nullsFirst: false })
    .limit(1);
  if (snapshotError) throw snapshotError;
  const latest = snapshots?.[0];
  const incomingTime = Date.parse(data?.attributes?.updated_at);
  const latestTime = Date.parse(latest?.payload?.data?.attributes?.updated_at);
  if (Number.isFinite(latestTime) && (!Number.isFinite(incomingTime) || latestTime > incomingTime)) {
    data = latest.payload.data;
    eventType = latest.event_type;
  }
  const row = subscriptionEventRow(existing, data, eventType, now);
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
