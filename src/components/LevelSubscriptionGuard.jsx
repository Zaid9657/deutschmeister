import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import { useTranslation } from 'react-i18next';
import LockedContentOverlay from './LockedContentOverlay';

const LevelSubscriptionGuard = ({ children }) => {
  const { level } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();

  // Free levels are accessible to everyone — no auth needed
  if (isLevelFree(level)) {
    return children;
  }

  // For non-free levels, check auth and subscription
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Not logged in — show signup prompt instead of redirecting
  if (!user) {
    return <LockedContentOverlay level={level} />;
  }

  // Logged in but no subscription/trial
  if (!hasAccess) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default LevelSubscriptionGuard;
