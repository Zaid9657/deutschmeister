import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Zap, Mic, Star, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInFreeTrial, hasActiveSubscription, getTrialDaysRemaining, profile } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const inTrial = user ? isInFreeTrial() : false;
  const trialDaysRemaining = user ? getTrialDaysRemaining() : 0;

  // Determine current subscription tier
  const currentTier = (() => {
    if (!user) return null;
    if (profile?.subscription_tier === 'premium') return 'premium';
    if (profile?.subscription_tier === 'pro') return 'pro';
    if (profile?.is_subscribed) return 'pro'; // legacy fallback
    if (inTrial) return 'trial';
    return 'free';
  })();

  const isOnPro = currentTier === 'pro';
  const isOnPremium = currentTier === 'premium';

  const handleSubscribe = (planKey) => {
    if (!user) {
      navigate('/signup', { state: { redirectTo: '/pricing' } });
      return;
    }
    const plan = LEMONSQUEEZY_CONFIG.plans[planKey];
    const checkoutUrl = LEMONSQUEEZY_CONFIG.getCheckoutUrl(
      plan.variantId,
      user.email,
      user.id
    );
    window.open(checkoutUrl, '_blank');
  };

  const proKey = billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const premiumKey = billingCycle === 'yearly' ? 'premiumYearly' : 'premiumMonthly';

  // Button config for Pro card
  const proButton = (() => {
    if (isOnPro) return { label: 'Aktuelles Abo', disabled: true, style: 'current' };
    if (isOnPremium) return { label: 'Enthalten', disabled: true, style: 'included' };
    return { label: 'Jetzt starten', disabled: false, style: 'pro' };
  })();

  // Button config for Premium card
  const premiumButton = (() => {
    if (isOnPremium) return { label: 'Aktuelles Abo', disabled: true, style: 'current' };
    if (isOnPro) return { label: 'Jetzt upgraden', disabled: false, style: 'upgrade' };
    return { label: 'Jetzt starten', disabled: false, style: 'premium' };
  })();

  const getButtonClasses = (style) => {
    switch (style) {
      case 'current':
        return 'bg-gray-700 text-gray-300 cursor-not-allowed';
      case 'included':
        return 'bg-gray-700 text-gray-400 cursor-not-allowed';
      case 'pro':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'premium':
        return 'bg-yellow-500 hover:bg-yellow-400 text-black font-bold';
      case 'upgrade':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-16 px-4 pt-24">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Unlock Your German Potential
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get full access to all lessons, grammar exercises, listening practice, and AI speaking.
          </p>

          {inTrial && !isOnPro && !isOnPremium && (
            <div className="mt-6 inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full">
              <Sparkles className="w-5 h-5" />
              <span>{trialDaysRemaining} days left in your free trial</span>
            </div>
          )}
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <div className="inline-flex items-center bg-gray-800/80 rounded-full p-1 border border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                -33%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Pro Plan */}
          <motion.div
            className={`relative bg-gray-800/50 backdrop-blur border rounded-2xl p-8 ${
              isOnPro ? 'border-blue-500/60 ring-1 ring-blue-500/30' : 'border-gray-700'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Current Plan Badge */}
            {isOnPro && (
              <div className="absolute -top-3 left-6">
                <span className="bg-blue-500 text-white font-semibold px-3 py-0.5 rounded-full text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Aktuell
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Pro</h2>
            </div>

            <div className="mb-2">
              <span className="text-5xl font-bold text-white">
                &euro;{billingCycle === 'yearly' ? '79.99' : '9.99'}
              </span>
              <span className="text-gray-400">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>

            {billingCycle === 'yearly' && (
              <p className="text-green-400 text-sm mb-4">
                That&apos;s only &euro;6.67/month!
              </p>
            )}
            {billingCycle === 'monthly' && <div className="mb-4" />}

            <p className="text-gray-400 mb-6">
              Perfect for getting started with German
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Full access to all 8 levels (A1.1–B2.2)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>All grammar lessons with exercises</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Listening comprehension exercises</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Podcasts &amp; video content</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Progress tracking</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Mic className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>5 speaking sessions per month</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Cancel anytime</span>
              </li>
            </ul>

            <button
              onClick={() => !proButton.disabled && handleSubscribe(proKey)}
              disabled={proButton.disabled}
              className={`w-full py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${getButtonClasses(proButton.style)}`}
            >
              {proButton.style === 'current' && <CheckCircle2 className="w-4 h-4" />}
              {proButton.label}
            </button>
          </motion.div>

          {/* Premium Plan - Highlighted */}
          <motion.div
            className={`relative bg-gradient-to-b from-yellow-500/10 to-gray-800/50 backdrop-blur rounded-2xl p-8 ${
              isOnPremium
                ? 'border-2 border-yellow-400 ring-1 ring-yellow-400/30'
                : 'border-2 border-yellow-500/50'
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              {isOnPremium ? (
                <span className="bg-yellow-400 text-black font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aktuell
                </span>
              ) : (
                <span className="bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  MOST POPULAR
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4 mt-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Premium</h2>
            </div>

            <div className="mb-2">
              <span className="text-5xl font-bold text-white">
                &euro;{billingCycle === 'yearly' ? '199.99' : '24.99'}
              </span>
              <span className="text-gray-400">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>

            {billingCycle === 'yearly' && (
              <p className="text-green-400 text-sm mb-4">
                That&apos;s only &euro;16.67/month!
              </p>
            )}
            {billingCycle === 'monthly' && <div className="mb-4" />}

            <p className="text-gray-400 mb-6">
              For serious learners who want unlimited speaking
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start gap-3 text-white font-medium">
                <Mic className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Unlimited speaking practice</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Priority AI response</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              {billingCycle === 'yearly' && (
                <li className="flex items-start gap-3 text-gray-300">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Save 33% compared to monthly</span>
                </li>
              )}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span>Cancel anytime</span>
              </li>
            </ul>

            <button
              onClick={() => !premiumButton.disabled && handleSubscribe(premiumKey)}
              disabled={premiumButton.disabled}
              className={`w-full py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${getButtonClasses(premiumButton.style)}`}
            >
              {premiumButton.style === 'current' && <CheckCircle2 className="w-4 h-4" />}
              {premiumButton.style === 'upgrade' && <Crown className="w-4 h-4" />}
              {premiumButton.label}
            </button>
          </motion.div>
        </div>

        {/* Free Trial Info */}
        {!isOnPro && !isOnPremium && (
          <motion.div
            className="text-center mt-12 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p>All plans include a <strong className="text-white">7-day free trial</strong></p>
            <p className="text-sm mt-2">Cancel anytime. No questions asked.</p>
          </motion.div>
        )}

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
