# A1.1 independent implementation evaluation — 2026-09-14

## Verdict

**82/100 — a strong, release-ready free A1.1 course, but not yet fully premium-finished.**

The lesson architecture, progression, feedback and assessment mechanics are unusually complete for
an A1.1 product. The largest remaining quality gap is recorded audio: the production manifest is
empty, so the dialogue, vocabulary, dictation and read-aloud surfaces fall back to browser speech.
The repository also does not establish the identity or independence of a human DaF reviewer; the
existing 23-round review trail should be described as an internal, AI-assisted adversarial review
unless separate reviewer evidence exists outside the repository.

## Scorecard

| Dimension | Score | Finding |
|---|---:|---|
| Curriculum and CEFR scope | 18/20 | 12 coherent situations, 49 can-do outcomes and a conservative grammar progression. |
| Lesson pedagogy | 18/20 | Input precedes production; each lesson moves through pretest, dialogue, vocabulary, rule, practice, listening, speaking, writing and recap. |
| Practice and feedback | 18/20 | 378 answerable controlled-practice items, typed-heavy delivery, immediate explanations, requeue after misses and spaced review. |
| Assessment | 13/15 | Four 20-item checkpoints with section floors and remediation are strong. The final test is intentionally a shortened 40-minute course test, not a full official simulation. |
| Speaking and writing | 11/15 | Every lesson contains both; full automated scoring depends on an account and live AI services, while guests receive honest self/form checks. |
| Audio and listening input | 4/10 | Scripts and playback paths exist, but `a11.audio.js` is an empty manifest and playback is labelled “Computerstimme”. |

## Independently measured inventory

- 12 situational lessons and 4 checkpoints
- 49 can-do outcomes
- 263 vocabulary entries
- 12 dialogues / 120 dialogue lines
- 378 controlled-practice items in the delivered A1.1 pool
- 12 writing tasks (6 forms, 6 messages)
- 12 open speaking tasks plus read-aloud work
- 6 linked listening exercises and 10 linked reading texts
- 5.8 hours of guided lesson/checkpoint/review time; the remaining amount in `hoursTotal: 54` is a
  practice budget, not 48 additional hours of finished guided content
- 40-minute shortened final test: 15 minutes listening, 15 reading, 10 writing; speaking is trained
  in the course but not run inside this final test

## Verification performed

- 347/347 focused A1.1 course, lesson-engine, checkpoint, writing, speaking, audio-contract and
  syllabus tests passed.
- `validate-curriculum.mjs a1.1` passed.
- Curriculum/data synchronization checks passed.
- A production build rendered successfully.
- The complete first lesson was exercised at a 390×844 mobile viewport from pretest through recap.
- Correct and incorrect feedback, translation reveal, remediation, guest progress persistence and
  the next-lesson unlock all behaved correctly; the browser console remained clean.

## Changes made from this evaluation

- Course routes now enforce the same sequence shown by the locked course map; direct URLs can no
  longer skip ahead to a lesson or checkpoint.
- The floating “Watch Intro” prompt is suppressed throughout `/course/*`, removing a mobile overlap
  with writing fields and primary lesson buttons.
- The course path now displays the shortened final test as 40 minutes instead of the stale 65.

## Remaining priorities

1. Generate and publish the A1.1 Azure audio manifest, then listen to a sample from every lesson.
2. Obtain a named independent DaF review, or clearly label the existing review series as internal
   AI-assisted QA.
3. Close the 24 recorded minor language/form-check edge cases in review #23.
4. Fill the linked-practice gaps before selling the internal 48-hour practice budget as delivered
   material: six lessons currently lack a linked listening exercise and two lack a linked reading
   text.
5. Consider a scored speaking section in a later full A1 simulation; keep the current final labelled
   as the shortened course-completion test.
