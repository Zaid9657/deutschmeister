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
  assert.equal(grade('extra-a11-l01-07', 'Ich heiße Ana.'), RESULT.CORRECT);
  assert.equal(grade('extra-a11-l01-07', 'Ich heißen Ana.'), RESULT.WRONG);
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
  const css = read('astro-site/src/styles/concept4.css');
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

// Execute the actual browser handlers with the actual lesson checker. This
// covers interaction even on executors where Chrome cannot open IPC sockets.
import vm from 'node:vm';
import { motionLinie } from '../src/data/design-tokens.js';
import { DEMO_ITEM_LABELS } from '../astro-site/src/data/firstStop.js';
function demoRuntime({ reduced = false, unavailable = false } = {}) {
  const events = []; const animations = [];
  const node = () => {
    const classes = new Set();
    return { hidden: false, value: '', textContent: '', innerHTML: '', attrs: {}, handlers: {},
      classList: { add: (...names) => names.forEach((n) => classes.add(n)), remove: (...names) => names.forEach((n) => classes.delete(n)), toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
      setAttribute(name, value) { this.attrs[name] = value; }, getAttribute(name) { return this.attrs[name]; },
      addEventListener(name, fn) { this.handlers[name] = fn; }, focus() {}, animate: (...args) => animations.push(args),
    };
  };
  const elements = Object.fromEntries(['[data-fs-status]', '[data-fs-nav]', '[data-fs-next]', '[data-fs-done]', '#fs-h'].map((key) => [key, node()]));
  elements['[data-fs-done]'].hidden = true; elements['[data-fs-nav]'].hidden = true;
  const items = DEMO_ITEM_IDS.map((id) => {
    const entry = item(id); const n = node(); n.attrs['data-grade'] = JSON.stringify(entry);
    n.parts = Object.fromEntries(['[data-fs-form]', 'input', '[data-fs-feedback]', '.fs-answer', '.fs-answer p span', '.c4-exercise-check'].map((key) => [key, node()]));
    n.querySelector = (selector) => n.parts[selector]; return n;
  });
  const root = { ...node(), querySelectorAll: () => items, querySelector: (key) => elements[key], contains: () => true };
  let fail = unavailable;
  const source = read('astro-site/src/components/linie/FirstStop.astro').split('<script>')[1].split('</script>')[0]
    .replace(/^\s*import .*;$/gm, '').replace("import('../../../../src/lib/lesson/check.js')", 'loadCheckerModule()');
  vm.runInNewContext(source, { document: { querySelector: () => root, activeElement: null }, window: { matchMedia: () => ({ matches: reduced }) }, motionLinie, DEMO_ITEM_LABELS, track: (name, props) => events.push({ name, props }), loadCheckerModule: async () => {
    if (fail) { fail = false; throw new Error('chunk failed'); } return { checkAnswer, checkOptionsFor };
  } });
  return { items, events, animations, elements, root,
    answer: async (i, value) => { items[i].parts.input.value = value; await items[i].parts['[data-fs-form]'].handlers.submit({ preventDefault() {} }); },
    next: () => elements['[data-fs-next]'].handlers.click(),
  };
}
test('the real quick-exercise handlers accept course answers, finish once, and respect reduced motion', async () => {
  for (const reduced of [false, true]) {
    const demo = demoRuntime({ reduced });
    for (const [i, answer] of ['Ich heiße Ana.', 'Ihnen', 'H A L L O'].entries()) {
      await demo.answer(i, answer);
      assert.match(demo.items[i].parts['[data-fs-feedback]'].innerHTML, /Richtig/);
      if (i < 2) { assert.equal(demo.elements['[data-fs-nav]'].hidden, false); demo.next(); }
    }
    assert.equal(demo.elements['[data-fs-done]'].hidden, false);
    assert.deepEqual(demo.events.map((e) => e.name), ['demo_started', 'demo_completed']);
    assert.equal(demo.events.at(-1).props.result, 'correct');
    assert.equal(demo.animations.length, reduced ? 0 : 3);
  }
});
test('wrong answers do not get a success tick; a failed checker chunk can be retried without grading locally', async () => {
  const wrong = demoRuntime(); await wrong.answer(0, 'Ich heißen Ana.');
  assert.match(wrong.items[0].parts['[data-fs-feedback]'].innerHTML, /Not quite/);
  assert.equal(wrong.animations.length, 0); assert.notEqual(wrong.items[0].parts['.c4-exercise-check'].textContent, '✓');
  const failed = demoRuntime({ unavailable: true }); await failed.answer(0, 'Ich heiße Ana.');
  assert.match(failed.items[0].parts['[data-fs-feedback]'].innerHTML, /could not load/);
  assert.equal(failed.elements['[data-fs-nav]'].hidden, true);
  await failed.answer(0, 'Ich heiße Ana.');
  assert.match(failed.items[0].parts['[data-fs-feedback]'].innerHTML, /Richtig/);
});
