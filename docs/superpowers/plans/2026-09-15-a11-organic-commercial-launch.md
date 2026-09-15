# DeutschStart A1.1 Organic Commercial Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell DeutschStart A1.1 for €39 through a focused free-preview funnel and a sustainable organic launch, without paid advertising or inflated promises.

**Architecture:** The Astro course URL becomes the authoritative sales page and derives price/content claims from shared data. It sends learners into three complete guided preview lessons in the React app, where course-specific analytics follow progress to checkout and purchase. Existing consent-aware PostHog and campaign infrastructure are extended with an A1.1 event taxonomy and a five-email sequence.

**Tech Stack:** Astro, React, shared pricing/content data, Lemon Squeezy, PostHog, Resend, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md`

## Offer contract

- Product: DeutschStart A1.1.
- Audience: adult beginners.
- Promise: a practical 30-day route through 12 everyday situations that builds the foundation to continue with A1.2.
- Price: €39 once, lifetime access to the guided course.
- Preview: three complete lessons, not a content teaser.
- Included speaking: the first attempt at each of 12 missions plus 60 permanent flexible minutes.
- Refund: voluntary 30-day refund promise, worded consistently with mandatory legal rights rather than replacing them.
- No fluency, exam-pass or fixed-outcome guarantee.
- Paid acquisition budget remains €0 until the later metrics gate is explicitly approved.

---

### Task 1: Build the dedicated A1.1 sales page

**Files:**
- Create: `astro-site/src/components/courses/A11CourseLanding.astro`
- Modify: `astro-site/src/pages/courses/[level].astro`
- Modify: `astro-site/src/data/courseContents.js`
- Modify: `astro-site/src/data/pricing.js`
- Modify: `astro-site/src/styles/global.css`
- Create: `tests/a11-landing.test.mjs`
- Modify: `tests/claims.test.mjs`

**Interfaces:**
- Canonical URL: `/courses/a1.1/`.
- Primary preview URL: `/course/a1.1/l/1?source=a11-sales`.
- Checkout uses the shared `course_a1_1` product/variant.
- All numeric claims import shared sources.

- [ ] **Step 1: Write the failing page contract**

Assert the A1.1 route renders the product name, practical-foundation promise, 12 situations, 30-day route, three-lesson preview, one-time price from `LEVEL_COURSES`, 378 activities from the verified content data, four checkpoints, final assessment, speaking allowance, refund wording and one primary CTA. Ban “fluent”, “guaranteed”, “pass guaranteed” and retyped `€39` literals outside pricing data.

- [ ] **Step 2: Create the A1.1 page component with exact hierarchy**

Use this core copy:

```text
Eyebrow: DeutschStart A1.1 · For complete beginners
Headline: Start speaking German for real life—not just completing exercises.
Subhead: Follow a practical 30-day route through 12 everyday situations. Build the foundation you need for A1.2, with guided lessons, professional audio and speaking practice.
Primary CTA: Start 3 free lessons
Supporting line: No card required · Keep your progress
```

Sections, in order:

1. outcome-led hero with a small route illustration;
2. proof strip: 12 lessons, 378 activities, 4 checkpoints, final assessment;
3. “Your 12 stops” city route;
4. three-preview-lesson cards showing complete outcomes;
5. a real lesson/audio/speaking walkthrough;
6. what is included and what is not promised;
7. €39 offer card with speaking allowance and lifetime access;
8. 30-day voluntary refund explanation;
9. FAQ;
10. final preview CTA.

Keep a single visual primary action. Checkout appears only after the learner sees the offer or completes preview lesson three.

- [ ] **Step 3: Branch only A1.1 through the dedicated component**

In `[level].astro`, render `A11CourseLanding` for `level === 'a1.1'`; preserve the existing generic page for other levels. Continue deriving SEO title, price and structured product data. Set canonical and social metadata to the course URL.

- [ ] **Step 4: Add honest structured data**

Emit `Course` plus `Offer` schema using `course.price`, EUR, availability only after the real variant exists, and a 30-day duration in description—not a completion guarantee. Do not emit aggregate ratings until genuine review data exists.

- [ ] **Step 5: Observe the real page**

Run the Astro renderer and inspect 320×700, 768×1024 and 1440×900. Confirm the first screen communicates audience, result, price model and preview; confirm no horizontal scroll, readable type, working audio/demo controls and visible focus. Record screenshots and fixes in `docs/releases/a11-sales-page-evidence.md`.

- [ ] **Step 6: Verify and commit**

```powershell
node --test tests/a11-landing.test.mjs tests/claims.test.mjs
npm run check:duplicates
npm run build:verify
git add astro-site/src/components/courses/A11CourseLanding.astro astro-site/src/pages/courses/[level].astro astro-site/src/data/courseContents.js astro-site/src/data/pricing.js astro-site/src/styles/global.css tests/a11-landing.test.mjs tests/claims.test.mjs docs/releases/a11-sales-page-evidence.md
git commit -m "feat: build DeutschStart A1.1 sales page"
```

### Task 2: Connect preview progress, paywall and checkout

**Files:**
- Modify: `src/pages/CourseHomePage.jsx`
- Modify: `src/pages/CourseLessonPage.jsx`
- Modify: `src/components/GuidedCourseGuard.jsx`
- Create: `src/components/course/A11PreviewComplete.jsx`
- Modify: `src/lib/buyIntent.js`
- Modify: `src/config/lemonsqueezy.js`
- Create: `tests/a11-preview-funnel.test.mjs`

**Interfaces:**
- Preview lessons 1–3 require a free account so progress survives devices.
- Lesson-three completion shows the purchase bridge; locked lesson four shows the same offer.
- Checkout metadata includes `user_id`, `product_key: 'course_a1_1'`, and campaign attribution.

- [ ] **Step 1: Write the failing funnel tests**

Cover unauthenticated preview entry, authenticated lessons 1–3, direct lesson-four denial, preview completion, checkout intent persistence and post-purchase return to lesson four. Assert public A1.1 library pages remain free.

- [ ] **Step 2: Implement the preview completion bridge**

Render:

```text
You completed the free route.
You can now introduce yourself, give personal details and order in a café.
Continue through 9 more real-life situations, 4 checkpoints and the final assessment.
Unlock DeutschStart A1.1 — €39 once
```

Below the main button, state lifetime course access, included speaking, and the 30-day voluntary refund. Add a secondary “Review my free lessons” text link.

- [ ] **Step 3: Preserve attribution through checkout**

Accept only known source values (`a11-sales`, `preview-complete`, `locked-lesson`, `email`, `organic-social`, `organic-search`) and store them in the existing buy-intent/session mechanism. Never accept arbitrary metadata keys into Lemon Squeezy custom data.

- [ ] **Step 4: Verify and commit**

```powershell
node --test tests/a11-preview-funnel.test.mjs tests/guided-course-access.test.mjs tests/purchases.test.mjs
git add src/pages/CourseHomePage.jsx src/pages/CourseLessonPage.jsx src/components/GuidedCourseGuard.jsx src/components/course/A11PreviewComplete.jsx src/lib/buyIntent.js src/config/lemonsqueezy.js tests/a11-preview-funnel.test.mjs
git commit -m "feat: connect A1.1 preview to checkout"
```

### Task 3: Add a consent-aware A1.1 funnel dashboard

**Files:**
- Modify: `src/lib/funnelTracking.js`
- Modify: `src/lib/analytics.js`
- Create: `tests/a11-funnel.test.mjs`
- Create: `docs/analytics/a11-funnel.md`

**Interfaces:**
- Events: `a11_sales_viewed`, `a11_preview_started`, `a11_preview_lesson_completed`, `a11_preview_completed`, `a11_offer_viewed`, `a11_checkout_started`, `a11_purchase_confirmed`, `a11_refund_recorded`.
- Properties are limited to lesson number, source category, product key, amount/currency and anonymous experiment version.

- [ ] **Step 1: Write failing event-contract tests**

Assert every event uses the consent-aware `track` wrapper, source values are normalized, lesson is 1–3, amount is server/shared-data derived, and email/audio/transcript/free-form text are rejected.

- [ ] **Step 2: Implement helpers**

```js
export const trackA11PreviewLessonCompleted = (lesson, source) =>
  track('a11_preview_lesson_completed', { lesson, source: normalizeA11Source(source) });
```

Use analogous narrow helpers for all events. Purchase confirmation fires from the existing entitlement observer, not from a checkout-button click. Refund is a server event.

- [ ] **Step 3: Define dashboard calculations**

Document exact denominators:

- sales → preview start;
- lesson 1 → lesson 3 completion;
- preview completion → checkout start;
- checkout start → confirmed purchase;
- purchase → refund within 30 days.

Segment only by normalized source and device class. Do not optimize on fewer than 100 qualified sales-page visits or 20 checkout starts; report intervals and raw counts.

- [ ] **Step 4: Verify and commit**

```powershell
node --test tests/a11-funnel.test.mjs tests/analytics.test.mjs
git add src/lib/funnelTracking.js src/lib/analytics.js tests/a11-funnel.test.mjs docs/analytics/a11-funnel.md
git commit -m "feat: instrument A1.1 sales funnel"
```

### Task 4: Prepare the five-email preview sequence

**Files:**
- Create: `drafts/deutschstart-a11-preview-1.md`
- Create: `drafts/deutschstart-a11-preview-2.md`
- Create: `drafts/deutschstart-a11-preview-3.md`
- Create: `drafts/deutschstart-a11-preview-4.md`
- Create: `drafts/deutschstart-a11-preview-5.md`
- Create: `scripts/send-a11-preview-email.ps1`
- Modify: `netlify/functions/send-campaign.mjs`
- Create: `tests/a11-email-sequence.test.mjs`
- Create: `tests/campaigns.test.mjs`

- [ ] **Step 1: Write the sequence contract**

Require five files, one clear CTA per email, the canonical course URL with `utm_campaign=a11-foundation-2026-09`, purchase exclusions on emails 2–5, unsubscribe handled by the sender, and no guaranteed-outcome language.

- [ ] **Step 2: Write the complete sequence**

Use these subjects and jobs:

1. `Your first 3 German lessons are ready` — set expectation and link to lesson 1.
2. `The first conversation most courses postpone` — teach a useful introduction pattern and link back to progress.
3. `Can you order this in German?` — café micro-challenge and lesson 3.
4. `What happens after the free route` — show the remaining nine stations, speaking and checkpoints.
5. `Continue your A1.1 route for €39 once` — direct offer, lifetime access, allowance and refund terms.

Each body must deliver useful German practice before the CTA. Use plain, adult language and no false urgency or invented scarcity.

- [ ] **Step 3: Add safe operator tooling**

The script accepts `-Email 1..5` and defaults to test mode. A live send additionally requires `-Live -ConfirmCampaign a11-foundation-2026-09`. The request always uses `exclude: ['purchased:course_a1_1']` after the first welcome email and never embeds secrets in the script.

- [ ] **Step 4: Test-render every email**

Send all five only to the configured test address. Check desktop/mobile rendering, CTA URL, UTM values, unsubscribe link and plain-text meaning. A real audience send is a separate hard checkpoint requiring the owner's explicit confirmation after production purchase verification.

- [ ] **Step 5: Verify and commit**

```powershell
node --test tests/a11-email-sequence.test.mjs tests/campaigns.test.mjs
git add drafts/deutschstart-a11-preview-*.md scripts/send-a11-preview-email.ps1 netlify/functions/send-campaign.mjs tests/a11-email-sequence.test.mjs
git commit -m "feat: prepare A1.1 preview email sequence"
```

### Task 5: Build the first four weeks of organic acquisition

**Files:**
- Create: `docs/marketing/a11-organic-launch-calendar.md`
- Create: `astro-site/src/pages/leitfaden/deutsch-a1-anfaenger-start.astro`
- Create: `astro-site/src/pages/leitfaden/sich-auf-deutsch-vorstellen.astro`
- Create: `astro-site/src/pages/leitfaden/auf-deutsch-im-cafe-bestellen.astro`
- Create: `astro-site/src/pages/leitfaden/deutsch-a1-30-tage-plan.astro`
- Modify: `astro-site/src/data/guides/index.js`
- Create: `tests/a11-organic-content.test.mjs`

- [ ] **Step 1: Write the content/claim tests**

Require unique titles/descriptions, canonical URLs, one useful practice block, internal links to relevant free grammar/resources, one course preview CTA, and no thin duplicated sales copy.

- [ ] **Step 2: Publish one high-intent article per week**

Week 1: how an adult beginner should start German. Week 2: introduce yourself. Week 3: order in a café. Week 4: a realistic 30-day A1.1 plan. Each article answers the query fully, includes a practice interaction and naturally offers the matching preview lesson.

- [ ] **Step 3: Create the weekly repurposing calendar**

For each article, specify:

- three 20–45 second short videos: hook, exact teaching point, visual beats, caption, preview CTA;
- one email drawn from the same lesson;
- two helpful community answers tailored to real beginner questions, with a link only when directly useful;
- the owner, publish date, source tag and outcome metric.

Weekly operating load is one article, three shorts, one email and two community answers. Do not automate spam, fake testimonials or mass posting.

- [ ] **Step 4: Verify and commit**

```powershell
node --test tests/a11-organic-content.test.mjs tests/guides.test.mjs tests/claims.test.mjs
npm run build:verify
git add docs/marketing/a11-organic-launch-calendar.md astro-site/src/pages/leitfaden/deutsch-a1-anfaenger-start.astro astro-site/src/pages/leitfaden/sich-auf-deutsch-vorstellen.astro astro-site/src/pages/leitfaden/auf-deutsch-im-cafe-bestellen.astro astro-site/src/pages/leitfaden/deutsch-a1-30-tage-plan.astro astro-site/src/data/guides/index.js tests/a11-organic-content.test.mjs
git commit -m "feat: publish A1.1 organic launch content"
```

### Task 6: Complete production commerce and launch verification

**Files:**
- Create: `docs/releases/deutschstart-a11-launch-checklist.md`
- Create: `docs/releases/deutschstart-a11-launch-evidence.md`
- Modify: `docs/superpowers/plans/2026-09-15-speaking-a11-rebuild-index.md`

- [ ] **Step 1: Configure external products**

Create the real Lemon Squeezy products/variants for DeutschStart A1.1 (€39), AI Coach (€12.99 monthly/€129 annual) and 60-minute top-up (€6.99). Preserve current subscribers' existing variants. Configure environment variables in Netlify without committing IDs or secrets.

- [ ] **Step 2: Pass the sellability gate**

Require populated audio manifest, complete linked practice, closed language edge cases, named DaF approval, passing speaking benchmark, accessibility/privacy/latency gates and enabled production webhook. If any is missing, keep checkout disabled and show preview/waitlist only.

- [ ] **Step 3: Test the entire production journey**

Using a real test buyer:

1. land through an attributed organic URL;
2. create an account and complete all three preview lessons;
3. purchase A1.1;
4. verify lesson four, 12 attempts and 3,600 permanent seconds;
5. complete a mission and verify settlement;
6. issue a refund and verify access/unused-grant revocation;
7. confirm analytics and email exclusion.

Record timestamp, deploy ID, order ID, anonymous user reference, database evidence and observed UI result.

- [ ] **Step 4: Launch organically**

Only after Step 3 passes: publish the four-week calendar, send email 1 after explicit owner confirmation, and monitor funnel/support/errors daily for the first week. Paid ads remain disabled.

- [ ] **Step 5: Define the later paid-acquisition decision**

Revisit a €300–€1,000 monthly test only when there are at least 100 qualified sales-page visits, 20 checkout starts, a stable purchase conversion estimate, refund rate below 10%, no unresolved payment/speaking severity-1 issue, and a documented maximum customer acquisition cost based on real margin. This step records a recommendation; it does not activate ads.

- [ ] **Step 6: Final verification and commit**

```powershell
npm test
npm run lint
npm run build:verify
git add docs/releases/deutschstart-a11-launch-checklist.md docs/releases/deutschstart-a11-launch-evidence.md docs/superpowers/plans/2026-09-15-speaking-a11-rebuild-index.md
git commit -m "docs: verify DeutschStart A1.1 launch"
```
