// Course v2 — THE completion function (SCHEMA §5 `course.completion`, BLUEPRINT §3.5, PRG-02).
//
// Completion is defined once, as data, in each level's course.json; this module
// is the one reader of that block. The course home, the Teilnahmebescheinigung,
// the reminder view and any metric ask it — none of them re-derives "complete".
// Pure: no I/O, no clock, no React. The caller loads the learner's rows and
// hands them in (see LearnerState below).
//
// The rules, as BLUEPRINT §3.5 states them:
//   - a Lernschritt is FINISHED when every item served in it was answered, right or wrong;
//   - an Aufgabe is SUBMITTED only as a real attempt: writing ≥ 50 % of the lower word
//     bound (never an empty or pasted-prompt text); speaking ≥ 20 s of detected speech
//     or ≥ 2 turns in a card mode;
//   - a unit is COMPLETE when all its Lernschritte are finished or tested out AND both
//     Aufgaben are submitted;
//   - a course is COMPLETE when 12 units are complete, P1–P3 are submitted and the
//     closing block's first form OF THE LEARNER'S LANE is submitted: the Halbtest (.1) or
//     Modelltest A (.2) — SCHEMA §5 `CLOSING`; the free week-1 Diagnose never counts.
// NO SCORE IS EVER REQUIRED, and nothing here reads one (PRG-01: no gate reads an AI
// score). The Überarbeiten step (B: LS7) improves the Schreiben Aufgabe and is never a
// completion requirement — the Aufgabe counts from its first real attempt.
//
// LearnerState (every field optional; the normaliser accepts the forms listed):
//   progress       lesson_progress rows [{ lektion_id, status }] or { [id]: status } or a Map —
//                  status of unit / Plateau / closing / Modelltest ids
//                  ('started' | 'complete' | 'gold' | 'tested_out')
//   finishedSteps  Lernschritt ids the player recorded as finished (array or Set)
//   submitted      bank keys (or slot keys) of Aufgaben with a real attempt, e.g. one per
//                  writing_submissions row or graded speaking session (array or Set)
//   attempts       { [bankKey]: [Attempt] } — raw evidence, judged here by isAufgabeSubmitted
//   lane           the lane of the learner's learner_goals row for this course's band (SCHEMA §14),
//                  which `lane: 'learner'` in a CLOSING entry names. Absent, or a lane the course
//                  has no closing form for: the course's primary lane (then its first closing lane).
// For a .2 course whose Modelltests still run on the legacy src/data/mockExams runner,
// the caller maps a submitted exam_attempts row to progress[<Modelltest form id>] = 'complete'.

// SCHEMA §5 `CLOSING` — the third entry of `completion.course.required`, by course kind.
export const CLOSING_DOT1 = Object.freeze({ kind: 'halbtest', lane: 'learner', status: 'submitted' });
export const CLOSING_DOT2 = Object.freeze({ kind: 'modelltest', form: 'a', lane: 'learner', status: 'submitted' });

function schemaBlock(closing) {
  return Object.freeze({
    lernschritt: Object.freeze({ finishedWhen: 'all-items-answered' }),
    aufgabe: Object.freeze({
      submittedWhen: Object.freeze({ writingMinShareOfLowerBound: 0.5, formAllFieldsNonEmpty: true, speakingMinSeconds: 20, cardModeMinTurns: 2 }),
    }),
    unit: Object.freeze({
      completeWhen: Object.freeze(['lernschritte-finished-or-tested-out', 'aufgaben-submitted']),
      testOutThreshold: 0.8,
    }),
    course: Object.freeze({
      required: Object.freeze([
        Object.freeze({ kind: 'unit', status: 'complete', count: 12 }),
        Object.freeze({ kind: 'plateau', status: 'submitted', count: 3 }),
        closing,
      ]),
      neverRequired: Object.freeze(['score', 'fokus', 'mehr-ueben', 'extensive', 'diagnose', 'modelltest:b', 'modelltest:c']),
    }),
  });
}

/** SCHEMA §5 defaults of a .1 course (kind 'dot1') — used only for keys a course.json leaves out. */
export const DEFAULT_COMPLETION = schemaBlock(CLOSING_DOT1);
/** SCHEMA §5 defaults of a .2 course (kind 'dot2'): the same block closed by Modelltest A. */
export const DEFAULT_COMPLETION_DOT2 = schemaBlock(CLOSING_DOT2);
/** The SCHEMA §5 default block for a course kind ('dot1' | 'dot2'; anything else: 'dot1'). */
export const defaultCompletion = (kind) => (kind === 'dot2' ? DEFAULT_COMPLETION_DOT2 : DEFAULT_COMPLETION);

/** Step kinds finished by answering their items (credited by a passed test-out). */
export const LERNSCHRITT_KINDS = Object.freeze(['situation', 'text', 'sprache', 'pruefung', 'check']);
/** Step kinds that are the unit's two Aufgaben (submitted by a real attempt). */
export const AUFGABE_KINDS = Object.freeze(['sprechen', 'schreiben']);
/** Step kinds that never decide completion. */
export const OPTIONAL_STEP_KINDS = Object.freeze(['ueberarbeiten']);
/** Speaking modes in which ≥ cardModeMinTurns turns count as a real attempt. */
export const CARD_MODES = Object.freeze(['cards-ask', 'cards-request']);
/** lesson_progress statuses that satisfy both 'complete' and 'submitted'. */
export const DONE_STATUSES = Object.freeze(['complete', 'gold']);
/** Share of a text's word 4-grams found in the task prompt at which it counts as the prompt pasted back. */
export const PASTED_PROMPT_SHARE = 0.8;

const STATUS_SATISFIES = { complete: DONE_STATUSES, submitted: DONE_STATUSES };
/** Kinds counted over the course's own lists (`count` required). */
const COUNTED_KINDS = ['unit', 'plateau'];
/** Closing kinds (SCHEMA §5 CLOSING): one form of one lane, `count` 1 unless stated. */
const CLOSING_KINDS = ['halbtest', 'modelltest'];
const COURSE_REQUIRED_KINDS = [...COUNTED_KINDS, ...CLOSING_KINDS];
const MODELLTEST_FORMS = ['a', 'b', 'c'];
const LANE_RE = /^(?:sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2)$/;
const UNIT_CONDITIONS = {
  'lernschritte-finished-or-tested-out': (u) => u.lernschritteFinished,
  'aufgaben-submitted': (u) => u.aufgabenSubmitted,
};
const LANE_SUFFIX_RE = /-(?:sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2)$/;

// ── rules ────────────────────────────────────────────────────────────────────

/** One `completion.course.required` entry, checked and normalised (closing kinds get count 1, form 'a'). */
function requiredEntry(req, neverRequired) {
  if (!req || typeof req !== 'object') throw new Error('completion: a required entry must be an object');
  if (!COURSE_REQUIRED_KINDS.includes(req.kind)) throw new Error(`completion: unknown required kind '${req.kind}'`);
  if (!STATUS_SATISFIES[req.status]) throw new Error(`completion: unknown required status '${req.status}'`);
  if (neverRequired.includes(req.kind)) throw new Error(`completion: '${req.kind}' is both required and never required`);
  if (COUNTED_KINDS.includes(req.kind)) {
    if (!Number.isInteger(req.count) || req.count < 0) throw new Error(`completion: bad count for '${req.kind}'`);
    return { kind: req.kind, status: req.status, count: req.count };
  }
  // CLOSING: { kind: 'halbtest', lane, status } | { kind: 'modelltest', form, lane, status }
  const count = req.count === undefined ? 1 : req.count;
  if (!Number.isInteger(count) || count < 0) throw new Error(`completion: bad count for '${req.kind}'`);
  if (req.lane !== 'learner' && !LANE_RE.test(String(req.lane))) {
    throw new Error(`completion: unknown required lane '${req.lane}' for '${req.kind}' (expected 'learner' or a lane id)`);
  }
  const out = { kind: req.kind, lane: req.lane, status: req.status, count };
  if (req.kind === 'modelltest') {
    const form = req.form === undefined ? 'a' : req.form;
    if (!MODELLTEST_FORMS.includes(form)) throw new Error(`completion: unknown Modelltest form '${form}'`);
    if (neverRequired.includes(`modelltest:${form}`)) throw new Error(`completion: 'modelltest:${form}' is both required and never required`);
    out.form = form;
  } else if (req.form !== undefined) {
    throw new Error(`completion: '${req.kind}' takes no form`);
  }
  return out;
}

/**
 * The completion rules of a course: its course.json `completion` block, with the
 * SCHEMA defaults of its kind for anything left out. Throws on a block this module
 * cannot honour (an unknown unit condition, required kind, status, lane or form, or a
 * kind that is both required and never-required) — a schema change must fail loudly,
 * never pass silently.
 */
export function completionRules(course) {
  const c = (course && course.completion) || {};
  const defaults = defaultCompletion(course && course.kind);
  const neverRequired = [...((c.course && c.course.neverRequired) || defaults.course.neverRequired)];
  const rules = {
    lernschritt: { ...defaults.lernschritt, ...(c.lernschritt || {}) },
    aufgabe: {
      submittedWhen: { ...defaults.aufgabe.submittedWhen, ...((c.aufgabe && c.aufgabe.submittedWhen) || {}) },
    },
    unit: { ...defaults.unit, ...(c.unit || {}) },
    course: {
      required: ((c.course && c.course.required) || defaults.course.required).map((req) => requiredEntry(req, neverRequired)),
      neverRequired,
    },
  };
  if (rules.lernschritt.finishedWhen !== 'all-items-answered') {
    throw new Error(`completion: unknown lernschritt.finishedWhen '${rules.lernschritt.finishedWhen}'`);
  }
  for (const token of rules.unit.completeWhen) {
    if (!UNIT_CONDITIONS[token]) throw new Error(`completion: unknown unit condition '${token}'`);
  }
  return rules;
}

// ── state ────────────────────────────────────────────────────────────────────

/** The Aufgabe slot of a bank key: the key without its lane suffix ('a21-u07-w-ta2' → 'a21-u07-w'). */
export function slotOfBankKey(bankKey) {
  return typeof bankKey === 'string' ? bankKey.replace(LANE_SUFFIX_RE, '') : '';
}

function toMap(progress) {
  if (progress instanceof Map) return new Map(progress);
  const m = new Map();
  if (Array.isArray(progress)) {
    for (const row of progress) if (row && row.lektion_id) m.set(row.lektion_id, row.status);
  } else if (progress && typeof progress === 'object') {
    for (const [id, status] of Object.entries(progress)) m.set(id, status);
  }
  return m;
}

/** Normalise a LearnerState (see the header) into Maps and Sets. */
export function normalizeLearnerState(state) {
  const s = state || {};
  const attempts = new Map();
  const rawAttempts = s.attempts instanceof Map ? Object.fromEntries(s.attempts) : s.attempts || {};
  for (const [key, list] of Object.entries(rawAttempts)) {
    const slot = slotOfBankKey(key);
    attempts.set(slot, [...(attempts.get(slot) || []), ...(Array.isArray(list) ? list : [list])]);
  }
  return {
    progress: toMap(s.progress),
    finishedSteps: new Set(s.finishedSteps || []),
    submittedSlots: new Set([...(s.submitted || [])].map(slotOfBankKey)),
    attempts,
    lane: typeof s.lane === 'string' && LANE_RE.test(s.lane) ? s.lane : null,
  };
}

// ── Lernschritt ──────────────────────────────────────────────────────────────

/** finishedWhen 'all-items-answered': every served item has an answer, right or wrong. */
export function isLernschrittFinished(servedItemIds, answeredItemIds) {
  const served = [...(servedItemIds || [])];
  if (served.length === 0) return false;
  const answered = new Set(answeredItemIds || []);
  return served.every((id) => answered.has(id));
}

/** Test-out („Ich kann das schon"): correct / total ≥ threshold (course or unit value). */
export function testOutPassed(result, threshold = DEFAULT_COMPLETION.unit.testOutThreshold) {
  const correct = Number(result && result.correct) || 0;
  const total = Number(result && result.total) || 0;
  return total > 0 && correct / total >= threshold;
}

// ── Aufgabe ──────────────────────────────────────────────────────────────────

/** Words in a learner text: whitespace-separated tokens that carry a letter or a digit. */
export function countWords(text) {
  if (typeof text !== 'string') return 0;
  return text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function ngrams(list, n) {
  const out = [];
  for (let i = 0; i + n <= list.length; i += 1) out.push(list.slice(i, i + n).join(' '));
  return out;
}

/**
 * Share (0…1) of a text that is the task prompt pasted back: its word 4-grams found in
 * the prompt's 4-grams (texts under four words: its words found among the prompt's).
 */
export function promptEchoShare(text, promptTexts) {
  const t = tokens(text);
  if (t.length === 0) return 0;
  const p = tokens((promptTexts || []).filter(Boolean).join(' '));
  if (p.length === 0) return 0;
  if (t.length < 4) {
    const words = new Set(p);
    return t.filter((w) => words.has(w)).length / t.length;
  }
  const grams = new Set(ngrams(p, 4));
  const own = ngrams(t, 4);
  return own.filter((g) => grams.has(g)).length / own.length;
}

function promptTextsOf(task) {
  const parts = [task.title, task.situationDe, task.taskDe, task.promptDe, task.instructionsDe];
  for (const lp of task.leitpunkte || []) parts.push(lp && lp.de);
  return parts.filter((x) => typeof x === 'string');
}

function taskShape(task) {
  if (!task) return null;
  if (task.form && Array.isArray(task.form.fields)) return 'form';
  if (task.mode === 'written') return 'written-micro';
  if (task.mode === 'spoken') return 'spoken-micro';
  if (Array.isArray(task.wordBand)) return 'writing';
  if (typeof task.mode === 'string') return 'speaking';
  return null;
}

/**
 * Is this attempt a REAL attempt at the task (BLUEPRINT §3.5)? Never reads a score.
 *   WritingTask / written MicroOutput: Attempt { text } (preferred) or { words }; the lower
 *     bound is the smaller of wordBand / wordBandLearning (MicroOutput: words), so the band
 *     the learner was actually given always suffices.
 *   SpeakingTask / spoken MicroOutput: Attempt { speechSeconds, turns } — turns count only
 *     in a card mode.
 *   Form task (`form_fill`: sd1.s1, ta2.s1): Attempt { fields: { [fieldId]: value } } (or
 *     `values`); formAllFieldsNonEmpty — every field non-empty, right or wrong (SCHEMA §5).
 */
export function isAufgabeSubmitted(task, attempt, rules = DEFAULT_COMPLETION) {
  if (!task || !attempt) return false;
  const sw = { ...DEFAULT_COMPLETION.aufgabe.submittedWhen, ...((rules.aufgabe && rules.aufgabe.submittedWhen) || {}) };
  const shape = taskShape(task);

  if (shape === 'form') {
    const values = (attempt.fields && typeof attempt.fields === 'object' && attempt.fields) || (attempt.values && typeof attempt.values === 'object' && attempt.values) || {};
    const filled = task.form.fields.map((f) => String((f && values[f.id]) ?? '').trim() !== '');
    if (filled.length === 0) return false;
    return sw.formAllFieldsNonEmpty === false ? filled.some(Boolean) : filled.every(Boolean);
  }
  if (shape === 'writing' || shape === 'written-micro') {
    if (attempt.pastedPrompt === true) return false;
    const text = typeof attempt.text === 'string' ? attempt.text : null;
    const words = text !== null ? countWords(text) : Number(attempt.words) || 0;
    const bands = shape === 'writing' ? [task.wordBand, task.wordBandLearning] : [task.words];
    const lowers = bands.filter((b) => Array.isArray(b) && Number(b[0]) > 0).map((b) => Number(b[0]));
    const lower = lowers.length ? Math.min(...lowers) : 1;
    if (words < Math.max(1, Math.ceil(sw.writingMinShareOfLowerBound * lower))) return false;
    if (text !== null && promptEchoShare(text, promptTextsOf(task)) >= PASTED_PROMPT_SHARE) return false;
    return true;
  }
  if (shape === 'speaking' || shape === 'spoken-micro') {
    if ((Number(attempt.speechSeconds) || 0) >= sw.speakingMinSeconds) return true;
    return shape === 'speaking' && CARD_MODES.includes(task.mode) && (Number(attempt.turns) || 0) >= sw.cardModeMinTurns;
  }
  return false;
}

// ── unit ─────────────────────────────────────────────────────────────────────

/**
 * Completion of one unit (SCHEMA §8 unit, compiled or authored). `rules` is the course's
 * completion block (course.completion or completionRules(course)); SCHEMA defaults fill gaps.
 * → { unitId, complete, status, testedOut, lernschritteFinished, aufgabenSubmitted,
 *     lernschritte: { done, total, missing }, aufgaben: { done, total, missing }, optional }
 * `status` is what lesson_progress should hold for the unit now ('complete' | 'gold' |
 * 'tested_out' | 'started' | null). A unit already stored as complete/gold stays complete —
 * completion is never taken away.
 */
export function unitCompletion(unit, state, rules = DEFAULT_COMPLETION) {
  const r = completionRules({ completion: rules || {} });
  const st = state && state.submittedSlots instanceof Set ? state : normalizeLearnerState(state);
  const stored = st.progress.get(unit.id) || null;
  const alreadyDone = DONE_STATUSES.includes(stored);
  const testedOut = stored === 'tested_out';

  const lernschritte = [];
  const aufgaben = [];
  const optional = [];
  for (const step of unit.steps || []) {
    if (AUFGABE_KINDS.includes(step.kind)) {
      const task = step.task || {};
      const slot = slotOfBankKey(task.bankKey);
      const evidence = st.attempts.get(slot) || [];
      const done = alreadyDone || (slot !== '' && st.submittedSlots.has(slot)) || evidence.some((a) => isAufgabeSubmitted(task, a, r));
      aufgaben.push({ id: step.id, kind: step.kind, bankKey: task.bankKey || null, done });
    } else if (OPTIONAL_STEP_KINDS.includes(step.kind)) {
      optional.push({ id: step.id, kind: step.kind, done: st.finishedSteps.has(step.id) });
    } else {
      // LERNSCHRITT_KINDS — and any kind this module does not know, which is then held
      // to the strict rule (must be finished) rather than silently waived.
      const credited = testedOut && LERNSCHRITT_KINDS.includes(step.kind);
      lernschritte.push({ id: step.id, kind: step.kind, done: alreadyDone || credited || st.finishedSteps.has(step.id) });
    }
  }

  const summary = (list) => ({
    done: list.filter((x) => x.done).length,
    total: list.length,
    missing: list.filter((x) => !x.done).map((x) => x.bankKey || x.id),
  });
  const ls = summary(lernschritte);
  const au = summary(aufgaben);
  const values = {
    lernschritteFinished: ls.total > 0 && ls.done === ls.total,
    aufgabenSubmitted: au.done === au.total,
  };
  const complete = alreadyDone || r.unit.completeWhen.every((token) => UNIT_CONDITIONS[token](values));

  let status = stored;
  if (complete) status = stored === 'gold' ? 'gold' : 'complete';
  else if (testedOut) status = 'tested_out';
  else if (!stored && (ls.done > 0 || au.done > 0)) status = 'started';

  return {
    unitId: unit.id,
    complete,
    status: status || null,
    testedOut,
    ...values,
    lernschritte: ls,
    aufgaben: au,
    optional,
  };
}

// ── course ───────────────────────────────────────────────────────────────────

/**
 * Every closing block's first form, per lane: the Halbtest (.1) and Modelltest A (.2). Never
 * the Diagnose, never Modelltest B/C (neverRequired). Which ONE of them a learner needs is
 * decided by `closingFormFor` (the learner's lane).
 */
export function closingFirstForms(course) {
  const c = (course && course.closing) || {};
  const ids = [];
  for (const id of Object.values(c.halbtest || {})) if (typeof id === 'string') ids.push(id);
  for (const forms of Object.values(c.modelltests || {})) {
    if (Array.isArray(forms) && typeof forms[0] === 'string') ids.push(forms[0]);
  }
  return [...new Set(ids)];
}

/** The closing forms a course offers for one CLOSING kind: { [lane]: id }. */
function closingFormsOf(course, req) {
  const c = (course && course.closing) || {};
  const out = {};
  if (req.kind === 'halbtest') {
    for (const [lane, id] of Object.entries(c.halbtest || {})) if (typeof id === 'string') out[lane] = id;
  } else {
    const at = MODELLTEST_FORMS.indexOf(req.form);
    for (const [lane, forms] of Object.entries(c.modelltests || {})) {
      if (!Array.isArray(forms)) continue;
      // `<level>-m<form>-<lane>` (SCHEMA §2); a list without that pattern is read by position
      const id = forms.find((f) => typeof f === 'string' && new RegExp(`-m${req.form}-${lane}$`).test(f)) || forms[at];
      if (typeof id === 'string') out[lane] = id;
    }
  }
  return out;
}

/**
 * The lane a CLOSING entry resolves to. `lane: 'learner'` (SCHEMA §5) is the lane of the
 * learner's learner_goals row for this band (state.lane); when it is unknown, or the course has
 * no closing form for it, the course's primary lane — then the first lane with a form.
 */
export function closingLane(course, req, learnerLane = null) {
  const forms = closingFormsOf(course, req);
  if (req.lane !== 'learner') return req.lane;
  if (learnerLane && forms[learnerLane]) return learnerLane;
  const primary = course && course.lanes && course.lanes.primary;
  if (primary && forms[primary]) return primary;
  return Object.keys(forms)[0] || learnerLane || primary || null;
}

/** The one closing id that satisfies a CLOSING entry for this learner, or null. */
export function closingFormFor(course, req, learnerLane = null) {
  const lane = closingLane(course, req, learnerLane);
  return (lane && closingFormsOf(course, req)[lane]) || null;
}

// The authored course.json lists ids; the compiled manifest (src/data/course-v2/<level>)
// lists entries such as { unit: 'a2.1-u01', nr, … }. Both read the same here.
function idOf(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') return entry.unit || entry.plateau || entry.id || null;
  return null;
}

function candidatesFor(req, course, learnerLane) {
  if (req.kind === 'unit') return (course.units || []).map(idOf).filter(Boolean);
  if (req.kind === 'plateau') return (course.plateaus || []).map(idOf).filter(Boolean);
  const id = closingFormFor(course, req, learnerLane);
  return id ? [id] : [];
}

/**
 * Completion of a course (SCHEMA §5 course.json, authored or as the compiled manifest).
 * → { level, complete, parts: [{ kind, status, count, lane?, form?, done, doneIds, missing, satisfied }],
 *     done, total, share }
 * `done`/`total` sum the required counts (12 + 3 + 1), `share` is done / total — the one
 * progress figure a course surface may show. The closing part names the lane it resolved
 * to; only that lane's first form counts (a Diagnose or Modelltest B/C never does).
 */
export function courseCompletion(course, state) {
  const rules = completionRules(course);
  const st = normalizeLearnerState(state);
  const parts = rules.course.required.map((req) => {
    const ok = STATUS_SATISFIES[req.status];
    const ids = candidatesFor(req, course || {}, st.lane);
    const doneIds = ids.filter((id) => ok.includes(st.progress.get(id)));
    const satisfied = doneIds.length >= req.count;
    const part = { kind: req.kind, status: req.status, count: req.count };
    if (CLOSING_KINDS.includes(req.kind)) {
      part.lane = closingLane(course || {}, req, st.lane);
      if (req.form) part.form = req.form;
    }
    return {
      ...part,
      done: Math.min(doneIds.length, req.count),
      doneIds,
      missing: satisfied ? [] : ids.filter((id) => !doneIds.includes(id)),
      satisfied,
    };
  });
  const done = parts.reduce((n, p) => n + p.done, 0);
  const total = parts.reduce((n, p) => n + p.count, 0);
  return {
    level: (course && course.level) || null,
    complete: parts.every((p) => p.satisfied),
    parts,
    done,
    total,
    share: total > 0 ? done / total : 0,
  };
}
