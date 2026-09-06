# modal-verbs-past.notes.md

## Coverage
A2.1, topic_order 11, slug `modal-verbs-past`. 9 rules (-1 intro, 1 forms table, 2 formation
steps, 3 Präsens→Präteritum + Satzklammer table, 4 meanings table, 5 war/hatte + no Perfekt,
6 dialogue "Absage am Telefon", 7 common_mistakes with 6 pairs, 99 summary), 10 examples,
26 exercises (stage 4: 13 = 8 fill_blank + 2 error_correction + 3 MC; stage 5: 13 = 11
sentence_building + 1 error_correction + 1 MC). 22 typed / 4 MC. MC keys sit at option
index 2, 0, 1, 3 — no "always pick the first" score.

All six modals appear in every person: the rule-1 table is complete (6 × 6 = 36 cells,
each recomputed), and konnte/musste/wollte/durfte/sollte/mochte are each drilled at least
twice outside the table. Persons covered by the drills: ich, du, er/sie, wir, ihr, Sie.
war/hatte are drilled as companions (stage4 #09, #10) and framed as the SMS pair.
möchte → wollte is taught in rule 1 key_insight, rule 3's last table row, rule 4's last row
and produced in stage5 #08. mögen's g→ch is taught in rule 2 step 2/3 and drilled three
times (s4#06, s4#13, s5#06).

Exam anchoring: topic description names Schreiben Teil 1 and Sprechen Teil 2; rule -1
why_it_matters names Schreiben Teil 1, Sprechen Teil 2, Hören Teil 1; rule 5's formal_note
gives the SMS pattern; rule 6 (dialogue) is a Hören-Teil-1-shaped phone message with the
exam named in grammar_focus_en + key_insight; s5#13 produces the two-sentence SMS
apology; the summary's last point lists all three tasks. Example 8 is category "exam".

Builds on live topics without repeating them: dative pronoun `ihr` and `mit dem Auto` /
`zum Arzt` (prepositions-dative), `im Museum` / `ins Kino` (two-way-prepositions),
`aufstehen`/`anrufen`/`mitkommen` (separable-verbs), `gearbeitet`/`gemusst` only as marked
wrong forms (perfect-tense-haben), and the modal Satzklammer of A1.2 modal-verbs-intro,
explicitly extended rather than re-taught ("Nur das Modalverb ändert sich").

## Deliberate exclusions
- No als-Sätze anywhere ("Als Kind konnte ich …" is banned) — `Früher` carries that job in
  three items, plus `gestern`, `gestern Abend`, `am Samstag/Sonntag/Montag`, `um acht Uhr`.
- No Präteritum of any full verb: the only non-modal Präteritum forms in the file are
  war/waren and hatte/hatten (both A1). Scanned programmatically for ging/kam/sagte/… — zero.
- No Perfekt of a modal ("Ich habe arbeiten müssen", double infinitive) is taught. Rule 5
  says everyday German uses the Präteritum here and that the Perfekt form comes later; it
  never claims that form does not exist. The two error_correction items attack the shapes
  learners actually produce ("habe gemusst arbeiten"), which are wrong in any register.
- No attributive adjective endings at all (topic 9 ships in this same wave, so its material
  is not assumed), no Genitiv (rule 1's description says "von den sechs Modalverben"), no
  Nebensätze, no Komparativ/Superlativ, no reflexives, no Futur, no zu-infinitive.
- No "letzte Woche"/"nächste Woche"/"den ganzen Tag" — those are null-article adjective
  endings; time is expressed with am + Tag, um + Uhrzeit, gestern, früher.
- Only one example sentence is reused anywhere as an answer key (none is: every stage-5 key
  and every stage-4 answer differs from all ten examples in wording or person), so stage 4
  and 5 are not an answer key to the example page.
- Both `sollte` uses are past-time ("was supposed to"); the advice reading ("you should")
  is deliberately never modelled, because that reading is Konjunktiv II and out of level.

## Judgement calls the reviewer should check
1. **`könnte` / `müsstest` appear as marked wrong forms** (rule 7 mistake 1, its
   explanation, s4#07 distractor, s4#08 distractor + why_correct). Konjunktiv II is banned
   in production; these are never produced, only named as the umlaut trap that is the single
   most common error with this topic. If the reviewer wants them gone, mistake 1 can be
   dropped and the two distractors replaced with "konntete"/"musstete" — the file stays
   otherwise unchanged.
2. **`icon` is an emoji ("⏳")**, per the brief's hard shape. Every live topic row carries
   "book", and no renderer reads the column. Flagging the divergence rather than silently
   picking one side.
3. **`topic.difficulty` is present ("intermediate")** because the brief lists it, but
   `grammar_topics` has no such column and the generator drops it — it will not reach the
   DB or the cache. Harmless, and removable.
4. **related_slugs is `["perfect-tense-sein", "imperative-mood", "temporal-prepositions"]`** —
   the two live slugs first, then this wave's topic 12, which lands in the same migration.
   Until it does, the related block still renders two live topics (a non-empty
   `related_slugs` bypasses the static `RELATED_TOPICS` fallback, so the live pair matters).
   Both prerequisites (`modal-verbs-intro` A1.2, `perfect-tense-haben` A2.1) are live too.
5. **Position 1 is treated as free**: every sentence_building item whose cue does not fix
   position 1 lists the fronted variant in acceptable_answers (s5 #01, #02, #05, #06, #13)
   plus each variant with and without its final punctuation, and no why_correct claims the
   subject must open the sentence. Items with a fixed opener (questions, transformations)
   list only the punctuation variants.
6. **`Ich musste zum Arzt.` (modal with no infinitive)** is taught (rule 3 key_insight,
   example 9, summary) but never *required* as an answer — every key spells the infinitive
   out, so no learner is marked wrong for adding gehen.
7. Two error_correction items sit in stage 4 (recognition/repair) and one in stage 5; the
   type is not used in the wave-3 reference files, but the Astro ExercisePlayer routes every
   non-multiple_choice type to the free-text input, so it renders and grades like fill_blank.

## Self-check performed
`node scripts/check-grammar-json.mjs` clean; plus a local script asserting: every German
sentence ≤ 12 words (level cap is 14), no Nebensatz/Genitiv/Passiv/Futur/Komparativ/
reflexive/um-zu/full-verb-Präteritum pattern in any German field, grammar_highlight is a
substring of sentence_de, word_breakdown covers exactly the tokens of sentence_de, every
typed item's correct_answer is inside acceptable_answers with no duplicates, MC options
unique with the key rotated across all four positions, page title 45 chars
("German Modal Verbs in the Past — A2.1 Grammar"), and no English function words in a
`_de` field.


## Round 2 changes (against `review-modal-verbs-past-1.md`)

Every finding is addressed; validator still clean.

- **B1 — s5#08 key rejected a legitimate answer.** The English cue now reads "I would like to
  have an appointment. → I wanted to have an appointment.", and `acceptable_answers` gained
  `"Ich wollte einen Termin."` / `"Ich wollte einen Termin"` alongside the `haben` forms.
  `explanation_en` and `why_correct_en` say the short form counts too.
- **B2 — false gloss "would have liked".** rules[4] row 7 now reads
  `["wollte (für möchte)", "wanted (to have)", "Ich wollte einen Termin haben."]`, and the
  whole seam uses ONE German pair: rule 3 row 6 is now
  `Ich möchte einen Termin haben. → Ich wollte einen Termin haben.` (English column
  "I would like to have an appointment. / I wanted to have an appointment."), identical to
  rule 4 row 7's example and to s5#08's stem and key. That deliberate three-way identity is
  why the overlap check below still lists s5#08 — B2 required it.
- **m1 — nine `X wird Y` instances.** All rewritten as `Aus X wird Y` (s5 #01, #02, #04, #05,
  #06, #07, #09, #10 `explanation_de`, s5#10 `why_correct_de`) or as the arrow/`Bei mögen wird
  g zu ch` form. Machine-checked: every remaining " wird " is preceded by `Aus` or is
  `Bei mögen wird g zu ch`. One English field that had picked up the German opener
  (s5#06 `explanation_en`) now starts `mögen → mochte.`
- **m2 — mögen drilled in one frame.** `mochte` now has four frames: `Früher + kein + Getränk`
  (example 5, rule 4 row 6, rule 7 mistake 6 — now Tee, so no exercise mirrors it),
  affirmative wir + object (`Wir mochten den Film sehr.`, s4#06), a question in ihr
  (`Mochtet ihr die Wohnung?`, s4#13), and affirmative ich + non-food object
  (`Ich mochte das Buch sehr.`, s5#06). mögen + infinitive is still deliberately absent —
  it is marked German at A2 ("Ich mochte nicht warten"), and the topic teaches mögen as the
  one modal that takes a plain object.
- **m3 — seven items reproducing rule strings.** Replaced: s4#01 (`Ich konnte dich gestern
  nicht anrufen.`, no longer the intro's `preview_example_de`), s4#07 (`das Fenster … öffnen`),
  s4#11 (`Sie musste gestern eingekauft.` → `einkaufen`, no longer rule 7 mistake 2),
  s4#12 (`Er musste kaufen eine Fahrkarte.` → `Er musste eine Fahrkarte kaufen.`, no longer
  mistake 3), s4#13 (new mögen question), s5#06 (new sentence, no longer a rule-4 table cell),
  s5#11 (`Ihr habt gestern gewollt telefonieren.` → `Ihr wolltet gestern telefonieren.`, no
  longer mistake 5). rule 4 row 1's example moved to `Ich konnte gestern nicht arbeiten.` and
  s5#13's SMS is now `Ich war gestern krank. Ich konnte nicht zum Kurs kommen.` so no stage-5
  answer is a printed string. **Overlap check re-run for real** (rule/example sentences vs
  every exercise stem sentence, key, acceptable answer and MC option): 3 hits remain —
  s5#08 twice (mandated by B2) and s4#09, a stage-4 recognition item whose *given* second
  sentence is the SMS model from rule 5. No stage-5 key appears anywhere in the rules.
- **m4** — rule 3 row 3 English is now the full pair "Are you allowed to come along? / Were you
  allowed to come along?"
- **m5** — rule 5 `key_insight` no longer bans `Ich habe gemusst`: de "Im Alltag sagst du
  einfach: Ich musste.", en "In everyday German you simply say Ich musste; the Perfekt of a
  modal waits until B1."
- **m6** — `lange` is glossed "a long time" in example 7's `sentence_en` and in s5#12's
  `question_en`; "late" is gone.
- **m7** — example 10's breakdown: `"konnten": "could, were able to (können, Präteritum, wir)"`.
- **m8** — `topic.description_de` now opens "Lerne das Präteritum bei den sechs Modalverben."
- **m9** — see judgement call 4 above: existing slugs first, topic 12 last, kept because it
  ships in the same migration.
- **m10** — dialogue exchange 6 now opens "Alles gut." instead of a second "Kein Problem."
- **m11** — policy made explicit per item: fronted/topicalised variants added where natural
  (s5#07 `Das Zimmer konnten wir nicht finden.`, s5#06 `Das Buch mochte ich sehr.`, s4#11
  `Gestern musste sie einkaufen.`, s5#11 `Gestern wolltet ihr telefonieren.`); s4#12 is a
  repair task whose opener the prompt fixes, and its `why_correct_en/de` now say so
  ("Der Satzanfang bleibt gleich. Nur der Infinitiv geht ans Ende.").
- **m12** — icon "⏳" and `topic.difficulty` left as they are (brief-mandated / silently
  dropped by the generator); flagged again here for the integration step to decide once.
- Unchanged by design: the four `könnte` / two `müsstest` occurrences, which the review
  audited (§4) and cleared as marked-wrong forms only.
- New vocabulary introduced by the round-2 items, all inside the level: `anrufen`, `dich`
  (Akkusativpronomen, topic 10 — this is topic 11), `öffnen`, `das Fenster`, `einkaufen`,
  `die Fahrkarte`, `der Film`, `das Buch`, `telefonieren`, `zum Kurs`.
