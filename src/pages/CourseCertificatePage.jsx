import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { courseFor } from '../data/courses/index.js';
import { getProgramProgress } from '../services/programProgress';
import { flattenCourse, isComplete, courseComplete } from '../lib/courseFlow.js';
import Button from '../components/ui/Button.jsx';

// A printable certificate — only rendered once the course is complete (the
// same program_progress check as the completion page; the URL alone earns
// nothing). Name from the auth profile, falling back to the email.

export default function CourseCertificatePage() {
  const { level } = useParams();
  const course = courseFor(level);
  const { user } = useAuth();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const items = useMemo(() => (course ? flattenCourse(course) : []), [course]);

  useEffect(() => {
    if (!user || !course) return;
    getProgramProgress(user.id, course.programKey).then((set) => { setDone(set); setLoaded(true); });
  }, [user, course]);

  if (!course) return <Navigate to="/courses/" replace />;
  if (loaded && !isComplete(items, done)) return <Navigate to={courseComplete(course.level)} replace />;

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link to={courseComplete(course.level)} className="text-sm font-bold text-siegel hover:text-siegel-deep">← Back</Link>
          <Button onClick={() => window.print()} variant="primary" size="md">Print / save as PDF</Button>
        </div>
        <div className="rounded-clay border-4 border-siegel bg-white p-10 text-center shadow-raise-lg print:shadow-none sm:p-14">
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-siegel">DeutschMeister</p>
          <h1 className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.02em] sm:text-[2.5rem]">Certificate of Completion</h1>
          <p className="mt-8 text-[0.9375rem] text-graphite">This certifies that</p>
          <p className="mt-2 font-display text-[1.75rem] font-semibold text-ink sm:text-[2.125rem]">{loaded ? name : '…'}</p>
          <p className="mt-6 text-[0.9375rem] text-graphite">has completed every lesson of the</p>
          <p className="mt-2 font-display text-[1.5rem] font-semibold text-ink">German {course.code} Course</p>
          <p className="mt-1 text-[0.875rem] text-graphite">{items.length} lessons · grammar, reading, listening, vocabulary and speaking · {course.testFormat} level</p>
          <p className="mt-10 font-data text-[0.75rem] text-graphite">{date} · deutsch-meister.de</p>
        </div>
      </div>
    </div>
  );
}
