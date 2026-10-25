// A finished checkpoint paper survives a reload until it is saved (2026-10-25 cross-check, REG MEDIUM).
// A signed-in learner who finished a paper offline lost it: the result phase cleared the run snapshot
// at once, recordAttempt failed, and the finished attempt lived only in the page's memory — a reload
// took the answers and the pass, and the checkpoint had to be taken again. Now the finished paper is
// kept on the device (per account, with its stable stamp) BEFORE any network write, comes back as its
// result after a reload, is sent again on arrival and when the connection returns, and is dropped only
// once every write landed. Run here as the page's own code (its save, finish, snapshot, restore and
// flush) against the real service, the real run store and a database that can go offline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { supabase } from '../src/utils/supabase.js';
import * as runState from '../src/lib/lesson/runState.js';
import { buildCheckpoint, paperSeed, remediationSet, scoreCheckpoint } from '../src/lib/checkpoint/buildCheckpoint.js';
import { fetchAttemptState, guestPassKept, recordAttempt } from '../src/services/checkpointService.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

// A namespace import, so the page's behaviour is what fails on a tree without the store, not the import.
const {
  CHECKPOINT_DONE_MAX_AGE_MS, checkpointDoneKey, checkpointRunFits, clearCheckpointRun, dropFinishedPaper, keepFinishedPaper,
  packCheckpointRun, packFinishedPaper, paperFingerprint, readCheckpointRun, readFinishedPapers, saveCheckpointRun,
} = runState;
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const PAGE = read('src/pages/lesson/CheckpointPage.jsx');
const CP = CURRICULUM_A11.checkpoints[0];
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const PAPER = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: CP, pool, seed: paperSeed(CP, 0) });
const RIGHT = Object.fromEntries(PAPER.map((item) => [item.id, item.answer]));
const WRONG = Object.fromEntries(PAPER.map((item) => [item.id, 'völlig falsch']));

/** localStorage; `refuse(key)` makes a write to that key throw QuotaExceededError, as a full store does. */
function withStorage(refuse = () => false) {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (k) => (values.has(k) ? values.get(k) : null),
    setItem: (k, v) => {
      if (refuse(k)) throw new DOMException(`Setting the value of '${k}' exceeded the quota.`, 'QuotaExceededError');
      values.set(k, String(v));
    },
    removeItem: (k) => { values.delete(k); },
  } };
  return values;
}

/** A database that can drop off the network: offline, every call answers with an error. */
function database() {
  const db = { online: false, attempts: [], progress: [], program: [] };
  const offline = { data: null, error: { message: 'TypeError: Failed to fetch' } };
  supabase.from = (table) => {
    const filters = [];
    const query = {
      select: () => query,
      eq: (k, v) => { filters.push((r) => r[k] === v); return query; },
      gte: (k, v) => { filters.push((r) => r[k] >= v); return query; },
      order: () => query,
      insert: async (rows) => {
        if (!db.online) return offline;
        db.attempts.push(...rows);
        return { error: null };
      },
      upsert: async (row) => {
        if (!db.online) return offline;
        (table === 'lesson_progress' ? db.progress : db.program).push(row);
        return { error: null };
      },
      then: (resolve) => resolve(db.online ? { data: db.attempts.filter((r) => filters.every((f) => f(r))), error: null } : offline),
    };
    return query;
  };
  return db;
}

// ── The page's own code, sliced out and run against one mount's state ───────────────────────────
function slice(startMarker, endPattern) {
  const start = PAGE.indexOf(startMarker);
  assert.ok(start >= 0, `the page has: ${startMarker}`);
  const m = endPattern.exec(PAGE.slice(start));
  assert.ok(m, `…ending at ${endPattern}`);
  return PAGE.slice(start, start + m.index);
}
const callback = (name, endPattern) => slice(`const ${name} = useCallback(`, endPattern).slice(`const ${name} = useCallback(`.length);
const effect = (marker, deps) => {
  const at = PAGE.indexOf(marker);
  assert.ok(at >= 0, `the page has: ${marker}`);
  const start = PAGE.lastIndexOf('useEffect(', at) + 'useEffect('.length;
  const end = PAGE.indexOf(`}, ${deps});`, start);
  assert.ok(end > start, `…ending at ${deps}`);
  return PAGE.slice(start, end + 1);
};
const SAVE = () => callback('save', /\}, \[user, (?:owner, )?checkpoint, level\]\);/) + '}';
const FINISH = () => callback('finish', /,\s*\[scoredItems[^\]]*\],\s*\);/);
const RESTORE = () => effect('const run = readCheckpointRun(level, checkpoint.id, Date.now(), owner);', '[restoreDone, curriculum, checkpoint, pool, attempts, level, owner]');
const SNAPSHOT = () => effect("if (phase === 'run' || phase === 'sectionFeedback') {", '[restoreDone, phase, paper, items.length, round, index, answers, notHeard, level, checkpoint, owner]');
const FLUSH = () => effect("window.addEventListener('online', flush);", '[restoreDone, owner, pool, curriculum, checkpoint, level, save]');
const HELPER = () => {
  const start = PAGE.indexOf('function finishedPaperItems(');
  return start < 0 ? 'function finishedPaperItems() { return null; }' : PAGE.slice(start, PAGE.indexOf('\n}\n', start) + 2);
};

/** One mount of CheckpointRun for `owner` (null: a guest), with its state as plain variables. */
function mount(owner) {
  const listeners = {};
  const ctx = vm.createContext({
    user: owner ? { id: owner } : null, owner, level: 'a1.1', curriculum: CURRICULUM_A11, checkpoint: CP, pool,
    phase: 'intro', round: 0, index: 0, answers: {}, notHeard: new Set(), attempts: null, restoreDone: false, saveState: null, remediation: [],
    items: PAPER, scoredItems: PAPER, paper: paperFingerprint(PAPER),
    saveRef: { current: null }, sending: { current: new Set() }, unsaved: { current: false },
    readCheckpointRun, checkpointRunFits, clearCheckpointRun, saveCheckpointRun, packCheckpointRun, paperFingerprint,
    readFinishedPapers, keepFinishedPaper, dropFinishedPaper, packFinishedPaper,
    buildCheckpoint, paperSeed, remediationSet, scoreCheckpoint, recordAttempt, guestPassKept, fetchAttemptState,
    Date, Set, Promise,
    window: { addEventListener: (type, fn) => { listeners[type] = fn; }, removeEventListener: (type) => { delete listeners[type]; } },
  });
  for (const name of ['phase', 'round', 'index', 'answers', 'notHeard', 'attempts', 'restoreDone', 'saveState', 'remediation']) {
    ctx[`set${name[0].toUpperCase()}${name.slice(1)}`] = (v) => { ctx[name] = v; };
  }
  vm.runInContext(HELPER(), ctx);
  ctx.save = vm.runInContext(`(${SAVE()})`, ctx);
  return {
    ctx,
    listeners,
    finish: (answers) => { ctx.answers = answers; vm.runInContext(`(${FINISH()})`, ctx)(answers); },
    snapshot: () => vm.runInContext(`(${SNAPSHOT()})()`, ctx),
    restore: () => vm.runInContext(`(${RESTORE()})()`, ctx),
    flush: () => vm.runInContext(`(${FLUSH()})()`, ctx),
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const quiet = async (fn) => {
  const error = console.error;
  console.error = () => {};
  try { return await fn(); } finally { console.error = error; }
};

test('a paper finished offline is kept before the writes, comes back after a reload, and is dropped only once saved', () => quiet(async () => {
  const original = supabase.from;
  try {
    const values = withStorage();
    const db = database();
    // The paper is in progress, then finished offline.
    const first = mount('u1');
    first.ctx.restoreDone = true;
    first.ctx.phase = 'run';
    first.snapshot();
    first.finish(RIGHT);
    first.snapshot();
    await settle();
    assert.equal(first.ctx.saveState, 'failed', 'the account write failed, and says so');
    assert.equal(readCheckpointRun('a1.1', CP.id, Date.now(), 'u1'), null, 'the run snapshot is gone with the result');
    const stamp = first.ctx.saveRef.current.stamp;

    // A reload, still offline: the result comes back, and is sent again.
    const second = mount('u1');
    second.restore();
    assert.equal(second.ctx.phase, 'result', 'the result, not the intro of a paper to take again');
    assert.deepEqual(second.ctx.answers, RIGHT);
    assert.equal(second.ctx.restoreDone, true);
    assert.equal(second.ctx.saveRef.current.stamp, stamp, 'the same stamp: a retry never counts a second attempt');
    const kept = readFinishedPapers('a1.1', CP.id, Date.now(), 'u1');
    assert.equal(kept.length, 1, 'the finished paper is kept on this device');
    assert.deepEqual([kept[0].stamp, kept[0].answers, kept[0].result.passed], [stamp, RIGHT, true], 'with its answers, its outcome and its stamp');
    assert.equal(readFinishedPapers('a1.1', CP.id, Date.now(), 'u2').length, 0, 'under this account only');
    second.flush();
    await settle();
    assert.equal(second.ctx.saveState, 'failed');
    assert.equal(readFinishedPapers('a1.1', CP.id, Date.now(), 'u1').length, 1, 'a failed send keeps it');
    assert.equal(typeof second.listeners.online, 'function', 'it waits for the connection');

    // Another account on this browser gets none of it.
    const other = mount('u2');
    other.restore();
    assert.equal(other.ctx.phase, 'intro');

    // The connection returns: every write lands, and only then is it dropped.
    db.online = true;
    second.listeners.online();
    await settle();
    assert.equal(second.ctx.saveState, 'saved');
    assert.equal(readFinishedPapers('a1.1', CP.id, Date.now(), 'u1').length, 0);
    assert.equal(values.has(checkpointDoneKey('a1.1', CP.id, 'u1')), false);
    const summary = db.attempts.filter((r) => r.item_id === CP.id);
    assert.deepEqual(summary.map((r) => [r.created_at, r.correct]), [[stamp, true]], 'one summary row, under the paper\'s stamp');
    assert.deepEqual(db.progress.map((r) => [r.lektion_id, r.status]), [[CP.id, 'complete']], 'and the completion');
    const local = JSON.parse(values.get('dm_checkpoint_attempts'))[CP.id];
    assert.equal(local.length, 1, 'the retries counted no second attempt on this device');
  } finally {
    supabase.from = original;
  }
}));

test('a retake after a failed paper keeps the paper before it, and both are sent when the connection returns', () => quiet(async () => {
  const original = supabase.from;
  try {
    withStorage();
    const db = database();
    const page = mount('u1');
    page.ctx.restoreDone = true;
    page.finish(WRONG);
    await settle();
    const failedStamp = page.ctx.saveRef.current.stamp;
    // The retake: a new paper, finished offline as well (the first stays on the device).
    page.ctx.saveRef.current = null;
    await new Promise((resolve) => setTimeout(resolve, 5));
    page.finish(RIGHT);
    await settle();
    const stamps = readFinishedPapers('a1.1', CP.id, Date.now(), 'u1').map((e) => e.stamp);
    assert.deepEqual(stamps, [failedStamp, page.ctx.saveRef.current.stamp], 'both papers wait');
    // A reload shows the newest; the flush sends both once online.
    const reload = mount('u1');
    reload.restore();
    assert.deepEqual(reload.ctx.answers, RIGHT);
    db.online = true;
    reload.flush();
    await settle();
    assert.equal(readFinishedPapers('a1.1', CP.id, Date.now(), 'u1').length, 0);
    assert.deepEqual(db.attempts.filter((r) => r.item_id === CP.id).map((r) => r.correct).sort(), [false, true]);
  } finally {
    supabase.from = original;
  }
}));

// When the finished paper's own write is refused (QuotaExceededError on its key), the run snapshot is
// the only copy left on the device: it must stay — stamped with the paper — and the card must offer a
// retry instead of "Not saved to your account yet" over a result a reload would lose (Codex re-check).
test('a finished paper the browser refused to store keeps its run snapshot, comes back after a reload, and is saved under one stamp', () => quiet(async () => {
  const original = supabase.from;
  try {
    let full = true;
    const values = withStorage((key) => full && key.startsWith('dm_checkpoint_done:'));
    const db = database();
    const last = PAPER[PAPER.length - 1].id;
    const first = mount('u1');
    first.ctx.restoreDone = true;
    first.ctx.phase = 'run';
    first.ctx.index = PAPER.length - 1;
    first.ctx.answers = Object.fromEntries(Object.entries(RIGHT).filter(([id]) => id !== last));
    first.snapshot();
    first.finish(RIGHT);
    first.snapshot();
    await settle();
    assert.equal(readFinishedPapers('a1.1', CP.id, Date.now(), 'u1').length, 0, 'the finished paper was refused');
    assert.equal(first.ctx.saveState, 'localFailed', 'stored nowhere: the card says so, with its retry');
    const stamp = first.ctx.saveRef.current.stamp;
    const run = readCheckpointRun('a1.1', CP.id, Date.now(), 'u1');
    assert.ok(run, 'the run snapshot was not dropped');
    assert.deepEqual([run.answers, run.stamp], [RIGHT, stamp], 'it holds every answer, and the paper\'s stamp');

    // A reload (offline, so the attempt count comes from this device): the result, under that stamp.
    const second = mount('u1');
    second.ctx.attempts = await fetchAttemptState('u1', CP.id);
    second.restore();
    assert.equal(second.ctx.phase, 'result', 'not a paper to take again');
    assert.deepEqual(second.ctx.answers, RIGHT);
    assert.equal(second.ctx.saveRef.current.stamp, stamp);
    // Storage has room again and the connection is back: one summary row, then nothing left over.
    full = false;
    db.online = true;
    second.flush();
    await settle();
    assert.equal(second.ctx.saveState, 'saved');
    assert.deepEqual(db.attempts.filter((r) => r.item_id === CP.id).map((r) => r.created_at), [stamp]);
    assert.equal(readCheckpointRun('a1.1', CP.id, Date.now(), 'u1'), null);
    assert.equal(readFinishedPapers('a1.1', CP.id, Date.now(), 'u1').length, 0);
    assert.equal(JSON.parse(values.get('dm_checkpoint_attempts'))[CP.id].length, 1, 'one attempt counted on this device');
  } finally {
    supabase.from = original;
  }
}));

test('a refused finished-paper write with the account reachable is saved and leaves nothing behind', () => quiet(async () => {
  const original = supabase.from;
  try {
    withStorage((key) => key.startsWith('dm_checkpoint_done:'));
    const db = database();
    db.online = true;
    const page = mount('u1');
    page.ctx.restoreDone = true;
    page.finish(RIGHT);
    await settle();
    assert.equal(page.ctx.saveState, 'saved');
    assert.equal(readCheckpointRun('a1.1', CP.id, Date.now(), 'u1'), null);
  } finally {
    supabase.from = original;
  }
}));

test('the finished-paper store: once per stamp, per account, shape-checked and aged like the Lektion outbox', () => {
  const values = withStorage();
  const now = Date.UTC(2026, 9, 21, 9);
  const entry = packFinishedPaper({ stamp: 's1', paper: 'abcd', round: 2, answers: { a: 'x' }, notHeard: ['b', 7], result: { passed: 1, overall: '80' } }, now);
  assert.deepEqual([entry.round, entry.notHeard, entry.result], [2, ['b'], { passed: true, overall: 80 }]);
  assert.equal(keepFinishedPaper('A1.1', CP.id, entry, 'u1'), true);
  assert.equal(keepFinishedPaper('a1.1', CP.id, { ...entry, answers: { a: 'changed' } }, 'u1'), true, 'kept once');
  assert.deepEqual(readFinishedPapers('a1.1', CP.id, now, 'u1').map((e) => e.answers), [{ a: 'x' }]);
  assert.equal(keepFinishedPaper('a1.1', CP.id, entry, null), false, 'a guest has no account store');
  assert.deepEqual(readFinishedPapers('a1.1', CP.id, now, null), []);
  assert.deepEqual(readFinishedPapers('a1.1', CP.id, now + CHECKPOINT_DONE_MAX_AGE_MS + 1, 'u1'), [], 'a month on, it is not sent');
  values.set(checkpointDoneKey('a1.1', CP.id, 'u1'), JSON.stringify([null, 'x', { v: 1, savedAt: now, stamp: '' }, entry]));
  assert.equal(readFinishedPapers('a1.1', CP.id, now, 'u1').length, 1, 'junk is skipped, never thrown');
  dropFinishedPaper('a1.1', CP.id, 's1', 'u1');
  assert.equal(values.has(checkpointDoneKey('a1.1', CP.id, 'u1')), false);
});
