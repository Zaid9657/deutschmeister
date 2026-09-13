// Admin panel — the cockpit.
//
// One clock (`to` captured once), explicit inclusive-start/exclusive-end
// windows plus the previous window of equal length, five metric groups in
// Promise.all each wrapped in safe() (a broken group is { error }, never 0),
// and the payload says which groups the level filter reached.
import { adminEndpoint, safe, rate, fetchAll, exactCount, counting, deployDiagnostics } from './_shared/adminHttp.mjs';
import { windowFor, buildFunnelStages, retentionCohorts, reconcileCoverage, seriesFor } from './_shared/adminFunnelLib.mjs';
import { paymentsFromWebhookRows, sumByCurrency, dailySeries, mrrFromSubscriptions } from './_shared/adminRevenueLib.mjs';
import { isFailedPayment } from './_shared/adminOpsLib.mjs';
import { normalizeLevel, applyLevelFilter, LEVEL_UNKNOWN } from './_shared/adminLevels.mjs';
import { METRICS } from './_shared/adminMetricNames.mjs';

const COURSE_ENV_KEYS = Object.keys(process.env).filter((k) => /^LEMONSQUEEZY_(COURSE_|TELC_).*_VARIANT_ID$/.test(k));
const courseVariantIds = () => new Set(COURSE_ENV_KEYS.map((k) => String(process.env[k])).filter(Boolean));

function inWindow(iso, from, to) {
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= Date.parse(from) && t < Date.parse(to);
}

async function revenueGroup(supabase, w) {
  const rows = await fetchAll(() =>
    supabase.from('webhook_logs').select('event_type, payload, created_at').in('event_type', ['order_created', 'subscription_payment_success']).order('created_at', { ascending: true }),
  );
  const payments = paymentsFromWebhookRows(rows, { courseVariantIds: courseVariantIds() });
  return {
    current: sumByCurrency(payments, w.from, w.to),
    previous: sumByCurrency(payments, w.previousFrom, w.previousTo),
    allTime: sumByCurrency(payments),
    series: dailySeries(payments, w.from, w.to, 'EUR'),
    recent: payments
      .filter((p) => inWindow(p.at, w.from, w.to))
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 20)
      .map((p) => ({ at: p.at, kind: p.kind, currency: p.currency, net: p.net, gross: p.gross, product: p.productName, orderId: p.orderId ? `••••${p.orderId.slice(-4)}` : null })),
    paymentsCounted: payments.length,
    webhookRows: rows.length,
  };
}

async function subsGroup(supabase, now) {
  const rows = await fetchAll(() => supabase.from('subscriptions').select('id, user_id, plan_type, status, price_paid, subscription_end, cancel_at_period_end, lemonsqueezy_subscription_id'));
  const live = rows.filter((s) => s.subscription_end && new Date(s.subscription_end) > now);
  const byStatus = {};
  const byPlan = {};
  for (const s of live) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    byPlan[s.plan_type] = (byPlan[s.plan_type] || 0) + 1;
  }
  const { mrr, paying, atRisk, byPlan: mrrByPlan } = mrrFromSubscriptions(rows, now);
  return {
    total: rows.length,
    live: live.length,
    byStatus,
    byPlan,
    mrr,
    mrrByPlan,
    paying,
    atRisk,
    pastDue: rows.filter(isFailedPayment).length,
    cancelAtPeriodEnd: live.filter((s) => s.cancel_at_period_end).length,
    manual: live.filter((s) => !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0).length,
  };
}

async function activitySets(supabase, level) {
  // Every table that means "this person used the product", each filtered
  // for the level with its own casing (or unfiltered for level = all).
  const grammarTopics = await fetchAll(() => supabase.from('grammar_topics').select('id, sub_level'));
  const topicLevel = new Map(grammarTopics.map((t) => [t.id, String(t.sub_level).toLowerCase()]));
  const grammar = await fetchAll(() => supabase.from('user_grammar_progress').select('user_id, topic_id, created_at, last_accessed, is_completed'));
  const grammarRows = level && level !== LEVEL_UNKNOWN ? grammar.filter((g) => topicLevel.get(g.topic_id) === level) : grammar;
  const speaking = await fetchAll(() => applyLevelFilter(supabase.from('speaking_sessions').select('user_id, session_token, status, created_at, completed_at, duration_seconds, mode, level'), 'speaking_sessions', level));
  const lessons = await fetchAll(() => applyLevelFilter(supabase.from('lesson_progress').select('user_id, level, status, completed_at, updated_at'), 'lesson_progress', level));
  const listening = level ? [] : await fetchAll(() => supabase.from('user_listening_progress').select('user_id, completed_at'));
  const reading = level ? [] : await fetchAll(() => supabase.from('user_reading_progress').select('user_id, last_read_at, created_at'));
  const started = new Set();
  const counted = new Set();
  const activity = new Map(); // user → [ms]
  const push = (uid, iso) => {
    if (!uid) return;
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return;
    (activity.get(uid) || activity.set(uid, []).get(uid)).push(t);
  };
  for (const g of grammarRows) { started.add(g.user_id); counted.add(g.user_id); push(g.user_id, g.created_at); push(g.user_id, g.last_accessed); }
  for (const s of speaking) { started.add(s.user_id); if (s.status === 'completed') counted.add(s.user_id); push(s.user_id, s.created_at); }
  for (const l of lessons) { started.add(l.user_id); if (l.status === 'completed') counted.add(l.user_id); push(l.user_id, l.updated_at || l.completed_at); }
  for (const l of listening) { started.add(l.user_id); push(l.user_id, l.completed_at); }
  for (const r of reading) { started.add(r.user_id); push(r.user_id, r.last_read_at || r.created_at); }
  return { started, counted, activity, grammarRows, speaking, lessons, topicLevel };
}

async function usersGroup(supabase, w, now, level, sets) {
  const profiles = await fetchAll(() => supabase.from('profiles').select('id, created_at, exam_track, onboarding_completed_at, current_level, is_subscribed, subscription_tier, trial_ends_at'));
  const total = profiles.length;
  const inW = (p) => inWindow(p.created_at, w.from, w.to);
  const inPrev = (p) => inWindow(p.created_at, w.previousFrom, w.previousTo);
  const levelOf = (p) => normalizeLevel(p.current_level);
  const cohortAll = profiles.filter(inW);
  const cohort = level === LEVEL_UNKNOWN ? cohortAll.filter((p) => !levelOf(p)) : level ? cohortAll.filter((p) => levelOf(p) === level) : cohortAll;

  const since7 = new Date(now.getTime() - 7 * 86400000).toISOString();
  const since28 = new Date(now.getTime() - 28 * 86400000).toISOString();
  const logins = await fetchAll(() => supabase.from('audit_logs').select('user_id, created_at').eq('event_type', 'auth.login').gte('created_at', since28));
  const login7 = new Set(logins.filter((l) => l.created_at >= since7).map((l) => l.user_id));
  const login28 = new Set(logins.map((l) => l.user_id));

  const purchases = await fetchAll(() => supabase.from('purchases').select('user_id, status').eq('status', 'active'));
  const subs = await fetchAll(() => supabase.from('subscriptions').select('user_id, price_paid, subscription_end, status'));
  const payingUsers = new Set([
    ...subs.filter((s) => s.subscription_end && new Date(s.subscription_end) > now && Number(s.price_paid || 0) > 0).map((s) => s.user_id),
    ...purchases.map((p) => p.user_id),
  ]);

  const funnel = buildFunnelStages({
    cohortIds: cohort.map((p) => p.id),
    trackChosenIds: new Set(cohort.filter((p) => p.exam_track && p.exam_track !== 'none').map((p) => p.id)),
    onboardedIds: new Set(cohort.filter((p) => p.onboarding_completed_at).map((p) => p.id)),
    startedIds: sets.started,
    countedIds: sets.counted,
  });

  const grammarFirst = new Map();
  const grammarCount = new Map();
  for (const g of sets.grammarRows) {
    grammarCount.set(g.user_id, (grammarCount.get(g.user_id) || 0) + 1);
    const t = Date.parse(g.created_at);
    if (!grammarFirst.has(g.user_id) || t < grammarFirst.get(g.user_id)) grammarFirst.set(g.user_id, t);
  }
  const cohortIds = new Set(cohort.map((p) => p.id));
  const grammarCohort = [...grammarFirst.keys()].filter((id) => cohortIds.has(id));
  const oneAndDone = grammarCohort.filter((id) => grammarCount.get(id) === 1).length;

  const cohorts = retentionCohorts({ users: profiles.filter((p) => Date.parse(p.created_at) > now.getTime() - 9 * 7 * 86400000), activityByUser: sets.activity, weeks: 8, horizon: 4, now: now.getTime() });

  return {
    total,
    newInWindow: cohortAll.length,
    newInPrevious: profiles.filter(inPrev).length,
    signupSeries: seriesFor(cohortAll, w.from, w.to),
    loginActive7: login7.size,
    loginActive28: login28.size,
    activated: sets.counted.size,
    activatedAny: sets.started.size,
    paying: payingUsers.size,
    trialLive: profiles.filter((p) => p.trial_ends_at && new Date(p.trial_ends_at) > now).length,
    funnel,
    funnelCohort: cohort.length,
    grammarCohort: { cohort: grammarCohort.length, oneAndDone, rate: rate(oneAndDone, grammarCohort.length) },
    cohorts,
    levelCoverage: { known: profiles.filter((p) => levelOf(p)).length, total },
  };
}

async function productGroup(supabase, w, level, sets) {
  const speakingW = sets.speaking.filter((s) => inWindow(s.created_at, w.from, w.to));
  const speakingPrev = sets.speaking.filter((s) => inWindow(s.created_at, w.previousFrom, w.previousTo));
  const completed = speakingW.filter((s) => s.status === 'completed');
  const tokens = speakingW.map((s) => s.session_token).filter(Boolean);
  const evals = tokens.length
    ? await fetchAll(() => supabase.from('speaking_evaluations').select('session_token, score, total_score, created_at').in('session_token', tokens))
    : [];
  const coverage = reconcileCoverage(speakingW, evals);
  const grammarW = sets.grammarRows.filter((g) => inWindow(g.last_accessed || g.created_at, w.from, w.to));
  const grammarPrev = sets.grammarRows.filter((g) => inWindow(g.last_accessed || g.created_at, w.previousFrom, w.previousTo));
  const lessonsW = sets.lessons.filter((l) => inWindow(l.updated_at || l.completed_at, w.from, w.to));
  const byMode = {};
  for (const s of speakingW) byMode[s.mode || 'unbekannt'] = (byMode[s.mode || 'unbekannt'] || 0) + 1;
  return {
    speaking: {
      started: speakingW.length,
      startedPrevious: speakingPrev.length,
      completed: completed.length,
      completedRate: rate(completed.length, speakingW.length),
      byMode,
      series: seriesFor(speakingW, w.from, w.to),
      coverage,
    },
    grammar: {
      activeUsers: new Set(grammarW.map((g) => g.user_id)).size,
      activeUsersPrevious: new Set(grammarPrev.map((g) => g.user_id)).size,
      topicsTouched: grammarW.length,
      topicsCompleted: grammarW.filter((g) => g.is_completed).length,
    },
    lessons: {
      rows: lessonsW.length,
      completed: lessonsW.filter((l) => l.status === 'completed').length,
      users: new Set(lessonsW.map((l) => l.user_id)).size,
      instrumented: sets.lessons.length > 0,
      reason: sets.lessons.length > 0 ? null : 'lesson_progress hält noch keine Zeilen — der Kurs-Player ist live, hat aber noch keine Lernenden.',
      unblock: 'Erste Lernende durch den A1.1-Kurs führen; die Tabelle füllt sich mit dem Player.',
    },
    levelApplied: level || null,
  };
}

async function opsGroup(supabase, w) {
  const failedWebhooks = await exactCount(() => counting(supabase, 'webhook_logs').eq('processed', false).gte('created_at', w.from).lt('created_at', w.to));
  const totalWebhooks = await exactCount(() => counting(supabase, 'webhook_logs').gte('created_at', w.from).lt('created_at', w.to));
  const lifecycle = await fetchAll(() => supabase.from('lifecycle_emails').select('kind, sent_at').gte('sent_at', w.from).lt('sent_at', w.to));
  const byKind = {};
  for (const l of lifecycle) byKind[l.kind.replace(/_\d{4}-\d{2}-\d{2}$/, '_*')] = (byKind[l.kind.replace(/_\d{4}-\d{2}-\d{2}$/, '_*')] || 0) + 1;
  const { data: weekly } = await supabase.from('weekly_metrics').select('measured_at').order('measured_at', { ascending: false }).limit(1).maybeSingle();
  const openTickets = await exactCount(() => counting(supabase, 'support_tickets').in('status', ['new', 'open', 'waiting_user']));
  const paymentFailures = await exactCount(() => counting(supabase, 'payment_failures').gte('failed_at', w.from).lt('failed_at', w.to));
  return { failedWebhooks, totalWebhooks, lifecycleSent: byKind, lastWeeklyTruth: weekly?.measured_at ?? null, openTickets, paymentFailures };
}

export const handler = adminEndpoint({ capability: 'reports.read' }, async ({ body, supabase, requestId }) => {
  const now = new Date(); // ONE clock
  const range = ['7d', '30d', '90d'].includes(body.range) ? body.range : '30d';
  const w = windowFor(range, now);
  const rawLevel = body.level;
  const level = rawLevel === LEVEL_UNKNOWN ? LEVEL_UNKNOWN : normalizeLevel(rawLevel); // null = all

  const sets = await activitySets(supabase, level === LEVEL_UNKNOWN ? null : level);
  const [revenue, subs, users, product, ops] = await Promise.all([
    safe('revenue', () => revenueGroup(supabase, w)),
    safe('subs', () => subsGroup(supabase, now)),
    safe('users', () => usersGroup(supabase, w, now, level, sets)),
    safe('product', () => productGroup(supabase, w, level === LEVEL_UNKNOWN ? null : level, sets)),
    safe('ops', () => opsGroup(supabase, w)),
  ]);
  const errors = [revenue, subs, users, product, ops].filter((g) => g.error).map((g) => g.error);
  return {
    range,
    level: level || 'all',
    ...w,
    timezone: 'UTC',
    levelFilterApplies: ['product.speaking', 'product.grammar', 'product.lessons', 'users.funnel', 'users.activated', 'users.grammarCohort'],
    levelFilterExcluded: ['revenue', 'subs', 'ops', 'users.total', 'users.newInWindow', 'users.loginActive7', 'users.loginActive28', 'users.paying', 'users.cohorts'],
    metrics: METRICS,
    revenue, subs, users, product, ops,
    generatedAt: now.toISOString(),
    diagnostics: { requestId, ...deployDiagnostics(), appliedFilters: { range, level: level || 'all' }, errors },
  };
});
