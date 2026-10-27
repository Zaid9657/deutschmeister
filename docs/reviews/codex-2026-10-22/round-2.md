# Round 2: cross-checked review and fixes (2026-10-25)

Round 1 ([README](README.md)) was Codex reviewing the repository and Claude fixing
what it found. Round 2 had both models review independently, then check each
other's findings before anything was changed.

## How the findings were produced

1. **Two independent audits.** Claude audited the whole repository (223 findings);
   Codex re-ran its six area reviews against the post-round-1 code (108 findings).
2. **Cross-verification.** Codex verified every Claude finding against the code and
   Claude verified every Codex finding (confirmed 195 of 223 and 92 of 108). Rejected
   findings (44) were dropped with the verifier's reason.
3. **Clustering.** The 287 confirmed findings became 186 clusters:
   6 HIGH, 75 MEDIUM and 105 LOW; 140 defects and 46 enhancements.
   They were split into 10 batches whose owned files never overlap.
4. **Fix, review, re-fix.** A Claude agent implemented each batch in its own worktree:
   every defect class got a rule and a regression test that fails on the old code.
   Codex then reviewed each batch diff read-only. Its findings went back to the
   same agent and were re-checked, until nothing it flagged was left open.

## Batches

| Batch | Scope | Clusters | Fixed |
|---|---|---|---|
| B1 | Access & checkout: SPA subscription context, guards, /subscription & success page, Astro buy doors | 18 | 18 |
| B2 | Money backend (Lemon Squeezy webhook, entitlement reconciliation, verify, admin grants), admin metrics & support functions | 16 | 16 |
| B3 | AI features & usage accounting (speaking, writing, X-Ray, explain — server and UI) + every new SQL migration of this round | 25 | 24 |
| B4 | Answer checking & lesson-engine rules (typo checker, dictation matchers, pool quality rules, checkpoint scoring) | 12 | 12 |
| B5 | Lesson player, checkpoints, review & course pages | 17 | 17 |
| B6 | Listening practice, mock-exam loading & vocabulary SRS trainer | 19 | 19 |
| B7 | Growth funnel: placement test, onboarding & first run, signup tracking, dashboard grammar path | 20 | 20 |
| B8 | Emails, lifecycle jobs, unsubscribe & ops reports | 12 | 12 |
| B9 | SEO, Astro content & our own product claims (comparison pages, FAQ, pricing copy, llms, sitemap, guides, exam hubs) | 24 | 24 |
| B10 | Auth, analytics, navigation & site shell (SPA auth/profile pages + Astro layout and grammar island) | 23 | 23 |

Final status across all clusters: 185 fixed, 1 skipped.

## Whole-branch review

After every batch was merged, Codex reviewed the combined branch for problems between
batches. It found 10 (1 HIGH, 7 MEDIUM, 2 LOW). Nine were fixed and re-checked:

- A manual Pro-day grant could hide a still-billing subscription after a failed webhook
  (HIGH). Provider subscriptions now always record, and a grant's remainder is kept as a
  time-limited, revocable `pro_days` window. A production check found no real customer
  affected; the one match was a Lemon Squeezy test-mode subscription.
- Explicit premium grants were ignored by the SPA and the Astro navigation, and revoked
  by unrelated admin actions.
- Account switches in another tab could carry the first account's state: the static Buy
  door's ownership snapshot, the placement result, and a review deck's late response.
- A checkpoint finished offline (or with storage full) was lost on reload; a guest
  checkpoint claimed "saved" when the browser refused the write.
- Astro grammar exercises rejected "Wieso" where the course accepts it (one shared
  whole-answer rule now).
- A failed explanation consumed the daily allowance.

The tenth (stale Pro flags up to the daily sweep) is under Deliberately left open.

## Deliberately left open

- **AI-23** (LOW enhancement): `score-readaloud` and `explain-answer` still run a usage
  count before the reservation RPC. The RPC decides under its lock, the count's `used`
  figure feeds the 429 body, and `tests/lesson-ai-migration-fallback.test.mjs` pins the
  order on purpose; removing it saves one query and was not worth the change.
- **C-039(b)**: a second course-reminder mail window is a new lifecycle mail, an owner
  decision (Team v5). Part (a), building speaking history from stored messages, shipped.
- **C-145** (trial-mail price message): excluded before batching, owner decision.
- Out of scope by design, noted on their clusters: no `past_due` grace period; the idle
  logout stays (now device-local and never during a lesson, checkpoint, review, mock exam
  or speaking session); paid podcast episodes stay in the public feed; the trial still
  starts at signup; no per-list email opt-outs; the podcast tile stays off the comparison
  pages until the 24-vs-14 episode count is settled.
- **Stale Pro flags after a lapse** (whole-branch review #5, MEDIUM): when a manual grant
  or an included course window ends after the daily 08:00 UTC sweep, the AI endpoints and
  the Astro grammar locks keep trusting the profile's Pro flags until the next sweep (the
  SPA locks at once). The window is at most 24 hours and in the customer's favour;
  resolving entitlement at request time in every AI endpoint risks locking out paying
  customers, and running the sweep hourly would move trial-mail timing (the sweep lives in
  `trial-lifecycle`). A dedicated hourly entitlement sweep is the clean follow-up.

## Every cluster

| Cluster | Severity | Kind | Title | Status |
|---|---|---|---|---|
| ACC-01 | HIGH | defect | Same-user subscription refresh flips `loading` back to true, so every guarded page (A1.2 checkpoint, Modelltest Hören clip, paid /listening, /profile, onboarding) unmounts and loses in-progress work on tab return, hourly token refresh or a settings save | fixed |
| ACC-02 | MEDIUM | defect | Failed or timed-out entitlement reads are stored as 'no subscription / no purchases': a background refresh redirects paying learners to the paywall and /subscription opens a second recurring (or owned-course) checkout | fixed |
| ACC-03 | HIGH | defect | Legacy course row that still carries a live recurring Lemon Squeezy id: delete-account lets the user delete while billing continues, /subscription crashes on a null billingAction, and /profile says 'nothing to manage' | fixed |
| ACC-04 | MEDIUM | enhancement | /subscription tells failed-payment (past_due/unpaid) subscribers 'Trial Expired – Subscribe now' and offers a 'Verify' button that finds nothing | fixed |
| ACC-05 | MEDIUM | defect | /profile (the only self-service account deletion, exam goal, settings) sits behind SubscriptionGuard, so expired-trial, free and refunded accounts cannot reach it | fixed |
| ACC-06 | MEDIUM | defect | Signed-in learners without trial/paid access land on the /subscription paywall after every login or confirmation and from every /dashboard link (incl. the vocab trainer's 'Zum Dashboard'), instead of their free A1.1 course | fixed |
| ACC-07 | MEDIUM | defect | Home-screen app (manifest start_url /dashboard) opens the paywall for free learners and /login for no-account A1.1 learners | fixed |
| ACC-08 | LOW | defect | Purchase success page tells a live Pro subscriber who buys a course that the AI tools return to the free allowance and they are 'never charged again' | fixed |
| ACC-09 | LOW | defect | Object.hasOwn crashes /subscription/success and the /subscription polling on Safari < 15.4 (inside Vite's safari14 build target) | fixed |
| ACC-10 | LOW | enhancement | The purchase success page never tries the verify-subscription recovery (neither after its polling nor on 'Check again') | fixed |
| ACC-11 | LOW | enhancement | Success-page polling keeps refreshing three tables after access is already verified | fixed |
| ACC-12 | LOW | enhancement | lemon.js (third-party) loads on /dashboard and /profile, where no checkout ever opens | fixed |
| ACC-13 | LOW | enhancement | /subscription ignores the level the learner was just blocked from and shows a generic grid | fixed |
| ACC-14 | LOW | defect | 'Owned · open' on /subscription sends course buyers to the legacy /level/<level> topic hub instead of their guided course | fixed |
| ACC-15 | LOW | enhancement | Coupon field shows only '<label> applies at checkout' although coupon-validate already returns the saving and final price | fixed |
| ACC-16 | MEDIUM | defect | Signed-in owners can buy the same lifetime course again (homepage 'Where do you get on?' chooser has no owner door; clicks before the async entitlement lookup resolves open checkout) | fixed |
| ACC-17 | MEDIUM | defect | Static offer pages replace every Buy button with 'Continue course' for trial users, Pro subscribers and course buyers inside their included Pro window, so the lifetime course cannot be bought from any static page while intent is highest | fixed |
| ACC-18 | LOW | enhancement | Astro course doors re-fetch user, profile and purchases once per level on the homepage, /courses/ and /pricing/ | fixed |
| MNY-01 | MEDIUM | defect | Dunning e-mail promises 'your access continues without interruption', but zero-grace past_due handling ends access at the failed renewal | fixed |
| MNY-02 | MEDIUM | defect | Dunning: the owner alert says the customer 'was sent' the payment-failed mail whatever Resend answered, and a failed send is suppressed for 7 days because the failure row is written before the mail | fixed |
| MNY-03 | MEDIUM | defect | A delayed subscription_created for a subscription bought before a course purchase is silently discarded (the course row's start time is used as the superseded time), leaving an untracked billing subscription | fixed |
| MNY-04 | MEDIUM | defect | A cancellation event that arrives before its subscription_created permanently hides the newly paid subscription (status 'cancelled' is refused for a new subscription id) | fixed |
| MNY-05 | MEDIUM | defect | Order-to-user e-mail fallback reads only the first 50 auth users and matches profiles with an unescaped ILIKE ('_' is a wildcard), so a purchase can be granted to the wrong account | fixed |
| MNY-06 | LOW | defect | Admin 'Pro-Tage gutschreiben' (grant_pro_days) returns 500 for anyone who ever had a subscriptions row (UNIQUE(user_id)) | fixed |
| MNY-07 | LOW | defect | Provider events for deleted accounts violate the auth.users foreign key, return 500 and are retried forever (counted as failed webhooks) | fixed |
| MNY-08 | LOW | defect | Coupon redemption is recorded even when Lemon Squeezy applied no discount, burning per-user/new-customer eligibility and the total limit | fixed |
| MNY-09 | MEDIUM | defect | verify-subscription inspects only the user's single newest subscription event, so an old subscription's processed expiry hides the recoverable failed creation of a new paid subscription | fixed |
| MNY-10 | LOW | defect | Legacy course purchases stored with access_until = null lose their included Pro window when an overlapping subscription ends | fixed |
| MNY-11 | MEDIUM | defect | Refunds never reduce the admin dashboard's and founder report's net revenue | fixed |
| MNY-12 | MEDIUM | defect | Admin metrics test lesson_progress.status === 'completed' (never written), so course lessons never count as completed and course-only learners are missing from 'Aktiviert' and the funnel | fixed |
| MNY-13 | LOW | defect | Admin CSV exports do not neutralise spreadsheet formulas in learner-controlled fields (full_name) | fixed |
| MNY-14 | LOW | defect | Support form confirms receipt and clears the fields although the ticket message failed to save | fixed |
| MNY-15 | LOW | defect | A temporary failure during support-agent processing permanently prevents automated handling (seen tag claimed before work that can throw) | fixed |
| MNY-16 | LOW | enhancement | Support replies cannot be read in the app although an owner-scoped, public-only thread endpoint exists | fixed |
| AI-01 | HIGH | defect | Placement speaking sessions are free, unlimited, 15 minutes long and open to every tier (incl. free_expired/refunded): an unmetered AI speaking tutor for any account | fixed |
| AI-02 | MEDIUM | defect | evaluate-speaking takes `level` and `mode` from the request body: unbounded client text goes into the Sonnet prompt twice (cost inflation, self-awarded mission passes/levels) and a mission can be graded as placement | fixed |
| AI-03 | MEDIUM | defect | speaking-turn sends up to 20×5,000 characters of client-supplied history to the teacher model on every turn instead of the transcript the server already stores | fixed |
| AI-04 | LOW | defect | A model reply that parses as JSON but lacks evaluation fields is stored as a completed zero-score speaking evaluation and returned on every retry | fixed |
| AI-05 | LOW | defect | A transcript with no learner message is graded and cached permanently; a failed message insert after a settled turn is not retried | fixed |
| AI-06 | LOW | enhancement | Every mission start waits for a fresh TTS call on the same fixed opening line | fixed |
| AI-07 | MEDIUM | defect | Speaking mission lock uses hasAccess, not hasLevelAccess: a level-course owner whose Pro window ended is locked out of the missions their ticket includes | fixed |
| AI-08 | MEDIUM | defect | Speaking evaluation failures (409/429/503/network) silently return to setup or mark placement speaking as skipped, although the backend supports a safe retry by session_token | fixed |
| AI-09 | LOW | defect | Client-side navigation to /speaking as a guest drops its SEO head (canonical, description, OG) and keeps the previous page's title | fixed |
| AI-10 | MEDIUM | defect | Speaking session auto-scroll (block 'start') pushes the latest teacher reply and the countdown above the fold on every message and record tap | fixed |
| AI-11 | LOW | defect | A delayed speaking reply starts playing audio after the learner navigated away | fixed |
| AI-12 | MEDIUM | defect | Free/expired/refunded accounts get AI writing grading for the paid A1.2 course (up to 16 tasks + revisions) through the 'free course allowance' | fixed |
| AI-13 | MEDIUM | defect | Trial learners' free A1.1 course writings use up the trial's two exam-writing evaluations, although marketing calls them a separate allowance | fixed |
| AI-14 | LOW | defect | Writing feedback whose save failed is shown as a normal success and is gone after leaving; a repeat consumes the free revision | fixed |
| AI-15 | MEDIUM | defect | Reloading or going Back after assessed course writing shows an empty editor with Next disabled; resubmitting spends the one free improved version | fixed |
| AI-16 | MEDIUM | defect | The exam-writing offer (#222) can never render (hidden for anyone with level access, i.e. every trial user), and the real limit moments (limit_reached / subscription_required) show text with no button | fixed |
| AI-17 | MEDIUM | defect | A correctly completed value-only A1 form (first Start Deutsch 1 task) can leave 'Bewerten lassen' disabled with no reason (universal 10-word gate) | fixed |
| AI-18 | LOW | defect | 'Nächste Aufgabe schreiben' after feedback reopens the same task | fixed |
| AI-19 | MEDIUM | defect | X-Ray connection/decoding failures keep the usage reservation, so a free or anonymous learner's retry gets 'limit reached' until midnight | fixed |
| AI-20 | LOW | defect | Structurally invalid X-Ray JSON is returned as success (allowance consumed) and crashes the results screen | fixed |
| AI-21 | LOW | enhancement | Cache X-Ray analyses for the fixed grammar-example sentences so repeat clicks are instant and cost no AI spend | fixed |
| AI-22 | LOW | enhancement | Share explain-answer results across learners per (item, wrong answer, language) | fixed |
| AI-23 | LOW | enhancement | score-readaloud and explain-answer run an unlocked usage pre-count before the authoritative reservation RPC | skipped |
| AI-24 | LOW | enhancement | A1.2 Übung 4 dictation corrections show a time as a bare number ('Richtig: 20') | fixed |
| AI-25 | LOW | defect | Days whose only activity was a vocab-trainer session drop out of both streaks once those cards are reviewed again (last_reviewed_at is overwritten) | fixed |
| CHK-01 | HIGH | defect | Wrong articles, possessives, pronouns, sein/haben/modal forms and short prepositions inside typed answers are graded 'Almost — just a typo' and count as correct (lesson, checkpoint, review) | fixed |
| CHK-02 | MEDIUM | defect | Spelling and letter-decoding tasks credit a missing letter as a typo (L1 alphabet, L2 Formular, Checkpoint 1 Hören spelled-name dictation) | fixed |
| CHK-03 | MEDIUM | defect | A1.2 stem-vowel forms the item explicitly teaches get typo credit: strong Perfekt participles (getrinken, gegingen, gesprechen, geessen), du-imperative ('Sprech'), modal singular stems ('müss') | fixed |
| CHK-04 | MEDIUM | defect | Lesson dictation marks heard prices wrong when the learner writes digits above 100 or the € sign (A1.2 L2 rejects the '480' its own notice teaches) | fixed |
| CHK-05 | LOW | defect | Adding a spelling error bypasses required polite capitalisation ('Wie geht es ihnenn?' → typo/correct while 'ihnen?' is wrong) | fixed |
| CHK-06 | LOW | defect | Lesson dictation omits the polite-capitalisation flag, so 'Gut. Wie geht es ihnen?' counts as correct in L1 while the checkpoint grades it wrong | fixed |
| CHK-07 | MEDIUM | defect | Grammatical object-first answers ('Ein Glas Wasser möchte ich.', 'Meine Mutter rufe ich an.') are graded wrong because objectFronted misses separable prefixes, measure phrases and -ern/-eln verbs, so no opening cue is added | fixed |
| CHK-08 | LOW | defect | When read-instead audio fallbacks remove most Hören items, a perfectly answered checkpoint fails (guess-ceiling rule applied to 1 measured item) | fixed |
| CHK-09 | LOW | defect | Writing Formcheck marks the name requirement complete for 'ich heiße.' (no name value) | fixed |
| CHK-10 | MEDIUM | defect | Listening dictation grader compares separator-stripped digit strings, not values: prices 10–100× off are marked correct, and correct '20:00', '250,00 €', 'Um 10 Uhr', '3,98 EUR', '15 qm', '10 °C' are marked wrong | fixed |
| CHK-11 | LOW | defect | Dictation word answers ending with a period ('Rathaus.', 'Spätburgunder.', 'zehn Uhr.') are marked wrong | fixed |
| CHK-12 | MEDIUM | enhancement | Practice-draw planning recomputes per-item keys synchronously during render (A1.2 attempt 3 ≈0.7–1 s main-thread freeze; checkpoint planning repeats it) | fixed |
| LSN-01 | MEDIUM | defect | Read-aloud results are lost on the full-page trip to the speaking coach: on return every line is idle again (re-record, spending allowance) or the recap reports speaking as skipped | fixed |
| LSN-02 | MEDIUM | defect | A checkpoint passed while signed out is never stored: the course home keeps offering it, L4 stays locked, and after signup it must be retaken | fixed |
| LSN-03 | MEDIUM | defect | At the A1.1 → A1.2 handover the completion page calls live A1.2 'a paused draft' (and A1.2 finishers get the same about A2.1), and the A1.1 final-test CTA 'Weiter mit A1.2' opens the legacy 28-day plan instead of the paid course | fixed |
| LSN-04 | MEDIUM | defect | A failed lesson-pool load renders the Lektion without its practice items and still records completion and Gold | fixed |
| LSN-05 | MEDIUM | defect | A late due-card (or attempt-count) fetch rebuilds the stages after Start: a warm-up is inserted at index 0, the learner is thrown back a stage and loses typed input, or the practice draw is swapped | fixed |
| LSN-06 | MEDIUM | defect | Remediation requeue serves items restricted to later Lektionen (e.g. an L2 miss requeues an L11 item) | fixed |
| LSN-07 | LOW | enhancement | The lesson warm-up drops each review card's ladder step, so the exercise mode follows batch position instead of learning history | fixed |
| LSN-08 | LOW | defect | An empty typed checkpoint answer can be submitted (Enter/Go) and is locked as a graded wrong answer | fixed |
| LSN-09 | LOW | defect | Review page with nothing due shows two contradictory cards and never the next review date | fixed |
| LSN-10 | LOW | enhancement | Checkpoint runs live only in React state: a reload, iOS tab discard, idle sign-out or guard remount restarts a 20-item checkpoint | fixed |
| LSN-11 | LOW | enhancement | New review cards are due immediately, so Lektion 2 is preceded by '25 cards to review' minutes after Lektion 1 | fixed |
| LSN-12 | LOW | enhancement | Review cards come due at the previous review's clock time, so a learner who returns the next morning finds nothing due | fixed |
| LSN-13 | LOW | enhancement | Every lesson start shows 'Loading…' until the whole level pool has downloaded, although the intro needs only curriculum and Lektion | fixed |
| LSN-14 | LOW | defect | Signing in through the save-progress ask restores an older account snapshot over newer guest work | fixed |
| LSN-15 | LOW | defect | Reconnecting while on the course home leaves an offline completion unsynchronised and the next Lektion locked | fixed |
| LSN-16 | LOW | defect | Course pages client-side `<Navigate>` to the Astro-only /courses/, which renders the SPA 404 until a refresh | fixed |
| LSN-17 | LOW | defect | Course speaking hand-offs use the slashless /speaking?level=… form, paying a canonical redirect on the full-page load | fixed |
| LVS-01 | MEDIUM | defect | Listening dictation edits made after pressing 'Prüfen' are silently dropped: the old answer is graded, saved and shown in the review; typed-but-unregistered answers block submission with no hint | fixed |
| LVS-02 | LOW | enhancement | Listening questions are listed by question_number, so a dialogue's dictation item sits far from its other questions | fixed |
| LVS-03 | LOW | enhancement | Submitting a listening exercise removes the audio player just as transcript and corrections appear | fixed |
| LVS-04 | LOW | defect | The /listening player spends one of its 3 plays and shows 'playing' when audio.play() fails | fixed |
| LVS-05 | LOW | defect | A failed question/dialogue request turns a timed mock listening part into playable audio with no questions, whose unseen items are later scored wrong | fixed |
| LVS-06 | LOW | defect | On a slow connection a returning learner can press 'Test starten' before the resumable-attempt lookup returns and replace their unfinished mock exam | fixed |
| LVS-07 | MEDIUM | defect | 'Nochmal' re-queues the stale card object, so the same-session regrade erases the lapse and pushes a just-forgotten word out for weeks | fixed |
| LVS-08 | MEDIUM | defect | New vocab cards always sort ahead of due reviews (all due_at = enqueue time), so a whole-level deck is never repeated for weeks | fixed |
| LVS-09 | MEDIUM | defect | The 20-card session ends with 'Nichts mehr fällig — komm morgen wieder' while hundreds of cards are still due | fixed |
| LVS-10 | MEDIUM | defect | grade() counts vocab reviews that were never saved and accepts double taps (second tap grades the same stale card and drops the next card unseen) | fixed |
| LVS-11 | MEDIUM | defect | Switching tabs or apps restarts the vocab session (reload keyed on the auth user object) and drops this session's 'Nochmal' cards | fixed |
| LVS-12 | MEDIUM | defect | Weekly plan items 'Wortschatz-Wiederholung: deine Karteikarten aus Woche N' (A1.2, A2.1, A2.2, Goethe A2) land on an empty deck: no plan step adds words and the trainer has no notion of weeks | fixed |
| LVS-13 | LOW | defect | 'Leicht' can schedule a word sooner than 'Gut' (and equals it on the first step) | fixed |
| LVS-14 | LOW | defect | 'Im Trainer ✓' appears when the add failed and stays on after switching category | fixed |
| LVS-15 | LOW | enhancement | 'komm morgen wieder' is false for an evening review: cards come due exactly N×24 h later | fixed |
| LVS-16 | LOW | enhancement | Vocabulary review cards cannot be heard although the query already returns word recordings | fixed |
| LVS-17 | LOW | enhancement | The 'Im Trainer ✓' success state is a dead end; nothing starts the first review | fixed |
| LVS-18 | LOW | defect | The example-sentence speaker on a vocabulary card plays the headword recording | fixed |
| LVS-19 | MEDIUM | defect | Vocabulary-level, grammar-topic and podcast cards attach onClick to a div and cannot be activated by keyboard | fixed |
| GRW-01 | HIGH | defect | The placement test's listening step cannot be finished: the 3 dictation questions per exercise (options NULL) render with no input and keep 'Next Exercise' disabled, so every tester must Skip listening | fixed |
| GRW-02 | MEDIUM | defect | Placement listening load failures leave 'Loading Exercises…' spinning forever; Retry and Skip never render and a reload throws away the 40 written answers | fixed |
| GRW-03 | MEDIUM | defect | Placement takes the highest band scoring 60% even when lower bands failed (6 correct B2 answers + 34 skips → B2.1) | fixed |
| GRW-04 | MEDIUM | defect | Placement answer key is 49% 'B' / 4% 'D' and options are never shuffled, so always clicking B passes B2 | fixed |
| GRW-05 | MEDIUM | defect | One placement question has a wrong answer key (B2-011) and six have a second correct answer (B2-017, B1-011..013, A2-010, A2-016); A1-010's stem is ungrammatical | fixed |
| GRW-06 | LOW | defect | Placement results tell beginners to review B1/B2 topics they never learned, and group topics by display name (one 'Reading Comprehension' link for four levels, possibly a paid page) | fixed |
| GRW-07 | LOW | defect | 'Retake Test' re-serves the same 40 questions in the same order (and, signed in, overwrites current_level) | fixed |
| GRW-08 | LOW | enhancement | Level-test progress lives only in React state: a back-swipe or iOS tab reload on question 30 restarts the 15–20-minute test | fixed |
| GRW-09 | LOW | enhancement | The most common result (A1.1) sends 'Start your first lesson' to a grammar page instead of Lektion 1 of the free course | fixed |
| GRW-10 | LOW | enhancement | Testers placed at A1.2–A2.2 are offered only the free A1.1 course and locked grammar pages, never the live course for their level | fixed |
| GRW-11 | MEDIUM | defect | Onboarding's final buttons are overridden for exam choosers: 'I'm new to German — start Lektion 1' and 'find my level' both open a B1/B2 exam writing task | fixed |
| GRW-12 | MEDIUM | defect | First run sends learners placed at A1.2–A2.2 to a grammar-library page instead of their guided course (CLAUDE.md: never sequence courses by grammar slug) | fixed |
| GRW-13 | LOW | enhancement | A placed learner's first-run card offers no way back to Lektion 1 of the free course | fixed |
| GRW-14 | MEDIUM | defect | The exam-first 'Start here' card never retires after the exam task is done, and an exam chosen in onboarding (incl. 'Just show me around first') does not reach the dashboard until a reload | fixed |
| GRW-15 | LOW | defect | signup_started fires on /signup page view and on the homepage click (double), never on form submit as the event registry defines; the GA mirror drops several registered props | fixed |
| GRW-16 | LOW | enhancement | The signup page's 'Explore A1.1 without an account' link opens the grammar library instead of the free course | fixed |
| GRW-17 | LOW | enhancement | A signup started from the level lock does not return the learner to the level they tried to open | fixed |
| GRW-18 | MEDIUM | defect | Dashboard shows A1.1 grammar progress on the wrong topics: the hand-written registry ids still follow the order from before the 2026-09-03 reorder | fixed |
| GRW-19 | MEDIUM | defect | One weaker grammar re-run marks a finished topic not completed and lowers its score (recordAttempt overwrites is_completed, score and completed_at) | fixed |
| GRW-20 | LOW | enhancement | The dashboard 'Review' card points at the next new grammar topic, not a finished topic that needs review | fixed |
| EML-01 | MEDIUM | defect | No mailer sends List-Unsubscribe / List-Unsubscribe-Post, so Gmail (93% of the list) offers only 'Report spam', which hurts the shared sender used for dunning | fixed |
| EML-02 | MEDIUM | defect | Unsubscribe writes the global stop flag on any GET/HEAD (link scanners, prefetch), its copy says only daily sentences stop although trial/activation/course reminders/campaigns stop too, and there is no way back | fixed |
| EML-03 | MEDIUM | defect | Real cron times make trial_day3 (08:00) and activation_d4 (09:30) select the same learners on the same morning, breaking the disjoint-window invariant | fixed |
| EML-04 | MEDIUM | defect | Expired admin comp grants never clear server-side Pro: is_subscribed/tier stay 'pro', so speaking/writing/X-Ray keep Pro quotas and Astro opens every level indefinitely | fixed |
| EML-05 | MEDIUM | defect | Course reminder names the wrong Lektion — 'Weiter mit Lektion 12' after the course is finished, a locked Lektion at each chapter end (checkpoint open), 'Lektion 1' when old completions fall outside the 30-day window — and mails learners who lost access a link to a lock | fixed |
| EML-06 | LOW | defect | Course-reminder links open the course home although the button names a Lektion, and carry no UTM tags | fixed |
| EML-07 | LOW | defect | The course reminder addresses learners with du, although course mail must speak Sie (CLAUDE.md, binding since 2026-09-30) | fixed |
| EML-08 | LOW | enhancement | A1.2 reminders are generic because the title registry has only A1.1 | fixed |
| EML-09 | LOW | defect | Welcome and activation mails promise a 'ten minute' level test (canonical ~20, landing page 15–20) and point newcomers at X-Ray/the placement test instead of Lektion 1, the activation event | fixed |
| EML-10 | LOW | enhancement | The daily sentence (the mail that reaches the most people) has no link into the free course | fixed |
| EML-11 | LOW | defect | Confirmation-nudge canary accounts behind the oldest 40 eligible accounts can never be sent | fixed |
| EML-12 | LOW | defect | Weekly truth can report >100% L1→L2 course continuation (numerator and denominator are independent 14-day populations) | fixed |
| SEO-01 | HIGH | defect | /vergleich/ and /faq/ sell TestDaF preparation and exam-tuned AI speaking 'auf jedem Niveau' that the product does not have (UWG §5/§6 exposure on pages naming competitors) | fixed |
| SEO-02 | MEDIUM | defect | Unsubstantiated outcome promises on comparison pages: 'denselben Lerneffekt' as live teachers (also in FAQPage JSON-LD) and 'Deutschmeister bringt dich durch die Prüfung' as the Duolingo H1 / 'Prüfung bestehen' card | fixed |
| SEO-03 | MEDIUM | defect | Lingoda price comparison contradicts itself: 'Das ist weniger als eine einzige Lingoda-Stunde' is false on the site's own figures, '~100 €/Monat für 8 Stunden' and the Babbel FAQ price carry no Stand stamp, and the footer self-certifies 'nach UWG §6 zulässig' | fixed |
| SEO-04 | MEDIUM | defect | Comparison hero/why-us copy denies speaking features the same page concedes to Babbel and Duolingo, calls our after-session evaluation 'real-time', and makes unsourced claims about Duolingo and X-Ray uniqueness | fixed |
| SEO-05 | LOW | defect | Lingoda comparison says 'Kein eigenes Zertifikat', but every completed course prints a DeutschMeister Teilnahmebescheinigung | fixed |
| SEO-06 | MEDIUM | defect | The Pro speaking allowance is stated without its 5-minute cap on the page that weighs it against hour-long Lingoda lessons (longer sessions cost wallet credit that cannot be topped up) | fixed |
| SEO-07 | MEDIUM | defect | The comparison 'Was drin ist' block shows '480 Dialoge' (480 dialogue lines in 48 exercises) and '24 Podcast-Folgen' (14 published), stamps our build-time counts 'Stand: Mai 2026', and sets dateModified to the build date | fixed |
| SEO-08 | LOW | defect | Duolingo table claims 'Kein Gamification' for us although the product shows day streaks, streak milestones and combo counters | fixed |
| SEO-09 | LOW | defect | Status icons invert the 'Werbung' rows: our ad-free product renders a red ✗ and Duolingo's ads a green ✓ (tone inferred from the leading symbol) | fixed |
| SEO-10 | LOW | defect | /faq/ free-version answer implies 2 AI speaking sessions without registration (they belong to the trial) and understates the trial's X-Ray allowance | fixed |
| SEO-11 | MEDIUM | defect | The off-sale telc B1 package is still sold on /pricing/ (card, FAQ answer + FAQPage JSON-LD) and in llms.txt, while its own page has no Buy button | fixed |
| SEO-12 | LOW | defect | The /pricing/ comparison table undersells Pro ('telc B1' mock vs six mocks) and the free tier (podcasts '—' although A1.1 podcasts are free without an account) | fixed |
| SEO-13 | MEDIUM | defect | Course pages and the SPA shell meta tags promise grammar 'worked examples with audio'; no grammar example has audio (llms-full.txt says text-only) | fixed |
| SEO-14 | LOW | defect | Generated llms.txt / llms-full.txt label the English /faq/ and /ueber-uns/ pages as German | fixed |
| SEO-15 | LOW | enhancement | The AI-facing catalogue describes only the free A1.1 course, not the live paid A1.2 course | fixed |
| SEO-16 | LOW | enhancement | llms catalogue puts 'no account needed' next to 'an AI-graded writing task', but guests only get a form checklist | fixed |
| SEO-17 | LOW | defect | /level-test meta description retypes 'in 15 minutes' while the claims registry says about 20 | fixed |
| SEO-18 | LOW | defect | sitemap-spa.xml lastmod is frozen at 2026-08-24 despite later changes to the prerendered FAQ and podcast copy | fixed |
| SEO-19 | LOW | defect | IndexNow resubmits all ~133 URLs on every build, including deploy previews and branch builds | fixed |
| SEO-20 | LOW | defect | The podcast RSS feed references a cover image that does not exist (/podcast-cover.svg → 404), so directories reject it | fixed |
| SEO-21 | MEDIUM | defect | Guide pages render five learning links (level test, X-Ray, speaking, letter guide) as literal `<a href>` markup | fixed |
| SEO-22 | LOW | defect | Exam hubs link their writing and mock steps to the generic /schreiben and /modelltest routes, so Start Deutsch 1, Goethe A2 and telc B2 visitors get telc B1 tasks or must pick the exam again | fixed |
| SEO-23 | LOW | enhancement | Paid-level grammar topic pages never link their level's course offer | fixed |
| SEO-24 | LOW | defect | offer_viewed impressions are recorded for cards that are barely visible (any isIntersecting entry counts) | fixed |
| SHL-01 | MEDIUM | defect | The 30-minute idle timeout in any one tab calls a global signOut: every tab and device is signed out, ending a lesson or exam in progress elsewhere | fixed |
| SHL-02 | LOW | defect | Sign-outs that bypass the wrapper (idle timeout, cross-tab, deletion) leave PostHog attached to the previous learner | fixed |
| SHL-03 | MEDIUM | defect | PostHog identify() is dropped when called before the lazy client initialises or before consent, so returning or later-consenting learners stay anonymous until the next auth event | fixed |
| SHL-04 | LOW | enhancement | SPA route changes are not recorded as PostHog pageviews (capture_pageview: true disables History-API pageviews in posthog-js 1.376) | fixed |
| SHL-05 | LOW | defect | Per-user loaders keyed on the auth user object refetch on every tab focus/hourly token refresh (incl. an 'auth.login' audit row each time), and ProgressContext lets a stale response from a previous account overwrite or survive a sign-out/account switch | fixed |
| SHL-06 | LOW | enhancement | Reading totals load only after the first reading completion, so the progress-percentage denominator jumps and the percentage can drop | fixed |
| SHL-07 | MEDIUM | defect | A logout that fails on the network or server keeps the stored session but navigates home as if signed out (shared computers stay signed in) | fixed |
| SHL-08 | MEDIUM | defect | Password reset/update: an expired reset link changes the password of whoever is signed in, the update page dead-ends on 'Auth session missing!', and the fields/toggle have no accessible names or autocomplete | fixed |
| SHL-09 | LOW | enhancement | An expired confirmation link lands on /login's password form; the resend rescue only appears after a failed sign-in | fixed |
| SHL-10 | LOW | enhancement | Login links on Astro pages (nav, grammar exercise lock) drop the page the learner was on; after login they land on /dashboard | fixed |
| SHL-11 | MEDIUM | defect | The trial countdown banner and its Upgrade/Dismiss controls render underneath the fixed navbar and are never visible (and leave a blank 64 px band) | fixed |
| SHL-12 | LOW | defect | The profile exam-date field saves every intermediate keystroke (year 0002) and has no lower bound | fixed |
| SHL-13 | LOW | defect | The account-deletion confirmation is not an accessible dialog, and its email check is case-sensitive | fixed |
| SHL-14 | LOW | defect | Stale-chunk auto-reload only recognises Chrome's error text; Safari/iOS and Firefox get a dead-end error screen after each deploy | fixed |
| SHL-15 | LOW | enhancement | All mock-exam and course-test content (~68 KB min / ~19 KB gz) ships in the SPA entry chunk because the eager ExamSubscriptionGuard imports resolveModelltest | fixed |
| SHL-16 | LOW | enhancement | Prerendered pages preload only vendor bundles; the lazy page chunk (LevelTest/SentenceXRay ≈75 KB) is discovered after the entry runs, causing a content→spinner→content flash | fixed |
| SHL-17 | MEDIUM | enhancement | 'Continue learning' (SPA navbar and Astro) and the Kurs tab resolve only the placement level, so a course buyer who never took the test returns to free A1.1 instead of the course they paid for | fixed |
| SHL-18 | LOW | enhancement | Signed-in learners on Astro pages get no Upgrade/Pricing link (Pricing is anon-only), unlike the SPA chip | fixed |
| SHL-19 | MEDIUM | defect | Astro's course return bar shows 'undefined/undefined' after a rebuilt-lesson speaking hand-off and its 'Done → next' sends the learner to the course overview instead of their unfinished Lektion | fixed |
| SHL-20 | LOW | defect | With the English preference, German guides/comparisons/exam hubs get <html lang='en'> (screen readers mispronounce) | fixed |
| SHL-21 | LOW | enhancement | Grammar exercise locks send 'Buy the <level> course' to generic /pricing/ (whose ticket opens on another course), and exam-hub 'Zum 4-Wochen-Plan' CTAs send unentitled visitors to gated SPA plans instead of the course that includes them | fixed |
| SHL-22 | LOW | defect | The Astro grammar fill-in checker lacks the NFC normalisation its SPA twin received, so decomposed umlauts ('für' typed as u + ¨) are marked wrong | fixed |
| SHL-23 | LOW | enhancement | Grammar 'Practice again' replays the identical exercise order with options in stored order (correct option first in 34% of items) | fixed |
