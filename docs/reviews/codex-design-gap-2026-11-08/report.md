# DeutschMeister → MedMeister quality parity

## 1. Verdict in three lines

**Scores, DeutschMeister / MedMeister:** visual craft **6/8**; typography **7/9**; colour and brand coherence **7/8**; imagery and illustration **3/8**.  
Showing the product **6/9**; trust and proof **4/6**; information architecture and navigation **6/7**; mobile **6/8**; copy voice **5/8**; conversion path **5/7**.  
**Overall: roughly 6/10 versus 8/10—about two focused months behind**, approximately **100–140 agent-hours over 6–8 weeks**, with founder decisions and external release dependencies additional.

These are design judgments, not measured conversion scores. MedMeister’s largest advantage is that its pages repeatedly show a recognisable product solving a specific problem. DeutschMeister spends more space explaining its metaphor, catalogue and payment model.

## Evidence and limits

I inspected the supplied desktop and mobile images for all page pairs, the text captures, the relevant implementation, October’s design documents, August’s parity roadmap and November 1’s conversion review. **No files changed.**

Screenshot filenames below are relative to the supplied [shots directory](/tmp/claude-0/-home-user-deutschmeister/97df4863-0325-56c0-ac9f-9d9347a56d21/scratchpad/shots).

Two limitations materially affect the conclusions:

- **MedMeister’s scroll captures mostly failed to advance.** For every page except `/fsp-pruefung`, all desktop steps are byte-identical within that page; the same holds on mobile. `/fsp-pruefung` has two unique images because a promotional modal appears. Consequently, I can compare its visible folds confidently, but cannot certify its complete below-fold design.
- **DeutschMeister’s blank full-page regions are not proof of empty content.** The source contains the missing sections, scroll-reveal hiding and deferred rendering. Some supplied “folds” also show a position below the page’s beginning. I have not counted those captures as proven heading-clipping defects.

There is progress since November 1: the homepage now contains a labelled, checker-validated correction example; pricing puts paid choices first; the level-test Start button is near the heading; and the core telc guide now has a relevant offer CTA. Those fixes should be preserved.

## 2. Page-pair comparison

| Page pair | What MedMeister does better | What DeutschMeister does better |
|---|---|---|
| **Home ↔ home** | **1.** Opens with a learner’s problem: practising alone, rather than understanding a train line. **2.** Shows a substantial example dashboard with a case, continuation action and learning destinations. **3.** Mobile brings the exam selector and trial action ahead of the long explanation. Evidence: `mm-steps/home_d_00.png`, `home_m_00.png` versus `dm_home_d_fold.png`, `dm_home_m_fold.png`. | The homepage has an actual answerable exercise, rather than relying entirely on illustrative interface panels. Its recorded correction is explicitly labelled. Keep both. Evidence: `dm_home_d_fold.png`, `dm_home_d_full.png`. |
| **`/pricing/` ↔ `/preise`** | **1.** Frames the choice around the buyer’s need. **2.** Keeps an example of the purchased experience beside that choice. **3.** Places payment reassurance immediately below the main action. Evidence: `mm-steps/preise_d_00.png`, `preise_m_00.png`. | DeutschMeister actually exposes paid prices in its opening choices; MedMeister’s captured first screen contains no paid price. The ownership/subscription distinction is useful, although overexplained. Evidence: `dm_pricing_d_full.png`, `dm_pricing_m_fold.png`. |
| **`/courses/` + `/courses/a1-2/` ↔ `/fspm`, `/kp-masterclass`, `/telc-masterclass`** | **1.** Each course has a distinct problem-led promise. **2.** Examples demonstrate the method: conversation → letter → examination, or knowledge → case → simulation. **3.** The panels contain plausible task content, rather than just feature counts. Evidence: `mm-steps/fspm_d_00.png`, `kp-masterclass_d_00.png`, `telc-masterclass_d_00.png`; mobile equivalents reinforce the hierarchy. | A1.2’s mobile hero is commercially strong: outcome, level, price, included Pro period and Buy action fit together. The detailed syllabus offers inspectable substance. Evidence: `dm_courses-a1-2_m_fold.png`, `dm_courses-a1-2_d_full.png`. The hub weakens this with two catalogues and repeated introductions: `dm_courses_d_full.png`, `dm_courses_m_fold.png`. |
| **`/pruefung/telc-b1/` ↔ `/fsp-pruefung`** | **1.** Uses a broad editorial header, then a desktop contents rail alongside the article. **2.** Provides a consistent illustration treatment. **3.** Makes article navigation explicit near the beginning. Evidence: `mm-steps/fsp-pruefung_d_00.png`, `fsp-pruefung_m_00.png`. | DeutschMeister maps preparation to its actual tools and renders a dated source footer. Keep that specificity. Evidence: `dm_pruefung-telc-b1_d_full.png`. Its mobile introduction, language notice and exam-definition block postpone any useful action: `dm_pruefung-telc-b1_m_fold.png`. Neither captured fold is an exemplary sales page. |
| **`/grammar/` + grammar topic ↔ `/bibliothek` + `/begriffe`** | **1.** Bibliothek opens with search and a short “how to begin” sequence. **2.** Categories use meaningful exam names. **3.** Begriffe shows a concrete learning interaction—technical term versus patient language—with a bounded no-account trial. Evidence: `mm-steps/bibliothek_d_00.png`, `bibliothek_m_00.png`, `begriffe_d_00.png`, `begriffe_m_00.png`. | DeutschMeister exposes substantive grammar explanations publicly and offers practice and X-Ray shortcuts. Evidence: `dm_grammar-a1-1-definite-articles_d_fold.png`. Its eight poetic level cards consume mobile space without helping choose a topic: `dm_grammar_m_fold.png`. This is a functional comparison, not evidence that MedMeister’s unseen reading pages are better. |
| **`/leitfaden/telc-b1/` ↔ `/blog`** | **1.** Offers clear goal-based editorial entrances. **2.** Separates the introduction from useful category cards. **3.** Uses the same illustration and heading treatment as its other editorial pages. Evidence: `mm-steps/blog_d_00.png`, `blog_m_00.png`. | DeutschMeister’s page answers a specific search query with substantive exam guidance, a schedule, tables and source metadata. Evidence: `dm_leitfaden-telc-b1_d_full.png`. These are an article and an index, so this does not establish inferior article content. The duplicated exam-definition opening delays navigation on mobile: `dm_leitfaden-telc-b1_m_fold.png`. |
| **FAQ ↔ FAQ** | **1.** Provides a category index with answer counts. **2.** Frames the page around resolving a purchase decision. **3.** Surfaces a next action before the long answer list. Evidence: `mm-steps/faq_d_00.png`, `faq_m_00.png`. | DeutschMeister’s answer rows are visually restrained and easy to scan once reached. Evidence: `dm_faq_d_full.png`. Its floating “Watch Intro” button overlaps the next category heading on mobile: `dm_faq_m_fold.png`. |
| **About ↔ About** | **1.** Explains who is responsible in the opening section. **2.** Puts a compact product-scale panel beside that explanation. **3.** Connects the organisation to the training experience immediately. Evidence: `mm-steps/ueber-uns_d_00.png`, `ueber-uns_m_00.png`. | DeutschMeister contains a personal founder story and an explicit approach to factual claims. Evidence: `dm_ueber-uns_d_full.png`. However, “a team of doctors” conflicts with the brief’s solo-founder description, and the founder story is below a generic opening. MedMeister’s displayed counts are claims, not independently verified outcome proof. |
| **`/level-test/` ↔ `/simulation`** | **1.** Sells the practice experience through a concrete problem. **2.** Shows an example conversation interface on desktop. **3.** Offers an example conversation as a lower-commitment alternative. Evidence: `mm-steps/simulation_d_00.png`, `simulation_m_00.png`. | DeutschMeister now puts Start immediately below the heading, states the time commitment and requires no account. Evidence: `dm_level-test_d_full.png`, `dm_level-test_m_fold.png`. Its decorative fact cards and coloured step edges are less useful than a sample question or result. Placement and simulation also serve different jobs. |

## 3. Root causes in the code and system

### 3.1 Three design generations coexist without a settled contract

The governing instructions require hairlines, no resting shadows and the 140/220/420/800 ms motion tiers. The implementation still teaches agents competing rules:

- The token module retains raised “clay” shadows and an older motion system with 90/260/420 ms durations: [design-tokens.js:291](/home/user/deutschmeister/src/data/design-tokens.js:291).
- The newer motion tiers are additive, rather than replacing that system: [design-tokens.js:421](/home/user/deutschmeister/src/data/design-tokens.js:421).
- React’s standard button uses `transition-all duration-100` and raised variants: [Button.jsx:31](/home/user/deutschmeister/src/components/ui/Button.jsx:31).
- Cards explicitly support a raised, non-clickable state: [Card.jsx:34](/home/user/deutschmeister/src/components/ui/Card.jsx:34).
- Astro pages repeatedly define their own button/card strings: [grammar/index.astro:60](/home/user/deutschmeister/astro-site/src/pages/grammar/index.astro:60).

**Visible consequence:** commerce pills, raised grammar tiles, pastel editorial headers and coloured assessment edges appear to belong to related but different products.

**Fix:** consolidate the existing system. A new palette is unnecessary. Both token copies currently match; retain that protection.

### 3.2 Two heading systems are intentional, but page composition is not unified

October deliberately assigned Archivo to commerce and Fraunces to the library. That is defensible.

The problem is that hierarchy, widths and spacing are authored separately:

- Archivo roles define their own weight, width and leading: [linie.css:54](/home/user/deutschmeister/astro-site/src/styles/linie.css:54).
- Shared type and layout roles exist: [design-tokens.js:253](/home/user/deutschmeister/src/data/design-tokens.js:253).
- The homepage nevertheless specifies a separate 92px maximum heading with forced no-wrap lines: [index.astro:90](/home/user/deutschmeister/astro-site/src/pages/index.astro:90).
- The guide and exam templates independently specify different heading scales: [leitfaden template:158](/home/user/deutschmeister/astro-site/src/pages/leitfaden/[slug].astro:158), [exam template:93](/home/user/deutschmeister/astro-site/src/pages/pruefung/[slug].astro:93).

**Visible consequence:** moving from the broad commerce pages to a narrow exam article feels like changing websites.

**Fix:** keep both faces, but standardise hero composition, heading roles, gutters and section rhythm. Preserve selective font preloads; loading Archivo everywhere would discard an intentional performance optimisation in [Layout.astro:41](/home/user/deutschmeister/astro-site/src/layouts/Layout.astro:41).

### 3.3 Imagery is absent partly because the implementation disables it

This is a verified cause, not a taste judgment:

- Four station scenes are registered.
- `ART_COMPLETE` requires all eight.
- `artFor()` returns nothing everywhere until the complete set exists.

See [stationArt.js:20](/home/user/deutschmeister/astro-site/src/data/stationArt.js:20) and [StationArt.astro:19](/home/user/deutschmeister/astro-site/src/components/linie/StationArt.astro:19).

**Visible consequence:** courses have no scene imagery even though assets already exist.

However, finishing eight decorative illustrations is the wrong immediate response. The current strategy explicitly freezes new station-art and scroll-craft builds: [million plan:327](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:327).

**Fix:** use real product captures first. Removing the all-or-nothing artwork dependency can be considered later; it should not become a prerequisite for shipping sales improvements.

### 3.4 The homepage demonstrates the free exercise better than the paid purchase

The FirstStop and RecordedCorrection components are strengths. RecordedCorrection even fails the build if its recorded verdict disagrees with the checker: [RecordedCorrection.astro:6](/home/user/deutschmeister/astro-site/src/components/linie/RecordedCorrection.astro:6).

But the homepage places:

**exercise → large line animation → correction → chooser → purchasable levels.**

See [index.astro:120](/home/user/deutschmeister/astro-site/src/pages/index.astro:120).

On mobile, the line video has a portrait aspect ratio and occupies substantial vertical space: [LineBoard.astro:48](/home/user/deutschmeister/astro-site/src/components/linie/LineBoard.astro:48).

A1.2 then sells mainly through entitlement descriptions, counts and a large syllabus table: [course template:165](/home/user/deutschmeister/astro-site/src/pages/courses/[level].astro:165).

**Root problem:** the proof component is not matched to the offer being sold. A corrected greeting proves answer checking; it does not demonstrate a paid level’s guided journey or an exam programme’s writing feedback.

**Fix:** retain the greeting example, then add offer-specific evidence near each purchase decision.

### 3.5 Catalogue duplication and conflicting strategies create unnecessary decisions

The courses hub renders both `LineSection` and another eight-course catalogue: [courses/index.astro:70](/home/user/deutschmeister/astro-site/src/pages/courses/index.astro:70).

Pricing repeats the decision through opening cards, a level list, a ticket, an ownership comparison and a Pro allowance table: [pricing.astro:217](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:217).

More fundamentally:

- October’s strategy says level courses are the flagship.
- The newer approved strategy prioritises the exam-rehearsal pilot and identifies the course-line positioning as a commercial problem.

See [October strategy](/home/user/deutschmeister/docs/redesign-2026-10/strategy.md) and [current strategy](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md).

**Fix:** select one lead buying journey, then organise secondary entrances around it. Designers cannot resolve this by rearranging cards indefinitely.

### 3.6 Language boundaries are implemented as interruptions

English commerce and grammar coexist with German exam material. That can serve different learners, but the transitions are poorly handled:

- The language notice occupies a raised card and points exam readers away to general grammar: [LanguageNotice.astro:9](/home/user/deutschmeister/astro-site/src/components/LanguageNotice.astro:9).
- An English A1.2 sales page switches into a German syllabus explanation: [course template:187](/home/user/deutschmeister/astro-site/src/pages/courses/[level].astro:187).
- The exam template uses *du*, while the course voice is *Sie*: [exam template:115](/home/user/deutschmeister/astro-site/src/pages/pruefung/[slug].astro:115).
- The unsupported “most people fail because…” claim remains in the exam-hub data, even though the earlier review criticised that claim elsewhere: [exams/index.js:61](/home/user/deutschmeister/astro-site/src/data/exams/index.js:61).

**Fix:** define language and register by journey. Keep English support for beginners; give German exam visitors coherent German instructions through the account journey. Replace the large language card with a compact utility.

### 3.7 Long-page rendering is difficult to verify reliably

Two mechanisms explain the screenshot blanks:

- `.reveal` hides content until observed: [showtime.css:48](/home/user/deutschmeister/astro-site/src/styles/showtime.css:48).
- `.dm-defer` defers rendering and reserves an intrinsic height: [showtime.css:63](/home/user/deutschmeister/astro-site/src/styles/showtime.css:63).

There is already an observer and scroll-depth fallback: [Showtime.astro:28](/home/user/deutschmeister/astro-site/src/components/Showtime.astro:28). React has a similar mechanism: [motion.js:10](/home/user/deutschmeister/src/lib/motion.js:10).

**Therefore:** “the sections do not exist” would be false. A persistent live rendering failure is not established either.

**Fix:** essential sales and reference content should not depend on an entrance animation to become readable. Validate actual viewport scrolling, script failure and reduced motion; do not redesign phantom empty sections from a full-page capture.

### 3.8 Trust content has no sufficiently enforced source of truth

About hardcodes “Developed by doctors” and “a team of doctors”: [UeberUnsPage.jsx:14](/home/user/deutschmeister/src/pages/UeberUnsPage.jsx:14). The sanctioned shared wording says a single doctor founded the product: [marketing.js:221](/home/user/deutschmeister/src/data/marketing.js:221).

The legal data also retains intentional empty release-blocking fields: [legal.js:8](/home/user/deutschmeister/astro-site/src/data/legal.js:8). This establishes unresolved repository records, not the current legal status of the business.

**Fix:** use sanctioned founder wording consistently; let the owner reconcile identity and operator records. Add inspectable product evidence now. Publish testimonials only when real and permissioned.

Separately, the floating intro is globally mounted on eligible SPA pages and uses a fixed mobile position: [FloatingIntroButton.jsx:79](/home/user/deutschmeister/src/components/FloatingIntroButton.jsx:79). Its overlap in the supplied FAQ and About screenshots is a verified obstruction, not a hypothetical concern.

## 4. Redesign plan, in shipping order

### Commercial assumptions and authority

The redesign should retain DeutschMeister’s turquoise identity, approachable learner audience, free first course, public grammar and existing Astro/React architecture.

**Every proposed uplift below is a planning hypothesis, not a forecast.** To make the sizes understandable, use an illustrative baseline of **10 purchases per 1,000 qualified offer visits**. Actual denominators are unverified. Effects overlap and must not be added.

Report:

- Paid orders and revenue after VAT/refunds, separately for courses, exam products and Pro.
- Offer-to-checkout and checkout-to-payment rates where denominators reconcile.
- Raw order counts and measurement coverage when conversion cannot be calculated honestly.

The existing event registry distinguishes browser observations from real purchases: [events.js:21](/home/user/deutschmeister/src/data/events.js:21). Preserve consent gating. Fix the known ordering issue where an event is marked sent before consent is checked: [track.js:55](/home/user/deutschmeister/astro-site/src/lib/track.js:55).

**Authority:** agents can prepare and implement routine presentation changes. Brand messages, prices, legal facts, entitlement changes and authentication changes remain owner decisions under [CLAUDE.md](/home/user/deutschmeister/CLAUDE.md) and [Protocol v5](/home/user/deutschmeister/docs/agents/PROTOCOL.md:9). This report proposes no new prices or access model.

### Phase 1 — One-week release: make the money pages understandable

**Goal:** visitors can identify their route, inspect relevant evidence and reach the correct next action.

**Effort:** **24–32 agent-hours**, shippable within approximately one week. Split into small releases.

**Pages/files:** homepage and `homepage.js`; `pricing.astro`; both course templates; `pruefung/[slug].astro` and its data; `LanguageNotice.astro`; relevant `components/linie/*`; existing tracking.

**Changes:**

1. **Home:** shorten the explanation, retain the exercise and account entrance, and expose the course/exam route choice before the large line animation. Move the animation below the first useful offer choice. Until the founder settles the lead message, retain approved wording.
2. **Pricing:** show concise course and Pro summaries, then one comparison. Keep exact prices, recurrence, included Pro period and post-expiry access together. Make the course selector lead to actual choices promptly.
3. **Courses hub:** replace the two catalogues with one. Put available courses first and group unfinished courses separately. Say clearly that practice materials and complete guided courses have different availability.
4. **A1.2:** preserve its effective mobile purchase block. Add a small genuine lesson preview before the full syllabus; put the full table behind an explicit “View all lessons” disclosure.
5. **Exam page:** place one relevant practice action and an example near the introduction. Move the long exam definition into a reference section. Remove the unsupported failure claim. Keep the unavailable package honestly unavailable.
6. Make essential money-page content visible without reveal completion; compact the language notice. Verify the tracking sequence.

**Sales number:** course/exam offer → purchase rate, with offer → checkout as the leading indicator. **Hypothesis: 0–20% relative improvement**, equivalent to **0–2 additional purchases per 1,000 qualified offer visits** in the illustrative model. Exam-package revenue remains **zero while off sale**.

**Owner decision:** revised homepage brand message and any German register policy. Prices and release status remain governed by the existing records.

**Risks:** losing the restored signup entrance; confusing Pro materials with finished courses; accidentally offering unavailable products.

**Acceptance:**

- At **390 × 844**, pricing exposes a paid price, payment basis and next action in the opening viewport.
- Courses exposes a real course choice without two introductory sections.
- A1.2 retains its price and purchase action together.
- Exam visitors encounter a relevant task action before the long factual explanation.
- Five target learners can explain what is free, what can be bought and what remains afterwards.
- Viewport captures at 360, 390 and 1440px prove the hierarchy; links and consent-gated events work.

### Phase 2 — Consolidate the system while retaining the identity

**Goal:** subsequent page work uses one consistent set of presentation rules.

**Effort:** **16–22 agent-hours**.

**Files:** both design-token copies; Astro global/linie/showtime CSS; React `index.css` and `components/ui/*`; shared header/footer implementations and layout adapters.

**Changes:**

- Establish a single hierarchy of heading, lead, label, price and body roles.
- Retain Archivo for commerce and Fraunces for editorial/learning headings, with common spacing and layout rules.
- Flatten resting cards and buttons to the brief’s hairline system; retain clear focus, hover and pressed feedback.
- Replace legacy timings and `transition-all` in touched primitives with the prescribed motion tiers and allowed properties.
- Reduce public-page pastel auroras; use paper and turquoise grounds deliberately.
- Reuse the same role definitions through thin Astro and React adapters.
- Suppress the floating intro on public FAQ/About pages or place its link in the content flow.

**Sales number:** purchase completion among visitors crossing public pages and account screens. **Hypothesis: 0–5% relative improvement**, or **0–0.5 additional purchases per 1,000 qualified visits**. Its main value is preventing recurring inconsistency and rework.

**Owner decision:** only if the brand or font assignment changes. Consolidation within the existing identity is agent work.

**Risks:** broad CSS changes affecting the lesson player; fallback-font regressions; unintentionally changing Tailwind defaults.

**Acceptance:**

- Home → grammar → exam → FAQ → account screens retain consistent controls, gutters and focus treatment.
- No floating prompt covers text or controls at 390px or 200% zoom.
- Token twins remain identical.
- Existing brand, navigation, accessibility and reduced-motion checks pass.
- Shared primitives match the brief’s shadow and motion contract.

### Phase 3 — Build reusable proof of the paid experience

**Goal:** show why a buyer should pay beyond getting access to more material.

**Effort:** **24–32 agent-hours**.

**Pages/files:** homepage, A1.2 and exam offer pages; `RecordedCorrection.astro`; telc package page; relevant lesson/feedback surfaces used to capture examples; proposed reusable proof components and assets.

**Changes:**

Create three compact, accurate demonstrations:

1. **Level-course journey:** one situation, the learner’s task, feedback and the next learning step.
2. **Exam writing:** an authentic task, a demonstration draft, the actual feedback and a revision.
3. **Speaking:** a representative prompt and feedback excerpt, with its limits explained.

Use real interface captures or faithful presentations of existing functionality. Label demonstration content. Reuse the same evidence on the matching offer and account entry point.

Keep the current deterministic correction example. Do not rebrand it as AI assessment or a customer result.

**Sales number:** qualified offer → checkout and purchase conversion. **Hypothesis: 0–20% relative improvement**, or **0–2 additional purchases per 1,000 qualified offer visits**. Monitor refunds and AI delivery cost alongside revenue.

**Owner decision:** publication of personal/customer material, changes to product claims, and any product release. Demonstration preparation can proceed independently.

**Risks:** showcasing feedback that does not survive expert review; implying a capability that is not delivered; confusing illustrative interfaces with working controls.

**Acceptance:**

- Each demonstration can be traced to the actual task and output.
- An appropriate reviewer approves language/assessment accuracy.
- Buyers can explain the paid mechanism and its distinction from Pro.
- Desktop shows readable evidence near the decision; mobile exposes it immediately after the primary action.
- Static and reduced-motion versions remain useful.

**Do not commission another eight-scene illustration programme.** Product proof closes the larger gap and respects the current artwork freeze.

### Phase 4 — Rebuild editorial and trust templates

**Goal:** turn useful content into understandable routes to relevant practice and offers.

**Effort:** **20–28 agent-hours**.

**Pages/files:** grammar index/topic templates and `lib/grammar.js`; guide index/template; FAQ and About React pages; FAQ content; shared navigation; proposed editorial layout adapter.

**Changes:**

- **Grammar index:** add lightweight topic search/filtering and compact level navigation. Replace “Sunrise Warmth” and similar names with useful level descriptors.
- **Grammar topic:** retain its summary and practice shortcuts; reduce duplicated introductory text and ensure reference content remains visible.
- **Guides:** desktop contents rail, compact mobile contents disclosure, clear separation between exam facts and practising with DeutschMeister.
- **FAQ:** category jump navigation; payment/access questions easier to reach; contextual next steps.
- **About:** sanctioned founder explanation first, then product evidence and editorial responsibility. Remove contradictory team claims after owner reconciliation.
- Carry these templates into guide/exam indexes and existing comparison pages without launching a new content programme.

**Sales number:** purchases originating from grammar, guides, FAQ and About. **Hypothesis: 0–10% relative improvement within those entry cohorts**—**0–1 extra purchase per 1,000 such visits** at the illustrative baseline.

**Owner decision:** founder identity, legal/operator facts and changes to public promises. Navigation and template work are agent-owned.

**Risks:** damaging established URLs or useful search content; adding irrelevant offers to informational pages.

**Acceptance:**

- Representative articles retain their canonical URLs, headings, structured data and visible sources.
- Topic search finds known terms and offers a useful empty state.
- Mobile readers can reach contents and practice without traversing eight decorative level cards.
- FAQ payment information is reachable through its category index.
- About contains no contradictory singular/plural founder description.

### Phase 5 — Carry the design through trying, registering and returning

**Goal:** the public promise survives entry into the app.

**Effort:** **16–24 agent-hours**.

**Pages/files:** level-test landing/results; signup, login, verification, subscription and success pages; dashboard/chrome; existing return-path and purchase-intent helpers. Apply the shared shell to listening, reading, vocabulary, podcasts and video entry pages after inspecting them.

**Changes:**

- Preserve the level test’s improved Start placement. Add a sample question/result and replace “Precise placement” with appropriately qualified wording.
- Give the result one recommended available destination and an alternative.
- Carry journey language and purchase context through account creation and confirmation.
- Preserve the existing course purchase-resume mechanism.
- Extend exam return destinations only through a reviewed allow-list change.
- Match account and success screens to the selected offer, including what was purchased and the next task.
- Complete shared-shell adoption on remaining entry pages; do not redesign every exercise type.

**Sales number:** checkout intent → paid order; additionally, subsequent purchases from completed-test and free-course cohorts. **Hypothesis: 0–10% relative improvement**, or **0–1 additional purchase per 1,000 qualified visits**.

**Owner decision:** authentication/redirect changes and anything affecting access or payment. Presentation and approved translations can be prepared by agents.

**Risks:** lost purchase intent, unsafe redirects, incorrect expiry language, or sending experienced exam candidates into beginner onboarding.

**Acceptance:**

- Course purchase intent survives signup and same-browser email confirmation.
- German exam journeys retain understandable instructions.
- Available and unavailable course recommendations behave correctly.
- Success screens name the purchased product and lead to its first useful task.
- Payment, refund/replay and entitlement verification follow the existing owner-controlled release gate.

### How to stop this becoming another redesign project

**Ship Phase 1 first.** Do not wait for the shared-component consolidation.

After Phase 3, pause discretionary rollout and examine task observations, checkout progression and verified orders. Finish correctness/accessibility fixes regardless; advance optional polish when the commercial evidence supports it.

The August roadmap’s foundations already exist: central pricing, marketing inputs, tokens, shared-file checks and merged built-output verification. Rebuilding those would repeat completed work. Current CI already builds Astro and checks the merged output: [.github/workflows/ci.yml:74](/home/user/deutschmeister/.github/workflows/ci.yml:74).

Use that pipeline for future implementation, plus real viewport walkthroughs. A valid capture must record the actual scroller and position; successive scroll screenshots must visibly advance. Do not accept another folder of identical “steps.”

## 5. What not to copy from MedMeister

| Do not copy | Reason and evidence |
|---|---|
| **The medical prestige treatment** | Anatomical engravings, specialist case names and doctor-led authority fit clinicians. General learners need recognisable everyday tasks and understandable examples. Evidence: `mm-steps/kp-masterclass_d_00.png`, `begriffe_d_00.png`. |
| **Its palette and serif-led personality** | DeutschMeister already has a viable turquoise identity and distinctive Archivo commerce typography. The gap is consistency and demonstration, not a missing gold accent. Evidence: `dm_home_d_fold.png`, `dm_courses-a1-2_m_fold.png`. |
| **Gold and teal as competing action treatments** | MedMeister varies CTA colour across surfaces. DeutschMeister’s single `siegel` action colour is a stronger existing rule. Evidence: `mm-steps/fspm_d_00.png` versus `kp-masterclass_d_00.png`. |
| **A pricing hero without paid prices** | MedMeister’s visible pricing fold postpones the actual price comparison. DeutschMeister should improve its paid-choice visibility, not regress it. Evidence: `mm-steps/preise_m_00.png`. |
| **The promotional interruption** | The FSP guide becomes obscured by a mini-simulation modal. Use an in-flow practice invitation. Evidence: `mm-steps/fsp-pruefung_d_12.png`. |
| **The navigation density** | Desktop combines a hamburger with a long product navigation; mobile introduces several utility controls and, on some pages, a bottom app bar. DeutschMeister needs fewer initial decisions. Evidence: `mm-steps/home_d_00.png`, `bibliothek_m_00.png`. |
| **Its statistics as a substitute for learning proof** | Registered accounts and content totals establish scale, not successful learning. Neither their accuracy nor learning outcomes were independently verified here. Evidence: `mm-steps/ueber-uns_d_00.png`. |
| **A 20-minute assessment as the universal gateway** | Keep placement optional. Someone who knows their level or exam should reach relevant practice directly. Evidence: `dm_level-test_d_full.png`; the current course buying path already supports direct choice. |
| **More motion to imply more craft** | DeutschMeister already has video, scroll-driven trains, reveals and tilt. The current strategy freezes further scroll-craft. Better hierarchy and genuine product evidence should receive the effort. Evidence: [LineBoard.astro](/home/user/deutschmeister/astro-site/src/components/linie/LineBoard.astro), [strategy kill list](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:327). |

## 6. One decision for the founder

**Authorise one lead buying journey: exam rehearsal first, as the current approved strategy already intends, with beginner level courses as a clearly labelled secondary entrance.**

This resolves the contradiction between October’s course-first homepage brief and the newer commercial strategy. It determines the hero, first demonstration, navigation priority, language journey and primary sales metric.

It does **not** mean advertising an unavailable package as purchasable. Until its existing release gate clears, the exam entrance should lead to available practice and honest availability information.

Approve that hierarchy once, together with one short homepage message. Agents can then implement the design consistently without repeatedly returning for aesthetic decisions.

Codex session ID: 01a1bbdf-83f5-7c03-977b-4729d8bab0fb
Resume in Codex: codex resume 01a1bbdf-83f5-7c03-977b-4729d8bab0fb
