import { useState } from 'react';
import { PageHeader, Section, DataTable, Pager, Badge, Select, Input, Field, ErrorLine, Spinner, Footnote, hm } from '../../components/admin/adminUi.jsx';
import { useAdminData } from '../../components/admin/useAdminData.js';

const OUTCOME_TONE = { success: 'ok', failure: 'error', denied: 'warn' };

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', outcome: '', targetType: '', days: '' });
  const { data, loading, error } = useAdminData('admin-audit', { page, pageSize: 50, filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }, [page, filters]);
  const set = (k) => (e) => { setPage(1); setFilters((f) => ({ ...f, [k]: e.target.value })); };
  return (
    <>
      <PageHeader title="Prüfprotokoll" lead="admin_audit_log: jede Mutation, jeder abgelehnte Zugriff, jeder Export — mit Akteur, Begründung und redigiertem Vorher/Nachher. Die Tabelle kann nicht bearbeitet werden (UPDATE/DELETE entzogen); eine Korrektur ist ein neuer Eintrag." />
      <div className="mt-2 grid gap-3 sm:grid-cols-4">
        <Field label="Aktion"><Select value={filters.action} onChange={set('action')}><option value="">Alle</option>{(data?.actions || []).map((a) => <option key={a} value={a}>{a}</option>)}</Select></Field>
        <Field label="Ergebnis"><Select value={filters.outcome} onChange={set('outcome')}><option value="">Alle</option><option value="success">Erfolg</option><option value="failure">Fehler</option><option value="denied">Abgelehnt</option></Select></Field>
        <Field label="Zieltyp"><Input value={filters.targetType} onChange={set('targetType')} placeholder="user, ticket, capability…" /></Field>
        <Field label="Zeitraum (Tage)"><Input type="number" min="1" value={filters.days} onChange={set('days')} placeholder="alle" /></Field>
      </div>
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data ? (
        <Section title={`${data.total} Einträge`}>
          <DataTable
            dense
            columns={[
              { key: 'occurred_at', label: 'Zeit', render: (r) => hm(r.occurred_at) },
              { key: 'actor', label: 'Akteur (Rolle)', render: (r) => <span>{r.actor_email || r.actor_id.slice(0, 8)} <span className="text-graphite">({r.actor_role})</span></span> },
              { key: 'action', label: 'Aktion' },
              { key: 'target', label: 'Ziel', render: (r) => <span>{r.target_type}{r.target_id ? <span className="text-graphite"> · {String(r.target_id).slice(0, 12)}</span> : null}</span> },
              { key: 'outcome', label: 'Ergebnis', render: (r) => <Badge label={r.outcome} tone={OUTCOME_TONE[r.outcome] || 'muted'} /> },
              { key: 'reason', label: 'Begründung', render: (r) => r.reason || r.error_message || '—' },
              { key: 'diff', label: 'Vorher / Nachher', render: (r) => (r.before_state || r.after_state ? <details><summary className="cursor-pointer text-siegel-deep">anzeigen</summary><pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap font-data text-[0.6875rem]">{JSON.stringify({ vorher: r.before_state, nachher: r.after_state }, null, 1)}</pre></details> : '—') },
            ]}
            rows={data.rows}
            emptyText="Keine Einträge für diese Filter."
          />
          <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote>
        </Section>
      ) : null}
    </>
  );
}
