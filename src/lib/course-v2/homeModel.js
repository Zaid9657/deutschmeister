// Course v2 — the course home's view model (BLUEPRINT §7.3 S0, §3.5 gates).
//
// Pure: the compiled manifest (src/data/course-v2/<level>/manifest.json — the
// shared contract also calls it course.json) + the learner's state in, the unit
// path grouped by Etappe with its Plateaus out. The page only renders this.
//
// Rules it carries:
//   - course completion comes from src/lib/course-v2/completion.js (PRG-02: one
//     definition), never re-derived here;
//   - the GATE is soft (BLUEPRINT §3.5): a unit is `ready` once the previous
//     unit's Lernschritte are finished; a unit that is not ready is still
//     openable („Trotzdem öffnen") — nothing reads a score;
//   - a unit without compiled content is `missing` and shows „kommt bald";
//   - a Plateau closes its Etappe and the closing block (the .1 Halbtest) the course: each is
//     `available` once its file is compiled and `ready` once the Lernschritte of the units it
//     reviews are finished (the Etappe's, for the closing block all of them) — soft like the
//     units: not ready still opens („Trotzdem öffnen");
//   - `next` is the first open stop in path order: units, then the Plateau of their Etappe.
import { courseCompletion, DONE_STATUSES } from './completion.js';
import { nrOfId, v2Paths, levelCode } from './ids.js';
import { closingIdFor } from './assessment.js';

/**
 * The completion block's UNIT part only (lernschritt, aufgabe, unit). A unit's
 * completion never depends on the course-level `required` list, so a course block
 * completion.js cannot (yet) honour — e.g. the SCHEMA §5 CLOSING form
 * `{ kind: 'halbtest', lane: 'learner' }` — must not stop a unit from completing.
 */
export function unitRules(completionBlock) {
  const c = completionBlock || {};
  const out = {};
  for (const k of ['lernschritt', 'aufgabe', 'unit']) if (c[k]) out[k] = c[k];
  return out;
}

/**
 * courseCompletion, degrading instead of throwing: when the manifest's course block
 * is one completion.js rejects, the SCHEMA default course rules are used and the
 * mismatch is logged once per call (it is reported upstream, never hidden).
 */
export function safeCourseCompletion(manifest, state) {
  try {
    return courseCompletion(manifest, state);
  } catch (err) {
    console.warn('[course-v2] course completion block not understood, using SCHEMA defaults:', err && err.message);
    try {
      const completion = { ...unitRules(manifest && manifest.completion) };
      return courseCompletion({ ...manifest, completion }, state);
    } catch {
      return null;
    }
  }
}

const rowId = (entry) => (typeof entry === 'string' ? entry : entry && (entry.unit || entry.id)) || null;

/**
 * The Lernschritt ids of a unit with `total` steps (A: 7, B: 8), i.e. every step
 * except the two Aufgaben (LS5 Sprechen, LS6 Schreiben) and, in the B skeleton,
 * the optional LS7 Überarbeiten (BLUEPRINT §3.1–§3.2; completion.js AUFGABE_KINDS /
 * OPTIONAL_STEP_KINDS). The home has no step kinds without loading every unit
 * chunk, so it uses the fixed skeleton slots.
 */
export function lernschrittIds(unitId, total) {
  const n = Number(total) || 0;
  const skip = new Set([5, 6]);
  if (n === 8) skip.add(7);
  const ids = [];
  for (let i = 1; i <= n; i += 1) if (!skip.has(i)) ids.push(`${unitId}-ls${i}`);
  return ids;
}

/** Are the unit's Lernschritte finished (or tested out, or the unit done)? */
export function lernschritteFinished(unitId, total, status, finished) {
  if (status === 'tested_out' || DONE_STATUSES.includes(status)) return true;
  const ids = lernschrittIds(unitId, total);
  if (!ids.length) return false;
  const set = finished instanceof Set ? finished : new Set(finished || []);
  return ids.every((id) => set.has(id));
}

function statusOf(progressRow, finishedCount, available) {
  const s = progressRow && progressRow.status;
  if (s === 'gold' || s === 'complete' || s === 'tested_out') return s;
  if (s === 'started' || finishedCount > 0) return 'started';
  return available ? 'new' : 'missing';
}

/** Learner-facing label of a unit status (German, Sie). */
export const STATUS_LABEL_DE = Object.freeze({
  gold: 'Geschafft · Siegel',
  complete: 'Geschafft',
  tested_out: 'Aufgaben offen',
  started: 'Begonnen',
  new: 'Offen',
  missing: 'Kommt bald',
});

/**
 * courseHomeModel(manifest, state, { plateaus, closings, lane }) →
 *   { level, code, title, honestyLineDe, lane, etappen, next, completion, remainingSteps, stepsPerUnit }
 * state = { progress: Map<id,row>, finishedSteps: Map<unitId,Set> } (progress.js / localState.js)
 * plateaus = Set of Plateau numbers whose file exists, closings = Set of closing ids whose file
 * exists (the loader knows both); lane = the learner's lane (learner_goals), which picks the
 * closing form (completion.js closingFormFor).
 * Each Etappe: { nr, units, plateau: Stop | null, closing: Stop | null }, where
 *   Stop = { id, nr?, kind, available, ready, done, started, href }.
 */
export function courseHomeModel(manifest, state = {}, { plateaus = new Set(), closings = new Set(), lane: learnerLane = null } = {}) {
  if (!manifest) return null;
  const level = manifest.level;
  const progress = state.progress instanceof Map ? state.progress : new Map();
  const finishedSteps = state.finishedSteps instanceof Map ? state.finishedSteps : new Map();
  const lane = (manifest.lanes && manifest.lanes.primary) || null;
  const stepsPerUnit = String(level || '').startsWith('b') ? 8 : 7;

  const rows = (manifest.units || []).map((entry) => {
    const id = rowId(entry);
    const r = typeof entry === 'object' && entry ? entry : {};
    const nr = r.nr || nrOfId(id);
    const available = Boolean(r.chunk);
    const finished = finishedSteps.get(id) || new Set();
    const total = (r.counts && r.counts.lernschritte) || (available ? stepsPerUnit : 0);
    const status = statusOf(progress.get(id), finished.size, available);
    return {
      id,
      nr,
      etappe: r.etappe || null,
      title: r.title || null,
      canDoTitle: r.canDoTitle || null,
      minutes: r.minutesPlanned || null,
      minutesMeasured: r.minutesMeasured || null,
      pruefungsfokus: (lane && r.pruefungsfokus && r.pruefungsfokus[lane]) || [],
      available,
      status,
      stepsDone: Math.min(finished.size, total),
      stepsTotal: total,
      lernschritteFinished: lernschritteFinished(id, total, progress.get(id) && progress.get(id).status, finished),
      href: v2Paths.unit(level, nr),
      ready: true,
    };
  });
  // Soft gate: ready once the previous unit's Lernschritte are finished.
  rows.forEach((row, i) => { row.ready = i === 0 || rows[i - 1].lernschritteFinished; });

  const byId = new Map(rows.map((r) => [r.id, r]));
  const stopState = (id) => {
    const status = id ? progress.get(id) && progress.get(id).status : null;
    return { done: DONE_STATUSES.includes(status), started: Boolean(status) && !DONE_STATUSES.includes(status) };
  };
  const closingId = closingIdFor(manifest, learnerLane);
  const allReady = rows.length > 0 && rows.every((r) => r.lernschritteFinished);
  const etappen = (manifest.etappen || []).map((e) => {
    const closedBy = e.closedBy || null;
    const pNr = closedBy && closedBy !== 'closing' ? nrOfId(closedBy) : null;
    const units = (e.units || []).map((u) => byId.get(rowId(u))).filter(Boolean);
    const etappeReady = units.length > 0 && units.every((u) => u.lernschritteFinished);
    return {
      nr: e.nr,
      units,
      plateau: pNr
        ? { id: closedBy, nr: pNr, kind: 'plateau', available: plateaus.has(pNr), ready: etappeReady, ...stopState(closedBy), href: v2Paths.plateau(level, pNr) }
        : null,
      closing: closedBy === 'closing'
        ? { id: closingId, kind: 'closing', available: Boolean(closingId) && closings.has(closingId), ready: allReady, ...stopState(closingId), href: v2Paths.closing(level) }
        : null,
    };
  });

  // The primary action: the first open stop in path order (a unit, then its Etappe's Plateau).
  const path = etappen.length
    ? etappen.flatMap((e) => [...e.units.map((r) => ({ ...r, kind: 'unit' })), ...[e.plateau, e.closing].filter(Boolean)])
    : rows.map((r) => ({ ...r, kind: 'unit' }));
  const next = path.find((s) => s.available && (s.kind === 'unit' ? !DONE_STATUSES.includes(s.status) : !s.done)) || null;
  const statusMap = new Map([...progress.entries()].map(([id, row]) => [id, row && row.status]));
  const completion = safeCourseCompletion(manifest, { progress: statusMap });
  const remainingSteps = rows.reduce((n, r) => n + (DONE_STATUSES.includes(r.status) ? 0 : Math.max(0, (r.stepsTotal || stepsPerUnit) - r.stepsDone)), 0);

  return {
    level,
    code: levelCode(level),
    title: manifest.title || null,
    honestyLineDe: manifest.honestyLineDe || null,
    lane,
    etappen,
    units: rows,
    next,
    completion,
    remainingSteps,
    stepsPerUnit,
  };
}
