**1. Score: 3/5**

DeutschMeister has a sensible technical foundation for selling: static offer pages, explicit SPA routing, crawlable HTML, shared price data, and several outage safeguards. The weaknesses are mobile usability and operational verification. A clipped signup button is more commercially urgent than shaving another JavaScript chunk. Meanwhile, total page weight, real Core Web Vitals, and deployment parity remain **unverified**. The existing evaluation’s statement “Pages load fast” is unsupported by the supplied measurements ([evaluation:63](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:63)). Technology warrants targeted repairs; the evidence does not justify a framework rewrite or a broad performance project.

Evidence shorthand below: **F30** means line 30 of the supplied [FACTS.md](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md). Source was inspected at checkout `2d87566` against local `origin/main`, `4be1474`. The technical code cited matches that main reference; the telc page differs in founder copy. Neither establishes what is deployed.

**2. Findings, ranked by commercial importance**

**1 — Mobile visitors encounter a broken acquisition surface.**

**What:** F30 reports clipped hero copy and a clipped “Create a free account” button at 360px. That is a conversion defect.

**Evidence:** The hero combines an overflow-hidden container, hard nonwrapping headline lines, and a grid containing the interactive sample ([index.astro:85](/home/user/deutschmeister/astro-site/src/pages/index.astro:85)). The sample’s outer grid item lacks an explicit minimum-width reset ([FirstStop.astro:44](/home/user/deutschmeister/astro-site/src/components/linie/FirstStop.astro:44)). These are plausible contributors; the precise offending element remains **unverified without browser inspection**.

**Why it costs sales:** The visitor cannot reliably read the proposition or reach the account action. The root control failure is accepting source and HTML checks as evidence of usable mobile geometry. Fixing clipping qualifies for the approved plan’s correctness exemption ([plan:277](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:277)).

The cookie banner reportedly occupies roughly 20% of the screen, but that does **not** prove CLS. It is fixed-position; its height also repositions participating bottom controls through `--dm-consent-h` ([consent.js:61](/home/user/deutschmeister/public/consent.js:61)). Obstruction and layout instability need separate measurements.

**2 — Signup infrastructure has demonstrated failure; current reliability is unknown.**

**What:** F7 records 58 email-rate-limit error attempts over 60 days. These are attempts, not 58 lost people. F5 reports only 68% of accounts confirmed; that does not identify why the remainder failed to confirm.

**Evidence:** Signup depends directly on Supabase Auth ([AuthContext.jsx:142](/home/user/deutschmeister/src/contexts/AuthContext.jsx:142)). Failed submissions display the provider’s message and log the failure ([SignupPage.jsx:151](/home/user/deutschmeister/src/pages/SignupPage.jsx:151)). The submission has no application-level deadline around that awaited call.

**Why it costs sales:** An interested buyer who cannot create or confirm an account cannot complete the intended purchase path. This dependency deserves verification before performance tuning.

Do not blame these errors for the September signup collapse: F7 says they became rare after September 14. Current SMTP configuration, delivery latency, and abandonment are **unverified**. Auth configuration and changes remain **[owner]** decisions.

**3 — The outage fallback is coherent, but 63 days stale.**

**What:** The committed grammar snapshot says `dumpedAt: "2026-08-24"`—63 days before this evaluation ([cache:1](/home/user/deutschmeister/grammar-content-cache.json:1)). CI merely warns beyond 30 days ([ci.yml:61](/home/user/deutschmeister/.github/workflows/ci.yml:61)).

**Evidence:** Current code acquires one complete snapshot, retries failed acquisition three times, and falls back to the committed cache ([grammar.js:83](/home/user/deutschmeister/astro-site/src/lib/grammar.js:83), [grammar.js:149](/home/user/deutschmeister/astro-site/src/lib/grammar.js:149)). This fixes the October 22 mixed-live/cache finding. However, the query awaits have no application-level request deadline; retries require the request to fail first ([grammar.js:120](/home/user/deutschmeister/astro-site/src/lib/grammar.js:120)).

**Why it costs sales:** A fallback deployment can restore outdated teaching material and associated page counts. A stalled acquisition can delay deployment. Neither means an existing static homepage disappears during a Supabase outage: Astro builds static files ([astro.config.mjs:9](/home/user/deutschmeister/astro-site/astro.config.mjs:9)).

Runtime protection is narrower. Course completion has a local outbox ([syncOutbox.js:52](/home/user/deutschmeister/src/lib/course/syncOutbox.js:52)); that does not provide offline authentication or AI services. The root gap is fallback freshness and scope, rather than absence of caching.

**4 — Performance controls are reasonable; delivered budgets are missing.**

Read-only asset measurements establish the following:

| Asset commitment | Measured size | Source selecting it |
|---|---:|---|
| Homepage preloaded Archivo + Nunito | 85.2 KiB | [index.astro:77](/home/user/deutschmeister/astro-site/src/pages/index.astro:77) |
| Default Fraunces + Nunito preloads | 96.0 KiB | [design-tokens.js:245](/home/user/deutschmeister/src/data/design-tokens.js:245) |
| Desktop/mobile video posters | 19.7 / 26.3 KiB | [LineBoard.astro:33](/home/user/deutschmeister/astro-site/src/components/linie/LineBoard.astro:33) |
| Desktop/mobile MP4 files | 141.1 / 181.3 KiB | Same component |

These are file sizes, **not total page transfer sizes**. The video attaches its source near the viewport and selects the visible breakpoint; reduced motion prevents playback loading ([LineBoard.astro:73](/home/user/deutschmeister/astro-site/src/components/linie/LineBoard.astro:73)). On mobile, it follows the hero/sample content, so calling it the measured LCP element would be speculation.

Fonts use swap and metric-adjusted fallbacks ([design-tokens.js:181](/home/user/deutschmeister/src/data/design-tokens.js:181)). Vite separates vendors without forcing the entire icon library into one chunk ([vite.config.js:12](/home/user/deutschmeister/vite.config.js:12)). GA loads after acceptance; PostHog is dynamically imported after consent ([consent.js:42](/home/user/deutschmeister/public/consent.js:42), [analytics.js:34](/home/user/deutschmeister/src/lib/analytics.js:34)).

The image pipeline creates quality-80 WebP copies, but does not resize images or make consumers use them ([optimize-images.cjs:35](/home/user/deutschmeister/scripts/optimize-images.cjs:35)). Neither build directory exists, and CI has no transfer-budget step. Current compressed JS/CSS totals and third-party transfer costs are **unverified**. The commercial risk is an undetected regression, not proven excessive weight today.

**5 — The Astro/SPA boundary is mostly correct, but still requires browser verification.**

The source separates destinations appropriately:

| Destination | Delivery |
|---|---|
| `/`, `/pricing/`, `/courses/*/`, telc offer, exam and guide pages | Static Astro |
| `/signup`, `/login`, `/subscription`, `/course/*` | Client-rendered SPA |
| Speaking, level test, X-Ray, podcasts, listening, reading, FAQ, about | Eight prerendered SPA entry pages |

The split is documented in the build/routing rules ([netlify.toml:261](/home/user/deutschmeister/netlify.toml:261)); the eight prerendered routes are enumerated in [check-built-html.mjs:46](/home/user/deutschmeister/scripts/check-built-html.mjs:46).

Crucially, prerendered SPA content is **replaced**, rather than hydrated: React uses `createRoot` ([main.jsx:30](/home/user/deutschmeister/src/main.jsx:30)). Page-chunk preloads mitigate the resulting loading gap ([prerender:64](/home/user/deutschmeister/scripts/prerender-spa-routes.mjs:64)). Boot-time content replacement and main-thread work remain LCP/CLS/INP risks, not measured failures.

The October 22 logout 404 is fixed in current main: logout calls `window.location.assign('/')` ([Navbar.jsx:72](/home/user/deutschmeister/src/components/Navbar.jsx:72)). “All courses” now uses an ordinary anchor ([CourseHomePage.jsx:153](/home/user/deutschmeister/src/pages/CourseHomePage.jsx:153)). Recommending those fixes again would waste work.

**6 — Crawlability is stronger than the sales evaluation implies. Legal destinations remain the material trust gap.**

The live capture includes the telc money URL in the static sitemap: `<loc>https://deutsch-meister.de/telc-b1-komplettvorbereitung/</loc>` (`site__sitemap.md:105`). The robots capture says `Allow: /` and declares the sitemap (`site__robots-txt.md`). Source generates static canonicals and JSON-LD ([Layout.astro:108](/home/user/deutschmeister/astro-site/src/layouts/Layout.astro:108)).

Pro has Product/Offer pricing schema ([pricing.astro:89](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:89)); level pages have Course/Offer schema ([course page:83](/home/user/deutschmeister/astro-site/src/pages/courses/[level].astro:83)); telc correctly suppresses its Product/Offer while off sale ([telc page:106](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:106)). Missing structured data is not the central defect.

F26 reports `/de/`, `/agb/`, and `/widerruf/` returning 404 and an unapproved Impressum. Current legal navigation advertises only privacy and Impressum ([navigation.js:172](/home/user/deutschmeister/src/data/navigation.js:172)). Therefore those 404s do not, by themselves, establish broken internal links or sitemap pollution. Their referrers need checking.

Unknown routes correctly return HTTP 404 ([netlify.toml:504](/home/user/deutschmeister/netlify.toml:504)). Host canonicalisation exists, but actual host/slash redirect chains are **unverified**. Publishing approved legal destinations remains part of the owner’s existing release gate—not an SEO workaround.

**3. Sub-scores**

| Sub-question | Score | Evidence |
|---|---:|---|
| (a) Weight and budgets | **3/5** | Selective fonts/media; compiled totals and enforced byte budgets unavailable—finding 4. |
| (b) Core Web Vitals risks | **2/5** | Mobile clipping reported in F30; no measured LCP, CLS, or INP. |
| (c) Astro/SPA split | **4/5** | Explicit routing; logout and catalogue navigation corrected—finding 5. |
| (d) Crawlability | **4/5** | Live sitemap plus canonical, Product/Offer/Course/FAQ generation—finding 6. |
| (e) Errors and 404s | **2/5** | F7 signup errors; F26 missing destinations and draft legal identity. |
| (f) Uptime/fallback | **3/5** | Coherent fallback and local outbox; stale snapshot and unbounded acquisition—finding 3. |

**4. Recommendations ranked by expected revenue per hour**

These are **planning assumptions, not forecasts**. For comparability, assume 300 qualified offer visits/month after approval, €149 gross, 19% VAT, and 10% refunds: approximately **€113 retained revenue per sale**, following the approved model ([plan:66](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:66)). Assume 50% probability that each hypothesised recovery occurs. Effects overlap and must not be added. While the pilot remains closed, incremental pilot revenue is €0.

1. **Repair mobile geometry — [agents].**  
   **Location:** `index.astro:85`, `FirstStop.astro:44`, `linie.css:88`. **Effort:** 2 hours initially. Hypothesis: recover 0.5 percentage points of purchase conversion; probability-weighted value **≈€85/month, €42/hour**. Fix the measured overflowing element, retain consent behaviour, and verify 360/390px with fonts loaded and the banner visible. **Measure/kill:** zero clipped primary actions; stop after four hours if the cause remains unreproduced.

2. **Verify signup delivery capacity — [owner].**  
   **Location:** Supabase Auth configuration; `AuthContext.jsx:142`, `SignupPage.jsx:151`. **Effort:** 1 hour diagnosis; remedial work separately scoped. Hypothesis: recover 20 confirmed accounts/month at 2% eventual purchase, giving **≈€23/month expected, €23/hour**. **Measure/kill:** reconcile distinct failed addresses and confirmation delivery; stop configuration work if current failures are absent. Preserve verification and abuse controls.

3. **Add browser checks across selling journeys — [agents].**  
   **Location:** `.github/workflows/ci.yml`, existing navigation tests, merged deployment preview. **Effort:** 2 hours. Cover offer → signup, login return, logout → Astro, catalogue navigation, and prerendered content replacement. Hypothesis: prevent 0.2 percentage points of conversion loss: **≈€34/month expected, €17/hour**. **Measure/kill:** every destination loads correctly without refresh; fix demonstrated failures only.

4. **Refresh and bound fallback acquisition — [agents].**  
   **Location:** `grammar-content-cache.json:1`, `grammar.js:83`, CI freshness check. **Effort:** 2 hours. Refresh from verified content; add an acquisition deadline and visible stale/fallback reporting. Hypothesis: prevent 0.1 percentage points of loss: **≈€17/month expected, €8/hour**. **Measure/kill:** failed acquisition selects one complete snapshot within the deadline. Retain the last working deployment when neither source is usable.

5. **Measure delivered budgets before optimising — [agents].**  
   **Location:** existing build CI and `scripts/lighthouse-audit.js`. **Effort:** 4 hours maximum. Record compressed HTML/JS/CSS, fonts, media, and post-consent requests on the actual money journey. Hypothesis: recover 0.1 percentage points: **≈€17/month expected, €4/hour**. **Measure/kill:** flag >10% unexplained transfer regressions; stop optimisation if no material loading or interaction problem appears. Any new analytics collection or consent change is **[owner]**.

**5. What could not be verified**

The capture directory contains five text files and **no INDEX.md or PNG screenshots**. Consequently, F30 could not be visually rechecked. Neither build directory exists. I ran no build or Lighthouse command because both write files; eight selected read-only test files exited successfully.

Still unverified: field Core Web Vitals, exact mobile overflow cause, live redirect chains, deployed commit, checkout environment IDs, current email delivery, fallback use in production, and uptime history. Verify through deployment artifacts, browser recordings/network traces, existing operational logs, and owner-authorised auth checks. Any commercial kill rule must wait for the approved reconciled server-side denominator ([protocol:28](/home/user/deutschmeister/docs/agents/PROTOCOL.md:28)).

