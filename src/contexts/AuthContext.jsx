import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { signupAttributionMetadata } from '../lib/attribution';
import { identify, resetAnalytics } from '../lib/analytics';
import { trackSignupCompleted } from '../lib/funnelTracking';
import { claimSignupCompletion } from '../lib/signupCompletion';
import { logAuditEvent, AUDIT_EVENTS } from '../lib/auditLogger';
import { withTimeout } from '../utils/withTimeout';
import { pushAccountLocale, signupLocaleMetadata, syncAccountLocale } from '../lib/localeAccount';
import { getDeviceChoice } from '../lib/locale';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

        if (session?.user) {
          identify(session.user.id, {
            email: session.user.email,
            signup_date: session.user.created_at,
          });
        }

        if (event === 'SIGNED_IN' && session?.user?.created_at) {
          // The analytics event follows the confirmation-aware rule in
          // lib/signupCompletion.js (the 60 s window alone missed every
          // confirmed signup). The audit log keeps its original rule.
          if (claimSignupCompletion(session.user)) trackSignupCompleted();
          const createdAt = new Date(session.user.created_at);
          if (Date.now() - createdAt.getTime() < 60_000) {
            logAuditEvent(AUDIT_EVENTS.SIGNUP);
          } else {
            logAuditEvent(AUDIT_EVENTS.LOGIN);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // The interface language follows the account across devices: on sign-in the
  // newer explicit choice wins (src/lib/locale.js reconcileAccount), and an
  // explicit switch while signed in is written to user_metadata. A choice that
  // came FROM the account is not echoed back.
  const userId = user?.id || null;
  useEffect(() => {
    if (!user) return undefined;
    syncAccountLocale(user);
    const onChange = (e) => {
      const detail = e && e.detail;
      if (!detail || detail.source !== 'explicit') return;
      pushAccountLocale(getDeviceChoice());
    };
    window.addEventListener('dm-locale-changed', onChange);
    return () => window.removeEventListener('dm-locale-changed', onChange);
    // Keyed on the id: a metadata update (USER_UPDATED) must not re-run the sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        // Which link brought them (public/attribution.js); the profiles
        // trigger copies these keys into profiles.acquisition_*. The interface
        // language rides along as metadata (src/lib/localeAccount.js), so the
        // first sign-in on another device opens in the same language.
        data: { ...signupAttributionMetadata(), ...signupLocaleMetadata() },
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
    await logAuditEvent(AUDIT_EVENTS.LOGOUT);
    resetAnalytics();
    const { error } = await supabase.auth.signOut();
    return { error };
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

  const value = {
    user,
    loading,
    isEmailVerified,
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
