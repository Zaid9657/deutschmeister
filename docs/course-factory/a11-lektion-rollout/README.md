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
  - whether the 28-day plan's Tag 5 and Tag 21 should keep listening exercise 3, the final test's Hören;
  - whether the tasks behind the 6 teacher-wrong answers graded correct should ask for digits or a full sentence.
