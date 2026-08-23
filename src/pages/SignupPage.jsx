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
import Logo from '../components/Logo';

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
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Sign Up Free" description="Create a free DeutschMeister account and start mastering German grammar with clear English explanations." path="/signup" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {/* The Meister-Siegel, not a "D" tile: the D was the retired identity, and
              a second mark beside the seal in the nav reads as two products. Logo
              renders a plain <a>, which matters — "/" is served by the Astro build,
              so a router <Link to="/"> client-routes to a route the SPA does not
              have and lands the user on NotFoundPage. */}
          <Logo size={64} showWordmark={false} className="mb-6" />
          <h1 className="font-display text-3xl font-semibold text-ink mb-2">
            {/* EN: Start Free */}
            Start for free
          </h1>
          <p className="text-graphite mb-4">
            Create an account and get instant access to:
          </p>
          {/* Free tier value list */}
          <ul className="text-left inline-block space-y-1 mb-2">
            {[
              'All A1.1 lessons — no restrictions',
              '2 free AI speaking sessions',
              // Matches DAILY_LIMITS.free_trial in netlify/functions/analyze-sentence.mjs
              '10 Sentence X-Ray analyses per day during your trial',
              '7-day Pro trial included'
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-graphite">
                <Check className="w-4 h-4 text-siegel flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-rule shadow-overlay p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="signup-field-1" className="block text-sm font-medium text-ink mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" />
                <input
                  id="signup-field-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-paper border border-rule rounded-md focus:outline-none focus:ring-2 focus:ring-siegel focus:border-siegel transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-field-2" className="block text-sm font-medium text-ink mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" />
                <input
                  id="signup-field-2"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-3 bg-paper border border-rule rounded-md focus:outline-none focus:ring-2 focus:ring-siegel focus:border-siegel transition-colors"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-graphite hover:text-ink"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-field-3" className="block text-sm font-medium text-ink mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" />
                <input
                  id="signup-field-3"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-paper border border-rule rounded-md focus:outline-none focus:ring-2 focus:ring-siegel focus:border-siegel transition-colors"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading} size="lg" className="w-full">
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
          <p className="mt-3 text-center text-xs text-graphite">
            Keine Kreditkarte erforderlich · Jederzeit kündbar
          </p>

          {/* Login link */}
          <p className="mt-5 text-center text-graphite">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-siegel hover:text-siegel-deep font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
