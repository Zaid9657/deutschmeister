# Lesson look with the otter, first concept picture (2026-11-17)

Concept picture only: nothing here is built or live.

The founder's partner proposed three companion characters in a design deck on 2026-11-16. On
2026-11-17 the founder was asked "Who guides the learner in the new Lektion 1 picture?" and
answered "The otter". That replaces the 2026-11-12 pick of the teacher Frau Hoffmann as the guide
(`../lesson-look-2026-11-12/`).

| File | What it shows |
|---|---|
| `lektion-1-otter-concept.jpg` | A1.1 Lektion 1 at phone width: lesson map, listen and say, word cards, final check passed |
| `picture-brief.txt` | The exact brief the picture was drawn from |

Made with the Codex CLI's image tool (`codex exec`, ChatGPT login) from the brief and a crop of
the partner's otter slide as the character reference. Higgsfield was not used: the account held
0.2 credits and the picture cost 2.75.

What the picture takes from the partner's deck: the otter, the lesson map with step names and
minutes, picture word cards with "Try from memory", the DE/EN/AR switch and "Explain in Arabic",
and the first and latest recording in the recap. What it keeps from the founder's locked decisions
(`../lesson-design-2026-11-12.md`): about 60 minutes in three parts with saved pauses, speaking
from the first scene, and a final check before the next lesson.

Not decided: the otter's name, and whether scenes show only animals as drawn here or also people.

## Piece 1, built the same day

The founder answered "Yes, build it" to "Should Lektion 1 be built from this picture?". Piece 1
ships the look and the lesson map on the existing Lektion 1; the lesson's steps and texts are
unchanged.

| File | What it is |
|---|---|
| `art-brief.txt` | The brief for the three production drawings (scene, thinking otter, pleased otter) |
| `public/art/a11/l01-rezeption-{1168,800,640}.webp` | The hostel scene, no lettering, cut to 1168x880 |
| `public/art/a11/otter-{thinking,satisfied}-{512,160}.webp` | The guide's two poses, transparent |
| `public/art/a11/{ana,frau-kaya}-160.webp` | Cast portraits cut from the scene (Ana is the otter, Frau Kaya the bird) |

Codex drew the art and wrote the code from a brief; Claude sized the art, ran the tests and
played the screens at phone width. Still to build, one piece each: picture word cards with "try
from memory", Arabic help, the final check with the locked path, and the first and latest
recording on the end screen.

## Piece 2, the otter's voice (2026-11-17)

The founder gave the course's emotional tone to Codex and said "Yes, finish Lektion 1". Codex
wrote every line below and the new ending of the scene; Claude checked each line against what the
course really does, built it and walked Lektion 1 from the first screen to the end at phone width.

| Where the learner meets it | What changed |
|---|---|
| The scene | Ana asks back "Und wie geht es Ihnen?" and both leave with "Auf Wiedersehen" |
| First screen | The otter opens Lektion 1 with one line |
| A wrong answer with one more try | "Not quite yet. You have one more try." and the task's own hint |
| A spoken line | No percentage; words say whether the recording was recognised |
| The pauses | The otter says the place is saved (a guest's first pause is still the save-progress ask) |
| End screen | One line above the list of abilities |
| Back after two days or more | One line on the saved place |

The traveller is still Ana Chakiri from Morocco. The partner's curriculum file of the same day
calls the otter Mika Sommer from Spain; the founder has not chosen. The lines are global strings,
so every guided Lektion gets them when this merges.

## Piece 5, the final check (2026-11-18)

`final-check-concept.jpg` is the picture drawn first (Codex), then built. The founder decided on
2026-11-18 that the check recommends and does not lock: "as long as the users have to pay for that
course, I don't mind it". Payment from Lektion 2 is the business session's piece; the check's end
leads to Lektion 2 as normal and the pay screen will sit there.

| What | How |
|---|---|
| Where | Part 3, after writing and the retry of missed items, before the end screen |
| Turns | Six, at the same reception as the learner themself: greet, own name, write a name Frau Kaya spells, answer and ask how someone is, say goodbye |
| Answers | Spoken when signed in with a microphone (scored against the answer, 80 % of words recognised); otherwise typed. Two low spoken scores switch to typing; "I said it" never counts |
| A miss | One more try; a case slip says "just a typo"; after the second miss the answer is shown |
| Shown | A can-do is shown only when all its turns are |
| After | All shown: the otter's line and Continue. Otherwise the part to repeat, "Try the check again" (a new name to spell) or "Go on" |
| End screen | Ticks only the can-dos the check showed; the others say "Still to practise" |

The otter's five lines are Codex's, from the founder's words. Only Lektion 1 has a check
(`guided.check` in `src/data/curricula/a11.js`); Lektionen 2–12 keep their end screen as before.
A reload during the check starts it again.

## Piece 4, the first and latest recording (2026-11-18)

The founder answered "Yes, phone only" to keeping the two recordings on the learner's device
instead of our servers. Today no voice is stored anywhere: `score-readaloud` transcribes each take
and saves only right or wrong.

| What | How |
|---|---|
| Who | Signed-in learners who recorded with a microphone (guests tap "I said it" and record nothing) |
| Which takes | The first take of the Lektion (in Lektion 1, "Guten Tag. Ich heiße …" with their own name) and the latest one, usually from the final check |
| Where kept | `localStorage` on the device only, one key per account and Lektion (`src/lib/lesson/voiceKeep.js`); the scene, sound, fluency, speaking and check stages opt in, the checkpoint does not |
| End screen | Codex's line, both recordings with their sentence, and "These recordings stay only on this device and are deleted after 7 days" with "Delete now" |
| Deleted | 7 days after the first take, by a sweep on every app load; a learner who never opens the app again keeps them in their own browser until they clear it |
