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
//     closing block's first form is submitted.
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
// For a .2 course whose Modelltests still run on the legacy src/data/mockExams runner,
// the caller maps a submitted exam_attempts row to progress[<Modelltest form id>] = 'complete'.

/** SCHEMA §5 defaults — used only for keys a course.json leaves out. */
export const DEFAULT_COMPLETION = Object.freeze({
  lernschritt: Object.freeze({ finishedWhen: 'all-items-answered' }),
  aufgabe: Object.freeze({
    submittedWhen: Object.freeze({ writingMinShareOfLowerBound: 0.5, speakingMinSeconds: 20, cardModeMinTurns: 2 }),
  }),
  unit: Object.freeze({
    completeWhen: Object.freeze(['lernschritte-finished-or-tested-out', 'aufgaben-submitted']),
    testOutThreshold: 0.8,
  }),
  course: Object.freeze({
    required: Object.freeze([
      Object.freeze({ kind: 'unit', status: 'complete', count: 12 }),
      Object.freeze({ kind: 'plateau', status: 'submitted', count: 3 }),
      Object.freeze({ kind: 'closing', status: 'submitted', count: 1 }),
    ]),
    neverRequired: Object.freeze(['score', 'fokus', 'mehr-ueben', 'extensive', 'modelltest:b', 'modelltest:c']),
  }),
});

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
const COURSE_REQUIRED_KINDS = ['unit', 'plateau', 'closing'];
const UNIT_CONDITIONS = {
  'lernschritte-finished-or-tested-out': (u) => u.lernschritteFinished,
  'aufgaben-submitted': (u) => u.aufgabenSubmitted,
};
const LANE_SUFFIX_RE = /-(?:sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2)$/;

// ── rules ────────────────────────────────────────────────────────────────────

/**
 * The completion rules of a course: its course.json `completion` block, with the
 * SCHEMA defaults for anything left out. Throws on a block this module cannot honour
 * (an unknown unit condition, required kind or status, or a kind that is both required
 * and never-required) — a schema change must fail loudly, never pass silently.
 */
export function completionRules(course) {
  const c = (course && course.completion) || {};
  const rules = {
    lernschritt: { ...DEFAULT_COMPLETION.lernschritt, ...(c.lernschritt || {}) },
    aufgabe: {
      submittedWhen: { ...DEFAULT_COMPLETION.aufgabe.submittedWhen, ...((c.aufgabe && c.aufgabe.submittedWhen) || {}) },
    },
    unit: { ...DEFAULT_COMPLETION.unit, ...(c.unit || {}) },
    course: {
      required: (c.course && c.course.required) || DEFAULT_COMPLETION.course.required,
      neverRequired: (c.course && c.course.neverRequired) || DEFAULT_COMPLETION.course.neverRequired,
    },
  };
  if (rules.lernschritt.finishedWhen !== 'all-items-answered') {
    throw new Error(`completion: unknown lernschritt.finishedWhen '${rules.lernschritt.finishedWhen}'`);
  }
  for (const token of rules.unit.completeWhen) {
    if (!UNIT_CONDITIONS[token]) throw new Error(`completion: unknown unit condition '${token}'`);
  }
  for (const req of rules.course.required) {
    if (!COURSE_REQUIRED_KINDS.includes(req.kind)) throw new Error(`completion: unknown required kind '${req.kind}'`);
    if (!STATUS_SATISFIES[req.status]) throw new Error(`completion: unknown required status '${req.status}'`);
    if (!Number.isInteger(req.count) || req.count < 0) throw new Error(`completion: bad count for '${req.kind}'`);
    if (rules.course.neverRequired.includes(req.kind)) {
      throw new Error(`completion: '${req.kind}' is both required and never required`);
    }
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
 */
export function isAufgabeSubmitted(task, attempt, rules = DEFAULT_COMPLETION) {
  if (!task || !attempt) return false;
  const sw = { ...DEFAULT_COMPLETION.aufgabe.submittedWhen, ...((rules.aufgabe && rules.aufgabe.submittedWhen) || {}) };
  const shape = taskShape(task);

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
 * The closing ids whose submission satisfies the 'closing' requirement: the first form
 * of every lane — the Halbtest (.1) and Modelltest A (.2). Never the Diagnose, never
 * Modelltest B/C (neverRequired). Any lane counts: a learner who switched lanes is done.
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

// The authored course.json lists ids; the compiled manifest (src/data/course-v2/<level>)
// lists entries such as { unit: 'a2.1-u01', nr, … }. Both read the same here.
function idOf(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') return entry.unit || entry.plateau || entry.id || null;
  return null;
}

function candidatesFor(kind, course) {
  if (kind === 'unit') return (course.units || []).map(idOf).filter(Boolean);
  if (kind === 'plateau') return (course.plateaus || []).map(idOf).filter(Boolean);
  return closingFirstForms(course);
}

/**
 * Completion of a course (SCHEMA §5 course.json, authored or as the compiled manifest).
 * → { level, complete, parts: [{ kind, status, count, done, doneIds, missing, satisfied }],
 *     done, total, share }
 * `done`/`total` sum the required counts (12 + 3 + 1), `share` is done / total — the one
 * progress figure a course surface may show.
 */
export function courseCompletion(course, state) {
  const rules = completionRules(course);
  const st = normalizeLearnerState(state);
  const parts = rules.course.required.map((req) => {
    const ok = STATUS_SATISFIES[req.status];
    const ids = candidatesFor(req.kind, course);
    const doneIds = ids.filter((id) => ok.includes(st.progress.get(id)));
    const satisfied = doneIds.length >= req.count;
    return {
      kind: req.kind,
      status: req.status,
      count: req.count,
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
