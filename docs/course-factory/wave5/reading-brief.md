# Wave 5 PR C1 — A2.2 reading: 8 rewrites + 2 exam-format lessons

Read `S/common-header.md`, `S/level-a2.2.md` (BINDING), then this brief. Supabase project
omqyueddktqeyrrqvnyq is READ-ONLY for you (SELECT via the `execute_sql` MCP tool; if you lack it, stop
and report "no Supabase tool").

## Source (pull it yourself)
`select id, level, topic, title_de, title_en, content_de, content_en, key_vocabulary, questions, checks,
word_count, difficulty, order_index, estimated_reading_time from reading_lessons where level='a2.2' order by
order_index;` → save as `S/reading/source/reading-a2.2.json` (8 live rows, 288–350 words, no `checks`).
Also read: `scripts/reading-from-json.mjs` header; `src/components/ReadingChecks.jsx` (type 'rf' →
richtig/falsch; type 'choice' → `options` rendered verbatim, any length, e.g. ["a","b","c"] or
["a","b","c","d","e","x"]; an all-choice lesson is headed "Wähle …"); `src/pages/ReadingLessonPage.jsx`
(key_vocabulary, questions render too). For the SHAPE of a shipped rewrite and exam-format row, SELECT one
A2.1 rewrite and the two A2.1 exam-format rows: `select * from reading_lessons where level='a2.1' and
order_index in (1,9,10);` — copy their field shapes (key_vocabulary entries, questions {q_de,q_en,a_de,a_en}
or whatever the live rows use, checks {type,statement_de,statement_en,answer,explanation_de,options}),
none of their content.

## Goethe-Zertifikat A2 Lesen (from the Modellsatz overview table — verified 2026-09-06, do not re-research)
Teil 1 Medientext a/b/c ×5 · Teil 2 Informationstafeln/Veranstaltungsprogramme a/b/c ×5 · Teil 3 Korrespondenz
a/b/c ×5 · Teil 4 Anzeigen: Zuordnen ×5 (situations ↔ Anzeigen a–f, one situation has no fitting ad → x).
Wave 4 built Teil 1 and Teil 3 at A2.1; Wave 5 builds Teil 2 and Teil 4 at A2.2.

## Rewrites → `S/reading/rewrites-a2.2.json`
Array keyed by the LIVE id; fields exactly as the live shape: id, title_de, title_en, content_de, content_en,
key_vocabulary (10–14, "der Umzug, -¨e" style), questions (5 open Q/A, both langs), checks (5 × rf + 1 ×
choice with options ["a","b","c"] and a statement that asks a detail with the three answers inline),
word_count (exact count of content_de), estimated_reading_time (2–3).
Constraints: content_de 120–150 words; same topic and protagonist story as the live lesson (keep the title
unless it lies); grammar = A1 + all A2.1 + all twelve A2.2 topics, used ON PURPOSE so the texts rehearse the
course (weil/dass/wenn/ob clauses, Komparativ/Superlativ, Futur, reflexives, and the four new topics —
Konjunktiv II höflich, verbs with prepositions, indirect questions, Infinitiv mit zu — receptively, at most
twice each per text). BANNED: relative clauses, Passiv, Genitiv (except name-s), Präteritum of full verbs
(war/hatte/modals/es gab fine), B1 subordinators, um…zu, null-article adjectives — the level file's
reading-exposure rule allows at most TWO B1 forms per text in total and only where the text type demands
it; default to zero. Sentences ≤16 words. Checks decidable from the text alone; 2–3 of the 5 rf are falsch;
each explanation_de quotes the text; a check's target grammar never depends on a topic-9–12 form.

## Exam-format lessons → `S/reading/exam-format-a2.2.json` (2 new rows)
level "a2.2", topic "Prüfungsformat", difficulty 2, order_index 9 and 10, title_de EXACTLY:
- 9: "Lesen Teil 2: Eine Informationstafel (wie in der Prüfung)" — one Informationstafel or
  Veranstaltungsprogramm (e.g. Volkshochschule programme, Kaufhaus floors, Stadtfest schedule, Bahnhof
  service board) rendered as short lines in content_de (~100–130 words), opening with the instruction line
  "Lies die Informationstafel. Wähle die richtige Antwort: a, b oder c."; checks = 5 × choice with options
  ["a","b","c"], statement_de = a situation question plus the three answers inline ("Du möchtest einen
  Spanischkurs machen. Wohin gehst du? a) Raum 12 b) Raum 20 c) Raum 31"), answer one letter,
  explanation_de quotes the board; questions = 3 open Q/A; key_vocabulary 8–10.
- 10: "Lesen Teil 4: Anzeigen zuordnen (wie in der Prüfung)" — six short Anzeigen a–f (each 20–35 words,
  labelled "a) … b) … c) … d) … e) … f) …" inside content_de, ~150–190 words total) opening with the
  instruction line "Lies die Anzeigen a bis f. Welche Anzeige passt zu welcher Person? Für eine Person passt
  keine Anzeige: x."; checks = 5 × choice, options ["a","b","c","d","e","f","x"], statement_de = the person's
  situation ("Lena sucht ein Fahrrad für den Weg zur Arbeit, unter 100 Euro."), answer one letter, exactly one
  of the five answers is "x", no two situations share an answer, explanation_de quotes the ad; questions = 3
  open Q/A; key_vocabulary 8–10. Ads are everyday A2 (Wohnung, Job, Kurs, Fahrrad, Nachhilfe, Flohmarkt).
(The plan author links these two titles verbatim — do not change them.) Exam-format rows carry word_count
= exact count of content_de and estimated_reading_time 3.

Write `S/reading/verify.mjs` (word counts exact; sentence ≤16 words; banned-grammar regex incl. " des ",
relative-clause heuristic `\b(der|die|das|dem|den|denen)\b,`? — careful, commas before Nebensätze are legal;
`\b(wurde|wird ge|ging|kam|sagte|machte)\b`, `\b(als|obwohl|damit|bevor|nachdem|während)\b` as
conjunctions, `um … zu`; rf mix; choice answers valid and within options; Teil-4 answers distinct with exactly
one x; key/questions counts; no duplicate statements) and run it clean. Then `S/reading/notes.md` (coverage,
which topic-9–12 forms each text exposes, doubts). Report ≤15 lines.
