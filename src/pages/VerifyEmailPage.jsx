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
import { logAuditEvent, AUDIT_EVENTS } from '../lib/auditLogger';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';

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
        logAuditEvent(AUDIT_EVENTS.EMAIL_VERIFIED);
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
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Verify Your Email" description="Confirm your email address to activate your DeutschMeister account." path="/verify-email" noindex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-white rounded-lg border border-rule shadow-overlay p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-siegel-wash flex items-center justify-center">
            <Mail className="w-8 h-8 text-siegel" />
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink mb-3">
            Confirm your email
          </h1>

          <p className="text-graphite mb-2">
            We sent a confirmation email to:
          </p>
          <p className="text-siegel font-semibold mb-6">{user.email}</p>

          <p className="text-sm text-graphite mb-6">
            Click the link in that email to activate your account. This page updates automatically.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-graphite mb-6">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Waiting for confirmation…
          </div>

          {resent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center gap-2 text-green-700 text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Email sent again.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={handleResend} disabled={resending} size="lg" className="w-full">
              {resending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Resend email
            </Button>

            <button
              onClick={handleSignOut}
              className="w-full py-3 px-6 rounded-md border border-ink text-ink font-semibold hover:bg-ink hover:text-paper transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out and use a different email
            </button>
          </div>

          <p className="mt-6 text-xs text-graphite">
            Tip: check your spam folder too.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
