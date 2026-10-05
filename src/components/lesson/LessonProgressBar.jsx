import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * The thin progress bar at the top of a lesson (standard §4: "a thin progress
 * bar", not a score). It counts screens, not correctness — nothing here ever
 * tells a learner they are behind.
 */
export default function LessonProgressBar({ step, total, label }) {
  const pct = total > 0 ? Math.round((step / total) * 100) : 0;
  const [lang] = useLessonLang();
  return (
    // `flex-1 min-w-0`: the bar takes the room the header row leaves it. Without
    // it the root shrank to its label and the bar itself rendered 0 px wide
    // (docs/evaluation/screenshots/after/14-practice-item8-match.jpg).
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-pill bg-siegel-wash"
        role="progressbar"
        aria-label={t('player.progress', lang)}
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
