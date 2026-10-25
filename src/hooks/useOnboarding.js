import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { supabase } from '../utils/supabase';
import { trackOnboardingCompleted } from '../lib/funnelTracking';
import { onboardingExitPath } from '../lib/firstRun.js';

export function useOnboarding() {
  const { user, isEmailVerified } = useAuth();
  const { profile, hasLevelAccess } = useSubscription();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState(undefined);
  // Keyed on WHO is signed in: the user object is replaced at every tab focus
  // and token refresh, and each replacement refetched the profile.
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setProfileLoaded(false);
      setOnboardingCompletedAt(undefined);
      return;
    }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('Failed to load onboarding state:', error.message);
          setOnboardingCompletedAt('error');
          setProfileLoaded(true);
          return;
        }
        setOnboardingCompletedAt(data?.onboarding_completed_at ?? null);
        setProfileLoaded(true);
      });

    return () => { cancelled = true; };
  }, [userId]);

  const needsOnboarding =
    profileLoaded && !!user && isEmailVerified && onboardingCompletedAt === null;

  const completeOnboarding = useCallback(
    // `href` is for full-load destinations outside the SPA (the grammar
    // lessons are served by the Astro build) — the completion is persisted
    // FIRST, so the page unload cannot lose it. The in-app exits are mapped
    // by src/lib/firstRun.js: learning exits prefer the chosen exam's task;
    // without an accessible exam task they keep their existing destinations.
    async (exitPath = 'dashboard', { href, examTrack = profile?.exam_track } = {}) => {
      const dest = onboardingExitPath(exitPath, { examTrack, currentLevel: profile?.current_level, hasLevelAccess });

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error('Failed to mark onboarding complete:', error);
        }
      }

      setOnboardingCompletedAt(new Date().toISOString());
      trackOnboardingCompleted(exitPath);
      if (href) {
        window.location.assign(href);
        return;
      }
      navigate(dest, { replace: true });
    },
    [user, navigate, profile, hasLevelAccess],
  );

  return { needsOnboarding, profileLoaded, completeOnboarding, currentStep, setCurrentStep };
}
