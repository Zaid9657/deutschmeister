# DeutschMeister agent team — one page

**Where it lives:** the private artifact **DeutschMeister Agent Team**
(<https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD>) holds the charter, rubric, daily snapshots,
each agent's memory and the roadmap. The rules every agent follows are in
`docs/agents/PROTOCOL.md`; verified daily queries are in `docs/agents/pulse.sql`.

**North star:** revenue last 30 days, €32.97 on 2026-09-29 (3 paying customers). Proposed target
€500 and 25 paying customers by 2026-12-31. **Team goal:** scorecard 29 → 60 (pass line) by
2026-12-31.

## Three layers

| Layer | Runs where | When | What |
|---|---|---|---|
| 1. Production | Netlify scheduled functions (run with the owner's PC off) | sentinel hourly; support agent every 5 min | detect and act on live problems |
| 2. Area agents | Routines that wake the orchestrating Claude Code session (it holds the Supabase, Resend, Netlify and GitHub connectors) | daily, 06:10–07:50 UTC, staggered | pulse, react, build approved work, goal progress; one deep day a week |
| 3. Supervisor | same | 05:50, 09:50, 12:50, 15:50, 19:50 UTC | snapshot, ran-and-reported check, goals, incidents, handoffs, Monday top 3 |

A routine created from a fresh session cannot carry connectors on this account (measured
2026-09-29: the probe routine had only the artifact tools, and the site was blocked). So layers 2
and 3 wake the orchestrating session instead. If that session is ever archived, re-create the
routines from a session that holds the connectors (`docs/scorecard-routine.md`).

## Each agent — daily job, what it may do alone, when it notifies

| Agent | Owns (short) | Daily pulse | Deep day |
|---|---|---|---|
| revenue | Lemon Squeezy, entitlements, dunning, course products, launches | payments, failures, webhook backlog, 30-day revenue | Mon |
| conversion | /pricing/, paywalls, trial → paid, signup → checkout | new subs, paid courses, trials ended, per-100 rate | Mon |
| product | first session, A1.1 course, every learning tool, content requests | course learners, speaking (zero-turn), exams, X-Ray, Aug cohort | Tue |
| acquisition | homepage, signup/login, attribution, landing pages | signups vs 7-day avg, sources | Wed |
| seo | grammar, Leitfäden, Vergleich, Prüfung, courses pages, sitemaps, llms.txt | landing pages of attributed signups (GSC not yet) | Wed |
| retention | every mailer, lifecycle ledger, deliverability, win-back | lifecycle sends, opt-outs, bounces (Resend) | Thu |
| content | social channels, daily-sentence content, podcast feed, FAQ/About copy | posts per 7 d (0: no accounts yet) | Thu |
| support | /support, tickets, SLA, the production support agent | open, new, past SLA | Fri |
| website | all routes, redirects, builds, deploys, CI, sentinel, legal-page presence | incidents, deploy state, CI | Fri |
| webperf | bundles, fonts, Lighthouse, CLS | merges touching the bundle; weekly Lighthouse | Sat |
| security | advisors, RLS, grants, dependencies, secrets hygiene | advisors, CI | Sat |
| supervisor | the team itself | ran/reported, goals, incidents, handoffs | Mon ranking |

**Every agent may do alone:** measure; open incidents and handoffs; update its memory and the
roadmap; build approved experiments as draft PRs from its own worktree; reversible fixes inside
its own area as PRs.

**Only the owner:** refunds, prices, discounts and products; deleting customer data; security and
auth settings; anything irreversible. **Only after the owner authorizes the action class in
chat:** merging to main, applying migrations, customer email from a new automation, and turning
on a production kill switch.

**The owner is notified when:** a line starts with `URGENT:` in an agent's report (same day, with
a ready fix); the sentinel claims a new incident not already mailed elsewhere (one digest mail);
the support agent does not answer, a send fails, a customer replies again or asks for content that
does not exist; and every Monday, the supervisor's top 3 and "your actions".
