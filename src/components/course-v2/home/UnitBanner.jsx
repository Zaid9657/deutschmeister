import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// A Kapitel's coloured banner on the path: „KAPITEL 1 · 2 VON 7 GESCHAFFT" and the
// title, in the Kapitel's hue (`--hue` / `--hue-edge` from hue.js) with a hard bottom
// edge. The whole banner opens the Kapitel page (`/course/<level>/u/<nr>`, the player's
// Kapitelübersicht); the white „Übersicht" pill says so. The small label sits on a
// darkened pill so white stays ≥ 4.5:1 on every hue, and the pill's text is the hue's
// edge on white (≥ 5:1). Under the banner, one line of what the Kapitel teaches
// (pathModel.kapitelSummary): „Grammatik: Präsens · Aussagesatz und W-Frage · 35 neue
// Wörter". A Kapitel that is not compiled yet is grey, not a link, and says „kommt bald".
export default function UnitBanner({ unit }) {
  const grey = !unit.available || !unit.href;
  const body = (
    <>
      <p
        className={`inline-block rounded-lg px-2.5 py-0.5 text-[0.8125rem] font-black uppercase tracking-wider ${
          grey ? 'bg-white/70' : 'bg-black/20'
        }`}
      >
        {unit.bannerLabel}
      </p>
      <div className="mt-1 flex items-end gap-3">
        <h3 className="min-w-0 flex-1 text-[1.375rem] font-black leading-tight [hyphens:auto]" lang="de">{unit.title}</h3>
        {!grey && (
          <span className="flex min-h-11 shrink-0 items-center gap-0.5 rounded-2xl bg-white py-2 pl-3 pr-2 text-[0.9375rem] font-black text-[color:var(--hue-edge)] shadow-[0_3px_0_rgba(0,0,0,0.2)]">
            <span className="sr-only">Kapitel</span>Übersicht
            <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <div>
      {grey ? (
        <div className="rounded-[18px] bg-game-locked p-4 text-game-muted shadow-game-locked">{body}</div>
      ) : (
        <Link
          to={unit.href}
          aria-label={unit.bannerAria}
          className="block rounded-[18px] bg-[color:var(--hue)] p-4 text-white shadow-[0_5px_0_var(--hue-edge)] transition-transform duration-100 hover:brightness-105 active:translate-y-[5px] active:shadow-none"
        >
          {body}
        </Link>
      )}
      {unit.summary && unit.summary.line && (
        <p className="mt-3 px-1 text-[0.9375rem] font-bold leading-snug text-game-muted" lang="de">
          {unit.summary.line}
        </p>
      )}
    </div>
  );
}
