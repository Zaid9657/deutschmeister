import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { trackPaywallShown } from '../lib/funnelTracking';
import { courseHomeFor } from '../lib/courseEntry.js';

// Signup grants a 7-day trial, but the profile row (and its trial dates) is
// written by a DB trigger + client-side backfill chain that can land AFTER the
// first guarded render. Without the retry below, a brand-new user's very first
// screen could be the /subscription paywall — a race, not a paywall decision.
const NEW_USER_WINDOW_MS = 10 * 60 * 1000;

// `freeHome` (the /dashboard route, owner decision 2026-10-07): a signed-in
// learner without a trial or subscription goes to their free course home
// instead of the paywall. /dashboard is where every login lands
// (postAuthPath), and on 2026-10-06 1,149 of 1,166 confirmed accounts had no
// trial left, so their first screen after logging in, or after the
// confirmation nudge's one-click link, was the plan page rather than the free
// A1.1 course (docs/auth-audit-2026-10-06.md, F3). The bottom nav already sends
// the same learner's Home tab there (courseHomeFor).
const SubscriptionGuard = ({ children, freeHome = false }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, hasLevelAccess, profile, loading: subLoading, refreshSubscription } = useSubscription();
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
    if (!freeHome) trackPaywallShown(location.pathname);
    // refreshSubscription is not memoised in the provider; the effect's real
    // inputs are the loading/access flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, subLoading, user, hasAccess, isBrandNew, location.pathname, freeHome]);

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
    if (freeHome) {
      return <Navigate to={courseHomeFor({ level: profile?.current_level, hasLevelAccess })} replace />;
    }
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default SubscriptionGuard;
