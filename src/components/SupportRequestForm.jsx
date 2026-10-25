// Learner-facing support form (/support and Profil). Opens a ticket through
// support-ticket-create (identity from the JWT); the thread the learner sees
// back is public messages only — each ticket row opens it on demand, so a
// reply whose e-mail bounced or landed in spam can still be read here. The
// request shape lives in src/lib/supportTicket.js, which tests/support.test.mjs
// drives through the real handler.
import { useEffect, useState } from 'react';
import { supabase, getAuthHeaders } from '../utils/supabase';
import { SUPPORT_ENDPOINT, SUPPORT_CATEGORIES, SUBJECT_MIN, SUBJECT_MAX, BODY_MIN, BODY_MAX, ticketPayload } from '../lib/supportTicket.js';
import Button from './ui/Button.jsx';

async function call(body) {
  const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
  const res = await fetch(SUPPORT_ENDPOINT, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Fehler ${res.status}`);
  return json;
}

const statusLabel = (status) => (status === 'closed' || status === 'resolved' ? 'erledigt' : status === 'waiting_user' ? 'Antwort erhalten' : 'in Bearbeitung');

// One ticket: a disclosure that loads its public thread the first time it opens.
// Bodies are rendered as text, never as HTML.
function TicketRow({ ticket }) {
  const [state, setState] = useState('idle'); // idle | loading | error | done
  const [messages, setMessages] = useState([]);
  const fetchThread = () => {
    setState('loading');
    call({ action: 'thread', ticketId: ticket.id })
      .then((r) => { setMessages(r.messages || []); setState('done'); })
      .catch(() => setState('error'));
  };
  return (
    <li className="border-t border-rule py-1.5">
      <details onToggle={(e) => { if (e.currentTarget.open && state === 'idle') fetchThread(); }}>
        <summary className="flex cursor-pointer justify-between gap-2"><span className="truncate">{ticket.reference} · {ticket.subject}</span><span className="text-graphite">{statusLabel(ticket.status)}</span></summary>
        <div className="mt-2 space-y-2">
          {state === 'loading' ? <p className="text-graphite">Verlauf wird geladen…</p> : null}
          {state === 'error' ? (
            <p className="flex flex-wrap items-center gap-2 text-viz-error">Der Verlauf konnte nicht geladen werden.<Button variant="ghost" size="sm" onClick={fetchThread}>Erneut versuchen</Button></p>
          ) : null}
          {state === 'done' && messages.length === 0 ? <p className="text-graphite">Noch keine Nachrichten.</p> : null}
          {state === 'done' ? messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-rule px-3 py-2">
              <p className="text-xs text-graphite">{m.author_type === 'user' ? 'Sie' : 'DeutschMeister'} · {new Date(m.created_at).toLocaleDateString('de-DE')}</p>
              <p className="whitespace-pre-wrap text-ink">{m.body}</p>
            </div>
          )) : null}
        </div>
      </details>
    </li>
  );
}

export default function SupportRequestForm({ initialCategory = 'technical' }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) return;
      call({ action: 'list' }).then((r) => { if (alive) setTickets(r.tickets || []); }).catch(() => {});
    });
    return () => { alive = false; };
  }, [done]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await call(ticketPayload({ subject, category, body }));
      setDone(r.reference);
      setSubject('');
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm text-ink focus:border-siegel focus:outline-none';
  return (
    <div>
      {done ? <p className="mb-3 rounded-lg bg-siegel-wash px-3 py-2 text-sm text-siegel-deep">Danke — Ihre Anfrage {done} ist eingegangen. Wir antworten per E-Mail.</p> : null}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">Betreff</span><input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={SUBJECT_MIN} maxLength={SUBJECT_MAX} /></label>
          <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">Thema</span><select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>{SUPPORT_CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        </div>
        <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">Nachricht</span><textarea className={`${inputCls} min-h-[6rem]`} value={body} onChange={(e) => setBody(e.target.value)} required minLength={BODY_MIN} maxLength={BODY_MAX} /></label>
        {error ? <p className="text-sm text-viz-error">{error}</p> : null}
        <Button type="submit" disabled={busy}>{busy ? 'Wird gesendet…' : 'Anfrage senden'}</Button>
      </form>
      {tickets.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
        </ul>
      ) : null}
    </div>
  );
}
