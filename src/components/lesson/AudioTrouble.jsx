import { useState } from 'react';
import { FileText, VolumeX } from 'lucide-react';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * What a listening item offers when the sound does not reach the learner:
 * no voice in this browser, or "I can't hear anything" after pressing play.
 * Step one is always to try again (volume, mute switch, the play button);
 * step two is the transcript — clearly labelled READING support. An answer
 * given with the transcript open is reported with `support: 'transcript'`
 * and is never counted as listening evidence (mastery.js leaves it out of the
 * first-try figure; the recap says how many there were).
 *
 * `available` — can this browser play the line at all.
 * `transcript` — the German line; shown only on request, `lang="de"`.
 */
export default function AudioTrouble({ available, transcript, shown, onShow, disabled = false }) {
  const [lang] = useLessonLang();
  const [open, setOpen] = useState(!available);
  if (shown) {
    return (
      <div className="mt-3 rounded-clay border border-rule bg-paper-sunk p-3" role="note">
        <p className="flex items-center gap-1.5 text-[0.8125rem] font-bold text-graphite">
          <FileText className="h-4 w-4 shrink-0" aria-hidden="true" /> {t('audio.transcriptLabel', lang)}
        </p>
        <p className="mt-1 text-[1rem] text-ink" lang="de" dir="ltr">{transcript}</p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="inline-flex min-h-11 items-center gap-1.5 text-[0.8125rem] font-bold text-graphite underline-offset-2 hover:text-ink hover:underline"
        >
          <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" /> {t('audio.cantHear', lang)}
        </button>
      ) : (
        <div className="rounded-clay border border-rule bg-white p-3" role="status" aria-live="polite">
          <p className="text-[0.875rem] leading-relaxed text-graphite">
            {t(available ? 'audio.cantHearTips' : 'audio.unavailable', lang)}
          </p>
          <button
            type="button"
            onClick={onShow}
            disabled={disabled}
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-rule bg-white px-3 text-[0.8125rem] font-bold text-ink hover:border-siegel"
          >
            <FileText className="h-4 w-4 shrink-0" aria-hidden="true" /> {t('audio.showTranscript', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
