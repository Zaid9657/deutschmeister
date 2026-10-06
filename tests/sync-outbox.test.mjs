// A finished Lektion is never lost and never counted twice (2026-10 review, "saving and recovery").
//
// The recap used to fire three writes without awaiting them; a failed one was a console line and
// the learner was told nothing. The contract pinned here (src/lib/course/syncOutbox.js,
// src/services/lessonService.js, src/lib/course/localProgress.js):
//   - the run is stored on the device BEFORE the network is touched;
//   - each of the three writes is retried until it succeeds, and a step that succeeded is never
//     run again (a lost response must not become a second "completed run");
//   - a guest merge clears the guest store only when every write succeeded;
//   - a weaker repeat never takes a Gold away, signed in or out;
//   - explain and read-aloud rows are not completed runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const map = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  },
};

const { OUTBOX_KEY, OUTBOX_MAX_AGE_DAYS, enqueueRun, flushOutbox, pendingRuns } = await import('../src/lib/course/syncOutbox.js');
const { LOCAL_KEY, mergeLocalProgress, readLocalProgress, recordLocalLesson } = await import('../src/lib/course/localProgress.js');
const { countCompletedRuns, logAttempts } = await import('../src/services/lessonService.js');

const STAMP = new Date().toISOString();
const run = (over = {}) => ({
  userId: 'u1', level: 'A1.1', lektionId: 'a1.1-l01', createdAt: STAMP, accuracy: 0.9, status: 'gold',
  attempts: [{ itemId: 'p1', stage: 'practice', pass: 'first', correct: true, errorTag: null, result: 'correct', typed: 'Hallo' }],
  ...over,
});

/** Writers that succeed or fail on cue, and count their calls. */
function writers(plan = {}) {
  const calls = { attempts: 0, progress: 0, cards: 0 };
  const outcome = (step) => {
    calls[step] += 1;
    const v = plan[step];
    if (typeof v === 'function') return v(calls[step]);
    return v === undefined ? true : v;
  };
  return {
    calls,
    deps: {
      logAttempts: async () => outcome('attempts'),
      completeLesson: async () => outcome('progress'),
      seedCards: async () => outcome('cards'),
    },
  };
}

const reset = () => map.clear();

test('the run is on the device before any write, and holds no learner text', () => {
  reset();
  const entry = enqueueRun(run());
  assert.equal(pendingRuns('u1').length, 1);
  assert.equal(entry.level, 'a1.1', 'levels are lower-cased at the boundary');
  assert.doesNotMatch(map.get(OUTBOX_KEY), /Hallo|typed/, 'only ids, stages and correctness are stored');
  assert.equal(enqueueRun(run()).key, entry.key, 'a second enqueue of the same run is a no-op');
  assert.equal(pendingRuns('u1').length, 1);
});

test('all three writes succeed → synced, and the outbox is empty', async () => {
  reset();
  enqueueRun(run());
  const { deps, calls } = writers();
  assert.deepEqual(await flushOutbox('u1', deps), { state: 'synced', failed: [] });
  assert.deepEqual(calls, { attempts: 1, progress: 1, cards: 1 });
  assert.equal(pendingRuns('u1').length, 0);
  assert.deepEqual(await flushOutbox('u1', deps), { state: 'idle', failed: [] }, 'nothing left to send');
});

test('a partial failure keeps the run with only the missing step; the retry never repeats a step that landed', async () => {
  reset();
  enqueueRun(run());
  const { deps, calls } = writers({ progress: (n) => n > 1 }); // the progress write fails once
  const first = await flushOutbox('u1', deps);
  assert.equal(first.state, 'failed');
  assert.deepEqual(first.failed[0].steps, ['progress']);
  assert.equal(pendingRuns('u1').length, 1, 'kept on this device');
  const second = await flushOutbox('u1', deps);
  assert.equal(second.state, 'synced');
  assert.deepEqual(calls, { attempts: 1, progress: 2, cards: 1 }, 'attempts and cards were written once');
});

test('a writer that throws is a failure to retry, not a crash and not a success', async () => {
  reset();
  enqueueRun(run());
  const { deps } = writers({ cards: () => { throw new Error('network'); } });
  const r = await flushOutbox('u1', deps);
  assert.deepEqual(r.failed[0].steps, ['cards']);
});

test('an entry belongs to its account and expires', async () => {
  reset();
  enqueueRun(run({ userId: 'u2' }));
  enqueueRun(run({ lektionId: 'a1.1-l02', createdAt: new Date(Date.now() - (OUTBOX_MAX_AGE_DAYS + 1) * 86400000).toISOString() }));
  const { deps, calls } = writers();
  assert.equal((await flushOutbox('u1', deps)).state, 'idle', "u1 neither sends u2's run nor an expired one");
  assert.equal(calls.attempts, 0);
  assert.equal(pendingRuns('u2').length, 1, "u2's run waits for u2");
  assert.equal((await flushOutbox(null, deps)).state, 'idle', 'signed out: nothing is sent');
});

test('two flushes at once share one pass — no step runs twice', async () => {
  reset();
  enqueueRun(run());
  const { deps, calls } = writers();
  const [a, b] = await Promise.all([flushOutbox('u1', deps), flushOutbox('u1', deps)]);
  assert.deepEqual(a, b);
  assert.deepEqual(calls, { attempts: 1, progress: 1, cards: 1 });
});

/** A Supabase stand-in for lesson_attempts: insert appends, select().eq()… filters. */
function fakeSupabase() {
  const rows = [];
  return {
    rows,
    from() {
      const q = {
        insert: async (batch) => { rows.push(...batch.map((r) => ({ ...r, created_at: r.created_at || new Date().toISOString() }))); return { error: null }; },
        select: () => q,
        eq: (col, val) => { q._f = [...(q._f || []), [col, val]]; return q; },
      };
      q.then = (resolve) => resolve({ data: rows.filter((r) => (q._f || []).every(([c, v]) => r[c] === v)), error: null });
      return q;
    },
  };
}

test('a stamped attempt batch is written once however often it is retried', async () => {
  const db = fakeSupabase();
  const opts = { level: 'a1.1', lektionId: 'a1.1-l01', createdAt: STAMP };
  const batch = [{ itemId: 'p1', stage: 'practice', correct: true }];
  assert.equal(await logAttempts('u1', opts, batch, db), true);
  assert.equal(await logAttempts('u1', opts, batch, db), true, 'the retry after a lost response reports success');
  assert.equal(db.rows.length, 1, 'and writes nothing');
  assert.equal(await countCompletedRuns('u1', { level: 'a1.1', lektionId: 'a1.1-l01' }, db), 1);
});

test('explain and read-aloud rows are not completed runs', async () => {
  const db = fakeSupabase();
  await logAttempts('u1', { level: 'a1.1', lektionId: 'a1.1-l01', createdAt: STAMP }, [{ itemId: 'p1', stage: 'practice', correct: true }], db);
  db.rows.push(
    { user_id: 'u1', level: 'a1.1', lektion_id: 'a1.1-l01', item_id: 'p2', stage: 'explain', created_at: '2026-10-06T10:00:00.000Z' },
    { user_id: 'u1', level: 'a1.1', lektion_id: 'a1.1-l01', item_id: 'l3', stage: 'readaloud', created_at: '2026-10-06T10:01:00.000Z' },
  );
  assert.equal(await countCompletedRuns('u1', { level: 'a1.1', lektionId: 'a1.1-l01' }, db), 1, 'one finished run, not three');
});

test('a guest merge with any failed write keeps the guest store; a clean merge clears it', async () => {
  map.delete(LOCAL_KEY);
  recordLocalLesson({ level: 'a1.1', lektionId: 'a1.1-l01', accuracy: 0.9, status: 'gold', attempts: [{ itemId: 'p1', stage: 'practice', correct: true }] });
  assert.equal(await mergeLocalProgress('u1', { completeLesson: async () => false, logAttempts: async () => true }), 0);
  assert.equal(readLocalProgress().level, 'a1.1', 'the progress row failed: nothing is thrown away');
  assert.equal(await mergeLocalProgress('u1', { completeLesson: async () => true, logAttempts: async () => false }), 0);
  assert.equal(readLocalProgress().level, 'a1.1', 'the attempt batch failed: nothing is thrown away');
  assert.equal(await mergeLocalProgress('u1', { completeLesson: async () => true, logAttempts: async () => true }), 1);
  assert.equal(readLocalProgress().level, null, 'cleared once everything landed');
});

test('a weaker repeat never takes a Gold away — on the device or in the account', () => {
  map.delete(LOCAL_KEY);
  recordLocalLesson({ level: 'a1.1', lektionId: 'a1.1-l01', accuracy: 0.9, status: 'gold' });
  recordLocalLesson({ level: 'a1.1', lektionId: 'a1.1-l01', accuracy: 0.5, status: 'complete' });
  const row = readLocalProgress().lektionen['a1.1-l01'];
  assert.deepEqual([row.status, row.accuracy, row.runs], ['gold', 0.9, 2], 'the better run is kept, the run still counted');
  const svc = read('src/services/lessonService.js');
  assert.match(svc, /const kept = betterRun\(stored, \{ status, accuracy \}\);/, 'completeLesson keeps the better run');
});

test('the recap stores the run before sending it, says where it is saved, and the course home sends what is waiting', () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  const enq = player.indexOf('enqueueRun({ userId: user.id');
  assert.ok(enq > 0 && enq < player.indexOf('flush();', enq), 'enqueue first, then flush');
  assert.doesNotMatch(player, /\blogAttempts\(|\bcompleteLesson\(|seedCardsForLektion\(/, 'no fire-and-forget write is left in the player');
  assert.match(player, /window\.addEventListener\('online', flush\)/, 'back online after a failure: sent again');
  const recap = read('src/components/lesson/RecapStage.jsx');
  assert.match(recap, /role="status"[\s\S]{0,300}t\(`sync\.\$\{sync\}`, lang\)/, 'the save state is announced in words');
  assert.match(read('src/pages/CurriculumHomePage.jsx'), /\.then\(\(\) => flushOutbox\(user\.id\)\)/, 'the course home sends waiting runs');
});
