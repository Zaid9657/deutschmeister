// Learner-facing support form (Profil). Opens a ticket through
// support-ticket-create (identity from the JWT); the thread the learner sees
// back is public messages only.
import { useEffect, useState } from 'react';
import { supabase, getAuthHeaders } from '../utils/supabase';
import Button from './ui/Button.jsx';

const CATEGORIES = [['technical', 'Technisches Problem'], ['payment', 'Zahlung / Abo'], ['content', 'Inhalt / Fehler in einer Lektion'], ['account', 'Konto'], ['suggestion', 'Vorschlag'], ['other', 'Sonstiges']];

async function call(body) {
  const headers = { 'Content-Type': 'application/json', ...(await getAuthHeaders()) };
  const res = await fetch('/.netlify/functions/support-ticket-create', { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Fehler ${res.status}`);
  return json;
}

export default function SupportRequestForm() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
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
      const r = await call({ subject, category, body });
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
          <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">Betreff</span><input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={3} maxLength={200} /></label>
          <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">Thema</span><select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        </div>
        <label className="block text-sm"><span className="mb-1 block font-semibold text-ink">Nachricht</span><textarea className={`${inputCls} min-h-[6rem]`} value={body} onChange={(e) => setBody(e.target.value)} required minLength={10} maxLength={5000} /></label>
        {error ? <p className="text-sm text-viz-error">{error}</p> : null}
        <Button type="submit" disabled={busy}>{busy ? 'Wird gesendet…' : 'Anfrage senden'}</Button>
      </form>
      {tickets.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {tickets.map((t) => <li key={t.id} className="flex justify-between gap-2 border-t border-rule py-1.5"><span className="truncate">{t.reference} · {t.subject}</span><span className="text-graphite">{t.status === 'closed' || t.status === 'resolved' ? 'erledigt' : t.status === 'waiting_user' ? 'Antwort erhalten' : 'in Bearbeitung'}</span></li>)}
        </ul>
      ) : null}
    </div>
  );
}
