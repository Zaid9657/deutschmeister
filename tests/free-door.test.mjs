// The free first stop has one door in the app, too.
//
// offers.js names it: FREE_COURSE_HREF, "the door every 'start free' link
// uses". The Astro half is held by astro-course-front-door.test.mjs, and
// course-front-door.test.mjs pins the navbar and the two rival A1.1 pages. Both
// look for a link that says "start"; the level lock's secondary link said "Try
// A1.1 for free" / "A1.1 kostenlos ausprobieren", so neither saw it, and until
// 2026-10-07 it opened the /level/a1.1 topic library instead of the course.
// That is the screen a signed-out visitor sees on every locked level, and the
// course is where the owner put the signup ask (after the first exercise,
// 2026-10-06), so the lock's way out skipped it.
//
// The rule walks the SPA source, so a door written tomorrow is covered: every
// link whose own text offers the free level for free opens FREE_COURSE_HREF.
// A destination this suite cannot resolve fails; add its resolution to
// NAMED below rather than loosening the match.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FREE_COURSE_HREF, FREE_LEVEL } from '../src/data/offers.js';
import { FREE_LEVELS, isLevelFree } from '../src/config/freeTier.js';
import { FREE_LEVEL_LABEL } from '../src/data/marketing.js';
import { XRAY_OFFER } from '../src/lib/xray.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// Lesson and exam content is teaching material, not product chrome.
const CONTENT_DIRS = ['src/data/curricula', 'src/data/lessonPools', 'src/data/mockExams', 'src/data/courseTests', 'src/data/courses'];
const jsxFiles = () => {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue;
      const rel = `${dir}/${entry.name}`;
      if (CONTENT_DIRS.includes(rel)) continue;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith('.jsx')) out.push(rel);
    }
  };
  walk('src');
  return out;
};

/** Source minus comments: a comment that quotes `<a href>` is not a link. */
const code = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

// <Link|NavLink|Button|a …to= or href=…>text</…>. Attribute values may hold
// one level of braces ({{ from: location }}, {`…${x}…`}).
const ELEMENT = /<(Link|NavLink|Button|a)\b((?:[^>{]|\{(?:[^{}]|\{[^{}]*\})*\})*?)>([\s\S]*?)<\/\1>/g;
const DESTINATION = /\b(?:to|href)=(?:"([^"]*)"|\{`([^`]*)`\}|\{([^}]*)\})/;

// The link's own words offer the free level for free, in either language.
const FREE_WORD = /\b(free|kostenlos|gratis)\b/i;
const FREE_LEVEL_NAMED = new RegExp(`${FREE_LEVEL_LABEL.replace('.', '\\.')}|\\{FREE_LEVEL_LABEL\\}`);
const offersFreeLevel = (text) => FREE_WORD.test(text) && FREE_LEVEL_NAMED.test(text);

// Named destinations a door may use, resolved from the modules they live in.
const NAMED = {
  FREE_COURSE_HREF,
  'XRAY_OFFER.courseHref': XRAY_OFFER.courseHref,
};

function resolve(attrs) {
  const m = attrs.match(DESTINATION);
  if (!m) return { raw: '(no to/href)', href: null };
  if (m[1] !== undefined) return { raw: m[1], href: m[1] };
  if (m[2] !== undefined) return { raw: `\`${m[2]}\``, href: m[2].includes('${') ? null : m[2] };
  const expr = m[3].trim();
  return { raw: `{${expr}}`, href: Object.prototype.hasOwnProperty.call(NAMED, expr) ? NAMED[expr] : null };
}

/** Every link in the SPA whose own text offers the free level for free. */
function freeLevelDoors() {
  const doors = [];
  for (const file of jsxFiles()) {
    for (const m of code(read(file)).matchAll(ELEMENT)) {
      const text = m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!offersFreeLevel(text)) continue;
      doors.push({ file, element: m[1], text, ...resolve(m[2]) });
    }
  }
  return doors;
}

/** The path a door opens, without its attribution query. */
const pathOf = (href) => href.split(/[?#]/)[0];

test('the pattern finds the line it was written for and leaves other links alone', () => {
  const lock = '<Link to="/level/a1.1" className="x"><Sparkles size={14} />{isGerman ? \'A1.1 kostenlos ausprobieren\' : \'Try A1.1 for free\'}</Link>';
  const [m] = [...lock.matchAll(ELEMENT)];
  assert.ok(m, 'the old lock link is not parsed as a link');
  assert.ok(offersFreeLevel(m[3]));
  assert.equal(resolve(m[2]).href, '/level/a1.1');
  // A state object in an attribute does not end the tag.
  const login = '<Button to="/login" state={{ from: location }} variant="secondary">Log In</Button>';
  assert.equal(resolve([...login.matchAll(ELEMENT)][0][2]).href, '/login');
  // Section links and the account door say other things.
  for (const text of ['Start at A1.1', 'Start Listening', 'Sign Up Free', 'Browse all grammar topics']) {
    assert.equal(offersFreeLevel(text), false, text);
  }
  // A sentence that is not a link is not a door, and a comment is not code.
  assert.equal([...'<p>Your A1.1 lessons stay free.</p>'.matchAll(ELEMENT)].length, 0);
  assert.equal([...code('{/* <a href="/level/a1.1">A1.1 free</a> */}\n// <Link to="/x">A1.1 free</Link>').matchAll(ELEMENT)].length, 0);
  assert.ok(offersFreeLevel('Start the free {FREE_LEVEL_LABEL} course'));
  assert.ok(offersFreeLevel("{isGerman ? 'A1.1 gratis starten' : 'Start A1.1 free'}"));
});

test('the named door is the free level\'s course, open without an account', () => {
  assert.equal(FREE_LEVEL, FREE_LEVELS[0]);
  assert.equal(FREE_COURSE_HREF, `/course/${FREE_LEVEL}`);
  assert.ok(isLevelFree(FREE_LEVEL), 'the door names a level that is not free');
  // LevelSubscriptionGuard returns the page for a free level before it asks for
  // a user, so the course opens signed out (CLAUDE.md case 3: no slash).
  assert.ok(read('src/App.jsx').includes('path="/course/:level"'));
  assert.match(read('src/components/LevelSubscriptionGuard.jsx'), /if \(isLevelFree\(level\)\) \{\s*return children;/);
  assert.doesNotMatch(FREE_COURSE_HREF, /\/$/);
});

test('every SPA link that offers the free level for free opens the course', () => {
  const doors = freeLevelDoors();
  const failures = doors
    .filter((d) => d.href === null || pathOf(d.href) !== FREE_COURSE_HREF)
    .map((d) => `${d.file}: <${d.element}> "${d.text.slice(0, 80)}" opens ${d.href ?? `an unresolved ${d.raw}`}`);
  assert.deepEqual(failures, [], `the free first stop is ${FREE_COURSE_HREF} (offers.js FREE_COURSE_HREF):\n  ${failures.join('\n  ')}`);
});

test('the scan is not vacuous: the known free doors are found', () => {
  const doors = freeLevelDoors();
  const count = (file) => doors.filter((d) => d.file === file).length;
  assert.equal(count('src/components/LockedContentOverlay.jsx'), 1, 'the level lock\'s free link');
  assert.equal(count('src/components/Navbar.jsx'), 2, 'desktop + mobile free key');
  assert.ok(count('src/pages/SentenceXRay.jsx') >= 1, 'the X-Ray offer\'s course link');
  // The lock names the door, it does not retype it.
  assert.match(read('src/components/LockedContentOverlay.jsx'), /to=\{FREE_COURSE_HREF\}/);
});
