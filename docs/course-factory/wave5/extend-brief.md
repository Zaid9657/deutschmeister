# Wave 5 PR A2 — typed production + depth for the 8 EXISTING A2.2 topics

Read `S/common-header.md` first (S is defined there). Then, in order:
1. `S/level-a2.2.md` (binding). The four NEW A2.2 topics 9–12 are now live (konjunktiv-ii-polite,
   verbs-with-prepositions-intro, indirect-questions-intro, infinitive-with-zu-intro); do NOT teach
   or depend on them in topics 1–8 — a Konjunktiv II, a wo(r)-form, an indirect W-question or a
   zu-infinitive inside your exercises is a blocking defect.
2. `scripts/grammar-topics-from-json.mjs` header lines 1–120 (EXTEND mode shape, id naming,
   order_index rules).
3. Shape template: `S/extend/exemplar-extend-possessive-pronouns.json` — the shipped Wave 4 depth
   patch for possessive-pronouns in EXTEND shape (3 rules + 4 examples + 12 typed exercises). Copy its
   shape; none of its content. (It fails the --cache check on purpose: its rows already exist.)
4. The live rows of your topics in `grammar-content-cache.json` (repo root; find the topic by slug
   at sub_level "A2.2", then its rules/examples/exercises by topic_id) — read every existing exercise
   so you never duplicate a prompt or target sentence, and every rule so a new rule never re-teaches
   an existing one.

Validator (must be clean before you report):
`node scripts/check-grammar-json.mjs S/extend/typed-a2.2/<slug>.json --cache grammar-content-cache.json`
(run from the repo root with the absolute S path).

## Live state (from the cache; the global exercise counter continues from max_oi+1)
See `S/extend/live-state-a2.2.md`. Note the older topics number their intro rule at order_index 0
(not -1) — leave existing numbering alone; new rules take the next free order_index values named
below (never -1 or 99).

## Deliverable per topic: `S/extend/typed-a2.2/<slug>.json` (EXTEND mode, sub_level "A2.2")
Every topic: ≥10 NEW typed production exercises (`options: null`; exercise_type fill_blank /
sentence_building / error_correction; `acceptable_answers` array containing correct_answer and every
legitimate variant — with/without final punctuation, capitalised where the answer starts a sentence,
contractions where both are correct, alternative but correct word order where German allows it).
Stage split: the first ~4 on stage 4 (guided: one gap, cue in question_en), the rest stage 5 (free:
sentence_building with cue brackets `[ich / sich freuen / auf / das Wochenende]`, error_correction
with exactly one error). order_index continues the GLOBAL counter (e.g. reflexive-verbs: 9..18;
subordinating-conjunctions: 16..25). Every item carries question_de, question_en (with the cue:
verb, person, case, "start with …"), explanation_en/de, why_correct_en/de, difficulty 1–3, hint null
or a short German hint, related_rule_title (an existing or new rule's title_en). No multiple_choice.

Depth patch for the six thin topics (reflexive-verbs, simple-past-sein-haben,
coordinating-conjunctions, comparative, superlative, future-tense — 5–6 rules and 8 examples each
today), in the SAME json file as their exercises:
- `rules`: +3 rules each at the next free order_index values (5-rule topics: 5,6,7; 6-rule topics:
  6,7,8), rule_type from the allowed list (explanation_patterns / explanation_exceptions /
  common_mistakes / dialogue / tip / pattern / table — NOT introduction/summary), each with
  title_en/de + bilingual content in the exemplar's content shapes, and one `common_mistakes` rule
  with ≥3 wrong/correct pairs. Suggested coverage —
  reflexive-verbs: (a) reflexive Dativ vs Akkusativ with a body-part object (Ich wasche mich / Ich
  wasche mir die Hände) as a table, (b) reflexive verbs in Perfekt and with modal verbs (Ich habe
  mich angemeldet / Ich muss mich beeilen — position of the pronoun), (c) common mistakes;
  simple-past-sein-haben: (a) war/hatte inside weil/dass/wenn clauses (verb-final), (b) "es gab",
  "es war" + weather/time chunks and the exam use (Sprechen Teil 2: erzählen), (c) common mistakes;
  coordinating-conjunctions: (a) denn vs weil word order side by side (position 0 vs verb-final),
  (b) nicht … sondern / entweder … oder as A2 chunks, (c) common mistakes;
  comparative: (a) comparative before a noun with the A2.1 adjective endings (ein größeres Zimmer,
  der bessere Weg), (b) "immer + Komparativ", "viel/etwas + Komparativ", "genauso … wie", (c) common
  mistakes; superlative: (a) superlative before a noun (das beste Restaurant, die meisten Leute),
  (b) "am liebsten / am meisten / am besten" as adverbs and the exam use (Sprechen Teil 2), (c)
  common mistakes; future-tense: (a) werden in weil/dass/wenn clauses (…, dass ich kommen werde),
  (b) Futur I vs Präsens + Zeitangabe — when the exam expects which, (c) common mistakes.
- `examples`: +4 each, order_index 9..12, full shape (sentence_de ≤16 words, grammar_highlight a
  substring, word_breakdown for every token, audio_url null, difficulty, category).
- subordinating-conjunctions and subordinate-word-order (11 and 9 rules, 15 examples) get NO depth
  patch — exercises only (16..25).
- No `rule_patches` unless you find a factual error in an existing rule — then include one with
  `old` copied byte-exact from the cache and explain it in notes.

Assignment: author E1 = reflexive-verbs, simple-past-sein-haben, coordinating-conjunctions,
subordinating-conjunctions. Author E2 = subordinate-word-order, comparative, superlative,
future-tense. Each author also writes `S/extend/notes-<E1|E2>.md`. Stay strictly inside topics 1–8
+ A2.1 + A1 grammar.
