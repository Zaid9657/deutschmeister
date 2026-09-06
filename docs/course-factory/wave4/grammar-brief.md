# Wave 4 grammar author brief (one topic per author)

You write ONE new A2.1 grammar topic as a JSON document for `scripts/grammar-topics-from-json.mjs`
(create mode). Output: `S/wave4/grammar/<slug>.json` + `S/wave4/grammar/<slug>.notes.md`
(coverage, deliberate exclusions, doubts for the reviewer). Write nothing else anywhere.

S = /tmp/claude-0/-home-user-deutschmeister/c2792a5e-db22-5773-87d6-2f95d17dddab/scratchpad
Repo = /home/user/deutschmeister (read-only for you).

## Read first, in this order
1. `S/wave4/level-a2.1.md` — the BINDING level constraint (allowed/banned grammar, chunks, register).
2. `S/wave3/grammar/imperative.json` — the exact JSON shape (topic / rules / examples / exercises)
   that passed review and shipped. Copy its shape, not its content.
3. `S/wave3/grammar/imperative.notes.md` + `S/wave3/grammar/review-2.md` — what a CLEAN
   deliverable and an adversarial review look like.
4. `scripts/grammar-topics-from-json.mjs` header + `scripts/check-grammar-json.mjs` — the
   validator. Your file MUST pass `node scripts/check-grammar-json.mjs S/wave4/grammar/<slug>.json`
   with zero errors before you report.
5. The live A2.1 topics 1–8 (rule titles are listed below) so you do not re-teach them; the
   live A2.2 topics (reflexive-verbs, simple-past-sein-haben, coordinating/subordinating
   conjunctions, subordinate-word-order, comparative, superlative, future-tense) and B1.1
   topics (genitive, relative clauses, Konjunktiv II, zu-infinitives) are OUT of scope —
   never teach or exercise them.

## Hard shape (the validator enforces most of it; the reviewer enforces the rest)
- `topic`: sub_level "A2.1", topic_order as assigned, slug, title_en (≤ 45 chars — the Astro
  page title is "German <title_en> — A2.1 Grammar | DeutschMeister" and must stay ≤ 70),
  title_de, description_en/de (2–3 sentences, name the Goethe A2 exam use), icon (one
  emoji), estimated_time (20–25), difficulty, related_slugs (existing slugs only),
  prerequisites (existing slugs only).
- `rules`: 7–9 rules. rule_type ∈ introduction, table, tip, pattern, summary,
  explanation_core, explanation_patterns, explanation_comparison, explanation_exceptions,
  common_mistakes, dialogue, warning ('list' is NOT allowed). Every rule has title_en/de and
  bilingual content; tables use {"type":"case_table","headers":[…],"rows":[…],
  "description_de","description_en"}; at least one common_mistakes rule with ≥3
  wrong/correct pairs; one summary ("Quick Reference") last. order_index 1..n contiguous.
- `examples`: exactly 10, order_index 1..10, each with sentence_de (≤14 words), sentence_en,
  grammar_highlight (a substring of sentence_de), explanation_en/de, word_breakdown (every
  token of sentence_de), difficulty 1–3, category, audio_url null.
- `exercises`: exactly 26 — stage 4: 13 (order_index 1..13), stage 5: 13 (order_index
  1..13). ≥ 16 typed production items (`options: null`, exercise_type fill_blank /
  sentence_building / error_correction, `acceptable_answers` an array that includes
  correct_answer and every legitimate variant incl. with/without final punctuation and
  capitalisation where the sentence starts with the answer). ≤ 10 multiple_choice (4 options,
  exactly one correct, distractors plausible). Every item: question_de, question_en (the
  English carries the cue: verb, person, case, "start with …"), explanation_en/de,
  why_correct_en/de, difficulty. Stage 4 = recognition + guided production; stage 5 = free
  production (sentence_building with cue brackets `[ich / helfen / du]`).
- German quality gate: every German string is correct standard German, natural, A2 register,
  inside the level constraint. Umlauts/ß correct. No English in German fields.
- Exam anchoring: each topic must name where the structure appears in Goethe A2 (Schreiben
  Teil 1 SMS / Teil 2 E-Mail, Sprechen Teil 1–3, Lesen/Hören) in description and ≥1 rule.

## The four topics (one per author)
| topic_order | slug | scope (from level-a2.1.md) | prerequisites |
|---|---|---|---|
| 9 | adjective-endings-intro | Adjektivdeklination after der/die/das (Nom/Akk/Dat) and ein/eine/kein/mein (Nom/Akk/Dat); predicative endingless; plural -en after der/kein/mein; frozen chunks | dative-case, possessive-pronouns |
| 10 | pronouns-accusative-dative | Akk + Dat personal pronouns as objects and after prepositions; object order (Dat noun before Akk noun; Akk pronoun before Dat); helfen/danken/gefallen + Dat pronoun; anrufen/besuchen + Akk pronoun | dative-case, prepositions-dative |
| 11 | modal-verbs-past | Präteritum of können/müssen/wollen/dürfen/sollen/mögen, all persons, Satzklammer in the past, war/hatte as companions; "Als Kind konnte ich …" ✗ (als-clause banned) → "Früher konnte ich …" | perfect-tense-haben |
| 12 | temporal-prepositions | um/am/im review; vor/nach/seit/bis/ab/von … bis/zwischen/gegen; the questions wann/wie lange/seit wann/bis wann/ab wann; Dativ after vor/nach/seit/zwischen/ab; bis mostly articleless | prepositions-dative, dative-case |

Live A2.1 rule titles you must not duplicate: dative-case (indirect objects, article
changes, three-case comparison, dative pronouns table, dative verbs, -m pattern, Dativ vor
Akkusativ order); prepositions-dative (eight prepositions, contractions, zu vs nach, seit +
present, gegenüber); two-way-prepositions (movement vs location, nine prepositions,
contractions, motion vs position verbs); possessive-pronouns (paradigm, endings in all
cases); separable-verbs (prefixes, inseparable contrast, when they split, stress);
perfect-tense-haben/-sein (formation, regular vs irregular participles, sein categories,
Vandertramp, separable verbs in Perfekt); imperative-mood (three forms, special cases).
Where your topic touches one of these (pronouns ↔ dative pronouns table; temporal ↔ seit),
build on it explicitly ("Du kennst mir/dir aus Dativ …") and go further; do not repeat it.

## Process
Write → self-check against level-a2.1.md line by line → run the validator → fix → write the
notes file → report the file paths and the validator output in ≤ 15 lines. An adversarial
reviewer will then read your JSON; expect a second round.
