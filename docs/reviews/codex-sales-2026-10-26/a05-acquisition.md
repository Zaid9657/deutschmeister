Read-only assessment; no files changed. **F#** means line # in the supplied [FACTS.md](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md). Capture quotations identify their source filename. Revenue estimates below are assumptions, not observed results.

**1. Score: 2/5**

DeutschMeister has a reasonably sound publishing system, but no demonstrated, repeatable supply of qualified exam buyers. Google produced 44 signups in 30 days, while the site was absent from all eight captured top-10 search result sets. The September decline is real; its causal breakdown remains unverified because traffic and signup-submission denominators are missing. Blaming the October redesign for a September decline would be wrong. The commercial problem is a combination of weak distribution and journeys that divert exam candidates toward general learning or registration rather than a purchasable exam offer. [F8; `search__*.md`; F29]

**Clean sheet: hybrid.** Retain the working content infrastructure, but acquire buyers through teacher-distributed exam demonstrations and specific exam pages. Incrementally improving the general homepage preserves its intent mismatch; replacing the whole public site has no demonstrated acquisition advantage. The hybrid tests a different distribution model with less rebuilding.

**2. Findings, most important first**

**The signup decline has multiple phases; no single cause is proved.**

The ten weeks through September 7 averaged **41.2 signups/week**. The latest four complete weeks averaged **14.75**, down **64%**. September 14 fell to 22, September 21 recovered to 31, then the lower level established itself. This is more complicated than one permanent break on September 14. [F6]

I ran the requested `git log --since=2026-09-01 --until=2026-10-05 --stat`. The local checkout is shallow, beginning October 2, so I recovered September commits and diffs through read-only GitHub calls. These establish **code history**, not production publication times.

Ranked causal hypotheses:

1. **September 14 reduced willingness to submit the signup form.** The navigation changed “Get started” into “Start 7-day trial”; signup changed “Start for free” into “Start your 7-day Pro trial,” and added an escape into anonymous A1.1 learning. Those changes match the initial decline’s date and could make a permanent free account feel temporary. The copy also explicitly explained that no payment details were requested, so the effect cannot simply be assumed negative. **Confirm:** align successful deploy times with `/signup` landings, submissions and successful account creation, split by entry page/device. Stable landings with falling submissions would support this hypothesis. [Historical main: `169159b`, `astro-site/src/layouts/Layout.astro:186`, `src/pages/SignupPage.jsx:108`; [commit](https://github.com/Zaid9657/deutschmeister/commit/169159b8c60f66c21564b9ae04de42512b91f3db)]

2. **Traffic or traffic quality declined, potentially compounded by the English-first change.** On September 14, grammar hubs changed German titles, descriptions and content into English at their existing URLs. Established German exam pages retained German. Search relevance or visitor composition could therefore have changed, but there is no daily search series here proving it. **Confirm:** GSC query/page/device/country comparisons around September 14, separating brand, grammar and exam queries; compare affected grammar hubs against unchanged exam pages. [Historical main: `4f69d8d`, `astro-site/src/pages/grammar/index.astro:68`; [commit](https://github.com/Zaid9657/deutschmeister/commit/4f69d8de798102333e14ce0fbf663bde33a91538)]

3. **A real backend interruption contributed to the initial week.** The repo records a paused Supabase project on September 14 and two failed builds. That is stronger evidence than speculation about seasonality, but outage duration and affected signup attempts are unverified. A short interruption alone would not explain six subsequent weeks. **Confirm:** provider incident history, authentication availability and successful signup timestamps around restoration. [claude-reference.md:222](/home/user/deutschmeister/docs/agents/claude-reference.md:222)

4. **October’s redesign caused additional conversion loss.** PRs **181 and 184 merged October 4**, three weeks after the first decline. PR181 replaced the prominent mobile registration action with anonymous A1.1 entry; PR184 mostly changed presentation. The account hero door returned October 11. The repair records homepage-associated signups falling 22→1 across unequal observation windows—useful evidence, but not a controlled conversion comparison. **Confirm:** deployment-aligned homepage visitor→signup rates across October 4 and 11. The current mobile screenshot still clips the restored account button. [index.astro:104](/home/user/deutschmeister/astro-site/src/pages/index.astro:104); F30; commits `ea94e43`, `b93fad0`, `62af951`

**The disappearing rate-limit errors do not establish an email fix—or an email-caused decline.** Recorded failures affected 4–8 distinct emails/week, not 25 distinct buyers whenever 25 errors appeared. Errors practically disappeared as accounts declined. That is consistent with fewer submissions, but also with changed SMTP settings or broken error logging. The logger writes only failures and depends on Supabase itself. [F7; SignupPage.jsx:56](/home/user/deutschmeister/src/pages/SignupPage.jsx:56)

Likewise, September 20’s attribution cutoff cannot explain an actual September 14 decline in `profiles.created_at`. Consent changes can alter analytics coverage; they cannot by themselves erase account rows. [F6; F8; acquisition migration:8](/home/user/deutschmeister/migrations/2026-09-20-acquisition-attribution.sql:8)

**Technical SEO is substantially healthier than commercial search performance.**

The live sitemap contains **143 unique page URLs** across two child sitemaps. Current robots allow public crawling; sensitive routes and the raw app shell are excluded. Astro supplies static pages; public SPA feature routes receive prerendered content and heads. The September 14 Netlify diff replaced manual copying with a directory-discovering merge script; its CSP resource allowlist remained Report-Only. I found no broad September 14 robots, sitemap or canonical shutdown in the recovered changes. [`site__sitemap.md`: “## /sitemap-spa.xml (status 200)”; robots.txt:17](/home/user/deutschmeister/public/robots.txt:17); [prerender script:2](/home/user/deutschmeister/scripts/prerender-spa-routes.mjs:2); historical `34ee001f6`, `36c4d5c53`

Sample captured grammar and guide HTML has appropriate titles, language and self-canonicals. **Missing hreflang is correct where equivalent translated URLs do not exist.** `/de/` being absent is a commercial language decision, not evidence of a hreflang fault. Gated application routes being noindex is also intentional. [SEO.jsx:45](/home/user/deutschmeister/src/components/SEO.jsx:45); F26; `site__course-a1-1.md`: “robots noindex”

**The site is invisible in the captured buyer searches, and existing content often sends buyers sideways.**

The completed pack contains **eight searches**, extending FACTS’ original five. DeutschMeister appears in none of their top ten results. This establishes absence in those snapshots—not universal invisibility or deindexing. The dated September 22 baseline also found no top-30 presence across 20 targets and reported very weak substantive backlinks. [`search__*.md`; baseline:3](/home/user/deutschmeister/docs/seo-routines/baseline-2026-09-22.md:3)

Competitors present concrete purchases: TestHelden’s “Komplettpaket, 39 €” and telc-trainer’s “19,99€.” DeutschMeister’s telc destination says “Der Kurs startet in Kürze.” Acquisition cannot produce exam-package revenue while that offer is unavailable. [`comp__testhelden-telc-b1.md`; `comp__telc-trainer.md`; `site__telc-b1-komplettvorbereitung.md`]

There are now 18 registered guides, including ten task-specific additions dated today. Four new telc guides already link to the offer. The main telc guide instead prioritises “Einstufungstest starten.” **I disagree with the existing evaluation’s “level test only” description:** the capture also contains “Kostenloses Konto erstellen.” The problem is destination priority, not complete absence of registration. [guide registry:37](/home/user/deutschmeister/astro-site/src/data/guides/index.js:37); `site__leitfaden-telc-b1.md`; [evaluation:60](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:60)

**Attribution loses the very offer cohorts the strategy proposes counting.**

First touch is correctly preserved, but signup metadata saves only **first-touch campaign** and **last-touch source**. I executed the actual parser and metadata code in memory:

`Google → DTZ guide → signup?utm_campaign=dtz-waitlist`

Result: `acquisition_source=google`, `acquisition_campaign=null`, `acquisition_last_source=leitfaden`. The waitlist label disappears from profile metadata. The telc page’s subsequent account link also omits the incoming campaign. [attribution.js:33](/home/user/deutschmeister/src/lib/attribution.js:33); [telc page:56](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:56)

Therefore **“no recorded campaign signups” does not mean no campaign-assisted signups**. I disagree with evaluation recommendations that treat `profiles.acquisition_campaign` as a complete offer-interest counter. Preserve acquisition source and offer interest separately. [F8; evaluation:105](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:105)

**Owned social is not a demonstrated sales channel; partners remain a hypothesis.**

The stopped carousel series published 25 posts on both Instagram and Facebook, yielding one Instagram like, zero Facebook reactions and zero comments. A separate reel series performed better on engagement, so blanket claims that every social format failed would overreach. Neither establishes sales. Telegram ownership remains unconfirmed; the repo explicitly excludes its unverified handle. [ROUTINE.md:3](/home/user/deutschmeister/drafts/instagram-100/ROUTINE.md:3); [navigation.js:119](/home/user/deutschmeister/src/data/navigation.js:119)

Sending partners and affiliate sales are **unverified** here. ChatGPT produced three attributed signups: a useful signal, insufficient to justify a separate growth programme. Generated `llms.txt` already reflects product data and guide inventory; more catalogue polishing has no demonstrated acquisition payoff. [F8; build-llms.mjs:12](/home/user/deutschmeister/scripts/build-llms.mjs:12)

**3. Sub-scores**

| Sub-question | Score | Evidence |
|---|---:|---|
| (a) Signup decline and diagnosis | **2/5** | Real 64% decline; overlapping September changes, missing denominators. F6–8. |
| (b) SEO health | **3/5** | Static rendering, sitemap and canonicals work; money-page linking needs correction. `site__sitemap.md`; guide renderer:118. |
| (c) Buyer-search visibility | **1/5** | Absent from all eight captured top-10 sets. `search__*.md`. |
| (d) Channels | **1/5** | Social sales unproved; partners unverified; three ChatGPT signups. F8; ROUTINE.md:3. |
| (e) Path to 300 qualified visitors | **2/5** | Existing task guides enable a cheap test; sending partners remain unproved. Guide registry:37; plan:184. |

**4. Recommendations ranked by expected revenue per hour**

No measured €/hour ranking is possible yet. This is a **conditional planning ranking**, with overlapping effects that must not be added.

Assume the approved **€149 pilot**, 19% VAT, 10% refunds and 1–2% visitor→purchase conversion. Each purchase produces approximately **€113 revenue after VAT/refunds**, before fees, AI and commissions. Thus 300 qualified visitors imply **€338–676**, not a forecast. The current code price remains €89; €149 requires owner action. [pricing.js:81](/home/user/deutschmeister/src/data/pricing.js:81); [plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128)

| Rank | Change and exact location | Modelled effect | Effort / authority | Kill or measure rule |
|---|---|---|---|---|
| 1 | Give the main telc guide `offer: 'telc'` in `astro-site/src/data/guides/telc-b1.js`; repair homepage wrapping around `index.astro:86–112`. | Assuming 0.5–1 percentage-point improvement across 300 relevant visits: **€169–338/month**, approximately **€34–113 per implementation hour**. | **3–5h [agents]** | Require unclipped controls at 360/390px; measure matched-offer progression. No sequential homepage experiment at current volume. |
| 2 | Prepare `drafts/telc-partner-kit.md`: inspectable sample correction, suitability, existing offer URL and tagged links using `docs/tracking-links.md`. Owner approaches 10–30 teachers/providers. | Target three sending partners ×60 qualified visits/month: **180 visits**, approximately **€203–406 revenue/month**. | **6–10h [owner]** for sending/commissions; agents prepare | By day 90: ≥3 sending partners, ≥300 qualified partner visits and ≥3 retained sales, matching the approved arm’s gate. |
| 3 | Prepare one `drafts/telc-community-test.md` for an existing exam community; owner posts once with permission. | Assumed 30 additional qualified visits: **€34–68 revenue**. | **2–3h [owner]** | Stop after the capped placement if it produces no qualified visits. No recurring posting obligation. |
| 4 | Distribute and improve the existing ten task guides under `astro-site/src/data/guides/`; prioritise their task→offer connections before expanding inventory. | Target ten pages ×12 qualified visits/month: **120 visits**, approximately **€135–270 revenue/month**. | **10–16h [agents]**; external messages **[owner]** | Judge at day 90 using indexed pages, non-brand clicks and offer visits; use the plan’s ≥300 non-brand-click threshold before expansion. |

**Prerequisites outrank this financial ordering:** clear the existing release gate **[owner]**, and repair cohort measurement **[owner]**, approximately **6–10 implementation hours**, with agents preparing the patch. Add separate offer/door fields around `src/lib/attribution.js:33` and the profile metadata mapping; preserve first touch. Reconcile source→qualified offer visit→checkout→payment→refund before starting kill clocks. Keep analytics behind existing consent; any new public endpoint requires owner approval. [plan:175](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:175)

The cheapest **300/month target** is consequently **180 partner visits +120 existing-guide visits**, deduplicated and bot-filtered. Treat that as a 90-day test. Paid search remains gated; owned-social production stays stopped. [plan:82, 206, 286]

**5. What remains unverified**

The actual September root cause requires daily **GSC clicks/impressions by query and landing page**, successful Netlify publication times, signup-page visits/submissions, and Supabase authentication/SMTP change history. Compare `auth.users` against profiles to exclude profile-creation artefacts; test failure-log completeness. Historical logs may no longer exist.

Current backlinks, long-tail demand, human visitor counts, partner reach and purchase conversion are unverified. Anonymous X-Ray spikes must not count toward the 300-visitor target. [F22]

Finally, I disagree with calling reach the proven binding constraint solely from “16 signups/week”: without visitors→submissions→accounts, falling reach and falling conversion remain distinguishable hypotheses, not interchangeable diagnoses. [evaluation:43](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:43)

