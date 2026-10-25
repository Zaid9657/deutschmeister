// A failed exercise-pool load is an error, never a Lektion without practice (2026-10-25 cross-check,
// LSN-04). When the dynamic import of a11.json / a12.json failed — offline, or a chunk gone after a
// deploy — the player set `poolFailed` and rendered <LessonPlayer pool={[]}> anyway: no practice stage,
// a recap that scored ~5 derived and dictation answers (Gold at 4 of 5) and a completion written to
// lesson_progress. The checkpoint page had no catch at all and sat on "Loading the tasks …" for ever.
// Both now hand the error to the app's ErrorBoundary (a stale chunk reloads once, anything else
// offers a refresh), and no run is built, scored or completed without its pool.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { curriculumFor } from '../src/data/curricula/index.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const PLAYER = read('src/pages/lesson/LessonPlayerPage.jsx');
const CHECKPOINT = read('src/pages/lesson/CheckpointPage.jsx');
const tick = () => new Promise((r) => setTimeout(r, 5));
const CHUNK_ERROR = 'Failed to fetch dynamically imported module: https://deutsch-meister.de/assets/a11-1a2b3c.js';

/** Run a page's pool-loading effect (the one that calls `load()`) with a stubbed loader. */
async function runPoolEffect(src, deps, context) {
  const start = src.lastIndexOf('useEffect(', src.indexOf('const load = POOL_LOADERS[')) + 'useEffect('.length;
  const end = src.indexOf(`}, ${deps});`, start);
  assert.ok(start > 'useEffect('.length && end > start, 'the pool effect');
  const calls = { pool: [], error: [] };
  const ctx = vm.createContext({
    console: { error: () => {} }, Error, ...context,
    setPool: (v) => calls.pool.push(v), setPoolError: (e) => calls.error.push(e),
  });
  vm.runInContext(`(${src.slice(start, end + 1)})()`, ctx);
  await tick();
  return calls;
}

test('why: a Lektion built without its pool has no practice stage at all', () => {
  const curriculum = curriculumFor('a1.1');
  const lektion = curriculum.lektionen[0];
  const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
  assert.ok(buildLesson({ curriculum, lektion, pool, dueCards: [], attempt: 1 }).stages.some((s) => s.kind === 'practice'));
  assert.ok(!buildLesson({ curriculum, lektion, pool: [], dueCards: [], attempt: 1 }).stages.some((s) => s.kind === 'practice'));
});

test('the lesson page keeps a failed load as an error and builds nothing from it', async () => {
  const curriculum = curriculumFor('a1.1');
  const failed = await runPoolEffect(PLAYER, '[curriculum]', {
    curriculum, POOL_LOADERS: { 'a1.1': () => Promise.reject(new Error(CHUNK_ERROR)) },
  });
  assert.deepEqual(failed.pool, [], 'no pool, not an empty one');
  assert.equal(failed.error.length, 1);
  assert.equal(failed.error[0].message, CHUNK_ERROR, 'the import error itself, so the ErrorBoundary can tell a stale chunk');
  const missing = await runPoolEffect(PLAYER, '[curriculum]', { curriculum, POOL_LOADERS: {} });
  assert.equal(missing.error.length, 1, 'a level without a pool is an error too');
  const ok = await runPoolEffect(PLAYER, '[curriculum]', { curriculum, POOL_LOADERS: { 'a1.1': async () => ({ default: { items: [1] } }) } });
  assert.deepEqual([ok.pool, ok.error], [[{ items: [1] }], []]);
});

test('the error goes to the ErrorBoundary, and the run — where completion is written — only exists with a pool', () => {
  const page = PLAYER.slice(PLAYER.indexOf('export default function LessonPlayerPage'));
  assert.match(page, /if \(poolError\) throw poolError;[\s\S]*return <LessonPlayer /, 'thrown before the player renders');
  assert.doesNotMatch(PLAYER, /pool \|\| \[\]|poolFailed/, 'never an empty stand-in pool');
  const gate = PLAYER.slice(PLAYER.indexOf('function LessonRun('), PLAYER.indexOf('function LessonStages('));
  assert.match(gate, /const ready = Boolean\(pool\) &&/, 'Start needs the pool');
  assert.ok(gate.indexOf('if (!pool) return <PlayerLoading />;') < gate.indexOf('<LessonStages'), 'the run mounts only with a pool');
  const stages = PLAYER.slice(PLAYER.indexOf('function LessonStages('), PLAYER.indexOf('const POOL_LOADERS'));
  assert.match(stages, /enqueueRun\(/, 'the completion write lives in the run…');
  assert.match(stages, /recordLocalLesson\(/, '…signed in or out');
  // The boundary that takes it: the whole app, reloading once for a stale chunk.
  assert.match(read('src/main.jsx'), /<ErrorBoundary>/);
  const boundary = read('src/components/ErrorBoundary.jsx');
  assert.match(boundary, /msg\.includes\('Failed to fetch dynamically imported module'\)/);
  assert.match(boundary, /window\.location\.reload\(\);/);
});

test('the checkpoint page does the same: a failed pool is an error, never "Loading the tasks …" for ever', async () => {
  const curriculum = curriculumFor('a1.1');
  const failed = await runPoolEffect(CHECKPOINT, '[level, curriculum]', {
    level: 'a1.1', curriculum, POOL_LOADERS: { 'a1.1': () => Promise.reject(new Error(CHUNK_ERROR)) },
  });
  assert.deepEqual(failed.pool, []);
  assert.equal(failed.error[0].message, CHUNK_ERROR);
  const ok = await runPoolEffect(CHECKPOINT, '[level, curriculum]', { level: 'a1.1', curriculum, POOL_LOADERS: { 'a1.1': async () => ({ default: { items: [] } }) } });
  assert.deepEqual(ok.pool, [{ items: [] }]);
  assert.match(CHECKPOINT, /if \(poolError\) throw poolError;/);
});
