// The attempt a repeat draws must survive every path — signing in included.
//
// Round 10 derived the attempt from the number of COMPLETED RUNS: signed in
// from the distinct `created_at` batches in `lesson_attempts`, signed out from
// a local counter. The merge on sign-in wrote every run of a Lektion in ONE
// insert, so three runs became one batch and the learner was handed attempt 2
// again — at the exact moment the course asks them to sign up (DaF review #10
// MAJOR 4).
//
// The rule these tests pin, as a property and not as a list of ids:
//   THE DERIVED ATTEMPT IS THE SAME BEFORE AND AFTER THE MERGE.
// Everything else here serves it — one batch per run, a marker batch for a run
// whose answers are gone, and no production caller that invents the number.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { attemptFromCompletions, ATTEMPT_CYCLE } from '../src/lib/lesson/buildLesson.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// ── a localStorage that behaves, for the module under test ──────────────────
function installStorage() {
  const map = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
    },
  };
  return map;
}
installStorage();

const progress = await import('../src/lib/course/localProgress.js');
const { LOCAL_KEY, MAX_ATTEMPTS_PER_LEKTION, planLocalMerge, readLocalProgress, recordLocalLesson, localRunCount, mergeLocalProgress } = progress;
const { countCompletedRuns, logAttempts, RUN_MARKER_ITEM_ID, RUN_MARKER_STAGE } = await import('../src/services/lessonService.js');

const write = (store) => { globalThis.window.localStorage.setItem(LOCAL_KEY, JSON.stringify(store)); };
const reset = () => { globalThis.window.localStorage.removeItem(LOCAL_KEY); };

/** A Supabase stand-in: `insert` appends rows, `select().eq().eq().eq()` reads them back. */
function fakeSupabase() {
  const rows = [];
  return {
    rows,
    from() {
      const q = {
        insert: async (batch) => { rows.push(...batch.map((r) => ({ ...r, created_at: r.created_at || new Date().toISOString() }))); return { error: null }; },
        select: () => q,
        eq: (col, val) => { q._f = [...(q._f || []), [col, val]]; return q; },
        then: undefined,
      };
      // The read path awaits the builder: give it a thenable that applies the filters.
      q.then = (resolve) => resolve({ data: rows.filter((r) => (q._f || []).every(([c, v]) => r[c] === v)), error: null });
      return q;
    },
  };
}

const runAttempts = (n) => Array.from({ length: n }, (_, i) => ({ itemId: `i${i}`, stage: 'practice', correct: true, errorTag: null }));

test('three local runs merge as three batches, count back as three, and keep the attempt', async () => {
  reset();
  for (let i = 0; i < 3; i += 1) recordLocalLesson({ level: 'a1.1', lektionId: 'l01', accuracy: 0.9, attempts: runAttempts(7) });
  assert.equal(localRunCount('a1.1', 'l01'), 3);
  const before = attemptFromCompletions(localRunCount('a1.1', 'l01'));

  const db = fakeSupabase();
  const calls = [];
  const merged = await mergeLocalProgress('u1', {
    completeLesson: async () => true,
    logAttempts: async (userId, opts, attempts) => { calls.push({ opts, attempts }); return logAttempts(userId, opts, attempts, db); },
  });
  assert.equal(merged, 1, 'one Lektion merged');
  assert.equal(calls.length, 3, 'one logAttempts call per completed run — not one for all of them');
  assert.equal(new Set(calls.map((c) => c.opts.createdAt)).size, 3, 'each batch carries its own created_at');

  const runs = await countCompletedRuns('u1', { level: 'a1.1', lektionId: 'l01', completed: true }, db);
  assert.equal(runs, 3, 'the merged rows count back as three runs');
  assert.equal(attemptFromCompletions(runs), before, 'the derived attempt survives the merge');
  assert.equal(readLocalProgress().level, null, 'the store is cleared after a successful merge');
});

test('the derived attempt is the same before and after the merge, for every n (the property)', async () => {
  for (let n = 1; n <= 3 * ATTEMPT_CYCLE + 1; n += 1) {
    reset();
    write({ level: 'a1.1', lektionen: { l02: { status: 'complete', accuracy: 0.8, runs: n } }, attempts: [] });
    const before = attemptFromCompletions(localRunCount('a1.1', 'l02'));
    const db = fakeSupabase();
    await mergeLocalProgress('u1', {
      completeLesson: async () => true,
      logAttempts: async (userId, opts, attempts) => logAttempts(userId, opts, attempts, db),
    });
    const after = attemptFromCompletions(await countCompletedRuns('u1', { level: 'a1.1', lektionId: 'l02', completed: true }, db));
    assert.equal(after, before, `n=${n}: the attempt changed across the merge`);
  }
});

test('a run whose answers are gone still merges as a run — the count never depends on the answers', () => {
  // Exactly the store the SHIPPED code writes: runs counted, attempts untagged.
  const plans = planLocalMerge({
    level: 'a1.1',
    lektionen: { l03: { status: 'complete', accuracy: 0.5, runs: 3 } },
    attempts: [{ lektionId: 'l03', itemId: 'x', stage: 'practice', correct: false, errorTag: 'WRONG' }],
  });
  assert.equal(plans.length, 1);
  assert.equal(plans[0].batches.length, 3, 'three runs, three batches');
  assert.deepEqual(plans[0].batches[0].attempts.map((a) => a.itemId), ['x'], 'the answers we have go in the first run');
  for (const b of plans[0].batches.slice(1)) {
    assert.equal(b.attempts.length, 1);
    assert.equal(b.attempts[0].itemId, RUN_MARKER_ITEM_ID);
    assert.equal(b.attempts[0].stage, RUN_MARKER_STAGE);
    assert.equal(b.attempts[0].correct, true, 'a marker is never a wrong answer');
    assert.equal(b.attempts[0].errorTag, null, 'a marker seeds no review card and no error report');
  }
  assert.equal(new Set(plans[0].batches.map((b) => b.createdAt)).size, 3, 'the stamps are distinct');
});

test('the per-Lektion cap drops whole runs, never the newest, and never a run count', () => {
  reset();
  const big = Math.ceil(MAX_ATTEMPTS_PER_LEKTION / 2) + 5;
  for (let i = 0; i < 3; i += 1) recordLocalLesson({ level: 'a1.1', lektionId: 'l04', attempts: runAttempts(big) });
  const store = readLocalProgress();
  assert.equal(store.lektionen.l04.runs, 3, 'the counter is never trimmed');
  const kept = new Set(store.attempts.filter((a) => a.lektionId === 'l04').map((a) => a.run));
  assert.ok(kept.has(3), 'the newest run is kept');
  assert.ok(!kept.has(1), 'the oldest run is dropped whole');
  const plans = planLocalMerge(store);
  assert.equal(plans[0].batches.length, 3, 'a trimmed run is still a run');
});

test('a second Lektion does not evict the first (the cap is per Lektion)', () => {
  reset();
  const big = MAX_ATTEMPTS_PER_LEKTION - 1;
  recordLocalLesson({ level: 'a1.1', lektionId: 'l05', attempts: runAttempts(big) });
  recordLocalLesson({ level: 'a1.1', lektionId: 'l06', attempts: runAttempts(big) });
  const store = readLocalProgress();
  assert.equal(store.attempts.filter((a) => a.lektionId === 'l05').length, big);
  assert.equal(store.attempts.filter((a) => a.lektionId === 'l06').length, big);
});

test('signed out, one completed run moves the learner to attempt 2 and the cycle wraps', () => {
  reset();
  assert.equal(attemptFromCompletions(localRunCount('a1.1', 'l07')), 1, 'a first visit is attempt 1');
  recordLocalLesson({ level: 'a1.1', lektionId: 'l07', attempts: runAttempts(7) });
  assert.equal(localRunCount('a1.1', 'l07'), 1, 'exactly one increment per completed run');
  assert.equal(attemptFromCompletions(localRunCount('a1.1', 'l07')), 2);
  recordLocalLesson({ level: 'a1.1', lektionId: 'l07', attempts: runAttempts(7) });
  assert.equal(attemptFromCompletions(localRunCount('a1.1', 'l07')), 3);
  recordLocalLesson({ level: 'a1.1', lektionId: 'l07', attempts: runAttempts(7) });
  assert.equal(localRunCount('a1.1', 'l07'), ATTEMPT_CYCLE);
  assert.equal(attemptFromCompletions(localRunCount('a1.1', 'l07')), 1, 'the cycle wraps, it does not grow');
});

test('the player reads the count at mount, merges before counting, and never holds the attempt', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(src, /attemptFromCompletions\(localRunCount\(/, 'signed out the attempt comes from the local run count');
  assert.match(src, /countCompletedRuns\(/, 'signed in it comes from the completed runs');
  assert.ok(
    src.indexOf('mergeLocalProgress(user.id)') < src.indexOf('countCompletedRuns('),
    'the merge must run before the count, or the count is the pre-merge one',
  );
  assert.ok(!/useState\(1\)[^\n]*attempt/i.test(src), 'the attempt is never a constant');
});

test('every production caller of buildLesson passes a derived attempt — no constant anywhere in src/', () => {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name));
      else if (/\.(js|jsx)$/.test(entry.name)) files.push(join(dir, entry.name));
    }
  };
  walk('src');
  let callers = 0;
  for (const rel of files) {
    const src = read(rel);
    for (const m of src.matchAll(/\b(?:buildLesson|planPractice)\(\s*\{([^}]*)\}/g)) {
      const args = m[1];
      if (!/attempt/.test(args)) continue;
      callers += 1;
      assert.ok(
        !/attempt:\s*\d/.test(args),
        `${rel} passes a constant attempt to the lesson engine — it must be derived (attemptFromCompletions)`,
      );
    }
    // A held DRAW attempt is the original bug; only the derived setter may
    // exist. Scoped to the files that actually talk to the lesson engine — an
    // unrelated useState(0) for answer attempts in a stage component is not
    // this number.
    if (!/buildLesson|attemptFromCompletions/.test(src)) continue;
    const held = src.match(/const \[attempt,\s*([A-Za-z]*)\] = useState\(/);
    if (held) {
      assert.ok(held[1], `${rel}: an attempt state without a setter is the round-9 bug`);
      assert.match(src, /attemptFromCompletions\(/, `${rel}: the attempt must be derived, not invented`);
    }
  }
  assert.ok(callers >= 1, 'no buildLesson call site found — the guard would be vacuous');
});
