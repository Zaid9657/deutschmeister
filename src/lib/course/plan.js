// The exam-date plan — soft pacing for a rebuilt course (P4 of the A1.1
// plan, docs/course-standard-2026-09-12.md "dated plan").
//
// THE ONE RULE: this is arithmetic, never a gate. Nothing here can lock a
// Lektion, hide a node or fail a learner. The worst it may say is "X Lektionen
// hinter dem Plan" — and the UI that renders it is required to follow that
// with an open door, not a warning.
//
// The model, in full, so no caller invents a second one:
//   * The path is the course path (Lektionen + Checkpoints + the final test)
//     as `curriculumPath()` returns it. Every node is one unit of work; the
//     UI calls them Lektionen because that is what a learner counts.
//   * `perWeekTarget` is what remains, spread over the weeks that remain.
//     It is recomputed every day, so it rises gently when a week is missed
//     instead of accusing anybody.
//   * "Behind" is measured against SUSTAINABLE_PER_WEEK, not against the
//     learner's own past: to still finish by the exam date at a pace a
//     working adult can hold, at most SUSTAINABLE_PER_WEEK × weeksLeft nodes
//     may still be open. Anything beyond that is `behindBy`. This needs no
//     start date (we have none — `profiles.exam_date` is all the learner
//     gives us) and it can never blame someone who set the date late.
//
// Pure: no imports, no clock of its own (`today` is injected), no storage.
// tests/course-plan.test.mjs pins every branch.

/**
 * Nodes per week a learner with a job and a life can hold. Five ~15-minute
 * units is a little over an hour a week — the pace the standard's 12-Lektion
 * course assumes. It is the ONLY tuning constant in this file; raising it
 * makes the banner kinder and less useful, lowering it makes it nag.
 */
export const SUSTAINABLE_PER_WEEK = 5;

/** A plan whose required pace is at most half the sustainable one reads as "ahead". */
const COMFORTABLE_FACTOR = 0.5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight-anchored day number, so the arithmetic is in calendar days, not hours. */
const dayNumber = (value) => {
  const d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / MS_PER_DAY);
};

/**
 * `profiles.exam_date` arrives as a plain `YYYY-MM-DD` string. Parsing that
 * with `new Date()` yields UTC midnight, which is the previous day west of
 * Greenwich — so parse the parts by hand and build a local date.
 */
const parseExamDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * @param {object} input
 * @param {string|Date|null} input.examDate  profiles.exam_date (YYYY-MM-DD) or null
 * @param {Date} [input.today]               injected clock; defaults to now
 * @param {Array<{id:string}>} [input.path]  curriculumPath(curriculum)
 * @param {Set<string>|Array<string>} [input.doneIds] ids already finished
 * @returns {{weeksLeft:number|null, lektionenLeft:number, perWeekTarget:number|null,
 *            expectedDoneByNow:number|null, behindBy:number, daysLeft:number|null,
 *            total:number, doneCount:number,
 *            status:'on-track'|'behind'|'ahead'|'no-date'|'past'}}
 */
export function planFor({ examDate, today = new Date(), path = [], doneIds = new Set() } = {}) {
  const ids = doneIds instanceof Set ? doneIds : new Set(doneIds || []);
  const nodes = Array.isArray(path) ? path : [];
  const total = nodes.length;
  const doneCount = nodes.filter((n) => n && ids.has(n.id)).length;
  const lektionenLeft = Math.max(0, total - doneCount);

  const base = {
    total,
    doneCount,
    lektionenLeft,
    daysLeft: null,
    weeksLeft: null,
    perWeekTarget: null,
    expectedDoneByNow: null,
    behindBy: 0,
  };

  const exam = parseExamDate(examDate);
  const examDay = exam ? dayNumber(exam) : null;
  const todayDay = dayNumber(today);
  if (examDay === null || todayDay === null) return { ...base, status: 'no-date' };

  const daysLeft = examDay - todayDay;
  if (daysLeft < 0) return { ...base, daysLeft, weeksLeft: 0, status: 'past' };

  // The exam-day week still counts as a week of work; a same-day exam gets 1
  // so the division below can never be by zero.
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const perWeekTarget = lektionenLeft === 0 ? 0 : Math.ceil(lektionenLeft / weeksLeft);
  const capacity = SUSTAINABLE_PER_WEEK * weeksLeft;
  const expectedDoneByNow = Math.max(0, total - capacity);
  const behindBy = Math.max(0, expectedDoneByNow - doneCount);

  let status = 'on-track';
  if (behindBy > 0) status = 'behind';
  else if (lektionenLeft === 0 || perWeekTarget <= SUSTAINABLE_PER_WEEK * COMFORTABLE_FACTOR) status = 'ahead';

  return { ...base, daysLeft, weeksLeft, perWeekTarget, expectedDoneByNow, behindBy, status };
}

export default planFor;
