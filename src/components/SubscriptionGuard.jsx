import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { trackPaywallShown } from '../lib/funnelTracking';

const SubscriptionGuard = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !subLoading && user && !hasAccess) {
      trackPaywallShown(location.pathname);
    }
  }, [authLoading, subLoading, user, hasAccess, location.pathname]);

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default SubscriptionGuard;
