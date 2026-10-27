// A redirect to a page the Astro build serves is a full page load, never a client-side route
// (2026-10-25 cross-check, LSN-16). Five course pages answered an unknown level with
// `<Navigate to="/courses/" replace />`. /courses/ is Astro-only — src/data/navigation.js marks it
// kind 'static' — and the SPA has no route for it, so React rendered the SPA's "Page Not Found" at
// /courses/ until a refresh, and `replace` took the way back away as well. tests/navigation.test.mjs
// holds the registry's LINKS to the rule; this suite holds every redirect in src/ to it: no
// <Navigate to=…> and no navigate(…) may target a 'static' path. FullPageRedirect is the way there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { ALL_NAV_ITEMS } from '../src/data/navigation.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : /\.jsx?$/.test(name) ? [relative(ROOT, p)] : [];
});
/** Comments out, so a doc comment that quotes the old redirect neither trips nor satisfies the rule. */
const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

const STATIC = ALL_NAV_ITEMS.filter((i) => i.kind === 'static').map((i) => i.href);

/** Is `path` (the literal part of a redirect target) a page of the Astro build? */
const isStaticTarget = (path) => STATIC.some((href) => {
  const bare = href.replace(/\/$/, '');
  return path === bare || path.startsWith(href) || path.startsWith(`${bare}?`) || path.startsWith(`${bare}#`);
});

// The literal start of a target: "…", '…', {"…"}, {'…'} or a template literal up to its first `${`.
const LITERAL = String.raw`(?:"([^"]*)"|'([^']*)'|\x60([^\x60$]*))`;
const NAVIGATE_TAG = new RegExp(String.raw`<Navigate\b[^>]*?\bto=\{?\s*${LITERAL}`, 'g');
const NAVIGATE_CALL = new RegExp(String.raw`\bnavigate\(\s*${LITERAL}`, 'g');

/** Every redirect in a source with a literal target: [{ kind, target }]. */
const redirectsIn = (src) => {
  const out = [];
  for (const m of code(src).matchAll(NAVIGATE_TAG)) out.push({ kind: '<Navigate>', target: m[1] ?? m[2] ?? m[3] });
  for (const m of code(src).matchAll(NAVIGATE_CALL)) out.push({ kind: 'navigate()', target: m[1] ?? m[2] ?? m[3] });
  return out;
};

test('the rule knows the Astro pages and reads every redirect form', () => {
  assert.ok(STATIC.includes('/courses/'), 'the registry marks /courses/ as served by Astro');
  for (const path of ['/courses/', '/courses', '/courses/a1-2/', '/grammar/a1.1/', '/pricing/?from=app']) {
    assert.equal(isStaticTarget(path), true, path);
  }
  for (const path of ['/course/a1.1', '/course/a1.1/l/1', '/dashboard', '/subscription', '/login']) {
    assert.equal(isStaticTarget(path), false, path);
  }
  assert.deepEqual(redirectsIn('if (!course) return <Navigate to="/courses/" replace />;'), [{ kind: '<Navigate>', target: '/courses/' }]);
  assert.deepEqual(redirectsIn("return <Navigate to={'/pricing/'} replace />"), [{ kind: '<Navigate>', target: '/pricing/' }]);
  assert.deepEqual(redirectsIn('navigate(`/courses/${slug}/`, { replace: true })'), [{ kind: 'navigate()', target: '/courses/' }]);
  assert.deepEqual(redirectsIn('// <Navigate to="/courses/" replace />'), [], 'a comment is not a redirect');
});

test('no <Navigate> or navigate() in src/ targets a page the Astro build serves', () => {
  const files = walk(join(ROOT, 'src'));
  assert.ok(files.length > 100, 'the walk reaches the whole SPA');
  const offenders = [];
  for (const file of files) {
    for (const { kind, target } of redirectsIn(read(file))) {
      if (isStaticTarget(target)) offenders.push(`${file}: ${kind} → ${target}`);
    }
  }
  assert.deepEqual(offenders, [], 'a client-side hop to an Astro page renders the SPA 404 — use FullPageRedirect');
});

test('FullPageRedirect leaves the app with a real page load that replaces the history entry', () => {
  const src = code(read('src/components/FullPageRedirect.jsx'));
  assert.match(src, /useEffect\(\(\) => \{\s*window\.location\.replace\(to\);\s*\}, \[to\]\);/);
  assert.doesNotMatch(src, /react-router-dom/, 'never a router hop');
  for (const page of [
    'src/pages/CourseHomePage.jsx',
    'src/pages/CourseLessonPage.jsx',
    'src/pages/CourseCompletePage.jsx',
    'src/pages/CourseCertificatePage.jsx',
    'src/pages/lesson/LessonPlayerPage.jsx',
  ]) {
    const s = code(read(page));
    assert.match(s, /import FullPageRedirect from '(?:\.\.\/)+components\/FullPageRedirect\.jsx';/, page);
    assert.match(s, /return <FullPageRedirect to="\/courses\/" \/>;/, `${page} sends an unknown course to the catalogue with a page load`);
  }
});
