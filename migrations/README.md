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

Both files record changes that are **already live** on project `omqyueddktqeyrrqvnyq`.
They are idempotent, so re-running them is safe and is how you would reproduce the same
state on a branch or fresh database.

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
