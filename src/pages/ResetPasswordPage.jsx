import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent, AUDIT_EVENTS } from '../lib/auditLogger';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Logo from '../components/Logo';

// The playbook form field (docs/design/playbook.md §1), with room for the
// leading icon. The focus ring comes from the global *:focus-visible rule.
const FIELD =
  'w-full rounded-clay border border-rule bg-white py-3 pl-12 pr-4 text-ink placeholder:text-graphite focus:border-siegel transition-colors';
const TEXT_LINK = 'font-bold text-siegel transition-colors hover:text-siegel-deep';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        logAuditEvent(AUDIT_EVENTS.PASSWORD_RESET_REQUESTED, { email });
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
        <Aurora />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md text-center"
        >
          <Card raised className="p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent-limette-wash flex items-center justify-center animate-pop-in">
              <CheckCircle2 className="w-8 h-8 text-accent-limette-ink" aria-hidden="true" />
            </div>
            <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-4">
              Check Your Email
            </h2>
            <p className="text-graphite mb-6">
              {t('auth.checkEmail')}
              <br />
              <span className="font-data text-[0.8125rem] text-siegel-deep">{email}</span>
            </p>
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 px-6 py-3 ${TEXT_LINK}`}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Login
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Reset Password" description="Reset your DeutschMeister account password." path="/reset-password" noindex />
      <Aurora />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {/* The Meister-Siegel, not a "D" tile: the D was the retired identity, and
              a second mark beside the seal in the nav reads as two products. Logo
              renders a plain <a>, which matters — "/" is served by the Astro build,
              so a router <Link to="/"> client-routes to a route the SPA does not
              have and lands the user on NotFoundPage. */}
          <Logo size={64} showWordmark={false} className="mb-6" />
          <h1
            className="hero-line font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink mb-2"
            style={{ '--d': '120ms' }}
          >
            {t('auth.resetPassword')}
          </h1>
          <p className="hero-line text-[0.9375rem] leading-relaxed text-graphite sm:text-base" style={{ '--d': '220ms' }}>
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Form */}
        <Card raised className="p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-clay bg-accent-himbeer-wash px-4 py-3 text-accent-himbeer-ink"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-ink mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={FIELD}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Submit — the one primary action on the screen */}
            <Button type="submit" shimmer disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                t('auth.sendResetLink')
              )}
            </Button>
          </form>

          {/* Back to login */}
          <p className="mt-6 text-center">
            <Link to="/login" className={`inline-flex items-center gap-2 ${TEXT_LINK}`}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Login
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
