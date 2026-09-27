# 09 — Learning science: the evidence base for course design

**Date:** 2026-09-26 · **Scope:** all eight half-level courses (A1.1–B2.2), self-paced adults with an exam date · **Status:** research input for the course-v2 blueprint

## Method

- **Searches (about 60 queries):** meta-analyses and systematic reviews for every topic in the brief.
- **Verification:** each effect size was checked against the primary abstract (OpenAlex, Semantic Scholar, ERIC, Cambridge Core). Three full texts were read: Brunmair & Richter 2019, Serrano 2022 and Kizilcec et al. 2020.
- **Gaps:** Wiley, SAGE and ScienceDirect often returned 403. Figures seen only in snippets or secondary sources are marked **(unverified)**.
- **Earlier repo memo:** `docs/research/research-lesson-anatomy-2026-09-12.md` §(e) was re-checked as a source, not copied. Two of its claims are wrong (see Corrections).

**How to read the numbers**
- Cohen's benchmarks "generally underestimate the effects obtained in L2 research" (Plonsky & Oswald 2014, 346 studies and 91 meta-analyses, [abstract](https://onlinelibrary.wiley.com/doi/abs/10.1111/lang.12079)).
- Pre-post (within-group) effects run larger than treatment-vs-control (between-group) effects; only like is compared with like below.
- Lab effects shrink in classrooms (Li 2010) and shrink again at scale (Kizilcec 2020, §11).
- Almost no study used German L2 or app-only adults. Read every number as direction and rough size, not as a forecast for us.

## Findings

### 1. Retrieval practice (the testing effect)

| Source | Result |
|---|---|
| Rowland 2014, *Psych Bull* 140:1432 ([PubMed](https://pubmed.ncbi.nlm.nih.gov/25150680/), [PDF](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf)) | Testing vs restudy **g = 0.50**. Recall tests beat recognition tests. With feedback **0.73**, without **0.39**. |
| Yang, Luo, Vadillo, Yu & Shanks 2021, *Psych Bull* ([PubMed](https://pubmed.ncbi.nlm.nih.gov/33683913/)) | Classroom quizzing, 222 studies, 48,478 students: **g = 0.499**. Moderated by format congruence with the final test, feedback, frequency and intervention length. |
| Adesope, Trevisan & Sundararajan 2017, *RER* 87:659 ([ERIC](https://eric.ed.gov/?id=EJ1141817)) | Practice tests beat restudy "and all other comparison conditions". |
| Webb, Yanagisawa & Uchihara 2020, *MLJ* ([OpenAlex abstract](https://api.openalex.org/works/doi:10.1111/modl.12671)) | Flashcards, word lists, writing and fill-in-the-blanks, 22 studies. Immediate gains: 60.1 % (meaning recall) and 58.5 % (form recall). Delayed gains: **39.4 % and 25.1 %**. "Learning through word-focused tasks is far from guaranteed." |
| Nakata 2017, *SSLA* 39:653 ([Cambridge](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/does-repeated-practice-make-perfect-the-effects-of-withinsession-repeated-retrieval-on-second-language-vocabulary-learning/F14BA8A576CD2563D14CEA46E35D842E)) | 5 or 7 retrievals beat 1 or 3 on a test more than 2 weeks later. Per minute of practice, one retrieval was the most efficient. |

**Reading:** retrieval with feedback is the most robust lever available. **Form recall** (the learner produces the German word) decays fastest. Productive items therefore need more spaced retrievals than receptive ones, and those retrievals should be spread across sessions rather than stacked in one.

### 2. Spacing, lag, and expanding vs uniform schedules

- **Spaced vs massed retrieval, g = 0.74. Expanding vs uniform, g = 0.034 (n.s.).** Latimier, Peyre & Ramus 2021, *Educ Psych Rev* 33:959, 29 studies ([ERIC](https://eric.ed.gov/?id=EJ1310148)). Expanding schedules did relatively better when learners got more retrievals.
- **L2-specific: Kim & Webb 2022**, *Language Learning* 72:269, 48 experiments, N = 3,411 ([OpenAlex abstract](https://api.openalex.org/works/doi:10.1111/lang.12479)):
  - spacing has a "medium-to-large effect";
  - shorter spacing equals longer spacing on immediate tests but is **worse on delayed tests**;
  - "equal and expanding spacing were statistically equivalent";
  - moderators: learning target, number of sessions, practice type, feedback timing and retention interval.
- **Optimal gap depends on the test date.** Cepeda et al. 2008, *Psych Sci* 19:1095, N > 1,350 ([ERIC](https://eric.ed.gov/?id=ED505660), [USF](https://digitalcommons.usf.edu/psy_facpub/1766/)). The best study gap was about **20–40 % of a 1-week retention interval**, falling to **5–10 % of a 1-year interval**.
- **Grammar lags are mixed.** Serrano 2022, *SSLLT* 12:355, a narrative review of 47 studies ([PDF](https://files.eric.ed.gov/fulltext/EJ1365275.pdf)):
  - Longer lags helped **receptive** grammar knowledge in classroom studies (Bird 2010; Rogers 2015).
  - Studies of **productive** grammar found no lag difference or an advantage for **shorter** lags. Suzuki 2017 (3.3 vs 7 days): better accuracy with short lags. Suzuki & DeKeyser 2017 (1 vs 7 days): faster performance after 28 days with short lags.
  - Longer lags may be an undesirable difficulty for low-proficiency learners.
  - Oral fluency proceduralisation benefited from massed or blocked practice, but not with too many repetitions.

**Reading:** space everything. The exact shape of the schedule matters little, so a simple ladder is defensible. What does matter is that the **last intervals scale with the days left to the exam**. Grammar being proceduralised wants **short lags (1–3 days)** at first and wider ones later.

### 3. Interleaving: grammar yes, word lists no

- **Brunmair & Richter 2019**, *Psych Bull*, 59 studies, 238 effect sizes ([accepted manuscript PDF](https://www.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf)):
  - overall **g = 0.42** [0.34, 0.50]; paintings 0.67; maths 0.34;
  - **words g = −0.39** [−0.64, −0.14], k = 13, i.e. blocking was better;
  - the effect is larger when categories are similar to each other and items within a category vary;
  - significant for immediate succession of items (g = 0.73) but not for temporally spaced items (0.22);
  - the authors warn that the words result may reflect the tasks used rather than words as such.
- **Nakata & Suzuki 2019**, *MLJ* 103:629 ([ERIC](https://eric.ed.gov/?id=EJ1225042)). 115 learners practised 5 English structures. Interleaving caused the **most errors during training** but was **best at the 1-week delay**.
- **Pan et al. 2019**, *J Educ Psych* 111:1172, Spanish preterite vs imperfect ([abstract via Semantic Scholar](https://api.semanticscholar.org/graph/v1/paper/DOI:10.1037/edu0000336?fields=title,abstract,year)). In a single session there was no benefit, and interleaving during the introduction was numerically worse. Across **two weekly sessions**, interleaving was "substantially better" at 1 week.

**Reading:**
- Introduce a new form **blocked**.
- From the second encounter on, **mix it with its confusable partner**, across sessions. German pairs: Akkusativ/Dativ, Perfekt with *haben*/*sein*, *wenn*/*als*, *weil*/*denn*, Präteritum/Perfekt.
- Expect more errors during interleaved practice and say so in the UI, so a dip in scores does not read as failure.
- Vocabulary learning is not interleaved for its own sake.

### 4. Corrective feedback (CF)

- **Oral:**
  - Li 2010, 33 studies ([abstract](https://api.openalex.org/works/doi:10.1111/j.1467-9922.2010.00561.x)): "medium overall effect", maintained over time; **implicit feedback's effect was better maintained**; lab > classroom.
  - Lyster & Saito 2010, 15 classroom studies, N = 827 ([abstract](https://api.openalex.org/works/doi:10.1017/S0272263109990520)): durable effects, **prompts > recasts**, strongest on **free constructed responses**.
- **Written:**
  - Kang & Han 2015, 21 studies ([Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1111/modl.12189)): **g = 0.54**; proficiency was the strongest moderator.
  - Brown, Liu & Norouzian 2023, Bayesian, 52 studies ([SAGE](https://journals.sagepub.com/doi/abs/10.1177/13621688221147374)): "moderate effectiveness … over time"; direct, indirect and metalinguistic feedback comparable.

**Automated feedback** (the moat)

| Meta-analysis | Result |
|---|---|
| Ngo, Chen & Lai 2024, AWE, *Interactive Learning Environments* 32:727 ([T&F](https://www.tandfonline.com/doi/abs/10.1080/10494820.2022.2096642)) | **g = 0.59** between groups (24 studies). Better for **vocabulary use than grammar**. Short use shows a lower effect. |
| Lv, Ren & Xie 2021, *Asia-Pac Educ Res* ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8155179/)) | Online feedback on writing g = 0.753 (17 studies). Automated 0.696, peer 0.777, teacher 2.248. The subgroups are small. |
| Ngo, Chen & Lai 2023, ASR, *ReCALL* 36(1) ([Cambridge](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D)) | **g = 0.69**. Explicit CF **0.86** vs indirect (e.g. dictation) **0.50**. Segmental 0.82 vs suprasegmental 0.37. **Alone 0.44** vs with peers 0.89. Short duration showed no effect. Adults 1.20. |
| Wisniewski, Zierer & Hattie 2020, *Front Psych* ([summary](https://www.gbl.uzh.ch/quartz/references/Wisniewski-et-al.-(2020))) | Feedback in general **d = 0.48** (435 studies). "More effective, the more information it contains." |

**Timing:** Xu & Zeng 2023 reviewed 20 studies ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9995700/)). 50 % favoured immediate feedback, 35 % found no difference and 15 % favoured delayed. Immediate feedback generally won in text-based chat; CALL environments showed no difference. Their verdict: "no definite answer."

**Reading:**
- For discrete items, feedback should be **immediate and informative**.
- For productions, it should **prompt first** (the learner self-corrects), then give the model reformulation plus a short rule.
- ASR feedback must be **explicit about the segment**, not just a transcript.
- A solo learner is the weakest ASR setting. The AI dialogue partner has to supply the interaction a peer would.

### 5. Explicit grammar instruction and input- vs output-based practice

- **Norris & Ortega 2000**, 49 studies ([abstract](https://api.openalex.org/works/doi:10.1111/0023-8333.00136)): focused instruction yields large gains; explicit > implicit; effects durable. The authors warn that outcome measures shape the size.
- **Spada & Tomita 2010**, 41 studies ([ERIC](https://eric.ed.gov/?id=EJ883419)): explicit > implicit for both simple and complex features, including **spontaneous use**.
- **Kang, Sok & Han 2019**, *LTR*, 54 studies, N = 5,051 ([Switchboard summary](https://www.switchboardta.org/evidence/thirty-five-years-of-isla-on-form-focused-instruction-a-meta-analysis/)): form-focused instruction overall **g = 1.06**. Only a **minor** explicit/implicit difference. Moderated by outcome type, onset proficiency and intensity.
- **Shintani, Li & Ellis 2013**, *Language Learning* 63:296, 35 projects ([ERIC](https://eric.ed.gov/?id=EJ1135457)):
  - comprehension-based and production-based instruction both had **large effects on receptive and productive knowledge**;
  - comprehension-based was better for receptive knowledge within a week, but the gap closed later.

**Reading:** a short explicit rule clearly helps. Beyond that, the evidence does not support long grammar lectures. What earns the minutes is **input practice in which the form carries the meaning** (structured input), followed by production.

### 6. Comprehensible input and listening volume

- **Coverage:** van Zeeland & Schmitt 2013, *Applied Linguistics* 34:457 ([OUP](https://academic.oup.com/applij/article-abstract/34/4/457/199564)). Learners reached adequate listening comprehension at **90–95 % known words**: mean scores 7.35 at 90 % and 7.65 at 95 % coverage, against 9.62 at 100 %.
- **Incidental vocabulary gains are small** (Webb, Uchihara & Yanagisawa 2023, *Language Teaching*, 24 studies, N = 2,771, [Cambridge](https://www.cambridge.org/core/journals/language-teaching/article/how-effective-is-second-language-incidental-vocabulary-learning-a-metaanalysis/E38E3468FD2090B1FA3051051DE8E70C)). Share of target words learned, immediate/delayed: reading 17/15 %, listening 15/13 %, reading-while-listening 13/**17 %**, viewing 7/5 %. Encounters correlate with uptake at r = .34 (Uchihara et al. 2019, [Wiley](https://onlinelibrary.wiley.com/doi/abs/10.1111/lang.12343)).
- **Extensive reading:** d = 0.57 vs control, 49 studies; adults benefited most (Jeon & Day 2016, *RFL* 28(2), [ERIC](https://eric.ed.gov/?id=EJ1117026)).
- **Video:** audiovisual input within-group **g = 0.89**, with **educational videos beating entertainment** (Sutton & Webb 2026, *SSLA*, [Cambridge](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effects-of-audiovisual-input-on-second-language-learning-a-metaanalysis/9B61BAEF14F110F01148E398D171634A)). Captions have a "clear and large effect" on listening comprehension and vocabulary (Montero Perez et al. 2013, *System* 41:720, [ResearchGate record](https://www.researchgate.net/publication/259127123_Captioned_video_for_L2_listening_and_vocabulary_learning_A_meta-analysis)).
- **Listening strategy instruction:** d = 0.69, 45 studies (Dalman & Plonsky 2022, *LTR*, [abstract](https://api.openalex.org/works/doi:10.1177/13621688211072981)).

**Reading:** input is needed in **volume**, pitched at about 95 % known words, and paired with deliberate vocabulary work, because incidental uptake is around 15 % of new words. Reading-while-listening has the best delayed retention, which matters for audio with a transcript.

### 7. Output, interaction and tasks

- **Oral CF works best on free production.** Lyster & Saito 2010 (§4) found effects largest on free constructed responses. Mackey & Goo 2007 report large effects for interaction over no interaction ([Lancaster record](http://eprints.lancs.ac.uk/59863/)).
- **TBLT's headline effect is contested.** Bryfonski & McKay 2019 reported **d = 0.93** across 52 programme studies ([abstract](https://api.openalex.org/works/doi:10.1177/1362168817744389)).
  - Xuan, Cheung & Liu 2022 re-analysed it with stricter inclusion and got **g = 0.61**, noting that "only sample size and teacher-as-researcher" explained the heterogeneity ([abstract](https://api.openalex.org/works/doi:10.1177/13621688221131127)).
  - Boers & Faez 2023 concluded "the field is not ripe yet" for such a meta-analysis ([abstract](https://api.openalex.org/works/doi:10.1177/13621688231167573)).

**Reading:** the evidence supports **task-supported** teaching, with real communicative tasks plus focus on form. It does not support a pure task-based claim.

### 8. Pronunciation

- **Instruction works, on specific features.** Lee, Jang & Plonsky 2015, *Applied Linguistics* 36:345, 86 reports ([ERIC](https://eric.ed.gov/?id=EJ1067987)): **d = 0.89** within groups and **0.80** between groups. Effects were larger with longer interventions, feedback and controlled measures.
- **Global gains are unclear.** Saito & Plonsky 2019, *Language Learning* 69:652, 77 studies ([abstract](https://api.openalex.org/works/doi:10.1111/lang.12345)): most effective on **specific segmentals and suprasegmentals in monitored production**. Effects on global, human-rated comprehensibility in spontaneous speech remain unclear.
- **Perception training transfers partly to production.** Sakai & Moorman 2018, *Applied Psycholinguistics* 39:187 ([Cambridge](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/abs/can-perception-training-improve-the-production-of-second-language-phonemes-a-metaanalytic-review-of-25-years-of-perception-training-research/57401D28450902EE96659AD10AA11488)): perception d = 0.92, production **d = 0.54**.
- **Multi-talker training (HVPT) works and lasts.** Uchihara, Karas & Thomson 2025, *SSLA*, 79 studies ([Cambridge](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/high-variability-phonetic-training-hvpt-a-metaanalysis-of-l2-perceptual-training-studies/6ABB8C1F32D88D53EA8D05A4565E76F6)): g = 0.92 pre-post and **0.67** vs control; gains retained; generalisation to new stimuli weak.

**Reading:** short, feature-targeted drills with **several voices** for perception and ASR feedback for production are worth their minutes. A global "accent score" promise is not supported.

### 9. Gamification: what helps, what harms

- **Overall effect** (Sailer & Homner 2020, [abstract](https://api.openalex.org/works/doi:10.1007/s10648-019-09498-w)): cognitive **g = .49**, motivational .36, behavioural .25. Only the cognitive effect held up in rigorous studies. **Game fiction** and **competition combined with collaboration** helped behavioural outcomes.
- **Leaderboards and badges can backfire** (Hanus & Fox 2015, 16 weeks, [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000)): they **lowered intrinsic motivation, satisfaction and final-exam scores**.
- **Novelty fades, then partly recovers** (Rodrigues et al. 2022, N = 756, 14 weeks, [abstract](https://api.openalex.org/works/doi:10.1186/s41239-021-00314-6)): the effect **declined after 4 weeks** and partly recovered in weeks 6–10.
- **Broken streaks hurt, repairable ones less** (Silverman & Barasch 2023, *JCR*, seven studies, [INSEAD](https://www.insead.edu/faculty-research/publications/journal-articles/or-track-how-broken-streaks-affect-consumer)). Intact logged streaks raise later engagement relative to broken ones. The harm grows when people blame themselves and **shrinks when the streak can be "repaired"**.
- **Duolingo's own claim** (correlational, company blog): a 7-day streak makes learners "2.4 times more likely to return … the next day" ([blog](https://blog.duolingo.com/2022-language-learning-goals/)).

### 10. Lesson length and microlearning

- **Short videos hold attention.** Guo, Kim & Rubin 2014 analysed 6.9 M edX viewing sessions: "shorter videos are much more engaging" ([ACM](https://dl.acm.org/doi/10.1145/2556325.2566239)). The widely cited ~6-minute ceiling reaches us only through secondary sources ([OSCQR](https://oscqr.suny.edu/how-long-should-instructional-videos-be/)).
- **Microlearning meta-analyses are weak.** Definitions of "micro" range from 1 to 15 min and heterogeneity is high ([PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC11774797/)). There is no clean optimum to cite.
- **Time on task dominates in the best app study** (Loewen, Isbell & Sporn 2020, Babbel Spanish, 12 weeks at ~10 min/day, [abstract](https://onlinelibrary.wiley.com/doi/abs/10.1111/flan.12454), [ScienceDaily](https://www.sciencedaily.com/releases/2020/06/200609095027.htm)). Study time was the **strongest predictor** on all three measures. 59 % gained ≥ 1 ACTFL oral sub-level (69 % at ≥ 6 h, 75 % at ≥ 15 h). 54 of 85 finished, i.e. 36 % attrition.

**Reading:** the lesson length that matters is the one that gets **finished and repeated**. Spacing (§2) favours several short sessions over one long one.

### 11. Dropout predictors in self-paced online courses

- **Paying learners finish far more often.** Reich & Ruipérez-Valiente 2019, *Science*: **3.13 %** of all MIT/Harvard edX participants completed in 2017–18, but **46 %** of "verified" (paying) learners did ([Inside Higher Ed](https://www.insidehighered.com/digital-learning/article/2019/01/16/study-offers-data-show-moocs-didnt-achieve-their-goals), [DOI](https://doi.org/10.1126/science.aav7958)).
- **Many causes, early signal.** Lee & Choi 2011 found 69 dropout factors (student, course/programme, environment; [ERIC](https://eric.ed.gov/?id=EJ940001)). Two first-week features predicted MOOC dropout with 82–94 % accuracy ([Springer](https://link.springer.com/chapter/10.1007/978-3-030-22244-4_20); **unverified** beyond the abstract).
- **Planning prompts fade at scale.** In controlled studies, implementation intentions reach **d = .65** across 94 tests (Gollwitzer & Sheeran 2006, [Konstanz](https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes)). Kizilcec et al. 2020 (*PNAS*, 250,000 students, 247 courses, [PDF](https://par.nsf.gov/servlets/purl/10164956)) tested them in real courses:
  - **plan-making raised week-1 activity**, but effects "attenuated after 1 to 2 wk, and were not detectable in the final course completion rates";
  - a **social-accountability** prompt kept its effect in week 2;
  - scaling "can reduce their average effectiveness by an order-of-magnitude."
- **Do not cite Ariely & Wertenbroch 2002.** The "evenly spaced deadlines" paper was **retracted** over data anomalies ([retraction, *Psych Sci* 2026](https://journals.sagepub.com/doi/full/10.1177/09567976261488042), [Data Colada](https://datacolada.org/138)).

## Corrections to earlier repo sources

1. **Latimier, not Yang.** `docs/research/research-lesson-anatomy-2026-09-12.md` attributes "g = 0.74 spaced vs massed; expanding vs uniform g = 0.03" to Yang et al. 2021. Those figures are from **Latimier, Peyre & Ramus 2021** (§2). Yang et al. 2021 is the classroom testing meta-analysis (g = 0.499).
2. **TBLT's d = 0.93 is contested.** The re-analysis gives g = 0.61 on fewer studies (§7).

## Implications for the course blueprint

The minute counts and ratios below are **design inferences weighted by the evidence above**. No study measured this exact anatomy. Each point names the evidence it rests on.

### Unit and lesson anatomy

1. **One unit per week at standard pace, about 3 h in total.** Each unit is one situational can-do cluster: 4 core lessons (~20 min), 1 task session (~25 min), 1 cumulative checkpoint (~15 min) and daily review (5–10 min). An exam date that needs more speed adds **more sessions per week, never longer sessions** (§2, §10).

2. **Core lesson, 20 ± 3 min, in six phases.** None of the blocks runs past about 6 min (§10).

| # | Phase | Min | Content | Evidence |
|---|---|---|---|---|
| 1 | Retrieval warm-up | 3 | 6–8 due items from earlier units, recall format (typed or spoken), grammar contrasts mixed in | §1, §2, §3 |
| 2 | Input | 5 | A1: 60–120 s of audio or dialogue; B2: 2–4 min, pitched at about 95 % known words. Gist question, then detail questions, then replay with transcript (reading-while-listening). | §6 |
| 3 | Focus on form | 3 | One form–meaning point drawn from the input. Rule card of 80 words or fewer, two examples, 3–4 structured-input items where the form decides the meaning. | §5 |
| 4 | Controlled practice | 5 | 10–14 recall-first items with immediate, informative feedback and one retry. Missed items return at the end of the lesson. From the form's second lesson on, it is interleaved with its contrast partner. | §1, §3, §4 |
| 5 | Pushed output | 3–4 | One spoken or written production in the shape of an exam task. AI feedback, then **one revision**. | §4, §7 |
| 6 | Exit check | 1 | 3 recall items on today's new material; the next review date is shown | §1 |

3. **Item mix per core lesson: about 28 scored interactions.** That is 8 review, 4 structured-input, 12 controlled, 1 output and 3 exit items. Recall formats should make up at least 70 % of items, because recall beats recognition (§1).
   - **Pronunciation:** a 2-minute drill inside phase 4 in 2 of the 4 lessons. It pairs multi-voice perception items (several Azure voices, HVPT) with ASR production that gives segment-level feedback. Targets are specific features only, never a global score (§8).

4. **Skill time share per unit** (inference: input volume from §6, exam weights from the exam memos 01–03):

   | Levels | Listening | Reading | Speaking | Writing | Vocabulary/grammar practice |
   |---|---|---|---|---|---|
   | A1–A2 | 30 % | 15 % | 20 % | 10 % | 25 % |
   | B1–B2 | 25 % | 25 % | 20 % | 15 % | 15 % |

   Each unit carries at least 10 min of listening input.

5. **Task session, about 25 min.** It holds the unit's exam-shaped speaking task and writing task, graded by the existing `evaluate-writing` and speaking functions, with prompt-then-reformulate feedback and a revision pass. This is task-**supported** design, not TBLT orthodoxy (§7).

### Review cadence and the exam date

6. **Spaced-review ladder: +1 d, +3 d, +7 d, +14 d, +30 d; a lapse returns to +1 d.** A simple ladder is enough, because expanding and uniform spacing perform the same (§2). **Every interval is capped at about 15 % of the days left to the exam, never below 2 d**, following Cepeda's 5–40 % ridge.
7. **Retrievals before the exam:** at least 5 successful spaced retrievals for productive vocabulary, because form recall decays fastest; 3 for receptive-only items (§1).
8. **New grammar forms get short lags first:** lessons 1–3 days apart in the teaching week, then interleaved contrast review at the checkpoint and at about +2 and +4 weeks (§2, §3).
9. **Checkpoints are cumulative retrieval.** About 65 % of items come from the current unit and 35 % from earlier units (the ratio is a heuristic). All items are in exam format and the section scores are shown.
10. **Final three weeks before the exam.**
    - One full mock per week.
    - Review weighted by the learner's weakest error tags.
    - **No new content in the last week.**

### Feedback engine (the moat)

11. **Discrete items:** immediate feedback that shows the correct form and a one-line reason (§4).
12. **Productions:**
    - **First pass:** a prompt that makes the learner self-correct: *„Prüfen Sie die Verbposition im Nebensatz."*
    - **Second pass:** the reformulation plus a short metalinguistic note (§4).
    - **Scope:** at most 3 points per production, tied to the unit's targets (inference; the evidence does not decide this).
13. **ASR feedback names the segment** (*ü* vs *u*, vowel length, *ich*-Laut) instead of returning a bare transcript: explicit feedback g = 0.86 vs indirect 0.50. Because learners practise alone, the AI dialogue partner must supply the missing interaction (§4, §8).
14. **Claims:** say what the evidence supports, "gets better with sustained use". Short exposure showed no ASR effect and weaker AWE effects (§4). The product is framed as an automatic tool, with no exam-pass promise and no claim of human feedback, per the brief.

### Motivation and retention

15. **No public leaderboards, and no badges for activity.** Badges are for mastery milestones only (§9, Hanus & Fox).
16. **The streak is repairable by default** (freeze or "make-up session") and paired with a **weekly** goal, not only a daily one (§9, Silverman & Barasch).
17. **Plan for the week-4 novelty dip** by unlocking a new mode around weeks 4–6, such as the first mini-mock or a role-play (§9, Rodrigues).
18. **First session:** one core lesson plus one spoken output in under 20 min, then a concrete weekly plan (days and times). Treat the plan as a small boost that fades, and pair it with a lasting **accountability** channel: weekly progress mail and the existing course-reminder mailer (§11).
19. **Re-entry after 3+ days away** starts with a 5-minute review, never the full backlog, and restores the streak (§9, §11).
20. **Instrument the leading indicators:** active days in week 1, the D30 share of paying learners still active, and the delayed-recall accuracy of reviewed items. Test big anatomy choices A/B rather than trusting lab effect sizes, which shrink at scale (§11, Kizilcec).

## Open questions

1. **German-specific evidence is thin.** Almost every study covers EFL, Spanish or Japanese. Do Kasus contrasts behave like Nakata & Suzuki's structures under interleaving?
2. **FSRS or a fixed ladder?** Expanding and uniform schedules are equivalent (§2), but an adaptive model might cut review load. That needs an in-app test.
3. **Does AI writing feedback transfer to exam writing?** AWE helped vocabulary more than grammar (§4). German morphology may be the harder case for automated feedback.
4. **What replaces the peer?** Solo ASR practice shows g = 0.44 vs 0.89 with peers. Can an AI partner close that gap?
5. **What weekly time do learners with a real exam date sustain?** The 3 h/week anchor is an inference, not a measurement. Check it against `weekly_metrics` and course telemetry once the courses are live.
6. **Free A1.1 vs paid levels:** free MOOC-style completion runs at about 3 % against 46 % for paying learners (§11). How should the free entry course be designed so that it converts before users drop out?

## Unverified

- **Snippet or secondary-source figures, primary text not reached:**
  - Li 2010 "d = 0.61" (the abstract says only "medium");
  - Norris & Ortega 2000 "explicit d = 1.13 vs implicit 0.54" ([secondary](https://languageplans.com/pedagogy/why-pop-up-grammar-beats-grammar-units));
  - Adesope 2017 "g = 0.61";
  - Kim & Webb 2022 "g = 1.15 delayed";
  - Plonsky & Oswald's numeric cut-offs (between-group d .40/.70/1.00);
  - Guo 2014's "6-minute" ceiling.
- **Primary source reached, but numbers not retrievable:**
  - Goo et al. 2015 explicit/implicit values;
  - Mackey & Goo 2007 effect sizes;
  - Montero Perez 2013 numeric caption effects.
- **Not used above:**
  - Duolingo's "streak freeze cut churn 21 %" (third-party blogs only);
  - "semantic clustering of word sets causes interference" (not verified this session).
- **Design inferences, not measurements:** all minute splits, item counts, skill shares, the 15 % interval cap and the 65/35 checkpoint mix.
