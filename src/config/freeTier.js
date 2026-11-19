// Free tier configuration — single source of truth
// Change this array to make more levels free
export const FREE_LEVELS = ['a1.1'];

export const isLevelFree = (level) => {
  if (!level) return false;
  return FREE_LEVELS.includes(level.toLowerCase());
};

// The Lektion gate (owner decision 2026-11-18: "only open one lesson from the
// course", then a subscription). A level listed here stays a free LEVEL — its
// grammar, listening and reading library are untouched — but its guided COURSE
// is free only up to this Lektion; every later Lektion, each checkpoint and the
// Abschlusstest need whole-course access (src/lib/levelEntitlement.js
// fullCourseReason).
export const FREE_LEKTIONEN = Object.freeze({ 'a1.1': 1 });

// The instant the gate took effect, as an ISO string. Accounts created before
// it signed up while every page said "A1.1 is free" and keep the whole course.
// null = the gate is off and nothing above changes anything. Synced copy:
// netlify/functions/_shared/supportCatalog.mjs (tests/lektion-gate.test.mjs).
export const LEKTION_GATE_FROM = '2026-11-20T00:00:00.000Z';

/** The free Lektion count of a gated level while the gate is live, else 0. */
export const freeLektionen = (level, gateFrom = LEKTION_GATE_FROM) =>
  (gateFrom && FREE_LEKTIONEN[String(level || '').toLowerCase()]) || 0;

/** True for a course step past the free Lektionen: a later Lektion or any checkpoint. */
export const beyondFreeLektionen = (pathname, gateFrom = LEKTION_GATE_FROM) => {
  const m = /^\/course\/([^/]+)\/(l|checkpoint)\/(\d+)/i.exec(String(pathname || ''));
  const free = m ? freeLektionen(m[1], gateFrom) : 0;
  return free > 0 && (m[2].toLowerCase() === 'checkpoint' || Number(m[3]) > free);
};
