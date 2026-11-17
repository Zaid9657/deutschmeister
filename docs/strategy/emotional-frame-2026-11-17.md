# The emotional frame of a DeutschMeister course (proposal, 2026-11-17)

**Status: proposed, waiting for the founder.** Nothing here is built. Written by Claude after its own
research pass and an independent consult with Codex (answer in full at the end; Codex had no web
access, so its research claims are from memory and its repo claims were checked by Claude where
this document repeats them).

The founder's request, 2026-11-17: the course must keep learners "always enthusiastic and excited
about learning", "always proud that they are learning and improving", and they must "trust us with
the time, because trust is very important". Earlier, 2026-11-14: "being taken care of, being
optimistic, being proud of progress and learning, we should trigger these emotions each day".

## The one idea

**Pride is earned and shown, never announced.** A learner feels proud when the course shows them
proof of something they could not do yesterday, and feels cared for when a mistake is met with help.
Praise that carries no information does the opposite of what it intends.

## Evidence (sources read on 2026-11-17)

| Finding | Source | What it means here |
|---|---|---|
| Enjoyment of language learning goes with higher achievement and more willingness to speak, and with less anxiety (moderate correlations; not proof of cause) | Botes, Dewaele & Greiff 2022, meta-analysis, [SSLLT](https://pressto.amu.edu.pl/index.php/ssllt/article/view/34235) | Positive feeling is worth designing for, and anxiety is the thing to remove |
| Feeling competent predicts self-driven motivation most strongly, then feeling free to choose, then feeling connected | Bureau et al. 2022, 144 studies, over 79,000 students, [PMC8935530](https://pmc.ncbi.nlm.nih.gov/articles/PMC8935530/) | Show competence first; give choices second; the guide and the story third |
| Feedback moves motivation less than it moves learning (0.33 against 0.51). 21 % of the motivation effects were negative, and 86 % of those came from feedback with no information in it (rewards or punishments). Feedback rich in information: 0.99 | Wisniewski, Zierer & Hattie 2020, [PMC6987456](https://pmc.ncbi.nlm.nih.gov/articles/PMC6987456/) | No empty "Great job!", no points, no penalties. Say what was right, why, and what to do next |
| Doing the thing successfully is the strongest source of the belief "I can do this" | Bandura's self-efficacy theory, reviewed in Artino 2012, [PMC3540350](https://pmc.ncbi.nlm.nih.gov/articles/PMC3540350/) | Every sitting needs one real success the learner produced themselves |
| How a learning experience is remembered follows its strongest moment and its end | Hoogerheide & Paas 2012, [APA record](https://psycnet.apa.org/record/2012-32322-009) (abstract only) | Never end a sitting on a failure or a form; end on the proof |

Already in the course standard (§4) with their own evidence and unchanged by this proposal: first
lesson before sign-up, the dated plan, reminders, a streak with rest days, no XP, hearts or leagues.

## Five rules

1. **Every sitting ends with proof.** The last thing the learner does before a pause or the end is
   something they succeed at and can hear or see: their own recording, a finished form, a short
   exchange. Where recordings exist, the first and the latest attempt are played side by side.
2. **The course says "you can do this" only for what the learner showed.** Each can-do is one of
   three: shown, practised, or still to try again.
3. **A mistake is met with help at once**, in the learner's language, followed by a new try. Never a
   loss, a blank or a bare score. Help needed to pass a required check never runs out.
4. **Coming back is always welcomed.** The place is saved, the return starts with a two-minute
   refresher of something the learner already can do, and missed days are never mentioned as a fault.
5. **The course tells the truth.** Honest times, honest labels (a computer voice is called one), no
   invented praise, no numbers that mean less than they look, no promise of an exam result.

## The moments

| Moment | The learner should feel | What the course does | Today (checked in code or by playing) |
|---|---|---|---|
| Opening a lesson | Oriented, respected | One line on today's situation, the map of parts, "you can pause after each part" | Goals, map and estimate exist (`IntroStage.jsx`); the screen is long before Start |
| First three minutes | "I can begin" | Hear a model, say the own sentence aloud, get one useful reply | Starts with a typed sentence (`PretestStage.jsx`); speaking comes after |
| A right answer | Competent | Now and then name what was right ("You gave your name clearly") | "Correct!" (`strings.js`) |
| A wrong answer | Safe, able to repair | One usable hint, then the learner's turn again | "Not yet", hint and second try exist (`FeedbackSheet.jsx`); hints vary in usefulness |
| A failed final check | Supported, still moving | Name the missing skill, rehearse it, retry with a new task of the same kind | The final check is not built (brief only, PR #258) |
| A pause between parts | Accomplished, free to stop | Name one thing achieved; show exactly where the return starts | "A good place to stop" and the saved place exist (`SessionBreak.jsx`); no achievement named |
| End of a lesson | Earned pride | Only shown abilities ticked; first and latest recording; tomorrow's story hook | All can-dos are ticked from the curriculum whatever the learner did (`RecapStage.jsx`, `canDoLines(lektion, lang)`; seen on 2026-11-17 after skipping to the end); hook exists |
| The next day | Familiar, curious | Recall one phrase from yesterday, then continue the story | Warm-up and hooks exist separately; not connected |
| After missed days | Welcome, unashamed | "Welcome back. Let's refresh your introduction, then continue." | No return sequence found |
| A checkpoint | Fairly challenged | Say why it exists; report strengths and one repair route | Section feedback and remediation exist |
| End of the course | Independent, realistically confident | A new everyday situation done alone; a list of shown abilities; the next step | Level test and honest certificate are specified; no closing sequence |

## What would break trust (found in the course today)

- `strings.js:307` "Done. The lesson counts at any score …": retire when the final check decides progress.
- `RecapStage.jsx` (`canDoLines(lektion, lang)`) ticks every can-do under "What you can do now" without evidence.
- `strings.js:231` "Intelligibility: {pct} %": a speech-recognition guess shown as a verdict. The recap already words it carefully; use that wording everywhere.
- `strings.js:219` and `:239`: explanations and scored recordings run out for the day. Acceptable for extras, never inside a required check.
- `strings.js:327` "7 days — this is a habit now": celebrate the seven days, do not tell the learner what happened inside them.
- Never: fake improvement, shame for absence, "saved" before the save succeeded, a promise of exam readiness from finishing lessons.

## The otter

A calm guide for adults. It demonstrates, points at one real achievement, offers one next step, and
gets out of the way. It speaks Sie in German and plain language elsewhere. It is never disappointed
by absence, never pleads, never celebrates every tap, never pretends to be a human teacher.

## Where Codex pushes back (not yet verified by Claude unless stated)

- Lektion 2's explanation teaches several things at once (the forms of sein, profession articles,
  nationalities, birth dates) and its writing task is large; split into short explain-then-use cycles.
- Comments in `a11.js` keep a grammar order because the validator requires it; let what the learner
  needs to say decide the order, and introduce useful chunks before their rule.
- Streaks and "last chance" reminders should stay optional support, not pressure.
- Do not promise in words that nobody will ever need outside help; build toward it instead.
- A repeated sentence is not a conversation: the scripted conversation and the final check must
  exist before the lesson model is called complete.

## Build order this implies (Claude's proposal)

1. Proof and an honest end screen: the final check (build brief 4), can-dos ticked only when shown,
   first and latest recording.
2. Help in English and Arabic that never runs out inside a required check.
3. The return: next-day recall tied to the story, and a welcome after missed days.
4. Shorter explain-then-use cycles in Lektion 1 and 2.
5. Asking the learner: one tap at the end of each sitting ("How did that feel?"). Needs a table the
   owner applies and touches analytics, which belongs to the business session.

Cheapest test of the whole frame: five Arabic-speaking beginners play Lektion 1 before and after
step 1; ask each what they can now do, and whether they would come back tomorrow.

## Appendix: Codex's answer in full (2026-11-17, read-only consult)

1. **Verdict on the course design**

[opinion] Keep the overall structure. The biggest opportunity is to make progress demonstrable and help dependable; enthusiasm should follow those experiences.

- [repo] `a11.js` connects reception → personal details → family, with guided scene blocks throughout the course. [opinion] That opening sequence makes sense. However, its comments explicitly preserve grammar order because the validator requires it—even delaying *haben*. Let communicative prerequisites determine sequencing; introduce useful chunks early and explain their patterns later.
- [repo] `buildGuided.js` assembles scene, vocabulary, sound, reading, rule, practice, dictation, fluency, speaking, writing and retries, but no dedicated conversation or final-proof stage. [opinion] Finish those before treating the model as complete: repeating a displayed sentence does not demonstrate independent conversation.
- [repo] L2’s notice in `a11.js` combines the *sein* paradigm, profession articles, nationality forms and birth dates. Its writing task requests a substantial personal-details message. [opinion] Split teaching into small explanation–use cycles; teach one short message before expanding it. The L1 “welcome card” also reads more like assembled teaching examples than a believable reception document.
- [repo] `SceneStage.jsx` alternates hearing, meaning and speaking; `FeedbackSheet.jsx` supports hint-only correction; `FluencyStage.jsx` hides the model initially. [opinion] Keep these. Make vocabulary retrieval active, use sound-only discrimination before displaying clues, and add listening without simultaneous text.
- [repo] `IntroStage.jsx` provides goals and a map; `SessionBreak.jsx` offers stopping; `RecapStage.jsx` puts abilities before scores. However, recap checks off every curriculum can-do regardless of individual evidence. [opinion] Distinguish “practised,” “demonstrated” and “needs another try.”

[opinion] Keep the locked hour in three parts, but treat timings as estimates. The research table in `lesson-design-2026-11-12.md` should inform design, not certify this exact recipe. Likewise, the engagement specification’s streaks and “last chance” reminders should remain optional support.

2. **The emotional journey**

Proposed feelings and actions below are [opinion]. Repository descriptions refer to inspected source, not observed live behaviour.

| Moment | Learner should feel | Concrete action or wording | Existing provision and gap |
|---|---|---|---|
| Opening | Oriented, respected | “Today: introduce yourself at reception. You can pause after each part.” | [repo] `IntroStage.jsx`: goals, map, estimates; needs a shorter route to starting. |
| First three minutes | “I can begin” | Hear a model, say your own introduction, receive one useful response. | [repo] `PretestStage.jsx` starts with supported typing; `SceneStage.jsx` adds speaking afterward. Move the spoken success earlier. |
| Right answer | Competent | “Yes—you gave your name clearly.” | [repo] `strings.js`: “Correct!”; needs occasional task-specific feedback. |
| Wrong answer | Safe, capable of repair | “Try **bin** after **ich**. Your turn again.” | [repo] `FeedbackSheet.jsx`: hint-only support and “Not yet”; needs consistently actionable hints. |
| Failed final check | Supported, still progressing | Name the missing skill, rehearse it, then retry with a fresh equivalent task. | [repo] `buildGuided.js`: no final-proof stage yet. |
| Between parts | Accomplished, free to stop | Name one thing achieved; show the exact return point. | [repo] `SessionBreak.jsx`: stop/continue and saved-place wording; achievement summary is missing. |
| Lesson end | Earned pride | Show demonstrated abilities and an optional earlier/latest recording comparison. | [repo] `RecapStage.jsx`: can-dos and story hook; recording comparison remains proposed in the look README. |
| Next day | Familiarity, curiosity | Recall one useful phrase, then continue the story. | [repo] `buildGuided.js`: warm-up; `a11.js`: hooks. Needs an explicit connection between them. |
| After missed days | Welcomed, unashamed | “Welcome back. Let’s refresh your introduction, then continue.” | [repo] `strings.js`: adjustable plan wording; a dedicated return sequence is missing from the reviewed strings. |
| Checkpoint | Fairly challenged | Explain its purpose; report strengths and one repair route. | [repo] `strings.js`: section feedback and remediation; attempt-window blocking also exists. |
| Course end | Independent, realistically confident | Complete a new everyday scenario; receive an ability portfolio and next-step plan. | [repo] `course-standard-2026-09-12.md`: level test and qualified certificate; the emotional closing sequence needs specification. |

3. **The five changes I would make first**

1. [opinion] **Complete proof and recovery:** this makes advancement credible; manually run fresh tasks and coached retries with beginners, then check unaided transfer afterward.
2. [opinion] **Provide dependable English/Arabic help:** comprehension must survive mistakes and exhausted AI allowances; test a bilingual paper prototype with Arabic-speaking beginners.
3. [opinion] **Simplify L1/L2 teaching cycles:** reduce explanation overload while preserving meaningful speaking; watch learners attempt each target before and after a shortened explanation.
4. [opinion] **Make progress evidence visible:** connect recap claims to actual responses; compare evidence-based and generic recaps, asking learners what improved and why.
5. [opinion] **Design returning explicitly:** make pauses and missed days recoverable; invite learners back after a naturally occurring gap and observe whether they resume without assistance.

4. **What would break trust**

- [repo] `strings.js`: “Done. The lesson counts at any score…” [opinion] Retire this when proof controls progression; explain completion and passing separately.
- [repo] `RecapStage.jsx` checks every can-do beneath “What you can do now.” [opinion] Never claim an ability solely because its lesson ended.
- [repo] `strings.js`: “Intelligibility: {pct} %”; its recap more carefully describes speech recognition as a rough check. [opinion] Use that caution immediately; recognition failure must not become a verdict on the learner.
- [repo] `strings.js`: “You've used all of today's explanations…” and “confirm the line yourself” after recording allowances expire. [opinion] Never make essential remediation unavailable while requiring a pass.
- [repo] `strings.js`: “7 days - this is a habit now.” [opinion] Celebrate the observed practice without declaring an internal psychological change.
- [opinion] Never fake improvement, promise exam readiness from lesson completion, shame absence, or claim saving before persistence succeeds. Avoid promises that nobody will ever need outside help.

5. **The otter**

[repo] `lesson-look-2026-11-17/README.md` selects the otter; its concept picture shows a prominent companion, lesson map and recording comparison.

[opinion] Make it a calm guide: demonstrate, point out a specific achievement, offer one next step, then leave room for the learner’s work. Keep Sie, natural language and restrained expressions. Never make it disappointed by absence, plead for attention, celebrate every tap, or impersonate a human teacher. Offer a quieter presentation.

[opinion] Aim for willing return and growing independence. Learners should be allowed to feel tired or frustrated while still feeling respected and supported.
