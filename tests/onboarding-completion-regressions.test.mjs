// The onboarding exits (src/components/onboarding/IntroSlides.jsx), run from
// the component's own source with the hooks stubbed.
//
//   1. "Just show me around first" completes the state the onboarding gate
//      reads, whether the slides are the gate's (onComplete) or the standalone
//      /onboarding route's.
//   2. An exam pick reaches the dashboard in the same visit (C-149/C-135/X-095):
//      the pick was written fire-and-forget and the shared profile
//      (SubscriptionContext) never reloaded, so after "Just show me around
//      first" the dashboard showed no goal and the course card instead of the
//      exam's first task. Every exit now waits for the write (3 s at most),
//      completes onboarding, then reloads the profile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/**
 * The slides' handlers, from the source, against stubs. `write` returns the
 * exam_track write's promise. `onComplete: 'gate'` renders the slides as the
 * onboarding gate does, its completion logged beside everything else.
 */
function slides({ onComplete, write = () => Promise.resolve({ error: null }), withTimeout } = {}) {
  const source = read('src/components/onboarding/IntroSlides.jsx');
  const body = source.slice(source.indexOf('  const { currentStep'), source.indexOf('  const slide = SLIDES[currentStep];'));
  const log = [];
  const handlers = runInNewContext(`(() => { ${body}; return { chooseExam, handleSkip, chooseStart }; })()`, {
    onComplete: onComplete === 'gate' ? async (exit) => { log.push(['gate-complete', exit]); } : onComplete,
    useOnboarding: () => ({
      currentStep: 2,
      setCurrentStep: () => {},
      needsOnboarding: true,
      completeOnboarding: async (exit) => { log.push(['standalone-complete', exit]); },
    }),
    useAuth: () => ({ user: { id: 'learner' } }),
    useSubscription: () => ({ refreshSubscription: async () => { log.push(['refresh']); } }),
    useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
    useRef: (current) => ({ current }),
    useEffect: () => {},
    useCallback: (fn) => fn,
    supabase: {
      from: () => ({ update: (values) => ({ eq: () => { log.push(['write', values.exam_track]); return write(); } }) }),
      auth: { updateUser: () => Promise.resolve({ error: null }) },
    },
    withTimeout: withTimeout || ((promise) => promise),
    trackOnboardingStarted: () => {},
    trackOnboardingSlideViewed: () => {},
    trackOnboardingSkipped: () => { log.push(['skip-event']); },
    STARTING_POINTS: { NEW: 'new', SOME: 'some' },
    STARTING_POINT_KEY: 'starting_point',
    SLIDES: [{}, {}, {}],
    console: { error: () => {} },
  });
  return { ...handlers, log };
}

test('show me around completes the state controlling the onboarding gate', async () => {
  assert.match(read('src/components/onboarding/OnboardingGate.jsx'), /<IntroSlides onComplete=\{completeOnboarding\} \/>/);
  const exits = [];
  const s = slides({ onComplete: async (destination) => { exits.push(destination); } });
  await s.handleSkip();
  assert.deepEqual(exits, ['dashboard'], 'navigating to the current dashboard must close its gate');
  assert.deepEqual(s.log, [['skip-event']], 'no exam picked: nothing to write, nothing to reload');
});

test('the standalone onboarding route retains its own completion action', async () => {
  const s = slides();
  await s.handleSkip();
  assert.deepEqual(s.log, [['skip-event'], ['standalone-complete', 'dashboard']]);
});

test('an exam pick then "show me around": the write lands, onboarding completes, then the profile reloads', async () => {
  let settle;
  const pending = new Promise((resolve) => { settle = resolve; });
  const s = slides({ write: () => pending, onComplete: 'gate' });
  s.chooseExam('telc_b1');
  const exit = s.handleSkip();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(s.log, [['write', 'telc_b1'], ['skip-event']], 'completion waits for the write');
  settle({ error: null });
  await exit;
  assert.deepEqual(s.log, [['write', 'telc_b1'], ['skip-event'], ['gate-complete', 'dashboard'], ['refresh']],
    'completion is written before the reload, so a re-mounted gate finds it');
});

test('the learning exits go where their labels say after an exam pick, and reload the profile', async () => {
  for (const [point, exit] of [['new', 'first-lesson'], ['some', 'level-test']]) {
    const s = slides({ onComplete: 'gate' });
    s.chooseExam('telc_b2');
    await s.chooseStart(point);
    assert.deepEqual(s.log, [['write', 'telc_b2'], ['gate-complete', exit], ['refresh']], `${point}: the exit the button names, no exam override`);
  }
});

test('a failed or hanging exam write never blocks completion, and nothing stale is reloaded', async () => {
  const failed = slides({ write: () => Promise.resolve({ error: { message: 'rls' } }) });
  failed.chooseExam('dtz');
  await failed.handleSkip();
  assert.deepEqual(failed.log, [['write', 'dtz'], ['skip-event'], ['standalone-complete', 'dashboard']]);

  const rejected = slides({ write: () => Promise.reject(new Error('offline')) });
  rejected.chooseExam('dtz');
  await rejected.handleSkip();
  assert.deepEqual(rejected.log.slice(-1), [['standalone-complete', 'dashboard']]);

  // The source bounds the wait (withTimeout, 3000 ms); a timeout counts as not saved.
  const hanging = slides({ write: () => new Promise(() => {}), withTimeout: () => Promise.reject(new Error('Request timed out')) });
  hanging.chooseExam('goethe_a2');
  await hanging.handleSkip();
  assert.deepEqual(hanging.log, [['write', 'goethe_a2'], ['skip-event'], ['standalone-complete', 'dashboard']]);
  assert.match(read('src/components/onboarding/IntroSlides.jsx'), /withTimeout\(examSave\.current, 3000\)/);
});
