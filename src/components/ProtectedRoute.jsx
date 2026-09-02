import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (loading) {
    // Same spinner as SubscriptionGuard, on the same tokens. This one kept a
    // retired-brand amber border-top long after the migration, because
    // APP_CHROME never listed this file and RETIRED_STOP only matched gradient
    // stops, not a border utility. Both gaps are closed in tests/brand.test.mjs;
    // this is the file they were missing. (The retired class is deliberately
    // not spelled out here — Tailwind's scanner does not parse comments, so
    // quoting one is enough to emit it back into the built CSS.)
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center" role="status">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-rule border-t-siegel animate-spin" aria-hidden="true" />
          <p className="text-graphite">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
