# Course Factory — Wave 6 (A2.2 legacy re-cut + the Goethe-A2 30-day exam plan) worker briefs and recipes

The process artefacts of Wave 6 (2026-09-06), preserved from the ephemeral orchestrator scratchpad
(written as `S` in the briefs). The deliverables are integrated in main (#100, #102); the reviews were not
kept, only their verdicts in the tracker. The binding level file stayed `docs/course-factory/wave5/level-a2.2.md`.

Wave 6 differs from Waves 1–5 in one place worth keeping: it added no content. PR A EDITED IN PLACE (never
deleted or inserted) every out-of-level string in live A2.2 grammar rows the earlier waves had not touched,
and re-levelled Wortliste rows instead of deleting them, so every count pinned by the earlier suites stayed
identical; the reusable guard it left behind — `tests/helpers/a2Bans.mjs` + `tests/a2-2-legacy-recut.test.mjs`
sweeping every German field of every A2.2 grammar row in the cache — is what closes the class for good.
PR B added the A2 band's exam plan the way the A1 band already had one, wired the three hand-offs to it,
and taught nothing new (every grammar item is a `Wiederholen:` of an existing topic).

| File | What it is |
|---|---|
| `common-header.md` | The header every Wave 6 worker prompt started with |
| `recut-brief.md` | PR A: the grammar re-cut author — `patches.json` `{table,id,field,old,new,why}` against the A2.2 level file |
| `recut-notes.md` | The re-cut author's notes across three review rounds (FAIL 12 → FAIL 2 → PASS), incl. the false positives ruled out |
| `vocab-brief.md` | PR A: the Wortliste re-level author — `relevel.json` for the 25 Prepositions + 25 Animals rows |
| `vocab-notes.md` | The vocab author's per-row reasoning (5 prepositions kept at a2.2, 0 animals) |
| `plan-brief.md` | PR B: the 30-day exam plan (exam Teile as the spine, derived hours, exactly two official PDFs, hand-offs) |
| `plan-notes.md` | The plan author's notes across two review rounds + the orchestrator's residual-minor round |
| `plan-verify.mjs` | The authoring verifier for the plan module (href classes, ban battery, day floor/ceiling, title length, mock minutes derived from the mock module, exactly two Puffertage) — run from `S/wave6/plan/` next to a copy of the module |
| `review-brief.md` | The adversarial Opus reviewer prompt used on every piece |

## Recipes

- **Re-cut generator** — `node scripts/recut-from-json.mjs --patches patches.json --relevel relevel.json --migration migrations/<date>-<level>-legacy-recut.sql --cache grammar-content-cache.json` emits guarded `UPDATE … WHERE id = … AND <field> = <old>` statements (jsonb literals for json fields; `words` re-levels guarded on id + old level + headword) and patches the cache in place; it refuses a patch whose `old` is not what the cache holds, and keeps MC exercises at four options containing the key.
- **Live apply** — `S/wave5/chunk-c.mjs` (≤26 KB statement-aligned chunks) via the Supabase connector, `apply_migration` names `a2_2_legacy_recut-NN`; verify with the `pgmd5.mjs` recipe from `docs/course-factory/wave4/README.md` over ALL rows of the level (not only the patched ids), plus the ban battery in SQL form over the same rows, plus `words` counts per level.
- **PR B had no migration**; its verification is the built dist (`/goethe-a2-kurs` guard, the `/pruefung/goethe-a2/` course button href) and `tests/purchases.test.mjs`.

Reviewer lessons this wave: the ban battery is a floor, not a proof — Zustandspassiv (`sind abgeschlossen`),
comparative `als`, `es gab`, zu-infinitive clauses and indirect `welch-` questions all needed an eye or a
regex refinement (the refinements are in `tests/helpers/a2Bans.mjs`); a plan's minutes are derived from the
artefacts it links (the mock module's section sum), never estimated; a verifier that exempts by label must
also count the labels.
