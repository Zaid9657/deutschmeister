import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { trackSignupStarted } from '../lib/funnelTracking';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
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

const logFailedSignup = (email, error) => {
  supabase
    .from('signup_attempts')
    .insert({
      email,
      error_code: error.code || error.status || null,
      error_message: error.message || 'Unknown error',
      user_agent: navigator.userAgent,
    })
    .then(({ error: logError }) => {
      if (logError) console.error('Failed to log signup attempt:', logError);
    });
};

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  useEffect(() => { trackSignupStarted(); }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
        logFailedSignup(email, error);
      } else {
        navigate('/verify-email', { replace: true });
        return;
      }
    } catch (err) {
      setError('An unexpected error occurred');
      logFailedSignup(email, { code: 'unexpected', message: err.message || 'Unexpected error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Sign Up Free" description="Create a free DeutschMeister account and start mastering German grammar with clear English explanations." path="/signup" />
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
            {/* EN: Start Free */}
            Start for free
          </h1>
          <p className="hero-line text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-4" style={{ '--d': '220ms' }}>
            Create an account and get instant access to:
          </p>
          {/* Free tier value list */}
          <ul className="hero-line text-left inline-block space-y-1 mb-2" style={{ '--d': '320ms' }}>
            {[
              'All A1.1 lessons — no restrictions',
              '2 free AI speaking sessions',
              // Matches DAILY_LIMITS.free_trial in netlify/functions/analyze-sentence.mjs
              '10 Sentence X-Ray analyses per day during your trial',
              '7-day Pro trial included'
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-graphite">
                <Check className="w-4 h-4 text-siegel flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
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
              <label htmlFor="signup-field-1" className="block text-sm font-bold text-ink mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="signup-field-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={FIELD}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-field-2" className="block text-sm font-bold text-ink mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="signup-field-2"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`${FIELD} pr-12`}
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md text-graphite transition-colors hover:text-siegel-deep"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-field-3" className="block text-sm font-bold text-ink mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="signup-field-3"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={FIELD}
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Submit — the one primary action on the screen */}
            <Button type="submit" shimmer disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                t('auth.signup')
              )}
            </Button>
          </form>

          {/* Trust line */}
          {/* EN: No credit card required · Cancel anytime */}
          <p className="mt-3 text-center font-data text-[0.6875rem] tracking-[0.02em] text-graphite">
            Keine Kreditkarte erforderlich · Jederzeit kündbar
          </p>

          {/* Login link */}
          <p className="mt-5 text-center text-graphite">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className={TEXT_LINK}>
              {t('auth.login')}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupPage;
