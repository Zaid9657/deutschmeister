import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Trophy, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { courseFor } from '../data/courses/index.js';
import { curriculumFor, curriculumPath } from '../data/curricula/index.js';
import { programKeyFor } from '../services/lessonService.js';
import { getProgramProgress } from '../services/programProgress';
import { flattenCourse, isComplete, percentDone, courseHome, courseCertificate } from '../lib/courseFlow.js';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Aurora from '../components/ui/Aurora.jsx';

// The end of the path: the one screen that may celebrate (design rule 2 —
// himbeer only for a completed goal). Hands the learner to the final test if
// not yet taken, to the next level, and to a printable certificate.
//
// TWO LEDGERS (2026-09-19), same split as CourseCertificatePage.jsx: a
// REBUILT level (curriculumFor(level) exists — A1.1 today) reads progress
// under programKeyFor(level) and counts against curriculumPath(curriculum) —
// Lektionen, checkpoints and the level-test node, "complete" meaning every
// node is done (mirrors CurriculumHomePage). A level with no curriculum
// module keeps the legacy course.programKey ledger, unchanged. The "next
// level" card for a rebuilt level never links straight to the next level's
// course player — A1.2 is a paused draft (DRAFT_CURRICULA, not CURRICULA;
// owner decision 2026-09-13) — it links to "All courses" instead.
export default function CourseCompletePage() {
  const { level } = useParams();
  const curriculum = curriculumFor(level);
  const course = courseFor(level);
  const { user } = useAuth();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);

  const programKey = curriculum ? programKeyFor(level) : course?.programKey;
  const path = useMemo(() => (curriculum ? curriculumPath(curriculum) : []), [curriculum]);
  const items = useMemo(() => (!curriculum && course ? flattenCourse(course) : []), [curriculum, course]);

  useEffect(() => {
    if (!user || !programKey) return;
    getProgramProgress(user.id, programKey).then((set) => { setDone(set); setLoaded(true); });
  }, [user, programKey]);

  if (!curriculum && !course) return <Navigate to="/courses/" replace />;

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
  const nextCourse = curriculum ? null : courseFor(course.next);
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
          <Card className="p-5">
            {curriculum ? (
              <>
                <h2 className="font-bold text-ink">What's next</h2>
                <p className="mt-1 text-[0.875rem] text-graphite">The next level is a paused draft, not a guided course yet — the full course library is open today.</p>
                <div className="mt-3">
                  <Link to="/courses/" className="font-bold text-siegel hover:text-siegel-deep" reloadDocument>All courses →</Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-bold text-ink">Next: German {course.next.toUpperCase()}</h2>
                <p className="mt-1 text-[0.875rem] text-graphite">
                  {nextCourse ? 'The next course continues the same path.' : 'The next level is being rebuilt as a guided course; its library is open today.'}
                </p>
                <div className="mt-3">
                  {nextCourse
                    ? <Link to={courseHome(nextCourse.level)} className="font-bold text-siegel hover:text-siegel-deep">Go to {nextCourse.code} →</Link>
                    : <a href={`/courses/${course.next.replace('.', '-')}/`} className="font-bold text-siegel hover:text-siegel-deep">See {course.next.toUpperCase()} →</a>}
                </div>
              </>
            )}
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
