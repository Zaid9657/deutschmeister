import { useSearchParams } from 'react-router-dom';
import { PageHeader, Section, Tabs, Stat, StatRow, DataTable, Badge, ErrorLine, Spinner, Footnote, KeyValues, dmy, hm, num, money } from '../../components/admin/adminUi.jsx';
import { useAdminData } from '../../components/admin/useAdminData.js';

const TABS = [{ id: 'failed', label: 'Zahlung überfällig' }, { id: 'discrepancies', label: 'Abgleich' }, { id: 'all', label: 'Alle Abonnements' }, { id: 'purchases', label: 'Kurskäufe' }, { id: 'webhooks', label: 'Webhook-Fehler' }];
const SEV = { error: 'error', warn: 'warn', info: 'muted' };

export default function OperationsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'failed';
  const setTab = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', id); return n; });
  const { data, loading, error } = useAdminData('admin-ops', {}, []);
  const s = data?.summary;
  return (
    <>
      <PageHeader title="Abonnements" lead="Eine Abfrage, drei Sichten. Die Abgleich-Warteschlange liefert Beleg und Empfehlung, nie eine automatische Korrektur — auf dieser Population wären etwa die Hälfte der Auffälligkeiten legitim." />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data ? (
        <>
          <StatRow>
            <Stat label="Gesamt" value={num(s.total)} definition="Alle subscriptions-Zeilen" timeClass="Aktueller Stand" />
            <Stat label="Laufend" value={num(s.live)} definition={data.definitions.live} timeClass="Aktueller Stand" />
            <Stat label="Zahlend" value={num(s.paying)} definition="Laufend, bezahlt, verlängernd" timeClass="Aktueller Stand" />
            <Stat label="MRR" value={money(s.mrr)} definition={data.definitions.mrr} timeClass="Aktueller Stand" />
            <Stat label="Testphase" value={num(s.trial)} definition="Profil mit laufender Testphase und ohne laufendes Abo" timeClass="Aktueller Stand" />
            <Stat label="Überfällig" value={num(s.failedPayments)} tone={s.failedPayments > 0 ? 'warn' : 'ink'} definition={data.definitions.failedPayment} timeClass="Aktueller Stand" />
            <Stat label="Kündigung geplant" value={num(s.cancelAtPeriodEnd)} definition="cancel_at_period_end auf laufenden Zeilen" timeClass="Aktueller Stand" />
            <Stat label="Abweichungen" value={num(s.discrepancies)} tone={s.discrepancies > 0 ? 'warn' : 'ink'} definition={data.definitions.discrepancies} timeClass="Aktueller Stand" />
          </StatRow>
          <Tabs tabs={TABS.map((t) => ({ ...t, count: t.id === 'failed' ? s.failedPayments : t.id === 'discrepancies' ? s.discrepancies : t.id === 'all' ? s.total : t.id === 'purchases' ? s.courses : data.failedWebhooks.length }))} active={tab} onChange={setTab} />
          {tab === 'failed' ? (
            <Section title="Zahlung überfällig" note={data.definitions.failedPayment}>
              <DataTable dense rowTo={(r) => `/admin/user/${r.userId}`} rows={data.failedPayments} emptyText="Keine überfälligen Zahlungen."
                columns={[{ key: 'email', label: 'Nutzer' }, { key: 'planType', label: 'Tarif' }, { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} tone="warn" /> }, { key: 'subscriptionEnd', label: 'Periode bis', render: (r) => dmy(r.subscriptionEnd) }, { key: 'lsSubscription', label: 'LS-Abo' }, { key: 'failures', label: 'Fehlversuche', render: (r) => r.failures.length ? r.failures.map(dmy).join(', ') : '—' }]} />
            </Section>
          ) : null}
          {tab === 'discrepancies' ? (
            <Section title="Abgleich" note="Beleg → Empfehlung. Entscheiden Sie im Lemon-Squeezy-Dashboard oder über die Aktionen in Nutzer 360; nichts hier schreibt automatisch.">
              {data.discrepancies.length === 0 ? <p className="py-3 text-[0.8125rem] text-graphite">Keine Abweichungen — Profil-Flags und Abo-Zeilen stimmen überein.</p> : data.discrepancies.map((d, i) => (
                <div key={`${d.userId}-${d.kind}-${i}`} className="border-t border-rule py-3 text-[0.8125rem]">
                  <div className="flex flex-wrap items-center gap-2"><Badge label={d.kind} tone={SEV[d.severity]} /><a href={`/admin/user/${d.userId}`} className="font-semibold text-siegel-deep hover:underline">{d.email || d.userId}</a></div>
                  <div className="mt-1 text-graphite">Beleg: {d.evidence}</div>
                  <div className="mt-0.5 text-ink">Empfehlung: {d.recommendation}</div>
                </div>
              ))}
            </Section>
          ) : null}
          {tab === 'all' ? (
            <Section title="Alle Abonnements">
              <DataTable dense rowTo={(r) => `/admin/user/${r.userId}`} rows={data.table}
                columns={[{ key: 'email', label: 'Nutzer' }, { key: 'planType', label: 'Tarif', render: (r) => <span>{r.planType}{r.manual ? <Badge label="manuell" tone="info" className="ml-1" /> : null}</span> }, { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} tone={r.failedPayment ? 'warn' : r.live ? 'ok' : 'muted'} /> }, { key: 'pricePaid', label: 'Preis', align: 'right', render: (r) => (r.pricePaid == null ? '—' : money(Math.round(Number(r.pricePaid) * 100))) }, { key: 'subscriptionStart', label: 'Start', render: (r) => dmy(r.subscriptionStart) }, { key: 'subscriptionEnd', label: 'Ende', render: (r) => dmy(r.subscriptionEnd) }, { key: 'access', label: 'Zugang (wie)' }, { key: 'lsSubscription', label: 'LS-Abo' }]} />
            </Section>
          ) : null}
          {tab === 'purchases' ? (
            <Section title="Kurskäufe" note="purchases: Einmalkäufe (unbefristet). Manuelle Freischaltungen tragen eine manual-… Bestellnummer.">
              <DataTable dense rowTo={(r) => `/admin/user/${r.userId}`} rows={data.purchases} emptyText="Noch keine Kurskäufe."
                columns={[{ key: 'email', label: 'Nutzer' }, { key: 'productKey', label: 'Produkt', render: (r) => <span>{r.productKey}{r.manual ? <Badge label="manuell" tone="info" className="ml-1" /> : null}</span> }, { key: 'status', label: 'Status', render: (r) => <Badge label={r.status} tone={r.status === 'active' ? 'ok' : 'muted'} /> }, { key: 'pricePaid', label: 'Preis', align: 'right', render: (r) => (r.pricePaid == null ? '—' : money(Math.round(Number(r.pricePaid) * 100))) }, { key: 'createdAt', label: 'Datum', render: (r) => dmy(r.createdAt) }]} />
            </Section>
          ) : null}
          {tab === 'webhooks' ? (
            <Section title="Webhook-Fehler" note="webhook_logs mit processed = false (die letzten 50). Ein Fehler hier heißt: Geld ist geflossen, aber der Zugang wurde möglicherweise nicht geschrieben.">
              <DataTable dense rows={data.failedWebhooks} emptyText="Keine fehlgeschlagenen Webhooks."
                columns={[{ key: 'createdAt', label: 'Zeit', render: (r) => hm(r.createdAt) }, { key: 'eventType', label: 'Ereignis' }, { key: 'error', label: 'Fehler', render: (r) => <span className="font-data text-[0.6875rem]">{r.error || '—'}</span> }]} />
              <KeyValues items={[['Zahlungsfehler (payment_failures, letzte 50)', data.paymentFailures.length ? data.paymentFailures.slice(0, 10).map((f) => `${f.email || f.userId?.slice(0, 8)} ${dmy(f.failedAt)}`).join(' · ') : '—']]} />
            </Section>
          ) : null}
          <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote>
        </>
      ) : null}
    </>
  );
}
