import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Trophy, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { courseFor } from '../data/courses/index.js';
import { curriculumFor, curriculumPath } from '../data/curricula/index.js';
import { stationFor, stationStatusLine, ticketLines } from '../data/offers.js';
import { productKeyForLevel } from '../data/pricing.js';
import { LEMONSQUEEZY_CONFIG } from '../config/lemonsqueezy.js';
import { setBuyIntent } from '../lib/buyIntent.js';
import { track } from '../lib/analytics';
import { programKeyFor } from '../services/lessonService.js';
import { getProgramProgress } from '../services/programProgress';
import { flattenCourse, isComplete, percentDone, courseHome, courseCertificate } from '../lib/courseFlow.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';
import FullPageRedirect from '../components/FullPageRedirect.jsx';

// The end of the path: the one screen that may celebrate (design rule 2 —
// himbeer only for a completed goal). Hands the learner to the final test if
// not yet taken, to the next level, and to a printable certificate.
//
// TWO LEDGERS (2026-09-19), same split as CourseCertificatePage.jsx: a
// REBUILT level (curriculumFor(level) exists — A1.1 today) reads progress
// under programKeyFor(level) and counts against curriculumPath(curriculum) —
// Lektionen, checkpoints and the level-test node, "complete" meaning every
// node is done (mirrors CurriculumHomePage). A level with no curriculum
// module keeps the legacy course.programKey ledger, unchanged.
//
// WHAT'S NEXT (2026-10-25). The card used to tell every rebuilt level that the
// next one was "a paused draft" — written while A1.2 was one; A1.2 has been a
// live course since 2026-10-22, and A2.1 (after A1.2) has its 28-day course. So
// the next step is derived from the registries for both ledgers (nextStepFor):
// the next course itself for a learner who may open it, its ticket for everyone
// else — price and lines from offers.js/pricing.js, never retyped, Buy through
// the buy-intent path — and the draft sentence only where no course exists yet.

/**
 * What follows `level` on the ladder and how this learner gets there. Pure: the
 * registries in, a plain object out (tests/course-certificate.test.mjs runs it).
 *   continue — the next level has a course (rebuilt or 28-day) the learner may open;
 *   offer    — it has a course the learner does not have yet: its station and first ticket line;
 *   draft    — it has no course yet: the library is open today.
 */
export function nextStepFor(level, hasLevelAccess) {
  const next = courseFor(level)?.next || null;
  if (!next) return null;
  if (!curriculumFor(next) && !courseFor(next)) return { kind: 'draft', level: next };
  if (typeof hasLevelAccess === 'function' && hasLevelAccess(next)) return { kind: 'continue', level: next, to: courseHome(next) };
  const station = stationFor(next);
  return {
    kind: 'offer',
    level: next,
    station,
    ticket: ticketLines(next)[0] || null,
    productKey: productKeyForLevel(next),
    coursePage: station ? station.coursePage : null,
  };
}

export default function CourseCompletePage() {
  const { level } = useParams();
  const curriculum = curriculumFor(level);
  const course = courseFor(level);
  const { user } = useAuth();
  const { hasLevelAccess, loading: subLoading } = useSubscription() || {};
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);

  const programKey = curriculum ? programKeyFor(level) : course?.programKey;
  const path = useMemo(() => (curriculum ? curriculumPath(curriculum) : []), [curriculum]);
  const items = useMemo(() => (!curriculum && course ? flattenCourse(course) : []), [curriculum, course]);

  useEffect(() => {
    if (!user || !programKey) return;
    getProgramProgress(user.id, programKey).then((set) => { setDone(set); setLoaded(true); });
  }, [user, programKey]);

  if (!curriculum && !course) return <FullPageRedirect to="/courses/" />;

  const code = curriculum ? curriculum.code : course.code;
  const complete = curriculum
    ? path.length > 0 && path.every((n) => done.has(n.id))
    : isComplete(items, done);
  const pct = curriculum
    ? (path.length ? Math.round((path.filter((n) => done.has(n.id)).length / path.length) * 100) : 0)
    : percentDone(items, done);
  const xp = curriculum
    ? path.filter((n) => done.has(n.id)).reduce((n, it) => n + (it.minutes || 10), 0)
    : items.filter((it) => done.has(it.id)).reduce((n, it) => n + (it.minutes || 10), 0);
  const lektionenDone = curriculum ? path.filter((n) => n.kind === 'lektion' && done.has(n.id)).length : 0;
  const lektionenTotal = curriculum ? curriculum.lektionen.length : 0;
  const checkpointsDone = curriculum ? path.filter((n) => n.kind === 'checkpoint' && done.has(n.id)).length : 0;
  const checkpointsTotal = curriculum ? curriculum.checkpoints.length : 0;
  const wordsTotal = curriculum ? curriculum.lektionen.reduce((s, l) => s + (l.wortfeld?.length || 0), 0) : 0;
  // Entitlements decide between the course and its offer: none is shown until they have loaded,
  // so a buyer is never offered the level they own.
  const step = subLoading ? null : nextStepFor(level, hasLevelAccess);
  const nextCode = (step?.level || course?.next || '').toUpperCase();
  const checkoutReady = step?.kind === 'offer' && Boolean(LEMONSQUEEZY_CONFIG.levelCourses[step.productKey]?.variantId);
  // Signed out, the Buy click is remembered and resumed after sign-up (src/lib/buyIntent.js).
  const buyNext = () => {
    track('checkout_intent', { product: step.productKey, surface: 'course_complete', level: step.level, signed_in: Boolean(user) });
    if (!user) setBuyIntent(step.productKey);
  };
  const testSlug = curriculum ? curriculum.testSlug : course.testSlug;
  const testFormat = curriculum ? curriculum.examName : course.testFormat;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="relative overflow-hidden rounded-clay">
          <Aurora />
          <div className="relative px-2 py-6 text-center">
            <Reveal><span className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${complete ? 'bg-accent-himbeer text-ink shadow-raise-himbeer' : 'bg-siegel-wash text-siegel'}`}><Trophy className="h-12 w-12" /></span></Reveal>
            <Reveal as="h1" delay={80} className="mt-6 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.022em] sm:text-[2.75rem]">
              {complete ? `German ${code}: complete.` : `German ${code}: ${pct}% done`}
            </Reveal>
            <Reveal as="p" delay={120} className="mt-3 text-[0.9375rem] text-graphite sm:text-base">
              {complete
                ? `Every lesson on the path is done — ${xp} XP earned. Two things are left: prove it, and keep going.`
                : loaded ? 'A few lessons on the path are still open. Finish them and this page turns into your certificate.' : 'Loading…'}
            </Reveal>
            {curriculum && (
              <Reveal as="p" delay={140} className="mt-2 font-data text-[0.75rem] text-graphite">
                {lektionenDone}/{lektionenTotal} Lektionen · {checkpointsDone}/{checkpointsTotal} checkpoints · {wordsTotal} words met
              </Reveal>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Reveal>
            <Card raised className="flex h-full flex-col p-5">
              <h2 className="font-bold text-ink">Final test · {testFormat} format</h2>
              <p className="mt-1 flex-1 text-[0.875rem] text-graphite">Timed, half exam length, scored against the real pass threshold.</p>
              <Button to={`/modelltest/${testSlug}`} variant="primary" size="md" className="mt-4">Take the final test <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Card>
          </Reveal>
          <Reveal delay={60}>
            <Card raised className="flex h-full flex-col p-5">
              <h2 className="font-bold text-ink">Certificate of completion</h2>
              <p className="mt-1 flex-1 text-[0.875rem] text-graphite">{complete ? 'Your name, the level and today’s date. Print it or save it as PDF.' : 'Unlocks when the path is complete.'}</p>
              {complete ? (
                <Button to={courseCertificate(level)} variant="celebrate" size="md" className="mt-4"><Award className="mr-1 h-4 w-4" /> Open certificate</Button>
              ) : (
                <Button to={courseHome(level)} variant="secondary" size="md" className="mt-4">Back to the path</Button>
              )}
            </Card>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-6">
          <Card className="p-5" data-next-step={step?.kind || 'loading'}>
            {step?.kind === 'draft' ? (
              <>
                <h2 className="font-bold text-ink">What's next</h2>
                <p className="mt-1 text-[0.875rem] text-graphite">The next level is a paused draft, not a guided course yet — the full course library is open today.</p>
                <div className="mt-3">
                  <Link to="/courses/" className="font-bold text-siegel hover:text-siegel-deep" reloadDocument>All courses →</Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-bold text-ink">Next: German {nextCode}</h2>
                {step?.kind === 'continue' && (
                  <>
                    <p className="mt-1 text-[0.875rem] text-graphite">The next course continues the same path.</p>
                    <div className="mt-3">
                      <Link to={step.to} className="font-bold text-siegel hover:text-siegel-deep">Go to {nextCode} →</Link>
                    </div>
                  </>
                )}
                {step?.kind === 'offer' && (
                  <>
                    {step.ticket && (
                      <>
                        <p className="mt-2 text-[0.9375rem] font-bold text-ink">{step.ticket.title}</p>
                        <p className="mt-1 text-[0.875rem] leading-relaxed text-graphite">{step.ticket.body}</p>
                      </>
                    )}
                    {step.station && <p className="mt-2 font-data text-[0.75rem] text-graphite">{stationStatusLine(step.station)}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {checkoutReady && (
                        <Button to={`/subscription?buy=${step.productKey}`} onClick={buyNext} variant="primary" size="md">
                          Buy {nextCode} · {step.station.priceLabel}
                        </Button>
                      )}
                      {step.coursePage && (
                        <a href={step.coursePage} className="font-bold text-siegel hover:text-siegel-deep">See {nextCode} →</a>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
