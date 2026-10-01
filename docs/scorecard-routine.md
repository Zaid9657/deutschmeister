# Agent team — schedule and Routine prompts (v3, 2026-10-01: continuous mode)

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

## Schedule (UTC, every day)

| UTC | Routine | Agent |
|---|---|---|
| 05:50, 09:50, 12:50, 15:50, 19:50 | DM team: supervisor | `supervisor` (the first run writes the day's snapshot) |
| 06:10 | DM team: revenue | `revenue-agent` |
| 06:20 | DM team: conversion | `conversion-agent` |
| 06:30 | DM team: product | `product-agent` |
| 06:40 | DM team: acquisition | `acquisition-agent` |
| 06:50 | DM team: seo | `seo-agent` |
| 07:00 | DM team: content | `content-agent` |
| 07:10 | DM team: retention | `retention-email-agent` |
| 07:20 | DM team: support | `support-agent` |
| 07:30 | DM team: website | `website-agent` |
| 07:40 | DM team: webperf | `web-performance-agent` |
| 07:50 | DM team: security | `security-agent` |
| 11:10, 16:10 | DM team: build wave | build-only runs for areas with a self-approvable item (at most 3 at a time), then one batched release |

Deep days are listed in the protocol. Continuous-mode rules (self-approval, the release train,
the deploy budget, switches) are in `docs/agents/PROTOCOL.md` § Continuous mode.

## Prompt (swap `<key>` and `<agent>`)

> Team run: `<key>`.
> 1. Spawn one agent with the Agent tool, subagent_type `<agent>`, isolation worktree, in the
>    background. Tell it: do today's run per `docs/agents/PROTOCOL.md` for charter key `<key>`
>    (the deep day too if today is its deep day); read and write the team artifact
>    https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD with ArtifactData; use the Supabase,
>    Resend, Netlify and GitHub connectors; commit PR work only in its worktree; never push,
>    merge, apply migrations or send email.
> 2. When it reports: if it committed, check the change against PROTOCOL § Continuous mode
>    rules 1–8 using origin/main, run the steward gates, get one independent reviewer for any
>    non-docs change, and put it on the release branch. Release per § Integration and release.
> 3. If the agent did not write `agents/<key>`, record `stalled` in `agents/supervisor`.
> 4. Tell the owner only if its report starts with `URGENT:`.

## What the owner does

Approve experiments in the artifact (set `experiment.status` to `approved`, or say so in chat),
review the Monday top 3, and do the actions listed under "your actions".

## Build-wave prompt

> Team build wave (PROTOCOL v3 § Continuous mode). Read `config/charter` and every
> `agents/<key>` backlog in the team artifact. For each area with a self-approvable item
> (rules 1–8; areas at target only fix defects), spawn that area's agent in its own worktree,
> at most 3 at a time, with: "Build-only run: build your top self-approvable item as one
> change, run the steward gates, commit in your worktree, update agents/<key>; never push,
> merge, migrate or send email." Integrate what passes review into ONE release PR, check the
> deploy budget, merge on green, and record each change in `changes/<id>`. If no area has a
> ready item, write that in `agents/supervisor` and stop.
