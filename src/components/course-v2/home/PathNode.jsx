import { Link } from 'react-router-dom';
import { Check, Crown, Mic, PenLine, RefreshCw, Star, Target } from 'lucide-react';

// One Lernschritt on the path (pathModel.js Node): a round button with a hard
// bottom edge, shifted sideways by the zig-zag offset. Done → the unit's hue and a
// check; open → grey, but still a link (the gate is soft); current → bigger, ringed,
// a bouncing START bubble above it and a card below with the step, its minutes and
// the XP it earns. The hue arrives as the `--hue` / `--hue-edge` variables of the
// unit's wrapper (hue.js), so every class here is a literal Tailwind string.

const ICONS = { Star, Target, Mic, PenLine, RefreshCw, Crown };
const FILLED = new Set(['Star', 'Crown']);

function NodeIcon({ node, className }) {
  if (node.state === 'done') return <Check className={className} strokeWidth={3.4} aria-hidden="true" />;
  const Icon = ICONS[node.icon] || Star;
  return <Icon className={className} strokeWidth={2.6} fill={FILLED.has(node.icon) ? 'currentColor' : 'none'} aria-hidden="true" />;
}

const FACE =
  'flex h-[66px] w-[74px] items-center justify-center rounded-[50%] transition-transform duration-100 active:translate-y-1.5 active:shadow-none';

export default function PathNode({ node, stepsTotal, minutes = null, xp = null, companion = null }) {
  const shift = { transform: `translateX(${node.offset}px)` };

  if (node.state !== 'current') {
    const tone = node.state === 'done'
      ? 'bg-[color:var(--hue)] text-white shadow-[0_6px_0_var(--hue-edge)] hover:brightness-105'
      : 'bg-game-locked text-game-locked-icon shadow-game-locked hover:brightness-95';
    return (
      <li className="flex justify-center" style={shift}>
        <Link to={node.href} aria-label={node.ariaLabel} className={`${FACE} ${tone}`}>
          <NodeIcon node={node} className="h-8 w-8" />
        </Link>
      </li>
    );
  }

  const name = node.title || node.label;
  return (
    <li className="flex flex-col items-center">
      <div className="relative flex flex-col items-center" style={shift}>
        <span
          aria-hidden="true"
          className="relative mb-3 rounded-xl border-2 border-game-line bg-white px-3.5 py-1.5 text-[0.9375rem] font-black uppercase tracking-wider text-[color:var(--hue-edge)] motion-safe:animate-[float_2.4s_ease-in-out_infinite]"
        >
          Start
          <span className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-game-line bg-white" />
        </span>
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-course-soft">
          <Link
            to={node.href}
            tabIndex={-1}
            aria-label={node.ariaLabel}
            className={`${FACE} -mt-1.5 bg-[color:var(--hue)] text-white shadow-[0_7px_0_var(--hue-edge)] hover:brightness-105`}
          >
            <NodeIcon node={node} className="h-8 w-8" />
          </Link>
        </div>
        {companion}
      </div>
      <div className="mt-5 w-full max-w-[300px] rounded-[18px] bg-[color:var(--hue-edge)] p-4 text-white">
        <p className="text-[1.1875rem] font-black leading-snug">{name}</p>
        <p className="text-[0.9375rem] font-bold">
          Lernschritt {node.stepNr} von {stepsTotal}{minutes ? ` · etwa ${minutes} Minuten` : ''}
        </p>
        <Link
          to={node.href}
          className="mt-3 flex min-h-12 items-center justify-center rounded-clay bg-white px-4 py-3 text-center text-[1.1875rem] font-black uppercase tracking-wide text-[color:var(--hue-edge)] shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-transform duration-100 hover:bg-course-wash active:translate-y-1 active:shadow-none"
        >
          Start{xp ? ` · +${xp} XP` : ''}
          <span className="sr-only">: Lernschritt {node.stepNr}, {name}</span>
        </Link>
      </div>
    </li>
  );
}
