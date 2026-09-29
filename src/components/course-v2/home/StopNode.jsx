import { Link } from 'react-router-dom';
import { Check, Trophy } from 'lucide-react';
import { courseGame } from '../../../data/design-tokens.js';

// What closes an Etappe on the path (pathModel.js StopNode): a gold treasure chest
// for a Plateau („Wiederholung N · Schatzkiste") and a trophy for the closing test.
// Soft like the steps: open still links. A stop that is not compiled yet is grey,
// not a link, and says „kommt bald".

function Chest({ open = false }) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
        fill={courseGame.xp}
        stroke={courseGame.xpInk}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3 13h18" fill="none" stroke={courseGame.xpInk} strokeWidth="1.6" />
      <rect x="10" y="11" width="4" height="5" rx="1" fill={open ? courseGame.xpInk : courseGame.xpWash} stroke={courseGame.xpInk} strokeWidth="1.2" />
    </svg>
  );
}

const FACE = 'relative flex h-20 w-[92px] items-center justify-center rounded-[22px]';

export default function StopNode({ stop, companion = null }) {
  const unavailable = stop.state === 'unavailable';
  const current = stop.state === 'current';
  const icon = stop.kind === 'closing'
    ? <Trophy className={`h-11 w-11 ${unavailable ? 'text-game-locked-icon' : 'fill-game-xp text-game-xp-ink'}`} strokeWidth={1.8} aria-hidden="true" />
    : <Chest open={stop.state === 'done'} />;
  const badge = stop.state === 'done' && (
    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-course text-white ring-2 ring-white" aria-hidden="true">
      <Check className="h-4 w-4" strokeWidth={3.4} />
    </span>
  );

  const face = unavailable ? (
    <div className={`${FACE} bg-game-locked opacity-80 shadow-game-locked grayscale`} aria-hidden="true">{icon}</div>
  ) : (
    <Link
      to={stop.href}
      aria-label={stop.ariaLabel}
      className={`${FACE} bg-game-xp-wash shadow-game-xp transition-transform duration-100 hover:brightness-105 active:translate-y-1.5 active:shadow-none`}
    >
      {icon}
      {badge}
    </Link>
  );

  return (
    <div className="flex flex-col items-center gap-3 pb-2 pt-4">
      <div className="relative flex flex-col items-center">
        {current && (
          <span
            aria-hidden="true"
            className="relative mb-3 rounded-xl border-2 border-game-line bg-white px-3.5 py-1.5 text-[0.9375rem] font-black uppercase tracking-wider text-game-xp-ink motion-safe:animate-[float_2.4s_ease-in-out_infinite]"
          >
            Start
            <span className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-game-line bg-white" />
          </span>
        )}
        {current ? (
          <div className="flex h-[116px] w-[124px] items-center justify-center rounded-[30px] border-[7px] border-course-soft">{face}</div>
        ) : face}
        {companion}
      </div>
      <p className={`text-center text-[0.9375rem] font-black ${unavailable ? 'text-game-muted' : 'text-game-xp-ink'}`}>
        {stop.label}
        {unavailable && <span className="block text-sm font-bold">kommt bald</span>}
      </p>
    </div>
  );
}
