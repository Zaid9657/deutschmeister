// "Continue with Google" (src/lib/googleSignIn.js; plan "Stop the leaks", step 1).
//
// Measured 2026-11-15: 25–29% of new signups never confirm their email and 93%
// of addresses are gmail.com. These tests pin the three things that must hold:
// the button ships OFF until the owner switches the provider on, the sign-in
// lands where the confirmation link lands, and a Google sign-up still records
// which link brought the learner.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GOOGLE_SIGNIN_ENABLED, googleRedirectTo, attributionBackfill } from '../src/lib/googleSignIn.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('the Google button is off by default and only its own flag turns it on', () => {
  assert.equal(GOOGLE_SIGNIN_ENABLED, false);
  const flag = read('src/lib/googleSignIn.js');
  assert.match(flag, /VITE_GOOGLE_SIGNIN_ENABLED === 'true'/);
  const button = read('src/components/ui/GoogleButton.jsx');
  assert.match(button, /if \(!GOOGLE_SIGNIN_ENABLED\) return null;/);
});

test('Google sign-in lands on /login, the page that forwards a signed-in visitor to their saved place', () => {
  assert.equal(googleRedirectTo('https://deutsch-meister.de'), 'https://deutsch-meister.de/login');
  const auth = read('src/contexts/AuthContext.jsx');
  assert.match(auth, /signInWithOAuth\(\{\s*provider: 'google',\s*options: \{ redirectTo: googleRedirectTo\(window\.location\.origin\) \}/);
  assert.match(auth, /\r?\n {4}signInWithGoogle,\r?\n/);
});

test('both account doors offer it, above the email form; the signup door counts the click', () => {
  const signup = read('src/pages/SignupPage.jsx');
  const login = read('src/pages/LoginPage.jsx');
  assert.ok(signup.indexOf('<GoogleButton onStart={trackSignupStarted} />') < signup.indexOf('<form onSubmit={handleSubmit}'));
  assert.ok(signup.includes('<GoogleButton onStart={trackSignupStarted} />'));
  assert.ok(login.includes('<GoogleButton />'));
  assert.ok(login.indexOf('<GoogleButton />') < login.indexOf('<form onSubmit={handleSubmit}'));
});

test('a Google sign-up writes its attribution once; nothing else does', () => {
  const meta = { acquisition_source: 'google', acquisition_medium: 'organic', acquisition_last_source: 'google' };
  const google = { id: 'u1', app_metadata: { provider: 'google' } };
  assert.deepEqual(attributionBackfill(google, meta), meta);
  // Email sign-ups carry the metadata in auth.signUp; the trigger copies it.
  assert.equal(attributionBackfill({ id: 'u2', app_metadata: { provider: 'email' } }, meta), null);
  // An unattributed visitor ({}): no write, so NULL keeps meaning "untracked".
  assert.equal(attributionBackfill(google, {}), null);
  assert.equal(attributionBackfill(google, null), null);
  assert.equal(attributionBackfill(null, meta), null);
  // The write never overwrites a first touch, and only follows a fresh signup.
  const auth = read('src/contexts/AuthContext.jsx');
  assert.match(auth, /\.update\(backfill\)\.eq\('id', session\.user\.id\)\.is\('acquisition_source', null\)/);
  assert.ok(auth.indexOf('claimSignupCompletion(session.user)') < auth.indexOf('attributionBackfill(session.user'));
});

test('the Google mark is an asset, so no colour literal enters the components', () => {
  const button = read('src/components/ui/GoogleButton.jsx');
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(button));
  assert.match(button, /src="\/google-g\.svg"/);
  assert.match(read('public/google-g.svg'), /^<svg /);
});
