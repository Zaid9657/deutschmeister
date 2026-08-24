import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Logo from '../components/Logo';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const timedOut = searchParams.get('reason') === 'timeout';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Log In" description="Log in to your DeutschMeister account to continue learning German grammar from A1 to B2." path="/login" />
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
            Welcome Back
          </h1>
          <p className="text-graphite">
            {t('auth.login')} to continue your German journey
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-rule shadow-overlay p-8">
          {timedOut && (
            <div className="mb-6 p-4 bg-siegel-wash border border-siegel/25 rounded-lg text-siegel-deep text-sm">
              You were signed out because you were inactive.
            </div>
          )}

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
              <label htmlFor="login-email" className="block text-sm font-medium text-ink mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" />
                <input
                  id="login-email"
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
              <label htmlFor="login-password" className="block text-sm font-medium text-ink mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-paper border border-rule rounded-md focus:outline-none focus:ring-2 focus:ring-siegel focus:border-siegel transition-colors"
                  placeholder="Your password"
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/reset-password"
                className="text-sm text-siegel hover:text-siegel-deep transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-graphite">
            {t('auth.noAccount')}{' '}
            <Link to="/signup" className="text-siegel hover:text-siegel-deep font-medium">
              {t('auth.signup')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
