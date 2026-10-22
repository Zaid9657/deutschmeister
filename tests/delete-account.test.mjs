import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const withoutImports = (src) => src.replace(/^import .*;\n/gm, '').replace(/\bexport /g, '');

function endpoint({ deletionError = null, subs = [], env = {} } = {}) {
  const verified = [];
  const selected = [];
  const deleted = [];
  const mails = [];
  const supabase = {
    auth: {
      getUser: async (token) => {
        verified.push(token);
        return token === 'valid-jwt'
          ? { data: { user: { id: 'authenticated-account' } } }
          : { error: new Error('Invalid JWT') };
      },
      admin: {
        getUserById: async (id) => ({ data: { user: { id, email: 'learner@example.com' } } }),
        deleteUser: async (...args) => { deleted.push(args); return { error: deletionError }; },
      },
    },
    from: () => ({ select: (columns) => {
      selected.push(columns);
      return { eq: async () => ({ data: subs, error: null }) };
    } }),
  };
  const fetch = async (url, init) => { mails.push({ url, body: JSON.parse(init.body) }); return { ok: true }; };
  const handler = vm.runInNewContext(`${withoutImports(read('netlify/functions/_shared/auth.mjs'))}
    ${withoutImports(read('netlify/functions/delete-account.mjs'))}; handler`, {
    supabase, fetch, process: { env }, console: { error() {} },
  });
  return { handler, verified, deleted, mails, selected };
}

const POST = { httpMethod: 'POST', headers: { authorization: 'Bearer valid-jwt' }, body: '{}' };

test('a recurring subscription that still charges blocks deletion with 409; a course or cancelled plan does not', async () => {
  const live = endpoint({ subs: [{ status: 'active', plan_type: 'monthly', cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' }] });
  const res = await live.handler(POST);
  assert.equal(res.statusCode, 409);
  assert.match(JSON.parse(res.body).error, /cancel your subscription/i);
  assert.equal(live.deleted.length, 0);
  assert.match(live.selected[0], /lemonsqueezy_subscription_id/);
  for (const subs of [
    [{ status: 'active', plan_type: 'course', cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' }],
    [{ status: 'active', plan_type: 'monthly', cancel_at_period_end: true, lemonsqueezy_subscription_id: 'sub-1' }],
    [{ status: 'expired', plan_type: 'monthly', cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' }],
  ]) {
    const ok = endpoint({ subs });
    assert.equal((await ok.handler(POST)).statusCode, 200, JSON.stringify(subs));
    assert.equal(ok.deleted.length, 1);
  }
});

test('complimentary plans without a real provider subscription never block deletion', async () => {
  for (const status of ['active', 'on_trial', 'past_due', 'unpaid', 'paused']) {
    for (const providerId of [undefined, null, '', '   ']) {
      const granted = endpoint({ subs: [{ status, plan_type: 'monthly', cancel_at_period_end: false, lemonsqueezy_subscription_id: providerId }] });
      assert.equal((await granted.handler(POST)).statusCode, 200, `${status}: ${String(providerId)}`);
      assert.equal(granted.deleted.length, 1);
      assert.equal(granted.mails.length, 0);
    }
    const charging = endpoint({ subs: [{ status, plan_type: 'monthly', cancel_at_period_end: false, lemonsqueezy_subscription_id: 'sub-1' }] });
    assert.equal((await charging.handler(POST)).statusCode, 409, status);
    assert.equal(charging.deleted.length, 0);
  }
});

test('a paused provider subscription requires cancellation before account deletion', async () => {
  for (const cancel_at_period_end of [false, true]) {
    const paused = endpoint({ subs: [{
      status: 'paused', plan_type: 'monthly', cancel_at_period_end, lemonsqueezy_subscription_id: 'sub-paused',
    }] });
    assert.equal((await paused.handler(POST)).statusCode, cancel_at_period_end ? 200 : 409);
    assert.equal(paused.deleted.length, cancel_at_period_end ? 1 : 0);
  }
});

test('a successful deletion mails the owner; missing mail config never blocks it', async () => {
  const mailed = endpoint({ env: { OWNER_ALERT_EMAIL: 'owner@example.com', RESEND_API_KEY: 're_test' } });
  assert.equal((await mailed.handler(POST)).statusCode, 200);
  assert.equal(mailed.mails.length, 1);
  assert.deepEqual(mailed.mails[0].body.to, ['owner@example.com']);
  assert.match(mailed.mails[0].body.subject, /learner@example\.com/);
  const unmailed = endpoint();
  assert.equal((await unmailed.handler(POST)).statusCode, 200);
  assert.equal(unmailed.deleted.length, 1);
  assert.equal(unmailed.mails.length, 0);
});

test('account deletion without a JWT returns 401 even with a forged body user id', async () => {
  const { handler, verified, deleted } = endpoint();
  const res = await handler({ httpMethod: 'POST', headers: {}, body: '{"user_id":"victim"}' });
  assert.equal(res.statusCode, 401);
  assert.equal(verified.length, 0);
  assert.equal(deleted.length, 0);
});

test('account deletion verifies the JWT and ignores body identity', async () => {
  const { handler, verified, deleted } = endpoint();
  const res = await handler({ httpMethod: 'POST', headers: { authorization: 'Bearer valid-jwt' }, body: '{"user_id":"victim","id":"victim"}' });
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).deleted, true);
  assert.deepEqual(verified, ['valid-jwt']);
  assert.deepEqual(deleted.map((args) => [...args]), [['authenticated-account']]);
});

test('invalid JWTs cannot delete accounts and deletion failures are reported', async () => {
  const invalid = endpoint();
  assert.equal((await invalid.handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer forged-jwt' } })).statusCode, 401);
  assert.equal(invalid.deleted.length, 0);
  const failed = endpoint({ deletionError: new Error('private database detail') });
  const res = await failed.handler({ httpMethod: 'POST', headers: { Authorization: 'Bearer valid-jwt' } });
  assert.equal(res.statusCode, 500);
  assert.match(JSON.parse(res.body).error, /deletion failed/i);
  assert.doesNotMatch(res.body, /private database detail/);
});

test('account deletion supports CORS preflight and rejects other methods', async () => {
  const { handler, deleted } = endpoint();
  const preflight = await handler({ httpMethod: 'OPTIONS', headers: { origin: 'https://www.deutsch-meister.de' } });
  assert.equal(preflight.statusCode, 200);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'https://www.deutsch-meister.de');
  const get = await handler({ httpMethod: 'GET', headers: { origin: 'https://untrusted.example' } });
  assert.equal(get.statusCode, 405);
  assert.equal(get.headers['Access-Control-Allow-Origin'], 'https://deutsch-meister.de');
  assert.equal(deleted.length, 0);
});

function profileAction({ emailMatches = true, status = 200, signOutErrors = [] } = {}) {
  const source = read('src/pages/ProfilePage.jsx');
  const start = source.indexOf('const deleteAccount = async');
  assert.ok(start >= 0, 'profile must implement account deletion');
  const action = source.slice(start, source.indexOf('\n  };', start) + 5);
  const actions = [];
  const errors = [];
  const deletionPending = { current: false };
  const context = {
    emailMatches, deletionPending, accountDeleted: false,
    setAccountDeleted: (value) => { context.accountDeleted = value; },
    setDeleting() {}, setDeleteError: (error) => errors.push(error),
    getAuthHeaders: async () => ({ Authorization: 'Bearer valid-jwt' }),
    fetch: async (url, init) => {
      actions.push({ kind: 'delete', url, init });
      return { ok: status === 200, json: async () => status === 200 ? { deleted: true } : { error: 'Please retry deletion' } };
    },
    resetAnalytics: () => actions.push({ kind: 'reset' }),
    supabase: { auth: { signOut: async (options) => {
      actions.push({ kind: 'signOut', scope: options.scope });
      return { error: signOutErrors.shift() || null };
    } } },
    window: { location: { assign: (href) => actions.push({ kind: 'navigate', href }) } },
  };
  const run = vm.runInNewContext(`${action}; deleteAccount`, context);
  return { run, actions, errors };
}

test('profile requires the account email, deletes before signout, and fully loads the homepage', async () => {
  const blocked = profileAction({ emailMatches: false });
  await blocked.run();
  assert.deepEqual(blocked.actions, []);
  const success = profileAction();
  await success.run();
  assert.deepEqual(success.actions.map((a) => a.kind), ['delete', 'reset', 'signOut', 'navigate']);
  assert.equal(success.actions[0].init.headers.Authorization, 'Bearer valid-jwt');
  assert.equal(success.actions[0].init.body, '{}');
  assert.equal(success.actions[2].scope, 'local');
  assert.equal(success.actions[3].href, '/');
  const source = read('src/pages/ProfilePage.jsx');
  assert.match(source, /deleteEmail\.trim\(\) === user\.email/);
  assert.match(source, /disabled=\{!emailMatches \|\| deleting\}/);
  assert.match(source, /role="alert"/);
});

test('profile keeps the session and displays a deletion error when the server fails', async () => {
  const failed = profileAction({ status: 500 });
  await failed.run();
  assert.deepEqual(failed.actions.map((a) => a.kind), ['delete']);
  assert.equal(failed.errors.at(-1), 'Please retry deletion');
});

test('a sign-out failure is visible and can retry without deleting the account again', async () => {
  const h = profileAction({ signOutErrors: [new Error('Network unavailable')] });
  await h.run();
  assert.deepEqual(h.actions.map((a) => a.kind), ['delete', 'reset', 'signOut']);
  assert.match(h.errors.at(-1), /account was deleted, but sign-out failed/);
  await h.run();
  assert.deepEqual(h.actions.map((a) => a.kind), ['delete', 'reset', 'signOut', 'signOut', 'navigate']);
  assert.equal(h.actions.at(-1).href, '/');
});
