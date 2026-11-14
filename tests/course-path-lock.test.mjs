import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { pathNodeUnlocked, pathNodeAccess, placedAbove, placementSuffix } from '../src/lib/course/lock.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { curriculumPath } from '../src/data/curricula/index.js';
import { answerProof, packProof, proofTasks, canCompleteProofLesson } from '../src/lib/lesson/proof.js';
import { loadJsxModule } from './helpers/renderJsx.mjs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const path = curriculumPath(CURRICULUM_A11);

test('extracted lock equals the old inline rule for every guest/loading/placement/position/progress combination', () => {
  for (const user of [null, { id: 'u1' }]) for (const loaded of [false, true]) for (const endowed of [false, true]) for (let index = 0; index < path.length; index++) for (const previousDone of [false, true]) {
    const done = new Set(previousDone && index ? [path[index - 1].id] : []);
    assert.equal(pathNodeUnlocked({ user, loaded, endowed, index, path, done }), (!user || loaded) && (endowed || index === 0 || done.has(path[index - 1].id)));
  }
  assert.equal(placedAbove('A1.2', 'a1.1'), true);
  assert.equal(placedAbove('a1.1', 'A1.1'), false);
  assert.equal(placedAbove(null, 'a1.1'), false);
  assert.equal(placementSuffix('?from=placement&lang=en'), '?from=placement');
});

test('loading cannot flash a lock or mount content; old completions remain open with an unfinished predecessor', () => {
  for (const kind of ['lektion', 'checkpoint']) {
    const index = path.findIndex((node, i) => node.kind === kind && i > 0);
    const options = { user: { id: 'u1' }, loaded: false, endowed: false, path, index, done: new Set() };
    assert.equal(pathNodeAccess(options), 'loading');
    assert.equal(pathNodeAccess({ ...options, loaded: true, profileLoading: true }), 'loading');
    assert.equal(pathNodeAccess({ ...options, loaded: true }), 'locked');
    assert.equal(pathNodeAccess({ ...options, loaded: true, done: new Set([path[index].id]) }), 'open');
    assert.equal(pathNodeAccess({ ...options, loaded: true, endowed: true }), 'open');
  }
});

const allElements = (node) => !node || typeof node !== 'object' ? [] : [node, ...(node.props?.children || []).flat(Infinity).flatMap(allElements)];
test('both routes wrap their run; the rendered guard gives neutral loading and one bilingual next-step button', async () => {
  for (const [file, run] of [['LessonPlayerPage', 'LessonPlayer'], ['CheckpointPage', 'CheckpointRun']]) {
    const source = read(`src/pages/lesson/${file}.jsx`);
    assert.match(source, new RegExp(`<CoursePathGuard[\\s\\S]*<${run} [\\s\\S]*</CoursePathGuard>`));
  }
  let access = { state: 'loading', suffix: '', current: path[0] }, lang = 'en';
  const { default: Guard } = await loadJsxModule('src/components/course/CoursePathGuard.jsx', {
    '../../lib/course/usePathAccess.js': { usePathAccess: () => access },
    '../../lib/courseNext.js': { curriculumNodeHref: (level, node) => `/course/${level}/l/${node.nr}` },
    '../../lib/lesson/strings.js': { useLessonLang: () => [lang], t: (key) => key },
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
  });
  for (const node of [path[1], path.find((n) => n.kind === 'checkpoint')]) {
    const props = { curriculum: CURRICULUM_A11, node, children: 'lesson content' };
    assert.doesNotMatch(JSON.stringify(Guard(props)), /lesson content|This step opens/);
    access = { ...access, state: 'locked' };
    for (lang of ['en', 'de']) {
      const tree = Guard(props), buttons = allElements(tree).filter((n) => n.type === 'Button');
      assert.equal(buttons.length, 1);
      assert.equal(buttons[0].props.to, '/course/a1.1/l/1');
      assert.match(JSON.stringify(tree), lang === 'de' ? /vorherigen Schritt/ : /previous step/);
    }
    access = { ...access, state: 'open' };
    assert.equal(Guard(props), 'lesson content');
    access = { ...access, state: 'loading' };
  }
});

test('actual recap effect withholds guest and account writes until proof, writes once, and keeps no-proof behavior', () => {
  const source = read('src/pages/lesson/LessonPlayerPage.jsx');
  const start = source.indexOf('useEffect(() => {', source.indexOf('// Persist once, when the recap'));
  const end = source.indexOf('\n  }, [proof, preview, saved, stage, user,', start);
  assert.ok(start > 0 && end > start);
  const effect = source.slice(start + 'useEffect('.length, end) + '\n}';
  const lesson = CURRICULUM_A11.lektionen[0];
  let passed = packProof();
  for (const value of ['Guten Tag. Auf Wiedersehen.', 'Ich heiße Jo Lee.', 'Chakiri', 'Wie geht es Ihnen? Mir geht es gut, danke.']) passed = answerProof(proofTasks(lesson), passed, { kind: 'typed', value, listened: true }, { surname: 'Lee' });
  for (const user of [null, { id: 'u1' }]) {
    const writes = [];
    const context = vm.createContext({
      preview: false, saved: false, completionStarted: { current: false }, stage: { kind: 'recap' }, lektion: lesson, proof: packProof(), user,
      curriculum: CURRICULUM_A11, canCompleteProofLesson, runId: 'run', skills: {}, score: {}, attempts: [], accuracy: 0, status: 'complete', runEntryKey: { current: null },
      setSaved: () => {}, trackLessonCompleted: () => {}, skillProps: () => ({}), skillLines: () => [], setSync: () => {},
      recordLocalLesson: (run) => { writes.push(run); return true; }, enqueueRun: (run) => { writes.push(run); return { key: 'once' }; }, flush: () => {},
    });
    const finish = vm.runInContext(`(${effect})`, context);
    finish(); assert.equal(writes.length, 0);
    context.proof = passed;
    finish(); finish(); assert.equal(writes.length, 1);
    context.completionStarted.current = false;
    context.lektion = CURRICULUM_A11.lektionen[1]; context.proof = {};
    finish(); assert.equal(writes.length, 2, 'L2 has no proof and completes as before');
  }
});

test('proof first-try rows survive refused guest storage and failed outbox writes, then retry idempotently', async () => {
  const oldWindow = globalThis.window;
  const store = new Map();
  let refuse = true;
  globalThis.window = { localStorage: { getItem: (key) => store.get(key) || null, setItem: (key, value) => { if (refuse) throw new Error('quota'); store.set(key, value); }, removeItem: (key) => store.delete(key) } };
  try {
    const { recordLocalLesson, readLocalProgress, retryLocalProgressSave, clearLocalProgress } = await import('../src/lib/course/localProgress.js');
    const { enqueueRun, flushOutbox, pendingRuns } = await import('../src/lib/course/syncOutbox.js');
    const attempts = proofTasks(CURRICULUM_A11.lektionen[0]).map((task, i) => ({ itemId: task.id, stage: 'proof', correct: i !== 1 }));
    assert.equal(recordLocalLesson({ level: 'a1.1', lektionId: 'a1.1-l01', attempts }), false);
    assert.deepEqual(readLocalProgress().attempts.map((a) => a.correct), [true, false, true, true]);
    refuse = false;
    assert.equal(retryLocalProgressSave(), true);
    enqueueRun({ userId: 'proof-user', level: 'a1.1', lektionId: 'a1.1-l01', createdAt: new Date().toISOString(), attempts });
    let attemptsFail = true, progressWrites = 0;
    const deps = { logAttempts: async (_, run) => { assert.deepEqual(run.attempts.map((a) => a.correct), [true, false, true, true]); return !attemptsFail; }, completeLesson: async () => { progressWrites++; return true; }, seedCards: async () => true };
    assert.equal((await flushOutbox('proof-user', deps)).state, 'failed');
    assert.equal(pendingRuns('proof-user').length, 1);
    attemptsFail = false;
    assert.equal((await flushOutbox('proof-user', deps)).state, 'synced');
    assert.equal(progressWrites, 1);
    assert.equal(pendingRuns('proof-user').length, 0);
    clearLocalProgress();
  } finally { if (oldWindow === undefined) delete globalThis.window; else globalThis.window = oldWindow; }
});

test('path hook waits for loaded progress and profile, ignores stale owners, and includes offline finished runs', async () => {
  let cursor = 0, effectCursor = 0, user = { id: 'first' }, profileLoading = false;
  const slots = [], effects = [], deps = [], cleanups = [], waiting = [], listeners = new Map();
  const source = read('src/lib/course/usePathAccess.js').replace(/^import[\s\S]*?;\n/gm, '').replace('export function usePathAccess', 'function usePathAccess');
  const context = vm.createContext({
    useState: (initial) => { const at = cursor++; if (!(at in slots)) slots[at] = initial; return [slots[at], (next) => { slots[at] = typeof next === 'function' ? next(slots[at]) : next; }]; },
    useMemo: (fn) => fn(),
    useEffect: (effect, nextDeps) => { const at = effectCursor++; if (!deps[at] || nextDeps.some((v, i) => v !== deps[at][i])) { effects.push(() => { cleanups[at]?.(); cleanups[at] = effect(); }); deps[at] = nextDeps; } },
    useAuth: () => ({ user, loading: false }), useSubscription: () => ({ profile: null, loading: profileLoading }), useLocation: () => ({ search: '' }),
    curriculumPath, hasLocalProgress: () => false, mergeLocalProgress: async () => {}, flushOutbox: async () => {},
    localDoneIds: () => new Set(), pendingRuns: (id) => [{ userId: id, level: 'a1.1', lektionId: path[0].id }],
    getProgramProgress: () => new Promise((resolve) => waiting.push(resolve)),
    currentPathNode: (path, done) => path.find((n) => !done.has(n.id)), pathNodeAccess, placedAbove, placementSuffix,
    window: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) },
  });
  const hook = vm.runInContext(`${source}\nusePathAccess;`, context);
  const render = () => { cursor = 0; effectCursor = 0; return hook(CURRICULUM_A11, path[1].id); };
  const runEffects = async () => { effects.splice(0).forEach((fn) => fn()); for (let i = 0; i < 10; i++) await Promise.resolve(); };
  assert.equal(render().state, 'loading'); await runEffects();
  assert.equal(render().state, 'loading');
  waiting.shift()(new Set()); await runEffects();
  assert.equal(render().state, 'open', 'pending completed L1 opens L2 offline');
  profileLoading = true; assert.equal(render().state, 'loading'); profileLoading = false;
  user = { id: 'second' };
  assert.equal(render().state, 'loading', 'old account permission cannot flash'); await runEffects();
  assert.equal(render().state, 'loading');
  waiting.shift()(new Set()); await runEffects();
  assert.equal(render().state, 'open');
  assert.ok(listeners.has('online'));
  cleanups.forEach((fn) => fn?.());
  assert.equal(listeners.size, 0);
});
