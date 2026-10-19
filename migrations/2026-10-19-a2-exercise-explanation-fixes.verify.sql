-- Read-only checks for migrations/2026-10-19-a2-exercise-explanation-fixes.sql (36 UPDATEs, E001–E036).
-- Nothing here writes. One row per UPDATE, named by its statement number.

-- Block 1 — BEFORE applying. ok = exactly one live row matches the statement's id AND its guard (the current text).
-- Expect ok = true on all 36 rows; rows with ok = false sort first. false means the row drifted since the 2026-10-19
-- dump (that UPDATE would change nothing): re-dump the cache and re-check the guard before applying.
SELECT n, ok FROM (
  SELECT 'E001' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '71b24aca-40f0-5d8a-86ef-b5eef1c51d9d' AND explanation_de = $q$gehören hat immer ein Dativobjekt. Maskulin: mein → meinem.$q$
  UNION ALL
  SELECT 'E002' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '71b24aca-40f0-5d8a-86ef-b5eef1c51d9d' AND explanation_en = $q$gehören always takes a dative object, and in the masculine dative mein becomes meinem.$q$
  UNION ALL
  SELECT 'E003' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '86fb31bd-0920-53da-b4e3-c074bc3a94b8' AND explanation_de = $q$helfen hat nie ein Akkusativobjekt. Das Objekt steht immer im Dativ.$q$
  UNION ALL
  SELECT 'E004' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '86fb31bd-0920-53da-b4e3-c074bc3a94b8' AND explanation_en = $q$helfen never takes an accusative object; its object is always dative.$q$
  UNION ALL
  SELECT 'E005' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'c295fc4f-21b1-5f85-bc04-d15eb5bce594' AND explanation_de = $q$seit und etwas, das jeden Tag weiterläuft: Da steht das Präsens, nicht das Perfekt.$q$
  UNION ALL
  SELECT 'E006' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'c295fc4f-21b1-5f85-bc04-d15eb5bce594' AND explanation_en = $q$seit plus something that still happens every day needs the present tense, not the Perfekt.$q$
  UNION ALL
  SELECT 'E007' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '9cf1e978-dd95-4e6c-aaa8-7883fa5f3092' AND explanation_de = $q$Mit Modalverben bleibt es als Infinitiv zusammen.$q$
  UNION ALL
  SELECT 'E008' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '9cf1e978-dd95-4e6c-aaa8-7883fa5f3092' AND explanation_en = $q$With modals, stays together as infinitive.$q$
  UNION ALL
  SELECT 'E009' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '751cf21a-3bf3-4b49-8e70-9bebecb2e8a1' AND explanation_de = $q$Bewegung, Zustandsänderung, sein/bleiben.$q$
  UNION ALL
  SELECT 'E010' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '751cf21a-3bf3-4b49-8e70-9bebecb2e8a1' AND explanation_en = $q$Movement A→B, change of state, sein/bleiben.$q$
  UNION ALL
  SELECT 'E011' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '485648bc-3987-5288-bf14-d7e6d325f54c' AND explanation_de = $q$Die Sie-Form ist immer der Infinitiv plus Sie.$q$
  UNION ALL
  SELECT 'E012' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '485648bc-3987-5288-bf14-d7e6d325f54c' AND explanation_en = $q$The Sie-form is the infinitive plus Sie, however long the verb is - buchstabieren keeps every syllable.$q$
  UNION ALL
  SELECT 'E013' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f783bc6c-168f-5870-be37-b2e29fb68de9' AND explanation_de = $q$Der du-Imperativ steht ohne du. Nur Sie bleibt stehen.$q$
  UNION ALL
  SELECT 'E014' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f783bc6c-168f-5870-be37-b2e29fb68de9' AND explanation_en = $q$The du-imperative never keeps the pronoun du; only Sie stays.$q$
  UNION ALL
  SELECT 'E015' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '3d8975c9-041e-59a6-9c4c-b5f29f211ceb' AND explanation_de = $q$mit steht immer mit Dativ. Im Dativ ist die Endung immer -en.$q$
  UNION ALL
  SELECT 'E016' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '3d8975c9-041e-59a6-9c4c-b5f29f211ceb' AND explanation_en = $q$mit always takes the dative; in the dative the ending is always -en.$q$
  UNION ALL
  SELECT 'E017' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '428928b8-3f4c-55e1-be89-d83d0c1cbdc3' AND explanation_de = $q$kein hat einen Plural, ein nicht. Im Plural ist die Endung immer -en.$q$
  UNION ALL
  SELECT 'E018' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '428928b8-3f4c-55e1-be89-d83d0c1cbdc3' AND explanation_en = $q$kein has a plural, ein does not. In the plural the ending is always -en.$q$
  UNION ALL
  SELECT 'E019' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '529dd3a7-92f5-5e2d-af26-5e44ef3fe7e6' AND explanation_de = $q$mich muss direkt nach habe stehen, nicht am Satzende.$q$
  UNION ALL
  SELECT 'E020' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '529dd3a7-92f5-5e2d-af26-5e44ef3fe7e6' AND explanation_en = $q$mich must come right after habe, not at the end of the sentence.$q$
  UNION ALL
  SELECT 'E021' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'd2072227-0a14-548a-9cc9-a41aae0da3ee' AND explanation_de = $q$es war ist immer Singular, waren ist hier falsch.$q$
  UNION ALL
  SELECT 'E022' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'd2072227-0a14-548a-9cc9-a41aae0da3ee' AND explanation_en = $q$es war is always singular; waren is wrong here.$q$
  UNION ALL
  SELECT 'E023' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND explanation_de = $q$entweder steht hier allein, darum kommt das Verb direkt danach: gehen wir.$q$
  UNION ALL
  SELECT 'E024' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND explanation_en = $q$entweder stands alone here, so the verb comes right after it: gehen wir.$q$
  UNION ALL
  SELECT 'E025' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'feecbab1-320a-43f0-8294-b7d5a196bbb5' AND explanation_de = $q$fahren benutzt 'sein' im Perfekt. gefahren ist am Ende.$q$
  UNION ALL
  SELECT 'E026' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'feecbab1-320a-43f0-8294-b7d5a196bbb5' AND explanation_en = $q$fahren uses 'sein' in perfect. gefahren ist at the end.$q$
  UNION ALL
  SELECT 'E027' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'a1b573d3-ab85-4b72-a51a-44b14783888f' AND explanation_en = $q$alt → älter with umlaut! One-syllable with a gets ä.$q$
  UNION ALL
  SELECT 'E028' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f3a1fdcf-baec-5f0d-9518-9adefd62d1c2' AND explanation_de = $q$Der Komparativ braucht immer als, nie wie.$q$
  UNION ALL
  SELECT 'E029' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f3a1fdcf-baec-5f0d-9518-9adefd62d1c2' AND explanation_en = $q$The comparative always takes als, never wie.$q$
  UNION ALL
  SELECT 'E030' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'dd3c68e3-e2ef-5ceb-b188-33f0b1d3db35' AND explanation_de = $q$denken braucht immer an + Akkusativ, nicht über.$q$
  UNION ALL
  SELECT 'E031' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'dd3c68e3-e2ef-5ceb-b188-33f0b1d3db35' AND explanation_en = $q$denken always takes an + Akkusativ, not über.$q$
  UNION ALL
  SELECT 'E032' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND question_de = $q$Which verb is ALWAYS reflexive in German?$q$
  UNION ALL
  SELECT 'E033' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND question_en = $q$Welches Verb ist im Deutschen IMMER reflexiv?$q$
  UNION ALL
  SELECT 'E034' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND explanation_de = $q$sich freuen ist immer reflexiv.$q$
  UNION ALL
  SELECT 'E035' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND explanation_en = $q$sich freuen (to be happy) is always reflexive. waschen can be reflexive or not (ich wasche mich vs. ich wasche das Auto).$q$
  UNION ALL
  SELECT 'E036' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND question_en = $q$Either we go to the cinema, or we stay home. entweder alone: verb comes right after it. Base form: gehen.$q$
) b ORDER BY ok, n;

-- Block 2 — AFTER applying. ok = the row now holds the statement's new value. Expect ok = true on all 36 rows.
SELECT n, ok FROM (
  SELECT 'E001' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '71b24aca-40f0-5d8a-86ef-b5eef1c51d9d' AND explanation_de = $q$gehören im Sinn von Besitz hat ein Dativobjekt: Wem gehört der Koffer? Meinem Onkel. Maskulin: mein → meinem.$q$
  UNION ALL
  SELECT 'E002' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '71b24aca-40f0-5d8a-86ef-b5eef1c51d9d' AND explanation_en = $q$When gehören is about ownership, it takes a dative object: Wem gehört der Koffer? Meinem Onkel. In the masculine dative mein becomes meinem.$q$
  UNION ALL
  SELECT 'E003' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '86fb31bd-0920-53da-b4e3-c074bc3a94b8' AND explanation_de = $q$Bei helfen steht die Person im Dativ: Wem helfen wir? Unserer Nachbarin (unsere → unserer).$q$
  UNION ALL
  SELECT 'E004' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '86fb31bd-0920-53da-b4e3-c074bc3a94b8' AND explanation_en = $q$With helfen the person helped is in the dative: Wem helfen wir? Unserer Nachbarin (unsere → unserer).$q$
  UNION ALL
  SELECT 'E005' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'c295fc4f-21b1-5f85-bc04-d15eb5bce594' AND explanation_de = $q$Läuft etwas heute noch weiter, steht bei seit meistens das Präsens: Seit einem Monat spiele ich jeden Tag Gitarre.$q$
  UNION ALL
  SELECT 'E006' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'c295fc4f-21b1-5f85-bc04-d15eb5bce594' AND explanation_en = $q$If something is still going on today, German usually uses the present tense with seit: Seit einem Monat spiele ich jeden Tag Gitarre.$q$
  UNION ALL
  SELECT 'E007' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '9cf1e978-dd95-4e6c-aaa8-7883fa5f3092' AND explanation_de = $q$Mit einem Modalverb bleibt es als Infinitiv zusammen: Ich muss früh aufstehen. Ebenso am Ende eines Nebensatzes: …, weil ich früh aufstehe.$q$
  UNION ALL
  SELECT 'E008' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '9cf1e978-dd95-4e6c-aaa8-7883fa5f3092' AND explanation_en = $q$With a modal verb it stays together as an infinitive: Ich muss früh aufstehen. Likewise at the end of a subordinate clause: …, weil ich früh aufstehe.$q$
  UNION ALL
  SELECT 'E009' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '751cf21a-3bf3-4b49-8e70-9bebecb2e8a1' AND explanation_de = $q$Perfekt mit sein: vor allem Verben ohne Akkusativobjekt, die eine Bewegung von A nach B (gehen) oder eine Zustandsänderung (einschlafen) zeigen; dazu sein, bleiben, passieren.$q$
  UNION ALL
  SELECT 'E010' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '751cf21a-3bf3-4b49-8e70-9bebecb2e8a1' AND explanation_en = $q$Perfect with sein: mainly verbs without an accusative object that show movement A→B (gehen) or a change of state (einschlafen); plus sein, bleiben, passieren.$q$
  UNION ALL
  SELECT 'E011' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '485648bc-3987-5288-bf14-d7e6d325f54c' AND explanation_de = $q$Bei buchstabieren: Infinitiv + Sie → Buchstabieren Sie! (Bei sein heißt es: Seien Sie!)$q$
  UNION ALL
  SELECT 'E012' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '485648bc-3987-5288-bf14-d7e6d325f54c' AND explanation_en = $q$For buchstabieren: infinitive + Sie → Buchstabieren Sie! (With sein it is: Seien Sie!)$q$
  UNION ALL
  SELECT 'E013' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f783bc6c-168f-5870-be37-b2e29fb68de9' AND explanation_de = $q$Im du-Imperativ fällt du normalerweise weg: Komm bitte um acht! Beim Sie-Imperativ bleibt Sie stehen: Kommen Sie!$q$
  UNION ALL
  SELECT 'E014' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f783bc6c-168f-5870-be37-b2e29fb68de9' AND explanation_en = $q$The du-imperative normally leaves out du: Komm bitte um acht! The Sie-imperative keeps Sie: Kommen Sie!$q$
  UNION ALL
  SELECT 'E015' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '3d8975c9-041e-59a6-9c4c-b5f29f211ceb' AND explanation_de = $q$Nach mit steht der Dativ: mit der Ärztin. Nach einem Artikel endet das Adjektiv im Dativ auf -en: mit der netten Ärztin.$q$
  UNION ALL
  SELECT 'E016' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '3d8975c9-041e-59a6-9c4c-b5f29f211ceb' AND explanation_en = $q$mit takes the dative: mit der Ärztin. After an article, an adjective in the dative ends in -en: mit der netten Ärztin.$q$
  UNION ALL
  SELECT 'E017' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '428928b8-3f4c-55e1-be89-d83d0c1cbdc3' AND explanation_de = $q$kein hat einen Plural, ein nicht. Nach keine im Plural endet das Adjektiv auf -en: keine guten Fotos.$q$
  UNION ALL
  SELECT 'E018' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '428928b8-3f4c-55e1-be89-d83d0c1cbdc3' AND explanation_en = $q$kein has a plural, ein does not. After keine in the plural the adjective ends in -en: keine guten Fotos.$q$
  UNION ALL
  SELECT 'E019' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '529dd3a7-92f5-5e2d-af26-5e44ef3fe7e6' AND explanation_de = $q$Das Partizip angemeldet steht am Satzende, mich steht nach habe: Ich habe mich für den Kurs angemeldet.$q$
  UNION ALL
  SELECT 'E020' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '529dd3a7-92f5-5e2d-af26-5e44ef3fe7e6' AND explanation_en = $q$The participle angemeldet goes at the end of the sentence, and mich comes after habe: Ich habe mich für den Kurs angemeldet.$q$
  UNION ALL
  SELECT 'E021' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'd2072227-0a14-548a-9cc9-a41aae0da3ee' AND explanation_de = $q$Hier ist es das Subjekt, also Singular: Es war sehr kalt im Winter. Aber: Es waren viele Leute da (Subjekt: viele Leute).$q$
  UNION ALL
  SELECT 'E022' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'd2072227-0a14-548a-9cc9-a41aae0da3ee' AND explanation_en = $q$Here es is the subject, so the verb is singular: Es war sehr kalt im Winter. But: Es waren viele Leute da (subject: viele Leute).$q$
  UNION ALL
  SELECT 'E023' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND explanation_de = $q$Nach entweder kann das Verb direkt folgen: Entweder gehen wir ins Kino … Auch richtig: Entweder wir gehen ins Kino …$q$
  UNION ALL
  SELECT 'E024' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND explanation_en = $q$The verb can come straight after entweder: Entweder gehen wir ins Kino … Also correct: Entweder wir gehen ins Kino …$q$
  UNION ALL
  SELECT 'E025' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'feecbab1-320a-43f0-8294-b7d5a196bbb5' AND explanation_de = $q$Hier hat fahren kein Akkusativobjekt und zeigt einen Ortswechsel (nach Berlin): Perfekt mit sein. Der dass-Satz endet mit gefahren ist.$q$
  UNION ALL
  SELECT 'E026' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'feecbab1-320a-43f0-8294-b7d5a196bbb5' AND explanation_en = $q$Here fahren has no accusative object and shows a change of place (nach Berlin): perfect with sein. The dass-clause ends with gefahren ist.$q$
  UNION ALL
  SELECT 'E027' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'a1b573d3-ab85-4b72-a51a-44b14783888f' AND explanation_en = $q$alt → älter with umlaut. Many short adjectives take an umlaut (alt, groß, jung), but not all: klar → klarer.$q$
  UNION ALL
  SELECT 'E028' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f3a1fdcf-baec-5f0d-9518-9adefd62d1c2' AND explanation_de = $q$Beim Vergleich mit dem Komparativ steht als: stärker als sein Vater. Bei Gleichheit steht wie: so stark wie sein Vater.$q$
  UNION ALL
  SELECT 'E029' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'f3a1fdcf-baec-5f0d-9518-9adefd62d1c2' AND explanation_en = $q$In a comparison with the comparative, German uses als: stärker als sein Vater. For equality it uses wie: so stark wie sein Vater.$q$
  UNION ALL
  SELECT 'E030' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'dd3c68e3-e2ef-5ceb-b188-33f0b1d3db35' AND explanation_de = $q$denken an + Akkusativ: Man hat jemanden oder etwas in Gedanken. Sie denkt oft an ihre Schule. (denken über: eine Meinung haben.)$q$
  UNION ALL
  SELECT 'E031' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = 'dd3c68e3-e2ef-5ceb-b188-33f0b1d3db35' AND explanation_en = $q$denken an + Akkusativ means having someone or something on your mind: Sie denkt oft an ihre Schule. (denken über means having an opinion.)$q$
  UNION ALL
  SELECT 'E032' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND question_de = $q$Welches Verb passt in den Satz „Ich ___ mich auf den Urlaub.“?$q$
  UNION ALL
  SELECT 'E033' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND question_en = $q$Which verb fits the sentence „Ich ___ mich auf den Urlaub.“? (I am looking forward to the holiday.)$q$
  UNION ALL
  SELECT 'E034' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND explanation_de = $q$Ich freue mich auf den Urlaub: sich freuen auf + Akkusativ. waschen geht auch mit mich (Ich wasche mich), passt aber nicht zu auf den Urlaub.$q$
  UNION ALL
  SELECT 'E035' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND explanation_en = $q$Ich freue mich auf den Urlaub: sich freuen auf + accusative means to look forward to something. waschen can also take mich (Ich wasche mich), but it does not fit auf den Urlaub.$q$
  UNION ALL
  SELECT 'E036' AS n, (count(*) = 1) AS ok FROM public.grammar_exercises WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND question_en = $q$Either we go to the cinema, or we stay home. Put the verb right after entweder. Base form: gehen.$q$
) a ORDER BY ok, n;
