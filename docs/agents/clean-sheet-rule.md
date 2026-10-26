# Clean sheet before increments

*Owner rule, 2026-10-26. It applies to this repo (summarised in `CLAUDE.md`) and is written to
be pasted unchanged into any project or into the global `~/.claude/CLAUDE.md`.*

## The problem, in plain words

**We only ever improve what already exists, so we never find out whether something different
would be better.**

How it happens, every time:

1. **We read first, so the existing thing becomes the frame.** An agent's first step is to read
   the current code, design or plan. After that, every option it considers is an edit to that
   thing: fix it, polish it, extend it. A replacement never makes the list.
2. **The request presumes it.** "Improve X", "fix X", "evaluate X" all assume X stays.
3. **The rules reward sameness.** "Match surrounding code", minimal diffs, ratchets, an approved
   plan and kill lists all push toward consistency with the past. They are right about *style*
   but get applied to *direction*.
4. **Reviews police conformity, not direction.** A red-team checks a proposal against the
   existing plan and rules ("this violates the kill list"). It never asks whether the plan
   itself is the right one.
5. **Sunk cost.** Weeks of work feel too expensive to throw away, so they get defended rather
   than tested.

**The result is a local maximum:** a steadily better version of the same idea. Growth that
needs a different model (different product, offer, design or architecture) is never proposed,
because nothing in the process ever generates it.

**Seen in this repo on 2026-10-26.** A 20-aspect sales evaluation scored the *existing* site.
Every recommendation was a change to the existing train-line homepage, ticket ladder and A1.1-first
funnel, and the red-team rejected ideas for conflicting with the existing plan. No step asked:
"If we started today, what would we sell, to whom, and how?"

## The rule

**For any non-trivial build, redesign, strategy, plan or evaluation:**

1. **Blind first.** Before reading the existing implementation or plan, write the clean-sheet
   answer: *"If we started from zero today, knowing only the goal, the users, the evidence and the
   hard constraints (law, money, time), what would we build?"* Use demand data and the market,
   not the current solution.
2. **At least one real alternative.** It must be a different model, structure or design, not a
   variation of the current one.
3. **Then compare.** Read what exists. Put *evolve the current one*, *replace it with the clean
   sheet* and a *hybrid* side by side on expected impact, cost, time and risk. Recommend one, in
   one line: `Clean sheet: <evolve | replace | hybrid> — because …`.
4. **Existing work is evidence, not a requirement.** Code, designs, plans, kill lists and past
   decisions show what was tried and learned. They don't bind the answer. Sunk cost is never a
   reason. "Match the surrounding code" governs style, not direction.
5. **Reviews judge direction too.** Every review or red-team also answers: "Is this the right
   thing to build at all, versus the clean-sheet alternative?"

**Exempt:** bug fixes, small edits, and an explicit "just fix it". Owner-reserved decisions
(money, legal, brand, security) stay with the owner. A clean sheet may *propose* changing them;
it never acts on them.

## Paste-ready version for other projects and `~/.claude/CLAUDE.md`

```markdown
## Clean sheet before increments
Diagnosis: agents read what exists first, so the current design frames every option as a fix,
polish or extension of itself; rules that reward consistency and reviews that check conformity
lock it in. Result: a better version of the same thing, never a better thing (a local maximum).
Rule, for any non-trivial build, redesign, strategy, plan or evaluation:
1. Blind first: before reading the existing implementation or plan, write the zero-based answer
   from the goal, users, evidence and hard constraints only.
2. Give at least one real alternative: a different model or design, not a variation.
3. Then read what exists and compare evolve / replace / hybrid on impact, cost, time and risk;
   recommend one: "Clean sheet: <choice> — because …".
4. Existing code, designs and plans are evidence, not requirements; sunk cost is no reason;
   "match surrounding code" means style, not direction.
5. Reviews also judge direction: is this the right thing at all?
Exempt: bug fixes, small edits, explicit "just fix it".
```
