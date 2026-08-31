import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getAuthHeaders } from '../utils/supabase';
import { withTimeout } from '../utils/withTimeout';
import {
  getSubscription,
  getUserProfile,
  getPurchases,
  startFreeTrial,
  checkTrialStatus,
  checkSubscriptionStatus,
} from '../services/subscriptionService';

const SubscriptionContext = createContext({});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(0);
  const prevUserIdRef = useRef(null);

  // When user changes (login/logout), immediately set loading=true so the
  // guard never sees a stale hasAccess=false between user change and data load.
  useEffect(() => {
    const newUserId = user?.id ?? null;
    if (newUserId !== prevUserIdRef.current) {
      if (newUserId) {
        setLoading(true);
      }
      prevUserIdRef.current = newUserId;
    }
  }, [user]);

  const loadSubscriptionData = useCallback(async () => {
    // Don't resolve loading until auth is done — otherwise the guard
    // sees loading=false + hasAccess=false and redirects prematurely.
    if (authLoading) return;

    if (!user) {
      setSubscription(null);
      setProfile(null);
      setPurchases([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Timeout so a hung network resolves to the logged-in-but-unverified
      // state instead of an infinite loading spinner on every guarded page.
      const [sub, prof, bought] = await withTimeout(
        Promise.all([
          getSubscription(user.id),
          getUserProfile(user.id),
          getPurchases(user.id),
        ]),
        10000
      );

      setSubscription(sub);
      setPurchases(bought);

      // Auto-start free trial for new users
      let currentProfile = prof;

      // Profile should be created by DB trigger on auth.users insert.
      // If not yet available (slight delay), retry once after a short wait.
      if (!currentProfile) {
        await new Promise(r => setTimeout(r, 800));
        currentProfile = await getUserProfile(user.id);
      }

      // Safety net: if DB trigger didn't fire or profile still missing,
      // create profile with trial dates from the frontend.
      if (!currentProfile) {
        await startFreeTrial(user.id);
        currentProfile = await getUserProfile(user.id);
      } else if (!currentProfile.trial_started_at) {
        // Profile exists but trial dates are NULL — backfill them
        await startFreeTrial(user.id);
        currentProfile = await getUserProfile(user.id);
      }

      setProfile(currentProfile);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading]);

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

  // Single source of truth for paid access: the subscription's paid period.
  // We deliberately do NOT fall back to profile.is_subscribed here — that flag
  // and the subscriptions row used to disagree (blocking payers / showing the
  // wrong page). Both the route guard and the "Pro" badge now read this value,
  // so they can never diverge. (Trial access is handled separately by
  // isInFreeTrial(); this only governs paid access.)
  const hasActiveSubscription = () => checkSubscriptionStatus(subscription).isActive;

  const hasAccess = isInFreeTrial() || hasActiveSubscription();

  // One-time product entitlements (course areas). Distinct from hasAccess on
  // purpose: a course is lifetime while its included Pro window can expire, so
  // PurchaseGuard reads this and the level guards keep reading hasAccess.
  const hasProduct = (productKey) => purchases.some((p) => p.product_key === productKey);

  // NOTE: there is deliberately no client-side createSubscription here.
  // Paid access is granted server-side only, by the Lemon Squeezy webhook
  // (netlify/functions/lemonsqueezy-webhook.mjs) using the service role.
  // RLS blocks clients from writing subscriptions/profiles.is_subscribed.

  const refreshSubscription = async () => {
    await loadSubscriptionData();
  };

  // Safety net: call verify-subscription function to recover missed webhooks
  const verifySubscription = async () => {
    if (!user) return false;
    try {
      const res = await fetch('/.netlify/functions/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({}),
      });
      const data = await res.json();
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
