# Wave 7 PR A2 — work in progress (paused 2026-09-07, owner request: resume next week)

State when paused: the eight EXTEND files under `typed-b1.1/` are FINAL — both round-3 delta re-reviews are **PASS (0 blocking)**
(`reviews/extend-E1-review-3.md`, `extend-E2-review-3.md`). Residual one-line minors listed at the end of each round-3 review are still to be applied by the orchestrator before generation (E1: 9, E2: 4).

What is already done in this branch: `tests/helpers/b1Bans.mjs`, `tests/b1-1-typed-production.test.mjs`
(MIGRATION_SHAPE pinned at 80/15/20/6 from a dry run; re-cut pins included), `scripts/recut-from-json.mjs`
`--header` option, `recut/patches.json` + `recut/header.sql` (the two swapped-field legacy exercises),
README row for PR A "Applied", tracker row A.

Resume recipe (from the repo root of this branch; S = this directory):
1. Apply the residual minors from both round-3 reviews to the JSON files (one-line edits), re-run the validator with --cache.
2. `node scripts/grammar-topics-from-json.mjs --json docs/course-factory/wave7/wip-a2/typed-b1.1/*.json --migration migrations/2026-09-07-b1-1-typed-production.sql --cache grammar-content-cache.json`
3. `node scripts/recut-from-json.mjs --patches docs/course-factory/wave7/wip-a2/recut/patches.json --header docs/course-factory/wave7/wip-a2/recut/header.sql --migration migrations/2026-09-07-b1-1-legacy-recut.sql --cache grammar-content-cache.json`
4. Recount both `marketing.js` twins (expected 84 topics / 672 rules / 933 examples / 1614 exercises), README rows, tracker row A2 + decision 4.
5. Gates (lint, duplicates, `npm test`, `node --check`, CI-mirror build), screenshot `/grammar/b1.1/genitive-prepositions/` stage 5, then move this directory's briefs/reviews to their final place and delete `wip-a2/` before ready-for-review.
6. Live apply both migrations in ≤26 KB chunks, verify md5 over all B1.1 rows = cache.

CI on this WIP commit is expected RED: the test suite pins migrations that are generated only after
the round-3 PASS.
