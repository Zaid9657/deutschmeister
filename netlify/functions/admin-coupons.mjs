// Admin panel — coupons: the governance record around a Lemon Squeezy
// discount. Creating a coupon here creates the rules and the ledger — NOT
// the discount; the code must exist identically in LS. The screen says so.
import { adminEndpoint, badRequest, notFound, conflict, fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import { hasCapability } from './_shared/adminRbacLib.mjs';
import { effectiveStatus, remainingLimit, needsElevatedApproval, validateCouponInput, STATUS_TRANSITIONS, LOCKED_AFTER_REDEMPTION } from './_shared/adminCouponsLib.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WRITE = ['create', 'update', 'activate', 'pause', 'archive'];

async function redemptionCounts(supabase, ids) {
  if (ids.length === 0) return new Map();
  const rows = await fetchAll(() => supabase.from('coupon_redemptions').select('coupon_id, payment_status').in('coupon_id', ids));
  const m = new Map();
  for (const r of rows) m.set(r.coupon_id, (m.get(r.coupon_id) || 0) + 1);
  return m;
}

function present(c, count, nowMs) {
  return { ...c, redemptions: count, effectiveStatus: effectiveStatus(c, count, nowMs), remaining: remainingLimit(c, count), elevated: needsElevatedApproval(c), provider: { managed: false, note: 'Der Rabatt selbst liegt in Lemon Squeezy. Dieses System legt keine LS-Rabatte an — der Code muss dort identisch existieren.' } };
}

export const handler = adminEndpoint(
  { capabilityFor: (b) => (b.action === 'refund_adjustment' ? 'finance.write' : b.action === 'archive' ? 'marketing.coupons.archive' : WRITE.includes(b.action) ? 'marketing.coupons.write' : 'marketing.coupons.read') },
  async ({ body, supabase, auth, event }) => {
    const now = new Date();
    const action = String(body.action || 'list');
    const audit = (a, id, extra) => writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: `coupons.${a}`, targetType: 'coupon', targetId: id, outcome: 'success', source: event.path, ...extra });

    if (action === 'list') {
      const f = body.filters || {};
      const page = Math.max(1, Number(body.page) || 1);
      const pageSize = 50;
      const apply = (q) => {
        if (f.status && ['draft', 'active', 'paused', 'archived'].includes(f.status)) q = q.eq('status', f.status);
        if (f.search) { const s = String(f.search).replace(/[%,()]/g, '').toUpperCase(); if (s) q = q.or(`normalized_code.ilike.%${s}%,internal_name.ilike.%${s}%`); }
        return q;
      };
      const derived = ['expired', 'exhausted'].includes(f.status);
      const total = await exactCount(() => apply(counting(supabase, 'coupons')));
      const { data, error } = derived
        ? await apply(supabase.from('coupons').select('*')).eq('status', 'active').order('created_at', { ascending: false }).range(0, 999)
        : await apply(supabase.from('coupons').select('*')).order('created_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw new Error(error.message);
      const counts = await redemptionCounts(supabase, (data || []).map((c) => c.id));
      let rows = (data || []).map((c) => present(c, counts.get(c.id) || 0, now.getTime()));
      if (derived) rows = rows.filter((c) => c.effectiveStatus === f.status);
      return { rows, page, pageSize, total: derived ? rows.length : total, totalIsExact: !derived, generatedAt: now.toISOString() };
    }

    if (action === 'detail') {
      if (!UUID.test(String(body.id || ''))) throw badRequest('id fehlt.');
      const { data: c, error } = await supabase.from('coupons').select('*').eq('id', body.id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!c) throw notFound('Coupon nicht gefunden.');
      const permitted = hasCapability(auth.role, 'finance.coupon_redemptions.read');
      const redemptions = permitted ? await fetchAll(() => supabase.from('coupon_redemptions').select('*').eq('coupon_id', c.id).order('redeemed_at', { ascending: false })) : null;
      const count = redemptions ? redemptions.length : (await redemptionCounts(supabase, [c.id])).get(c.id) || 0;
      return { coupon: present(c, count, now.getTime()), redemptions, redemptionsPermitted: permitted, allowedTransitions: STATUS_TRANSITIONS[c.status] || [], lockedFields: count > 0 ? LOCKED_AFTER_REDEMPTION : [], generatedAt: now.toISOString() };
    }

    const reason = String(body.reason || '').trim();
    if (reason.length < 3) throw badRequest('Eine Begründung ist erforderlich.');

    if (action === 'create') {
      const v = validateCouponInput(body.params || {});
      if (!v.ok) throw badRequest('Eingaben ungültig.', { fieldErrors: v.errors });
      const { data: dup } = await supabase.from('coupons').select('id').eq('normalized_code', v.value.normalized_code).maybeSingle();
      if (dup) throw conflict('Ein Coupon mit diesem Code existiert bereits (Groß-/Kleinschreibung zählt nicht).');
      const { data: c, error } = await supabase.from('coupons').insert({ ...v.value, status: 'draft', created_by: auth.userId }).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      await audit('create', c.id, { reason, after: v.value });
      return { coupon: present(c, 0, now.getTime()) };
    }

    if (!UUID.test(String(body.id || ''))) throw badRequest('id fehlt.');
    const { data: before, error: e0 } = await supabase.from('coupons').select('*').eq('id', body.id).maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!before) throw notFound('Coupon nicht gefunden.');
    const count = (await redemptionCounts(supabase, [before.id])).get(before.id) || 0;

    if (action === 'update') {
      const v = validateCouponInput(body.params || {}, { partial: true });
      if (!v.ok) throw badRequest('Eingaben ungültig.', { fieldErrors: v.errors });
      if (count > 0) {
        const touched = Object.keys(v.value).filter((k) => LOCKED_AFTER_REDEMPTION.includes(k) && JSON.stringify(v.value[k]) !== JSON.stringify(before[k]));
        if (touched.length) throw conflict(`Nach einer Einlösung sind diese Felder eingefroren: ${touched.join(', ')}. Pausieren oder archivieren und einen neuen Coupon anlegen.`);
      }
      if (v.value.normalized_code && v.value.normalized_code !== before.normalized_code) {
        const { data: dup } = await supabase.from('coupons').select('id').eq('normalized_code', v.value.normalized_code).neq('id', before.id).maybeSingle();
        if (dup) throw conflict('Code bereits vergeben.');
      }
      const { data: after, error } = await supabase.from('coupons').update({ ...v.value, updated_at: now.toISOString() }).eq('id', before.id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!after) throw conflict('Update hat keine Zeile getroffen.');
      await audit('update', before.id, { reason, before: Object.fromEntries(Object.keys(v.value).map((k) => [k, before[k]])), after: v.value });
      return { coupon: present(after, count, now.getTime()) };
    }

    if (['activate', 'pause', 'archive'].includes(action)) {
      const to = action === 'activate' ? 'active' : action === 'pause' ? 'paused' : 'archived';
      if (!(STATUS_TRANSITIONS[before.status] || []).includes(to)) throw conflict(`Übergang ${before.status} → ${to} ist nicht erlaubt.`);
      if (to === 'active' && needsElevatedApproval(before) && !['admin', 'finance'].includes(auth.role)) throw conflict('Dieser Coupon (≥ 50 %, ≥ 100 € oder unbegrenzt) darf nur von finance oder admin live geschaltet werden.');
      const patch = { status: to, updated_at: now.toISOString(), archived_at: to === 'archived' ? now.toISOString() : before.archived_at };
      const { data: after, error } = await supabase.from('coupons').update(patch).eq('id', before.id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!after) throw conflict('Update hat keine Zeile getroffen.');
      await audit(action, before.id, { reason, before: { status: before.status }, after: { status: to } });
      return { coupon: present(after, count, now.getTime()) };
    }

    if (action === 'refund_adjustment') {
      const rid = String(body.params?.redemptionId || '');
      if (!UUID.test(rid)) throw badRequest('redemptionId fehlt.');
      const { data: r } = await supabase.from('coupon_redemptions').select('*').eq('id', rid).eq('coupon_id', before.id).maybeSingle();
      if (!r) throw notFound('Einlösung nicht gefunden.');
      if (r.payment_status === 'refunded') throw conflict('Bereits als erstattet markiert.');
      // A refund never restores the limit: the row stays, only its payment_status changes.
      const { data: after, error } = await supabase.from('coupon_redemptions').update({ payment_status: 'refunded', refund_adjusted_at: now.toISOString(), refund_adjusted_by: auth.userId }).eq('id', rid).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!after) throw conflict('Update hat keine Zeile getroffen.');
      await audit('refund_adjustment', before.id, { reason, before: { redemption: rid, payment_status: 'paid' }, after: { redemption: rid, payment_status: 'refunded' } });
      return { redemption: after };
    }

    throw badRequest(`Unbekannte Aktion "${action}".`);
  },
);
