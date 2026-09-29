// Course v2 — the course home's learning path and course plan
// (src/lib/course-v2/pathModel.js, src/pages/course-v2/CourseHomeV2Page.jsx,
// src/components/course-v2/home/*). Owner decision 2026-09-29: a Duolingo-style
// path and a plan the learner sees before starting.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseHomeModel } from '../src/lib/course-v2/homeModel.js';
import { XP, dailyGoalMinutes } from '../src/lib/course-v2/gamify.js';
import {
  STEP_SKELETON, stepSkeleton, STEP_LABEL_DE, UNIT_HUES, hueFor, ZIGZAG, zigzagOffset, stepHref, stepMinutes,
  hasProgress, wordsLearned, currentStop, actionLabel, coursePath, courseTiles, examParts, planEtappen,
  PACE_NAME_DE, paceStorageKey, resolvePace, paceOptions, formatFinishDate, STEP_XP,
} from '../src/lib/course-v2/pathModel.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const manifestOf = (level) => JSON.parse(read(`src/data/course-v2/${level}/manifest.json`));

const A11 = manifestOf('a1.1');
const B11 = manifestOf('b1.1');
const ALL_STOPS = { plateaus: new Set([1, 2, 3]), closings: new Set(['a1.1-ht-sd1']) };

const stateOf = ({ finished = {}, progress = {} } = {}) => ({
  finishedSteps: new Map(Object.entries(finished).map(([u, ids]) => [u, new Set(ids)])),
  progress: new Map(Object.entries(progress).map(([u, status]) => [u, { lektion_id: u, status }])),
});
const steps = (unitId, nrs) => nrs.map((n) => `${unitId}-ls${n}`);
const allNodes = (path) => path.sections.flatMap((s) => s.units.flatMap((u) => u.nodes));
const pathFor = (manifest, state, stops = ALL_STOPS, opts = {}) => {
  const model = courseHomeModel(manifest, state, stops);
  return { model, path: coursePath(model, state, { etappenDe: manifest.showcase ? manifest.showcase.etappenDe : [], ...opts }) };
};

// ---------------------------------------------------------------------------
// The skeleton, hues and zig-zag
// ---------------------------------------------------------------------------

test('node kinds per level: A levels 7 steps, B levels 8 (ls7 Überarbeiten, ls8 Check)', () => {
  assert.deepEqual(stepSkeleton('a1.1').map((s) => s.kind), ['situation', 'situation', 'situation', 'pruefung', 'sprechen', 'schreiben', 'check']);
  assert.deepEqual(stepSkeleton('a1.1').map((s) => s.icon), ['Star', 'Star', 'Star', 'Target', 'Mic', 'PenLine', 'Crown']);
  assert.deepEqual(stepSkeleton('b2.2').map((s) => s.kind), ['situation', 'situation', 'situation', 'pruefung', 'sprechen', 'schreiben', 'ueberarbeiten', 'check']);
  assert.deepEqual(stepSkeleton('B1.1').map((s) => s.icon).slice(6), ['RefreshCw', 'Crown']);
  assert.equal(stepSkeleton('a2.2'), STEP_SKELETON.a);
  for (const s of [...STEP_SKELETON.a, ...STEP_SKELETON.b]) assert.ok(STEP_LABEL_DE[s.kind], `a label for ${s.kind}`);

  const { path } = pathFor(A11, stateOf());
  const u1 = path.sections[0].units[0];
  assert.equal(u1.nodes.length, 7);
  assert.deepEqual(u1.nodes.map((n) => n.id), steps('a1.1-u01', [1, 2, 3, 4, 5, 6, 7]));
  const b = pathFor(B11, stateOf(), { plateaus: new Set(), closings: new Set() }).path;
  const bUnit = b.sections.flatMap((s) => s.units).find((u) => u.available);
  assert.equal(bUnit.nodes.length, 8);
  assert.equal(bUnit.nodes[6].kind, 'ueberarbeiten');
  assert.equal(bUnit.stepsTotal, 8);
});

test('unit hues cycle grün → orange → beere → türkis by unit order, and the zig-zag mirrors per unit', () => {
  assert.deepEqual(UNIT_HUES, ['gruen', 'orange', 'beere', 'tuerkis']);
  assert.equal(hueFor(4), 'gruen');
  const { path } = pathFor(A11, stateOf());
  const units = path.sections.flatMap((s) => s.units);
  assert.deepEqual(units.map((u) => u.hue), Array.from({ length: 12 }, (_, i) => UNIT_HUES[i % 4]));
  assert.deepEqual(units[0].nodes.map((n) => n.offset), [0, 52, 76, 52, 0, -52, -76]);
  assert.deepEqual(units[1].nodes.map((n) => n.offset), [0, -52, -76, -52, 0, 52, 76]);
  assert.deepEqual(units.map((u) => u.direction).slice(0, 4), [1, -1, 1, -1]);
  assert.equal(ZIGZAG.length, 8);
  assert.ok(Object.is(zigzagOffset(0, -1), 0), 'no -0 offset');
});

// ---------------------------------------------------------------------------
// Statuses, the current node and the soft gate
// ---------------------------------------------------------------------------

test('statuses: finished steps are done, the first unfinished step of the next unit is current, the rest open', () => {
  const state = stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } });
  const { model, path } = pathFor(A11, state);
  const u1 = path.sections[0].units[0];
  assert.deepEqual(u1.nodes.map((n) => n.state), ['done', 'done', 'current', 'open', 'open', 'open', 'open']);
  assert.equal(u1.bannerLabel, 'Lektion 1 · 2 von 7 geschafft');
  assert.equal(u1.hasCurrent, true);
  assert.equal(allNodes(path).filter((n) => n.state === 'current').length, 1, 'exactly one current node');
  assert.deepEqual(path.current, { kind: 'step', unitId: 'a1.1-u01', unitNr: 1, stepNr: 3, stepId: 'a1.1-u01-ls3', href: '/course/a1.1/u/1?s=3' });
  assert.equal(actionLabel(path.current, model), 'Weiter: Lernschritt 3');
  assert.match(u1.nodes[0].ariaLabel, /^Lernschritt 1 von 7, Situation: geschafft$/);
  assert.match(u1.nodes[2].ariaLabel, /jetzt starten$/);
  assert.match(u1.nodes[3].ariaLabel, /^Lernschritt 4 von 7, Prüfungsteil: noch offen$/);
  assert.equal(path.sections[0].units[1].bannerLabel, 'Lektion 2');
});

test('a skipped step does not move the current node past it; a finished unit is all done', () => {
  // ls1 and ls3 finished (the learner opened ls3 from the path): ls2 is current
  const skip = pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 3]) } })).path;
  assert.deepEqual(skip.sections[0].units[0].nodes.map((n) => n.state), ['done', 'current', 'done', 'open', 'open', 'open', 'open']);
  // unit 1 complete (even without every marker) → all done, unit 2 step 1 is next
  const state = stateOf({ progress: { 'a1.1-u01': 'complete' } });
  const { model, path } = pathFor(A11, state);
  const [u1, u2] = path.sections[0].units;
  assert.ok(u1.nodes.every((n) => n.state === 'done'));
  assert.equal(u1.bannerLabel, 'Lektion 1 · geschafft');
  assert.equal(u2.nodes[0].state, 'current');
  assert.equal(actionLabel(path.current, model), 'Lektion 2 starten');
  // every step finished but the recap not stored → the unit itself, no ?s=
  const recap = pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2, 3, 4, 5, 6, 7]) } }));
  assert.deepEqual(recap.path.current, { kind: 'unit', unitId: 'a1.1-u01', unitNr: 1, href: '/course/a1.1/u/1' });
  assert.equal(actionLabel(recap.path.current, recap.model), 'Weiter mit Lektion 1');
});

test('the gate stays soft: every node of a compiled unit links to its step with ?s=', () => {
  const { path } = pathFor(A11, stateOf());
  const nodes = allNodes(path);
  assert.equal(nodes.length, 84);
  for (const n of nodes) {
    const [, unitNr] = n.id.match(/-u(\d\d)-/);
    assert.equal(n.href, `/course/a1.1/u/${Number(unitNr)}?s=${n.stepNr}`);
  }
  assert.ok(nodes.filter((n) => n.state === 'open').every((n) => n.href), 'open nodes still open');
  assert.equal(stepHref('A1.1', 7, 4), '/course/a1.1/u/7?s=4');
  assert.equal(path.current.href, '/course/a1.1/u/1?s=1', 'first visit: the first step');
});

test('a unit without compiled content has no nodes and no link; it says „kommt bald"', () => {
  const { path } = pathFor(B11, stateOf(), { plateaus: new Set(), closings: new Set() });
  const units = path.sections.flatMap((s) => s.units);
  const missing = units.filter((u) => !u.available);
  assert.ok(missing.length > 0);
  for (const u of missing) {
    assert.deepEqual(u.nodes, []);
    assert.match(u.bannerLabel, /· kommt bald$/);
  }
  for (const s of path.sections) assert.equal(s.stop.state, 'unavailable');
  assert.ok(path.sections.every((s) => s.stop.href === null));
  assert.ok(path.sections.every((s) => s.dividerLabel === `Etappe ${s.nr}`), 'no showcase → bare Etappe dividers');
});

// ---------------------------------------------------------------------------
// Plateau chests and the closing trophy
// ---------------------------------------------------------------------------

test('each Etappe ends in a treasure chest (Plateau) or the closing test, linked, soft-gated', () => {
  const { path } = pathFor(A11, stateOf());
  assert.deepEqual(path.sections.map((s) => s.dividerLabel), [
    'Etappe 1 · Ankommen in Leipzig', 'Etappe 2 · Einkaufen und Wohnen', 'Etappe 3 · Alltag und Freizeit', 'Etappe 4 · Unterwegs und Pläne',
  ]);
  assert.deepEqual(path.sections.map((s) => s.stop.label), [
    'Wiederholung 1 · Schatzkiste', 'Wiederholung 2 · Schatzkiste', 'Wiederholung 3 · Schatzkiste', 'Abschlusstest',
  ]);
  assert.deepEqual(path.sections.map((s) => s.stop.href), ['/course/a1.1/p/1', '/course/a1.1/p/2', '/course/a1.1/p/3', '/course/a1.1/abschluss']);
  assert.ok(path.sections.every((s) => s.stop.state === 'open'), 'not ready still opens');
  const notCompiled = pathFor(A11, stateOf(), { plateaus: new Set([1]), closings: new Set() }).path;
  assert.deepEqual(notCompiled.sections.map((s) => s.stop.state), ['open', 'unavailable', 'unavailable', 'unavailable']);
  assert.equal(notCompiled.sections[1].stop.href, null);
});

test('once an Etappe\'s units are done its chest is the current stop; then the closing test', () => {
  const doneE1 = { 'a1.1-u01': 'complete', 'a1.1-u02': 'gold', 'a1.1-u03': 'complete' };
  const { model, path } = pathFor(A11, stateOf({ progress: doneE1 }));
  assert.equal(path.sections[0].stop.state, 'current');
  assert.equal(path.current.kind, 'plateau');
  assert.equal(path.current.href, '/course/a1.1/p/1');
  assert.equal(actionLabel(path.current, model), 'Wiederholung 1 starten');
  assert.equal(allNodes(path).filter((n) => n.state === 'current').length, 0, 'no step node is current then');

  const everything = Object.fromEntries(A11.units.map((u) => [u.unit, 'complete']));
  Object.assign(everything, { 'a1.1-p1': 'complete', 'a1.1-p2': 'complete', 'a1.1-p3': 'complete' });
  const last = pathFor(A11, stateOf({ progress: everything }));
  assert.equal(last.path.current.kind, 'closing');
  assert.equal(actionLabel(last.path.current, last.model), 'Abschlusstest starten');
  assert.deepEqual(last.path.sections.slice(0, 3).map((s) => s.stop.state), ['done', 'done', 'done']);
  const finished = pathFor(A11, stateOf({ progress: { ...everything, 'a1.1-ht-sd1': 'complete' } }));
  assert.equal(finished.path.current, null);
  assert.equal(actionLabel(null, finished.model), '');
});

// ---------------------------------------------------------------------------
// First visit vs returning, words, the step card
// ---------------------------------------------------------------------------

test('first visit = nothing finished in the level; words learned = new words of finished units', () => {
  assert.equal(hasProgress({}), false);
  assert.equal(hasProgress(stateOf()), false);
  assert.equal(hasProgress(stateOf({ progress: { 'a1.1-u01': 'started' } })), false, 'opening a unit is not finishing a step');
  assert.equal(hasProgress(stateOf({ finished: { 'a1.1-u01': ['a1.1-u01-ls1'] } })), true);
  assert.equal(hasProgress(stateOf({ progress: { 'a1.1-u01': 'tested_out' } })), true);

  const state = stateOf({ progress: { 'a1.1-u01': 'complete', 'a1.1-u02': 'tested_out', 'a1.1-u03': 'started' } });
  const model = courseHomeModel(A11, state, ALL_STOPS);
  const byId = Object.fromEntries(A11.units.map((u) => [u.unit, u.counts.newWords]));
  assert.equal(wordsLearned(A11, model), byId['a1.1-u01'] + byId['a1.1-u02']);
  assert.equal(wordsLearned(A11, courseHomeModel(A11, stateOf(), ALL_STOPS)), 0);
});

test('the current card: step title from the loaded chunk, minutes from the plan, XP from gamify', () => {
  const titles = { 'a1.1-u01-ls1': 'Ich bin Priya. Und Sie?' };
  const { path } = pathFor(A11, stateOf(), ALL_STOPS, { stepTitles: titles });
  const n = path.sections[0].units[0].nodes[0];
  assert.equal(n.title, 'Ich bin Priya. Und Sie?');
  assert.match(n.ariaLabel, /Ich bin Priya\. Und Sie\?: jetzt starten$/);
  assert.equal(path.sections[0].units[0].nodes[1].title, null, 'no title → the skeleton label');
  assert.equal(path.sections[0].units[0].minutesPerStep, 20, '135 planned minutes over 7 steps ≈ 20');
  assert.equal(stepMinutes(177, 8), 20);
  assert.equal(stepMinutes(null, 7), null);
  assert.equal(STEP_XP, XP.step, 'the popover shows the XP the ledger actually awards');
  assert.equal(currentStop(null), null);
});

// ---------------------------------------------------------------------------
// The course plan
// ---------------------------------------------------------------------------

test('„Das steckt im Kurs": manifest content counts only, hidden while units are still coming', () => {
  const tiles = courseTiles(A11);
  const n = Object.fromEntries(tiles.map((t) => [t.key, t.n]));
  assert.deepEqual(n, {
    units: A11.counts.units,
    lernschritte: A11.counts.lernschritte,
    items: A11.counts.items,
    newWords: A11.counts.newWords,
    speaking: A11.counts.inCourse.speakingTasks,
    writing: A11.counts.inCourse.writingTasks,
    audio: A11.counts.audioLines,
    closing: A11.counts.closingBlocks,
  });
  assert.equal(tiles.find((t) => t.key === 'closing').lane, 'sd1');
  assert.deepEqual(courseTiles(B11), [], 'b1.1 has units coming: its counts describe a fraction');
  const partial = { ...A11, counts: { ...A11.counts, audioLines: undefined, inCourse: undefined } };
  assert.deepEqual(courseTiles(partial).map((t) => t.key), ['units', 'lernschritte', 'items', 'newWords', 'closing'], 'a missing number hides its tile');
  assert.deepEqual(courseTiles({}), []);
  for (const t of tiles) assert.doesNotMatch(t.label, /Lernende|Nutzer|Teilnehmer|learners|users/i, 'no usage counts');
});

test('the plan: exam parts from the Prüfungsfokus, Etappen from the showcase, the closing as a trophy', () => {
  assert.deepEqual(examParts(A11), ['Hören', 'Lesen', 'Schreiben', 'Sprechen']);
  assert.deepEqual(examParts({}), []);
  const model = courseHomeModel(A11, stateOf({ progress: { 'a1.1-u01': 'complete' } }), ALL_STOPS);
  const etappen = planEtappen(model, A11);
  assert.deepEqual(etappen.map((e) => e.title), A11.showcase.etappenDe);
  assert.deepEqual(etappen[0].units.map((u) => u.title), ['Hallo, ich bin Priya', 'Wie schreibt man das?', 'Meine Familie']);
  assert.equal(etappen[0].units[0].done, true);
  assert.equal(etappen[0].units[0].href, '/course/a1.1/u/1');
  assert.deepEqual(etappen.map((e) => e.end.label), [
    'Wiederholung 1 · Schatzkiste', 'Wiederholung 2 · Schatzkiste', 'Wiederholung 3 · Schatzkiste', 'Abschlusstest · Pokal',
  ]);
  const bare = planEtappen(courseHomeModel(B11, stateOf()), B11);
  assert.equal(bare[0].title, 'Etappe 1', 'no showcase → a plain Etappe title');
});

test('pace: page pick > learner_goals > this device > default; minutes and weeks from the presets', () => {
  assert.equal(paceStorageKey('A1.1'), 'dm_course_v2_pace:a1.1');
  assert.equal(resolvePace(A11, {}), 'standard');
  assert.equal(resolvePace(A11, { storedPace: 'leicht' }), 'leicht');
  assert.equal(resolvePace(A11, { storedPace: 'leicht', goalPace: 'intensiv' }), 'intensiv', 'the signed-in learner_goals pace wins over the device');
  assert.equal(resolvePace(A11, { storedPace: 'leicht', goalPace: 'intensiv', picked: 'standard' }), 'standard', 'a pick on the page shows at once');
  assert.equal(resolvePace(A11, { storedPace: 'turbo' }), 'standard', 'an unknown preset is ignored');

  const today = new Date(2026, 8, 29, 12);
  const opts = paceOptions(A11, { remainingSteps: 84, today });
  assert.deepEqual(opts.map((o) => o.id), ['leicht', 'standard', 'intensiv']);
  assert.deepEqual(opts.map((o) => o.name), ['leicht', 'standard', 'intensiv'].map((p) => PACE_NAME_DE[p]));
  assert.deepEqual(opts.map((o) => o.minutes), ['leicht', 'standard', 'intensiv'].map((p) => dailyGoalMinutes(A11, p)));
  assert.deepEqual(opts.map((o) => o.learningDays), [3, 4, 6]);
  assert.deepEqual(opts.map((o) => o.weeks), [21, 12, 6]);
  assert.equal(formatFinishDate(opts[1].finishDate, today), '22. Dezember');
  assert.equal(formatFinishDate(opts[0].finishDate, today), '23. Februar 2027', 'another year carries the year');
  assert.equal(formatFinishDate('nonsense', today), '');
});

// ---------------------------------------------------------------------------
// Source guards: theme, tokens, register, honesty
// ---------------------------------------------------------------------------

const HOME_DIR = 'src/components/course-v2/home';
const HOME_FILES = readdirSync(join(ROOT, HOME_DIR)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${HOME_DIR}/${f}`);
const PAGE = 'src/pages/course-v2/CourseHomeV2Page.jsx';
const OWNED = [PAGE, 'src/lib/course-v2/pathModel.js', ...HOME_FILES];

// the same du-register list as tests/course-player.test.mjs
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

test('the course home renders inside the course theme and draws every node from the path model', () => {
  const page = read(PAGE);
  assert.match(page, /import CourseTheme from '\.\.\/\.\.\/components\/course-v2\/CourseTheme\.jsx'/);
  assert.match(page, /<CourseTheme>[\s\S]*<TopBar[\s\S]*<PathSection[\s\S]*<\/CourseTheme>/);
  assert.match(page, /coursePath\(model, state/);
  assert.match(page, /safeSet\(paceStorageKey\(level\), p\)/, 'the pace pick is stored through safeStorage');
  assert.match(page, /<ActionBar>\s*<GameButton to=\{current\.href\}/, 'the thumb-zone action goes to the current step');
  assert.ok(HOME_FILES.length >= 8, 'the home is split into small components');
});

test('the course home writes only tokens: no hex literal, no raw Tailwind palette class, no built class names', () => {
  for (const f of OWNED) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour outside design-tokens.js`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|shadow|from|to|ring)-(?:amber|rose|red|green|blue|gray|slate|orange|pink|emerald|yellow|teal)-\d/, `${f}: a raw Tailwind palette class`);
    assert.doesNotMatch(src, /(?:bg|text|border|shadow)-\$\{/, `${f}: a class name built by concatenation (Tailwind JIT cannot see it)`);
  }
});

test('the course home speaks Sie and promises no result', () => {
  const offenders = [];
  for (const f of OWNED) {
    read(f).split('\n').forEach((line, i) => {
      if (DU_TOKENS.test(line) || /\bdein/i.test(line)) offenders.push(`${f}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `du-register on the course home:\n${offenders.join('\n')}`);
  for (const f of OWNED) {
    const src = read(f);
    assert.doesNotMatch(src, /garantiert|Erfolgsquote|sicher bestehen|bestehen Sie|Sie bestehen|\d+\s*%\s*(?:bestehen|Erfolg)/i, `${f}: no exam-outcome promise`);
    assert.doesNotMatch(src, /\d[\d.,]*\s*(?:Lernende|Nutzer|Teilnehmer)/, `${f}: no usage counts`);
  }
});
