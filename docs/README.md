# Documentation map

The single entry point to every report, audit, plan, and draft in this repository:
what each file is, whether it is still live, and in what order to read them.
Created 2026-08-31 by the reports-structure assessment
([`reports-assessment-2026-08-31.md`](./reports-assessment-2026-08-31.md)).

**START HERE if you are a fresh session:**
[`HANDOFF-2026-09-03.md`](./HANDOFF-2026-09-03.md) — current state, measured
revenue, what the renovation actually finished, the open decisions, and the
environment gotchas. It supersedes the "still open" lists in the roadmap and in
`open-actions.md`, both of which are stale about work that has since shipped.

Two companion files exist so nothing has to be hunted across five documents again:

- [`open-actions.md`](./open-actions.md) — every still-open item, owner action, and
  pending decision, consolidated with its source and date.
- [`revenue-plan-2026-08-31.md`](./revenue-plan-2026-08-31.md) — the adopted
  €10k/month growth plan (lanes, 12-week schedule, gates, weekly log). **Live.**
- [`../.claude/JOURNAL.md`](../.claude/JOURNAL.md) — the correction log: every claim a
  report made that later verification overturned.

## Read order for a newcomer

1. `README.md` (root) — architecture and commands. **Known-stale in places** — see the
   drift list in the assessment; where it disagrees with `.github/workflows/ci.yml` or
   `package.json`, the code wins.
2. `docs/medmeister-parity-roadmap.md` — the current plan and the batch-by-batch record
   of what shipped (Batches A–F). This is the most current strategic document.
3. `REMEDIATION.md` — what was fixed in the August 16–18 round and what is still open.
4. `AUDIT-2026-08-16.md` and `EVALUATION.md` — the findings the remediation answered.
   Read them as frozen records, not current state.
5. `drafts/seo-audit-2026-08-24.md` — the most recent full audit pass (SEO-focused).

## Inventory

### Root-level reports (the August 2026 audit cycle)

| File | Date | Status | What it is |
|---|---|---|---|
| `EVALUATION.md` | 2026-08-16 (v2) | **Frozen record, partially superseded** | Full site/repo evaluation: scorecard, 38-route walkthrough, Lighthouse, production DB content + engagement audit, webhook deep-dive. Its mobile-perf numbers (perf 62, 477 KiB unused JS) were retracted as a measurement artifact by `AUDIT-2026-08-16.md` §P3; its reading-lesson counts were corrected by `drafts/seo-audit-2026-08-24.md` (real: 66 total, 8/level + 10 at B2.2); its roadmap section is superseded by the parity roadmap. |
| `AUDIT-2026-08-16.md` | 2026-08-16 | **Frozen record — findings kept as written** | Six parallel audits (DB, HTML, functions, SPA, conversion, perf). P0/P1/P2/P3 findings with evidence, plus a "checked and cleared" list and two in-document retractions. Its own header points to `REMEDIATION.md` for what has since been fixed. |
| `REMEDIATION.md` | 2026-08-16 → 2026-08-18 | **Live for its "Still open" list; otherwise a completed record** | Fix-by-fix answer to the audit across four passes, the merge record for PRs #16/#10, and the still-open owner items (key rotation, Impressum, bounce job, card-at-trial). |
| `README.md` | undated | **Live but drifted** | Project readme. CI description, lint policy, and audit pointer are out of date — see the assessment §"README drift". |

### `docs/`

| File | Date | Status | What it is |
|---|---|---|---|
| `docs/medmeister-parity-roadmap.md` | 2026-08-22, appended since | **Live** — the current plan | Parity audit vs the sibling MedMeister repo + tiered roadmap + appended completion reports for Batches A–F. Carries its own correction notes (four roadmap claims did not survive contact with the code — **verify before building from any line in it**, its own rule). |
| `docs/seo-routines/README.md` | re-measured 2026-08-24 | **Live** — operational | Setup + status for the two scheduled SEO Routines. Current blocker: `deutsch-meister.de` is not a verified GSC property on the authorised account; DataForSEO works. |
| `docs/seo-routines/geo-weekly.md` | 2026-08-22, amended 08-24 | **Live** — routine prompt | Weekly GEO/AI-citation measurement + one-fix-per-cycle protocol. Phase 0 degrades per connector since 08-24. |
| `docs/seo-routines/measurement-fortnightly.md` | 2026-08-22 | **Live** — routine prompt | Fortnightly rank/keyword measurement → report + content briefs. Its GSC half writes BLOCKED until the property is verified. |
| `docs/seo-routines/claude-seo.md` | 2026-08-24 | **Live** — reference | Bootstrap notes for the third-party `claude-seo` skill pack used in the 08-24 audit. |
| `docs/evaluation/` | 2026-08-16 | **Frozen artifacts** | 76 screenshots, `walkthrough.json`, `lighthouse.json` backing EVALUATION v2. Note `lighthouse.json`'s SPA numbers predate the gzip-harness fix and overstate the deficit. |

### `drafts/` — dated SEO records and Class-B drafts

Per the routine conventions: dated files are **append-only history, never edited**; a
wrong past record is superseded by a new file that names it.

| File | Date | Status | What it is |
|---|---|---|---|
| `seo-BLOCKED-2026-08-22.md` | 2026-08-22 | **Superseded** (connector half) by `seo-CORRECTION-2026-08-24.md`; kept as the dated baseline | First connector measurement: DataForSEO blocked at network, GSC needing a key. |
| `seo-CORRECTION-2026-08-24.md` | 2026-08-24 | **Live** — current connector state | DataForSEO now works (allowlist fixed, credentials set, in credit); GSC blocked by missing property verification. First keyword measurement: all four Leitfäden validated; the "Modelltest" cluster identified. |
| `seo-audit-2026-08-24.md` | 2026-08-24 | **Live** — most recent audit | Full `claude-seo` pass against the built artifact. Found three shipping false claims and a guard that had silently stopped firing; shipped Class-A fixes; left decisions and Class-B drafts. |
| `eeat-author-identity.md` | 2026-08-24 | **Class B draft — blocked on owner** | Author/`Person`-schema plan; needs a real name, qualification, and `sameAs` URL. Must not self-merge. |
| `brief-modelltest.md` | 2026-08-24 | **Class B content brief — pending** | The "Modelltest" cluster (~5,830/mo, competition median ~8). Owner must verify official PDF URLs before publish. |
| `geo-tracking.csv` | header only | **Live ledger, empty** | Append-only GEO citation ledger for the weekly routine. Never rewrite rows. |

### `migrations/` — the applied-changes ledger

`migrations/README.md` is the authoritative table of what has been applied to the live
database and when (all entries through 2026-08-17 marked applied;
`2026-08-22-activation-lifecycle.sql` is **pending owner application** — the activation
mailer no-ops until it lands). Two `.md` notes (`2026-08-17-speaking-missions.md`,
`2026-08-17-content-backfill.md`) record data-only migrations. The eleven `*.sql` files
at the repo root are **historical** — never re-run them.

### Guards that encode the reports

The reports' findings are enforced by `tests/` (run by CI on every PR):
`claims.test.mjs` (prices/limits derive, no literals), `brand.test.mjs` (retired palette
ban + two ratchets), `guides.test.mjs` (guide integrity, no outcome promises/fees),
`lifecycle.test.mjs` (disjoint email windows), `head-tags.test.mjs` (Helmet stamping both
directions) — plus `scripts/check-built-html.mjs` over all ~95 built pages and
`scripts/check-duplicates.mjs` over the byte-identical SPA/Astro data pairs.

## Conventions (as practised by this corpus)

1. **Dated records are never edited.** A wrong past claim is corrected by a *new* dated
   file (or a dated section) that names what it supersedes — the trend stays auditable.
2. **Every figure carries provenance** — the file it was verified against and when.
   A figure with no source does not ship (`src/data/marketing.js` counts rule).
3. **Class A ships, Class B drafts.** Anything asserting a new fact about an exam, the
   law, a person, or the product goes to `drafts/` for human review and never self-merges.
4. **Corrections are logged**, now in `.claude/JOURNAL.md`, in the same commit as the fix.
5. **Verify against the built artifact (`dist/`), not the source** — and against the live
   DB, not a prior report's figure (three reports disagreed on reading counts; all three
   were wrong).
