// /signup after a successful signUp (src/lib/signupConfirmation.js).
//
// With "Confirm email" on, signUp returns no session. /signup used to navigate
// to /verify-email regardless, which redirects a visitor without a session to
// /login, so every new learner met "Welcome Back" and a password form. Auth
// logs 2026-10-01/03: 4 of 4 new accounts tried a password login 6 to 14 s
// after signing up and were refused "Email not confirmed"; 2 hit the 60 s
// resend limit (429); 1 never confirmed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  signupOutcome,
  resendWaitSeconds,
  resendRefusal,
  signedInAs,
  RESEND_COOLDOWN_SECONDS,
  UNTIMED_REFUSALS_BEFORE_LIMIT_NOTICE,
} from '../src/lib/signupConfirmation.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('a signUp without a session means "check your inbox"; only a session goes on to /verify-email', () => {
  assert.equal(signupOutcome({ data: { user: { id: 'u1' }, session: null }, error: null }), 'check-email');
  // An address that already has an account answers the same way (no session),
  // and the page says the same thing: nothing about the account is revealed.
  assert.equal(signupOutcome({ data: { user: { id: 'u2', identities: [] }, session: null }, error: null }), 'check-email');
  assert.equal(signupOutcome({ data: { user: { id: 'u3' }, session: { access_token: 't' } }, error: null }), 'signed-in');
  assert.equal(signupOutcome({ data: { user: null, session: null }, error: { message: 'Signup failed' } }), 'error');
});

test('a refused resend waits out the per-address limit instead of showing the raw 429', () => {
  // The two refusals auth logged for one learner on 2026-10-02, 24 s and 54 s
  // after the 14:07:00 signup: 24 + 36 = 54 + 6 = 60 s per address.
  const at24 = { code: 'over_email_send_rate_limit', status: 429, message: 'For security purposes, you can only request this after 36 seconds.' };
  const at54 = { code: 'over_email_send_rate_limit', message: 'For security purposes, you can only request this after 6 seconds.' };
  assert.equal(resendWaitSeconds(at24), 36);
  assert.equal(resendWaitSeconds(at54), 6);
  assert.equal(RESEND_COOLDOWN_SECONDS, 60);
  // A 429 without a number waits the full window; any other error is shown.
  assert.equal(resendWaitSeconds({ status: 429, message: 'Too many requests' }), RESEND_COOLDOWN_SECONDS);
  assert.equal(resendWaitSeconds({ code: 'email_address_invalid', status: 400, message: 'Email address is invalid' }), null);
  assert.equal(resendWaitSeconds(null), null);
});

test('/signup routes on the outcome and shows the address the link went to', () => {
  const src = read('src/pages/SignupPage.jsx');
  assert.match(src, /const outcome = signupOutcome\(\{ data, error \}\);/);
  assert.match(src, /outcome === 'signed-in'\) \{\s*navigate\('\/verify-email', \{ replace: true \}\);/);
  assert.equal((src.match(/navigate\('\/verify-email'/g) || []).length, 1, 'no other path to /verify-email');
  assert.match(src, /setSentTo\(email\.trim\(\)\);/);
  assert.match(src, /\{sentTo\}/);
  // Same subject the login page's rescue names, so both screens send the
  // learner to the same mail.
  const subject = '&ldquo;Confirm your DeutschMeister account&rdquo;';
  assert.ok(src.includes(subject));
  assert.ok(read('src/pages/LoginPage.jsx').includes(subject));
  // The resend cannot fire inside the window that produced the 429s.
  assert.match(src, /setCooldown\(RESEND_COOLDOWN_SECONDS\);/);
  assert.match(src, /disabled=\{cooldown > 0 \|\| resendState === 'sending'\}/);
});

test('a resent link lands where the first one does', () => {
  const redirect = /emailRedirectTo: `\$\{window\.location\.origin\}\/login`/;
  assert.match(read('src/pages/SignupPage.jsx'), redirect);
  assert.match(read('src/contexts/AuthContext.jsx'), redirect);
});

test('premise: /verify-email sends a visitor without a session to /login', () => {
  // Why /signup keeps the learner instead. If /verify-email learns to serve a
  // session-less visitor, revisit SignupPage's 'check-email' branch.
  assert.match(read('src/pages/VerifyEmailPage.jsx'), /if \(!user\) \{\s*navigate\('\/login', \{ replace: true \}\);/);
});

// Follow-ups from the #179 review (2026-10-03): a refusal without a number,
// and a confirmation in another tab.
const timed = (n) => ({ code: 'over_email_send_rate_limit', status: 429, message: `For security purposes, you can only request this after ${n} seconds.` });
const untimed = { code: 'over_email_send_rate_limit', status: 429, message: 'email rate limit exceeded' };

/** The panel's resend state after a run of refusals, as handleResend folds them. */
const fold = (errors) =>
  errors.reduce((st, e) => {
    const r = resendRefusal(e, st.untimed);
    return r ? { untimed: r.untimed, limitReached: r.limitReached, wait: r.wait } : { untimed: 0, limitReached: false, wait: 0 };
  }, { untimed: 0, limitReached: false, wait: 0 });

test('a refusal without a number says the limit is reached on the second in a row, instead of counting down forever', () => {
  assert.equal(UNTIMED_REFUSALS_BEFORE_LIMIT_NOTICE, 2);
  assert.deepEqual(resendRefusal(untimed, 0), { wait: RESEND_COOLDOWN_SECONDS, untimed: 1, limitReached: false });
  assert.deepEqual(resendRefusal(untimed, 1), { wait: RESEND_COOLDOWN_SECONDS, untimed: 2, limitReached: true });
  assert.equal(fold([untimed, untimed]).limitReached, true);
  assert.equal(fold([untimed, untimed, untimed]).limitReached, true);
  // Only a run counts: a refusal that names its wait is the 60 s window again.
  assert.deepEqual(resendRefusal(timed(36), 1), { wait: 36, untimed: 0, limitReached: false });
  assert.equal(fold([untimed, timed(12), untimed]).limitReached, false);
  assert.equal(fold([untimed, untimed, timed(12)]).limitReached, false);
  // A bare 429 status counts the same as the code.
  assert.equal(fold([{ status: 429, message: 'Too many requests' }, { status: 429 }]).limitReached, true);
});

test('"after 0 seconds" names its wait, so it never counts toward the notice', () => {
  // signup_attempts holds 10 of these (2026-10-03).
  assert.equal(resendRefusal(timed(0), 1).untimed, 0);
  assert.equal(fold([timed(0), timed(0), timed(0)]).limitReached, false);
  assert.equal(resendWaitSeconds(timed(0)), RESEND_COOLDOWN_SECONDS, 'the wait it falls back to is unchanged');
});

test('any other refusal is shown as a message, not a countdown', () => {
  assert.equal(resendRefusal({ code: 'email_address_invalid', status: 400, message: 'Email address is invalid' }, 1), null);
  assert.equal(resendRefusal(null, 1), null);
});

test('only a session of the address the link went to moves the panel on', () => {
  assert.equal(signedInAs({ user: { email: 'lerner@example.com' } }, 'lerner@example.com'), true);
  // Supabase stores the address lower-cased; the learner may have typed capitals.
  assert.equal(signedInAs({ user: { email: 'lerner@example.com' } }, ' Lerner@Example.com '), true);
  // An account already signed in on this browser is not the new one.
  assert.equal(signedInAs({ user: { email: 'someone.else@example.com' } }, 'lerner@example.com'), false);
  assert.equal(signedInAs(null, 'lerner@example.com'), false);
  assert.equal(signedInAs({ user: {} }, 'lerner@example.com'), false);
  assert.equal(signedInAs({ user: { email: 'lerner@example.com' } }, ''), false);
});

test('/signup listens for the sign-in while the panel shows, and lets go of the listener', () => {
  const src = read('src/pages/SignupPage.jsx');
  const effect = /useEffect\(\(\) => \{\s*if \(!sentTo\) return undefined;\s*const \{ data: \{ subscription \} \} = supabase\.auth\.onAuthStateChange\(\(_event, session\) => \{\s*if \(signedInAs\(session, sentTo\)\) navigate\(postAuthPath\(\), \{ replace: true \}\);\s*\}\);\s*return \(\) => subscription\.unsubscribe\(\);\s*\}, \[sentTo, navigate\]\);/;
  assert.match(src, effect);
  assert.equal((src.match(/onAuthStateChange\(/g) || []).length, 1, 'one listener');
  assert.match(src, /^import \{ postAuthPath \} from '\.\.\/lib\/buyIntent';$/m);
});

test('/signup folds refusals through resendRefusal and shows the limit notice', () => {
  const src = read('src/pages/SignupPage.jsx');
  assert.match(src, /const refusal = resendRefusal\(resendError, untimedRefusals\);/);
  assert.match(src, /setLimitReached\(refusal\.limitReached\);/);
  assert.match(src, /\{limitReached && \(/);
  assert.match(src, /The limit for confirmation emails is reached for now/);
  // A success, another error and a new address each end the run.
  assert.ok((src.match(/setUntimedRefusals\(0\);/g) || []).length >= 3);
  assert.ok((src.match(/setLimitReached\(false\);/g) || []).length >= 3);
});
