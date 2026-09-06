# Adversarial re-review — Wave 4 PR C1, A2.1 reading (round 2, delta)

Scope: the 1 blocking + 13 minor findings of `review-1.md`, the new **Reading exposure ruling**
in `S/wave4/level-a2.1.md` (2026-09-06), and whether any fix introduced a new defect.
I re-read both JSON files in full (not only the diffs), re-solved every changed check and question
cold, re-ran my own independent gates, mutation-tested the two new `verify.mjs` rules, and re-ran
`verify.mjs` and `scripts/reading-from-json.mjs`.

## Round-1 findings — verified against the actual files

| # | round-1 finding | status | evidence I checked |
|---|---|---|---|
| 1 | **BLOCKING** exam 9 check 2, `c) im Zentrum` true in the text's world | **FIXED** | now `c) am Bahnhof`; `Bahnhof` occurs nowhere in the text. Cold-solved: a) is the children's square, c) unmentioned, only b) is supported → key `b` correct and now unique. |
| 2 | exam 9 `Die Konzerte am Abend sind kostenlos` armed distractor `b) nichts` | **FIXED** | `Fast alle Konzerte am Abend sind kostenlos.` Cold-solved check 3 → `c) acht Euro`; `b) nichts` is now false under every reading. 139 → 140 w, declared 140, inside the 120–145 gate. |
| 3 | lesson 4 hardened `etwa 86 Euro` into an exact fare | **FIXED** | text: `Mein Monatsticket kostet etwa 86 Euro.`; item re-worded to `Was kostet das Monatsticket ungefähr?`; explanation re-quoted. Cold → `c`. `Damit kann ich jeden Tag fahren.` still has its antecedent. 143 → 142 w, declared 142. |
| 4 | `Um achtzehn Uhr` | **FIXED** | `Um 18 Uhr ist Feierabend.` in the text **and** in the open answer that quotes it; word count unchanged (130), consistent with the digits used in lessons 7/9/10. |
| 5 | `durch die Ringstraße gelaufen` | **FIXED** | `Am ersten Tag bin ich die Ringstraße entlanggegangen.` — correct separable Perfekt, correct accusative postposition. See N5 below for the one nit that remains. |
| 6 | `der Umzug` only inside `Umzugstag` | **FIXED** | live sentence `Der Umzug hat viel Arbeit gemacht.` restored (+6 w → 143, declared 143, ≤150). |
| 7 | invented specifics (lessons 2/3/6) | **FIXED (as agreed)** | signed off and listed in `notes.md` rather than left silent. |
| 8 | `answer_en` said "she" for an unnamed narrator | **FIXED** | lessons 1–5 now read `The person …`; lessons 6–8 keep `She/He` because Frau Weber, Lena and Jonas are named — the right split. Applied in `build.py`, so it cannot drift. |
| 9 | `Für die Kinder ist der Platz … da.` | **FIXED** | `Für die Kinder gibt es einen Platz vor dem Rathaus.`; check 4 still keyed on `spielen und malen`. |
| 10 | verify: rewrite title drift was info-only, `title_en` unchecked | **FIXED** | both are now `fail`. Mutation-tested by me: `Ein Abend im Lokal` → exit 1, `My Job as a Coder` → exit 1. Round 1's single escaped mutation is closed. |
| 11 | verify's `als` scan was case-sensitive | **FIXED** | `const ALS = /\bals\b/gi`. Mutation-tested: a second `Als …` in lesson 5 → exit 1. |
| 12 | plan-day ordering vs `level-a2.1.md` | **CLOSED by ruling** | the ruling is in the level file and is now the binding text; see below. |
| 13 | both exam rows all-`choice` under the fixed `Richtig oder falsch?` card heading | **carried to the integrator** | correctly *not* fixed here — the repo is read-only for the author. Still open for whoever ships `ReadingChecks.jsx`. |
| 14 | lesson 7 Q2 answer inferred an object | **FIXED** | `Wo hat Lena einen Verein gesucht?` → `Sie hat im Internet gesucht.` — a direct lift. |

## The Reading exposure ruling — independently re-audited

The ruling forbids "a check statement, choice item or open question whose ANSWER depends on a
topic-9–12 form". I re-solved all **58 checks and 46 questions** asking, for each, what actually
carries the key, and I agree with the author's single hit and its removal: old lesson 7 check 1
(`Lena wohnt seit einem Jahr in Köln.` against `Vor einem Jahr ist sie nach Köln gezogen.`) was
decidable only by converting `vor + Dat` → `seit + Dat`, a pure topic-12 contrast. It is gone.

Everything else is keyed on content words, numbers, weekdays/seasons, or adjective **stems**
(`griechisch/italienisch`, `erster/dritter Stock`), never on an ending, a pronoun switch or a
temporal conversion. The three places a topic-9–12 form still appears inside a check or question
are all **verbatim echoes** of the text, where no conversion is required:
`konnte` (L1 c4, echoed from `Von dort konnte ich alles zu Fuß erreichen`), `ihnen` (L5 c3, for the
text's `uns` — but the key rides on `Platz am Fenster`, and no falsch reading exists), and
`Bis Freitag` (L2 Q5, echoed word for word). N3 below is the only one I would still touch.
Note also that `nach`, `seit`, `um/am/im` are **A1** dative/time prepositions in this level file,
not topic 12 — so `Nach zwei Tagen`, `Nach dreißig Minuten`, `seit fünf Jahren`, `im März`,
`im Sommer`, `am ersten Abend` are all outside the ruling's scope. I checked each.

## Gates I ran myself

- `node verify.mjs` → `OK — 8 Rewrites + 2 Prüfungslektionen, 0 Fehler.` (exit 0). Word counts
  reported: 133 / 133 / 130 / 142 / 132 / 143 / 140 / 132 / 140 / 131.
- **Mutation tests of the two new rules (6 injections):** re-injected lesson-7 `seit`/`vor` item →
  caught (`Antwort hängt an einer Themen-9–12-Form: "seit" steht im statement, aber nicht im
  zitierten Text`); a fabricated `musste`-conversion statement → caught; `title_de` drift → caught;
  `title_en` drift → caught; a second `Als` → caught; an **open question** doing the `vor`→`seit`
  conversion → **MISSED** (N2 below).
- My own independent re-implementation, re-run on the new files: all ten `word_count` values exact,
  no sentence over 14 words, `weil` once in the whole deliverable and never in a check statement,
  zero relative clauses / full-verb Präteritum / Genitiv / reflexives / Futur / Passiv /
  Superlativ, `als` ≤1 per text (case-insensitive), every `explanation_de` a literal substring of
  its own `content_de`, no duplicate statement, no English in a German field, DE/EN paragraph
  parity, ids in live order and both title fields identical to the live rows.
- `node scripts/reading-from-json.mjs …` → exit 0, 8 UPDATEs + 2 INSERTs. Repo `git status` clean.

## Remaining findings (none blocking)

| # | file:path | severity | quote | why | fix |
|---|---|---|---|---|---|
| N1 | rewrites → `Der Sportverein`, check 1 (the replacement) | MINOR | `"Lena spielt Volleyball."` → richtig, explanation `"Im Text steht: In ihrem Stadtteil gibt es einen Volleyballverein."` | I solved it richtig cold, and richtig is the only sensible answer — but only via a four-sentence chain (club exists → Probetraining → `Jetzt ist sie Mitglied` → `ihre Mannschaft`). The quoted explanation, alone, does **not** establish that Lena plays volleyball: the rewrite dropped the live text's explicit `Lena hat … einen Volleyballverein **gefunden**`, which is what tied her to that club. The replacement is therefore more inferential than the item it replaced, in a set whose other nine explanations are decisive. | Restore the link in the text — `Lena hat im Internet gesucht und einen Volleyballverein gefunden.` (+2 w, 140 → 142) — or extend the quote to `… Zuerst hat Lena ein Probetraining gemacht. … Jetzt ist sie Mitglied.` |
| N2 | verify.mjs (topic-9–12 gate) | MINOR | `const inStatement = exposureForms(c.statement_de);` | The new gate scans check statements only; `question_de`/`answer_de` are never passed through `exposureForms`, so an open question doing exactly the banned `vor`→`seit` conversion passes (I injected one — exit 0). No data defect rides on it: I audited all 46 questions by hand and none converts. | Run the same statement/quote comparison over each question's `question_de + answer_de` against `content_de`. |
| N3 | rewrites → `Beim Arzt`, questions[4] | MINOR | `"Bis wann darf die Person nicht arbeiten?"` → `"Bis Freitag darf sie nicht arbeiten."` | The one open question carrying a topic-12 form. It is a verbatim echo, so it passes the author's own echo standard — but `level-a2.1.md` names `bis wann?` as topic 12's target question, so on a strict reading of the ruling this is the last survivor of the class. Wants a conscious sign-off rather than silence. | Either sign it off in `notes.md` beside the `konnte`/`ihnen` echoes, or swap it for a question with no temporal form (`Was hat die Ärztin der Person gegeben?` → `Sie hat ihr ein Rezept gegeben.`). |
| N4 | rewrites → `Ein Umzug nach Hamburg` | MINOR (nit) | `"Die Kinder wollten zuerst nicht umziehen."` … `"Zuerst haben die Webers eine Wohnung gesucht."` | The restored sentence pushed `zuerst` into two sentences three apart, now reading as an editing seam. | `Am Anfang wollten die Kinder nicht umziehen.` |
| N5 | rewrites → `Meine Reise nach Wien` | MINOR (nit) | `"… bin ich die Ringstraße entlanggegangen."` | Correct and natural German, but `entlang-` is not in the level file's separable-prefix list (`ab/an/auf/aus/ein/mit/nach/vor/zu/zurück`); it is new receptive vocabulary introduced to fix a style nit. Permitted by the exposure ruling, worth naming rather than discovering later. | Keep, or the plainer `Am ersten Tag bin ich zur Ringstraße gegangen.` |
| N6 | `src/components/ReadingChecks.jsx` (integration) | MINOR (carried) | heading `Richtig oder falsch?` / `True or false?` | Both exam rows are 5 × `choice`, so the card heading describes neither. Author cannot fix it (read-only repo); it is now recorded in `notes.md`. | Integrator: make the heading depend on the check types, or accept and note it. |

No fix introduced a new defect: I re-checked every touched word count, the antecedent of `Damit`
in lesson 4, the rf pattern of lesson 7 after the swap (`rrfrf`, 2 falsch, still unique and
non-alternating), the paragraph structure of lesson 6 after the insertion, and the exam-9 item set
after both edits — all clean.

VERDICT: PASS

The blocking item is genuinely gone and its replacement distractor is unsupported by the text, as
it should be. Eleven of thirteen minors are fixed at the source rather than papered over, and the
two that are not are correctly pushed to the coordinator and the integrator. `verify.mjs` grew two
real gates that I broke on purpose and could not slip past. What is left is one weak explanation
(N1), one gate that stops at the check statements (N2), and four nits — none of them a reason to
hold the PR.
