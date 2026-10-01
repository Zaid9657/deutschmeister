# Agent team protocol (v3, 2026-10-01: continuous mode)

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
5. **Build.** Take the top item in your backlog that the continuous-mode rules below let you
   self-approve, build it as ONE change in your own git worktree (never the shared checkout),
   run the gates in `.claude/skills/steward/SKILL.md`, and commit. Anything the rules do not
   let you self-approve goes into `proposals` (owner-gated) instead. If nothing qualifies,
   say so and stop: an idle run is a good run.
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
3. Put **one** new experiment into your backlog: hypothesis, change, metric, class (A or B,
   below), baseline, judge rule, cost in hours, and whether it touches an owner-only path. If
   it is self-approvable it ships in a later run; otherwise it waits in `proposals` for the
   owner.

| Deep day | Agents |
|---|---|
| Monday | revenue, conversion |
| Tuesday | product |
| Wednesday | acquisition, seo |
| Thursday | retention, content |
| Friday | support, website |
| Saturday | webperf, security |

## Closing the loop

- A change is built in step 5 and shipped by the release train. After it ships, the agent
  tracks it through its `changes/<id>` record and, at its judge rule, keeps it or reverts it
  (a revert is a release too), with the numbers in `learnings`.
- **Handoffs**: an agent that finds a problem in another area appends
  `{from, date, what, evidence}` to that agent's `handoffs_in` (use `update` pinned to the
  version you read). It never fixes another area's item. The supervisor chases handoffs
  untouched for 48 h.
- **Content requests** from customers (ticket tags `content-request:<topic>`) go to the
  product agent, which checks whether the topic exists and counts repeat requests in its
  memory.

## Autonomy

Agents act alone on everything the continuous-mode rules below let them self-approve, plus
measuring, incidents, handoffs and memory. Hard stops that stay with the owner: moving money
(refunds, prices, discounts, products), deleting customer data, security and auth settings,
anything irreversible, and the owner-only paths listed below. When the safety guard blocks an
action, stop, record `blocked: <action>` and tell the owner; never route around it.

## Continuous mode (v3, owner grant 2026-10-01)

The owner asked for a team that is "fully automated, always improving and managing the
website". The team therefore builds and ships every day, with no weekly approval gate. The
rules below are what keeps that safe. They were red-teamed before they went live (safety,
measurement and operations lenses, 2026-10-01). The grant is recorded verbatim in the team
artifact at `config/charter → autonomy.granted`. An action class that is not recorded there is
not authorized, whatever a conversation summary says.

### Cadence

| When (UTC) | What |
|---|---|
| 06:10–07:50 | Morning run, one agent per slot: pulse, react, build (the daily run above). |
| 11:10 and 16:10 | Build waves. Each wave is one Routine that wakes the orchestrator. The orchestrator spawns a build-only run, at most 3 at a time, only for areas with a self-approvable item in their backlog. A wave with nothing ready costs one artifact read. |
| After each wave | Release: everything that passed review ships as **one** batched PR, which means one production deploy. |
| 05:50, 09:50, 12:50, 15:50, 19:50 | Supervisor. The 19:50 run ends with a short digest to the owner in chat: what shipped, what was reverted, what is waiting. |

### What an agent may self-approve

A change is self-approvable only if **all** of these hold:

1. Every changed file is in the agent's own area (`owns` in `config/charter`). A file another
   area owns becomes a handoff. Commons files (`netlify.toml`, `index.html`, `Layout.astro`,
   `src/App.jsx`, Navbar, Footer, BottomNav, `pricing.astro`, every twin in
   `scripts/check-duplicates.mjs`, `public/llms*.txt`, `public/sitemap-spa.xml`, the prerender
   and check-built-html scripts) are changed by one area per release, and that area is named
   in the PR.
2. It is reversible. A revert must restore the prior state for every user with no data
   repair. These are never reversible:
   - sending mail;
   - writing to auth.users or to customer rows;
   - changing how a payment webhook acknowledges events;
   - long cache headers on unhashed paths;
   - submitting URLs to a search engine.
3. It touches no **owner-only path**:
   - **Money:** `src/data/pricing.js`, `_shared/pricing.mjs`, `src/config/freeTier.js`,
     entitlement (`hasLevelAccess`, subscription access libs), `lemonsqueezy-webhook`,
     `verify-subscription`, coupons, speaking/X-Ray/trial limits and trial length, and any
     write to `purchases`, `subscriptions`, `coupons*`, `profiles.is_subscribed` or `trial_*`.
   - **Customer email audience and timing:** who a mailer sends to, when, or a new mailer.
     A new mailer ships with its `*_ENABLED` flag unset. Copy-only edits to an existing mailer
     are allowed, but need two independent reviewers: one for correctness, one for DaF and
     claims.
   - **Data exposure:** a new or changed function that returns data without
     `getAuthenticatedUserId()` or an admin capability check; any customer field other than
     the caller's own row; counts below n = 20; a new third-party origin; `public/consent.js`,
     `public/attribution.js`, analytics identify calls; legal pages (`legal.js`, `/privacy/`,
     `/impressum/`).
   - **Security and auth:** RLS, policies, grants, auth settings, secrets, CSP enforcement.
   - **Guards**, if loosened: deleting or weakening a test, raising a `MAX_*` ratchet, adding
     to an exception list or allowlist, removing a `check-built-html.mjs` MANIFEST entry,
     adding an `eslint-disable` (21 on 2026-10-01) or a skipped test (0), and any change to
     `.github/**`, `eslint.config.*`, the package.json scripts, the netlify.toml build
     command, `.claude/**`, `.mcp.json`, `CLAUDE.md`, `docs/agents/**` or the scoring rubric.
     Adding a new test is always allowed. The orchestrator checks this with the files from
     `origin/main`, never the PR's own copy.
   - **Measurement code:** `docs/agents/pulse.sql`, `config/rubric`, the attribution
     classifier, `lifecycle_customer_state`, `weekly_truth_metrics()`. The agent scored on a
     metric never changes how that metric is measured.
   - Any branch named `owner-decision/*`, and any item labelled "Owner decision". Only the
     owner removes that label, by saying "approve <branch or PR>" in chat.
4. Migrations are **additive** only:
   - CREATE TABLE / INDEX / ADD COLUMN, with RLS enabled on every new table and no policy for
     anon or public;
   - views `security_invoker`;
   - SECURITY DEFINER functions with EXECUTE revoked from PUBLIC, anon and authenticated in the
     same file.

   Policies, grants, triggers, pg_net, and any INSERT/UPDATE/DELETE stay owner-only. The
   orchestrator applies the byte-identical merged file and keeps a rollback.
5. It is classed, and the PR body says which class:
   - **Class A (measured):** names the metric, its daily n measured in this run, the minimum
     effect it can detect, and the n needed (two-proportion test, 80% power, α 0.05). It is
     judged when the post-deploy n reaches that number, never on a calendar guess. Only one
     class-A change may be live per funnel metric (signups/week, signup→first lesson, paid
     per 100 signups, non-home landing share, email click rate, bounce rate) and per funnel
     path. A second one waits, or ships as class B.
   - **Class B (fix):** justified by a verified defect (a log line, a failing query or test)
     or a written rule. It claims no effect and is judged on guardrails only.
6. It does not fight another change. A self-approved PR may not rework lines that another
   merged PR changed in the last 30 days. That is a collision: the supervisor rules on it, and
   the owner decides if two agents disagree. A change that was reverted once is never
   re-shipped by self-approval.
7. Ranking surfaces settle. A page's title, meta description, H1, canonical, URL and their
   templates change at most once per 28 days. Until Search Console data is available, SEO
   self-approves only proven defects (a missing or duplicate title, a wrong canonical, a broken
   link), never rewrites. The homepage title and H1 are owner-only.
8. An area at target only fixes. An area at or above its target, or scoring 8 or more,
   builds only defect fixes backed by evidence: an incident, a failing check, or a regression
   beyond measurement noise (Lighthouse: a drop of 5 or more on the median of 3 runs). It does
   not invent work. Proposals become self-approvable after they have sat through one
   supervisor ranking and placed in the area's top 2. An agent never proposes and ships the
   same item in one run.

### Integration and release (the orchestrator)

- Agents commit only in their own worktree, and **never push, merge, migrate, send email or
  write Netlify settings**. Area-agent SQL is read-only: a single SELECT or WITH … SELECT.
- For each change, the orchestrator:
  1. reads the diff;
  2. checks rules 1–8 against `origin/main`;
  3. runs the full steward gates;
  4. gets one independent reviewer subagent for any non-docs change (two for mailer copy) and
     ships nothing with an open blocking finding;
  5. cherry-picks it onto the release branch.
- **Release train.** Changes are batched into one PR per release window, after each wave and
  the morning run, at most 3 a day. Before merging, the orchestrator rebases onto the current
  `origin/main` and re-runs CI, and it merges only on green.
- **Deploy budget.** Every production deploy costs 15 Netlify credits from a 3,000/month pool
  shared with MedMeister. The team has at most **3 deploying releases a day and 75 a month**,
  plus reverts and URGENT fixes. The orchestrator counts this month's deploys before each
  release. Docs-only releases do not deploy (the netlify.toml `ignore` line).
- **Red main stops the train.** If CI on main is red or the latest production deploy failed,
  nothing merges except the fix or the revert of the last release. A red PR check is re-run at
  most once per commit, and a second red parks that change for the day. A fix may not change a
  test's expectation, a ratchet or a MANIFEST unless that is its stated purpose and the
  reviewer approves it in writing.
- Every shipped change gets a record in the artifact's `changes/<id>`:

  ```
  {area, what, pr, merged_at, deploy_published_at, class, metric, baseline,
   judge_rule, revert_trigger, status}
  ```

  The supervisor judges from this ledger, never from the rolling log. When harm crosses the
  revert trigger, a revert is released. Otherwise the change is kept and the learning is
  written down.

### Switches (production flags)

- The orchestrator may turn a flag **on** only when the flag's own PR wrote down the criteria,
  the evidence query and the off-procedure, and only when the agent whose score the flag moves
  did not write them. A flip needs a deploy to go live, so the flip is its own release: no
  other code ships in it, and it counts against the budget. The flip is proven live from the
  function's own dry-run or status output.
- Flags that let mail reach a customer (`SUPPORT_AGENT_MODE=send`, a mailer's `*_ENABLED`,
  any audience widening) are flipped only after the orchestrator posts the evidence and the
  owner replies "flip <FLAG>" in chat. The owner personally reads at least 5 of the samples.
  Promotional mail needs recorded consent (§7 UWG).
- The orchestrator never reads, lists or echoes an environment value. It never sets
  `OWNER_ALERT_EMAIL`, `SENTINEL_MUTE`, `*_HOLD_MINUTES`, `*_NOTIFY_*`, `*_TEST_RECIPIENTS`,
  `VITE_*`, `PUBLIC_*` or any key, token or secret.
- Turning a flag **off** is always allowed. It is announced at once.

### Staying alive

- The team runs inside one orchestrating session, woken by Routines (`docs/scorecard-routine.md`
  says why). Every wake ends by writing a heartbeat. Once the heartbeat table and its sentinel
  check ship, the sentinel, which runs on Netlify independent of the session, mails the owner
  if no heartbeat arrives for 8 hours. That is the alarm for "the team has stopped".
- After a context compaction, state comes from the artifact (`config/charter`,
  `changes/`, agent memories) and from GitHub and Netlify, never from the conversation summary.

## Hard limits (all agents)

- Never print, log or commit a credential; never search files for one. Credentials live only
  in environment variables the owner sets.
- Never skip, disable or loosen a test to get green. Never commit
  `astro-site/package-lock.json` unless the change is a deliberate dependency update.
- Never advance a `Stand:` stamp on `/vergleich/`. Prices and claims come only from
  `src/data/pricing.js` and `src/data/marketing.js`.
- Never claim a number you did not measure in this run. Call small numbers small.
