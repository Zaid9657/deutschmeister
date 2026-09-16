import { track } from './analytics';
import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/safeStorage';
// The SHARED speaking-event allowlist — the same module the server logs
// through, so neither side can emit audio, transcripts or credentials.
import { sanitizeSpeakingEvent } from '../../netlify/functions/_shared/speakingMetrics.mjs';

// Checkout completion is observed from two independent places — the Lemon
// Squeezy overlay's Checkout.Success event, and the subscription poller seeing
// access flip to active after a same-tab checkout. A sessionStorage flag set at
// checkout start is consumed exactly once, so whichever observer fires first
// wins and an ordinary page load never reports a phantom purchase.
const CHECKOUT_FLAG = 'dm_checkout_pending';

export const trackLandingView = () => track('landing_viewed');

export const trackSignupStarted = () => track('signup_started');
export const trackSignupCompleted = () => track('signup_completed');

export const trackOnboardingStarted = () => track('onboarding_started');
export const trackOnboardingSlideViewed = (slideNumber) => track('onboarding_slide_viewed', { slide: slideNumber });
export const trackOnboardingCompleted = (exitPath) => track('onboarding_completed', { exit_path: exitPath });
export const trackOnboardingSkipped = () => track('onboarding_skipped');

export const trackLessonStarted = (level, topic) => track('lesson_started', { level, topic });
export const trackLessonCompleted = (level, topic) => track('lesson_completed', { level, topic });

export const trackSpeakingSessionStarted = () => track('speaking_session_started');
export const trackSpeakingSessionCompleted = (score) => track('speaking_session_completed', { score });

export const trackPricingViewed = () => track('pricing_viewed');
export const trackCheckoutStarted = () => track('checkout_started');
export const trackCheckoutCompleted = (plan, amount) => track('checkout_completed', { plan, amount });

/** Call when a checkout is opened: tracks the start and arms the completion flag. */
export const markCheckoutStarted = (plan, amount) => {
  trackCheckoutStarted();
  safeSetJSON(CHECKOUT_FLAG, { plan, amount }, { session: true });
};

/** Call from any observer of a successful purchase; consumes the flag once. */
export const consumeCheckoutSuccess = () => {
  const pending = safeGetJSON(CHECKOUT_FLAG, null, { session: true });
  if (!pending) return false;
  safeRemove(CHECKOUT_FLAG, { session: true });
  trackCheckoutCompleted(pending.plan, pending.amount);
  return true;
};

export const trackPaywallShown = (feature) => track('paywall_shown', { feature });
export const trackPaywallDismissed = (feature) => track('paywall_dismissed', { feature });

export const trackFAQViewed = () => track('faq_viewed');

export const trackAboutViewed = () => track('about_viewed');

export const trackVerificationPageViewed = () => track('verification_page_viewed');
export const trackVerificationEmailResent = () => track('verification_email_resent');
export const trackEmailVerified = () => track('email_verified');

export const trackComparisonHubViewed = () => track('comparison_hub_viewed');
export const trackComparisonPageViewed = (competitor) => track('comparison_page_viewed', { competitor });
export const trackComparisonCtaClicked = (competitor, ctaType) => track('comparison_cta_clicked', { competitor, cta_type: ctaType });

export const trackLeitfadenViewed = (topic) => track('leitfaden_viewed', { topic });

// ---------------------------------------------------------------------------
// Speaking telemetry (2026-09-15 rebuild plan, live-quality Task 4).
//
// Every speaking event goes through the SHARED allowlist in
// netlify/functions/_shared/speakingMetrics.mjs — the same module the server
// logs through — so audio, transcripts, reference phrases, credentials and
// free-form provider errors cannot be emitted from either side. `track()`
// is already consent-aware (public/consent.js gates GA4 and PostHog).
// ---------------------------------------------------------------------------

const trackSpeaking = (name, props) => {
  const event = sanitizeSpeakingEvent(name, props);
  if (!event) return;
  track(event.name, event.properties);
};

export const trackSpeakingStarted = (props) => trackSpeaking('speaking_started', props);
export const trackSpeakingConnected = (props) => trackSpeaking('speaking_connected', props);
export const trackSpeakingTurnCompleted = (props) => trackSpeaking('speaking_turn_completed', props);
export const trackSpeakingFailed = (props) => trackSpeaking('speaking_failed', props);
export const trackSpeakingEnded = (props) => trackSpeaking('speaking_ended', props);
export const trackSpeakingFallbackUsed = (props) => trackSpeaking('speaking_fallback_used', props);
