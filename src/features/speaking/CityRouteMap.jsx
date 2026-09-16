// The transit-line map of the twelve A1.1 stations — plan Task 4
// (speaking-guided-city-map). Presentational: states come from routeModel,
// this file only draws them.
//
// Rules it renders by:
//   * every station state is TEXT + ICON, never colour alone;
//   * acid lime marks progress and the current station only — it is a fill
//     with night-navy content on it, never body text on white;
//   * an openable station is a real <button>, a course-locked one is a real
//     link to the course page (/courses/a1-1/ — Astro, full page load);
//   * mobile is a single vertical line (no horizontal scroll at 320px),
//     ≥768px the same line sits in the map column of the hub's grid.
//
// The route always shows TWELVE stations. Today the missions table carries
// eight published A1.1 rows (the 12-mission migration is in flight), so the
// missing orders render as honest placeholders: named, locked, not clickable.
import { CheckCircle2, MapPin, Lock, Crown, Hammer } from 'lucide-react';

export const STATION_COUNT = 12;

/** The twelve station situations (plan Task 1's table) — fallback names for
 * orders the missions table does not carry yet. */
export const STATION_FALLBACK_TITLES = [
  'Introduce yourself',
  'Personal details',
  'Café order',
  'Arrange a meeting',
  'Ask directions',
  'Shopping',
  'Daily routine',
  'Doctor & pharmacy',
  'Free time',
  'Housing',
  'Travel & tickets',
  'Final encounter',
];

/** Pad a built route to twelve stations so the map renders gracefully while
 * fewer missions are published. Placeholders are locked and not clickable. */
export function padStationsToTwelve(stations) {
  const byOrder = new Map((stations || []).map((s) => [Number(s.order), s]));
  return Array.from({ length: STATION_COUNT }, (_, i) => {
    const order = i + 1;
    return byOrder.get(order) || {
      order,
      title_en: STATION_FALLBACK_TITLES[i],
      title_de: STATION_FALLBACK_TITLES[i],
      state: 'locked',
      action: null,
      placeholder: true,
    };
  });
}

// State is always spelled out — text + icon, never colour alone.
const STATE_LABELS = {
  complete: 'Complete — replay anytime',
  current: 'Current station',
  locked: 'Locked — finish the station before it',
  'course-locked': 'Unlock with the A1.1 course',
  placeholder: 'In preparation — coming soon',
};

const STATE_ICONS = {
  complete: CheckCircle2,
  current: MapPin,
  locked: Lock,
  'course-locked': Crown,
  placeholder: Hammer,
};

function StationMarker({ station }) {
  const state = station.placeholder ? 'placeholder' : station.state;
  const Icon = STATE_ICONS[state] || Lock;
  const isCurrent = state === 'current';
  const isComplete = state === 'complete';
  return (
    <span
      aria-hidden="true"
      className={[
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2',
        isCurrent
          ? 'border-[var(--city-lime)] bg-[var(--city-lime)] text-[var(--city-night)]'
          : isComplete
            ? 'border-[var(--city-lime-soft)] bg-[var(--city-night)] text-[var(--city-mist)]'
            : 'border-[var(--city-hairline-strong)] bg-[var(--city-night)] text-[var(--city-line)]',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function StationBody({ station }) {
  const state = station.placeholder ? 'placeholder' : station.state;
  return (
    <span className="min-w-0 flex-1 text-left">
      <span className="block font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-[var(--city-line)]">
        Station {station.order}
      </span>
      <span className="block text-sm font-bold leading-snug text-[var(--city-mist)]">
        {station.title_en || station.title_de}
      </span>
      <span className="block text-[0.75rem] text-[var(--city-mist-faint)]">{STATE_LABELS[state]}</span>
    </span>
  );
}

/**
 * stations: the padded twelve; onOpen(station) fires for complete/current.
 * A locked station renders as plain (non-interactive) text; a course-locked
 * one links to the course page.
 */
export default function CityRouteMap({ stations, onOpen }) {
  const twelve = padStationsToTwelve(stations);
  return (
    <ol aria-label="Your A1.1 conversation route — 12 stations" className="m-0 list-none p-0">
      {twelve.map((station, i) => {
        const state = station.placeholder ? 'placeholder' : station.state;
        const openable = !station.placeholder && (state === 'complete' || state === 'current');
        const inner = (
          <>
            <StationMarker station={station} />
            <StationBody station={station} />
          </>
        );
        const rowBase = 'flex w-full min-w-0 items-center gap-3 rounded-clay px-2 py-2.5';
        return (
          <li key={station.order} className="relative pl-1">
            {/* the transit line between stations */}
            {i < twelve.length - 1 && (
              <span aria-hidden="true" className="absolute left-[1.3125rem] top-12 bottom-0 w-0.5 bg-[var(--city-hairline)]" />
            )}
            {openable ? (
              <button
                type="button"
                onClick={() => onOpen(station)}
                aria-label={`Station ${station.order}: ${station.title_en || station.title_de} — ${STATE_LABELS[state]}`}
                className={`${rowBase} transition-colors hover:bg-white/5 ${state === 'current' ? 'bg-white/5 ring-1 ring-[var(--city-lime-ring)]' : ''}`}
              >
                {inner}
              </button>
            ) : state === 'course-locked' ? (
              <a
                href="/courses/a1-1/"
                aria-label={`Station ${station.order}: ${station.title_en || station.title_de} — ${STATE_LABELS[state]}`}
                className={`${rowBase} transition-colors hover:bg-white/5`}
              >
                {inner}
              </a>
            ) : (
              <span className={rowBase}>{inner}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
