import { Check, CheckCheck, Flame } from 'lucide-react';

/**
 * "Kann ich" on the course home (Wave 1, 2026-10-14): ability, not activity. It took the place of
 * the XP tile, and it is the first thing a returning learner reads. The lines are the course's own
 * can-dos and their states come from src/lib/course/canDo.js; a double tick means the chapter
 * checkpoint after that Lektion is passed too. English chrome, like the rest of the course home.
 */
export default function KannIch({ items, checkpointsPassed, checkpointsTotal, streak = 0 }) {
  const shown = items.filter((c) => c.state !== 'open');
  const latest = shown.slice(-3);
  return (
    <section aria-labelledby="kann-ich-title" className="rounded-clay border border-rule bg-white p-4">
      <h2 id="kann-ich-title" className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">
        Kann ich · what you can do in German
      </h2>
      <p className="mt-1 text-[0.875rem] text-graphite">
        <span className="font-display text-[1.5rem] font-semibold leading-none text-ink">{shown.length}</span> of {items.length} can-dos, from your finished Lektionen
      </p>
      <ul className="mt-3 space-y-1.5">
        {latest.map((c) => <Line key={c.id} item={c} />)}
      </ul>
      {shown.length > latest.length && (
        <details className="mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-bold text-siegel-deep underline underline-offset-2 hover:text-ink">
            All {shown.length}
          </summary>
          <ul className="mt-1 space-y-1.5">
            {shown.map((c) => <Line key={c.id} item={c} />)}
          </ul>
        </details>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule pt-2 text-[0.8125rem] text-graphite">
        <span className="inline-flex items-center gap-1.5">
          <CheckCheck className="h-4 w-4 text-siegel-deep" aria-hidden="true" /> {checkpointsPassed} of {checkpointsTotal} chapter checkpoints passed
        </span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-accent-aprikose-ink" aria-hidden="true" /> {streak}-day streak
          </span>
        )}
      </p>
    </section>
  );
}

function Line({ item }) {
  const Icon = item.state === 'again' ? CheckCheck : Check;
  return (
    <li className="flex items-start gap-2 text-[0.9375rem] leading-snug text-ink">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-siegel-deep" aria-hidden="true" />
      <span>
        {item.en || item.de}
        {item.state === 'again' && <span className="sr-only"> (chapter checkpoint passed)</span>}
      </span>
    </li>
  );
}
