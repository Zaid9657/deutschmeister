**1. Score: 3/5 — distinctive enough to sell, insufficiently dependable on mobile**

DeutschMeister has a recognisable identity: turquoise actions, pale backgrounds, strong typography and a consistent seal. The inspected mobile pricing screen looks considered. The mobile homepage looks broken: sentences and the signup button disappear beyond the right edge. Pricing also places substantial introductory material before the paid choices, while the telc page provides no visible example of the feedback being sold. These are stronger commercial concerns than aesthetic refinement. Evidence: supplied `shots/home.png` and `shots/pricing.png`, corroborated by `FACTS.md:28–30`; [homepage implementation](/home/user/deutschmeister/astro-site/src/pages/index.astro:85). **Sales effects below are hypotheses; lost revenue attributable to design is unverified.**

**Clean sheet: hybrid.** Starting from zero, I would give exam candidates a focused offer page showing one task, its feedback, the purchase terms and one next step. Evolving the existing presentation costs less but preserves its emphasis on the course ladder. Replacing the whole design would introduce substantial work without evidence of incremental sales. Retaining the brand and adding inspectable exam proof is the strongest direction. My planning estimates are 4–8 hours for limited evolution, 24–40 for replacement, and 8–14 for the focused hybrid; these are estimates, not measured implementation times.

**2. Findings, most important first**

**A. Mobile clipping is a functional defect. Its likely root is grid sizing concealed by overflow.**

The supplied 360px homepage PNG visibly cuts off the lead paragraph, “Create a free account” and part of “Find your stop.” Pricing fits the same viewport. This establishes a page-specific failure, independently recorded in `FACTS.md:30`.

The homepage uses a grid with explicit columns only at `lg`; the text child has `min-w-0`, but its `FirstStop` sibling does not. That sibling contains a flex form and a non-shrinking button. Both the hero and outer wrapper conceal horizontal overflow. Evidence: [index.astro:82](/home/user/deutschmeister/astro-site/src/pages/index.astro:82), [FirstStop.astro:44](/home/user/deutschmeister/astro-site/src/components/linie/FirstStop.astro:44), [FirstStop.astro:85](/home/user/deutschmeister/astro-site/src/components/linie/FirstStop.astro:85).

**Source-supported diagnosis:** the implicit mobile grid track can grow to a child’s intrinsic minimum width; clipping then hides the excess. The precise descendant determining that minimum remains **unverified without computed browser measurements**. The screenshot does not justify blaming headline size alone: the headline fits while ordinary paragraphs overflow.

Commercial implication: the interface demonstrates unreliable behaviour before asking for trust with payment. Restoring the content and button is exempt from the polish freeze, which explicitly exempts correctness defects. [Million plan:277](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:277)

**B. The hierarchy rewards exploration before purchase.**

On mobile pricing, the first screen contains the heading, a lengthy explanation and the beginning of the free card. Neither paid price is visible in the supplied PNG. Code confirms the sequence: Free, one-time level, then Pro. The paid level receives the strongest border and filled action, so desktop hierarchy is sensibly encoded, although its live desktop appearance is unverified. [pricing.astro:208](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:208), [pricing.astro:217](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:217)

The actual price typography is adequate: 2rem prices with explicit “once” or “a month.” Capture `site__pricing.md` contains “from€40.00once” and “€9.99a month.” The problem is **how long a mobile visitor must scroll before comparing them**, rather than illegible numerals.

Home presents three adjacent actions: free course, account creation and level selection. The filled free-course button wins; the others use matching outlines. [index.astro:101](/home/user/deutschmeister/astro-site/src/pages/index.astro:101) For an exam buyer, the initial visual instruction is therefore beginner practice. That is a commercial hierarchy decision, not a colour problem.

I disagree with treating the “€29.97 versus €40” comparison as inherently self-defeating: the same paragraph explicitly explains continued ownership. Whether buyers understand that distinction is unverified. [pricing.astro:314](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:314)

**C. Product proof deserves more space than decorative authority.**

The homepage already has something valuable: three real exercises using the course checker. Capture `site__home.md` says “Try the first stop”; code imports actual lesson items and the checker. [FirstStop.astro:17](/home/user/deutschmeister/astro-site/src/components/linie/FirstStop.astro:17), [FirstStop.astro:147](/home/user/deutschmeister/astro-site/src/components/linie/FirstStop.astro:147)

The telc page instead allocates space to numbered weeks, founder prose and an animated price card. Its full template contains no product screenshot or worked feedback example. [telc page:168](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:168), [telc page:199](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:199) Capture `site__telc-b1-komplettvorbereitung.md` quotes “89,00 €” and “Der Kurs startet in Kürze.”

The seal is a branded SVG “M”; it supplies recognition, not independent accreditation. [Logo.jsx:44](/home/user/deutschmeister/src/components/Logo.jsx:44) Its contribution should not be confused with evidence of teaching quality.

There are no photographic people assets in the A1.1 art manifest: character and scene image sources are null, with illustrated fallbacks. [a11.art.js:40](/home/user/deutschmeister/src/data/curricula/a11.art.js:40) **I would not commission stock people photographs.** A readable, honestly labelled example of an exam letter, corrections and revision answers the buyer’s question more directly. This is a commercial hypothesis, supported by the existing absence of such proof.

**D. Accessibility has useful foundations and uncovered gaps.**

Calculated from the canonical tokens, white on `siegel` is **4.70:1**, body text on `nacht` **12.65:1**, and muted text **6.68:1**. Palette tests cover these intended combinations. [design-tokens.js:71](/home/user/deutschmeister/src/data/design-tokens.js:71), [design-tokens.js:405](/home/user/deutschmeister/src/data/design-tokens.js:405), [linie-design.test.mjs:51](/home/user/deutschmeister/tests/linie-design.test.mjs:51)

However:

- Signup fields use white backgrounds and `rule` borders on a white card. The calculated boundary contrast is only **1.25:1**. This is a code-level visibility concern; live usability impact is unverified. [SignupPage.jsx:52](/home/user/deutschmeister/src/pages/SignupPage.jsx:52), [Card.jsx:15](/home/user/deutschmeister/src/components/ui/Card.jsx:15)
- Global reduced-motion CSS shortens CSS animations, but signup separately animates `y:20` through Framer Motion without a local preference check. No global `MotionConfig` appears in the inspected entry points. [SignupPage.jsx:227](/home/user/deutschmeister/src/pages/SignupPage.jsx:227), [main.jsx:30](/home/user/deutschmeister/src/main.jsx:30)
- The first pricing comparison is a labelled, keyboard-focusable scrolling region; the later 48rem Pro table lacks that explicit treatment. Browser-specific keyboard reachability is unverified. [pricing.astro:294](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:294), [pricing.astro:338](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:338)

Positive evidence includes global focus rings, 44px SPA buttons and password controls, explicit form labels, and accessible illustration names. [global.css:37](/home/user/deutschmeister/astro-site/src/styles/global.css:37), [Button.jsx:31](/home/user/deutschmeister/src/components/ui/Button.jsx:31), [SignupPage.jsx:394](/home/user/deutschmeister/src/pages/SignupPage.jsx:394), [SituationScene.jsx:202](/home/user/deutschmeister/src/components/illustrations/SituationScene.jsx:202)

The cookie banner occupies roughly 18% of the supplied 800px image. Its height variable already exists to help fixed controls avoid overlap. This calls for reachability checks, not removal of consent choices. [consent.js:61](/home/user/deutschmeister/public/consent.js:61)

**E. Brand consistency is stronger than brand governance.**

Archivo serves home/pricing signage; Fraunces serves telc, signup and course headings; Nunito Sans supplies body text. Much of this division is intentional, and the shared token files passed byte-identity verification. [design-tokens.js:439](/home/user/deutschmeister/src/data/design-tokens.js:439), [SignupPage.jsx:249](/home/user/deutschmeister/src/pages/SignupPage.jsx:249), [CurriculumHomePage.jsx:233](/home/user/deutschmeister/src/pages/CurriculumHomePage.jsx:233)

The cookie banner still uses a separate navy/system-font treatment and older teal. It visibly interrupts the identity, but repainting it is low-value polish. [consent.js:81](/home/user/deutschmeister/public/consent.js:81)

More consequentially, the current evaluation calls “team of doctors” a completed truth fix. The repository records owner approval for that wording, while this assignment describes a solo physician. I cannot establish the underlying fact. Consistency does not verify provenance. [marketing.js:222](/home/user/deutschmeister/src/data/marketing.js:222), [current evaluation:100](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:100) A founder portrait or identity change also requires revisiting the recorded anonymity decision.

**3. Sub-scores**

| Question | Score | Evidence |
|---|---:|---|
| **(a) First impression** | **2/5, provisional** | Inspected mobile home is clipped; pricing fits. Desktop, telc, signup and course PNGs were unavailable. |
| **(b) Brand system** | **4/5** | Shared tokens match; intentional type roles are documented at `design-tokens.js:439`; consent banner diverges at `consent.js:81`. |
| **(c) Offers and CTAs** | **3/5** | Strong paid-card emphasis, but free comes first on mobile: `pricing.astro:217`. |
| **(d) Credibility cues** | **2/5** | Real beginner demo exists; telc template substitutes weeks and price for inspectable feedback: `FirstStop.astro:17`, telc page:168. |
| **(e) Accessibility** | **3/5, provisional** | Good palette/focus foundations; faint field boundaries and unguarded signup movement remain. |
| **(f) Mobile clipping** | **1/5** | Observed failure; implicit grid and overflow concealment at `index.astro:82–86`. |

**4. Recommendations ranked by estimated revenue per hour**

**Sizing assumptions:** 1,000 relevant page views monthly, **unverified**. Each 0.1-percentage-point purchase improvement means one additional sale: €40 for the entry ticket or €149 for the approved future pilot. Figures are gross, before VAT, fees and refunds; effects overlap. Pilot revenue remains zero until the release gate passes. Price sources: [pricing.js:81](/home/user/deutschmeister/src/data/pricing.js:81), [million plan:136](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:136).

| Rank | Change and exact location | Assumed effect; effort; authority | Kill / measure rule |
|---|---|---|---|
| **1** | Explicit shrinkable mobile grid at `index.astro:86`; `min-w-0` on `FirstStop.astro:45`; verify wrapping controls. **Defect.** | Assumed recovery 0–0.4pp: **€0–160/month**; **2–3h**, up to €80/month per hour. **[agents]** | At 320/360/390px, all copy and controls fit. Measure element rectangles, including after demo completion; document width alone can conceal clipping. |
| **2** | Add one labelled letter → feedback → revision example beside the telc offer, before `telc…astro:199`. **Sales-proof exception.** | Assumed 0–0.2pp: **€0–298/month after opening**; **6–8h**, up to €50/month per hour. **[owner]** approves claims; agents prepare. | Cap at one example. Five target learners must explain what they receive. No further illustration work before the pilot’s ≥300 qualified-view assessment. |
| **3** | Shorten pricing’s introductory block at `pricing.astro:208` and expose a compact three-option comparison earlier. **Polish, conditional.** | Assumed 0–0.1pp ticket lift: **€0–40/month**; **2–3h**, up to €20/month per hour. **[agents]** | Only proceed after defects and pilot proof. Stop after one layout pass; verify buyers identify price, recurrence and ownership. No sequential homepage experiment. |
| **4** | Improve signup field boundaries at `SignupPage.jsx:52`, guard Framer movement at :227, and audit the Pro table at `pricing.astro:338`. **Defects.** | Assumed 0–0.05pp: **€0–20/month**; **3–4h**, up to €7/month per hour. **[agents]** | Keyboard, zoom, reduced-motion and touch walkthrough must complete signup/pricing without inaccessible controls. Retain correctness fixes regardless of noisy sales results. |
| **5** | Resolve founder provenance in `marketing.js:222` and the telc founder block. **Claim accuracy.** | Revenue **unpriced**; **0.5–1h owner review**. **[owner]** | Publish only substantiated, approved wording; anonymity and identity changes remain owner decisions. |

The polish freeze is commercially justified. New station art, a new palette and additional scroll effects have no evidenced sales return here. [Million plan:279](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:279)

**5. What I could not verify**

At the final directory check, `capture/INDEX.md` was absent and `capture/shots/` empty. I opened both supplied mobile PNGs. Desktop impressions and live telc/signup/course appearance therefore remain **unverified**.

Verify those routes at 360, 390 and 1440px, with consent visible, keyboard navigation, zoom, loaded/fallback fonts and reduced motion. Inspect computed grid tracks to confirm which descendant causes homepage expansion.

The focused brand, Linie, Astro-hex and consent suites passed; shared-file comparison passed. These establish source safeguards, not rendered accessibility. `check-built-html.mjs` checks one H1, but cannot establish focus order, clipping or meaningful alt text. [check-built-html.mjs:274](/home/user/deutschmeister/scripts/check-built-html.mjs:274)

No files were changed. Live browser interaction was unavailable because the tool required approval and this session’s approval policy forbids it.

