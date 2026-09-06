# a21Phase.js — adversarial review, round 1

Deliverable: `S/wave4/plan/{a21Phase.js, verify.mjs, notes.md}` against `S/wave4/plan-brief.md`
and `S/wave4/level-a2.1.md` (binding). Template read in full: `src/data/programs/a12Phase.js`;
runner read: `src/pages/A12PhasePage.jsx` (TYPE_ICON, item rendering); prior round read:
`S/wave3/plan/review.md`.

## What I ran (harness rebuilt per notes.md §Harness, under `S/wave4/plan/_harness/`, then deleted)

`grammarTopics.stub.js` (repo copy + the 4 pending a2.1 topics at 25/25/20/20),
`writingTasks.stub.js` (repo copy + the 4 goethe_a2 tasks, **taskKeys and titles taken from the
real `S/wave4/exam/writingTasks.goethe-a2.js`**, not from notes.md's guessed keys),
`a21Phase.harness.js` + the two deliberately-broken variants. Nothing was written into
`/home/user/deutschmeister` (`git status --porcelain` unchanged by me).

```
PROGRAM_KEY a21_phase / PROGRAM_TITLE A2.1-Phase: 28 Tage bis zum Abschlusstest
PROGRAM_MINUTES 1775 = 29.583 h / PROGRAM_HOURS 30 / item count 93
79 PASS / 0 FAIL — ALL CHECKS PASSED
out-of-range days []   bad item counts []   sentences per intro [2,2,2,2]
listening per week [3,3,3,3]   exam-format reading days [20,25]
gap … lesson=1 review=3 gap=2 … imperative-mood lesson=22 review=23 gap=1
      temporal-prepositions lesson=23 review=24 gap=1
      adjective-endings-intro lesson=24 review=25 gap=1
mission 1..8 day = lesson day + 1 for all eight
```

**First run failed 1/79.** `import throws, naming the missing a2.1 slugs` FAILED, because the four
a2.1 topics landed in `src/data/grammarTopics.js` mid-review (uncommitted when I started, then
merged as `accecf9` "Add four A2.1 grammar topics…" (#82) — the repo is clean again now) — so "the
REAL repo file" no longer lacks them. I re-pointed that variant at the pre-wave file
(`git show accecf9^:src/data/grammarTopics.js`) and the guard fires correctly, naming all four
slugs; that is the 79/79 run above. The guard code is fine; the harness recipe in notes.md is not.

**Second run, against the REAL (now-landed) `src/data/grammarTopics.js`** — i.e. the true
estimatedTime values, not the 25/25/20/20 stub: `PROGRAM_MINUTES 1782`, `PROGRAM_HOURS 30`,
Tag 19 = 62 min, Tag 23 = 70 min, every day still inside 55–75 / ≤40. Weeks 435 / 405 / **467** /
**475** (notes.md says 465 / 470).

## What I checked by hand, beyond the harness

Shape parity against a12Phase.js line by line (exports, `gLesson`/`gReview`/`hubReview`/`speaking`/
`listening`/`listeningReuse`/`reading`/`srsReview`/`xray`/`orientation`/`schreiben`/`modelltest`
factories, throwing lookups, `PROGRAM_MINUTES` reducer, `allItemIds`); all 12 lesson slugs and
their day order against the brief's fixed pedagogical sequence (identical); all 8 mission titles
and orders against the brief (verbatim, byte for byte); all 6 listening titles against
`S/wave4/source/listening-a2.1.json` (verbatim); all 8 reading titles against
`S/wave4/source/reading-a2.1.json`'s `title_de` (verbatim) plus the two exam-format titles against
the brief; the `taskKey` prefix and title-prefix assumption against
`S/wave4/exam/writingTasks.goethe-a2.js` (`sms-einladung-absagen` / `sms-treffen-verschieben` /
`email-kursanmeldung` / `email-termin-beim-amt`, titles "SMS: …" / "E-Mail: …" — **the assumption
holds**, the strip is not a no-op, and the 4 rendered titles are correct); every href against
`src/App.jsx` routes and `netlify.toml` rewrites (all 9 shapes exist; `/speaking/` `/analyze/`
prerendered, `/grammar/a2.1/**` Astro, the rest SPA); the estimatedTime assumption against
`S/wave4/grammar/*.json` `topic.estimated_time`; every German string re-read for case, endings,
word count, register and A2.1 legality; day-by-day duplicate-href scan (the harness does not do
this — it found finding 1).

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| 1 | a21Phase.js Tag 24 + Tag 25 | BLOCKING | `uebung('temporal-prepositions')` … `gReview('temporal-prepositions', 15)` (both Tag 24); `uebung('adjective-endings-intro')` … `gReview('adjective-endings-intro', 15)` (both Tag 25) | Two checkboxes on the same day pointing at the **identical href** (`/grammar/a2.1/<slug>/`), titled "Üben: X — die Übungen zur Lektion" and "Wiederholen — X". A Wiederholung with zero spacing is not a Wiederholung; this is exactly the pattern wave-3 review §2 called blocking ("introduced and noch einmal geübt on the SAME day, as two adjacent, near-identical checkboxes"). It also breaks the plan's own spacing promise for the last three topics (gap = 1, not 2 — see finding 4a). Only these two topics are affected; the other ten space Übung and Wiederholung correctly. | Rebalance Woche 4 so the last two topics get a real gap — e.g. pull `imperative-mood` to Tag 21 and shift `temporal-prepositions`/`adjective-endings-intro` to Tag 22/23, freeing Tag 25–27 for their Wiederholungen. Add a same-day duplicate-href check to verify.mjs (see 12). |
| 2 | a21Phase.js `uebung()` | BLOCKING | `title: \`Üben: ${topic.titleDe} — die Übungen zur Lektion\`` → "Üben: Zeit-Präpositionen: wann und wie lange — die Übungen zur Lektion" | The frame repeats its own word ("Üben" … "Übungen") in all four items, and for `temporal-prepositions` it nests a second colon inside the first, giving an 11-word, two-colon, one-dash label. This is the wave-3 blocking finding §4 verbatim (frame word doubled, colon inside colon) — and this module implements anti-stutter strips for reading *and* writing titles while leaving the one title family it invented itself unguarded. | `title: \`Übungen zur Lektion — ${topic.titleDe}\`` (or plain `Üben: ${topic.titleDe}`), and add a "no doubled Üben/Übung, at most one colon" assertion beside the existing stutter checks. |
| 3 | a21Phase.js Tag 11 | BLOCKING | `xray('d11-xray', 20, 'X-Ray: fünf Sätze mit mir, dir, ihn und sie')` | Read as German, `mit` governs Dativ: "mit mir, dir" primes exactly that reading, and then "ihn" is an accusative form in a dative slot — a case error, printed on the production day of `pronouns-accusative-dative`, the one lesson whose whole point is which form goes where. "sie" is additionally ambiguous (Nom/Akk, Sg/Pl). The other four cited-form X-Ray titles are safe because infinitives ("mit aufstehen, einkaufen"), finite verbs ("mit konnte, musste"), prepositions ("mit seit, vor und ab") and "wo? und wohin?" cannot be misread as dative complements — this one can. | "X-Ray: fünf Sätze mit Objektpronomen (mich, dir, ihn)" or "X-Ray: fünf Sätze mit den Pronomen mich, dir und ihn". |
| 4 | a21Phase.js header comments | BLOCKING | (a) "Every lesson's Wiederholung lands exactly 2 days after its own introduction (checked programmatically in verify.mjs)"; (b) "It differs from topic_order in one place on purpose"; (c) "The only adjective+noun pairs left are the grammar topics' own names ('trennbare Verben')" | Three statements the file itself refutes. (a) three of twelve gaps are 1 day (imperative-mood 22→23, temporal-prepositions 23→24, adjective-endings-intro 24→25) **and** verify.mjs checks `gap >= 1 && gap <= 2`, not "exactly 2" — the comment invents a guarantee and then credits the harness with enforcing it. (b) the pedagogical order is topic_order 1,2,3,4,**10**,5,6,7,**11**,8,**12**,**9** — five positions moved, not one. (c) the derived writing title on Tag 16 renders "Einen neuen Tag vorschlagen", a weak adjective ending eight days before `adjective-endings-intro` is taught, and "trennbare Verben" (Woche-2 title *and* intro) is null-article declension, which `level-a2.1.md` bans outside the frozen chunks. Comment discipline is the template's core contract and the previous round's §10 flagged this same class. | Rewrite (a) to "1–2 days, checked in verify.mjs"; (b) to name the four moved topics; (c) to state the real position — the plan chrome avoids authored adjective endings before Tag 24, but a derived writing title carries one, and the topic names are metalanguage. |
| 5 | notes.md §Measured totals + a21Phase.js footer comment | MINOR | "the four pending slugs stubbed at 25/25/20/20 minutes: 1775 minutes over 93 items … week minutes 435 / 405 / 465 / 470" | This wave's own grammar deliverables say **25 / 25 / 22 / 25** (`S/wave4/grammar/{adjective-endings-intro,pronouns-accusative-dative,modal-verbs-past,temporal-prepositions}.json` → `topic.estimated_time`; the same values are now merged into `src/data/grammarTopics.js` as of `accecf9`). Real total is 1782, weeks 435/405/467/475. Harmless — Tag 19 → 62, Tag 23 → 70, every day still in band, PROGRAM_HOURS still 30 — and notes.md doubt 3 asked for exactly this check, so it was honest, but the numbers are now stale. | Re-stub at 25/25/22/25 (or import the real file, which now carries all 12) and refresh both number sets. |
| 6 | notes.md §Harness step 3 | MINOR | "`.missing-slugs.js` / `.missing-writing.js` = the same copy pointed back at the REAL repo files" | No longer reproducible: the 4 a2.1 topics landed on main during this wave (`accecf9`, #82), so pointing at the real file gives 12 slugs and the guard assertion FAILS (my first run: 78/79). The guard itself is correct — proved against `git show accecf9^:src/data/grammarTopics.js`, which throws naming all four slugs. | Pin that variant to a frozen 8-slug copy (`git show accecf9^:…` or a local `grammarTopics.pre-wave.js`) so the assertion cannot rot; once PR D1 lands the writing tasks the same rot hits `.missing-writing.js`. |
| 7 | verify.mjs | MINOR | — | Two gaps the deliverable's own defects walked through: no check that two items on one day share an href (finding 1), and no check that a week intro's countable claims match the week ("drei Sprechmissionen", "deine erste SMS-Aufgabe" — I verified all four by hand; they are correct today, nothing pins them). | Add both; they are four lines each. |
| 8 | a21Phase.js Tag 13 | MINOR | `hubReview('d13-review', 'Wiederholen: Possessivpronomen und Pronomen im Dativ', 20)` | Names only the Dativ half of a topic the plan itself teaches as "Pronomen im Akkusativ und Dativ" (Tag 10, `topic.titleDe`) — the learner sees two different names for one lesson three days apart. | "Wiederholen: Possessivpronomen und Objektpronomen" or reuse the topic's own titleDe. |
| 9 | a21Phase.js `xray()` default | MINOR | `'X-Ray: fünf Sätze aus dieser Woche'` — 6 items (Tag 2, 4, 6, 8, 12, 19) | Eleven of seventeen X-Ray items carry a specific, teachable prompt; six repeat one generic line, twice within Woche 1 alone (Tag 4 and Tag 6, two days apart) and twice in Woche 2. The specific ones are the model. | Give at least the same-week repeats their own target ("… mit Dativ und Akkusativ", "… mit Possessivpronomen"). |
| 10 | a21Phase.js `PROGRAM.subtitle` | MINOR | "Phase 1 im A2-Band, mit dem Abschlusstest A2.1 als Ziel." | "Band" is CEFR jargon out of the briefs, not learner German; nothing on the product says "A2-Band". | "Die erste Hälfte von A2, mit dem Abschlusstest A2.1 als Ziel." (watch the adjective ending rule — "erste Hälfte" is a der-word phrase, legal only from Tag 24; "Der erste Teil von A2" has the same issue — simplest is "Teil 1 von A2, …"). |
| 11 | a21Phase.js Woche 4 | MINOR | `adjective-endings-intro` lesson Tag 24, Übung + Wiederholung Tag 25, Probe Tag 26 | The single hardest A2.1 topic gets two days and no spaced contact before it is tested, while `dative-case` gets twenty-five. The brief fixes the order, so this is not the author's choice — but the plan could have started Woche 4 a day earlier or moved a Woche-3 review out. Worth surfacing to the coordinator rather than silently shipping. | Note it in notes.md as a known consequence of the fixed order, or buy a day by finding 1's reshuffle. |
| 12 | a21Phase.js Tag 22 block | MINOR | `        {` (8 spaces) where every sibling day opens at 6 | Cosmetic indentation slip inside `WEEKS[3].days`. | Reindent. |
| 13 | a21Phase.js (inherited) | MINOR | `'Perfekt mit "haben"'`, `'Perfekt mit "sein"'` | ASCII double quotes arrive from `grammarTopics.js` `titleDe` and render on the same page as the module's own „…“ (mission and Diktat titles). Derive-never-retype is the right call, so the fix belongs upstream. | Fix the two `titleDe` values in `src/data/grammarTopics.js` to „haben“ / „sein“ in a separate commit; do not retype them here. |
| 14 | verify.mjs lesson-slug loop | MINOR | `if (it.type === 'lesson') lessonSlugCounts.set(m[1], …)` | `m` may be null (the line above already guards for it); a future lesson-type item with a non-grammar href would crash the harness with a TypeError instead of failing a check. | `if (it.type === 'lesson' && m)` plus an explicit `check('every lesson item has a grammar href', …)`. |

## Verdict

VERDICT: FAIL (4 blocking, 10 minor)

The plan's skeleton is right and better than its sibling's first round: all 12 slugs once in the
brief's pedagogical order, all 8 missions on lesson-day+1 (the wave-3 blocking finding, fixed
before it could recur), all 6 listening exercises twice, all 10 reading titles verbatim, the 4
writing tasks genuinely derived — and the title-prefix assumption notes.md flagged as a doubt
turns out to hold against the real `writingTasks.goethe-a2.js`. What it did not carry over is the
*discipline* the same review round demanded: the one title family this module invented is the one
with the frame-word stutter and the nested colon, and the one scheduling rule it states most
confidently ("exactly 2 days") is the one its own last three topics break, on a day where Übung
and Wiederholung collapse onto the same URL. Findings 1–4 are all comment-versus-content
mismatches at heart; none of them needs new content, only a Woche-4 reshuffle, one title rewrite,
one pronoun list and three honest comments.
