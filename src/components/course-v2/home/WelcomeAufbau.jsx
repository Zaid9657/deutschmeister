import { Trophy } from 'lucide-react';
import { Chest } from './StopNode.jsx';
import { hueVars } from './hue.js';

// The welcome's „aufbau" screen (pathModel.courseMap; owner 2026-10-01: "still no clear
// structure for the user as an introduction, tour"): „So ist A1.1 aufgebaut" as a small map,
// one row per Modul — its three Kapitel as little blocks in the colour of their banner on the
// path, then the gold chest of its Plateau, and after the last Modul the trophy of the
// Abschlusstest: the same chest and trophy the path draws (StopNode.jsx), so the learner knows
// them when they get there. Under it three one-line legend rows: Kapitel (with Kapitel 1's real
// title), Plateau, Abschlusstest. The map is decorative for screen readers; each row carries
// its sentence („Modul 1: Kapitel 1, 2, 3, dann Plateau 1."). Fits 390×844 without scrolling.

/** A Kapitel as a small block in its banner's hue, with its number. */
export function KapitelBlock({ nr, hue }) {
  return (
    <span
      style={hueVars(hue)}
      className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[color:var(--hue)] text-[0.9375rem] font-black text-white shadow-[0_3px_0_var(--hue-edge)]"
    >
      {nr}
    </span>
  );
}

/** The path's Plateau chest, small. */
export function MiniChest() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-game-xp-wash shadow-game-xp">
      <Chest size={26} />
    </span>
  );
}

/** The path's Abschlusstest trophy, small. */
export function MiniTrophy() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-game-xp-wash shadow-game-xp">
      <Trophy className="h-6 w-6 fill-game-xp text-game-xp-ink" strokeWidth={1.8} />
    </span>
  );
}

function LegendIcon({ row }) {
  if (row.key === 'plateau') return <MiniChest />;
  if (row.key === 'closing') return <MiniTrophy />;
  return (
    <span className="flex w-9 shrink-0 justify-center">
      <KapitelBlock nr={row.nr} hue={row.hue} />
    </span>
  );
}

export default function WelcomeAufbau({ map, headRef }) {
  return (
    <div>
      <h1 ref={headRef} tabIndex={-1} className="text-[1.75rem] font-black leading-tight">{map.heading}</h1>
      <ol aria-label={map.label} className="mt-6 flex flex-col gap-3">
        {map.modules.map((m) => (
          <li key={m.nr} className="flex items-center gap-2">
            <span className="sr-only">{m.sr}</span>
            <span aria-hidden="true" className="w-[3.75rem] shrink-0 text-[0.75rem] font-black uppercase leading-tight tracking-wider text-game-muted">
              {m.label}
            </span>
            <span aria-hidden="true" className="flex shrink-0 gap-1">
              {m.kapitel.map((k) => <KapitelBlock key={k.nr} nr={k.nr} hue={k.hue} />)}
            </span>
            {m.stop && (
              <span aria-hidden="true" className="flex min-w-0 items-center gap-1.5">
                {m.stop.kind === 'closing' ? <MiniTrophy /> : <MiniChest />}
                <span className="min-w-0 text-[0.8125rem] font-black leading-tight text-game-xp-ink [hyphens:auto]" lang="de">{m.stop.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <ul className="mt-6 flex flex-col gap-3.5 border-t-2 border-game-line pt-5">
        {map.legend.map((row) => (
          <li key={row.key} className="flex items-start gap-3">
            <span aria-hidden="true" className="flex pt-0.5">
              <LegendIcon row={row} />
            </span>
            <p className="min-w-0 text-[1rem] font-bold leading-snug text-game-muted">
              <span className="font-black text-game-text" lang="de">{row.term}</span>
              {' – '}
              {row.text}
              {row.example && <> <span className="font-extrabold text-game-text" lang="de">„{row.example}“</span></>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
