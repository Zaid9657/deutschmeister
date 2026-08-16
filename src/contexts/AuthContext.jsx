import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { identify, resetAnalytics } from '../lib/analytics';
import { trackSignupCompleted } from '../lib/funnelTracking';
import { logAuditEvent, AUDIT_EVENTS } from '../lib/auditLogger';
import { withTimeout } from '../utils/withTimeout';

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
          const createdAt = new Date(session.user.created_at);
          if (Date.now() - createdAt.getTime() < 60_000) {
            trackSignupCompleted();
            logAuditEvent(AUDIT_EVENTS.SIGNUP);
          } else {
            logAuditEvent(AUDIT_EVENTS.LOGIN);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
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
