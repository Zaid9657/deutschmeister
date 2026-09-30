# Agent team protocol (v2, 2026-09-29)

Every area agent in `.claude/agents/` follows this protocol. The agent's own file adds its
metrics, levers and boundaries. The team's shared memory is the private claude.ai artifact
**DeutschMeister Agent Team** (`https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD`), read and
written with the `ArtifactData` tool:

| Path | What it holds |
|---|---|
| `config/charter` | mission, north star, team goal, principles, autonomy, and per agent: `owns`, `goal`, `second`, `guardrails` |
| `config/rubric` | the versioned scoring rubric (v2): one measured number per area, fixed bands, weights, pass line 60 |
| `snapshots/<YYYY-MM-DD>` | the day's scored scorecard (written by the supervisor's first run of the day) |
| `agents/<key>` | the agent's memory: last run, pulse, goal status, open experiment, learnings, handoffs in, incidents, proposals, log |
| `roadmap/<id>` | the ordered work list (phase, owner agent, who acts, status) |

Charter keys and agent files: `revenue` (revenue-agent), `conversion` (conversion-agent),
`product` (product-agent, which absorbed activation), `acquisition` (acquisition-agent), `seo`
(seo-agent), `content` (content-agent), `retention` (retention-email-agent), `support`
(support-agent), `website` (website-agent), `webperf` (web-performance-agent), `security`
(security-agent), `supervisor` (supervisor). Verified pulse queries live in
`docs/agents/pulse.sql`.

## The daily run (every agent, every day)

1. **Read** `config/charter` (your block and the principles), your `agents/<key>` document,
   and every entry in its `handoffs_in` and `incidents_open`. Read `CLAUDE.md` once per run.
2. **Take incidents** for your area: open rows in `public.agent_incidents` where
   `owner_agent = <key>` (once the sentinel migration is applied), plus incidents the
   supervisor copied into your document. Acknowledge each in your log with what you did.
3. **Pulse.** Run your 3–5 queries from `docs/agents/pulse.sql` and compare each with its
   7-day average. Record `{metric, today, avg7, delta}` in `pulse`. Never estimate a number
   you could not measure; write `"not measured: <reason>"` instead. Page every list read
   past the 1,000-row API cap (use SQL `count(*)` or paged reads; a capped list undercounts
   without an error).
4. **React the same day** to anything abnormal (a pulse metric below 50% or above 200% of its
   7-day average with n ≥ 5, an open incident, a handoff older than 24 h). Put a line starting
   `URGENT:` at the top of `last_report` with the evidence and a ready-to-fire fix (the exact
   PR, query or owner click).
5. **Build approved work.** If the owner approved an experiment of yours (`experiment.status
   == "approved"`), build it as ONE draft PR from your own git worktree (never the shared
   checkout), run the gates in `.claude/skills/steward/SKILL.md`, and record the PR in
   `experiment`.
6. **Refresh goal progress**: re-measure `goal` and `second`, set `goal_status` to
   `on track`, `at risk` or `off track` with one line of evidence.
7. **Write** your `agents/<key>` document (pin `if_version` to the version you read): set
   `last_run` (ISO time), `status: "ok"` or `"blocked: <tool it stopped on>"`, `last_report`
   (≤ 8 lines, numbers with n), and append one line to `log` (keep the last 30).
   **A run that does not write this document did not happen**: the supervisor treats it as
   a stall.

## The deep day (one weekday per agent)

On your deep day, after the daily run:

1. Close your open experiment first: measure its metric, fill `after`, decide **keep** or
   **revert** with the numbers, and append the lesson to `learnings` (never repeated).
2. Diagnose your goal: write at least **three competing hypotheses** for why the number is
   where it is, each with the evidence for and against from this run's queries.
3. Propose **one** new experiment into `proposals`: hypothesis, change, metric, baseline,
   expected effect, judge date, cost in hours, and whether it hits a hard stop. The
   supervisor ranks proposals every Monday; the owner approves.

| Deep day | Agents |
|---|---|
| Monday | revenue, conversion |
| Tuesday | product |
| Wednesday | acquisition, seo |
| Thursday | retention, content |
| Friday | support, website |
| Saturday | webperf, security |

## Closing the loop

- An approved experiment is built as a draft PR (step 5). After it merges, the agent tracks
  the metric on each daily run and on the judge date keeps it or reverts it (a revert is a
  PR too), with the numbers in `learnings`.
- **Handoffs**: an agent that finds a problem in another area appends
  `{from, date, what, evidence}` to that agent's `handoffs_in` (use `update` pinned to the
  version you read). It never fixes another area's item. The supervisor chases handoffs
  untouched for 48 h.
- **Content requests** from customers (ticket tags `content-request:<topic>`) go to the
  product agent, which checks whether the topic exists and counts repeat requests in its
  memory.

## Autonomy

Agents act alone on everything reversible inside their area: measuring, incidents, handoffs,
roadmap updates, and draft PRs. Hard stops that stay with the owner: moving money (refunds,
prices, discounts, products), deleting customer data, security and auth settings, and
anything irreversible. Merging to main, applying migrations, sending customer email from a
new automation and flipping a production kill switch happen only for the action classes the
owner has authorized in chat. When the safety guard blocks an action, stop, record
`blocked: <action>` and tell the owner; never route around it.

## Hard limits (all agents)

- Never print, log or commit a credential; never search files for one. Credentials live only
  in environment variables the owner sets.
- Never skip, disable or loosen a test to get green. Never commit
  `astro-site/package-lock.json` unless the change is a deliberate dependency update.
- Never advance a `Stand:` stamp on `/vergleich/`. Prices and claims come only from
  `src/data/pricing.js` and `src/data/marketing.js`.
- Never claim a number you did not measure in this run. Call small numbers small.
