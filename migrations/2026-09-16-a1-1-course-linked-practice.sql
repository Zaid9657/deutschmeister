-- A1.1 course linked practice: 2 new reading_lessons (order_index 11–12) and
-- 6 new listening_exercises (exercise_number 7–12, with dialogues + 8 questions
-- each), so that every one of the 12 A1.1 course Lektionen can link one
-- listening and one reading activity (src/data/curricula/a11.js `links`).
-- Plan: docs/superpowers/plans/2026-09-15-deutschstart-a11-course-readiness.md, Task 3 Step 4.
--
-- Thematic mapping (Lektion → new row):
--   L2  Ich bin Studentin        → reading order_index 11 (SD1 Lesen Teil 1 E-Mail — the format
--                                  the live table never carried, see the old comment above L2's
--                                  examTeile) + listening exercise 7 „Im Bürgerbüro“
--   L3  Meine Familie            → listening exercise 8 „Familie und Sprachen“
--   L5  Im Klassenzimmer         → listening exercise 9 „Im Deutschkurs“
--   L6  Der erste Tag im Büro    → reading order_index 12 „Der erste Tag im Büro“
--   L7  Freizeit und Hobbys      → listening exercise 10 „Hobbys am Wochenende“
--   L11 Mein Tag                 → listening exercise 11 „Nachrichten auf der Mailbox“ (Hören
--                                  Teil 3: Ansagen am Telefon — exercise_type 'phone_messages')
--   L12 Feste feiern             → listening exercise 12 „Die Geburtstagsfeier“
--
-- AUDIO: the 6 exercises ship with status = 'pending' and NO recorded audio.
-- audio_url carries the deterministic storage path the player derives anyway
-- (src/utils/listeningHelpers.js getAudioUrl: audio/listening/A1.1/exercise<N>.mp3).
-- The owner's Azure render (docs/owner-prompts.md, „Render the six new A1.1
-- listening exercises“) must produce those files; afterwards set
--   UPDATE public.listening_exercises SET status = 'completed',
--   total_duration_seconds = <seconds> WHERE level = 'A1.1' AND exercise_number = <N>;
-- Apply this migration and run the render in the same sitting — the listening
-- library lists exercises regardless of status, so a long gap means visible
-- exercises whose play button has no file behind it.
--
-- Idempotent, in the style of migrations/2026-09-05-a1-1-reading.sql /
-- 2026-09-05-a1-1-listening.sql: every INSERT is guarded — reading_lessons by
-- (level, title_de), listening_exercises by (level, exercise_number), and the
-- dialogue/question inserts SELECT ... FROM listening_exercises so they insert
-- nothing (rather than an orphan row with a NULL exercise_id) when the parent
-- exercise is missing, and are guarded by (exercise_id, dialogue_number) /
-- (exercise_id, question_number).
--
-- How to test: apply by hand in the Supabase SQL editor, then:
--   SELECT count(*) FROM public.reading_lessons WHERE level = 'a1.1';                 -- 12
--   SELECT count(*) FROM public.listening_exercises WHERE level = 'A1.1';             -- 12
--   SELECT e.exercise_number, count(q.id) FROM public.listening_exercises e
--     JOIN public.listening_questions q ON q.exercise_id = e.id
--     WHERE e.level = 'A1.1' AND e.exercise_number >= 7
--     GROUP BY 1 ORDER BY 1;                                                          -- 6 rows of 8
-- Rollback: DELETE FROM public.listening_exercises WHERE level = 'A1.1' AND
-- exercise_number BETWEEN 7 AND 12 (questions/dialogues cascade via FK — if the
-- FKs lack ON DELETE CASCADE, delete children first by exercise_id); DELETE FROM
-- public.reading_lessons WHERE level = 'a1.1' AND order_index IN (11, 12).

BEGIN;

-- ---------------------------------------------------------------------------
-- Reading lesson 11 — for L2 „Ich bin Studentin“ (Angaben zur Person, Beruf).
-- SD1 Lesen Teil 1 is richtig/falsch over a short personal E-Mail/Brief; the
-- live a1.1 rows (order_index 1–10) carry no such text, which is why L2 could
-- never claim „Lesen Teil 1“ honestly. Exam-format shape like order 9/10:
-- questions '[]', 5 checks.
-- ---------------------------------------------------------------------------

INSERT INTO public.reading_lessons
  (level, title_de, title_en, topic, content_de, content_en, key_vocabulary, questions, checks, word_count, difficulty, estimated_reading_time, order_index)
SELECT
  'a1.1', 'Eine E-Mail lesen (wie in der Prüfung, Teil 1)', 'Reading an email (exam-style, part 1)', 'Prüfungsformat',
  'Lesen Sie die E-Mail. Sind die Sätze richtig oder falsch?

Liebe Frau Kaya,

ich heiße Sara Duman und ich bin neu in Bremen. Ich komme aus der Türkei und bin Lehrerin von Beruf. Ich bin verheiratet und wir haben einen Sohn. Er ist vier Jahre alt.

Ich lerne Deutsch in der Sprachschule. Mein Kurs ist am Montag und am Mittwoch. Meine Telefonnummer ist 0176 33 21 90. Meine Adresse ist Gartenstraße 5, 28195 Bremen.

Viele Grüße
Sara Duman', 'Read the email. Are the statements right or wrong?

Dear Ms Kaya,

My name is Sara Duman and I am new in Bremen. I come from Turkey and I am a teacher by profession. I am married and we have a son. He is four years old.

I am learning German at the language school. My course is on Monday and Wednesday. My phone number is 0176 33 21 90. My address is Gartenstraße 5, 28195 Bremen.

Best regards
Sara Duman',
  '[{"de":"neu","en":"new"},{"de":"die Lehrerin, -nen","en":"teacher (female)"},{"de":"verheiratet","en":"married"},{"de":"der Sohn, Söhne","en":"son"},{"de":"die Sprachschule, -n","en":"language school"},{"de":"der Kurs, -e","en":"course"},{"de":"die Telefonnummer, -n","en":"phone number"},{"de":"die Adresse, -n","en":"address"}]'::jsonb, '[]'::jsonb, '[{"type":"rf","statement_de":"Sara kommt aus der Türkei.","statement_en":"Sara comes from Turkey.","answer":"richtig","explanation_de":"Sie schreibt: \"Ich komme aus der Türkei.\""},{"type":"rf","statement_de":"Sara ist Studentin von Beruf.","statement_en":"Sara is a student by profession.","answer":"falsch","explanation_de":"Sie ist Lehrerin von Beruf, nicht Studentin."},{"type":"rf","statement_de":"Sara ist verheiratet.","statement_en":"Sara is married.","answer":"richtig","explanation_de":"Sie schreibt: \"Ich bin verheiratet.\""},{"type":"rf","statement_de":"Der Sohn ist fünf Jahre alt.","statement_en":"The son is five years old.","answer":"falsch","explanation_de":"Der Sohn ist vier Jahre alt, nicht fünf."},{"type":"rf","statement_de":"Der Deutschkurs ist am Montag und am Mittwoch.","statement_en":"The German course is on Monday and Wednesday.","answer":"richtig","explanation_de":"Sie schreibt: \"Mein Kurs ist am Montag und am Mittwoch.\""}]'::jsonb,
  78, 1, 2, 11
WHERE NOT EXISTS (
  SELECT 1 FROM public.reading_lessons WHERE level = 'a1.1' AND title_de = 'Eine E-Mail lesen (wie in der Prüfung, Teil 1)'
);

-- ---------------------------------------------------------------------------
-- Reading lesson 12 — for L6 „Der erste Tag im Büro“ (Büro, Technik und
-- Telefon). Everyday-text shape like the 8 rewrites: 4 questions, 4 checks
-- split 2 richtig / 2 falsch.
-- ---------------------------------------------------------------------------

INSERT INTO public.reading_lessons
  (level, title_de, title_en, topic, content_de, content_en, key_vocabulary, questions, checks, word_count, difficulty, estimated_reading_time, order_index)
SELECT
  'a1.1', 'Der erste Tag im Büro', 'The First Day at the Office', 'Arbeit und Beruf',
  'Heute ist Anas erster Tag im Büro. Das Büro ist im Bürgerbüro, Zimmer 12. Ihr Kollege heißt Herr Weber. Er ist sehr nett.

Auf dem Tisch sind ein Computer und ein Telefon. Ana braucht auch ein Handy, aber die Firma hat kein Handy. Die Telefonnummer im Büro ist 042 3381.

Um eins ist die Pause. Ana und die Kollegin trinken einen Kaffee. Die Kollegin heißt Frau Berg. Sie ist Ingenieurin. Ana sagt: „Der erste Tag ist schön!“', 'Today is Ana''s first day at the office. The office is in the citizens'' office, room 12. Her colleague is called Mr Weber. He is very nice.

On the table there are a computer and a telephone. Ana also needs a mobile phone, but the company has no mobile phone. The telephone number at the office is 042 3381.

At one o''clock is the break. Ana and her colleague drink a coffee. The colleague is called Ms Berg. She is an engineer. Ana says: "The first day is lovely!"',
  '[{"de":"das Büro, -s","en":"office"},{"de":"der Kollege, -n / die Kollegin, -nen","en":"colleague"},{"de":"der Computer, -","en":"computer"},{"de":"das Telefon, -e","en":"telephone"},{"de":"das Handy, -s","en":"mobile phone"},{"de":"die Firma, Firmen","en":"company"},{"de":"die Pause, -n","en":"break"},{"de":"die Ingenieurin, -nen","en":"engineer (female)"}]'::jsonb,
  '[{"question_de":"Wo ist Anas Büro?","question_en":"Where is Ana''s office?","answer_de":"Das Büro ist im Bürgerbüro, Zimmer 12.","answer_en":"The office is in the citizens'' office, room 12."},{"question_de":"Was ist auf dem Tisch?","question_en":"What is on the table?","answer_de":"Ein Computer und ein Telefon sind auf dem Tisch.","answer_en":"A computer and a telephone are on the table."},{"question_de":"Wann ist die Pause?","question_en":"When is the break?","answer_de":"Die Pause ist um eins.","answer_en":"The break is at one o''clock."},{"question_de":"Was ist Frau Berg von Beruf?","question_en":"What is Ms Berg''s profession?","answer_de":"Frau Berg ist Ingenieurin.","answer_en":"Ms Berg is an engineer."}]'::jsonb,
  '[{"type":"rf","statement_de":"Anas Kollege heißt Herr Weber.","statement_en":"Ana''s colleague is called Mr Weber.","answer":"richtig","explanation_de":"Der Text sagt: \"Ihr Kollege heißt Herr Weber.\""},{"type":"rf","statement_de":"Die Firma hat ein Handy für Ana.","statement_en":"The company has a mobile phone for Ana.","answer":"falsch","explanation_de":"Die Firma hat kein Handy."},{"type":"rf","statement_de":"Die Pause ist um eins.","statement_en":"The break is at one o''clock.","answer":"richtig","explanation_de":"Der Text sagt: \"Um eins ist die Pause.\""},{"type":"rf","statement_de":"Frau Berg ist Lehrerin.","statement_en":"Ms Berg is a teacher.","answer":"falsch","explanation_de":"Frau Berg ist Ingenieurin, nicht Lehrerin."}]'::jsonb,
  77, 1, 2, 12
WHERE NOT EXISTS (
  SELECT 1 FROM public.reading_lessons WHERE level = 'a1.1' AND title_de = 'Der erste Tag im Büro'
);

-- ---------------------------------------------------------------------------
-- Listening exercise 7 — for L2 „Ich bin Studentin“ (Hören Teil 1: kurze
-- Alltagsgespräche über Angaben zur Person).
-- ---------------------------------------------------------------------------

INSERT INTO public.listening_exercises
  (level, exercise_number, title, description, exercise_type, audio_url, plays_allowed, speed, status)
SELECT
  'A1.1', 7, 'Im Bürgerbüro', 'Angaben zur Person: Name buchstabieren, Beruf, Telefonnummer und Familienstand', 'short_dialogues',
  'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise7.mp3',
  2, '-20%', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_exercises WHERE level = 'A1.1' AND exercise_number = 7
);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 1, 'Der Name',
  '[{"speaker":"female","text":"Guten Tag! Wie heißen Sie?"},{"speaker":"male","text":"Ich heiße Omar Yildiz."},{"speaker":"female","text":"Buchstabieren Sie bitte Yildiz."},{"speaker":"male","text":"Y-I-L-D-I-Z."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 1);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 2, 'Beruf und Land',
  '[{"speaker":"female","text":"Was sind Sie von Beruf?"},{"speaker":"male","text":"Ich bin Lehrer. Ich komme aus Österreich und wohne in Bremen."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 2);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 3, 'Die Telefonnummer',
  '[{"speaker":"female","text":"Wie ist Ihre Telefonnummer?"},{"speaker":"male","text":"Meine Telefonnummer ist null eins sieben drei, vier acht neun sechs."},{"speaker":"female","text":"Danke. Sind Sie verheiratet?"},{"speaker":"male","text":"Nein, ich bin ledig."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 1, 'multiple_choice',
  'Wie heißt der Mann?', '["a) Omar Yildiz","b) Omar Weber","c) Ali Yildiz"]'::jsonb, 'a',
  NULL, 'Er sagt "Ich heiße Omar Yildiz."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 1);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 2, 'richtig_falsch',
  'Der Mann buchstabiert seinen Nachnamen.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Die Frau sagt "Buchstabieren Sie bitte Yildiz" und er buchstabiert Y-I-L-D-I-Z.'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 2);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 3, 'multiple_choice',
  'Was ist der Mann von Beruf?', '["a) Student","b) Lehrer","c) Ingenieur"]'::jsonb, 'b',
  NULL, 'Er sagt "Ich bin Lehrer."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 4, 'richtig_falsch',
  'Der Mann kommt aus Deutschland.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Er sagt "Ich komme aus Österreich."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 4);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 5, 'multiple_choice',
  'Wo wohnt der Mann?', '["a) In Berlin","b) In Bremen","c) In Köln"]'::jsonb, 'b',
  NULL, 'Er sagt "… und wohne in Bremen."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 5);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 6, 'multiple_choice',
  'Wie beginnt die Telefonnummer?', '["a) 0173","b) 0176","c) 0179"]'::jsonb, 'a',
  NULL, 'Er sagt "null eins sieben drei, vier acht neun sechs."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 6);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 7, 'richtig_falsch',
  'Der Mann ist verheiratet.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Er sagt "Nein, ich bin ledig."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 7);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 8, 'richtig_falsch',
  'Die Frau sagt "Danke".', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Sie sagt "Danke. Sind Sie verheiratet?"'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 7
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 8);

-- ---------------------------------------------------------------------------
-- Listening exercise 8 — for L3 „Meine Familie“ (Familie und Sprachen).
-- ---------------------------------------------------------------------------

INSERT INTO public.listening_exercises
  (level, exercise_number, title, description, exercise_type, audio_url, plays_allowed, speed, status)
SELECT
  'A1.1', 8, 'Familie und Sprachen', 'Über die Familie sprechen: Geschwister, Eltern und Sprachen', 'short_dialogues',
  'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise8.mp3',
  2, '-20%', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_exercises WHERE level = 'A1.1' AND exercise_number = 8
);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 1, 'Die Geschwister',
  '[{"speaker":"female","text":"Hast du Geschwister?"},{"speaker":"male","text":"Ja, ich habe einen Bruder und eine Schwester."},{"speaker":"female","text":"Wie alt ist dein Bruder?"},{"speaker":"male","text":"Er ist achtzehn."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 1);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 2, 'Die Sprachen',
  '[{"speaker":"male","text":"Welche Sprachen sprichst du?"},{"speaker":"female","text":"Ich spreche Deutsch, Englisch und Arabisch."},{"speaker":"male","text":"Spricht deine Mutter auch Deutsch?"},{"speaker":"female","text":"Nein, sie spricht nur Arabisch."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 2);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 3, 'Ein Foto',
  '[{"speaker":"male","text":"Ist das deine Familie?"},{"speaker":"female","text":"Ja. Das sind meine Eltern und mein Sohn. Mein Vater ist Arzt."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 1, 'multiple_choice',
  'Wie viele Geschwister hat der Mann?', '["a) Einen Bruder und eine Schwester","b) Zwei Brüder","c) Zwei Schwestern"]'::jsonb, 'a',
  NULL, 'Er sagt "Ich habe einen Bruder und eine Schwester."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 1);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 2, 'richtig_falsch',
  'Der Bruder ist achtzehn Jahre alt.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Er sagt "Er ist achtzehn."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 2);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 3, 'multiple_choice',
  'Wie viele Sprachen spricht die Frau?', '["a) Zwei","b) Drei","c) Vier"]'::jsonb, 'b',
  NULL, 'Sie sagt "Ich spreche Deutsch, Englisch und Arabisch" — das sind drei Sprachen.'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 4, 'richtig_falsch',
  'Die Mutter spricht Deutsch und Arabisch.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Die Frau sagt "Nein, sie spricht nur Arabisch."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 4);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 5, 'multiple_choice',
  'Welche Sprache spricht die Mutter?', '["a) Nur Arabisch","b) Nur Deutsch","c) Englisch"]'::jsonb, 'a',
  NULL, 'Die Frau sagt "sie spricht nur Arabisch."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 5);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 6, 'richtig_falsch',
  'Auf dem Foto sind die Eltern und der Sohn.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Die Frau sagt "Das sind meine Eltern und mein Sohn."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 6);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 7, 'multiple_choice',
  'Was ist der Vater von Beruf?', '["a) Lehrer","b) Arzt","c) Verkäufer"]'::jsonb, 'b',
  NULL, 'Die Frau sagt "Mein Vater ist Arzt."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 7);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 8, 'richtig_falsch',
  'Der Mann hat keine Geschwister.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Er hat einen Bruder und eine Schwester.'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 8
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 8);

-- ---------------------------------------------------------------------------
-- Listening exercise 9 — for L5 „Im Klassenzimmer“ (Gegenstände und Farben).
-- ---------------------------------------------------------------------------

INSERT INTO public.listening_exercises
  (level, exercise_number, title, description, exercise_type, audio_url, plays_allowed, speed, status)
SELECT
  'A1.1', 9, 'Im Deutschkurs', 'Gegenstände im Kursraum und ihre Farben', 'short_dialogues',
  'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise9.mp3',
  2, '-20%', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_exercises WHERE level = 'A1.1' AND exercise_number = 9
);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 1, 'Das Wörterbuch',
  '[{"speaker":"female","text":"Wo ist das Wörterbuch?"},{"speaker":"male","text":"Das Wörterbuch ist hier. Es ist gelb."},{"speaker":"female","text":"Und wo ist mein Heft?"},{"speaker":"male","text":"Dein Heft ist da."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 1);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 2, 'Die Farben',
  '[{"speaker":"male","text":"Ist der Stift schwarz?"},{"speaker":"female","text":"Nein, der Stift ist blau. Der Bleistift ist grün."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 2);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 3, 'Die Tafel',
  '[{"speaker":"female","text":"Ist die Tafel schwarz?"},{"speaker":"male","text":"Nein, die Tafel ist grün. Die Tür ist braun."},{"speaker":"female","text":"Und das Fenster?"},{"speaker":"male","text":"Das Fenster ist groß."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 1, 'richtig_falsch',
  'Das Wörterbuch ist gelb.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Der Mann sagt "Das Wörterbuch ist hier. Es ist gelb."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 1);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 2, 'multiple_choice',
  'Wo ist das Heft?', '["a) Hier","b) Da","c) Im Rucksack"]'::jsonb, 'b',
  NULL, 'Der Mann sagt "Dein Heft ist da."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 2);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 3, 'multiple_choice',
  'Welche Farbe hat der Stift?', '["a) Schwarz","b) Blau","c) Rot"]'::jsonb, 'b',
  NULL, 'Die Frau sagt "Nein, der Stift ist blau."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 4, 'richtig_falsch',
  'Der Bleistift ist grün.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Die Frau sagt "Der Bleistift ist grün."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 4);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 5, 'richtig_falsch',
  'Die Tafel ist schwarz.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Der Mann sagt "Nein, die Tafel ist grün."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 5);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 6, 'multiple_choice',
  'Welche Farbe hat die Tür?', '["a) Braun","b) Weiß","c) Grün"]'::jsonb, 'a',
  NULL, 'Der Mann sagt "Die Tür ist braun."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 6);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 7, 'richtig_falsch',
  'Das Fenster ist klein.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Der Mann sagt "Das Fenster ist groß."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 7);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 8, 'multiple_choice',
  'Was sucht die Frau zuerst?', '["a) Das Wörterbuch","b) Den Stift","c) Die Schere"]'::jsonb, 'a',
  NULL, 'Ihre erste Frage ist "Wo ist das Wörterbuch?"'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 9
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 8);

-- ---------------------------------------------------------------------------
-- Listening exercise 10 — for L7 „Freizeit und Hobbys“.
-- ---------------------------------------------------------------------------

INSERT INTO public.listening_exercises
  (level, exercise_number, title, description, exercise_type, audio_url, plays_allowed, speed, status)
SELECT
  'A1.1', 10, 'Hobbys am Wochenende', 'Über Hobbys und das Wochenende sprechen', 'short_dialogues',
  'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise10.mp3',
  2, '-20%', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_exercises WHERE level = 'A1.1' AND exercise_number = 10
);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 1, 'Das Hobby',
  '[{"speaker":"male","text":"Was ist dein Hobby?"},{"speaker":"female","text":"Ich spiele gern Fußball. Und du?"},{"speaker":"male","text":"Ich höre gern Musik und ich koche gern."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 1);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 2, 'Das Wochenende',
  '[{"speaker":"female","text":"Was machst du am Wochenende?"},{"speaker":"male","text":"Ich schwimme am Samstag. Am Sonntag lese ich."},{"speaker":"female","text":"Gehst du auch ins Kino?"},{"speaker":"male","text":"Ja, sehr gern."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 2);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 3, 'Tanzen und Sport',
  '[{"speaker":"male","text":"Tanzt du gern?"},{"speaker":"female","text":"Nein, ich tanze nicht gut. Ich mache jede Woche Sport."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 1, 'multiple_choice',
  'Was spielt die Frau gern?', '["a) Tennis","b) Fußball","c) Klavier"]'::jsonb, 'b',
  NULL, 'Sie sagt "Ich spiele gern Fußball."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 1);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 2, 'richtig_falsch',
  'Der Mann kocht gern.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Er sagt "Ich höre gern Musik und ich koche gern."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 2);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 3, 'multiple_choice',
  'Wann schwimmt der Mann?', '["a) Am Samstag","b) Am Sonntag","c) Am Montag"]'::jsonb, 'a',
  NULL, 'Er sagt "Ich schwimme am Samstag."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 4, 'richtig_falsch',
  'Am Sonntag liest der Mann.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Er sagt "Am Sonntag lese ich."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 4);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 5, 'richtig_falsch',
  'Der Mann geht nicht gern ins Kino.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Auf die Kino-Frage sagt er "Ja, sehr gern."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 5);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 6, 'multiple_choice',
  'Was macht die Frau jede Woche?', '["a) Sport","b) Musik","c) Deutsch"]'::jsonb, 'a',
  NULL, 'Sie sagt "Ich mache jede Woche Sport."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 6);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 7, 'richtig_falsch',
  'Die Frau tanzt sehr gut.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Sie sagt "Nein, ich tanze nicht gut."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 7);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 8, 'multiple_choice',
  'Was hört der Mann gern?', '["a) Radio","b) Musik","c) Podcasts"]'::jsonb, 'b',
  NULL, 'Er sagt "Ich höre gern Musik."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 10
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 8);

-- ---------------------------------------------------------------------------
-- Listening exercise 11 — for L11 „Mein Tag“ (Hören Teil 3: Ansagen am
-- Telefon, daher exercise_type 'phone_messages': drei Mailbox-Nachrichten).
-- ---------------------------------------------------------------------------

INSERT INTO public.listening_exercises
  (level, exercise_number, title, description, exercise_type, audio_url, plays_allowed, speed, status)
SELECT
  'A1.1', 11, 'Nachrichten auf der Mailbox', 'Drei Ansagen am Telefon: Verabredung, Arzttermin und Tagesplan', 'phone_messages',
  'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise11.mp3',
  2, '-20%', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_exercises WHERE level = 'A1.1' AND exercise_number = 11
);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 1, 'Nachricht von Tim',
  '[{"speaker":"male","text":"Hallo Lena, hier ist Tim. Ich kaufe am Freitag ein. Kommst du mit? Ich rufe dich am Abend an."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 1);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 2, 'Nachricht von der Arztpraxis',
  '[{"speaker":"female","text":"Guten Tag, hier ist die Praxis Doktor Berg. Ihr Termin ist am Montag um halb neun. Bitte kommen Sie pünktlich."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 2);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 3, 'Nachricht von Ana',
  '[{"speaker":"female","text":"Hallo Tim, hier ist Ana. Ich stehe morgen um sechs Uhr auf. Ich hole dich um sieben ab. Bring bitte Kuchen mit."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 1, 'multiple_choice',
  'Wann kauft Tim ein?', '["a) Am Freitag","b) Am Montag","c) Am Sonntag"]'::jsonb, 'a',
  NULL, 'Er sagt "Ich kaufe am Freitag ein."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 1);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 2, 'richtig_falsch',
  'Tim ruft am Abend an.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Er sagt "Ich rufe dich am Abend an."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 2);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 3, 'multiple_choice',
  'Wann ist der Termin in der Praxis?', '["a) Am Montag um halb neun","b) Am Montag um neun","c) Am Dienstag um halb neun"]'::jsonb, 'a',
  NULL, 'Die Ansage sagt "Ihr Termin ist am Montag um halb neun."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 4, 'richtig_falsch',
  'Die Nachricht kommt von der Post.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Die Ansage sagt "hier ist die Praxis Doktor Berg."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 4);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 5, 'richtig_falsch',
  'Der Termin ist am Dienstag.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Der Termin ist am Montag, nicht am Dienstag.'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 5);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 6, 'multiple_choice',
  'Wann steht Ana auf?', '["a) Um sechs Uhr","b) Um sieben Uhr","c) Um halb sieben"]'::jsonb, 'a',
  NULL, 'Sie sagt "Ich stehe morgen um sechs Uhr auf."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 6);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 7, 'richtig_falsch',
  'Ana holt Tim um sieben ab.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Sie sagt "Ich hole dich um sieben ab."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 7);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 8, 'multiple_choice',
  'Was soll Tim mitbringen?', '["a) Musik","b) Kuchen","c) Brot"]'::jsonb, 'b',
  NULL, 'Ana sagt "Bring bitte Kuchen mit."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 11
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 8);

-- ---------------------------------------------------------------------------
-- Listening exercise 12 — for L12 „Feste feiern“ (Einladung, Geburtstag,
-- Gäste).
-- ---------------------------------------------------------------------------

INSERT INTO public.listening_exercises
  (level, exercise_number, title, description, exercise_type, audio_url, plays_allowed, speed, status)
SELECT
  'A1.1', 12, 'Die Geburtstagsfeier', 'Eine Einladung, ein Geschenk und die Gäste', 'short_dialogues',
  'https://omqyueddktqeyrrqvnyq.supabase.co/storage/v1/object/public/audio/listening/A1.1/exercise12.mp3',
  2, '-20%', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.listening_exercises WHERE level = 'A1.1' AND exercise_number = 12
);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 1, 'Die Einladung',
  '[{"speaker":"female","text":"Hallo Tim! Ich habe im Mai Geburtstag. Wir feiern am Samstag. Kommst du?"},{"speaker":"male","text":"Ja, gern! Bringe ich etwas mit?"},{"speaker":"female","text":"Ja, bring bitte einen Salat mit."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 1);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 2, 'Das Geschenk',
  '[{"speaker":"male","text":"Was kaufen wir für Ana?"},{"speaker":"female","text":"Vielleicht ein Buch. Sie liest gern."},{"speaker":"male","text":"Gut, ich kaufe das Geschenk am Freitag."}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 2);

INSERT INTO public.listening_dialogues (exercise_id, dialogue_number, title, transcript)
SELECT le.id, 3, 'Die Gäste',
  '[{"speaker":"female","text":"Wie viele Gäste kommen zur Party?"},{"speaker":"male","text":"Zehn Gäste. Meine Mama und mein Papa kommen auch."},{"speaker":"female","text":"Schön! Bis Samstag. Mach''s gut!"}]'::jsonb
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_dialogues d WHERE d.exercise_id = le.id AND d.dialogue_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 1, 'multiple_choice',
  'Wann hat die Frau Geburtstag?', '["a) Im Mai","b) Im Juni","c) Im März"]'::jsonb, 'a',
  NULL, 'Sie sagt "Ich habe im Mai Geburtstag."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 1);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 2, 'richtig_falsch',
  'Die Party ist am Samstag.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Sie sagt "Wir feiern am Samstag."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 2);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 1, 3, 'multiple_choice',
  'Was bringt Tim mit?', '["a) Einen Kuchen","b) Einen Salat","c) Musik"]'::jsonb, 'b',
  NULL, 'Die Frau sagt "bring bitte einen Salat mit."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 3);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 4, 'richtig_falsch',
  'Ana liest gern.', '["Richtig","Falsch"]'::jsonb, 'Richtig',
  NULL, 'Die Frau sagt "Vielleicht ein Buch. Sie liest gern."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 4);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 5, 'multiple_choice',
  'Was kaufen sie für Ana?', '["a) Eine Karte","b) Eine Lampe","c) Ein Buch"]'::jsonb, 'c',
  NULL, 'Die Frau sagt "Vielleicht ein Buch."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 5);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 2, 6, 'richtig_falsch',
  'Der Mann kauft das Geschenk am Montag.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Er sagt "ich kaufe das Geschenk am Freitag."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 6);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 7, 'multiple_choice',
  'Wie viele Gäste kommen?', '["a) Zehn","b) Zwölf","c) Zwanzig"]'::jsonb, 'a',
  NULL, 'Der Mann sagt "Zehn Gäste."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 7);

INSERT INTO public.listening_questions
  (exercise_id, dialogue_number, question_number, question_type, question_text, options, correct_answer, acceptable_answers, explanation)
SELECT le.id, 3, 8, 'richtig_falsch',
  'Mama und Papa kommen nicht.', '["Richtig","Falsch"]'::jsonb, 'Falsch',
  NULL, 'Der Mann sagt "Meine Mama und mein Papa kommen auch."'
FROM public.listening_exercises le
WHERE le.level = 'A1.1' AND le.exercise_number = 12
  AND NOT EXISTS (SELECT 1 FROM public.listening_questions q WHERE q.exercise_id = le.id AND q.question_number = 8);

COMMIT;
