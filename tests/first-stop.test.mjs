// Guard suite for "Der erste Halt", the homepage demo
// (astro-site/src/components/linie/FirstStop.astro).
//
// The demo's promise is that it grades "exactly the way the course checks".
// That holds only if (a) it plays real items from the built pool, (b) it calls
// the course's own checker, never a copy, and (c) every verdict it shows a
// visitor is the verdict the lesson player would give. This suite pins all
// three, plus the no-JS fallback and the door it opens at the end.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { DEMO_ITEM_IDS } from '../astro-site/src/data/firstStop.js';
import { FREE_COURSE_HREF } from '../src/data/offers.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.extra.json'));
const explanations = JSON.parse(read('src/data/lessonPools/a11.explanationsEn.json'));
const item = (id) => pool.items.find((it) => it.id === id);
const grade = (id, input) => {
  const it = item(id);
  // Exactly the fields the page sends to the browser (FirstStop.astro `grade`).
  const sent = { accepted: it.accepted, answer: it.answer, topic: it.topic, type: it.type, caseSensitive: it.caseSensitive === true };
  return checkAnswer(input, sent.accepted, checkOptionsFor(sent)).result;
};

test('the demo plays three real Lektion 1 items with English explanations', () => {
  assert.equal(DEMO_ITEM_IDS.length, 3);
  for (const id of DEMO_ITEM_IDS) {
    assert.ok(item(id), `${id} is in the built A1.1 pool`);
    assert.match(id, /^extra-a11-l01-/, `${id} is from Lektion 1`);
    assert.ok(explanations[id], `${id} has an English explanation`);
  }
});

test('the page sends the checker the same options the lesson player derives', () => {
  for (const id of DEMO_ITEM_IDS) {
    const it = item(id);
    const sent = { accepted: it.accepted, answer: it.answer, topic: it.topic, type: it.type, caseSensitive: it.caseSensitive === true };
    assert.deepEqual(checkOptionsFor(sent), checkOptionsFor(it), `${id}: options match the player's`);
  }
});

test('every verdict the demo promises is the course checker’s verdict', () => {
  // 1. Formal hello: the capital I IS the task.
  assert.equal(grade('extra-a11-l01-06', 'Ihnen'), RESULT.CORRECT);
  assert.equal(grade('extra-a11-l01-06', 'ihnen'), RESULT.WRONG, 'lowercase is wrong where capitalisation is the task');
  // 2. Spelling: the separators fold (CLAUDE.md, the lesson checker).
  for (const answer of ['H-A-L-L-O', 'HALLO', 'H A L L O', 'h-a-l-l-o']) {
    assert.equal(grade('extra-a11-l01-04', answer), RESULT.CORRECT, answer);
  }
  // 3. The correction: the prefilled wrong greeting is wrong, the fix is right.
  assert.equal(grade('extra-a11-l01-08', 'Gute Tag, Frau Kaya!'), RESULT.WRONG);
  assert.equal(grade('extra-a11-l01-08', 'Guten Tag, Frau Kaya'), RESULT.CORRECT);
  assert.equal(grade('extra-a11-l01-08', 'Guten Tag, Frau Kaya!'), RESULT.CORRECT);
});

test('the component imports the real checker, keeps a no-JS answer, and ends at the free course', () => {
  const src = read('astro-site/src/components/linie/FirstStop.astro');
  assert.match(src, /import\('\.\.\/\.\.\/\.\.\/\.\.\/src\/lib\/lesson\/check\.js'\)/, 'the course checker, loaded on the first answer');
  assert.doesNotMatch(src, /function checkAnswer|function normalizeSpelling/, 'never a copy of the checker');
  assert.match(src, /<details class="fs-answer/, 'every item keeps its answer behind <details> for no-JS visitors');
  assert.match(src, /href=\{FREE_COURSE_HREF\}/);
  assert.equal(FREE_COURSE_HREF, '/course/a1.1');
  assert.match(src, /autocapitalize="none"/, 'the phone keyboard must not capitalise the answer for the learner');
  const css = read('astro-site/src/styles/linie.css');
  assert.match(css, /html:not\(\.js\) \.fs-form/, 'the form hides without JS (the <details> stays)');
});

test('the demo is re-pointed when the A1.1 course is replaced (Course v2)', () => {
  // PR #149 adds src/config/courseV2.js. While A1.1 stays on the v1 course the
  // demo's items are the course's items; the day a1.1 joins COURSE_V2_LIVE they
  // are not, and the homepage would demo a course nobody can open.
  const path = join(ROOT, 'src/config/courseV2.js');
  if (!existsSync(path)) return;
  const live = readFileSync(path, 'utf8').match(/COURSE_V2_LIVE\s*=\s*\[([^\]]*)\]/);
  assert.ok(!live || !/['"]a1\.1['"]/.test(live[1]), 'A1.1 is on Course v2 now — re-point DEMO_ITEM_IDS (astro-site/src/data/firstStop.js) at v2 unit 1');
});
