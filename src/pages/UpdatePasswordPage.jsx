import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent, AUDIT_EVENTS } from '../lib/auditLogger';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Logo from '../components/Logo';
import { useArabicT } from '../locales/useArabic';
import AuthErrorText from '../components/AuthErrorText.jsx';

// The playbook form field (docs/design/playbook.md §1), with room for the
// leading icon. The focus ring comes from the global *:focus-visible rule.
const FIELD =
  'w-full rounded-clay border border-rule bg-white py-3 pl-12 pr-4 text-ink placeholder:text-graphite focus:border-siegel transition-colors';

const UpdatePasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorCause, setErrorCause] = useState(null);
  const ta = useArabicT();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setErrorCause({ code: 'passwords_mismatch' });
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setErrorCause({ code: 'password_short' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        setError(error.message);
        setErrorCause(error);
      } else {
        logAuditEvent(AUDIT_EVENTS.PASSWORD_CHANGED);
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch {
      setError('An unexpected error occurred');
      setErrorCause({ code: 'unexpected' });
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
              {ta ? ta('account.update.doneTitle') : 'Password Updated!'}
            </h2>
            <p className="text-graphite mb-6">
              {t('auth.passwordUpdated')}
              <br />
              {ta ? ta('account.update.redirecting') : 'Redirecting to login...'}
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
      <SEO title={ta ? ta('account.update.seoTitle') : 'Update Password'} description="Choose a new password for your DeutschMeister account." path="/update-password" noindex />
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
            {t('auth.updatePassword')}
          </h1>
          <p className="hero-line text-[0.9375rem] leading-relaxed text-graphite sm:text-base" style={{ '--d': '220ms' }}>
            {ta ? ta('account.update.lead') : 'Enter your new password'}
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
              <AuthErrorText ta={ta} message={error} cause={errorCause} />
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="update-password" className="block text-sm font-bold text-ink mb-2">
                {t('auth.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="update-password"
                  dir="ltr"
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`${FIELD} pr-12`}
                  placeholder="At least 6 characters"
                  {...(ta ? { placeholder: ta('account.minPasswordPlaceholder') } : {})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md text-graphite transition-colors hover:text-siegel-deep"
                  aria-label={ta ? ta(showPassword ? 'account.hidePassword' : 'account.showPassword') : showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="update-password-confirm" className="block text-sm font-bold text-ink mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="update-password-confirm"
                  dir="ltr"
                  autoComplete="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={FIELD}
                  placeholder="Confirm your password"
                  {...(ta ? { placeholder: ta('account.confirmPlaceholder') } : {})}
                />
              </div>
            </div>

            {/* Submit — the one primary action on the screen */}
            <Button type="submit" shimmer disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                t('auth.updatePassword')
              )}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default UpdatePasswordPage;
