import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { canEnterAccount } from '../lib/accountAccess';
import { courseHomeFor, FREE_COURSE_HOME } from '../lib/courseEntry.js';

// /start, the home-screen app's start_url (public/manifest.webmanifest) (ACC-07).
//
// The manifest started the installed app at /dashboard, behind SubscriptionGuard:
// a learner whose trial had ended (most accounts) opened the paywall, and the
// promoted "A1.1 free, no account" learner was sent to /login, away from the
// course saved on the device. The launcher goes where this learner can learn,
// by the rules the Navbar and the bottom tabs already use (src/lib/courseEntry.js):
//   - account access (trial, paid period or a bought product) → /dashboard;
//   - signed in without it → their course home (the free A1.1 course unless a
//     placed level is open to them);
//   - no account → the free A1.1 course.
// Pure, so tests/app-launcher.test.mjs can pin it.
export const launchTarget = ({ signedIn, hasAccess, purchases, profile, hasLevelAccess }) => {
  if (!signedIn) return FREE_COURSE_HOME;
  if (canEnterAccount({ hasAccess, purchases })) return '/dashboard';
  return courseHomeFor({ level: profile?.current_level, hasLevelAccess });
};

const AppLauncher = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, purchases, profile, hasLevelAccess, loading: subLoading } = useSubscription();
  const { t } = useTranslation();

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center" role="status">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-rule border-t-siegel animate-spin" aria-hidden="true" />
          <p className="text-graphite">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return <Navigate replace to={launchTarget({ signedIn: Boolean(user), hasAccess, purchases, profile, hasLevelAccess })} />;
};

export default AppLauncher;
