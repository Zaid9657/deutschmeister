import { Link } from 'react-router-dom';
import { Check, Crown, Mic, PenLine, RefreshCw, Star, Target } from 'lucide-react';
import { SkillChips } from '../SkillIcon.jsx';

// One step of a Kapitel on the path (pathModel.js Node), drawn as a line of a textbook
// „Inhalt": the round node in the left RAIL (swung a little by the path's wave), and to
// its right the label that says what the step teaches — „Teil A · Ich bin Priya. Und
// Sie?", „Grammatik: Präsens" and the skills it trains. The situation steps show their
// letter on the node (A, B, C), the others their icon; done → the Kapitel's hue and a
// check; open → grey, but still a link (the gate is soft); current → bigger, ringed, a
// bouncing START bubble, and the label becomes the coloured card with the one START
// button. The hue arrives as `--hue` / `--hue-edge` from the Kapitel's wrapper (hue.js),
// so every class here is a literal Tailwind string.

const ICONS = { Star, Target, Mic, PenLine, RefreshCw, Crown };
const FILLED = new Set(['Star', 'Crown']);

/** The node rail's width; the Kapitel banner, the stops and the done row line up with it. */
export const RAIL = 'w-[100px]';

function NodeFace({ node, className }) {
  if (node.state === 'done') return <Check className={className} strokeWidth={3.4} aria-hidden="true" />;
  if (node.letter) return <span className="text-[1.75rem] font-black leading-none" aria-hidden="true">{node.letter}</span>;
  const Icon = ICONS[node.icon] || Star;
  return <Icon className={className} strokeWidth={2.6} fill={FILLED.has(node.icon) ? 'currentColor' : 'none'} aria-hidden="true" />;
}

const FACE =
  'flex h-[66px] w-[74px] items-center justify-center rounded-[50%] transition-transform duration-100';

// SkillChips, compact and a little tighter, so a situation's six or seven skills fit on
// one line next to the rail at 390 px.
const CHIPS = 'mt-1.5 !gap-1 [&>li]:px-1';

/** „Teil A" over „Ich bin Priya. Und Sie?" — or „Kapiteltest" alone. */
function Heading({ node, eyebrowClass, titleClass }) {
  const eyebrow = node.title ? node.tag : null;
  return (
    <>
      {eyebrow && <span className={eyebrowClass}>{eyebrow}<span className="sr-only">: </span></span>}
      <span className={titleClass} lang="de">{node.title || node.tag}</span>
    </>
  );
}

export default function PathNode({ node, stepsTotal, minutes = null, xp = null, companion = null }) {
  const shift = { transform: `translateX(${node.offset}px)` };

  if (node.state !== 'current') {
    const tone = node.state === 'done'
      ? 'bg-[color:var(--hue)] text-white shadow-[0_6px_0_var(--hue-edge)] group-hover:brightness-105'
      : 'bg-game-locked text-game-locked-icon shadow-game-locked group-hover:brightness-95';
    return (
      <li>
        <Link to={node.href} aria-label={node.ariaLabel} className="group flex min-h-[78px] items-center gap-3 rounded-2xl">
          <span className={`flex ${RAIL} shrink-0 justify-center pb-1.5`} aria-hidden="true">
            <span style={shift}>
              <span className={`${FACE} ${tone} group-active:translate-y-1.5 group-active:shadow-none`}>
                <NodeFace node={node} className="h-8 w-8" />
              </span>
            </span>
          </span>
          <span className="block min-w-0 flex-1 rounded-2xl border-2 border-b-4 border-game-line bg-white px-3 py-2 transition-colors group-hover:border-[color:var(--hue)]">
            <Heading
              node={node}
              eyebrowClass="block text-[0.75rem] font-black uppercase leading-tight tracking-wider text-[color:var(--hue-edge)]"
              titleClass="block text-base font-black leading-snug text-game-text [hyphens:auto]"
            />
            {node.grammar && (
              <span className="mt-0.5 block text-sm font-bold leading-snug text-game-muted">Grammatik: {node.grammar}</span>
            )}
            {node.letter && <SkillChips skills={node.skills} compact className={CHIPS} />}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3">
      <div className={`flex ${RAIL} shrink-0 flex-col items-center`}>
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
              className={`${FACE} -mt-1.5 bg-[color:var(--hue)] text-white shadow-[0_7px_0_var(--hue-edge)] hover:brightness-105 active:translate-y-1.5 active:shadow-none`}
            >
              <NodeFace node={node} className="h-8 w-8" />
            </Link>
          </div>
        </div>
        {companion}
      </div>
      <div className="min-w-0 flex-1 rounded-[18px] bg-[color:var(--hue-edge)] p-3.5 text-white">
        <p>
          <Heading
            node={node}
            eyebrowClass="block text-[0.75rem] font-black uppercase leading-tight tracking-wider"
            titleClass="mt-0.5 block text-[1.1875rem] font-black leading-snug [hyphens:auto]"
          />
        </p>
        {node.grammar && <p className="mt-1 text-[0.9375rem] font-bold leading-snug">Grammatik: {node.grammar}</p>}
        <SkillChips skills={node.skills} compact className={`mt-0.5 ${CHIPS}`} />
        <p className="mt-2 text-sm font-bold leading-snug">
          Schritt {node.stepNr} von {stepsTotal}{minutes ? ` · etwa ${minutes} Minuten` : ''}
        </p>
        <Link
          to={node.href}
          className="mt-3 flex min-h-12 items-center justify-center rounded-clay bg-white px-3 py-3 text-center text-[1.0625rem] font-black uppercase tracking-wide text-[color:var(--hue-edge)] shadow-[0_4px_0_rgba(0,0,0,0.2)] transition-transform duration-100 hover:bg-course-wash active:translate-y-1 active:shadow-none"
        >
          Start{xp ? ` · +${xp} XP` : ''}
          <span className="sr-only">: {node.ariaLabel}</span>
        </Link>
      </div>
    </li>
  );
}
