/**
 * An SVG progress ring wrapped around a path node — siegel stroke on a
 * rule-coloured track (design-tokens.js: siegel is the one interactive
 * colour; `rule` is the neutral hairline used for tracks elsewhere in the
 * app, e.g. the DashboardPage path's dashed base line).
 *
 * PER-NODE STATUS IS NOT AVAILABLE CHEAPLY. `getProgramProgress` (used by
 * CurriculumHomePage) returns only a Set of done item ids from
 * `program_progress` — no partial-attempt or gold/complete distinction per
 * Lektion is stored there (that finer status lives only inside a single
 * lesson's own `lesson_progress`/`lesson_attempts` rows, per-Lektion, and
 * fetching all of them for the whole path is not something the course home
 * does today). So this ring renders exactly two states, matching what the
 * page already computes: `state === 'done'` → a full ring; anything else →
 * an empty track. "started" and "gold" are not distinguishable from the
 * course home without a new query, so they are not rendered as separate
 * rings — see the state prop's doc line below.
 */
export default function LessonRing({ state, size, children }) {
  const done = state === 'done';
  const r = 46;
  const c = 2 * Math.PI * r;
  const box = size || 100;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: box, height: box }}>
      <svg
        viewBox="0 0 100 100"
        width={box}
        height={box}
        className="absolute inset-0 -rotate-90 motion-reduce:transition-none"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r={r} fill="none" className="stroke-rule" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          className="stroke-siegel transition-[stroke-dashoffset] duration-500 ease-snap motion-reduce:transition-none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={done ? 0 : c}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
