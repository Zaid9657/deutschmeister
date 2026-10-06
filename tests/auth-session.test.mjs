// Session handling and account basics (docs/auth-audit-2026-10-06.md).
//
// F1: signup_attempts was readable by every signed-in account (152 email
//     addresses); the migration drops both SELECT policies.
// F2: "Delete account" closed its modal and deleted nothing; it now writes the
//     deletion request mail.
// F4: a 30-minute idle timer called supabase.auth.signOut(), whose default
//     scope is global: one idle tab signed the learner out on every device.
//     Logged 2026-10-06 06:17 UTC: a tab woke, refreshed its token and was
//     logged out 2 s later with no app-level logout.
// F5: every tab return (SIGNED_IN) and token refresh handed AuthContext a new
//     user object for the same person; SubscriptionContext reloaded with
//     loading=true and the guards unmounted the page for a spinner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { sameAuthUser } from '../src/lib/authUser.js';
import { deletionMailto, DELETION_ADDRESS } from '../src/lib/accountDeletion.js';
import { ORGANIZATION_FULL } from '../src/data/organization.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const USER = {
  id: 'u1',
  email: 'a@b.de',
  email_confirmed_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  last_sign_in_at: '2026-10-01T10:00:00Z',
  user_metadata: { starting_point: 'new' },
};

// ─── F5: one user object per person ──────────────────────────────────────────

test('sameAuthUser: the same person in a new object is the same user', () => {
  assert.equal(sameAuthUser(USER, structuredClone(USER)), true);
  // A refresh or a tab return may carry fields the app does not read.
  assert.equal(sameAuthUser(USER, { ...USER, last_sign_in_at: '2026-10-06T06:17:13Z', aud: 'authenticated' }), true);
  assert.equal(sameAuthUser(null, null), true);
  assert.equal(sameAuthUser(undefined, null), true);
});

test('sameAuthUser: any change the app reads is a new user', () => {
  assert.equal(sameAuthUser(USER, { ...USER, id: 'u2' }), false, 'another account');
  assert.equal(sameAuthUser(USER, { ...USER, email: 'c@d.de' }), false, 'email change');
  assert.equal(sameAuthUser({ ...USER, email_confirmed_at: null }, USER), false, 'confirmation drives isEmailVerified');
  assert.equal(sameAuthUser(USER, { ...USER, updated_at: '2026-10-06T00:00:00Z' }), false, 'updateUser bumps updated_at');
  assert.equal(sameAuthUser(USER, { ...USER, user_metadata: { starting_point: 'some' } }), false, 'firstRun reads user_metadata');
  assert.equal(sameAuthUser(null, USER), false, 'sign-in');
  assert.equal(sameAuthUser(USER, null), false, 'sign-out');
});

test('AuthContext stores every session user through sameAuthUser', () => {
  const src = read('src/contexts/AuthContext.jsx');
  assert.match(src, /from '\.\.\/lib\/authUser'/);
  assert.doesNotMatch(src, /setUser\(session\?\.user/, 'a bare setUser(session.user) swaps the object on every tab return');
  const sets = [...src.matchAll(/setUser\(([^)]*\))?[^;]*\);/g)].map((m) => m[0]);
  for (const s of sets) {
    assert.ok(s === 'setUser(null);' || s.startsWith('setUser(keepIfSame('), `unguarded user write: ${s}`);
  }
});

test('SubscriptionContext reloads the account on screen without flipping loading', () => {
  const src = read('src/contexts/SubscriptionContext.jsx');
  const body = src.slice(src.indexOf('const loadSubscriptionData'), src.indexOf('useEffect(() => {\n    loadSubscriptionData();'));
  assert.ok(body.length > 200, 'loadSubscriptionData not found');
  const flips = [...body.matchAll(/setLoading\(true\)/g)];
  assert.equal(flips.length, 1, 'one guarded setLoading(true) in the loader');
  assert.match(body, /if \(loadedForRef\.current !== user\.id\) setLoading\(true\);/, 'only a different (or not yet loaded) account shows the spinner');
  assert.match(body, /loadedForRef\.current = user\.id;/, 'the loaded account is recorded after a successful load');
});

// ─── F4: no idle sign-out ────────────────────────────────────────────────────

test('no idle timer signs the learner out', () => {
  assert.equal(existsSync(join(ROOT, 'src/hooks/useSessionTimeout.js')), false);
  assert.equal(existsSync(join(ROOT, 'src/components/SessionTimeoutModal.jsx')), false);
  const app = read('src/App.jsx');
  assert.doesNotMatch(app, /SessionTimeout/);
  assert.doesNotMatch(read('src/pages/LoginPage.jsx'), /reason=timeout|'timeout'/);
});

test('only the explicit sign-out (AuthContext) and the admin client sign out', () => {
  const callers = ['src/contexts/AuthContext.jsx', 'src/lib/admin/adminFetch.js'];
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      const rel = `${dir}/${name.name}`;
      if (name.isDirectory()) walk(rel);
      else if (/\.(js|jsx)$/.test(name.name) && !callers.includes(rel) && /auth\.signOut\(/.test(read(rel))) offenders.push(rel);
    }
  };
  walk('src');
  assert.deepEqual(offenders, [], `supabase.auth.signOut() defaults to scope 'global' (every device): ${offenders.join(', ')}`);
});

// ─── F2: account deletion is a real request ──────────────────────────────────

test('deletionMailto writes to the published contact point with the account address', () => {
  assert.equal(DELETION_ADDRESS, ORGANIZATION_FULL.contactPoint.email);
  const href = deletionMailto('a+b@x.de');
  assert.ok(href.startsWith(`mailto:${DELETION_ADDRESS}?subject=`));
  const body = decodeURIComponent(href.split('body=')[1]);
  assert.match(body, /Account email: a\+b@x\.de/);
  assert.match(decodeURIComponent(href.split('subject=')[1].split('&')[0]), /Delete my DeutschMeister account/);
});

test('the profile delete button sends the request mail and promises nothing it does not do', () => {
  const src = read('src/pages/ProfilePage.jsx');
  assert.match(src, /href=\{deletionMailto\(user\?\.email\)\}/);
  assert.doesNotMatch(src, /\/\/ Handle account deletion/, 'the no-op handler is back');
  assert.doesNotMatch(src, /will be permanently deleted\. Are you sure/, 'the modal claims an instant deletion again');
});

// ─── F1: signup_attempts is insert-only for clients ──────────────────────────

test('the migration drops both client SELECT policies on signup_attempts', () => {
  const sql = read('migrations/2026-10-06-signup-attempts-no-client-read.sql');
  assert.match(sql, /DROP POLICY IF EXISTS "Authenticated users can read signup attempts" ON public\.signup_attempts;/);
  assert.match(sql, /DROP POLICY IF EXISTS "Only admins can view" ON public\.signup_attempts;/);
  assert.doesNotMatch(sql, /CREATE POLICY/i, 'no new client policy');
  assert.match(read('migrations/README.md'), /2026-10-06-signup-attempts-no-client-read\.sql/);
  // The one reader uses the service role, which needs no policy.
  assert.match(read('netlify/functions/admin-marketing.mjs'), /from\('signup_attempts'\)/);
  assert.doesNotMatch(read('src/pages/SignupPage.jsx'), /from\('signup_attempts'\)\s*\.select/, 'the browser only inserts');
});
