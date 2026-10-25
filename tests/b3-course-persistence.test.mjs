import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { completeLesson } from '../src/services/lessonService.js';
import { seedCardsForLektion, fetchLektionReviewDueAt } from '../src/services/reviewService.js';
import { supabase } from '../src/utils/supabase.js';
import {
  LOCAL_KEY, clearLocalProgress, recordLocalLesson, readLocalProgress,
  retryLocalProgressSave, mergeLocalProgress,
} from '../src/lib/course/localProgress.js';

const run = { level: 'A1.1', lektionId: 'a1.1-l01', status: 'gold', accuracy: 0.95 };

test('B3 #2: migrated completions use the atomic RPC and never the racy client upsert', async () => {
  const calls = [];
  const client = {
    rpc: async (name, args) => { calls.push({ name, args }); return { data: true, error: null }; },
    from: () => assert.fail('the migrated path must not read and upsert separately'),
  };
  assert.equal(await completeLesson('u1', run, client), true);
  assert.deepEqual(calls, [{ name: 'complete_lesson', args: {
    p_user_id: 'u1', p_level: 'a1.1', p_lektion_id: run.lektionId, p_status: 'gold', p_accuracy: 0.95,
  } }]);
});

test('B3 #2: only the unavailable completion RPC permits the existing pre-migration path', async () => {
  const writes = [];
  const oldFrom = supabase.from;
  supabase.from = (table) => ({ upsert: async (row) => { writes.push({ table, row }); return { error: null }; } });
  try {
    const client = {
      rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find public.complete_lesson in the schema cache' } }),
      from(table) {
        const query = {
          select: () => query, eq: () => query,
          maybeSingle: async () => ({ data: { status: 'gold', accuracy: 0.95 }, error: null }),
          upsert: async (row) => { writes.push({ table, row }); return { error: null }; },
        };
        return query;
      },
    };
    assert.equal(await completeLesson('u1', { ...run, status: 'complete', accuracy: 0.4 }, client), true);
    assert.deepEqual(writes.map(({ table }) => table), ['lesson_progress', 'program_progress']);
    assert.deepEqual([writes[0].row.status, writes[0].row.accuracy], ['gold', 0.95]);
    assert.equal(writes[1].row.program_key, 'a11_course');
    for (const error of [
      { code: '42501', message: 'permission denied for complete_lesson' },
      { code: 'PGRST202', message: 'Could not find another_function in the schema cache' },
      { code: '08006', message: 'Connection lost while calling complete_lesson' },
    ]) {
      assert.equal(await completeLesson('u1', run, { rpc: async () => ({ error }), from: () => assert.fail('an RPC error must stay queued') }), false);
    }
    assert.equal(writes.length, 2, 'permission, network and unrelated missing-function errors never use the old writer');
  } finally {
    supabase.from = oldFrom;
  }
});

test('B3 #2: the migration compares the locked conflict row and retains own-user RLS', () => {
  const sql = readFileSync(new URL('../migrations/2026-10-22-lesson-better-run.sql', import.meta.url), 'utf8');
  assert.match(sql, /SECURITY INVOKER\s+SET search_path = public, pg_temp/);
  assert.match(sql, /learner_id uuid := auth\.uid\(\)/);
  assert.match(sql, /learner_id IS NULL OR p_user_id IS DISTINCT FROM learner_id/);
  assert.match(sql, /INSERT INTO public\.lesson_progress AS stored[\s\S]*ON CONFLICT \(user_id, lektion_id\) DO UPDATE/);
  assert.match(sql, /WHERE stored\.status = 'started'\s+OR EXCLUDED\.accuracy > coalesce\(stored\.accuracy, 0\)/);
  assert.match(sql, /INSERT INTO public\.program_progress/);
  assert.match(sql, /REVOKE EXECUTE[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE[\s\S]*TO authenticated/);
});

function storage() {
  const values = new Map();
  let blocked = false;
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      if (blocked) throw new Error('QuotaExceededError');
      values.set(key, String(value));
    },
    removeItem: (key) => values.delete(key),
  } };
  clearLocalProgress();
  return { values, block: (value) => { blocked = value; } };
}

test('B3 #6: a refused guest write stays in memory and a retry saves the same run once', () => {
  const store = storage();
  store.block(true);
  assert.equal(recordLocalLesson({ ...run, attempts: [{ itemId: 'p1', stage: 'practice', correct: true }] }), false);
  const pending = readLocalProgress();
  assert.equal(pending.lektionen[run.lektionId].runs, 1);
  assert.equal(pending.attempts.length, 1);
  assert.equal(retryLocalProgressSave(), false);
  store.block(false);
  assert.equal(retryLocalProgressSave(), true);
  assert.deepEqual(JSON.parse(store.values.get(LOCAL_KEY)), pending);
  assert.equal(readLocalProgress().lektionen[run.lektionId].runs, 1, 'retrying storage does not record another completion');
});

test('B3 #6: signing in can merge an in-memory guest run while device storage remains blocked', async () => {
  const store = storage();
  store.block(true);
  recordLocalLesson(run);
  const steps = [];
  const merged = await mergeLocalProgress('u1', {
    completeLesson: async () => { steps.push('progress'); return true; },
    logAttempts: async () => { steps.push('attempts'); return true; },
    seedCards: async () => { steps.push('cards'); return true; },
  });
  assert.equal(merged, 1);
  assert.deepEqual(steps, ['progress', 'attempts', 'cards']);
  assert.equal(readLocalProgress().level, null);
});

test('B3 #7: guest merge retains the local run until review cards also land', async () => {
  storage();
  recordLocalLesson(run);
  const pending = readLocalProgress();
  const seeds = [];
  let seedOk = false;
  const deps = {
    completeLesson: async () => true,
    logAttempts: async () => true,
    seedCards: async (userId, plan) => { seeds.push({ userId, plan }); return seedOk; },
  };
  assert.equal(await mergeLocalProgress('u1', deps), 0);
  assert.deepEqual(readLocalProgress(), pending, 'failed card writes keep attempts, completion and their original stamps');
  seedOk = true;
  assert.equal(await mergeLocalProgress('u1', deps), 1);
  assert.equal(seeds.length, 2);
  assert.deepEqual([seeds[0].userId, seeds[0].plan.level, seeds[0].plan.lektionId], ['u1', 'a1.1', run.lektionId]);
  assert.equal(readLocalProgress().level, null);
});

test('B3 #7: the production guest-merge seeder writes words, patterns and sentences', async () => {
  storage();
  recordLocalLesson(run);
  const oldFrom = supabase.from;
  const cards = [];
  supabase.from = (table) => ({ upsert: async (rows, options) => {
    assert.equal(table, 'review_cards');
    assert.equal(options.ignoreDuplicates, true, 'a retry must preserve earned schedules');
    cards.push(...rows);
    return { error: null };
  } });
  try {
    assert.equal(await mergeLocalProgress('u1', { completeLesson: async () => true, logAttempts: async () => true }), 1);
    assert.deepEqual([...new Set(cards.map((card) => card.kind))].sort(), ['pattern', 'sentence', 'word']);
    assert.ok(cards.every((card) => card.user_id === 'u1' && card.level === 'a1.1'));
  } finally {
    supabase.from = oldFrom;
  }
});

function reviewClient() {
  const rows = [];
  return {
    rows,
    from: () => {
      const filters = [];
      const query = {
        select: () => query,
        eq: (key, value) => { filters.push((row) => row[key] === value); return query; },
        in: (key, values) => { filters.push((row) => values.includes(row[key])); return query; },
        order: () => query,
        limit: () => query,
        upsert: async (batch) => {
          for (const row of batch) {
            if (!rows.some((existing) => existing.user_id === row.user_id && existing.card_key === row.card_key)) rows.push(row);
          }
          return { error: null };
        },
        then: (resolve) => resolve({ data: rows.filter((row) => filters.every((filter) => filter(row))).sort((a, b) => a.due_at.localeCompare(b.due_at)).slice(0, 1), error: null }),
      };
      return query;
    },
  };
}

const lektion = { id: 'a1.1-l01', level: 'a1.1', wortfeld: [{ de: 'Hallo' }], practiceRule: { topics: ['greetings'] } };

test('B3 #12: a first completion reports its actual review schedule — the first rung, tomorrow', async () => {
  const client = reviewClient();
  const seededAt = new Date('2026-10-21T18:00:00.000Z');
  await seedCardsForLektion('u1', lektion, 'A1.1', client, seededAt);
  const due = await fetchLektionReviewDueAt('u1', lektion, 'A1.1', client);
  assert.equal(due, client.rows[0].due_at, 'the date the recap names is the saved one, never an invented promise');
  // New cards come back on the ladder's first rung (2026-10-25 cross-check, LSN-11), not at once: the
  // next local calendar day at the same clock time (a daylight-saving change is not a day).
  const tomorrow = new Date(seededAt.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert.equal(due, tomorrow.toISOString());
});

test('B3 #12: a repeat reports the earned schedule of this lesson, including overdue cards', async () => {
  const client = reviewClient();
  await seedCardsForLektion('u1', lektion, 'a1.1', client);
  for (const row of client.rows) row.due_at = '2027-05-14T10:00:00.000Z';
  client.rows.push({ user_id: 'u1', level: 'a1.1', card_key: 'word:unrelated', due_at: '2025-01-01T00:00:00.000Z' });
  client.rows.push({ user_id: 'other', level: 'a1.1', card_key: 'word:Hallo', due_at: '2025-01-01T00:00:00.000Z' });
  await seedCardsForLektion('u1', lektion, 'a1.1', client);
  assert.equal(await fetchLektionReviewDueAt('u1', lektion, 'a1.1', client), '2027-05-14T10:00:00.000Z');
  client.rows[0].due_at = '2026-01-01T00:00:00.000Z';
  assert.equal(await fetchLektionReviewDueAt('u1', lektion, 'a1.1', client), '2026-01-01T00:00:00.000Z');
});

// ── A checkpoint passed while signed out (2026-10-25 cross-check, LSN-02) ────────────────────────
// recordAttempt counted the guest's attempt and returned false: the pass was stored nowhere. The course
// home kept offering Checkpoint 1, KannIch counted 0 checkpoints, Lektion 4 stayed locked, and after
// signup the learner had to pass it again inside the 3-attempts-per-8-hours window.

const PAPER = { level: 'a1.1', checkpointId: 'a1.1-cp1', items: [], answers: {}, result: { passed: true, overall: 75 }, stamp: '2026-10-21T18:30:00.000Z' };

test('LSN-02: a guest\'s checkpoint pass is kept on the device and counts as done on the course home', async () => {
  storage();
  const { recordAttempt, guestPassKept } = await import('../src/services/checkpointService.js');
  const { localDoneIds, hasLocalProgress } = await import('../src/lib/course/localProgress.js');
  const { courseNextStep } = await import('../src/lib/courseNext.js');
  for (const nr of [1, 2, 3]) recordLocalLesson({ level: 'a1.1', lektionId: `a1.1-l0${nr}`, status: 'complete', accuracy: 0.7 });
  assert.equal(courseNextStep('a1.1', localDoneIds('a1.1')).href, '/course/a1.1/checkpoint/1', 'before: the checkpoint is next');
  assert.equal(await recordAttempt(null, { ...PAPER, result: { passed: false, overall: 40 } }), false);
  assert.equal(localDoneIds('a1.1').has('a1.1-cp1'), false, 'a failed paper is not a pass');
  assert.equal(await recordAttempt(null, PAPER), false, 'nothing reached an account');
  assert.equal(localDoneIds('a1.1').has('a1.1-cp1'), true, 'the pass is done on this device');
  assert.equal(guestPassKept('a1.1', 'a1.1-cp1'), true, 'the result card says it is kept here');
  assert.equal(courseNextStep('a1.1', localDoneIds('a1.1')).href, '/course/a1.1/l/4', 'after: Lektion 4 is next, and open');
  assert.deepEqual(readLocalProgress().checkpoints['a1.1-cp1'], { passedAt: PAPER.stamp, accuracy: 0.75, stamp: PAPER.stamp });
  assert.equal(readLocalProgress().lektionen['a1.1-l03'].status, 'complete', 'the guest Lektionen are untouched');
  // A store holding only a pass is still progress to merge.
  storage();
  await recordAttempt(null, PAPER);
  assert.equal(hasLocalProgress('a1.1'), true);
});

test('LSN-02: signing in writes the stamped summary row and the completion, and clears the pass only once both landed', async () => {
  storage();
  recordLocalLesson(run);
  const { recordAttempt } = await import('../src/services/checkpointService.js');
  await recordAttempt(null, PAPER);
  const pending = readLocalProgress();
  const calls = [];
  let ok = false;
  const deps = {
    completeLesson: async () => true,
    logAttempts: async () => true,
    seedCards: async () => true,
    recordCheckpoint: async (userId, args) => { calls.push({ userId, args }); return ok; },
  };
  assert.equal(await mergeLocalProgress('u1', deps), 0, 'a checkpoint write that did not land keeps the store');
  assert.deepEqual(readLocalProgress(), pending, 'the pass and the Lektion are both still on the device');
  ok = true;
  assert.equal(await mergeLocalProgress('u1', deps), 2, 'one Lektion and one checkpoint');
  assert.deepEqual(calls[1], { userId: 'u1', args: {
    level: 'a1.1', checkpointId: 'a1.1-cp1', items: [], answers: {}, result: { passed: true, overall: 75 }, stamp: PAPER.stamp, retry: true,
  } }, 'the paper\'s own stamp, so a second merge finds the row it wrote; retry, so the guest attempt is not counted twice');
  assert.equal(readLocalProgress().level, null, 'cleared once everything landed');
});

test('LSN-02: the production merge writes the pass through recordAttempt — one summary row under the stamp, then the completion', async () => {
  storage();
  const { recordAttempt } = await import('../src/services/checkpointService.js');
  await recordAttempt(null, PAPER);
  const writes = [];
  const attempts = [];
  const original = supabase.from;
  supabase.from = (table) => {
    const filters = [];
    const query = {
      select: () => query,
      eq: (k, v) => { filters.push((r) => r[k] === v); return query; },
      insert: async (rows) => { attempts.push(...rows); writes.push({ table, op: 'insert', rows }); return { error: null }; },
      upsert: async (row) => { writes.push({ table, op: 'upsert', row }); return { error: null }; },
      then: (resolve) => resolve({ data: attempts.filter((r) => filters.every((f) => f(r))), error: null }),
    };
    return query;
  };
  try {
    assert.equal(await mergeLocalProgress('u1'), 1);
    assert.equal(await mergeLocalProgress('u1'), 0, 'nothing left to merge');
  } finally {
    supabase.from = original;
  }
  const inserted = writes.filter((w) => w.op === 'insert');
  assert.equal(inserted.length, 1);
  assert.deepEqual(inserted[0].rows, [{
    user_id: 'u1', level: 'a1.1', lektion_id: 'a1.1-cp1', item_id: 'a1.1-cp1', stage: 'checkpoint', correct: true, error_tag: null, created_at: PAPER.stamp,
  }], 'the summary row the attempt limit counts and the course home reconciles from');
  const progress = writes.find((w) => w.table === 'lesson_progress');
  assert.deepEqual([progress.row.lektion_id, progress.row.status, progress.row.accuracy], ['a1.1-cp1', 'complete', 0.75]);
  assert.deepEqual(writes.find((w) => w.table === 'program_progress').row, { user_id: 'u1', program_key: 'a11_course', item_id: 'a1.1-cp1' });
});
