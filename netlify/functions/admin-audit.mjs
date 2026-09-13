// Admin panel — the audit trail. Read-only: entries are appended by the
// functions performing the mutations; there is no write action here at all.
import { adminEndpoint, exactCount, counting } from './_shared/adminHttp.mjs';

export const handler = adminEndpoint({ capability: 'audit.read' }, async ({ body, supabase }) => {
  const pageSize = [25, 50, 100].includes(Number(body.pageSize)) ? Number(body.pageSize) : 50;
  const page = Math.max(1, Number(body.page) || 1);
  const f = body.filters || {};
  const apply = (q) => {
    if (f.actorId) q = q.eq('actor_id', String(f.actorId));
    if (f.action) q = q.ilike('action', `${String(f.action).replace(/[%,()]/g, '')}%`);
    if (f.targetType) q = q.eq('target_type', String(f.targetType));
    if (f.targetId) q = q.eq('target_id', String(f.targetId));
    if (f.outcome) q = q.eq('outcome', String(f.outcome));
    if (f.days) q = q.gte('occurred_at', new Date(Date.now() - Number(f.days) * 86400000).toISOString());
    return q;
  };
  const total = await exactCount(() => apply(counting(supabase, 'admin_audit_log')));
  const from = (page - 1) * pageSize;
  const { data, error } = await apply(supabase.from('admin_audit_log').select('*')).order('occurred_at', { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  const rows = data || [];
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];
  const { data: actors } = actorIds.length ? await supabase.from('profiles').select('id, email').in('id', actorIds) : { data: [] };
  const emailOf = new Map((actors || []).map((a) => [a.id, a.email]));
  const { data: actionRows } = await supabase.from('admin_audit_log').select('action').order('occurred_at', { ascending: false }).limit(1000);
  const actions = [...new Set((actionRows || []).map((r) => r.action))].sort();
  return {
    rows: rows.map((r) => ({ ...r, actor_email: emailOf.get(r.actor_id) || null })),
    page,
    pageSize,
    total,
    totalIsExact: true,
    actions,
    generatedAt: new Date().toISOString(),
  };
});
