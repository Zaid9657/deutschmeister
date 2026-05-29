import { track } from './analytics';

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
