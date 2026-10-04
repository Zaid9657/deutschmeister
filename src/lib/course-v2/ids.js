// Course v2 — id helpers the player needs at the URL ↔ content boundary
// (docs/course-v2/SCHEMA.md §2). Pure; no I/O.
//
// URLs carry the level in lowercase (`/course/a2.1/u/7`) and the unit as its
// number; content and learner state carry the full ids (`a2.1-u07`,
// `a2.1-u07-ls3`, Plateau `a2.1-p2`). Normalise here, never at a call site.

export const LEVEL_RE = /^(a1|a2|b1|b2)\.[12]$/;
export const UNIT_RE = /^(a1|a2|b1|b2)\.[12]-u(0[1-9]|1[0-2])$/;
export const STEP_RE = /^(a1|a2|b1|b2)\.[12]-u(0[1-9]|1[0-2])-ls[1-8]$/;
export const PLATEAU_RE = /^(a1|a2|b1|b2)\.[12]-p[1-3]$/;

/** 'A2.1' / ' a2.1 ' → 'a2.1'; anything that is not a v2 level → null. */
export function normalizeLevel(level) {
  const l = String(level || '').trim().toLowerCase();
  return LEVEL_RE.test(l) ? l : null;
}

/** 'a2.1', 7 → 'a2.1-u07'; out-of-range numbers → null. */
export function unitIdFor(level, nr) {
  const l = normalizeLevel(level);
  const n = Number(nr);
  if (!l || !Number.isInteger(n) || n < 1 || n > 12) return null;
  return `${l}-u${String(n).padStart(2, '0')}`;
}

/** 'a2.1', 2 → 'a2.1-p2'; out-of-range numbers → null. */
export function plateauIdFor(level, nr) {
  const l = normalizeLevel(level);
  const n = Number(nr);
  if (!l || !Number.isInteger(n) || n < 1 || n > 3) return null;
  return `${l}-p${n}`;
}

/** 'a2.1-u07' → 7; 'a2.1-p2' → 2; anything else → null. */
export function nrOfId(id) {
  const m = String(id || '').match(/-(?:u|p)(\d{1,2})$/);
  return m ? Number(m[1]) : null;
}

/** 'a2.1-u07-ls3' → 3 (the Lernschritt's position); anything else → null. */
export function stepNrOf(stepId) {
  const m = String(stepId || '').match(/-ls([1-8])$/);
  return m ? Number(m[1]) : null;
}

/** 'a2.1-u07-ls3-p06' → 'a2.1-u07-ls3'; a check/start item → the unit id + suffix-free. */
export function stepIdOfItem(itemId) {
  const m = String(itemId || '').match(/^((a1|a2|b1|b2)\.[12]-u(0[1-9]|1[0-2])-ls[1-8])-/);
  return m ? m[1] : null;
}

/** The A1…B2 band of a level: 'a2.1' → 'a2' (learner_goals is keyed by band). */
export function bandOf(level) {
  const l = normalizeLevel(level);
  return l ? l.slice(0, 2) : null;
}

/** Display code: 'a2.1' → 'A2.1'. */
export function levelCode(level) {
  return String(level || '').toUpperCase();
}

/** The routes of the v2 player (all inside the netlify.toml `/course/*` rewrite). */
export const v2Paths = {
  home: (level) => `/course/${normalizeLevel(level) || level}/v2`,
  unit: (level, nr) => `/course/${normalizeLevel(level) || level}/u/${Number(nr)}`,
  plateau: (level, nr) => `/course/${normalizeLevel(level) || level}/p/${Number(nr)}`,
  // the closing block of the course: the .1 Halbtest → Teil-Karte (BLUEPRINT §5.3)
  closing: (level) => `/course/${normalizeLevel(level) || level}/abschluss`,
};
