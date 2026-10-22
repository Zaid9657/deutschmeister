### 1. Delayed subscription responses can replace another account’s entitlements
- Severity: HIGH
- Confidence: high
- Location: [src/contexts/SubscriptionContext.jsx:60](../../../src/contexts/SubscriptionContext.jsx:60)
- What breaks: Account A starts a refresh, signs out, and account B signs in. If A’s response arrives last, B receives A’s cached profile, subscription and purchases. This can unlock unpurchased courses or lock a paying learner out.
- Evidence: After awaiting account-specific requests, the callback unconditionally executes `setSubscription(sub)`, `setPurchases(bought)` and `setProfile(currentProfile)`. Account changes never invalidate outstanding loads. An in-memory reproduction confirmed A overwriting B.
- Fix: Bind loaded state to the authenticated account ID and invalidate previous requests on account changes. Check the account and request generation before committing data or clearing loading.

### 2. Confirming account deletion deletes nothing
- Severity: HIGH
- Confidence: high
- Location: [src/pages/ProfilePage.jsx:352](../../../src/pages/ProfilePage.jsx:352)
- What breaks: A learner confirms “Delete” after being told their data will be permanently deleted. The dialog disappears, but their account, session and progress remain intact.
- Evidence: The confirmation handler contains only `// Handle account deletion` and `setShowDeleteConfirm(false)`.
- Fix: Execute authenticated server-side account deletion and redirect only after success. Display a failure when deletion cannot complete.

### 3. Withdrawing consent during analytics loading still starts PostHog
- Severity: HIGH
- Confidence: high
- Location: [src/lib/analytics.js:36](../../../src/lib/analytics.js:36), [src/lib/analytics.js:101](../../../src/lib/analytics.js:101)
- What breaks: A visitor withdraws analytics consent while the PostHog chunk is downloading. When downloading finishes, PostHog initializes and captures events despite the declined consent.
- Evidence: The import continuation calls `posthog.init(...)` without rechecking consent. Meanwhile, withdrawal returns immediately when `!initialized`. An in-memory reproduction recorded both initialization and capture with consent set to `declined`.
- Fix: Recheck consent after importing and before initializing. Also require current consent in PostHog capture and identify wrappers.

### 4. A free-level reading URL bypasses paid-level checks
- Severity: HIGH
- Confidence: high
- Location: [src/pages/ReadingLessonPage.jsx:70](../../../src/pages/ReadingLessonPage.jsx:70), [src/services/readingService.js:65](../../../src/services/readingService.js:65), [src/components/LevelSubscriptionGuard.jsx:20](../../../src/components/LevelSubscriptionGuard.jsx:20)
- What breaks: A confirmed learner with an expired trial opens `/reading/a1.1/<paid-lesson-UUID>`. The paid lesson renders through the free-level guard, and completing it adds its ID to A1.1’s in-memory progress.
- Evidence: The guard trusts the URL level: `if (isLevelFree(level)) return children`. The lesson query filters only `.eq('id', id)`. Authenticated reading access permits the mismatched row.
- Fix: Fetch using both lesson ID and normalized URL level, rejecting mismatches before rendering or recording completion.

### 5. “Next exercise” opens listening exercises already graded
- Severity: MEDIUM
- Confidence: high
- Location: [src/pages/Listening/ExercisePlayer.jsx:29](../../../src/pages/Listening/ExercisePlayer.jsx:29), [src/components/listening/ResultsView.jsx:65](../../../src/components/listening/ResultsView.jsx:65)
- What breaks: Finish exercise 1 and select “Next exercise.” Exercise 2 displays the previous score and completion banner, reveals its answer review, and skips its attempt screen. “Try Again” is required to take it.
- Evidence: Router navigation changes `exerciseNumber` without remounting the player. `submitted`, `answers`, `score` and `playsUsed` never reset, so `{submitted ? <ResultsView ...> : ...}` remains on results.
- Fix: Remount the attempt component for each level/exercise pair, or reset its state while transitioning to loading the new exercise.

### 6. Navigating away during speaking startup leaves the microphone active
- Severity: MEDIUM
- Confidence: high
- Location: [src/pages/SpeakingPage.jsx:288](../../../src/pages/SpeakingPage.jsx:288), [src/components/LevelTest/LevelTestSpeaking.jsx:31](../../../src/components/LevelTest/LevelTestSpeaking.jsx:31)
- What breaks: Grant microphone access, then navigate elsewhere within the SPA while session creation is pending. A successful response leaves the microphone tracks live because the intended receiving component never mounts. The abandoned session also reserves allowance.
- Evidence: Startup stores the stream in a local `mic`. Success sets `handedOver = true`; cleanup only runs `if (!handedOver) releaseMicrophone(mic)`. Neither startup path checks cancellation or releases pending streams on unmount.
- Fix: Track stream ownership and cancellation across unmount, stopping streams acquired after cancellation. Close any server session created after the learner leaves.

### 7. Repeated Enter submissions consume multiple X-Ray allowances
- Severity: MEDIUM
- Confidence: high
- Location: [src/pages/SentenceXRay.jsx:401](../../../src/pages/SentenceXRay.jsx:401), [src/pages/SentenceXRay.jsx:455](../../../src/pages/SentenceXRay.jsx:455), [netlify/functions/analyze-sentence.mjs:290](../../../netlify/functions/analyze-sentence.mjs:290)
- What breaks: A learner presses or holds Enter while an analysis is pending. Multiple requests analyze the same sentence, consume multiple daily allowances, and can overwrite results in response order.
- Evidence: The button is disabled while loading, but the enabled textarea calls `analyze()` on every Enter. `analyze` checks only for empty input. Each accepted backend request records usage before calling the model.
- Fix: Add a synchronous in-flight guard inside `analyze`, releasing it in `finally`. Apply allowance checks there so every entry point obeys them.

### 8. Pending exam autosaves regress the saved section
- Severity: MEDIUM
- Confidence: high
- Location: [src/pages/Modelltest/ModelltestRun.jsx:209](../../../src/pages/Modelltest/ModelltestRun.jsx:209), [src/pages/Modelltest/ModelltestRun.jsx:263](../../../src/pages/Modelltest/ModelltestRun.jsx:263), [src/services/examService.js:64](../../../src/services/examService.js:64)
- What breaks: Answer a section’s final question and press Continue within 1.5 seconds. Its pending autosave can overwrite the newly saved section index. Reloading resumes the previous section with the next section’s deadline.
- Evidence: The delayed save captures `_meta: { sectionIndex }`. `nextSection` saves the new index without canceling it; `saveAnswers` replaces the entire answers map. A controlled-timer reproduction produced writes for section 1 followed by section 0.
- Fix: Cancel pending saves before transitions, completion and unmount. Serialize or version writes so an already-running older save cannot overwrite newer state.

### 9. Skipping unknown questions can produce B2.2 from one correct answer
- Severity: MEDIUM
- Confidence: high
- Location: [src/pages/LevelTest.jsx:79](../../../src/pages/LevelTest.jsx:79), [src/pages/LevelTest.jsx:138](../../../src/pages/LevelTest.jsx:138), [src/components/LevelTest/LevelTestResults.jsx:102](../../../src/components/LevelTest/LevelTestResults.jsx:102)
- What breaks: A learner answers one B2.2 question correctly, skips the other 39 questions and optional sections, and receives B2.2 with a 100% written score. This undermines placement accuracy despite the landing page recommending skipping uncertain answers.
- Evidence: Skips update only `skipped`; placement denominators count only `writtenAnswers`. The extracted calculation returned B2.2 for one correct B2.2 answer.
- Fix: Include skipped questions in assessment denominators or require sufficient evidence before assigning each level. Use the same rule for displayed percentages.

### 10. Signed-in placement saves a different level from the displayed result
- Severity: MEDIUM
- Confidence: high
- Location: [src/pages/LevelTest.jsx:173](../../../src/pages/LevelTest.jsx:173), [src/components/LevelTest/LevelTestResults.jsx:114](../../../src/components/LevelTest/LevelTestResults.jsx:114)
- What breaks: A signed-in learner’s written result is B2.1, but weak listening demotes the displayed result to B1.2. Their profile nevertheless saves B2.1, so later content selection contradicts their result.
- Evidence: The results component computes the adjusted `finalSublevel`, while the parent persists `current_level: determinedSublevel`, the written-only result. Guest storage correctly uses `finalSublevel`.
- Fix: Calculate final placement once and use it for display, guest storage and profile persistence. Refresh the shared profile after saving.

### 11. “Just show me around first” leaves onboarding onscreen
- Severity: MEDIUM
- Confidence: high
- Location: [src/components/onboarding/OnboardingGate.jsx:20](../../../src/components/onboarding/OnboardingGate.jsx:20), [src/components/onboarding/IntroSlides.jsx:59](../../../src/components/onboarding/IntroSlides.jsx:59), [src/hooks/useOnboarding.js:68](../../../src/hooks/useOnboarding.js:68)
- What breaks: A new learner completes onboarding inside `/dashboard` using “Just show me around first.” Completion saves, but the slides remain until reloading.
- Evidence: The gate and slides create independent `useOnboarding()` instances. Completion updates only the slides’ state and navigates to the already-current `/dashboard`. The gate retains incomplete state and refetches only when `user` changes. An in-memory reproduction confirmed this divergence.
- Fix: Share onboarding state or pass the gate’s completion action into the slides, ensuring completion updates the state controlling the gate.

### 12. Mobile navigation covers the course-return controls
- Severity: MEDIUM
- Confidence: high
- Location: [src/components/CourseReturnBar.jsx:34](../../../src/components/CourseReturnBar.jsx:34), [src/components/BottomNav.jsx:67](../../../src/components/BottomNav.jsx:67), [src/components/lesson/SpeakingStage.jsx:64](../../../src/components/lesson/SpeakingStage.jsx:64)
- What breaks: A signed-in phone user opens the speaking coach from a lesson. The promised “Zurück zur Lektion” control sits underneath the bottom navigation, preventing the normal return to their lesson stage.
- Evidence: Both bars use `fixed ... bottom-0`; the return bar has `z-40`, while BottomNav has `z-50`. The return bar has no offset for the navigation or safe area.
- Fix: Position the return bar above BottomNav on mobile and reserve corresponding content clearance.

### 13. Logout navigates to the SPA’s nonexistent homepage
- Severity: MEDIUM
- Confidence: high
- Location: [src/components/Navbar.jsx:73](../../../src/components/Navbar.jsx:73), [src/App.jsx:552](../../../src/App.jsx:552)
- What breaks: Selecting Logout from either navbar menu signs the learner out and displays the application’s 404 page instead of the public homepage.
- Evidence: The handler calls `navigate('/')`. As explicitly documented in `CLAUDE.md`, the SPA has no `/` route; its wildcard renders `NotFoundPage`. Client navigation never requests Astro’s homepage.
- Fix: After successful logout, use `window.location.assign('/')` to load the public homepage.

### 14. Pausing the third listening playback prevents resuming
- Severity: MEDIUM
- Confidence: high
- Location: [src/components/listening/AudioPlayer.jsx:22](../../../src/components/listening/AudioPlayer.jsx:22), [src/components/listening/AudioPlayer.jsx:60](../../../src/components/listening/AudioPlayer.jsx:60)
- What breaks: Start the third permitted listen and pause halfway through. Play becomes disabled, forfeiting the unfinished portion of that listen.
- Evidence: Starting playback increments `playCount` to three, making `canPlay` false. After pausing, `playDisabled = disabled || (!isPlaying && !canPlay)` disables resume; the handler also rejects it before distinguishing resume from a new play.
- Fix: Enforce the limit when starting a new playback, while allowing an already-counted, unfinished playback to resume.

### 15. X-Ray grammar explanations link to nonexistent pages
- Severity: LOW
- Confidence: high
- Location: [src/pages/SentenceXRay.jsx:187](../../../src/pages/SentenceXRay.jsx:187), [netlify/functions/analyze-sentence.mjs:42](../../../netlify/functions/analyze-sentence.mjs:42)
- What breaks: Expanding a dative explanation and selecting “Learn more” opens `/grammar/a1.1/dative-case/`, a 404. The actual topic belongs to A2.1.
- Evidence: Every destination hardcodes `/grammar/a1.1/${word.grammarTopic}/`. None of the backend’s 14 suggested slugs belongs to A1.1 in the committed content cache; several suggested slugs do not exist anywhere.
- Fix: Resolve topic identifiers through a registry of actual destinations. Render links only for valid registered topics.

## Checked and fine

- Login return-path validation rejects external URLs, backslashes, control characters and normalized double-slash paths while preserving queries and fragments.
- Stored course returns enforce an anchored allowlist and expiry; checkout intents remain internal.
- Signup distinguishes sessionless confirmation and immediate sign-in; confirmation resends preserve callbacks and enforce cooldowns.
- Password-reset requests target the production-rewritten `/update-password` route.
- Level entitlement logic includes lifetime course purchases after included Pro access expires.
- Course-entry selection normalizes level casing and checks access before choosing a course.
- ThemeContext falls back correctly for unknown levels and resets when its level clears.
- Shared Button renders disabled router destinations as disabled buttons.
- Browser zoom remains enabled; global keyboard-focus and reduced-motion CSS are present.
- Session-timeout dialog implements focus containment, Escape handling and focus restoration.
- Reading requests reject stale route responses; comprehension checks reset between lessons.
- Exam completion refuses to score missing listening keys and preserves frozen answers for persistence retries.
- Speaking requests microphone permission before reserving allowance; recording MIME selection supports Safari’s MP4 container.
- Mounted speaking-session teardown stops recording, microphone tracks, playback and timers.
- Four targeted Node test files covering return paths, signup confirmation, consent wiring and accessibility passed.