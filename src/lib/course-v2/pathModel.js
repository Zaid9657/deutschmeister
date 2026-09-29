// Course v2 — the course home's LEARNING PATH and COURSE PLAN view model (owner
// decision 2026-09-29: "gamify it, make it similar to Duolingo … when the user
// starts, he should SEE THE PLAN").
//
// Pure: courseHomeModel(...) (homeModel.js) + the learner's state + the manifest
// in, everything the page draws out. Nothing here renders, fetches or stores; the
// page (src/pages/course-v2/CourseHomeV2Page.jsx) and src/components/course-v2/home/*
// only draw it. Pinned by tests/course-v2-home.test.mjs.
//
// Rules it carries:
//   - the path is the fixed skeleton per unit (BLUEPRINT §3.1–§3.2): A levels 7
//     Lernschritte (ls1–3 situation, ls4 pruefung, ls5 sprechen, ls6 schreiben,
//     ls7 check), B levels 8 (ls7 ueberarbeiten, ls8 check) — the home has no step
//     kinds without loading every unit chunk, so it uses the slots, exactly like
//     homeModel.lernschrittIds;
//   - a node is `done` when its step id is in state.finishedSteps (or the unit is
//     complete/gold), `current` when it is the first unfinished step of the model's
//     `next` unit, `open` otherwise — and EVERY node of a compiled unit links (the
//     gate stays soft, BLUEPRINT §3.5): `${v2Paths.unit(level, nr)}?s=${stepNr}`;
//   - a unit that is not compiled has no nodes and no link („kommt bald");
//   - numbers shown come from the manifest only (content counts, never usage
//     counts — CLAUDE.md "User-facing counts are content counts"); a count that is
//     missing hides its tile, and a level whose units are not all authored yet
//     shows no content tiles at all (its counts would describe a fraction).
import { v2Paths, levelCode } from './ids.js';
import { DONE_STATUSES } from './completion.js';
import { XP, dailyGoalMinutes } from './gamify.js';
import { planSummary } from './pacePlan.js';

const STEP = (kind, icon) => Object.freeze({ kind, icon });

/** The Lernschritt skeleton of a unit per band: kind + the node's icon name (lucide). */
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

/** Learner-facing name of a step kind (German, Sie) — the fallback when the chunk's title is not loaded. */
export const STEP_LABEL_DE = Object.freeze({
  situation: 'Situation',
  pruefung: 'Prüfungsteil',
  sprechen: 'Sprechen mit KI',
  schreiben: 'Schreiben mit KI',
  ueberarbeiten: 'Überarbeiten',
  check: 'Lektionstest',
});

/** Unit banner hues, cycling by unit order (design-tokens.js `courseHues`). */
export const UNIT_HUES = Object.freeze(['gruen', 'orange', 'beere', 'tuerkis']);
export const hueFor = (index) => UNIT_HUES[((Number(index) || 0) % UNIT_HUES.length + UNIT_HUES.length) % UNIT_HUES.length];

/** The zig-zag: horizontal node offsets in px, mirrored on every second unit. */
export const ZIGZAG = Object.freeze([0, 52, 76, 52, 0, -52, -76, -52]);
export const zigzagOffset = (stepIndex, direction = 1) => ZIGZAG[stepIndex % ZIGZAG.length] * (direction < 0 ? -1 : 1) || 0;

/** The player URL of one step: the unit route plus `?s=<step number>` (the player opens that step). */
export const stepHref = (level, unitNr, stepNr) => `${v2Paths.unit(level, unitNr)}?s=${Number(stepNr)}`;

/** Minutes of one Lernschritt: the unit's planned minutes over its steps, to the nearest 5 (min 5). */
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

const stopLabel = (stop) => (stop.kind === 'closing' ? 'Abschlusstest' : `Wiederholung ${stop.nr} · Schatzkiste`);

function stopNode(stop, next) {
  const isNext = Boolean(next && next.kind === stop.kind && next.id === stop.id);
  const state = !stop.available ? 'unavailable' : stop.done ? 'done' : isNext ? 'current' : 'open';
  const label = stopLabel(stop);
  const said = { done: 'geschafft', current: stop.started ? 'jetzt weitermachen' : 'jetzt starten', open: 'noch offen', unavailable: 'kommt bald' }[state];
  return {
    kind: stop.kind,
    id: stop.id,
    nr: stop.nr || null,
    label,
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
 * → { kind: 'step', unitId, unitNr, stepNr, stepId, href } | { kind: 'unit', unitId, unitNr, href }
 *   | { kind: 'plateau' | 'closing', id, nr, started, href }
 */
export function currentStop(model, state = {}) {
  const next = model && model.next;
  if (!next) return null;
  if (next.kind !== 'unit') return { kind: next.kind, id: next.id, nr: next.nr || null, started: Boolean(next.started), href: next.href };
  const skeleton = stepSkeleton(model.level);
  const finished = (state.finishedSteps instanceof Map && state.finishedSteps.get(next.id)) || new Set();
  const i = skeleton.findIndex((_, k) => !finished.has(`${next.id}-ls${k + 1}`));
  // every step finished but the unit not stored as done (the recap was not reached) → the unit itself
  if (i < 0) return { kind: 'unit', unitId: next.id, unitNr: next.nr, href: next.href };
  return { kind: 'step', unitId: next.id, unitNr: next.nr, stepNr: i + 1, stepId: `${next.id}-ls${i + 1}`, href: stepHref(model.level, next.nr, i + 1) };
}

/** The label of the one primary action (the thumb-zone button) for the current stop. */
export function actionLabel(current, model) {
  if (!current) return '';
  if (current.kind === 'plateau') return current.started ? `Weiter mit Wiederholung ${current.nr}` : `Wiederholung ${current.nr} starten`;
  if (current.kind === 'closing') return current.started ? 'Weiter mit dem Abschlusstest' : 'Abschlusstest starten';
  if (current.kind === 'unit') return `Weiter mit Lektion ${current.unitNr}`;
  const unit = model && (model.units || []).find((u) => u.id === current.unitId);
  const fresh = !unit || (unit.stepsDone === 0 && unit.status !== 'started');
  return current.stepNr === 1 && fresh ? `Lektion ${current.unitNr} starten` : `Weiter: Lernschritt ${current.stepNr}`;
}

/**
 * coursePath(model, state, { etappenDe, stepTitles, manifest }) →
 *   { level, code, current, sections: [Section] }
 * Section = { nr, title, dividerLabel, units: [Unit], stop: StopNode | null }
 * Unit    = { id, nr, index, title, hue, direction, available, status, done, stepsDone, stepsTotal,
 *             bannerLabel, minutesPerStep, hasCurrent, nodes: [Node] }
 * Node    = { id, stepNr, kind, icon, label, title, state: 'done'|'current'|'open', href, offset, ariaLabel }
 * `stepTitles` ({ [stepId]: title }, optional) names the steps of a loaded chunk.
 */
export function coursePath(model, state = {}, { etappenDe = [], stepTitles = null } = {}) {
  if (!model) return null;
  const level = model.level;
  const skeleton = stepSkeleton(level);
  const finishedSteps = state && state.finishedSteps instanceof Map ? state.finishedSteps : new Map();
  const current = currentStop(model, state);
  const order = new Map((model.units || []).map((u, i) => [u.id, i]));
  const titles = stepTitles && typeof stepTitles === 'object' ? stepTitles : {};

  const unitView = (row) => {
    const index = order.has(row.id) ? order.get(row.id) : 0;
    const direction = index % 2 === 0 ? 1 : -1;
    const done = DONE_STATUSES.includes(row.status);
    const finished = finishedSteps.get(row.id) || new Set();
    const minutesPerStep = stepMinutes(row.minutes, skeleton.length);
    const nodes = !row.available ? [] : skeleton.map((s, k) => {
      const stepNr = k + 1;
      const id = `${row.id}-ls${stepNr}`;
      const isCurrent = Boolean(current && current.kind === 'step' && current.stepId === id);
      const nodeState = done || finished.has(id) ? 'done' : isCurrent ? 'current' : 'open';
      const label = STEP_LABEL_DE[s.kind] || 'Lernschritt';
      const title = titles[id] || null;
      const name = title || label;
      const said = nodeState === 'done' ? 'geschafft' : nodeState === 'current' ? 'jetzt starten' : 'noch offen';
      return {
        id,
        stepNr,
        kind: s.kind,
        icon: s.icon,
        label,
        title,
        state: nodeState,
        href: stepHref(level, row.nr, stepNr),
        offset: zigzagOffset(k, direction),
        ariaLabel: `Lernschritt ${stepNr} von ${skeleton.length}, ${name}: ${said}`,
      };
    });
    const stepsDone = done ? skeleton.length : nodes.filter((n) => n.state === 'done').length;
    let bannerLabel = `Lektion ${row.nr}`;
    if (!row.available) bannerLabel = `Lektion ${row.nr} · kommt bald`;
    else if (done) bannerLabel = `Lektion ${row.nr} · geschafft`;
    else if (stepsDone > 0) bannerLabel = `Lektion ${row.nr} · ${stepsDone} von ${skeleton.length} geschafft`;
    return {
      id: row.id,
      nr: row.nr,
      index,
      title: row.title || `Lektion ${row.nr}`,
      hue: hueFor(index),
      direction,
      available: row.available,
      status: row.status,
      done,
      stepsDone,
      stepsTotal: skeleton.length,
      bannerLabel,
      minutesPerStep,
      hasCurrent: Boolean(current && (current.kind === 'step' || current.kind === 'unit') && current.unitId === row.id),
      nodes,
    };
  };

  const sections = (model.etappen || []).map((e) => {
    const title = (Array.isArray(etappenDe) && etappenDe[e.nr - 1]) || null;
    const stop = e.plateau || e.closing || null;
    return {
      nr: e.nr,
      title,
      dividerLabel: title ? `Etappe ${e.nr} · ${title}` : `Etappe ${e.nr}`,
      units: e.units.map(unitView),
      stop: stop ? stopNode(stop, model.next) : null,
    };
  });
  const placed = new Set(sections.flatMap((s) => s.units.map((u) => u.id)));
  const orphans = (model.units || []).filter((u) => !placed.has(u.id));
  if (orphans.length) sections.push({ nr: null, title: null, dividerLabel: 'Weitere Lektionen', units: orphans.map(unitView), stop: null });

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
    { key: 'units', n: c.units, label: 'Lektionen aus dem Alltag' },
    { key: 'lernschritte', n: c.lernschritte, label: perStep ? `Lernschritte à etwa ${perStep} Minuten` : 'Lernschritte' },
    { key: 'items', n: c.items, label: 'Übungen mit sofortigem Feedback' },
    { key: 'newWords', n: c.newWords, label: 'neue Wörter' },
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
 * The plan's „Ihr Weg in N Etappen": per Etappe its title (showcase.etappenDe, else
 * „Etappe N"), its units and what closes it.
 * → [{ nr, title, hue, units: [{ id, nr, title, href, available, done }], end: { kind, label } | null }]
 */
export function planEtappen(model, manifest) {
  if (!model) return [];
  const names = (manifest && manifest.showcase && manifest.showcase.etappenDe) || [];
  return (model.etappen || []).map((e, i) => {
    const stop = e.plateau || e.closing || null;
    return {
      nr: e.nr,
      title: names[e.nr - 1] || `Etappe ${e.nr}`,
      hue: hueFor(i),
      units: e.units.map((u) => ({
        id: u.id, nr: u.nr, title: u.title || `Lektion ${u.nr}`, href: u.available ? u.href : null, available: u.available, done: DONE_STATUSES.includes(u.status),
      })),
      end: stop ? { kind: stop.kind, label: stop.kind === 'closing' ? 'Abschlusstest · Pokal' : `Wiederholung ${stop.nr} · Schatzkiste`, done: Boolean(stop.done) } : null,
    };
  });
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

/** „22. Dezember" (this year) or „16. März 2027" — the plan's finish date, de-DE. */
export function formatFinishDate(date, today = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const opts = d.getFullYear() === today.getFullYear()
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' };
  try {
    return d.toLocaleDateString('de-DE', opts);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** XP a finished Lernschritt earns (gamify.js XP.step) — the popover's „+20 XP". */
export const STEP_XP = XP.step;
