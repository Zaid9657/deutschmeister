// User 360: eight panels, each naming its source; a panel the caller may
// not see says "nicht erlaubt". The actions column writes the field the
// gate reads and asks for a reason every time.
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader, Section, KeyValues, Badge, DataTable, ErrorLine, Spinner, Footnote, Field, Input, Select, ReasonField, PrimaryButton, SecondaryButton, dmy, hm, num, money, mmss } from '../../components/admin/adminUi.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';

const ACCESS_TONE = { subscription: 'ok', course: 'ok', trial: 'info', unbekannt: 'warn', free: 'muted' };
const SEV = { error: 'error', warn: 'warn', info: 'muted' };
const PRODUCTS = ['course_a1_2', 'course_a2_1', 'course_a2_2', 'course_b1_1', 'course_b1_2', 'course_b2_1', 'course_b2_2', 'telc_b1_komplett', 'course_alle'];

function Denied({ label }) {
  return <p className="py-2 text-[0.8125rem] text-graphite">{label}: für Ihre Rolle nicht erlaubt.</p>;
}

function Actions({ userId, state, onDone }) {
  const [action, setAction] = useState('grant_pro_days');
  const [days, setDays] = useState('30');
  const [tier, setTier] = useState('pro');
  const [role, setRole] = useState('');
  const [productKey, setProductKey] = useState(PRODUCTS[0]);
  const [reason, setReason] = useState('');
  const [run, m] = useAdminMutation('admin-actions');
  const params = action === 'grant_pro_days' || action === 'extend_trial' ? { days: Number(days) } : action === 'set_tier' ? { tier } : action === 'set_role' ? { role: role || null } : action === 'grant_course' || action === 'revoke_course' ? { productKey } : {};
  const submit = async () => {
    const r = await run({ action, userId, params, reason, idempotencyKey: `${action}:${userId}:${Date.now()}` });
    if (r) { setReason(''); onDone(); }
  };
  return (
    <Section title="Aktionen" note="Jede Aktion wird validiert, mit Vorher/Nachher protokolliert und gibt den neuen Zustand zurück. Keine Aktion hier schreibt in Lemon Squeezy — Kündigungen und Erstattungen laufen im LS-Dashboard.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Aktion">
          <Select value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="grant_pro_days">Pro-Tage gutschreiben (manuelle Abo-Zeile)</option>
            <option value="revoke_manual_access">Manuellen Zugang beenden</option>
            <option value="grant_course">Kurs freischalten</option>
            <option value="revoke_course">Kursfreischaltung zurücknehmen (nur manuelle)</option>
            <option value="extend_trial">Testphase verlängern</option>
            <option value="set_tier">Tier setzen (Sprech-/Schreibkontingent)</option>
            <option value="sync_flags">Profil-Flags mit Abos abgleichen</option>
            <option value="set_role">Admin-Rolle setzen</option>
          </Select>
        </Field>
        {action === 'grant_pro_days' || action === 'extend_trial' ? <Field label="Tage" hint={action === 'grant_pro_days' ? 'max. 365' : 'max. 60'}><Input type="number" min="1" max={action === 'grant_pro_days' ? 365 : 60} value={days} onChange={(e) => setDays(e.target.value)} /></Field> : null}
        {action === 'set_tier' ? <Field label="Tier"><Select value={tier} onChange={(e) => setTier(e.target.value)}>{['free', 'trial', 'pro', 'premium'].map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field> : null}
        {action === 'set_role' ? <Field label="Rolle"><Select value={role} onChange={(e) => setRole(e.target.value)}><option value="">keine</option>{['admin', 'support', 'finance', 'auditor', 'content'].map((r) => <option key={r} value={r}>{r}</option>)}</Select></Field> : null}
        {action === 'grant_course' || action === 'revoke_course' ? <Field label="Produkt"><Select value={productKey} onChange={(e) => setProductKey(e.target.value)}>{PRODUCTS.map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field> : null}
        <div className="sm:col-span-2"><ReasonField value={reason} onChange={setReason} /></div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <PrimaryButton onClick={submit} disabled={m.busy || reason.trim().length < 3}>{m.busy ? 'Wird ausgeführt…' : 'Ausführen'}</PrimaryButton>
        {state ? <span className="text-xs text-graphite">Aktuell: Tier {state.subscription_tier || '—'} · is_subscribed {String(state.is_subscribed)} · Rolle {state.role || '—'}</span> : null}
      </div>
      {m.error ? <ErrorLine>{m.error}</ErrorLine> : null}
      {m.result ? <p className="mt-2 rounded-md border border-viz-pos/30 bg-viz-pos/5 px-3 py-2 text-[0.8125rem] text-ink">✓ {m.result.summary}{m.result.duplicate ? ' (bereits ausgeführt)' : ''}</p> : null}
    </Section>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAdminData('admin-user360', { userId: id }, [id]);
  const a = data?.account;
  const ac = data?.access;
  return (
    <>
      <PageHeader
        title={a?.email || 'Nutzer'}
        lead={a ? `Registriert ${dmy(a.createdAt)} · E-Mail ${a.emailConfirmedAt ? `bestätigt ${dmy(a.emailConfirmedAt)}` : 'nicht bestätigt'} · letzte Anmeldung ${hm(a.lastSignInAt)}` : ''}
        right={<><Link to="/admin/users" className="text-sm text-siegel-deep hover:underline">‹ Zurück zur Liste</Link>{ac ? <Badge label={ac.classification.label} tone={ACCESS_TONE[ac.classification.kind]} /> : null}</>}
      />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data ? (
        <>
          {data.discrepancies.length > 0 ? (
            <Section title="Abgleich" note="Beleg und Empfehlung — kein automatischer Eingriff.">
              {data.discrepancies.map((d) => <div key={d.kind} className="border-t border-rule py-2 text-[0.8125rem]"><Badge label={d.kind} tone={SEV[d.severity]} /> <span className="text-graphite">{d.evidence}</span><div className="text-ink">→ {d.recommendation}</div></div>)}
            </Section>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Konto" note={`Quelle: ${a.source}`}>
              <KeyValues items={[['ID', <span key="id" className="font-data text-xs">{a.id}</span>], ['Name', a.fullName], ['Sprache', a.preferredLanguage], ['Stufe', a.currentLevel ? String(a.currentLevel).toUpperCase() : null], ['Prüfung', a.examTrack], ['Prüfungstermin', a.examDate ? dmy(a.examDate) : null], ['Tagesziel', a.dailyGoalTarget], ['Onboarding', a.onboardingCompletedAt ? `abgeschlossen ${dmy(a.onboardingCompletedAt)}` : 'offen'], ['Satz des Tages', a.emailDailySentence === false ? 'abbestellt' : 'aktiv'], ['Rolle', a.role ? <Badge key="r" label={a.role} tone="info" /> : null]]} />
            </Section>
            <Section title="Zugang" note={`Quelle: ${ac.source}`}>
              <KeyValues items={[['Wie', <Badge key="k" label={ac.classification.label} tone={ACCESS_TONE[ac.classification.kind]} />], ['Tier / is_subscribed', `${ac.tier || '—'} / ${String(ac.isSubscribed)}`], ['Testphase', ac.trialEndsAt ? `${ac.trialLive ? 'läuft bis' : 'endete'} ${dmy(ac.trialEndsAt)}` : 'nie gestartet'], ['Neuestes Abo-Ende', ac.latestSubscriptionEnd ? `${dmy(ac.latestSubscriptionEnd)} (${ac.subscriptionLive ? 'laufend' : 'abgelaufen'})` : null], ['Kurskäufe', ac.purchases.length ? ac.purchases.map((p) => `${p.productKey} (${p.status}${p.manual ? ', manuell' : ''})`).join(', ') : 'keine'], ['Sprech-Guthaben', ac.walletCents == null ? 'kein Wallet' : money(ac.walletCents)]]} />
              <p className="mt-3 rounded-md bg-paper-sunk px-3 py-2 text-xs text-ink"><strong>Das Zugangs-Gate liest:</strong> {ac.gateReads.contentAccess}<br /><strong>Kontingent-Gate liest:</strong> {ac.gateReads.quotaTier}</p>
            </Section>
          </div>
          {data.permitted.actions ? <Actions userId={id} state={{ subscription_tier: ac.tier, is_subscribed: ac.isSubscribed, role: a.role }} onDone={reload} /> : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Abonnements" note="Quelle: subscriptions · Anbieter-IDs maskiert">
              <DataTable dense rows={data.subscriptions} emptyText="Keine Abo-Zeilen."
                columns={[{ key: 'planType', label: 'Tarif', render: (r) => <span>{r.planType}{r.manual ? <Badge label="manuell" tone="info" className="ml-1" /> : null}</span> }, { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} tone={r.live ? 'ok' : 'muted'} /> }, { key: 'pricePaid', label: 'Preis', align: 'right', render: (r) => (r.pricePaid == null ? '—' : money(Math.round(Number(r.pricePaid) * 100))) }, { key: 'subscriptionEnd', label: 'Ende', render: (r) => dmy(r.subscriptionEnd) }, { key: 'lsSubscription', label: 'LS' }]} />
            </Section>
            <Section title="Zahlungen" note={data.payments ? `Quelle: ${data.payments.source}` : 'finance.read'}>
              {!data.permitted.payments ? <Denied label="Zahlungen" /> : (
                <>
                  <DataTable dense rows={data.payments.rows.map((r, i) => ({ ...r, id: i }))} emptyText="Keine Zahlungen aus Webhooks zuzuordnen."
                    columns={[{ key: 'at', label: 'Datum', render: (r) => dmy(r.at) }, { key: 'kind', label: 'Art' }, { key: 'net', label: 'Netto', align: 'right', render: (r) => money(r.net, r.currency) }, { key: 'gross', label: 'Brutto', align: 'right', render: (r) => money(r.gross, r.currency) }, { key: 'order', label: 'Bestellung' }]} />
                  {data.payments.failures.length ? <Footnote>Fehlgeschlagene Abbuchungen: {data.payments.failures.map((f) => dmy(f.failedAt)).join(', ')}</Footnote> : null}
                </>
              )}
            </Section>
          </div>
          <Section title="Lernen" note={data.learning ? `Quelle: ${data.learning.source} — Ergebnisse, keine Texte.` : 'user360.learning'}>
            {!data.permitted.learning ? <Denied label="Lernen" /> : (
              <>
                <KeyValues items={[['Zählungen', `Hören ${num(data.learning.counts.listening)} · Lesen ${num(data.learning.counts.reading)} · Schreiben ${num(data.learning.counts.writing)} · Vokabelkarten ${num(data.learning.counts.srsCards)} · Gelernte Wörter ${num(data.learning.counts.learnedItems)}`]]} />
                <h3 className="mt-3 text-sm font-bold text-ink">Grammatik ({data.learning.grammar.length})</h3>
                <DataTable dense rows={data.learning.grammar.map((g) => ({ ...g, id: g.topic_id }))} emptyText="Kein Grammatik-Fortschritt."
                  columns={[{ key: 'title', label: 'Thema', render: (g) => `${g.level || ''} ${g.title || g.slug || g.topic_id}` }, { key: 'current_stage', label: 'Stufe', align: 'right' }, { key: 'score', label: 'Score', align: 'right', render: (g) => (g.score == null ? '—' : num(g.score)) }, { key: 'is_completed', label: 'Fertig', render: (g) => (g.is_completed ? '✓' : '—') }, { key: 'last_accessed', label: 'Zuletzt', render: (g) => dmy(g.last_accessed || g.created_at) }]} />
                <h3 className="mt-3 text-sm font-bold text-ink">Sprechen ({data.learning.speaking.length})</h3>
                <DataTable dense rows={data.learning.speaking.map((s, i) => ({ ...s, id: i }))} emptyText="Keine Sprechsitzungen."
                  columns={[{ key: 'created_at', label: 'Datum', render: (s) => hm(s.created_at) }, { key: 'level', label: 'Stufe' }, { key: 'mode', label: 'Modus' }, { key: 'status', label: 'Status' }, { key: 'duration_seconds', label: 'Dauer', render: (s) => mmss(s.duration_seconds) }, { key: 'score', label: 'Score', align: 'right', render: (s) => (s.score == null ? '—' : num(s.score)) }]} />
                {data.learning.exams.length ? <><h3 className="mt-3 text-sm font-bold text-ink">Prüfungsversuche</h3><DataTable dense rows={data.learning.exams.map((e, i) => ({ ...e, id: i }))} columns={[{ key: 'exam_key', label: 'Prüfung' }, { key: 'section', label: 'Teil' }, { key: 'status', label: 'Status' }, { key: 'score', label: 'Punkte', align: 'right', render: (e) => (e.score == null ? '—' : `${e.score}/${e.max_score ?? '?'}`) }, { key: 'started_at', label: 'Start', render: (e) => dmy(e.started_at) }]} /></> : null}
                {data.learning.lessons.length ? <><h3 className="mt-3 text-sm font-bold text-ink">Kurs-Lektionen</h3><DataTable dense rows={data.learning.lessons.map((l, i) => ({ ...l, id: i }))} columns={[{ key: 'level', label: 'Stufe' }, { key: 'lektion_id', label: 'Lektion' }, { key: 'status', label: 'Status' }, { key: 'accuracy', label: 'Genauigkeit', align: 'right' }, { key: 'updated_at', label: 'Zuletzt', render: (l) => dmy(l.updated_at) }]} /></> : null}
              </>
            )}
          </Section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Tickets" note={data.tickets ? `Quelle: ${data.tickets.source}` : 'support.read'}>
              {!data.permitted.tickets ? <Denied label="Tickets" /> : <DataTable dense rows={data.tickets.rows} rowTo={(t) => `/admin/support?ticket=${t.id}`} emptyText="Keine Tickets." columns={[{ key: 'reference', label: 'Referenz' }, { key: 'subject', label: 'Betreff' }, { key: 'status', label: 'Status' }, { key: 'priority', label: 'Prio' }, { key: 'sla', label: 'SLA' }, { key: 'last_activity_at', label: 'Aktivität', render: (t) => dmy(t.last_activity_at) }]} />}
            </Section>
            <Section title="Lebenszyklus-Mails" note="Quelle: lifecycle_emails">
              <DataTable dense rows={data.lifecycle.rows.map((r, i) => ({ ...r, id: i }))} emptyText="Keine Mails gesendet." columns={[{ key: 'kind', label: 'Art' }, { key: 'sent_at', label: 'Gesendet', render: (r) => hm(r.sent_at) }]} />
            </Section>
          </div>
          <Section title="Prüfprotokoll (dieser Nutzer)" note={data.audit ? `Quelle: ${data.audit.source}` : 'audit.read'}>
            {!data.permitted.audit ? <Denied label="Prüfprotokoll" /> : <DataTable dense rows={data.audit.rows} emptyText="Keine Admin-Aktionen auf diesem Konto." columns={[{ key: 'occurred_at', label: 'Zeit', render: (r) => hm(r.occurred_at) }, { key: 'actor_email', label: 'Akteur', render: (r) => `${r.actor_email || r.actor_id.slice(0, 8)} (${r.actor_role})` }, { key: 'action', label: 'Aktion' }, { key: 'outcome', label: 'Ergebnis' }, { key: 'reason', label: 'Begründung' }]} />}
          </Section>
          <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote>
          <div className="mt-2"><SecondaryButton onClick={reload}>Neu laden</SecondaryButton></div>
        </>
      ) : null}
    </>
  );
}
