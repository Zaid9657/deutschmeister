import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { trackOnboardingCompleted } from '../lib/funnelTracking';

export function useOnboarding() {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [onboardingCompletedAt, setOnboardingCompletedAt] = useState(undefined);

  useEffect(() => {
    if (!user) {
      setProfileLoaded(false);
      setOnboardingCompletedAt(undefined);
      return;
    }

    let cancelled = false;
    supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setOnboardingCompletedAt(data?.onboarding_completed_at ?? null);
        setProfileLoaded(true);
      });

    return () => { cancelled = true; };
  }, [user]);

  const needsOnboarding =
    profileLoaded && !!user && isEmailVerified && onboardingCompletedAt === null;

  const completeOnboarding = useCallback(
    async (exitPath = 'dashboard') => {
      const dest = exitPath === 'level-test' ? '/level-test' : '/dashboard';

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to mark onboarding complete:', error);
        }
      }

      setOnboardingCompletedAt(new Date().toISOString());
      trackOnboardingCompleted(exitPath);
      navigate(dest, { replace: true });
    },
    [user, navigate],
  );

  return { needsOnboarding, profileLoaded, completeOnboarding, currentStep, setCurrentStep };
}
