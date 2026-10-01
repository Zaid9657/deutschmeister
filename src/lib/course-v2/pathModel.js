// Course v2 — the course home's LEARNING PATH and COURSE PLAN view model (owner
// decisions 2026-09-29: "gamify it, make it similar to Duolingo … when the user
// starts, he should SEE THE PLAN", then, after seeing it: "I want it to be a
// CURRICULUM — like studio, Aspekte … CHAPTERS, and in each chapter multiple things
// one can learn … grammar, listening, questions visible").
//
// Pure: courseHomeModel(...) (homeModel.js) + the learner's state + the manifest
// in, everything the page draws out. Nothing here renders, fetches or stores; the
// page (src/pages/course-v2/CourseHomeV2Page.jsx) and src/components/course-v2/home/*
// only draw it. Pinned by tests/course-v2-home.test.mjs.
//
// Naming is the Lehrwerk's (docs/course-v2/research/14-lehrwerke-curricula.md §D,
// src/lib/course-v2/curriculum.js): a unit is a KAPITEL, an Etappe a MODUL, the review
// after a Modul a PLATEAU, the course's last block the ABSCHLUSSTEST. Inside a Kapitel
// the situation steps are the Teile A, B, C (Schritte: one structure per step), then
// Prüfungstraining, Sprechen, Schreiben (Überarbeiten at B) and the Kapiteltest.
//
// Rules it carries:
//   - a node is one step of the unit's compiled OUTLINE (manifest `units[].outline`,
//     read through curriculum.sectionsOf); a unit whose row has no outline falls back
//     to the fixed skeleton per band (BLUEPRINT §3.1–§3.2: A levels 7 steps, B levels 8);
//   - every node says what it teaches: its label („A · Ich bin Priya. Und Sie?",
//     „Prüfungstraining · Hören Teil 1"), its grammar short name and its skills;
//   - a node is `done` when its step id is in state.finishedSteps (or the unit is
//     complete/gold), `current` when it is the first unfinished step of the model's
//     `next` unit, `open` otherwise — and EVERY node of a compiled unit links (the
//     gate stays soft, BLUEPRINT §3.5): `${v2Paths.unit(level, nr)}?s=${stepNr}`;
//     a unit keeps its Kapitel page (`href`, v2Paths.unit) and, since round 3, the Kapitel
//     guide its banner's book button opens (`guideHref`, `…/u/<nr>?view=guide`);
//   - since round 3 (2026-09-30, "duolingo style … step for step") the path draws no label
//     beside a node: the label, „Lernschritt n von m" and the one button live in the node's
//     popover (nodePopover / stopPopover below), the name and state in its ariaLabel;
//   - a unit that is not compiled has no nodes and no link („kommt bald");
//   - numbers shown come from the manifest only (content counts, never usage
//     counts — CLAUDE.md "User-facing counts are content counts"); a count that is
//     missing hides its tile, and a level whose units are not all authored yet
//     shows no content tiles at all (its counts would describe a fraction).
import { v2Paths, levelCode, normalizeLevel } from './ids.js';
import { DONE_STATUSES } from './completion.js';
import { XP, dailyGoalMinutes } from './gamify.js';
import { planSummary } from './pacePlan.js';
import { sectionsOf, chapterSummary } from './curriculum.js';
import { teilLabel, laneLabel } from '../../components/course-v2/content.js';
import { tv } from '../../components/course-v2/strings.js';

const STEP = (kind, icon) => Object.freeze({ kind, icon });

/** The step skeleton of a unit per band (the fallback when a row carries no outline): kind + node icon (lucide). */
export const STEP_SKELETON = Object.freeze({
  a: Object.freeze([
    STEP('situation', 'Star'), STEP('situation', 'Star'), STEP('situation', 'Star'),
    STEP('pruefung', 'Target'), STEP('sprechen', 'Mic'), STEP('schreiben', 'PenLine'), STEP('check', 'Crown'),
  ]),
  b: Object.freeze([
    STEP('situation', 'Star'), STEP('situation', 'Star'), STEP('situation', 'Star'),
    STEP('pruefung', 'Target'), STEP('sprechen', 'Mic'), STEP('schreiben', 'PenLine'),
    STEP('ueberarbeiten', 'RefreshCw'), STEP('check', 'Crown'),
  ]),
});

/** The skeleton for a level ('b…' → 8 steps, everything else → 7). */
export const stepSkeleton = (level) => (String(level || '').toLowerCase().startsWith('b') ? STEP_SKELETON.b : STEP_SKELETON.a);

/** The node icon (lucide name) per step kind; the situation steps show their letter instead. */
export const NODE_ICON = Object.freeze({
  situation: 'Star', text: 'Star', sprache: 'Star',
  pruefung: 'Target', sprechen: 'Mic', schreiben: 'PenLine', ueberarbeiten: 'RefreshCw', check: 'Crown',
});

/** The section name a Lehrwerk heads a step with (German, Sie). The situation steps are „Teil A/B/C". */
export const STEP_LABEL_DE = Object.freeze({
  situation: 'Teil',
  text: 'Teil',
  sprache: 'Teil',
  pruefung: 'Prüfungstraining',
  sprechen: 'Sprechen',
  schreiben: 'Schreiben',
  ueberarbeiten: 'Überarbeiten',
  check: 'Kapiteltest',
});

// A situation step whose outline carries no title (e.g. a B-level „sprache" step).
const FALLBACK_TITLE = Object.freeze({ situation: 'Situation', text: 'Text', sprache: 'Sprache im Fokus' });

/** Unit banner hues, cycling by unit order (design-tokens.js `courseHues`). */
// the live palette's hue first (COURSE_PALETTE = türkis, owner pick 2026-09-30), so Kapitel 1 opens in it
export const UNIT_HUES = Object.freeze(['tuerkis', 'orange', 'beere', 'gruen']);
export const hueFor = (index) => UNIT_HUES[((Number(index) || 0) % UNIT_HUES.length + UNIT_HUES.length) % UNIT_HUES.length];

/**
 * The path's wave: horizontal node offsets in px from the centre of the path, mirrored on
 * every second Kapitel — Duolingo's zig-zag (round 3, owner 2026-09-30: "make it duolingo
 * style"). The nodes carry no label cards any more, so the wave swings wide; its widest
 * swing plus half a node (36 px) and half the START bubble still fits a 360 px phone.
 */
export const ZIGZAG = Object.freeze([0, 44, 70, 44, 0, -44, -70, -44]);
export const zigzagOffset = (stepIndex, direction = 1) => ZIGZAG[stepIndex % ZIGZAG.length] * (direction < 0 ? -1 : 1) || 0;

/** The player URL of one step: the unit route plus `?s=<step number>` (the player opens that step). */
export const stepHref = (level, unitNr, stepNr) => `${v2Paths.unit(level, unitNr)}?s=${Number(stepNr)}`;

/** Minutes of one step: the unit's planned minutes over its steps, to the nearest 5 (min 5). */
export function stepMinutes(unitMinutes, steps) {
  const m = Number(unitMinutes);
  const n = Number(steps);
  if (!m || !n || m <= 0 || n <= 0) return null;
  return Math.max(5, Math.round(m / n / 5) * 5);
}

const ENDED = new Set([...DONE_STATUSES, 'tested_out']);

/**
 * Has the learner finished anything in this level? false → the page opens on the
 * course plan (first visit); true → on the daily goal and the path (returning).
 */
export function hasProgress(state) {
  const fs = state && state.finishedSteps instanceof Map ? state.finishedSteps : new Map();
  for (const set of fs.values()) if (set && set.size > 0) return true;
  const pr = state && state.progress instanceof Map ? state.progress : new Map();
  for (const row of pr.values()) if (row && ENDED.has(row.status)) return true;
  return false;
}

/** New words of the units the learner has finished (complete, gold or tested out) — manifest counts. */
export function wordsLearned(manifest, model) {
  if (!manifest || !model) return 0;
  const words = new Map((manifest.units || []).map((u) => [u && (u.unit || u.id), Number(u && u.counts && u.counts.newWords) || 0]));
  return (model.units || []).reduce((n, u) => n + (ENDED.has(u.status) ? words.get(u.id) || 0 : 0), 0);
}

// ---------------------------------------------------------------------------
// What a step teaches: its Lehrwerk label
// ---------------------------------------------------------------------------

/** 'Aussagesatz und W-Frage: das Verb auf Position 2 (…)' → 'Aussagesatz und W-Frage' (as the compiler shortens). */
export function shortLabel(label) {
  const s = String(label || '');
  const cut = [' (', ':', ';', ' – '].map((m) => s.indexOf(m)).filter((i) => i > 0);
  return (cut.length ? s.slice(0, Math.min(...cut)) : s).trim();
}

/**
 * Exam Teil labels grouped by module: ['Sprechen Teil 1', 'Sprechen Teil 2', 'Schreiben Teil 1']
 * → ['Sprechen Teil 1 + 2', 'Schreiben Teil 1']. A group whose module IS `drop` (the section's own
 * name) loses it: with drop 'Sprechen' → ['Teil 1 + 2', 'Schreiben Teil 1'].
 */
export function groupTeile(labels = [], drop = null) {
  const groups = [];
  for (const raw of labels) {
    const label = String(raw || '').trim();
    if (!label) continue;
    const m = /^(.*\S)\s+Teil\s+(\d+)$/.exec(label);
    const module = m ? m[1] : label;
    let g = groups.find((x) => x.module === module);
    if (!g) {
      g = { module, nrs: [] };
      groups.push(g);
    }
    if (m && !g.nrs.includes(m[2])) g.nrs.push(m[2]);
  }
  return groups.map((g) => {
    if (!g.nrs.length) return g.module;
    const teil = `Teil ${[...g.nrs].sort((a, b) => Number(a) - Number(b)).join(' + ')}`;
    return g.module === drop ? teil : `${g.module} ${teil}`;
  });
}

/** Exam templates → one grouped line: ['sd1.sp1', 'sd1.sp2'] with drop 'Sprechen' → 'Teil 1 + 2'. */
export const teilSummary = (templates = [], drop = null) => groupTeile((templates || []).map(teilLabel), drop).join(' + ');

const stripLetter = (title) => String(title || '').replace(/^(?:Text|Teil)\s+[A-H]\s*[:·–-]\s*/, '').trim();

/**
 * The Lehrwerk label of one section (curriculum.sectionsOf):
 *   A/B/C  → { tag: 'Teil A', title: 'Ich bin Priya. Und Sie?', label: 'A · Ich bin Priya. Und Sie?' }
 *   others → { tag: 'Prüfungstraining', title: 'Hören Teil 1', label: 'Prüfungstraining · Hören Teil 1' },
 *            'Sprechen · Teil 1 + 2 mit KI', 'Schreiben · Teil 1 mit KI-Korrektur', 'Kapiteltest'.
 */
export function stepLabel(section) {
  const s = section || {};
  if (s.letter) {
    const title = stripLetter(s.title) || FALLBACK_TITLE[s.kind] || 'Situation';
    return { tag: `Teil ${s.letter}`, title, label: `${s.letter} · ${title}` };
  }
  const tag = STEP_LABEL_DE[s.kind] || 'Schritt';
  const teile = teilSummary(s.teile, tag);
  let title = null;
  if (s.kind === 'pruefung') title = teile || null;
  else if (s.kind === 'sprechen') title = teile ? `${teile} mit KI` : 'Aufgabe mit KI';
  else if (s.kind === 'schreiben') title = teile ? `${teile} mit KI-Korrektur` : 'Aufgabe mit KI-Korrektur';
  else if (s.kind === 'ueberarbeiten') title = 'Ihren Text verbessern';
  return { tag, title, label: title ? `${tag} · ${title}` : tag };
}

const endStop = (s) => (/[.?!…]$/.test(s) ? s : `${s}.`);

/** The unit rows of the manifest by id. */
const manifestRows = (manifest) => new Map(((manifest && manifest.units) || []).filter(Boolean).map((u) => [u.unit || u.id, u]));

/**
 * The sections of one unit: its compiled outline (curriculum.sectionsOf), or — for a row
 * without one — the band's skeleton, with the loaded chunk's titles where it has them.
 */
export function unitSections(unitId, level, { row = null, titles = {} } = {}) {
  const outline = row && Array.isArray(row.outline) && row.outline.length
    ? row.outline
    : stepSkeleton(level).map((s, k) => ({ nr: k + 1, id: `${unitId}-ls${k + 1}`, kind: s.kind, title: null, skills: [], grammar: null, input: null, teile: [] }));
  return sectionsOf(outline).map((s, k) => {
    const id = s.id || `${unitId}-ls${k + 1}`;
    return { ...s, nr: Number(s.nr) || k + 1, id, title: s.title || (titles && titles[id]) || null };
  });
}

// ---------------------------------------------------------------------------
// The path
// ---------------------------------------------------------------------------

const stopLabel = (stop) => (stop.kind === 'closing' ? 'Abschlusstest' : `Plateau ${stop.nr} · Wiederholung`);

function stopDetail(stop, unitNrs) {
  if (stop.kind === 'closing') return 'Alle Prüfungsteile im Kleinen';
  const nrs = unitNrs.filter(Boolean);
  const span = nrs.length > 1 ? `Kapitel ${nrs[0]}–${nrs[nrs.length - 1]}` : nrs.length ? `Kapitel ${nrs[0]}` : 'Das Modul';
  return `${span} wiederholen · Prüfungsteile`;
}

function stopNode(stop, next, unitNrs = []) {
  const isNext = Boolean(next && next.kind === stop.kind && next.id === stop.id);
  const state = !stop.available ? 'unavailable' : stop.done ? 'done' : isNext ? 'current' : 'open';
  const label = stopLabel(stop);
  const said = { done: 'geschafft', current: stop.started ? 'jetzt weitermachen' : 'jetzt starten', open: 'noch offen', unavailable: 'kommt bald' }[state];
  return {
    kind: stop.kind,
    id: stop.id,
    nr: stop.nr || null,
    label,
    detail: stopDetail(stop, unitNrs),
    state,
    started: Boolean(stop.started),
    href: stop.available ? stop.href : null,
    offset: 0,
    ariaLabel: `${label}: ${said}`,
  };
}

/**
 * The current step of the path: the first unfinished step of the model's `next`
 * unit, or the `next` Plateau / closing block. null when everything is done.
 * → { kind: 'step', unitId, unitNr, stepNr, stepId, href, letter, tag } | { kind: 'unit', unitId, unitNr, href }
 *   | { kind: 'plateau' | 'closing', id, nr, started, href }
 * `manifest` (optional) gives the step its letter and section name from the unit's outline.
 */
export function currentStop(model, state = {}, { manifest = null } = {}) {
  const next = model && model.next;
  if (!next) return null;
  if (next.kind !== 'unit') return { kind: next.kind, id: next.id, nr: next.nr || null, started: Boolean(next.started), href: next.href };
  const sections = unitSections(next.id, model.level, { row: manifestRows(manifest).get(next.id) || null });
  const finished = (state && state.finishedSteps instanceof Map && state.finishedSteps.get(next.id)) || new Set();
  const i = sections.findIndex((s) => !finished.has(s.id));
  // every step finished but the unit not stored as done (the recap was not reached) → the unit itself
  if (i < 0) return { kind: 'unit', unitId: next.id, unitNr: next.nr, href: next.href };
  const s = sections[i];
  return {
    kind: 'step',
    unitId: next.id,
    unitNr: next.nr,
    stepNr: i + 1,
    stepId: s.id,
    href: stepHref(model.level, next.nr, i + 1),
    letter: s.letter || null,
    tag: stepLabel(s).tag,
  };
}

/** The label of the one primary action (the thumb-zone button) for the current stop. */
export function actionLabel(current, model) {
  if (!current) return '';
  if (current.kind === 'plateau') return current.started ? `Weiter mit Plateau ${current.nr}` : `Plateau ${current.nr} starten`;
  if (current.kind === 'closing') return current.started ? 'Weiter mit dem Abschlusstest' : 'Abschlusstest starten';
  if (current.kind === 'unit') return `Weiter mit Kapitel ${current.unitNr}`;
  const unit = model && (model.units || []).find((u) => u.id === current.unitId);
  const fresh = !unit || (unit.stepsDone === 0 && unit.status !== 'started');
  if (current.stepNr === 1 && fresh) return `Kapitel ${current.unitNr} starten`;
  const where = current.letter ? `Teil ${current.letter}` : current.tag || `Schritt ${current.stepNr}`;
  return `Weiter: Kapitel ${current.unitNr}, ${where}`;
}

/** What a Kapitel teaches in one line: „Grammatik: Präsens · Aussagesatz und W-Frage · 35 neue Wörter". */
export function kapitelSummary(row) {
  const r = row || {};
  const outline = Array.isArray(r.outline) && r.outline.length ? r.outline : null;
  // the outline's structures in step order; a unit whose steps name none (a B-level text
  // unit) or that is not compiled yet shows the grammar its spec plans
  const fromOutline = outline ? chapterSummary(outline).grammar.map((g) => g.short || shortLabel(g.label)).filter(Boolean) : [];
  const grammar = fromOutline.length ? fromOutline : [...new Set((r.grammar || []).map(shortLabel).filter(Boolean))];
  const n = Number(r.counts && r.counts.newWords);
  const newWords = Number.isFinite(n) && n > 0 ? n : null;
  const parts = [];
  if (grammar.length) parts.push(`Grammatik: ${grammar.join(' · ')}`);
  if (newWords) parts.push(`${newWords} neue Wörter`);
  return { grammar, newWords, line: parts.join(' · ') || null };
}

/**
 * coursePath(model, state, { etappenDe, stepTitles, manifest }) →
 *   { level, code, current, sections: [Section] }
 * Section = { nr, title, dividerLabel ('Modul 1 · Ankommen in Leipzig'), units: [Unit], stop: StopNode | null }
 * Unit    = { id, nr, index, title, hue, direction, available, status, done, stepsDone, stepsTotal,
 *             bannerLabel ('Kapitel 1 · 2 von 7 geschafft'), href (the Kapitel page | null), bannerAria,
 *             guideHref (the Kapitel guide, the banner's book button | null), eyebrow ('Modul 1 · Kapitel 1'),
 *             summary: { grammar, newWords, line }, minutesPerStep, hasCurrent, nodes: [Node],
 *             placeholders: [Placeholder] (the grey nodes of a Kapitel that is not compiled yet) }
 * Node    = { id, stepNr, kind, letter, icon, tag, title, label, grammar, skills, state: 'done'|'current'|'open',
 *             href, offset, ariaLabel }
 * StopNode = { kind, id, nr, label ('Plateau 1 · Wiederholung' | 'Abschlusstest'), detail, state, started, href, offset, ariaLabel }
 * `manifest` supplies the units' outlines, counts and grammar; `stepTitles` ({ [stepId]: title },
 * optional) names the steps of a loaded chunk where an outline has no title.
 */
export function coursePath(model, state = {}, { etappenDe = [], stepTitles = null, manifest = null } = {}) {
  if (!model) return null;
  const level = model.level;
  const finishedSteps = state && state.finishedSteps instanceof Map ? state.finishedSteps : new Map();
  const current = currentStop(model, state, { manifest });
  const order = new Map((model.units || []).map((u, i) => [u.id, i]));
  const titles = stepTitles && typeof stepTitles === 'object' ? stepTitles : {};
  const rows = manifestRows(manifest);

  const unitView = (row) => {
    const index = order.has(row.id) ? order.get(row.id) : 0;
    const direction = index % 2 === 0 ? 1 : -1;
    const done = DONE_STATUSES.includes(row.status);
    const finished = finishedSteps.get(row.id) || new Set();
    const mRow = rows.get(row.id) || null;
    const sections = row.available ? unitSections(row.id, level, { row: mRow, titles }) : [];
    const total = sections.length || stepSkeleton(level).length;
    const minutesPerStep = stepMinutes(row.minutes, total);
    const nodes = sections.map((s, k) => {
      const stepNr = k + 1;
      const isCurrent = Boolean(current && current.kind === 'step' && current.stepId === s.id);
      const nodeState = done || finished.has(s.id) ? 'done' : isCurrent ? 'current' : 'open';
      const { tag, title, label } = stepLabel(s);
      const grammar = s.grammar ? s.grammar.short || shortLabel(s.grammar.label) || null : null;
      const said = nodeState === 'done' ? 'Geschafft.' : nodeState === 'current' ? 'Jetzt starten.' : 'Noch offen.';
      const head = title ? `${tag}: ${title}` : tag;
      return {
        id: s.id,
        stepNr,
        kind: s.kind,
        letter: s.letter || null,
        icon: NODE_ICON[s.kind] || 'Star',
        tag,
        title,
        label,
        grammar,
        skills: s.skills || [],
        state: nodeState,
        href: stepHref(level, row.nr, stepNr),
        offset: zigzagOffset(k, direction),
        ariaLabel: [endStop(`Kapitel ${row.nr}, ${head}`), grammar ? endStop(`Grammatik: ${grammar}`) : null, said].filter(Boolean).join(' '),
      };
    });
    const stepsDone = done ? total : nodes.filter((n) => n.state === 'done').length;
    let bannerLabel = `Kapitel ${row.nr}`;
    if (!row.available) bannerLabel = `Kapitel ${row.nr} · kommt bald`;
    else if (done) bannerLabel = `Kapitel ${row.nr} · geschafft`;
    else if (stepsDone > 0) bannerLabel = `Kapitel ${row.nr} · ${stepsDone} von ${total} geschafft`;
    const title = row.title || `Kapitel ${row.nr}`;
    return {
      id: row.id,
      nr: row.nr,
      index,
      title,
      hue: hueFor(index),
      direction,
      available: row.available,
      status: row.status,
      done,
      stepsDone,
      stepsTotal: total,
      bannerLabel,
      href: row.available ? v2Paths.unit(level, row.nr) : null,
      guideHref: row.available ? guideHref(level, row.nr) : null,
      eyebrow: `Kapitel ${row.nr}`,
      bannerAria: `Kapitelübersicht: ${bannerLabel}, ${title}`,
      summary: kapitelSummary(mRow),
      minutesPerStep,
      hasCurrent: Boolean(current && (current.kind === 'step' || current.kind === 'unit') && current.unitId === row.id),
      nodes,
      placeholders: row.available ? [] : placeholderNodes(level, row.nr, direction),
    };
  };
  // the banner's eyebrow names the Modul too: „Modul 1 · Kapitel 1"
  const inModul = (nr) => (u) => ({ ...u, eyebrow: `Modul ${nr} · Kapitel ${u.nr}` });

  const sections = (model.etappen || []).map((e) => {
    const title = (Array.isArray(etappenDe) && etappenDe[e.nr - 1]) || null;
    const stop = e.plateau || e.closing || null;
    return {
      nr: e.nr,
      title,
      dividerLabel: title ? `Modul ${e.nr} · ${title}` : `Modul ${e.nr}`,
      units: e.units.map(unitView).map(inModul(e.nr)),
      stop: stop ? stopNode(stop, model.next, stop.kind === 'closing' ? [] : e.units.map((u) => u.nr)) : null,
    };
  });
  const placed = new Set(sections.flatMap((s) => s.units.map((u) => u.id)));
  const orphans = (model.units || []).filter((u) => !placed.has(u.id));
  if (orphans.length) sections.push({ nr: null, title: null, dividerLabel: 'Weitere Kapitel', units: orphans.map(unitView), stop: null });

  return { level, code: levelCode(level), current, sections };
}

// ---------------------------------------------------------------------------
// The course plan (first visit, and „Kursplan ansehen")
// ---------------------------------------------------------------------------

/**
 * The „Das steckt im Kurs" tiles — manifest content counts only. [] while any unit of
 * the level is still coming (the counts would describe part of a course). A tile
 * whose number is missing or 0 is left out.
 * → [{ key, n, label, lane? }]
 */
export function courseTiles(manifest) {
  const c = (manifest && manifest.counts) || null;
  if (!c) return [];
  if (Number(c.unitsComing) > 0) return [];
  const inCourse = c.inCourse || {};
  const planned = (manifest.units || []).map((u) => Number(u && u.minutesPlanned) || 0).filter(Boolean);
  const perStep = planned.length ? stepMinutes(planned.reduce((a, b) => a + b, 0) / planned.length, stepSkeleton(manifest.level).length) : null;
  const lane = (manifest.lanes && manifest.lanes.primary) || null;
  const tiles = [
    { key: 'units', n: c.units, label: 'Kapitel aus dem Alltag' },
    { key: 'lernschritte', n: c.lernschritte, label: perStep ? `Lernschritte à etwa ${perStep} Minuten` : 'Lernschritte' },
    { key: 'items', n: c.items, label: 'Übungen mit sofortigem Feedback' },
    { key: 'newWords', n: c.newWords, label: 'neue Wörter' },
    { key: 'grammar', n: c.ruleCards, label: 'Regelkarten zur Grammatik' },
    { key: 'speaking', n: inCourse.speakingTasks, label: 'Sprechaufgaben mit KI-Feedback' },
    { key: 'writing', n: inCourse.writingTasks, label: 'Schreibaufgaben mit KI-Korrektur' },
    { key: 'audio', n: c.audioLines, label: 'Sätze zum Anhören' },
    { key: 'closing', n: c.closingBlocks, label: Number(c.closingBlocks) === 1 ? 'Abschlusstest: alle Prüfungsteile im Kleinen' : 'Abschlusstests: alle Prüfungsteile im Kleinen', lane },
  ];
  return tiles
    .filter((t) => Number.isFinite(Number(t.n)) && Number(t.n) > 0)
    .map((t) => ({ ...t, n: Number(t.n) }));
}

const PART_ORDER = ['Hören', 'Lesen', 'Schreiben', 'Sprechen'];

/** The exam parts the course practises, from the units' Prüfungsfokus of the primary lane („Hören Teil 1" → „Hören"). */
export function examParts(manifest) {
  const lane = manifest && manifest.lanes && manifest.lanes.primary;
  if (!lane) return [];
  const seen = new Set();
  for (const u of (manifest.units || [])) {
    const list = (u && u.pruefungsfokus && u.pruefungsfokus[lane]) || [];
    for (const t of list) {
      const part = String(t || '').split(/\s+Teil\b/)[0].trim();
      if (part) seen.add(part);
    }
  }
  const known = PART_ORDER.filter((p) => seen.has(p));
  return [...known, ...[...seen].filter((p) => !PART_ORDER.includes(p))];
}

/**
 * A Kapitel's Kommunikation column: the part of each can-do before its „:" („grüßen:
 * Hallo! …" → „grüßen"); a bare verb keeps its first model sentence („sagen: Ich wohne in
 * Leipzig, in Lindenau." — a lone „sagen" says nothing). Can-dos written as whole „Ich
 * kann …" sentences (the B-level form) give way to the unit's can-do title, in Sie.
 */
export function kommunikationOf(row) {
  const r = row || {};
  const canDos = (Array.isArray(r.canDos) ? r.canDos : []).map((c) => String(c || '').trim()).filter(Boolean);
  if (canDos.some((c) => c.includes(':')) && !canDos.some((c) => /^Ich kann\b/.test(c))) {
    const out = [];
    for (const c of canDos) {
      const at = c.indexOf(':');
      let entry;
      if (at < 0) {
        entry = c.replace(/^Ich kann\s+/, '').replace(/[.]$/, '').trim();
      } else {
        const head = c.slice(0, at).trim();
        const rest = c.slice(at + 1).trim();
        entry = head;
        if (head && !/\s/.test(head) && rest) {
          const first = (rest.match(/^.*?[.?!…](?=\s|$)/) || [rest])[0].trim();
          entry = `${head}: ${first}`;
        }
      }
      if (entry && !out.includes(entry)) out.push(entry);
    }
    return out;
  }
  const t = String(r.canDoTitle || '').trim().replace(/^Sie können\s+/, '').replace(/\.$/, '');
  if (t) return [t];
  return canDos.slice(0, 3).map((c) => shortLabel(c.replace(/^Ich kann\s+/, '')).split(', ')[0]);
}

const TEXT_SKILLS = { dialog: ['hoeren'], text: ['lesen'], mixed: ['hoeren', 'lesen'] };

/**
 * The plan's textbook „Inhalt": per Modul its Kapitel with the columns every Lehrwerk
 * Inhalt has — Kommunikation, Grammatik, Wortschatz, Texte, Prüfung — then the Plateau /
 * Abschlusstest that closes it.
 * → [{ nr, eyebrow ('Modul 1'), title (showcase.etappenDe | null), hue, kapitel: [Kapitel], end: End | null }]
 * Kapitel = { id, nr, title, href, available, done, current, kommunikation: [..], grammatik: [..],
 *             wortschatz: n | null, texte: [{ title, skills }], pruefung: [..] }
 * End     = { kind, nr, label, detail, href, available, done }
 */
export function planInhalt(model, manifest) {
  if (!model) return [];
  const names = (manifest && manifest.showcase && manifest.showcase.etappenDe) || [];
  const rows = manifestRows(manifest);
  const nextId = model.next && model.next.kind === 'unit' ? model.next.id : null;
  return (model.etappen || []).map((e, i) => {
    const stop = e.plateau || e.closing || null;
    return {
      nr: e.nr,
      eyebrow: `Modul ${e.nr}`,
      title: names[e.nr - 1] || null,
      hue: hueFor(i),
      kapitel: e.units.map((u) => {
        const row = rows.get(u.id) || {};
        const outline = Array.isArray(row.outline) && row.outline.length ? row.outline : null;
        const summary = outline ? chapterSummary(outline) : null;
        const sum = kapitelSummary(row);
        return {
          id: u.id,
          nr: u.nr,
          title: u.title || `Kapitel ${u.nr}`,
          href: u.available ? u.href : null,
          available: u.available,
          done: DONE_STATUSES.includes(u.status),
          current: u.id === nextId,
          kommunikation: kommunikationOf(row),
          grammatik: sum.grammar,
          wortschatz: sum.newWords,
          texte: summary ? summary.texts.map((t) => ({ title: t.title, skills: TEXT_SKILLS[t.kind] || ['lesen'] })) : [],
          pruefung: summary && summary.teile.length ? groupTeile(summary.teile.map(teilLabel)) : groupTeile(u.pruefungsfokus || []),
        };
      }),
      end: stop
        ? {
          kind: stop.kind,
          nr: stop.nr || null,
          label: stopLabel(stop),
          detail: stopDetail(stop, e.units.map((u) => u.nr)),
          href: stop.available ? stop.href : null,
          available: Boolean(stop.available),
          done: Boolean(stop.done),
        }
        : null,
    };
  });
}

/**
 * „So ist jedes Kapitel aufgebaut": the stations of every Kapitel in order, for the plan's
 * strip. A levels have 7 steps, B levels add „Überarbeiten" before the Kapiteltest; the
 * Plateau after every 3 Kapitel closes the list (with the review ladder where the manifest
 * has one).
 * → [{ key, title, text, skills: [SKILL_ORDER key] }]
 */
export function kapitelAufbau(level, manifest = null) {
  const b = String(level || '').toLowerCase().startsWith('b');
  const days = (manifest && manifest.review && Array.isArray(manifest.review.ladderDays) ? manifest.review.ladderDays : []).slice(0, 3);
  const ladder = days.length === 3 ? ` Mit Konto kommen Ihre Wörter nach ${days[0]}, ${days[1]} und ${days[2]} Tagen wieder.` : '';
  return [
    { key: 'einstieg', title: 'Einstieg', text: 'Eine Szene aus der Geschichte und Ihre Lernziele.', skills: [] },
    {
      key: 'abc',
      title: 'Teil A, B und C',
      text: 'Drei Situationen aus dem Alltag. In jedem Teil:',
      skills: ['wortschatz', 'hoeren', 'lesen', 'grammatik', 'ueben', 'sprechen', 'schreiben', 'aussprache'],
    },
    { key: 'pruefung', title: 'Prüfungstraining', text: 'Prüfungsteile im Prüfungsformat.', skills: ['pruefung'] },
    { key: 'sprechen', title: 'Sprechen mit KI', text: 'Sie sprechen, die KI hört zu und gibt Feedback.', skills: ['sprechen'] },
    { key: 'schreiben', title: 'Schreiben mit KI-Korrektur', text: 'Sie schreiben, die KI korrigiert Ihren Text.', skills: ['schreiben'] },
    ...(b ? [{ key: 'ueberarbeiten', title: 'Überarbeiten', text: 'Sie verbessern Ihren Text mit dem Feedback.', skills: ['schreiben'] }] : []),
    { key: 'check', title: 'Kapiteltest', text: 'Was Sie im Kapitel gelernt haben, in einem kurzen Test.', skills: ['test'] },
    { key: 'plateau', title: 'Alle 3 Kapitel: ein Plateau', text: `Wiederholung mit Prüfungsteilen und einer Schatzkiste.${ladder}`, skills: [] },
  ];
}

/**
 * The two reference pages of a level (built by the player side): the grammar overview and
 * the word list. The word count is the manifest's — the level's total once every unit is
 * authored, else the new words of the authored units only (a content count, never a plan).
 * → [{ key, href, title, detail, label, skill }]
 */
export function referenceLinks(level, manifest = null) {
  const l = normalizeLevel(level) || String(level || '').toLowerCase();
  const c = (manifest && manifest.counts) || {};
  let words = Number(c.newWords) || 0;
  if (Number(c.unitsComing) > 0) {
    words = ((manifest && manifest.units) || []).reduce((n, u) => n + (u && u.chunk ? Number(u.counts && u.counts.newWords) || 0 : 0), 0);
  }
  return [
    { key: 'grammatik', href: `/course/${l}/grammatik`, title: 'Grammatik-Übersicht', detail: 'Alle Regeln', label: 'Grammatik-Übersicht', skill: 'grammatik' },
    {
      key: 'wortschatz',
      href: `/course/${l}/wortschatz`,
      title: 'Wortliste',
      detail: words > 0 ? `${words} Wörter` : 'Alle Wörter',
      label: words > 0 ? `Wortliste · ${words} Wörter` : 'Wortliste',
      skill: 'wortschatz',
    },
  ];
}

// ---------------------------------------------------------------------------
// Pace (the plan's „Ihr Tempo" and the daily goal)
// ---------------------------------------------------------------------------

export const PACE_ORDER = Object.freeze(['leicht', 'standard', 'intensiv']);
export const PACE_NAME_DE = Object.freeze({ leicht: 'Leicht', standard: 'Standard', intensiv: 'Intensiv' });

/** The localStorage key of the pace a learner picked on this device, per level. */
export const paceStorageKey = (level) => `dm_course_v2_pace:${String(level || '').toLowerCase()}`;

/**
 * The pace the page uses: a pick made on this page > the signed-in learner's
 * learner_goals pace > the one stored on this device > the fallback. Only presets
 * the manifest knows count.
 */
export function resolvePace(manifest, { picked = null, goalPace = null, storedPace = null, fallback = 'standard' } = {}) {
  const presets = (manifest && manifest.pace) || {};
  const known = (p) => typeof p === 'string' && Object.prototype.hasOwnProperty.call(presets, p);
  for (const p of [picked, goalPace, storedPace, fallback]) if (known(p)) return p;
  return Object.keys(presets)[0] || fallback;
}

/**
 * The pace choices of the plan: [{ id, name, learningDays, minutes, weeks, finishDate }]
 * — minutes per learning day from gamify.dailyGoalMinutes, weeks and the finish date
 * from pacePlan.planSummary for the steps still open.
 */
export function paceOptions(manifest, { remainingSteps = 0, today = new Date() } = {}) {
  const presets = (manifest && manifest.pace) || {};
  const ids = [...PACE_ORDER.filter((p) => presets[p]), ...Object.keys(presets).filter((p) => !PACE_ORDER.includes(p))];
  return ids.map((id) => {
    const plan = planSummary({ manifest, pace: id, remainingSteps, today });
    return {
      id,
      name: PACE_NAME_DE[id] || id,
      learningDays: Number(presets[id].learningDays) || null,
      minutes: dailyGoalMinutes(manifest, id),
      weeks: plan.weeks,
      finishDate: plan.finishDate,
    };
  });
}

/** The date locale of each chrome language (strings.js): „22. Dezember" | "22 December". */
export const DATE_LOCALE = Object.freeze({ de: 'de-DE', en: 'en-GB' });

/** „22. Dezember" (this year) or „16. März 2027" — the plan's finish date, de-DE unless a locale is given. */
export function formatFinishDate(date, today = new Date(), locale = DATE_LOCALE.de) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const opts = d.getFullYear() === today.getFullYear()
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' };
  try {
    return d.toLocaleDateString(locale || DATE_LOCALE.de, opts);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** XP a finished step earns (gamify.js XP.step) — the current card's „+20 XP". */
export const STEP_XP = XP.step;

// ---------------------------------------------------------------------------
// The learn screen (round 3, owner 2026-09-30: "it looks intimidating and too much,
// can we change the view to make it in duolingo style and for everything to be step
// for step"). Duolingo on the surface, the textbook one tap deep: the path draws big
// round nodes only, a tapped node's popover names the step and holds its one button,
// a Kapitel banner's book button opens the Kapitel guide, and a first visit opens on a
// three-screen welcome instead of the long plan (which moved into the „Kursplan" sheet).
// ---------------------------------------------------------------------------

/** The Kapitel guide (the banner's book button): the Kapitel page in its guide view. */
export function guideHref(level, nr) {
  return `${v2Paths.unit(level, nr)}?view=guide`;
}

/** The DOM id of a node on the path (a step, a Plateau, the Abschlusstest) — the page scrolls to it. */
export const nodeAnchor = (id) => `dm-node-${id}`;

/** The DOM id of the path's current place, or null when everything is done. */
export function currentAnchor(current) {
  if (!current) return null;
  if (current.kind === 'step') return nodeAnchor(current.stepId);
  if (current.kind === 'unit') return nodeAnchor(`${current.unitId}-abschluss`);
  return nodeAnchor(current.id);
}

// The end of the path (audit CRITIC-02): a learner who has finished every Kapitel used to
// land on Kapitel 1 with twelve Kapitel of ticks — currentAnchor(null) had nowhere to scroll,
// the path said nothing, and the trophy only offered „Wiederholen". Now the path ends in a
// calm card under the trophy, and the page scrolls there: a headline and ONE next action —
// the Abschlusstest while it is open, else the word list, with the honest line that the next
// level is not released yet (no link to a level that does not exist, no price).

/** The DOM id of the end-of-path card; the page scrolls to it once every Kapitel is done. */
export const FINISH_ANCHOR = 'dm-kurs-ende';

const LEVEL_ORDER = Object.freeze(['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2']);

/** The level after this one, as a code („A1.2"), or null after B2.2. */
export function nextLevelCode(level) {
  const i = LEVEL_ORDER.indexOf(normalizeLevel(level) || String(level || '').toLowerCase());
  return i >= 0 && i < LEVEL_ORDER.length - 1 ? levelCode(LEVEL_ORDER[i + 1]) : null;
}

/**
 * The end of the path once every Kapitel of the level is done (and every compiled Plateau):
 * → null (still Kapitel or a Plateau to go) |
 *   { anchor, complete, title, body, action: { label, href } }
 *   complete — the Abschlusstest is submitted too: „A1.1 geschafft!", the next level is not
 *              released yet (said, not linked), the action opens the word list;
 *   otherwise — „Alle 12 Kapitel geschafft!", the action is the Abschlusstest (or, while it is
 *              not compiled, the word list and „kommt bald").
 * In the chrome language (tv), Sie.
 */
export function courseFinish(model, { lang = 'de' } = {}) {
  if (!model) return null;
  const units = model.units || [];
  if (!units.length || !units.every((u) => u.available && DONE_STATUSES.includes(u.status))) return null;
  const next = model.next || null;
  if (next && next.kind !== 'closing') return null;
  const n = units.length;
  const words = { label: tv('finish.toWords', lang), href: `/course/${normalizeLevel(model.level) || model.level}/wortschatz` };
  if (next) {
    return {
      anchor: FINISH_ANCHOR,
      complete: false,
      title: tv('finish.chaptersTitle', lang, { n }),
      body: tv('finish.closingLeft', lang),
      action: { label: tv(next.started ? 'finish.resumeClosing' : 'as.startClosing', lang), href: next.href },
    };
  }
  const closing = (model.etappen || []).map((e) => e && e.closing).find(Boolean) || null;
  if (closing && !closing.done) {
    // every Kapitel done, the Abschlusstest not compiled yet
    return { anchor: FINISH_ANCHOR, complete: false, title: tv('finish.chaptersTitle', lang, { n }), body: tv('finish.closingSoon', lang), action: words };
  }
  const following = nextLevelCode(model.level);
  const body = [closing ? tv('finish.courseBody', lang, { n }) : null, following ? tv('finish.nextNotYet', lang, { next: following }) : null].filter(Boolean).join(' ');
  return { anchor: FINISH_ANCHOR, complete: true, title: tv('finish.courseTitle', lang, { code: model.code || levelCode(model.level) }), body, action: words };
}

/**
 * The grey nodes of a Kapitel that is not compiled yet: the band's skeleton, in the
 * wave, never a link — tapped, their popover says „Kommt bald".
 * → [{ id, stepNr, kind, icon, state: 'soon', href: null, offset, ariaLabel }]
 */
export function placeholderNodes(level, unitNr, direction = 1) {
  return stepSkeleton(level).map((s, k) => ({
    id: `kapitel-${unitNr}-soon-${k + 1}`,
    stepNr: k + 1,
    kind: s.kind,
    icon: s.icon,
    state: 'soon',
    href: null,
    offset: zigzagOffset(k, direction),
    ariaLabel: `Kapitel ${unitNr}, Lernschritt ${k + 1}: kommt bald.`,
  }));
}

/** „Lernschritt 1 von 7": where a step sits in its Kapitel (the popover's small line). */
export const stepOfLine = (stepNr, total) => `Lernschritt ${Number(stepNr)} von ${Number(total)}`;

/**
 * What the popover under a tapped step node says. → { title, meta, action, href, tone }
 *   title  'Teil A · Ich bin Priya. Und Sie?' | 'Prüfungstraining · Hören Teil 1' | 'Kapiteltest'
 *   meta   'Lernschritt 1 von 7'
 *   action 'Start +20 XP' (current) | 'Wiederholen' (done) | 'Trotzdem starten' (not yet — the
 *          gate stays soft) | null (not compiled: the title says „Kommt bald")
 *   tone   'hue' (done, current: the Kapitel's colour) | 'quiet' (not yet) | 'soon'
 * The page sets the action in capitals (CSS), so screen readers get words, not letters.
 */
export function nodePopover(node, { stepsTotal, unitNr = null, xp = STEP_XP } = {}) {
  const n = node || {};
  if (n.state === 'soon' || !n.href) {
    return { title: 'Kommt bald', meta: `${unitNr ? `Kapitel ${unitNr}` : 'Dieses Kapitel'} ist noch in Arbeit.`, action: null, href: null, tone: 'soon' };
  }
  const title = n.title ? `${n.tag} · ${n.title}` : n.tag || `Lernschritt ${n.stepNr}`;
  const meta = stepOfLine(n.stepNr, stepsTotal);
  if (n.state === 'current') return { title, meta, action: xp ? `Start +${xp} XP` : 'Start', href: n.href, tone: 'hue' };
  if (n.state === 'done') return { title, meta, action: 'Wiederholen', href: n.href, tone: 'hue' };
  return { title, meta, action: 'Trotzdem starten', href: n.href, tone: 'quiet' };
}

/** The popover of a Plateau chest or the Abschlusstest trophy (tone 'xp': the gold of the chest). */
export function stopPopover(stop) {
  const s = stop || {};
  if (s.state === 'unavailable' || !s.href) return { title: s.label, meta: 'Kommt bald', action: null, href: null, tone: 'soon' };
  if (s.state === 'current') return { title: s.label, meta: s.detail, action: s.started ? 'Weitermachen' : 'Start', href: s.href, tone: 'xp' };
  if (s.state === 'done') return { title: s.label, meta: s.detail, action: 'Wiederholen', href: s.href, tone: 'xp' };
  return { title: s.label, meta: s.detail, action: 'Trotzdem starten', href: s.href, tone: 'quiet' };
}

/**
 * Every step of a Kapitel finished but its recap not reached (the unit is not stored as
 * done): the path's current place is the Kapitel itself, so one extra node after its steps
 * closes it. null for every other Kapitel.
 */
export function finishNode(current, unit) {
  if (!current || current.kind !== 'unit' || !unit || current.unitId !== unit.id) return null;
  const title = `Kapitel ${unit.nr} abschließen`;
  return {
    id: `${unit.id}-abschluss`,
    state: 'current',
    icon: 'Flag',
    href: current.href,
    offset: 0,
    ariaLabel: `${title}: alle Lernschritte geschafft. Jetzt weitermachen.`,
    popover: { title, meta: 'Alle Lernschritte geschafft', action: 'Weiter', href: current.href, tone: 'hue' },
  };
}

/** The current node's progress ring: the Kapitel's finished steps, in percent. */
export function unitPercent(unit) {
  const total = Number(unit && unit.stepsTotal) || 0;
  if (!total) return 0;
  return Math.min(100, Math.round(((Number(unit.stepsDone) || 0) / total) * 100));
}

/** The top bar's daily-goal ring: minutes today of the pace's minutes per learning day. */
export function goalRing(todayMinutes, goalMinutes) {
  const done = Math.max(0, Math.round(Number(todayMinutes) || 0));
  const goal = Math.max(1, Math.round(Number(goalMinutes) || 0) || 1);
  const pct = Math.min(100, Math.round((done / goal) * 100));
  return {
    done,
    goal,
    pct,
    reached: done >= goal,
    label: done >= goal ? `Tagesziel geschafft: heute ${done} von ${goal} Minuten` : `Tagesziel: heute ${done} von ${goal} Minuten`,
  };
}

// ---------------------------------------------------------------------------
// The first-visit welcome: three short screens, one thing each
// ---------------------------------------------------------------------------

/** The localStorage key that remembers, per level and device, that the welcome was finished or skipped. */
export const welcomeStorageKey = (level) => `dm_course_v2_welcome:${String(level || '').toLowerCase()}`;

/** The welcome shows once: nothing finished in the level, and not finished or skipped on this device. */
export function showWelcome(state, stored) {
  return !hasProgress(state) && !stored;
}

const sentencesOf = (text) => (String(text || '').replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]+(?=\s|$)|[^.!?…]+$/g) || []).map((s) => s.trim()).filter(Boolean);

/**
 * The narrator's bubble: the promise's first sentence (who the learner meets) and its
 * last (what they will do), when both together stay short — else the first alone.
 * 'Sie lernen Deutsch mit Priya. Sie kommt … Mit ihr lernen Sie Schritt für Schritt …'
 * → 'Sie lernen Deutsch mit Priya. Mit ihr lernen Sie Schritt für Schritt …'
 */
export function shortPromise(text, max = 120) {
  const s = sentencesOf(text);
  if (!s.length) return null;
  if (s.length === 1) return s[0];
  const both = `${s[0]} ${s[s.length - 1]}`;
  return both.length <= max ? both : s[0];
}

/** A can-do's head ends in its verb: an infinitive („fragen", „sammeln", „erinnern", „tun", „sein"). */
const VERB_END = /(?:e[lr]?n|tun|sein)$/;

/**
 * One can-do as one short line: its first part before a „, " or „ und " that is still a
 * phrase — two words or more AND ending in a verb — capitalised; when the first cut leaves
 * no verb, the next cut is tried. 'sich vorstellen und andere … fragen' → 'Sich vorstellen';
 * 'im Kurs und im Büro um etwas bitten und …' → 'Im Kurs und im Büro um etwas bitten' (never
 * the stub „Im Kurs"); 'Ihre Familie vorstellen' stays. The full list is in the Kursplan.
 */
export function outcomeLine(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const cuts = [];
  for (const m of [', ', ' und ']) {
    for (let i = s.indexOf(m); i > 0; i = s.indexOf(m, i + 1)) cuts.push(i);
  }
  let out = s;
  for (const cut of cuts.sort((a, b) => a - b)) {
    const head = s.slice(0, cut).trim();
    if (head.split(' ').length >= 2 && VERB_END.test(head)) {
      out = head;
      break;
    }
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** „12 Kapitel · 4 Module · Abschlusstest" — counted from the manifest, never typed; in the chrome language. */
export function courseShape(manifest, lang = 'de') {
  const m = manifest || {};
  const units = Array.isArray(m.units) ? m.units.length : 0;
  const modules = Array.isArray(m.etappen) ? m.etappen.length : 0;
  const halbtest = m.closing && m.closing.halbtest && typeof m.closing.halbtest === 'object' ? Object.keys(m.closing.halbtest).length : 0;
  const closing = halbtest > 0 || Number(m.counts && m.counts.closingBlocks) > 0;
  const parts = [];
  if (units) parts.push(units === 1 ? tv('welcome.chapterOne', lang) : tv('welcome.chapters', lang, { n: units }));
  if (modules) parts.push(modules === 1 ? tv('welcome.moduleOne', lang) : tv('welcome.modules', lang, { n: modules }));
  if (closing) parts.push(tv('welcome.finalTest', lang));
  return parts.join(' · ') || null;
}

/**
 * Three can-dos spread over the level — the first, one about two thirds in, the last — so
 * the promise reaches past Kapitel 1–3 („Sich vorstellen · Im Café bestellen · Ihren Plan
 * mit Deutsch nennen"), never a level-specific list of indices. Three or fewer: all of them.
 */
export function spreadOutcomes(lines) {
  const all = [...new Set((Array.isArray(lines) ? lines : []).map(outcomeLine).filter(Boolean))];
  if (all.length <= 3) return all;
  const n = all.length;
  return [...new Set([0, Math.floor((n * 2) / 3), n - 1])].map((i) => all[i]);
}

/**
 * The welcome's content. A screen whose data the level lacks is left out (no showcase →
 * no „hallo" and no „ziele"); no screen at all → no welcome. Chrome strings follow `lang`;
 * the promise and the can-dos are content and stay German.
 * → { code, narrator ('Priya' on the A1 levels, whose cast she is | null), promise, heading,
 *     outcomes: [≤ 3 short lines spread over the level], shape,
 *     note ('Kostenlos · Auf dem Weg zum Goethe-Zertifikat A1': the free flag from
 *     manifest.priceKey === null — the Kursplan's one source — and the primary lane; null
 *     when neither applies), screens: ['hallo' | 'ziele' | 'tempo'] }
 */
export function welcomeModel(manifest, level, { lang = 'de' } = {}) {
  const code = levelCode(level);
  const sc = (manifest && manifest.showcase) || {};
  const promise = shortPromise(sc.promiseDe);
  const outcomes = spreadOutcomes(sc.outcomesDe);
  const hasPace = Boolean(manifest && manifest.pace && typeof manifest.pace === 'object' && Object.keys(manifest.pace).length);
  const l = normalizeLevel(level) || String(level || '').toLowerCase();
  const free = Boolean(manifest) && manifest.priceKey === null;
  const lane = (manifest && manifest.lanes && manifest.lanes.primary) || null;
  const note = [free ? tv('welcome.free', lang) : null, lane ? tv('welcome.lane', lang, { exam: laneLabel(lane) }) : null].filter(Boolean).join(' · ') || null;
  return {
    code,
    narrator: l.startsWith('a1') ? 'Priya' : null,
    promise,
    heading: tv('welcome.outcomes', lang, { code }),
    outcomes,
    shape: courseShape(manifest, lang),
    note,
    screens: [promise ? 'hallo' : null, outcomes.length ? 'ziele' : null, hasPace ? 'tempo' : null].filter(Boolean),
  };
}

const PACE_NAME_KEY = Object.freeze({ leicht: 'welcome.paceLeicht', standard: 'welcome.paceStandard', intensiv: 'welcome.paceIntensiv' });

/**
 * One pace tile of the welcome (paceOptions → the three big tiles of „Wie viel Zeit haben
 * Sie pro Tag?"), in the chrome language.
 * → { id, name ('Standard'), title ('35 Minuten' | '35 minutes'), days ('an 4 Tagen pro
 *     Woche' | 'on 4 days a week'), finish ('fertig etwa am 22. Dezember' | 'done around 22 December') }
 */
export function paceTile(option, { allDone = false, today = new Date(), lang = 'de' } = {}) {
  const o = option || {};
  const finish = !allDone && o.weeks > 0 && o.finishDate ? formatFinishDate(o.finishDate, today, DATE_LOCALE[lang] || DATE_LOCALE.de) : '';
  return {
    id: o.id,
    name: PACE_NAME_KEY[o.id] ? tv(PACE_NAME_KEY[o.id], lang) : o.name,
    title: tv('welcome.minutes', lang, { n: o.minutes }),
    days: o.learningDays ? tv('welcome.days', lang, { n: o.learningDays }) : null,
    finish: finish ? tv('welcome.finish', lang, { date: finish }) : null,
  };
}
