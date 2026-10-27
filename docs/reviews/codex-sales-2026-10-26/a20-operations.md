**1. Score: 2/5**

DeutschMeister has credible engineering controls, but its sales operation still depends on an owner whose availability is neither measured nor protected. Agents can prepare work; the owner must approve or execute prices, refunds, access changes, legal decisions, outreach and support sends. The approved plan records a historical **16-day median approval wait** and a lost executor session. That combination prevents reliable commercial execution. Current revenue—€11.09 MRR and no sales in seven days—does not justify a larger operating apparatus. ([PROTOCOL.md:9](/home/user/deutschmeister/docs/agents/PROTOCOL.md:9), [million-plan:268](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:268), supplied `FACTS.md:13–14`.)

**Clean sheet: hybrid** — retain CI and the four roles, but organise work around one weekly owner decision window, daily customer exceptions and one sales experiment. Replacing the system with managed human support would reduce dependence on agent execution, but introduces an unproven expense. Simply evolving the current model leaves its approval queue intact.

Review basis: local main `4be1474`; checkout `847ea1f` is draft PR #234. Live captures are separate evidence. No files changed.

**2. Findings, most important first**

**The owner is the commercial execution bottleneck.**

The reserved list covers almost every action that turns preparation into revenue. The launch gate additionally requires operator/tax decisions, product-specific legal determinations, store configuration and a purchase → refund → replay test. Agents cannot clear these independently. The live telc capture still says **“Der Kurs startet in Kürze”** and **“89,00 €”**, while the approved pilot requires €149 and completed release evidence. This is an unresolved launch dependency; more promotional assets cannot remove it. ([million-plan:128](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:128); `site__telc-b1-komplettvorbereitung.md:58,98`.)

The 16-day median is a **historical documented measurement**, not a verified current median: its underlying approval records were unavailable. At an assumed one to three retained pilot sales per week, another 16-day delay represents roughly **€340–1,020 of deferred gross receipts** at €149. That is scenario arithmetic, not measured lost demand.

The plan budgets approximately 190 setup minutes and 17–25 weekly minutes, but the packet explicitly says actual owner minutes require separate recording. Consequently, the low-touch operating promise remains unverified. ([million-plan:212](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:212), [monday-packet.md:15](/home/user/deutschmeister/docs/agents/monday-packet.md:15).)

**The agent loop detects silence better than it proves useful completion.**

The documented executor remains one connector-bearing session. Fresh-session Routines could not access the necessary connectors; recovery requires recreating Routines and an owner manually enabling Auto mode. Role prompts still depend on the private artifact, despite the strategy proposing a Supabase state store. ([scorecard-routine.md:5](/home/user/deutschmeister/docs/scorecard-routine.md:5), [scorecard-routine.md:35](/home/user/deutschmeister/docs/scorecard-routine.md:35), [million-plan:148](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:148).)

The sentinel reads the newest heartbeat across the table. A recent start or overnight heartbeat therefore cannot prove that sales or fulfilment completed successfully. The Monday SQL improves this by pairing starts and ends, but assumes naming conventions and defaults deliberate-session-loss verification to false. On the documented 19 October start, a full 14-day canary cannot yet be certified on 26 October. Live heartbeat ages, incidents and notification delivery are **unverified**. ([sentinel.mjs:160](/home/user/deutschmeister/netlify/functions/sentinel.mjs:160), [monday-packet.sql:188](/home/user/deutschmeister/docs/agents/monday-packet.sql:188).)

The commercial cost is interrupted customer handling and experiments whose execution cannot be trusted.

**The backlog contains stranded work and substantial merge debt.**

Read-only GitHub inspection found **ten open PRs; eight reported `mergeable: false`**. These are open-PR ages, not approval waits:

| Money-related PR | Branch | Age on 26 October | Commercial dependency |
|---|---|---:|---|
| [#221](https://github.com/Zaid9657/deutschmeister/pull/221) | `claude/ai-usage-ledger` | 7 days | AI costs and contribution measurement |
| [#199](https://github.com/Zaid9657/deutschmeister/pull/199) | `claude/ecstatic-ramanujan-vupv2p` | 17 days | Anonymous X-Ray cost guard |
| [#195](https://github.com/Zaid9657/deutschmeister/pull/195) | `claude/cool-turing-oemuh5` | 20 days | Auth, landing and support access |
| [#206](https://github.com/Zaid9657/deutschmeister/pull/206) | `claude/modest-hawking-r21dd3` | 14 days | Course abandonment measurement |
| [#149](https://github.com/Zaid9657/deutschmeister/pull/149) | `claude/youthful-wozniak-nvse2f` | 29 days | Alternative course system, migration and future paid access |

All five are drafts and currently unmergeable. The other open PRs are #234 evaluation/brand copy, #226 grammar fixes, #210 checkpoint correctness, #188 Arabic and #185 station art. Local git exposes only `main` and `claude/hopeful-clarke-mwdhv6`, with their origin refs; the additional branch names above came from GitHub.

This inventory needs reconciliation against main before anyone approves old patches. The approved plan already parks #149/#188 and calls for closing #185. Keeping them active consumes review capacity without advancing the pilot. ([million-plan:279](/home/user/deutschmeister/docs/strategy/million-plan-2026-10.md:279).)

**Support is a human service with AI preparation, and its records are split.**

Main explicitly converts `SUPPORT_AGENT_MODE=send` into draft mode. Nevertheless, the operations guide still instructs an operator to enable sending. That stale instruction creates troubleshooting and onboarding waste. ([support-agent.mjs:346](/home/user/deutschmeister/netlify/functions/support-agent.mjs:346), [production-agents.md:250](/home/user/deutschmeister/docs/agents/production-agents.md:250).)

The brief supplies **three support tickets**; their statuses, response times and completeness are unverified. The customer-facing form promises an email response, without a deadline. Internal SLAs are **4/12/48/120 calendar hours** by priority; these are not published service commitments. Email follow-ups do not automatically become ticket messages, so ticket counts cannot establish total workload. ([SupportRequestForm.jsx:92](/home/user/deutschmeister/src/components/SupportRequestForm.jsx:92), [adminSupportLib.mjs:11](/home/user/deutschmeister/netlify/functions/_shared/adminSupportLib.mjs:11), [production-agents.md:264](/home/user/deutschmeister/docs/agents/production-agents.md:264).)

Refunds require owner execution and verification. The runbook specifies full refunds because any refund—including partial—revokes access. One neglected payment problem can therefore create both lost revenue and manual entitlement work. ([telc-pilot/README.md:95](/home/user/deutschmeister/docs/telc-pilot/README.md:95).)

**Release discipline is stronger than commercial release readiness.**

CI covers lint, shared-data consistency, full tests, function syntax, both builds, merge, prerender and built HTML. Prerender deliberately fails on reuse after consuming its manifest; a clean build is required. These are useful controls. Current CI status and branch protection were not verified. ([ci.yml:22](/home/user/deutschmeister/.github/workflows/ci.yml:22), [prerender-spa-routes.mjs:77](/home/user/deutschmeister/scripts/prerender-spa-routes.mjs:77).)

Do not describe every migration as pending: the ledger records five applied on 22 October and six on 25 October. The explicitly pending A1.1 text correction fixes public grammar content; the course already applies its corrections. FSRS/help evidence is deferred, but is not established as a pilot launch blocker. ([migrations/README.md:80](/home/user/deutschmeister/migrations/README.md:80), [canDo.js:11](/home/user/deutschmeister/src/lib/course/canDo.js:11).)

The consequential outstanding measurement dependency is #221. Main’s margin query explicitly leaves AI/channel costs and full contribution unknown. Zero recorded speaking cost in `FACTS.md:19` must not be interpreted as free delivery. ([margin-per-sale.sql:34](/home/user/deutschmeister/docs/agents/margin-per-sale.sql:34).)

**Where I disagree with the current evaluation:** its exam-first routing recommendation is already implemented on main. Rebuilding it would waste execution capacity. I also reject treating reach as the sole binding constraint before launch readiness and owner throughput are established. ([sales-evaluation:106](/home/user/deutschmeister/docs/strategy/sales-evaluation-2026-10-26.md:106), [firstRun.js:107](/home/user/deutschmeister/src/lib/firstRun.js:107).)

**3. Sub-scores**

| Sub-question | Score | Evidence |
|---|---:|---|
| (a) Owner budget and approvals | **1/5** | Historical 16-day median; actual owner minutes separately unmeasured — `million-plan:269`, `monday-packet.md:15`. |
| (b) Agent survival | **2/5** | Single bound executor; completion/recovery proof outstanding — `scorecard-routine.md:5`, `monday-packet.sql:194`. |
| (c) Support/refunds | **2/5** | Draft-only enforcement is sound; owner sends and split follow-up records remain — `support-agent.mjs:346`, `production-agents.md:264`. |
| (d) Release discipline | **4/5** | Comprehensive CI; manual database/deploy verification remains necessary — `ci.yml:22`, `migrations/README.md:3`. |
| (e) Money backlog | **1/5** | Five relevant draft PRs currently unmergeable; full contribution remains unknown — PRs above, `margin-per-sale.sql:34`. |
| (f) Operating cadence | **2/5** | A useful Monday template exists; its actual-time field may remain UNKNOWN — `monday-packet.md:12`. |

**4. Recommendations ranked by expected revenue per implementation hour**

The following are **unverified decision scenarios**, not forecasts. First-three estimates assume 50% probability of the stated incremental sales and 10% refunds, at the approved €149 pilot price. Receipts include VAT and precede costs. Benefits overlap and must not be added. Dependencies still govern launch order.

1. **Finish one evidenced release decision [owner].**  
   Location: `million-plan` move 1, `docs/owner-prompts.md`, `docs/telc-pilot/README.md`. Agents assemble the evidence and exact patches; the owner resolves legal/store/access decisions. **4–6 combined hours**, excluding professional advisers’ time; ten enabled sales imply approximately **€670 expected retained receipts, €112–168/hour**. Measure: every gate item has dated evidence and the refund/replay test passes. Kill: no public opening while evidence is incomplete.

2. **Make the owner queue short and executable [agents]; operate it [owner].**  
   Location: `docs/agents/monday-packet.md`, role `owner_queue` records and `PROTOCOL.md:228`. Each request needs a prepared diff, consequence, minutes, ready timestamp and decision timestamp; at most three appear weekly. **1–2 hours**; two rescued sales imply **€134, €67–134/hour**. Measure median and P90 ready-to-decision time separately from PR age. Target median ≤3 days; unresolved items leave active work after seven days.

3. **Run one capped partner acquisition experiment [agents]/[owner].**  
   Location: the existing partner kit and pilot runbook. Agents prepare personalised drafts and tagged links; owner sends five approaches weekly until the first 30. **3–5 preparation hours**; three incremental sales imply **€201, €40–67/hour**. Measure qualified views, retained purchases and owner minutes. Apply the existing ≥300-view decision threshold; never substitute signup labels for exposure.

4. **Consolidate support handling and repair its runbook [agents]; retain human sending [owner].**  
   Location: `production-agents.md:148,250`, fulfilment desk instructions and admin support workflow. Reconcile inbox threads with ticket references and remove obsolete send-mode instructions. **2–3 hours**; a 10% chance of preventing one €149 refund implies **€15, €5–8/hour**. Measure first human response, unresolved billing cases and minutes across both channels. Publish a response deadline only after demonstrated capacity.

5. **Reconcile the backlog and certify execution [agents]; approve reserved releases [owner].**  
   Location: PR #221, `monday-packet.sql`, `margin-per-sale.sql`, `scorecard-routine.md`. Rebase necessary work, identify superseded patches, and distinguish approved parking from accidental abandonment. **4–8 hours**; revenue effect unquantified. Require the 14-day completion/recovery canary and AI-cost reconciliation within the plan’s 5% tolerance before scaling. A failed canary means executor repair and no added roles.

All price/claim edits must derive from `pricing.js`/`marketing.js`; analytics must preserve the consent mechanism. New endpoints, RLS changes and outward messages remain owner-reserved. ([CLAUDE.md:44](/home/user/deutschmeister/CLAUDE.md:44).)

**The proposed 90-day owner schedule [owner]: 60 minutes weekly, measured**

| Time | Exact task | Minutes |
|---|---|---:|
| Daily, 18:30 UTC | Inbox/ticket sweep; send ready replies; identify payment emergencies | 3 × 7 = **21** |
| Monday, 08:00 | Packet 5; up to three decisions 8; refunds/reconciliation 7 | **20** |
| Wednesday, 08:00 | Send prepared partner approaches/follow-ups | **10** |
| Friday, 08:00 | Review customer outcomes, costs and experiment continuation | **9** |

Reserve approximately **210 additional setup minutes** in the first fortnight, against the plan’s 190-minute estimate.

Days 1–14 establish release evidence and executor reliability; days 15–45 run the bounded pilot; days 46–90 continue only the evidenced channel. The controller prepares the packet and exception queue. More than 30 weekly minutes on support/refunds for two consecutive weeks triggers paused acquisition or owner-approved cover. At an assumed €25/hour, two hours of weekly cover costs **€650 over 13 weeks**.

**5. What I could not verify**

- **Current agent health:** latest role completions, incident counts, alert delivery and live Netlify flags. Verify with aggregate heartbeat/incident reads, scheduled-function logs and a witnessed recovery exercise.
- **Current approval median:** extract ready/decision timestamps; do not use PR age as a proxy.
- **Support performance:** reconcile the supplied three tickets with Gmail, then calculate first-human-response times and refund turnaround.
- **Commercial release status:** inspect the owner’s gate evidence, store configuration, current deploy, CI and branch-protection settings.
- **Full contribution:** reconcile provider invoices, #221 usage coverage and channel spending.

The read-only Supabase call was rejected because it required approval while this session’s approval policy was “never.” These live operational measurements therefore remain unverified.

