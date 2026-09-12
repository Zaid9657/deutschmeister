// Pure helpers for the public syllabus grid (docs/course-standard-2026-09-12.md
// §2.4, docs/course-factory/a11-rebuild/CONTRACT.md). No I/O — everything is
// derived from a CURRICULUM_A11-shaped object so it can be unit-tested with
// inline fixtures (tests/syllabus.test.mjs) and reused by the Astro page.

/** Total Wortliste size to divide the running total against, by half-level band. */
export const WORTLISTE_TOTAL = { a1: 650, a2: 1300 };

/** '650' for a1.1/a1.2, '1300' for a2.1/a2.2, else null (levels not in the standard). */
export function wortlisteTotalFor(level) {
  const band = String(level || '').slice(0, 2).toLowerCase();
  return WORTLISTE_TOTAL[band] ?? null;
}

/**
 * Per-Lektion rows with a running Wortfeld total, e.g. { nr: 3, count: 18, running: 47 }.
 * Accepts the `lektionen` array off a curriculum.
 */
export function wortfeldRunningTotals(lektionen) {
  let running = 0;
  return (lektionen ?? []).map((l) => {
    const count = l.wortfeld?.length ?? 0;
    running += count;
    return { nr: l.nr, count, running };
  });
}

/** Sum of every Lektion's `minutes`, in minutes. */
export function lektionenMinutes(lektionen) {
  return (lektionen ?? []).reduce((sum, l) => sum + (Number(l.minutes) || 0), 0);
}

/**
 * Total course hours: Lektionen + checkpoints (12 min each, per the standard
 * §3) rounded to the nearest whole hour. Independent of the curriculum's own
 * `hoursTotal` field so the page can cross-check it.
 */
export function totalHoursFrom(curriculum) {
  const lektionMin = lektionenMinutes(curriculum?.lektionen);
  const checkpointMin = (curriculum?.checkpoints?.length ?? 0) * 12;
  return Math.round((lektionMin + checkpointMin) / 60);
}

/** Goethe A1 guidance is 80–200 UE (Unterrichtseinheiten) for the full level; A2 the same band. */
export const GOETHE_RICHTWERT_UE = { a1: [80, 200], a2: [80, 200] };

export function goetheRichtwertFor(level) {
  const band = String(level || '').slice(0, 2).toLowerCase();
  return GOETHE_RICHTWERT_UE[band] ?? null;
}

/** Total Kann-Beschreibungen across every Lektion. */
export function kannBeschreibungenCount(lektionen) {
  return (lektionen ?? []).reduce((sum, l) => sum + (l.canDo?.length ?? 0), 0);
}

/** The 11 official Goethe SD1 Prüfungsteile (Sprechen 1-3, Schreiben 1-2, Lesen 1-3, Hören 1-3). */
export const GOETHE_SD1_TEILE_COUNT = 11;

/** Distinct exam Teile trained across every Lektion, out of GOETHE_SD1_TEILE_COUNT. */
export function pruefungsteileCoverage(lektionen) {
  const seen = new Set();
  for (const l of lektionen ?? []) {
    for (const teil of l.examTeile ?? []) seen.add(teil);
  }
  return { covered: seen.size, of: GOETHE_SD1_TEILE_COUNT };
}

/** Checkpoint nr this Lektion sits directly after (or null). Used to insert checkpoint rows in the grid. */
export function checkpointAfter(curriculum, lektionNr) {
  return (curriculum?.checkpoints ?? []).find((c) => c.afterLektion === lektionNr) ?? null;
}

/** The primary grammar topic's title_de for a Lektion, looked up in a { slug: title_de } map. */
export function primaryGrammarTitle(lektion, titlesBySlug) {
  const slug = lektion?.primarySlug;
  if (!slug) return null;
  return titlesBySlug?.[slug] ?? slug;
}

/** True when a curriculum has a non-empty Lektion list worth rendering a syllabus section for. */
export function hasSyllabus(curriculum) {
  return Boolean(curriculum?.lektionen?.length);
}

/** The 9-stage Lektion anatomy (docs/course-standard-2026-09-12.md §3), for the anatomy strip. */
export const LEKTION_ANATOMY = [
  { nr: 0, titleDe: 'Warm-up', minutes: 1.5 },
  { nr: 1, titleDe: 'Pretest', minutes: 1 },
  { nr: 2, titleDe: 'Input', minutes: 2 },
  { nr: 3, titleDe: 'Merksatz', minutes: 1 },
  { nr: 4, titleDe: 'Übung', minutes: 3 },
  { nr: 5, titleDe: 'Sprechen', minutes: 2 },
  { nr: 6, titleDe: 'Schreiben', minutes: 1.5 },
  { nr: 7, titleDe: 'Wiederholung', minutes: 1.5 },
  { nr: 8, titleDe: 'Rückblick', minutes: 0.5 },
];
