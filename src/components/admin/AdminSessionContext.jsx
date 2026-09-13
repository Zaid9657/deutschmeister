// Admin panel — the session: who you are, what you may do (from the server,
// never inferred client-side), the sidebar badges and the expiry signal.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { adminCall, onAdminSessionChange, describeAdminError } from '../../lib/admin/adminFetch.js';

const AdminSessionContext = createContext(null);

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error('useAdminSession must be used inside AdminSessionProvider');
  return ctx;
}

export function AdminSessionProvider({ children }) {
  const [session, setSession] = useState(null); // { user, role, capabilities, badges, roles, generatedAt, diagnostics }
  const [status, setStatus] = useState('loading'); // loading | ready | forbidden | error
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [badgeState, setBadgeState] = useState('idle'); // idle | loading | ok | failed
  const alive = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setStatus('loading');
    setBadgeState('loading');
    try {
      const payload = await adminCall('admin-session');
      if (!alive.current) return;
      setSession(payload);
      setStatus('ready');
      setError(null);
      setBadgeState('ok');
    } catch (e) {
      if (!alive.current) return;
      const msg = describeAdminError(e);
      setBadgeState('failed');
      if (/Keine Berechtigung/.test(msg)) {
        setStatus('forbidden');
      } else if (!silent) {
        setStatus('error');
      }
      setError(msg);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  useEffect(() => onAdminSessionChange(setExpired), []);

  const value = useMemo(
    () => ({
      session,
      status,
      error,
      expired,
      badgeState,
      role: session?.role ?? null,
      capabilities: session?.capabilities ?? [],
      can: (cap) => (session?.capabilities ?? []).includes(cap),
      badges: session?.badges ?? {},
      refresh: () => load(true),
    }),
    [session, status, error, expired, badgeState, load],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}
