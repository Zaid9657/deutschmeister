# Fortnightly measurement — DeutschMeister

You are the DeutschMeister SEO measurement routine, running in a fresh session on
`Zaid9657/deutschmeister`. Execute this file exactly as written.

**This routine measures and briefs. It does not ship code.** The weekly GEO routine
(`geo-weekly.md`) is what changes pages. Keeping them separate is deliberate: a run that both
measures and builds tends to measure whatever it already wanted to build.

---

## Phase 0 — preflight

1. Verify both connectors answer with real data (see `geo-weekly.md` Phase 0 — a tool in the list
   proves nothing).
2. **Guard against an early run.** This routine is meant to fire on the 1st and 15th. If the most
   recent `drafts/seo-refresh-*.md` is **less than 12 days old**, stop and say so: two runs close
   together produce a comparison across noise, not across time.
3. If a connector is unavailable, write `drafts/seo-BLOCKED-<date>.md` naming it and the evidence,
   then stop. Never substitute a plain web search for a rank measurement.

---

## Phase 1 — measure

### 1a. Where we stand (GSC, last 28 days vs. the previous 28)

- Total impressions, clicks, average position — and the delta.
- Top 30 queries by impressions, with position and CTR.
- **New queries**: surfacing now, absent last period. This is where genuine growth shows first.
- **Lost queries**: had impressions last period, none now.
- Per-page: the ten pages with the most impressions, and their CTR.

### 1b. What the market looks like (DataForSEO)

Batch every request — billing is per request, not per keyword.

- Search volume, Germany / German, for the current guide and topic set:
  telc B1 · telc B2 · Goethe-Zertifikat B1 · DTZ · TestDaF · Deutsch lernen online ·
  Deutsch Grammatik üben · Deutsch B1 Einbürgerung · Deutsch Sprechen üben.
- For each of the top 10 by volume: who holds the top 5, and whether the SERP is dominated by an
  official body (goethe.de, telc.net, bamf.de) or by beatable content sites.
- Keyword ideas around the exam terms, filtered to those with a realistic path — see the
  do-not-invest rule below.

### 1c. Content coverage

Compare what the site has against what the measurement says people search for:

- Guides live: `astro-site/src/data/guides/` (four as of 2026-08-22 — telc B1, Goethe B1, telc B2, DTZ).
- Grammar topics live: 64, one page each.
- Comparison pages: three, in `src/data/competitorComparisons.js`.

Name the gaps as **specific pages that do not exist**, with the query that justifies each.

---

## Phase 2 — brief, do not build

Produce at most **three** content briefs, ranked. Each brief states:

- the target query and its measured volume (never an estimate presented as a measurement)
- who currently holds the ground, and why they are beatable — or that they are not
- the page that should own it: a new guide, an existing guide extended, or a comparison
- the funnel step it serves (level test → free A1.1 → guide → subscription)
- the facts that would need sourcing, and from which official body

Write them to `drafts/brief-<slug>.md`. **Do not write the page.** The point of a brief is that a
human decides whether it is worth writing before anyone writes it.

### The do-not-invest rule

Some queries are held by the exam bodies themselves — goethe.de for Goethe formats, telc.net for
telc, bamf.de for integration-course rules. We will not outrank a primary source on its own
definition, and pretending otherwise burns cycles. For those, the realistic play is the adjacent
question: preparation, comparison between exams, what the result means in practice. Say so
explicitly in the report rather than briefing an unwinnable page.

---

## Phase 3 — report

Write `drafts/seo-refresh-<date>.md`:

1. **The numbers**, with deltas against the previous run, and a one-line reading of each.
2. **Near-misses**: positions 8–20 with real impressions — cheapest wins available.
3. **CTR outliers**: high impressions, low clicks. Usually a title or opening problem, not a
   content problem.
4. **The three briefs**, ranked, with the reasoning.
5. **Do-not-invest**, with the reason per query.
6. **What changed since last time** — including whether the previous cycle's shipped fix moved
   anything. A fix whose effect was never checked is indistinguishable from one that did nothing.

Then stop. No PR, no page edits. If something urgent surfaces — a page fallen out of the index, a
claim that has become false — say so at the top of the report and flag it for the weekly routine.

---

## A note on new pages

GSC only reports on pages Google has already crawled and served. The four Leitfäden shipped on
2026-08-22 will show nothing for weeks, and the hub at `/leitfaden/` is newer still. Their absence
from a report in the first month is **not** a finding, and must not be written up as one.
