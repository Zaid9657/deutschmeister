import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import GameButton from './GameButton.jsx';
import { FlameIcon, StarBurst, StatTile, StickyAction, clock } from './GameParts.jsx';
import useCourseGame from './useCourseGame.js';
import { useV2Strings } from './strings.js';

/**
 * The moment after a finished Lernschritt (not the Check — the recap is its moment — and not an
 * Aufgabe the learner moved on from), one calm screen the way Duolingo's lesson-complete reads: a
 * star burst, ONE headline „Lernschritt geschafft!", one line of what the learner can now do (the
 * step's end line, else its title), three tiles — the XP this step earned (items + the step bonus),
 * the share right at the first try, the time — the streak in ONE line (round 3: it was a card with the
 * week grid; the week lives on the course home), and ONE „Weiter" to the next step. The player records
 * the step in the game ledger (gamify.recordGame) before this shows, so the streak already counts today.
 *
 *   xp       XP of this step, bonus included
 *   correct, total   first-try results of the step's scored items (total 0: an Aufgabe → ✓)
 *   seconds  time on the step
 *   line     the can-do line (German content) — or null, then `title` says what was done
 */
export default function StepCelebration({ xp = 0, correct = 0, total = 0, seconds = 0, line = null, title = '', onNext }) {
  const [, t] = useV2Strings();
  const { streak } = useCourseGame();
  const heading = useRef(null);
  useEffect(() => {
    if (heading.current) heading.current.focus({ preventScroll: true });
  }, []);
  const pct = total > 0 ? Math.round((correct / total) * 100) : null;
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center pb-32 text-center sm:pb-0" aria-labelledby="step-celebration-title">
      <StarBurst className="mt-2" />
      <h1
        id="step-celebration-title"
        ref={heading}
        tabIndex={-1}
        className="mt-3 text-[1.875rem] font-extrabold leading-tight text-game-xp-ink outline-none"
      >
        {t('cel.title')}
      </h1>
      {line ? (
        <p className="mt-2 text-[1.0625rem] font-bold leading-relaxed text-game-text" lang="de">{line}</p>
      ) : title ? (
        <p className="mt-2 text-[1.0625rem] font-bold leading-relaxed text-game-text">{t('cel.did', { title })}</p>
      ) : null}
      <div className="mt-6 grid w-full grid-cols-3 gap-2.5">
        <StatTile tone="xp" label={t('cel.xp')} value={`+${xp}`} />
        <StatTile
          tone="course"
          label={t('cel.right')}
          value={pct != null ? `${pct} %` : (
            <span role="img" aria-label={t('player.doneMark')} className="inline-flex"><Check className="h-7 w-7" strokeWidth={3.5} aria-hidden="true" /></span>
          )}
        />
        <StatTile tone="time" label={t('cel.time')} value={clock(seconds)} />
      </div>
      <p className="mt-6 inline-flex items-center gap-2 text-[1.0625rem] font-extrabold text-game-text">
        <FlameIcon size={26} lit={streak > 0} />
        {streak > 1 ? t('game.streak', { n: streak }) : streak === 1 ? t('game.streakOne') : t('game.streakNone')}
      </p>
      <StickyAction className="w-full">
        <GameButton onClick={onNext}>{t('item.next')}</GameButton>
      </StickyAction>
    </section>
  );
}
