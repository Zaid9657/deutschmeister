import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Crown, Check, Clock, Shield, Zap, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';

const SubscriptionPage = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const {
    isInFreeTrial,
    getTrialDaysRemaining,
    hasActiveSubscription,
    subscription,
    refreshSubscription,
    verifySubscription,
  } = useSubscription();
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const pollRef = useRef(null);
  const isGerman = i18n.language === 'de';

  const inTrial = isInFreeTrial();
  const daysLeft = getTrialDaysRemaining();
  const isSubscribed = hasActiveSubscription();

  // Stop polling once subscription is confirmed
  useEffect(() => {
    if (isSubscribed && verifying) {
      setVerifying(false);
      setVerifyMessage('');
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [isSubscribed, verifying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSubscribe = (planType) => {
    const plan = LEMONSQUEEZY_CONFIG.plans[planType];
    const checkoutUrl = LEMONSQUEEZY_CONFIG.getCheckoutUrl(
      plan.variantId,
      user?.email || '',
      user?.id || ''
    );
    window.open(checkoutUrl, '_blank');

    // Start polling: first poll Supabase, then call verify as fallback
    setVerifying(true);
    setVerifyMessage('');
    let count = 0;
    pollRef.current = setInterval(async () => {
      count += 1;
      await refreshSubscription();

      // After 15s of polling Supabase, try the verify endpoint as fallback
      if (count === 5) {
        await verifySubscription();
      }

      // Stop after 20 attempts (60s)
      if (count >= 20) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setVerifying(false);
      }
    }, 3000);
  };

  // Manual "Verify my subscription" button handler
  const handleManualVerify = async () => {
    setVerifying(true);
    setVerifyMessage('');
    const recovered = await verifySubscription();
    if (!recovered) {
      setVerifyMessage(
        isGerman
          ? 'Kein Abonnement gefunden. Bitte warten Sie einige Minuten und versuchen Sie es erneut.'
          : 'No subscription found. Please wait a few minutes and try again.'
      );
    }
    setVerifying(false);
  };

  const plans = [
    {
      id: 'monthly',
      name: isGerman ? 'Pro Monatlich' : 'Pro Monthly',
      price: '9.99',
      period: isGerman ? '/Monat' : '/month',
      features: isGerman
        ? [
            'Zugang zu allen 8 Stufen (A1.1–B2.2)',
            'Alle Grammatiklektionen mit Übungen',
            'Hörverständnisübungen',
            'Podcasts & Video-Inhalte',
            'Fortschrittsverfolgung',
            'Jederzeit kündbar',
          ]
        : [
            'Full access to all 8 levels (A1.1–B2.2)',
            'All grammar lessons with exercises',
            'Listening comprehension exercises',
            'Podcasts & video content',
            'Progress tracking',
            'Cancel anytime',
          ],
      highlight: false,
    },
    {
      id: 'yearly',
      name: isGerman ? 'Pro Jährlich' : 'Pro Yearly',
      price: '79.99',
      period: isGerman ? '/Jahr' : '/year',
      savings: isGerman ? 'Spare 33%' : 'Save 33%',
      monthlyEquiv: '6.67',
      features: isGerman
        ? [
            'Alles im Monatsplan',
            '33% günstiger als monatlich',
            'Prioritäts-Support',
            'Frühzeitiger Zugang zu neuen Inhalten',
            'Fortschrittsverfolgung',
            'Jederzeit kündbar',
          ]
        : [
            'Everything in Monthly',
            'Save 33% compared to monthly',
            'Priority support',
            'Early access to new content',
            'Progress tracking',
            'Cancel anytime',
          ],
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            {/* EN: Pick up where you left off */}
            Mach weiter, wo du aufgehört hast
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            {/* EN: Your trial is over, but your progress stays. Choose a plan and keep learning without limits. */}
            Deine Testphase ist vorbei, aber dein Fortschritt bleibt. Wähle einen Plan und lerne ohne Limits weiter.
          </p>
        </motion.div>

        {/* Payment verification */}
        {verifying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl border bg-blue-50 border-blue-200"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-800">
                  {isGerman ? 'Zahlung wird bestätigt...' : 'Verifying your payment...'}
                </p>
                <p className="text-sm text-blue-600">
                  {isGerman
                    ? 'Dies kann einige Sekunden dauern. Bitte schließen Sie diese Seite nicht.'
                    : 'This may take a few seconds. Please do not close this page.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Status Card */}
        {(inTrial || isSubscribed) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`mb-8 p-4 rounded-xl border ${
              isSubscribed
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <>
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-800">
                      {isGerman ? 'Aktives Abonnement' : 'Active Subscription'}
                    </p>
                    <p className="text-sm text-emerald-600">
                      {subscription?.plan_type === 'yearly'
                        ? isGerman ? 'Jahresplan' : 'Yearly Plan'
                        : isGerman ? 'Monatsplan' : 'Monthly Plan'}
                      {' — '}
                      {isGerman ? 'Gültig bis' : 'Valid until'}{' '}
                      {new Date(subscription?.subscription_end).toLocaleDateString(
                        isGerman ? 'de-DE' : 'en-US'
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-800">
                      {isGerman ? 'Kostenlose Testphase' : 'Free Trial'}
                    </p>
                    <p className="text-sm text-amber-600">
                      {daysLeft} {daysLeft === 1
                        ? isGerman ? 'Tag verbleibend' : 'day remaining'
                        : isGerman ? 'Tage verbleibend' : 'days remaining'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Expired notice */}
        {!inTrial && !isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 p-4 rounded-xl border bg-red-50 border-red-200"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  {isGerman ? 'Testphase abgelaufen' : 'Trial Expired'}
                </p>
                <p className="text-sm text-red-600">
                  {isGerman
                    ? 'Abonniere jetzt, um weiter auf alle Inhalte zuzugreifen.'
                    : 'Subscribe now to continue accessing all content.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Already paid? Verify button */}
        {!isSubscribed && !verifying && (
          <div className="mb-8 text-center">
            <button
              onClick={handleManualVerify}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isGerman ? 'Bereits bezahlt? Abonnement überprüfen' : 'Already paid? Verify my subscription'}
            </button>
            {verifyMessage && (
              <p className="mt-2 text-sm text-red-500">{verifyMessage}</p>
            )}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl border-2 p-6 ${
                plan.highlight
                  ? 'border-amber-400 bg-white shadow-xl shadow-amber-500/10'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {isGerman ? 'Bester Wert' : 'Best Value'}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-slate-900">€{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                {plan.savings && (
                  <span className="inline-block mt-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {plan.savings}
                  </span>
                )}
                {plan.monthlyEquiv && (
                  <p className="mt-1 text-xs text-slate-500">
                    {isGerman ? `Nur €${plan.monthlyEquiv}/Monat` : `Only €${plan.monthlyEquiv}/month`}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isSubscribed}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isSubscribed
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : plan.highlight
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {isSubscribed
                  ? isGerman ? 'Bereits abonniert' : 'Already Subscribed'
                  : isGerman ? 'Jetzt abonnieren' : 'Subscribe Now'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Trial info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-slate-500 mb-8"
        >
          {isGerman
            ? 'Alle Pläne beinhalten eine 7-tägige kostenlose Testphase. Jederzeit kündbar.'
            : 'All plans include a 7-day free trial. Cancel anytime.'}
        </motion.p>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {isGerman ? 'Was du bekommst' : 'What You Get'}
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: '📚',
                title: isGerman ? '8 Stufen' : '8 Levels',
                desc: isGerman ? 'Von A1.1 bis B2.2' : 'From A1.1 to B2.2',
              },
              {
                icon: '📖',
                title: isGerman ? 'Leseübungen' : 'Reading Lessons',
                desc: isGerman ? '52+ Lesetexte' : '52+ reading texts',
              },
              {
                icon: '🗣️',
                title: isGerman ? 'KI-Sprechen' : 'AI Speaking',
                desc: isGerman ? 'Konversation üben' : 'Practice conversation',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-white border border-slate-200">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
