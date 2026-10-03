// Course v2 — the Plateaus and the closing block as the player walks them (BLUEPRINT §5.2, §5.3,
// §7.3 S8/S10; SCHEMA §2 learner-state ids, §10, §13). Pure: no React, no I/O, no clock.
//
// A compiled Plateau (src/data/course-v2/<level>/plateaus/pN.json) is walked as SECTIONS, in the
// order BLUEPRINT §5.2 gives them:
//   review      the review set the compiler drew from the unit reserves (`review.items`, each item
//               with its `unit` and `step`, so a miss maps back to its Lernschritt)
//   teil        one per exam Teil (`examTeile`): an ExamBlock, a WritingTask or a SpeakingTask
//   productive  the separate productive task (`productive`)
//   reward      the Lesemagazin / Hörmagazin / scene / project — never graded, never required
// A compiled closing block (closing/<id>.json, the .1 Halbtest) is its `parts`, one section each.
//
// Learner state reuses the unit's (progress.js, localState.js): lektion_id = the Plateau or closing
// id (SCHEMA §2), one step MARKER per finished section (item_id = the section id), the answered
// items as lesson_attempts rows. A section is finished when its items are answered — right or
// wrong — or, for a writing/speaking Teil, when it was SUBMITTED as a real attempt (the same rule
// as a unit's Aufgaben; a Teil left without submitting stays open). The Plateau or closing block
// is SUBMITTED (lesson_progress 'complete', which is what completion.js counts for the course) when
// every required section is finished. Nothing here reads a score to decide anything (PRG-01).
import { closingFormFor, CLOSING_DOT1, CLOSING_DOT2, DONE_STATUSES } from './completion.js';

export const SECTION_KINDS = Object.freeze(['review', 'block', 'writing', 'speaking', 'reward']);
/** The lesson_attempts stage of an assessment's rows (the unit's rows carry the step kind). */
export const ASSESSMENT_STAGE = Object.freeze({ plateau: 'plateau', closing: 'abschluss' });

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const itemsOf = (list) => (Array.isArray(list) ? list.filter((x) => isObj(x) && typeof x.id === 'string') : []);

/** The kind of one Plateau/closing Teil: 'block' (ExamBlock), 'writing', 'speaking' — or null. */
export function partKind(part) {
  if (!isObj(part)) return null;
  if (Array.isArray(part.items) && typeof part.template === 'string' && typeof part.id === 'string') return 'block';
  if (typeof part.taskDe === 'string' && typeof part.bankKey === 'string') return 'writing';
  if (typeof part.bankKey === 'string' && (isObj(part.aiRole) || Array.isArray(part.parts))) return 'speaking';
  return null;
}

/** 'plateau' | 'closing' | null — by the compiled file's own fields. */
export function assessmentKind(doc) {
  if (!isObj(doc)) return null;
  if (Array.isArray(doc.examTeile)) return 'plateau';
  if (Array.isArray(doc.parts)) return 'closing';
  return null;
}

function partSection(part, role) {
  const kind = partKind(part);
  if (!kind) return null;
  return {
    id: kind === 'block' ? part.id : part.bankKey,
    kind,
    role,
    required: true,
    template: typeof part.template === 'string' ? part.template : (Array.isArray(part.parts) && part.parts[0] && part.parts[0].template) || null,
    length: kind === 'block' ? part.length || null : null,
    part,
    items: kind === 'block' ? itemsOf(part.items) : [],
  };
}

/**
 * The sections of a compiled Plateau or closing block, in serving order.
 * → [{ id, kind, role, required, template, length, part, items }]
 */
export function assessmentSections(doc) {
  const kind = assessmentKind(doc);
  if (!kind) return [];
  const out = [];
  if (kind === 'plateau') {
    const review = itemsOf(doc.review && doc.review.items);
    if (review.length) {
      out.push({ id: `${doc.id}-review`, kind: 'review', role: 'review', required: true, template: null, length: null, part: doc.review, items: review });
    }
    for (const p of doc.examTeile) {
      const s = partSection(p, 'teil');
      if (s) out.push(s);
    }
    const productive = partSection(doc.productive, 'productive');
    if (productive) out.push(productive);
    const r = isObj(doc.reward) ? doc.reward : null;
    if (r && (r.lesemagazin || r.hoermagazin || r.scene || r.projekt)) {
      const items = [...itemsOf(r.lesemagazin && r.lesemagazin.items), ...itemsOf(r.hoermagazin && r.hoermagazin.items)];
      out.push({ id: `${doc.id}-reward`, kind: 'reward', role: 'reward', required: false, template: null, length: null, part: r, items });
    }
  } else {
    for (const p of doc.parts) {
      const s = partSection(p, 'teil');
      if (s) out.push(s);
    }
  }
  return out;
}

/** Every Line of the file by id (exam texts, the Hörmagazin, a scene) — ItemView's `lines`. */
export function assessmentLines(doc) {
  const map = new Map();
  const visit = (x) => {
    if (Array.isArray(x)) { x.forEach(visit); return; }
    if (!isObj(x)) return;
    if (typeof x.id === 'string' && typeof x.speaker === 'string' && typeof x.de === 'string') map.set(x.id, x);
    for (const v of Object.values(x)) visit(v);
  };
  visit(doc && doc.texts);
  visit(doc && doc.reward);
  return map;
}

const asSet = (x) => (x instanceof Set ? x : new Set(x || []));
const asMap = (x) => (x instanceof Map ? x : new Map(Object.entries(x || {})));

/**
 * One section's result. Item sections: { answered, correct, total } from the answers
 * ({ itemId: correct }, the latest answer per item); tasks: { submitted }. `done` = its marker.
 */
export function sectionResult(section, { answers = new Map(), finished = new Set() } = {}) {
  const a = asMap(answers);
  const done = asSet(finished).has(section.id);
  if (section.kind === 'writing' || section.kind === 'speaking') return { id: section.id, kind: section.kind, done, submitted: done };
  const ids = section.items.map((it) => it.id);
  const answered = ids.filter((id) => a.has(id));
  return {
    id: section.id,
    kind: section.kind,
    done,
    answered: answered.length,
    correct: answered.filter((id) => a.get(id) === true).length,
    total: ids.length,
  };
}

/**
 * Where the walk stands: { complete, required, done, open: [section] }. `complete` = every
 * required section finished (the reward never counts); a stored complete/gold stays complete.
 */
export function assessmentProgress(sections, finished, storedStatus = null) {
  const f = asSet(finished);
  const required = (sections || []).filter((s) => s.required);
  const open = required.filter((s) => !f.has(s.id));
  return {
    complete: DONE_STATUSES.includes(storedStatus) || (required.length > 0 && open.length === 0),
    required: required.length,
    done: required.length - open.length,
    open,
  };
}

/** The lesson_progress status to hold now: 'complete' once submitted (never taken back), else 'started'. */
export function assessmentStatus(sections, finished, storedStatus = null) {
  if (DONE_STATUSES.includes(storedStatus)) return storedStatus;
  if (assessmentProgress(sections, finished).complete) return 'complete';
  return 'started';
}

/** Where a (re)opened Plateau continues: the first section not finished; sections.length when all are. */
export function resumeSection(sections, finished) {
  const f = asSet(finished);
  const i = (sections || []).findIndex((s) => !f.has(s.id));
  return i === -1 ? (sections || []).length : i;
}

/**
 * The review set's misses mapped back to their Lernschritte (BLUEPRINT §5.2): per step with at
 * least one item answered wrong → { unit, step, missed, total }, in unit/step order.
 */
export function reviewRepairs(section, answers = new Map()) {
  if (!section || section.kind !== 'review') return [];
  const a = asMap(answers);
  const byStep = new Map();
  for (const it of section.items) {
    const step = it.step || null;
    if (!step) continue;
    if (!byStep.has(step)) byStep.set(step, { unit: it.unit || step.replace(/-ls\d$/, ''), step, missed: 0, total: 0 });
    const row = byStep.get(step);
    row.total += 1;
    if (a.has(it.id) && a.get(it.id) !== true) row.missed += 1;
  }
  return [...byStep.values()].filter((r) => r.missed > 0).sort((x, y) => (x.step < y.step ? -1 : x.step > y.step ? 1 : 0));
}

/**
 * The unit where an exam Teil was practised last before this point — the repair link of a Teil with
 * misses („Hören Teil 1: 4 von 6 — üben Sie ihn in Lektion 3"). `label` is the Teil's label as the
 * manifest's Prüfungsfokus writes it (content.teilLabel); `upTo` the last unit number to consider.
 * → the manifest row ({ unit, nr, title, chunk }) or null.
 */
export function unitPractising(manifest, lane, label, upTo = 12) {
  const rows = ((manifest && manifest.units) || []).filter((r) => r && typeof r === 'object' && r.chunk && Number(r.nr) <= upTo);
  const hits = rows.filter((r) => {
    const pf = r.pruefungsfokus && lane ? r.pruefungsfokus[lane] : null;
    return Array.isArray(pf) && pf.includes(label);
  });
  return hits.length ? hits[hits.length - 1] : null;
}

/**
 * The Teil-Karte of a closing block (BLUEPRINT §5.3, S10): one row per Teil — never a total, never
 * a pass line. `practised`: 'miniature' (a shortened block, or a Teil played in the Lernmodus of a
 * .1 course), 'full' (a full-length block), or null (not done yet); `next` from the compiler's
 * `comesNext` — { level, unit, nr, title } or { level, unit: null } („in A1.2").
 */
export function teilKarte(doc, sections, { answers = new Map(), finished = new Set() } = {}) {
  const next = doc && isObj(doc.comesNext) ? doc.comesNext : null;
  return (sections || []).filter((s) => s.role === 'teil').map((s) => {
    const r = sectionResult(s, { answers, finished });
    const hit = next && next.byTemplate && s.template ? next.byTemplate[s.template] : null;
    return {
      id: s.id,
      kind: s.kind,
      template: s.template,
      practised: r.done ? (s.kind === 'block' && s.length === 'full' ? 'full' : 'miniature') : null,
      correct: r.correct ?? null,
      total: r.total ?? null,
      submitted: r.submitted ?? null,
      next: next ? (hit ? { level: next.level, unit: hit.unit, nr: hit.nr, title: hit.title || null } : { level: next.level, unit: null, nr: null, title: null }) : null,
    };
  });
}

/**
 * The closing id a learner needs (SCHEMA §5 CLOSING): the Halbtest (.1) or Modelltest A (.2) of the
 * learner's lane, else the primary lane's. The course's own required entry decides the kind.
 */
export function closingIdFor(manifest, learnerLane = null) {
  if (!manifest) return null;
  const required = manifest.completion && manifest.completion.course && Array.isArray(manifest.completion.course.required)
    ? manifest.completion.course.required
    : [];
  const req = required.find((r) => r && (r.kind === 'halbtest' || r.kind === 'modelltest'))
    || (manifest.kind === 'dot2' ? CLOSING_DOT2 : CLOSING_DOT1);
  try {
    return closingFormFor(manifest, req, learnerLane);
  } catch {
    return null;
  }
}

/**
 * The latest answer per item from lesson_attempts rows (oldest first): { itemId → correct }.
 * Step-marker rows (the section ids) are not answers and are skipped.
 */
export function answersFromRows(rows = [], markerStages = []) {
  const out = new Map();
  for (const r of rows || []) {
    if (!r || !r.item_id || markerStages.includes(r.stage)) continue;
    out.set(r.item_id, r.correct === true);
  }
  return out;
}
