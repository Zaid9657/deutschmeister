# Agent team — schedule and Routine prompts (v2, 2026-09-29)

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

Deep days are listed in the protocol.

## Prompt (swap `<key>` and `<agent>`)

> Team run: `<key>`.
> 1. Spawn one agent with the Agent tool, subagent_type `<agent>`, isolation worktree, in the
>    background. Tell it: do today's run per `docs/agents/PROTOCOL.md` for charter key `<key>`
>    (the deep day too if today is its deep day); read and write the team artifact
>    https://claude.ai/artifact/NGaePeB3GXkep9oJmMs5hD with ArtifactData; use the Supabase,
>    Resend, Netlify and GitHub connectors; commit PR work only in its worktree; never push,
>    merge, apply migrations or send email.
> 2. When it reports: if it committed, review the diff, run the steward gates, add it to the
>    team branch and the open PR (draft). Merge only for action classes the owner authorized.
> 3. If the agent did not write `agents/<key>`, record `stalled` in `agents/supervisor`.
> 4. Tell the owner only if its report starts with `URGENT:`.

## What the owner does

Approve experiments in the artifact (set `experiment.status` to `approved`, or say so in chat),
review the Monday top 3, and do the actions listed under "your actions".
