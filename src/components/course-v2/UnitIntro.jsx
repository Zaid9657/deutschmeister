import { ChevronDown } from 'lucide-react';
import CastAvatar from './CastAvatar.jsx';
import GameButton, { QuietButton } from './GameButton.jsx';
import { SpeechBubble, StickyAction, XpIcon } from './GameParts.jsx';
import { useV2Strings } from './strings.js';

/**
 * The unit's friendly front door (owner feedback 2026-09-29: „Unit 1 opens with a speaking
 * test before anything is taught"). Nothing here asks anything of the learner:
 *
 *   the narrator (Priya on A1) with a speech bubble — the unit's „Was bisher geschah" or the
 *   opening of its story → „Heute lernen Sie" (the unit's 3–5 can-dos) → a meta row (Lernschritte,
 *   minutes per step, XP to earn) → ONE primary „Los geht's". The Prüfungsfokus sits folded in a
 *   small line; „Test machen und überspringen" (the test-out) is a quiet text button.
 */
export default function UnitIntro({
  eyebrow,
  title,
  narrator,
  bubble,
  bubbleEn = null,
  goals,
  stepCount,
  perStepMinutes,
  xp,
  examFocus = [],
  onStart,
  onTestOut = null,
}) {
  const [lang, t] = useV2Strings();
  return (
    <div className="pb-40 sm:pb-0">
      <p className="text-center text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">{eyebrow}</p>
      {title && (
        <h1 className="mt-1 text-center text-[1.625rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[2rem]" lang="de">{title}</h1>
      )}

      <div className="mt-6 flex flex-col items-center gap-4">
        {bubble && (
          <SpeechBubble tail="down" className="max-w-sm text-center">
            <p className="text-[1.125rem] font-bold leading-relaxed text-game-text" lang="de">{bubble}</p>
            {bubbleEn && lang !== 'de' && <p className="mt-1.5 text-[0.875rem] font-semibold leading-snug text-game-muted" lang="en">{bubbleEn}</p>}
          </SpeechBubble>
        )}
        <CastAvatar name={narrator} size={132} className="motion-safe:animate-pop-in" />
      </div>

      {goals.length > 0 && (
        <section className="mt-6 rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4 sm:p-5" aria-labelledby="unit-intro-goals">
          <h2 id="unit-intro-goals" className="text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">{t('start.today')}</h2>
          <ul className="mt-3 space-y-2.5">
            {goals.map((g) => (
              <li key={g} className="flex items-start gap-2.5 text-[1.0625rem] font-bold leading-snug text-game-text" lang="de">
                <span aria-hidden="true" className="mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full bg-course" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.9375rem] font-extrabold text-game-muted">
        {stepCount > 0 && <span>{t('start.steps', { n: stepCount })}</span>}
        {perStepMinutes > 0 && <><span aria-hidden="true">·</span><span>{t('start.perStep', { n: perStepMinutes })}</span></>}
        {xp > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-game-xp-ink"><XpIcon size={16} /> {t('game.xp', { n: xp })}</span>
          </>
        )}
      </p>

      {examFocus.length > 0 && (
        <details className="group mt-4 rounded-2xl border-2 border-game-line bg-white px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[0.875rem] font-extrabold text-game-muted [&::-webkit-details-marker]:hidden">
            <span>{t('start.examFocus')}: {examFocus.length}</span>
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <ul className="flex flex-wrap gap-2 pb-2 pt-1">
            {examFocus.map((label) => (
              <li key={label} className="rounded-lg bg-course-wash px-2.5 py-1 text-[0.8125rem] font-bold text-course-ink" lang="de">{label}</li>
            ))}
          </ul>
        </details>
      )}

      <StickyAction>
        <GameButton onClick={onStart}>{t('start.begin')}</GameButton>
        {onTestOut && <QuietButton onClick={onTestOut}>{t('start.skipTest')}</QuietButton>}
      </StickyAction>
    </div>
  );
}
