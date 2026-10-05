# Agent team — schedule and Routine prompts (v4, 2026-10-04: playbooks and revenue focus)

The team protocol is `docs/agents/PROTOCOL.md`; the one-page overview is
`docs/agents/TEAM.md`. This file is the schedule and the prompt used to re-create the Routines.

## Why the Routines wake one session

A Routine that starts a fresh session cannot carry connectors on this account. Measured twice:
`create_trigger` refused the `connectors` parameter (2026-09-27 and 2026-09-29), and a probe
Routine on 2026-09-29 reported only the artifact tools, no Supabase, Resend or Netlify, and a
blocked site. An agent in such a session would "run" every day and see nothing. So every
Routine below wakes the orchestrating Claude Code session that holds the connectors
(`session_014ddD3p7VmAqaTAWKQVHJBt`). That session spawns the named agent in its own git
worktree, reviews what it built, and integrates it.

## Schedule (UTC) — v4 target

This is the **target schedule** from PROTOCOL v4.4 (owner-approved plan, 2026-10-04). The
orchestrator applies it to the Routines: it adds the acquisition 13:10 run and the two extra
support-desk runs, moves support from 07:20 to 07:10, moves website, webperf and security to one
weekly slot each, and keeps one weekly seo slot (Wednesday) for measurement and diagnosis only:
SEO building is acquisition's work until Search Console is verified. Until a Routine is changed,
the v3 slot it still fires on runs the agent under v4 rules (a weekly agent woken on another day
logs an idle run).

| UTC | Routine | Agent |
|---|---|---|
| 05:50, 09:50, 12:50, 15:50, 19:50 daily | DM team: supervisor | `supervisor` (the first run writes the day's snapshot; Monday's first run adds the Curator pass) |
| 06:10 daily | DM team: revenue | `revenue-agent` |
| 06:10 and 13:10 daily | DM team: acquisition | `acquisition-agent` (also does SEO work until Search Console is verified) |
| 06:20 daily | DM team: conversion | `conversion-agent` |
| 06:30 daily | DM team: product | `product-agent` |
| 07:00 daily | DM team: content | `content-agent` |
| 07:10 daily | DM team: retention | `retention-email-agent` |
| 07:10, 12:30, 18:30 daily | DM team: support desk | `support-agent` (Gmail drafts and labels only; sending is owner-only) |
| Monday 07:30 | DM team: website | `website-agent` (weekly, fix-only) |
| Wednesday 06:50 | DM team: seo | `seo-agent` (weekly measurement and diagnosis) |
| Wednesday 07:40 | DM team: webperf | `web-performance-agent` (weekly, fix-only) |
| Friday 07:50 | DM team: security | `security-agent` (weekly, fix-only) |
| 11:10, 16:10 daily | DM team: build wave | build-only runs for areas with a self-approvable item (at most 3 at a time, plus this week's extra slots for the top 2 estimators), then one batched release |

v3 schedule (history): every area agent ran daily in one slot from 06:10 to 07:50 (revenue,
conversion, product, acquisition, seo, content, retention, support, website, webperf, security,
ten minutes apart).

Deep days are listed in PROTOCOL v4.4. Continuous-mode rules (self-approval, the release train,
the deploy budget, switches) are in `docs/agents/PROTOCOL.md` § Continuous mode.

## Prompt (swap `<key>` and `<agent>`)

> Team run: `<key>`.
> 1. Spawn one agent with the Agent tool, subagent_type `<agent>`, isolation worktree, in the
>    background. Tell it: do today's run per `docs/agents/PROTOCOL.md` (v4) for charter key
>    `<key>` (the deep day too if today is its deep day); start by reading your `playbook` and
>    listing the rule ids you will apply; end by logging the ids you used and proposing
>    playbook edits in `playbook_proposals`; give any change you build an `expected_effect`;
>    read and write the team artifact https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD with
>    ArtifactData; use the Supabase, Resend, Netlify and GitHub connectors; commit at most one
>    change, only in its worktree; never push, merge, apply migrations or send email.
> 2. When it reports: if it committed, check the change against PROTOCOL § Continuous mode
>    rules 1–8 using origin/main and confirm its `expected_effect`, run the steward gates, get
>    one independent reviewer for any non-docs change, and put it on the release branch.
>    Release per § Integration and release, and write `changes/<id>` with `expected_effect`
>    and `playbook_ids`.
> 3. If the agent did not write `agents/<key>`, record `stalled` in `agents/supervisor`.
> 4. Tell the owner only if its report starts with `URGENT:`.

## Support-desk prompt

> Team run: support desk (PROTOCOL v4.5). Spawn `support-agent` in its own worktree with: "Desk
> pass: read your `playbook` and list the rule ids you will apply; read new threads in the
> shared inbox with the Gmail connector; handle DeutschMeister threads only (MedMeister threads
> belong to the MM team's support agent: leave them untouched); label each DeutschMeister customer thread AI/DM plus one
> topic label (AI/t-question, AI/t-access, AI/t-billing, AI/t-bug, AI/t-lead, AI/t-other);
> create draft replies from the verified sources in PROTOCOL v4.5 only and label them
> AI/drafted; label every thread that matches supportAgentLib ESCALATION_REASONS, or that the
> sources cannot answer, AI/needs-owner with no draft; create only: never update or delete a
> draft, never send, reply, forward, trash or mark spam; write counts only into
> agents/support.desk; on the 07:10 run also do the daily routine under PROTOCOL rules 1–8 (one
> change in a worktree; the orchestrator reviews, gates and releases it with a `changes/` record)."
> Tell the owner when a thread was labelled AI/needs-owner or drafts are waiting.

## What the owner does

Approve experiments in the artifact (set `experiment.status` to `approved`, or say so in chat),
send or discard the support desk's drafts, review the Monday top 3 (each owner decision shows its
"€/week waiting"), and do the actions listed under "your actions".

## Build-wave prompt

> Team build wave (PROTOCOL v4 and v3 § Continuous mode). Read `config/charter` and every
> `agents/<key>` backlog in the team artifact, and `agents/supervisor.build_slots` for this
> week's extra slots. For each area with a self-approvable item (rules 1–8; areas at target and
> the weekly fix-only areas build only defect fixes), spawn that area's agent in its own
> worktree, at most 3 at a time plus the extra slots, with: "Build-only run: read your
> `playbook` and list the rule ids you will apply; build your top self-approvable item as one
> change with an `expected_effect`, run the steward gates, commit in your worktree, update
> agents/<key> (log the rule ids used, propose playbook edits); never push, merge, migrate or
> send email." Integrate what passes review into ONE release PR, check the deploy budget, merge
> on green, and record each change in `changes/<id>` with its `expected_effect` and
> `playbook_ids`. If no area has a ready item, write that in `agents/supervisor` and stop.
