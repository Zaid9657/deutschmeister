# Scorecard agents — schedule and Routine prompts

Nine scheduled Routines run the scorecard loop, each on its own day so no two runs work on
the scorecard at the same time. Each one starts a fresh session on this repo.

The prompts point at the agent files rather than repeating them, so the behaviour lives in
the repo and can't drift from a Routine UI copy. The same convention applies to
`docs/seo-routines/`.

The shared loop is in `docs/agents/PROTOCOL.md`: one move per run, and agents open PRs but
never merge them. Each area's specifics are in `.claude/agents/<name>.md`.

| Day (Europe/Berlin) | Time | Agent | Why then |
|---|---|---|---|
| Monday | 08:47 | `scorecard-steward` | after `weekly-truth` stores the week (06:00 UTC = 08:00 Berlin) |
| Monday | 10:47 | `revenue-agent` | reads the steward's fresh numbers |
| Tuesday | 07:47 | `activation-agent` | |
| Wednesday | 07:47 | `acquisition-agent` | |
| Thursday | 07:47 | `product-agent` | |
| Friday | 07:47 | `retention-email-agent` | |
| Saturday | 07:47 | `web-performance-agent` | |
| Saturday | 10:47 | `security-agent` | |
| Sunday | 07:47 | `support-agent` | |

## How the Routines are wired (created 2026-09-27)

A Routine that starts a fresh session cannot carry connectors on this account (measured:
`create_trigger` refused the `connectors` parameter). Such a session would have no Supabase,
so it could measure nothing. So each of the nine Routines **wakes the orchestrating Claude
Code session** that holds the Supabase, GitHub, Netlify and Resend connectors
(`session_014ddD3p7VmAqaTAWKQVHJBt`). That session:
1. Brings its designated branch up to date with `main`.
2. Spawns the named agent with the Agent tool in an isolated worktree.
3. Reviews the diff, runs the steward gates, pushes, and opens or updates the one PR.
4. Reports three lines to the owner.

The week's agent work therefore collects in **one PR for the owner to review**. The Routines
are named `DM agent: <area> (<day>)` in the Routines list. A first attempt, the
fresh-session `DM scorecard steward (Mon)`, is disabled.

If that session is ever archived, re-create the nine Routines from a new session that holds
the connectors, using this prompt with the agent name swapped:

> Scheduled scorecard run: `<agent-name>`.
> 1. `git fetch origin main`. If the branch's last PR is merged, restart the designated
>    branch from `origin/main`; otherwise merge `origin/main` into it.
> 2. Spawn one agent with the Agent tool: subagent_type `<agent-name>`. If that type isn't
>    listed, use general-purpose and tell it to act as defined in
>    `.claude/agents/<agent-name>.md`. Use a worktree, and tell it to do exactly one run
>    per its file and `docs/agents/PROTOCOL.md`, commit in its worktree, and not push.
> 3. Review its diff, run the steward-skill gates, cherry-pick onto the designated branch,
>    push, and open or update the PR (draft → ready when CI is green).
> 4. Never merge, never send email, never apply migrations.
> 5. Tell the owner in 3 lines: score change, what changed, owner actions.

## What the owner does each week

Review and merge the agent PRs. The steward's Monday PR lists the open ones in order. A PR
carrying an **Owner decision** line needs that decision, not only a review.
