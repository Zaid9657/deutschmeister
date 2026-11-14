import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALPHABET, DIGITS, PRICES, FULL_HOUR } from '../src/data/curricula/a11.sets.js';
import { buildSetStage, spellWithSet, setGroups } from '../src/lib/lesson/taughtSet.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { packRun, unpackRun, resumeStageIndex } from '../src/lib/lesson/runState.js';
import { practiceScore } from '../src/lib/lesson/mastery.js';
import { lektionMinutesEstimate } from '../src/data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';
const pool = JSON.parse(readFileSync('src/data/lessonPools/a11.json'));

test('explicit mappings cover the whole alphabet, digits, teens, tens and hundred', () => {
  assert.equal(ALPHABET.members.map((m) => m.written).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜß');
  assert.deepEqual(DIGITS.members.map((m) => Number(m.written)), Array.from({ length: 11 }, (_, i) => i));
  assert.deepEqual(PRICES.members.map((m) => Number(m.written)), [...Array.from({ length: 10 }, (_, i) => i + 11), 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.equal(spellWithSet('Chakiri', ALPHABET), 'Zeh. Hah. Ah. Kah. Ih. Err. Ih');
  assert.equal(spellWithSet('süß', ALPHABET), 'Ess. Üh. Eszett');
  assert.deepEqual(ALPHABET.contrasts, [['E', 'I'], ['G', 'J'], ['V', 'W']]);
  assert.deepEqual(PRICES.contrasts, [['13', '30'], ['14', '40'], ['15', '50'], ['16', '60'], ['17', '70'], ['18', '80'], ['19', '90']]);
});

test('every short group leads to 2–3 checked responses; contrasts have independent checks', () => {
  for (const set of [ALPHABET, DIGITS, PRICES, FULL_HOUR]) {
    const stage = buildSetStage(set);
    const groups = setGroups(set);
    for (const [index, group] of groups.entries()) {
      const steps = stage.steps.filter((s) => s.group === index);
      assert.ok(group.members.length <= 5 && group.members.length * 20 <= 120);
      const checks = steps.filter((s) => s.kind === 'check');
      assert.ok(checks.length >= 2 && checks.length <= 3);
      assert.equal(steps.at(-1).kind, 'check');
      for (const { item } of checks) {
        assert.match(item.promptDe, /Sie/);
        assert.ok(item.promptEn && item.audioText);
        assert.equal(checkAnswer(item.answer, item.accepted, checkOptionsFor(item)).result, RESULT.CORRECT);
        for (const option of item.options || []) assert.equal(checkAnswer(option, item.accepted, checkOptionsFor(item)).result, option === item.answer ? RESULT.CORRECT : RESULT.WRONG);
        if (item.options) assert.ok(item.options.length >= 2);
      }
      if (group.contrast) assert.deepEqual(checks.map((c) => c.item.answer), group.members.map((m) => m.written));
      if (group.transfer) for (const { item } of checks) assert.ok(!set.members.concat(set.rule.examples).some((m) => m.written === item.answer), 'rule is checked with unshown numbers');
    }
  }
});

test('set steps resume inside a group and contribute time, never practice gold', () => {
  const l = structuredClone(CURRICULUM_A11.lektionen[0]); l.guided.sets = [ALPHABET];
  const stages = buildLesson({ curriculum: CURRICULUM_A11, lektion: l, pool }).stages;
  const at = stages.findIndex((s) => s.kind === 'taught-set');
  const run = unpackRun(packRun({ flow: 'guided', stageKey: stages[at].key, stageIndex: at, itemIndex: 8 }));
  assert.equal(resumeStageIndex(stages, run), at);
  assert.equal(run.itemIndex, 8);
  assert.equal(practiceScore([{ stage: 'taught-set', itemId: 's', correct: true }, { stage: 'practice', itemId: 'p', correct: false }]).accuracy, 0);
  const noSet = structuredClone(l); delete noSet.guided.sets;
  assert.ok(lektionMinutesEstimate(l).lo > lektionMinutesEstimate(noSet).lo);
});

test('the actual set screen gates input on hearing and saying, grades choices, and preserves audio fallback evidence', async () => {
  const { loadJsxModule } = await import('./helpers/renderJsx.mjs');
  let values = [], cursor = 0;
  const react = { useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], (v) => { values[i] = v; }]; } };
  const { default: Screen } = await loadJsxModule('src/components/lesson/TaughtSetStage.jsx', {
    react, './StageShell.jsx': { default: 'StageShell' }, '../ui/Button.jsx': { default: 'Button' },
    './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
    '../../lib/lesson/check.js': { checkAnswer, checkOptionsFor, RESULT },
    '../../lib/lesson/strings.js': { useLessonLang: () => ['de'], t: (k) => k },
  });
  const nodes = (n) => Array.isArray(n) ? n.flatMap(nodes) : !n || typeof n !== 'object' ? [] : [n, ...nodes(n.props?.children)];
  const find = (type) => nodes(render()).find((n) => n.type === type);
  let results = [], finished = 0;
  const stage = buildSetStage(DIGITS);
  const props = { stage, itemIndex: 0, lektionId: 'a1.1-l02', onItemChange: (n) => { props.itemIndex = n; values = []; }, onResult: (i, r) => results.push(r), onDone: () => finished++ };
  const render = () => { cursor = 0; return Screen(props); };
  assert.equal(find('StageShell').props.primaryDisabled, true);
  assert.equal(find('ReadAloudLine'), undefined);
  find('PlayButton').props.onPlayed();
  assert.equal(find('StageShell').props.primaryDisabled, true);
  find('ReadAloudLine').props.onResult({ usedMic: false, selfConfirmed: true });
  assert.equal(find('StageShell').props.primaryDisabled, false);
  find('StageShell').props.onPrimary();
  assert.equal(props.itemIndex, 1);
  props.itemIndex = stage.steps.findIndex((s) => s.kind === 'check'); values = [];
  assert.equal(find('select'), undefined, 'no recognition choices before play/fallback');
  find('PlayButton').props.onFallback();
  const item = stage.steps[props.itemIndex].item;
  find('select').props.onChange({ target: { value: item.options.find((s) => s !== item.answer) } });
  find('Button').props.onClick();
  assert.deepEqual(JSON.parse(JSON.stringify(results)), [{ result: RESULT.WRONG, correct: false, listened: false }]);
  assert.equal(find('StageShell').props.primaryDisabled, false);
  assert.equal(finished, 0);
});

test('saved member speech is namespaced per set and stripped to flags and counts', () => {
  const run = unpackRun(packRun({ flow: 'guided', stageKey: 'set:alphabet', itemIndex: 3,
    taughtSetReadAloud: { alphabet: { 3: { pct: 0.9, attempts: 1, usedMic: true, text: 'private', transcript: 'private' } }, 'numbers-0-10': { 3: { usedMic: false, selfConfirmed: true } } },
  }));
  assert.equal(run.taughtSetReadAloud.alphabet[3].pct, 0.9);
  assert.equal(run.taughtSetReadAloud['numbers-0-10'][3].selfConfirmed, true);
  assert.doesNotMatch(JSON.stringify(run), /private|transcript|"text"/);
});
