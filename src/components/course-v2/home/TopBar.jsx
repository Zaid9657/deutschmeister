import { Link } from 'react-router-dom';
import { Check, Flame, HelpCircle, Timer, Zap } from 'lucide-react';
import { courseGame } from '../../../data/design-tokens.js';

// The learn screen's sticky top bar (under the site Navbar, which is fixed at h-16),
// Duolingo's four things and nothing else: the level chip (a tap goes to all courses),
// the streak, the XP total and a small ring for today's goal (pathModel.goalRing: minutes
// today of the pace's minutes per learning day). The numbers come from the game ledger
// (useCourseGame); nothing here is a usage count of other learners.
// Since the tour (2026-10-01) the three numbers sit in one group, `data-tour="stats"` (the
// coach marks' last spotlight), and on the right a help button („So funktioniert’s",
// lucide HelpCircle — the icon later lucide releases call CircleHelp — 44 px) replays the
// structure screens and the coach marks; its label comes from the page in the chrome language.
export default function TopBar({ code, streak = 0, totalXp = 0, ring, onHelp = null, helpLabel = '', helpRef = null }) {
  const g = ring || { pct: 0, reached: false, label: '' };
  const fill = { background: `conic-gradient(var(--c-primary) 0 ${g.pct}%, ${courseGame.locked} ${g.pct}% 100%)` };
  return (
    <div className="sticky top-16 z-30 border-b-2 border-game-line bg-white">
      <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-2 px-4">
        <Link
          to="/courses/"
          className="flex min-h-11 items-center rounded-xl border-2 border-game-line px-3 text-[0.9375rem] font-black text-course-ink hover:bg-course-wash"
        >
          <span className="sr-only">Alle Kurse. Ihr Kurs: </span>
          {code}
        </Link>
        <div className="flex items-center gap-4 rounded-xl px-1 py-1" data-tour="stats">
          <p className="flex items-center gap-1.5" title="Lerntage in Folge">
            <Flame className="h-6 w-6 fill-game-flame text-game-flame-edge" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[1.1875rem] font-black text-game-flame-edge">{streak}</span>
            <span className="sr-only">{streak === 1 ? 'Lerntag' : 'Lerntage'} in Folge</span>
          </p>
          <p className="flex items-center gap-1.5">
            <Zap className="h-6 w-6 fill-game-xp text-game-xp-edge" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[1.1875rem] font-black text-game-xp-ink">{totalXp}<span className="sr-only"> XP</span></span>
            <span className="text-[0.8125rem] font-black text-game-xp-ink" aria-hidden="true">XP</span>
          </p>
          <p className="flex items-center" title="Tagesziel">
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={fill} aria-hidden="true">
              <span className="flex h-[1.625rem] w-[1.625rem] items-center justify-center rounded-full bg-white">
                {g.reached
                  ? <Check className="h-4 w-4 text-course-ink" strokeWidth={3.4} />
                  : <Timer className="h-3.5 w-3.5 text-game-muted" strokeWidth={2.6} />}
              </span>
            </span>
            <span className="sr-only">{g.label}</span>
          </p>
        </div>
        {onHelp ? (
          <button
            ref={helpRef}
            type="button"
            onClick={onHelp}
            aria-label={helpLabel}
            title={helpLabel}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-game-muted hover:bg-course-wash hover:text-course-ink"
          >
            <HelpCircle className="h-7 w-7" strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : <span className="w-1" aria-hidden="true" />}
      </div>
    </div>
  );
}
