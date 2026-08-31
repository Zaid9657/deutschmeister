# Database migrations

SQL in this folder is **never applied automatically** — there is no migration
runner in the build. Apply each file by hand in the Supabase SQL editor
(Dashboard → SQL Editor → New query → paste → Run), in filename order.

## Files

| File | What it does | Status |
|---|---|---|
| `2026-08-16-fix-rls-security.sql` | Closes the self-grant-Pro RLS hole on `subscriptions`/`profiles`, locks down `webhook_logs` and `xray_usage`, narrows anonymous access to paid reading/listening content to the free tier (a1.1). | ✅ **Applied 2026-08-16** |
| `2026-08-16-enable-rls-on-unprotected-tables.sql` | Enables RLS on 13 tables that had it switched off entirely (the whole course catalogue was publicly deletable via the anon key), and revokes public EXECUTE on `debit_speaking_wallet`. | ✅ **Applied 2026-08-16** |
| `2026-08-16-content-cleanup.sql` | De-CAPS of 270 shouting `grammar_rules` rows (892 edits, correct German orthography restored); `related_slugs` populated for all 64 topics; documents the dead `grammar_introductions` table (commented DROP, owner's call). | ✅ **Applied 2026-08-16** |
| `2026-08-16-reading-lessons.md` (note) | 22 new reading lessons inserted (every level now ≥8) — source of truth lives in `content/reading/*.json` in the repo; re-seed with `scripts/seed-reading-lessons.mjs`. | ✅ **Applied 2026-08-16** |
| `2026-08-16-welcome-email-webhook.sql` | Wires the never-called `send-welcome-email` function: `pg_net` + an `AFTER INSERT` trigger on `auth.users` POSTing to the Netlify function with the `WEBHOOK_SECRET` bearer. The repo copy redacts the secret — the live function body embeds it (rotate both together). | ✅ **Applied 2026-08-16** |
| `2026-08-17-audit-remediation.sql` | Remediates `AUDIT-2026-08-16.md`: drops the PUBLIC/ALL policy on `speaking_usage` and the client write policies on the other speaking tables; allows `'placement'` in `speaking_sessions_level_check` (restoring the level test); dedupes b1.2 reading lessons and `payment_failures` (+ unique indexes); reconciles `profiles.is_subscribed`; reshuffles the skewed answer-option positions; adds `xray_usage.ip_hash` for per-IP metering. | ✅ **Applied 2026-08-17** |
| `2026-08-17-speaking-missions.md` (note) | 56 speaking missions inserted for A1.2–B2.2 (the table previously held only A1.1, so 7 of 8 levels showed an empty Speaking tab). Data-only; ordering column is `mission_order`. | ✅ **Applied 2026-08-17** |
| `2026-08-17-content-backfill.md` (note) | Six data migrations: `acceptable_answers` for all 433 fill-blanks (only 7 have real variants; `[]` would have broken every one — see the note), plurals resolved for 101 nouns (98 are mass nouns marked `'null'`), 47 duplicate vocabulary rows removed, reading-lesson CRLF/plural-marker/`word_count`/`estimated_reading_time` hygiene, `prerequisite_slugs` for 60 topics, and 3 unanswerable exercises rewritten. | ✅ **Applied 2026-08-17** |
| `2026-08-17-lifecycle-and-listening.sql` | `lifecycle_emails` ledger for the new trial lifecycle job (UNIQUE(user_id, kind) is what makes the daily cron safe to re-run); adds the `answers`/`plays_used` columns the SPA has always written to `user_listening_progress`, so listening completions finally persist and can feed the streak; consolidates that table's overlapping policies; and records the 64-title restore. | ✅ **Applied 2026-08-17** |
| `2026-08-17-narrow-anon-content.sql` | Closes audit A-09: `words`, `sentences` and `paragraphs` were fully readable with the anon key that ships in the SPA bundle. Anon now sees only the a1.1 free tier; authenticated keeps full read. `podcasts` deliberately untouched (the public RSS feed uses the anon key). Also fills the last 3 empty `prerequisite_slugs`. | ✅ **Applied 2026-08-17** |
| `2026-08-22-activation-lifecycle.sql` | Widens the `lifecycle_emails` kind CHECK for the activation sequence (`activation_d1`/`activation_d4`) and creates the service-role-only `lifecycle_customer_state` funnel view. The mailer no-ops until this is applied AND `LIFECYCLE_ACTIVATION_ENABLED=true`. (Row added 2026-08-31 — this file was missing from the ledger.) | ⏳ **Pending — owner** |
| `2026-08-31-purchases.sql` | One-time product purchases (course entitlements) for the telc B1 Komplettvorbereitung: widens `subscriptions.plan_type` to admit `'course'` (the included Pro window — without this the webhook fails AFTER money moved), creates `purchases` (read-own RLS, service-role writes, UNIQUE on the LS order id for webhook idempotency) and `program_progress` (own-rows checkboxes). Guarded by `tests/purchases.test.mjs`. | ⏳ **Pending — owner must apply before the course goes on sale** |

Every file above records a change that is **already live** on project
`omqyueddktqeyrrqvnyq`. They are idempotent, so re-running one is safe and is how you
would reproduce the same state on a branch or fresh database — with one exception, called
out in its own header: the answer-option reshuffle in `2026-08-17-audit-remediation.sql`
picks new positions each run (meaning is preserved; positions are not).

## Conventions

- Name new files `YYYY-MM-DD-short-description.sql`.
- Make every statement idempotent (`DROP POLICY IF EXISTS`, `CREATE OR REPLACE`,
  `ADD COLUMN IF NOT EXISTS`) so a file can be re-run safely.
- Put a header comment in each file: what it fixes, how to test, how to roll back.

## Legacy SQL at the repo root

The eleven `*.sql` files at the repo root (`supabase-grammar-schema.sql`,
`fix-*.sql`, `create-*.sql`, …) are **historical**: they were run by hand at
various points and represent how the current database state was reached. They
are kept for reference — do not re-run them blindly (some contain one-off data
fixes with hardcoded UUIDs). New schema changes belong here in `migrations/`.

## After applying a migration

Re-test the critical paths as both an anonymous visitor and a logged-in user:

1. Signup / login / onboarding (profiles INSERT still works).
2. A Lemon Squeezy test purchase or webhook replay (subscriptions written via
   service role).
3. Grammar pages while logged out (Astro build + free tier need anon SELECT).
4. Reading/listening a1.1 while logged out; higher levels while logged in.
5. Sentence X-Ray as anonymous and logged-in user.
