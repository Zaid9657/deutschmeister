import { useSearchParams } from 'react-router-dom';
import { PageHeader, Section, Tabs, DataTable, Badge, ErrorLine, Spinner, Footnote, KeyValues, NotInstrumented, hm, dmy } from '../../components/admin/adminUi.jsx';
import { useAdminData } from '../../components/admin/useAdminData.js';

const TABS = [{ id: 'roles', label: 'Rollen & Rechte' }, { id: 'staff', label: 'Administratoren' }, { id: 'config', label: 'Konfiguration' }, { id: 'products', label: 'Produkte & Stufen' }, { id: 'integrations', label: 'Integrationen' }, { id: 'unavailable', label: 'Nicht konfigurierbar' }];

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'roles';
  const { data, loading, error } = useAdminData('admin-settings', {}, []);
  return (
    <>
      <PageHeader title="Einstellungen" lead="Einstellungen sind Konfiguration. Die Rollen-Matrix wird aus derselben Durchsetzung gerendert, die der Server anwendet; Integrationen melden nur „konfiguriert: ja/nein“ — nie einen Wert." />
      <Tabs tabs={TABS} active={tab} onChange={(id) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', id); return n; })} />
      {loading && !data ? <Spinner /> : null}
      {error ? <ErrorLine>{error}</ErrorLine> : null}
      {data && tab === 'roles' ? (
        <Section title="Rollen-Matrix" note="Aus netlify/functions/_shared/adminRbacLib.mjs — admin ist eine Obermenge, kein Platzhalter; auditor schreibt nichts.">
          <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="border-b border-rule text-left text-graphite"><th className="py-1 pr-2">Recht</th>{data.roles.map((r) => <th key={r.role} className="py-1 pr-2" title={r.description}>{r.role}</th>)}</tr></thead><tbody>{data.capabilities.map((cap) => <tr key={cap} className="border-b border-rule/60"><td className="py-1 pr-2 font-data">{cap}</td>{data.roles.map((r) => <td key={r.role} className="py-1 pr-2">{r.capabilities.includes(cap) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div>
          <KeyValues items={data.roles.map((r) => [r.role, r.description])} />
        </Section>
      ) : null}
      {data && tab === 'staff' ? (
        <Section title="Konten mit Admin-Rolle" note="profiles.role — nur der Service-Role beschreibbar (Trigger); Rollen werden in Nutzer 360 über die Aktion „Admin-Rolle setzen“ vergeben.">
          <DataTable dense rows={data.staff} rowTo={(r) => `/admin/user/${r.id}`} columns={[{ key: 'email', label: 'E-Mail' }, { key: 'full_name', label: 'Name' }, { key: 'role', label: 'Rolle', render: (r) => <Badge label={r.role} tone="info" /> }, { key: 'created_at', label: 'Registriert', render: (r) => dmy(r.created_at) }]} />
        </Section>
      ) : null}
      {data && tab === 'config' ? (
        <>
          <Section title="Feature-Flags (Netlify-Umgebung, nur lesen)" note={`Schreibbare Schlüssel über das Panel: ${data.editableKeys.length === 0 ? 'keine — ein Formular, das Eingaben stillschweigend verwirft, wäre schlimmer als eine benannte Lücke' : data.editableKeys.join(', ')}.`}>
            <KeyValues items={data.flags.map((f) => [f.label, <span key={f.id}><Badge label={f.value ? 'an' : 'aus'} tone={f.value ? 'ok' : 'muted'} /> <span className="text-xs text-graphite">{f.id} ({f.raw})</span></span>])} />
          </Section>
          <Section title="Support-SLA (nur lesen)" note={`${data.sla.source} — ${data.sla.note}`}><KeyValues items={Object.entries(data.sla.hours).map(([k, v]) => [k, `${v} Kalenderstunden`])} /></Section>
          <Section title="Status-Schwellen (nur lesen)" note={data.thresholds.source}><pre className="overflow-x-auto font-data text-[0.6875rem] text-ink">{JSON.stringify(data.thresholds.values, null, 1)}</pre></Section>
        </>
      ) : null}
      {data && tab === 'products' ? (
        <>
          <Section title="Lemon-Squeezy-Produkte (Webhook-Routing)" note="Eine gesetzte Variable heißt: der Webhook kann Bestellungen dieser Variante einem Produktschlüssel zuordnen. Die Checkout-UUIDs (VITE_/PUBLIC_) sind Build-Variablen und hier nicht sichtbar.">
            <KeyValues items={data.products.map((p) => [p.env, <Badge key={p.env} label={p.configured ? 'gesetzt' : 'nicht gesetzt'} tone={p.configured ? 'ok' : 'muted'} />])} />
          </Section>
          <Section title="Stufen und Schreibweisen je Tabelle" note={`${data.levels.source} — die eine Funktion, durch die jeder Stufenfilter läuft.`}>
            <KeyValues items={Object.entries(data.levels.casing).map(([t, c]) => [t, `${c.column} · ${c.casing}`])} />
          </Section>
        </>
      ) : null}
      {data && tab === 'integrations' ? (
        <Section title="Integrationen" note="Nur „konfiguriert“ — kein Wert verlässt den Server, nicht maskiert, nicht gekürzt, nicht die letzten vier Zeichen.">
          <KeyValues items={data.integrations.map((i) => [i.label, <span key={i.id}><Badge label={i.configured ? 'konfiguriert' : 'fehlt'} tone={i.configured ? 'ok' : 'error'} /> <span className="text-xs text-graphite">{i.env}</span></span>])} />
        </Section>
      ) : null}
      {data && tab === 'unavailable' ? (
        <>{data.unavailable.map((u) => <NotInstrumented key={u.id} label={u.label} reason={u.reason} />)}</>
      ) : null}
      {data ? <Footnote>Stand {hm(data.generatedAt)} · Zeitzone UTC</Footnote> : null}
    </>
  );
}
