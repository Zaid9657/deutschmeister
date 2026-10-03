// Guard suite: a lock sends /login the page it locked (conversion agent,
// 2026-10-03).
//
// The finding this closes: a signed-out visitor who opens a paid level
// (/level/a2.1, /reading/b1.1, ...) gets LevelSubscriptionGuard's lock screen,
// LockedContentOverlay. Its "Log In" button linked to a bare /login. LoginPage
// sends a user on to `location.state.from.pathname` and, without one, to
// postAuthPath(), which is /dashboard. So a returning learner who logged in
// from the lock lost the level they had asked for: with access they had to
// find it again, and without access they never saw the offer the guard shows
// there (/subscription). Every other gate already hands /login the page:
// ProtectedRoute, SubscriptionGuard, ExamSubscriptionGuard and PurchaseGuard
// redirect with state={{ from: location }}.
//
// The rule, not a list of files: every gate component (src/components/*Guard.jsx
// and ProtectedRoute.jsx) and every local screen a gate renders in place of its
// children is a lock screen, and each of their doors to /login (a <Navigate>,
// <Link> or <Button> with to="/login", or navigate('/login')) carries a `from`
// in its state. A new guard or a new lock screen is covered without editing
// this file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = 'src/components';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Comments out, so a doc comment that quotes a door cannot satisfy or trip the rule. */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

const GATES = readdirSync(join(ROOT, COMPONENTS))
  .filter((f) => /Guard\.jsx$/.test(f) || f === 'ProtectedRoute.jsx')
  .map((f) => `${COMPONENTS}/${f}`);

/** Local components a gate imports and renders as JSX: the screens it shows in place of its children. */
const lockScreensOf = (gate) => {
  const src = code(read(gate));
  const out = [];
  for (const m of src.matchAll(/^import\s+(\w+)\s+from\s+'\.\/([\w/.-]+?)(?:\.jsx)?';/gm)) {
    const [, name, rel] = m;
    const path = `${COMPONENTS}/${rel}.jsx`;
    if (existsSync(join(ROOT, path)) && new RegExp(`<${name}[\\s/>]`).test(src)) out.push(path);
  }
  return out;
};

const LOCK_SCREENS = [...new Set(GATES.flatMap(lockScreensOf))];
const ALL = [...GATES, ...LOCK_SCREENS];

const LOGIN_TO = /\bto=(?:"\/login"|'\/login'|\{\s*['"]\/login['"]\s*\})/g;

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
  for (const m of src.matchAll(LOGIN_TO)) doors.push({ kind: 'jsx', text: openingTag(src, m.index) });
  for (const m of src.matchAll(/\bnavigate\(\s*['"]\/login['"]([^)]*)\)/g)) doors.push({ kind: 'navigate', text: m[0] });
  return doors;
};

const carriesFrom = (door) =>
  door.kind === 'jsx' ? /\bstate=\{\{[^}]*\bfrom\b/.test(door.text) : /\bstate\s*:\s*\{[^}]*\bfrom\b/.test(door.text);

test('the walk finds the gates and the level lock, so the rule cannot pass on an empty set', () => {
  assert.ok(GATES.length >= 5, `expected at least 5 gates, found ${GATES.join(', ')}`);
  for (const gate of ['ProtectedRoute.jsx', 'SubscriptionGuard.jsx', 'LevelSubscriptionGuard.jsx']) {
    assert.ok(GATES.includes(`${COMPONENTS}/${gate}`), `${gate} is not in the gate set`);
  }
  assert.ok(
    LOCK_SCREENS.includes(`${COMPONENTS}/LockedContentOverlay.jsx`),
    `LevelSubscriptionGuard renders LockedContentOverlay, but the walk found only ${LOCK_SCREENS.join(', ') || 'nothing'}`,
  );
  const doors = ALL.flatMap((f) => loginDoors(code(read(f))));
  assert.ok(doors.length >= 5, `expected at least 5 doors to /login across the gates, found ${doors.length}`);
});

test('every door to /login on a gate or a lock screen hands over the page it locked (state.from)', () => {
  const missing = [];
  for (const file of ALL) {
    for (const door of loginDoors(code(read(file)))) {
      if (!carriesFrom(door)) missing.push(`${file}: ${door.text.replace(/\s+/g, ' ').slice(0, 120)}`);
    }
  }
  assert.deepEqual(missing, [], 'a login door without state.from sends the learner to /dashboard instead of back to the locked page');
});

test('the level lock passes the location it is rendered at, not a fixed path', () => {
  const src = code(read(`${COMPONENTS}/LockedContentOverlay.jsx`));
  assert.match(src, /import\s*\{[^}]*\buseLocation\b[^}]*\}\s*from\s*'react-router-dom'/);
  assert.match(src, /const\s+location\s*=\s*useLocation\(\)/);
  const doors = loginDoors(src);
  assert.equal(doors.length, 1, 'the lock has exactly one Log In door');
  assert.match(doors[0].text, /state=\{\{\s*from:\s*location\s*\}\}/);
});

test('LoginPage still returns to state.from, the contract every door relies on', () => {
  const src = code(read('src/pages/LoginPage.jsx'));
  assert.match(src, /location\.state\?\.from\?\.pathname\s*\|\|\s*postAuthPath\(\)/);
});
