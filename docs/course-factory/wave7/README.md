# Course Factory — Wave 7 (B1.1 as a complete course half) worker briefs, notes and reviews

The process artefacts of Wave 7 (started 2026-09-07), preserved from the ephemeral orchestrator
scratchpad (written as `S` in the briefs). The binding level file is `level-b1.1.md` (PR A, #105). PR A2
(#106) is the first wave to keep the adversarial reviews themselves under `reviews/`, not only their
verdicts: B1.1 is the first PAID level the factory touched, so the review trail is part of the record.

| File | What it is |
|---|---|
| `level-b1.1.md` | The B1.1 level constraint every Wave 7 piece is authored and reviewed against (Präteritum ruling, B1/B2 border, 20-word cap, Wortliste) |
| `common-header.md` | The header every Wave 7 worker prompt started with |
| `extend-brief.md` | PR A2: the EXTEND author brief — 10 typed exercises per topic (4 guided fill_blank + 3 sentence_building + 3 error_correction), +3 rules / +4 examples on the five thin topics, guarded `rule_patches` |
| `extend-notes-E1.md` | Author E1 (genitive-case, genitive-prepositions, relative-clauses-nom-acc, relative-clauses-dat-gen): current content + per-round changelog |
| `extend-notes-E2.md` | Author E2 (konjunktiv-ii-wurde, konjunktiv-ii-ware-hatte, infinitive-with-zu, um-zu-ohne-zu): the same |
| `live-state-b1.1.md` | Rule / example / exercise counts and order_index ranges per live B1.1 topic before PR A2 (the EXTEND counters start from these) |
| `review-brief.md` | The adversarial Opus reviewer prompt used on every piece |
| `reviews/extend-E1-review-{1,2,3}.md` | E1's three rounds: FAIL 9 → FAIL 1 → PASS (0 blocking); round 3 is a delta re-review |
| `reviews/extend-E2-review-{1,2,3}.md` | E2's three rounds: 27 findings closed → PASS (0 blocking); round 3 is a delta re-review |

## Recipes

- **EXTEND generator** — `node scripts/grammar-topics-from-json.mjs --json <the eight files> --migration migrations/2026-09-07-b1-1-typed-production.sql --cache grammar-content-cache.json` (after `node scripts/check-grammar-json.mjs <files> --cache grammar-content-cache.json` is clean). The residual one-line minors each round-3 review lists were applied to the JSON by the orchestrator before generation.
- **Re-cut generator with a header** — `node scripts/recut-from-json.mjs --patches patches.json --header header.sql --migration migrations/2026-09-07-b1-1-legacy-recut.sql --cache grammar-content-cache.json`; `--header` (new in this wave) prepends a hand-written explanation block to the generated file.
- **Live apply** — statement-aligned chunks ≤26 KB via the Supabase connector (`apply_migration`, names `b1_1_typed_production_chunk_NN`, `b1_1_legacy_recut_chunk_NN`); verify with the `pgmd5.mjs` recipe from `docs/course-factory/wave4/README.md` over ALL B1.1 rules/examples/exercises, plus the SQL form of the ban battery over the same rows, plus per-topic floors (≥10 typed, ≥8 rules, ≥12 examples).
- **Screenshot** — the built dist served locally, a stubbed subscriber session (`sb-<ref>-auth-token` in localStorage, `auth/v1/user` and `rest/v1/profiles` routed) and the player driven from the cache keys to question 13 of `/grammar/b1.1/genitive-prepositions/` (the first stage-5 typed item).

Reviewer lessons this wave: a reduced-passive ellipsis (`wie … <Partizip II>` with no auxiliary) slips past
the Passiv regex and needs an eye; a `question_en` cue must not name the key; "in der Regel" garden-paths
before a quoted rule title resolves it; a `related_rule_title` beats an `order_index` pointer because the
generator resolves titles on both language sides.
