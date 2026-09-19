import { Check, Volume2, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import { AudioSourceBadge } from './DialogStage.jsx';
import { t } from '../../lib/lesson/strings.js';

// The per-mode review-card renderer, pulled out of src/pages/lesson/ReviewPage.jsx
// (the Wiederholen screen) so the lesson player's warm-up stage (stage 0) can
// render the SAME four card faces — flashcard, listening, typed, say-it — for
// its due cards instead of the flat read-only list it used to show. One
// component, two callers: ReviewPage.jsx and LessonPlayerPage.jsx's warm-up.

/** Which of a card kind's modes to use for its Nth review — rotates so the same word isn't always met the same way. */
export const MODES_BY_KIND = {
  word: ['flashcard', 'listening', 'typed'],
  pattern: ['flashcard', 'typed'],
  sentence: ['listening', 'say', 'flashcard'],
};

export const modeForCard = (kind, index) => {
  const modes = MODES_BY_KIND[kind] || MODES_BY_KIND.word;
  return modes[index % modes.length];
};

/**
 * `content` is a cardIndex entry (kind/front/back/speak/detail/lektionNr/
 * accepted/caseSensitive) — never a database row. `onGrade(correct)` is the
 * caller's job: ReviewPage writes through `gradeCard` and moves to the next
 * due card; the player's warm-up grades the same way but never blocks the
 * lesson on the write (see LessonPlayerPage.jsx's warm-up section).
 */
export default function ReviewCard({
  content,
  mode,
  lang,
  revealed,
  onReveal,
  typed,
  onTypedChange,
  onCheckTyped,
  verdict,
  onPlay,
  hasRecording,
  onGrade,
}) {
  if (!content) return null;
  return (
    <Card className="mt-6 p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Chip tone="label">{t(`review.mode.${mode}`, lang)}</Chip>
        {content.lektionNr && (
          <span className="font-data text-[0.6875rem] uppercase tracking-[0.13em] text-graphite">
            {t('review.lesson', lang, { nr: content.lektionNr })}
          </span>
        )}
      </div>

      {mode === 'listening' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={onPlay}>
              <Volume2 className="h-4 w-4" aria-hidden="true" /> {t('action.listenAgain', lang)}
            </Button>
            <AudioSourceBadge recorded={hasRecording} />
          </div>
          {revealed && <p className="mt-4 font-display text-xl text-ink" lang="de">{content.front}</p>}
        </>
      ) : mode === 'typed' ? (
        <>
          <p className="font-display text-xl text-ink">{content.back || content.front}</p>
          <form
            className="mt-4 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => { event.preventDefault(); onCheckTyped(); }}
          >
            <label className="sr-only" htmlFor="review-answer">{t('review.inGerman', lang)}</label>
            <input
              id="review-answer"
              value={typed}
              onChange={(event) => onTypedChange(event.target.value)}
              disabled={revealed}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-clay border border-rule bg-white px-4 py-3 font-body text-base text-ink placeholder:text-graphite/60 disabled:bg-paper-sunk"
              placeholder={t('review.typePlaceholder', lang)}
            />
            {!revealed && <Button type="submit" className="sm:w-auto">{t('action.check', lang)}</Button>}
          </form>
          {revealed && (
            <p className={`mt-3 flex items-center gap-2 text-sm font-bold ${verdict ? 'text-accent-limette-ink' : 'text-accent-himbeer-ink'}`}>
              {verdict ? <Check className="h-4 w-4" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
              {verdict ? t('feedback.correct', lang) : t('review.correctIs', lang, { answer: content.front })}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="font-display text-xl text-ink" lang="de">{content.front}</p>
          {content.detail && <p className="mt-1 text-sm text-graphite">{content.detail}</p>}
          {revealed && content.back && <p className="mt-3 text-[0.9375rem] text-ink">{content.back}</p>}
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {!revealed && mode !== 'typed' && (
          <Button onClick={() => { onReveal(); if (mode === 'say') onPlay(); }}>
            {t(mode === 'say' ? 'review.sayReveal' : 'review.reveal', lang)}
          </Button>
        )}
        {revealed && (
          <>
            <Button variant="secondary" onClick={() => onGrade(false)}>
              <X className="h-4 w-4" aria-hidden="true" /> {t('review.again', lang)}
            </Button>
            <Button onClick={() => onGrade(verdict !== false)}>
              <Check className="h-4 w-4" aria-hidden="true" /> {t('review.knew', lang)}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
