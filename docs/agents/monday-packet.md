Use this fixed nine-line Monday template (repeat currency amounts within lines, never add currencies together):

```text
P&L 7d / 30d [{currency}]: gross {amounts}; VAT {known amounts + UNKNOWN flags}; LS fees {known amounts + UNKNOWN flags}; refunds {known amounts + UNKNOWN flags}; net {amounts or UNKNOWN}.
Funnel telc_b1_komplett, 30d purchase cohort: purchases {n}; refunded {n}; active course access now {n}.
Canary: 7d timing {PASS/FAIL}; expected/seen cycles {n/n}; missed {n}; starts without end {n}; ambiguous {n}; longest gap {h}; 14d canary {PASS/FAIL/PENDING}.
Renewals, all recorded failed invoices: unique {n}; attempts {n, lower bound if unknown}; recovered {n}; cancelled/expired {n}; unresolved {n}; unknown-attempt invoices/unkeyed deliveries {n/n}.
Incidents open now: critical {n}; high {n}; medium {n}; low {n}.
Owner decision 1: {concrete action or NONE} — yes/no; evidence {query/plan reference}; estimated owner minutes {n}.
Owner decision 2: {concrete action or NONE} — yes/no; evidence {query/plan reference}; estimated owner minutes {n}.
Owner decision 3: {concrete action or NONE} — yes/no; evidence {query/plan reference}; estimated owner minutes {n}.
Owner minutes this week: {estimate total}; packet 5 + decisions up to 5 + refunds/approvals 2–5 + partner outreach 5–10 = 17–25 baseline; actual {measured minutes or UNKNOWN}.
```

For line 1's LS fees, run `node scripts/ls-fees.mjs` ([script catalogue](../../scripts/README.md#checks)): read-only Lemon Squeezy API aggregates; while it reports "fee not exposed by the API", LS fees stay UNKNOWN.

[monday-packet.sql](monday-packet.sql) supplies line 1 from A, line 2 from B, line 3 from C, line 4 from D, and line 5 from E. For C, sum daily expected/seen cycles and unmatched/ambiguous counts once per role/day; its window totals and gap values repeat across rows, so read them once. For D, sum the three outcome rows, but read the repeated unkeyed-deliveries count once. Lines 6–8 are at most three yes/no decisions drafted by the controller from those results and the [five moves and release gate](../strategy/million-plan-2026-10.md); use NONE for unused slots. Line 9 is a controller estimate using that plan's owner-time budget and separately recorded actual minutes; no query measures owner time.

The packet holds counts and sums only, with fixed labels, status/unknown flags and operational timing; never customer text or personal data. No emails, names, user/order/invoice IDs, heartbeat notes, incident details or raw payloads belong in it. Decisions describe actions without customer details and authorize nothing until the owner answers.

A reports payment contribution after VAT/refunds/LS fees, before AI cost, CAC and overheads; it cannot establish operating profit. Known VAT/fee/refund sums are partial whenever their UNKNOWN flag is true; zero without complete coverage is not evidence of zero cost. UNKNOWN currency is unreconciled. B measures purchase/refund/access counts, not visitor conversion, exam outcomes or the Pro window. Resolve the SQL's `-- VERIFY:` assumptions before treating these figures as verified accounts.

The timing rule is at most one missed scheduled cycle and recovery within 24 hours; C also fails a timing check on unmatched starts or ambiguous phases. Its seven-day result is only a weekly check. Full PASS requires 14 complete v5 days, the 14-day check passing, and independently evidenced deliberate session loss (set the query's attestation only after that evidence exists); otherwise the canary remains PENDING. The longest heartbeat-start gap, including silent window edges, is a recovery proxy, not proof of session restoration. Before-v5 rows are visible comparisons, not evidence of v5 operation. A timing PASS does not clear the plan's legal/release gate or prove its separate authorization and owner-time conditions. If the canary fails, repair the executor and add no roles.

Margin per sale: [margin-per-sale.sql](margin-per-sale.sql). Statement 1 lists one row per sale (course purchase or subscription invoice) with gross, net VAT, net Lemon Squeezy fee, refund, first-touch source/channel (NULL is untracked, never direct) and contribution before AI and channel cost; statement 2 sums it per source, channel, product and currency. AI cost over the 90 days after each sale and channel cost stay NULL with their unknown flags until `public.ai_usage` and a spend record exist, so full contribution is not yet measurable. It shares section A's money rules and `-- VERIFY:` assumptions, holds no personal data, and its per-sale rows stay out of the nine-line packet.
