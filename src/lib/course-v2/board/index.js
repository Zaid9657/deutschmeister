// Course v2 — Prüfungsstand and Teil-Karte helpers (BLUEPRINT §5.3, §5.6). Pure.
//
// Input rows are public.exam_practice_results rows (SCHEMA §14,
// migrations/2026-10-01-course-v2.sql): { teil, source, mode, full_length,
// raw_score, raw_max, ai_range, created_at, … }. This module turns them into
// per-Teil states and German labels; the lane scale, the module weights and the
// pass-rule hairline belong to the per-lane scorers (src/services/examRules/<lane>.js)
// and are not re-derived here.
//
// Rules implemented (§5.6):
//   1. numbers come ONLY from full-length Prüfungsmodus attempts; a miniature shows
//      „im Kleinen geübt" and is never scaled up to the Teil's item count;
//   2. Teil value = weighted mean of the last five qualifying attempts — Modelltest 1.5,
//      others 1.0, attempts older than 21 days × 0.5 (design numbers);
//   3. an AI-graded Teil carries a range (its ai_range), shown as „lo–hi";
//   7. only the allowed words appear; BANNED_BOARD_PATTERNS lists what must never.

export const BOARD_RULES = Object.freeze({
  lastAttempts: 5,
  modelltestWeight: 1.5,
  staleDays: 21,
  staleFactor: 0.5,
  minFullLength: 2, // the course-home checklist: every Teil ≥ 2× in full length
});

/** The words a board may use (§5.6 rule 7). */
export const ALLOWED_BOARD_WORDS = Object.freeze([
  'Übungswert',
  'Grenze nach der Bestehensregel von',
  'in voller Länge geübt',
  'im Kleinen geübt',
  'Vorschlag',
]);

/** What a board must never say about our tests (§5.6 rule 7, LGL-01). */
export const BANNED_BOARD_PATTERNS = Object.freeze([
  /\bbestanden\b/i,
  /bereit für die prüfung/i,
  /prüfungsreif/i,
  /bestehenschance/i,
  /\bin \d+ wochen\b/i,
  /\d+\s?%\s*(?:chance|wahrscheinlich)/i,
]);

const DAY_MS = 24 * 60 * 60 * 1000;

/** A full-length Prüfungsmodus attempt with a usable maximum — the only kind that makes a number. */
export function isQualifying(row) {
  return !!row && row.full_length === true && row.mode === 'pruefung' && Number(row.raw_max) > 0;
}

/** Weight of one qualifying attempt at `now`. */
export function attemptWeight(row, now = new Date()) {
  const base = row.source === 'modelltest' ? BOARD_RULES.modelltestWeight : 1;
  const created = new Date(row.created_at).getTime();
  const ageDays = Number.isFinite(created) ? (new Date(now).getTime() - created) / DAY_MS : 0;
  return ageDays > BOARD_RULES.staleDays ? base * BOARD_RULES.staleFactor : base;
}

const newestFirst = (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

/**
 * The practice value of one Teil from its rows, as shares of the Teil's maximum.
 * → null (no qualifying attempt) | { value, low, high, attempts, rawMax, aiGraded }
 */
export function teilValue(rows, { now = new Date() } = {}) {
  const q = (rows || []).filter(isQualifying).sort(newestFirst).slice(0, BOARD_RULES.lastAttempts);
  if (q.length === 0) return null;
  let wSum = 0;
  let v = 0;
  let lo = 0;
  let hi = 0;
  for (const r of q) {
    const w = attemptWeight(r, now);
    const max = Number(r.raw_max);
    const share = Number(r.raw_score) / max;
    const range = Array.isArray(r.ai_range) && r.ai_range.length === 2
      ? [Number(r.ai_range[0]) / max, Number(r.ai_range[1]) / max]
      : [share, share];
    wSum += w;
    v += w * share;
    lo += w * Math.min(range[0], range[1]);
    hi += w * Math.max(range[0], range[1]);
  }
  return {
    value: v / wSum,
    low: lo / wSum,
    high: hi / wSum,
    attempts: q.length,
    rawMax: Number(q[0].raw_max),
    aiGraded: q.some((r) => Array.isArray(r.ai_range)),
  };
}

/**
 * The state of one Teil (template id, e.g. 'ga2.h1'):
 *   voll  — at least one full-length Prüfungsmodus attempt: carries `value`
 *   klein — only miniatures / Lernmodus: carries the raw miniature count, never scaled
 *   offen — nothing yet
 */
export function teilStatus(template, rows, opts = {}) {
  const own = (rows || []).filter((r) => r && r.teil === template);
  const full = own.filter(isQualifying);
  if (full.length > 0) {
    return { teil: template, state: 'voll', value: teilValue(own, opts), fullLengthCount: full.length };
  }
  if (own.length > 0) {
    const raw = own.reduce((n, r) => n + (Number(r.raw_score) || 0), 0);
    const max = own.reduce((n, r) => n + (Number(r.raw_max) || 0), 0);
    return { teil: template, state: 'klein', mini: { raw, max }, fullLengthCount: 0 };
  }
  return { teil: template, state: 'offen', fullLengthCount: 0 };
}

/**
 * The Teil-Karte line of a Teil (§5.3):
 *   „in voller Länge geübt – Übungswert 11/15" (a range „9–12/15" for AI-graded Teile)
 *   „im Kleinen geübt"
 *   „kommt in A1.2, Lektion 2" (the caller supplies where) or „noch nicht geübt"
 */
export function teilLabelDe(status, { comesIn } = {}) {
  if (status && status.state === 'voll' && status.value) {
    const { rawMax, value, low, high } = status.value;
    const pts = (x) => Math.round(x * rawMax);
    const shown = pts(low) === pts(high) ? `${pts(value)}/${rawMax}` : `${pts(low)}–${pts(high)}/${rawMax}`;
    return `in voller Länge geübt – Übungswert ${shown}`;
  }
  if (status && status.state === 'klein') return 'im Kleinen geübt';
  return comesIn ? `kommt in ${comesIn}` : 'noch nicht geübt';
}

/**
 * The Teil-Karte at the end of a .1 course: one entry per Teil of the lane, never a total.
 * teile: [{ template, comesIn? }] in the lane's order.
 */
export function teilKarte(teile, rows, opts = {}) {
  return (teile || []).map((t) => {
    const status = teilStatus(t.template, rows, opts);
    return { ...status, label: teilLabelDe(status, { comesIn: t.comesIn }) };
  });
}

/** The course-home checklist line „jeder Teil ≥ 2× in voller Länge (n/N)". */
export function fullLengthChecklist(templates, rows, { minFullLength = BOARD_RULES.minFullLength } = {}) {
  const counts = (templates || []).map((tpl) => (rows || []).filter((r) => r && r.teil === tpl && isQualifying(r)).length);
  return {
    total: counts.length,
    practisedOnce: counts.filter((n) => n >= 1).length,
    practisedEnough: counts.filter((n) => n >= minFullLength).length,
  };
}
