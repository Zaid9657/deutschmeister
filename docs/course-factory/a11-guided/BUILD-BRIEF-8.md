# Codex build brief 8: the daily loop — cared for, optimistic, proud — 2026-11-14

Follows briefs 1–7. Read `CLAUDE.md` first. **Start only after brief 7 is merged into the tree you
work in.** This brief is about how a learner's **day** in the course begins and ends.

## What the founder decided (2026-11-14)

Asked which feelings the course must give every learner, he answered:

> "being taken care of, being optimistic, being proud of progress and learning, we should trigger
> these emotions each day so they get addicted to learning"

So, every day a learner opens the course, three things must happen, in the product, not in
marketing copy:

| Feeling | What the learner must experience that day |
|---|---|
| **Taken care of** | Someone knows them: their name, where they stopped, what was hard yesterday, and has today's plan ready. They are never left stuck and never scolded. |
| **Optimistic** | They see that their real goal (the exam date, the move to Germany) is reachable, and they start with something they can already do. |
| **Proud** | They leave with proof of what they learned today, in words about real life, and see it added to everything they can already do. |

Sales number this serves: learners who come back on a second day (16 of 165 sign-ups did, before
the new flow). A subscription lives on daily return.

Ship the simplest version that does this with data the app already has. No new SQL unless
unavoidable (then owner-applied, fail-soft, as in brief 1). No new endpoints. No AI calls.

## What exists and must be reused

- The teacher's identity as data (Frau Hoffmann, portrait `public/art/a11/teacher-160.webp` /
  `-512.webp`, marked as an AI teacher) in `src/data/curricula/a11.art.js` / `a11.meta.js`.
- The dated plan: `src/lib/course/plan.js` (`planFor`, `profiles.exam_date`), shown on the course
  home (`src/pages/CurriculumHomePage.jsx`), with the one-tap ask when no date is set.
- Progress, attempts and the proof's first-try results per can-do (brief 4), the review ladder,
  streak milestones (`src/lib/course/milestones.js`), the saved run, the recap's can-dos and the
  story hook (`nextHook`).
- The learner's name: the profile's name for signed-in learners. A guest has none stored; do not
  start storing one. Without a name the lines work without it.

## Part A: the day opens — a "Today" card on the course home

At the top of the A1.1 course home, above the path, one card in the teacher's voice (her small
portrait, her name, the label that she is an AI teacher):

1. **A greeting that knows the learner:** by name when there is one, and by situation, derived
   from data, never typed per case by hand beyond a small set of templates:
   first day; came back the next day; came back after a break (welcome, the place was kept;
   **never** a word about what was missed); mid-Lektion (a saved run exists); a Lektion finished
   yesterday; a proof goal that needed re-teaching yesterday ("yesterday the goodbye took two
   tries; we start with it today") from the proof's first-try data.
2. **Today's plan, ready:** what today holds (the next part or Lektion, the due review cards), in
   one line with the flow-aware time estimate, and one primary button that starts exactly that.
3. **The road to the goal:** from `planFor`: day N, Lektion X of 12, and whether the exam date is in
   reach at this pace, said plainly and kindly. When no date is set, the existing one-tap ask.
   Never a countdown that threatens, never red.

German and English (the lesson view language), **Sie** in German. Tokens only. The card must not
push the path below the fold on a phone: keep it compact, with the path visible.

## Part B: the day starts with something they can do

When a learner starts the day's session, the first checked thing is a **quick win from what they
already proved**: one or two items of earlier material they passed (the existing review/warm-up
mechanism; do not build a second one), framed as "you still can": so the first feedback of the
day is a right answer. A brand-new learner's first session keeps the existing first-sentence
step, which already does this. Report how the existing warm-up is selected and what you changed
so that it prefers material the learner got right before.

## Part C: the day closes — pride, and tomorrow

On the recap of a guided Lektion, and on a shorter "day done" card when the learner stops at a
saved pause:

1. **Today, in real-life words:** the can-dos shown today (from the proof where the Lektion has
   one), each as one line the learner could say to a friend ("Today I can introduce myself and
   spell my name"), derived from the can-do text.
2. **The growing list:** "You can now do N things in German", N counted from completed can-dos
   across the course; one tap opens the full list. No XP, no points, no leaderboard.
3. **Tomorrow's promise:** the story hook plus the next Lektion's first can-do ("Tomorrow: you
   register at the office").
4. **The streak, kindly:** days in a row with **one rest day a week that does not break it**; shown
   only as encouragement. Never a warning that it will be lost. If `milestones.js` cannot express
   the rest day, extend it there with tests.
5. One closing line from the teacher.

Can-dos still lead the recap; scores stay in the closed details (`CLAUDE.md`).

## Part D: the reminder mail speaks with the same voice (text only, no sending change)

`netlify/functions/course-reminder.mjs` exists. Do **not** change when or to whom it sends, its
flags, claims or guards. Prepare, as a draft for the owner, the texts a daily message from the
teacher would use (caring, optimistic, one line of what today holds, one button), German and
English, in `docs/course-factory/a11-guided/daily-message-drafts.md`. Brand messages need the
owner's approval before anything is sent; nothing in this brief sends or schedules mail.

## Never

Guilt, fake urgency, a threat of losing something, comparing the learner with others, praise for
nothing (pride needs something real behind it), a claim about results the course has not measured.

## Rules that stay binding

As in briefs 1–7: protected tests unedited; names are never stored for guests; analytics behind
consent with step names through `src/data/events.js` and its synced copies; derive, never retype;
A1.2's course home and lessons behave as today unless the same card can be shown there with no
A1.2-specific code and no change to its tests (say which you chose); do not edit `CLAUDE.md` or
`astro-site/package-lock.json`; never weaken an assertion; do not stop to ask.

## Tests

Each greeting situation from constructed progress data, including "after a break" containing no
word about absence; the plan line and its button target; the goal line with and without an exam
date; no name stored for guests; the quick win prefers passed material and is the first checked
item of a returning day; the "you can now do N things" count; the rest day in the streak; the day
card at a saved pause; German texts with Sie; nothing rendered for a Lektion or course the card
does not support.

## Gates and report

The same gates as brief 7, all green at the end from a clean `dist/`. Write
`docs/course-factory/a11-guided/build-report-8.md` as you go: every template text in both
languages; which data each line derives from; what was reused and what was added; anything open.
`.git` is read-only: do not commit. `node_modules` and `astro-site/node_modules` are symlinks: do
not install anything.
