-- Cross-check 2026-10-25, AI-24 (C-178): A1.2 listening Übung 4 (exercise
-- ed793dfa-d834-4207-a940-1fe70968dd61) asks "Schreiben Sie die Uhrzeit" in its
-- three dictation items (question_number 21–23), but a wrong answer is
-- corrected with "Richtig: 10", "20" or "18" — a bare number taught as the
-- written form of a time. QuestionCard prints correct_answer verbatim; the
-- A2.2 rows of the same task type already store "10 Uhr" / "22 Uhr".
--
-- Data only, no schema. Each UPDATE is guarded on the exercise, the question
-- number and the OLD value, so it is idempotent and touches nothing that has
-- been edited since 2026-09-05. Grading does not change: each new value is
-- already in that row's acceptable_answers, and dictationMatches() grades
-- against acceptable_answers whenever the list is non-empty.
--
-- Owner applies (Supabase SQL editor). Until then the corrections keep showing
-- the bare number.
-- Verify:
--   SELECT question_number, correct_answer FROM public.listening_questions
--   WHERE exercise_id = 'ed793dfa-d834-4207-a940-1fe70968dd61'
--     AND question_number BETWEEN 21 AND 23 ORDER BY question_number;
--   → 10 Uhr, 20 Uhr, 18 Uhr
-- Rollback: the same three UPDATEs with the values swapped.

BEGIN;

UPDATE public.listening_questions SET correct_answer = '10 Uhr'
WHERE exercise_id = 'ed793dfa-d834-4207-a940-1fe70968dd61' AND question_number = 21
  AND correct_answer = '10';

UPDATE public.listening_questions SET correct_answer = '20 Uhr'
WHERE exercise_id = 'ed793dfa-d834-4207-a940-1fe70968dd61' AND question_number = 22
  AND correct_answer = '20';

UPDATE public.listening_questions SET correct_answer = '18 Uhr'
WHERE exercise_id = 'ed793dfa-d834-4207-a940-1fe70968dd61' AND question_number = 23
  AND correct_answer = '18';

COMMIT;
