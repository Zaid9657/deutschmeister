import { supabase } from '../utils/supabase.js';
import { setProgramItemDone } from './programProgress.js';

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
 */
export const completeLesson = async (userId, { level, lektionId, accuracy = 0, status = 'complete' }) => {
  if (!userId || !lektionId) return false;
  const lvl = String(level).toLowerCase();
  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        user_id: userId,
        level: lvl,
        lektion_id: lektionId,
        status,
        accuracy,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lektion_id' },
    );
  if (error) console.error('[lessonService] completeLesson:', error.message);
  await setProgramItemDone(userId, programKeyFor(lvl), lektionId, true);
  return !error;
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
 * `client` is a seam for tests only; production always passes the real one.
 */
export const logAttempts = async (userId, { level, lektionId, createdAt = null } = {}, attempts = [], client = supabase) => {
  if (!userId || !attempts.length) return false;
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
 */
export const countCompletedRuns = async (userId, { level, lektionId, completed = false } = {}, client = supabase) => {
  if (!userId || !lektionId) return 0;
  const { data, error } = await client
    .from('lesson_attempts')
    .select('created_at')
    .eq('user_id', userId)
    .eq('lektion_id', lektionId)
    .eq('level', String(level || '').toLowerCase());

  if (error) {
    console.error('[lessonService] countCompletedRuns:', error.message);
    return 0;
  }
  const runs = new Set((data || []).map((r) => r.created_at)).size;
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
