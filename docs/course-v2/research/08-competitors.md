# 08 — Competitor course teardown (2026): who teaches, who grades, and the gap between them

**Date:** 2026-09-26 · **Wave:** course-v2 W1 research · **Scope:** the products a paying German-exam
candidate compares us with. For each: structure, levels, exam alignment, feedback, price, and what reviewers
praise and complain about. The memo ends with ten gaps ranked by how much an exam candidate cares.
`docs/research/research-market-2026-09-03.md` was checked, not copied. Where this memo disagrees with it,
that is noted inline.

## Method

- **Web research.** About 45 WebSearch queries, plus WebFetch of vendor pages, help centres, press releases,
  Trustpilot, the App Store and review sites. Everything was read 2026-09-26/27.
- **Blocked sites.** `www.goethe.de` (403), `learngerman.dw.com`, `www.reddit.com` and `help.busuu.com`
  (403) could not be fetched, and DUO's shop needs JS. Facts from these come from search-engine snippets and
  are marked **(snippet)**.
- **No fresh Reddit quotes.** Trustpilot and the App Store stand in for them.
- **DataForSEO** `keywords_data/google_ads/search_volume/live`: Germany (2276), German, 30 keywords
  returned, run 2026-09-27. Figures are 12-month average monthly volumes.
- **Not used:** Firecrawl (out of credits).
- **Derived numbers** are my arithmetic on sourced prices. They are labelled **derived** and show their
  inputs.

---

## 1. The field at a glance

| Product | Unit of sale | Levels | Structure, as sold | Exam alignment | Output feedback | Price |
|---|---|---|---|---|---|---|
| **Babbel** | subscription / lifetime | A1–B2 | ~15 levels → courses → 5–15 lessons of 10–15 min | none | AI speaking (Babbel Speak, beta); pronunciation check | €8.99–17.99/mo; €299.99 lifetime |
| **Busuu** | subscription | A1–B2 (C1 some) | themed lessons of ~5 min | none | community (human, untrained); AI Conversations (Premium Plus) | $5.83–9.99/mo Premium; $13.99/mo Plus (snippet) |
| **Duolingo** | freemium subscription | A1–B2 since 22 Apr 2026 | sections/units of micro-lessons | none | AI Video Call / Roleplay (Max) | Super $84/yr; Max $168/yr (snippet) |
| **Lingoda** | class credits every 4 weeks | A1.1–C1.2 | 60-min live group class; A1.1 = 50 classes (snippet) | none | live teacher | ~€8.75–12.60 per group class (derived from snippet) |
| **Goethe Deutsch Training Online** | 3-month access | A1–C1 | 70–85 h self-study per level | Goethe-curriculum, no exam tasks | AI speaking training (new, snippet) | €299 list / €149 promo (snippet) |
| **Goethe Deutsch Online Individual** | per level | Teilstufen A1.1–C1 | A1 = 54 sequences, ~100 h, 60 open tasks | implicit | tutor by e-mail + 2 live sessions | €699 (snippet) |
| **Goethe Prüfungsvorbereitung Online B1** | 6-week course | B1 | Moodle tasks + group Zoom | Goethe B1 | online teacher | €289 (snippet) |
| **DW Nicos Weg** | free | A1–B1 | 76 video lessons/level, ~2 h video | none | none | €0 |
| **Deutsch-Uni Online (DUO)** | per course, 6-month access | A1–C1 (study-oriented) | with or without tutor | TestDaF courses | tutor: 4 (or 8) personal feedbacks (snippet) | from ~€150 (snippet) |
| **Preply / italki** | tutor lessons | any | 50-min 1:1; Preply "A2 course" = 13 h | tutor-dependent | human tutor; AI lesson summaries | ~$7–33+/lesson |
| **AI mock-exam apps** (TestGerman, DeutschExam, Viobean, Papagei, germanexamprep, Goethe Trainer) | pass / subscription | A1–B2, varies | mock sets + drills | yes, format-exact | AI writing ± speaking | €6.99/48 h → €119.90/yr; €9.99 lifetime |
| **Creators** (lingoni/Jenny, Deutsch mit Marija, SmarterGerman, DeutschAkademie) | app sub / live cohort / club | A1–C2 | video + app, or live cohort | partial | human in cohorts only | €49–499; $29.90/mo; €99/mo |
| **deutsch-meister (planned)** | one-time per half-level | A1.1–B2.2 | tbd | must be yes | AI writing + speaking | €0 (A1.1), €40–65 |

---

## 2. Teardowns

### 2.1 Babbel — the structured app that thins out where exams begin

- **Structure.** About 15 levels (Newcomer, Beginner I/II …). Each level holds 2–8 courses, and each course
  holds 5–15 lessons of 10–15 min. A lesson has 3–4 stages that open with new vocabulary, and Review is a
  separate mode ([testprepinsight](https://testprepinsight.com/reviews/babbel-german-review/), snippet).
- **Depth.** "A1 runs to more than ninety lessons and B1 to around fifteen … learners keep discovering it the
  same way" ([Language Librarian, upd. 31 Aug 2026](https://languagelibrarian.com/en/german/tools/babbel/)).
- **Exam alignment.** None. The same review says: "It will not get you through a Goethe A1 exam."
- **Feedback.** Consumer **Babbel Live closed**: booking ended 30 June 2025, because learners "did not accept
  Babbel Live as part of their language learning path"
  ([Strømmen](https://strommeninc.com/why-babbel-live-shut-down-and-what-to-use-instead-2025/), secondary).
  It was replaced by **Babbel Speak**, AI dialogue scenarios "to build speaking confidence", launched
  16 Sep 2025 in open beta, German included
  ([Babbel press](https://www.babbel.com/press/en-us/releases/babbel-speak)). Writing is "barely exercised".
- **Tell-tale side product.** The **Babbel Integration German course** is 6 half-level modules of 6 weeks,
  each with 10 h/week of live class plus the app. It is "modelled on the BAMF integration courses" and "will
  prepare you for official B1 exams" ([babbel.learnworlds.com](https://babbel.learnworlds.com/), no price
  shown). Babbel's half-level, exam-bound product is a live cohort, not the app.
- **Price.** €17.99/mo on a 3-month plan, €8.99/mo on a 12-month plan, €299.99 lifetime (Language Librarian).
  The lifetime plan is often discounted to $159 in the US
  ([9to5toys](https://9to5toys.com/2026/09/14/this-exclusive-offer-gives-you-lifetime-access-to-all-babbel-language-lessons/)).
- **Reviews.** Trustpilot **4.4 from 33,091** ([trustpilot](https://www.trustpilot.com/review/babbel.com)).
  Praise: "well structured and the return to fix errors and repetition is very helpful". Complaints: "I have
  problems speaking fluently" and "Hidden subscription auto renew" (both Sep 2026).

### 2.2 Busuu — community correction, AI behind the top tier

- **Structure.** CEFR courses A1–B2 made of themed, scenario-based lessons
  ([Wikipedia](https://en.wikipedia.org/wiki/Busuu)) of "about 5 minutes"
  ([testprepinsight, Feb 2026](https://testprepinsight.com/reviews/busuu-review/)). Counts per level were not
  findable.
- **Exam alignment.** None. It "wasn't built with exam certificates in mind"
  ([Papagei](https://www.getpapagei.app/blog/busuu-review), written by a competitor). Certificates are now
  Busuu-only, since the McGraw Hill co-branding ended (snippet).
- **Feedback.** Premium gives community corrections, whose "accuracy varies since correctors aren't trained
  tutors" (testprepinsight). **Premium Plus** adds "AI Conversations", pronunciation feedback and "Mistake
  Repair", described as "grammar exercises from errors". These are mobile-only and available in selected
  languages ([busuu.com](https://www.busuu.com/en/premium-plans)).
- **Price.** Premium $9.99/mo or $69.99/yr; Premium Plus $13.99/mo (snippet,
  [linguasteps](https://linguasteps.com/resources/busuu-pricing-a-transparent-overview)).
- **Reviews.** Trustpilot **4.2 from 19,770** ([trustpilot](https://www.trustpilot.com/review/www.busuu.com)).
  Praise: "practical, well-structured". Complaints: renewals ("they charged my card anyways") and "delayed or
  missing certificate delivery". A reviewer's con: "Lessons lack robust conversational practice".

### 2.3 Duolingo — B2 on paper, gamification in practice

- **Structure and levels.** Since **22 Apr 2026** the German course "teaches content through B2". Duolingo maps
  that to Duolingo Score 100–129 and adds advanced Stories, DuoRadio, Explain My Answer and mini-units
  ([Duolingo blog](https://blog.duolingo.com/courses-teach-advanced-content/)). Independent assessments put
  completers "closer to a strong A2 or early B1, particularly for speaking"
  ([siplingo](https://siplingo.com/blog/what-level-german-duolingo/), snippet).
- **Feedback.** Max includes AI **Video Call** and **Roleplay** for German, on iOS and Android (snippet,
  [dealnews](https://www.dealnews.com/features/duolingo/cost/)). There is no writing assessment and no exam
  tasks.
- **Price.** Super $12.99/mo or $84/yr. Max $29.99/mo or $168/yr (snippet, dealnews /
  [beginnersinai](https://beginnersinai.org/duolingo-max-explained/)).
- **Reputation.** The 2025 "AI-first" memo and 148 AI-built courses
  ([TechCrunch](https://techcrunch.com/2025/04/30/duolingo-launches-148-courses-created-with-ai-after-sharing-plans-to-replace-contractors-with-ai))
  drew a backlash over "repetitive content and inaccurate translations"
  ([CX Dive](https://www.customerexperiencedive.com/news/duolingo-ai-first-consumer-backlash-lessons/757133/)).
  Trustpilot is **1.6 from 8,145** ([trustpilot](https://www.trustpilot.com/review/www.duolingo.com)), and
  "Lessons lack proper grammar explanations" is the top complaint. **Lesson for us:** learners punish
  AI-*made* content. They have not been shown to punish AI-*graded* practice on human-designed material.

### 2.4 Lingoda — live classes by half-level, the closest structural twin

- **Structure.** 60-min live classes with 3–5 students ([pricing](https://www.lingoda.com/en/pricing/)),
  sold by sub-level (A1.1 … C1.2). **A1.1 = 6 topic modules × 8 classes + 2 review classes = 50** (snippet).
  At 5 classes a week a sub-level takes about 2.5 months
  ([Simple Germany, 2024](https://www.simplegermany.com/lingoda-review/)), and teachers are often "not able to
  finish the learning material within the 60 minutes". It now also advertises "100+ hours of AI-powered
  self-study materials". **Correction to the Sept-3 memo:** 50 classes is one **half-level**, not all of A1.
- **Exam alignment.** None. Goethe and TestDaF appear only as context
  ([lingoda.com](https://www.lingoda.com/en/p/german-a1-beginner/)). The certificate is Lingoda's own.
- **Price.** 5–40 classes per 4-week cycle, with group classes from 5 for €62.99 to 40 for €349.99
  (snippet). Credits roll over, and cancelling needs 3 days' notice. **Derived:** one half-level of 50 group
  classes costs 50 × €8.75 = **€437** to 50 × €12.60 = **€630**.
- **Reviews.** Trustpilot **4.3 from 5,877** ([trustpilot](https://www.trustpilot.com/review/lingoda.com)).
  Praise: "Real teachers get you talking". Complaints: "After 12 Months the lessons payed start to expire!",
  "If you cancel with less than three days you lose your credit", and teachers who "talk more than the
  students" (Aug–Sep 2026).

### 2.5 Goethe-Institut online — the brand, with thin self-study and expensive tutoring

- **Deutsch Training Online (no teacher).** A1–C1, 70–85 h per level, 3 months of access. The India page
  describes vocabulary, listening and reading, with writing as fill-in-the-blanks, and says "speaking skills
  are not a focus" ([Goethe India](https://www.goethe.de/ins/in/en/spr/kur/onk/dto.html), snippet). The German
  page now lists **"KI-Sprechtraining … realistische Dialogübungen und direktes Feedback"** at **€299, or €149
  with code FALL2026 until 27 Sep 2026** ([Goethe DE](https://www.goethe.de/ins/de/de/kur/typ/dto.html),
  snippet). **Goethe is adding AI speaking to its cheapest product.** Whether it rehearses exam Teile is
  unknown.
- **Deutsch Online Individual (with tutor).** Teilstufen A1.1–A1.3, A2.1–A2.3, B1.1–B1.4 and B2.1–B2.4. A1 is
  "54 sequences with 60 open writing and speaking exercises", about 100 h including two live sessions. The
  tutor corrects by e-mail ([Goethe UK](https://www.goethe.de/ins/gb/de/spr/kur/onl/doi.html), snippet). The
  price is €699 ([Goethe DE](https://www.goethe.de/en/spr/kur/doln/doi.html), snippet). **Benchmark:**
  **60 human-marked productive tasks per full level**, which is about 30 per half-level (derived).
- **Prüfungsvorbereitung Online Individual B1.** 6 weeks, **€289**. Moodle tasks "tailored to the exam
  requirements", an online teacher and several group Zoom sessions. It assumes B1 is already "largely
  achieved" ([Goethe DE](https://www.goethe.de/ins/de/de/kur/pvb/opv.html), snippet).
- **Free official training.** Goethe publishes free model sets and interactive online training. Its A1
  Schreiben page shows the rubric ("3 Punkte – Aufgabe voll erfüllt …") and a "0 von 15 Punkten" field but
  **does not score the text** ([bfu.goethe.de](https://bfu.goethe.de/a1_sd1/schreiben.php)). **The official
  free material tells candidates how they will be graded but never grades them.**
- **Reviews.** Trustpilot **2.0 from 44** for goethe.de as a whole, a small sample that mixes exams and
  courses ([trustpilot](https://www.trustpilot.com/review/goethe.de)). One quote: "The course is not engaging
  and most of the assignments are in form of a test".

### 2.6 DW Nicos Weg — the free benchmark every paid A1–B1 course is measured against

- **Structure.** A1, A2 and B1. Each level has **76 short episodes/lessons (~2-min clips, ~2 h video)** with
  exercises, a final test and a DW certificate ([LingoClub](https://www.lingoclub.com/nicos-weg/), snippet).
  The DW app also covers placement tests and other series up to C1
  ([App Store](https://apps.apple.com/us/app/-/id1224076534)).
- **Exam alignment.** None. Opinions differ on whether its vocabulary matches the official word lists
  ([Language Librarian, upd. 30 Aug 2026](https://languagelibrarian.com/en/german/reviews/dw-learn-german-nicos-weg/)).
- **Feedback.** None. "Speaking and writing are left to you" is "the most repeated complaint", and "the
  course lacks writing exercises and independent sentence construction" (Language Librarian).
- **Reviews.** App Store **3.9 from 131 ratings**: "Everything is free and the lessons are extremely high
  quality. Only downside … is the poor UX." Demand is large: **"nicos weg" 9,900 searches/mo in Germany**
  (DataForSEO).

### 2.7 Deutsch-Uni Online (DUO) — tutor-or-not, aimed at future students

- Run by g.a.s.t. (the TestDaF organisation) with LMU München. A1–C1, "focused on topics from everyday student
  life at German universities", with course names by half-level ("Basis-Deutsch A1.2 mit Tutor").
  *Without tutor* gives "automatic corrections, but no personal feedback on writing and speaking". *With
  tutor* gives "personal feedback on writing and speaking exercises", fixed start dates and a certificate
  ([deutsch-uni.com](https://www.deutsch-uni.com/en/learning-with-duo/), read via curl).
- Tutored courses include "4 (or 8) instances of individual feedback" and 6 months of access. Prices run
  "from 150.00" up to 375.00 (all snippet). **Benchmark:** a tutored online course gives **4–8 personal
  corrections per course**.

### 2.8 Preply and italki — human tutors, no curriculum of record

- **Preply "courses"** are tutor subscriptions with a label. The A2 course is "13 hours (Estimated 7 weeks,
  2 lessons/week)" of 50-min 1:1 lessons "Starting at $7 per lesson"
  ([preply.com](https://preply.com/en/courses/german/a2-german-course)), billed in 28-day cycles (snippet),
  with AI "Lesson Insights" summaries ([help](https://help.preply.com/en/articles/10385861-lesson-insights),
  snippet). Trustpilot is **4.4 from 25,449** ([trustpilot](https://www.trustpilot.com/review/preply.com)),
  with complaints about refunds and no-shows.
- **italki** has no subscription: German tutors charge about $5–35/h, and italki Plus ($5.99/mo) adds AI
  lesson summaries ([italki](https://www.italki.com/en/blog/italki-price), snippet).
- **What the candidate gets:** the best live speaking practice money buys. Exam readiness depends entirely on
  the tutor chosen, because there is no fixed syllabus, mock set or scoring.

### 2.9 Official prep and the AI mock-exam apps — grading without teaching

- **Official.** telc gives away the telc Deutsch B1 Übungstest with audio
  ([telc](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/)),
  and Goethe gives away model sets and online training (§2.5). **I found no official telc or Goethe app.**
  Store apps named after the exams say they are "not officially affiliated with TELC GmbH"
  ([Google Play](https://play.google.com/store/apps/details?id=com.mhamada.telcb1german&hl=en), snippet).
- **The AI simulators** form a crowded field in 2026. All six pages below were fetched:

| App | Exams / levels | AI grading | Teaching? | Price |
|---|---|---|---|---|
| [TestGerman](https://www.testgerman.de/) (Wilhelm Digital GmbH, Düren) | Goethe, telc, DTZ, ÖSD A1–B1 | writing + speaking, "grades it like a real examiner … in your native language — 18 languages" | "structured courses with lessons" + 407/437 mock exams | €19.90/mo … €119.90/yr |
| [DeutschExam](https://deutschexam.ai/b1-exam/) | telc B1 (40 mocks), A1 | speaking + writing on telc criteria, handwriting OCR | drills only | €6.99/48 h … €27.99/3 mo, one-time, 14-day refund |
| [Viobean](https://viobean.com/) (Berlin) | telc A1–B2, Goethe A1 | speaking + writing, explanations in 30 languages | drills + mocks | free 3 credits; $9.99–16.66/mo |
| [Papagei](https://www.getpapagei.app/) | Goethe/telc/ÖSD B1–B2 | speaking scores; "human tutor additionally reviews your writing" on Premium | daily exercises + mocks | €6.99/wk, €23.99/mo, €41.99/yr |
| [germanexamprep.org](https://germanexamprep.org/) | telc A1–B1, DTZ, Goethe A1–B1 | speaking "instant scoring" | "None" (mocks only) | $9.99/wk, $24.99/mo |
| [Goethe Trainer](https://goethetrainer.de/) (Berlin) | Goethe B1/B2 | writing only, no speaking | no | €9.99 lifetime (from €29.99) |

  **Pattern.** The mock itself is a **commodity priced at €7–25**. The apps differ on grading quality, which
  no vendor documents: Papagei says its AI "is calibrated against official grading criteria" but publishes no
  data. Marketing drifts toward outcome claims: "My score jumped from 34% to 75+ in three weeks" (Papagei), and
  users report passing "in 2 to 6 weeks" (Goethe Trainer).

### 2.10 Exam-prep creators — trust from YouTube, feedback only in paid cohorts

- **lingoni (founded 2019 by Jenny of "German with Jenny").** A self-study app for A1–B2. At A1 it has 80
  lessons, 106 vocabulary units and 3,500+ exercises. Plans: €49/3 mo, €89/12 mo, €229 lifetime. The app
  gives **no feedback**: its FAQ tells learners to speak with someone at "B2 or higher" or book private
  lessons ([lingoni](https://lingoni.com/german-a1/)). The live **A2 course** has 16 lessons over 8 weeks, at
  most 10 students and "up to 8 texts" corrected by Jenny, for **€499** (from €599)
  ([lingoni A2](https://lingoni.com/german-a2-course/)).
- **Deutsch mit Marija.** B1–C2. The club costs **€99/mo or €299 one-time**, and its value is "a closed
  Telegram group with … feedback, corrections"
  ([ablefy](https://myablefy.com/s/deutschmitmarija/dmm-deutsch-im-alltag-club), snippet). One product is
  titled **"Deutsch C1 mit Garantie"**
  ([ablefy](https://myablefy.com/s/deutschmitmarija/deutsch-c1-mit-garantie-intensivkurs)); its terms were
  not visible.
- **SmarterGerman.** A1–C1 plus A1 and B1 exam prep from a single instructor, at **$29.90/mo**
  ([smartergerman.com](https://smartergerman.com/courses/)).
- **DeutschAkademie.** Live telc prep with at most 14 people: 4 × 3 h "from 149 €", or 8 × 3 h for €249
  ([deutschakademie.de](https://www.deutschakademie.de/en/online-courses/exam-preparation-courses/)).
- **Learn German Original.** Exam-focused YouTube. I found no paid course.

---

## 3. Demand check (Germany, Google Ads, 12-month average monthly searches, DataForSEO 2026-09-27)

| Brand | /mo | Exam head term | /mo | "Course" term | /mo |
|---|---|---|---|---|---|
| babbel | 49,500 | b1 prüfung | 12,100 | deutschkurs online b2 | 1,000 |
| lingoda | 14,800 | telc b1 | 2,900 | b1 prüfung vorbereitung | 590 |
| busuu | 12,100 | dtz prüfung | 2,900 | telc b1 übungstest | 590 |
| nicos weg | 9,900 | b2 prüfung / telc b2 | 2,400 / 2,400 | deutschkurs online b1 | 140 |
| italki | 9,900 | a1 prüfung | 1,000 | telc b2 prüfungsvorbereitung | 110 |
| deutsch mit marija | 480 | goethe b1 / goethe a1 | 720 / 720 | deutschkurs online a1 | 50 |
| lingoni | 260 | — | — | — | — |

Inside Germany, exam demand peaks at **B1** ("b1 prüfung" gets 12× the searches of "a1 prüfung"), and **telc
out-searches Goethe** at B1 by about 4×. A1 demand is largely abroad (spouse visas), which these Germany-only
figures cannot show (unverified).

---

## 4. What the teardown shows

1. **Teachers and graders are separate products.** The apps and video courses teach but do not score exam
   output. The mock apps score but teach little (TestGerman comes closest to doing both). Humans do both, but
   at €289–699 per level (Goethe), about €437–630 per half-level (Lingoda, derived) or €499 per cohort
   (lingoni), and they ration feedback: 60 tasks per level at Goethe, 4–8 at DUO, 8 texts at lingoni.
2. **Consumer AI speaking is conversation practice, not exam simulation.** Babbel Speak, Busuu AI
   Conversations and Duolingo Video Call rehearse scenario dialogue or pronunciation (Goethe DTO's is
   unknown). Only the mock apps rehearse the *Teile*.
3. **Depth collapses where demand peaks.** Babbel has about 15 lessons at B1 against 90+ at A1. Nicos Weg
   stops at B1, and Goethe's exam course assumes B1 is already reached. German search demand sits at B1/B2.
4. **Half-levels are the professional unit.** Lingoda, Goethe DOI, DUO and Babbel's live integration course
   all sell in sub-levels, so our eight-product split fits the field.
5. **Billing is the top complaint outside teaching itself:** auto-renewals, expiring credits, 3-day
   cancellation, 28-day cycles and 3-month access windows.

---

## 5. Ten gaps a new course could own — ranked by how much a paying exam candidate cares

1. **Every productive task scored instantly on the booked exam's own criteria, inside the course.** Goethe's
   free training shows the rubric but does not apply it (A1 Schreiben checked). Courses do not grade, and graders do not teach. This
   is the product.
2. **Real depth at B1.1–B2.2.** This is where German search demand sits and where the apps thin out (§4.3).
   It is also where our prices are highest (€60–65).
3. **Speaking rehearsed Teil by Teil, with points.** The candidate needs Goethe B1 "gemeinsam planen", the
   presentation and the follow-up questions, plus the telc and DTZ equivalents. Free chat with a friendly
   avatar is not enough (§4.2).
4. **Full timed mocks per exam format, with an honest readiness signal.** Mocks are cheap everywhere. What is
   missing is a readiness read-out derived from the learner's own graded attempts, stated as a practice score
   and never as a pass prediction.
5. **One course, the exam you booked.** Buyers at the same level sit different exams: Goethe, telc, ÖSD or
   DTZ (see `01`–`03`). Graders cover slices: Goethe Trainer only Goethe B1/B2, DeutschExam mainly telc B1,
   Viobean telc plus Goethe A1.
6. **Teach → test → repair loop.** Every graded error should lead to the rule behind it and a repair drill.
   Busuu locks "Mistake Repair" behind Premium Plus, and Duolingo's explanations are the top complaint.
7. **Fair ownership.** One-time price, no auto-renew, no expiring credits, and access long enough for a
   rescheduled exam. It answers the most frequent non-teaching complaint across Babbel, Busuu, Duolingo and
   Lingoda.
8. **Feedback on your own text, explained in your language.** TestGerman (18 languages) and Viobean (30) sell
   this. The teaching products localise their interface, not their feedback, because they give none.
9. **A dated plan that ends on the exam date, with the hours stated.** Competitors sell time windows (3-month
   access, 4-week cycles, 28-day billing), not a route to a date.
10. **Transparent AI grading.** No vendor documents how its AI scores or how reliable it is. Publishing the
    criteria, the limits and "this is an automated practice score, not an exam result" builds trust. Our
    legal framing (automated tool, not personal feedback) requires that wording anyway (Implication 12).

---

## Implications for the course blueprint

1. **Each Lektion ends in at least one exam-format productive task (Schreiben or Sprechen), AI-scored.** The
   feedback names the exam Teil, the criteria and the points awarded. **Floor: ≥ 40 scored productive tasks
   per half-level.** That is more than Goethe DOI's ~30 per half-level (60 per A1, derived), without the
   e-mail wait.
2. **Put exam rehearsal in the ".2" half.** Certificates exist per full level, so A1.2, A2.2, B1.2 and B2.2 end
   with **≥ 3 full timed mocks per supported format**. The ".1" halves end in a skills checkpoint (a
   half-mock). A2.2 and B1.2 also carry DTZ (A2–B1 scaled; see `02-exams-b1.md` §3).
3. **Publish study hours per half-level and design to them.** Benchmarks: Lingoda 50 × 60 min per
   half-level; Goethe DTO 70–85 h per level; Goethe DOI ~100 h per level; Nicos Weg 76 lessons / ~2 h of video
   per level; Babbel A1 ≈ 90+ lessons × 10–15 min. **Target 40–50 h per half-level**, measured and not
   estimated, and state only what the build delivers.
4. **The speaking engine simulates exam interaction types, not free chat.** Monologue, planning with a
   partner, presentation plus questions, and reacting to a picture or card. Each is scored on the exam's
   criteria for that Teil. Free conversation can come as a bonus.
5. **Multi-exam at the task layer.** Build one skills core per level, and at onboarding ask "which exam and
   when?". Format drills and mocks switch by exam: Goethe/ÖSD, telc and DTZ, following the specs in
   `01`–`03`. **Minimum at B1: Goethe + telc + DTZ.** This meets the telc-heavy German search demand.
6. **Every scored error links to its rule card and a repair drill.** This is the Busuu Mistake Repair and
   Duolingo Explain My Answer idea, included in the product, not paywalled.
7. **B-level parity.** B1.1–B2.2 get the same number of Lektionen, scored tasks and hours as the A-levels.
   Reviewers penalise Babbel's B1 drop-off, and B1 is where German exam searches concentrate.
8. **Do not headline "mock exams".** They sell for €6.99–27.99, Goethe Trainer's are €9.99 lifetime, and the
   official Übungstests are free. Headline "the course that scores your writing and speaking the way the exam
   does". Mocks are a necessary part, not the pitch.
9. **Packaging.** One-time payment and **no auto-renewal**. Access runs **≥ 12 months** from purchase, or the
   exam date plus a buffer. There are no credits or expiry mechanics. A voluntary refund window is stated as a
   voluntary promise, never as the statutory Widerruf.
10. **The free A1.1 must demonstrate the moat.** It needs scored writing and speaking from the first
    Lektionen. Its real rivals are free or cheap: Nicos Weg grades nothing, and Duolingo's AI speaking is
    paid-tier conversation practice.
11. **Feedback in the learner's L1.** Offer at least English plus the top buyer L1s, chosen with the
    buyer-research memo. Mock apps at €10–20/mo already do this.
12. **Legal copy.**
    - **No pass guarantee** and no "score jumped from X to Y" testimonials (UWG). The market uses both:
      Marija's "mit Garantie" product title and Papagei's testimonials.
    - **No promise of personal or human feedback.** That is what turns a paid distance course into
      Fernunterricht (FernUSG; see `docs/course-research-2026-09-03.md` §4). Goethe, DUO and Papagei Premium
      sell human feedback. We do not. Every grading surface reads "automatische KI-Bewertung — kein
      Prüfungsergebnis".
    - Publish a short **"Wie bewertet die KI?"** page with criteria, limits and known failure modes (gap 10).
13. **Exam-date plan.** Onboarding captures the exam date. The course schedules Lektionen and mocks backwards
    from it and shows the weekly hours required. It is a plan, never a promise.
14. **Spaced review against the official word lists**, with visible coverage per list. Babbel's vocab review
    "doesn't capture all content" (Trustpilot summary), and Nicos Weg has no built-in review.

---

## Open questions

- **How good is competitor AI grading?** No vendor publishes agreement rates with human examiners. Should we
  commission a small blind comparison (our scores vs. certified raters on the same scripts) before launch
  copy mentions accuracy?
- **Which L1s?** The top buyer languages (Arabic, Turkish, Ukrainian, Hindi, English …) need data from the
  buyer memo or PostHog attribution.
- **ÖSD as its own format?** At B1, ÖSD shares the Goethe exam. At A1/A2 and B2, is Austria demand big enough
  to add ÖSD-specific mocks?
- **Is TestGerman a full curriculum?** Its "structured courses with lessons" were not inspected. If they are
  full curricula, it is the closest competitor to our positioning (course + AI grading, 18 languages,
  €19.90/mo).
- **What does Goethe's new KI-Sprechtraining in DTO actually do?** Exam Teile or free dialogue? This is the
  brand threat most likely to erode gap 3.
- **Access length.** Is 12 months right? Rescheduled exams and slow learners argue for 18–24 months or
  lifetime. This is an owner call with pricing in mind.

## Unverified

- **Goethe (all snippets; pages returned 403):** DTO €299/€149 and its KI-Sprechtraining; DOI €699, 54
  sequences / 60 tasks / ~100 h and the Teilstufen; Prüfungsvorbereitung B1 €289 / 6 weeks.
- **Lingoda (snippets):** A1.1 = 50 classes and the €62.99/€349.99 tiers, so the derived €437–630 is
  unverified too.
- **Busuu (snippets):** prices, the end of the McGraw Hill certificate. Chapter and lesson counts were not
  found.
- **Duolingo (snippets):** Super/Max prices, German Video Call, and Siplingo's "strong A2 or early B1".
- **Babbel:** the Babbel Live shutdown rests on a secondary source (Strømmen). "Vocab review doesn't capture
  all content" is a search summary of Trustpilot, not a quote I saw.
- **Snippets, other vendors:**
  - DW: 76 lessons per level and the certificate.
  - DUO: prices, the 4/8 feedbacks, 6-month access.
  - Preply and italki: mechanics and rates.
  - Marija: €99/€299, examiner status, and the "Garantie" terms.
  - SmarterGerman: $429 / 30-day refund.
- **Absence of evidence only:**
  - that no official telc/Goethe app exists;
  - that "Learn German Original" sells no paid course;
  - that A1 demand is mostly abroad (DataForSEO was queried for Germany only).
- **Reddit:** no Reddit sentiment was verified (domain blocked). The Sept-3 memo's Reddit quotes were
  deliberately not re-used.
