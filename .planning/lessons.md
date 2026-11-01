# Lessons (newest first)

*Mirrors the Lessons section of the Notion board "DeutschMeister — Shared Board". Add a row in the
same step as the board. Older rows were distilled on 2026-10-31 from the million plan, the team
artifact (`agents/*`) and the 30-day sales read.*

| Date | What happened | The rule we keep |
|---|---|---|
| 2026-11-01 | Claude kept sending the founder PR, CI and notification details while he wanted the big picture. Founder: "I will not allow you to make me drown in details; big picture first, details are important but they have their time" | Every message starts with where we stand against the goal and the one choice; details are handled and reported in one line, or not at all |
| 2026-11-01 | Codex was not available in a fresh session: no CLI and no OpenAI login in the environment. The 10-26 login lived in another container | Codex needs `npm i -g @openai/codex` plus the founder's one-time ChatGPT device login (`codex login --device-auth`) in each new container; ask for it at the start, while preparing the evidence pack |
| 2026-11-01 | Codex review: the exam offer page shows €89 and "startet in Kürze" while €149 is approved and the offer is off sale, makes an unsupported failure claim, speaks *du*, and the telc writing task has 3 Leitpunkte where the exam has 4 | Check every sales page against the live product, the approved price and the exam format before driving traffic to it; at ~2 signups a day, copy fixes are worth €10–20 a month, so the money is in opening the sale and bringing buyers |
| 2026-11-01 | All four v5 role sessions (controller, sales, distribution, fulfilment) stalled on a "claude-artifacts — Db Write" permission prompt. No role run has finished since 2026-10-30, team memory stopped updating, and the 14-day canary will show missed cycles | In the daily canary, read each role session's status (blocked / needs input), not only heartbeats: a start without an end means a stuck prompt, and the fix is a standing permission, not a retry |
| 2026-11-01 | Founder: "you merge". GitHub refused to re-run #237's stale checks from this session (403), so its fix sat unmerged and kept main red | To re-trigger stale CI, port the existing fix into a PR that can push (or push a real change); never wait on a re-run this integration cannot start |
| 2026-10-31 | Founder set the deadline: $1M a month by February 2027, four months out, from about $68 a month today | Plan against the deadline every week (≈ €220k a week in February); size the levers that can sell in bulk first |
| 2026-10-31 | The north star in the plan and charter was $1M a **year** (≈ €73k a month). Founder: $1M a **month**. The plan's best evidenced case (the Germany exam package, aggressive) is ≈ $103k a month, about a tenth of it | Every task names the sales number it moves. One segment cannot carry the goal: size B2B seats and abroad with evidence before building more for Germany |
| 2026-10-31 | The task said `config/charter`; there is no such repo path. The charter lives in the private team artifact "DeutschMeister Agent Team" (ArtifactData path `config/charter`) | Read and write the charter through the artifact; repo docs only point to it |
| 2026-10-31 | 30-day sales: €64.46 gross (2 Pro renewals + 1 A1.2 course), 0 new subscriptions since 2026-08-27, 0 exam packages ever, 6 failed payments | Count sales from `webhook_logs` (test mode excluded) and `purchases`; never from signups or traffic |
| 2026-10-30 | Distribution and fulfilment idled 3–4 days: every ready item waited on owner answers (7 open asks across roles) | Owner asks are the bottleneck: send one decision per message, the highest-money one first |
| 2026-10-28 | GitHub Actions has been billing-locked since 2026-10-27; no PR can merge on green CI | Check CI and billing at the start of a run before planning a merge |
| 2026-10-28 | The Lemon Squeezy key reaches the MedMeister store too; the fee report first mixed both stores | Filter every Lemon Squeezy read by the DeutschMeister store id (309512) |
| 2026-10-26 | Lemon Squeezy webhooks and API expose no fee per sale | Contribution per sale needs the owner's payout export; never infer a fee tariff |
| 2026-10-26 | The fulfilment support desk's Gmail inbox receives no deutsch-meister.de mail | Verify a data source exists before reading it or reporting zero |
| 2026-10-19 | 64 agent changes, 0 recorded commercial improvement; the agent loop died when its session was deleted | Judge every change by sales, not activity; a loop must survive losing its session |
| 2026-10-19 | Social packs on our own accounts brought 0 attributed signups ever; signups fell 181 → 83 in 30 days | No new social packs; distribution through partners, exam pages and buyers with a booked exam |
| 2026-10-07 | 9 of 12 payers ever paid 20–129 days after their trial ended | Put offers where learners are after the trial, not only inside it |
| 2026-10-07 | September Search Console: 808 clicks, at least 67% brand searches | Exam-intent traffic must be earned with non-brand pages and partners; brand search says nothing about reach |
