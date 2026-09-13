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
| 2 Operations | pending | cockpit, directory, User 360, actions, subscriptions/ops, support, audit trail |
| 3 Product & Growth | pending | usage analytics, content CMS, marketing, coupons, reports, status, settings |
| 4 UI reference | pending | visual QA against Part 4 |

## Register of what could not be measured

Filled in as each phase lands. At phase 1:

| Gap | Status |
| --- | --- |
| Acquisition attribution | no source column exists on `profiles`; nothing captures UTM/referrer |
| Course Lektion usage | `lesson_progress` / `lesson_attempts` hold 0 rows (the A1.1 engine is live but has no learners yet) |
| Roles | five defined and enforced; only `admin` assigned to real people (the two owner accounts) |
