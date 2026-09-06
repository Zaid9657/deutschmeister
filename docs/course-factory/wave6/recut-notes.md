# Wave 6 PR A — recut notes

133 patches total: grammar_rules 17, grammar_examples 74, grammar_exercises 42.
0 rows added/removed; all ids/order_index untouched (verifier pins both the count and the
id:order_index sequence per file per table).

## subordinating-conjunctions (11 rules / 15 examples / 25 exercises)
- Rule oi0: trimmed the EN conjunction list to dass/weil/wenn/ob.
- Rule oi1: dropped the 6 banned `conjunctions[]` entries (obwohl/während/bevor/nachdem/bis/
  seit-seitdem), kept dass/weil/wenn/ob.
- Rule oi4: table row trimmed to the 4 in-level conjunctions.
- Rule oi5 "wenn vs. ob vs. als" → retitled "wenn vs. ob vs. dass"; als row/memory_trick/
  key_insight replaced with a dass row (statements/facts).
- Rule oi8: dialogue's obwohl-exchange replaced with a dass-clause; grammar_focus_en recap
  updated to match.
- Rule oi9: summary top_rules[0] trimmed to dass/weil/wenn/ob.
- Examples oi5-10 and oi15 (all obwohl/während/bevor/nachdem/bis/seit/als) rewritten as new
  dass/weil/wenn/ob sentences (weil+Perfekt, wenn+separable, dass+separable, ob+Perfekt,
  weil+modal, wenn+Perfekt, weil-first+war+Perfekt) — sentence_de/en, grammar_highlight,
  explanation_de/en and word_breakdown all rewritten together per row.
- Exercise oi8: als-keyed item rewritten as a wenn item (dropped "Als" from options entirely,
  not just as the key — the ban list treats any occurrence as a blocking defect).
- Exercise oi11: "wenn vs. als" MC → "wenn vs. ob" (indirect yes/no questions) contrast.
- Exercise oi12 (not in the recon list, found sweeping): explanation_de "am Ende des
  Nebensatzes" → "im Nebensatz am Ende" (Genitiv).

## subordinate-word-order (9 rules / 15 examples / 25 exercises)
- Rule oi0: trigger list trimmed to dass/weil/wenn/ob (DE + EN bullets).
- Rule oi2 "Perfekt im Nebensatz": the "Triple Stack" section taught the Ersatzinfinitiv
  (modal+Perfekt double infinitive, B1) via "…weil ich nicht habe kommen können" — replaced
  the whole section with modal Präteritum ("…weil ich nicht kommen konnte"), retitled
  "Modal Verbs in the Past". This is the "oi 2" item the brief names for this topic (it
  is not in subordinating-conjunctions, where no such string exists — see doubts below).
- Rule oi4: table trimmed from 13 rows to 4 (dass/weil/wenn/ob).
- Rule oi6: dialogue — "hatte gehofft" (Plusquamperfekt) → "hoffe" (present); "nachdem er
  gearbeitet hat" → "wenn er mit der Arbeit fertig ist"; dropped the obwohl-tail clause from
  the last line, keeping only the dass-clause.
- Rule oi7: golden_rule_de/en dropped "als"; "am Ende des Satzes" (Genitiv) → "im Satz am
  Ende".
- Examples oi4,10,11,12,13 (obwohl/als/bevor/nachdem+Plusquamperfekt/während) rewritten as
  wenn/dass/weil sentences (wenn, dass+separable, weil+Perfekt, wenn+Perfekt exactly as the
  brief suggested, dass+modal).
- Exercises oi7 (obwohl→wenn, all four options rebuilt as non-Präteritum forms), oi8
  (distractor "kam"→"komme"), oi9 (als+spielte item rewritten as wenn+haben, options rebuilt
  without any Konjunktiv II form since topic 9 hasn't been taught yet), oi14 (bevor→wenn,
  distractor "ging"→"geht").

## superlative (9 rules / 12 examples / 18 exercises)
- Example oi7 only: "der kälteste Tag des Jahres" (Genitiv) → "im Jahr"; word_breakdown key
  "des Jahres" → "im Jahr". Rules and all other examples/exercises confirmed clean by sweep.

## Deliberate non-changes / false positives ruled out during the sweep
- "ob leitet Ja/Nein-Fragen als Nebensätze ein" and "bleibt als Infinitiv zusammen" (subordinate-
  word-order) — "als" here means "as", not the temporal subordinator; left untouched. (Round 1
  review: REFUTED as a defect, confirmed correct.)
- Several exercises/rules flagged by a first crude sweep as "relative-clause" or ">16 words"
  were false positives from a blunt regex (list punctuation, multi-sentence fields where every
  individual sentence is short) — confirmed by hand, not patched.
- Error-correction exercise swo/oi21 ("…nicht wird regnen") is a deliberately wrong sentence
  the learner must fix (future tense, correct order is "regnen wird") — not Passiv, left as-is.
  (Round 1 review: REFUTED as a defect, confirmed correct.)
- Rule oi6 (subordinate-word-order dialogue) line[3] softens "nachdem er gearbeitet hat" to
  "wenn er mit der Arbeit fertig ist" — flagged in round 1 as a meaning shift; round 1 review:
  REFUTED as a defect (natural German, sequence still coherent in context). No change.

## Round 1 doubts — resolved
1. ~~"intro oi -1 EN 'obwohl'" does not exist in subordinating-conjunctions~~ — CONFIRMED by
   round 1 review (B6): it is in **subordinate-word-order**'s intro (oi=-1)
   `content.why_it_matters_en`, not subordinating-conjunctions. Fixed in round 2 (see below).
2. The mid-task "coordinator" message adding `comparative`/`infinitive-with-zu-intro`/
   `future-tense` patches — round 1 review confirmed all four are sound and in scope; kept as-is,
   `verify.mjs` now also resolves and sweeps their ids via the content cache (round 2, see below).

## Round 2 changes (response to S/reviews/recut-review-1.md — FAIL, 12 blocking + 9 minor)

**patches.json**: 137 → 146 (9 new patches; several existing patches' `new` values corrected).
- B3/B4 sc oi8 exercise: options → `["Wenn","Ob","Dass","Aber"]` (old options let "Weil" fit the
  stem too — ambiguous key); explanation_de rewritten to drop a Passiv ("wenn wird … verwendet"
  → "wenn steht für …").
- B5 swo oi4 example: `grammar_highlight` "wenn es regnet" → "Wenn es regnet" (case-sensitive
  substring of `sentence_de`); `word_breakdown` key "wenn" → "Wenn" for the same reason.
- B6 (new patch) swo intro (oi=-1) `content.why_it_matters_en`: dropped the dangling "obwohl"
  reference — this is where the brief's "intro oi -1" item actually lives (see doubt #1 above).
- B7 (new patch) swo rule oi3 `content.mistakes[4].explanation_de`: Genitiv "ans Ende des
  wenn-Satzes" → "im wenn-Satz ans Ende".
- B8 (new patch) swo exercise oi3 `why_correct_de`: same Genitiv class → "Geht im wenn-Satz ans
  Ende."
- B9 (new patch) swo exercise oi13 `options[3]`: "wurde" → "sind". My round-1 notes called this a
  non-issue ("no participle follows it") — **wrong**: the participle precedes the blank
  (`..., dass er nach Berlin gefahren ___.`), so "wurde" completes a Passiv Präteritum. Corrected.
- B10 (new patch) swo exercise oi19 `why_correct_de`: "das Geschäft nimmt öffnet" (an English
  calque, not German) → "Zu 'das Geschäft' passt 'öffnet'."
- B11 (new patch) sc exercise oi12 `options[0]`: "Sie werden verkürzt" (Passiv, no `ge-`
  participle, missed by the round-1 regex) → "Sie stehen in der Mitte".
- B12 (new patches ×2) sc exercises oi3/oi4 `why_correct_de`: two more Passiv-without-`ge-`
  instances ("wenn/ob wird … verwendet") → active phrasing ("wenn/ob steht für …").
- M1/M2 swo rule oi7 `content`: `golden_rule_de` reworded "im Satz am Ende" → "am Satzende"
  (less clunky); `memory_trick_de` fixed (wrong gender "der Konjunktion" → "die Konjunktion"; the
  English word "verb" → "Verb").
- M3 sc example oi15 `word_breakdown`: key "bin ich geblieben" was not a contiguous substring of
  the sentence — split into "bin"/"zu Hause"/"geblieben".
- M4 sc exercise oi11 `explanation_de`: tautological gloss → a real definition (also removes a
  `wird…verwendet` sibling pattern).
- M5 superlative example oi7 `word_breakdown`: "im Jahr" gloss "of the year" → "in the year".
- M6 (new patch) superlative rule oi0 `content.hook_de`: capitalised the nominalised superlatives
  ("der größte" → "der Größte", etc.) — pre-existing, outside this PR's B1 scope, fixed while
  touching the row anyway.
- M7 sc rule oi9 `content.one_sentence_summary_en`: dropped the trailing ", etc." now that the
  conjunction list is closed to four.
- M9 sc example oi9 and swo example oi11: reworded to remove the two duplicate sentence frames
  the review flagged ("Ich bleibe zu Hause, weil …" reused from oi2; "Ich bin müde, weil ich
  lange … habe" reused across files).

**verify.mjs**:
- B1: now loads `/home/user/deutschmeister/grammar-content-cache.json` read-only as a fallback
  index — a patch id is resolved against the 3 topic source files first, and only falls back to
  the cache if not found there (so a cache row can never shadow a real topic row). The 4
  orchestrator patches are validated and swept exactly like the rest.
- B2: the options-integrity check now gates on `Array.isArray(ex.options)`, not
  `exercise_type === 'multiple_choice'` — this catches every options-bearing exercise, including
  the 23 `fill_blank` ones (which is where every options rewrite in this PR actually lives).
  Re-ran the reviewer's mutations C (truncate to 3 options) and D (drop the key from options) —
  both are now caught (`exercise ... does not have exactly 4 options` / `... options do not
  contain correct_answer`). Also added: `acceptable_answers` must include `correct_answer` and
  must not contain any distractor; `grammar_highlight` must be a case-sensitive substring of
  `sentence_de`; every `word_breakdown` key must be a substring of `sentence_de` (examples table,
  topic files and touched cache rows alike).
- M8: added a second, wider sweep over **every** row of the three topic files post-patch
  (`ALL/...` context prefix), keeping the original patched-rows-only sweep as an explicitly
  labelled strict subset (`TOUCHED/...`).
- Added a `passiv-no-ge` pattern (`wird/wurde/wurden/werden` + `ver-/be-/er-/ent-/zer-` + a
  participle ending in "t") to the ban battery, since `passiv-ge` only ever matched `ge-`
  participles. Restricted to endings in "t" specifically so it cannot fire on an ordinary
  `werden + Infinitiv` future tense (all German infinitives end in `-en`/`-n`, never bare `-t`).
- Refined two heuristics that produced false positives once the sweep widened to all rows:
  `als-conjunction` is now a small function that allows `", als"` right after a comparative
  (`größer, als ich dachte` — a2's allowed comparative "than"), and `relative-clause` is now a
  function that whitelists enumerations (`", die X und die Y."`) and nominalised-adjective list
  items (`"der Größte, der Schnellste, der Beste!"` — capitalised single-word "clause", no finite
  verb). The word-count cap now also splits on `:` (a colon commonly introduces a self-contained
  quoted example) and ignores bare punctuation tokens (`/` in sentence-building scramble prompts)
  when counting words — this cleared the 4 pre-existing `>16 words` false positives the review
  listed as non-issues (sc rule oi6, swo exercises oi22/oi23/oi25) without weakening the cap for
  real prose.

**Result**: `node S/recut/verify.mjs` → `0 FAIL (146 patches, 42 rows swept [touched], 139 rows
swept [all three topics])`, exit 0.

## Round 3 changes (response to S/reviews/recut-review-2.md — FAIL, 2 blocking + 3 minor)

All 21 round-1 findings independently re-confirmed resolved by round 2's reviewer. This round
fixes the 2 blocking + 3 minor deltas found on top of that.

**patches.json**: 146 → 150 (4 new patches; 1 corrected `new` value).
- V2 (new patch) sc exercise oi3 `options`: `["Dass","Ob","Weil","Wenn"]` → `["Dass","Ob","Aber",
  "Wenn"]` — "Weil es regnet, bleibe ich zu Hause." was also fully correct, the same ambiguous-key
  defect just fixed at oi8 (B3); swapped for Aber, matching that fix.
- V3 (corrected) swo exercise oi13 `options`: `["ist","hat","war","sind"]` → `["ist","hat","seid",
  "sind"]` — "war" completes `..., dass er nach Berlin gefahren war.`, a Plusquamperfekt, by the
  exact reasoning that condemned "wurde" at B9; missed it the first time because "war" alone is a
  level-legal token. Replaced with "seid" (still a clean person/number-mismatch distractor).
- V4 (new patches ×2) sc exercises oi3/oi4 `explanation_de`: the tautological-gloss class fixed at
  M4 (oi11) was still present two rows away (`wenn = wenn für Bedingungen.` / `ob = ob (für
  indirekte Ja/Nein-Fragen).`) → real definitions.
- V5 (new patch) swo exercise oi19 `why_correct_en`: fixed the English calque ("das Geschäft takes
  öffnet") that survived after its German twin was rewritten at B10.

**verify.mjs**: replaced the two adjacency-only Passiv patterns (`\s+` between the auxiliary and
the participle) with one pattern that allows an intervening `[^.?!]{0,40}` span — real Passiv is
almost never adjacent to its auxiliary ("wird **jeden Tag** geputzt", "wenn wird **für
Bedingungen** verwendet"), which is exactly why the round-2 patterns missed every realistic case.
Matches a ge- participle, a ver-/be-/er-/ent-/zer-/über-/unter-/um-/wieder- participle ending in
"t", or an -iert participle; still anchored on non-"-en" endings for non-ge- participles so it
cannot fire on a bare werden+Infinitiv future tense. Re-injected all four strings the round-2
review used to disprove the old patterns (`wenn wird für Bedingungen verwendet.`, `Sie werden
verkürzt und stehen in der Mitte.`, `Das Formular wird von uns bearbeitet.`, `Das Zimmer wird
jeden Tag geputzt.`) one at a time — each now FAILs. Re-checked the new pattern against every
string in all three source files and against the mutation-E/F/J/K sentences from round 2's report
(`Als ich in Berlin war, …`, a real relative clause, the comparative-als sentence, the nominalised
superlative list) — no new false positives or false negatives introduced.

**Result**: `node S/recut/verify.mjs` → `0 FAIL (150 patches, 42 rows swept [touched], 139 rows
swept [all three topics])`, exit 0.

## Open doubts for the next reviewer
None outstanding.
