# DeutschMeister: earn the first useful session, then the purchase

2026-11-01. Repair activation, returning-buyer conversion and payment recovery first. Recorded sales are €59.98 for the latest 30 days. Claude measured 374 signups but only five new payers in 90 days. At today’s 62 signups/month, even 10× acquisition at that historical ratio produces only 8.3 new payers/month. These fixes cannot independently deliver the founder’s $1M/month February goal; a validated offer and much larger distribution remain necessary. This is arithmetic, not a growth forecast. (`FUNNEL.md:5–15`; sales and goal: `docs/agents/TEAM.md:9–15`.)

This is an offline source review, using Claude’s measurements; deployment state is **unverified**. Repository citations are relative to `/home/user/deutschmeister`; `FUNNEL.md` is in `/tmp/dm-plan`. **[agents]** means prepare/build; **[owner]** means approve reserved auth, money, access or messaging changes. Those boundaries come from `docs/agents/PROTOCOL.md:9–17`. No repository changes or network calls were made.

## 1. The leak

**How to read the estimates.** These are three leading repair candidates; actual lost euros cannot yet be ranked. All effects, hours and causal explanations below are **unverified planning scenarios**, with zero as a possible outcome. Use 62 monthly signups, not 374/3: acquisition has slowed. The 90-day aggregates are not a chronological cohort experiment. Use 5/224 payers per confirmed account and 5/102 per tool user only as rough planning proxies; purchase timing and cohort membership need reconciliation. (`FUNNEL.md:5–17`.)

Euros below mean incremental gross first charges, assuming each additional buyer chooses Pro monthly at **€9.99** (`src/data/pricing.js:23–27`), before tax, refunds and fees. They are not MRR, lifetime value or the goal’s net sales measure. Effects mature over subsequent months. “10×” means 620 monthly signups and, for renewal recovery, ten times the subscriber/failure volume. Do not add overlapping experiments.

**Leak A — confirmation interrupts the journey.** 150/374 never confirmed; 17 confirmed more than an hour later (`FUNNEL.md:6`). The old session-less redirect bug is documented and already fixed: signup now retains an inbox panel, resend cooldown and same-browser continuation (`src/lib/signupConfirmation.js:3–35`; `src/pages/SignupPage.jsx:123–171`). Auth sends links to `/login`; `/verify-email` still requires a session (`src/contexts/AuthContext.jsx:142–153`; `src/pages/VerifyEmailPage.jsx:28–36`).

Remaining mechanism: welcome and confirmation messages compete, and purchase intent lives in local storage, so another device cannot recover it from that storage. The welcome trigger fires on account insertion, before confirmation; the handler does not check confirmation (`migrations/2026-08-16-welcome-email-webhook.sql:58–61`; `netlify/functions/send-welcome-email.mjs:127–146`; `src/lib/buyIntent.js:21–36`). Their contribution to abandonment is **unverified**; poor delivery is not established.

Fix: one clear confirmation action, welcome after verified entry, recover the intended task/purchase safely across devices, and test fresh, expired and resent links. Check delivery and existing nudge operation before adding another email: `CONFIRM_NUDGE_ENABLED` already gates a rescue (`netlify/functions/confirmation-nudge.mjs:197–199`). **12 hours [agents], [owner] release.** Scenario: confirmation 59.9%→75% yields **9.4 extra confirmed accounts, 4.3 tool users, 0.21 payers and €2.10** per monthly intake; at 10×: **94, 43, 2.1 and €21**.

**Leak B — finishing onboarding does not produce value.** There are 188 onboarding completions, 102 tool users, 35 returning on two days and four on five days; these are overlapping groups, not evidence that exactly 86 onboarding completers abandoned (`FUNNEL.md:7–11`). Exam selection is saved, but the final buttons lead to beginner learning or a 15–20-minute placement test. Exam work is offered later on the dashboard, conditional on access (`src/components/onboarding/IntroSlides.jsx:43–46,71–94,120–139`; `src/lib/firstRun.js:107–133,176–179`). That detour is a plausible mismatch for exam visitors, not proof of causation.

Speaking adds friction: 19/60 users produced zero turns (`FUNNEL.md:9`). Permission already precedes reservation, and zero-turn closeout already returns allowance; do not rebuild those fixes (`src/pages/SpeakingPage.jsx:306–340`; `netlify/functions/speaking-closeout.mjs:11–15`). However, the “meter” animates CSS bars without measuring microphone input; requests lack a client timeout in the examined turn path (`src/components/speaking/SpeakingSession.jsx:243–255,489–499`; `src/index.css:273–286`). Provider-stage errors and text fallback already exist (`netlify/functions/speaking-turn.mjs:144–185`). The 19 cases could also include voluntary exits or missing transcript persistence, which is best-effort (`netlify/functions/speaking-turn.mjs:195–211`).

Fix: one goal-matched task immediately, real microphone level/playback check, bounded waits and retry, and record where the first turn stops. **16 hours [agents]: 10 onboarding, six microphone.** Scenario: tool use 45.5%→65% of confirmed users gives **7.2 extra users, 0.35 payers, €3.50**; 10×: **72, 3.5, €35**. Recovering half the zero-turn cases means approximately **1.6 additional speakers/month**, within this opportunity, not an extra revenue line.

**Leak C — the buying and recovery window is too narrow.** Nine of 12 historical payers bought 20–129 days after trial expiry, while the trial lasts seven days (`FUNNEL.md:15`). The banner disappears at expiry; the subscription page then says “Trial Expired”; the trial sequence’s final message is one–two days after expiry (`src/components/TrialBanner.jsx:27–32`; `src/pages/SubscriptionPage.jsx:442–458`; `netlify/functions/trial-lifecycle.mjs:174–180`). This identifies a mismatch, not proof that later email causes purchases.

Payment recovery also needs investigation: 19 failed renewals are not necessarily 19 distinct lost subscribers (`FUNNEL.md:13`; retry handling: `netlify/functions/lemonsqueezy-webhook.mjs:691–727`). Dunning already sends a card-update link and the subscription page offers billing recovery. But its “sent” stamp follows an accepted API response, not a delivery receipt; failed trial-mail batches retain their claim (`netlify/functions/lemonsqueezy-webhook.mjs:753–778`; `src/pages/SubscriptionPage.jsx:410–434`; `netlify/functions/trial-lifecycle.mjs:294–317`). Actual delivery failures and unrecovered balances are **unverified**.

Fix: saved-work resume card after expiry; optional useful follow-up at 14/30/60 days, stopping after purchase or opt-out; reconcile invoice→delivery→successful payment, and retry failed sends idempotently without deleting claims. **18 hours [agents], [owner] messaging/money release**, including four hours of measurement. Scenario: **0.5 extra late buyer plus one recovered payer/month = €15**; 10×: **five plus ten = €150**. Recovery is zero if no eligible unpaid invoice remains. Use the deduplicated invoice balance to cap it.

Measure offer exposure→checkout start→paid webhook, confirmation latency, first useful result and day-two return. Join account cohorts and invoice IDs; label guest and consent coverage. Those denominators are currently missing (`FUNNEL.md:17`). Review usability after 14 days; compare payment cohorts through 30/60/130 days because historical purchases are delayed. These are proposed review windows, not significance claims.

## 2. Introducing the site to a new visitor

Ranked by modeled gross euros per implementation hour at today’s volume. Every lift is **unverified**, can be zero, and overlaps other rows. Hours include focused verification; public factual claims and emails require owner review.

| Rank | Experience and evidence | Scenario €/month; hours; €/hour | Responsibility |
|---|---|---|---|
| 1 | **Welcome back after trial.** Show the learner’s actual saved task, next step, free option and relevant paid option. Replace the generic expiry warning. (`src/pages/SubscriptionPage.jsx:442–458`; `FUNNEL.md:15`.) | 0.5 buyer × €9.99 ≈ **€5; 6h; €0.83/h** | [agents]; [owner] emails |
| 2 | **First useful minute.** Offer a short task matched to the chosen exam or beginner goal; make placement optional. Current exits bypass the exam choice (`src/lib/firstRun.js:176–179`). | 0.35 buyer ≈ **€3.50; 10h; €0.35/h** | [agents] |
| 3 | **A real correction before signup.** Extend the existing homepage exercise demo with one owned writing sample, its actual feedback and revision. Label it a recorded example; show a real result screen. Existing demo uses course items (`astro-site/src/components/linie/FirstStop.astro:20–24,123`). | Assumed 0.10 buyer ≈ **€1; 4h; €0.25/h** | [agents] |
| 4 | **45–60-second product walkthrough.** Beside the main homepage action and relevant offer: enter an answer, receive feedback, retry, see the next task. Founder narrates without appearing, or an identified narrator reads an approved script. Existing hero video is decorative (`astro-site/src/components/linie/LineBoard.astro:7–16`). | Assumed 0.15 buyer ≈ **€1.50; 8h; €0.19/h** | [agents] edit; [owner] voice/claims |
| 5 | **Confirmation that continues the task.** Show the correct address, exact email subject, resend state and return destination; retain existing recovery. (`src/pages/SignupPage.jsx:320–385`.) | 0.21 buyer ≈ **€2.10; 12h; €0.17/h** | [agents], [owner] auth/mail |
| 6 | **10–15-second microphone instruction.** At first speaking entry: a captioned real tap/speak/stop example, followed by hearing your own test clip. Narration optional; actual level meter essential (`src/components/speaking/SpeakingSession.jsx:489–499`). | Assumed 0.077 buyer ≈ **€0.77; 6h; €0.13/h** | [agents] |
| 7 | **20–30-second founder introduction.** On About and below product proof: why the founder built it, what AI does, and how support works. Founder speaks; identification/appearance depends on the existing conflicting identity instructions below. | Assumed 0.05 buyer ≈ **€0.50; 4h; €0.12/h** | [owner], [agents] edit |

**First 60 seconds, proposed:** 0–10: skippable questions about exam/everyday German, exam type and optional date/“not booked”; ask starting level only if unknown. 10–40: one beginner response or short original exam-style answer, with microphone check when speaking. 40–60: one understandable correction, retry, and a saved next step. Offer account saving at the existing first pause; no forced tour. Six profiles ever have an exam date, so do not pretend most have a deadline (`FUNNEL.md:15`; first-pause rule: `CLAUDE.md:90–91`).

All videos must show current working screens, honest waiting/editing, captions and click-to-play. Synthetic voices must be labelled. No invented testimonials, outcomes, scarcity, affiliation or pass guarantees. Prices must render from `src/data/pricing.js`: Pro €9.99/month or €79.99/year; A1.2 €40. The telc catalogue says €89, but Claude reports it off sale; exclude it from revenue forecasts until the offer and checkout are reconciled (`src/data/pricing.js:24–27,81,114–125`; `FUNNEL.md:15`).

**“Team of doctors” needs consistent evidence.** About asserts it, and organization data records owner confirmation; marketing instructions instead specify an anonymous singular founder (`src/pages/UeberUnsPage.jsx:103`; `src/data/organization.js:21–23`; `src/data/marketing.js:222–239`). Reconcile these before filming. Do not present medical identity as proof of language-teaching qualifications. Show roles and credentials only when substantiated and approved; independent verification is **unverified**. Lead with observable corrections and real screens.

## 3. Apps and sites to study with REA

These are research targets, **not completed competitive findings**. Current features, German availability and access conditions are **unverified**. Study observable behavior with a permitted test account; retain dated screenshots and timings, then write an independent implementation brief. REA distinguishes observations from inference and supports browser/APK investigation (`.claude/skills/reverse-engineer-anything/SKILL.md:53–65,157–160`). No captures were run here.

| Target | Study → worth adapting | Must not copy |
|---|---|---|
| **Duolingo** | Signup deferral, first answer, return cue → a small success before commitment. | Characters, sounds, lesson text, code or coercive streak pressure. |
| **Babbel** | Goal/level questions, lesson preview, pricing explanation → a clear course-to-purchase story. | Lessons, recordings, screenshots as our assets, promotional claims. |
| **Busuu** | Study plan, placement, correction/proof presentation → make feedback and the next step understandable. | Community corrections, profiles, certificates or testimonials. |
| **Speak** | Permission→first utterance→feedback→paywall timing → one conversational loop before an offer. | Prompts extracted from bundles, scripts, voices or code. |
| **Praktika** | Role choice, tutor introduction, conversation setup → situational roles with clear AI disclosure. | Avatar identities, animations, voice likenesses or proprietary scenarios. |
| **ELSA Speak** | Pronunciation-feedback presentation and retry → actionable, limited claims about speech. German support unverified. | Scoring algorithms, branded diagrams, recordings or unsupported accuracy claims. |
| **Seedlang** | German video→recall→review loop → connect short context to active recall. | Presenter footage, subtitles, audio or flashcard corpus. |
| **Lingoda** | Teacher proof, class expectations, plan comparison → explain delivery and what payment includes. | Teacher profiles, course decks, reviews or claims implying human lessons here. |
| **vhs-Lernportal** | German adult-learner orientation, task accessibility, exam pathways → calm instructions and practical situations. | Exercises, recordings, illustrations or institutional endorsement. |
| **telc official preparation / Deutsch-Box** | Available digital materials, audio navigation and exam-format explanation → clear section instructions and practice expectations. Exact product scope unverified. | Official exam items, answer keys, audio, logos or certification implications. |

Apply the no-code/no-assets/no-copyrighted-content rule to **every** target. Do not bypass access controls or reuse private API data. Start with Babbel, Speak and telc; proposed **six-hour research cap [agents]**. Produce one onboarding, one speaking and one proof experiment, not ten clones. Bundles/APKs are useful only when visible behavior leaves a specific question unanswered.

## 4. Open-source tools we could implement

**Current baseline:** speaking uses OpenAI `gpt-4o-mini-transcribe`, Claude Haiku and OpenAI `gpt-4o-mini-tts` (`netlify/functions/_shared/speakingAI.mjs:8–14`). Writing and speaking assessment use Sonnet 4.6; X-Ray defaults to Sonnet 5 with an environment override (`netlify/functions/evaluate-writing.mjs:192`; `netlify/functions/evaluate-speaking.mjs:418`; `netlify/functions/analyze-sentence.mjs:17`). Course audio supports manifests and browser German speech; read-aloud scores word recognition, not pronunciation (`src/lib/lesson/speech.js:8–25,47–63`; `netlify/functions/_shared/readaloud.mjs:3–7`).

The reviewed review engine uses a fixed 1/4/7/14/60/180-day ladder, not FSRS (`src/lib/review/ladder.js:1–12`). Exam attempts already support timed sections/resume and alternate forms; dictation already exists (`src/services/examService.js:26–64`; `src/data/mockExams/forms.js:1–12`; `src/components/lesson/DictationItem.jsx:10–30`).

All external capabilities, licenses, quality, savings and effort estimates below are **unverified**. Verify the pinned code release, model weights, voice/dataset rights and maintenance separately. “Go” authorizes only a future bounded prototype, not production replacement.

| Tool / license to verify | Concrete fit and cost effect | Effort; recommendation |
|---|---|---|
| **Silero VAD — MIT (verify)** | Add speech/silence detection before `speaking-turn`; avoid sending silent clips through paid ASR→LLM→TTS. Browser/model integration needs validation; simple Web Audio level checking should come first. | **6–10h; GO prototype** after measuring silence failures. Savings depend on silent-request share. |
| **whisper.cpp or faster-whisper — MIT (verify each)** | Benchmark multilingual German ASR against `transcribeAudio`; never select an English-only model. Replaces paid transcription with device/server compute, model downloads and operations. | **16–24h benchmark; NO-GO migration now.** German learner accents and phone latency must pass comparison. |
| **OHF-Voice/piper1-gpl — GPL-3.0 (verify); German voices: separate licenses** | Generate consistent German dialogue/dictation clips into existing audio manifests. Could later replace some paid speaking TTS; browser speech currently has no API charge to save. | **12–20h; GO batch prototype**, subject to voice rights and human listening review; no live-voice switch yet. |
| **Montreal Forced Aligner + Kaldi GOP — MIT / Apache-2.0 (verify); models separate** | Add phoneme alignment and a candidate pronunciation score alongside current word recognition. Alignment alone is not pronunciation assessment. Requires German learner recordings and human calibration. | **60–100h; NO-GO now.** Adds compute/reviewer expense; savings and validity unknown. |
| **LanguageTool core — LGPL-2.1 (verify rules/models separately)** | Add German spelling/grammar hints before Sonnet writing evaluation. It cannot replace task coverage, coherence or exam-rubric feedback. Self-hosting might reduce simple correction calls but adds a service. | **12–20h; GO limited comparison later.** No budgeted savings at six writing users (`FUNNEL.md:9`). |
| **ts-fsrs — MIT (verify)** | Replace the fixed review ladder through a JavaScript adapter; preserve review history and wait for owner-applied schema work. No paid AI service is displaced. | **12–20h; NO-GO now.** Test retention after first-use fixes; four five-day users do not justify tuning (`FUNNEL.md:11`; `CLAUDE.md:92–93`). |
| **spaCy German pipelines — MIT code; model/data licenses verify** | Add vocabulary/syntax features to editorial CEFR checks and task selection. These are level heuristics, not certified A1–B2 judgments. May reduce editorial sorting; adds annotation/validation work. | **16–24h; GO editorial prototype later**, NO-GO automatic learner certification. |
| **llama.cpp + Qwen3-8B — MIT runtime / Apache-2.0 weights (verify)** | Prototype a bounded German role-play tutor behind the existing teacher interface. Potentially replaces Haiku calls; needs separate inference hosting, German quality checks and operational support. | **24–40h benchmark; NO-GO production now.** Net savings could be negative at this volume. |
| **H5P core / Dictation / Branching Scenario — core MIT; each library/content license verify** | Evaluate authoring for dictation and branching exam situations. Existing React dictation, timer and resume already cover much of this; integration would need shared identity, access and progress. | **24–40h; NO-GO platform replacement.** Consider only if authoring time becomes the measured constraint. |

Before any provider swap, measure monthly minutes/tokens, provider spend and cost per completed useful session. Proposed test: the same consented German clips across accents/noise, human-rated corrections, failure rate and end-to-end latency. Savings = displaced API bill − hosting − maintenance − review. At both current and 10× volume, the sign of savings is **unverified**; there is no cost ledger in the supplied funnel. Keep the current service available during any later pilot.

## Top 5 moves, in order

1. Reconcile and repair dunning — 19 failure events/90 days → scenario +1 recovered payer/month; **€10 (€100 at 10×), 12h, [agents] + [owner] release**.
2. Build the post-trial return path — 9/12 historical buyers paid late → scenario +0.5 payer/month; **€5 (€50), 6h, [agents] + [owner] emails**.
3. Deliver a first task and working microphone check — tool use 102/224→65% → scenario +0.35 payer/month; **€3.50 (€35), 16h, [agents]**.
4. Finish confirmation continuity — confirmed 224/374→75% → scenario +0.21 payer/month; **€2.10 (€21), 12h, [agents] + [owner] auth/mail**.
5. Publish one real correction demo — scenario +0.10 payer/month; **€1 (€10), 4h, [agents]**. All numbers inherit the unverified, non-additive model above.

## Questions for the founder

1. Which buyer should the next commercial test serve first: an exam candidate, an A1.2 course buyer, or someone buying speaking practice?
2. Which founder/team identities, roles and credentials may be substantiated publicly, and may the founder narrate a video?
3. Should later trial follow-up be offered as an explicit learner-selected reminder, or prepared within the existing owner-approved email policy?
