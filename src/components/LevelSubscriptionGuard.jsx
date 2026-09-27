import { useParams, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
// Namespace import: COURSE_V2_LIVE belongs to the v2 routes' config; a list it
// does not (yet) export reads as "no level is live in v2".
import * as courseV2Config from '../config/courseV2.js';
import { useTranslation } from 'react-i18next';
import LockedContentOverlay from './LockedContentOverlay';

// The course v2 routes (docs/course-v2/ENTITLEMENT.md): the v2 course home
// /course/:level/v2, the unit player /course/:level/u/:nr and the Plateau
// /course/:level/p/:nr. They are gated on hasCourseAccess(level) — free level
// or a bought course, trial/Pro only if V2_TRIAL_PRO_OPENS_PAID — while every
// other level route keeps hasLevelAccess(level).
const COURSE_V2_PATH_RE = /^\/course\/[^/]+\/(?:v2|u\/[^/]+|p\/[^/]+)\/?$/;
// /course/:level itself renders v2 once its level is in COURSE_V2_LIVE.
const COURSE_HOME_PATH_RE = /^\/course\/[^/]+\/?$/;

const isCourseV2Path = (pathname, level) => {
  if (COURSE_V2_PATH_RE.test(pathname || '')) return true;
  const live = Array.isArray(courseV2Config.COURSE_V2_LIVE) ? courseV2Config.COURSE_V2_LIVE : [];
  return COURSE_HOME_PATH_RE.test(pathname || '') && live.includes((level || '').toLowerCase());
};

const LevelSubscriptionGuard = ({ children, level: levelProp, courseV2: courseV2Prop }) => {
  const { level: levelParam } = useParams();
  // `level` is normally a route param (/level/:level, /reading/:level, …); a
  // route with no such param (e.g. /start-deutsch-1-kurs, gated on the A1
  // band's top sublevel) passes it as a prop instead.
  const level = levelProp || levelParam;
  const { user, loading: authLoading } = useAuth();
  const { hasLevelAccess, hasCourseAccess, loading: subLoading } = useSubscription();
  const location = useLocation();
  const { t } = useTranslation();

  // Free levels are accessible to everyone — no auth needed
  if (isLevelFree(level)) {
    return children;
  }

  // DEV ONLY: `?preview` opens a v2 route signed out on the Vite dev server, so the
  // player can be clicked through against the compiled fixture without an account
  // (docs/course-v2/E1-client.md). import.meta.env.DEV is false in every production
  // build, so this branch does not exist there.
  if (import.meta.env.DEV && COURSE_V2_PATH_RE.test(location.pathname || '') && new URLSearchParams(location.search).has('preview')) {
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

  // A v2 course route asks the v2 question; every other route the legacy one
  // (neither subscription/trial nor a level course covering it → locked).
  const courseV2 = typeof courseV2Prop === 'boolean' ? courseV2Prop : isCourseV2Path(location.pathname, level);
  const allowed = courseV2 ? hasCourseAccess(level) : hasLevelAccess(level);
  if (!allowed) {
    return <Navigate to="/subscription" state={{ from: location }} replace />;
  }

  return children;
};

export default LevelSubscriptionGuard;
