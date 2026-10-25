// Guard suite for the grammar ExercisePlayer — the only interactive surface in
// the product with paying customers behind it.
//
// The bug this exists to prevent, found 2026-09-03 and present since the file's
// first commit (2026-04-16):
//
//   FillBlank and MultipleChoice each hold local state (`submitted`/`value` and
//   `selected`). The parent rendered them from a bare conditional with NO `key`.
//   React reconciles by position and type, so when one question was followed by
//   another of the SAME type it reused the instance and FillBlank stayed
//   `submitted` into the next question: the input was disabled, still held the
//   previous answer, was marked wrong against a prompt the learner had never
//   seen, and rendered no Check button — while the parent had reset `answered`,
//   so there was no Next button either. The lesson dead-ended with no control on
//   screen, verified in a browser at question 2 of 8 on /grammar/a1.2/question-words/.
//
// It was invisible for five months because nothing renders this file in CI and
// a source read looks entirely reasonable. These are cheap source-level pins,
// in the same spirit as the brand ratchets: they cannot prove the component
// works, only that the two things that made it fail silently are still in place.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { answerMatches as spaAnswerMatches } from '../src/utils/answerMatch.js';
import { courseForLevel, eur, SELLABLE_LEVELS } from '../src/data/pricing.js';
import { stationFor } from '../src/data/offers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'astro-site/src/components/ExercisePlayer.jsx'), 'utf8');

/** Top-level plain functions of the island, run in Node (no JSX involved). */
function islandFunctions(...names) {
  const code = names.map((name) => {
    const fn = src.match(new RegExp(`^function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`, 'm'));
    assert.ok(fn, `ExercisePlayer.jsx has no top-level function ${name}`);
    return fn[0];
  });
  return vm.runInNewContext(`${code.join('\n')}\n({ ${names.join(', ')} });`, {});
}

test('both question inputs are keyed, so each question remounts with fresh state', () => {
  // Without these keys the player dead-ends on two same-type questions in a row.
  for (const component of ['MultipleChoice', 'FillBlank']) {
    const rendered = new RegExp(`<${component}\\s+key=\\{`);
    assert.match(
      src,
      rendered,
      `<${component}> is rendered without a key — a same-type question run will reuse the instance and strand the learner`,
    );
  }
});

test('the components that need the key still hold local state', () => {
  // If a future refactor lifts this state into the parent the key stops being
  // load-bearing — but until then, removing it re-introduces the dead end. This
  // pin fails loudly if the premise changes, so the key rule gets re-read
  // rather than silently kept or silently dropped.
  assert.match(src, /function FillBlank[\s\S]{0,400}useState/, 'FillBlank no longer holds local state — re-check the key rule above');
  assert.match(src, /function MultipleChoice[\s\S]{0,400}useState/, 'MultipleChoice no longer holds local state — re-check the key rule above');
});

test('the results screen always offers a way out of the topic', () => {
  // Every branch of the done state must render an action. The screen used to
  // offer only "Practice again", which asks the 89% who just completed a topic
  // to repeat themselves instead of moving on.
  assert.match(src, /Practice again/, 'the retry action is gone');
  assert.match(src, /nextHref/, 'the results screen no longer offers the next topic');
});

// ── The fill-in checker agrees with its SPA twin (cross-check 2026-10-25, SHL-22) ──
// src/utils/answerMatch.js gained .normalize('NFC') on 10-22; this island, which
// says it mirrors it, did not — so 'für' typed or pasted as u + combining ¨ was
// marked wrong on /grammar/ pages and passed in the course.

test('the island and the SPA matcher agree, decomposed umlauts included', () => {
  const { answerMatches } = islandFunctions('normalizeAnswer', 'answerMatches');
  const cases = [
    ['für'.normalize('NFD'), { correct_answer: 'für' }],
    ['Brüder'.normalize('NFD'), { correct_answer: 'Brüder' }],
    ['GRÜẞE'.normalize('NFD'), { correct_answer: 'Grüße' }],
    ['fuer', { correct_answer: 'für' }],
    ['  Wäre ', { correct_answer: 'wäre'.normalize('NFD') }],
    ['bin', { correct_answer: 'sind', acceptable_answers: ['bin'] }],
    ['fur', { correct_answer: 'für' }],
    ['', { correct_answer: 'für' }],
  ];
  for (const [input, exercise] of cases) {
    const spa = spaAnswerMatches(input, [exercise.correct_answer, ...(exercise.acceptable_answers ?? [])]);
    assert.equal(answerMatches(input, exercise), spa, JSON.stringify(input));
  }
  assert.equal(answerMatches('für'.normalize('NFD'), { correct_answer: 'für' }), true);
});

// ── Practice again re-deals (SHL-23) ────────────────────────────────────────
// restart() replayed the identical sequence with options in stored order (the
// correct option first in 34% of the four-option items), right after showing
// the corrections: the retry rewarded remembering positions, not the grammar.

test('options are dealt in a seeded order: a permutation, stable per question and run, new per run', () => {
  const { shuffled, seededRandom } = islandFunctions('seededRandom', 'shuffled');
  const options = ['ich bin', 'bin müde', 'müde bin', 'bin'];
  const deal = (seed) => shuffled(options, seededRandom(seed));
  assert.deepEqual([...deal('q1:0')].sort(), [...options].sort(), 'every option, once');
  assert.deepEqual(deal('q1:0'), deal('q1:0'), 'the build and the browser render the same first order (hydration)');
  const runs = new Set(Array.from({ length: 8 }, (_, run) => deal(`q1:${run}`).join('|')));
  assert.ok(runs.size > 1, 'Practice again deals the options anew');
});

test('across the grammar bank the correct option is no longer first a third of the time', () => {
  const { shuffled, seededRandom } = islandFunctions('seededRandom', 'shuffled');
  const bank = JSON.parse(readFileSync(join(root, 'grammar-content-cache.json'), 'utf8')).exercises
    .filter((e) => e.exercise_type === 'multiple_choice' && Array.isArray(e.options) && e.options.length === 4 && e.options.includes(e.correct_answer));
  assert.ok(bank.length >= 200, `premise: ${bank.length} four-option items`);
  const firstStored = bank.filter((e) => e.options[0] === e.correct_answer).length / bank.length;
  // Over four runs (the first plus three "Practice again"), so a cache refresh cannot make this flaky.
  const runs = [0, 1, 2, 3];
  const firstDealt = runs.reduce((n, run) => n + bank.filter((e) => shuffled(e.options, seededRandom(`${e.id}:${run}`))[0] === e.correct_answer).length, 0) / (bank.length * runs.length);
  assert.ok(firstStored > 0.3, `premise: stored order puts the answer first ${(firstStored * 100).toFixed(0)}%`);
  assert.ok(Math.abs(firstDealt - 0.25) < 0.06, `dealt order puts the answer first ${(firstDealt * 100).toFixed(0)}%`);
});

test('the next run plays a new order of the same exercises', () => {
  const { nextRunOrder } = islandFunctions('seededRandom', 'shuffled', 'nextRunOrder');
  const run1 = ['e1', 'e2', 'e3', 'e4', 'e5'];
  const identity = () => 0.9999; // a shuffle that happens to keep the order
  for (const random of [Math.random, identity]) {
    const run2 = [...nextRunOrder(run1, random)]; // copied out of the vm realm
    assert.deepEqual([...run2].sort(), [...run1].sort());
    assert.notDeepEqual(run2, run1, 'never the sequence just played');
  }
  assert.deepEqual([...nextRunOrder(['only'], identity)], ['only']);
});

test('the run reads its own order and re-deals on restart; scoring is unchanged', () => {
  assert.match(src, /const \[order, setOrder\] = useState\(\(\) => exercises \?\? \[\]\);/);
  assert.match(src, /const exercise = order\[current\];/);
  const restart = src.match(/const restart = \(\) => \{([\s\S]*?)\n {2}\};/)[1];
  assert.match(restart, /setOrder\(\(previous\) => nextRunOrder\(previous\)\);/);
  assert.match(restart, /setRun\(\(r\) => r \+ 1\);/);
  assert.match(src, /shuffled\(exercise\.options \?\? \[\], seededRandom\(`\$\{exercise\.id\}:\$\{run\}`\)\)/);
  assert.match(src, /\{options\.map\(\(opt\) => \{/);
  assert.doesNotMatch(src, /\(exercise\.options \?\? \[\]\)\.map/, 'options render in the dealt order');
  // The answer is compared by value, so the dealt order cannot change a grade.
  assert.match(src, /onAnswer\(opt === exercise\.correct_answer\);/);
  assert.match(src, /m\.recordAttempt\(topicId, pct\)/);
});

// ── The lock's doors lead to this level's course (SHL-21, SHL-10) ──────────
// "Buy the A1.2 course" opened /pricing/, whose ticket starts on another
// course; the signed-out lock named no course at all; its "Log in" was an
// absolute link that dropped the page the learner was on.

test('the lock sells the level it locks, on that course page', () => {
  const lock = src.match(/function LockedExercises\([\s\S]*?\n\}/)[0];
  assert.match(lock, /const coursePage = `\/courses\/\$\{levelToSlug\(level\.toLowerCase\(\)\)\}\/`;/);
  assert.match(src, /^import \{ levelToSlug \} from '\.\.\/data\/courseContents\.js';$/m);
  assert.match(lock, /<a href=\{coursePage\} className=\{primary\}>\s*Buy the \{code\} course — \{eur\(course\.price\)\} once/);
  assert.match(lock, /<a href="\/pricing\/#pro" className=\{buyable \? secondary : primary\}>/, 'Go Pro stays on the Pro comparison');
  assert.doesNotMatch(lock, /href="\/pricing\/" className=\{primary\}/);
  // Signed out: a quiet second door to the course, from the same price data.
  assert.match(lock, /\{!signedIn && buyable && \(/);
  assert.match(lock, /<a href=\{coursePage\}[^>]*>\s*Own \{code\} for \{eur\(course\.price\)\}/);
  assert.match(lock, /<a href=\{loginHref\} className=\{secondary\}>/);
  // The page each sellable level links is the station's own course page.
  for (const level of SELLABLE_LEVELS) {
    assert.equal(`/courses/${level.replace('.', '-')}/`, stationFor(level).coursePage, level);
    assert.ok(eur(courseForLevel(level).price).startsWith('€'), level);
  }
});

test('an exam hub whose band has a course on sale leads with that course', () => {
  const hub = readFileSync(join(root, 'astro-site/src/pages/pruefung/[slug].astro'), 'utf8');
  assert.match(hub, /^import \{ stationFor \} from '\.\.\/\.\.\/data\/offers\.js';$/m);
  assert.match(hub, /const station = stationFor\(hub\.sublevels\?\.\[hub\.sublevels\.length - 1\]\);/);
  assert.match(hub, /return station && station\.status === 'ticket' \? station : null;/);
  assert.match(hub, /<a href=\{planCourse\.coursePage\} class=\{BTN_PRIMARY\}>/);
  assert.match(hub, /<a href=\{hub\.courseHref\} class=\{BTN_SECONDARY\}>\s*Zum 4-Wochen-Plan/);
  // Which hubs that is today: the plans gated on a1.2 and a2.2 (App.jsx).
  assert.equal(stationFor('a1.2').coursePage, '/courses/a1-2/');
  assert.equal(stationFor('a2.2').coursePage, '/courses/a2-2/');
  assert.equal(stationFor('b1.2').status, 'building', 'the telc B1 hub keeps its own plan page');
});
