import { Play, Cpu, Mic } from 'lucide-react';
import { useV2Strings } from './strings.js';
import { canPlay, playV2Line, playV2Lines, recordedLine } from './content.js';

/**
 * „Recording" vs „Computerstimme" — word and icon, never colour alone, and a label, not
 * a control (it carries no interactive colour). Until a level's Azure audio run exists
 * every v2 line is the browser voice, and the badge says so.
 */
export function SourceBadge({ recorded }) {
  const [, t] = useV2Strings();
  const Icon = recorded ? Mic : Cpu;
  return (
    <span className="inline-flex items-center gap-1 font-data text-[0.625rem] font-bold uppercase tracking-[0.11em] text-graphite">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {recorded ? 'Aufnahme' : t('audio.synthetic')}
    </span>
  );
}

/**
 * Play one Line, or a whole list of Lines in order. `playsLeft` (a number) makes it an
 * exam play counter: the button disables at 0 and says why (BLUEPRINT §3.6: the lane's
 * play counts). `onPlayed` fires after each start, so the owner can count plays and
 * unlock the transcript after the first unaided listen.
 */
export default function AudioButton({ unitId, line = null, lines = null, label = null, playsLeft = null, onPlayed, rate, size = 'md', iconOnly = false, ariaLabel = null }) {
  const [, t] = useV2Strings();
  const list = lines || (line ? [line] : []);
  const first = list[0] || null;
  const available = first ? canPlay(unitId, first.id) : false;
  const exhausted = typeof playsLeft === 'number' && playsLeft <= 0;
  const play = () => {
    if (!first || exhausted) return;
    const ok = list.length > 1 ? playV2Lines(unitId, list, { rate }) : playV2Line(unitId, first, { rate });
    if (ok && typeof onPlayed === 'function') onPlayed();
  };
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[0.8125rem]' : 'px-4 py-2.5 text-sm';
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={play}
        disabled={!available || exhausted}
        aria-label={ariaLabel || label || t('audio.play')}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel transition-transform duration-100 ease-snap hover:bg-siegel hover:text-white active:translate-y-0.5 disabled:opacity-40 motion-reduce:transition-none"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={play}
        disabled={!available || exhausted}
        className={`inline-flex min-h-11 items-center gap-2 rounded-clay border border-rule bg-white font-bold text-ink shadow-raise transition-all duration-100 ease-snap hover:border-siegel active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:shadow-none motion-reduce:transition-none ${pad}`}
      >
        <Play className="h-4 w-4" aria-hidden="true" /> {label || t('audio.play')}
      </button>
      {typeof playsLeft === 'number' && (
        <span className="font-data text-[0.75rem] text-graphite">
          {exhausted ? t('audio.playsUsed') : t('audio.playsLeft', { n: playsLeft })}
        </span>
      )}
      {first && <SourceBadge recorded={recordedLine(unitId, first.id)} />}
      {!available && first && <span className="text-[0.8125rem] text-graphite">{t('audio.none')}</span>}
    </span>
  );
}
