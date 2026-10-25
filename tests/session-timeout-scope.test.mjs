// The idle timeout signs out this browser only, counts activity in every tab,
// and never runs under live work (src/hooks/useSessionTimeout.js).
//
// The defect this closes (cross-check 2026-10-25, SHL-01, C-072/C-089): each
// tab counted only its own mouse/keyboard input, so a /dashboard tab left open
// hit its 30 minutes while the learner was in a Modelltest or a lesson in
// another tab, and called supabase.auth.signOut() with auth-js's default scope
// 'global' — revoking every session of the learner, ending the exam in the
// active tab and signing out the phone they studied on. Whether learners need
// an idle logout at all is an owner decision and is not changed here.
//
// The hook runs for real: its source with the imports swapped for fakes, two
// "tabs" sharing one localStorage, and a fake clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const MIN = 60 * 1000;
const sameDeps = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

function fakeClock() {
  let now = Date.parse('2026-10-25T10:00:00Z');
  let seq = 0;
  const timers = new Map();
  return {
    now: () => now,
    setTimeout: (fn, ms) => { const id = ++seq; timers.set(id, { at: now + Math.max(0, ms), fn }); return id; },
    clearTimeout: (id) => { timers.delete(id); },
    setInterval: (fn, ms) => { const id = ++seq; timers.set(id, { at: now + ms, fn, every: ms }); return id; },
    clearInterval: (id) => { timers.delete(id); },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, timer] = due;
        now = timer.at;
        if (timer.every) timer.at += timer.every;
        else timers.delete(id);
        timer.fn();
      }
      now = end;
    },
  };
}

function openTab({ clock, storage, pathname = '/dashboard', userId = 'learner-a' }) {
  const slots = [];
  let cursor = 0;
  let pending = [];
  const listeners = new Map();
  const signOuts = [];
  const navigations = [];
  const auth = { user: userId ? { id: userId } : null };
  const location = { pathname };
  const navigate = (to, options) => navigations.push([to, options?.replace]);
  const source = read('src/hooks/useSessionTimeout.js')
    .replace(/^import[\s\S]*?;\n/gm, '')
    .replace(/^export (function|const) /gm, '$1 ');
  const api = vm.runInNewContext(`${source}\n({ useSessionTimeout, isLiveWorkPath });`, {
    useState(initial) {
      const slot = slots[cursor++] ??= { value: initial };
      return [slot.value, (next) => { slot.value = typeof next === 'function' ? next(slot.value) : next; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { callback, deps };
      return slots[index].callback;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) {
        const previous = slots[index];
        const slot = slots[index] = { deps, cleanup: previous?.cleanup };
        pending.push(() => { slot.cleanup?.(); slot.cleanup = callback(); });
      }
    },
    useAuth: () => auth,
    useNavigate: () => navigate,
    useLocation: () => location,
    supabase: { auth: { signOut: async (options) => { signOuts.push(options ? { ...options } : null); return { error: null }; } } },
    safeGet: (key) => storage.get(key) ?? null,
    safeSet: (key, value) => { storage.set(key, value); return true; },
    window: {
      addEventListener: (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
      removeEventListener: (name, fn) => { listeners.get(name)?.delete(fn); },
    },
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
    Date: { now: clock.now },
  });
  const tab = {
    signOuts,
    navigations,
    isLiveWorkPath: api.isLiveWorkPath,
    render() {
      cursor = 0;
      const value = api.useSessionTimeout();
      const effects = pending;
      pending = [];
      effects.forEach((effect) => effect());
      return value;
    },
    fire(name, event = {}) { for (const fn of [...(listeners.get(name) || [])]) fn(event); },
    goTo(path) { location.pathname = path; return tab.render(); },
  };
  tab.render();
  return tab;
}

test('an idle tab signs out this browser only, then shows why', async () => {
  const clock = fakeClock();
  const tab = openTab({ clock, storage: new Map() });
  clock.advance(28 * MIN);
  assert.equal(tab.render().showWarning, true, 'the two-minute warning still comes');
  clock.advance(2 * MIN);
  await settle();
  assert.deepEqual(tab.signOuts, [{ scope: 'local' }], "never the default 'global' scope, which signed out every device");
  assert.deepEqual(tab.navigations, [['/login?reason=timeout', true]]);
});

test('activity in another tab keeps an idle tab signed in', async () => {
  const clock = fakeClock();
  const storage = new Map();
  const idle = openTab({ clock, storage });
  const busy = openTab({ clock, storage, pathname: '/vocabulary' });
  for (let minute = 0; minute < 75; minute += 5) {
    clock.advance(5 * MIN);
    busy.fire('keydown'); // the learner works in the other tab…
    idle.fire('storage', { key: 'dm_last_activity' }); // …which this tab hears about
  }
  await settle();
  assert.equal(idle.render().showWarning, false);
  assert.deepEqual(idle.signOuts, [], 'the idle tab must not sign out the tab the learner is using');
  assert.deepEqual(busy.signOuts, []);
});

test('a missed storage event cannot sign out an active learner: the timeout re-reads the shared activity', async () => {
  const clock = fakeClock();
  const storage = new Map();
  const idle = openTab({ clock, storage });
  const busy = openTab({ clock, storage, pathname: '/listening' });
  clock.advance(20 * MIN);
  busy.fire('scroll'); // recorded in storage, no event delivered to the idle tab
  clock.advance(10 * MIN); // the idle tab's original 30 minutes are up
  await settle();
  assert.deepEqual(idle.signOuts, []);
  clock.advance(20 * MIN); // 30 minutes after the last activity anywhere
  await settle();
  assert.deepEqual(idle.signOuts, [{ scope: 'local' }], 'with no activity anywhere the timeout still applies');
});

test('no countdown under a lesson, a checkpoint, a Modelltest run or the speaking coach', async () => {
  for (const path of ['/course/a1.1/l/3', '/course/a1.2/checkpoint/1', '/course/a1.1/review', '/modelltest/goethe-a2/run', '/speaking', '/speaking/']) {
    const clock = fakeClock();
    const storage = new Map();
    const work = openTab({ clock, storage, pathname: path });
    const idle = openTab({ clock, storage });
    clock.advance(90 * MIN); // listening, talking: no key or mouse input
    idle.fire('storage', { key: 'dm_last_activity' });
    await settle();
    assert.equal(work.render().showWarning, false, path);
    assert.deepEqual(work.signOuts, [], path);
    assert.deepEqual(idle.signOuts, [], `${path}: the work tab's heartbeat keeps the other tabs alive`);
  }
});

test('leaving live work starts a fresh countdown', async () => {
  const clock = fakeClock();
  const tab = openTab({ clock, storage: new Map(), pathname: '/course/a1.1/l/3' });
  clock.advance(60 * MIN);
  tab.goTo('/course/a1.1');
  clock.advance(29 * MIN);
  await settle();
  assert.deepEqual(tab.signOuts, []);
  clock.advance(1 * MIN);
  await settle();
  assert.deepEqual(tab.signOuts, [{ scope: 'local' }]);
});

test('"Stay signed in" restarts the window from now', async () => {
  const clock = fakeClock();
  const tab = openTab({ clock, storage: new Map() });
  clock.advance(28 * MIN);
  const { showWarning, stayLoggedIn } = tab.render();
  assert.equal(showWarning, true);
  stayLoggedIn();
  assert.equal(tab.render().showWarning, false);
  clock.advance(27 * MIN);
  await settle();
  assert.deepEqual(tab.signOuts, []);
  assert.equal(tab.render().showWarning, false);
});

test('the live-work routes are the stage routes, the exam run and the coach only', () => {
  const { isLiveWorkPath } = openTab({ clock: fakeClock(), storage: new Map(), userId: null });
  for (const path of ['/course/a1.1/l/1', '/course/a1.2/checkpoint/2/', '/course/a2.1/review', '/modelltest/telc-b1/run', '/speaking']) {
    assert.equal(isLiveWorkPath(path), true, path);
  }
  for (const path of ['/dashboard', '/course/a1.1', '/course/a1.1/complete', '/modelltest/telc-b1', '/modelltest/telc-b1/result/9', '/speakingx', '/profile', '', undefined]) {
    assert.equal(isLiveWorkPath(path), false, String(path));
  }
});
