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
//           awaited audit log also made the button wait on getUser(), and once
//           unawaited, its getUser() still held supabase-js's auth lock ahead of
//           the sign-out — and its row then went out after the sign-out, with
//           the anonymous key instead of the learner's session.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { authHarness, session } from './helpers/authProvider.mjs';

const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

const STORAGE_KEY = 'sb-project-auth-token';

/**
 * A real supabase-js client with learner-a's session stored, whose requests go
 * to a recording fetch and never to the network; `stalled` paths never answer.
 * Browsers serialise auth calls with navigator.locks; Node has none (and
 * supabase-js then runs them unserialised), so a first-come lock stands in.
 */
function liveClient({ stalled = [] } = {}) {
  const store = new Map([[STORAGE_KEY, JSON.stringify({
    access_token: 'token-learner-a',
    refresh_token: 'refresh-learner-a',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'learner-a', email: 'learner-a@example.com', aud: 'authenticated', created_at: '2026-01-01T00:00:00Z' },
  })]]);
  const requests = [];
  let queue = Promise.resolve();
  const lock = (name, acquireTimeout, fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };
  const fetch = (url, init = {}) => {
    const path = new URL(url).pathname;
    requests.push({
      call: `${init.method ?? 'GET'} ${path}`,
      authorization: new Headers(init.headers).get('Authorization'),
      body: typeof init.body === 'string' ? JSON.parse(init.body) : null,
    });
    if (stalled.includes(path)) return new Promise(() => {});
    if (path === '/auth/v1/logout') return Promise.resolve(new Response(null, { status: 204 }));
    if (path.startsWith('/rest/v1/')) return Promise.resolve(new Response(null, { status: 201 }));
    return Promise.resolve(Response.json({}));
  };
  const client = createClient('https://project.example.invalid', 'anon-key', {
    auth: {
      storage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => { store.set(key, value); }, removeItem: (key) => { store.delete(key); } },
      storageKey: STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      lock,
    },
    global: { fetch },
  });
  return { client, requests, store };
}

/** The promise's value, or 'still waiting' after `ms`. */
const within = (promise, ms) => new Promise((resolve) => {
  const timer = setTimeout(resolve, ms, 'still waiting');
  promise.then((value) => { clearTimeout(timer); resolve(value); });
});

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
  h.render();
  h.emit('INITIAL_SESSION', session('learner-a'));
  let done = false;
  h.render().signOut().then(() => { done = true; });
  await settle();
  assert.equal(done, true, 'signOut resolved although the audit request never settled');
  assert.deepEqual(h.calls.filter(([kind]) => kind === 'audit'), [['audit', 'auth.logout', 'learner-a']],
    'the logout is recorded for the learner the provider knows, without a user lookup');
});

test('a sign-out with nobody signed in writes no audit row', async () => {
  const h = authHarness();
  h.render();
  h.emit('INITIAL_SESSION', null);
  await h.render().signOut();
  assert.deepEqual(h.audits(), []);
});

test('the stored session read at startup is not a login, whenever the provider subscribed', () => {
  // supabase-js announces the session it reads from storage with SIGNED_IN; a
  // provider that subscribed before that read finished hears it first.
  const h = authHarness();
  h.render();
  h.emit('SIGNED_IN', session('learner-a'));
  h.emit('INITIAL_SESSION', session('learner-a'));
  assert.deepEqual(h.audits(), []);
  h.emit('SIGNED_OUT', null);
  h.emit('SIGNED_IN', session('learner-a'));
  assert.deepEqual(h.audits(), ['auth.login'], 'a sign-in after that is one');

  const link = authHarness({ hash: '#access_token=abc&expires_in=3600&refresh_token=def&token_type=bearer' });
  link.render();
  link.emit('SIGNED_IN', session('learner-b'));
  assert.deepEqual(link.audits(), ['auth.login'], 'tokens in the URL are a sign-in even as the first event');
});

test('with the real supabase-js client, logout waits on no audit request and its row keeps the session', async () => {
  // Every request that could hold up a logout never answers: the user lookup the
  // audit log used to make under the auth lock, and the audit insert itself.
  const live = liveClient({ stalled: ['/auth/v1/user', '/rest/v1/audit_logs'] });
  const h = authHarness({ client: live.client });
  h.render(); // subscribes before supabase-js has read the stored session
  await live.client.auth.getSession(); // queued behind the provider's own session load
  const auth = h.render();
  assert.equal(auth.user?.id, 'learner-a');

  assert.equal(await within(auth.signOut().then(() => 'signed out'), 1000), 'signed out',
    'signOut resolved while the audit request hung');
  assert.equal(live.store.has(STORAGE_KEY), false, 'the stored session is gone');
  await new Promise((resolve) => setImmediate(resolve)); // anything still queued goes out

  const calls = live.requests.map(({ call }) => call);
  assert.ok(!calls.includes('GET /auth/v1/user'), `no user lookup during logout: ${calls.join(', ')}`);
  const rows = live.requests.filter(({ call }) => call === 'POST /rest/v1/audit_logs');
  assert.deepEqual(rows.map(({ body }) => [body.event_type, body.user_id]), [['auth.logout', 'learner-a']],
    'one row, the logout: loading the stored session at startup wrote no login row');
  assert.equal(rows[0].authorization, 'Bearer token-learner-a', 'sent with the learner\'s session, not the anonymous key');
  assert.ok(calls.indexOf('POST /rest/v1/audit_logs') < calls.indexOf('POST /auth/v1/logout'),
    `the row leaves before the sign-out request: ${calls.join(', ')}`);
});
