import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  trackSignupStarted,
  trackVerificationPageViewed,
  trackVerificationEmailResent,
} from '../lib/funnelTracking';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Check, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Logo from '../components/Logo';
import { useArabicT } from '../locales/useArabic';
import AuthErrorText from '../components/AuthErrorText.jsx';
import {
  GRAMMAR_TOPIC_COUNT,
  LEVEL_COUNT,
  TRIAL_DAILY_LIMIT,
  TRIAL_DAYS,
  TRIAL_SPEAKING_SESSIONS,
  TRIAL_WRITING_EVALUATIONS,
} from '../data/marketing.js';
import { pendingPlacement } from '../lib/placement.js';
import { postAuthPath } from '../lib/buyIntent';
import { peekBuyIntent } from '../lib/buyIntent.js';
import { COURSES, PLANS, courseForProduct, eur } from '../data/pricing.js';

// A signed-out Buy click (/pricing/, /courses/, the homepage line) stored what
// the visitor wanted before sending them here (lib/buyIntent.js). Say so: the
// account is step one of two, and the checkout resumes on its own afterwards —
// otherwise a buyer reads "Start your Pro trial" and thinks the purchase was lost.
const pendingPurchase = () => {
  const key = peekBuyIntent();
  if (!key) return null;
  const course = courseForProduct(key);
  if (course) return { label: `Deutsch ${course.code}`, price: course.price, once: true };
  if (key === 'telc_b1_komplett') return { label: COURSES.telc_b1_komplett.name, price: COURSES.telc_b1_komplett.price, once: true };
  const plan = PLANS[key];
  if (plan) return { label: plan.name, price: plan.price, once: false, interval: plan.interval };
  return null;
};
import { signupOutcome, resendRefusal, signedInAs, RESEND_COOLDOWN_SECONDS } from '../lib/signupConfirmation.js';

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

  // A level-test result taken signed out on this browser, waiting to be saved
  // (src/lib/placement.js). Read once: the line below names the level the
  // visitor came here to keep.
  const [placedLevel] = useState(() => pendingPlacement());
  const [purchase] = useState(() => pendingPurchase());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  // The cause behind `error`, so the Arabic screen can explain it by code.
  const [errorCause, setErrorCause] = useState(null);
  // Arabic on this screen (null unless the interface is Arabic); the English
  // stays inline below (tests pin it), the Arabic is src/locales/ar/app.js.
  const ta = useArabicT();
  const [loading, setLoading] = useState(false);

  // Set once signUp answers without a session: the address the confirmation
  // link went to. It swaps the form for the check-your-inbox panel, because
  // /verify-email needs a session and would bounce the learner to /login
  // (src/lib/signupConfirmation.js has the evidence).
  const [sentTo, setSentTo] = useState('');
  const [resendState, setResendState] = useState('idle'); // 'idle' | 'sending' | 'sent'
  const [cooldown, setCooldown] = useState(0);
  // Refusals in a row that named no wait, and whether that reached the notice
  // (the hourly cap, not the 60 s window: src/lib/signupConfirmation.js).
  const [untimedRefusals, setUntimedRefusals] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const inboxHeading = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const tick = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [cooldown]);

  // The panel replaces the form the learner just submitted; move focus to its
  // heading so a screen reader announces it and a phone scrolls to it.
  useEffect(() => {
    if (sentTo) inboxHeading.current?.focus();
  }, [sentTo]);

  // Confirmed in another tab: supabase-js signs this tab in too (SIGNED_IN over
  // its BroadcastChannel), so the panel moves on to where a login would have
  // gone. Only a session of the address the link went to counts.
  useEffect(() => {
    if (!sentTo) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (signedInAs(session, sentTo)) navigate(postAuthPath(), { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [sentTo, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCause(null);

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
      const { data, error } = await signUp(email, password);
      const outcome = signupOutcome({ data, error });
      if (outcome === 'error') {
        setError(error.message);
        setErrorCause(error);
        logFailedSignup(email, error);
      } else if (outcome === 'signed-in') {
        navigate('/verify-email', { replace: true });
        return;
      } else {
        // The event /verify-email fired on mount for this step, kept so the
        // signup funnel reads the same before and after.
        trackVerificationPageViewed();
        setSentTo(email.trim());
        setPassword('');
        setConfirmPassword('');
        setResendState('idle');
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setErrorCause({ code: 'unexpected' });
      logFailedSignup(email, { code: 'unexpected', message: err.message || 'Unexpected error' });
    } finally {
      setLoading(false);
    }
  };

  // Session-less resend: supabase.auth.resend needs only the address. The link
  // goes to /login like the first one (AuthContext signUp's emailRedirectTo),
  // which forwards a visitor who arrives signed in.
  const handleResend = async () => {
    if (!sentTo || cooldown > 0 || resendState === 'sending') return;
    setError('');
    setResendState('sending');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    if (resendError) {
      const refusal = resendRefusal(resendError, untimedRefusals);
      if (refusal) {
        setCooldown(refusal.wait);
        setUntimedRefusals(refusal.untimed);
        setLimitReached(refusal.limitReached);
      } else {
        setUntimedRefusals(0);
        setLimitReached(false);
        setError(resendError.message);
        setErrorCause(resendError);
      }
      setResendState('idle');
    } else {
      trackVerificationEmailResent();
      setUntimedRefusals(0);
      setLimitReached(false);
      setResendState('sent');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  const changeAddress = () => {
    setSentTo('');
    setResendState('idle');
    setCooldown(0);
    setUntimedRefusals(0);
    setLimitReached(false);
    setError('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center bg-paper px-4 pb-12 pt-24 font-body">
      <SEO title={ta ? ta('account.signup.seoTitle') : 'Sign Up Free'} description="Create a free DeutschMeister account and start mastering German grammar with clear English explanations." path="/signup" />
      <Aurora />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {purchase && (
            <div className="mb-6 rounded-clay border border-ink bg-linie-wash px-4 py-3 text-start shadow-raise-linie" role="status">
              <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-ink">{ta ? ta('account.signup.purchaseStep') : 'Step 1 of 2 · your account'}</p>
              {ta ? (
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">{ta('account.signup.purchaseBody', { label: purchase.label, price: eur(purchase.price) })}</p>
              ) : (
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink">
                  Then your checkout for <strong>{purchase.label}</strong> — {eur(purchase.price)}
                  {purchase.once ? ', one payment' : ` a ${purchase.interval}`} — opens on its own when you are back on this browser after confirming your email.
                </p>
              )}
            </div>
          )}
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
            {ta ? ta('account.signup.title') : <>Start your {TRIAL_DAYS}-day Pro trial</>}
          </h1>
          <p className="hero-line text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-4" style={{ '--d': '220ms' }}>
            {ta ? ta('account.signup.lead', { days: TRIAL_DAYS }) : 'Creating a free account starts your trial. No payment details are requested.'}
          </p>
          {/* Free tier value list */}
          <ul className="hero-line text-start inline-block space-y-1 mb-2" style={{ '--d': '320ms' }}>
            {(ta ? [
              ta('account.signup.benefitSave'),
              ta('account.signup.benefitReview'),
              ta('account.signup.benefitTrial', { levels: LEVEL_COUNT }),
              ta('account.signup.benefitAi', { writing: TRIAL_WRITING_EVALUATIONS, speaking: TRIAL_SPEAKING_SESSIONS }),
            ] : [
              `All ${LEVEL_COUNT} levels and ${GRAMMAR_TOPIC_COUNT} grammar topics during the trial`,
              `${TRIAL_SPEAKING_SESSIONS} AI speaking sessions during the trial`,
              `${TRIAL_DAILY_LIMIT} Sentence X-Ray analyses per day during the trial`,
              `${TRIAL_WRITING_EVALUATIONS} AI writing evaluations during the trial`,
            ]).map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-graphite">
                <Check className="w-4 h-4 text-siegel flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="hero-line mt-3 text-sm text-graphite" style={{ '--d': '380ms' }}>
            {ta ? (
              <>{ta('account.signup.lookAround')}{' '}<a href="/course/a1.1" className={TEXT_LINK}>{ta('account.signup.startWithoutAccount')}</a></>
            ) : (
              <>
                Want to look around first?{' '}
                <a href="/grammar/a1.1/" className={TEXT_LINK}>Explore A1.1 without an account.</a>
              </>
            )}
          </p>
        </div>

        {/* Form */}
        <Card raised className="p-8">
          {placedLevel && (
            <p className="mb-6 rounded-clay border border-rule bg-siegel-wash px-4 py-3 text-sm leading-relaxed text-ink">
              {ta ? ta('account.signup.placed', { level: placedLevel }) : (
                <>
                  Your level test result, <span className="font-bold">{placedLevel}</span>, is saved to your
                  account the first time you sign in on this browser.
                </>
              )}
            </p>
          )}
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

          {sentTo ? (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-siegel-wash flex items-center justify-center">
                <Mail className="w-7 h-7 text-siegel" aria-hidden="true" />
              </div>
              <h2
                ref={inboxHeading}
                tabIndex={-1}
                className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-3"
              >
                {ta ? ta('account.signup.inboxTitle') : 'Check your inbox'}
              </h2>
              <p className="text-graphite mb-1">{ta ? ta('account.signup.inboxSentTo') : 'We sent a confirmation link to:'}</p>
              <p className="font-data text-[0.8125rem] font-semibold text-siegel-deep mb-5 break-all" dir="ltr">{sentTo}</p>
              {ta ? (
                <p className="text-start text-sm leading-relaxed text-graphite mb-6">{ta('account.signup.inboxBody')}</p>
              ) : (
                <p className="text-left text-sm leading-relaxed text-graphite mb-6">
                  Open the email with the subject{' '}
                  <span className="font-semibold text-ink">&ldquo;Confirm your DeutschMeister account&rdquo;</span> and
                  click its link. It activates your account and signs you in. If a welcome email arrives too, the link
                  you need is still in the confirmation email. Check your spam folder as well.
                </p>
              )}

              {resendState === 'sent' && (
                <p
                  role="status"
                  className="mb-4 flex items-center justify-center gap-2 rounded-clay bg-accent-limette-wash px-4 py-3 text-sm font-semibold text-accent-limette-ink"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  {ta ? ta('account.signup.sentAgain') : 'Sent again. Use the link in the newest email.'}
                </p>
              )}

              {limitReached && (
                <p
                  role="status"
                  className="mb-4 rounded-clay bg-accent-aprikose-wash px-4 py-3 text-left text-sm font-semibold text-accent-aprikose-ink"
                >
                  {ta ? ta('account.signup.limitReached') : (
                    <>
                      The limit for confirmation emails is reached for now, so we cannot send another one. Please try again
                      later, and look in your spam folder for the email we already sent.
                    </>
                  )}
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResend}
                disabled={cooldown > 0 || resendState === 'sending'}
              >
                {resendState === 'sending' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {ta
                  ? (cooldown > 0 ? ta('account.signup.sendAgainIn', { s: cooldown }) : ta('account.signup.sendAgain'))
                  : (cooldown > 0 ? `Send it again in ${cooldown} s` : 'Send it again')}
              </Button>

              <p className="mt-6 text-sm text-graphite">
                {ta ? ta('account.signup.wrongAddress') : 'Wrong address?'}{' '}
                <button type="button" onClick={changeAddress} className={TEXT_LINK}>
                  {ta ? ta('account.signup.useDifferent') : 'Use a different email'}
                </button>
              </p>
              <p className="mt-2 text-sm text-graphite">
                {ta ? ta('account.signup.signedUpBefore') : 'Signed up with this address before?'}{' '}
                <Link to="/login" className={TEXT_LINK}>
                  {ta ? ta('auth.login') : 'Log in'}
                </Link>
              </p>
            </div>
          ) : (
            <>
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
                  dir="ltr"
                  name="email"
                  type="email"
                  autoComplete="email"
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
                  dir="ltr"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-graphite transition-colors hover:text-siegel-deep"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  {...(ta ? { 'aria-label': ta(showPassword ? 'account.hidePassword' : 'account.showPassword') } : {})}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
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
                  dir="ltr"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                  {ta ? ta('account.signup.creating') : 'Creating account...'}
                </>
              ) : (
                t('auth.signup')
              )}
            </Button>
          </form>

          {/* Trust line */}
          {/* EN: No credit card required · Cancel anytime */}
          <p className="mt-3 text-center font-data text-[0.6875rem] tracking-[0.02em] text-graphite">
            {ta ? ta('account.signup.trust') : 'Free account · no credit card · no automatic charge when the trial ends'}
          </p>

          {/* Login link */}
          <p className="mt-5 text-center text-graphite">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className={TEXT_LINK}>
              {t('auth.login')}
            </Link>
          </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SignupPage;
