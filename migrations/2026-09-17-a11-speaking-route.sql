-- A1.1 speaking route — one published mission per Lektion, mission_order N = Lektion N
-- (docs/superpowers/plans/2026-09-15-speaking-guided-city-map.md, Task 1;
-- spec §5.3/§6.3 in docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md).
--
-- BEFORE (read live 2026-09-16): speaking_missions carries 8 published A1.1 rows
-- (mission_order 1–8) mapped to Lektionen NON-sequentially — a11.js linked them as
-- [1, 6, 5, 2, 3, 4, null, 8, 7, null, null, null], and L7/L10/L11/L12 had no mission
-- at all. AFTER: exactly 12 published A1.1 rows, mission_order 1–12, each bound to
-- Lektion N's situation (src/data/curricula/a11.js). The station table in the plan
-- document disagrees with the real Lektion sequence; per the approved deviation the
-- REAL LESSONS win.
--
--   order  Lektion (situation)                       row
--   1      L1  Begrüßung/Alphabet                    KEPT      eaae3db2 „Ankunft im Hostel“ (was order 1)
--   2      L2  Angaben zur Person (Bürgerbüro)       REALIGNED 612568b9 (was order 6 „Neue Nachbarn“) → „Anmeldung im Bürgerbüro“
--   3      L3  Familie (Foto, Personalpronomen)      MOVED     06af3bdb „Über Leute sprechen“ (was order 5)
--   4      L4  Flohmarkt (Genus, Preise)             MOVED     dbf25892 „Auf dem Flohmarkt“ (was order 2; + price criterion)
--   5      L5  Klassenzimmer (best. Artikel, Farben) MOVED     e309e3bb „Im Klassenzimmer“ (was order 3; + colour criterion)
--   6      L6  Büro (unbest. Artikel, brauchen)      REALIGNED fcc21770 (was order 4 „Einkaufen für die Wohnung“) → „Der erste Tag im Büro“
--   7      L7  Freizeit und Hobbys                   NEW       d061e16a
--   8      L8  Termine und Uhrzeit                   NEW       8363406d
--   9      L9  Im Café (haben, bestellen)            MOVED     f825d8b9 „Im Café“ (was order 7; + Ich möchte criterion)
--   10     L10 Am Bahnhof (Ja/Nein-Fragen)           NEW       90d0d8cf
--   11     L11 Mein Tag (trennbare Verben)           REALIGNED 6d53ebe9 (was order 8 „Ein ganz normaler Tag“) → „Mein Tag“
--   12     L12 Feste feiern — ABSCHLUSSMISSION       NEW       fd2d2dac (the integrated final encounter the
--                                                              Abschlusstest hands off to: introduce yourself,
--                                                              answer follow-ups, make an invitation — matches
--                                                              src/data/courseTests/abschlusstestA11.js, sprechen,
--                                                              missionOrder 12)
--
-- SCHEMA (information_schema, read 2026-09-16): pass_criteria is TEXT,
-- target_structures/hint_words are JSONB, level is UPPERCASE ('A1.1'), and there is
-- NO learner_goal_de and NO estimated_minutes column — the learner goal is therefore
-- the last sentence of scenario_de („Ihr Ziel: …“), as on every row below.
-- UNIQUE (level, mission_order) exists, so the reorder goes through a temporary
-- +100 offset inside the transaction.
--
-- GUARDS. Every UPDATE fires only where the row still carries the values read on
-- 2026-09-16 (id + mission_order + title_de + ai_opening_line): an admin-edited row
-- is never overwritten silently. If any guarded UPDATE matches nothing on a first
-- application, the sanity DO block below aborts the whole transaction loudly
-- (0 of 8 moved = already applied = fine; 1–7 = partial = abort). The four INSERTs
-- carry fixed UUIDs and WHERE NOT EXISTS guards; re-running the whole file is a
-- no-op.
--
-- REGISTER: scenario_de speaks Sie to the learner (course standard); every
-- ai_opening_line is Sie except mission 3, where the AI is a friend showing
-- interest in a photo (du-context between peers, like the L3 dialogue).
-- All AI-scripted German stays inside the A1.1 syllabus: present tense only,
-- sein/haben, no Perfekt/Präteritum, no subordinate clauses.
--
-- HOW TO TEST: apply by hand in the Supabase SQL editor (see migrations/README.md),
-- then run —
--   SELECT mission_order, title_de, is_free, is_published
--   FROM public.speaking_missions WHERE level = 'A1.1' ORDER BY mission_order;
-- — it must return exactly 12 rows, mission_order 1–12, all published, only
-- mission_order 1 free. Re-running this whole file must change nothing.
--
-- ROLLBACK: delete the four new rows —
--   DELETE FROM public.speaking_missions WHERE id IN (
--     'd061e16a-9c9a-4f23-8259-50ed9212ef5f',
--     '8363406d-d79f-4535-9ad5-b8ba22008218',
--     '90d0d8cf-44f6-4696-97bc-6305e1c3e042',
--     'fd2d2dac-4e15-4ef2-a2bc-b8a696e18b62');
-- — the eight realigned rows have no automated rollback; restore them from the
-- 2026-09-16 values quoted in each UPDATE's WHERE clause below.

BEGIN;

-- --------------------------------------------------------------------------
-- Phase A: realign the eight existing rows, parking each at target order +100
-- --------------------------------------------------------------------------

-- order 1 (L1, was order 1): kept — scenario gains the Sie register and the goal sentence.
UPDATE public.speaking_missions SET
  mission_order = 101,
  scenario_en = 'You arrive at a hostel in Berlin and check in at the reception. Your goal: greet the receptionist, say your name, spell it letter by letter, and say goodbye politely.',
  scenario_de = 'Sie kommen in einem Hostel in Berlin an und melden sich an der Rezeption. Ihr Ziel: Begrüßen Sie die Rezeptionistin, sagen Sie Ihren Namen, buchstabieren Sie ihn und verabschieden Sie sich höflich.'
WHERE id = 'eaae3db2-1dbf-4af3-b5c0-d5d256d319ab' AND level = 'A1.1' AND mission_order = 1
  AND title_de = 'Ankunft im Hostel'
  AND ai_opening_line = 'Hallo! Willkommen im Hostel Mitte. Wie ist Ihr Name, bitte?';

-- order 2 (L2 Bürgerbüro, was order 6 „Neue Nachbarn“): realigned to the Lektion's
-- own situation — Angaben zur Person at the counter. grammar_topic_id stays
-- a0441d44 (verb-sein, L2's primarySlug).
UPDATE public.speaking_missions SET
  mission_order = 102,
  title_en = 'Registering at the citizens'' office',
  title_de = 'Anmeldung im Bürgerbüro',
  ai_role = 'friendly clerk at the citizens'' office (Beamter im Bürgerbüro)',
  scenario_en = 'You register at the citizens'' office and the clerk asks for your details. Your goal: say your name, where you come from and where you live, say your job, and give your phone number digit by digit.',
  scenario_de = 'Sie melden sich im Bürgerbüro an und der Beamte fragt nach Ihren Daten. Ihr Ziel: Sagen Sie Ihren Namen, woher Sie kommen und wo Sie wohnen, nennen Sie Ihren Beruf und sagen Sie Ihre Telefonnummer Ziffer für Ziffer.',
  ai_opening_line = 'Guten Tag! Willkommen im Bürgerbüro. Wie ist Ihr Name, bitte?',
  target_structures = '["sein: ich bin, Sie sind","ich komme aus / ich wohne in","von Beruf","phone number digit by digit"]'::jsonb,
  hint_words = '["ich heiße","kommen aus","wohnen","von Beruf","die Telefonnummer","die Adresse"]'::jsonb,
  pass_criteria = 'User gives their name, their origin (ich komme aus ...) and their place of residence (ich wohne in ...), says their job with a correct sein form, and gives a phone number digit by digit. All four details must be present to pass.',
  system_prompt_extra = 'You are the clerk (Beamter) at the Bürgerbüro. Ask ONE question at a time, in this order, and wait for an answer before the next: 1) Wie ist Ihr Name? 2) Woher kommen Sie? 3) Wo wohnen Sie? 4) Was sind Sie von Beruf? 5) Wie ist Ihre Telefonnummer? Confirm each answer briefly ("Danke."). If an answer is missing, ask again in simple words. Use only present tense, formal Sie, short simple sentences — never Perfekt, Präteritum or subordinate clauses.'
WHERE id = '612568b9-d2b9-4cb4-93fa-83a7a51dcc1d' AND level = 'A1.1' AND mission_order = 6
  AND title_de = 'Neue Nachbarn'
  AND ai_opening_line = 'Oh, hallo! Sie sind neu hier, oder? Ich bin Frau Weber aus dem dritten Stock.';

-- order 3 (L3 Familie, was order 5): moved — content already fits the Lektion.
-- The AI stays a friend (du between peers, like Lena and Ana in the L3 dialogue);
-- the task text toward the learner is Sie.
UPDATE public.speaking_missions SET
  mission_order = 103,
  scenario_en = 'You show a friend a photo of your family. Your goal: say who the people are, using the pronouns er, sie and wir.',
  scenario_de = 'Sie zeigen einer Freundin ein Foto von Ihrer Familie. Ihr Ziel: Sagen Sie, wer die Leute sind, und benutzen Sie dabei er, sie und wir.'
WHERE id = '06af3bdb-1571-4e5e-a6e4-75a57e890c94' AND level = 'A1.1' AND mission_order = 5
  AND title_de = 'Über Leute sprechen'
  AND ai_opening_line = 'Oh, ist das ein Foto? Zeig mal! Wer ist das denn?';

-- order 4 (L4 Flohmarkt, was order 2): moved — and the Lektion's own can-do
-- („Ich kann fragen, was etwas ist und was es kostet.“) enters the criteria.
UPDATE public.speaking_missions SET
  mission_order = 104,
  scenario_en = 'You browse a flea market stall. Your goal: ask what things are, ask what they cost, and say what you buy.',
  scenario_de = 'Sie sind an einem Flohmarktstand. Ihr Ziel: Fragen Sie, was die Dinge sind, fragen Sie nach dem Preis und sagen Sie, was Sie kaufen.',
  target_structures = '["Was ist das?","noun gender recognition","der/die/das in answers","Was kostet ...? and prices in euros"]'::jsonb,
  hint_words = '["Was ist das?","der Tisch","die Lampe","Was kostet das?","der Euro","teuer"]'::jsonb,
  pass_criteria = 'User asks "Was ist das?" at least twice, repeats nouns with an article (correct gender attempts count even if wrong), asks at least one price question (Was kostet ...? / Wie viel kostet ...?) and says what they buy.',
  system_prompt_extra = 'Point at objects (describe them verbally). Always answer with the article: "Das ist der/die/das...". Gently correct wrong articles by repeating the correct one. Give every object a simple price in euros when asked (e.g. "Der Tisch kostet fünfzehn Euro.") and close the sale when the user says what they buy. Use only present tense and short simple sentences.'
WHERE id = 'dbf25892-27d8-42fb-8dbc-0f50d8481885' AND level = 'A1.1' AND mission_order = 2
  AND title_de = 'Auf dem Flohmarkt'
  AND ai_opening_line = 'Hallo! Schauen Sie ruhig — was möchten Sie wissen?';

-- order 5 (L5 Klassenzimmer, was order 3): moved — and the Farben can-do of the
-- Lektion gets a seat in the criteria.
UPDATE public.speaking_missions SET
  mission_order = 105,
  scenario_en = 'First day in your German course. Your goal: name the things in the classroom with your teacher using der, die and das, and say one colour.',
  scenario_de = 'Erster Tag im Deutschkurs. Ihr Ziel: Benennen Sie mit der Lehrerin die Dinge im Kursraum mit der, die und das und nennen Sie eine Farbe.',
  target_structures = '["definite articles der/die/das","Das ist... sentences","colours: blau, rot, grün"]'::jsonb,
  hint_words = '["die Tafel","der Stuhl","das Fenster","die Tür","blau"]'::jsonb,
  pass_criteria = 'User produces at least three "Das ist der/die/das..." sentences with mostly correct definite articles and names the colour of at least one object (e.g. "Das Heft ist grün.").',
  system_prompt_extra = 'Name an object, ask the user to repeat it with its article, then ask "Und was ist das?" about another. After three objects, ask one colour question: "Welche Farbe hat das Heft?" Correct article errors by modeling, never lecturing. Use only present tense, formal Sie, short simple sentences.'
WHERE id = 'e309e3bb-2bd8-4c8b-b3f6-42aad186d1e6' AND level = 'A1.1' AND mission_order = 3
  AND title_de = 'Im Klassenzimmer'
  AND ai_opening_line = 'Willkommen im Kurs! Schauen wir uns das Klassenzimmer an. Was sehen Sie?';

-- order 6 (L6 Büro, was order 4 „Einkaufen für die Wohnung“): realigned to the
-- Lektion's own situation — the first day at the office, same grammar target
-- (ich brauche + ein/eine/einen, kein). grammar_topic_id stays fd1543e8
-- (indefinite-articles, L6's primarySlug).
UPDATE public.speaking_missions SET
  mission_order = 106,
  title_en = 'First day at the office',
  title_de = 'Der erste Tag im Büro',
  ai_role = 'friendly colleague on your first day at the office',
  scenario_en = 'Your first day at a new job — a colleague shows you your desk. Your goal: say what you need for work, ask for the telephone number, and ask when the break is.',
  scenario_de = 'Ihr erster Arbeitstag — eine Kollegin zeigt Ihnen Ihren Platz im Büro. Ihr Ziel: Sagen Sie, was Sie für die Arbeit brauchen, fragen Sie nach der Telefonnummer und fragen Sie, wann die Pause ist.',
  ai_opening_line = 'Guten Morgen und willkommen! Das ist Ihr Büro. Was brauchen Sie für die Arbeit?',
  target_structures = '["indefinite articles ein/eine/einen","Ich brauche + noun","kein/keine in answers","Wann ist ...? questions"]'::jsonb,
  hint_words = '["Ich brauche","einen Computer","ein Telefon","eine Lampe","die Pause","die Nummer"]'::jsonb,
  pass_criteria = 'User uses "Ich brauche ein/eine/einen ..." at least three times with reasonable article choices, and asks at least one question about the workplace (the telephone number or the break).',
  system_prompt_extra = 'You are a friendly colleague showing the user their new workplace. Ask what they need for their desk, one thing at a time. Model the indefinite article in every reply ("Ein Computer, gerne!"). Say "Wir haben kein Handy." once so the user hears kein. Answer their questions briefly: the phone number digit by digit, the break with "Die Pause ist um eins." Use only present tense, formal Sie, short simple sentences.'
WHERE id = 'fcc21770-299a-442d-a743-fe703cb9d555' AND level = 'A1.1' AND mission_order = 4
  AND title_de = 'Einkaufen für die Wohnung'
  AND ai_opening_line = 'Guten Tag! Kann ich Ihnen helfen? Was brauchen Sie für Ihre Wohnung?';

-- order 9 (L9 Im Café, was order 7): moved — the Lektion's bestellen can-do
-- („Ich möchte ..., bitte“ as a fixed chunk) joins the haben criteria.
UPDATE public.speaking_missions SET
  mission_order = 109,
  scenario_en = 'You are in a café and the waiter comes to your table. Your goal: order something to drink and something to eat with "Ich möchte ..., bitte", ask one "Haben Sie ...?" question, and accept or politely decline an offer.',
  scenario_de = 'Sie sind im Café und der Kellner kommt an Ihren Tisch. Ihr Ziel: Bestellen Sie etwas zu trinken und etwas zu essen mit „Ich möchte ..., bitte“, stellen Sie eine Frage mit „Haben Sie ...?“ und nehmen Sie ein Angebot an oder lehnen Sie es höflich ab.',
  target_structures = '["Ich möchte ..., bitte","haben conjugation: ich habe, Sie haben","Haben Sie...? questions","Ja, bitte / Nein, danke"]'::jsonb,
  hint_words = '["Ich möchte","einen Kaffee","Haben Sie","der Kuchen","Nein, danke"]'::jsonb,
  pass_criteria = 'User orders something with "Ich möchte ..., bitte", uses haben correctly at least twice including one "Haben Sie ...?" question, and accepts or politely declines one offer (e.g. "Nein, danke.").',
  system_prompt_extra = 'You are a relaxed Berlin waiter. Take the order, then offer one extra thing (cake or water) so the user can accept or decline. Force haben naturally: ask if they have time or a reservation. Answer their Haben Sie questions briefly and ask one back. Use only present tense, formal Sie, short simple sentences.'
WHERE id = 'f825d8b9-d000-43e0-a148-466a18da0366' AND level = 'A1.1' AND mission_order = 7
  AND title_de = 'Im Café'
  AND ai_opening_line = 'Hallo! Was darf es sein? Haben Sie schon unsere Karte?';

-- order 11 (L11 Mein Tag, was order 8 „Ein ganz normaler Tag“): realigned — the
-- Lektion's primary topic is the Satzklammer, so the separable verbs join the
-- criteria and the grammar link moves from present-tense-regular to
-- separable-verbs-intro. The colleague speaks Sie (course register: du only
-- between learners).
UPDATE public.speaking_missions SET
  mission_order = 111,
  title_en = 'My day',
  title_de = 'Mein Tag',
  scenario_en = 'A colleague asks about your day. Your goal: describe your daily routine — when you get up, when you work, when you go shopping — using at least one separable verb.',
  scenario_de = 'Eine Kollegin fragt nach Ihrem Tag. Ihr Ziel: Erzählen Sie von Ihrem Tagesablauf — wann Sie aufstehen, wann Sie arbeiten und wann Sie einkaufen — mit mindestens einem trennbaren Verb.',
  ai_opening_line = 'Guten Morgen! Wie ist Ihr Tag? Wann stehen Sie morgens auf?',
  target_structures = '["separable verbs: ich stehe ... auf, ich kaufe ... ein, ich rufe ... an","regular present tense conjugation","time-of-day adverbs: morgens, abends"]'::jsonb,
  hint_words = '["aufstehen","einkaufen","anrufen","morgens","abends"]'::jsonb,
  pass_criteria = 'User describes their day with at least four correctly conjugated present-tense verbs in first person, including at least one separable verb correctly split around the sentence bracket (e.g. "Ich stehe um sechs auf.").',
  system_prompt_extra = 'Ask about morning, work, shopping and evening — one question at a time, e.g. "Wann stehen Sie auf?", "Kaufen Sie heute ein?", "Rufen Sie eine Freundin an?". Echo their verbs correctly conjugated, with the prefix at the end. Share one short detail about your own day between questions. Use only present tense, formal Sie, short simple sentences.',
  grammar_topic_id = 'd1cbc951-728b-5dcc-a370-0c10fba7d118'
WHERE id = '6d53ebe9-ab26-4ea8-8021-f7735f620d5d' AND level = 'A1.1' AND mission_order = 8
  AND title_de = 'Ein ganz normaler Tag'
  AND ai_opening_line = 'Na, wie sieht eigentlich dein Tag so aus? Was machst du morgens?';

-- Sanity: all eight moved together, or none (already applied). Anything in
-- between means a row was edited since the 2026-09-16 read — abort loudly
-- instead of leaving a half-reordered route.
DO $$
DECLARE moved integer;
BEGIN
  SELECT count(*) INTO moved FROM public.speaking_missions
  WHERE level = 'A1.1' AND mission_order BETWEEN 101 AND 112;
  IF moved NOT IN (0, 8) THEN
    RAISE EXCEPTION 'a11-speaking-route: % of 8 guarded realignments matched — a speaking_missions row changed since the 2026-09-16 read; resolve by hand, nothing was committed', moved;
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- Phase B: drop the parked rows onto their final orders (101→1 ... 111→11)
-- --------------------------------------------------------------------------
UPDATE public.speaking_missions
SET mission_order = mission_order - 100
WHERE level = 'A1.1' AND mission_order BETWEEN 101 AND 112;

-- --------------------------------------------------------------------------
-- Phase C: the four missing missions (L7, L8, L10, L12)
-- --------------------------------------------------------------------------

-- order 7 — L7 Freizeit und Hobbys (primarySlug present-tense-regular).
INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT 'd061e16a-9c9a-4f23-8259-50ed9212ef5f', 'A1.1', 7, 'c1af3357-5fe4-4226-9a2a-1f6c98df13f2',
  'Hobbies and free time',
  'Freizeit und Hobbys',
  'A Part-2-style conversation about free time. Your goal: say what your hobby is, name three things you like doing with gern, and ask one question back.',
  'Ein Gespräch über Freizeit wie in Sprechen Teil 2. Ihr Ziel: Sagen Sie, was Ihr Hobby ist, nennen Sie drei Dinge mit „gern“ und stellen Sie eine Frage zurück.',
  'friendly fellow course participant (exam partner)',
  'Hallo! Wir sprechen über Freizeit. Was ist Ihr Hobby?',
  '["regular present tense: -e, -st, -t","gern after the verb: Ich höre gern Musik","W-Fragen and Ja/Nein-Fragen about hobbies"]'::jsonb,
  '["das Hobby","spielen","hören","lesen","gern","das Wochenende"]'::jsonb,
  'User names their hobby, produces at least three present-tense sentences with gern (e.g. "Ich lese gern."), and asks the partner at least one question about their free time.',
  'You are a fellow course participant practising Teil 2. Ask short questions about hobbies, one at a time: "Was ist Ihr Hobby?", "Was machen Sie am Wochenende?", "Spielen Sie Fußball?". Answer any question the user asks you in one short present-tense sentence and ask one back. Use formal Sie (exam register), only present tense, short simple sentences, no Perfekt, no subordinate clauses.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = 'd061e16a-9c9a-4f23-8259-50ed9212ef5f'
);

-- order 8 — L8 Termine und Uhrzeit (primarySlug time-and-dates).
INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT '8363406d-d79f-4535-9ad5-b8ba22008218', 'A1.1', 8, '3101f292-4ef6-5f64-884c-6703f436e109',
  'Making an appointment',
  'Ein Termin beim Arzt',
  'You call a doctor''s practice. Your goal: ask for an appointment, respond to a conflict by suggesting another day, and agree on a day and time with am and um.',
  'Sie rufen in einer Arztpraxis an. Ihr Ziel: Bitten Sie um einen Termin, reagieren Sie auf einen Konflikt, schlagen Sie einen anderen Tag vor und bestätigen Sie Tag und Uhrzeit mit „am“ und „um“.',
  'calm receptionist at a doctor''s practice',
  'Guten Tag, hier ist die Arztpraxis. Brauchen Sie einen Termin?',
  '["um + Uhrzeit: um halb neun","am + Wochentag: am Dienstag","Haben Sie am ... Zeit?","Wann ...? questions"]'::jsonb,
  '["der Termin","am Montag","um zehn Uhr","halb","Zeit haben"]'::jsonb,
  'User asks for an appointment, names at least one day with am and one time with um, and — when the first slot is not free — suggests or accepts another day or time. The final appointment must be confirmed with day and time.',
  'You are the receptionist. The user wants an appointment. The FIRST day or time the user suggests is not free — say so simply ("Am Montag geht es leider nicht.") and offer an alternative ("Geht es am Dienstag um zehn Uhr?"). Accept the second suggestion. At the end, repeat the appointment ("Also: am Dienstag um zehn Uhr."). Use only present tense, formal Sie, short simple sentences, times with um and days with am — never Perfekt or subordinate clauses.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = '8363406d-d79f-4535-9ad5-b8ba22008218'
);

-- order 10 — L10 Am Bahnhof (primarySlug yes-no-questions).
INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT '90d0d8cf-44f6-4696-97bc-6305e1c3e042', 'A1.1', 10, 'f29b3240-b144-5f4f-8c58-a502c293b01d',
  'At the station',
  'Am Bahnhof',
  'You are at the ticket counter at the station. Your goal: say where you want to go, ask when the train leaves, ask what the ticket costs, and confirm the platform.',
  'Sie sind am Schalter im Bahnhof. Ihr Ziel: Sagen Sie, wohin Sie fahren, fragen Sie, wann der Zug fährt und was die Fahrkarte kostet, und bestätigen Sie das Gleis.',
  'helpful clerk at the station ticket counter',
  'Guten Tag! Wohin fahren Sie?',
  '["Ja/Nein-Fragen: verb first (Fährt der Zug ...?)","fahren: du fährst, er fährt","Ich fahre nach + place","prices and platform numbers"]'::jsonb,
  '["fahren","der Zug","die Fahrkarte","das Gleis","die Abfahrt","die Verspätung"]'::jsonb,
  'User names a destination (Ich fahre nach ...), asks at least one verb-first yes/no question about the journey (e.g. "Fährt der Zug um neun Uhr?" or "Hat der Zug Verspätung?"), asks the ticket price, and repeats or confirms the platform.',
  'You are the clerk at the counter. Answer with concrete details: the train leaves at nine from platform four, the ticket costs fifteen euros, the train is on time. Pause after each answer so the user can ask the next question. If the user forms a question with the verb in the wrong position, answer it anyway and repeat the question correctly once. At the end say the platform again and let the user confirm it. Use only present tense, formal Sie, short simple sentences.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = '90d0d8cf-44f6-4696-97bc-6305e1c3e042'
);

-- order 12 — L12 Feste feiern: the INTEGRATED FINAL ENCOUNTER (Abschlussmission).
-- The A1.1 Abschlusstest hands off to exactly this row (abschlusstestA11.js,
-- sprechen part, missionOrder 12: „Du stellst dich vor, reagierst auf Rückfragen
-- und lädst eine Person ein.“). primarySlug possessive-articles.
INSERT INTO public.speaking_missions (
  id, level, mission_order, grammar_topic_id,
  title_en, title_de, scenario_en, scenario_de,
  ai_role, ai_opening_line, target_structures, hint_words,
  pass_criteria, system_prompt_extra, is_free, is_published
)
SELECT 'fd2d2dac-4e15-4ef2-a2bc-b8a696e18b62', 'A1.1', 12, '4b9de34e-e09d-55e9-bb53-9cb3e3a692c5',
  'Final mission: an invitation',
  'Abschlussmission: Die Einladung',
  'The final mission of the course. You meet a new colleague. Your goal: introduce yourself, answer her follow-up questions, and invite her to your birthday party with a day and a time.',
  'Die Abschlussmission des Kurses. Sie treffen eine neue Kollegin. Ihr Ziel: Stellen Sie sich vor, antworten Sie auf ihre Rückfragen und laden Sie sie zu Ihrem Geburtstagsfest ein — mit Tag und Uhrzeit.',
  'friendly new colleague you meet for the first time',
  'Guten Tag! Ich bin Ihre neue Kollegin. Wie heißen Sie?',
  '["sein and haben in self-introduction","ich komme aus / ich wohne in / von Beruf","einladen: Ich lade Sie ein / Kommen Sie ...?","am + Tag, um + Uhrzeit","Possessivartikel: mein Fest, meine Party"]'::jsonb,
  '["ich heiße","kommen aus","von Beruf","einladen","das Fest","am Freitag","um acht Uhr"]'::jsonb,
  'Three parts, all required: (1) user introduces themselves with name, origin and job; (2) user answers at least two follow-up questions in full sentences; (3) user invites the colleague to a celebration with a day (am ...) and a time (um ...) and reacts politely to her answer.',
  'This is the course''s final integrated mission. Phase 1: let the user introduce themselves; if a detail is missing (name, origin, job), ask for it simply. Phase 2: ask two follow-up questions about their details ("Welche Sprachen sprechen Sie?", "Was ist Ihr Hobby?") and wait for the answers. Phase 3: say something friendly, then wait — the user should invite you to their party; if nothing comes, prompt gently ("Feiern Sie bald etwas?"). Accept the invitation happily and ask one detail back ("Wann ist das Fest?") if the day or the time is missing. Use only present tense, formal Sie, short simple sentences, no Perfekt, no Präteritum, no subordinate clauses.',
  false, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.speaking_missions WHERE id = 'fd2d2dac-4e15-4ef2-a2bc-b8a696e18b62'
);

-- --------------------------------------------------------------------------
-- Final assertion: exactly 12 published A1.1 rows, mission_order 1–12,
-- only mission 1 free. Runs green on a re-run too.
-- --------------------------------------------------------------------------
DO $$
DECLARE total integer; freies integer;
BEGIN
  SELECT count(*) INTO total FROM public.speaking_missions
  WHERE level = 'A1.1' AND is_published AND mission_order BETWEEN 1 AND 12;
  IF total <> 12 THEN
    RAISE EXCEPTION 'a11-speaking-route: expected 12 published A1.1 missions at orders 1-12, found % — nothing was committed', total;
  END IF;
  SELECT count(*) INTO freies FROM public.speaking_missions
  WHERE level = 'A1.1' AND is_free;
  IF freies <> 1 THEN
    RAISE EXCEPTION 'a11-speaking-route: expected exactly 1 free A1.1 mission (order 1), found % — nothing was committed', freies;
  END IF;
END $$;

COMMIT;
