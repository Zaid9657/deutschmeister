-- A2 exercise explanation fixes, Wave 1b — the EXPLANATION-FALSE items of the A2 bank audit.
--
-- APPLIED 2026-10-19 on omqyueddktqeyrrqvnyq via the Supabase connector, under the owner's approval of the same day to
-- fix the live A2 pages (migrations/README.md). Data only, no schema.
-- What it does: 36 guarded UPDATEs (E001–E036) on public.grammar_exercises — E001–E031 explanation_de and
-- explanation_en of 16 A2 exercises in 12 topics; E032–E036, added in review, the 17th audited item and one prompt. They replace explanations that state a false rule (the class EXPLANATION-FALSE of
-- docs/course-factory/a2-bank-audit/AUDIT-2026-10-17.md, §4 C8, branch claude/a2-bank-audit) with text that claims no
-- more than it covers and still explains the item's own answer key. No answer or option changes; no row is
-- inserted or deleted. Three of the 16 rows carry the audit verdict DROP for the course pool (9cf1e978, 751cf21a,
-- f783bc6c); they are still on the live pages, so their explanations are fixed here too. The 17th audited item,
-- 17e4a1e4 („Which verb is ALWAYS reflexive“), asked a false question (and had its two prompt fields swapped): E032–
-- E035 ask for the verb of „Ich ___ mich auf den Urlaub.“ instead, which keeps its options and its key „sich freuen“
-- true. E036 rewords 93a3eef1's English prompt, which repeated the fixed claim. Statement map, old and new text, reasons and the open items:
-- docs/course-factory/a2-grammar-audit/WAVE1B-2026-10-19.md.
-- Why: the Astro grammar pages print explanation_en under every exercise, and the A2.1/A2.2 course pools will read both
-- fields. Examples of what goes: „gehören hat immer ein Dativobjekt.“, „es war ist immer Singular, waren ist hier
-- falsch.“, „Im Dativ ist die Endung immer -en.“, „fahren benutzt 'sein' im Perfekt.“, „One-syllable with a gets ä.“
-- Guards: every UPDATE names its row by id AND the field's current text as dumped on 2026-10-19, after the Wave 1 rule
-- fix (grammar-content-cache.json, dumpedAt 2026-10-19). A row that drifted since then updates nothing instead of being
-- overwritten, and a second run is a no-op.
-- Before applying: run block 1 of 2026-10-19-a2-exercise-explanation-fixes.verify.sql — every row must say ok = true
-- (exactly 1 live match). After applying: block 2 of the same file, then
--   node scripts/dump-grammar-cache.mjs grammar-content-cache.json
-- and a site rebuild (llms.txt only counts exercises, so it does not change).
-- Rollback: the old value of every field is the guard of its statement; swapping SET and guard reverses it.

BEGIN;

-- ── A2.1-01 dative-case ─────────────────────────────────────────────────────────────────────────────────────────────

-- E001 · A2.1-01 dative-case · 71b24aca · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$gehören im Sinn von Besitz hat ein Dativobjekt: Wem gehört der Koffer? Meinem Onkel. Maskulin: mein → meinem.$q$
WHERE id = '71b24aca-40f0-5d8a-86ef-b5eef1c51d9d' AND explanation_de = $q$gehören hat immer ein Dativobjekt. Maskulin: mein → meinem.$q$;

-- E002 · A2.1-01 dative-case · 71b24aca · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$When gehören is about ownership, it takes a dative object: Wem gehört der Koffer? Meinem Onkel. In the masculine dative mein becomes meinem.$q$
WHERE id = '71b24aca-40f0-5d8a-86ef-b5eef1c51d9d' AND explanation_en = $q$gehören always takes a dative object, and in the masculine dative mein becomes meinem.$q$;

-- E003 · A2.1-01 dative-case · 86fb31bd · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Bei helfen steht die Person im Dativ: Wem helfen wir? Unserer Nachbarin (unsere → unserer).$q$
WHERE id = '86fb31bd-0920-53da-b4e3-c074bc3a94b8' AND explanation_de = $q$helfen hat nie ein Akkusativobjekt. Das Objekt steht immer im Dativ.$q$;

-- E004 · A2.1-01 dative-case · 86fb31bd · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$With helfen the person helped is in the dative: Wem helfen wir? Unserer Nachbarin (unsere → unserer).$q$
WHERE id = '86fb31bd-0920-53da-b4e3-c074bc3a94b8' AND explanation_en = $q$helfen never takes an accusative object; its object is always dative.$q$;

-- ── A2.1-02 prepositions-dative ─────────────────────────────────────────────────────────────────────────────────────

-- E005 · A2.1-02 prepositions-dative · c295fc4f · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Läuft etwas heute noch weiter, steht bei seit meistens das Präsens: Seit einem Monat spiele ich jeden Tag Gitarre.$q$
WHERE id = 'c295fc4f-21b1-5f85-bc04-d15eb5bce594' AND explanation_de = $q$seit und etwas, das jeden Tag weiterläuft: Da steht das Präsens, nicht das Perfekt.$q$;

-- E006 · A2.1-02 prepositions-dative · c295fc4f · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$If something is still going on today, German usually uses the present tense with seit: Seit einem Monat spiele ich jeden Tag Gitarre.$q$
WHERE id = 'c295fc4f-21b1-5f85-bc04-d15eb5bce594' AND explanation_en = $q$seit plus something that still happens every day needs the present tense, not the Perfekt.$q$;

-- ── A2.1-05 separable-verbs ─────────────────────────────────────────────────────────────────────────────────────────

-- E007 · A2.1-05 separable-verbs · 9cf1e978 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Mit einem Modalverb bleibt es als Infinitiv zusammen: Ich muss früh aufstehen. Ebenso am Ende eines Nebensatzes: …, weil ich früh aufstehe.$q$
WHERE id = '9cf1e978-dd95-4e6c-aaa8-7883fa5f3092' AND explanation_de = $q$Mit Modalverben bleibt es als Infinitiv zusammen.$q$;

-- E008 · A2.1-05 separable-verbs · 9cf1e978 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$With a modal verb it stays together as an infinitive: Ich muss früh aufstehen. Likewise at the end of a subordinate clause: …, weil ich früh aufstehe.$q$
WHERE id = '9cf1e978-dd95-4e6c-aaa8-7883fa5f3092' AND explanation_en = $q$With modals, stays together as infinitive.$q$;

-- ── A2.1-07 perfect-tense-sein ──────────────────────────────────────────────────────────────────────────────────────

-- E009 · A2.1-07 perfect-tense-sein · 751cf21a · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Perfekt mit sein: vor allem Verben ohne Akkusativobjekt, die eine Bewegung von A nach B (gehen) oder eine Zustandsänderung (einschlafen) zeigen; dazu sein, bleiben, passieren.$q$
WHERE id = '751cf21a-3bf3-4b49-8e70-9bebecb2e8a1' AND explanation_de = $q$Bewegung, Zustandsänderung, sein/bleiben.$q$;

-- E010 · A2.1-07 perfect-tense-sein · 751cf21a · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$Perfect with sein: mainly verbs without an accusative object that show movement A→B (gehen) or a change of state (einschlafen); plus sein, bleiben, passieren.$q$
WHERE id = '751cf21a-3bf3-4b49-8e70-9bebecb2e8a1' AND explanation_en = $q$Movement A→B, change of state, sein/bleiben.$q$;

-- ── A2.1-08 imperative-mood ─────────────────────────────────────────────────────────────────────────────────────────

-- E011 · A2.1-08 imperative-mood · 485648bc · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Bei buchstabieren: Infinitiv + Sie → Buchstabieren Sie! (Bei sein heißt es: Seien Sie!)$q$
WHERE id = '485648bc-3987-5288-bf14-d7e6d325f54c' AND explanation_de = $q$Die Sie-Form ist immer der Infinitiv plus Sie.$q$;

-- E012 · A2.1-08 imperative-mood · 485648bc · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$For buchstabieren: infinitive + Sie → Buchstabieren Sie! (With sein it is: Seien Sie!)$q$
WHERE id = '485648bc-3987-5288-bf14-d7e6d325f54c' AND explanation_en = $q$The Sie-form is the infinitive plus Sie, however long the verb is - buchstabieren keeps every syllable.$q$;

-- E013 · A2.1-08 imperative-mood · f783bc6c · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Im du-Imperativ fällt du normalerweise weg: Komm bitte um acht! Beim Sie-Imperativ bleibt Sie stehen: Kommen Sie!$q$
WHERE id = 'f783bc6c-168f-5870-be37-b2e29fb68de9' AND explanation_de = $q$Der du-Imperativ steht ohne du. Nur Sie bleibt stehen.$q$;

-- E014 · A2.1-08 imperative-mood · f783bc6c · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$The du-imperative normally leaves out du: Komm bitte um acht! The Sie-imperative keeps Sie: Kommen Sie!$q$
WHERE id = 'f783bc6c-168f-5870-be37-b2e29fb68de9' AND explanation_en = $q$The du-imperative never keeps the pronoun du; only Sie stays.$q$;

-- ── A2.1-09 adjective-endings-intro ─────────────────────────────────────────────────────────────────────────────────

-- E015 · A2.1-09 adjective-endings-intro · 3d8975c9 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Nach mit steht der Dativ: mit der Ärztin. Nach einem Artikel endet das Adjektiv im Dativ auf -en: mit der netten Ärztin.$q$
WHERE id = '3d8975c9-041e-59a6-9c4c-b5f29f211ceb' AND explanation_de = $q$mit steht immer mit Dativ. Im Dativ ist die Endung immer -en.$q$;

-- E016 · A2.1-09 adjective-endings-intro · 3d8975c9 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$mit takes the dative: mit der Ärztin. After an article, an adjective in the dative ends in -en: mit der netten Ärztin.$q$
WHERE id = '3d8975c9-041e-59a6-9c4c-b5f29f211ceb' AND explanation_en = $q$mit always takes the dative; in the dative the ending is always -en.$q$;

-- E017 · A2.1-09 adjective-endings-intro · 428928b8 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$kein hat einen Plural, ein nicht. Nach keine im Plural endet das Adjektiv auf -en: keine guten Fotos.$q$
WHERE id = '428928b8-3f4c-55e1-be89-d83d0c1cbdc3' AND explanation_de = $q$kein hat einen Plural, ein nicht. Im Plural ist die Endung immer -en.$q$;

-- E018 · A2.1-09 adjective-endings-intro · 428928b8 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$kein has a plural, ein does not. After keine in the plural the adjective ends in -en: keine guten Fotos.$q$
WHERE id = '428928b8-3f4c-55e1-be89-d83d0c1cbdc3' AND explanation_en = $q$kein has a plural, ein does not. In the plural the ending is always -en.$q$;

-- ── A2.2-01 reflexive-verbs ─────────────────────────────────────────────────────────────────────────────────────────

-- E019 · A2.2-01 reflexive-verbs · 529dd3a7 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Das Partizip angemeldet steht am Satzende, mich steht nach habe: Ich habe mich für den Kurs angemeldet.$q$
WHERE id = '529dd3a7-92f5-5e2d-af26-5e44ef3fe7e6' AND explanation_de = $q$mich muss direkt nach habe stehen, nicht am Satzende.$q$;

-- E020 · A2.2-01 reflexive-verbs · 529dd3a7 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$The participle angemeldet goes at the end of the sentence, and mich comes after habe: Ich habe mich für den Kurs angemeldet.$q$
WHERE id = '529dd3a7-92f5-5e2d-af26-5e44ef3fe7e6' AND explanation_en = $q$mich must come right after habe, not at the end of the sentence.$q$;

-- ── A2.2-02 simple-past-sein-haben ──────────────────────────────────────────────────────────────────────────────────

-- E021 · A2.2-02 simple-past-sein-haben · d2072227 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Hier ist es das Subjekt, also Singular: Es war sehr kalt im Winter. Aber: Es waren viele Leute da (Subjekt: viele Leute).$q$
WHERE id = 'd2072227-0a14-548a-9cc9-a41aae0da3ee' AND explanation_de = $q$es war ist immer Singular, waren ist hier falsch.$q$;

-- E022 · A2.2-02 simple-past-sein-haben · d2072227 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$Here es is the subject, so the verb is singular: Es war sehr kalt im Winter. But: Es waren viele Leute da (subject: viele Leute).$q$
WHERE id = 'd2072227-0a14-548a-9cc9-a41aae0da3ee' AND explanation_en = $q$es war is always singular; waren is wrong here.$q$;

-- ── A2.2-03 coordinating-conjunctions ───────────────────────────────────────────────────────────────────────────────

-- E023 · A2.2-03 coordinating-conjunctions · 93a3eef1 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Nach entweder kann das Verb direkt folgen: Entweder gehen wir ins Kino … Auch richtig: Entweder wir gehen ins Kino …$q$
WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND explanation_de = $q$entweder steht hier allein, darum kommt das Verb direkt danach: gehen wir.$q$;

-- E024 · A2.2-03 coordinating-conjunctions · 93a3eef1 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$The verb can come straight after entweder: Entweder gehen wir ins Kino … Also correct: Entweder wir gehen ins Kino …$q$
WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND explanation_en = $q$entweder stands alone here, so the verb comes right after it: gehen wir.$q$;

-- ── A2.2-05 subordinate-word-order ──────────────────────────────────────────────────────────────────────────────────

-- E025 · A2.2-05 subordinate-word-order · feecbab1 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Hier hat fahren kein Akkusativobjekt und zeigt einen Ortswechsel (nach Berlin): Perfekt mit sein. Der dass-Satz endet mit gefahren ist.$q$
WHERE id = 'feecbab1-320a-43f0-8294-b7d5a196bbb5' AND explanation_de = $q$fahren benutzt 'sein' im Perfekt. gefahren ist am Ende.$q$;

-- E026 · A2.2-05 subordinate-word-order · feecbab1 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$Here fahren has no accusative object and shows a change of place (nach Berlin): perfect with sein. The dass-clause ends with gefahren ist.$q$
WHERE id = 'feecbab1-320a-43f0-8294-b7d5a196bbb5' AND explanation_en = $q$fahren uses 'sein' in perfect. gefahren ist at the end.$q$;

-- ── A2.2-06 comparative ─────────────────────────────────────────────────────────────────────────────────────────────

-- E027 · A2.2-06 comparative · a1b573d3 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$alt → älter with umlaut. Many short adjectives take an umlaut (alt, groß, jung), but not all: klar → klarer.$q$
WHERE id = 'a1b573d3-ab85-4b72-a51a-44b14783888f' AND explanation_en = $q$alt → älter with umlaut! One-syllable with a gets ä.$q$;

-- E028 · A2.2-06 comparative · f3a1fdcf · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Beim Vergleich mit dem Komparativ steht als: stärker als sein Vater. Bei Gleichheit steht wie: so stark wie sein Vater.$q$
WHERE id = 'f3a1fdcf-baec-5f0d-9518-9adefd62d1c2' AND explanation_de = $q$Der Komparativ braucht immer als, nie wie.$q$;

-- E029 · A2.2-06 comparative · f3a1fdcf · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$In a comparison with the comparative, German uses als: stärker als sein Vater. For equality it uses wie: so stark wie sein Vater.$q$
WHERE id = 'f3a1fdcf-baec-5f0d-9518-9adefd62d1c2' AND explanation_en = $q$The comparative always takes als, never wie.$q$;

-- ── A2.2-10 verbs-with-prepositions-intro ───────────────────────────────────────────────────────────────────────────

-- E030 · A2.2-10 verbs-with-prepositions-intro · dd3c68e3 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$denken an + Akkusativ: Man hat jemanden oder etwas in Gedanken. Sie denkt oft an ihre Schule. (denken über: eine Meinung haben.)$q$
WHERE id = 'dd3c68e3-e2ef-5ceb-b188-33f0b1d3db35' AND explanation_de = $q$denken braucht immer an + Akkusativ, nicht über.$q$;

-- E031 · A2.2-10 verbs-with-prepositions-intro · dd3c68e3 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$denken an + Akkusativ means having someone or something on your mind: Sie denkt oft an ihre Schule. (denken über means having an opinion.)$q$
WHERE id = 'dd3c68e3-e2ef-5ceb-b188-33f0b1d3db35' AND explanation_en = $q$denken always takes an + Akkusativ, not über.$q$;

-- ── Added in review (2026-10-19): the 17th audited item and one English prompt ──

-- E032 · A2.2 reflexive-verbs · 17e4a1e4 · question_de
UPDATE public.grammar_exercises SET question_de = $q$Welches Verb passt in den Satz „Ich ___ mich auf den Urlaub.“?$q$
WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND question_de = $q$Which verb is ALWAYS reflexive in German?$q$;

-- E033 · A2.2 reflexive-verbs · 17e4a1e4 · question_en
UPDATE public.grammar_exercises SET question_en = $q$Which verb fits the sentence „Ich ___ mich auf den Urlaub.“? (I am looking forward to the holiday.)$q$
WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND question_en = $q$Welches Verb ist im Deutschen IMMER reflexiv?$q$;

-- E034 · A2.2 reflexive-verbs · 17e4a1e4 · explanation_de
UPDATE public.grammar_exercises SET explanation_de = $q$Ich freue mich auf den Urlaub: sich freuen auf + Akkusativ. waschen geht auch mit mich (Ich wasche mich), passt aber nicht zu auf den Urlaub.$q$
WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND explanation_de = $q$sich freuen ist immer reflexiv.$q$;

-- E035 · A2.2 reflexive-verbs · 17e4a1e4 · explanation_en
UPDATE public.grammar_exercises SET explanation_en = $q$Ich freue mich auf den Urlaub: sich freuen auf + accusative means to look forward to something. waschen can also take mich (Ich wasche mich), but it does not fit auf den Urlaub.$q$
WHERE id = '17e4a1e4-18e4-495f-848e-2cfa5edcbc2a' AND explanation_en = $q$sich freuen (to be happy) is always reflexive. waschen can be reflexive or not (ich wasche mich vs. ich wasche das Auto).$q$;

-- E036 · A2.2 coordinating-conjunctions · 93a3eef1 · question_en
UPDATE public.grammar_exercises SET question_en = $q$Either we go to the cinema, or we stay home. Put the verb right after entweder. Base form: gehen.$q$
WHERE id = '93a3eef1-88dc-5f80-b30c-ac2c5ad2e380' AND question_en = $q$Either we go to the cinema, or we stay home. entweder alone: verb comes right after it. Base form: gehen.$q$;

COMMIT;
