# Wave 5 PR B — A2.2 Wortliste: additions + fixes

Read `S/common-header.md`, then `S/level-a2.2.md` (BINDING — example sentences are learner-facing German),
then this brief in full. Two authors: V1 = FIXES to the 247 live A2.2 rows; V2 = ADDITIONS (~170 new rows).
Each writes only under `S/vocab/`. Never write to Supabase; you may READ it.

## Source data (pull it yourself, read-only)
Use the Supabase MCP `execute_sql` tool (project_id omqyueddktqeyrrqvnyq) — SELECT only, never INSERT/UPDATE.
1. `select id, german, english, article, plural, category, example_sentence from words where lower(level)='a2.2' order by category, german;`
   → save as `S/vocab/source/words-a2.2.json` (V1 does this; V2 reads the file when it exists, else pulls it too).
2. `select lower(level) as level, german from words order by 1,2;` → `S/vocab/source/all-words-index.json` (V2).
3. `select category, count(*) from words where lower(level)='a2.2' group by 1 order by 1;` — the live categories.
If you do NOT have the Supabase tool, stop and report "no Supabase tool".

Also read: `scripts/words-from-json.mjs` header (the generator; guards on (german, level, category)), and
`src/components/SrsTrainer.jsx` / the `WordCard` usage of `article`/`german`/`plural` (why the article must
NOT live inside `german`, and how `plural` renders: JSON null = no plural line).

## V1 — Fixes → `S/vocab/words-a2.2-fixes.json` (array of {id, field, old, new, reason})
Audit all 247 rows. Measured defect classes (2026-09-06): 152 rows carry the article inside `german`
("der Bahnhof" with article "der") → new = bare headword; 60 rows carry the article inside `plural`
("die Bahnhöfe") → bare plural; 15 rows have the literal string "null" as plural → real plural, or JSON
null for true singularia tantum (the live A1.2/A2.1 convention: `"new": null`). Also fix: wrong
article/plural/English, example sentences that break the level constraint (relative clauses, Passiv,
Genitiv, Präteritum of full verbs, B1 subordinators, null-article adjectives), that do not contain the
headword, or that exceed 12 words. `old` must be byte-exact from the source file. One entry per (id,
field). Do NOT re-categorise or delete rows. Reflexive verbs are productive at A2.2 — an example with
"sich" is fine. Write `S/vocab/validate-fixes.mjs` (every old matches the source byte-exact; no new value
starts with der/die/das/ein/eine; no "null" string; sentence rules) and run it clean; then
`S/vocab/notes-V1.md` (counts per defect class, doubts).

## V2 — Additions → `S/vocab/words-a2.2-additions.json` (array of {german, english, article, plural,
category, example_sentence, level:"a2.2"})
Target 165–180 new rows in 8 NEW categories (≈20–22 each) covering Goethe-Zertifikat A2 Wortliste
themes that A2.2 lacks today (check the live categories first; do not reuse a live category name):
suggested "Work & Job Search", "Housing & Neighbours", "Health & Doctor's Visit", "Transport & Travel
Problems", "Weather & Environment", "Feelings & Opinions", "Money & Bank", "Learning & Exams" — adjust to
the gaps you measure. Category names in English, Title Case, matching the existing style ("City &
Directions"). Rules:
- No headword that already exists at ANY level in all-words-index.json (A1/A2.1 words are known); a
  Goethe A2 word already at b1.x may be added at a2.2 only if it is clearly A2 core — note each case. No
  duplicate inside your own file.
- Nouns: article + plural (or JSON null for singularia tantum — not "–", not "null"); verbs infinitive,
  reflexive verbs as "sich anmelden" with article null; irregular Perfekt noted in `english` only
  ("to bring (hat gebracht)"); adjectives bare.
- example_sentence: ≤12 words, contains the headword (nouns with an article/possessive), inside the
  level constraint (the four new topics 9–12 are allowed), natural, names German-keyboard typeable.
- ~60 % nouns, ~25 % verbs, ~15 % adjectives/adverbs/chunks. Everyday adult life.
Write `S/vocab/validate-additions.mjs` (shape, duplicates vs index and within file, sentence length /
headword presence, banned-grammar regex incl. " des ", relative-clause patterns, Passiv, um/ohne…zu,
null-article adjective+noun) and run it clean; then `S/vocab/notes-V2.md` (per-category counts,
borderline words, doubts). Report ≤15 lines.
