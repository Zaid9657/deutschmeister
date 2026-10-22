## Snapshot

Measurements cover tracked files in the current checkout, excluding Git history and installed dependencies.

- **1,302 files, 34,742,107 bytes (33.1 MiB).** The largest file is `grammar-content-cache.json`: **2,965,450 bytes**.
- **Three clear application areas:** `src/` has **325 files**, `astro-site/` **91**, and `netlify/functions/` **76**, including **33 shared modules**.
- **SPA boundaries are healthy:** **64 page modules**, **107 component modules**, **58 library modules**. Pages import components **362 times**, libraries **70 times**, and services **44 times**; components→pages and libraries→pages both have **zero imports**.
- **Largest source files:** `scripts/validate-curriculum.mjs` **3,393 lines**; checkpoint builder **2,447**; pool-quality rules **2,081**. Largest UI: grammar detail Astro page **751**; Speaking and Sentence X-Ray **720 each**.
- **17 byte-identical pairs pass the duplication check.** One repeated side totals **416,549 bytes / 6,414 lines**. The curriculum copier also creates **two unused, unguarded Astro copies**, adding **37,257 bytes / 852 lines**.
- **Documentation:** `docs/` contains **317 files / 11,085,765 bytes**, including **152 Markdown files**. `CLAUDE.md` alone is **398 lines / 4,673 words / 34,494 bytes**.
- **Agent configuration:** `.claude/` contains **53 files**; **14 agent definitions** total **738 lines**. Skills contain **36 files / 8,699 lines**, mostly references and supporting tools.
- **Database history:** `migrations/` contains **65 SQL files**, rather than 70+, plus README and two notes. Another **11 historical SQL files / 776 lines** remain at root.
- **Tooling:** `scripts/` contains **31 files / 10,793 lines**. `tests/` contains **159 flat test suites**, five fixtures and four helpers, totaling **42,752 lines**.
- **Content and media:** `content/` has **4 files / 211,345 bytes**; `drafts/` **25 / 450,247**; `videos/` **24 / 507,482**. Public social images occupy **4,972,891 bytes**; evaluation screenshots occupy **7,216,426 bytes**.

Read-only verification passed all **17 duplicate comparisons** and **10 selected test files** covering migrations, dependencies, formatting, design and social content. The working tree remained clean; builds were not run because they generate files.

## Recommendations

Ranked by expected benefit relative to effort and risk.

### 1. Make session-start guidance short and authoritative

- **Effort: S   Risk: low**
- **Evidence:** [CLAUDE.md:334](../../../CLAUDE.md:334) describes twelve agents and requires the “living” scorecard. [TEAM.md:22](../../../docs/agents/TEAM.md:22) replaces those areas with four roles and explicitly retires scorecard goals. `README.md:96–104` still says lint warnings are tolerated and Astro is absent from CI; both contradict the current configuration.
- **Change:** Reduce `CLAUDE.md` toward **100–150 lines**, retaining architecture, routing, authorization, data ownership and command invariants. Move detailed course/design history into linked domain references. Make `docs/README.md` identify current authorities and historical records; update existing `.claude/agents/*.md` instructions to team v5 while preserving their entrypoints.
- **Benefit:** Every coding session reads less history and starts from the same current workflow.
- **Guard:** Resolve changed document links and compare documented commands against `package.json` and CI. Preserve every invariant when relocating its explanation; existing CI does not detect contradictory prose.

### 2. Generate intentional copies from one explicit manifest

- **Effort: S   Risk: low**
- **Evidence:** [check-duplicates.mjs:6](../../../scripts/check-duplicates.mjs:6) lists **17 pairs**, but [sync-curricula.mjs:23](../../../scripts/sync-curricula.mjs:23) copies every curriculum JavaScript file. This produces unused Astro `a11.art.js` and `a11.meta.js`; the latter even imports nonexistent `astro-site/src/lib/course/plan.js`.
- **Change:** Extract the existing pairs into `scripts/shared-files.mjs`. Make the checker and a new `scripts/sync-shared.mjs` consume that manifest, treating the current SPA files as sources. Retain `sync-curricula.mjs` as a compatibility wrapper, then delete those two unused Astro copies.
- **Benefit:** One command replaces manual edits across front ends and functions, without changing package boundaries.
- **Guard:** Keep the byte-equality CI gate. Run claims, read-aloud and curriculum suites, followed by the offline Astro build and merged HTML verification. Check that sync creates only manifest destinations.

### 3. Repair the migration ledger before adding migration machinery

- **Effort: S   Risk: low**
- **Evidence:** [migrations/README.md:9](../../../migrations/README.md:9) omits six existing SQL files: `2026-09-04-a1-grammar-fixes.sql`, `2026-09-05-a1-1-new-topics.sql`, `2026-09-05-sd1-sprechen-missions.sql`, `2026-09-12-lesson-engine.sql`, `2026-09-13-a1-1-course-words.sql`, and `2026-09-19-course-funnel.sql`. It also lists nonexistent `2026-08-16-reading-lessons.md`.
- **Change:** Add those entries, using “application status unverified” wherever evidence is missing, and correct the missing-note reference. Add a filename-to-ledger parity check. Preserve SQL filenames and the current table structure: existing tests parse its rows.
- **Benefit:** Agents can distinguish applied, pending and undocumented changes without reconstructing history.
- **Guard:** Add parity checking to CI; retain `migration-advisors`, `trial-grant`, `db-columns` and `rls-update-check` suites. These four passed during this review.

### 4. Give browser audits one routing implementation

- **Effort: M   Risk: low**
- **Evidence:** Three scripts implement HTTP serving. [evaluate-site.mjs:24](../../../scripts/evaluate-site.mjs:24) maintains **25 SPA prefixes**, omitting live `/course/*` and `/support` routes. [lighthouse-batch.mjs:64](../../../scripts/lighthouse-batch.mjs:64) returns SPA HTML with **200** for arbitrary missing paths. `serve-like-netlify.mjs` already reads `netlify.toml`.
- **Change:** Extract `scripts/lib/netlify-static-server.mjs` from `serve-like-netlify.mjs`; use it from that CLI, `evaluate-site.mjs` and `lighthouse-batch.mjs`. Preserve Lighthouse’s gzip handling and request-path header semantics.
- **Benefit:** Walkthroughs and performance audits stop producing contradictory routing results.
- **Guard:** Add HTTP cases for `/pricing`→301, `/course/a1.1`→200, `/support`→200, unknown paths→404, and configured headers. Run the crawl-guard suite and merged HTML check.

### 5. Delete verified abandoned modules and the unused Astro icon dependency

- **Effort: S   Risk: low**
- **Evidence:** Five modules have **zero importers**, including scripts and tests, totaling **121 lines / 5,085 bytes**: `src/components/StatsBar.jsx`, `src/components/illustrations/index.jsx`, `src/pages/admin/AdminPending.jsx`, `src/pages/lesson/LessonPreviewPage.jsx`, and `astro-site/src/lib/planState.js`. Astro’s `lucide-react` declaration has **zero package imports and zero incoming lockfile dependency edges**.
- **Change:** Delete those five modules, the stale `AdminPending` comment and obsolete preview-file test exception. Remove `lucide-react` from `astro-site/package.json` and regenerate its lockfile. Correct the stale documentation claiming `TelcB1Page.jsx` exists—it is already deleted.
- **Benefit:** Searches expose fewer abandoned implementation paths; Astro installs one fewer unused direct dependency. Expect little runtime bundle change because unused modules were already excluded.
- **Guard:** Lint, full tests, both builds and merged HTML verification. Keep test-consumed files such as `adminMetrics.js` and drift-guarded `competitorComparisons.js`.

### 6. Move historical SQL and August audits out of the entrance

- **Effort: S   Risk: low**
- **Evidence:** Root contains **11 historical SQL files / 38,437 bytes** and three August audit documents totaling **891 lines / 68,951 bytes**. No build, script or test reads those root SQL files; [migrations/README.md:105](../../../migrations/README.md:105) explicitly identifies them as history.
- **Change:** Move root `*.sql` into `docs/archive/legacy-sql/`. Move `AUDIT-2026-08-16.md`, `EVALUATION.md` and `REMEDIATION.md` together into `docs/archive/audits/2026-08/`. Preserve historical contents and basenames; update incoming links and add an archive index explaining supersession.
- **Benefit:** Root becomes a clearer project entrance, and historical SQL loses the appearance of current setup instructions.
- **Guard:** Compare file hashes before and after moves, resolve incoming links, and run migration suites. Keep this archive outside `migrations/`, whose scanners intentionally inspect only `migrations/*.sql`.

### 7. Catalogue scripts and tests before moving them

- **Effort: S   Risk: low**
- **Evidence:** The **31 scripts** comprise five build/deploy tools, six checks, fourteen content operations, five browser-audit tools and one search submission tool. **123 test suites** define their own repository root; `npm test` discovers only `tests/*.test.mjs`.
- **Change:** Add `scripts/README.md` listing each command’s inputs, outputs and effects: check, local generator or remote writer. Add `tests/README.md` mapping domains to suites, plus explicit `test:course` and `test:site` commands. Retain the full test command and existing file locations initially.
- **Benefit:** Agents find relevant checks faster and can identify commands that write content or call production services.
- **Guard:** Confirm the full command still discovers **159 suites**. Keep full-suite CI mandatory; focused commands supplement it.

### 8. Separate fresh audit output from committed evidence

- **Effort: S   Risk: low**
- **Evidence:** `docs/evaluation/` holds **149 files / 7,364,172 bytes**. [evaluate-site.mjs:18](../../../scripts/evaluate-site.mjs:18), `lighthouse-batch.mjs:22` and `course-screens.mjs:13` default new output into this tracked documentation area.
- **Change:** Default fresh captures to ignored `.cache/evaluation/<run>/`; give all three tools a consistent `--out` option. Preserve existing evidence and deliberately copy selected future reports and screenshots into dated documentation directories.
- **Benefit:** Routine audits stop overwriting historical reports or filling working changes with incidental captures.
- **Guard:** Verify output overrides and defaults, inspect `git status` after a capture, and resolve links in deliberately retained reports.

### 9. Extract checkpoint scoring through the existing public interface

- **Effort: M   Risk: medium**
- **Evidence:** [buildCheckpoint.js:2234](../../../src/lib/checkpoint/buildCheckpoint.js:2234) starts a **164-line scoring section** inside a **2,447-line builder**. `checkpointService.js:3` imports only `isItemCorrect`; `CheckpointPage.jsx` needs both generation and scoring.
- **Change:** Move scoring into `src/lib/checkpoint/scoring.js` and shared section/pass constants into `constants.js`. Re-export existing names from `buildCheckpoint.js`; let persistence import scoring directly. Preserve generation, seed arithmetic and remediation selection.
- **Benefit:** Pass-rule and persistence work requires less unrelated generation context.
- **Guard:** Run checkpoint and assessment-integrity suites, then full tests. Update source-reading assertions to follow the extraction while preserving their conditions.

## Do not do

- **Do not merge Astro and React or introduce `apps/`/`packages/` now.** Their rendering responsibilities are clear, and existing CI already builds and verifies the merged deployment.
- **Do not reorganize every page and component into feature folders.** The measured dependency direction is healthy. Extract specific responsibilities when their code changes.
- **Do not squash migrations or introduce automatic replay as cleanup.** Some live objects predate these files, and filename order does not fully represent historical application order. Preserve the hand-applied record.
- **Do not delete everything without runtime importers.** Tests, generators, drift guards and external routines consume repository files too.
- **Do not relocate active drafts wholesale.** The daily social routine reads `drafts/instagram-100/posts.csv` by its exact path through November 16. Reading JSON is seed source; video projects produce the homepage assets.
- **Do not introduce LFS or rewrite history based on this checkout.** The largest tracked file is only 2.83 MiB; the grammar cache supports offline CI and outage fallback. Media sources already ignore intermediate renders.
- **Do not blindly nest tests or remove agent entrypoints.** The current test glob would omit nested suites, and team v5 explicitly preserves existing agent files. Keep vendored skill provenance and lazy references.

## Proposed target tree

After these S/M changes; unchanged leaf files are abbreviated.

```text
.
├── CLAUDE.md                    # short bootstrap and reference map
├── README.md                    # current architecture and commands
├── package.json
├── package-lock.json
├── grammar-content-cache.json
├── index.html
├── netlify.toml
├── …                            # existing tool configuration
├── .claude/
│   ├── agents/                  # preserved names, current instructions
│   ├── hooks/
│   └── skills/
├── .github/
│   └── workflows/
├── src/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── contexts/
│   ├── data/                    # canonical shared inputs
│   ├── hooks/
│   ├── lib/                     # includes checkpoint scoring extraction
│   ├── pages/
│   ├── services/
│   └── utils/
├── astro-site/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── netlify/
│   └── functions/
├── migrations/
│   ├── README.md                # complete application ledger
│   └── *.sql                    # unchanged filenames
├── scripts/
│   ├── README.md
│   ├── lib/                     # common audit server
│   ├── shared-files.mjs
│   ├── sync-shared.mjs
│   └── …                        # existing CLI paths retained
├── tests/
│   ├── README.md
│   ├── fixtures/
│   ├── helpers/
│   └── *.test.mjs
├── docs/
│   ├── README.md                # current versus historical map
│   ├── archive/                 # legacy SQL and August audits
│   └── …                        # existing domain references/evidence
├── content/
│   └── reading/
├── drafts/
│   └── instagram-100/
├── videos/
│   ├── hero-line/
│   └── hero-line-mobile/
└── public/
    ├── art/
    ├── fonts/
    ├── motion/
    └── social/
```