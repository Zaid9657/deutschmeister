// Admin panel — the user directory.
//
// Every filter that CAN be a database predicate is one; the five that live in
// other tables (activation, failed payment, paying-inactive, power user,
// inconsistent) are post-filters over a wider slice, and the response says
// which were applied where and whether `total` is exact. The count on screen
// is a property of what was asked for, never of what the client downloaded.
// `export` (CSV) is checked BEFORE any row is fetched.
import { adminEndpoint, fetchAll } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import { applyLevelFilter, normalizeLevel, LEVEL_UNKNOWN } from './_shared/adminLevels.mjs';
import { classifyAccess, findDiscrepancies, isFailedPayment } from './_shared/adminOpsLib.mjs';

const PAGE_SIZES = [25, 50, 100];
const SORTS = { created_at: 'created_at', updated_at: 'updated_at', email: 'email', trial_ends_at: 'trial_ends_at' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saved views: declared in code, each with the RULE the UI renders beside it. */
export const SAVED_VIEWS = Object.freeze([
  { id: 'today', label: 'Heute registriert', rule: 'created_at ≥ heute 00:00 UTC', filters: { registeredToday: true } },
  { id: 'week', label: 'Neu diese Woche', rule: 'created_at ≥ vor 7 Tagen', filters: { registeredDays: 7 } },
  { id: 'not_activated', label: 'Nicht aktiviert nach 24 Std.', rule: 'registriert vor > 24 Std. und keine gezählte Nutzung', filters: { registeredBeforeHours: 24, activation: 'none' } },
  { id: 'payment_failed', label: 'Zahlung fehlgeschlagen', rule: "subscriptions.status IN ('past_due','unpaid')", filters: { paymentFailed: true } },
  { id: 'paying_inactive', label: 'Zahlend, aber 7 Tage ohne Aktivität', rule: 'laufendes bezahltes Abo oder Kurskauf und keine gezählte Nutzung in 7 Tagen', filters: { payingInactive: true } },
  { id: 'trial_expiring', label: 'Testphase endet in 48 Std.', rule: 'trial_ends_at in [jetzt, jetzt + 48 Std.]', filters: { trialExpiringHours: 48 } },
  { id: 'power_user', label: 'Power User', rule: '≥ 10 Grammatik-Themen oder ≥ 5 abgeschlossene Sprechsitzungen', filters: { powerUser: true } },
  { id: 'inconsistent', label: 'Inkonsistente Zugänge', rule: 'Profil-Flag und Abo-Zeilen widersprechen sich (findDiscrepancies)', filters: { inconsistent: true } },
  { id: 'staff', label: 'Mitarbeitende', rule: 'profiles.role IS NOT NULL', filters: { hasRole: true } },
]);

const POST_FILTER_KEYS = ['activation', 'paymentFailed', 'payingInactive', 'powerUser', 'inconsistent', 'accessKind'];

function applyServerFilters(q, f, now) {
  if (f.search) {
    const term = String(f.search).trim();
    if (UUID.test(term)) q = q.eq('id', term);
    else {
      const safe = term.replace(/[%,()]/g, '');
      if (safe) q = q.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
    }
  }
  if (f.registeredToday) q = q.gte('created_at', new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString());
  if (f.registeredDays) q = q.gte('created_at', new Date(now.getTime() - Number(f.registeredDays) * 86400000).toISOString());
  if (f.registeredBeforeHours) q = q.lte('created_at', new Date(now.getTime() - Number(f.registeredBeforeHours) * 3600000).toISOString());
  if (f.level === LEVEL_UNKNOWN) q = q.or('current_level.is.null,current_level.eq.a1'); // the legacy default means "never chose"
  else if (normalizeLevel(f.level)) q = applyLevelFilter(q, 'profiles', f.level);
  if (f.examTrack === 'unknown') q = q.is('exam_track', null);
  else if (f.examTrack) q = q.eq('exam_track', String(f.examTrack));
  if (f.tier === 'none') q = q.is('subscription_tier', null);
  else if (f.tier) q = q.eq('subscription_tier', String(f.tier));
  if (f.onboarding === 'done') q = q.not('onboarding_completed_at', 'is', null);
  if (f.onboarding === 'open') q = q.is('onboarding_completed_at', null);
  if (f.trialExpiringHours) q = q.not('trial_ends_at', 'is', null).gte('trial_ends_at', now.toISOString()).lte('trial_ends_at', new Date(now.getTime() + Number(f.trialExpiringHours) * 3600000).toISOString());
  if (f.hasRole) q = q.not('role', 'is', null);
  if (f.role) q = q.eq('role', String(f.role));
  return q;
}

async function joined(supabase, ids, now) {
  if (ids.length === 0) return { subs: new Map(), purchases: new Map(), grammar: new Map(), speaking: new Map(), lastLogin: new Map(), tickets: new Map(), lastActivity: new Map() };
  const group = (rows, key) => {
    const m = new Map();
    for (const r of rows) (m.get(r[key]) || m.set(r[key], []).get(r[key])).push(r);
    return m;
  };
  const [subs, purchases, grammar, speaking, logins, tickets] = await Promise.all([
    fetchAll(() => supabase.from('subscriptions').select('user_id, plan_type, status, price_paid, subscription_end, lemonsqueezy_subscription_id').in('user_id', ids)),
    fetchAll(() => supabase.from('purchases').select('user_id, product_key, status').in('user_id', ids)),
    fetchAll(() => supabase.from('user_grammar_progress').select('user_id, is_completed, last_accessed, created_at').in('user_id', ids)),
    fetchAll(() => supabase.from('speaking_sessions').select('user_id, status, created_at').in('user_id', ids)),
    fetchAll(() => supabase.from('audit_logs').select('user_id, created_at').eq('event_type', 'auth.login').in('user_id', ids).gte('created_at', new Date(now.getTime() - 90 * 86400000).toISOString())),
    fetchAll(() => supabase.from('support_tickets').select('user_id, status, priority').in('user_id', ids).in('status', ['new', 'open', 'waiting_user'])),
  ]);
  const lastLogin = new Map();
  for (const l of logins) if (!lastLogin.has(l.user_id) || l.created_at > lastLogin.get(l.user_id)) lastLogin.set(l.user_id, l.created_at);
  const lastActivity = new Map();
  const bump = (uid, iso) => { if (iso && (!lastActivity.has(uid) || iso > lastActivity.get(uid))) lastActivity.set(uid, iso); };
  for (const g of grammar) bump(g.user_id, g.last_accessed || g.created_at);
  for (const s of speaking) bump(s.user_id, s.created_at);
  return { subs: group(subs, 'user_id'), purchases: group(purchases, 'user_id'), grammar: group(grammar, 'user_id'), speaking: group(speaking, 'user_id'), lastLogin, tickets: group(tickets, 'user_id'), lastActivity };
}

function enrich(p, j, now) {
  const subs = j.subs.get(p.id) || [];
  const purchases = j.purchases.get(p.id) || [];
  const grammar = j.grammar.get(p.id) || [];
  const speaking = j.speaking.get(p.id) || [];
  const access = classifyAccess({ profile: p, subscriptions: subs, purchases, now });
  const discrepancies = findDiscrepancies({ profile: p, subscriptions: subs, purchases, now });
  const counted = grammar.length + speaking.filter((s) => s.status === 'completed').length;
  const lastActivity = j.lastActivity.get(p.id) || null;
  return {
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    createdAt: p.created_at,
    currentLevel: p.current_level,
    examTrack: p.exam_track,
    tier: p.subscription_tier,
    isSubscribed: p.is_subscribed,
    trialEndsAt: p.trial_ends_at,
    onboardingCompletedAt: p.onboarding_completed_at,
    role: p.role,
    access,
    grammarTopics: grammar.length,
    speakingCompleted: speaking.filter((s) => s.status === 'completed').length,
    countedUsage: counted,
    lastActivityAt: lastActivity,
    lastLoginAt: j.lastLogin.get(p.id) || null,
    openTickets: (j.tickets.get(p.id) || []).length,
    urgentTickets: (j.tickets.get(p.id) || []).filter((t) => ['urgent', 'high'].includes(t.priority)).length,
    paymentFailed: subs.some(isFailedPayment),
    discrepancies: discrepancies.length,
    paying: access.kind === 'subscription' && subs.some((s) => Number(s.price_paid || 0) > 0 && s.subscription_end && new Date(s.subscription_end) > now) || access.kind === 'course',
  };
}

function postFilter(rows, f, now) {
  const week = now.getTime() - 7 * 86400000;
  return rows.filter((r) => {
    if (f.activation === 'none' && r.countedUsage > 0) return false;
    if (f.activation === 'some' && r.countedUsage === 0) return false;
    if (f.paymentFailed && !r.paymentFailed) return false;
    if (f.payingInactive && !(r.paying && (!r.lastActivityAt || Date.parse(r.lastActivityAt) < week))) return false;
    if (f.powerUser && !(r.grammarTopics >= 10 || r.speakingCompleted >= 5)) return false;
    if (f.inconsistent && r.discrepancies === 0) return false;
    if (f.accessKind && r.access.kind !== f.accessKind) return false;
    return true;
  });
}

function toCsv(rows) {
  const cols = ['id', 'email', 'fullName', 'createdAt', 'currentLevel', 'examTrack', 'tier', 'isSubscribed', 'trialEndsAt', 'role', 'accessKind', 'grammarTopics', 'speakingCompleted', 'lastActivityAt', 'lastLoginAt', 'openTickets', 'paymentFailed', 'discrepancies'];
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [cols.join(';')];
  for (const r of rows) lines.push(cols.map((c) => esc(c === 'accessKind' ? r.access?.kind : r[c])).join(';'));
  return lines.join('\n');
}

export const handler = adminEndpoint(
  { capabilityFor: (body) => (body.format === 'csv' ? 'export' : 'directory.read') },
  async ({ body, supabase, auth, event }) => {
    const now = new Date();
    const view = SAVED_VIEWS.find((v) => v.id === body.view);
    const f = { ...(view?.filters || {}), ...(body.filters || {}) };
    const pageSize = PAGE_SIZES.includes(Number(body.pageSize)) ? Number(body.pageSize) : 25;
    const page = Math.max(1, Number(body.page) || 1);
    const sortBy = SORTS[body.sortBy] || 'created_at';
    const ascending = body.sortDir === 'asc';
    const activePost = POST_FILTER_KEYS.filter((k) => f[k]);
    const isCsv = body.format === 'csv';

    const base = () => applyServerFilters(supabase.from('profiles').select('id, email, full_name, created_at, updated_at, current_level, exam_track, subscription_tier, is_subscribed, trial_ends_at, onboarding_completed_at, role', { count: 'exact' }), f, now);

    let rows;
    let total;
    let totalIsExact = true;
    if (isCsv) {
      rows = await fetchAll(() => base().order(sortBy, { ascending, nullsFirst: false }), { maxRows: 20000 });
      total = rows.length;
    } else if (activePost.length > 0) {
      // A post-filter over 25 rows would routinely return 3 and call it a page:
      // take a wider, bounded slice and be honest that the total is not exact.
      const slice = Math.min(pageSize * 20, 2000);
      const { data, error } = await base().order(sortBy, { ascending, nullsFirst: false }).range(0, slice - 1);
      if (error) throw new Error(error.message);
      rows = data || [];
      totalIsExact = rows.length < slice;
    } else {
      const from = (page - 1) * pageSize;
      const { data, error, count } = await base().order(sortBy, { ascending, nullsFirst: false }).range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      rows = data || [];
      total = count ?? 0;
    }

    const j = await joined(supabase, rows.map((r) => r.id), now);
    let enriched = rows.map((p) => enrich(p, j, now));
    if (activePost.length > 0) {
      enriched = postFilter(enriched, f, now);
      total = enriched.length;
      enriched = isCsv ? enriched : enriched.slice((page - 1) * pageSize, page * pageSize);
    }

    if (isCsv) {
      await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: 'directory.export', targetType: 'directory', targetId: null, after: { rows: enriched.length, filters: f }, outcome: 'success', source: event.path });
      return { format: 'csv', csv: toCsv(enriched), rows: enriched.length, filename: `nutzer-${now.toISOString().slice(0, 10)}.csv` };
    }

    // Coverage of each filterable dimension, so a filter that only reaches
    // 9 % of users says so instead of quietly hiding everyone else.
    const [examKnown, levelKnown, total_all] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).not('exam_track', 'is', null).neq('exam_track', 'none').then((r) => r.count ?? 0),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).not('current_level', 'is', null).neq('current_level', 'a1').then((r) => r.count ?? 0),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).then((r) => r.count ?? 0),
    ]);

    return {
      rows: enriched,
      page,
      pageSize,
      total,
      totalIsExact,
      appliedFilters: { server: Object.keys(f).filter((k) => !POST_FILTER_KEYS.includes(k)), post: activePost },
      view: view?.id ?? null,
      savedViews: SAVED_VIEWS.map(({ id, label, rule }) => ({ id, label, rule })),
      coverage: { examTrack: { known: examKnown, total: total_all }, level: { known: levelKnown, total: total_all } },
      generatedAt: now.toISOString(),
    };
  },
);
