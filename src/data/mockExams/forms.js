// Parallel forms of one mock exam (backlog f1, 2026-10-26).
//
// A mock may carry `forms: { 2: <mock>, … }` — further item sets in the SAME
// shape (same section keys, minutes, part types and item counts), so a retest
// measures on unseen items and its score stays comparable with the first run.
// Form 1 is always the mock itself.
//
// The form travels with the ATTEMPT, not the URL: it is chosen once at start
// (`?form=2` on /modelltest/:examSlug) and stored in exam_attempts.answers under
// FORM_KEY, like `_plays` and `_meta`. Resume, scoring, the result screen and
// the telc course page's gap diagnosis all read it from there — no schema
// change, and the gate is still the exam slug's own (src/data/modelltestGate.js).
//
// No imports: the pages and src/lib/telcPilot.js use this without pulling in
// any mock body.

export const FORM_KEY = '_form';

/** The form number a value names, or 1 (the mock itself) for anything else. */
export function formNumber(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

/** The mock's item set for a form; an unknown form falls back to the mock itself. */
export function mockForm(mock, form) {
  const n = formNumber(form);
  if (!mock || n === 1) return mock;
  return mock.forms?.[n] || mock;
}

/** Does this mock have that form (1 always)? */
export const hasForm = (mock, form) => formNumber(form) === 1 || Boolean(mock?.forms?.[formNumber(form)]);

/** The item set an attempt row was started on. */
export const attemptMock = (mock, attempt) => mockForm(mock, attempt?.answers?.[FORM_KEY]);
