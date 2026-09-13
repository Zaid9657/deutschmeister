import { Link } from 'react-router-dom';
import { PageHeader, Section, Badge, ErrorLine, Spinner, Footnote, SecondaryButton, num, hm } from '../../components/admin/adminUi.jsx';
import { useAdminData } from '../../components/admin/useAdminData.js';

const TONE = { operational: 'ok', degraded: 'warn', critical: 'error', unknown: 'muted' };
const DOT = { operational: 'bg-viz-pos', degraded: 'bg-viz-warn', critical: 'bg-viz-error', unknown: 'bg-graphite/40' };

function thresholdText(c) {
  if (!c.threshold) return null;
  const u = c.unit || '';
  return c.threshold.direction === 'desc' ? `Schwelle: unter ${c.threshold.degraded} beeinträchtigt, unter ${c.threshold.critical} kritisch ${u}` : `Schwelle: ab ${num(c.threshold.degraded)} beeinträchtigt, ab ${num(c.threshold.critical)} kritisch ${u}`;
}

export default function MonitoringPage() {
  const { data, loading, error, reload } = useAdminData('admin-status', {}, []);
  return (
    <>
      <PageHeader title="Systemstatus" lead="Jeder Status ist aus einer Messung gegen eine gedruckte Schwelle abgeleitet, nie erklärt. „Nicht instrumentiert“ ist ein eigener Zustand und überstimmt nie einen echten — ein fehlendes Thermometer ist kein Fieber." right={<SecondaryButton onClick={reload}>Neu messen</SecondaryButton>} />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data ? (
        <>
          <div className="mt-2 flex items-center gap-3 text-lg font-bold text-ink"><span className={`inline-block h-3 w-3 rounded-full ${DOT[data.overall]}`} aria-hidden="true" />Gesamtstatus: {data.overallLabel}<span className="text-xs font-normal text-graphite">— der schlechteste echte Check</span></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.checks.map((c) => (
              <div key={c.id} className={`rounded-lg border p-4 ${c.state === 'unknown' ? 'border-dashed border-rule bg-paper-sunk/60' : 'border-rule bg-white'}`}>
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-ink">{c.label}</span><Badge label={data.stateLabels[c.state]} tone={TONE[c.state]} /></div>
                <div className="mt-2 flex items-center gap-2 text-[1.375rem] font-bold tabular-nums text-ink"><span className={`inline-block h-2.5 w-2.5 rounded-full ${DOT[c.state]}`} aria-hidden="true" />{c.value === null || c.value === undefined ? '—' : `${typeof c.value === 'number' && c.unit === 'Anteil' ? Math.round(c.value * 100) + ' %' : num(c.value, typeof c.value === 'number' && !Number.isInteger(c.value) ? 2 : 0)}${c.unit && c.unit !== 'Anteil' ? ` ${c.unit}` : ''}`}</div>
                {c.threshold ? <div className="mt-1 text-[0.6875rem] text-graphite">{thresholdText(c)}</div> : null}
                {c.detail ? <div className="mt-1 text-xs text-graphite">{c.detail}</div> : null}
                {c.reason ? <div className="mt-1 text-xs text-graphite">{c.reason}</div> : null}
                {c.unblock ? <div className="mt-1 text-xs font-semibold text-ink">Nächster Schritt: {c.unblock}</div> : null}
                {c.action?.route ? <Link to={c.action.route} className="mt-2 inline-block text-xs font-semibold text-siegel-deep hover:underline">→ {c.action.label}</Link> : c.action?.label ? <div className="mt-2 text-xs text-graphite">→ {c.action.label}</div> : null}
              </div>
            ))}
          </div>
          <Section title="Schwellen" note="Jede Schwelle wurde gegen eine gemessene Produktionszahl gewählt, nicht aus einem Blogbeitrag; die Messung steht im Kommentar neben dem Wert (netlify/functions/_shared/adminStatusLib.mjs).">
            <pre className="overflow-x-auto font-data text-[0.6875rem] text-ink">{JSON.stringify(data.thresholds, null, 1)}</pre>
          </Section>
          <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote>
        </>
      ) : null}
    </>
  );
}
