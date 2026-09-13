// Admin panel, phase 1 — the ONE transport.
//
//   Source scan (the guard that keeps the 401 fix true): no admin screen or
//   component builds its own Authorization header or fetches an admin-*
//   function directly. The bug only needs ONE call site to come back.
//
//   Behaviour: no session → throws; 401 → refresh → retry → success;
//   401 → refresh → 401 → throws; 403 → returned untouched, banner not raised;
//   200 after an earlier failure → banner cleared.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { createAdminFetch, AdminSessionExpired, describeAdminError } from '../src/lib/admin/adminFetchCore.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(jsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

test('no admin screen or component attaches its own Authorization header or calls an admin-* function directly', () => {
  const files = [...walk(join(ROOT, 'src/pages/admin')), ...walk(join(ROOT, 'src/components/admin')), join(ROOT, 'src/pages/AdminVideosPage.jsx')];
  assert.ok(files.length > 5, 'the admin tree did not load');
  const failures = [];
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    if (/Authorization:\s*`Bearer/.test(src) || /Authorization['"]?\s*:/.test(src)) failures.push(`${f}: builds an Authorization header`);
    if (/fetch\(\s*['"`]\/\.netlify\/functions\/admin-/.test(src)) failures.push(`${f}: fetches an admin-* function directly`);
    if (/getAuthHeaders\(/.test(src)) failures.push(`${f}: uses getAuthHeaders instead of adminFetch`);
  }
  assert.deepEqual(failures, []);
});

test('the wired transport is the only module that passes a token to admin functions', () => {
  const wired = readFileSync(join(ROOT, 'src/lib/admin/adminFetch.js'), 'utf8');
  assert.ok(wired.includes('createAdminFetch('));
  assert.ok(wired.includes("signOut({ scope: 'local' })"), 'the expiry button must sign out locally only');
});

function harness({ session = 'tok', refreshed = 'tok2', responses = [] } = {}) {
  const calls = [];
  const banner = [];
  const t = createAdminFetch({
    getSession: async () => session,
    refreshSession: async () => refreshed,
    fetchImpl: async (url, init) => {
      calls.push({ url, auth: init.headers.Authorization });
      const status = responses.shift() ?? 200;
      return { status, ok: status < 400, json: async () => ({ status }) };
    },
  });
  t.onAdminSessionChange((v) => banner.push(v));
  return { ...t, calls, banner };
}

test('no session → throws AdminSessionExpired and raises the banner', async () => {
  const h = harness({ session: null });
  await assert.rejects(() => h.adminFetch('admin-session'), AdminSessionExpired);
  assert.deepEqual(h.banner, [false, true]);
  assert.equal(h.calls.length, 0);
});

test('401 → one refresh → one retry → success, banner clear', async () => {
  const h = harness({ responses: [401, 200] });
  const res = await h.adminFetch('admin-session', { a: 1 });
  assert.equal(res.status, 200);
  assert.deepEqual(h.calls.map((c) => c.auth), ['Bearer tok', 'Bearer tok2']);
  assert.equal(h.banner.at(-1), false);
});

test('401 → refresh → 401 → throws; never a third attempt', async () => {
  const h = harness({ responses: [401, 401, 200] });
  await assert.rejects(() => h.adminFetch('admin-session'), AdminSessionExpired);
  assert.equal(h.calls.length, 2);
  assert.equal(h.banner.at(-1), true);
});

test('401 → refresh fails → throws without a retry', async () => {
  const h = harness({ responses: [401], refreshed: null });
  await assert.rejects(() => h.adminFetch('admin-session'), AdminSessionExpired);
  assert.equal(h.calls.length, 1);
});

test('403 is returned untouched and does not raise the banner; adminCall renders it as a role message', async () => {
  const h = harness({ responses: [403, 403] });
  const res = await h.adminFetch('admin-users');
  assert.equal(res.status, 403);
  assert.equal(h.calls.length, 1);
  assert.equal(h.banner.at(-1), false);
  await assert.rejects(() => h.adminCall('admin-users'), /Keine Berechtigung/);
});

test('a 200 after an earlier expiry clears the banner', async () => {
  const h = harness({ responses: [401, 401, 200] });
  await assert.rejects(() => h.adminFetch('x'), AdminSessionExpired);
  assert.equal(h.isExpired(), true);
  const res = await h.adminFetch('x');
  assert.equal(res.status, 200);
  assert.equal(h.isExpired(), false);
  assert.equal(describeAdminError(new AdminSessionExpired()), 'Ihre Sitzung ist abgelaufen — bitte oben erneut anmelden.');
});
