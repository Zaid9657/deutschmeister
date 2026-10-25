// Admin panel — the write actions. Capability entitlement.write (admin only).
// The client never writes to the database directly; every mutation is an
// action here: validated first, acting second, ONE audit row with before →
// after, the new state returned, failing closed. A PostgREST update that
// matches nothing succeeds — so every write uses .select() and a zero-row
// check before it is allowed to report success.
//
// Provider-mutating actions: NONE. Lemon Squeezy is dashboard-only for this
// product (CLAUDE.md); nothing here calls its API. Cancelling a subscription
// happens in the LS dashboard, and the webhook updates the row.
import { adminEndpoint, badRequest, notFound, conflict } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import { ROLES } from './_shared/adminRbacLib.mjs';
import { PRODUCT_KEYS } from './_shared/adminOpsLib.mjs';
import { flagsFromRows } from './_shared/adminEntitlement.mjs';
import { subscriptionHasPaidAccess, latestCourseWindow, reconcileUserEntitlement, GRANT_WINDOW_PRODUCT } from './_shared/subscriptionEntitlement.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_PRO_DAYS = 365;
export const MAX_TRIAL_DAYS = 60;
const TIERS = ['free', 'trial', 'pro', 'premium'];

export const ACTIONS = Object.freeze({
  grant_pro_days: { label: 'Pro-Tage gutschreiben', sensitive: true, params: ['days'], writes: 'subscriptions (manuelle Zeile, price_paid 0 — eine abgelaufene Abo-/Kurszeile wird übernommen, laufende Abrechnung abgelehnt) + profiles.is_subscribed/subscription_tier' },
  revoke_manual_access: { label: 'Manuellen Zugang beenden', sensitive: true, params: [], writes: 'subscriptions (manuelle Zeilen → expired) + profiles-Flags neu berechnet' },
  grant_course: { label: 'Kurs freischalten', sensitive: true, params: ['productKey'], writes: 'purchases (manual-…, price_paid 0)' },
  revoke_course: { label: 'Kursfreischaltung zurücknehmen', sensitive: true, params: ['productKey'], writes: 'purchases.status → refunded' },
  extend_trial: { label: 'Testphase verlängern', sensitive: true, params: ['days'], writes: 'profiles.trial_ends_at' },
  set_tier: { label: 'Tier setzen', sensitive: true, params: ['tier'], writes: 'profiles.subscription_tier + is_subscribed' },
  sync_flags: { label: 'Profil-Flags mit Abos abgleichen', sensitive: false, params: [], writes: 'profiles.is_subscribed/subscription_tier aus den laufenden Abos' },
  set_role: { label: 'Admin-Rolle setzen', sensitive: true, params: ['role'], writes: 'profiles.role' },
});


async function loadUser(supabase, userId) {
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!profile) throw notFound('Kein Profil mit dieser ID.');
  const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', userId);
  const { data: purchases } = await supabase.from('purchases').select('*').eq('user_id', userId);
  return { profile, subs: subs || [], purchases: purchases || [] };
}

async function updateProfile(supabase, userId, patch) {
  const { data, error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw conflict('Profil-Update hat keine Zeile getroffen.');
}

// Recompute the profile flags from the rows — except that an explicit premium
// grant survives: only set_tier changes the tier. The writes are conditional on
// the tier, like reconcileUserEntitlement's, so a premium grant made after this
// action read the profile is never overwritten.
async function applyFlags(supabase, userId, profile, subs, purchases, now) {
  const premium = profile.subscription_tier === 'premium';
  const flags = premium ? { is_subscribed: true, subscription_tier: 'premium' } : flagsFromRows(subs, purchases, now);
  const updatedAt = new Date().toISOString();
  const write = supabase.from('profiles').update(premium ? { is_subscribed: true, updated_at: updatedAt } : { ...flags, updated_at: updatedAt }).eq('id', userId);
  const { data, error } = await (premium ? write.eq('subscription_tier', 'premium') : write.or('subscription_tier.is.null,subscription_tier.neq.premium')).select('id');
  if (error) throw new Error(error.message);
  if (data?.length) return flags;
  // Nothing matched: the tier changed since the read. A premium grant made meanwhile stands.
  const { data: fresh, error: freshError } = await supabase.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle();
  if (freshError) throw new Error(freshError.message);
  if (!premium && fresh?.subscription_tier === 'premium') return { is_subscribed: true, subscription_tier: 'premium' };
  throw conflict('Profil-Update hat keine Zeile getroffen.');
}

// Statuses whose Lemon Squeezy subscription can still bill or recover.
const RECOVERABLE_BILLING = ['active', 'on_trial', 'past_due', 'paused', 'unpaid'];

/** Why a non-manual row must not become a manual grant, or null when it grants and keeps nothing. */
function grantBlocker(row, purchases, now) {
  if (row.lemonsqueezy_subscription_id && (row.plan_type === 'course' || subscriptionHasPaidAccess(row, now) || RECOVERABLE_BILLING.includes(row.status))) {
    return 'Laufendes oder noch wiederherstellbares Lemon-Squeezy-Abo — Pro-Zeit dort verlängern, nicht hier (es gibt nur eine Abo-Zeile pro Person).';
  }
  if (subscriptionHasPaidAccess(row, now) || latestCourseWindow(purchases, now)) {
    return 'Laufender bezahlter Zugang (Kurs-Pro-Fenster) — die einzige Abo-Zeile ist belegt; Pro-Tage erst nach dessen Ende gutschreiben.';
  }
  return null;
}

const HANDLERS = {
  async grant_pro_days({ supabase, userId, params, now }) {
    const days = Number(params.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_PRO_DAYS) throw badRequest(`days muss eine ganze Zahl zwischen 1 und ${MAX_PRO_DAYS} sein.`);
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    const manual = subs.find((s) => !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0 && s.plan_type !== 'course');
    // subscriptions holds ONE row per user (UNIQUE(user_id), which every
    // webhook upsert relies on): without a manual row, the grant takes over the
    // existing row or is refused — inserting a second row always fails.
    const occupied = manual ? null : subs[0] || null;
    if (occupied) {
      const blocker = grantBlocker(occupied, purchases, now);
      if (blocker) throw conflict(blocker, { row: { id: occupied.id, plan_type: occupied.plan_type, status: occupied.status, subscription_end: occupied.subscription_end } });
    }
    // A taken-over row grants nothing, so its end never extends the grant.
    const latestEnd = (occupied ? [] : subs).map((s) => s.subscription_end).filter(Boolean).map((d) => new Date(d)).sort((a, b) => b - a)[0];
    const base = latestEnd && latestEnd > now ? latestEnd : now;
    const newEnd = new Date(base.getTime() + days * 86400000).toISOString();
    const before = {
      manualRow: manual ? { id: manual.id, subscription_end: manual.subscription_end, status: manual.status } : null,
      supersededRow: occupied ? {
        id: occupied.id, plan_type: occupied.plan_type, status: occupied.status, subscription_end: occupied.subscription_end, price_paid: occupied.price_paid ?? null,
        lemonsqueezy_subscription_id: occupied.lemonsqueezy_subscription_id ?? null, lemonsqueezy_customer_id: occupied.lemonsqueezy_customer_id ?? null,
        lemonsqueezy_order_id: occupied.lemonsqueezy_order_id ?? null, lemonsqueezy_product_id: occupied.lemonsqueezy_product_id ?? null,
        lemonsqueezy_variant_id: occupied.lemonsqueezy_variant_id ?? null,
      } : null,
      profile: { is_subscribed: profile.is_subscribed, subscription_tier: profile.subscription_tier },
    };
    let rowId;
    if (manual) {
      const { data, error } = await supabase.from('subscriptions').update({ subscription_end: newEnd, status: 'active', updated_at: now.toISOString() }).eq('id', manual.id).select('id');
      if (error) throw new Error(error.message);
      if (!data?.length) throw conflict('Abo-Zeile nicht getroffen.');
      rowId = manual.id;
    } else if (occupied) {
      // The row grants and keeps nothing (an expired Lemon Squeezy row, one
      // cancelled past its end, an ended course row): it becomes the manual
      // grant. Its provider ids are cleared — a manual row has none — and kept
      // in the audit entry (before.supersededRow). Conditional on the state
      // just checked, so a webhook that changed the row meanwhile wins.
      let take = supabase.from('subscriptions').update({
        plan_type: 'monthly', status: 'active', subscription_start: now.toISOString(), subscription_end: newEnd, price_paid: 0,
        lemonsqueezy_subscription_id: null, lemonsqueezy_customer_id: null, lemonsqueezy_order_id: null,
        lemonsqueezy_product_id: null, lemonsqueezy_variant_id: null, cancel_at_period_end: false, cancelled_at: null,
        updated_at: now.toISOString(),
      }).eq('id', occupied.id).eq('status', occupied.status);
      take = occupied.lemonsqueezy_subscription_id ? take.eq('lemonsqueezy_subscription_id', occupied.lemonsqueezy_subscription_id) : take.is('lemonsqueezy_subscription_id', null);
      const { data, error } = await take.select('id');
      if (error) throw new Error(error.message);
      if (!data?.length) throw conflict('Die Abo-Zeile hat sich gerade geändert — bitte neu laden und erneut prüfen.');
      rowId = occupied.id;
    } else {
      const { data, error } = await supabase.from('subscriptions').insert({ user_id: userId, plan_type: 'monthly', status: 'active', subscription_start: now.toISOString(), subscription_end: newEnd, price_paid: 0 }).select('id').maybeSingle();
      if (error) throw new Error(error.message);
      rowId = data?.id;
    }
    const flags = await applyFlags(supabase, userId, profile, [...subs.filter((s) => s.id !== rowId), { status: 'active', subscription_end: newEnd }], purchases, now);
    return { before, after: { manualRow: { id: rowId, subscription_end: newEnd, status: 'active' }, profile: flags }, summary: `${days} Pro-Tage bis ${newEnd.slice(0, 10)}` };
  },

  async revoke_manual_access({ supabase, userId, now }) {
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    const manualRows = subs.filter((s) => !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0 && s.plan_type !== 'course' && s.subscription_end && new Date(s.subscription_end) > now);
    // A Pro-day grant a paid subscription took the row from lives on as a
    // purchases window (subscriptionEntitlement keepGrantWindow). Only those
    // manual windows are ended here — never a provider row or a bought course.
    const grantWindows = purchases.filter((p) => p.product_key === GRANT_WINDOW_PRODUCT && p.status === 'active'
      && String(p.lemonsqueezy_order_id || '').startsWith('manual-') && Date.parse(p.access_until) > now.getTime());
    if (manualRows.length === 0 && grantWindows.length === 0) throw conflict('Kein laufender manueller Zugang vorhanden.');
    const before = {
      rows: manualRows.map((s) => ({ id: s.id, subscription_end: s.subscription_end, status: s.status })),
      grantWindows: grantWindows.map((p) => ({ id: p.id, access_until: p.access_until })),
      profile: { is_subscribed: profile.is_subscribed, subscription_tier: profile.subscription_tier },
    };
    let rows = [];
    if (manualRows.length) {
      const { data, error } = await supabase.from('subscriptions').update({ subscription_end: now.toISOString(), status: 'expired', updated_at: now.toISOString() }).in('id', manualRows.map((s) => s.id)).select('id');
      if (error) throw new Error(error.message);
      if (!data?.length) throw conflict('Keine Abo-Zeile getroffen.');
      rows = data;
    }
    let windows = [];
    if (grantWindows.length) {
      const { data, error } = await supabase.from('purchases').update({ status: 'refunded', access_until: now.toISOString(), updated_at: now.toISOString() })
        .in('id', grantWindows.map((p) => p.id)).eq('product_key', GRANT_WINDOW_PRODUCT).eq('status', 'active').select('id');
      if (error) throw new Error(error.message);
      if (!data?.length) throw conflict('Kein Pro-Tage-Fenster getroffen.');
      windows = data;
    }
    let flags;
    if (windows.length) {
      // A kept window may stand behind a course row reconciliation derived from
      // it; reconciling retires that row and recomputes the flags (premium kept).
      const { isSubscribed } = await reconcileUserEntitlement(supabase, userId, now.getTime());
      flags = profile.subscription_tier === 'premium' ? { is_subscribed: true, subscription_tier: 'premium' } : { is_subscribed: isSubscribed, subscription_tier: isSubscribed ? 'pro' : 'free' };
    } else {
      flags = await applyFlags(supabase, userId, profile, subs.filter((s) => !manualRows.some((m) => m.id === s.id)), purchases, now);
    }
    return {
      before,
      after: { rows: rows.map((r) => ({ id: r.id, status: 'expired' })), grantWindows: windows.map((p) => ({ id: p.id, status: 'refunded' })), profile: flags },
      summary: `${rows.length} manuelle Zeile(n), ${windows.length} Pro-Tage-Fenster beendet`,
    };
  },

  async grant_course({ supabase, userId, params, now }) {
    const key = String(params.productKey || '');
    if (!PRODUCT_KEYS.includes(key)) throw badRequest(`productKey muss einer von ${PRODUCT_KEYS.join(', ')} sein.`);
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    if (purchases.some((p) => p.product_key === key && p.status === 'active')) throw conflict('Dieser Kurs ist bereits freigeschaltet.');
    const orderId = `manual-${now.getTime()}-${key}`;
    const { data, error } = await supabase.from('purchases').insert({ user_id: userId, product_key: key, lemonsqueezy_order_id: orderId, price_paid: 0, status: 'active', access_until: null }).select('id').maybeSingle();
    if (error) throw new Error(error.message);
    const flags = await applyFlags(supabase, userId, profile, subs, [...purchases, { status: 'active' }], now);
    return { before: { purchases: purchases.map((p) => p.product_key), profile: { is_subscribed: profile.is_subscribed } }, after: { purchase: { id: data?.id, product_key: key, order: orderId }, profile: flags }, summary: `Kurs ${key} freigeschaltet` };
  },

  async revoke_course({ supabase, userId, params, now }) {
    const key = String(params.productKey || '');
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    const row = purchases.find((p) => p.product_key === key && p.status === 'active');
    if (!row) throw conflict('Kein aktiver Kauf mit diesem Schlüssel.');
    if (!String(row.lemonsqueezy_order_id || '').startsWith('manual-')) throw conflict('Ein bezahlter Kauf wird nicht hier zurückgenommen — Erstattung läuft über Lemon Squeezy und den Webhook (order_refunded).');
    const { data, error } = await supabase.from('purchases').update({ status: 'refunded', updated_at: now.toISOString() }).eq('id', row.id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw conflict('Kaufzeile nicht getroffen.');
    const flags = await applyFlags(supabase, userId, profile, subs, purchases.filter((p) => p.id !== row.id), now);
    return { before: { purchase: { id: row.id, status: 'active' } }, after: { purchase: { id: row.id, status: 'refunded' }, profile: flags }, summary: `Kurs ${key} zurückgenommen` };
  },

  async extend_trial({ supabase, userId, params, now }) {
    const days = Number(params.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_TRIAL_DAYS) throw badRequest(`days muss zwischen 1 und ${MAX_TRIAL_DAYS} liegen.`);
    const { profile } = await loadUser(supabase, userId);
    const current = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const base = current && current > now ? current : now;
    const newEnd = new Date(base.getTime() + days * 86400000).toISOString();
    await updateProfile(supabase, userId, { trial_ends_at: newEnd, trial_started_at: profile.trial_started_at || now.toISOString() });
    return { before: { trial_ends_at: profile.trial_ends_at }, after: { trial_ends_at: newEnd }, summary: `Testphase bis ${newEnd.slice(0, 10)}` };
  },

  async set_tier({ supabase, userId, params }) {
    const tier = String(params.tier || '');
    if (!TIERS.includes(tier)) throw badRequest(`tier muss einer von ${TIERS.join(', ')} sein.`);
    const { profile } = await loadUser(supabase, userId);
    const patch = { subscription_tier: tier, is_subscribed: tier === 'pro' || tier === 'premium' };
    await updateProfile(supabase, userId, patch);
    return { before: { subscription_tier: profile.subscription_tier, is_subscribed: profile.is_subscribed }, after: patch, summary: `Tier ${tier}` };
  },

  async sync_flags({ supabase, userId, now }) {
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    const flags = await applyFlags(supabase, userId, profile, subs, purchases, now);
    return { before: { subscription_tier: profile.subscription_tier, is_subscribed: profile.is_subscribed }, after: flags, summary: `Flags: ${flags.subscription_tier}` };
  },

  async set_role({ supabase, userId, params, auth }) {
    const role = params.role === null || params.role === '' ? null : String(params.role);
    if (role !== null && !ROLES.includes(role)) throw badRequest(`role muss einer von ${ROLES.join(', ')} oder leer sein.`);
    if (userId === auth.userId && role !== 'admin') throw conflict('Die eigene Admin-Rolle kann nicht hier entfernt werden.');
    const { profile } = await loadUser(supabase, userId);
    await updateProfile(supabase, userId, { role });
    return { before: { role: profile.role }, after: { role }, summary: role ? `Rolle ${role}` : 'Rolle entfernt' };
  },
};

export const handler = adminEndpoint({ capability: 'entitlement.write' }, async ({ body, supabase, auth, event }) => {
  const action = String(body.action || '');
  const spec = ACTIONS[action];
  if (!spec) throw badRequest(`Unbekannte Aktion. Erlaubt: ${Object.keys(ACTIONS).join(', ')}`, { actions: ACTIONS });
  const userId = String(body.userId || '');
  if (!UUID.test(userId)) throw badRequest('userId muss eine UUID sein.');
  const reason = String(body.reason || '').trim();
  if (spec.sensitive && reason.length < 3) throw badRequest('Eine Begründung ist erforderlich.');
  const now = new Date();
  const params = body.params || {};
  const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey).slice(0, 120) : null;

  if (idempotencyKey) {
    const { data: prior } = await supabase.from('admin_audit_log').select('id, after_state').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (prior) return { action, userId, duplicate: true, after: prior.after_state, summary: 'Bereits ausgeführt (Idempotenz-Schlüssel).' };
  }

  try {
    const result = await HANDLERS[action]({ supabase, userId, params, now, auth });
    await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: `actions.${action}`, targetType: 'user', targetId: userId, reason, before: result.before, after: result.after, idempotencyKey, outcome: 'success', source: event.path });
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    return { action, userId, summary: result.summary, before: result.before, after: result.after, state: { profile: { is_subscribed: profile.is_subscribed, subscription_tier: profile.subscription_tier, trial_ends_at: profile.trial_ends_at, role: profile.role }, subscriptions: subs.length, purchases: purchases.filter((p) => p.status === 'active').map((p) => p.product_key) } };
  } catch (e) {
    await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: `actions.${action}`, targetType: 'user', targetId: userId, reason, outcome: 'failure', errorMessage: e.message, source: event.path });
    throw e;
  }
});
