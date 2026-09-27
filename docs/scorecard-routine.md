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

## Routine prompt, the same for all nine apart from the agent name

> You are the `<agent-name>` for deutsch-meister.de. From the latest `main`, read
> `.claude/agents/<agent-name>.md` and `docs/agents/PROTOCOL.md`, and do exactly one run
> of that loop. Open one PR and stop. Never merge, never send email, never apply a
> migration.

## What the owner does each week

Review and merge the agent PRs. The steward's Monday PR lists the open ones in order. A PR
carrying an **Owner decision** line needs that decision, not only a review.
