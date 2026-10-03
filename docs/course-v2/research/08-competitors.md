# 08 — Competitor course teardown (2026): who teaches, who grades, and the gap between them

**Date:** 2026-09-26 (re-verified 2026-09-27) · **Wave:** course-v2 W1 research

**Scope.** This memo covers the products a paying German-exam candidate compares us with. For each one it
sets out structure, levels, exam alignment, feedback, price and reviews. It ends with ten gaps, ranked by how
much a candidate cares about each. `docs/research/research-market-2026-09-03.md` was a source to check, not a
conclusion to copy. Where the two disagree, the point is marked **Correction**.

## Method

- **Web research.** About 60 WebSearch queries, plus WebFetch or curl of vendor, pricing and FAQ pages,
  Trustpilot, the App Store and sec.gov. All pages were read 2026-09-26/27.
- **Primary documents:**
  - the Goethe *Kurskalender 2026* PDF;
  - the vhs-Lernportal *Infoblatt*;
  - Duolingo's Q2 2026 shareholder letter;
  - Lingoda's pricing HTML, parsed down to its `data-class-type` attributes. WebFetch's summary had swapped
    the group and private prices.
- **Blocked sources:**
  - `www.goethe.de` pages returned 403, though its PDFs worked;
  - `learngerman.dw.com` and `reddit.com` were blocked, and so were Reddit's JSON endpoints and the pullpush
    mirror;
  - DUO's shop needs JavaScript.

  Facts that come from search results are marked **(snippet)**. **No Reddit content was read.**
- **DataForSEO** `search_volume/live`: Germany, German, 30 keywords, run 2026-09-27. Figures are 12-month
  average monthly volumes.
- **Firecrawl** was not used, because it has no credits.
- **Derived** marks my own arithmetic; each derived figure shows its inputs.

---

## 1. The field at a glance

| Product | Sold as | Levels | Structure | Exam alignment | Feedback on output | Price |
|---|---|---|---|---|---|---|
| **Babbel** | subscription / lifetime | A1–B2 | A1 90+ lessons, B1 ~15 | none | pronunciation; Babbel Speak AI dialogues (beta) | €8.99–17.99/mo; €299.99 lifetime |
| **Busuu** | subscription | A1–B2 | chapters of ~5-min lessons + checkpoints | none | community; AI only in Premium Plus | ~$6–14/mo (snippet) |
| **Duolingo** | freemium | to B2 since Apr 2026 | micro-lesson units | none | AI Video Call (moving into Super) | Super $84/yr, Max $168/yr (snippet) |
| **Lingoda** | 4-week class plans | A1.1–C1 | **50 × 60-min live classes per sub-level** | none | teacher, 3–5 students | group €4.99–11.99/class |
| **Goethe DTO** | 3-month access | A1–C1 | 5–7 h/week × 3 months | none stated | new "KI-Sprechtraining" | €149 promo (snippet) |
| **Goethe DOI** | per level, 6 months | A1–C1 | 70–100 h | implicit | tutor by e-mail + 2 × 45-min live | **€729** |
| **Goethe PV Online B1** | 6-week course | B1 | 60 UE | Goethe B1 | teacher + Zoom | **€289** |
| **telc live-online prep** | Zoom course | B1 | not published | telc B1 | oral feedback + mock | not published |
| **vhs-Lernportal** | free, state-funded | A1–B1 (+B2/C1 Beruf) | 12 Lektionen × 15 units, >900 exercises per level | Integrationskurs curriculum | automatic + free online tutors | €0 |
| **DW Nicos Weg** | free | A1–B1 | 76 short video lessons per level | none | none | €0 |
| **Deutsch-Uni Online** | per course | A1–C1 | A1.1 = 6 units, 527 exercises | TestDaF courses | optional tutor | from ~€150 (snippet) |
| **Preply / italki** | tutor lessons | any | Preply "A2 course" = 13 h | tutor-dependent | human + AI summaries | from $7/lesson |
| **AI mock apps** (6) | passes / subscription | A1–B2 | mocks + drills | format-exact | AI writing ± speaking | €6.99/48 h … €119.90/yr |
| **Creators** | app / cohort / club | A1–C1 | video + app, or cohort | partial | human in cohort or club only | €49–499 |

---

## 2. Teardowns

### 2.1 Babbel — structured at A1, thin where exams begin

- **Depth.** "A1 runs to more than ninety lessons and B1 to around fifteen". The same review says it "will not
  get you through a Goethe A1 exam". Speaking is "pronunciation checking only", and writing asks for "little
  independent production … at any level"
  ([Language Librarian, upd. 31 Aug 2026](https://languagelibrarian.com/en/german/tools/babbel/)).
- **Feedback.** Live classes are "closed to individual subscribers" (same source). The AI successor is
  **Babbel Speak**, launched 16 Sep 2025 in **open beta** with German among its languages. It offers
  "expert-curated real-life scenarios" with "feedback on language skill improvement", and it claims no
  grammar scoring ([Babbel press](https://www.babbel.com/press/en-us/releases/babbel-speak)).
- **The tell.** Babbel's exam-bound product is a live course, not the app. **Babbel Integration** runs 6
  modules (A1–B1), each 6 weeks of "10 hours of group online classes" plus the app. It is "modelled on the
  BAMF integration courses" and "will prepare you for official B1 exams"
  ([learnworlds](https://babbel.learnworlds.com/)). No price is shown.
- **Price.** €17.99/mo, €8.99/mo annual, €299.99 lifetime (Language Librarian).
- **Reviews.** Trustpilot **4.4 from 33,091** ([trustpilot](https://www.trustpilot.com/review/babbel.com)).
  - Praise: "clear grammar explanations".
  - Complaints: no "opportunities to practise … with anyone"; the auto-renewal is "sneaky".
  - One reviewer asks for content split by **exam vs. conversational goals**.

### 2.2 Busuu — community correction, AI behind the top tier

- **Structure.** CEFR levels are split into chapters that close with **checkpoints**
  ([Wikipedia](https://en.wikipedia.org/wiki/Busuu)). Lessons take about 5 min
  ([testprepinsight](https://testprepinsight.com/reviews/busuu-review/)). No German lesson count was found.
- **Exam alignment.** None. The certificate is Busuu's own "End of Level test", which "isn't a scary and
  stressful test", and no third-party issuer is named
  ([busuu.com](https://www.busuu.com/en/languages/certification)). **Correction:** the "McGraw Hill"
  certificate named in the Sept-3 memo is gone.
- **Feedback.** AI Conversations, pronunciation feedback and **Mistake Repair** ("Turn your grammar slip-ups
  into personalised exercises") are "Exclusive to Premium Plus"
  ([plans](https://www.busuu.com/en/premium-plans)). Plain Premium gets community corrections.
- **Price.** Not shown by Busuu. Aggregators conflict at $5.83–13.99/mo (snippet).
- **Reviews.** Trustpilot **4.2 from 19,770** ([trustpilot](https://www.trustpilot.com/review/www.busuu.com)).
  - Praise: "It gives you the reason why".
  - Complaint: "double charged … never heard back".

### 2.3 Duolingo — B2 on paper, AI conversation moving down-tier

- **Levels.** Since **22 Apr 2026** German "teaches content through B2", mapped to Duolingo Score 100–129. The
  course makes **no exam-readiness claim**
  ([blog](https://blog.duolingo.com/courses-teach-advanced-content/)).
- **AI speaking.** "Most new Super Duolingo subscribers now have access to Video Call, and we expect to extend
  that access to existing Super subscribers later this year"
  ([Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026053299/q2fy26duolingo6-30x26share.htm)).
  **AI conversation practice is becoming a mid-tier commodity.** There is no writing assessment and there are
  no exam tasks.
- **Price.** Super $84/yr, Max $168/yr ([dealnews](https://www.dealnews.com/features/duolingo/cost/), snippet).
- **Reviews.** Trustpilot **1.6 from 8,146** ([trustpilot](https://www.trustpilot.com/review/www.duolingo.com)).
  - "no help at all with the difficult German grammar"
  - "Confusing also incorrect grammar (and an AI company)"
  - it "misinterprets half of all voice input" (all Sep 2026)
- **Lesson.** Learners punish AI-*made* content and unreliable speech recognition. I found no evidence that
  they punish AI-*graded* practice on human-designed material.

### 2.4 Lingoda — live classes by sub-level, the closest structural twin

- **Structure.** Classes are 60 min with "3–5 students". The FAQ says **"one level has 50 classes"**, and a
  level is a sub-level ([pricing](https://www.lingoda.com/en/pricing/)).
- **Formats.** The A1 page cites "60 and 150 hours" to A1 and offers three formats
  ([A1 page](https://www.lingoda.com/en/p/german-a1-beginner/)):
  - Flex: 4-week plans;
  - Sprint: 30 or 60 classes in two months, with "50% of your money back" if the rules are kept;
  - a fixed cohort.
- **Exam alignment.** "Successfully prepare for a German language exam" is only implied. There are no
  exam-format tasks.
- **Price (HTML, promo until 30 Sep).**
  - Group: 5 classes €59.99 (€11.99 each); 40 classes €202.99, list €289.99.
  - Private: 5 classes €169.99; 40 classes €584.99, list €834.99.
  - Plans renew every 4 weeks. Unused credits become inaccessible "after your last payment cycle ends".
- **Derived cost of one sub-level (50 group classes):**
  - 50 × €7.25 (list XL) = **€362**;
  - 50 × €12 (S plan) = **€600**;
  - promo ≈ **€254**.
  - **Correction:** the Sept-3 memo's €440–650 used older prices.
- **Reviews.** Trustpilot **4.3 from 5,877** ([trustpilot](https://www.trustpilot.com/review/lingoda.com)).
  - Praise: "how to actually speak".
  - Complaints: "5 credits that expired without any warning"; "If you cancel with less than three days you
    lose your credit" (Sep 2026).

### 2.5 Goethe-Institut — the brand, with thin self-study and rationed human feedback

**Prices.** The **Kurskalender 2026**
([PDF](https://www.goethe.de/resources/files/pdf354/kurskalender_2026-v3.pdf)) lists:

| Course | Format | List price |
|---|---|---|
| Deutsch Online Individual | 70–100 h | **€729** |
| Deutsch Online in der Gruppe | 40 UE / 5 weeks | €459 |
| Prüfungsvorbereitung in der Gruppe | 20 UE / 1 week, online B1–C2 | €389 |
| Prüfungsvorbereitung Online Individual B1 | 60 UE / 6 weeks | **€289** |

Exam fees in Germany (adult): A1 €155, A2 €175, B1 €259, B2 €289.

- **DOI anatomy (snippet).**
  - A1 and A2: "54 sequences … 60 open writing or speaking tasks".
  - B1.1 and B1.2: "27 sequences … 30 open tasks" each.
  - **Benchmark: about 30 human-marked productive tasks per half-level.**
- **DOI is a ZFU-registered distance course (Nr. 431506).** It offers "zwei Online-Live-Sitzungen à 45
  Minuten" and "Lernbegleitung per E-Mail" ([fernstudi.net](https://www.fernstudi.net/weiterbildung/fremdsprachen/deutsch/11835)).
  **The incumbent that sells personal feedback carries FernUSG approval.** That marks the line we must not
  cross.
- **Deutsch Training Online (DTO), no teacher.**
  - A1–C1, "in drei Monaten mit fünf bis sieben Stunden pro Woche", which is ~65–90 h (derived).
  - It now includes **"KI-Sprechtraining … realistische Dialogübungen und direktes Feedback"**.
  - €149 with the autumn code until 27 Sep 2026
    ([goethe.de](https://www.goethe.de/ins/de/de/kur/typ/dto.html), snippet).
  - **Goethe is putting AI speaking into its cheapest product.** Whether that covers exam *Teile* is unknown.
- **Free official material.** The bfu.goethe.de model sets show the rubric ("3 Punkte – Aufgabe voll erfüllt
  …") and a "0 von 15 Punkten" field, but **never score the text**
  ([A1 Schreiben](https://bfu.goethe.de/a1_sd1/schreiben.php), [B1](https://bfu.goethe.de/b1_mod/)).
- **Official app.** The **Vocabulary Trainer** covers A1–B1 and costs €9.99/mo, €19.95 for 3 months or
  €59.90/yr in-app. It is rated **3.6 from 9**
  ([App Store](https://apps.apple.com/de/app/vocabulary-trainer/id556856424?l=en-GB)). **Correction:** an
  earlier draft said Goethe had no official app.
- **Reviews.** Trustpilot **2.0 from 44** for the whole of goethe.de
  ([trustpilot](https://www.trustpilot.com/review/goethe.de)).
  - "most of the assignments are in form of a test" (Aug 2026)
  - "not complete enough to self-teach yourself German" (Aug 2026)
  - "the voice modules are slow, the UI is dated" (2025)

### 2.6 telc — official prep is a Zoom course, not an app

- **Live course.** telc sells a **live-online B1 prep course** "in small groups online via Zoom". It covers
  "strategies for solving the different types of tasks" and "a mock examination including preparation for
  the oral examination, for which you will receive individual feedback". Price and hours sit behind the
  training portal ([telc.net](https://www.telc.net/en/language-examinations/certificate-exams/german/certificate-german-telc-german-b1/live-online-examination-preparation-course-telc-deutsch-b1/)).
- **Free material.** The *Übungstest 1* is free
  ([PDF](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf)).
- **Look-alike apps.** Store apps named after telc say they are "not officially affiliated with TELC GmbH"
  ([Google Play](https://play.google.com/store/apps/details?id=com.mhamada.telcb1german), snippet).

### 2.7 vhs-Lernportal — the free public course the earlier memos missed

- **Courses.** The DVV runs it with federal funding, and "Alle Kurse … sind kostenlos"
  ([course list](https://www.vhs-lernportal.de/wws/kursangebot-lernende.php)):
  - A1, A2 and B1: **12 Lektionen, ~900 exercises each**;
  - B2 Beruf: 20 Lektionen, ~1,500 exercises;
  - C1 Beruf: 14 Lektionen.

  Instructions come in 19–20 languages, and there are offline apps.
- **Anatomy** ([Infoblatt](https://www.vhs-lernportal.de/wws/bin/4007242-4008322-1-infoblatt_a1-b1.pdf)):
  - "12 Lektionen à 15 Lerneinheiten; 3 Szenarien, 1 Film und 3 Tests pro Lektion";
  - "Jede Lerneinheit beginnt mit einem szenischen Einstieg";
  - "Mehr als 20 Übungstypen";
  - it is built on the Integrationskurs curriculum and "vom BAMF als kurstragendes Lernmanagementsystem …
    anerkannt".
- **Feedback.** "Betreuung durch Online-Tutor*innen". Snippets say tutors correct free-text tasks for
  self-learners (snippet). Turnaround is unknown.
- **Demand.** "vhs lernportal" gets **27,100 searches/mo**, which is more than "lingoda" gets (§3).
- **So what.** For German residents, the free A1–B1 benchmark is a full, BAMF-recognised, scenario-based
  course with human tutors. It does **not** score exam tasks on exam criteria, and it does not grade speech.

### 2.8 DW Nicos Weg — the free video benchmark

- **Structure.** A1–B1, 76 short lessons per level, a final test and a certificate
  ([LingoClub](https://www.lingoclub.com/nicos-weg/), snippet).
- **App.** Rated **3.9 from 131**: "Everything is free and the lessons are extremely high quality. Only
  downside … is the poor UX" ([App Store](https://apps.apple.com/us/app/-/id1224076534)).
- **Verdict.** It is "the strongest free structured foundation for A1 and A2", but has "almost no speaking or
  writing practice", and "nobody reports passing B1 on Nicos Weg alone"
  ([Language Librarian](https://languagelibrarian.com/en/german/reviews/dw-learn-german-nicos-weg/), snippet).

### 2.9 Deutsch-Uni Online (DUO) — study-oriented, tutor optional

- **Operator.** g.a.s.t. (the TestDaF body) runs it with LMU München, at A1–C1.
- **Tutor option.** Without a tutor, learners get "automatic corrections, but no personal feedback on writing
  and speaking". With a tutor, they get "personal feedback"
  ([deutsch-uni.com](https://www.deutsch-uni.com/en/learning-with-duo/)).
- **Anatomy.** *Basis-Deutsch A1.1* has **6 units of 76–101 exercises, 527 in all** (derived sum). Each unit
  lists Sprachhandlungen, Außersprachliches Wissen, Themen and Grammatik
  ([A1.1](https://www.deutsch-uni.com/de/institutionen/deutsch-fuer-alltag-und-studium-basis-deutsch-a11/)).
- **Price.** "From €150", with 4–8 personal feedbacks per course (both snippet).

### 2.10 Preply and italki — tutors, no curriculum of record

- **Preply "A2 course".** "13 hours (Estimated 7 weeks, 2 lessons/week)", "Starting at $7 per lesson",
  "Subscription based" ([preply](https://preply.com/en/courses/german/a2-german-course)).
- **AI add-on.** AI "Lesson Insights" summarise each lesson
  ([help](https://help.preply.com/en/articles/8800590-lesson-insights), snippet).
- **Exam readiness** depends on the tutor. There is no syllabus, no mock set and no scoring.

### 2.11 AI mock-exam apps — grading without teaching

All six were fetched 2026-09-27.

| App | Exams | AI grading | Teaching | Price |
|---|---|---|---|---|
| [TestGerman](https://www.testgerman.de/) | Goethe, telc, DTZ, ÖSD A1–B1 | writing + speaking; **18 feedback languages** (Arabic, Pashto, Persian, Somali, Ukrainian, Urdu …) | 2 tracks × "5 courses · 48 lessons" + 407/437 mocks; B1–B2 "coming soon" | €19.90/mo … €119.90/yr |
| [DeutschExam](https://deutschexam.ai/) | telc A1/B1/B2 (40/40/20 mocks) | writing on "Aufgabenbewältigung, Gestaltung, Richtigkeit"; speaking; handwriting OCR | drills | from €6.99 one-time |
| [Viobean](https://viobean.com/) | telc A1–B2, Goethe A1 | speaking + writing; 30 languages | explains errors | free 3 credits; $9.99–16.66/mo |
| [Papagei](https://www.getpapagei.app/) | Goethe/telc/ÖSD B1–B2 | speaking + writing; "human tutor additionally reviews your writing" (Premium) | daily exercises | €6.99/wk, €41.99/yr |
| [Goethe Trainer](https://goethetrainer.de/) | Goethe B1/B2 | writing only | no | €9.99 lifetime |
| [PrepMyFuture](https://www.prepmyfuture.com/en/products/goethe-b1) | Goethe B1 | not stated | 70 sheets, 1,800 exercises, 3 tests | €99 |

- **The mock is a commodity**, priced at €7–25.
- **No one publishes grading accuracy.** Papagei says its AI "is calibrated against official grading criteria"
  but shows no data.
- **Marketing drifts toward outcomes:**
  - Papagei: "I failed telc B2 twice … With Papagei I passed with 82%";
  - DeutschExam shows a **"Pass probability gauge"**;
  - Goethe Trainer promises a pass "zwischen 3 und 8 Wochen".
- **TestGerman's feedback languages map its buyers**, and those buyers came by migration routes. It is the
  closest thing to a course with grading. Even so, its 48 lessons per two-level track are thin next to vhs's
  12 × 15 units per level.

### 2.12 Exam-prep creators — trust from YouTube, human feedback only in paid cohorts

- **lingoni (Jenny).**
  - The app has "80 Lessons" at A1 and costs €49/3 mo, €89/yr or €229 lifetime. It gives no feedback on
    output; the FAQ tells learners to speak "with someone" ([A1](https://lingoni.com/german-a1/)).
  - The live **A2 course** has 16 lessons over 8 weeks, at most 10 students, and "up to 8 texts" corrected by
    Jenny. It costs **€499** (from €599), with no refunds ([A2](https://lingoni.com/german-a2-course/)).
- **Deutsch mit Marija.** The B1–C1 club costs **€99 one-time ("Kein Abo")**. It includes a Telegram group
  with "Korrektionen und Erklärungen von Marija"
  ([ablefy](https://myablefy.com/s/deutschmitmarija/dmm-deutsch-im-alltag-club)).
  - **Correction:** the earlier draft said €99 a month.
  - A product titled "Deutsch C1 mit Garantie" exists, but its terms were not visible.
- **SmarterGerman.** $29.90/mo for A1–C1. The *B1 Exam Preparation* has "28 focused lectures across 7
  preparation blocks" and one mock, covering "Goethe B1, telc B1, or DTZ"
  ([smartergerman](https://smartergerman.com/courses/hack-your-b1-exam/)).
- **Learn German Original.** Free exam videos plus Patreon worksheets
  ([Patreon](https://www.patreon.com/cw/LearnGerman), snippet). No graded course.

### 2.13 Market context: the state channel narrowed in 2026

- **Integrationskurs size.** The language course is six modules of 100 UE from A1 to B1
  ([BAMF](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/InhaltAblauf/inhaltablauf-node.html),
  snippet). That makes **100 UE ≈ 75 h per half-level** (derived).
- **Voluntary admissions stopped.** On 9 Feb 2026 BAMF halted voluntary admissions (§ 44 Abs. 4 AufenthG)
  for the year. About **129,500 people a year** are affected
  ([taz](https://taz.de/Bundesamt-blockiert-Zulassung/!6153153/)).
- **DTZ is closed to outsiders.** Only people inside the Integrationskurs system can sit it (`02-exams-b1.md`
  §3). Self-payers must therefore sit **Goethe, telc or ÖSD B1** (inference).

---

## 3. Demand check (Germany, 12-month average monthly searches, DataForSEO 2026-09-27)

| Brand | /mo | Exam term | /mo | Course term | /mo |
|---|---|---|---|---|---|
| babbel | 49,500 | b1 prüfung | 12,100 | deutschkurs online | 2,400 |
| **vhs lernportal** | **27,100** | telc b1 / dtz prüfung | 2,900 / 2,900 | deutschkurs online b2 | 1,000 |
| lingoda | 14,800 | telc b2 / b2 prüfung | 2,400 / 2,400 | deutsch lernen app | 880 |
| busuu | 12,100 | a1 prüfung | 1,000 | integrationskurs online | 590 |
| nicos weg / italki | 9,900 / 9,900 | goethe b1 / goethe a1 | 720 / 720 | b1 prüfung vorbereitung | 590 |
| easy german | 6,600 | telc b1 übungstest | 590 | deutschkurs online b1 | 140 |
| deutsch mit marija / lingoni | 480 / 260 | sprechen b1 prüfung | 320 | goethe institut online kurs | 170 |

- **Where demand sits.** Exam demand in Germany peaks at **B1**, where "b1 prüfung" gets 12× the searches of
  "a1 prüfung". **telc out-searches Goethe ~4×** at B1 (2,900 vs 720).
- **A falling trend.** "b1 prüfung" fell from 14,800 (Sep 2025) to 6,600 (Aug 2026), and "dtz prüfung" from
  3,600 to 1,600. Seasonality and the BAMF stop cannot be separated in this data (unverified).
- **What the data cannot show.** A1 demand from abroad (spouse visas) is invisible here.

---

## 4. What the teardown shows

1. **Teachers and graders are separate products.**
   - Courses teach but do not score exam output: Babbel, Busuu, Duolingo, Nicos Weg, vhs, Goethe DTO.
   - Mock apps score but barely teach.
   - Humans do both, but ration it:
     - Goethe DOI: ~30 marked tasks per half-level, €729 per level, ZFU-regulated;
     - lingoni: 8 texts for €499;
     - vhs: free tutors, but no exam scoring;
     - Lingoda: €254–600 per sub-level and no exam tasks.
2. **Consumer AI speaking is conversation, not exam simulation.** Babbel Speak, Busuu and Duolingo rehearse
   scenarios, and Duolingo is pushing Video Call into Super. Only the mock apps rehearse the *Teile*. Goethe
   DTO's KI-Sprechtraining is the wildcard.
3. **Depth collapses where demand peaks.**
   - Babbel has ~15 lessons at B1.
   - Nicos Weg and vhs's general courses stop at B1.
   - Goethe's B1 prep assumes B1 is "largely achieved".
   - TestGerman's B1–B2 is "coming soon".
4. **Half-levels are the professional unit.** Lingoda (50 classes), BAMF (100 UE), Goethe DOI at B1, DUO and
   Babbel Integration all structure by sub-level.
5. **Billing is the top complaint outside the teaching itself:**
   - auto-renewals (Babbel, Busuu);
   - forfeited credits (Lingoda);
   - 3-month access (Goethe DTO);
   - "no refunds" (lingoni).

---

## 5. Ten gaps a new course could own — ranked by how much a paying exam candidate cares

1. **Every productive task scored instantly on the booked exam's criteria, inside a real course.** Official
   material shows the rubric but never applies it. Courses do not grade, graders barely teach, and humans
   ration marking to 8–30 tasks.
2. **Speaking rehearsed Teil by Teil, with points.** This means Goethe B1 "gemeinsam etwas planen", the
   presentation and the follow-up questions, telc's three parts and the A1 card rounds. Speaking is the
   skill nobody can practise alone.
3. **Real depth at B1.1–B2.2.** That is where demand sits and every app thins out. It is also where our
   prices are highest (€60–65).
4. **One course, the exam you booked.** Goethe/ÖSD and telc differ in tasks and pass rules; telc B1 needs 60%
   written **and** 60% oral (see `02`). The graders each cover only a slice of these exams.
5. **Teach → test → repair.** Every graded error should lead to its rule and a drill. Busuu paywalls this, and
   Duolingo's grammar help is its top complaint.
6. **An honest readiness signal.** Build it from the learner's own scored attempts, per part and against the
   pass rule, and call it a practice score. It must not be a "pass probability" (DeutschExam) or a promise
   led by testimonials (Papagei).
7. **A dated plan to the exam date, with the hours stated.** Competitors sell time windows (3 months, 4-week
   cycles), not a route.
8. **Fair ownership.** One price, no auto-renewal, no expiring credits, and access that survives a
   rescheduled exam.
9. **Feedback explained in the learner's language.** TestGerman (18 languages) and Viobean (30) show there is
   demand. The course products translate their menus, not their feedback.
10. **Transparent AI grading.** Publish the criteria, the limits and the failure modes. No vendor does, and our
    legal framing requires the wording anyway (Implication 12).

---

## Implications for the course blueprint

1. **Every Lektion ends in an AI-scored exam-format task.** Each one is a productive task, Schreiben or
   Sprechen. Its feedback names the Teil, each criterion and the points.
   - **Floor: ≥ 40 scored productive tasks per half-level**, above Goethe DOI's ~30 human-marked (snippet).
2. **The speaking engine simulates exam interaction types:**
   - monologue;
   - planning with a partner;
   - presentation plus questions;
   - card or picture rounds.

   Each type is scored on its Teil's criteria. Free chat is a bonus, not the product; Duolingo gives it away.
3. **Exam rehearsal lives in the ".2" halves.** A1.2, A2.2, B1.2 and B2.2 end with **≥ 3 full timed mocks per
   supported format**. The ".1" halves end in a scored half-mock checkpoint.
4. **Multi-exam at the task layer.** Build one skills core per level and ask "which exam, and when?" at
   onboarding. Drills and mocks switch between Goethe/ÖSD and telc.
   - **Minimum at B1: Goethe and telc.**
   - DTZ is an optional, clearly labelled track in A2.2/B1.x: "nur für Integrationskurs-Teilnehmende".
5. **Design to ~60 h of measured learner time per half-level, and publish only what was measured.**

   | Benchmark | Time |
   |---|---|
   | BAMF | 75 h per half-level |
   | Lingoda | 50 h of class per sub-level |
   | Goethe DOI | 70–100 h per level |
   | Goethe DTO | ~65–90 h per level |
   | vhs | 180 units / >900 exercises per level |
6. **Every scored error links to its rule card and a repair drill.** This is included in the price, never an
   upsell.
7. **B-level parity.** B1.1–B2.2 get the same Lektion count, task floor and hours as A1–A2.
8. **Do not headline "mock exams".** Mocks cost €6.99–27.99, or €9.99 lifetime, and the official ones are
   free. Headline instead: "the course that scores your writing and speaking the way your exam does".
9. **Packaging.**
   - One-time payment, no auto-renewal.
   - Access for **≥ 12 months**, or until the exam date plus a buffer.
   - No credits and no expiry.
   - Any refund window is worded as voluntary, never as the statutory Widerruf.
10. **The free A1.1 must show what vhs and DW cannot.** Both are free and content-rich, and of the brands queried
    in §3 only Babbel gets more searches than vhs. A1.1 wins only through **instant scored speaking and writing from Lektion 1**.
11. **Instructions and feedback explanations in the learner's L1.** Start with English, Arabic, Turkish,
    Ukrainian, Persian and Russian (TestGerman's list is the signal), and confirm against our buyer data.
12. **Legal copy.**
    - No pass guarantee, no "passed with 82%" testimonials and no "pass probability" (UWG).
    - **No promise of personal feedback**, because Goethe DOI's ZFU-Nr. 431506 shows what tutor feedback
      triggers under FernUSG (`docs/course-research-2026-09-03.md` §4).
    - Every grading surface reads "automatische KI-Bewertung — kein Prüfungsergebnis".
    - Publish a "Wie bewertet die KI?" page.
13. **Exam-date plan.** Onboarding captures the date, the course schedules backwards from it, and it shows the
    weekly hours needed. It is a plan, never a promise.
14. **Spaced review against the official word lists, with coverage shown per list.** Goethe sells an A1–B1
    list trainer at €9.99/mo. That proves the need, and its 3.6★ rating shows it is beatable.

---

## Open questions

- **Grading accuracy.** How accurate is competitor AI grading, and ours? Should we run a blind comparison
  against certified raters before any copy mentions accuracy?
- **Goethe's AI.** Does DTO's KI-Sprechtraining rehearse exam *Teile*, or is it free dialogue? It is the
  biggest threat to gap 2.
- **vhs tutors.** What is their turnaround and scope, and is the service open to every self-learner? The
  answers decide how strong the free alternative really is.
- **Search decline.** Is the B1/DTZ search decline seasonal or structural? Re-run DataForSEO monthly.
- **ÖSD.** Are separate ÖSD mocks needed at A1, A2 and B2?
- **Access length.** Is 12 months enough, or should access run 18–24 months? This is an owner call.

## Unverified

- **Goethe (snippets):**
  - DTO's €149 price and how its KI-Sprechtraining works;
  - DOI's sequence and task counts;
  - whether B1.1 and B1.2 are each priced at €729.
- **Busuu:** prices and a German lesson count.
- **Duolingo:** prices (snippet). The Video Call roll-out itself is confirmed.
- **DUO:** prices and feedback count.
- **vhs:** tutor correction for all self-learners.
- **Other snippets:** Nicos Weg's 76 lessons; italki's rates; Preply's Lesson Insights; the BAMF 6 × 100 UE
  split; Learn German Original.
- **Not found:** the terms of Marija's "Garantie"; the price and hours of telc's live-online prep.
- **Reddit:** no sentiment was verified, and the Sept-3 memo's Reddit quotes were not reused.
