-- SD1 Sprechen missions — 4 new speaking_missions rows closing the Goethe
-- Start Deutsch 1 (A1) Sprechen coverage gaps identified in
-- docs/research/audit-a1-content-2026-09-03.md §5:
--   - Teil 1 (sich vorstellen) was only partially covered (spelling in #1,
--     origin/job in #6); age, languages and hobby were never asked, and no
--     mission drilled the full 7-category card sequence + phone number.
--   - Teil 2 (Informationen erfragen/geben per Wortkarte) had missions that
--     came close (#3 Supermarkt, A1.2 #4 Bahnhof, #5 Weg) but none in the
--     actual word-card "form a question from one word" exam format.
--   - Teil 3 (Bitten formulieren mit Bildkarten) had NO mission at all — the
--     imperative is not taught until A2.1, so per spec both "Bitte +
--     Imperativ (Sie-Form)" and "Können Sie / Kannst du bitte...?" are
--     scripted as equally correct answers (see pass_criteria/
--     system_prompt_extra on mission_order 12 below). Mission 12 also
--     scripts the reverse direction (the examiner makes a Bitte, the
--     learner reacts politely), since the real exam part is "Bitten
--     formulieren UND darauf reagieren", not forming them only. All 5
--     situations are framed in first person (the examiner's own problem:
--     "Mein Handy klingelt...") or addressed to the learner as "Sie"
--     (the learner's own need: "Sie möchten...", "Sie brauchen...") —
--     never as ungrammatical third-person self-reference ("die Prüferin").
--
-- Level casing matches the live table: speaking_missions.level is stored
-- UPPERCASE ('A1.2'), same as grammar_topics.sub_level — confirmed via
-- SELECT before writing this file (existing A1.2 rows run mission_order
-- 1-8, so these continue at 9-12).
--
-- All AI-scripted text (ai_opening_line, system_prompt_extra) is kept
-- inside the A1 syllabus per the audit's own finding — present tense only,
-- no Perfekt/Präteritum, no subordinate clauses (the audit flagged an
-- existing opener, "Waren Sie schon einmal bei uns?", as exactly this
-- mistake; none of the four new rows repeat it).
--
-- grammar_topic_id: mission_order 9 (Teil 1) is a multi-topic synthesis
-- (sein-forms, numbers, alphabet all at once) with no single obvious fit,
-- so it is left NULL, matching the "nullable, null unless obvious" rule.
-- mission_order 10/11 (Teil 2) link to question-words (the core skill
-- being drilled: forming W-/Ja-Nein-Fragen from a word card).
-- mission_order 12 (Teil 3) links to modal-verbs-intro, since the accepted
-- "Können Sie / Kannst du bitte...?" form is exactly that topic's target
-- structure.
--
-- HOW TO TEST: apply by hand in the Supabase SQL editor (see
-- migrations/README.md), then re-run the SELECT below — it must return the
-- 4 rows with mission_order 9,10,11,12 for level = 'A1.2'. Re-running this
-- whole file is a no-op (WHERE NOT EXISTS guard on the fixed id).
--
--   SELECT id, level, mission_order, title_de FROM public.speaking_missions
--   WHERE id IN (
--     '8770e47a-2b70-4b07-a871-2da89348a374',
--     'ca092ba1-d61b-45ed-a32e-61a3226a2770',
--     '0a7ea4dd-c66f-4b0f-bbb6-4f1df0921515',
--     '4f1c868f-705d-4af5-bb98-7eb8aefb64be'
--   ) ORDER BY mission_order;
--
-- ROLLBACK:
--   DELETE FROM public.speaking_missions WHERE id IN (
--     '8770e47a-2b70-4b07-a871-2da89348a374',
--     'ca092ba1-d61b-45ed-a32e-61a3226a2770',
--     '0a7ea4dd-c66f-4b0f-bbb6-4f1df0921515',
--     '4f1c868f-705d-4af5-bb98-7eb8aefb64be'
--   );

INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT '8770e47a-2b70-4b07-a871-2da89348a374', 'A1.2', 9, NULL,
  'Speaking Part 1: Introduce yourself completely',
  'Sprechen Teil 1: Sich komplett vorstellen',
  'This is the real exam task: introduce yourself to the examiner with all details — name, age, country, town, languages, job, hobby — then spell your name and say your phone number.',
  'Das ist die echte Prüfungsaufgabe: Stell dich der Prüferin vollständig vor — Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby — und buchstabiere danach deinen Namen und sag deine Telefonnummer.',
  'calm Goethe exam examiner (Prüferin)',
  'Guten Tag. Stellen Sie sich bitte vor. Wie heißen Sie?',
  '["ich heiße / ich bin","ich bin ... Jahre alt","ich komme aus / ich wohne in","ich spreche","ich bin von Beruf / ich arbeite als","mein Hobby ist","spelling with the German alphabet","phone number digit by digit"]'::jsonb,
  '["ich heiße","ich bin ... Jahre alt","ich komme aus","ich wohne in","ich spreche","von Beruf","mein Hobby","buchstabieren","die Telefonnummer"]'::jsonb,
  'User covers all seven Teil-1 categories (name, age, country, town, languages, job, hobby) in simple present-tense sentences, spells their name letter by letter when asked, and gives a phone number digit by digit. All seven categories plus the spelling and the number must be present to pass.',
  'You are the Prüferin. Ask ONE question at a time, in this fixed order, and wait for an answer before moving to the next: 1) Wie heißen Sie? 2) Wie alt sind Sie? 3) Woher kommen Sie? 4) Wo wohnen Sie? 5) Welche Sprachen sprechen Sie? 6) Was sind Sie von Beruf? 7) Was ist Ihr Hobby? Then ask them to spell their first name: "Buchstabieren Sie bitte Ihren Namen." Then ask for a phone number: "Wie ist Ihre Telefonnummer?" and have them say it digit by digit. Use only present tense, short simple sentences, and formal Sie. Never use Perfekt, Präteritum or subordinate clauses. If an answer is missing a category, ask again in simple words. Confirm each answer briefly ("Gut, danke.") before the next question.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = '8770e47a-2b70-4b07-a871-2da89348a374'
);

INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT 'ca092ba1-d61b-45ed-a32e-61a3226a2770', 'A1.2', 10, '8f070e1e-3dee-413b-b2cc-0e0eec40440c',
  'Speaking Part 2: Word-card questions (Food & Drink)',
  'Sprechen Teil 2: Fragen mit Wortkarten (Thema Essen & Trinken)',
  'In the real exam you get a word card and must build a question from it for your partner, then answer their question back. Practice with word cards about food and drink.',
  'In der echten Prüfung bekommst du eine Wortkarte und musst daraus eine Frage für deinen Partner bilden, dann seine Frage beantworten. Übe hier mit Wortkarten zum Thema Essen und Trinken.',
  'exam partner / fellow test candidate (Prüfungspartner)',
  'Hallo! Wir üben jetzt Teil 2. Ich gebe dir eine Wortkarte: Frühstück. Bilde bitte eine Frage.',
  '["W-Fragen: Was, Wann, Wo, Wie oft, Warum","Ja/Nein-Fragen mit Verb am Anfang","verb-second statements as answers"]'::jsonb,
  '["Frühstück","Obst","Kaffee","Mittagessen","Was isst du","Wann trinkst du","Magst du"]'::jsonb,
  'User forms at least four grammatically understandable questions (W-Frage or Ja/Nein-Frage) from the given word cards, and also answers at least one question the AI asks back in a full sentence.',
  'You alternate turns with the user, one word card at a time, from this list: Frühstück, Obst, Kaffee, Mittagessen. For each card: say only the word, then say "Bilde bitte eine Frage." Wait for the user''s question. If it is understandable, answer it naturally in one short present-tense sentence, then give a follow-up question on the same theme back to the user so they also answer. If the word order is wrong, gently repeat the question correctly and move on — never lecture. After all four cards, ask one closing Ja/Nein-Frage yourself, e.g. "Trinkst du gern Kaffee?" Use only present tense and simple sentences, no Perfekt/Präteritum, no subordinate clauses.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = 'ca092ba1-d61b-45ed-a32e-61a3226a2770'
);

INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT '0a7ea4dd-c66f-4b0f-bbb6-4f1df0921515', 'A1.2', 11, '8f070e1e-3dee-413b-b2cc-0e0eec40440c',
  'Speaking Part 2: Word-card questions (Home & Daily Life)',
  'Sprechen Teil 2: Fragen mit Wortkarten (Thema Wohnen & Alltag)',
  'Same word-card format, this time on housing and your daily routine — the other common Teil-2 topic pair.',
  'Gleiches Wortkarten-Format, diesmal zum Thema Wohnung und Tagesablauf — dem anderen häufigen Themenpaar in Teil 2.',
  'exam partner / fellow test candidate (Prüfungspartner)',
  'Wir machen weiter mit Teil 2. Erste Wortkarte: Wohnung. Bilde bitte eine Frage.',
  '["W-Fragen: Wo, Wie viele, Wann, Wie oft","Ja/Nein-Fragen mit Verb am Anfang","verb-second statements as answers"]'::jsonb,
  '["Wohnung","Zimmer","Tagesablauf","aufstehen","Wo wohnst du","Wann stehst du auf","Wie viele Zimmer"]'::jsonb,
  'User forms at least four grammatically understandable questions (W-Frage or Ja/Nein-Frage) from the given word cards on housing/daily-routine themes, and answers at least one question the AI asks back.',
  'You alternate turns with the user, one word card at a time, from this list: Wohnung, Zimmer, Tagesablauf, aufstehen. For each card: say only the word, then say "Bilde bitte eine Frage." Wait for the user''s question. If it is understandable, answer it naturally in one short present-tense sentence, then ask the same theme back to the user so they also answer. If the word order is wrong, repeat the question correctly without lecturing. After all four cards, ask one closing Ja/Nein-Frage yourself, e.g. "Stehst du früh auf?" Use only present tense and simple sentences, no Perfekt/Präteritum, no subordinate clauses.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = '0a7ea4dd-c66f-4b0f-bbb6-4f1df0921515'
);

INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT '4f1c868f-705d-4af5-bb98-7eb8aefb64be', 'A1.2', 12, '521fe67a-c23d-46f0-84ec-3207a2080a15',
  'Speaking Part 3: Making polite requests',
  'Sprechen Teil 3: Bitten formulieren',
  'The examiner describes five everyday situations — formulate a polite request out loud for each, using either "Bitte + Imperativ (Sie-Form)" or "Können Sie / Kannst du bitte...?" (both count as fully correct). Then the examiner makes two requests of you — react politely each time, since the real exam also tests reacting to a Bitte, not only forming one.',
  'Die Prüferin beschreibt fünf Alltagssituationen — formuliere für jede laut eine höfliche Bitte, entweder mit "Bitte + Imperativ (Sie-Form)" oder mit "Können Sie / Kannst du bitte...?" (beide zählen als vollständig richtig). Danach bittet dich die Prüferin selbst um zwei Dinge — reagiere jedes Mal höflich, denn die echte Prüfung testet auch das Reagieren auf eine Bitte, nicht nur das Formulieren.',
  'calm Goethe exam examiner (Prüferin)',
  'Guten Tag. Ich beschreibe Ihnen jetzt eine Situation. Bitte formulieren Sie eine Bitte. Situation: Das Fenster ist offen und es ist kalt.',
  '["Bitte + Imperativ Sie-Form: Machen Sie bitte...","Können Sie / Kannst du bitte...?","polite requests with bitte","reacting politely to a request: Ja, gern. / Natürlich."]'::jsonb,
  '["Machen Sie bitte","Können Sie bitte","Kannst du bitte","das Fenster zumachen","das Handy","langsamer sprechen","die Adresse aufschreiben","Ja, gern","Natürlich"]'::jsonb,
  'User formulates comprehensible polite requests for at least 4 of these 5 situations: (1) cold room, window open, (2) the examiner''s phone ringing loudly, (3) wants a glass of water, (4) the examiner speaking too fast, (5) needs the examiner''s address written down. BOTH "Bitte + Imperativ (Sie-Form)" (e.g. "Machen Sie bitte das Fenster zu.") and "Können Sie / Kannst du bitte...?" (e.g. "Können Sie bitte das Fenster zumachen?") count as fully correct — the Sie-imperative is not required, only accepted as one valid option alongside the können-question. In addition, the user reacts politely (e.g. "Ja, gern.", "Natürlich.") to at least one of the two requests the examiner makes of them.',
  'Present exactly these five situations, one at a time, waiting for the user''s request each time before moving on: 1) Das Fenster ist offen und es ist kalt. 2) Mein Handy klingelt sehr laut. 3) Sie möchten ein Glas Wasser. 4) Ich spreche sehr schnell. 5) Sie brauchen meine Adresse. Accept BOTH answer forms as fully correct and do not correct one in favour of the other: (a) "Bitte + Imperativ, Sie-Form" such as "Machen Sie bitte das Fenster zu." and (b) "Können Sie / Kannst du bitte...?" such as "Können Sie bitte das Fenster zumachen?" Never say the imperative is required or that the können-question is a workaround — both are correct German at this level. After the five situations, make two Bitten of your own to the user and wait for a polite reaction each time: a) "Geben Sie mir bitte Ihren Ausweis." b) "Schließen Sie bitte die Tür." Accept any polite acknowledgement or compliance ("Ja, gern.", "Natürlich.", "Ja, ich mache das.") as correct — do not require an exact phrase. If the user''s sentence is only partly understandable, ask them to try again in simple words. Use only present tense yourself, formal Sie, short sentences, no Perfekt/Präteritum, no subordinate clauses.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = '4f1c868f-705d-4af5-bb98-7eb8aefb64be'
);
