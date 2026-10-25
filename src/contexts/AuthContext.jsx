import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabase';
import { signupAttributionMetadata } from '../lib/attribution';
import { identify, resetAnalytics } from '../lib/analytics';
import { trackSignupCompleted } from '../lib/funnelTracking';
import { claimSignupCompletion } from '../lib/signupCompletion';
import { logAuditEvent, AUDIT_EVENTS } from '../lib/auditLogger';
import { withTimeout } from '../utils/withTimeout';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// A password-recovery link signs its account in through the URL, and supabase-js
// announces that with PASSWORD_RECOVERY a tick after it has read the tokens. The
// client starts reading the URL the moment it is created (at import), so the
// event can fire before AuthProvider below has subscribed; listening from import
// time means it is never lost. UpdatePasswordPage opens its form only after this
// signal: a session that merely exists (another account signed in on this
// browser, which an expired link leaves in place) never qualifies. The signal
// belongs to the account the link signed in: any change of who is signed in —
// another account's SIGNED_IN (from another tab, say), a sign-out — ends it.
let recoveryFor = null;
supabase.auth.onAuthStateChange((event, session) => {
  const signedIn = session?.user?.id ?? null;
  if (event === 'PASSWORD_RECOVERY') recoveryFor = signedIn;
  else if (signedIn !== recoveryFor) recoveryFor = null;
});

// A confirmation link that arrives with tokens in the URL is a real sign-in even
// when its INITIAL_SESSION reaches the provider before its SIGNED_IN does. Read
// at import, before supabase-js clears the hash.
let urlSignIn = typeof window !== 'undefined' && /(?:^#|&)access_token=/.test(window.location.hash || '');

// The last resort of signOut() below: the client's own stored session (the
// sb-<project>-auth-token key and its -code-verifier/-user companions — the
// keys the static pages test for a session) when no sign-out call can reach
// the server. Every supabase-js sign-out, scope 'local' included, POSTs to
// /logout first and keeps the session when that request fails.
function clearStoredSession() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && /^sb-.+-auth-token/.test(key)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch { /* storage blocked: there is no stored session to remove */ }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // The account a password-recovery link signed in, while it still is the one signed in.
  const [recoveringUserId, setRecoveringUserId] = useState(recoveryFor);
  // Who the auth events last said was signed in (undefined before the first
  // event), to tell a sign-in from the SIGNED_IN supabase-js emits when it
  // merely recovers the stored session.
  const knownUserIdRef = useRef(undefined);

  useEffect(() => {
    // Get initial session. getSession() can hang on a dead/slow network (the
    // client may try to refresh an expired token) — without a timeout every
    // guarded route spins forever. Resolve to logged-out instead.
    const getSession = async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth session load failed:', err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // A recovery is the recovered account's alone (see recoveryFor above).
        const signedIn = session?.user?.id ?? null;
        setRecoveringUserId((current) => {
          if (event === 'PASSWORD_RECOVERY') return signedIn;
          return current === signedIn ? current : null;
        });
        if (event === 'PASSWORD_RECOVERY') urlSignIn = false;
        if (event === 'SIGNED_OUT') {
          // Every sign-out, not only the signOut() wrapper's: the idle timeout,
          // another tab, an admin sign-out and the one after account deletion
          // bypass it, and PostHog stayed attached to the previous learner.
          resetAnalytics();
        }

        if (session?.user) {
          identify(session.user.id, {
            email: session.user.email,
            signup_date: session.user.created_at,
          });
        }

        const previousUserId = knownUserIdRef.current;
        knownUserIdRef.current = session?.user?.id ?? null;

        if (event === 'SIGNED_IN' && session?.user?.created_at) {
          // The analytics event follows the confirmation-aware rule in
          // lib/signupCompletion.js (the 60 s window alone missed every
          // confirmed signup). The audit log keeps its original rule.
          if (claimSignupCompletion(session.user)) trackSignupCompleted();
          // supabase-js also emits SIGNED_IN when it recovers the stored session
          // (every tab focus, every hourly refresh, other tabs' broadcasts), and
          // each of those wrote an 'auth.login' row. Only a sign-in that changes
          // who is signed in, or one that came through a link, is a login. A
          // SIGNED_IN heard before any other event is the stored session being
          // read at startup, when this provider subscribed before supabase-js
          // had finished reading it.
          const realSignIn = urlSignIn || (previousUserId !== undefined && previousUserId !== session.user.id);
          urlSignIn = false;
          if (realSignIn) {
            // The session names the user: no getUser() round trip for the row.
            const createdAt = new Date(session.user.created_at);
            if (Date.now() - createdAt.getTime() < 60_000) {
              logAuditEvent(AUDIT_EVENTS.SIGNUP, {}, { userId: session.user.id });
            } else {
              logAuditEvent(AUDIT_EVENTS.LOGIN, {}, { userId: session.user.id });
            }
          }
        }
      }
    );
    // The import-time listener may have caught the recovery event before this
    // subscription existed.
    if (recoveryFor) setRecoveringUserId(recoveryFor);

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        // Which link brought them (public/attribution.js); the profiles
        // trigger copies these keys into profiles.acquisition_*.
        data: signupAttributionMetadata(),
      },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    // The row names the user this provider knows. logAuditEvent would otherwise
    // call getUser(), a network round trip that holds supabase-js's auth lock,
    // and the sign-out below queues behind that lock: a stalled request made
    // the logout button look dead. Not awaited either; its request reads the
    // session before the sign-out below takes the lock (see auditLogger.js).
    if (user?.id) logAuditEvent(AUDIT_EVENTS.LOGOUT, {}, { userId: user.id });
    resetAnalytics();
    const { error } = await supabase.auth.signOut();
    if (!error) return { error: null };
    // auth-js keeps the stored session when the server sign-out fails on the
    // network or with a 5xx (it removes it only on 401/403/404), and the
    // caller then navigated home as if signed out: on a shared computer the
    // next person was signed in. Retry for this browser alone, and when that
    // cannot reach the server either, remove the stored session here.
    console.warn('Sign-out did not reach the server:', error.message);
    const local = await supabase.auth.signOut({ scope: 'local' });
    if (local.error) {
      clearStoredSession();
      setUser(null);
    }
    return { error: null };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { data, error };
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const isEmailVerified = !!user?.email_confirmed_at;
  // The new-password form is for the account the recovery link signed in, and
  // only while it is the one signed in.
  const passwordRecovery = recoveringUserId !== null && recoveringUserId === (user?.id ?? null);

  const value = {
    user,
    loading,
    isEmailVerified,
    passwordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
