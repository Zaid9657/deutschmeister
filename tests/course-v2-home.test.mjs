// Course v2 — the course home's learning path and course plan
// (src/lib/course-v2/pathModel.js, src/pages/course-v2/CourseHomeV2Page.jsx,
// src/components/course-v2/home/*). Owner decisions 2026-09-29: a Duolingo-style
// path and a plan the learner sees before starting — then „make it a CURRICULUM like
// the textbooks: Kapitel, and in every Kapitel grammar, listening, reading, questions
// visible". The home speaks the Lehrwerk's language: Kapitel, Modul, Plateau,
// Abschlusstest; each step says what it teaches; the plan is a textbook „Inhalt".
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
} from '../src/lib/course-v2/pathModel.js';

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
  for (const u of units) {
    assert.deepEqual(u.summary.grammar, chapterSummary(rowOf(A11, u.id).outline).grammar.map((g) => g.short));
    assert.match(u.summary.line, /^Grammatik: .+ · \d+ neue Wörter$/);
  }
  assert.deepEqual(kapitelSummary(null), { grammar: [], newWords: null, line: null });
});

test('Kapitel hues cycle grün → orange → beere → türkis, and the wave mirrors per Kapitel', () => {
  assert.deepEqual(UNIT_HUES, ['gruen', 'orange', 'beere', 'tuerkis']);
  assert.equal(hueFor(4), 'gruen');
  const { path } = pathFor(A11, stateOf());
  const units = path.sections.flatMap((s) => s.units);
  assert.deepEqual(units.map((u) => u.hue), Array.from({ length: 12 }, (_, i) => UNIT_HUES[i % 4]));
  assert.deepEqual(units[0].nodes.map((n) => n.offset), [0, 8, 12, 8, 0, -8, -12]);
  assert.deepEqual(units[1].nodes.map((n) => n.offset), [0, -8, -12, -8, 0, 8, 12]);
  assert.deepEqual(units.map((u) => u.direction).slice(0, 4), [1, -1, 1, -1]);
  assert.equal(ZIGZAG.length, 8);
  assert.ok(ZIGZAG.every((x) => Math.abs(x) <= 12), 'a small wave: the labels sit at a fixed x beside the rail');
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
    assert.match(u.bannerLabel, /^Kapitel \d+ · kommt bald$/);
  }
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
  assert.match(page, /<CourseTheme>[\s\S]*<TopBar[\s\S]*<PathSection[\s\S]*<\/CourseTheme>/);
  assert.match(page, /coursePath\(model, state, \{[^}]*manifest \}\)/, 'the path reads the outlines from the manifest');
  assert.match(page, /safeSet\(paceStorageKey\(level\), p\)/, 'the pace pick is stored through safeStorage');
  assert.match(page, /<ActionBar>\s*<GameButton to=\{current\.href\}/, 'the thumb-zone action goes to the current step');
  assert.match(page, /<DailyGoalCard[\s\S]*\/>\s*<ReferenceLinks links=\{links\}/, 'the reference links sit under the daily-goal card');
  assert.match(page, /planInhalt\(model, manifest\)/);
  assert.ok(HOME_FILES.length >= 10, 'the home is split into small components');
  assert.ok(!HOME_FILES.some((f) => /EtappenPlan/.test(f)), 'the Etappen timeline became the Inhalt');

  // the banner opens the Kapitel page; the node label shows grammar + skills; the plan shows the Inhalt
  assert.match(read(`${HOME_DIR}/UnitBanner.jsx`), /<Link\s+to=\{unit\.href\}/);
  assert.match(read(`${HOME_DIR}/UnitBanner.jsx`), /unit\.summary\.line/);
  assert.match(read(`${HOME_DIR}/PathNode.jsx`), /Grammatik: \{node\.grammar\}/);
  const plan = read(`${HOME_DIR}/PlanOverview.jsx`);
  for (const part of ['<KapitelAufbau', '<InhaltPlan', '<ReferenceLinks', 'So ist jedes Kapitel aufgebaut', 'title="Inhalt"']) assert.ok(plan.includes(part), `the plan has ${part}`);
  for (const col of ['Kommunikation', 'Grammatik', 'Wortschatz', 'Texte', 'Prüfung']) assert.match(read(`${HOME_DIR}/InhaltPlan.jsx`), new RegExp(`label="${col}"`));
  // one set of skill icons: the shared SkillIcon, never a second map
  for (const f of ['PathNode.jsx', 'PathSection.jsx', 'InhaltPlan.jsx', 'KapitelAufbau.jsx', 'ReferenceLinks.jsx']) {
    assert.match(read(`${HOME_DIR}/${f}`), /from '\.\.\/SkillIcon\.jsx'/, `${f} uses SkillIcon`);
  }
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
