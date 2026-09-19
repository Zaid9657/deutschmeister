import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseFor } from '../data/courses/index.js';
import { curriculumFor, curriculumPath } from '../data/curricula/index.js';
import { programKeyFor } from '../services/lessonService.js';
import { getProgramProgress } from '../services/programProgress';
import { flattenCourse, isComplete, courseComplete } from '../lib/courseFlow.js';
import Button from '../components/ui/Button.jsx';

// A printable certificate — only rendered once the course is complete (the
// same program_progress check as the completion page; the URL alone earns
// nothing). Name from the auth profile, falling back to the email.
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

  const complete = curriculum
    ? path.length > 0 && path.every((n) => done.has(n.id))
    : isComplete(items, done);

  if (loaded && !complete) return <Navigate to={courseComplete(level)} replace />;

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const code = curriculum ? curriculum.code : course.code;
  const testFormat = curriculum ? curriculum.examName : course.testFormat;
  const lektionenDone = curriculum ? path.filter((n) => n.kind === 'lektion' && done.has(n.id)).length : 0;
  const lektionenTotal = curriculum ? curriculum.lektionen.length : 0;
  const checkpointsDone = curriculum ? path.filter((n) => n.kind === 'checkpoint' && done.has(n.id)).length : 0;
  const checkpointsTotal = curriculum ? curriculum.checkpoints.length : 0;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link to={courseComplete(level)} className="text-sm font-bold text-siegel hover:text-siegel-deep">← Back</Link>
          <Button onClick={() => window.print()} variant="primary" size="md">Print / save as PDF</Button>
        </div>
        <div className="rounded-clay border-4 border-siegel bg-white p-10 text-center shadow-raise-lg print:shadow-none sm:p-14">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-siegel">DeutschMeister</p>
          {curriculum ? (
            <>
              <h1 className="mt-4 font-display text-[1.75rem] font-semibold tracking-[-0.02em] sm:text-[2.125rem]">Teilnahmebescheinigung — DeutschMeister {code}</h1>
              <p className="mt-2 font-data text-[0.75rem] font-bold uppercase tracking-[0.13em] text-graphite">kein Goethe-/telc-Ergebnis</p>
            </>
          ) : (
            <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.02em] sm:text-[2.5rem]">Certificate of Completion</h1>
          )}
          <p className="mt-8 text-[0.9375rem] text-graphite">This certifies that</p>
          <p className="mt-2 font-display text-[1.75rem] font-semibold text-ink sm:text-[2.125rem]">{loaded ? name : '…'}</p>
          <p className="mt-6 text-[0.9375rem] text-graphite">has completed every lesson of the</p>
          <p className="mt-2 font-display text-[1.5rem] font-semibold text-ink">German {code} Course</p>
          {curriculum ? (
            <p className="mt-1 text-[0.875rem] text-graphite">{lektionenDone}/{lektionenTotal} Lektionen · {checkpointsDone}/{checkpointsTotal} checkpoints · {testFormat} level</p>
          ) : (
            <p className="mt-1 text-[0.875rem] text-graphite">{items.length} lessons · grammar, reading, listening, vocabulary and speaking · {testFormat} level</p>
          )}
          <p className="mt-10 font-data text-[0.75rem] text-graphite">{date} · deutsch-meister.de</p>
        </div>
      </div>
    </div>
  );
}
