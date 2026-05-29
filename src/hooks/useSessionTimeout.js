import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';

const TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_MS = 28 * 60 * 1000;
const DEBOUNCE_MS = 5000;

export function useSessionTimeout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const handleTimeout = useCallback(async () => {
    clearTimers();
    setShowWarning(false);
    await supabase.auth.signOut();
    navigate('/login?reason=timeout', { replace: true });
  }, [clearTimers, navigate]);

  const startTimers = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    warningRef.current = setTimeout(() => setShowWarning(true), WARNING_MS);
    timeoutRef.current = setTimeout(handleTimeout, TIMEOUT_MS);
  }, [clearTimers, handleTimeout]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < DEBOUNCE_MS) return;
    lastActivityRef.current = now;
    startTimers();
  }, [startTimers]);

  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    startTimers();

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, startTimers, resetTimer, clearTimers]);

  return { showWarning, stayLoggedIn };
}
