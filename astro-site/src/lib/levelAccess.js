// Browser-only entitlement check for the static pages: the course doors on the
// homepage, /courses/ and /pricing/ (components/CourseCheckout.astro) and the
// grammar exercise player (components/ExercisePlayer.jsx).
//
// Mirrors SubscriptionContext.hasLevelAccess in the SPA, with the same three
// doors: the level is free, the account has a live trial or Pro
// (profiles.is_subscribed / trial_ends_at — the included Pro window of a course
// purchase sets is_subscribed too), or a bought level course covers the level
// (purchases → levelsForProduct). Loaded lazily and only when a session exists,
// so the logged-out majority never fetches the Supabase chunk.
//
// One snapshot per page view (loadEntitlementSnapshot: one auth read, one
// profile read, one purchases read), then pure answers per level (levelOpen)
// and per product (ownedProductHome). The doors used to re-read all three for
// every level on the page (ACC-18).
//
// `open` and `owned` are different questions (ACC-17). A live trial or Pro
// opens a level for a while; only a bought course owns it (the SPA's rule,
// src/lib/checkoutAccess.js ownsCheckoutProduct: "A live trial or Pro period is
// not ownership of a course"). The doors swap Buy for Open only for an owner,
// so the lifetime course stays on sale to the visitors most likely to buy it.
import { supabase } from './supabase.js';
import { levelsForProduct } from '../data/pricing.js';

const SITE = 'https://deutsch-meister.de';

/** The levels with a guided course (/course/<level>); every other level opens its level page. */
export const GUIDED_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2'];

/** Where a level opens in the app. */
export const levelHref = (level) => `${SITE}/${GUIDED_LEVELS.includes(level) ? 'course' : 'level'}/${level}`;

const activePurchases = (snapshot) => (snapshot?.purchases || []).filter((p) => !p.status || p.status === 'active');

/**
 * The signed-in visitor's entitlements, read once.
 * `verified` is false when a read failed: a failed read is never "nothing bought".
 *
 * @returns {Promise<{ signedIn: boolean, verified: boolean, profile: object|null, purchases: object[] }>}
 */
export async function loadEntitlementSnapshot() {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, verified: false, profile: null, purchases: [] };

  const [profileRead, purchasesRead] = await Promise.all([
    supabase.from('profiles').select('is_subscribed, trial_ends_at').eq('id', user.id).maybeSingle(),
    supabase.from('purchases').select('product_key').eq('user_id', user.id).eq('status', 'active'),
  ]);
  return {
    signedIn: true,
    verified: !profileRead.error && !purchasesRead.error,
    profile: profileRead.data || null,
    purchases: purchasesRead.data || [],
  };
}

/**
 * Is a level open to this visitor, and why. `open` is unchanged from before
 * (owned, Pro or a live trial); `owned` is a bought course covering the level.
 *
 * @param {{ signedIn: boolean, profile: object|null, purchases: object[] }|null} snapshot
 * @param {string} level lowercase sub-level, e.g. 'b1.1'
 * @returns {{ signedIn: boolean, open: boolean, owned: boolean, reason: 'owned'|'pro'|'trial'|null }}
 */
export function levelOpen(snapshot, level, now = Date.now()) {
  const l = (level || '').toLowerCase();
  if (!snapshot?.signedIn) return { signedIn: false, open: false, owned: false, reason: null };
  const owned = activePurchases(snapshot).some((p) => levelsForProduct(p.product_key).includes(l));
  const endsAt = snapshot.profile?.trial_ends_at ? new Date(snapshot.profile.trial_ends_at) : null;
  const reason = owned ? 'owned'
    : snapshot.profile?.is_subscribed ? 'pro'
      : endsAt && endsAt.getTime() > now ? 'trial'
        : null;
  return { signedIn: true, open: reason !== null, owned, reason };
}

/**
 * Where an owner of `productKey` continues, or null when the visitor does not
 * own it: the exact product, or every level it covers through any purchase
 * (retired bands course_a1/a2 and the all-level bundle included).
 */
export function ownedProductHome(snapshot, productKey) {
  if (!snapshot?.signedIn) return null;
  const active = activePurchases(snapshot);
  const levels = levelsForProduct(productKey);
  const owned = active.some((p) => p.product_key === productKey)
    || (levels.length > 0 && levels.every((level) => active.some((p) => levelsForProduct(p.product_key).includes(level))));
  if (!owned) return null;
  if (productKey === 'telc_b1_komplett') return `${SITE}/telc-b1-kurs`;
  return levels.length ? levelHref(levels[0]) : `${SITE}/dashboard`;
}

/**
 * One level, one call (the exercise player). Same shape as before, plus
 * `owned` and `reason`.
 *
 * @param {string} level lowercase sub-level, e.g. 'b1.1'
 */
export async function getLevelAccess(level) {
  return levelOpen(await loadEntitlementSnapshot(), level);
}
