// Guard suite: a page's "Log in" brings the learner back to that page (product
// agent, 2026-10-03).
//
// The finding this closes: /speaking/ shows a signed-out visitor a "Sign up
// free / Log in" pair (SpeakingPage.jsx). Its "Log in" linked a bare /login.
// LoginPage sends a user on to `location.state.from.pathname` and, without one,
// to postAuthPath(), which is /dashboard. So a returning learner who logged in
// from /speaking/ landed on /dashboard, not on the speaking practice they had
// opened. The A1.1 lesson player links anonymous learners to the same screen
// (SpeakingStage, RecapStage: /speaking?level=…&mission=…), so it is a door on
// the course path too. SupportPage and the course's SaveProgressCard already
// hand /login the page; the gates do it with state={{ from: location }}, and
// conversion's tests/lock-login-return.test.mjs covers the gates and the lock
// screens they render.
//
// The rule, not a list of files: every page under src/pages/ is walked, and each
// of its doors to /login (a <Navigate>, <Link> or <Button> with to="/login", an
// href to it, or navigate('/login')) carries a `from` in its state. The pages of
// the authentication flow itself (log in, sign up, reset and update the password,
// verify the email) are not destinations: their doors to /login ARE the flow, and
// LoginPage's own fallback (postAuthPath) decides where they end. A new page is
// covered without editing this file. An href cannot carry router state, so an
// href door always fails the rule — use a <Link>/<Button to>.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = join(ROOT, 'src/pages');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Comments out, so a doc comment that quotes a door cannot satisfy or trip the rule. */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : /\.jsx?$/.test(name) ? [relative(ROOT, p)] : [];
});

/** The authentication flow: the pages whose job is getting the learner signed in. */
const AUTH_FLOW = /(?:^|\/)(?:Login|Signup|ResetPassword|UpdatePassword|VerifyEmail)Page\.jsx$/;

const ALL_PAGES = walk(PAGES);
const DESTINATION_PAGES = ALL_PAGES.filter((f) => !AUTH_FLOW.test(f));

const LOGIN = String.raw`\/login(?:\?[^"'\x60]*)?`;
const LOGIN_TO = new RegExp(String.raw`\b(to|href)=(?:"${LOGIN}"|'${LOGIN}'|\{\s*["'\x60]${LOGIN}["'\x60]\s*\})`, 'g');
const LOGIN_NAVIGATE = new RegExp(String.raw`\bnavigate\(\s*["'\x60]${LOGIN}["'\x60]([^)]*)\)`, 'g');

/** The opening tag around index i: back to its '<', forward to the '>' that closes it at brace depth 0. */
const openingTag = (src, i) => {
  const start = src.lastIndexOf('<', i);
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0 && src[j - 1] !== '=') return src.slice(start, j + 1);
  }
  return src.slice(start);
};

/** Every door to /login in a file, as the source text that decides where login returns. */
const loginDoors = (src) => {
  const doors = [];
  for (const m of src.matchAll(LOGIN_TO)) doors.push({ kind: m[1] === 'href' ? 'href' : 'jsx', text: openingTag(src, m.index) });
  for (const m of src.matchAll(LOGIN_NAVIGATE)) doors.push({ kind: 'navigate', text: m[0] });
  return doors;
};

const carriesFrom = (door) => {
  if (door.kind === 'href') return false;
  if (door.kind === 'jsx') return /\bstate=\{\{[^}]*\bfrom\b/.test(door.text);
  return /\bstate\s*:\s*\{[^}]*\bfrom\b/.test(door.text);
};

test('the walk finds the pages and their doors, so the rule cannot pass on an empty set', () => {
  assert.ok(ALL_PAGES.length >= 40, `expected at least 40 page files under src/pages, found ${ALL_PAGES.length}`);
  const auth = ALL_PAGES.filter((f) => AUTH_FLOW.test(f));
  assert.equal(auth.length, 5, `the authentication flow is five pages, found ${auth.join(', ')}`);
  for (const page of ['src/pages/SpeakingPage.jsx', 'src/pages/SupportPage.jsx']) {
    assert.ok(DESTINATION_PAGES.includes(page), `${page} is not walked`);
    assert.ok(loginDoors(code(read(page))).length >= 1, `${page} has a door to /login, but the walk does not see it`);
  }
});

test('every door to /login on a page outside the authentication flow hands over the page (state.from)', () => {
  const missing = [];
  for (const file of DESTINATION_PAGES) {
    for (const door of loginDoors(code(read(file)))) {
      if (!carriesFrom(door)) missing.push(`${file}: ${door.text.replace(/\s+/g, ' ').slice(0, 120)}`);
    }
  }
  assert.deepEqual(missing, [], 'a login door without state.from sends the learner to /dashboard instead of back to the page');
});

test('/speaking/ passes the location it is rendered at, so the course hand-off returns to /speaking', () => {
  const src = code(read('src/pages/SpeakingPage.jsx'));
  assert.match(src, /import\s*\{[^}]*\buseLocation\b[^}]*\}\s*from\s*'react-router-dom'/);
  assert.match(src, /const\s+location\s*=\s*useLocation\(\)/);
  const doors = loginDoors(src);
  assert.equal(doors.length, 1, 'the signed-out screen has exactly one Log in door');
  assert.match(doors[0].text, /state=\{\{\s*from:\s*location\s*\}\}/);
});

test('LoginPage still reads state.from, the contract every door relies on', () => {
  assert.match(code(read('src/pages/LoginPage.jsx')), /location\.state\?\.from\b/);
});
