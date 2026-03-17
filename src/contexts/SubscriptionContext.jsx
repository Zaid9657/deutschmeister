import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getSubscription,
  getUserProfile,
  startFreeTrial,
  createSubscription as createSub,
  checkTrialStatus,
  checkSubscriptionStatus,
} from '../services/subscriptionService';

const SubscriptionContext = createContext({});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(0);

  const loadSubscriptionData = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const [sub, prof] = await Promise.all([
        getSubscription(user.id),
        getUserProfile(user.id),
      ]);

      setSubscription(sub);

      // Auto-start free trial for new users
      let currentProfile = prof;

      // If no profile yet, wait for DB trigger to create it (race condition)
      if (!currentProfile) {
        await new Promise(r => setTimeout(r, 1500));
        currentProfile = await getUserProfile(user.id);
      }

      if (!currentProfile) {
        // Still no profile — create one with trial via insert
        await startFreeTrial(user.id);
        currentProfile = await getUserProfile(user.id);
      } else if (!currentProfile.trial_started_at) {
        // Profile exists but trial never started
        await startFreeTrial(user.id);
        currentProfile = await getUserProfile(user.id);
      }

      setProfile(currentProfile);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  const hasActiveSubscription = () => {
    // Check subscription record first
    const subStatus = checkSubscriptionStatus(subscription);
    if (subStatus.isActive) return true;
    // Fallback: profile.is_subscribed (set by webhook even if subscription query misses)
    if (profile?.is_subscribed) return true;
    return false;
  };

  const hasAccess = isInFreeTrial() || hasActiveSubscription();

  const createSubscription = async (planType, pricePaid) => {
    if (!user) return null;
    const sub = await createSub(user.id, planType, pricePaid);
    if (sub) {
      setSubscription(sub);
      // Refresh profile
      const updatedProfile = await getUserProfile(user.id);
      setProfile(updatedProfile);
    }
    return sub;
  };

  const refreshSubscription = async () => {
    await loadSubscriptionData();
  };

  // Safety net: call verify-subscription function to recover missed webhooks
  const verifySubscription = async () => {
    if (!user) return false;
    try {
      const res = await fetch('/.netlify/functions/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
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
    loading,
    hasAccess,
    isInFreeTrial,
    getTrialDaysRemaining,
    hasActiveSubscription,
    createSubscription,
    refreshSubscription,
    verifySubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
