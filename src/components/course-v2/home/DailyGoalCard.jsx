import { ChevronDown, ChevronRight, Flame } from 'lucide-react';
import { courseGame } from '../../../data/design-tokens.js';

// The returning learner's daily goal (gamify.js: the goal is MINUTES per learning
// day, from the pace preset): a ring „12 / 35 Min.", what is left today, the pace
// and the plan's finish date, this week's learning days, and the toggle that opens
// the course plan in place (#kursplan — no route of its own).
export default function DailyGoalCard({
  todayMinutes = 0, goalMinutes = 0, paceName, code, finishText = null, planLine = null, week = [], planOpen = false, onTogglePlan,
}) {
  const done = Math.max(0, Math.round(Number(todayMinutes) || 0));
  const goal = Math.max(1, Number(goalMinutes) || 1);
  const left = Math.max(0, goal - done);
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const ring = { background: `conic-gradient(var(--c-primary) 0 ${pct}%, ${courseGame.locked} ${pct}% 100%)` };
  const Toggle = planOpen ? ChevronDown : ChevronRight;

  return (
    <section aria-labelledby="dm-tagesziel" className="mx-4 mt-4 rounded-[18px] border-2 border-b-[5px] border-game-line bg-white p-4">
      <div className="flex items-center gap-4">
        <div role="img" aria-label={`Heute ${done} von ${goal} Minuten gelernt`} className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full" style={ring}>
          <div className="flex h-[50px] w-[50px] flex-col items-center justify-center rounded-full bg-white leading-none">
            <span className="text-[1.0625rem] font-black">{done}</span>
            <span className="mt-0.5 text-[0.625rem] font-extrabold text-game-muted">/ {goal} Min.</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="dm-tagesziel" className="text-[1.0625rem] font-black leading-snug">
            {left > 0 ? `Heute noch ${left} ${left === 1 ? 'Minute' : 'Minuten'}` : 'Tagesziel geschafft!'}
          </h2>
          <p className="text-sm font-bold leading-snug text-game-muted">
            Tempo {paceName}{finishText ? ` · ${finishText}` : ''}
          </p>
          {planLine && <p className="mt-0.5 text-sm font-bold leading-snug text-game-muted">{planLine}</p>}
          <button
            type="button"
            onClick={onTogglePlan}
            aria-expanded={planOpen}
            aria-controls="kursplan"
            className="-ml-1 mt-0.5 inline-flex min-h-11 items-center gap-0.5 rounded-lg px-1 text-sm font-black text-course-ink hover:bg-course-wash"
          >
            {planOpen ? 'Kursplan schließen' : 'Kursplan ansehen'}
            <Toggle className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      </div>
      {week.length === 7 && (
        <ol aria-label={`Ihre Lerntage diese Woche in ${code}`} className="mt-3 grid grid-cols-7 gap-1 border-t-2 border-game-line pt-3">
          {week.map((d) => (
            <li key={d.key} className="flex flex-col items-center gap-1">
              <span className={`text-[0.6875rem] font-extrabold ${d.today ? 'text-course-ink' : 'text-game-muted'}`}>{d.label}</span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  d.done ? 'bg-game-flame' : d.today ? 'border-2 border-course bg-course-wash' : 'bg-game-locked'
                }`}
              >
                {d.done && <Flame className="h-4 w-4 fill-white text-white" strokeWidth={1.8} aria-hidden="true" />}
              </span>
              <span className="sr-only">{d.done ? 'gelernt' : d.today ? 'heute, noch offen' : 'kein Lernschritt'}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
