import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Flame, Zap } from 'lucide-react';

// The course home's sticky top bar (under the site Navbar, which is fixed at h-16):
// back to all courses, the level chip, the streak, the XP total and — once the
// learner has finished a unit — the words of the finished units. The numbers come
// from the game ledger (useCourseGame) and the manifest; nothing here is a usage
// count of other learners.
export default function TopBar({ code, streak = 0, totalXp = 0, words = 0 }) {
  return (
    <div className="sticky top-16 z-30 border-b-2 border-game-line bg-white">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-1">
          <Link
            to="/courses/"
            aria-label="Alle Kurse"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-xl text-game-muted hover:bg-course-wash hover:text-course-ink"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
          </Link>
          <span className="rounded-xl border-2 border-game-line px-3 py-1 text-[0.9375rem] font-black text-course-ink">{code}</span>
        </div>
        <p className="flex items-center gap-1.5" title="Lerntage in Folge">
          <Flame className="h-6 w-6 fill-game-flame text-game-flame-edge" strokeWidth={1.8} aria-hidden="true" />
          <span className="text-[1.1875rem] font-black text-game-flame-edge">{streak}</span>
          <span className="sr-only">{streak === 1 ? 'Lerntag' : 'Lerntage'} in Folge</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Zap className="h-6 w-6 fill-game-xp text-game-xp-edge" strokeWidth={1.8} aria-hidden="true" />
          <span className="text-[1.1875rem] font-black text-game-xp-ink">{totalXp} XP</span>
        </p>
        {words > 0 && (
          <p className="hidden items-center gap-1.5 min-[360px]:flex">
            <BookOpen className="h-6 w-6 text-course" strokeWidth={2.4} aria-hidden="true" />
            <span className="text-[1.1875rem] font-black text-course-ink">{words}<span className="sr-only sm:not-sr-only"> Wörter</span></span>
          </p>
        )}
      </div>
    </div>
  );
}
