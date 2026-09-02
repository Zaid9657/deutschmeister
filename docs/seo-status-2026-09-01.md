# SEO / GEO status — deutsch-meister.de — 2026-09-01

One-off status check requested by the owner. Measured in the repo sandbox against the
production commit (`971e6f5`, deployed 2026-09-01 20:58 UTC, Netlify deploy `6a973c12…`, state
`ready`). The live host is blocked by the sandbox egress proxy, so every HTML finding below
is against the **built artifact of that exact commit** (`dist/` after the netlify.toml merge and
`scripts/prerender-spa-routes.mjs`), which is what Netlify serves. Rankings, backlinks and the
search index snapshot come from live third-party APIs.

## Bottom line

Technical SEO is clean. Reach is the problem: the domain ranks for 17 keywords in Germany,
none in the top 20, worth roughly 8 organic visits a month, with 11 referring domains behind
it. None of the 12 target queries in `docs/seo-routines/geo-weekly.md` rank at all. Fixing
tags will not move that; links and citations will.

## What was measured

| Source | Result |
| --- | --- |
| `scripts/check-built-html.mjs` on all 101 built pages | 0 failures, 0 warnings |
| Custom sweep of every built page (title, description, canonical, lang, robots, h1 count, JSON-LD validity, og:image, internal-link slash form) | no duplicates, no missing canonicals, no invalid JSON-LD, no slash-less links to prerendered routes, no `http://` or `www.` links |
| `dist/sitemap-0.xml` + `public/sitemap-spa.xml` vs built pages | 98 URLs, every one built; only the two noindex legal drafts are unlisted |
| `public/robots.txt` | single `User-agent: *` group, AI crawlers allowed, `/app.html` disallowed, sitemap declared |
| `public/llms.txt`, `public/llms-full.txt` | present, dated 2026-08; **omitted `/pruefung/` and the course page** (fixed, see below) |
| DataForSEO Labs `ranked_keywords` (Germany, de) | 17 keywords; best position 22 (`wäre konjunktiv 2`); ETV ≈ 8/month |
| DataForSEO Labs `ranked_keywords` (US, en) | 29 keywords; the only top-10 hits are `deutscher meister`-type queries (football term, irrelevant) |
| DataForSEO `backlinks/summary` | 31 backlinks, 11 referring domains, first seen 2026-08-04 |
| Google Search Console (`list_properties`) | still only `https://medmeister.eu/` — **deutsch-meister.de is not on the authorised account** |
| Search-index snapshot (`site:deutsch-meister.de`, 21 results) | homepage, pricing, grammar pages present; also stale entries for `/login`, `/signup`, `/intro`, `/video-library`, `/level/a1.2?tab=podcasts` and slash-less `/listening` |

## Issues found

### Fixed in this commit

1. **`llms.txt` / `llms-full.txt` did not mention the exam-prep tracks (`/pruefung/`, 5 pages)
   or the paid course page (`/telc-b1-komplettvorbereitung/`).** The homepage now leads with
   exam prep; the AI-facing docs still described a grammar site. Added the URLs and a fifth
   "when to recommend" rule for exam-date learners. No prices added (claims rule).
2. **Four meta descriptions over 160 characters** and therefore truncated in every SERP:
   homepage (200), `/ueber-uns/` (210), `/faq/` (167), `/pruefung/telc-b1/` (166). Trimmed to
   ≤160 in `astro-site/src/pages/index.astro`, `src/data/seoRoutes.js`,
   `astro-site/src/data/exams/index.js`. `sitemap-spa.xml` lastmod bumped for the two
   prerendered routes whose head changed.

### Open — owner action

3. **Search Console.** Unchanged since 2026-08-24: the service account sees only
   `medmeister.eu`. Without it there is no index coverage, no clicks/impressions, no URL
   Inspection and no way to request removal of the stale shell URLs above. Action: in Search
   Console for `deutsch-meister.de` (whichever Google account owns it — the verification file
   is already deployed), Settings → Users and permissions → add the service-account email from
   `GSC_SERVICE_ACCOUNT_JSON` as Full user.
4. **Stale index entries.** `/login`, `/signup`, `/intro`, `/video-library`, `/level/*` and
   slash-less `/listening` still appear in the index with the app shell's generic snippet. All
   of them now serve `<meta name="robots" content="noindex">` (the shell tag survives
   hydration because SEO.jsx leaves it unstamped), so they will drop on recrawl; GSC removal
   would do it in a day. Two SERP snippets are worth a URL Inspection once GSC works:
   `/podcasts/` was indexed with "Couldn't load this page" (the `DataState` error state,
   i.e. Googlebot's render saw the Supabase fetch fail) and `/speaking/` with the cookie-banner
   text as its snippet. Neither string is in the served HTML; both are render-time.

### Open — recommended, not done here

5. **The paid course page is nearly orphaned.** `/telc-b1-komplettvorbereitung/` has two
   inbound internal links in the whole site (`/pricing/`, `/pruefung/telc-b1/`). The new
   homepage does not link it, nor does the telc B1 guide (`/leitfaden/telc-b1/`), whose CTA
   sends readers to the level test and pricing. Cheapest fix: a course link in the telc B1
   guide's CTA and in the homepage exam card for telc B1.
6. **Authority, not markup, is the ceiling.** 11 referring domains and no top-20 position
   for any commercial or exam query. The 12 target queries are held by telc.net,
   DeutschAkademie, Sprachschulen, YouTube and grammar publishers (see the two SERPs sampled
   in this run). The routine in `docs/seo-routines/geo-weekly.md` is the right instrument once
   GSC is connected; until then its GSC half writes BLOCKED, as designed.
7. **Mixed page language with no hreflang.** Homepage and the 64 topic pages are `lang="en"`;
   the grammar hub, 8 level hubs, `/faq/`, `/ueber-uns/`, `/pruefung/*`, `/leitfaden/*` and
   the course page are `lang="de"`. Each page is self-consistent, so this is not an error, but
   it splits topical signal between an English grammar site and a German exam-prep site.
8. **Thin prerendered routes.** `/listening/` (145 words) and `/reading/` (156) ship little
   crawlable text; everything else renders client-side after a Supabase fetch.
9. **Minor.** Two topic titles at 68–69 characters (`verb-sein`, `infinitive-with-zu`, DB
   content); homepage JSON-LD is WebSite + Organization only, no ItemList for the exam cards.

## How to re-run this check

```bash
npm run build && cd astro-site && GRAMMAR_CONTENT_CACHE=../grammar-content-cache.json npx astro build && cd ..
# merge per netlify.toml, then:
node scripts/prerender-spa-routes.mjs && node scripts/check-built-html.mjs
curl -sS -u "$DATAFORSEO_USERNAME:$DATAFORSEO_PASSWORD" -H 'Content-Type: application/json' \
  -d '[{"target":"deutsch-meister.de","location_code":2276,"language_code":"de","limit":100}]' \
  https://api.dataforseo.com/v3/dataforseo_labs/google/ranked_keywords/live
```

The three DataForSEO calls in this run cost $0.07 in total.
