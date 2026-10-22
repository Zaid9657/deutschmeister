# CLAUDE.md

Binding guidance for agents working on deutsch-meister.de. Match surrounding JavaScript;
no TypeScript additions (Astro's existing Props syntax is normal).

## Authorities and architecture

- Read [TEAM.md v5](docs/agents/TEAM.md#v5-2026-10-19-read-this-first) and the
  [PROTOCOL v5 addendum](docs/agents/PROTOCOL.md#v5-addendum-2026-10-19-this-section-wins-over-everything-below); four roles replace the twelve areas, and scorecard goals/playbook counters are retired.
- Current strategy is [the approved million plan](docs/strategy/million-plan-2026-10.md).
  [The reference](docs/agents/claude-reference.md) preserves every previous bootstrap detail; dated claims and old scorecards are history, not current measurements.
- Vite/React `src/` becomes `dist/app.html`; Astro `astro-site/` supplies public static pages
  and wins those URLs in merged `dist/`. Supabase stores content; Netlify functions supply services. See [README](README.md#architecture).
- The SPA deliberately has no `/` route; edit the homepage in `astro-site/` and use full-page
  loads to it. See [routing and its history](docs/agents/claude-reference.md#the-spa-has-no--route-on-purpose).

## Routing and built output

- **Three-place route rule:** add public SPA routes in `src/App.jsx` AND the `netlify.toml`
  allow-list; crawlable routes also need `scripts/prerender-spa-routes.mjs` AND `public/sitemap-spa.xml`. See [routing](README.md#routing).
- **Trailing slashes:** Astro pages and prerendered SPA routes end in `/`; every other SPA
  route has no slash. The prerender list is authoritative; [the reference](docs/agents/claude-reference.md#conventions--gotchas) lists the cases.
- New Astro output directories are discovered by `scripts/merge-site-builds.mjs`; add new
  pages to the `check-built-html.mjs` MANIFEST. Guides are registry data, with no SPA twin. See [guide rules](docs/agents/claude-reference.md#conventions--gotchas).
- Static head tags use `data-rh="true"` exactly when `src/components/SEO.jsx` re-renders them;
  leave robots, image dimensions/alt and WebSite/Organization JSON-LD unstamped. See [head-tag details](docs/agents/claude-reference.md#conventions--gotchas).
- Verify heads, headings, colour sweeps and crawlability against built `dist/`, and head
  reconciliation after hydration in a browser. Prerender is not idempotent: start from a clean build. See [commands](#commands).
- Keep CSP Report-Only until reports are checked; legal pages remain noindex drafts until
  owner review. See [legal release gate](scripts/README.md#checks).

## Data, claims and money

- Levels are lowercase in URLs/code, uppercase in DB `sub_level` and Storage folders;
  `reading_lessons.level` is lowercase. Normalize boundaries with `ilike`/`lower()`. See [case details](docs/agents/claude-reference.md#conventions--gotchas).
- Canonical shared inputs live in `src/`; use `scripts/shared-files.mjs` + `sync-shared.mjs`
  for intentional copies and keep them byte-identical. Grammar rendering/comparison behavior must agree too. See [shared files](scripts/README.md#shared-data).
- Derive prices/product keys from `src/data/pricing.js` and claims/limits from
  `src/data/marketing.js`; never retype a price or invent a usage count. See [provenance rules](src/data/marketing.js).
- User-facing counts are measured content counts; usage/revenue claims require fresh
  `weekly_metrics` (or `weekly_truth_metrics()`) and recorded provenance. See [measurement](docs/agents/claude-reference.md#conventions--gotchas).
- Never advance competitor `Stand:` dates without the vendor's own page; exam facts need
  `factsCheckedOn` and sources, with no outcome promises or fee figures in guides. See [guides](tests/guides.test.mjs).
- Money path: webhook numeric `LEMONSQUEEZY_<KEY>_VARIANT_ID` values map to pricing keys and
  upsert purchases by LS order id; client `VITE_`/`PUBLIC_` checkout UUIDs hide cards when unset. See [money details](docs/agents/claude-reference.md#conventions--gotchas).
- Every level lock uses `hasLevelAccess(level)` (free/trial/sub/bought course); signed-out Buy
  stores `dm_buy_intent` and resumes `/subscription?buy=<key>`. Astro grammar text is public; exercise locks above A1.1 are UX only. See [purchase guards](tests/purchases.test.mjs).
- Lemon Squeezy products, discounts and redirects are dashboard-only; agents use its API
  read-only. Owner actions and ids: [owner prompts](docs/owner-prompts.md), [monetization record](docs/monetization-2026-09-03.md).
- Attribution has one classifier in `public/attribution.js`, loaded by both heads; preserve
  first touch, store labels only (no click ids), and call NULL “untracked”, never “direct”. See [tracking links](docs/tracking-links.md).
- New analytics use `public/consent.js`'s `dm_cookie_consent` flag and `dm-consent-accepted`;
  generate `public/llms*.txt` with `build-llms.mjs`, never by hand. See [generators](scripts/README.md#content-generators).

## Design

- `src/data/design-tokens.js` alone defines hex values/font stacks; keep its Astro twin
  identical. Case colours only name grammatical cases; `siegel` is the one action colour; use hairlines, no resting shadows. See [token rules](src/data/design-tokens.js).
- `nacht` is light türkis: use `text-nacht-text`/`-muted`, never inverse white; `linie === siegel`,
  and email brand colours match tokens. Only `rounded-pill` is wired; do not replace Tailwind radius defaults. See [design details](docs/agents/claude-reference.md#conventions--gotchas).
- `font-display` is Fraunces; Archivo sign roles require their Layout preloads (otherwise
  `data-sign="off"` uses body type). Astro has no hex literals. Offers/stations derive from `offers.js`. See [redesign](docs/redesign-2026-10/).
- Use motion tiers 140/220/420/800 ms and token curves; animate only transform/opacity/clip-path,
  with hover motion only on fine hover pointers. Hero line-board sentences match the plan/page. See [motion workflow](docs/agents/claude-reference.md#conventions--gotchas).
- Use `src/components/ui/`'s button/card; global focus/selection are product-wide brand surfaces.
  Both retired-palette ratchets stay 0; `src/index.css` is the SPA stylesheet. See [brand guards](tests/brand.test.mjs).

## Course rules

- Follow [the course standard](docs/course-standard-2026-09-12.md): situational Lektionen,
  can-dos, in-app stages/checkpoints/review/dated plan; A1.1 is the template. Never sequence courses by grammar slug.
- Close finding classes with a rule + regression test, never lists of ids; ratchets only go
  down and equal measured debt. Course tasks/notices/cards/mail speak **Sie**; only learner dialogues may duzen. See [A1.1 reference](docs/agents/claude-reference.md#current-state--open-threads).
- After any content edit, run `node scripts/build-lesson-pool.mjs a1.1` THEN
  `node scripts/validate-curriculum.mjs` from repo root (including Windows). See [course tools](scripts/README.md#content-generators).
- Fix bank text in `a11.corrections.json`, reviewed English in its sidecar, generated items in
  their templates; never patch the DB cache as the source. Keep the SQL half owner-applied. See [pool rules](docs/agents/claude-reference.md#conventions--gotchas).
- `src/lib/lesson/check.js` decides answers: fold spelling separators; case-only misses get
  one TYPO retry unless case is the task. Fix checker/build rules with tests, never widen `accepted` alone. See [checker](src/lib/lesson/check.js).
- Checkpoints measure transfer: per-checkpoint writing tasks, seeded new retakes, one
  `sectionPasses()` rule above constant-answer scores; content coverage caps writing and copied tasks score zero. See [remediation](docs/course-factory/a11-rebuild/REMEDIATION-2026-10.md).
- Sentence-building objects/modal adverbs that can open a sentence need an explicit opening
  cue; keep them out of answer-key fronting. See [checkpoint details](docs/agents/claude-reference.md#conventions--gotchas).
- Practice score counts first responses to first-pass practice/derived/listened dictation only,
  excluding retries/reveals/warm-up/writing/speaking/text dictation; wrong matches are corrected, not TYPO. See [score rules](docs/agents/claude-reference.md#conventions--gotchas).
- Practice gold means ≥80% practice only; recap reports speaking/writing separately and better
  runs survive weaker repeats. Show labelled `lektionMinutesEstimate`, never the validator's 15-minute target. See [score details](docs/agents/claude-reference.md#conventions--gotchas).
- Finish local-first: outbox before writes, retry idempotent attempt/progress/review steps;
  snapshot lasts 7 days, guest store clears only after all writes, and completed-run counts omit explain/read-aloud. See [sync rules](src/lib/course/syncOutbox.js).
- Three sitting parts have pauses; guest save ask replaces the FIRST pause, never one answer.
  Can-dos lead recap/home; scores stay in closed details; no XP/automatic tours; one course-review destination. See [Wave 1](docs/agents/claude-reference.md#conventions--gotchas).
- Writing starters come from L2/L4 model text; one improved version costs no other task on
  any tier. FSRS/help evidence wait for owner migration; do not shorten the L2 notice. See [Wave 1 details](docs/agents/claude-reference.md#conventions--gotchas).
- A1.2 stays paused and in `DRAFT_CURRICULA`, never `CURRICULA`, until the owner reopens it.
  Audio says “Computerstimme” until real manifests exist. See [course history](docs/agents/claude-reference.md#current-state--open-threads).

## Security, functions and operations

- Secrets fail closed (`CAMPAIGN_SECRET`/`UNSUB_SECRET`); no fallback secrets or widened
  daily-sentence/send-daily-test auth. `.mcp.json` contains only environment references, never credentials. See [security details](docs/agents/claude-reference.md#conventions--gotchas).
- Functions use v1 `export const handler`, per-file CORS, and verified JWT identity from
  `_shared/auth.mjs`, never request bodies; daily-sentence scheduler detection uses `next_run`. See [function conventions](docs/agents/claude-reference.md#conventions--gotchas).
- Privileged subscription/profile/trial writes are service-role only. SQL is hand-applied;
  never assume a migration landed or replay archived SQL. See [migration ledger](migrations/README.md) for status and new-file rules.
- Lifecycle jobs claim unique user+kind BEFORE send, share `lifecycle_customer_state`, and keep
  disjoint trial/activation windows. Honor enable flags, dry/canary controls and migration guards; never falsely claim inactivity. See [lifecycle rules](docs/agents/claude-reference.md#conventions--gotchas).
- Support is draft-only; production agent incidents are service-role only. Consult
  [production-agent operations](docs/agents/production-agents.md) and verify live flags rather than dated notes.
- Astro reads retry three times then use the committed cache for the whole build with a warning;
  check Supabase project status and refresh the cache after a fallback. See [outage context](docs/agents/claude-reference.md#conventions--gotchas).
- Use available connectors for blocked production hosts; credentials live in the environment.
  Vendored REA/scroll-craft provenance and overrides stay intact. See [environment history](docs/agents/claude-reference.md#conventions--gotchas).
- Follow [steward gates](.claude/skills/steward/SKILL.md); current explicit user authorization wins.
  Team v5 reserves money, access/limits, legal, brand messages, security/auth/RLS/public endpoints, customer deletion and CLAUDE changes for owner approval.
- Social: preserve the active `drafts/instagram-100/posts.csv` path; later packs use 2–4 images
  where needed, checked exam facts, tokens and UTM captions. See [channel constraints](docs/agents/claude-reference.md#conventions--gotchas).

## Commands

```bash
npm run dev                 # SPA dev server
npm run build               # optimize images + Vite → dist/
npm run lint                # ESLint: zero warnings
npm run check:duplicates     # byte-identical manifest pairs
npm test                    # ALL flat tests/*.test.mjs; mandatory CI gate
npm run test:course          # focused course checks; supplements npm test
npm run test:site            # focused site checks; supplements npm test
npm run build:verify         # clean SPA build + prerender + HTML, SPA only
npm --prefix astro-site run build  # live content with PUBLIC_SUPABASE_URL/_ANON_KEY
GRAMMAR_CONTENT_CACHE="$PWD/grammar-content-cache.json" npm --prefix astro-site run build
node scripts/dump-grammar-cache.mjs grammar-content-cache.json  # network required
node scripts/evaluate-site.mjs --out .cache/evaluation/manual  # browser walkthrough
```

CI runs lint, duplicate check, full tests, function syntax, SPA build, offline Astro build,
merge, prerender and full built HTML verification (no `--spa-only`); cache age >30 days warns.
See [CI](.github/workflows/ci.yml), [script effects](scripts/README.md), [test map](tests/README.md)
and [documentation authorities/history](docs/README.md). Refresh stale cache before treating it as live content.
