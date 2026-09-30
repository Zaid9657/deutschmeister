import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { FlameIcon } from './GameParts.jsx';
import { useV2Strings } from './strings.js';

const CLOSE = '-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-game-muted hover:bg-course-wash hover:text-game-text';

/**
 * The lesson chrome's top bar, the way Duolingo's lesson bar reads: an X back to the course home,
 * the THICK rounded progress bar (palette primary with a lighter highlight stripe) and — only from
 * three right answers in a row — the combo flame. Nothing else: the XP of the visit is counted on the
 * celebration and the recap, not in the bar. Sticky, so the progress and the X stay in reach on a long
 * screen.
 *
 *   progress      0..1
 *   progressLabel the bar's accessible name (unit progress, or this step's progress)
 *   combo         right answers in a row (ComboChip.nextCombo)
 */
export default function GameTopBar({ homeTo, homeLabel, progress = 0, progressLabel, combo = 0 }) {
  const [, t] = useV2Strings();
  const pct = Math.round(Math.max(0, Math.min(1, Number(progress) || 0)) * 100);
  // a started bar always shows a sliver of colour, so the first answer visibly moves it
  const shown = pct > 0 ? Math.max(pct, 6) : 0;
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 bg-course-ground px-4 pb-2 pt-3 sm:pt-5">
      <div className="flex items-center gap-3">
        <Link to={homeTo} aria-label={homeLabel} className={CLOSE}>
          <X className="h-7 w-7" strokeWidth={2.8} aria-hidden="true" />
        </Link>
        <div
          className="h-[1.125rem] flex-1 overflow-hidden rounded-full bg-game-locked"
          role="progressbar"
          aria-label={progressLabel}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full overflow-hidden rounded-full bg-course transition-[width] duration-500 ease-spring motion-reduce:transition-none"
            style={{ width: `${shown}%` }}
          >
            {shown > 0 && <div className="mx-2 mt-[4px] h-1 rounded-full bg-white/35" />}
          </div>
        </div>
        {combo >= 3 && (
          <span
            key={combo}
            className="inline-flex shrink-0 items-center gap-0.5 text-[1.0625rem] font-extrabold tabular-nums text-game-flame-edge motion-safe:animate-pop-in"
            aria-label={t('game.combo', { n: combo })}
            role="img"
          >
            <FlameIcon size={22} />
            <span aria-hidden="true">{combo}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The guide's top bar (the opt-in Kapitel overview, `?view=guide`): an X that closes the overview —
 * back to where the learner came from — and its name („Kapitel 1 im Überblick"). No progress bar:
 * the guide is a page to read, not a lesson.
 */
export function GuideTopBar({ title, closeLabel, onClose }) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-2 border-b-2 border-game-line bg-course-ground px-4 pb-2 pt-3 sm:pt-5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClose} aria-label={closeLabel} className={CLOSE}>
          <X className="h-7 w-7" strokeWidth={2.8} aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-[1.0625rem] font-extrabold text-game-text">{title}</p>
        <span className="h-11 w-11 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
