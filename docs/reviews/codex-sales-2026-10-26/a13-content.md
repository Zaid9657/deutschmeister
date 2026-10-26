## 1. Score: **2/5**

DeutschMeister has a substantial learning library, but its content is not yet a convincing premium B1 sales asset. The strongest public guides explain exam tasks more accurately than parts of the paid preparation route: telc writing practice uses three Leitpunkte where the official format requires four. Mock tests provide limited format coverage, and remediation often returns learners to general library sections. The commercial opportunity is to sell demonstrated correction and purposeful rehearsal; raw content counts do not establish that value. Evidence: [writingTasks.js:16](/home/user/deutschmeister/src/data/writingTasks.js:16), [telcB1Komplett.js:176](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:176), [official telc practice test](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf).

Read-only review; no files changed. Code findings below were checked against main. Live observations are identified separately. “FACTS” refers to the supplied measured fact pack.

## 2. Findings, most important first

**1. The writing product trains an incomplete telc task.**

All three telc B1 writing-bank tasks contain three Leitpunkte. The mock explicitly checks “Alle drei Leitpunkte behandelt.” Meanwhile, the public complaint guide correctly teaches four, matching telc’s official specification. The evaluator grades coverage of the supplied bank, so this inconsistency reaches the feedback itself. Sources: [writingTasks.js:18](/home/user/deutschmeister/src/data/writingTasks.js:18), [telcB1.js:216](/home/user/deutschmeister/src/data/mockExams/telcB1.js:216), [evaluate-writing.mjs:295](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:295), [live complaint guide](https://deutsch-meister.de/leitfaden/telc-b1-brief-beschwerde/), [official test](https://shop.telc.net/media/catalog/product/file/telc_deutsch_b1_zd_uebungstest_1.pdf).

The public guide has useful depth: an original task, complete model, explanation of why it meets the criteria, and reusable expressions. The paid practice bank should meet that standard.

**Root cause:** the guide, task bank and evaluator lack a shared exam-format contract. Commercially, this threatens the central promise: customers buying exam preparation expect rehearsal of the actual task. A misleadingly reassuring correction could destroy trust faster than another hundred exercises could build it.

The app’s four-criterion, 20-point teaching rubric is explicitly its own scale. Its relationship to examiner judgement remains unverified; the assessor brief is a proposal, with the fee still unspecified. Sources: [writingTasks.js:11](/home/user/deutschmeister/src/data/writingTasks.js:11), [assessor brief:28](/home/user/deutschmeister/docs/telc-pilot/daf-assessor-brief.md:28).

**2. The diagnostic identifies broad weaknesses without supplying enough matching practice.**

Each telc form contains eight reading items, one ten-gap multiple-choice Sprachbausteine exercise, and two references to general B1.1 listening exercises. Official telc has three reading parts, two Sprachbausteine parts and three listening parts. The app honestly labels its material “Kurzversion”; that is appropriate, but insufficient evidence for comprehensive rehearsal. Sources: [telcB1Form2.js:7](/home/user/deutschmeister/src/data/mockExams/telcB1Form2.js:7), [telcB1.js:127](/home/user/deutschmeister/src/data/mockExams/telcB1.js:127), [official structure](https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/).

More damagingly, weak Sprachbausteine performance sends learners to `/grammar/b1.2/`; weak listening sends them to `/listening/b1.2`. These are broad destinations, not targeted exam sets with explanations. Source: [telcB1Komplett.js:176](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:176).

A second, unseen telc form **already exists on main**, including different listening references. The older plan’s repeated-test criticism is therefore obsolete. However, unseen items alone do not establish equivalent difficulty or valid progress measurement. Source: [telcB1Form2.js:1](/home/user/deutschmeister/src/data/mockExams/telcB1Form2.js:1).

**3. The premium over Pro has not been earned through distinctive content.**

Pro currently advertises 20 writing corrections and 30 five-minute speaking sessions monthly. The telc route schedules three letters with revisions and ten five-minute rehearsals—within those allowances. The course page itself describes the package as a plan over the Pro library. Sources: [marketing.js:53](/home/user/deutschmeister/src/data/marketing.js:53), [telcB1Komplett.js:65](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:65), [live offer FAQ](https://deutsch-meister.de/telc-b1-komplettvorbereitung/).

Three months of €9.99 Pro cost €29.97. Against that, the displayed €89 package carries a €59.03 premium; the approved €149 pilot would carry €119.03. These are comparisons, not proposed prices. Current prices come from [pricing.js:24](/home/user/deutschmeister/src/data/pricing.js:24); the pilot decision is in [the plan:136](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:136).

Public grammar is not proven cannibalisation. The monetisation problem is that the additional outcome delivered by the package remains unproven. Official telc already supplies a complete free practice test and audio, further weakening “more material” as the reason to pay. [Official downloads](https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/).

**4. The acquisition assets demonstrate knowledge, but the next step often loses exam intent.**

There are 18 registered guides: eight general guides and ten task-focused additions—four telc, four DTZ and two English Goethe guides. The task pages have matching offer or campaign-labelled signup doors. The main telc guide still leads with the general placement test. Sources: [guide registry:96](/home/user/deutschmeister/astro-site/src/data/guides/index.js:96), [live telc guide](https://deutsch-meister.de/leitfaden/telc-b1/).

The placement test asks 40 written questions plus listening and speaking, with an estimated 15–20-minute commitment. That suits uncertain-level learners; its relevance is weaker for someone seeking feedback on tomorrow’s practice letter. Source: [LevelTestLanding.jsx:19](/home/user/deutschmeister/src/components/LevelTest/LevelTestLanding.jsx:19).

Brief-Korrektur is the stronger conversion hypothesis because it reveals an individual problem and demonstrates the paid mechanism. This is unverified commercially: only four people submitted writing in 60 days. X-Ray’s anonymous spikes are also unverified as human demand. FACTS:19,22.

I disagree with the existing evaluation’s statement that `firstRun` ignores exam choice: main already selects an accessible writing task or mock. I also disagree with treating reach as the only binding constraint; the writing-format defect is independently material. Sources: [evaluation:43](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:43), [firstRun.js:107](/home/user/deutschmeister/src/lib/firstRun.js:107).

**5. Inventory breadth conceals uneven readiness.**

| Asset | Verified repository inventory |
|---|---|
| Grammar | 84 topics, 672 rules, 933 examples, 1,614 exercises. [marketing.js:118](/home/user/deutschmeister/src/data/marketing.js:118) |
| Reading | 74 lessons; B1.1 and B1.2 have eight each. [marketing.js:161](/home/user/deutschmeister/src/data/marketing.js:161) |
| Listening | 48 exercises, 480 dialogue lines; 24 podcast episodes, with transcripts documented as empty. [marketing.js:121](/home/user/deutschmeister/src/data/marketing.js:121) |
| Vocabulary | 2,561 words and 945 example sentences. [marketing.js:139](/home/user/deutschmeister/src/data/marketing.js:139) |
| Speaking | 68 missions, summing the eight level snapshots; ten additional scheduled telc rehearsals. [courseContents.js:31](/home/user/deutschmeister/src/data/courseContents.js:31), [telcB1Komplett.js:110](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:110) |
| Exams and guides | Six exam-track short mocks, additional telc form, four A1–A2 course final tests, 18 guides. [mock registry:17](/home/user/deutschmeister/src/data/mockExams/index.js:17), [course registry:17](/home/user/deutschmeister/src/data/courses/index.js:17), [guide registry:105](/home/user/deutschmeister/astro-site/src/data/guides/index.js:105) |
| Sentence X-Ray | Dynamic analysis: advertised allowances are one/day anonymous, ten/day during trial, fifty/day Pro. [marketing.js:41](/home/user/deutschmeister/src/data/marketing.js:41) |

These are documented snapshots, largely August–September counts, **not a fresh database recount**. FACTS:27 confirms the headline counts are displayed live.

Only A1.1 and A1.2 have rebuilt situational curricula. B1/B2 tickets remain coming soon; their content snapshots have no guided plan or final test. Goethe B1 and DTZ have no dedicated writing bank. Sources: [curricula:16](/home/user/deutschmeister/src/data/curricula/index.js:16), [courseContents.js:56](/home/user/deutschmeister/src/data/courseContents.js:56), [examTracks.js:68](/home/user/deutschmeister/src/data/examTracks.js:68).

## 3. Sub-scores

- **(a) Inventory: 4/5.** Substantial, documented coverage; freshness varies. `marketing.js:118–170`.
- **(b) Exam depth: 2/5.** Three-point writing tasks and incomplete task-type coverage. `writingTasks.js:18`; `telcB1.js:127`.
- **(c) Free/paid boundary: 2/5.** Public grammar is explicit; exercise locks are UX only, and package value overlaps Pro. `CLAUDE.md:46`; `offers.js:124`.
- **(d) Search assets: 3/5.** Eighteen crawlable guides, including ten task pages; ranking potential remains unverified. `guides/index.js:105`; FACTS:31.
- **(e) Lead magnets: 2/5.** Useful tools exist, but little demonstrated writing adoption and no measured content-to-sale conversion. FACTS:19–22.
- **(f) B1 selling gaps: 1/5.** Missing targeted remediation, unfinished level courses, and absent Goethe/DTZ writing banks. `telcB1Komplett.js:176`; `examTracks.js:68`.

## 4. Recommendations ranked by expected revenue per hour

**Recommended boundary [owner]:** keep public grammar explanations, complete guide examples, A1.1, placement and the existing free X-Ray allowance. Add a short exam diagnostic as the exam-specific sampling layer. Preserve existing Pro entitlements. Sell the telc package through assigned rehearsal, targeted remediation, revision and unseen reassessment. Any new exclusive access, anonymous allowance or endpoint requires owner approval. Current grammar exercises are delivered to the browser; stronger exclusivity would require an actual access-design change. Sources: [CLAUDE.md:46](/home/user/deutschmeister/CLAUDE.md:46), [grammar page:566](/home/user/deutschmeister/astro-site/src/pages/grammar/[level]/[slug].astro:566).

**Sizing assumptions:** per 300 qualified offer views after release, one additional retained pilot purchase contributes approximately €113 using the plan’s €149 ÷ 1.19 × 90% model. The sales effects below are unverified planning assumptions, overlap, and must not be added together. Hours exclude assessor fees. [Plan:66](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:66).

1. **Four-point complaint letter → correction → revision demonstration.**  
   Fix all three telc prompts and both mock checklists; publish one clearly labelled synthetic correction example beside the offer. Locations: `src/data/writingTasks.js:16`, its function twin, `mockExams/telcB1*.js`, and the telc sales page. **8 hours; assumed +2 purchases, €226, €28/hour.** **[agents]** content corrections; **[owner]** public proof and assessor funding. **Measure:** blind-rate 20 letters; block expansion if more than two differ by over one agreed band. Correct task format remains mandatory regardless of conversion.

2. **Short telc diagnostic with an immediate next task.**  
   Create an approximately eight-minute original sample under `src/data/mockExams/`; connect `/leitfaden/modelltest-deutsch-b1/` and the main telc guide to it. Return a specific practice recommendation before requesting signup. **12 hours; assumed +2 purchases, €226, €19/hour. [owner]** for changed access; agents prepare implementation. **Measure:** target the approved ≥35% first-exam-task completion rate; fewer than three sales after 300 qualified offer views triggers one package revision. [Plan:179](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:179).

3. **Speaking kit with actual input cards.**  
   Extend `telcB1Komplett.js:130–159` and the existing speaking guides with paired Teil-2 opinion inputs, summary instructions and interaction checks. Current prompts largely request personal opinions; the guide describes differing input sheets. **10 hours; assumed +1 purchase, €113, €11/hour. [agents]**. Label five-minute sessions as partial rehearsals. **Measure:** stop adding scenarios until three of the first five pilot users complete the kit; repair unclear instructions first. Format evidence: [speaking guide:58](/home/user/deutschmeister/astro-site/src/data/guides/telc-b1-sprechen-ueber-ein-thema.js:58).

4. **Sprachbausteine Teil 2 practice with explained distractors.**  
   Add three original shared-word-bank sets and a public worked example; replace the grammar-index destination at `telcB1Komplett.js:178`. **16 hours; assumed +1 purchase, €113, €7/hour. [agents]** content and runner work. **Measure:** independent review finds no ambiguous keys; stop expansion until three pilot users finish a set and an unseen follow-up.

5. **Three-part telc listening rehearsal.**  
   Add original audio, transcripts, distractor explanations and exam-specific playback instructions; replace generic references in `mockExams/telcB1*.js` and the destination at `telcB1Komplett.js:179`. **24 hours; assumed +1 purchase, €113, €5/hour. [agents]** implementation; **[owner]** audio expenditure. **Measure:** verify format and playback before release; defer further recording until three pilot users complete the first sequence.

These are the five content pieces with highest sales leverage in my judgement. **[agents]** repair existing delivery first; keep B1/B2 ticket rebuilding parked. **[owner]** retain the release gate and assessor requirement. Sources: [plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128), [kill list:275](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:275).

## 5. What remains unverified

- **Ranking and commercial search demand:** inspect Search Console by guide/query, separating branded traffic. Five absent top-ten results establish neither zero rankings nor demand volume. FACTS:31.
- **Learning efficacy:** independently review task fidelity, blind-grade letters, test unseen transfer and collect actual exam outcomes.
- **Content-to-payment conversion:** reconcile qualified views, task completion, checkout, payment and refunds before starting kill clocks. Use existing consent rules; instrumentation changes are **[owner]**. `CLAUDE.md:52`; `PROTOCOL.md:28`.
- **Live paid experience and current database inventory:** perform an authorised entitled-account walkthrough and read-only table recount.
- **Capture coverage:** `capture/INDEX.md` was absent and `capture/shots/` empty during inspection. I opened both PNGs in adjacent `scratchpad/shots/` and supplemented the available captures with fresh Firecrawl reads. Competitor screenshot comparisons remain unverified.

