import { useParams, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { canOpenGuidedCourseItem, A11_PRODUCT_KEY, A11_PREVIEW_LESSONS } from '../lib/guidedCourseAccess.js';
import { LEVEL_COURSES } from '../data/pricing.js';
import A11PreviewComplete from './course/A11PreviewComplete.jsx';

// Entitlement guard for the guided course routes (/course/:level/**). Sits
// INSIDE LevelSubscriptionGuard: that guard decides whether the LEVEL is
// reachable (free level / subscription / level course), this one decides
// whether the guided-course ITEM is inside the DeutschStart A1.1 preview
// (home + lessons 1–3) or needs the €39 purchase / an active subscription.
// Only A1.1 has a preview policy — every other level passes straight through.
//
// It renders a course-specific paywall rather than redirecting to the generic
// subscription page: the learner was mid-course, so the unlock they are shown
// is the course they were walking, not a plan comparison table.
const GuidedCourseGuard = ({ kind, children }) => {
  const { level: levelParam, nr } = useParams();
  const level = String(levelParam || '').toLowerCase();
  const { user, loading: authLoading } = useAuth();
  const { hasProduct, hasActiveSubscription, loading: subLoading } = useSubscription();

  // The preview policy only bites on a1.1; skip the loading gate elsewhere.
  if (level !== 'a1.1') return children;

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-rule border-t-siegel animate-spin motion-reduce:animate-none" />
          <p className="text-graphite">Loading…</p>
        </div>
      </div>
    );
  }

  const allowed = canOpenGuidedCourseItem({
    level,
    kind,
    nr,
    ownsCourse: hasProduct(A11_PRODUCT_KEY),
    hasSubscription: hasActiveSubscription(),
  });
  if (allowed) return children;

  const course = LEVEL_COURSES[A11_PRODUCT_KEY];
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-siegel-wash text-siegel">
          <Lock className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-[1.75rem] font-semibold leading-tight sm:text-[2.25rem]">
          Your free preview ends here
        </h1>
        <p className="mt-3 text-[0.9375rem] text-graphite sm:text-base">
          The first {A11_PREVIEW_LESSONS} lessons of {course.name} are free. This part of the
          course — every later lesson, the checkpoints, the final test and your certificate —
          opens with the full course.
        </p>
        {/* The same purchase bridge the third preview lesson ends on — one
            offer, one wording, whichever way the learner reaches the wall. */}
        <div className="mt-6 w-full">
          <A11PreviewComplete source="locked-lesson" variant="locked" />
        </div>
        <p className="mt-6 text-sm text-graphite">
          {!user && (
            <>
              Already bought it?{' '}
              <Link to="/login" className="font-bold text-siegel hover:text-siegel-deep">Sign in</Link>
              {' · '}
            </>
          )}
          <Link to={`/course/${level}`} className="font-bold text-siegel hover:text-siegel-deep">Back to the course</Link>
        </p>
      </div>
    </div>
  );
};

export default GuidedCourseGuard;
