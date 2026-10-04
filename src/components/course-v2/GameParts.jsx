import { Check } from 'lucide-react';
import useCourseGame from './useCourseGame.js';
import { useV2Strings } from './strings.js';

// The small game pieces the course player shares: the flame and the XP star, the speech
// bubble, the stat tile, the streak card with its week row, the star burst and the trophy,
// and the sticky bottom bar for a screen's one primary action. Every fill is a token class
// (fill-game-xp, fill-course, fill-accent-himbeer …) — never a hex value, never a kasus hue.

const FLAME_PATH =
  'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z';

/** The streak / combo flame; `lit={false}` is the grey of a day still open. */
export function FlameIcon({ size = 22, lit = true, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${lit ? 'fill-game-flame stroke-game-flame-edge' : 'fill-game-locked stroke-game-locked-edge'} ${className}`}
    >
      <path d={FLAME_PATH} />
    </svg>
  );
}

/** The XP star (gold face, darker gold edge). */
export function XpIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true" className={`fill-game-xp stroke-game-xp-edge ${className}`}>
      <path d="M12 2.8l2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.14l-5.62 2.96 1.07-6.27L2.9 9.4l6.3-.9z" />
    </svg>
  );
}

/**
 * A speech bubble. `tail`: 'down' (the speaker stands below, the intro), 'left' (the speaker
 * sits to the left, an exercise or the recap teaser) or null.
 */
export function SpeechBubble({ tail = 'down', className = '', children, ...rest }) {
  return (
    <div className={`relative rounded-[1.25rem] border-2 border-game-line bg-white px-4 py-3.5 ${className}`} {...rest}>
      {children}
      {tail === 'down' && (
        <span aria-hidden="true" className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-game-line bg-white" />
      )}
      {tail === 'left' && (
        <span aria-hidden="true" className="absolute -left-[9px] bottom-5 h-4 w-4 rotate-45 border-b-2 border-l-2 border-game-line bg-white" />
      )}
    </div>
  );
}

// Full literal class strings per tone: a bright border and a wash band with its ink (AA for
// the small uppercase label), the value in the same ink.
const TILE = {
  xp: { box: 'border-game-xp', band: 'bg-game-xp-wash text-game-xp-ink', value: 'text-game-xp-ink' },
  course: { box: 'border-course', band: 'bg-course-wash text-course-ink', value: 'text-course-ink' },
  time: { box: 'border-accent-aprikose', band: 'bg-accent-aprikose-wash text-accent-aprikose-ink', value: 'text-accent-aprikose-ink' },
};

/** One of the three result tiles: XP · RICHTIG · ZEIT. */
export function StatTile({ label, value, tone = 'course', className = '' }) {
  const c = TILE[tone] || TILE.course;
  return (
    <div className={`overflow-hidden rounded-2xl border-2 border-b-4 bg-white ${c.box} ${className}`}>
      <p className={`px-1 py-1.5 text-center text-[0.75rem] font-extrabold uppercase tracking-[0.08em] ${c.band}`}>{label}</p>
      <p className={`px-1 py-2.5 text-center text-[1.375rem] font-extrabold tabular-nums ${c.value}`}>{value}</p>
    </div>
  );
}

/** Seconds as mm:ss (a step's time on the celebration tile). */
export function clock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The streak card: „3 Tage in Folge!" and the week, Monday first. A learning day is a local
 * day with a finished Lernschritt (gamify.js); today, still open, is ringed, never marked lost.
 */
export function StreakCard({ className = '' }) {
  const [, t] = useV2Strings();
  const { streak, week } = useCourseGame();
  return (
    <div className={`rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white px-4 py-3.5 ${className}`}>
      <div className="flex items-center gap-2.5">
        <FlameIcon size={30} lit={streak > 0} />
        <p className="text-[1.125rem] font-extrabold text-game-text">
          {streak > 1 ? t('game.streak', { n: streak }) : streak === 1 ? t('game.streakOne') : t('game.streakNone')}
        </p>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1 text-center" aria-label={t('game.week')}>
        {week.map((d, i) => (
          <li key={d.key} className="flex flex-col items-center gap-1">
            <span className={`text-[0.75rem] font-extrabold ${d.today ? 'text-course-ink' : 'text-game-muted'}`} aria-hidden="true">{t(`game.wd${i}`)}</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                d.done ? 'border-game-flame-edge bg-game-flame text-white' : d.today ? 'border-course bg-white' : 'border-game-line bg-white'
              }`}
            >
              {d.done && <Check className="h-3.5 w-3.5" strokeWidth={3.5} aria-hidden="true" />}
            </span>
            <span className="sr-only">
              {t(`game.wd${i}`)}: {d.done ? t('player.doneMark') : d.today ? t('game.today') : t('game.dayOpen')}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The step celebration's star burst: a gold star on a warm disc, confetti in the energy accents. */
export function StarBurst({ className = '' }) {
  return (
    <svg width="180" height="170" viewBox="0 0 180 170" aria-hidden="true" className={className}>
      <circle cx="90" cy="88" r="70" className="fill-game-xp-wash" />
      <g className="origin-center motion-safe:animate-pop-in">
        <circle cx="26" cy="36" r="7" className="fill-accent-aprikose" />
        <circle cx="158" cy="44" r="6" className="fill-accent-himbeer" />
        <circle cx="150" cy="140" r="8" className="fill-game-flame" />
        <circle cx="24" cy="128" r="6" className="fill-course" />
        <rect x="140" y="12" width="12" height="12" rx="3" className="fill-course" transform="rotate(20 146 18)" />
        <rect x="36" y="150" width="10" height="10" rx="3" className="fill-accent-himbeer" transform="rotate(-15 41 155)" />
      </g>
      <g className="origin-center motion-safe:animate-pop-in">
        <path
          d="M90 30l17.6 35.6 39.3 5.7-28.5 27.7 6.7 39.1L90 119.6l-35.1 18.5 6.7-39.1-28.5-27.7 39.3-5.7z"
          strokeWidth="5"
          strokeLinejoin="round"
          className="fill-game-xp stroke-game-xp-edge"
        />
        <path d="M78 84c3 3 7 3 10 0M92 84c3 3 7 3 10 0" strokeWidth="4" fill="none" strokeLinecap="round" className="stroke-game-xp-ink" />
      </g>
    </svg>
  );
}

/** The unit's trophy (the recap): a gold cup on a warm disc. */
export function Trophy({ className = '' }) {
  return (
    <svg width="170" height="160" viewBox="0 0 170 160" aria-hidden="true" className={className}>
      <circle cx="85" cy="82" r="68" className="fill-game-xp-wash" />
      <g className="origin-center motion-safe:animate-pop-in">
        <circle cx="22" cy="40" r="7" className="fill-accent-himbeer" />
        <circle cx="150" cy="36" r="6" className="fill-course" />
        <circle cx="148" cy="128" r="7" className="fill-accent-aprikose" />
        <rect x="18" y="118" width="11" height="11" rx="3" className="fill-game-flame" transform="rotate(18 23 123)" />
      </g>
      <g className="origin-center motion-safe:animate-pop-in" strokeWidth="5" strokeLinejoin="round">
        <path d="M55 46c-16 0-20 8-20 14 0 12 12 20 26 22" fill="none" strokeLinecap="round" className="stroke-game-xp-edge" />
        <path d="M115 46c16 0 20 8 20 14 0 12-12 20-26 22" fill="none" strokeLinecap="round" className="stroke-game-xp-edge" />
        <path d="M52 34h66v24c0 22-15 38-33 38S52 80 52 58z" className="fill-game-xp stroke-game-xp-edge" />
        <path d="M78 96h14v16H78z" className="fill-game-xp stroke-game-xp-edge" />
        <path d="M60 112h50a4 4 0 0 1 4 4v10H56v-10a4 4 0 0 1 4-4z" className="fill-game-xp stroke-game-xp-edge" />
        <path d="M85 48l4.7 9.5 10.5 1.5-7.6 7.4 1.8 10.4L85 71.9l-9.4 4.9 1.8-10.4-7.6-7.4 10.5-1.5z" strokeWidth="0" className="fill-white" />
      </g>
    </svg>
  );
}

/**
 * The screen's one primary action in the thumb zone: fixed to the bottom on a phone (the
 * player route has no bottom tabs, src/lib/chrome.js), in flow from `sm` up. The page content
 * above it needs `pb-32 sm:pb-0` so nothing hides under the bar.
 */
export function StickyAction({ children, className = '' }) {
  return (
    <div
      className={
        'fixed inset-x-0 bottom-0 z-40 border-t-2 border-game-line bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ' +
        `sm:static sm:z-auto sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 ${className}`
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col items-stretch gap-2">{children}</div>
    </div>
  );
}
