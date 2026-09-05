import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { trackPaywallShown } from '../lib/funnelTracking';
import { examTrackBySlug } from '../data/examTracks';

// Same brand-new-user race as SubscriptionGuard (see there for the full note).
const NEW_USER_WINDOW_MS = 10 * 60 * 1000;

// Guards the /modelltest/:examSlug* routes. Pro/trial keeps the exact access
// SubscriptionGuard already gave it; on top of that, a band-course buyer
// unlocks their own band's mock — the €49 course is sold on including it
// (docs/course-research-2026-09-03.md §4). Gate on the band's TOP sublevel
// (EXAM_TRACKS[].sublevels, last entry), never the first: hasLevelAccess()
// treats FREE_LEVELS (a1.1) as always-open, so gating on a1.1 would make the
// A1 mock free for everyone — a1.2 is never free, so it opens only via
// Pro/trial or an actual course purchase.
const ExamSubscriptionGuard = ({ children }) => {
  const { examSlug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, hasLevelAccess, loading: subLoading, refreshSubscription } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();
  const [retrying, setRetrying] = useState(false);
  const retriedRef = useRef(false);

  const track = examTrackBySlug(examSlug);
  const topSublevel = track?.sublevels?.[track.sublevels.length - 1];
  const examAccess = hasAccess || (topSublevel ? hasLevelAccess(topSublevel) : false);

  const isBrandNew =
    user?.created_at && Date.now() - new Date(user.created_at).getTime() < NEW_USER_WINDOW_MS;

  useEffect(() => {
    if (authLoading || subLoading || !user || examAccess) return;
    if (isBrandNew && !retriedRef.current) {
      retriedRef.current = true;
      setRetrying(true);
      refreshSubscription().finally(() => setRetrying(false));
      return;
    }
    trackPaywallShown(location.pathname);
    // refreshSubscription is not memoised in the provider; the effect's real
    // inputs are the loading/access flags.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, subLoading, user, examAccess, isBrandNew, location.pathname]);

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

  if (!examAccess) {
    // Hold the redirect until the one brand-new-user retry has actually run.
    if (isBrandNew && !retriedRef.current) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <div className="w-16 h-16 rounded-full border-4 border-rule border-t-siegel animate-spin" />
        </div>
      );
    }
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default ExamSubscriptionGuard;
