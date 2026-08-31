import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { trackPaywallShown } from '../lib/funnelTracking';

// SubscriptionGuard's sibling for one-time product entitlements: same loading
// and redirect skeleton, but the gate is hasProduct(productKey) — a purchased
// course stays reachable for life even after its included Pro window expires.
const PurchaseGuard = ({ productKey, redirectTo = '/subscription', children }) => {
  const { user, loading: authLoading } = useAuth();
  const { hasProduct, loading: subLoading } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();

  const owned = hasProduct(productKey);

  useEffect(() => {
    if (!authLoading && !subLoading && user && !owned) {
      trackPaywallShown(location.pathname);
    }
  }, [authLoading, subLoading, user, owned, location.pathname]);

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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!owned) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

export default PurchaseGuard;
