# The DeutschMeister lesson: research, design and first build (A1.1 Lektion 1)

## Context

The founder's vision, in his words (2026-11-11/12):

- "i dont want the user to be needing any source to learn the langiage or to feel that he needs a
  teacher or a language learning center"
- His own German course "was very open, it was throwing informations and hoping i would learn somehow,
  not too much speaking was done".
- He asked for the components of learning German "combined in the perfect way and delivered step by
  step in a fun way that makes the user always want to come back".
- On my first lesson proposal: "lets give this more thinking and research and analysis".

Decisions he has locked:

| Decision | His answer |
|---|---|
| Where to start | A1.1, then course by course |
| Path | Locked: the next lesson opens only after passing a final check |
| Daily time | About 60 minutes, as three 20-minute parts with saved pauses |
| After a failed check | Retry at once, with the teacher's help; never a dead end |
| Explanation languages at A1 | English (exists) and Arabic |
| Access | All courses, A1.1 included, behind one paid subscription; only lesson 1 is free, after a free sign-up |

| The teacher | Candidate A from `docs/strategy/lesson-look-2026-11-12/teacher-candidates.jpg`: a woman in her early forties, chestnut hair, round glasses, teal cardigan |

Still open with him: the teacher's name, the subscription price, and what happens to the one-time
offers launched on 2026-11-11.

**Next actions now that the plan and the teacher are approved**

1. Write the Codex build brief for step 0 (measurement) and step 1 (the scene in short chunks with
   say-it scoring), with the two lesson screens in `docs/strategy/lesson-look-2026-11-12/` as the
   look to match, and run Codex at effort "high".
2. With the remaining Higgsfield credits (about 4): a reference sheet of teacher A and of Ana, so
   every later picture keeps the same faces. The full scene set and video wait for credits.
3. Check each Codex step on a phone-sized browser against the pictures before anything ships.

This plan holds (1) what the research says, (2) what our course already has, (3) the lesson design
that follows, and (4) how to build it first for A1.1 Lektion 1, measure it, then roll it out.

## 1. What the research says

Sources are meta-analyses and controlled studies found on 2026-11-12. "Not found" means I searched and
found no reliable number, so the point rests on judgment.

| # | Finding | Evidence | What it means for our lesson |
|---|---|---|---|
| 1 | A short, clear grammar explanation beats leaving learners to work it out | Norris & Ortega 2000: explicit d = 1.13 vs implicit 0.54; Goo et al. 2015: g = 1.29 vs 0.77 | The teacher explains one rule plainly, then the learner uses it |
| 2 | Correction works, and asking the learner to fix it first works better than giving the answer | Lyster & Saito 2010: feedback d = 0.74; prompts 0.83, recasts 0.53 | A hint and a second try come before the answer |
| 3 | Pronunciation can be taught, with feedback and over weeks; hearing the difference comes before saying it | Lee, Jang & Plonsky 2015: d ≈ 0.8–0.9; Yao et al. 2025: d = 0.76; speech-recognition feedback g = 0.69 (Ngo et al. 2023), no effect for short use | A sound slot in every lesson: hear, tell apart, repeat, get feedback |
| 4 | Spreading practice over time beats one block | Kim & Webb 2022 (48 experiments): medium-to-large effect; classroom studies d = 0.54 | Keep review on; give the hour real break points |
| 5 | Recalling from memory beats re-reading; tests that include old material work 2–3 times better | Adesope et al. 2017; Nakata et al. 2020 | Every lesson opens with recall of earlier lessons |
| 6 | A balanced course gives about a quarter each to understanding, producing, studying the language, and fluency | Nation's four strands | My first proposal had too much drill and too little listening, reading and fluency |
| 7 | For beginners, explanations and meanings in their own language work better | Own-language vs target-language glosses g = 0.33, strongest for beginners | Own-language explanations at A1 are supported |
| 8 | Requiring mastery before moving on raises achievement | Kulik et al. 1990: +0.52 SD over 103 studies | The locked path is supported. Effect on dropout: not found, so a fail must never dead-end |
| 9 | Units built around real tasks help; the size of the benefit is disputed | Bryfonski & McKay 2019: d = 0.93; Boers et al. 2023 dispute it | Keep one real situation per lesson; do not call it proven best |
| 10 | A well-designed AI tutor teaches more in less time; an unguarded chatbot harms learning | Kestin et al. 2025 (RCT, 194 students): 0.63–1.3 SD; Bastani et al. 2025: free ChatGPT use led to 17% lower unaided exam scores, a guarded tutor did not | The teacher gives hints and makes the learner produce |
| 11 | Conversation practice with chatbots improves language learning | Lyu et al. 2024 (31 studies): g = 0.61 | Spoken role-play with the teacher is supported |
| 12 | Most self-paced courses are never finished | MOOC completion: median 12.6% (Jordan 2015); planning prompts faded within 2 weeks (Kizilcec et al. 2020) | Return has to be designed in |
| 13 | Game elements help a little; story and social contact are what change behaviour | Sailer & Homner 2020: learning g = 0.49, motivation 0.36 | A continuing story and contact with other learners, not points for their own sake |
| 14 | Streaks are linked to finishing | Duolingo: a 7-day streak goes with 3.6 times higher completion (association, company data) | A daily streak with a rest allowance |

Products: Pimsleur has the learner speak constantly for 30 minutes; Lingoda runs 60-minute live
classes; Babbel and Duolingo are 10–15 minutes with little speaking; Deutsche Welle's "Nicos Weg" is a
continuing video story. None combines a story, a clear explanation, constant corrected speaking, a
mastery gate and an exam path. That gap is the founder's vision.

Not found: a study comparing one 60-minute sitting with the same hour split up.

## 2. What our course already has

A1.1 is built to `docs/course-standard-2026-09-12.md`. Lektion 1 today, in three parts:

| Part | What the learner does | Checked? |
|---|---|---|
| 1 "Meet it" | One typed sentence, then reads a 10-line dialogue, flips 20 word cards, reads a grammar card, ticks 3 sounds | Only the typed sentence |
| 2 "Use it" | 7 practice items, 3 derived items, 2 dictations | Every item |
| 3 "Say and write" | Reads 2 lines aloud, fills a form, retries, recap | Yes, for signed-in learners |

- The learner speaks aloud for two lines, at the very end.
- Nobody can ask a question. The "explain" helper answers one fixed question, in English or German.
- All audio is the browser's computer voice; the art is a placeholder drawing.
- A Lektion counts as passed at any score.
- Already in place and kept: the syllabus, the 12 situations, the cast and story (Ana in Bremen), the
  answer checker, review of old material on a 1/4/7/14/60/180-day ladder, a test every three lessons,
  an exam-date plan, a certificate.

**Correction to what I told the founder.** I said 24 of the 27 learners who quit lesson 1 left during
Part 1. The build review showed that this is not proven: practice answers are saved only at the end
of a lesson, and "started" is recorded when the intro screen opens. We know 38 started, 11 finished
and 27 did not; we do not know where the 27 stopped. Measuring that is step 0 below.

## 3. The lesson design

One Lektion is about 60 minutes in three parts of about 20, each ending at a saved pause.

The governing rule: **the learner never gets more than about two minutes of input without producing
something that is checked** (findings 1, 2, 5, 6).

| Part | Step | Min | What the learner does | Findings |
|---|---|---|---|---|
| 1 Understand and say | Recall | 3 | Says phrases from earlier lessons aloud | 4, 5 |
| | Scene in short chunks | 9 | Hears 2–3 lines of the story, shows they understood, says the line aloud and is scored; repeat | 3, 6, 11 |
| | Sounds | 4 | Hears two similar sounds, tells them apart, repeats | 3 |
| | Read | 4 | Reads a short real text, meanings in their own language one tap away | 6, 7 |
| 2 Learn and practise | One rule | 4 | The teacher explains one grammar point in the learner's language, with two lines from the scene | 1, 7 |
| | Practice | 12 | Short tasks, each checked; a miss gets a hint and a second try before the answer | 2, 5 |
| | Fluency | 4 | Says familiar sentences again, faster | 6 |
| 3 Use it | Conversation | 10 | Plays the scene aloud; a miss gets a hint, then the model to repeat | 2, 10, 11 |
| | Write | 5 | Writes a short real message; gets it corrected | 2 |
| | Proof | 5 | One task per lesson goal, spoken (typed without a microphone). Passing opens the next Lektion | 8 |

- Speaking aloud: about 27 of 60 minutes (today: two lines).
- **The teacher:** one named AI teacher with a painted portrait. "Ask the teacher" sits on every
  screen: she answers in the learner's language, gives a hint before an answer, stays on the current
  lesson, and is labelled as AI.
- **The pass gate:** the proof decides. After a fail the teacher names what to repeat, replays that
  piece, and asks again at once.
- **Why they come back:** the story continues and each recap ends on a hook; the recap says what the
  learner can now do in real life; a streak with a rest allowance; the existing exam-date plan.
- **The first two minutes of Lektion 1:** one painted scene, one line of welcome, and the learner has
  said "Ich heiße …" aloud and been understood.

## 4. First build: Lektion 1 as the model lesson

Built so Lektionen 2–12 and A1.2 keep working unchanged, and can adopt the pattern one by one.

**How it fits the engine**

- L1 gets `flow: 'guided'` plus a `guided` block in `src/data/curricula/a11.js`; every existing L1 field
  stays (the shape is pinned by `tests/curricula.test.mjs`).
- New `src/lib/lesson/buildGuided.js`; `buildLesson()` in `src/lib/lesson/buildLesson.js` branches on
  the flag, so the old path is untouched.
- `src/lib/lesson/sessions.js` lets a stage carry its own `part`; `src/lib/lesson/runState.js` tags
  saved runs with their flow.
- New stage components in `src/components/lesson/`: `SceneStage`, `SoundStage`, a small read stage, a
  fluency stage, a role-play stage, a proof stage. They reuse `ReadAloudLine`, `GlossLine`,
  `PracticeItem`, `WritingStage`, `RecapStage` and the checker `src/lib/lesson/check.js`.
- Speech scoring reuses `netlify/functions/score-readaloud.mjs`. The L1 conversation is scripted (the
  partner's lines are recorded clips), so it needs no new speaking endpoint and leaves the standalone
  coach alone. An open AI conversation comes from Lektion 4 on.
- The pass rule lives in a new `src/lib/lesson/proof.js`; the lock check moves from
  `src/pages/CurriculumHomePage.jsx` into `src/lib/course/lock.js` and also guards the lesson and
  checkpoint routes.
- "Ask the teacher": new `netlify/functions/ask-teacher.mjs` on the pattern of `explain-answer.mjs`
  (verified sign-in, reserve-then-release, answers grounded in the lesson's own rule card and text,
  common questions cached). About $0.002 per answer at current model prices.
- Arabic: a separate "help language" setting, not a third interface language. It drives the teacher's
  answers and about 60 fixed L1 texts in a new `src/data/curricula/a11.l10n.js`, shown right-to-left.
- Art and audio: fill `src/data/curricula/a11.art.js` with painted scenes; run
  `scripts/generate-course-audio.mjs` for L1 once its text is frozen.

**Order of work** (each step ships by itself; Codex builds, I check and ship)

| Step | What ships | Founder needed |
|---|---|---|
| 0 | Measurement: record the furthest step reached, and "started" only when Start is pressed | Apply one small database change |
| 1 | The scene in short chunks with say-it scoring; fewer words up front | Approve the rule changes below |
| 2 | Hint-first correction, sounds, read, fluency round | — |
| 3 | The proof and the locked path | Confirm the pass mark |
| 4 | "Ask the teacher" with English and Arabic answers | Approve the new endpoint and its daily limit; name the teacher |
| 5 | The scripted conversation | — |
| 6 | Painted art and generated audio for L1 | Run the audio job |
| 7 | Recap hook, Arabic fixed texts, checklist to roll out to L2–12 | Have the Arabic checked by a native speaker |

**Visuals with Higgsfield** (founder, 2026-11-12: "use higgsfield to build the best and most beautiful
courses, hold no limits")

Pictures first, then code, as with the site redesign that worked:

1. A casting sheet of three teacher candidates; the founder picks one.
2. Character sheets for the story cast (Ana, Frau Kaya, then Lena, Tim, Paul), so each looks the same
   in every scene.
3. For each Lektion: four painted key moments of its scene, in the home page's style.
4. Two concept pictures of the lesson screen (the scene step and the end-of-lesson screen); the
   founder approves the look before Codex builds it.
5. For each Lektion: one short animated clip of the scene. The German audio comes from the
   course's own voice files, never from the video model, so every word is exactly right.

Higgsfield status (checked 2026-11-12, evening): the connected account is now on the Ultra plan, with
10 credits. Its only credit entry is the 10 sign-up credits; no plan credits have arrived yet. That
pays for the first concept pictures (1.5 credits each at high quality, 0.5 at medium) but not for
video (an 8-second clip costs 56 credits). First run on approval: the teacher casting sheet, the
lesson-1 reception scene and two lesson-screen concepts (about 5 credits). Video and the full set
of scenes wait for credits.

**The subscription switch is a separate piece of work after the model lesson.** It changes prices,
access rules and the pages built yesterday, and it needs the founder's price decision and the
legal check first. Existing buyers keep what they bought.

## 5. Rules and risks

- `CLAUDE.md` course rules that change with the founder's approval: a Lektion no longer completes at
  any score; the 12–15 minute engine target becomes three 20-minute parts; explanations gain Arabic;
  A1.1 is no longer free; L1 has generated audio while L2–12 still say "Computerstimme".
- Legal (FernUSG): a promised right to individual questions and checks of learning success can make
  a paid course regulated distance teaching. Until counsel answers, the teacher is described as an
  automated tool and nothing promises personal feedback. With A1.1 becoming paid this now applies
  to the first course too. Counsel is still not booked.
- The lock is enforced in the app, not on the server. That is enough for learning; it matters if a
  certificate must be tamper-proof.
- Speech recognition is unreliable on beginners: a low score offers a retry, then typing; spelling
  is never checked by voice.
- Sign-up before lesson 1 puts a wall in front of the first experience. The home page keeps its
  no-account try-it exercise so a visitor still feels the product first.
- Volume is small (about 5 lesson starts a week), so numbers alone will take months. Five watched
  walk-throughs with real beginners give the answer in a week.
- No effectiveness or time claim on the site until measured.

## 6. Verification

- After any content edit: `node scripts/build-lesson-pool.mjs a1.1`, then
  `node scripts/validate-curriculum.mjs`, then `node scripts/sync-shared.mjs`.
- Then `npm run lint`, `npm run check:duplicates`, `npm test`, `npm run build:verify`, and the full
  build plus `node scripts/check-built-html.mjs dist` as CI does.
- Tests that must stay green untouched: `tests/lesson-engine.test.mjs`, `tests/lesson-scoring.test.mjs`,
  `tests/curricula.test.mjs`, the speaking-coach and explain suites. Tests that change with the
  design are listed in the build brief (`course-value`, `lesson-run-resume`, `course-home`,
  `course-meta`, `course-audio`, `course-art`, `funnel-events`, `course-player`).
- Play Lektion 1 on a phone-sized browser on the deploy preview, signed in: every step, a failed
  proof and its retry, Lektion 2 locked until the proof passes, the teacher answering in English and
  in Arabic.
- After shipping: where non-finishers stop, share reaching the end of Part 1, proof pass rate on the
  first try, teacher questions per lesson, AI cost per learner per day.
