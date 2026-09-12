# Lesson anatomy research: what one lesson looks like in the best language courses, and what to build

All facts checked 2026-09-12 via Perplexity/Firecrawl search (vendor sites often blocked to direct fetch). "not found" = no primary or reliable secondary source located. Product behaviour is A/B-tested and version-dependent; treat numbers as "documented at time of source", not guarantees.

## Part 1 — Product-by-product

### Duolingo
| Dimension | Finding | Source |
|---|---|---|
| Flow / length | Path: course → section → unit → level nodes (star = lesson, dumbbell = personalised practice, trophy = unit review, book = story, headphones = DuoRadio, speech bubble = roleplay). Standard lesson ≈ up to 15–17 exercises, ~3–5 min. Unit pattern since 2024: 3 content levels (6, 6, 3 lessons) + 1–3 practice sessions of ~5 lessons, topics interleaved A,A,B,A,B,B. | https://duoplanet.com/duolingo-learning-path/ ; https://www.reddit.com/r/duolingo/comments/191v27g/new_course_unit_structure/ |
| Exercise inventory | Typed translation, word-bank translation, listen-and-type, listening select, speak/repeat, match pairs, fill-blank, word order, reading comprehension; stories/DuoRadio as separate nodes. | duoplanet (above) |
| Wrong answer | Marked immediately, correct answer shown + hint; "an exercise targeting the same concept is resurfaced at the very end of the lesson"; costs 1 of 5 hearts on free tier (unlimited on Super/Max). Adaptive sequencing (Birdbrain) raises difficulty when learner performs well. | https://duolingo-papers.s3.amazonaws.com/reports/Duolingo_whitepaper_duolingo_method_2023.pdf |
| Spaced review | Half-life regression: p = 2^(−Δ/h), ĥ = 2^(Θ·x); trained on 13M traces; −45% prediction error vs Leitner/Pimsleur; +12% engagement. Surfaced as personalised-practice nodes on the path and the free Practice tab ("Mistakes" up to 10 items/round, Listen/Speak 10-item sessions). Users complain Mistakes replays in recency order, not shuffled. | Settles & Meeder 2016, https://aclanthology.org/P16-1174/ ; https://blog.duolingo.com/guide-to-duolingo-practice-hub/ ; https://duoplanet.com/duolingo-practice-hub/ |
| Checkpoints | Unit review (trophy node) per unit; "Jump here" placement test to skip ahead; Legendary = harder re-run of a unit's material. Pass thresholds: not found (not published). | duoplanet (above) |
| Progress | XP (10 base/lesson), streak, crowns/Legendary, section CEFR label via Score. | https://blog.duolingo.com/how-to-review-lessons-on-duolingo |
| Speaking/writing feedback | Explain My Answer (GPT-4-class, now free for Spanish/French/German/Japanese/Portuguese/Italian/Korean as of 2026-01); Roleplay (Max) with end-of-scenario feedback; Video Call with Lily (Max): ~1 min early course, up to 3 min later, "not penalised for mistakes", transcript afterwards. No rubric or numeric score published. | https://blog.duolingo.com/explain-my-answer-now-free/ ; https://blog.duolingo.com/video-call/ ; https://blog.duolingo.com/duolingo-max/ |
| Critiques | Controlled practice only; recognition-heavy (word bank); no sustained production, no writing beyond one sentence, little explicit grammar, no pragmatics; efficacy studies are company-linked pre/post (Jiang et al. 2021: reading IL, listening NH after beginner content). | http://static.duolingo.com/s3/DuolingoReport_Final.pdf ; https://scholarspace.manoa.hawaii.edu/bitstreams/ea47a53e-da6e-4419-bd55-e72b458294f4/download |

### Babbel
| Dimension | Finding | Source |
|---|---|---|
| Flow / length | 10–15 min: new words with images/audio → dialogue → concise grammar note → practice → recap. | https://yameyaku.com/babbel-review-2026/ |
| Exercises | Typed fill-in, word order, listening/transcribe, speech-recognition repeat, dialogue role, matching. | https://www.babbel.com/press/en-us/releases/learn-with-your-own-voice-babbel-launches-two-new-speech-based-features-us |
| Wrong answer | Immediate correct answer shown; learner continues; item lands in Review. Guaranteed end-of-lesson re-queue: not found. | Babbel support (below) |
| Spaced review (best-documented consumer schedule) | Review Manager: correct → next day → 4 d → 7 d → 14 d → 60 d → 6 months (6 stages; now displayed as Weak/Medium/Strong). Mistake → back to next day; repeated mistakes → shown more often. Modes: Flashcards, Listening, Speaking, Writing. ~20–30 due items/day at 3,600 learned words. | https://support.babbel.com/hc/en-us/articles/205600228-Review ; https://support.babbel.com/hc/en-us/articles/360037496932-Memorizing-vocabulary |
| Checkpoints | Course/lesson completion only; no published unit test pass rule: not found. | — |
| Speaking AI | Babbel Speak launched 2025-09-16 (open beta, incl. German): curated scenarios, voice-led, scenario-tied feedback; deliberately not open chat. Babbel Live for consumers discontinued July 2025. | https://www.babbel.com/press/en-us/releases/babbel-speak ; https://www.heise.de/en/news/Language-learning-Babbel-relies-even-more-heavily-on-AI-10647158.html |
| Efficacy | Loewen, Isbell & Sporn 2020 (Foreign Language Annals 53:209–233): 54 learners, ~12 h over 12 weeks → +0.7 ACTFL sublevel oral; 59 % gained ≥1 sublevel; time on app strongest predictor; 36 % attrition. | https://doi.org/10.1111/flan.12454 |
| Critiques | Scripted, recognition-heavy, opaque intervals, imperfect ASR, selective grammar. | yameyaku review above |

### Busuu
| Dimension | Finding | Source |
|---|---|---|
| Flow | ~5-min lessons: vocab (image+audio) → dialogue (often video) → grammar tip + practice → quiz → Conversation task (write or record, sent to community). | https://testprepinsight.com/reviews/busuu-review/ |
| Community correction | Native speakers correct text/audio, may add explanation or voice note; reciprocal. Quality inconsistent ("perfect" with no comment, wrong corrections). AI "Conversations" speaking feature on Premium Plus. | https://iaintfluent.com/blog/busuu-review ; https://www.reddit.com/r/Busuu/comments/1jhj5v3/ |
| Spaced review | Smart Review buckets Weak/Medium/Strong; Grammar Review collects seen rules with Tips + practice + link back to origin lesson. Intervals: not found. | https://help.busuu.com/hc/en-us/articles/12575126438674-What-is-Grammar-Review |
| Checkpoints | Chapter-end "mini-test"; passing unlocks the chapter's lessons, first lesson of next chapter, and next checkpoint (skip-ahead mechanic for free users). Pass mark: not found. McGraw Hill certificate on level completion. | https://help.busuu.com/hc/en-us/articles/16529628876561-What-are-checkpoints-and-how-do-they-work |

### Lingoda / Seedlang / DW Nicos Weg
| Product | Lesson & feedback machinery | Source |
|---|---|---|
| Lingoda | 60-min live class, ≤5 students (sources say "up to 4/5"), PDF lesson sheet, optional pre/post exercises; teacher corrects live. Certificate = attendance: 45 of 50 unique lessons per sub-level (A1.1…), **no test**. Critique: post-class feedback can be canned labels. | https://lingoda-students.elevio.help/en/articles/224-does-lingoda-offer-certificates ; https://www.reddit.com/r/languagelearning/comments/1n3c8q4/ |
| Seedlang | Tree of "stories" (one grammar point + ~4 words each), shot on video by Easy German team. Card types: grammar card, word translation (listen/repeat/record-compare), word MC, written recall (article errors flagged "Close!"), listen-and-repeat sentence, fill-blank, EN→DE translate-then-record, word order. Review decks with SRS; user can halve/reset interval. Trainers: vocab (1–12 new/session), conjugation, gender, plural, numbers. Click any word for conjugation/declension. | https://www.reddit.com/r/German/comments/1p406g4/extensive_seedlang_reviewoverview/ ; https://yourdailygerman.com/seedlang-review-great/ |
| DW Nicos Weg | Episode: video (~1–2 min) → Wortschatz → 5–8 exercises (select, match, gap-fill dialogue, sentence order, listen-and-pick, comprehension) → grammar note/transcript. Free Einstufungstest and Abschlusstest A1 with DW certificate; per-exercise correct/incorrect with retry. Critique: almost no speaking/writing production; vocab retention needs external SRS. | https://learngerman.dw.com/en/final-test-a1/l-44875550 ; https://static.dw.com/downloads/51544303/nicos-weg-a1-e4-l1-lehrerhandreichung-und-uebungen.pdf ; https://languagelibrarian.com/en/german/reviews/dw-learn-german-nicos-weg/ |

### AI speaking apps
| Product | Mechanics | Source |
|---|---|---|
| Speak | Learn → Practice (spoken drills with substitutions) → Apply (roleplay) → feedback + retry. Live roleplays on OpenAI Realtime API / GPT-4o. Diagnostic feedback on pronunciation/grammar/phrasing; no published rubric. | https://www.speak.com/blog/live-roleplays ; https://www.speak.com/ |
| Praktika | 12 languages incl. German; avatar tutor; per-utterance feedback button with overall + per-word score across pronunciation, fluency, completeness, rhythm; tutor model playback + "Try Again". Critiques: no end-of-lesson summary, errors don't feed future lessons, no SRS, ASR ~90–95 % on standard accents, German TTS mispronunciations reported. | https://copycatcafe.com/blog/praktika-review ; https://practiceme.app/vs/praktika ; https://apps.apple.com/us/app/praktika-ai-language-tutor/id1624701477 |
| Talkpal | Modes: roleplay, free talk, debate, call; IPA-based pronunciation score. Formula: not found. | (search synthesis; primary page not reachable) |
| Loora | English-only conversation coach; not relevant to German. | — |
| SLA critique of the class | Confidently wrong ASR corrections, over-correction, shallow explanations, no genuine negotiation of meaning, in-app gains ≠ transfer. | https://files.eric.ed.gov/fulltext/EJ1440171.pdf ; https://accentsasia.org/issues/21-1/Huang.pdf |

### Memrise / Pimsleur / Rosetta Stone / Mondly
| Product | Key mechanics | Source |
|---|---|---|
| Memrise | Learn → Classic Review (due items) → Speed Review (timed) → Difficult Words. Intervals after each correct review: 4 h, 12 h, 24 h, 6 d, 12 d, 48 d, 96 d, 6 mo; a miss resets to 4 h. | https://memrise.zendesk.com/hc/en-us/articles/360015889057-How-does-the-spaced-repetition-system-work |
| Pimsleur | 30-min audio; anticipation (pause → produce → hear model). Graduated-interval recall: 5 s, 25 s, 2 min, 10 min, 1 h, 5 h, 1 d, 5 d, 25 d, 4 mo, 2 yr. Voice Coach: score <70 in Challenge Mode or "Fair" → re-present, save to Practice Set. | https://d1enwirvb3djmg.cloudfront.net/Pimsleur-Guides-Booklets/Pimsleur_Voice_Coach_FAQ.pdf |
| Rosetta Stone | Core Lesson (~30 min) + focused activities; TruAccent red/yellow/green with adjustable precision slider; Milestone = scenario conversation at unit end with pass score gating next unit. | https://www.rosettastone.com/features/truaccent-speech-recognition/ ; https://educationblog.rosettastone.com/2022/11/instruction-for-independent-language-learners-with-rosetta-stone-for-schools/ |
| Mondly | 5–10-min daily lesson → weekly quiz → monthly challenge; chatbot/AR/VR. Unlock rules: not found. | (search synthesis only) |

### Mastery / MOOC assessment patterns
| Pattern | Rule | Source |
|---|---|---|
| Khan Academy | Skill = 100 pts: Familiar 50 (70–85 % on exercise), Proficient 80 (100 % of skill's items in an activity), Mastered 100 (correct in unit test / course challenge). <70 % drops Mastered → Familiar. Mastery Challenge = 6 questions over 3 skills, personalised spiral review. Unit test + Course challenge are mixed-skill. | https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery ; https://support.khanacademy.org/hc/en-us/articles/360037127892-What-are-Mastery-Challenges-in-course-mastery |
| Coursera | Instructor-set; common default 80 % pass, 3 attempts per 8 h, highest attempt kept, unlimited total. | https://www.coursera.support/s/question/0D51U00003BlV2oSAF/unable-to-retake-quiz-after-8-hours-have-passed |
| LinkedIn Learning | 70 % pass commonly reported; official doc: not found. | — |
| Anki/FSRS | DSR model; R(t)=(1+FACTOR·t/S)^DECAY, FACTOR=19/81, DECAY=−0.5 (FSRS-5; FSRS-6 makes decay w20 learnable); S defined as days to R=0.9; desired retention default 0.90 (range 0.70–0.97 reasonable); interval = S when DR=0.9; 19 (FSRS-5) / 21 (FSRS-6) weights, defaults fit on ~350M reviews; open-source ts-fsrs / rs-fsrs. | https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs ; https://expertium.github.io/Algorithm.html ; https://deepwiki.com/open-spaced-repetition/rs-fsrs/6.4-parameters-and-configuration |

## Part 2 — Synthesis for an exam-oriented A1–A2 German lesson engine

### (a) Recommended lesson anatomy (target 12–15 min, ~22 items)
Design principle: every lesson is a Kann-Beschreibung (Goethe/telc A1–A2 descriptor) with a communicative outcome, not a grammar chapter. Recognition first, production last, exam format visible from lesson 1.

| # | Stage | Min | Items | What happens | Borrowed from |
|---|---|---|---|---|---|
| 0 | Warm-up retrieval | 1.5 | 4 | Due items from SRS (vocab + one grammar pattern) interleaved from earlier lessons; skipped for lesson 1. | Duolingo personalised practice; Khan spiral |
| 1 | Hook / pretest | 1 | 1 | One production attempt *before* teaching (e.g., "Wie sagt man…?"), errors expected, then the model answer. | Kornell 2009 errorful generation; Pimsleur anticipation |
| 2 | Input | 2 | 1 dialogue + 4–6 words | 20–40-s audio/video dialogue (native voice), tap-any-word gloss, then 4–6 new lexical items with image + audio + article + plural. | Seedlang, Nicos Weg, Babbel |
| 3 | Notice | 1 | 1 card | One grammar point only, ≤60 words, coloured by case per design-token rule, with 2 examples from the dialogue. | Babbel note; Seedlang one-point rule |
| 4 | Controlled practice | 3 | 7 | Mix: 2 listening-select, 2 gap-fill typed (article/ending), 1 word-order, 1 match, 1 listen-and-type dictation. | Babbel/Duolingo inventory |
| 5 | Speaking | 2 | 2 | Read-aloud of a dialogue line with per-word ASR score; then one 20-s open prompt from the Goethe *Sprechen Teil 2/3* format ("Bitte um etwas"). | Praktika per-word score; Rosetta precision slider |
| 6 | Writing | 1.5 | 1 | A1: form-filling or 2-sentence SMS; A2: 3-sentence e-mail (telc/Goethe *Schreiben*). LLM correction against a 3-criterion rubric. | Busuu conversation task, Kang & Han |
| 7 | Re-queue | 1.5 | 0–4 | Every item missed in stages 4–6 returns here as a fresh variant. | Duolingo end-of-lesson resurfacing |
| 8 | Recap + schedule | 0.5 | — | Shows: words learned, grammar point, mastery delta, next review date. | Babbel recap; Khan levels |

Exercise-mix ratio per lesson (excluding warm-up): recognition 35 %, typed production 35 %, listening 15 %, speaking 10 %, writing 5 %. Shift to 25/40/15/12/8 in A2.2. Speaking appears from lesson 1 (read-aloud), open speaking from lesson 4; writing from lesson 3 (form-filling) because the A1 exam has it.

### (b) Wrong-answer and re-queue rules
1. Immediate reveal, never block: show correct answer + one-line *why* (rule name + link to Notice card). Kulik & Kulik 1988: immediate feedback wins for acquisition in applied settings.
2. One retry on typed items when the error is diacritic/capitalisation/typo (Levenshtein ≤1 on a word ≥5 chars) — count as correct-with-warning, like Seedlang's "Close!".
3. Article/ending errors are never typos: mark wrong, colour the case, re-queue.
4. Re-queue at end of lesson as a *different* variant of the same item (different exercise type), not the same screen; cap 4; if still wrong, mark item "Weak" and schedule for next day (Babbel rule).
5. No hearts; instead a per-lesson accuracy figure. Lesson "complete" at any accuracy; lesson "mastered" (gold) at ≥80 % first-attempt accuracy (Khan Familiar/Proficient bands).
6. Log every error with an error-type tag (Artikel, Kasus, Verbstellung, Konjugation, Plural, Rechtschreibung, Hören) — this feeds checkpoint remediation and lets an "Explain my answer" call be grounded.
7. Explain-my-answer button on every item (correct or not), LLM with the item's rule card in context; free, because Duolingo made it free in 2026.

### (c) Spaced-review model a small team can ship
Ship **FSRS-5 via ts-fsrs with default weights** (no per-user optimisation needed at launch); it is a ~200-line dependency, MIT-licensed, and beats SM-2 with defaults.
- State per (user, item): D, S, R, last_review, reps, lapses. Items = vocab words, grammar pattern cards, and *sentence-level* cards (production), stored in Supabase.
- Desired retention 0.90 for vocab; 0.85 for grammar-pattern cards (they recur naturally in lessons); maximum interval 180 d (exam horizon).
- Grades: engine maps outcomes → Again (wrong), Hard (correct after retry / slow), Good (correct), Easy (correct + fast on production). Never let a recognition-only success push Easy.
- Same-day re-queue success does not advance S beyond FSRS same-day rule; the *next-day* review is what counts.
- Surfacing: (i) 4 due items at the start of every lesson; (ii) a "Wiederholen" tile on the dashboard with the due count and an 8–12-item session in 4 modes (flashcard, listening, speaking, writing — Babbel); (iii) cap 30 due/day, overflow prioritised by lowest R.
- Fallback if FSRS is too much: Babbel's fixed ladder 1 d → 4 d → 7 d → 14 d → 60 d → 180 d, lapse → back to 1 d. Expanding vs uniform spacing shows no reliable difference (g=0.034, Yang et al. 2021), so a simple ladder is defensible.
- Interleave review items across at least two grammar topics (Nakata & Suzuki 2019; Pan et al. 2019: alternate systematically ABAB first, then randomise).

### (d) Checkpoint test design
- Cadence: every 6 lessons (a "Kapitel" ≈ one exam Kann-Bereich); plus a level test at end of A1.1/A1.2/A2.1/A2.2.
- Items (Kapitel test, ~12 min, 20 items): 5 Hören (Goethe A1 Teil 1/2 format), 4 Lesen, 6 Sprachbausteine (typed), 3 Schreiben (one form-fill + one 3-sentence task, LLM-rubric-scored), 2 Sprechen (read-aloud ASR + one open prompt). Items drawn 70 % from the chapter, 30 % from earlier chapters (interleaved, Khan unit test).
- Pass: 60 % overall (mirrors Goethe/telc 60-point pass) **and** no skill section below 40 %. Show sub-scores by skill and by error tag.
- Attempts: unlimited, but 3 per 8 h with a mandatory remediation set between attempts (Coursera cadence). Highest attempt kept.
- Remediation: failing tags generate a 10-item targeted session + re-open the relevant Notice cards; those items are pushed to "Again" in FSRS.
- Mastery display per chapter: Started / Vertraut (≥70 % lesson accuracy) / Sicher (checkpoint passed) / Gefestigt (checkpoint items answered correctly again ≥14 d later in review). Downgrade Gefestigt → Vertraut if <70 % on later review of that chapter's items.
- Level test: 40 items, same section rule, unlocks the "Prüfungssimulation" mock exam already in the repo.

### (e) Evidence base
| Principle | Key source | Effect |
|---|---|---|
| Retrieval practice > restudy | Rowland 2014, Psych Bull 140:1432, doi 10.1037/a0037559 | g = 0.50 |
| | Adesope et al. 2017, RER 87:659, doi 10.3102/0034654316689306 | g = 0.61 |
| Spaced retrieval > massed | Yang et al. 2021, Psych Bull 147:120, doi 10.1037/bul0000310 | g = 0.74 spaced vs massed; expanding vs uniform g = 0.03 (n.s.) |
| Spacing gap ≈ 10–20 % of retention interval | Cepeda et al. 2008, Psych Sci 19:1095, doi 10.1111/j.1467-9280.2008.02209.x | optimum ridge |
| Written CF improves L2 accuracy | Kang & Han 2015, MLJ 99:1, doi 10.1111/modl.12189 | g = 0.54 |
| Oral CF works; prompts ≥ recasts | Li 2010, Lang Learn 60:309, doi 10.1111/j.1467-9922.2009.00554.x ; Lyster & Saito 2010, SSLA 32:265 | d = 0.61 |
| Interleaving | Brunmair & Richter 2019, Psych Bull 145:1029, doi 10.1037/bul0000209 | g = 0.42 overall; **words g = −0.39** (block vocab, interleave grammar) |
| Interleaving L2 grammar | Nakata & Suzuki 2019, MLJ 103:629, doi 10.1111/modl.12581 | interleaved > blocked at 1-week delay; more errors during training |
| | Pan, Tajran et al. 2019, JEP 111:1172, doi 10.1037/edu0000336 | advantage only across 2 sessions 1 week apart |
| Errorful generation | Kornell, Hays & Bjork 2009, JEP:LMC 35:989, doi 10.1037/a0015729 | pretest + feedback > study |
| Feedback timing | Kulik & Kulik 1988, RER 58:79, doi 10.3102/00346543058001079 | immediate better in applied studies |
| Half-life regression | Settles & Meeder 2016, ACL, doi 10.18653/v1/P16-1174 | −45 % recall-prediction error |
| App efficacy (context) | Loewen et al. 2020 (Babbel), doi 10.1111/flan.12454 | +0.7 ACTFL sublevel in ~12 h; time-on-task dominant |

Implication of the interleaving moderator: block *vocabulary* by topic inside a lesson, but interleave *grammar forms* (Nominativ vs Akkusativ articles, sein vs haben) in practice and review — the two most exam-relevant confusions at A1.

### Gaps / not found
Duolingo unit-review pass threshold; Babbel end-of-lesson re-queue guarantee; Busuu checkpoint pass mark and Smart Review intervals; Mondly unlock rules; Talkpal scoring formula; LinkedIn Learning official pass rule; Speak's full model stack beyond GPT-4o Realtime.
