// Browser-only entitlement check for the static pages: the course doors on the
// homepage, /courses/ and /pricing/ (components/CourseCheckout.astro) and the
// grammar exercise player (components/ExercisePlayer.jsx).
//
// Mirrors SubscriptionContext.hasLevelAccess in the SPA, with the same three
// doors: the level is free, the account has a live trial or AI Practice
// (profiles.is_subscribed / trial_ends_at — the included AI Practice window of a course
// purchase sets is_subscribed too), or a bought level course covers the level
// (purchases → levelsForProduct). Loaded lazily and only when a session exists,
// so the logged-out majority never fetches the Supabase chunk.
//
// One snapshot per page view (loadEntitlementSnapshot: one auth read, one
// profile read, one purchases read), then pure answers per level (levelOpen)
// and per product (ownedProductHome). The doors used to re-read all three for
// every level on the page (ACC-18).
//
// `open` and `owned` are different questions (ACC-17). A live trial or AI Practice
// opens a level for a while; only a bought course owns it (the SPA's rule,
// src/lib/checkoutAccess.js ownsCheckoutProduct: "A live trial or AI Practice period is
// not ownership of a course"). The doors swap Buy for Open only for an owner,
// so the lifetime course stays on sale to the visitors most likely to buy it.
import { courseAccessReason } from '../../../src/lib/levelEntitlement.js';
import { supabase } from './supabase.js';
import { levelsForProduct, ownsProduct, OFFER_PRODUCTS } from '../data/pricing.js';

const SITE = 'https://deutsch-meister.de';

/** The levels with a guided course (/course/<level>); every other level opens its level page. */
export const GUIDED_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2'];

/** Where a level opens in the app. */
export const levelHref = (level) => `${SITE}/${GUIDED_LEVELS.includes(level) ? 'course' : 'level'}/${level}`;

const activePurchases = (snapshot) => (snapshot?.purchases || []).filter((p) => !p.status || p.status === 'active');

/**
 * The signed-in visitor's entitlements, read once.
 * `verified` is false when a read failed: a failed read is never "nothing bought".
 * `userId` is the account the reads answered for: a snapshot belongs to one
 * account, and a caller must not apply it to another (another tab can sign in
 * a different account while this page stays open).
 *
 * @returns {Promise<{ signedIn: boolean, userId: string|null, verified: boolean, profile: object|null, purchases: object[] }>}
 */
export async function loadEntitlementSnapshot() {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, userId: null, verified: false, profile: null, purchases: [] };

  const [profileRead, purchasesRead, subscriptionRead] = await Promise.all([
    supabase.from('profiles').select('is_subscribed, trial_started_at, trial_ends_at, subscription_tier').eq('id', user.id).maybeSingle(),
    supabase.from('purchases').select('product_key, status, access_until').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('subscriptions').select('status, plan_type, subscription_start, created_at, subscription_end').eq('user_id', user.id).order('subscription_end', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ]);
  return {
    signedIn: true,
    userId: user.id,
    verified: !profileRead.error && !purchasesRead.error && !subscriptionRead.error,
    profile: profileRead.data || null,
    purchases: purchasesRead.data || [],
    subscription: subscriptionRead.data || null,
  };
}

/**
 * Is a level open to this visitor, and why. `open` is unchanged from before
 * (owned, AI Practice or a live trial); `owned` is a bought course covering the level.
 *
 * @param {{ signedIn: boolean, profile: object|null, purchases: object[] }|null} snapshot
 * @param {string} level lowercase sub-level, e.g. 'b1.1'
 * @returns {{ signedIn: boolean, open: boolean, owned: boolean, reason: 'owned'|'pro'|'trial'|null }}
 */
export function levelOpen(snapshot, level, now = Date.now()) {
  const l = (level || '').toLowerCase();
  if (!snapshot?.signedIn) return { signedIn: false, open: false, owned: false, reason: null };
  const owned = activePurchases(snapshot).some((p) => levelsForProduct(p.product_key).includes(l));
  const reason = courseAccessReason(snapshot, l, now);
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
  if (!ownsProduct(productKey, active)) return null;
  if (OFFER_PRODUCTS[productKey]) return `${SITE}${OFFER_PRODUCTS[productKey].home}`;
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
