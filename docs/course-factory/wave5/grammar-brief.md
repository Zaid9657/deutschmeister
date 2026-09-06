# Wave 5 grammar author brief (one topic per author)

You write ONE new A2.2 grammar topic as a JSON document for `scripts/grammar-topics-from-json.mjs`
(CREATE mode). Output: `S/grammar/<slug>.json` + `S/grammar/<slug>.notes.md`. Write nothing else.
Read `S/common-header.md` first (S is defined there).

## Read first, in this order
1. `S/level-a2.2.md` — the BINDING level constraint. Your topic's own section tells you the exact
   scope and the explicit NOT-list; the BANNED list applies to every string you write.
2. `S/grammar/exemplar-modal-verbs-past.json` — a shipped, reviewed Wave 4 topic in the exact input
   shape (topic / rules / examples / exercises). Copy its shape, field names, content-object
   conventions (case_table, dialogue lines, common_mistakes pairs, word_breakdown tokens), not its
   content. It has 9 rules / 10 examples / 26 exercises / 22 typed.
3. `scripts/grammar-topics-from-json.mjs` header + `scripts/check-grammar-json.mjs` — the validator.
   Your file MUST pass `node scripts/check-grammar-json.mjs S/grammar/<slug>.json` (run from the repo
   root) with zero errors before you report.
4. `S/slugs.txt` — every live topic slug. `prerequisite_slugs` and `related_slugs` may only contain
   slugs from this list (tests resolve them). Do not re-teach the live A2.2 topics 1–8 or the A2.1
   topics; where your topic touches one (e.g. verb-final order from subordinate-word-order, reflexive
   pronouns from reflexive-verbs, Präteritum konnte/hatte/war behind könnte/hätte/wäre), build on it
   explicitly ("Du kennst … aus …") and go further. B1 topics with a similar name exist
   (konjunktiv-ii-wurde, verbs-with-prepositions, indirect-questions, infinitive-with-zu) — they are
   the FULL versions; yours is the A2 slice named in the level file and must stay inside it.

## Hard shape (the validator enforces most of it; the reviewer enforces the rest)
- `topic`: sub_level "A2.2", topic_order as assigned, slug as assigned, title_en (≤45 chars — the
  Astro page title "German <title_en> — A2.2 Grammar | DeutschMeister" must stay ≤70), title_de,
  description_en/de (2–3 sentences, name the Goethe A2 exam use: Schreiben Teil 1 SMS / Teil 2
  E-Mail, Sprechen Teil 1–3, Lesen/Hören), icon "book", estimated_time 20–25, is_published true,
  prerequisite_slugs and related_slugs from S/slugs.txt only (2–3 and 3–5 entries).
- `rules`: 7–9. Exactly one `introduction` at order_index -1 and one `summary` ("Quick Reference")
  at order_index 99; the others 1..n contiguous. rule_type ∈ introduction, table, tip, pattern,
  summary, explanation_core, explanation_patterns, explanation_comparison, explanation_exceptions,
  common_mistakes, dialogue, warning ('list' is NOT allowed). Every rule has title_en/de and
  bilingual content in the exemplar's content shapes; at least one `table` (case_table) and one
  `dialogue` (6–8 lines, two adults, exam-like situation); one `common_mistakes` rule with ≥3
  wrong/correct pairs (each pair: wrong, correct, explanation_en/de). At least one rule names the
  Goethe A2 task where the form scores.
- `examples`: exactly 10, order_index 1..10, sentence_de ≤16 words, sentence_en, grammar_highlight
  (a verbatim substring of sentence_de), explanation_en/de, word_breakdown (every token of
  sentence_de, in order), difficulty 1–3, category, audio_url null.
- `exercises`: exactly 26 — stage 4: 13 (order_index 1..13), stage 5: 13 (order_index 1..13).
  ≥16 typed production items (`options: null`, exercise_type fill_blank / sentence_building /
  error_correction; `acceptable_answers` an array that includes correct_answer and EVERY legitimate
  variant: with/without final punctuation, capitalisation when the answer starts the sentence,
  contracted/uncontracted forms, alternative word order where German allows it). fill_blank has
  exactly one `___`. ≤10 multiple_choice (exactly 4 options, exactly one correct, plausible
  distractors that each illustrate a real learner error). Every item: question_de, question_en (the
  English carries the cue: verb, person, case, "start with …"), explanation_en/de, why_correct_en/de,
  difficulty, related_rule_title (a title_en of one of your rules). Stage 4 = recognition + guided
  production; stage 5 = free production (sentence_building with cue brackets `[ich / warten / auf /
  der Bus]` → one unambiguous target sentence; give the cue in dictionary forms and mark the
  required structure in question_en).
- German quality gate: correct standard German, natural, A2 register, inside the level file.
- Variety: the 26 exercises must cover every person/form the topic teaches and at least three
  different everyday situations; no two exercises may share the same target sentence.

## The four topics (one per author)
| topic_order | slug | title_de (suggested) | prerequisite_slugs (pick from these) |
|---|---|---|---|
| 9 | konjunktiv-ii-polite | Höfliche Bitten und Wünsche: würde, könnte, hätte, wäre | modal-verbs-past, simple-past-sein-haben, modal-verbs-intro |
| 10 | verbs-with-prepositions-intro | Verben mit Präpositionen | reflexive-verbs, two-way-prepositions, prepositions-dative, prepositions-accusative |
| 11 | indirect-questions-intro | Indirekte Fragen mit ob und W-Wort | subordinating-conjunctions, subordinate-word-order, question-words, yes-no-questions |
| 12 | infinitive-with-zu-intro | Infinitiv mit zu | subordinate-word-order, separable-verbs, modal-verbs-intro |

Scope for each is the topic's paragraph in `S/level-a2.2.md` — read it twice; its NOT-list is
binding. related_slugs: the live neighbours (e.g. topic 9 → konjunktiv-ii-wurde,
konjunktiv-ii-ware-hatte, modal-verbs-past; topic 10 → verbs-with-prepositions, reflexive-verbs,
pronouns-accusative-dative; topic 11 → indirect-questions, question-words,
subordinating-conjunctions; topic 12 → infinitive-with-zu, um-zu-ohne-zu, modal-verbs-intro).

## Process
Write → self-check against level-a2.2.md line by line (every sentence: is each structure allowed
at A2.2 or inside my own topic?) → run the validator → fix → count typed items and forms covered →
write the notes file → report the file paths, counts and the validator output in ≤15 lines. An
adversarial Opus reviewer will then re-solve every exercise cold; expect a second round.
