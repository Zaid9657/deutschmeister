-- One-time product purchases (course entitlements) + program progress.
--
-- What it enables: the "telc B1 Komplettvorbereitung" one-time offer
-- (docs/revenue-plan-2026-08-31.md, Lane 2). The Lemon Squeezy webhook writes a
-- `purchases` row per one-time order (idempotent on the LS order id) and, when
-- the buyer has no live subscription, grants an included Pro window by writing
-- the user's `subscriptions` row with plan_type 'course' — which the current
-- CHECK constraint would reject, so it is widened here FIRST. (Same failure
-- class as the 'placement' level check that 500'd every level-test speaking
-- session: an unmigrated CHECK makes the webhook fail at runtime, after money
-- moved.)
--
-- How to test after applying:
--   1. INSERT a purchases row as service role → ok; as authenticated → RLS error.
--   2. SELECT own purchases as the buyer → row visible; another user's → empty.
--   3. UPDATE public.subscriptions SET plan_type = 'course' WHERE false; → no
--      constraint error at parse time, and a real course upsert succeeds.
--   4. program_progress: insert/select/delete own rows as authenticated → ok;
--      another user's row → blocked.
--
-- Rollback: DROP TABLE public.program_progress; DROP TABLE public.purchases;
-- and restore the previous plan_type constraint if no 'course' rows exist.

-- 1. Widen plan_type so the included-Pro-window row is representable.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check
  CHECK (plan_type IN ('monthly', 'yearly', 'quarterly', 'course'));

-- 2. Purchases: one row per Lemon Squeezy one-time order.
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_key text NOT NULL,
  lemonsqueezy_order_id text NOT NULL UNIQUE,
  price_paid numeric,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'refunded')),
  -- Governs only the included Pro window; the course area itself is lifetime.
  access_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON public.purchases (user_id);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
-- Read own rows; NO client write policies — purchases are written by the
-- webhook via the service role only, same doctrine as subscriptions.
DROP POLICY IF EXISTS "Users can read own purchases" ON public.purchases;
CREATE POLICY "Users can read own purchases" ON public.purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Program progress: per-user checkboxes over a program's day items.
CREATE TABLE IF NOT EXISTS public.program_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_key text NOT NULL,
  item_id text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, program_key, item_id)
);

ALTER TABLE public.program_progress ENABLE ROW LEVEL SECURITY;
-- Own rows, all three paths, WITH CHECK on every write path (the missing
-- WITH CHECK on an UPDATE policy is a documented past bug in this schema).
DROP POLICY IF EXISTS "Users can read own program progress" ON public.program_progress;
CREATE POLICY "Users can read own program progress" ON public.program_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own program progress" ON public.program_progress;
CREATE POLICY "Users can insert own program progress" ON public.program_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own program progress" ON public.program_progress;
CREATE POLICY "Users can delete own program progress" ON public.program_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
