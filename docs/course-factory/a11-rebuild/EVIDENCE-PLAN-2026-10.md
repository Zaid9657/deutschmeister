# A1.1 — evidence plan: usability study and learning measurement (2026-10-05/06)

None of the numbers this plan asks for exist yet. This is the protocol for collecting them.

The course has been reviewed by experts (23 DaF rounds, the 2026-10 review) and by automated checks (the test suite and the curriculum validator; totals in `REMEDIATION-2026-10.md`). Neither kind of evidence shows that a beginner can learn from it.

- **What tests prove:** the code does what it says, and the content obeys its own rules.
- **What tests do not prove:** that the German sounds natural, that AI grading is accurate, that a beginner understands what to do, or that anything is remembered tomorrow.

This plan is how those questions get answered.

## 1. Usability study: genuine A0 learners, Lesson 1 and Lesson 2

### Who

- **Group size:** 6–8 adults with **no** prior German. That is enough to surface interface problems, not to measure learning.
- **Screening:** a 5-item check ("Wie heißen Sie?", "Danke", counting to five, the alphabet, "Ich bin …"). Anyone who answers two or more is excluded.
- **Spread:**
  - first language: at least 2 English-native and at least 2 for whom English is a second language (the chrome is English);
  - device: at least 3 on a phone (the expected device), at least 1 on a desktop;
  - age: at least 1 over 50.
- **Accessibility:** if possible, 1 screen-reader user (NVDA or VoiceOver) for Lesson 1 only.

### Session (60–75 min, remote or in person, recorded with consent)

1. **Consent and setup (5 min).**
   - Explain that the product is being tested, not the person.
   - Ask the participant to think aloud.
   - No coaching. The facilitator answers only "What would you do if I weren't here?".
2. **Lesson 1, unaided (target: whatever it takes).**
   - Start from `/course/a1.1` as a guest.
   - The facilitator does not help, explain an exercise, or confirm an answer.
3. **Lesson 2, unaided**, if time allows. It tests the harder writing task and the 25-word list.
4. **Debrief (10 min):**
   - "What was hardest?"
   - "Where did you not know what to do?"
   - "What did the result screen tell you?" (checks whether "Practice gold" and the per-skill lines were understood)
5. **Next-day recall (online, 10 min, ~24 h later), with no review allowed first:**
   - 10 Lesson-1 words, German → English;
   - 3 phrases, English → German;
   - spell one name aloud;
   - one formal and one informal greeting.

### What to record (one sheet per participant)

| Measure | How | Why |
|---|---|---|
| Completion time per stage | Timestamps from the `lesson_stage_viewed` events (or the facilitator's clock) | Replaces the modelled "≈ 20–45 min (estimate)" label (`a11.meta.js` `lektionMinutesEstimate`) with a measured range |
| Completed / abandoned, and where | Last stage reached | Abandonment by stage |
| Hesitations | Any pause > 10 s, or "what do I do?"; record the screen and the cause | |
| Help needed | Count of facilitator interventions (should be 0; any is a failure of the screen) | |
| Misunderstandings | What the participant thought the task was vs. what it was | |
| Answer errors by type | Language (did not know the German) vs. **interface** (knew it, could not enter it, misread the instruction, did not see the button) | The split the review asked for |
| Audio | Played? Heard? Used "Slower"? Any "no German voice" message? | Listening delivery |
| Result screen comprehension | Can they say what "Practice gold" means and what was *not* measured? | Honest results |
| Next-day recall | Score on the 15-item recall test | The first learning evidence the course will have |

### How to read it

- An interface problem seen in **2 or more** participants is a finding to fix before any further content work.
- Stage times give the real duration estimate. Report the median and the range. Do **not** report a mean of 6 people as "the" duration.
- Recall is reported per item, not as one percentage: it shows which words the lesson did not teach.

## 2. Product measurement (consented analytics only)

Events go through the existing consent gate (`public/consent.js` → `src/lib/analytics.js`), so every rate below describes **consenting** learners only. Analytics coverage ≠ total activity. The denominator for coverage is server-side `lesson_progress` rows, and guests are invisible to it.

| Question | Definition | Source |
|---|---|---|
| First-lesson completion | Share of `lesson_started` (L1, first run) followed by `lesson_completed` for the same `run_id` | PostHog |
| Time to completion | `lesson_completed.ts − lesson_started.ts` per `run_id`; median and IQR; resumed runs flagged | PostHog |
| Abandonment by stage | Last `lesson_stage_viewed.step` (the stage key) of runs with no `lesson_completed` within 7 days | PostHog |
| Return to the next Lektion | Share of L*n* completers with `lesson_started` for L*n+1* within 7 days | PostHog + `lesson_progress` |
| Review participation | Share of completers with any review session in days 1–8 | `review_cards` (server), all learners |
| Save failures | `lesson_sync_failed` count / `lesson_completed`, by step; no learner text is sent | PostHog |
| Skill status mix | Speaking (skipped / self-confirmed / recognised) and writing (self-checked / assessed) states per run | **Not tracked yet** — the recap shows them, no event carries them; add them to `lesson_completed` before reading this |
| Delayed recall | Opt-in 10-item check 2–7 days after a Lektion; score per item | Needs a small feature; until then, the study's day-2 test only |
| Speaking/writing improvement | **Independent** rating: a DaF teacher scores anonymised L1 and L12 writing samples (and read-aloud recordings, with consent) on the Goethe A1 criteria, blind to which is which. The AI score is not used as its own validation. | Manual, quarterly |

### Definitions fixed in code (2026-10-05)

- **Lesson started:** the learner pressed Start on the intro (`lesson_started`), or resumed a saved run (`lesson_resumed`).
- **Lesson completed:** the recap was reached. `lesson_completed` carries the run's `run_id` and fires once per run (the player's `saved` guard); count distinct `run_id`s, never raw events.
- **Practice score:** first-pass answers to the practice, derived and dictation items; retries, reveals, warm-up, writing and speaking are excluded (`src/lib/lesson/mastery.js`).
- **Practice gold:** practice score ≥ 80 %. It says nothing about speaking or writing; those have their own states (`src/lib/lesson/skillStatus.js`).

## 3. Before any effectiveness claim

Effectiveness may not be claimed in marketing, the course page or anywhere else until all of the following hold:

1. The study above has run with ≥ 6 A0 participants and its interface findings are fixed.
2. Median first-lesson time is measured (§2) and the duration labels show it.
3. Delayed-recall data exists for ≥ 50 consenting learners.

"Learners remember X % after a week" needs (3). "Most learners finish Lesson 1 in N minutes" needs (2). Passing tests support neither.
