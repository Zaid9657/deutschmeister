import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import confettiBurst from '../lib/confetti.js';
import { LEVEL_COURSES } from '../data/pricing.js';

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription, hasActiveSubscription, purchases } = useSubscription();
  const [polling, setPolling] = useState(true);
  const celebratedRef = useRef(false);

  // A one-time course purchase lands here too (the Lemon Squeezy redirect and
  // the overlay's Checkout.Success both point at this page). The most recent
  // purchase, if it is minutes old, is what was just bought — so the page
  // celebrates the level course rather than a subscription the buyer may not
  // have. An older purchase on the account is not "just bought" and falls
  // through to the Pro copy.
  const RECENT_MS = 30 * 60 * 1000;
  const latestPurchase = [...purchases].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )[0];
  const justBought =
    latestPurchase && Date.now() - new Date(latestPurchase.created_at).getTime() < RECENT_MS
      ? latestPurchase
      : null;
  const courseBought = justBought ? LEVEL_COURSES[justBought.product_key] || null : null;
  const telcBought = justBought?.product_key === 'telc_b1_komplett';

  // Derive verification from context state on every render. The previous version
  // captured hasActiveSubscription in a [] effect, so it kept reading the
  // mount-time `subscription = null` no matter how many refreshes succeeded —
  // every paying customer fell through to the "may take a moment" branch.
  const verified = hasActiveSubscription() || Boolean(justBought);

  useEffect(() => {
    if (verified) setPolling(false);
  }, [verified]);

  // The earned moment (playbook §0: pass = celebrate). Fires exactly once, the
  // first time Pro is confirmed — on mount if the webhook already landed,
  // otherwise the instant polling flips `verified`. The not-yet-activated
  // branch stays calm: no confetti until the win is real.
  useEffect(() => {
    if (!verified || celebratedRef.current) return;
    celebratedRef.current = true;
    confettiBurst();
  }, [verified]);

  useEffect(() => {
    let cancelled = false;

    const verifySubscription = async () => {
      // Poll while the Lemon Squeezy webhook lands. `subscription` updating
      // flips `verified` above, which ends the polling state.
      const maxAttempts = 5;
      const delayMs = 3000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        if (cancelled) return;
        await refreshSubscription();
      }

      if (!cancelled) setPolling(false);
    };

    verifySubscription();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = polling && !verified;

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper flex items-center justify-center px-4">
      <SEO title="Welcome to Pro!" description="Your DeutschMeister Pro subscription is active." path="/subscription/success" noindex />
      <Aurora />
      <motion.div
        className="relative max-w-md w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card raised className="p-8 text-center">
          {loading ? (
            <>
              <Loader2 className="w-16 h-16 text-siegel mx-auto mb-4 animate-spin" aria-hidden="true" />
              <h1 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-2">
                Processing your subscription...
              </h1>
              <p className="text-graphite">
                Please wait while we confirm your payment
              </p>
            </>
          ) : verified ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-limette-wash flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-accent-limette-ink" aria-hidden="true" />
              </motion.div>

              <h1 className="font-display text-[2.125rem] font-semibold leading-[1.05] tracking-[-0.022em] text-ink mb-4">
                {courseBought
                  ? `Your ${courseBought.code} course is yours`
                  : telcBought
                    ? 'Your telc B1 plan is ready'
                    : 'Welcome to Pro!'}
              </h1>

              <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-8">
                {courseBought
                  ? `Lifetime access to ${courseBought.levels.map((l) => l.toUpperCase()).join(' and ')} — every grammar topic, reading text, listening exercise and vocabulary list — plus ${courseBought.proMonths} months of Pro for the AI tools.`
                  : telcBought
                    ? `Your 4-week exam plan is unlocked, with ${LEVEL_COURSES.course_a1.proMonths} months of Pro included.`
                    : 'Your subscription is now active. You have full access to all German lessons, grammar exercises, listening practice, and more.'}
              </p>

              {/* The one `celebrate` button in the app: a completed purchase has earned it. */}
              <Button
                variant="celebrate"
                size="lg"
                onClick={() =>
                  navigate(courseBought ? `/level/${courseBought.levels[0]}` : telcBought ? '/telc-b1-kurs' : '/dashboard')
                }
              >
                {courseBought ? `Start ${courseBought.levels[0].toUpperCase()}` : telcBought ? 'Open the plan' : 'Start Learning'}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-aprikose-wash flex items-center justify-center"
              >
                <AlertCircle className="w-12 h-12 text-accent-aprikose-ink" aria-hidden="true" />
              </motion.div>

              <h1 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-4">
                Payment Received!
              </h1>

              <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-4">
                Your payment went through. Activation is taking longer than usual — this
                is normally a short delay on the payment provider's side, not a problem
                with your order.
              </p>
              <p className="text-graphite text-sm mb-6">
                Check again in a minute. If Pro still isn't showing, email{' '}
                <a href="mailto:zaid@deutsch-meister.de" className="font-bold text-siegel transition-colors hover:text-siegel-deep">
                  zaid@deutsch-meister.de
                </a>{' '}
                and it'll be sorted manually — your payment is already recorded.
              </p>

              <div className="flex flex-col items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setPolling(true); refreshSubscription().finally(() => setPolling(false)); }}
                >
                  Check again
                </Button>

                <Button size="lg" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccessPage;
