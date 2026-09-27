# Course v2 — BLUEPRINT (binding)

**Date:** 2026-09-27 · **Status:** BINDING for every later course-v2 workflow (W2 curriculum, W3 materials, W4
review, W5 build). · **Companion:** [`SCHEMA.md`](SCHEMA.md) is the binding data model. · **Precedence:**
`DECISIONS.md` > this blueprint > `SCHEMA.md` > the W2 drafts in `curriculum/` > the proposals in `proposals/`.
Where this document and a proposal disagree, this document wins; where it is silent, ask the orchestrator,
do not reach back into a proposal.

**How it was made.** Synthesis of Proposal C (production rails; winner of the DaF and production judges) with
Proposal A's exam layer (winner of the revenue judge) and Proposal B's completion and first-week layer, fixing
every must-fix the three judges raised. Inputs read: `DECISIONS.md`, `inputs/db-snapshot-2026-09-27.md`,
research memos 01–14 (memo 14 required), the three proposals, the W2 drafts, and the repo files named in §11.
One new check was made on the web: § 5 Abs. 1a EntgFG (eAU) at <https://dejure.org/gesetze/EntgFG/5.html>
(read 2026-09-27; gesetze-im-internet.de returned 503), and § 4 ArbZG at
<https://dejure.org/gesetze/ArbZG/4.html> for the SCHEMA example. No MCP tool was called.

**Citation convention.** `[m01]`…`[m14]` = `research/01…14-*.md` (each carries its primary URLs). A URL inline
is a primary source. **(design)** = a decision of this blueprint, not a finding. **(derived)** = our arithmetic,
inputs shown. **(snippet)** = seen only in a search snippet. **(unverified)** = could not be confirmed. No design
number (minutes, hours, caps, thresholds) may appear in public copy until it has been measured ([m13] impl. 9).

**Vocabulary used below.** *Unit* = Lektion (one situation ≈ one week). *Lernschritt* (LS) = one sitting of
≤ 25 min. *Lane* = one exam format (e.g. telc B1). *Teil* = one exam part (e.g. telc B1 Leseverstehen 3).
*Teil template* = the registry record of a Teil's exact format. *Block* = an authored exam-shaped item set
written against one Teil template. *Spur-Karte* (lane card) = a block written for a secondary lane.
*Plateau* = the review station after units 3, 6, 9. *.1 / .2* = the first / second half of a CEFR level.

---

## 0. Owner summary

1. We build **eight separate courses (A1.1–B2.2), 12 units each**, one everyday situation per week. Every unit ends in
   one speaking and one writing task in the format of the learner's exam, scored instantly on that exam's published
   criteria and always labelled as an automated practice score, never an exam result or a teacher's correction.
2. **One primary exam per level at launch:** Start Deutsch 1 (A1), Goethe A2, telc B1, telc B2. telc A2, DTZ (only for
   Integrationskurs participants), Goethe/ÖSD B1 and Goethe B2 follow as add-on "lane packs" in the same waves.
3. The **.1 courses** introduce every exam part and end with a *Teil-Karte* and a dated plan (no demoralising partial
   score). The **.2 courses** end with three full practice exams (two in the add-on lanes), scored by the real pass
   rule, then a review-only week. Progress is shown per exam module on the exam's own scale, never as "bestanden".
4. Content is written by AI agents against frozen registries and fast machine checks (spelling, level, a blind
   solver, exam formats) and leaves review only at **0 BLOCKER / 0 MAJOR** per unit.
5. **Before any paid v2 course promises AI grading** three things must be true: purchase-aware AI entitlement on the
   server, counsel's answer on the FernUSG question, and **your decision whether a trial or Pro subscription still
   opens paid levels** (today it does, which undercuts every half-level price). See §1.5 and §13.
6. Engineering starts now in parallel with curriculum. A1 and B1 are authored together, then A2, then B2. Designed
   hours are 38–72 per half-level; nothing about hours is published until measured.

---

## 1. Product and positioning

### 1.1 Who buys, and what forces the purchase

| Priority | Segment | Size and trigger | Exam and deadline | Entry |
|---|---|---|---|---|
| **Lead (volume)** | Spouse-visa A1 candidates, reached first through India's English search | 35,720 spouse Start Deutsch 1 exams at the Goethe-Institut in 2024, 62 % passed, ≈13,400 failed attempts (derived) ([Drs. 21/175](https://dserver.bundestag.de/btd/21/001/2100175.pdf), [m10] §2.1); "goethe a1 exam" 27,100 searches/month in India (db snapshot) | SD1 (Goethe = telc A1) or ÖSD A1; the embassy decides ([BAMF leaflet](https://www.bamf.de/SharedDocs/Anlagen/DE/MigrationAufenthalt/Ehegattennachzug/ehegattennachzug.pdf?__blob=publicationFile&v=9)) | free A1.1 → A1.2 (€40) |
| **Revenue core** | B1 "zum Bleiben" (Einbürgerung, Niederlassung) | 332,500 naturalisations in 2025 ([Destatis PD26_186](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html)); 318,550 DTZ candidates in 2025, 55.0 % reached B1 ([Drs. 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf)); "telc b1 prüfung" 12,100/month ([m02] §5) | telc B1 (Germany), DTZ (only inside the Integrationskurs system, [m02] §3), Goethe/ÖSD B1 (abroad) | B1.1 + B1.2 (€120) |
| Bridge | A2 for work entry, Ausbildung, English-track students | [m10] §2.4–2.5 | Goethe A2 / telc A2 | A2.1 + A2.2 (€100) |
| Channel | B2 for care and recognition, Studienkolleg | 32,000 nurse recognitions in 2025 ([Destatis PD26_295](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_295_212.html)); "telc b2 prüfung" 8,100/month ([m03] §6) | telc B2 / Goethe B2 (DTB B2 later) | B2.1 + B2.2 (€130) |

Business truth today (db snapshot, `weekly_metrics` 2026-09-21): 1,656 users, 23 sign-ups in 7 days, **2 course sales
ever, both €0**, AI writing uses 0 and AI speaking uses 10 in 7 days. The moat is unproven with our users; §10.9 sets
the decision point.

### 1.2 What we sell per half-level

Prices are from `src/data/pricing.js` (`SUBLEVEL_PRICES_EUR`). Counts are **(design)**; the copy derives them from
`course.json`, never retypes them (§8.1).

| Course | Price | Role on the exam path | Closing block | Lanes at launch (+ packs) | Designed hours (§2.1) |
|---|---|---|---|---|---|
| **A1.1** | free | first half of SD1; every SD1 Teil in miniature, untimed | Halbtest (untimed) → **Teil-Karte** + dated plan | SD1 | ≈38 |
| **A1.2** | €40 | completes SD1; closes the Goethe A1 grammar inventory ([m06] F2) | Diagnose (week 1) · **3 Modelltests** · review week · Wiederholungsplan | SD1 (+ ÖSD ZA1 pack v1.1) | ≈46 |
| **A2.1** | €50 | first half of A2 | Halbtest per lane → Teil-Karte + plan | Goethe A2 (+ telc A2 pack) | ≈44 |
| **A2.2** | €50 | completes A2 (A2+ conversation, connected writing) | Diagnose · 3 Modelltests (Goethe A2), 2 (telc A2) · review week | Goethe A2 (+ telc A2 pack) | ≈52 |
| **B1.1** | €60 | first half of B1 | Halbtest per lane → Teil-Karte + plan | telc B1 (+ DTZ pack, + Goethe/ÖSD B1 pack) | ≈52 |
| **B1.2** | €60 | completes B1; every B1 Teil at full length | Diagnose · 3 Modelltests (telc B1), 2 (DTZ, Goethe/ÖSD B1) · review week · Wiederholungsplan | telc B1 (+ DTZ, + Goethe/ÖSD B1) | ≈70 |
| **B2.1** | €65 | first half of B2; both B2 genres at reduced length | Halbtest per lane → Teil-Karte + plan | telc B2 (+ Goethe B2 pack) | ≈55 |
| **B2.2** | €65 | completes B2; exam-length texts and timings | Diagnose · 3 Modelltests (telc B2), 2 (Goethe B2) · review week | telc B2 (+ Goethe B2; DTB B2 v1.1) | ≈72 |

Every course has the same shape: 12 units, 3 Plateaus, a closing block, ≥ 24 exam-format AI-scored Aufgaben (two per
unit) plus 36 AI-scored micro-outputs, a published Inhaltsverzeichnis and a Teilnahmebescheinigung. **Honesty line
for every .1 course, first screen of its page:** „A2.1 ist die erste Hälfte des Wegs zur A2-Prüfung. Alle
Prüfungsteile lernen Sie hier kennen; die komplette Prüfung üben Sie in A2.2." ([m10] impl. 1, [m03] impl. 10).

**Access terms.** One-time price, no auto-renewal, no credits, no expiry; "lifetime" defined in the terms as access
for as long as the platform operates ([m13] impl. 16). A moved exam date moves the plan, never the access.

### 1.3 Positioning

The field sells teachers and graders as separate products: courses teach but do not score exam output, mock apps
score but barely teach, humans do both but ration it ([m08] §4). We teach **and** score, in the learner's exam
format, on the learner's schedule. Draft positioning line (must pass the copy lint, §9.1 LGL):

> „Ein Online-Kurs, der auf Ihre Prüfung zuläuft: jede Schreib- und Sprechaufgabe sofort nach den veröffentlichten
> Kriterien Ihrer Prüfung ausgewertet – automatisch, als Richtwert – und ein Plan bis zu Ihrem Termin."
> EN (India): *"An online course that runs to your exam date. Every speaking and writing task is scored instantly
> against your exam's published criteria — an automated practice score, never an exam result."*

Not used: "the way your exam does" or any wording suggesting the AI grades like an examiner, until agreement with
human raters has been measured and published ([m13] impl. 10). Mock counts are proof points, never the headline
(mocks sell for €7–25 and the official ones are free, [m08] §2.11 and impl. 8).

### 1.4 Launch scope: one primary lane per band, secondary lanes as packs

| Band | Primary lane (3 Modelltest forms) | Secondary lanes (2 forms, ship as packs) | Later (v1.1) | Why |
|---|---|---|---|---|
| A1 | **SD1** = Goethe A1 = telc A1 (one item bank) | — | ÖSD ZA1 pack (own task types, 10-min prep oral) | one format serves Goethe and telc ([m01]) |
| A2 | **Goethe A2** | telc A2 | ÖSD ZA2 not planned | India/abroad buyers sit Goethe; telc A2 formats do not transfer (phone notes, 3-of-4 letter, joker cards, [m01] §4) |
| B1 | **telc B1** | DTZ (gated: „nur für Teilnehmende am Integrationskurs"), Goethe/ÖSD B1 | — | German demand telc 12,100 ≫ DTZ 4,400 > Goethe 1,900 per month ([m02] §5); ÖSD ZB1 = Goethe B1 ([m02] §4) |
| B2 | **telc B2** | Goethe B2 | DTB B2 | telc B2 8,100 vs Goethe B2 1,300 per month ([m03] §6) |

**Rules.**
- A lane is **live** only when its whole pack has passed review: every lane-exact block the coverage rules need
  (§2.4), its Plateau Teile, its Halbtest or Diagnose, its Modelltest forms, and calibrated rubric profiles (§4.6).
  Product pages, onboarding and the lane picker list live lanes only.
- The DTZ lane is offered only after an explicit question („Sind Sie in einem Integrationskurs oder haben Sie einen
  besucht?"), carries the fixed label, and is never sold as its own product ([m02] §3, [m08] impl. 4).
- **Nothing is "rendered" across lanes.** Item counts, text sizes, play counts and preparation modes differ per
  lane (telc LV3 10:12 with x, Goethe L3 7:10 with 0, DTZ L2 5 items; prep 20 / 15 / 0 min), so every block is
  authored against one lane's Teil template. Task families (§2.3) group teaching; they do not generate items.
- No DTB-format task appears outside the DTB lane.

### 1.5 Entitlement: the prerequisite that decides whether per-level pricing holds

**Current state (verified in the repo 2026-09-27).**
- `hasLevelAccess(level)` in `src/contexts/SubscriptionContext.jsx` returns true for any level when `hasAccess` is
  true, and `hasAccess = isInFreeTrial() || hasActiveSubscription()`. `TRIAL_DAYS = 7` (`src/data/marketing.js`).
  So a new user can open B1.2 during the trial, and any live subscription opens every level.
- Every course purchase writes a `plan_type: 'course'` subscriptions row with a 90-day Pro window
  (`netlify/functions/lemonsqueezy-webhook.mjs`, `proDays: 90`). During those 90 days a €40 A1.2 buyer passes
  `hasAccess` and therefore `hasLevelAccess` for B1.2 and B2.2 as well.
- The AI functions have no concept of a purchase: `getTier()` (`netlify/functions/_shared/speakingUsage.mjs`) reads
  only subscription tier, `is_subscribed` and `trial_ends_at` ([m12] §4). After the 90-day window a buyer is
  `free_expired`: writing is refused except the free course allowance, speaking is wallet-only.
- `COURSE_TASK_KEY_RE = /^(a\d\d)-l\d\d$/` in `evaluate-writing.mjs` matches only A-level `-lNN` keys, so any
  `b11-…` key, or a key shaped like `a12-u04-sw`, silently falls out of the course allowance.

**Required before the first paid v2 sale (build, §10):**
1. A server-side, purchase-aware **course AI allowance** per bought half-level, lifetime, in `evaluate-writing`,
   `speaking-session`/`speaking-turn`/`evaluate-speaking` and `score-readaloud`. It counts first attempts, revisions,
   micro-outputs and mock parts, and has a daily fair-use cap (§4.8).
2. The v2 task-key scheme and a new key regex, fixed together, with a test over all eight prefixes (SCHEMA §2).
3. A v2 content gate `hasCourseAccess(level)` = level free (A1.1) **or** a purchase whose product covers the level
   (`course_a1_2` … `course_b2_2` and the legacy band keys `course_a1` … `course_alle` keep resolving).
4. The owner decision in §13 D1: whether trial/Pro additionally open v2 paid content. **Recommendation:** no —
   v2 paid content and its AI allowance follow the purchase only; trial and Pro keep the existing tools (X-Ray,
   open speaking with the wallet, the old course while it lives). Either way the "3 Monate Pro inklusive" claim in
   `pricing.js`/`marketing.js` must be reconciled in the same PR (keep it as a bonus for the existing tools, or drop it).
5. B-levels leave `COMING_SOON_LEVELS` (both `pricing.js` twins) only when (a) review passed (DECISIONS 2026-09-26),
   (b) items 1–3 are live, and (c) counsel has answered §1.6 rule 1. (b) and (c) are prerequisites, not owner sample
   checks, so DECISIONS stands.

**Content delivery is not the boundary.** All deterministic content (items, keys, texts) reaches the client in any
design (the Astro grammar pages are already ungated). The enforceable product boundary is the **server-side AI
grading allowance plus progress and the Teilnahmebescheinigung**. v2 therefore ships unit data as lazy-loaded,
hash-named chunks behind the route guard, never at predictable public URLs, and does not pretend this is DRM. The
first-lesson-leak decision (`docs/HANDOFF-2026-09-03.md` §11) stays the owner's (§13 D6).

### 1.6 The legal edge, as rules

1. **Counsel answers before any paid v2 course with AI grading goes live, A1.2 included** ([m13] open q. 1). The free
   A1.1 is outside the FernUSG and may show the whole moat ([m13] impl. 6).
2. The course is **self-study material plus automated practice software**. No page, checkout, e-mail or in-app text
   offers a right to ask content questions, a human correction, or "we" monitoring progress; support is „Zugang,
   Technik, Rechnung" ([m13] impl. 1–2).
3. **AI results are formative, private, retryable and never a gate**; every graded surface carries the fixed label
   „Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein Prüfungsergebnis. Richtwert."
   ([m13] impl. 3–4). An AI-interaction notice appears at first contact (AI Act Art. 50(1), applying since 2 Aug
   2026, [m13] §4): „Diese Aufgabe wertet eine KI automatisch aus. Es liest keine Lehrkraft mit."
4. **Paid courses contain no runtime AI that answers questions about the material.** Every explanation, rule card and
   item feedback is authored and static; runtime AI appears only in role-play speaking and in scoring the learner's
   own production. `explain-answer` stays off in paid v2 courses until counsel clears it ([m13] impl. 5).
5. **Plan suggestions, Teil-Trainer cards and board suggestions derive from deterministic results only** (receptive
   Teile, counts of attempts), or are labelled dismissible suggestions; AI scores steer nothing (AI Act Annex III
   3(b), obligations from 2 Dec 2027 per [m13] §4).
6. **No scores in provider-pushed e-mails or in the Wochenbericht e-mail, and no share link**, until counsel clears
   them (B's R4). In-app, the learner sees everything.
7. Completion document = **Teilnahmebescheinigung** listing completed units only, no score, with the fixed line „Kein
   Sprachzertifikat. Kein Ergebnis des Goethe-Instituts, von telc oder ÖSD. Nicht als Sprachnachweis für Visum,
   Aufenthalt oder Einbürgerung geeignet." ([m13] impl. 7).
8. Exam names only inside purpose phrases („Vorbereitung auf …", „im Prüfungsformat von …", „kein offizielles
   Prüfungsmaterial"); no logos; **no page or product title starts with an exam mark** ([m13] impl. 8,
   [§ 23 MarkenG](https://www.gesetze-im-internet.de/markeng/__23.html)).
9. No outcome claims: no „bestanden" about our tests, no pass probability, no „in X Wochen", no „prüfungsreif"
   ([m13] §5, impl. 9). TTS is „Computerstimme" ([m13] impl. 11).
10. Every factual Landeskunde, legal or administrative claim in course data carries `sources`, `factsCheckedOn`,
    `currentAsOf` and `exceptions` (SCHEMA §3.4), and a reviewer confirms it is **current**, not merely sourced.
    The case that made this rule: two proposals taught the „gelber Schein"; since 1 Jan 2023 statutorily insured
    employees no longer present a paper certificate (§ 5 Abs. 1a EntgFG, eAU;
    [dejure](https://dejure.org/gesetze/EntgFG/5.html),
    [Bund-Verlag](https://www.bund-verlag.de/aktuelles~Die-neue-eAU-Das-Ende-des-gelben-Scheins~.html)).
11. Existing buyers get v2 as a **free upgrade** with a notice on a durable medium; old content stays reachable until
    the notice is sent (§ 327r BGB, [m13] impl. 15).
12. Legal pages (complete Impressum, Nutzungsbedingungen with a § 327r change clause and the AI tools described as
    software) before B-levels go live ([m13] impl. 16).

### 1.7 The free-to-paid bridge

- **A1.1 end:** Teil-Karte (§5.3) + a dated plan into A1.2, with A1.2 Unit 1 named. No partial 60/100 total.
- **Free Diagnose for every .2 course** (the "Einstiegscheck" for buyers who arrive from search at A2/B1/B2): one
  full-length Teil per module in the chosen lane, including one productive Teil scored on the lane's rubric, one per
  account per lane. Free, therefore outside the FernUSG ([m13] impl. 6).
- **Einstufung** (placement, §5.7) routes near-level learners straight to the .2 course with a tested-out credit.
- The .1 page shows the pair's full Teil-Matrix. A pair offer at checkout is the owner's call (§13 D5).
- Funnel metric: ".1 completers who buy the .2 within 30 days" in `weekly_truth_metrics()`.

### 1.8 Unit economics (derived; to be replaced by measurements)

| Input | Value | Source |
|---|---|---|
| Lemon Squeezy fee | 5 % + 50¢ per sale, +1.5 % on international transactions | (snippet) <https://www.lemonsqueezy.com/pricing> |
| VAT | prices are gross; a German consumer's €60 contains €9.58 VAT at 19 % | derived |
| Net per €60 sale, German buyer | 60 − 9.58 − 3.00 − 0.50 ≈ **€46.9** | derived |
| Net per €60 sale, international buyer | local VAT/GST handled by the merchant of record; if 18 % (unverified): 60/1.18 − 3.50 − 0.90 ≈ **€46.4** | derived |
| AI writing cost per fully engaged learner | ≈ 54 full-rubric calls (Aufgaben + revisions + Plateaus + mocks) × ≈ $0.014 + ≈ 54 micro calls × ≈ $0.002 ≈ **$0.9** on Sonnet 4.6 list prices with prefix caching | derived from C §3.5 (pricing page read 2026-09-27) |
| AI speaking cost | **unmeasured** (STT ≈ $0.003/min per [m12] §4, snippet) | measure in the pilot |

**Rule:** no copy says „unbegrenzt"; the terms state a fair-use cap (§4.8) whose numbers the owner sets after the
pilot measures real cost per engaged learner (§13 D8).

---

## 2. Program architecture

### 2.1 The frame (identical for all eight courses)

- **12 units per half-level**, in **4 Etappen of 3** (the course map's nested finish lines). This is Menschen's grain
  (12 Lektionen per Teilband, a Modul-Plus every 3), Lingoda's 12 chapters and Netzwerk neu's Plateau cadence
  ([m14] §B1, §B3, §B9, §G1).
- **Plateau P1–P3 after units 3, 6, 9** (Modul-Plus style, §5.2). After unit 12: the .1 **Abschluss** (Halbtest →
  Teil-Karte → plan) or the .2 **Prüfungswochen** (Modelltest A → repair → B → repair → C → review week).
- **One unit ≈ one week at the Standard pace** ([m09] impl. A1). Pace presets: *Leicht* (1 unit per 2 weeks),
  *Standard* (1 unit per week, default 4 learning days), *Intensiv* (2 units per week). A near exam date adds
  sessions, never longer sessions.
- **The unit of use is a Lernschritt of ≤ 25 min** with a save point at its end; resume is at item level.
  Exam-mode sessions of a .2 course may run the lane's real time (e.g. telc B2 Schreiben 30 min) and are marked as
  such (§3.4).
- **Required core vs optional depth.** Required: the 12 units (all Lernschritte incl. both Aufgaben), the Plateaus
  and the closing block's first form. Optional, never gating: Fokus-Karten, „Mehr üben" pools, Lesemagazin /
  Hörmagazin (the extensive strand, §3.7), Modelltests B/C, extra Teil-Trainer.
- **Designed hours = the floor from Proposal A (≈ 38–65 h per half-level, ≈ 287 h A1.1→B1.2),** because the core
  must bring learners to the level, not merely through it: the BAMF course needs 600 UE (≈ 450 h) for A1→B1 and only
  55 % reach B1 ([Drs. 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf)). The anatomy in §3 yields:

| (design) hours | A1.1 | A1.2 | A2.1 | A2.2 | B1.1 | B1.2 | B2.1 | B2.2 |
|---|---|---|---|---|---|---|---|---|
| 12 units incl. daily review | 34.2 | 35.2 | 38.4 | 39.0 | 46.2 | 50.6 | 48.6 | 53.0 |
| Plateaus P1–P3 | 2.5 | 3.0 | 3.5 | 3.5 | 3.75 | 4.5 | 3.75 | 4.5 |
| Closing (Halbtest + Teil-Karte; or Diagnose + mocks + repair + review week) | 1.0 | 7.5 | 1.5 | 9.5 | 1.75 | 14.5 | 2.0 | 14.0 |
| Onboarding, Einstufung | 0.5 | — | 0.5 | — | 0.5 | — | 0.5 | — |
| **Total ≈** | **38** | **46** | **44** | **52** | **52** | **70** | **55** | **72** |
| Proposal A floor | 38 | 46 | 44 | 51 | 48 | 60 | 52 | 65 |

Cumulative A1.1→B1.2 ≈ 301 h (floor 287). Benchmarks: Menschen ≈ 48 UE (≈ 36 h) per Teilband ([m14] §B1); BAMF
100 UE ≈ 75 h per half-level (derived, [m08] §2.13). **Publish only measured hours**, as „Richtwert: ca. N Stunden,
gemessen an … Lernenden" ([m13] impl. 9). Post-launch rule: a Lernschritt whose measured p50 exceeds 25 min is
**split, never lengthened** (B).

### 2.2 How a unit's content is decided (precedence)

1. **Situational order.** Each unit is one *Handlungssituation* organised as a Handlungskette (Rahmencurriculum §6.3
   via [m04] F2). The exam rides on the unit; it never is the unit.
2. **Topic placement follows the Lehrwerk consensus** ([m14] §C: M = Menschen L#, S = Schritte plus Neu (volume) L#,
   N = Netzwerk neu K#, Si = Sicher! L#, As = Aspekte neu K#). Every unit cites ≥ 2 placements or carries a logged
   `deviation.reason` (DECISIONS 2026-09-27).
3. **Among consensus situations, pick the one whose natural texts are exam text types** (an announcement at the
   station → H-DURCHSAGE; flat ads → L-ANZEIGEN). Where the books split, choose the placement that brings a Teil
   earlier and log it.
4. **Can-do boundaries:** if the target exam tests a can-do at this level, it belongs here; otherwise the RC's lowest
   level decides ([m04] impl. 3). Can-dos are written in our own ich-Form with source tags, never verbatim CEFR or
   Goethe text on screen ([m05] impl. 8).
5. **Grammar comes from the situation** and obeys the spine (§2.5); **exam weight shapes practice time, not topics**
   (SD1 gives 2 points per question/request and 1 per answer, so every A1 unit drills question and request forms;
   planning is 30/75 of telc B1 oral and 20/50 DTZ task points, so a planning round runs in every B1 unit).
6. **DaF-neutral core; DaZ-only situations (Amt, Kita, Jobcenter) and DaF alternatives (Hotel, Reise) live in
   optional Fokus-Karten** of the same unit ([m14] §E8, §F6). Every unit carries a BAMF Handlungsfeld tag.

### 2.3 The exam layer: families, lanes, Teil templates

**Task families** (23, grouping only; from Proposal A §2.1): H-DETAIL, H-DURCHSAGE, H-GESPRÄCH, H-MEINUNG, H-VORTRAG,
L-KURZTEXT, L-ANZEIGEN, L-ORIENTIERUNG, L-ARTIKEL, L-STANDPUNKT, L-REGELN, L-ÜBERSCHRIFT, L-TEXTLÜCKE, SB-LÜCKE,
W-FORMULAR, W-NACHRICHT, W-MAIL, W-MEINUNG, S-VORSTELLEN, S-FRAGEKARTEN, S-BITTEN, S-ERZÄHLEN/S-FOTO, S-PLANEN,
S-PRÄSENTIEREN, S-DISKUTIEREN. A family tells an author what skill a Teil trains and which Teile of other lanes
train the same skill. It never produces an item.

**Lane profiles** hold exam facts as versioned data with a `stand` date and `sources` (`registries/lanes/<lane>.json`,
SCHEMA §4.3). Launch facts (primary sources in [m01]–[m03]):

| Lane | Written part (plays) | Oral part | Pass rule the scorer implements | Source |
|---|---|---|---|---|
| **sd1** Start Deutsch 1 = Goethe A1 = telc A1 | 65 min, no break. Hören ≈ 20 min, 6/4/5 items, **H2 played once**; Lesen 25 min, 5/5/5; Schreiben 20 min: form (5) + message ≈ 30 words, 3 Leitpunkte | ≈ 15 min, group ≤ 4, no preparation; 3 + 6 + 6 points; question/request 2, answer/reaction 1 | Goethe: raw × 1.66 → 100, ≥ 60 overall, no part floor; < 35 written cannot be rescued. telc view: 36/60 | [DB-A1](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf), [TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) |
| **ga2** Goethe A2 | 90 min, no break. Lesen 4 × 5; Hören 4 × 5 (**H2, H3 once**); Schreiben: SMS 20–30 + E-Mail 30–40 words | ≈ 15 min, pair, no preparation (≈ 20 s to read cards) | ≥ 60/100 **and** ≥ 45/75 written **and** ≥ 15/25 oral; < 50 % of the words → E → task 0 | [DB-A2](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf), [US-A2](https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf) |
| **ta2** telc A2 | Hören ≈ 20 (H1 phone notes 2×, **H2 once**, H3 2×); Lesen + Schreiben 50: form from documents + ≈ 40-word letter, 3 of 4 points; paper only | ≈ 15 min, pair, no preparation; 3 + 6 + 6 | 36/60; numbers in H1/S1 must be exact | [UT-A2](https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf) |
| **tb1** telc B1 | 150 min: Lesen + Sprachbausteine 90 (LV 5/5/10, SB 10/10), Hören ≈ 30 (**HV1 once**, HV2/HV3 twice), Schreiben 30 (4 Leitpunkte, 45 pts) | ≈ 15 min, pair, **20 min preparation**; 15 + 30 + 30 | ≥ 135/225 written **and** ≥ 45/75 oral; compensation inside the written part | [telc UT B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) |
| **dtz** DTZ | 100 min, no break: Hören 4/5/8/3 (**all once**), Lesen 5/5/6/3/6, Schreiben 30 (A or B, 4 Leitpunkte) | ≈ 16 min, pair, **no preparation**; photo + home country; Teil 3 = 20 of 50 task points | B1: H+L ≥ 33/45, Schreiben ≥ 15/20, Sprechen ≥ 75/100; certificate = Sprechen B1 + one of the other two; Sprechen below A2 = no certificate | [g.a.s.t. Übungssatz 1](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) |
| **gb1** Goethe/ÖSD B1 (modular) | Lesen 65 (6/6/7/7/4), Hören ≈ 40 (10/5/7/8; **H2, H3 once**), Schreiben 60 (≈ 80 + ≈ 80 + ≈ 40 words; 40 + 40 + 20 pts) | ≈ 15 min, pair, **15 min preparation**; 28 + 40 + 16 + Aussprache 16; Teil 2 = 5 fixed slides | each module ≥ 60/100; Lesen/Hören raw × 3.33 (18/30 passes); E zeroes a writing task | [DFB B1](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf), [Modellsatz B1](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) |
| **tb2** telc B2 | 140 min: Lesen + SB 90, Hören ≈ 20 (**all once**), Schreiben 30: (halb)formelle E-Mail ≥ 150 words, 3 of 4 Leitpunkte (or 2 + own), Betreff | ≈ 15 min, pair, 20 min preparation; 3 × 25 (7/7/7/4) | ≥ 135/225 written **and** ≥ 45/75 oral | [telc UT B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) |
| **gb2** Goethe B2 (modular) | Lesen 65 (9/6/6/6/3), Hören ≈ 40 (10/6/6/8; **H1, H3 once**), Schreiben 75: forum post ≈ 150 words (60 pts) + message to a superior ≈ 100 words (40 pts) | ≈ 15 min, pair, 15 min preparation; Vortrag ≈ 4 min + questions; pro/contra discussion; Aussprache 16 | each module ≥ 60/100; E zeroes a writing task | [DFB B2](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf), [Modellsatz B2](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) |
| oza1 ÖSD ZA1 (v1.1) | 55 min; Lesen 16, Hören 15 (H1, H3 once), Schreiben form + reply ≥ 25 words | ≈ 10 min, **10 min preparation with notes** | written ≥ 38/75 with Lesen ≥ 6, Hören ≥ 6, Schreiben ≥ 4; oral ≥ 12/25; modular | [DB-ZA1](https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf) |
| dtb2 DTB B2 (v1.1) | see [m03] §3 | no preparation; restating a partner's point | ≥ 144/240, 3 of 4 skills ≥ 60 % | [BAMF DTB Übungstest](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/b2-modelltest-bsk.pdf?__blob=publicationFile&v=10) |

Known open format questions stay flagged in the lane files: telc B1 has no official word count (prep sites say
120–150, unverified); Goethe B2 says „circa" in print and „mindestens" digitally ([m03] §1); the Goethe A2 oral
per-Teil split is reconstructed (unverified, [m01]).

**Teil templates** (`<lane>.<teil>`, e.g. `tb1.lv3`, `dtz.s2`, `gb1.sch2`) are the unit of exam fidelity: module,
item count, options, no-match option, plays, reading time, time box, text-type and text-length band, word band,
rubric profile, preparation minutes, `scaffoldAllowedIn` (which .1 courses may simplify it), and
`transfersTo` — the list of other lanes' templates this one counts for **in appearance counting only** (§2.4). The
five lane agents author `transfersTo`; the Prüferin reviewer confirms it. Examples: `ga2.l2 → ta2.l1` (directory with
"anderes Stockwerk"), `ga2.l4 → ta2.l3` (ads with a no-match option), `ga2.sp3 ↔ ta2.sp3` (calendar planning),
`tb1.lv3 ↔ gb1.l3 ↔ dtz.l2` (situations → ads), `tb1.m3 ↔ gb1.sp1 ↔ dtz.s3` (planning), `tb1.sb1 → dtz.l5` (letter
cloze). Lane-only Teile have no inbound transfer: e.g. `ta2.h1` phone notes, `ta2.s2` 3 of 4, `tb1.sb2`, `tb1.m2`,
`dtz.s2` photo + Heimatland, `dtz.schreiben` A/B choice, `gb1.sch2`, `gb1.sp2`, `gb1.sp3`, `gb1.l4`, `gb2.l2`.

**Modes (enforced from the lane profile; the author cannot override them).**

| | Lernmodus (default in all learning steps) | Prüfungsmodus (Plateau Teile, Diagnose, Modelltests; LS4 on request, and by default in .2) |
|---|---|---|
| Audio | replay, 0.85× speed, transcript after the first unaided listen ([m09] §7) | the Teil's play count and reading time (e.g. 60 s before Goethe B1 Hören 2), natural tempo; transcript only after submission |
| Feedback | after each item, one retry | at the end, per Teil |
| Time | untimed; minutes shown per step | Teil/lane timer; auto-submit at zero |
| Writing editor | word counter, Leitpunkt checklist, umlaut keys | word counter (Goethe's digital exams offer one, (snippet) <https://www.goethe.de/de/spr/prf/ddp.html>), **no spellcheck/autocorrect/autocapitalise**, umlaut keys, checklist hidden |
| Speaking | hints, word bank (A1.1 only), repeat on request | the lane's preparation time and notes (sd1 0, ga2 0, ta2 0, dtz 0, gb1 15, tb1 20, tb2 20, gb2 15, oza1 10 min); notes collapse to ≤ 5 keywords while speaking |
| Paper lanes (telc A1/A2) | — | optional 3–5 min answer-sheet transfer step in one Modelltest form ([m01] impl. 11) |
| Feeds the Prüfungsstand (§5.6) | never | only if the block is **full length** |

### 2.4 Coverage rules (hard validator rules, per lane)

| Id | Rule |
|---|---|
| **COV-1 Appearance** | For every **live** lane L of a course and every Teil T of L: (lane-exact blocks of T) + (blocks whose template lists T in `transfersTo`) **≥ 2 in a .1 course, ≥ 3 in a .2 course**; and lane-exact blocks of T **≥ 1 (.1) / ≥ 2 (.2)**. A lane-only Teil (no inbound transfer) counts lane-exact blocks only, so it needs ≥ 2 / ≥ 3 of its own. |
| **COV-2 Full length before Modelltest A** | For every live lane of a .2 course and every Teil: **≥ 2 lane-exact blocks at full length, runnable in Prüfungsmodus**, located in the paired .1 course or in the .2 course before Modelltest A (LS4 blocks, Aufgaben, Plateau Teile, Diagnose). |
| **COV-3 Prüfungsfokus per unit** | 2–4 Teile of the primary lane per unit; in a .2 unit ≥ 1 of them at full length in Prüfungsmodus by default. |
| **COV-4 Module balance** | Each module (Hören, Lesen, Schreiben, Sprechen; plus Sprachbausteine for telc) holds ≥ 15 % of the course's Prüfungsfokus slots in the primary lane. |
| **COV-5 Productive rotation** | Every productive Teil of the primary lane recurs at least every 4th unit (task repetition after about a week pays, [m09] §8). |
| **COV-6 .2 lane-exactness** | In a .2 course every block and Aufgabe a learner of lane L meets is lane-exact for L (Spur-Karten fill every slot whose primary block is not L's template). In a .1 course a non-exact block shown to an L learner carries its origin label („im Format: telc Deutsch B1, Leseverstehen 3 – in Ihrer Prüfung: Goethe-Zertifikat B1, Lesen 3"). |
| **COV-7 Launch completeness** | A lane is live only if COV-1…COV-6 hold for it in both courses of its band. |

### 2.5 Grammar allocation

**Source of truth:** `registries/grammar-spine.json` (SCHEMA §4.2), built from the consensus tables in [m06] F3 and
the hinge decisions below. Each spine point carries its introducing unit (receptive and productive), its
construction detectors, its contrast partner, its error tags and its Lehrwerk placements.

**Rules (validator GRM, §9.1).**
1. **≤ 2 new spine points per unit** (a receptive-only first introduction counts as new), plus **≤ 1 chunk preview**
   (a lexicalised form taught as a phrase, e.g. *Ich habe … gemacht* before the Perfekt is systematic). A
   *Wiederholung* is not new. A proposal's rule must not contradict its own tables: the tables in §2.8 obey this rule
   and the validator enforces it on the specs.
2. **Receptive before productive** where the spine says so (Passiv A2.2 rec → B1.2 prod; Konjunktiv II Vergangenheit
   B1.2 rec → B2.1 prod; Präteritum A2.2 rec → B1.1 narrative).
3. **Interleave contrast partners** from the second Lernschritt that uses a point (Akkusativ/Dativ, Perfekt
   haben/sein, weil/denn, wenn/als, deshalb/trotzdem); the UI warns that scores dip while contrasts are mixed
   ([m09] §3).
4. **Presentation:** A levels deductive — each Situation-LS headed by one model sentence (Schritte A–C, [m14] §E2),
   rule card ≤ 60 words at A1 / ≤ 80 at A2, English twin. B levels inductive — the learner fills the rule table from
   the text, then the card; a Grammatik-Rückschau closes the unit ([m14] §E16).
5. **Inventory floors:** the full Goethe A1 inventory by the end of A1.2 (all six modal verbs, Imperativ Sie/du/ihr,
   war/hatte, Perfekt of the listed verbs, danken/gehören/helfen, dies-/welch-, Genitiv-s with names, Wortbildung
   -er/-in/-ung and receptive un-/-los/-bar; [TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf)
   pp. 100–106). The full Goethe A2 inventory by the end of A2.2 (Präteritum of haben/sein/kommen/sagen and the modal
   verbs, möchte/hätte/könnte, attributive adjective endings, Komparation, dass/weil/wenn/W-Nebensatz, deshalb;
   [Fit 2](https://www.goethe.de/pro/relaunch/prf/zh/Pruefungsziele_Testbeschreibung_A2_Fit2.pdf) pp. 106–109).
6. **The systematic Perfekt is placed early in A1.2 and never in exam weeks:** chunks A1.1 U11 → haben with regular
   and irregular participles A1.2 U5 → sein A1.2 U8 → trennbar/untrennbar/-ieren A1.2 U10.

**Hinge decisions (recorded once in the spine):** Dativ first through fixed-case prepositions (A1.2 U3), then dative
verbs and pronouns (A1.2 U7) ([m06] impl. 4). Wechselpräpositionen through verb pairs stellen/stehen, legen/liegen,
hängen (A2.1 U2); feedback names the verb ([m06] impl. 5). weil/dass/wenn in A2.1 ([m06] impl. 6). Relativsatz
Nom/Akk A2.2 U9 → Dat/Präp B1.1 U3 → wo/was B1.2 U4 → wer/was B2.1 U5 ([m06] impl. 8). Futur I in B1.1 U6
([m06] impl. 9). Konjunktiv II ladder: chunks A1.2 → sollte/könnte (Rat) A2.1 U8 → wäre/hätte/würde A2.2 U2 → unreal
conditions B1.1 U9 → past receptive B1.2 U10 → past productive B2.1 U7 ([m06] impl. 11). Zweiteilige Konnektoren
B1.2 U3/U7, review B2.1. Konjunktiv I in B2.2 (both Aspekte and Sicher! put it there, [m06] F3). B2 split: B2.1
carries what both B2 writing genres need first (Passiversatz, NVV, Zustandspassiv); Nominalisierung productive in
B2.2 ([m06] open q. 2 decided).

**Error tags shared with the AI graders** ([m06] impl. 15): `v2-inv`, `verb-final`, `satzklammer`, `case-np`,
`case-pp`, `gender-article`, `adj-ending`, `perfekt-aux-participle`, `connector-position`, `n-dekl`, `reflexive`,
`register`, `spelling-meaning`. Weighting by level: an inversion error at B1 is flagged, not scored as a level
failure (MERLIN via [m06] F4).

### 2.6 Vocabulary allocation and the SRS arithmetic

**Targets** ([m07] impl. 1): new Lernwortschatz entries per half-level — A1.1 330–360, A1.2 300–330 (cumulative
≥ 95 % of the A1 list), A2.1 and A2.2 330–360 each (cumulative ≥ 95 % of A2), B1.1 and B1.2 520–580 each
(cumulative ≥ 95 % of B1), B2.1 and B2.2 700–850 each (cumulative ≈ 4,000 lemmas). Productive share ≈ 50 % at A,
≈ 45 % at B1, 35–40 % at B2.

**Selection order per unit** ([m07] impl. 2): situation and can-dos → headwords of the matching Goethe Themen field
→ exam essentials (instruction language: *ankreuzen, zuordnen, Antwortbogen, Leitpunkt*; the Teil's Redemittel) →
frequency fill → off-list only when the situation needs it (≤ 15 % A, ≤ 25 % B1; tagged extension, receptive unless
justified) → at B1.2–B2 the Leipzig CC BY frequency bands, **never DeReWo** (non-commercial). 3–4 thematic
mini-blocks of 6–10 words, blocked in the unit, interleaved only in review; feminine forms listed with the masculine.
**The lexicon is authored before the units** (W2): a unit's texts may introduce only the lemmas assigned to it, plus
≤ 3 glossed receptive extras per text. Every new word ≥ 2× in its unit's inputs and in ≥ 2 later units; every input
text ≥ 95 % known tokens, extensive reading ≥ 98 %. The Goethe lists never enter the repo; `list_ref` tags come from
a private reference table ([m07] impl. 6–7).

**SRS arithmetic (fixes the judges' must-fix: B's 12-new-cards/day cap gives 432 < 520, and 5–7 min/day cannot meet
the B-level retrieval targets).** Model (design; seconds per review to be measured):
- New cards are **seeded by content** when their Lernschritt is completed — the SRS never holds taught words back.
  So new cards per half-level = the lexicon count exactly (LEX-05 checks it against the target).
- Targets before the exam date: **≥ 5 successful spaced retrievals per productive card** (≥ 3 of them in the
  productive direction), **≥ 3 per receptive card** ([m09] impl. B8). Pattern and Redemittel cards count as
  productive. Lapse overhead × 1.25. In-lesson warm-ups supply 18 spaced retrievals per unit (3 Situation-LS × 6).
- Reviews per week at the Standard pace = (per-unit reviews × 1.25 − 18); daily minutes = reviews ÷ 6 review days ×
  seconds per review.

| Level | New words / unit | Productive / receptive | Pattern + sentence cards / unit | Reviews needed / unit (×1.25) | Daily reviews (6 days) | s / review | **Daily minutes needed** | **Daily review budget (design)** | Intensiv (2 units/week) |
|---|---|---|---|---|---|---|---|---|---|
| A1 | 26–29 | 50 / 50 % | 6 | ≈ 168–182 | ≈ 25–27 | 8 | ≈ 3.6 | **6 min** | ≈ 7 min |
| A2 | 28–30 | 50 / 50 % | 6 | ≈ 182 | ≈ 27 | 9 | ≈ 4.1 | **7 min** | ≈ 8 min |
| B1 | 43–48 | 45 / 55 % | 8 | ≈ 273 | ≈ 42 | 10 | ≈ 7.1 | **9 min** | ≈ 14 min |
| B2 | 60–70 | 37.5 / 62.5 % | 8 | ≈ 353 | ≈ 56 | 10 | ≈ 9.3 | **11 min** | ≈ 19 min |

(derived: e.g. B1 = (20.6 × 5 + 25.2 × 3 + 8 × 5) × 1.25 = 273; (273 − 18) / 6 = 42.5; × 10 s = 7.1 min.)

**Consequences, all binding:** (1) no daily new-card cap that withholds content; instead a **first-review stagger
ceiling** of 30 (A) / 40 (B1) / 50 (B2) new cards per day — overflow gets its first review +1–2 days later, which
keeps Intensiv learners' first days sane without losing words. (2) Daily review budgets per level as in the table
(A1 6, A2 7, B1 9, B2 11 min); the plan shows the Intensiv figure honestly („Intensiv: ca. 19 Min. Wiederholung pro
Tag"). (3) Validator **SRS-01** recomputes the table from each course's real lexicon and card counts and fails when
the Standard-pace minutes exceed the budget; **SRS-02** simulates the capped ladder (§6.1) and fails when a card
introduced in U12 of a .2 course cannot reach its retrieval target with the exam 28 days after U12 (default plan) or
7 days after (minimum supported). If SRS-01 fails, the curriculum agent lowers the productive share toward the
lower bound or moves receptive words to the extensive strand — never raises the budget silently.

### 2.7 The serial cast (one continuing story, A1.1 → B2.2)

One cast bible per band (`casts/a1.json` …) plus one series arc (`casts/series.json`), owned by one story architect.
**Every main character is preparing an exam**, so the story models the plan, the nerves, the mock and the retake;
each B-level co-protagonist sits a different lane. Scenes ≤ 90 s at A1, ≤ 2 min above; **every scene carries a task**;
every unit ends on a one-line cliffhanger resolved in the next unit's Start, including across course boundaries
([m14] §E3, §F5; B §6.6). Persona facts are checked by CON-01.

| Band | Cast (design) | Exam arcs |
|---|---|---|
| A1 | **Priya Nair** (28, Kochi → Leipzig, joins her husband **Arjun**, software developer); **Emre Yıldız** (İzmir, her online-course partner, sitting SD1 a second time); **Frau Schulz** (course leader, Sie) | Priya SD1 first attempt; Emre's Wiederholungsplan after a failed Sprechen |
| A2 | Priya's first job at the front desk of **Brandt Elektrotechnik**, Leipzig: **Herr Brandt** (boss, Sie), **Jan Wolf** (colleague, du); Emre arrives for an Ausbildung | Priya Goethe A2; Emre telc A2 |
| B1 | Leipzig: **Amal** (Einbürgerung, telc B1), **Tomasz** (Integrationskurs, DTZ), **Lina** (Kraków, Goethe B1 for an Ausbildung visa); Priya and Emre continue | one character per B1 lane |
| B2 | Hamburg: **Daniel** (nurse, recognition, telc B2) in a care home; **Sara** (Studienkolleg, Goethe B2); Priya as a team assistant | two care units at general-language level ([m10] impl. 5); Fachsprache stays with MedMeister |

No stereotypes; names, countries, languages and du/Sie relationships are registry facts. Clips carry the
„Computerstimme" label until human recordings exist.

### 2.8 The eight topic sequences (binding draft)

**How to read.** One row per unit. *HF* = BAMF Handlungsfeld (1 Ämter, 2 Arbeit, 3 Arbeitssuche, 4 Aus-/Weiterbildung,
5 Banken/Versicherungen, 6 Betreuung/Kinder, 7 Einkaufen, 8 Gesundheit, 9 Medien, 10 Mobilität, 11 Unterricht,
12 Wohnen; A–E cross-cutting: A Migration, B Gefühle/Meinungen, C Konflikte, D Soziale Kontakte, E Lernen).
*Grammatik neu* lists the ≤ 2 new spine points (· separates them; parentheses = chunk preview or Wiederholung).
*Prüfungsteile* = primary-lane Teile of the unit's Prüfungsfokus; in .2 tables **bold** = full length in
Prüfungsmodus by default. *Spur* = the secondary-lane blocks this row already plans (the curriculum agent adds more
until COV-1/COV-2 hold). *Leaders* = Lehrwerk placements ([m14] §C).

**The W2 drafts** (`docs/course-v2/curriculum/*.json|md`) are input, not law: curriculum agents carry their can-do
texts, source tags, text types, vocabulary sets and exam mappings **onto these rows**. Row order, grammar placement
and exam coverage follow this blueprint; a curriculum agent may swap situations inside a level only with a logged
`deviation` that keeps every validator rule green. Where a draft places a full mock at checkpoints 3–4 (before the
last new content), this blueprint's rule wins: Modelltests come after unit 12 (§5.4).

#### A1.1 — „Erste Kontakte" (free · lane SD1 · untimed miniatures in Lernmodus; board opt-in)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (SD1) | Leaders |
|---|---|---|---|---|---|---|
| 1 | Hallo, ich bin Priya | begrüßen, sich vorstellen, Herkunft, Sprachen · D | sich begrüßen/verabschieden; Name, Herkunft, Sprachen nennen und erfragen | Präsens Sg. inkl. *sein*, du/Sie · W-Frage, Verb auf Position 2 | Sp1, H1 | M1, S1, N1 |
| 2 | Wie schreibt man das? | buchstabieren, Zahlen, Telefonnummer, Anmeldung · 1 | Namen buchstabieren; Nummern sagen und verstehen; ein Formular ausfüllen | Präsens Pl. inkl. *haben* | S1, Sp1, H1 | M2, S1-E, N2 |
| 3 | Meine Familie | Familie vorstellen, Fotos · D | Familie vorstellen; nach der Familie fragen | mein/dein/Ihr · Ja/Nein-Frage, ja/nein/doch | Sp2, L1 | M3, S2, N5 |
| 4 | Was kostet das? | Lebensmittel, Preise, Supermarkt · 7 | nach Preisen fragen; einkaufen; Durchsagen im Laden | Artikel, Genus, Plural, er/es/sie · kein/nicht (*möchte* als Chunk) | H1, H2, Sp3, L2 | M4–5, S3, N4 |
| 5 | Das brauche ich | Dinge im Kurs und im Büro, bitten · 11, 2 | Gegenstände benennen; um etwas bitten | Akkusativ (den/einen/keinen) | Sp3, S2 (2 Leitpunkte) | M5–6 |
| 6 | Hier wohne ich | Wohnung, Wohnungsanzeigen, Nachbarn grüßen · 12 | die Wohnung beschreiben; kurze Anzeigen verstehen | *es gibt* + Akk. · Adjektiv prädikativ | L2, L1 | S4 — **deviation:** M14/N9 put Wohnen in A1.2; kept here with Schritte because SD1 Lesen 2 uses housing ads |
| 7 | Mein Tag | Uhrzeit, Tagesablauf, Öffnungszeiten · 11, 2 | Uhrzeit sagen/verstehen; den Tag beschreiben; Öffnungszeiten lesen | Uhrzeit, am/um/von … bis + Inversion · trennbare Verben | L3, H3 | M8, S5, N5 |
| 8 | Hast du am Samstag Zeit? | Freizeit, sich verabreden · D | Vorschläge machen; zu- und absagen | *können*, *wollen* + Satzklammer | S2, Sp2, H3 | M7–8, S6, N6 |
| 9 | Im Café | bestellen, bezahlen, Vorlieben · 7 | bestellen; sagen, was man (nicht) mag | *mögen/möchte* · Verben mit Vokalwechsel | Sp3, H1 | M9, N4 |
| 10 | Mit Bus und Bahn | Fahrkarte, Gleis, Durchsagen · 10 | Fahrkarte kaufen; Durchsagen verstehen | *müssen* (Imperativ *Sie* als Chunk) | H2, L3 | M10, N3 |
| 11 | Wie war dein Wochenende? | vom Wochenende erzählen, Online-Gruß · D | sagen, was man gemacht hat; einen kurzen Gruß schreiben | Perfekt als Chunks (8–10 Verben; *war/hatte* als Chunk) | S2, L1, Sp2 | M11–12, S7 (all families end A1.1 with the Perfekt) |
| 12 | Deutsch lernen – mein Plan | Kurs, Lernziele, Lernwege · 11, E | über Lernziele sprechen; sich für einen Kurs anmelden | — (Wiederholung) | Sp1, S1, H2, L3 → **Halbtest** | RC Unterricht — **deviation:** S7 Kinder/Schule (DaZ) and M12 Feste (DaF) split by audience; the neutral field is chosen, Kita-Anmeldung becomes a Fokus-DaZ card, Feste go to A1.2 U12 |

Coverage check (miniature appearances): H1 4, H2 3, H3 2, L1 3, L2 2, L3 3, S1 2, S2 3, Sp1 3, Sp2 3, Sp3 3.

#### A1.2 — „Den Alltag organisieren" (€40 · lane SD1; ÖSD ZA1 pack v1.1)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (SD1) | Leaders |
|---|---|---|---|---|---|---|
| — | *Diagnose* (week 1, free) | SD1 mini-mock: one full Teil per module | — | — | H1, L2, S2, Sp2 | — |
| 1 | Mein Arbeitsalltag | Beruf, Arbeitszeiten, Kollegen, früher · 2 | über die Arbeit sprechen; sagen, was man früher war und hatte | *war/hatte* (Präteritum sein/haben) | **L1**, Sp1, S1 | S8, N7, M19 |
| 2 | Einen Termin machen | Termine in Praxis und Amt · 8, 1 | Termine vereinbaren und verschieben; Datum verstehen | temporale Präp. vor/nach/in/seit/ab/bis · Ordinalzahlen, Datum | **H3**, S1 | S9, M16, M24 |
| 3 | Wie komme ich zum Rathaus? | Weg fragen und beschreiben · 10 | nach dem Weg fragen; Wegbeschreibungen verstehen | Dativ nach mit/zu/bei/aus/von/nach; *Wo?* + Dativ | **L3**, H1 | M13, M15, S11 |
| 4 | Beim Arzt | Körper, Beschwerden, Anweisungen · 8 | Beschwerden nennen; Anweisungen verstehen | *sollen* · Imperativ *Sie* (systematisch) | **Sp3**, L3, H3 | M18, S10, N8 |
| 5 | Ich bin krank – ich sage ab | krankmelden, entschuldigen, neuer Termin · 2, 11 | sich krankmelden; sich entschuldigen und einen Grund nennen | *denn* · Perfekt mit *haben* (Partizip regelmäßig/unregelmäßig) | **S2**, H3, Sp3 | M23, S14 (denn); RC 84, 149 (worked example §3.8) |
| 6 | Wohnung und Nachbarn | Anzeigen, Hausordnung, Nachbarn · 12 | Anzeigen und Hausordnungen verstehen; sich vorstellen | sein/ihr/unser/euer + Genitiv-s bei Namen · *dürfen* (*man* als Chunk) | **L2**, L3, Sp1, Sp2 | M14, N9, M21 |
| 7 | Die Jacke gefällt mir | Kleidung, Kaufhaus · 7 | Kleidung kaufen; Gefallen ausdrücken; Durchsagen im Kaufhaus | Dativverben + Dativpronomen (gefallen, passen, stehen, helfen, danken, gehören) · welch-/dies- | **Sp2**, H1, H2 | M22, S13, N11 |
| 8 | Bahnhof und Flughafen | Reise, Verspätung, Durchsagen · 10 | Durchsagen verstehen; von einer Reise berichten | Perfekt mit *sein* | **H2**, L2 | N12, RC 142–145 |
| 9 | Kannst du mir helfen? | Haushalt, Nachbarschaftshilfe · 12, D | um Hilfe bitten; Anweisungen geben | Imperativ du/ihr · Akkusativpronomen | **Sp3**, L1 | M20–21 |
| 10 | Online bestellen | Bestellung, Kundenservice, Problem melden · 7 | etwas bestellen; höflich bitten; ein Problem melden | Perfekt trennbar/untrennbar/*-ieren* (*würde/könnte* als Chunk) | **S1**, H1, L1 | S12, RC 110–111 |
| 11 | Wetter und Wochenende | Wetter, Ausflug, Einladung · D, 9 | über das Wetter sprechen; vergleichen; auf Einladungen antworten | Komparation (gut/besser/am besten, gern/lieber, als/wie) | **H1**, H2, S2, L2, Sp2 | M23, N12; M22 (Komparation) |
| 12 | Feste und Glückwünsche | Einladung, gratulieren, das Du anbieten · D | gratulieren; Einladungen annehmen/absagen | Wortbildung -er/-in/-ung (un-/-los/-bar rezeptiv) (*würde gern* als Chunk) | **Sp1–Sp3** (group round), S2 | M24, S14 |
| — | *Prüfungswochen* | Modelltest A, B, C (65 + 15 min) + repair + review week | — | — | all 11 Teile | — |

Goethe A1 inventory closed: modal verbs (A1.1 U8–U10, A1.2 U4, U6), Imperativ Sie/du/ihr (U4, U9), war/hatte (U1),
Perfekt (A1.1 U11 chunks; U5, U8, U10), danken/gehören/helfen (U7), dies-/welch- (U7), Genitiv-s (U6), Wortbildung
(U12). **ÖSD ZA1 pack (v1.1):** six Teil-Trainer (ads with a distractor, JA/NEIN, sign → picture, note-taking,
prep-with-notes oral with photo and role play) and one ZA1 mock per form, scored per module with its floors.

#### A2.1 — „Kontakte pflegen, Dinge erledigen" (€50 · lane Goethe A2; telc A2 pack)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (GA2) | Spur (ta2) | Leaders |
|---|---|---|---|---|---|---|---|
| 1 | Neu hier: Kontakte knüpfen | Smalltalk mit neuen Kollegen, über sich erzählen · D, A | von sich und dem eigenen Weg erzählen; Gründe nennen | *weil* (Perfekt-Wiederholung) | Sp1, Sp2, L3 | Sp1 | M1, S3-L1, N1 |
| 2 | Die neue Wohnung | Umzug, Möbel stellen, Nachbarn · 12 | sagen, wohin etwas kommt und wo es steht | Wechselpräpositionen über stellen/stehen, legen/liegen, hängen | H2, Sp3, L4 | H3 | M2, S3-L2 |
| 3 | Kommst du zu meiner Feier? | einladen, zu-/absagen, schenken · D | einladen; zu- und absagen; über Geschenke sprechen | Dativ + Akkusativ im Satz (Stellung der Pronomen) | S1, Sp3, H3 | S2 (3 von 4) | S3-L7 (split M15) |
| 4 | Einkaufen: vergleichen und bestellen | Gerät kaufen, Kaufhaus-Wegweiser · 7 | Produkte vergleichen und beschreiben; sich orientieren | Adjektivendungen nach ein-/kein-/mein- | L2, L4, S2 | L1, L3 | M4, S3-L3 |
| 5 | Im Restaurant | reservieren, bestellen, reklamieren · 7 | reservieren; bestellen; höflich reklamieren | Adjektivendungen nach der/die/das | H3, S2, Sp1 | H2 | M10, M5 |
| 6 | Mit der Bahn unterwegs | Buchung, Durchsage, Verspätung · 10 | Durchsagen verstehen; Reisepläne ändern | *wenn* | H1, L2 | H3 | M3, N5; RC 143–144 |
| 7 | Am Telefon im Job | Mailbox, Rückruf, Termin verschieben · 2 | Mailbox-Nachrichten verstehen und notieren; Nachrichten weitergeben | reflexive Verben (Akkusativ) | H1, S2, Sp1 | H1 (Telefonnotiz) | M9, M11, S3-L4, N6 — **worked example in SCHEMA.md** |
| 8 | Gesund bleiben | Arzt, Ratschläge · 8 | Beschwerden beschreiben; Ratschläge geben | *sollte/könnte* (Rat) · *deshalb* | H4, Sp2, S1 | Sp2 | M7–8, S3-L5 |
| 9 | Immer online? | Medien, Handy, Fehlermeldungen · 9 | über Mediennutzung sprechen; Meinung sagen | *dass* | L1, S1 | L2 (R/F) | N3 (split M15) |
| 10 | Schule, Ausbildung, Kurse | Schulzeit, Bildungswege, Kursanmeldung · 4, A | über die Schulzeit erzählen; Bildungswege vergleichen | Modalverben im Präteritum | L3, Sp2 | S1, H1, Sp1 | N2, S3-L6 |
| 11 | Gefühle, auch online | gratulieren, trösten, sich ärgern · B | Freude, Ärger, Mitgefühl ausdrücken; auf Posts reagieren | Verben mit Präposition + wo(r)-/da(r)- (Einstieg) | S1, L1, H4 | Sp2, S2 | N4; M18 (split) |
| 12 | Hier und dort | Leben vergleichen, Reisebericht · A | vergleichen; von einer Reise erzählen | *einer/keiner/welche* | H2, L4, Sp3 → **Halbtest** | L2, S1, Sp3 → Halbtest | S3-L3 (split N12), M22 |

Coverage check GA2 (appearances): L1 2, L2 2, L3 2, L4 3, H1 2, H2 2, H3 2, H4 2, S1 4, S2 3, Sp1 3, Sp2 3, Sp3 3.

#### A2.2 — „Gespräche führen, Probleme lösen" (€50 · lane Goethe A2; telc A2 pack)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (GA2) | Spur (ta2) | Leaders |
|---|---|---|---|---|---|---|---|
| — | *Diagnose* (free) | lane mini-mock | — | — | H1, L4, S1, Sp1 | Diagnose ta2 | — |
| 1 | Sprachen lernen | Sprachcafé, Lernbiografie · 11, E | ein Gespräch beginnen, in Gang halten, beenden | *als* (temporal) | **Sp1**, L1, H3 | Sp1 | M13, N8 |
| 2 | Wir planen einen Ausflug | gemeinsam planen, Kompromiss · D | vorschlagen, ablehnen, sich einigen | Konjunktiv II *wäre/hätte/würde* (Vorschlag, Wunsch) | **Sp3**, H2, L4 | Sp3 | S4-L8, N12 |
| 3 | Im Hotel | buchen, umbuchen, Probleme · 10 | höflich nachfragen; eine Buchung ändern | indirekte Fragen mit *ob*/W-Wort | **S2**, L2, H1 | L1 | M16, S4-L11/12, N7 |
| 4 | Unterwegs: Wege und Zwischenfälle | Treffpunkt, Weg, kleiner Unfall · 10, 8 | Wege genau beschreiben; von einem Zwischenfall berichten | lokale Präp. (gegenüber, durch, an … vorbei) · woher/wo/wohin | **H1**, L4, S1 | H3 | M17, M22 |
| 5 | Handy, Vertrag, Kündigung | Tarif wählen, kündigen · 7, 5 | Angebote vergleichen; einen Vertrag ändern oder kündigen | Passiv Präsens (rezeptiv) | **L1**, S2 | S2 | M14, S4-L10 |
| 6 | Mein Geld | Bank, Karte verloren · 5 | Bankgeschäfte erledigen; einen Verlust melden | Adjektivendungen ohne Artikel, *Was für ein?* (+ Komparativ attributiv) | **Sp2**, H3, L3, H2 | L3 | S4-L9/L13, RC 112 |
| 7 | Die Heizung ist kaputt | Mängel melden, Vermieter, Handwerker · 12 | ein Problem schildern; um Reparatur bitten | *lassen* · *trotzdem* | **S2**, H4, L3, Sp3 | H1 | S4-L13, M21; RC 156–157 |
| 8 | Wetter, Klima, Umwelt | Wetterbericht, Umwelt im Alltag · 9 | Wetterberichte verstehen; über Umwelt sprechen | Verben mit Präposition + worauf/darauf (produktiv) | **H4**, H1, L1, Sp2 | H2 | M18 |
| 9 | Mein Weg | Schule, Ausbildung, Lebenslauf · 3, 4 | einen Lebenslauf verstehen und erzählen | Relativsatz Nominativ/Akkusativ | **L3**, Sp2, H4 | L2 | M23; N K12 (split S5/LIN = B1.1) |
| 10 | Bewerbung und Vorstellungsgespräch | Stellenanzeige, Gespräch · 3 | Stellenanzeigen verstehen; im Gespräch Auskunft geben | Präteritum (rezeptiv: regelmäßig/unregelmäßig) | **L4**, Sp1, H2 | Sp2 | M24, RC 100 |
| 11 | Post vom Amt *(tauschbar: Fokus-DaF Reiseplanung)* | Fristen, Nachfragen · 1 | Behördenbriefe verstehen; nachfragen | *seit/seitdem*, *bis* (Konnektor) | **L2**, S1, H3, Sp3 | S1 | M21, RC 76–77; M22 |
| 12 | Lebensstationen | zusammenhängend erzählen · A, D | eine Lebensgeschichte gegliedert erzählen | — (Textkonnektoren zuerst/danach/zum Schluss: Wiederholung) | **S1**, **H2**, **H3**, Sp2 | Sp1, S2 | N10–11, S4-L14 |
| — | *Prüfungswochen* | Modelltest A, B, C (Goethe A2, 90 + 15 min); telc A2 A, B | — | — | all Teile | — | — |

#### B1.1 — „Im Alltag mitreden" (€60 · lane telc B1; DTZ and Goethe/ÖSD B1 packs)

B skeleton from here (§3.2). **Every B1 unit's Sprechen session contains a planning round of ≥ 3 min with the moves
checklist** (vorschlagen · reagieren · widersprechen/Alternative · sich einigen · wer macht was), because planning
is 28/100 (Goethe Sp1), 30/75 (telc M3) and 20/50 DTZ task points ([m02] §6).

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB1) | Spur (dtz · gb1) | Leaders |
|---|---|---|---|---|---|---|---|
| 1 | Was gibt's Neues? | Freundschaft, Neuigkeiten · D | von Erlebnissen erzählen; eine persönliche E-Mail schreiben | Präteritum als Erzähltempus | SA, M1, LV2, HV2 | dtz S1 · gb1 Sch1 | M1–2, Si1, S5-L1 |
| 2 | Wir organisieren ein Fest | planen, wer macht was · D | gemeinsam planen; Aufgaben verteilen | *falls* | M3, HV2 | dtz S3 · gb1 Sp1 | M6, M12, Si2 |
| 3 | Wenn die Bahn nicht fährt | Verspätung, Umbuchung, Durchsagen · 10 | Durchsagen verstehen; umbuchen; sich beschweren | Relativsatz Dativ / mit Präposition | HV3, LV3 | dtz H1 · gb1 H1 | N1, Si3, S5-L2 |
| 4 | Ärger mit der Wohnung | Mängel, Vermieter, Nachbarn · 12 | Probleme schriftlich melden; Details erfragen | Genitiv + wegen/trotz/während (Präp.) | LV3, SA, SB1 | dtz Schreiben · gb1 L3 | M3, Si4, RC 155–156 |
| 5 | Das Gerät ist kaputt | reklamieren, Kundenservice · 7 | reklamieren; eine Lösung verlangen | *obwohl / trotzdem* | SB1, SA, M3 | dtz L5 · gb1 Sch3 | M4, N2 (clip) |
| 6 | Alles digital? | Technik, Medien, Zukunft · 9 | Vermutungen und Pläne äußern; Meinungen zuordnen | Futur I (Vermutung, Plan, Versprechen) | HV1, LV1, M2 | dtz H4 · gb1 H4 | M5, N6 |
| 7 | Unter Kollegen | Schichten tauschen, Absprachen · 2 | Absprachen treffen; Ziele begründen | *um … zu / damit* | M3, HV3, SB2 | dtz S3 · gb1 Sch3 | S5-L6, RC 84–85 |
| 8 | Welcher Kurs passt zu mir? | Beratung, Weiterbildung · 4 | sich beraten lassen; Angebote vergleichen | Infinitiv mit *zu* | LV3, M1, LV2 | dtz L2 · gb1 L3 | M7–8, Si5 |
| 9 | Beim Arzt und in der Apotheke | Beschwerden, Beipackzettel · 8 | erklären, was fehlt; Anweisungen verstehen; Rat geben | Konjunktiv II: Ratschlag, irreale Bedingung (Gegenwart) | LV2, M2, SB2 | dtz L4, S2 · gb1 L5 | M9, ÖIF B1 |
| 10 | Glück gehabt! | Erlebnisse, Wendepunkte · B | Erlebnisse in der richtigen Reihenfolge erzählen | Plusquamperfekt · *nachdem / bevor* | HV2, SA | dtz H3 · gb1 H3, L1 | M10–11, N3 |
| 11 | Menschen, die mir wichtig sind | Porträt, Vereinsblog · D | eine Person porträtieren; Menschen beschreiben | n-Deklination · Adjektive als Nomen | LV1, SB2, M1 | dtz L3 · gb1 Sch2 | M1, As B1+ K2 |
| 12 | Meine Ziele mit Deutsch | Lernziele, kurze Präsentation · E | Ziele begründen; kurz präsentieren | *da* (kausal) | HV1, LV1, M2 → **Halbtest** | dtz S2 · gb1 Sp2 (2-Min.-Version) → Halbtest je Spur | ÖIF B1, RC 36; M9 |

Coverage check tB1: LV1 3, LV2 3, LV3 3, SB1 2, SB2 3, HV1 2, HV2 3, HV3 2, SA 4, M1 3, M2 3, M3 3 (+ a planning round
in every unit). The overloaded Lektion of Proposal A (zu + Infinitiv, um … zu, da, während, bevor in one) is split
across U7, U8, U10 and U12.

#### B1.2 — „Selbstständig handeln und Stellung nehmen" (€60 · lane telc B1; DTZ and Goethe/ÖSD B1 packs)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB1) | Spur (dtz · gb1) | Leaders |
|---|---|---|---|---|---|---|---|
| — | *Diagnose* (free) | lane mini-mock | — | — | one Teil per module | per lane | — |
| 1 | Missverständnisse | Sprache, Missverständnisse klären · B, C | Missverständnisse klären; Meinung begründen | *darum/deswegen/nämlich* | **M2**, LV1 | dtz S1 · **gb1 Sch2**, L4 | M13 |
| 2 | Weiterbildung | Kurse vergleichen, Thema präsentieren · 4 | Angebote vergleichen; ein Thema präsentieren | Partizip I/II als Adjektiv | **LV3**, M1 | **dtz L2** · **gb1 Sp2 + Sp3**, H2 | M14, Si8 (compressed example §3.9) |
| 3 | Die Bewerbung | Stellenanzeige, Anschreiben, Nachfrage · 3 | sich schriftlich bewerben; telefonisch nachfragen | *nicht nur … sondern auch* · *sowohl … als auch* | **SA**, HV3 | **dtz Schreiben** · gb1 L3 | M15, S6-L8, RC 98–99 |
| 4 | Konflikt im Team | Besprechung, Standpunkte · 2, C | den eigenen Standpunkt einbringen; einen Kompromiss finden | Relativsatz mit *wo/was* · Ausdrücke mit *es* | **M3**, HV2 | dtz S3 · **gb1 Sp1** | N7 (clip), S6-L10, RC 100 |
| 5 | Werbung, Konsum, Geld | Kaufentscheidungen, Werbung · 7, 9 | Werbung kritisch lesen; Kaufentscheidungen begründen | Passiv Präsens (produktiv) · Passiv mit Modalverb | **LV2**, LV1 | dtz L1 · **gb1 L2** | S6-L9/10, N12, Si7 |
| 6 | Einspruch! | falsche Rechnung, Versicherung, Fristen · 1, 5 | schriftlich widersprechen; einen Schaden melden | Passiv Präteritum/Perfekt · *innerhalb/außerhalb* + Gen. | **SB1**, SA | **dtz L5**, L3 · gb1 Sch3 | RC 78, 111; M22 |
| 7 | Mitreden | Gesellschaft, Engagement, Meinungen wiedergeben (Mediation) · A, B | Meinungen wiedergeben und zwischen Positionen vermitteln | *weder … noch* · *entweder … oder* | **HV1**, M2 | **dtz H4** · **gb1 H4** | M18, S6-L11/12, N10 |
| 8 | Regeln und Anleitungen | Hausordnung, Anleitungen, Abläufe · 12 | Regeln genau verstehen; Abläufe erklären | *indem* · *sodass* | **SB2**, HV3 | **dtz L4** · **gb1 L5** | M20; ZM B1+ |
| 9 | Stadt oder Land? | Wohnort wählen, Führung · 12, 10 | Vor- und Nachteile abwägen; einer Führung folgen | *je … desto* · *brauchen … zu* | **HV3**, LV2 | dtz H2 · **gb1 H2** | M19, N11 |
| 10 | Geschichten von früher | Biografie, Heimat, Vergleich · A | über früher berichten; ein Foto beschreiben und vergleichen | *während* (Konjunktion) · Konjunktiv II Vergangenheit (rezeptiv) | **HV2**, M1 | **dtz S2** · **gb1 L1** | M22, S6-L13, M16–17 |
| 11 | Klima und Zukunft | Umwelt, Radiodebatte · 9 | Meinungen in einer Debatte zuordnen; begründet Stellung nehmen | *(an)statt / ohne … zu* · *als ob* | **LV1**, SA | dtz H2 · **gb1 H4**, Sch2 | M23–24 |
| 12 | Zurückblicken, weitergeben | Besprechung, Informationen weitergeben (Mediation) · 2, E | Informationen zusammenfassen und weitergeben | — (Modalpartikeln rezeptiv; Wiederholung) | **M1**, **SA**, SB2 | dtz S1 · gb1 Sch1, Sp3 | RC 86; S6-L14 |
| — | *Prüfungswochen* | Modelltest A, B, C (telc B1 150 + 15 min + 20 prep); DTZ A, B; Goethe/ÖSD B1 A, B (per module) | — | — | all Teile | — | — |

#### B2.1 — „Argumentieren und im Detail verstehen" (€65 · lane telc B2; Goethe B2 pack)

Genres at reduced length (telc SA ≈ 120 words, Goethe S1 ≈ 110, S2 ≈ 70); single play by default from here
([m03] impl. 8, 10). Topics follow Aspekte neu B2 K1–5 (the only verified per-Kapitel B2 titles); Sicher! aktuell
B2.1 titles are (unverified) ([m14] §B6).

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB2) | Spur (gb2) | Leaders |
|---|---|---|---|---|---|---|---|
| 1 | Heimat ist … | Identität, Ankommen · A | Standpunkte erläutern; über Erfahrungen berichten | Wortstellung im Mittelfeld · Stellung von *nicht* | M1, LV1 | L1 | As1, Si L1 |
| 2 | Wie wir miteinander reden | Gesprächskultur im Job · C, 2 | sich an Diskussionen beteiligen; nachfragen | Infinitivsatz vs. *dass*-Satz | M2, HV2 | Sp2 (verkürzt), H3 | As2 |
| 3 | Arbeit ist das halbe Leben? | Arbeitszeitmodelle · 2 | Vor- und Nachteile darstellen; Vorgesetzte informieren | Nomen-Verb-Verbindungen | LV2, SB2, HV3 | S2, H1 | As3, Si L5 |
| 4 | Beschwerde mit Anspruch | mangelhafte Dienstleistung · 7, C | sich formell beschweren; eine Forderung stellen | Passiv + Passiversatz (*lässt sich*, *ist zu*, *-bar*) | SA (B), SB1 | L3 | ZM B2 — **deviation vs Si L10**: the complaint genre needs it here |
| 5 | Zusammen wohnen | WG, Nachbarschaft · 12 | Probleme erörtern; gemeinsam Lösungen planen | Relativsatz mit *wer/was* (verallgemeinernd) | M3, LV3 | L4 | As4 (split Si L7) |
| 6 | Presse mit Haltung | Kommentare, Nachrichten · 9 | Standpunkte in Texten erkennen | Partizip I/II als erweitertes Adjektiv | LV1, HV1 | L4, S1 | Si L2 (split As10) |
| 7 | An die Vorgesetzte *(Pflege 1)* | Pflegeheim: Dienstplan, Überlastung · 2 | Probleme sachlich darstellen; Vorschläge machen | Konjunktiv II Vergangenheit (produktiv) | SA, M3, SB1 | S2 | [m06] ladder; [m10] impl. 5 |
| 8 | Anerkennung und Bewerbung | Anerkennung, qualifizierte Bewerbung · 3, 4 | Qualifikationen darstellen; Informationen erfragen | Zustandspassiv · *von/durch* im Passiv | SA (A), LV3, M1 | L5, Sp1 (verkürzt) | Si L2 (split As6); BSK |
| 9 | Ursachen und Folgen | Konsum, Klima: Hypothesen · B | Ursachen und Folgen erklären; Vermutungen äußern | Futur II (Vermutung) · Bedeutungen des Konjunktiv II | M2, HV2 | H2 | Si L5–6 (unverified) |
| 10 | Radio und Podcast | Interviews, einmal gehört · 9 | Standpunkte in Gesprächen erkennen | Verweiswörter (*es*, *da(r)-*) | HV1, HV3 | H1, H3 | As2, Si L3 |
| 11 | Wissenschaft im Alltag | Forschung verständlich · 4 | Sachtexte verstehen und zusammenfassen | Vergleichssätze (*je … desto*, *je nachdem*, als/wie) · Nominalstil (rezeptiv) | LV2, SB2 | L2 (Textlücke), H4 | As5 |
| 12 | Online zusammenarbeiten | Projekt, eigene Fehler kontrollieren · E | online im Team kommunizieren; eigene Fehler erkennen | *lassen* (veranlassen) | M1, SA → **Halbtest** | S1, Sp1 → Halbtest | Si L5 (unverified) |

#### B2.2 — „Wirkungsvoll diskutieren, vortragen, vermitteln" (€65 · lane telc B2; Goethe B2 pack)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB2) | Spur (gb2) | Leaders |
|---|---|---|---|---|---|---|---|
| — | *Diagnose* (free) | lane mini-mock | — | — | one Teil per module | Diagnose gb2 | — |
| 1 | Beziehungen | Freundschaft, Einstellungen · B | Einstellungen vergleichen; Gehörtes wiedergeben | subjektive Modalverben (*soll … haben*, *will … sein*) | **LV1**, HV1 | **L1** | Si7, As9 |
| 2 | Ein Vortrag | Vortrag halten, Fragen beantworten · E | einen Vortrag gliedern und halten | Nominalisierung ↔ Verbalisierung | **M1**, HV2 | **Sp1** | ZM B2 |
| 3 | Dafür oder dagegen? | Pro/Contra · C | argumentieren, widersprechen, zusammenfassen | konzessive und adversative Konnektoren (*zwar … aber*, *obgleich*, *wohingegen*, *während*) | **M2**, LV2 | **Sp2** | Si8–9, As10 |
| 4 | Service und Schadensersatz | verhandeln, Grenzen setzen · 7 | einen Schaden darlegen; Forderungen verhandeln | indirekte Rede: Konjunktiv I (Einstieg) | **SA** (B, ≥ 150 W), M3 | L3 | Si10, ZM B2+ |
| 5 | Essen, Gesundheit, Fitness | Studien, Ernährung · 8 | Informationen aus Vorträgen verarbeiten; Stellung nehmen | Modalsätze (*dadurch … dass*, *indem*) | **HV2**, LV2 | **S1** (≈ 150 W), **H2** | Si8, Si11, As6 |
| 6 | An der Uni | Studienordnung, Vorlesung · 4 | Regeln und Vorlesungen verstehen | Nomen, Verben, Adjektive mit Präpositionen | **LV2**, HV2 | **L5**, **H4** | Si9; [m03] impl. 11 |
| 7 | Kultur und Kunst | Kritiken, Kulturberichte · 9 | Kritiken verstehen und verfassen | erweitertes Partizipialattribut | **LV1**, SB2 | **L2** | As7 |
| 8 | Aus der Geschichte | Erinnerung, Berichte weitergeben (Mediation) · A | Berichte zusammenfassen und weitergeben | Konjunktiv I (Vergangenheit, produktiv) | **HV1**, M2 | H3 | As8 |
| 9 | Das Mitarbeitergespräch *(Pflege 2)* | Ziele, Kritik, Fortbildung · 2 | Kritik begründen und annehmen; Ziele vereinbaren | konditionale/konsekutive Konnektoren (*sofern*, *falls*, *sodass*, *folglich*) · Modalpartikeln | **M3**, SB1 | **S2** (≈ 100 W) | BSK 20.4, 52.1; Si L8 |
| 10 | Widerspruch einlegen | Bescheid, formell begründen · 1 | Bescheide verstehen; formell widersprechen | Präpositionen mit Genitiv (*aufgrund*, *hinsichtlich*, *bezüglich*) | **SA** (A/B), **SB1** | L4 | As10; BSK 39.3 |
| 11 | Sprache und Regionen | Dialekte, Reportagen, D-A-CH · 9 | Reportagen verstehen; Varietäten erkennen | Textkohäsion: Verweiswörter und Konnektoren | **HV3**, **LV3** | **H1** | Si12 |
| 12 | Ein Blick in die Zukunft | Szenarien, lebhafte Diskussion · B | Szenarien diskutieren | — (Futur II, Wiederholung) | **SB2**, **M2**, LV3 | **L3**, **L4**, **Sp2** | As10 |
| — | *Prüfungswochen* | Modelltest A, B, C (telc B2 140 + 15 min + 20 prep); Goethe B2 A, B (per module) | — | — | all Teile | — | — |

**Quotas the validator checks on the specs (ALL-06):** ≥ 1 online-interaction can-do per half-level; from B1.1
≥ 1 mediation can-do and ≥ 3 work units; B2 ≥ 2 care/health workplace units at general-language level; spiral
threads B1.1 → B2.2 (Beschwerde, Meinung, Konsultation, Weitergeben) each name their band step ([m05] §3).
