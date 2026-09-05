import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import { useTranslation } from 'react-i18next';
import LockedContentOverlay from './LockedContentOverlay';

const LevelSubscriptionGuard = ({ children, level: levelProp }) => {
  const { level: levelParam } = useParams();
  // `level` is normally a route param (/level/:level, /reading/:level, …); a
  // route with no such param (e.g. /start-deutsch-1-kurs, gated on the A1
  // band's top sublevel) passes it as a prop instead.
  const level = levelProp || levelParam;
  const { user, loading: authLoading } = useAuth();
  const { hasLevelAccess, loading: subLoading } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();

  // Free levels are accessible to everyone — no auth needed
  if (isLevelFree(level)) {
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
  if (!hasLevelAccess(level)) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default LevelSubscriptionGuard;
