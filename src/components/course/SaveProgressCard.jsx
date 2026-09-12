import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

// "Fortschritt speichern — kostenlos": the one ask a signed-out learner sees,
// and only AFTER they have finished a Lektion (P4, "first lesson before
// sign-up"). Everything they just did is already in localStorage
// (src/lib/course/localProgress.js) and is merged into their account on the
// first render after sign-in, so this card promises nothing the code does not
// do — and it is not a wall: the next Lektion stays open either way.
//
// The destination carries the course home twice, because the SPA has two
// post-auth conventions and neither is ours to change from here:
//   * `?redirect=<path>` — the spelling P4 specifies, and what a human reads
//     in the URL. SignupPage does not honour it yet (it always goes to
//     /verify-email); wiring it is an integrator step, noted in the P4 report.
//   * `state.from` — what LoginPage already honours
//     (`location.state?.from?.pathname`), so a learner who signs up, confirms
//     and then logs in lands back on the course.
// Either way the merge does not depend on the redirect: it runs wherever the
// learner next opens the course.

export default function SaveProgressCard({ level }) {
  const coursePath = `/course/${level}`;
  const to = { pathname: '/signup', search: `?redirect=${encodeURIComponent(coursePath)}` };

  return (
    <Card raised edge="siegel" className="mt-4 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel">
          <Save className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">Fortschritt speichern — kostenlos</p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-graphite">
            Diese Lektion liegt gerade nur in diesem Browser. Mit einem kostenlosen Konto bleibt sie
            erhalten — auf dem Handy, am Laptop, und mit der Wiederholung zur richtigen Zeit.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button to={to} state={{ from: { pathname: coursePath } }} variant="primary" size="md">
              Fortschritt speichern
            </Button>
            <Link
              to="/login"
              state={{ from: { pathname: coursePath } }}
              className="font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-siegel hover:text-siegel-deep"
            >
              Ich habe schon ein Konto
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
