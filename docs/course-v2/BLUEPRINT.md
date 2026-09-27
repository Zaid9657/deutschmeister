# Course v2 — BLUEPRINT (binding)

**Date:** 2026-09-27 · **Status:** BINDING for every later course-v2 workflow (W2 curriculum, W3 materials, W4
review, W5 build). · **Companion:** [`SCHEMA.md`](SCHEMA.md) is the binding data model. · **Precedence (one
rule, stated identically in SCHEMA.md):** `DECISIONS.md` > this blueprint > `SCHEMA.md` > the W2 drafts in
`curriculum/` > the proposals in `proposals/`. SCHEMA.md is authoritative **only on field shapes, id patterns and
file layout**; it never overrides a count, a rule, a threshold or product behaviour stated here. Where this document
and a proposal disagree, this document wins; where it is silent, ask the orchestrator, do not reach back into a
proposal. Where this document would add a condition to a DECISIONS row, it can only recommend it and ask the owner
for a new row (§13 D14).

**How it was made.** Synthesis of Proposal C (production rails; winner of the DaF and production judges) with
Proposal A's exam layer (winner of the revenue judge) and Proposal B's completion and first-week layer, fixing
every must-fix the three judges raised. Inputs read: `DECISIONS.md`, `inputs/db-snapshot-2026-09-27.md`,
research memos 01–14 (memo 14 required), the three proposals, the W2 drafts, and the repo files named in §11.
One new check was made on the web: § 5 Abs. 1a EntgFG (eAU) at <https://dejure.org/gesetze/EntgFG/5.html>
(read 2026-09-27; gesetze-im-internet.de returned 503), and § 4 ArbZG at
<https://dejure.org/gesetze/ArbZG/4.html> for the SCHEMA example. No MCP tool was called. The critic pass
(Changelog at the end) added three publisher tables of contents, read 2026-09-27 as PDFs with a browser
User-Agent: Schritte Neu 5 ([Hueber Inhalt, ISBN 978-3-19-301086-5, footer „Schritte int. Neu 5"](https://shop.hueber.de/media/hueber_dateien/Internet_Inhaltsverz/Red1/9783193010865_Inhalt.pdf)),
Sicher! aktuell B2.1 ([Inhalt, ISBN 978-3-19-641207-9](https://shop.hueber.de/media/hueber_dateien/Internet_Inhaltsverz/Red1/9783196412079_Inhalt.pdf))
and Sicher! aktuell B2.2 ([Inhalt, ISBN 978-3-19-661207-3](https://shop.hueber.de/media/hueber_dateien/Internet_Inhaltsverz/Red1/9783196612073_Inhalt.pdf)).

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
   Integrationskurs participants), Goethe/ÖSD B1 and Goethe B2 are designed as add-on "lane packs" but are **not in
   the v1 cut** (§1.4): they are built only once onboarding shows learners choosing those exams.
3. The **.1 courses** introduce every exam part and end with a *Teil-Karte* and a dated plan (no demoralising partial
   score). The **.2 courses** end with two full practice exams in v1 (a third in v1.1), scored deterministically where
   the exam part is closed-answer, then a review-only week. Progress is shown per exam module on the exam's own scale,
   never as "bestanden"; until counsel answers, paid courses draw no pass line against AI-scored parts (§5.6).
4. Content is written by AI agents against frozen registries and fast machine checks (spelling, level, a blind
   solver, exam formats) and leaves review only at **0 BLOCKER / 0 MAJOR** per unit.
5. **Before any paid v2 course promises AI grading** these must be true: purchase-aware AI entitlement on the
   server, counsel's answer on the FernUSG question (including the Prüfungsstand, §5.6), **your decision whether a
   trial or Pro subscription still opens paid levels** (today it does, which undercuts every half-level price), a
   Datenschutzerklärung that covers recorded speech and the AI processors, and measured speaking cost. See §1.5, §1.6
   and §13. DECISIONS says reviewed B-levels become buyable; the blueprint asks you to add a DECISIONS row that makes
   entitlement and counsel explicit prerequisites (§13 D14).
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
| **A1.2** | €40 | completes SD1; closes the Goethe A1 grammar inventory ([m06] F2) | Diagnose (week 1) · **2 Modelltests** (v1; C in v1.1) · review week · Wiederholungsplan | SD1 (+ ÖSD ZA1 pack v1.1) | ≈46 |
| **A2.1** | €50 | first half of A2 | Halbtest per lane → Teil-Karte + plan | Goethe A2 (telc A2 pack after demand) | ≈44 |
| **A2.2** | €50 | completes A2 (A2+ conversation, connected writing) | Diagnose · 2 Modelltests (v1) · review week | Goethe A2 (telc A2 pack after demand) | ≈52 |
| **B1.1** | €60 | first half of B1 | Halbtest per lane → Teil-Karte + plan | telc B1 (DTZ, Goethe/ÖSD B1 packs after demand) | ≈52 |
| **B1.2** | €60 | completes B1; every B1 Teil at full length | Diagnose · 2 Modelltests (v1) · review week · Wiederholungsplan | telc B1 (DTZ, Goethe/ÖSD B1 packs after demand) | ≈70 |
| **B2.1** | €65 | first half of B2; both B2 genres at reduced length | Halbtest per lane → Teil-Karte + plan | telc B2 (Goethe B2 pack after demand) | ≈55 |
| **B2.2** | €65 | completes B2; exam-length texts and timings | Diagnose · 2 Modelltests (v1) · review week | telc B2 (Goethe B2 pack after demand; DTB B2 later) | ≈72 |

Every course has the same shape: 12 units, 3 Plateaus, a closing block, 24 exam-format Aufgaben (two per unit) plus
36 AI-scored micro-outputs, a published Inhaltsverzeichnis and a Teilnahmebescheinigung. **Not every Aufgabe is
AI-scored:** form tasks (`sd1-s1`, `ta2-s1`) are checked deterministically per field, so the copy states the number of
*KI-ausgewertete Aufgaben* that `courseFacts` derives from each task's `rubric.method` (`ai` vs `deterministic`,
SCHEMA §4.5) and never retypes it. **Honesty line
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

| Band | Primary lane (v1: 2 Modelltest forms; C in v1.1) | Secondary lanes (designed; built after demand, 2 forms) | Later | Why |
|---|---|---|---|---|
| A1 | **SD1** = Goethe A1 = telc A1 (one item bank) | — | ÖSD ZA1 pack (own task types, 10-min prep oral) | one format serves Goethe and telc ([m01]) |
| A2 | **Goethe A2** | telc A2 | ÖSD ZA2 not planned | India/abroad buyers sit Goethe; telc A2 formats do not transfer (phone notes, 3-of-4 letter, joker cards, [m01] §4) |
| B1 | **telc B1** | DTZ (gated: „nur für Teilnehmende am Integrationskurs"), Goethe/ÖSD B1 | — | German demand telc 12,100 ≫ DTZ 4,400 > Goethe 1,900 per month ([m02] §5); ÖSD ZB1 = Goethe B1 ([m02] §4) |
| B2 | **telc B2** | Goethe B2 | DTB B2 | telc B2 8,100 vs Goethe B2 1,300 per month ([m03] §6) |

**Rules.**
- A lane is **live** only when its whole pack has passed review: every lane-exact block the coverage rules need
  (§2.4), its Plateau Teile, its Halbtest or Diagnose, its Modelltest forms, its approved images for pictorial Teile
  (§4.9), and — defined precisely — **CAL-01 passing on human-verified anchors for every writing profile the lane
  uses** (§4.6). Speaking profiles do not block a lane: until pilot recordings exist they run as labelled wide ranges
  (§4.6 step 5). Neither waits for the D3 examiner hire. Product pages, onboarding and the lane picker list live lanes
  only.
- The DTZ lane is offered only after an explicit question („Sind Sie in einem Integrationskurs oder haben Sie einen
  besucht?"), carries the fixed label, and is never sold as its own product ([m02] §3, [m08] impl. 4).
- **Nothing is "rendered" across lanes.** Item counts, text sizes, play counts and preparation modes differ per
  lane (telc LV3 10:12 with x, Goethe L3 7:10 with 0, DTZ L2 5 items; prep 20 / 15 / 0 min), so every block is
  authored against one lane's Teil template. Task families (§2.3) group teaching; they do not generate items.
- No DTB-format task appears outside the DTB lane.

**The v1 cut (binding for launch; demand today is 2 course sales ever, both €0, and 0 AI writing uses in 7 days, db
snapshot).** The full design stays specified so nothing has to be re-planned, but v1 builds only:
- **Primary lanes only:** sd1, ga2, tb1, tb2. Secondary packs (ta2, dtz, gb1, gb2; oza1, dtb2 later) are built only
  after onboarding lane-choice data (§7.8 `plan_set` with lane) shows learners choosing that exam; the owner sets the
  threshold (§13 D15). COV rules apply to live lanes only, so a .1 course with one live lane is complete.
- **Two Modelltest forms (A, B)** per primary lane; form C is v1.1.
- **No group simulation:** A1.2 speaking rounds use one AI partner who also reads the instructions (§4.4), unless the
  learner pilot shows group mode matters.
- **No graded serial reader** (§3.7); the Plateau Lesemagazin/Hörmagazin stay.
- **A fixed-form Einstufung** with deterministic routing (§5.7), not an adaptive test.
- **Calibration:** writing ground truth from the MERLIN learner corpus plus a small examiner sample (§4.6); speaking at
  labelled ranges until pilot recordings exist.
- Consequence for the counts in §10.5: ≈ 36 primary mock modules instead of 86, 7 writing profiles (`sd1-s1`, `sd1-s2`, `ga2-s1`,
  `ga2-s2`, `tb1-sa`, `tb2-sa`, `course-micro`) and 13 speaking profiles instead of ≈ 37, and no Spur-Karten in the first waves.

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
   micro-outputs and mock parts, meters speaking in minutes, and has a daily fair-use cap (§4.7). It is recorded in
   one server-written ledger, `course_ai_usage` (SCHEMA §14), which the client can read but never write.
2. The v2 task-key scheme and a new key regex, fixed together, with a test over all eight prefixes (SCHEMA §2).
3. A v2 content gate `hasCourseAccess(level)` = level free (A1.1) **or** a purchase whose product covers the level
   (`course_a1_2` … `course_b2_2` and the legacy band keys `course_a1` … `course_alle` keep resolving).
4. The owner decision in §13 D1: whether trial/Pro additionally open v2 paid content. **Recommendation:** no —
   v2 paid content and its AI allowance follow the purchase only; trial and Pro keep the existing tools (X-Ray,
   open speaking with the wallet, the old course while it lives). Either way the "3 Monate Pro inklusive" claim in
   `pricing.js`/`marketing.js` must be reconciled in the same PR (keep it as a bonus for the existing tools, or drop it).
5. **B-levels and DECISIONS.** DECISIONS 2026-09-26 governs: the integration PR removes each reviewed B-level from
   `COMING_SOON_LEVELS` (both `pricing.js` twins), and a card stays hidden until its Lemon Squeezy variant id is set.
   This blueprint cannot add conditions to that row. It **recommends** that the owner add a DECISIONS row making
   (b) items 1–3 live and (c) counsel's answer on §1.6 rule 1 explicit prerequisites for B-level sale, or rejecting
   them (§13 D14). Until such a row exists, the integration agent follows DECISIONS as written, states in its PR
   description which of (b) and (c) are not yet true, and names the variant ids — the owner's real on-switch — that
   should stay unset until they are.

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
13. **Data protection before any v2 launch that records audio** (§13 D13). The v2 course records speech (before
    sign-up too, §4.7), sends learner audio and texts to STT and LLM providers (today OpenAI STT and TTS, Anthropic
    models; [m12] §3 table row `speaking-session`), stores transcripts and texts, and adds learner-state tables
    (SCHEMA §14). `/privacy/` is still a noindex draft pending legal review (CLAUDE.md). Required: (a) a
    Datenschutzerklärung covering each AI processor, third-country transfer, the purpose and legal basis of scoring,
    retention periods for raw audio, transcripts and texts, and the IP-based caps; (b) a notice-and-consent screen
    before the first microphone use, on the anonymous path as well, linking the Datenschutzerklärung; (c) a scheduled
    retention job that deletes raw audio (design default: immediately after scoring unless the learner keeps a
    recording for replay, and at the latest after 30 days; counsel sets the final periods); (d) IP addresses used for
    caps stored only as keyed hashes with a 48-hour retention (design). Azure TTS is build-time only and receives no
    learner data.
14. **Withdrawal button.** Since 19 June 2026 § 356a BGB requires a „Vertrag widerrufen" function for online distance
    contracts ([m13] §7, via [Noerr](https://www.noerr.com/de/insights/umsetzungsgesetz-zum-widerrufsbutton-veroeffentlicht));
    whether Lemon Squeezy's checkout provides it for German consumers is unverified ([m13] open q. 4). It is on the
    checkout checklist (§8.3, §13 D10) and is a prerequisite for any paid v2 sale.

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
| AI speaking cost | **unmeasured** (STT ≈ $0.003/min per [m12] §4, snippet); speaking scales with *minutes* (STT, an LLM call per turn, TTS, then an evaluation, [m12] §3 `speaking-session` row) | measure in the pilot |
| Speaking exposure at today's wallet **price** (a price, not our cost) | €1 per 5 min ([m12] §4: 5/10/15 min = 100/200/300 cents). A fully engaged learner: 12 speaking Aufgaben × 3 graded attempts × 3–15 min + 3 mock Sprechen modules ≈ 108–585 min ≈ **€22–117** | derived |
| Net per sale, the range of v2 prices | A1.2 €40 → 33.61 − 2.00 − 0.50 ≈ **€31**; B2 €65 → 54.62 − 3.25 − 0.50 ≈ **€51** (German buyer) | derived |

**Rules:** no copy says „unbegrenzt"; the terms state a fair-use cap (§4.7) whose numbers the owner sets after the
pilot measures real cost per engaged learner (§13 D8). The speaking allowance is set in **minutes per slot** as well as
attempts (§4.7), and no paid page promises graded speaking before the pilot's cost measurement exists; **D8 is a gate
for B-level launch.**

---

## 2. Program architecture

### 2.1 The frame (identical for all eight courses)

- **12 units per half-level**, in **4 Etappen of 3** (the course map's nested finish lines). This is Menschen's grain
  (12 Lektionen per Teilband, a Modul-Plus every 3), Lingoda's 12 chapters and Netzwerk neu's Plateau cadence
  ([m14] §B1, §B3, §B9, §G1).
- **Plateau P1–P3 after units 3, 6, 9** (Modul-Plus style, §5.2). After unit 12: the .1 **Abschluss** (Halbtest →
  Teil-Karte → plan) or the .2 **Prüfungswochen** (Modelltest A → repair → B → repair → review week in v1; form C and
  its repair slot in before the review week in v1.1).
- **One unit ≈ one week at the Standard pace** ([m09] impl. A1). Pace presets: *Leicht* (1 unit per 2 weeks),
  *Standard* (1 unit per week, default 4 learning days), *Intensiv* (2 units per week). A near exam date adds
  sessions, never longer sessions.
- **The unit of use is a Lernschritt of ≤ 25 min** with a save point at its end; resume is at item level.
  Exam-mode sessions of a .2 course may run the lane's real time (e.g. telc B2 Schreiben 30 min) and are marked as
  such (§3.4).
- **Required core vs optional depth.** Required: the 12 units (all Lernschritte incl. both Aufgaben), the Plateaus
  and the closing block's first form (.1: the Halbtest of the learner's lane; .2: Modelltest A of the learner's lane —
  the free week-1 Diagnose never counts, SCHEMA §5). Optional, never gating: Fokus-Karten, „Mehr üben" pools,
  Lesemagazin / Hörmagazin (the extensive strand, §3.7), Modelltests B/C, extra Teil-Trainer.
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

The closing row assumes three Modelltest forms; the v1 cut ships two, which removes one mock of 80–185 min (sd1
65 + 15, ga2 90 + 15, tb1 150 + 15 + 20, tb2 140 + 15 + 20) ≈ 1.3–3.1 h per .2 course (derived). Cumulative
A1.1→B1.2 ≈ 301 h (floor 287). Benchmarks: Menschen ≈ 48 UE (≈ 36 h) per Teilband ([m14] §B1); BAMF
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
   optional Fokus-Karten** of the same unit ([m14] §E8, §F6). Every unit carries a BAMF Handlungsfeld tag. A
   Fokus-Karte is optional for the learner (never counted toward completion) but its *existence* is planned: the
   §2.8 *Fokus* column names each card that covers a Handlungsfeld the band's units miss, and ALL-04 counts planned
   cards present in the unit files.

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
| **dtz** DTZ | 100 min, no break: Hören 4/5/8/3 (**all once**), Lesen 5/5/6/3/6, Schreiben 30 (A or B, 4 Leitpunkte) | ≈ 16 min, pair, **no preparation**; photo + home country; Teil 3 = 20 of 50 task points | B1: H+L ≥ 33/45, Schreiben ≥ 15/20, Sprechen ≥ 75/100; certificate = Sprechen B1 + one of the other two; Sprechen below A2 = no certificate. **A2 bands** (a level outcome of the scaled test, never shown as a pass): H+L 20–32, Schreiben 7–14, Sprechen 35–74.5 ([m02] §3) | [g.a.s.t. Übungssatz 1](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) |
| **gb1** Goethe/ÖSD B1 (modular) | Lesen 65 (6/6/7/7/4), Hören ≈ 40 (10/5/7/8; **H2, H3 once**), Schreiben 60 (≈ 80 + ≈ 80 + ≈ 40 words; 40 + 40 + 20 pts) | ≈ 15 min, pair, **15 min preparation**; 28 + 40 + 16 + Aussprache 16; Teil 2 = 5 fixed slides | each module ≥ 60/100; Lesen/Hören raw × 3.33 (18/30 passes); E zeroes a writing task | [DFB B1](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf), [Modellsatz B1](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) |
| **tb2** telc B2 | 140 min: Lesen + SB 90, Hören ≈ 20 (**all once**), Schreiben 30: (halb)formelle E-Mail ≥ 150 words, 3 of 4 Leitpunkte (or 2 + own), Betreff | ≈ 15 min, pair, 20 min preparation; **M1 topic chosen from 7 and prepared at home** ([m03] §2); 3 × 25 (7/7/7/4) | ≥ 135/225 written **and** ≥ 45/75 oral | [telc UT B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) |
| **gb2** Goethe B2 (modular) | Lesen 65 (9/6/6/6/3), Hören ≈ 40 (10/6/6/8; **H1, H3 once**), Schreiben 75: forum post ≈ 150 words (60 pts) + message to a superior ≈ 100 words (40 pts) | ≈ 15 min, pair, 15 min preparation; Vortrag ≈ 4 min + questions; pro/contra discussion; Aussprache 16 | each module ≥ 60/100; E zeroes a writing task | [DFB B2](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf), [Modellsatz B2](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) |
| oza1 ÖSD ZA1 (v1.1) | 55 min; Lesen 16, Hören 15 (H1, H3 once), Schreiben form + reply ≥ 25 words | ≈ 10 min, **10 min preparation with notes** | written ≥ 38/75 with Lesen ≥ 6, Hören ≥ 6, Schreiben ≥ 4; oral ≥ 12/25; modular | [DB-ZA1](https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf) |
| dtb2 DTB B2 (v1.1) | see [m03] §3 | no preparation; restating a partner's point | ≥ 144/240, 3 of 4 skills ≥ 60 % | [BAMF DTB Übungstest](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/b2-modelltest-bsk.pdf?__blob=publicationFile&v=10) |

Known open format questions stay flagged in the lane files: telc B1 has no official word count (prep sites say
120–150, unverified); Goethe B2 says „circa" in print and „mindestens" digitally ([m03] §1); the Goethe A2 oral
per-Teil split is reconstructed (unverified, [m01]).

**Teil templates** (`<lane>.<teil>`, e.g. `tb1.lv3`, `dtz.s2`, `gb1.sch2`) are the unit of exam fidelity: module,
item count, options per item, **the block-level choice set** (`choices`: how many texts, headings, ads, words or
sentences the items are matched to, whether a choice may be used twice, and the no-match key; e.g. `tb1.lv3` 10
situations → 12 ads + „x", `gb1.l3` 7 → 10 ads + „0", `tb1.sb2` 10 gaps from 15 words, `gb2.l2` 6 gaps from 8
sentences, `gb2.l1` 9 statements → 4 people with reuse), plays, reading time, time box, text-type and text-length
band, word band, rubric profile, preparation minutes (and `prepAtHome` for `tb2.m1`), our own paraphrase of the
instructions (`instructionsDe` + `paraphraseOf`, never the official wording, LGL-05), whether the Teil is
**pictorial** (§4.9), the `scaffold` limits a reduced or mini block must respect, `scaffoldAllowedIn` (which .1
courses may simplify it), and `transfersTo` — the list of other lanes' templates this one counts for **in appearance
counting only** (§2.4). The lane profile also records `delivery` (paper / digital / both). The
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
| Writing editor | word counter, Leitpunkt checklist, umlaut keys | word counter **only where the learner sits the exam digitally** (Goethe's digital exams offer one, (snippet) <https://www.goethe.de/de/spr/prf/ddp.html>); **hidden for paper lanes** (telc A1/A2 are paper only, [m01] §1, §4; DTZ `delivery: paper` per the critic's reading of [m02] §3, (unverified); telc B1/B2 set by the lane agents) and for sd1 unless the learner says the exam is on a computer; **no spellcheck/autocorrect/autocapitalise**, umlaut keys, checklist hidden |
| Speaking | hints, word bank (A1.1 only), repeat on request | the lane's preparation time and notes (sd1 0, ga2 0, ta2 0, dtz 0, gb1 15, tb1 20, tb2 20, gb2 15, oza1 10 min; `tb2.m1`: topic chosen from 7 and prepared before the session, [m03] §2); notes collapse to ≤ 5 keywords while speaking |
| Paper lanes (telc A1/A2) | — | optional 3–5 min answer-sheet transfer step in one Modelltest form ([m01] impl. 11) |
| Feeds the Prüfungsstand (§5.6) | never | only if the block is **full length** |

### 2.4 Coverage rules (hard validator rules, per lane)

| Id | Rule |
|---|---|
| **COV-1 Appearance** | For every **live** lane L of a course and every Teil T of L: (lane-exact blocks of T) + (blocks whose template lists T in `transfersTo`) **≥ 2 in a .1 course, ≥ 3 in a .2 course**; and lane-exact blocks of T **≥ 1 (.1) / ≥ 2 (.2)**. A lane-only Teil (no inbound transfer) counts lane-exact blocks only, so it needs ≥ 2 / ≥ 3 of its own. |
| **COV-2 Full length before Modelltest A** | For every live lane of a .2 course and every Teil: **≥ 2 lane-exact blocks at full length, runnable in Prüfungsmodus**, located in the paired .1 course or in the .2 course before Modelltest A (LS4 blocks, Aufgaben, Plateau Teile, Diagnose). |
| **COV-3 Prüfungsfokus per unit** | 2–4 Teile of the primary lane per unit; in a .2 unit ≥ 1 of them at full length in Prüfungsmodus by default. Each Prüfungsfokus Teil maps to **exactly one slot** (SCHEMA `pruefungsfokus[].slot`): `ls4` (≤ 2 receptive blocks), `sprechen`, `schreiben`, or — for a third receptive Teil — the LS3 exam text type (A skeleton, `ls3-text`) or Text B (B skeleton, `text-b`), where the Teil's items are authored against its template and counted (EXM-11). |
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
   *Wiederholung* is not new, and **each spine point has exactly one `intro`** (GRM-02): a later unit that returns to
   it is labelled „(Wiederholung/Erweiterung)" in §2.8; where the later unit teaches a genuinely different function or
   form it gets its **own spine id** (e.g. `g.partizip-attr-einfach` B1.2 U2 vs `g.partizip-attr-erweitert` B2.1 U6)
   ([m06] impl. 12). A proposal's rule must not contradict its own tables: the tables in §2.8 obey this rule and the
   validator enforces it on the specs.
2. **Receptive before productive** where the spine says so (Passiv A2.2 rec → B1.2 prod; Konjunktiv II Vergangenheit
   B1.2 rec → B2.1 prod; Präteritum A2.2 rec → B1.1 narrative).
3. **Interleave contrast partners** from the second Lernschritt that uses a point (Akkusativ/Dativ, Perfekt
   haben/sein, weil/denn, wenn/als, deshalb/trotzdem); the UI warns that scores dip while contrasts are mixed
   ([m09] §3).
4. **Presentation:** A levels deductive — each Situation-LS headed by one model sentence (Schritte A–C, [m14] §E2),
   rule card ≤ 60 words at A1 / ≤ 80 at A2 (design, inherited from A1.1 — the pilot re-measures it), English twin. B levels inductive — the learner fills the rule table from
   the text, then the card; a Grammatik-Rückschau closes the unit ([m14] §E16).
5. **Inventory floors:** the full Goethe A1 inventory by the end of A1.2 (all six modal verbs, Imperativ Sie/du/ihr,
   war/hatte, Perfekt of the listed verbs, danken/gehören/helfen, dies-/welch-, Genitiv-s with names, Wortbildung
   -er/-in/-ung and receptive un-/-los/-bar; [TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf)
   pp. 100–106). The full Goethe A2 inventory by the end of A2.2 (Präteritum of haben/sein/kommen/sagen and the modal
   verbs, möchte/hätte/könnte, attributive adjective endings, Komparation, dass/weil/wenn/W-Nebensatz, deshalb;
   [Fit 2](https://www.goethe.de/pro/relaunch/prf/zh/Pruefungsziele_Testbeschreibung_A2_Fit2.pdf) pp. 106–109).
6. **The systematic Perfekt is placed early in A1.2 and never in exam weeks:** chunks A1.1 U11 → haben with regular
   and irregular participles A1.2 U5 → sein A1.2 U8 → trennbar/untrennbar/-ieren A1.2 U10.

**Hinge decisions (recorded once in the spine):** Verben mit Vokalwechsel in A1.1 U2, with *sprichst/spricht* as a
U1 chunk (MEN L3, SCH1 L3/L6, NWN K2, [m06] F3 row 8 "strong"; [m06] impl. 2). Dativ first through fixed-case
prepositions (A1.2 U2), then temporal prepositions with Dativ and the Datum (A1.2 U3, Menschen's order L13 → L16),
then dative verbs and pronouns (A1.2 U7) ([m06] impl. 4). Wechselpräpositionen through verb pairs stellen/stehen, legen/liegen,
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
failure (MERLIN via [m06] F4). The weighting is data, not prose: each rubric profile carries an `errorPolicy` per
band (`flag` = named in feedback, `score` = counts toward the language criterion; SCHEMA §4.5), and practice items
carry `errorTags` so every tag has a repair pool (ITM-12).

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

**One lemma, one id, across all eight levels.** A global registry `registries/lemmas.json` holds one id per lemma
(`lx.<lemma>`; so `word:lx.anruf` is unique course-wide); each level's `lexicon.json` is an **allocation** of registry
ids to its units. Allocation runs **sequentially A1 → A2 → B1 → B2 in P0**, one allocator per band, each followed by a
deterministic dedupe step (`scripts/course-v2/lex/register.mjs`, run by the orchestrator, the registry's only writer)
that rejects a lemma already allocated at a lower level unless it is a **promotion**: `promotions: [{lemma, from:
receptive, to: productive, unit}]` in the higher level's file (a receptive A2 word can become productive at B1). So B1
units, authored in Wave 1, already have a frozen A1 + A2 allocation, and LEX-01 reads the **cumulative** allocation
(all lower levels + earlier units + this unit). **The private `list_ref` table** lives outside git as
`private/list-ref.json` (lemma → `A1|A2|B1` only, no list text); the owner stores it as an environment secret that
the session-start hook materialises into the working tree, as it does for the GSC credentials (CLAUDE.md), and
`private/` is git-ignored with a CI check that it is never committed. Agents query it only through
`node scripts/course-v2/lex/list-ref.mjs <lemma…>`, which prints tags, never the list.

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

**The carry-over deck (the table above covers only the current course).** The deck carries across half-levels (§6.4),
and without an end to the ladder the load grows: by B2.2 the targets imply ≈ 3,000–3,400 carried lemmas plus
≈ 550 pattern and sentence cards; at one review per 60 days that is ≈ 59–66 reviews a day ≈ 10–11 min at 10 s
(derived: 3,550–3,950 ÷ 60 × 10 s), on top of the 9.3 min the current B2 course needs. Two binding rules fix it:
(1) **Graduation** — a card retires from the scheduled queue after a successful +60-day retrieval, unless it lapses
later (a miss in content, a check or a sampled review puts it back on +1) or is flagged **exam-critical** (Redemittel
and `teil` cards of the learner's lane stay on +60 until the exam date has passed). (2) **A carry-over budget** —
cards from earlier half-levels are reviewed within a separate, fixed daily budget (design: 1 min at A1.2, 1.5 at A2,
2 at B1 and B2), lapsed and exam-critical cards first, then a random sample; they never displace the current course's
cards. **SRS-01 is extended** to simulate the cumulative deck of a learner on the A1.1 → B2.2 path at Standard pace
and to publish the combined daily minutes (current budget + carry-over budget) per half-level in `.build/` for the
plan, which shows the sum.

### 2.7 The serial cast (one continuing story, A1.1 → B2.2)

One cast bible per band (`casts/a1.json` …) plus one series arc (`casts/series.json`), owned by one story architect.
**Every main character is preparing an exam**, so the story models the plan, the nerves, the mock and the retake;
each B-level co-protagonist sits a different lane. Scenes ≤ 90 s at A1, ≤ 2 min above; **every scene carries a task**;
every unit ends on a one-line cliffhanger resolved in the next unit's Start ([m14] §E3, §F5; B §6.6). **Across course
boundaries** the beat is fixed in P0 by `casts/series.json` (the U12 cliffhanger of each course and the matching U1
resolution of the next), so B1.1 U1 (Wave 1) never waits for A2.2 U12 (Wave 2); and because most B1 and B2 buyers
enter without the earlier courses, **every course's U1 Start stands alone** with a one-line recap for new buyers.
Persona facts are checked by CON-01; every named speaker who is not in a cast bible is declared as a file-level
*extra* (SCHEMA §3.3), so CON-01 and AUD-01 cover one-off voices too.

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
*Grammatik neu* marks a return to an earlier point „(Wiederholung)" or „(Wiederholung/Erweiterung)" and names a
distinct spine id only where the function really differs (§2.5 rule 1); GRM-01 was recounted on every row after the
critic pass. *Prüfungsteile* = primary-lane Teile of the unit's Prüfungsfokus; in .2 tables **bold** = full length in
Prüfungsmodus by default; a third receptive Teil is carried by the LS3 exam text type (A) or Text B (B), never by a
third LS4 block (COV-3). *Spur* = the secondary-lane blocks this row already plans for when the pack is built (the
curriculum agent adds more until COV-1/COV-2 hold). *Leaders* = Lehrwerk placements ([m14] §C); S5 = Schritte Neu 5
and Si = Sicher! (B1+ in the B1 tables, Sicher! aktuell B2 in the B2 tables), read at source 2026-09-27; a row with
fewer than two verified placements carries a `deviation` (ALL-03 rejects placements tagged (unverified) or
(snippet)). *Fokus* = the planned Fokus-Karte that covers a BAMF Handlungsfeld the band's unit tags miss (ALL-04);
empty where none is needed.

**The W2 drafts** (`docs/course-v2/curriculum/*.json|md`) are input, not law: curriculum agents carry their can-do
texts, source tags, text types, vocabulary sets and exam mappings **onto these rows**. Row order, grammar placement
and exam coverage follow this blueprint; a curriculum agent may swap situations inside a level only with a logged
`deviation` that keeps every validator rule green. Where a draft places a full mock at checkpoints 3–4 (before the
last new content), this blueprint's rule wins: Modelltests come after unit 12 (§5.4).

#### A1.1 — „Erste Kontakte" (free · lane SD1 · untimed miniatures in Lernmodus; board opt-in)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (SD1) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|
| 1 | Hallo, ich bin Priya | begrüßen, sich vorstellen, Herkunft, Sprachen · D | sich begrüßen/verabschieden; Name, Herkunft, Sprachen nennen und erfragen | Präsens Sg. inkl. *sein*, du/Sie · W-Frage, Verb auf Position 2 (*sprichst/spricht* als Chunk) | Sp1, H1 | M1, S1, N1 | |
| 2 | Wie schreibt man das? | buchstabieren, Zahlen, Telefonnummer, Anmeldung · 1 | Namen buchstabieren; Nummern sagen und verstehen; ein Formular ausfüllen | Präsens Pl. inkl. *haben* · Verben mit Vokalwechsel (*sprechen, lesen, essen, fahren, schlafen*; nur du und er/sie/es) | S1, Sp1, H1 | M2, S1-E, N2 | |
| 3 | Meine Familie | Familie vorstellen, Fotos · D | Familie vorstellen; nach der Familie fragen | mein/dein/Ihr · Ja/Nein-Frage, ja/nein/doch | Sp2, L1 | M3, S2, N5 | |
| 4 | Was kostet das? | Lebensmittel, Preise, Supermarkt · 7 | nach Preisen fragen; einkaufen; Durchsagen im Laden | Artikel, Genus, Plural, er/es/sie · kein/nicht (*möchte* als Chunk) | H1, H2, Sp3, L2 | M4–5, S3, N4 | |
| 5 | Das brauche ich | Dinge im Kurs und im Büro, bitten · 11, 2 | Gegenstände benennen; um etwas bitten | Akkusativ (den/einen/keinen) | Sp3, S2 (2 Leitpunkte) | M5–6 | |
| 6 | Hier wohne ich | Wohnung, Wohnungsanzeigen, Nachbarn grüßen · 12 | die Wohnung beschreiben; kurze Anzeigen verstehen | *es gibt* + Akk. · Adjektiv prädikativ | L2, L1 | S4 — **deviation:** M14/N9 put Wohnen in A1.2; kept here with Schritte because SD1 Lesen 2 uses housing ads | |
| 7 | Mein Tag | Uhrzeit, Tagesablauf, Öffnungszeiten · 11, 2 | Uhrzeit sagen/verstehen; den Tag beschreiben; Öffnungszeiten lesen | Uhrzeit, am/um/von … bis + Inversion · trennbare Verben | L3, H3 | M8, S5, N5 | |
| 8 | Hast du am Samstag Zeit? | Freizeit, sich verabreden · D | Vorschläge machen; zu- und absagen | *können*, *wollen* + Satzklammer | S2, Sp2, H3 | M7–8, S6, N6 | |
| 9 | Im Café | bestellen, bezahlen, Vorlieben · 7 | bestellen; sagen, was man (nicht) mag | *mögen/möchte* (Vokalwechsel: Wiederholung) | Sp3, H1 | M9, N4 | |
| 10 | Mit Bus und Bahn | Fahrkarte, Gleis, Durchsagen · 10 | Fahrkarte kaufen; Durchsagen verstehen | *müssen* (Imperativ *Sie* als Chunk) | H2, L3 | M10, N3 | |
| 11 | Wie war dein Wochenende? | vom Wochenende erzählen, Online-Gruß · D | sagen, was man gemacht hat; einen kurzen Gruß schreiben | Perfekt als Chunks (8–10 Verben; *war/hatte* als Chunk) | S2, L1, Sp2 | M11–12, S7 (all families end A1.1 with the Perfekt) | |
| 12 | Deutsch lernen – mein Plan | Kurs, Lernziele, Lernwege · 11, E | über Lernziele sprechen; sich für einen Kurs anmelden | — (Wiederholung) | Sp1, S1, H2, L3 → **Halbtest** | RC Unterricht — **deviation:** S7 Kinder/Schule (DaZ) and M12 Feste (DaF) split by audience; the neutral field is chosen, Kita-Anmeldung becomes a Fokus-DaZ card (see Fokus), Feste go to A1.2 U12 | Fokus-DaZ „Kita-Anmeldung" (HF 6) |

Coverage check (miniature appearances): H1 4, H2 3, H3 2, L1 3, L2 2, L3 3, S1 2, S2 3, Sp1 3, Sp2 3, Sp3 3.

#### A1.2 — „Den Alltag organisieren" (€40 · lane SD1; ÖSD ZA1 pack v1.1)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (SD1) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|
| — | *Diagnose* (week 1, free) | SD1 mini-mock: one full Teil per module | — | — | H1, L2, S2, Sp2 | — | |
| 1 | Mein Arbeitsalltag | Beruf, Arbeitszeiten, Kollegen, früher · 2 | über die Arbeit sprechen; sagen, was man früher war und hatte | *war/hatte* (Präteritum sein/haben) | **L1**, Sp1, S1 | S8, N7, M19 | Fokus-Beruf „Minijob-Anzeigen lesen" (HF 3) |
| 2 | Wie komme ich zum Rathaus? | Weg fragen und beschreiben · 10 | nach dem Weg fragen; Wegbeschreibungen verstehen | Dativ nach mit/zu/bei/aus/von/nach; *Wo?* + Dativ | **L3**, H1 | M13, M15, S11 | |
| 3 | Einen Termin machen | Termine in Praxis und Amt · 8, 1 | Termine vereinbaren und verschieben; Datum verstehen | temporale Präp. + Dativ (vor/nach/in/seit/ab/bis) · Ordinalzahlen, Datum (*am dritten Mai*) | **H3**, S1 | S9, M16, M24 (Dativ before temporal, as Menschen L13 → L16) | |
| 4 | Beim Arzt | Körper, Beschwerden, Anweisungen · 8 | Beschwerden nennen; Anweisungen verstehen | *sollen* · Imperativ *Sie* (systematisch) | **Sp3**, L3, H3 | M18, S10, N8 | |
| 5 | Ich bin krank – ich sage ab | krankmelden, entschuldigen, neuer Termin · 2, 11 | sich krankmelden; sich entschuldigen und einen Grund nennen | *denn* · Perfekt mit *haben* (Partizip regelmäßig/unregelmäßig) | **S2**, H3, Sp3 | M23, S14 (denn); RC 84, 149 (worked example §3.8) | Fokus-DaZ „Krankmeldung bei der Arbeit" (Landeskunde, §3.8) |
| 6 | Wohnung und Nachbarn | Anzeigen, Hausordnung, Nachbarn · 12 | Anzeigen und Hausordnungen verstehen; sich vorstellen | sein/ihr/unser/euer + Genitiv-s bei Namen · *dürfen* (*man* als Chunk) | **L2**, L3, Sp1, Sp2 | M14, N9, M21 | |
| 7 | Die Jacke gefällt mir | Kleidung, Kaufhaus · 7 | Kleidung kaufen; Gefallen ausdrücken; Durchsagen im Kaufhaus | Dativverben + Dativpronomen (gefallen, passen, stehen, helfen, danken, gehören) · welch-/dies- | **Sp2**, H1, H2 | M22, S13, N11 | |
| 8 | Bahnhof und Flughafen | Reise, Verspätung, Durchsagen · 10 | Durchsagen verstehen; von einer Reise berichten | Perfekt mit *sein* | **H2**, L2 | N12, RC 142–145 | |
| 9 | Kannst du mir helfen? | Haushalt, Nachbarschaftshilfe · 12, D | um Hilfe bitten; Anweisungen geben | Imperativ du/ihr · Akkusativpronomen | **Sp3**, L1 | M20–21 | |
| 10 | Online bestellen | Bestellung, Kundenservice, Problem melden · 7 | etwas bestellen; höflich bitten; ein Problem melden | Perfekt trennbar/untrennbar/*-ieren* (*würde/könnte* als Chunk) | **S1**, H1, L1 | S12, RC 110–111 | Fokus-DaZ „Bezahlen: Karte, Überweisung, Kontoauszug" (HF 5) |
| 11 | Wetter und Wochenende | Wetter, Ausflug, Einladung · D, 9 | über das Wetter sprechen; vergleichen; auf Einladungen antworten | Komparation (gut/besser/am besten, gern/lieber, als/wie) | **H1**, H2, S2, Sp2 | M23, N12; M22 (Komparation) | |
| 12 | Feste und Glückwünsche | Einladung, gratulieren, das Du anbieten · D | gratulieren; Einladungen annehmen/absagen | Wortbildung -er/-in/-ung (un-/-los/-bar rezeptiv) (*würde gern* als Chunk) | **Sp1–Sp3** (one round with one AI partner, v1), S2 | M24, S14 | Fokus-DaZ „Kurse an der Volkshochschule" (HF 4) |
| — | *Prüfungswochen* | Modelltest A, B, C (65 + 15 min) + repair + review week | — | — | all 11 Teile | — | |

Goethe A1 inventory closed: modal verbs (A1.1 U8–U10, A1.2 U4, U6), Imperativ Sie/du/ihr (U4, U9), war/hatte (U1),
Perfekt (A1.1 U11 chunks; U5, U8, U10), danken/gehören/helfen (U7), dies-/welch- (U7), Genitiv-s (U6), Wortbildung
(U12). **ÖSD ZA1 pack (v1.1):** six Teil-Trainer (ads with a distractor, JA/NEIN, sign → picture, note-taking,
prep-with-notes oral with photo and role play) and one ZA1 mock per form, scored per module with its floors.

#### A2.1 — „Kontakte pflegen, Dinge erledigen" (€50 · lane Goethe A2; telc A2 pack)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (GA2) | Spur (ta2) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|---|
| 1 | Neu hier: Kontakte knüpfen | Smalltalk mit neuen Kollegen, über sich erzählen · D, A | von sich und dem eigenen Weg erzählen; Gründe nennen | *weil* (Perfekt-Wiederholung) | Sp1, Sp2, L3 | Sp1 | M1, S3-L1, N1 | |
| 2 | Die neue Wohnung | Umzug, Möbel stellen, Nachbarn · 12 | sagen, wohin etwas kommt und wo es steht | Wechselpräpositionen über stellen/stehen, legen/liegen, hängen | H2, Sp3, L4 | H3 | M2, S3-L2 | |
| 3 | Kommst du zu meiner Feier? | einladen, zu-/absagen, schenken · D | einladen; zu- und absagen; über Geschenke sprechen | Dativ + Akkusativ im Satz (Stellung der Pronomen) | S1, Sp3, H3 | S2 (3 von 4) | S3-L7 (split M15) | |
| 4 | Einkaufen: vergleichen und bestellen | Gerät kaufen, Kaufhaus-Wegweiser · 7 | Produkte vergleichen und beschreiben; sich orientieren | Adjektivendungen nach ein-/kein-/mein- | L2, L4, S2 | L1, L3 | M4, S3-L3 | |
| 5 | Im Restaurant | reservieren, bestellen, reklamieren · 7 | reservieren; bestellen; höflich reklamieren | Adjektivendungen nach der/die/das | H3, S2, Sp1 | H2 | M10, M5 | |
| 6 | Mit der Bahn unterwegs | Buchung, Durchsage, Verspätung · 10 | Durchsagen verstehen; Reisepläne ändern | *wenn* | H1, L2 | H3 | M3, N5; RC 143–144 | |
| 7 | Am Telefon im Job | Mailbox, Rückruf, Termin verschieben · 2 | Mailbox-Nachrichten verstehen und notieren; Nachrichten weitergeben | reflexive Verben (Akkusativ) | H1, S2, Sp1 | H1 (Telefonnotiz) | M9, M11, S3-L4, N6 — **worked example in SCHEMA.md** | |
| 8 | Gesund bleiben | Arzt, Ratschläge · 8 | Beschwerden beschreiben; Ratschläge geben | *sollte/könnte* (Rat) · *deshalb* | H4, Sp2, S1 | Sp2 | M7–8, S3-L5 | |
| 9 | Immer online? | Medien, Handy, Fehlermeldungen · 9 | über Mediennutzung sprechen; Meinung sagen | *dass* | L1, S1 | L2 (R/F) | N3 (split M15) | |
| 10 | Schule, Ausbildung, Kurse | Schulzeit, Bildungswege, Kursanmeldung · 4, A | über die Schulzeit erzählen; Bildungswege vergleichen | Modalverben im Präteritum | L3, Sp2 | S1, H1, Sp1 | N2, S3-L6 | Fokus-DaZ „Ein Elternbrief aus Kita und Schule" (HF 6) |
| 11 | Gefühle, auch online | gratulieren, trösten, sich ärgern · B | Freude, Ärger, Mitgefühl ausdrücken; auf Posts reagieren | Verben mit Präposition + wo(r)-/da(r)- (Einstieg) | S1, L1, H4 | Sp2, S2 | N4; M18 (split) | |
| 12 | Hier und dort | Leben vergleichen, Reisebericht · A | vergleichen; von einer Reise erzählen | *einer/keiner/welche* | H2, L4, Sp3 → **Halbtest** | L2, S1, Sp3 → Halbtest | S3-L3 (split N12), M22 | |

Coverage check GA2 (appearances): L1 2, L2 2, L3 2, L4 3, H1 2, H2 2, H3 2, H4 2, S1 4, S2 3, Sp1 3, Sp2 3, Sp3 3.

#### A2.2 — „Gespräche führen, Probleme lösen" (€50 · lane Goethe A2; telc A2 pack)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (GA2) | Spur (ta2) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|---|
| — | *Diagnose* (free) | lane mini-mock | — | — | H1, L4, S1, Sp1 | Diagnose ta2 | — | |
| 1 | Sprachen lernen | Sprachcafé, Lernbiografie · 11, E | ein Gespräch beginnen, in Gang halten, beenden | *als* (temporal) | **Sp1**, L1, H3 | Sp1 | M13, N8 | |
| 2 | Wir planen einen Ausflug | gemeinsam planen, Kompromiss · D | vorschlagen, ablehnen, sich einigen | Konjunktiv II *wäre/hätte/würde* (Vorschlag, Wunsch) | **Sp3**, H2, L4 | Sp3 | S4-L8, N12 | |
| 3 | Im Hotel | buchen, umbuchen, Probleme · 10 | höflich nachfragen; eine Buchung ändern | indirekte Fragen mit *ob*/W-Wort | **S2**, L2, H1 | L1 | M16, S4-L11/12, N7 | |
| 4 | Unterwegs: Wege und Zwischenfälle | Treffpunkt, Weg, kleiner Unfall · 10, 8 | Wege genau beschreiben; von einem Zwischenfall berichten | lokale Präp. (gegenüber, durch, an … vorbei) · woher/wo/wohin | **H1**, L4, S1 | H3 | M17, M22 | |
| 5 | Handy, Vertrag, Kündigung | Tarif wählen, kündigen · 7, 5 | Angebote vergleichen; einen Vertrag ändern oder kündigen | Passiv Präsens (rezeptiv) | **L1**, S2 | S2 | M14, S4-L10 | |
| 6 | Mein Geld | Bank, Karte verloren · 5 | Bankgeschäfte erledigen; einen Verlust melden | Adjektivendungen ohne Artikel, *Was für ein?* (+ Komparativ attributiv) | **Sp2**, H3, L3, H2 | L3 | S4-L9/L13, RC 112 | |
| 7 | Die Heizung ist kaputt | Mängel melden, Vermieter, Handwerker · 12 | ein Problem schildern; um Reparatur bitten | *lassen* · *trotzdem* | **S2**, H4, L3, Sp3 | H1 | S4-L13, M21; RC 156–157 | |
| 8 | Wetter, Klima, Umwelt | Wetterbericht, Umwelt im Alltag · 9 | Wetterberichte verstehen; über Umwelt sprechen | Verben mit Präposition + worauf/darauf (produktiv) | **H4**, H1, L1, Sp2 | H2 | M18 | |
| 9 | Mein Weg | Schule, Ausbildung, Lebenslauf · 3, 4 | einen Lebenslauf verstehen und erzählen | Relativsatz Nominativ/Akkusativ | **L3**, Sp2, H4 | L2 | M23; N K12 (split S5/LIN = B1.1) | |
| 10 | Bewerbung und Vorstellungsgespräch | Stellenanzeige, Gespräch · 3 | Stellenanzeigen verstehen; im Gespräch Auskunft geben | Präteritum (rezeptiv: regelmäßig/unregelmäßig) | **L4**, Sp1, H2 | Sp2 | M24, RC 100 | |
| 11 | Post vom Amt *(tauschbar: Fokus-DaF Reiseplanung)* | Fristen, Nachfragen · 1 | Behördenbriefe verstehen; nachfragen | *seit/seitdem*, *bis* (Konnektor) | **L2**, S1, H3, Sp3 | S1 | M21, RC 76–77; M22 | |
| 12 | Lebensstationen | zusammenhängend erzählen · A, D | eine Lebensgeschichte gegliedert erzählen | — (Textkonnektoren zuerst/danach/zum Schluss: Wiederholung) | **S1**, **H2**, **H3**, Sp2 | Sp1, S2 | N10–11, S4-L14 | |
| — | *Prüfungswochen* | Modelltest A, B, C (Goethe A2, 90 + 15 min); telc A2 A, B | — | — | all Teile | — | — | |

#### B1.1 — „Im Alltag mitreden" (€60 · lane telc B1; DTZ and Goethe/ÖSD B1 packs)

B skeleton from here (§3.2). **Every B1 unit's Sprechen session contains a planning round of ≥ 3 min with the moves
checklist** (vorschlagen · reagieren · widersprechen/Alternative · sich einigen · wer macht was), because planning
is 28/100 (Goethe Sp1), 30/75 (telc M3) and 20/50 DTZ task points ([m02] §6).

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB1) | Spur (dtz · gb1) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|---|
| 1 | Was gibt's Neues? | Freundschaft, Neuigkeiten · D | von Erlebnissen erzählen; eine persönliche E-Mail schreiben | Präteritum als Erzähltempus | SA, M1, LV2, HV2 | dtz S1 · gb1 Sch1 | M1–2, Si1, S5-L1 (über Vergangenes berichten, Präteritum) | |
| 2 | Wir organisieren ein Fest | planen, wer macht was · D | gemeinsam planen; Aufgaben verteilen | *falls* | M3, HV2 | dtz S3 · gb1 Sp1 | M6, M12, Si2 | |
| 3 | Wenn die Bahn nicht fährt | Verspätung auf dem Weg zur Arbeit, Umbuchung, Durchsagen; dem Team die Durchsage weitergeben (Mediation) · 10, 2 | Durchsagen verstehen; umbuchen; **eine Durchsage für das Team zusammenfassen und weitergeben** (Mediation: Zuhören und weitergeben, [m05] impl. 3) | Relativsatz Dativ / mit Präposition | HV3, LV3 | dtz H1 · gb1 H1 | N1, Si3, S5-L2 (Relativsatz mit Präposition) | |
| 4 | Ärger mit der Wohnung | Mängel, Vermieter, Nachbarn · 12 | Probleme schriftlich melden; Details erfragen | Genitiv + wegen/trotz/während (Präp.) | LV3, SA, SB1 | dtz Schreiben · gb1 L3 | M3, Si4, S5-L7 (Hausordnung, Konflikte mit Nachbarn), RC 155–156 | |
| 5 | Das Gerät ist kaputt | reklamieren, Kundenservice · 7 | reklamieren; eine Lösung verlangen | *obwohl* (*trotzdem* aus A2.2 U7: Wiederholung als Kontrastpartner) | SB1, SA, M3 | dtz L5 · gb1 Sch3 | M4, N2 (clip), S5-L6 (sich beschweren), S5-L2 (obwohl) | |
| 6 | Alles digital? | Technik, Medien, Zukunft · 9 | Vermutungen und Pläne äußern; Meinungen zuordnen | Futur I (Vermutung, Plan, Versprechen) | HV1, LV1, M2 | dtz H4 · gb1 H4 | M5, N6 | |
| 7 | Unter Kollegen | Schichten tauschen, Absprachen · 2 | Absprachen treffen; Ziele begründen | *um … zu / damit* | M3, HV3, SB2 | dtz S3 · gb1 Sch3 | S5-L6 (um … zu, damit; Probleme im Arbeitsalltag), Si5 (Finalsatz), RC 84–85 | |
| 8 | Weiterbildung im Betrieb | Beratungsgespräch mit der Personalabteilung, Kurs wählen · 2, 4 | sich am Arbeitsplatz beraten lassen; Angebote vergleichen | Infinitiv mit *zu* | LV3, M1, LV2 | dtz L2 · gb1 L3 | M7–8, Si5, S5-L5 (Infinitiv mit zu, Berufsberatung), Si8 (Lebenslang lernen) | |
| 9 | Beim Arzt und in der Apotheke | Beschwerden, Beipackzettel · 8 | erklären, was fehlt; Anweisungen verstehen; Rat geben | Konjunktiv II: Ratschlag, irreale Bedingung (Gegenwart) | LV2, M2, SB2 | dtz L4, S2 · gb1 L5 | M9, S5-L3 (Untersuchung beim Arzt, Rat geben), S5-L4 (Konjunktiv II irreal), ÖIF B1 | |
| 10 | Glück gehabt! | Erlebnisse, Wendepunkte · B | Erlebnisse in der richtigen Reihenfolge erzählen | Plusquamperfekt · *nachdem / bevor* | HV2, SA | dtz H3 · gb1 H3, L1 | M10–11, N3, S5-L1 (Glück im Alltag, Plusquamperfekt) | |
| 11 | Menschen, die mir wichtig sind | Porträt, Vereinsblog · D | eine Person porträtieren; Menschen beschreiben | n-Deklination · Adjektive als Nomen | LV1, SB2, M1 | dtz L3 · gb1 Sch2 | M1, As B1+ K2 | |
| 12 | Meine Ziele mit Deutsch | Lernziele im Kurs, kurze Präsentation · 11, E | Ziele begründen; kurz präsentieren | *da* (kausal) | HV1, LV1, M2 → **Halbtest** | dtz S2 · gb1 Sp2 (2-Min.-Version) → Halbtest je Spur | ÖIF B1, RC 36; M9 | |

Coverage check tB1: LV1 3, LV2 3, LV3 3, SB1 2, SB2 3, HV1 2, HV2 3, HV3 2, SA 4, M1 3, M2 3, M3 3 (+ a planning round
in every unit). The overloaded Lektion of Proposal A (zu + Infinitiv, um … zu, da, während, bevor in one) is split
across U7, U8, U10 and U12.

#### B1.2 — „Selbstständig handeln und Stellung nehmen" (€60 · lane telc B1; DTZ and Goethe/ÖSD B1 packs)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB1) | Spur (dtz · gb1) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|---|
| — | *Diagnose* (free) | lane mini-mock | — | — | one Teil per module | per lane | — | |
| 1 | Missverständnisse | Sprache, Missverständnisse klären · B, C | Missverständnisse klären; Meinung begründen | *darum/deswegen/nämlich* | **M2**, LV1 | dtz S1 · **gb1 Sch2**, L4 | M13 | |
| 2 | Weiterbildung | Kurse vergleichen, Thema präsentieren · 4 | Angebote vergleichen; ein Thema präsentieren | Partizip I/II als Adjektiv (`g.partizip-attr-einfach`: *die angebotenen Kurse*) | **LV3**, M1 | **dtz L2** · **gb1 Sp2 + Sp3**, H2 | M14, Si8 (compressed example §3.9) | |
| 3 | Die Bewerbung | Stellenanzeige, Anschreiben, Nachfrage · 3 | sich schriftlich bewerben; telefonisch nachfragen | *nicht nur … sondern auch* · *sowohl … als auch* | **SA**, HV3 | **dtz Schreiben** · gb1 L3 | M15, S6-L8, RC 98–99 | |
| 4 | Konflikt im Team | Besprechung, Standpunkte · 2, C | den eigenen Standpunkt einbringen; einen Kompromiss finden | Relativsatz mit *wo/was* · Ausdrücke mit *es* | **M3**, HV2 | dtz S3 · **gb1 Sp1** | N7 (clip), S6-L10, RC 100 | |
| 5 | Werbung, Konsum, Geld | Kaufentscheidungen, Werbung · 7, 9 | Werbung kritisch lesen; Kaufentscheidungen begründen | Passiv Präsens (produktiv) · Passiv mit Modalverb | **LV2**, LV1 | dtz L1 · **gb1 L2** | S6-L9/10, N12, Si7 | |
| 6 | Einspruch! | falsche Rechnung, Versicherung, Fristen · 1, 5 | schriftlich widersprechen; einen Schaden melden | Passiv Präteritum/Perfekt · *innerhalb/außerhalb* + Gen. | **SB1**, SA | **dtz L5**, L3 · gb1 Sch3 | RC 78, 111; M22 | |
| 7 | Mitreden | Gesellschaft, Engagement, Meinungen wiedergeben (Mediation) · A, B | Meinungen wiedergeben und zwischen Positionen vermitteln | *weder … noch* · *entweder … oder* | **HV1**, M2 | **dtz H4** · **gb1 H4** | M18, S6-L11/12, N10 | |
| 8 | Regeln und Anleitungen | Hausordnung, Anleitungen, Abläufe · 12 | Regeln genau verstehen; Abläufe erklären | *indem* · *sodass* | **SB2**, HV3 | **dtz L4** · **gb1 L5** | M20; ZM B1+ | Fokus-DaZ „Betreuungsvertrag und Kita-Ordnung" (HF 6) |
| 9 | Stadt oder Land? | Wohnort wählen, Führung · 12, 10 | Vor- und Nachteile abwägen; einer Führung folgen | *je … desto* · *brauchen … zu* | **HV3**, LV2 | dtz H2 · **gb1 H2** | M19, N11 | |
| 10 | Geschichten von früher | Biografie, Heimat, Vergleich · A | über früher berichten; ein Foto beschreiben und vergleichen | *während* (Konjunktion) · Konjunktiv II Vergangenheit (rezeptiv) | **HV2**, M1 | **dtz S2** · **gb1 L1** | M22, S6-L13, M16–17 | |
| 11 | Klima und Zukunft | Umwelt, Radiodebatte · 9 | Meinungen in einer Debatte zuordnen; begründet Stellung nehmen | *(an)statt / ohne … zu* · *als ob* | **LV1**, SA | dtz H2 · **gb1 H4**, Sch2 | M23–24 | |
| 12 | Zurückblicken, weitergeben | Besprechung, Informationen weitergeben (Mediation) · 2, E | Informationen zusammenfassen und weitergeben | — (Modalpartikeln rezeptiv; Wiederholung) | **M1**, **SA**, SB2 | dtz S1 · gb1 Sch1, Sp3 | RC 86; S6-L14 | |
| — | *Prüfungswochen* | Modelltest A, B, C (telc B1 150 + 15 min + 20 prep); DTZ A, B; Goethe/ÖSD B1 A, B (per module) | — | — | all Teile | — | — | |

#### B2.1 — „Argumentieren und im Detail verstehen" (€65 · lane telc B2; Goethe B2 pack)

Genres at reduced length (telc SA ≈ 120 words, Goethe S1 ≈ 110, S2 ≈ 70); single play by default from here
([m03] impl. 8, 10). Topics follow Aspekte neu B2 K1–5 and Sicher! aktuell B2.1 L1–6 / B2.2 L7–12, whose tables of
contents were read on 2026-09-27 from Hueber's Inhalt PDFs (header of this document); memo 14 had marked the B2.1
titles (unverified) ([m14] §B6), and those rows now cite verified lessons.

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB2) | Spur (gb2) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|---|
| 1 | Heimat ist … | Identität, Ankommen · A | Standpunkte erläutern; über Erfahrungen berichten | Wortstellung im Mittelfeld · Stellung von *nicht* | M1, LV1 | L1 | As1, Si L1 | |
| 2 | Wie wir miteinander reden | Gesprächskultur im Job · C, 2 | sich an Diskussionen beteiligen; nachfragen | Infinitivsatz vs. *dass*-Satz | M2, HV2 | Sp2 (verkürzt), H3 | As2, Si L3 (dass-Sätze und ihre Entsprechungen) | |
| 3 | Arbeit ist das halbe Leben? | Arbeitszeitmodelle · 2 | Vor- und Nachteile darstellen; Vorgesetzte informieren | Nomen-Verb-Verbindungen | LV2, SB2, HV3 | S2, H1 | As3, Si L2 (In der Firma), Si L5 (Verbverbindungen) | |
| 4 | Beschwerde mit Anspruch | mangelhafte Dienstleistung · 7, C | sich formell beschweren; eine Forderung stellen | Passiv + Passiversatz (*lässt sich*, *ist zu*, *-bar*) | SA (B), SB1 | L3 | ZM B2 — **deviation vs Si L10**: the complaint genre needs it here | |
| 5 | Zusammen wohnen | WG, Nachbarschaft · 12 | Probleme erörtern; gemeinsam Lösungen planen | Relativsatz mit *wer/was* (verallgemeinernd) | M3, LV3 | L4 | As4 (split: Si L7 generalisierende Relativsätze) | Fokus-DaZ „Elternabend: mit der Schule sprechen" (HF 6, advisory) |
| 6 | Presse mit Haltung | Kommentare, Nachrichten · 9 | Standpunkte in Texten erkennen | erweitertes Partizipialattribut, rezeptiv (`g.partizip-attr-erweitert`; einfaches Partizipialattribut B1.2 U2: Wiederholung) | LV1, HV1 | L4, S1 | Si L2 (Partizip I und II als Adjektive), Si L3 (Medien) (split As10) | |
| 7 | An die Vorgesetzte *(Pflege 1)* | Pflegeheim: Dienstplan, Überlastung · 2 | Probleme sachlich darstellen; Vorschläge machen | Konjunktiv II Vergangenheit (produktiv) | SA, M3, SB1 | S2 | Si L2 (In der Firma: geschäftliche E-Mail), Si L6 (Bedeutungen des Konjunktiv II) — **deviation:** the care setting serves the B2 care segment ([m10] impl. 5); the productive past follows the [m06] ladder | |
| 8 | Anerkennung und Bewerbung | Anerkennung, qualifizierte Bewerbung · 3, 4 | Qualifikationen darstellen; Informationen erfragen | Zustandspassiv · *von/durch* im Passiv | SA (A), LV3, M1 | L5, Sp1 (verkürzt) | Si L2 (Zustandspassiv; von oder durch), Si L4 (Berufseinstieg, Berufsmesse) (split As6); BSK | |
| 9 | Ursachen und Folgen | Konsum, Klima: Hypothesen · B | Ursachen und Folgen erklären; Vermutungen äußern | Futur II (Vermutung) · Bedeutungen des Konjunktiv II | M2, HV2 | H2 | Si L5 (Futur II – Vermutungen), Si L6 (Bedeutungen des Konjunktiv II) | |
| 10 | Radio und Podcast | Interviews, einmal gehört · 9 | Standpunkte in Gesprächen erkennen | Verweiswörter (*es*, *da(r)-*) | HV1, HV3 | H1, H3 | As2, Si L3 | |
| 11 | Wissenschaft im Alltag | Forschung verständlich · 4 | Sachtexte verstehen und für andere zusammenfassen (Mediation) | Vergleichssätze *je nachdem (ob)*, *als/wie* + Nebensatz (`g.vergleichssatz-erweitert`; *je … desto* B1.2 U9: Wiederholung) · Nominalstil (rezeptiv) | LV2, SB2 | L2 (Textlücke), H4 | As5, Si L7 (Vergleichssätze) | |
| 12 | Online zusammenarbeiten | Projekt, eigene Fehler kontrollieren · E | online im Team kommunizieren; eigene Fehler erkennen | *lassen*: Bedeutungen und Perfekt (*hat … prüfen lassen*) (`g.lassen-bedeutungen`; *lassen* = veranlassen A2.2 U7: Wiederholung) | M1, SA → **Halbtest** | S1, Sp1 → Halbtest | Si L5 (Das Verb lassen) — **deviation:** online collaboration is placed here for the online-interaction can-do (ALL-06); no verified B2 book places the topic | |

#### B2.2 — „Wirkungsvoll diskutieren, vortragen, vermitteln" (€65 · lane telc B2; Goethe B2 pack)

| # | Titel | Situation · HF | Kern-Kann-Beschreibungen | Grammatik neu | Prüfungsteile (tB2) | Spur (gb2) | Leaders | Fokus (HF) |
|---|---|---|---|---|---|---|---|---|
| — | *Diagnose* (free) | lane mini-mock | — | — | one Teil per module | Diagnose gb2 | — | |
| 1 | Beziehungen | Freundschaft, Einstellungen · B | Einstellungen vergleichen; Gehörtes wiedergeben | subjektive Modalverben (*soll … haben*, *will … sein*) | **LV1**, HV1 | **L1** | Si7, As9 | |
| 2 | Ein Vortrag | Vortrag halten, Fragen beantworten · E | einen Vortrag gliedern und halten | Nominalisierung ↔ Verbalisierung | **M1**, HV2 | **Sp1** | ZM B2, Si8 (Nominalisierung von Verben) | Fokus „Im Kurs: einem Vortrag Feedback geben" (HF 11, advisory) |
| 3 | Dafür oder dagegen? | Pro/Contra im Team: Vier-Tage-Woche · C, 2 | argumentieren, widersprechen, zusammenfassen | konzessive und adversative Konnektoren (*obgleich*, *wohingegen*, *während* adversativ; *zwar … aber* B1: Wiederholung) | **M2**, LV2 | **Sp2** | Si8 (konzessiv), Si12 (Adversativsätze), As10 | |
| 4 | Service und Schadensersatz | verhandeln, Grenzen setzen · 7 | einen Schaden darlegen; Forderungen verhandeln | indirekte Rede: Konjunktiv I (Einstieg) | **SA** (B, ≥ 150 W), M3 | L3 | Si10, ZM B2+ | Fokus „Einen Schaden der Versicherung melden" (HF 5, advisory) |
| 5 | Essen, Gesundheit, Fitness | Studien, Ernährung · 8 | Informationen aus Vorträgen verarbeiten; Stellung nehmen | Modalsätze *dadurch … dass*, *ohne dass*, *(an)statt dass* (`g.modalsatz-erweitert`; *indem* B1.2 U8: Wiederholung) | **HV2**, LV2 | **S1** (≈ 150 W), **H2** | Si8, Si11, As6 | |
| 6 | An der Uni | Studienordnung, Vorlesung · 4 | Regeln und Vorlesungen verstehen | Nomen, Verben, Adjektive mit Präpositionen | **LV2**, HV2 | **L5**, **H4** | Si9; [m03] impl. 11 | |
| 7 | Kultur und Kunst | Kritiken, Kulturberichte · 9 | Kritiken verstehen und verfassen | erweitertes Partizipialattribut, produktiv (`g.partizip-attr-erweitert`, rezeptiv seit B2.1 U6: Wiederholung/Erweiterung) · Partizipien als Nomen | **LV1**, SB2 | **L2** | As7, Si12 (Erweitertes Partizip; Partizipien als Nomen) | |
| 8 | Aus der Geschichte | Erinnerung, Berichte weitergeben (Mediation) · A | Berichte zusammenfassen und weitergeben | Konjunktiv I (Vergangenheit, produktiv) | **HV1**, M2 | H3 | As8, Si7 (Indirekte Rede) | |
| 9 | Das Mitarbeitergespräch *(Pflege 2)* | Ziele, Kritik, Fortbildung · 2 | Kritik begründen und annehmen; Ziele vereinbaren | konditionale/konsekutive Konnektoren *sofern*, *vorausgesetzt, dass*, *folglich*, *so … dass* (*falls* B1.1 U2, *sodass* B1.2 U8: Wiederholung) · Modalpartikeln (produktiv; rezeptiv seit B1.2 U12) | **M3**, SB1 | **S2** (≈ 100 W) | BSK 20.4, 52.1; Si8 (konditional), Si9 (konsekutiv) | |
| 10 | Widerspruch einlegen | Bescheid, formell begründen · 1 | Bescheide verstehen; formell widersprechen | Präpositionen mit Genitiv (*aufgrund*, *hinsichtlich*, *bezüglich*) | **SA** (A/B), **SB1** | L4 | As10; BSK 39.3 | |
| 11 | Sprache und Regionen | Dialekte, Reportagen, D-A-CH · 9 | Reportagen verstehen; Varietäten erkennen | Textkohäsion: Verweiswörter und Konnektoren | **HV3**, **LV3** | **H1** | Si12 | Fokus-DaF „Unterwegs in Österreich und der Schweiz" (HF 10, advisory) |
| 12 | Ein Blick in die Zukunft | Arbeitswelt der Zukunft: Szenarien, lebhafte Diskussion · B, 2 | Szenarien diskutieren | — (Futur II, Wiederholung) | **SB2**, **M2**, LV3 | **L3**, **L4**, **Sp2** | As10 | |
| — | *Prüfungswochen* | Modelltest A, B, C (telc B2 140 + 15 min + 20 prep); Goethe B2 A, B (per module) | — | — | all Teile | — | — | |

**Quotas the validator checks on the specs (ALL-06):** ≥ 1 online-interaction can-do per half-level; from B1.1,
**per half-level**, ≥ 1 mediation can-do and ≥ 3 work units (a unit tagged HF 2 or 3) ([m05] impl. 3); B2 ≥ 2
care/health workplace units at general-language level; spiral threads B1.1 → B2.2 (Beschwerde, Meinung, Konsultation,
Weitergeben) each name their band step ([m05] §3). **Recount after the critic pass (2026-09-26):** work units B1.1
U3, U7, U8 · B1.2 U3, U4, U12 · B2.1 U2, U3, U7, U8 · B2.2 U3, U9, U12; mediation B1.1 U3 · B1.2 U7, U12 · B2.1 U11 ·
B2.2 U8; care units B2.1 U7, B2.2 U9. **Handlungsfelder (ALL-04), units + planned Fokus-Karten:** A1 all 12 (HF 3
A1.2 U1, HF 4 A1.2 U12, HF 5 A1.2 U10, HF 6 A1.1 U12 via Fokus); A2 all 12 (HF 6 A2.1 U10 via Fokus); B1 all 12 (HF 6
B1.2 U8 via Fokus, HF 11 B1.1 U12 by tag); B2 advisory (HF 5, 6, 10, 11 via Fokus). The curriculum agents **re-run
ALL-04 and ALL-06 on the specs before the W2 freeze** (§10.3).

---

## 3. Unit anatomy and lesson anatomy

**Principle: fixed slots, typed content** (C). Every unit of a level has the same slots; each slot has a template,
counts, constraints and gates (§9). The A skeleton is the Schritte/Menschen union; the B skeleton is the
Aspekte/Sicher! one ([m14] §G4–G5): the opener becomes a prompt, each input is one text type, grammar is inductive.
The A skeleton is **not** reused from B1.1 on.

### 3.1 A-level unit (A1.1–A2.2), one week at Standard pace

| Slot | Min A1 / A2 (design) | What happens | Authored | Scored |
|---|---|---|---|---|
| **Start** (opens LS1) | 2 | Lernziele box (3–5 can-dos, own ich-Form wording); Prüfungsfokus chips („Hören Teil 3 · Schreiben Teil 2"); serial scene (≤ 90 s A1, ≤ 2 min A2) with one gist item; „Ich kann das schon" offer | refs, scene lines, 1 item | 1 |
| **LS1 Situation 1** | 20 / 22 | the six segments of §3.3; structure 1 headed by its model sentence; **in U1 of every course the micro-output is spoken and scored within the first three screens** | input, 5 input items, 4 structured-input, pool of 16 + reserve of 4–6, micro-output | ≈ 28 + micro |
| **LS2 Situation 2** | 20 / 22 | structure 2 or Wortfeld block 2; contrast interleaving from here | same | same |
| **LS3 Situation 3** | 20 / 22 | an exam text type (note, ad, sign, e-mail, announcement) + Wortfeld block 3; where the unit has a third receptive Prüfungsfokus Teil, this input is written against that Teil's template and its input items are a `mini` block of it (COV-3) | same | same |
| Aussprache (inside LS1 and LS3) | 2 each | 4 perception items with ≥ 4 voices (HVPT, [m09] §9), then read-aloud of the model sentence, scored as *Verständlichkeit* with segment feedback (ü/u, vowel length, ich-Laut), never a global accent score | 1 line + generated perception items | 1 |
| **LS4 Prüfungstraining** | 20 / 25 | 1–2 primary-lane blocks against their Teil templates + strategy card (≤ 60 words, design, e.g. „Sie hören den Text nur einmal. Lesen Sie zuerst die Aussage."); .1: Lernmodus, „Im Prüfungsmodus wiederholen" offered (A1.1: only after the learner set an exam date); .2: ≥ 1 block full length in Prüfungsmodus; the learner's Spur-Karte where COV-6 requires it | blocks + card | block items |
| **LS5 Sprechen** | 20 / 22 (.2: 25) | the unit's exam-format speaking Teil with the AI partner (A1.1 slow, repeats, word bank; A1.2 one AI partner who also reads the instructions — the group simulation with 1–3 AI candidates is v1.1, only if the pilot shows it matters): plan → attempt → automatic result → one retry; the session has a hard length from the template (§4.7) | speaking task (bank) | 1 Aufgabe |
| **LS6 Schreiben** | 20 / 22 | the unit's exam-format writing Teil: plan → draft with live pre-check → AI result → self-correction prompts → revision → reformulation + model text | writing task (bank) | 1 Aufgabe + revision |
| **LS7 Lektions-Check** | 15 | 12 deterministic items (≈ 65 % this unit; ≈ 35 % drawn at runtime from the reserves of the previous three units by a rule, never by item id); one proof per can-do; „Das kann ich" ticks confirmed by proofs; Lernwortschatz into the SRS; gold Siegel; cliffhanger + next unit's title and minutes | 12 items + proofs | 12 |
| Daily review | 6 (A1) / 7 (A2) × 6 days | §6 | generated | — |
| Fokus-Karte (optional) | 10 | §3.7 | 0–2 cards | optional |

In-lesson time: A1 135 min (A1.2 140), A2 150 min (A2.2 153). LS5/LS6 carry the unit's productive Prüfungsfokus
Teile; if the unit has none, the next productive Teil in rotation (COV-5).

### 3.2 B-level unit (B1.1–B2.2), one week at Standard pace

| Slot | Min .1 / .2 (design) | What happens |
|---|---|---|
| **LS1 Auftakt + Text A** | 25 | ambiguous photo (an approved `Asset`, §4.9; until one exists, the question alone) or question („Was passiert hier? Was würden Sie tun?"), 60 s free speaking scored for fluency and task only (course-micro); Lernziele + Prüfungsfokus; **Text A** (usually Lesen) in one exam text type at the half-level's length; gist → detail; Wortfeld block 1 |
| **LS2 Text B** | 25 | usually Hören (announcement, interview, tour, radio debate) in one text type; the serial scene; single play by default from B2.1 in exam-shaped items; carries a third receptive Prüfungsfokus Teil as a `mini`/`reduced` block where the unit has one (COV-3) |
| **LS3 Sprache** | 25 | inductive grammar from Texts A/B (learner fills the rule table → rule card), recall practice, Wortschatz & Präzision (blocks 2–3, a Sprachbausteine-style cloze from B1.2), Redemittel for the Aufgaben |
| **LS4 Prüfungstraining** | 25 / 30 | 1–2 lane blocks; .2 ≥ 1 full length in Prüfungsmodus |
| **LS5 Sprechen** | 25 / ≤ 45 | the discourse task with the lane's interaction mode; **a planning round of ≥ 3 min in every B1 unit**; .1 Lernmodus with shortened preparation labelled „in der Prüfung: 20 Min. Vorbereitung"; .2 full preparation in Prüfungsmodus in ≥ 6 of 12 units, with a save point after the preparation |
| **LS6 Schreiben** | 25 / ≤ lane time + 5 | the writing Teil; .1 reduced length (B2.1: telc ≈ 120, Goethe S1 ≈ 110, S2 ≈ 70 words); .2 full length in the lane's time (telc B2 30 min, Goethe B2 S1 ≈ 50 min per [m03] §1 via Klett) |
| **LS7 Überarbeiten** | 12 | on the next learning day: self-correction prompts → revision → second result → reformulation (≤ 3 points) + model text |
| **LS8 Lektions-Check** | 15 | as at A, plus a Grammatik-Rückschau (`check.rueckschau`: the unit's rule cards) and a 60-s *Porträt* of a real, sourced person or place as the reward screen ([m14] §E19; `check.portrait` with a CON-06 fact). A Porträt of a real person is **text-only** unless a licensed image with the right to depict exists (AST-02) |
| Daily review | 9 (B1) / 11 (B2) × 6 days | §6 |

In-lesson time: .1 ≈ 177 min, .2 ≈ 199 min on average. This fixes the impossible budget of a single 25-minute B
Aufgabe: speaking and writing are separate sessions, full-length writing gets the lane's own time, and the revision
is its own spaced session.

### 3.3 The Situation-Lernschritt, segment by segment (A: LS1–LS3; B: LS1–LS3 adapted)

| # | Segment | Min A / B | Content | Items |
|---|---|---|---|---|
| 1 | Aufwärmen | 3 | 6 due SRS items in recall format; contrast partners mixed in from the point's second LS | 6 (generated) |
| 2 | Input | 5 / 7 | A: dialogue 8–14 lines, 60–120 s (A1.1: 6–10 lines); B: 150–450 words or 2–4 min audio in an exam text type; ≥ 95 % known tokens; gist → detail → transcript only after the first unaided listen | 2 gist + 3 detail |
| 3 | Form | 3 / 4 | A: model sentence + rule card + 4 structured-input items where the form carries the meaning; B: rule table filled from the text, then the card | 4 |
| 4 | Üben | 5 / 6 | 12 items served from a pool of 16 (design, inherited from A1.1), one per screen, feedback + one retry; a miss returns once as a *different* item of the same topic (`requeue.js`), drawn from the unused pool items or the reserve | pool 16 + reserve 4–6 |
| 5 | Micro-output | 3–4 / 4–5 | 30 s plan → A: 20–40 s spoken or 1–3 typed sentences; B: 40–60 s or 40–60 words → automatic mini-result (`course-micro`) → one revision; spoken and written alternate across LS1–LS3 | 1 |
| 6 | Abschluss | 1 | 3 unseen pool items; next review date shown | 3 (from pool) |

≈ 28 scored interactions per LS, **≥ 70 % recall formats** ([m09] impl. A3). **The reserve (defined).** Every
Situation-LS and Text-LS carries an authored `reserve` of 4–6 items, written to the same spec, key rules and gates as
the pool but **never served in that LS's 12 or its 3 exit items**. The reserve is the only source for: requeue
alternates once the pool's 4 unserved items are spent, `Check.earlierDraw` of later units (§3.1 LS7), the Plateau
review sets (§5.2), „Mehr üben" (§3.7), `repair` cards (§6.2) and the Einstufung (§5.7). Arithmetic per LS: pool 16 =
12 served + 3 exit + 1 spare; reserve 4–6; per unit ≈ 12–18 reserve items (A: 3 Situation-LS; B: LS1–LS2 + LS3's
Sprache pool), per course ≈ 144–216, against ≈ 60 needed by three Plateau review sets and ≈ 44 by the Lektions-Checks
(derived). ITM-06 checks the reserve size and that no reserve item duplicates a pool item's POS-masked key. **Stuck-point repair:** after 2 misses of
the same item class (topic × type) in one LS, a 3-item repair drill with the rule card, then „Weiter – das kommt in
Ihre Wiederholung"; never a third failure in a row without help (B). **Resume** at item level („Weiter bei Frage 9
von 26").

### 3.4 Item types and the mix by level

| Type | Renderer (exists unless **new**) | Checked by | Used in |
|---|---|---|---|
| `fill_blank` | `PracticeItem` | `check.js` (`accepted`, `caseSensitive`, strict topics) + **new** `exact` | practice, exit, proofs |
| `multiple_choice` (3 options; non-exam items only) | `PracticeItem` | key | structured input, gist/detail |
| `error_correction` | `PracticeItem` | `check.js` + `tagError` | practice (≤ 2 per pool) |
| `sentence_building` | `WordOrderItem` | `check.js`; **every grammatical order** in `accepted` | practice |
| `match` | `MatchItem` | key | Wortschatz (often generated) |
| `listen_select` | `ListenSelectItem` | key | Aussprache, Hören |
| `dictation` | `DictationItem` | `check.js` dictation mode | Hören |
| `read_aloud` | `ReadAloudLine` + `score-readaloud` | STT alignment, *Verständlichkeit* | Aussprache, no-mic fallback = listen_select |
| `richtig_falsch`, `ja_nein` | **new** 2-option shell | key | exam blocks |
| `abc` | Modelltest `mc-group` | key; per-item options = template `options` (3 in every launch lane) | exam blocks |
| `zuordnen` (with a no-match option X/0/x) | Modelltest `matching` | the answer is a **key of the block's `choices`** (texts, ads, headings, people, pictures) or the block's `noMatchKey`; the no-match counts as an answer; reuse only where the template allows it | exam blocks |
| `cloze` (Sprachbausteine) | Modelltest `cloze` | per-gap a/b/c options (`tb1.sb1`) or a key of the block's word bank `choices` (`tb1.sb2`, `tb2.sb2`: 10 gaps from 15 words) | B1.2–B2.2 practice, exam blocks |
| `notes` | **new** `DictationItem` variant | numbers and spelled names **exact**, words spelling-tolerant (telc accepts „Donerstach", [m01] impl. 8) | ta2 H1, oza1 H2, B2 notes |
| `form_fill` | `WritingStage` (Formular) generalised | per field; numbers exact | sd1 S1, ta2 S1 |
| `insert` | **new** | a key of the block's sentence `choices` (`gb2.l2`: 6 gaps, 8 sentences) | gb2 L2 |
| `micro_output` | `GradedWriting` / **new in-lesson speaking** | pre-check + `course-micro` | LS micro-outputs |
| `exam_writing` | `GradedWriting` + writing bank | pre-check + lane rubric | LS6, Plateaus, mocks |
| `exam_speaking` | **new in-lesson speaking** + speaking bank | lane rubric | LS5, Plateaus, mocks |

**Mix of an LS practice pool (design; ITM-07/08 check it):**

| Level | typed gap + dictation | sentence_building | error_correction | MC / match / listen_select | generated items ≤ |
|---|---|---|---|---|---|
| A1 | 45–55 % | ≥ 25 % | ≤ 10 % | ≤ 20 % | 40 % |
| A2 | 45–55 % | ≥ 20 % | ≤ 12 % | ≤ 20 % | 40 % |
| B1 | 40–50 % (Sprachbausteine cloze from B1.2) | ≥ 15 % | ≤ 15 % | ≤ 20 % | 30 % |
| B2 | 40–50 % | ≥ 10 % | ≤ 15 % | ≤ 25 % | 25 % |

Generated items (lexicon drills, dictations from input lines, minimal-pair perception, review cards) are produced
by code from the lexicon and spine, so their correctness is inherited; a pool that is all generated is flat
(A1.1 review #9's "four times the same frame"). ≥ 25 % of a unit's scored items are exam-format types. Skill time
share targets per unit ([m09] impl. A5): A1–A2 Hören 30 / Lesen 15 / Sprechen 20 / Schreiben 10 / practice 25 %;
B1–B2 25 / 25 / 20 / 15 / 15 %.

### 3.5 Start, test-out, completion and gates

- **„Ich kann das schon"** runs the unit's LS7 items plus one proof per can-do. ≥ 80 % → the deterministic
  Lernschritte (LS1–LS4, B: LS1–LS4) are credited (`tested_out`). **The two Aufgaben stay open**; the unit becomes
  `complete` only when both are submitted.
- **Completion is defined once**, in `course.json` (SCHEMA §5), and read by the course home, the
  Teilnahmebescheinigung, the reminders and `weekly_truth_metrics()`:
  - a Lernschritt is *finished* when every item was answered (right or wrong);
  - an Aufgabe is *submitted* only as a **real attempt**: writing ≥ 50 % of the lower word bound (never an empty or
    pasted-prompt text); a **form** task (`form_fill`, e.g. `sd1-s1`, `ta2-s1`) when every field is non-empty;
    speaking ≥ 20 s of detected speech, **measured server-side and recorded in `course_ai_usage`** (SCHEMA §14), or
    ≥ 2 turns in a card mode;
  - a unit is *complete* when all its Lernschritte are finished or tested out **and** both Aufgaben are submitted;
  - a course is *complete* when 12 units are complete, P1–P3 are submitted and the closing block's first form is
    submitted — for a **.1 course the Halbtest of the learner's lane**, for a **.2 course Modelltest A of the learner's
    lane**; the free week-1 Diagnose never satisfies it (SCHEMA §5 pins both). **No score is ever required.** B's
    „übersprungen" Aufgaben do not exist here.
- **Gates:** the next unit opens when the previous unit's Lernschritte are finished; „Trotzdem öffnen" is always
  available. A deterministic Lektions-Check below 60 % *suggests* repeating one LS; the learner can override.
  **No gate reads an AI score** (PRG-01; [m13] impl. 4).

### 3.6 LS4, Aufgaben and lane blocks in practice

- The **primary-lane block** is authored inline in the unit file. A **Spur-Karte** for a secondary lane lives in
  `units/uNN.lane-<lane>.json` and occupies the same slot; the player shows the learner exactly one of them.
- In a **.1 course** a secondary-lane learner may meet a primary-lane block in a family that transfers; it then
  carries its origin label (COV-6). Lane-only Teile reach that learner only through Spur-Karten (COV-1).
- In a **.2 course** every block and Aufgabe a learner meets is lane-exact for the learner's lane.
- Prüfungsmodus sessions follow the lane: preparation timer and notes, notes collapsed to ≤ 5 keywords while
  speaking, play counts, reading time, no spellcheck. When a spoken answer overlaps the learner's own notes almost
  word for word (≥ 80 % of 5-grams, design), the result says „Hier würde die Prüferin unterbrechen: Sprechen Sie
  frei." (telc examiners must interrupt memorised speeches, [m03] §2).

### 3.7 Fokus-Karten and optional depth

- **Fokus-Karten** (0–2 per unit, ≈ 10 min, optional, never counted toward completion; the planned ones count for
  Handlungsfeld coverage, ALL-04): Fokus-DaZ (Amt, Kita, Jobcenter, Krankmeldung
  bei der Arbeit), Fokus-DaF (Hotel, Reise, Studium abroad), Fokus-Beruf. Recommended by the onboarding purpose
  question ([m14] §E8). Swappable units are marked (A2.2 U11).
- **„Mehr üben"**: the reserve items of each LS (§3.3).
- **Extensive strand at B1/B2** (where self-study learners most lack input volume): a *Lesemagazin* text and a
  *Hörmagazin* piece per Plateau (≥ 98 % known tokens). A graded serial reader tied to the cast (one optional
  chapter per Etappe) is **not in the v1 cut** (§1.4). Never gates; the plan recommends it when the exam date leaves
  room.

### 3.8 Worked example: A1.2 U5 „Ich bin krank – ich sage ab"

- **Lernziele:** „Am Ende der Lektion können Sie sich am Telefon und schriftlich krankmelden, sich entschuldigen und
  einen Grund nennen, um einen neuen Termin bitten und sagen, was Sie gestern gemacht haben."
- **Prüfungsfokus (SD1):** **Schreiben Teil 2** (full, Prüfungsmodus by default in A1.2), Hören Teil 3, Sprechen Teil 3.
- **Grammatik neu:** *denn* (M23, S14, N12) · Perfekt mit *haben*, systematisch (participles regular and irregular:
  *gearbeitet, gemacht, gekauft, geschlafen, getrunken, gegessen, genommen, gehabt*). Contrast partner of *denn*:
  *und/aber* (all V2); *weil* is A2.1.
- **Wortschatz (≈ 26 new, 3 blocks):** *Körper und Beschwerden* (der Kopf, der Hals, der Bauch, das Fieber, der
  Husten, wehtun …), *Termine* (absagen, verschieben, zurückrufen, Bescheid sagen …), *Arbeit und Kurs* (die Chefin,
  die Kollegin, die Hausaufgabe …).
- **LS1 „Auf dem Anrufbeantworter"** — model sentence *„Ich kann heute nicht kommen, denn ich bin krank."*; Priya's
  message to Frau Schulz (course leader, Sie) and Emre's message to Priya (du) — every speaker is in the A1 cast
  bible (§2.7; CON-01); structured input „Priya kommt heute nicht, denn Arjun ist krank. — Wer ist krank?"; spoken
  micro-output: the learner's own sick call to a course leader or a boss (who, why, when back).
- **LS2 „Was haben Sie gestern gemacht?"** — participle formation, *haben* + participle in the Satzklammer; the A1.1
  chunk verbs return as the known half of the contrast.
- **LS3 „Eine Nachricht an Frau Schulz"** — Emre's 32-word Absage as the model text type (checked by the same
  pre-check the learner's text will get); „Was steht wo?": Anrede, Grund, Bitte, Gruß.
- **LS4** SD1 Hören Teil 3, full (5 items, played twice, Prüfungsmodus): voicemails from the Praxis Dr. Albers,
  spoken by file-level extras with their own voices (SCHEMA §3.3); CON-04 checks *halb elf* = 10.30 on every time item.
- **LS5** SD1 Sprechen Teil 3 with one AI partner (v1; §4.4): picture cards (Tee, Tablette, Taschentuch, Fenster —
  approved image assets, §4.9 — A1.2 is a .2 course, which never uses a scaffolded text variant, so its lane goes live
  only once these images are approved); 2 requests + 2 reactions; 2 points per request, 1 per reaction, full/half/0 by intelligibility,
  „nicht die Zahl der Fehler" ([TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) p. 46).
- **LS6** SD1 Schreiben Teil 2: „Sie haben morgen um 10 Uhr einen Termin in der Praxis Dr. Albers. Sie können nicht
  kommen. Schreiben Sie an die Praxis: – Entschuldigen Sie sich. – Nennen Sie einen Grund. – Fragen Sie nach einem
  neuen Termin." ≈ 30 words; Anrede and Gruß are scored under *Kommunikative Gestaltung*, never as a Leitpunkt. Result
  card after the first attempt:

  > **Schreiben Teil 2 · Übungswert 6,5 von 10 (Richtwert)**
  > Leitpunkt 1 „sich entschuldigen" — erfüllt (3/3): *„Es tut mir leid, ich kann morgen nicht kommen."*
  > Leitpunkt 2 „einen Grund nennen" — erfüllt (3/3): *„Ich bin krank."*
  > Leitpunkt 3 „nach einem neuen Termin fragen" — nicht erkennbar (0/3).
  > Anrede und Gruß — teilweise (0,5/1): Die Anrede fehlt.
  > **Ihr nächster Schritt:** Fragen Sie höflich nach einem neuen Termin. → Überarbeiten
  > *Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein Prüfungsergebnis. Richtwert.*
- **LS7** proofs: „Ich kann mich am Telefon krankmelden" → choose the Krankmeldung among three messages;
  „… mich schriftlich entschuldigen" → the LS6 submission (recorded as submitted, the score is not used).
- **Fokus-DaZ „Krankmeldung bei der Arbeit"** (the corrected Landeskunde): DE (A1.2-simple) „Sagen Sie Ihrem
  Arbeitgeber sofort Bescheid. Sind Sie länger als drei Tage krank, brauchen Sie eine Bescheinigung vom Arzt – der
  Arbeitgeber kann sie auch früher verlangen. Sind Sie gesetzlich versichert, bringen Sie keinen ‚gelben Schein'
  mehr: Ihr Arbeitgeber bekommt die Krankmeldung elektronisch von der Krankenkasse." EN twin states the detail and
  the exceptions (privately insured employees still present the certificate; Minijobs in private households and
  certificates from doctors outside the statutory system are excepted). Fact record: `sources` § 5 Abs. 1 and 1a
  EntgFG (<https://dejure.org/gesetze/EntgFG/5.html>), `factsCheckedOn: 2026-09-27`, `currentAsOf: 2023-01-01`,
  `exceptions: [...]`.

### 3.9 Compressed example: B1.2 U2 „Weiterbildung" (three lanes)

The DTZ and Goethe/ÖSD lanes are shown to prove the full design; the v1 cut ships the telc B1 lane only (§1.4).

- **Auftakt:** photo of an evening class, 60 s „Was passiert hier? Würden Sie so einen Kurs machen?".
- **LS1 Text A:** a Volkshochschule programme (12 short course ads, stored once as the step's `texts`). Primary block
  `tb1.lv3` (10 situations → 12 ads as block `choices` a–l, no-match key „x"; SCHEMA §15.7), full length, Prüfungsmodus
  by default. Spur-Karten: `dtz.l2` (5 situations) and `gb1.l3` (7 situations → 10
  ads, „0"), each its own item set; the ad texts are a shared asset, the items are not.
- **LS2 Text B:** an information evening (≈ 400 words). Goethe learners get `gb1.h2` (5 MC, played once, 60 s
  reading time); telc learners get a Lernmodus detail block on the same recording.
- **LS3 Sprache:** *Partizip als Adjektiv* found in the programme (*die angebotenen Kurse, ein laufender Kurs*) → rule
  table → card.
- **LS5 Sprechen:** telc `tb1.m1` (mode `get-to-know`: both partners ask each other from a cue list) + the planning
  round; DTZ `dtz.s1` (mode `monologue` with examiner follow-ups, no preparation) + planning round; Goethe `gb1.sp2` +
  `gb1.sp3` as one task with two `parts` (15 min preparation, 5 fixed slides: topic and structure, own experience,
  home country, pros/cons + opinion, close; [m02] §1).
- **LS6 Schreiben:** telc `tb1.sa` e-mail to a language school (4 Leitpunkte); DTZ `dtz.schreiben` A or B (Anfrage
  an den Kursanbieter / Beschwerde über einen Kurs); Goethe `gb1.sch3` (formal, ≈ 40 words).
- **LS7** revision next day; **LS8** check + Porträt (a sourced fact card, CON-06).

---

## 4. Speaking and writing with AI grading

### 4.1 Task types per level (the exam formats they mirror)

| Level | Schreiben (primary lane · packs) | Sprechen (primary lane · packs) | Micro-outputs |
|---|---|---|---|
| A1.1 | sd1 S1 form (5 fields); sd1 S2 message, 2–3 Leitpunkte, ≈ 20–30 words, untimed | sd1 Sp1 vorstellen (+ spell, number), Sp2 Fragekarten, Sp3 Bitten; AI slow, repeats, word bank | spoken 20–30 s / 1–2 sentences |
| A1.2 | sd1 S1, S2 full (≈ 30 words, 3 Leitpunkte) | sd1 Sp1–Sp3 with one AI partner who also reads the instructions (v1; group simulation v1.1 only if the pilot shows it matters); repeats on request | 20–40 s / 1–3 sentences |
| A2.1 | ga2 S1 SMS 20–30, S2 E-Mail 30–40 · ta2 S1 form from documents, S2 3 of 4 points ≈ 40 | ga2 Sp1 cards, Sp2 über sich (+ follow-ups), Sp3 planen · ta2 Sp1–Sp3 (incl. joker card); normal pace with clarification | 30–40 s / 2–3 sentences |
| A2.2 | same, Prüfungsmodus | same; the learner keeps the conversation going (A2+) | same |
| B1.1 | tb1 SA (4 Leitpunkte; Lernmodus) · gb1 Sch1/Sch2 at ≈ 60 words, Sch3 ≈ 40 · dtz Schreiben A/B | tb1 M1–M3 (+ planning round every unit) · gb1 Sp1, Sp2 (2-min version), Sp3 · dtz S1–S3 (no preparation); partner disagrees and must be convinced | 40–60 s / 40–60 words |
| B1.2 | full length, Prüfungsmodus: tb1 SA 30 min · gb1 ≈ 80/80/40 · dtz A/B | full preparation times; gb1 Sp2 3 min + Sp3 | same |
| B2.1 | tb2 SA reduced ≈ 120 words · gb2 S1 ≈ 110, S2 ≈ 70 | tb2 M1–M3 reduced · gb2 Sp1 2 min, Sp2 3 min; partner interrupts memorised speech | 60 s / 60 words |
| B2.2 | tb2 SA ≥ 150 in 30 min (A/B choice) · gb2 S1 ≈ 150, S2 ≈ 100 | tb2 M1–M3 full · gb2 Sp1 ≈ 4 min + questions, Sp2 ≈ 5 min | same |

Writing ladder follows [m14] §G9 (Formular → SMS/Einladung/Absage → E-Mail with Leitpunkte → Bericht/Reklamation/
Bewerbung → Forumsbeitrag/Kommentar → formelle Beschwerde/Stellungnahme); speaking ladder [m14] §G10.

### 4.2 The writing pipeline

1. **Live deterministic pre-check** (client, twinned on the server, < 100 ms, never blocks): word counter against the
   profile band; the official zero-rule warning in the exam's own words („Nach der Bewertungsregel von Goethe bekäme
   dieser Text 0 Punkte: weniger als die Hälfte der Wörter."); Anrede/Gruß/Betreff present per text type; du/Sie
   drift; share of sentences starting with *Ich/Wir* (telc); Leitpunkt cue coverage from author-given cue lemmas
   (advisory; the AI decides). The server twin needs the same inputs, so the compiled bank entry carries each
   Leitpunkt's `cues` and the task's `choose` (SCHEMA §15.5); they inform the pre-check only, never the score.
2. **Server-side zero and cap rules before the AI, which the AI cannot override:** Goethe E rule (< 50 % of words or
   topic missed → task 0); telc B2 „no A on criterion II without Betreff, Anrede, Schlussformel"; telc „Thema
   verfehlt → D on all criteria", „Situierung verfehlt → D on criterion I"; telc B1 „no A on II with mixed register,
   unconnected Leitpunkte or mostly Ich/Wir starts"; ÖSD length deductions.
3. **Rubric-profile call** (`evaluate-writing` generalised): the task's `rubricProfile` selects criteria, scales,
   feedback language (A1–A2: simple German ≤ 60 words + English twin; B1+: German) and the pinned model id. The system
   block (profile text + each criterion's descriptors in our own wording + the band thresholds of scaled lanes + the
   profile's `errorPolicy`, SCHEMA §4.5) is identical per profile and prefix-cached. Only criteria with
   `scoredBy: ai` are sent to the model; `deterministic` criteria are computed on the server and `notAutoScored`
   criteria (Aussprache/Intonation) are never scored (§4.4). Output (JSON,
   response schema v2): points per criterion on the exam's scale, `leitpunkt_check[]` with the covering sentence,
   ≤ 3 errors `{span, tag, ruleCardId, hint}` with §2.5 tags, `strengths[2]`, one `nextStep`. **Official texts never
   sit in runtime prompts.**
4. **Feedback order:** self-correction prompts first („Prüfen Sie die Verbposition nach *weil*.") → revision →
   second result → reformulation of ≤ 3 errors + a rule of ≤ 3 points → the model text. **No rewritten text or model
   text before the learner's own revision** ([m09] impl. C14; Fan et al.).
5. **Result card:** exam-scale points per criterion (never a bare percentage), lost points and why, a link to the
   static rule card, a repair drill per fix, and the fixed label (§1.6 rule 3).

The response shape is versioned (`schema: 2`); the existing `SchreibenPage` and `GradedWriting` consumers keep
reading schema 1 for bank tasks without a `rubricProfile` (today's fixed 4 × 0–5 `MAX_WRITING_POINTS`).

### 4.3 Writing rubric profiles (`registries/rubrics/writing/*.json`)

| Profile | Criteria and scale | Deterministic rules | Source |
|---|---|---|---|
| `sd1-s2` | 3 Leitpunkte × 3 / 1.5 / 0 + Kommunikative Gestaltung (Anrede, Gruß) 1 / 0.5 / 0 = 10; spelling only if it harms understanding | ≈ 30 words (guide) | [TB-A1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) p. 38 |
| `sd1-s1`, `ta2-s1` (**method: deterministic**, no AI call) | per field correct / wrong; numbers exact | exactly the template's fields; submitted when every field is non-empty | [m01] §1, §4 |
| `ta2-s2` | 3 chosen points × 3 / 1.5 / 0 + Textsorte 1 / 0.5 / 0 | exactly 3 of 4 points chosen | [UT-A2](https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf) |
| `ga2-s1`, `ga2-s2` | Aufgabenerfüllung and Sprache, each 5 / 3.5 / 2 / 0.5 / 0 | < 50 % of the words (10 / 15) → E → 0 | [US-A2](https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf) p. 37 |
| `tb1-sa` | Aufgabenbewältigung, Kommunikative Gestaltung, Formale Richtigkeit at 5 / 3 / 1 / 0, × 3 = 45 | no A on II with mixed register, unconnected Leitpunkte or mostly Ich/Wir starts; topic missed → D on all | [telc UT B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) pp. 36–38 |
| `dtz-s` | Inhalt, Kommunikative Gestaltung, Korrektheit, Wortschatz at 5–0 = 20; `bands`: 15–20 = B1, 7–14 = A2 (a level outcome, never a pass, [m02] §3) | 4 Leitpunkte; Anrede and Gruß; (semi)formal register | [g.a.s.t.](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) pp. 47–49 |
| `gb1-sch1`, `gb1-sch2` | Erfüllung, Kohärenz, Wortschatz, Strukturen at 10 / 7.5 / 5 / 2.5 / 0 = 40 | < 40 words or topic missed → E → 0 | [Modellsatz B1](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) |
| `gb1-sch3` | 4 / 4 / 6 / 6 = 20 | < 20 words → E → 0 | same |
| `tb2-sa` | 3 criteria at 5 / 3 / 1 / 0, × 3 = 45 | ≥ 150 words; a Leitpunkt needs more than one clause; no A on II without Betreff, Anrede, Schlussformel | [telc UT B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) |
| `gb2-s1` | 60 (sheet 14 / 14 / 16 / 16) | < 50 % words or topic missed → E → 0; Einleitung and Schluss | [Modellsatz B2](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) |
| `gb2-s2` | 40 (10 × 4) | as above; Anrede and Gruß | same |
| `oza1-s2` (v1.1) | length and content deductions (20–24 words −1, 15–19 −2, < 15 → 0) + 4 criteria (tops inferred, unverified) | word bands | [AB-ZA1-W](https://www.osd.at/wp-content/uploads/2019/01/za1_auswertungsbogen_schreiben.pdf) |
| `course-micro` | Aufgabe erfüllt 2/1/0 · Zielstruktur benutzt 1/0 · verständlich 2/1/0 = 5, Richtwert | length band per level | design |

**What a profile must contain to drive the grader** (SCHEMA §4.5): `method` (`ai` or `deterministic`); per criterion
`scoredBy` (`ai`, `deterministic` or `notAutoScored`) and **descriptors for every scale level in our own wording**
(never the official descriptor text); `bands` for scaled lanes (DTZ Schreiben 15–20 = B1, 7–14 = A2; DTZ Sprechen
75–100 = B1, 35–74.5 = A2, [m02] §3); and an `errorPolicy` per band (§2.5). The W2 rubric agents author descriptors,
bands and error policies; the calibration reviewer approves them before CAL-01 runs.

### 4.4 Speaking: one server-owned speaking bank, exam interaction modes

Today a course task travels as client text (`courseTask`, ≤ 300 characters, `_shared/speakingAI.mjs`), which
contradicts the writing bank's rule that the grader never grades a client-supplied prompt. v2 adds a speaking bank
twin (`src/data/speakingTasks/<level>.js` ↔ `netlify/functions/_shared/speakingTasks/<level>.mjs`, drift-guarded by
`check-duplicates.mjs`), looked up by bank key. The existing mission machinery (evaluation, opening line) stays.

| Mode | Exam Teile | What the AI does | Scored on |
|---|---|---|---|
| `cards-ask` | sd1 Sp2, ga2 Sp1, ta2 Sp2 | shows a word card, answers the learner's question, asks back | per question 2 / per answer 1 (sd1), full / half / 0 by intelligibility |
| `cards-request` | sd1 Sp3 | picture cards; learner requests; AI requests, learner reacts | 2 per request, 1 per reaction |
| `group` (**v1.1**, only if the pilot shows it matters) | sd1 Sp1–3 (A1.2), ga2/ta2 pairs | the AI exam lead (UI: „Gesprächsleitung (KI)") reads the instructions; 1–3 AI candidates take turns. **v1:** one AI partner plays both the exam lead and the other candidate | per Teil as above |
| `get-to-know` (**new**) | tb1 M1 „Einander kennenlernen" ([m02] §2: a pair interaction from a cue list, ≈ 3 min, 15 points) | the AI is the second candidate: both ask each other from their cue lists, the AI answers and asks back | `tb1-m1`: three criteria at 4/3/1/0 + Aussprache 3/2/1/0 (`notAutoScored`) |
| `monologue` | sd1 Sp1, ga2 Sp2, **ta2 Sp1** (self-introduction + the examiner's follow-ups), **dtz S1** (talk about yourself from cues + follow-ups, [m02] §3), tb2 M1 (topic prepared at home), gb1 Sp2 (5 slides), gb2 Sp1 (alternatives → one in detail → pros/cons + evaluation) | timer, then 1–2 follow-up questions from the exam lead; from B2 interrupts a memorised speech | lane criteria; gb1 Sp2 band A needs all 5 slides ([m02] §1) |
| `plan-together` | ga2 Sp3, ta2 Sp3 (each candidate has a different calendar: `partnerData`), tb1 M3, gb1 Sp1, dtz S3, tb2 M3 | proposes, disagrees once, accepts a compromise, asks „wer macht was?" | a **moves checklist** (vorschlagen · reagieren · widersprechen/Alternative · sich einigen · Aufgaben verteilen) + lane criteria |
| `discuss` | tb1 M2 (report one of two quoted opinions: `stimulus.kind: quotes`, then discuss), gb2 Sp2, tb2 M2 (summarise a text read in the preparation: `stimulus.kind: text`) | takes the other side; asks for a summary at the end | lane criteria; Interaktion incl. du/Sie (gb2) |
| `photo` | dtz S2 (photo + experience + home country, no preparation) | asks about the learner's home country | DTZ task + language points |
| `feedback-question` | gb1 Sp3 | the AI presents; the learner gives feedback and asks one question | gb1 Sp3 Erfüllung 16 |
| `mediate` | B1.1 U3, B1.2 U7/U12, B2.2 U8 | gives a message; the learner relays it to a third person | coverage of the authored `keyPoints` (required for this mode) + register |
| `read-aloud` | Aussprache slots | none | word alignment, *Verständlichkeit* |

**Every template's `interaction` value is signed off by the Prüferin W2 reviewer before the freeze** (EXM-04 then
checks mode = template interaction for every task and every part of a multi-part task). A multi-Teil round (A1.2 U12
Sp1–Sp3, B1.2 U2 gb1 Sp2 + Sp3) is **one SpeakingTask with `parts`**, each part checked against its own template.
Each part also carries what its Teil needs (SCHEMA §8 `SpeakingPart`): a `stimulus` (quoted opinions, a text, a
calendar), `partnerData` for information gaps, `keyPoints` for mediation, a `topicChoice` (gb1 Sp2 and gb2 Sp1: 1 of 2;
tb2 M1: 1 of 7, prepared at home) and a target length in `seconds` or `turns` (e.g. the gb2 Vortrag ≈ 4 min); the
completion minimum of ≥ 20 s (§3.5) is a floor, not the target.

**Speaking profiles** copy the published scales: `sd1-sp1/2/3` 3 / 6 / 6; `ga2-sp1…3` + Aussprache (per-Teil split
reconstructed, **unverified**, [m01]); `ta2-sp` 3 + 6 + 6; `tb1-m1` 15 (4/3/1/0, Aussprache 3/2/1/0), `tb1-m2`,
`tb1-m3` 30 (8/6/2/0, Aussprache 6/4/2/0); `dtz-sp` task 50 (Teil 3 = 20) + language 50 (Aussprache 10, Flüssigkeit
10, Korrektheit 15, Wortschatz 15) with the A2/B1 bands; `gb1-sp1` 28, `gb1-sp2` 40, `gb1-sp3` 16, Aussprache 16;
`tb2-m1…3` 7/7/7/4 each (4 = Aussprache); `gb2-sp1` 4 × 8 + Fragen/Antworten 12, `gb2-sp2` 4 × 10, Aussprache 16
([m01]–[m03]).

**Aussprache is not scored by the pipeline.** The speaking stack is STT transcript → LLM ([m12] §3), and read-aloud
is labelled *Verständlichkeit*, never pronunciation. Every Aussprache/Intonation criterion is therefore
`scoredBy: notAutoScored`: the result card shows it as „Aussprache: nicht automatisch bewertet", it is **excluded from
the point total**, and wherever a module value appears (§5.6) its range is widened by the criterion's full span (e.g.
telc B1 oral: the AI range over 60 points + 0–15 for Aussprache; Goethe B1: + 0–16). The „Wie bewertet die KI?" page
explains this. Segment-level pronunciation feedback (ü/u, vowel length, ich-Laut) stays a separate practice aid and
never becomes exam points. **Partner support fades by level:** A1.1 slow + word bank → A1.2 repeats on request →
A2.1 normal pace with clarification → A2.2 learner keeps the talk going → B1 examiner-like, disagrees → B2 interrupts
memorised speech ([m04] impl. 4). Exam-mode rounds always use the exam's own behaviour. Pronunciation feedback names
segments, never a global accent score ([m09] impl. A4).

### 4.5 How results are shown, and the legal wording

- Every graded surface: the fixed label; points on the exam's own scale per criterion („7,5 von 10 Punkten
  (Richtwert)"); never a bare percentage, never „bestanden".
- The AI-interaction notice at first contact (Art. 50(1) AI Act) and a „Wie bewertet die KI?" page per course with
  profiles, scales, zero rules, the calibration method and known limits, **with no accuracy figure** until an
  agreement study with human raters is published ([m13] impl. 10).
- Results are private to the learner and never gate progress; unlimited retries within the fair-use cap.
- Productive Teile appear on the Prüfungsstand as **ranges** until measured agreement with human raters narrows
  them (§5.6).

### 4.6 Calibration: human ground truth, not AI personas

Proposal C's anchors scored only by AI personas are circular. Binding protocol (gate CAL, run as a pipeline step
with committed results, §9.2):
1. **Ground truth from humans, in the order it can be had.**
   (a) **Writing, from launch: the MERLIN learner corpus** — German A1–C1 learner texts from standardised language
   certifications, related to the CEFR by professional assessors, about 1,000 German texts, licensed CC BY-SA 4.0
   ([CLARIN blog](https://www.clarin.eu/blog/clarin-it-presents-merlin-written-learner-corpus-czech-german-and-italian);
   licence and level range (snippet): [Eurac CLARIN repository](https://clarin.eurac.edu/repository/xmlui/handle/20.500.12124/59);
   ≈ 200 German texts per level (snippet, unverified): [PORTA](https://www.porta.eurac.edu/lci/merlin/)). MERLIN rates
   CEFR level and criteria, not our exam points, so it calibrates **band placement and the error-heavy-but-passing
   subset**, not point totals; the texts stay in `private/` as evaluation data (never shipped, never in prompts;
   share-alike terms reviewed under §13 D2).
   (b) **A small examiner sample:** a human DaF examiner (Goethe/telc licensed, §13 D3) rates ≥ 30 texts per AI-scored
   writing profile (6 in the v1 cut: `sd1-s2`, `ga2-s1`, `ga2-s2`, `tb1-sa`, `tb2-sa`, `course-micro` ≈ 180 ratings,
   not ≈ 1,100), spread across the bands, including
   error-heavy texts that deserve passing bands (Goethe's B2 Modellsatz prints uncorrected learner texts as B2
   samples, [m03] §1).
   (c) Official rated samples (Goethe/telc Bewertungsbeispiele) only if counsel clears their private use for
   evaluation (§13 D2).
   (d) **Speaking: no learner speech corpus exists**, so speaking profiles run at labelled wide ranges from launch;
   CAL-02 for speaking runs after the learner pilot has collected consented recordings (§1.6 rule 13) and the
   examiner has rated them.
2. **Our anchors** (`content/course-v2/anchors/<profile>/`, ≥ 12 per profile, written by anchor authors) are
   **human-verified** before they serve as regression anchors: each anchor's expected band is confirmed by the
   examiner or matched to a MERLIN text of the same band. "CAL-01 passes on human-verified anchors" is the definition
   a lane's writing profiles must meet to go live (§1.4).
3. **Thresholds (design):** each anchor runs 3 times on the pinned model id; ≥ 80 % of human-rated texts within one
   band of the human score on every criterion, exact band agreement ≥ 60 %, run-to-run spread ≤ 1 band, zero rules
   100 % (they are deterministic), and no systematic under-scoring of error-heavy but communicative texts (mean
   signed error ≥ −0.5 band on that subset).
4. **Re-run** on any change of prompt, model id, descriptors or profile. A writing profile that fails CAL-01 is not
   used by any live task.
5. Until CAL-02 passes for a profile (writing: the examiner sample; speaking: after the pilot), that profile's Teile
   show wider ranges on the board and the copy may describe only the method. This is the only state speaking
   profiles can be in at launch, and it does not block a lane (§1.4).

### 4.7 Allowances, fair use, failure states

- **Allowance (design; owner sets numbers after the pilot, §13 D8):** per purchased half-level, lifetime: each
  Aufgabe slot 1 attempt + 2 graded revisions; each micro-output 2 graded attempts; each Plateau/mock productive part
  2 graded attempts; plus a daily cap of 25 AI evaluations across tasks. **Speaking is also metered in minutes:**
  every speaking slot has a hard session length taken from its template (`seconds`/`turns` of the part, plus the
  lane's preparation time, which costs nothing), the session ends there, and the slot's minutes (length × graded
  attempts) are the ceiling — so cost is bounded per slot, not only per attempt. Deterministic pre-checks catch
  zero-rule failures before any AI call. Everything is counted in `course_ai_usage` (SCHEMA §14), written only by the
  AI functions through `_shared/entitlement.mjs`.
- **Measure before promising.** The learner pilot (§10.4) measures cost per engaged learner (AI calls, speaking
  minutes, $ per learner per unit); no paid page promises graded speaking until that number exists, and the owner's
  fair-use numbers (§13 D8) are a gate for B-level launch. At today's wallet *price* a fully engaged learner's speaking
  would be worth ≈ €22–117 against ≈ €31–51 net per sale (§1.8, derived), which is why minutes are capped per slot.
- **The free A1.1's cap is stated.** A1.1 has the same per-slot allowance; the free Diagnose one attempt per part.
  The live `COURSE_WRITING_FREE_LIFETIME = 12` (`netlify/functions/evaluate-writing.mjs`, pinned by
  `tests/claims.test.mjs`) contradicts the v2 A1.1 allowance (24 Aufgaben × 3 + 36 micro-outputs × 2), and UWG
  Annex Nr. 20 requires a „kostenlos" product's cap to be stated ([m13] §5). The PR that switches A1.1 to v2 updates
  the constant, `marketing.js`, the claims test and the A1.1 page copy to state the v2 free allowance in one place.
- **No dead ends:** microphone denied → settings steps + „ohne Mikrofon weiter" (speaking becomes a typed script,
  read-aloud becomes listen-and-select); offline → „Gespeichert – wird ausgewertet, sobald Sie online sind"; AI
  slower than 10 s → staged progress; after 20 s „Weiter – das Ergebnis erscheint in Ihrer Übersicht" (B;
  [m11] impl. 17–18).
- **The anonymous first sentence** (A1.1 U1 LS1 without an account): scored through a Supabase anonymous session
  (owner enables it, §13 D7) with caps of 3 read-aloud scorings per anonymous user and 10 per IP per day (the IP held
  only as a keyed hash for 48 hours, §1.6 rule 13), upgraded in place on sign-up. **The privacy notice and consent
  screen (§4.8) comes before the microphone opens, on this path too.** If anonymous sessions stay off, the pre-sign-up sentence is an unscored „Nachsprechen" with
  model audio, and the first scored sentence follows right after sign-up.

### 4.8 Privacy in the AI flows (prerequisite for any v2 launch that records audio)

- **Before the first microphone use** (and before the first AI-graded text), a one-screen notice in plain German
  with an English twin: what is recorded, which processors receive it (the STT, LLM and TTS providers by name), where
  they process it (third-country transfer), how long raw audio, transcripts and texts are kept, and a link to the
  Datenschutzerklärung; the learner confirms once, and can withdraw in Einstellungen (S15), which switches the course to
  its no-mic path (§4.7). The AI-interaction notice of §1.6 rule 3 is part of the same screen.
- **Retention:** a scheduled job deletes raw audio (§1.6 rule 13 defaults; counsel sets the final periods);
  transcripts, texts and results stay while the account exists and are deleted with it (`on delete cascade`,
  SCHEMA §14); learner-state rows hold no audio.
- **Minimisation:** the AI functions receive the bank key, the learner's text or audio and nothing identifying beyond
  what the provider call needs; IPs for caps only as keyed hashes (48 h).
- The Datenschutzerklärung is owner decision D13 and a launch prerequisite for every v2 course that records audio,
  the free A1.1 included.

### 4.9 Images and visual assets

Several official Teile are pictorial: SD1 Hören 1 (MC with pictures) and Sprechen 3 (picture cards), Goethe A2 Hören 2
and 3 (pictures; Hören 2 matches days to pictures a–i), telc A2 Schreiben 1 (a form filled from documents such as an ID
card or a bank card), DTZ Sprechen 2 (a different photo per candidate) and ÖSD ZA1 (sign → picture) (per the critic's
reading of [m01]–[m03]; each lane agent confirms per template and sets `pictorial: true`). The B-level Auftakt uses a
photo and the B-level Porträt may show a real person or place.
- **Data:** every image is an `Asset` (SCHEMA §3.5) with alt text, source (`generated`, `licensed`, `own`), a licence
  record and, for generated images, the prompt; choices, speaking cards, DTZ photos, the Auftakt and the Porträt
  reference assets by id.
- **Production:** an **image pipeline step** runs next to the owner's Azure TTS run, per level: generated images
  from the authored prompts (fictional people, fictional documents — never a real ID card design, a real brand or a
  real exam sheet), a licensed stock image only where a real place is shown, and the owner approves the batch and
  its budget (§13 D16).
- **Gates:** AST-01 (every asset has `altDe` and a licence record), AST-02 (a real, identifiable person is shown
  only from a `licensed` asset whose licence covers the depiction; otherwise the Porträt is text-only) (§9.1).
- **Until images exist:** in a .1 course a pictorial Teil runs as a **text variant** (the picture replaced by a short
  label, block `scaffolded: true`, labelled „In der Prüfung mit Bildern"), which EXM-02 allows because the template
  lists that course in `scaffoldAllowedIn`; a .2 course never uses the text variant, so **its lane goes live only when
  the pictorial Teile's images are approved** (§1.4).

---

## 5. Assessment

### 5.1 The ladder

| Level | What | When | Length (design) | Mode | Feeds |
|---|---|---|---|---|---|
| Item | `check.js` | every item | — | Lernmodus | mastery, SRS |
| LS exit | 3 unseen pool items | end of each Situation-LS | 1 min | Lernmodus | SRS |
| Micro-output | `course-micro` | LS1–LS3 | 3–5 min | Lernmodus | error-tag repair cards |
| LS4 block | Teil template | every unit | 20–30 min | .1 Lernmodus (Prüfungsmodus on request) · .2 ≥ 1 full-length block in Prüfungsmodus | Prüfungsstand only if full length + Prüfungsmodus |
| Aufgaben | lane rubric | every unit | 20–45 min | as LS4 | as LS4 |
| **Lektions-Check** (unit test; also „Ich kann das schon") | 12 deterministic items + can-do proofs | end of each unit | 15 min | Lernmodus | completion, SRS |
| **Plateau** P1–P3 | §5.2 | after U3, U6, U9 | A 50–70 min, B 75–90 min | Prüfungsmodus for its exam Teile | Prüfungsstand (full-length Teile) |
| **Halbtest** (.1 closing) | every Teil of the lane, ≈ half the items, lane-exact, .1 content only; untimed in A1.1 | after U12 of a .1 course | A ≈ 40 min, B ≈ 90–105 min | A1.1 Lernmodus; A2.1–B2.1 Prüfungsmodus | **Teil-Karte** (§5.3) |
| **Diagnose** (free) | one full-length Teil per module in the lane | week 1 of a .2 course, or before purchase | 30–60 min | Prüfungsmodus | starting values + plan |
| **Modelltest** A/B (C in v1.1) | full mock in the official format and timing, parallel forms | after U12, at exam −21/−10 days by default (with C: −21/−14/−7) | per lane (§2.3) | Prüfungsmodus | Prüfungsstand (weight 1.5) |
| **Wiederholungsplan** | the learner enters the official per-part result of a failed attempt → 4-week plan weighted to the weak parts + remaining forms | A1.2 (sd1), B1.2 (tb1, dtz, gb1) at launch; A2.2, B2.2 v1.1 | — | — | plan |
| **Einstufung** | fixed form per band (v1), deterministic routing; adaptive later | before purchase / at start | ≤ 12 min + 1 spoken item (feedback only) | — | course + starting unit recommendation (deterministic items only) |

No separate Abschlusstest exists where a course has mocks; the .1 Halbtest is the .1 end test.

### 5.2 Plateaus (Modul-Plus style)

Each Plateau holds: a review set of ≈ 20 items mapped back to the Lernschritte (≈ 65 % from the last three units,
35 % earlier, [m09] impl. B10) — compiled from unit reserves, not authored anew; **one exam Teil per module in the
learner's lane**, at full length where the template allows (always in .2 courses), rotated so every Teil gets a turn
across P1–P3; one productive task repeating the type practised three weeks earlier ([m09] §8); and a reward block
that is never graded: a Lesemagazin text, a Hörmagazin piece, a serial scene, a Landeskunde mini-project turned
into a solo, AI-scored short report ([m14] §E7, §F7). Results appear per Teil on the exam's own scale and turn into a
repair list („Hören Teil 2: 2 von 4 — 3 Übungen in Ihrer Wiederholung").

### 5.3 The end of a .1 course: Halbtest → Teil-Karte → plan

The Halbtest is lane-exact (every Teil of the learner's lane, about half the items, only .1 content). It is shown as
a **Teil-Karte**, never as a 60/100 total: each Teil reads either „in voller Länge geübt – Übungswert 11/15" (only
where a full-length Prüfungsmodus attempt exists), „im Kleinen geübt" (with the raw count of the miniature in the
detail view, never scaled to the Teil's full item count), or „kommt in A1.2, Lektion 2". The 60/100 calculation
appears only in .2 Modelltests, once the whole level has been taught. The Teil-Karte ends in the dated plan into the
.2 course.

### 5.4 The .2 exam arc

- **Diagnose** in week 1 (free, and offered before purchase as the Einstiegscheck): labelled as starting values; it
  may contain untaught material because it is diagnostic.
- **Modelltests come after the last new content.** The course path places Modelltest A after U12. The plan
  schedules A/B at exam −21/−10 days (A/B/C at −21/−14/−7 once C exists), never before U12 is scheduled to be complete; if the date is too close it
  adds learning days (up to Intensiv) rather than moving a mock forward. A Modelltest opened before U12 via „Trotzdem
  öffnen" is stored with `beforeCourseEnd: true` and the board labels it „vor Kursende geübt".
- **Mock forms use only the half-level's taught inventory plus the exam's receptive tolerance** (EXM-06): every text
  ≥ 95 % known tokens; no construction introduced after the course's U12.
- **Forms:** v1: 2 (A, B) per live primary lane; form C and the secondary lanes' forms (2 each) follow with v1.1 and
  the packs (§1.4). **Parallel forms only:** no text or item
  reused across forms; lengths within ±10 % of each other and ±15 % of the official sample sizes; same item-type
  counts; generated from the lane's form blueprint, never from a previous form (C). Retest effects inflate mock
  scores (d = .26, [Hausknecht et al. 2007](https://doi.org/10.1037/0021-9010.92.2.373)), so a mock score is never
  a forecast.
- **Official format, our content;** each mock links to the free official set ([m01] impl. 12). Productive parts go
  to the lane rubric profiles (today mock writing parts are ungraded textareas, [m12] §2.6). Audio at natural tempo,
  several voices, „Computerstimme".
- **Repair weeks** between mocks draw on the error tags and on the Teile with the fewest full-length attempts; **the
  final 7 days carry no new content** — daily review, Teil-Trainer cards, the last Modelltest (B in v1) and its repair
  ([m09] impl. B11).
- **Wiederholungsplan:** the learner types the official per-part result (fields follow each lane's certificate, e.g.
  DTZ Hören/Lesen, Schreiben, Sprechen levels); the plan is a query over blocks tagged with the weak Teile across all
  units — no new content ([m10] impl. 4). Its suggestions come from the official result (deterministic), not from AI
  scores.

### 5.5 Per-lane scorers (pure functions, `src/services/examRules/<lane>.js`, pinned by boundary tests)

| Lane | Rule implemented |
|---|---|
| sd1 (Goethe view) | raw × 1.66 → 100; pass ≥ 60 with every part taken; < 35 written cannot be rescued by the oral |
| sd1 (telc view), ta2 | 60 points; 36 = ausreichend; not partial |
| ga2 | ≥ 60/100 **and** ≥ 45/75 written **and** ≥ 15/25 oral |
| tb1, tb2 | ≥ 135/225 written **and** ≥ 45/75 oral; tb1 item points 5 / 2.5 / 1.5 |
| gb1, gb2 | each module ≥ 60/100 on its own; Lesen/Hören raw × 3.33 rounded (18/30 = 60; 17 = 57) |
| dtz | H+L ≥ 33/45, Schreiben ≥ 15/20, Sprechen ≥ 75/100; B1 = Sprechen B1 + one of the other two; Sprechen below A2 = no certificate; **A2 bands** H+L 20–32, Schreiben 7–14, Sprechen 35–74.5, reported as „Stufe nach der Bewertungsregel: A2", never as a pass ([m02] §3) |
| oza1 (v1.1) | written ≥ 38/75 with Lesen ≥ 6, Hören ≥ 6, Schreiben ≥ 4; oral ≥ 12/25; modules separate |

Tests pin boundaries: Goethe B1 17 vs 18; telc 134.5 vs 135; the DTZ one-of-two rule and the Sprechen gate; Goethe A1
34 written; Goethe A2 44 written with 70 total; DTZ H+L 19/20 and 32/33, Schreiben 6/7 and 14/15, Sprechen 34.5/35 and
74.5/75 (EXM-07).

### 5.6 The Prüfungsstand (readiness per module)

**What it is.** A board per lane showing, for each module of the learner's exam, the practice value on that exam's
own scale, which Teile have been practised in full length, and — where allowed (rule 5) — where the official pass rule
sits. It answers „Wo stehe ich in jedem Prüfungsteil?", never „Werde ich bestehen?". It is **opt-in in A1.1** (appears
once an exam date is set) and default in paid courses once a lane is chosen. The course home pairs it with a
**four-line checklist**: Lektionen 12/12 · every Teil ≥ 2× in full length (11/11) · Modelltests 1/2 · Übungswerte je
Teil (bars, with a hairline only where rule 5 allows one).

**Why it is fenced.** This is the highest legal-exposure surface of the product. It combines AI-scored ranges with
deterministic values into module values and can draw the official pass line against them. Under the reported
FernUSG position, automatically scored tests are „programmierte Unterweisung", but the answer changes where the
provider „sich die Ergebnisse zu eigen macht und darauf aufbauend individualisierte … Rückmeldungen erteilt" ([m13] §2,
via [Dogan Pfahler](https://doganpfahler.de/faq-bgh-fernunterricht-fernusg-online-coaching/)); a per-module readiness
comparison is also the UWG risk R3. §1.6 rule 5 governs only the suggestions. So the Prüfungsstand, the Teil-Karte
(§5.3) and the Halbtest view are **named items of the D2 counsel brief** (`docs/course-v2/legal/counsel-questions.md`).

**Rules.**
1. **Numbers come only from full-length Prüfungsmodus attempts** (LS4/Aufgaben run full length in Prüfungsmodus,
   Plateau Teile, Diagnose, Modelltests). Miniatures show „im Kleinen geübt"; nothing is scaled up.
2. Teil value = weighted mean of the last five qualifying attempts (Modelltest 1.5, others 1.0; attempts older than
   21 days × 0.5) (design).
3. AI-graded Teile carry a **range**: ± one band per criterion until the profile's human-agreement study (§4.6)
   sets a measured width. A `notAutoScored` criterion (Aussprache) is never estimated: the range is widened by its
   full span (§4.4).
4. A module value appears only when every Teil of the module has a qualifying attempt; it is the Teil values
   combined with the lane's official weights and converted to the lane's scale.
5. **Pass lines — interim rule until counsel answers (§13 D2).** In **paid** courses a pass line is drawn only for a
   module, or an aggregate the pass rule uses, that contains **no AI-scored Teil**: Goethe/ÖSD Lesen and Hören, DTZ
   Hören + Lesen, and the deterministic Teile of telc (Lesen, Sprachbausteine, Hören) shown without a line, because
   telc's rule is an aggregate that includes Schreiben. AI-scored Teile (Schreiben, Sprechen) are shown **on their own**
   as ranges with no pass-line comparison. The **free A1.1 and the free Diagnose** keep the full board: the lane's real
   pass rule runs on both ends of every range and is drawn as a hairline with the rule sentence, in the rule's own words
   („Grenze nach der Bestehensregel von telc: 135") — telc written AND oral, the DTZ Sprechen gate and one-of-two rule,
   Goethe per module, each exactly as §5.5. Once counsel has answered, the owner decides whether paid courses get the
   full board (§13 D2).
6. The board's „Vorschlag" is computed only from deterministic inputs (receptive Teil values, counts of full-length
   attempts), labelled and dismissible (§1.6 rule 5).
7. **Allowed words:** „Übungswert", „Grenze nach der Bestehensregel von …", „in voller Länge geübt", „im Kleinen
   geübt", „Vorschlag", „nicht automatisch bewertet", „Stufe nach der Bewertungsregel" (DTZ). **Banned:** „bestanden"
   (about our tests), „bereit für die Prüfung", „prüfungsreif", „Bestehenschance", any percentage presented as a
   likelihood, „in X Wochen" (LGL-01).

Paid course, interim rule (telc B1; telc Leseverstehen items are worth 5 or 2.5 points, so values move in steps of
2.5; Sprachbausteine in steps of 1.5):

```
telc Deutsch B1 · Ihr Prüfungstermin: 14.11. (noch 48 Tage)
Leseverstehen 62,5 von 75 · Sprachbausteine 18 von 30 · Hörverstehen 45 von 75   (automatisch ausgewertet)
Schreiben            Übungswert 21–27 von 45 (KI-Richtwert)
Mündlicher Teil      Teil 1: 8–10 von 12 · Teil 2: 14–18 von 24 · Teil 3: 14–18 von 24 (KI-Richtwert)
                     Aussprache: nicht automatisch bewertet (in der Prüfung bis zu 15 Punkte)
In voller Länge geübt: 11 von 12 Teilen · Modelltest A: 24.10. (geplant)
Vorschlag: Mündlich Teil 2 – bisher einmal in voller Länge geübt.
Übungswerte aus Ihren Übungsprüfungen bei uns. Keine Prognose Ihres Prüfungsergebnisses.
```

The full board (free A1.1 and free Diagnose; paid courses only after counsel), on the same evidence: „Schriftlicher Teil · Übungswert 146,5–152,5 von 225 ─┤ Grenze nach der
Bestehensregel von telc: 135" and „Mündlicher Teil · Übungswert 36–61 von 75 ─┤ Grenze nach der Bestehensregel von
telc: 45" (the oral range spans the 15 Aussprache points the pipeline does not score).

Evidence lives in one table, `exam_practice_results` (SCHEMA §14); AI-scored rows are written by the server only.

### 5.7 Einstufung (placement)

A ≤ 10-minute adaptive test with partial credit over the **Plateau item banks** (24 banks tagged by half-level; no
separate authoring), plus one spoken item and a can-do self-check (self-rating alone correlates only r = .466 with
measured proficiency, [m11] §4). It recommends a course and a starting unit, credits earlier units as tested out
(deterministic parts only), and routes near-level learners to the .2 course. It replaces `levelTestQuestions.json`
(band-only, 89 % grammar, [m12] §2.9).

---

## 6. Review and retention

### 6.1 The ladder

**+1, +3, +7, +14, +30, +60 days; a lapse returns to +1; every interval capped at max(1 day, 15 % of the days left
to the exam date); the cap lifts once the exam date has passed** ([m09] impl. B7, Cepeda's ridge). The ladder and the
cap share are course parameters in `course.json` (`review.ladderDays`, `review.examCapShare`); the live A1.1 keeps
today's `LADDER_DAYS = [1, 4, 7, 14, 60, 180]` (`src/lib/review/ladder.js`) until it is retired. Expanding and uniform
schedules do not differ (g = 0.034, [Latimier et al. 2021](https://doi.org/10.1007/s10648-020-09572-8)), so a fixed
ladder is defensible; an A/B test against an adaptive scheduler (HLR/FSRS) comes after launch ([m09] impl. D23).
New grammar gets short lags first (its Lernschritte 1–3 days apart), then contrast review at the Plateau and at about
+2 and +4 weeks ([m09] impl. B9).

### 6.2 Card kinds and keys

| Kind | Key | Content | Directions |
|---|---|---|---|
| `word` | `word:<lexiconId>` | a Lernwortschatz entry | productive: both directions + one production item; receptive: recognition only ([m07] impl. 10) |
| `pattern` | `pattern:<spineId>:<unitId>` | the model sentence / contrast pair of a Situation-LS | recall, interleaved with its contrast partner |
| `sentence` | `sentence:<itemId>` | a Redemittel sentence or a missed typed item | cloze → full recall → spoken |
| **`teil`** (new) | `teil:<templateId>` | a 2–3-minute Teil-Trainer: 2–3 items of one Teil in Prüfungsmodus, only from completed units | one per day in .2 courses (and in .1 once an exam date is set) |
| **`repair`** (new) | `repair:<errorTag>:<ruleCardId>` | created from a graded production's error list; the teach → test → repair loop ([m08] impl. 6) | rule card + 3 items; shown as a dismissible suggestion |

`review_cards.kind` has `CHECK (kind IN ('word','pattern','sentence'))` (`migrations/2026-09-12-lesson-engine.sql`);
a hand-applied migration extends it to `teil` and `repair` (SCHEMA §14). **Orphan policy:** old A1.1 `word:` cards
are mapped to v2 lexicon ids by lemma (an orchestrator script, one SQL batch the owner applies); old `pattern:` and
`sentence:<lektionId>:<idx>` cards are skipped by the v2 queue and never shown; they are left in place (no
destructive migration). Stable hierarchical ids (SCHEMA §2) keep v2 card keys valid across re-authoring.

### 6.3 Budgets, priority and no review debt

- **Daily budget** (design, §2.6): A1 6, A2 7, B1 9, B2 11 minutes; the plan shows the pace-specific figure.
- **When due cards exceed the budget:** priority lapsed productive items → due items of the current Etappe →
  exam-critical Redemittel and `teil` cards → receptive items. The overflow is re-scheduled by stretching intervals
  by ≤ 1 day per card per day, **never shown as a debt**; the counter only shrinks within a session; never „243
  fällig" ([m11] S5). If stretching would make a card miss its retrieval target before the exam date (SRS-02 logic at
  runtime), the plan says so arithmetically and suggests one more review day — it never hides the words.
- **First-review stagger ceiling:** 30 (A) / 40 (B1) / 50 (B2) new cards per day (§2.6).

### 6.4 Re-entry, the final week, carry-over

- ≥ 3 days away → „Willkommen zurück – 5 Minuten Wiederholung", then resume where the learner stopped, never at a
  backlog ([m09] impl. D22). ≥ 7 days → reminders switch to weekly on Mondays with „Neu planen". ≥ 30 days → one last
  „Plan anpassen?", then silence; on return a 10-minute re-entry check of the last Etappe recommends where to resume.
- **Final 7 days before the exam:** no new content; review, `teil` cards, the last Modelltest and its repair.
- **The deck carries over** across half-levels (A1.1 → A1.2 → …), so retention continues and the next course starts
  with familiar cards.
- **AI error tags create `repair` and `pattern` suggestions** (three `verb-final` errors in a week suggest the
  *weil/dass* pattern card); the learner sees and may dismiss them; AI output schedules nothing on its own.

---

## 7. Engagement and player UX

### 7.1 Principles (from [m11] impl. 1–6, 20)

One practice item per screen; input screens scroll. One primary action, pinned in the thumb zone, full width,
≥ 48 px (`Button size="lg"`). Floor 360 × 640 with reflow at 320 px; the player route stays within ≈ 0.62 MiB of JS
(Galaxy A24-class budget); unit data lazy-loaded per unit; the next Lernschritt's text and audio prefetched on Wi-Fi.
The progress bar counts first presentations only; a re-queued miss shows as „+1 Wiederholung". Nested goals: item →
LS bar → unit ring → Etappe → course map (units with can-do titles) → Prüfungsstand. **No XP, points, levels,
leagues, hearts, gems, loot, random rewards or public leaderboards**; the in-lesson `ComboChip` may stay as a flourish
only. The whole syllabus is always visible; unbought half-levels appear as locked chapters on the same map. Every
Lernschritt shows its minutes („≈ 18 Min.", labelled *geplant* until measured).

### 7.2 Brand tokens in the player (`src/data/design-tokens.js` is the only place a colour is written)

- **`siegel` teal is the only interactive colour** (buttons, links, focus ring, selected tiles). **`gold`** marks the
  seal: the unit-complete Siegel and at most one recommended marker per page.
- **`kasus` colours only where a case is named**: rule cards and highlights that teach Nominativ/Akkusativ/Dativ/
  Genitiv; never on a CTA, a progress fill or a board.
- **Accents are energy, not interaction:** `limette` for the weekly-goal fill and progress, `aprikose` for chips
  („12 fällig" is not shown; „+1 Wiederholung" is), `himbeer` for one celebration moment (course complete).
- **Depth means "you can press this":** buttons and clickable cards rest raised and depress on press; reference
  material (texts, rule cards, tables, the Prüfungsstand bars) stays flat with hairlines. The pass-rule hairline on the
  board is `ink`/`graphite`, never a case colour and never the operator-only `viz` palette ([m11] §10).
- Fraunces for display titles (`hyphens: auto`), the data mono stack for level codes, points and prices; inputs
  ≥ 16 px. Token work adopted from [m11] impl. 21: a `prompt` role, the six player primitives promoted into
  `src/components/ui/`, and `tests/brand.test.mjs` extended to them.

### 7.3 Screens and states

| # | Screen | Key states | Notes |
|---|---|---|---|
| S0 | **Kursplan** (course home) | first visit · in progress · plan on/off · review due · locked chapters · Prüfungswochen mode · complete | one primary action („Weiter mit Lektion 4" / „Modelltest B starten"); weekly-goal widget; four-line checklist; unit list as interactive cards (can-do title, ring, minutes, Prüfungsfokus chips) |
| S1 | **Prüfungsziel & Einstufung** (onboarding) | exam known/unknown · date set/„noch kein Termin" · purpose · lane picked · DTZ question · placement taken/skipped · recommendation | three questions, nothing pre-selected, „Später" is real, CTA „Plan festlegen"; exam picker per [m02] impl. 10 shown as information with a „Stand" date; purpose stored next to `dm_attribution` |
| S2 | **Lektion-Start** | new · resume at item n · tested out | Lernziele, Lernschritte with minutes, „Ich kann das schon" |
| S3a | Input (dialogue / text) | audio loading · playing · „Computerstimme" · no audio | scrolls; replay and 0.85×; gloss taps; flat reference styling |
| S3b | Rule card / rule table | deductive (A) · table to fill (B) | flat, hairlines; kasus chips only where a case is named |
| S3c | Practice item | idle → selected → checking → correct / typo (retry) / wrong / revealed → continue · re-queued | bottom-sheet feedback (text + icon + colour), one „Weiter", static explanation |
| S3d | Micro-output / Sprechen (Lernmodus) | mic pre-prompt · denied · recording · submitting · staged grading · result · retry · offline-queued | record button ≥ 64 px; result card with the fixed label |
| S3e | Schreiben | drafting (counter, checklist) · submitting · grading · result · revise · model text (after revision only) | sticky checklist, „Überarbeiten" |
| S4 | **Prüfungsmodus runner** (LS4 blocks, Plateau Teile, Diagnose, Modelltests) | reading time · playing („Sie hören den Text einmal.") · answering · time warning · auto-submit · answer-sheet transfer (telc paper lanes) · results per Teil | play count and timer from the lane profile; transcript after submission |
| S5 | **Sprechprüfung** simulation | card draw · preparation (timer + notes) · examiner instructions · own turn · partner turn · staged grading · result per criterion | notes collapse to ≤ 5 keywords while speaking; „ohne Mikrofon weiter" |
| S6 | Lektion geschafft | normal · first ever · weekly goal met | can-dos gained, words, gold Siegel (reduced-motion safe), cliffhanger, next step with minutes |
| S7 | Tägliche Wiederholung | due > 0 · nothing due · re-entry after ≥ 3 days | S3c shell; count only shrinks |
| S8 | Plateau | review set · exam Teil · productive task · reward block | per-Teil results turn into a repair list |
| S9 | **Prüfungsstand** | opt-in (A1.1) · no attempts · miniatures only · values · ranges · after a mock | §5.6 |
| S10 | **Teil-Karte** (.1 end) | per Teil: full length / im Kleinen / kommt in … | then the dated plan into the .2 course |
| S11 | Prüfungswochen | mock due · repair week · final week · exam day passed | home switches its primary action |
| S12 | Wiederholungsplan | enter official result · plan generated · running | fields follow each lane's certificate |
| S13 | Fortschritt / Wochenbericht | this week · history | in-app only with scores; no share link until counsel |
| S14 | Teilnahmebescheinigung | not yet · available | German, completion only, fixed disclaimer |
| S15 | Einstellungen | reminders (e-mail/time/off) · pace · explanation language · sound | — |

### 7.4 The first week is the product

| Day | What happens (design) |
|---|---|
| 0 | A1.1 only: U1 LS1 playable **without an account**; the scored spoken sentence within the first 3 screens (§4.7 for the anonymous path); saved on sign-up (delayed sign-up ≈ +20 % DAU at Duolingo, company-reported, B [S21]) |
| 1 | LS1 ends with the scored sentence → goal screen S1 (exam, date or none, pace, reminder time) |
| 2–5 | one or two Lernschritte per learning day; the first daily review appears on day 2 |
| 6–7 | unit complete → gold Siegel, first Wochenbericht preview, first cliffhanger |

No extra mechanic appears before day 7 (streak concepts shown earlier "pretty universally … lose", B [S4]); each
mechanic gets a one-line explanation at first contact („Pausentage: Zwei Tage pro Woche zählen automatisch – Ihre
Serie bleibt."). Paid courses reuse the same week-1 shape (Diagnose placed after the first win, never before it).
Novelty at weeks 4–6: P1's reward block, and from Etappe 2 a new speaking mode ([m09] impl. D19).

### 7.5 The habit system

- **Weekly goal is the headline** („3 von 4 Lerntagen"); a learning day = one Lernschritt or the daily review.
- **Streak** counts learning days, shown as a number, never a flame and **never as 0**: two automatic *Pausentage*
  per week, earn-back by one review within 48 h, a quiet „lückenlos" mark for weeks without a pause day; after a
  break the screen shows the week's goal, the longest run and „Willkommen zurück" ([m11] impl. 10–13).
- **Scores never block progress** (§3.5).

### 7.6 The plan

Arithmetic, never a gate (the `src/lib/course/plan.js` principle, `SUSTAINABLE_PER_WEEK = 5`). **Inputs:** lane, exam
date or none, pace, learning days per week, reminder time (stored in `learner_goals`, SCHEMA §14). **Outputs:**
Lernschritte per week, weekly minutes, the review minutes per day for the chosen pace (from SRS-01), and the dates of
the Plateaus, the Modelltests (exam −21/−14/−7, never before U12 is scheduled) and the review-only week. **Always
phrased forward:** „Diese Woche 4 Lernschritte – dann sind Sie im Plan." Never „hinter dem Plan". **When the date is
too close,** the plan states the arithmetic and offers only options that keep the progression intact: more learning
days (up to Intensiv), Einstufung or „Ich kann das schon" to credit what the learner already knows, optional depth
off, or a later date. **There is no Kompaktweg:** units are never reordered by weak Teil, because later units assume
the lexis and grammar of earlier ones (≈ 95 % known-token inputs). An `.ics` export is an A/B candidate after launch.

### 7.7 Reminders and the Wochenbericht

At most one reminder a day at the learner's time; e-mail by default through `lifecycle_emails` (claim before send,
as the live course-reminder mailer does); ≥ 6 rotating templates per kind; after 7 idle days weekly on Mondays
(fresh-start effect, B [S11]); stop after 30. Copy names the next step and its minutes („Ihr nächster Schritt: *Beim
Arzt – Termine* (≈ 18 Min.)"); **never tells someone they have not done a lesson when they have** (the reminder view
counts old `a1.1-lNN` and new `-uNN` activity alike). **No scores, no Übungswerte, no share link in any e-mail**
until counsel clears it (§1.6 rule 6). The **Wochenbericht** is in-app every Monday: learning days vs goal,
Lernschritte and units done, can-dos confirmed, words („412 von ≈ 650 Wörtern der A1-Liste" — a number, never the
list), Aufgaben submitted and revised, Übungswerte per Teil, next week in minutes. Web Push (Android only) is v1.1.

### 7.8 Instrumentation (proves or disproves the moat)

Events persisted where `weekly_truth_metrics()` can read them: `lernschritt_completed` (unit, LS, minutes — feeds
`minutesMeasured`), `micro_output_submitted`, `aufgabe_submitted`, `revision_submitted`, `ai_grade_shown`,
`teil_attempt` (lane, Teil, source, mode, full length → `exam_practice_results`), `modelltest_completed`, `plan_set`,
`retake_plan_created`, `mic_denied`, `ai_latency_ms`. Weekly truth adds: AI writing and speaking uses per active
learner, Aufgaben per active learner per unit, learning days in week 1, share reaching day 7, completion by Etappe,
.1 completers buying the .2 within 30 days, and the learner-pilot metrics (§10.4). PostHog stays behind the existing
consent gate (`public/consent.js`).

---

## 8. Copy and marketing surfaces per level

### 8.1 Rules (enforced by LGL gates, §9.1)

1. **Derive, never retype.** Every count (units, Lernschritte, Aufgaben, micro-outputs, new words, mock forms per
   lane) is computed by the compiler from `course.json` into a generated facts module
   (`src/data/courseFacts.js` ↔ `astro-site/src/data/courseFacts.js`, byte-identical, `check-duplicates`), read by the
   Astro pages, the SPA, `public/llms.txt` (regenerated by `scripts/build-llms.mjs`) and the checkout box, and pinned
   by `tests/claims.test.mjs`.
2. **Purpose phrase first; never a title that begins with an exam mark** („Vorbereitung auf das Goethe-Zertifikat
   B1 – Online-Kurs B1.2", not „Goethe B1 Vorbereitung"). The keyword stays in the title.
3. **Lead with teaching + instant scoring on the booked exam's criteria + the dated plan.** Mocks are proof points.
   **Mock counts are per chosen lane** — a lane's page states that lane's count; counts are never summed across lanes.
4. No comparative copy against Goethe DOI's „30 offene Aufgaben" (snippet only, [m08] §2.5) until read at source
   (§§ 5–6 UWG).
5. Hours only as measured Richtwert; prices gross; strike prices only against a price actually charged; no fake
   countdowns ([m13] impl. 12).
6. German copy in Sie; explanations in plain English ≤ B1, stored apart from the German so an L1 layer (Turkish,
   Arabic) can be added ([m10] impl. 6). Voice: calm, concrete, factual; the learner's exam and date are the subject,
   never our brand; no hype, no exclamation chains.

### 8.2 Pages per half-level (titles and headlines are drafts; each must pass LGL)

| Course | Page(s) · language | Title (purpose first) | Headline | Proof points (derived) | Honesty line |
|---|---|---|---|---|---|
| A1.1 | `/courses/a1-1/` DE+EN; EN landing for India | EN "Preparation for the Goethe-Zertifikat A1 (Start Deutsch 1): free German course, part 1" | "Start German for your A1 exam — free. From lesson 1 you speak and write, and every task gets an instant automated score." | 12 units · every SD1 part practised · scored tasks count · dated plan | "A1.1 is the first half of A1; the full exam format comes in A1.2. Automated feedback, not an exam result." |
| A1.2 | `/courses/a1-2/` EN+DE | EN "Preparation for the Goethe-Zertifikat A1 and telc Deutsch A1 — online course A1.2" | "Finish A1 and practise every part of Start Deutsch 1: each speaking and writing task scored instantly against the published criteria, with a plan to your exam date." | 3 practice exams in the Start Deutsch 1 format · Wiederholungsplan · price vs one exam fee (India ₹9,400 ≈ €86, Germany €155, [m10] §2.1, [m08]) derived in `marketing.js` with provenance | "A practice score, never an exam result. Not official exam material. €40 once — no subscription." |
| A2.1 | DE+EN | „Vorbereitung auf das Goethe-Zertifikat A2 – Online-Kurs A2.1" | „Alle Teile der A2-Prüfung kennenlernen – jede Schreib- und Sprechaufgabe sofort automatisch ausgewertet." | live lanes · Aufgaben count | „A2.1 ist die erste Hälfte. Die komplette Prüfung üben Sie in A2.2." |
| A2.2 | DE+EN; one page per live lane | „Vorbereitung auf das Goethe-Zertifikat A2 – Online-Kurs A2.2" · „Vorbereitung auf telc Deutsch A2 – …" | „A2 abschließen und jeden Prüfungsteil im Format Ihrer Prüfung üben – sofort ausgewertet, mit Plan bis zum Termin." | that lane's mock count (3 or 2) · 90 + 15 min format | „Übungswert, keine Prognose. Kein offizielles Prüfungsmaterial." |
| B1.1 | DE | „Vorbereitung auf die B1-Prüfung – Online-Kurs B1.1" | „Mitreden, planen, reklamieren: B1 Schritt für Schritt – jede Schreib- und Sprechaufgabe sofort im Format Ihrer Prüfung ausgewertet." | live lanes · planning round in every unit | „B1.1 ist die erste Hälfte des Wegs zur B1-Prüfung." |
| B1.2 | DE (EN page for the Goethe/ÖSD lane for India); one page per live lane | „Vorbereitung auf telc Deutsch B1 – Online-Kurs B1.2" · „Vorbereitung auf den DTZ – Online-Kurs B1.2 (nur für Teilnehmende am Integrationskurs)" · „Vorbereitung auf das Goethe-/ÖSD-Zertifikat B1 – …" | „Jeder Prüfungsteil gelernt und geübt, jede Schreib- und Sprechaufgabe sofort ausgewertet – nach den veröffentlichten Kriterien Ihrer Prüfung, mit Plan bis zum Termin." | that lane's mock count · Wiederholungsplan · DTZ page may cite 55.0 % B1 in 2025 ([Drs. 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf)) as context, never as a rate for our learners | „Automatische KI-Auswertung. Kein Prüfungsergebnis, keine Bestehensgarantie." |
| B2.1 | DE | „Vorbereitung auf die B2-Prüfung – Online-Kurs B2.1" | „Argumentieren, formell schreiben, im Detail verstehen – mit sofortiger automatischer Auswertung." | live lanes | „B2.1 bereitet die Prüfung vor, erreicht sie aber nicht allein." |
| B2.2 | DE; one page per live lane | „Vorbereitung auf telc Deutsch B2 – Online-Kurs B2.2" · „Vorbereitung auf das Goethe-Zertifikat B2 – …" | „Vortrag, Diskussion, Beschwerde, Forumsbeitrag: jede Aufgabe sofort nach den veröffentlichten Kriterien ausgewertet – in Originallänge und Originalzeit." | that lane's mock count | „Für ein Studium verlangen Hochschulen DSH-2 oder TestDaF TDN 4 in allen Teilen." ([RO-DT](https://www.goethe.de/pro/relaunch/prf/rahmenordnung/Rahmenordnung-ueber-Deutsche-Sprachpruefungen-fuer-das-Studium-an-deutschen-Hochschulen.pdf)) |

### 8.3 Surfaces every course carries

- The **Inhaltsverzeichnis** generated from `course.json` (Nr · Titel · Handlungsfeld · Kann-Beschreibungen ·
  Grammatik · Textsorte · Prüfungsteil · Minuten), the way Hueber and Klett publish theirs ([m14] §G7), plus the
  **Teil-Matrix** (which unit practises which Teil, at what length, per lane).
- „**Wie bewertet die KI?**": profiles, scales, zero rules, calibration method, known limits, „Die KI ersetzt keine
  Prüferin und keine Lehrkraft.", no accuracy figure.
- The **Teilnahmebescheinigung** explained with its fixed line; the **pre-checkout box** with the unticked
  § 356 Abs. 6 BGB consent in one sentence, and the voluntary refund line with linked terms if the owner adopts it
  ([m13] impl. 13–14); „Computerstimme" wherever TTS plays; „native speaker" removed site-wide.

### 8.4 E-mails and in-app copy

- **E-mails** (all via `lifecycle_emails`, claim-before-send, dry-run and canary like the existing mailers): daily
  course reminder (next step + minutes), Monday week start, re-entry after 7 idle days, the .1-completion bridge
  („Ihre Teil-Karte und Ihr Plan für A1.2" — link to the in-app card, no numbers), purchase confirmation (what the
  product is, the AI tool described as software, the Teilnahmebescheinigung's nature), and the owner-approved
  learner-pilot invitation to existing users.
- **In-app examples:** mock result „Modelltest B · Schriftlicher Teil: Übungswert 152 von 225. Nach der
  Bestehensregel von telc liegt dieser Übungswert über der Grenze von 135 Punkten. Übungswert aus unserer
  Übungsprüfung – keine Prognose Ihres Prüfungsergebnisses." · miniature „Hören Teil 4 haben Sie bisher nur im Kleinen
  geübt. In voller Länge kommt er in Plateau 2." · plan „Bis zu Ihrer Prüfung bleiben 19 Tage. Bei 5 Lerntagen pro
  Woche schaffen Sie die Lektionen 10–12 und Modelltest A bis zum 3.11. Möglich: ‚Ich kann das schon' für Lektion 10."

---

## 9. Quality gates

Gates are split by what they need. **Deterministic gates run in CI in seconds** (`node scripts/course-v2/validate.mjs
<level> [--unit N]`; LanguageTool ≈ 1 min per level against a warm self-hosted server). **Model-calling gates run as
pinned-model pipeline steps** whose results are committed with the content hash they checked; CI verifies the hashes
(QA-FRESH-01) and never calls a model or needs an API key. An author run's definition of done is **exit 0 on every
deterministic gate for its file**; a run that returns a red unit is a failed run, not a draft. **Hard** = 0 findings;
**ratchet** = only goes down and must equal its measurement (test), as the A1.1 validator's ratchets do; **advisory**
= routed to reviewers.

### 9.1 Deterministic rules (CI)

| Id | Rule (precise) | Type |
|---|---|---|
| **SCH-01** | Every file validates against its SCHEMA.md spec, using a zero-dependency checker in `scripts/course-v2/lib/` (no ajv/zod, no lockfile churn) | hard |
| **REF-01** | Every can-do, spine point, lemma, Teil template, rubric profile, rule card, cast member, text type, detector, fokus and fact id referenced anywhere resolves | hard |
| **ID-01** | Ids unique and well-formed per SCHEMA §2; each child id starts with its parent id; `ids.ledger.json` per level tombstones removed ids — a removed id is never reused, a meaning change gets a new id | hard |
| **KEY-01** | Writing, speaking and micro-output bank keys match `BANK_KEY_RE` (SCHEMA §2); the legacy `^(a\d\d)-l\d\d$` keys stay valid; a test covers all 8 prefixes × every slot kind and `courseTaskKeyPrefix()` | hard |
| **ALL-01** | 12 units, P1–P3, the closing block of the course kind (.1 Halbtest per live lane; .2 Diagnose + forms per lane), Etappen 4 × 3 | hard |
| **ALL-02** | 3–5 registry can-dos per unit, each with source tags and band; ≥ 1 productive can-do per unit proven by an Aufgabe; „Das kann ich" lists exactly the unit's can-dos, each linked to a proof | hard |
| **ALL-03** | ≥ 2 Lehrwerk placements per unit or a `deviation.reason` | hard |
| **ALL-04** | Every unit tagged with ≥ 1 Handlungsfeld; each band (.1 + .2) covers all 12 BAMF Handlungsfelder in units or Fokus-Karten | hard |
| **ALL-05** | Situation per unit is registry-unique within a band (no repeated topic without a new function, [m14] §F4) | hard |
| **ALL-06** | Quotas: ≥ 1 online-interaction can-do per half-level; from B1.1 ≥ 1 mediation can-do and ≥ 3 work units; B2 ≥ 2 care units; spiral threads B1.1→B2.2 name their band step | hard |
| **GRM-01** | ≤ 2 new spine points + ≤ 1 chunk preview per unit; a receptive first introduction counts as new | hard |
| **GRM-02** | Every spine point enters at its registry position, receptive before productive; an earlier placement carries a written reason | hard |
| **GRM-03** | Inventory floors: Goethe A1 inventory complete by A1.2 U12; A1.2 Perfekt milestones (haben ≤ U5, sein ≤ U8, trennbar/untrennbar/-ieren ≤ U10); Goethe A2 inventory complete by A2.2 U12 | hard |
| **GRM-04** | Grammar ceiling: production lines, model texts, rule-card examples, expected answers and exam texts use no construction introduced after the current position (detectors §9.3); inputs exceed it only via whitelisted chunks or glossed receptive exposure | hard for exact detectors, advisory for heuristic ones |
| **GRM-05** | Rule cards ≤ 60 words (A1) / ≤ 80 (A2+), model sentence first, English twin, no unconditioned claim (`quality.js` `unconditionedRule`) | hard |
| **GRM-06** | A point's contrast partner is interleaved in the warm-ups from its second LS on | hard |
| **LEX-01** | Known-token coverage ≥ 95 % per input and exam text; ≥ 98 % for the extensive strand (known = earlier units + this unit's lexicon + function words + cast names + glossed extras) | hard |
| **LEX-02** | Each new lemma ≥ 2× in its unit's inputs and in ≥ 2 later units (the last two units of a level may recycle via review) | ratchet |
| **LEX-03** | Items, model texts and expected answers use known lemmas only; ≤ 3 glossed receptive extras per text | hard |
| **LEX-04** | Off-list share ≤ 15 % (A) / ≤ 25 % (B1) per unit; B2 per the frequency-band rule; extension words receptive unless justified | hard |
| **LEX-05** | New entries within ±10 % of the level target (§2.6); productive share within ±5 points of the level profile | hard |
| **LEX-07** | One gloss per lemma across surfaces; feminine pairs one entry; `plural_kind` set; `wordId` null in authoring | hard |
| **SRS-01** | Daily review minutes at Standard pace, recomputed from the course's lexicon, card counts, productive share and the level's seconds per review, ≤ the level budget (A1 6, A2 7, B1 9, B2 11); Leicht/Intensiv values written to `course.json` for the plan | hard |
| **SRS-02** | Simulated capped ladder: every card introduced in U12 of a .2 course reaches ≥ 5 (productive) / ≥ 3 (receptive) spaced retrievals with the exam 28 days after U12 and with the exam 7 days after U12 | hard |
| **TXT-01** | Sentence metrics of non-exam texts within the level profile (mean/max words, subordinate clauses) | ratchet for dialogues, hard for instructions and rule cards |
| **TXT-02** | Exam texts within the Teil template's length band (±15 % of the official sample size) | hard |
| **TXT-03** | Input sizes: A dialogues 8–14 lines (A1.1 6–10), 60–120 s; B texts 150–450 words or 2–4 min; scenes ≤ 90 s (A1) / ≤ 2 min | hard |
| **TXT-04** | Every instruction fits ≤ 2 lines at 360 px (≤ 90 characters, design) | hard |
| **LNG-01** | Hunspell `de_DE` (`nspell` + `dictionary-de`, GPL, build-time only) ∪ lexicon ∪ cast names: 0 unknown tokens outside `intentionalError` items | hard |
| **LNG-02** | Self-hosted LanguageTool (LGPL-2.1; the public API allows 20 requests/min): 0 unresolved GRAMMAR, TYPOS, CASING, PUNCTUATION matches outside a per-rule allowlist with reasons | hard |
| **LNG-03** | Determiner/adjective + noun agreement against lexicon genders for listed nouns | hard |
| **LNG-04** | spaCy `de_core_news_sm` morphology checks (morphology accuracy 90.66 % per its model card) | advisory |
| **ITM-01** | Every `quality.js` exclusion reason and repair predicate, generalised from `SCOPED_LEVEL = 'a1.1'` to all levels without changing A1.1 output (its tests stay green): answer in prompt, cue only in the English gloss, article-cue mismatch, ambiguous correction, missing fronted orders, agreement ambiguity, gender-pair ambiguity, missing determiner cue, metalinguistic prompt, statement without a task, English in German fields, unconditioned rule | hard |
| **ITM-02** | MC: 3 options, one key, distractors in the key's form class | hard |
| **ITM-03** | R/F and Ja/Nein sets 40–60 % true, no run > 3; a/b/c keys balanced ±1 per block | hard |
| **ITM-04** | No R/F statement is a substring of its text or differs from a text sentence by one token (A1.1 review #9) | hard |
| **ITM-05** | `MAX_SAME_TASK_SHAPE` holds on the POS-masked key (review #9) | hard |
| **ITM-06** | Per LS: pool of 16, mix per §3.4, ≥ 70 % recall formats, generated ≤ the level cap | hard |
| **ITM-07** | Every answer containing a digit, time, date, price, phone number or spelled name carries `exact` | hard |
| **ITM-08** | `caseSensitive: true` only where capitalisation is the task (polite Sie/Ihnen/Ihr, capitalisation drills) | advisory |
| **ITM-09** | `sentence_building`: every grammatical order is in `accepted` (`missingFrontedOrder`) | hard |
| **ITM-10** | Every `accepted` form added after solver triage carries `acceptedWhy` and a reviewer-confirmed flag | hard |
| **ITM-11** | Every authored item has a static explanation `{de, en}`; nothing in a paid course depends on a runtime explanation call | hard |
| **CON-01** | Persona facts vs the cast bible (name, age, city, job, languages, relationships, du/Sie) | hard |
| **CON-02** | Model texts do not contradict the dialogues they summarise (entities, times, places) | hard + advisory |
| **CON-04** | Calendar, time and arithmetic sanity: weekday ↔ date in the story calendar, *halb elf* = 10.30, prices add up, opening hours consistent within a unit | hard |
| **CON-05** | Register per relationship: Sie in all instructions and with strangers; du only where the cast bible marks it | hard |
| **CON-06** | Every factual claim (Landeskunde, legal, administrative, statistic, Porträt) sits in a `facts[]` record with `sources`, `factsCheckedOn` ≤ 180 days before promotion, `currentAsOf`, `exceptions` and `verification: "verified"` | hard |
| **EXM-01** | Every block matches its Teil template: items, options, no-match option, plays, reading time, time box, text band, word band, preparation minutes | hard |
| **EXM-02** | `scaffolded` only where the template allows it for this course; never in a .2 course; A1.1 blocks untimed | hard |
| **EXM-03** | Writing tasks: Leitpunkt count = template; `choose` for 3-of-4 lanes; Anrede/Gruß never a Leitpunkt; register per template; sd1 S1 form exactly 5 fields | hard |
| **EXM-04** | Speaking tasks: mode = template interaction; preparation minutes = lane; cards/moves present | hard |
| **EXM-05** | Mock forms match the lane blueprint; parallel forms share no 8-gram; lengths within ±10 % of each other; same item-type counts; key balance | hard |
| **EXM-06** | Mocks, Plateaus and Halbtests use only the taught inventory (LEX-01 ≥ 95 %, no construction after the course's last unit; the Diagnose is exempt and labelled) | hard |
| **EXM-07** | Per-lane scorers pinned at their boundaries (§5.5) | hard |
| **EXM-08** | Deterministic zero/cap rules win over any AI output (tests with stubbed AI responses) | hard |
| **EXM-09** | Coverage COV-1…COV-7 (§2.4) per live lane | hard |
| **EXM-10** | No DTB-format block outside `dtb2`; the DTZ lane carries its label and gate question | hard |
| **LGL-01** | Banned strings in course data, pages and e-mails: „bestanden" (about our tests), „bereit für die Prüfung"/„prüfungsbereit", „prüfungsreif", „prüfungssicher", „Bestehenschance", „garantiert", „in … Wochen zu", „offiziell/anerkannt/zertifiziert/Partner" (about us), „persönliches Feedback", „Tutor", „Coach", „Lehrkraft korrigiert", „Korrektur deiner Texte", „Zertifikat" outside the fixed disclaimer, „Muttersprachler/native speaker" on TTS, „unbegrenzt/unlimited" (until §13 D8), „Prüfer/Prüferin" for the AI (the anti-recitation line names the human examiner and is allowlisted) | hard |
| **LGL-02** | No page or product title begins with an exam mark | hard |
| **LGL-03** | The fixed AI label in every graded-result component and the AI notice at first contact (component tests) | hard |
| **LGL-04** | Sie in every instruction, notice and e-mail; du only in marked peer dialogues | hard |
| **LGL-06** | „Computerstimme" on every audio surface without human-recording provenance | hard |
| **LGL-07** | No score, Übungswert or share link in any e-mail template until counsel clears it | hard |
| **LGL-08** | Mock counts per lane on lane pages, never summed; no mock count in a page H1 | hard |
| **LGL-09** | Hours only from `minutesMeasured` with n ≥ 30 learners per course (design) | hard |
| **AUD-01** | Every spoken line has a speaker → voice from the cast bible | hard |
| **AUD-02** | Numbers, times, prices and phone numbers in canonical form with a `say` override where written ≠ spoken („10.30" → „halb elf") | hard |
| **AUD-03** | Line length ≤ 250 characters; no unsupported characters | hard |
| **AUD-04** | ≥ 2 voices per dialogue; ≥ 4 voices per perception drill | hard |
| **TIM-01** | `minutesPlanned` from the time model (reading speed per level, audio × 1.5 in Lernmodus, ≈ 12 s per closed item, ≈ 30 s per typed item, task timers) ≤ the slot limit (§3.1–3.2); Prüfungsmodus sessions ≤ template time + 5 min | hard |
| **TIM-02** | U1 LS1 of every course has a scored item within the first 3 screens | hard |
| **TIM-03** | Every LS has an `endLine` and a next-step reference; every unit a cliffhanger | hard |
| **TIM-04** | Payload per LS ≤ 150 KB JSON and ≤ 1.5 MB including its audio (design) | hard |
| **TIM-05** | No 3 consecutive production items without a preceding worked example | hard |
| **PRG-01** | No progression gate reads an AI score (static test over the gate code) | hard |
| **PRG-02** | Completion is defined once in `course.json`; course home, certificate, reminders and weekly truth import the one function (test) | hard |
| **PRG-03** | An Aufgabe counts as submitted only as a real attempt (§3.5) (test) | hard |
| **PRG-04** | Plan suggestions, the board's Vorschlag and `teil`-card selection read deterministic inputs only (test on the selector inputs) | hard |
| **QA-FRESH-01** | Every committed model-gate result carries the content hash it checked; CI fails when the current hash differs | hard |

### 9.2 Model-calling gates (pipeline steps, pinned model ids, results committed under `content/course-v2/qa/`)

| Id | Gate | Pass |
|---|---|---|
| **SOL-01 Blind solver** | Two independent runs (different model or framing) answer every item from the learner-visible fields only (prompt, options, text or transcript; never key, explanation or `accepted`); each answer graded by the real `checkAnswer(answer, accepted, checkOptionsFor(item))` | both CORRECT or TYPO; else triage: key wrong (BLOCKER) · ambiguous (rewrite) · valid alternative (add to `accepted` with `acceptedWhy`, reviewer confirms) · solver error (third run decides) |
| **SOL-02 Second-key probe** | For MC and sentence building: „Ist eine andere Antwort ebenfalls richtig?" | no defensible second key |
| **SOL-03 Text-blind probe** | Each R/F, Ja/Nein or a/b/c set answered without its text | accuracy ≤ 60 % over the set (else the set leaks) |
| **CAL-01 Anchor regression** | Each rubric profile's anchors, 3 runs each, pinned model | §4.6 thresholds |
| **CAL-02 Human agreement** | Profile output vs the human DaF examiner's ratings (§4.6) | ≥ 80 % within one band per criterion; mean signed error on error-heavy texts ≥ −0.5 band |
| **LGL-05 Official-overlap** | 8-gram shingle hashes of the official model sets (kept in `private/`) vs all our texts | 0 matches |
| **LEX-06 List coverage** | Cumulative list gates at A1.2 / A2.2 / B1.2 (≥ 95 % of the list headwords) from the private `list_ref` table | report committed with its hash |

### 9.3 Construction detectors (GRM-04)

Each spine point names its detectors; each detector declares a **precision class** — exact detectors block,
heuristic ones only route to review. They extend `src/data/curricula/constructions.js`, keeping its rule that the
introducing unit is read from the spine, never typed into the detector.

| Construction | Detector | Precision |
|---|---|---|
| unambiguous subordinators (*weil, dass, wenn, ob, obwohl, nachdem, bevor, falls, sodass, indem*) | token + clause boundary | exact |
| ambiguous subordinators (*als*, *während*, *seit*, *bis*, *damit*) | token + verb-final clause check | heuristic |
| two-part connectors (*entweder … oder*, *weder … noch*, *nicht nur … sondern auch*, *sowohl … als auch*, *zwar … aber*, *je … desto*) | paired tokens in one sentence | exact |
| Konjunktiv II forms (*wäre, hätte, würde, könnte, müsste, dürfte* …) | closed list; *möchte* whitelisted as a chunk from A1.1 | exact |
| Präteritum of full verbs | lexicon `verb_forms.praet`, minus *war/hatte* and modals | exact (lexicon-driven) |
| Perfekt | auxiliary + participle from lexicon `verb_forms.perfekt` in one clause | exact (lexicon-driven) |
| Passiv | *werden* + participle; *worden* | exact for *worden*, heuristic otherwise |
| Futur I | *werden* + clause-final infinitive | heuristic |
| zu-Infinitiv | *zu* + infinitive / *-zu-* infix from separable lemmas | exact (lexicon-driven) |
| reflexive pronoun with a reflexive lemma | lexicon `reflexive` + pronoun in the clause | exact (lexicon-driven) |
| Genitiv, *wegen/trotz/während* + Gen. | pattern + lexicon | heuristic |
| relative clause | comma + d-pronoun + verb-final | heuristic (+ spaCy advisory) |
| imperative du/ihr | clause-initial verb form without subject | heuristic |
| attributive adjective endings | determiner + adjective + noun from lexicon | heuristic |
| comparison (*-er als*, *am -sten*) | pattern | exact |
| Konjunktiv I, extended participial attribute | pattern | advisory |

### 9.4 The DaF review rubric

Two reviewers per unit with different personas, plus specialists:
- **R1 „Prüferin"** (licensed-examiner persona): exam fidelity, rubric application, task clarity.
- **R2 „Kursleiterin DaF/DaZ"**: naturalness, level, didactics, scene plausibility.
- **Level reviewer** (one per level per round): coherence, spirals, persona, progression across all 12 units.
- **Walkthrough reviewer** (criterion E): the compiled unit played with Playwright Chrome device emulation at
  360 × 640 (agents have no Android emulator; this is the available equivalent) — every pilot unit, the first two
  units of every level, every Plateau.
- **Exam-fidelity reviewer** per band for Plateaus, Halbtests, Diagnosen and mock modules; **copy/legal reviewer** for
  pages and e-mails; **calibration reviewer** per rubric profile.
- **Fresh-eyes audit:** a random 20 % of exited units, to catch reviewer drift.

**Score sheet: 7 criteria × 5 = 35.**

| Criterion | 5 | 3 | 1 |
|---|---|---|---|
| **D — Deutsch** (correctness, idiom, register) | no errors; idiomatic; register fits each relationship | isolated unidiomatic phrasing, nothing wrong on a model surface | an error in a key, model text, rule card or input |
| **N — Niveau** | lexis, grammar and length exactly on level; progression felt | isolated look-aheads, glossed | systematically too hard or too easy |
| **H — Handlung** | a believable, lively scene in which the can-dos are actually performed | constructed but functional; somewhat bland | a can-do that is only claimed |
| **A — Aufgaben** | unambiguous; the answer follows from the German prompt; plausible distractors; explanations name the real error | some weak distractors | ambiguous, or solvable without German |
| **P — Prüfung** | Teil format, sizes, plays, timing, rubric profile and pass rule correct; lane-exact where required | small deviation, flagged `scaffolded` where allowed | a wrong format that trains the wrong behaviour |
| **K — Kohärenz** | cast, facts (current, not merely sourced), progression and spirals consistent | small breaks | contradictions or an outdated fact |
| **E — Ergonomie** | each LS within its minutes at 360 px; instructions ≤ 2 lines; early success; save points; the end screen names the win | one LS runs long or one confusing screen | a dead end, or an LS > 25 min without a save point |

**Severity.**
- **BLOCKER:** a wrong key or an answer that cannot be derived from the German prompt; wrong German on a model
  surface; a false or outdated fact; a legal-copy breach (outcome claim, human-feedback claim, exam-mark misuse);
  a misrepresented exam format or a scorer on the wrong pass rule; a dead end that blocks completion.
- **MAJOR:** unnatural German on a model surface; a level breach in production lines or expected answers; a can-do
  claimed but not performed; an ambiguous item or a defensible second answer not accepted; a persona or story
  contradiction; a register error in an instruction; a Lernschritt that runs > 25 min or lacks a save point; a
  missing lane-exact block in a .2 course; a gate hole that lets a finding class through.
- **MINOR:** style, gloss wording, a weak distractor, a scene that could be livelier.

**Exit per unit:** 0 BLOCKER, 0 MAJOR, every criterion ≥ 4, ≤ 5 logged MINOR. **Per level:** mean ≥ 29/35 (for
reference, A1.1 closed at 21.6/25 ≈ 86 % in `REVIEW-daf-23`). Up to 4 rounds per unit are planned; **a 5th round
triggers a rail fix** (template, exemplar or rule), never more rounds and never more authors. Proposal A's "≤ 1 MAJOR
per Lektion" and B's "≤ 2 MAJOR per course" are rejected: at 8× the A1.1 volume they would ship known MAJORs.

**Findings are JSON** (`{unitId, path, quote, problem, fix, severity, scope: "instance"|"class", proposedRule}`). Every
`class` finding goes to a **rule-smith**, who writes the rule, a failing fixture and a test **over all registered
courses**, then re-validates every unit ("close a finding class with a rule + a test, never with a list of ids",
CLAUDE.md). **Stop-the-line:** a class that recurs in ≥ 3 units of a level halts that level's authoring until the rule
exists.

### 9.5 The reviewers' brief: what the machines cannot check

Pragmatics (would a real person say this here?); collocations that are grammatical but unnatural (*eine Entscheidung
treffen*, not ✗ *machen*); cultural accuracy and stereotypes; **whether a fact is still current** and complete
(exceptions); whether a rule card's simplification has become false; whether a distractor is defensible; tone and
humour; **blandness** — the characteristic failure of templated production, scored under H.

### 9.6 Post-launch data gates (weekly, from `lesson_attempts` and the events of §7.8)

An item or screen where learners quit at ≥ 2× the Lernschritt's median rate goes to review within a week. A
Lernschritt with measured p50 > 25 min is split. AI grading p95 latency > 10 s on Android makes the degraded UX
(§4.7) the default.

---

## 10. Production plan

### 10.1 Order, tracks and gates

Two tracks run side by side: **Track E (engineering)** starts now; **the content workflows W2 → W3 → W4 → W5** run per
level, rolling. The calendar is set by review convergence and owner steps, not by compute (≈ 400 agent-minutes per
unit by C's estimate, to be measured in the pilot). No date is promised; the plan is re-cut after the agent pilot.

| Phase | Content | Runs in parallel with | Gate to leave |
|---|---|---|---|
| **P0** | E0 rails · W2 registries → specs, lexicon, casts · design and copy strategy | — | registries frozen by the W2 reviewers; E0 back-test passes (§10.2) |
| **P1 Agent pilot** | U4 of every level (8 units) through the full loop | E1 player/exam/AI build | go/no-go (§10.4) |
| **P2 Wave 1** | **A1 (A1.1 + A1.2, SD1) and B1 (B1.1 + B1.2, telc B1 primary) together** — B1 is the revenue core and is not held behind A1 | learner pilot on A1.1 Etappe 1 (3 weeks, never a blocker); E1 finishing | per unit: 0/0 exit; mass authoring beyond the pilot units starts only when the **SCHEMA fixture unit plays end to end at 360 px** (E1 exit) |
| **P3 Wave 2** | A2 (Goethe A2 + telc A2 pack) and the B1 lane packs (DTZ, Goethe/ÖSD B1) | W4 on Wave 1 | per unit/pack exit |
| **Decision point (moat)** | learner-pilot results (§10.4) | — | if the first-session AI metrics miss, fix the UX before Wave 3 |
| **P4 Wave 3** | B2 (telc B2 + Goethe B2 pack) | W4/W5 on Waves 1–2 | per unit/pack exit |
| **Integration** | one PR per level, one per lane pack (§10.7) | rolling | CI green incl. `validate.mjs --all`; §1.5 conditions for paid/B levels |

### 10.2 Track E — engineering (honestly re-estimated)

What must be generalised, measured in the repo: `buildLesson.js` (1,189 lines, the 9-stage A1.1 pipeline),
`quality.js` (2,013 lines, `SCOPED_LEVEL = 'a1.1'`), `validate-curriculum.mjs` (3,391 lines, RULE ids with A1.1
ratchets), `buildCheckpoint.js` (2,353 lines), `checkpoint/lexis.js` (only a1.1/a1.2), `speech.js` (hard-coded
manifests), `IntroStage`/`WortfeldStage`/`CheckpointPage` metas, 34 of 79 test files pinned to A1.1,
`evaluate-writing` (one 4 × 0–5 scale), the speaking stack (client `courseTask`), the Modelltest runner (no play-count
enforcement, ungraded writing). Proposal C's "2 days of rails" and A's 13 build agents are not credible. Design
estimate: **E0 ≈ 30–40 agent-days, E1 ≈ 60–80 agent-days**, E2 ≈ 5–8 agent-days per level; with 6–8 concurrent
engineering agents E0 ≈ 1–1.5 weeks and E1 ≈ 2–3 weeks, overlapping.

**E0 rails (6 agents, P0):**

| Agent | Builds | Owns |
|---|---|---|
| E0-1 | schema checker, ids ledger, compiler v0 | `scripts/course-v2/lib/*`, `scripts/course-v2/compile.mjs` |
| E0-2 | validator core; generic rules ported from `validate-curriculum.mjs` (no A1.1 personas or ratchet numbers) | `scripts/course-v2/validate.mjs`, `scripts/course-v2/rules/<RULE-ID>.mjs` (one file per rule) |
| E0-3 | `quality.js` generalised to a level parameter, A1.1 output unchanged | `src/data/lessonPools/quality.js` + its tests |
| E0-4 | Hunspell/LanguageTool CI job, detectors | `scripts/course-v2/lang/*`, `content/course-v2/registries/detectors.json`, `.github/workflows/course-v2.yml` |
| E0-5 | model-gate harness: solver, probes, calibration runner, shingle check, QA-FRESH hashes | `scripts/course-v2/qa/*` |
| E0-6 | generators, time model, SRS-01/02 calculators | `scripts/course-v2/generators/*`, `scripts/course-v2/models/*` |

**E0 exit:** unit tests green; **back-test** — an old A1.1 Lektion at its review-#1 state (from git history),
converted to the v2 schema, reproduces the known review-#1 finding classes through the gates; the SCHEMA example
unit validates with exit 0.

**E1 player, exam layer, AI, learner state (8 agents, P1–P2):**

| Agent | Builds | Owns |
|---|---|---|
| E1-1 | v2 unit builder (stage plan from unit JSON; reuses the seeded draw and earlier-attempt exclusion), lazy unit loader, resume at item level, course home | `src/lib/course-v2/*` (except board/completion), `src/pages/course-v2/*` |
| E1-2 | renderers for the new item types, in-lesson speaking, micro-output, no-mic path, player primitives into `ui/` | `src/components/course-v2/*`, `src/components/ui/*` (new primitives only) |
| E1-3 | lane loader, Prüfungsmodus runner (extends the Modelltest runner), per-lane scorers + boundary tests | `src/lib/exam/*`, `src/services/examRules/*`, `src/pages/Modelltest/*`, `src/services/examScoring.js` |
| E1-4 | `evaluate-writing` v2: rubric profiles, server zero/cap rules, response schema 2, `BANK_KEY_RE`, sharded writing bank twins | `netlify/functions/evaluate-writing.mjs`, `netlify/functions/_shared/rubrics/*`, `src/data/writingTasks/*` ↔ `netlify/functions/_shared/writingTasks/*` |
| E1-5 | entitlement: server `hasCourseAccess`, purchase-aware lifetime allowance + daily cap across AI functions, anonymous-session caps; client `hasCourseAccess` | `netlify/functions/_shared/entitlement.mjs`, `_shared/speakingUsage.mjs`, `score-readaloud.mjs`, `src/contexts/SubscriptionContext.jsx`, `src/components/LevelSubscriptionGuard.jsx` |
| E1-6 | speaking bank twins and modes (group, plan-together moves, photo, feedback-question, mediate), preparation timer, collapsing notes, anti-recitation note | `netlify/functions/speaking-*.mjs`, `evaluate-speaking.mjs`, `_shared/speakingAI.mjs`, `src/data/speakingTasks/*` ↔ `_shared/speakingTasks/*` |
| E1-7 | migrations (`exam_practice_results`, `learner_goals`, `review_cards` kinds), ladder parameter + exam cap, plan, Prüfungsstand, Teil-Karte, the one completion function, funnel and reminder SQL updated in the same PR | `migrations/2026-10-*.sql`, `src/lib/review/ladder.js`, `src/lib/course/plan.js`, `src/lib/course-v2/board/*`, `src/lib/course-v2/completion.js`, `netlify/functions/course-reminder.mjs` |
| E1-8 | tests: the 34 A1.1-pinned files re-pointed as class tests over every registered course; KEY/PRG/EXM tests | `tests/*` |

**E1 exit:** the SCHEMA fixture unit (A2.1 U7) plays end to end at 360 × 640 in Playwright Chrome device emulation,
including one graded writing task and one graded speaking task against dev functions; CI green.

### 10.3 W2 — curriculum, registries, design, copy (P0)

| Role | Agents | Owns (sole writer) |
|---|---|---|
| Can-do registry | 4 (A1, A2, B1, B2) | `content/course-v2/registries/cando/<band>.json` |
| Grammar spine | 1 | `registries/grammar-spine.json` |
| Lane profiles, Teil templates, form blueprints, pass-rule ids | 5 (sd1+oza1 · ga2+ta2 · tb1+dtz · gb1 · tb2+gb2) | `registries/lanes/<lane>.json` |
| Families and transfer map | 1 | `registries/families.json` |
| Rubric profiles | 2 (writing, speaking) | `registries/rubrics/writing/*.json`, `registries/rubrics/speaking/*.json` |
| Level profiles, text types | 1 | `registries/level-profiles.json`, `registries/text-types.json` |
| Story architect + band casts | 1 + 4 | `casts/series.json`, `casts/<band>.json` |
| Curriculum (one per level): converts the W2 draft onto the §2.8 rows | 8 | `<level>/course.json`, the `spec` block of each `units/uNN.json` (created by this agent), `<level>/rule-cards.json` |
| Lexicon (one per level, after the level's specs) | 8 | `<level>/lexicon.json` |
| UX design | 1 | `docs/course-v2/design/player.md` |
| Copy strategy | 1 | `docs/course-v2/copy/<level>.md`, `docs/course-v2/copy/emails.md` |
| Counsel brief | 1 | `docs/course-v2/legal/counsel-questions.md` |
| W2 reviewers (Prüferin: lanes + rubrics · DaF: spine + can-dos · progression: all 8 specs · cast/Landeskunde) | 4 | `docs/course-v2/reviews/w2/<reviewer>.json` |

≈ 43 runs, peak ≈ 24 concurrent. Order: registries → W2 reviewers → **freeze** → specs → lexicon and casts → review →
freeze. After a freeze a registry changes only through its owner agent, on a rule-smith's or reviewer's finding.

### 10.4 Pilots (run in parallel)

**Agent pilot (P1):** U4 of all eight levels, through S → I → T, Spur-Karten for each secondary lane, gates, solver,
two reviewers, fixes, ≤ 4 rounds; 2 rule-smiths standing; the walkthrough reviewer on every pilot unit (≈ 140 runs,
peak ≈ 24). **Go only if all hold:** all 8 exit at 0/0 in ≤ 4 rounds; SOL-01 disagreement on first submission ≤ 5 %
of items; LNG findings on first submission ≤ 1 per 1,000 words; reviewer mean ≥ 29/35 with no criterion < 4;
measured agent-minutes per unit within 2× the estimate; CAL-01 passes for the profiles the pilots use. If any fails,
fix the rails (templates, exemplars, rules) before mass authoring; **never add authors to compensate**. The pilot
units become the **exemplars** every later author prompt carries.

**Learner pilot (from P2):** A1.1 Etappe 1 (U1–U3 + P1), authored first in Wave 1, shipped to free users as a
beta path beside the live A1.1 (feature flag; the live A1.1 keeps serving), with existing users invited by an
owner-approved e-mail so the sample is not limited to ≈ 23 new sign-ups a week. Three weeks. Measures: minutes per
Lernschritt (p50/p95), week-1 learning days, share reaching day 7, AI Aufgaben per active learner, first-session
scored sentence rate, abandonment hotspots, mic denials, AI latency. Internal targets (design, never copy): ≥ 70 % of
starters finish LS1 with its scored sentence; ≥ 40 % have ≥ 3 learning days in week 1; ≥ 1.5 AI Aufgaben per active
learner per unit. **It never blocks B1.** Its results freeze anatomy v1.1 (split rule, time-model recalibration),
applied by rule to every unit; the moat decision point uses its AI metrics.

### 10.5 W3 — materials

**Lease rule:** exactly one agent holds a content file at a time; the orchestrator grants and releases leases;
reviewers never edit content (they write findings files). A unit file is authored in three sequential runs (C's split):

| Role | Writes into `units/uNN.json` |
|---|---|
| **S „Szene & Text"** | Start, LS1–LS3 inputs (B: text types), LS4 texts, dialogue lines with voices and `say` overrides, story beat and cliffhanger, Fokus-Karten, `facts[]` |
| **I „Items"** | input items, structured input, practice pools (incl. generator declarations), exit, Lektions-Check, proofs, static explanations |
| **T „Prüfungsaufgaben"** | LS4 blocks against their templates, strategy cards, micro-outputs, both Aufgaben (writing and speaking bank entries inline), checklists, moves, model texts |

| Work package | Files (one writer each) | Author runs |
|---|---|---|
| Units (96 − 8 pilots) | `<level>/units/uNN.json` | 88 × 3 = 264 |
| Spur-Karten (secondary lanes) | `<level>/units/uNN.lane-<lane>.json` | ≈ 96 (A2 24 ta2; B1 24 dtz + 24 gb1; B2 24 gb2) |
| Plateaus | `<level>/plateaus/pN.json` + `pN.lane-<lane>.json` | 24 + 24 |
| Closing blocks | `<level>/closing/halbtest-<lane>.json` (.1), `diagnose-<lane>.json` (.2) | 8 + 8 |
| Modelltest modules (one agent per module, never one per whole mock) | `<level>/mocks/<lane>/<form>/<module>.json` | primary: sd1 12, ga2 12, tb1 15, tb2 15; secondary: ta2 8, dtz 8, gb1 8, gb2 8 → 86 |
| Calibration anchors | `content/course-v2/anchors/<profile>/*.json` | ≈ 30 profiles |
| Lexicon and rule-card fixes | the level's `lexicon.json`, `rule-cards.json` | on call (the 8 W2 owners) |

≈ 540 author runs + ≈ 340 pipeline runs (solver/probes/calibration); peak ≈ 36–40 concurrent. **Every author prompt
carries:** the unit spec, the level profile, the cast bible, one pilot exemplar at the same level, the gate list, and
the reviewers' brief (§9.5). **Authors write lemmas, never database ids**; `wordId` is filled by the orchestrator with
one SQL match at integration (db snapshot header). **Generators are code**, not agents.

### 10.6 W4 — review and fix (rolling, per unit as it arrives)

| Reviewer | Scope | Runs per full round |
|---|---|---|
| R1 Prüferin + R2 Kursleiterin | every unit and Spur file | ≈ 192 unit reviews (+ Spur files reviewed with their unit) |
| Level reviewer | all 12 units of a level | 8 |
| Exam-fidelity reviewer | Plateaus, Halbtests, Diagnosen per band | 4 |
| Mock-module reviewer (Prüferin persona) | each mock module file | ≈ 86 |
| Calibration reviewer | each rubric profile (CAL-01/02 results) | ≈ 30 |
| Walkthrough reviewer | pilots, first 2 units per level, all Plateaus | ≈ 40 |
| Copy/legal reviewer | pages, e-mails, in-app strings per level | 8 |
| Fresh-eyes auditor | random 20 % of exited units | ≈ 20 |
| Rule-smiths | class findings → rule + fixture + test | 2–3 standing |

Findings files: `docs/course-v2/reviews/<level>/<unitId>.<reviewer>.r<N>.json`. Fixes: the original role under a new
lease (S for texts, I for items, T for blocks). Re-review covers only failed criteria plus the fresh-eyes sample.

### 10.7 W5 — build and integrate

- **One integration PR per level** (8 agents) once its 12 units, 3 Plateaus, closing block and primary-lane forms have
  exited: compiled outputs committed (unit chunks, pool items, writing and speaking bank shards, syllabus twins,
  `courseFacts` twins, audio line files), the `words` JSON batch as guarded SQL for the owner, the audio lines for the
  owner's Azure run, pages (Astro course page, lane pages, SPA), `llms.txt` regenerated, steward conventions (squash;
  the lockfile trap; the non-idempotent prerender — build from scratch). **Secondary lane packs** ship in follow-up
  PRs, one per pack. Shared: 1 pages/copy agent, 1 e2e agent.
- **Paid levels become buyable** only with §1.5 conditions met and the owner's Lemon Squeezy variant set (the real
  on-switch, DECISIONS 2026-09-26).
- **Replacing the live A1.1:** after v2 A1.1 has exited review and the learner pilot has run. Old A1.1 progress stays
  visible as history, is never counted as v2 completion, and still counts as activity for the reminder view; the funnel
  SQL (`migrations/2026-09-19-course-funnel.sql` hard-codes `'a1.1-l01'`, `'a1.1-cp1'`) and the reminder view are
  updated in the same PR.
- **A1.2 legacy buyers:** free upgrade to v2 A1.2 with a § 327r notice on a durable medium; the legacy A1.2 player stays
  reachable until the notice is sent.

### 10.8 File ownership (the rule that keeps parallel agents apart)

| Path | Sole writer | Phase |
|---|---|---|
| `content/course-v2/registries/**` | the W2 registry owner of that file | P0; later only on findings |
| `content/course-v2/casts/**` | story architect / band cast agent | P0 |
| `content/course-v2/<level>/course.json`, `rule-cards.json` | that level's curriculum agent | P0 |
| `content/course-v2/<level>/lexicon.json` | that level's lexicon agent | P0; fixes on call |
| `content/course-v2/<level>/units/uNN.json` | the lease holder (curriculum agent for `spec`, then S → I → T, then fixers) | P0–P4 |
| `content/course-v2/<level>/units/uNN.lane-<lane>.json` | that lane's Spur author | P2–P4 |
| `content/course-v2/<level>/plateaus/**`, `closing/**`, `mocks/**` | the assigned assessment author per file | P2–P4 |
| `content/course-v2/anchors/**` | anchor author per profile | P2–P4 |
| `content/course-v2/qa/**` | pipeline runners (generated) | continuous |
| `docs/course-v2/reviews/**` | the reviewer who wrote the file | continuous |
| `scripts/course-v2/**`, `src/**`, `netlify/**`, `migrations/**`, `tests/**`, `astro-site/**` | Track E agents per §10.2, integration agents per §10.7 | E0–W5 |
| `src/data/pricing.js` twins, `src/data/marketing.js` twins | integration agent of the level being shipped, one at a time | W5 |

### 10.9 Owner touchpoints and decision points

- **Decision points:** (1) agent-pilot go/no-go (orchestrator, §10.4); (2) before the first paid v2 sale — §1.5
  entitlement live, counsel's answer, §13 D1; (3) **moat check** after the learner pilot — if fewer than 50 % of
  starters submit the first Aufgabe or AI Aufgaben per active learner per unit stay below 1.5, fix the UX before Wave 3;
  (4) before B-levels go buyable — Impressum and Nutzungsbedingungen, Lemon Squeezy variants.
- **Owner actions that agents cannot do:** one Azure TTS run per level and per lane pack (≈ $20 in total by C's
  derivation; owner time is the constraint); applying the `words` SQL batches and the migrations; Lemon Squeezy
  variants; booking counsel; hiring the DaF examiner(s); enabling Supabase anonymous sign-ins (if chosen); approving
  the pilot invitation e-mail; the legal pages.

---

## 11. Reuse and replace

| Asset | Decision | How |
|---|---|---|
| `src/lib/lesson/check.js` | **reuse**, extend | add `exact: 'number' \| 'name'` (numbers/times/names exact, no typo allowance on those tokens); the solver and generators call the same checker, so QA and the app agree |
| `mastery.js`, `requeue.js`, `reviewGrading`, `reviewService` | **reuse** | level-agnostic ([m12] §3) |
| `src/lib/review/ladder.js` | **generalise** | ladder as a course parameter + exam cap; legacy ladder kept for the live A1.1 |
| `readaloud.js` + `score-readaloud` | **reuse**, extend | Aussprache slots and the no-mic path; purchase-aware allowance; anonymous caps |
| `buildLesson.js` | **keep for the live A1.1**; v2 gets its own unit builder | reuse its seeded draw and earlier-attempt exclusion; wire `attempt` from progress (review #9) |
| `quality.js` | **generalise** | level parameter; A1.1 output unchanged |
| `validate-curriculum.mjs` | **port** the generic rules into `scripts/course-v2/validate.mjs`; keep the file for the live A1.1 until retirement | no A1.1 personas or ratchet numbers in v2 |
| `constructions.js` | **extend** into `registries/detectors.json` | introducing unit read from the spine |
| `buildCheckpoint.js`, `checkpoint/lexis.js` | **replace** for v2 | Plateaus compiled from unit data; known-word sets emitted per unit |
| `speech.js`, `generate-course-audio.mjs` | **generalise** | a manifest per level; voices from the cast bible |
| `evaluate-writing` + `writingTasks.js` twins (893 lines) | **generalise** | rubric profiles, zero rules, response schema 2, `BANK_KEY_RE`, purchase-aware allowance; bank sharded per level with lazy imports (≈ 200–400 new tasks) to hold the player JS budget; `SchreibenPage`/`GradedWriting` keep working on schema 1 |
| `speaking-session`/`-turn`/`evaluate-speaking`, `_shared/speakingAI.mjs` | **reuse + speaking bank** | server-owned tasks, exam modes, in-lesson stage; the client `courseTask` path stays for legacy only |
| `explain-answer` | **off in paid v2 courses** | static explanations; allowed in the free A1.1 only |
| Modelltest runner + `examScoring.js` | **reuse, extend** | lane profiles, play counts, reading times, answer-sheet step, per-lane scorers, graded productive parts, new part types (`richtig-falsch`, `notes`, `form`, `speaking`) |
| `src/data/mockExams/*` (Kurzversionen) | **replace** | full-format forms; keep `examKey` values; the 14 listening exercises they consume stay untouched until those consumers are re-pointed in the same PR ([m12] §2.4) |
| `src/data/courseTests/*` | **replace** | no separate end test where mocks exist; the .1 Halbtest is the .1 end test |
| `words` rows with audio (2,561 of 2,597) | **reuse by lemma** | B-level defect pass first; new rows via `words-from-json.mjs` |
| grammar DB (84 topics, 672 rules, 933 examples) | **quarry** | for rule-card drafts after the `quality.js` filter; its grammar-first sequencing is not inherited ([m06] F5) |
| `speaking_missions` | machinery **reuse**; A2.1–B2.2 content **replace** | one mission per grammar topic does not set the sequence |
| `listening_exercises`, `reading_lessons` | transcripts and A1–A2 lessons with checks as **quarry** (Lesemagazin candidates); B-level essays **replace** | re-render per line with course voices |
| `programs/*` + `src/data/courses/index.js` | **retire** per level when its v2 course ships | legacy 28-day player |
| `CourseCertificatePage.jsx` | **replace** | Teilnahmebescheinigung with the fixed line |
| `levelTestQuestions.json` | **replace** | Einstufung over the Plateau banks |
| curricula registry (LIVE vs DRAFT) | **reuse the pattern** | a level is promoted only after review; the paused A1.2 draft is a quarry, not a template |
| `plan.js`, `course-reminder.mjs`, `lifecycle_emails` | **reuse, extend** | plan places mocks; reminders name the next step; claim-before-send |
| `hasLevelAccess` / purchases | **reuse client; add server twin and `hasCourseAccess`** | build prerequisite (§1.5) |
| product keys `course_a1_2` … `course_b2_2`, legacy `course_a1` … `course_alle`, `/course/:level` routes, `LevelSubscriptionGuard` | **keep resolving** | the v2 player mounts behind the same routes and guard (extended) |
| `telc_b1_komplett` (no `levels` today) | **owner decision** §13 D9 | — |
| the live A1.1 (`src/data/curricula/a11.js`, `lessonPools/a11*`, A1.1 routes) | **keep serving** until v2 A1.1 exits review | then replace (§10.7) |
| the W2 drafts in `docs/course-v2/curriculum/` | **input** to the W2 specs | converted onto §2.8 rows |
| tests (34 of 79 pin A1.1) | **re-point** | class tests over every registered course |

---

## 12. Risks

| # | Risk | L / I | Mitigation | Owner |
|---|---|---|---|---|
| R1 | **FernUSG:** AI rubric grading in a paid course may count as „Überwachung des Lernerfolgs"; void contracts, repayment, fines up to €10,000 ([m13] §1–2) | M / H | formative, private, retryable, never a gate; no human in the loop; no Fragerecht; no score on any document or e-mail; counsel before any paid v2 course incl. A1.2; the free A1.1 carries the moat | owner |
| R2 | **Entitlement leakage:** trial/Pro opens every level; a €40 buyer opens B-level mocks for 90 days | certain until fixed / H | §1.5 build + §13 D1 before any paid v2 page promises AI grading; B-levels stay coming-soon until then | owner + engineering |
| R3 | **UWG:** the Prüfungsstand read as a pass prediction | M / H | module values vs the official rule only; ranges for AI parts; LGL lint; no single percentage | design |
| R4 | **AI Act Annex III 3(b)** from 2 Dec 2027: AI scores steering the path | M / M | deterministic plan and suggestion inputs (PRG-04); re-review before Dec 2027 | engineering |
| R5 | **Grader validity** unmeasured; German morphology is hard for automated feedback ([m09] §5); B2 anchors are error-heavy | H / H | human ground truth (§4.6); ranges; no accuracy copy; pinned models with re-runs | engineering + owner (raters) |
| R6 | **Review does not converge** at 8× A1.1 volume (A1.1 took 23 rounds) | M / H | rails first; pilot go/no-go; rule-smiths; stop-the-line; exemplars; a 5th round fixes rails, never adds authors | orchestrator |
| R7 | **Engine work larger than estimated** | M / M | honest E0/E1 estimate; fixture gate before mass authoring; compile into existing shapes where possible | engineering |
| R8 | **The moat is unused** (0 AI writing uses in 7 days, 2 sales ever) | H / H | scored sentence in the first 3 screens; an Aufgabe per unit; events; learner pilot; the moat decision point before B2 | owner |
| R9 | **AI cost vs one-time price** (speaking unmeasured) | M / M | measure in the pilot; fair-use cap in the terms; no „unbegrenzt"; cheaper model for `course-micro` only if CAL passes | owner |
| R10 | **Fluent but wrong or bland German** passes every gate | M / H | two personas with the §9.5 brief; LanguageTool; exemplars; H scores blandness; fresh-eyes audit | orchestrator |
| R11 | **Teaching to the test / washback**, esp. for beginners and DaF learners without an exam | M / M | situational spine; A1.1 miniatures untimed, board opt-in; ≥ 75 % teaching items; parallel forms; full-length-only board | design |
| R12 | **Format drift** at the providers | M / M | lane profiles with `stand` and sources; quarterly re-check; EXM tests; mocks regenerate from blueprints | orchestrator |
| R13 | **Secondary lanes lag or stay thin** (DTZ volume falling, telc A2 demand unknown) | M / M | lane packs as data; lane choice measured at onboarding; only live lanes listed | owner |
| R14 | **DTZ mis-selling** to people outside the Integrationskurs | L / H | gate question and fixed label; no DTZ-only product | design |
| R15 | **Copyright:** Goethe lists, official sets, rated samples | L / H | own wording; `private/` tables and hashes; LGL-05; counsel on calibration use | owner |
| R16 | **Outdated Landeskunde** (the eAU case) | M / M | CON-06 currency fields; reviewers check currency; 180-day re-check at promotion | orchestrator |
| R17 | **Audio bottleneck and TTS realism** | H / M | one batched owner run per level; „Computerstimme"; several voices and natural rate; human recordings later | owner |
| R18 | **Progress and legacy migration** (old A1.1 progress, A1.2 buyers, § 327r) | M / M | distinct v2 ids; history view; reminder counts both; free upgrade + notice; funnel SQL in the same PR | engineering |
| R19 | **Learner pilot underpowered** at ≈ 23 sign-ups a week | H / M | invite existing users; pre-registered thresholds; qualitative walkthroughs; it informs, never blocks | orchestrator |
| R20 | **Client-side content** (keys reachable) | certain / L | server AI allowance and progress are the boundary; no predictable public URLs; owner decides previews (D6) | owner |

---

## 13. Owner-only decisions

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| **D1** | Do trial and Pro subscriptions still open **paid v2 levels** (today `hasLevelAccess` returns true for any live trial/subscription, and every course purchase grants a 90-day Pro window)? And what happens to the „3 Monate Pro inklusive" claim? | v2 paid content and its AI allowance follow the purchase only; trial/Pro keep the existing tools; keep „Pro inklusive" as a bonus for the existing tools or drop it — reconcile `pricing.js`/`marketing.js` in the same PR | first paid v2 sale |
| **D2** | **Counsel** (FernUSG and more): AI grading in paid courses incl. A1.2; reminders, plan and Wochenbericht wording and any share link; the existing 90-day Pro window with AI tools; private use of official rated samples for calibration (copyright); Teilnahmebescheinigung wording; the voluntary refund promise; FernUSG for buyers abroad (Rome I) | book counsel now; the counsel brief is produced in W2 | first paid v2 sale; share link; calibration ground truth |
| **D3** | **Hire human DaF examiner(s)** (Goethe/telc licensed) to rate ≥ 30 samples per rubric profile as calibration ground truth; optionally a spot check of 2 units per level (internal QA, never a learner entitlement) | yes; without it no accuracy statement is ever possible and AI parts stay ranges | CAL-02 |
| **D4** | **Voice budget:** keep Azure TTS („Computerstimme") at launch, or commission human recordings for mocks and scenes later | TTS at launch (≈ $20 total, owner time); revisit human recordings for Modelltests after revenue | none at launch |
| **D5** | **Pair offer** (.1 + .2) at checkout, and its price | offer it; the .1 courses are weak standalone buys | .1 conversion |
| **D6** | **Paid previews / first-lesson leak:** is U1 of each paid course playable before purchase? | yes for U1 LS1–LS3 without Aufgaben; the free Diagnose covers the taste of scoring | page copy |
| **D7** | **Supabase anonymous sign-ins** for the scored first sentence without an account | enable, with the caps of §4.7; otherwise the unscored fallback | A1.1 first session |
| **D8** | **Fair-use numbers** and whether any copy may ever say „unbegrenzt" | set after the pilot's cost measurement; never „unbegrenzt" | terms, copy |
| **D9** | What **`telc_b1_komplett`** buyers (no `levels` today) receive in v2 | grant v2 B1.1 + B1.2 access as the successor product | B1 integration PR |
| **D10** | **Lemon Squeezy:** variants for the B-level products, the checkout consent box, the voluntary refund in the dashboard | variants when B1 passes review; refund „30 Tage Geld zurück" with linked terms | B-levels buyable |
| **D11** | **Legal pages:** complete Impressum and publish Nutzungsbedingungen | before B-levels go live | B-levels buyable |
| **D12** | **L1 explanation layer** (Turkish, Arabic): when and with which translator budget | after A1 revenue; the schema stores `{en, tr?, ar?}` from day one | none at launch |

---

## Sources

**Exam specifications:** Goethe A1 [Durchführungsbestimmungen](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf) ·
[Prüfungsziele SD1](https://www.goethe.de/pro/relaunch/prf/de/Pruefungsziele_Testbeschreibung_A1_SD1.pdf) ·
Goethe A2 [Durchführungsbestimmungen](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A2.pdf) ·
[Übungssatz A2](https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf) ·
[Fit 2 Prüfungsziele](https://www.goethe.de/pro/relaunch/prf/zh/Pruefungsziele_Testbeschreibung_A2_Fit2.pdf) ·
Goethe B1 [DFB](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B1.pdf) ·
[Modellsatz B1](https://www.goethe.de/pro/relaunch/prf/materialien/B1/b1_modellsatz_erwachsene.pdf) ·
Goethe B2 [DFB](https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_B2.pdf) ·
[Modellsatz B2](https://www.goethe.de/pro/relaunch/prf/materialien/B2/b2_modellsatz_erwachsene.pdf) ·
telc [Übungstest A2](https://shop.telc.net/media/catalog/product/file//2/0/20201226_5090-b00-010106_web_1.pdf) ·
[Übungstest B1](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf) ·
[Übungstest B2](https://shop.telc.net/media/catalog/product/file/2/0/20201223_5023-b00-010201_web.pdf) ·
DTZ [g.a.s.t. Übungssatz 1](https://www.gast.de/fileadmin/gast.de/GAST/5_DTZ/PDF/gast_DTZ_UEbungssatz_1.pdf) ·
ÖSD [ZA1 DB](https://osd.at/wp-content/uploads/2023/09/ZA1-Durchfuhrungsbestimmungen_10_2023.pdf) ·
DTB [BAMF Übungstest](https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Berufsbezsprachf-ESF-BAMF/BSK-Konzepte/b2-modelltest-bsk.pdf?__blob=publicationFile&v=10) ·
[RO-DT](https://www.goethe.de/pro/relaunch/prf/rahmenordnung/Rahmenordnung-ueber-Deutsche-Sprachpruefungen-fuer-das-Studium-an-deutschen-Hochschulen.pdf) ·
Goethe digital exams word counter (snippet): <https://www.goethe.de/de/spr/prf/ddp.html>.

**Buyers and law:** [Drs. 21/175](https://dserver.bundestag.de/btd/21/001/2100175.pdf) ·
[Drs. 21/5716](https://dserver.bundestag.de/btd/21/057/2105716.pdf) ·
[Destatis PD26_186](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html) ·
[Destatis PD26_295](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_295_212.html) ·
[BAMF spouse-visa leaflet](https://www.bamf.de/SharedDocs/Anlagen/DE/MigrationAufenthalt/Ehegattennachzug/ehegattennachzug.pdf?__blob=publicationFile&v=9) ·
§ 5 EntgFG (read 2026-09-27): <https://dejure.org/gesetze/EntgFG/5.html> ·
[Bund-Verlag on the eAU](https://www.bund-verlag.de/aktuelles~Die-neue-eAU-Das-Ende-des-gelben-Scheins~.html) ·
§ 4 ArbZG (read 2026-09-27): <https://dejure.org/gesetze/ArbZG/4.html> ·
[§ 23 MarkenG](https://www.gesetze-im-internet.de/markeng/__23.html) ·
Lemon Squeezy pricing (snippet): <https://www.lemonsqueezy.com/pricing>.

**Learning science:** [Latimier et al. 2021](https://doi.org/10.1007/s10648-020-09572-8) ·
[Hausknecht et al. 2007](https://doi.org/10.1037/0021-9010.92.2.373) · the rest via [m09], [m11] and Proposal B's
source list.

**Tools:** LanguageTool public API limits <https://dev.languagetool.org/public-http-api.html> · `dictionary-de`
<https://www.npmjs.com/package/dictionary-de> · spaCy `de_core_news_sm` <https://huggingface.co/spacy/de_core_news_sm>
(via Proposal C, read 2026-09-27).

**Repo:** `CLAUDE.md`; `docs/course-v2/DECISIONS.md`; `inputs/db-snapshot-2026-09-27.md`; research memos 01–14;
proposals A, B, C and the three judge verdicts; `src/contexts/SubscriptionContext.jsx`; `src/data/pricing.js`;
`src/data/marketing.js`; `netlify/functions/evaluate-writing.mjs`; `netlify/functions/lemonsqueezy-webhook.mjs`;
`netlify/functions/_shared/speakingUsage.mjs`; `migrations/2026-09-12-lesson-engine.sql`;
`migrations/2026-09-19-course-funnel.sql`; `src/lib/lesson/check.js`; `src/data/lessonPools/quality.js`;
`src/data/design-tokens.js`; `src/data/writingTasks.js`.
