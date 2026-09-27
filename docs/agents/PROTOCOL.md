# Area agent protocol

Every area agent in `.claude/agents/` follows this loop. It runs once per scheduled firing
(see `docs/scorecard-routine.md`) or when a session invokes it by name. The agent's own
file adds its metrics, levers and boundaries. This file is the part they all share.

## The loop — one run

1. **Read** `CLAUDE.md`, then `docs/SCORECARD.md` in full, then your own agent file. Work
   from the latest `main`.
2. **Close the last experiment.** Find your area's most recent §6 line whose "after" is
   still open. Measure that metric now, fill in the after value, and set keep or drop with
   a one-line lesson. This step is how the loop learns. Skip it and the next run repeats
   blind.
3. **Measure** every §2 metric for your area with the §7 sources. Never estimate a number
   you could not measure. Write the reason it failed into §9.
4. **Score** your area with the §5 rubric only. Update your row in §1 (score, trend arrow,
   evidence) and your rows in §2.
5. **Choose exactly one move:**
   - the top open §3 item for your area; or, if none is open,
   - one new item you add to §3 in rank order. Pick the highest expected lift per hour of
     work, with a measurable "done when".

   Before choosing, read your area's §6 lines. A move logged as dropped needs a new reason
   to come back.

   If your area already meets its next §2 target and no item is open, **do nothing** and
   write "at target" in the PR. Polishing an area that isn't the bottleneck is the failure
   mode this system exists to prevent: 23 review rounds on a free course while revenue
   stayed at €0.
6. **Act.**
   - **Agent-doable** (one PR, inside your area's files where possible): branch from
     `main`, build it, and run the gates from `.claude/skills/steward/SKILL.md`. Open a PR
     whose first line is `Area: <name> · score A → B · move: <one line>`. **Never merge it.**
     Scheduled agents do not merge without human review. The owner, or a session he is
     working in, reviews and merges. Say in the PR what to check. If the PR:
     - changes the schema or needs a migration applied;
     - changes a price or a claim in `marketing.js`;
     - changes an email's content or audience;
     - touches the legal pages;
     - deletes user data;

     put a bold **Owner decision** line at the top saying exactly what he is approving.
   - **Needs the owner:** write one concrete owner action in the §3 status cell: the exact
     button, file or command, and why. Don't build around it.
7. **Log** one §6 line: date, area, move, the metric before, "after" left open for the next
   run, and your expected effect. The steward writes §8 (history). Area agents never do.
8. **Stop.** One move per run.

## Hard limits (all agents)

- Never merge a PR, including your own.
- Never send email, post to social accounts, or spend money.
- Never change prices, apply migrations, or edit Lemon Squeezy.
- Never advance a `Stand:` stamp on `/vergleich/`.
- Never commit `astro-site/package-lock.json`.
- Never skip, disable or loosen a test to get green.
- Never touch another area's §3 items. If you find a problem in another area, add it to §3
  under that area and leave it.
- Never claim a number you did not measure in this run.
- If an earlier agent PR is still open and unmerged, build on `main` anyway. Say in your PR
  that it will conflict on `docs/SCORECARD.md`, and keep both sides' rows when resolving.
