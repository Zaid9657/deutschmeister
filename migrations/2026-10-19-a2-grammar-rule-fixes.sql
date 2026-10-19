-- A2 grammar rule fixes, Wave 1 — the BLOCKER and MAJOR items of the A2 grammar audit, plus the two REWRITE topics.
--
-- APPLIED 2026-10-19 on omqyueddktqeyrrqvnyq via the Supabase connector, with the owner's approval of the same day
-- (migrations/README.md). Data only, no schema.
-- What it does: 199 guarded UPDATEs (S001–S199) across 20 A2 topics: 163 on public.grammar_rules, 34 on
-- public.grammar_examples and 2 on public.grammar_topics (one topic title). They replace the false or overgeneralised
-- rule text that the audit found on the live A2 grammar pages with the audit's text
-- (docs/course-factory/a2-grammar-audit/AUDIT-2026-10-17.md, Part 2: every BLOCKER and MAJOR item, and the named rules
-- of the two REWRITE topics perfect-tense-haben and perfect-tense-sein).
-- Statement-by-statement map, authored text and open questions: docs/course-factory/a2-grammar-audit/WAVE1-2026-10-19.md.
-- Why: the Astro grammar pages read these rows, and the A2.1/A2.2 course rule cards will be built from them. Owner
-- approved the fix on 2026-10-19. Examples of what goes: „ge___en (unregelmäßig)" (gebracht, gedacht, gekannt, gewusst
-- end in -t), „Diese Verben sind im Deutschen immer reflexiv!", „es war ist immer Singular, nie waren.",
-- „…, weil Sie gestern im Park spazierte." No row is inserted or deleted; one JSON key is removed (S077).
-- Guards: every UPDATE names its row by id AND the field's current text as dumped on 2026-10-15
-- (grammar-content-cache.json). A row that drifted since then updates nothing instead of being overwritten, and a
-- second run is a no-op. docs/course-factory/a2-grammar-audit/wave1-check.mjs re-checks every guard against the cache.
-- Before applying: run block 1 of 2026-10-19-a2-grammar-rule-fixes.verify.sql — every statement must have exactly 1
-- live match. After applying: block 2 of the same file, then
--   node scripts/dump-grammar-cache.mjs grammar-content-cache.json
--   node scripts/build-llms.mjs   (the possessive-pronouns topic title is in llms.txt)
-- then a site rebuild. Two repo follow-ups (WAVE1, "After applying"): src/data/grammarTopics.js still carries the old
-- possessive-pronouns title, and tests/a2-2-legacy-recut.test.mjs pins one field S163/S164 supersede (rule c9511dce).
-- Rollback: the old value of every field is the guard of its statement; swapping SET and guard reverses it (for S077,
-- jsonb_set the key back to its guard text).

BEGIN;

-- ── A2.1-01 dative-case ──────────────────────────────────────────────────────────────────────────────────────────

-- S001 · A2.1-01 #1 MAJOR · R5 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Bei diesen Verben steht die Person im Dativ: Ich helfe dir. Ich glaube Ihnen. Achtung: Bei glauben steht die Sache im Akkusativ: Das glaube ich nicht.$q$
WHERE id = '57b27039-f814-4903-befc-53a0504090d7' AND key_insight_de = $q$Diese Verben verlangen IMMER Dativ.$q$;

-- S002 · A2.1-01 #1 MAJOR · R5 · key_insight_en
UPDATE public.grammar_rules SET key_insight_en = $q$With these verbs the person is in the dative: Ich helfe dir. Ich glaube Ihnen. Careful: with glauben the thing believed is accusative: Das glaube ich nicht.$q$
WHERE id = '57b27039-f814-4903-befc-53a0504090d7' AND key_insight_en = $q$These verbs ALWAYS take dative — even though in English they take direct objects. Memorize them!$q$;

-- S003 · A2.1-01 #1 MAJOR · R5 · memory_trick_de (authored)
UPDATE public.grammar_rules SET memory_trick_de = $q$helfen, danken, gefallen, gehören, glauben, antworten, folgen, gratulieren: Die Person steht im Dativ.$q$
WHERE id = '57b27039-f814-4903-befc-53a0504090d7' AND memory_trick_de = $q$helfen, danken, gefallen, gehören, glauben, antworten, folgen, gratulieren = alle DATIV!$q$;

-- S004 · A2.1-01 #1 MAJOR · R5 · memory_trick_en (twin, authored)
UPDATE public.grammar_rules SET memory_trick_en = $q$Help, thank, please, belong, believe, answer, follow, congratulate: the person is in the DATIVE in German!$q$
WHERE id = '57b27039-f814-4903-befc-53a0504090d7' AND memory_trick_en = $q$Help, thank, please, belong, believe, answer, follow, congratulate = all DATIVE in German!$q$;

-- S005 · A2.1-01 #2 MAJOR · R6 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Im Dativ Singular enden maskuline und neutrale Artikelwörter auf -m (dem, einem, meinem), feminine auf -r (der, einer, meiner). Das -r allein zeigt keinen Dativ: der Mann ist Nominativ. Prüfen Sie das Genus des Nomens.$q$
WHERE id = 'faf890d1-3ff6-4d57-94fd-b312d60c07b8' AND key_insight_de = $q$-M = maskulin/neutral Dativ. -R = feminin Dativ.$q$;

-- S006 · A2.1-01 #2 MAJOR · R6 · key_insight_en
UPDATE public.grammar_rules SET key_insight_en = $q$In the dative singular, masculine and neuter article words end in -m (dem, einem, meinem), feminine ones in -r (der, einer, meiner). An -r alone does not prove dative: der Mann is nominative, so check the noun's gender.$q$
WHERE id = 'faf890d1-3ff6-4d57-94fd-b312d60c07b8' AND key_insight_en = $q$-M = masculine/neuter dative. -R = feminine dative. These endings are consistent!$q$;

-- S007 · A2.1-01 #2 MAJOR · R1 · content{key_insight_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{key_insight_en}', to_jsonb($q$Masculine and neuter share the same dative form (dem/einem). Feminine takes der/einer, which also look like other forms (der Mann is nominative), so check the noun's gender. Plural adds -n to both article (den) and often to the noun.$q$::text))
WHERE id = 'a87a8d59-2a93-4928-94f7-660a1df6bcab' AND content #>> '{key_insight_en}' = $q$Masculine and neuter share the same dative form (dem/einem). Feminine gets a unique form (der/einer). Plural adds -n to both article (den) and often to the noun.$q$;

-- S008 · A2.1-01 #3 MAJOR · R7 · content{content_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{content_de}', to_jsonb($q$Zwei Nomen: Dativ vor Akkusativ: Ich gebe dem Mann das Buch. Pronomen und Nomen: das Pronomen zuerst: Ich gebe ihm das Buch. Ich gebe es dem Mann. Zwei Pronomen: Akkusativ vor Dativ: Ich gebe es ihm.$q$::text))
WHERE id = 'eb825dd6-cd3b-49d9-b356-7dccdf5cbe76' AND content #>> '{content_de}' = $q$Wenn du Dativ- und Akkusativobjekte hast, kommt Dativ meist zuerst.$q$;

-- S009 · A2.1-01 #3 MAJOR · R7 · content{content_en} (twin, authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{content_en}', to_jsonb($q$Two nouns: dative before accusative: Ich gebe dem Mann das Buch. A pronoun and a noun: the pronoun first: Ich gebe ihm das Buch. Ich gebe es dem Mann. Two pronouns: accusative before dative: Ich gebe es ihm.$q$::text))
WHERE id = 'eb825dd6-cd3b-49d9-b356-7dccdf5cbe76' AND content #>> '{content_en}' = $q$When you have both dative and accusative objects, dative usually comes first: 'Ich gebe dem Mann (dat) das Buch (acc).' Exception: if one is a pronoun, the pronoun comes first: 'Ich gebe es ihm' (acc pronoun before dat).$q$;

-- S010 · A2.1-01 #3 MAJOR · R7 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Zwei Nomen: Dativ zuerst. Pronomen vor Nomen. Zwei Pronomen: Akkusativ zuerst.$q$
WHERE id = 'eb825dd6-cd3b-49d9-b356-7dccdf5cbe76' AND key_insight_de = $q$Zwei Nomen: Dativ zuerst. Pronomen dabei: Pronomen zuerst.$q$;

-- S011 · A2.1-01 #3 MAJOR · R7 · key_insight_en
UPDATE public.grammar_rules SET key_insight_en = $q$Two nouns: dative first. A pronoun before a noun. Two pronouns: accusative first.$q$
WHERE id = 'eb825dd6-cd3b-49d9-b356-7dccdf5cbe76' AND key_insight_en = $q$Two nouns: Dative first. Pronoun involved: Pronoun first.$q$;

-- S012 · A2.1-01 #3 MAJOR · R7 · memory_trick_de (authored, splice)
UPDATE public.grammar_rules SET memory_trick_de = $q$Ich gebe DEM MANN DAS BUCH. Aber: Ich gebe ES ihm (zwei Pronomen: Akkusativ zuerst).$q$
WHERE id = 'eb825dd6-cd3b-49d9-b356-7dccdf5cbe76' AND memory_trick_de = $q$Ich gebe DEM MANN DAS BUCH. Aber: Ich gebe ES ihm (Pronomen zuerst).$q$;

-- S013 · A2.1-01 #3 MAJOR · R7 · memory_trick_en (twin, authored, splice)
UPDATE public.grammar_rules SET memory_trick_en = $q$Ich gebe dem Mann das Buch. But: Ich gebe es ihm (two pronouns: accusative first).$q$
WHERE id = 'eb825dd6-cd3b-49d9-b356-7dccdf5cbe76' AND memory_trick_en = $q$Ich gebe dem Mann das Buch. But: Ich gebe es ihm (pronoun first).$q$;

-- S014 · A2.1-01 #4 MAJOR · R9 · content{top_rules,2}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{top_rules,2}', to_jsonb($q$Plural: die → den; the noun adds -n unless its plural already ends in -n or -s (den Kindern, but den Frauen, den Autos).$q$::text))
WHERE id = '27b204c3-8e8e-43ed-8b0b-5462b758fb32' AND content #>> '{top_rules,2}' = $q$Plural: die → den, and add -n to noun (den Kindern)$q$;

-- S015 · A2.1-01 #4 MAJOR · R9 · content{key_formula} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{key_formula}', to_jsonb($q$Dative = indirect object (to/for whom). Ask: wem? der→dem, die→der, das→dem, die(pl)→den (+n unless the plural ends in -n or -s)$q$::text))
WHERE id = '27b204c3-8e8e-43ed-8b0b-5462b758fb32' AND content #>> '{key_formula}' = $q$Dative = indirect object (to/for whom). Ask: wem? der→dem, die→der, das→dem, die(pl)→den+n$q$;

-- S016 · A2.1-01 #4 MAJOR · R9 · content{one_sentence_summary_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{one_sentence_summary_en}', to_jsonb($q$Dative marks indirect objects (recipients) and follows certain verbs/prepositions — all genders change: dem (m/n), der (f), den (pl; the noun adds -n unless it ends in -n or -s).$q$::text))
WHERE id = '27b204c3-8e8e-43ed-8b0b-5462b758fb32' AND content #>> '{one_sentence_summary_en}' = $q$Dative marks indirect objects (recipients) and follows certain verbs/prepositions — all genders change: dem (m/n), der (f), den+n (pl).$q$;

-- S017 · A2.1-01 #4 MAJOR · R1 · content{key_changes,3}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{key_changes,3}', to_jsonb($q$Plural: die → den; the noun adds -n unless its plural already ends in -n or -s (den Kindern, but den Frauen, den Autos).$q$::text))
WHERE id = 'a87a8d59-2a93-4928-94f7-660a1df6bcab' AND content #>> '{key_changes,3}' = $q$Plural: die→den (+ add -n to noun if possible)$q$;

-- ── A2.1-02 prepositions-dative ──────────────────────────────────────────────────────────────────────────────────

-- S018 · A2.1-02 #1 MAJOR · R4 · content{rows,4,1}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,4,1}', to_jsonb($q$nach dem Unterricht$q$::text))
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND content #>> '{rows,4,1}' = $q$—$q$;

-- S019 · A2.1-02 #1 MAJOR · R4 · content{rows,4,2}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,4,2}', to_jsonb($q$nach der Arbeit$q$::text))
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND content #>> '{rows,4,2}' = $q$—$q$;

-- S020 · A2.1-02 #1 MAJOR · R4 · content{rows,4,3}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,4,3}', to_jsonb($q$nach dem Essen$q$::text))
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND content #>> '{rows,4,3}' = $q$—$q$;

-- S021 · A2.1-02 #1 MAJOR · R4 · content{rows,4,4}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,4,4}', to_jsonb($q$nach den Ferien$q$::text))
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND content #>> '{rows,4,4}' = $q$—$q$;

-- S022 · A2.1-02 #1 MAJOR · R4 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Vor Städte- und Ländernamen steht nach ohne Artikel: nach Berlin. In Zeitangaben steht ein Artikel: nach der Arbeit.$q$
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND key_insight_de = $q$nach nimmt normalerweise keine Artikel (nach Berlin, nach Deutschland).$q$;

-- S023 · A2.1-02 #1 MAJOR · R4 · key_insight_en (splice)
UPDATE public.grammar_rules SET key_insight_en = $q$Before city and country names nach has no article (nach Berlin); in time phrases it does (nach der Arbeit). The others always show dative.$q$
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND key_insight_en = $q$nach usually doesn't take articles (nach Berlin, nach Deutschland). The others always show dative.$q$;

-- S024 · A2.1-02 #2 MAJOR · R4 · content{rows,5,1}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,5,1}', to_jsonb($q$aus dem Garten$q$::text))
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND content #>> '{rows,5,1}' = $q$aus dem Haus$q$;

-- S025 · A2.1-02 #2 MAJOR · R4 · content{rows,7,1}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,7,1}', to_jsonb($q$gegenüber dem Bahnhof$q$::text))
WHERE id = '65d40faf-cfcf-46d0-aaec-ea9484d01fee' AND content #>> '{rows,7,1}' = $q$gegenüber dem Hotel$q$;

-- S026 · A2.1-02 #3 MAJOR · R3 · content{mistakes,3,explanation_en}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,3,explanation_en}', to_jsonb($q$Going to a person: zu (zu meinem Freund). Going to a city or a country without an article: nach (nach Berlin), and nach Hause. nach also means after: nach der Arbeit.$q$::text))
WHERE id = '4e37bc49-caaa-4f4f-910d-d842a4238cb1' AND content #>> '{mistakes,3,explanation_en}' = $q$nach is for cities/countries (nach Berlin, nach Deutschland). zu is for people and specific places.$q$;

-- S027 · A2.1-02 #3 MAJOR · R3 · content{mistakes,3,memory_trick_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,3,memory_trick_en}', to_jsonb($q$zu = to a person or a specific place (zu meinem Freund). nach = to a city or country (nach Berlin), nach Hause, and after (nach der Arbeit).$q$::text))
WHERE id = '4e37bc49-caaa-4f4f-910d-d842a4238cb1' AND content #>> '{mistakes,3,memory_trick_en}' = $q$nach = geographic (nach Berlin). zu = personal/specific (zu meinem Freund).$q$;

-- S028 · A2.1-02 #3 MAJOR · R9 · content{top_mistakes,2} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{top_mistakes,2}', to_jsonb($q$nach meinem Freund ❌ → zu meinem Freund ✓ (to a person: zu)$q$::text))
WHERE id = '776c8e5c-9a70-4546-93a6-899039bd607b' AND content #>> '{top_mistakes,2}' = $q$nach meinem Freund ❌ → zu meinem Freund ✓ (nach = geographic only)$q$;

-- S029 · A2.1-02 #4 MAJOR · R6 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Was noch andauert, steht mit seit im Präsens: Ich lerne seit einem Jahr Deutsch. Mit nicht steht oft das Perfekt: Ich habe ihn seit einer Woche nicht gesehen.$q$
WHERE id = '48950b3b-7ed9-4f9a-b6a9-87e291546302' AND key_insight_de = $q$seit + Präsens = have been doing. Nicht mit deutschem Perfekt übersetzen!$q$;

-- S030 · A2.1-02 #4 MAJOR · R6 · key_insight_en (authored: "the English twin is to match")
UPDATE public.grammar_rules SET key_insight_en = $q$What is still going on takes seit with the present tense: Ich lerne seit einem Jahr Deutsch. With nicht the Perfekt is common: Ich habe ihn seit einer Woche nicht gesehen.$q$
WHERE id = '48950b3b-7ed9-4f9a-b6a9-87e291546302' AND key_insight_en = $q$seit + present tense = have been doing. Don't translate with German perfect tense!$q$;

-- ── A2.1-03 two-way-prepositions ─────────────────────────────────────────────────────────────────────────────────

-- S031 · A2.1-03 #1 MAJOR · R6 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Nicht das Verb entscheidet, sondern die Frage. Wohin? (ein neues Ziel) → Akkusativ: Ich gehe in den Park. Wo? (der Ort, auch bei Bewegung im Ort) → Dativ: Ich gehe im Park spazieren.$q$
WHERE id = 'c01c308e-8121-44e5-8ead-a7eb5dd5e883' AND key_insight_de = $q$Bewegungsverben (gehen, fahren, legen, stellen) = Akkusativ.$q$;

-- S032 · A2.1-03 #1 MAJOR · R6 · key_insight_en
UPDATE public.grammar_rules SET key_insight_en = $q$The question decides, not the verb: wohin? (a new destination) → accusative; wo? (the place, even when moving inside it) → dative.$q$
WHERE id = 'c01c308e-8121-44e5-8ead-a7eb5dd5e883' AND key_insight_en = $q$Movement verbs (gehen, fahren, legen, stellen) = accusative with two-way prepositions.$q$;

-- S033 · A2.1-03 #1 MAJOR · R6 · content{content_en} (authored; audit quote abbreviated)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{content_en}', to_jsonb($q$With these verbs you often name a new destination, and then the two-way preposition takes the accusative (wohin?): gehen (go), fahren (drive), fliegen (fly), laufen (run), kommen (come), legen (lay), stellen (put upright), setzen (set), hängen (hang something). Movement inside a place answers wo? and takes the dative: Wir gehen im Park spazieren.$q$::text))
WHERE id = 'c01c308e-8121-44e5-8ead-a7eb5dd5e883' AND content #>> '{content_en}' = $q$These verbs typically signal movement and trigger accusative with two-way prepositions: gehen (go), fahren (drive), fliegen (fly), laufen (run), kommen (come), legen (lay), stellen (put upright), setzen (set), hängen (hang something). They answer wohin?$q$;

-- S034 · A2.1-03 #1 MAJOR · R6 · content{content_de} (twin, authored; covers MINOR #5)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{content_de}', to_jsonb($q$Mit diesen Verben nennt man oft ein neues Ziel. Dann steht nach der Wechselpräposition der Akkusativ (wohin?). Bewegt man sich nur in einem Ort, fragt man wo? Dann steht der Dativ: Wir gehen im Park spazieren.$q$::text))
WHERE id = 'c01c308e-8121-44e5-8ead-a7eb5dd5e883' AND content #>> '{content_de}' = $q$Diese Verben signalisieren typisch Bewegung und lösen Akkusativ aus.$q$;

-- S035 · A2.1-03 #1 MAJOR · R3 · content{mistakes,0,wrong}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,wrong}', to_jsonb($q$Wir gehen heute in dem Kino.$q$::text))
WHERE id = '1fe520ed-f898-4da6-8d7e-15618e7688b1' AND content #>> '{mistakes,0,wrong}' = $q$Ich gehe in dem Park.$q$;

-- S036 · A2.1-03 #1 MAJOR · R3 · content{mistakes,0,correct}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,correct}', to_jsonb($q$Wir gehen heute ins Kino.$q$::text))
WHERE id = '1fe520ed-f898-4da6-8d7e-15618e7688b1' AND content #>> '{mistakes,0,correct}' = $q$Ich gehe in den Park.$q$;

-- S037 · A2.1-03 #1 MAJOR · R3 · content{mistakes,0,explanation_en}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,explanation_en}', to_jsonb($q$Wohin? → accusative.$q$::text))
WHERE id = '1fe520ed-f898-4da6-8d7e-15618e7688b1' AND content #>> '{mistakes,0,explanation_en}' = $q$gehen = movement. Movement = accusative. in + accusative = in den.$q$;

-- S038 · A2.1-03 #1 MAJOR · R3 · content{mistakes,0,memory_trick_en} (authored: the pair changed under it)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,memory_trick_en}', to_jsonb($q$WOHIN gehen wir? Ins Kino. A new destination = accusative!$q$::text))
WHERE id = '1fe520ed-f898-4da6-8d7e-15618e7688b1' AND content #>> '{mistakes,0,memory_trick_en}' = $q$WOHIN gehe ich? In den Park. Going = moving = accusative!$q$;

-- S039 · A2.1-03 #1 MAJOR · R0 · content{paragraphs_en,1} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{paragraphs_en,1}', to_jsonb($q$Think of accusative as the 'destination' case for these prepositions — something is going somewhere new. Dative is the 'place' case — where something is or happens, even when it moves around inside that place: Er läuft im Wald.$q$::text))
WHERE id = 'f8299b00-bbdf-4f99-939a-deae3e40f62f' AND content #>> '{paragraphs_en,1}' = $q$Think of accusative as the 'action' case for these prepositions — something is changing position, going somewhere new. Dative is the 'static' case — something is staying put, already there.$q$;

-- S040 · A2.1-03 #1 MAJOR · R0 · content{paragraphs_en,2}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{paragraphs_en,2}', to_jsonb($q$The same verb can take both: Wir fahren in die Stadt (destination, acc) vs. Wir fahren in der Stadt herum (inside, dat).$q$::text))
WHERE id = 'f8299b00-bbdf-4f99-939a-deae3e40f62f' AND content #>> '{paragraphs_en,2}' = $q$The same verb can trigger different cases with the same preposition: 'Ich Stelle das Glas auf den Tisch' (I place the glass onto the table — movement/acc) vs. 'Das Glas steht auf dem Tisch' (The glass stands on the table — location/dat).$q$;

-- S041 · A2.1-03 #1 MAJOR · R9 · content{top_rules,1} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{top_rules,1}', to_jsonb($q$New destination (wohin?) = accusative → Ich gehe in den Park$q$::text))
WHERE id = 'dd062c55-3703-4a59-91cb-7844549b2e9e' AND content #>> '{top_rules,1}' = $q$Movement to = accusative (gehen, legen, stellen) → Ich gehe in den Park$q$;

-- S042 · A2.1-03 #1 MAJOR · EX1 · explanation_de (authored; audit quote abbreviated)
UPDATE public.grammar_examples SET explanation_de = $q$WOHIN? In den Park: ein neues Ziel. Darum Akkusativ.$q$
WHERE id = '24f3ce2f-b1b4-4d8f-b565-eb684385a901' AND explanation_de = $q$gehen = Bewegung. WOHIN? In den Park. Akkusativ.$q$;

-- S043 · A2.1-03 #1 MAJOR · EX1 · explanation_en (twin, authored)
UPDATE public.grammar_examples SET explanation_en = $q$WOHIN? In den Park: a new destination. So accusative.$q$
WHERE id = '24f3ce2f-b1b4-4d8f-b565-eb684385a901' AND explanation_en = $q$gehen = movement. WOHIN? In den Park. Accusative.$q$;

-- ── A2.1-04 possessive-pronouns ──────────────────────────────────────────────────────────────────────────────────

-- S044 · A2.1-04 #1 MAJOR · topic · title_de
UPDATE public.grammar_topics SET title_de = $q$Possessivartikel im Akkusativ und Dativ$q$
WHERE id = '0cb350c6-6a2e-4dd7-8f98-bd89922163fc' AND title_de = $q$Possessivpronomen$q$;

-- S045 · A2.1-04 #1 MAJOR · topic · title_en
UPDATE public.grammar_topics SET title_en = $q$Possessive Articles (Accusative and Dative)$q$
WHERE id = '0cb350c6-6a2e-4dd7-8f98-bd89922163fc' AND title_en = $q$Possessive Pronouns$q$;

-- S046 · A2.1-04 #1 MAJOR · R-1 · content{hook_de} (splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{hook_de}', to_jsonb($q$mein, dein, sein, ihr … sind Possessivartikel: Sie stehen vor einem Nomen. Im Deutschen ändern sie sich nach Geschlecht und Fall!$q$::text))
WHERE id = 'c39f1241-08e3-466a-a5dd-34a82b6e9f8f' AND content #>> '{hook_de}' = $q$Mein, dein, sein, ihr — das sind Possessivpronomen. Im Deutschen ändern sie sich nach Geschlecht und Fall!$q$;

-- S047 · A2.1-04 #1 MAJOR · R-1 · content{hook_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{hook_en}', to_jsonb($q$My, your, his, her — these are possessive articles: they stand before a noun. In English, they never change. My dog, my cat, my house — always my. In German, they change based on gender and case!$q$::text))
WHERE id = 'c39f1241-08e3-466a-a5dd-34a82b6e9f8f' AND content #>> '{hook_en}' = $q$My, your, his, her — these are possessive pronouns. In English, they never change. My dog, my cat, my house — always my. In German, they change based on gender and case!$q$;

-- S048 · A2.1-04 #1 MAJOR · R1 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Die Possessivartikel haben die Endungen von ein, im Plural die von kein: mein Hund, meine Kinder (wie keine Kinder).$q$
WHERE id = '5c1b093a-1c2c-4b6b-a4e2-97da61cd6da8' AND key_insight_de = $q$Alle Possessivpronomen haben die gleichen Endungen wie ein/eine.$q$;

-- S049 · A2.1-04 #1 MAJOR · R1 · key_insight_en (twin, authored)
UPDATE public.grammar_rules SET key_insight_en = $q$The possessive articles take the endings of ein, and in the plural those of kein: mein Hund, meine Kinder (like keine Kinder).$q$
WHERE id = '5c1b093a-1c2c-4b6b-a4e2-97da61cd6da8' AND key_insight_en = $q$All possessives use the SAME endings as ein/eine. mein works exactly like ein!$q$;

-- S050 · A2.1-04 #2 MAJOR · R3 · key_insight_de (splice)
UPDATE public.grammar_rules SET key_insight_de = $q$Kleines ihr heißt: von ihr oder von ihnen. Mitten im Satz zeigt das große I die Höflichkeitsform: Wie ist Ihr Name? Am Satzanfang schreibt man jedes ihr groß. Dann entscheidet der Kontext.$q$
WHERE id = '1d721207-fc75-5e2b-af39-92bfc3b44881' AND key_insight_de = $q$Kleines ihr heißt: von ihr oder von ihnen. Großes Ihr gehört immer zu Sie.$q$;

-- S051 · A2.1-04 #2 MAJOR · R3 · key_insight_en (splice)
UPDATE public.grammar_rules SET key_insight_en = $q$Small ihr = her or their. Mid-sentence, the capital I marks the polite your: Wie ist Ihr Name? At the start of a sentence every ihr is capitalised, so context decides.$q$
WHERE id = '1d721207-fc75-5e2b-af39-92bfc3b44881' AND key_insight_en = $q$Small ihr = her or their. Capital Ihr = your (Sie-form). Only the capital letter tells them apart.$q$;

-- S052 · A2.1-04 #2 MAJOR · R3 · content{description_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$euer drops the -e- in the middle as soon as an ending is added: euer -> eure, euren, eurem. unser keeps it: unsere, unseren, unserem. Small ihr means her or their; mid-sentence, capital Ihr is the polite your (Sie-form). At the start of a sentence every ihr is capitalised.$q$::text))
WHERE id = '1d721207-fc75-5e2b-af39-92bfc3b44881' AND content #>> '{description_en}' = $q$euer drops the -e- in the middle as soon as an ending is added: euer -> eure, euren, eurem. unser keeps it: unsere, unseren, unserem. Small ihr means her or their; capital Ihr is always the polite your (Sie-form).$q$;

-- S053 · A2.1-04 #2 MAJOR · EX5 · sentence_de
UPDATE public.grammar_examples SET sentence_de = $q$Draußen spielen ihre Kinder.$q$
WHERE id = '95c006c7-77c7-429e-9557-9febc36ae399' AND sentence_de = $q$Ihre Kinder spielen draußen.$q$;

-- S054 · A2.1-04 #2 MAJOR · EX5 · sentence_en
UPDATE public.grammar_examples SET sentence_en = $q$Her children are playing outside.$q$
WHERE id = '95c006c7-77c7-429e-9557-9febc36ae399' AND sentence_en = $q$Her children play outside.$q$;

-- S055 · A2.1-04 #2 MAJOR · EX5 · grammar_highlight (authored: follows the new sentence)
UPDATE public.grammar_examples SET grammar_highlight = $q$ihre$q$
WHERE id = '95c006c7-77c7-429e-9557-9febc36ae399' AND grammar_highlight = $q$Ihre$q$;

-- S056 · A2.1-04 #2 MAJOR · EX5 · word_breakdown (authored: follows the new sentence)
UPDATE public.grammar_examples SET word_breakdown = $q${"ihre":"her (nom. plural)","Kinder":"children","spielen":"play","draußen":"outside"}$q$::jsonb
WHERE id = '95c006c7-77c7-429e-9557-9febc36ae399' AND word_breakdown = $q${"Ihre":"her (nom. plural)","Kinder":"children","spielen":"play","draußen":"outside"}$q$::jsonb;

-- ── A2.1-06 perfect-tense-haben (REWRITE: R1–R4, R99) ────────────────────────────────────────────────────────────

-- S057 · A2.1-06 #1 BLOCKER + #2 MAJOR · R1 · memory_trick_de
UPDATE public.grammar_rules SET memory_trick_de = $q$Regelmäßig: ge…t. Unregelmäßig: meist ge…en (gegessen), aber gebracht, gedacht, gekannt, gewusst enden auf -t. Lernen Sie das Partizip mit dem Verb. Im Hauptsatz schließt das Partizip die Satzklammer: Ich habe die Fotos schon gezeigt.$q$
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND memory_trick_de = $q$ge___t (regelmäßig). ge___en (unregelmäßig). Partizip = immer letztes Wort!$q$;

-- S058 · A2.1-06 #1 BLOCKER + #2 MAJOR · R1 · memory_trick_en (authored twin)
UPDATE public.grammar_rules SET memory_trick_en = $q$Regular: ge…t. Irregular: mostly ge…en (gegessen), but gebracht, gedacht, gekannt, gewusst end in -t. Learn each participle with its verb. In a main clause the participle closes the bracket.$q$
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND memory_trick_en = $q$ge___t for regular. ge___en for irregular. Participle = always last word!$q$;

-- S059 · A2.1-06 #2 MAJOR · R1 · common_mistakes{0,explanation_de}
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{0,explanation_de}', to_jsonb($q$Im Hauptsatz schließt das Partizip die Satzklammer: Ich habe die Fotos schon gezeigt.$q$::text))
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND common_mistakes #>> '{0,explanation_de}' = $q$Das Partizip geht immer ans Ende.$q$;

-- S060 · A2.1-06 #2 MAJOR · R1 · common_mistakes{0,explanation_en} (twin)
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{0,explanation_en}', to_jsonb($q$In a main clause the participle closes the bracket.$q$::text))
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND common_mistakes #>> '{0,explanation_en}' = $q$The past participle always goes to the end of the sentence.$q$;

-- S061 · A2.1-06 #4 REWRITE·MINOR + #2 MAJOR · R1 · content{description_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$Regular verbs: ge- + stem + -t (-et after t/d: gearbeitet, gewartet). haben in position 2. In a main clause the participle closes the bracket.$q$::text))
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND content #>> '{description_en}' = $q$Regular verbs: ge- + stem + -t. haben in position 2. Participle at the end.$q$;

-- S062 · A2.1-06 #4 REWRITE·MINOR · R1 · key_insight_de (authored)
UPDATE public.grammar_rules SET key_insight_de = $q$Regelmäßig: ge- + Stamm + -t. Nach -t und -d steht -et: gearbeitet, gewartet.$q$
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND key_insight_de = $q$Regelmäßig: ge- + Stamm + -t.$q$;

-- S063 · A2.1-06 #4 REWRITE·MINOR · R1 · key_insight_en (twin, authored)
UPDATE public.grammar_rules SET key_insight_en = $q$Regular past participle: ge- + stem + -t (-et after t/d). spielen → gespielt. machen → gemacht. kaufen → gekauft. arbeiten → gearbeitet.$q$
WHERE id = '2f705edd-4b1d-4c9e-821e-6c40973298e5' AND key_insight_en = $q$Regular past participle: ge- + stem + -t. spielen → gespielt. machen → gemacht. kaufen → gekauft.$q$;

-- S064 · A2.1-06 #1 BLOCKER · R2 · content{rows} (the three-class table; a row is inserted, so the whole array is set and guarded)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows}', $q$[["Regular","ge- + stem + -t (-et after t/d)","gespielt, gearbeitet"],["Irregular, -en","ge- + stem + -en, the vowel often changes","gegessen, gelesen; getrunken, geschrieben"],["Irregular, -t","ge- + changed stem + -t","gebracht, gedacht, gekannt, gewusst"],["Verbs ending in -ieren","NO ge-! stem + -t","studiert, telefoniert, repariert (no ge-!)"],["Inseparable prefix verbs","NO ge-! prefix + stem + -t/-en","besucht, verstanden, erzählt (no ge-!)"]]$q$::jsonb)
WHERE id = 'c6dfee31-e224-494c-be98-3400bbce3ff4' AND content #> '{rows}' = $q$[["Regular (-t)","ge- + stem + -t","gespielt, gemacht, gekauft, gelernt, gewohnt"],["Irregular (-en)","ge- + changed stem + -en","gegessen, getrunken, geschrieben, gelesen, gesehen"],["Verbs ending in -ieren","NO ge-! stem + -t","studiert, telefoniert, repariert (no ge-!)"],["Inseparable prefix verbs","NO ge-! prefix + stem + -t/-en","besucht, verstanden, erzählt (no ge-!)"]]$q$::jsonb;

-- S065 · A2.1-06 #1 BLOCKER · R2 · content{description_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$Regular = ge___t (-et after t/d). Irregular = mostly ge___en, but a few end in -t: gebracht, gedacht, gekannt, gewusst. Learn each participle with its verb. -ieren and inseparable prefix verbs = no ge-!$q$::text))
WHERE id = 'c6dfee31-e224-494c-be98-3400bbce3ff4' AND content #>> '{description_en}' = $q$Regular = ge___t. Irregular = ge___en (must memorize!). -ieren and inseparable prefix verbs = no ge-!$q$;

-- S066 · A2.1-06 #1 BLOCKER · R3 · content{description_en}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$Most irregular participles end in -en; a few (gebracht, gedacht, gekannt, gewusst) end in -t. Learn each participle with its verb.$q$::text))
WHERE id = '4304d965-4213-4ec6-b358-864f04cf98bd' AND content #>> '{description_en}' = $q$Irregular participles end in -en and often change the vowel. You must memorize them!$q$;

-- S067 · A2.1-06 #3 MAJOR (+ #7 MINOR overlap) · R4 · content{description_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Test für Verben mit Präfix: Ist das Präfix unbetont (beZAHlen, verGESsen), gibt es kein ge-. Ist es betont (AUSfüllen, MITbringen), steht ge- zwischen Präfix und Verb. Verben ohne Präfix haben ge- am Anfang: gespielt.$q$::text))
WHERE id = '1bf98739-369e-53c1-b847-661315030301' AND content #>> '{description_de}' = $q$Test: Betone das Verb. Ohne Betonung vorne steht kein ge-. Mit Betonung vorne steht ge- in der Mitte.$q$;

-- S068 · A2.1-06 #3 MAJOR · R4 · memory_trick_de
UPDATE public.grammar_rules SET memory_trick_de = $q$Betontes Präfix: ge- in die Mitte. Unbetontes Präfix: kein ge-.$q$
WHERE id = '1bf98739-369e-53c1-b847-661315030301' AND memory_trick_de = $q$Betonung vorne: ge- in die Mitte. Keine Betonung: kein ge-.$q$;

-- S069 · A2.1-06 #3 MAJOR · R4 · memory_trick_en
UPDATE public.grammar_rules SET memory_trick_en = $q$Stressed prefix: ge- in the middle. Unstressed prefix: no ge-.$q$
WHERE id = '1bf98739-369e-53c1-b847-661315030301' AND memory_trick_en = $q$Stress at the front: ge- in the middle. No stress at the front: no ge- at all.$q$;

-- S070 · A2.1-06 #6 REWRITE·MINOR · R4 · key_insight_de (authored: the English contrast set)
UPDATE public.grammar_rules SET key_insight_de = $q$Derselbe Test gilt für Verben, die nicht in der Tabelle stehen: reserviert, funktioniert, bekommen, erklärt (kein ge-), aber eingekauft, angerufen, aufgeräumt (ge- in der Mitte).$q$
WHERE id = '1bf98739-369e-53c1-b847-661315030301' AND key_insight_de = $q$Auch diese Verben haben kein ge-: reserviert, funktioniert, bekommen, erklärt.$q$;

-- S071 · A2.1-06 #2 MAJOR · R5 · content{description_de} (splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Im Hauptsatz schließt das Partizip die Satzklammer: Ich habe die Fotos schon gezeigt. Nur haben wechselt seinen Platz.$q$::text))
WHERE id = '71823587-c31a-5069-8802-32eadae318a7' AND content #>> '{description_de}' = $q$Am Ende steht immer das Partizip. Nur haben wechselt seinen Platz.$q$;

-- S072 · A2.1-06 #2 MAJOR · R5 · content{description_en} (splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$In a main clause the participle closes the bracket. Only haben changes position - second in a statement, first in a yes/no question, second after a question word. Time, object and nicht all sit between the two brackets.$q$::text))
WHERE id = '71823587-c31a-5069-8802-32eadae318a7' AND content #>> '{description_en}' = $q$The participle never moves: it always closes the sentence. Only haben changes position - second in a statement, first in a yes/no question, second after a question word. Time, object and nicht all sit between the two brackets.$q$;

-- S073 · A2.1-06 #2 MAJOR · R5 · memory_trick_en (authored: the fix sentence would repeat the first half)
UPDATE public.grammar_rules SET memory_trick_en = $q$In a main clause haben opens the bracket and the participle closes it.$q$
WHERE id = '71823587-c31a-5069-8802-32eadae318a7' AND memory_trick_en = $q$haben opens the bracket, the participle closes it. Nothing follows the participle.$q$;

-- S074 · A2.1-06 #2 MAJOR (+ #6 MINOR overlap) · R6 · key_insight_en
UPDATE public.grammar_rules SET key_insight_en = $q$Many errors are position errors: in a main clause the participle closes the bracket.$q$
WHERE id = '1fd9c617-ad8a-5277-a85e-468174507ece' AND key_insight_en = $q$Most errors are position errors, not vocabulary errors: the participle must be the last word.$q$;

-- S075 · A2.1-06 #2 MAJOR · R6 · key_insight_de (twin)
UPDATE public.grammar_rules SET key_insight_de = $q$Viele Fehler sind Positionsfehler: Im Hauptsatz schließt das Partizip die Satzklammer.$q$
WHERE id = '1fd9c617-ad8a-5277-a85e-468174507ece' AND key_insight_de = $q$Viele Fehler sind Positionsfehler. Am Ende steht das Partizip.$q$;

-- S076 · A2.1-06 #1 BLOCKER · R99 · content{points,2} (authored from the three-class table)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{points,2}', to_jsonb($q$Irregular: mostly ge- + stem + -en, the vowel often changes (gegessen, getrunken); a few end in -t (gebracht, gedacht, gekannt, gewusst)$q$::text))
WHERE id = '098f183a-a8dd-426a-b530-8ebd95d0582a' AND content #>> '{points,2}' = $q$Irregular: ge- + changed stem + -en (gegessen, getrunken, gesehen)$q$;

-- ── A2.1-07 perfect-tense-sein (REWRITE: R1, R2, R4, R6, EX13–15) ───────────────────────────────────────────────

-- S077 · A2.1-07 #1 MAJOR · R2 · content{helpful_contrast_en} (deleted, as the audit says)
UPDATE public.grammar_rules SET content = content #- '{helpful_contrast_en}'
WHERE id = '23ddc3f0-8587-4da6-be90-5cca563b9a43' AND content #>> '{helpful_contrast_en}' = $q$schwimmen can use both: 'Ich bin geschwommen' (swam to somewhere) vs 'Ich habe geschwommen' (swam as exercise). The destination makes the difference!$q$;

-- S078 · A2.1-07 #1 MAJOR · R2 · content{rule_of_thumb_en}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rule_of_thumb_en}', to_jsonb($q$Verbs that move you along (gehen, fahren, schwimmen, wandern) take sein, with or without a destination: Ich bin jeden Tag geschwommen. Verbs of change (werden, einschlafen) take sein too.$q$::text))
WHERE id = '23ddc3f0-8587-4da6-be90-5cca563b9a43' AND content #>> '{rule_of_thumb_en}' = $q$If there's a destination or change, use sein. If there's an action without destination, use haben.$q$;

-- S079 · A2.1-07 #1 MAJOR · R1 · content{categories,0,verbs,6,meaning} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{categories,0,verbs,6,meaning}', to_jsonb($q$to swim$q$::text))
WHERE id = 'e1a6c752-c090-4262-878f-4965c3cf56c1' AND content #>> '{categories,0,verbs,6,meaning}' = $q$to swim (to somewhere)$q$;

-- S080 · A2.1-07 REWRITE §7 test · R1 · content{categories,0,description} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{categories,0,description}', to_jsonb($q$Verbs that move you from one place to another, with or without a destination$q$::text))
WHERE id = 'e1a6c752-c090-4262-878f-4965c3cf56c1' AND content #>> '{categories,0,description}' = $q$Verbs showing physical movement to a destination$q$;

-- S081 · A2.1-07 REWRITE §7 test · R1 · content{key_test_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{key_test_en}', to_jsonb($q$Ask two questions. Is there an accusative object? Then haben: Ich habe das Auto gefahren. If not: does the verb show a change of place (gehen, fahren, schwimmen) or a change of state (werden, einschlafen)? Then sein. Add sein, bleiben and passieren.$q$::text))
WHERE id = 'e1a6c752-c090-4262-878f-4965c3cf56c1' AND content #>> '{key_test_en}' = $q$Ask: Does this verb answer 'Where did you go?' or 'What did you become?' → sein. Does it answer 'What did you do?' → haben.$q$;

-- S082 · A2.1-07 REWRITE §7 test · R1 · content{intro_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{intro_en}', to_jsonb($q$Verbs without an accusative object use sein in perfect tense if they fit one of these three categories:$q$::text))
WHERE id = 'e1a6c752-c090-4262-878f-4965c3cf56c1' AND content #>> '{intro_en}' = $q$Verbs use sein in perfect tense if they fit one of these three categories:$q$;

-- S083 · A2.1-07 #2 MAJOR · R4 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Diese Verben bilden das Perfekt mit sein, wenn sie kein Akkusativobjekt haben: Ich bin nach Berlin gefahren. Mit Akkusativobjekt: Ich habe das Auto gefahren.$q$
WHERE id = '35d2c0cd-197f-465b-b830-933ed9acdbf5' AND key_insight_de = $q$Diese Verben verwenden IMMER sein.$q$;

-- S084 · A2.1-07 #2 MAJOR · R4 · key_insight_en (authored twin)
UPDATE public.grammar_rules SET key_insight_en = $q$These verbs form the Perfekt with sein when they have no accusative object: Ich bin nach Berlin gefahren. With an accusative object: Ich habe das Auto gefahren.$q$
WHERE id = '35d2c0cd-197f-465b-b830-933ed9acdbf5' AND key_insight_en = $q$These verbs ALWAYS use sein. Memorize them!$q$;

-- S085 · A2.1-07 #2 MAJOR · R-1 · content{german_difference_en}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{german_difference_en}', to_jsonb($q$German uses sein for verbs without an accusative object that show (1) a change of place, (2) a change of state, (3) plus sein, bleiben and passieren. Most other verbs, including tanzen, use haben.$q$::text))
WHERE id = '6cefb694-c2ef-433c-9c04-7db7d1ad08f6' AND content #>> '{german_difference_en}' = $q$German uses sein for verbs showing: (1) movement from A to B, (2) change of state, (3) sein and bleiben themselves. Most other verbs use haben.$q$;

-- S086 · A2.1-07 #2 MAJOR · R3 · content{mistakes,0,explanation_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,explanation_en}', to_jsonb($q$gehen shows a change of place and has no accusative object, so it uses sein.$q$::text))
WHERE id = '6e7c797e-3de4-4d24-a0ca-fe20e50a035b' AND content #>> '{mistakes,0,explanation_en}' = $q$gehen = movement. Movement verbs use sein.$q$;

-- S087 · A2.1-07 #2 MAJOR · R9 · content{one_sentence_summary_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{one_sentence_summary_en}', to_jsonb($q$Use sein in perfect tense for verbs without an accusative object that show a change of place (gehen, fahren) or a change of state (werden, sterben), plus sein, bleiben and passieren — all others use haben.$q$::text))
WHERE id = '6d55c532-3106-4048-826c-6c2ac5df9275' AND content #>> '{one_sentence_summary_en}' = $q$Use sein in perfect tense for movement verbs (gehen, fahren), change-of-state verbs (werden, sterben), plus sein and bleiben — all others use haben.$q$;

-- S088 · A2.1-07 #4 MAJOR · R8 · content{exchanges,5,text_de} (splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{exchanges,5,text_de}', to_jsonb($q$Ja! Ich bin jeden Tag geschwommen. Und ich bin richtig braun geworden!$q$::text))
WHERE id = 'f5920d3e-c6de-4983-97ff-278500cc1b90' AND content #>> '{exchanges,5,text_de}' = $q$Ja! Ich bin jeden Tag geschwommen. Ich bin so erholt geworden!$q$;

-- S089 · A2.1-07 #4 MAJOR · R8 · content{exchanges,5,text_en} (splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{exchanges,5,text_en}', to_jsonb($q$Yes! I swam every day. And I got really tanned!$q$::text))
WHERE id = 'f5920d3e-c6de-4983-97ff-278500cc1b90' AND content #>> '{exchanges,5,text_en}' = $q$Yes! I swam every day. I became so relaxed!$q$;

-- S090 · A2.1-07 #4 MAJOR · R8 · content{exchanges,5,grammar_note} (splice: the werden half stays)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{exchanges,5,grammar_note}', to_jsonb($q$schwimmen → bin geschwommen (sein, no destination needed), werden → bin geworden (sein, change)$q$::text))
WHERE id = 'f5920d3e-c6de-4983-97ff-278500cc1b90' AND content #>> '{exchanges,5,grammar_note}' = $q$schwimmen → bin geschwommen (sein, movement to), werden → bin geworden (sein, change)$q$;

-- S091 · A2.1-07 #6 REWRITE·MINOR · R2 · content{comparison_table,rows,4,0}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{comparison_table,rows,4,0}', to_jsonb($q$Ich bin müde geworden. (I got tired)$q$::text))
WHERE id = '23ddc3f0-8587-4da6-be90-5cca563b9a43' AND content #>> '{comparison_table,rows,4,0}' = $q$Ich bin geworden. (I became)$q$;

-- S092 · A2.1-07 #6 REWRITE·MINOR · R2 · content{comparison_table,rows,5,1}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{comparison_table,rows,5,1}', to_jsonb($q$Ich habe Brot gekauft. (I bought bread)$q$::text))
WHERE id = '23ddc3f0-8587-4da6-be90-5cca563b9a43' AND content #>> '{comparison_table,rows,5,1}' = $q$Ich habe gekauft. (I bought)$q$;

-- S093 · A2.1-07 #7 REWRITE·MINOR · R6 · title_en (authored: R6 replaced by the item-2 test)
UPDATE public.grammar_rules SET title_en = $q$haben or sein? One Test$q$
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND title_en = $q$The "Dr. & Mrs. Vandertramp" Method$q$;

-- S094 · A2.1-07 #7 REWRITE·MINOR · R6 · title_de (authored)
UPDATE public.grammar_rules SET title_de = $q$haben oder sein? Ein Test$q$
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND title_de = $q$Die "Dr. & Mrs. Vandertramp" Methode$q$;

-- S095 · A2.1-07 #7 REWRITE·MINOR · R6 · key_insight_en (authored twin of the audit's test)
UPDATE public.grammar_rules SET key_insight_en = $q$No accusative object + a change of place or a change of state → sein; plus sein, bleiben, passieren.$q$
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND key_insight_en = $q$Create your own mnemonic: Go, Come, Drive, Fly, Run, Fall, Rise, Travel, Arrive, Leave + become, die, be, stay.$q$;

-- S096 · A2.1-07 #7 REWRITE·MINOR (+ #9 MINOR) · R6 · key_insight_de (the audit's test)
UPDATE public.grammar_rules SET key_insight_de = $q$kein Akkusativobjekt + Ortswechsel oder Zustandswechsel → sein; dazu sein, bleiben, passieren.$q$
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND key_insight_de = $q$Erstelle deine eigene Eselsbrücke.$q$;

-- S097 · A2.1-07 #7 REWRITE·MINOR · R6 · memory_trick_en (authored)
UPDATE public.grammar_rules SET memory_trick_en = $q$Accusative object? → haben. If not: does the place or the state change? → sein.$q$
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND memory_trick_en = $q$Think: 'Where did you GO? What did you BECOME?' = sein$q$;

-- S098 · A2.1-07 #7 REWRITE·MINOR (+ #9 MINOR) · R6 · memory_trick_de (authored)
UPDATE public.grammar_rules SET memory_trick_de = $q$Akkusativobjekt? → haben. Wenn nicht: Ändert sich der Ort oder der Zustand? → sein.$q$
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND memory_trick_de = $q$Denke: 'Wohin bist du GEGANGEN? Was bist du GEWORDEN?' = sein$q$;

-- S099 · A2.1-07 #7 REWRITE·MINOR · R6 · content{content_de} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{content_de}', to_jsonb($q$Prüfen Sie zwei Dinge. Hat das Verb ein Akkusativobjekt? Dann steht haben: Ich habe das Auto gefahren. Wenn nicht: Zeigt das Verb einen Ortswechsel (gehen, fahren, schwimmen) oder einen Zustandswechsel (werden, einschlafen)? Dann steht sein: Ich bin nach Berlin gefahren. Dazu kommen sein, bleiben und passieren.$q$::text))
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND content #>> '{content_de}' = $q$Manche Lerner benutzen Eselsbrücken für Bewegungs- und Zustandsverben.$q$;

-- S100 · A2.1-07 #7 REWRITE·MINOR · R6 · content{content_en} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{content_en}', to_jsonb($q$Check two things. Does the verb have an accusative object? Then use haben: Ich habe das Auto gefahren. If not: does the verb show a change of place (gehen, fahren, schwimmen) or a change of state (werden, einschlafen)? Then use sein: Ich bin nach Berlin gefahren. Add sein, bleiben and passieren.$q$::text))
WHERE id = '0dceca9e-6d10-430e-9419-2fe0b7bc4222' AND content #>> '{content_en}' = $q$Some learners use mnemonics. One approach: think of movement as 'Mrs Vandertramp' verbs (from French learning). In German: Gehen, Kommen, Fahren, Fliegen, Laufen, Fallen, Steigen, Reisen, Ankommen, Abfahren, plus werden, sterben, sein, bleiben.$q$;

-- S101 · A2.1-07 #3 MAJOR · EX13 · sentence_de
UPDATE public.grammar_examples SET sentence_de = $q$Ich bin gestern zehn Kilometer gelaufen.$q$
WHERE id = '85023c25-e850-43cf-816d-0a90db8e92f8' AND sentence_de = $q$Ich bin gelaufen (somewhere). vs. Ich habe einen Marathon gelaufen.$q$;

-- S102 · A2.1-07 #3 MAJOR · EX13 · sentence_en
UPDATE public.grammar_examples SET sentence_en = $q$I ran ten kilometres yesterday.$q$
WHERE id = '85023c25-e850-43cf-816d-0a90db8e92f8' AND sentence_en = $q$I ran (to somewhere). vs. I ran a marathon.$q$;

-- S103 · A2.1-07 #3 MAJOR · EX13 · grammar_highlight (authored)
UPDATE public.grammar_examples SET grammar_highlight = $q$bin ... gelaufen$q$
WHERE id = '85023c25-e850-43cf-816d-0a90db8e92f8' AND grammar_highlight = $q$bin gelaufen vs. habe gelaufen$q$;

-- S104 · A2.1-07 #3 MAJOR · EX13 · explanation_en (authored)
UPDATE public.grammar_examples SET explanation_en = $q$laufen = movement, even without a destination. zehn Kilometer is a distance, not an accusative object. sein + gelaufen.$q$
WHERE id = '85023c25-e850-43cf-816d-0a90db8e92f8' AND explanation_en = $q$With destination = sein. As activity = haben (rare).$q$;

-- S105 · A2.1-07 #3 MAJOR · EX13 · explanation_de (authored)
UPDATE public.grammar_examples SET explanation_de = $q$laufen = Bewegung, auch ohne Ziel. zehn Kilometer ist eine Strecke, kein Akkusativobjekt. sein + gelaufen.$q$
WHERE id = '85023c25-e850-43cf-816d-0a90db8e92f8' AND explanation_de = $q$Mit Ziel = sein. Als Aktivität = haben (selten).$q$;

-- S106 · A2.1-07 #3 MAJOR · EX13 · word_breakdown (authored)
UPDATE public.grammar_examples SET word_breakdown = $q${"Ich":"I","bin":"am (sein)","gestern":"yesterday","zehn Kilometer":"ten kilometres (a distance)","gelaufen":"run (Partizip II)"}$q$::jsonb
WHERE id = '85023c25-e850-43cf-816d-0a90db8e92f8' AND word_breakdown = $q${"bin gelaufen":"went by foot (movement)","habe gelaufen":"ran as activity (competition)"}$q$::jsonb;

-- S107 · A2.1-07 #1 + #3 MAJOR · EX14 · sentence_de (replaced per #3 rather than deleted per #1)
UPDATE public.grammar_examples SET sentence_de = $q$Ich habe meine Tochter zum Bahnhof gefahren.$q$
WHERE id = '7b6cdd9a-09a6-46d3-a189-7ba883ee9220' AND sentence_de = $q$Ich bin geschwommen. (to the other side) vs. Ich habe geschwommen. (exercise)$q$;

-- S108 · A2.1-07 #1 + #3 MAJOR · EX14 · sentence_en
UPDATE public.grammar_examples SET sentence_en = $q$I drove my daughter to the station.$q$
WHERE id = '7b6cdd9a-09a6-46d3-a189-7ba883ee9220' AND sentence_en = $q$I swam (across). vs. I swam (for exercise).$q$;

-- S109 · A2.1-07 #1 + #3 MAJOR · EX14 · grammar_highlight (authored)
UPDATE public.grammar_examples SET grammar_highlight = $q$habe ... gefahren$q$
WHERE id = '7b6cdd9a-09a6-46d3-a189-7ba883ee9220' AND grammar_highlight = $q$bin vs. habe geschwommen$q$;

-- S110 · A2.1-07 #1 + #3 MAJOR · EX14 · explanation_en (authored)
UPDATE public.grammar_examples SET explanation_en = $q$fahren + accusative object (meine Tochter) = haben + gefahren. Without an accusative object: Ich bin zum Bahnhof gefahren.$q$
WHERE id = '7b6cdd9a-09a6-46d3-a189-7ba883ee9220' AND explanation_en = $q$Destination/movement = sein. Pure activity = haben.$q$;

-- S111 · A2.1-07 #1 + #3 MAJOR · EX14 · explanation_de (authored)
UPDATE public.grammar_examples SET explanation_de = $q$fahren + Akkusativobjekt (meine Tochter) = haben + gefahren. Ohne Akkusativobjekt: Ich bin zum Bahnhof gefahren.$q$
WHERE id = '7b6cdd9a-09a6-46d3-a189-7ba883ee9220' AND explanation_de = $q$Ziel/Bewegung = sein. Reine Aktivität = haben.$q$;

-- S112 · A2.1-07 #1 + #3 MAJOR · EX14 · word_breakdown (authored)
UPDATE public.grammar_examples SET word_breakdown = $q${"Ich":"I","habe":"have (haben)","meine Tochter":"my daughter (accusative object)","zum Bahnhof":"to the station","gefahren":"driven (Partizip II)"}$q$::jsonb
WHERE id = '7b6cdd9a-09a6-46d3-a189-7ba883ee9220' AND word_breakdown = $q${"bin geschwommen":"swam to somewhere","habe geschwommen":"swam as exercise"}$q$::jsonb;

-- S113 · A2.1-07 #5 REWRITE·MINOR · EX15 · sentence_de (keep only the first sentence)
UPDATE public.grammar_examples SET sentence_de = $q$Er ist sofort eingeschlafen.$q$
WHERE id = '6f8c6dc5-b429-4b1d-a9ff-68f938ce30a3' AND sentence_de = $q$Er ist eingeschlafen. vs. Er hat geschlafen.$q$;

-- S114 · A2.1-07 #5 REWRITE·MINOR · EX15 · sentence_en (authored)
UPDATE public.grammar_examples SET sentence_en = $q$He fell asleep straight away.$q$
WHERE id = '6f8c6dc5-b429-4b1d-a9ff-68f938ce30a3' AND sentence_en = $q$He fell asleep. vs. He slept.$q$;

-- S115 · A2.1-07 #5 REWRITE·MINOR · EX15 · grammar_highlight (authored)
UPDATE public.grammar_examples SET grammar_highlight = $q$ist ... eingeschlafen$q$
WHERE id = '6f8c6dc5-b429-4b1d-a9ff-68f938ce30a3' AND grammar_highlight = $q$ist eingeschlafen vs. hat geschlafen$q$;

-- S116 · A2.1-07 #5 REWRITE·MINOR · EX15 · explanation_en (authored: the contrast moves here)
UPDATE public.grammar_examples SET explanation_en = $q$einschlafen = change of state (awake → asleep). sein + eingeschlafen. But schlafen takes haben: Er hat lange geschlafen.$q$
WHERE id = '6f8c6dc5-b429-4b1d-a9ff-68f938ce30a3' AND explanation_en = $q$einschlafen (change) = sein. schlafen (state) = haben.$q$;

-- S117 · A2.1-07 #5 REWRITE·MINOR · EX15 · explanation_de (authored)
UPDATE public.grammar_examples SET explanation_de = $q$einschlafen = Zustandsänderung (wach → schlafend). sein + eingeschlafen. Aber schlafen bildet das Perfekt mit haben: Er hat lange geschlafen.$q$
WHERE id = '6f8c6dc5-b429-4b1d-a9ff-68f938ce30a3' AND explanation_de = $q$einschlafen (Veränderung) = sein. schlafen (Zustand) = haben.$q$;

-- S118 · A2.1-07 #5 REWRITE·MINOR · EX15 · word_breakdown (authored)
UPDATE public.grammar_examples SET word_breakdown = $q${"Er":"he","ist":"is (sein)","sofort":"straight away","eingeschlafen":"fallen asleep"}$q$::jsonb
WHERE id = '6f8c6dc5-b429-4b1d-a9ff-68f938ce30a3' AND word_breakdown = $q${"hat geschlafen":"slept (ongoing state)","ist eingeschlafen":"fell asleep (change)"}$q$::jsonb;

-- ── A2.1-08 imperative-mood ──────────────────────────────────────────────────────────────────────────────────────

-- S119 · A2.1-08 #1 MAJOR · R1 · content{rows,0,1}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,0,1}', to_jsonb($q$du-form minus -st (minus -t after s/ß/z); -e after t, d, consonant + n$q$::text))
WHERE id = '7476bade-255c-47f9-8cfa-b3b9d76fdf90' AND content #>> '{rows,0,1}' = $q$verb stem (drop -st from du-form)$q$;

-- S120 · A2.1-08 #1 MAJOR · R1 · content{description_en} (authored: "Fix EN to match", splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$du: the du-form without -st and without du (du kommst → Komm!); after s, ß or z only -t goes (du liest → Lies!); after t, d or n an -e stays (Warte! Öffne! Arbeite!). ihr: same as normal ihr-form. Sie: infinitive + Sie.$q$::text))
WHERE id = '7476bade-255c-47f9-8cfa-b3b9d76fdf90' AND content #>> '{description_en}' = $q$du: verb stem only. ihr: same as normal ihr-form. Sie: infinitive + Sie.$q$;

-- S121 · A2.1-08 #1 MAJOR · R1 · key_insight_de (splice)
UPDATE public.grammar_rules SET key_insight_de = $q$du-Form: die du-Form ohne -st und ohne du: du kommst → Komm! Endet der Stamm auf s, fällt nur -t weg: du liest → Lies! Endet er auf -t, -d oder -n, bleibt ein -e: Warte! Öffne! Arbeite! ihr = normal. Sie = Infinitiv + Sie.$q$
WHERE id = '7476bade-255c-47f9-8cfa-b3b9d76fdf90' AND key_insight_de = $q$du = Stamm. ihr = normal. Sie = Infinitiv + Sie.$q$;

-- S122 · A2.1-08 #1 MAJOR · R1 · key_insight_en (authored: "Fix EN to match", splice)
UPDATE public.grammar_rules SET key_insight_en = $q$du = the du-form without -st and without du: du kommst → Komm! If the stem ends in s, only -t goes: du liest → Lies! If it ends in -t, -d or -n, an -e stays: Warte! Öffne! Arbeite! ihr = normal ihr-form (Kommt!). Sie = infinitive + Sie (Kommen Sie!).$q$
WHERE id = '7476bade-255c-47f9-8cfa-b3b9d76fdf90' AND key_insight_en = $q$du = stem only (Komm!). ihr = normal ihr-form (Kommt!). Sie = infinitive + Sie (Kommen Sie!).$q$;

-- S123 · A2.1-08 #1 MAJOR · R99 · content{points,1} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{points,1}', to_jsonb($q$du-form: the du-form minus -st (du kommst → Komm!); after s, ß or z only -t goes (Lies!); after t, d or n an -e stays (Warte! Öffne!).$q$::text))
WHERE id = 'a41a0bfe-df30-4de1-9b32-faa93078868a' AND content #>> '{points,1}' = $q$du-form: just the verb stem. Drop -st from du-form.$q$;

-- ── A2.1-09 adjective-endings-intro ──────────────────────────────────────────────────────────────────────────────

-- S124 · A2.1-09 #1 MAJOR · R5 · formal_note_de
UPDATE public.grammar_rules SET formal_note_de = $q$Teil 1 (SMS an Freunde): Hallo … / Liebe Grüße. Teil 2 (halbformelle E-Mail): Liebe Frau Wagner, … / Viele Grüße. Beide Grüße haben eine Adjektivendung.$q$
WHERE id = '460f1b92-72a6-5260-9a7d-a3d54a9e5269' AND formal_note_de = $q$Im Schreiben Teil 1 und Teil 2 beginnst du mit Hallo. Am Ende schreibst du Liebe Grüße oder Viele Grüße.$q$;

-- S125 · A2.1-09 #1 MAJOR · R5 · formal_note_en (authored: "the English twin is to match")
UPDATE public.grammar_rules SET formal_note_en = $q$Teil 1 (SMS to friends): Hallo … / Liebe Grüße. Teil 2 (semi-formal e-mail): Liebe Frau Wagner, … / Viele Grüße. Both sign-offs carry an adjective ending.$q$
WHERE id = '460f1b92-72a6-5260-9a7d-a3d54a9e5269' AND formal_note_en = $q$In Goethe A2 Schreiben Teil 1 (SMS) and Teil 2 (E-Mail) you open with Hallo or Guten Tag and close with Liebe Grüße or Viele Grüße. Both sign-offs carry an adjective ending, so an examiner sees the pattern before reading your first sentence.$q$;

-- ── A2.1-10 pronouns-accusative-dative ───────────────────────────────────────────────────────────────────────────

-- S126 · A2.1-10 #1 MAJOR · R3 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Ein Pronomen steht vor einem Nomen, egal in welchem Fall: Ich gebe es dem Kind. Ich gebe ihm das Buch. Nur bei zwei Nomen steht der Dativ zuerst, bei zwei Pronomen der Akkusativ: Ich gebe es ihm.$q$
WHERE id = '5d6d7429-ae46-5b7a-a4a1-b8d97e3d6a09' AND key_insight_de = $q$Nur bei zwei Pronomen steht der Akkusativ vorne: Ich gebe es ihm.$q$;

-- S127 · A2.1-10 #1 MAJOR · R3 · key_insight_en (whole field: the fix restates both halves)
UPDATE public.grammar_rules SET key_insight_en = $q$A pronoun goes before a noun whatever its case. Only two nouns keep dative first; two pronouns put the accusative first.$q$
WHERE id = '5d6d7429-ae46-5b7a-a4a1-b8d97e3d6a09' AND key_insight_en = $q$Dative before accusative is the noun rule from Dative Case; it flips only when both objects are pronouns: Ich gebe es ihm.$q$;

-- S128 · A2.1-10 #1 MAJOR · R3 · content{steps,2,detail_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{steps,2,detail_en}', to_jsonb($q$Ich gebe es ihm. Not: Ich gebe ihm es. With two pronouns the accusative comes first.$q$::text))
WHERE id = '5d6d7429-ae46-5b7a-a4a1-b8d97e3d6a09' AND content #>> '{steps,2,detail_en}' = $q$Ich gebe es ihm. Not: Ich gebe ihm es. This is the one situation where the order flips.$q$;

-- ── A2.1-12 temporal-prepositions ────────────────────────────────────────────────────────────────────────────────

-- S129 · A2.1-12 #1 MAJOR (+ #6 MINOR overlap) · R4 · content{description_de} (splice; „Das kennst du." dropped)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Was noch andauert, steht mit seit im Präsens: Ich wohne seit Mai in Köln. Mit nicht steht oft das Perfekt: Ich habe sie seit Mai nicht gesehen. Neu ist: vor steht meistens mit Perfekt.$q$::text))
WHERE id = '869e7cb7-bab3-5f43-992d-f705e526feb6' AND content #>> '{description_de}' = $q$seit steht mit Präsens. Das kennst du. Neu ist: vor steht meistens mit Perfekt.$q$;

-- S130 · A2.1-12 #1 MAJOR · R7 · common_mistakes{2,explanation_de} (authored)
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{2,explanation_de}', to_jsonb($q$seit heißt hier: Es läuft noch. Darum steht das Präsens. Mit nicht steht oft das Perfekt: Ich habe seit vier Jahren nicht mehr Gitarre gespielt.$q$::text))
WHERE id = '89ca2fbc-4e51-554d-a490-83c08547a9c8' AND common_mistakes #>> '{2,explanation_de}' = $q$seit heißt: Es läuft noch. Darum kein Perfekt, sondern Präsens.$q$;

-- ── A2.2-01 reflexive-verbs ──────────────────────────────────────────────────────────────────────────────────────

-- S131 · A2.2-01 #1 BLOCKER · R3 · content{description_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$In dieser Bedeutung braucht das Verb ein Reflexivpronomen: sich freuen (glücklich sein), sich erinnern (nicht vergessen). Viele dieser Verben gibt es auch ohne sich, mit anderer Bedeutung: Das freut mich. Entschuldigen Sie! Nur sich beeilen steht immer mit sich.$q$::text))
WHERE id = 'e593db95-930f-49dd-a60a-286231f5366d' AND content #>> '{description_de}' = $q$Diese Verben sind im Deutschen immer reflexiv!$q$;

-- S132 · A2.2-01 #1 BLOCKER · R3 · content{description_en} (authored: "Fix EN to match")
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$In this meaning the verb needs a reflexive pronoun: sich freuen (to be glad), sich erinnern (to remember). Many of these verbs also exist without sich, with another meaning: Das freut mich. Entschuldigen Sie! Only sich beeilen always takes sich.$q$::text))
WHERE id = 'e593db95-930f-49dd-a60a-286231f5366d' AND content #>> '{description_en}' = $q$These verbs are always reflexive in German!$q$;

-- S133 · A2.2-01 #1 BLOCKER · R3 · common_mistakes{0,explanation_de} (authored: "always reflexive" → "reflexive in this meaning")
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{0,explanation_de}', to_jsonb($q$sich freuen ist in dieser Bedeutung reflexiv. Man braucht mich.$q$::text))
WHERE id = 'e593db95-930f-49dd-a60a-286231f5366d' AND common_mistakes #>> '{0,explanation_de}' = $q$sich freuen ist immer reflexiv. Man braucht mich.$q$;

-- S134 · A2.2-01 #1 BLOCKER · R3 · common_mistakes{0,explanation_en} (twin)
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{0,explanation_en}', to_jsonb($q$sich freuen is reflexive in this meaning. You cannot drop mich.$q$::text))
WHERE id = 'e593db95-930f-49dd-a60a-286231f5366d' AND common_mistakes #>> '{0,explanation_en}' = $q$sich freuen is always reflexive. You cannot drop mich.$q$;

-- S135 · A2.2-01 #1 BLOCKER · EX7 · explanation_en
UPDATE public.grammar_examples SET explanation_en = $q$sich interessieren für = to be interested in. Reflexive in this meaning!$q$
WHERE id = '2b0a3541-2bc4-4bc6-b034-619d22fe48de' AND explanation_en = $q$sich interessieren für = to be interested in. Always reflexive in German!$q$;

-- S136 · A2.2-01 #1 BLOCKER · EX8 · explanation_de
UPDATE public.grammar_examples SET explanation_de = $q$sich fühlen = in dieser Bedeutung reflexiv!$q$
WHERE id = '99da9bd5-1cbc-4260-9850-da51ad9d52a6' AND explanation_de = $q$sich fühlen = immer reflexiv!$q$;

-- S137 · A2.2-01 #1 BLOCKER · EX8 · explanation_en
UPDATE public.grammar_examples SET explanation_en = $q$sich fühlen = to feel. Reflexive in this meaning! ich fühle mich.$q$
WHERE id = '99da9bd5-1cbc-4260-9850-da51ad9d52a6' AND explanation_en = $q$sich fühlen = to feel. Always reflexive! ich fühle mich.$q$;

-- S138 · A2.2-01 #2 MAJOR · R2 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Hat der Satz noch ein Akkusativobjekt, steht das Reflexivpronomen im Dativ: Ich wasche mir die Hände. Sonst steht es im Akkusativ: Ich wasche mich. Ich habe mich am Fuß verletzt.$q$
WHERE id = '05af48a8-079e-4c79-adf9-a3d4cbd0b4c9' AND key_insight_de = $q$Dativ = wenn es auch ein Objekt gibt.$q$;

-- S139 · A2.2-01 #2 MAJOR · R2 · key_insight_en (authored, splice)
UPDATE public.grammar_rules SET key_insight_en = $q$Dative reflexive = when the sentence also has an accusative object. Ich wasche MICH (accusative, no other object) vs. Ich wasche MIR die Hände (dative + accusative object). A body part after a preposition changes nothing: Ich habe mich am Fuß verletzt.$q$
WHERE id = '05af48a8-079e-4c79-adf9-a3d4cbd0b4c9' AND key_insight_en = $q$Dative reflexive = when you also have a body part or object. Ich wasche MICH (accusative, no object) vs. Ich wasche MIR die Hände (dative + object).$q$;

-- S140 · A2.2-01 #2 MAJOR · R2 · memory_trick_de
UPDATE public.grammar_rules SET memory_trick_de = $q$Noch ein Akkusativ im Satz? Dann mir/dir.$q$
WHERE id = '05af48a8-079e-4c79-adf9-a3d4cbd0b4c9' AND memory_trick_de = $q$Körperteil dabei? Dann Dativ!$q$;

-- S141 · A2.2-01 #2 MAJOR · R2 · memory_trick_en (authored)
UPDATE public.grammar_rules SET memory_trick_en = $q$Another accusative in the sentence? Then mir/dir instead of mich/dich.$q$
WHERE id = '05af48a8-079e-4c79-adf9-a3d4cbd0b4c9' AND memory_trick_en = $q$Body part present? Use dative! mir/dir instead of mich/dich.$q$;

-- S142 · A2.2-01 #2 MAJOR · R5 · memory_trick_de (authored from the item's trick)
UPDATE public.grammar_rules SET memory_trick_de = $q$Noch ein Akkusativ im Satz? Dann Dativ: mir, dir, sich.$q$
WHERE id = '3ddead17-0ed6-51d0-b931-83817f8bc6ef' AND memory_trick_de = $q$Objekt dabei? Dann Dativ: mir, dir, sich.$q$;

-- S143 · A2.2-01 #2 MAJOR · R5 · memory_trick_en (twin)
UPDATE public.grammar_rules SET memory_trick_en = $q$Another accusative in the sentence? Then dative: mir, dir, sich.$q$
WHERE id = '3ddead17-0ed6-51d0-b931-83817f8bc6ef' AND memory_trick_en = $q$Object present? Then dative: mir, dir, sich.$q$;

-- S144 · A2.2-01 #2 MAJOR · R5 · content{description_de} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Ohne weiteres Akkusativobjekt steht der Akkusativ: mich. Mit einem Akkusativobjekt wie die Haare steht der Dativ: mir.$q$::text))
WHERE id = '3ddead17-0ed6-51d0-b931-83817f8bc6ef' AND content #>> '{description_de}' = $q$Ohne Objekt steht der Akkusativ: mich. Mit einem Objekt wie die Haare steht der Dativ: mir.$q$;

-- S145 · A2.2-01 #2 MAJOR · R5 · content{description_en} (twin)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$Without another accusative object, use the accusative: mich. With an accusative object like die Haare, use the dative: mir.$q$::text))
WHERE id = '3ddead17-0ed6-51d0-b931-83817f8bc6ef' AND content #>> '{description_en}' = $q$Without an object, use the accusative: mich. With an object like die Haare, use the dative: mir.$q$;

-- S146 · A2.2-01 #3 MAJOR · R4 · content{text_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{text_de}', to_jsonb($q$Das Reflexivpronomen steht direkt nach dem konjugierten Verb. Steht ein Pronomen als Subjekt hinter dem Verb, kommt es danach: Heute freue ich mich. Freust du dich? Im Nebensatz steht es nach dem Subjekt: …, weil ich mich freue.$q$::text))
WHERE id = 'de1b3571-7159-4c07-b5bb-f652ece8eb30' AND content #>> '{text_de}' = $q$Das Reflexivpronomen kommt direkt nach dem konjugierten Verb: Ich wasche mich. In Fragen: Wäschst du dich?$q$;

-- S147 · A2.2-01 #3 MAJOR · R6 · content{intro_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{intro_de}', to_jsonb($q$Das Reflexivpronomen steht direkt nach dem konjugierten Verb. Steht ein Pronomen als Subjekt hinter dem Verb, kommt es danach: Heute freue ich mich. Freust du dich? Im Nebensatz steht es nach dem Subjekt: …, weil ich mich freue.$q$::text))
WHERE id = '764c1bec-5e09-5f58-b7f8-cab85f8fe4fa' AND content #>> '{intro_de}' = $q$Das Reflexivpronomen steht direkt nach dem konjugierten Verb. In Fragen steht es nach dem Subjekt.$q$;

-- S148 · A2.2-01 #3 MAJOR · R6 · content{intro_en} (authored twin)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{intro_en}', to_jsonb($q$The reflexive pronoun comes right after the conjugated verb. If a pronoun subject stands after the verb, the reflexive comes after it: Heute freue ich mich. Freust du dich? In a subordinate clause it comes after the subject: …, weil ich mich freue.$q$::text))
WHERE id = '764c1bec-5e09-5f58-b7f8-cab85f8fe4fa' AND content #>> '{intro_en}' = $q$The reflexive pronoun comes right after the conjugated verb. In questions, it comes after the subject.$q$;

-- ── A2.2-02 simple-past-sein-haben ───────────────────────────────────────────────────────────────────────────────

-- S149 · A2.2-02 #1 BLOCKER · R6 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$es gab bleibt immer Singular: Es gab viele Leute. Bei es war entscheidet das Subjekt: Es war kalt. Aber: Es waren viele Leute da.$q$
WHERE id = '6865ec4c-24b4-5fe8-b04f-fff794fb85d0' AND key_insight_de = $q$es gab und es war stehen immer im Singular.$q$;

-- S150 · A2.2-02 #1 BLOCKER · R6 · memory_trick_de (authored)
UPDATE public.grammar_rules SET memory_trick_de = $q$es gab ändert sich nie. Bei es war zählt das Subjekt: Es war kalt. Es waren viele Leute da.$q$
WHERE id = '6865ec4c-24b4-5fe8-b04f-fff794fb85d0' AND memory_trick_de = $q$es gab und es war ändern sich nie im Plural.$q$;

-- S151 · A2.2-02 #1 BLOCKER · R6 · memory_trick_en (authored)
UPDATE public.grammar_rules SET memory_trick_en = $q$es gab never changes. With es war the subject decides: Es war kalt, but Es waren viele Leute da.$q$
WHERE id = '6865ec4c-24b4-5fe8-b04f-fff794fb85d0' AND memory_trick_en = $q$es gab and es war never change for plural: always gab, always war.$q$;

-- S152 · A2.2-02 #2 MAJOR · R6 · key_insight_en
UPDATE public.grammar_rules SET key_insight_en = $q$es gab stays singular, exactly like es gibt.$q$
WHERE id = '6865ec4c-24b4-5fe8-b04f-fff794fb85d0' AND key_insight_en = $q$es gab and es war always stay singular, unlike es gibt in the present.$q$;

-- S153 · A2.2-02 #1 BLOCKER · R7 · content{mistakes,1,explanation_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,1,explanation_de}', to_jsonb($q$Bei Wetter steht es war im Singular: Es war sehr kalt.$q$::text))
WHERE id = 'e056934e-2d6b-5e6e-bbee-dc81084fb502' AND content #>> '{mistakes,1,explanation_de}' = $q$es war ist immer Singular, nie waren.$q$;

-- S154 · A2.2-02 #1 BLOCKER · R7 · content{mistakes,1,explanation_en} (twin: "change only its explanation")
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,1,explanation_en}', to_jsonb($q$With weather, es war is singular: Es war sehr kalt.$q$::text))
WHERE id = 'e056934e-2d6b-5e6e-bbee-dc81084fb502' AND content #>> '{mistakes,1,explanation_en}' = $q$es war is always singular; never waren.$q$;

-- S155 · A2.2-02 #1 BLOCKER · R7 · memory_trick_de (authored)
UPDATE public.grammar_rules SET memory_trick_de = $q$es gab: immer Singular. es war: Das Subjekt entscheidet: Es war kalt. Es waren viele Leute da.$q$
WHERE id = 'e056934e-2d6b-5e6e-bbee-dc81084fb502' AND memory_trick_de = $q$es war und es gab: immer Singular, immer fest.$q$;

-- S156 · A2.2-02 #1 BLOCKER · R7 · memory_trick_en (twin)
UPDATE public.grammar_rules SET memory_trick_en = $q$es gab: always singular. es war: the subject decides: Es war kalt. Es waren viele Leute da.$q$
WHERE id = 'e056934e-2d6b-5e6e-bbee-dc81084fb502' AND memory_trick_en = $q$es war and es gab: always singular, always fixed.$q$;

-- ── A2.2-03 coordinating-conjunctions ────────────────────────────────────────────────────────────────────────────

-- S157 · A2.2-03 #1 MAJOR · R2 · content{rows,3,0}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,3,0}', to_jsonb($q$Both statements true — with or without nicht: nicht billig, aber gut$q$::text))
WHERE id = 'ddd94ec1-a774-49da-a8cc-80f2014805d2' AND content #>> '{rows,3,0}' = $q$No negative in first part$q$;

-- S158 · A2.2-03 #1 MAJOR · R2 · content{rows,3,1}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{rows,3,1}', to_jsonb($q$A negation, then the replacement: nicht teuer, sondern billig$q$::text))
WHERE id = 'ddd94ec1-a774-49da-a8cc-80f2014805d2' AND content #>> '{rows,3,1}' = $q$Must have negative (nicht/kein) in first part$q$;

-- ── A2.2-04 subordinating-conjunctions ───────────────────────────────────────────────────────────────────────────

-- S159 · A2.2-04 #1 MAJOR · R4 · memory_trick_de
UPDATE public.grammar_rules SET memory_trick_de = $q$und, aber, oder, denn, sondern: normale Wortstellung. dass, weil, wenn, ob: Verb ans Ende. deshalb, dann, trotzdem: Verb direkt danach (Position 2).$q$
WHERE id = '8a03f914-5981-4615-97ff-1d3312c8d8d4' AND memory_trick_de = $q$ADUSO = normale Reihenfolge. Alles andere = Verb ans Ende.$q$;

-- S160 · A2.2-04 #1 MAJOR · R4 · memory_trick_en (authored twin)
UPDATE public.grammar_rules SET memory_trick_en = $q$und, aber, oder, denn, sondern: normal word order. dass, weil, wenn, ob: verb to the end. deshalb, dann, trotzdem: verb right after them (position 2).$q$
WHERE id = '8a03f914-5981-4615-97ff-1d3312c8d8d4' AND memory_trick_en = $q$ADUSO (Aber, Denn, Und, Sondern, Oder) = normal order. Everything else = verb to end.$q$;

-- ── A2.2-05 subordinate-word-order ───────────────────────────────────────────────────────────────────────────────

-- S161 · A2.2-05 #1 BLOCKER · R1 · content{sections,0,content_en} (splice: two model sentences + one gloss; multi-line)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{sections,0,content_en}', to_jsonb($q$Follow this order in subordinate clauses:

Conjunction + subject + [objects/time/place] + verb (conjugated)

• ..., dass ich dir morgen das Buch gebe.
  (that I you tomorrow the book give)

• ..., weil sie gestern im Park spazieren gegangen ist.
  (because she yesterday in-the park walking gone is)$q$::text))
WHERE id = '39c4667a-d53b-47ec-b510-7df7868eb2ec' AND content #>> '{sections,0,content_en}' = $q$Follow this order in subordinate clauses:

Conjunction + subject + [objects/time/place] + verb (conjugated)

• ..., dass Ich dir morgen das Buch gebe.
  (that I you tomorrow the book give)

• ..., weil Sie gestern im Park spazierte.
  (because she yesterday in-the park walked)$q$;

-- S162 · A2.2-05 #2 MAJOR · R1 · content{sections,0,title_en}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{sections,0,title_en}', to_jsonb($q$Basic Pattern: conjunction → subject → pronouns → the rest (time usually before place) → verb$q$::text))
WHERE id = '39c4667a-d53b-47ec-b510-7df7868eb2ec' AND content #>> '{sections,0,title_en}' = $q$Basic Pattern: Subject → Objects → Time → Place → Verb$q$;

-- S163 · A2.2-05 #3 MAJOR · R7 · content{memory_trick_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{memory_trick_de}', to_jsonb($q$NEBENSATZ-Konjunktion (dass, weil, wenn, ob) = Verb ans Ende. und, aber, oder, denn: keine Änderung.$q$::text))
WHERE id = 'c9511dce-d0a1-4931-903f-df5fc11bb003' AND content #>> '{memory_trick_de}' = $q$KONJUNKTION = Verb ans Ende. Die Konjunktion ist wie ein 'Verbmagnet'.$q$;

-- S164 · A2.2-05 #3 MAJOR · R7 · content{memory_trick_en} (authored twin)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{memory_trick_en}', to_jsonb($q$SUBORDINATING conjunction (dass, weil, wenn, ob) = verb at the end. und, aber, oder, denn: no change.$q$::text))
WHERE id = 'c9511dce-d0a1-4931-903f-df5fc11bb003' AND content #>> '{memory_trick_en}' = $q$CONJUNCTION = verb at the end. No exceptions! Think of the conjunction as a 'verb magnet' that pulls the verb to the end.$q$;

-- ── A2.2-06 comparative ──────────────────────────────────────────────────────────────────────────────────────────

-- S165 · A2.2-06 #1 MAJOR · R4 · content{description_de}
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Nach dem Komparativ steht als: größer als. Bei Gleichheit steht wie: so groß wie.$q$::text))
WHERE id = '0f799182-815f-4ead-b6b6-e2a122f771e0' AND content #>> '{description_de}' = $q$Immer als (als) für Vergleiche. Nie wie!$q$;

-- S166 · A2.2-06 #1 MAJOR · R4 · content{description_en} (authored: "Fix EN to match")
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$After a comparative use als: größer als. For equality use wie: so groß wie.$q$::text))
WHERE id = '0f799182-815f-4ead-b6b6-e2a122f771e0' AND content #>> '{description_en}' = $q$Always use als (than) for comparisons. Never wie!$q$;

-- S167 · A2.2-06 #1 MAJOR · R0 · content{preview_note_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{preview_note_en}', to_jsonb($q$schneller = faster. als = than. After a comparative use als; so … wie is for equality.$q$::text))
WHERE id = 'fdffef0f-d4ca-4485-ad69-88b23a2f93cb' AND content #>> '{preview_note_en}' = $q$schneller = faster. als = than. Always use als for comparisons (never wie!).$q$;

-- S168 · A2.2-06 #2 MAJOR · R2 · memory_trick_de
UPDATE public.grammar_rules SET memory_trick_de = $q$Viele kurze Adjektive mit a, o, u bekommen einen Umlaut: alt → älter, groß → größer, jung → jünger. Aber nicht alle: laut → lauter, voll → voller. Lernen Sie den Komparativ mit dem Wort.$q$
WHERE id = '17e7184c-b7e5-452c-98b9-71336e35c29a' AND memory_trick_de = $q$Einsilbig mit a/o/u? Punkte drauf! alt→älter.$q$;

-- S169 · A2.2-06 #2 MAJOR · R2 · memory_trick_en (authored twin)
UPDATE public.grammar_rules SET memory_trick_en = $q$Many short adjectives with a, o, u take an umlaut: alt → älter, groß → größer, jung → jünger. But not all: laut → lauter, voll → voller. Learn the comparative with the word.$q$
WHERE id = '17e7184c-b7e5-452c-98b9-71336e35c29a' AND memory_trick_en = $q$One syllable with a/o/u? Add dots! alt→älter, groß→größer.$q$;

-- S170 · A2.2-06 #2 MAJOR · R2 · key_insight_de (authored, splice)
UPDATE public.grammar_rules SET key_insight_de = $q$Einsilbig + a/o/u? Oft Umlaut: alt→älter, groß→größer. Aber: laut→lauter, voll→voller.$q$
WHERE id = '17e7184c-b7e5-452c-98b9-71336e35c29a' AND key_insight_de = $q$Einsilbig + a/o/u? Meist Umlaut: alt→älter, groß→größer.$q$;

-- ── A2.2-07 superlative ──────────────────────────────────────────────────────────────────────────────────────────

-- S171 · A2.2-07 #1 MAJOR · R2 · content{description_de} (splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Anhängen: -sten. Nach -d, -t, -s, -ß, -sch, -z steht meist -esten: am ältesten, am kürzesten, am frischesten. Ausnahme: groß → am größten. Umlaute wie im Komparativ!$q$::text))
WHERE id = '1b6c035c-8b87-43f4-ae6a-799ead4906e2' AND content #>> '{description_de}' = $q$Anhängen: -sten. Nach d, t, s, ß, z: -esten. Umlaute wie im Komparativ!$q$;

-- S172 · A2.2-07 #1 MAJOR · R2 · content{description_en} (authored twin, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$Add -sten. After -d, -t, -s, -ß, -sch, -z it is usually -esten: am ältesten, am kürzesten, am frischesten. Exception: groß → am größten. Umlauts apply like in comparative!$q$::text))
WHERE id = '1b6c035c-8b87-43f4-ae6a-799ead4906e2' AND content #>> '{description_en}' = $q$Add -sten. After d, t, s, ß, z add -esten. Umlauts apply like in comparative!$q$;

-- S173 · A2.2-07 #1 MAJOR · R2 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Nach -d, -t, -s, -ß, -sch, -z steht meist -esten: am ältesten, am kürzesten, am frischesten. Ausnahme: groß → am größten.$q$
WHERE id = '1b6c035c-8b87-43f4-ae6a-799ead4906e2' AND key_insight_de = $q$Nach d, t, s, ß, z: -ESTEN: kältesten, kürzesten.$q$;

-- S174 · A2.2-07 #1 MAJOR · R2 · key_insight_en (authored twin)
UPDATE public.grammar_rules SET key_insight_en = $q$After -d, -t, -s, -ß, -sch, -z it is usually -esten: am ältesten, am kürzesten, am frischesten. Exception: groß → am größten.$q$
WHERE id = '1b6c035c-8b87-43f4-ae6a-799ead4906e2' AND key_insight_en = $q$After d, t, s, ß, z add -ESTEN (not just -sten): kalt to am kältESTen, kurz to am kürzESTen.$q$;

-- S175 · A2.2-07 #1 MAJOR · R2 · memory_trick_de (authored)
UPDATE public.grammar_rules SET memory_trick_de = $q$Nach d, t, s, ß, sch, z meist ein E: kält-E-sten. Aber: am größten.$q$
WHERE id = '1b6c035c-8b87-43f4-ae6a-799ead4906e2' AND memory_trick_de = $q$d, t, s, ß, z brauchen E: kält-E-sten.$q$;

-- S176 · A2.2-07 #1 MAJOR · R2 · memory_trick_en (authored)
UPDATE public.grammar_rules SET memory_trick_en = $q$After d, t, s, ß, sch, z usually an extra E: am kält-E-sten. But: am größten.$q$
WHERE id = '1b6c035c-8b87-43f4-ae6a-799ead4906e2' AND memory_trick_en = $q$d, t, s, ß, z need an extra E: am kält-E-sten.$q$;

-- S177 · A2.2-07 #2 MAJOR · R1 · common_mistakes{0,explanation_de}
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{0,explanation_de}', to_jsonb($q$Hier fehlt das Nomen, und -sten passt nicht zu der: am schnellsten oder der Schnellste.$q$::text))
WHERE id = '8ea662c0-0198-4092-8e91-b8ffe060e833' AND common_mistakes #>> '{0,explanation_de}' = $q$Nach sein ohne Nomen: am + sten.$q$;

-- S178 · A2.2-07 #2 MAJOR · R1 · common_mistakes{0,explanation_en} (twin)
UPDATE public.grammar_rules SET common_mistakes = jsonb_set(common_mistakes, '{0,explanation_en}', to_jsonb($q$The noun is missing here, and -sten does not fit der: am schnellsten or der Schnellste.$q$::text))
WHERE id = '8ea662c0-0198-4092-8e91-b8ffe060e833' AND common_mistakes #>> '{0,explanation_en}' = $q$After sein without a noun, use am + sten: am schnellsten.$q$;

-- S179 · A2.2-07 #2 MAJOR · R1 · memory_trick_de
UPDATE public.grammar_rules SET memory_trick_de = $q$Nach sein geht beides: Er ist am schnellsten. / Er ist der Schnellste (von allen). Vor einem Nomen steht ein Artikelwort, meist der/die/das: der schnellste Zug, mein bester Freund.$q$
WHERE id = '8ea662c0-0198-4092-8e91-b8ffe060e833' AND memory_trick_de = $q$Nach sein = am. Vor Nomen = der/die/das.$q$;

-- S180 · A2.2-07 #2 MAJOR · R1 · memory_trick_en (twin)
UPDATE public.grammar_rules SET memory_trick_en = $q$After sein both work: Er ist am schnellsten. / Er ist der Schnellste (von allen). Before a noun there is an article word, usually der/die/das: der schnellste Zug, mein bester Freund.$q$
WHERE id = '8ea662c0-0198-4092-8e91-b8ffe060e833' AND memory_trick_en = $q$After sein = am ___sten. Before noun = der/die/das ___ste.$q$;

-- S181 · A2.2-07 #2 MAJOR · R8 · memory_trick_en (authored)
UPDATE public.grammar_rules SET memory_trick_en = $q$Before a noun: der/die/das + -ste. After sein: am + -sten, or der/die/das + -ste (der Schnellste).$q$
WHERE id = 'e1417811-ccda-5f70-bb32-61d3fa94be57' AND memory_trick_en = $q$Noun nearby? Use der/die/das. No noun? Use am + sten.$q$;

-- S182 · A2.2-07 #2 MAJOR · R8 · memory_trick_de (twin)
UPDATE public.grammar_rules SET memory_trick_de = $q$Vor einem Nomen: der/die/das + -ste. Nach sein: am + -sten oder der/die/das + -ste (der Schnellste).$q$
WHERE id = 'e1417811-ccda-5f70-bb32-61d3fa94be57' AND memory_trick_de = $q$Nomen in der Nähe? der/die/das. Kein Nomen? am + sten.$q$;

-- S183 · A2.2-07 #3 MAJOR · EX8 · sentence_de
UPDATE public.grammar_examples SET sentence_de = $q$Wer hat die meisten Punkte?$q$
WHERE id = 'b0cdc32f-8659-44ac-be83-db377977db4d' AND sentence_de = $q$Wer hat am meisten Punkte?$q$;

-- S184 · A2.2-07 #3 MAJOR · EX8 · grammar_highlight (authored: follows the new sentence)
UPDATE public.grammar_examples SET grammar_highlight = $q$die meisten$q$
WHERE id = 'b0cdc32f-8659-44ac-be83-db377977db4d' AND grammar_highlight = $q$am meisten$q$;

-- S185 · A2.2-07 #3 MAJOR · EX8 · explanation_en (authored)
UPDATE public.grammar_examples SET explanation_en = $q$viel - mehr - am meisten (irregular!). Before a noun: die meisten Punkte.$q$
WHERE id = 'b0cdc32f-8659-44ac-be83-db377977db4d' AND explanation_en = $q$viel - mehr - am meisten (irregular!).$q$;

-- S186 · A2.2-07 #3 MAJOR · EX8 · explanation_de (authored)
UPDATE public.grammar_examples SET explanation_de = $q$viel - mehr - am meisten (unregelmäßig!). Vor einem Nomen: die meisten Punkte.$q$
WHERE id = 'b0cdc32f-8659-44ac-be83-db377977db4d' AND explanation_de = $q$viel - mehr - am meisten (unregelmäßig!).$q$;

-- S187 · A2.2-07 #3 MAJOR · EX8 · word_breakdown (authored: follows the new sentence)
UPDATE public.grammar_examples SET word_breakdown = $q${"Wer":"Who","hat":"has","Punkte":"points","die meisten":"the most"}$q$::jsonb
WHERE id = 'b0cdc32f-8659-44ac-be83-db377977db4d' AND word_breakdown = $q${"Wer":"Who","hat":"has","Punkte":"points","am meisten":"the most"}$q$::jsonb;

-- ── A2.2-08 future-tense ─────────────────────────────────────────────────────────────────────────────────────────

-- S188 · A2.2-08 #1 MAJOR · R8 · content{mistakes,0,explanation_de} (splice: „, nicht arbeite." kept)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,explanation_de}', to_jsonb($q$Im Futur steht nach werden der Infinitiv: arbeiten, nicht arbeite.$q$::text))
WHERE id = 'ae3bbb1f-51ee-5de9-bd20-9368422de91c' AND content #>> '{mistakes,0,explanation_de}' = $q$Nach werden steht immer der Infinitiv: arbeiten, nicht arbeite.$q$;

-- S189 · A2.2-08 #1 MAJOR · R8 · content{mistakes,0,explanation_en} (authored twin, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{mistakes,0,explanation_en}', to_jsonb($q$In the future tense werden is followed by the infinitive: arbeiten, not arbeite.$q$::text))
WHERE id = 'ae3bbb1f-51ee-5de9-bd20-9368422de91c' AND content #>> '{mistakes,0,explanation_en}' = $q$werden is always followed by the infinitive: arbeiten, not arbeite.$q$;

-- S190 · A2.2-08 #1 MAJOR (+ #4 MINOR text) · R8 · key_insight_de (splice)
UPDATE public.grammar_rules SET key_insight_de = $q$werden verhält sich wie ein Modalverb: Position 2 im Hauptsatz, ganz am Ende im Nebensatz. Im Nebensatz steht der Infinitiv direkt vor werden.$q$
WHERE id = 'ae3bbb1f-51ee-5de9-bd20-9368422de91c' AND key_insight_de = $q$werden verhält sich wie ein Modalverb: Position 2 im Hauptsatz, ganz am Ende im Nebensatz. Der Infinitiv steht immer davor.$q$;

-- S191 · A2.2-08 #1 MAJOR · R8 · key_insight_en (twin, splice)
UPDATE public.grammar_rules SET key_insight_en = $q$werden behaves like a modal verb: position 2 in a main clause, the very end in a subordinate clause. In a subordinate clause the infinitive stands right before it.$q$
WHERE id = 'ae3bbb1f-51ee-5de9-bd20-9368422de91c' AND key_insight_en = $q$werden behaves like a modal verb: position 2 in a main clause, the very end in a subordinate clause. The infinitive always stands right before it.$q$;

-- ── A2.2-10 verbs-with-prepositions-intro ────────────────────────────────────────────────────────────────────────

-- S192 · A2.2-10 #1 MAJOR (+ #5 MINOR overlap) · R1 · content{description_de} (splice: last sentence kept)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_de}', to_jsonb($q$Diese Verben haben eine feste Präposition mit festem Kasus. Manche haben zwei, mit verschiedener Bedeutung: sich freuen auf (kommt noch) / über (ist schon da), sprechen mit (Person) / über (Thema). Lernen Sie Verb + Präposition + Kasus zusammen. Auch möglich: sich zu einem Kurs anmelden (+ Dativ).$q$::text))
WHERE id = '2ba2d887-9814-509b-86ed-3ea88ef8b409' AND content #>> '{description_de}' = $q$Jedes Verb hat eine feste Präposition und einen festen Kasus. Lerne sie zusammen, wie ein Paar. Auch möglich: sich zu einem Kurs anmelden (+ Dativ).$q$;

-- S193 · A2.2-10 #1 MAJOR · R1 · content{description_en} (authored twin, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{description_en}', to_jsonb($q$These verbs have a fixed preposition with a fixed case. Some have two, with different meanings: sich freuen auf (still to come) / über (already here), sprechen mit (a person) / über (a topic). Learn verb + preposition + case together. You may also meet sich zu einem Kurs anmelden (+ Dativ) in a reading or listening text.$q$::text))
WHERE id = '2ba2d887-9814-509b-86ed-3ea88ef8b409' AND content #>> '{description_en}' = $q$Every verb has one fixed preposition and one fixed case — learn them together, like a pair, not separately. You may also meet sich zu einem Kurs anmelden (+ Dativ) in a reading or listening text.$q$;

-- S194 · A2.2-10 #1 MAJOR · R99 · content{points,0} (authored)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{points,0}', to_jsonb($q$Diese Verben haben eine feste Präposition mit festem Kasus. Manche haben zwei, mit verschiedener Bedeutung: sich freuen auf / über.$q$::text))
WHERE id = '35b84626-1003-5cd5-9a32-139e59e61af2' AND content #>> '{points,0}' = $q$Jedes Verb hat eine feste Präposition und einen festen Kasus.$q$;

-- S195 · A2.2-10 #1 MAJOR · R-1 · content{german_difference_en} (authored, splice)
UPDATE public.grammar_rules SET content = jsonb_set(content, '{german_difference_en}', to_jsonb($q$German and English rarely pick the same preposition: warten auf = wait for, denken an = think of. Each of these verbs has a fixed preposition; a few have two, with different meanings (sich freuen auf / über).$q$::text))
WHERE id = 'ba3380aa-2d7c-5f12-ac8b-e99eb55a2e36' AND content #>> '{german_difference_en}' = $q$German and English rarely pick the same preposition: warten auf = wait for, denken an = think of. German always keeps one fixed preposition per verb.$q$;

-- ── A2.2-12 infinitive-with-zu-intro ─────────────────────────────────────────────────────────────────────────────

-- S196 · A2.2-12 #1 MAJOR · R3 · key_insight_de
UPDATE public.grammar_rules SET key_insight_de = $q$Das Verb mit zu entscheidet: lernen hat kein Präfix → zu lernen. anrufen ist trennbar → anzurufen. Das erste Verb (versuchen, anfangen) spielt keine Rolle.$q$
WHERE id = 'f87e4a6c-1aa4-5fb4-ad2a-6a68f45fd3ad' AND key_insight_de = $q$versuchen ist nicht trennbar: versuchen, zu lernen bleibt zwei Wörter. anrufen ist trennbar: daraus wird ein Wort, anzurufen.$q$;

-- S197 · A2.2-12 #1 MAJOR · R3 · key_insight_en (authored twin)
UPDATE public.grammar_rules SET key_insight_en = $q$The verb with zu decides: lernen has no prefix → zu lernen. anrufen is separable → anzurufen. The first verb (versuchen, anfangen) plays no part.$q$
WHERE id = 'f87e4a6c-1aa4-5fb4-ad2a-6a68f45fd3ad' AND key_insight_en = $q$versuchen (not separable) stays two words: versuchen, zu lernen. anrufen (separable) becomes one word: anzurufen.$q$;

-- S198 · A2.2-12 #1 MAJOR · EX4 · explanation_de
UPDATE public.grammar_examples SET explanation_de = $q$Das Verb mit zu entscheidet: lernen hat kein Präfix → zu lernen. anrufen ist trennbar → anzurufen. Das erste Verb (versuchen, anfangen) spielt keine Rolle.$q$
WHERE id = '0ac8372c-d66d-5391-b885-d0a47f000bc9' AND explanation_de = $q$versuchen ist nicht trennbar, deshalb steht zu einfach vor lernen.$q$;

-- S199 · A2.2-12 #1 MAJOR · EX4 · explanation_en (authored twin)
UPDATE public.grammar_examples SET explanation_en = $q$The verb with zu decides: lernen has no prefix → zu lernen. anrufen is separable → anzurufen. The first verb (versuchen, anfangen) plays no part.$q$
WHERE id = '0ac8372c-d66d-5391-b885-d0a47f000bc9' AND explanation_en = $q$versuchen is not separable, so zu simply stands in front of lernen.$q$;

COMMIT;
