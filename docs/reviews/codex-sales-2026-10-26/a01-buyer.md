1. **Score: 2/5 — exam interest is visible; a paying segment is not proven.**

DeutschMeister attracts exam candidates but presents its main offer as a beginner’s journey through eight levels. Of 233 signups in 60 days, 95 selected an exam, 129 left it unset, and only nine selected “none.” Among identified exam choices, 74/95 concern B1/B2. Yet the homepage leads with free A1.1, while the specific telc programme remains unavailable. The root cause is **organising the sale around the content catalogue before establishing the buyer’s deadline, problem and willingness to pay**. Evidence: [FACTS.md:9]( /tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:9), FACTS.md:27–29.

**Clean sheet: hybrid [owner].** Keep the learning assets; build the commercial journey around one booked exam. Simply evolving the beginner funnel leaves the mismatch intact. Replacing the app with a tutor-supported exam service is a real alternative, but its delivery capacity and economics are unverified. The existing telc rehearsal programme makes the hybrid the cheaper first commercial test ([programme:50](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:50)).

Evidence below distinguishes **main code**, **live captures**, and **assumptions**. Audited routing files match local `main` (`4be1474`); the checkout branch additionally changes founder wording. Capture filenames refer to the supplied `capture/` directory. No files changed.

2. **Findings, most important first**

**A. You have exam preferences, not buyer segments.**

| Proposed segment | Actual evidence | Urgency and willingness to pay |
|---|---|---|
| Candidates in Germany for residence, citizenship or work | Goethe B1 45; telc B1 10; DTZ 8; telc B2 11. **Country and purpose unverified.** | High urgency **if** an exam is booked; only four profiles have any exam date. Segment spending unverified. |
| A1 candidates abroad for visas/family reunification | Eleven Goethe A1 choices. The live A1 guide explicitly discusses “Ehegattennachzug.” **Location and family motive unverified.** | Potentially urgent; household payer and budget unverified. |
| Nurses/doctors abroad | No occupation or country field in the profile schema. B1/B2 choices cannot identify healthcare workers. | Employment-linked urgency is a hypothesis; no segment payment evidence. |
| Hobby/general learners | Nine selected “none”; that means no exam, not necessarily hobby. The 129 unset profiles remain unknown. | Lower deadline pressure is an assumption; willingness to subscribe unverified. |

Sources: FACTS.md:9; [profile schema:36](/home/user/deutschmeister/tests/fixtures/db-schema.json:36); `site__leitfaden-start-deutsch-1.md:73`, “Der … häufigste Grund … ist der **Ehegattennachzug**.” The guide demonstrates intended positioning, not the actual motives of users.

Ten additional Goethe A2 selections also lack a verified purpose. Critically, `preferred_language` exists, but the supplied facts contain no distribution; repository search found administrative/support reads, not a learner preference-writing flow. Its population quality is unverified ([admin-user360.mjs:40](/home/user/deutschmeister/netlify/functions/admin-user360.mjs:40)).

**Why it costs sales:** a Goethe B1 candidate, a spouse beginning A1, and a nurse preparing for migration need different explanations and purchase decisions. Treating their exam labels as complete personas invites spending on the wrong offer or language.

Nor can you identify “who actually buys” from entitlement counts: the facts warn that two legacy purchase rows may be grants; five active subscription rows coexist with only one renewing payer in weekly metrics. No payment-to-segment join is supplied (FACTS.md:12–13).

**B. The homepage speaks most clearly to beginners, while identified interest concentrates above A2.**

The live hero says **“From Guten Tag to B2, one stop at a time.”** Its first action is “Start A1.1 free.” Neither the hero nor its lead identifies a booked exam, a weak skill, or a preparation deadline (`site__home.md:44–51`). That is coherent for someone starting German; it gives an experienced candidate little immediate reason to stay.

Pricing similarly asks **“Own a level, or rent the whole line”** and compares ownership against subscriptions. Its own explanation says three months of Pro cost €29.97, while level ownership starts at €40 (`site__pricing.md:44–70, 289`). For someone needing practice until an approaching exam, temporary access can be entirely rational. The pricing page supplies that comparison without establishing why the structured programme deserves an additional payment.

Pro genuinely includes exam practice; B1/B2 course tickets being unavailable does **not** mean all B1/B2 practice is unavailable (`site__pricing.md:277–307`).

**Why it costs sales:** the buyer must translate catalogue language into their own urgent task. The premium programme then competes against the app’s cheaper general access before its distinct value is clear.

**C. Exam pages exist, but the journey repeatedly returns to general learning.**

Main generates six exam hubs through [pruefung/[slug].astro:21](/home/user/deutschmeister/astro-site/src/pages/pruefung/[slug].astro:21). Their shared path begins with placement, then grammar; exam tasks appear later ([exam hub data:110](/home/user/deutschmeister/astro-site/src/data/exams/index.js:110)). The live telc hub confirms this ordering: “Schritt 1 · Einstufung,” followed by the approximately 20-minute test (`site__pruefung-telc-b1.md:59–75`).

There are meaningful differences:

- **Telc B1:** dedicated sales page and built rehearsal programme.
- **Goethe B1 and DTZ:** hubs and mocks, but no dedicated programme or exam writing bank in the registry ([examTracks.js:67](/home/user/deutschmeister/src/data/examTracks.js:67)).
- **A1 family candidates:** the German A1 hub links the €40 A1.2 course and included plan (`site__pruefung-start-deutsch-1.md:123–131`; [pricing.js:114](/home/user/deutschmeister/src/data/pricing.js:114)).
- **Healthcare candidates:** no dedicated occupational route in the examined Astro page tree; specialist suitability is unverified.
- **General learners:** homepage, courses and pricing explicitly serve their level progression.

Language compounds the problem selectively: the A1 visa-oriented explanation is German, while the homepage and signup are English. That may impede some beginners, but actual preferred languages remain unverified. The signup capture promises **“Start your 7-day Pro trial”**, followed by generic feature allowances, losing exam-specific context (`site__signup.md:32–41`).

**Why it costs sales:** discovering a relevant exam page does not consistently produce a relevant next action or purchase explanation.

**D. The current evaluation overstates what remains broken in `firstRun`.**

I disagree with the proposed blanket fix in [sales evaluation:106](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:106). **Main already honours `exam_track`:** an eligible first-time learner receives the exam’s writing task, or its mock when no writing bank exists ([firstRun.js:107](/home/user/deutschmeister/src/lib/firstRun.js:107)).

The remaining mismatch is narrower:

- Onboarding’s final choices remain beginner lesson, placement test, or dashboard ([IntroSlides.jsx:207](/home/user/deutschmeister/src/components/onboarding/IntroSlides.jsx:207)).
- Those exits deliberately disregard the chosen exam ([firstRun.js:176](/home/user/deutschmeister/src/lib/firstRun.js:176)).
- The exam card requires no prior lesson activity and available exam access; completing an exam task returns the learner to the course fallback.

Feedback also already selects a matching telc offer; off sale, it leads to the programme page ([examFeedbackOffer.js:16](/home/user/deutschmeister/src/lib/examFeedbackOffer.js:16)).

**Why it costs sales:** the exam choice does not consistently govern the experience. Rebuilding functionality already present wastes time; repairing the actual interruption is the better target.

**E. Sell first to booked telc B1 candidates in Germany—but call this a test, not established demand. [owner]**

My first segment is: **adults already near B1, with telc B1 booked four to eight weeks away, seeking structured independent rehearsal.** Purpose can be residence, citizenship or employment; verify it rather than assuming it.

Telc wins the first test because the programme already contains letter revision, speaking rehearsals and an unseen second mock. Goethe B1 has **4.5 times as many declared selections**, but lacks the equivalent programme and writing bank ([programme:50](/home/user/deutschmeister/src/data/programs/telcB1Komplett.js:50); [examTracks.js:67](/home/user/deutschmeister/src/data/examTracks.js:67)). This is an implementation-cost advantage, not evidence of stronger telc demand.

Willingness to pay remains unknown. A rival advertises **“19,99€”** and **“Lebenslanger Zugang – kein Abo”** (`comp__telc-trainer.md:139–145`); TestHelden lists **“Komplettpaket … 39 €”** (`comp__testhelden-telc-b1.md:360`). These are competing offers, not verified competitor sales. Urgency alone does not validate €199–249.

The immediate prize is bounded. At the planned €149 pilot price, ten sales produce **€1,490 gross**, approximately **€1,127 after assumed 19% VAT and 10% refunds**, before fees, acquisition and delivery. At the observed five telc selections/month, even an assumed 10% conversion produces only **€74.50 gross/month**. New qualified distribution is necessary (FACTS.md:9; [plan:186](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:186)).

An illustrative later case—2,500 qualified visits/month × 2% × €199—produces **€9,950 gross/month**, approximately €7,525 after those deductions. Every demand input is unverified.

I also disagree with automatically treating Goethe demand as “abroad” or making DTZ the next priority: neither geography nor payment evidence establishes that ordering ([evaluation:81](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:81)).

3. **Sub-scores**

| Question | Score | Evidence |
|---|---:|---|
| (a) Segment identification | **2/5** | 95 exam choices; 129 unset; occupation/geography absent from profiles (FACTS.md:9; schema:36). |
| (b) Urgency and willingness to pay | **1/5** | Four exam dates; no reconciled segment payment evidence (FACTS.md:9,12–13). |
| (c) Relevant page and offer | **2/5** | Six exam hubs, but Goethe B1/DTZ have no programme in `examTracks.js:67–87`. |
| (d) Hero/pricing message fit | **1/5** | “From Guten Tag to B2”; “Own a level” (`site__home.md:44`; `site__pricing.md:44`). |
| (e) First-segment choice and prize | **3/5** | Telc rehearsal assets exist; demand remains unproven (`telcB1Komplett.js:50`; FACTS.md:21). |

4. **Recommendations ranked by prospective revenue per hour**

These are **planning assumptions, not forecasts or additive gains**. Calculations use €112.69 retained revenue per €149 sale under the deductions above. All paid scenarios require the owner’s release gate; the live page and canonical price still show €89 ([pricing.js:81](/home/user/deutschmeister/src/data/pricing.js:81); [release gate:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128)).

| Rank | Change and exact location | Assumed effect / effort | Authority and measure |
|---|---|---|---|
| 1 | Use the existing partner kit to recruit booked telc candidates; qualify date, current level, weak skill and payer. `docs/partners/outreach-templates.de.md`, `partner-offer.de.md`, `links.md`. | Five sales / six hours ≈ **€94/hour**. | **[owner]** sends; agents prepare. Judge after ≥300 reconciled qualified views; fewer than three sales triggers one package revision ([plan:193](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:193)). |
| 2 | Rewrite the telc page around that buyer and the actual rehearsal mechanism; add a clearly labelled sample correction. `astro-site/src/pages/telc-b1-komplettvorbereitung.astro:132–175`; targeted links from homepage/pricing. | Three incremental sales / five hours ≈ **€68/hour**. | **[owner]** positioning/brand approval; agents draft. Measure retained revenue per qualified view and stated purchase reasons; no homepage test programme at current volume. |
| 3 | Add an explicitly labelled exam-task exit to onboarding using the existing resolver; offer the existing optional date field. `IntroSlides.jsx:207`, `firstRun.js:176`, `ProfilePage.jsx:373`. | Two incremental sales / four hours ≈ **€56/hour**. | **[agents]**, preserving access rules. Measure first exam-task completion within seven days; initial target ≥35% ([plan:180](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:180)). |
| 4 | Repair mobile hero clipping. `astro-site/src/pages/index.astro:85–112`. | Zero–one additional sale / two hours: **€0–56/hour**. | **[agents]**. Pass at 360/390px with consent banner visible and complete copy/buttons accessible. Defect confirmed in supplied `shots/home.png` and FACTS.md:30. |
| 5 | Reconcile actual payers with exam, language and acquisition cohorts using aggregate reads of `profiles`, `purchases`, `subscriptions` and payment records. | Three hours; **no immediate revenue assigned**. | **[agents]** analysis. Every charged order classified or explicitly unknown; no conversion verdict without a denominator. New tracking/consent changes remain **[owner]**. |

Prices must derive from `pricing.js`; claims and limits from `marketing.js`. Preserve first-touch attribution and consent gating. A tagged signup is neither marketing consent nor a qualified-view denominator ([attribution.js:33](/home/user/deutschmeister/src/lib/attribution.js:33); [consent.js:13](/home/user/deutschmeister/public/consent.js:13)).

5. **What remains unverified**

- **Who paid, and why:** reconcile processor charges/refunds with entitlement rows, then aggregate by exam and acquisition. Grants must remain separate.
- **Country, occupation, payer and urgency:** collect voluntary answers from pilot applicants; do not infer them from exam names.
- **Language preference quality:** inspect aggregate values and provenance before commissioning localisation. The attempted read-only Supabase query was blocked by session approval policy.
- **Live onboarding continuity:** inspect an authorised existing account’s path from exam selection through task, feedback and offer. Captures only verify signed-out gates.
- **Premium willingness to pay and market size:** obtain retained paid purchases. Current search visibility and signup counts cannot establish an addressable paying market (FACTS.md:8,31).

No customer messages, purchases, database changes, builds or file writes were performed.

