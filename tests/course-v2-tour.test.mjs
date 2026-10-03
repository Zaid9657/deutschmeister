// Course v2 — the course intro and the coach-mark tour (owner 2026-10-01, after testing on the
// phone: "still no clear structure for the user as an introduction, tour, etc.").
//
// The welcome gained three structure screens between the can-dos and the pace — how the level is
// built (pathModel.courseMap → home/WelcomeAufbau.jsx), what one Kapitel holds
// (pathModel.chapterSteps → home/WelcomeKapitel.jsx), how a screen works (home/WelcomeSo.jsx) — and
// the path gained four coach marks (pathModel.tourStops → home/CourseTour.jsx) shown once per device
// after the welcome and replayable from the top bar's help button. What is pinned here:
//   - every number is counted from the manifest, never typed (12 Kapitel, 4 Module, 3 Plateaus,
//     7 Lernschritte, 20 Minuten, 80 %);
//   - the welcome draws what the path draws (the Kapitel hues, the step icons, the chest and trophy)
//     and names the buttons the player shows (strings.js keys, not retyped words);
//   - the test-out line appears only where the completion rules credit a test-out AND the player
//     offers one;
//   - the coach marks are a real dialog, keep their own flag, survive blocked storage, and never
//     bring the label cards back onto the path.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseHomeModel } from '../src/lib/course-v2/homeModel.js';
import { dailyGoalMinutes } from '../src/lib/course-v2/gamify.js';
import { laneLabel } from '../src/components/course-v2/content.js';
import {
  coursePath, courseTiles, courseMap, chapterSteps, stepWord, welcomeModel, welcomeStorageKey, paceStorageKey,
  tourStorageKey, showTour, tourStops, tourBannerUnit, TOUR_TARGETS, NODE_ICON, stepMinutes, courseFinish,
} from '../src/lib/course-v2/pathModel.js';
import { sectionsOf } from '../src/lib/course-v2/curriculum.js';
import { V2_STRINGS, tv } from '../src/components/course-v2/strings.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const manifestOf = (level) => JSON.parse(read(`src/data/course-v2/${level}/manifest.json`));
const A11 = manifestOf('a1.1');
const B11 = manifestOf('b1.1');
const ALL_STOPS = { plateaus: new Set([1, 2, 3]), closings: new Set(['a1.1-ht-sd1']) };

const HOME_DIR = 'src/components/course-v2/home';
const PAGE = 'src/pages/course-v2/CourseHomeV2Page.jsx';
const HOME_FILES = readdirSync(join(ROOT, HOME_DIR)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${HOME_DIR}/${f}`);
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

const stateOf = ({ finished = {}, progress = {} } = {}) => ({
  finishedSteps: new Map(Object.entries(finished).map(([u, ids]) => [u, new Set(ids)])),
  progress: new Map(Object.entries(progress).map(([u, status]) => [u, { lektion_id: u, status }])),
});
const steps = (unitId, nrs) => nrs.map((n) => `${unitId}-ls${n}`);
const pathFor = (state) => {
  const model = courseHomeModel(A11, state, ALL_STOPS);
  return { model, path: coursePath(model, state, { etappenDe: A11.showcase.etappenDe, manifest: A11 }) };
};
const avgMinutes = (m) => {
  const planned = m.units.map((u) => Number(u.minutesPlanned) || 0).filter(Boolean);
  return planned.reduce((a, b) => a + b, 0) / planned.length;
};

// ---------------------------------------------------------------------------
// Screen 3 „aufbau": the course map
// ---------------------------------------------------------------------------

test('the course map is the manifest: a row per Modul, its Kapitel, the Plateau chest, the Abschlusstest trophy', () => {
  const map = courseMap(A11);
  assert.equal(map.modules.length, A11.etappen.length);
  assert.deepEqual(map.modules.map((m) => m.label), A11.etappen.map((e) => `Modul ${e.nr}`));
  const nrOf = (id) => A11.units.find((u) => u.unit === id).nr;
  assert.deepEqual(map.modules.map((m) => m.kapitel.map((k) => k.nr)), A11.etappen.map((e) => e.units.map(nrOf)));
  assert.equal(map.modules.flatMap((m) => m.kapitel).length, A11.counts.units, 'every Kapitel once');
  // each Modul is closed by what the manifest says: Plateau n, and the last by the Abschlusstest
  assert.deepEqual(map.modules.map((m) => m.stop && m.stop.label), ['Plateau 1', 'Plateau 2', 'Plateau 3', 'Abschlusstest']);
  assert.equal(map.modules.filter((m) => m.stop && m.stop.kind === 'plateau').length, A11.counts.plateaus);
  assert.equal(A11.etappen[A11.etappen.length - 1].closedBy, 'closing');
  // the blocks wear the colour of their banner on the path, so Kapitel 4 looks the same in both
  const { path } = pathFor(stateOf());
  const bannerHue = new Map(path.sections.flatMap((s) => s.units).map((u) => [u.nr, u.hue]));
  for (const k of map.modules.flatMap((m) => m.kapitel)) assert.equal(k.hue, bannerHue.get(k.nr), `Kapitel ${k.nr}: the banner's hue`);
  // the path's stops carry the same short names under the chest and the trophy
  assert.deepEqual(path.sections.map((s) => s.stop && s.stop.short), map.modules.map((m) => m.stop && m.stop.label));
  // a sentence per row for screen readers (the map itself is decorative)
  assert.equal(map.modules[0].sr, 'Modul 1: Kapitel 1, 2, 3, dann Plateau 1.');
  assert.equal(courseMap(A11, { lang: 'en' }).modules[3].sr, 'Modul 4: Kapitel 10, 11, 12, then Abschlusstest.');
});

test('the map\'s legend: Kapitel with Kapitel 1\'s real title, Plateau, Abschlusstest in its exam\'s format — no promise', () => {
  const de = courseMap(A11).legend;
  assert.deepEqual(de.map((r) => r.key), ['kapitel', 'plateau', 'closing']);
  assert.deepEqual(de.map((r) => r.term), ['Kapitel', 'Plateau', 'Abschlusstest'], 'the path\'s German names in both chromes');
  assert.equal(de[0].example, A11.units[0].title, 'the example is Kapitel 1\'s title, read from the manifest');
  assert.equal(de[0].example, 'Hallo, ich bin Priya');
  assert.equal(de[1].text, 'Wiederholung und ein kurzer Test');
  const lane = Object.keys(A11.closing.halbtest)[0];
  assert.equal(de[2].text, `alle Prüfungsteile im Kleinen, wie beim ${laneLabel(lane)}`);
  assert.match(A11.honestyLineDe, /im Kleinen/, 'the same claim the honesty line makes: every part, in small');
  const en = courseMap(A11, { lang: 'en' }).legend;
  assert.deepEqual(en.map((r) => r.term), de.map((r) => r.term));
  assert.equal(en[0].text, 'a chapter: one topic, e.g.');
  for (const r of [...de, ...en]) assert.doesNotMatch(`${r.text}`, /bestehen|garantiert|pass|guarantee/i, 'a format, never an outcome');
  // without Module there is no map (and no screen)
  assert.equal(courseMap({ units: A11.units }), null);
  assert.equal(courseMap({}), null);
  assert.equal(courseMap({ ...A11, closing: {}, counts: { ...A11.counts, closingBlocks: 0 } }).legend.some((r) => r.key === 'closing'), false);
});

// ---------------------------------------------------------------------------
// Screen 4 „kapitel": seven short steps
// ---------------------------------------------------------------------------

test('a Kapitel\'s steps: Kapitel 1\'s outline, the path\'s icons, 1–3 word names, minutes from the plan', () => {
  const ch = chapterSteps(A11, 'a1.1');
  const outline = A11.units[0].outline;
  assert.equal(ch.unitNr, 1);
  assert.equal(ch.count, outline.length);
  assert.equal(ch.count, A11.counts.lernschritte / A11.counts.units, '84 Lernschritte over 12 Kapitel');
  assert.equal(ch.heading, `Jedes Kapitel: ${ch.count} kurze Lernschritte`);
  assert.equal(tv('welcome.kapitel', 'en', { n: ch.count }), 'Each chapter: 7 short steps');
  // drawn the way the path draws Kapitel 1: the same icons, in the same order, in its hue
  const { path } = pathFor(stateOf());
  const u1 = path.sections[0].units[0];
  assert.deepEqual(ch.steps.map((s) => s.icon), u1.nodes.map((n) => n.icon));
  assert.deepEqual(ch.steps.map((s) => s.icon), outline.map((s) => NODE_ICON[s.kind]));
  assert.equal(ch.hue, u1.hue);
  assert.deepEqual(ch.steps.map((s) => s.label), ['Teil A · Hören', 'Teil B · Hören', 'Teil C · Lesen', 'Prüfungstraining', 'Sprechen', 'Schreiben', 'Kapiteltest']);
  assert.deepEqual(chapterSteps(A11, 'a1.1', { lang: 'en' }).steps.map((s) => s.label),
    ['Part A · Listening', 'Part B · Listening', 'Part C · Reading', 'Exam practice', 'Speaking', 'Writing', 'Chapter test']);
  for (const s of ch.steps) assert.ok(s.label.split(/\s+/).filter((w) => w !== '·').length <= 3, `„${s.label}" is 1–3 words`);
  // the listening/reading word follows the step's text: a dialogue is heard, a text is read
  assert.deepEqual(outline.slice(0, 3).map((s) => s.input.kind), ['dialog', 'dialog', 'text']);
  assert.equal(stepWord(sectionsOf([{ kind: 'situation', title: 'x' }])[0]), 'Teil A', 'no text → just the part');
  // minutes per step: the planned minutes of a Kapitel over its steps — the same figure the Kursplan shows
  assert.equal(ch.minutes, stepMinutes(avgMinutes(A11), ch.count));
  assert.equal(ch.minutes, 20);
  assert.equal(ch.minutesLine, 'Etwa 20 Minuten pro Lernschritt');
  assert.ok(courseTiles(A11).find((t) => t.key === 'lernschritte').label.includes(`etwa ${ch.minutes} Minuten`), 'the Kursplan says the same');
  // a B level: eight steps, Überarbeiten before the Kapiteltest, from its first outlined Kapitel
  const b = chapterSteps(B11, 'b1.1');
  assert.equal(b.count, 8);
  assert.ok(b.steps.some((s) => s.kind === 'ueberarbeiten'));
  assert.equal(chapterSteps({}, 'a1.1'), null);
});

test('the test-out line: only where the rules credit it and the player offers it, with the player\'s own button', () => {
  const ch = chapterSteps(A11, 'a1.1');
  const rule = A11.completion.unit;
  assert.ok(rule.completeWhen.includes('lernschritte-finished-or-tested-out'));
  const pct = Math.round(rule.testOutThreshold * 100);
  assert.equal(pct, 80);
  assert.equal(ch.testOut, `Schon bekannt? Am Kapitelanfang „${tv('flow.testOut', 'de')}“: Ab ${pct} % zählen die Übungsschritte als erledigt.`);
  assert.ok(chapterSteps(A11, 'a1.1', { lang: 'en' }).testOut.includes(`“${tv('flow.testOut', 'en')}”`), 'EN names the EN button');
  // the player really offers it at the start of every A1.1 Kapitel (StartView's quiet button, the guide)
  for (const f of readdirSync(join(ROOT, 'src/data/course-v2/a1.1/units'))) {
    const unit = JSON.parse(read(`src/data/course-v2/a1.1/units/${f}`));
    assert.equal(unit.start && unit.start.testOut && unit.start.testOut.offered, true, `${f} offers the test-out`);
  }
  assert.match(read('src/components/course-v2/StartView.jsx'), /quietLabel=\{t\('flow\.testOut'\)\}/, 'the story screen\'s button');
  assert.match(read('src/lib/course-v2/completion.js'), /testOutThreshold: 0\.8/);
  // no credit in the rules → no line
  const noCredit = { ...A11, completion: { ...A11.completion, unit: { completeWhen: ['lernschritte-finished', 'aufgaben-submitted'], testOutThreshold: 0.8 } } };
  assert.equal(chapterSteps(noCredit, 'a1.1').testOut, null);
  const noThreshold = { ...A11, completion: { ...A11.completion, unit: { completeWhen: ['lernschritte-finished-or-tested-out'] } } };
  assert.equal(chapterSteps(noThreshold, 'a1.1').testOut, null);
});

// ---------------------------------------------------------------------------
// Screen 5 „so" and the strings
// ---------------------------------------------------------------------------

test('„So lernen Sie" names the player\'s real buttons through the player\'s own keys', () => {
  const so = read(`${HOME_DIR}/WelcomeSo.jsx`);
  for (const [key, where] of [['item.next', 'FeedbackSheetV2.jsx'], ['audio.play', 'AudioButton.jsx'], ['item.check', 'ItemView.jsx']]) {
    assert.ok(so.includes(`t('${key}')`), `the screen reads ${key}`);
    assert.ok(read(`src/components/course-v2/${where}`).includes(`'${key}'`), `${where} shows ${key}`);
  }
  assert.equal(tv('item.check', 'de'), 'Prüfen');
  assert.equal(tv('audio.play', 'de'), 'Anhören');
  assert.match(so, /uppercase[^"]*">\s*\{t\('item\.check'\)\}/, 'the chip is drawn like the real button: capitals');
  assert.match(tv('welcome.soCheckText', 'de', { check: 'Prüfen' }), /^„Prüfen“ zeigt sofort/);
  assert.equal((so.match(/<li /g) || []).length, 3, 'three rows');
});

test('the new chrome is ONE contiguous welcome./tour. block per table, in both languages, in Sie', () => {
  const keys = new Set();
  for (const f of [...HOME_FILES, PAGE, 'src/lib/course-v2/pathModel.js']) {
    for (const m of read(f).matchAll(/'((?:welcome|tour)\.[A-Za-z]+)'/g)) keys.add(m[1]);
  }
  const tourKeys = [...keys].filter((k) => k.startsWith('tour.'));
  assert.ok(tourKeys.length >= 15, `the tour uses ${tourKeys.length} keys — suspiciously few`);
  for (const k of keys) {
    assert.equal(typeof V2_STRINGS.en[k], 'string', `EN lacks ${k}`);
    assert.equal(typeof V2_STRINGS.de[k], 'string', `DE lacks ${k}`);
    assert.doesNotMatch(V2_STRINGS.de[k], DU_TOKENS, `${k}: Sie`);
  }
  for (const lang of ['en', 'de']) {
    const order = Object.keys(V2_STRINGS[lang]);
    const from = order.indexOf('welcome.aufbau');
    assert.ok(from > 0, `${lang}: the block starts with welcome.aufbau`);
    const block = order.slice(from);
    assert.ok(block.every((k) => k.startsWith('welcome.') || k.startsWith('tour.')), `${lang}: nothing else inside or after the block`);
    for (const k of tourKeys) assert.ok(block.includes(k), `${lang}: ${k} is in the block`);
    assert.equal(order.filter((k) => k.startsWith('tour.')).length, block.filter((k) => k.startsWith('tour.')).length, `${lang}: no tour key elsewhere`);
  }
  assert.deepEqual(Object.keys(V2_STRINGS.de).slice(Object.keys(V2_STRINGS.de).indexOf('welcome.aufbau')),
    Object.keys(V2_STRINGS.en).slice(Object.keys(V2_STRINGS.en).indexOf('welcome.aufbau')), 'the same keys, in the same order');
  assert.equal(V2_STRINGS.de['tour.help'], 'So funktioniert’s');
  assert.equal(V2_STRINGS.en['tour.help'], 'How it works');
  assert.equal(V2_STRINGS.de['tour.next'], 'Weiter');
  assert.equal(V2_STRINGS.de['tour.skip'], 'Überspringen');
});

// ---------------------------------------------------------------------------
// The welcome's order, and the coach marks' model
// ---------------------------------------------------------------------------

test('the welcome: six screens in order, the pace last; the help button replays 3–5', () => {
  const w = welcomeModel(A11, 'a1.1');
  assert.deepEqual(w.screens, ['hallo', 'ziele', 'aufbau', 'kapitel', 'so', 'tempo']);
  assert.deepEqual(w.replay, w.screens.slice(2, 5));
  assert.equal(w.map.heading, 'So ist A1.1 aufgebaut');
  assert.equal(welcomeModel(A11, 'a1.1', { lang: 'en' }).map.heading, 'How A1.1 is built');
  assert.deepEqual(welcomeModel({}, 'a1.1').screens, [], 'no data → no welcome');
  assert.deepEqual(welcomeModel({}, 'a1.1').replay, [], 'no data → no help button');
});

test('the coach marks keep their own flag: once per device, also for a learner who finished the welcome before', () => {
  assert.equal(tourStorageKey('A1.1'), 'dm_course_v2_tour:a1.1');
  assert.notEqual(tourStorageKey('a1.1'), welcomeStorageKey('a1.1'));
  assert.notEqual(tourStorageKey('a1.1'), paceStorageKey('a1.1'));
  assert.equal(showTour(null), true, 'never seen (or storage blocked: safeGet gives null) → shown');
  assert.equal(showTour('2026-10-01'), false, 'finished or skipped here');
  const page = read(PAGE);
  assert.match(page, /useState\(\(\) => showTour\(safeGet\(tourStorageKey\(level\)\)\)\)/, 'read once, through safeStorage');
  assert.match(page, /safeSet\(tourStorageKey\(level\), /, 'finishing or skipping is remembered');
  assert.doesNotMatch(page, /showTour\([^)]*welcome/i, 'the welcome flag does not decide it');
  for (const f of [PAGE, ...HOME_FILES]) assert.doesNotMatch(stripComments(read(f)), /\blocalStorage\b|sessionStorage/, `${f}: storage only through safeStorage`);
});

test('the four stops: the current node, its Kapitel banner, the tabs, the numbers — in the chrome language', () => {
  const goal = dailyGoalMinutes(A11, 'standard');
  const fresh = tourStops(pathFor(stateOf()).path, { lang: 'de', goalMinutes: goal });
  assert.deepEqual(fresh.map((s) => s.target), [...TOUR_TARGETS]);
  assert.deepEqual(TOUR_TARGETS, ['start', 'banner', 'tabs', 'stats']);
  assert.deepEqual(fresh.map((s) => s.scroll), [true, true, false, false], 'only path targets scroll; the bars never do');
  assert.equal(fresh[0].title, 'Hier geht es los');
  assert.equal(fresh[0].text, 'Kapitel 1, Lernschritt 1. Tippen Sie auf den Kreis und dann auf „Start“.');
  assert.equal(fresh[1].text, 'Modul, Kapitel und Thema – und wie weit Sie sind. Das Buch zeigt, was im Kapitel steckt.');
  assert.equal(fresh[2].text, '„Kursplan“ zeigt den ganzen Kurs. „Grammatik“ und „Wörter“: Regeln und Wörter nachschlagen.');
  assert.equal(fresh[3].text, `Die Flamme zählt Ihre Lerntage in Folge. XP sind Ihre Punkte. Der Ring ist Ihr Tagesziel: ${goal} Minuten.`);
  // the tab names the stop quotes are the tab bar's labels
  const bar = read(`${HOME_DIR}/TabBar.jsx`);
  for (const tab of ['Kursplan', 'Grammatik', 'Wörter']) assert.match(bar, new RegExp(`^\\s+${tab}$`, 'm'), `the tab bar says ${tab}`);
  const en = tourStops(pathFor(stateOf()).path, { lang: 'en', goalMinutes: goal });
  assert.equal(en[0].title, 'Start here');
  assert.equal(en[0].text, 'Chapter 1, step 1. Tap the circle, then “Start”.');
  assert.equal(tourStops(pathFor(stateOf()).path, { lang: 'de' })[3].text, V2_STRINGS.de['tour.statsTextBare'], 'no goal → no number');

  // a returning learner: „Hier geht es weiter" at the next step, its Kapitel's banner
  const mid = pathFor(stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } })).path;
  const back = tourStops(mid, { lang: 'de' });
  assert.equal(back[0].title, 'Hier geht es weiter');
  assert.equal(back[0].text, 'Kapitel 1, Lernschritt 3. Tippen Sie auf den Kreis und dann auf „Start“.');
  assert.equal(tourBannerUnit(mid), 'a1.1-u01');
  // a Plateau is next: named, and the banner is the Modul's last Kapitel
  const done3 = Object.fromEntries(['a1.1-u01', 'a1.1-u02', 'a1.1-u03'].map((u) => [u, 'complete']));
  const plateau = pathFor(stateOf({ progress: done3 })).path;
  assert.equal(plateau.current.kind, 'plateau');
  assert.equal(tourStops(plateau, { lang: 'de' })[0].text, 'Plateau 1. Tippen Sie darauf und dann auf „Start“.');
  assert.equal(tourBannerUnit(plateau), 'a1.1-u03');
  // everything done: no „start" stop (the path ends in its finish card), the rest stays
  const everything = {
    ...Object.fromEntries(A11.units.map((u) => [u.unit, 'complete'])),
    'a1.1-p1': 'complete', 'a1.1-p2': 'complete', 'a1.1-p3': 'complete', 'a1.1-ht-sd1': 'complete',
  };
  const all = pathFor(stateOf({ progress: everything }));
  assert.ok(courseFinish(all.model), 'the course is finished');
  assert.deepEqual(tourStops(all.path, { lang: 'de' }).map((s) => s.key), ['banner', 'tabs', 'stats']);
  assert.deepEqual(tourStops(null), []);
});

// ---------------------------------------------------------------------------
// The path stays readable: the banner's second line, the stops' names, no label cards
// ---------------------------------------------------------------------------

test('the banner\'s quiet second line: where the Kapitel sits and how far the learner is, live', () => {
  const u = (state) => pathFor(state).path.sections[0].units[0];
  assert.equal(u(stateOf()).progressLine, `Kapitel 1 von ${A11.units.length} · 0 von 7 Lernschritten`);
  assert.equal(u(stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } })).progressLine, 'Kapitel 1 von 12 · 2 von 7 Lernschritten');
  assert.equal(u(stateOf({ progress: { 'a1.1-u01': 'complete' } })).progressLine, 'Kapitel 1 von 12 · 7 von 7 Lernschritten');
  const banner = read(`${HOME_DIR}/UnitBanner.jsx`);
  assert.match(banner, /\{unit\.progressLine\}/);
  assert.match(banner, /text-game-muted">\{unit\.progressLine\}/, 'muted ink on the page ground (white on a bright hue misses 4.5:1 at this size)');
  assert.match(banner, /data-tour=\{tourTarget \? 'banner' : undefined\}/);
});

test('the chest and the trophy carry their short names; the steps stay without labels', () => {
  const section = read(`${HOME_DIR}/PathSection.jsx`);
  assert.match(section, /caption=\{stop\.short\}/);
  assert.equal((section.match(/caption=/g) || []).length, 1, 'only the stop node gets a caption — no label cards come back');
  const node = read(`${HOME_DIR}/PathNode.jsx`);
  assert.match(node, /\{caption && \(\s*<span\s+aria-hidden="true"/, 'decorative: the button\'s name already says it');
  assert.match(section, /tour=\{node\.state === 'current' \? 'start' : null\}/);
  assert.match(section, /tour=\{stop\.state === 'current' \? 'start' : null\}/);
  assert.match(section, /tourBanner=\{unit\.id === bannerId\}/);
  assert.match(node, /data-tour=\{tour \|\| undefined\}/);
});

// ---------------------------------------------------------------------------
// The coach marks as a component, and the page's wiring
// ---------------------------------------------------------------------------

test('the coach marks are a real dialog: spotlight from the DOM, focus in and back, Escape, ≥ 44 px, motion-safe', () => {
  const tour = read(`${HOME_DIR}/CourseTour.jsx`);
  for (const part of [
    'role="dialog"', 'aria-modal="true"', 'aria-labelledby="dm-tour-label dm-tour-title"', 'aria-describedby="dm-tour-text"',
    '[data-tour="${name}"]', 'getBoundingClientRect()', "addEventListener('scroll'", "addEventListener('resize'",
    "scrollIntoView({ block: 'center'", "e.key === 'Escape'", "e.key !== 'Tab'", 'headRef.current.focus(', 'back.focus(',
    'motion-safe:animate-pop-in', "t('tour.skip')", "t('tour.next')", "t('tour.done')", "t('tour.stepOf'",
  ]) assert.ok(tour.includes(part), `the tour has ${part}`);
  assert.match(tour, /className="-ml-2 min-h-11 /, 'the quiet skip is ≥ 44 px');
  assert.match(tour, /className="min-h-12 rounded-clay bg-course /, 'the one primary button');
  assert.match(tour, /fill=\{courseGame\.text\}/, 'the dim\'s colour comes from design-tokens.js');
  assert.doesNotMatch(stripComments(tour), /animate-(?!pop-in)/, 'no other animation');
  // every stop the model can produce has a target on the page
  const targets = {
    start: `${HOME_DIR}/PathNode.jsx`,
    banner: `${HOME_DIR}/UnitBanner.jsx`,
    tabs: `${HOME_DIR}/TabBar.jsx`,
    stats: `${HOME_DIR}/TopBar.jsx`,
  };
  for (const t of TOUR_TARGETS) assert.ok(read(targets[t]).includes('data-tour'), `${t} has a data-tour target in ${targets[t]}`);
  assert.match(read(`${HOME_DIR}/TabBar.jsx`), /data-tour="tabs"/);
  assert.match(read(`${HOME_DIR}/TopBar.jsx`), /data-tour="stats"/);
});

test('the help button replays the structure screens, then the coach marks; the tour never covers the welcome or the sheet', () => {
  const top = read(`${HOME_DIR}/TopBar.jsx`);
  assert.match(top, /<HelpCircle /, 'lucide 0.294\'s name for the circle-help icon');
  assert.match(top, /aria-label=\{helpLabel\}/);
  assert.match(top, /h-11 w-11/, '44 px');
  const page = read(PAGE);
  assert.match(page, /onHelp=\{welcome\.replay\.length \? openHelp : null\}/);
  assert.match(page, /helpLabel=\{t\('tour\.help'\)\}/);
  assert.match(page, /<Welcome model=\{welcome\} only=\{welcome\.replay\} onDone=\{finishReplay\}[^>]*focusFirst lastLabel=\{t\('welcome\.next'\)\}/);
  assert.match(page, /afterScroll\.current = how === 'done' \? 'tour' : 'help';/, 'done → the coach marks; skipped → focus back on the help button');
  assert.match(page, /\{tourOpen && !sheetOpen && \(\s*<CourseTour/);
  assert.match(page, /if \(welcomeOpen\) \{[\s\S]*?<Welcome[\s\S]*?if \(replay\) \{/, 'the welcome and the replay render instead of the path, never under the tour');
  assert.match(page, /stops=\{tourStops\(path, \{ lang, goalMinutes \}\)\}/);
  assert.match(page, /returnFocus=\{\(\) => \(tourBack\.current === 'help' \? helpRef\.current : anchor && document\.getElementById\(anchor\)\)\}/);
  const welcome = read(`${HOME_DIR}/Welcome.jsx`);
  assert.match(welcome, /const screens = only && only\.length \? only : model\.screens;/);
  assert.match(welcome, /if \(\(at > 0 \|\| focusFirst\) && headRef\.current\) headRef\.current\.focus/, 'the replay\'s first heading takes focus');
});
