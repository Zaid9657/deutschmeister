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
import vm from 'node:vm';
import { returnPath, nextPath, needsFullLoad } from '../src/lib/loginReturn.js';

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

test('LoginPage reads the door through returnPath, then ?next=, and keeps the postAuthPath() fallback byte for byte', () => {
  const src = read('src/pages/LoginPage.jsx');
  assert.match(src, /^import \{ returnPath, nextPath, needsFullLoad[^}]*\} from '\.\.\/lib\/loginReturn';$/m);
  // state.from (an app door) beats ?next= (a static door), and both beat
  // postAuthPath() (a pending checkout, then the dashboard).
  assert.equal(
    (src.match(/^ {2}const from = returnPath\(location\.state\?\.from\) \|\| nextPath\(searchParams\.get\('next'\)\) \|\| postAuthPath\(\);$/gm) || []).length,
    1,
  );
  assert.ok(!/from\?\.pathname/.test(src), 'no second reading of from.pathname alone');
  // Both ways out of /login (already signed in, and a successful login) use it.
  assert.equal((src.match(/navigate\(from, \{ replace: true \}\)/g) || []).length, 2);
});

// ── ?next= (cross-check 2026-10-25, SHL-10) ─────────────────────────────────
// The Astro pages' "Log in" links (nav, grammar exercise lock) are plain links:
// they cannot hand over router state, so a learner who logged in from a grammar
// topic landed on /dashboard and had to find the topic again.

test('?next= returns only to the learning pages a static login door sits on', () => {
  const accepted = [
    '/grammar/a1.2/question-words/',
    '/grammar/',
    '/grammar/a1.1/articles/?tab=rules#beispiele',
    '/courses/a1-2/',
    '/course/a1.2',
    '/course/a1.1/l/3',
  ];
  for (const next of accepted) assert.equal(nextPath(next), next, next);
  const refused = [
    undefined, null, 42, '', '/', '/dashboard', '/admin', '/subscription?buy=course_a1_2', '/grammar', '/coursesx/',
    '//evil.example/grammar/', 'https://evil.example/grammar/', 'javascript:alert(1)', '/\\evil.example',
    '/grammar/../admin', '/grammar/%2e%2e/admin', '/courses/./../dashboard', '/grammar/\n/x', '/grammar\\..\\admin',
  ];
  for (const next of refused) assert.equal(nextPath(next), null, JSON.stringify(next));
});

test('whatever nextPath accepts resolves to this origin, under an allowed prefix', () => {
  for (const next of ['/grammar/a1.1/x/', '/course/a1.1?s=2', '/grammar/%2F%2Fevil.example', '/courses/a1-2/#//evil.example']) {
    const path = nextPath(next);
    if (path === null) continue;
    const url = new URL(path, ORIGIN);
    assert.equal(url.origin, ORIGIN, path);
    assert.ok(/^\/(grammar|courses|course)\//.test(url.pathname), path);
  }
});

test('Astro pages are left with a full page load, SPA course pages with the router', () => {
  assert.equal(needsFullLoad('/grammar/a1.1/articles/'), true);
  assert.equal(needsFullLoad('/courses/a2-1/'), true);
  for (const path of ['/course/a1.2', '/course/a1.1/l/3', '/dashboard', '/subscription?buy=x', '/speaking/?level=a1.1', '', null]) {
    assert.equal(needsFullLoad(path), false, String(path));
  }

  const src = read('src/pages/LoginPage.jsx');
  const wrapper = src.match(/ {2}const navigate = useCallback\(\(to, options\) => \{[\s\S]*?\n {2}\}, \[routerNavigate\]\);/);
  assert.ok(wrapper, 'LoginPage wraps the router navigate');
  assert.match(src, /const routerNavigate = useNavigate\(\);/);
  const calls = [];
  const navigate = vm.runInNewContext(`${wrapper[0]}\nnavigate;`, {
    useCallback: (fn) => fn,
    needsFullLoad,
    routerNavigate: (to, options) => calls.push(['router', to, options.replace]),
    window: { location: { replace: (to) => calls.push(['load', to]) } },
  });
  navigate('/grammar/a1.2/question-words/', { replace: true });
  navigate('/course/a1.2', { replace: true });
  navigate('/dashboard', { replace: true });
  assert.deepEqual(calls, [
    ['load', '/grammar/a1.2/question-words/'],
    ['router', '/course/a1.2', true],
    ['router', '/dashboard', true],
  ], 'a replace either way, so /login never stays in the history');
});

test('the Astro login doors hand over the page they are on', () => {
  const layout = read('astro-site/src/layouts/Layout.astro');
  const doors = layout.match(/<a\s[^>]*href="\/login"[^>]*>/g) || [];
  assert.equal(doors.length, 2, 'desktop bar and menu sheet');
  for (const door of doors) assert.match(door, /data-login-next/);
  assert.match(layout, /document\.querySelectorAll\('\[data-login-next\]'\)/);
  assert.match(layout, /'\/login\?next=' \+ encodeURIComponent\(location\.pathname\)/);

  const island = read('astro-site/src/components/ExercisePlayer.jsx');
  assert.ok(!island.includes('deutsch-meister.de/login'), 'no absolute login link: it broke previews and dropped the page');
  assert.match(island, /`\/login\?next=\$\{encodeURIComponent\(window\.location\.pathname\)\}`/);
});
