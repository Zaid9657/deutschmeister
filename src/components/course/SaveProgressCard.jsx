import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { coursePath as coursePathOf, rememberPlace, saveProgressSignupHref } from '../../lib/course/saveProgressAsk.js';

// "Fortschritt speichern — kostenlos": the ask a signed-out learner sees on the
// recap, after they have finished a Lektion (P4, "first lesson before
// sign-up"). Since 2026-10-06 the same ask also comes once after the first
// checked answer (SaveProgressAsk.jsx; the rule is in
// src/lib/course/saveProgressAsk.js). Everything they just did is already in
// localStorage (src/lib/course/localProgress.js) and is merged into their
// account on the first render after sign-in, so this card promises nothing the
// code does not do — and it is not a wall: the next Lektion stays open either
// way.
//
// The signup door is a plain href with the on-site door tag
// `ref=save-progress-recap` (a router <Link> would drop the tag:
// public/attribution.js reads it on a page load). The click remembers the
// course home (src/lib/returnPath.js), and postAuthPath returns there after
// the confirmation e-mail, where the merge runs. It used to hand /signup a
// `?redirect=` and a `state.from` that SignupPage never read, so a learner who
// signed up from here landed on /dashboard. The login link keeps `state.from`,
// which LoginPage honours.
//
// Copy comes from the lesson string table in the chrome language (English by
// default, Deutsch-Modus on the toggle) — the card sits on the recap screen.

export default function SaveProgressCard({ level }) {
  const [lang] = useLessonLang();
  const coursePath = coursePathOf(level);

  return (
    <Card raised edge="siegel" className="mt-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel">
          <Save className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{t('save.title', lang)}</p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-graphite">
            {t('save.body', lang)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button href={saveProgressSignupHref({ door: 'recap', level })} onClick={() => rememberPlace({ level })} variant="primary" size="md">
              {t('save.cta', lang)}
            </Button>
            <Link
              to="/login"
              state={{ from: { pathname: coursePath } }}
              className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-siegel hover:text-siegel-deep"
            >
              {t('save.haveAccount', lang)}
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
