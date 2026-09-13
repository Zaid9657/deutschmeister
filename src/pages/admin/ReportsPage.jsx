import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Section, DataTable, ErrorLine, Spinner, Footnote, SecondaryButton, ChipRow, num, pct, money, hm } from '../../components/admin/adminUi.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';
import { useAdminFilters } from '../../components/admin/AdminFilterContext.jsx';
import { useAdminSession } from '../../components/admin/AdminSessionContext.jsx';

const fmt = (r) => (r.value === null || r.value === undefined ? '—' : r.unit === 'cents' ? money(r.value) : r.unit === 'ratio' ? pct(r.value, 1) : num(r.value));

export default function ReportsPage() {
  const { range, level } = useAdminFilters();
  const { can } = useAdminSession();
  const [report, setReport] = useState('operations');
  const lvl = level === 'all' || level === 'unbekannt' ? null : level;
  const { data, loading, error } = useAdminData('admin-reports', { report, range, level: lvl }, [report, range, lvl]);
  const [exportCsv, exp] = useAdminMutation('admin-reports');
  const download = async () => {
    const r = await exportCsv({ report, range, level: lvl, format: 'csv' });
    if (!r?.csv) return;
    const url = URL.createObjectURL(new Blob(['﻿', r.csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = r.filename; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeader title="Berichte" lead="Kein Bericht führt eine neue Kennzahl ein — jeder setzt Zahlen zusammen, die Cockpit, Warteschlangen, Nutzung und Support bereits berechnen, und jede Zeile führt zu den Datensätzen dahinter." right={can('export') ? <SecondaryButton onClick={download} disabled={exp.busy}>{exp.busy ? 'Export läuft…' : 'CSV exportieren'}</SecondaryButton> : null} />
      <div className="mt-1"><ChipRow label="Bericht" options={[{ id: 'operations', label: 'Betrieb (täglich)' }, { id: 'founder', label: 'Wochenbericht' }, { id: 'activation', label: 'Aktivierung' }, { id: 'usage', label: 'Nutzungsqualität' }, { id: 'support', label: 'Support & SLA' }, { id: 'content', label: 'Inhalte' }]} value={report} onChange={setReport} /></div>
      {exp.error ? <ErrorLine>{exp.error}</ErrorLine> : null}
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data?.sections ? (
        <>
          {data.sections.map((sec) => (
            <Section key={sec.title} title={sec.title} note={sec.note}>
              <DataTable dense rows={sec.rows.map((r, i) => ({ ...r, id: i }))} columns={[{ key: 'label', label: 'Kennzahl' }, { key: 'value', label: 'Wert', align: 'right', render: fmt }, { key: 'definition', label: 'Definition', render: (r) => <span className="text-xs text-graphite">{r.definition || '—'}</span> }, { key: 'route', label: '', render: (r) => (r.route ? <Link to={r.route} className="text-xs text-siegel-deep hover:underline">öffnen ›</Link> : null) }]} />
            </Section>
          ))}
          <Footnote>PDF ist bewusst nicht verfügbar: {data.pdf.reason} Zeitraum {data.days} T · Zeitzone UTC · Stand {hm(data.generatedAt)}</Footnote>
        </>
      ) : null}
    </>
  );
}
