import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, LogOut, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
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
import Card from '../components/ui/Card.jsx';
import Aurora from '../components/ui/Aurora.jsx';

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
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Verify Your Email" description="Confirm your email address to activate your DeutschMeister account." path="/verify-email" noindex />
      <Aurora />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md text-center"
      >
        <Card raised className="p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-siegel-wash flex items-center justify-center">
            <Mail className="w-8 h-8 text-siegel" aria-hidden="true" />
          </div>

          <h1 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-3">
            Confirm your email
          </h1>

          <p className="text-graphite mb-2">
            We sent a confirmation email to:
          </p>
          <p className="font-data text-[0.8125rem] font-semibold text-siegel-deep mb-6">{user.email}</p>

          <p className="text-sm text-graphite mb-6">
            Click the link in that email to activate your account. This page updates automatically.
          </p>

          <div className="flex items-center justify-center gap-2 font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite mb-6">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-siegel" aria-hidden="true" />
            Waiting for confirmation…
          </div>

          {resent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-center gap-2 rounded-clay bg-accent-limette-wash px-4 py-3 text-sm font-semibold text-accent-limette-ink"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Email sent again.
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-center gap-2 rounded-clay bg-accent-himbeer-wash px-4 py-3 text-sm font-semibold text-accent-himbeer-ink"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              {error}
            </motion.div>
          )}

          <div className="flex flex-col gap-3">
            {/* Resend is the one primary action on this screen */}
            <Button onClick={handleResend} shimmer disabled={resending} size="lg" className="w-full">
              {resending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Resend email
            </Button>

            <Button onClick={handleSignOut} variant="secondary" size="lg" className="w-full">
              <LogOut className="w-4 h-4" />
              Sign out and use a different email
            </Button>
          </div>

          <p className="mt-6 text-xs text-graphite">
            Tip: check your spam folder too.
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
