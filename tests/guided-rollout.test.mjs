import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
        assert.equal(item.answer, item.marked, 'the right option is the model on screen');
        assert.ok(item.options.every((o) => /\p{Lu}/u.test(o) && o.includes('-')));
      } else if (shape.kind === 'sentence-stress') {
        assert.equal(item.answer, item.marked);
        assert.match(item.modelEn, /computer voice may stress it differently/);
      } else if (shape.kind === 'melody') {
        assert.equal(item.answer, shape.direction);
        assert.match(item.modelEn, /computer voice may not follow/);
      } else {
        assert.equal(item.answer, item.text);
        const own = (option) => lesson.phonetik.items.some((original) => original.toLocaleLowerCase('de').replace(/-/g, '').split(' – ').includes(option.toLocaleLowerCase('de')));
        // The Lektion's own sound strings; one Wortfeld word may join them when the answer would stand out by its spelling.
        const joined = item.options.filter((option) => !own(option));
        assert.ok(joined.length <= 1 && joined.every((option) => lesson.wortfeld.some((w) => w.word === option)), `L${lesson.nr} ${item.options}`);
      }
    }
  }
  assert.equal(count, 36);
  assert.match(read('src/lib/lesson/buildGuided.js'), /buildSoundItems\(lektion, nounsOf\(/);
  assert.match(read('scripts/lib/guided-content.mjs'), /classifySound\(marked\)/);
});

test('no sound option is a misspelled German word, and spelling never gives the answer away (browser walk 2026-11-25: „EUro / TEUer / neun")', () => {
  const nouns = nounsOf(c.lektionen);
  const big = (s) => /^\p{Lu}/u.test(s);
  // A course noun or name has its capital letter, every other word is written small; „Sie" is the polite form.
  const spelledRight = (word) => word === 'Sie' || word === (nouns.has(word[0].toLocaleUpperCase('de') + word.slice(1)) ? word[0].toLocaleUpperCase('de') + word.slice(1) : word.toLocaleLowerCase('de'));
  let listening = 0;
  for (const lesson of c.lektionen) for (const item of buildSoundItems(lesson, nouns)) {
    const where = `L${lesson.nr} ${item.marked}: ${item.options.join(' / ')}`;
    if (item.soundKind === 'melody') continue; // two arrows
    if (['word-stress', 'prefixed-stress', 'sentence-stress'].includes(item.soundKind)) {
      // Each option is the line in its real spelling with exactly one syllable (or word) in capitals, a different one each time.
      const sentence = item.soundKind === 'sentence-stress';
      const pieces = (s) => (sentence ? s.replace('?', '').split(' ') : s.split(' ').at(-1).split('-'));
      const real = sentence ? pieces(item.text) : (() => {
        const word = item.text.split(' ').at(-1);
        let at = 0;
        return pieces(item.marked).map((s) => word.slice(at, (at += s.length)));
      })();
      item.options.forEach((option, position) => {
        assert.deepEqual(pieces(option), real.map((s, i) => (i === position ? s.toLocaleUpperCase('de') : s)), where);
        assert.equal(option.replace(/-/g, '').toLocaleLowerCase('de'), item.text.toLocaleLowerCase('de'), where);
      });
      assert.equal(item.options.length, real.length, where);
    } else {
      listening += 1;
      for (const option of item.options) {
        for (const word of option.split(' ')) {
          assert.doesNotMatch(word.slice(1), /\p{Lu}/u, `${where}: capitals inside a word`);
          assert.ok(spelledRight(word), `${where}: „${word}"`);
        }
      }
      // The answer is never the only option written small, nor the only one with a capital.
      assert.ok(item.options.filter((o) => big(o) === big(item.answer)).length > 1, where);
    }
  }
  assert.ok(listening >= 12, 'the listening items are really checked');
});

test('the order of the options never points at the answer: match and listening sounds (browser walk 2026-11-25: 48 of 48)', async () => {
  const { optionOrder } = await import('../src/lib/lesson/optionOrder.js');
  // Deterministic: the same question shows the same order on a resume and on a retake; another question its own.
  assert.deepEqual(optionOrder(['a', 'b', 'c', 'd'], 'q1'), optionOrder(['a', 'b', 'c', 'd'], 'q1'));
  assert.deepEqual([...optionOrder(['a', 'b', 'c', 'd'], 'q1')].sort(), ['a', 'b', 'c', 'd'], 'the same options');
  const options = ['a', 'b', 'c', 'd'];
  assert.ok(new Set(Array.from({ length: 40 }, (_, i) => optionOrder(options, `q${i}`).join(''))).size > 10);
  const places = [0, 0, 0, 0];
  let own = 0; let total = 0;
  for (const lesson of c.lektionen) for (const attempt of [1, 2, 3]) {
    const match = buildLesson({ curriculum: c, lektion: lesson, pool, attempt }).stages.find((s) => s.kind === 'derived').items.find((i) => i.type === 'match');
    const at = match.pairs.map((pair, i) => optionOrder(match.pairs.map((p) => p.en), `${match.id}:${i}`).indexOf(pair.en));
    assert.ok(at.some((place, i) => place !== i), `L${lesson.nr}: the answer is always at the question's own number`);
    assert.ok(new Set(at).size > 1, `L${lesson.nr}: the answer is always at the same place`);
    at.forEach((place, i) => { places[place] += 1; own += Number(place === i); total += 1; });
  }
  assert.equal(total, 144);
  assert.ok(own < total * 0.4, `${own} of ${total} answers stand at the question's own number`);
  for (const n of places) assert.ok(n > total * 0.15, `every place holds the answer sometimes: ${places}`);
  assert.match(read('src/components/lesson/GuidedMatchItem.jsx'), /options: optionOrder\(item\.pairs\.map\(\(p\) => p\.en\), `\$\{item\.id\}:\$\{pairIndex\}`\)/);
  // The listening sounds listed the Lektion's lines in order too: the answer of item 3 was the third line.
  let ownLine = 0; let lines = 0;
  for (const lesson of c.lektionen) buildSoundItems(lesson, nounsOf(c.lektionen)).forEach((item, i) => {
    if (!['pair', 'phrase', 'sound-word'].includes(item.soundKind)) return;
    lines += 1; ownLine += Number(item.options.indexOf(item.answer) === i);
  });
  assert.ok(ownLine < lines * 0.6, `${ownLine} of ${lines}`);
});

test('every sound item shows its model, the marked line, and no text it shows ends in two end marks', () => {
  // 2026-11-23 screen walk: L7 item 3, L9 item 3 and all of L12 said „read the model“ with no model
  // on screen, and L8/L10 read „Wie SPÄT ist es?.“ and „Fährt der ZUG?↗.“.
  const nouns = nounsOf(c.lektionen);
  for (const lesson of c.lektionen) for (const item of buildSoundItems(lesson, nouns)) {
    for (const text of [item.modelDe, item.modelEn]) assert.ok(text.includes(item.marked), `L${lesson.nr} ${item.id}: no model in „${text}“`);
    for (const text of [item.modelDe, item.modelEn, item.promptDe, item.promptEn, item.explanationDe, item.explanationEn]) {
      assert.doesNotMatch(text, /[.!?][↗↘]?\s*[.!?]/u, `L${lesson.nr} ${item.id}: ${text}`);
    }
  }
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
  const unchanged = (run) => Object.fromEntries(run.stages.filter((s) => !['dialog', 'scene', 'wortfeld', 'phonetik', 'sound', 'read', 'fluency', 'check'].includes(s.kind)).map(({ part: _part, nextHook: _hook, ...s }) => [s.key, s]));
  for (const lesson of c.lektionen) {
    assert.equal(lesson.flow, 'guided');
    if (lesson.nr > 1) {
      const draft = draftLesson(lesson);
      // The final check arrives Lektion by Lektion with the rollout (docs/course-factory/a11-lektion-rollout/);
      // final-check.test.mjs holds it. Everything else is the draft.
      const { check: _check, ...guided } = lesson.guided;
      assert.deepEqual(guided, draft.guided);
      assert.deepEqual(lesson.nextHook, draft.nextHook);
    }
    for (const attempt of [1, 2, 3]) {
      const run = build(lesson, attempt), legacy = build({ ...lesson, flow: undefined }, attempt);
      assert.deepEqual(unchanged(run), unchanged(legacy), `${lesson.id} draw ${attempt}`);
      assert.equal(run.flow, 'guided');
      assert.deepEqual(run.stages.map((s) => s.key), ['pretest', 'scene', 'wortfeld', 'sound', 'read', 'notice', 'practice', 'derived', 'dictation', 'fluency', 'speaking', 'writing', 'requeue', ...(lesson.guided.check ? ['check'] : []), 'recap']);
      const scene = run.stages.find((s) => s.kind === 'scene');
      assert.deepEqual(scene.chunks.flatMap((chunk) => chunk.lines).map(({ index: _i, ...line }) => line), lesson.dialog.lines);
      assert.deepEqual(run.stages.slice(1).map((s, i) => sessionCompleted(run.stages[i], s)).filter(Boolean), [1, 2]);
      assert.deepEqual(run.stages.filter((s) => ['wortfeld', 'read'].includes(s.kind)).flatMap((s) => s.words).map((w) => w.de).sort(), lesson.wortfeld.map((w) => w.de).sort());
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

// Browser walk L, 30 (2026-11-25): with "Deutsch" chosen every comprehension question still had English options.
test('every comprehension question has German options beside the English ones, in the same order', () => {
  let n = 0;
  for (const lesson of c.lektionen) {
    for (const q of [...lesson.guided.chunks.map((x) => x.meaning), ...lesson.guided.read.questions]) {
      n += 1;
      assert.equal(q.optionsDe?.length, q.options.length, `${lesson.id}: ${q.promptDe}`);
      assert.equal(new Set(q.optionsDe).size, q.optionsDe.length, `${lesson.id}: ${q.promptDe}`);
      // A number or a price is the same in both: the order can be checked.
      q.options.forEach((en, i) => { for (const d of en.match(/\d+/g) || []) assert.ok(q.optionsDe[i].includes(d), `${lesson.id}: ${en} / ${q.optionsDe[i]}`); });
      assert.doesNotMatch(q.optionsDe.join(' '), /\b(?:the|and|she|he|is|are|her|his|they|with)\b/i, `${lesson.id}: ${q.promptDe}`);
    }
  }
  assert.equal(n, 82);
  const choice = read('src/components/lesson/CheckedChoice.jsx');
  assert.match(choice, /lang === 'de' && item\.optionsDe\?\.length === item\.options\.length \? item\.optionsDe : item\.options/);
  assert.match(choice, /\{label\(option\)\}/);
  assert.equal((choice.match(/label\(item\.answer\)/g) || []).length, 2);
});

// Independent score of 2026-11-25: the checks dictated numbers and asked for months that no screen had shown.
test('a closed series is shown and can be heard before a check asks for it: the numbers of Lektion 2 and 4, the months of Lektion 12', async () => {
  const { seriesText } = await import('../src/lib/lesson/guidedRead.js');
  const { checkTurns } = await import('../src/lib/lesson/finalCheck.js');
  const series = (nr) => new Map((c.lektionen.find((l) => l.nr === nr).guided.read.series?.items || []).map((x) => [x.label, x.de]));
  assert.deepEqual([...series(2).keys()], ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  assert.equal(series(12).size, 12);
  const numbers = new Map([...series(2), ...series(4)]);
  for (const nr of [2, 4]) {
    const lesson = c.lektionen.find((l) => l.nr === nr);
    for (let retake = 0; retake < 4; retake += 1) {
      for (const turn of checkTurns(lesson.guided.check, retake).filter((x) => x.listen)) {
        // Up to twenty each number is shown; above it the tens are shown with the rule of the compounds („45 ist fünf-und-vierzig“),
        // and a compound the list prints is never dictated: that would measure the list, not the rule.
        for (const d of turn.listen.match(/\d+/g) || []) {
          const n = Number(d);
          if (n <= 20 || n % 10 === 0) assert.ok(numbers.has(d), `Lektion ${nr}: „${turn.listen}“ asks for ${d}, which no list shows`);
          else {
            assert.ok(numbers.has(String(n - (n % 10))) && [...numbers.keys()].some((k) => Number(k) > 20 && Number(k) % 10), `Lektion ${nr}: ${d} has no tens and no rule shown`);
            assert.ok(!numbers.has(d), `Lektion ${nr}: ${d} is printed in the list, so the check measures the list`);
          }
        }
        if (nr === 2) for (const w of turn.listen.split(/[\s,]+/).filter(Boolean)) assert.ok([...numbers.values()].includes(w), `Lektion 2: „${w}“`);
      }
    }
  }
  for (const nr of [2, 4, 12]) {
    const { series: s } = c.lektionen.find((l) => l.nr === nr).guided.read;
    assert.equal(seriesText(s), `${s.items.map((x) => x.de).join(', ')}.`);
  }
  const stage = readFileSync(new URL('../src/components/lesson/ReadStage.jsx', import.meta.url), 'utf8');
  assert.match(stage, /stage\.series && <Series/);
  assert.match(stage, /text=\{seriesText\(series\)\}/);
});

test('a rewritten scene line never leaves its meaning question behind: each part is pinned to its lines (2026-11-23)', () => {
  // Lektion 11's keys described lines that no longer existed (the screen walk, F1 and F2). `meaningLines` is a short hash
  // of the part's lines; a changed line fails here until its meaning question has been read again and the pin renewed.
  const pin = (lines) => createHash('sha1').update(lines.map((l) => `${l.speaker}: ${l.de}`).join('\n')).digest('hex').slice(0, 8);
  for (const lesson of c.lektionen) {
    lesson.guided.chunks.forEach((chunk, i) => {
      const now = pin(lesson.dialog.lines.slice(chunk.from, chunk.to));
      assert.equal(chunk.meaningLines, now, `Lektion ${lesson.nr} part ${i + 1}: its lines changed; re-read „${chunk.meaning.promptDe}“ and its answer, then set meaningLines: '${now}'`);
      assert.ok(chunk.meaning.options.includes(chunk.meaning.answer), `Lektion ${lesson.nr} part ${i + 1}`);
    });
  }
});

test('say cues come from the immediately preceding original dialogue line across chunk boundaries', async () => {
  for (const lesson of c.lektionen) {
    const run = build(lesson), scene = run.stages.find((s) => s.kind === 'scene'), fluency = run.stages.find((s) => s.kind === 'fluency');
    for (const [i, chunk] of scene.chunks.entries()) {
      const expected = chunk.say.line ? { ...lesson.dialog.lines[chunk.say.line - 1], index: chunk.say.line - 1 } : undefined;
      assert.deepEqual(chunk.cue, expected);
      // Said from memory, every line has a cue: an opening line has the situation (the screen walk, Lektionen 4, 6, 10).
      assert.deepEqual(fluency.lines[i].cue, expected || { de: lesson.dialog.setting, en: lesson.dialog.settingEn });
      assert.ok(fluency.lines[i].cue.de && fluency.lines[i].cue.en, `Lektion ${lesson.nr} line ${chunk.say.line + 1}: a fluency line without a cue`);
    }
  }
  const { default: SceneStage } = await loadJsxModule('src/components/lesson/SceneStage.jsx', {
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

test('L2–12 scenes use complete illustrations, drawn or inline, and L12’s cross-level story preview is grounded in live A1.2', async () => {
  const { default: Scene } = await loadJsxModule('src/components/illustrations/SituationScene.jsx', {
    '../../data/design-tokens.js': tokens, '../../data/curricula/a11.art.js': { A11_ART },
  });
  for (const lesson of c.lektionen.slice(1)) {
    const tree = Scene({ lektionId: lesson.id, className: 'w-full rounded-3xl border border-rule object-cover' });
    const art = A11_ART.situations[lesson.id];
    // The rollout (2026-11-19) draws a Lektion's scene batch by batch; until then it is the inline SVG.
    if (art.src) {
      assert.equal(tree.type, 'img', lesson.id);
      assert.equal(tree.props.alt, art.alt);
      continue;
    }
    assert.equal(tree.type, 'svg'); assert.equal(tree.props.viewBox, '0 0 160 100');
    assert.equal(tree.props.role, 'img'); assert.ok(tree.props['aria-label']);
    assert.equal(art.srcSmall, null);
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
  assert.equal(shown(8)[2].answer, 'Wie viel UHR ist es?');
  // Verbs, adjectives and names keep their real spelling too (2026-11-25): no „Möchte", „Hören", „Teuer", „Aufstehen", „ana".
  assert.deepEqual([4, 9, 11].flatMap((nr) => shown(nr).map((i) => i.text)), ['Euro', 'teuer', 'neun', 'möchte', 'hören', 'schön', 'aufstehen', 'einkaufen', 'anrufen']);
  assert.deepEqual(shown(1).map((i) => i.text), ['Hallo', 'Danke', 'Ana']);
  assert.equal(shown(2)[2].text, 'Sie sind');
  assert.equal(shown(7)[0].text, 'ich höre');
  // By class: no word shown to the learner is a course noun written small.
  for (const lesson of c.lektionen) for (const item of shown(lesson.nr)) {
    for (const text of [item.text, ...(['pair', 'phrase', 'sound-word'].includes(item.soundKind) ? item.options : [])]) {
      for (const token of text.split(/[^\p{L}]+/u).filter(Boolean)) {
        const noun = token.charAt(0).toLocaleUpperCase('de') + token.slice(1);
        assert.ok(token === noun || !nouns.has(noun), `L${lesson.nr} „${text}“: ${token} is a noun`);
      }
    }
  }
});
