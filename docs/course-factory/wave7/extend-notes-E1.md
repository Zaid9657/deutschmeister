# Author E1 notes — Wave 7 PR A2 (B1.1 EXTEND)

Files: `S/extend/typed-b1.1/{genitive-case,genitive-prepositions,relative-clauses-nom-acc,relative-clauses-dat-gen}.json`

This is round 3. The four per-topic sections below describe the **current** content (after
rounds 1–3); the changelog sections further down record what each round actually changed and
why, for handoff traceability. Read the per-topic sections for what's in the files now.

## genitive-case
+10 typed exercises, oi 16-25 (stage4 fill_blank 16-19 guided; stage5 20-25 free:
sentence_building×3, error_correction×3). No depth patch (per brief). Coverage: possessive
articles in genitive (meines/seiner/unserer/ihres), "wessen", adjective ending in genitive
(des kleinen Hotels), neuter -s nouns (Büro, Gewitter) — all content already licensed by the
topic's own "already live" status. 1 rule_patch: rule `19c7f484…` (explanation_core, field
`content`) fixes two defects in the same field it touches — a lowercase noun inside an English
gloss ("der Anfang des films" → "des Films") and, one line above it in the same object, an
uncapitalised German noun and a lowercase sentence-initial word ("Besitz + besitzer... das
Auto" → "Besitz + Besitzer... : das Auto"). Both factual/orthographic.

## genitive-prepositions
Depth patch: +3 rules oi 6/7/8 — (6) dialogue "Beim Vermieter" (Herr Berger calls about the
heating; Frau Klein asks what's wrong rather than confessing her own failure; wegen×2, trotz×2,
während, innerhalb — all four target prepositions used, register kept inside the B1 Wortliste);
(7) table: possessive + plural after these prepositions (wegen meines Termins / der hohen
Kosten, etc.); (8) common_mistakes, 4 distinct pairs (wegen+Dativ ✗ referencing the live "Spoken
German" rule by name rather than number, statt+Dativ ✗, trotz+Dativ-Plural ✗, während+Dativ ✗
with a one-line note that während gets a second grammatical role later in the course, worded
without the word "Konnektor" so it can't misread as teaching that role now). +4 examples oi
9-12, none duplicating any live or cross-topic example. +10 typed exercises oi 9-18 (stage4
fill_blank 9-12, spread across masculine/neuter/feminine-definite/feminine-indefinite; stage5
13-18: sentence_building×3, error_correction×3, difficulty ramping 2/3/2/3/2/3). 1 rule_patch:
rule `64fc4a83…` title_de calque "Genitiv-Formen Wiederholung" → "Wiederholung: die
Genitivformen" (named in the brief).

## relative-clauses-nom-acc
+10 typed exercises, oi 16-25 (same 4+6 split as genitive-case; every item's
`related_rule_title` resolves to an existing rule). No depth patch. 2 rule_patches, both
`content` field, both factual/orthographic: rule `49606078…` (explanation_core) — was a
lowercase noun ("mehr information") AND, discovered on re-review, a Passiv sentence ("Er wird
durch ein Relativpronomen eingeleitet") in the same field; now "Ein Relativsatz gibt mehr
Informationen über ein Nomen. Ein Relativpronomen leitet ihn ein." (active, no Passiv anywhere
in the file); rule `7a8f87a5…` (explanation_exceptions) — a wrongly capitalised pronoun
mid-sentence inside a German example embedded in an English field, "den Ich gesehen habe" →
"den ich gesehen habe".

## relative-clauses-dat-gen
Depth patch: +3 rules oi 6/7/8 — (6) table: preposition + relative pronoun, 5 rows (mit dem,
bei der, für die, über den, von denen) beyond the existing 4-row table; (7) dialogue "Bei der
Wohnungsbesichtigung" (dessen, deren, denen, wo, an die — the one Präteritum form is "gesprochen
haben" in Perfekt now, not Präteritum, so nothing to flag there); (8) common_mistakes, title
"Common Mistakes: Preposition, dessen/deren, Comma", 4 pairs (preposition-stranding ✗ — "Der
Chef, ich arbeite für" — a realistic English-transfer error, dessen/deren agreement ×2, missing
comma with preposition+pronoun); a `key_insight` on the same rule notes that "wo" is fine for a
simple place (matching the topic's own example oi 12 and dialogue line 5, both of which use
"wo" as correct) and that "bei der" etc. is the more common written form with a fixed
preposition — so the rule no longer contradicts the rest of the file. +4 examples oi 9-12. +10
typed exercises oi 9-18 (stage4 fill_blank 9-12, none of whose cues name the pronoun they're
testing; stage5 13-18: sentence_building×3 — none of the three brackets contain the relative
pronoun itself, and each cue states the case/gender being tested without naming the specific
answer form — plus error_correction×3). 1 rule_patch: rule `382d0b22…` `content` field —
description_de was tautological ("dessen = dessen (m/n). deren = deren (f/pl)."); now "dessen
ersetzt sein (m/n). deren ersetzt ihr (f/pl)." (accurate and contrastive, matches the table's own
sein→dessen / ihr→deren rows).

## Open doubts for the reviewer
- Two EXISTING (unrelated to us) exercises have swapped question_de/question_en fields
  (English text sits in question_de, German in question_en): genitive-prepositions stage4
  oi 7 ("Which preposition means \"because of\"?") and relative-clauses-dat-gen stage4 oi 7
  ("Which relative pronoun means \"whose\"…"). `rule_patches` only supports patching
  `grammar_rules` rows, not `grammar_exercises`, so these can't be fixed from an EXTEND
  file. Per the orchestrator these are being patched out of band (`S/recut/patches.json`,
  confirmed byte-exact against the dumps by the round-2 review) — not part of this
  deliverable, left untouched here.
- I limited rule_patches to clear, narrow defects (1-2 per topic) rather than a full sweep,
  per the brief's "small this wave." I did not patch stylistic-only English gloss quirks
  (e.g. "special form!" as an English table cell) since those are bilingual-by-design per
  the brief.

## Round 2 changes (response to `S/reviews/extend-E1-review-1.md`, FAIL: 9 blocking, 12 minor)

Same four files, same order_index ranges, still 10 typed exercises per topic. Every finding,
in order (superseded in a few spots by round 3 below — see there for the final wording):

**Blocking**
1. relative-clauses-nom-acc `rule_patches[0].new` — round 1 fixed the lowercase noun but
   shipped Passiv ("wird ... eingeleitet") in rule prose. Rewritten active per the
   orchestrator's exact wording: "Ein Relativsatz gibt mehr Informationen über ein Nomen. Ein
   Relativpronomen leitet ihn ein."
2. relative-clauses-nom-acc exercise oi 20 — "laute Musik" was a null-article singular
   adjective-ending target (banned). Recast entirely: "Der Nachbar, der jeden Abend Gitarre
   spielt, ist nervig." — no adjective+null-article pattern at all.
3/4. genitive-prepositions exercises oi 11/12 — English cues didn't match the graded key
   (oi11 "his illness" vs key `der`; oi12 "an answer" vs key `der`). Fixed by making the
   cues and keys agree: oi11 cue now says "the illness" (key stays `der`); oi12 now genuinely
   tests the indefinite article (cue "an answer" → key `einer`). Folded into the finding-10
   redesign below rather than patched in place, since finding 10 required varying these same
   four items anyway.
5. genitive-case exercise oi 24 — target was byte-identical to the topic's own live example
   oi15. Replaced: "Der Name des klein Hotels steht am Eingang." → "...des kleinen Hotels…",
   same phenomenon (genitive adjective ending), different noun, no n-Deklination.
6. relative-clauses-dat-gen `rules[2]` (common_mistakes) mistake #1 — "Das ist die Firma, wo
   ich arbeite." is correct German (the level licenses "wo" for places in this topic, and the
   file's own example oi12 + dialogue line 5 teach it as correct), so labelling it wrong
   contradicted the rest of the file. Replaced with a genuine error (preposition stranded at
   the clause end): wrong "Der Chef, ich arbeite für, ist streng." / correct "Der Chef, für
   den ich arbeite, ist streng." The wo-vs-"bei der" register nuance moved to a
   `key_insight_de/en` note on the same rule instead of a mislabelled mistake pair.
7. genitive-prepositions `rules[2]` mistakes #1/#2 — "der Auto" was a gender error mislabelled
   by a Dativ explanation, and #2 was a near-duplicate of #1 (same noun, same correction).
   Fixed #1 to an actual dative form ("Statt dem Auto..." → correct explanation now matches);
   replaced #2 with a distinct phenomenon (plural genitive after trotz: "Trotz den Problemen"
   → "Trotz der Probleme").
8. genitive-case `rule_patches[0].new` — the field I opened to fix "des films" also shipped
   a pre-existing, untouched defect one line above ("besitzer" uncapitalised, a lowercase
   sentence-initial "das"). Since the patch replaces the whole `content` object, both are now
   fixed: "Im Deutschen: Besitz + Besitzer (im Genitiv): das Auto des Mannes."
9. genitive-prepositions example oi 10 was byte-identical to relative-clauses-dat-gen's own
   new example oi 10 AND off-topic in genitive-prepositions (no genitive preposition in it).
   Replaced the genitive-prepositions copy with "Aufgrund der hohen Miete suchen wir eine
   kleinere Wohnung." (aufgrund, on the topic's allowed list, previously unused); left the
   dat-gen copy untouched since it's on-topic there.

**Minor**
10. genitive-prepositions oi 9-12 were four near-identical "<Präp> ___ <fem. Nomen>" items all
    keyed `der`. Redesigned for gender/number/definiteness spread: masc. def. (des Umzugs),
    neut. def. (des Jahres, later replaced in round 3 — see below), fem. def. (der Krankheit —
    also resolves 3), fem. indef. (einer Antwort — also resolves 4).
11. Added the `-es`/`-s` genitive variant to oi 18's `acceptable_answers` (des Staus / des
    Staues); genitive-case oi 24's replacement noun (Hotel) has only one genitive form, so no
    variant was needed there.
12. Dropped every "Base form: X" cue that literally named the graded relative pronoun (no
    base-vs-inflected distinction exists for der/die/das/dessen/deren the way it does for
    possessives) across both relative-clause topics' guided items; dropped the relative
    pronoun token itself from the three sentence_building brackets that had it
    (nom-acc oi20, dat-gen oi13/15/17), replacing it with "(Relativpronomen ergänzen)" in
    question_en. (One instance, dat-gen oi 15, still named "deren" in the surrounding cue text
    — closed in round 3, see below.)
13. nom-acc oi 22 — bracket order didn't mirror the target ("sehr" placement) and the sentence
    near-duplicated live example oi6. Reordered the bracket and changed the predicate: "Die
    Kollegin, die ich schon lange kenne, wohnt in Berlin."
14. Added "The relative clause goes directly after the noun." to the six affected
    sentence_building items' `question_en` (nom-acc oi20/22/24, dat-gen oi13/15/17), since the
    level also licenses the extraposed order and the cue didn't say which one is graded.
15. genitive-prepositions `rules[2]` mistake #0 restated live example oi1 / live rule oi5
    verbatim. Noun changed (Regen → Verkehr) and the explanation cross-referenced rule 5 by
    number — this introduced a new defect, closed in round 3 (see below).
16. relative-clauses-dat-gen `rule_patches[0].new` — round 1's fix ("dessen = wessen (m/n).
    deren = wessen (f/pl).") lost the m/n vs f/pl contrast since both halves read the same
    word. Reworded: "dessen ersetzt sein (m/n). deren ersetzt ihr (f/pl)."
17. dat-gen dialogue line 2 (`rules[1]`) — highlight "mit denen ich zu tun habe" wasn't a
    substring after round 1 added "hier" to the line text. Highlight now includes "hier".
18. dat-gen dialogue line 4 — "von dem Sie sprachen" (Präteritum of a full verb, stilted in a
    spoken model dialogue) → "von dem Sie gesprochen haben" (Perfekt, natural and already
    allowed).
19. genitive-prepositions dialogue (`rules[0]`) — Frau Klein (the landlord) self-incriminatingly
    confessing her own failure read as a misattributed line; she now opens by asking what's
    wrong instead (wording refined again in round 3), and Herr Berger (the tenant) carries the
    complaint. "Personalmangel" (above the B1 Wortliste) → "viel Arbeit"; "Kündigungsfrist" in
    the table rule → "Frist".
20. Raised genitive-prepositions' stage-5 difficulty to ramp 2/3/2/3/2/3 instead of clustering
    at 1-2; wired all ten relative-clauses-nom-acc exercises' `related_rule_title` to an
    existing rule title (was null throughout).
21. Dropped the causative "reparieren lassen" (B2.1 `causative-constructions` semantics) from
    the genitive-prepositions dialogue in favour of the plain infinitive.

**D (the two swapped legacy exercises)** — left untouched per the orchestrator's instruction;
patched out of band, not part of this deliverable.

**Verification, round 2**: `check-grammar-json.mjs --cache` clean, combined and individually;
order_index/typed-count unchanged. Extended scripted checks added: duplicate check widened to
compare against every live example across all four topics (not just live exercises of the same
topic) and cross-checked the four new files against each other; a Passiv/Partizip sweep over
every new/patched German string including every `rule_patches[*].new` value; a null-article
singular-adjective sweep (curated adjective list + a separate unambiguous-singular-ending pass)
over every exercise key, example sentence, and rule string. All clean after 3 manually-confirmed
false positives were whitelisted with reasoning in the script (a frozen greeting and two
PLURAL null-article adjectives, which the level explicitly allows).

## Round 3 changes (response to `S/reviews/extend-E1-review-2.md`, FAIL: 1 blocking, 6 minor)

**N1 — BLOCKING.** genitive-prepositions `rules[2].content.mistakes[0].explanation_de` had
picked up an elliptical-passive participial insertion while closing round-1 finding 15: "wegen
braucht wie schon in Regel 5 gezeigt den Genitiv, nicht den Dativ." — a Partizip-II adverbial
group (`wie ... gezeigt [wurde]`) with no grammar for it at B1.1. Split into two plain sentences
naming the rule by title, not number:
fixed: "wegen braucht den Genitiv, nicht den Dativ. Die Formen findest du in der Regel
»Umgangssprache: Dativ statt Genitiv«." (explanation_en correspondingly: "wegen takes the
genitive, not the dative. You can find the forms in the rule »Spoken German: Dative Instead of
Genitive«.")

**Round-1 finding 12, remaining leak.** dat-gen oi 15 `question_en` still read "deren +
genitive noun (Relativpronomen ergänzen)", naming the answer in the same breath as asking for
it.
fixed: "Possessive relative pronoun for a feminine noun (Relativpronomen ergänzen), sein
conjugates to ist, helfen conjugates to hilft. The relative clause goes directly after the
noun. Start with 'Die Nachbarin'."

**N2 — MINOR.** The "Regel 5" cross-reference (an internal order_index reference that breaks
silently on renumbering) is gone wherever it occurred — confirmed by `grep -in "regel 5\|rule
5"` over all four files returning nothing. (Only ever occurred in the one field N1 fixes; there
was no second instance.)

**N3 — MINOR.** gen-prep dialogue line 2 highlighted "seit letzter Woche" — a dative time
phrase in a topic whose other five highlights are all genitive-preposition phrases.
fixed: line recast around a genitive preposition instead of dropping the highlight: "Was ist
denn los? Wegen der Reparatur habe ich noch nichts gehört." / highlight "Wegen der Reparatur".

**N4 — MINOR.** gen-prep oi 10 "Innerhalb ___ Jahres" (→ `des`) duplicated the frame of live
`genitive-case` oi 9 ("Innerhalb ___ Jahres" → `eines`) with the opposite key on a near-identical
sentence.
fixed: changed the frame rather than the article, per the orchestrator's exact instruction:
"Innerhalb ___ nächsten Monats wächst die Firma stark." (der Monat, masculine, still → `des`,
no collision with the live eines-Jahres item).

**N5 — MINOR.** gen-prep dialogue line 3 "Trotz meines Anrufs letzte Woche ist noch nichts
passiert." hung a bare accusative time adverbial off a genitive noun phrase.
fixed, per the orchestrator's exact wording: "Trotz meines Anrufs vor einer Woche ist noch
nichts passiert. Können Sie das innerhalb einer Woche reparieren?" / highlight "Trotz meines
Anrufs vor einer Woche".

**N6 — MINOR (documentation).** The per-topic sections of this file still described round-1
content, contradicted by the Round 2 changelog further down.
fixed: the four per-topic sections at the top of this file now describe the current
(post-round-3) content directly; the Round 2 and Round 3 changelog sections are kept below for
traceability, each labelled with the review it responds to.

**Verification, round 3**
- `check-grammar-json.mjs --cache grammar-content-cache.json`: clean for all four, combined and
  individually. order_index/typed-count/rule-example-exercise counts unchanged from round 2;
  all five `rule_patches[*].old` values still byte-exact against the source dumps (untouched —
  only `new` values and unrelated exercise/rule fields changed).
- `grep -in "regel 5\|rule 5"` over all four output files: no hits (N2 confirmed closed
  everywhere, not just in the one field named).
- Re-ran the round-2 extended sweeps (duplicate check vs. all live examples/exercises and
  cross-file; topic-9–12 banned-token scan; 20-word cap over every German field including rule
  content and patch payloads; Präteritum-target blacklist; word_breakdown coverage; per-topic
  order_index contiguity): all clean.
- New targeted sweep for the N1 shape specifically ("wie ... <Partizip-II>" with no
  wurde/wird/worden anywhere near it, i.e. an elliptical reduced-passive insertion): zero hits
  across every new/patched German field in all four files (excluding `rule_patches[*].old`,
  which must stay byte-exact to the historical cache and is not something this deliverable
  changes).
- A broader Partizip-II sweep (any `ge...t`/`ge...en` token not immediately preceded by a
  haben/sein auxiliary) surfaced 10 hits; all 10 are false positives on manual check: correct
  verb-final Perfekt in relative/subordinate clauses where the auxiliary legitimately sits at
  the clause end ("..., den ich gesehen habe, ...", "..., von dem Sie gesprochen haben, ...",
  "..., an die ich schon lange gedacht habe."), the present-tense verbs "geht"/"gehört" being
  matched by the sweep's over-broad `ge-` prefix (not participles at all), and
  `rule_patches[*].old` entries, which are required to stay byte-exact to the live cache and
  therefore still carry the original (pre-patch) content the patches exist to fix.
