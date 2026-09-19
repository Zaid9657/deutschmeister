import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { readCourseContext, courseHome, courseLesson } from '../lib/courseFlow.js';

// The way back into a course from any SPA screen a lesson opened. Reads the
// sessionStorage context the lesson screen wrote; hidden on the course pages
// themselves. "Done → next" lands on the lesson page with ?done=1, which
// records the progress and advances — the bar itself writes nothing.
// astro-site/src/layouts/Layout.astro renders the same bar for the static
// grammar lessons.
//
// Two writers, two shapes. The legacy per-item course (CourseLessonPage)
// writes itemId/position/total and "Done → next" is the ?done=1 hop above.
// The rebuilt lesson engine (SpeakingStage, Wave 8) writes `returnTo` — the
// stage URL the learner left — and NO position; for that shape the primary
// action is simply the way back to the stage, because the stage itself
// records completion when its items are done. Sending that context through
// courseLesson() produced /course/a1.1/<lektion id>?done=1 — a legacy lesson
// page that never existed for a rebuilt level.

export default function CourseReturnBar() {
  const { pathname } = useLocation();
  const [ctx, setCtx] = useState(null);
  useEffect(() => { setCtx(readCourseContext()); }, [pathname]);
  if (!ctx || pathname.startsWith('/course/')) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <Link to={courseHome(ctx.level)} className="inline-flex items-center gap-1 text-sm font-bold text-siegel hover:text-siegel-deep"><ArrowLeft className="h-4 w-4" /> {ctx.code}</Link>
        <p className="min-w-0 flex-1 truncate text-[0.8125rem] text-graphite">{ctx.position ? <><span className="font-data">{ctx.position}/{ctx.total}</span> · </> : null}{ctx.title}</p>
        {ctx.returnTo ? (
          <Link to={ctx.returnTo} className="inline-flex items-center gap-1.5 rounded-clay bg-siegel px-4 py-2 text-sm font-bold text-white shadow-raise-siegel transition-all hover:bg-siegel-lift active:translate-y-1 active:shadow-none">
            Zurück zur Lektion <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
          </Link>
        ) : (
          <Link to={`${courseLesson(ctx.level, ctx.itemId)}?done=1`} className="inline-flex items-center gap-1.5 rounded-clay bg-siegel px-4 py-2 text-sm font-bold text-white shadow-raise-siegel transition-all hover:bg-siegel-lift active:translate-y-1 active:shadow-none">
            <Check className="h-4 w-4" /> Done → next
          </Link>
        )}
      </div>
    </div>
  );
}
