# Wave 4 PR C1 — A2.1 reading: 8 rewrites + 2 exam-format lessons

Read `S/wave4/common-header.md`, `S/wave4/level-a2.1.md`, then:
- `S/wave4/source/reading-a2.1.json` — the 8 live A2.1 lessons (226–327 words, no `checks`, full
  of weil/dass/relative clauses/Komparativ → all outside the level).
- `S/wave3/reading/rewrites-a1.2.json`, `exam-format-a1.2.json`, `notes.md`, `review.md` (shape,
  what passed review).
- `scripts/reading-from-json.mjs` header; `src/components/ReadingChecks.jsx` (how `checks` render:
  type 'rf' → richtig/falsch; type 'choice' → options array rendered verbatim, e.g. ["a","b","c"]);
  `src/pages/ReadingLessonPage.jsx` (what else renders: key_vocabulary, questions).
- Goethe-Zertifikat A2 Lesen format (use WebSearch; goethe.de itself is unreachable from the
  sandbox): Teil 1 informational/newspaper text + 5 Richtig/Falsch; Teil 2 table/programme + 5 MC;
  Teil 3 personal/semi-formal e-mail + 5 MC a/b/c; Teil 4 situations ↔ Anzeigen. Verify and record
  what you found in notes.md with the URLs.

## Rewrites → `S/wave4/reading/rewrites-a2.1.json`
Array keyed by the LIVE id; fields exactly as the Wave 3 file: id, title_de, title_en, content_de,
content_en, key_vocabulary (10–14, "der Umzug, -¨e" style), questions (5 open Q/A, both langs),
checks (5 × rf + 1 × choice with options ["a","b","c"] and a statement that asks a detail),
word_count (exact count of content_de), estimated_reading_time (2–3).
Constraints: content_de 120–150 words; same topic and same protagonist story as the live lesson
(keep title unless it lies); grammar = A1 + A2.1 topics 1–12 (Perfekt, Dativ, Wechselpräpositionen,
modal Präteritum konnte/musste/wollte, temporal prepositions, adjective endings after der/ein —
use them on purpose so the texts rehearse the course); weil/dass/wenn ≤2 per text and only as
reading exposure; NO relative clauses, NO Präteritum of full verbs (war/hatte/konnte… fine), NO
Genitiv, NO Komparativ except one "…er als …" per text at most, NO reflexives except "Ich freue
mich". Sentences ≤14 words. Checks must be decidable from the text alone; 2–3 of the 5 rf are
falsch, each explanation_de quotes the text.

## Exam-format lessons → `S/wave4/reading/exam-format-a2.1.json` (2 new rows)
Shape as `exam-format-a1.2.json`: level "a2.1", topic "Prüfungsformat", difficulty 2,
order_index 9 and 10, title_de EXACTLY:
- 9: "Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung)" — one informational text ~120–140
  words (e.g. a local-newspaper piece about a Stadtfest / Sportverein / Fahrradverleih), content_de
  opens with the instruction line "Lies den Text. Sind die Sätze richtig oder falsch?", checks =
  5 × rf (mix 2–3 falsch), questions = 3 open Q/A, key_vocabulary 8–10.
- 10: "Lesen Teil 3: Eine E-Mail (wie in der Prüfung)" — one semi-formal e-mail ~110–130 words
  (Vermieter/Kursleiterin/Kollege), instruction line "Lies die E-Mail. Wähle die richtige Antwort:
  a, b oder c.", checks = 5 × choice with options ["a","b","c"], statement_de = the question plus
  the three answers inline ("Wann beginnt der Kurs? a) am Montag b) am Dienstag c) am Freitag"),
  answer one letter, explanation_de quotes the e-mail; questions = 3 open Q/A.
(The plan author links these two titles verbatim — do not change them.)

Write `S/wave4/reading/verify.mjs` (word counts exact, sentence ≤14 words, banned-grammar regex
(`\bweil\b|\bdass\b|\bwenn\b` count ≤2, `\b(der|die|das|dem|den)\b,` relative-clause heuristic,
`\bwurde|ging|kam|sagte|gab\b`, `\bwürde\b`, `\bals\b` count ≤1, `\bsich\b` outside "freue
mich"), rf mix, choice answers valid, key/questions counts, no duplicate statements) and run it
clean. Then `S/wave4/reading/notes.md`.
