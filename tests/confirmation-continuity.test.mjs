import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { AUTH_CONTINUITY_ENABLED } from '../src/lib/authContinuityFlag.js';
import { safeConfirmationDestination, confirmationReturnFromSearch, confirmationEmailRedirect, authEntryPath } from '../src/lib/confirmationContinuity.js';
import { isSafeReturnPath, setReturnPath, peekReturnPath, clearReturnPath } from '../src/lib/returnPath.js';
import { authLinkError, isExpiredLink } from '../src/lib/loginReturn.js';
import { signedInAs, resendRefusal } from '../src/lib/signupConfirmation.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';
import { writingTasksForExam } from '../src/data/writingTasks.js';
import { LEVEL_COURSES, COURSES, PLANS } from '../src/data/pricing.js';

const origin = 'https://deutsch-meister.de';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const destinations = [
  '/course/a1.1/l/1',
  ...EXAM_TRACKS.flatMap((track) => [
    ...(track.hasMock ? [`/modelltest/${track.slug}`] : []),
    ...writingTasksForExam(track.key).map((task) => `/schreiben/${track.slug}?task=${encodeURIComponent(task.taskKey)}`),
  ]),
  ...Object.keys({ ...LEVEL_COURSES, ...COURSES, ...PLANS }).map((key) => `/subscription?buy=${key}`),
];

test('auth continuity is inert by default and leaves existing course returns intact', () => {
  assert.equal(AUTH_CONTINUITY_ENABLED, false);
  assert.equal(confirmationEmailRedirect(origin, '/subscription?buy=monthly'), `${origin}/login`);
  assert.equal(authEntryPath('/signup', '/modelltest/dtz'), '/signup');
  assert.equal(confirmationReturnFromSearch('?continue=%2Fmodelltest%2Fdtz'), null);
  assert.equal(isSafeReturnPath('/modelltest/dtz'), false);
  assert.equal(isSafeReturnPath('/course/a1.1/l/1'), true);
});

test('known tasks and purchases survive a fresh or resent email on a different browser', () => {
  for (const path of destinations) {
    assert.equal(safeConfirmationDestination(path, true), path);
    const email = new URL(confirmationEmailRedirect(origin, path, true));
    assert.equal(email.origin, origin);
    assert.equal(email.pathname, '/login');
    // No local storage or account fields are needed on the receiving browser.
    assert.equal(confirmationReturnFromSearch(email.search, true), path);
    assert.equal(confirmationEmailRedirect(origin, confirmationReturnFromSearch(email.search, true), true), email.href);
    const signup = new URL(authEntryPath('/signup', path, true), origin);
    assert.equal(confirmationReturnFromSearch(signup.search, true), path);
  }
});

test('an expired/already-used link retains only the safe destination for the resend rescue', () => {
  for (const error of ['#error=access_denied&error_code=otp_expired', '&error=access_denied&error_code=otp_expired']) {
    const link = new URL(confirmationEmailRedirect(origin, '/modelltest/dtz', true) + error);
    assert.equal(isExpiredLink(authLinkError(link)), true);
    const path = confirmationReturnFromSearch(link.search, true);
    assert.equal(path, '/modelltest/dtz');
    const fresh = new URL(confirmationEmailRedirect(origin, path, true));
    assert.equal(authLinkError(fresh), null);
    assert.equal(confirmationReturnFromSearch(fresh.search, true), path);
  }
  assert.equal(signedInAs({ user: { email: 'other@example.test' } }, 'learner@example.test'), false);
  assert.equal(resendRefusal({ status: 429, message: 'after 36 seconds' }).wait, 36);
});

test('external, encoded, injected, unknown and duplicate destinations fail closed', () => {
  for (const path of [
    '//evil.test', 'https://evil.test/course/a1.1', '/\\evil.test', '/\n/evil.test',
    '/course/a1.1/../admin', '/course/a1.1?next=//evil.test', '/course/%61%31.1',
    '/modelltest/unknown', '/modelltest/dtz/run', '/modelltest/dtz?next=//evil.test',
    '/modelltest/dtz#access_token=secret', '/schreiben/goethe-a2?task=unknown',
    '/schreiben/goethe-a2?task=sms-einladung-absagen&email=learner@example.test',
    '/subscription?buy=course_made_up', '/subscription?buy=monthly&buy=yearly',
    '/subscription?buy=monthly#x', '/subscription?buy=__proto__', '%2f%2fevil.test', null, {},
  ]) {
    assert.equal(safeConfirmationDestination(path, true), null, String(path));
    assert.equal(authEntryPath('/login', path, true), '/login');
  }
  assert.equal(confirmationReturnFromSearch('?continue=%2Fmodelltest%2Fdtz&continue=%2Fcourse%2Fa1.1', true), null);
});

test('the same owner flag controls the original and all three resend redirect contracts', async () => {
  for (const file of ['src/contexts/AuthContext.jsx', 'src/pages/SignupPage.jsx', 'src/pages/LoginPage.jsx', 'src/pages/VerifyEmailPage.jsx']) {
    const source = read(file);
    const method = file.includes('AuthContext') ? 'signUp' : 'resend';
    const start = source.indexOf(`supabase.auth.${method}(`) + `supabase.auth.${method}(`.length;
    let depth = 0, end;
    for (let i = start; i < source.length; i++) {
      if (source[i] === '(') depth++;
      if (source[i] === ')') { if (depth === 0) { end = i; break; } depth--; }
    }
    const arg = source.slice(start, end);
    for (const enabled of [false, true]) {
      const options = vm.runInNewContext(`(${arg})`, {
        email: 'learner@example.test', sentTo: 'learner@example.test', password: 'unused',
        user: { email: 'learner@example.test' }, window: { location: { origin } },
        AUTH_CONTINUITY_ENABLED: enabled, signupAttributionMetadata: () => ({}),
        confirmationEmailRedirect: (o, path) => confirmationEmailRedirect(o, path, enabled),
        postAuthPath: () => '/subscription?buy=course_a1_2', from: '/subscription?buy=course_a1_2',
      }).options;
      const url = new URL(options.emailRedirectTo);
      assert.equal(url.pathname, '/login');
      assert.equal(confirmationReturnFromSearch(url.search, true), enabled ? '/subscription?buy=course_a1_2' : null, file);
    }
  }
});

test('exam return storage keeps its three-day expiry and cannot be read with the flag off', () => {
  const previous = globalThis.window;
  const values = new Map();
  globalThis.window = { localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) } };
  try {
    const now = 100000;
    setReturnPath('/modelltest/dtz', now, true);
    assert.equal(peekReturnPath(now, true), '/modelltest/dtz');
    assert.equal(peekReturnPath(now, false), null);
    assert.equal(peekReturnPath(now + 3 * 24 * 60 * 60 * 1000 + 1, true), null);
    clearReturnPath();
    assert.equal(peekReturnPath(now, true), null);
  } finally { globalThis.window = previous; }
});

test('confirmation copy names the submitted address and the actual mail subject', () => {
  for (const [page, address] of [['SignupPage', '{sentTo}'], ['VerifyEmailPage', '{user.email}']]) {
    const source = read(`src/pages/${page}.jsx`);
    assert.ok(source.includes(address));
    assert.match(source, /Confirm your DeutschMeister account/);
    assert.match(source, /confirmation link/);
    assert.match(source, /spam folder/);
  }
});

test('an intended task survives onboarding and is consumed only once its gate opens', () => {
  const source = read('src/components/onboarding/OnboardingGate.jsx');
  const effect = source.slice(source.indexOf('  useEffect(() => {') + '  useEffect(() => {'.length, source.indexOf('  }, [user, profileLoaded'));
  for (const enabled of [false, true]) {
    for (const needsOnboarding of [false, true]) {
      for (const profileLoaded of [false, true]) {
        for (const samePath of [false, true]) {
          let cleared = false;
          vm.runInNewContext(`(() => { ${effect} })()`, {
            AUTH_CONTINUITY_ENABLED: enabled, user: { id: 'test' }, needsOnboarding, profileLoaded,
            peekReturnPath: () => '/modelltest/dtz', clearReturnPath: () => { cleared = true; },
            location: { pathname: samePath ? '/modelltest/dtz' : '/dashboard', search: '' },
          }, { timeout: 1000 });
          assert.equal(cleared, enabled && !needsOnboarding && profileLoaded && samePath);
        }
      }
    }
  }
});
