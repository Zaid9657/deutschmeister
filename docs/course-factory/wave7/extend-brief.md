# Wave 7 PR A2 — typed production + depth for the 8 EXISTING B1.1 topics

Read `S/common-header.md` first (S is defined there). Then, in order:
1. `S/level-b1.1.md` (binding). The four NEW B1.1 topics 9–12 are live (temporal-clauses,
   obwohl-damit-sodass, adverbial-connectors, two-part-connectors); do NOT teach or depend on them in
   topics 1–8 — a temporal Nebensatz with als/bevor/nachdem/während/bis/seit, an obwohl/damit/sodass/
   falls clause, a deshalb/trotzdem/außerdem inversion or a two-part connector inside your exercises is
   a blocking defect (weil/dass/wenn/ob and und/oder/aber/denn/sondern are fine — A2). The Präteritum
   ruling is binding: no exercise KEY may be a past-tense form; in an als-free B1.1 exercise you have no
   reason to use the Präteritum at all except war/hatte/modals.
2. `/home/user/deutschmeister/scripts/grammar-topics-from-json.mjs` header lines 1–120 (EXTEND mode
   shape, id naming, order_index rules, `rule_patches`).
3. Shape template: `S/extend/exemplar-extend-possessive-pronouns.json` — a shipped Wave 4 depth patch
   in EXTEND shape (3 rules + 4 examples + 12 typed exercises). Copy its shape; none of its content.
   (It fails the --cache check on purpose: its rows already exist.)
4. The live rows of your topics: `S/extend/source/<slug>.json` (read-only dumps of the cache = live:
   topic, rules, examples, exercises with their uuids) — read every existing exercise so you never
   duplicate a prompt or target sentence, and every rule so a new rule never re-teaches an existing one.
5. `S/extend/live-state-b1.1.md` — rule/example/exercise counts and order_index ranges per topic.

Validator (must be clean before you report):
`cd /home/user/deutschmeister && node scripts/check-grammar-json.mjs S/extend/typed-b1.1/<slug>.json --cache grammar-content-cache.json`
(absolute S path). Note the repo checkout at /home/user/deutschmeister is main; the cache there is
the live state.

## order_index rules (per topic, NOT global)
Exercises: continue from THAT topic's own max order_index + 1 (genitive-case, relative-clauses-nom-acc,
konjunktiv-ii-wurde: 16..; the five 8-exercise topics: 9..). Rules: the 9-rule topics have -1..7, the
six-rule topics 0..5 — new rules take the next free values (6, 7, 8) and never -1 or 99. Examples: 9-rule
topics have 15 (no depth patch), the five thin topics have 8 → new examples 9..12.

## Deliverable per topic: `S/extend/typed-b1.1/<slug>.json` (EXTEND mode, sub_level "B1.1")
Every topic: ≥10 NEW typed production exercises (`options: null`; exercise_type fill_blank /
sentence_building / error_correction; `acceptable_answers` array containing correct_answer and every
legitimate variant — with/without final punctuation, capitalised where the answer starts a sentence,
both clause orders where the cue does not pin one, "so dass"/"sodass"-style orthographic variants where
they exist). Stage split: the first ~4 on stage 4 (guided: one gap, cue in question_en), the rest stage
5 (free: sentence_building with cue brackets `[ich / warten / auf / der Bus]` whose bracket order MIRRORS
the target's clause order; error_correction with exactly one error). Every item carries question_de,
question_en (with the cue: verb, person, case, "start with …"), explanation_en/de, why_correct_en/de,
difficulty 1–3, hint null or a short German hint, related_rule_title (an existing or new rule's
title_en). No multiple_choice. German ≤20 words per sentence (cue brackets are exempt).

Depth patch for the five thin topics (genitive-prepositions, relative-clauses-dat-gen,
konjunktiv-ii-ware-hatte, infinitive-with-zu, um-zu-ohne-zu — 6 rules and 8 examples each today), in
the SAME json file as their exercises:
- `rules`: +3 rules each at order_index 6, 7, 8; rule_type from explanation_patterns /
  explanation_exceptions / common_mistakes / dialogue / tip / pattern / table (NOT introduction/summary),
  each with title_en/de + bilingual content in the exemplar's content shapes; exactly one of the three
  is a `common_mistakes` rule with ≥3 wrong/correct pairs; one is a `dialogue` (6–8 lines, two adults,
  a telc-B1 situation: Bewerbung, Wohnung, Amt, Arzt, Weiterbildung). Suggested coverage —
  genitive-prepositions: (a) dialogue at the Amt/Vermieter using wegen/trotz/während/innerhalb, (b)
  Genitiv with possessive articles and plural after these prepositions (wegen meines Termins, trotz der
  hohen Kosten) as a table, (c) common mistakes (wegen dem ✗ in writing, statt/anstatt, während as
  preposition vs the new B1.1 conjunction — name it only as "später im Kurs");
  relative-clauses-dat-gen: (a) preposition + relative pronoun table (mit dem, bei der, für die, über
  den, von denen), (b) dialogue (Wohnungsbesichtigung / neue Kollegen), (c) common mistakes (wo vs in
  dem, dessen/deren agreement, comma);
  konjunktiv-ii-ware-hatte: (a) sollte/müsste/dürfte/könnte as advice and polite suggestions in a
  table with exam use (Sprechen Teil 3, halbformeller Brief), (b) dialogue (Ratschläge unter Kollegen),
  (c) common mistakes (würde + sein/haben ✗, wenn-clause verb-final, Konjunktiv II der Vergangenheit is
  B2 — do not show it);
  infinitive-with-zu: (a) zu-infinitive after nouns and adjectives table (die Möglichkeit, … zu; es ist
  wichtig, … zu; keine Zeit, … zu), (b) dialogue (Bewerbungsgespräch / Weiterbildung), (c) common
  mistakes (zu with modal verbs ✗, separable verbs anzurufen, comma);
  um-zu-ohne-zu: (a) (an)statt … zu + the same-subject rule, contrasted with damit ONLY as "damit
  lernst du später" (no damit exercises here), (b) dialogue (Umzug / Reiseplanung), (c) common mistakes
  (um … zu with a different subject ✗ → say "das lernst du im Thema damit", ohne … zu vs ohne + Nomen,
  comma).
- `examples`: +4 each, order_index 9..12, full shape (sentence_de ≤20 words, grammar_highlight a
  substring, word_breakdown covering every token in order — chunk around repeated words, audio_url null,
  difficulty, category).
- genitive-case, relative-clauses-nom-acc, konjunktiv-ii-wurde (9 rules, 15 examples) get NO depth
  patch — exercises only (16..25 or more).
- `rule_patches` (the legacy pass — small this wave): one-field edits of EXISTING rules by rule id with
  `old` copied byte-exact from the source dump. Use them for: a calque or English-flavoured `title_de`
  ("Genitiv-Formen Wiederholung" → "Wiederholung: die Genitivformen"), English inside a German field,
  a `description_de`/`text_de` over 20 words per sentence, a factual error, and the one battery hit —
  um-zu-ohne-zu rule oi 5 `content.text_de` mentions "ohne dass": keep it only as an explicit "das ist
  B2, hier nur zum Erkennen" note or drop the mention. English table headers/columns and dialogue
  `lines[].en` are bilingual by design — leave them. Explain every patch in your notes.

Assignment: author E1 = genitive-case, genitive-prepositions, relative-clauses-nom-acc,
relative-clauses-dat-gen. Author E2 = konjunktiv-ii-wurde, konjunktiv-ii-ware-hatte, infinitive-with-zu,
um-zu-ohne-zu. Each author also writes `S/extend/notes-<E1|E2>.md` (coverage per topic, the rule_patches
with reasons, deliberate exclusions, doubts). Stay strictly inside topics 1–8 + A2 + A1 grammar; the
Genitiv, relative clauses, Konjunktiv II (würde/wäre/hätte/könnte/sollte/müsste/dürfte) and
zu-infinitives are PRODUCTIVE — use them freely across the eight topics.
