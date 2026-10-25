// A checkpoint in progress survives a page load (2026-10-25 cross-check, LSN-10). Lessons resume
// after any page load (runState.js, a 7-day snapshot); checkpoints — the transfer measure the course
// standard leans on — kept phase, position and answers in React state only, so a reload, an iOS tab
// discard, the idle sign-out or a guard remount sent the learner back to the intro of a 20-item paper.
// The checkpoint run is now kept the way a Lektion run is, and the result clears it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  CHECKPOINT_RUN_PREFIX, RUN_MAX_AGE_MS, RUN_VERSION, checkpointRunFits, checkpointRunKey, clearCheckpointRun,
  packCheckpointRun, paperFingerprint, readCheckpointRun, saveCheckpointRun, unpackCheckpointRun,
} from '../src/lib/lesson/runState.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const CP = CURRICULUM_A11.checkpoints[0];
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const paper = (round) => buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: CP, pool, seed: paperSeed(CP, round) });

function withStorage(fn) {
  const map = new Map();
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const prev = globalThis.window;
  globalThis.window = { localStorage: { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) } };
  try { return fn(map); } finally { if (had) globalThis.window = prev; else delete globalThis.window; }
}

test('a checkpoint snapshot round-trips the run and refuses what must not resume', () => {
  const items = paper(1);
  const answers = { [items[0].id]: items[0].answer, [items[1].id]: 'falsch' };
  const run = packCheckpointRun({ round: 1, index: 2, answers, notHeard: [items[0].id], phase: 'run' }, NOW);
  assert.equal(run.v, RUN_VERSION);
  assert.deepEqual(unpackCheckpointRun(JSON.parse(JSON.stringify(run)), NOW + 1000), run);
  assert.deepEqual(unpackCheckpointRun({ ...run, phase: 'sectionFeedback' }, NOW).phase, 'sectionFeedback');
  for (const phase of ['intro', 'result', 'x']) assert.equal(unpackCheckpointRun({ ...run, phase }, NOW), null, `${phase} is not a paper in progress`);
  assert.equal(unpackCheckpointRun(run, NOW + RUN_MAX_AGE_MS + 1), null, 'older than a week starts fresh, like a Lektion');
  assert.equal(unpackCheckpointRun({ ...run, v: RUN_VERSION + 1 }, NOW), null);
  for (const junk of [null, 'x', 42, []]) assert.equal(unpackCheckpointRun(junk, NOW), null);
  const odd = packCheckpointRun({ round: -2, index: 'x', answers: [], notHeard: 'no', phase: 'result' }, NOW);
  assert.deepEqual([odd.round, odd.index, odd.answers, odd.notHeard, odd.phase], [0, 0, {}, [], 'run']);
});

test('a snapshot resumes only the paper its round still rebuilds, and only while it is the current one', () => {
  const items = paper(1);
  assert.equal(paperFingerprint(paper(1)), paperFingerprint(items), 'a round rebuilds the same paper');
  assert.notEqual(paperFingerprint(paper(0)), paperFingerprint(items), 'another round is another paper (the item ids alone are positions)');
  assert.deepEqual(paper(0).map((i) => i.id), items.map((i) => i.id), '…which is why the ids cannot tell them apart');
  const run = packCheckpointRun({ paper: paperFingerprint(items), round: 1, index: 3, answers: { [items[0].id]: 'x', [items[1].id]: 'y', [items[2].id]: 'z' } }, NOW);
  assert.equal(checkpointRunFits(run, items, 1), true, 'the paper in progress');
  assert.equal(checkpointRunFits(run, items, 0), true, 'an earlier attempt aged out of the window');
  assert.equal(checkpointRunFits(run, items, 2), false, 'a paper from before a finished attempt is never resumed');
  assert.equal(checkpointRunFits(run, paper(0), 0), false, 'another paper (a changed pool) is never resumed');
  assert.equal(checkpointRunFits({ ...run, paper: '' }, items, 0), false, 'a snapshot without a fingerprint is not trusted');
  const changed = items.map((i, k) => (k === 5 ? { ...i, answer: `${i.answer} (neu)` } : i));
  assert.equal(checkpointRunFits(run, changed, 0), false, 'one changed item is a changed paper');
  assert.equal(checkpointRunFits({ ...run, index: items.length }, items, 0), false);
  assert.equal(checkpointRunFits({ ...run, notHeard: ['gone'] }, items, 0), false);
  assert.equal(checkpointRunFits({ ...run, answers: { gone: 'x' } }, items, 0), false);
  assert.equal(checkpointRunFits(run, [], 0), false, 'no paper, no resume');
  assert.equal(checkpointRunFits(null, items, 0), false);
});

test('save / read / clear: one key per level, checkpoint and owner; the newer of owner and guest wins', () => {
  withStorage((map) => {
    const run = packCheckpointRun({ round: 0, index: 4, answers: { a: 'b' } }, NOW - 60000);
    assert.equal(saveCheckpointRun('A1.1', CP.id, run, 'user-a'), true);
    assert.ok(map.has(checkpointRunKey('a1.1', CP.id, 'user-a')), 'the level is lower-cased');
    assert.ok(checkpointRunKey('a1.1', CP.id).startsWith(CHECKPOINT_RUN_PREFIX));
    assert.ok(!checkpointRunKey('a1.1', CP.id).startsWith('dm_lesson_run:'), 'never a Lektion run key');
    assert.deepEqual(readCheckpointRun('a1.1', CP.id, NOW, 'user-a'), run);
    assert.equal(readCheckpointRun('a1.1', CP.id, NOW, 'user-b'), null, 'another learner on the same browser never gets it');
    assert.equal(readCheckpointRun('a1.1', CP.id, NOW, null), null, 'nor does a guest');
    assert.equal(readCheckpointRun('a1.1', 'a1.1-cp2', NOW, 'user-a'), null, 'another checkpoint has its own run');
    const guest = packCheckpointRun({ round: 0, index: 7, answers: { a: 'b', c: 'd' } }, NOW - 1000);
    saveCheckpointRun('a1.1', CP.id, guest);
    assert.equal(readCheckpointRun('a1.1', CP.id, NOW, 'user-a').index, 7, 'signed in after a newer guest sitting: the newer run');
    clearCheckpointRun('a1.1', CP.id, 'user-a');
    assert.equal(readCheckpointRun('a1.1', CP.id, NOW, 'user-a'), null, 'the result clears the owner and the guest copy');
  });
  assert.equal(readCheckpointRun('a1.1', CP.id, NOW, 'user-a'), null, 'no storage at all is a fresh paper');
});

// ── The page's own code ────────────────────────────────────────────────────────────────────────
const PAGE = read('src/pages/lesson/CheckpointPage.jsx');
const RESTORE_DEPS = '[restoreDone, curriculum, checkpoint, pool, attempts, level, owner]';
const SAVE_DEPS = '[restoreDone, phase, paper, items.length, round, index, answers, notHeard, level, checkpoint, owner]';

/** The arrow function of the page effect that contains `marker` and ends at `deps`. */
function effectSource(marker, deps) {
  const at = PAGE.indexOf(marker);
  assert.ok(at >= 0, `the page has: ${marker}`);
  const start = PAGE.lastIndexOf('useEffect(', at) + 'useEffect('.length;
  const end = PAGE.indexOf(`}, ${deps});`, start);
  assert.ok(end > start, `…ending at ${deps}`);
  return PAGE.slice(start, end + 1);
}

/** Run the restore effect once against `state`; returns what it set. */
function runRestore(state) {
  const set = {};
  const record = (name) => (v) => { set[name] = v; };
  const context = vm.createContext({
    curriculum: CURRICULUM_A11, checkpoint: CP, pool, level: 'a1.1', owner: null, restoreDone: false, attempts: null, ...state,
    readCheckpointRun, checkpointRunFits, clearCheckpointRun, buildCheckpoint, paperSeed, Date, Set,
    setRound: record('round'), setAnswers: record('answers'), setNotHeard: record('notHeard'), setIndex: record('index'),
    setPhase: record('phase'), setRestoreDone: record('restoreDone'),
  });
  vm.runInContext(`(${effectSource('const run = readCheckpointRun(level, checkpoint.id, Date.now(), owner);', RESTORE_DEPS)})()`, context);
  return set;
}

/** Run the save effect once against `state`; returns the storage writes it made. */
function runSave(state) {
  const writes = [];
  const context = vm.createContext({
    restoreDone: true, checkpoint: CP, items: paper(0), level: 'a1.1', owner: null, phase: 'run', paper: paperFingerprint(paper(0)),
    round: 0, index: 0, answers: {}, notHeard: new Set(), ...state,
    packCheckpointRun,
    saveCheckpointRun: (level, id, run, owner) => writes.push({ op: 'save', owner, run }),
    clearCheckpointRun: (level, id, owner) => writes.push({ op: 'clear', owner }),
  });
  vm.runInContext(`(${effectSource('if (phase === \'run\' || phase === \'sectionFeedback\') {', SAVE_DEPS)})()`, context);
  return writes;
}

test('restoring waits for the attempt count only when a snapshot exists, and then decides once (cross-check review)', () => {
  withStorage(() => {
    // Nothing stored: the decision is immediate — Start need not wait for the attempt count.
    assert.deepEqual(runRestore({}), { restoreDone: true });
    // A snapshot of the current paper: nothing is decided until the count is in…
    const items = paper(1);
    const answers = { [items[0].id]: items[0].answer, [items[1].id]: 'x' };
    saveCheckpointRun('a1.1', CP.id, packCheckpointRun({ paper: paperFingerprint(items), round: 1, index: 2, answers, phase: 'run' }, Date.now()));
    assert.deepEqual(runRestore({ attempts: null }), {}, 'Start stays disabled and nothing is set while the count loads');
    // …then the run comes back where it was.
    const restored = runRestore({ attempts: { used: 1 } });
    assert.deepEqual([restored.round, restored.index, restored.phase, restored.restoreDone], [1, 2, 'run', true]);
    assert.deepEqual(restored.answers, answers);
    // A snapshot that does not fit is dropped, and the decision is made all the same.
    assert.deepEqual(runRestore({ attempts: { used: 2 } }), { restoreDone: true }, 'a paper from before a finished attempt');
    assert.equal(readCheckpointRun('a1.1', CP.id, Date.now(), null), null, 'and it is gone from storage');
    assert.deepEqual(runRestore({ restoreDone: true, attempts: { used: 0 } }), {}, 'decided once');
  });
});

test('nothing is saved before the restore decision, so a fast Start can never overwrite the saved run (cross-check review)', () => {
  assert.deepEqual(runSave({ restoreDone: false, phase: 'run', index: 0 }), [], 'a fresh paper at index 0 is not written over the run being restored');
  assert.deepEqual(runSave({ restoreDone: false, phase: 'result' }), [], 'nor is it cleared');
  const writes = runSave({ restoreDone: true, phase: 'run', index: 3, answers: { a: 'b' } });
  assert.equal(writes.length, 1);
  assert.deepEqual([writes[0].op, writes[0].run.index, writes[0].run.answers], ['save', 3, { a: 'b' }]);
  assert.deepEqual(runSave({ restoreDone: true, phase: 'result' }).map((w) => w.op), ['clear'], 'the result clears it');
  assert.deepEqual(runSave({ restoreDone: true, phase: 'intro' }), [], 'the intro saves nothing');
  // Start itself waits for the decision.
  assert.match(PAGE, /<Button disabled=\{!items\.length \|\| !restoreDone \|\| Boolean\(attempts\?\.blocked\)\} onClick=\{\(\) => \{ setRound\(attempts\?\.used \|\| 0\);/);
  assert.match(PAGE, /\{\(!items\.length \|\| !restoreDone\) && <p className="mt-2 text-sm text-graphite">\{t\('checkpoint\.loadingItems', lang\)\}<\/p>\}/);
});

test('a paper belongs to one owner: it mounts after auth settles, keyed by the owner, so a sign-out never saves it under the guest key (cross-check review)', () => {
  // The wrapper: waits for auth, renders the paper keyed by its owner, and touches no snapshot itself.
  const wrapper = PAGE.slice(PAGE.indexOf('export default function CheckpointPage('), PAGE.indexOf('function CheckpointRun('));
  assert.match(wrapper, /const \{ user, loading \} = useAuth\(\);/);
  assert.match(wrapper, /if \(loading\) \{\s*return \(/, 'nothing of the paper renders before the owner is known');
  assert.match(wrapper, /return <CheckpointRun key=\{user\?\.id \|\| 'guest'\} \/>;/, 'a new owner is a new mount');
  assert.doesNotMatch(wrapper, /readCheckpointRun\(|saveCheckpointRun\(|clearCheckpointRun\(|useState\(/, 'the wrapper holds no paper state');
  // Inside the boundary the owner is the mount's: every read and write uses it.
  const paperRun = PAGE.slice(PAGE.indexOf('function CheckpointRun('));
  assert.match(paperRun, /const \{ user \} = useAuth\(\);\s*\/\/[^\n]*\n\s*const owner = user \? user\.id : null;/);
  for (const call of ['readCheckpointRun(level, checkpoint.id, Date.now(), owner)', 'clearCheckpointRun(level, checkpoint.id, owner)']) {
    assert.ok(paperRun.includes(call), call);
  }
  assert.match(paperRun, /saveCheckpointRun\(level, checkpoint\.id, packCheckpointRun\(\{ paper, round, index, answers, notHeard: \[\.\.\.notHeard\], phase \}\), owner\);/);
  // What the guest's own mount does on arrival: it starts at the intro with nothing restored yet, so its
  // save effect writes nothing — the previous account's answers have no way into the guest key.
  withStorage((map) => {
    saveCheckpointRun('a1.1', CP.id, packCheckpointRun({ paper: paperFingerprint(paper(0)), round: 0, index: 12, answers: { a: 'x' } }, Date.now()), 'user-a');
    assert.deepEqual(runSave({ restoreDone: false, phase: 'intro', owner: null }), []);
    assert.equal(map.has(checkpointRunKey('a1.1', CP.id)), false, 'no guest snapshot was written');
    assert.equal(readCheckpointRun('a1.1', CP.id, Date.now(), null), null, 'a guest reload resumes nothing');
    assert.equal(readCheckpointRun('a1.1', CP.id, Date.now(), 'user-b'), null, 'nor does the next account');
  });
  assert.match(PAGE, /setRound\(attempts\?\.used \|\| 0\)/, 'a fresh Start still draws this window\'s next paper');
});
