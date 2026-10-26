**1. Score: 1/5 — paid growth is blocked by missing commercial authority and evidence.**

DeutschMeister cannot presently evidence its own approved release gate. The operator fields are blank, the legal-release check fails, and today’s live facts show an unreleased Impressum plus missing AGB/Widerruf pages. These are unresolved prerequisites for collecting more money, including through existing Pro and ticket products—not merely objections to launching telc. The root cause is that product releases have advanced without a complete, owner-approved contract, identity and processing record. [legal.js:10](/home/user/deutschmeister/astro-site/src/data/legal.js:10), [release gate:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128), [FACTS:26](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:26).

This is a commercial risk assessment, **not legal advice**. Counsel must confirm applicability and contractual allocation. I checked main at `4be1474`; the checked-out branch additionally changes founder wording. I changed no files.

**2. Findings, most important first**

**The operator and FernUSG questions affect the whole paid catalogue.**

The repository intentionally leaves the operator’s name, address, legal status and verification dates empty. That proves missing evidence, not that no registered business exists. A physician’s profession also does not establish the legal or tax status of this separate business. Counsel and the Steuerberater must identify the contracting operator, applicable registrations and tax treatment. [legal.js:8](/home/user/deutschmeister/astro-site/src/data/legal.js:8). German provider-identification duties apply to commercially offered digital services; regulated-profession disclosures depend on the activity actually offered. [DDG §5](https://www.gesetze-im-internet.de/ddg/__5.html).

FernUSG exposure is substantive: the tickets include Pro, while telc promises structured learning, assessment and AI corrections. [pricing.js:98](/home/user/deutschmeister/src/data/pricing.js:98), [telc page:213](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:213). ZFU expressly includes automated LMS correction among possible learning-success checks. “Software” or “AI-only” therefore does not establish an exemption. If required approval is absent, covered contracts are void. Product-specific classification remains **unverified**. [ZFU FAQ](https://zfu.de/veranstaltende/faq), [FernUSG §7](https://www.gesetze-im-internet.de/fernusg/__7.html).

Commercial consequence: more sales could create repayment exposure rather than durable revenue.

**Lemon Squeezy supplies payment infrastructure; its presence does not prove German checkout compliance.**

Its documentation supports VAT collection, tax-inclusive prices, German localization and subscription cancellation. Its buyer terms identify a reseller/supplier relationship and contain generic immediate-digital-delivery language. None proves the particular German checkout records every required declaration. [Tax documentation](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat), [localization](https://docs.lemonsqueezy.com/help/online-store/customization), [buyer terms](https://www.lemonsqueezy.com/buyer-terms).

The division of responsibility needs explicit verification:

| Requirement | What must be evidenced |
|---|---|
| Immediate access and Widerruf | For paid digital **content**, early expiry requires express prior consent, acknowledgement of losing the right, commencement and contractual confirmation. A generic terms link is insufficient evidence. Ongoing digital **services** require separate classification; first login does not establish full performance. Alternatively, preserve applicable withdrawal rights. [BGB §356](https://www.gesetze-im-internet.de/bgb/__356.html) |
| Payment button | The final LS submission button must clearly express payment obligation—“zahlungspflichtig bestellen” or an equally unambiguous formulation. An intermediate “Go Pro” CTA is not the statutory payment button. Noncompliance can prevent contract formation. [BGB §312j](https://www.gesetze-im-internet.de/bgb/__312j.html) |
| Contract information | Identify seller/supplier roles; disclose total charge, renewal, duration, cancellation, functionality and statutory digital-product rights; provide durable confirmation, including any withdrawal declarations. [EGBGB Art.246a §1](https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html), [BGB §312f](https://www.gesetze-im-internet.de/bgb/__312f.html) |
| Subscription cancellation | The site offers a billing portal requiring email sign-in. That establishes a cancellation facility, not the continuously accessible statutory button, confirmation page and immediate confirmation process. Missing compliant facilities can permit termination without notice. [pricing.astro:154](/home/user/deutschmeister/astro-site/src/pages/pricing.astro:154), [LS portal](https://docs.lemonsqueezy.com/help/online-store/customer-portal), [BGB §312k](https://www.gesetze-im-internet.de/bgb/__312k.html) |
| Online withdrawal function | Separate from subscription cancellation: §356a requires an accessible withdrawal function during the withdrawal period. It took effect on **19 June 2026**. Implementation and LS/site allocation are unverified. [BGB §356a](https://www.gesetze-im-internet.de/bgb/__356a.html), [enacted law, Article 10](https://www.recht.bund.de/bgbl/1/2026/28/regelungstext.pdf?__blob=publicationFile&v=1) |

An `/agb/` URL is not itself universally mandatory. Mandatory consumer information and withdrawal handling are. The 404s demonstrate that those particular pages cannot supply them; they do not prove what LS supplies elsewhere. [FACTS:26](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:26).

**VAT presentation has documented checkout friction and unresolved current status.**

The October owner instructions record `tax_inclusive=false` and a German €11.89 checkout against a €9.99 advertised plan. Those are historical findings, not verification of today’s setting. Calling the constants “gross” does not configure LS. [owner-prompts.md:55](/home/user/deutschmeister/docs/owner-prompts.md:55), [pricing.js:23](/home/user/deutschmeister/src/data/pricing.js:23).

Assuming 19% VAT, a tax-exclusive €149 becomes **€177.31**: a €28.31 surprise. Consumer advertising must show the total price including applicable taxes. LS’s inclusive setting affects future subscription invoices, so this is an owner money decision. [PAngV §2](https://www.gesetze-im-internet.de/pangv_2022/__2.html), [§3](https://www.gesetze-im-internet.de/pangv_2022/__3.html), [LS tax documentation](https://docs.lemonsqueezy.com/help/payments/sales-tax-vat).

**GDPR controls exist, but lawful processing is not evidenced.**

GA loads after acceptance; PostHog rechecks consent after loading and has withdrawal handling. However, attribution deliberately writes first/last-touch localStorage regardless of analytics consent. “First-party” and “nothing leaves until signup” do not establish the strict-necessity exception for terminal storage. [consent.js:42](/home/user/deutschmeister/public/consent.js:42), [analytics.js:45](/home/user/deutschmeister/src/lib/analytics.js:45), [attribution.js:15](/home/user/deutschmeister/public/attribution.js:15), [TDDDG §25](https://www.gesetze-im-internet.de/ttdsg/__25.html).

Voice goes to OpenAI transcription; writing goes to Anthropic; the privacy draft explicitly leaves provider settings, retention, agreements and transfer safeguards unverified. Cookie consent and microphone permission do not establish those processing bases. Counsel should determine necessary contractual processing, any additional consent, processor/controller roles and transfer safeguards. [speakingAI.mjs:227](/home/user/deutschmeister/netlify/functions/_shared/speakingAI.mjs:227), [evaluate-writing.mjs:501](/home/user/deutschmeister/netlify/functions/evaluate-writing.mjs:501), [privacy.astro:119](/home/user/deutschmeister/astro-site/src/pages/privacy.astro:119), [GDPR Arts.6,13,28,44](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).

The Codex deletion no-op is **fixed on main**: the button calls an authenticated deletion endpoint. Complete erasure remains unverified: the endpoint explicitly excludes support/payment/email records and blocks charging subscriptions. Retention exceptions and an independent rights-request process need justification. [ProfilePage.jsx:133](/home/user/deutschmeister/src/pages/ProfilePage.jsx:133), [delete-account.mjs:24](/home/user/deutschmeister/netlify/functions/delete-account.mjs:24), [GDPR Art.17](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).

**The confirmed email list is not an evidenced marketing audience.**

Daily-mail selection checks email confirmation and opt-out, not recorded marketing permission. Today’s 1,194 confirmed accounts therefore cannot be valued as 1,194 legally marketable prospects. Eligibility remains unverified. [daily-sentence.mjs:83](/home/user/deutschmeister/netlify/functions/daily-sentence.mjs:83), [FACTS:5](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:5). The existing-customer exception has four cumulative conditions; owner approval alone does not legalize promotional email, including partner email. [UWG §7](https://www.gesetze-im-internet.de/uwg_2004/__7.html).

**Claims cleanup has progressed; the remaining telc claim is still unsupported.**

Main now guards against the comparison outcome promise, contradictory Lingoda price claim and denials of competitors’ speaking features. The plan’s “3 false claims” should not be reported as three still-open code defects. Deployment and current competitor facts remain unverified. [comparison-claims.test.mjs:4](/home/user/deutschmeister/tests/comparison-claims.test.mjs:4).

The telc page still asserts why “most” candidates fail without evidence. That is a material factual claim beside the offer. [telc page:138](/home/user/deutschmeister/astro-site/src/pages/telc-b1-komplettvorbereitung.astro:138), [UWG §5](https://www.gesetze-im-internet.de/uwg_2004/__5.html). Comparative advertising requires objective, verifiable comparisons. [UWG §6](https://www.gesetze-im-internet.de/uwg_2004/__6.html).

A voluntary money-back guarantee is optional. Main deliberately prohibits an unapproved promise; statutory withdrawal rights remain separate. [refund-claims.test.mjs:1](/home/user/deutschmeister/tests/refund-claims.test.mjs:1).

**3. Sub-scores and release-gate status**

| Gate item | Score | Evidenced status |
|---|---:|---|
| Operator/tax | 1 | Identity and verification fields blank; tax position unverified. [legal.js:10](/home/user/deutschmeister/astro-site/src/data/legal.js:10) |
| FernUSG: Pro | 1 | Required determination unevidenced. [plan:130](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:130) |
| FernUSG: tickets | 1 | Includes Pro; no product-specific clearance evidenced. [pricing.js:98](/home/user/deutschmeister/src/data/pricing.js:98) |
| FernUSG: telc | 1 | Required determination unevidenced. [plan:130](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:130) |
| §7 UWG | 1 | Confirmation/opt-out selection. [daily-sentence.mjs:91](/home/user/deutschmeister/netlify/functions/daily-sentence.mjs:91) |
| Impressum/privacy facts | 1 | Draft live; verification fields empty. [legal.js:43](/home/user/deutschmeister/astro-site/src/data/legal.js:43) |
| AGB/Widerruf/guarantee | 1 | Pages 404; approved contract package unverified. [FACTS:26](/tmp/claude-0/-home-user-deutschmeister/06ef4c33-4000-5c9f-b7e7-13854edd79f2/scratchpad/deep/FACTS.md:26) |
| LS merchant identity | 1 | Required reconciliation unverified. [plan:134](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:134) |
| VAT-inclusive store | 1 | Historical failure; current setting unverified. [owner-prompts:55](/home/user/deutschmeister/docs/owner-prompts.md:55) |
| €149 renamed product, Draft | 2 | Instructions exist; main remains €89; dashboard unverified. [pricing.js:81](/home/user/deutschmeister/src/data/pricing.js:81) |
| Purchase/refund/replay | 2 | Procedure exists; completed evidence unverified. [pilot:60](/home/user/deutschmeister/docs/telc-pilot/README.md:60) |

- **(b) Consumer checkout: 1/5.** Statutory execution unverified; legal links currently cover privacy/Impressum only. [navigation.js:172](/home/user/deutschmeister/src/data/navigation.js:172).
- **(c) GDPR: 2/5.** Implemented controls, incomplete processing record. [privacy.astro:165](/home/user/deutschmeister/astro-site/src/pages/privacy.astro:165).
- **(d) Claims: 3/5.** Comparison guards improved; unsupported telc assertion remains.
- **(e) Pilot readiness: 1/5.** The approved gate requires every item evidenced before public sale. [plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128).

**4. Recommendations, ranked by conditional revenue per hour**

Illustrative assumptions: ten €149 buyers, 19% VAT, 10% refunds and 50% probability of filling the cohort after clearance imply **€563 expected retained revenue**, before fees, AI and legal costs. This is shared value across dependent tasks, not additive uplift.

| Rank | Change and exact location | Effect; effort | Authority; kill/measure rule |
|---|---|---|---|
| 1 | Verify inclusive setting in LS store 309512; align price renders with `pricing.js`. | Removes price surprise; 0.5–1h, conditional €563–1,126/h. | **[owner]** Pass only when German totals match monthly, yearly, ticket and pilot offers. |
| 2 | Prepare product/contract/processing evidence brief beside `docs/telc-pilot/README.md`. | Accelerates counsel’s decision; 1–2h, €282–563/h. | **[agents]** Normal factual PR; every gate row needs an artifact, responsible person and decision. |
| 3 | Resolve promotional eligibility in `daily-sentence.mjs`, lifecycle mailers and signup flow. | Removes dependence on an unusable legacy audience; 1–3h initial work. | **[owner] + counsel** Suppress unevidenced promotional recipients; measure documented eligibility, not confirmations. |
| 4 | Complete operator/tax and three product classifications; populate `legal.js` from records. | Clears the fundamental sales block; estimate 3–6h active owner/adviser work, external lead time unverified. | **[owner] + counsel/Steuerberater** No covered sale without clearance or effective approval. Start immediately despite ranking. |
| 5 | Approve contract package and LS/site checkout, withdrawal and cancellation allocation; update `navigation.js` and legal pages. | Creates an enforceable, reviewable purchase path; 6–12h assumption. | **[owner] + counsel** Test declarations, button wording, confirmation, cancellation and refund/replay before opening. |
| 6 | Resolve `privacy.astro`, attribution, provider agreements and deletion inventory. | Enables evidenced AI fulfilment; 6–12h assumption. | **[owner]** Signed/accepted applicable DPAs, transfer basis, retention schedule and synthetic-account erasure proof required. |
| 7 | Remove unsupported telc claim; verify deployed comparison fixes. | Prevents misleading sales copy; 1–2h; revenue effect unquantified. | **[owner]** Brand/legal release; no unsupported outcome or voluntary refund promise. |

I disagree with the current evaluation’s “tickets stay on sale” recommendation while their required determination is unevidenced. I also reject treating a voluntary guarantee as necessary for lawful launch. [evaluation:87](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:87), [evaluation:108](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:108).

The minimum first-sale checklist is:

- **Counsel/Steuerberater, [owner]:** clear operator, tax, product classification, contract rights and processing basis.
- **Owner, [owner]:** approve facts, checkout settings, agreements, terms and any guarantee; complete the paid test/refund/replay.
- **Agents, [agents]:** assemble evidence and run read-only checks; prepare reserved implementation changes for owner approval.
- **Owner, [owner]:** open ten places only after all applicable gate evidence passes.

Optional guarantees and comparison expansion need not delay a compliant pilot. Confirmed legal/processing failures do. Clean-sheet alternative: a download-only rehearsal kit reduces account/AI processing, but changes the offer and still needs fresh classification; reuse the platform only after the present gate clears.

**5. What remains unverified**

German final checkout declarations, receipt content, current tax setting, actual merchant/supplier identity, effective ZFU status, provider agreements/settings, full deletion coverage, personal-key revocation and the private data-exposure closure remain **unverified**. Verify with owner-account records, counsel’s written decisions and controlled synthetic-account tests.

The supplied capture directory lacked `INDEX.md`; its `shots/` was empty. I opened the available sibling `shots/home.png` and `pricing.png`. Four focused consent/deletion/claims test files passed; `check-legal-release` failed on 15 missing fields. Those results establish repository behavior—not deployed compliance.

