# Guided A1.1 Lektion 1 — build report 2

Date: 2026-11-12. Scope: BUILD-BRIEF-2, step 2 for A1.1 Lektion 1 only.

## Result and scope

Implemented hint-first correction, the checked sound slot, the short read, the four-line fluency
round, the recap hook, in-memory name reuse, the three-part intro estimate, and Frau Hoffmann's
data-only identity. The sound, read and fluency stages are lazy-loaded.

The brief was corrected during this run: its late 2026-11-12 correction keeps `requeue` immediately
before `recap`, in Part 3. The implementation follows that corrected brief. The owner-supplied
change to BUILD-BRIEF-2.md is preserved; the protected back-navigation test is unedited. The earlier
request about changing that test is superseded by the corrected brief.

All original L1 fields, including the original guided chunks, remain unchanged. A structural
comparison against HEAD, removing only the additive `guided.read` and `nextHook` fields, confirms
that the entire original A1.1 curriculum is identical. All L2–12 and A1.2 data, the legacy builder,
checker and mastery calculation remain unchanged. There is no commit, deploy, database change,
new endpoint, teacher control, Arabic, proof, lock, subscription change or generated audio.
`CLAUDE.md` and `astro-site/package-lock.json` are untouched.

## Built order and saving

| Part | Stages |
|---|---|
| 1 — Understand and say | `pretest`, `scene`, `wortfeld` (11 scene words), `sound` (3), `read` (welcome card and 2 questions) |
| 2 — Learn and practise | `notice`, `practice` (7), `derived` (3), `dictation` (2), `fluency` (4 lines) |
| 3 — Use it | `speaking`, `writing`, `requeue`, `recap` |

Due review cards still precede the pretest. Empty requeue is skipped. Both saved part pauses
remain; the guest save ask still replaces the first pause. Standard Back behavior and every
protected test remain in place.

New sound and fluency positions use the player's item index. Their speech results are saved as
numeric/boolean-only maps using the existing read-aloud sanitizer; no names, transcripts or
recordings are added to snapshots. A resumed sound item can replay its question before continuing;
an already saved spoken confirmation still satisfies its speaking requirement. Run version and
guided/legacy flow tags are unchanged. Completion still uses the existing local-first outbox.

## New content and behavior

### Hints and correction

`src/lib/lesson/guidedFeedback.js` derives bilingual hints from the exercise type: gap context,
word order, spelling/punctuation, replaying the dictated line or comparing listening options.
It checks both language versions against every accepted answer, folding case, umlauts and
punctuation at phrase boundaries. This avoids both leaking an answer and mistaking a letter such
as A for a substring inside an unrelated word. When a type hint contains an answer, a neutral
bilingual retry prompt is selected. In particular, items accepting “Sie” cannot receive a hint
containing “Sie”; the fallback “Noch einmal.” / “Once more.” avoids that leak. No hint uses du.
Existing pool `hint` fields are not used in guided practice because they can contain solutions.

A first WRONG result in guided practice, derived exercises, dictation or scene meaning checks
shows only the safe hint and a retry action. Answers, reasons, the explanation control and
answer-bearing screen-reader announcements stay hidden. After the second response, right or
wrong, the answer and reason appear. Pool explanations remain the source for pool-item reasons;
scene reasons quote the original exchange and its English translation; derived reasons describe
the original word order or the played line; dictation explains that the solution reproduces the
heard line.

Practice and dictation reuse their existing first-response recording and single TYPO retry
budget. A hint retry and a TYPO retry cannot stack in either order. Derived choices and word
order likewise record only the first result. Guided matching presents one checked pairing at a
time; each pair gets the same hint-first repair, while the whole exercise reports one common
`matchOutcome`, retaining the pairs confused on their first response. Legacy matching retains
its existing interface and behavior. Practice misses still enter the existing capped requeue.
Gold remains based solely on the existing first-pass practice rule.

### Sound

All three original Phonetik strings remain in L1. Sound items are derived from their syllables
and capitalized stress:

| Original | Spoken word | Checked question | Options | Answer |
|---|---|---|---|---|
| `HAL-lo` | Hallo | Which syllable is stressed? / Welche Silbe ist betont? | 1, 2 | 1 |
| `DAN-ke` | Danke | Same question | 1, 2 | 1 |
| `A-na` | Ana | Same question | 1, 2 | 1 |

Each item follows listen → checked choice and feedback → say through `ReadAloudLine`.
The unstressed display uses lower-case syllables before the question; the marked model appears
after checking. `checkAnswer` and `checkOptionsFor` grade the question. Audio uses the existing
browser voice and honest source badge. No incorrect pronunciation is synthesized. Audio failure
retains the explicit text fallback, and speaking retains the existing signed-out/no-microphone/
limit/server fallbacks and honest self-confirmation. These activities cannot raise practice gold.

### Short read

The reception welcome card, titled “Willkommen!” / “Welcome!”, reads:

> Hallo und willkommen!
>
> Guten Morgen! Guten Tag! Guten Abend! Gute Nacht!
>
> „Guten Tag“ ist ein Gruß.
>
> Ich heiße Ana. – Freut mich!
>
> Entschuldigung, wie heißen Sie?
>
> Wie geht es dir? – Mir geht es gut, danke.
>
> Buchstabieren Sie bitte Ana: A-N-A. A ist ein Buchstabe.

Its instruction has German Sie and English twins. The nine words outside the dialogue are all
present as tappable glosses: Hallo, Guten Morgen, Guten Abend, Gute Nacht, Entschuldigung,
Freut mich, Wie geht es dir?, der Gruß and der Buchstabe. Consequently `wortfeld-more` is removed.
Question marks are normalized only in the new read's gloss lexicon, allowing the whole informal
phrase to be tapped without changing legacy dialogue gloss behavior. The phrase is an example
from the taught vocabulary; course instructions still address Sie.

The two bilingual comprehension questions ask what “Guten Tag” is (a greeting) and what A is
(a letter), each with three English choices, a checked answer and a bilingual reason. They use
the same checked-choice component as the scene and sound questions. Read results are excluded
from gold and do not become practice requeue items.

RULE 32 validates the read's required fields, exactly two questions, choice uniqueness, checker
agreement, bilingual reasons, Sie instructions, and actual tappable coverage of every word
outside the dialogue. RULE 34 uses RULE 5's own lexicon expansion and tokenizer to reject untaught
read vocabulary; notice text cannot license extra words in the read. RULE 23 now recognizes the
read as an input surface. RULE 33 checks safe bilingual hints across the whole A1.1 pool.

### Fluency, hook, name and estimate

Fluency repeats the four existing scene say lines, with the original staff cue and the learner's
own name where applicable. The response text and model playback begin hidden and are one tap
away. `ReadAloudLine` supplies the same recording/self-confirmation behavior; a spoken attempt
also reveals the model for feedback. A simple count shows how many lines were said. There is no
countdown, pass mark or gold contribution.

L1 alone carries this `nextHook`, shown immediately after the recap can-dos and before the
closed score details:

- German: “Morgen muss Ana sich im Bürgerbüro anmelden. Kann sie das Formular ausfüllen?”
- English: “Tomorrow Ana has to register at the public office. Can she fill in the form?”

This matches L2's actual public-office registration situation. Other recaps have no new hook.

A recognized introduction opening in the model-first pretest hands its name to run-local React
state. The first scene say input is prefilled and remains editable; scene and fluency reuse that
state. Nothing sends the name to snapshot packing, analytics or database attempt records. A full
reload deliberately does not recover a name; a personalized line asks for it again if needed.
The existing speech endpoint still receives its expected text when scoring speech, as before;
its usage record does not store that text or transcript.

The intro now leads with the lesson and can-dos, then shows the count-derived estimate as
**3 parts · about 8–20 min each (estimate; saved at each pause)**. The underlying current total
range is 25–60 minutes. These are planning assumptions from the existing estimate model, including
new sound/read/fluency counts, not measured timing or a promise of three equal-length parts.
Legacy intros retain their original duration format; `minutes: 15` remains unchanged.

### Teacher data only

`A11_ART.teacher` records `name: 'Frau Hoffmann'`, `isAI: true`, both supplied portrait paths
(`/art/a11/teacher-512.webp`, `/art/a11/teacher-160.webp`) and descriptive alt text.
`A11_META.teacher` references that same entry. The dialogue cast is untouched. A regression checks
both files exist and the teacher surname does not collide with any A1.1 or A1.2 dialogue speaker.
Neither a portrait nor a teacher button is rendered.

## Files changed

- Content/meta/art: `src/data/curricula/a11.js`, its synchronized
  `astro-site/src/data/curricula/a11.js` twin, `src/data/curricula/a11.meta.js`,
  `src/data/curricula/a11.art.js`.
- Engine/helpers: `src/lib/lesson/buildGuided.js`, `scene.js`, `runState.js`, `strings.js`;
  new `guidedFeedback.js` and `guidedRead.js`.
- New components: `CheckedChoice.jsx`, `SoundStage.jsx`, `ReadStage.jsx`, `FluencyStage.jsx`,
  `GuidedMatchItem.jsx` under `src/components/lesson/`.
- Existing components: `PracticeItem.jsx`, `DictationItem.jsx`, `WordOrderItem.jsx`,
  `ListenSelectItem.jsx`, `MatchItem.jsx`, `FeedbackSheet.jsx`, `PretestStage.jsx`,
  `SceneStage.jsx`, `ReadAloudLine.jsx`, `IntroStage.jsx`, `RecapStage.jsx`.
- Integration: `src/pages/lesson/LessonPlayerPage.jsx`.
- Validation/docs: `scripts/lib/guided-content.mjs`, `scripts/validate-curriculum.mjs`,
  `scripts/README.md`, this report. Generated lesson-pool data remained unchanged.
- Tests: new `tests/guided-step2.test.mjs`; updated `tests/guided-lesson.test.mjs`,
  `tests/a11-finish.test.mjs`, `tests/course-player.test.mjs`.
- The corrected `BUILD-BRIEF-2.md` is an external owner change preserved in the working tree.

## Tests added and changed

The new 14-case step-2 suite covers the entire pool's answer-free bilingual hints; stress-item
construction and common checking; taught-only read text and actual tappable coverage; invalid
content mutations; first-response scoring across right/wrong second responses; TYPO retry
budget sharing; answer suppression in visible and screen-reader feedback; real scene choice
callbacks; sound ordering; initially hidden fluency models and honest confirmation; name
extraction/wiring and text-free snapshots; the L1-only hook; teacher files and surname collision;
count-derived part estimates; derived choice/word-order repairs; and matching's first-pair evidence.

The existing guided suite now asserts the corrected complete order and both pause boundaries,
including the unchanged requeue immediately before recap. Its unchanged-stage comparison still
checks every field except intentional `part` and recap-hook additions, across all three draws.
Word coverage now spans scene words plus read words. The scene harness follows the real shared
checked-choice component through a wrong answer, hint, second response and personalized speech.

`a11-finish` checks contextual examples across word/read surfaces and supplies the newly imported
helper to its existing JSX harness; its TYPO and language assertions are retained. `course-player`
checks the common grader at `CheckedChoice`, where scene grading now lives, retaining the same
checker/options assertions. No meaningful assertion was deleted, skipped or weakened. Every
protected test file is unchanged, including `lesson-back-skip`, `curricula`, engine/scoring,
save-progress, speaking-coach and explain suites.

## Course rules affected

1. Guided L1 replaces self-ticked Phonetik with checked listening followed by speaking; its
   original Phonetik data and every legacy lesson remain intact.
2. Guided L1 moves the notice to Part 2 and teaches the remaining words through the short read.
   All twenty words retain input coverage. Requeue stays in Part 3 per the corrected brief.
3. Guided first misses receive one repair before answer disclosure. The first response and
   existing TYPO policy still decide the score; no accepted-answer list or checker was widened.
4. Four familiar fluency turns add speaking practice beyond the earlier scene and final speaking
   stages. Those results stay outside gold and the existing final speaking summary.
5. The planning estimate includes these activities and is presented per saved part. The validator's
   15-minute target and course-hour accounting are unchanged; measured duration remains future work.
6. New choice actions use the existing coral token/button treatment of the approved guided scene.
   No color literals, font changes, new motion or changes to the design token source were added.

## Gates and verification

Codex was stopped by a machine restart during its final gate run. Claude then ran every gate on
the finished tree (2026-11-12, about 22:30 UTC), from a clean `dist/`:

| Gate | Result |
|---|---|
| `build-lesson-pool.mjs a1.1`, `validate-curriculum.mjs`, `sync-shared.mjs` | pass |
| `npm run lint`, `check-duplicates.mjs`, function syntax | pass |
| `npm test` | 2,982 of 2,982 pass |
| SPA build, offline Astro build, merge, prerender, `check-built-html.mjs dist` | 151 pages, 0 failures, 0 warnings |
| Protected test files, `CLAUDE.md`, `astro-site/package-lock.json` | unchanged |

Claude also played Lektion 1 as a guest in a phone-sized browser against the built site: intro,
first sentence, four scene chunks (hear, meaning check with hint and second try, say it), word
cards, the sound stage (through its no-voice fallback), the reception card with its question, the
save-progress pause, the grammar card and the first practice items with hint-first feedback. No
page errors and no horizontal overflow. The walk stopped at practice item 4 (a limit of the walking
script, not of the lesson); Parts 2 and 3 beyond it are covered by the test suite only.

Found in the walk, for the next brief:

1. The sound question confirms a right answer with "Yes, that is the meaning." It is a stress
   question, so the wording is wrong.
2. The sound question offers "1" and "2"; showing the word with the stressed syllable marked
   ("HAL-lo" / "hal-LO") is clearer.
3. The sound stage shows two Continue buttons, one of them inactive.
4. The spelling item's hint is the generic gap hint ("Read the sentence before and after the
   gap."), which does not fit a spelling task.
5. In English view the scene's meaning question is shown twice (German slot and English slot hold
   the same English sentence).

## Open verification

The local browser walkthrough and screenshot could not run in this executor: Vite fails to bind
`127.0.0.1:5173` with `EPERM`, and the installed Chromium exits with SIGTRAP after
`setsockopt: Operation not permitted`, even with its profile under writable `/tmp`. No browser,
phone-layout, real microphone or signed-in scoring pass is claimed. Real component callbacks
are exercised by the repository's JSX harness instead. The existing speech score measures word
recognition; it is not a certified word-stress assessment. Browser voice remains labelled honestly.
The offline Astro build checks the committed content cache, not current production content.
