import { CalendarDays } from 'lucide-react';

// „Ihr Tempo": the manifest's pace presets as three radio cards (native radios, so
// keyboard and screen readers get a real radio group), each with its learning days,
// the minutes per learning day (gamify.dailyGoalMinutes) and the weeks the open
// Lernschritte take (pacePlan.planSummary). The chosen one drives the whole page.
export default function PacePicker({ options = [], pace, onPace, code, finishText, allDone = false }) {
  if (!options.length) return null;
  return (
    <div>
      <fieldset>
        <legend className="sr-only">Ihr Tempo wählen</legend>
        <div className="flex flex-col gap-2.5">
          {options.map((o) => {
            const on = o.id === pace;
            return (
              <label
                key={o.id}
                className={`flex min-h-16 cursor-pointer items-center gap-3.5 rounded-2xl border-2 border-b-4 px-4 py-3.5 transition-colors ${
                  on ? 'border-course bg-course-wash' : 'border-game-line bg-white hover:bg-course-wash'
                }`}
              >
                <input
                  type="radio"
                  name="dm-tempo"
                  value={o.id}
                  checked={on}
                  onChange={() => onPace(o.id)}
                  className="h-5 w-5 shrink-0 accent-[color:var(--c-primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.0625rem] font-black">{o.name}</span>
                  <span className="block text-sm font-bold text-game-muted">
                    {o.learningDays ? `${o.learningDays} Lerntage pro Woche · ` : ''}etwa {o.minutes} Min.
                  </span>
                </span>
                {!allDone && o.weeks > 0 && (
                  <span className={`shrink-0 text-[0.9375rem] font-black ${on ? 'text-course-ink' : 'text-game-muted'}`}>
                    {o.weeks} {o.weeks === 1 ? 'Woche' : 'Wochen'}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-course-wash p-4">
        <CalendarDays className="h-7 w-7 shrink-0 text-course" strokeWidth={2.4} aria-hidden="true" />
        <p className="text-base font-extrabold leading-snug" aria-live="polite">
          {allDone || !finishText
            ? 'Alle Lernschritte sind geschafft.'
            : <>In diesem Tempo sind Sie etwa am <span className="font-black text-course-ink">{finishText}</span> mit {code} fertig.</>}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold text-game-muted">Sie können das Tempo jederzeit ändern. Ihre Wahl wird auf diesem Gerät gespeichert.</p>
    </div>
  );
}
