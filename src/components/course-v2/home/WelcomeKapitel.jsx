import { Star } from 'lucide-react';
import { ICONS, FILLED } from './PathNode.jsx';
import { hueVars } from './hue.js';

// The welcome's „kapitel" screen (pathModel.chapterSteps): „Jedes Kapitel: 7 kurze
// Lernschritte" — the steps of Kapitel 1 drawn the way the path draws them (the round 3D face
// in the Kapitel's hue with the path's own icon: the star for Teil A, B, C, the target for
// Prüfungstraining, the microphone, the pen, the crown of the Kapiteltest), each with its short
// name from the real outline, the minutes of one step, and — only where the completion rules
// credit it — the test-out line naming the player's own button. Decorative faces; the names
// are the list.

export default function WelcomeKapitel({ chapter, headRef }) {
  return (
    <div>
      <h1 ref={headRef} tabIndex={-1} className="text-[1.75rem] font-black leading-tight">{chapter.heading}</h1>
      {chapter.minutesLine && <p className="mt-1 text-base font-bold text-game-muted">{chapter.minutesLine}</p>}
      <ol className="relative mt-3.5 flex flex-col gap-1" style={hueVars(chapter.hue)}>
        {/* the path between the faces */}
        <span aria-hidden="true" className="absolute bottom-4 left-5 top-4 w-1 -translate-x-1/2 rounded-full bg-game-line" />
        {chapter.steps.map((s) => {
          const Icon = ICONS[s.icon] || Star;
          return (
            <li key={s.nr} className="relative flex items-center gap-3.5">
              <span
                aria-hidden="true"
                className="flex h-9 w-10 shrink-0 items-center justify-center rounded-[50%] bg-[color:var(--hue)] text-white shadow-[0_4px_0_var(--hue-edge)]"
              >
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2.8} fill={FILLED.has(s.icon) ? 'currentColor' : 'none'} />
              </span>
              <span className="text-[1.0625rem] font-black leading-tight">{s.label}</span>
            </li>
          );
        })}
      </ol>
      {chapter.testOut && (
        <p className="mt-3.5 rounded-2xl bg-course-wash px-4 py-2.5 text-[0.9375rem] font-bold leading-snug text-game-text">{chapter.testOut}</p>
      )}
    </div>
  );
}
