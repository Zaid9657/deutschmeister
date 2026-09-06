# Wave 6 PR A — Wortliste re-level author brief (A2.2 "Prepositions" and "Animals")

Read S/common-header.md and S/level-a2.2.md first. The live A2.2 words table carries two categories
whose rows are largely above the Goethe-Zertifikat A2 Wortliste: "Prepositions" (25 rows, mostly B1/B2
Genitiv prepositions) and "Animals" (25 rows, mostly not on the A2 list). Nothing is deleted; rows are
RE-LEVELLED to where they belong so the A2.2 SRS stops serving B1 vocabulary as A2.

## Source: S/vocab/source/words-a2.2-prep-animals.json (50 rows: id, german, english, level, category, example_sentence)

## Rules
- Decide per row against the Goethe A2 Wortliste (Erwachsene) from your knowledge of it; when in doubt,
  the more basic word stays at a2.2 and the rarer one moves. Guidance: on the A2 list are e.g. Hund,
  Katze, Pferd, Kuh, Schwein, Vogel, Fisch, Maus, Tier; "außer", "gegenüber", "seit", "bis (zu)",
  "entlang"(A2? — decide and justify), "laut"? (B1), "trotz/wegen/während" as prepositions are B1,
  "statt/anstatt" B1, the -halb/-seits/inmitten/infolge/aufgrund/anhand/mittels/mithilfe/zufolge
  group is B1–B2.
- Allowed new levels: keep "a2.2", or move to "b1.1" (Genitiv prepositions are taught in the B1.1
  topic genitive-case), "b1.2" or "b2.1" (only for clearly B2 items like mittels, zufolge, diesseits,
  jenseits, unweit, inmitten — your call, justify). Never a1.x/a2.1 (do not push words DOWN).
- The example sentence stays as is (Wave 5 already rewrote them without Genitiv); if a sentence would
  be wrong at the new level, say so in notes.md — do not edit it.
- Output S/vocab/relevel.json: array of { "id", "german", "old_level": "a2.2", "new_level", "category",
  "reason": "<≤12 words>" } for EVERY one of the 50 rows (new_level == old_level for the ones that stay).
- Write S/vocab/verify.mjs: loads source + relevel.json; every source id appears exactly once; new_level
  ∈ {a2.2,b1.1,b1.2,b2.1}; prints counts per new_level and the list of movers; exit non-zero on any
  violation. Run it. Then S/vocab/notes.md with the per-row reasoning for the borderline ones.
