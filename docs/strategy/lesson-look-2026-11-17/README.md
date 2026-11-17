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
