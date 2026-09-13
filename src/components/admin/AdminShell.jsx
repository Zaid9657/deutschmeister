// AdminShell = [ Sidebar | ( expiry banner? / filter bar? / workspace ) ]
//
// Four shell rules: badges are best-effort (a failed count renders no badge);
// the filter bar is scoped to the routes whose numbers move; collapse state
// lives here so it survives navigation; the shell has NO scroll container of
// its own — each screen owns its scroll, or the workspace gets two
// independent scroll positions.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldX, RefreshCw } from 'lucide-react';
import SEO from '../SEO';
import AdminSidebar, { AdminMobileNav } from './AdminSidebar.jsx';
import { useAdminSession } from './AdminSessionContext.jsx';
import { useAdminFilters } from './AdminFilterContext.jsx';
import { signOutLocally } from '../../lib/admin/adminFetch.js';
import { ChipRow, Spinner, ErrorLine, SecondaryButton, PrimaryButton, ago } from './adminUi.jsx';

const FILTERED_ROUTES = ['/admin', '/admin/usage', '/admin/reports'];

function FilterBar() {
  const { range, level, RANGES, LEVELS, setRange, setLevel } = useAdminFilters();
  const { session, badgeState, refresh } = useAdminSession();
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
  return (
    <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-5 gap-y-2 border-b border-rule bg-white px-4 py-2 sm:px-6">
      <ChipRow label="Zeitraum" options={RANGES.map((r) => ({ id: r, label: `${r.replace('d', '')} T` }))} value={range} onChange={setRange} />
      <ChipRow
        label="Stufe"
        options={[{ id: 'all', label: 'Alle' }, ...LEVELS.map((l) => ({ id: l, label: l.toUpperCase() })), { id: 'unbekannt', label: 'Unbekannt' }]}
        value={level}
        onChange={setLevel}
      />
      <span className="ml-auto flex items-center gap-3 text-[0.6875rem] text-graphite">
        <span>Vergleich: {days} T davor · Zeitzone UTC</span>
        <button type="button" onClick={refresh} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-paper-sunk" title="Aktualisieren">
          <RefreshCw size={12} className={badgeState === 'loading' ? 'animate-spin' : ''} aria-hidden="true" />
          {badgeState === 'loading' ? 'Wird geladen…' : badgeState === 'failed' ? 'Aktualisierung fehlgeschlagen' : `Aktualisiert: ${ago(session?.generatedAt)}`}
        </button>
      </span>
    </div>
  );
}

function ExpiryBanner() {
  const navigate = useNavigate();
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-viz-warn/40 bg-viz-warn/10 px-4 py-2 text-[0.8125rem] text-ink sm:px-6">
      <span>Ihre Sitzung ist abgelaufen. Die Daten unten sind möglicherweise nicht aktuell.</span>
      <PrimaryButton
        onClick={async () => {
          await signOutLocally();
          navigate('/login', { state: { from: { pathname: '/admin' } } });
        }}
      >
        Erneut anmelden
      </PrimaryButton>
    </div>
  );
}

export default function AdminShell({ children }) {
  const [collapsed, setCollapsed] = useState(false); // seeded expanded, never from viewport width
  const { status, error, expired, badges, can, refresh } = useAdminSession();
  const { pathname } = useLocation();
  const showFilters = FILTERED_ROUTES.includes(pathname.replace(/\/$/, '') || '/admin');

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-paper-sunk pt-16">
        <SEO title="Admin" noindex />
        <Spinner label="Admin-Sitzung wird geprüft…" />
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-sunk px-4 pt-16">
        <SEO title="Admin" noindex />
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-clay bg-accent-himbeer-wash">
            <ShieldX className="h-7 w-7 text-accent-himbeer-ink" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Kein Zugriff</h1>
          <p className="mt-2 text-sm text-graphite">Dieses Konto hat keine Admin-Rolle. Rollen werden serverseitig aus der Datenbank gelesen.</p>
          <div className="mt-4"><SecondaryButton to="/dashboard">Zur App</SecondaryButton></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-paper-sunk pt-16">
        <SEO title="Admin" noindex />
        {expired ? <ExpiryBanner /> : null}
        <div className="px-6 pt-4">
          <ErrorLine>{error}</ErrorLine>
          <SecondaryButton onClick={() => refresh()}>Erneut versuchen</SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper-sunk pt-16">
      <SEO title="Admin" noindex />
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} badges={badges} can={can} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav badges={badges} can={can} />
        {expired ? <ExpiryBanner /> : null}
        {showFilters ? <FilterBar /> : null}
        <div className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[75rem] px-4 pb-12 sm:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
