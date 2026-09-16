import { Link } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { LEVEL_COURSES, eur } from '../../data/pricing.js';
import { COURSE_SPEAKING_MINUTES, COURSE_MISSION_ATTEMPTS } from '../../data/marketing.js';
import { A11_PRODUCT_KEY } from '../../lib/guidedCourseAccess.js';
import { setBuyIntent } from '../../lib/buyIntent.js';
import { trackA11CheckoutStarted, trackA11OfferViewed } from '../../lib/funnelTracking.js';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

// The purchase bridge of the DeutschStart A1.1 funnel (2026-09-15 launch
// plan Task 2): shown when the third preview lesson is finished, and again
// on the locked lesson the learner walks into next. It names what they can
// ALREADY do before it names the price — the preview is the proof, so the
// offer follows the result rather than interrupting it.
//
// Every figure derives (price, speaking minutes, included attempts); nothing
// here is retyped. The attribution `source` rides the existing buy-intent
// mechanism and is normalized to the closed set in src/lib/a11Funnel.js.
export default function A11PreviewComplete({ source = 'preview-complete', variant = 'complete' }) {
  const course = LEVEL_COURSES[A11_PRODUCT_KEY];
  const remainingLessons = 12 - (course.previewLessons || 3);

  const startCheckout = () => {
    setBuyIntent(A11_PRODUCT_KEY, source);
    trackA11CheckoutStarted(source);
  };

  return (
    <Card className="mx-auto max-w-lg p-6 text-center" onMouseEnter={() => trackA11OfferViewed({ source })}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-clay bg-siegel-wash text-siegel">
        {variant === 'locked' ? <Lock className="h-7 w-7" aria-hidden="true" /> : <CheckCircle2 className="h-7 w-7" aria-hidden="true" />}
      </span>

      <h2 className="mt-4 font-display text-[1.5rem] font-semibold leading-tight text-ink">
        You completed the free route.
      </h2>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">
        You can now introduce yourself, give personal details and order in a café.
      </p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">
        Continue through {remainingLessons} more real-life situations, 4 checkpoints and the final assessment.
      </p>

      <div className="mt-6">
        <Button href={`/courses/a1-1/?source=${encodeURIComponent(source)}`} onClick={startCheckout} variant="primary" size="lg" shimmer className="w-full">
          Unlock DeutschStart A1.1 — {eur(course.price)} once
        </Button>
      </div>

      <ul className="mt-4 space-y-1 text-left text-[0.8125rem] text-graphite">
        <li>· Lifetime access to the guided course — no subscription</li>
        <li>· {COURSE_MISSION_ATTEMPTS} included speaking missions + {COURSE_SPEAKING_MINUTES} permanent speaking minutes</li>
        <li>· 30-day voluntary refund, on top of your statutory rights</li>
      </ul>

      <p className="mt-5 text-sm">
        <Link to="/course/a1.1" className="font-bold text-siegel hover:text-siegel-deep">Review my free lessons</Link>
      </p>
    </Card>
  );
}
