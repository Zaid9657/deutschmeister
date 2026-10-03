import { Check, Crown, Flag, Mic, PenLine, RefreshCw, Star, Target } from 'lucide-react';
import { courseGame } from '../../../data/design-tokens.js';
import NodePopover from './NodePopover.jsx';

// One place on the learn path, Duolingo style: a BIG round 3D button in the path's
// zig-zag (pathModel ZIGZAG — `offset` px from the centre), no label next to it. The
// button is a disclosure (aria-expanded): a tap opens the popover directly beneath it
// (NodePopover) with the step's name and its one button; the step's name and state are
// in the button's accessible name, since nothing is written beside the node any more.
// The current place wears a bouncing „START" bubble above it (motion-safe) and — for a
// step — a progress ring of its Kapitel. `face` is what the button shows (StepFace here,
// StopFace for a chest or trophy). The Kapitel's hue arrives as `--hue` / `--hue-edge`
// from the Kapitel's wrapper (hue.js), so every class stays a literal Tailwind string.
// Since the tour (2026-10-01) the current place carries `data-tour="start"` (`tour`), the
// coach marks' first spotlight, and a chest or trophy shows its short name under it
// (`caption`: „Plateau 1", „Abschlusstest" — decorative, the button's name says it).

/** The node icons by lucide name (pathModel NODE_ICON) — the welcome's mini path draws the same ones. */
export const ICONS = { Star, Target, Mic, PenLine, RefreshCw, Crown, Flag };
export const FILLED = new Set(['Star', 'Crown']);

const FACE =
  'flex h-16 w-[72px] items-center justify-center rounded-[50%] transition-transform duration-100 ' +
  'group-active:translate-y-1.5 group-active:shadow-none';
const LIT = 'bg-[color:var(--hue)] text-white shadow-[0_6px_0_var(--hue-edge)] group-hover:brightness-105';
const GREY = 'bg-game-locked text-game-locked-icon shadow-game-locked group-hover:brightness-95';

/** A step's round face: done → a check on the hue; current → its icon on the hue, ringed; not yet / soon → grey. */
export function StepFace({ node, percent = 0 }) {
  const lit = node.state === 'done' || node.state === 'current';
  const Icon = ICONS[node.icon] || Star;
  const glyph = node.state === 'done'
    ? <Check className="h-9 w-9" strokeWidth={3.6} />
    : <Icon className="h-8 w-8" strokeWidth={2.6} fill={FILLED.has(node.icon) ? 'currentColor' : 'none'} />;
  const face = <span className={`${FACE} ${lit ? LIT : GREY}`}>{glyph}</span>;
  if (node.state !== 'current') return face;
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const ring = { background: `conic-gradient(var(--hue) 0 ${pct}%, ${courseGame.locked} ${pct}% 100%)` };
  return (
    <span className="flex h-24 w-24 items-center justify-center rounded-full" style={ring}>
      <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-course-ground">
        <span className="-mt-1.5">{face}</span>
      </span>
    </span>
  );
}

/** The bouncing „START" bubble over the current place (decorative: the button's name says it). */
export function StartBubble({ tone = 'hue' }) {
  return (
    <span
      aria-hidden="true"
      className={`relative mb-2.5 rounded-xl border-2 border-game-line bg-white px-3.5 py-1.5 text-[0.9375rem] font-black uppercase tracking-wider motion-safe:animate-[float_2.4s_ease-in-out_infinite] ${
        tone === 'xp' ? 'text-game-xp-ink' : 'text-[color:var(--hue-edge)]'
      }`}
    >
      Start
      <span className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-game-line bg-white" />
    </span>
  );
}

export default function PathNode({
  anchorId, offset = 0, ariaLabel, current = false, bubbleTone = 'hue', open = false, onToggle, popover, face, companion = null,
  tour = null, caption = null, captionMuted = false,
}) {
  const popId = `${anchorId}-popover`;
  return (
    <li className="relative flex justify-center" data-node-row={anchorId}>
      {companion && (
        // decorative company on the far side of the wave (the A1 cast), never a target
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 motion-safe:animate-pop-in ${Number(offset) > 0 ? 'left-1' : 'right-1'}`}
        >
          {companion}
        </span>
      )}
      <div className="flex flex-col items-center" style={{ transform: `translateX(${Number(offset) || 0}px)` }} data-tour={tour || undefined}>
        {current && <StartBubble tone={bubbleTone} />}
        <button
          id={anchorId}
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={popId}
          className="group flex min-h-11 min-w-11 scroll-my-48 items-center justify-center rounded-full"
        >
          <span className="sr-only">{ariaLabel}</span>
          <span aria-hidden="true" className="flex">{face}</span>
        </button>
        {caption && (
          <span
            aria-hidden="true"
            className={`mt-2.5 text-[0.8125rem] font-black uppercase tracking-wider ${captionMuted ? 'text-game-muted' : 'text-game-xp-ink'}`}
          >
            {caption}
          </span>
        )}
      </div>
      {open && popover && <NodePopover id={popId} popover={popover} offset={offset} />}
    </li>
  );
}
