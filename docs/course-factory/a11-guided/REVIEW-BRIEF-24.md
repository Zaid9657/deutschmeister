# Review brief: A1.1 on the guided flow, teacher review #24 — 2026-11-14

You are **reviewing, not building**. Change no file except the report named at the end.

## Who you are for this review

A teacher of German as a foreign language in adult education (integration courses) and an examiner
for Goethe-Zertifikat A1 *Start Deutsch 1* and telc Deutsch A1: the same reviewer role as the
earlier ladder (`docs/course-factory/a11-rebuild/REVIEW-daf-2026-09-12.md` to `REVIEW-daf-23-…`).
Read review #23 first for the scale and the way findings are written, and keep to it so the
numbers can be compared.

## What is new since review #23

All twelve A1.1 Lektionen now run on a new "guided" flow (live since 2026-11-14): the dialogue in
short chunks (hear 2–3 lines, a checked meaning question, say one line aloud), word cards for the
scene's words, a checked sound stage, a short real text with two questions, then the grammar
notice, practice with a hint and a second try before any answer, a fluency round, speaking,
writing, recap with a story hook. None of this has been reviewed by a teacher.

Sources: `src/data/curricula/a11.js` (each Lektion's `guided` block, `nextHook`, and all the
existing fields), `src/data/lessonPools/a11.json`, `src/lib/lesson/buildGuided.js`,
`guidedSound.js`, `guidedFeedback.js`, `guidedRead.js`, the stage components under
`src/components/lesson/`, `docs/strategy/lesson-design-2026-11-12.md` (the design and the research
it rests on), `docs/course-standard-2026-09-12.md` (the standard), and the writers' own doubts in
`docs/course-factory/a11-guided/content/l02.json` … `l12.json` (`notes`).

## The question the founder wants answered

His words: "i dont want the user to be needing any source to learn the language or to feel that
he needs a teacher or a language learning center." His own course "was throwing informations and
hoping i would learn somehow, not too much speaking was done."

So judge each Lektion as a learner with **no teacher and no other source** would meet it:
can this person, alone, understand what to do at every step, learn what the Lektion promises, and
be able to do its can-dos at the end?

## What to judge, per Lektion

Build each Lektion the way the app does (`buildLesson`) and go through its stages in order.

1. **German:** every sentence a learner reads or hears is correct and natural at A1, and the
   people and facts of the story agree across Lektionen.
2. **Sequence:** nothing is asked before it is taught; the taught-words rule holds in spirit, not
   only by the validator's letter.
3. **The two-minute rule:** the learner never gets more than about two minutes of input without
   producing something that is checked. Name every stretch that breaks it.
4. **Checks that really check:** for every meaning question, read question and sound task: can it
   be answered right without understanding the German (by length, by position, by elimination,
   from general knowledge, from the English next to it)? Is exactly one option defensible?
5. **Speaking:** how much does the learner actually say aloud, and is what they say worth saying
   for the can-dos? Estimate the share of the Lektion spent producing language.
6. **Sound:** does each sound task teach or test anything real, given that the audio is the
   browser's computer voice? Name the ones that are only reading a marking off the screen.
7. **Hints and feedback:** does a hint help without giving the answer away; does the feedback
   after the second try explain the reason in words a beginner follows?
8. **The read text:** is it something a person in that situation would really read, or a list of
   words dressed up as a text?
9. **Can-dos:** for each can-do, where does the Lektion teach it and where does the learner show
   it? Name every can-do with no evidence.
10. **Alone:** every place a learner without a teacher would be stuck, misled, or would need to
    ask someone.
11. **Exam fit:** does the Lektion move a learner towards the A1 exam tasks it claims
    (`examTeile`)?

## How to write findings

- BLOCKER / MAJOR / MINOR as in the earlier ladder, each with: Lektion, stage, the exact text or
  item id, file and line, why it harms a learner, and the smallest correction.
- Prefer a finding **class** with a proposed rule that a validator or test could hold, over a list
  of single spots. Give the count and three examples.
- Give each Lektion a score on the earlier scale and the course mean, and say plainly whether the
  number can be compared with review #23 (the flow changed).
- Separate what you **verified by running or reading the built lesson** from what you infer.
- Do not soften. Do not praise to balance. If something is good, one line.

## What you cannot judge here, say so

You cannot hear the audio, use a microphone, or watch a real beginner. List what only a played
session with real learners can answer (see
`docs/course-factory/a11-rebuild/EVIDENCE-PLAN-2026-10.md`).

## Output

One file: `docs/course-factory/a11-guided/REVIEW-daf-24-2026-11-14.md`, in English with the
German quoted exactly. It opens with **ten lines for the founder**: the verdict on his question,
the three things that most stand between this course and "no teacher needed", and the score.
Then the per-Lektion table, then the findings by class, then the single spots, then what could
not be judged. Change nothing else. Do not commit.
