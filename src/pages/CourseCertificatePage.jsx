import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseFor } from '../data/courses/index.js';
import { courseTestDescription } from '../data/courseTests/index.js';
import { curriculumFor, curriculumPath } from '../data/curricula/index.js';
import { programKeyFor } from '../services/lessonService.js';
import { getProgramCompletedAt, getProgramProgress } from '../services/programProgress';
import { flattenCourse, isComplete, courseCertificate, courseComplete, courseHome } from '../lib/courseFlow.js';
import { lessonDateFormat, useLessonLang } from '../lib/lesson/strings.js';
import { useScreenTitle } from '../hooks/useScreenTitle.js';
import Button from '../components/ui/Button.jsx';
import FullPageRedirect from '../components/FullPageRedirect.jsx';

// A printable certificate — only rendered once the course is complete (the
// same program_progress check as the completion page; the URL alone earns
// nothing). Name from the auth profile, falling back to the email.
//
// The page around it (Back, Print, the waiting and sign-in messages) speaks the
// chrome language; the certificate itself keeps its own. Printed, only the
// certificate is left: the site chrome carries `print:hidden`, and nothing here
// or in the shell reserves a screen's height on paper.
//
// TWO LEDGERS (2026-09-19). A REBUILT level (curriculumFor(level) exists —
// A1.1 today) writes progress under programKeyFor(level) (`a11_course`), not
// the legacy 28-day program.programKey, so "complete" here must read the same
// ledger CurriculumHomePage does and count against the same path:
// curriculumPath(curriculum) — Lektionen, checkpoints AND the level-test node
// — with "complete" meaning every node in that path is done, exactly what
// CurriculumHomePage's `firstOpenIndex === -1` means. A level with no
// curriculum module keeps the legacy course.programKey ledger and item count,
// unchanged. docs/course-standard-2026-09-12.md §4 asks for the rebuilt
// certificate to be "labelled kein Goethe/telc-Ergebnis" — this is a
// DeutschMeister participation record, never a Goethe/telc pass.
export default function CourseCertificatePage() {
  const { level } = useParams();
  const curriculum = curriculumFor(level);
  const course = courseFor(level);
  const { user, loading: authLoading } = useAuth();
  const [lang] = useLessonLang();
  const de = lang === 'de';
  useScreenTitle(`${de ? 'Teilnahmebescheinigung' : 'Certificate'} ${String(level || '').toUpperCase()}`, lang);
  const [done, setDone] = useState(() => new Set());
  const [completedAt, setCompletedAt] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const programKey = curriculum ? programKeyFor(level) : course?.programKey;
  const path = useMemo(() => (curriculum ? curriculumPath(curriculum) : []), [curriculum]);
  const items = useMemo(() => (!curriculum && course ? flattenCourse(course) : []), [curriculum, course]);

  useEffect(() => {
    if (!user || !programKey) return undefined;
    let cancelled = false;
    setLoaded(false);
    setFailed(false);
    const ids = (curriculum ? path : items).map((n) => n.id);
    Promise.all([getProgramProgress(user.id, programKey), getProgramCompletedAt(user.id, programKey, ids)])
      .then(([set, at]) => { if (!cancelled) { setDone(set); setCompletedAt(at); setLoaded(true); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [user, programKey, curriculum, path, items]);

  if (!curriculum && !course) return <FullPageRedirect to="/courses/" />;

  const complete = curriculum
    ? path.length > 0 && path.every((n) => done.has(n.id))
    : isComplete(items, done);

  // Never render or print a completion claim before its progress has loaded. Signed out there is no
  // account to read it from — said with the way on; it used to read „wird geprüft …" for ever.
  const guest = !user && !authLoading;
  if (!loaded || failed) return (
    <div className="min-h-screen bg-paper px-4 pb-12 pt-20 text-ink sm:pt-24" lang={lang}>
      <div className="mx-auto max-w-2xl">
        <p role="status">
          {guest
            ? (de ? 'Die Bescheinigung trägt Ihren Namen und gehört zu einem Konto. Melden Sie sich an, um sie zu öffnen.' : 'The certificate carries your name and belongs to an account. Sign in to open it.')
            : failed
              ? (de ? 'Der Fortschritt konnte nicht geladen werden. Bitte versuchen Sie es über den Lernpfad erneut.' : 'Your progress could not be loaded. Please try again from the path.')
              : (de ? 'Ihr Kursfortschritt wird geprüft …' : 'Checking your course progress …')}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {guest && <Button to="/login" state={{ from: { pathname: courseCertificate(level) } }}>{de ? 'Anmelden' : 'Sign in'}</Button>}
          <Link to={courseHome(level)} className="inline-flex min-h-11 items-center font-bold text-siegel hover:text-siegel-deep">{de ? 'Zurück zum Lernpfad' : 'Back to the path'}</Link>
        </div>
      </div>
    </div>
  );
  if (loaded && !complete) return <Navigate to={courseComplete(level)} replace />;

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
  // A rebuilt course speaks German with Sie everywhere, its certificate included. The date is the day the
  // last step was completed; today stands in only when the data carries none.
  const date = lessonDateFormat(curriculum ? 'de' : 'en', { day: 'numeric', month: 'long', year: 'numeric' }).format(completedAt ? new Date(completedAt) : new Date());

  const code = curriculum ? curriculum.code : course.code;
  const testSlug = curriculum ? curriculum.testSlug : course.testSlug;
  const lektionenDone = curriculum ? path.filter((n) => n.kind === 'lektion' && done.has(n.id)).length : 0;
  const lektionenTotal = curriculum ? curriculum.lektionen.length : 0;
  const checkpointsDone = curriculum ? path.filter((n) => n.kind === 'checkpoint' && done.has(n.id)).length : 0;
  const checkpointsTotal = curriculum ? curriculum.checkpoints.length : 0;

  return (
    <div className="min-h-screen bg-paper font-body text-ink print:min-h-0 print:bg-white">
      {/* pt-20: the navbar is fixed (h-16), as on the course home. */}
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-20 sm:pt-24 print:p-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to={courseComplete(level)} className="inline-flex min-h-11 items-center text-sm font-bold text-siegel hover:text-siegel-deep">← {de ? 'Zurück' : 'Back'}</Link>
          <Button onClick={() => window.print()} variant="primary" size="md">{de ? 'Drucken / als PDF speichern' : 'Print / save as PDF'}</Button>
        </div>
        <div lang={curriculum ? 'de' : 'en'} className="rounded-clay border-4 border-siegel bg-white p-5 text-center shadow-raise-lg print:break-inside-avoid print:shadow-none sm:p-14">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-siegel">DeutschMeister</p>
          {curriculum ? (
            <>
              <h1 className="mt-4 font-display text-[1.25rem] font-semibold tracking-[-0.02em] sm:text-[2.125rem]">Teilnahmebescheinigung — DeutschMeister {code}</h1>
              <p className="mt-2 font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-graphite">kein Goethe-/telc-Ergebnis</p>
            </>
          ) : (
            <h1 className="mt-4 font-display text-[1.5rem] font-semibold tracking-[-0.02em] sm:text-[2.5rem]">Certificate of Completion</h1>
          )}
          {curriculum ? (
            // What was completed, and nothing more: the Lektionen and checkpoints
            // done and a passed adapted course assessment. It is not a
            // Goethe/telc result and it does not certify a CEFR level.
            <>
              <p className="mt-8 text-[0.9375rem] text-graphite">Hiermit wird bestätigt, dass</p>
              <p className="mt-2 font-display text-[1.375rem] font-semibold text-ink [overflow-wrap:anywhere] sm:text-[2.125rem]">{loaded ? name : '…'}</p>
              <p className="mt-6 text-[0.9375rem] text-graphite">den DeutschMeister-Kurs</p>
              <p className="mt-2 font-display text-[1.5rem] font-semibold text-ink">Deutsch {code}</p>
              <p className="mt-2 text-[0.9375rem] text-graphite">abgeschlossen hat.</p>
              <p className="mt-3 text-[0.875rem] text-graphite">
                {lektionenDone}/{lektionenTotal} Lektionen · {checkpointsDone}/{checkpointsTotal} Checkpoints · Abschlusstest bestanden. {courseTestDescription(testSlug, 'de')}
              </p>
            </>
          ) : (
            <>
              <p className="mt-8 text-[0.9375rem] text-graphite">This certifies that</p>
              <p className="mt-2 font-display text-[1.375rem] font-semibold text-ink [overflow-wrap:anywhere] sm:text-[2.125rem]">{loaded ? name : '…'}</p>
              {/* Participation, like the rebuilt branch above: the plan's activities are ticked off by
                  the learner, so this states what was worked through — never a level (Codex review,
                  2026-10-14: it used to end by naming the exam's level). */}
              <p className="mt-6 text-[0.9375rem] text-graphite">has worked through all {items.length} activities of the</p>
              <p className="mt-2 font-display text-[1.5rem] font-semibold text-ink">German {code} Course</p>
              <p className="mt-1 text-[0.875rem] text-graphite">grammar, reading, listening, vocabulary and speaking · {courseTestDescription(testSlug, 'en')}</p>
              <p className="mt-3 text-[0.8125rem] text-graphite">A DeutschMeister course certificate: not an official exam result and not a CEFR certificate.</p>
            </>
          )}
          <p className="mt-10 font-data text-[0.75rem] text-graphite">{date} · deutsch-meister.de</p>
        </div>
      </div>
    </div>
  );
}
