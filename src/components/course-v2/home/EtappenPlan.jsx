import { Link } from 'react-router-dom';
import { Check, Gift, Trophy } from 'lucide-react';
import { hueVars } from './hue.js';

// „Ihr Weg in N Etappen" (pathModel.js planEtappen): a vertical timeline, one stop
// per Etappe with its units (each a link — the gate is soft) and what closes it: a
// treasure chest (Plateau) or the closing test. Each Etappe carries the anchor
// #kursplan-etappe-N that the path's unit banners jump to.
export default function EtappenPlan({ etappen = [] }) {
  if (!etappen.length) return null;
  return (
    <ol className="flex flex-col">
      {etappen.map((e, i) => {
        const EndIcon = e.end && e.end.kind === 'closing' ? Trophy : Gift;
        return (
          <li key={e.nr} id={`kursplan-etappe-${e.nr}`} className="flex scroll-mt-36 gap-3.5" style={hueVars(e.hue)}>
            <div className="flex w-9 shrink-0 flex-col items-center" aria-hidden="true">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--hue-edge)] text-base font-black text-white">{e.nr}</span>
              {i < etappen.length - 1 && <span className="my-1 w-1 flex-1 rounded-full bg-game-line" />}
            </div>
            <div className="min-w-0 flex-1 pb-5">
              <h3 className="mt-1 text-lg font-black leading-snug">
                <span className="sr-only">Etappe {e.nr}: </span>{e.title}
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {e.units.map((u) => {
                  const inner = (
                    <>
                      <span className="min-w-0 flex-1" lang="de">{u.title}</span>
                      {u.done && <Check className="h-5 w-5 shrink-0 text-[color:var(--hue-edge)]" strokeWidth={3.2} aria-hidden="true" />}
                      {u.done && <span className="sr-only">geschafft</span>}
                      {!u.available && <span className="shrink-0 text-sm font-bold text-game-muted">kommt bald</span>}
                    </>
                  );
                  const row = 'flex min-h-11 items-center gap-2 rounded-xl border-2 border-game-line bg-white px-3 py-2 text-[0.9375rem] font-extrabold';
                  return (
                    <li key={u.id}>
                      {u.href
                        ? <Link to={u.href} className={`${row} hover:border-[color:var(--hue)]`}>{inner}</Link>
                        : <div className={`${row} text-game-muted`}>{inner}</div>}
                    </li>
                  );
                })}
                {e.end && (
                  <li className="flex min-h-11 items-center gap-2 rounded-xl bg-game-xp-wash px-3 py-2 text-[0.9375rem] font-extrabold text-game-xp-ink">
                    <EndIcon className="h-5 w-5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
                    <span className="flex-1">{e.end.label}</span>
                    {e.end.done && <Check className="h-5 w-5 shrink-0" strokeWidth={3.2} aria-hidden="true" />}
                    {e.end.done && <span className="sr-only">geschafft</span>}
                  </li>
                )}
              </ul>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
