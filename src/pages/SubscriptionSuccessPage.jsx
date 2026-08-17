import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import SEO from '../components/SEO';

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription, hasActiveSubscription, subscription } = useSubscription();
  const [polling, setPolling] = useState(true);

  // Derive verification from context state on every render. The previous version
  // captured hasActiveSubscription in a [] effect, so it kept reading the
  // mount-time `subscription = null` no matter how many refreshes succeeded —
  // every paying customer fell through to the "may take a moment" branch.
  const verified = hasActiveSubscription();

  useEffect(() => {
    if (verified) setPolling(false);
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <SEO title="Welcome to Pro!" description="Your DeutschMeister Pro subscription is active." path="/subscription/success" noindex />
      <motion.div
        className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Processing your subscription...
            </h1>
            <p className="text-gray-400">
              Please wait while we confirm your payment
            </p>
          </>
        ) : verified ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to Pro!
            </h1>

            <p className="text-gray-300 mb-8">
              Your subscription is now active. You have full access to all German lessons, grammar exercises, listening practice, and more.
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Start Learning
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <AlertCircle className="w-20 h-20 text-amber-400 mx-auto mb-6" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-4">
              Payment Received!
            </h1>

            <p className="text-gray-300 mb-4">
              Your payment went through. Activation is taking longer than usual — this
              is normally a short delay on the payment provider's side, not a problem
              with your order.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Check again in a minute. If Pro still isn't showing, email{' '}
              <a href="mailto:zaid@deutsch-meister.de" className="text-blue-300 underline">
                zaid@deutsch-meister.de
              </a>{' '}
              and it'll be sorted manually — your payment is already recorded.
            </p>

            <button
              onClick={() => { setPolling(true); refreshSubscription().finally(() => setPolling(false)); }}
              className="inline-flex items-center gap-2 mb-6 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold py-2 px-5 rounded-lg transition-colors"
            >
              Check again
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccessPage;
