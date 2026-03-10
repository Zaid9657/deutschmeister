import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription, hasActiveSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifySubscription = async () => {
      // Poll up to 5 times, 3 seconds apart, waiting for webhook to process
      const maxAttempts = 5;
      const delayMs = 3000;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;

        await new Promise(resolve => setTimeout(resolve, delayMs));
        await refreshSubscription();

        if (hasActiveSubscription()) {
          setVerified(true);
          setLoading(false);
          return;
        }

        console.log(`Subscription check attempt ${attempt}/${maxAttempts} — not active yet`);
      }

      // After all attempts, stop loading even if not verified
      setLoading(false);
    };

    verifySubscription();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
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
              Your payment was successful. Your subscription may take a moment to activate.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              If your Pro status doesn't appear right away, try refreshing the page in a minute.
            </p>

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
