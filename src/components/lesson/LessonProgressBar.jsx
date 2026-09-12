/**
 * The thin progress bar at the top of a lesson (standard §4: "a thin progress
 * bar", not a score). It counts screens, not correctness — nothing here ever
 * tells a learner they are behind.
 */
export default function LessonProgressBar({ step, total, label }) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-siegel-wash"
        role="progressbar"
        aria-label="Fortschritt in dieser Lektion"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-pill bg-siegel transition-all duration-500 ease-snap motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 font-data text-[0.6875rem] text-graphite">{label || `${step}/${total}`}</span>
    </div>
  );
}
