// Phase 1 overview: the session card. Phase 2 replaces the body with the
// cockpit (admin-metrics); the session card moves to Einstellungen.
import { PageHeader, Section, KeyValues, Badge, Diagnostics, Footnote, hm } from '../../components/admin/adminUi.jsx';
import { useAdminSession } from '../../components/admin/AdminSessionContext.jsx';

export default function OverviewPage() {
  const { session, role, capabilities } = useAdminSession();
  return (
    <>
      <PageHeader
        title="Übersicht"
        lead="Phase 1 (Fundament): Anmeldung, Rollen, Prüfprotokoll und Transport stehen. Die Kennzahlen des Cockpits kommen mit Phase 2."
      />
      <Section title="Ihre Sitzung" note="Rolle und Rechte werden bei jeder Anfrage serverseitig aus profiles.role gelesen — nie aus dem Browser.">
        <KeyValues
          items={[
            ['E-Mail', session?.user?.email],
            ['Rolle', role ? <Badge label={role} tone="info" /> : null],
            ['Rechte', <span key="caps" className="flex flex-wrap gap-1">{capabilities.map((c) => <Badge key={c} label={c} />)}</span>],
            ['Stand', hm(session?.generatedAt)],
          ]}
        />
      </Section>
      <Footnote>Zeitzone UTC · Stand {hm(session?.generatedAt)}</Footnote>
      <Diagnostics data={session?.diagnostics} />
    </>
  );
}
