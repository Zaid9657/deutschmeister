-- Admin panel, phase 3 (Product & Growth) — docs/admin-panel.md.
--
-- Three additive changes, each with a default chosen so that NOTHING a
-- learner sees changes the moment it runs:
--
--   1. Content lifecycle on the six content tables the CMS governs. The
--      column defaults to 'published' because every existing row IS
--      published; 'draft' would hide the library on deploy and NULL would make
--      "unknown" the normal case. Rows already flagged unpublished (the
--      boolean columns that exist today) become 'hidden'. `last_reviewed_at`
--      stays NULL = never reviewed — it is NOT backfilled from updated_at;
--      "never" and "reviewed at an unknown time" are different facts.
--   2. Coupons: the governance record around a Lemon Squeezy discount
--      (the discount itself lives in LS; a row here cannot make a hosted
--      checkout cheaper) plus the redemption ledger written by the paid
--      branch of the order webhook, idempotent on (coupon_id, order_id).
--   3. Indexes for the usage analytics.
--
-- How to test after applying:
--   SELECT lifecycle_status, count(*) FROM public.grammar_topics GROUP BY 1;   -- published 84 (or hidden for is_published=false)
--   SELECT count(*) FROM public.coupons;                                        -- 0
-- Rollback: DROP TABLE coupon_redemptions, coupons; ALTER TABLE <each> DROP COLUMN lifecycle_status, owner_id,
--   reviewer_id, last_reviewed_at, next_review_at, archived_at; drop the three indexes.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['grammar_topics', 'reading_lessons', 'listening_exercises', 'podcasts', 'speaking_missions', 'video_library']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT ''published''', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users (id) ON DELETE SET NULL', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES auth.users (id) ON DELETE SET NULL', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS next_review_at timestamptz', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS archived_at timestamptz', t);
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = t || '_lifecycle_status_check') THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (lifecycle_status IN (''draft'', ''in_review'', ''published'', ''hidden'', ''archived''))', t, t || '_lifecycle_status_check');
    END IF;
  END LOOP;
END $$;

-- Rows the existing boolean already hides are 'hidden' in the lifecycle, so
-- the two never disagree on day one.
UPDATE public.grammar_topics    SET lifecycle_status = 'hidden' WHERE is_published = false AND lifecycle_status = 'published';
UPDATE public.podcasts          SET lifecycle_status = 'hidden' WHERE is_published = false AND lifecycle_status = 'published';
UPDATE public.speaking_missions SET lifecycle_status = 'hidden' WHERE is_published = false AND lifecycle_status = 'published';
UPDATE public.video_library     SET lifecycle_status = 'hidden' WHERE published = false AND lifecycle_status = 'published';

-- ----------------------------------------------------------------------------
-- Coupons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,                  -- as entered, for display
  normalized_code text NOT NULL,       -- trimmed + upper-cased; uniqueness is enforced on THIS
  internal_name text NOT NULL,
  public_label text,

  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),   -- percent 1–100, or MINOR UNITS
  currency text NOT NULL DEFAULT 'EUR',

  -- 'expired' and 'exhausted' are DERIVED, never stored.
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  total_limit integer CHECK (total_limit IS NULL OR total_limit > 0),
  per_user_limit integer CHECK (per_user_limit IS NULL OR per_user_limit > 0),
  stackable boolean NOT NULL DEFAULT false,
  new_customer_only boolean NOT NULL DEFAULT false,
  minimum_order_amount integer CHECK (minimum_order_amount IS NULL OR minimum_order_amount >= 0),

  -- REAL Lemon Squeezy variant IDs. Empty = every product.
  applicable_variant_ids text[] NOT NULL DEFAULT '{}',

  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,

  CONSTRAINT coupons_period_valid  CHECK (ends_at IS NULL OR ends_at > starts_at),
  CONSTRAINT coupons_percent_range CHECK (discount_type <> 'percent' OR discount_value <= 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_normalized_code ON public.coupons (normalized_code);

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons (id),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  user_email text,

  order_id text NOT NULL,
  variant_id text,

  -- Snapshot in minor units, taken at redemption. The coupon may later be
  -- edited or archived; what the customer actually paid must not change.
  original_amount integer, discount_amount integer, final_amount integer,
  currency text NOT NULL DEFAULT 'EUR',

  payment_status text NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'refunded')),
  refund_adjusted_at timestamptz,
  refund_adjusted_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT coupon_redemptions_unique_order UNIQUE (coupon_id, order_id)
);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON public.coupon_redemptions (coupon_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user   ON public.coupon_redemptions (user_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
-- no policies on purpose: service-role only, reached through the capability-gated functions

-- ----------------------------------------------------------------------------
-- Usage analytics indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_speaking_sessions_created ON public.speaking_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speaking_evaluations_token ON public.speaking_evaluations (session_token);
CREATE INDEX IF NOT EXISTS idx_user_grammar_progress_topic ON public.user_grammar_progress (topic_id);
