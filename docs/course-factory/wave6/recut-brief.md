# Wave 6 PR A — grammar re-cut author brief (three live A2.2 topics)

Read S/common-header.md and S/level-a2.2.md first. Your job: remove every out-of-level (B1) form from
the LIVE rows of three A2.2 grammar topics by editing strings in place, so that the topics still teach
their subject with only dass / weil / wenn / ob as subordinators and no Präteritum of full verbs, no
Plusquamperfekt, no Genitiv, no relative clauses.

## Source (read-only copies of the live rows = the committed cache)
- S/recut/source/subordinating-conjunctions.json  (11 rules, 15 examples, 25 exercises)
- S/recut/source/subordinate-word-order.json      (9 rules, 15 examples, 25 exercises)
- S/recut/source/superlative.json                 (9 rules, 12 examples, 18 exercises)
Each row has its uuid `id`. Rule content is a jsonb object rendered shape-by-shape (tables =
{headers, rows}; lists of objects; `_de`/`_en` paired keys) — keep every shape; you may change strings
inside, drop a row from a `rows[]`/`conjunctions[]` array, or replace it. Never rename keys.

## Known offenders (found by the recon; you must also sweep every other German field yourself)
subordinating-conjunctions: rule oi 0 (paragraphs_en list obwohl/während/bevor/nachdem/bis/seit — trim
the EN list to the four taught ones), oi 1 (six banned `conjunctions[]` entries — replace with in-level
entries or drop; keep at least dass/weil/wenn/ob), oi 4 (table row listing the B1 set), oi 5 ("wenn vs.
ob vs. als" table: drop/replace the `als` row and the als key_insight_de/memory_trick_de — teach
wenn (repeated/general) vs ob (yes/no) vs dass), oi 8 (dialogue "Obwohl es schade ist, …"), oi 9
(summary top_rules[0]); intro oi -1 EN "obwohl"; oi 2 "…weil ich nicht habe kommen können" (Ersatzinfinitiv
— simplify to "weil ich nicht kommen konnte"). Examples oi 5, 6, 7, 8, 9, 10, 15 (obwohl/während/bevor/
nachdem/bis/seit/als + spielte). Exercises oi 8 (fill_blank answer "Als", options Wenn/Als/Ob/Weil →
rewrite as a wenn/weil/dass/ob item whose key is NOT als) and oi 11 (MC "wenn vs. als" → another
in-level contrast, e.g. wenn vs. ob).
subordinate-word-order: rule oi 0 (content_de list + EN bullets with obwohl/als/bevor/nachdem), oi 4
(table rows obwohl/als/bevor/nachdem/während/bis/seit/damit/sodass incl. "schlief" — keep only in-level
rows), oi 6 (dialogue: "hatte gehofft" Plusquamperfekt → Perfekt/present; nachdem; obwohl), oi 7
(golden_rule_de "des Satzes" Genitiv → "im Satz"; als). Examples oi 4, 10, 11 (+explanation_de "des
Satzes"), 12 ("Nachdem er gegessen hatte, ging er schlafen" → e.g. "Wenn er gegessen hat, geht er
schlafen." with explanation_de rewritten — no "Plusquamperfekt" mention), 13. Exercises oi 7 ("Obwohl
es ___" + distractor "regnete"), oi 9 ("Als ich jung ___, spielte …"), oi 14 ("Bevor …" + distractor
"ging"); oi 8 distractor "kam" (replace the distractor).
superlative: example oi 7 "Das war der kälteste Tag des Jahres." → e.g. "Das war der kälteste Tag im
Jahr." (also fix word_breakdown and sentence_en if needed). Rules are clean.

## Deliverable: S/recut/patches.json — an array of patches
{ "table": "grammar_rules" | "grammar_examples" | "grammar_exercises",
  "id": "<uuid>", "field": "<column>", "old": <exact current value>, "new": <value>,
  "why": "<one line>" }
- `old` must be byte-identical to the source (copy it programmatically, never retype).
- One patch per (id, field). Allowed fields — rules: content, common_mistakes, title_en, title_de,
  memory_trick_en/de, formal_note_en/de, key_insight_en/de. Examples: sentence_de, sentence_en,
  grammar_highlight, explanation_en, explanation_de, word_breakdown. Exercises: question_de,
  question_en, options, correct_answer, acceptable_answers, explanation_en, explanation_de, hint,
  why_correct_en, why_correct_de, related_rule_title.
- For a `content` patch, `new` is the whole object (same keys, same shapes).
- Keep exercise_type, stage, difficulty, order_index untouched; a typed exercise (options null) stays
  typed; an MC exercise keeps 4 options containing correct_answer; keep acceptable_answers consistent.
- English fields: mirror the German change so DE/EN never disagree.

## Verifier: S/recut/verify.mjs (write it yourself, ≥ the following)
1. loads the three source files + patches.json; every patch id exists in its table; `old` equals the
   source value (deep-equal); applies patches in memory.
2. sweeps EVERY German-bearing string of the patched rows (all *_de fields, sentence_de, question_de,
   options, correct_answer, acceptable_answers, and every string inside `content` — recursively —
   except keys ending in _en) with the ban battery: \b(obwohl|während|bevor|nachdem|damit|sodass|so
   dass|seitdem|falls)\b; als as conjunction (\bAls\b at clause start or ", als " + verb-final);
   bis/seit + clause subject; Präteritum full verbs (ging|kam|sagte|spielte|schlief|machte|blieb|sah|
   fand|lief|stand|saß|dachte|wusste|hörte|las|fuhr|nahm|half|regnete|arbeitete|…); Plusquamperfekt
   (hatte|war + Partizip II); Genitiv (des|eines|meines … + noun-s, "der" + fem noun after a noun);
   relative clauses (", der/die/das/den/dem/denen " + verb-final); Passiv (wird/wurde + Partizip);
   Konjunktiv II beyond würde/könnte/hätte/wäre/möchte; um…zu / ohne…zu; sentences over 16 words.
   Prints FAIL lines with id/field; exits non-zero on any.
3. asserts counts unchanged (rows per table per topic) and every MC exercise has 4 options
   containing correct_answer.
Run it; it must print 0 FAIL. Then write S/recut/notes.md.
