# DeutschMeister agent team — one page

**Where it lives:** the private artifact **DeutschMeister Agent Team**
(<https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD>) holds the charter (with the shared
`team_playbook` and `judging_v4`), rubric, daily snapshots, each agent's memory and playbook,
the changes ledger and the roadmap. The rules every agent follows are in
`docs/agents/PROTOCOL.md` (v4, 2026-10-04); verified daily queries are in
`docs/agents/pulse.sql`.

**North star:** revenue last 30 days, €32.97 on 2026-09-29 (3 paying customers). Proposed target
€500 and 25 paying customers by 2026-12-31. **Team goal:** scorecard 29 → 60 (pass line) by
2026-12-31. Revenue and acquisition, not product quality, are the bottleneck, so v4 points every
run at money: each change states its expected € (or signups) effect, and the owner's pending
decisions are priced in €/week.

## Three layers

| Layer | Runs where | When | What |
|---|---|---|---|
| 1. Production | Netlify scheduled functions (run with the owner's PC off) | sentinel hourly; support agent every 5 min (draft mode; `send` is owner-only) | detect and act on live problems |
| 2. Area agents | Routines that wake the orchestrating Claude Code session (it holds the Supabase, Resend, Netlify, Gmail and GitHub connectors) | morning runs 06:10–07:50 UTC, acquisition again at 13:10, the support desk at 07:10/12:30/18:30, weekly agents on their day; build waves 11:10 and 16:10 UTC | pulse, react, and build one change per run in a worktree; the orchestrator reviews and releases |
| 3. Supervisor | same | 05:50, 09:50, 12:50, 15:50, 19:50 UTC | snapshot, ran-and-reported check, goals, incidents, handoffs, change judging; Monday Curator pass and top 3 |

A routine created from a fresh session cannot carry connectors on this account (measured
2026-09-29: the probe routine had only the artifact tools, and the site was blocked). So layers 2
and 3 wake the orchestrating session instead. If that session is ever archived, re-create the
routines from a session that holds the connectors (`docs/scorecard-routine.md`).

## The learning loop (v4)

Each agent keeps a **playbook** in its memory: up to 15 one-sentence rules with `helpful` and
`harmful` counters, distilled from its learnings (the ACE pattern, PROTOCOL v4.1). A run starts
by listing the rule ids it will apply and ends by logging the ids it used and proposing playbook
edits. Every Monday the supervisor (the Curator) updates the counters from outcomes, prunes rules
that hurt, merges duplicates and promotes rules two agents share into the charter's
`team_playbook`. Every change carries an `expected_effect`; the two most accurate estimators get
an extra build slot that week, and small-n changes are judged at 14 days on a leading indicator
(class L, PROTOCOL v4.3).

## Each agent — metric, cadence, deep day

Target schedule (UTC). The orchestrator applies it to the Routines.

| Agent | Owns (short) | v4 metric | Cadence | Deep day |
|---|---|---|---|---|
| revenue | Lemon Squeezy, entitlements, dunning, course products, launches | revenue last 30 d + new payers; keeps `owner_queue` (€/week per owner decision) | daily 06:10 | Mon |
| conversion | /pricing/, paywalls, trial → paid, signup → checkout | new paying per 100 signups (30 d), reported jointly with revenue | daily 06:20 | Mon |
| product | first session, A1.1 course, every learning tool, content requests | signup → first lesson, last full-month cohort | daily 06:30 | Tue |
| acquisition | homepage, signup/login, attribution, landing pages; **SEO work until Search Console is verified** | signups/week (30-day average) | twice daily 06:10 + 13:10 | Wed |
| seo | grammar, Leitfäden, Vergleich, Prüfung, courses pages, sitemaps, llms.txt | non-home landing share (measured weekly; builds go through acquisition) | weekly, Wed 06:50 | Wed |
| content | social channels, daily-sentence content, podcast feed, FAQ/About copy | signups attributed to social (IG, FB, YT, Telegram, TikTok) per 7 d; posts per 7 d secondary | daily 07:00 | Thu |
| retention | every mailer, lifecycle ledger, deliverability, win-back | reactivated learners/week (activity after ≥ 14 idle days) + offer-email clicks; bounce rate is a guardrail | daily 07:10 | Thu |
| support | the Gmail support desk, /support, tickets, the production support agent | customer threads/day, hours to first draft, drafts sent unchanged, escalations (`agents/support.desk`) | desk 3× daily 07:10, 12:30, 18:30 (drafts only) | Fri |
| website | all routes, redirects, builds, deploys, CI, sentinel, legal-page presence | sentinel key-page checks passing (unchanged) | weekly, Mon 07:30, fix-only | Mon |
| webperf | bundles, fonts, Lighthouse, CLS | mobile Lighthouse median of 7 pages (unchanged) | weekly, Wed 07:40, fix-only | Wed |
| security | advisors, RLS, grants, dependencies, secrets hygiene | advisor ERROR + WARN findings (unchanged) | weekly, Fri 07:50, fix-only | Fri |
| supervisor | the team itself, the playbooks, the changes ledger | ran/reported, goals on track, estimator accuracy | 5× daily | Mon (Curator, ranking) |

Where a v4 metric differs from `config/rubric` (content, retention, support), the agent reports
both until the rubric bands for the v4 metric are approved. The supervisor's daily snapshot
measures every area every day, including the weekly ones; a critical or high incident in its
area (for website also a red `main` or a failed deploy, for security a new advisor ERROR) wakes a
weekly agent off-cycle (PROTOCOL v4.4).

**Continuous mode (owner grant 2026-10-01).** Every agent builds and ships improvements inside
its own area, with no weekly approval gate. Each run builds at most one change in its own
worktree; the orchestrator reviews each change, batches what passes into at most 3 releases a day
(the deploy budget), merges on green CI, and logs each change with its `expected_effect` for its
judge date. The rules are in `docs/agents/PROTOCOL.md` § Continuous mode and v4.

**Only the owner:** refunds, prices, discounts and products; deleting customer data; security and
auth settings; anything irreversible; sending mail (including every support-desk draft); and the
owner-only paths in the protocol (money and entitlement code, who a mailer emails and when, data
exposure, loosened guards, measurement code). A flag that lets mail reach customers is turned on
only after the owner says "flip <FLAG>".

**The owner is notified when:** a line starts with `URGENT:` in an agent's report (same day, with
a ready fix); the sentinel claims a new incident not already mailed elsewhere (one digest mail);
the support desk labels a thread `AI/needs-owner` or has drafts waiting; and every Monday, the
supervisor's top 3 with the "€/week waiting" for each owner decision, and "your actions".
