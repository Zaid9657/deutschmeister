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

export const SubscriptionProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [data, setData] = useState({ userId: null, subscription: null, profile: null, purchases: [], loading: true });
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
  const loading = authLoading || data.userId !== userId || data.loading;

  useEffect(() => () => { requestRef.current.generation += 1; }, []);

  const loadSubscriptionData = useCallback(async () => {
    // Don't resolve loading until auth is done — otherwise the guard
    // sees loading=false + hasAccess=false and redirects prematurely.
    if (authLoading || requestRef.current.userId !== userId) return;

    const generation = ++requestRef.current.generation;
    const isCurrent = () => requestRef.current.userId === userId && requestRef.current.generation === generation;

    if (!userId) {
      setData({ userId, subscription: null, profile: null, purchases: [], loading: false });
      return;
    }

    setData((previous) => previous.userId === userId
      ? { ...previous, loading: true }
      : { userId, subscription: null, profile: null, purchases: [], loading: true });

    try {
      // Timeout so a hung network resolves to the logged-in-but-unverified
      // state instead of an infinite loading spinner on every guarded page.
      const [sub, prof, bought] = await withTimeout(
        Promise.all([
          getSubscription(userId),
          getUserProfile(userId),
          getPurchases(userId),
        ]),
        10000
      );

      if (!isCurrent()) return;
      const setProfile = (profile) => setData({ userId, subscription: sub, purchases: bought, profile, loading: false });

      // Auto-start free trial for new users
      let currentProfile = prof;

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
      currentProfile = await settlePendingPlacement(user.id, currentProfile);
      if (!isCurrent()) return;

      setProfile(currentProfile);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      if (isCurrent()) setData((previous) => ({ ...previous, loading: false }));
    }
  }, [userId, user, authLoading]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  // Refresh subscription data when user returns to tab (e.g. after LemonSqueezy checkout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
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
  }, [user, loadSubscriptionData]);

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
