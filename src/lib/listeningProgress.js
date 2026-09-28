// What "done" means in the two older progress tables, as the LIVE schema has
// them (tests/fixtures/db-schema.json, measured 2026-09-28):
//
//   user_listening_progress  a row is written only when an exercise is
//                            submitted, and `completed_at` is its stamp.
//                            There is NO `completed` column.
//   user_reading_progress    `completed` is the flag and `last_read_at` the
//                            stamp. There is NO `completed_at` column.
//
// Until 2026-09-28 the SPA assumed each table had the other's column. PostgREST
// answered every such query with 400, supabase-js resolves rather than throws,
// and the fail-soft callers carried on, so every listening and reading
// completion ever submitted was dropped (both tables held 0 rows) and every
// progress read came back empty. tests/db-columns.test.mjs now holds every
// query in src/ and netlify/functions/ to the live schema.

/** A user_listening_progress row counts as a finished exercise. */
export const isListeningDone = (row) => Boolean(row && row.completed_at);
