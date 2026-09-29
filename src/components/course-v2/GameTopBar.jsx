import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { FlameIcon, XpIcon } from './GameParts.jsx';
import { useV2Strings } from './strings.js';

/**
 * The lesson chrome's top bar: an X back to the course home, the THICK progress bar
 * (palette primary with a lighter highlight stripe) and, on the right, the combo flame —
 * shown from three right answers in a row — and this session's XP. Sticky, so the progress
 * and the X stay in reach on a long screen.
 *
 *   progress      0..1
 *   progressLabel the bar's accessible name (unit progress, or this step's progress)
 *   combo         right answers in a row (ComboChip.nextCombo)
 *   xp            XP earned in this visit
 */
export default function GameTopBar({ homeTo, homeLabel, progress = 0, progressLabel, combo = 0, xp = 0 }) {
  const [, t] = useV2Strings();
  const pct = Math.round(Math.max(0, Math.min(1, Number(progress) || 0)) * 100);
  // a started bar always shows a sliver of colour, so the first answer visibly moves it
  const shown = pct > 0 ? Math.max(pct, 6) : 0;
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-4 bg-course-ground px-4 pb-2 pt-3 sm:pt-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to={homeTo}
          aria-label={homeLabel}
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-game-locked-icon hover:bg-course-wash hover:text-game-muted"
        >
          <X className="h-7 w-7" strokeWidth={2.8} aria-hidden="true" />
        </Link>
        <div
          className="h-4 flex-1 overflow-hidden rounded-full bg-game-locked"
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
            {shown > 0 && <div className="mx-2 mt-[3px] h-1 rounded-full bg-white/35" />}
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
        {xp > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-game-xp-wash px-2 py-1 text-[0.9375rem] font-extrabold tabular-nums text-game-xp-ink"
            aria-label={t('game.sessionXp', { n: xp })}
            role="img"
          >
            <XpIcon size={16} />
            <span aria-hidden="true">{xp}</span>
          </span>
        )}
      </div>
    </div>
  );
}
