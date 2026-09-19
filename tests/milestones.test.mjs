// Guard suite for the course-home milestone card (Wave 2, 2026-09-19):
// the pure `milestoneFor` matrix, and source-level pins for the component's
// storage key, celebrate-on-30 rule, and string-table wiring.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { milestoneFor, MILESTONES } from '../src/lib/course/milestones.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('MILESTONES is exactly 1, 7, 30', () => {
  assert.deepEqual(MILESTONES, [1, 7, 30]);
});

test('milestoneFor matrix: fires on an unseen milestone day, nothing else', () => {
  const cases = [
    // [streak, seen, expected]
    [0, [], null],
    [1, [], 1],
    [2, [], null],
    [6, [], null],
    [7, [], 7],
    [8, [], null],
    [29, [], null],
    [30, [], 30],
    [31, [], null],
    [365, [], null],
    // already seen → nothing, even on the exact day
    [1, [1], null],
    [7, [7], null],
    [30, [30], null],
    // seeing one milestone must not suppress another
    [7, [1], 7],
    [30, [1, 7], 30],
  ];
  for (const [streak, seen, expected] of cases) {
    assert.equal(milestoneFor(streak, new Set(seen)), expected, `streak=${streak} seen=${JSON.stringify(seen)}`);
  }
});

test('milestoneFor accepts a plain array or iterable for seen, not only a Set', () => {
  assert.equal(milestoneFor(7, [7]), null);
  assert.equal(milestoneFor(7, []), 7);
  assert.equal(milestoneFor(7, undefined), 7);
});

test('milestoneFor is pure: same inputs, same output, no storage access', () => {
  const src = read('src/lib/course/milestones.js');
  assert.doesNotMatch(src, /localStorage|sessionStorage|safeGet|safeSet/, 'milestoneFor must not touch storage directly');
});

test('MilestoneCard re-exports the pure function from the plain-.js module', () => {
  const src = read('src/components/course/MilestoneCard.jsx');
  assert.match(src, /import \{ MILESTONES, milestoneFor \} from '\.\.\/\.\.\/lib\/course\/milestones\.js'/);
  assert.match(src, /export \{ MILESTONES, milestoneFor \};/);
});

test('the component reads and writes storage through safeStorage, keyed dm_milestone_<n>', () => {
  const src = read('src/components/course/MilestoneCard.jsx');
  assert.match(src, /import \{ safeGet, safeSet \} from '\.\.\/\.\.\/utils\/safeStorage\.js'/);
  assert.match(src, /const seenKey = \(n\) => `dm_milestone_\$\{n\}`;/);
  assert.match(src, /safeGet\(seenKey\(n\)\) === '1'/);
  assert.match(src, /safeSet\(seenKey\(n\), '1'\)/);
  assert.match(src, /markSeen\(due\)/, 'dismissing must mark the currently-due milestone seen');
});

test('celebrate variant only fires for day 30', () => {
  const src = read('src/components/course/MilestoneCard.jsx');
  assert.match(src, /variant=\{due === 30 \? 'celebrate' : 'ghost'\}/);
});

test('milestone strings exist in both chrome languages and German is Sie', () => {
  const src = read('src/lib/lesson/strings.js');
  const keys = ['milestone.day1.title', 'milestone.day1.body', 'milestone.day7.title', 'milestone.day7.body', 'milestone.day30.title', 'milestone.day30.body', 'milestone.dismiss'];
  for (const k of keys) {
    const count = src.split(`'${k}':`).length - 1;
    assert.equal(count, 2, `${k} must appear in both the en and de tables`);
  }
  const deTable = src.slice(src.indexOf('  de: {'));
  const deMilestoneBlock = deTable.slice(deTable.indexOf('milestone.day1.title'), deTable.indexOf('milestone.dismiss') + 60);
  assert.doesNotMatch(deMilestoneBlock, /\b(du|dich|dir|dein|deine[mnrs]?|kannst|hast)\b/, 'German milestone copy must be Sie, not du');
});

test('MilestoneCard is mounted on the course home behind `loaded`, so it never flashes before streak is known', () => {
  const src = read('src/pages/CurriculumHomePage.jsx');
  assert.match(src, /\{loaded && <MilestoneCard streak=\{streak\}\s*\/>\}/);
});
