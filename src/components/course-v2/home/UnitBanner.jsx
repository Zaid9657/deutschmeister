import { List } from 'lucide-react';

// A unit's coloured banner on the path: „LEKTION 1 · 2 VON 7 GESCHAFFT" and the
// title, in the unit's hue (`--hue` / `--hue-edge` from hue.js) with a hard bottom
// edge. The small label sits on a darkened pill so white stays ≥ 4.5:1 on every hue.
// The list button opens the course plan at this unit's Etappe. A unit that is not
// compiled yet is grey and says „kommt bald".
export default function UnitBanner({ unit, etappeNr = null, onShowPlan }) {
  const grey = !unit.available;
  return (
    <div
      className={`flex items-center gap-3 rounded-[18px] p-4 ${
        grey ? 'bg-game-locked text-game-muted shadow-game-locked' : 'bg-[color:var(--hue)] text-white shadow-[0_5px_0_var(--hue-edge)]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`inline-block rounded-lg px-2.5 py-0.5 text-[0.8125rem] font-black uppercase tracking-wider ${
            grey ? 'bg-white/70' : 'bg-black/20'
          }`}
        >
          {unit.bannerLabel}
        </p>
        <h3 className="mt-1 text-[1.375rem] font-black leading-tight [hyphens:auto]" lang="de">{unit.title}</h3>
      </div>
      {etappeNr != null && typeof onShowPlan === 'function' && (
        <a
          href={`#kursplan-etappe-${etappeNr}`}
          onClick={(e) => { e.preventDefault(); onShowPlan(etappeNr); }}
          aria-label={`Lektion ${unit.nr} im Kursplan ansehen (Etappe ${etappeNr})`}
          className={`flex h-12 w-[52px] shrink-0 items-center justify-center rounded-2xl border-2 ${
            grey ? 'border-game-muted/40 hover:bg-white/60' : 'border-white hover:bg-white/15'
          }`}
        >
          <List className="h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
