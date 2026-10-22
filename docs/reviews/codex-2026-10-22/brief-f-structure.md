REPOSITORY STRUCTURE & ORGANISATION REVIEW (this replaces the bug-hunt OUTPUT format above; the RULES still apply: read-only, concrete, evidence-based).
Goal: tell a solo founder how to make this repo easier and faster to work in — for themselves and for the AI agents that do most of the coding here — without a risky big-bang rewrite.
Examine: the top-level layout (root *.sql files, *.md audits, content/, drafts/, videos/, docs/ size and sprawl), src/ vs astro-site/ split and the byte-identical duplicated data files (scripts/check-duplicates.mjs), src/pages vs src/components vs src/lib boundaries, giant files (find the largest source files by line count), dead code (files nothing imports — verify with grep; e.g. CLAUDE.md says src/pages/leitfaden/TelcB1Page.jsx is dead), unused dependencies in package.json and astro-site/package.json, duplicated logic between netlify/functions/_shared and src/lib, the 70+ files in migrations/ and the legacy root SQL, scripts/ sprawl, tests/ organisation, committed large binaries/generated files (check sizes with `git ls-files | xargs du -k | sort -n | tail -40`), .claude/ agents/skills, and how long CLAUDE.md is relative to what an agent needs at session start.
Measure, don't guess: give line counts, file counts, byte sizes, import counts.

OUTPUT (markdown):
## Snapshot — 6-10 measured facts about the repo today.
## Recommendations — ranked by (benefit ÷ effort ÷ risk), each:
### <n>. <title>
- Effort: S | M | L   Risk: low | medium | high
- Evidence: measured facts / paths
- Change: exactly what to move, merge, delete or split (paths)
- Benefit: what gets faster/safer (agent context cost, build time, fewer drift bugs, onboarding)
- Guard: which test/CI check proves nothing broke
## Do not do — tempting restructures that are not worth it here, and why.
## Proposed target tree — a short tree of the top two levels after the S/M changes.
