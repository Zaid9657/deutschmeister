import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadJsxModule } from './helpers/renderJsx.mjs';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { packRun, unpackRun } from '../src/lib/lesson/runState.js';
import * as support from '../src/lib/lesson/sceneSupport.js';
import { distractorCue, distractorFindings } from '../scripts/lib/distractor-quality.mjs';
import { sanitizeProps, EVENTS } from '../src/data/events.js';
import { practiceScore } from '../src/lib/lesson/mastery.js';
import { SCENE_PHASES } from '../src/lib/lesson/buildGuided.js';
import { sayText } from '../src/lib/lesson/scene.js';
const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url)));
const build = (l, attempt = 1) => buildLesson({ curriculum: c, lektion: l, pool, attempt });
export const elements = (tree, type) => Array.isArray(tree) ? tree.flatMap((v) => elements(v, type)) : !tree || typeof tree !== 'object' ? [] : [...(tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)];
function hooks() {
  const slots = []; let cursor = 0;
  return { react: { useMemo: (fn) => fn(), useEffect() {}, useRef: (v) => ({ current: v }),
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; } },
  render(Component, props) { cursor = 0; return Component(props); } };
}

async function mountScene(l, lang = 'en') {
  const state = hooks();
  const { default: Component } = await loadJsxModule('src/components/lesson/SceneStage.jsx', {
    react: state.react, '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    '../illustrations/SituationScene.jsx': { default: 'SituationScene' }, './DialogStage.jsx': { GlossLine: 'GlossLine' },
    './SetReference.jsx': { default: 'SetReference' }, './PlayButton.jsx': { default: 'PlayButton' }, './ReadAloudLine.jsx': { default: 'ReadAloudLine' },
    './LangToggle.jsx': { default: 'LangToggle' }, './CheckedChoice.jsx': { default: 'CheckedChoice' },
    '../../lib/lesson/gloss.js': { parseLektionId: () => null }, '../../lib/lesson/sceneSupport.js': support,
    '../../lib/lesson/buildGuided.js': { SCENE_PHASES }, '../../lib/lesson/scene.js': { sayText },
    '../../lib/lesson/strings.js': { useLessonLang: () => [lang], t: (s) => s },
  });
  const outcomes = [];
  const props = { stage: build(l).stages.find((s) => s.kind === 'scene'), lektionId: l.id, itemIndex: 0, results: {}, translations: {}, onTranslationOpen: (index) => { props.translations[index] = true; }, onResult: (_, outcome) => outcomes.push(outcome), onDone() {}, onItemChange() {} };
  return { props, outcomes, render: () => state.render(Component, props) };
}

test('scene English is hidden by default in both modes, revealed per line, and captured before the first answer', async () => {
  for (const lang of ['en', 'de']) {
    const h = await mountScene(c.lektionen[1], lang);
    const chunk = h.props.stage.chunks[0];
    assert.equal(elements(h.render(), 'p').filter((p) => p.props.lang === 'en').length, 0);
    assert.equal(elements(h.render(), 'GlossLine').length, chunk.lines.length);
    const toggles = elements(h.render(), 'button').filter((b) => b.props['aria-controls']);
    assert.equal(toggles.length, chunk.lines.length);
    toggles[0].props.onClick();
    assert.equal(elements(h.render(), 'p').filter((p) => p.props.lang === 'en').length, 1);
    assert.equal(elements(h.render(), 'button')[0].props['aria-expanded'], true);
    elements(h.render(), 'button')[0].props.onClick(); // closing never erases prior help
    h.props.itemIndex = 1;
    elements(h.render(), 'CheckedChoice')[0].props.onResult(chunk.meaning, { correct: true });
    assert.equal(h.outcomes[0].translationOpened, true); assert.equal(h.outcomes[0].translationShown, true);
  }
});

test('first exchange keeps default support; subsequent chunks do not inherit it', async () => {
  const h = await mountScene(c.lektionen[0]);
  const chunk = h.props.stage.chunks[0];
  assert.equal(elements(h.render(), 'p').filter((p) => p.props.lang === 'en').length, chunk.lines.length);
  h.props.itemIndex = 1;
  elements(h.render(), 'CheckedChoice')[0].props.onResult(chunk.meaning, { correct: true });
  assert.equal(h.outcomes[0].translationOpened, false); assert.equal(h.outcomes[0].translationShown, true);
  for (const l of c.lektionen) for (const s of build(l).stages.filter((s) => s.kind === 'scene')) for (const ch of s.chunks) assert.equal(ch.translationDefault, l.nr === 1 && ch.chunkIndex === 0);
  assert.deepEqual(support.sceneSupport({ lines: [{ index: 8 }], translationDefault: false }, { 0: true }), { translationOpened: false, translationShown: false });
});

test('translation evidence is content-free, resumes, reaches attempt labels and recap, and never changes gold', () => {
  const snapshot = packRun({ flow: 'guided', stageKey: 'scene', sceneTranslations: { 0: true, 2: 'secret', name: true, 4: false } });
  assert.deepEqual(snapshot.sceneTranslations, { 0: true });
  assert.deepEqual(unpackRun(snapshot).sceneTranslations, { 0: true });
  const outcomes = [{ stage: 'scene', correct: true, translationOpened: false, translationShown: true }, { stage: 'scene', correct: false, translationOpened: false, translationShown: false }];
  assert.deepEqual(support.sceneSupportSummary(outcomes), { unaided: 1, supported: 1 });
  assert.equal(support.sceneAttemptTag(outcomes[0]), 'scene:translation:default');
  assert.equal(support.sceneAttemptTag(outcomes[1]), 'scene:unaided:default:wrong');
  assert.equal(practiceScore(outcomes).total, 0);
  assert.ok(EVENTS.lesson_scene_answered);
  assert.deepEqual(sanitizeProps({ translation_opened: true, translation_shown: false, english: 'secret' }), { translation_opened: true, translation_shown: false });
  const source = readFileSync(new URL('../src/pages/lesson/LessonPlayerPage.jsx', import.meta.url), 'utf8');
  assert.match(source, /flow: lektion.flow \|\| 'legacy', sceneTranslations/);
  assert.match(source, /sceneSupport=\{sceneSupportSummary\(attempts\)\}/);
});

test('RULE 38 flags large unique answer length and unequal clause detail, not balanced choices or longest ties', () => {
  const q = (answer, options) => ({ answer, options });
  assert.equal(distractorCue(q('She buys bread and milk for the family today.', ['She buys bread and milk for the family today.', 'She leaves.', 'He arrives.'])), 'longest-by-margin');
  assert.equal(distractorCue(q('He arrives early today, she pays the bill, then they leave together.', ['He arrives early today, she pays the bill, then they leave together.', 'She leaves the shop after waiting for long.', 'He waits by the shop door throughout this morning.'])), 'unequal-detail');
  assert.equal(distractorCue(q('She buys bread.', ['She buys bread.', 'She buys milk.', 'He buys cheese.'])), null);
  assert.equal(distractorCue(q('She buys bread.', ['She buys bread.', 'She buys milk.', 'He goes.'])), null);
  assert.ok(distractorFindings(c).length);
});

const { wordCardFindings, wordCardStageFindings } = await import('../scripts/lib/word-card-quality.mjs');
const { cardStageEstimate, CARD_MAX_INPUT_SECONDS } = await import('../src/lib/lesson/wordCards.js');
const { checkAnswer, checkOptionsFor } = await import('../src/lib/lesson/check.js');
const { resumeStageIndex, resumeItemIndex } = await import('../src/lib/lesson/runState.js');

test('all three guided draws deliver every non-meta word card, with checks between small groups before dependent practice', () => {
  assert.deepEqual(wordCardFindings(c, pool), []);
  for (const l of c.lektionen) for (const attempt of [1, 2, 3]) {
    const { stages } = build(l, attempt);
    const cardStages = stages.filter((s) => s.kind === 'wortfeld');
    assert.equal(cardStages.length, 2);
    const taught = new Set();
    for (const s of cardStages) {
      const time = cardStageEstimate(s);
      assert.ok(time.maxInputHi <= CARD_MAX_INPUT_SECONDS, `${l.nr}/${s.key}`);
      for (const [i, step] of s.steps.entries()) {
        if (step.kind === 'cards') {
          assert.ok(step.words.length <= 6);
          assert.equal(s.steps[i + 1].kind, 'check');
          for (const w of step.words) { assert.ok(!w.meta); taught.add(w.de); }
        } else {
          assert.ok(taught.has(step.item.cardTarget));
          for (const option of step.item.options) assert.equal(checkAnswer(option, step.item.accepted, checkOptionsFor(step.item)).result, option === step.item.answer ? 'correct' : 'wrong');
          assert.equal(practiceScore([{ itemId: step.item.id, stage: 'word-retrieval', correct: true }]).total, 0);
        }
      }
    }
    assert.deepEqual([...taught].sort(), l.wortfeld.filter((w) => !w.meta).map((w) => w.de).sort());
    for (const heading of l.wortfeld.filter((w) => w.meta)) assert.ok(stages.some((s) => s.kind === 'taught-set' && s.set.id === heading.set));
    assert.ok(stages.findIndex((s) => s.key === 'wortfeld-read') < stages.findIndex((s) => s.kind === 'read'));
    assert.equal(stages.at(-2).kind, 'requeue'); assert.equal(stages.at(-1).kind, 'recap');
  }
});

test('RULE 39 rejects merging groups, dropping checks or cards, meta cards and dependent stages before cards', () => {
  const l = c.lektionen[6];
  for (const mutate of [
    (stages) => {
      const s = stages.find((s) => s.kind === 'wortfeld');
      const second = s.steps.findIndex((step, i) => i > 0 && step.kind === 'cards');
      s.steps[0].words.push(...s.steps[second].words); s.steps.splice(1, second);
      assert.ok(cardStageEstimate(s).maxInputHi > CARD_MAX_INPUT_SECONDS);
    },
    (stages) => { const s = stages.find((s) => s.kind === 'wortfeld'); s.steps.splice(1, 2); },
    (stages) => { stages.find((s) => s.kind === 'wortfeld').steps[0].words.pop(); },
    (stages) => { stages.find((s) => s.kind === 'wortfeld').steps[0].words[0].meta = true; },
    (stages) => { const at = stages.findIndex((s) => s.kind === 'practice'); const [s] = stages.splice(at, 1); stages.unshift(s); },
  ]) {
    const stages = structuredClone(build(l).stages); mutate(stages);
    assert.ok(wordCardStageFindings(l, stages).length, String(mutate));
  }
});

test('the card-group wrapper renders ordinary cards and both checked components, and resumes at every internal step', async () => {
  const state = hooks();
  const { default: Component } = await loadJsxModule('src/components/lesson/WordRetrievalStage.jsx', {
    './WortfeldStage.jsx': { default: 'WortfeldStage' }, './StageShell.jsx': { default: 'StageShell' },
    './CheckedChoice.jsx': { default: 'CheckedChoice' }, './ListenSelectItem.jsx': { default: 'ListenSelectItem' },
    '../../lib/lesson/strings.js': { useLessonLang: () => ['en'], t: (s) => s },
  });
  for (const l of c.lektionen) {
    const { stages } = build(l);
    for (const stage of stages.filter((s) => s.kind === 'wortfeld')) {
      const seen = [];
      const props = { stage, itemIndex: 0, lektionId: l.id, onResult() {}, onItemChange: (i) => { props.itemIndex = i; }, onDone() {} };
      for (let i = 0; i < stage.steps.length; i++) {
        props.itemIndex = i;
        const snapshot = unpackRun(packRun({ flow: 'guided', stageKey: stage.key, itemIndex: i }));
        assert.equal(resumeStageIndex(stages, snapshot), stages.indexOf(stage)); assert.equal(resumeItemIndex(stages, snapshot), i);
        const tree = state.render(Component, props);
        const step = stage.steps[i];
        if (step.kind === 'cards') {
          const cards = elements(tree, 'WortfeldStage')[0];
          assert.deepEqual(Array.from(cards.props.stage.words), step.words); seen.push(...cards.props.stage.words);
          cards.props.onDone(); assert.equal(props.itemIndex, i + 1);
        } else {
          const choice = elements(tree, step.item.type === 'listen_select' ? 'ListenSelectItem' : 'CheckedChoice')[0];
          assert.equal(choice.props.item, step.item); assert.equal(choice.props.hintFirst, true);
          assert.ok(seen.some((w) => w.de === step.item.cardTarget));
        }
      }
      assert.deepEqual(seen, stage.words);
    }
  }
});

const { hintFor, hintContainsAnswer } = await import('../src/lib/lesson/guidedFeedback.js');
const { guidedHintInventory, hintFindings, neutralHint } = await import('../scripts/lib/hint-quality.mjs');

test('all hint-bearing render paths in all three draws have a useful type/source cue without accepted answers', () => {
  assert.deepEqual(hintFindings(c, pool), []);
  const types = new Set();
  for (const attempt of [1, 2, 3]) for (const row of guidedHintInventory(c, pool, attempt)) {
    types.add(row.type);
    const hint = row.hint || hintFor(row.item);
    for (const lang of ['de', 'en']) { assert.equal(neutralHint(hint[lang]), false); assert.equal(hintContainsAnswer(hint[lang], row.item), false); }
  }
  for (const type of ['fill_blank', 'multiple_choice', 'word_order', 'listen_select', 'dictation', 'error_correction', 'sentence_building']) assert.ok(types.has(type), type);
  for (const item of pool.items) for (const lang of ['de', 'en']) { const hint = hintFor(item)[lang]; assert.equal(neutralHint(hint), false); assert.equal(hintContainsAnswer(hint, item), false); }
  assert.match(hintFor({ type: 'fill_blank', topic: 'nouns-gender', accepted: ['Der'] }).en, /noun card.*gender/);
  assert.match(hintFor({ type: 'fill_blank', topic: 'personal-pronouns', accepted: ['Sie'] }).en, /who is speaking/);
});

test('scene repair points to its source lines and offers their real audio keys again only after a miss', async () => {
  const scene = await mountScene(c.lektionen[3]);
  scene.props.itemIndex = 1;
  const choice = elements(scene.render(), 'CheckedChoice')[0];
  const chunk = scene.props.stage.chunks[0];
  assert.match(hintFor(choice.props.item).en, new RegExp(`lines ${chunk.from + 1}–${chunk.to}`));
  assert.deepEqual(elements(choice.props.hintHelp, 'PlayButton').map((p) => p.props.audioKey), chunk.lines.map((l) => `line-${l.index}`));
  const state = hooks();
  const { default: Component } = await loadJsxModule('src/components/lesson/CheckedChoice.jsx', {
    react: state.react, '../ui/Button.jsx': { default: 'Button' },
    '../../lib/lesson/check.js': await import('../src/lib/lesson/check.js'), '../../lib/lesson/guidedFeedback.js': await import('../src/lib/lesson/guidedFeedback.js'),
    '../../lib/lesson/strings.js': { t: (s) => s },
  });
  const render = () => state.render(Component, choice.props);
  assert.equal(elements(render(), 'PlayButton').length, 0);
  elements(render(), 'input').find((i) => i.props.value !== chunk.meaning.answer).props.onChange();
  elements(render(), 'Button')[0].props.onClick();
  assert.equal(elements(render(), 'PlayButton').length, chunk.lines.length);
  assert.equal(elements(render(), 'p').some((p) => p.props.children.includes(chunk.meaning.explanationEn)), false);
});

test('scene support survives signed-in outbox, guest merge and the existing attempt insert without text', async () => {
  const store = new Map();
  globalThis.window = { localStorage: { getItem: (k) => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) } };
  const { enqueueRun, pendingRuns } = await import('../src/lib/course/syncOutbox.js');
  const { recordLocalLesson, readLocalProgress, planLocalMerge } = await import('../src/lib/course/localProgress.js');
  const { logAttempts } = await import('../src/services/lessonService.js');
  const attempts = [{ itemId: 'scene-a1.1-l02-1', stage: 'scene', correct: true, translationOpened: true, translationShown: true, text: 'SECRET', transcript: 'SECRET' }];
  const data = { level: 'a1.1', lektionId: 'a1.1-l02', status: 'complete', accuracy: 0.5, attempts };
  enqueueRun({ ...data, userId: 'owner', createdAt: new Date().toISOString() });
  assert.equal(pendingRuns('owner')[0].attempts[0].translationOpened, true);
  recordLocalLesson(data);
  const guest = planLocalMerge(readLocalProgress(c.level))[0].batches[0].attempts;
  assert.equal(guest[0].translationShown, true);
  assert.doesNotMatch(JSON.stringify([...store.values()]), /SECRET|transcript/);
  let inserted;
  await logAttempts('owner', data, guest, { from: () => ({ insert: async (rows) => { inserted = rows; return { error: null }; } }) });
  assert.equal(inserted[0].error_tag, 'scene:translation:opened');
  assert.equal(inserted[0].stage, 'scene');
  assert.doesNotMatch(JSON.stringify(inserted), /SECRET|translationOpened|transcript/);
  delete globalThis.window;
});

test('the complete English exchange appears after a scene response even in German interface mode', async () => {
  const item = build(c.lektionen[2]).stages.find((s) => s.kind === 'scene').chunks[0].meaning;
  const state = hooks();
  const { default: Component } = await loadJsxModule('src/components/lesson/CheckedChoice.jsx', {
    react: state.react, '../ui/Button.jsx': { default: 'Button' },
    '../../lib/lesson/check.js': await import('../src/lib/lesson/check.js'), '../../lib/lesson/guidedFeedback.js': await import('../src/lib/lesson/guidedFeedback.js'),
    '../../lib/lesson/strings.js': { t: (s) => s },
  });
  const props = { item, lang: 'de', hintFirst: true, onResult() {}, onNext() {} };
  const render = () => state.render(Component, props);
  assert.equal(elements(render(), 'p').filter((p) => p.props.lang === 'en').length, 0);
  elements(render(), 'input').find((i) => i.props.value === item.answer).props.onChange();
  elements(render(), 'Button')[0].props.onClick();
  assert.equal(elements(render(), 'p').find((p) => p.props.lang === 'en').props.children[0], item.explanationEn);
});
