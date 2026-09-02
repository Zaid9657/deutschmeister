import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Logo from '../components/Logo';

// The playbook form field (docs/design/playbook.md §1), with room for the
// leading icon. `focus:border-siegel` is the only focus treatment the field
// itself carries; the ring comes from the global *:focus-visible rule.
const FIELD =
  'w-full rounded-clay border border-rule bg-white py-3 pl-12 pr-4 text-ink placeholder:text-graphite focus:border-siegel transition-colors';
const TEXT_LINK = 'font-bold text-siegel transition-colors hover:text-siegel-deep';

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
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 py-12">
      <SEO title="Log In" description="Log in to your DeutschMeister account to continue learning German grammar from A1 to B2." path="/login" />
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
            Welcome Back
          </h1>
          <p className="hero-line text-[0.9375rem] leading-relaxed text-graphite sm:text-base" style={{ '--d': '220ms' }}>
            {t('auth.login')} to continue your German journey
          </p>
        </div>

        {/* Form */}
        <Card raised className="p-8">
          {timedOut && (
            <div className="mb-6 flex items-center gap-3 rounded-clay bg-siegel-wash px-4 py-3 text-sm text-siegel-deep">
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              You were signed out because you were inactive.
            </div>
          )}

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
              <label htmlFor="login-email" className="block text-sm font-bold text-ink mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="login-email"
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
              <label htmlFor="login-password" className="block text-sm font-bold text-ink mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${FIELD} pr-12`}
                  placeholder="Your password"
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

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link to="/reset-password" className={`text-sm ${TEXT_LINK}`}>
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {/* Submit — the one primary action on the screen */}
            <Button type="submit" shimmer disabled={loading} size="lg" className="w-full">
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
            <Link to="/signup" className={TEXT_LINK}>
              {t('auth.signup')}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
