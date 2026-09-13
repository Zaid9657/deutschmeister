// Admin panel — User 360. One request, eight panels; a panel the caller may
// not see is returned as null (the screen says "nicht erlaubt"), never
// omitted. Conversation content is NOT returned: the learning panel carries
// scores, durations and status — the shape of the performance, not its words.
// Provider references are masked to their last four characters.
import { adminEndpoint, badRequest, notFound, fetchAll } from './_shared/adminHttp.mjs';
import { maskRef } from './_shared/adminRbacLib.mjs';
import { classifyAccess, findDiscrepancies, gateReads } from './_shared/adminOpsLib.mjs';
import { paymentsFromWebhookRows } from './_shared/adminRevenueLib.mjs';
import { slaState } from './_shared/adminSupportLib.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const handler = adminEndpoint({ capability: 'user360.read' }, async ({ body, supabase, auth }) => {
  const id = String(body.userId || '');
  if (!UUID.test(id)) throw badRequest('userId muss eine UUID sein.');
  const now = new Date();
  const can = (c) => auth.capabilities.includes(c);

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw notFound('Kein Profil mit dieser ID.');

  const [{ data: authUser }, subs, purchases, wallet] = await Promise.all([
    supabase.auth.admin.getUserById(id).catch(() => ({ data: null })),
    fetchAll(() => supabase.from('subscriptions').select('*').eq('user_id', id).order('subscription_end', { ascending: false })),
    fetchAll(() => supabase.from('purchases').select('*').eq('user_id', id)),
    supabase.from('speaking_wallet').select('balance_cents, updated_at').eq('user_id', id).maybeSingle().then((r) => r.data),
  ]);
  const u = authUser?.user || null;
  const latestEnd = subs.map((s) => s.subscription_end).filter(Boolean).sort().at(-1) || null;

  const account = {
    id,
    email: profile.email,
    fullName: profile.full_name,
    createdAt: profile.created_at,
    emailConfirmedAt: u?.email_confirmed_at ?? null,
    lastSignInAt: u?.last_sign_in_at ?? null,
    preferredLanguage: profile.preferred_language,
    currentLevel: profile.current_level,
    examTrack: profile.exam_track,
    examDate: profile.exam_date,
    dailyGoalTarget: profile.daily_goal_target,
    onboardingCompletedAt: profile.onboarding_completed_at,
    emailDailySentence: profile.email_daily_sentence,
    role: profile.role,
    source: 'profiles + auth.users',
  };

  const access = {
    classification: classifyAccess({ profile, subscriptions: subs, purchases, now }),
    tier: profile.subscription_tier,
    isSubscribed: profile.is_subscribed,
    trialStartedAt: profile.trial_started_at,
    trialEndsAt: profile.trial_ends_at,
    trialLive: profile.trial_ends_at ? new Date(profile.trial_ends_at) > now : false,
    latestSubscriptionEnd: latestEnd,
    subscriptionLive: latestEnd ? new Date(latestEnd) > now : false,
    purchases: purchases.map((p) => ({ productKey: p.product_key, status: p.status, accessUntil: p.access_until, createdAt: p.created_at, pricePaid: p.price_paid, manual: String(p.lemonsqueezy_order_id || '').startsWith('manual-') })),
    gateReads: gateReads({ latestSubscriptionEnd: latestEnd, hasPurchases: purchases.some((p) => p.status === 'active'), trialEndsAt: profile.trial_ends_at, now }),
    walletCents: wallet?.balance_cents ?? null,
    source: 'profiles, subscriptions, purchases, speaking_wallet',
  };

  const subscriptions = subs.map((s) => ({
    id: s.id,
    planType: s.plan_type,
    status: s.status,
    pricePaid: s.price_paid,
    subscriptionStart: s.subscription_start,
    subscriptionEnd: s.subscription_end,
    cancelAtPeriodEnd: s.cancel_at_period_end,
    cancelledAt: s.cancelled_at,
    createdAt: s.created_at,
    lsSubscription: maskRef(s.lemonsqueezy_subscription_id),
    lsOrder: maskRef(s.lemonsqueezy_order_id),
    lsVariant: s.lemonsqueezy_variant_id,
    manual: !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0,
    live: s.subscription_end ? new Date(s.subscription_end) > now : false,
  }));

  let payments = null;
  if (can('finance.read')) {
    const email = (profile.email || '').toLowerCase();
    const rows = await fetchAll(() => supabase.from('webhook_logs').select('event_type, payload, created_at').in('event_type', ['order_created', 'subscription_payment_success', 'order_refunded', 'subscription_payment_failed']).order('created_at', { ascending: false }));
    const mine = rows.filter((r) => r.payload?.meta?.custom_data?.user_id === id || String(r.payload?.data?.attributes?.user_email || '').toLowerCase() === email);
    const list = paymentsFromWebhookRows(mine);
    const failures = await fetchAll(() => supabase.from('payment_failures').select('failed_at, lemonsqueezy_subscription_id').eq('user_id', id));
    payments = {
      rows: list.map((p) => ({ at: p.at, kind: p.kind, currency: p.currency, gross: p.gross, tax: p.tax, refunded: p.refunded, net: p.net, product: p.productName, order: maskRef(p.orderId) })),
      failures: failures.map((f) => ({ failedAt: f.failed_at, subscription: maskRef(f.lemonsqueezy_subscription_id) })),
      source: 'webhook_logs (Lemon Squeezy), payment_failures',
    };
  }

  let learning = null;
  if (can('user360.learning')) {
    const [grammar, topics, speaking, listening, reading, lessons, exams, writing, srs, learned] = await Promise.all([
      fetchAll(() => supabase.from('user_grammar_progress').select('topic_id, current_stage, is_completed, score, stars, attempts, time_spent, last_accessed, created_at').eq('user_id', id)),
      fetchAll(() => supabase.from('grammar_topics').select('id, sub_level, slug, title_de')),
      fetchAll(() => supabase.from('speaking_sessions').select('session_token, level, mode, status, duration_seconds, user_turns, evaluated, passed, planned_minutes, cost_cents, created_at, completed_at').eq('user_id', id).order('created_at', { ascending: false })),
      supabase.from('user_listening_progress').select('*', { count: 'exact', head: true }).eq('user_id', id).then((r) => r.count ?? 0),
      supabase.from('user_reading_progress').select('*', { count: 'exact', head: true }).eq('user_id', id).then((r) => r.count ?? 0),
      fetchAll(() => supabase.from('lesson_progress').select('level, lektion_id, status, accuracy, completed_at, updated_at').eq('user_id', id)),
      fetchAll(() => supabase.from('exam_attempts').select('exam_key, section, status, score, max_score, started_at, completed_at').eq('user_id', id).order('started_at', { ascending: false })),
      supabase.from('writing_submissions').select('*', { count: 'exact', head: true }).eq('user_id', id).then((r) => r.count ?? 0),
      supabase.from('vocab_srs_cards').select('*', { count: 'exact', head: true }).eq('user_id', id).then((r) => r.count ?? 0),
      supabase.from('learned_items').select('*', { count: 'exact', head: true }).eq('user_id', id).then((r) => r.count ?? 0),
    ]);
    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const evals = speaking.length
      ? await fetchAll(() => supabase.from('speaking_evaluations').select('session_token, score, total_score, created_at').in('session_token', speaking.map((s) => s.session_token).filter(Boolean)))
      : [];
    const evalBy = new Map();
    for (const e of evals) if (!evalBy.has(e.session_token)) evalBy.set(e.session_token, e.total_score ?? e.score ?? null);
    learning = {
      grammar: grammar
        .map((g) => ({ ...g, level: topicMap.get(g.topic_id)?.sub_level ?? null, slug: topicMap.get(g.topic_id)?.slug ?? null, title: topicMap.get(g.topic_id)?.title_de ?? null }))
        .sort((a, b) => ((a.last_accessed || a.created_at) < (b.last_accessed || b.created_at) ? 1 : -1)),
      speaking: speaking.map((s) => ({ ...s, score: evalBy.get(s.session_token) ?? null, session_token: undefined, token: maskRef(s.session_token) })),
      lessons,
      exams,
      counts: { listening, reading, writing, srsCards: srs, learnedItems: learned },
      source: 'user_grammar_progress, speaking_sessions (+evaluations, keine Transkripte), lesson_progress, exam_attempts, Zählungen',
    };
  }

  let tickets = null;
  if (can('support.read')) {
    const rows = await fetchAll(() => supabase.from('support_tickets').select('id, reference, subject, status, priority, category, created_at, last_activity_at, first_response_at, sla_due_at').eq('user_id', id).order('last_activity_at', { ascending: false }));
    tickets = { rows: rows.map((t) => ({ ...t, sla: slaState(t, now) })), source: 'support_tickets' };
  }

  let audit = null;
  if (can('audit.read')) {
    const rows = await fetchAll(() => supabase.from('admin_audit_log').select('id, occurred_at, actor_id, actor_role, action, reason, outcome, before_state, after_state').eq('target_id', id).order('occurred_at', { ascending: false }).limit(50));
    const actorIds = [...new Set(rows.map((r) => r.actor_id))];
    const { data: actors } = actorIds.length ? await supabase.from('profiles').select('id, email').in('id', actorIds) : { data: [] };
    const emailOf = new Map((actors || []).map((a) => [a.id, a.email]));
    audit = { rows: rows.map((r) => ({ ...r, actor_email: emailOf.get(r.actor_id) || null })), source: 'admin_audit_log' };
  }

  const lifecycle = await fetchAll(() => supabase.from('lifecycle_emails').select('kind, sent_at').eq('user_id', id).order('sent_at', { ascending: false }));

  return {
    account,
    access,
    subscriptions,
    payments,
    learning,
    tickets,
    audit,
    lifecycle: { rows: lifecycle, source: 'lifecycle_emails' },
    discrepancies: findDiscrepancies({ profile, subscriptions: subs, purchases, now }),
    permitted: { payments: can('finance.read'), learning: can('user360.learning'), tickets: can('support.read'), audit: can('audit.read'), actions: can('entitlement.write') },
    generatedAt: now.toISOString(),
  };
});
