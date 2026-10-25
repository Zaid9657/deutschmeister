import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getAuthHeaders } from '../utils/supabase';
import { withTimeout } from '../utils/withTimeout';
import { isLevelFree } from '../config/freeTier';
import { levelsForProduct } from '../data/pricing.js';
import {
  getSubscription,
  getUserProfile,
  getPurchases,
  startFreeTrial,
  checkTrialStatus,
  checkSubscriptionStatus,
} from '../services/subscriptionService';
import { settlePendingPlacement } from '../services/placementService';

const SubscriptionContext = createContext({});

export const useSubscription = () => useContext(SubscriptionContext);

// Each entitlement read settles on its own: a failed read is a failure to
// remember, never an answer of "none" (the services throw on errors).
const settled = (promise) => Promise.resolve(promise).then(
  (value) => ({ ok: true, value }),
  (error) => ({ ok: false, error }),
);

export const SubscriptionProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState({ userId: null, subscription: null, profile: null, purchases: [], loading: true, billingVerified: false });
  const lastRefreshRef = useRef(0);
  const requestRef = useRef({ userId, generation: 0 });

  // Mask the previous account during the render that changes identity, before
  // effects run. Invalidate its requests at the same boundary.
  if (requestRef.current.userId !== userId) {
    requestRef.current = { userId, generation: requestRef.current.generation + 1 };
  }
  const subscription = data.userId === userId ? data.subscription : null;
  const profile = data.userId === userId ? data.profile : null;
  const purchases = data.userId === userId ? data.purchases : [];
  // True only for the first load of an account (or an identity change). A
  // refresh of the account on screen revalidates in the background: every
  // guard swaps its page for a spinner while `loading` is true, and an
  // unmounted page loses its work (an A1.2 checkpoint, a Modelltest clip).
  const loading = authLoading || data.userId !== userId || data.loading;
  // The latest load read both billing tables (subscriptions, purchases). A page
  // that sells must not open a checkout from data that failed to load.
  const billingVerified = data.userId === userId && data.billingVerified === true;

  useEffect(() => () => { requestRef.current.generation += 1; }, []);

  const loadSubscriptionData = useCallback(async () => {
    // Don't resolve loading until auth is done — otherwise the guard
    // sees loading=false + hasAccess=false and redirects prematurely.
    if (authLoading || requestRef.current.userId !== userId) return;

    const generation = ++requestRef.current.generation;
    const isCurrent = () => requestRef.current.userId === userId && requestRef.current.generation === generation;

    if (!userId) {
      setData({ userId, subscription: null, profile: null, purchases: [], loading: false, billingVerified: false });
      return;
    }

    // A refresh of the account already on screen keeps its data and does not
    // set `loading` (tab return, the hourly token refresh, a settings save).
    // Only a first load or a different account starts from nothing.
    setData((previous) => previous.userId === userId
      ? previous
      : { userId, subscription: null, profile: null, purchases: [], loading: true, billingVerified: false });

    try {
      // Timeout so a hung network resolves to the logged-in-but-unverified
      // state instead of an infinite loading spinner on every guarded page.
      const [subRead, profileRead, purchasesRead] = await withTimeout(
        Promise.all([
          settled(getSubscription(userId)),
          settled(getUserProfile(userId)),
          settled(getPurchases(userId)),
        ]),
        10000
      );

      if (!isCurrent()) return;
      const billingVerified = subRead.ok && purchasesRead.ok;
      // A failed read keeps what this account already had: a refresh on a
      // flaky network must never replace a paying learner's entitlements with
      // "no subscription, no purchases" (the guards would send them to the
      // paywall, and /subscription would sell a second plan).
      const setProfile = (profile) => setData((previous) => {
        const kept = previous.userId === userId ? previous : { subscription: null, profile: null, purchases: [] };
        return {
          userId,
          subscription: subRead.ok ? subRead.value : kept.subscription,
          purchases: purchasesRead.ok ? purchasesRead.value : kept.purchases,
          profile: profile === undefined ? kept.profile : profile,
          loading: false,
          billingVerified,
        };
      });

      // An unreadable profile is not a missing one: keep the one this account
      // had and never run the trial backfill on it.
      if (!profileRead.ok) {
        setProfile(undefined);
        return;
      }

      // Auto-start free trial for new users
      let currentProfile = profileRead.value;

      // Profile should be created by DB trigger on auth.users insert.
      // If not yet available (slight delay), retry once after a short wait.
      if (!currentProfile) {
        await new Promise(r => setTimeout(r, 800));
        if (!isCurrent()) return;
        currentProfile = await getUserProfile(userId);
        if (!isCurrent()) return;
      }

      // Safety net: if DB trigger didn't fire or profile still missing,
      // create profile with trial dates from the frontend.
      if (!currentProfile) {
        await startFreeTrial(userId);
        if (!isCurrent()) return;
        currentProfile = await getUserProfile(userId);
      } else if (!currentProfile.trial_started_at) {
        // Profile exists but trial dates are NULL — backfill them
        await startFreeTrial(userId);
        if (!isCurrent()) return;
        currentProfile = await getUserProfile(userId);
      }
      if (!isCurrent()) return;

      // A level-test result taken signed out on this browser ("Sign up free —
      // save my results", src/lib/placement.js) lands on the account here,
      // before anything reads current_level. Only fills an empty placement.
      // user.id === userId here: the callback is recreated whenever the id
      // changes, so the user it captured is always this account.
      currentProfile = await settlePendingPlacement(user.id, currentProfile);
      if (!isCurrent()) return;

      setProfile(currentProfile);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      // A timeout or a failed retry verified nothing: the account keeps the
      // data it had, but never as verified billing.
      if (isCurrent()) setData((previous) => ({ ...previous, billingVerified: false }));
    } finally {
      if (isCurrent()) setData((previous) => ({ ...previous, loading: false }));
    }
    // Keyed on the account id, not the auth user object: auth-js emits
    // SIGNED_IN / TOKEN_REFRESHED with a new object for the same user (every
    // tab return, about hourly), which must not recreate the loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Refresh subscription data when user returns to tab (e.g. after LemonSqueezy checkout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId) {
        // Throttle: only refresh if more than 5 seconds since last refresh
        const now = Date.now();
        if (now - lastRefreshRef.current > 5000) {
          lastRefreshRef.current = now;
          loadSubscriptionData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, loadSubscriptionData]);

  const isInFreeTrial = () => {
    const trialStatus = checkTrialStatus(profile);
    return trialStatus.isInTrial;
  };

  const getTrialDaysRemaining = () => {
    const trialStatus = checkTrialStatus(profile);
    return trialStatus.daysRemaining;
  };

  // Pro comes from a confirmed subscription period or an included course
  // window. Lifetime ownership below remains independent of that deadline.
  const hasActiveSubscription = () => checkSubscriptionStatus(subscription).isActive ||
    purchases.some((purchase) => purchase.status === 'active' && Date.parse(purchase.access_until) > Date.now());

  const hasAccess = isInFreeTrial() || hasActiveSubscription();

  // One-time product entitlements (course areas). Distinct from hasAccess on
  // purpose: a course is lifetime while its included Pro window can expire, so
  // PurchaseGuard reads this and the level guards keep reading hasAccess.
  const hasProduct = (productKey) => purchases.some((p) => p.product_key === productKey);

  // Level entitlement — the one question every level surface asks. A level is
  // open if it is free, if the trial/subscription is live, or if a bought
  // level course covers it (lifetime, independent of the Pro window). Guards
  // and lock badges read THIS, never hasAccess alone, or a paid-for course
  // shows a lock the day its included Pro expires.
  const hasLevelAccess = (level) => {
    if (isLevelFree(level)) return true;
    if (hasAccess) return true;
    const l = (level || '').toLowerCase();
    return purchases.some((p) => levelsForProduct(p.product_key).includes(l));
  };

  // NOTE: there is deliberately no client-side createSubscription here.
  // Paid access is granted server-side only, by the Lemon Squeezy webhook
  // (netlify/functions/lemonsqueezy-webhook.mjs) using the service role.
  // RLS blocks clients from writing subscriptions/profiles.is_subscribed.

  const refreshSubscription = async () => {
    await loadSubscriptionData();
  };

  // Safety net: call verify-subscription function to recover missed webhooks
  const verifySubscription = async () => {
    if (!userId || requestRef.current.userId !== userId) return false;
    try {
      const authHeaders = await getAuthHeaders();
      if (requestRef.current.userId !== userId) return false;
      const res = await fetch('/.netlify/functions/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (requestRef.current.userId !== userId) return false;
      if (data.status === 'active') {
        await loadSubscriptionData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('verify-subscription error:', err);
      return false;
    }
  };

  const value = {
    subscription,
    profile,
    purchases,
    hasProduct,
    hasLevelAccess,
    loading,
    billingVerified,
    hasAccess,
    isInFreeTrial,
    getTrialDaysRemaining,
    hasActiveSubscription,
    refreshSubscription,
    verifySubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
