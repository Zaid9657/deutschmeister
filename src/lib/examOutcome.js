// The in-app exam-outcome question (fulfilment f2): pure rules, no React, no
// Supabase. src/components/course/ExamOutcomeQuestion.jsx loads the learner's
// row from public.exam_results (migrations/2026-10-27-exam-results.sql) and
// asks these helpers whether to show the card; tests/exam-outcome.test.mjs
// pins every branch.
//
// The rule: ask once, from exam_date + FOLLOW_UP_DAYS (local calendar days),
// never before. An answer hides the card for good, except 'waiting' (the
// result is not out yet), which asks again WAITING_REASK_DAYS after that
// answer. "Not now" hides it in this browser for that exam and date.

export const EXAM_OUTCOMES = ['passed', 'failed', 'waiting', 'not_taken'];
export const FOLLOW_UP_DAYS = 7;
export const WAITING_REASK_DAYS = 14;
/** The slug used when a learner has a date but no exam track (CHECK ^[a-z0-9_]{1,40}$). */
export const UNSPECIFIED_EXAM = 'unspecified';

const MS_PER_DAY = 86400000;

/** A local calendar day number; `YYYY-MM-DD` is read as a local date, not UTC midnight. */
export function dayNumber(value) {
  if (!value) return null;
  let d;
  if (value instanceof Date) d = value;
  else {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  }
  if (Number.isNaN(d.getTime())) return null;
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY;
}

/**
 * The exam this learner means: their exam track, else the course's exam,
 * else UNSPECIFIED_EXAM. 'none' (the "no exam" choice) is not an exam.
 */
export function examSlugFor({ examTrack = null, courseExamKey = null } = {}) {
  const valid = (s) => typeof s === 'string' && /^[a-z0-9_]{1,40}$/.test(s) && s !== 'none';
  if (valid(examTrack)) return examTrack;
  if (valid(courseExamKey)) return courseExamKey;
  return UNSPECIFIED_EXAM;
}

/**
 * Should the outcome question show?
 * @param {object} input
 * @param {string|Date|null} input.examDate  profiles.exam_date (YYYY-MM-DD)
 * @param {Date} [input.today]               injected clock
 * @param {{outcome:string, updated_at?:string}|null} [input.result]  the saved row for this exam and date
 * @param {boolean} [input.dismissed]        "Not now" in this browser
 */
export function outcomeQuestionDue({ examDate, today = new Date(), result = null, dismissed = false } = {}) {
  if (dismissed) return false;
  const exam = dayNumber(examDate);
  const now = dayNumber(today);
  if (exam === null || now === null) return false;
  if (now < exam + FOLLOW_UP_DAYS) return false;
  if (!result) return true;
  if (result.outcome !== 'waiting') return false;
  const answered = dayNumber(result.updated_at ? new Date(result.updated_at) : null);
  return answered !== null && now >= answered + WAITING_REASK_DAYS;
}

/** The browser key for "Not now", per exam and date. */
export const dismissKey = (exam, examDate) => `dm_exam_outcome_dismissed:${exam}:${examDate}`;

/**
 * Is this a "table not there yet" error (the migration is not applied)?
 * Postgres 42P01 via PostgREST, or PostgREST's own schema-cache miss.
 */
export function isMissingTable(error) {
  if (!error) return false;
  if (error.code === '42P01' || error.code === 'PGRST205') return true;
  return /does not exist|could not find the table/i.test(String(error.message || ''));
}

