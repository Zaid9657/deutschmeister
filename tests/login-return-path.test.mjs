// /login returns the learner to the whole page a door handed over: path,
// query and hash (acquisition agent, 2026-10-03; src/lib/loginReturn.js).
//
// The finding this closes (product agent, headless Chromium on e6cd630): the
// A1.1 lesson player sends a signed-out learner to
// /speaking/?level=a1.1&mission=3, its "Log in" hands /login that Location as
// state.from, and LoginPage read only from.pathname, so the learner came back
// to a bare /speaking/ and the mission was lost.
//
// Two things are pinned besides the path: only a same-origin path is honoured
// (state.from is a destination), and the fallback stays `|| postAuthPath()`
// byte for byte, so a pending checkout still beats the dashboard when no door
// handed over a page (the supervisor's rule-6 ruling on #55's line, 10-03).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { returnPath } from '../src/lib/loginReturn.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const ORIGIN = 'https://deutsch-meister.de';

test('the course hand-off comes back with its query', () => {
  const from = { pathname: '/speaking/', search: '?level=a1.1&mission=3', hash: '', state: null, key: 'k1' };
  assert.equal(returnPath(from), '/speaking/?level=a1.1&mission=3');
});

test('a Location comes back whole: path, query and hash', () => {
  assert.equal(returnPath({ pathname: '/level/a2.1', search: '', hash: '' }), '/level/a2.1');
  assert.equal(returnPath({ pathname: '/grammar/a1.1/', search: '?tab=rules', hash: '#beispiele' }), '/grammar/a1.1/?tab=rules#beispiele');
  assert.equal(returnPath({ pathname: '/faq/', search: '', hash: '#billing' }), '/faq/#billing');
});

test('the doors that hand over a bare { pathname } still work', () => {
  // SaveProgressCard, SupportPage and AdminShell pass an object literal.
  assert.equal(returnPath({ pathname: '/course/a1.1/l/3' }), '/course/a1.1/l/3');
  assert.equal(returnPath({ pathname: '/admin' }), '/admin');
});

test('no page handed over means no return path, so LoginPage falls back', () => {
  for (const from of [undefined, null, {}, { pathname: '' }, { pathname: 42 }, { search: '?a=1' }, '/dashboard']) {
    assert.equal(returnPath(from), null, JSON.stringify(from));
  }
});

test('only a same-origin path is honoured', () => {
  const offsite = [
    '//evil.example',
    '/\\evil.example',
    'https://evil.example/',
    'javascript:alert(1)',
    'evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    '/\r\n/evil.example',
    '/x\u0000y',
    // Review of eee4418: a backslash after the first character normalises to "//host".
    '/.\\evil.example',
    '/a/..\\..\\\\evil.example',
    '/a\\b',
  ];
  for (const pathname of offsite) {
    assert.equal(returnPath({ pathname, search: '', hash: '' }), null, JSON.stringify(pathname));
  }
  assert.equal(returnPath({ pathname: '/x', search: '?a=\n1', hash: '' }), null, 'a control character in the query');
  // A query or hash in the wrong shape is dropped, the path still returns.
  assert.equal(returnPath({ pathname: '/x', search: 'a=1', hash: 'top' }), '/x');
});

test('whatever returnPath accepts resolves to this origin in a URL parser', () => {
  const inputs = [
    { pathname: '/speaking/', search: '?level=a1.1&mission=3' },
    { pathname: '/%2F%2Fevil.example' },
    { pathname: '/a//b', search: '?next=//evil.example', hash: '#//evil.example' },
    { pathname: '//evil.example' },
    { pathname: '/\\evil.example' },
    { pathname: '/\t/evil.example' },
    { pathname: '\\\\evil.example' },
    { pathname: '/..//evil.example' },
    { pathname: '/.\\evil.example' },
  ];
  for (const from of inputs) {
    const path = returnPath(from);
    if (path !== null) {
      assert.equal(new URL(path, ORIGIN).origin, ORIGIN, path);
      assert.ok(!new URL(path, ORIGIN).pathname.startsWith('//'), `${path} resolves to a protocol-relative pathname`);
    }
  }
});

test('LoginPage reads the door through returnPath and keeps the postAuthPath() fallback byte for byte', () => {
  const src = read('src/pages/LoginPage.jsx');
  assert.match(src, /^import \{ returnPath \} from '\.\.\/lib\/loginReturn';$/m);
  assert.equal(
    (src.match(/^ {2}const from = returnPath\(location\.state\?\.from\) \|\| postAuthPath\(\);$/gm) || []).length,
    1,
  );
  assert.ok(!/from\?\.pathname/.test(src), 'no second reading of from.pathname alone');
  // Both ways out of /login (already signed in, and a successful login) use it.
  assert.equal((src.match(/navigate\(from, \{ replace: true \}\)/g) || []).length, 2);
});
