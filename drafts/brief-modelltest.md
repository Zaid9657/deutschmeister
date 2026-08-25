# Content brief: the "Modelltest" cluster (2026-08-24)

Per the `measurement-fortnightly.md` convention: a brief, not a page. **Class B throughout** — a
Modelltest page walks readers through exam structure and task types, which are exam facts; it needs
`factsCheckedOn` + `sources` like every guide, and it must not self-merge.

## Why this cluster

Identified in `seo-CORRECTION-2026-08-24.md` and re-measured with modifier variants today
(DataForSEO, Germany/de, 2026-08-24). It is the lowest-competition cluster measured on this domain,
it is practice-test intent — the closest intent to the product there is — and nobody strong holds it:

| Query | Vol/mo | Competition idx |
|---|---|---|
| `telc b1 modelltest` | 1,600 | 15 |
| `telc b2 modelltest` | 1,300 | 14 |
| `b1 prüfung modelltest` | 720 | 34 |
| `dtz modelltest` | 720 | 10 |
| `goethe b1 modelltest` | 590 | 6 |
| `telc b2 modelltest pdf` | 590 | 3 |
| `telc b1 modelltest pdf` | 170 | 2 |
| `goethe zertifikat b1 modelltest` | 70 | 9 |
| `dtz übungstest` | 70 | 5 |
| **Combined** | **≈5,830** | **2–34, median ~8** |

Trend note: the two `pdf` variants roughly tripled over the last 12 months (`telc b2 modelltest pdf`
170→720). People want a downloadable practice test.

## The shape that wins

The searcher wants **the official Modelltest PDF plus orientation**: what the test contains, how it
is scored, how to self-mark. telc and Goethe both publish their Modelltests free; ranking pages are
mostly thin link farms around those PDFs. The honest, differentiated play:

1. **One page per exam, extending the existing guide** rather than a new page type — e.g. a
   `#modelltest` section in each Leitfaden, or a `/leitfaden/<exam>-modelltest/` guide module if the
   section outgrows the page. The guide engine already handles anchors, TOC, FAQ and facts
   discipline; reuse it.
2. **Link out to the official PDFs** (telc.net, goethe.de downloads) — the do-not-invest list in
   `geo-weekly.md` already says we cannot outrank the publishers for their own assets, so *be the
   best orientation layer around them* instead.
3. **A self-marking walkthrough**: how the answer key maps to the 60% rule (the pass-mark facts are
   already verified on each guide — restate, never re-derive).
4. **Then the product**: the level test and the topic exercises are the interactive follow-up the
   PDFs cannot offer.

## Constraints (all binding)

- **No fabricated Modelltest content.** We do not reproduce telc/Goethe test items — copyright, and
  a wrong item teaches the wrong exam.
- **No outcome promises, no fee figures** (`tests/guides.test.mjs` bans both).
- Vendor domains (telc.net, goethe.de) are proxy-blocked from agent sessions — the **owner must
  verify the current Modelltest download URLs** before publish; a dead or superseded PDF link is the
  fastest way to lose the trust this page exists to build. Record them in `sources` with
  `factsCheckedOn`.
- New guide = data module + `GUIDES` line (+ the check-built-html manifest picks it up
  automatically now that it discovers pages).

## Priority

After the current PR lands. Suggested order by volume-to-competition: telc-b1 → telc-b2 → goethe-b1
(its 590/6 is the single softest target measured) → dtz.
