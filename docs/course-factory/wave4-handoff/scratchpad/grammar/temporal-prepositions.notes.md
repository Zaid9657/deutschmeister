# temporal-prepositions.notes.md

## Coverage
A2.1, topic_order 12, slug `temporal-prepositions`. 9 rules (-1 intro, 1–7, 99 summary) /
10 examples / 26 exercises (stage 4: 13, stage 5: 13; 20 typed, 6 multiple_choice).
Scope from level-a2.1.md is covered item by item:
- **um / am / im review** — rule 1 (case_table, 8 rows incl. the *in der Nacht* exception and
  the articleless *heute/morgen/gestern* row), examples 1–2, exercises S4#1–3, S4#7, S4#11,
  S5#1, S5#2, S5#12.
- **vor / nach / seit / bis / ab / von … bis / zwischen / gegen** — rule 2 (one row each, with
  a Kasus column), one example each (3–10), and at least two exercises each.
- **Dativ after vor/nach/seit/zwischen/ab** — rule 2's description, the -m/-r/-n forms drilled
  in S4#5 (*der* Pause), S4#6 (*einem* Monat), S4#10 and S5#3/#4 (dative plural -n:
  *Tagen / Monaten*), S5#7 (*ab dem 1. Mai*, the article-bearing ab).
- **bis mostly articleless** — rule 5 (tip), rule 7 mistake 6, S4#9, S5#8, S5#10 (error
  correction on *bis dem Sonntag*).
- **wann / wie lange / seit wann / bis wann / ab wann** — rule 3 is the question→answer table;
  S4#13 and S5#13 are answered by the question word alone.
- **Exam anchoring** — description_de/en name Sprechen Teil 3; rule -1's why_it_matters names
  Sprechen Teil 3, Schreiben Teil 1 (SMS) and Hören Teil 1; rule 3's formal_note maps the five
  questions onto Sprechen Teil 3 / Hören Teil 1; rule 6 is a full Sprechen-Teil-3 planning
  dialogue; example 9 (category "exam") and S5#9 are the SMS line *Ich komme heute erst gegen acht Uhr.*

## Built on the live topics, not repeated
- `prepositions-dative` rule 6 already teaches "seit + Präsens". Rule 4 (`seit oder vor?`) cites
  that as known ("Das kennst du") and adds the half it does not carry: **vor** as the finished
  point that takes the Perfekt, with a four-row contrast table and the note that both take the
  same dative endings.
- `dative-case`'s -m pattern and dative plural -n are referenced ("Du kennst dem, der, einem und
  einer schon", "Das kennst du von mit der U-Bahn") and only *applied* to time nouns, never re-taught.
- `prepositions-accusative` (A1.2) rule 7 (*gegen für ungefähre Zeit*, key_insight "um = genaue
  Zeit. gegen = ungefähre Zeit.") already teaches the approximate reading. Rule 2's key_insight
  therefore recaps it as known ("kennst du schon aus A1") and claims as new only its place beside
  um, ab and bis in one system. **Round 1 of these notes wrongly called that reading new.**
- No rule title collides with any of the 72 live topics' rule titles (checked against
  grammar-content-cache.json, dumpedAt 2026-08-24).

## Level compliance (checked programmatically, not asserted)
Every German string was extracted and word-counted per sentence: the longest learner-facing
German sentence is **12 words**, under the level file's 14-word cap. A ban-pattern sweep over
all German strings found no Nebensatz conjunction (weil/dass/wenn/ob/als), no relative clause,
no Konjunktiv II, no Futur, no Passiv, no reflexive, no comparative/superlative, no Genitiv and
no Präteritum of a full verb. The only hits were false positives: *war* (A1-allowed Präteritum
of sein, used four times) and the nominative *der Kurs*. No attributive adjective ending appears
anywhere except the level file's own sanctioned chunk *bis nächste Woche* (rule 5, once).
Two-way prepositions (*ins Kino*, S5#1) and Perfekt (*bin gekommen*, *sind gefahren*) are used
productively — both are live A2.1 topics 3/6/7, i.e. before this one.

## Deliberate exclusions
- **während** (B1) is not mentioned at all, not even as a contrast.
- **an/in + Akkusativ for time** (*bis in die Nacht*, *auf den Abend*) omitted: outside scope.
- **vor/nach as local prepositions** (vor dem Haus) is not contrasted, to keep rule 4 on the
  seit/vor axis that actually causes A2 errors; two-way-prepositions owns the local reading.
- **von … an**, **innerhalb**, **binnen**, and the bare accusative time phrase (*jeden Tag*,
  *nächsten Montag*) are all excluded — the last one would require null-article adjective
  endings, which the level file bans.
- No example uses *zwischen* with two article-bearing dates (*zwischen dem 1. und dem 5. Mai*):
  correct, but it stacks ordinals and dative articles for no scope gain. Rule 2's row and the
  clock-time examples carry zwischen instead.
- No exercise sentence duplicates an example sentence — true only after round 2, which changed
  S5#9's frame; in round 1 S5#9 did reproduce example 9, and these notes claimed otherwise.
  Frames necessarily recur, since the topic has eleven prepositions and ten example slots.

## Doubts for the reviewer
1. **`icon`: I wrote `"book"`, not an emoji.** The brief says "one emoji", but all 72 live topics
   carry the literal string `book` and the shipped Wave 3 files do too; `topic.icon` is not
   rendered from the DB anywhere in the SPA or the Astro pages (grepped). Changing it for one
   topic would make this row the odd one out. Flagging rather than deviating silently.
2. **`related_slugs` contains `modal-verbs-past`**, a Wave 4 sibling that does not exist in the
   cache yet. It exists only if topic 11 lands in the same migration. Review-2 treated
   same-wave siblings as valid and separately flagged their *absence* as a defect, so I included
   exactly one; drop it if Wave 4 is applied topic by topic. The other three
   (`dative-case`, `prepositions-dative` as prerequisites; `time-and-dates`,
   `two-way-prepositions` as related) are all live, and no slug appears in both lists.
3. **`difficulty` is not on the topic object.** The brief lists it, but `buildTopicRow` in
   `scripts/grammar-topics-from-json.mjs` has no such column and no live topic row carries one,
   so it would be silently dropped. Omitted deliberately.
4. **Two items are decided by an explicit cue rather than by grammar**, and the round-1 notes
   wrongly claimed there was only one. S4#12 (`Ich komme ___ acht Uhr. Vielleicht 7:50, vielleicht
   8:10.`) leaves *um* grammatical in isolation — the second sentence excludes it by content.
   S5#9 (`Ich bin erst ___ neun Uhr zu Hause.`) leaves *um* grammatical too; only the
   "(approximate time, not an exact one)" cue in question_en excludes it. Both cues are explicit
   and stated in the item itself; S4#7's live-grammatical *Seit* distractor, which had no such
   cue, was replaced in round 2 by the dead *An*.
5. **Sentence-building acceptance.** All nine `sentence_building` items accept the fronted
   variant (*Am Sonntag gehen wir ins Kino.*) as well as the subject-first one, with and without
   the final full stop — this is the live `basic-sentence-structure` "Position 1 ist flexibel"
   rule that review-2 found violated in Wave 3. S5#3 additionally accepts
   *Ich wohne hier seit drei Monaten.* No `why_correct_de` claims a fixed position 1.
6. **`bis nächste Woche`** (rule 5, once) is a null-article adjective ending. It is written into
   the level file's own scope line for this topic, so I treated it as sanctioned; if the reviewer
   reads that line as citation-only, delete the two words — nothing else depends on them.


## Round 2 changes (against `review-temporal-prepositions-1.md`)

| finding | change |
|---|---|
| **B1** example 5 duplicated live `prepositions-dative` | `examples[4]` is now **"Mein Bruder studiert seit drei Jahren in München."** (new frame: *studieren*, plural `-n` still drilled). The same sweep found three more collisions the review did not list, all fixed: rule 4 row 1 (`Ich lerne seit zwei Jahren Deutsch.` → `Ich arbeite seit einem Jahr in Bremen.`, row 2 adjusted to *Vor einem Jahr*), mistake 2 (`Ich lerne seit zwei Jahre Deutsch.` → `Ich habe seit drei Tage Urlaub.`), mistake 3 (`Ich habe seit zwei Jahren hier gewohnt.` → `Ich habe seit vier Jahren Gitarre gespielt.` / `Ich spiele seit vier Jahren Gitarre.`). |
| **B1 proof** | `S/wave4/sweep.py` normalises (case-folded, punctuation-stripped, whitespace-collapsed) **every** German sentence in the file — example sentences, rule/table/dialogue/mistake German, `question_de` with `___` filled by the key, `correct_answer` and every `acceptable_answers` entry: **420 sentences** — against a corpus built the same way from **all 72 live topics**: every `sentence_de`, every filled `question_de`, every `correct_answer`/`acceptable_answers` and every German rule/table/mistake string = **4 982 live sentences**. Result: **HITS 0** (exact matches). Round 3 added a near-duplicate pass — see below — because exact matching alone cannot prove "no collisions". Four short shared chunks that round 1 still carried were removed too (`Wann kommst du?` in the hook, `in der Nacht` as a bare cell, `seit zwei Jahren` ×2 → `drei Jahren`). |
| **B2** S5#10 rejected `bis zum Sonntag` | `acceptable_answers` now carries `Ich bleibe bis zum Sonntag.` (+ no-period variant) beside `Ich bleibe bis Sonntag.`; `question_en` says two repairs are accepted; `why_correct_de` is now `bis dem gibt es nicht. Streich den Artikel oder nimm zu: bis zum Sonntag.` The teaching gap is closed at source: rule 5 and mistake 6 now state `Mit Artikel brauchst du zu: bis zum 3. Mai, bis zur Pause.` |
| **M1** *gegen* wrongly called new | rule 2 `key_insight_de/_en` reframed as a recap citing live `prepositions-accusative` rule 7; notes corrected (see "Built on the live topics"). |
| **M2** `X hat Dativ` ×16 | every occurrence replaced with `verlangt den Dativ` / `Bei Zeitangaben verlangen … den Dativ` / `Bei Zeitangaben steht … der Dativ`; **zero** `hat Dativ` remain in the file. |
| **M3** `Kasus` column carried form notes | `bis` → `Akkusativ (meist ohne Artikel)`; `von … bis` → `von + Dativ … bis + Akkusativ`; rule 2's `description_en` now names both cases and adds that the ending is invisible on a bare day or clock time. |
| **M4** unqualified "always take the dative" | intro `german_difference_en` and rule 2's `description_de/_en` now say **in time expressions**, and both cross-reference live `two-way-prepositions` (topic 3) for the accusative direction reading (`vor das Haus`). |
| **M5** S4#7 `Seit` distractor is grammatical | options are now `["Im","Um","Am","An"]` — `An Sonntag` is impossible (an + dem = am), which is also the point the explanation now makes. |
| **M6** S5#9 reproduced example 9 | S5#9 is now `SMS an eine Freundin: Ich bin erst ___ neun Uhr zu Hause.` (`gegen`); no exercise stem or key equals any example sentence (checked by the sweep). |
| **M7** `Wie lange?` / `Ab wann?` never exercised | S4#8 is now the `Wie lange?` question-answer pair (`„Wie lange ist das Museum geöffnet?“ — „___ 10 bis 18 Uhr.“` → `Von`) and S5#7 is now cued as the `Ab wann?` answer (`Antworte auf „Ab wann arbeitest du in Köln?“`). All five question words are now exercised: Wann (S4#1–3, S4#7, S5#12), Wie lange (S4#8), Seit wann (S5#13), Bis wann (S4#13), Ab wann (S5#7). Item count unchanged (13/13). |
| **M8** (a) `Vielleicht ist es 7:50` (b) `offen` (c) `weiterarbeiten` | (a) → `Vielleicht 7:50, vielleicht 8:10.` (b) → `geöffnet` (c) S4#5 → `Nach ___ Pause trinke ich einen Kaffee.` — no untaught separable prefix anywhere in the file. |
| **M9** German description dropped two prepositions | `description_de` now lists the same eight as `description_en`: "Lerne die Zeit-Präpositionen: vor, nach, seit, bis, ab und zwischen. Dazu kommen gegen und von … bis. Im Sprechen Teil 3 planst du damit einen Termin." (3 sentences, exam use named). |

Re-checked after the round-2 edits: validator clean; longest learner-facing German sentence
still **12 words**; ban sweep unchanged (only `war` and the nominative `der Kurs` as false
positives); 26 exercises (13/13), 20 typed / 6 multiple_choice with keys at option positions
0,1,2,2,3,3; every `grammar_highlight` still a substring and every `word_breakdown` still
complete for the replaced example 5.


## Round 3 changes (against `review-temporal-prepositions-2.md`, VERDICT PASS + 4 minors)

| finding | change |
|---|---|
| **M1** stale English after the *Gitarre* rewrite | `rules[7]/common_mistakes[2]/explanation_en` now says **"English uses 'have been playing'"**. Its German was reworded at the same time (see M2 fallout below). |
| **M2** S5#3 a one-noun-swap near-duplicate of live A1.2 `dative-prepositions-intro` S5#6 | S5#3 is now `[ich / seit drei Monaten / einen Deutschkurs / besuchen]` → **"Ich besuche seit drei Monaten einen Deutschkurs."** (+ the fronted variant, ± full stop). *besuchen* is paired with *seit* nowhere in the live corpus, so verb, frame and object are all new; the `seit` + dative-plural + present-tense point is unchanged. |
| **M2 (proof)** the "HITS 0" claim was stronger than the method | `sweep.py` now runs **two** passes. (a) Exact: 369 content sentences of this file vs 3 926 live content sentences (bracket cues and task boilerplate — *Schreib den Satz:*, *Korrigiere den Fehler:*, *Antworte auf …:* — stripped, since they are house notation, not content) → **HITS 0**. (b) Near-duplicate: token-set Jaccard of every pair, threshold **0.70** → **NEAR>=0.70: 0**. Two round-2 leftovers were rewritten to clear it: the intro hook (*Wann beginnt der Kurs?* → *Wann beginnt dein Kurs?*, 1.00 against a live stem) and mistake 3's German (*Bei seit steht das Verb im Präsens.* → **"seit heißt: Es läuft noch. Darum kein Perfekt, sondern Präsens."**, 0.75 against the live `prepositions-dative` wording); summary point 1 now reads *Aber: in der Nacht.* instead of *Ausnahme: in der Nacht.* (1.00 against a live cell). The claim is now exactly what the method supports: **no exact duplicate and no ≥0.70 near-duplicate against any of the 72 live topics.** |
| **M3** reviewer voice in learner-facing English | Repo machinery removed from all three fields. `rules[2]/key_insight_en`: "You already know gegen for an approximate time from **the lesson Prepositions + Accusative**: um names the exact time, gegen an approximate one." `rules[2]/description_en`: "…the dative you already met in **the lesson Dative Case**… as two-way prepositions vor and zwischen take the accusative for direction (vor das Haus) — that reading, from **the lesson Two-Way Prepositions**, is not what this table is about." Intro `german_difference_en` drops "Watch the qualifier" and "topic 3" for the same lesson-name phrasing. No slug, rule number or the word "live" remains in any learner-facing field. |
| **M4** two garden-path sentences | Summary point 2 → **"Bei Zeitangaben verlangen vor, nach, seit, ab und zwischen den Dativ."**; both occurrences of *Mit Artikel verlangt ab den Dativ* (rule 5 `content_de` and S5#7's `explanation_de`) → **"Mit Artikel steht ab mit dem Dativ: ab dem 1. Mai."** |
| **Nit** the word counter split at ordinals | Both `audit.py` and `sweep.py` now use one shared splitter that does **not** break after a bare ordinal (`ab dem 1. | Mai`) and treats a bracket cue as a single token. Re-measured with it: longest learner-facing German **prose** sentence is **12 words** (cap 14); the longest exercise *stem* is S5#7 at 8 prose words plus its cue. |

Re-checked after round 3: validator clean **both** without `--cache` and with
`--cache /home/user/deutschmeister/grammar-content-cache.json` (CREATE documents validate
identically either way — the flag only adds the EXTEND-mode lookups). Shape unchanged: 9 rules /
10 examples / 26 exercises (13/13), 20 typed / 6 MC, keys at option positions 0,1,2,2,3,3, every
`word_breakdown` complete, every `grammar_highlight` a substring, every typed key inside its own
`acceptable_answers`. Ban sweep unchanged: only `war` (A1-allowed) and the nominative *der Kurs*
as false positives.
