import { useEffect, useMemo, useRef } from 'react';
import { Play, Cpu, Mic, Volume2 } from 'lucide-react';
import { speechTurn, stopSpeech } from '../../lib/lesson/speech.js';
import { useV2Strings } from './strings.js';
import { canPlay, playV2Line, playV2Lines, recordedLine } from './content.js';

/**
 * The one way a course-v2 screen makes sound (CRITIC-01): `line(unitId, line, opts)` and
 * `lines(unitId, lines, opts)` play like playV2Line / playV2Lines and remember the turn they
 * started; when the component unmounts (X, „Weiter", the next step) or `scope` changes (the next
 * card or item in the same component), that sound stops — unless another screen has already taken
 * the voice over, which is never cut. So a nine-line Folge never talks over the course home.
 */
export function useV2Playback(scope = null) {
  const mine = useRef(null);
  useEffect(() => () => {
    if (mine.current !== null) stopSpeech(mine.current);
    mine.current = null;
  }, [scope]);
  return useMemo(() => {
    const own = (result) => {
      if (result) mine.current = speechTurn();
      return result;
    };
    return {
      line: (unitId, line, opts) => own(playV2Line(unitId, line, opts)),
      lines: (unitId, lines, opts) => own(playV2Lines(unitId, lines, opts)),
    };
  }, []);
}

/**
 * „Recording" vs „Computerstimme" — word and icon, never colour alone, and a label, not
 * a control (it carries no interactive colour). Until a level's Azure audio run exists
 * every v2 line is the browser voice, and the badge says so.
 */
export function SourceBadge({ recorded }) {
  const [, t] = useV2Strings();
  const Icon = recorded ? Mic : Cpu;
  // said once per surface and calmly (CT-09): sentence case in the muted ink, not a shouted label
  return (
    <span className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-game-muted">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {recorded ? 'Aufnahme' : t('audio.synthetic')}
    </span>
  );
}

/**
 * Play one Line, or a whole list of Lines in order. `playsLeft` (a number) makes it an
 * exam play counter: the button disables at 0 and says why (BLUEPRINT §3.6: the lane's
 * play counts). `onPlayed` fires after each start, so the owner can count plays and
 * unlock the transcript after the first unaided listen.
 *
 * Looks (the course theme): the labelled button is a chunky white tile with a hard edge;
 * `iconOnly` is the square speaker key in the palette primary — `size="lg"` for the big one
 * in an exercise's speech bubble.
 *
 * `badge` — the „Computerstimme"/„Aufnahme" label beside a labelled button. A surface says it
 * ONCE (CT-09): the small (`size="sm"`) twin of a play button — „Langsamer" — never repeats it by
 * default, the main button carries it; a surface whose main key is `iconOnly` renders its own
 * <SourceBadge> (ItemView).
 */
export default function AudioButton({ unitId, line = null, lines = null, label = null, playsLeft = null, onPlayed, rate, size = 'md', iconOnly = false, ariaLabel = null, badge = size !== 'sm' }) {
  const [, t] = useV2Strings();
  const list = lines || (line ? [line] : []);
  const first = list[0] || null;
  const available = first ? canPlay(unitId, first.id) : false;
  const exhausted = typeof playsLeft === 'number' && playsLeft <= 0;
  const playback = useV2Playback(`${unitId}|${list.map((l) => l && l.id).join(',')}`);
  const play = () => {
    if (!first || exhausted) return;
    const ok = list.length > 1 ? playback.lines(unitId, list, { rate }) : playback.line(unitId, first, { rate });
    if (ok && typeof onPlayed === 'function') onPlayed();
  };
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[0.875rem]' : 'px-4 py-2.5 text-[0.9375rem]';
  if (iconOnly) {
    const big = size === 'lg';
    return (
      <button
        type="button"
        onClick={play}
        disabled={!available || exhausted}
        aria-label={ariaLabel || label || t('audio.play')}
        className={`flex shrink-0 items-center justify-center rounded-xl bg-course text-white shadow-course-sm transition-[transform,box-shadow] duration-100 ease-snap hover:brightness-105 active:translate-y-[3px] active:shadow-none disabled:bg-game-locked disabled:text-game-locked-icon disabled:shadow-none motion-reduce:transition-none ${big ? 'h-14 w-14' : 'h-11 w-11'}`}
      >
        {big ? <Volume2 className="h-7 w-7" strokeWidth={2.4} aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={play}
        disabled={!available || exhausted}
        className={`inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 border-b-4 border-game-line bg-white font-extrabold text-course-ink transition-[transform] duration-100 ease-snap hover:bg-course-wash active:translate-y-0.5 active:border-b-2 disabled:opacity-40 motion-reduce:transition-none ${pad}`}
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" /> {label || t('audio.play')}
      </button>
      {typeof playsLeft === 'number' && (
        <span className="text-[0.8125rem] font-bold text-game-muted">
          {exhausted ? t('audio.playsUsed') : t('audio.playsLeft', { n: playsLeft })}
        </span>
      )}
      {badge && first && <SourceBadge recorded={recordedLine(unitId, first.id)} />}
      {!available && first && <span className="text-[0.8125rem] text-game-muted">{t('audio.none')}</span>}
    </span>
  );
}
