// PostHog keeps the learner's identity that arrived before it could take it
// (src/lib/analytics.js pendingIdentity), and records SPA route changes.
//
// The defects this closes (cross-check 2026-10-25, SHL-03/SHL-04):
//   * identify() returned early unless the lazily imported PostHog had already
//     run init. Its only caller is AuthContext's onAuthStateChange, which fires
//     INITIAL_SESSION before the chunk resolves for a returning learner, and a
//     learner who signs in first and accepts the cookie banner later was
//     identified while no PostHog existed at all. Both stayed anonymous until
//     the next auth event, so per-person trial → offer → purchase funnels broke.
//   * capture_pageview: true records only the first page load in posthog-js
//     1.376; History-API pageviews need 'history_change'.
//
// The identity is held in memory only and applied only once consent has loaded
// PostHog; a sign-out or a withdrawal drops it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

function harness(choice = 'accepted') {
  const store = new Map(choice ? [['dm_cookie_consent', choice]] : []);
  const calls = [];
  let resolveImport;
  const loading = new Promise((resolve) => { resolveImport = resolve; });
  const posthog = Object.fromEntries(
    ['init', 'register', 'identify', 'capture', 'reset', 'opt_in_capturing', 'opt_out_capturing']
      .map((method) => [method, (...args) => calls.push([method, ...args])]),
  );
  const source = read('src/lib/analytics.js')
    .replace(/^import .*;\n/gm, '')
    .replaceAll('import.meta.env.VITE_POSTHOG_KEY', "'test-key'")
    .replaceAll('import.meta.env.VITE_POSTHOG_HOST', "'test-host'")
    .replace("import('posthog-js')", 'loadPosthog()')
    .replace(/^export /gm, '');
  const context = vm.createContext({
    window: { localStorage: { getItem: (key) => store.get(key) ?? null }, location: { pathname: '/dashboard' } },
    getAttribution: () => null,
    isFunnelEvent: () => false,
    sanitizeProps: (props) => props,
    loadPosthog: () => loading,
    console,
  });
  vm.runInContext(source, context);
  return { api: context, store, calls, finishImport: () => resolveImport({ default: posthog }) };
}

const methods = (calls) => calls.map(([method]) => method);
const identified = (calls) => calls.filter(([method]) => method === 'identify').map(([, id]) => id);

test('a learner identified while PostHog still downloads is identified right after init', async () => {
  const { api, calls, finishImport } = harness();
  const loading = api.initAnalytics();
  api.identify('learner-a', { email: 'a@example.com' }); // INITIAL_SESSION beats the chunk
  assert.deepEqual(calls, [], 'nothing leaves the page before init');
  finishImport();
  await loading;
  assert.deepEqual(methods(calls), ['init', 'identify'], 'identify follows init');
  assert.deepEqual(calls[1], ['identify', 'learner-a', { email: 'a@example.com' }]);
});

test('a learner who signs in first and accepts the banner later is identified on accept', async () => {
  const { api, store, calls, finishImport } = harness(null);
  api.identify('learner-b', {});
  await api.initAnalytics(); // page load: no consent yet, a no-op
  assert.deepEqual(calls, []);
  store.set('dm_cookie_consent', 'accepted'); // the banner's Accept → dm-consent-accepted
  const loading = api.initAnalytics();
  finishImport();
  await loading;
  assert.deepEqual(identified(calls), ['learner-b']);
});

test('only the latest identity is kept, and it is applied once', async () => {
  const { api, calls, finishImport } = harness();
  api.identify('learner-a', {});
  api.identify('learner-b', {});
  const loading = api.initAnalytics();
  finishImport();
  await loading;
  await api.initAnalytics();
  assert.deepEqual(identified(calls), ['learner-b']);
});

test('a sign-out before init drops the pending identity', async () => {
  const { api, calls, finishImport } = harness();
  api.identify('learner-a', {});
  api.resetAnalytics();
  const loading = api.initAnalytics();
  finishImport();
  await loading;
  assert.deepEqual(identified(calls), [], 'the next visitor on this browser is not the signed-out learner');
});

test('a withdrawal before init drops the pending identity, so accepting later starts anonymous', async () => {
  const { api, store, calls, finishImport } = harness();
  const loading = api.initAnalytics();
  api.identify('learner-a', {});
  store.set('dm_cookie_consent', 'declined');
  api.withdrawAnalytics();
  finishImport();
  await loading;
  assert.deepEqual(calls, [], 'declined while downloading: no init, no identify');
  store.set('dm_cookie_consent', 'accepted');
  await api.initAnalytics();
  assert.deepEqual(methods(calls), ['init'], 'the identity from before the withdrawal is gone');
});

test('after init identify still requires the current consent', async () => {
  const { api, store, calls, finishImport } = harness();
  const loading = api.initAnalytics();
  finishImport();
  await loading;
  store.set('dm_cookie_consent', 'declined');
  api.identify('learner-a', {});
  assert.deepEqual(identified(calls), []);
  store.set('dm_cookie_consent', 'accepted');
  api.identify('learner-a', {});
  assert.deepEqual(identified(calls), ['learner-a']);
});

test('SPA route changes are recorded as pageviews (History API), page leaves too', async () => {
  const { api, calls, finishImport } = harness();
  const loading = api.initAnalytics();
  finishImport();
  await loading;
  const [, key, options] = calls.find(([method]) => method === 'init');
  assert.equal(key, 'test-key');
  assert.equal(options.capture_pageview, 'history_change', 'true records the first page load only');
  assert.equal(options.capture_pageleave, true);
});
