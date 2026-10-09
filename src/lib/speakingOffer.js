// The offer at the free-speaking limit: which product a learner is shown when
// the free AI speaking sessions run out (docs/SCORECARD.md work order #7b).
//
// WHY THIS FILE EXISTS (measured 2026-09-28). 12 learners used AI speaking in
// the last 30 days, 0 of them paying, and 11 of the 12 are now past the free
// allowance: 3 used both trial sessions, 8 more are past the end of their trial.
// At that point the setup screen priced the next session at the wallet rate,
// disabled Start and said "top-ups are coming soon". There was no offer at
// all, and a locked mission sent the learner to the generic /pricing/. This
// module decides the concrete offer: the one buyable course for the learner's
// level, with its included Pro months, and Pro as the alternative. When that
// level has no buyable course, the offer is Pro alone.
//
// Pure: no React, explicit .js imports. tests/speaking-offer.test.mjs pins it
// under node --test. Prices never appear here. The component derives them from
// the course object and PLANS.
import { SELLABLE_LEVELS, courseForLevel } from '../data/pricing.js';

/** The route that opens a checkout for a product key: SubscriptionPage's ?buy= resume path. */
export const checkoutHref = (productKey) => `/subscription?buy=${encodeURIComponent(productKey)}`;

/** Pro is always the alternative. Monthly is the one-click plan; the plan page lists yearly. */
export const PRO_OFFER = Object.freeze({ key: 'monthly', href: checkoutHref('monthly'), plansHref: '/subscription' });

const SUBLEVEL = /^([ab][12])\.([12])$/;
const BAND = /^([ab][12])$/;

/**
 * Read a stored level into the lowercase URL form.
 *   'A2.1' / 'a2.1' → { level: 'a2.1', precise: true }
 *   'a1' / 'B1'     → { level: 'a1.1', precise: false }  (a band, not a placement)
 *   anything else   → null
 * 1,632 of 1,686 profiles carry the band 'a1' (the signup default, measured
 * 2026-09-28). That value records no placement, so it must not outrank the
 * level the learner is actually practising.
 */
export function parseLevel(raw) {
  const s = String(raw ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (SUBLEVEL.test(s)) return { level: s, precise: true };
  const band = s.match(BAND);
  return band ? { level: `${band[1]}.1`, precise: false } : null;
}

/**
 * The learner's level for the offer. A precise profile level (a placement or a
 * choice) wins. Otherwise use the level on the speaking picker, which is
 * always a sub-level. The band default is used last.
 */
export function offerLevel({ profileLevel, practiceLevel } = {}) {
  const profile = parseLevel(profileLevel);
  if (profile?.precise) return profile.level;
  const practice = parseLevel(practiceLevel);
  if (practice?.precise) return practice.level;
  return profile?.level || practice?.level || null;
}

/**
 * true when a non-subscriber has no free speaking session left, per the
 * check-speaking-usage response (netlify/functions/_shared/speakingUsage.mjs):
 * `allowed: false` with reason 'trial_limit_reached' (both trial sessions
 * used) or 'subscription_required' (trial over). An unknown or failed usage
 * check is NOT a cap, so no limit is ever claimed that was not measured.
 */
export function isFreeSpeakingCapped({ subscriber = false, usage = null } = {}) {
  if (subscriber) return false;
  return Boolean(usage) && typeof usage === 'object' && usage.allowed === false;
}

/** Which limit the learner hit, for the headline. */
export function speakingLimitMoment({ usage = null, missionLocked = false } = {}) {
  if (usage?.allowed === false) return usage.reason === 'trial_limit_reached' ? 'sessions_used' : 'trial_over';
  return missionLocked ? 'mission_locked' : 'sessions_used';
}

/**
 * The offer at the speaking limit.
 *
 * @param {object}   p
 * @param {string}   [p.profileLevel]  profiles.current_level (any case; 'a1' is the band default)
 * @param {string}   [p.practiceLevel] the level selected on the speaking page ('A2.1')
 * @param {(key: string) => string} [p.checkoutIdFor]  the checkout id configured for a
 *   product key, '' when unset. The client passes LEMONSQUEEZY_CONFIG.levelCourses[key].variantId.
 * @param {string[]} [p.ownedLevels]   levels the learner already owns (levelsForProduct over purchases)
 * @returns {{ kind: 'course'|'pro', level: string|null, reason: string,
 *             course: object|null, courseHref: string|null, pro: typeof PRO_OFFER }}
 *   reason is 'buyable', or why the offer fell back to Pro: 'no_level' | 'free_level' |
 *   'coming_soon' | 'owned' | 'no_checkout'.
 */
export function speakingLimitOffer({ profileLevel, practiceLevel, checkoutIdFor, ownedLevels = [] } = {}) {
  const level = offerLevel({ profileLevel, practiceLevel });
  const pro = (reason, course = null) => ({ kind: 'pro', level, reason, course, courseHref: null, pro: PRO_OFFER });

  if (!level) return pro('no_level');
  const course = courseForLevel(level);
  if (!course) return pro('free_level');
  if (course.comingSoon || !SELLABLE_LEVELS.includes(level)) return pro('coming_soon', course);
  const owned = new Set((ownedLevels || []).map((l) => String(l).toLowerCase()));
  if (owned.has(level)) return pro('owned');
  const id = typeof checkoutIdFor === 'function' ? checkoutIdFor(course.key) : '';
  // Never a dead checkout: a course whose checkout id is unset is not offered.
  if (!id) return pro('no_checkout');

  return { kind: 'course', level, reason: 'buyable', course, courseHref: checkoutHref(course.key), pro: PRO_OFFER };
}
