# Documentation map

Start with [the root README](../README.md) for architecture/commands and
[CLAUDE.md](../CLAUDE.md) for binding implementation rules. Current commands and CI
are defined by [package.json](../package.json) and [the workflow](../.github/workflows/ci.yml).

## Current authorities

| Area | Authority | How to use it |
|---|---|---|
| Agent roles/workflow | [TEAM.md v5](agents/TEAM.md#v5-2026-10-19-read-this-first), [PROTOCOL v5 addendum](agents/PROTOCOL.md#v5-addendum-2026-10-19-this-section-wins-over-everything-below) | Four roles and current reserved owner actions; these supersede earlier team sections. Existing agent entrypoints remain available. |
| Approved strategy | [Million plan, 2026-10](strategy/million-plan-2026-10.md) | Current five moves; role memory/backlogs are in the team artifact linked by TEAM. |
| Course standard | [Course standard](course-standard-2026-09-12.md), [A1.1 remediation](course-factory/a11-rebuild/REMEDIATION-2026-10.md) | Course invariants and later corrections; A1.2 remains paused until owner approval. |
| Brand/design | [Design tokens](../src/data/design-tokens.js), [October redesign](redesign-2026-10/) | Tokens are canonical; dated design proposals do not override implemented invariants or later owner decisions. |
| Product claims/prices | [Marketing data](../src/data/marketing.js), [Pricing data](../src/data/pricing.js) | Derive claims/product keys/prices; measure fresh usage/revenue rather than quoting old reports. |
| Database changes | [Migration ledger](../migrations/README.md) | Recorded application status, including unverified/pending entries; SQL files alone do not prove application. |
| Production agents | [Production-agent operations](agents/production-agents.md) | Flags, owners, checks and incident handling; verify live settings before acting. |
| Verification/tooling | [Scripts](../scripts/README.md), [Tests](../tests/README.md), [Steward](../.claude/skills/steward/SKILL.md) | Tool effects, focused/full checks and release gates. |

## Domain references and dated handoffs

These explain decisions and preserve evidence. Their measured numbers, flags, open lists
and connector availability are dated; re-verify them before describing today's state.

| Reference | Purpose |
|---|---|
| [Extended bootstrap/reference](agents/claude-reference.md) | Complete previous CLAUDE guidance and history, with current authority/supersession notes. |
| [September 3 handoff](HANDOFF-2026-09-03.md) | September architecture/monetization decisions, environment details and then-open questions. |
| [Owner prompts](owner-prompts.md), [Monetization record](monetization-2026-09-03.md) | Reviewable owner actions and dated launch/product records; verify live ids/settings. |
| [Course factory prompt](course-factory-prompt.md), [Tracker](course-factory-tracker.md) | Course build workflow and delivery record, subject to the current course standard and A1.2 pause. |
| [Course research](course-research-2026-09-03.md), [Research directory](research/) | Evidence/synthesis behind the course design and pricing decisions. |
| [SEO routines](seo-routines/README.md) | Operational prompts and dated connector diagnoses; test the current connection instead of assuming an old blocker persists. |
| [Tracking links](tracking-links.md) | Attribution conventions and ready-made source labels. |
| [Open actions](open-actions.md), [Revenue plan](revenue-plan-2026-08-31.md) | Earlier queues and plans; reconcile with the approved October plan and current role backlogs before choosing work. |
| [Correction journal](../.claude/JOURNAL.md) | Corrections to claims in prior reports. |

## Historical records and retained evidence

- [Archive index](archive/README.md): August `EVALUATION.md`, `AUDIT-2026-08-16.md`,
  `REMEDIATION.md` and legacy setup SQL, with original contents/basenames preserved.
  Read the audits together; remediation and later work supersede their original open lists.
- [Parity roadmap](medmeister-parity-roadmap.md), [exam-first renovation](renovation-plan-2026-08-31.md)
  and [September design renovation](design-renovation-2026-09-01.md): delivery history and
  corrections, not the current strategic queue.
- [SCORECARD.md](SCORECARD.md): v1 scorecard history. V5 retired rubric scoring,
  scorecard goals, playbook counters, Monday curation, area Routines and activity quotas.
- [Repository review, 2026-10-22](reviews/codex-2026-10-22/): reviewed findings/evidence;
  verify findings against code before making changes.
- [Committed evaluation evidence](evaluation/) and [dated SEO drafts](../drafts/): retained
  measurements/drafts. Fresh audit output defaults to ignored `.cache/evaluation/<run>/`;
  deliberately copy selected evidence into dated documentation when retaining it.

## Evidence conventions

1. Dated records are historical. Correct a past claim with a new dated record/section that
   names its source; do not present frozen measurements or queues as live state.
2. Figures require provenance and a measurement date; usage/revenue claims read fresh
   `weekly_metrics`/server data first, and user-facing counts derive from marketing data.
3. New exam, legal, person or product assertions need human review; the current protocol's
   owner reservations apply to publication and release.
4. Verify heads/headings/crawlability against built output, hydration behavior in a browser,
   and database claims against measured rows. Existing reports are evidence to investigate.
