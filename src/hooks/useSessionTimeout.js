import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { safeGet, safeSet } from '../utils/safeStorage';

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 28 * 60 * 1000;
const DEBOUNCE_MS = 5000;
const HEARTBEAT_MS = 60 * 1000;

// The last activity in ANY tab of this browser. Each tab used to time out on
// its own input alone, so a /dashboard tab left open signed the learner out
// while they worked in another tab — and a sign-out removes the session that
// every tab of the browser shares.
const ACTIVITY_KEY = 'dm_last_activity';
const sharedActivity = () => Number(safeGet(ACTIVITY_KEY)) || 0;
const recordSharedActivity = (at) => safeSet(ACTIVITY_KEY, String(at));

// Where a learner works for long stretches without touching keys or mouse: a
// lesson stage, a checkpoint or the review deck (src/lib/chrome.js 'player'),
// a Modelltest run (a listening part plays for minutes) and the speaking coach
// (the learner talks). No countdown runs under them, and they keep the other
// tabs alive. Whether learners need an idle logout at all is an owner decision.
const LIVE_WORK_ROUTE = /^\/(?:course\/[^/]+\/(?:l\/[^/]+|checkpoint\/[^/]+|review)|modelltest\/[^/]+\/run|speaking)\/?$/;
export const isLiveWorkPath = (pathname) => LIVE_WORK_ROUTE.test(String(pathname || ''));

export function useSessionTimeout() {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const liveWork = isLiveWorkPath(pathname);
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const expireRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  // The warning and the sign-out count from the latest activity of any tab.
  const startTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    const idle = Date.now() - Math.max(lastActivityRef.current, sharedActivity());
    warningRef.current = setTimeout(() => setShowWarning(true), Math.max(0, WARNING_MS - idle));
    timeoutRef.current = setTimeout(() => expireRef.current?.(), Math.max(0, TIMEOUT_MS - idle));
  }, [clearTimers]);

  const handleTimeout = useCallback(async () => {
    // Another tab may have seen the learner since this one set its timer.
    if (Date.now() - Math.max(lastActivityRef.current, sharedActivity()) < TIMEOUT_MS) {
      startTimers();
      return;
    }
    clearTimers();
    setShowWarning(false);
    // This browser only. The default scope ('global') revoked every session of
    // the learner, so a desktop tab left idle also signed out the phone they
    // were studying on.
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/login?reason=timeout', { replace: true });
  }, [clearTimers, startTimers, navigate]);

  useEffect(() => { expireRef.current = handleTimeout; }, [handleTimeout]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < DEBOUNCE_MS) return;
    lastActivityRef.current = now;
    recordSharedActivity(now);
    startTimers();
  }, [startTimers]);

  const stayLoggedIn = useCallback(() => {
    lastActivityRef.current = Date.now();
    recordSharedActivity(lastActivityRef.current);
    setShowWarning(false);
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    if (!userId) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    // Signing in, and arriving on a route, count as activity.
    lastActivityRef.current = Date.now();
    recordSharedActivity(lastActivityRef.current);

    if (liveWork) {
      clearTimers();
      setShowWarning(false);
      const heartbeat = setInterval(() => recordSharedActivity(Date.now()), HEARTBEAT_MS);
      return () => clearInterval(heartbeat);
    }

    startTimers();

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    // Activity recorded by another tab postpones this tab's countdown.
    const onStorage = (e) => { if (e.key === ACTIVITY_KEY) startTimers(); };
    window.addEventListener('storage', onStorage);

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      window.removeEventListener('storage', onStorage);
    };
  }, [userId, liveWork, startTimers, resetTimer, clearTimers]);

  return { showWarning, stayLoggedIn };
}
