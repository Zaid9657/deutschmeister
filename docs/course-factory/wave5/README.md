# Course Factory — Wave 5 (A2.2 + the Goethe A2 mock) worker briefs and orchestrator recipes

These are the process artefacts of Wave 5 (2026-09-06), preserved from the ephemeral orchestrator scratchpad
(written as `S` in the briefs). The content deliverables themselves are integrated in main (#93–#98); the
reviews and source dumps were not kept, only their verdicts in the tracker. Every later wave adapts these
briefs to its level instead of re-inventing them — the orchestrator pastes the relevant SPEC lines into each
worker prompt (`docs/course-factory-prompt.md`, "Every production worker's prompt must contain").

Wave 5 differs from Wave 4 in three places worth keeping: the level constraint (`level-a2.2.md`) gained
two rulings mid-wave (the frozen chunk "Gute Idee!"; an adjective before an article-less plural noun is
allowed as receptive exposure in reading/listening `content_de` only), the reading review ran four rounds
because each fix round introduced a smaller defect the verifier could not see (quote frames not verbatim,
quantifiers masking null-article adjectives, `bis` as a conjunction) — every one of those is now a hard
rule in the verifier the reading brief names — and the mock brief carries the runner-timing decision
(both Hören parts played once, 20 minutes) because the runner clock never pauses for audio.

| File | What it is |
|---|---|
| `common-header.md` | The header every Wave 5 worker prompt started with (role separation, output discipline, no commits, German-about-German is learner-facing) |
| `level-a2.2.md` | The binding A2.2 level constraint incl. the rulings — derive the next level's constraint from it (committed in PR A) |
| `grammar-brief.md` | PR A: four new grammar topics (the A2 slices of B1 topics: `-polite`/`-intro` slugs) |
| `extend-brief.md` | PR A2: typed production + depth patch for the eight live topics |
| `vocab-brief.md` | PR B: the level's Wortliste share + the defect classes on live rows |
| `reading-brief.md` | PR C: reading rewrites with `checks`, the Teil-2 and Teil-4 exam-format lessons |
| `listening-brief.md` | PR C: 13 questions per exercise incl. dictation on a fixed grid, transcript fidelity |
| `mock-brief.md` | PR D1: the Goethe A2 Kurzversion mock — exam facts only from the guide, all four Lesen Teile, timing decision |
| `test-brief.md` | PR D2: the Abschlusstest A2.2 (Kurzversion, `questionMax`, `playsAllowed`, honesty contract) |
| `plan-brief.md` | PR D2: the 28-day plan (item shape, hour budget, hand-off to the mock) |
| `review-brief.md` | The adversarial Opus reviewer prompt used on every piece (delta re-reviews pin md5s) |
| `integration-checklist.md` | The orchestrator's running integration notes per PR, as kept during the wave |

## Recipes

The `pgmd5.mjs` and `chunk-c.mjs` recipes in `docs/course-factory/wave4/README.md` were reused unchanged
(the listening chunker's statement regex matches `ALTER TABLE|UPDATE public.|INSERT INTO public.`; the
reading migration's inline `-- idempotency guard` comments survive chunking as trailing comments). Two
additions this wave:

- **Reading md5** — compare the eight rewrites live vs the reviewed JSON with the same key order Postgres
  uses: `md5(string_agg(id||'|'||title_de||'|'||content_de||'|'||checks::text||'|'||questions::text||'|'||key_vocabulary::text||'|'||word_count, '' ORDER BY id::text COLLATE "C"))`
  on the SQL side and the `pg()` key-sorter from `pgmd5.mjs` on the Node side; restrict to `order_index <= 8`.
- **CI-mirror build** — `npm run build && mv dist/index.html dist/app.html`, the offline Astro build from
  the cache, the netlify copy steps, `prerender-spa-routes.mjs`, `check-built-html.mjs dist`; always from a
  clean `dist/` (the prerender is not idempotent), and screenshots of gated SPA routes render the auth guard.
