## 1. Score: **2/5**

DeutschMeister has useful distribution infrastructure and a draft partner kit, but distribution beyond search remains commercially unproven. No labelled campaign produced a signup in 30 days; the telc package remains off sale; and the kit explicitly lacks its feedback demonstration and commission agreement (`FACTS.md:8,29`; `docs/partners/README.md:30–32`). **The root cause is an unfinished partner proposition:** teachers cannot yet inspect convincing product proof, confidently recommend the offer, and receive reliable credit for resulting purchases.

**Clean sheet: hybrid.** Improve the existing kit and sell exam rehearsal as homework recommended by teachers. Replacing consumer sales with institutional licences would add contracting and servicing work before willingness to pay is established—an unverified alternative worth testing later.

Code and kit references below are unchanged from `main@4be1474`; live observations come from the supplied captures. No files changed.

## 2. Findings, most important first

**1. The partner kit describes access, while teachers need evidence of useful homework.**

The kit exists: German offer sheet, three outreach templates and tagged-link instructions. However, its offer leads with eight levels, speaking allowances, writing corrections and sentence analysis (`docs/partners/partner-offer.de.md:14–24`). The actual programme contains three letters with revision, ten speaking rehearsals and an unseen retest (`src/data/programs/telcB1Komplett.js:8–16`).

Meanwhile, the live capture says **“Der Kurs startet in Kürze”** and displays **“89,00 €”** (`capture/site__telc-b1-komplettvorbereitung.md:58,98`). The approved €149 pilot remains a strategy decision, not the observed live offer (`docs/strategy/million-plan-2026-10.md:136`).

**Sales cost:** a teacher must risk their reputation without seeing the correction quality or a settled offer. The missing demonstration blocks the recommendation itself.

I disagree with the current evaluation’s emphasis that “reach stays the binding constraint” (`docs/strategy/sales-evaluation-2026-10-26.md:43–46`). Partner readiness and distribution are joint constraints. Drafting demonstrations and researching buyers can proceed while the owner clears the release gate.

**2. Partner attribution can collapse different partners into one bucket.**

The example links contain different `ref=partner-…` values alongside identical `utm_source=partner`. The parser prioritises `utm_source`; partner identity survives only when the optional `utm_content` extension is added (`public/attribution.js:120–128`; `docs/partners/links.md:32–43`). I reproduced this locally: two different example partners produced identical saved labels without that extension.

Furthermore, signup metadata preserves first-touch content and only the last-touch **source** (`src/lib/attribution.js:33–45`). An existing learner arriving through a partner therefore needs separate commission attribution.

**Sales cost:** DeutschMeister could recruit productive partners yet fail to identify them accurately. That damages both channel allocation and payout confidence.

**3. Coupons provide discount administration, not an affiliate programme.**

`admin-coupons` explicitly creates a governance record; the matching discount must separately exist in Lemon Squeezy (`netlify/functions/admin-coupons.mjs:1–3`). Checkout passes a validated coupon into provider custom data; the webhook records redemption only when an actual discount exists (`src/config/lemonsqueezy.js:73–89`; `netlify/functions/lemonsqueezy-webhook.mjs:354–366`).

Consequently, the redemption ledger cannot identify a full-price referral through a zero-discount “tracking coupon.” I found no commission calculation or payout workflow in the inspected implementation. External Lemon Squeezy affiliate configuration is **unverified**.

The brief reports an empty coupons table; the supplied FACTS pack does not independently document that current count.

**4. Several attractive audiences need a different offer or payer.**

Integration-course acquisition requires exact exam matching. BAMF identifies DTZ as the language examination within the integration-course final assessment. DeutschMeister’s registry treats DTZ separately and has no dedicated course destination (`src/data/examTracks.js:79–87`). A telc B1 package should therefore not be presented as a ready-made DTZ package. [BAMF examination guidance](https://www.bamf.de/DE/Themen/Integration/ZugewanderteTeilnehmende/Integrationskurse/Abschlusspruefung/abschlusspruefung-node.html)

Healthcare employers have identifiable language needs: Charité describes B1 before arrival and B2 for recognition, with B2-course funding. That suggests an employer-funded supplement, subject to discovery. It does not establish demand for this telc product. [Charité’s international nursing process](https://karriere.charite.de/international/informationen-auslaendische-pflegekraefte)

**Sales cost:** broad “German for migration” outreach would mix exam formats, payment ability and institutional purchasing processes.

**5. The founder-time budget omits much of partner recruitment.**

The plan allocates 5–10 owner minutes weekly to outreach; the kit proposes ten messages, including follow-ups (`docs/strategy/million-plan-2026-10.md:228`; `docs/partners/README.md:34–44`). That permits 30–60 seconds per message before replies, demonstrations, negotiation or reconciliation.

My planning assumption is **45–90 owner minutes for an initial ten-prospect batch**, including follow-up handling. Measure it. Delegated drafting reduces preparation; the owner still owns brand messages and commercial decisions (`docs/agents/PROTOCOL.md:9–15`).

### Channel ranking by qualified buyers per owner-hour

These are **unverified 90-day planning estimates**, including unsuccessful approaches and follow-ups. “QB” means a price-aware prospect near the required level with the exact examination booked or imminent. Payments must be measured separately. Future-offer channels contribute zero until their offer is ready.

| Rank | Channel | Assumed QB / owner-hours | QB/hour |
|---|---|---:|---:|
| 1 | Independent telc teachers with current cohorts | 8–20 / 2 | 4–10 |
| 2 | Exam-focused YouTube/TikTok teachers | 25–80 / 8 | 3–10 |
| 3 | One approved Facebook/Telegram exam placement | 10–30 / 4 | 2.5–7.5 |
| 4 | Private course providers; teaching lead first | 12–30 / 6 | 2–5 |
| 5 | VHS/integration providers, matching DTZ offer | 10–30 / 10 | 1–3 |
| 6 | India/Indonesia nursing migration pipelines | 10–40 / 20 | 0.5–2 |
| 7 | Employers of nurses/doctors | 10–20 / 20 | 0.5–1 |
| 8 | Anerkennung advisers | 2–6 / 6 | 0.3–1 |
| 9 | Jobcenter/Arbeitsagentur institutional purchasing | 0–4 / 16 | 0–0.25 |

**[owner] Prioritise the first four.** Jobcenter funding eligibility and procurement access are unverified. Recognition advisers merit a resource-referral conversation; commission acceptance is unverified.

### First ten concrete targets, by type

All are research prospects. Partnership willingness, audience quality and accessible budgets are **unverified**. All approaches are **[owner]**; research and drafts are **[agents]**.

| # | Target and type | Concrete opening |
|---|---|---|
| 1 | [YourGermanTeacher—Luzi/Johannes](https://www.yourgermanteacher.com/b1-german-online-course), teacher/creator | Strong complementary fit: their FAQ explicitly recommends additional dedicated exam training. Ask about telc-bound B1 finishers. |
| 2 | [Sprachschule Aktiv’s online telc B1 teaching lead](https://www.sprachschule-aktiv.de/deutschkurs-online/online-b1-telc-pruefungsvorbereitung/), provider | Offer a demonstrable homework supplement between classes. Existing competing preparation makes acceptance uncertain. |
| 3 | [DeutschAkademie’s telc B1 workshop lead](https://www.deutschakademie.de/deutsch-zertifikate/telc/b1-pruefungsvorbereitung/), provider | Test optional practice after a workshop. Capture describes independent learners seeking guided support (`comp__deutschakademie-telc-b1.md:40–42`). |
| 4 | [Deutsch mit Marija](https://deutsch-mit-marija.de/), creator | Establish current telc audience share before proposing one sample-based placement. |
| 5 | [VHS Berlin-Mitte Deutsch department](https://www.berlin.de/vhs/volkshochschulen/mitte/kurse/deutsch/), integration provider | DTZ discovery only until a matching offer exists. |
| 6 | [Facebook group 607262593192742](https://www.facebook.com/groups/607262593192742/), community administrator | Search surfaced a telc-format question. Group identity, rules and human engagement remain unverified; retrieval returned 403. Validate before approaching. |
| 7 | [Club Dialog FAbA+ II](https://www.club-dialog.de/FAbA), recognition advice/community | Ask which language-resource gaps arise in recognition counselling; its official page links a Telegram community. |
| 8 | [Charité Stabsstelle Integration Pflege](https://karriere.charite.de/international/informationen-auslaendische-pflegekraefte), employer | Later: discover demand for supplementary B2 practice within funded cohorts. |
| 9 | [NORKA Roots/GIZ Triple Win Kerala](https://triple-win-programm.de/en/partner-countries/kerala-india.html), India pipeline | Determine exact B1 certificate and supplementary budget. Published language support already covers B1/B2 training. |
| 10 | [GIZ/KP2MI Triple Win Indonesia](https://triple-win-programm.de/en/partner-countries/indonesia.html), Indonesia pipeline | Same discovery; establish an unmet need before proposing another paid resource. |

## 3. Sub-scores

| Question | Score | Evidence |
|---|---:|---|
| **(a) Buyer channels** | **2/5** | Plausible targets exist; no labelled campaign signup in 30 days (`FACTS.md:8`). |
| **(b) Affiliate/coupon/referral infrastructure** | **3/5** | Discount governance, validation and redemption exist; commission operations remain unverified (`admin-coupons.mjs:1–3`). |
| **(c) Partner kit** | **2/5** | Drafts exist; demonstration and commercial terms are missing (`docs/partners/README.md:30–32`). |
| **(d) Referral mechanics** | **1/5** | Story submission collects publication permission, without give/get mechanics (`astro-site/src/pages/share-your-story/index.astro:67–81`). |
| **(e) Class licences** | **1/5** | Approved strategy permits B2B discovery only after ten paid buyers (`million-plan-2026-10.md:83`). |
| **(f) Owner-time efficiency** | **1/5** | Ten-message cadence exceeds a credible initial 5–10-minute relationship budget; estimates require measurement. |

## 4. Recommendations ranked by expected revenue per hour

All estimates below are **unverified assumptions**, with a possible €0 outcome. Model: €149 gross pilot, 19% VAT and 10% refunds gives **€112.69 expected retained revenue per order**, before costs. The VAT/refund convention follows `million-plan-2026-10.md:66`.

Assuming €20 commission, €20 AI allowance and fees of 6% of gross leaves approximately **€64 contribution**. A €40 commission leaves €44. Applying that €40 ceiling to the live €89 price leaves approximately **€2**. Actual provider costs remain unverified (`FACTS.md:19`).

| Rank | Change and exact location | Expected case; effort | Authority and kill/measure rule |
|---|---|---|---|
| 1 | Finish the kit in `docs/partners/`; make `utm_content` compulsory in every example in `links.md:24–28` | Five orders ≈€563 revenue / six total hours: **€94/hour**; four agent, two owner hours | **[agents]** prepare; **[owner]** approves proof, price and sends. After ten approaches, diagnose objections if nobody agrees to inspect or share the sample. |
| 2 | One creator **or** community placement using `outreach-templates.de.md`; record placement, replies and owner minutes | Three orders ≈€338 / five hours: **€68/hour** | **[owner]** placement and any budget. Keep the plan’s 90-day partner test: ≥3 sending partners, ≥300 qualified visits, ≥3 retained sales (`million-plan:205–206`). |
| 3 | Add a voluntary copy-link referral prompt after meaningful practice, near completion in `src/pages/TelcB1CoursePage.jsx`—location to confirm | One order ≈€113 / three hours: **€38/hour** | **[agents]** draft placement; **[owner]** approves wording/rewards. Stop expansion if twenty eligible invitations produce no qualified referral. |
| 4 | Later, propose a manual class pilot in a new `docs/partners/class-pilot.de.md` | Twenty proposed €99 seats ≈€1,497 / forty setup hours: **€37/hour** | **[owner]** price, access, terms, invoicing. Discovery after ten paid buyers; stop after three calls without a funded pilot commitment. |

The completed kit should contain:

- **[agents]** A one-page exact-exam offer and teacher assignment sheet explaining between-class use.
- **[agents]** A real letter → AI feedback → revision example and short demonstration, labelled with limitations.
- **[owner]** DaF review, publication approval, final price/access terms and any commission agreement.
- **[agents]** Forwardable learner text, opaque partner identifiers, placement-specific links and a private results/time log.
- **[owner]** Approved payout attribution, refund handling and consent basis. Prices and limits must derive from `pricing.js` and `marketing.js`.

**Referral mechanics:** **[agents]** keep testimonial collection separate from referral sharing. The current story form requires publication permission; it is unsuitable for general private feedback (`share-your-story/index.astro:70`). **[owner]** only after organic sharing works, test proposed give-€10/get-€10 rewards after a retained package purchase, capped at €20 combined. Exclude self-referrals and duplicate rewards; reward the referral, independently of testimonial sentiment.

**B2B mechanics:** **[owner]** start with named individual seats, one cohort, agreed duration, fixed AI allowances and upfront payment. Teacher reporting, learner-data access and institutional terms need explicit decisions. **[agents]** prepare a manual pilot specification before proposing an LMS, SSO or teacher dashboard.

## 5. What remains unverified

- **Live coupon count and external affiliate settings:** verify with read-only database counts and Lemon Squeezy configuration inspection.
- **Partner appetite and purchasing authority:** owner-approved conversations must establish examination, cohort size, timing, payer and willingness at the quoted price.
- **Attribution through payment/refund:** reconcile partner → qualified offer view → checkout → payment → refund before starting conversion kill clocks (`million-plan:175,193`). Browser tags alone cannot supply this denominator.
- **Consent and privacy:** preserve existing first-touch semantics; new analytics must respect `dm_cookie_consent` and consent events (`public/consent.js:13,36`). Any additional measurement basis or endpoint is **[owner]**.
- **Economics and founder burden:** record actual fees, AI costs, refunds, commissions and every owner minute for the first cohort. Current usage is too small to support confident referral forecasts (`FACTS.md:17–21`).

