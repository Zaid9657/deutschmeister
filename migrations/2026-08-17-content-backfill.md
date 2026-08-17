# Content data backfill (applied 2026-08-17)

Applied to project `omqyueddktqeyrrqvnyq` as six Supabase migrations. Data-only.

| Migration | What it did |
|---|---|
| `fill_blank_acceptable_answers_2026_08_17` | Populated `acceptable_answers` on all 433 fill-blank exercises |
| `words_missing_plurals_2026_08_17` | Resolved the 101 nouns with no plural |
| `words_dedupe_within_level_2026_08_17` | Removed 47 duplicate vocabulary rows |
| `reading_lessons_text_hygiene_2026_08_17` | CRLF, broken plural markers, `word_count`, `estimated_reading_time` |
| `grammar_topics_prerequisites_2026_08_17` | Populated `prerequisite_slugs` (116 edges over 60 topics) |
| `fix_unanswerable_fill_blanks_2026_08_17` | Rewrote 3 exercises whose answer could not be typed |

## Notes worth keeping

**`acceptable_answers` must always contain `correct_answer`.** `[]` is truthy in
JavaScript, so `dbRow.acceptable_answers || [dbRow.correct_answer]` would pass an
empty array straight through and mark *every* typed answer wrong. Writing `[]`
for "no variants" would therefore have broken all 433 exercises. Each row now
holds at least its own correct answer; `src/services/grammarService.js` was also
hardened so the invariant no longer depends on the data being right.

Only **7 of 433** exercises have a genuine second answer — contraction pairs
(`vom`/`von dem`, `zur`/`zu der`, `im`/`in dem`, `ins`/`in das`) and two
conjunction swaps (`Anstatt`/`Statt`, `Obgleich`/`Obwohl`). The rest test one
specific form, and `src/utils/answerMatch.js` already handles case, whitespace
and umlaut/ß spellings in code, so those were deliberately not duplicated here.

**Most "missing" plurals were not missing.** 98 of the 101 are mass or abstract
nouns with no plural in German (Hunger, Milch, Schnee, Vertrauen, Geduld,
Nachhaltigkeit…). The table already encodes that as the literal string `'null'`
in 31 pre-existing rows — including six of these same words at another level —
so the convention was followed rather than invented. Only 3 had a real everyday
plural: `WLANs`, `Immunsysteme`, `Kreisläufe`.

**Reading rate was derived, not guessed.** Over the 22 lessons whose stored
`word_count` already matched their text, `sum(word_count)/sum(estimated_reading_time)`
= 6112/107 ≈ **57 wpm**, which reproduces 20 of those 22 exactly. Applied as
`greatest(1, round(word_count / 57))`. Reading times now increase monotonically
by level; b2.2 previously claimed 15 minutes for 473 words.

**Several audit figures were high.** The real numbers: CRLF affected 44 rows
(not 52), the broken `-̈e` plural marker 27 entries (not 33), and 41 lessons had
a `word_count` off by more than 15% (not 49). The corrected counts are what the
migrations acted on.

## Verify

```sql
SELECT
  (SELECT count(*) FROM grammar_exercises
     WHERE exercise_type='fill_blank' AND NOT (acceptable_answers ? correct_answer)) AS key_missing,      -- 0
  (SELECT count(*) FROM grammar_exercises WHERE correct_answer LIKE '(%)')            AS unanswerable,    -- 0
  (SELECT count(*) FROM words WHERE article IS NOT NULL
     AND (plural IS NULL OR btrim(plural)=''))                                        AS nouns_no_plural, -- 0
  (SELECT count(*) FROM reading_lessons WHERE content_de ~ E'\r')                     AS crlf_left,       -- 0
  (SELECT count(*) FROM grammar_topics WHERE cardinality(prerequisite_slugs) > 0)     AS with_prereqs;    -- 60
```

`words` went from 1982 to 1935 rows (47 duplicates removed). Four topics are
intentionally left without prerequisites: `alphabet-pronunciation`,
`nouns-gender`, `numbers-counting` (foundational) and `modal-particles`
(pragmatic, no structural dependency).
