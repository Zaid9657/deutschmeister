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

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription, hasActiveSubscription } = useSubscription();
  const [polling, setPolling] = useState(true);
  const celebratedRef = useRef(false);

  // Derive verification from context state on every render. The previous version
  // captured hasActiveSubscription in a [] effect, so it kept reading the
  // mount-time `subscription = null` no matter how many refreshes succeeded —
  // every paying customer fell through to the "may take a moment" branch.
  const verified = hasActiveSubscription();

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
                Welcome to Pro!
              </h1>

              <p className="text-[0.9375rem] leading-relaxed text-graphite sm:text-base mb-8">
                Your subscription is now active. You have full access to all German lessons, grammar exercises, listening practice, and more.
              </p>

              {/* The one `celebrate` button in the app: a completed purchase has earned it. */}
              <Button variant="celebrate" size="lg" onClick={() => navigate('/dashboard')}>
                Start Learning
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
