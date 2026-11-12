// A1.1 finish rules: contextual input, complete speaking handoffs, language
// preference, one typo retry, honest completion and no premature certificate.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 as curriculum } from '../src/data/curricula/a11.js';
import { curriculumPath } from '../src/data/curricula/index.js';
import { buildLesson, isTypedItem, planPractice } from '../src/lib/lesson/buildLesson.js';
import * as checker from '../src/lib/lesson/check.js';
import { politeCaseItem } from '../src/data/lessonPools/quality.js';
import {
  wortfeldInputCoverage, wortfeldCoverage, noticeFormCoverage, missionlessLektionen,
  producedBeforeTaught, itemLexis, loadPoolItems, taughtUpTo, levelSpec, untaughtTokens,
} from '../scripts/validate-curriculum.mjs';
import { loadJsxModule } from './helpers/renderJsx.mjs';
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const pool = { items: loadPoolItems() };

function elements(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap((node) => elements(node, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...elements(tree.props?.children, predicate)];
}
const node = (tree, type) => elements(tree, (el) => el.type === type)[0];
const words = (tree) => {
  if (Array.isArray(tree)) return tree.map(words).join(' ');
  if (typeof tree === 'string' || typeof tree === 'number') return String(tree);
  return tree?.props ? words(tree.props.children) : '';
};
// Stateful hooks replay the actual component callbacks, including effects when
// their dependencies change. No source-extracted replacement of the submit logic.
function hooks() {
  const slots = []; let cursor = 0; let effects = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  return {
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
        return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }];
      },
      useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial }; },
      useMemo(fn) { return fn(); },
      useEffect(fn, deps) { const i = cursor++; if (!same(slots[i], deps)) { slots[i] = deps; effects.push(fn); } },
    },
    render(Component, props) { cursor = 0; const tree = Component(props); const pending = effects; effects = []; pending.forEach((fn) => fn()); return tree; },
  };
}
const icons = new Proxy({}, { get: (_, name) => name });
const strings = (lang) => ({ useLessonLang: () => [lang], t: (key) => key });

async function exercise(name, lang = 'de') {
  const state = hooks(); const results = []; let continued = 0;
  const stubs = {
    react: state.react, 'lucide-react': icons,
    '../ui/Button.jsx': { default: 'Button' }, '../ui/Card.jsx': { default: 'Card' },
    './FeedbackSheet.jsx': { default: 'FeedbackSheet' }, './ExplainAnswer.jsx': { default: 'ExplainAnswer' },
    './PlayButton.jsx': { default: 'PlayButton' },
    '../../lib/lesson/strings.js': strings(lang), '../../lib/lesson/check.js': checker,
    '../../lib/lesson/buildLesson.js': { isTypedItem }, '../../data/lessonPools/quality.js': { politeCaseItem },
  };
  const { default: Component } = await loadJsxModule(`src/components/lesson/${name}.jsx`, stubs);
  const props = { index: 0, total: 1, onResult: (...args) => results.push(args), onNext: () => continued++,
    item: { id: 'sample', type: 'fill_blank', questionDe: 'Ergänzen Sie: ___', questionEn: 'ENGLISH PROMPT', answer: 'Hallo', accepted: ['Hallo'] },
    line: { index: 0, de: 'Hallo.', en: 'ENGLISH TRANSLATION' },
  };
  const render = () => state.render(Component, props);
  render();
  const typeAndCheck = (text) => {
    let tree = render();
    (node(tree, 'input') || node(tree, 'textarea')).props.onChange({ target: { value: text } });
    tree = render();
    elements(tree, (el) => el.type === 'Button' && words(el) === 'action.check')[0].props.onClick();
    return render();
  };
  return { render, typeAndCheck, props, results, continued: () => continued };
}

test('every word reaches contextual input; bare lemmas and writing answers cannot satisfy coverage', () => {
  assert.deepEqual(wortfeldInputCoverage(curriculum), []);
  assert.deepEqual(wortfeldCoverage(curriculum), []);
  const miniature = { level: 'a1.1', lektionen: [{ nr: 1, wortfeld: [{ de: 'der Rucksack', word: 'Rucksack', article: 'der' }], schreiben: { sample: 'Der Rucksack ist blau.' } }] };
  assert.equal(wortfeldInputCoverage(miniature).length, 1);
  miniature.lektionen[0].wortfeld[0].exampleDe = 'Der Rucksack ist blau.';
  assert.deepEqual(wortfeldInputCoverage(miniature), []);
  const surface = read('src/components/lesson/WortfeldStage.jsx');
  assert.match(surface, /line=\{w\.exampleDe \|\| lineFor/);
  for (const l of curriculum.lektionen) {
    const words = buildLesson({ curriculum, lektion: l, pool }).stages.filter((s) => s.kind === 'wortfeld').flatMap((s) => s.words);
    for (const w of l.wortfeld.filter((w) => w.exampleDe)) assert.equal(words.find((x) => x.wordId === w.wordId).exampleDe, w.exampleDe);
  }
});

test('every bold grammar form is exemplified before assessment, and production never reaches ahead', () => {
  assert.deepEqual(noticeFormCoverage(curriculum), []);
  assert.deepEqual(producedBeforeTaught(curriculum), []);
  const changed = structuredClone(curriculum);
  changed.lektionen[0].notice.bodyDe += ' **Zukunftsform**';
  assert.ok(noticeFormCoverage(changed).some((r) => r.form === 'Zukunftsform'));
  assert.match(read('src/components/lesson/NoticeStage.jsx'), /notice\.formExamples\.map/);
});

test('new contextual input introduces no unexplained vocabulary', () => {
  const spec = levelSpec('a1.1');
  const known = taughtUpTo(curriculum, spec);
  for (const l of curriculum.lektionen) {
    const examples = [...l.wortfeld.map((w) => w.exampleDe).filter(Boolean), ...(l.notice.formExamples || [])];
    for (const text of examples) assert.deepEqual(untaughtTokens({ questionDe: text }, known.get(l.nr), spec), [], `L${l.nr}: ${text}`);
  }
});

test('every speaking task reaches either a real mission or a complete course handoff', () => {
  assert.deepEqual(missionlessLektionen(curriculum), []);
  const task = { missionOrder: null, promptDe: 'Fragen Sie nach dem Zug.', teil: 'Sprechen Teil 2', hintWords: ['Zug'], anrede: 'Sie' };
  const c = (open) => ({ lektionen: [{ nr: 1, sprechen: { open } }] });
  assert.deepEqual(missionlessLektionen(c(task)), []);
  for (const bad of [{ promptDe: ' ' }, { teil: '' }, { hintWords: [] }, { anrede: 'du' }]) assert.deepEqual(missionlessLektionen(c({ ...task, ...bad })), [1]);
  assert.deepEqual(missionlessLektionen(c({ missionOrder: 1 })), []);
});

test('the remaining whole-pool lexis notices are deferred or unreachable; every repeated practice draw respects teaching', () => {
  const byId = new Map(pool.items.map((it) => [it.id, it]));
  for (const row of itemLexis(curriculum)) {
    const earliest = byId.get(row.id)?.minLektion;
    assert.ok(earliest === null || earliest > row.nr, `${row.id}: warning reaches the learner in L${row.nr}`);
  }
  const spec = levelSpec('a1.1'); const taught = taughtUpTo(curriculum, spec);
  for (let attempt = 1; attempt <= 12; attempt++) {
    for (const [nr, items] of planPractice(curriculum, pool, attempt)) {
      for (const item of items) assert.deepEqual(untaughtTokens(item, taught.get(nr), spec), [], `L${nr}, run ${attempt}, ${item.id}`);
    }
  }
});

test('spelled names accept punctuation, typographic dashes and whitespace without changing their letters', () => {
  for (const separator of ['-', '–', '—', ' ', ', ', '.', '/', ' · ', ': ']) {
    const spelled = [...'CHAKIRI'].join(separator);
    assert.equal(checker.spellingApplies(spelled), true);
    assert.equal(checker.checkAnswer(spelled, 'C-H-A-K-I-R-I.').result, checker.RESULT.CORRECT, separator);
    assert.equal(checker.checkAnswer('CHAKIRI', spelled).result, checker.RESULT.CORRECT, separator);
    assert.equal(checker.checkAnswer('CHAKRI', spelled).result, checker.RESULT.WRONG, separator);
  }
  assert.equal(checker.checkAnswer('hallo', 'Hallo').result, checker.RESULT.TYPO);
  assert.equal(checker.checkAnswer('ihr', 'Ihr', { caseSensitive: true }).result, checker.RESULT.WRONG);
});

for (const name of ['PracticeItem', 'DictationItem']) {
  test(`${name}: a case-only miss offers exactly one retry and records only the first response`, async () => {
    const e = await exercise(name);
    const first = e.typeAndCheck('hallo');
    assert.equal(e.results.length, 1);
    assert.equal(e.results[0][1].result, checker.RESULT.TYPO);
    let feedback = node(first, 'FeedbackSheet');
    assert.equal(feedback.props.primaryLabel, 'action.again');
    feedback.props.onExplain?.();
    e.render();
    feedback.props.onContinue();
    assert.equal(node(e.render(), 'ExplainAnswer'), undefined, 'retry closes the explanation before editing');
    assert.ok(!(node(e.render(), 'input') || node(e.render(), 'textarea')).props.disabled);
    feedback = node(e.typeAndCheck('hallo'), 'FeedbackSheet');
    assert.equal(feedback.props.primaryLabel, undefined, 'no second retry');
    feedback.props.onContinue();
    assert.equal(e.continued(), 1);
    assert.equal(e.results.length, 1, 'retry cannot inflate first-response accuracy');
    // A new item gets its own retry and response, even when React reuses the component.
    if (name === 'PracticeItem') e.props.item = { ...e.props.item, id: 'next' };
    else e.props.line = { ...e.props.line, index: 1 };
    e.render();
    assert.equal(node(e.typeAndCheck('Hallo'), 'FeedbackSheet').props.result, checker.RESULT.CORRECT);
    assert.equal(e.results.length, 2);
  });
  test(`${name}: Deutsch mode does not show an unsolicited English prompt or feedback`, async () => {
    const e = await exercise(name);
    assert.doesNotMatch(words(e.render()), /ENGLISH/);
    assert.equal(node(e.typeAndCheck('Hallo'), 'FeedbackSheet').props.explanation, null);
  });
}

test('pretest and speaking translations respect Deutsch mode and dialogue translations start closed there', () => {
  assert.equal((read('src/components/lesson/PretestStage.jsx').match(/lead=\{lang === 'de' \? null : pretest\.promptEn\}/g) || []).length, 2);
  assert.match(read('src/components/lesson/SpeakingStage.jsx'), /lang !== 'de' && open\.promptEn/);
  assert.match(read('src/components/lesson/DialogStage.jsx'), /glossByLang\[lang\]/);
});

test('switching to Deutsch closes automatic glosses but still allows explicit translations', async () => {
  const state = hooks(); let lang = 'en';
  const Component = (await loadJsxModule('src/components/lesson/DialogStage.jsx', {
    react: state.react, 'lucide-react': icons,
    '../ui/Card.jsx': { default: 'Card' }, './StageShell.jsx': { default: 'StageShell' },
    '../illustrations/CharacterAvatar.jsx': { default: 'Avatar' },
    '../../lib/lesson/speech.js': { audioFor: () => null, speechAvailable: () => false, playChecked() {} },
    './PlayButton.jsx': { AudioFailureNotice: 'AudioFailureNotice' },
    '../../lib/lesson/strings.js': { useLessonLang: () => [lang], t: (key) => key },
    '../../lib/lesson/gloss.js': { buildLexicon: () => [], glossTokens: () => [], parseLektionId: () => null },
  })).default;
  const render = () => state.render(Component, { stage: { glossOpen: true, dialog: { lines: [{ speaker: 'Ana', de: 'Hallo.', en: 'ENGLISH GLOSS' }] } } });
  assert.match(words(render()), /ENGLISH GLOSS/);
  lang = 'de';
  assert.doesNotMatch(words(render()), /ENGLISH GLOSS/);
  node(render(), 'StageShell').props.secondary.props.onClick();
  assert.match(words(render()), /ENGLISH GLOSS/, 'an explicit translation request still works in German');
});

test('completion reports actual milestones, preserves the live next course and offers review', () => {
  const src = read('src/pages/CourseCompletePage.jsx');
  assert.doesNotMatch(src, /XP earned|prove it|real pass threshold|half exam length|variant="celebrate"/);
  assert.match(src, /localDoneIds\(level\)/, 'guest progress is visible instead of a permanent loading screen');
  assert.match(src, /useLessonLang\(/);
  assert.match(src, /<LangToggle/);
  assert.match(src, /\/course\/\$\{level\}\/review/);
  assert.match(src, /step\.station\.priceLabel/);
  assert.match(src, /kein Goethe-\/telc-Ergebnis/);
  assert.equal(curriculumPath(curriculum).filter((n) => n.kind === 'lektion').length, 12);
  // Live-next-course and existing checkout/access branches also run in course-certificate.test.
});

test('a certificate cannot render its completion claim or print action while progress is pending', async () => {
  const state = hooks();
  const Component = (await loadJsxModule('src/pages/CourseCertificatePage.jsx', {
    react: state.react,
    'react-router-dom': { useParams: () => ({ level: 'a1.1' }), Link: 'Link', Navigate: 'Navigate' },
    '../contexts/AuthContext': { useAuth: () => ({ user: null }) },
    '../data/courses/index.js': { courseFor: () => ({}) },
    '../data/curricula/index.js': { curriculumFor: () => curriculum, curriculumPath },
    '../services/lessonService.js': { programKeyFor: () => 'a11_course' },
    '../services/programProgress': { getProgramProgress: async () => new Set() },
    '../lib/courseFlow.js': { flattenCourse: () => [], isComplete: () => false, courseComplete: () => '/complete', courseHome: () => '/course/a1.1' },
    '../components/ui/Button.jsx': { default: 'Button' }, '../components/FullPageRedirect.jsx': { default: 'Redirect' },
  })).default;
  const tree = state.render(Component, {});
  assert.match(words(tree), /Kursfortschritt wird geprüft/);
  assert.doesNotMatch(words(tree), /abgeschlossen hat|Drucken/);
  assert.equal(node(tree, 'Link').props.to, '/course/a1.1');
});
