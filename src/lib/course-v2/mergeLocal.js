// Course v2 — merge a signed-out learner's progress into the account that just signed in
// (owner decision 2026-10-01, audit finding CT-02: "the learner who finally creates an account
// sees zero progress"). The signed-out store is src/lib/course-v2/localState.js; the account's
// truth is lesson_progress + lesson_attempts as progress.js writes them. This module turns the
// first into the second, once, and never makes the account look worse than it did.
//
// The rules, the same four the legacy merge keeps (src/lib/course/localProgress.js):
//   1. NEVER THROWS. Storage and network failures log and leave the local store for the next load.
//   2. NEVER DOWNGRADES. A unit's status is written only when it ranks above the account's
//      (started < tested_out < complete < gold); 'started' goes through startUnit, which never
//      overwrites an existing row. A local test-out keeps 'started' in lesson_progress and carries
//      its credit in 'lernschritt-testout' markers — exactly what recordTestOut does before the
//      2026-10-01 migration widens the status check.
//   3. MERGES ONCE, UNIT BY UNIT. Every unit's writes are status → answers → markers, the markers
//      as ONE insert (atomic); only when all of them succeed is that unit removed from the local
//      store. A failure keeps the unit and stops before its markers, so a retry can never double
//      a run count. One in-flight promise is shared, so the home and the player rendering at the
//      same time do not merge twice.
//   4. RUN COUNTS SURVIVE. A step finished n times locally becomes n 'lernschritt' markers (the
//      next draw's attempt number is the marker count, progress.foldMarkers); a step finished only
//      by the test-out becomes one 'lernschritt-testout' marker. A Plateau's or the Abschlusstest's
//      answers become rows under their stage so its results card shows them.
// Completed units also get their review cards seeded (seedUnitCards is an upsert, safe to repeat).
// The XP/streak ledger (gamify.js) is per browser by design and is not merged.
import { supabase } from '../../utils/supabase.js';
import { logAttempts } from '../../services/lessonService.js';
import { ASSESSMENT_STAGE } from './assessment.js';
import { readLocal, removeLocalUnit } from './localState.js';
import { STEP_MARKER_STAGE, TESTOUT_MARKER_STAGE, saveUnitStatus, seedUnitCards, startUnit, stepMarker } from './progress.js';

const RANK = Object.freeze({ started: 1, tested_out: 2, complete: 3, gold: 4 });
const rank = (s) => RANK[s] || 0;
const lc = (s) => String(s || '').toLowerCase();

/** A Plateau id (`a1.1-p2`) answers under 'plateau', the closing block under 'abschluss'; units keep none. */
export function answerStage(unitId) {
  const id = String(unitId || '');
  if (/-p\d+$/.test(id)) return ASSESSMENT_STAGE.plateau;
  if (/-u\d+$/.test(id)) return null;
  return ASSESSMENT_STAGE.closing;
}

/** The unit number of a unit id (`a1.1-u07` → 7), else null. */
export const unitNrOf = (unitId) => {
  const m = /-u(\d+)$/.exec(String(unitId || ''));
  return m ? Number(m[1]) : null;
};

/**
 * What the merge will write, as data — pure, so every rule above is testable without a client.
 *   store   the local store (localState.readLocal shape)
 *   server  Map<unitId, status> of the account's lesson_progress rows for those units
 * → [{ unitId, level, status: { kind: 'start' } | { kind: 'save', status } | null,
 *      answers: [attempt], markers: [attempt], seedCards: bool }]
 */
export function planV2Merge(store, server = new Map()) {
  const units = (store && store.units && typeof store.units === 'object') ? store.units : {};
  const plans = [];
  for (const [unitId, u] of Object.entries(units)) {
    if (!u || typeof u !== 'object' || !u.level) continue;
    const local = u.status || null;
    const remote = server.get(unitId) || null;
    let status = null;
    if (local === 'complete' || local === 'gold') {
      if (rank(local) > rank(remote)) status = { kind: 'save', status: local };
    } else if (local === 'started' || local === 'tested_out' || (u.finished && u.finished.length)) {
      if (!remote) status = { kind: 'start' };
    }

    const markers = [];
    const runs = (u.runs && typeof u.runs === 'object') ? u.runs : {};
    for (const stepId of new Set(Array.isArray(u.finished) ? u.finished : [])) {
      if (typeof stepId !== 'string' || !stepId) continue;
      const n = Math.max(0, Math.floor(Number(runs[stepId])) || 0);
      if (n > 0) for (let i = 0; i < n; i += 1) markers.push(stepMarker(stepId, STEP_MARKER_STAGE));
      else markers.push(stepMarker(stepId, TESTOUT_MARKER_STAGE));
    }

    const stage = answerStage(unitId);
    const answers = stage && u.answers && typeof u.answers === 'object'
      ? Object.entries(u.answers).map(([itemId, correct]) => ({ itemId, stage, correct: correct === true, errorTag: null }))
      : [];

    plans.push({ unitId, level: lc(u.level), status, answers, markers, seedCards: local === 'complete' || local === 'gold' });
  }
  return plans;
}

/** True when this browser holds signed-out course-v2 progress. */
export function hasLocalV2Progress(store) {
  const data = store || readLocal();
  return Object.keys((data && data.units) || {}).length > 0;
}

let inFlight = null;

/**
 * Merge this browser's signed-out progress into `userId`'s account. Resolves to the number of
 * units merged (0 when there was nothing or nothing could be written). Awaiting it before reading
 * the account's state is what lets the page show the merged progress on the same load.
 * `deps` is a seam for tests: { client, logAttempts, startUnit, saveUnitStatus, seedUnitCards,
 * loadUnit, readLocal, removeLocalUnit }.
 */
export function mergeLocalV2(userId, deps = {}) {
  if (!userId) return Promise.resolve(0);
  if (inFlight) return inFlight;
  const read = deps.readLocal || readLocal;
  if (!hasLocalV2Progress(read())) return Promise.resolve(0);
  inFlight = runMerge(userId, deps).finally(() => { inFlight = null; });
  return inFlight;
}

async function runMerge(userId, deps) {
  const client = deps.client || supabase;
  const read = deps.readLocal || readLocal;
  const remove = deps.removeLocalUnit || removeLocalUnit;
  const log = deps.logAttempts || logAttempts;
  const start = deps.startUnit || startUnit;
  const save = deps.saveUnitStatus || saveUnitStatus;
  const seed = deps.seedUnitCards || seedUnitCards;
  const loadUnit = deps.loadUnit || (async (level, nr) => (await import('./loaders.js')).loadUnit(level, nr));

  try {
    const store = read();
    const ids = Object.keys(store.units || {});
    if (!ids.length) return 0;
    // The account's statuses for exactly these units: without them a status write could
    // downgrade, so a failed read stops the merge (the store stays for the next load).
    const { data, error } = await client.from('lesson_progress').select('lektion_id, status').eq('user_id', userId).in('lektion_id', ids);
    if (error) {
      console.error('[course-v2] merge: could not read the account progress:', error.message);
      return 0;
    }
    const server = new Map((data || []).map((r) => [r.lektion_id, r.status]));
    let merged = 0;
    for (const plan of planV2Merge(store, server)) {
      const where = { level: plan.level, unitId: plan.unitId };
      let ok = true;
      if (plan.status && plan.status.kind === 'save') ok = await save(userId, { ...where, status: plan.status.status }, client);
      else if (plan.status && plan.status.kind === 'start') ok = await start(userId, plan.level, plan.unitId, client);
      if (ok && plan.answers.length) ok = await log(userId, { level: plan.level, lektionId: plan.unitId }, plan.answers, client);
      if (ok && plan.markers.length) ok = await log(userId, { level: plan.level, lektionId: plan.unitId }, plan.markers, client);
      if (!ok) {
        console.warn('[course-v2] merge: kept', plan.unitId, 'locally for the next load');
        continue;
      }
      remove(plan.unitId);
      merged += 1;
      const nr = unitNrOf(plan.unitId);
      if (plan.seedCards && nr) {
        try {
          const unit = await loadUnit(plan.level, nr);
          if (unit) await seed(userId, unit, client);
        } catch (err) {
          console.warn('[course-v2] merge: review cards not seeded for', plan.unitId, err && err.message);
        }
      }
    }
    return merged;
  } catch (err) {
    console.error('[course-v2] merge failed:', err && err.message);
    return 0;
  }
}
