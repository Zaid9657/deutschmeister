// The canonical fetch for an admin screen: four render states that never
// collapse (loading → Spinner, error → ErrorLine, empty → Empty,
// uninstrumented → NotInstrumented), and a stable reload.
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminCall, describeAdminError } from '../../lib/admin/adminFetch.js';

export function useAdminData(fn, body, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bodyRef = useRef(body);
  bodyRef.current = body;
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const payload = await adminCall(fn, bodyRef.current);
      if (mine !== seq.current) return;
      setData(payload);
    } catch (e) {
      if (mine !== seq.current) return;
      setError(describeAdminError(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}

/** A mutation: returns [run, { busy, error, result }]. */
export function useAdminMutation(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const run = useCallback(
    async (body) => {
      setBusy(true);
      setError(null);
      try {
        const payload = await adminCall(fn, body);
        setResult(payload);
        return payload;
      } catch (e) {
        setError(describeAdminError(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [fn],
  );
  return [run, { busy, error, result, reset: () => { setError(null); setResult(null); } }];
}
