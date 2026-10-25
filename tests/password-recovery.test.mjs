// /update-password changes a password only for the account its reset link
// signed in (src/pages/UpdatePasswordPage.jsx, src/contexts/AuthContext.jsx,
// src/lib/loginReturn.js authLinkError).
//
// The defects this closes (cross-check 2026-10-25, SHL-08):
//   * An expired reset link lands on /update-password with GoTrue's error in the
//     hash. supabase-js keeps whatever session the browser already had ("don't
//     remove existing session on URL login failure"), and the page accepted a
//     new password for it: account B, signed in on this browser, had its
//     password changed by a link meant for account A — reported as a success.
//   * With no session at all the page showed the form anyway and, after the
//     password was typed twice, GoTrue's raw "Auth session missing!" with no way
//     to request a new link.
//   * Neither the reset nor the update page tied its labels to its inputs, set
//     autocomplete, or named the show-password toggle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authLinkError, isExpiredLink } from '../src/lib/loginReturn.js';
import { authHarness, session } from './helpers/authProvider.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
/** Comments out, so a doc comment cannot satisfy a pin. */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

const EXPIRED_HASH = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';

test('the error a reset link came back with is read from the hash or the query', () => {
  assert.deepEqual({ ...authLinkError({ hash: EXPIRED_HASH, search: '' }) }, {
    error: 'access_denied', code: 'otp_expired', description: 'Email link is invalid or has expired',
  });
  assert.equal(authLinkError({ hash: '', search: '?error=server_error&error_description=Unable+to+exchange' }).error, 'server_error');
  assert.ok(isExpiredLink(authLinkError({ hash: EXPIRED_HASH })));
  assert.ok(!isExpiredLink(authLinkError({ search: '?error=server_error' })));
});

test('a working recovery link and an ordinary visit carry no link error', () => {
  for (const location of [
    { hash: '#access_token=a&expires_in=3600&refresh_token=b&token_type=bearer&type=recovery', search: '' },
    { hash: '', search: '' },
    { hash: '#', search: '?' },
    {},
    null,
  ]) {
    assert.equal(authLinkError(location), null, JSON.stringify(location));
  }
});

test('an expired link replaces the form with the way to a new link', () => {
  const src = code(read('src/pages/UpdatePasswordPage.jsx'));
  assert.match(src, /import \{ authLinkError \} from '\.\.\/lib\/loginReturn';/);
  assert.match(src, /const \[linkError\] = useState\(\(\) => authLinkError\(location\)\);/);
  const branch = src.indexOf('if (linkError) {');
  assert.ok(branch > 0, 'the page branches on the link error');
  const form = src.indexOf('<form');
  assert.ok(branch < form, 'the error screen returns before the form renders');
  const screen = src.slice(branch, form);
  assert.match(screen, /This link is invalid or has expired/);
  assert.match(screen, /to="\/reset-password"/);
  assert.doesNotMatch(screen, /<input/);
});

test('the form opens only after the recovery signal, never for a session alone', () => {
  const src = code(read('src/pages/UpdatePasswordPage.jsx'));
  assert.match(src, /const \{ updatePassword, passwordRecovery, loading: authLoading \} = useAuth\(\);/);
  assert.match(src, /<fieldset disabled=\{!passwordRecovery\}/, 'inputs and submit are disabled without the signal');
  // The handler refuses too, before anything reaches updateUser.
  const handler = src.match(/const handleSubmit = async \(e\) => \{([\s\S]*?)\n {2}\};/)[1];
  assert.ok(handler.indexOf('if (!passwordRecovery) return;') >= 0);
  assert.ok(handler.indexOf('if (!passwordRecovery) return;') < handler.indexOf('updatePassword('));
  assert.match(src, /\{!authLoading && !passwordRecovery && \(/, 'a signed-in visitor without the link is told what to do');
});

test('AuthContext captures PASSWORD_RECOVERY even before the provider subscribes', () => {
  const recovery = session('learner-a');
  // supabase-js reads the URL at import; the event can beat the first render.
  const early = authHarness({ hash: '#access_token=a&type=recovery' });
  early.emit('PASSWORD_RECOVERY', recovery);
  assert.equal(early.render().passwordRecovery, true);

  // Between the first render and the provider's effect.
  const between = authHarness({ hash: '#access_token=a&type=recovery' });
  assert.equal(between.render({ runEffects: false }).passwordRecovery, false);
  between.emit('PASSWORD_RECOVERY', recovery);
  between.flushEffects();
  assert.equal(between.render().passwordRecovery, true);

  // After it.
  const late = authHarness();
  late.render();
  late.emit('PASSWORD_RECOVERY', recovery);
  assert.equal(late.render().passwordRecovery, true);
});

test('a session that merely exists is not a recovery, and a sign-out ends one', () => {
  const h = authHarness({ hash: EXPIRED_HASH });
  h.render();
  h.emit('INITIAL_SESSION', session('learner-b')); // the expired link left B signed in
  h.emit('SIGNED_IN', session('learner-b'));
  const value = h.render();
  assert.equal(value.user.id, 'learner-b');
  assert.equal(value.passwordRecovery, false, 'B must not be offered a password change');

  h.emit('PASSWORD_RECOVERY', session('learner-a'));
  assert.equal(h.render().passwordRecovery, true);
  h.emit('SIGNED_OUT', null);
  assert.equal(h.render().passwordRecovery, false);
});

test('both password pages name their fields, set autocomplete and label the toggle', () => {
  const update = code(read('src/pages/UpdatePasswordPage.jsx'));
  for (const id of ['new-password', 'confirm-password']) {
    assert.match(update, new RegExp(`<label htmlFor="${id}"`), `${id} has no associated label`);
    assert.match(update, new RegExp(`id="${id}"\\s+type=\\{showPassword \\? 'text' : 'password'\\}\\s+autoComplete="new-password"`));
  }
  assert.match(update, /aria-label=\{showPassword \? 'Hide password' : 'Show password'\}/);
  assert.match(update, /className="absolute right-1 top-1\/2 flex h-11 w-11 /, 'a 44 px target, like the login toggle');

  const reset = code(read('src/pages/ResetPasswordPage.jsx'));
  assert.match(reset, /<label htmlFor="reset-email"/);
  assert.match(reset, /id="reset-email"\s+type="email"\s+autoComplete="email"/);
});
