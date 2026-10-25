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

test('B3 #12: a first completion reports its actual due-now review schedule', async () => {
  const client = reviewClient();
  const before = Date.now();
  await seedCardsForLektion('u1', lektion, 'A1.1', client);
  const due = await fetchLektionReviewDueAt('u1', lektion, 'A1.1', client);
  assert.equal(due, client.rows[0].due_at);
  assert.ok(Date.parse(due) >= before && Date.parse(due) <= Date.now(), 'new cards are due now, not a promised invented date');
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
