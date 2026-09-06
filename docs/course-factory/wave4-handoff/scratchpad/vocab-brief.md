# Wave 4 PR B — A2.1 Wortliste: additions + fixes

Read `S/wave4/common-header.md`, then `S/wave4/level-a2.1.md`, then:
- `S/wave4/source/words-a2.1.json` — the 248 live A2.1 rows (id, german, english, article, plural,
  category, example_sentence). 10 categories × 25 (Shopping & Stores 23).
- `S/wave4/source/all-words-index.json` — every `german` headword per level (a1.1 … b2.2).
- `S/wave3/vocab/words-a1.2-additions.json`, `words-a1.2-fixes.json`, `notes.md`, `validate.mjs`
  (shape + how the last wave validated).
- `scripts/words-from-json.mjs` header (the generator; guards on (german, level, category)).
- `src/components/SrsTrainer.jsx` and `WordCard` usage of `article`/`german`/`plural` (why the
  article must NOT live inside `german`, and how plural renders).

## Fixes → `S/wave4/vocab/words-a2.1-fixes.json` (array of {id, field, old, new, reason})
Audit all 248 rows. Known defect classes (measured): 117 rows carry the article inside `german`
("der Bahnhof" with article "der") → new = bare headword; 5 nouns have null/empty plural → real
plural or "–" only for true singularia tantum (e.g. Obst) — use the convention already live at
A1.2 (read the A1.2 fixes/notes). Also fix: wrong article/plural/English, example sentences that
break the level constraint (weil/dass/relative clauses/Komparativ/Präteritum of full verbs), or
that do not contain the headword, or exceed 12 words. `old` must be byte-exact from the source
file. One entry per (id, field). Do NOT re-categorise or delete rows.

## Additions → `S/wave4/vocab/words-a2.1-additions.json` (array of {german, english, article,
plural, category, example_sentence, level:"a2.1"})
Target 160–180 new rows in 8 NEW categories (≈20–22 each) chosen to cover the Goethe-Zertifikat
A2 Wortliste themes that A2.1 lacks today: "Health & Body", "Home & Moving", "Offices & Forms",
"Travel & Holidays", "Clothing & Appearance", "Family & Relationships", "Media & Communication",
"Celebrations & Invitations". Category names in English, Title Case, matching the existing style
("City & Directions"). Rules:
- No headword that already exists at ANY level in all-words-index.json (A1 words are known;
  a Goethe A2 word already at a2.2/b1.x is still allowed to be added at a2.1 only if it is
  clearly A2 core — note each such case). No duplicate inside your own file.
- Nouns: article + plural (or "–" for singularia tantum); verbs infinitive with a note of the
  Perfekt in `english` only if irregular ("to bring (hat gebracht)"); adjectives bare.
- example_sentence: ≤12 words, contains the headword (nouns with an article/possessive), inside
  the level constraint, natural, no names outside German keyboard.
- ~60 % nouns, ~25 % verbs, ~15 % adjectives/adverbs/chunks. Everyday adult life (Arzt, Wohnung,
  Amt, Reise, Arbeit, Familie, Einladung).
Write `S/wave4/vocab/validate.mjs` (mirror the Wave 3 one: shape, duplicates vs index, sentence
length/headword presence, banned-grammar regex) and run it clean. Then `S/wave4/vocab/notes.md`.
