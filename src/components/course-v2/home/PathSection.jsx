import { Link } from 'react-router-dom';
import { Check, List } from 'lucide-react';
import CastAvatar from '../CastAvatar.jsx';
import { SkillIcon } from '../SkillIcon.jsx';
import PathNode from './PathNode.jsx';
import StopNode from './StopNode.jsx';
import UnitBanner from './UnitBanner.jsx';
import { hueVars } from './hue.js';

// The learning path (pathModel.js coursePath), read like a textbook's table of
// contents: per Modul a divider, per Kapitel its banner (the link to the Kapitel page)
// and what it teaches, then its steps — A, B, C, Prüfungstraining, Sprechen, Schreiben,
// Kapiteltest — each a node in the left rail with its label to the right (a finished
// Kapitel folds into one row of small checks), and the Modul's Plateau chest or the
// Abschlusstest trophy. Priya keeps the learner company under the current node —
// decorative only (aria-hidden), and only on the A1 levels, whose cast she is.

function Companion({ greeting }) {
  return (
    <span aria-hidden="true" className="pointer-events-none mt-3 flex flex-col items-center gap-1.5">
      <span className="max-w-[7rem] rounded-2xl border-2 border-game-line bg-white px-2.5 py-1 text-center text-sm font-extrabold leading-snug">{greeting}</span>
      <CastAvatar name="Priya" size={68} decorative />
    </span>
  );
}

// A finished Kapitel folds into one row of small check nodes — still links, still 44 px —
// so a returning learner reaches the current step without scrolling past every finished
// Kapitel. Under each check its letter (A, B, C) or its icon, so the row still reads as
// the Kapitel's sections.
function DoneRow({ unit }) {
  return (
    <ol
      aria-label={`Kapitel ${unit.nr}, alle Schritte geschafft`}
      className={`grid ${unit.nodes.length > 7 ? 'grid-cols-8' : 'grid-cols-7'} justify-items-center pb-7 pt-5`}
    >
      {unit.nodes.map((node) => (
        <li key={node.id} className="flex flex-col items-center gap-1">
          <Link
            to={node.href}
            aria-label={node.ariaLabel}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--hue)] text-white shadow-[0_3px_0_var(--hue-edge)] transition-transform duration-100 hover:brightness-105 active:translate-y-[3px] active:shadow-none"
          >
            <Check className="h-5 w-5" strokeWidth={3.4} aria-hidden="true" />
          </Link>
          <span aria-hidden="true" className="flex h-5 items-center text-sm font-black text-[color:var(--hue-edge)]">
            {node.letter || <SkillIcon skill={node.skills[0] || 'ueben'} className="h-4 w-4" />}
          </span>
        </li>
      ))}
    </ol>
  );
}

function UnitBlock({ unit, stepXp, withCast }) {
  const current = unit.nodes.find((n) => n.state === 'current') || null;
  return (
    <div style={hueVars(unit.hue)} className="pt-3">
      <UnitBanner unit={unit} />
      {unit.done && unit.nodes.length > 0 ? (
        <DoneRow unit={unit} />
      ) : unit.nodes.length > 0 ? (
        <ol aria-label={`Kapitel ${unit.nr}: ${unit.title}`} className="flex flex-col gap-3 pb-8 pt-5">
          {unit.nodes.map((node) => (
            <PathNode
              key={node.id}
              node={node}
              stepsTotal={unit.stepsTotal}
              minutes={unit.minutesPerStep}
              xp={stepXp}
              companion={withCast && node === current ? <Companion greeting={unit.stepsDone > 0 ? 'Weiter geht’s!' : 'Los geht’s!'} /> : null}
            />
          ))}
        </ol>
      ) : (
        <div className="h-6" aria-hidden="true" />
      )}
    </div>
  );
}

export default function PathSection({ path, stepXp, withCast = false, onShowPlan }) {
  if (!path) return null;
  return (
    <div id="lernpfad" className="mx-auto max-w-xl overflow-x-hidden px-4 pb-6 pt-2">
      {path.sections.map((section) => {
        const key = section.nr ?? 'rest';
        return (
          <section key={key} aria-labelledby={`dm-modul-${key}`}>
            <div className="mb-1 mt-7 flex items-center gap-2">
              <h2
                id={`dm-modul-${key}`}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-[0.8125rem] font-black uppercase tracking-[0.08em] text-game-muted"
              >
                <span className="min-w-0">{section.dividerLabel}</span>
                <span className="h-0.5 min-w-4 flex-1 bg-game-line" aria-hidden="true" />
              </h2>
              {section.nr != null && typeof onShowPlan === 'function' && (
                <a
                  href={`#kursplan-modul-${section.nr}`}
                  onClick={(e) => { e.preventDefault(); onShowPlan(section.nr); }}
                  aria-label={`Modul ${section.nr} im Inhalt ansehen`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-game-muted hover:bg-course-wash hover:text-course-ink"
                >
                  <List className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
                </a>
              )}
            </div>
            {section.units.map((unit) => (
              <UnitBlock key={unit.id} unit={unit} stepXp={stepXp} withCast={withCast} />
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
        );
      })}
    </div>
  );
}

