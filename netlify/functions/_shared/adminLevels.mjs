// Admin panel — the level (track) dimension and its casing map.
//
// THE CASING RULE. The same sub-level is stored with different casing in
// different tables (CLAUDE.md: lowercase in URLs/code, UPPERCASE in the DB,
// except reading_lessons.level and the vocabulary tables, which are lowercase).
// A filter written once and applied to every table returns zero rows in half
// of them, silently — every figure goes to zero while the buttons react
// normally, which reads from outside as "the filter does nothing".
//
// So: never pass a filter value straight from the UI to a query. Route it
// through levelValueFor(table, uiValue). The map below was taken from
// SELECT DISTINCT on each table on 2026-09-13 and tests/admin-levels.test.mjs
// pins it; add a table here before filtering it anywhere.

export const LEVELS = Object.freeze(['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']);

export const LEVEL_LABELS = Object.freeze(
  Object.fromEntries(LEVELS.map((l) => [l, l.toUpperCase()])),
);

/** What a row with no level is called. A SELECTABLE filter value, never an excluded row. */
export const LEVEL_UNKNOWN = 'unbekannt';

/**
 * table → { column, casing } as measured on 2026-09-13.
 * `upper`  → 'A1.1'   `lower` → 'a1.1'   `band-lower` → 'a1' (main band only)
 */
export const LEVEL_COLUMNS = Object.freeze({
  grammar_topics:        { column: 'sub_level', casing: 'upper' },
  listening_exercises:   { column: 'level', casing: 'upper' },
  speaking_sessions:     { column: 'level', casing: 'upper' },
  speaking_evaluations:  { column: 'level', casing: 'upper' },
  speaking_missions:     { column: 'level', casing: 'upper' },
  podcasts:              { column: 'sub_level', casing: 'upper' },
  lesson_progress:       { column: 'level', casing: 'lower' },
  lesson_attempts:       { column: 'level', casing: 'lower' },
  reading_lessons:       { column: 'level', casing: 'lower' },
  words:                 { column: 'level', casing: 'lower' },
  sentences:             { column: 'level', casing: 'lower' },
  paragraphs:            { column: 'level', casing: 'lower' },
  user_progress:         { column: 'level', casing: 'band-lower' },
  // profiles.current_level is MIXED: 1,594 rows carry the legacy default 'a1'
  // (band only), the rest 'A1.1'-style. Filter it with both spellings.
  profiles:              { column: 'current_level', casing: 'mixed' },
});

export function normalizeLevel(value) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim().toLowerCase();
  return LEVELS.includes(v) ? v : null;
}

/**
 * The stored value(s) for a UI level on a given table. Returns an array so a
 * mixed-casing table can be filtered with `.in()`; `null` for "no filter".
 */
export function levelValuesFor(table, level) {
  const norm = normalizeLevel(level);
  if (!norm) return null;
  const spec = LEVEL_COLUMNS[table];
  if (!spec) throw new Error(`levelValuesFor: table "${table}" is not in LEVEL_COLUMNS — add it with its measured casing`);
  switch (spec.casing) {
    case 'upper':
      return [norm.toUpperCase()];
    case 'lower':
      return [norm];
    case 'band-lower':
      return [norm.split('.')[0]];
    case 'mixed':
      return [norm.toUpperCase(), norm, norm.split('.')[0]];
    default:
      throw new Error(`levelValuesFor: unknown casing "${spec.casing}"`);
  }
}

/** Apply the level filter to a PostgREST query builder, correctly cased for the table. */
export function applyLevelFilter(query, table, level) {
  const values = levelValuesFor(table, level);
  if (!values) return query;
  const { column } = LEVEL_COLUMNS[table];
  return values.length === 1 ? query.eq(column, values[0]) : query.in(column, values);
}
