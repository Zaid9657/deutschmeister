import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import CastAvatar from '../CastAvatar.jsx';
import PathNode from './PathNode.jsx';
import StopNode from './StopNode.jsx';
import UnitBanner from './UnitBanner.jsx';
import { hueVars } from './hue.js';

// The learning path (pathModel.js coursePath): per Etappe a divider, per unit its
// banner and its Lernschritte in a zig-zag (a finished unit as one compact row), and
// the Etappe's treasure chest (or the closing trophy). Two of the cast keep the learner company — Priya beside the
// current step, Bilal a unit further down — decorative only (aria-hidden), and only
// on the A1 levels, whose cast they are.

function Companion({ offset = 0, greeting }) {
  // on the side away from the node's swing, so it never covers the path
  const side = offset >= 0 ? 'right-full mr-3' : 'left-full ml-3';
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute top-0 flex flex-col items-center gap-1.5 ${side}`}>
      <span className="max-w-[7.5rem] rounded-2xl border-2 border-game-line bg-white px-3 py-1.5 text-center text-sm font-extrabold leading-snug">{greeting}</span>
      <CastAvatar name="Priya" size={84} decorative />
    </div>
  );
}

// A finished unit folds into one row of small check nodes — still links, still 44 px —
// so a returning learner reaches the current step without scrolling past every
// finished zig-zag. The row reads like a shelf of what is done.
function DoneRow({ unit }) {
  return (
    <ol
      aria-label={`Lernschritte der Lektion ${unit.nr}, alle geschafft`}
      className={`grid ${unit.nodes.length > 7 ? 'grid-cols-8' : 'grid-cols-7'} justify-items-center pb-7 pt-5`}
    >
      {unit.nodes.map((node) => (
        <li key={node.id}>
          <Link
            to={node.href}
            aria-label={node.ariaLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--hue)] text-white shadow-[0_3px_0_var(--hue-edge)] transition-transform duration-100 hover:brightness-105 active:translate-y-[3px] active:shadow-none"
          >
            <Check className="h-5 w-5" strokeWidth={3.4} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ol>
  );
}

function UnitBlock({ unit, etappeNr, stepXp, withCast, bilal, onShowPlan }) {
  const current = unit.nodes.find((n) => n.state === 'current') || null;
  return (
    <div style={hueVars(unit.hue)}>
      <UnitBanner unit={unit} etappeNr={etappeNr} onShowPlan={onShowPlan} />
      {unit.done && unit.nodes.length > 0 ? (
        <DoneRow unit={unit} />
      ) : unit.nodes.length > 0 ? (
        <ol aria-label={`Lernschritte der Lektion ${unit.nr}`} className="relative flex flex-col items-center gap-[18px] pb-8 pt-7">
          {unit.nodes.map((node) => (
            <PathNode
              key={node.id}
              node={node}
              stepsTotal={unit.stepsTotal}
              minutes={unit.minutesPerStep}
              xp={stepXp}
              companion={withCast && node === current ? <Companion offset={node.offset} greeting={unit.stepsDone > 0 ? 'Weiter geht’s!' : 'Los geht’s!'} /> : null}
            />
          ))}
          {bilal && (
            <li aria-hidden="true" className={`pointer-events-none absolute top-24 ${unit.direction > 0 ? 'left-0' : 'right-0'}`}>
              <CastAvatar name="Bilal" size={80} decorative />
            </li>
          )}
        </ol>
      ) : (
        <div className="h-6" aria-hidden="true" />
      )}
    </div>
  );
}

export default function PathSection({ path, stepXp, withCast = false, onShowPlan }) {
  if (!path) return null;
  const units = path.sections.flatMap((s) => s.units);
  const currentAt = units.findIndex((u) => u.nodes.some((n) => n.state === 'current'));
  const bilalAt = currentAt >= 0 ? units.findIndex((u, i) => i > currentAt && u.nodes.length > 0) : -1;
  const bilalId = withCast && bilalAt >= 0 ? units[bilalAt].id : null;

  return (
    <div id="lernpfad" className="mx-auto max-w-md overflow-x-hidden px-4 pb-6 pt-2">
      {path.sections.map((section) => (
        <section key={section.nr ?? 'rest'} aria-labelledby={`dm-etappe-${section.nr ?? 'rest'}`}>
          <h2
            id={`dm-etappe-${section.nr ?? 'rest'}`}
            className="mb-3 mt-6 flex items-center gap-2.5 text-[0.8125rem] font-black uppercase tracking-[0.08em] text-game-muted"
          >
            <span className="h-0.5 flex-1 bg-game-line" aria-hidden="true" />
            <span className="max-w-[80%] text-center">{section.dividerLabel}</span>
            <span className="h-0.5 flex-1 bg-game-line" aria-hidden="true" />
          </h2>
          {section.units.map((unit) => (
            <UnitBlock
              key={unit.id}
              unit={unit}
              etappeNr={section.nr}
              stepXp={stepXp}
              withCast={withCast}
              bilal={unit.id === bilalId}
              onShowPlan={onShowPlan}
            />
          ))}
          {section.stop && (
            <StopNode
              stop={section.stop}
              companion={withCast && section.stop.state === 'current'
                ? <Companion greeting={section.stop.kind === 'closing' ? 'Endspurt!' : 'Schatzkiste!'} />
                : null}
            />
          )}
        </section>
      ))}
    </div>
  );
}
