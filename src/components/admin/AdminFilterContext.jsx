// The analytics filter (range + level) — shared by the cockpit and the
// analytics modules, read from the ROUTER's search params (never
// window.location in an initializer), and only rendered on routes whose
// numbers move.
import { createContext, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const RANGES = ['7d', '30d', '90d'];
const LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];

const AdminFilterContext = createContext(null);

export function useAdminFilters() {
  const ctx = useContext(AdminFilterContext);
  if (!ctx) throw new Error('useAdminFilters must be used inside AdminFilterProvider');
  return ctx;
}

export function AdminFilterProvider({ children }) {
  const [params, setParams] = useSearchParams();
  const range = RANGES.includes(params.get('range')) ? params.get('range') : '30d';
  const rawLevel = params.get('level');
  const level = LEVELS.includes(rawLevel) || rawLevel === 'unbekannt' ? rawLevel : 'all';

  const value = useMemo(
    () => ({
      range,
      level,
      RANGES,
      LEVELS,
      setRange: (r) => setParams((p) => { const n = new URLSearchParams(p); n.set('range', r); return n; }),
      setLevel: (l) => setParams((p) => { const n = new URLSearchParams(p); if (l === 'all') n.delete('level'); else n.set('level', l); return n; }),
    }),
    [range, level, setParams],
  );
  return <AdminFilterContext.Provider value={value}>{children}</AdminFilterContext.Provider>;
}
