// Admin panel — support rules, pure.
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
