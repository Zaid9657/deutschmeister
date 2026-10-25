import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { trackPaywallShown } from '../lib/funnelTracking';
import { canEnterAccount } from '../lib/accountAccess';
import { courseHomeFor } from '../lib/courseEntry.js';

// Signup grants a 7-day trial, but the profile row (and its trial dates) is
// written by a DB trigger + client-side backfill chain that can land AFTER the
// first guarded render. Without the retry below, a brand-new user's very first
// screen could be the /subscription paywall — a race, not a paywall decision.
const NEW_USER_WINDOW_MS = 10 * 60 * 1000;

// `freeFallback` (the /dashboard route only, src/App.jsx): a signed-in learner
// without account access goes to the course they can open (courseHomeFor: their
// placement level if open to them, else the free A1.1 course) instead of the
// paywall. /dashboard is where login, the confirmation link and every "Zum
// Dashboard" button land, so without it a free learner's every return visit
// started on "Trial expired" (ACC-06). Not a paywall view: no paywall_shown.
// Every other SubscriptionGuard route keeps sending them to /subscription.
const SubscriptionGuard = ({ children, freeFallback = false }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess: liveAccess, purchases, profile, hasLevelAccess, loading: subLoading, refreshSubscription } = useSubscription();
  const hasAccess = canEnterAccount({ hasAccess: liveAccess, purchases });
  const location = useLocation();
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);
  const retriedRef = useRef(false);

  const isBrandNew =
    user?.created_at && Date.now() - new Date(user.created_at).getTime() < NEW_USER_WINDOW_MS;

  useEffect(() => {
    if (authLoading || subLoading || !user || hasAccess) return;
    if (isBrandNew && !retriedRef.current) {
      retriedRef.current = true;
      setRetrying(true);
      refreshSubscription().finally(() => setRetrying(false));
      return;
    }
    // The free fallback opens the learner's course; it is not a paywall view.
    if (freeFallback) return;
    trackPaywallShown(location.pathname);
    // refreshSubscription is not memoised in the provider; the effect's real
    // inputs are the loading/access flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, subLoading, user, hasAccess, isBrandNew, freeFallback, location.pathname]);

  if (authLoading || subLoading || retrying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-rule border-t-siegel animate-spin" />
          <p className="text-graphite">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    // Hold the redirect until the one brand-new-user retry has actually run.
    if (isBrandNew && !retriedRef.current) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <div className="w-16 h-16 rounded-full border-4 border-rule border-t-siegel animate-spin" />
        </div>
      );
    }
    if (freeFallback) {
      return <Navigate replace to={courseHomeFor({ level: profile?.current_level, hasLevelAccess })} />;
    }
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default SubscriptionGuard;
