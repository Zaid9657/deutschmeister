import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import buildLesson, { isTypedItem } from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import { CURRICULUM_A12 as c12 } from '../src/data/curricula/a12.js';
import { A11_META, lektionPartEstimate, lektionMinutesEstimate, STEP_SECONDS } from '../src/data/curricula/a11.meta.js';
import { A11_ART } from '../src/data/curricula/a11.art.js';
import * as checker from '../src/lib/lesson/check.js';
import * as feedback from '../src/lib/lesson/guidedFeedback.js';
import { politeCaseItem } from '../src/data/lessonPools/quality.js';
import { guidedFindings } from '../scripts/lib/guided-content.mjs';
import { guidedReadVocabulary, wortfeldInputCoverage } from '../scripts/validate-curriculum.mjs';
import { nameFromIntroduction, sayText } from '../src/lib/lesson/scene.js';
import { readLexicon } from '../src/lib/lesson/guidedRead.js';
import { glossTokens } from '../src/lib/lesson/gloss.js';
import { packRun } from '../src/lib/lesson/runState.js';
import { practiceScore } from '../src/lib/lesson/mastery.js';
import { loadJsxModule } from './helpers/renderJsx.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const lesson = c.lektionen[0];
const stages = buildLesson({ curriculum: c, lektion: lesson, pool }).stages;
const stage = (kind) => stages.find((s) => s.kind === kind);
const strings = { useLessonLang: () => ['en'], t: (key, _lang, vars) => `${key}${vars ? JSON.stringify(vars) : ''}` };
function elements(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap((x) => elements(x, type));
  if (!tree || typeof tree !== 'object') return [];
  return [...(tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)];
}
const textOf = (tree) => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(textOf).join(' ') : tree && typeof tree === 'object' ? textOf(tree.props?.children) : '';
function hooks() {
  const slots = []; let cursor = 0; let effects = [];
  return {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; },
      useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
      useMemo(fn) { return fn(); },
      useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps?.some((v, n) => v !== slots[i][n])) { slots[i] = deps; effects.push(fn); } },
    },
    render(Component, props) { cursor = 0; const tree = Component(props); const pending = effects; effects = []; pending.forEach((fn) => fn()); return tree; },
  };
}
async function mount(name, props, extra = {}) {
  const state = hooks();
  const stubs = {
    react: state.react, 'lucide-react': new Proxy({}, { get: (_, key) => key }),
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    './SetReference.jsx': { default: 'SetReference' }, './StageShell.jsx': { default: 'StageShell' }, './PlayButton.jsx': { default: 'PlayButton' },
    './ReadAloudLine.jsx': { default: 'ReadAloudLine' }, './CheckedChoice.jsx': { default: 'CheckedChoice' },
    './FeedbackSheet.jsx': { default: 'FeedbackSheet' }, './ExplainAnswer.jsx': { default: 'ExplainAnswer' },
    '../../lib/lesson/derivedChoices.js': await import('../src/lib/lesson/derivedChoices.js'),
    '../../lib/lesson/check.js': checker, '../../lib/lesson/guidedFeedback.js': feedback,
    '../../lib/lesson/strings.js': strings, '../../lib/lesson/scene.js': { sayText },
    '../../lib/lesson/buildLesson.js': { isTypedItem }, '../../data/lessonPools/quality.js': { politeCaseItem },
    ...extra,
  };
  const { default: Component } = await loadJsxModule(`src/components/lesson/${name}.jsx`, stubs);
  const render = () => state.render(Component, props);
  render();
  return { render, props };
}

test('every A1.1 pool hint is bilingual, answer-free, and avoids unreviewed answer-bearing hints', () => {
  for (const item of pool.items) {
    const hint = feedback.hintFor({ ...item, hint: item.answer });
    for (const lang of ['de', 'en']) {
      assert.ok(hint[lang]); assert.equal(feedback.hintContainsAnswer(hint[lang], item), false, item.id);
    }
    assert.doesNotMatch(hint.de, /\b(du|dein|dich|dir)\b/i);
  }
  assert.equal(feedback.hintContainsAnswer('Prüfen Sie bitte.', { accepted: ['Sie'] }), true);
  assert.equal(feedback.hintContainsAnswer('Check “Guten Tag”.', { accepted: ['Guten Tag!'] }), true);
});

test('sound items come from all original stress items; sound and read choices use the real common checker', () => {
  assert.deepEqual(stage('sound').items.map((i) => i.marked), lesson.phonetik.items);
  assert.deepEqual(stage('sound').items.map((i) => i.text), ['Hallo', 'Danke', 'Ana']);
  for (const item of [...stage('sound').items, ...stage('read').items]) {
    for (const option of item.options) assert.equal(checker.checkAnswer(option, item.accepted, checker.checkOptionsFor(item)).result, option === item.answer ? 'correct' : 'wrong');
  }
});

test('read uses RULE 5 lexis, covers all remaining words as actual tappable glosses, and has two questions', () => {
  assert.deepEqual(guidedReadVocabulary(c), []);
  assert.deepEqual(wortfeldInputCoverage(c), []);
  const glossed = stage('read').text.split('\n').flatMap((line) => glossTokens(line, readLexicon(lesson.wortfeld))).filter((s) => s.type === 'gloss').map((s) => s.entry.de);
  for (const word of stage('read').words) assert.ok(glossed.includes(word.de), word.de);
  assert.equal(stage('read').items.length, 2);
  assert.deepEqual(stages.find((s) => s.key === 'wortfeld-read').words, stage('read').words);
  const mutated = structuredClone(c); mutated.lektionen[0].guided.read.text += ' Quantencomputer.';
  assert.ok(guidedReadVocabulary(mutated).some((s) => s.includes('Quantencomputer')));
  for (const mutate of [
    (l) => { delete l.guided.read; }, (l) => { l.guided.read.text = 'Hallo'; },
    (l) => { l.guided.read.titleEn = ''; }, (l) => { l.guided.read.instructionDe = 'Lies'; },
    (l) => { l.guided.read.questions.pop(); }, (l) => { l.guided.read.questions[0].answer = 'wrong'; },
    (l) => { l.guided.read.questions[0].explanationEn = ''; },
    (l) => { l.phonetik.items[0] = 'HAL-LO'; }, (l) => { l.nextHook = { de: 'Morgen' }; },
  ]) { const l = structuredClone(lesson); mutate(l); assert.ok(guidedFindings({ lektionen: [l] }).length, String(mutate)); }
});

test('guided practice and dictation give one hint repair, reveal answer and reason after either second result, and retain the first score', async () => {
  for (const name of ['PracticeItem', 'DictationItem']) for (const repaired of [true, false]) {
    const outcomes = []; let next = 0;
    const props = { hintFirst: true, index: 0, total: 1, item: { id: 'p', type: 'fill_blank', questionDe: 'Ergänzen Sie.', answer: 'Hallo', accepted: ['Hallo'], hint: 'Hallo' }, line: { index: 0, de: 'Hallo' }, onResult: (item, result) => outcomes.push({ itemId: item.id, stage: 'practice', ...result }), onNext: () => next++ };
    const h = await mount(name, props);
    const submit = (value) => { elements(h.render(), 'input')[0].props.onChange({ target: { value } }); elements(h.render(), 'Button').find((b) => textOf(b) === 'action.check').props.onClick(); };
    submit('falsch');
    let sheet = elements(h.render(), 'FeedbackSheet')[0];
    assert.equal(sheet.props.hintOnly, true); assert.equal(feedback.hintContainsAnswer(sheet.props.hint, props.item), false);
    assert.equal(textOf(h.render()).includes('practice.tip'), false);
    sheet.props.onContinue(); submit(repaired ? 'Hallo' : 'anders');
    sheet = elements(h.render(), 'FeedbackSheet')[0];
    assert.equal(sheet.props.hintOnly, false); assert.equal(sheet.props.showAnswer, true); assert.equal(sheet.props.expected, 'Hallo'); assert.ok(sheet.props.explanation);
    sheet.props.onContinue(); assert.equal(next, 1); assert.equal(outcomes.length, 1); assert.equal(outcomes[0].correct, false);
    assert.equal(practiceScore(outcomes).accuracy, 0);
  }
});

test('TYPO and hint share one retry budget, including a TYPO on the second response', async () => {
  for (const first of ['hallo', 'falsch']) {
    const outcomes = []; let next = 0;
    const h = await mount('PracticeItem', { hintFirst: true, index: 0, total: 1, item: { id: 'p', type: 'fill_blank', answer: 'Hallo', accepted: ['Hallo'] }, onResult: (_, r) => outcomes.push(r), onNext: () => next++ });
    const submit = (value) => { elements(h.render(), 'input')[0].props.onChange({ target: { value } }); elements(h.render(), 'Button')[0].props.onClick(); };
    submit(first); elements(h.render(), 'FeedbackSheet')[0].props.onContinue(); submit(first === 'hallo' ? 'falsch' : 'hallo');
    const sheet = elements(h.render(), 'FeedbackSheet')[0]; assert.ok(!sheet.props.hintOnly); sheet.props.onContinue();
    assert.equal(next, 1); assert.equal(outcomes.length, 1);
  }
});

test('hint feedback hides the answer, reasons and explain control, including screen-reader announcements', async () => {
  const h = await mount('FeedbackSheet', { result: 'wrong', expected: 'SECRET', hint: 'Once more.', hintOnly: true, explanation: 'SECRET reason', otherExplanation: 'SECRET twin', onExplain: () => {}, onContinue: () => {} }, { './NoticeStage.jsx': { inline: (s) => s, OtherLanguage: 'OtherLanguage' } });
  assert.doesNotMatch(textOf(h.render()), /SECRET/);
  assert.equal(elements(h.render(), 'button').length, 0);
});

test('scene choice records the first miss once and reveals only after the second try', async () => {
  const outcomes = []; let next = 0;
  const item = stage('scene').chunks[0].meaning;
  const h = await mount('CheckedChoice', { item, lang: 'en', hintFirst: true, onResult: (_, r) => outcomes.push(r), onNext: () => next++ });
  const choose = (answer) => { elements(h.render(), 'input').find((i) => i.props.value === answer).props.onChange(); elements(h.render(), 'Button')[0].props.onClick(); };
  choose(item.options[1]); assert.doesNotMatch(textOf(elements(h.render(), 'p')), /She greets/);
  elements(h.render(), 'Button')[0].props.onClick(); choose(item.answer);
  assert.ok(textOf(elements(h.render(), 'p')).includes(item.answer));
  elements(h.render(), 'Button')[0].props.onClick(); assert.equal(next, 1); assert.equal(outcomes.length, 1); assert.equal(outcomes[0].correct, false);
});

test('sound requires checked listening before speaking; fluency begins without visible model and retains honest self-confirm', async () => {
  const sound = await mount('SoundStage', { stage: stage('sound'), itemIndex: 0, results: {}, onResult: () => {}, onSayResult: () => {}, onNext: () => {} });
  assert.equal(elements(sound.render(), 'ReadAloudLine').length, 0);
  elements(sound.render(), 'PlayButton')[0].props.onPlayed();
  elements(sound.render(), 'CheckedChoice')[0].props.onNext();
  assert.equal(elements(sound.render(), 'ReadAloudLine').length, 1);
  assert.equal(elements(sound.render(), 'StageShell')[0].props.primaryDisabled, true);
  const props = { stage: stage('fluency'), itemIndex: 0, names: { full: 'Sam Noor' }, results: {}, onSayResult: (i, r) => { props.results[i] = r; }, onNext: () => {} };
  const fluency = await mount('FluencyStage', props);
  let line = elements(fluency.render(), 'ReadAloudLine')[0];
  assert.equal(line.props.hideModel, true); assert.equal(line.props.text, 'Guten Tag. Ich heiße Sam Noor.');
  line.props.onResult({ selfConfirmed: true, usedMic: false });
  assert.equal(elements(fluency.render(), 'StageShell')[0].props.primaryDisabled, false);
  assert.equal(practiceScore([{ stage: 'fluency', itemId: 'f', correct: true }, { stage: 'sound', itemId: 's', correct: true }, { stage: 'read', itemId: 'r', correct: true }]).total, 0);
});

test('intro name is reused only in memory; new speech results save numbers and flags, never names or transcripts', () => {
  const name = nameFromIntroduction('Ich heiße Sam Noor.', lesson.pretest.modelFirst.openings);
  assert.equal(name, 'Sam Noor'); assert.equal(nameFromIntroduction('garbage', lesson.pretest.modelFirst.openings), '');
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(player, /onName=\{lektion.flow === 'guided'/); assert.match(player, /names=\{names\} onNamesChange=\{setNames\}/);
  assert.doesNotMatch(player.slice(player.indexOf('packRun({'), player.indexOf('}), owner)')), /\bnames\b/);
  const result = { pct: 0.8, usedMic: true, attempts: 1, transcript: name, text: name };
  const snapshot = packRun({ stageKey: 'fluency', names: { full: name }, soundReadAloud: { 0: result }, fluencyReadAloud: { 0: result } });
  assert.doesNotMatch(JSON.stringify(snapshot), /Sam|Noor|transcript|"text"|names/);
  assert.equal(snapshot.soundReadAloud[0].pct, 0.8); assert.equal(snapshot.fluencyReadAloud[0].usedMic, true);
});

test('guided recaps carry their story hooks after can-dos; legacy A1.2 has none', () => {
  assert.equal(stage('recap').nextHook, lesson.nextHook);
  for (const l of c.lektionen) assert.deepEqual(buildLesson({ curriculum: c, lektion: l, pool }).stages.at(-1).nextHook, l.nextHook);
  for (const l of c12.lektionen) assert.equal(l.nextHook, undefined);
  assert.match(lesson.nextHook.de, /Bürgerbüro.*Formular/); assert.match(c.lektionen[1].dialog.setting, /Bürgerbüro/);
  const recap = read('src/components/lesson/RecapStage.jsx'); assert.ok(recap.indexOf('canDo.map') < recap.indexOf('stage.nextHook')); assert.ok(recap.indexOf('stage.nextHook') < recap.indexOf('<details className'));
});

test('teacher identity is separate from the cast, has real portrait files, and never collides with a story surname', () => {
  assert.equal(A11_META.teacher, A11_ART.teacher); assert.equal(A11_META.teacher.name, 'Frau Hoffmann'); assert.equal(A11_META.teacher.isAI, true);
  for (const path of [A11_ART.teacher.src, A11_ART.teacher.srcSmall]) assert.ok(existsSync(new URL(`../public${path}`, import.meta.url)));
  assert.ok(A11_ART.teacher.alt);
  for (const curriculum of [c, c12]) for (const l of curriculum.lektionen) for (const line of l.dialog.lines) assert.notEqual(line.speaker.split(' ').at(-1), A11_META.teacher.name.split(' ').at(-1));
  assert.ok(!Object.hasOwn(A11_ART.characters, A11_META.teacher.name));
});

test('intro divides the same count-based estimate among the saved parts; new content affects the estimate', () => {
  const total = lektionMinutesEstimate(lesson), part = lektionPartEstimate(lesson);
  assert.equal(part.parts, 3); assert.ok(part.lo * part.parts <= total.lo); assert.ok(part.hi * part.parts >= total.hi);
  for (const key of ['soundItem', 'readText', 'readQuestion', 'fluencyLine']) assert.ok(STEP_SECONDS[key][1] > 0);
  assert.match(read('src/components/lesson/IntroStage.jsx'), /lektionPartEstimate\(lektion\)/);
});

test('both derived choice and word-order exercises offer one repair and never replace the first miss', async () => {
  for (const name of ['ListenSelectItem', 'WordOrderItem']) {
    const outcomes = []; let next = 0;
    const item = name === 'ListenSelectItem'
      ? { id: 'listen', type: 'listen_select', lineIndex: 0, answer: 'Guten Tag.', accepted: ['Guten Tag.'], options: ['Guten Tag.', 'Gute Nacht.'] }
      : { id: 'order', type: 'word_order', tokens: ['heiße', 'Ich', 'Ana.'], answer: 'Ich heiße Ana.', accepted: ['Ich heiße Ana.'] };
    const h = await mount(name, { item, hintFirst: true, index: 0, total: 1, onResult: (_, r) => outcomes.push(r), onNext: () => next++ });
    if (name === 'ListenSelectItem') {
      elements(h.render(), 'button').find((b) => textOf(b).includes('Gute Nacht.')).props.onClick();
    } else {
      for (let i = 0; i < 3; i++) elements(h.render(), 'button').filter((b) => !b.props['aria-label'])[0].props.onClick();
    }
    elements(h.render(), 'Button')[0].props.onClick();
    let sheet = elements(h.render(), 'FeedbackSheet')[0]; assert.equal(sheet.props.hintOnly, true);
    sheet.props.onContinue();
    if (name === 'ListenSelectItem') {
      elements(h.render(), 'button').find((b) => textOf(b).includes('Guten Tag.')).props.onClick();
    } else {
      for (let i = 0; i < 3; i++) elements(h.render(), 'button').filter((b) => b.props['aria-label'])[0].props.onClick();
      for (const token of ['Ich', 'heiße', 'Ana.']) elements(h.render(), 'button').find((b) => !b.props['aria-label'] && textOf(b).trim() === token).props.onClick();
    }
    elements(h.render(), 'Button')[0].props.onClick();
    sheet = elements(h.render(), 'FeedbackSheet')[0];
    assert.equal(sheet.props.showAnswer, true); assert.equal(sheet.props.hintOnly, false); assert.ok(sheet.props.explanation);
    sheet.props.onContinue(); assert.equal(next, 1); assert.equal(outcomes.length, 1); assert.equal(outcomes[0].correct, false);
  }
});

test('guided matching retains confused first pair responses and submits one corrected match outcome', async () => {
  const outcomes = []; let next = 0;
  const item = { id: 'match', type: 'match', pairs: [{ de: 'Hallo', en: 'Hello' }, { de: 'Danke', en: 'Thank you' }, { de: 'Tschüss', en: 'Bye' }] };
  const h = await mount('GuidedMatchItem', { item, index: 0, total: 1, onResult: (_, r) => outcomes.push(r), onNext: () => next++ });
  for (let i = 0; i < item.pairs.length; i++) {
    let choice = elements(h.render(), 'CheckedChoice')[0];
    assert.equal(choice.props.hintFirst, true);
    assert.equal(checker.checkAnswer(item.pairs[i].en, choice.props.item.accepted, checker.checkOptionsFor(choice.props.item)).result, 'correct');
    choice.props.onResult(choice.props.item, { correct: i !== 0 });
    choice = elements(h.render(), 'CheckedChoice')[0]; choice.props.onNext();
  }
  assert.equal(outcomes.length, 1); assert.equal(outcomes[0].correct, false); assert.equal(outcomes[0].result, 'corrected');
  assert.equal(outcomes[0].confused.length, 1); assert.equal(outcomes[0].confused[0], item.pairs[0]); assert.equal(next, 1);
});

test('sound has one primary action per phase and its own checked confirmation in both languages', async () => {
  const props = { stage: stage('sound'), itemIndex: 0, results: {}, onResult: () => {}, onSayResult: () => {}, onNext: () => {} };
  const sound = await mount('SoundStage', props);
  assert.equal(elements(sound.render(), 'StageShell')[0].props.onPrimary, undefined);
  assert.ok(textOf(sound.render()).includes(props.stage.items[0].modelEn), 'marking is available before the question');
  elements(sound.render(), 'PlayButton')[0].props.onPlayed();
  assert.equal(elements(sound.render(), 'StageShell')[0].props.onPrimary, undefined);
  assert.equal(elements(sound.render(), 'CheckedChoice').length, 1);
  elements(sound.render(), 'CheckedChoice')[0].props.onNext();
  assert.equal(elements(sound.render(), 'CheckedChoice').length, 0);
  assert.equal(elements(sound.render(), 'StageShell')[0].props.onPrimary, props.onNext);
  assert.equal(elements(sound.render(), 'StageShell')[0].props.primaryDisabled, true);
  props.results[0] = { selfConfirmed: true };
  assert.equal(elements(sound.render(), 'StageShell')[0].props.primaryDisabled, false);
  const { t } = await import('../src/lib/lesson/strings.js');
  for (const lang of ['de', 'en']) for (const correct of [true, false]) {
    const h = await mount('CheckedChoice', { item: props.stage.items[0], lang, onResult: () => {}, onNext: () => {} }, { '../../lib/lesson/strings.js': { t } });
    const item = props.stage.items[0];
    elements(h.render(), 'input').find((i) => correct ? i.props.value === item.answer : i.props.value !== item.answer).props.onChange();
    elements(h.render(), 'Button')[0].props.onClick();
    const status = textOf(elements(h.render(), 'p').find((p) => p.props.role === 'status'));
    assert.equal(status, t(correct ? 'sound.correct' : 'sound.correction', lang, { answer: item.answer }));
    assert.doesNotMatch(status, /meaning|Bedeutung/);
  }
});

test('spelling and sentence-building hints fit their task class and remain answer-free', () => {
  for (const item of [
    { type: 'fill_blank', questionDe: 'Lesen Sie die Buchstaben: H-A-L-L-O. Schreiben Sie das Wort: ___', accepted: ['Hallo'] },
    { type: 'fill_blank', questionDe: 'Buchstabieren Sie den Gruß.', accepted: ['H-A-L-L-O'] },
    { type: 'error_correction', accepted: ['T-I-M'] },
  ]) {
    assert.match(feedback.hintFor(item).de, /Buchstaben/);
    assert.match(feedback.hintFor(item).en, /letter/);
    for (const lang of ['de', 'en']) assert.equal(feedback.hintContainsAnswer(feedback.hintFor(item)[lang], item), false);
  }
  assert.match(feedback.hintFor({ type: 'sentence_building', accepted: ['Ich bin hier.'] }).en, /word order.*verb form/);
  const answerCollision = { type: 'fill_blank', questionDe: 'Buchstabieren Sie.', accepted: ['Sie'] };
  assert.equal(feedback.hintContainsAnswer(feedback.hintFor(answerCollision).de, answerCollision), false);
});

test('a choice prompt appears once with an accessible fieldset name in either view, including identical twins', async () => {
  for (const lang of ['en', 'de']) for (const identical of [true, false]) {
    const item = { id: 'prompt', promptDe: identical ? 'Choose a line.' : 'Wählen Sie eine Zeile.', promptEn: 'Choose a line.', options: ['one', 'two'], accepted: ['one'], answer: 'one' };
    const h = await mount('CheckedChoice', { item, lang });
    const heading = elements(h.render(), 'h2')[0];
    assert.equal(textOf(h.render()).split(textOf(heading)).length - 1, 1);
    assert.equal(elements(h.render(), 'fieldset')[0].props['aria-labelledby'], heading.props.id);
    assert.equal(elements(h.render(), 'legend').length, 0);
  }
});

test('audio failure text is present once, in a persistent live region, with a working text fallback', async () => {
  let fallback = 0;
  const h = await mount('PlayButton', { text: 'Hallo', onFallback: () => fallback++ }, {
    '../../lib/lesson/speech.js': { audioFor: () => null, playChecked: async () => ({ ok: false, reason: 'no-german-voice' }) },
    './DialogStage.jsx': { AudioSourceBadge: 'AudioSourceBadge' },
  });
  const initialLive = elements(h.render(), 'p').find((p) => p.props['aria-live'] === 'polite');
  assert.ok(initialLive); assert.equal(textOf(initialLive), '');
  await elements(h.render(), 'button')[0].props.onClick();
  assert.equal(textOf(h.render()).split('audio.failed.no-german-voice').length - 1, 1);
  const live = elements(h.render(), 'p').find((p) => p.props['aria-live'] === 'polite');
  assert.doesNotMatch(live.props.className, /sr-only/);
  elements(h.render(), 'button').find((b) => textOf(b) === 'audio.showText').props.onClick();
  assert.equal(fallback, 1);
});
