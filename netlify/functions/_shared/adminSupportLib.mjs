// Admin panel — support rules, pure, plus the ONE reply-send path.
//
// The rules (SLA, vocabularies, references) are pure. The send path at the
// bottom (sendTicketReply) is the only code that emails a customer a ticket
// reply: admin-support's `reply` action and the support agent both call it,
// with the database client and fetch injected, so there is one definition of
// "claim the message row, call Resend, record the outcome, move the ticket".
// It imports only the pure brand copy, so every caller (and every test) can load it.
import { BRAND } from './brand.mjs';

export const SLA_HOURS = Object.freeze({ urgent: 4, high: 12, normal: 48, low: 120 }); // CALENDAR hours — the product publishes no support window

export const TICKET_STATUSES = Object.freeze(['new', 'open', 'waiting_user', 'resolved', 'closed']);
export const OPEN_STATUSES = Object.freeze(['new', 'open', 'waiting_user']);
export const PRIORITIES = Object.freeze(['low', 'normal', 'high', 'urgent']);
export const CATEGORIES = Object.freeze(['technical', 'payment', 'content', 'account', 'suggestion', 'other']);

export const STATUS_LABELS = Object.freeze({ new: 'Neu', open: 'Offen', waiting_user: 'Wartet auf Nutzer', resolved: 'Gelöst', closed: 'Geschlossen' });
export const PRIORITY_LABELS = Object.freeze({ low: 'Niedrig', normal: 'Normal', high: 'Hoch', urgent: 'Dringend' });
export const CATEGORY_LABELS = Object.freeze({ technical: 'Technik', payment: 'Zahlung', content: 'Inhalt', account: 'Konto', suggestion: 'Vorschlag', other: 'Sonstiges' });

/** Lösungsart — WHAT was done. */
export const RESOLUTION_CATEGORIES = Object.freeze(['answered', 'technical_fix', 'access_correction', 'payment_refund', 'content_correction', 'duplicate', 'no_action', 'other']);
export const RESOLUTION_LABELS = Object.freeze({ answered: 'Beantwortet', technical_fix: 'Technische Korrektur', access_correction: 'Zugang korrigiert', payment_refund: 'Erstattung', content_correction: 'Inhalt korrigiert', duplicate: 'Duplikat', no_action: 'Keine Aktion', other: 'Sonstiges' });
/** Abschlussgrund — WHY the lifecycle ended. */
export const CLOSURE_REASONS = Object.freeze(['resolved_confirmed', 'no_response', 'duplicate', 'spam', 'withdrawn', 'merged', 'other']);
export const CLOSURE_LABELS = Object.freeze({ resolved_confirmed: 'Gelöst und bestätigt', no_response: 'Keine Rückmeldung', duplicate: 'Duplikat', spam: 'Spam', withdrawn: 'Zurückgezogen', merged: 'Zusammengeführt', other: 'Sonstiges' });

export function slaDueAt(createdAt, priority) {
  const h = SLA_HOURS[priority] ?? SLA_HOURS.normal;
  return new Date(Date.parse(createdAt) + h * 3600000).toISOString();
}

/** met · breached · due_soon · on_track · unknown */
export function slaState(ticket, now = new Date()) {
  const due = ticket.sla_due_at ? Date.parse(ticket.sla_due_at) : null;
  if (!due) return 'unknown';
  const answered = Boolean(ticket.first_response_at) || ['resolved', 'closed'].includes(ticket.status);
  if (answered) {
    if (!ticket.first_response_at) return 'unknown'; // answered, but nobody recorded when — never back-date it
    return Date.parse(ticket.first_response_at) <= due ? 'met' : 'breached';
  }
  const t = now.getTime();
  if (t > due) return 'breached';
  if (due - t <= 2 * 3600000) return 'due_soon';
  return 'on_track';
}

export const SLA_LABELS = Object.freeze({ met: 'SLA eingehalten', breached: 'SLA verletzt', due_soon: 'Bald fällig', on_track: 'Im Plan', unknown: 'Unbekannt' });

/** A human-quotable reference: DM-XXXXXXXX. */
export function ticketReference(uuid) {
  return `DM-${String(uuid).replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// ─── AI drafts (netlify/functions/support-agent.mjs) ─────────────────────────
//
// A held AI reply is a support_ticket_messages row the CHECK constraints
// already allow: author_type 'system', visibility 'internal', delivery_status
// 'queued', body starting with AI_DRAFT_MARKER. Internal, so no learner-facing
// query can see it while it waits. Sending flips THAT row to public (the
// claim); stopping it sets delivery_status NULL with delivery_error
// 'cancelled: …'. A draft the validator rejected is stored with
// AI_BLOCKED_MARKER and no delivery status, so it can never be sent.

export const AI_DRAFT_MARKER = '[KI-Entwurf]';
export const AI_BLOCKED_MARKER = '[KI-Entwurf, nicht versendbar]';
export const AI_CANCELLED_PREFIX = 'cancelled: ';

/** The one definition of "an AI reply is waiting to be sent". */
export function isPendingAiDraft(m) {
  return Boolean(m)
    && m.author_type === 'system'
    && m.visibility === 'internal'
    && m.delivery_status === 'queued'
    && typeof m.body === 'string'
    && m.body.startsWith(AI_DRAFT_MARKER);
}

/** Any AI draft row, pending, stopped or blocked (the admin screen labels them). */
export function aiDraftState(m) {
  if (!m || m.author_type !== 'system' || typeof m.body !== 'string') return null;
  if (m.body.startsWith(AI_BLOCKED_MARKER)) return 'blocked';
  if (!m.body.startsWith(AI_DRAFT_MARKER)) return null;
  if (isPendingAiDraft(m)) return 'pending';
  if (String(m.delivery_error || '').startsWith(AI_CANCELLED_PREFIX)) return 'cancelled';
  return null;
}

/** The reply text without the marker line. */
export function stripAiDraftMarker(body) {
  const s = String(body || '');
  for (const marker of [AI_DRAFT_MARKER, AI_BLOCKED_MARKER]) {
    if (s.startsWith(marker)) return s.slice(marker.length).replace(/^[^\n]*\n/, '').trim();
  }
  return s.trim();
}

/**
 * Stop every pending AI draft on a ticket (or one, by id). A conditional
 * update: only a row that is still internal + queued changes, so a draft the
 * agent already claimed for sending is never touched. Returns the stopped ids.
 */
export async function cancelPendingAiDrafts(db, ticketId, reason, { draftId = null } = {}) {
  let q = db.from('support_ticket_messages')
    .update({ delivery_status: null, delivery_error: `${AI_CANCELLED_PREFIX}${String(reason || 'stopped').slice(0, 200)}` })
    .eq('ticket_id', ticketId)
    .eq('author_type', 'system')
    .eq('visibility', 'internal')
    .eq('delivery_status', 'queued')
    .like('body', `${AI_DRAFT_MARKER}%`);
  if (draftId) q = q.eq('id', draftId);
  const { data, error } = await q.select('id');
  if (error) throw new Error(error.message);
  return (data || []).map((r) => r.id);
}

// ─── The reply send path (admin-support `reply` + the support agent) ────────

export const SUPPORT_FROM_ADDRESS = 'DeutschMeister Support <zaid@deutsch-meister.de>';
export const SUPPORT_REPLY_TO = 'kontakt@deutsch-meister.de';

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Subject, HTML and text of a ticket reply. `language` only switches the frame. */
export function renderReplyEmail({ reference, subject, body, language = 'de' }) {
  const en = language === 'en';
  const footer = en ? `Ticket ${reference} · Simply reply to this email.` : `Ticket ${reference} · Antworten Sie einfach auf diese E-Mail.`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.ink};max-width:600px">${String(body)
    .split('\n')
    .map((l) => `<p style="margin:0 0 12px">${escapeHtml(l)}</p>`)
    .join('')}<p style="margin-top:24px;font-size:13px;color:${BRAND.graphite}">${escapeHtml(footer)}</p></div>`;
  return {
    subject: `[${reference}] ${subject || (en ? 'Your request to DeutschMeister' : 'Ihre Anfrage bei DeutschMeister')}`,
    html,
    text: `${body}\n\n${footer}`,
  };
}

/** One Resend call. Never throws: { ok } or { ok: false, error }. */
export async function deliverReplyEmail(fetchImpl, env, { to, reference, subject, body, language }) {
  const key = env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY nicht gesetzt' };
  const mail = renderReplyEmail({ reference, subject, body, language });
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: SUPPORT_FROM_ADDRESS, to: [to], reply_to: SUPPORT_REPLY_TO, subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Resend nicht erreichbar: ${e?.message || e}` };
  }
}

/**
 * THE send path. Claim before send:
 *   - a human reply claims by inserting its public row as `queued`;
 *   - an AI draft (draftId) claims by flipping its internal+queued row to
 *     public in one conditional update — if a human stopped it, or another run
 *     already claimed it, nothing matches and nothing is sent.
 * Then one Resend call, then the row becomes sent | failed, then the ticket
 * moves, then `onAudit` records it. A FAILED send is not an answer: it moves
 * last_activity_at only, so the ticket stays unanswered and the SLA keeps
 * running (until 2026-09-30 a failed send set first_response_at and
 * waiting_user as if the customer had been answered).
 * Returns { claimed, delivered, error, message, ticket }.
 */
export async function sendTicketReply({
  db, fetchImpl = globalThis.fetch, env = process.env, ticket, body, language = 'de',
  authorType = 'admin', authorId = null, draftId = null, now = new Date(), onAudit = null,
}) {
  const nowIso = now.toISOString();
  const text = String(body || '').trim();
  if (!ticket?.user_email) return { claimed: false, delivered: false, error: 'Ticket ohne E-Mail-Adresse' };
  if (!text) return { claimed: false, delivered: false, error: 'Leere Antwort' };

  let message;
  if (draftId) {
    const { data, error } = await db.from('support_ticket_messages')
      .update({ visibility: 'public', body: text })
      .eq('id', draftId)
      .eq('ticket_id', ticket.id)
      .eq('visibility', 'internal')
      .eq('delivery_status', 'queued')
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { claimed: false, delivered: false, error: null };
    message = data;
  } else {
    const { data, error } = await db.from('support_ticket_messages')
      .insert({ ticket_id: ticket.id, author_type: authorType, author_id: authorId, visibility: 'public', body: text, delivery_status: 'queued' })
      .select('*')
      .maybeSingle();
    if (error) throw new Error(error.message);
    message = data;
  }

  const sent = await deliverReplyEmail(fetchImpl, env, { to: ticket.user_email, reference: ticket.reference, subject: ticket.subject, body: text, language });

  const { data: updatedMsg, error: mErr } = await db.from('support_ticket_messages')
    .update({ delivery_status: sent.ok ? 'sent' : 'failed', delivery_error: sent.ok ? null : sent.error })
    .eq('id', message.id)
    .select('*')
    .maybeSingle();
  if (mErr) console.error('[support-send] delivery status not recorded:', mErr.message);

  const ticketPatch = {
    last_activity_at: nowIso,
    ...(sent.ok && (ticket.status === 'new' || ticket.status === 'open') ? { status: 'waiting_user' } : {}),
    ...(sent.ok && !ticket.first_response_at ? { first_response_at: nowIso } : {}),
  };
  const { data: updatedTicket, error: tErr } = await db.from('support_tickets')
    .update(ticketPatch)
    .eq('id', ticket.id)
    .select('*')
    .maybeSingle();
  if (tErr) console.error('[support-send] ticket not updated:', tErr.message);

  if (onAudit) await onAudit({ messageId: message.id, delivered: sent.ok, error: sent.error || null });
  return { claimed: true, delivered: sent.ok, error: sent.error || null, message: updatedMsg || message, ticket: updatedTicket || ticket };
}
