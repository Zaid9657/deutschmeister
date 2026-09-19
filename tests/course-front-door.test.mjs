// Guard suite for Wave 0 of the free A1.1 course — the "front door":
//   1. the lesson player, checkpoints and the review deck render WITHOUT the
//      site navbar, the marketing footer and the bottom tabs (src/lib/chrome.js
//      decides, src/App.jsx obeys);
//   2. the course home keeps the navbar but drops the marketing footer;
//   3. the finish line of the free course is reachable without paying: the
//      final node links to /modelltest/<testSlug>, whose guard resolves to a
//      FREE level, and the node says so ("Abschlusstest · frei");
//   4. the two rival A1.1 pages (/a1-1-phase, /level/a1.1) point at the guided
//      course, and the register stays Sie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { chromeFor } from '../src/lib/chrome.js';
import { resolveModelltest } from '../src/data/modelltest.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { CURRICULA, curriculumPath } from '../src/data/curricula/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const app = read('src/App.jsx');

test('chromeFor: player routes are focused, the course home is slim, everything else is full', () => {
  for (const p of ['/course/a1.1/l/1', '/course/a1.1/l/12/', '/course/a1.1/checkpoint/2', '/course/a1.1/review', '/course/a2.1/l/3']) {
    assert.equal(chromeFor(p), 'player', p);
  }
  assert.equal(chromeFor('/course/a1.1'), 'course');
  assert.equal(chromeFor('/course/a1.1/'), 'course');
  for (const p of ['/', '/dashboard', '/course/a1.1/complete', '/course/a1.1/certificate', '/course/a1.1/a11-w1-d1-lesson', '/courses/', '/level/a1.1', '/modelltest/abschlusstest-a1-1', '']) {
    assert.equal(chromeFor(p), 'full', p);
  }
});

test('App.jsx mounts the navbar, footer and bottom nav through chromeFor', () => {
  assert.match(app, /from '\.\/lib\/chrome\.js'/);
  assert.match(app, /\{!focused && <Navbar \/>\}/, 'Navbar must be hidden in the player');
  assert.match(app, /\{chrome === 'full' && <OutsideAdmin><Footer \/><\/OutsideAdmin>\}/, 'Footer only on full-chrome routes');
  assert.match(app, /\{!focused && <OutsideAdmin><BottomNav \/><\/OutsideAdmin>\}/, 'BottomNav must be hidden in the player');
  // The chrome routes exist as routes at all.
  for (const p of ['/course/:level', '/course/:level/l/:nr', '/course/:level/checkpoint/:nr', '/course/:level/review']) {
    assert.ok(app.includes(`path="${p}"`), `missing route ${p}`);
  }
});

test('every player page carries its own exit control back to the course home', () => {
  for (const f of ['src/pages/lesson/LessonPlayerPage.jsx', 'src/pages/lesson/CheckpointPage.jsx', 'src/pages/lesson/ReviewPage.jsx']) {
    const src = read(f);
    assert.ok(/courseHome\(curriculum\.level\)|`\/course\/\$\{curriculum\.level\}`/.test(src), `${f} has no back link to the course home`);
    assert.ok(!/pt-24/.test(src), `${f} still pads for a fixed navbar that is no longer rendered`);
  }
});

test('the free finish line: the last node of every live curriculum links to a course test whose gate is a free level', () => {
  for (const curriculum of Object.values(CURRICULA)) {
    const path = curriculumPath(curriculum);
    const last = path[path.length - 1];
    assert.equal(last.kind, 'leveltest');
    const resolved = resolveModelltest(last.testSlug);
    assert.ok(resolved, `${last.testSlug} resolves to no registry`);
    assert.equal(resolved.kind, 'course');
    // ExamSubscriptionGuard: examAccess = hasAccess || hasLevelAccess(gateLevel),
    // and hasLevelAccess() is true for any FREE level — so a signed-in learner
    // without a subscription passes. Pin that the gate is the course's own
    // free level, not a band-top sublevel.
    if (isLevelFree(curriculum.level)) {
      assert.equal(resolved.gateLevel, curriculum.level, `${curriculum.code}'s final test is gated on ${resolved.gateLevel}, not its own free level`);
      assert.ok(isLevelFree(resolved.gateLevel));
    }
  }
  // The route the node links to is the guarded one (not the Pro-only hub).
  assert.ok(app.includes('path="/modelltest/:examSlug"'));
  const guard = read('src/components/ExamSubscriptionGuard.jsx');
  assert.match(guard, /hasLevelAccess\(resolved\.gateLevel\)/, 'the exam guard must gate course tests on their level');
  const ctx = read('src/contexts/SubscriptionContext.jsx');
  assert.match(ctx, /if \(isLevelFree\(level\)\) return true;/, 'hasLevelAccess must short-circuit on free levels');
});

test('the course home labels the free finish line as free, on the node and in the footer', () => {
  const src = read('src/pages/CurriculumHomePage.jsx');
  assert.match(src, /'Abschlusstest · frei'/);
  assert.match(src, /isLevelFree\(level\)/, 'the label must be derived from FREE_LEVELS, never hard-coded');
  assert.ok(!/leveltest: 'Final test'/.test(src), 'the unmarked "Final test" label is back');
  assert.match(src, /\{finalTestLabel\(level\)\}<\/Link>/, 'the footer link must carry the same label');
});

test('the rival A1.1 pages point at the guided course and do not call themselves the course', () => {
  const phase = read('src/pages/A11PhasePage.jsx');
  assert.match(phase, /to="\/course\/a1\.1"/, '/a1-1-phase must link to /course/a1.1');
  assert.match(phase, /nicht der Kurs/, 'the plan must say it is not the course');
  const level = read('src/pages/LevelPage.jsx');
  assert.match(level, /to=\{`\/course\/\$\{level\}`\}/, '/level/:level must link to /course/:level');
  const navbar = read('src/components/Navbar.jsx');
  assert.ok(!navbar.includes('to="/level/a1.1"'), 'the free CTA in the navbar must open the course, not the library');
  assert.equal((navbar.match(/to="\/course\/a1\.1"/g) || []).length, 2, 'desktop + mobile free CTA');
});

test('the chrome added in Wave 0 siezt (no du-register token)', () => {
  const DU = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst)\b/;
  for (const f of ['src/pages/A11PhasePage.jsx', 'src/components/BottomNav.jsx', 'src/components/CourseReturnBar.jsx', 'src/pages/CurriculumHomePage.jsx']) {
    const offenders = read(f).split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => DU.test(l));
    assert.deepEqual(offenders, [], `${f} duzt`);
  }
});
