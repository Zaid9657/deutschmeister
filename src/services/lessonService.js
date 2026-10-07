import { supabase } from '../utils/supabase.js';
import { setProgramItemDone } from './programProgress.js';
import { betterRun } from '../lib/lesson/mastery.js';

// Persistence for the lesson engine (migrations/2026-09-12-lesson-engine.sql).
// Fail-soft like programProgress.js: a logged-out learner, a blocked network or
// an unapplied migration must never stop a lesson — the screen keeps working
// and the row is simply not written. Every call here is RLS-scoped to the
// caller's own rows; nothing on this path uses the service role.

/** `a1.1` → `a11_course`, the program_key the CourseHome percent already reads. */
export const programKeyFor = (level) => `${String(level || '').toLowerCase().replace(/\./g, '')}_course`;

/** Every lesson_progress row for one level, as a Map keyed by lektion_id. */
export const getLessonProgress = async (userId, level) => {
  if (!userId) return new Map();
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lektion_id, status, accuracy, completed_at')
    .eq('user_id', userId)
    .eq('level', String(level).toLowerCase());

  if (error) {
    console.error('[lessonService] getLessonProgress:', error.message);
    return new Map();
  }
  return new Map((data || []).map((r) => [r.lektion_id, r]));
};

/**
 * A passed course final test (the Modelltest whose slug is the curriculum's
 * testSlug) completes the last node of the course path — the node the
 * certificate requires. Nothing wrote it before 2026-10-05, so the certificate
 * of a rebuilt course could not be reached.
 */
export const completeLevelTest = (userId, level, nodeId) => (
  userId ? setProgramItemDone(userId, programKeyFor(level), nodeId, true) : Promise.resolve(false)
);

/** Mark a Lektion as opened. Never overwrites a finished row back to 'started'. */
export const startLesson = async (userId, level, lektionId) => {
  if (!userId || !lektionId) return false;
  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      { user_id: userId, level: String(level).toLowerCase(), lektion_id: lektionId, status: 'started', updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lektion_id', ignoreDuplicates: true },
    );
  if (error) console.error('[lessonService] startLesson:', error.message);
  return !error;
};

/**
 * Finish a Lektion: the lesson_progress row AND the program_progress tick that
 * keeps the existing course percent and certificate working (CONTRACT.md,
 * "Persistence"). The course tick is deliberately last — a failed lesson row
 * must not leave the path stuck.
 *
 * The row keeps the BETTER run (mastery.betterRun): a weaker repeat no longer
 * overwrites a Gold run's status and accuracy (2026-10 review, finding C). True
 * only when both writes landed — the sync outbox retries on false.
 */
export const completeLesson = async (userId, { level, lektionId, accuracy = 0, status = 'complete' }, client = supabase) => {
  if (!userId || !lektionId) return false;
  const lvl = String(level).toLowerCase();
  const { data: prev, error: readError } = await client
    .from('lesson_progress')
    .select('status, accuracy')
    .eq('user_id', userId)
    .eq('lektion_id', lektionId)
    .maybeSingle();
  // Without the stored run we cannot know which run is better; writing anyway could replace a Gold
  // with a weaker repeat. Report failure so the outbox keeps the run and retries (Codex review).
  if (readError) {
    console.error('[lessonService] completeLesson read:', readError.message);
    return false;
  }
  const stored = prev && prev.status && prev.status !== 'started' ? { status: prev.status, accuracy: Number(prev.accuracy) || 0 } : null;
  const kept = betterRun(stored, { status, accuracy });
  const { error } = await client
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        level: lvl,
        lektion_id: lektionId,
        status: kept.status,
        accuracy: kept.accuracy,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lektion_id' },
    );
  if (error) console.error('[lessonService] completeLesson:', error.message);
  const ticked = await setProgramItemDone(userId, programKeyFor(lvl), lektionId, true);
  return !error && ticked !== false;
};

/**
 * One row per answered item, for the error-tag report and the review queue.
 * `attempts` = [{ itemId, stage, correct, errorTag }]. Batched in one insert.
 *
 * ONE BATCH IS ONE COMPLETED RUN — that is the contract `countCompletedRuns`
 * below counts on, and the merge of a signed-out learner's progress depends on
 * it (src/lib/course/localProgress.js). `createdAt` lets a caller stamp the
 * batch with the moment the run actually happened, which is what keeps three
 * merged runs three runs instead of one. The column has a plain `now()`
 * DEFAULT and the INSERT policy on `lesson_attempts` only checks
 * `auth.uid() = user_id` (migrations/2026-09-12-lesson-engine.sql), so an
 * explicit value is allowed — but if a future policy or trigger ever refuses
 * it, the batch is retried WITHOUT the stamp rather than lost: separate
 * awaited INSERTs still get distinct `now()` values, so the run count survives
 * either way.
 *
 * IDEMPOTENT for a stamped batch (2026-10): a batch whose (user, Lektion,
 * created_at) is already in the table is not written again, so the sync outbox
 * can retry after a lost response without adding a phantom "completed run".
 * The same check runs again after a FAILED stamped insert, before the unstamped
 * fallback: an insert that committed but whose response was lost must not be
 * written a second time with a server timestamp (Codex review, 2026-10-07).
 *
 * `client` is a seam for tests only; production always passes the real one.
 */
export const logAttempts = async (userId, { level, lektionId, createdAt = null } = {}, attempts = [], client = supabase) => {
  if (!userId || !attempts.length) return false;
  if (createdAt) {
    const { data: already, error: readError } = await client
      .from('lesson_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .eq('lektion_id', lektionId)
      .eq('created_at', createdAt);
    if (!readError && already && already.length) return true;
  }
  const base = attempts.map((a) => ({
    user_id: userId,
    level: String(level).toLowerCase(),
    lektion_id: lektionId,
    item_id: String(a.itemId || ''),
    stage: String(a.stage || ''),
    correct: !!a.correct,
    error_tag: a.errorTag || null,
  }));
  const rows = createdAt ? base.map((r) => ({ ...r, created_at: createdAt })) : base;
  const { error } = await client.from('lesson_attempts').insert(rows);
  if (error && createdAt) {
    const { data: landed, error: recheckError } = await client
      .from('lesson_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .eq('lektion_id', lektionId)
      .eq('created_at', createdAt);
    if (recheckError) return false; // unknown: retry later with the same stamp, never a second batch
    if (landed && landed.length) return true;
    const retry = await client.from('lesson_attempts').insert(base);
    if (retry.error) console.error('[lessonService] logAttempts:', retry.error.message);
    return !retry.error;
  }
  if (error) console.error('[lessonService] logAttempts:', error.message);
  return !error;
};

/**
 * The stand-in row a merge writes for a completed run whose answers are no
 * longer in the local store (a store written before runs were tagged, or a run
 * whose items were trimmed). It records the FACT of the run, never an answer:
 * `correct: true` and no error tag, so it seeds no review card and shows up in
 * no error report; it is excluded by item_id/stage from every other reader of
 * this table (checkpoint attempt windows, the explain and read-aloud caps).
 */
export const RUN_MARKER_ITEM_ID = '__run__';
export const RUN_MARKER_STAGE = 'run';
export const runMarkerAttempt = () => ({ itemId: RUN_MARKER_ITEM_ID, stage: RUN_MARKER_STAGE, correct: true, errorTag: null });

/**
 * How many times this learner has FINISHED one Lektion — derived, never stored.
 *
 * `logAttempts` writes one run's answers in a single INSERT, and `created_at`
 * defaults to now(), which inside one statement is the same timestamp for every
 * row of that batch. So the number of DISTINCT `created_at` values for a
 * (user, Lektion) is the number of completed runs, and the lesson engine can
 * derive the attempt number from it (`attemptFromCompletions`) without a schema
 * column and without a second write path that could disagree with the first.
 * A learner whose progress row says the Lektion is finished but who has no
 * attempt rows (an offline run, a merge from before this existed) counts as 1.
 * The merge of signed-out progress therefore writes ONE BATCH PER COMPLETED
 * RUN (localProgress.planLocalMerge) — it must never collapse three runs into
 * one insert, and it must never write a batch for a run that did not happen.
 *
 * Fail-soft like everything else here: on any error the answer is 0, i.e.
 * attempt 1 — a learner never loses a lesson to a failed count.
 *
 * Rows that are NOT a run are skipped: explain-answer.mjs and score-readaloud.mjs
 * log one row per call under the Lektion id, each with its own now(), so every
 * "Explain" tap and every read-aloud used to count as one more finished run.
 */
const NOT_A_RUN = new Set(['explain', 'readaloud', 'checkpoint']);

export const countCompletedRuns = async (userId, { level, lektionId, completed = false } = {}, client = supabase) => {
  if (!userId || !lektionId) return 0;
  const { data, error } = await client
    .from('lesson_attempts')
    .select('created_at, stage')
    .eq('user_id', userId)
    .eq('lektion_id', lektionId)
    .eq('level', String(level || '').toLowerCase());

  if (error) {
    console.error('[lessonService] countCompletedRuns:', error.message);
    return 0;
  }
  const runs = new Set((data || []).filter((r) => !NOT_A_RUN.has(r.stage)).map((r) => r.created_at)).size;
  return runs || (completed ? 1 : 0);
};

/**
 * The Wortfeld's words by id — article, plural and audio_url for the cards.
 * Words whose `wordId` is null in the curriculum simply render from the
 * curriculum's own de/en/article/plural fields.
 */
export const fetchWordsByIds = async (ids = []) => {
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return new Map();
  const { data, error } = await supabase
    .from('words')
    .select('id, german, english, article, plural, audio_url, example_sentence')
    .in('id', clean);

  if (error) {
    console.error('[lessonService] fetchWordsByIds:', error.message);
    return new Map();
  }
  return new Map(
    (data || []).map((row) => [
      row.id,
      {
        id: row.id,
        german: row.german || '',
        english: row.english || '',
        article: row.article || '',
        // Some rows carry the literal string "null" (see vocabularyService).
        plural: row.plural && row.plural !== 'null' ? row.plural : '',
        audioUrl: row.audio_url || '',
        example: row.example_sentence || '',
      },
    ]),
  );
};
