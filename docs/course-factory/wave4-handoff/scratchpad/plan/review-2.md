# a21Phase.js — adversarial review, round 2 (delta)

Scope: the 4 blocking + 10 minor findings of `review-1.md`, plus a hunt for regressions the fixes
could have introduced. Harness rebuilt from notes.md §Harness (round-2 recipe), run, deleted.

## Runs

```
node verify.mjs → 86 PASS / 0 FAIL   (matches the author's claim)
PROGRAM_MINUTES 1782 = 29.700 h · PROGRAM_HOURS 30 · 93 items · 93 unique ids
weeks 435 / 405 / 467 / 475 · every day 55–75 (Tag 14, Tag 27 = 40) · every day 2–4 items
same-day duplicate hrefs []   frame-word repeats []   titles with >1 colon []
intro claim mismatches []     duplicate titles across the whole plan: none (93/93 distinct)
```

Harness: `git show accecf9^:src/data/grammarTopics.js` as the frozen 8-slug copy (guard fires,
naming all four slugs); `writingTasks.stub.js` built by lifting the four `goethe_a2` objects
**verbatim out of `S/wave4/exam/writingTasks.goethe-a2.js`**; the real
`src/data/grammarTopics.js` imported for everything else. Repo untouched (`git status` clean).

**I did not trust the new checks — I mutation-tested them.** Re-inserting
`gReview('temporal-prepositions', 15)` on Tag 24 → `FAIL — no two items on one day share an href`
(plus minutes/items/ids). Restoring the old `Üben: X — die Übungen zur Lektion` frame →
`FAIL — no title carries more than one colon` **and** `FAIL — none of the removed register forms
reappear in AUTHORED copy` (the `Üben:` regression pin). Changing Woche 1's intro to "fünf
Sprechmissionen" → `FAIL — every countable claim in a week intro matches that week`. All three new
guards are real.

## Round-1 findings, verified one by one

| r1 | claim | verdict |
|---|---|---|
| B1 same-day Übungen+Wiederholung | Woche 4 reshuffled | **fixed** — measured day by day: no day repeats any href at all; gReview(temporal) Tag 25, gReview(adjective) Tag 26, `listeningReuse(6)` pulled to Tag 24. Woche 4 still 3 Hören, 3 lessons, M8 on Tag 23, both course tests on 26/28. |
| B2 `uebung()` frame stutter + nested colon | reframed | **fixed** — `Übungen zur Lektion — <titleDe>`; one frame word, one colon (none of its own). Reading 9/10 got the same branch-on-the-data treatment: source title verbatim + " — Text N von 10" suffix, and verify's numbering regex was updated with it. |
| B3 Tag 11 pronoun list | "mit den Pronomen mich, dir und ihn" | **fixed** — `mit` now governs *Pronomen* (dative pl.); the cited forms sit appositively, so no case clash. I re-read all 17 X-Ray titles: Tag 4 (aus/bei/nach), 6 (stellen/stehen/legen), 13, 20, 24 cite forms that cannot be read as a `mit`-complement; Tag 8 (meinem/deiner/unserem) is dative throughout. No second instance. |
| B4 three false comments | corrected | **(a) NOT fixed — see finding 1.** (b) fixed: the ordering comment now spells out topic_order 1,2,3,4,10,5,6,7,11,8,12,9 and says four topics interleave — I re-derived it, it is right. (c) fixed: the register note now separates AUTHORED from DERIVED copy and names both derived sources ("Trennbare Verben", "Einen neuen Tag vorschlagen" Tag 16). |
| m5 estimatedTime | 25/25/**22**/25 | fixed — real values imported, 1782 min, weeks 467/475 in notes. |
| m6 rotted guard harness | pinned to `accecf9^` | fixed — I ran it; the guard throws, naming all four slugs. |
| m7 harness gaps | 3 new checks | fixed and mutation-proved (above). |
| m8 Tag 13 half-name | interpolates `bySlug(...).titleDe` | fixed (derived, not retyped) — see minor 5 for the phrasing. |
| m9 generic X-Ray title | `xray()` default removed | fixed — 17 distinct, specific titles; pinned. |
| m10 "A2-Band" | "Teil 1 von A2" | fixed, and "A2-Band" added to the regression pin. |
| m11 adjective runway | Doubt 7 | fixed as asked (surfaced, not silently shipped). Runway is now 3 contacts (Tag 24/25/26). |
| m12 Tag 22 indentation | "reindented to 6 spaces" | **NOT fixed — see finding 2.** |
| m13 ASCII quotes | Doubt 8 | fixed as asked (upstream, separate commit). |
| m14 verify lesson-href crash | new check | fixed — `every lesson item has a grammar href`. |

## Findings

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | a21Phase.js, "The plan" comment (and notes.md §Round 2 item 4 + §Coverage) | BLOCKING | "Every lesson's Wiederholung lands 1–2 days after its own introduction — **nine of the twelve at 2 days, three at 1 day** (imperative-mood 22→23, temporal-prepositions 23→25 is 2, adjective-endings-intro 24→26 is 2; **only imperative-mood sits at 1**…)" | Measured from the file: **eleven at 2 days, one at 1 day** (dative-case, prepositions-dative, two-way-prepositions, possessive-pronouns, pronouns-accusative-dative, separable-verbs, perfect-tense-haben, perfect-tense-sein, modal-verbs-past, temporal-prepositions, adjective-endings-intro = 2; imperative-mood = 1). The sentence also refutes itself between its first clause and its own parenthesis. This is round-1 blocking 4(a) again — the same comment, still stating a gap distribution the data does not support — and it is repeated twice more in notes.md ("nine at 2 days, imperative-mood at 1"). The reshuffle that fixed blocking 1 moved two of the three 1-day gaps to 2 and the prose was updated only halfway. | "elf von zwölf at 2 days, one at 1 (imperative-mood 22→23, where Woche 4's fixed test days leave no room)" — and the same correction in both notes.md places. Optionally pin it: verify.mjs already computes every gap, so `check('exactly one 1-day gap, on imperative-mood', …)` costs two lines and stops this comment rotting a third time. |
| 2 | a21Phase.js:592 (`WEEKS[3].days[0]`) | MINOR | `        {` (8 spaces) opening the Tag 22 day object | Round-1 minor 12, reported fixed in notes.md §Round 2 item 9 ("Tag 22's block reindented to 6 spaces like its siblings"), is still there — all 27 sibling day objects open at 6 spaces, this one at 8. Cosmetic in itself; it matters because notes.md asserts a fix that was not made, which is the same trust problem as finding 1. | Delete the two spaces; correct the notes line. |
| 3 | notes.md §Doubts 2 | MINOR | "The anti-stutter strip assumes bank titles start 'SMS: ' / 'E-Mail: ' … worth a look at merge time." | Stale: `S/wave4/exam/writingTasks.goethe-a2.js` exists and its four titles are "SMS: Eine Einladung absagen", "SMS: Einen neuen Tag vorschlagen", "E-Mail: Nach einem Deutschkurs fragen", "E-Mail: Einen Termin beim Amt ändern" — the assumption holds, round 1 said so, and the round-2 harness itself now lifts those objects verbatim. Doubt 3 was marked RESOLVED in the same pass; this one was not. | Mark it resolved, citing the file, and keep only the real residue: the tasks are not in `writingTasks.js` yet (Doubt 4's merge-order point). |
| 4 | a21Phase.js `xray()` | MINOR | `const xray = (id, minutes, title) => ({ id, type: 'xray', title, minutes, href: '/analyze/' });` | Removing the generic default (minor 9) was right, but this is now the only factory in the file that fails silently: `missionByOrder`, `listeningTitle`, `reading` and `schreiben` all throw on bad input, while an `xray()` call missing its third argument ships `title: undefined` and renders an empty checkbox row. verify.mjs would catch it today, but the file's own contract is throw-at-import. | `if (!title) throw new Error(\`a21Phase.js: X-Ray item ${id} needs an explicit title\`);` |
| 5 | a21Phase.js Tag 8 | MINOR | `'X-Ray: fünf Sätze mit meinem, deiner und unserem'` | Grammatical — every cited form is dative, so unlike the round-1 defect there is no case clash — but it is an ellipsis with no head noun ("with my, your and our … what?"), and Tag 11 now models the better pattern one week later. Two neighbouring items in one plan should not use two conventions for the same job. | "X-Ray: fünf Sätze mit den Formen meinem, deiner und unserem" (or "… mit meinem Bruder, deiner Kollegin und unserem Chef", which also gives the learner a sentence to start from). |
| 6 | a21Phase.js Tag 13 | MINOR | `Wiederholen: Possessivpronomen und ${bySlug('pronouns-accusative-dative').titleDe}` → "Wiederholen: Possessivpronomen und Pronomen im Akkusativ und Dativ" | Deriving the name instead of retyping half of it is the right fix for minor 8, but the interpolation lands a second "und" three words after the first, so the title reads as a three-item list that is really two. | "Wiederholen: Possessivpronomen + Pronomen im Akkusativ und Dativ", or name the two topics with an en dash between them. |

## Verdict

VERDICT: FAIL (1 blocking, 5 minor)

Thirteen of the fourteen round-1 findings are genuinely fixed, and the three new harness checks
are real — I broke the file three ways and each one caught its own defect, which is the first time
in this wave a verify script has been shown to fail on purpose. The one blocking item is the same
comment as round 1's blocking 4(a): the Woche-4 reshuffle moved two of the three short review gaps
out to two days and the prose kept the old count, so the sentence now contradicts its own
parenthesis and both notes.md copies repeat it. That plus the un-made indentation fix means two
statements in notes.md describe work that was not done — nothing content-bearing, but this file's
whole contract is that its comments can be trusted without re-deriving them. Two numbers and two
spaces from PASS.
