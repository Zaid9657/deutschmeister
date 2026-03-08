import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySubscription = async () => {
      // Wait for webhook to process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check subscription status
      await refreshSubscription();

      setLoading(false);
    };

    verifySubscription();
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
              Please wait a moment
            </p>
          </>
        ) : (
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
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccessPage;
