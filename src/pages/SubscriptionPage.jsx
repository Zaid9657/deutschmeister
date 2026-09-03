import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Check, Clock, Shield, Zap, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';
import SEO from '../components/SEO';
import { openCheckout } from '../utils/openCheckout';
import { markCheckoutStarted, consumeCheckoutSuccess } from '../lib/funnelTracking';
import { PLANS, num } from '../data/pricing.js';
import { LEVEL_COUNT, READING_LESSON_COUNT } from '../data/marketing.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import Tilt from '../components/ui/Tilt.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';

const SubscriptionPage = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const {
    isInFreeTrial,
    getTrialDaysRemaining,
    hasActiveSubscription,
    hasProduct,
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

  // Safe end-date label: null / unparseable → null (caller hides the line),
  // never the literal string "Invalid Date".
  const validUntil = (() => {
    const raw = subscription?.subscription_end;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(isGerman ? 'de-DE' : 'en-US');
  })();

  // Stop polling once subscription is confirmed
  useEffect(() => {
    if (isSubscribed && verifying) {
      setVerifying(false);
      setVerifyMessage('');
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      // Same-tab checkout path: access flipping to active while we were
      // polling is the purchase signal (the overlay path reports via
      // Checkout.Success in LemonSqueezyProvider; the flag is consumed once).
      consumeCheckoutSuccess();
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
    markCheckoutStarted(planType, PLANS[planType]?.price);
    openCheckout(checkoutUrl);

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

  // One-time course (docs/revenue-plan-2026-08-31.md Lane 2). The card renders
  // only when the LS product exists (variantId set) or the user already owns
  // the course; access lands via the webhook, observed by the same poll.
  const course = LEMONSQUEEZY_CONFIG.courses.telc_b1_komplett;
  const ownsCourse = hasProduct('telc_b1_komplett');

  // Level courses (the product since 2026-09-03): one-time, lifetime access
  // to a CEFR band. Same render rule as the telc card — an unset variant
  // hides the card — and the same poll observes the webhook landing.
  const levelCourses = Object.values(LEMONSQUEEZY_CONFIG.levelCourses);
  const ownsBundle = hasProduct('course_alle');
  const visibleLevelCourses = levelCourses.filter((c) => c.variantId || hasProduct(c.key));

  const startPurchase = (productKey, variantId, price) => {
    const checkoutUrl = LEMONSQUEEZY_CONFIG.getCheckoutUrl(
      variantId,
      user?.email || '',
      user?.id || ''
    );
    markCheckoutStarted(productKey, price);
    openCheckout(checkoutUrl);

    setVerifying(true);
    setVerifyMessage('');
    let count = 0;
    pollRef.current = setInterval(async () => {
      count += 1;
      await refreshSubscription(); // reloads subscription AND purchases
      if (count >= 20) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setVerifying(false);
      }
    }, 3000);
  };
  const handleBuyCourse = () => startPurchase('telc_b1_komplett', course.variantId, course.price);

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
      name: isGerman ? PLANS.monthly.nameDe : PLANS.monthly.name,
      price: num(PLANS.monthly.price),
      period: isGerman ? '/Monat' : '/month',
      features: isGerman
        ? [
            `Zugang zu allen ${LEVEL_COUNT} Stufen (A1.1–B2.2)`,
            'Alle Grammatiklektionen mit Übungen',
            'Hörverständnisübungen',
            'Podcasts & Video-Inhalte',
            'Fortschrittsverfolgung',
            'Jederzeit kündbar',
          ]
        : [
            `Full access to all ${LEVEL_COUNT} levels (A1.1–B2.2)`,
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
      name: isGerman ? PLANS.yearly.nameDe : PLANS.yearly.name,
      price: num(PLANS.yearly.price),
      period: isGerman ? '/Jahr' : '/year',
      savings: isGerman
        ? `Spare ${PLANS.yearly.savingPercent}%`
        : `Save ${PLANS.yearly.savingPercent}%`,
      monthlyEquiv: num(PLANS.yearly.asMonthly),
      features: isGerman
        ? [
            'Alles im Monatsplan',
            `${PLANS.yearly.savingPercent}% günstiger als monatlich`,
            'Prioritäts-Support',
            'Frühzeitiger Zugang zu neuen Inhalten',
            'Fortschrittsverfolgung',
            'Jederzeit kündbar',
          ]
        : [
            'Everything in Monthly',
            `Save ${PLANS.yearly.savingPercent}% compared to monthly`,
            'Priority support',
            'Early access to new content',
            'Progress tracking',
            'Cancel anytime',
          ],
      highlight: true,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper pt-24 pb-12 px-4">
      <SEO title="Subscription" description="Manage your DeutschMeister subscription." path="/subscription" noindex />
      <Aurora />
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="hero-line w-16 h-16 mx-auto mb-4 rounded-clay bg-siegel shadow-raise-siegel flex items-center justify-center" style={{ '--d': '0ms' }}>
            <Crown className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <SectionHeading
            level={1}
            size="page"
            align="center"
            title="Pick up where you left off"
            lead="Your trial is over, but your progress stays. Choose a plan and keep learning without limits."
          />
        </div>

        {/* Payment verification */}
        {verifying && (
          <Card tone="wash" className="mb-8 p-4 animate-pop-in">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-siegel animate-spin flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-siegel-deep">
                  {isGerman ? 'Zahlung wird bestätigt...' : 'Verifying your payment...'}
                </p>
                <p className="text-sm text-siegel-deep">
                  {isGerman
                    ? 'Dies kann einige Sekunden dauern. Bitte schließen Sie diese Seite nicht.'
                    : 'This may take a few seconds. Please do not close this page.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Status Card — success = limette, attention = aprikose (playbook §1) */}
        {(inTrial || isSubscribed) && (
          <Card tone={isSubscribed ? 'limette' : 'aprikose'} className="mb-8 p-4 animate-pop-in">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <>
                  <Shield className="w-5 h-5 text-accent-limette-ink flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-accent-limette-ink">
                      {isGerman ? 'Aktives Abonnement' : 'Active Subscription'}
                    </p>
                    <p className="text-sm text-accent-limette-ink">
                      {subscription?.plan_type === 'yearly'
                        ? isGerman ? 'Jahresplan' : 'Yearly Plan'
                        : isGerman ? 'Monatsplan' : 'Monthly Plan'}
                      {validUntil && (
                        <>
                          {' — '}
                          {isGerman ? 'Gültig bis' : 'Valid until'}{' '}
                          {validUntil}
                        </>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-accent-aprikose-ink flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-accent-aprikose-ink">
                      {isGerman ? 'Kostenlose Testphase' : 'Free Trial'}
                    </p>
                    <p className="text-sm text-accent-aprikose-ink">
                      {daysLeft} {daysLeft === 1
                        ? isGerman ? 'Tag verbleibend' : 'day remaining'
                        : isGerman ? 'Tage verbleibend' : 'days remaining'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Expired notice */}
        {!inTrial && !isSubscribed && (
          <Card tone="himbeer" className="mb-8 p-4 animate-pop-in">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-accent-himbeer-ink flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-accent-himbeer-ink">
                  {isGerman ? 'Testphase abgelaufen' : 'Trial Expired'}
                </p>
                <p className="text-sm text-accent-himbeer-ink">
                  {isGerman
                    ? 'Abonniere jetzt, um weiter auf alle Inhalte zuzugreifen.'
                    : 'Subscribe now to continue accessing all content.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Already paid? Verify button */}
        {!isSubscribed && !verifying && (
          <div className="mb-8 text-center">
            <button
              type="button"
              onClick={handleManualVerify}
              className="inline-flex items-center gap-2 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              {isGerman ? 'Bereits bezahlt? Abonnement überprüfen' : 'Already paid? Verify my subscription'}
            </button>
            {verifyMessage && (
              <p className="mt-2 inline-flex items-center justify-center gap-2 rounded-clay bg-accent-himbeer-wash px-3 py-2 text-sm font-semibold text-accent-himbeer-ink">
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {verifyMessage}
              </p>
            )}
          </div>
        )}

        {/* Plan Cards — the grid a learner chooses from, so they tilt. The
            featured plan rests on a siegel edge and carries the page's one
            gold marker (design-tokens.js rule 2). */}
        <div className="grid md:grid-cols-2 gap-6 mb-12 pt-3">
          {plans.map((plan, index) => (
            <Reveal key={plan.id} delay={90 * index} className="h-full">
              <Tilt className="h-full">
                <Card
                  raised
                  edge={plan.highlight ? 'siegel' : 'paper'}
                  className="relative flex h-full flex-col p-6"
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2" data-atropos-offset="6">
                      <span className="inline-flex items-center rounded-pill bg-gold px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-ink shadow-raise">
                        {isGerman ? 'Bester Wert' : 'Best Value'}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-[1.125rem] font-bold text-ink mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1" data-atropos-offset="4">
                      <span className="font-display text-[2.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">€{plan.price}</span>
                      <span className="text-graphite">{plan.period}</span>
                    </div>
                    {plan.savings && (
                      <Chip tone="limette" className="mt-3">
                        {plan.savings}
                      </Chip>
                    )}
                    {plan.monthlyEquiv && (
                      <p className="mt-2 font-data text-[0.8125rem] text-graphite">
                        {isGerman ? `Nur €${plan.monthlyEquiv}/Monat` : `Only €${plan.monthlyEquiv}/month`}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-siegel flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm text-ink">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isSubscribed}
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    shimmer={plan.highlight && !isSubscribed}
                    size="lg"
                    className="mt-auto w-full"
                  >
                    {isSubscribed
                      ? isGerman ? 'Bereits abonniert' : 'Already Subscribed'
                      : isGerman ? 'Jetzt abonnieren' : 'Subscribe Now'}
                  </Button>
                </Card>
              </Tilt>
            </Reveal>
          ))}
        </div>

        {/* Trial info */}
        <Reveal as="p" className="text-center text-sm text-graphite mb-8">
          {isGerman
            ? 'Alle Pläne beinhalten eine 7-tägige kostenlose Testphase. Jederzeit kündbar.'
            : 'All plans include a 7-day free trial. Cancel anytime.'}
        </Reveal>

        {/* Level courses — buy a band once, keep it. The bundle is the
            featured card. Rendered only when the LS products exist (variant
            configured) or the buyer already owns one. */}
        {visibleLevelCourses.length > 0 && (
          <Reveal className="mb-12">
            <SectionHeading
              level={2}
              align="center"
              title={isGerman ? 'Oder: eine Stufe kaufen und behalten' : 'Or: buy a level and keep it'}
              lead={isGerman
                ? `Einmal zahlen, für immer lernen — beide Teilstufen, plus ${course.proMonths} Monate Pro (KI-Sprechen, Schreibkorrektur, Satz-Röntgen) inklusive.`
                : `Pay once, learn forever — both sub-levels, plus ${course.proMonths} months of Pro (AI speaking, writing feedback, Sentence X-Ray) included.`}
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {visibleLevelCourses.map((c) => {
                const isBundle = c.key === 'course_alle';
                const owned = hasProduct(c.key) || (ownsBundle && !isBundle);
                const firstLevel = c.levels[0];
                return (
                  <Card
                    key={c.key}
                    raised
                    edge={isBundle ? 'siegel' : 'paper'}
                    className={`relative flex flex-col p-5 ${isBundle ? 'sm:col-span-2 lg:col-span-1' : ''}`}
                  >
                    {isBundle && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center rounded-pill bg-gold px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-ink shadow-raise">
                          {isGerman ? `Spare ${c.savingPercent}%` : `Save ${c.savingPercent}%`}
                        </span>
                      </div>
                    )}
                    <Chip tone="label" className="mb-2 self-start">{c.code}</Chip>
                    <h3 className="text-[1.0625rem] font-bold leading-tight text-ink">{isGerman ? c.nameDe : c.name}</h3>
                    <p className="mt-2 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                      €{num(c.price)}
                      <span className="ml-1 font-body text-xs font-normal tracking-normal text-graphite">
                        {isGerman ? 'einmalig' : 'one time'}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-graphite">
                      {isBundle
                        ? (isGerman ? `Alle ${c.levels.length} Stufen, A1.1–B2.2` : `All ${c.levels.length} levels, A1.1–B2.2`)
                        : (isGerman ? `${c.levels[0].toUpperCase()} + ${c.levels[1].toUpperCase()} · lebenslang` : `${c.levels[0].toUpperCase()} + ${c.levels[1].toUpperCase()} · lifetime`)}
                    </p>
                    {owned ? (
                      <Button to={`/level/${firstLevel}`} variant="secondary" size="md" className="mt-4 w-full">
                        {isGerman ? 'Gekauft · öffnen →' : 'Owned · open →'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startPurchase(c.key, c.variantId, c.price)}
                        variant={isBundle ? 'primary' : 'secondary'}
                        shimmer={isBundle}
                        size="md"
                        className="mt-4 w-full"
                      >
                        {isGerman ? 'Kaufen' : 'Buy'}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </Reveal>
        )}

        {/* One-time course — rendered only when the buyer owns it (link to the
            course area) or the LS product exists (variantId configured), so an
            unset env var can never open a dead checkout. */}
        {(ownsCourse || course.variantId) && (
          <Reveal className="mb-12 max-w-2xl mx-auto">
            <Card raised className="p-6">
              <Chip tone="label" className="mb-3">
                {isGerman ? 'Einmalkauf · kein Abo' : 'One-time purchase · not a subscription'}
              </Chip>
              <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink">{course.name}</h2>
              {ownsCourse ? (
                <>
                  <p className="text-sm text-graphite mt-2">
                    {isGerman
                      ? 'Du hast den Kurs. Dein 4-Wochen-Plan wartet.'
                      : 'You own this course. Your 4-week plan is waiting.'}
                  </p>
                  <Button to="/telc-b1-kurs" size="lg" className="mt-4">
                    {isGerman ? 'Zum Kurs →' : 'Open the course →'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-graphite mt-2">
                    {isGerman
                      ? `Der feste 4-Wochen-Plan zur telc B1-Prüfung — mit ${course.proMonths} Monaten Pro-Zugang inklusive.`
                      : `The fixed 4-week plan for the telc B1 exam — with ${course.proMonths} months of Pro access included.`}
                  </p>
                  <p className="mt-3 font-display text-[2rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                    €{num(course.price)}
                    <span className="ml-1 text-sm font-normal font-body tracking-normal text-graphite">
                      {isGerman ? 'einmalig' : 'one time'}
                    </span>
                  </p>
                  <Button onClick={handleBuyCourse} variant="secondary" size="lg" className="mt-4 w-full sm:w-auto">
                    {isGerman ? 'Kurs kaufen' : 'Buy the course'}
                  </Button>
                  <p className="mt-3 text-xs">
                    <a href="/telc-b1-komplettvorbereitung/" className="font-bold text-siegel transition-colors hover:text-siegel-deep">
                      {isGerman ? 'Was genau drin ist →' : 'See what exactly is inside →'}
                    </a>
                  </p>
                </>
              )}
            </Card>
          </Reveal>
        )}

        {/* Features grid — reference cards, flat */}
        <div className="text-center">
          <Reveal as="h2" className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-6">
            {isGerman ? 'Was du bekommst' : 'What You Get'}
          </Reveal>
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
                // Was a hardcoded "52+" against a measured 66 (2026-08-24 audit).
                desc: isGerman ? `${READING_LESSON_COUNT} Lesetexte` : `${READING_LESSON_COUNT} reading texts`,
              },
              {
                icon: '🗣️',
                title: isGerman ? 'KI-Sprechen' : 'AI Speaking',
                desc: isGerman ? 'Konversation üben' : 'Practice conversation',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={90 * i}>
                <Card className="p-4 h-full">
                  <div className="text-2xl mb-2" aria-hidden="true">{item.icon}</div>
                  <h3 className="font-bold text-ink">{item.title}</h3>
                  <p className="text-sm text-graphite">{item.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
