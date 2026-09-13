// Support: list + detail. An internal note is a different ROW, indented,
// badged INTERN, on a tinted background — never a differently styled field.
import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader, Section, Stat, StatRow, Tabs, Badge, ErrorLine, Spinner, Footnote, Field, Input, Select, Textarea, ReasonField, PrimaryButton, SecondaryButton, KeyValues, hm, num } from '../../components/admin/adminUi.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';
import { useAdminSession } from '../../components/admin/AdminSessionContext.jsx';

const SLA_TONE = { met: 'ok', breached: 'error', due_soon: 'warn', on_track: 'muted', unknown: 'muted' };
const SLA_LABEL = { met: 'SLA eingehalten', breached: 'SLA verletzt', due_soon: 'Bald fällig', on_track: 'Im Plan', unknown: 'SLA unbekannt' };
const STATUS_TONE = { new: 'info', open: 'warn', waiting_user: 'muted', resolved: 'ok', closed: 'muted' };
const TABS = [{ id: 'open', label: 'Offen' }, { id: 'new', label: 'Neu' }, { id: 'waiting_user', label: 'Wartet auf Nutzer' }, { id: 'resolved', label: 'Gelöst' }, { id: 'closed', label: 'Geschlossen' }, { id: '', label: 'Alle' }];

function labelOf(vocab, list, id) {
  return vocab?.[list]?.find((x) => x.id === id)?.label ?? id;
}

function Detail({ ticketId, onChanged }) {
  const { can, session } = useAdminSession();
  const { data, loading, error, reload } = useAdminData('admin-support', { action: 'detail', ticketId }, [ticketId]);
  const [act, m] = useAdminMutation('admin-support');
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [closure, setClosure] = useState('resolved_confirmed');
  const [resolution, setResolution] = useState('answered');
  const t = data?.ticket;
  const v = data?.vocab;
  const run = async (action, params = {}) => {
    const r = await act({ action, ticketId, params, reason });
    if (r) { setReason(''); reload(); onChanged(); }
    return r;
  };
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorLine>{error}</ErrorLine>;
  if (!t) return null;
  const writable = can('support.write');
  return (
    <Section title={`${t.reference} · ${t.subject || 'ohne Betreff'}`} note={`${labelOf(v, 'categories', t.category)} · Priorität ${labelOf(v, 'priorities', t.priority)} · ${t.user_email || 'ohne E-Mail'}${t.user_id ? ' ' : ''}`}
      right={<><Badge label={labelOf(v, 'statuses', t.status)} tone={STATUS_TONE[t.status]} /><Badge label={SLA_LABEL[t.sla]} tone={SLA_TONE[t.sla]} /></>}>
      <KeyValues items={[['Eröffnet', hm(t.created_at)], ['Erste Antwort', t.first_response_at ? hm(t.first_response_at) : 'noch keine'], ['SLA fällig', hm(t.sla_due_at)], ['Zugewiesen', t.assignee_email || '—'], ['Kanal', t.channel], ['Nutzer', t.user_id ? <Link key="u" to={`/admin/user/${t.user_id}`} className="text-siegel-deep hover:underline">Nutzer 360 öffnen</Link> : 'kein Konto verknüpft'], ...(t.closed_at ? [['Geschlossen', `${hm(t.closed_at)} · ${labelOf(v, 'closureReasons', t.closure_reason)}${t.resolution_category ? ` · ${labelOf(v, 'resolutionCategories', t.resolution_category)}` : ''}${t.reopen_count ? ` · ${t.reopen_count}× wieder geöffnet` : ''}`]] : [])]} />
      <h3 className="mt-4 text-sm font-bold text-ink">Verlauf</h3>
      <ol className="mt-2 space-y-2">
        {data.messages.map((msg) => {
          const internal = msg.visibility === 'internal';
          return (
            <li key={msg.id} className={`rounded-md border px-3 py-2 text-[0.8125rem] ${internal ? 'ml-6 border-dashed border-rule bg-paper-sunk' : msg.author_type === 'user' ? 'border-rule bg-white' : 'border-siegel/30 bg-siegel-wash/40'}`}>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-graphite">
                {internal ? <Badge label="INTERN" tone="muted" /> : <Badge label={msg.author_type === 'user' ? 'Nutzer' : msg.author_type === 'admin' ? 'Team' : 'System'} tone={msg.author_type === 'user' ? 'info' : 'ok'} />}
                <span>{hm(msg.created_at)}</span>
                {msg.author_email ? <span>{msg.author_email}</span> : null}
                {msg.delivery_status ? <Badge label={msg.delivery_status === 'sent' ? 'gesendet' : msg.delivery_status === 'failed' ? `Zustellung fehlgeschlagen: ${msg.delivery_error || ''}` : 'in Warteschlange'} tone={msg.delivery_status === 'sent' ? 'ok' : msg.delivery_status === 'failed' ? 'error' : 'warn'} /> : null}
              </div>
              <div className="whitespace-pre-wrap text-ink">{msg.body}</div>
            </li>
          );
        })}
      </ol>
      {writable ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <Field label="Antwort an den Nutzer (wird per E-Mail gesendet)"><Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Sehr geehrte/r …" /></Field>
            <div className="mt-2"><PrimaryButton disabled={m.busy || reply.trim().length < 2} onClick={async () => { const r = await run('reply', { body: reply }); if (r) setReply(''); }}>Antworten</PrimaryButton></div>
          </div>
          <div>
            <Field label="Interne Notiz (nie für den Nutzer sichtbar)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="mt-2"><SecondaryButton disabled={m.busy || note.trim().length < 2} onClick={async () => { const r = await run('note', { body: note }); if (r) setNote(''); }}>Notiz speichern</SecondaryButton></div>
          </div>
          <div className="lg:col-span-2"><ReasonField value={reason} onChange={setReason} required={false} /></div>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
            <SecondaryButton disabled={m.busy} onClick={() => run('assign', { assigneeId: session?.user?.id })}>Mir zuweisen</SecondaryButton>
            <SecondaryButton disabled={m.busy} onClick={() => run('status', { status: 'open' })}>Offen</SecondaryButton>
            <SecondaryButton disabled={m.busy} onClick={() => run('status', { status: 'waiting_user' })}>Wartet auf Nutzer</SecondaryButton>
            <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('status', { status: 'resolved' })}>Lösen (Begründung)</SecondaryButton>
            <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('priority', { priority: 'urgent' })}>Eskalieren: dringend</SecondaryButton>
            {t.status === 'closed' || t.status === 'resolved' ? <SecondaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('reopen')}>Wieder öffnen</SecondaryButton> : null}
          </div>
          {t.status !== 'closed' ? (
            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
              <Field label="Abschlussgrund"><Select value={closure} onChange={(e) => setClosure(e.target.value)}>{(v?.closureReasons || []).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select></Field>
              <Field label="Lösungsart"><Select value={resolution} onChange={(e) => setResolution(e.target.value)}>{(v?.resolutionCategories || []).map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select></Field>
              <div className="flex items-end"><PrimaryButton disabled={m.busy || reason.trim().length < 3} onClick={() => run('close', { closureReason: closure, resolutionCategory: resolution })}>Schließen (Begründung)</PrimaryButton></div>
            </div>
          ) : null}
          {m.error ? <ErrorLine>{m.error}</ErrorLine> : null}
        </div>
      ) : <Footnote>Ihre Rolle darf lesen, nicht antworten.</Footnote>}
    </Section>
  );
}

function Intake({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ userEmail: '', subject: '', body: '', category: 'other', priority: 'normal', channel: 'email' });
  const [act, m] = useAdminMutation('admin-support');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (!open) return <SecondaryButton onClick={() => setOpen(true)}>Ticket manuell anlegen</SecondaryButton>;
  return (
    <Section title="Ticket manuell anlegen" note="Für Anfragen, die per E-Mail kamen. Der erste Eintrag wird als Nachricht des Nutzers gespeichert.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="E-Mail des Nutzers"><Input value={f.userEmail} onChange={set('userEmail')} /></Field>
        <Field label="Betreff" required><Input value={f.subject} onChange={set('subject')} /></Field>
        <Field label="Kategorie"><Select value={f.category} onChange={set('category')}>{['technical', 'payment', 'content', 'account', 'suggestion', 'other'].map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <Field label="Priorität"><Select value={f.priority} onChange={set('priority')}>{['low', 'normal', 'high', 'urgent'].map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <div className="sm:col-span-2"><Field label="Text der Anfrage" required><Textarea value={f.body} onChange={set('body')} /></Field></div>
      </div>
      <div className="mt-3 flex gap-2">
        <PrimaryButton disabled={m.busy || !f.subject.trim() || !f.body.trim()} onClick={async () => { const r = await act({ action: 'create', params: f }); if (r) { setOpen(false); setF({ userEmail: '', subject: '', body: '', category: 'other', priority: 'normal', channel: 'email' }); onCreated(r.ticket?.id); } }}>Anlegen</PrimaryButton>
        <SecondaryButton onClick={() => setOpen(false)}>Abbrechen</SecondaryButton>
      </div>
      {m.error ? <ErrorLine>{m.error}</ErrorLine> : null}
    </Section>
  );
}

export default function SupportPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'open';
  const ticketId = params.get('ticket');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useAdminData('admin-support', { action: 'list', filters: { status: status || undefined, search: search || undefined } }, [status, search]);
  const setParam = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (v === null || v === '') n.delete(k); else n.set(k, v); return n; });
  const s = data?.summary;
  return (
    <>
      <PageHeader title="Support" lead="support_tickets: Anfragen aus der App (Profil → Support) und manuell erfasste E-Mails. SLA in Kalenderstunden (dringend 4 · hoch 12 · normal 48 · niedrig 120); ein beantwortetes Ticket ohne Zeitstempel der ersten Antwort ist „unbekannt“, nie „eingehalten“." right={<Intake onCreated={(id) => { reload(); if (id) setParam('ticket', id); }} />} />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {s ? (
        <StatRow>
          <Stat label="Offen" value={num(s.open)} definition="new, open, waiting_user" timeClass="Aktueller Stand" />
          <Stat label="Nicht zugewiesen" value={num(s.unassigned)} definition="offen ohne assignee" timeClass="Aktueller Stand" />
          <Stat label="Dringend" value={num(s.urgent)} tone={s.urgent > 0 ? 'error' : 'ink'} definition="offen mit Priorität urgent" timeClass="Aktueller Stand" />
          <Stat label="SLA verletzt" value={num(s.breached)} tone={s.breached > 0 ? 'error' : 'ink'} definition={`offen, Frist überschritten · beurteilbar ${num(s.slaCoverage.judgeable)} von ${num(s.slaCoverage.total)}`} timeClass="Aktueller Stand" />
          <Stat label="Bald fällig" value={num(s.dueSoon)} definition="innerhalb 2 Std. fällig" timeClass="Aktueller Stand" />
          <Stat label="Geschlossen" value={num(s.closed)} definition="status closed, seit Beginn" timeClass="Seit Beginn" />
        </StatRow>
      ) : null}
      <Tabs tabs={TABS} active={status} onChange={(id) => setParam('status', id === '' ? '' : id)} />
      <div className="mt-3 max-w-sm"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Referenz, Betreff oder E-Mail" /></div>
      <div className="mt-2 grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Section title={data ? `${data.total} Tickets` : 'Tickets'}>
          {data?.rows?.length === 0 ? <p className="py-3 text-[0.8125rem] text-graphite">Keine Tickets in dieser Sicht.</p> : null}
          <ul>
            {(data?.rows || []).map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => setParam('ticket', t.id)} className={`block w-full border-t border-rule py-2 text-left hover:bg-siegel-wash/60 ${ticketId === t.id ? 'bg-siegel-wash' : ''}`}>
                  <div className="flex items-center justify-between gap-2 text-xs text-graphite"><span className="font-data">{t.reference}</span><Badge label={SLA_LABEL[t.sla]} tone={SLA_TONE[t.sla]} /></div>
                  <div className="truncate text-[0.8125rem] font-semibold text-ink">{t.subject || 'ohne Betreff'}</div>
                  <div className="flex items-center gap-2 text-xs text-graphite"><Badge label={t.status} tone={STATUS_TONE[t.status]} /><span>{t.priority}</span><span>{hm(t.last_activity_at)}</span></div>
                </button>
              </li>
            ))}
          </ul>
        </Section>
        <div>{ticketId ? <Detail ticketId={ticketId} onChanged={reload} /> : <Section><p className="py-3 text-[0.8125rem] text-graphite">Ticket links auswählen.</p></Section>}</div>
      </div>
      {data ? <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote> : null}
    </>
  );
}
