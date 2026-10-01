// Course v2 — the course home's learning path and course plan
// (src/lib/course-v2/pathModel.js, src/pages/course-v2/CourseHomeV2Page.jsx,
// src/components/course-v2/home/*). Owner decisions 2026-09-29: a Duolingo-style
// path and a plan the learner sees before starting — then „make it a CURRICULUM like
// the textbooks: Kapitel, and in every Kapitel grammar, listening, reading, questions
// visible". The home speaks the Lehrwerk's language: Kapitel, Modul, Plateau,
// Abschlusstest; each step says what it teaches; the plan is a textbook „Inhalt".
// Round 3 (2026-09-30: "it looks intimidating and too much … duolingo style … step for
// step"): the home became Duolingo's learn screen — a short welcome on a first
// visit, big round nodes with a popover per node, a tab bar, and the plan one tap deep
// in the „Kursplan" sheet. The pins at the bottom describe that screen. Since 2026-10-01
// ("still no clear structure for the user as an introduction, tour") the welcome has six
// screens (three explain the structure) and coach marks follow it — pinned here where they
// touch the welcome, and in full in tests/course-v2-tour.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { courseHomeModel } from '../src/lib/course-v2/homeModel.js';
import { XP, dailyGoalMinutes } from '../src/lib/course-v2/gamify.js';
import { SKILL_ORDER, chapterSummary } from '../src/lib/course-v2/curriculum.js';
import {
  STEP_SKELETON, stepSkeleton, STEP_LABEL_DE, NODE_ICON, UNIT_HUES, hueFor, ZIGZAG, zigzagOffset, stepHref, stepMinutes,
  hasProgress, wordsLearned, currentStop, actionLabel, coursePath, courseTiles, examParts, planInhalt, kapitelAufbau,
  referenceLinks, stepLabel, groupTeile, teilSummary, kapitelSummary, kommunikationOf, shortLabel, unitSections,
  PACE_NAME_DE, paceStorageKey, resolvePace, paceOptions, formatFinishDate, STEP_XP,
  guideHref, nodeAnchor, currentAnchor, placeholderNodes, stepOfLine, nodePopover, stopPopover, finishNode, unitPercent,
  goalRing, welcomeStorageKey, showWelcome, shortPromise, outcomeLine, spreadOutcomes, courseShape, welcomeModel, paceTile, DATE_LOCALE,
  courseFinish, nextLevelCode, FINISH_ANCHOR,
} from '../src/lib/course-v2/pathModel.js';
import { V2_STRINGS, tv } from '../src/components/course-v2/strings.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const manifestOf = (level) => JSON.parse(read(`src/data/course-v2/${level}/manifest.json`));

const A11 = manifestOf('a1.1');
const B11 = manifestOf('b1.1');
const ALL_STOPS = { plateaus: new Set([1, 2, 3]), closings: new Set(['a1.1-ht-sd1']) };
const NO_STOPS = { plateaus: new Set(), closings: new Set() };

const stateOf = ({ finished = {}, progress = {} } = {}) => ({
  finishedSteps: new Map(Object.entries(finished).map(([u, ids]) => [u, new Set(ids)])),
  progress: new Map(Object.entries(progress).map(([u, status]) => [u, { lektion_id: u, status }])),
});
const steps = (unitId, nrs) => nrs.map((n) => `${unitId}-ls${n}`);
const allNodes = (path) => path.sections.flatMap((s) => s.units.flatMap((u) => u.nodes));
const pathFor = (manifest, state, stops = ALL_STOPS, opts = {}) => {
  const model = courseHomeModel(manifest, state, stops);
  return { model, path: coursePath(model, state, { etappenDe: manifest.showcase ? manifest.showcase.etappenDe : [], manifest, ...opts }) };
};
const rowOf = (manifest, id) => manifest.units.find((u) => u.unit === id);

// ---------------------------------------------------------------------------
// The steps of a Kapitel: the outline, its letters, labels, grammar and skills
// ---------------------------------------------------------------------------

test('a Kapitel\'s nodes are its outline: A, B, C, Prüfungstraining, Sprechen, Schreiben (Überarbeiten), Kapiteltest', () => {
  const { path } = pathFor(A11, stateOf());
  const u1 = path.sections[0].units[0];
  assert.equal(u1.nodes.length, 7);
  assert.deepEqual(u1.nodes.map((n) => n.id), steps('a1.1-u01', [1, 2, 3, 4, 5, 6, 7]));
  assert.deepEqual(u1.nodes.map((n) => n.kind), rowOf(A11, 'a1.1-u01').outline.map((s) => s.kind));
  assert.deepEqual(u1.nodes.map((n) => n.letter), ['A', 'B', 'C', null, null, null, null]);
  assert.deepEqual(u1.nodes.map((n) => n.icon), ['Star', 'Star', 'Star', 'Target', 'Mic', 'PenLine', 'Crown']);
  assert.deepEqual(u1.nodes.map((n) => n.label), [
    'A · Ich bin Priya. Und Sie?',
    'B · Woher kommst du?',
    'C · Der Chat vom Kurs A1',
    'Prüfungstraining · Hören Teil 1',
    'Sprechen · Teil 1 + 2 mit KI',
    'Schreiben · Teil 1 mit KI-Korrektur',
    'Kapiteltest',
  ]);
  assert.deepEqual(u1.nodes.map((n) => n.tag), ['Teil A', 'Teil B', 'Teil C', 'Prüfungstraining', 'Sprechen', 'Schreiben', 'Kapiteltest']);
  assert.deepEqual(u1.nodes.map((n) => n.grammar), ['Präsens', 'Aussagesatz und W-Frage', 'Präsens', null, null, null, null]);
  assert.deepEqual(u1.nodes[0].skills, ['wortschatz', 'hoeren', 'grammatik', 'ueben', 'sprechen', 'aussprache']);
  assert.deepEqual(u1.nodes[2].skills.slice(0, 2), ['wortschatz', 'lesen'], 'Teil C is a reading');

  // every node of the level carries a label and the skills of its outline step, in SKILL_ORDER;
  // every situation step of A1.1 names its grammar
  const nodes = allNodes(path);
  assert.equal(nodes.length, 84);
  for (const n of nodes) {
    assert.ok(n.label && n.tag, `${n.id}: a label`);
    const [unitId] = n.id.split('-ls');
    const step = rowOf(A11, unitId).outline[n.stepNr - 1];
    assert.deepEqual(n.skills, SKILL_ORDER.filter((k) => step.skills.includes(k)), `${n.id}: the outline's skills`);
    if (n.letter) {
      assert.equal(n.title, step.title, `${n.id}: the outline's title`);
      assert.equal(n.grammar, step.grammar.short, `${n.id}: the outline's grammar`);
    }
  }
  assert.equal(nodes.filter((n) => n.letter).length, 36);
});

test('B levels: 8 steps with Überarbeiten; „Text A:" prefixes are dropped, a nameless step gets a name', () => {
  assert.deepEqual(stepSkeleton('b2.2').map((s) => s.kind), ['situation', 'situation', 'situation', 'pruefung', 'sprechen', 'schreiben', 'ueberarbeiten', 'check']);
  assert.deepEqual(stepSkeleton('a1.1').map((s) => s.kind), ['situation', 'situation', 'situation', 'pruefung', 'sprechen', 'schreiben', 'check']);
  assert.equal(stepSkeleton('a2.2'), STEP_SKELETON.a);
  for (const s of [...STEP_SKELETON.a, ...STEP_SKELETON.b]) {
    assert.ok(STEP_LABEL_DE[s.kind], `a label for ${s.kind}`);
    assert.ok(NODE_ICON[s.kind], `an icon for ${s.kind}`);
  }
  const { path } = pathFor(B11, stateOf(), NO_STOPS);
  const u4 = path.sections.flatMap((s) => s.units).find((u) => u.available);
  assert.equal(u4.id, 'b1.1-u04');
  assert.equal(u4.stepsTotal, 8);
  assert.deepEqual(u4.nodes.map((n) => n.label), [
    'A · Rückgabe und Garantie im Onlineshop',
    'B · In der Warteschleife',
    'C · Sprache im Fokus',
    'Prüfungstraining · Sprachbausteine Teil 1 + Hörverstehen Teil 3',
    'Sprechen · Mündlicher Ausdruck Teil 2 mit KI',
    'Schreiben · Schriftlicher Ausdruck mit KI-Korrektur',
    'Überarbeiten · Ihren Text verbessern',
    'Kapiteltest',
  ]);
  assert.equal(u4.nodes[6].icon, 'RefreshCw');
  assert.deepEqual(u4.summary.grammar, ['obwohl'], 'no grammar in the outline → the grammar the spec plans');
});

test('exam Teile read like a Lehrwerk: grouped by module, the section\'s own name dropped', () => {
  assert.deepEqual(groupTeile(['Sprechen Teil 1', 'Sprechen Teil 2', 'Schreiben Teil 1']), ['Sprechen Teil 1 + 2', 'Schreiben Teil 1']);
  assert.deepEqual(groupTeile(['Lesen Teil 2', 'Lesen Teil 1']), ['Lesen Teil 1 + 2'], 'numbers in order');
  assert.deepEqual(groupTeile(['Sprechen Teil 1', 'Sprechen Teil 3'], 'Sprechen'), ['Teil 1 + 3']);
  assert.deepEqual(groupTeile(['Schriftlicher Ausdruck', 'Schriftlicher Ausdruck']), ['Schriftlicher Ausdruck']);
  assert.equal(teilSummary(['sd1.sp1', 'sd1.sp2'], 'Sprechen'), 'Teil 1 + 2');
  assert.equal(teilSummary(['tb1.sb1', 'tb1.hv3'], 'Prüfungstraining'), 'Sprachbausteine Teil 1 + Hörverstehen Teil 3');
  assert.equal(teilSummary([], 'Sprechen'), '');
  assert.deepEqual(stepLabel({ kind: 'sprechen', teile: [] }), { tag: 'Sprechen', title: 'Aufgabe mit KI', label: 'Sprechen · Aufgabe mit KI' });
  assert.deepEqual(stepLabel({ kind: 'check', teile: [] }), { tag: 'Kapiteltest', title: null, label: 'Kapiteltest' });
  assert.equal(stepLabel({ kind: 'text', letter: 'A', title: 'Text A: Im Onlineshop' }).label, 'A · Im Onlineshop');
  assert.equal(shortLabel('Präsens: regelmäßige Verben (ich wohne)'), 'Präsens');
});

test('a row without an outline falls back to the skeleton, named by the loaded chunk', () => {
  const bare = { ...A11, units: A11.units.map((u) => (u.unit === 'a1.1-u01' ? { ...u, outline: undefined } : u)) };
  const titles = { 'a1.1-u01-ls1': 'Ich bin Priya. Und Sie?' };
  const { path } = pathFor(bare, stateOf(), ALL_STOPS, { stepTitles: titles });
  const u1 = path.sections[0].units[0];
  assert.deepEqual(u1.nodes.map((n) => n.letter), ['A', 'B', 'C', null, null, null, null]);
  assert.equal(u1.nodes[0].label, 'A · Ich bin Priya. Und Sie?');
  assert.equal(u1.nodes[1].label, 'B · Situation', 'no title anywhere → the kind');
  assert.equal(u1.nodes[3].label, 'Prüfungstraining');
  assert.deepEqual(u1.summary.grammar, ['Aussagesatz und W-Frage', 'Präsens'], 'the spec grammar, shortened');
  assert.equal(unitSections('a1.1-u01', 'a1.1', { row: rowOf(A11, 'a1.1-u01') }).length, 7);
});

// ---------------------------------------------------------------------------
// The Kapitel banner, hues and the wave
// ---------------------------------------------------------------------------

test('each Kapitel banner opens the Kapitel page and says what the Kapitel teaches', () => {
  const { path } = pathFor(A11, stateOf());
  const units = path.sections.flatMap((s) => s.units);
  assert.deepEqual(units.map((u) => u.href), A11.units.map((u) => `/course/a1.1/u/${u.nr}`));
  const u1 = units[0];
  assert.equal(u1.bannerLabel, 'Kapitel 1');
  assert.equal(u1.summary.line, 'Grammatik: Präsens · Aussagesatz und W-Frage · 35 neue Wörter');
  assert.equal(u1.summary.newWords, rowOf(A11, 'a1.1-u01').counts.newWords, 'the word count is the manifest\'s');
  assert.match(u1.bannerAria, /^Kapitelübersicht: Kapitel 1, Hallo, ich bin Priya$/);
  // the banner's book button: the Kapitel guide, one tap deep; its eyebrow names the Modul
  assert.deepEqual(units.map((u) => u.guideHref), A11.units.map((u) => `/course/a1.1/u/${u.nr}?view=guide`));
  assert.equal(guideHref('A1.1', 7), '/course/a1.1/u/7?view=guide');
  assert.deepEqual(units.slice(0, 4).map((u) => u.eyebrow), ['Modul 1 · Kapitel 1', 'Modul 1 · Kapitel 2', 'Modul 1 · Kapitel 3', 'Modul 2 · Kapitel 4']);
  for (const u of units) {
    assert.deepEqual(u.summary.grammar, chapterSummary(rowOf(A11, u.id).outline).grammar.map((g) => g.short));
    assert.match(u.summary.line, /^Grammatik: .+ · \d+ neue Wörter$/);
  }
  assert.deepEqual(kapitelSummary(null), { grammar: [], newWords: null, line: null });
});

test('Kapitel hues cycle türkis (the live palette) → orange → beere → grün, and the zig-zag mirrors per Kapitel', () => {
  assert.deepEqual(UNIT_HUES, ['tuerkis', 'orange', 'beere', 'gruen']);
  assert.equal(hueFor(4), 'tuerkis');
  const { path } = pathFor(A11, stateOf());
  const units = path.sections.flatMap((s) => s.units);
  assert.deepEqual(units.map((u) => u.hue), Array.from({ length: 12 }, (_, i) => UNIT_HUES[i % 4]));
  assert.deepEqual(units[0].nodes.map((n) => n.offset), [0, 44, 70, 44, 0, -44, -70]);
  assert.deepEqual(units[1].nodes.map((n) => n.offset), [0, -44, -70, -44, 0, 44, 70]);
  assert.deepEqual(units.map((u) => u.direction).slice(0, 4), [1, -1, 1, -1]);
  assert.equal(ZIGZAG.length, 8);
  assert.deepEqual(ZIGZAG.map((x, i) => x + ZIGZAG[(i + 4) % 8]), Array(8).fill(0), 'the wave is symmetric about the centre');
  // Duolingo's wide swing — no label sits beside the nodes any more — yet the widest node
  // (72 px) and the START bubble over it (≈ 90 px) stay inside a 360 px phone's 16 px gutters
  const half = (360 - 2 * 16) / 2;
  assert.ok(ZIGZAG.some((x) => Math.abs(x) >= 40), 'a real zig-zag, not a wobble');
  assert.ok(ZIGZAG.every((x) => Math.abs(x) + 45 <= half), 'the widest swing fits a 360 px phone');
  assert.ok(Object.is(zigzagOffset(0, -1), 0), 'no -0 offset');
});

// ---------------------------------------------------------------------------
// Statuses, the current node and the soft gate
// ---------------------------------------------------------------------------

test('statuses: finished steps are done, the first unfinished step of the next Kapitel is current, the rest open', () => {
  const state = stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } });
  const { model, path } = pathFor(A11, state);
  const u1 = path.sections[0].units[0];
  assert.deepEqual(u1.nodes.map((n) => n.state), ['done', 'done', 'current', 'open', 'open', 'open', 'open']);
  assert.equal(u1.bannerLabel, 'Kapitel 1 · 2 von 7 geschafft');
  assert.match(u1.bannerAria, /^Kapitelübersicht: Kapitel 1 · 2 von 7 geschafft, Hallo, ich bin Priya$/);
  assert.equal(u1.hasCurrent, true);
  assert.equal(allNodes(path).filter((n) => n.state === 'current').length, 1, 'exactly one current node');
  assert.deepEqual(path.current, {
    kind: 'step', unitId: 'a1.1-u01', unitNr: 1, stepNr: 3, stepId: 'a1.1-u01-ls3', href: '/course/a1.1/u/1?s=3', letter: 'C', tag: 'Teil C',
  });
  assert.equal(actionLabel(path.current, model), 'Weiter: Kapitel 1, Teil C');
  assert.equal(u1.nodes[0].ariaLabel, 'Kapitel 1, Teil A: Ich bin Priya. Und Sie? Grammatik: Präsens. Geschafft.');
  assert.equal(u1.nodes[2].ariaLabel, 'Kapitel 1, Teil C: Der Chat vom Kurs A1. Grammatik: Präsens. Jetzt starten.');
  assert.equal(u1.nodes[3].ariaLabel, 'Kapitel 1, Prüfungstraining: Hören Teil 1. Noch offen.');
  assert.equal(u1.nodes[6].ariaLabel, 'Kapitel 1, Kapiteltest. Noch offen.');
  assert.equal(path.sections[0].units[1].bannerLabel, 'Kapitel 2');

  // a named step as the current one: „Weiter: Kapitel 1, Prüfungstraining"
  const at4 = pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2, 3]) } }));
  assert.equal(actionLabel(at4.path.current, at4.model), 'Weiter: Kapitel 1, Prüfungstraining');
  assert.equal(currentStop(at4.model, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2, 3]) } })).tag, 'Prüfungstraining', 'without a manifest the skeleton still names it');
});

test('a skipped step does not move the current node past it; a finished Kapitel is all done', () => {
  // ls1 and ls3 finished (the learner opened ls3 from the path): ls2 is current
  const skip = pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 3]) } }));
  assert.deepEqual(skip.path.sections[0].units[0].nodes.map((n) => n.state), ['done', 'current', 'done', 'open', 'open', 'open', 'open']);
  assert.equal(actionLabel(skip.path.current, skip.model), 'Weiter: Kapitel 1, Teil B');
  // unit 1 complete (even without every marker) → all done, unit 2 step 1 is next
  const state = stateOf({ progress: { 'a1.1-u01': 'complete' } });
  const { model, path } = pathFor(A11, state);
  const [u1, u2] = path.sections[0].units;
  assert.ok(u1.nodes.every((n) => n.state === 'done'));
  assert.equal(u1.bannerLabel, 'Kapitel 1 · geschafft');
  assert.equal(u2.nodes[0].state, 'current');
  assert.equal(actionLabel(path.current, model), 'Kapitel 2 starten');
  // every step finished but the recap not stored → the unit itself, no ?s=
  const recap = pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2, 3, 4, 5, 6, 7]) } }));
  assert.deepEqual(recap.path.current, { kind: 'unit', unitId: 'a1.1-u01', unitNr: 1, href: '/course/a1.1/u/1' });
  assert.equal(actionLabel(recap.path.current, recap.model), 'Weiter mit Kapitel 1');
});

test('the gate stays soft: every node of a compiled Kapitel links to its step with ?s=', () => {
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

test('a Kapitel without compiled content has no nodes and no link; it says „kommt bald"', () => {
  const { path } = pathFor(B11, stateOf(), NO_STOPS);
  const units = path.sections.flatMap((s) => s.units);
  const missing = units.filter((u) => !u.available);
  assert.ok(missing.length > 0);
  for (const u of missing) {
    assert.deepEqual(u.nodes, []);
    assert.equal(u.href, null);
    assert.equal(u.guideHref, null, 'no book button before the Kapitel is compiled');
    assert.match(u.bannerLabel, /^Kapitel \d+ · kommt bald$/);
    // grey stand-ins in the wave, never a link, their popover „Kommt bald" without a button
    assert.equal(u.placeholders.length, 8, 'the B skeleton');
    assert.ok(u.placeholders.every((n) => n.state === 'soon' && n.href === null));
    assert.deepEqual(u.placeholders.map((n) => n.offset), placeholderNodes('b1.1', u.nr, u.direction).map((n) => n.offset));
    const pop = nodePopover(u.placeholders[0], { stepsTotal: 8, unitNr: u.nr });
    assert.deepEqual(pop, { title: 'Kommt bald', meta: `Kapitel ${u.nr} ist noch in Arbeit.`, action: null, href: null, tone: 'soon' });
  }
  assert.ok(units.filter((u) => u.available).every((u) => u.placeholders.length === 0));
  assert.deepEqual(missing[0].summary.grammar, ['Präteritum regelmäßiger und unregelmäßiger Verben', 'Adjektive als Nomen'], 'the planned grammar still shows');
  assert.equal(missing[0].summary.newWords, null, 'no word count before the Kapitel is authored');
  for (const s of path.sections) assert.equal(s.stop.state, 'unavailable');
  assert.ok(path.sections.every((s) => s.stop.href === null));
  assert.ok(path.sections.every((s) => s.dividerLabel === `Modul ${s.nr}`), 'no showcase → bare Modul dividers');
});

// ---------------------------------------------------------------------------
// Plateau chests and the Abschlusstest trophy
// ---------------------------------------------------------------------------

test('each Modul ends in a Plateau (chest) or the Abschlusstest (trophy), linked, soft-gated', () => {
  const { path } = pathFor(A11, stateOf());
  assert.deepEqual(path.sections.map((s) => s.dividerLabel), [
    'Modul 1 · Ankommen in Leipzig', 'Modul 2 · Einkaufen und Wohnen', 'Modul 3 · Alltag und Freizeit', 'Modul 4 · Unterwegs und Pläne',
  ]);
  assert.deepEqual(path.sections.map((s) => s.stop.label), [
    'Plateau 1 · Wiederholung', 'Plateau 2 · Wiederholung', 'Plateau 3 · Wiederholung', 'Abschlusstest',
  ]);
  assert.deepEqual(path.sections.map((s) => s.stop.detail), [
    'Kapitel 1–3 wiederholen · Prüfungsteile', 'Kapitel 4–6 wiederholen · Prüfungsteile', 'Kapitel 7–9 wiederholen · Prüfungsteile', 'Alle Prüfungsteile im Kleinen',
  ]);
  assert.deepEqual(path.sections.map((s) => s.stop.href), ['/course/a1.1/p/1', '/course/a1.1/p/2', '/course/a1.1/p/3', '/course/a1.1/abschluss']);
  assert.ok(path.sections.every((s) => s.stop.state === 'open'), 'not ready still opens');
  assert.equal(path.sections[0].stop.ariaLabel, 'Plateau 1 · Wiederholung: noch offen');
  const notCompiled = pathFor(A11, stateOf(), { plateaus: new Set([1]), closings: new Set() }).path;
  assert.deepEqual(notCompiled.sections.map((s) => s.stop.state), ['open', 'unavailable', 'unavailable', 'unavailable']);
  assert.equal(notCompiled.sections[1].stop.href, null);
});

test('once a Modul\'s Kapitel are done its Plateau is the current stop; then the Abschlusstest', () => {
  const doneE1 = { 'a1.1-u01': 'complete', 'a1.1-u02': 'gold', 'a1.1-u03': 'complete' };
  const { model, path } = pathFor(A11, stateOf({ progress: doneE1 }));
  assert.equal(path.sections[0].stop.state, 'current');
  assert.equal(path.current.kind, 'plateau');
  assert.equal(path.current.href, '/course/a1.1/p/1');
  assert.equal(actionLabel(path.current, model), 'Plateau 1 starten');
  assert.equal(actionLabel({ ...path.current, started: true }, model), 'Weiter mit Plateau 1');
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

test('first visit = nothing finished in the level; words learned = new words of finished Kapitel', () => {
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

test('the current card: minutes from the plan, XP from gamify', () => {
  const { path } = pathFor(A11, stateOf());
  assert.equal(path.sections[0].units[0].minutesPerStep, 20, '135 planned minutes over 7 steps ≈ 20');
  assert.equal(stepMinutes(177, 8), 20);
  assert.equal(stepMinutes(null, 7), null);
  assert.equal(STEP_XP, XP.step, 'the card shows the XP the ledger actually awards');
  assert.equal(currentStop(null), null);
});

// ---------------------------------------------------------------------------
// The course plan: tiles, the Kapitel anatomy, the Inhalt, the reference links
// ---------------------------------------------------------------------------

test('„Das steckt im Kurs": manifest content counts only, hidden while Kapitel are still coming', () => {
  const tiles = courseTiles(A11);
  const n = Object.fromEntries(tiles.map((t) => [t.key, t.n]));
  assert.deepEqual(n, {
    units: A11.counts.units,
    lernschritte: A11.counts.lernschritte,
    items: A11.counts.items,
    newWords: A11.counts.newWords,
    grammar: A11.counts.ruleCards,
    speaking: A11.counts.inCourse.speakingTasks,
    writing: A11.counts.inCourse.writingTasks,
    audio: A11.counts.audioLines,
    closing: A11.counts.closingBlocks,
  });
  assert.equal(tiles.find((t) => t.key === 'units').label, 'Kapitel aus dem Alltag');
  assert.equal(tiles.find((t) => t.key === 'closing').lane, 'sd1');
  assert.deepEqual(courseTiles(B11), [], 'b1.1 has units coming: its counts describe a fraction');
  const partial = { ...A11, counts: { ...A11.counts, audioLines: undefined, inCourse: undefined, ruleCards: 0 } };
  assert.deepEqual(courseTiles(partial).map((t) => t.key), ['units', 'lernschritte', 'items', 'newWords', 'closing'], 'a missing number hides its tile');
  assert.deepEqual(courseTiles({}), []);
  for (const t of tiles) assert.doesNotMatch(t.label, /Lernende|Nutzer|Teilnehmer|learners|users/i, 'no usage counts');
});

test('„So ist jedes Kapitel aufgebaut": Einstieg → A, B, C → Prüfungstraining → Sprechen → Schreiben → Kapiteltest → Plateau', () => {
  const a = kapitelAufbau('a1.1', A11);
  assert.deepEqual(a.map((s) => s.key), ['einstieg', 'abc', 'pruefung', 'sprechen', 'schreiben', 'check', 'plateau']);
  assert.deepEqual(a.map((s) => s.title), [
    'Einstieg', 'Teil A, B und C', 'Prüfungstraining', 'Sprechen mit KI', 'Schreiben mit KI-Korrektur', 'Kapiteltest', 'Alle 3 Kapitel: ein Plateau',
  ]);
  assert.deepEqual(a[1].skills, ['wortschatz', 'hoeren', 'lesen', 'grammatik', 'ueben', 'sprechen', 'schreiben', 'aussprache']);
  for (const s of a) for (const k of s.skills) assert.ok(SKILL_ORDER.includes(k), `${k} is a curriculum skill`);
  const days = A11.review.ladderDays;
  assert.match(a[6].text, new RegExp(`nach ${days[0]}, ${days[1]} und ${days[2]} Tagen`), 'the review ladder is the manifest\'s');
  assert.doesNotMatch(kapitelAufbau('a1.1', {})[6].text, /Tagen/, 'no ladder → no days');
  const b = kapitelAufbau('b1.1', B11);
  assert.deepEqual(b.map((s) => s.key), ['einstieg', 'abc', 'pruefung', 'sprechen', 'schreiben', 'ueberarbeiten', 'check', 'plateau']);
});

test('the Inhalt: per Modul its Kapitel with Kommunikation, Grammatik, Wortschatz, Texte and Prüfung', () => {
  const model = courseHomeModel(A11, stateOf({ progress: { 'a1.1-u01': 'complete' } }), ALL_STOPS);
  const inhalt = planInhalt(model, A11);
  assert.deepEqual(inhalt.map((m) => m.title), A11.showcase.etappenDe);
  assert.deepEqual(inhalt.map((m) => m.eyebrow), ['Modul 1', 'Modul 2', 'Modul 3', 'Modul 4']);
  assert.deepEqual(inhalt[0].kapitel.map((k) => k.title), ['Hallo, ich bin Priya', 'Wie schreibt man das?', 'Meine Familie']);
  const [k1, k2] = inhalt[0].kapitel;
  assert.equal(k1.done, true);
  assert.equal(k2.current, true, 'the next Kapitel is marked');
  assert.equal(k1.href, '/course/a1.1/u/1');
  assert.deepEqual(k1.kommunikation, ['grüßen: Hallo!', 'Tschüss sagen', 'sich vorstellen', 'andere fragen', 'Sprachen nennen']);
  assert.deepEqual(k1.grammatik, ['Präsens', 'Aussagesatz und W-Frage']);
  assert.equal(k1.wortschatz, 35);
  assert.deepEqual(k1.texte, [
    { title: 'Im Kurs: Wie heißen Sie?', skills: ['hoeren'] },
    { title: 'Im Kurs: Fragen und Antworten', skills: ['hoeren'] },
    { title: 'Im Kurs-Chat', skills: ['lesen'] },
  ]);
  assert.deepEqual(k1.pruefung, ['Hören Teil 1', 'Sprechen Teil 1 + 2', 'Schreiben Teil 1']);
  for (const k of inhalt.flatMap((m) => m.kapitel)) {
    const row = rowOf(A11, k.id);
    assert.ok(k.kommunikation.length > 0 && k.grammatik.length > 0 && k.texte.length === 3 && k.pruefung.length > 0, `${k.id}: every column filled`);
    assert.equal(k.wortschatz, row.counts.newWords);
    for (const c of k.kommunikation) assert.ok(c.length <= 70, `${k.id}: „${c}" is short`);
  }
  assert.deepEqual(inhalt.map((m) => m.end.label), [
    'Plateau 1 · Wiederholung', 'Plateau 2 · Wiederholung', 'Plateau 3 · Wiederholung', 'Abschlusstest',
  ]);
  assert.deepEqual(inhalt.map((m) => m.end.href), ['/course/a1.1/p/1', '/course/a1.1/p/2', '/course/a1.1/p/3', '/course/a1.1/abschluss']);

  const bare = planInhalt(courseHomeModel(B11, stateOf()), B11);
  assert.equal(bare[0].title, null, 'no showcase → the Modul has only its number');
  assert.equal(bare[0].eyebrow, 'Modul 1');
  const b1 = bare[0].kapitel[0];
  assert.equal(b1.href, null);
  assert.deepEqual(b1.kommunikation, [rowOf(B11, 'b1.1-u01').canDoTitle.replace(/^Sie können\s+/, '').replace(/\.$/, '')], '„Ich kann …" can-dos → the can-do title');
  assert.deepEqual(b1.pruefung, ['Sprachbausteine Teil 1', 'Hören Teil 2', 'Schreiben Teil 1', 'Sprechen Teil 1'], 'the Prüfungsfokus before the outline exists');
  assert.equal(b1.wortschatz, null);
  assert.deepEqual(kommunikationOf({ canDos: ['sagen: Ich wohne in Leipzig, in Lindenau. Hier ist es schön.', 'Fahrpläne lesen: Abfahrt 8.15 Uhr.'] }), [
    'sagen: Ich wohne in Leipzig, in Lindenau.', 'Fahrpläne lesen',
  ], 'a bare verb keeps its model sentence');
  assert.deepEqual(planInhalt(null, A11), []);
});

test('the reference links: grammar overview and word list, counted from the manifest', () => {
  assert.deepEqual(referenceLinks('A1.1', A11).map((l) => [l.href, l.label]), [
    ['/course/a1.1/grammatik', 'Grammatik-Übersicht'],
    ['/course/a1.1/wortschatz', `Wortliste · ${A11.counts.newWords} Wörter`],
  ]);
  const authored = B11.units.filter((u) => u.chunk).reduce((n, u) => n + u.counts.newWords, 0);
  assert.equal(referenceLinks('b1.1', B11)[1].label, `Wortliste · ${authored} Wörter`, 'units coming → the authored units\' words only');
  assert.equal(referenceLinks('a1.1', {})[1].label, 'Wortliste', 'no count → no number');
});

test('the plan: exam parts from the Prüfungsfokus', () => {
  assert.deepEqual(examParts(A11), ['Hören', 'Lesen', 'Schreiben', 'Sprechen']);
  assert.deepEqual(examParts({}), []);
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
  // the English chrome reads the same date in its own form
  assert.deepEqual(DATE_LOCALE, { de: 'de-DE', en: 'en-GB' });
  assert.equal(formatFinishDate(opts[1].finishDate, today, DATE_LOCALE.en), '22 December');
  assert.equal(formatFinishDate(opts[0].finishDate, today, DATE_LOCALE.en), '23 February 2027');
});

// ---------------------------------------------------------------------------
// The learn screen: popovers, the current place, the goal ring
// ---------------------------------------------------------------------------

test('a node\'s popover: its name, „Lernschritt n von m" and ONE button by state', () => {
  const state = stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } });
  const { path } = pathFor(A11, state);
  const u1 = path.sections[0].units[0];
  const pops = u1.nodes.map((n) => nodePopover(n, { stepsTotal: u1.stepsTotal, unitNr: u1.nr }));
  assert.deepEqual(pops.map((p) => p.title), [
    'Teil A · Ich bin Priya. Und Sie?', 'Teil B · Woher kommst du?', 'Teil C · Der Chat vom Kurs A1',
    'Prüfungstraining · Hören Teil 1', 'Sprechen · Teil 1 + 2 mit KI', 'Schreiben · Teil 1 mit KI-Korrektur', 'Kapiteltest',
  ]);
  assert.deepEqual(pops.map((p) => p.meta), [1, 2, 3, 4, 5, 6, 7].map((n) => `Lernschritt ${n} von 7`));
  assert.deepEqual(pops.map((p) => p.action), [
    'Wiederholen', 'Wiederholen', `Start +${XP.step} XP`, 'Trotzdem starten', 'Trotzdem starten', 'Trotzdem starten', 'Trotzdem starten',
  ]);
  assert.deepEqual(pops.map((p) => p.tone), ['hue', 'hue', 'hue', 'quiet', 'quiet', 'quiet', 'quiet']);
  assert.deepEqual(pops.map((p) => p.href), u1.nodes.map((n) => n.href), 'the soft gate: every button opens its step');
  assert.equal(stepOfLine(4, 8), 'Lernschritt 4 von 8');
  assert.equal(nodePopover(u1.nodes[2], { stepsTotal: 7, xp: 0 }).action, 'Start', 'no XP figure the ledger does not award');
  // the visible label is gone from the path: the node's accessible name carries label and state
  for (const n of allNodes(path)) assert.match(n.ariaLabel, /^Kapitel \d+, .+ (Geschafft|Jetzt starten|Noch offen)\.$/);
});

test('a stop\'s popover, the Kapitel-closing node and the current place\'s DOM id', () => {
  const doneE1 = { 'a1.1-u01': 'complete', 'a1.1-u02': 'gold', 'a1.1-u03': 'complete' };
  const { path } = pathFor(A11, stateOf({ progress: doneE1 }));
  const [p1, p2] = path.sections.map((x) => x.stop);
  assert.deepEqual(stopPopover(p1), { title: 'Plateau 1 · Wiederholung', meta: 'Kapitel 1–3 wiederholen · Prüfungsteile', action: 'Start', href: '/course/a1.1/p/1', tone: 'xp' });
  assert.equal(stopPopover({ ...p1, started: true }).action, 'Weitermachen');
  assert.equal(stopPopover({ ...p1, state: 'done' }).action, 'Wiederholen');
  assert.deepEqual([stopPopover(p2).action, stopPopover(p2).tone], ['Trotzdem starten', 'quiet']);
  assert.deepEqual(stopPopover({ ...p2, state: 'unavailable', href: null }), { title: p2.label, meta: 'Kommt bald', action: null, href: null, tone: 'soon' });
  assert.equal(currentAnchor(path.current), 'dm-node-a1.1-p1');
  assert.equal(nodeAnchor(p1.id), currentAnchor(path.current), 'the page scrolls to the node it draws');

  const fresh = pathFor(A11, stateOf()).path;
  assert.equal(currentAnchor(fresh.current), 'dm-node-a1.1-u01-ls1');
  assert.equal(currentAnchor(null), null);
  assert.equal(finishNode(fresh.current, fresh.sections[0].units[0]), null, 'a step is current: no closing node');

  // every step of Kapitel 1 finished, the recap not reached: one closing node after its steps
  const recap = pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2, 3, 4, 5, 6, 7]) } })).path;
  const [k1, k2] = recap.sections[0].units;
  const fin = finishNode(recap.current, k1);
  assert.equal(fin.href, '/course/a1.1/u/1');
  assert.equal(nodeAnchor(fin.id), currentAnchor(recap.current));
  assert.deepEqual(fin.popover, { title: 'Kapitel 1 abschließen', meta: 'Alle Lernschritte geschafft', action: 'Weiter', href: '/course/a1.1/u/1', tone: 'hue' });
  assert.equal(finishNode(recap.current, k2), null);
  assert.equal(unitPercent(k1), 100);
  assert.equal(unitPercent(pathFor(A11, stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } })).path.sections[0].units[0]), 29);
  assert.equal(unitPercent({}), 0);
});

test('the top bar\'s goal ring: minutes today of the pace\'s daily minutes', () => {
  assert.deepEqual(goalRing(0, 35), { done: 0, goal: 35, pct: 0, reached: false, label: 'Tagesziel: heute 0 von 35 Minuten' });
  assert.equal(goalRing(14, 35).pct, 40);
  assert.deepEqual(goalRing(40, 35).pct, 100);
  assert.equal(goalRing(40, 35).label, 'Tagesziel geschafft: heute 40 von 35 Minuten');
  assert.equal(goalRing(5, 0).goal, 1, 'never a division by zero');
  assert.equal(goalRing(0, dailyGoalMinutes(A11, 'standard')).goal, dailyGoalMinutes(A11, 'standard'));
});

// ---------------------------------------------------------------------------
// The first-visit welcome: six short screens
// ---------------------------------------------------------------------------

test('the welcome shows once: nothing finished in the level and not finished or skipped on this device', () => {
  assert.equal(welcomeStorageKey('A1.1'), 'dm_course_v2_welcome:a1.1');
  assert.notEqual(welcomeStorageKey('a1.1'), paceStorageKey('a1.1'));
  assert.equal(showWelcome(stateOf(), null), true);
  assert.equal(showWelcome(stateOf(), '2026-09-30'), false, 'finished or skipped here before');
  assert.equal(showWelcome(stateOf({ finished: { 'a1.1-u01': ['a1.1-u01-ls1'] } }), null), false, 'a returning learner goes straight to the path');
  assert.equal(showWelcome(stateOf({ progress: { 'a1.1-u01': 'started' } }), null), true, 'opening a Kapitel is not finishing a step');
});

test('the welcome\'s screens: Priya and the promise, three things to learn, the structure, the pace', () => {
  const w = welcomeModel(A11, 'a1.1');
  assert.deepEqual(w.screens, ['hallo', 'ziele', 'aufbau', 'kapitel', 'so', 'tempo']);
  assert.deepEqual(w.replay, ['aufbau', 'kapitel', 'so'], 'the help button replays the three structure screens');
  assert.equal(w.screens[w.screens.length - 1], 'tempo', 'the pace stays last: its button ends the welcome');
  assert.equal(w.narrator, 'Priya');
  assert.equal(w.promise, 'Sie lernen Deutsch mit Priya. Mit ihr lernen Sie Schritt für Schritt Ihre ersten Gespräche auf Deutsch.');
  assert.equal(w.heading, 'Das lernen Sie in A1.1');
  // the three can-dos span the level (first, about two thirds in, last) — not Kapitel 1–3
  assert.deepEqual(w.outcomes, ['Sich vorstellen', 'Im Café bestellen', 'Ihren Plan mit Deutsch nennen']);
  assert.ok(w.outcomes.length <= 3, 'no list longer than three');
  const firstThree = A11.showcase.outcomesDe.slice(0, 3).map(outcomeLine);
  assert.ok(w.outcomes.some((o) => !firstThree.includes(o)), 'the promise reaches past the first three can-dos');
  assert.equal(w.outcomes[w.outcomes.length - 1], outcomeLine(A11.showcase.outcomesDe[A11.showcase.outcomesDe.length - 1]), 'the last can-do closes the list');
  assert.deepEqual(spreadOutcomes(['a b', 'c d', 'e f', 'g h']), ['A b', 'E f', 'G h'], 'first, two thirds, last');
  assert.deepEqual(spreadOutcomes(['eins zwei', 'drei vier']), ['Eins zwei', 'Drei vier'], 'three or fewer: all');
  assert.equal(w.shape, '12 Kapitel · 4 Module · Abschlusstest');
  assert.equal(w.shape, `${A11.units.length} Kapitel · ${A11.etappen.length} Module · Abschlusstest`, 'counted, never typed');
  // one muted line under the shape: the free flag from priceKey (the Kursplan's source) and the lane
  assert.equal(A11.priceKey, null);
  assert.equal(A11.lanes.primary, 'sd1');
  assert.equal(w.note, 'Kostenlos · Auf dem Weg zum Goethe-Zertifikat A1');
  assert.doesNotMatch(w.note, /Vorbereitung|bestehen|garantiert/, 'on the way to, never a preparation or pass claim (honestyLineDe: A1.1 is half the way)');
  assert.equal(welcomeModel({ ...A11, priceKey: 'course_a1_1' }, 'a1.1').note, 'Auf dem Weg zum Goethe-Zertifikat A1', 'a priced level is not called free');
  assert.equal(welcomeModel({ ...A11, priceKey: 'course_a1_1', lanes: {} }, 'a1.1').note, null, 'neither → no line');

  // shortening: first + last sentence while short, else the first; one line per can-do
  assert.equal(shortPromise('Eins. Zwei. Drei.'), 'Eins. Drei.');
  assert.equal(shortPromise(`Kurz. ${'Sehr lang '.repeat(20)}ende.`), 'Kurz.');
  assert.equal(shortPromise(''), null);
  assert.equal(outcomeLine('nach Preisen fragen und Durchsagen im Supermarkt verstehen'), 'Nach Preisen fragen');
  assert.equal(outcomeLine('die Uhrzeit sagen, sich verabreden, zusagen und absagen'), 'Die Uhrzeit sagen');
  assert.equal(outcomeLine('Zahlen und Telefonnummern verstehen'), 'Zahlen und Telefonnummern verstehen', 'a one-word head keeps the whole line');
  assert.equal(outcomeLine('im Kurs und im Büro um etwas bitten und eine kurze Nachricht schreiben'), 'Im Kurs und im Büro um etwas bitten', 'a verbless head („Im Kurs") takes the next cut');
  assert.equal(outcomeLine('Ihre Wohnung zeigen und Wohnungsanzeigen lesen'), 'Ihre Wohnung zeigen');
  const VERB = /(?:e[lr]?n|tun|sein)$/;
  for (const o of A11.showcase.outcomesDe) {
    const line = outcomeLine(o);
    assert.ok(line.length <= 40 && o.toLowerCase().startsWith(line.toLowerCase()), `„${line}" is the start of „${o}"`);
    assert.match(line, VERB, `„${line}" is a can-do, not a verbless fragment`);
  }
  assert.equal(courseShape({ units: [{}], etappen: [{}] }), '1 Kapitel · 1 Modul');
  assert.equal(courseShape({}), null);

  // a level without a showcase skips Priya and the can-dos, but still explains its structure
  // and asks for the pace; no data at all → no welcome
  const b = welcomeModel(B11, 'b1.1');
  assert.deepEqual(b.screens, ['aufbau', 'kapitel', 'so', 'tempo']);
  assert.equal(b.narrator, null, 'Priya is the A1 cast');
  assert.deepEqual(welcomeModel({}, 'a1.1').screens, []);
  assert.equal(welcomeModel({}, 'a1.1').note, null);
});

test('the welcome\'s chrome follows the lesson language; the promise and the can-dos stay German', () => {
  const de = welcomeModel(A11, 'a1.1');
  const en = welcomeModel(A11, 'a1.1', { lang: 'en' });
  assert.deepEqual(welcomeModel(A11, 'a1.1', { lang: 'de' }), de, 'German is the default');
  assert.equal(en.heading, 'What you will learn in A1.1');
  assert.equal(en.shape, '12 chapters · 4 modules · Abschlusstest');
  assert.equal(en.note, 'Free · On the way to the Goethe-Zertifikat A1');
  assert.equal(courseShape({ units: [{}], etappen: [{}] }, 'en'), '1 chapter · 1 module');
  assert.equal(en.promise, de.promise, 'content: the promise is German in both chromes');
  assert.deepEqual(en.outcomes, de.outcomes, 'content: the can-dos are German in both chromes');
  assert.deepEqual(en.screens, de.screens);
  // every welcome.* key the model and the component use exists in both tables, and the
  // German table carries the former literals so the German chrome is unchanged
  const keys = new Set();
  for (const f of [`${HOME_DIR}/Welcome.jsx`, `${HOME_DIR}/WelcomeAufbau.jsx`, `${HOME_DIR}/WelcomeKapitel.jsx`, `${HOME_DIR}/WelcomeSo.jsx`, 'src/lib/course-v2/pathModel.js']) {
    for (const m of read(f).matchAll(/'(welcome\.[A-Za-z]+)'/g)) keys.add(m[1]);
  }
  assert.ok(keys.size >= 12, `the welcome uses ${keys.size} chrome keys — suspiciously few`);
  for (const k of keys) {
    assert.equal(typeof V2_STRINGS.en[k], 'string', `EN lacks ${k}`);
    assert.equal(typeof V2_STRINGS.de[k], 'string', `DE lacks ${k}`);
    assert.notEqual(V2_STRINGS.en[k], k, `${k} falls through to its key`);
  }
  assert.deepEqual(
    ['welcome.skip', 'welcome.next', 'welcome.go', 'welcome.tempo', 'welcome.tempoLegend'].map((k) => V2_STRINGS.de[k]),
    ['Überspringen', 'Weiter', 'Los geht’s', 'Wie viel Zeit haben Sie pro Tag?', 'Ihr Tempo'],
  );
  assert.equal(V2_STRINGS.de['welcome.title'], 'Willkommen im Kurs {code}');
  assert.equal(V2_STRINGS.de['welcome.stepOf'], 'Schritt {n} von {t}');
  assert.equal(V2_STRINGS.en['welcome.go'], 'Let’s go');
  for (const k of keys) assert.doesNotMatch(V2_STRINGS.de[k], DU_TOKENS, `${k}: the German chrome is Sie`);
});

test('the welcome\'s pace tiles: minutes, learning days and the finish date of each preset', () => {
  const today = new Date(2026, 8, 29, 12);
  const tiles = paceOptions(A11, { remainingSteps: 84, today }).map((o) => paceTile(o, { today }));
  assert.deepEqual(tiles.map((t) => t.id), ['leicht', 'standard', 'intensiv']);
  assert.deepEqual(tiles.map((t) => t.title), ['leicht', 'standard', 'intensiv'].map((p) => `${dailyGoalMinutes(A11, p)} Minuten`));
  assert.deepEqual(tiles.map((t) => t.days), ['an 3 Tagen pro Woche', 'an 4 Tagen pro Woche', 'an 6 Tagen pro Woche']);
  assert.deepEqual(tiles.map((t) => t.name), ['Leicht', 'Standard', 'Intensiv']);
  assert.equal(tiles[1].finish, 'fertig etwa am 22. Dezember');
  assert.equal(paceTile(paceOptions(A11, { remainingSteps: 84, today })[1], { allDone: true, today }).finish, null);
  // the same tiles in the English chrome: the numbers are the same, the words and the date form are English
  const en = paceOptions(A11, { remainingSteps: 84, today }).map((o) => paceTile(o, { today, lang: 'en' }));
  assert.deepEqual(en.map((t) => t.id), tiles.map((t) => t.id));
  assert.deepEqual(en.map((t) => t.name), ['Light', 'Standard', 'Intensive']);
  assert.deepEqual(en.map((t) => t.title), ['leicht', 'standard', 'intensiv'].map((p) => `${dailyGoalMinutes(A11, p)} minutes`));
  assert.deepEqual(en.map((t) => t.days), ['on 3 days a week', 'on 4 days a week', 'on 6 days a week']);
  assert.equal(en[1].finish, 'done around 22 December');
  assert.equal(paceTile({ id: 'turbo', name: 'Turbo', minutes: 10, learningDays: 7, weeks: 2, finishDate: today }, { today, lang: 'en' }).name, 'Turbo', 'an unknown preset keeps its own name');
});

// ---------------------------------------------------------------------------
// Textbook naming: no „Lektion" and no „Etappe" left on the home
// ---------------------------------------------------------------------------

const STALE_NAMES = /\b(Lektion|Etappe)/;

test('the home model speaks Kapitel, Modul, Plateau and Abschlusstest — never Lektion or Etappe', () => {
  const strings = [];
  const collect = (v) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => { if (!['id', 'unitId', 'stepId', 'href', 'kind', 'hue', 'icon'].includes(k)) collect(x); });
  };
  const states = [
    stateOf(),
    stateOf({ finished: { 'a1.1-u01': steps('a1.1-u01', [1, 2]) } }),
    stateOf({ progress: { 'a1.1-u01': 'complete', 'a1.1-u02': 'gold', 'a1.1-u03': 'complete' } }),
  ];
  for (const state of states) {
    const { model, path } = pathFor(A11, state);
    collect(path);
    collect(actionLabel(path.current, model));
    collect(planInhalt(model, A11));
  }
  const b = pathFor(B11, stateOf(), NO_STOPS);
  collect(b.path);
  collect(planInhalt(b.model, B11));
  collect([kapitelAufbau('a1.1', A11), kapitelAufbau('b1.1', B11), courseTiles(A11), referenceLinks('a1.1', A11)]);
  collect(['plateau', 'closing', 'unit'].map((kind) => actionLabel({ kind, nr: 1, unitNr: 1, started: false }, null)));
  assert.ok(strings.length > 500);
  const stale = strings.filter((s) => STALE_NAMES.test(s));
  assert.deepEqual(stale, [], 'learner-facing strings with the old names');
});

// audit CT-07: the path promised an „Abschlusstest", the player then titled the same block
// „Halbtest". One learner-facing name; the SCHEMA kind 'halbtest' stays a data key.
test('the closing block has ONE learner-facing name: the path\'s „Abschlusstest", never „Halbtest"', () => {
  const { path } = pathFor(A11, stateOf());
  const trophy = path.sections.map((s) => s.stop).find((st) => st && st.kind === 'closing');
  assert.equal(trophy.label, 'Abschlusstest');
  for (const lang of ['de', 'en']) {
    assert.equal(tv('as.halbtest', lang), trophy.label, `${lang}: the player's heading is the path's name`);
    for (const k of ['as.toClosing', 'as.startClosing', 'as.closingDone', 'welcome.finalTest']) {
      assert.ok(tv(k, lang).includes(trophy.label), `${lang} ${k}: „${tv(k, lang)}" names the Abschlusstest`);
    }
    const leaks = Object.entries(V2_STRINGS[lang]).filter(([, v]) => /\bHalbtests?\b/.test(v)).map(([k]) => k);
    assert.deepEqual(leaks, [], `${lang}: learner copy that says „Halbtest"`);
  }
  assert.equal(tv('as.startClosing', 'de'), actionLabel({ kind: 'closing', started: false }, null), 'the player and the path use the same start label');
});

// audit CRITIC-02: a learner who finished everything landed on Kapitel 1 with twelve Kapitel of
// ticks and no end state. The path now ends in a card under the trophy and scrolls there.
const EVERY_UNIT = Object.fromEntries(A11.units.map((u) => [u.unit, 'complete']));
const EVERY_PLATEAU = { 'a1.1-p1': 'complete', 'a1.1-p2': 'complete', 'a1.1-p3': 'complete' };

test('the end of the path: every Kapitel done → a headline and ONE next action, scrolled to', () => {
  const finishOf = (progress, stops = ALL_STOPS, lang = 'de') => courseFinish(courseHomeModel(A11, stateOf({ progress }), stops), { lang });

  // still something to learn → no end card
  assert.equal(finishOf({}), null, 'a fresh learner');
  assert.equal(finishOf({ ...EVERY_UNIT, 'a1.1-u12': 'started' }), null, 'a Kapitel still open');
  assert.equal(finishOf({ ...EVERY_UNIT, 'a1.1-p1': 'complete', 'a1.1-p2': 'complete' }), null, 'Plateau 3 still open');
  assert.equal(courseFinish(null), null);

  // every Kapitel and Plateau done, the Abschlusstest open → it is the one action
  const left = finishOf({ ...EVERY_UNIT, ...EVERY_PLATEAU });
  assert.deepEqual(left, {
    anchor: FINISH_ANCHOR,
    complete: false,
    title: 'Alle 12 Kapitel geschafft!',
    body: 'Jetzt fehlt nur noch der Abschlusstest – jeder Prüfungsteil im Kleinen.',
    action: { label: 'Abschlusstest starten', href: '/course/a1.1/abschluss' },
  });
  assert.equal(finishOf({ ...EVERY_UNIT, ...EVERY_PLATEAU, 'a1.1-ht-sd1': 'started' }).action.label, 'Weiter mit dem Abschlusstest');
  assert.equal(finishOf({ ...EVERY_UNIT, ...EVERY_PLATEAU }, ALL_STOPS, 'en').action.label, 'Start the Abschlusstest');

  // everything done → „A1.1 geschafft!", A1.2 honestly not released, the word list (a live route)
  const done = finishOf({ ...EVERY_UNIT, ...EVERY_PLATEAU, 'a1.1-ht-sd1': 'complete' });
  assert.equal(done.complete, true);
  assert.equal(done.title, 'A1.1 geschafft!');
  assert.equal(done.body, 'Alle 12 Kapitel und der Abschlusstest sind geschafft. A1.2 ist noch nicht freigeschaltet. Bis dahin können Sie jedes Kapitel wiederholen und jedes Wort in der Wortliste nachschlagen.');
  assert.deepEqual(done.action, { label: 'Zur Wortliste', href: '/course/a1.1/wortschatz' });
  assert.ok(referenceLinks('a1.1', A11).some((l) => l.href === done.action.href), 'the action is the tab bar\'s word list');
  const en = finishOf({ ...EVERY_UNIT, ...EVERY_PLATEAU, 'a1.1-ht-sd1': 'complete' }, ALL_STOPS, 'en');
  assert.equal(en.title, 'A1.1 complete!');
  assert.match(en.body, /A1\.2 is not released yet/);
  assert.equal(en.action.label, 'Open the word list');

  // the Abschlusstest not compiled yet → the chapters are done, the test „kommt bald"
  const soon = finishOf({ ...EVERY_UNIT, ...EVERY_PLATEAU }, { plateaus: new Set([1, 2, 3]), closings: new Set() });
  assert.equal(soon.title, 'Alle 12 Kapitel geschafft!');
  assert.match(soon.body, /^Der Abschlusstest kommt bald\./);
  assert.equal(soon.action.href, '/course/a1.1/wortschatz');

  // never a link to a level that does not exist, never a price
  for (const f of [left, done, en, soon]) {
    assert.doesNotMatch(f.action.href, /a1\.2|pricing|subscription/);
    assert.doesNotMatch(`${f.title} ${f.body} ${f.action.label}`, /€|\d+[.,]\d\d|Preis|price/i);
  }
  assert.deepEqual(['a1.1', 'a1.2', 'b1.2', 'b2.2', 'x'].map(nextLevelCode), ['A1.2', 'A2.1', 'B2.1', null, null]);
  for (const k of Object.keys(V2_STRINGS.en).filter((x) => x.startsWith('finish.'))) {
    assert.equal(typeof V2_STRINGS.de[k], 'string', `DE lacks ${k}`);
  }
});

test('the page scrolls to the end card once every Kapitel is done; the path draws it under the trophy', () => {
  const page = read(PAGE);
  assert.match(page, /const finish = useMemo\(\(\) => courseFinish\(model, \{ lang \}\), \[model, lang\]\);/);
  assert.match(page, /const anchor = finish \? finish\.anchor : path \? currentAnchor\(path\.current\) : null;/, 'the scroll target is the end card when there is one');
  assert.match(page, /<PathSection[\s\S]*finish=\{finish\}[\s\S]*\/>/);
  const section = read(`${HOME_DIR}/PathSection.jsx`);
  assert.match(section, /\}\)\}\n\s*<CourseFinish finish=\{finish\} \/>\n\s*<\/div>/, 'after the last Modul (its trophy)');
  const card = read(`${HOME_DIR}/CourseFinish.jsx`);
  assert.match(card, /id=\{finish\.anchor\}\s+tabIndex=\{-1\}/, 'scroll and focus target, not a tab stop');
  assert.equal((card.match(/<GameButton/g) || []).length, 1, 'one next action');
});

// ---------------------------------------------------------------------------
// Source guards: theme, tokens, register, honesty, naming
// ---------------------------------------------------------------------------

const HOME_DIR = 'src/components/course-v2/home';
const HOME_FILES = readdirSync(join(ROOT, HOME_DIR)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${HOME_DIR}/${f}`);
const PAGE = 'src/pages/course-v2/CourseHomeV2Page.jsx';
const OWNED = [PAGE, 'src/lib/course-v2/pathModel.js', ...HOME_FILES];
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// the same du-register list as tests/course-player.test.mjs
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

test('the course home renders inside the course theme and draws every node from the path model', () => {
  const page = read(PAGE);
  assert.match(page, /import CourseTheme from '\.\.\/\.\.\/components\/course-v2\/CourseTheme\.jsx'/);
  assert.match(page, /coursePath\(model, state, \{[^}]*manifest \}\)/, 'the path reads the outlines from the manifest');
  assert.match(page, /safeSet\(paceStorageKey\(level\), p\)/, 'the pace pick is stored through safeStorage');
  assert.match(page, /planInhalt\(model, manifest\)/);
  assert.ok(HOME_FILES.length >= 10, 'the home is split into small components');
  assert.ok(!HOME_FILES.some((f) => /EtappenPlan/.test(f)), 'the Etappen timeline became the Inhalt');
  // the plan (one tap deep, in the Kursplan sheet) still holds the textbook Inhalt
  const plan = read(`${HOME_DIR}/PlanOverview.jsx`);
  for (const part of ['<KapitelAufbau', '<InhaltPlan', '<ReferenceLinks', 'So ist jedes Kapitel aufgebaut', 'title="Inhalt"']) assert.ok(plan.includes(part), `the plan has ${part}`);
  for (const col of ['Kommunikation', 'Grammatik', 'Wortschatz', 'Texte', 'Prüfung']) assert.match(read(`${HOME_DIR}/InhaltPlan.jsx`), new RegExp(`label="${col}"`));
  // one set of skill icons: the shared SkillIcon, never a second map
  for (const f of ['InhaltPlan.jsx', 'KapitelAufbau.jsx', 'ReferenceLinks.jsx', 'TabBar.jsx']) {
    assert.match(read(`${HOME_DIR}/${f}`), /from '\.\.\/SkillIcon\.jsx'/, `${f} uses SkillIcon`);
  }
});

// ---------------------------------------------------------------------------
// Source pins: the learn screen (round 3)
// ---------------------------------------------------------------------------

test('the learn screen: top bar, path, tab bar and the Kursplan sheet — no bottom CTA, no plan on the page', () => {
  const page = read(PAGE);
  assert.match(page, /<CourseTheme>[\s\S]*<TopBar[\s\S]*<PathSection[\s\S]*<TabBar[\s\S]*<KursplanSheet[\s\S]*<PlanOverview[\s\S]*<\/KursplanSheet>[\s\S]*<\/CourseTheme>/);
  assert.doesNotMatch(stripComments(page), /ActionBar/, 'the START bubble and the popover are the call to action now');
  assert.doesNotMatch(stripComments(page), /DailyGoalCard|ReferenceLinks/, 'the goal is the top bar\'s ring, the references are tabs');
  assert.ok(!HOME_FILES.includes(`${HOME_DIR}/DailyGoalCard.jsx`));
  // the goal ring reads the ledger and the pace (the coach marks name the same minutes)
  assert.match(page, /const goalMinutes = dailyGoalMinutes\(manifest, pace\);/);
  assert.match(page, /ring=\{goalRing\(game\.todayMinutes, goalMinutes\)\}/, 'the goal ring reads the ledger and the pace');
  const top = read(`${HOME_DIR}/TopBar.jsx`);
  for (const part of ['<Flame', '<Zap', 'conic-gradient(var(--c-primary)', '<span className="sr-only">{g.label}</span>']) assert.ok(top.includes(part), `the top bar has ${part}`);
  // the plan opens as a sheet at #kursplan (the back button closes it), not in the page
  assert.match(page, /hash: '#kursplan'/);
  assert.match(page, /const SHEET_HASH = \/\^#kursplan\//);
  assert.match(page, /navigate\(-1\)/, 'closing a sheet it opened goes back in history');
  const sheet = read(`${HOME_DIR}/KursplanSheet.jsx`);
  for (const part of ['role="dialog"', 'aria-modal="true"', 'aria-labelledby="dm-kursplan-title"', '>Kursplan</h2>', 'aria-label="Kursplan schließen"',
    "body.style.overflow = 'hidden'", "e.key === 'Escape'", 'back.focus(', 'sticky top-0']) {
    assert.ok(sheet.includes(part), `the sheet has ${part}`);
  }
  // on load and after the welcome the current node comes to the middle of the screen
  assert.match(page, /scrollIntoView\(\{ block: 'center', behavior: prefersReducedMotion\(\) \? 'auto' : 'smooth' \}\)/);
  assert.match(page, /currentAnchor\(path\.current\)/);
});

test('the tab bar: Lernen · Kursplan · Grammatik · Wörter, fixed at the bottom, the active one marked', () => {
  const bar = read(`${HOME_DIR}/TabBar.jsx`);
  const labels = [...bar.matchAll(/^\s+(Lernen|Kursplan|Grammatik|Wörter)$/gm)].map((m) => m[1]);
  assert.deepEqual(labels, ['Lernen', 'Kursplan', 'Grammatik', 'Wörter'], 'four tabs, in order');
  assert.match(bar, /grid-cols-4/, 'four equal tabs');
  assert.match(bar, /fixed inset-x-0/);
  assert.match(bar, /pb-\[env\(safe-area-inset-bottom\)\]/, 'the safe area');
  assert.match(bar, /onClick=\{onLernen\} aria-current="page"/, 'Lernen is this page');
  assert.match(bar, /aria-haspopup="dialog"\s+aria-expanded=\{kursplanOpen\}/, 'Kursplan opens the sheet');
  assert.match(bar, /<Link to=\{grammatik\.href\}/);
  assert.match(bar, /<Link to=\{woerter\.href\}/);
  assert.deepEqual(referenceLinks('a1.1', A11).map((l) => [l.key, l.href]), [['grammatik', '/course/a1.1/grammatik'], ['wortschatz', '/course/a1.1/wortschatz']]);
  assert.match(read(PAGE), /<TabBar ref=\{kursplanTab\} links=\{links\}/);
  // the page leaves room so the last node clears the bar …
  assert.match(read(PAGE), /pb-28/);
  // … and the path leaves room so the LAST popover (the trophy's) does too: a popover is
  // absolute, and PathSection's scroll-adjust (scrollBy the overflow above the bar) can only
  // move as far as the document scrolls — at the end of the path only this padding gives it
  // that room. pb-8 left the „Trotzdem starten" button 31 px visible under the bar at 360×740;
  // pb-32 clears it by ≥ 16 px there, with a 34 px safe area and with the signed-in BottomNav.
  assert.match(read(`${HOME_DIR}/PathSection.jsx`), /id="lernpfad" className="[^"]*\bpb-32\b/);
});

test('the path: banners with a book button, big round nodes as disclosures, no label cards', () => {
  const banner = read(`${HOME_DIR}/UnitBanner.jsx`);
  assert.match(banner, /<Link\s+to=\{unit\.guideHref\}\s+aria-label=\{`Kapitel \$\{unit\.nr\} im Überblick`\}/, 'the book button opens the Kapitel guide');
  assert.match(banner, /<BookOpen/);
  assert.match(banner, /\{unit\.eyebrow\}/);
  assert.match(banner, /sticky top-\[8\.125rem\]/, 'the banner sticks under the top bar');
  assert.doesNotMatch(banner, /summary\.line|Übersicht/, 'no grammar line under the banner');

  const node = read(`${HOME_DIR}/PathNode.jsx`);
  assert.match(node, /<button\s+id=\{anchorId\}\s+type="button"\s+onClick=\{onToggle\}\s+aria-expanded=\{open\}\s+aria-controls=\{popId\}/, 'a node is a disclosure button');
  assert.match(node, /<span className="sr-only">\{ariaLabel\}<\/span>/, 'its label and state are in its name');
  assert.match(node, /h-16 w-\[72px\]/, 'a big node');
  assert.match(node, /shadow-\[0_6px_0_var\(--hue-edge\)\]/, 'the 3D edge in the Kapitel\'s hue');
  assert.match(node, /shadow-game-locked/, 'not yet: the grey locked tokens');
  assert.match(node, /motion-safe:animate-\[float_2\.4s_ease-in-out_infinite\]/, 'the START bubble bounces only when motion is welcome');
  assert.match(node, /conic-gradient\(var\(--hue\)/, 'the current node\'s progress ring');
  for (const f of ['PathNode.jsx', 'PathSection.jsx', 'UnitBanner.jsx']) {
    const src = read(`${HOME_DIR}/${f}`);
    assert.doesNotMatch(src, /SkillChips|SkillIcon|Grammatik: |node\.grammar|node\.label|node\.skills/, `${f}: no label cards, skill chips or grammar lines on the path`);
  }

  const pop = read(`${HOME_DIR}/NodePopover.jsx`);
  assert.equal((pop.match(/<Link/g) || []).length, 1, 'one button per popover');
  assert.match(pop, /\{popover\.action\}/);
  assert.match(pop, /uppercase/, 'the action in capitals by CSS, words for screen readers');
  const section = read(`${HOME_DIR}/PathSection.jsx`);
  assert.match(section, /setOpenId\(\(prev\) => \(prev === id \? null : id\)\)/, 'one popover open at a time');
  assert.match(section, /addEventListener\('pointerdown'/, 'a tap outside closes it');
  assert.match(section, /e\.key !== 'Escape'/, 'Escape closes it');
  assert.match(section, /nodePopover\(node, \{ stepsTotal: unit\.stepsTotal/);
  assert.match(section, /stopPopover\(stop\)/);
  assert.match(section, /<StopFace stop=\{stop\} \/>/, 'the chest and the trophy stay');
  assert.match(section, /unit\.available \? unit\.nodes : unit\.placeholders/, 'a Kapitel not compiled yet shows grey nodes');
  assert.match(read(`${HOME_DIR}/JumpButton.jsx`), /aria-label="Zum aktuellen Lernschritt"/);
});

test('the welcome: six screens, one thing and one button each, remembered per device', () => {
  const page = read(PAGE);
  assert.match(page, /showWelcome\(state, safeGet\(welcomeStorageKey\(level\)\)\)/, 'shown only without progress and not seen here');
  assert.match(page, /safeSet\(welcomeStorageKey\(level\), /, 'finishing or skipping it is remembered');
  const w = read(`${HOME_DIR}/Welcome.jsx`);
  for (const screen of ["screen === 'hallo'", "screen === 'ziele'", "screen === 'aufbau'", "screen === 'kapitel'", "screen === 'so'", "screen === 'tempo'"]) {
    assert.ok(w.includes(screen), `the welcome has ${screen}`);
  }
  for (const f of ['WelcomeAufbau.jsx', 'WelcomeKapitel.jsx', 'WelcomeSo.jsx']) {
    assert.doesNotMatch(read(`${HOME_DIR}/${f}`), /<GameButton|<button|<Link/, `${f}: the one button stays the welcome's own`);
  }
  assert.equal((w.match(/<GameButton/g) || []).length, 1, 'one big button per screen');
  // the chrome reads the lesson language (strings.js welcome.*) — no German literal in the component
  assert.match(w, /import \{ useV2Strings \} from '\.\.\/strings\.js'/);
  assert.match(w, /\{last \? lastLabel \|\| t\('welcome\.go'\) : t\('welcome\.next'\)\}/, '„Los geht’s" ends the welcome; the replay says „Weiter" (the coach marks follow)');
  assert.match(w, />\s*\{t\('welcome\.skip'\)\}\s*</, 'a quiet way out');
  assert.match(w, /<CastAvatar name=\{model\.narrator\} size=\{120\} decorative className="motion-safe:animate-pop-in" \/>/);
  assert.match(w, /\{t\('welcome\.title', \{ code: model\.code \}\)\}/);
  assert.match(w, /\{t\('welcome\.tempo'\)\}/);
  assert.match(w, /<legend className="sr-only">\{t\('welcome\.tempoLegend'\)\}<\/legend>/);
  assert.doesNotMatch(stripComments(w), /Überspringen|Los geht|Wie viel Zeit|Willkommen im Kurs|Ihr Tempo/, 'no chrome literal outside strings.js');
  // the promise and the can-dos are content: German, and marked so
  assert.match(w, /lang="de">\{model\.promise\}/);
  assert.match(w, /lang="de">\{o\}/);
  assert.match(w, /type="radio"/, 'the pace tiles are a real radio group');
  assert.match(w, /peer-focus-visible:ring-4/, 'the focused tile shows it');
  assert.match(w, /\{model\.shape\}/, 'the counts line is the manifest\'s');
  assert.match(w, /\{model\.note && <p [^>]*>\{model\.note\}<\/p>\}/, 'the free flag and the lane, one muted line under the shape');
  assert.match(w, /aria-live="polite">\{t\('welcome\.stepOf', \{ n: at \+ 1, t: screens\.length \}\)\}/);
  // the page hands the model and the tiles the same language the component reads
  assert.match(page, /const \[lang, t\] = useV2Strings\(\);/);
  assert.match(page, /welcomeModel\(manifest, level, \{ lang \}\), \[manifest, level, lang\]/);
  assert.match(page, /paceTile\(o, \{ allDone, lang \}\)/);
});

test('the course home writes only tokens: no hex literal, no raw Tailwind palette class, no built class names', () => {
  for (const f of OWNED) {
    const src = read(f);
    assert.doesNotMatch(src, /#[0-9a-fA-F]{3,8}\b/, `${f}: a hex colour outside design-tokens.js`);
    assert.doesNotMatch(src, /\b(?:bg|text|border|fill|shadow|from|to|ring)-(?:amber|rose|red|green|blue|gray|slate|orange|pink|emerald|yellow|teal)-\d/, `${f}: a raw Tailwind palette class`);
    assert.doesNotMatch(src, /(?:bg|text|border|shadow|w|h|gap|grid-cols)-\$\{/, `${f}: a class name built by concatenation (Tailwind JIT cannot see it)`);
  }
});

test('the course home speaks Sie, uses the textbook names and promises no result', () => {
  const offenders = [];
  for (const f of OWNED) {
    read(f).split('\n').forEach((line, i) => {
      if (DU_TOKENS.test(line) || /\bdein/i.test(line)) offenders.push(`${f}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `du-register on the course home:\n${offenders.join('\n')}`);
  const stale = [];
  for (const f of OWNED) {
    stripComments(read(f)).split('\n').forEach((line, i) => {
      if (STALE_NAMES.test(line)) stale.push(`${f}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(stale, [], `„Lektion"/„Etappe" in learner-facing home code:\n${stale.join('\n')}`);
  for (const f of OWNED) {
    const src = read(f);
    assert.doesNotMatch(src, /garantiert|Erfolgsquote|sicher bestehen|bestehen Sie|Sie bestehen|\d+\s*%\s*(?:bestehen|Erfolg)/i, `${f}: no exam-outcome promise`);
    assert.doesNotMatch(src, /\d[\d.,]*\s*(?:Lernende|Nutzer|Teilnehmer)/, `${f}: no usage counts`);
  }
});
