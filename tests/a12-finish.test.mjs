import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { CURRICULUM_A12 as curriculum } from '../src/data/curricula/a12.js';
import { anyCurriculumFor, curriculumPath } from '../src/data/curricula/index.js';
import { buildLesson, planPractice } from '../src/lib/lesson/buildLesson.js';
import * as checkpoint from '../src/lib/checkpoint/buildCheckpoint.js';
import * as feedback from '../src/lib/checkpoint/feedback.js';
import { fetchAttemptState, recordAttempt } from '../src/services/checkpointService.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { t } from '../src/lib/lesson/strings.js';
import { audioFor } from '../src/lib/lesson/speech.js';
import { wortfeldInputCoverage, readingIntroductions, housingRoomCounts, imperativePronounMismatch, englishTwins, levelSpec, loadPoolItems, taughtUpTo, untaughtTokens } from '../scripts/validate-curriculum.mjs';
import { undecidedTimePrepositionGaps } from '../scripts/lib/time-preposition-cues.mjs';
import { loadJsxModule } from './helpers/renderJsx.mjs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a12.json'));
const page = read('src/pages/lesson/CheckpointPage.jsx');

const elements = (tree, predicate) => Array.isArray(tree) ? tree.flatMap((x) => elements(x, predicate))
  : tree && typeof tree === 'object' ? [...(predicate(tree) ? [tree] : []), ...elements(tree.props?.children, predicate)] : [];
const text = (tree) => Array.isArray(tree) ? tree.map(text).join(' ') : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : text(tree?.props?.children || []);
function hooks() {
  const slots = []; let cursor = 0;
  return {
    react: { useState: (initial) => { const n = cursor++; if (!(n in slots)) slots[n] = typeof initial === 'function' ? initial() : initial; return [slots[n], (v) => { slots[n] = typeof v === 'function' ? v(slots[n]) : v; }]; },
      useRef: (current) => ({ current }), useEffect: () => {}, useMemo: (fn) => fn() },
    render: (Component, props) => { cursor = 0; return Component(props); },
  };
}
// Stub only module boundaries; compile and execute the real JSX and callbacks.
function stubsFor(path, state, lang) {
  const stubs = {};
  for (const m of read(path).matchAll(/import\s+([\s\S]*?)\s+from\s+'([^']+)'/g)) {
    const values = {};
    const named = m[1].match(/\{([^}]+)\}/)?.[1];
    if (named) for (const name of named.split(',').map((s) => s.trim()).filter(Boolean)) values[name] = name;
    else values.default = m[1].trim();
    stubs[m[2]] = values;
  }
  stubs.react = state.react;
  for (const key of Object.keys(stubs)) if (key.endsWith('/lesson/strings.js')) stubs[key] = { useLessonLang: () => [lang], t };
  return stubs;
}

test('A1.2 teaches every word and introduces assessed adverts and notices before their checkpoint', () => {
  assert.deepEqual(wortfeldInputCoverage(curriculum), []);
  assert.deepEqual(readingIntroductions(curriculum), []);
  const spec = levelSpec('a1.2'), known = taughtUpTo(curriculum, spec);
  for (const l of curriculum.lektionen) {
    const lesson = buildLesson({ curriculum, lektion: l, pool });
    assert.ok(lesson.stages.some((s) => s.kind === 'notice'));
    for (const sentence of [...l.wortfeld.map((w) => w.exampleDe).filter(Boolean), l.notice.readingExample?.text].filter(Boolean)) {
      assert.deepEqual(untaughtTokens({ questionDe: sentence }, known.get(l.nr), spec), [], `L${l.nr}: ${sentence}`);
    }
    const ex = l.notice.readingExample;
    if (!ex) continue;
    assert.deepEqual(lesson.stages.find((s) => s.kind === 'notice').notice.readingExample, ex);
    const missing = structuredClone(curriculum);
    delete missing.lektionen[l.nr - 1].notice.readingExample;
    assert.ok(readingIntroductions(missing).some((error) => error.includes(ex.type)));
    const incomplete = structuredClone(curriculum);
    delete incomplete.lektionen[l.nr - 1].notice.readingExample.explanationDe;
    assert.ok(readingIntroductions(incomplete).some((error) => error.includes('incomplete')));
  }
});

test('worked reading inputs render text, task and a revealable explanation in the selected language', async () => {
  for (const lang of ['de', 'en']) {
    const state = hooks(), path = 'src/components/lesson/NoticeStage.jsx';
    const { default: Notice } = await loadJsxModule(path, stubsFor(path, state, lang));
    for (const l of curriculum.lektionen.filter((l) => l.notice.readingExample)) {
      const tree = state.render(Notice, { stage: { notice: l.notice } });
      const ex = l.notice.readingExample;
      assert.ok(text(tree).includes(ex.text));
      assert.ok(text(tree).includes(ex[lang === 'de' ? 'questionDe' : 'questionEn']));
      const details = elements(tree, (el) => el.type === 'details')[0];
      assert.ok(details && text(details).includes(ex.answer));
      assert.ok(text(details).includes(ex[lang === 'de' ? 'explanationDe' : 'explanationEn']));
      assert.equal(details.props.open, undefined);
    }
  }
});

test('English imperative instructions cannot reverse pronoun omission/retention while preserving every form', () => {
  const notice = curriculum.lektionen.find((l) => l.notice.ruleSlug === 'imperative').notice;
  assert.deepEqual(imperativePronounMismatch(notice), []);
  for (const [before, after, pronoun] of [
    ['the pronoun is dropped', 'the pronoun is kept', 'ihr'],
    ['the pronoun is dropped', 'keep the pronoun', 'ihr'],
    ['the pronoun stays', 'drop the pronoun', 'Sie'],
  ]) {
    const changed = { ...notice, bodyEn: notice.bodyEn.replace(before, after) };
    assert.ok(imperativePronounMismatch(changed).includes(pronoun));
    const c = structuredClone(curriculum);
    c.lektionen.find((l) => l.notice.ruleSlug === 'imperative').notice = changed;
    assert.ok(englishTwins(c).lektionen.some((finding) => finding.why.includes('contradicts')));
  }
});

test('time selectors belong to the gap, never another sentence, a negation or another event', () => {
  const gap = (questionDe, accepted = ['ab']) => ({ id: 'probe', type: 'fill_blank', minLektion: 9, questionDe, accepted });
  for (const question of [
    'Beginn: acht Uhr. Sie können ___ acht Uhr einsteigen. (ab oder bis?)',
    'Sie können ___ acht Uhr einsteigen. Der Kurs hat seinen Beginn um acht Uhr.',
    'Sie können ___ acht Uhr einsteigen. (nicht der Beginn; ab oder bis?)',
    'Sie können ___ acht Uhr einsteigen. (kein Anfang; ab oder bis?)',
    'Sie können ___ acht Uhr einsteigen. (Beginn des Kurses; ab oder bis?)',
    'Der Kurs ist ___ acht Uhr. (erste Uhrzeit zum Einsteigen; ab oder bis?)',
  ]) assert.equal(undecidedTimePrepositionGaps([gap(question)]).length, 1, question);
  assert.deepEqual(undecidedTimePrepositionGaps([gap('Sie können ___ acht Uhr einsteigen. (Beginn; ab oder bis?)')]), []);
  assert.deepEqual(undecidedTimePrepositionGaps([gap('Sie können ___ acht Uhr einsteigen.', ['ab', 'bis'])]), []);
  assert.deepEqual(undecidedTimePrepositionGaps(loadPoolItems('a1.2')), []);
});

test('all listening option sets are disjoint and graded feedback waits for the full listening section', () => {
  for (const level of ['a1.1', 'a1.2']) {
    const c = anyCurriculumFor(level), p = JSON.parse(read(`src/data/lessonPools/${level.replace('.', '')}.json`));
    for (const cp of c.checkpoints) for (let round = 0; round < 4; round++) {
      const items = checkpoint.buildCheckpoint({ curriculum: c, checkpoint: cp, pool: p, seed: checkpoint.paperSeed(cp, round) });
      const listening = items.filter((it) => it.section === 'hoeren'), choices = listening.filter((it) => it.kind === 'wordChoice');
      assert.equal(choices.length, 2);
      assert.equal(new Set(choices.flatMap((it) => it.options)).size, 8, `${cp.id}/${round}: overlapping listening options`);
      const answers = {};
      for (const item of listening) {
        assert.deepEqual(feedback.checkpointFeedback(item, item.answer, { graded: true }), { answer: item.answer });
        answers[item.id] = item.answer;
      }
      assert.equal(feedback.sectionComplete(items, answers, 'hoeren'), true);
      for (const item of listening) assert.equal(feedback.checkpointFeedback(item, item.answer, { graded: true, complete: true }).correct, true);
      assert.equal(checkpoint.scoreCheckpoint(items, answers).sections.hoeren.correct, 5);
      // Delayed release is not just a helper: exercise the page's actual transition.
      const code = page.match(/const onAnswer = \(item, answer\) => \{[\s\S]*?\n {2}\};/)[0];
      const last = listening.at(-1), phases = [];
      const ctx = vm.createContext({ ...feedback, items, index: items.indexOf(last), answers: { ...answers }, setAnswers: () => {}, setPhase: (p) => phases.push(p), setIndex: () => assert.fail('section review was skipped'), finish: () => assert.fail('paper ended early') });
      vm.runInContext(`${code}\nthis.answer = onAnswer`, ctx);
      ctx.answer(last, last.answer);
      assert.deepEqual(phases, ['sectionFeedback']);
    }
  }
});

test('eight-hour reset and restart retain paper exposure; account history works on a new device', async () => {
  const oldWindow = globalThis.window, oldNow = Date.now, values = new Map();
  const start = Date.UTC(2026, 10, 3); let hour = 0;
  Date.now = () => start + hour * 3600000;
  globalThis.window = { localStorage: { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v) } };
  try {
    for (const cp of curriculum.checkpoints) {
      const seen = [];
      for (hour of [0, 1, 2, 11]) {
        const state = await fetchAttemptState(null, cp.id);
        seen.push(state.paperRound);
        assert.equal(state.used, hour === 11 ? 0 : hour);
        await recordAttempt(null, { level: 'a1.2', checkpointId: cp.id, items: [], result: { passed: false }, round: state.paperRound, stamp: new Date(Date.now()).toISOString() });
      }
      assert.deepEqual(seen, [0, 1, 2, 3]);
      const texts = (round) => checkpoint.buildCheckpoint({ curriculum, checkpoint: cp, pool, seed: checkpoint.paperSeed(cp, round) }).filter((i) => i.section === 'lesen').map((i) => i.text);
      assert.equal(texts(3).filter((text) => texts(0).includes(text)).length, 0);
      assert.equal(checkpoint.paperSeed(cp, 4003), checkpoint.paperSeed(cp, 3), 'finite bank is bounded, not a recursive lifetime rebuild');
      const before = (await fetchAttemptState(null, cp.id)).paperRound;
      await recordAttempt(null, { level: 'a1.2', checkpointId: cp.id, items: [], result: {}, retry: true });
      assert.equal((await fetchAttemptState(null, cp.id)).paperRound, before);
    }
    values.clear();
    const client = { from: () => {
      let head = false;
      const q = { select: (_fields, options) => { head = options?.head; return q; }, eq: () => q, gte: () => q, order: () => q,
        then: (resolve) => resolve({ data: head ? null : [], count: head ? 3 : null, error: null }) };
      return q;
    } };
    const state = await fetchAttemptState('buyer', curriculum.checkpoints[0].id, client);
    assert.deepEqual([state.used, state.remaining, state.paperRound], [0, 3, 3]);
    assert.equal((await fetchAttemptState(null, curriculum.checkpoints[0].id)).paperRound, 0, 'account history does not belong to the guest');
  } finally { Date.now = oldNow; globalThis.window = oldWindow; }
});

test('checkpoint prompts and explanations respect Deutsch mode, including writing and speaking', async () => {
  for (const lang of ['de', 'en']) {
    for (const kind of ['dictation', 'gradedWriting', 'readAloud']) {
      const state = hooks(), path = 'src/pages/lesson/CheckpointPage.jsx', stubs = stubsFor(path, state, lang);
      stubs['../../lib/checkpoint/feedback.js'] = feedback;
      const { PracticeItem } = await loadJsxModule(path, stubs);
      const item = { id: 'probe', kind, section: 'hoeren', mode: kind === 'dictation' ? 'typed' : 'confirm', promptDe: 'Hören Sie zu.', promptEn: 'ENGLISH PROMPT', task: { taskEn: 'ENGLISH TASK' }, answer: 'Hallo', accepted: ['Hallo'], explanationDe: 'Hallo', explanationEn: 'ENGLISH FEEDBACK' };
      const props = { item, onAnswer: () => {}, graded: false };
      let tree = state.render(PracticeItem, props);
      assert.equal(/ENGLISH/.test(text(tree)), lang === 'en', kind);
      if (kind === 'dictation') {
        elements(tree, (el) => el.type === 'input')[0].props.onChange({ target: { value: 'Hallo' } });
        tree = state.render(PracticeItem, props);
        elements(tree, (el) => el.type === 'form')[0].props.onSubmit({ preventDefault() {} });
        tree = state.render(PracticeItem, props);
        assert.equal(text(tree).includes('ENGLISH FEEDBACK'), lang === 'en');
      }
    }
  }
  for (const cp of curriculum.checkpoints) {
    for (const item of checkpoint.buildCheckpoint({ curriculum, checkpoint: cp, pool }).filter((i) => ['dictation', 'wordChoice', 'readAloud'].includes(i.kind))) {
      assert.equal(item.explanationDe, item.audioText || item.text);
      assert.equal(audioFor(item.lektionId, item.lineKey), null, 'A1.2 has no recorded manifest');
    }
  }
});

test('the A1.2 home renders its path and completion in the selected language', async () => {
  const path = 'src/pages/CurriculumHomePage.jsx';
  for (const lang of ['de', 'en']) for (const complete of [false, true]) {
    const state = hooks(), stubs = stubsFor(path, state, lang);
    stubs['../contexts/AuthContext'] = { useAuth: () => ({ user: null }) };
    stubs['../contexts/SubscriptionContext'] = { useSubscription: () => ({}) };
    stubs['react-router-dom'] = { Link: 'Link', useSearchParams: () => [new URLSearchParams()] };
    stubs['../data/curricula/a11.meta.js'] = { A11_META: { level: 'a1.1' }, lektionMinutesEstimate: () => ({ lo: 20, hi: 30 }) };
    stubs['../data/curricula/index.js'] = { curriculumPath };
    stubs['../config/levels.js'] = { LEVEL_ORDER: ['A1.1', 'A1.2', 'A2.1'] };
    stubs['../config/freeTier.js'] = { isLevelFree: () => false };
    stubs['../data/navigation.js'] = { SUPPORT_LINK: { href: '/support', labelDe: 'Hilfe' } };
    stubs['../lib/course/localProgress.js'] = { localDoneIds: () => new Set(complete ? curriculumPath(curriculum).map((n) => n.id) : []) };
    stubs['../lib/lesson/runState.js'] = { latestRun: () => null };
    stubs['../lib/course/canDo.js'] = { canDoList: () => [] };
    const { default: Home } = await loadJsxModule(path, stubs);
    const tree = state.render(Home, { curriculum });
    if (lang === 'de') {
      assert.match(text(tree), /Deutsch\s+A1.2/);
      assert.doesNotMatch(text(tree), /\b(?:German|Chapter|words|done|Course|Continue|Final test|Lektionen open)\b/);
      assert.ok(text(tree).includes(complete ? 'Kurs abgeschlossen' : 'Hier starten'));
    } else assert.match(text(tree), /German\s+A1.2/);
    assert.equal(elements(tree, (el) => typeof el.type === 'function' && el.props.label).length, 17);
  }
});

test('every served A1.2 practice key is accepted and delayed inventory stays out until taught', () => {
  const spec = levelSpec('a1.2'), known = taughtUpTo(curriculum, spec);
  for (let attempt = 1; attempt <= 12; attempt++) for (const [nr, items] of planPractice(curriculum, pool, attempt)) for (const item of items) {
    assert.deepEqual(untaughtTokens(item, known.get(nr), spec), [], `${item.id}/L${nr}`);
    assert.equal(checkAnswer(item.answer, item.accepted?.length ? item.accepted : [item.answer], checkOptionsFor(item)).result, RESULT.CORRECT, item.id);
  }
  assert.equal(checkAnswer('berlin', ['Berlin']).result, RESULT.TYPO);
  assert.equal(checkAnswer('sie', ['Sie'], { caseSensitive: true }).result, RESULT.WRONG);
});

test('generated checkpoints keep new seeds beyond the first bank without recursive lifetime work', () => {
  const c = anyCurriculumFor('a1.1'), cp = c.checkpoints[0];
  const p = JSON.parse(read('src/data/lessonPools/a11.json'));
  const first = checkpoint.buildCheckpoint({ curriculum: c, checkpoint: cp, pool: p });
  for (const round of [4, 4003]) {
    assert.equal(checkpoint.paperSeed(cp, round), `${cp.id}-round-${round}`);
    const retake = checkpoint.buildCheckpoint({ curriculum: c, checkpoint: cp, pool: p, seed: checkpoint.paperSeed(cp, round) });
    assert.equal(retake.length, first.length);
    assert.notDeepEqual(retake, first);
  }
});

test('housing room counts exclude kitchens and bathrooms, which are named separately', () => {
  assert.deepEqual(housingRoomCounts(curriculum), []);
  const fixture = (de) => ({ lektionen: [{ nr: 1, dialog: { lines: [{ de }] } }] });
  assert.equal(housingRoomCounts(fixture('Vier: Küche, Badezimmer, Wohnzimmer und Schlafzimmer.')).length, 1);
  assert.deepEqual(housingRoomCounts(fixture('Zwei: Wohnzimmer und Schlafzimmer. Küche und Badezimmer sind auch da.')), []);
});
