import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Mic, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';

// i18n-ready: strings are hardcoded EN/DE pairs — wire to i18n when needed

const OBJECTIONS = [
  {
    q_de: 'Noch eine Grammatik-Webseite?',
    q_en: 'Another grammar website?',
    a_de: 'DeutschMeister erklärt Grammatik auf Englisch, bevor es die deutschen Regeln zeigt. Kein Fachjargon, keine Tabellen ohne Kontext.',
    a_en: 'DeutschMeister explains grammar in English first, then shows you how German does it. No jargon, no tables without context.',
  },
  {
    q_de: 'Kann KI wirklich beim Deutschlernen helfen?',
    q_en: 'Can AI really help me learn German?',
    a_de: 'Unser Sentence X-Ray analysiert jeden deutschen Satz und zeigt dir Fälle, Rollen und Satzstruktur — sofort. Kein anderes Tool macht das.',
    a_en: 'Our Sentence X-Ray analyzes any German sentence and shows you cases, roles, and structure — instantly. No other tool does this.',
  },
  {
    q_de: 'Lohnt sich das, wenn es kostenlose Alternativen gibt?',
    q_en: 'Is it worth it when free alternatives exist?',
    a_de: 'Kostenlose Ressourcen erklären WAS. Wir erklären WARUM. Dieser Unterschied entscheidet, ob Grammatik hängen bleibt.',
    a_en: 'Free resources explain WHAT. We explain WHY. That difference is what makes grammar stick.',
  },
];

const FAQS = [
  {
    q_de: 'Kann ich vor dem Kauf testen?',
    q_en: 'Can I try before buying?',
    a_de: 'Ja! A1.1 ist komplett kostenlos, ohne Anmeldung. Teste auch den Sentence X-Ray und 2 kostenlose Sprechübungen.',
    a_en: 'Yes! A1.1 is completely free, no signup needed. Try Sentence X-Ray and 2 free speaking sessions too.',
  },
  {
    q_de: 'Was passiert nach der Testphase?',
    q_en: 'What happens after the trial?',
    a_de: 'Du behältst Zugang zu allen kostenlosen Inhalten. Nur Premium-Features wie Sprechübungen und erweiterte Analysen erfordern ein Abo.',
    a_en: 'You keep access to all free content. Only premium features like speaking practice and extended analyses require a subscription.',
  },
  {
    q_de: 'Kann ich jederzeit kündigen?',
    q_en: 'Can I cancel anytime?',
    a_de: 'Ja, jederzeit. Keine Fragen, keine versteckten Kosten.',
    a_en: 'Yes, anytime. No questions asked, no hidden fees.',
  },
];

function FaqItem({ q_en, q_de, a_en, a_de }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left text-white font-medium hover:bg-gray-800/60 transition-colors"
      >
        <span>{q_en} <span className="text-gray-500 font-normal text-sm">/ {q_de}</span></span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-700/60 pt-4">
          <p>{a_en}</p>
          <p className="mt-2 text-gray-500">{a_de}</p>
        </div>
      )}
    </div>
  );
}

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isInFreeTrial, getTrialDaysRemaining, profile } = useSubscription();
  const [billingCycle, setBillingCycle] = useState('monthly');

  const inTrial = user ? isInFreeTrial() : false;
  const trialDaysRemaining = user ? getTrialDaysRemaining() : 0;

  const currentTier = (() => {
    if (!user) return null;
    if (profile?.subscription_tier === 'pro') return 'pro';
    if (profile?.is_subscribed) return 'pro'; // legacy fallback
    if (inTrial) return 'trial';
    return 'free';
  })();

  const isOnPro = currentTier === 'pro';

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

  const proButton = (() => {
    if (isOnPro) return { label: 'Aktuelles Abo', disabled: true, style: 'current' };
    return { label: 'Jetzt starten', disabled: false, style: 'pro' };
  })();

  const getButtonClasses = (style) => {
    switch (style) {
      case 'current':
        return 'bg-gray-700 text-gray-300 cursor-not-allowed';
      case 'pro':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-16 px-4 pt-24">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* EN: "Finally Understand German Grammar" */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Deutsche Grammatik endlich verstehen
          </h1>
          {/* EN: "Join hundreds of learners using DeutschMeister to master German grammar — from cases to sentence structure." */}
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join hundreds of learners using DeutschMeister to master German grammar — from cases to sentence structure.
          </p>

          {inTrial && !isOnPro && (
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
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">

          {/* Free Plan */}
          <motion.div
            className="relative bg-gray-800/50 backdrop-blur border border-gray-700 rounded-2xl p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-white">Free</h2>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-white">&euro;0</span>
              <span className="text-gray-400">/forever</span>
            </div>

            <p className="text-gray-400 mb-6">
              Start learning with no commitment
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Full A1.1 level — no signup required</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>1 Sentence X-Ray analysis per day</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Free level test</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>2 free AI speaking sessions</span>
              </li>
            </ul>

            <button
              onClick={() => !user && navigate('/signup')}
              disabled={!!user}
              className={`w-full py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                user ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              {user ? 'Current Plan' : 'Get Started Free'}
            </button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            className={`relative bg-gradient-to-b from-blue-500/10 to-gray-800/50 backdrop-blur rounded-2xl p-8 border-2 ${
              isOnPro ? 'border-blue-400 ring-1 ring-blue-400/30' : 'border-blue-500/50'
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Top badge — "Current" if subscribed, otherwise yearly/monthly badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              {isOnPro ? (
                <span className="bg-blue-500 text-white font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aktuell
                </span>
              ) : billingCycle === 'yearly' ? (
                /* EN: "Best Value" */
                <span className="bg-green-500 text-white font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Beliebteste Wahl
                </span>
              ) : (
                <span className="bg-blue-600 text-white font-bold px-4 py-1 rounded-full text-sm flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  MOST POPULAR
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4 mt-2">
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
              <>
                <p className="text-green-400 text-sm mb-1">
                  That&apos;s only &euro;6.67/month!
                </p>
                {/* EN: "Less than €0.22/day — cheaper than a single coffee" */}
                <p className="text-gray-400 text-xs mb-4">
                  Weniger als €0.22 pro Tag — günstiger als ein Kaffee
                </p>
              </>
            )}
            {billingCycle === 'monthly' && (
              <>
                {/* EN: "Less than €0.33/day — cheaper than a single coffee" */}
                <p className="text-gray-400 text-xs mb-4">
                  Weniger als €0.33 pro Tag — günstiger als ein Kaffee
                </p>
              </>
            )}

            <p className="text-gray-400 mb-6">
              Full access to everything
            </p>

            <ul className="space-y-3 mb-8">
              {/* EN: "Master all 64 grammar topics from beginner to upper-intermediate" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Master all 64 grammar topics from beginner to upper-intermediate</span>
              </li>
              {/* EN: "Learn with interactive exercises that explain WHY answers are correct" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Learn with interactive exercises that explain WHY answers are correct</span>
              </li>
              {/* EN: "Train your ear with native-speaker audio at your level" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Train your ear with native-speaker audio at your level</span>
              </li>
              {/* EN: "Reinforce learning with grammar podcasts and video explanations" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Reinforce learning with grammar podcasts and video explanations</span>
              </li>
              {/* EN: "Track your progress and see how far you've come" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Track your progress and see how far you&apos;ve come</span>
              </li>
              {/* EN: "Practice speaking German with AI — 30 conversations per month" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Mic className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Practice speaking German with AI — 30 conversations per month</span>
              </li>
              {/* EN: "Analyze any German sentence instantly — understand cases, roles, and word order" */}
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Analyze any German sentence instantly — understand cases, roles, and word order</span>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <Check className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
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
        </div>

        {/* Free Trial Info */}
        {!isOnPro && (
          <motion.div
            className="text-center mt-12 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p>Pro includes a <strong className="text-white">7-day free trial</strong></p>
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

        {/* Objection Handling — "Du fragst dich vielleicht..." / "You might be wondering..." */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Du fragst dich vielleicht&hellip;
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10">You might be wondering&hellip;</p>

          <div className="grid md:grid-cols-3 gap-4">
            {OBJECTIONS.map((item, i) => (
              <div
                key={i}
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6"
              >
                <p className="font-semibold text-white mb-1">{item.q_en}</p>
                <p className="text-xs text-gray-500 mb-4">{item.q_de}</p>
                <p className="text-gray-300 text-sm leading-relaxed">{item.a_en}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Häufige Fragen
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10">Common Questions</p>

          <div className="max-w-2xl mx-auto space-y-3">
            {FAQS.map((item, i) => (
              <FaqItem key={i} {...item} />
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PricingPage;
