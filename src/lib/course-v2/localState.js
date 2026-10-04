// Course v2 — the signed-out learner's progress, in this browser only.
//
// A free level (a1.1) is playable without an account (BLUEPRINT §7.4 day 0), and
// its work must not vanish: finished steps and unit statuses are kept here under
// one localStorage key. It is a per-viewer convenience — never the source of truth
// for a signed-in learner (that is lesson_progress / lesson_attempts, see
// progress.js) — and every access is wrapped, because storage can be blocked,
// cleared or absent (private window, thumbnail capture); then the player simply
// starts at step 1.
//
// Shape: { v: 1, units: { [unitId]: { level, finished: [stepId], runs: { [stepId]: n }, status, answers? } } }
// A Plateau or closing block is kept under its own id the same way (its sections are the
// „steps"); `answers` ({ itemId: correct }, the latest per item) feeds its results card.
// On the first load with a signed-in user the store is merged into the account and each unit
// is removed once its writes succeed: src/lib/course-v2/mergeLocal.js (owner decision 2026-10-01).

export const LOCAL_KEY = 'dm_course_v2_progress';

function storage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readLocal(store = storage()) {
  if (!store) return { v: 1, units: {} };
  try {
    const parsed = JSON.parse(store.getItem(LOCAL_KEY) || 'null');
    if (parsed && parsed.v === 1 && parsed.units && typeof parsed.units === 'object') return parsed;
  } catch {
    // unreadable → start clean
  }
  return { v: 1, units: {} };
}

function writeLocal(data, store = storage()) {
  if (!store) return false;
  try {
    store.setItem(LOCAL_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * { row, finishedSteps: Set, stepRuns: Map, answers: Map } — the same shape as
 * progress.fetchUnitState (+ `answers`, as progress.fetchAssessmentState has it).
 */
export function localUnitState(unitId, store = storage()) {
  const u = readLocal(store).units[unitId] || {};
  const answers = u.answers && typeof u.answers === 'object' ? u.answers : {};
  return {
    row: u.status ? { lektion_id: unitId, status: u.status } : null,
    finishedSteps: new Set(u.finished || []),
    stepRuns: new Map(Object.entries(u.runs || {})),
    answers: new Map(Object.entries(answers).map(([k, v]) => [k, v === true])),
  };
}

/** The same shape as progress.fetchLevelState, for one level. */
export function localLevelState(level, store = storage()) {
  const units = readLocal(store).units;
  const progress = new Map();
  const finishedSteps = new Map();
  const stepRuns = new Map();
  for (const [id, u] of Object.entries(units)) {
    if (!u || u.level !== level) continue;
    if (u.status) progress.set(id, { lektion_id: id, status: u.status });
    finishedSteps.set(id, new Set(u.finished || []));
    for (const [s, n] of Object.entries(u.runs || {})) stepRuns.set(s, n);
  }
  return { progress, finishedSteps, stepRuns };
}

function update(unitId, level, fn, store) {
  const data = readLocal(store);
  const u = data.units[unitId] || { level, finished: [], runs: {}, status: null };
  data.units[unitId] = fn({ ...u, level, finished: [...(u.finished || [])], runs: { ...(u.runs || {}) } });
  return writeLocal(data, store);
}

export function localStepDone(unitId, level, stepId, store = storage()) {
  return update(unitId, level, (u) => ({
    ...u,
    finished: u.finished.includes(stepId) ? u.finished : [...u.finished, stepId],
    runs: { ...u.runs, [stepId]: (Number(u.runs[stepId]) || 0) + 1 },
    status: u.status || 'started',
  }), store);
}

export function localTestOut(unitId, level, stepIds, store = storage()) {
  return update(unitId, level, (u) => ({
    ...u,
    finished: [...new Set([...u.finished, ...(stepIds || [])])],
    status: u.status === 'complete' || u.status === 'gold' ? u.status : 'tested_out',
  }), store);
}

export function localUnitStatus(unitId, level, status, store = storage()) {
  return update(unitId, level, (u) => ({ ...u, status }), store);
}

/** Record answered items ({ itemId: correct }, the latest wins) — a Plateau's results card reads them. */
export function localAnswers(unitId, level, answers, store = storage()) {
  const entries = Object.entries(answers || {});
  if (!entries.length) return true;
  return update(unitId, level, (u) => ({
    ...u,
    answers: { ...(u.answers && typeof u.answers === 'object' ? u.answers : {}), ...Object.fromEntries(entries.map(([k, v]) => [k, v === true])) },
  }), store);
}

/** Drop one unit from the store (mergeLocal.js, once that unit is in the account); the key goes when empty. */
export function removeLocalUnit(unitId, store = storage()) {
  if (!store) return false;
  const data = readLocal(store);
  if (!data.units[unitId]) return true;
  delete data.units[unitId];
  if (!Object.keys(data.units).length) {
    try {
      store.removeItem(LOCAL_KEY);
      return true;
    } catch {
      return false;
    }
  }
  return writeLocal(data, store);
}
