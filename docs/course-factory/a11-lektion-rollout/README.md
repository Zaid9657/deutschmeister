# A1.1 Lektionen 2–12: the Lektion 1 treatment (rollout brief, 2026-11-19)

The founder (Zaid) finished Lektion 1 with the courses session on 2026-11-18 and then said:
"continue till the end be the orchestrator and open side chats with models opus 5.5 , do everything
right and make it perfect". This file is the shared brief for the sessions that bring Lektionen
2–12 to the level of Lektion 1. Each batch appends its hand-over notes at the end.

Read first: `docs/strategy/lesson-look-2026-11-17/README.md` (what Lektion 1 got, piece by piece),
`docs/strategy/lesson-design-2026-11-12.md` (the founder's locked decisions) and `CLAUDE.md`.

## What every Lektion 2–12 still needs

Lektionen 2–12 already have the guided flow and everything that is global: the otter's voice, "Try
from memory" on the word cards, the two recordings on the end screen. Three pieces exist only in
Lektion 1:

| Piece | Lektion 1's version | What Lektionen 2–12 have today |
|---|---|---|
| Scene picture and cast | `public/art/a11/l01-rezeption-{1168,800,640}.webp`, portraits `ana-160.webp`, `frau-kaya-160.webp`, wired in `src/data/curricula/a11.art.js` | Old inline SVG objects (`src: null`) |
| Final check | `guided.check` in `src/data/curricula/a11.js` (L1), `src/lib/lesson/finalCheck.js`, `src/components/lesson/CheckStage.jsx`, `tests/final-check.test.mjs` | None; the end screen ticks every can-do |
| Arabic explanation | `notice.bodyAr` in L1, shown by `NoticeStage.jsx` ("Explain in Arabic") | None |

## Batches (one session each, one after the other, each on a branch cut from the batch before)

| Batch | Lektionen | Extra |
|---|---|---|
| 1 | 2–3 | Make the final check general (below) and draw the cast sheet for all six new characters |
| 2 | 4–6 | |
| 3 | 7–9 | |
| 4 | 10–12 | Lektion 12 has no "Lektion 13": the check's closing line must say what really comes next |

The chain starts from `claude/exciting-matsumoto-ce6cf2` (PR #266, not merged). Each batch opens one
PR whose base is the branch it was cut from, and merges nothing.

## Piece A: the final check

The idea, from Lektion 1: the same situation as the Lektion's scene, but the learner is now
themself and nothing is shown to copy. One or more short turns per can-do (`canDo` index); a
can-do counts as shown only when every one of its turns is. Spoken when signed in with a
microphone, typed otherwise. One more try, then the answer. The summary names the part of the
Lektion to repeat (`repeat`, one entry per can-do) and offers "Try the check again" and "Go on".
The end screen ticks only what was shown.

Founder decision, 2026-11-18: the check recommends and never locks ("as long as the users have to
pay for that course, I don't mind it"). Nothing in a check may block the way to the next Lektion.

Lektion-1-only wiring that batch 1 must make general, each with a test:

- `CheckStage.jsx` prints the speaker label "Frau Kaya"; the partner's name must come from the
  check's data.
- `otter.check.open` in `strings.js` says "…you'll speak with Frau Kaya using your own name"; every
  Lektion needs a true opening line (see "Lines that speak to feelings").
- `otter.check.notYet` ends with "go on to Lektion {next}" (`lektion.nr + 1`); Lektion 12 has none.
- `checkTurns` rotates only `spell` names on a retake. Where a turn can honestly vary on a retake
  (a price, a time, a number, a name), give it variants so a retake is not the same paper.

Content rules for each check:

- Only German the learner has met up to and including that Lektion. Lektion 1's first draft asked
  "Wie geht es ihr?", which the course had not taught; it became "Und Frau Kaya? Fragen Sie."
- Tasks and cues speak **Sie**; only learner dialogues may duzen.
- `accepted[0]` is the model answer and the spoken target. The typed lists must take every correct
  answer a learner at this point would plausibly give. Close a class of wrongly rejected answers
  with a checker rule and a test (`src/lib/lesson/check.js`), never by a longer list alone.
- Every can-do of the Lektion has one or more turns; every can-do has a `repeat` part.
- Make it fair before it ships: (1) an independent read-only Codex pass as a DaF teacher on each
  check (is each turn answerable from what was taught, is anything ambiguous, is a correct answer
  missing); (2) a blind corpus: Codex writes plausible right and wrong learner answers per turn
  without seeing `accepted`, and every one must be marked as a teacher would mark it.

## Piece B: the Arabic explanation

`notice.bodyAr` for each Lektion: Modern Standard Arabic, from `notice.bodyEn` only (adds nothing,
drops nothing that matters), plain enough for an adult who may have had little schooling, polite,
German words stay in Latin letters, no Arabic transliteration of German sounds, about the length of
the English. Codex writes it. Then a second, separate Codex run that has not seen the English
translates the Arabic back to English; compare the two and fix any drift. No native speaker has read
any of the Arabic yet: say so in the PR.

## Piece C: the scene picture and the cast

Pictures are drawn by the Codex CLI's image tool on the ChatGPT login (no Higgsfield credits).
Lektion 1's brief is `docs/strategy/lesson-look-2026-11-17/art-brief.txt`; keep its rules:

- The same flat, softly textured illustration style and palette (dark teal, coral, warm cream, soft
  grey-blue). The cast are animals: Ana is the grey river otter with the coral satchel, Frau Kaya
  the blue-grey and white bird with the coral scarf.
- **No text of any kind in a picture**: no letters, numbers, signs with writing, labels or logos.
- A scene is landscape 4:3 with both speakers fully visible and room around them; it ships cut to
  1168×880 plus 800 and 640 wide, as WebP (`sharp` is installed), under `public/art/a11/`.
- Portraits are 160 px WebP cut from the scene, so the cast list shows the figures the scene shows.
- `a11.art.js` gets `src`, `srcSmall`, `srcMedium`, `width`, `height` and an `alt` that describes
  the new picture. `tests/course-art.test.mjs` pins the manifest.

Batch 1 first draws ONE cast sheet for the six characters without art (Herr Weber, Lena, Tim, Frau
Wolf, Paul, Herr Schmidt), each a different animal that fits the person and stays the same in every
later scene, and commits it here as `cast-sheet.png` with one line per character. Later batches
attach it as the reference. Whether scenes show only animals or also people is not decided by the
founder; Lektion 1 shows only animals, so stay with animals and say so in the PR.

References for Codex (`-i`, after the prompt): the Lektion 1 scene and an otter pose converted to
PNG with `sharp`, later also the cast sheet. Look at every picture yourself before it is committed:
no lettering anywhere, the right characters, nothing cut off at the three sizes. Also commit one
contact sheet per batch here (`batch-<n>-scenes.jpg`) so the founder can be shown the pictures.

## Lines that speak to feelings

The founder gave the course's emotional tone to Codex. Any learner-facing line about feelings (the
otter's lines, openings, replies to a miss, endings) is written by Codex from the founder's own
words, with no rules added by Claude; Claude only checks that each line is true for what the course
does. Plain facts (labels, privacy notes, task instructions) need no Codex. The founder, verbatim:

- "this is an emotional frame. We are containing the people and we are setting the emotional tone.
  So I don't think if it's the right idea to set this as fixed rules."
- "the emotional frame for ... the users, to be always enthusiastic and excited about learning from
  the course, and to be always proud that they are learning and improving, and to get positive
  feelings and emotions from learning from our course ... to trust us with the time, because trust
  is very important."
- "being taken care of, being optimistic, being proud of progress and learning, we should trigger
  these emotions each day"

The learner, as briefed to Codex so far: an adult, often an Arabic speaker newly in Germany,
learning after a long working day, on a phone, alone; many have failed at German before. Lines
Codex already wrote and that are live in the lesson: "Welcome to your first conversation in German.
Take your time." / "Not quite yet. You have one more try." / "This time, you'll speak with Frau
Kaya using your own name. Take your time." / "You spoke German today. Take a moment to listen to
yourself."

## Not yours

- Sign-up, email, SEO, analytics, payments, access and entitlement code, and every "free" /
  „frei“ / „kostenlos“ label: the business session owns them (its PR 270 holds the pay gate from
  Lektion 2, still switched off). Course text must not promise that the trial opens the course.
- Owner-only: prices, access, legal, anything posted under the brand, security/RLS, `CLAUDE.md`.
- Marking problems outside the checks (items, the shared checker's behaviour on lesson items):
  another session is re-landing the October fixes on `claude/a11-marking-fixes-f758b7`, cut from
  main. Do not fix those here; list what you find in your hand-over notes.
- Never generate course audio, and never use the Azure key or the Supabase service_role key that
  leaked on 2026-10-15.

## How to verify (each Lektion, before the PR)

- After content edits: `node scripts/build-lesson-pool.mjs a1.1`, then
  `node scripts/validate-curriculum.mjs`; restore pool or rule-card files that come back with only
  line-ending changes (`git checkout --`). After a shared file: `node scripts/sync-shared.mjs`, then
  `npm run check:duplicates` (the Astro twin of `a11.js` must stay byte-identical).
- Before changing a component or adding a stage, grep every test for its file name and the
  neighbouring stage names; some tests run component source in a `vm` with their own props list.
- `npm run lint` clean; the build passes (`npx vite build`).
- Tests: on this Windows machine 127 tests fail on main for line-ending reasons; judge by new
  failing names and let CI (Linux) be the gate. `tests/curricula.test.mjs` takes 6–10 minutes and
  prints nothing until the end: run it alone, in the background, with a 15-minute limit. Run other
  course tests one file at a time.
- Play each check in a real browser at 375 px as a guest, in English and German: a pass, a miss
  that shows the answer, a retake, "Go on" to the end screen. A check can be opened directly by
  saving a run snapshot with `stageKey: 'check'` (`src/lib/lesson/runState.js`, `saveRun` +
  `packRun({ flow: 'guided', stageKey: 'check' })`) and reloading `/course/a1.1/l/<nr>`. Open the
  scene and the "Explain in Arabic" button too. Green tests are not a played lesson. The spoken path
  cannot be played without a microphone: say so.
- Read CI once after pushing; never poll it.

## Tools on this machine

- Codex only from the PowerShell tool, as a background job, reasoning effort high (never xhigh or
  max): put a UTF-8 `brief.txt` in an empty folder `<d>` and run
  `cmd /c "codex.cmd exec --skip-git-repo-check -C <d> -s read-only -c model_reasoning_effort=high -o <d>\answer.md "Read the UTF-8 file brief.txt in this folder and do exactly what it says." > <d>\run.log 2>&1 < NUL"`
  (inside PowerShell the inner quotes are backtick-escaped). For pictures use `-s workspace-write`
  and `-i <d>\ref.png` AFTER the prompt; the brief tells Codex to save PNGs in the folder. Codex's
  sandbox cannot run `node --test` or `vite build`.
- `gh` is `C:\Users\zaid1\tools\gh\bin\gh.exe` (not on PATH).
- Commit with `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit -F <file>`;
  PowerShell breaks quotation marks inside `-m`.
- At most two side jobs at a time on this machine (16 GB).
- Do not commit the untracked `.agents/`, `.codex/`, `AGENTS.md` or `.claude/launch.json`.

## Done, per batch

One PR (base: the branch you were cut from; do not merge) whose description lists, per Lektion: the
check's turns, the Codex teacher review and blind-corpus result, the Arabic with its back-translation
result, the pictures, what was played in the browser and what could not be seen. A dated entry at
the start of the Notion board page `40a3bad2-148e-812d-8a84-dfa25cba1838` (`### YYYY-MM-DD — Title`
with `<b>Label:</b>` bullets). A row in `.planning/lessons.md` for each lesson learned. Hand-over
notes for the next batch appended below. The PR link at the start of the final report.

## Hand-over notes

(Each batch appends a short section here: what it generalised, the cast's animals, what the next
batch should reuse, and marking problems it found but did not fix.)

### Batch 1 (Lektionen 2–3), 2026-11-19

**The cast** (`cast-sheet.png`, left to right; every later scene keeps these animals and clothes):

- Herr Weber: a badger, grey and white with the striped face; grey-blue shirt, dark teal tie and waistcoat.
- Lena: a light brown hare with long ears; coral sports jacket, cream T-shirt, white trainers, teal sports bag.
- Tim: a red fox; dark teal hoodie and jeans (holds a lamp on the sheet).
- Frau Wolf: a hedgehog with brown spines; round glasses, coral apron over a grey-blue dress.
- Paul: a brown bear; cream shirt with rolled sleeves, long dark teal waiter's apron.
- Herr Schmidt: a brown-and-cream owl; dark teal railway jacket, peaked cap with a plain coral band.

Scenes show only animals, as Lektion 1 does; the founder has not decided whether people may appear.

**What the final check can do now** (`src/lib/lesson/finalCheck.js`, header lists every turn kind;
`tests/final-check.test.mjs` pins each):

- `partner`, `open`, `passed` per check; the closing line names the real next step on the course
  path (`nextAfter`: Lektion 3 and 12 lead to a checkpoint, so nothing ever says "Lektion 13").
- Own answers: `…` in an accepted answer is the learner's own words. Gap kinds `place`, `job`,
  `language` take the taught words that fit (`slotWords`: `CHECK_PLACES`, `CHECK_JOBS`,
  `CHECK_LANGUAGES` in `a11.js`) or any word the course never teaches, and reject taught words of
  another kind ("Ich bin müde" is no job); `number`, `years`, `phone`, `date` (a real calendar
  date). A choice gap (`slotIn`) takes one of its words, then at most a name; the turns after it
  follow the learner's choice (`nounFor` + `chosen` in `CheckStage`).
- `listen` (a heard number, typed; a label or Arabic-Indic digits are fine), `parts` (a short message:
  each part a sentence or an "und"/comma clause, plus greetings and `extras`), `write`, `variants`
  (one per retake), `example` (shown as "For example" after two misses).
- Spoken answers are graded on the transcript like typed ones (this also fixed Lektion 1's spoken
  own-name answer, which could never pass); the 80 % word measure is only the fallback without a
  transcript.
- RULE 35 in `scripts/validate-curriculum.mjs`: cues, heard numbers, model answers and examples use
  only taught words.
- `src/lib/lesson/bidi.js`: German runs inside the Arabic help keep digits, slashes, colons and
  arrows in one left-to-right piece; long German sentences may wrap.

**Reuse for batch 2:** copy the L2/L3 check shape; run the review inputs the way batch 1 did (a
DaF review that sees the answers, then a corpus written blind, scored against `typedResult`; three
rounds were needed here). Describe the grading to the reviewer from `finalCheck.js`'s own comments,
or it reports faults already fixed. Codex must get non-ASCII input on standard input
(`codex exec ... - < input.txt`); scan its Arabic for control characters (an arrow came back as
U+001A). Reference images for scenes: the L1 scene, `otter-pose.png`, `cast-sheet.png`.

**Marking problems found, not fixed here** (shared checker `check.js`; for the marking session):

- An adjacent transposition is never a typo ("Eltren", "jugn", "Brduer", "gebroen"); a blind
  teacher counted each as a mere slip. In the check the learner still gets the second try.
- A slip in a word of four letters or fewer is never a typo ("at" for "alt").
- Arabic-Indic digits are folded only inside the final check (`westernDigits`); lesson items and
  dictations of numbers still reject „٠٤٢١".

**Open, by design or for the founder:** the check cannot know whether a word the course never
teaches really is a place, a job or a language (it accepts it as the learner's own); a learner who
types instead of speaking shows numbers by writing them, not by saying them; "zehn" is not heard in
the Lektion 2 check (phone numbers are digits); no native speaker has read the Arabic of Lektionen
1–3, and the back-translation flagged „حرف متحرّك" (vowel) in Lektion 3 as a word a native speaker
should check.
