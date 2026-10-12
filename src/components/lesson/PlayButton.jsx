import { useState } from 'react';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import { playChecked, audioFor } from '../../lib/lesson/speech.js';
import { AudioSourceBadge } from './DialogStage.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * The one play control of the lesson (2026-10 review, "Make audio dependable").
 *
 * - It reports what actually happened: the button says "Playing…" only once sound has started
 *   (speech.js `playChecked`), and a failure is said in words with the way out — try again, or
 *   (where the caller allows it) read the line instead. A play action that produced silence used
 *   to look exactly like one that worked.
 * - "Slower" replays at a beginner pace (playbackRate 0.75 for a recording, rate 0.75 for the
 *   synthesiser) — a choice the learner makes, not a fixed rate.
 * - The badge says whose voice it is: a recording or the computer voice. Synthetic speech is
 *   never labelled a recording.
 *
 * `onFallback` (optional) is offered after a failure: "Show the text instead". Listening items
 * pass it and record the answer as READ, not heard (skillStatus.listeningSummary).
 */
/** The one-line failure notice for stages that keep their own play controls (dialogue, phonetics). */
export function AudioFailureNotice({ reason }) {
  const [lang] = useLessonLang();
  if (!reason) return null;
  return (
    <p role="alert" className="mt-3 rounded-clay border border-accent-aprikose bg-accent-aprikose-wash p-3 text-[0.875rem] font-bold text-accent-aprikose-ink">
      {t(`audio.failed.${reason}`, lang)}
    </p>
  );
}

export default function PlayButton({ lektionId, audioKey, text, rate = 0.92, label, onFallback, fallbackLabel, onPlayed }) {
  const [lang] = useLessonLang();
  const [state, setState] = useState('idle'); // idle | loading | playing | failed
  const [reason, setReason] = useState(null);
  const recorded = !!audioFor(lektionId, audioKey);

  const play = async (slow) => {
    setState('loading');
    const result = await playChecked(lektionId, audioKey, text, { rate: slow ? 0.75 : rate, slow });
    if (result.ok) {
      setState('playing');
      setReason(null);
      if (onPlayed) onPlayed(result);
      window.setTimeout(() => setState((s) => (s === 'playing' ? 'idle' : s)), 1500);
    } else {
      setState('failed');
      setReason(result.reason);
    }
  };

  const busy = state === 'loading';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => play(false)}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-clay border border-rule bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-raise [touch-action:manipulation] active:translate-y-1 active:shadow-none disabled:cursor-wait"
        >
          {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          {state === 'playing' ? t('audio.playing', lang) : label || t('action.play', lang)}
        </button>
        <button
          type="button"
          onClick={() => play(true)}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-2 text-[0.8125rem] font-bold text-graphite [touch-action:manipulation] hover:border-siegel"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> {t('audio.slower', lang)}
        </button>
        <AudioSourceBadge recorded={recorded} />
      </div>
      <p className="sr-only" aria-live="polite">{state === 'failed' ? t(`audio.failed.${reason || 'error'}`, lang) : ''}</p>
      {state === 'failed' && (
        // No role here: the persistent live region above already says it once (twice was measured in the browser).
        <div className="rounded-clay border border-accent-aprikose bg-accent-aprikose-wash p-3 text-[0.875rem] text-accent-aprikose-ink">
          <p className="font-bold">{t(`audio.failed.${reason || 'error'}`, lang)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => play(false)} className="min-h-11 rounded-pill border border-current bg-white/70 px-3 font-bold">
              {t('audio.retry', lang)}
            </button>
            {onFallback && (
              <button type="button" onClick={onFallback} className="min-h-11 rounded-pill border border-current bg-white/70 px-3 font-bold">
                {fallbackLabel || t('audio.showText', lang)}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
