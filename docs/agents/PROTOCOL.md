# Agent team protocol (v4, 2026-10-04: playbooks, expected effects, revenue focus)

Every area agent in `.claude/agents/` follows this protocol. The agent's own file adds its
metrics, levers and boundaries. The team's shared memory is the private claude.ai artifact
**DeutschMeister Agent Team** (`https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD`), read and
written with the `ArtifactData` tool:

| Path | What it holds |
|---|---|
| `config/charter` | mission, north star, team goal, principles, autonomy, and per agent: `owns`, `goal`, `second`, `guardrails`; since v4 also `team_playbook` (rules shared by ≥ 2 agents) and `judging_v4` (classes, keep/revert rule, estimator scoring, target cadence) |
| `config/rubric` | the versioned scoring rubric (v2.1): one measured number per area, fixed bands, weights, pass line 60 |
| `snapshots/<YYYY-MM-DD>` | the day's scored scorecard (written by the supervisor's first run of the day) |
| `agents/<key>` | the agent's memory: last run, pulse, goal status, open experiment, learnings, handoffs in, incidents, proposals, log; since v4 also `playbook`, `playbook_proposals`, and for revenue `owner_queue`, for support `desk` |
| `changes/<id>` | one record per shipped change (the ledger the supervisor judges from); since v4 it must carry `expected_effect` |
| `roadmap/<id>` | the ordered work list (phase, owner agent, who acts, status) |

Charter keys and agent files: `revenue` (revenue-agent), `conversion` (conversion-agent),
`product` (product-agent, which absorbed activation), `acquisition` (acquisition-agent), `seo`
(seo-agent), `content` (content-agent), `retention` (retention-email-agent), `support`
(support-agent), `website` (website-agent), `webperf` (web-performance-agent), `security`
(security-agent), `supervisor` (supervisor). Verified pulse queries live in
`docs/agents/pulse.sql`.

## v4 (owner-approved plan, 2026-10-04)

v4 amends v3. Where they disagree, v4 wins. The v3 text below stays in force wherever v4 does
not change it, and is kept as history. Two aims: make the team's learning loop real, and point
every run at revenue. The learning loop follows the "playbook" pattern of *Agentic Context
Engineering* (ACE, arXiv, ICLR 2026): itemized rules with helpful/harmful counters, a
Generator → Reflector → Curator cycle, a deterministic merge, and pruning of rules that hurt.

**What a run is, in v4.** A run builds at most ONE change, in the agent's own git worktree, and
commits it there. It never pushes, merges, migrates, sends email or writes Netlify settings.
The orchestrator reviews every change, releases what passes (PROTOCOL v3 § Integration and
release) and holds the rest. Older agent files that say "one move per run, never merge" mean
the same thing.

### v4.1 The playbook

- **Where.** Each area agent has `agents/<key>.playbook`: at most 15 rules, each
  `{id: "<key>-NN", rule: "<one imperative sentence>", helpful, harmful, source}`. Rules shared
  by two or more agents live once in `config/charter.team_playbook` (same shape, ids `team-NN`).
  `learnings` stay as the narrative record; the playbook is the distilled, countable form. The
  first playbooks (2026-10-04) were distilled from each agent's `learnings` and log, counters 0.
- **Generator (start of every run).** Read your `playbook`; list the rule ids you will apply.
  Read `config/charter.team_playbook` too. Write the list into `last_report`.
- **Reflector (end of every run).** Log the ids you used (the `log` line carries
  `rules: <id>, <id>`) and copy them into the change record (`changes/<id>.playbook_ids`).
  Propose ADD/UPDATE/REMOVE playbook edits in `playbook_proposals`, each
  `{op, id (UPDATE/REMOVE), rule (ADD/UPDATE), evidence, date}`. Never edit counters yourself,
  and never write `playbook` directly.
- **Curator (supervisor only, Monday's first run).** Only the supervisor writes `playbook`,
  the counters and `team_playbook`. In this fixed order:
  1. **Counters** from outcomes since the last Curator pass. For each judged change, every rule
     id in its `playbook_ids`: kept and the leading indicator moved in the expected direction
     (class L/A), or kept with guardrails held (class B) → `helpful + 1`; reverted, or a
     guardrail breach → `harmful + 1`; not yet judged → nothing. For support desk drafts: sent
     unchanged → `helpful + 1` on the rule ids that pass used; discarded → `harmful + 1`; edited
     → nothing.
  2. **Prune** every rule with `harmful ≥ 2` and `harmful > helpful` (move it to
     `playbook_pruned` with the date and counts; never silently delete).
  3. **Merge duplicates** inside one playbook: keep the lower id, sum both counters, name the
     merged id in `source`.
  4. **Promote** a rule that two or more agents hold in substance to `team_playbook`
     (counters summed, origin ids in `source`) and remove it from those playbooks.
  5. **Apply `playbook_proposals`** in order (agent key, then date, then position): ADD gets the
     next free id with counters 0 unless it duplicates a rule (then it is a merge); UPDATE keeps
     the counters when the meaning is unchanged and resets them to 0 when it changes; REMOVE
     applies only with evidence that the rule is wrong or with `harmful ≥ helpful`. Over 15
     rules, drop the lowest `helpful − harmful`, oldest first. Move each processed proposal to
     `playbook_proposals_done` with its verdict.
- **Into the prompts (monthly).** On the first Monday of a month the supervisor asks the
  orchestrator for one PR proposal that moves the top 3 `team_playbook` rules (highest
  `helpful − harmful`, `helpful ≥ 3`) into prompt text (`.claude/agents/*.md` or this file). It
  lives on an `owner-decision/playbook-<YYYY-MM>` branch, because `.claude/**` and
  `docs/agents/**` are owner-only paths (v3 rule 3).

### v4.2 Every change states its expected effect

No change is released without `changes/<id>.expected_effect`, written by the agent that built
it:

```
expected_effect: {
  metric, direction: "up" | "down",
  baseline: {value, n, window},                 // measured in this run
  eur_per_month: [low, high]  or  signups_per_week: [low, high],
  leading_indicator: {metric, baseline, expected, judge_at},   // judge_at = deploy + 14 d
  guardrail                                      // what is reverted on, and the threshold
}
```

A range is an honest estimate, and 0 is a legitimate low end. A class B fix states its range
(often `[0, x]`) and the reason it can move money at all. The building agent's `last_report`
names the same numbers.

### v4.3 Small-n judging: class L

- **Class A** (v3 rule 5) stays, but at about 2–3 signups a day almost no funnel metric reaches
  the n a powered test needs within a quarter. Expect few.
- **Class B** (fix) is unchanged: judged on guardrails only.
- **Class L (leading indicator)** is the default for changes that claim an effect. The change
  names a 14-day leading indicator that is measurable at current volume (clicks on the new
  CTA, checkout starts from a door, stage reach in the lesson player, desk drafts sent
  unchanged). It is judged at `deploy_published_at + 14 days` on that indicator, plus the €
  effect re-estimated from the actual indicator.
- **Keep or revert:** revert only on a guardrail breach (the change's `revert_trigger`). A
  missed leading indicator is recorded, not reverted. Two live class-L changes may not share a
  leading indicator; the second waits.
- **Record:** at the judge date write `changes/<id>.actual` =
  `{leading_indicator, metric_delta, eur_per_month, judged_at, verdict}`. Actual against
  expected is what the supervisor's estimator score uses: each Monday it scores each agent's
  `expected_effect` accuracy over its judged changes (the share whose actual indicator fell in
  the stated range; ties go to the smaller € error; at least 2 judged changes to rank). The top
  2 estimators get one extra build slot that week.

### v4.4 Cadence (target schedule; the orchestrator applies it to the Routines)

| UTC | Who | What |
|---|---|---|
| 05:50, 09:50, 12:50, 15:50, 19:50 daily | supervisor | as v3; Monday's first run adds the Curator pass and the estimator score |
| 06:10 and 13:10 daily | acquisition | daily run twice a day; it also does SEO work (below) |
| 06:10 daily | revenue | daily run; maintains `owner_queue` |
| 06:20 daily | conversion | daily run; reports jointly with revenue |
| 06:30 daily | product | daily run |
| 07:00 daily | content | daily run |
| 07:10 daily | retention | daily run |
| 07:10, 12:30, 18:30 daily | support desk | Gmail drafts and labels only (v4.5); sending is owner-only |
| Monday 07:30 | website | weekly, fix-only |
| Wednesday 06:50 | seo | weekly measurement and diagnosis only |
| Wednesday 07:40 | webperf | weekly, fix-only (Lighthouse on the 7 tracked pages) |
| Friday 07:50 | security | weekly, fix-only |
| 11:10 and 16:10 daily | build waves | as v3 (at most 3 build-only runs, one batched release) |

- **SEO folds into acquisition** until Search Console is verified and readable from this
  environment. Acquisition builds SEO changes inside the seo area's `owns` (rule 1 counts them
  as its own) and v3 rule 7 still holds (proven defects only, never rewrites). The seo agent
  runs only on its weekly deep day to measure, diagnose and hand builds to acquisition.
- **Weekly fix-only agents** (website, webperf, security) have one slot each, and that run is
  also their deep day. They build only defect fixes backed by evidence (v3 rule 8), whatever
  their score. The supervisor's daily snapshot still measures their numbers every day, and a
  critical or high incident in their area (for website also a red `main` or a failed deploy;
  for security a new advisor ERROR) makes the supervisor ask the orchestrator for an off-cycle
  run.
- **Deep days in v4:** Monday revenue, conversion, website; Tuesday product; Wednesday
  acquisition, seo, webperf; Thursday retention, content; Friday support (the 07:10 desk run),
  security. This replaces the v3 deep-day table below.

### v4.5 The support desk (Gmail)

- **Where.** The shared Google Workspace inbox that the DeutschMeister contact addresses
  forward to (`config/charter.owner_contacts`). MedMeister mail lands there too.
- **What a desk run does.** Read new threads since the last pass through the Gmail connector.
  Label each customer thread by brand, `AI/DM` or `AI/MM`. Where verified facts answer it,
  create a **draft** reply and label the thread `AI/drafted`. When the thread matches an
  escalation reason, label it `AI/needs-owner` and write no reply draft.
- **Escalation list:** identical to `ESCALATION_REASONS` in
  `netlify/functions/_shared/supportAgentLib.mjs`: `legal-complaint`, `abuse`,
  `billing-dispute`, `refund`, `deletion`, `cancellation`, `needs-human`. Use the same patterns
  (`classifyEscalation`); when in doubt, `needs-human`. The lib is the single source: when it
  changes, the desk follows it.
- **Drafts** use verified facts only (`pricing.js`, `marketing.js`, the support catalogue), the
  team signature and the AI disclosure, and German replies speak Sie.
- **Never send.** No `send_message`, no reply, no forward, no trash or spam marking, and never
  delete or overwrite a draft the owner has edited. Sending is owner-only.
- **Counts only into the artifact** (`agents/support.desk`): threads scanned, customer
  threads, DM vs MM, drafted, escalated by reason, median hours to first draft, and drafts sent
  unchanged, edited or discarded. Never an address, a name or message text.

### v4.6 Metrics and revenue focus

| Area | v4 operating metric | Notes |
|---|---|---|
| acquisition | signups/week (30-day average) | owns SEO work until Search Console is verified |
| conversion | new paying customers per 100 signups (30 d) | reported jointly with revenue |
| revenue | revenue last 30 days + new payers (30 d) | maintains `owner_queue` |
| product | signup → first lesson, last full-month cohort | unchanged |
| content | signups attributed to social (source or last source in instagram, facebook, youtube, telegram, tiktok) per 7 d | posts per 7 d (distinct items) is secondary |
| retention | reactivated learners per week (lesson activity after ≥ 14 days idle) + offer-email clicks | 30-day bounce rate is a guardrail |
| support | customer threads/day, hours to first draft, share of drafts sent unchanged, escalations | from the Gmail desk (`agents/support.desk`), not `support_tickets` |
| website, webperf, security | unchanged | weekly cadence, fix-only |

- Where a v4 metric differs from `config/rubric` (content, retention, support), the agent
  reports both. The rubric number keeps the scorecard comparable until the supervisor proposes
  rubric bands for the v4 metric (a rubric change, owner-approved). The v4 metric is the one a
  change's `expected_effect` names.
- **`owner_queue`** (revenue maintains it in `agents/revenue`): every pending owner decision
  as `{id, decision, where (branch, PR or dashboard), eur_per_week: [low, high], basis,
  waiting_since, deadline}`. The basis names the measured rows and the assumption. The
  supervisor's Monday top 3 shows "€/week waiting" for each owner decision it lists.
- **Joint line.** Revenue and conversion end their reports with the same line:
  `rev_30d · new payers 30 d · signups 30 d · per 100`.

## v3 (2026-10-01: continuous mode), kept as history and in force where v4 does not amend it

## The daily run (every agent, every day)

v4 adds a step 0 and a closing step: start by reading your `playbook` and listing the rule ids
you will apply, and end by logging the ids you used and proposing playbook edits (v4.1). Every
change built in step 5 carries an `expected_effect` (v4.2). Weekly agents run this on their
weekly slot only (v4.4).

1. **Read** `config/charter` (your block and the principles), your `agents/<key>` document,
   and every entry in its `handoffs_in` and `incidents_open`. Read `CLAUDE.md` once per run.
2. **Take incidents** for your area: open rows in `public.agent_incidents` where
   `owner_agent = <key>` (the table is live since 2026-09-30), plus incidents the
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
3. Put **one** new experiment into your backlog: hypothesis, change, metric, class (A, B or,
   since v4, L), `expected_effect` (v4.2), baseline, judge rule, cost in hours, and whether it touches an owner-only path. If
   it is self-approvable it ships in a later run; otherwise it waits in `proposals` for the
   owner.

v3 table (superseded by the v4.4 deep days):

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

v3 table, superseded by v4.4 for the morning slots (the build waves, the release and the
supervisor times are unchanged):

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
   - **Class L (leading indicator, v4.3):** judged at 14 days on its stated leading
     indicator plus the re-estimated € effect; reverted only on a guardrail breach.
   - Every class carries `expected_effect` (v4.2); the orchestrator releases nothing without it.
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
   judge_rule, revert_trigger, status,
   expected_effect, playbook_ids, actual}        // the last three since v4 (v4.1–v4.3)
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
