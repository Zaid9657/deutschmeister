import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import SEO from '../components/SEO';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import ReportProblemLink from '../components/ReportProblemLink.jsx';
import confettiBurst from '../lib/confetti.js';
import { consumeCheckoutSuccess } from '../lib/funnelTracking';
import { courseHomeFor } from '../lib/courseEntry.js';
import { ALL_LEVELS, COURSE_PRO_MONTHS, courseForProduct } from '../data/pricing.js';

// "Your ticket is valid" — the confirmation after a checkout (v4 "Die Linie",
// docs/redesign-2026-10/). The Lemon Squeezy redirect and the overlay's
// Checkout.Success both land here. It answers the three questions a new buyer
// has, in order: did it work, what do I have now (and until when), and where
// do I start. It never celebrates before the webhook has recorded the purchase.
//
// The Pro window's end is the purchase row's `access_until` (written by
// netlify/functions/lemonsqueezy-webhook.mjs handleCourseOrder). NULL there
// means the buyer already had a live paid subscription, so no window was
// added — say that, never a date that does not exist.

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return null;
  }
};

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription, hasActiveSubscription, hasLevelAccess, purchases } = useSubscription();
  const [polling, setPolling] = useState(true);
  const celebratedRef = useRef(false);

  // A one-time course purchase lands here too. The most recent purchase, if it
  // is minutes old, is what was just bought — so the page shows that ticket
  // rather than a subscription the buyer may not have. An older purchase on
  // the account is not "just bought" and falls through to the Pro copy.
  const RECENT_MS = 30 * 60 * 1000;
  const latestPurchase = [...purchases].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )[0];
  const justBought =
    latestPurchase && Date.now() - new Date(latestPurchase.created_at).getTime() < RECENT_MS
      ? latestPurchase
      : null;
  const courseBought = justBought ? courseForProduct(justBought.product_key) : null;
  const telcBought = justBought?.product_key === 'telc_b1_komplett';
  const firstLevel = courseBought ? courseBought.levels[0] : null;
  const proUntil = justBought?.access_until ? formatDate(justBought.access_until) : null;

  // Derive verification from context state on every render (a [] effect kept
  // reading the mount-time `subscription = null` and every payer fell through
  // to the "may take a moment" branch).
  const verified = hasActiveSubscription() || Boolean(justBought);

  // Where the first lesson is: the level's guided course when it has one
  // (A1.1–A2.2), else its level page. courseHomeFor falls back to the free
  // course, so a missing entitlement can never send a buyer to a lock.
  const courseHome = firstLevel ? courseHomeFor({ level: firstLevel, hasLevelAccess }) : null;
  const startHref = courseBought
    ? (courseHome === `/course/${firstLevel}` ? courseHome : `/level/${firstLevel}`)
    : telcBought ? '/telc-b1-kurs' : '/dashboard';

  useEffect(() => {
    if (verified) setPolling(false);
  }, [verified]);

  // The earned moment (playbook §0: pass = celebrate). Fires exactly once, the
  // first time the purchase is confirmed. The not-yet-activated branch stays
  // calm: no confetti until the win is real.
  useEffect(() => {
    if (!verified || celebratedRef.current) return;
    celebratedRef.current = true;
    // A checkout opened on a static page (/pricing/, /courses/) armed the
    // dm_checkout_pending flag there; this is the first place the app sees it
    // finish. Consumed once, so a reload never counts a second completion.
    consumeCheckoutSuccess();
    confettiBurst();
  }, [verified]);

  useEffect(() => {
    let cancelled = false;

    const verifySubscription = async () => {
      // Poll while the Lemon Squeezy webhook lands. `subscription`/`purchases`
      // updating flips `verified` above, which ends the polling state.
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
  const seoTitle = courseBought || telcBought ? 'Your ticket is valid' : verified ? 'Welcome to Pro' : 'Confirming your payment';
  const stopIndex = firstLevel ? ALL_LEVELS.indexOf(firstLevel) : -1;

  return (
    <div className="min-h-screen bg-nacht px-4 pb-16 pt-24 font-body text-nacht-text sm:pb-20 sm:pt-28" data-ground="nacht">
      <SEO title={seoTitle} description="Your DeutschMeister purchase." path="/subscription/success" noindex />
      <div className="mx-auto w-full max-w-xl">
        {loading ? (
          <Card raised className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-14 w-14 animate-spin text-ink" aria-hidden="true" />
            <h1 className="font-sign text-[1.75rem] font-extrabold leading-tight text-ink [font-stretch:82%]">
              Confirming your payment…
            </h1>
            <p className="mt-2 text-graphite">This usually takes a few seconds. Please keep this page open.</p>
          </Card>
        ) : verified ? (
          <>
            <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-linie">Payment confirmed</p>
            <h1 className="mt-3 font-sign text-[clamp(2.25rem,8vw,3.5rem)] font-extrabold leading-[0.95] [font-stretch:78%]">
              {courseBought || telcBought ? 'Your ticket is valid.' : 'Welcome to Pro.'}
            </h1>

            {/* The ticket: what was bought, what it carries, until when. */}
            <div className="mt-8 grid overflow-hidden rounded-[1.5rem] border border-ink bg-white text-ink sm:grid-cols-[11rem_1fr]">
              <div className="flex flex-col justify-between gap-4 bg-linie p-6 text-linie-ink sm:border-r-[3px] sm:border-dashed sm:border-linie-ink/30">
                <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em]">
                  {courseBought || telcBought ? 'Einzelfahrschein' : 'Pro'}
                </p>
                <p className="font-sign text-[2.75rem] font-extrabold leading-none [font-stretch:75%]">
                  {courseBought ? courseBought.code : telcBought ? 'telc B1' : 'Pro'}
                </p>
                {stopIndex >= 0 && (
                  <p className="font-data text-[0.75rem] font-bold">Stop {stopIndex + 1} of {ALL_LEVELS.length}</p>
                )}
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-[0.9375rem] leading-relaxed">
                  {courseBought && (
                    <li>
                      <strong>{courseBought.levels.map((l) => l.toUpperCase()).join(' and ')}, yours to keep</strong>
                      <span className="block text-graphite">The guided plan, exercises, reading, listening and vocabulary — no expiry, nothing renews.</span>
                    </li>
                  )}
                  {telcBought && (
                    <li>
                      <strong>Your 4-week telc B1 plan</strong>
                      <span className="block text-graphite">One task a day, in the order that leads to the exam. The course area stays yours.</span>
                    </li>
                  )}
                  {(courseBought || telcBought) && (
                    <li>
                      <strong>{COURSE_PRO_MONTHS} months of Pro on board</strong>
                      <span className="block text-graphite">
                        {proUntil
                          ? `AI speaking, writing feedback and every level are open until ${proUntil}. After that the AI tools return to the free allowance — you are never charged again.`
                          : 'Your Pro subscription already covers the AI tools, so nothing was added on top of it.'}
                      </span>
                    </li>
                  )}
                  {!courseBought && !telcBought && (
                    <li>
                      <strong>Every level, and the full AI allowance</strong>
                      <span className="block text-graphite">Your subscription is active. Cancel anytime in the billing portal.</span>
                    </li>
                  )}
                  <li>
                    <strong>A receipt by email</strong>
                    <span className="block text-graphite">Lemon Squeezy, our payment provider, sends the invoice to the address you paid with.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* The one `celebrate` moment is the confetti; the door is the line's key. */}
            <div className="mt-8 flex flex-col items-start gap-4">
              <Button variant="linie" size="lg" to={startHref}>
                {courseBought ? `Start ${firstLevel.toUpperCase()} — day 1` : telcBought ? 'Open the plan' : 'Start learning'}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
              <p className="text-[0.875rem] text-nacht-muted">Your place is saved after every answer, on any device you sign in on.</p>
              {/* On nacht the link takes the line's colour (siegel teal is ~3:1 here). */}
              <span className="[&_a]:!text-linie [&_a:hover]:!text-linie-deep">
                <ReportProblemLink topic="payment" />
              </span>
            </div>
          </>
        ) : (
          <Card raised className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent-aprikose-wash">
              <AlertCircle className="h-12 w-12 text-accent-aprikose-ink" aria-hidden="true" />
            </div>

            <h1 className="mb-4 font-sign text-[1.75rem] font-extrabold leading-tight text-ink [font-stretch:82%]">
              Payment received
            </h1>

            <p className="mb-4 text-[0.9375rem] leading-relaxed text-graphite sm:text-base">
              Your payment went through. Activation is taking longer than usual — this
              is normally a short delay on the payment provider's side, not a problem
              with your order.
            </p>
            <p className="mb-6 text-sm text-graphite">
              Check again in a minute. If it still isn't showing, email{' '}
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
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
              <ReportProblemLink topic="payment" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;
