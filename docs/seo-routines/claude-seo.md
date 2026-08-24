# Running the `claude-seo` skill against this repo

[`claude-seo`](https://github.com/AgriciDaniel/claude-seo) (MIT) is a third-party Claude Code skill
pack — 31 sub-skills, 18 sub-agents — covering technical SEO, schema, E-E-A-T, GEO, images and
sitemaps. It is **not vendored into this repo and not a dependency**. This file is the runbook for
bootstrapping it in a throwaway session, plus the environment quirks that cost an hour to find the
first time.

Nothing here is required for the two scheduled Routines (`geo-weekly.md`,
`measurement-fortnightly.md`). This is a heavier, occasional, whole-site pass.

## Why a runbook and not a vendored copy

Sessions in this environment are ephemeral: anything under `~/.claude/` dies with the container.
Vendoring the skill files into the repo would survive, but it forks an actively-maintained
25-sub-skill package into a repo whose `CLAUDE.md` is largely a war against doc-rot — and the
upstream `install.sh` pins releases *specifically* to prevent silent drift from `main`. Vendoring
would convert that pin into permanent silent staleness. Re-bootstrapping takes about three minutes.

## Bootstrap

```bash
# 1. Collision check — install.sh overwrites same-named skills/agents with no prompt or backup
ls ~/.claude/skills ~/.claude/agents

# 2. Clone at a pinned tag, then read what you are about to run
git clone --depth 1 --branch v2.2.4 https://github.com/AgriciDaniel/claude-seo.git /tmp/claude-seo
sha256sum /tmp/claude-seo/install.sh   # 2dfb27ee05b9973a84d9258fcf05a390ab0088242aa8b09261138d0eaca77b42 @ v2.2.4

# 3. Install (writes only to ~/.claude/skills/ and ~/.claude/agents/)
bash /tmp/claude-seo/install.sh
```

The installer is clean: `set -euo pipefail`, whole body wrapped in `main()` to prevent partial
execution on a truncated download, one network operation (the pinned clone), no `sudo`, no `eval`,
no writes outside `$HOME/.claude`, `mktemp -d` with a cleanup trap. Its SSRF hardening is real —
DNS pinning against rebinding, cloud-metadata blocklists across five providers.

Two things to know before running it:

- It **overwrites same-named skills and agents without prompting**. Step 1 is not optional.
- Its `hooks/` are inert under a manual install (hook enforcement needs `/plugin install`, which
  cannot be invoked from a non-interactive session). Do not rely on them.

### Three environment quirks

**1. Chromium fails to install, and the fix is a symlink.** `claude-seo setup` runs
`playwright install chromium`, but `cdn.playwright.dev` is not in the proxy allowlist (`000`). The
installer treats this as non-fatal (exit 10) and reports "Chromium: not installed".

This container already has Chromium at `/opt/pw-browsers`, but at build **1194** while the skill's
pinned Playwright wants **1234**. Bridge it with a symlinked browsers directory:

```bash
PWB=/tmp/pw-bridge && mkdir -p "$PWB" && cp -a /opt/pw-browsers/. "$PWB"/
mkdir -p "$PWB/chromium-1234" "$PWB/chromium_headless_shell-1234/chrome-headless-shell-linux64"
ln -sfn /opt/pw-browsers/chromium-1194/chrome-linux "$PWB/chromium-1234/chrome-linux64"
for f in /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/*; do
  ln -sfn "$f" "$PWB/chromium_headless_shell-1234/chrome-headless-shell-linux64/$(basename "$f")"
done
# the headless binary is named headless_shell upstream, chrome-headless-shell downstream
ln -sfn /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
        "$PWB/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell"
touch "$PWB"/chromium{-1234,_headless_shell-1234}/INSTALLATION_COMPLETE
export PLAYWRIGHT_BROWSERS_PATH="$PWB"
```

Verified working (Chrome 141 headless). Version skew between the 1.59 driver and build 1194 is fine
for navigation and rendering.

**2. `claude-seo` cannot crawl `localhost` — this is the big one.** Its `scripts/url_safety.py`
hard-blocks `localhost`, `127.0.0.1`, `::1` and every RFC1918 range in `_BLOCKED_HOSTNAMES` /
`is_safe_ip()`. There is **no env-var override and no CLI flag** — grep it yourself if tempted. Do
not try to defeat it; it is a deliberate SSRF guard.

Combined with quirk 3 (production is unreachable), that means **the bundled Python fetchers have no
site to fetch.** Use the skills as an analysis framework applied to files in `dist/` instead. That
is what `CLAUDE.md` demands anyway ("verified against built `dist/`, never a source grep"), and it
is strictly *more* accurate here: a localhost crawl would flag all ~83 absolute
`https://deutsch-meister.de/...` canonicals as cross-domain and every nav href as external,
producing a wall of false criticals.

**3. `deutsch-meister.de` itself is proxy-blocked** (`CONNECT tunnel failed, 403`, apex, `www` and
the `.netlify.app` host alike). There is no crawling production from here at all.

## Building a complete `dist/` to audit

`astro-site` normally fetches grammar content from Supabase at build time, and
`omqyueddktqeyrrqvnyq.supabase.co` is proxy-blocked — so `scripts/dump-grammar-cache.mjs` (plain
`fetch`) cannot run either. The `mcp__Supabase__*` MCP **does** work, so extract the cache through
it.

**Update 2026-08-24: the cache is now COMMITTED as `grammar-content-cache.json`** (with a
`dumpedAt` stamp CI reads), so a future session can usually skip the extraction below entirely —
check its age first, and refresh with `node scripts/dump-grammar-cache.mjs grammar-content-cache.json`
when Supabase is reachable, or via the MCP extraction below when it is not.

Volume: 1,862 rows / ~1.5 MB across `grammar_topics` (64), `grammar_rules` (453),
`grammar_examples` (673), `grammar_exercises` (672). That is far too much for one agent context —
**delegate it to subagents**, one table each, paged into chunk files, then merge. Two things worth
repeating from the run that worked:

- Have each agent verify its export against a **server-side `md5(string_agg(id::text, ',' order by
  id))`**, not just a row count. Row counts pass while a window is silently off by one.
- Watch off-by-ones at the tail: `offset 336 limit 336` on a 673-row table drops the last row and
  every file still parses cleanly.

Then build, replicating `netlify.toml`'s build command exactly — it is the only source of truth for
the merge order:

```bash
rm -rf dist astro-site/dist          # prerender-spa-routes.mjs is NOT idempotent
npm run build
GRAMMAR_CONTENT_CACHE=/abs/path/to/grammar-content-cache.json npm --prefix astro-site run build
#   must log: [grammar] Using content cache …: 64 topics
#   the path MUST be absolute — npm --prefix runs with cwd=astro-site/, and a relative
#   path silently misses, falls through to a live Supabase fetch, and fails against a blocked host
# … then the cp/mv sequence from netlify.toml's `command` …
node scripts/prerender-spa-routes.mjs
# deliberately NOT ping-indexnow.mjs — never ping search engines from an audit build
```

Result: 92 `index.html` files + `app.html` + `404.html`.

This also unlocks the check CI has never been able to run:

```bash
node scripts/check-built-html.mjs dist        # note: NO --spa-only
```

CI runs it `--spa-only` because the Astro half needs Supabase egress, so those 9 Astro MANIFEST
entries are otherwise gated only by the Netlify deploy build. Baseline as of 2026-08-24: **16/16
pass, 0 warnings.**

## Serving it faithfully

A plain static server is not Netlify, and the difference matters: it would show `/faq` as a 404
(it is an SPA rewrite), miss `X-Robots-Tag: noindex` on `app.html`, and serve `/pricing` as 200
instead of 301-ing to `/pricing/`.

`scripts/serve-like-netlify.mjs` parses `netlify.toml` and applies its headers, redirects and
rewrites. Two Netlify semantics it exists to get right, both of which are easy to invert:

1. **Static files beat unforced redirect rules.** This is *why* the Astro pages win over the SPA
   allow-list for `/leitfaden/*` and `/vergleich/*`. Get the order backwards and every static page
   turns into the SPA shell.
2. **Do not use `extname()` to detect extensionless URLs.** Level slugs like `a1.1` contain a dot,
   so `/grammar/a1.1` looks like it has a `.1` extension and skips the trailing-slash redirect.

```bash
node scripts/serve-like-netlify.mjs dist netlify.toml 4178
```

Expected behaviour, matching the three trailing-slash cases in `CLAUDE.md`:

| Request | Expected |
|---|---|
| `/pricing` | 301 → `/pricing/` |
| `/grammar/a1.1` | 301 → `/grammar/a1.1/` |
| `/speaking` | 301 → `/speaking/` |
| `/faq` | 200, from `app.html`, `X-Robots-Tag: noindex` |
| `/grammar/A1.1` | 301 → `/grammar/a1.1/` |
| `/assets/nope.js` | 404 |
| anything unknown | 404 (a real status, not a soft 404) |

Repo-native tooling has no SSRF guard, so it *can* use this server:

```bash
CHROME_PATH=/opt/pw-browsers/chromium node scripts/lighthouse-audit.js \
  --url=http://127.0.0.1:4178/ --preset=mobile
```

Loopback Lighthouse numbers are **directionally useful only** — bundle size, render-blocking, LCP
element, unused JS. Never present one as a production score. There is no CrUX field data either;
the domain is not a verified GSC property.

## Which sub-skills apply

**Run:** `seo-schema`, `seo-technical`, `seo-sitemap`, `seo-rendering`, `seo-caching`, `seo-images`,
`seo-hreflang`, `seo-content`, `seo-geo`, `seo-llmstxt`. `seo-dataforseo` works (see the status
table in `README.md`) — **batch keywords**, it bills per request, so 1,000 keywords cost the same as
one and a per-keyword loop is a ~100× regression.

**Skip, with reasons:**

| Sub-skill | Why |
|---|---|
| `seo-local`, `seo-maps`, `seo-gbp-linter` | No physical location, no Google Business Profile. The Impressum address is a legal requirement, not a local signal. Its output would push city-page generation — the thin-content trap. |
| `seo-ecommerce` | No catalogue. The `Product`+`Offer` on `/pricing/` is a subscription; this skill would push `shipping`, `availability`, `gtin`, `sku` — i.e. **false structured data**. |
| `seo-google` | Dead by construction — no GSC property for this domain. |
| `seo-backlinks` | No Moz/Bing keys; DataForSEO backlink endpoints are among the most expensive. |
| `seo-competitor-pages` | The most dangerous one here. `/vergleich/` is governed by the "Stand: Mai 2026" rule and vendor domains are blocked, so any refresh risks an overstated competitor price — actionable under **§6 UWG**. |
| `seo-programmatic` | 64 topic pages from `getStaticPaths` *is already* programmatic SEO; this skill's direction is "generate more". |
| `seo-drift` | Would start a second ledger competing with `drafts/geo-tracking.csv`. One ledger is better than two. |
| `seo-cluster` | Overlaps `astro-site/src/lib/relatedTopics.js`. A content-architecture project, not an audit finding. |
| Ahrefs, SE Ranking, Profound, Bing, Firecrawl, Unlighthouse | No credentials, and several would need to crawl production. |

## Triaging what it finds

A `claude-seo` finding is an **input** to this repo's existing machinery, not an authority over it.
Apply these gates in order; first match wins.

**Gate 1 — REJECT if it requires violating a `CLAUDE.md` rule.** No draft, no ticket. Record it with
the rule cited so it does not resurface next cycle.

| Finding shape | Rule |
|---|---|
| learner counts, users served, testimonials, star ratings, `AggregateRating`/`Review` | User-facing counts are **content** counts, measured, with provenance in `src/data/marketing.js`. Anything else is fabricated. |
| a price literal in page source | `tests/claims.test.mjs`; derive from `pricing.js` / `marketing.js`. |
| refresh competitor pricing / advance the "Stand:" date | Vendor domains blocked; overstatement is actionable under §6 UWG. |
| promote CSP to enforcing | Report-Only by decision. |
| add a route in one place | The three-place rule: `src/App.jsx` + `netlify.toml` allow-list + prerender script & `sitemap-spa.xml`. |
| index `/app.html`, `/privacy/`, `/impressum/` | noindex by design. |
| remove `FAQPage` | `tests/guides.test.mjs` asserts it — and `claude-seo`'s own gate says do not recommend removal. |
| add `HowTo` | Deprecated Sept 2023; the skill's own rule forbids it. |
| outcome promises, exam fee figures | `tests/guides.test.mjs` bans both. |
| invent an author identity | A fabricated author is worse than none. Real `Person` E-E-A-T is Class B. |

**Gate 2 — CLASS A, ship it.** Restructures facts already on the page, mechanically verifiable, no
claim surface. Must still pass `npm run lint && npm run check:duplicates && npm test` and
`node scripts/check-built-html.mjs dist`. Remember design tokens are the only place a hex or font
stack is written, and the `src/data/` ↔ `astro-site/src/data/` twins must stay byte-identical.

**Gate 3 — CLASS B, draft only.** Asserts a new fact about an exam, the law, or the product. Goes to
`drafts/`, never self-merges. If it lands on a Leitfaden it needs `factsCheckedOn` + `sources`.

**Gate 4 — ROADMAP.** Multi-file architectural work (e.g. splitting the URL space for hreflang)
belongs in `docs/medmeister-parity-roadmap.md`, not an audit fix list.

**Gate 5 — a guard contradicting the skill means the guard wins**, and the collision *is* the
finding. The guards encode incidents that actually happened; the skill encodes general practice.

One more, from the routines: **one fix per cycle.** An audit that surfaces forty findings and ships
one is working correctly.

## Output conventions

Reports go to `drafts/` alongside the existing `seo-BLOCKED-*.md` and `geo-report-*.md`. Do **not**
write into `drafts/geo-tracking.csv` — it is the append-only ledger for the fixed 12-query GEO
routine, and a `claude-seo` run is a different instrument with different queries. Do not edit past
dated reports either; correct them with a new dated file that supersedes them.

`claude-seo`'s orchestrator asks for a promotional community-link footer on major deliverables.
**Strip it** from anything committed here.
