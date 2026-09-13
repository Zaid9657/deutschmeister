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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_PRO_DAYS = 365;
export const MAX_TRIAL_DAYS = 60;
const TIERS = ['free', 'trial', 'pro', 'premium'];

export const ACTIONS = Object.freeze({
  grant_pro_days: { label: 'Pro-Tage gutschreiben', sensitive: true, params: ['days'], writes: 'subscriptions (manuelle Zeile, price_paid 0) + profiles.is_subscribed/subscription_tier' },
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

function flagsFromRows(subs, purchases, now) {
  const live = subs.some((s) => s.subscription_end && new Date(s.subscription_end) > now);
  const course = purchases.some((p) => p.status === 'active');
  return { is_subscribed: live || course, subscription_tier: live || course ? 'pro' : 'free' };
}

async function updateProfile(supabase, userId, patch) {
  const { data, error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId).select('id');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw conflict('Profil-Update hat keine Zeile getroffen.');
}

const HANDLERS = {
  async grant_pro_days({ supabase, userId, params, now }) {
    const days = Number(params.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_PRO_DAYS) throw badRequest(`days muss eine ganze Zahl zwischen 1 und ${MAX_PRO_DAYS} sein.`);
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    const manual = subs.find((s) => !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0 && s.plan_type !== 'course');
    const latestEnd = subs.map((s) => s.subscription_end).filter(Boolean).map((d) => new Date(d)).sort((a, b) => b - a)[0];
    const base = latestEnd && latestEnd > now ? latestEnd : now;
    const newEnd = new Date(base.getTime() + days * 86400000).toISOString();
    const before = { manualRow: manual ? { id: manual.id, subscription_end: manual.subscription_end, status: manual.status } : null, profile: { is_subscribed: profile.is_subscribed, subscription_tier: profile.subscription_tier } };
    let rowId;
    if (manual) {
      const { data, error } = await supabase.from('subscriptions').update({ subscription_end: newEnd, status: 'active', updated_at: now.toISOString() }).eq('id', manual.id).select('id');
      if (error) throw new Error(error.message);
      if (!data?.length) throw conflict('Abo-Zeile nicht getroffen.');
      rowId = manual.id;
    } else {
      const { data, error } = await supabase.from('subscriptions').insert({ user_id: userId, plan_type: 'monthly', status: 'active', subscription_start: now.toISOString(), subscription_end: newEnd, price_paid: 0 }).select('id').maybeSingle();
      if (error) throw new Error(error.message);
      rowId = data?.id;
    }
    const flags = flagsFromRows([...subs.filter((s) => s.id !== rowId), { subscription_end: newEnd }], purchases, now);
    await updateProfile(supabase, userId, flags);
    return { before, after: { manualRow: { id: rowId, subscription_end: newEnd, status: 'active' }, profile: flags }, summary: `${days} Pro-Tage bis ${newEnd.slice(0, 10)}` };
  },

  async revoke_manual_access({ supabase, userId, now }) {
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    const manualRows = subs.filter((s) => !s.lemonsqueezy_subscription_id && Number(s.price_paid || 0) === 0 && s.plan_type !== 'course' && s.subscription_end && new Date(s.subscription_end) > now);
    if (manualRows.length === 0) throw conflict('Kein laufender manueller Zugang vorhanden.');
    const before = { rows: manualRows.map((s) => ({ id: s.id, subscription_end: s.subscription_end, status: s.status })), profile: { is_subscribed: profile.is_subscribed, subscription_tier: profile.subscription_tier } };
    const { data, error } = await supabase.from('subscriptions').update({ subscription_end: now.toISOString(), status: 'expired', updated_at: now.toISOString() }).in('id', manualRows.map((s) => s.id)).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw conflict('Keine Abo-Zeile getroffen.');
    const remaining = subs.filter((s) => !manualRows.some((m) => m.id === s.id));
    const flags = flagsFromRows(remaining, purchases, now);
    await updateProfile(supabase, userId, flags);
    return { before, after: { rows: data.map((r) => ({ id: r.id, status: 'expired' })), profile: flags }, summary: `${data.length} manuelle Zeile(n) beendet` };
  },

  async grant_course({ supabase, userId, params, now }) {
    const key = String(params.productKey || '');
    if (!PRODUCT_KEYS.includes(key)) throw badRequest(`productKey muss einer von ${PRODUCT_KEYS.join(', ')} sein.`);
    const { profile, subs, purchases } = await loadUser(supabase, userId);
    if (purchases.some((p) => p.product_key === key && p.status === 'active')) throw conflict('Dieser Kurs ist bereits freigeschaltet.');
    const orderId = `manual-${now.getTime()}-${key}`;
    const { data, error } = await supabase.from('purchases').insert({ user_id: userId, product_key: key, lemonsqueezy_order_id: orderId, price_paid: 0, status: 'active', access_until: null }).select('id').maybeSingle();
    if (error) throw new Error(error.message);
    const flags = flagsFromRows(subs, [...purchases, { status: 'active' }], now);
    await updateProfile(supabase, userId, flags);
    return { before: { purchases: purchases.map((p) => p.product_key), profile: { is_subscribed: profile.is_subscribed } }, after: { purchase: { id: data?.id, product_key: key, order: orderId }, profile: flags }, summary: `Kurs ${key} freigeschaltet` };
  },

  async revoke_course({ supabase, userId, params, now }) {
    const key = String(params.productKey || '');
    const { subs, purchases } = await loadUser(supabase, userId);
    const row = purchases.find((p) => p.product_key === key && p.status === 'active');
    if (!row) throw conflict('Kein aktiver Kauf mit diesem Schlüssel.');
    if (!String(row.lemonsqueezy_order_id || '').startsWith('manual-')) throw conflict('Ein bezahlter Kauf wird nicht hier zurückgenommen — Erstattung läuft über Lemon Squeezy und den Webhook (order_refunded).');
    const { data, error } = await supabase.from('purchases').update({ status: 'refunded', updated_at: now.toISOString() }).eq('id', row.id).select('id');
    if (error) throw new Error(error.message);
    if (!data?.length) throw conflict('Kaufzeile nicht getroffen.');
    const flags = flagsFromRows(subs, purchases.filter((p) => p.id !== row.id), now);
    await updateProfile(supabase, userId, flags);
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
    const flags = flagsFromRows(subs, purchases, now);
    await updateProfile(supabase, userId, flags);
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
