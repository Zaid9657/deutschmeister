import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A12 as c12 } from '../src/data/curricula/a12.js';
import { lektionMinutesEstimate, lektionPartEstimate } from '../src/data/curricula/a11.meta.js';
import { packRun, readRun, saveRun, resumeStageIndex } from '../src/lib/lesson/runState.js';
import { stageSteps } from '../src/lib/lesson/stageReach.js';
import { sessionCompleted } from '../src/lib/lesson/sessions.js';
import { A11_ART } from '../src/data/curricula/a11.art.js';
import * as tokens from '../src/data/design-tokens.js';
import { loadJsxModule } from './helpers/renderJsx.mjs';
import { sayText } from '../src/lib/lesson/scene.js';
import { classifySound, buildSoundItems, nounsOf } from '../src/lib/lesson/guidedSound.js';
import { guidedFindings } from '../scripts/lib/guided-content.mjs';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const build = (lektion, attempt = 1) => buildLesson({ curriculum: c, lektion, pool, attempt });
const draftLesson = (lesson) => ({ ...lesson, flow: 'guided', ...JSON.parse(read(`docs/course-factory/a11-guided/content/l${String(lesson.nr).padStart(2, '0')}.json`)) });

test('one shared sound classifier accepts every original shape and rejects ambiguous or unsupported markings', () => {
  const examples = {
    'word-stress': 'Te-le-FON', 'prefixed-stress': 'der BRU-der', 'sound-word': 'du SPIELST',
    pair: 'wie – Sie', phrase: 'Sie sind', 'sentence-stress': 'Wie SPÄT ist es?', melody: 'Fährt der ZUG?↗',
  };
  for (const [kind, original] of Object.entries(examples)) {
    assert.equal(classifySound(original)?.kind, kind);
    const lesson = draftLesson(c.lektionen[0]);
    lesson.phonetik = { ...lesson.phonetik, items: [original] };
    assert.equal(guidedFindings({ lektionen: [lesson] }).filter((f) => f.includes('sound')).length, 0, original);
  }
  for (const bad of [null, 42, '', 'HAL-LO', 'hal-lo', 'HAL--lo', '↗', 'Wie SPÄT IST es?', 'word – ']) {
    assert.equal(classifySound(bad), null, String(bad));
    const lesson = draftLesson(c.lektionen[0]); lesson.phonetik = { items: [bad] };
    assert.ok(guidedFindings({ lektionen: [lesson] }).some((f) => f.includes('sound')), String(bad));
  }
  assert.equal(new Set(c.lektionen.flatMap((l) => l.phonetik.items.map((s) => classifySound(s).kind))).size, 7);
});

test('all 36 original sound items derive unique checked answers and fair bilingual questions from marking or real audio', () => {
  let count = 0;
  for (const lesson of c.lektionen) {
    const items = buildSoundItems(lesson, nounsOf(c.lektionen));
    assert.deepEqual(items.map((i) => i.marked), lesson.phonetik.items);
    for (const item of items) {
      count++;
      assert.ok(item.promptDe && item.promptEn && item.modelDe && item.modelEn);
      assert.match(item.promptDe, /\bSie\b/);
      assert.doesNotMatch(item.text, /[-↗↘]/);
      assert.ok(item.options.length >= 2);
      assert.equal(new Set(item.options).size, item.options.length);
      for (const option of item.options) assert.equal(checkAnswer(option, item.accepted, checkOptionsFor(item)).result, option === item.answer ? RESULT.CORRECT : RESULT.WRONG);
      const shape = classifySound(item.marked);
      if (['word-stress', 'prefixed-stress'].includes(shape.kind)) {
        assert.equal(item.answer, [...shape.prefix, shape.syllables.map((s, i) => i === shape.stress ? s.toLocaleUpperCase('de') : s.toLocaleLowerCase('de')).join('-')].join(' '));
        assert.ok(item.options.every((o) => /\p{Lu}/u.test(o) && o.includes('-')));
      } else if (shape.kind === 'sentence-stress') {
        assert.equal(item.answer.toLocaleLowerCase('de'), shape.stress.toLocaleLowerCase('de'));
        assert.match(item.modelEn, /computer voice may stress it differently/);
      } else if (shape.kind === 'melody') {
        assert.equal(item.answer, shape.direction);
        assert.match(item.modelEn, /computer voice may not follow/);
      } else {
        assert.equal(item.answer, item.text);
        for (const option of item.options) assert.ok(lesson.phonetik.items.some((original) => original.toLocaleLowerCase('de').replace(/-/g, '').split(' – ').includes(option.toLocaleLowerCase('de'))));
      }
    }
  }
  assert.equal(count, 36);
  assert.match(read('src/lib/lesson/buildGuided.js'), /buildSoundItems\(lektion, nounsOf\(/);
  assert.match(read('scripts/lib/guided-content.mjs'), /classifySound\(marked\)/);
});

test('only explicit meta headings are exempt from guided read coverage; other guided rules still apply', () => {
  for (const nr of [2, 4]) {
    const lesson = draftLesson(c.lektionen[nr - 1]);
    assert.deepEqual(guidedFindings({ lektionen: [lesson] }), []);
    const heading = lesson.wortfeld.find((w) => w.meta === true);
    assert.ok(heading);
    assert.ok(!lesson.guided.read.text.includes(nr === 2 ? '0–10' : '11–100'));
    delete heading.meta;
    assert.ok(guidedFindings({ lektionen: [lesson] }).some((s) => s.includes(`remaining Wortfeld entry ${heading.de}`)));
    heading.meta = 'true';
    assert.ok(guidedFindings({ lektionen: [lesson] }).some((s) => s.includes(`remaining Wortfeld entry ${heading.de}`)));
    heading.meta = true;
    lesson.wortfeld.push({ de: 'die Giraffe', word: 'Giraffe' });
    assert.ok(guidedFindings({ lektionen: [lesson] }).some((s) => s.includes('die Giraffe')));
    lesson.guided.read.questions.pop();
    assert.ok(guidedFindings({ lektionen: [lesson] }).some((s) => s.includes('two questions')));
  }
});

test('all twelve guided lessons preserve the original dialogue, draws, scoring stages and pauses', () => {
  assert.equal(c.lektionen.length, 12);
  const unchanged = (run) => Object.fromEntries(run.stages.filter((s) => !['dialog', 'scene', 'wortfeld', 'phonetik', 'sound', 'read', 'fluency', 'proof', 'taught-set'].includes(s.kind)).map(({ part: _part, nextHook: _hook, ...s }) => [s.key, s]));
  for (const lesson of c.lektionen) {
    assert.equal(lesson.flow, 'guided');
    if (lesson.nr > 1) {
      const draft = draftLesson(lesson);
      assert.deepEqual(lesson.guided, draft.guided);
      assert.deepEqual(lesson.nextHook, draft.nextHook);
    }
    for (const attempt of [1, 2, 3]) {
      const run = build(lesson, attempt), legacy = build({ ...lesson, flow: undefined }, attempt);
      assert.deepEqual(unchanged(run), unchanged(legacy), `${lesson.id} draw ${attempt}`);
      assert.equal(run.flow, 'guided');
      assert.deepEqual(run.stages.map((s) => s.key), ['pretest', ...(lesson.guided.sets || []).filter((s) => !s.placement || s.placement === 'before-scene').map((s) => `set:${s.id}`), ...(lesson.guided.noticeBeforeScene ? ['notice'] : []), 'scene', ...(lesson.nr === 1 ? ['set:alphabet', 'scene:2'] : []), 'wortfeld', 'wortfeld-read', 'sound', 'read', ...(!lesson.guided.noticeBeforeScene ? ['notice'] : []), ...(lesson.guided.sets || []).filter((s) => s.placement === 'part2').map((s) => `set:${s.id}`), 'practice', 'derived', 'dictation', 'fluency', 'speaking', 'writing', ...(lesson.proof ? ['proof'] : []), 'requeue', 'recap']);
      const scene = { chunks: run.stages.filter((s) => s.kind === 'scene').flatMap((s) => s.chunks) };
      assert.deepEqual(scene.chunks.flatMap((chunk) => chunk.lines).map(({ index: _i, ...line }) => line), lesson.dialog.lines);
      assert.deepEqual(run.stages.slice(1).map((s, i) => sessionCompleted(run.stages[i], s)).filter(Boolean), [1, 2]);
      assert.deepEqual(run.stages.filter((s) => s.kind === 'wortfeld').flatMap((s) => s.words).map((w) => w.de).sort(), lesson.wortfeld.filter((w) => !w.meta).map((w) => w.de).sort());
      for (const chunk of scene.chunks) {
        assert.equal(chunk.say.de, lesson.dialog.lines[chunk.say.line].de);
        for (const line of chunk.lines) {
          assert.ok(chunk.meaning.explanationDe.includes(line.de));
          assert.ok(chunk.meaning.explanationEn.includes(line.en));
        }
        for (const option of chunk.meaning.options) assert.equal(checkAnswer(option, chunk.meaning.accepted, checkOptionsFor(chunk.meaning)).result, option === chunk.meaning.answer ? RESULT.CORRECT : RESULT.WRONG);
      }
    }
  }
});

test('say cues come from the immediately preceding original dialogue line across chunk boundaries', async () => {
  for (const lesson of c.lektionen) {
    const run = build(lesson), scene = { chunks: run.stages.filter((s) => s.kind === 'scene').flatMap((s) => s.chunks) }, fluency = run.stages.find((s) => s.kind === 'fluency');
    for (const [i, chunk] of scene.chunks.entries()) {
      const expected = chunk.say.line ? { ...lesson.dialog.lines[chunk.say.line - 1], index: chunk.say.line - 1 } : undefined;
      assert.deepEqual(chunk.cue, expected);
      assert.deepEqual(fluency.lines[i].cue, expected);
    }
  }
  const { default: SceneStage } = await loadJsxModule('src/components/lesson/SceneStage.jsx', {
    '../../lib/lesson/sceneSupport.js': await import('../src/lib/lesson/sceneSupport.js'),
    './SetReference.jsx': { default: 'SetReference' },
    react: { useState: (v) => [v, () => {}], useMemo: (fn) => fn(), useEffect() {} },
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    '../illustrations/SituationScene.jsx': { default: 'SituationScene' }, './DialogStage.jsx': { GlossLine: 'GlossLine' },
    './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' }, './LangToggle.jsx': { default: 'LangToggle' },
    './CheckedChoice.jsx': { default: 'CheckedChoice' }, '../../lib/lesson/buildGuided.js': { SCENE_PHASES: ['hear', 'meaning', 'say'] },
    '../../lib/lesson/scene.js': { sayText }, '../../lib/lesson/gloss.js': { parseLektionId: () => null },
    '../../lib/lesson/strings.js': { useLessonLang: () => ['en'], t: (key) => key },
  });
  const elements = (tree, type) => Array.isArray(tree) ? tree.flatMap((t) => elements(t, type)) : tree && typeof tree === 'object' ? [...(tree.type === type ? [tree] : []), ...elements(tree.props.children, type)] : [];
  const lesson = c.lektionen[9], stage = build(lesson).stages.find((s) => s.kind === 'scene');
  assert.equal(stage.chunks.length, 5);
  for (const [i, chunk] of stage.chunks.entries()) {
    assert.equal(chunk.say.line, chunk.from, 'all L10 say lines open their chunks');
    const tree = SceneStage({ stage, lektionId: lesson.id, itemIndex: i * 3 + 2, results: {} });
    const cue = elements(tree, 'GlossLine');
    assert.equal(cue.length, i === 0 ? 0 : 1);
    if (i) assert.equal(cue[0].props.line, lesson.dialog.lines[chunk.say.line - 1].de);
    assert.equal(elements(tree, 'ReadAloudLine').length, 1, 'no cue still presents the task');
  }
});

test('legacy saved runs restart cleanly for every newly guided lesson, while guided saves and A1.2 still resume', () => {
  const previousWindow = globalThis.window;
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) } };
  const now = Date.now();
  try {
    for (const lesson of c.lektionen.slice(1)) {
      const legacy = packRun({ stageKey: 'practice', stageIndex: 5, itemIndex: 4, attempt: 3, attempts: [{ itemId: 'old', correct: true }], misses: ['old'] }, now);
      for (const owner of [null, 'owner']) {
        data.clear();
        for (const tagged of [true, false]) {
          const saved = { ...legacy }; if (!tagged) delete saved.flow;
          saveRun(c.level, lesson.id, saved, owner);
          const resumed = readRun(c.level, lesson.id, now, owner, lesson.flow);
          assert.equal(resumed, null, `${lesson.id} ${owner} ${tagged}`);
          assert.equal(resumeStageIndex(build(lesson).stages, resumed), 0);
        }
        const guided = packRun({ flow: lesson.flow, stageKey: 'sound', stageIndex: 3, itemIndex: 1 }, now);
        saveRun(c.level, lesson.id, guided, owner);
        assert.deepEqual(readRun(c.level, lesson.id, now, owner, lesson.flow), guided);
      }
    }
    const lesson = c12.lektionen[0], legacy = packRun({ stageKey: 'practice', itemIndex: 4 }, now);
    saveRun(c12.level, lesson.id, legacy);
    assert.deepEqual(readRun(c12.level, lesson.id, now, null, lesson.flow || 'legacy'), legacy);
    const player = read('src/pages/lesson/LessonPlayerPage.jsx');
    assert.match(player, /readRun\(curriculum.level, lektion.id, Date.now\(\), owner, lektion.flow \|\| 'legacy'\)/);
    assert.match(player, /useState\(\(\) => \(resumed \? resumed.attempt : 1\)\)/);
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; }
});

test('estimates and content-free funnel steps follow every lesson’s actual guided content', () => {
  for (const lesson of c.lektionen) {
    const run = build(lesson), steps = stageSteps(run.stages);
    const chunks = lesson.guided.chunks.length;
    assert.equal(steps.filter((s) => s.startsWith('scene:')).length, chunks * 3);
    assert.ok(steps.includes(`scene:${chunks}:say`));
    for (const key of ['sound', 'read', 'fluency', 'requeue', 'recap']) assert.ok(steps.includes(key));
    assert.equal(new Set(steps).size, steps.length);
    assert.ok(steps.every((s) => /^[a-z0-9:-]+$/.test(s)));
    const total = lektionMinutesEstimate(lesson), parts = lektionPartEstimate(lesson);
    const legacy = lektionMinutesEstimate({ ...lesson, flow: undefined });
    assert.ok(total.lo >= legacy.lo && total.hi > legacy.hi);
    assert.equal(parts.parts, 3); assert.ok(parts.lo * 3 <= total.lo && parts.hi * 3 >= total.hi);
    const more = lektionMinutesEstimate({ ...lesson, guided: { ...lesson.guided, chunks: [...lesson.guided.chunks, ...lesson.guided.chunks] } });
    assert.ok(more.lo > total.lo && more.hi > total.hi);
    assert.equal(lesson.minutes, 15);
  }
});

test('L2–12 scenes use complete inline illustrations and L12’s cross-level story preview is grounded in live A1.2', async () => {
  const { default: Scene } = await loadJsxModule('src/components/illustrations/SituationScene.jsx', {
    '../../data/design-tokens.js': tokens, '../../data/curricula/a11.art.js': { A11_ART },
  });
  for (const lesson of c.lektionen.slice(1)) {
    const tree = Scene({ lektionId: lesson.id, className: 'w-full rounded-3xl border border-rule object-cover' });
    assert.equal(tree.type, 'svg'); assert.equal(tree.props.viewBox, '0 0 160 100');
    assert.equal(tree.props.role, 'img'); assert.ok(tree.props['aria-label']);
    assert.equal(A11_ART.situations[lesson.id].src, null);
    assert.equal(A11_ART.situations[lesson.id].srcSmall, null);
  }
  assert.match(c.lektionen.at(-1).nextHook.de, /In A1.2.*Ana.*Rathaus/);
  assert.match(c12.lektionen[0].dialog.setting, /Ana.*Rathaus/);
  assert.match(c12.lektionen[0].dialog.lines[0].de, /Rathaus/);
  assert.match(read('src/data/curricula/index.js'), /['"]a1.2['"]:\s*CURRICULUM_A12/);
});

test('a stress mark never costs a German noun its capital letter, and unmarked words keep their spelling', () => {
  const nouns = nounsOf(c.lektionen);
  const shown = (nr) => buildSoundItems(c.lektionen[nr - 1], nouns);
  assert.deepEqual(shown(10).map((i) => i.text), ['Fährt der Zug?', 'Hast du Zeit?', 'Kommst du mit?']);
  assert.deepEqual(shown(3).map((i) => i.text), ['der Bruder', 'die Brüder', 'die Mütter']);
  assert.equal(shown(8)[2].text, 'Wie viel Uhr ist es?');
  assert.equal(shown(8)[2].answer, 'Uhr');
  assert.ok(shown(8)[2].options.includes('Uhr') && !shown(8)[2].options.includes('uhr'));
  assert.equal(shown(2)[2].text, 'Sie sind');
  assert.equal(shown(7)[0].text, 'ich höre');
  // By class: no word shown to the learner is a course noun written small.
  for (const lesson of c.lektionen) for (const item of shown(lesson.nr)) {
    for (const text of [item.text, ...(item.soundKind === 'sentence-stress' ? item.options : [])]) {
      for (const token of text.split(/[^\p{L}]+/u).filter(Boolean)) {
        const noun = token.charAt(0).toLocaleUpperCase('de') + token.slice(1);
        assert.ok(token === noun || !nouns.has(noun), `L${lesson.nr} „${text}“: ${token} is a noun`);
      }
    }
  }
});
