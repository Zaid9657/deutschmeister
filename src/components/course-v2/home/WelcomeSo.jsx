import { Play, Smartphone } from 'lucide-react';
import { useV2Strings } from '../strings.js';

// The welcome's „so" screen: „So lernen Sie" — three big rows, one idea each: one task per
// screen; the German has sound (▶ „Anhören"); „Prüfen" gives instant feedback and XP, and one
// Lernschritt a day keeps the flame (the learning days in a row, gamify.streakOf) alive. The words are the player's own buttons, read from the same
// strings.js keys the player uses (item.next, audio.play, item.check), so the screen names what
// the learner will tap. The „Prüfen" chip is drawn like the real button (bg-course, capitals).

const ROW = 'flex min-h-[4.5rem] items-center gap-4 rounded-[18px] border-2 border-b-4 border-game-line bg-white px-4 py-3';
const ICON = 'flex w-16 shrink-0 justify-center';

export default function WelcomeSo({ headRef }) {
  const [, t] = useV2Strings();
  return (
    <div>
      <h1 ref={headRef} tabIndex={-1} className="text-[1.75rem] font-black leading-tight">{t('welcome.so')}</h1>
      <ul className="mt-6 flex flex-col gap-3">
        <li className={ROW}>
          <span className={ICON} aria-hidden="true">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-course-wash text-course-ink">
              <Smartphone className="h-6 w-6" strokeWidth={2.4} />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black leading-snug">{t('welcome.soOne')}</span>
            <span className="mt-0.5 block text-[0.9375rem] font-bold leading-snug text-game-muted">{t('welcome.soOneText', { next: t('item.next') })}</span>
          </span>
        </li>
        <li className={ROW}>
          <span className={ICON} aria-hidden="true">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-course text-white shadow-course">
              <Play className="h-6 w-6" strokeWidth={2.6} fill="currentColor" />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black leading-snug">{t('welcome.soAudio')}</span>
            <span className="mt-0.5 block text-[0.9375rem] font-bold leading-snug text-game-muted">{t('welcome.soAudioText', { listen: t('audio.play') })}</span>
          </span>
        </li>
        <li className={ROW}>
          <span className={ICON} aria-hidden="true">
            <span className="flex h-10 items-center justify-center rounded-xl bg-course px-2 text-[0.75rem] font-black uppercase tracking-wide text-white shadow-course">
              {t('item.check')}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-black leading-snug">{t('welcome.soCheck')}</span>
            <span className="mt-0.5 block text-[0.9375rem] font-bold leading-snug text-game-muted">{t('welcome.soCheckText', { check: t('item.check') })}</span>
          </span>
        </li>
      </ul>
    </div>
  );
}
