// Pure helper for a mock/course-test listening part: which of an exercise's
// questions the runner renders AND registers for scoring. No React, no
// Supabase — imported by ModelltestRun.jsx's MockListeningPart and unit-
// tested under plain Node in tests/exams.test.mjs.
//
// Why it exists: useExerciseDetails() (src/hooks/useListening.js) loads ALL
// listening_questions rows for an exercise, ordered by question_number.
// Since Course Factory Wave 2/3 every A1 listening exercise carries 23
// questions (the 10 original + 13 added, incl. dictation), so a course test
// that reused an exercise whole would present 23 Hören items against 8
// Lesen items and silently re-weight its own score. A part may therefore
// carry `questionMax`: only questions with question_number <= questionMax
// are kept, in question_number order. Rendering and score registration
// must go through the SAME call so the two can never disagree.
//
// Semantics, pinned by the tests:
//   - no questionMax (undefined/null/0/non-number) → every question, ordered;
//   - questions without a numeric question_number are dropped when a cap is
//     set (they cannot be placed against it) but kept otherwise;
//   - the input array is never mutated.

export function selectListeningQuestions(questions, part) {
  const list = Array.isArray(questions) ? questions.slice() : [];
  const max = part && Number.isFinite(part.questionMax) && part.questionMax > 0 ? part.questionMax : null;
  const num = (q) => Number(q?.question_number);
  const ordered = list
    .map((q, i) => ({ q, i }))
    .sort((a, b) => {
      const an = num(a.q);
      const bn = num(b.q);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      if (Number.isFinite(an) !== Number.isFinite(bn)) return Number.isFinite(an) ? -1 : 1;
      return a.i - b.i; // stable for ties / non-numbered rows
    })
    .map(({ q }) => q);
  if (max === null) return ordered;
  return ordered.filter((q) => Number.isFinite(num(q)) && num(q) <= max);
}
