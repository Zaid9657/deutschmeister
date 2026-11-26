// Three A1.1 screen findings (2026-11-23), each closed by a rule rendered from the real components:
//
//  I1  One numbering on every guided stage header: the stage's part („Part 2 of 3 · Practice 3/7“),
//      never the legacy „Step n“ that skipped the scene, sounds, reading, from-memory and check steps.
//  I2  A form's check line says what the form check checks (every field, its kind of entry), never
//      the Mitteilung's length, points, greeting and sign-off.
//  I4  The final check: a shown can-do is read out as shown (its tick is an aria-hidden icon), and a
//      graded answer stays on screen under „Your answer“.
//
// Components are compiled with tests/helpers/renderJsx.mjs. Every import is the real module except
// React (one-render hooks, effects not run), icons and child components (names), and the modules that
// reach the network or the browser (stubbed below).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import buildLesson from '../src/lib/lesson/buildLesson.js';
import { CURRICULUM_A11 as c } from '../src/data/curricula/a11.js';
import * as strings from '../src/lib/lesson/strings.js';
import { SESSION_COUNT, sessionOf } from '../src/lib/lesson/sessions.js';
import { checkTurns, modelAnswer, typedResult } from '../src/lib/lesson/finalCheck.js';
import { RESULT } from '../src/lib/lesson/check.js';
import { shownLines } from '../src/lib/course/canDo.js';
import { loadJsxModule } from './helpers/renderJsx.mjs';

const { t } = strings;
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
const LANGS = ['en', 'de'];
const noop = () => {};

// ── a one-render React: state survives re-renders, effects never run (they reach the DOM) ──────────
let lang = 'en';
const hooks = { slots: [], cursor: 0 };
const react = {
  useState(initial) {
    const i = hooks.cursor++;
    if (!(i in hooks.slots)) hooks.slots[i] = typeof initial === 'function' ? initial() : initial;
    return [hooks.slots[i], (v) => { hooks.slots[i] = typeof v === 'function' ? v(hooks.slots[i]) : v; }];
  },
  useRef(initial) { const i = hooks.cursor++; return (hooks.slots[i] ||= { current: initial }); },
  useMemo: (fn) => fn(),
  useCallback: (fn) => fn,
  useEffect: noop,
};
const fresh = () => { hooks.slots = []; hooks.cursor = 0; };
/** Function components defined inside a module (CheckTurn, RetrievalPretest, Checklist) render in place. */
const expand = (tree) => {
  if (Array.isArray(tree)) return tree.map(expand);
  if (!tree || typeof tree !== 'object') return tree;
  if (typeof tree.type === 'function') return expand(tree.type(tree.props));
  return { ...tree, props: { ...tree.props, children: expand(tree.props.children) } };
};
const render = (Component, props) => { hooks.cursor = 0; return expand(Component(props)); };
const elements = (tree, pred) => (Array.isArray(tree) ? tree.flatMap((x) => elements(x, pred))
  : tree && typeof tree === 'object' ? [...(pred(tree) ? [tree] : []), ...elements(tree.props?.children, pred)] : []);
const text = (tree) => (Array.isArray(tree) ? tree.map(text).join('')
  : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : tree && typeof tree === 'object' ? text(tree.props?.children) : '');

const IMPURE = {
  'speech.js': { audioFor: () => null, playChecked: async () => ({}), speechAvailable: () => false, playWord: noop, phonetikSpeechText: (x) => x },
  'funnelTracking.js': { trackFirstSentence: noop, trackSocialClicked: noop },
  AuthContext: { useAuth: () => ({ user: null }) },
  'mediaSupport.js': { checkSpeakingSupport: () => ({ supported: false }) },
  'reviewService.js': { fetchLektionReviewDueAt: async () => null },
  'supabase.js': { supabase: {} },
  supabase: { getAuthHeaders: async () => ({}) },
  writingTasks: { MAX_WRITING_POINTS: 20 },
};
async function load(path) {
  const base = new URL(`../${path}`, import.meta.url);
  const stubs = {};
  for (const [, clause, spec] of read(path).matchAll(/^import\s+([\s\S]*?)\s+from\s+'([^']+)';/gm)) {
    const file = spec.split('/').pop();
    if (spec === 'react') stubs[spec] = react;
    else if (spec === 'lucide-react') stubs[spec] = {};
    else if (spec === 'react-router-dom') stubs[spec] = { Link: 'Link' };
    else if (file === 'strings.js') stubs[spec] = { ...strings, useLessonLang: () => [lang] };
    else if (IMPURE[file]) stubs[spec] = IMPURE[file];
    else if (spec.endsWith('.jsx')) {
      // A child component is its name; the shell's props are what a test reads.
      const values = {};
      for (const name of (clause.match(/\{([^}]+)\}/)?.[1] || '').split(',').map((s) => s.trim()).filter(Boolean)) values[name] = name;
      const def = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
      if (def) values.default = def;
      stubs[spec] = values;
    } else stubs[spec] = await import(new URL(spec, base).href);
  }
  return loadJsxModule(path, stubs);
}
const modules = {};
const component = async (name) => (modules[name] ||= (await load(`src/components/lesson/${name}.jsx`)).default);

// The real shell turns { eyebrow, part } into the header line.
const { default: StageShell } = await loadJsxModule('src/components/lesson/StageShell.jsx', {
  'lucide-react': {}, '../ui/Button.jsx': { default: 'Button' },
  './CommandHelp.jsx': { default: 'CommandHelp' },
  '../../lib/lesson/strings.js': { ...strings, useLessonLang: () => [lang] },
});
/** The header a stage screen shows: the shell's eyebrow line, or an item screen's own h2. */
function header(tree) {
  const shell = elements(tree, (el) => el.type === 'StageShell')[0];
  if (!shell) return text(elements(tree, (el) => el.type === 'h2')[0]);
  const shown = StageShell({ ...shell.props, children: null });
  return text(elements(elements(shown, (el) => el.type === 'header'), (el) => el.type === 'p')[0]);
}

/** The screens the player renders for a stage, with the props it passes (LessonPlayerPage.jsx). */
function screens(s, l, stages) {
  const base = { lektionId: l.id, onBack: noop, onDone: noop, onNext: noop, onResult: noop };
  const firstPractice = stages.find((x) => x.kind === 'practice').items[0];
  const item = (it, i, all, extra = {}) => ({ ...base, item: it, index: i, total: all.length, part: s.part, hintFirst: true, ...extra });
  switch (s.kind) {
    case 'pretest': return [['PretestStage', { ...base, stage: s, onName: noop }]];
    case 'wortfeld': return [['WortfeldStage', { ...base, stage: { ...s, words: s.words.map((w) => ({ ...w, db: null })) } }]];
    case 'sound': return [['SoundStage', { ...base, stage: s, itemIndex: 0, results: {}, onSayResult: noop }]];
    case 'read': return [['ReadStage', { ...base, stage: s, itemIndex: 0, onItemChange: noop }]];
    case 'notice': return [['NoticeStage', { ...base, stage: s }]];
    case 'practice': return [['PracticeItem', item({ ...s.items[0], stage: 'practice' }, 0, s.items, { level: c.level, eyebrowKey: 'stage.practice.eyebrow' })]];
    case 'derived': return s.items.map((it, i) => {
      const name = { match: 'GuidedMatchItem', word_order: 'WordOrderItem', listen_select: 'ListenSelectItem', dictation: 'DictationItem' }[it.type];
      return [name, item(it, i, s.items, it.type === 'dictation' ? { line: { index: it.lineIndex, de: it.answer } } : {})];
    });
    case 'dictation': return [['DictationItem', { ...base, line: s.lines[0], index: 0, total: s.lines.length, part: s.part, hintFirst: true }]];
    case 'fluency': return [['FluencyStage', { ...base, stage: s, itemIndex: 0, names: {}, onNamesChange: noop, results: {}, onSayResult: noop }]];
    case 'speaking': return [['SpeakingStage', { ...base, stage: s, level: c.level, code: c.code, lektion: l, initialResults: {}, onProgress: noop, onReport: noop }]];
    case 'writing': return [['WritingStage', { ...base, stage: s, onReport: noop }]];
    // Built empty; the player fills it with the misses. A missed practice item is the common one.
    case 'requeue': return [['PracticeItem', item({ ...firstPractice, stage: 'requeue' }, 0, [firstPractice], { level: c.level, eyebrowKey: 'stage.requeue.eyebrow', allowReveal: true, hintFirst: false })]];
    case 'check': return [['CheckStage', { ...base, stage: s, lektion: l }]];
    case 'recap': return [['RecapStage', { ...base, stage: s, level: c.level, accuracy: 1, status: 'complete', skills: [], nextLabel: 'next' }]];
    default: return null;
  }
}

test('I1: every guided stage header shows its part of the Lektion and no legacy step number', async () => {
  const player = read('src/pages/lesson/LessonPlayerPage.jsx');
  // The player gives every stage its part, in both flows, and hands it to the screens it renders itself.
  assert.match(player, /lesson\.stages\.map\(\(s\) => \(\{ \.\.\.s, part: sessionOf\(s\) \}\)\)/);
  assert.match(player, /eyebrow=\{t\('stage\.warmup\.eyebrow', lang\)\} part=\{stage\.part\}/, 'the warm-up header carries its part');
  assert.match(player, /part: stage\.part,/, 'retried and derived items carry their part');
  assert.match(player, /eyebrowKey=\{retry \? 'stage\.requeue\.eyebrow' : 'stage\.practice\.eyebrow'\}\s+part=\{stage\.part\}/);
  assert.match(player, /<DictationItem [^>]*part=\{stage\.part\}/);
  assert.match(player, /t\('scene\.part', lang, \{ nr: lektion\.nr, part: sessionOf\(stage\), total: SESSION_COUNT \}\)/);

  const covered = new Set();
  for (const l of c.lektionen) {
    const built = buildLesson({ curriculum: c, lektion: l, pool, dueCards: [{ cardKey: 'due' }] }).stages;
    const stages = built.map((s) => ({ ...s, part: sessionOf(s) })); // what the player renders
    for (const s of stages) {
      for (const lng of LANGS) {
        lang = lng;
        const part = t('stage.part', lng, { part: s.part, total: SESSION_COUNT });
        assert.doesNotMatch(part, /[{}]/);
        if (s.kind === 'scene') {
          // The scene's own header bar (the player's) already numbers by part.
          assert.ok(t('scene.part', lng, { nr: l.nr, part: s.part, total: SESSION_COUNT }).includes(part), `${l.id} scene ${lng}`);
          covered.add(s.kind); continue;
        }
        if (s.kind === 'warmup') {
          const shown = header({ type: 'StageShell', props: { eyebrow: t('stage.warmup.eyebrow', lng), part: s.part } });
          assert.equal(shown, `${part} · ${t('stage.warmup.eyebrow', lng)}`);
          covered.add(s.kind); continue;
        }
        const list = screens(s, l, stages);
        assert.ok(list, `${l.id}: no screen known for stage kind ${s.kind}`);
        for (const [name, props] of list) {
          fresh();
          const shown = header(render(await component(name), props));
          const where = `${l.id} ${s.kind} (${name}, ${lng}): "${shown}"`;          assert.ok(shown.startsWith(`${part} · `) && shown.length > part.length + 3, `${where} must open with its part and name the stage`);
          assert.doesNotMatch(shown, /\b(?:Step|Schritt) \d/, `${where} carries a legacy step number`);
          assert.doesNotMatch(shown, /[{}]/, `${where} has an unfilled placeholder`);
        }
        covered.add(s.kind);
      }
    }
  }
  const kinds = new Set(buildLesson({ curriculum: c, lektion: c.lektionen[0], pool, dueCards: [{ cardKey: 'due' }] }).stages.map((s) => s.kind));
  assert.deepEqual([...kinds].filter((k) => !covered.has(k)), [], 'every guided stage kind was rendered');
  // No string the stage headers read still carries a step number, in either language.
  for (const lng of LANGS) {
    for (const [key, value] of Object.entries(strings.STRINGS[lng])) {
      if (/eyebrow$|^fluency\.cue$/.test(key)) assert.doesNotMatch(value, /\b(?:Step|Schritt) \d/, `${lng}.${key}`);
    }
  }
});

test('I2: a form task says what its form check checks, and names no length, points, greeting or sign-off', async () => {
  const GradedWriting = (await load('src/components/lesson/GradedWriting.jsx')).default;
  const forms = c.lektionen.filter((l) => l.schreiben?.kind === 'formular');
  const message = c.lektionen.find((l) => l.schreiben?.kind === 'mitteilung');
  assert.ok(forms.length >= 3, 'the A1.1 form tasks were found');
  const taskOf = (s) => ({ examKey: 'goethe_a1', taskKey: s.taskKey, kind: s.kind, taskDe: s.taskDe, fields: s.fields, leitpunkte: s.leitpunkte, minWords: s.minWords, maxWords: s.maxWords });
  const NOT_A_FORM = /length|points|greeting|sign-off|Länge|Punkte|Anrede|Gruß/i;
  // The line under the live checklist, and the fallback note after a submission without the AI.
  const formLine = (tree) => text(elements(tree, (el) => el.type === 'p' && /^(Form check|Formcheck):/.test(text(el)))[0]);
  const fallbackLine = (tree) => text(elements(tree, (el) => el.type === 'p' && /(only checks the form|prüft nur die Form)/.test(text(el)))[0]);
  for (const lng of LANGS) {
    lang = lng;
    for (const l of forms) {
      fresh();
      const props = { task: taskOf(l.schreiben), lektionId: l.id, onResult: noop };
      let tree = render(GradedWriting, props);
      const live = formLine(tree);
      assert.ok(live, `${l.id} ${lng}: the form check line is shown`);
      assert.doesNotMatch(live, NOT_A_FORM, `${l.id} ${lng}: "${live}"`);
      assert.match(live, lng === 'de' ? /jedes Feld/ : /every field/, `${l.id} ${lng}: the line names the per-field check`);
      // Fill every field, hand it in signed out: the checklist fallback replaces the grade.
      for (const input of elements(tree, (el) => el.type === 'input')) { input.props.onChange({ target: { value: 'Ana' } }); tree = render(GradedWriting, props); }
      elements(tree, (el) => el.type === 'Button')[0].props.onClick();
      const note = fallbackLine(render(GradedWriting, props));
      assert.ok(note, `${l.id} ${lng}: the fallback note is shown`);
      assert.doesNotMatch(note, NOT_A_FORM, `${l.id} ${lng}: "${note}"`);
    }
    // A Mitteilung keeps its own line: there length, points, greeting and sign-off ARE checked.
    fresh();
    assert.match(formLine(render(GradedWriting, { task: taskOf(message.schreiben), lektionId: message.id, onResult: noop })), NOT_A_FORM);
  }
});

test('the final check opens on the turn the learner had reached, and the chosen person stays the same', async () => {
  const CheckStage = await component('CheckStage');
  const l = c.lektionen[2];
  const stage = { ...buildLesson({ curriculum: c, lektion: l, pool }).stages.find((s) => s.kind === 'check') };
  stage.part = sessionOf(stage);
  const props = { stage, lektion: l, onBack: noop, onDone: noop };
  for (const lng of LANGS) {
    lang = lng;
    fresh();
    const start = header(render(CheckStage, props));
    fresh();
    const third = header(render(CheckStage, { ...props, resume: { retake: 0, outcomes: ['shown', 'missed'], chosen: null } }));
    assert.notEqual(third, start, `${lng}: the header counts the turn`);
    assert.match(third, /3/, `${lng}: ${third}`);
    // More verdicts than turns (an edited check): the end screen, never a blank turn.
    fresh();
    const done = render(CheckStage, { ...props, resume: { retake: 0, outcomes: Array(40).fill('shown'), chosen: null } });
    assert.equal(elements(done, (el) => el.type === 'li').length, shownLines(l, lng).length);
  }
});

test('I4: the final check reads every can-do state aloud, and a graded answer stays on screen', async () => {
  const CheckStage = await component('CheckStage');
  const RecapStage = await component('RecapStage');
  const l = c.lektionen[0];
  const stage = { ...buildLesson({ curriculum: c, lektion: l, pool }).stages.find((s) => s.kind === 'check') };
  stage.part = sessionOf(stage);
  const turns = checkTurns(stage.check, 0);
  const srOnly = (li) => text(elements(li, (el) => el.props?.className === 'sr-only'));
  for (const lng of LANGS) {
    lang = lng;
    // The end screen, all shown and all missed: every can-do says its state in words, not only by icon.
    for (const outcome of ['shown', 'missed']) {
      fresh();
      const props = { stage, lektion: l, onBack: noop, onDone: noop };
      for (let i = 0; i < turns.length; i += 1) { hooks.cursor = 0; CheckStage(props).props.onOutcome(outcome, ''); }
      const items = elements(render(CheckStage, props), (el) => el.type === 'li');
      assert.equal(items.length, shownLines(l, lng).length, `${lng}: one row per can-do`);
      for (const li of items) {
        if (outcome === 'shown') {
          assert.ok(srOnly(li).includes(t('check.shown', lng)), `${lng}: a shown can-do is read as shown`);
          assert.ok(!text(li).includes(t('recap.canDo.notYet', lng)));
        } else {
          assert.ok(text(li).includes(t('recap.canDo.notYet', lng)), `${lng}: a missed can-do says „still to practise“`);
          assert.equal(srOnly(li), '', `${lng}: a missed can-do is not read as shown`);
        }
      }
    }
    // The recap repeats the check's verdicts with the same words.
    fresh();
    const checkShown = shownLines(l, lng).map((_, i) => i % 2 === 0);
    const recapStage = { ...buildLesson({ curriculum: c, lektion: l, pool }).stages.find((s) => s.kind === 'recap'), part: 3 };
    const rows = elements(render(RecapStage, { checkShown, stage: recapStage, level: c.level, accuracy: 1, status: 'complete', skills: [], onBack: noop, onNext: noop }), (el) => el.type === 'li')
      .filter((li) => shownLines(l, lng).some((line) => text(li).startsWith(line)));
    assert.equal(rows.length, checkShown.length, `${lng}: the recap lists the can-dos`);
    // What the check showed stands first, what it did not show after it; every row says its state in words.
    const expected = shownLines(l, lng).map((line, i) => ({ line, shown: checkShown[i] })).sort((a, b) => Number(b.shown) - Number(a.shown));
    rows.forEach((li, i) => {
      assert.ok(text(li).startsWith(expected[i].line), `${lng}: recap row ${i + 1}`);
      assert.ok(srOnly(li).includes(t(expected[i].shown ? 'check.shown' : 'recap.canDo.notYet', lng)), `${lng}: recap row ${i + 1}`);
    });
    // Under „What you can do now" only what the check showed, with how; nothing shown, no such heading.
    const recap = (shown) => render(RecapStage, { checkShown: shown, stage: recapStage, level: c.level, accuracy: 1, status: 'complete', skills: [], onNext: noop });
    const headings = (shown) => { fresh(); return elements(recap(shown), (el) => el.type === 'h3').map((h3) => text(h3)); };
    const [now, notYet] = [t('recap.canDo.title', lng), t('recap.canDo.notYet', lng)];
    assert.deepEqual(headings(checkShown).filter((h3) => [now, notYet].includes(h3)), [now, notYet], lng);
    assert.deepEqual(headings(checkShown.map(() => false)).filter((h3) => [now, notYet].includes(h3)), [notYet], `${lng}: nothing shown`);
    assert.deepEqual(headings(checkShown.map(() => true)).filter((h3) => [now, notYet].includes(h3)), [now], `${lng}: all shown`);
    assert.deepEqual(headings(null).filter((h3) => [now, notYet].includes(h3)), [now], `${lng}: no check`);
    fresh();
    const screen = text(recap(checkShown));
    for (const key of ['recap.canDo.inCheck.written', 'recap.canDo.notInCheck']) assert.ok(screen.includes(t(key, lng)), `${lng}: ${key} (a guest writes every turn)`);
    fresh();
    assert.ok(!text(recap(null)).includes(t('recap.canDo.inCheck.written', lng)), `${lng}: without a check nothing is said about one`);

    // A turn answered right: the input goes, the learner's words stay above „Correct!“.
    const right = modelAnswer(turns[0]);
    const wrong = 'xyz qq';
    assert.equal(typedResult(turns[0], right), RESULT.CORRECT);
    assert.equal(typedResult(turns[0], wrong), RESULT.WRONG);
    const answerTurn = (...tries) => {
      fresh();
      const props = { stage, lektion: l, onBack: noop, onDone: noop };
      let tree = render(CheckStage, props);
      for (const value of tries) {
        elements(tree, (el) => el.type === 'input' || el.type === 'textarea')[0].props.onChange({ target: { value } });
        tree = render(CheckStage, props);
        elements(tree, (el) => el.type === 'Button' && text(el) === t('action.check', lng))[0].props.onClick();
        tree = render(CheckStage, props);
      }
      return tree;
    };
    const yours = (tree) => elements(tree, (el) => el.type === 'Card' && text(el).startsWith(t('practice.yourAnswer', lng)));
    let tree = answerTurn(right);
    assert.ok(text(tree).includes(t('feedback.correct', lng)), `${lng}: the turn is graded correct`);
    assert.equal(elements(tree, (el) => el.type === 'input').length, 0, `${lng}: the input is gone once graded`);
    assert.equal(yours(tree).length, 1, `${lng}: the answer stays under „Your answer“`);
    assert.ok(text(yours(tree)[0]).includes(right), `${lng}: the learner's own words are shown`);
    // Two misses: the learner's last try stays beside the model answer.
    tree = answerTurn(wrong, wrong);
    assert.equal(yours(tree).length, 1, `${lng}: a missed answer stays too`);
    assert.ok(text(yours(tree)[0]).includes(wrong));
    assert.ok(text(tree).includes(modelAnswer(turns[0])), `${lng}: next to the model answer`);
  }
});
