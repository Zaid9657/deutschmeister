import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInFreeTrial, hasActiveSubscription, getTrialDaysRemaining } = useSubscription();

  const isSubscribed = user ? hasActiveSubscription() : false;
  const inTrial = user ? isInFreeTrial() : false;
  const trialDaysRemaining = user ? getTrialDaysRemaining() : 0;

  const handleSubscribe = (planType) => {
    if (!user) {
      navigate('/signup', { state: { redirectTo: '/pricing' } });
      return;
    }

    const plan = LEMONSQUEEZY_CONFIG.plans[planType];
    const checkoutUrl = LEMONSQUEEZY_CONFIG.getCheckoutUrl(
      plan.variantId,
      user.email,
      user.id
    );

    // Open LemonSqueezy checkout in new tab
    window.open(checkoutUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-16 px-4 pt-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock Your German Potential
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get full access to all lessons, grammar exercises, listening practice, and more.
          </p>

          {/* Trial Banner */}
          {inTrial && (
            <div className="mt-6 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
              <Sparkles className="w-5 h-5" />
              <span>{trialDaysRemaining} days left in your free trial</span>
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Monthly Plan */}
          <motion.div
            className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Pro Monthly</h2>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-white">&euro;9.99</span>
              <span className="text-gray-400">/month</span>
            </div>

            <p className="text-gray-400 mb-6">
              Perfect for getting started with German
            </p>

            <ul className="space-y-3 mb-8">
              {LEMONSQUEEZY_CONFIG.plans.monthly.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={isSubscribed}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {isSubscribed ? 'Already Subscribed' : 'Start 7-Day Free Trial'}
            </button>
          </motion.div>

          {/* Yearly Plan - Recommended */}
          <motion.div
            className="relative bg-gradient-to-b from-yellow-500/10 to-gray-800/50 backdrop-blur border-2 border-yellow-500/50 rounded-2xl p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm">
                BEST VALUE - SAVE 33%
              </span>
            </div>

            <div className="flex items-center gap-2 mb-4 mt-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Pro Yearly</h2>
            </div>

            <div className="mb-2">
              <span className="text-5xl font-bold text-white">&euro;79.99</span>
              <span className="text-gray-400">/year</span>
            </div>

            <p className="text-green-400 text-sm mb-6">
              That's only &euro;6.67/month!
            </p>

            <p className="text-gray-400 mb-6">
              Best for committed learners
            </p>

            <ul className="space-y-3 mb-8">
              {LEMONSQUEEZY_CONFIG.plans.yearly.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={isSubscribed}
              className="w-full py-3 px-6 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors"
            >
              {isSubscribed ? 'Already Subscribed' : 'Start 7-Day Free Trial'}
            </button>
          </motion.div>
        </div>

        {/* Free Trial Info */}
        <motion.div
          className="text-center mt-12 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p>All plans include a <strong className="text-white">7-day free trial</strong></p>
          <p className="text-sm mt-2">Cancel anytime. No questions asked.</p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-8 mt-12 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>7-Day Money Back</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
