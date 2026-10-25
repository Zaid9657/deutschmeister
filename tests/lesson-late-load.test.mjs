// What a run is built from is settled before it starts (2026-10-25 cross-check, LSN-05 and LSN-13).
//
// LSN-05. buildLesson is deterministic in (pool, warm-up cards, draw attempt), and the cards and the
//   draw count are fetched. A signed-in learner who pressed Start before fetchDueCards answered had a
//   warm-up inserted at index 0 when it did — the numeric stage index then pointed one stage earlier:
//   thrown back to the pretest, typed input lost — and a late count could swap the practice seven.
// LSN-13. Every lesson start showed "Loading…" until the whole level pool had downloaded, although the
//   intro needs only the curriculum and the Lektion.
//
// Now the intro renders at once; Start waits (labelled "Loading …") until the pool, the cards and the
// count are in, START_WAIT_MS at most for the two fetches; and from Start on, a late answer is ignored
// and the run (LessonStages) is built from what Start saw. The two fetch effects are run here as the
// player's own code, with the services stubbed and the answers deferred.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import buildLesson, { attemptFromCompletions } from '../src/lib/lesson/buildLesson.js';
import { buildCardIndex, warmupCards } from '../src/services/reviewService.js';
import { curriculumFor } from '../src/data/curricula/index.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const PLAYER = read('src/pages/lesson/LessonPlayerPage.jsx');
const curriculum = curriculumFor('a1.1');
const lektion = curriculum.lektionen.find((l) => l.nr === 2);
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const index = buildCardIndex(curriculum);
const rows = [...index.keys()].filter((k) => index.get(k).kind === 'word').slice(0, 2).map((card_key, i) => ({ card_key, step: i }));

/** The arrow function of the player's effect next to `marker` (after it, or around it) that ends at `deps`. */
function effectSource(marker, deps, { inside = false } = {}) {
  const at = PLAYER.indexOf(marker);
  assert.ok(at >= 0, `the player has: ${marker}`);
  const start = (inside ? PLAYER.lastIndexOf('useEffect(', at) : PLAYER.indexOf('useEffect(', at)) + 'useEffect('.length;
  const end = PLAYER.indexOf(`}, ${deps});`, start);
  assert.ok(end > start, `…ending at ${deps}`);
  return PLAYER.slice(start, end + 1);
}

function deferred() {
  let resolve; let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const tick = () => new Promise((r) => setTimeout(r, 5));

/** Mount the warm-up fetch: returns the calls it made and the `started` ref the player flips on Start. */
function mountDueCards(answer) {
  const set = [];
  const started = { current: false };
  const context = vm.createContext({
    resumed: null, preview: false, user: { id: 'u1' }, curriculum, started,
    buildCardIndex, warmupCards, fetchDueCards: () => answer.promise, setDueCards: (v) => set.push(v),
  });
  vm.runInContext(`(${effectSource('// Stage 0 warm-up: up to four cards due from the review ladder.', '[preview, user, curriculum, resumed]')})()`, context);
  return { set, started };
}

/** Mount the draw count (merge, then count): same shape. */
function mountAttempt(answer) {
  const attempts = [];
  const settled = [];
  const started = { current: false };
  const context = vm.createContext({
    resumed: null, preview: false, user: { id: 'u1' }, curriculum, lektion, started,
    hasLocalProgress: () => false, mergeLocalProgress: async () => 0, getLessonProgress: async () => new Map(),
    countCompletedRuns: () => answer.promise, attemptFromCompletions, localRunCount: () => 0,
    setAttempt: (v) => attempts.push(v), setAttemptSettled: (v) => settled.push(v), Promise,
  });
  vm.runInContext(`(${effectSource('// Merge first, THEN count', '[preview, user, curriculum.level, lektion.id, resumed]', { inside: true })})()`, context);
  return { attempts, settled, started };
}

test('why the inputs must be frozen: cards that arrive late put a warm-up at index 0 and shift every stage', () => {
  const before = buildLesson({ curriculum, lektion, pool, dueCards: [], attempt: 1 }).stages.map((s) => s.key);
  const after = buildLesson({ curriculum, lektion, pool, dueCards: warmupCards(rows, index), attempt: 1 }).stages.map((s) => s.key);
  assert.equal(after[0], 'warmup');
  assert.deepEqual(after.slice(1), before, 'the same stages, one seat later');
  assert.notEqual(after[1], before[1], 'so the learner on stage 1 would be moved back one stage');
});

test('warm-up cards that arrive after Start are ignored; before Start they are taken, with their ladder step', async () => {
  const early = deferred();
  const a = mountDueCards(early);
  early.resolve(rows);
  await tick();
  assert.equal(a.set.length, 1, 'before Start the cards are used');
  assert.deepEqual(a.set[0].map((c) => c.step), [0, 1]);

  const late = deferred();
  const b = mountDueCards(late);
  b.started.current = true; // the learner pressed Start
  late.resolve(rows);
  await tick();
  assert.deepEqual(b.set, [], 'no warm-up is inserted mid-run');

  const failed = deferred();
  const c = mountDueCards(failed);
  c.started.current = true;
  failed.reject(new Error('offline'));
  await tick();
  assert.deepEqual(c.set, [], 'nor does a late failure touch the started run');
});

test('a draw count that arrives after Start never swaps the practice seven', async () => {
  const early = deferred();
  const a = mountAttempt(early);
  early.resolve(1);
  await tick();
  assert.deepEqual(a.attempts, [attemptFromCompletions(1)], 'before Start the count decides the draw');
  assert.deepEqual(a.settled, [true]);

  const late = deferred();
  const b = mountAttempt(late);
  b.started.current = true;
  late.resolve(2);
  await tick();
  assert.deepEqual(b.attempts, [], 'the draw is the one the learner started on');
});

test('Start waits for the pool, the cards and the count — at most START_WAIT_MS for the fetches — and then freezes them', () => {
  assert.match(PLAYER, /const START_WAIT_MS = \d{4};/);
  assert.match(PLAYER, /const ready = Boolean\(pool\) && dueCards !== null && attemptSettled;/);
  assert.match(PLAYER, /const start = \(\) => \{\s*if \(!ready\) return;\s*started\.current = true;/, 'Start flips the freeze before anything else');
  assert.match(PLAYER, /return <IntroStage curriculum=\{curriculum\} lektion=\{lektion\} ready=\{ready\} onStart=\{start\} \/>;/);
  const fallback = PLAYER.slice(PLAYER.indexOf('// A slow network does not hold Start for long'), PLAYER.indexOf('}, [introDone]);'));
  assert.match(fallback, /setTimeout\(\(\) => \{\s*setDueCards\(\(cards\) => cards \|\| \[\]\);\s*setAttemptSettled\(true\);\s*\}, START_WAIT_MS\);/, 'a slow network costs the warm-up, never the lesson');
  // The run is built from what Start saw: LessonStages takes the inputs as given and fetches neither.
  assert.match(PLAYER, /<LessonStages[\s\S]*?attempt=\{attempt\}[\s\S]*?dueCards=\{dueCards \|\| \[\]\}[\s\S]*?\/>/);
  const stages = PLAYER.slice(PLAYER.indexOf('function LessonStages('), PLAYER.indexOf('const POOL_LOADERS'));
  assert.doesNotMatch(stages, /fetchDueCards\(|countCompletedRuns\(|setDueCards|setAttempt\(/, 'nothing inside the run can change its inputs');
  assert.match(stages, /buildLesson\(\{ curriculum, lektion, pool, dueCards, attempt \}\)/);
  const intro = read('src/components/lesson/IntroStage.jsx');
  assert.match(intro, /primaryLabel=\{ti\(ready \? 'intro\.start' : 'intro\.loading', lang\)\}/);
  assert.match(intro, /primaryDisabled=\{!ready\}/);
  for (const lang of ['en', 'de']) assert.ok(new RegExp(`'intro\\.loading': '[^']+'`).test(intro.slice(intro.indexOf(`${lang}: {`))), `intro.loading (${lang})`);
});

test('the intro shows while the pool downloads: the page no longer waits for it before rendering the player', () => {
  const page = PLAYER.slice(PLAYER.indexOf('export default function LessonPlayerPage'));
  assert.doesNotMatch(page, /if \(!pool[^)]*\)\s*\{?\s*return/, 'no "Loading…" gate on the pool before the intro');
  assert.match(page, /return <LessonPlayer key=\{`\$\{curriculum\.level\}:\$\{lektion\.id\}`\} curriculum=\{curriculum\} lektion=\{lektion\} pool=\{pool\} \/>;/);
  const gate = PLAYER.slice(PLAYER.indexOf('function LessonRun('), PLAYER.indexOf('function LessonStages('));
  assert.ok(gate.indexOf('if (!introDone) {') < gate.indexOf('if (!pool) return <PlayerLoading />;'), 'the intro comes before the wait for the pool');
  assert.match(gate, /trackLessonStarted\(curriculum\.level, lektion\.id, runId\);/, 'lesson_started fires when the run really starts');
});
