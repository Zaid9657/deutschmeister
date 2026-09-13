// Admin panel transport — the ONE path from a screen to an endpoint.
//
// THE INCIDENT THIS EXISTS FOR. supabase.auth.getSession() only refreshes past
// `exp`. A session terminated server-side (a /logout in another tab) leaves a
// stored token that is not yet expired; the client returns it, the server
// answers 401, and ten call sites each render their own dead end. An admin
// staring at "Fehler 401" cannot tell a dead session from a dead panel.
//
// So: exactly one function attaches an Authorization header, and every admin
// screen calls it. Four deliberate properties:
//   1. The raw Response is returned. A 403 (wrong role) or a 500 is still the
//      caller's to interpret; only 401 is handled here.
//   2. One refresh, one retry. Never a loop.
//   3. A 403 is left alone — it is a role, not a login.
//   4. The expiry signal is global (one banner at shell level), not per screen.
//
// Pure factory: src/lib/admin/adminFetch.js wires it to the real Supabase
// client; tests/admin-fetch.test.mjs drives it with fakes.

export class AdminSessionExpired extends Error {
  constructor() {
    super('Sitzung abgelaufen');
    this.name = 'AdminSessionExpired';
  }
}

export function createAdminFetch({ getSession, refreshSession, fetchImpl, base = '/.netlify/functions/' }) {
  const listeners = new Set();
  let sessionExpired = false;

  function setExpired(next) {
    if (sessionExpired === next) return;
    sessionExpired = next;
    listeners.forEach((fn) => fn(next));
  }

  function onAdminSessionChange(fn) {
    listeners.add(fn);
    fn(sessionExpired);
    return () => listeners.delete(fn);
  }

  function clearAdminSessionExpired() {
    setExpired(false);
  }

  async function adminFetch(fn, body = {}) {
    const post = (token) =>
      fetchImpl(`${base}${fn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

    const token = await getSession();
    if (!token) {
      setExpired(true);
      throw new AdminSessionExpired();
    }

    let res = await post(token);
    if (res.status !== 401) {
      setExpired(false); // any non-401 clears a stale banner
      return res;
    }

    const refreshed = await refreshSession(); // the ONLY way to learn it is gone
    if (!refreshed) {
      setExpired(true);
      throw new AdminSessionExpired();
    }

    res = await post(refreshed);
    if (res.status === 401) {
      setExpired(true);
      throw new AdminSessionExpired();
    }
    setExpired(false);
    return res;
  }

  /**
   * adminFetch + JSON + the two non-401 failures every screen interprets the
   * same way. Throws AdminSessionExpired, or an Error whose message is ready
   * to render. Returns the parsed payload.
   */
  async function adminCall(fn, body = {}) {
    const res = await adminFetch(fn, body);
    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (res.status === 403) {
      const cap = payload?.requiredCapability ? ` (${payload.requiredCapability})` : '';
      throw new Error(`Keine Berechtigung für diese Daten${cap}.`);
    }
    if (!res.ok) {
      const id = payload?.requestId ? ` · Anfrage ${payload.requestId.slice(0, 8)}` : '';
      throw new Error(`${payload?.error || `Serverfehler ${res.status}`}${id}`);
    }
    return payload;
  }

  return { adminFetch, adminCall, onAdminSessionChange, clearAdminSessionExpired, isExpired: () => sessionExpired };
}

/** Render an error from adminCall/adminFetch for a screen. */
export function describeAdminError(e) {
  if (e instanceof AdminSessionExpired) return 'Ihre Sitzung ist abgelaufen — bitte oben erneut anmelden.';
  return String(e?.message || e);
}
