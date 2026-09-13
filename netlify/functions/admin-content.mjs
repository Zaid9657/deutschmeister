// Admin panel — the content CMS. Lifecycle over six content tables; every
// count goes through the same adapter; server-side COUNT + explicit ranges;
// dates never print "Invalid Date"; `never reviewed` is separate from `due`.
import { adminEndpoint, badRequest, notFound, conflict, fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import { hasCapability } from './_shared/adminRbacLib.mjs';
import { applyLevelFilter, normalizeLevel } from './_shared/adminLevels.mjs';
import { LIFECYCLE, allowedTransitions, canTransition, CONTENT_TABLES, CONTENT_TABLE_KEYS, safeDate, reviewState, validateHierarchy } from './_shared/adminContentLib.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIFECYCLE_COLS = 'id, lifecycle_status, owner_id, reviewer_id, last_reviewed_at, next_review_at, archived_at';

function cols(table) {
  const t = CONTENT_TABLES[table];
  return [LIFECYCLE_COLS, t.levelColumn, t.titleColumn, t.altTitleColumn, t.orderColumn, t.publishedColumn, t.slugColumn, t.updatedColumn, 'created_at'].filter(Boolean).join(', ');
}

function shape(table, r, now) {
  const t = CONTENT_TABLES[table];
  return {
    id: r.id, table, tableLabel: t.label,
    level: r[t.levelColumn] ? String(r[t.levelColumn]).toLowerCase() : null,
    title: r[t.titleColumn] || r[t.altTitleColumn] || '(ohne Titel)',
    order: r[t.orderColumn] ?? null,
    slug: t.slugColumn ? r[t.slugColumn] : null,
    lifecycle: r.lifecycle_status,
    lifecycleLabel: LIFECYCLE[r.lifecycle_status] || r.lifecycle_status,
    publishedFlag: t.publishedColumn ? r[t.publishedColumn] : null,
    hasPublishedFlag: Boolean(t.publishedColumn),
    ownerId: r.owner_id, reviewerId: r.reviewer_id,
    lastReviewedAt: safeDate(r.last_reviewed_at), nextReviewAt: safeDate(r.next_review_at), archivedAt: safeDate(r.archived_at),
    createdAt: safeDate(r.created_at), updatedAt: t.updatedColumn ? safeDate(r[t.updatedColumn]) : null,
    review: reviewState(r, now),
    route: t.route(r),
  };
}

export const handler = adminEndpoint(
  { capabilityFor: (b) => (['set_lifecycle', 'set_review', 'set_owner'].includes(b.action) ? (b.params?.status === 'published' ? 'content.publish' : 'content.write') : 'content.read') },
  async ({ body, supabase, auth, event }) => {
    const now = new Date();
    const action = String(body.action || 'overview');
    const table = CONTENT_TABLE_KEYS.includes(body.table) ? body.table : null;

    if (action === 'overview') {
      const perTable = [];
      for (const key of CONTENT_TABLE_KEYS) {
        const rows = await fetchAll(() => supabase.from(key).select('id, lifecycle_status, last_reviewed_at, next_review_at'));
        const byStatus = {};
        for (const r of rows) byStatus[r.lifecycle_status] = (byStatus[r.lifecycle_status] || 0) + 1;
        const reviews = { never: 0, scheduled_unknown: 0, due: 0, ok: 0 };
        for (const r of rows) reviews[reviewState(r, now)] += 1;
        perTable.push({ table: key, label: CONTENT_TABLES[key].label, total: rows.length, byStatus, reviews, hasPublishedFlag: Boolean(CONTENT_TABLES[key].publishedColumn) });
      }
      const topics = await fetchAll(() => supabase.from('grammar_topics').select('id, slug, sub_level, title_de, prerequisite_slugs'));
      const hierarchy = validateHierarchy(topics);
      const contentTickets = await exactCount(() => counting(supabase, 'support_tickets').eq('category', 'content').in('status', ['new', 'open', 'waiting_user']));
      return { perTable, totals: { items: perTable.reduce((a, t) => a + t.total, 0), never: perTable.reduce((a, t) => a + t.reviews.never, 0), due: perTable.reduce((a, t) => a + t.reviews.due, 0) }, hierarchy: { ...hierarchy, orphans: hierarchy.orphans.slice(0, 50), cycles: hierarchy.cycles.slice(0, 20), duplicateSiblings: hierarchy.duplicateSiblings.slice(0, 50) }, contentTickets, lifecycle: LIFECYCLE, tables: CONTENT_TABLE_KEYS.map((k) => ({ key: k, label: CONTENT_TABLES[k].label })), generatedAt: now.toISOString() };
    }

    if (action === 'list') {
      if (!table) throw badRequest('table fehlt oder ist unbekannt.');
      const t = CONTENT_TABLES[table];
      const page = Math.max(1, Number(body.page) || 1);
      const pageSize = [25, 50, 100].includes(Number(body.pageSize)) ? Number(body.pageSize) : 50;
      const f = body.filters || {};
      const apply = (q) => {
        if (f.lifecycle) q = q.eq('lifecycle_status', String(f.lifecycle));
        if (normalizeLevel(f.level)) q = applyLevelFilter(q, table, f.level);
        if (f.search) { const s = String(f.search).replace(/[%,()]/g, ''); if (s) q = q.ilike(t.titleColumn, `%${s}%`); }
        return q;
      };
      const total = await exactCount(() => apply(counting(supabase, table)));
      const { data, error } = await apply(supabase.from(table).select(cols(table))).order(t.levelColumn, { ascending: true }).order(t.orderColumn, { ascending: true, nullsFirst: false }).range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw new Error(error.message);
      let rows = (data || []).map((r) => shape(table, r, now));
      if (f.review) rows = rows.filter((r) => r.review === f.review);
      return { rows, page, pageSize, total, totalIsExact: !f.review, table, tableLabel: t.label, lifecycle: LIFECYCLE, generatedAt: now.toISOString() };
    }

    if (action === 'detail') {
      if (!table || !UUID.test(String(body.id || ''))) throw badRequest('table und id sind erforderlich.');
      const { data, error } = await supabase.from(table).select('*').eq('id', body.id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw notFound('Inhalt nicht gefunden.');
      const item = shape(table, data, now);
      const ids = [data.owner_id, data.reviewer_id].filter(Boolean);
      const { data: people } = ids.length ? await supabase.from('profiles').select('id, email').in('id', ids) : { data: [] };
      const emailOf = new Map((people || []).map((p) => [p.id, p.email]));
      const audit = await fetchAll(() => supabase.from('admin_audit_log').select('occurred_at, actor_id, action, reason, before_state, after_state, outcome').eq('target_type', `content:${table}`).eq('target_id', data.id).order('occurred_at', { ascending: false }).limit(20));
      return { item: { ...item, ownerEmail: emailOf.get(data.owner_id) || null, reviewerEmail: emailOf.get(data.reviewer_id) || null }, raw: Object.fromEntries(Object.entries(data).filter(([k]) => !/^(content|transcript|dialogue|questions|checks|vocabulary|key_vocabulary)/.test(k))), allowedTransitions: allowedTransitions(data.lifecycle_status), canPublish: hasCapability(auth.role, 'content.publish'), audit, lifecycle: LIFECYCLE, generatedAt: now.toISOString() };
    }

    // ---- mutations --------------------------------------------------------
    if (!table || !UUID.test(String(body.id || ''))) throw badRequest('table und id sind erforderlich.');
    const reason = String(body.reason || '').trim();
    if (reason.length < 3) throw badRequest('Eine Begründung ist erforderlich.');
    const { data: before, error: e0 } = await supabase.from(table).select(cols(table)).eq('id', body.id).maybeSingle();
    if (e0) throw new Error(e0.message);
    if (!before) throw notFound('Inhalt nicht gefunden.');
    const t = CONTENT_TABLES[table];
    let patch = {};
    if (action === 'set_lifecycle') {
      const status = String(body.params?.status || '');
      if (!LIFECYCLE[status]) throw badRequest('Ungültiger Lebenszyklus-Status.');
      if (!canTransition(before.lifecycle_status, status)) throw conflict(`Übergang ${before.lifecycle_status} → ${status} ist nicht erlaubt. Erlaubt: ${allowedTransitions(before.lifecycle_status).join(', ') || 'keiner'}.`);
      if (status === 'published' && !hasCapability(auth.role, 'content.publish')) throw conflict('Veröffentlichen braucht content.publish.');
      patch = { lifecycle_status: status, archived_at: status === 'archived' ? now.toISOString() : null };
      if (t.publishedColumn) patch[t.publishedColumn] = status === 'published';
    } else if (action === 'set_review') {
      const reviewed = body.params?.reviewedNow ? now.toISOString() : before.last_reviewed_at;
      const next = body.params?.nextReviewAt === null ? null : body.params?.nextReviewAt ? safeDate(body.params.nextReviewAt) : before.next_review_at;
      if (body.params?.nextReviewAt && !next) throw badRequest('nextReviewAt ist kein lesbares Datum.');
      patch = { last_reviewed_at: reviewed, next_review_at: next };
      if (body.params?.reviewedNow) patch.reviewer_id = auth.userId;
    } else if (action === 'set_owner') {
      const owner = body.params?.ownerId === null || body.params?.ownerId === '' ? null : String(body.params?.ownerId || '');
      if (owner && !UUID.test(owner)) throw badRequest('ownerId muss eine UUID sein.');
      patch = { owner_id: owner };
    } else {
      throw badRequest(`Unbekannte Aktion "${action}".`);
    }
    if (t.updatedColumn) patch[t.updatedColumn] = now.toISOString();
    const { data: after, error: e1 } = await supabase.from(table).update(patch).eq('id', body.id).select(cols(table)).maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!after) throw conflict('Update hat keine Zeile getroffen.');
    await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: `content.${action}`, targetType: `content:${table}`, targetId: body.id, reason, before: { lifecycle_status: before.lifecycle_status, owner_id: before.owner_id, last_reviewed_at: before.last_reviewed_at, next_review_at: before.next_review_at }, after: patch, outcome: 'success', source: event.path });
    return { item: shape(table, after, now), allowedTransitions: allowedTransitions(after.lifecycle_status) };
  },
);
