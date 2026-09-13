# Admin panel — deutsch-meister.de

The operator panel at `/admin/*`, built from the four-part MedMeister replication spec
(REPLICATION_01–04, 2026-09-13). Parts 1–3 are behaviour; Part 4 is what it looks like.
This file holds the **parameterisation contract** the spec requires to be filled in before a
line of code, the decisions that adapt it to this stack, the per-phase status, and the
register of what could not be measured.

## Stack mapping

| Reference | Here |
| --- | --- |
| Expo/React Native Web static export | Vite + React 18 SPA (`src/pages/admin/`, `src/components/admin/`) — Part 1 §10.2–§10.6 do not apply; §10.1 and §10.7 do |
| Netlify Functions + Supabase service role | Same. Every `netlify/functions/admin-*.mjs` uses `_shared/adminHttp.mjs` (`adminEndpoint`) |
| `public.users.role` | `public.profiles.role` (text, CHECK, frozen by the privileged-column trigger) |
| PostgREST joins | Same limitation: batched `IN (ids)` queries, explicit paging + exact counts (`fetchAll`, `exactCount`) |
| Lemon Squeezy hosted checkout | Same — coupons are a governance record (Part 3 §4) |

## Parameterisation contract (Part 1 §3)

| Token | Value | Source |
| --- | --- | --- |
| `PRODUCT_NAME` | Deutsch Meister | — |
| `TRACKS` | the 8 CEFR sub-levels `a1.1 … b2.2` | `_shared/adminLevels.mjs` `LEVELS` |
| `TRACK_LABELS` | `A1.1 … B2.2` (uppercase display, lowercase value) | `LEVEL_LABELS` |
| `TRACK_COLUMN_BY_TABLE` | **uppercase** in `grammar_topics.sub_level`, `listening_exercises`, `speaking_*`, `podcasts.sub_level`; **lowercase** in `reading_lessons`, `lesson_progress`, `lesson_attempts`, `words`, `sentences`, `paragraphs`; band-only lowercase in `user_progress`; **mixed** in `profiles.current_level` (1,594 rows carry the legacy default `a1`) | measured 2026-09-13, pinned by `tests/admin-levels.test.mjs` |
| `TRACK_UNKNOWN_LABEL` | `unbekannt` — a selectable filter value, never an excluded row | `LEVEL_UNKNOWN` |
| `SESSION_ENTITY` | a counted usage event: a grammar topic progress row, a completed listening/reading item, a completed speaking session, a course Lektion (`lesson_progress`) | Part 2 cockpit definition line |
| `CONTENT_ENTITY` | grammar topics, reading lessons, listening exercises, podcasts, speaking missions, videos | Part 3 CMS |
| `CURRENCY` / `LOCALE` | EUR / de-DE; USD appears in one Lemon Squeezy order and is summed separately | `adminFormat.js` |
| `MONEY_UNIT` | integer minor units. `subscriptions.price_paid` and `purchases.price_paid` are DECIMAL euros in the DB — converted at the boundary, never summed as floats | Part 2 §1.2 |
| `BILLABLE_THRESHOLD_SECONDS` | n/a — speaking sessions are counted by `speaking_usage` rows (one per started session), not by a duration threshold. The cockpit says "gestartet", never "abgeschlossen" | `_shared/speakingUsage.mjs` |
| `TIERS` | `profiles.subscription_tier`: `free`, `pro`, `premium`; plans `monthly`, `yearly`, `course` | `src/data/pricing.js` |
| `ACTIVE_SUB_STATUSES` | `active`, `on_trial`, `past_due` — but the access gate reads `subscription_end > now()`, not status | `_shared/adminOpsLib.mjs` |
| failed payment | `status IN ('past_due','unpaid')` — ONE function, `isFailedPayment` | `_shared/adminOpsLib.mjs` |
| `VARIANT_IDS` | numeric LS variant ids from the `LEMONSQUEEZY_*_VARIANT_ID` env vars (functions scope) | `lemonsqueezy-webhook.mjs` |
| `MAX_GRANT` | 365 Pro-Tage per grant | Part 2 actions |
| `ENTITLEMENT_FIELD_RULE` | content access → latest `subscriptions.subscription_end` ∨ `purchases` ∨ `profiles.trial_ends_at` ∨ free level; quota tier → `profiles.subscription_tier`/`is_subscribed` | `gateReads()` in `adminOpsLib.mjs` |
| `SLA_HOURS` | `{ urgent: 4, high: 12, normal: 48, low: 120 }` calendar hours | Part 2 support |
| `THRESHOLDS` | dbLatencyMs 2000/5000 · webhookFailures24h 1/5 · jobStaleHours per job (daily jobs 30/54, weekly 8·24/9·24) · emailBounceRate 0.10/0.25 | Part 3 status |
| `ROLES` | `admin`, `support`, `finance`, `auditor`, `content` | `_shared/adminRbacLib.mjs` |
| `AUTH` | Supabase JWT in `Authorization: Bearer`, verified by `_shared/auth.mjs` | — |
| copy | German, Sie. Stored values are English snake_case | — |

## Permissions

Capabilities, not roles: `_shared/adminRbacLib.mjs` is the matrix, `requireCapability` in
`_shared/adminRbac.mjs` is the gate (JWT → role from **profiles** → capability → 403 with a
`denied.*` audit row). `admin` is a superset, not a wildcard. The client renders the
capabilities every response echoes; hiding a button is not authorisation. `usage.*` is this
product's name for the reference's `simulations.*` (`usage.transcripts` stays separate: a
speaking transcript is a learner's own words). The seeded admins are the two accounts in
`src/config/admins.js`; any other role is a one-column update on `profiles.role` through the
service role (the trigger freezes it for everyone else).

## The record

`public.admin_audit_log` (migration `2026-09-13-admin-panel-foundation.sql`): actor never
nullable, `before`/`after` redacted in the writer (`redact()` keeps keys, replaces values),
`idempotency_key UNIQUE`, `UPDATE`/`DELETE`/`TRUNCATE` revoked, RLS on with no policy. What is
audited: every mutation (with a required reason for anything sensitive), denied capability
attempts, transcript reads, exports.

## Transport

`src/lib/admin/adminFetch.js` is the only module under `src/` that attaches a token to an
`admin-*` call; `tests/admin-fetch.test.mjs` scans the admin tree for any other. One refresh,
one retry, 403 left alone, one expiry banner at shell level.

## Design laws (Part 1 §4) as they apply here

Three states (`—` = query failed, `Nicht instrumentiert` = no source, `0` = zero); a rate needs a
denominator (`rate()` returns `null`); every number carries its definition (`Stat.definition`);
publish the population; name the time class (`Stat.timeClass`, `examFilterApplies` in every
cockpit payload); a filter is wired only when the metric's query uses it; name a metric after
what it measures (`_shared/adminMetricNames.mjs` ⟷ `src/data/adminMetrics.js`, drift-tested);
never classify from display text.

## Phase status

| Phase | Status | What shipped |
| --- | --- | --- |
| 1 Foundation | ✅ 2026-09-13 | `profiles.role` + trigger, `admin_audit_log`, pg_trgm indexes; `adminRbacLib/adminRbac/adminHttp/adminLevels/adminOpsLib`; `admin-session`; `adminFetchCore/adminFetch/adminFormat`; `adminUi` kit, `AdminShell`, `AdminSidebar`, filter context; `/admin/*` router with every route resolving; `/admin` rewrite; tests `admin-rbac`, `admin-fetch`, `admin-format`, `admin-levels` |
| 2 Operations | ✅ 2026-09-13 | `admin-metrics` (one clock, five `safe()` groups, revenue reconstructed from `webhook_logs`, honest funnel + coverage waterfall, `levelFilterApplies/Excluded`), `admin-directory` (server predicates, post-filters with inexact totals, saved views with rules, CSV behind `export`), `admin-user360` (eight panels, `gateReads`, masked ids, no transcripts), `admin-actions` (8 audited actions, zero provider mutations), `admin-ops` (discrepancy + failed-payment queues on `isFailedPayment`), `admin-support` + `support-ticket-create` + the Profil support form (migration `2026-09-13-admin-panel-operations.sql`), `admin-audit`; screens for all six; `tests/admin-ops.test.mjs` |
| 3 Product & Growth | ✅ 2026-09-13 | `admin-usage` (speaking_sessions as the denominator, status read not derived, nearest-rank durations, failure classes, fingerprinted error groups, second-session-within-7-days with `tooRecent`, audited transcript reads), `admin-content` (lifecycle over six tables with `archived → published` absent, boolean flags mirrored where they exist, review `never` ≠ `due`, prerequisite-graph validation bounded at 64), `admin-marketing` (attribution honestly *not instrumented*; real lifecycle/signup signals), `admin-coupons` + `coupon-validate` + the webhook ledger + the learner `CouponField` (migration `2026-09-13-admin-panel-product.sql`), `admin-reports` (six reports composed from `_shared/adminCockpit.mjs`, drill-down routes, CSV behind `export`, no PDF), `admin-status` (derived states with printed thresholds, `unknown` never outranks), `admin-settings` (empty allow-list stated, matrix from enforcement, `configured` booleans only); screens for all seven; `tests/admin-product.test.mjs` |
| 4 UI reference | pending | visual QA against Part 4 |

## Register of what could not be measured

Filled in as each phase lands. At phase 1:

| Gap | Status |
| --- | --- |
| Acquisition attribution | no source column exists on `profiles`; nothing captures UTM/referrer |
| Course Lektion usage | `lesson_progress` / `lesson_attempts` hold 0 rows (the A1.1 engine is live but has no learners yet) |
| Speaking "counted" usage | there is no duration threshold; a session counts when it is started (`speaking_usage`), so the cockpit says *gestartet* and *abgeschlossen*, never *gezählt ab N Sek.* |
| Refunds | `order_refunded` is handled by the webhook on `purchases`; the revenue reconstruction subtracts `refunded_amount` from the order payload only when Lemon Squeezy re-sends the order — partial refunds after the fact are not visible in `webhook_logs` |
| Login activity | `audit_logs` is written client-side (`src/lib/auditLogger.js`), so a blocked or failed insert under-counts logins; the label says *Login-aktiv*, not *aktiv* |
| Reading / listening visibility | `reading_lessons` and `listening_exercises` have no published flag and every reader shows every row; the CMS lifecycle on them is administrative only — the screen says so. Unblock: add `is_published` and filter in `readingService.js` / `useListening.js` |
| Email deliverability | Resend events are not stored; no bounce rate. Unblock: a Resend webhook into a table |
| AI call errors | speaking/writing/X-Ray failures live only in Netlify logs. Unblock: a per-call error ledger |
| Client timing | not instrumented; the status page says so rather than inventing a load time |
| Scheduled-job evidence | a daily job leaves a trace only when someone was due that day — a quiet day looks like a missed run; the check says so. Unblock: a run ledger (last start per job) |
| Coupon ↔ Lemon Squeezy | the panel records rules and redemptions; the discount must exist identically in LS (dashboard-only). No LS API call is made anywhere in the panel |
| Roles | five defined and enforced; only `admin` assigned to real people (the two owner accounts) |

## Acceptance checklist (Part 3 §9), as verified 2026-09-13

**Numbers** — every metric group is `safe()`-wrapped (`{ error }` renders an error line, never `0`); formatters print `—` for absence and `0` for zero; `rate()` returns `null` on an empty denominator and `pct()` prints `—`; every `Stat` carries `definition` + `timeClass`; the coverage waterfall publishes `total → eligible → evaluated` and the tests pin both identities; `levelFilterApplies/Excluded` ship in the cockpit and usage payloads; every paged total comes from `exactCount`, and post-filtered totals say `(geschätzt)`; metric names live in one module with a drift test.

**Filters** — verified in the mocked browser run on values (the level chip changes the request body and the payload echoes `appliedFilters`); the casing map is unit-tested per table; `Unbekannt` is a selectable level everywhere; every admin response carries `Cache-Control: no-store`.

**Permissions and record** — every endpoint goes through `adminEndpoint` → `requireCapability` (role from `profiles`); every mutation writes one audit row with before/after and a reason; denials, transcript reads (both outcomes) and exports are audited; `admin_audit_log` has UPDATE/DELETE/TRUNCATE revoked; the source scan bans any other `Authorization` header in the admin tree; 401 → one refresh → one retry, 403 untouched; settings return `configured` booleans only.

**Writes** — every write uses `.select()` and a zero-row check (`conflict`); grants write the field the gate reads (`gateReads` printed on User 360); provider-mutating actions: **none** (stated on the actions panel); money is integer minor units in the panel (DB decimals converted at the boundary); the redemption ledger is idempotent on `(coupon_id, order_id)`.

**Honesty** — every uninstrumented area returns `unknown` with a reason and an unblock step; the status page derives its overall state from the worst real check; every red tile carries an action route; derived states (`ausgeliefert`, `gezählt`, `Login-aktiv`) are labelled with what they derive from.

**Not done in this build** — a live browser walkthrough against production (the sandbox cannot reach `deutsch-meister.de`); the screens were verified against mocked payloads shaped from the endpoint code. First live login should be treated as the acceptance run.
