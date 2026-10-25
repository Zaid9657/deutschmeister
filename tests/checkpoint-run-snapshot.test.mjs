// A checkpoint in progress survives a page load (2026-10-25 cross-check, LSN-10). Lessons resume
// after any page load (runState.js, a 7-day snapshot); checkpoints — the transfer measure the course
// standard leans on — kept phase, position and answers in React state only, so a reload, an iOS tab
// discard, the idle sign-out or a guard remount sent the learner back to the intro of a 20-item paper.
// The checkpoint run is now kept the way a Lektion run is, and the result clears it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('the checkpoint page restores the run once the paper can be rebuilt, saves it on every answer, and clears it on the result', () => {
  const page = read('src/pages/lesson/CheckpointPage.jsx');
  assert.match(page, /const \{ user, loading: authLoading \} = useAuth\(\);\s*const owner = user \? user\.id : null;/);
  const restore = page.slice(page.indexOf('const restored = useRef(false);'), page.indexOf('// Saved on every answer'));
  assert.match(restore, /if \(restored\.current \|\| authLoading \|\| !curriculum \|\| !checkpoint \|\| !pool \|\| !attempts\) return;/, 'owner, paper and attempt count known first');
  assert.match(restore, /const run = readCheckpointRun\(level, checkpoint\.id, Date\.now\(\), owner\);/);
  assert.match(restore, /buildCheckpoint\(\{ curriculum, checkpoint, pool, seed: paperSeed\(checkpoint, run\.round\) \}\)/, 'the paper is rebuilt from its round, never stored');
  assert.match(restore, /if \(!checkpointRunFits\(run, paper, attempts\.used\)\) \{\s*clearCheckpointRun\(level, checkpoint\.id, owner\);/);
  for (const set of ['setRound(run.round)', 'setAnswers(run.answers)', 'setNotHeard(new Set(run.notHeard))', 'setIndex(run.index)', 'setPhase(run.phase)']) {
    assert.ok(restore.includes(set), set);
  }
  const persist = page.slice(page.indexOf('// Saved on every answer'), page.indexOf('const scoredItems'));
  assert.match(persist, /const paper = useMemo\(\(\) => paperFingerprint\(items\), \[items\]\);/);
  assert.match(persist, /if \(phase === 'run' \|\| phase === 'sectionFeedback'\) \{\s*saveCheckpointRun\(level, checkpoint\.id, packCheckpointRun\(\{ paper, round, index, answers, notHeard: \[\.\.\.notHeard\], phase \}\), owner\);/);
  assert.match(persist, /\} else if \(phase === 'result'\) \{\s*clearCheckpointRun\(level, checkpoint\.id, owner\);/);
  assert.match(page, /setRound\(attempts\?\.used \|\| 0\)/, 'a fresh Start still draws this window\'s next paper');
});
