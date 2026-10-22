import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function skipSlides(onComplete) {
  const source = read('src/components/onboarding/IntroSlides.jsx');
  const setup = source.slice(source.indexOf('  const { currentStep'), source.indexOf('  const [examTrack'));
  const skip = source.match(/ {2}const handleSkip = \(\) => \{([\s\S]*?)\n {2}\};/)[1];
  let standaloneCompletions = 0;
  let skipEvents = 0;
  runInNewContext(`(() => { ${setup} ${skip} })()`, {
    onComplete,
    useOnboarding: () => ({ completeOnboarding: () => { standaloneCompletions += 1; } }),
    useAuth: () => ({ user: { id: 'learner' } }),
    trackOnboardingSkipped: () => { skipEvents += 1; },
  });
  return { standaloneCompletions, skipEvents };
}

test('show me around completes the state controlling the onboarding gate', () => {
  const gate = read('src/components/onboarding/OnboardingGate.jsx');
  assert.match(gate, /<IntroSlides onComplete=\{completeOnboarding\} \/>/);
  let needsOnboarding = true;
  const exits = [];
  const result = skipSlides((destination) => {
    needsOnboarding = false;
    exits.push(destination);
  });
  assert.equal(needsOnboarding, false, 'navigating to the current dashboard must close its gate');
  assert.deepEqual(exits, ['dashboard']);
  assert.deepEqual(result, { standaloneCompletions: 0, skipEvents: 1 });
});

test('the standalone onboarding route retains its own completion action', () => {
  assert.deepEqual(skipSlides(undefined), { standaloneCompletions: 1, skipEvents: 1 });
});
