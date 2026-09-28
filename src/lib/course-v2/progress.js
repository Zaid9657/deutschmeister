// Course v2 — learner-state persistence for the player (SCHEMA §2 "Learner-state
// ids", §14; BLUEPRINT §3.5). No new tables: the v2 player reuses the lesson
// engine's `lesson_progress`, `lesson_attempts` and `review_cards`
// (migrations/2026-09-12-lesson-engine.sql) with lektion_id = the v2 unit id
// (`a2.1-u07`), which cannot collide with the live course's `a1.1-lNN`.
//
//   lesson_progress   one row per unit: 'started' → 'complete' | 'gold'
//                     ('tested_out' once migrations/2026-10-01-course-v2.sql widened
//                     the status check — until then a test-out keeps 'started' and the
//                     credit lives in the step markers below).
//   lesson_attempts   one row per answered item (stage = the step kind, SCHEMA §14),
//                     written as ONE batch when a step is finished, plus one
//                     STEP MARKER row per finished step:
//                       { item_id: <step id>, stage: 'lernschritt', correct: true }
//                     A test-out writes markers with stage 'lernschritt-testout'.
//                     The markers are how a unit resumes at the step level on any
//                     device, and they are completion.js's `finishedSteps`; the
//                     number of 'lernschritt' markers of a step is how many times
//                     it was finished, i.e. the next draw's attempt number.
//   review_cards      seeded once the unit's Check is done (SCHEMA §2 card keys).
//
// A Plateau or closing block is kept the same way under its own id (`a1.1-p2`, `a1.1-ht-sd1`):
// one marker per finished section (assessment.js), its answered items as rows with the stage
// 'plateau' / 'abschluss', and 'complete' in lesson_progress once it is submitted — which is what
// completion.js counts for the course.
//
// Fail-soft like src/services/lessonService.js: a blocked network, a missing table
// or an unapplied migration logs and returns an empty answer; a lesson never stops
// on a failed write. Every query is RLS-scoped to the caller's own rows.
import { supabase } from '../../utils/supabase.js';
import { logAttempts } from '../../services/lessonService.js';
import { seedCardsForLektion } from '../../services/reviewService.js';
import { answersFromRows } from './assessment.js';

export const STEP_MARKER_STAGE = 'lernschritt';
export const TESTOUT_MARKER_STAGE = 'lernschritt-testout';
const MARKER_STAGES = [STEP_MARKER_STAGE, TESTOUT_MARKER_STAGE];

const lc = (s) => String(s || '').toLowerCase();

/** A step-marker attempt row (see the header). */
export const stepMarker = (stepId, stage = STEP_MARKER_STAGE) => ({ itemId: stepId, stage, correct: true, errorTag: null });

/**
 * Fold marker rows into per-unit finished steps and per-step run counts.
 * rows: [{ lektion_id, item_id, stage }] → { finishedSteps: Map<unitId, Set<stepId>>, stepRuns: Map<stepId, n> }
 */
export function foldMarkers(rows = []) {
  const finishedSteps = new Map();
  const stepRuns = new Map();
  for (const r of rows || []) {
    if (!r || !MARKER_STAGES.includes(r.stage) || !r.item_id || !r.lektion_id) continue;
    if (!finishedSteps.has(r.lektion_id)) finishedSteps.set(r.lektion_id, new Set());
    finishedSteps.get(r.lektion_id).add(r.item_id);
    if (r.stage === STEP_MARKER_STAGE) stepRuns.set(r.item_id, (stepRuns.get(r.item_id) || 0) + 1);
  }
  return { finishedSteps, stepRuns };
}

/**
 * Everything the course home needs for one level.
 * → { progress: Map<lektionId, row>, finishedSteps: Map<unitId, Set>, stepRuns: Map }
 */
export async function fetchLevelState(userId, level, client = supabase) {
  const empty = { progress: new Map(), finishedSteps: new Map(), stepRuns: new Map() };
  if (!userId) return empty;
  try {
    const [prog, marks] = await Promise.all([
      client.from('lesson_progress').select('lektion_id, status, accuracy, completed_at').eq('user_id', userId).eq('level', lc(level)),
      client.from('lesson_attempts').select('lektion_id, item_id, stage').eq('user_id', userId).eq('level', lc(level)).in('stage', MARKER_STAGES),
    ]);
    if (prog.error) console.error('[course-v2] lesson_progress:', prog.error.message);
    if (marks.error) console.error('[course-v2] step markers:', marks.error.message);
    return {
      progress: new Map(((prog.data) || []).map((r) => [r.lektion_id, r])),
      ...foldMarkers(marks.data || []),
    };
  } catch (err) {
    console.error('[course-v2] fetchLevelState:', err && err.message);
    return empty;
  }
}

/** The same for one unit. → { row, finishedSteps: Set, stepRuns: Map } */
export async function fetchUnitState(userId, level, unitId, client = supabase) {
  const empty = { row: null, finishedSteps: new Set(), stepRuns: new Map() };
  if (!userId || !unitId) return empty;
  try {
    const [prog, marks] = await Promise.all([
      client.from('lesson_progress').select('lektion_id, status, accuracy, completed_at').eq('user_id', userId).eq('lektion_id', unitId).maybeSingle(),
      client.from('lesson_attempts').select('lektion_id, item_id, stage').eq('user_id', userId).eq('lektion_id', unitId).in('stage', MARKER_STAGES),
    ]);
    if (prog.error) console.error('[course-v2] lesson_progress:', prog.error.message);
    if (marks.error) console.error('[course-v2] step markers:', marks.error.message);
    const folded = foldMarkers(marks.data || []);
    return { row: prog.data || null, finishedSteps: folded.finishedSteps.get(unitId) || new Set(), stepRuns: folded.stepRuns };
  } catch (err) {
    console.error('[course-v2] fetchUnitState:', err && err.message);
    return empty;
  }
}

/**
 * A Plateau's or closing block's state (SCHEMA §2: lektion_id = its id; src/lib/course-v2/assessment.js):
 * the section markers as finished steps and runs, and the latest answer per item for the results card.
 * → { row, finishedSteps: Set, stepRuns: Map, answers: Map<itemId, correct> }
 */
export async function fetchAssessmentState(userId, level, id, client = supabase) {
  const empty = { row: null, finishedSteps: new Set(), stepRuns: new Map(), answers: new Map() };
  if (!userId || !id) return empty;
  try {
    const [prog, rows] = await Promise.all([
      client.from('lesson_progress').select('lektion_id, status, accuracy, completed_at').eq('user_id', userId).eq('lektion_id', id).maybeSingle(),
      client.from('lesson_attempts').select('lektion_id, item_id, stage, correct, created_at').eq('user_id', userId).eq('lektion_id', id).order('created_at', { ascending: true }),
    ]);
    if (prog.error) console.error('[course-v2] lesson_progress:', prog.error.message);
    if (rows.error) console.error('[course-v2] assessment attempts:', rows.error.message);
    const data = rows.data || [];
    const folded = foldMarkers(data);
    return {
      row: prog.data || null,
      finishedSteps: folded.finishedSteps.get(id) || new Set(),
      stepRuns: folded.stepRuns,
      answers: answersFromRows(data, MARKER_STAGES),
    };
  } catch (err) {
    console.error('[course-v2] fetchAssessmentState:', err && err.message);
    return empty;
  }
}

/** Mark a unit (or Plateau) as opened. Never overwrites a finished row back to 'started'. */
export async function startUnit(userId, level, unitId, client = supabase) {
  if (!userId || !unitId) return false;
  const { error } = await client
    .from('lesson_progress')
    .upsert(
      { user_id: userId, level: lc(level), lektion_id: unitId, status: 'started', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lektion_id', ignoreDuplicates: true },
    );
  if (error) console.error('[course-v2] startUnit:', error.message);
  return !error;
}

/** attempts of the shared contract → lesson_attempts rows via lessonService.logAttempts. */
const toRows = (attempts, stage) => (attempts || [])
  .filter((a) => a && a.itemId)
  .map((a) => ({ itemId: a.itemId, stage, correct: !!a.correct, errorTag: a.correct ? null : a.errorTag || null }));

/** Write answered items that were not yet written (e.g. the learner leaves mid-step). */
export async function flushAttempts(userId, { level, unitId, stepKind }, attempts, client = supabase) {
  const rows = toRows(attempts, stepKind || 'v2');
  if (!userId || !rows.length) return false;
  return logAttempts(userId, { level: lc(level), lektionId: unitId }, rows, client);
}

/**
 * A finished step: its remaining answered items and its marker, in ONE batch.
 * `attempts` are the onAttempt payloads not yet flushed.
 */
export async function recordStepDone(userId, { level, unitId, step }, attempts = [], client = supabase) {
  if (!userId || !step || !step.id) return false;
  const rows = [...toRows(attempts, step.kind), stepMarker(step.id)];
  return logAttempts(userId, { level: lc(level), lektionId: unitId }, rows, client);
}

/**
 * „Ich kann das schon" passed: the deterministic Lernschritte are credited
 * (BLUEPRINT §3.5); the two Aufgaben stay open.
 */
export async function recordTestOut(userId, { level, unitId, stepIds, accuracy = null }, client = supabase) {
  if (!userId || !unitId) return false;
  const rows = (stepIds || []).map((id) => stepMarker(id, TESTOUT_MARKER_STAGE));
  const ok = rows.length ? await logAttempts(userId, { level: lc(level), lektionId: unitId }, rows, client) : true;
  const { error } = await client
    .from('lesson_progress')
    .upsert(
      { user_id: userId, level: lc(level), lektion_id: unitId, status: 'tested_out', accuracy, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lektion_id' },
    );
  // Before the 2026-10-01 migration the status check rejects 'tested_out'; the
  // markers above carry the credit, so this is logged and not retried.
  if (error) console.warn('[course-v2] tested_out not stored (migration pending?):', error.message);
  return ok;
}

/**
 * Store a unit's status as completion.js computed it. A 'complete'/'gold' row gets
 * completed_at; 'gold' is never written back down to 'complete' (the caller passes
 * the stored status so this stays a pure decision: see statusToStore).
 */
export async function saveUnitStatus(userId, { level, unitId, status, accuracy = null }, client = supabase) {
  if (!userId || !unitId || !status) return false;
  const now = new Date().toISOString();
  const row = { user_id: userId, level: lc(level), lektion_id: unitId, status, updated_at: now };
  if (accuracy !== null && accuracy !== undefined) row.accuracy = accuracy;
  if (status === 'complete' || status === 'gold') row.completed_at = now;
  const { error } = await client.from('lesson_progress').upsert(row, { onConflict: 'user_id,lektion_id' });
  if (error) console.error('[course-v2] saveUnitStatus:', error.message);
  return !error;
}

/** The status to write: never down from gold, never from done back to started. */
export function statusToStore(stored, computed, { accuracy = null, goldAt = 0.8 } = {}) {
  if (stored === 'gold') return 'gold';
  if (computed === 'complete' || computed === 'gold') {
    return accuracy !== null && Number(accuracy) >= goldAt ? 'gold' : 'complete';
  }
  if (stored === 'complete') return 'complete';
  return computed || stored || 'started';
}

/**
 * The unit's review-card keys: the compiled `reviewCards` list when present, else
 * derived from the unit (SCHEMA §2: word:<lexiconId>, pattern:<spineId>:<unitId>,
 * sentence:<redemittelId>).
 */
export function reviewCardKeys(unit) {
  if (!unit) return [];
  if (Array.isArray(unit.reviewCards) && unit.reviewCards.length) return unit.reviewCards.filter((k) => typeof k === 'string');
  const keys = [];
  const spec = unit.spec || {};
  for (const block of spec.lexiconBlocks || []) for (const lemma of block.lemmas || []) keys.push(`word:${lemma}`);
  for (const g of (spec.grammar && spec.grammar.new) || []) keys.push(`pattern:${g}:${unit.id}`);
  for (const rm of unit.redemittel || []) if (rm && rm.id) keys.push(`sentence:${rm.id}`);
  return [...new Set(keys)];
}

/**
 * Seed the unit's review cards. Word and pattern keys go through the live seeding
 * path (reviewService.seedCardsForLektion — idempotent, a card keeps the schedule
 * it has earned) via a Lektion-shaped adapter whose keys come out exactly as SCHEMA
 * §2 writes them; sentence keys (`sentence:<redemittelId>`) have no such adapter
 * (the live key is `sentence:<lektionId>:<lineIdx>`), so they are upserted here in
 * the same row shape with the same ignore-duplicates rule.
 */
export async function seedUnitCards(userId, unit, client = supabase) {
  if (!userId || !unit) return 0;
  const keys = reviewCardKeys(unit);
  const words = keys.filter((k) => k.startsWith('word:')).map((k) => ({ wordId: k.slice(5) }));
  const patterns = keys.filter((k) => k.startsWith('pattern:')).map((k) => k.slice(8));
  const sentences = keys.filter((k) => k.startsWith('sentence:'));
  let n = 0;
  if (words.length || patterns.length) {
    n += await seedCardsForLektion(userId, { id: unit.id, level: unit.level, wortfeld: words, grammarSlugs: patterns }, unit.level);
  }
  if (sentences.length) {
    const due = new Date().toISOString();
    const rows = sentences.map((card_key) => ({ user_id: userId, card_key, kind: 'sentence', level: lc(unit.level), step: 0, due_at: due }));
    const { error } = await client.from('review_cards').upsert(rows, { onConflict: 'user_id,card_key', ignoreDuplicates: true });
    if (error) console.error('[course-v2] seed sentence cards:', error.message);
    else n += rows.length;
  }
  return n;
}

let eventsUnavailable = false;
/**
 * One course_events row (SCHEMA §14, BLUEPRINT §7.8) — only client-writable names.
 * The table arrives with a hand-applied migration; until it exists the first
 * failure switches this off for the session instead of logging on every step.
 */
export async function logCourseEvent(userId, { name, level, unitId = null, stepId = null, props = {} }, client = supabase) {
  if (!userId || !name || eventsUnavailable) return false;
  try {
    const { error } = await client.from('course_events').insert({ user_id: userId, name, level: lc(level), unit_id: unitId, step_id: stepId, props });
    if (error) {
      eventsUnavailable = true;
      console.warn('[course-v2] course_events unavailable:', error.message);
      return false;
    }
    return true;
  } catch {
    eventsUnavailable = true;
    return false;
  }
}

/** The learner's goal row for a band (exam date, pace) — null when none or the table is missing. */
export async function fetchLearnerGoal(userId, band, client = supabase) {
  if (!userId || !band) return null;
  try {
    const { data, error } = await client
      .from('learner_goals')
      .select('band, lane, exam_date, pace, learning_days_per_week')
      .eq('user_id', userId)
      .eq('band', band)
      .maybeSingle();
    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
}
