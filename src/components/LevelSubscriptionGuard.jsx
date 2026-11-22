import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree, beyondFreeLektionen } from '../config/freeTier';
import { useTranslation } from 'react-i18next';
import { ownsExamProgramme, hasExamPracticeAccess } from '../data/pricing.js';
import LockedContentOverlay from './LockedContentOverlay';

const LevelSubscriptionGuard = ({ children, level: levelProp, programme }) => {
  const { level: levelParam } = useParams();
  // `level` is normally a route param (/level/:level, /reading/:level, …); a
  // route with no such param (e.g. /start-deutsch-1-kurs, gated on the A1
  // band's top sublevel) passes it as a prop instead.
  const level = levelProp || levelParam;
  const { user, loading: authLoading } = useAuth();
  const { hasLevelAccess, hasFullCourse, purchases, loading: subLoading } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();

  // A course step past the level's free Lektion(en): the level being free is
  // not enough there (Lektion gate, src/config/freeTier.js; off = never true).
  const gated = beyondFreeLektionen(location.pathname);

  // Free levels are accessible to everyone — no auth needed
  if (isLevelFree(level) && !gated) {
    return children;
  }

  // For non-free levels, check auth and subscription
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-rule border-t-siegel animate-spin" />
          <p className="text-graphite">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Not logged in — show signup prompt instead of redirecting
  if (!user) {
    return <LockedContentOverlay level={level} />;
  }

  // Logged in but neither subscription/trial nor a level course covering it
  if (gated ? !hasFullCourse(level) : !hasLevelAccess(level) && !ownsExamProgramme(purchases, programme)
    && !(/^\/(?:reading|listening)\//.test(location.pathname) && hasExamPracticeAccess(purchases, level))) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default LevelSubscriptionGuard;
