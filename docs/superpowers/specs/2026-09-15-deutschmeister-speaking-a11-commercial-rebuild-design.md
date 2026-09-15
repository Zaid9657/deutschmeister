# DeutschMeister Speaking and A1.1 Commercial Rebuild

**Date:** 2026-09-15

**Status:** Approved design, pending implementation planning

**Working product name:** DeutschStart A1.1

**Primary audience:** Adult beginners

## 1. Executive summary

DeutschMeister will sell A1.1 as a complete, practical beginner course rather than keeping it permanently free or requiring an immediate subscription. The commercial path is deliberately simple:

1. Try three complete lessons and one short speaking demo for free, without a payment card.
2. Buy DeutschStart A1.1 for **€39 once** with lifetime course access.
3. Continue speaking with an optional **AI Coach for €12.99/month or €129/year**.

The course promise is:

> **Your first German conversations start here.** Follow a clear 30-day A1.1 route through 12 real-life situations—learn the words, hear natural German, practise speaking, and build the foundation for A1.2.

Speaking will be rebuilt around the approved **City Conversation Map**. Learners progress through real-life destinations instead of facing an empty chatbot. The system has three distinct modes:

- **Lesson Missions:** guided, goal-based tap-to-speak practice tied to the course.
- **Live Conversation:** natural real-time practice using a fixed minute allowance.
- **Pronunciation Lab:** word- and phoneme-level feedback based on the actual audio.

The architecture uses a specialist for each job. No single language model may transcribe speech, judge pronunciation, generate teaching feedback, calculate grades, and charge minutes. Raw audio is discarded after processing, transcripts are not retained by default, and failed technical sessions automatically return reserved minutes.

Organic acquisition is the initial growth strategy. One weekly teaching theme becomes one useful article, three short videos, one email lesson, and two helpful community answers. Every channel points to the same primary call to action: **Start 3 lessons free**.

## 2. Current baseline and reason for the rebuild

### 2.1 A1.1 course baseline

The current A1.1 build already provides meaningful substance:

- 12 lessons
- 4 checkpoints
- 378 controlled practice activities
- 263 vocabulary items
- 120 dialogue lines

The latest internal course evaluation scored the build **82/100**. The largest readiness gaps are:

- no professional recorded-audio manifest; browser text-to-speech is still the main voice path;
- no named human DaF review and sign-off;
- 24 remaining minor content edge cases;
- incomplete linked listening and reading coverage across the lessons;
- a shortened final assessment without a genuine speaking component.

The course must not be marketed as premium or fully launch-ready until these gaps are resolved.

### 2.2 Speaking baseline

The current speaking implementation contains most of a technical pipeline, but an earlier audit scored it **68/100** and did not establish an authenticated production-quality end-to-end session. Major weaknesses include:

- transcript-derived feedback presented too closely to pronunciation scoring;
- inconsistent entitlement and usage enforcement;
- conflicting pricing and quota rules;
- incomplete evaluation data and release evidence;
- race and cost-control risks;
- insufficient microphone accessibility and privacy clarity.

The rebuild should reuse safe infrastructure where it proves useful, but existing behavior is not the product contract. The approved design in this document is the contract.

## 3. Goals and non-goals

### 3.1 Goals

- Give adult beginners a clear route from no German to a practical A1.1 foundation.
- Make the first paid purchase understandable and credible without forcing a subscription.
- Make speaking approachable, purposeful, attractive, and visibly connected to lesson progress.
- Provide truthful separation between task success, German quality, and pronunciation.
- Keep AI costs bounded with transparent allowances and model routing.
- Protect learner privacy and prevent double charging or charging for failures.
- Launch using affordable organic channels first.
- Establish measurable release gates so “working” means verified production behavior.

### 3.2 Non-goals

- Do not promise fluency, exam success, employment, immigration outcomes, or completion of the full CEFR A1 level from A1.1 alone.
- Do not present transcript similarity as acoustic pronunciation measurement.
- Do not advertise “unlimited” AI speaking.
- Do not make course access dependent on an ongoing subscription.
- Do not launch all AI modes simultaneously without a controlled beta.
- Do not introduce paid advertising until conversion, refund, retention, and unit-economics signals justify it.

## 4. Audience, positioning, and promise

### 4.1 Audience

The primary audience is **all adult beginners** learning German. The positioning is intentionally broader than an exam-only or profession-only promise. This increases the addressable audience but makes product distinctiveness depend on the experience rather than a narrow niche.

The common learner need is practical confidence:

- they do not know what to learn first;
- they understand isolated words but cannot form useful exchanges;
- they are hesitant to speak;
- they want visible progress without committing immediately to an expensive school or annual app.

### 4.2 Positioning

DeutschStart A1.1 is a **practical foundation**, not an entertainment app and not a compressed exam-preparation product.

Core positioning statement:

> DeutschStart A1.1 gives adult beginners a structured route through the first German situations they actually need, combining complete lessons, professional audio, controlled practice, and guided speaking in one lifetime-access course.

### 4.3 Messaging guardrails

Use:

- “Build your practical A1.1 foundation.”
- “Practise 12 everyday situations.”
- “Prepare to continue with A1.2.”
- “Your first German conversations start here.”

Avoid:

- “Become fluent in 30 days.”
- “Complete A1 in one month.”
- “Pass any exam guaranteed.”
- “Speak like a native.”

## 5. Product offer

### 5.1 Free preview

The free preview contains:

- the first three complete A1.1 lessons;
- professional lesson audio;
- normal practice activities and visible progress;
- one short guided speaking demo;
- no payment-card requirement.

Recommended preview lessons:

1. **Hallo, ich bin …**
2. **Ich bin Studentin.**
3. **Meine Familie.**

The preview must feel like the real course, not a restricted marketing demo. Payment is requested only after learners have experienced the instructional pattern and a speaking outcome.

### 5.2 Paid A1.1 course

**Price:** €39 once

**Access:** lifetime access to the purchased course

**Refund policy:** voluntary 30-day refund under clearly published terms

Included:

- all 12 lessons;
- 378 controlled practice activities;
- 4 checkpoints;
- professional audio;
- linked reading and listening practice;
- final assessment with a speaking component;
- completion certificate;
- the first attempt at each of 12 guided speaking missions;
- 60 flexible speaking minutes that do not expire.

### 5.3 Thirty-day route

The course is presented as a 30-day route through 12 useful destinations. The exact lesson titles may be refined editorially, but the practical sequence is:

1. introduce yourself;
2. say what you do;
3. talk about family;
4. buy something;
5. communicate in class;
6. handle a simple office interaction;
7. talk about hobbies;
8. make simple plans;
9. order in a café;
10. ask at a station;
11. describe your day;
12. invite someone and respond.

“Thirty-day route” describes the recommended schedule, not an access deadline. Learners retain lifetime access and may move more slowly.

### 5.4 Sales-page hierarchy

The course landing page should use the City Conversation Map identity and this order:

1. **Hero:** practical promise, €39 once, and “Start 3 lessons free.”
2. **Proof strip:** 12 lessons, 378 activities, 4 checkpoints, 12 speaking missions.
3. **Route map:** the 12 real-life situations.
4. **Product demonstration:** one lesson sequence and the café speaking mission.
5. **Learning outcomes:** what learners can do, carefully limited to A1.1.
6. **What is included:** course, audio, assessment, speaking allowance, certificate.
7. **Quality evidence:** named DaF review, real interface screenshots, and authentic learner evidence when available.
8. **Price:** €39 once, lifetime access, 30-day refund policy.
9. **Frequently asked questions:** level scope, access, speaking minutes, devices, refunds, and A1.2 continuation.
10. **Final call to action:** start the free preview.

The page should not place the AI Coach subscription beside the main course purchase. The first decision is the €39 course. AI Coach appears after a learner receives value from speaking.

## 6. Speaking experience

### 6.1 Visual identity: City Conversation Map

The approved direction uses:

- deep navy foundations;
- strong cobalt route geometry;
- acid-lime progress, success, and primary-action accents;
- clear adult typography;
- route lines, stations, mission tickets, and destination stamps as signature elements.

This system must feel energetic and adult, not childish, game-like, or like a generic neon AI interface. The identity should extend to the speaking hub, lesson missions, feedback, course route, certificates, emails, and launch creative.

### 6.2 Speaking home

The speaking home has two layers:

1. **Course route:** the 12 A1.1 mission destinations in lesson order, with completed, current, and locked states.
2. **Practice modes:** Live Conversation and Pronunciation Lab, clearly labeled as different activities.

The page always shows:

- the learner’s next recommended mission;
- completed and remaining destinations;
- permanent and subscription-minute balances without misleading aggregation;
- whether the next activity is included, uses monthly minutes, or uses permanent minutes;
- a clear explanation of each mode.

### 6.3 Lesson Mission flow

#### Preparation

Before starting, show:

- the real-life goal;
- estimated time;
- the phrases the learner is expected to use;
- microphone and connection readiness;
- whether the mission is the included first attempt or will use minutes.

#### Active mission

- Use tap/hold-to-speak as the default for reliability and beginner control.
- Provide visible captions, replay, a slower-coach option, phrase hints, and keyboard controls.
- Keep the task goal and progress visible.
- Use short A1-appropriate turns.
- Never interrupt the learner in guided mode.
- Do not start the allowance clock before the readiness check succeeds.

#### Mission result

The result appears as a mission ticket and separates:

- **Task:** whether the real-life goal was achieved;
- **Language:** a concise corrected version and one priority improvement;
- **Pronunciation:** acoustic feedback derived from the audio;
- **Next step:** repeat, visit Pronunciation Lab, or continue to the next destination.

A single composite score must not obscure these distinct signals.

### 6.4 Live Conversation

Live Conversation is a premium practice mode using the flexible balance or AI Coach allowance.

- Learners select a scenario and a 5-, 10-, or 15-minute duration.
- The remaining allowance and maximum charge are shown before starting.
- The interface supports natural turn-taking and interruption handling.
- Captions remain available.
- If the real-time connection becomes unstable, the session offers to continue in guided tap-to-speak mode while preserving the scenario.
- A provider or application failure returns unused reserved minutes automatically.

### 6.5 Pronunciation Lab

Pronunciation Lab is deliberately narrower than conversation:

- listen to a reference;
- record a word or phrase;
- receive word- and phoneme-level accuracy, fluency, and completeness feedback;
- replay the reference and learner attempt during the active result only;
- practise the one highest-priority sound rather than receiving a dense score report.

The interface must explain that accent variation is normal and that the aim is understandable German, not imitation of a single identity or accent.

### 6.6 Accessibility

- Every microphone control has a visible text label and accessible name.
- Spacebar and an ordinary button provide alternatives to pointer-only holding.
- Captions are available for all generated speech.
- Color is never the only indicator of success, lock, error, or progress.
- Animations respect reduced-motion settings.
- The experience works at mobile widths and with keyboard-only navigation.
- Permission-denied states explain how to restore microphone access without trapping the learner.

## 7. Pricing, subscriptions, and allowances

### 7.1 Offer matrix

| Offer | Price | Speaking access | Expiry |
|---|---:|---|---|
| Free preview | €0 | One short speaking demo | Preview only |
| DeutschStart A1.1 | €39 once | 12 included first mission attempts + 60 flexible minutes | Course and flexible minutes do not expire |
| AI Coach monthly | €12.99/month | 120 minutes each billing month across guided, live, and Pronunciation Lab modes | Monthly allowance resets |
| AI Coach annual | €129/year | 120 minutes released each month | Monthly allowance resets during active annual term |
| Permanent top-up | €6.99 | 60 flexible minutes | Does not expire |

Prices are consumer-facing gross-price proposals and must be verified against tax presentation, payment fees, and final store configuration before launch.

### 7.2 Allowance rules

- The first attempt at each course mission does not reduce the 60-minute permanent balance.
- Included first attempts are bound to the course mission and cannot be converted into general minutes.
- Active monthly allowance is consumed before permanent course or top-up minutes.
- Unused monthly allowance does not roll over.
- Permanent course and top-up minutes do not expire.
- A session reserves the selected maximum duration, then finalizes actual usage and refunds the remainder.
- Technical failures refund affected reserved minutes automatically.
- User-requested early endings finalize actual elapsed usage.
- Retries use an idempotency key so network repetition cannot charge twice.

### 7.3 Existing subscribers

The current seven Pro subscribers are grandfathered while continuously subscribed:

- existing monthly subscribers retain €9.99/month;
- existing annual subscribers retain €79.99/year;
- they receive the same 120-minute monthly speaking allowance;
- cancellation and later resubscription move the learner to the then-current public price;
- no existing paid entitlement is silently removed.

### 7.4 Upsell timing

AI Coach should be offered after proof of value, for example:

- after completing several included missions;
- after the learner receives a strong mission result;
- when the permanent balance approaches 20 minutes;
- from a dedicated speaking-plan page.

Do not place a subscription interstitial before the first free speaking demo or before the €39 course purchase.

## 8. Technical architecture

### 8.1 Existing platform fit

The rebuild should fit the current platform:

- React 18 and Vite for the learner interface;
- Netlify Functions for server-side speaking orchestration;
- Supabase for authenticated learner, entitlement, progress, and ledger data;
- Lemon Squeezy for course, subscription, and top-up commerce;
- PostHog for consent-aware product events without audio or transcript content.

### 8.2 Specialist model routing

| Job | Initial candidate | Reason | Lock condition |
|---|---|---|---|
| Guided transcription and acoustic pronunciation | Azure Speech Pronunciation Assessment | Provides transcript plus word/phoneme accuracy, fluency, and completeness | German A1 evaluation and privacy/vendor review pass |
| Guided mission teacher | GPT-5.6 Luna, benchmarked against Claude Haiku | Low-cost short dialogue and structured feedback candidate | Teacher-scored benchmark chooses the better quality/cost option |
| Teacher voice | GPT-4o Mini TTS | Consistent generated German voice at a balanced cost | Listening-quality and latency tests pass |
| Live Conversation | GPT-Realtime-2.1 Mini over WebRTC | Balanced real-time audio quality and cost | Controlled German beta passes |
| Final language assessment | Schema-validated GPT-5.6 Terra plus deterministic rules and acoustic scores | Stronger synthesis without giving one model complete authority | Calibration against teacher grades passes |

Model IDs must be configuration, not embedded throughout UI or business logic. The router must allow provider replacement without changing the learner-facing contract.

Provider pricing is time-sensitive. As of 2026-09-15, official published candidates include:

- [GPT-4o Mini Transcribe](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe)
- [GPT-4o Mini TTS](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts)
- [GPT-Realtime-2.1 Mini](https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini)
- [OpenAI model guide](https://developers.openai.com/api/docs/models)
- [Azure Speech Pronunciation Assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool)
- [Claude Sonnet 5 announcement and pricing context](https://www.anthropic.com/news/claude-sonnet-5)

Pricing, availability, regional processing, retention, and API terms must be rechecked immediately before implementation and production launch.

### 8.3 Server-side session flow

1. Verify the authenticated user.
2. Resolve course, subscription, top-up, and included-mission entitlements on the server.
3. Run readiness checks before billing begins.
4. Create a speaking session with an idempotency key.
5. Atomically reserve the maximum permitted minutes from the correct balance buckets.
6. Route audio to the mode-specific provider path.
7. Validate every generated structured result against a strict schema.
8. Finalize actual usage, refund unused reserved minutes, or fully refund provider/application failures.
9. Store the minimum session summary and consent-aware analytics events.

The client may display balances but may never be authoritative for entitlement, remaining usage, session duration, or refunds.

### 8.4 Suggested data boundaries

The implementation plan may adapt existing schema names, but the responsibilities must remain explicit:

- **entitlements:** course ownership, active plan, grandfathered plan, and effective dates;
- **speaking_sessions:** user, mode, lesson/scenario, start/end, status, duration, model-config version, task outcome, aggregate scores, and failure code;
- **usage_ledger:** immutable reserve, finalize, refund, grant, reset, and top-up entries with idempotency keys;
- **mission_attempts:** course mission, attempt ordinal, included/paid source, completion result, and feedback summary;
- **model_evaluations:** dataset version, model configuration, rubric scores, reviewer, and release decision.

Do not store raw audio in these tables. Do not store full transcripts by default.

### 8.5 Cost controls

- Offer bounded 5-, 10-, and 15-minute live sessions.
- Cap generated response length and conversation history.
- Summarize long live histories rather than replaying the full transcript to the model.
- Cache common TTS lesson phrases and fixed instructions.
- Separate guided and real-time cost reporting.
- Alert on abnormal cost per learner, per completed mission, and per subscription month.
- Maintain an emergency provider/mode kill switch that does not remove purchased permanent minutes.

## 9. Privacy, security, and safety

### 9.1 Data minimization

- Raw audio is streamed for processing and discarded after the response.
- Full transcripts are visible during the session/result but are not retained by default.
- Store only session metadata, outcome, aggregate scoring, selected feedback summary, cost, and failure information required to operate and improve the service.
- Product analytics must not contain raw audio, transcripts, learner phrases, email addresses, or provider prompts.

If saved transcripts are introduced later, they require a separate explicit product decision, clear learner control, retention period, deletion path, and privacy/legal review.

### 9.2 Vendor controls

- Execute appropriate data-processing agreements.
- Prefer EU regional processing where available and operationally suitable.
- Confirm API data is excluded from provider training under the applicable commercial terms.
- Document subprocessors and international transfer mechanisms.
- Define deletion and incident-response responsibilities.

This design is privacy-oriented but does not replace a formal GDPR/DSGVO legal review before launch.

### 9.3 Application security

- Require a verified Supabase session for paid speaking endpoints.
- Resolve entitlements from trusted server-side data.
- Verify Lemon Squeezy webhook signatures and handle events idempotently.
- Rate-limit session creation and turn endpoints.
- Validate content type, audio size, duration, and supported format.
- Use short-lived provider session credentials where direct WebRTC access is required.
- Keep permanent provider credentials server-side.
- Maintain auditable ledger records without exposing internal provider identifiers to learners.

### 9.4 Pedagogical safety

- Keep generated language at the selected CEFR level.
- Refuse unsafe, sexual, hateful, self-harm, illegal, or otherwise inappropriate roleplay and offer a safe learning alternative.
- Do not provide medical, legal, or immigration advice as a speaking tutor.
- Do not infer identity, ethnicity, intelligence, or proficiency from accent.
- Explain that pronunciation feedback estimates comprehensibility and practice priorities rather than personal worth.

## 10. Error handling and reliability

### 10.1 Pre-session failures

If authentication, entitlement, microphone, connection, or provider readiness fails before reservation, the clock does not start and no minutes are charged.

### 10.2 In-session failures

- Reconnect transient WebRTC failures where safe.
- Offer guided tap-to-speak fallback while preserving the scenario goal.
- Preserve already completed turns in the active browser session where possible.
- Refund provider/application failure time automatically.
- Show a plain-language result such as “The connection failed; your 5 minutes were returned.”

### 10.3 Retry and concurrency behavior

- Every state-changing request uses an idempotency key.
- Reserving and finalizing minutes uses database transactions or equivalent atomic operations.
- Parallel tabs may not overspend the same balance.
- Provider callbacks and webhook retries are safe to replay.
- A reconciliation job detects sessions stuck in reserved state and refunds them according to a documented timeout.

## 11. Evaluation and release gates

### 11.1 Model benchmark

Before choosing the mission-teacher provider, run the same German A1 dataset through at least the two approved candidates. The dataset must include:

- every one of the 12 course missions;
- correct, partially correct, off-topic, silent, and unintelligible answers;
- grammar and vocabulary errors typical for A1 learners;
- short and long learner turns;
- quiet and noisy recordings;
- varied adult accents and speech rates.

Reviewers score:

- CEFR level fit;
- teaching correctness;
- correction priority;
- task-state accuracy;
- conversational naturalness;
- safety;
- structured-output reliability;
- latency;
- cost per completed mission.

### 11.2 Mandatory release gates

1. **Conversation coverage:** at least 50 end-to-end German A1 conversations covering all missions and key failure cases.
2. **Human review:** a qualified DaF reviewer signs off on course language, scenario behavior, hints, corrections, and grading.
3. **Pronunciation truth:** audio-based results are calibrated and transcript-only inference cannot appear as pronunciation scoring.
4. **Latency:** guided feedback begins within 2.5 seconds at p95; live replies begin within 1.5 seconds at p95 under the defined test environment.
5. **Billing integrity:** automated reserve, finalize, disconnect, retry, parallel-tab, webhook, and refund tests pass without double charging.
6. **Privacy:** data inventory, vendor terms, retention, deletion, and consent behavior pass review.
7. **Accessibility:** microphone, captions, keyboard, mobile, reduced-motion, and error states pass manual and automated checks.
8. **Production proof:** an authenticated production session successfully completes each released mode with correct entitlement and ledger entries.

### 11.3 Controlled rollout

- **Stage 1:** internal and invited guided-mission testing.
- **Stage 2:** guided missions and Pronunciation Lab beta with real learners.
- **Stage 3:** Live Conversation beta for a small eligible group.
- **Stage 4:** public course launch once course readiness and guided speaking gates pass.
- **Stage 5:** public AI Coach launch once Live Conversation, billing, privacy, and support gates pass.

The €39 course may launch before the public AI Coach subscription only if all advertised included speaking benefits are genuinely available and the subscription is not promised as already live.

## 12. Organic acquisition and sales

### 12.1 Customer route

All organic channels share one route:

1. **Discover:** search, YouTube Shorts, Instagram Reels, TikTok, and relevant learner communities.
2. **Try:** three complete lessons and the speaking demo.
3. **Believe:** complete one useful German mission.
4. **Buy:** purchase A1.1 for €39 once.
5. **Continue:** move to A1.2 or optional AI Coach.

### 12.2 Weekly content engine

Use one learner problem each week and repurpose it deliberately:

- **1 useful article:** answer one focused beginner search need.
- **3 short videos:** one common mistake, one mini-dialogue, and one speak-along challenge.
- **1 email lesson:** teach the week’s highest-value idea and link to the free preview.
- **2 community contributions:** answer relevant questions helpfully without promotional spam.

Every asset uses one primary call to action: **Start 3 lessons free**.

Suggested initial themes:

- how to introduce yourself in German;
- ordering coffee politely;
- when to use *sein* and *haben*;
- German numbers and prices;
- asking simple questions;
- basic word order;
- talking about family;
- arranging a time and place.

### 12.3 Five-email preview sequence

1. **Your 30-day German route** — set the practical outcome and send the learner into lesson one.
2. **One sentence you can use today** — deliver useful instruction and return to the course.
3. **Try the café mission** — demonstrate speaking through a concrete task.
4. **What the complete route contains** — present all 12 situations and the €39 offer.
5. **Is DeutschStart right for you?** — answer level, time, access, speaking, and refund objections without false urgency.

### 12.4 Four-week launch

#### Week 1 — product truth

- finish professional audio;
- complete content edge-case cleanup;
- secure named DaF review;
- verify checkout, entitlements, refunds, analytics, and support content.

#### Week 2 — controlled evidence

- invite a small group of suitable adult beginners;
- observe preview, lesson, speaking, checkout, and device usability;
- collect honest learner feedback and permission before using any testimonial;
- fix blockers rather than manufacturing promotional proof.

#### Week 3 — list reactivation

- invite the existing email audience into the three-lesson challenge;
- send useful content before the offer;
- segment by preview start and lesson completion where consent and data allow.

#### Week 4 — public launch

- open the €39 course publicly;
- publish route demonstrations, learner questions, speaking clips, and FAQs;
- continue the evergreen preview sequence after launch week.

### 12.5 Warm-list scenarios

Using approximately 1,085 confirmed contacts and a €39 gross course price:

| Purchase rate | Approximate sales | Gross revenue scenario |
|---:|---:|---:|
| 1% | 11 | €429 |
| 3% | 33 | €1,287 |
| 5% | 54 | €2,106 |

These are planning scenarios, not forecasts or promises. They exclude VAT treatment, refunds, payment fees, and operating costs.

### 12.6 Later paid acquisition

Paid advertising remains off initially. A lean **€300–€1,000 monthly** test may begin only after the product has enough real data to support it. Suggested entry conditions:

- at least 30 paid course purchases;
- preview-to-purchase conversion consistently measured;
- refund rate and support burden are acceptable;
- the AI cost per engaged learner is known;
- the landing page and checkout have no major observed blockers;
- contribution margin can support a defined acquisition-cost ceiling.

Start at the low end of the range, use high-intent search and retargeting first, and scale only when measured contribution margin—not top-line revenue—supports it.

## 13. Analytics and decision metrics

### 13.1 Funnel events

Track consent-aware events such as:

- `a11_landing_viewed`
- `a11_preview_started`
- `a11_preview_lesson_completed`
- `speaking_demo_started`
- `speaking_demo_completed`
- `a11_checkout_started`
- `a11_purchase_completed`
- `speaking_mission_started`
- `speaking_mission_completed`
- `pronunciation_practice_completed`
- `live_session_started`
- `live_session_completed`
- `speaking_minutes_refunded`
- `ai_coach_offer_viewed`
- `ai_coach_subscribed`
- `a11_refund_requested`

Permitted properties include acquisition source, campaign, lesson/scenario ID, speaking mode, duration bucket, outcome, plan, model-configuration version, and failure category. Never send raw audio, full transcripts, or learner utterances to analytics.

### 13.2 Initial operating targets

Targets are hypotheses to evaluate, not promises:

- preview start rate from eligible landing-page visitors;
- lesson-one and three-lesson preview completion;
- speaking-demo start and completion;
- preview-to-purchase conversion;
- first paid lesson and first mission activation;
- course completion and final-assessment completion;
- AI Coach attachment and monthly speaking engagement;
- refund, failure, automatic-refund, and support-contact rates;
- gross margin and AI cost by mode.

The weekly internal report should show the complete route rather than celebrating registrations or traffic in isolation.

## 14. Implementation sequence

The implementation plan should preserve these dependencies:

### Phase A — course sale readiness

- professional recorded audio and manifest;
- content cleanup and linked skill practice;
- speaking-inclusive final assessment;
- named DaF review;
- free-preview and paid-entitlement definitions.

### Phase B — speaking foundation

- authoritative entitlements;
- atomic minute ledger;
- session state machine and idempotency;
- privacy-safe event and data schema;
- configurable provider router;
- microphone readiness and accessibility foundation.

### Phase C — guided value

- 12 City Conversation Map lesson missions;
- real acoustic pronunciation scoring;
- structured task/language/pronunciation feedback;
- mission tickets and course route progress;
- evaluation harness and teacher review.

### Phase D — live practice

- WebRTC live mode;
- duration selection and reservation;
- captions and interruption handling;
- guided fallback and automatic refunds;
- controlled beta and cost monitoring.

### Phase E — commercial launch

- €39 course checkout and grandfathering;
- AI Coach and top-up products after their release gates pass;
- landing page, free preview, email sequence, and launch analytics;
- organic publishing cadence and weekly truth report.

## 15. Definition of done

The rebuild is complete only when all of the following are true:

- the public offer, checkout, account, and entitlements match the approved price matrix;
- the three free lessons and speaking demo work without requesting a payment card;
- the paid course provides all promised lessons, professional audio, checkpoints, assessment, certificate, missions, and permanent minutes;
- the City Conversation Map journey works on desktop and mobile with accessible controls;
- guided task, language, and pronunciation feedback come from their approved evidence sources;
- Live Conversation uses fixed visible allowances and can fail down safely;
- permanent, monthly, included-mission, and top-up balances are accounted for correctly under concurrency and retries;
- raw audio is not retained and full transcripts are not stored by default;
- the release gates in Section 11 pass and their evidence is retained;
- production checkout, webhook, authenticated session, mission, feedback, minute finalization, refund, and analytics flows are verified end to end;
- launch copy uses the practical-foundation promise without exaggerated outcomes;
- the organic funnel and five-email sequence are ready before public sales open.

## 16. Approved decisions

The user explicitly approved:

- all adult beginners as the audience;
- a paid complete course with a free preview;
- practical foundation as the primary promise;
- fixed speaking allowances;
- a hybrid of guided missions and premium live conversation;
- balanced model quality and cost;
- organic acquisition first, with a later lean advertising budget;
- the Foundation First product model;
- the revised €39 offer and 30-day practical route;
- City Conversation Map as the speaking identity;
- the speaking home, active mission, and mission-ticket journey;
- the pricing, allowance, top-up, and grandfathering architecture;
- the organic sales engine;
- the specialist-model, privacy, reliability, and release-gate architecture.

Any implementation change that materially alters these decisions requires a new product decision rather than being treated as an incidental technical adjustment.
