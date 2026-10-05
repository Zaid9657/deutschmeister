// The confirmation resend on /login (src/pages/LoginPage.jsx handleResend).
//
// It is the resend new accounts actually use: /verify-email needs a session,
// and 0 of 40 unconfirmed accounts in 30 days ever had one (product, auth.users,
// 2026-10-04). Auth logs 2026-09-26 to 10-03 (product's handoff, 2026-10-04)
// showed two defects on it:
//   1. It called supabase.auth.resend without emailRedirectTo, so GoTrue sent
//      the link to the Site URL, https://deutsch-meister.de/ (the Astro
//      homepage, which reads no session). Every /resend was logged with that
//      redirect, and 3 /verify 303'd there: confirmed, but signed out. signUp's
//      link and the /signup panel's resend go to /login, where supabase-js reads
//      the session out of the URL and LoginPage sends the learner on.
//   2. 12 of those 14 resends were refused with the send-rate limit (HTTP 429,
//      over_email_send_rate_limit), and the page showed GoTrue's raw
//      "For security purposes, you can only request this after N seconds."
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuthApiError } from '@supabase/supabase-js';
import { resendRefusal } from '../src/lib/signupConfirmation.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(ROOT, path), 'utf8');
const squash = (s) => s.replace(/\s+/g, ' ').trim();

const REDIRECT_TO_LOGIN = 'emailRedirectTo: `${window.location.origin}/login`';

/** Every source file under src/ (js and jsx), as repo-relative paths. */
function sourceFiles(dir = join(ROOT, 'src')) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(jsx?|mjs)$/.test(entry.name) ? [relative(ROOT, path)] : [];
  });
}

/** The text between the parentheses of the call whose "(" is at `open`. */
function callArgument(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '(') depth += 1;
    else if (src[i] === ')') {
      depth -= 1;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  throw new Error('unbalanced call');
}

/** Each supabase.auth.signUp / supabase.auth.resend call under src/: a confirmation mail. */
function confirmationMailCalls() {
  const calls = [];
  for (const file of sourceFiles()) {
    const src = read(file);
    for (const m of src.matchAll(/\bauth\s*\.\s*(signUp|resend)\s*\(/g)) {
      const open = m.index + m[0].length - 1;
      const line = src.slice(0, m.index).split('\n').length;
      calls.push({ at: `${file}:${line}`, method: m[1], arg: callArgument(src, open) });
    }
  }
  return calls;
}

// Lower it when you give one of these calls its redirect; never raise it.
// 1 on 2026-10-05: the /verify-email resend, product's route (routed to product
// by the supervisor on 2026-10-03). That page needs a session, which 0 of 40
// unconfirmed accounts had in 30 days, so no logged /resend came from it.
const MAX_CONFIRMATION_MAILS_WITHOUT_REDIRECT = 1;

test('every confirmation mail says where its link lands: /login, where the session is read', () => {
  const calls = confirmationMailCalls();
  // The walker sees the calls this rule is about (a renamed client would hide them).
  for (const file of ['src/contexts/AuthContext.jsx', 'src/pages/SignupPage.jsx', 'src/pages/LoginPage.jsx']) {
    assert.ok(calls.some((c) => c.at.startsWith(`${file}:`)), `no auth.signUp/resend call found in ${file}`);
  }
  for (const c of calls) {
    assert.match(c.arg, /^\s*\{/, `${c.at}: pass the ${c.method} options inline, so this rule can read the redirect`);
  }
  const missing = calls.filter((c) => !c.arg.includes(REDIRECT_TO_LOGIN)).map((c) => c.at);
  assert.equal(
    missing.length,
    MAX_CONFIRMATION_MAILS_WITHOUT_REDIRECT,
    `confirmation mails without ${REDIRECT_TO_LOGIN}: ${missing.join(', ') || 'none'}. Without it GoTrue sends the link to the Site URL (the homepage), signed out.`,
  );
  assert.ok(!missing.some((at) => at.startsWith('src/pages/LoginPage.jsx:')), '/login resend must carry the redirect');
});

test("/login's resend is the /signup panel's call: same type, same redirect", () => {
  const resendOf = (file) => {
    const call = confirmationMailCalls().find((c) => c.at.startsWith(`${file}:`) && c.method === 'resend');
    assert.ok(call, `${file} has a resend`);
    return call.arg;
  };
  const login = resendOf('src/pages/LoginPage.jsx');
  const signup = resendOf('src/pages/SignupPage.jsx');
  for (const arg of [login, signup]) {
    assert.match(arg, /type: 'signup'/);
    assert.ok(arg.includes(`options: { ${REDIRECT_TO_LOGIN} }`));
  }
});

// What auth-js hands the page for the refusals in the logs (AuthApiError, the
// class supabase-js throws for a 4xx), folded the way handleResend folds them:
// each refusal carries the previous one's untimed count.
const timed = (n) => new AuthApiError(`For security purposes, you can only request this after ${n} seconds.`, 429, 'over_email_send_rate_limit');
const untimed = () => new AuthApiError('email rate limit exceeded', 429, 'over_email_send_rate_limit');
const fold = (errors) => errors.reduce((prev, e) => resendRefusal(e, prev?.untimed ?? 0), null);

test('a send-rate refusal is a plain line on /login; only the second untimed one in a row is the limit', () => {
  // The sample from the logs, 2026-09-28 18:34: three refusals in a row.
  const afterThree = fold([timed(44), timed(42), timed(3)]);
  assert.ok(afterThree, 'a 429 is a refusal, not an error to print');
  assert.equal(afterThree.limitReached, false);
  assert.equal(fold([untimed()]).limitReached, false);
  assert.equal(fold([untimed(), untimed()]).limitReached, true);
  assert.equal(fold([untimed(), timed(12)]).limitReached, false, 'a named wait is the 60 s window again');
  // Anything else is still shown as it is (and ends the run).
  assert.equal(fold([untimed(), new AuthApiError('Email address "x" is invalid', 400, 'email_address_invalid')]), null);
});

test('/login renders the refusal in words, never GoTrue\'s text', () => {
  const src = read('src/pages/LoginPage.jsx');
  assert.match(src, /^import \{ resendRefusal \} from '\.\.\/lib\/signupConfirmation\.js';$/m);
  assert.match(src, /const refusal = resendRefusal\(resendError, resendRefused\?\.untimed \?\? 0\);/);
  // The raw message reaches the page only when the refusal is not the rate limit.
  assert.equal((src.match(/setError\(resendError\.message\)/g) || []).length, 1);
  assert.match(src, /if \(!refusal\) setError\(resendError\.message\);/);
  assert.ok(!/For security purposes/.test(src));
  // Both lines exist; the limit line is the /signup panel's, word for word.
  assert.match(src, /\{resendRefused && \(/);
  assert.ok(src.includes('We can send this address only one email a minute.'));
  const LIMIT = 'The limit for confirmation emails is reached for now, so we cannot send another one. Please try again later, and look in your spam folder for the email we already sent.';
  assert.ok(squash(src).includes(LIMIT));
  assert.ok(squash(read('src/pages/SignupPage.jsx')).includes(LIMIT));
  // A success and a new login attempt each clear it.
  assert.ok((src.match(/setResendRefused\(null\);/g) || []).length >= 2);
});
