import { Check, Trophy } from 'lucide-react';
import { courseGame } from '../../../data/design-tokens.js';

// What closes a Modul on the learn path (pathModel.js StopNode): a gold treasure chest
// for a Plateau and a trophy for the Abschlusstest. The path draws them with PathNode like
// every step — a round-ish 3D button in the middle of the path, a „START" bubble when it
// is the current place, and the same popover beneath it (pathModel.stopPopover). A stop
// that is not compiled yet is grey and its popover says „Kommt bald".

export function Chest({ open = false, size = 46 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
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

const FACE =
  'relative flex h-20 w-[92px] items-center justify-center rounded-[22px] transition-transform duration-100';

/** The chest or trophy face of a stop: gold with a hard edge, a check badge once done, grey while not compiled. */
export function StopFace({ stop }) {
  const unavailable = stop.state === 'unavailable';
  const icon = stop.kind === 'closing'
    ? <Trophy className={`h-11 w-11 ${unavailable ? 'text-game-locked-icon' : 'fill-game-xp text-game-xp-ink'}`} strokeWidth={1.8} />
    : <Chest open={stop.state === 'done'} />;
  const face = unavailable ? (
    <span className={`${FACE} bg-game-locked opacity-80 shadow-game-locked grayscale`}>{icon}</span>
  ) : (
    <span className={`${FACE} bg-game-xp-wash shadow-game-xp group-hover:brightness-105 group-active:translate-y-1.5 group-active:shadow-none`}>
      {icon}
      {stop.state === 'done' && (
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-course text-white ring-2 ring-white">
          <Check className="h-4 w-4" strokeWidth={3.4} />
        </span>
      )}
    </span>
  );
  if (stop.state !== 'current') return face;
  return <span className="flex h-[104px] w-[112px] items-center justify-center rounded-[30px] border-[6px] border-game-xp-wash">{face}</span>;
}
