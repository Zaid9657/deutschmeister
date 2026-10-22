### 1. Authentication loading causes saved account runs to be overwritten

- Severity: HIGH
- Confidence: high
- Location: src/pages/lesson/LessonPlayerPage.jsx:83, src/pages/lesson/LessonPlayerPage.jsx:317, src/components/LevelSubscriptionGuard.jsx:19
- What breaks: A signed-in learner reloads an unfinished A1.1 lesson while session restoration is slow. They see the introduction instead of their saved position. Starting overwrites the account snapshot, losing their answers and stage.
- Evidence: Auth initially has `user = null`; the free-level guard immediately renders children. The snapshot is read only once through `useState(() => ... readRun(..., owner))`. Authentication resolving does not remount the player, but subsequent saves use the account’s key.
- Fix: Wait for authentication loading to finish before initializing the player’s snapshot. Reinitialize appropriately when the account owner changes.

### 2. Concurrent completions let a weaker run overwrite Gold

- Severity: HIGH
- Confidence: high
- Location: src/services/lessonService.js:66, src/services/lessonService.js:79, src/services/lessonService.js:82
- What breaks: Two devices or tabs finish the same lesson concurrently. Both read an earlier weak result; Gold saves first, then the weaker result replaces it, contradicting the documented preservation rule.
- Evidence: Reading, `betterRun(stored, ...)`, and upserting are separate operations. No repository migration adds an atomic preservation guard. An in-memory reproduction using the service produced writes `["gold", 0.95]`, then `["complete", 0.4]`, leaving the weaker result stored.
- Fix: Enforce the comparison atomically in Postgres through an upsert, RPC, or trigger that preserves the currently stored stronger result.

### 3. Incorrect verb endings earn correct-answer credit

- Severity: HIGH
- Confidence: high
- Location: src/lib/lesson/check.js:151, src/lib/lesson/check.js:253, src/components/lesson/PracticeItem.jsx:80
- What breaks: In the first L7 run, answering `spielst` to “Lena ___ am Wochenende Fußball. (spielen)” earns correctness credit. The learner practices the wrong conjugation without losing practice-score accuracy or receiving remediation.
- Evidence: `endingDiffers()` compares only the final character. Both forms end in `t`; their edit distance is one, so `checkAnswer()` returns `TYPO`. The UI defines correctness as `result !== RESULT.WRONG`. Direct probes also accepted `brauchst` for `braucht` and `kostest` for `kostet`.
- Fix: Reject edits that change grammatical endings before applying typo forgiveness. Compare the ending rather than just its final character.

### 4. Wrong multiple-choice spellings receive typo forgiveness

- Severity: HIGH
- Confidence: high
- Location: src/components/lesson/PracticeItem.jsx:79, src/lib/lesson/check.js:256, src/data/lessonPools/a11.json:581
- What breaks: In the first L1 run, choosing `Dane` for “Welche Schreibweise ist richtig?” earns full first-pass credit, although the exercise explicitly tests recognizing `Danke`.
- Evidence: Selected options use the same fuzzy checker as typed answers. `checkAnswer('Dane', ['Danke'])` returns `TYPO`, which the caller records as correct. The item’s explanation explicitly identifies `Dane` as wrong.
- Fix: Disable typo forgiveness for recognition items with selectable answers. Preserve documented normalization while requiring the selected option to match an accepted answer.

### 5. Microphone permission failures trap learners inside checkpoints

- Severity: MEDIUM
- Confidence: high
- Location: src/components/lesson/ReadAloudLine.jsx:143, src/components/lesson/ReadAloudLine.jsx:219, src/pages/lesson/CheckpointPage.jsx:125
- What breaks: A signed-in learner denies microphone permission, has no microphone, or has a busy device. Checkpoint Sprechen cannot advance: recording fails, self-confirmation stays hidden, and Next remains disabled.
- Evidence: Capture failure sets `micError` and returns to `idle`, leaving `scoringPossible` true. Self-confirmation requires unavailable scoring or completed scoring attempts. Next requires `pending`, which capture failure never supplies.
- Fix: Expose the unassessed self-confirmation fallback after capture fails, while retaining a recording retry.

### 6. Failed guest saves are reported as successfully stored

- Severity: MEDIUM
- Confidence: high
- Location: src/pages/lesson/LessonPlayerPage.jsx:355, src/lib/course/localProgress.js:148, src/lib/lesson/strings.js:80
- What breaks: A guest completes a lesson with localStorage blocked or full. The recap says “Saved on this device,” but reloading or proceeding through signup loses the completed run.
- Evidence: `recordLocalLesson()` returns the boolean from `safeSetJSON()`. Its caller ignores that result and unconditionally calls `setSync('local')`. A storage mock throwing `QuotaExceededError` reproduced the failed write.
- Fix: Check the return value and show an unsaved state on failure. Retain the completed run in memory so saving can be retried while the page remains open.

### 7. Guest-to-account merge omits the lesson’s review cards

- Severity: MEDIUM
- Confidence: high
- Location: src/lib/course/localProgress.js:254, src/lib/course/localProgress.js:268, src/lib/course/syncOutbox.js:78
- What breaks: A visitor finishes a lesson and creates an account. Completion transfers, but its vocabulary and sentences never enter spaced review. A first-time learner can consequently have a completed lesson and an empty review deck.
- Evidence: Guest merge calls only `completeLesson()` and `logAttempts()`, then clears local progress. Card seeding occurs through the signed-in outbox, which this path bypasses. A source-based reproduction recorded only progress and attempt writes.
- Fix: Include idempotent card seeding in the merge’s success condition, or route guest completions through the outbox’s three-step contract.

### 8. Visually identical decomposed umlauts are marked wrong

- Severity: MEDIUM
- Confidence: high
- Location: src/utils/answerMatch.js:13, src/lib/lesson/check.js:226, src/data/lessonPools/a11.json:170
- What breaks: In L1, entering a visually correct `Ü` composed as `U` plus a combining diaeresis fails “T-S-C-H-___-S-S.” Other correct decomposed answers also lose marks or receive spurious typo warnings.
- Evidence: Normalization replaces precomposed umlauts without canonical Unicode normalization. A direct probe using the actual item returned `WRONG` for `"Ü".normalize('NFD')`. L10’s decomposed “Fährt der Fahrer nach Österreich?” also returned `WRONG`.
- Fix: Normalize inputs and accepted answers to NFC before spelling, number, case, and typo comparisons.

### 9. Derived word tiles reject valid arrangements of the supplied words

- Severity: MEDIUM
- Confidence: high
- Location: src/lib/lesson/buildLesson.js:1043, src/lib/lesson/buildLesson.js:1063, src/components/lesson/WordOrderItem.jsx:66
- What breaks: L11’s first run rejects “Ich bin müde. Ich stehe um sechs auf.” despite it using every supplied tile correctly. L12’s third run similarly rejects “Ja, mein Papa und meine Mama kommen.”
- Evidence: The generator accepts only the original dialogue line: `accepted: [chosen.de]`. The instructions merely request the correct word order. Direct probes confirmed both alternatives use exactly the supplied tiles and return `WRONG`.
- Fix: Constrain the requested arrangement explicitly or generate accepted grammatical alternatives. Avoid presenting unconstrained multi-sentence blocks with only one permissible order.

### 10. Writing Formcheck marks unanswered questions as completed details

- Severity: MEDIUM
- Confidence: high
- Location: src/lib/lesson/writing.js:973, src/lib/lesson/writing.js:976, src/components/lesson/GradedWriting.jsx:197
- What breaks: In L2, asking about someone’s details instead of providing Ana’s details makes every Formcheck row green. For signed-out learners, this is their only writing feedback.
- Evidence: Questions are removed from `statements`, but answer-shape checks still use `re.test(body)`. This text returns `ok: true` with every check satisfied: “Sehr geehrte Damen und Herren, wie heißen Sie? Haben Sie im Mai Geburtstag? Kommen Sie aus Marokko? Ist die Marokkanerin ledig oder verheiratet? Viele Grüße, Ana”.
- Fix: Apply statement-only evidence to shapes requiring supplied information. Preserve question evidence specifically for Leitpunkte requesting a question.

### 11. Autumn DST understates the required exam preparation pace

- Severity: MEDIUM
- Confidence: high
- Location: src/lib/course/plan.js:43, src/lib/course/plan.js:94, src/lib/course/plan.js:99
- What breaks: In `Europe/London`, a learner on 22 October 2026 sets an exam for 29 October. With 17 nodes unfinished, the plan reports eight days and two weeks remaining, recommending nine nodes per week instead of 17.
- Evidence: `dayNumber()` floors local-midnight timestamps divided by 24 hours. Crossing the UTC+1-to-UTC transition adds a day. Running `planFor()` under that timezone reproduced `daysLeft: 8`, `weeksLeft: 2`, `perWeekTarget: 9`.
- Fix: Calculate calendar-day numbers using `Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY`.

### 12. The recap’s review date contradicts the saved schedule

- Severity: LOW
- Confidence: high
- Location: src/components/lesson/RecapStage.jsx:48, src/components/lesson/RecapStage.jsx:128, src/services/reviewService.js:31
- What breaks: Finishing L1 promises that material returns tomorrow, while its newly created review cards are immediately due. Repeating a lesson also promises tomorrow even when existing cards retain much later schedules.
- Evidence: The recap always calls `nextReviewDate()`, which adds one day. Seeding instead writes `due_at: new Date().toISOString()` and preserves existing schedules through `ignoreDuplicates: true`.
- Fix: Derive the displayed date from the actual card schedules and make the initial scheduling rule agree with the promise.

## Checked and fine

- Practice-score filtering excludes retries, warm-ups, writing, speaking, and text-read dictations; repeated responses are deduplicated.
- Sequential better-run comparisons preserve stronger results on the device and account paths.
- Outbox retries retain incomplete steps, respect account ownership, and use memory when storage fails.
- Guest merge preserves local progress when its progress or attempt writes fail.
- Snapshot helpers enforce seven-day expiry, reject malformed snapshots, and scope stored runs by lesson and owner.
- Completed-run counting excludes explain, read-aloud, and checkpoint activity.
- Checkpoint retakes vary; section results and aggregate grading share `sectionPasses()`.
- Writing evaluation validates model output, caps scores by coverage, and zeroes copied tasks.
- Can-do chapter mappings, review ladder progression, lapse intervals, and the 180-day plateau are correct.
- Five targeted checker/content/scoring test files passed; Supabase-dependent suites could not run because `@supabase/supabase-js` is absent.