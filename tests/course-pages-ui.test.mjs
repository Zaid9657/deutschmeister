// The course pages around the Lektion — home, checkpoint result, review, final test, completion and
// certificate — after the browser walk of 2026-11-25. One rule per class of defect, so a fix of one page
// cannot come back on another: focus, printed chrome, language mixing, labels, wrong sentences.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { loadJsxModule } from './helpers/renderJsx.mjs';
import { STRINGS, t, lessonDateFormat } from '../src/lib/lesson/strings.js';
import { hintText } from '../src/lib/lesson/hints.js';
import { ERROR_TAGS } from '../src/lib/lesson/check.js';
import { checkpointFeedback } from '../src/lib/checkpoint/feedback.js';
import { costliestSection } from '../src/services/examScoring.js';
import { latestCompletion } from '../src/services/programProgress.js';
import { buildCardIndex } from '../src/services/reviewService.js';
import { scoreWriting } from '../src/lib/lesson/writing.js';
import { A11_META } from '../src/data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { canDoList } from '../src/lib/course/canDo.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LANGS = ['en', 'de'];
const icons = new Proxy({}, { get: (_, name) => String(name) });
const elements = (tree, predicate) => (Array.isArray(tree) ? tree.flatMap((x) => elements(x, predicate))
  : tree && typeof tree === 'object' ? [...(predicate(tree) ? [tree] : []), ...elements(tree.props?.children, predicate)] : []);
const words = (tree) => (Array.isArray(tree) ? tree.map(words).join(' ')
  : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : tree?.props ? words(tree.props.children) : '');

/** Hooks that keep state between renders, run effects, and count every focus() a ref is asked for. */
function hooks() {
  const slots = []; let cursor = 0; let effects = []; const focus = { count: 0 };
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  return {
    focus,
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], (v) => { slots[i] = typeof v === 'function' ? v(slots[i]) : v; }]; },
      useRef() { cursor++; return { current: { focus: () => { focus.count += 1; } } }; },
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useEffect(fn, deps) { const i = cursor++; if (!same(slots[i], deps)) { slots[i] = deps; effects.push(fn); } },
    },
    render(Component, props) { cursor = 0; const tree = Component(props); const pending = effects; effects = []; pending.forEach((fn) => fn()); return tree; },
  };
}

/** Every import of a page as a stub of its own name; the caller replaces the ones it wants real. */
function stubsFor(path, react, lang) {
  const stubs = {};
  for (const m of read(path).matchAll(/import\s+([\s\S]*?)\s+from\s+'([^']+)'/g)) {
    const values = {};
    const named = m[1].match(/\{([^}]+)\}/)?.[1];
    if (named) for (const name of named.split(',').map((s) => s.trim()).filter(Boolean)) values[name] = name;
    if (!m[1].trim().startsWith('{')) values.default = m[1].split(',')[0].trim();
    stubs[m[2]] = values;
  }
  stubs.react = react;
  for (const key of Object.keys(stubs)) {
    if (key.endsWith('/lesson/strings.js')) stubs[key] = { useLessonLang: () => [lang], t, lessonDateFormat };
    if (key === 'lucide-react') stubs[key] = icons;
  }
  return stubs;
}

// ── BLOCKER 2 + MAJOR 3: a failed checkpoint shows its result first ─────────

const typedItem = { id: 'rem:x', section: 'remediation', kind: 'typed', mode: 'typed', type: 'fill_blank', topic: 'verb-sein', promptDe: 'Ich ___ Ana.', promptEn: 'I am Ana.', answer: 'bin', accepted: ['bin'], options: null };
async function practiceItem(lang = 'en') {
  const path = 'src/pages/lesson/CheckpointPage.jsx';
  const state = hooks();
  const stubs = stubsFor(path, state.react, lang);
  stubs['../../lib/checkpoint/feedback.js'] = { checkpointFeedback, defersFeedback: () => false, sectionComplete: () => false };
  stubs['../../lib/lesson/hints.js'] = { hintText };
  stubs['../../components/lesson/NoticeStage.jsx'] = { inline: (text) => text };
  stubs['../../lib/checkpoint/buildCheckpoint.js'] = { ...stubs['../../lib/checkpoint/buildCheckpoint.js'], SECTION_LABELS: { hoeren: 'Hören' }, SECTION_ORDER: [] };
  const { PracticeItem } = await loadJsxModule(path, stubs);
  return { PracticeItem, state };
}

test('a practice card under a failed result never takes the focus and shows no dead Continue; a paper item does both', async () => {
  for (const onAnswer of [null, () => {}]) {
    const { PracticeItem, state } = await practiceItem();
    let tree = state.render(PracticeItem, { item: typedItem, onAnswer });
    assert.equal(state.focus.count, onAnswer ? 1 : 0, 'autofocus belongs to the paper');
    elements(tree, (el) => el.type === 'input')[0].props.onChange({ target: { value: 'bin' } });
    tree = state.render(PracticeItem, { item: typedItem, onAnswer });
    elements(tree, (el) => el.type === 'form')[0].props.onSubmit({ preventDefault() {} });
    tree = state.render(PracticeItem, { item: typedItem, onAnswer });
    assert.match(words(tree), /Correct!/);
    assert.equal(/Continue/.test(words(tree)), Boolean(onAnswer), 'Continue only where it leads on');
  }
});

test('a practice card is labelled in words in both languages, never with a raw key', async () => {
  for (const [lang, label] of [['en', 'Practice'], ['de', 'Übung']]) {
    const { PracticeItem, state } = await practiceItem(lang);
    const text = words(state.render(PracticeItem, { item: typedItem }));
    assert.ok(text.includes(label), text);
    assert.doesNotMatch(text, /remediation/i);
  }
});

test('the checkpoint result takes focus and scroll on its heading, once, when it appears', () => {
  const page = read('src/pages/lesson/CheckpointPage.jsx');
  assert.match(page, /const resultShown = phase === 'result' && Boolean\(result\);/);
  assert.match(page, /window\.scrollTo\(\{ top: 0, behavior: 'instant' \}\);\s*resultRef\.current\?\.focus\(\{ preventScroll: true \}\);\s*\}, \[resultShown\]\);/);
  assert.match(page, /<h1 ref=\{resultRef\} tabIndex=\{-1\}/, 'the result has a heading a screen reader lands on');
  assert.match(page, /\{remediation\.map\(\(item\) => \(\s*<PracticeItem key=\{item\.id\} item=\{item\} \/>/, 'the ten cards are practice cards');
  assert.match(page, /window\.setTimeout\(draw, \d+\)/, 'the practice set is drawn after the result has painted');
  assert.equal((page.match(/remediationSet\(/g) || []).length, 1, 'one draw, and it knows the retake');
  assert.match(page, /remediationSet\([^\n]*retake: \{ curriculum, checkpoint, round \}/);
});

test('a failed result leads to its Lektionen and to the practice before the retake, and says when a blocked retake opens', () => {
  const page = read('src/pages/lesson/CheckpointPage.jsx');
  assert.match(page, /chapterLektionen\(curriculum, checkpoint\)/);
  assert.match(page, /t\('checkpoint\.repeatLessons', lang\)/);
  const card = page.slice(page.indexOf('{result.passed ? (\n                  <Button to={nextHref}>'));
  assert.ok(card.indexOf('#checkpoint-practice') > 0 && card.indexOf('#checkpoint-practice') < card.indexOf("t('action.again', lang)"), 'Practise first stands before Try again');
  assert.match(page, /practice\?\.kind !== 'chapter'/, '…and leads only when it practises what was missed');
  assert.equal((page.match(/attempts\?\.blocked && <p[^>]*>\{blockedLine\(attempts, lang\)\}<\/p>/g) || []).length, 2, 'each disabled retake says why');
  const at = new Date(2026, 10, 26, 7, 16);
  for (const [lang, day] of [['en', /26 November/], ['de', /26\. November/]]) {
    const line = t('checkpoint.blocked', lang, { time: lessonDateFormat(lang, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(at) });
    assert.match(line, day, 'a time without its date reads like today');
    assert.match(line, /07:16/);
  }
});

test('the last checkpoint leads to the final test, and a reopened pass says so', () => {
  const page = read('src/pages/lesson/CheckpointPage.jsx');
  assert.match(page, /finalTest \? `\/modelltest\/\$\{finalTest\.testSlug\}`/);
  assert.match(page, /\{passedBefore && \(/);
  assert.match(page, /fetchCheckpointStatus\(user\.id, checkpoint\.id\)/);
  assert.match(page, /localDoneIds\(level\)\.has\(checkpoint\.id\)/, 'a guest pass counts too');
});

test('a part nobody scored draws no full bar, and a guessed part is told to listen or read again only where that is what it was', () => {
  const page = read('src/pages/lesson/CheckpointPage.jsx');
  assert.match(page, /\{section\.scored && \(\s*<div className="mt-1\.5 h-2/, 'the bar belongs to a score');
  for (const lang of LANGS) {
    assert.doesNotMatch(t('checkpoint.sectionGuess.hoeren', lang), /texts|Texte/, lang);
    assert.doesNotMatch(t('checkpoint.sectionGuess', lang), /texts|Texte|listen|hören Sie/, lang);
  }
  assert.match(page, /\{\(item\.text \|\| item\.kind === 'listenChoice'\) && <p [^>]*>\{item\.text \|\| item\.audioText\}<\/p>\}/, 'the feedback prints the text it is about, read or heard');
});

// ── labels and hints in the chrome language ─────────────────────────────────

test('every error chip has a name in both languages, and English chrome shows no German grammar term', () => {
  for (const tag of [...ERROR_TAGS, 'Aussprache', 'Schreiben']) for (const lang of LANGS) assert.ok(STRINGS[lang][`errorTag.${tag}`], `${tag} (${lang})`);
  for (const tag of ['Artikel', 'Kasus', 'Verbstellung', 'Konjugation', 'Rechtschreibung', 'Wortschatz', 'Aussprache']) assert.notEqual(t(`errorTag.${tag}`, 'en'), tag);
  assert.match(read('src/pages/lesson/CheckpointPage.jsx'), /t\(`errorTag\.\$\{tag\}`, lang\)/);
});

test('every hint of the live pools has an English rendering (or no words to render)', () => {
  const open = [];
  for (const level of ['a11', 'a12']) {
    const pool = JSON.parse(read(`src/data/lessonPools/${level}.json`));
    for (const { hint } of pool.items || pool) {
      if (!hint || /^Lektion \d+$|=/.test(hint)) continue;
      assert.equal(hintText(hint, 'de'), hint, 'German chrome shows the hint as stored');
      if (hintText(hint, 'en') === hint) open.push(hint);
    }
  }
  assert.deepEqual([...new Set(open)], []);
});

test('the writing checklist names its form rows in the chrome language; a Leitpunkt stays German', () => {
  const card = read('src/components/lesson/GradedWriting.jsx');
  assert.match(card, /\{rowLabel\(c, lang\)\} — \{t\(c\.ok \? 'writing\.done' : 'writing\.missing', lang\)\}/);
  const rows = scoreWriting({ kind: 'mitteilung', minWords: 25, maxWords: 45, leitpunkte: ['Warum Sie schreiben'] }, 'Hallo').checks;
  assert.equal(rows[0].label, '25–45 Wörter', 'writing.js keeps its German label');
  const fn = card.match(/const rowLabel = \(c, lang\) => \{[\s\S]*?\n\};/)[0];
  const rowLabel = vm.runInNewContext(`${fn}\nrowLabel;`, { t });
  assert.deepEqual(rows.map((r) => rowLabel(r, 'en')), ['25–45 words', 'Greeting', 'Sign-off', 'Warum Sie schreiben']);
  assert.deepEqual(rows.map((r) => rowLabel(r, 'de')), rows.map((r) => r.label));
});

// ── MAJOR 4: review cards ───────────────────────────────────────────────────

async function reviewCard(lang, props) {
  const inlinePath = 'src/components/lesson/NoticeStage.jsx';
  const { inline } = await loadJsxModule(inlinePath, stubsFor(inlinePath, hooks().react, lang));
  const path = 'src/components/lesson/ReviewCard.jsx';
  const state = hooks();
  const stubs = stubsFor(path, state.react, lang);
  stubs['./NoticeStage.jsx'] = { inline };
  const { default: ReviewCard } = await loadJsxModule(path, stubs);
  return state.render(ReviewCard, { mode: 'flashcard', lang, revealed: true, onReveal() {}, typed: '', onTypedChange() {}, onCheckTyped() {}, verdict: null, onPlay() {}, hasRecording: false, onGrade() {}, ...props });
}

test('a rule card shows its rule in the chrome language with bold text, never raw asterisks', async () => {
  const index = buildCardIndex(CURRICULUM_A11);
  const rules = [...index.entries()].filter(([key]) => key.startsWith('pattern:'));
  assert.ok(rules.length >= 8, 'rule cards');
  for (const [key, content] of rules) {
    assert.ok(content.backEn, `${key}: the English rule travels with the card`);
    for (const lang of LANGS) {
      const tree = await reviewCard(lang, { content });
      const text = words(tree);
      assert.doesNotMatch(text, /\*\*/, `${key} (${lang}): raw markdown`);
      const plain = (lang === 'de' ? content.back : content.backEn).replace(/\*+/g, '');
      assert.ok(text.replace(/\s+/g, '').includes(plain.slice(0, 40).replace(/\s+/g, '')), `${key} (${lang})`);
    }
  }
});

test('a typed review card takes no empty answer, and a wrong one offers no „Knew it"', async () => {
  const content = { kind: 'word', front: 'der Tisch', back: 'table', accepted: ['der Tisch'] };
  const empty = await reviewCard('en', { content, mode: 'typed', revealed: false, typed: '  ' });
  assert.equal(elements(empty, (el) => el.props?.type === 'submit')[0].props.disabled, true);
  let checked = 0;
  const form = await reviewCard('en', { content, mode: 'typed', revealed: false, typed: ' ', onCheckTyped: () => { checked += 1; } });
  elements(form, (el) => el.type === 'form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(checked, 0, 'Enter on an empty field grades nothing');
  const grades = [];
  const missed = await reviewCard('en', { content, mode: 'typed', typed: 'die Tisch', verdict: false, onGrade: (g) => grades.push(g) });
  assert.doesNotMatch(words(missed), /Knew it/);
  elements(missed, (el) => el.type === 'Button').at(-1).props.onClick();
  assert.deepEqual(grades, [false]);
});

test('the review page tells a guest where to sign in', () => {
  const page = read('src/pages/lesson/ReviewPage.jsx');
  assert.match(page, /\{!user && <Button to="\/login" state=\{\{ from: \{ pathname: `\/course\/\$\{curriculum\.level\}\/review` \} \}\}>/);
});

// ── MAJOR 5: the certificate on paper, and its date ─────────────────────────

test('printing leaves the page alone: every piece of site chrome is print:hidden and no screen height is reserved', () => {
  for (const [file, tag] of [
    ['src/components/Navbar.jsx', /<nav className="c4-site-nav print:hidden"/],
    ['src/components/Footer.jsx', /<footer className="c4-site-footer print:hidden"/],
    ['src/components/BottomNav.jsx', /className="print:hidden lg:hidden fixed bottom-0/],
    ['src/components/TrialBanner.jsx', /sticky top-16 z-40 w-full print:hidden/],
    ['src/components/FloatingIntroButton.jsx', /fixed bottom-24 left-4 z-50 print:hidden/],
    ['src/components/CourseReturnBar.jsx', /print:hidden/],
  ]) assert.match(read(file), tag, file);
  assert.match(read('src/App.jsx'), /<div className="min-h-screen bg-paper print:min-h-0 print:bg-white">/);
  const print = read('src/index.css').match(/@media print \{[\s\S]*?\n\}/)[0];
  assert.match(print, /#main \{\s*min-height: 0;/);
  assert.match(print, /#dm-cookie-banner/);
  const cert = read('src/pages/CourseCertificatePage.jsx');
  assert.match(cert, /<div className="min-h-screen bg-paper font-body text-ink print:min-h-0 print:bg-white">/);
  assert.match(cert, /print:hidden">\s*<Link to=\{courseComplete\(level\)\}/, 'Back and Print stay on the screen');
});

test('Back, Print, the language toggle and the messages of the completion pages start below the fixed navbar', () => {
  for (const file of ['src/pages/CourseCertificatePage.jsx', 'src/pages/CourseCompletePage.jsx']) {
    const src = read(file);
    assert.doesNotMatch(src, /max-w-[23]xl px-4 py-\d/, `${file} starts under the navbar`);
    assert.match(src, /pt-20 [^"]*sm:pt-24/, file);
  }
});

test('the certificate dates from the last completed step the data has, and only then from today', () => {
  const rows = [
    { item_id: 'a1.1-l01', completed_at: '2026-09-01T10:00:00+00:00' },
    { item_id: 'a1.1-leveltest', completed_at: '2026-10-03T12:00:00+00:00' },
    { item_id: 'other', completed_at: '2026-11-20T12:00:00+00:00' },
    { item_id: 'a1.1-cp1', completed_at: null },
  ];
  assert.equal(latestCompletion(rows, ['a1.1-l01', 'a1.1-cp1', 'a1.1-leveltest']), '2026-10-03T12:00:00+00:00');
  assert.equal(latestCompletion([], ['a1.1-l01']), null);
  assert.equal(latestCompletion(null, ['a1.1-l01']), null);
  assert.equal(latestCompletion([{ item_id: 'a1.1-l01' }], ['a1.1-l01']), null);
  assert.match(read('src/pages/CourseCertificatePage.jsx'), /completedAt \? new Date\(completedAt\) : new Date\(\)/);
});

// ── MAJOR 6: the final test's result ────────────────────────────────────────

test('the result names the section that lost the most points, and none at full marks', () => {
  assert.equal(costliestSection({ hoeren: { score: 0, max: 10 }, lesen: { score: 0, max: 8 } }).key, 'hoeren', '10 points lost, not the first 0 %');
  assert.equal(costliestSection({ hoeren: { score: 9, max: 10 }, lesen: { score: 4, max: 8 } }).key, 'lesen');
  assert.equal(costliestSection({ hoeren: { score: 9, max: 10 }, lesen: { score: 7, max: 8 } }).key, 'lesen', 'equal points: where they weigh more');
  assert.doesNotMatch(RESULT, /meisten Punkte haben/, 'no superlative over a tie');
  assert.equal(costliestSection({ hoeren: { score: 10, max: 10 }, lesen: { score: 8, max: 8 } }), null);
  assert.equal(costliestSection({}), null);
  assert.equal(costliestSection(null), null);
});

const RESULT = read('src/pages/Modelltest/ModelltestResult.jsx');

test('a passed course test leads to its certificate and back to the course', () => {
  assert.match(RESULT, /const passedCourse = passed && attemptIsThisTest \? curriculumForTestSlug\(examSlug\) : null;/);
  assert.match(RESULT, /nextHref=\{courseCertificate\(passedCourse\.level\)\}/);
  assert.match(RESULT, /to=\{courseHome\(passedCourse\.level\)\}>Zurück zum Kurs</);
});

test('a fail is never announced like a win, and readiness never contradicts the verdict above it', () => {
  assert.match(RESULT, /headline=\{passed \? 'Übungstest abgeschlossen!' : 'Das üben Sie als Nächstes'\}/);
  assert.match(read('src/components/CompletionMoment.jsx'), /\{celebrate && <PartyPopper /, 'the party icon belongs to a win');
  assert.match(RESULT, /const showReady = Boolean\(readiness\?\.ready\) && attemptPassed;/);
  assert.match(RESULT, /const showNotReady = [^;]*resolved\?\.kind !== 'course';/, 'a course test has its own pass rule');
  assert.match(RESULT, /\{\(showReady \|\| showNotReady\) && \(/);
});

test('German quotation marks close as „…“ on the course pages', () => {
  const files = [
    ...readdirSync(new URL('../src/pages/Modelltest', import.meta.url)).map((f) => `src/pages/Modelltest/${f}`),
    ...readdirSync(new URL('../src/pages/lesson', import.meta.url)).map((f) => `src/pages/lesson/${f}`),
    ...readdirSync(new URL('../src/components/course', import.meta.url)).map((f) => `src/components/course/${f}`),
    'src/pages/CourseCertificatePage.jsx', 'src/pages/CourseCompletePage.jsx', 'src/pages/CurriculumHomePage.jsx',
  ].filter((f) => /\.jsx?$/.test(f));
  const wrong = [];
  for (const file of files) {
    const code = read(file).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ').replace(/\s\/\/ .*$/gm, ' ');
    for (const m of code.matchAll(/„[^“\n]{0,60}"/g)) wrong.push(`${file}: ${m[0]}`);
  }
  assert.deepEqual(wrong, []);
});

test('the writing field of a course test asks for what its task asks for, and has a name', () => {
  const src = read('src/pages/Modelltest/ModelltestRun.jsx');
  const placeholder = vm.runInNewContext(`${src.match(/const writingPlaceholder = [\s\S]*?;\n/)[0]} writingPlaceholder;`);
  assert.match(placeholder('Teil 1 · Formular'), /Formular/);
  assert.match(placeholder('Teil 2 · E-Mail an die Nachbarin'), /E-Mail/);
  assert.doesNotMatch(placeholder('Teil 2 · Mitteilung'), /E-Mail|Formular/);
  assert.match(src, /<textarea[^>]*aria-label=\{part\.label\}[\s\S]{0,40}placeholder=\{writingPlaceholder\(part\.label\)\}|rows=\{10\}\s*aria-label=\{part\.label\}\s*placeholder=\{writingPlaceholder\(part\.label\)\}/);
});

// ── MAJOR 9: one language at a time on the course home ──────────────────────

/** What a learner reads that is neither the course's own quoted German nor a name shared by both languages. */
const withoutQuotes = (text) => text.replace(/„[^“]*“/g, ' ').replace(/Ana|Frau \w+|Herr \w+|Lena|Tim|Paul|Lektion(en)?|Bremen|Goethe A1|Bürgerbüro/g, ' ');
const ENGLISH = /\b(the|you|your|and|with|from|each|about|who|will|what|of)\b/i;
const GERMAN = /\b(der|die|das|und|Sie|Ihre?[nrms]?|ist|mit|nicht|für|eine?[nrms]?|kann|Wörter|Lehrplan|Wiederholen|Prüfungsteile|Abschlusstest)\b/;

async function render(path, lang, props, extra = {}) {
  const state = hooks();
  const { default: Component } = await loadJsxModule(path, { ...stubsFor(path, state.react, lang), ...extra });
  return state.render(Component, props);
}

test('the welcome, the outcomes and „Kann ich" speak one language: German in Deutsch-Modus, English otherwise', async () => {
  for (const lang of LANGS) {
    const Outcomes = (props) => props;
    const welcome = await render('src/components/course/CourseWelcome.jsx', lang, { curriculum: CURRICULUM_A11, meta: A11_META }, { './CourseOutcomes.jsx': { default: Outcomes } });
    const panel = elements(welcome, (el) => el.type === Outcomes)[0];
    const outcomes = await render('src/components/course/CourseOutcomes.jsx', lang, panel.props);
    const done = new Set(['a1.1-l01', 'a1.1-l02', 'a1.1-l03', 'a1.1-cp1']);
    const kann = await render('src/components/course/KannIch.jsx', lang, { items: canDoList(CURRICULUM_A11, done, Object.fromEntries(CURRICULUM_A11.lektionen.slice(0, 3).map((l) => [l.id, l.canDo.map(() => true)]))), checkpointsPassed: 1, checkpointsTotal: 4, streak: 3 });
    // „Line" is KannIch's own component: what it is handed decides its language.
    const lines = elements(kann, (el) => typeof el.type === 'function' && el.props.item).map((el) => words(el.type(el.props)));
    assert.ok(lines.length >= 3);
    for (const [name, text] of [['welcome', words(welcome)], ['outcomes', words(outcomes)], ['Kann ich', `${words(kann)} ${lines.join(' ')}`]]) {
      const plain = withoutQuotes(text).replace(/Kann ich/g, ' ').replace(/\bein(e[nrms]?)? (Formular)\b/g, '$2');
      if (lang === 'de') assert.doesNotMatch(plain, ENGLISH, `${name} in German: ${plain.match(ENGLISH)?.[0]}`);
      else assert.doesNotMatch(plain, GERMAN, `${name} in English: ${plain.match(GERMAN)?.[0]}`);
    }
  }
});

test('the course home path, syllabus and footer follow the language toggle', () => {
  const home = read('src/pages/CurriculumHomePage.jsx');
  for (const pair of [
    "de ? 'Lehrplan' : 'Syllabus'", "de ? 'Das kann ich danach' : 'What I can do afterwards'", "de ? 'Prüfungsteile:' : 'Exam parts:'",
    "de ? 'Wiederholen' : 'Review'", 'de ? SUPPORT_LINK.labelDe : SUPPORT_LINK.labelEn',
  ]) assert.ok(home.includes(pair), pair);
  assert.match(home, /canDoLines\(l, lang\)/, 'the syllabus shows the can-dos in the chrome language');
  assert.match(home, /const situationOf = \(l\) => \(!de && meta\?\.lektionIntro\?\.\[l\.id\]\?\.situationEn\) \|\| l\.situation;/);
  assert.match(home, /\$\{situationOf\(lektion\)\}/);
  for (const c of A11_META.characters) assert.doesNotMatch(c.roleDe, /^Kommt in Lektion/, `${c.name} needs a German role`);
});

test('the course home says its final-test description once, names no step before progress is in, and shows whole faces', () => {
  const home = read('src/pages/CurriculumHomePage.jsx');
  assert.match(home, /\{!\(meta && welcomeOpen\) && <> · \{courseTestDescription\(curriculum\.testSlug, lang\)\}<\/>\}/, 'the open welcome already ends with it');
  assert.match(home, /\{user && !loaded \? \(\s*<p role="status"/);
  assert.match(home, /const isCurrent = \(!user \|\| loaded\) && current/);
  assert.match(home, /aspect-\[3\/1\] w-full rounded-clay object-cover object-\[50%_20%\]/);
  const welcome = read('src/components/course/CourseWelcome.jsx');
  assert.doesNotMatch(welcome, /same people run through all/, 'half of the cast appears once');
});

// ── MAJOR 10: the completion page ───────────────────────────────────────────

test('while steps are open the course comes first and carries the primary button; the test is secondary', () => {
  const src = read('src/pages/CourseCompletePage.jsx');
  assert.match(src, /\{complete \? \[testCard, certificateCard\] : \[certificateCard, testCard\]\}/);
  assert.match(src, /<Button to=\{`\/modelltest\/\$\{testSlug\}`\} variant=\{complete \? 'primary' : 'secondary'\}/);
  assert.match(src, /<Button to=\{courseHome\(level\)\} variant="primary"/);
});

test('the intro pill stays off every course page, where it covered their buttons on a phone', () => {
  const routes = read('src/components/FloatingIntroButton.jsx').match(/SUPPRESSED_ROUTES = \[([\s\S]*?)\];/)[1];
  assert.match(routes, /'\/course',/);
});

test('Phase 2b: Arabic task help sits under typed, read-aloud and writing checkpoint tasks in either interface mode', async () => {
  for (const lang of LANGS) for (const kind of ['typed', 'readAloud', 'gradedWriting']) {
    const { PracticeItem, state } = await practiceItem(lang);
    const item = { ...typedItem, kind, promptEn: 'Read the sentence aloud.', task: { taskEn: 'Write a short message.' } };
    const tree = state.render(PracticeItem, { item });
    const help = elements(tree, (el) => el.type === 'TaskArabicHelp');
    assert.equal(help.length, 1, lang + '/' + kind);
    assert.equal(help[0].props.taskEn, kind === 'gradedWriting' ? item.task.taskEn : item.promptEn);
  }
});
