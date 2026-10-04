import { Link } from 'react-router-dom';

// The bubble under a tapped node (pathModel.nodePopover / stopPopover): the step's name,
// „Lernschritt 1 von 7" and ONE full-width button — „Start +20 XP" (current),
// „Wiederholen" (done), „Trotzdem starten" (not yet: the gate stays soft), or no button
// and „Kommt bald" (not compiled). Its arrow points at the node, which the path's wave
// has shifted by `offset` px. The tones are literal class strings (Tailwind JIT):
//   hue   — done or current: the Kapitel's edge colour (white on it ≥ 4.5:1), a white button
//   xp    — a Plateau chest or the Abschlusstest: the chest's gold wash, a gold button
//   quiet — not yet: white with a grey border, a quiet button
//   soon  — not compiled: white with a grey border, no button

const BOX = {
  hue: 'bg-[color:var(--hue-edge)] text-white',
  xp: 'border-2 border-game-xp bg-game-xp-wash text-game-xp-ink',
  quiet: 'border-2 border-game-line bg-white text-game-text',
  soon: 'border-2 border-game-line bg-white text-game-muted',
};
const ARROW = {
  hue: 'bg-[color:var(--hue-edge)]',
  xp: 'border-l-2 border-t-2 border-game-xp bg-game-xp-wash',
  quiet: 'border-l-2 border-t-2 border-game-line bg-white',
  soon: 'border-l-2 border-t-2 border-game-line bg-white',
};
const ACTION_BASE =
  'mt-3.5 flex min-h-12 w-full items-center justify-center rounded-clay px-4 py-3 text-center text-[1.0625rem] font-black uppercase ' +
  'tracking-wide transition-transform duration-100 active:translate-y-1 active:shadow-none';
const ACTION = {
  hue: 'bg-white text-[color:var(--hue-edge)] shadow-[0_4px_0_rgba(0,0,0,0.25)] hover:bg-course-wash',
  xp: 'bg-game-xp text-game-xp-ink shadow-game-xp hover:brightness-105',
  quiet: 'border-2 border-b-4 border-game-line bg-white text-course-ink hover:bg-course-wash active:border-b-2',
};

export default function NodePopover({ id, popover, offset = 0 }) {
  const tone = BOX[popover.tone] ? popover.tone : 'quiet';
  const arrow = { left: `calc(50% + ${Number(offset) || 0}px)` };
  return (
    <div id={id} className="absolute inset-x-0 top-full z-[25] mt-3 flex justify-center">
      <div className={`relative w-full max-w-[22rem] rounded-[20px] p-4 motion-safe:animate-pop-in ${BOX[tone]}`}>
        <span aria-hidden="true" className={`absolute -top-2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] ${ARROW[tone]}`} style={arrow} />
        <p className="relative text-lg font-black leading-snug [hyphens:auto]" lang="de">{popover.title}</p>
        {popover.meta && <p className="relative mt-0.5 text-[0.9375rem] font-bold leading-snug">{popover.meta}</p>}
        {popover.action && popover.href && (
          <Link to={popover.href} className={`${ACTION_BASE} ${ACTION[tone] || ACTION.quiet}`}>
            {popover.action}
          </Link>
        )}
      </div>
    </div>
  );
}
