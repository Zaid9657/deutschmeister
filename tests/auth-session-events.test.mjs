// AuthContext's reactions to auth events and its signOut() wrapper
// (src/contexts/AuthContext.jsx), executed with tests/helpers/authProvider.mjs.
//
// The defects this closes (cross-check 2026-10-25):
//   SHL-02  Sign-outs that bypass the wrapper — the idle timeout, another tab,
//           an admin sign-out, the one after account deletion — left PostHog
//           attached to the previous learner: only the wrapper reset it.
//   SHL-05  supabase-js emits SIGNED_IN whenever it recovers the stored session
//           (each tab focus, broadcasts from other tabs), and every one of them
//           wrote an 'auth.login' audit row, inflating the admin login metrics.
//   SHL-07  A logout that failed on the network or with a 5xx kept the stored
//           session (auth-js removes it only on 401/403/404) while the navbar
//           went home as if signed out: shared computers stayed signed in. The
//           awaited audit log also made the button wait on getUser().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authHarness, session } from './helpers/authProvider.mjs';

const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

test('every SIGNED_OUT resets analytics, whoever signed the learner out', () => {
  const h = authHarness();
  h.render();
  h.emit('INITIAL_SESSION', session('learner-a'));
  h.calls.length = 0;
  h.emit('SIGNED_OUT', null); // the idle timeout calls supabase.auth.signOut() directly
  assert.ok(h.calls.some(([kind]) => kind === 'resetAnalytics'), 'PostHog must forget the signed-out learner');
});

test('session recovery on tab focus is not a login; a real sign-in is', () => {
  const h = authHarness();
  h.render();
  h.emit('INITIAL_SESSION', session('learner-a'));
  h.emit('SIGNED_IN', session('learner-a')); // tab focus: _recoverAndRefresh
  h.emit('TOKEN_REFRESHED', session('learner-a'));
  h.emit('SIGNED_IN', session('learner-a')); // a broadcast from another tab
  assert.deepEqual(h.audits(), [], 'no auth.login row for a recovered session');

  h.emit('SIGNED_OUT', null);
  h.emit('SIGNED_IN', session('learner-a'));
  assert.deepEqual(h.audits(), ['auth.login'], 'signing in again after a sign-out is a login');

  h.emit('SIGNED_IN', session('learner-b')); // another account in the same tab
  assert.deepEqual(h.audits(), ['auth.login', 'auth.login']);
});

test('a signed-out visitor who signs in writes one login row', () => {
  const h = authHarness();
  h.render();
  h.emit('INITIAL_SESSION', null);
  h.emit('SIGNED_IN', session('learner-a'));
  assert.deepEqual(h.audits(), ['auth.login']);
});

test('a confirmation link is a sign-in even when its INITIAL_SESSION arrives first', () => {
  const justNow = new Date(Date.now() - 5_000).toISOString();
  const h = authHarness({ hash: '#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer&type=signup' });
  h.render();
  h.emit('INITIAL_SESSION', session('learner-new', { createdAt: justNow }));
  h.emit('SIGNED_IN', session('learner-new', { createdAt: justNow }));
  h.emit('SIGNED_IN', session('learner-new', { createdAt: justNow })); // later: tab focus
  assert.deepEqual(h.audits(), ['auth.signup'], 'one row, under the original 60 s signup rule');
});

test('a failed global sign-out retries for this browser alone', async () => {
  const h = authHarness({ signOutResults: [{ error: { message: 'Failed to fetch' } }, { error: null }] });
  const auth = h.render();
  const result = await auth.signOut();
  assert.deepEqual(h.calls.filter(([kind]) => kind === 'signOut'), [['signOut', null], ['signOut', { scope: 'local' }]]);
  assert.equal(result.error, null, 'this browser is signed out');
});

test('when no sign-out reaches the server, the stored session is removed here', async () => {
  const storage = new Map([
    ['sb-omqyueddktqeyrrqvnyq-auth-token', '{"access_token":"x"}'],
    ['sb-omqyueddktqeyrrqvnyq-auth-token-user', '{"user":{}}'],
    ['sb-omqyueddktqeyrrqvnyq-auth-token-code-verifier', 'v'],
    ['dm_cookie_consent', 'accepted'],
    ['deutschmeister_progress', '{}'],
  ]);
  const offline = { error: { message: 'Failed to fetch' } };
  const h = authHarness({ storage, signOutResults: [offline, offline] });
  h.render();
  h.emit('INITIAL_SESSION', session('learner-a'));
  assert.equal(h.render().user.id, 'learner-a');
  await h.render().signOut();
  assert.deepEqual([...storage.keys()].sort(), ['deutschmeister_progress', 'dm_cookie_consent'], 'only the session keys go');
  assert.equal(h.render().user, null, 'the app shows the learner signed out');
});

test('a successful sign-out makes one call and touches no storage itself', async () => {
  const storage = new Map([['sb-x-auth-token', 'kept by auth-js until it removes it']]);
  const h = authHarness({ storage });
  await h.render().signOut();
  assert.deepEqual(h.calls.filter(([kind]) => kind === 'signOut'), [['signOut', null]]);
  assert.equal(storage.size, 1);
});

test('logout never waits on the audit log', async () => {
  const h = authHarness({ auditHangs: true });
  let done = false;
  h.render().signOut().then(() => { done = true; });
  await settle();
  assert.equal(done, true, 'signOut resolved although the audit request never settled');
  assert.deepEqual(h.audits(), ['auth.logout'], 'the logout is still recorded');
});
