// The user directory: saved views declared in code (each renders its rule),
// every filter a server predicate or an honestly-labelled post-filter, exact
// totals, and CSV export gated by the `export` capability.
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Section, DataTable, Pager, Badge, Input, Select, Field, ErrorLine, Spinner, Footnote, SecondaryButton, ChipRow, dmy, num, pct } from '../../components/admin/adminUi.jsx';
import { useAdminData, useAdminMutation } from '../../components/admin/useAdminData.js';
import { useAdminSession } from '../../components/admin/AdminSessionContext.jsx';

const ACCESS_TONE = { subscription: 'ok', course: 'ok', trial: 'info', unbekannt: 'warn', free: 'muted' };
const LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

export default function UsersPage() {
  const { can } = useAdminSession();
  const [params, setParams] = useSearchParams();
  const view = params.get('view') || '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ level: '', examTrack: '', tier: '', onboarding: '', accessKind: '', activation: '', role: '' });
  const body = { view: view || undefined, page, pageSize: 25, filters: { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), ...(search ? { search } : {}) } };
  const { data, loading, error } = useAdminData('admin-directory', body, [view, page, search, JSON.stringify(filters)]);
  const [exportCsv, exp] = useAdminMutation('admin-directory');
  const setF = (k) => (v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const setView = (id) => { setPage(1); setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('view', id); else n.delete('view'); return n; }); };
  const activeView = data?.savedViews?.find((v) => v.id === view);

  const download = async () => {
    const r = await exportCsv({ ...body, format: 'csv' });
    if (!r?.csv) return;
    const blob = new Blob(['\ufeff', r.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Nutzer"
        lead="Jeder Filter ist ein Datenbank-Prädikat auf profiles; Aktivierung, Zahlung und Konsistenz werden nach dem Laden über einen breiteren Ausschnitt geprüft und die Trefferzahl sagt dann, dass sie geschätzt ist."
        right={can('export') ? <SecondaryButton onClick={download} disabled={exp.busy}>{exp.busy ? 'Export läuft…' : 'CSV exportieren'}</SecondaryButton> : null}
      />
      {exp.error ? <ErrorLine>{exp.error}</ErrorLine> : null}
      <div className="mt-1">
        <ChipRow label="Gespeicherte Ansichten" options={[{ id: '', label: 'Alle' }, ...(data?.savedViews || []).map((v) => ({ id: v.id, label: v.label }))]} value={view} onChange={setView} />
        {activeView ? <p className="mt-1 text-xs text-graphite">Regel: <span className="font-data">{activeView.rule}</span></p> : null}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Suche"><Input value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="E-Mail, Name oder ID" /></Field>
        <Field label="Stufe"><Select value={filters.level} onChange={(e) => setF('level')(e.target.value)}><option value="">Alle</option>{LEVELS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}<option value="unbekannt">Unbekannt</option></Select></Field>
        <Field label="Prüfung"><Select value={filters.examTrack} onChange={(e) => setF('examTrack')(e.target.value)}><option value="">Alle</option>{['goethe_a1', 'goethe_a2', 'goethe_b1', 'telc_b1', 'dtz', 'telc_b2', 'none'].map((t) => <option key={t} value={t}>{t}</option>)}<option value="unknown">Unbekannt</option></Select></Field>
        <Field label="Zugang"><Select value={filters.accessKind} onChange={(e) => setF('accessKind')(e.target.value)}><option value="">Alle</option><option value="subscription">Abonnement</option><option value="course">Kurskauf</option><option value="trial">Testphase</option><option value="unbekannt">Unbekannt</option><option value="free">Kostenlos</option></Select></Field>
        <Field label="Aktivierung"><Select value={filters.activation} onChange={(e) => setF('activation')(e.target.value)}><option value="">Alle</option><option value="some">Aktiviert</option><option value="none">Nicht aktiviert</option></Select></Field>
        <Field label="Onboarding"><Select value={filters.onboarding} onChange={(e) => setF('onboarding')(e.target.value)}><option value="">Alle</option><option value="done">Abgeschlossen</option><option value="open">Offen</option></Select></Field>
      </div>
      {data?.coverage ? (
        <p className="mt-2 text-xs text-graphite">
          Abdeckung: Prüfung für {pct(data.coverage.examTrack.known / Math.max(1, data.coverage.examTrack.total), 1)} der Nutzer erfasst, Stufe für {pct(data.coverage.level.known / Math.max(1, data.coverage.level.total), 1)} — die Filter wirken nur darauf; „Unbekannt“ ist wählbar.
        </p>
      ) : null}
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data ? (
        <Section>
          <DataTable
            dense
            rowTo={(r) => `/admin/user/${r.id}`}
            columns={[
              { key: 'email', label: 'E-Mail / Name', render: (r) => <span><span className="font-semibold text-ink">{r.email}</span>{r.fullName ? <span className="block text-xs text-graphite">{r.fullName}</span> : null}</span> },
              { key: 'access', label: 'Zugang', render: (r) => <span className="flex flex-wrap gap-1"><Badge label={r.access.label} tone={ACCESS_TONE[r.access.kind] || 'muted'} />{r.paymentFailed ? <Badge label="Zahlung offen" tone="warn" /> : null}{r.discrepancies > 0 ? <Badge label="Inkonsistent" tone="error" /> : null}{r.role ? <Badge label={r.role} tone="info" /> : null}</span> },
              { key: 'level', label: 'Stufe / Prüfung', render: (r) => `${r.currentLevel ? String(r.currentLevel).toUpperCase() : '—'} / ${r.examTrack || '—'}` },
              { key: 'usage', label: 'Nutzung', align: 'right', render: (r) => `${num(r.grammarTopics)} Themen · ${num(r.speakingCompleted)} Sprechen` },
              { key: 'lastActivityAt', label: 'Letzte Aktivität', render: (r) => dmy(r.lastActivityAt) },
              { key: 'createdAt', label: 'Registriert', render: (r) => dmy(r.createdAt) },
              { key: 'tickets', label: 'Tickets', align: 'right', render: (r) => (r.openTickets > 0 ? <Badge label={String(r.openTickets)} tone={r.urgentTickets > 0 ? 'error' : 'warn'} /> : '—') },
            ]}
            rows={data.rows}
            emptyText="Keine Nutzer für diese Filter."
          />
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} totalIsExact={data.totalIsExact} onPage={setPage} />
          <Footnote>Serverseitig gefiltert: {data.appliedFilters.server.join(', ') || 'keine'} · nach dem Laden gefiltert: {data.appliedFilters.post.join(', ') || 'keine'}.</Footnote>
        </Section>
      ) : null}
    </>
  );
}
