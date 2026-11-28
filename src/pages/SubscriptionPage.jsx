import { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Clock, Shield, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy';
import SEO from '../components/SEO';
import { openCheckout } from '../utils/openCheckout';
import { clearBuyIntent } from '../lib/buyIntent';
import { subscriptionPortalAction } from '../lib/billingPortal.js';
import { blockedLevelFrom, checkoutEntitlementConfirmed, hasFailedPayment, hasRecurringBilling, ownsCheckoutProduct } from '../lib/checkoutAccess.js';
import { courseHomeFor } from '../lib/courseEntry.js';
import { freeLektionen } from '../config/freeTier.js';
import TrialReturnCard from '../components/TrialReturnCard.jsx';
import { planStatusCopy } from '../lib/planStatus.js';
import { subscriptionHeadingCopy } from '../lib/subscriptionHeading.js';
import { markCheckoutStarted, consumeCheckoutSuccess } from '../lib/funnelTracking';
import { num, productKeyForLevel, isProductOnSale, currentPrice, isLaunchActive, PRICE_TAX_NOTE, PRICE_TAX_NOTE_DE } from '../data/pricing.js';
import { LEVEL_COUNT, READING_LESSON_COUNT } from '../data/marketing.js';
import CoursePrice, { usePriceNow } from '../components/CoursePrice.jsx';
import Button from '../components/ui/Button.jsx';
import CouponField from '../components/CouponField.jsx';
import ReportProblemLink from '../components/ReportProblemLink.jsx';
import Card from '../components/ui/Card.jsx';
import Chip from '../components/ui/Chip.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';

// Where an owned level opens: its guided course when it has one, else the
// level page. The rule of the success page and the dashboard strip; "Owned ·
// open" sent course buyers to the /level topic hub instead (ACC-14).
export const ownedLevelHref = (level, hasLevelAccess) => {
  const home = courseHomeFor({ level, hasLevelAccess });
  return home === `/course/${level}` ? home : `/level/${level}`;
};

const SubscriptionPage = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const {
    isInFreeTrial,
    getTrialDaysRemaining,
    hasActiveSubscription,
    hasProduct,
    hasLevelAccess,
    hasFullCourse,
    purchases,
    subscription,
    refreshSubscription,
    verifySubscription,
    billingVerified,
    loading: subLoading,
  } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const autoBuyRef = useRef(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [reloading, setReloading] = useState(false);
  const pollRef = useRef(null);
  const isGerman = i18n.language === 'de';
  const priceNow = usePriceNow();

  const inTrial = isInFreeTrial();
  const daysLeft = getTrialDaysRemaining();
  const isSubscribed = hasActiveSubscription();
  const recurringBilling = hasRecurringBilling(subscription);
  // Non-null whenever recurringBilling is true, a legacy course row with a
  // retained subscription id included (tests/legacy-course-billing.test.mjs);
  // still read with ?. so a plan button can never throw.
  const billingAction = subscriptionPortalAction(recurringBilling, subscription, isGerman);
  // A failed renewal: a new card in the portal, never "Trial expired" (ACC-04).
  const paymentFailed = billingVerified && hasFailedPayment(subscription);
  // Card, invoices, cancelling: the Lemon Squeezy portal, for a live LS
  // subscription only (lib/billingPortal.js, tests/subscription-portal-link.test.mjs).
  const portal = subscriptionPortalAction(isSubscribed, subscription, isGerman);
  // What the status card calls the row: a course row is AI Practice included with the
  // course, not a monthly plan (lib/planStatus.js, tests/plan-status.test.mjs).
  const planStatus = planStatusCopy(subscription, isGerman);

  // Safe end-date label: null / unparseable → null (caller hides the line),
  // never the literal string "Invalid Date".
  const validUntil = (() => {
    const raw = subscription?.subscription_end;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(isGerman ? 'de-DE' : 'en-US');
  })();

  // AI Practice may already be active when a course is bought. Wait for the product
  // being purchased, rather than mistaking existing AI Practice for a new payment.
  useEffect(() => {
    if (verifying && checkoutEntitlementConfirmed(pendingProduct, { isSubscribed, purchases })) {
      setVerifying(false);
      setPendingProduct(null);
      setVerifyMessage('');
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      // Same-tab checkout path: access flipping to active while we were
      // polling is the purchase signal. The overlay opens the success page,
      // which waits for the same entitlement; the flag is consumed once.
      consumeCheckoutSuccess();
    }
  }, [isSubscribed, purchases, pendingProduct, verifying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // A validated coupon is bound to the selected product; null = none.
  const [coupon, setCoupon] = useState(null);
  const [couponProduct, setCouponProduct] = useState('course_a1_1');

  // One-time course (docs/revenue-plan-2026-08-31.md Lane 2). The card renders
  // only when the LS product exists (variantId set) or the user already owns
  // the course; access lands via the webhook, observed by the same poll.
  const course = LEMONSQUEEZY_CONFIG.courses.telc_b1_komplett;
  const ownsCourse = hasProduct('telc_b1_komplett');

  // Level courses (the product since 2026-09-03): one-time, lifetime access
  // to a CEFR band. Same render rule as the telc card — an unset variant
  // hides the card — and the same poll observes the webhook landing.
  const levelCourses = Object.values(LEMONSQUEEZY_CONFIG.levelCourses);
  // A coming-soon course is listed (priced, no checkout) so the ladder reads
  // complete; a live course needs its checkout id or an existing purchase.
  const visibleLevelCourses = levelCourses.filter((c) => c.variantId || c.comingSoon || hasProduct(c.key));
  // The H1 lead offers a level only when a card below shows its Buy button: a
  // live course (checkout id, not coming soon) the learner does not own yet,
  // the same tests the card applies (lib/subscriptionHeading.js).
  const canBuyLevel = levelCourses.some(
    (c) => c.variantId && !c.comingSoon && !ownsCheckoutProduct(c.key, purchases)
  );
  const heading = subscriptionHeadingCopy({ isSubscribed, inTrial, daysLeft, canBuyLevel, paymentFailed }, isGerman);

  // The level a guard just refused (state.from): its course leads the offers
  // when it is on sale and not owned yet (ACC-13). Copy and order only.
  const blockedLevel = blockedLevelFrom(location.state?.from?.pathname);
  const blockedCourse = blockedLevel ? LEMONSQUEEZY_CONFIG.levelCourses[productKeyForLevel(blockedLevel)] : null;
  const leadCourse = blockedCourse && blockedCourse.variantId && !blockedCourse.comingSoon && !ownsCheckoutProduct(blockedCourse.key, purchases)
    ? blockedCourse
    : null;
  const orderedLevelCourses = leadCourse
    ? [leadCourse, ...visibleLevelCourses.filter((c) => c.key !== leadCourse.key)]
    : visibleLevelCourses;
  // At the paid rest of a course, explain which first Lektion stays free
  // and that buying this specific course opens the remaining path.
  const gateFree = blockedLevel ? freeLektionen(blockedLevel) : 0;

  const startPurchase = (productKey, variantId, price) => {
    if (!variantId || !isProductOnSale(productKey) || subLoading || verifying || !billingVerified || ownsCheckoutProduct(productKey, purchases)) return;
    const level = LEMONSQUEEZY_CONFIG.levelCourses[productKey]?.levels[0];
    if (level) price = currentPrice(level);
    const checkoutUrl = LEMONSQUEEZY_CONFIG.getCheckoutUrl(
      variantId,
      user?.email || '',
      user?.id || '',
      coupon?.productKey === productKey ? coupon : null,
      productKey
    );
    markCheckoutStarted(productKey, price);
    openCheckout(checkoutUrl);

    setPendingProduct(productKey);
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

  // Resume a checkout that signup interrupted: /pricing/ stored the product
  // key before sending the visitor to /signup, and every post-auth redirect
  // lands here with ?buy=<key>. Opens exactly once, after entitlements have
  // loaded (so an already-owned product never re-opens its checkout), then
  // clears both the query and the stored intent. It waits for verified
  // billing: a failed read keeps the intent until a retry reads it (ACC-02).
  useEffect(() => {
    const key = searchParams.get('buy');
    if (!key || autoBuyRef.current || subLoading || !billingVerified || !user) return;
    autoBuyRef.current = true;
    clearBuyIntent();
    setSearchParams({}, { replace: true });
    if (!isProductOnSale(key)) return;
    const target = key === 'telc_b1_komplett' ? course : LEMONSQUEEZY_CONFIG.levelCourses[key] || LEMONSQUEEZY_CONFIG.offerProducts[key];
    if (target?.comingSoon || ownsCheckoutProduct(key, purchases)) return;
    if (target?.variantId && !hasProduct(key)) startPurchase(key, target.variantId, target.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, subLoading, billingVerified, user]);

  // The retry on the "could not load" notice (ACC-02).
  const reloadBilling = async () => {
    setReloading(true);
    try {
      await refreshSubscription();
    } finally {
      setReloading(false);
    }
  };

  // Manual "Verify my subscription" button handler
  const handleManualVerify = async () => {
    setPendingProduct(null);
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper pt-24 pb-12 px-4 font-body">
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
            title={heading.title}
            lead={heading.lead}
          />
          {gateFree > 0 && !hasFullCourse(blockedLevel) && (
            <p data-lektion-gate className="mt-4 text-[0.9375rem] font-bold text-ink">
              {isGerman
                ? `Lektion ${gateFree} von ${blockedLevel.toUpperCase()} ist kostenlos. Mit dem Kauf dieses Kurses öffnen Sie: alle Lektionen, die Checkpoints und den Abschlusstest.`
                : `Lektion ${gateFree} of ${blockedLevel.toUpperCase()} is free. Buying this course opens: every Lektion, the checkpoints and the final test.`}
            </p>
          )}
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
                      {planStatus.title}
                    </p>
                    <p className="text-sm text-accent-limette-ink">
                      {planStatus.plan}
                      {validUntil && (
                        <>
                          {' — '}
                          {isGerman ? 'Gültig bis' : 'Valid until'}{' '}
                          {validUntil}
                        </>
                      )}
                    </p>
                    {portal && (
                      <>
                        <p className="mt-2 text-sm">
                          <a href={portal.href} className="font-bold text-siegel transition-colors hover:text-siegel-deep">
                            {portal.label} →
                          </a>
                        </p>
                        <p className="mt-1 text-xs text-accent-limette-ink">{portal.hint}</p>
                      </>
                    )}
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

        {/* Billing could not be read: say so and offer a retry. Nothing on the
            page sells until it is read (ACC-02, tests/checkout-access.test.mjs). */}
        {!subLoading && !billingVerified && (
          <Card tone="aprikose" className="mb-8 p-4 animate-pop-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-accent-aprikose-ink flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-accent-aprikose-ink" role="status">
                  {isGerman
                    ? 'Ihr Abo-Status konnte gerade nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.'
                    : 'Your plan status could not be loaded just now. Please try again in a moment.'}
                </p>
                <button
                  type="button"
                  onClick={reloadBilling}
                  disabled={reloading}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${reloading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {isGerman ? 'Erneut laden' : 'Try again'}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* A failed renewal: the fix is a new card in the portal, not a new
            plan, and certainly not "Trial expired" (ACC-04). */}
        {!inTrial && !isSubscribed && paymentFailed && (
          <Card tone="himbeer" className="mb-8 p-4 animate-pop-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-accent-himbeer-ink flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-accent-himbeer-ink">
                  {isGerman ? 'Ihre letzte Zahlung ist nicht durchgegangen' : 'Your last payment didn’t go through'}
                </p>
                <p className="text-sm text-accent-himbeer-ink">
                  {isGerman
                    ? 'Aktualisieren Sie Ihre Karte, um weiterzulernen. Ihr Fortschritt bleibt erhalten.'
                    : 'Update your card to keep learning. Your progress stays.'}
                </p>
                {billingAction && (
                  <>
                    <p className="mt-2 text-sm">
                      <a href={billingAction.href} className="font-bold text-siegel transition-colors hover:text-siegel-deep">
                        {billingAction.label} →
                      </a>
                    </p>
                    <p className="mt-1 text-xs text-accent-himbeer-ink">{billingAction.hint}</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        {!inTrial && !isSubscribed && billingVerified && !paymentFailed && (
          <TrialReturnCard key={user?.id} />
        )}

        <div id="return-offers" />

        {/* Already paid? Verify button — not for a failed renewal: that row is
            already found, and its fix is the card above. */}
        {!isSubscribed && !verifying && !paymentFailed && (
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
              <>
                <p className="mt-2 inline-flex items-center justify-center gap-2 rounded-clay bg-accent-himbeer-wash px-3 py-2 text-sm font-semibold text-accent-himbeer-ink">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {verifyMessage}
                </p>
                {/* Paid but no access is exactly when a learner needs a human. */}
                <div className="mt-2">
                  <ReportProblemLink topic="payment" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Level courses — own a level (v4 "Die Linie": the product comes first,
            AI Practice second). Rendered only when the LS products exist (variant
            configured) or the buyer already owns one. */}
        <section className="mb-12" aria-label="Course and exam bundles">
          <p className="mb-3 text-[0.8125rem] text-graphite" data-price-tax-note>{isGerman ? PRICE_TAX_NOTE_DE : PRICE_TAX_NOTE}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.values(LEMONSQUEEZY_CONFIG.offerProducts).filter((p) => !blockedLevel && (p.variantId || ownsCheckoutProduct(p.key, purchases))).map((p) => <Card key={p.key} className="p-5" edge="paper">
              <h2 className="font-display text-xl">{p.name}</h2>
              <p className="my-3 text-xl">€{num(p.price)} · pay once</p>
              <p>A1 exam plan, short practice test, writing and speaking tasks.</p>
              <p className="my-3">{p.proMonths} months of AI Practice included. Nothing renews automatically.</p>
              {ownsCheckoutProduct(p.key, purchases) ? <Button to={p.home} variant="secondary">Owned · open →</Button>
                : p.variantId ? <Button onClick={() => startPurchase(p.key, p.variantId, p.price)} disabled={verifying || !billingVerified}>Buy {p.name}</Button>
                : <p className="text-graphite">Not on sale yet</p>}
            </Card>)}
          </div>
        </section>
        {visibleLevelCourses.length > 0 && (
          <Reveal className="mb-12">
            <SectionHeading
              level={2}
              align="center"
              title={isGerman ? 'Eine Stufe besitzen: einmal zahlen, behalten' : 'Own a level: pay once, keep it'}
              lead={isGerman
                ? `Eine Teilstufe für immer, plus ${course.proMonths} Monate AI Practice (KI-Sprechen, Schreibkorrektur, Satz-Röntgen) inklusive. Danach bleibt die Stufe Ihre, und nichts verlängert sich.`
                : `One sub-level for good, plus ${course.proMonths} months of AI Practice (AI speaking, writing feedback, Sentence X-Ray) included. After that the level stays yours, and nothing renews.`}
            />
            {/* The level the learner was just refused leads, with its card first. */}
            {leadCourse && (
              <p className="mt-6 text-center text-[0.9375rem] font-bold text-ink">
                {isGerman
                  ? `Sie wollten gerade ${leadCourse.code} öffnen. Kaufen Sie genau diesen Kurs einmalig.`
                  : `You were about to open ${leadCourse.code}. Buy this course once.`}
                {' '}<CoursePrice level={leadCourse.levels[0]} language={i18n.language} />
              </p>
            )}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {orderedLevelCourses.map((c) => {
                const firstLevel = c.levels[0];
                const owned = ownsCheckoutProduct(c.key, purchases);
                return (
                  <Card
                    key={c.key}
                    raised
                    edge={c.key === leadCourse?.key ? 'siegel' : 'paper'}
                    className={`relative flex flex-col p-5 ${c.comingSoon ? 'opacity-80' : ''}`}
                  >
                    {c.comingSoon && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center rounded-pill bg-paper-sunk px-3 py-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite shadow-raise">
                          {isGerman ? 'Bald verfügbar' : 'Coming next'}
                        </span>
                      </div>
                    )}
                    <Chip tone="label" className="mb-2 self-start">{c.code}</Chip>
                    <h3 className="text-[1.0625rem] font-bold leading-tight text-ink">{isGerman ? c.nameDe : c.name}</h3>
                    {!c.comingSoon && <p className="mt-2 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.02em] text-ink">
                      <CoursePrice level={firstLevel} language={i18n.language} />
                      <span className="ml-1 font-body text-xs font-normal tracking-normal text-graphite">
                        {isGerman ? 'einmalig' : 'one time'}
                      </span>
                    </p>}
                    {!c.comingSoon && <p className="mt-2 text-xs text-graphite">
                      {isGerman ? `${c.code} · lebenslang` : `${c.code} · lifetime`}
                    </p>}
                    {owned ? (
                      <Button to={ownedLevelHref(firstLevel, hasLevelAccess)} variant="secondary" size="md" className="mt-4 w-full">
                        {isGerman ? 'Gekauft · öffnen →' : 'Owned · open →'}
                      </Button>
                    ) : c.comingSoon || !c.variantId ? (
                      <Button variant="secondary" size="md" className="mt-4 w-full" disabled aria-disabled="true">
                        {isGerman ? 'Bald verfügbar' : 'Coming next'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startPurchase(c.key, c.variantId, c.price)}
                        disabled={verifying || !billingVerified}
                        variant="secondary"
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

        {recurringBilling && billingAction?.href && <p className="mb-8 text-center"><a href={billingAction.href}>{billingAction?.label}</a></p>}

        {/* One-time course — rendered only when the buyer owns it (link to the
            course area) or the LS product exists (variantId configured), so an
            unset env var can never open a dead checkout. */}
        {ownsCourse && (
          <Reveal className="mb-12 max-w-2xl mx-auto">
            <Card raised className="p-6">
              <Chip tone="label" className="mb-3">
                {isGerman ? 'Einmalkauf · kein Abo' : 'One-time purchase · not a subscription'}
              </Chip>
              <h2 className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink">{course.name}</h2>
              <p className="mt-2">You own this course.</p><Button to="/telc-b1-kurs">Open the course →</Button>
            </Card>
          </Reveal>
        )}

        {/* A code is for the few who have one: behind a disclosure, below the
            offers (ACC-13). The server validates it against the selected offer. */}
        {user && !isLaunchActive(priceNow) ? (
          <details className="mb-12 text-center">
            <summary className="cursor-pointer text-sm font-bold text-siegel transition-colors hover:text-siegel-deep">
              {isGerman ? 'Haben Sie einen Gutscheincode?' : 'Have a code?'}
            </summary>
            <div className="mt-4 flex flex-col items-center gap-3">
              <label className="flex flex-col gap-1 text-sm text-graphite">
                {isGerman ? 'Gutschein für' : 'Coupon for'}
                <select value={couponProduct} onChange={(event) => setCouponProduct(event.target.value)} className="rounded-clay border border-rule bg-white px-3 py-2 text-ink">

                  {orderedLevelCourses.filter((c) => c.variantId && !c.comingSoon && !ownsCheckoutProduct(c.key, purchases)).map((c) => (
                    <option key={c.key} value={c.key}>{isGerman ? c.nameDe : c.name}</option>
                  ))}
                  {course.variantId && !ownsCourse && <option value="telc_b1_komplett">{course.name}</option>}
                </select>
              </label>
              <CouponField productKey={couponProduct} onApplied={setCoupon} isGerman={isGerman} />
            </div>
          </details>
        ) : null}

        {/* Features grid — reference cards, flat */}
        <div className="text-center">
          <Reveal as="h2" className="font-display text-[1.5625rem] font-semibold leading-tight tracking-[-0.018em] text-ink mb-6">
            {isGerman ? 'Was Sie bekommen' : 'What You Get'}
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: '📚',
                title: isGerman ? `${LEVEL_COUNT} Stufen` : `${LEVEL_COUNT} Levels`,
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
