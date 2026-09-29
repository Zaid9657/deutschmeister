import { Link } from 'react-router-dom';
import { Check, Trophy } from 'lucide-react';
import { courseGame } from '../../../data/design-tokens.js';
import { RAIL } from './PathNode.jsx';

// What closes a Modul on the path (pathModel.js StopNode), in the node rail like every
// step, with its label to the right: a gold treasure chest for a Plateau („Plateau 1 ·
// Wiederholung — Kapitel 1–3 wiederholen · Prüfungsteile") and a trophy for the
// Abschlusstest. Soft like the steps: open still links, and the whole row is the link. A
// stop that is not compiled yet is grey, not a link, and says „kommt bald".

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
    <span className={`${FACE} bg-game-locked opacity-80 shadow-game-locked grayscale`}>{icon}</span>
  ) : (
    <span className={`${FACE} bg-game-xp-wash shadow-game-xp transition-transform duration-100 group-hover:brightness-105 group-active:translate-y-1.5 group-active:shadow-none`}>
      {icon}
      {badge}
    </span>
  );

  const rail = (
    <span className={`flex ${RAIL} shrink-0 flex-col items-center`}>
      {current && (
        <span
          aria-hidden="true"
          className="relative mb-3 rounded-xl border-2 border-game-line bg-white px-3.5 py-1.5 text-[0.9375rem] font-black uppercase tracking-wider text-game-xp-ink motion-safe:animate-[float_2.4s_ease-in-out_infinite]"
        >
          Start
          <span className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-game-line bg-white" />
        </span>
      )}
      <span aria-hidden="true" className="flex">
        {current
          ? <span className="flex h-[104px] w-[112px] items-center justify-center rounded-[30px] border-[6px] border-course-soft">{face}</span>
          : face}
      </span>
      {companion}
    </span>
  );

  const label = (
    <span
      className={`block min-w-0 flex-1 rounded-2xl px-3 py-2.5 ${
        unavailable ? 'border-2 border-game-line bg-white' : 'bg-game-xp-wash transition-colors group-hover:bg-game-xp-wash/70'
      }`}
    >
      <span className={`block text-base font-black leading-snug ${unavailable ? 'text-game-muted' : 'text-game-xp-ink'}`}>{stop.label}</span>
      {stop.detail && (
        <span className={`mt-0.5 block text-sm font-bold leading-snug ${unavailable ? 'text-game-muted' : 'text-game-xp-ink'}`}>{stop.detail}</span>
      )}
      {unavailable && <span className="mt-0.5 block text-sm font-bold text-game-muted">kommt bald</span>}
      {current && <span className="mt-1 block text-sm font-black uppercase tracking-wide text-game-xp-ink">Jetzt starten</span>}
    </span>
  );

  if (unavailable) {
    return (
      <div className="flex items-center gap-3 py-4" aria-label={stop.ariaLabel} role="group">
        {rail}
        {label}
      </div>
    );
  }
  return (
    <Link to={stop.href} aria-label={stop.ariaLabel} className="group flex items-center gap-3 rounded-2xl py-4">
      {rail}
      {label}
    </Link>
  );
}
