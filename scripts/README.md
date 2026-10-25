# Script catalogue

Run commands from the repository root with Node (JavaScript only). Effects describe what
an invocation can do: **check** reads/serves data, **local generator** writes local files,
**remote writer** changes a service or submits requests. A dry run does not authorize a
later write. SQL generators produce reviewable files; they never apply migrations.

[package.json](../package.json) holds aliases; [CI](../.github/workflows/ci.yml) defines the
mandatory release sequence. Both builds must exist before merging, and prerender runs once
on clean output. `npm run build:verify` checks the SPA subset; full CI also builds Astro
offline from `grammar-content-cache.json`, merges and checks every built page.

## Build and deployment artifacts

| Command (`node scripts/…`) | Effect | Inputs | Outputs / behavior |
|---|---|---|---|
| [optimize-images.cjs](optimize-images.cjs) | local generator | PNG/JPG images in `public/` except social assets | WebP siblings; also invoked by `npm run build`. |
| [merge-site-builds.mjs](merge-site-builds.mjs) | local generator | Fresh `dist/` and `astro-site/dist/` | Carves `app.html` if needed; copies every Astro directory/file into `dist/`. |
| [prerender-spa-routes.mjs](prerender-spa-routes.mjs) | local generator | Fresh `dist/app.html`, the Vite build manifest `dist/.vite/manifest.json` (required for a built shell), route metadata/data registries | Static public SPA route HTML (each with its page chunk's `modulepreload`) and shell edits in `dist/`; then deletes `dist/.vite/`, so a second run fails: not idempotent, rebuild first. |
| [build-llms.mjs](build-llms.mjs) `[--check]` | local generator; check with `--check` | Pricing/marketing, guides/exams, grammar cache, telc B1 sale switch (env) | `public/llms.txt`, `public/llms-full.txt`; check mode fails without writing unless both files equal one sale state's render. |
| [generate-og-image.mjs](generate-og-image.mjs) `[out.png]` | local generator | Tokens, marketing counts, system Fraunces/Nunito Sans fonts | Default `public/og-image.png` (PNG social card), its claim line stamped as a tEXt chunk that `npm test` holds to the counts. |

## Checks

| Command (`node scripts/…`) | Effect | Inputs | Outputs / behavior |
|---|---|---|---|
| [check-built-html.mjs](check-built-html.mjs) `[dist] [--spa-only]` | check | Built HTML, manifest, crawl rules | Reports missing/wrong heads, copy, indexability and links, and holds every page (and, on Netlify builds, `llms*.txt`) to the telc B1 sale switch; full CI omits `--spa-only`. |
| [crawl-guard.mjs](crawl-guard.mjs) | check (imported module) | Built-page HTML and route/link metadata supplied by caller | Crawlability/link findings; used by built-HTML checks, not a standalone CLI. |
| [check-duplicates.mjs](check-duplicates.mjs) | check | Every source/destination in `shared-files.mjs` | Nonzero on any byte drift; `npm run check:duplicates`. |
| [check-grammar-json.mjs](check-grammar-json.mjs) `<file>... [--cache cache.json]` | check | CREATE/EXTEND grammar JSON; optional current cache | Shape and, with cache, collision/continuation errors; no files written. |
| [a12-determinacy.mjs](a12-determinacy.mjs) `[level]` | check | Lesson pool draw, checkpoint items and the real answer checker | One line per correct German alternative the key rejects; exit 1 when any. |
| [a12-lesen-check.mjs](a12-lesen-check.mjs) `[draft.json] [-v]` | check | Committed `src/data/curricula/a12.lesen.js` units or a draft paper file | Authoring findings for the A1.2 checkpoint Lesen units; no files written. |
| [a12-tense-check.mjs](a12-tense-check.mjs) `[level]` | check | Lesson pool and curriculum production items | Reports open-production items whose German instruction does not select a taught tense. |
| [imperative-variants.mjs](imperative-variants.mjs) | check (imported module) | Imperative item text supplied by the caller | Requested-person imperative alternatives for the determinacy and pool checks; not a standalone CLI. |
| [checkpoint-feedback-browser.mjs](checkpoint-feedback-browser.mjs) | check (local server) | Real CheckpointPage with stubbed service, audio and AI boundaries | Offline page at `http://127.0.0.1:5174/?level=a1.2`; no network, auth or database. |
| [check-legal-release.mjs](check-legal-release.mjs) | check | Astro legal facts/review evidence | Nonzero until verified operator/privacy/review facts exist; legal pages stay draft/noindex. |
| [validate-curriculum.mjs](validate-curriculum.mjs) `[level]` | check | Curriculum, built lesson pool, content contracts (default A1.1) | Structural/DaF rule checks and measured ratchets; run from root, including Windows. |

## Shared data

Edit canonical SPA inputs, then run `node scripts/sync-shared.mjs` and
`npm run check:duplicates`. The manifest is the complete copy boundary; adding a curriculum
file alone does not authorize copying it into Astro. No package boundary changes are needed.

| Command (`node scripts/…`) | Effect | Inputs | Outputs / behavior |
|---|---|---|---|
| [shared-files.mjs](shared-files.mjs) | check (manifest module) | Explicit canonical source/destination pairs | `SHARED_FILES` consumed by checker/sync; no execution side effects. |
| [sync-shared.mjs](sync-shared.mjs) | local generator | All manifest sources | Overwrites only listed destinations with byte-identical source contents. |
| [sync-curricula.mjs](sync-curricula.mjs) | local generator | Manifest curriculum pairs | Compatibility CLI that delegates curriculum-only synchronization; does not copy arbitrary files. |

## Content generators

For course edits, run `build-lesson-pool.mjs a1.1` before `validate-curriculum.mjs`.
Review generated SQL, add its migration-ledger row, and leave application to the owner.
Always choose a new explicit output path for dated SQL generators.

| Command (`node scripts/…`) | Effect | Inputs | Outputs / behavior |
|---|---|---|---|
| [build-lesson-pool.mjs](build-lesson-pool.mjs) `[level]` | local generator | Grammar cache, corrections/English sidecars, extra items, curriculum and quality rules | `src/data/lessonPools/<key>.json` and generated function rule cards; default A1.1. |
| [rule-card-overrides.mjs](rule-card-overrides.mjs) | local generator (data module) | Reviewed rule-card text | Imported overrides for the pool build; no standalone CLI or direct writes. |
| [dump-grammar-cache.mjs](dump-grammar-cache.mjs) `[out.json]` | local generator; remote read | Supabase URL/anon key (`SUPABASE_` or `PUBLIC_`) | Fetches four content tables; default `grammar-content-cache.json`, including `dumpedAt`; network required. |
| [grammar-topics-from-json.mjs](grammar-topics-from-json.mjs) `--json file... --migration out.sql --cache cache.json` | local generator | Reviewed CREATE/EXTEND topic JSON and existing cache | Guarded SQL migration and matching cache edits; exports validators used by checks. |
| [decaps-grammar-rules.mjs](decaps-grammar-rules.mjs) `<cache.json> <out-dir>` | local generator | Grammar cache | `decaps-report.json`, `decaps-updates.sql`, `cache-decapsed.json`; does not apply SQL. |
| [listening-questions-from-json.mjs](listening-questions-from-json.mjs) `<additions.json> [edits.json] [out.sql]` | local generator | Reviewed listening additions/edits | Guarded SQL; default is a dated A1.1 migration, so pass a new output explicitly. |
| [reading-from-json.mjs](reading-from-json.mjs) `<rewrites.json> <exam-format.json> [out.sql]` | local generator | Reading rewrites and new exam-format rows | Guarded SQL; default is a dated A1.1 migration, so pass a new output explicitly. |
| [recut-from-json.mjs](recut-from-json.mjs) `--patches file --migration out.sql --cache cache.json [--relevel file] [--header file]` | local generator | Reviewed old/new field patches; optional vocabulary moves/header | SQL guarded on old values and matching cache edits. |
| [words-from-json.mjs](words-from-json.mjs) `--additions file --fixes file --out out.sql [--wave-label text]` | local generator | Reviewed additions/fixes with one derived level | Idempotent vocabulary INSERT/UPDATE SQL migration. |
| [pool-corrections-sql.mjs](pool-corrections-sql.mjs) `[level]` | local generator (stdout) | Shipped pool, corrections and cache | Prints guarded exercise-text SQL; redirect into a new migration file; default A1.1. |

## Remote writers

These commands use network credentials and can modify production data/storage or notify
external services. Check the current session's authorization and review inputs before use;
this catalogue is not an instruction to run them.

| Command (`node scripts/…`) | Effect | Inputs | Outputs / behavior |
|---|---|---|---|
| [seed-reading-lessons.mjs](seed-reading-lessons.mjs) `[--dry-run]` | remote writer | `content/reading/*.json`, Supabase URL/service role | Inserts missing reading rows by level/title; dry run reads/validates and reports planned inserts. |
| [generate-course-audio.mjs](generate-course-audio.mjs) `[level] [--dry]` | remote writer + local generator | Curriculum/manifest, Azure Speech and Supabase credentials | Paid TTS requests, Storage uploads, word audio URLs and local curriculum audio manifest; `--dry` plans without calls. |
| [generate-example-audio.mjs](generate-example-audio.mjs) `[--table examples\|words\|all] [--limit N] [--dry-run]` | remote writer | Azure Speech/Supabase credentials, rows missing audio | TTS, Storage uploads and row audio URLs; dry run still reads remote rows but does not write. |
| [ping-indexnow.mjs](ping-indexnow.mjs) | remote writer | Built page sitemaps, `INDEXNOW_KEY` | Submits page URLs to IndexNow in batches; no local content generation. |

## Browser audits and local serving

Use a merged production `dist/` for route/header fidelity. Browser tools require an already
available browser/tool installation; see script headers for `CHROME_PATH` and browser paths.
Functions are not emulated by the shared static server (501 responses).

Fresh walkthroughs, batch Lighthouse reports and course screenshots default to ignored
`.cache/evaluation/<tool>-<run>/`. All three accept `--out directory` or `--out=directory`.
Lighthouse also retains its older `--out=path/report.json` form. Existing committed evidence
is preserved; deliberately copy selected new reports/screenshots into dated documentation.
The single-URL Lighthouse CLI retains `--output=directory` and `lighthouse-reports/`.

| Command (`node scripts/…`) | Effect | Inputs | Outputs / behavior |
|---|---|---|---|
| [serve-like-netlify.mjs](serve-like-netlify.mjs) `[dist] [netlify.toml] [port]` | check (local server) | Merged static output and actual Netlify rules | Loopback server (default port 4178) with static precedence, redirects, rewrites and headers. |
| [evaluate-site.mjs](evaluate-site.mjs) `[--out directory]` | local generator (browser audit) | Merged `dist/`, Netlify rules, Playwright Chromium | `walkthrough.json` plus `screenshots/` in default `walkthrough-<run>/`; route errors/meta/screenshots. |
| [lighthouse-batch.mjs](lighthouse-batch.mjs) `[--pages=/a,/b] [--runs=N] [--out directory]` | local generator (browser audit) | Merged `dist/`, Netlify rules and Chrome | Default `lighthouse-<run>/lighthouse.json`; gzip serving and configured headers preserved. |
| [course-screens.mjs](course-screens.mjs) `[--base=URL] [--tag=name] [--out directory]` | local generator (browser audit) | Running site (default local port 4173), Puppeteer browser | Images and viewport/document-width report in default `course-screens-<run>/`. |
| [lighthouse-audit.js](lighthouse-audit.js) `[--url=URL] [--preset=mobile\|desktop] [--only=categories] [--output=directory]` | local generator (browser audit) | Running site/URL and Chrome | Full timestamped HTML report; thresholds can fail command. Defaults to local port 4173 and `lighthouse-reports/`. |
| [lib/netlify-static-server.mjs](lib/netlify-static-server.mjs) | check (shared module) | Static output and `netlify.toml` | `createNetlifyStaticServer` / `parseNetlifyConfig`; imported by serving/walkthrough/batch CLIs. |
| [lib/evaluation-output.mjs](lib/evaluation-output.mjs) | check (pure shared module) | Tool name, CLI arguments, optional report filename/time | Consistent run directory/report paths and flags; no writes or browser startup. |
