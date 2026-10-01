import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

// A Kapitel's banner on the learn path — Duolingo's unit banner: a rounded block in the
// Kapitel's hue (`--hue` / `--hue-edge` from hue.js), the eyebrow „MODUL 1 · KAPITEL 1"
// on a darkened pill (white stays ≥ 4.5:1 on every hue), the title big and white, and on
// the right the square book button that opens the Kapitel guide (`…/u/<nr>?view=guide`,
// pathModel.guideHref) — the textbook side of the Kapitel, one tap deep. It sticks under
// the top bar while its Kapitel's nodes scroll (the sticky box is bounded by the
// Kapitel's own block, so the next banner pushes it away). A Kapitel that is not compiled
// yet is grey, says „kommt bald" and has no book button.
// Since the tour (2026-10-01) a quiet second line under the block says where the Kapitel sits
// and how far the learner is in it (pathModel `progressLine`: „Kapitel 1 von 12 · 0 von 7
// Lernschritten" — in the muted ink on the page ground, since small white text on a bright hue
// misses 4.5:1), and the banner the coach marks point at carries `data-tour="banner"`.
export default function UnitBanner({ unit, headingLevel = 3, tourTarget = false }) {
  const grey = !unit.available;
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="sticky top-[8.125rem] z-20 -mx-1 bg-course-ground px-1 pb-1 pt-3">
      <div data-tour={tourTarget ? 'banner' : undefined}>
        <div
          className={`flex items-center gap-3 rounded-[18px] py-3.5 pl-4 pr-3 ${
            grey ? 'bg-game-locked text-game-muted shadow-game-locked' : 'bg-[color:var(--hue)] text-white shadow-[0_5px_0_var(--hue-edge)]'
          }`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`inline-block rounded-lg px-2 py-0.5 text-[0.75rem] font-black uppercase tracking-wider ${
                grey ? 'bg-white/70' : 'bg-black/20'
              }`}
            >
              {unit.eyebrow}
              {grey && ' · kommt bald'}
              <span className="sr-only">: </span>
            </p>
            <H className="mt-1 text-[1.3125rem] font-black leading-tight [hyphens:auto]" lang="de">{unit.title}</H>
          </div>
          {!grey && unit.guideHref && (
            <Link
              to={unit.guideHref}
              aria-label={`Kapitel ${unit.nr} im Überblick`}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-black/10 text-white transition-transform duration-100 hover:bg-black/20 active:translate-y-0.5"
            >
              <BookOpen className="h-7 w-7" strokeWidth={2.4} aria-hidden="true" />
            </Link>
          )}
        </div>
        {unit.progressLine && (
          <p className="px-2 pt-2 text-[0.8125rem] font-extrabold leading-tight text-game-muted">{unit.progressLine}</p>
        )}
      </div>
    </div>
  );
}
