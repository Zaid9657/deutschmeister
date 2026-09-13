// Admin panel — support tickets.
//
// The one rule this module exists to enforce: an internal note is a separate
// ROW with visibility = 'internal'. Every query that could reach a learner
// (support-ticket-create's thread view, the reply email) filters
// visibility = 'public'; here, the admin surface, internal rows travel as
// their own rows and are rendered as such. A reply is `queued` and becomes
// `sent` only when Resend confirms.
import { randomUUID } from 'node:crypto';
import { adminEndpoint, badRequest, notFound, conflict, fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import {
  SLA_HOURS, TICKET_STATUSES, OPEN_STATUSES, PRIORITIES, CATEGORIES, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS,
  RESOLUTION_CATEGORIES, RESOLUTION_LABELS, CLOSURE_REASONS, CLOSURE_LABELS, slaDueAt, slaState, ticketReference,
} from './_shared/adminSupportLib.mjs';

const FROM_ADDRESS = 'DeutschMeister Support <zaid@deutsch-meister.de>';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const vocab = () => ({
  statuses: TICKET_STATUSES.map((id) => ({ id, label: STATUS_LABELS[id] })),
  priorities: PRIORITIES.map((id) => ({ id, label: PRIORITY_LABELS[id] })),
  categories: CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
  resolutionCategories: RESOLUTION_CATEGORIES.map((id) => ({ id, label: RESOLUTION_LABELS[id] })),
  closureReasons: CLOSURE_REASONS.map((id) => ({ id, label: CLOSURE_LABELS[id] })),
  slaHours: SLA_HOURS,
});

async function getTicket(supabase, id) {
  if (!UUID.test(String(id || ''))) throw badRequest('ticketId muss eine UUID sein.');
  const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw notFound('Ticket nicht gefunden.');
  return data;
}

async function patchTicket(supabase, id, patch) {
  const { data, error } = await supabase.from('support_tickets').update({ ...patch, last_activity_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw conflict('Ticket-Update hat keine Zeile getroffen.');
  return data;
}

async function addMessage(supabase, { ticketId, authorType, authorId, visibility, body, deliveryStatus = null }) {
  const { data, error } = await supabase.from('support_ticket_messages').insert({ ticket_id: ticketId, author_type: authorType, author_id: authorId, visibility, body, delivery_status: deliveryStatus }).select('*').maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function sendReplyEmail({ to, reference, subject, body }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY nicht gesetzt' };
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#14201D;max-width:600px">${body
    .split('\n')
    .map((l) => `<p style="margin:0 0 12px">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
    .join('')}<p style="margin-top:24px;font-size:13px;color:#5A6360">Ticket ${reference} · Antworten Sie einfach auf diese E-Mail.</p></div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], reply_to: 'kontakt@deutsch-meister.de', subject: `[${reference}] ${subject || 'Ihre Anfrage bei DeutschMeister'}`, html }),
  });
  if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  return { ok: true };
}

export const handler = adminEndpoint(
  { capabilityFor: (body) => (['list', 'detail'].includes(body.action) ? 'support.read' : 'support.write') },
  async ({ body, supabase, auth, event }) => {
    const now = new Date();
    const action = String(body.action || 'list');
    const audit = (a, targetId, extra) => writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: `support.${a}`, targetType: 'ticket', targetId, outcome: 'success', source: event.path, ...extra });

    if (action === 'list') {
      const f = body.filters || {};
      const apply = (q) => {
        if (f.status === 'open') q = q.in('status', [...OPEN_STATUSES]);
        else if (f.status) q = q.eq('status', String(f.status));
        if (f.priority) q = q.eq('priority', String(f.priority));
        if (f.category) q = q.eq('category', String(f.category));
        if (f.assignee === 'unassigned') q = q.is('assignee_id', null);
        else if (f.assignee === 'mine') q = q.eq('assignee_id', auth.userId);
        if (f.search) {
          const s = String(f.search).replace(/[%,()]/g, '');
          if (s) q = q.or(`reference.ilike.%${s}%,subject.ilike.%${s}%,user_email.ilike.%${s}%`);
        }
        return q;
      };
      const pageSize = 50;
      const page = Math.max(1, Number(body.page) || 1);
      const total = await exactCount(() => apply(counting(supabase, 'support_tickets')));
      const { data, error } = await apply(supabase.from('support_tickets').select('*')).order('last_activity_at', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw new Error(error.message);
      const all = await fetchAll(() => supabase.from('support_tickets').select('id, status, priority, assignee_id, first_response_at, sla_due_at, closed_at'));
      const open = all.filter((t) => OPEN_STATUSES.includes(t.status));
      const states = open.map((t) => slaState(t, now));
      const judgeable = all.filter((t) => slaState(t, now) !== 'unknown').length;
      return {
        rows: (data || []).map((t) => ({ ...t, sla: slaState(t, now) })),
        page,
        pageSize,
        total,
        totalIsExact: true,
        summary: {
          open: open.length,
          unassigned: open.filter((t) => !t.assignee_id).length,
          urgent: open.filter((t) => t.priority === 'urgent').length,
          breached: states.filter((s) => s === 'breached').length,
          dueSoon: states.filter((s) => s === 'due_soon').length,
          closed: all.filter((t) => t.status === 'closed').length,
          slaCoverage: { judgeable, total: all.length },
        },
        vocab: vocab(),
        generatedAt: now.toISOString(),
      };
    }

    if (action === 'detail') {
      const t = await getTicket(supabase, body.ticketId);
      const messages = await fetchAll(() => supabase.from('support_ticket_messages').select('*').eq('ticket_id', t.id).order('created_at', { ascending: true }));
      const ids = [...new Set([t.assignee_id, t.closed_by, ...messages.map((m) => m.author_id)].filter(Boolean))];
      const { data: people } = ids.length ? await supabase.from('profiles').select('id, email').in('id', ids) : { data: [] };
      const emailOf = new Map((people || []).map((p) => [p.id, p.email]));
      return {
        ticket: { ...t, sla: slaState(t, now), assignee_email: emailOf.get(t.assignee_id) || null, closed_by_email: emailOf.get(t.closed_by) || null },
        messages: messages.map((m) => ({ ...m, author_email: emailOf.get(m.author_id) || null })),
        vocab: vocab(),
        generatedAt: now.toISOString(),
      };
    }

    // ---- writes ---------------------------------------------------------
    const reason = String(body.reason || '').trim();

    if (action === 'create') {
      const p = body.params || {};
      const subject = String(p.subject || '').trim();
      const text = String(p.body || '').trim();
      const email = String(p.userEmail || '').trim().toLowerCase();
      if (!subject || !text) throw badRequest('Betreff und Text sind erforderlich.');
      const category = CATEGORIES.includes(p.category) ? p.category : 'other';
      const priority = PRIORITIES.includes(p.priority) ? p.priority : 'normal';
      let userId = null;
      if (email) {
        const { data: prof } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
        userId = prof?.id ?? null;
      }
      const id = randomUUID();
      const createdAt = p.createdAt && Number.isFinite(Date.parse(p.createdAt)) ? new Date(p.createdAt).toISOString() : now.toISOString();
      const { data: t, error } = await supabase.from('support_tickets').insert({ id, reference: ticketReference(id), user_id: userId, user_email: email || null, subject, category, priority, channel: p.channel === 'email' ? 'email' : 'manual', created_at: createdAt, sla_due_at: slaDueAt(createdAt, priority), context: { intake: 'admin', by: auth.userId } }).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      await addMessage(supabase, { ticketId: id, authorType: 'user', authorId: userId, visibility: 'public', body: text });
      await audit('create', id, { after: { subject, category, priority, user_email: email || null } });
      return { ticket: t };
    }

    const t = await getTicket(supabase, body.ticketId);

    if (action === 'status') {
      const status = String(body.params?.status || '');
      if (!TICKET_STATUSES.includes(status)) throw badRequest('Ungültiger Status.');
      if (['resolved', 'closed'].includes(status) && reason.length < 3) throw badRequest('Zum Lösen oder Schließen ist eine Begründung erforderlich.');
      if (status === 'closed') throw badRequest('Schließen läuft über die Aktion „close“ (mit Abschlussgrund).');
      const patch = { status, resolved_at: status === 'resolved' ? now.toISOString() : t.resolved_at };
      const updated = await patchTicket(supabase, t.id, patch);
      await addMessage(supabase, { ticketId: t.id, authorType: 'system', authorId: auth.userId, visibility: 'internal', body: `Status: ${STATUS_LABELS[t.status]} → ${STATUS_LABELS[status]}${reason ? ` — ${reason}` : ''}` });
      await audit('status', t.id, { reason, before: { status: t.status }, after: { status } });
      return { ticket: { ...updated, sla: slaState(updated, now) } };
    }

    if (action === 'priority') {
      const priority = String(body.params?.priority || '');
      if (!PRIORITIES.includes(priority)) throw badRequest('Ungültige Priorität.');
      if (priority === 'urgent' && reason.length < 3) throw badRequest('Eskalation auf „dringend“ braucht eine Begründung.');
      const updated = await patchTicket(supabase, t.id, { priority, sla_due_at: slaDueAt(t.created_at, priority) });
      await audit('priority', t.id, { reason, before: { priority: t.priority }, after: { priority } });
      return { ticket: { ...updated, sla: slaState(updated, now) } };
    }

    if (action === 'assign') {
      const assignee = body.params?.assigneeId === null || body.params?.assigneeId === '' ? null : String(body.params?.assigneeId || auth.userId);
      if (assignee && !UUID.test(assignee)) throw badRequest('assigneeId muss eine UUID sein.');
      if (assignee) {
        const { data: staff } = await supabase.from('profiles').select('role').eq('id', assignee).maybeSingle();
        if (!staff?.role) throw badRequest('Nur Konten mit einer Admin-Rolle können zugewiesen werden.');
      }
      const updated = await patchTicket(supabase, t.id, { assignee_id: assignee, status: t.status === 'new' ? 'open' : t.status });
      await audit('assign', t.id, { reason, before: { assignee_id: t.assignee_id }, after: { assignee_id: assignee } });
      return { ticket: { ...updated, sla: slaState(updated, now) } };
    }

    if (action === 'note') {
      const text = String(body.params?.body || '').trim();
      if (!text) throw badRequest('Notiz ist leer.');
      const m = await addMessage(supabase, { ticketId: t.id, authorType: 'admin', authorId: auth.userId, visibility: 'internal', body: text });
      await patchTicket(supabase, t.id, {});
      await audit('note', t.id, { after: { messageId: m.id, visibility: 'internal' } });
      return { message: m };
    }

    if (action === 'reply') {
      const text = String(body.params?.body || '').trim();
      if (!text) throw badRequest('Antwort ist leer.');
      const to = t.user_email;
      if (!to) throw conflict('Das Ticket hat keine E-Mail-Adresse; Antwort kann nicht zugestellt werden.');
      const m = await addMessage(supabase, { ticketId: t.id, authorType: 'admin', authorId: auth.userId, visibility: 'public', body: text, deliveryStatus: 'queued' });
      const sent = await sendReplyEmail({ to, reference: t.reference, subject: t.subject, body: text });
      const { data: updatedMsg } = await supabase.from('support_ticket_messages').update({ delivery_status: sent.ok ? 'sent' : 'failed', delivery_error: sent.ok ? null : sent.error }).eq('id', m.id).select('*').maybeSingle();
      const patch = { status: t.status === 'new' || t.status === 'open' ? 'waiting_user' : t.status };
      if (!t.first_response_at) patch.first_response_at = now.toISOString();
      const updated = await patchTicket(supabase, t.id, patch);
      await audit('reply', t.id, { after: { messageId: m.id, delivery: sent.ok ? 'sent' : 'failed', error: sent.error || null } });
      return { message: updatedMsg || m, ticket: { ...updated, sla: slaState(updated, now) }, delivered: sent.ok, deliveryError: sent.error || null };
    }

    if (action === 'close') {
      const closureReason = String(body.params?.closureReason || '');
      const resolutionCategory = body.params?.resolutionCategory ? String(body.params.resolutionCategory) : null;
      if (!CLOSURE_REASONS.includes(closureReason)) throw badRequest('Abschlussgrund fehlt oder ist ungültig.');
      if (resolutionCategory && !RESOLUTION_CATEGORIES.includes(resolutionCategory)) throw badRequest('Ungültige Lösungsart.');
      if (reason.length < 3) throw badRequest('Zum Schließen ist eine Begründung erforderlich.');
      if (t.status === 'closed') throw conflict('Das Ticket ist bereits geschlossen.');
      const updated = await patchTicket(supabase, t.id, { status: 'closed', closed_at: now.toISOString(), closed_by: auth.userId, closure_reason: closureReason, resolution_category: resolutionCategory, resolution: reason, resolved_at: t.resolved_at || now.toISOString() });
      await addMessage(supabase, { ticketId: t.id, authorType: 'system', authorId: auth.userId, visibility: 'internal', body: `Geschlossen: ${CLOSURE_LABELS[closureReason]}${resolutionCategory ? ` · ${RESOLUTION_LABELS[resolutionCategory]}` : ''} — ${reason}` });
      await audit('close', t.id, { reason, before: { status: t.status }, after: { status: 'closed', closure_reason: closureReason, resolution_category: resolutionCategory } });
      return { ticket: { ...updated, sla: slaState(updated, now) } };
    }

    if (action === 'reopen') {
      if (t.status !== 'closed' && t.status !== 'resolved') throw conflict('Nur gelöste oder geschlossene Tickets können wieder geöffnet werden.');
      if (reason.length < 3) throw badRequest('Zum Wiedereröffnen ist eine Begründung erforderlich.');
      // The closure event is never deleted: closed_at/closure_reason stay as history, the messages and the audit log keep it.
      const updated = await patchTicket(supabase, t.id, { status: 'open', reopened_at: now.toISOString(), reopen_count: (t.reopen_count || 0) + 1 });
      await addMessage(supabase, { ticketId: t.id, authorType: 'system', authorId: auth.userId, visibility: 'internal', body: `Wieder geöffnet — ${reason}` });
      await audit('reopen', t.id, { reason, before: { status: t.status, reopen_count: t.reopen_count }, after: { status: 'open', reopen_count: (t.reopen_count || 0) + 1 } });
      return { ticket: { ...updated, sla: slaState(updated, now) } };
    }

    throw badRequest(`Unbekannte Aktion "${action}".`);
  },
);
