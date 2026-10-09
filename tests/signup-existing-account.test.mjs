// /signup when the address already has a confirmed account
// (existingAccount in src/lib/signupConfirmation.js).
//
// Supabase answers such a signUp with HTTP 200, no session and NO mail: GoTrue
// logs user_repeated_signup and returns a stand-in user whose `identities` list
// is empty (its sanitizeUser). Auth audit logs, 2026-09-22 16:30 to 2026-10-06
// 16:30 UTC: 8 repeat signups from 6 accounts. Since the inbox panel shipped
// (#179, 2026-10-03) such an answer opened "We sent a confirmation link to:" for
// a mail that never comes; before it, /verify-email bounced the visitor to
// /login, and 4 of the 8 logged in within the hour.
//
// tests/signup-confirmation.test.mjs still pins signupOutcome() to
// 'check-email' for that answer. The routing outcome is unchanged; what the page
// shows for it is decided by existingAccount(), which the page checks before it
// opens the panel (pinned below).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { existingAccount, signupOutcome } from '../src/lib/signupConfirmation.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// What POST /auth/v1/signup returns with "Confirm email" on. The stand-in for a
// confirmed address: a fresh random id, no role, nothing confirmed, and no
// identities. A new (or never-confirmed) address: the real user with its email
// identity, and a confirmation mail on its way.
const STAND_IN = {
  id: '6f0c2a8e-3b1d-4c55-9a7e-2d8f1b0c9e41',
  aud: 'authenticated',
  role: '',
  email: 'learner@example.com',
  phone: '',
  confirmation_sent_at: '2026-10-02T17:07:23Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { acquisition_first_source: 'google' },
  identities: [],
  created_at: '2026-10-02T17:07:23Z',
  updated_at: '2026-10-02T17:07:23Z',
  is_anonymous: false,
};
const NEW_USER = {
  ...STAND_IN,
  role: 'authenticated',
  identities: [{
    identity_id: '0d6b3f2a-71c4-4e8e-b1a9-5c2e7f904d13',
    id: STAND_IN.id,
    user_id: STAND_IN.id,
    provider: 'email',
    identity_data: { email: 'learner@example.com', email_verified: false, phone_verified: false, sub: STAND_IN.id },
    email: 'learner@example.com',
  }],
};

// The real client, answering from a canned body: what the page receives is what
// supabase-js makes of GoTrue's JSON, not what we assume it makes of it.
async function signUpAnswering(body) {
  const fetch = async () => new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  const client = createClient('https://example.supabase.co', 'anon-key', {
    global: { fetch },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client.auth.signUp({
    email: 'learner@example.com',
    password: 'secret-123',
    options: { emailRedirectTo: 'https://deutsch-meister.de/login' },
  });
}

test('supabase-js hands the stand-in through: an existing account; a new address is not', async () => {
  const known = await signUpAnswering(STAND_IN);
  assert.equal(known.error, null);
  assert.equal(known.data.session, null);
  assert.deepEqual(known.data.user.identities, []);
  assert.equal(existingAccount(known), true);
  // It routes like any session-less answer, which is why the page must ask
  // existingAccount() before it falls through to the inbox panel.
  assert.equal(signupOutcome(known), 'check-email');

  const fresh = await signUpAnswering(NEW_USER);
  assert.equal(fresh.data.user.identities.length, 1);
  assert.equal(existingAccount(fresh), false);
  assert.equal(signupOutcome(fresh), 'check-email');
});

test('only an explicit empty identities list on a session-less, error-free answer counts', () => {
  // A user without the list is an unknown shape: it keeps the inbox panel.
  assert.equal(existingAccount({ data: { user: { id: 'u1' }, session: null }, error: null }), false);
  assert.equal(existingAccount({ data: { user: { id: 'u2', identities: [] }, session: { access_token: 't' } }, error: null }), false);
  assert.equal(existingAccount({ data: { user: { id: 'u3', identities: [] }, session: null }, error: { message: 'x' } }), false);
  assert.equal(existingAccount({ data: { user: null, session: null }, error: { message: 'Signup failed' } }), false);
  assert.equal(existingAccount(null), false);
  assert.equal(existingAccount(undefined), false);
});

test('/signup asks existingAccount before it opens the inbox panel, and that branch promises no mail', () => {
  const src = read('src/pages/SignupPage.jsx');
  const submit = src.slice(src.indexOf('const handleSubmit'), src.indexOf('const handleResend'));
  const known = submit.indexOf('existingAccount({ data, error })');
  const panel = submit.indexOf('setSentTo(email.trim());');
  assert.ok(known > 0, 'handleSubmit asks existingAccount');
  assert.ok(panel > known, 'the existing-account branch comes before the inbox panel');
  const branch = submit.slice(known, panel);
  assert.match(branch, /setKnownAddress\(email\.trim\(\)\);/);
  // The panel, its funnel event and its resend countdown belong to a mail
  // that was actually sent.
  const ownBranch = branch.slice(0, branch.indexOf('} else {'));
  assert.doesNotMatch(ownBranch, /setSentTo|trackVerificationPageViewed|setCooldown/);
  // A new submit clears the notice before it asks again.
  assert.match(submit, /setError\(''\);\s*setKnownAddress\(''\);/);
});

test('the notice names the address, says no mail was sent, and offers log in and a password reset', () => {
  const src = read('src/pages/SignupPage.jsx');
  const start = src.indexOf('{knownAddress && (');
  assert.ok(start > 0, 'the notice renders on knownAddress');
  const notice = src.slice(start, src.indexOf('{sentTo ? (', start));
  assert.match(notice, /\{knownAddress\}/);
  assert.match(notice, /No new email was sent\./);
  assert.match(notice, /<Link to="\/login"/);
  assert.match(notice, /<Link to="\/reset-password"/);
  assert.doesNotMatch(notice, /sent a confirmation|check your inbox/i);
  // Focus moves to it, as it does to the panel's heading.
  assert.match(src, /if \(knownAddress\) knownHeading\.current\?\.focus\(\);/);
  assert.match(notice, /ref=\{knownHeading\} tabIndex=\{-1\}/);
});

test('premise: /login and /reset-password are unguarded public routes in production', () => {
  const app = read('src/App.jsx');
  assert.match(app, /<Route path="\/login" element=\{<LoginPage \/>\} \/>/);
  assert.match(app, /<Route path="\/reset-password" element=\{<ResetPasswordPage \/>\} \/>/);
  const toml = read('netlify.toml');
  assert.match(toml, /from = "\/login"/);
  assert.match(toml, /from = "\/reset-password"/);
});
