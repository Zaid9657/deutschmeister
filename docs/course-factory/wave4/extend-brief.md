# Wave 4 PR A2 — typed production + depth for the 8 EXISTING A2.1 topics

Read `S/wave4/common-header.md` first. Then, in order:
1. `S/wave4/level-a2.1.md` (binding).
2. `scripts/grammar-topics-from-json.mjs` header lines 1–120 (EXTEND mode shape, id naming,
   order_index rules) and `S/wave3/extend/notes.md`.
3. Shape templates: `S/wave3/extend/typed-a1.2/accusative-intro.json` (typed exercises in EXTEND
   mode) and `S/wave3/extend/typed-a1.2/numbers-counting.json` + `.rule-patch.json` (a depth patch:
   new rules + examples + a rule_patches entry).
4. The live rows of your topics in `grammar-content-cache.json` (repo root; find the topic by
   slug, then its rules/examples/exercises by topic_id) — read every existing exercise so you never
   duplicate a prompt, and every rule so a new rule never re-teaches an existing one.

Validator (must be clean before you report):
`node scripts/check-grammar-json.mjs S/wave4/extend/typed-a2.1/<slug>.json --cache grammar-content-cache.json`

## Live state (measured 2026-09-05; the global exercise counter continues from max_oi+1)
| slug | rules | examples | exercises (stage4/stage5) | typed today | max_oi |
|---|---|---|---|---|---|
| dative-case | 11 | 15 | 15 (8/7) | 0 | 15 |
| prepositions-dative | 11 | 15 | 15 (8/7) | 0 | 15 |
| two-way-prepositions | 11 | 15 | 15 (8/7) | 0 | 15 |
| possessive-pronouns | 4 (-1,1,2,99) | 8 | 8 (8/0) | 0 | 8 |
| separable-verbs | 10 | 15 | 15 (8/7) | 0 | 15 |
| perfect-tense-haben | 5 (-1,1,2,3,99) | 8 | 8 (8/0) | 0 | 8 |
| perfect-tense-sein | 11 | 15 | 15 (8/7) | 0 | 15 |
| imperative-mood | 4 (-1,1,2,99) | 8 | 8 (8/0) | 0 | 8 |

## Deliverable per topic: `S/wave4/extend/typed-a2.1/<slug>.json` (EXTEND mode, sub_level "A2.1")
Every topic: ≥10 NEW typed production exercises (`options: null`; exercise_type fill_blank /
sentence_building / error_correction; `acceptable_answers` array containing correct_answer and every
legitimate variant — with/without final punctuation, capitalised where the answer starts a sentence,
contractions where both are correct e.g. "zu dem"/"zum"). Stage split: the first ~4 on stage 4
(guided: one gap, cue in question_en), the rest stage 5 (free: sentence_building with cue brackets
`[ich / helfen / mein Bruder]`, error_correction with one error). order_index continues the GLOBAL
counter (e.g. dative-case: 16..25). Every item carries question_de, question_en (with the cue:
verb, person, case, "start with …"), explanation_en/de, why_correct_en/de, difficulty 1–3, hint
null or a short German hint. No multiple_choice in this file.

Depth patch for the three thin topics (possessive-pronouns, perfect-tense-haben, imperative-mood),
in the SAME json file as their exercises:
- `rules`: +3 rules each at order_index 3,4,5 (perfect-tense-haben: 4,5,6), rule_type from the
  allowed list (explanation_patterns / explanation_exceptions / common_mistakes / dialogue /
  tip / pattern / table — NOT introduction/summary), each with title_en/de + bilingual content and
  one `common_mistakes` rule with ≥3 wrong/correct pairs. Suggested coverage —
  possessive-pronouns: (a) euer/eure spelling + unser/ihr/Ihr contrast, (b) possessives in the
  Dativ after prepositions (mit meinem Bruder, bei ihrer Mutter — builds on dative-case), (c)
  common mistakes; perfect-tense-haben: (a) verbs with no ge- (-ieren, be-/ver-/er-), (b)
  Satzklammer in questions and with modal-free time phrases ("Hast du gestern …?"), (c) common
  mistakes; imperative-mood: (a) separable verbs + pronouns in the imperative (Ruf mich an! Machen
  Sie das Fenster zu!), (b) softeners bitte/mal/doch and the exam use (Sprechen Teil 3
  Bitten/Vorschläge), (c) common mistakes.
- `examples`: +4 each, order_index 9..12, full shape (sentence_de ≤14 words, grammar_highlight a
  substring, word_breakdown for every token, audio_url null).
- exercises for these three: ≥10 typed as above, order_index 9..18+.
- No `rule_patches` unless you find a factual error in an existing rule — then include one with
  `old` copied byte-exact from the cache and explain it in notes.

Assignment: author E1 = dative-case, prepositions-dative, two-way-prepositions, separable-verbs.
Author E2 = possessive-pronouns, perfect-tense-haben, imperative-mood, perfect-tense-sein.
Each author also writes `S/wave4/extend/notes-<E1|E2>.md`. Stay strictly inside topics 1–8 +
A1 grammar; the four NEW topics (adjective endings, object pronouns, modal Präteritum, temporal
prepositions) are being written in parallel — do not depend on or teach them.
