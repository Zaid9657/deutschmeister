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

### Batch 2 (Lektionen 4–6), 2026-11-20

**The cast is unchanged.** The scenes show Tim and Frau Wolf at the flea market (L4), Lena and Tim
in the classroom (L5), Ana and Herr Weber in the office (L6); `batch-2-scenes.jpg`. Frau Berg, Ana's
boss in Lektion 6, is only heard on the phone: if a later scene shows her, give her an animal not yet
used and add her to the cast list above.

**What the final check can do now (new in batch 2;** `finalCheck.js` comments, `tests/final-check.test.mjs`**):**

- Gap kinds `thing` (after „kaufen", „brauchen", „nehmen": „den Stuhl", „einen Computer", „zwei
  Stühle") and `object` (after „Das ist/sind": „ein Heft", „meine Schere"): a noun the course teaches
  must carry its own article; a mass noun („Papier", `MASS`) may stand without; a frame may say
  `count: 'one'` or `'many'` („Das sind ein Stift" is wrong). A noun the course never teaches must be
  written as a noun („Ich kaufe Bananen", never „Ich kaufe groß"; after an article a small letter is a
  typo). An adjective written small may stand before the noun with the ending its article asks for
  („die große Lampe", „ein rotes Regal"; `ADJ_ENDING`). `color` lists like `language` but is a closed
  class (`COLOURS`, with hell-/dunkel-): „Es ist groß" is no colour. `name`: words the course does not
  teach or the cast's names, after „Frau"/„Herr"; a surname after the first word may be a taught
  lower-case word („Ana Braun"); never the partner's own name.
- A taught word of the gap's kind with an ending is a form, not an own word („rote", „Deutsche").
  A clause after „und" counts only when it is itself a valid answer.
- Around a right answer: a greeting first, the partner's name (with or without a comma; each turn now
  carries `partner`), „bitte" anywhere, „Und"; a noun named first and picked up by a fitting pronoun
  („Der Stuhl, was kostet der?"); the question word last („Der Stuhl kostet wie viel?"); a word in
  front of „ist" („Rot ist mein Heft", „Ein Lineal ist das"); the noun echoed („Die Schere? Da."); a
  noun typed without its umlaut stands for its pronoun as a typo. Each is a rewrite that the frame then
  grades as always, so the wrong verb or article stays wrong.
- Heard prices: „18,00 €", „18,-", number words without umlauts; „18 Cent" for euros is wrong.
- Spoken answers: without a transcript nothing is marked any more (the learner records again and types
  after two tries); the batch 1 note above about the word-measure fallback no longer holds.
- `finalCheck.js` uses `check.js`'s `westernDigits` since the marking fixes were merged (twice: at the
  start of the batch and before the PR, PR 273 at d925fdf4).

**How the checks were proven, to reuse:** DaF review rounds that see the answers until one says
"ship" (four here; from round 3 on, give the reviewer the real grade of every probe answer, with
`graded-examples.mjs` in `tools/`, or it reports behaviour the grader already has), then three
blind corpora written by separate Codex "teachers" who never saw what is accepted, scored against
`typedResult` (`tools/` here: `build-review.mjs` writes both prompts from the code's own comments,
`score-corpus.mjs` scores, `compare-grades.mjs` lists every answer whose grade changes between two
checkouts; the corpora are in `corpora/batch-2/`). The first corpus is in-sample once you fix from
it; report each corpus's FIRST score as the measure. Telling the second teacher to avoid the obvious
answers found five times as many refusals as the first corpus. Batch 2's first scores: 273/280,
231/270, 262/270; after the fixes 280/280, 268/270, 267/270, and batch 1's corpora 181/190 and 186/190.

**Marking problems found, not fixed here** (shared checker, for the marking session): „hir" for
„hier" (a slip in a short word) and „veir" for „vier" (swapped letters in a number word) are still
not typos. `scripts/build-course-words.mjs` read the check's `slot`/`count` values („color", „one")
as German words; batch 2 added both keys to its skip list.

**Open, by design or for the founder:** „Und der Preis für die Uhr?" and „Wie viel kostet die Lampe
da?" are refused (rare; the example then shows a taught form). The second DaF review asked for a
telephone exchange in Lektion 6's scene (can-do 1 sends the learner to Lektion 1's scene, which has
no phone call) and for the task language („mit einem Satz", „Fragen Sie nach …") to be introduced
before the checks, for learners who read neither the German nor the English task: both are course
decisions beyond one batch. No native speaker has read the Arabic of Lektionen 4–6; the blind
back-translation found no drift, and verbs are glossed in the Arabic dictionary form (يشتري for
kaufen). The spoken path was not played (no microphone in the test browser).

**For Lektionen 7–9:** Lektion 9 is followed by Checkpoint 3 (`nextAfter`); Paul (bear, café) and
Herr Schmidt (owl, station) are already on the cast sheet without portraits. Reuse the gap kinds
above before adding new ones; a new kind needs its own wrong-answer tests and a blind corpus.

### Batch 3 (Lektionen 7–9), 2026-11-20

**The cast is unchanged.** The scenes show Lena and Tim after the course (L7), Ana and Lena in the
common room (L8), Ana in the café with Paul the bear as waiter (L9); Paul's portrait is now cut from
the L9 scene; `batch-3-scenes.jpg`. Herr Schmidt (owl) still has no portrait: he comes in Lektion 10.

**What the final check can do now (new in batch 3;** `finalCheck.js` comments, `tests/final-check.test.mjs`**):**

- Gap kinds: `clock` (a clock time as Lektion 8 teaches it or in digits; „halb neun" is 8.30;
  telling the time takes no „um"; a part of the day may stand with it; `time` pins the time and its
  half of the day), `when` (a day, a part of the day and/or a time: „am" takes a day, „um" a time,
  and in a sentence a time needs its „um"; `when` pins the day and time, `whenPartial` lets the day
  or the time alone agree; a written note of a heard afternoon time must say afternoon), `hobby`,
  `activity` (an ich-form verb and what it names; „in Kino" is wrong), `duQuestion` (any correctly
  formed du-question about an activity). Frames may have two gaps („… bin ich … frei.").
- `thing` takes measures („ein Glas Wasser", „zwei Tassen Kaffee") and „mit/ohne …"; per turn
  `slotNot` (no food for a drink order), `only` (accepting names the thing offered, never with
  „kein"), `negative` (a decline names its „kein-" thing).
- Rewrites around a right answer: a fronted phrase with the verb second („Am Wochenende spiele ich
  …"), „gern" after the verb before or after what one likes, „Und du, …?", the partner's name at
  the end without a comma, a question in statement order („Du tanzt gern?"), a tag („…, oder?"), a
  fronted time picked up by „da", small words that change nothing („vielleicht", „heute", „auch",
  „sehr gern"), a bare noun picked up by „den/die", the offered thing echoed, a trailing „danke".
- Typing without umlauts or ß is a typo (`checkLoose`), only when the answer has no umlaut at all,
  so „Mütter" for „Mutter" stays a different word. This lives in the final check only.

**How the checks were proven:** five DaF rounds with the grader's real verdicts in the prompt from
round 1 (`tools/graded-examples.mjs` over the probe sets in `tools/probes/`). Lektion 7 said ship
from round 1; Lektion 9 from round 3; Lektion 8 from round 5. Three blind corpora; first scores
250/270 (92.6 %, no false pass), 238/270 (88.1 %, told to avoid the obvious, no false pass) and
248/270 (91.9 %, the most common answers, two false passes); after the fixes 265/270, 270/270,
270/270 (the five left answer a sitting-2 audio the third review changed). Widening an accepted
frame created four false passes once (agreeing „Ja, am Freitag um elf."): rescore every corpus after
each widening. The 1,200 corpus answers of Lektionen 2–6 grade as before every batch 3 commit.

**After the courses session's check of batch 3 (2026-11-20), one rule each:**

- **An honest "none", decided once for the course:** a turn that asks for a fact of the learner's
  life a real person may not have (a job, a hobby) takes it as a whole sentence („Ich arbeite
  nicht.", „Ich habe keine Arbeit.", „Ich habe kein Hobby.", „Ich habe keine Hobbys."; `HONEST_NONE`
  in `finalCheck.js`, so Lektion 2's two strings left its data). A turn that asks for the can-do in
  the scene does not: „Ich kaufe nichts", „Ich kaufe keine Uhr", „Ich brauche keinen Computer",
  „Nichts, danke", „Sie spricht nichts", „Ich habe keine Zeit" are wrong (before, „Nichts, danke"
  and „Sie spricht nichts" passed, „keine Uhr" too; „Ich kaufe nichts" and „Ich brauche nichts" were
  already refused). A „kein-" thing passes only in a decline (`negative`). Where a fact may be
  missing for some learners (a phone number, a family) the task already says it may be made up.
- **Agreeing:** a turn with `agree` (its words of yes) takes those words in front and grades what
  follows („Prima, dann bis Freitag.", „Gern.", „Ja, gut, bis dann!", „Gut, am Freitag."); Lektion
  8's 53 accepted answers are now 14 answers and frames plus the yes words.
- **A time after „frei"/„Zeit"** („Ich bin frei am Samstag.", „Ich habe Zeit am Wochenende.") is the
  answer with the time before it.

The test sweeps every own-answer turn of every sitting. The 2,010 blind answers of batches 1–3 and
all 473 probe answers grade exactly as before.

**Marking problems found, not fixed here** (for the marking session): typing without umlauts is a
typo in the final check only (`checkLoose`); lesson items still refuse „wie spat ist es".

**Open, by design or for the founder:** Lektion 9's scene has no guest asking „Haben Sie …?" (the
second review asked for one; the scene and its audio are shared by every stage, so the can-do now
also sends to Part 2). Lena's appointment in sitting 2 of Lektion 8 moved to Friday so it no longer
clashes with the time she agrees. No native speaker has read the Arabic of Lektionen 7–9; the first
blind back-translation found a drift in Lektion 8 („Hast du Zeit? for now" read as "about now"),
fixed and confirmed by a second; Lektion 9 glosses haben as لديه, as Lektion 6 does.

**For Lektionen 10–12:** Lektion 10 is Ana and Herr Schmidt (the owl, cast sheet, portrait still to
cut) at the station; Lektion 11 Lena and Tim; Lektion 12 Lena and Ana, followed by Checkpoint 4
(`nextAfter`; there is no Lektion 13). Times and days (`clock`, `when`) carry over to timetables;
prices to tickets (`listen`, `priceDigits`).

### Batch 4 (Lektionen 10–12), 2026-11-20

**Cast:** Herr Schmidt (owl) now has his portrait, cut from the Lektion 10 scene; every Lektion
1–12 has its scene (`l10-bahnhof`, `l11-tag`, `l12-fest`; `batch-4-scenes.jpg`).

**New in the final check** (`finalCheck.js` comments, `tests/final-check.test.mjs`): gap kinds
`month` (a month, or with `day` a date as one writes it, „am 3.5.") and `invite` („zum Fest", „zu
meiner Party", a day); a span of time („von acht bis vier"); every possessive as the article of a
subject („mein Bruder und seine Frau"); a person of the story as a guest; `answerWords` (words that
are an answer alone: yes, goodbye) and `leadWords` (words that may only open one); `none` names the
honest-none fact of a turn whose gap is of another kind; `partOfDay`; a question in statement order
with a noun as subject; a heard price or platform is no clock time; a taught verb form written small
is the verb („frühstücke"); a die-word whose plural is itself is a plural only („die Eltern"); `adjunct`
(„Ich habe im Büro gearbeitet"), `thingsAfter` („Kaufst du am Samstag Brot ein?"), `only` for a place
(one journey per sitting), an ordinal day („am dritten Mai"); heard prices and times are read against
what was heard („15 Fahrkarten" is no price; „Der Zug fährt um neun Uhr dreißig" is the time).

**Proven by:** four DaF rounds with the grader's real verdicts in the prompt. Lektion 12 said ship from round 2, Lektionen 10 and 11 in round 4 (round 3's Lektion 10 blocker came from the evidence file, which labelled turns that differ only in `only` as "every sitting"; `graded-examples.mjs` now labels them per sitting). Blind corpora: first scores 239/260 (91.9 %, eight false passes), 235/260 (90.4 %, told to avoid the obvious, one false pass: „15 Fahrkarten“ as a price) and 250/260 (96.2 %, the most common answers, one false pass: „Was hast du morgen gemacht?“); now 255/260, 258/260 and 257/260. What is left: verdicts given under tasks the reviews then changed („in one sentence“ removed where a short answer is natural; Lektion 12's goodbye asks for a goodbye of this Lektion), „Ich möchte kein Geschenk.“ (the honest-none rule), and two shared-checker rules (a dropped ending „gemach“, a slip in the short word „balt“). The 2,010 blind answers of batches 1–3
grade as before except one Lektion 2 answer that moved from typo to correct („Und Sie, was sind Sie
von Beruf?“); every probe set as intended (200 for Lektionen 10–12, `tools/probes/l10-12.mjs`).

**After the courses session's check of batch 4 (188 own answers, 179 as it would mark them), one
rule each:** a verb of two parts with its prefix still on („Ich aufstehe", „Ich einkaufe gern",
„Einkaufst du …?") is wrong in every activity gap and du-question of the course, and the prefix may
close the sentence („Ich sehe fern"); a sweep test covers every activity gap. „Was hast du gestern
gemacht?" takes any well-formed past sentence (`past`: „habe"/„bin" and a participle at the end, or
„war"; „bin" with verbs of moving or changing; „gearbeiten", „Ich habe aufgestanden", „Ich habe
Lesen gemacht" stay wrong). An invitation may be two sentences („Ich mache ein Fest. Kommst du
auch?"), the day only the party's. Guests are people (`people`: „Ein Stuhl kommt" is wrong). „Ich
wünsche mir …", „Was kostet das Ticket?". The goodbye takes any goodbye again („Tschüss", „Bis
dann", „Bis Samstag"; not „Bis Montag"): this reverses the third DaF review's narrowing, so the
check no longer shows „Mach's gut"/„Bis bald" in particular (the can-do wording waits on Zaid).
Probes for Lektionen 10–12: 247 as intended; corpora 256, 259, 258 of 260; of the 2,790 earlier
blind answers two moved toward the teacher, none away.

**Marking problems found, not fixed here** (shared checker, for the marking session): a dropped
final letter („gemach“ for „gemacht“) is a changed ending, never a typo; a slip in a word under five
letters („balt“) is never a typo. Both are the shared checker's rules; teachers would accept them.

## State of the rollout (2026-11-20)

**What every Lektion 1–12 now has:** a final check in the Lektion's own situation (one or more turns
per can-do, variants on a retake, a part to repeat per can-do, an opening and a passed line by Codex
from the founder's words; Lektion 3, 6, 9 and 12 lead to the checkpoints, Lektion 12 to the fourth,
never to a Lektion 13); the „Explain in Arabic" help (Codex from the English, each batch checked by
a blind back-translation); the scene in three sizes and a 160 px portrait of every speaker. Each
check of Lektionen 2–12 was reviewed by a Codex DaF teacher until "ship" and measured by three blind
corpora (first scores in each batch's section above); Lektion 1 was finished with the founder.

**Never played or seen:**

- On screen: Lektionen 7–12. The built-in browser first could not draw („Screenshot timed out …
  Claude's window is minimized or hidden") and later refused the local server („navigation to
  http://localhost:5191 was denied or failed"); Chrome's window was minimised, 0 px wide, so no
  click lands and nothing draws (the „Check" button sat at x = −95, y = −220). In that Chrome tab
  each of Lektionen 7–12 was then run unseen, as a guest, by pressing the app's own buttons from a
  script (2026-11-20, on 6401c59c): the real check stage, a refused answer and its second try, every
  turn to the passed line and the end screen, the „Explain in Arabic" button opening right-to-left
  text, the scene stage wired to its 640/800/1168 picture (the file served; lazy-loaded, so never
  drawn at 0 px). English: 7, 9, 11; German: 8, 10, 12. Lektion 9 ends on „Checkpoint 3: Lektion
  7–9 →", Lektion 12 on „Checkpoint 4: Lektion 10–12 →". Lektionen 2–6 were played on screen at
  375 px as a guest (batch 1 and 2 sections), not every one in both languages.
- Anywhere: the spoken path of any check (no microphone in the test browsers); course audio (the
  computer voice was triggered in batches 1–2, never judged by a listener); a signed-in run.
- By a person: no native speaker has read the Arabic of Lektionen 1–12; no learner has taken a check.

**Waiting on Zaid:**

- A native Arabic reader for the help of Lektionen 1–12.
- Whether to teach the twelve month names before Lektion 12 (only „im Mai" is taught; the check
  takes a date in numbers instead), and the other course-content points the reviews raised: a guest
  asking „Haben Sie …?" in Lektion 9's scene, a phone exchange in Lektion 6's scene, the task
  language („mit einem Satz", „Fragen Sie nach …") taught before the first check; the departure-time
  question („Wann fährt der Zug?") and „pünktlich / Verspätung" as their own exchange in Lektion 10.
- Can-do wording the last reviews flagged (course text, so not changed here): Lektion 11's „mit zwei
  festen Ausdrücken" (the scene models only „Ich habe gearbeitet"; the check also takes „Ich habe …
  gemacht"), Lektion 12's goodbye can-do (the check asks for „Mach's gut", „Bis bald" or „Bis
  später" and a wish).
- The honest-"none" rule decided in batch 3's follow-up (a job or a hobby may honestly be none; an
  act in the scene may not): a teacher in Lektion 12's corpus would accept „Ich möchte kein
  Geschenk."; say if the rule should widen.
- Merging: the chain #266 → #274 → #275 → #277 → batch 4's PR is unmerged by design.

### After the second independent score (2026-11-22)

- **Three outcomes.** A final-check answer is one of three:
  - *correct*: verified against what the Lektion teaches;
  - *wrong*: a taught frame with a fault the check names;
  - *beyond*: German with a word the course does not teach, which the check therefore cannot verify. The learner reads Codex's line, sees the Lektion's way to say it and answers once more. A second beyond leaves the can-do unshown.

  Rule and outcomes: `typedResult`, `beyondOf` in `finalCheck.js`; screen: `CheckStage.jsx`. Counts per outcome on the eleven corpora: PR 278.
- **Can-do honesty.** `guided.check.shown` holds the check's own line wherever its turns prove less than the can-do says (12 lines). The check summary, the recap and the course home's finished Lektion use it (`shownLines`).
- **Who Frau Kaya is (decided by the courses session, 2026-11-23):** only the L1 hostel receptionist, as the cast sheet says; the gesiezt colleague of L10 and L12 is Frau Ramos, and the L6/L12 boss examples name Frau Berg. Since 2026-11-24 the L3 politeness item (`extra-a11-l03-08`) asks Herr Weber and the final test's Lesen Teil 2 names Ana, so in A1.1 Frau Kaya appears only in Lektion 1 and on the cast sheet.
- **Waiting on Zaid:**
  - ~~whether the 28-day plan's Tag 5 and Tag 21 should keep listening exercise 3, the final test's Hören~~ (Loop round 2: no day of the
    plan opens it any more; to be confirmed);
  - whether the tasks behind the 6 teacher-wrong answers graded correct should ask for digits or a full sentence.

## Loop round 1 (2026-11-24/25): the marking of natural answers, and everything a learner meets around it

The owner asked to build the course to the end, test it, fix what the tests find and repeat in a new session until it is
finished. "Finished" is the recorded bar: an independent score of 7.5 or more, "ready to sell: yes", no BLOCKER, no MAJOR, green gates.

**What was measured on 9420cf51.** Two blind reviewers with the same brief: Codex 6.3 ("no"), Claude 5.8 ("no"). Two browser walks:
all 12 Lektionen in English and German (no BLOCKER), and everything around them (625 screens). Two blind corpora (4,400 right and 2,000
wrong answers, written by two models without seeing a key): the final check confirmed 40 % of the right answers, sent 38 % to "beyond"
and called 22 % wrong; it praised 3 % of the wrong ones.

**The rules that answer it** (tests: `final-check-natural.test.mjs`, the pins of `final-check.test.mjs` moved to them):

- **WRONG only where the fault is certain** (`certainFault.js`): the answer lines up word for word with an accepted one and differs by
  one nameable mistake, or the mistake is one no context makes right (du/Sie, English, verb second, a doubled word, an empty gap). Every
  other fault name of `finalCheck.js` gives BEYOND.
- **What stands around an answer comes off** (`answerShapes.js`): greeting, thank-you, partner's name, counter-question, one small word in
  the middle, „dieser“ for „der“, an indirect question; two or more sentences are graded one by one; the answer itself stays word for word.
- **Every scene line passes as the answer to its own question** (pinned).
- **A determiner and its noun are checked wherever they stand** (`nounPhrase.js`), an own noun's included (`ownWords.js` `NOUN_GENDERS`,
  compounds, jobs by their ending). The note under an own word no longer says "Your sentence is right".
- **English is not German:** small words anywhere, the course's own English and English place names in a gap.
- **Further answers** (`a11.answers.js`): frames, and whole answers one model wrote blind and the other approved as faultless, on task and
  natural. They teach nothing (no word list reads them). The corpora are in `blind-corpus-2026-11-25/`.
- **A hint before the second try** (`check.fault.*`), from the named fault; an answer the check cannot judge is told how the Lektion's own
  answer begins, never the whole answer. Codex wrote the new `check.beyond` line. A heard turn can be passed over when there is no sound.
- **A closed series is shown and can be heard before it is tested** (`guided.read.series`): numbers 0–10 (L2), 11–100 (L4), months (L12).
- **German options** for all 82 comprehension questions (`a11.optionsDe.js`), graded by place.
- **The final test publishes its reading mark** (5 of 8) and names the section when it fails there.

After it, same corpora (in sample): right 85 % confirmed, 15 % beyond, none wrong; wrong 0.3 % praised, 2 % taken as a slip in writing (small nouns).


**Screens and pages, from the two browser walks** (tests: `lesson-walk-l.test.mjs`, `course-pages-ui.test.mjs`, `guided-rollout.test.mjs`):

- **Lektion player:** word explanations never leave the screen (0 of 473 outside at 390 and 360 px); Arabic help keeps its German in
  order; match and listening options stand in an order that says nothing about the answer (`optionOrder.js`); sound options are spelled
  correctly and the answer is never the only one written its way; sound and reading give a second try; gap hints name the side that has
  text; the recap ends the run (no Back), lists what the check showed apart from what is still to practise, and the next Lektion opens at
  its top; focus stays where the learner was (`useKeepFocus.js`); a guest's submitted text and the open word group survive a refresh.
- **Around it:** a failed checkpoint opens on its result, its practice block says what it practises and shares no item with the retake;
  review cards render bold and follow the language; the course home speaks one language at a time; the certificate prints alone with the
  completion date; the final test's result names the section that lost most, and a pass links the certificate.

The sound lines' texts changed („Möchte“ → „möchte“ and others), so recordings made for the old texts do not match any more.

**Dialogue lines changed in this round** (for the recording): Lektion 7 line 8 „Nein, ich tanze nicht gut. Meine Freundin Ana tanzt gern.“;
Lektion 12 line 3 „Der Mai ist ein schöner Monat! Kommt deine Mama auch?“; three new lists (`read-series` in L2, L4, L12).

## Loop round 2 (2026-11-25): checkpoints that measure transfer, the final test, the dialogues before recording, resume and screens

**The checkpoints of A1.1 ask nothing the learner has met.** Before, all 36 dictations and 24 read-alouds were scene lines, no listening
item had a new text, and "every word of the statement stands in the text → Richtig" passed 11 of 16 reading papers. Now each checkpoint has
four authored papers and a retake takes the next one, so nothing repeats:

- **Hören** (`a11.hoeren.js`): per paper two new dictations, three heard texts with a question and three answers, and two new lines to
  read aloud. Gate: `scripts/a11-hoeren-check.mjs` (words taught by then, no sentence of the course, no answer by place, length or order of
  mention, disjoint answer sets). The heard text is printed in the feedback after the whole part.
- **Lesen** (`a11.lesen.js`, rewritten): two statements and two questions per paper. Declared shortcuts, each alone at most 18 of 32
  statements or 16 of 32 questions, and no pair of them passes more than 5 of 16 papers; the Richtig/Falsch pattern varies.
- **Sprachbausteine and Schreiben** (`a11.assessment.js`): 128 reserved tasks, never served in practice. In checkpoints 2–4 two of the six
  Bausteine come from an earlier chapter. A reserved gap may not be printed elsewhere on its paper.
- All 304 units were solved blind by Codex, without keys, from what is printed (`tests/fixtures/a11-hoeren-review.json`,
  `a11-lesen-review.json`); a unit whose text changes has to be reviewed again.
- **Rules from the findings:** a colloquial time is a full hour, a quarter or a half (`untaughtColloquialTime`); a yes/no question to build
  says where the verb stands, not which form opens it (`verbFirstCue`); numbers and months of a shown series count as taught (`seriesWords`).

**Final test.** The Hören part uses the questions of the same recording that need no untaught word (2, 3, 4, 6, 11, 13, 14, 15; no database change);
eight new reading items that are not solved by matching digits, days or words; the English of every task beside the German; a warning
before handing in with open tasks. No day of the 28-day plan opens the test's recording.

**Dialogue lines changed (before the recording):** L8 line 10; L9 lines 7–10; L10 lines 4, 5, 6, 8, 9, 10; L12 line 9. Their exact words are
in `src/data/curricula/a11.js`; the recording plan (`generate-course-audio.mjs`) has them, and 112 new clips for the checkpoints (28 each).

**Final check.** A refresh keeps the turn (verdicts and the chosen person only, never an answer). A thing is no first name and a word said
twice is no name („Ich heiße Banane“, „Banane Banane“ → not confirmed); a made-up activity („Fußballen“) is not praised. „Und Sie, Frau Kaya?“
for „Und Ihnen?“ stays accepted on purpose: it is common German.

**Screens.** Every course screen names itself in the tab and sets the document language (`useScreenTitle`); the skip link follows
Deutsch-Modus; German explanations are sentences (no „→“, „+“, „...“ for words, no English word explaining a German one); the English of the
course says lesson, colour, mum and exercise book.

**Measured on 64213018, honestly.** Two fresh blind corpora (Codex and a Claude subagent, from the 76 typed final-check turns' task texts and
cues alone: 912 right and 608 wrong answers each), measured before anyone read them; then both blind scores with the same brief.

| | Codex score | Claude score |
|---|---|---|
| round 1 (9420cf51) | 6.3, no | 5.8, no |
| round 2 (64213018) | **7.3, no** | **6.4, no** |

Both "no" for the same first reason, which is the owner's: public copy says A1.1 is free (llms.txt, the exam pages, the course card, JSON-LD,
the placement result) while only Lektion 1 is. Their other findings, and what this round did with them:

- **Practice word order** (Codex MAJOR): a yes/no question to build keeps the free order of its phrases after verb and subject
  (`middleFieldOrders` now reads „das Verb steht vorn“ as the opening).
- **BEYOND for no answer** (Claude MAJOR): „asdf“, „x“, „?“ and „Keine Ahnung“ are WRONG (`noAnswer`); faults the Lektion teaches are named
  wherever they stand: a month with „am“ or „in“, an infinitive or the wrong auxiliary in the Perfekt, a verb said twice, the second object
  after „und“, „mir“/„mich“, a strong verb's regular form („sprecht“, „fahrt“). After a BEYOND the screen never tells the learner to begin
  with what they wrote (`beyondStart`: „Your beginning is right …“ and the frame), and a message shows no cast name.
- **Said longer** (`answerRewrites.js`): an adjective with the right ending, a degree word, an occasion, „zu meinem Fest“, „Gibt es …?“ for
  „Haben Sie …?“, a pronoun for the noun before it, „prima“ for „gut“, „Können wir uns … treffen?“, „Wie teuer ist …?“, „Und du, …?“.
  An addition with a fault is never taken off.
- **Looked at once more**: English nouns, letters German does not write, a slip into another word („Puppe“, „Dunst“), a thing that is not
  asked for (a pizza as a drink), „nach der Schweiz“, „der Deutsch“, „am Nacht“, „Es kommt meine Freunde“. Not called wrong any more: other
  ways to say a name, a person spoken to („Hallo Lena, …“), „es“ that holds the place, „der Libanon“, „Hier Yilmaz.“, „Ich studiere.“,
  „Ich bin Syrer.“, „Ich wohne bei meinem Bruder.“, „Sie ist erst zwanzig.“
- **Practice keys**: a spelling accepts letters only; a gap inside a sentence no capital (the capital is the case slip with its second try);
  „Ihre“ for „ihre (sie, Plural)“ is another person (`thirdPersonCaseItem`).
- **Final test**: Hören has its own mark, 5 of 8 (one answer throughout takes 4); the reading item about Frau Novak's break asks what the sign
  says. **Lektion 4** dictates prices its number list does not print; **Lektion 10** asks in German what its English asks.

| Final checks, fresh corpora (right / wrong answers) | 64213018 | after the fixes |
|---|---|---|
| right answers confirmed, all (Codex / Claude corpus) | 70 % / 75 % | **75 % / 80 %** |
| right answers confirmed, only those no list and no round-1 corpus holds | 49 % / 55 % | **58 % / 66 %** |
| right answers called wrong | 16 of 1,824 | **0** |
| wrong answers praised as correct | 17 of 1,216 | **3** (two of them correct German) |
| wrong answers taken as a slip (second try) | 6 | 3 (all three a noun written small) |

Still open (round 3): the rest of BEYOND (about a fifth of right answers), the practice draw (articles in L4–L6, items in two Lektionen, no
prices in practice), structures graded before their notice (yes/no questions, mein/meine, keinen), the W/V example of Lektion 1 in three
languages, three stilted lines (L2, L6, L12) before the recording.

**Evidence (round 2).** Whole suite on an LF copy before the last pin fixes: 3,247 tests, 23 failures: the 16 known path-separator ones and 7
pins of this round's own rules, fixed and re-run green (final-check 38/38, final-check-natural 11/11, checkpoint 81/81, curricula 82/82,
answer-rewrites 9/9, course-assessment-claims, guided-rollout, lesson-pool-rules, a11-final-test, exams, lesson-screens, a11-finish,
course-audio). Validators A1.1 and A1.2 exit 0; both bank gates pass; eslint clean; byte-identical copies. Browser on built copies at 390 px:
12 Lektionen in English and 12 in German to the recap, 12 final checks with wrong and unrelated answers (0 notes), the four checkpoints passed,
failed and retaken (first option throughout: 12–18 %), the final test four ways, course home, review, completion and certificate: 457 screens
around the Lektionen, 0 page errors, 0 failed requests. The round-2 corpora are in `blind-corpus-2026-11-25-round2/` (in sample from now on).

## Loop round 3 (2026-11-25): the final check reads the sentence; practice by can-do; notices before the graded structure

**A second reader for the final check.** Frames and accepted lists confirmed 70–75 % of right answers and sent the rest to "beyond". Beside
them stands a reader now: `clause.js` takes a typed sentence apart (every word has to be read), `clauseOrder.js` says whether the words
stand where German puts them, `taskMeaning.js` whether the sentence answers the turn, `oneRepair.js` names the one change that would make
it the answer. What a turn asks is read off its own accepted answers, so a new Lektion needs no entry.

- CORRECT: every word read, in order, and it says what the turn asks. WRONG: read in full and it is certainly another task, thing, pronoun
  or form of address, or exactly one nameable change makes it the answer. Everything else: "beyond".
- A noun no list knows is welcome where the answer names something of the learner's own, and the note says it was not checked.
- A task that names its form („mit „Ich habe …““) is answered in that form; other good German is "beyond", never wrong.
- Tests: `sentence-reader.test.mjs` (rules, the round-3 corpora as ratchets) and the pins of `final-check.test.mjs`.

**What the generated probes found, and what it says about the corpora.** The blind corpora called the first version nearly clean (2 % of
wrong answers praised). The generated tests of `final-check.test.mjs` (two words swapped, a word of another kind in the gap, a tail) did
not: „Wann ist Pause die?“, „Ich möchte sieben.“, „Das ist meine Mutter und kommen aus Syrien.“ were praised, because the reader looked
only for the words. People do not write those mistakes, so no corpus had them. `clauseOrder.js` is the answer: new praised probes
112 → 2 (swapped), 119 → 14 (another kind), 760 → 5 (tail), 136 → 37 (a word left out; most of these are German), with no right answer of
the corpora lost. A wider set (right answers of the corpora with one article or verb form changed) is praised in 2 % of cases, a good part
of them German („Sage mal, …“). **A corpus measures what people write; only a generated test shows what a grader would accept.**

**Practice.** `practiceRule.topicMin` fills the seats of a Lektion's own can-dos first (numbers in L4, pronouns and sein in L5, sein in L6);
an item stands in one Lektion only (`oneLektionItems`); 76 new items in this round. A practice topic is taught by this Lektion or an earlier one (spiral
review): the validator and its test say so now. A wrong spelling begins as a German word does („Danke / Dakne“, never „Dnake“).

**Notices and lines.** V in Vater like F and in Vase like W (L1); noun with article and plural (L4); kein, keine, keinen (L6); the yes/no
question with the verb first (L7), in German, English and Arabic (Arabic by Codex).
**Dialogue lines changed (before the recording):** L2 line 1 „Guten Tag und willkommen im Amt! Ich heiße Weber.“, line 4 „Ich bin ledig. Und
hier? Kommt hier die Adresse?“, line 5 „Ja, für Post vom Amt. Vorname, Nachname, Wohnort. Und woher kommen Sie?“, line 9 „Danke. Und wie ist
Ihre Telefonnummer?“; L12 reading „Dein Alter? Für uns bist du immer jung!“. L6 plays on Ana's first day at the Amt; its writing sample says „um neun“.

**The independent scores of c6918f2d** (two reviewers, the same brief, no contact): Codex **7.1, "no"** (round 2: 7.3), Claude **6.9, "no"**
(round 2: 6.4). Both name the "free A1.1" claims first (owner area). What they found that is not the owner's, and the rule that answers it:

- **Forms of taught nouns counted as own words** („einen Computers“, „mein Ladekabeln“): a noun a list knows, with an ending it has not behind
  a singular article, is a form. Weak nouns keep their -n („einen Kollegen“ was called wrong), „Wann ist Pause?“ needs no article.
- **Wrong sentences praised in the Lektion's own structure** (51 of 1,562 of the reviewer's wrong answers, 2 after the fixes): a frame
  checks the words around a gap, not their order, so what a frame verifies is read as German too where every word is known (`notRead`);
  a statement with its verb first, „Er ist meine Mutter“, another person's owner („Sein Geburtstag“), „nach Schule“, „eine Zeit“,
  „nicht Kuchen“, „viel alt“, an object the verb cannot have („Ich koche gern Fußball“).
- **Slips on taught words** (122 one-letter slips: 45 → 99 taken as a slip): one letter wrong inside a taught word is a slip of that word,
  decided before own words, English and fault hints; never the first or last letter, an ending is a form.
- **Staatsangehörigkeit is what one is, not where one comes from** (L2 reading and item). **The alphabet** is shown with the letter names and
  heard in L1, as the numbers and months are. **den / einen** are drawn in L4, L6, L9 and L12 (11 new items, `mustCover`). The answer key no
  longer lists „Sie ist schon jung“, „noch alt“, „noch nicht jung“. English tasks no longer say „Start with … Begin with …“.

| Measured | first, unseen | after the fixes (in sample) |
|---|---|---|
| Codex corpus, right confirmed / called wrong | 95.2 % / 1.3 % | 97.5 % / 0 |
| Codex corpus, wrong praised / beyond | 2.1 % / 9.0 % | 0.8 % / 7.9 % |
| Claude corpus, right confirmed / called wrong | 95.9 % / 1.2 % | 98.9 % / 0 |
| Claude corpus, wrong praised / beyond | 1.6 % / 7.6 % | 0.3 % / 5.8 % |
| Claude reviewer's answers, right confirmed / refused | 95.9 % / 0.4 % | 96.2 % / 0.3 % |
| Claude reviewer's answers, wrong praised / beyond | 3.3 % / 17 % | 0.1 % / 18.8 % |

The corpora of round 2, in sample since then: 98.4 % and 99.5 % confirmed, none called wrong. The reviewer's answers are in the notes folder.

**Still open** (for round 4): wrong answers sent to "beyond" (17–24 % in the reviewer's harder sets: honest, but no hint); unknown verbs („Ich
blable gern“) praised with a note; 41 of 75 turns the same on a retake; final test scores listening and reading only; checkpoint texts that
need a new blind review when changed (checkpoint 1 paper 3 gives two people one number, checkpoint 3 dictates „am Mittwoch nachmittags“);
the cast notes of both scores; phone typing („Almost – just a typo“ for a small first letter says nothing about capitals).

**The free claims are corrected** (owner, 2026-11-25: "Yes, correct it"; the wording only: access, prices and limits are as they were). The guided
course is free up to Lektion 1 (`FREE_LEKTIONEN`, gate of 2026-11-22); these places still promised all of it: the login and sign-up panel, About
(and its prerendered twin), Sentence X-Ray, the level-test result, the onboarding slide, the trial-return card, the A1.1 phase plan, the course
home ("everything here is open" to a placed learner without access), the courses overview, the course page's JSON-LD, the grammar pages' button,
the exam hubs, `offers.js`, `marketing.js` and `llms.txt` / `llms-full.txt`. The label comes from `FREE_LEKTION_LABEL` (`src/data/marketing.js`);
`tests/free-claims.test.mjs` reads every page and fails on the old lines. "Start A1.1 free" and the free library stay: they are true.
Not touched: the A1.2 copy on the A1.1 sales page, mails, legal pages.

## Loop round 4 (2026-11-25/26): what the scores of fd8f8dba found, and a hint for the wrong answers the check could not name

**The independent scores of fd8f8dba** (the state after round 3's fixes, the free claims corrected; same brief, two reviewers, no contact): Codex
**7.4, "no"** (round 3: 7.1), Claude **6.6, "no"** (round 3: 6.9). Raw reports in the notes folder of the loop (`codex-score-7-on-fd8f8dba.md`,
`claude-score-on-fd8f8dba.md`). Every finding that is not the owner's has a rule now:

- **Numbers are taught where their series stands** (Codex MAJOR): checkpoint 1 asked for „achtzehn“ and „sechzehn“ because the closed list a dialogue
  may use counted them taught from Lektion 1. `numbersMet` (`src/lib/checkpoint/lexis.js`) binds 0–10 to Lektion 2, 11–100 to Lektion 4 and any number
  to the line that says it; the validator's free list no longer holds numbers. The four texts of checkpoint 1 that used them were rewritten.
- **Wrong forms in the Lektion's own structure** (Claude MAJOR 2): `valencyFault` (`taskMeaning.js`) checks the verb's own prefix, preposition and
  object wherever a sentence reads — „Ich stehe um sechs und dusche.“ (aufstehen), „Ich rufe meine Mutter.“, „Ich höre zu Musik.“, „Ich lade dich für
  mein Fest ein.“, „Kommst du mit meiner Party?“, „Ich habe gestern gemacht.“, „Mein Hobby ist der Stuhl.“; „Ich spiele gern Kino.“ is no game.
- **Wrong plurals** (Claude MAJOR 4): `wrongPlural` reads a taught noun's plural from its Wortfeld row — „zwei Rucksacks“, „meine Freunds“, „zwei Computern“
  (a dative plural keeps its -n, a genitive its -s), „Zwei Freund kommen“.
- **„Aus dem Irak.“ and towns** (Claude MAJOR 3): a country that may have its article takes it in its case („aus dem Irak“); „Bad Homburg“,
  „Frankfurt (Oder)“, „Neustadt an der Weinstraße“ are one name. An answer without a verb where the task asks for a sentence is told so
  (`check.fault.sentence`), never „not checked“.
- **The course home ticks only what the check showed** (Claude MAJOR 5): `checkShown.js` keeps each Lektion's check on the device, `canDoList`
  gives a missed can-do the state `practise`, and KannIch counts it as still to practise. (The account has no column for it: owner migration.)
- **The final test's listening mark** (Claude MAJOR 6): one place throughout (the second option) took 5 of 8 = the mark; the mark is one above the
  better of one key and one place, 6 of 8, and the intro says so.
- **The free claim the round missed** (Claude BLOCKER 1, the class the owner approved on 2026-11-25): the telc B1 page said „Beginnen Sie dann mit dem
  kostenlosen A1.1-Kurs“, `llms-full.txt` „AI-graded with a free account“; both say Lektion 1 now, and `free-claims.test.mjs` catches both shapes.
- **Smaller**: the shown can-do line fits every retake variant (`check-shown-variants.test.mjs`); a fronted „Sie“ that is „she“ stays small
  („Aus Marokko kommt sie.“); the German time items say „in Worten“ as the English does; „Sie spricht arabisch“, „montags bis freitags“, „am Montag und
  am Dienstag“ are read; „Ich kaufe nichts“ is told to read the task, never „one word does not fit“; the checkpoint intro says A1.1 hears texts;
  the bank's strangers are no longer called Brandt (Lena's surname; the gates now know the cast's surnames, `scripts/lib/castNames.mjs`); one phone
  number, one person (`a11-lesen.test.mjs`); checkpoint 3 no longer dictates „am Mittwoch nachmittags“; „Herr Weber ist der Chef“ is gone; the
  checkpoint 1 form is about Thomas Vogt, not Tim; verb second after a time is in the L7 notice („Am Wochenende arbeite ich nicht.“, a line of the Lektion; Arabic by Codex), „Wie spät ist es?“ in the German
  L8 notice; L1's passed line no longer says „all four skills“ (Codex); a typo of capitals only says so (`feedback.typo.case`, Codex) and the check's
  input starts a sentence with a capital; L8's official time is a seat of three answers, so no item stands in all three draws.

**The wrong answers the check could not name** (HANDOVER-loop-3, item 2). `oneRepair.js` names the textbook mistakes: a verb too many („Ich bin komme
aus Syrien“), sein before an infinitive („Ich bin um sechs Uhr aufstehen“), a subject said twice („Meine Mutter sie kommt“), no verb („Ich aus Syrien“),
two prepositions, an article where none belongs („eine Zeit“, „um die sechs Uhr“), a prefix in front of what follows it („Ich kaufe ein gern“). A sentence
that reads but is certainly wrong says why (`certainlyNot`, `clauseOrder.js`): another person's pronoun („Er ist meine Mutter“), „nicht Kuchen“,
„Ich bin kein Hunger“; a question with the wrong question word („Wo kommen deine Eltern?“), the answer said of someone else („Du duschst“), the wrong
verb („Ich möchte Hunger“, „Ich habe einen Kaffee, bitte“). An unknown small word in the verb's place is no longer praised („Ich blable gern“).

| Measured (fd8f8dba → now) | right confirmed | right called wrong | wrong praised | wrong „not checked“ |
|---|---|---|---|---|
| The Claude reviewer's four sets of round 3 (1,203 right, 1,803 wrong) | 94.2 % → 95.7 % | 4 → 14 (10 are fragments now told to answer in a sentence, `check.fault.sentence`) | 5 → 5 | 21.4 % → 13.0 % |
| Corpora of rounds 1–3 (in sample, 8,048 right, 4,432 wrong) | 98.3 % → 98.6 % | 7 → 5 | 20 → 17 | 6.7 % → 5.7 % |
| **Fresh corpora of round 4, first measurement** (unseen; Codex 912 right, 608 wrong / Claude the same) | 95.6 → 95.9 % / 97.9 → 98.1 % | 2 → 3 / 2 → 2 | 16 → 15 / 10 → 10 | 10.2 → 9.7 % / 7.6 → 7.2 % |
| The same corpora after their fixes (in sample now) | 96.1 % / 98.2 % | 2 / 1 | 12 / 5 | 9.7 % / 7.2 % |
| Generated probes (`gen.mjs`) newly accepted against round 3 | swap 1 („nicht Heute, danke.“, a capital slip), fill 0, tail 0, drop 0, double 0 |||

**The independent scores of f0847faa** (this round's fixes; same brief, two new reviewers, no contact): Codex **7.7, "no"** (round 4 start: 7.4),
Claude **7.3, "no"** (6.6). Raw reports in the loop notes (`codex-score-8-on-f0847faa.md`, `claude-score-on-f0847faa.md`). What they found, and
what the commit after f0847faa did with it (those fixes are not scored yet):

- **Codex BLOCKER, fixed:** „Ich esse gern Musik.“ was praised. What one eats is food, what one drinks a drink; one reads or hears neither
  (`SENSE` in `valencyFault`: a noun the Wortfeld teaches outside the food and drink Lektion is neither; a noun only an answer says, „Alkohol“,
  stays the learner's own; `final-check.test.mjs` runs the class).
- **Codex MAJOR, fixed:** „Ich bin Rentner.“ was wrong where L11 asks „Wann arbeitest du?“. Saying one has no paid work is an answer
  (`notWorking`: retired, pupil or student, at home, out of work, „zur Schule gehen“, „studieren“, „keine Arbeit“).
- **Claude MAJOR, open (round 5, first):** the order after the verb is not checked. 12 of 17 probes were accepted: „Ich gehe ins Kino gern.“,
  „Ich fahre nach Berlin morgen.“, „Wann fährt nach Berlin der Zug?“, and „Der Zug fährt nach Berlin?“ where the task asks for a yes/no question.
  Three pool keys accept the same orders (extra-a11-l10-07, -08, -12). Its last example, „Ich bin ein Lehrer.“, stays accepted:
  it is German, and an earlier round pinned „Ich bin eine Studentin.“ as right. But practice item extra-a11-l02-08 treats that article as an
  error, so one of the two must change (round 5).
- **Claude MINOR, fixed:** „Ich heiße Frau Kaya.“ was accepted as one's own name.
- **Open MINORs** (round 5): the L2 message checks only its two frames; „halb sieben Uhr“ and „Viertel nach sieben Uhr“ are graded unevenly;
  L8 T6 refuses „Freitag um Viertel nach vier“ for a heard 16:15; „Habt ihr Tee?“ passes a polite request; the final test's listening is
  a public exercise and its reading paper never changes (owner: access); the „Prüfungsteile“ labels; untaught words in task lines
  (Angebot, ablehnen, Ziel, dorthin, Reise, erfinden, Monat, Jahr); corrections that do not say "whole sentence"; L6's setting.

**Gates of f0847faa:** whole suite on the LF copy: only the 16 path-separator failures of the baseline. Lint 0, byte-identical copies,
validators a1.1 and a1.2 0. CI-style build of a frozen copy (SPA, offline Astro, merge, prerender): 151 pages, 0 failures. Walks of all 12
Lektionen on that build, English and German at 390 px: 1,495 and 1,496 screens, 0 page errors, 0 failed requests.

**Still open** (for round 5, after the order after the verb): retake variants of the 41 turns without one; the checkpoint writing task is the same on every retake; the checkpoint
sentence-building items take one order („Frau Krause hört Musik gern.“ refused); the L2 dialogue gives only „null eins sieben sechs“ and L6's office
number has no real area code; „Ich wohne in Hof.“ (a town that is a noun) is still refused; the stilted lines of HANDOVER-loop-3 item 10.
