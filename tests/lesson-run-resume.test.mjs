// The lesson player resumes its run after a full page load in the same tab
// (src/lib/lesson/runState.js). Before this, the run lived only in React state
// and the Sprechen stage's hand-off to the speaking coach (window.location.assign)
// sent the learner back to the intro of the Lektion they were finishing. On
// 2026-10-01 no A1.1 Lektion had ever been finished: 6 starts, 0 completions.
//
// The rule this suite pins is the class, not one screen: the player saves the
// run on every change and restores it on mount, so ANY page load resumes it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  RUN_MAX_AGE_MS, RUN_VERSION, clearRun, latestRun, packRun, readRun, resumeStageIndex, runKey, saveRun, unpackRun,
} from '../src/lib/lesson/runState.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { curriculumFor } from '../src/data/curricula/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

function fakeSessionStorage({ throws = false } = {}) {
  const map = new Map();
  const guard = () => { if (throws) throw new Error('SecurityError'); };
  return {
    map,
    getItem: (k) => { guard(); return map.has(k) ? map.get(k) : null; },
    setItem: (k, v) => { guard(); map.set(k, String(v)); },
    removeItem: (k) => { guard(); map.delete(k); },
  };
}

function withWindow(storage, fn) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  const prev = globalThis.window;
  globalThis.window = { localStorage: storage, sessionStorage: fakeSessionStorage() };
  try { return fn(); } finally {
    if (had) globalThis.window = prev; else delete globalThis.window;
  }
}

const NOW = Date.UTC(2026, 9, 1, 8, 0, 0);

test('packRun → unpackRun round-trips a run and normalises bad numbers', () => {
  const run = packRun({
    stageKey: 'speaking', stageIndex: 8, itemIndex: 0, attempt: 2,
    attempts: [{ itemId: 'x', stage: 'practice', correct: true }], misses: [{ id: 'y' }], requeued: [], combo: 3, dueCards: [],
  }, NOW);
  assert.equal(run.v, RUN_VERSION);
  assert.deepEqual(unpackRun(JSON.parse(JSON.stringify(run)), NOW + 1000), run);
  const odd = packRun({ stageKey: 'practice', stageIndex: -4, itemIndex: 'two', attempt: 0, attempts: 'no', combo: NaN }, NOW);
  assert.equal(odd.stageIndex, 0);
  assert.equal(odd.itemIndex, 0);
  assert.equal(odd.attempt, 1, 'the draw attempt is never below 1');
  assert.deepEqual(odd.attempts, []);
  assert.equal(odd.combo, 0);
});

test('unpackRun refuses what must not be resumed: other versions, stale runs, the recap, junk', () => {
  const ok = packRun({ stageKey: 'writing', stageIndex: 9 }, NOW);
  assert.ok(unpackRun(ok, NOW));
  assert.equal(unpackRun({ ...ok, v: RUN_VERSION + 1 }, NOW), null);
  assert.equal(unpackRun(ok, NOW + RUN_MAX_AGE_MS + 1), null, 'a snapshot from another sitting starts fresh');
  assert.equal(unpackRun({ ...ok, savedAt: NOW + 10 * 60 * 1000 }, NOW), null, 'a snapshot from the future is junk');
  assert.equal(unpackRun({ ...ok, stageKey: 'recap' }, NOW), null, 'a resume must never be what writes the completion');
  assert.equal(unpackRun({ ...ok, stageKey: '' }, NOW), null);
  for (const junk of [null, undefined, 'x', 42, []]) assert.equal(unpackRun(junk, NOW), null);
});

test('resumeStageIndex keeps the saved index, follows a shifted key, and otherwise starts over', () => {
  const stages = ['pretest', 'dialog', 'wortfeld', 'speaking', 'writing', 'requeue', 'recap'].map((key) => ({ key }));
  assert.equal(resumeStageIndex(stages, { stageKey: 'speaking', stageIndex: 3 }), 3);
  const shifted = [{ key: 'warmup' }, ...stages];
  assert.equal(resumeStageIndex(shifted, { stageKey: 'speaking', stageIndex: 3 }), 4, 'a warm-up inserted in front must not move the learner one stage back');
  assert.equal(resumeStageIndex(stages, { stageKey: 'gone', stageIndex: 3 }), 0);
  assert.equal(resumeStageIndex(stages, { stageKey: 'recap', stageIndex: 6 }), 0);
  assert.equal(resumeStageIndex(stages, null), 0);
});

test('A1.1 Lektion 1: the rebuilt run is the same run, and resumes on the Sprechen stage the coach hand-off leaves from', () => {
  const curriculum = curriculumFor('a1.1');
  const lektion = curriculum.lektionen.find((l) => l.nr === 1);
  const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
  const before = buildLesson({ curriculum, lektion, pool, dueCards: [], attempt: 1 });
  const speakingAt = before.stages.findIndex((s) => s.kind === 'speaking');
  assert.ok(speakingAt > 0, 'Lektion 1 has a Sprechen stage');
  const run = unpackRun(JSON.parse(JSON.stringify(packRun({ stageKey: 'speaking', stageIndex: speakingAt, attempt: 1, dueCards: [] }, NOW))), NOW);
  const after = buildLesson({ curriculum, lektion, pool, dueCards: run.dueCards, attempt: run.attempt });
  assert.deepEqual(after.stages.map((s) => s.key), before.stages.map((s) => s.key));
  const ids = (l) => l.stages.flatMap((s) => (s.items || []).map((i) => i.id));
  assert.deepEqual(ids(after), ids(before), 'the restored item index must point at the same items');
  assert.equal(after.stages[resumeStageIndex(after.stages, run)].kind, 'speaking');
});

test('saveRun / readRun / clearRun use localStorage under one key per level and Lektion', () => {
  const storage = fakeSessionStorage();
  withWindow(storage, () => {
    const run = packRun({ stageKey: 'dictation', stageIndex: 8, itemIndex: 1 }, NOW);
    assert.equal(saveRun('A1.1', 'a1.1-l01', run), true);
    assert.ok(storage.map.has(runKey('a1.1', 'a1.1-l01')), 'the level is lower-cased in the key');
    assert.deepEqual(readRun('a1.1', 'a1.1-l01', NOW), run);
    assert.equal(readRun('a1.1', 'a1.1-l02', NOW), null, 'another Lektion has its own run');
    clearRun('a1.1', 'a1.1-l01');
    assert.equal(readRun('a1.1', 'a1.1-l01', NOW), null);
  });
});

test('a run survives the end of the sitting: resumed for 7 days and offered on the course home', () => {
  assert.equal(RUN_MAX_AGE_MS, 7 * 24 * 60 * 60 * 1000, 'stop on the bus, resume at home — and next weekend');
  const storage = fakeSessionStorage();
  withWindow(storage, () => {
    saveRun('a1.1', 'a1.1-l02', packRun({ runId: 'r1', stageKey: 'practice', stageIndex: 5 }, NOW - 2 * 86400000));
    saveRun('a1.1', 'a1.1-l03', packRun({ runId: 'r2', stageKey: 'dialog', stageIndex: 2 }, NOW - 3600000));
    saveRun('a1.1', 'a1.1-l04', packRun({ runId: 'r3', stageKey: 'notice' }, NOW - RUN_MAX_AGE_MS - 1));
    assert.equal(readRun('a1.1', 'a1.1-l02', NOW).runId, 'r1', 'two days later the run (and its analytics id) resumes');
    assert.equal(readRun('a1.1', 'a1.1-l04', NOW), null, 'older than a week starts fresh');
    const latest = latestRun('a1.1', ['a1.1-l01', 'a1.1-l02', 'a1.1-l03', 'a1.1-l04'], NOW);
    assert.equal(latest.lektionId, 'a1.1-l03', 'the course home offers the most recent unfinished run');
    assert.equal(latestRun('a1.1', ['a1.1-l01'], NOW), null);
  });
  const snapshot = JSON.stringify(packRun({ runId: 'r', stageKey: 'writing', attempts: [{ itemId: 'x', stage: 'practice', correct: false }], skills: { writing: { state: 'assessed', pct: 70 } } }, NOW));
  assert.doesNotMatch(snapshot, /"text"|"answer"|"typed"/, 'a snapshot holds ids, correctness and summaries — no learner text');
});

test('storage that throws costs the resume, never the lesson', () => {
  withWindow(fakeSessionStorage({ throws: true }), () => {
    assert.equal(saveRun('a1.1', 'a1.1-l01', packRun({ stageKey: 'notice' }, NOW)), false);
    assert.equal(readRun('a1.1', 'a1.1-l01', NOW), null);
    assert.doesNotThrow(() => clearRun('a1.1', 'a1.1-l01'));
  });
  assert.equal(readRun('a1.1', 'a1.1-l01', NOW), null, 'no window at all (SSR, tests) is a fresh run');
});

test('LessonPlayerPage restores the run on mount, saves it on every change, and the recap clears it', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(src, /useState\(\(\) => \(preview \? null : readRun\(curriculum\.level, lektion\.id\)\)\)/, 'the run is read once, on mount');
  assert.match(src, /useState\(preview \|\| !!resumed\)/, 'a resumed run skips the intro');
  assert.match(src, /resumeStageIndex\(buildLesson\(\{ curriculum, lektion, pool, dueCards: resumed\.dueCards, attempt: resumed\.attempt \}\)\.stages, resumed\)/,
    'the stage is restored against the stage list rebuilt from the snapshot');
  for (const field of ['stageKey: stage.key', 'stageIndex', 'itemIndex', 'attempt', 'attempts', 'misses', 'requeued', 'combo', 'dueCards']) {
    assert.ok(src.includes(field), `the saved run lacks ${field}`);
  }
  assert.ok(src.includes('saveRun(curriculum.level, lektion.id, packRun({'), 'the player saves a packed run');
  assert.match(src, /if \(saved \|\| stage\.kind === 'recap'\) \{ clearRun\(curriculum\.level, lektion\.id\); return; \}/,
    'the recap clears the run, and a run past the recap is never saved again');
  assert.match(src, /if \(!cancelled && !resumed\) setAttempt/, 'a resumed run keeps its draw');
  assert.match(src, /if \(resumed\) return undefined;/, 'a resumed run keeps its warm-up cards');
});

test('every full-page exit from a lesson stage returns to the Lektion URL the player resumes on', () => {
  const stage = read('src/components/lesson/SpeakingStage.jsx');
  assert.ok(stage.includes('window.location.assign('), 'the coach hand-off is a full page load (why the resume exists)');
  assert.ok(stage.includes('returnTo: `/course/${level}/l/${lektion.nr}`'), 'the coach bar returns to the player route');
  const app = read('src/App.jsx');
  assert.ok(app.includes('/course/:level/l/:nr'), 'the player route the return bar links to');
});
