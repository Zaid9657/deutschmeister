import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import {
  trackVerificationPageViewed,
  trackVerificationEmailResent,
  trackEmailVerified,
} from '../lib/funnelTracking';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { user, isEmailVerified, signOut } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { trackVerificationPageViewed(); }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (isEmailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isEmailVerified, navigate]);

  useEffect(() => {
    if (!user || isEmailVerified) return;
    const interval = setInterval(async () => {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser?.email_confirmed_at) {
        trackEmailVerified();
        clearInterval(interval);
        navigate('/dashboard', { replace: true });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, isEmailVerified, navigate]);

  const handleResend = useCallback(async () => {
    if (!user?.email || resending) return;
    setResending(true);
    setError('');
    setResent(false);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
      trackVerificationEmailResent();
    }
  }, [user?.email, resending]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/signup', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <Mail className="w-8 h-8 text-amber-600" />
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-800 mb-3">
            Bestätige deine E-Mail
          </h1>

          <p className="text-slate-600 mb-2">
            Wir haben dir eine Bestätigungs-E-Mail geschickt an:
          </p>
          <p className="text-amber-600 font-semibold mb-6">{user.email}</p>

          <p className="text-sm text-slate-500 mb-6">
            Klicke auf den Link in der E-Mail, um dein Konto zu aktivieren. Diese Seite aktualisiert sich automatisch.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-6">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Warte auf Bestätigung…
          </div>

          {resent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center gap-2 text-green-700 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              E-Mail wurde erneut gesendet.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold hover:from-amber-600 hover:to-rose-600 transition-all shadow-lg shadow-rose-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              E-Mail erneut senden
            </button>

            <button
              onClick={handleSignOut}
              className="w-full py-3 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Abmelden und mit anderer E-Mail registrieren
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Tipp: Schau auch in deinem Spam-Ordner nach.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
