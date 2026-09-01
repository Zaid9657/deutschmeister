# Assessment of the reports and documentation structure (2026-08-31)

Scope: every report, audit, plan, draft, and doc-adjacent file in the repository —
`EVALUATION.md`, `AUDIT-2026-08-16.md`, `REMEDIATION.md`, `README.md`, `docs/**`,
`drafts/**`, `migrations/README.md` + notes — assessed for structure, currency,
navigability, and internal consistency. Every claim below was checked against the named
file this session; where a doc disagreed with code, the code (`.github/workflows/ci.yml`,
`package.json`, `tests/`, `scripts/`) was read directly.

Companion files created with this assessment:

- [`docs/README.md`](./README.md) — the documentation map (entry point, statuses, read order)
- [`docs/open-actions.md`](./open-actions.md) — consolidated open items / owner actions
- [`.claude/JOURNAL.md`](../.claude/JOURNAL.md) — the correction log the roadmap's item 3.5 called for

---

## Verdict in one paragraph

The *content* of this report corpus is unusually good — evidence-based, provenance-inline,
honest about its own errors, and backed by tests that enforce its findings. The *structure*
is where it loses value: there was no index or entry point, no explicit live/superseded
marking, open items were scattered across at least five documents (which has already caused
completed work to reappear as open and open items to survive silently), the roadmap file has
grown into a 575-line plan-plus-journal hybrid, and the root `README.md` has drifted from
the CI it describes. None of these are content defects; all of them are findable-and-fixable
navigation defects, and the three companion files above close the worst of them.

---

## What exists (inventory summary)

Four report generations, each superseding parts of the last:

1. **v1 remediation** (PR #13, referenced only from within EVALUATION) — security/SEO fixes.
2. **The 2026-08-16 cycle**: `EVALUATION.md` (v2, measured), `AUDIT-2026-08-16.md`
   (six parallel audits), `REMEDIATION.md` (four fix passes, merged 08-18).
3. **The 2026-08-22 parity cycle**: `docs/medmeister-parity-roadmap.md` + Batches A–F,
   plus the SEO-routines machinery (`docs/seo-routines/`, `drafts/` ledger).
4. **The 2026-08-24 SEO cycle**: `drafts/seo-audit-2026-08-24.md`,
   `seo-CORRECTION-2026-08-24.md`, two Class-B drafts.

Plus the applied-migrations ledger (`migrations/README.md`), evaluation artifacts
(`docs/evaluation/`), and eleven historical root SQL files.

---

## Strengths — practices worth keeping exactly as they are

1. **Dated records are immutable; corrections are new files.** `seo-BLOCKED-2026-08-22.md`
   was wrong within two days and was *not* edited — `seo-CORRECTION-2026-08-24.md`
   supersedes it by name. The trend stays auditable. This is the corpus's best habit.
2. **Findings are falsifiable.** Every claim carries SQL, `file:line`, or a measured
   number; claims that failed verification are listed as retracted *inside the report
   that made them* (AUDIT retracted two; the roadmap retracted four; EVALUATION one).
3. **Reports become guards.** Findings didn't stay prose: `tests/claims.test.mjs`,
   `brand.test.mjs`, `guides.test.mjs`, `lifecycle.test.mjs`, `head-tags.test.mjs`, and
   `check-built-html.mjs` (16 → 93 pages) enforce them on every PR. The 08-24 audit's
   headline — a case-sensitive banned-literal check that never fired — shows why the
   guards themselves also need kill-testing, which Batch F did.
4. **The Class A / Class B split** keeps the autonomous lane honest: nothing asserting a
   new fact about exams, law, or people self-merges.
5. **The migrations ledger** is a model: one table, applied-dates, idempotency rules, and
   an explicit "root SQL is historical, do not re-run".

## Structural problems

### 1. No entry point; live vs. superseded is implicit (now fixed)

Before this assessment, the only map of the corpus lived in cross-references buried inside
the files themselves (and in the agent-instructions file, which is not a reader's index).
`EVALUATION.md` says "read it with AUDIT and REMEDIATION, which supersede much of it" —
in its *own* closing sections, findable only after reading it. A newcomer cannot tell that
EVALUATION's perf-62 numbers were retracted, that its reading counts were later re-measured
wrong, or that its roadmap is dead. **Fixed by `docs/README.md`** with per-file status.

### 2. `README.md` drift (open — recommend fixing in a follow-up)

The root readme disagrees with the code in four measured places:

| README says | Reality |
|---|---|
| "ESLint (errors fail; legacy warnings tolerated)" | `package.json`: `eslint . --max-warnings=0` — warnings fail (ratcheted 2026-08-24) |
| CI runs "lint, the duplicate check, a syntax check … and the SPA build"; "The Astro build runs only on Netlify (it needs Supabase credentials)" | `ci.yml` also runs `npm test`, builds **Astro offline** from the committed `grammar-content-cache.json`, merges dist, prerenders, and runs `check-built-html.mjs` over all ~95 pages |
| Quality-gates list omits `npm test`, `npm run build:verify`, `npm run check:html` | All three exist and gate CI |
| "See `EVALUATION.md` for the full audit" | EVALUATION is the *oldest* of four report generations; no mention of REMEDIATION, the roadmap, or the 08-24 audit |

This is exactly the doc-rot class the corpus keeps catching elsewhere. Recommended fix:
update those two sections and point the audit line at `docs/README.md`. Deliberately not
done in this assessment commit to keep it purely additive and reviewable.

### 3. Open items scattered across five-plus documents (now consolidated)

"Still open" lists live in: REMEDIATION §"Still open — needs the owner" (7 items), the
roadmap §3.6 + §"Current state" in CLAUDE-adjacent docs, `docs/seo-routines/README.md`
owner steps, `seo-CORRECTION-2026-08-24.md` owner checklist, `seo-audit-2026-08-24.md`
§"Needs your decision" + §Roadmap, and two Class-B drafts. The measurable cost — items
have already desynchronised:

- **De-CAPS of shouting grammar rules**: `migrations/README.md` records it **applied
  2026-08-16** (270 rows, 892 edits), yet the roadmap's §3.4 (written 2026-08-22) still
  lists "de-CAPS the 222 rules at source" as open, and EVALUATION's roadmap carried it
  too. Either the migration record or the roadmap item is wrong — verify against the DB
  before anyone works it.
- **`related_slugs`**: EVALUATION measured 0/64; the content-cleanup migration records
  it populated for all 64 on 2026-08-16; the roadmap first repeated 0/64, then corrected
  itself (Batch D). Three documents, three states.
- The service-role key rotation has been open since **2026-08-16** across four documents
  with no single place tracking its age.

**Fixed by `docs/open-actions.md`** — an index into the sources (sources win on conflict),
with the two discrepancies above flagged for verification rather than silently resolved.

### 4. The roadmap has become a journal (recommend splitting on next batch)

`docs/medmeister-parity-roadmap.md` is 575 lines: plan + six batch completion reports +
four self-corrections + process notes (the squash-merge/rebase trap, the CI-trigger
sequence). The batch reports are appended non-chronologically (B's report sits between
the defects table and C's; F's precedes C's and D's), so reconstructing "what happened
when" requires reading the whole file. The plan half is genuinely live; the journal half
belongs elsewhere. Recommendation: when the next batch ships, move batch reports to
`docs/batches/<date>-<batch>.md` (dated, immutable — same convention as `drafts/`) and
leave the roadmap as the status table + tiers. Process lessons (rebase-not-merge, CI
trigger order) belong in a working-notes doc, not inside a roadmap entry where they'll
never be found again.

### 5. Naming carries no status signal

`AUDIT-2026-08-16.md` is dated; `EVALUATION.md` and `REMEDIATION.md` are not (EVALUATION
is also 08-16; REMEDIATION spans 08-16→08-18 and was appended to four times). `drafts/`
got the convention right (`<type>-<date>.md`). Recommendation going forward: every new
report file is dated in its name; undated names are reserved for living documents
(README, roadmap, open-actions). Renaming the existing three is *not* recommended — too
many inbound references — the status column in `docs/README.md` does the job.

### 6. `drafts/` mixes genres — acceptable now, will not scale

One flat folder holds: routine BLOCKED/CORRECTION records, an ad-hoc audit, a content
brief, an E-E-A-T draft, and the CSV ledger. The filename prefixes (`seo-`, `brief-`,
`eeat-`) currently disambiguate, and the routines' conventions hard-code these paths — so
leave it. If the Routines go live (weekly + fortnightly reports landing here), revisit
with subfolders (`drafts/reports/`, `drafts/briefs/`) and update both routine prompts in
the same commit.

### 7. Frozen artifacts that silently overstate

`docs/evaluation/lighthouse.json` backs EVALUATION's retracted perf-62 numbers (the
no-gzip harness artifact). Nothing marks the JSON itself as superseded. Covered by the
status column in `docs/README.md`; anyone re-running comparisons must use the fixed
`lighthouse-batch.mjs`.

### 8. Cross-report contradictions left standing (informational)

Beyond §3's items: EVALUATION's content table still reads "Reading: 52 lessons, 1–16 per
level" and "1,982 words" — both re-measured wrong on 08-24 (66 total, flat 8/level;
1,935 words). Correct behaviour is *not* to edit the frozen record; the correction chain
is now traceable through `.claude/JOURNAL.md`, which is the missing piece item 3.5 of the
roadmap asked for ("corrections logged in the same commit as the fix").

---

## Recommendations, ranked

1. **Done in this commit:** `docs/README.md` (map + statuses), `docs/open-actions.md`
   (consolidated tracker), `.claude/JOURNAL.md` (correction log, seeded from the eight
   documented correction events).
2. **Next small PR:** fix the four `README.md` drift rows above; point its audit line at
   `docs/README.md`.
3. **Verify the two data discrepancies** (de-CAPS, `related_slugs`) against the live DB
   and record the answer in `open-actions.md` + JOURNAL — whichever document was wrong.
4. **On the next batch:** split batch completion reports out of the roadmap into dated
   files; adopt name-dating for all new reports.
5. **Standing rule** (add to the working conventions when CLAUDE.md is next edited —
   deliberately not edited here): any commit that closes an item listed in
   `open-actions.md` updates that file in the same commit; any retraction or superseded
   claim gets a JOURNAL row in the same commit.

## What was deliberately not done

- `CLAUDE.md` was not read from disk and not modified, per the owner's instruction.
- No frozen report was edited — including the stale figures in EVALUATION and the
  superseded diagnosis in `seo-BLOCKED-2026-08-22.md`. Immutability of dated records is
  the corpus's best property; this assessment works with it, not around it.
- `README.md` was not fixed here, to keep this change purely additive (see rec. 2).
- The de-CAPS / `related_slugs` discrepancies were flagged, not resolved — resolving them
  requires a live DB read, which belongs in its own verified change.
