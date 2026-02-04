import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

      // Auto-start free trial for new users (no profile yet)
      if (!prof) {
        await startFreeTrial(user.id);
        const newProfile = await getUserProfile(user.id);
        setProfile(newProfile);
      } else if (!prof.trial_started_at) {
        // Profile exists but trial never started
        await startFreeTrial(user.id);
        const updatedProfile = await getUserProfile(user.id);
        setProfile(updatedProfile);
      } else {
        setProfile(prof);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const isInFreeTrial = () => {
    const trialStatus = checkTrialStatus(profile);
    return trialStatus.isInTrial;
  };

  const getTrialDaysRemaining = () => {
    const trialStatus = checkTrialStatus(profile);
    return trialStatus.daysRemaining;
  };

  const hasActiveSubscription = () => {
    const subStatus = checkSubscriptionStatus(subscription);
    return subStatus.isActive;
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
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
