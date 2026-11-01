import { courseForLevel, PLANS, deEur } from '../data/pricing.js';
import { FREE_LEVEL_LABEL } from '../data/marketing.js';
import { FREE_COURSE_HREF } from '../data/offers.js';
import { hasRecurringBilling } from './checkoutAccess.js';
import { safeGet, safeSet } from '../utils/safeStorage.js';

export const RETURN_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const dismissKey = (userId) => `dm_trial_return_dismissed:${userId}`;
export function returnDismissed(userId, now = Date.now()) {
  const at = Number(safeGet(dismissKey(userId)));
  return at > 0 && at <= now && now - at < RETURN_DISMISS_MS;
}
export const dismissReturn = (userId, now = Date.now()) => safeSet(dismissKey(userId), String(now));
export const hideReturnBanner = (path) => /^\/(subscription|pricing)(\/|$)/.test(path);

// Presentation only. An unread billing state is never evidence of no purchase.
export function showTrialReturn({ userId, profile, purchases, subscription, loading, billingVerified, subscribed }, now = Date.now()) {
  const end = Date.parse(profile?.trial_ends_at);
  return Boolean(userId && !loading && billingVerified === true && profile &&
    Number.isFinite(end) && end <= now && !subscribed && !profile.is_subscribed &&
    (!profile.subscription_tier || profile.subscription_tier === 'free') &&
    Array.isArray(purchases) && purchases.length === 0 && !hasRecurringBilling(subscription));
}

// Load curriculum metadata only for an eligible returning learner.
export async function loadSavedWork(client, userId) {
  const { loadSavedWork: load } = await import('./trialSavedWork.js');
  return load(client, userId);
}

export function returnOffer(level, levelCourses = {}) {
  const course = courseForLevel(level);
  if (course && !course.comingSoon && levelCourses[course.key]?.variantId) {
    return { label: `${course.nameDe} · ${deEur(course.price)} einmalig`, href: '/subscription#return-offers' };
  }
  return { label: `Pro · ${deEur(PLANS.monthly.price)} / ${PLANS.monthly.intervalDe}`, href: '/subscription#return-offers' };
}

export const freeReturnOption = { href: FREE_COURSE_HREF, label: `${FREE_LEVEL_LABEL} bleibt kostenlos` };
