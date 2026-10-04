# 09 — Learning science: the evidence base for course design

**Date:** 2026-09-26 · **Scope:** all eight half-level courses (A1.1–B2.2), self-paced adults with an exam date · **Status:** research input for the course-v2 blueprint

## Method

- **Two passes.** A first pass ran about 60 web searches for meta-analyses and systematic reviews on each topic in the brief, and read three full texts (Brunmair & Richter 2019, Serrano 2022, Kizilcec et al. 2020). A verification pass ran about 25 more searches.
- **Sources re-read.** More than 35 abstracts were re-read through their DOI records (OpenAlex, Crossref), ERIC and Cambridge Core, plus the full text of Rey et al. 2019.
- **Blocked or throttled.** Wiley, SAGE, ScienceDirect and ResearchGate returned 403. The OpenAlex and Semantic Scholar search endpoints were rate-limited, but DOI lookups worked.
- **Snippet-only figures** are marked **(unverified)**.
- **Earlier repo memo.** `docs/research/research-lesson-anatomy-2026-09-12.md` §(e) was treated as a source to check. Three of its citations are wrong (see Corrections).

**How to read the numbers**
- **Benchmarks.** Cohen's benchmarks "generally underestimate the effects obtained in L2 research" (Plonsky & Oswald 2014, [DOI](https://doi.org/10.1111/lang.12079)).
- **Pre-post vs between-group.** Pre-post effects run larger than between-group effects, and only like is compared with like here. For example, Sutton & Webb (§7) call a pre-post g = 0.89 "small".
- **Shrinkage.** Lab effects shrink in classrooms (Li 2010) and shrink again at scale (Kizilcec 2020, §12).
- **Transfer to us.** Almost no study used German L2 or app-only adults. Treat every number as a direction and a rough size, not a forecast.

## Findings

### 1. Retrieval practice, and what practice tests do

| Source | Result |
|---|---|
| Rowland 2014, *Psych Bull* ([DOI](https://doi.org/10.1037/a0037559), [PDF](https://courseware.epfl.ch/assets/courseware/v1/fdde2f0aa590bf3b1324077a6bf1540c/asset-v1%3AEPFL%2BDEMO%2B2020%2Btype%40asset%2Bblock/Rowland2014-meta-analysis.pdf)) | Testing vs restudy **g = 0.50**. Recall tests beat recognition tests. With feedback 0.73, without 0.39. |
| Yang et al. 2021, *Psych Bull* 147:399 ([DOI](https://doi.org/10.1037/bul0000309)) | Classroom quizzing, 222 studies, 48,478 students: **g = 0.499**. Moderated by format consistency, corrective feedback and the number of repetitions. |
| Webb, Yanagisawa & Uchihara 2020, *MLJ* ([DOI](https://doi.org/10.1111/modl.12671)) | Word-focused activities, 22 studies. Immediate gains 60.1 % (meaning recall) and 58.5 % (form recall). Delayed gains **39.4 % and 25.1 %**. |
| Nakata 2017, *SSLA* ([Cambridge](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/does-repeated-practice-make-perfect-the-effects-of-withinsession-repeated-retrieval-on-second-language-vocabulary-learning/F14BA8A576CD2563D14CEA46E35D842E)) | 5–7 retrievals beat 1–3 at more than 2 weeks. |
| Kulik, Kulik & Bangert 1984, 40 studies ([DOI](https://doi.org/10.3102/00028312021002435)) | Practice tests raise scores. Gains are larger when the practice form is **identical** to the test, and they grow with the number of practice tests. |
| Hausknecht et al. 2007, N = 134,436 ([DOI](https://doi.org/10.1037/0021-9010.92.2.373)) | Retest effect **d = .26**, larger with coaching and identical forms. |

**Reading:**
- Retrieval with feedback is the most robust lever available.
- Form recall (producing the German word) decays fastest, so productive items need more spaced retrievals than receptive ones.
- Part of any mock-score gain is familiarity with the form. Mocks must therefore be parallel forms, and a mock score is not a forecast.

### 2. Spacing, lag, schedule shape and intensity

- **Spacing works; schedule shape does not matter.** Latimier, Peyre & Ramus 2021 ([DOI](https://doi.org/10.1007/s10648-020-09572-8)): spaced vs massed retrieval **g = 0.74**; expanding vs uniform **g = 0.034** (n.s.).
- **L2-specific: Kim & Webb 2022**, 48 experiments, N = 3,411 ([DOI](https://doi.org/10.1111/lang.12479)):
  - spacing has a "medium-to-large effect";
  - shorter spacing equals longer spacing on immediate tests but is **worse on delayed tests**;
  - "equal and expanding spacing were statistically equivalent".
- **The best gap scales with the test date.** Cepeda et al. 2008 ([ERIC](https://eric.ed.gov/?id=ED505660)): the optimal gap is about **20–40 % of a 1-week retention interval**, falling to **5–10 % of a 1-year interval**.
- **Grammar lags differ by knowledge type.** Serrano 2022, 47 studies ([PDF](https://files.eric.ed.gov/fulltext/EJ1365275.pdf)): longer lags helped **receptive** grammar. **Productive** grammar showed no difference, or favoured **shorter** lags (Suzuki 2017; Suzuki & DeKeyser 2017).
- **Intensity is not the enemy.** Serrano 2011, N = 152 ([DOI](https://doi.org/10.1111/j.1467-9922.2010.00591.x)): intermediate learners gained more in **intensive** programmes than in regular ones.
- **Adaptive scheduling (vendor evidence).** Duolingo's half-life regression model raised "daily student engagement by 12 %" in an operational study (Settles & Meeder 2016, [ACL](https://aclanthology.org/P16-1174/)). The authors are company staff, and they measured engagement, not learning.

**Reading:**
- Space everything. A simple ladder is fine.
- The **final intervals must scale with the days left to the exam**.
- New productive grammar gets short lags (1–3 days) first.
- A learner with a near exam date can safely study more days per week.

### 3. Interleaving, and how to group vocabulary

- **Brunmair & Richter 2019**, 59 studies ([DOI](https://doi.org/10.1037/bul0000209)):
  - overall **g = 0.42**, but for **words g = −0.39**, so blocking was better there;
  - interleaving helps more when categories resemble each other;
  - the authors advise caution "for expository texts and words".
- **Nakata & Suzuki 2019**, *MLJ* ([ERIC](https://eric.ed.gov/?id=EJ1225042)): interleaving five English structures caused the most training errors but was **best at 1 week**.
- **Pan et al. 2019** ([abstract](https://api.semanticscholar.org/graph/v1/paper/DOI:10.1037/edu0000336?fields=title,abstract,year)), Spanish preterite vs imperfect: no benefit within one session; "substantially better" when spread over **two weekly sessions**.
- **Semantic clustering: slower to learn, same retention.** Li, Uchihara, Nakata & Murphy 2026, 27 studies ([DOI](https://doi.org/10.1016/j.system.2026.104141)):
  - thematic word sets needed more trials to criterion (**g = 1.02**);
  - posttest retention was unaffected (**g = 0.01**);
  - **presenting words in context** made clustering beneficial.

**Reading:**
- **New grammar form:** introduce it **blocked**, then **interleave it with its confusable partner across sessions**. German pairs: Akkusativ/Dativ, Perfekt with *haben*/*sein*, *wenn*/*als*, *weil*/*denn*.
- **Vocabulary:** situational word sets are fine when they are introduced in context.
- **Confusion errors:** expect them (*Montag/Mittwoch*) and do not score them as failure.

### 4. Corrective feedback: oral, written, explicit or implicit, timing

- **Oral:**
  - **Li 2010**, 33 studies ([DOI](https://doi.org/10.1111/j.1467-9922.2010.00561.x)): a "medium overall effect", maintained over time. **Implicit feedback's effect was better maintained** than explicit feedback's. Lab studies showed larger effects than classroom studies.
  - **Lyster & Saito 2010**, 15 classroom studies ([DOI](https://doi.org/10.1017/S0272263109990520)): durable effects. **Prompts beat recasts.** Effects were clearest on **free constructed responses**.
- **Written:**
  - **Kang & Han 2015**, 21 studies ([DOI](https://doi.org/10.1111/modl.12189)): feedback improves accuracy, mediated by proficiency, setting and genre. The quoted g = 0.54 is **unverified**.
  - **Brown, Liu & Norouzian 2023**, 52 studies ([SAGE](https://journals.sagepub.com/doi/abs/10.1177/13621688221147374)): "moderate effectiveness … over time". Direct, indirect and metalinguistic feedback performed comparably.
- **Feedback in general:** d = 0.48, and "more effective, the more information it contains" (Wisniewski et al. 2020, [summary](https://www.gbl.uzh.ch/quartz/references/Wisniewski-et-al.-(2020))).
- **Timing** (Xu & Zeng 2023, [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9995700/)): across 20 studies, 50 % favoured immediate feedback, 35 % found no difference and 15 % favoured delayed. The authors conclude there is "no definite answer".

**Reading:**
- **Discrete items:** immediate, informative feedback.
- **Productions:** **prompt first** so the learner self-corrects, then give the reformulation and a short rule.

### 5. Automated feedback and AI conversation partners (the moat)

| Source | Result |
|---|---|
| Ngo, Chen & Lai 2024, AWE ([T&F](https://www.tandfonline.com/doi/abs/10.1080/10494820.2022.2096642)) | Between-group **g = 0.59** (24 studies). Stronger for vocabulary than for grammar. **(Unverified**: abstract seen via search.) |
| Ngo, Chen & Lai 2023, ASR, *ReCALL* ([Cambridge](https://www.cambridge.org/core/journals/recall/article/effectiveness-of-automatic-speech-recognition-in-eslefl-pronunciation-a-metaanalysis/A915444CF252B61D14961D2FE733822D)) | **g = 0.69** overall. Explicit feedback **0.86**, indirect 0.50. Segmental 0.82, suprasegmental 0.37. **Alone 0.44**, with peers 0.89. **1–4 weeks 0.07**, 5–8 weeks 1.01. Adults 1.20. |
| Zhang et al. 2023, chatbots, 18 studies ([ERIC](https://eric.ed.gov/?id=EJ1400794)) | **g = 0.527**. Moderators include instruction duration and interface. |
| Lyu, Lai & Guo 2024, chatbots, 31 studies ([DOI](https://doi.org/10.1111/ijal.12668)) | **g = 0.608**. Moderated by mobile access, modality and generative AI. |
| Fan et al. 2024, randomised, N = 117 ([arXiv](https://arxiv.org/abs/2412.09315)) | ChatGPT support gave the largest **essay-score** gain, but **knowledge gain and transfer did not differ** ("metacognitive laziness"). |

**Reading:**
- Automated feedback lands in the medium range and needs **weeks**, not days.
- **Solo practice is the weakest setting.** An AI dialogue partner is the evidence-backed substitute for a peer.
- **The AI must not do the learner's revision.** A better text is not better learning.

### 6. Explicit grammar instruction; input- vs output-based practice

- **Explicit beats implicit, durably.**
  - Norris & Ortega 2000, 49 studies ([DOI](https://doi.org/10.1111/0023-8333.00136)): "large target-oriented gains"; explicit > implicit; the effects are durable.
  - Spada & Tomita 2010 ([ERIC](https://eric.ed.gov/?id=EJ883419)): explicit > implicit, including for **spontaneous use**.
  - Goo et al. 2015, 34 studies ([DOI](https://doi.org/10.1075/sibil.48.18goo)): explicit > implicit.
- **The gap is small once form-focused instruction is pooled.** Kang, Sok & Han 2019, 54 studies ([summary](https://www.switchboardta.org/evidence/thirty-five-years-of-isla-on-form-focused-instruction-a-meta-analysis/)): **g = 1.06**, with only a minor explicit/implicit difference.
- **Input and output practice both work.** Shintani, Li & Ellis 2013 ([DOI](https://doi.org/10.1111/lang.12001)): comprehension-based and production-based instruction **both** had large effects on receptive and productive knowledge.

**Reading:** a short explicit rule earns its place, and long lectures do not. The minutes go to **structured input** (the form carries the meaning), then to production.

### 7. Comprehensible input and listening volume

- **Coverage:** adequate listening comprehension at **90–95 % known words** (van Zeeland & Schmitt 2013, [OUP](https://academic.oup.com/applij/article-abstract/34/4/457/199564)).
- **Incidental uptake is small** (Webb, Uchihara & Yanagisawa 2023, 24 studies, [DOI](https://doi.org/10.1017/s0261444822000507)). Share of words learned, immediate/delayed: listening 15/13 %, reading 17/15 %, reading-while-listening 13/**17 %**, viewing 7/5 %. Repetition correlates with uptake at r = .34 (Uchihara et al. 2019, [DOI](https://doi.org/10.1111/lang.12343)).
- **Video:** pre-post g = 0.89, with **educational videos beating entertainment** (Sutton & Webb 2026, [DOI](https://doi.org/10.1017/s0272263126101612)). Extensive reading: d = 0.57 (Jeon & Day 2016, [ERIC](https://eric.ed.gov/?id=EJ1117026)).
- **What predicts L2 listening:**
  - vocabulary and grammar knowledge correlate *strongly*, working memory weakly (Karalık & Merç 2019, [DOI](https://doi.org/10.32601/ejal.651387));
  - **anxiety correlates strongly** (same source);
  - strategy instruction: d = 0.69 (Dalman & Plonsky 2022, [SAGE](https://journals.sagepub.com/doi/abs/10.1177/13621688211072981)).

**Reading:**
- Input is needed in **volume**, at about 95 % known words, alongside deliberate vocabulary work.
- Show the **transcript after a first unaided listen**.
- Keep listening low-stakes.

### 8. Output: tasks, task repetition, planning

- **Interaction and free production.** Interaction has large effects (Mackey & Goo 2007, [record](http://eprints.lancs.ac.uk/59863/)), and oral corrective feedback works best on free production (§4).
- **Task repetition, written: two meta-analyses, different sizes.**
  - **Abdi Tabari, Zhuang & Farahanynia 2025**, 31 studies ([DOI](https://doi.org/10.1016/j.jslw.2025.101255)): accuracy **d = 1.19**, lexis 0.75, fluency 0.50, syntax 0.37. More repetitions gave larger effects and longer spacing smaller ones. Adding feedback lifted accuracy.
  - **Liu & Tang 2025**, 17 studies ([DOI](https://doi.org/10.1177/13621688251381268)): **g = 0.25** overall. The **one-week interval** worked best, and "one repetition is sufficient".
  - The size gap probably reflects pre-post vs between-group designs (**unverified**).
- **Planning.** Johnson & Abdi Tabari 2022 ([DOI](https://doi.org/10.1093/applin/amac026)) find "clear effects of planning on L2 oral production". The effect sizes were not reached.
- **TBLT is contested.** Bryfonski & McKay's d = 0.93 ([DOI](https://doi.org/10.1177/1362168817744389)) shrinks to **g = 0.61** in a stricter re-analysis ([DOI](https://doi.org/10.1177/13621688221131127)).

**Reading:** use task-**supported** teaching: plan, perform, get feedback, redo.

### 9. Pronunciation

- **Instruction works on specific features.** d = 0.80 between groups, larger with feedback and longer interventions (Lee, Jang & Plonsky 2015, [ERIC](https://eric.ed.gov/?id=EJ1067987)).
- **Gains are clearest in monitored production.** Instruction is most effective on specific features there; gains in global comprehensibility during spontaneous speech "remain relatively unclear" (Saito & Plonsky 2019, [DOI](https://doi.org/10.1111/lang.12345)).
- **Perception training partly transfers to production.** Perception d = 0.92, production **0.54** (Sakai & Moorman 2018, [Cambridge](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/abs/can-perception-training-improve-the-production-of-second-language-phonemes-a-metaanalytic-review-of-25-years-of-perception-training-research/57401D28450902EE96659AD10AA11488)).
- **Multi-talker perception training works.** HVPT: **g = 0.67 vs control** across 79 studies. Gains are retained, and the number of talkers is a moderator (Uchihara, Karas & Thomson 2025, [DOI](https://doi.org/10.1017/s0272263125100879)).

### 10. Gamification: what helps, what harms

- **Overall effects** (Sailer & Homner 2020, [DOI](https://doi.org/10.1007/s10648-019-09498-w)): cognitive **g = .49**, motivational .36, behavioural .25. Only the cognitive effect is stable in rigorous studies. **Game fiction** and **competition combined with collaboration** helped.
- **Learner reactions** (Bai, Hew & Huang 2020, [DOI](https://doi.org/10.1016/j.edurev.2020.100322)): learners like feedback, recognition and goal-setting. They dislike features with no added utility, and features that cause **anxiety or jealousy**.
- **Leaderboards and badges can backfire.** Over 16 weeks they **lowered intrinsic motivation, satisfaction and final-exam scores** (Hanus & Fox 2015, [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0360131514002000)).
- **Novelty fades, then partly recovers.** The effect dropped **after 4 weeks** and recovered between weeks 6 and 10 (Rodrigues et al. 2022, [DOI](https://doi.org/10.1186/s41239-021-00314-6)).
- **Broken streaks hurt less when repairable** (Silverman & Barasch 2023, [INSEAD](https://www.insead.edu/faculty-research/publications/journal-articles/or-track-how-broken-streaks-affect-consumer)).

### 11. Lesson length, segmenting, microlearning

- **Shorter videos are "much more engaging"** (Guo, Kim & Rubin 2014, 6.9 M edX sessions, [ACM](https://dl.acm.org/doi/10.1145/2556325.2566239)).
- **Segmenting helps.** Rey et al. 2019, 56 investigations ([DOI](https://doi.org/10.1007/s10648-018-9456-4)): segmented instruction raised retention (**d = 0.32**) and transfer (**d = 0.36**) and reduced cognitive load (d = 0.23).
- **Microlearning reviews are weak.** Definitions of "micro" run from 1 to 15 min, and there is no clean optimum ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11774797/)).
- **Time on task decides.** In a 12-week Babbel study at about 10 min/day, study time was "the strongest predictor for all three measures" (Loewen, Isbell & Sporn 2020, [DOI](https://doi.org/10.1111/flan.12454)).

### 12. Dropout and persistence in self-paced online courses

- **Paying learners finish far more often.** On MIT/Harvard edX in 2017–18, **3.13 %** of all participants completed, against **46 %** of paying "verified" learners (Reich & Ruipérez-Valiente 2019, [DOI](https://doi.org/10.1126/science.aav7958), [report](https://www.insidehighered.com/digital-learning/article/2019/01/16/study-offers-data-show-moocs-didnt-achieve-their-goals)).
- **Self-regulation predicts achievement.** **Time management, metacognition and effort regulation** correlate with online achievement; rehearsal and elaboration have the least support (Broadbent & Poon 2015, [DOI](https://doi.org/10.1016/j.iheduc.2015.04.007)).
- **Progress monitoring works best when recorded and shared.** Harkin et al. 2016, 138 randomised studies, N = 19,951 ([DOI](https://doi.org/10.1037/bul0000025)):
  - monitoring progress raised goal attainment, **d = 0.40**;
  - the effect was larger when progress was **physically recorded** and **reported to others**.
- **Planning prompts fade at scale.** Implementation intentions reach d = .65 in controlled studies (Gollwitzer & Sheeran 2006, [Konstanz](https://www.socmot.uni-konstanz.de/publications/implementation-intentions-and-goal-achievement-meta-analysis-effects-and-processes)). Kizilcec et al. 2020 tested such interventions with 250,000 students ([DOI](https://doi.org/10.1073/pnas.1921417117)):
  - self-regulation interventions raised engagement "in the first few weeks but not final completion rates";
  - scaling cuts their effect "by an order-of-magnitude".
- **Do not cite Ariely & Wertenbroch 2002** (evenly spaced deadlines). It was retracted on 2026-09-03 over data tampering ([Retraction Watch](https://retractionwatch.com/2026/09/03/procrastination-study-duke-dan-ariely-psychological-science-data-colada-tampering-retraction/)).

## Corrections to earlier repo sources

These are in `docs/research/research-lesson-anatomy-2026-09-12.md` §(e):

1. **Wrong attribution and DOI for the spacing figures.** "g = 0.74 spaced vs massed; expanding vs uniform 0.03" is from **Latimier et al. 2021**, not Yang et al. The DOI cited for Yang (`10.1037/bul0000310`) resolves to an autism face-recognition meta-analysis. Yang et al. is `10.1037/bul0000309`.
2. **Wrong DOI for Li 2010.** The DOI cited (`10.1111/j.1467-9922.2009.00554.x`) is an ERP study by Morgan-Short et al. Li 2010 is `10.1111/j.1467-9922.2010.00561.x`. Neither its "d = 0.61" nor Adesope's "g = 0.61" appears in the abstracts.
3. **TBLT's "d = 0.93" is contested** (§8).

## Implications for the course blueprint

The minutes, counts and ratios below are **design inferences weighted by the evidence**. No study tested this exact anatomy.

### A. Unit and lesson anatomy

1. **One unit = one situational can-do cluster = one week at standard pace, about 3 h.** A unit holds four core lessons of about 20 min, one task session of about 25 min, one cumulative checkpoint of about 15 min, and a daily review of 5–10 min. A near exam date adds **more sessions per week, never longer sessions** (§2, §11).

2. **Core lesson, 20 ± 3 min, in six learner-paced segments.** Each segment is 6 min or less and ends with a "Weiter" step; nothing auto-advances (§11 Rey).

   | # | Phase | Min | Content | Evidence |
   |---|---|---|---|---|
   | 1 | Retrieval warm-up | 3 | 6–8 due items from earlier units in recall format (typed or spoken), with grammar contrast pairs mixed in | §1–3 |
   | 2 | Input | 5 | A1: 60–120 s of dialogue audio; B2: 2–4 min, at about 95 % known words. Gist question, then detail questions, then replay **with transcript**. New words appear here, in context. | §3, §7 |
   | 3 | Focus on form | 3 | Rule card of 80 words or fewer, 2 examples, 3–4 structured-input items where the form decides the meaning | §6 |
   | 4 | Controlled practice | 5 | 10–14 recall-first items with immediate feedback and one retry. Misses return at the end. From the form's second lesson on, items are interleaved with its contrast partner. | §1, §3, §4 |
   | 5 | Pushed output | 3–4 | One exam-shaped spoken or written production: a 30–60 s **plan**, the attempt, AI feedback, then **one revision** | §5, §8 |
   | 6 | Exit check | 1 | 3 recall items on today's material; the next review date is shown | §1 |

3. **About 28 scored interactions per core lesson.** That is 8 review, 4 structured-input, 12 controlled, 1 output and 3 exit items. At least 70 % are recall formats (§1).
   - The new-word load is the level's word target divided by its core lessons, for example about 550 B1 words over 44 lessons ≈ 12 per lesson. The level memos own the target.
   - **At most half of new words are targeted for productive recall.** Form recall is the costliest to keep (§1).

4. **Pronunciation: a 2-minute drill in two of the four lessons.**
   - **Perception:** items spoken by **at least 4 voices** (HVPT).
   - **Production:** ASR feedback that names the segment (*ü*/*u*, vowel length, *ich*-Laut), never a global accent score (§9).

5. **Skill time share per unit** (input volume from §7, exam weights from memos 01–03):

   | Levels | Listening | Reading | Speaking | Writing | Vocab/grammar practice |
   |---|---|---|---|---|---|
   | A1–A2 | 30 % | 15 % | 20 % | 10 % | 25 % |
   | B1–B2 | 25 % | 25 % | 20 % | 15 % | 15 % |

6. **Task session, about 25 min.** One speaking task and one writing task, both in exam format, each run as plan → attempt → AI feedback → revision.
   - **Planning time:** at B1–B2, as long as the exam allows (memos 02–03).
   - **Repetition:** the **same task type recurs a week later** at the checkpoint (§8: one-week interval, feedback lifts accuracy).

### B. Review cadence and the exam date

7. **Review ladder +1, +3, +7, +14, +30 days; a lapse goes back to +1.** Each interval is capped at **max(1 d, 15 % of the days left to the exam)**, following Cepeda's 5–40 % ridge (§2).
8. **Retrieval targets before the exam:** at least 5 successful spaced retrievals for productive items, 3 for receptive-only items (§1).
9. **New grammar gets short lags first.** Its lessons fall 1–3 days apart. Interleaved contrast review follows at the checkpoint and at about +2 and +4 weeks, and the UI warns that scores dip while contrasts are mixed (§2, §3).
10. **Checkpoints are cumulative:** about 65 % current unit and 35 % earlier units (a heuristic), in exam format, with section scores shown (§1).
11. **The exam path spans two courses**, because exams test whole levels.
    - **.1 courses** end with an exam-format half-mock on their own content.
    - **.2 courses** start with a diagnostic mini-mock in week 1, then run one full mock per week over the final three weeks.
    - **Mocks** are **parallel forms only** (§1).
    - **Review** is weighted by the learner's error tags.
    - **No new content** in the last week.
12. **Mock results appear as section scores on a practice test, never as a pass probability.** Retest effects inflate them (§1), and the legal brief forbids pass promises.

### C. Feedback engine

13. **Discrete items:** immediate feedback with the correct form, a one-line reason and one retry. A missed item returns in the same session and the next day (§1, §4).
14. **Productions:**
    - **First:** a self-correction prompt, e.g. *„Prüfen Sie die Verbposition im Nebensatz."*
    - **Then:** the reformulation plus a short rule, covering 3 points or fewer, all tied to the unit's targets.
    - **No model answer before the learner revises.** A rewritten text or model answer appears only after the learner's own revision (§5, Fan et al.).
15. **The AI dialogue partner is the default speaking-practice mode**, because solo ASR practice is the weakest condition (§5).
16. **Claims match the evidence:** "improves with regular use over weeks", since ASR at 1–4 weeks gave g = 0.07. The feature is described as an automatic tool, with no pass promise and no human-feedback claim.

### D. Motivation and retention

17. **No public leaderboards.** Badges are for mastery milestones only, never for activity (§10).
18. **The streak is repairable by default** and paired with a **weekly** goal (§10).
19. **Something new unlocks around weeks 4–6**, such as the first mini-mock or a role-play, to meet the novelty dip (§10).
20. **A weekly recorded progress report** covers can-dos reached, retention rate and section scores. An opt-in "share with a study partner or teacher" link is included, because recorded and reported progress works best (§12 Harkin).
21. **The first session takes under 20 min:** one lesson and one spoken output, then an exam-date plan with concrete days. Because plans fade, back them with lasting accountability through the weekly report and the course-reminder mailer (§12).
22. **Re-entry after 3 or more days away** starts with a 5-minute review, not the full backlog.
23. **Instrument three signals:** week-1 active days, D30 activity of paying learners, and delayed-recall accuracy. A/B-test the big choices, including a fixed ladder against an adaptive scheduler (§2, §12).

## Open questions

1. **German-specific evidence is thin.** Do Kasus contrasts behave like the English structures under interleaving?
2. **Fixed ladder or adaptive (HLR/FSRS) scheduling?** An in-app test should decide.
3. **Is the LLM evaluator accurate enough on German morphology** (gender, case endings, verb position)? AWE helped grammar least (§5). This needs an error-annotated audit.
4. **Can an AI partner close the solo-vs-peer ASR gap** (g = 0.44 vs 0.89)?
5. **What weekly time do exam-date learners sustain?** The 3 h/week figure is an inference; check it against telemetry and `weekly_metrics`.
6. **How does the free A1.1 course convert** before its learners drop out? Free completion runs at about 3 % against 46 % for paying learners (§12).
7. **How many parallel mock forms** can be authored per exam level?

## Unverified

- **Snippet or secondary-source figures:**
  - Kang & Han g = 0.54;
  - Li 2010 d = 0.61;
  - Adesope g = 0.61;
  - Goo et al.'s free-production g = 1.443;
  - Ngo AWE g = 0.59;
  - Bai et al. g = 0.504;
  - oral task repetition (Abdi Tabari et al. 2025, *System*, [DOI](https://doi.org/10.1016/j.system.2025.103868));
  - chatbot meta-analyses g = 0.484 (Wang et al. 2024) and 0.795 (Yang et al. 2025);
  - Plonsky & Oswald's numeric cut-offs;
  - Guo's "6-minute" ceiling.
- **Primary source reached, numbers not:** planning effect sizes (Johnson & Abdi Tabari), Mackey & Goo 2007, Kim & Webb pooled g values.
- **Not used:** the "streak freeze cut churn 21 %" claim (blogs only); an SSRN task-repetition preprint; a preprint on L1-plus-picture glosses.
- **Design inferences, not measurements:** all minute splits, item counts, skill shares, the 15 % cap, the 65/35 checkpoint mix, the four-voice minimum and the new-word load.
